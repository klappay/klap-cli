import { describe, expect, it } from 'vitest'
import { parseSettlementStatus, parseStatus } from './fixtures'

describe('parseStatus', () => {
  it('accepts a real charge status', () => {
    expect(parseStatus('underpaid')).toBe('underpaid')
  })

  it('rejects an unknown status', () => {
    expect(() => parseStatus('cancelled')).toThrow(/--status must be one of/)
  })
})

describe('parseSettlementStatus', () => {
  it('accepts a real settlement status', () => {
    expect(parseSettlementStatus('failed')).toBe('failed')
  })

  it('rejects an unknown settlement status', () => {
    expect(() => parseSettlementStatus('done')).toThrow(/--settlement must be one of/)
  })
})
