import { afterEach, describe, expect, it } from 'vitest'
import { resolveApiKeyInput } from './login'

describe('resolveApiKeyInput', () => {
  const originalEnv = process.env.KLAP_API_KEY

  afterEach(() => {
    // biome-ignore lint/performance/noDelete: process.env needs a real delete to unset, `= undefined` would set it to the string "undefined"
    if (originalEnv === undefined) delete process.env.KLAP_API_KEY
    else process.env.KLAP_API_KEY = originalEnv
  })

  it('uses the --api-key flag value when provided', async () => {
    expect(await resolveApiKeyInput('klap_test_abc')).toBe('klap_test_abc')
  })

  it('falls back to KLAP_API_KEY when the flag is omitted', async () => {
    process.env.KLAP_API_KEY = 'klap_live_from_env'
    expect(await resolveApiKeyInput(undefined)).toBe('klap_live_from_env')
  })

  it('prefers the explicit flag over KLAP_API_KEY when both are set', async () => {
    process.env.KLAP_API_KEY = 'klap_live_from_env'
    expect(await resolveApiKeyInput('klap_test_from_flag')).toBe('klap_test_from_flag')
  })

  it('throws a clear error when neither the flag nor the env var is set', async () => {
    // biome-ignore lint/performance/noDelete: process.env needs a real delete to unset, `= undefined` would set it to the string "undefined"
    delete process.env.KLAP_API_KEY
    await expect(resolveApiKeyInput(undefined)).rejects.toThrow(
      'Provide an API key via --api-key <key>, --api-key - (reads from stdin), or the KLAP_API_KEY environment variable.',
    )
  })
})
