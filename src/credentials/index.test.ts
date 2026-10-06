import { describe, expect, it } from 'vitest'
import * as credentials from './index'

describe('credentials subpath exports', () => {
  it('exposes the store, the pure helpers, and every error class', () => {
    expect(Object.keys(credentials).sort()).toEqual(
      [
        'AmbiguousEnvironmentError',
        'CREDENTIALS_DISPLAY_PATH',
        'InvalidApiKeyPrefixError',
        'InvalidCredentialsFileError',
        'KLAP_ENVIRONMENTS',
        'KlapCredentialsError',
        'MissingEnvironmentKeyError',
        'NoCredentialsError',
        'SymlinkedCredentialsPathError',
        'clearApiKey',
        'credentialsPath',
        'deleteCredentials',
        'detectEnvironment',
        'loadCredentials',
        'resolveApiKey',
        'saveCredentials',
        'setApiKey',
      ].sort(),
    )
    expect(credentials.CREDENTIALS_DISPLAY_PATH).toBe('~/.klap/config.json')
  })
})
