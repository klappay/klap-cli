import {
  CREDENTIALS_DISPLAY_PATH,
  type KlapCredentialsConfig,
  KlapCredentialsError,
  type KlapCredentialsErrorCode,
  type KlapEnvironment,
  MissingEnvironmentKeyError,
  deleteCredentials,
  detectEnvironment as detectCredentialsEnvironment,
  loadCredentials,
  saveCredentials,
  setApiKey as setCredentialsApiKey,
} from './credentials'

export { clearApiKey } from './credentials'

export type CliEnvironment = KlapEnvironment
export type KlapCliConfig = KlapCredentialsConfig

export const CONFIG_DISPLAY_PATH = CREDENTIALS_DISPLAY_PATH
const LOGIN_COMMAND = '`klap login --api-key - --base-url <url>`'
export const LOGIN_HINT = `Not logged in — pipe your key into ${LOGIN_COMMAND} first.`
export const ENV_FLAG_DESCRIPTION = 'test or live — required if both are configured'
export const ENV_FLAG_DESCRIPTION_SANDBOX = `${ENV_FLAG_DESCRIPTION} (server rejects live)`

type StaticMessageCode = Exclude<KlapCredentialsErrorCode, 'missing_environment_key'>

const CREDENTIALS_ERROR_MESSAGES: Record<StaticMessageCode, string> = {
  invalid_api_key_prefix: 'API key must start with "klap_test_" or "klap_live_".',
  invalid_credentials_file: `${CONFIG_DISPLAY_PATH} is corrupted or invalid — run \`klap logout\` to remove it, then pipe your key into ${LOGIN_COMMAND} again.`,
  credentials_path_symlink: `Refusing to use ${CONFIG_DISPLAY_PATH}: ~/.klap or the file itself is a symbolic link. Remove the link and pipe your key into ${LOGIN_COMMAND} again to create a real ~/.klap directory.`,
  no_credentials: LOGIN_HINT,
  ambiguous_environment:
    'Both a test and a live key are configured — pass --env test or --env live to choose.',
}

function hasStaticMessage(code: KlapCredentialsErrorCode): code is StaticMessageCode {
  return code !== 'missing_environment_key'
}

export function cliCredentialsMessage(err: KlapCredentialsError): string {
  if (err instanceof MissingEnvironmentKeyError) {
    return `No ${err.environment} key configured. Pipe a klap_${err.environment}_ key into ${LOGIN_COMMAND}.`
  }
  return hasStaticMessage(err.code) ? CREDENTIALS_ERROR_MESSAGES[err.code] : LOGIN_HINT
}

export function rethrowAsCliError(err: unknown): never {
  throw err instanceof KlapCredentialsError ? new Error(cliCredentialsMessage(err)) : err
}

export function parseCliEnvironment(value: string | undefined): CliEnvironment | undefined {
  if (value === undefined) return undefined
  if (value !== 'test' && value !== 'live') {
    throw new Error(`--env must be "test" or "live", got "${value}"`)
  }
  return value
}

function withCliErrors<T>(action: () => T): T {
  try {
    return action()
  } catch (err) {
    rethrowAsCliError(err)
  }
}

export function detectEnvironment(apiKey: string): CliEnvironment {
  return withCliErrors(() => detectCredentialsEnvironment(apiKey))
}

export function setApiKey(
  config: KlapCliConfig | null,
  baseUrl: string,
  apiKey: string,
): KlapCliConfig {
  return withCliErrors(() => setCredentialsApiKey(config, baseUrl, apiKey))
}

export function loadConfig(): Promise<KlapCliConfig | null> {
  return loadCredentials().catch(rethrowAsCliError)
}

export function saveConfig(config: KlapCliConfig): Promise<void> {
  return saveCredentials(config).catch(rethrowAsCliError)
}

export function deleteConfig(): Promise<void> {
  return deleteCredentials().catch(rethrowAsCliError)
}

export async function requireConfig(): Promise<KlapCliConfig> {
  const config = await loadConfig()
  if (!config) {
    console.error(LOGIN_HINT)
    process.exit(1)
  }
  return config
}
