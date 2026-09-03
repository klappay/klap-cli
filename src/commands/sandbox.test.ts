import { describe, expect, it } from 'vitest'
import { parseTriggerableEvent } from './sandbox'

describe('parseTriggerableEvent', () => {
  it('accepts a real triggerable charge event', () => {
    expect(parseTriggerableEvent('charge.confirmed')).toBe('charge.confirmed')
  })

  it('rejects an event that is not triggerable (e.g. charge.created)', () => {
    expect(() => parseTriggerableEvent('charge.created')).toThrow(/event must be one of/)
  })

  it('rejects a made-up event name', () => {
    expect(() => parseTriggerableEvent('payout_address.changed')).toThrow(/event must be one of/)
  })
})
