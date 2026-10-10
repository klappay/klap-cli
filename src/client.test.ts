import { describe, expect, it } from 'vitest'
import { resolveApiKey } from './client'
import { type KlapCliConfig, LOGIN_HINT } from './config'

const BASE_URL = 'https://api.example.com'

describe('resolveApiKey', () => {
  it('uses the only configured key when no --env is given', () => {
    const config: KlapCliConfig = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }
    expect(resolveApiKey(config)).toEqual({ key: 'klap_test_abc', env: 'test' })
  })

  it('picks the requested environment when --env is given', () => {
    const config: KlapCliConfig = {
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_abc', live: 'klap_live_xyz' },
    }
    expect(resolveApiKey(config, 'live')).toEqual({ key: 'klap_live_xyz', env: 'live' })
  })

  it('refuses to guess with the CLI --env hint if both keys are configured and no --env is given', () => {
    const config: KlapCliConfig = {
      baseUrl: BASE_URL,
      apiKeys: { test: 'klap_test_abc', live: 'klap_live_xyz' },
    }
    expect(() => resolveApiKey(config)).toThrow(
      'Both a test and a live key are configured — pass --env test or --env live to choose.',
    )
  })

  it('throws the login hint if no key is configured at all', () => {
    const config: KlapCliConfig = { baseUrl: BASE_URL, apiKeys: {} }
    expect(() => resolveApiKey(config)).toThrow(LOGIN_HINT)
  })

  it('names the exact klap login command if --env is given but that environment is not configured', () => {
    const config: KlapCliConfig = { baseUrl: BASE_URL, apiKeys: { test: 'klap_test_abc' } }
    expect(() => resolveApiKey(config, 'live')).toThrow(
      'No live key configured. Pipe a klap_live_ key into `klap login --api-key - --base-url <url>`.',
    )
  })
})
