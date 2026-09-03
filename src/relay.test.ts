import { describe, expect, it } from 'vitest'
import { parseSessionSecret } from './relay'

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
