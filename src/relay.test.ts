import { describe, expect, it } from 'vitest'
import { extractChargeId, parseSessionSecret } from './relay'

describe('extractChargeId', () => {
  it('extracts the id from a charge-shaped payload', () => {
    expect(extractChargeId({ id: 'ch_abc123', status: 'confirmed' })).toBe('ch_abc123')
  })

  it('returns undefined for a payload with no id field', () => {
    expect(extractChargeId({ webhookId: 'wh_abc' })).toBeUndefined()
  })

  it('returns undefined for a non-object payload', () => {
    expect(extractChargeId('ch_abc123')).toBeUndefined()
    expect(extractChargeId(null)).toBeUndefined()
  })
})

describe('parseSessionSecret', () => {
  it('extracts the secret from a well-formed session payload', () => {
    expect(parseSessionSecret({ secret: 'whsec_abc' })).toBe('whsec_abc')
  })

  it('throws on a payload missing the secret field', () => {
    expect(() => parseSessionSecret({})).toThrow(/malformed session event/)
  })

  it('throws on a non-object payload', () => {
    expect(() => parseSessionSecret('whsec_abc')).toThrow(/malformed session event/)
  })
})
