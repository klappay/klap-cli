import { describe, expect, it } from 'vitest'
import { parseTriggerableWebhookEvent, parseWebhookCategory, parseWebhookEvent } from './webhooks'

describe('parseWebhookEvent', () => {
  it('accepts the wildcard', () => {
    expect(parseWebhookEvent('*')).toBe('*')
  })

  it('accepts a real webhook event', () => {
    expect(parseWebhookEvent('charge.confirmed')).toBe('charge.confirmed')
  })

  it('rejects a made-up event name', () => {
    expect(() => parseWebhookEvent('charge.exploded')).toThrow(/--event must be/)
  })
})

describe('parseTriggerableWebhookEvent', () => {
  it('accepts a charge event', () => {
    expect(parseTriggerableWebhookEvent('charge.confirmed')).toBe('charge.confirmed')
  })

  it('accepts a webhook-health event', () => {
    expect(parseTriggerableWebhookEvent('webhook.endpoint_unhealthy')).toBe(
      'webhook.endpoint_unhealthy',
    )
  })

  it('rejects the wildcard — it is a subscription filter, not a real event', () => {
    expect(() => parseTriggerableWebhookEvent('*')).toThrow(/event must be one of/)
  })

  it('rejects a made-up event name', () => {
    expect(() => parseTriggerableWebhookEvent('charge.exploded')).toThrow(/event must be one of/)
  })
})

describe('parseWebhookCategory', () => {
  it('accepts a real category', () => {
    expect(parseWebhookCategory('payments')).toBe('payments')
  })

  it('rejects an unknown category', () => {
    expect(() => parseWebhookCategory('billing')).toThrow(/--category must be one of/)
  })
})
