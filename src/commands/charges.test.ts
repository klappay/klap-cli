import { describe, expect, it } from 'vitest'
import { parseAcceptedPayment, parseFeePayer } from './charges'

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
