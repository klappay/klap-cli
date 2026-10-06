import type { Environment } from '@klappay/types'
import {
  AmbiguousEnvironmentError,
  InvalidApiKeyPrefixError,
  MissingEnvironmentKeyError,
  NoCredentialsError,
} from './errors'

export type KlapEnvironment = Environment

export type KlapCredentialsConfig = {
  baseUrl: string
  apiKeys: Partial<Record<KlapEnvironment, string>>
}

export const KLAP_ENVIRONMENTS: readonly KlapEnvironment[] = ['test', 'live']

const API_KEY_PREFIXES: Record<KlapEnvironment, string> = {
  test: 'klap_test_',
  live: 'klap_live_',
}

export function detectEnvironment(apiKey: string): KlapEnvironment {
  const env = KLAP_ENVIRONMENTS.find((e) => apiKey.startsWith(API_KEY_PREFIXES[e]))
  if (!env) throw new InvalidApiKeyPrefixError()
  return env
}

function isKeyForSlot(value: unknown, env: KlapEnvironment): value is string {
  return typeof value === 'string' && value.startsWith(API_KEY_PREFIXES[env])
}

function parseApiKeys(value: unknown): KlapCredentialsConfig['apiKeys'] | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const apiKeys: KlapCredentialsConfig['apiKeys'] = {}
  for (const env of KLAP_ENVIRONMENTS) {
    if (!Object.hasOwn(value, env)) continue
    const key: unknown = Reflect.get(value, env)
    if (key === undefined) continue
    if (!isKeyForSlot(key, env)) return null
    apiKeys[env] = key
  }
  return apiKeys
}

export function parseCredentialsConfig(value: unknown): KlapCredentialsConfig | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  if (!('baseUrl' in value) || typeof value.baseUrl !== 'string') return null

  if ('apiKeys' in value) {
    const apiKeys = parseApiKeys(value.apiKeys)
    return apiKeys ? { baseUrl: value.baseUrl, apiKeys } : null
  }

  if ('apiKey' in value && typeof value.apiKey === 'string') {
    const legacyKey = value.apiKey
    const env = KLAP_ENVIRONMENTS.find((e) => isKeyForSlot(legacyKey, e))
    return env ? { baseUrl: value.baseUrl, apiKeys: { [env]: legacyKey } } : null
  }

  return null
}

export function setApiKey(
  config: KlapCredentialsConfig | null,
  baseUrl: string,
  apiKey: string,
): KlapCredentialsConfig {
  const env = detectEnvironment(apiKey)
  return { baseUrl, apiKeys: { ...config?.apiKeys, [env]: apiKey } }
}

export function clearApiKey(
  config: KlapCredentialsConfig,
  env: KlapEnvironment,
): KlapCredentialsConfig {
  const apiKeys: KlapCredentialsConfig['apiKeys'] = {}
  for (const other of KLAP_ENVIRONMENTS) {
    const key = config.apiKeys[other]
    if (other !== env && key !== undefined) apiKeys[other] = key
  }
  return { ...config, apiKeys }
}

function configuredKey(config: KlapCredentialsConfig, env: KlapEnvironment): string | undefined {
  if (!Object.hasOwn(config.apiKeys, env)) return undefined
  const key: unknown = config.apiKeys[env]
  return typeof key === 'string' && key.length > 0 ? key : undefined
}

export function resolveApiKey(
  config: KlapCredentialsConfig | null,
  env?: KlapEnvironment,
): { key: string; env: KlapEnvironment } {
  if (!config) throw new NoCredentialsError()

  if (env) {
    const key = configuredKey(config, env)
    if (!key) throw new MissingEnvironmentKeyError(env)
    return { key, env }
  }

  const configured = KLAP_ENVIRONMENTS.flatMap((e) => {
    const key = configuredKey(config, e)
    return key ? [{ key, env: e }] : []
  })
  const [only, ...rest] = configured
  if (!only) throw new NoCredentialsError()
  if (rest.length > 0) throw new AmbiguousEnvironmentError()
  return only
}
