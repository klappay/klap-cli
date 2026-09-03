import {
  type CreateWebhookRequest,
  WEBHOOK_EVENTS_WILDCARD,
  type WebhookCategory,
  WebhookCategorySchema,
  type WebhookEventType,
  WebhookEventTypeSchema,
} from '@klappay/types'
import type { Command } from 'commander'
import pc from 'picocolors'
import { requireClient } from '../client'
import { ENV_FLAG_DESCRIPTION, parseCliEnvironment } from '../config'
import {
  printDelivery,
  printEnvironmentBanner,
  printWebhook,
  printWebhookListItem,
  runCommand,
} from '../print'

export function parseWebhookEvent(
  value: string,
): WebhookEventType | typeof WEBHOOK_EVENTS_WILDCARD {
  if (value === WEBHOOK_EVENTS_WILDCARD) return value
  const parsed = WebhookEventTypeSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(
      `--event must be "${WEBHOOK_EVENTS_WILDCARD}" or one of ${WebhookEventTypeSchema.options.flatMap((o) => o.options).join(', ')}, got "${value}"`,
    )
  }
  return parsed.data
}

export function parseWebhookCategory(value: string): WebhookCategory {
  const parsed = WebhookCategorySchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(
      `--category must be one of ${WebhookCategorySchema.options.join(', ')}, got "${value}"`,
    )
  }
  return parsed.data
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value]
}

type CreateOptions = {
  url: string
  event: string[]
  category: string[]
  env?: string
}

export function registerWebhooks(program: Command): void {
  const webhooks = program.command('webhooks').description('Manage webhook endpoints')

  webhooks
    .command('create')
    .description('Register a webhook endpoint')
    .requiredOption('--url <url>', 'Endpoint to deliver events to')
    .option(
      '--event <event>',
      'Event to subscribe to (e.g. charge.confirmed, or "*" for all) — repeat for multiple',
      collect,
      [] as string[],
    )
    .option(
      '--category <category>',
      '"payments" or "webhooks" — subscribes to every event in that category',
      collect,
      [] as string[],
    )
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: CreateOptions) =>
      runCommand(async () => {
        const { client: klap, env } = await requireClient(parseCliEnvironment(options.env))
        printEnvironmentBanner(env)
        const input: CreateWebhookRequest = { url: options.url }
        if (options.event.length > 0) input.events = options.event.map(parseWebhookEvent)
        if (options.category.length > 0)
          input.eventCategories = options.category.map(parseWebhookCategory)
        const webhook = await klap.webhooks.create(input)
        printWebhook(webhook)
      }),
    )

  webhooks
    .command('list')
    .description('List registered webhook endpoints')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: { env?: string }) =>
      runCommand(async () => {
        const { client: klap, env } = await requireClient(parseCliEnvironment(options.env))
        printEnvironmentBanner(env)
        const list = await klap.webhooks.list()
        if (list.length === 0) {
          console.log(pc.dim('No webhooks registered.'))
          return
        }
        for (const webhook of list) printWebhookListItem(webhook)
      }),
    )

  webhooks
    .command('delete <id>')
    .description('Remove a webhook endpoint')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((id: string, options: { env?: string }) =>
      runCommand(async () => {
        const { client: klap, env } = await requireClient(parseCliEnvironment(options.env))
        printEnvironmentBanner(env)
        await klap.webhooks.delete(id)
        console.log(pc.green('Deleted.'), id)
      }),
    )

  webhooks
    .command('deliveries <id>')
    .description('List recent delivery attempts for a webhook')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((id: string, options: { env?: string }) =>
      runCommand(async () => {
        const { client: klap, env } = await requireClient(parseCliEnvironment(options.env))
        printEnvironmentBanner(env)
        const page = await klap.webhooks.listDeliveries(id)
        if (page.data.length === 0) {
          console.log(pc.dim('No deliveries yet.'))
          return
        }
        for (const delivery of page.data) printDelivery(delivery)
      }),
    )

  webhooks
    .command('retry <id> <deliveryId>')
    .description('Retry a failed delivery')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((id: string, deliveryId: string, options: { env?: string }) =>
      runCommand(async () => {
        const { client: klap, env } = await requireClient(parseCliEnvironment(options.env))
        printEnvironmentBanner(env)
        await klap.webhooks.retryDelivery(id, deliveryId)
        console.log(pc.green('Retry queued.'), deliveryId)
      }),
    )
}
