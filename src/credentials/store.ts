import { randomBytes } from 'node:crypto'
import { constants, type Stats } from 'node:fs'
import { type FileHandle, chmod, lstat, mkdir, open, rename, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { type KlapCredentialsConfig, parseCredentialsConfig } from './config'
import { InvalidCredentialsFileError, SymlinkedCredentialsPathError } from './errors'

export const CREDENTIALS_DISPLAY_PATH = '~/.klap/config.json'

const CREDENTIALS_DIR_NAME = '.klap'
const CREDENTIALS_FILE_NAME = 'config.json'
const CREDENTIALS_DIR_MODE = 0o700
const CREDENTIALS_FILE_MODE = 0o600
const TEMP_FILE_SUFFIX_BYTES = 8
const OPEN_NO_FOLLOW = constants.O_NOFOLLOW ?? 0

function credentialsDir(): string {
  return join(homedir(), CREDENTIALS_DIR_NAME)
}

export function credentialsPath(): string {
  return join(credentialsDir(), CREDENTIALS_FILE_NAME)
}

function hasErrnoCode(err: unknown, code: string): boolean {
  return err instanceof Error && 'code' in err && err.code === code
}

async function lstatIfExists(path: string): Promise<Stats | null> {
  try {
    return await lstat(path)
  } catch (err) {
    if (hasErrnoCode(err, 'ENOENT')) return null
    throw err
  }
}

function assertNotSymlink(stats: Stats | null): void {
  if (stats?.isSymbolicLink()) throw new SymlinkedCredentialsPathError()
}

async function openWithoutFollowing(path: string): Promise<FileHandle> {
  try {
    return await open(path, constants.O_RDONLY | OPEN_NO_FOLLOW)
  } catch (err) {
    if (hasErrnoCode(err, 'ELOOP')) throw new SymlinkedCredentialsPathError()
    throw err
  }
}

async function readCredentialsFile(path: string): Promise<string> {
  const handle = await openWithoutFollowing(path)
  try {
    return await handle.readFile('utf8')
  } finally {
    await handle.close()
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    // No `cause` on purpose: V8's SyntaxError message quotes the input, i.e. key material.
    throw new InvalidCredentialsFileError()
  }
}

export async function loadCredentials(): Promise<KlapCredentialsConfig | null> {
  const dirStats = await lstatIfExists(credentialsDir())
  if (!dirStats) return null
  assertNotSymlink(dirStats)
  if (!dirStats.isDirectory()) throw new InvalidCredentialsFileError()

  const path = credentialsPath()
  const fileStats = await lstatIfExists(path)
  if (!fileStats) return null
  assertNotSymlink(fileStats)
  if (!fileStats.isFile()) throw new InvalidCredentialsFileError()

  const config = parseCredentialsConfig(parseJson(await readCredentialsFile(path)))
  if (!config) throw new InvalidCredentialsFileError()
  return config
}

async function ensureCredentialsDir(dir: string): Promise<void> {
  if (!(await lstatIfExists(dir))) {
    await mkdir(dir, { recursive: true, mode: CREDENTIALS_DIR_MODE })
  }
  const stats = await lstat(dir)
  assertNotSymlink(stats)
  if (!stats.isDirectory()) throw new InvalidCredentialsFileError()
  await chmod(dir, CREDENTIALS_DIR_MODE)
}

async function writeAndClose(handle: FileHandle, data: string): Promise<void> {
  try {
    await handle.writeFile(data, 'utf8')
    await handle.chmod(CREDENTIALS_FILE_MODE)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

export async function saveCredentials(config: KlapCredentialsConfig): Promise<void> {
  const validated = parseCredentialsConfig(config)
  if (!validated) throw new InvalidCredentialsFileError()
  const data = `${JSON.stringify(validated, null, 2)}\n`

  const dir = credentialsDir()
  await ensureCredentialsDir(dir)

  const path = credentialsPath()
  assertNotSymlink(await lstatIfExists(path))

  const tempPath = join(
    dir,
    `.${CREDENTIALS_FILE_NAME}.${randomBytes(TEMP_FILE_SUFFIX_BYTES).toString('hex')}.tmp`,
  )
  const handle = await open(tempPath, 'wx', CREDENTIALS_FILE_MODE)
  try {
    await writeAndClose(handle, data)
    await rename(tempPath, path)
  } catch (err) {
    await rm(tempPath, { force: true })
    throw err
  }
}

export async function deleteCredentials(): Promise<void> {
  assertNotSymlink(await lstatIfExists(credentialsDir()))
  await rm(credentialsPath(), { force: true })
}
