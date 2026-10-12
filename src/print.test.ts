import { KlapApiError } from '@klappay/node'
import { describe, expect, it } from 'vitest'
import { buildChargeFixture } from './fixtures'
import {
  formatApiError,
  formatBaseUnits,
  formatChargeRow,
  formatConfirmationProgress,
  formatEscrow,
  formatEscrowSafeTransaction,
  formatPayerEvidence,
} from './print'

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

describe('formatBaseUnits', () => {
  it.each([
    ['1500000', 6, '1.5'],
    ['1000000', 6, '1'],
    ['1', 6, '0.000001'],
    ['0', 6, '0'],
    ['42', 0, '42'],
    ['123456789012345678901', 18, '123.456789012345678901'],
  ])('formats %s with %i decimals as %s', (amount, decimals, expected) => {
    expect(formatBaseUnits(amount, decimals)).toBe(expected)
  })
})

describe('formatEscrow', () => {
  it('prints nothing for a non-escrow charge', () => {
    expect(formatEscrow(null)).toEqual([])
  })

  it('prints the releaser and when the escrow was released', () => {
    expect(
      formatEscrow({
        releaserAddress: '0xReleaser',
        releasedAt: '2026-10-12T15:00:00.000Z',
        refundedAt: null,
      }),
    ).toEqual([
      '  escrow:',
      '    releaserAddress:  0xReleaser',
      '    releasedAt:       2026-10-12T15:00:00.000Z',
      '    refundedAt:       null',
    ])
  })
})

describe('formatEscrowSafeTransaction', () => {
  it('shows the human amount next to the exact base units and the destination', () => {
    const lines = formatEscrowSafeTransaction({
      action: 'refund',
      network: 'base',
      token: 'USDC',
      chainId: 8453,
      safeAddress: `0x${'1'.repeat(40)}`,
      releaserAddress: `0x${'2'.repeat(40)}`,
      tokenAddress: `0x${'3'.repeat(40)}`,
      destination: `0x${'4'.repeat(40)}`,
      amount: '49900000',
      decimals: 6,
      nonce: '0',
      safeTxHash: `0x${'5'.repeat(64)}`,
      typedData: {
        domain: { chainId: 8453, verifyingContract: `0x${'1'.repeat(40)}` },
        types: { SafeTx: [] },
        primaryType: 'SafeTx',
        message: {
          to: `0x${'3'.repeat(40)}`,
          value: '0',
          data: '0x',
          operation: 0,
          safeTxGas: '0',
          baseGas: '0',
          gasPrice: '0',
          gasToken: `0x${'0'.repeat(40)}`,
          refundReceiver: `0x${'0'.repeat(40)}`,
          nonce: '0',
        },
      },
    })
    expect(lines).toContain('  amount:           49.9 USDC (49900000 base units)')
    expect(lines).toContain(`  destination:      0x${'4'.repeat(40)}`)
    expect(lines).toContain('  network:          base (chain id 8453)')
  })
})

describe('formatApiError', () => {
  it('adds a re-prepare hint to escrow_invalid_signature', () => {
    const lines = formatApiError(new KlapApiError(400, 'escrow_invalid_signature', 'bad sig'))
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('escrow_invalid_signature: bad sig')
    expect(lines[1]).toMatch(/prepare-release\/prepare-refund again and re-sign/)
  })

  it('tells the user escrow_safe_mismatch is not transient', () => {
    const lines = formatApiError(new KlapApiError(422, 'escrow_safe_mismatch', 'mismatch'))
    expect(lines[1]).toMatch(/^Not transient/)
  })

  it('prints just the code and message for errors without a hint', () => {
    const lines = formatApiError(new KlapApiError(404, 'not_found', 'Charge not found'))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('not_found: Charge not found')
  })
})
