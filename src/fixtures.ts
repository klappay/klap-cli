import { randomBytes } from 'node:crypto'
import type {
  AcceptedPayment,
  Charge,
  ChargeFeePayer,
  ChargeStatus,
  ChargeWebhookEventTypeSchema,
  SelfSettlement,
  SettlementStatus,
  WebhookEventType,
  WebhookHealthEventData,
  WebhookPayload,
} from '@klappay/types'

export type ChargeFixtureOptions = {
  status?: ChargeStatus
  amount?: number
  acceptedPayments?: AcceptedPayment[]
  overpaid?: boolean
  settlementStatus?: SettlementStatus
  environment?: 'test' | 'live'
  feePayer?: ChargeFeePayer
  feePercent?: number
}

const FIXTURE_GAS_FEE = 0.05

function randomAddress(): string {
  return `0x${randomBytes(20).toString('hex')}`
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

function buildSelfSettlementFixture(
  splitAddress: string,
  acceptedPayments: AcceptedPayment[],
): SelfSettlement {
  return {
    splitAddress,
    recipients: [
      { address: randomAddress(), percentAllocation: 99 },
      { address: randomAddress(), percentAllocation: 1 },
    ],
    distributorFeePercent: 0,
    salt: `0x${randomBytes(32).toString('hex')}`,
    pairs: acceptedPayments.map(({ network, token }) => ({ network, token })),
  }
}

/**
 * A realistic `Charge` object for the given lifecycle status — no API call,
 * no testnet funds. Mirrors the fixture pattern already used in
 * klap-checkout/klap-checkout-kit's own tests, just exposed as a CLI command.
 */
export function buildChargeFixture(options: ChargeFixtureOptions = {}): Charge {
  const status = options.status ?? 'pending'
  const overpaid = options.overpaid ?? false
  const requestedAmount = options.amount ?? 49.9
  const acceptedPayments = options.acceptedPayments ?? [{ token: 'USDC', network: 'base' }]
  const environment = options.environment ?? 'test'

  // ponytail: real fee-tier and gas-quote math lives in klap-core, not
  // reproduced here. 'merchant' takes the fee out of the requested amount,
  // 'payer' leaves it as the merchant's full take, and the gas fee is a
  // flat value. Close enough for a local fixture's shape.
  const feePayer = options.feePayer ?? 'merchant'
  const feePercent = options.feePercent ?? 1
  const feeAmount = roundCents(requestedAmount * (feePercent / 100))
  const merchantAmount =
    feePayer === 'payer' ? requestedAmount : roundCents(requestedAmount - feeAmount)
  const amount = roundCents(merchantAmount + feeAmount + FIXTURE_GAS_FEE)

  const now = new Date()
  const isPast = status === 'expired'
  const expiresAt = new Date(now.getTime() + (isPast ? -3_600_000 : 3_600_000)).toISOString()

  const hasPaid =
    overpaid || status === 'partially_paid' || status === 'confirmed' || status === 'underpaid'
  const paidWith = hasPaid ? acceptedPayments.slice(0, 1) : []
  const amountReceived = overpaid
    ? amount * 1.5
    : status === 'confirmed'
      ? amount
      : status === 'partially_paid' || status === 'underpaid'
        ? amount / 2
        : null

  const confirmed = overpaid || status === 'confirmed'
  const settlementStatus = confirmed ? (options.settlementStatus ?? null) : null
  const id = `ch_fixture_${randomBytes(6).toString('hex')}`
  const checkoutDomain = environment === 'live' ? 'pay.klappay.com' : 'pay.stage.klappay.com'
  const address = randomAddress()

  return {
    id,
    amount,
    requestedAmount,
    amountReceived,
    isOverpaid: overpaid,
    currency: 'USD',
    feePayer,
    feePercent,
    feeAmount,
    gasFeeAmount: FIXTURE_GAS_FEE,
    merchantAmount,
    acceptedPayments,
    paidWith,
    swapAlternatives: [],
    address,
    status: overpaid ? 'confirmed' : status,
    settlementStatus,
    selfSettlement:
      settlementStatus === 'below_minimum'
        ? buildSelfSettlementFixture(address, acceptedPayments)
        : undefined,
    environment,
    apiKeyId: null,
    txHash: null,
    externalRef: null,
    source: null,
    metadata: null,
    redirectUrl: null,
    checkoutUrl: `https://${checkoutDomain}/c/${id}`,
    splitRecipients: [],
    escrow: null,
    createdAt: now.toISOString(),
    expiresAt,
    confirmedAt: confirmed ? now.toISOString() : null,
    settledAt: settlementStatus === 'completed' ? now.toISOString() : null,
    lastActivityAt: now.toISOString(),
  }
}

type ChargeWebhookEventType = (typeof ChargeWebhookEventTypeSchema.options)[number]

const CHARGE_EVENT_FIXTURE: Record<ChargeWebhookEventType, ChargeFixtureOptions> = {
  'charge.created': { status: 'pending' },
  'charge.partially_paid': { status: 'partially_paid' },
  'charge.confirmed': { status: 'confirmed' },
  'charge.expired': { status: 'expired' },
  'charge.underpaid': { status: 'underpaid' },
  'charge.settled': { status: 'confirmed', settlementStatus: 'completed' },
  'charge.settlement_failed': { status: 'confirmed', settlementStatus: 'failed' },
  'charge.settlement_below_minimum': { status: 'confirmed', settlementStatus: 'below_minimum' },
  'charge.overpaid': { status: 'pending', overpaid: true },
  // ponytail: buildChargeFixture has no escrow shape yet — these two just
  // render as a plain confirmed charge; add one if a handler under test
  // actually needs `charge.escrow` populated.
  'charge.escrow_released': { status: 'confirmed' },
  'charge.escrow_refunded': { status: 'confirmed' },
}

export function isChargeEvent(event: WebhookEventType): event is ChargeWebhookEventType {
  return event in CHARGE_EVENT_FIXTURE
}

export function buildWebhookHealthFixture(): WebhookHealthEventData {
  return {
    webhookId: `wh_fixture_${randomBytes(6).toString('hex')}`,
    url: 'https://example.com/webhooks',
    failureRatio: 0.42,
  }
}

/**
 * The full payload `klap webhooks trigger` signs and delivers. `chargeData`
 * lets a caller substitute a real fetched charge for the synthesized
 * fixture — ignored for a `webhook.*` event, which has no charge to speak of.
 */
export function buildWebhookPayloadFixture(
  event: WebhookEventType,
  chargeData?: Charge,
): WebhookPayload {
  const data = isChargeEvent(event)
    ? (chargeData ?? buildChargeFixture(CHARGE_EVENT_FIXTURE[event]))
    : buildWebhookHealthFixture()

  return {
    id: `evt_fixture_${randomBytes(6).toString('hex')}`,
    event,
    createdAt: new Date().toISOString(),
    data,
  }
}
