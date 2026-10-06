import { describe, expect, it } from 'vitest'
import {
  type KlapCredentialsConfig,
  clearApiKey,
  detectEnvironment,
  parseCredentialsConfig,
  resolveApiKey,
  setApiKey,
} from './config'
import {
  AmbiguousEnvironmentError,
  InvalidApiKeyPrefixError,
  MissingEnvironmentKeyError,
  NoCredentialsError,
} from './errors'

const BASE_URL = 'https://api.example.com'

describe('detectEnvironment', () => {
  it('detects test from the klap_test_ prefix', () => {
    expect(detectEnvironment('klap_test_abc123')).toBe('test')
  })

  it('detects live from the klap_live_ prefix', () => {
    expect(detectEnvironment('klap_live_abc123')).toBe('live')
  })

  it('throws InvalidApiKeyPrefixError for a key with neither prefix', () => {
    expect(() => detectEnvironment('sk_live_notklap')).toThrow(InvalidApiKeyPrefixError)
  })

  it('requires the prefix at the start, not anywhere in the key', () => {
    expect(() => detectEnvironment('xklap_test_abc')).toThrow(InvalidApiKeyPrefixError)
  })
})

describe('parseCredentialsConfig', () => {
  it('accepts a well-formed config with both slots', () => {
    const config = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_a', live: 'klap_live_b' } }
    expect(parseCredentialsConfig(config)).toEqual(config)
  })

  it('rejects a live key stored in the test slot', () => {
    expect(
      parseCredentialsConfig({ baseUrl: BASE_URL, apiKeys: { test: 'klap_live_b' } }),
    ).toBeNull()
  })

  it('rejects a test key stored in the live slot', () => {
    expect(
      parseCredentialsConfig({ baseUrl: BASE_URL, apiKeys: { live: 'klap_test_a' } }),
    ).toBeNull()
  })

  it('rejects a non-string key', () => {
    expect(parseCredentialsConfig({ baseUrl: BASE_URL, apiKeys: { test: 42 } })).toBeNull()
  })

  it('rejects a missing or non-string baseUrl', () => {
    expect(parseCredentialsConfig({ apiKeys: { test: 'klap_test_a' } })).toBeNull()
    expect(parseCredentialsConfig({ baseUrl: 1, apiKeys: {} })).toBeNull()
  })

  it('rejects apiKeys that is null or an array', () => {
    expect(parseCredentialsConfig({ baseUrl: BASE_URL, apiKeys: null })).toBeNull()
    expect(parseCredentialsConfig({ baseUrl: BASE_URL, apiKeys: ['klap_test_a'] })).toBeNull()
  })

  it('rejects non-object roots', () => {
    expect(parseCredentialsConfig(null)).toBeNull()
    expect(parseCredentialsConfig('klap_test_a')).toBeNull()
    expect(parseCredentialsConfig([])).toBeNull()
  })

  it('drops unknown fields instead of carrying them through', () => {
    const parsed = parseCredentialsConfig({
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_a', staging: 'whatever' },
      extra: true,
    })
    expect(parsed).toEqual({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_a' } })
  })

  it('migrates the legacy single-key shape into the matching slot', () => {
    expect(parseCredentialsConfig({ apiKey: 'klap_live_legacy', baseUrl: BASE_URL })).toEqual({
      baseUrl: BASE_URL,
      apiKeys: { live: 'klap_live_legacy' },
    })
  })

  it('rejects a legacy key with an unknown prefix', () => {
    expect(parseCredentialsConfig({ apiKey: 'sk_live_x', baseUrl: BASE_URL })).toBeNull()
  })
})

describe('setApiKey', () => {
  it('creates a fresh config when none exists', () => {
    expect(setApiKey(null, BASE_URL, 'klap_test_abc')).toEqual({
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_abc' },
    })
  })

  it('adds the live key without clobbering an existing test key', () => {
    const existing = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }
    const updated = setApiKey(existing, BASE_URL, 'klap_live_xyz')
    expect(updated.apiKeys).toEqual({ test: 'klap_test_abc', live: 'klap_live_xyz' })
  })

  it('overwrites the same environment slot on re-login', () => {
    const existing = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_old' } }
    const updated = setApiKey(existing, BASE_URL, 'klap_test_new')
    expect(updated.apiKeys).toEqual({ test: 'klap_test_new' })
  })

  it('replaces the baseUrl with the one passed in', () => {
    const existing = { baseUrl: 'https://old.example.com', apiKeys: {} }
    expect(setApiKey(existing, BASE_URL, 'klap_test_abc').baseUrl).toBe(BASE_URL)
  })

  it('rejects a key with an unknown prefix', () => {
    expect(() => setApiKey(null, BASE_URL, 'sk_test_abc')).toThrow(InvalidApiKeyPrefixError)
  })
})

describe('clearApiKey', () => {
  it('removes only the specified environment, keeping the other', () => {
    const config = {
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_abc', live: 'klap_live_xyz' },
    }
    expect(clearApiKey(config, 'test').apiKeys).toEqual({ live: 'klap_live_xyz' })
  })

  it('does not mutate the config passed in', () => {
    const config = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }
    clearApiKey(config, 'test')
    expect(config.apiKeys).toEqual({ test: 'klap_test_abc' })
  })
})

