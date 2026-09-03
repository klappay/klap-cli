import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Environment } from '@klappay/types'

export type CliEnvironment = Environment

export const CONFIG_DISPLAY_PATH = '~/.klap/config.json'
export const LOGIN_HINT = 'Not logged in — run `klap login --api-key <key> --base-url <url>` first.'
export const ENV_FLAG_DESCRIPTION = 'test or live — required if both are configured'
export const ENV_FLAG_DESCRIPTION_SANDBOX = `${ENV_FLAG_DESCRIPTION} (server rejects live)`

export type KlapCliConfig = {
  baseUrl: string
  apiKeys: Partial<Record<CliEnvironment, string>>
}

type LegacyKlapCliConfig = {
  apiKey: string
  baseUrl: string
}

function isLegacyConfig(value: unknown): value is LegacyKlapCliConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    !('apiKeys' in value) &&
    'apiKey' in value &&
    typeof (value as { apiKey: unknown }).apiKey === 'string'
  )
}

function isKlapCliConfig(value: unknown): value is KlapCliConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { baseUrl: unknown }).baseUrl === 'string' &&
    typeof (value as { apiKeys: unknown }).apiKeys === 'object' &&
    (value as { apiKeys: unknown }).apiKeys !== null
  )
}

export function parseCliEnvironment(value: string | undefined): CliEnvironment | undefined {
  if (value === undefined) return undefined
  if (value !== 'test' && value !== 'live') {
    throw new Error(`--env must be "test" or "live", got "${value}"`)
  }
  return value
}

export function detectEnvironment(apiKey: string): CliEnvironment {
  if (apiKey.startsWith('klap_test_')) return 'test'
  if (apiKey.startsWith('klap_live_')) return 'live'
  throw new Error(
    `API key must start with "klap_test_" or "klap_live_" — got "${apiKey.slice(0, 10)}...".`,
  )
}

function configPath(): string {
  return join(homedir(), '.klap', 'config.json')
}

export async function loadConfig(): Promise<KlapCliConfig | null> {
  try {
    const raw = await readFile(configPath(), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (isLegacyConfig(parsed)) {
      return {
        baseUrl: parsed.baseUrl,
        apiKeys: { [detectEnvironment(parsed.apiKey)]: parsed.apiKey },
      }
    }
    return isKlapCliConfig(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function saveConfig(config: KlapCliConfig): Promise<void> {
  const path = configPath()
  const dir = join(path, '..')

  await mkdir(dir, { recursive: true })
  await chmod(dir, 0o700)
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
  await chmod(path, 0o600)
}

export async function requireConfig(): Promise<KlapCliConfig> {
  const config = await loadConfig()
  if (!config) {
    console.error(LOGIN_HINT)
    process.exit(1)
  }
  return config
}

export function setApiKey(
  config: KlapCliConfig | null,
  baseUrl: string,
  apiKey: string,
): KlapCliConfig {
  const env = detectEnvironment(apiKey)
  return { baseUrl, apiKeys: { ...config?.apiKeys, [env]: apiKey } }
}

export function clearApiKey(config: KlapCliConfig, env: CliEnvironment): KlapCliConfig {
  const apiKeys = { ...config.apiKeys }
  delete apiKeys[env]
  return { ...config, apiKeys }
}

export async function deleteConfig(): Promise<void> {
  await rm(configPath(), { force: true })
}
