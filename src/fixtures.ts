import { randomBytes } from 'node:crypto'
import type { AcceptedPayment, Charge, ChargeStatus, SettlementStatus } from '@klappay/types'

export type ChargeFixtureOptions = {
  status?: ChargeStatus
  amount?: number
  acceptedPayments?: AcceptedPayment[]
  overpaid?: boolean
  settlementStatus?: SettlementStatus
  environment?: 'test' | 'live'
}

function randomAddress(): string {
  return `0x${randomBytes(20).toString('hex')}`
}

/**
 * A realistic `Charge` object for the given lifecycle status — no API call,
 * no testnet funds. Mirrors the fixture pattern already used in
 * klap-checkout/klap-checkout-kit's own tests, just exposed as a CLI command.
 */
export function buildChargeFixture(options: ChargeFixtureOptions = {}): Charge {
  const status = options.status ?? 'pending'
  const overpaid = options.overpaid ?? false
  const amount = options.amount ?? 49.9
  const acceptedPayments = options.acceptedPayments ?? [{ token: 'USDC', network: 'base' }]
  const environment = options.environment ?? 'test'

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

  return {
    id,
    amount,
    amountReceived,
    isOverpaid: overpaid,
    currency: 'USD',
    acceptedPayments,
    paidWith,
    swapAlternatives: [],
    address: randomAddress(),
    status: overpaid ? 'confirmed' : status,
    settlementStatus,
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
