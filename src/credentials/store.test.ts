import {
  chmodSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectEnvironment, setApiKey } from './config'
import {
  InvalidCredentialsFileError,
  KlapCredentialsError,
  SymlinkedCredentialsPathError,
} from './errors'
import { credentialsPath, deleteCredentials, loadCredentials, saveCredentials } from './store'

const BASE_URL = 'https://api.example.com'
const SECRET_TEST_KEY = 'klap_test_SECRETSECRET'
const SECRET_BAD_PREFIX_KEY = 'sk_live_SECRETSECRET'
const SECRET_FRAGMENT = 'SECRETSECRET'

let homeDir: string
let originalHome: string | undefined

beforeEach(async () => {
  homeDir = await mkdtemp(join(tmpdir(), 'klap-cli-credentials-test-'))
  originalHome = process.env.HOME
  process.env.HOME = homeDir
})

afterEach(async () => {
  process.env.HOME = originalHome
  await rm(homeDir, { recursive: true, force: true })
})

function klapDir(): string {
  return join(homeDir, '.klap')
}

function writeRawConfig(contents: string): void {
  mkdirSync(klapDir(), { recursive: true })
  writeFileSync(join(klapDir(), 'config.json'), contents)
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (err) {
    return err
  }
  throw new Error('expected the promise to reject')
}

function captureThrow(fn: () => unknown): unknown {
  try {
    fn()
  } catch (err) {
    return err
  }
  throw new Error('expected the function to throw')
}

describe('credentialsPath', () => {
  it('resolves against the current HOME at call time, not at import time', () => {
    expect(credentialsPath()).toBe(join(homeDir, '.klap', 'config.json'))
  })
})

describe('saveCredentials / loadCredentials', () => {
  it('writes the directory as 0700 and the file as 0600', async () => {
    await saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } })

    expect(statSync(klapDir()).mode & 0o777).toBe(0o700)
    expect(statSync(join(klapDir(), 'config.json')).mode & 0o777).toBe(0o600)
  })

  it('tightens permissions if the directory/file already existed with looser ones', async () => {
    mkdirSync(klapDir(), { recursive: true, mode: 0o755 })
    chmodSync(klapDir(), 0o755)
    writeFileSync(join(klapDir(), 'config.json'), '{}', { mode: 0o644 })

    await saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_new' } })

    expect(statSync(klapDir()).mode & 0o777).toBe(0o700)
    expect(statSync(join(klapDir(), 'config.json')).mode & 0o777).toBe(0o600)
  })

  it('leaves no temp files behind after a successful write', async () => {
    await saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } })
    await saveCredentials({ baseUrl: BASE_URL, apiKeys: { live: 'klap_live_abc' } })

    expect(readdirSync(klapDir())).toEqual(['config.json'])
  })

  it('cleans up its temp file when the final rename fails', async () => {
    mkdirSync(join(klapDir(), 'config.json', 'blocker'), { recursive: true })

    await expect(
      saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }),
    ).rejects.toThrow()

    expect(readdirSync(klapDir())).toEqual(['config.json'])
  })

  it('round-trips a saved config', async () => {
    const config = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_xyz', live: 'klap_live_xyz' } }
    await saveCredentials(config)
    expect(await loadCredentials()).toEqual(config)
  })

  it('refuses to save a config whose key is in the wrong slot', async () => {
    await expect(
      saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_live_xyz' } }),
    ).rejects.toThrow(InvalidCredentialsFileError)
    expect(() => statSync(klapDir())).toThrow()
  })

  it('returns null when nothing has been saved', async () => {
    expect(await loadCredentials()).toBeNull()
  })

  it('returns null when ~/.klap exists but config.json does not', async () => {
    mkdirSync(klapDir())
    expect(await loadCredentials()).toBeNull()
  })

  it('throws InvalidCredentialsFileError for an unrelated JSON shape', async () => {
    writeRawConfig(JSON.stringify({ foo: 'bar' }))
    await expect(loadCredentials()).rejects.toThrow(InvalidCredentialsFileError)
  })

  it('throws InvalidCredentialsFileError for corrupted JSON', async () => {
    writeRawConfig('{"baseUrl": "https://api.example.com", "apiKeys": {')
    await expect(loadCredentials()).rejects.toThrow(InvalidCredentialsFileError)
  })

  it('throws InvalidCredentialsFileError when a slot holds the other environment’s key', async () => {
    writeRawConfig(JSON.stringify({ baseUrl: BASE_URL, apiKeys: { test: 'klap_live_abc' } }))
    await expect(loadCredentials()).rejects.toThrow(InvalidCredentialsFileError)
  })

  it('throws InvalidCredentialsFileError when config.json is a directory', async () => {
    mkdirSync(join(klapDir(), 'config.json'), { recursive: true })
    await expect(loadCredentials()).rejects.toThrow(InvalidCredentialsFileError)
  })

  it('transparently migrates the legacy single-key shape', async () => {
    writeRawConfig(JSON.stringify({ apiKey: 'klap_live_legacy123', baseUrl: BASE_URL }))
    expect(await loadCredentials()).toEqual({
      baseUrl: BASE_URL,
      apiKeys: { live: 'klap_live_legacy123' },
    })
  })
})

