import { type KlapClient, createClient } from '@klappay/node'
import {
  type CliEnvironment,
  type KlapCliConfig,
  parseCliEnvironment,
  requireConfig,
  rethrowAsCliError,
} from './config'
import { resolveApiKey as resolveCredentialsApiKey } from './credentials'
import { printEnvironmentBanner } from './print'

export function resolveApiKey(
  config: KlapCliConfig,
  env?: CliEnvironment,
): { key: string; env: CliEnvironment } {
  try {
    return resolveCredentialsApiKey(config, env)
  } catch (err) {
    rethrowAsCliError(err)
  }
}

export async function requireClient(
  env?: CliEnvironment,
): Promise<{ client: KlapClient; env: CliEnvironment }> {
  const config = await requireConfig()
  const resolved = resolveApiKey(config, env)
  return {
    client: createClient({ apiKey: resolved.key, baseUrl: config.baseUrl }),
    env: resolved.env,
  }
}

/**
 * `requireClient()` + the `--env` flag parsing + the LIVE/TEST banner —
 * every command that talks to the API does exactly this sequence and
 * never uses the resolved `env` for anything else, so this is the one
 * line most `.action()`s actually need.
 */
export async function requireEnvClient(envFlag?: string): Promise<KlapClient> {
  const { client, env } = await requireClient(parseCliEnvironment(envFlag))
  printEnvironmentBanner(env)
  return client
}
