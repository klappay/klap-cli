import { createHmac } from 'node:crypto'
import type { Command } from 'commander'
import pc from 'picocolors'
import { resolveApiKey } from '../client'
import { ENV_FLAG_DESCRIPTION, parseCliEnvironment, requireConfig } from '../config'
import { printEnvironmentBanner, runCommand } from '../print'
import { connectToRelay } from '../relay'

const FORWARD_TIMEOUT_MS = 8_000

export function registerListen(program: Command): void {
  program
    .command('listen')
    .description('Forward every webhook event to a local URL, in real time — no tunnel required')
    .requiredOption(
      '--forward-to <url>',
      'Local URL to forward events to, e.g. http://localhost:3000/webhooks',
    )
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: { forwardTo: string; env?: string }) =>
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
            console.log(pc.green('Ready!'), `Forwarding events to ${options.forwardTo}`)
            console.log(pc.dim(`Signing secret: ${secret}`))
            continue
          }

          const body = JSON.stringify(evt.payload)
          const timestamp = Math.floor(Date.now() / 1000)
          const signature = createHmac('sha256', secret)
            .update(`${timestamp}.${body}`)
            .digest('hex')
          const start = Date.now()

          try {
            const res = await fetch(options.forwardTo, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Klap-Signature': `t=${timestamp},v1=${signature}`,
                'X-Klap-Event': evt.payload.event,
                'X-Klap-Delivery': evt.payload.id,
              },
              body,
              signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
            })
            console.log(
              `${pc.cyan('-->')} ${evt.payload.event} [${res.status}] ${Date.now() - start}ms`,
            )
          } catch (err) {
            console.log(
              `${pc.red('-->')} ${evt.payload.event} [failed] ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }
      }),
    )
}
