import { describe, expect, it } from 'vitest'
import { buildChargeFixture } from './fixtures'
import { formatChargeRow, formatConfirmationProgress, formatPayerEvidence } from './print'

describe('formatConfirmationProgress', () => {
  it('renders an empty bar at 0%', () => {
    const line = formatConfirmationProgress({
      network: 'base',
      percent: 0,
      blocksSeen: 0,
      blocksRequired: 12,
    })
    expect(line).toBe('[--------------------] 0%  base 0/12 blocks')
  })

  it('renders a full bar at 100%', () => {
    const line = formatConfirmationProgress({
      network: 'polygon',
      percent: 100,
      blocksSeen: 12,
      blocksRequired: 12,
    })
    expect(line).toBe('[####################] 100%  polygon 12/12 blocks')
  })

  it('rounds a partial percentage to the nearest bar segment', () => {
    const line = formatConfirmationProgress({
      network: 'ethereum',
      percent: 33,
      blocksSeen: 4,
      blocksRequired: 12,
    })
    expect(line).toBe('[#######-------------] 33%  ethereum 4/12 blocks')
  })
})

describe('formatPayerEvidence', () => {
  it('prints a single hint line when the check had no paying transaction', () => {
    const lines = formatPayerEvidence({
      transactionSender: null,
      tokenSenders: [],
      userOperationSenders: [],
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/none \(pass --tx-hash and --network/)
  })

  it('lists every sender when a relayed transaction paid', () => {
    const lines = formatPayerEvidence({
      transactionSender: '0xRelayer',
      tokenSenders: ['0xWalletA', '0xWalletB'],
      userOperationSenders: [],
    })
    expect(lines).toEqual([
      '  payer evidence:',
      '    transactionSender:     0xRelayer',
      '    tokenSenders:          0xWalletA, 0xWalletB',
      '    userOperationSenders:  none',
    ])
  })
})

describe('formatChargeRow', () => {
  it('prints id, padded status, right-aligned amount with currency, and createdAt', () => {
    const charge = {
      ...buildChargeFixture({ status: 'confirmed' }),
      id: 'ch_a1b2c3d4e5',
      amount: 10,
      createdAt: '2026-10-12T14:02:11.000Z',
    }
    expect(formatChargeRow(charge)).toBe(
      'ch_a1b2c3d4e5  confirmed               10 USD  2026-10-12T14:02:11.000Z',
    )
  })

  it('keeps columns aligned for the longest status', () => {
    const charge = { ...buildChargeFixture({ status: 'partially_paid', amount: 49.9 }), id: 'ch_x' }
    expect(formatChargeRow(charge)).toMatch(/^ch_x {2}partially_paid {2} {6}49\.9 USD {2}/)
  })
})
