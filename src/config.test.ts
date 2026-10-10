import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  LOGIN_HINT,
  cliCredentialsMessage,
  deleteConfig,
  detectEnvironment,
  loadConfig,
  parseCliEnvironment,
  rethrowAsCliError,
  saveConfig,
  setApiKey,
} from './config'
import {
  AmbiguousEnvironmentError,
  InvalidApiKeyPrefixError,
  InvalidCredentialsFileError,
  KlapCredentialsError,
  MissingEnvironmentKeyError,
  NoCredentialsError,
  SymlinkedCredentialsPathError,
} from './credentials'

const CORRUPT_MESSAGE =
  '~/.klap/config.json is corrupted or invalid — run `klap logout` to remove it, then pipe your key into `klap login --api-key - --base-url <url>` again.'
const SYMLINK_MESSAGE =
  'Refusing to use ~/.klap/config.json: ~/.klap or the file itself is a symbolic link. Remove the link and pipe your key into `klap login --api-key - --base-url <url>` again to create a real ~/.klap directory.'

describe('cliCredentialsMessage', () => {
  it('maps an ambiguous environment to the --env hint', () => {
    expect(cliCredentialsMessage(new AmbiguousEnvironmentError())).toBe(
      'Both a test and a live key are configured — pass --env test or --env live to choose.',
    )
  })

  it('maps a missing environment key to a login command for that exact environment', () => {
    expect(cliCredentialsMessage(new MissingEnvironmentKeyError('live'))).toBe(
      'No live key configured. Pipe a klap_live_ key into `klap login --api-key - --base-url <url>`.',
    )
    expect(cliCredentialsMessage(new MissingEnvironmentKeyError('test'))).toBe(
      'No test key configured. Pipe a klap_test_ key into `klap login --api-key - --base-url <url>`.',
    )
  })

  it('never suggests putting the key itself on the command line', () => {
    const messages = [
      LOGIN_HINT,
      cliCredentialsMessage(new MissingEnvironmentKeyError('live')),
      cliCredentialsMessage(new MissingEnvironmentKeyError('test')),
      cliCredentialsMessage(new InvalidCredentialsFileError()),
      cliCredentialsMessage(new SymlinkedCredentialsPathError()),
    ]
    for (const message of messages) {
      expect(message).toContain('--api-key - ')
      expect(message).not.toMatch(/--api-key (<key>|klap_)/)
    }
  })

  it('falls back to the login hint for a base-class missing-key error with no environment', () => {
    expect(
      cliCredentialsMessage(new KlapCredentialsError('missing_environment_key', 'no env')),
    ).toBe(LOGIN_HINT)
  })

  it('maps no credentials to the login hint', () => {
    expect(cliCredentialsMessage(new NoCredentialsError())).toBe(LOGIN_HINT)
  })

  it('maps a corrupted file to a logout-then-login fix', () => {
    expect(cliCredentialsMessage(new InvalidCredentialsFileError())).toBe(CORRUPT_MESSAGE)
  })

  it('maps a symlinked store to a replace-the-link fix', () => {
    expect(cliCredentialsMessage(new SymlinkedCredentialsPathError())).toBe(SYMLINK_MESSAGE)
  })

  it('maps a bad prefix without echoing any key material', () => {
    expect(cliCredentialsMessage(new InvalidApiKeyPrefixError())).toBe(
      'API key must start with "klap_test_" or "klap_live_".',
    )
  })
})

describe('rethrowAsCliError', () => {
  it('rethrows a credentials error as a plain Error carrying the CLI message', () => {
    expect(() => rethrowAsCliError(new AmbiguousEnvironmentError())).toThrow(
      expect.objectContaining({ name: 'Error', message: expect.stringContaining('--env test') }),
    )
  })

  it('passes any other error through untouched', () => {
    const original = new TypeError('boom')
    expect(() => rethrowAsCliError(original)).toThrow(original)
  })
})

describe('parseCliEnvironment', () => {
  it('returns undefined when the flag is omitted', () => {
    expect(parseCliEnvironment(undefined)).toBeUndefined()
  })

  it('accepts test and live', () => {
    expect(parseCliEnvironment('test')).toBe('test')
    expect(parseCliEnvironment('live')).toBe('live')
  })

  it('rejects anything else, including a different casing', () => {
    expect(() => parseCliEnvironment('LIVE')).toThrow('--env must be "test" or "live", got "LIVE"')
  })
})

describe('detectEnvironment / setApiKey prefix errors', () => {
  it('never echoes any part of the rejected key', () => {
    expect(() => detectEnvironment('sk_live_notklap_secret')).toThrow(
      'API key must start with "klap_test_" or "klap_live_".',
    )
    expect(() => detectEnvironment('sk_live_notklap_secret')).not.toThrow(/sk_live/)
  })

  it('uses the same wording when login stores a key with the wrong prefix', () => {
    expect(() => setApiKey(null, 'https://api.example.com', 'sk_live_notklap_secret')).toThrow(
      'API key must start with "klap_test_" or "klap_live_".',
    )
  })

  it('detects a valid key without wrapping', () => {
    expect(detectEnvironment('klap_live_abc')).toBe('live')
  })
})

describe('config store errors surface as CLI messages', () => {
  let homeDir: string
  let originalHome: string | undefined

  beforeEach(async () => {
    homeDir = await mkdtemp(join(tmpdir(), 'klap-cli-config-test-'))
    originalHome = process.env.HOME
    process.env.HOME = homeDir
  })

  afterEach(async () => {
    process.env.HOME = originalHome
    await rm(homeDir, { recursive: true, force: true })
  })

  it('reports a corrupted config file instead of treating it as logged out', async () => {
    mkdirSync(join(homeDir, '.klap'), { recursive: true })
    writeFileSync(join(homeDir, '.klap', 'config.json'), '{ not json klap_live_secret')

    await expect(loadConfig()).rejects.toThrow(CORRUPT_MESSAGE)
  })

  it('refuses a symlinked ~/.klap on load, save and delete', async () => {
    const realDir = join(homeDir, 'elsewhere')
    mkdirSync(realDir)
    symlinkSync(realDir, join(homeDir, '.klap'))

    await expect(loadConfig()).rejects.toThrow(SYMLINK_MESSAGE)
    await expect(
      saveConfig({ baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_abc' } }),
    ).rejects.toThrow(SYMLINK_MESSAGE)
    await expect(deleteConfig()).rejects.toThrow(SYMLINK_MESSAGE)
  })

  it('still returns null when nothing is stored yet', async () => {
    expect(await loadConfig()).toBeNull()
  })
})
