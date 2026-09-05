import { type KlapClient, createClient } from '@klappay/node'
import {
  type CliEnvironment,
  type KlapCliConfig,
  LOGIN_HINT,
  parseCliEnvironment,
  requireConfig,
} from './config'
import { printEnvironmentBanner } from './print'

/**
 * Never silently guesses which key to use when both are configured — that's
 * exactly the "which environment am I actually looking at" mistake this
 * whole feature exists to prevent. Only auto-picks when there's genuinely
 * just one key to pick.
 */
export function resolveApiKey(
  config: KlapCliConfig,
  env?: CliEnvironment,
): { key: string; env: CliEnvironment } {
  if (env) {
    const key = config.apiKeys[env]
    if (!key) {
      throw new Error(
        `No ${env} key configured. Run \`klap login --api-key klap_${env}_... --base-url <url>\`.`,
      )
    }
    return { key, env }
  }

  const configured = (['test', 'live'] as const).filter((e) => config.apiKeys[e])
  if (configured.length === 0) {
    throw new Error(LOGIN_HINT)
  }
  if (configured.length > 1) {
    throw new Error(
      'Both a test and a live key are configured — pass --env test or --env live to choose.',
    )
  }
  const [resolvedEnv] = configured
  const key = config.apiKeys[resolvedEnv]
  if (!key) throw new Error(LOGIN_HINT)
  return { key, env: resolvedEnv }
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
