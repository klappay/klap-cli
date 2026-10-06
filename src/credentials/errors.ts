import type { Environment } from '@klappay/types'

export type KlapCredentialsErrorCode =
  | 'invalid_api_key_prefix'
  | 'invalid_credentials_file'
  | 'credentials_path_symlink'
  | 'no_credentials'
  | 'missing_environment_key'
  | 'ambiguous_environment'

export class KlapCredentialsError extends Error {
  readonly code: KlapCredentialsErrorCode

  constructor(code: KlapCredentialsErrorCode, message: string) {
    super(message)
    this.name = 'KlapCredentialsError'
    this.code = code
  }
}

export class InvalidApiKeyPrefixError extends KlapCredentialsError {
  constructor() {
    super('invalid_api_key_prefix', 'API key must start with "klap_test_" or "klap_live_".')
    this.name = 'InvalidApiKeyPrefixError'
  }
}

export class InvalidCredentialsFileError extends KlapCredentialsError {
  constructor() {
    super(
      'invalid_credentials_file',
      'Credentials are corrupted or invalid: expected a baseUrl and API keys whose prefix matches their environment slot.',
    )
    this.name = 'InvalidCredentialsFileError'
  }
}

export class SymlinkedCredentialsPathError extends KlapCredentialsError {
  constructor() {
    super(
      'credentials_path_symlink',
      'Refusing to use the local credentials store: ~/.klap or ~/.klap/config.json is a symbolic link.',
    )
    this.name = 'SymlinkedCredentialsPathError'
  }
}

export class NoCredentialsError extends KlapCredentialsError {
  constructor() {
    super('no_credentials', 'No API key is configured in the local credentials store.')
    this.name = 'NoCredentialsError'
  }
}

export class MissingEnvironmentKeyError extends KlapCredentialsError {
  readonly environment: Environment

  constructor(environment: Environment) {
    super('missing_environment_key', `No ${environment} API key is configured.`)
    this.name = 'MissingEnvironmentKeyError'
    this.environment = environment
  }
}

export class AmbiguousEnvironmentError extends KlapCredentialsError {
  constructor() {
    super(
      'ambiguous_environment',
      'Both a test and a live API key are configured — specify which environment to use.',
    )
    this.name = 'AmbiguousEnvironmentError'
  }
}
