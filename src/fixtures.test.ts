import { WebhookPayloadSchema } from '@klappay/types'
import { describe, expect, it } from 'vitest'
import {
  buildChargeFixture,
  buildWebhookHealthFixture,
  buildWebhookPayloadFixture,
} from './fixtures'

describe('buildChargeFixture', () => {
  it('defaults to a fresh pending charge', () => {
    const charge = buildChargeFixture()
    expect(charge.status).toBe('pending')
    expect(charge.amountReceived).toBeNull()
    expect(charge.paidWith).toEqual([])
    expect(charge.isOverpaid).toBe(false)
  })

  it('fills in a partial payment for partially_paid', () => {
    const charge = buildChargeFixture({ status: 'partially_paid', amount: 100 })
    expect(charge.amountReceived).toBe(50)
    expect(charge.paidWith).toHaveLength(1)
  })

  it('marks confirmed charges as paid in full', () => {
    const charge = buildChargeFixture({ status: 'confirmed', amount: 100 })
    expect(charge.amountReceived).toBe(100)
    expect(charge.confirmedAt).not.toBeNull()
  })

  it('overrides status to confirmed and inflates amountReceived when overpaid', () => {
    const charge = buildChargeFixture({ status: 'pending', amount: 100, overpaid: true })
    expect(charge.status).toBe('confirmed')
    expect(charge.isOverpaid).toBe(true)
    expect(charge.amountReceived).toBe(150)
  })

  it('backdates expiresAt for expired charges', () => {
    const charge = buildChargeFixture({ status: 'expired' })
    expect(new Date(charge.expiresAt).getTime()).toBeLessThan(Date.now())
  })

  it('points checkoutUrl at the stage domain for test and prod domain for live', () => {
    const test = buildChargeFixture({ environment: 'test' })
    expect(test.checkoutUrl).toBe(`https://pay.stage.klappay.com/c/${test.id}`)

    const live = buildChargeFixture({ environment: 'live' })
    expect(live.checkoutUrl).toBe(`https://pay.klappay.com/c/${live.id}`)
  })

  it('deducts the fee from amount when the merchant pays it (default)', () => {
    const charge = buildChargeFixture({ amount: 100 })
    expect(charge.feePayer).toBe('merchant')
    expect(charge.feePercent).toBe(1)
    expect(charge.feeAmount).toBe(1)
    expect(charge.merchantAmount).toBe(99)
  })

  it('leaves merchantAmount equal to amount when the payer covers the fee', () => {
    const charge = buildChargeFixture({ amount: 100, feePayer: 'payer' })
    expect(charge.merchantAmount).toBe(100)
    expect(charge.feeAmount).toBe(1)
  })

  it('only sets settledAt when settlementStatus is completed', () => {
    const failed = buildChargeFixture({ status: 'confirmed', settlementStatus: 'failed' })
    expect(failed.settlementStatus).toBe('failed')
    expect(failed.settledAt).toBeNull()

    const completed = buildChargeFixture({ status: 'confirmed', settlementStatus: 'completed' })
    expect(completed.settledAt).not.toBeNull()
  })
})

describe('buildWebhookHealthFixture', () => {
  it('produces a WebhookHealthEventData shape', () => {
    const health = buildWebhookHealthFixture()
    expect(health.webhookId).toMatch(/^wh_fixture_/)
    expect(typeof health.url).toBe('string')
    expect(health.failureRatio).toBeGreaterThan(0)
  })
})

describe('buildWebhookPayloadFixture', () => {
  it('wraps a Charge fixture for a charge.* event, valid against WebhookPayloadSchema', () => {
    const payload = buildWebhookPayloadFixture('charge.confirmed')
    expect(payload.event).toBe('charge.confirmed')
    expect(WebhookPayloadSchema.safeParse(payload).success).toBe(true)
    expect(payload.data).toMatchObject({ status: 'confirmed' })
  })

  it('derives the right charge status per event', () => {
    const settled = buildWebhookPayloadFixture('charge.settled')
    expect(settled.data).toMatchObject({ settlementStatus: 'completed' })

    const overpaid = buildWebhookPayloadFixture('charge.overpaid')
    expect(overpaid.data).toMatchObject({ isOverpaid: true })
  })

  it('uses the given real charge data instead of a fixture when provided', () => {
    const realCharge = buildChargeFixture({ status: 'confirmed', amount: 12.34 })
    const payload = buildWebhookPayloadFixture('charge.confirmed', realCharge)
    expect(payload.data).toBe(realCharge)
  })

  it('wraps a WebhookHealthEventData fixture for a webhook.* event', () => {
    const payload = buildWebhookPayloadFixture('webhook.endpoint_unhealthy')
    expect(WebhookPayloadSchema.safeParse(payload).success).toBe(true)
    expect(payload.data).toMatchObject({ webhookId: expect.stringMatching(/^wh_fixture_/) })
  })
})