describe('resolveApiKey', () => {
  it('uses the only configured key when no environment is given', () => {
    const config: KlapCredentialsConfig = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }
    expect(resolveApiKey(config)).toEqual({ key: 'klap_test_abc', env: 'test' })
  })

  it('uses the only configured live key when no environment is given', () => {
    const config: KlapCredentialsConfig = { baseUrl: BASE_URL, apiKeys: { live: 'klap_live_xyz' } }
    expect(resolveApiKey(config)).toEqual({ key: 'klap_live_xyz', env: 'live' })
  })

  it('picks the requested environment when one is given', () => {
    const config: KlapCredentialsConfig = {
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_abc', live: 'klap_live_xyz' },
    }
    expect(resolveApiKey(config, 'live')).toEqual({ key: 'klap_live_xyz', env: 'live' })
  })

  it('throws AmbiguousEnvironmentError if both keys are configured and none is requested', () => {
    const config: KlapCredentialsConfig = {
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_abc', live: 'klap_live_xyz' },
    }
    expect(() => resolveApiKey(config)).toThrow(AmbiguousEnvironmentError)
  })

  it('throws NoCredentialsError if no key is configured at all', () => {
    expect(() => resolveApiKey({ baseUrl: BASE_URL, apiKeys: {} })).toThrow(NoCredentialsError)
  })

  it('throws NoCredentialsError when there is no config at all', () => {
    expect(() => resolveApiKey(null)).toThrow(NoCredentialsError)
  })

  it('treats an empty-string key as not configured', () => {
    expect(() => resolveApiKey({ baseUrl: BASE_URL, apiKeys: { test: '' } })).toThrow(
      NoCredentialsError,
    )
  })

  it('throws MissingEnvironmentKeyError carrying the environment when it is not configured', () => {
    const config: KlapCredentialsConfig = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }
    let thrown: unknown
    try {
      resolveApiKey(config, 'live')
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(MissingEnvironmentKeyError)
    expect(thrown).toMatchObject({ code: 'missing_environment_key', environment: 'live' })
  })

  it('exposes a stable code on each resolution error', () => {
    expect(() => resolveApiKey(null)).toThrow(expect.objectContaining({ code: 'no_credentials' }))
    expect(() =>
      resolveApiKey({ baseUrl: BASE_URL, apiKeys: { test: 'klap_test_a', live: 'klap_live_b' } }),
    ).toThrow(expect.objectContaining({ code: 'ambiguous_environment' }))
  })
})
