import { verifyWebhookSignature } from '@klappay/node'
import { describe, expect, it } from 'vitest'
import { signWebhookPayload } from './webhook-delivery'

describe('signWebhookPayload', () => {
  it('produces a signature @klappay/node itself accepts as valid', () => {
    const body = JSON.stringify({ id: 'evt_1', event: 'charge.confirmed', data: {} })
    const secret = 'whsec_test123'

    const header = signWebhookPayload(body, secret)

    expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/)
    expect(verifyWebhookSignature(body, header, secret)).toBe(true)
  })

  it('fails verification against the wrong secret', () => {
    const body = JSON.stringify({ id: 'evt_1', event: 'charge.confirmed', data: {} })
    const header = signWebhookPayload(body, 'whsec_test123')

    expect(verifyWebhookSignature(body, header, 'whsec_different')).toBe(false)
  })

  it('fails verification if the body is tampered with after signing', () => {
    const secret = 'whsec_test123'
    const header = signWebhookPayload(JSON.stringify({ id: 'evt_1' }), secret)

    expect(verifyWebhookSignature(JSON.stringify({ id: 'evt_2' }), header, secret)).toBe(false)
  })
})
