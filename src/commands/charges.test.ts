import { describe, expect, it } from 'vitest'
import {
  parseAcceptedPayment,
  parseCheckChargeOptions,
  parseFeePayer,
  parseListChargesOptions,
} from './charges'

describe('parseAcceptedPayment', () => {
  it('parses a valid TOKEN:NETWORK pair', () => {
    expect(parseAcceptedPayment('USDC:base')).toEqual({ token: 'USDC', network: 'base' })
  })

  it.each([
    ['USDT:tron', 'USDT', 'tron'],
    ['USDC:arc', 'USDC', 'arc'],
    ['USDC:bnb', 'USDC', 'bnb'],
  ])('accepts %s (tron, arc and bnb pairs)', (pair, token, network) => {
    expect(parseAcceptedPayment(pair)).toEqual({ token, network })
  })

  it('throws when the pair has no colon', () => {
    expect(() => parseAcceptedPayment('USDC')).toThrow(/TOKEN:NETWORK/)
  })

  it('throws on an unknown token', () => {
    expect(() => parseAcceptedPayment('DOGE:base')).toThrow(/token must be one of/)
  })

  it('throws on an unknown network', () => {
    expect(() => parseAcceptedPayment('USDC:solana')).toThrow(/network must be one of/)
  })
})

describe('parseFeePayer', () => {
  it('accepts merchant', () => {
    expect(parseFeePayer('merchant')).toBe('merchant')
  })

  it('accepts payer', () => {
    expect(parseFeePayer('payer')).toBe('payer')
  })

  it('rejects anything else', () => {
    expect(() => parseFeePayer('customer')).toThrow(/--fee-payer must be one of/)
  })
})

describe('parseListChargesOptions', () => {
  it('defaults the page size to 20 when no flags are passed', () => {
    expect(parseListChargesOptions({})).toEqual({ limit: 20 })
  })

  it('maps every flag onto the list filter, coercing --limit to a number', () => {
    expect(
      parseListChargesOptions({
        status: 'confirmed',
        token: 'USDC',
        network: 'base',
        since: '2026-10-01T00:00:00.000Z',
        limit: '50',
        cursor: 'abc',
      }),
    ).toEqual({
      status: 'confirmed',
      token: 'USDC',
      network: 'base',
      since: '2026-10-01T00:00:00.000Z',
      limit: 50,
      cursor: 'abc',
    })
  })

  it('maps --overpaid to true and --no-overpaid to false, leaving it unset otherwise', () => {
    expect(parseListChargesOptions({ overpaid: true }).isOverpaid).toBe(true)
    expect(parseListChargesOptions({ overpaid: false }).isOverpaid).toBe(false)
    expect(parseListChargesOptions({}).isOverpaid).toBeUndefined()
  })

  it('rejects an unknown status, naming the flag', () => {
    expect(() => parseListChargesOptions({ status: 'paid' })).toThrow(/^--status: /)
  })

  it('rejects a --limit above the API maximum', () => {
    expect(() => parseListChargesOptions({ limit: '101' })).toThrow(/^--limit: /)
  })

  it('rejects a non-numeric --limit', () => {
    expect(() => parseListChargesOptions({ limit: 'ten' })).toThrow(/^--limit: /)
  })

  it('rejects a --since that is not an ISO datetime', () => {
    expect(() => parseListChargesOptions({ since: 'yesterday' })).toThrow(/^--since: /)
  })
})

describe('parseCheckChargeOptions', () => {
  const txHash = `0x${'ab'.repeat(32)}`

  it('accepts no hint at all', () => {
    expect(parseCheckChargeOptions({})).toEqual({})
  })

  it('accepts --tx-hash together with --network', () => {
    expect(parseCheckChargeOptions({ txHash, network: 'base' })).toEqual({
      txHash,
      network: 'base',
    })
  })

  it('rejects --tx-hash without --network', () => {
    expect(() => parseCheckChargeOptions({ txHash })).toThrow(/must be passed together/)
  })

  it('rejects --network without --tx-hash', () => {
    expect(() => parseCheckChargeOptions({ network: 'base' })).toThrow(/must be passed together/)
  })

  it('rejects a --tx-hash that is not 32 bytes of hex', () => {
    expect(() => parseCheckChargeOptions({ txHash: '0x1234', network: 'base' })).toThrow(
      /^--tx-hash: /,
    )
  })

  it('rejects an unknown --network', () => {
    expect(() => parseCheckChargeOptions({ txHash, network: 'solana' })).toThrow(/^--network: /)
  })
})
