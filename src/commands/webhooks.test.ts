import { describe, expect, it } from 'vitest'
import { parseWebhookCategory, parseWebhookEvent } from './webhooks'

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

describe('parseWebhookCategory', () => {
  it('accepts a real category', () => {
    expect(parseWebhookCategory('payments')).toBe('payments')
  })

  it('rejects an unknown category', () => {
    expect(() => parseWebhookCategory('billing')).toThrow(/--category must be one of/)
  })
})
