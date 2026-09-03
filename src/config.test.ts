import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearApiKey,
  deleteConfig,
  detectEnvironment,
  loadConfig,
  saveConfig,
  setApiKey,
} from './config'

describe('saveConfig / loadConfig', () => {
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

  it('writes the config directory as 0700 and the file as 0600', async () => {
    await saveConfig({ baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_abc' } })

    const dirStat = statSync(join(homeDir, '.klap'))
    const fileStat = statSync(join(homeDir, '.klap', 'config.json'))

    expect(dirStat.mode & 0o777).toBe(0o700)
    expect(fileStat.mode & 0o777).toBe(0o600)
  })

  it('tightens permissions even if the directory/file already existed with looser ones', async () => {
    const dir = join(homeDir, '.klap')
    mkdirSync(dir, { recursive: true, mode: 0o755 })
    writeFileSync(join(dir, 'config.json'), '{}', { mode: 0o644 })

    await saveConfig({ baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_new' } })

    const dirStat = statSync(dir)
    const fileStat = statSync(join(dir, 'config.json'))

    expect(dirStat.mode & 0o777).toBe(0o700)
    expect(fileStat.mode & 0o777).toBe(0o600)
  })

  it('round-trips a saved config through loadConfig', async () => {
    const config = { baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_xyz' } }
    await saveConfig(config)
    const loaded = await loadConfig()
    expect(loaded).toEqual(config)
  })

  it('returns null from loadConfig when nothing has been saved', async () => {
    const loaded = await loadConfig()
    expect(loaded).toBeNull()
  })

  it('returns null for a corrupted/unrelated JSON file instead of trusting its shape', async () => {
    const dir = join(homeDir, '.klap')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'config.json'), JSON.stringify({ foo: 'bar' }))

    expect(await loadConfig()).toBeNull()
  })

  it('transparently migrates the legacy single-key shape', async () => {
    const dir = join(homeDir, '.klap')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'config.json'),
      JSON.stringify({ apiKey: 'klap_live_legacy123', baseUrl: 'https://api.example.com' }),
    )

    const loaded = await loadConfig()
    expect(loaded).toEqual({
      baseUrl: 'https://api.example.com',
      apiKeys: { live: 'klap_live_legacy123' },
    })
  })
})

describe('detectEnvironment', () => {
  it('detects test from the klap_test_ prefix', () => {
    expect(detectEnvironment('klap_test_abc123')).toBe('test')
  })

  it('detects live from the klap_live_ prefix', () => {
    expect(detectEnvironment('klap_live_abc123')).toBe('live')
  })

  it('throws a clear error for a key with neither prefix', () => {
    expect(() => detectEnvironment('sk_live_notklap')).toThrow(/klap_test_|klap_live_/)
  })
})

describe('setApiKey', () => {
  it('creates a fresh config when none exists', () => {
    const config = setApiKey(null, 'https://api.example.com', 'klap_test_abc')
    expect(config).toEqual({
      baseUrl: 'https://api.example.com',
      apiKeys: { test: 'klap_test_abc' },
    })
  })

  it('adds the live key without clobbering an existing test key', () => {
    const existing = { baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_abc' } }
    const updated = setApiKey(existing, 'https://api.example.com', 'klap_live_xyz')
    expect(updated.apiKeys).toEqual({ test: 'klap_test_abc', live: 'klap_live_xyz' })
  })

  it('overwrites the same environment slot on re-login', () => {
    const existing = { baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_old' } }
    const updated = setApiKey(existing, 'https://api.example.com', 'klap_test_new')
    expect(updated.apiKeys).toEqual({ test: 'klap_test_new' })
  })
})

describe('clearApiKey', () => {
  it('removes only the specified environment, keeping the other', () => {
    const config = {
      baseUrl: 'https://api.example.com',
      apiKeys: { test: 'klap_test_abc', live: 'klap_live_xyz' },
    }
    const updated = clearApiKey(config, 'test')
    expect(updated.apiKeys).toEqual({ live: 'klap_live_xyz' })
  })
})

describe('deleteConfig', () => {
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

  it('removes the config file entirely', async () => {
    await saveConfig({ baseUrl: 'https://api.example.com', apiKeys: { test: 'klap_test_abc' } })
    await deleteConfig()
    expect(await loadConfig()).toBeNull()
  })

  it('is a no-op when no config exists', async () => {
    await expect(deleteConfig()).resolves.toBeUndefined()
  })
})
