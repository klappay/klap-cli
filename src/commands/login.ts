import type { Command } from 'commander'
import pc from 'picocolors'
import { CONFIG_DISPLAY_PATH, loadConfig, saveConfig, setApiKey } from '../config'
import { runCommand } from '../print'

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => resolve(data.trim()))
    process.stdin.on('error', reject)
  })
}

/**
 * `--api-key <key>` on the command line is the simplest path, but it writes
 * the secret to shell history and exposes it to any local user running
 * `ps`/`/proc` for as long as this process runs (docs/security.md's #17)
 * — the same reason `aws configure`/`gh auth login --with-token` avoid it.
 * `--api-key -` (stdin) and `KLAP_API_KEY` (env var) are the alternatives
 * that avoid both; the flag stays supported for scripts that already
 * accept that trade-off knowingly.
 */
export async function resolveApiKeyInput(flagValue: string | undefined): Promise<string> {
  if (flagValue === '-') return readStdin()
  if (flagValue) return flagValue
  if (process.env.KLAP_API_KEY) return process.env.KLAP_API_KEY

  throw new Error(
    'Provide an API key via --api-key <key>, --api-key - (reads from stdin), or the KLAP_API_KEY environment variable.',
  )
}

export function registerLogin(program: Command): void {
  program
    .command('login')
    .description('Store an API key locally — test/live is auto-detected from its prefix')
    .option(
      '--api-key <key>',
      'klap_live_... or klap_test_... — or "-" to read from stdin. Falls back to $KLAP_API_KEY if omitted.',
    )
    .requiredOption('--base-url <url>', 'Base URL of the Klap API, e.g. https://api.klap.example')
    .action((options: { apiKey?: string; baseUrl: string }) =>
      runCommand(async () => {
        const apiKey = await resolveApiKeyInput(options.apiKey)

        const existing = await loadConfig()
        const config = setApiKey(existing, options.baseUrl, apiKey)
        await saveConfig(config)

        const env = apiKey.startsWith('klap_test_') ? 'test' : 'live'
        const otherEnv = env === 'test' ? 'live' : 'test'
        const otherConfigured = Boolean(config.apiKeys[otherEnv])

        console.log(
          pc.green('Logged in.'),
          `${env.toUpperCase()} key saved to ${CONFIG_DISPLAY_PATH}`,
        )
        console.log(
          pc.dim(
            `${otherEnv.toUpperCase()} key: ${otherConfigured ? 'already configured' : 'not configured'}`,
          ),
        )
      }),
    )
}
