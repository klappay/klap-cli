import { describe, expect, it } from 'vitest'
import { parseAcceptedPayment } from './charges'

describe('parseAcceptedPayment', () => {
  it('parses a valid TOKEN:NETWORK pair', () => {
    expect(parseAcceptedPayment('USDC:base')).toEqual({ token: 'USDC', network: 'base' })
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
