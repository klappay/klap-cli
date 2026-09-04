import type { Command } from 'commander'
import pc from 'picocolors'
import { resolveApiKey } from '../client'
import { ENV_FLAG_DESCRIPTION, parseCliEnvironment, requireConfig } from '../config'
import { printDeliveryResult, printEnvironmentBanner, printRelayEvent, runCommand } from '../print'
import { connectToRelay, extractChargeId } from '../relay'
import { deliverWebhook } from '../webhook-delivery'

type ListenOptions = { forwardTo?: string; charge?: string; env?: string }

export function registerListen(program: Command): void {
  program
    .command('listen')
    .description('Print every webhook event live, and optionally forward it to a local URL')
    .option(
      '--forward-to <url>',
      'Local URL to forward events to, e.g. http://localhost:3000/webhooks — omit to just print them',
    )
    .option('--charge <id>', 'Only show/forward events for this charge')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: ListenOptions) =>
      runCommand(async () => {
        const config = await requireConfig()
        const { key, env } = resolveApiKey(config, parseCliEnvironment(options.env))
        printEnvironmentBanner(env)

        const controller = new AbortController()
        process.on('SIGINT', () => controller.abort())

        console.log(pc.dim('Connecting...'))
        let secret = ''

        for await (const evt of connectToRelay(config.baseUrl, key, controller.signal)) {
          if (evt.type === 'session') {
            secret = evt.secret
            console.log(
              pc.green('Ready!'),
              options.forwardTo
                ? `Forwarding events to ${options.forwardTo}`
                : 'Listening for events',
            )
            if (options.forwardTo) console.log(pc.dim(`Signing secret: ${secret}`))
            continue
          }

          const chargeId = extractChargeId(evt.payload.data)
          if (options.charge && chargeId !== options.charge) continue

          if (!options.forwardTo) {
            printRelayEvent(evt.payload, chargeId)
            continue
          }

          const result = await deliverWebhook(options.forwardTo, evt.payload, secret)
          printDeliveryResult(evt.payload.event, result)
        }
      }),
    )
}
