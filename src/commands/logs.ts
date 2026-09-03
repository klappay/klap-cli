import type { Command } from 'commander'
import { requireClient, resolveApiKey } from '../client'
import { ENV_FLAG_DESCRIPTION, parseCliEnvironment, requireConfig } from '../config'
import { printEnvironmentBanner, runCommand } from '../print'
import { connectToRelay } from '../relay'

function extractChargeId(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string') {
    return data.id
  }
  return undefined
}

export function registerLogs(program: Command): void {
  program
    .command('logs')
    .description('Show a charge timeline, or stream live events with --tail')
    .option('--charge <id>', 'Charge id — required without --tail, an optional filter with it')
    .option('--tail', 'Keep streaming new events live instead of printing history once')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: { charge?: string; tail?: boolean; env?: string }) =>
      runCommand(async () => {
        const env = parseCliEnvironment(options.env)

        if (!options.tail) {
          if (!options.charge) {
            throw new Error(
              'Pass --charge <id> to show its timeline, or --tail to stream live events.',
            )
          }
          const { client: klap, env: resolvedEnv } = await requireClient(env)
          printEnvironmentBanner(resolvedEnv)
          const events = await klap.charges.getTimeline(options.charge)
          for (const event of events) console.log(`${event.at}  ${event.type}`)
          return
        }

        const config = await requireConfig()
        const resolved = resolveApiKey(config, env)
        printEnvironmentBanner(resolved.env)

        const controller = new AbortController()
        process.on('SIGINT', () => controller.abort())

        for await (const evt of connectToRelay(config.baseUrl, resolved.key, controller.signal)) {
          if (evt.type !== 'webhook') continue
          const chargeId = extractChargeId(evt.payload.data)
          if (options.charge && chargeId !== options.charge) continue
          console.log(`${evt.payload.createdAt}  ${evt.payload.event}  ${chargeId ?? '-'}`)
        }
      }),
    )
}
