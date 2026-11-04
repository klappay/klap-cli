import { describe, expect, it } from 'vitest'
import { extractChargeId, parseRelayWebhook, parseSessionSecret } from './relay'

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

describe('parseRelayWebhook', () => {
  const payload = {
    id: 'evt_1',
    event: 'webhook.endpoint_unhealthy',
    createdAt: '2026-11-04T00:00:00.000Z',
    data: { webhookId: 'wh_1', url: 'https://example.com', failureRatio: 0.5 },
  }

  it('passes through an event this version knows', () => {
    expect(parseRelayWebhook(payload)).toEqual({ type: 'webhook', payload })
  })

  it('reports an event newer than this version by name instead of throwing', () => {
    expect(parseRelayWebhook({ ...payload, event: 'charge.from_the_future' })).toEqual({
      type: 'unrecognized',
      event: 'charge.from_the_future',
    })
  })

  it('reports a known event with a malformed envelope', () => {
    expect(parseRelayWebhook({ event: 'charge.confirmed' })).toEqual({
      type: 'unrecognized',
      event: 'charge.confirmed',
    })
  })

  it.each([null, 'charge.confirmed', { event: 42 }])('falls back to "unknown" for %j', (data) => {
    expect(parseRelayWebhook(data)).toEqual({ type: 'unrecognized', event: 'unknown' })
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
