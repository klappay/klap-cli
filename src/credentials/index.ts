export {
  KLAP_ENVIRONMENTS,
  clearApiKey,
  detectEnvironment,
  resolveApiKey,
  setApiKey,
} from './config'
export type { KlapCredentialsConfig, KlapEnvironment } from './config'

export {
  CREDENTIALS_DISPLAY_PATH,
  credentialsPath,
  deleteCredentials,
  loadCredentials,
  saveCredentials,
} from './store'

export {
  AmbiguousEnvironmentError,
  InvalidApiKeyPrefixError,
  InvalidCredentialsFileError,
  KlapCredentialsError,
  MissingEnvironmentKeyError,
  NoCredentialsError,
  SymlinkedCredentialsPathError,
} from './errors'
export type { KlapCredentialsErrorCode } from './errors'
