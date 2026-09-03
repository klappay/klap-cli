import { describe, expect, it } from 'vitest'
import { buildChargeFixture } from './fixtures'

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

  it('only sets settledAt when settlementStatus is completed', () => {
    const failed = buildChargeFixture({ status: 'confirmed', settlementStatus: 'failed' })
    expect(failed.settlementStatus).toBe('failed')
    expect(failed.settledAt).toBeNull()

    const completed = buildChargeFixture({ status: 'confirmed', settlementStatus: 'completed' })
    expect(completed.settledAt).not.toBeNull()
  })
})
