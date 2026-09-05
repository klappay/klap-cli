import { KlapApiError } from '@klappay/node'
import type {
  Charge,
  ConfirmationProgress,
  Webhook,
  WebhookDelivery,
  WebhookListItem,
  WebhookPayload,
} from '@klappay/types'
import pc from 'picocolors'
import type { CliEnvironment } from './config'
import type { DeliveryResult } from './webhook-delivery'

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
  console.log(
    `  fee:               ${charge.feeAmount} (${charge.feePercent}%, paid by ${charge.feePayer})`,
  )
  console.log(`  merchantAmount:    ${charge.merchantAmount}`)
  console.log(`  acceptedPayments:  ${accepted}`)
  console.log(`  paidWith:          ${paidWith || 'none yet'}`)
  console.log(`  address:           ${charge.address}`)
  console.log(`  environment:       ${charge.environment}`)
  if (charge.checkoutUrl) {
    console.log(`  checkoutUrl:       ${pc.underline(pc.cyan(charge.checkoutUrl))}`)
  }
}

const PROGRESS_BAR_WIDTH = 20

export function formatConfirmationProgress(progress: ConfirmationProgress): string {
  const filled = Math.round((progress.percent / 100) * PROGRESS_BAR_WIDTH)
  const bar = '#'.repeat(filled) + '-'.repeat(PROGRESS_BAR_WIDTH - filled)
  return `[${bar}] ${progress.percent}%  ${progress.network} ${progress.blocksSeen}/${progress.blocksRequired} blocks`
}

export function printConfirmationProgress(progress: ConfirmationProgress): void {
  console.log(formatConfirmationProgress(progress))
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

export function printRelayEvent(payload: WebhookPayload, chargeId: string | undefined): void {
  console.log(`${payload.createdAt}  ${payload.event}  ${chargeId ?? '-'}`)
}

export function printDeliveryResult(event: string, result: DeliveryResult): void {
  if ('error' in result) {
    console.log(`${pc.red('-->')} ${event} [failed] ${result.error}`)
  } else {
    console.log(`${pc.cyan('-->')} ${event} [${result.status}] ${result.ms}ms`)
  }
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
