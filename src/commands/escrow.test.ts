import { describe, expect, it } from 'vitest'
import { parseEscrowSignature } from './escrow'

describe('parseEscrowSignature', () => {
  const signature = `0x${'a1'.repeat(65)}`

  it.each(['release', 'refund'] as const)('accepts a hex signature for %s', (action) => {
    expect(parseEscrowSignature(action, signature)).toBe(signature)
  })

  it('rejects a signature without the 0x prefix', () => {
    expect(() => parseEscrowSignature('release', 'a1'.repeat(65))).toThrow(
      /^--signature must be hex-encoded signature bytes/,
    )
  })

  it('rejects non-hex characters', () => {
    expect(() => parseEscrowSignature('refund', '0xnothex')).toThrow(/--signature must be hex/)
  })

  it('rejects a bare 0x', () => {
    expect(() => parseEscrowSignature('release', '0x')).toThrow(/--signature must be hex/)
  })
})