describe('symlink refusal', () => {
  it('refuses to load when ~/.klap is a symlink', async () => {
    const realDir = join(homeDir, 'elsewhere')
    mkdirSync(realDir)
    writeFileSync(
      join(realDir, 'config.json'),
      JSON.stringify({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }),
    )
    symlinkSync(realDir, klapDir())

    await expect(loadCredentials()).rejects.toThrow(SymlinkedCredentialsPathError)
  })

  it('refuses to save through a symlinked ~/.klap and writes nothing at its target', async () => {
    const realDir = join(homeDir, 'elsewhere')
    mkdirSync(realDir, { mode: 0o755 })
    chmodSync(realDir, 0o755)
    symlinkSync(realDir, klapDir())

    await expect(
      saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }),
    ).rejects.toThrow(SymlinkedCredentialsPathError)
    expect(readdirSync(realDir)).toEqual([])
    expect(statSync(realDir).mode & 0o777).toBe(0o755)
  })

  it('refuses to load when config.json is a symlink', async () => {
    const target = join(homeDir, 'target.json')
    writeFileSync(target, JSON.stringify({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_a' } }))
    mkdirSync(klapDir())
    symlinkSync(target, join(klapDir(), 'config.json'))

    await expect(loadCredentials()).rejects.toThrow(SymlinkedCredentialsPathError)
  })

  it('refuses to save over a symlinked config.json and leaves its target untouched', async () => {
    const target = join(homeDir, 'target.json')
    writeFileSync(target, 'original')
    mkdirSync(klapDir())
    symlinkSync(target, join(klapDir(), 'config.json'))

    await expect(
      saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }),
    ).rejects.toThrow(SymlinkedCredentialsPathError)
    expect(readFileSync(target, 'utf8')).toBe('original')
  })

  it('refuses to delete through a symlinked ~/.klap', async () => {
    const realDir = join(homeDir, 'elsewhere')
    mkdirSync(realDir)
    writeFileSync(join(realDir, 'config.json'), 'keep me')
    symlinkSync(realDir, klapDir())

    await expect(deleteCredentials()).rejects.toThrow(SymlinkedCredentialsPathError)
    expect(readFileSync(join(realDir, 'config.json'), 'utf8')).toBe('keep me')
  })
})

describe('deleteCredentials', () => {
  it('removes the config file entirely', async () => {
    await saveCredentials({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } })
    await deleteCredentials()
    expect(await loadCredentials()).toBeNull()
  })

  it('is a no-op when no config exists', async () => {
    await expect(deleteCredentials()).resolves.toBeUndefined()
  })
})

describe('no key material in errors', () => {
  function expectNoSecret(err: unknown): void {
    expect(err).toBeInstanceOf(KlapCredentialsError)
    if (!(err instanceof Error)) return
    expect(err.message).not.toContain(SECRET_FRAGMENT)
    expect(err.stack ?? '').not.toContain(SECRET_FRAGMENT)
    expect(err.cause).toBeUndefined()
    expect(JSON.stringify({ ...err })).not.toContain(SECRET_FRAGMENT)
  }

  it('detectEnvironment with a bad prefix', () => {
    expectNoSecret(captureThrow(() => detectEnvironment(SECRET_BAD_PREFIX_KEY)))
  })

  it('setApiKey with a bad prefix', () => {
    expectNoSecret(captureThrow(() => setApiKey(null, BASE_URL, SECRET_BAD_PREFIX_KEY)))
  })

  // V8's JSON.parse SyntaxError quotes the input, so a bare key in the file would leak via a
  // wrapped message or `cause` — this is the case that actually catches that.
  it('loading a non-JSON file that is just a key', async () => {
    writeRawConfig(SECRET_TEST_KEY)
    expectNoSecret(await captureRejection(loadCredentials()))
  })

  it('loading a file with a key in the wrong slot', async () => {
    writeRawConfig(JSON.stringify({ baseUrl: BASE_URL, apiKeys: { live: SECRET_TEST_KEY } }))
    expectNoSecret(await captureRejection(loadCredentials()))
  })

  it('loading a legacy file with a bad prefix', async () => {
    writeRawConfig(JSON.stringify({ apiKey: SECRET_BAD_PREFIX_KEY, baseUrl: BASE_URL }))
    expectNoSecret(await captureRejection(loadCredentials()))
  })

  it('saving a config with a key in the wrong slot', async () => {
    expectNoSecret(
      await captureRejection(
        saveCredentials({ baseUrl: BASE_URL, apiKeys: { live: SECRET_TEST_KEY } }),
      ),
    )
  })
})
