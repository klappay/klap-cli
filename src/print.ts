import { KlapApiError } from '@klappay/node'
import type { Charge, Webhook, WebhookDelivery, WebhookListItem } from '@klappay/types'
import pc from 'picocolors'
import type { CliEnvironment } from './config'

/** Printed at the start of every command that resolves an environment — `live` is deliberately loud, never easy to miss or scroll past. */
export function printEnvironmentBanner(env: CliEnvironment): void {
  if (env === 'live') {
    console.log(pc.bgRed(pc.black(pc.bold(' LIVE '))), pc.red('— real funds and real data'))
  } else {
    console.log(pc.bgGreen(pc.black(pc.bold(' TEST '))), pc.dim('— sandbox, no real funds'))
  }
}

export function printCharge(charge: Charge): void {
  const accepted = charge.acceptedPayments.map((p) => `${p.token}:${p.network}`).join(', ')
  const paidWith = charge.paidWith.map((p) => `${p.token}:${p.network}`).join(', ')
  console.log(pc.bold(charge.id))
  console.log(`  status:            ${charge.status}`)
  console.log(`  settlementStatus:  ${charge.settlementStatus ?? 'null'}`)
  console.log(`  amount:            ${charge.amount}`)
  console.log(`  amountReceived:    ${charge.amountReceived ?? 'null'}`)
  console.log(`  acceptedPayments:  ${accepted}`)
  console.log(`  paidWith:          ${paidWith || 'none yet'}`)
  console.log(`  address:           ${charge.address}`)
  console.log(`  environment:       ${charge.environment}`)
}

function printWebhookCommon(
  webhook: Pick<
    Webhook,
    'id' | 'url' | 'events' | 'eventCategories' | 'isWildcard' | 'environment'
  >,
): void {
  console.log(pc.bold(webhook.id))
  console.log(`  url:              ${webhook.url}`)
  console.log(`  environment:      ${webhook.environment ?? 'both'}`)
  console.log(
    `  events:           ${webhook.isWildcard ? '* (all)' : webhook.events.join(', ') || 'none'}`,
  )
  console.log(`  eventCategories:  ${webhook.eventCategories.join(', ') || 'none'}`)
}

export function printWebhook(webhook: Webhook): void {
  printWebhookCommon(webhook)
  console.log(`  secret:           ${webhook.secret}`)
  console.log(pc.dim('  (shown once — store it now, it is used to verify delivered payloads)'))
}

export function printWebhookListItem(webhook: WebhookListItem): void {
  printWebhookCommon(webhook)
  console.log(`  secret:           ${webhook.hint}`)
}

export function printDelivery(delivery: WebhookDelivery): void {
  console.log(pc.bold(delivery.id))
  console.log(`  event:         ${delivery.event}`)
  console.log(`  status:        ${delivery.status}`)
  console.log(`  attempts:      ${delivery.attempts}`)
  console.log(`  responseCode:  ${delivery.responseCode ?? 'null'}`)
  console.log(`  createdAt:     ${delivery.createdAt}`)
}

export async function runCommand(action: () => Promise<void>): Promise<void> {
  try {
    await action()
  } catch (err) {
    if (err instanceof KlapApiError) {
      console.error(pc.red(`${err.code}: ${err.message}`))
    } else {
      console.error(pc.red(err instanceof Error ? err.message : String(err)))
    }
    process.exit(1)
  }
}
