import { verifyWebhookSignature } from '@klappay/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildWebhookPayloadFixture } from './fixtures'
import { deliverWebhook, signWebhookPayload } from './webhook-delivery'

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

describe('deliverWebhook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the same header names a real Klap delivery uses', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const payload = buildWebhookPayloadFixture('charge.confirmed')
    const secret = 'whsec_test123'

    await deliverWebhook('http://localhost:3000/webhooks', payload, secret)

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = new Headers(init?.headers)
    expect(headers.get('X-Klappay-Event')).toBe('charge.confirmed')
    expect(headers.get('X-Klappay-Delivery')).toBe(payload.id)
    expect(
      verifyWebhookSignature(String(init?.body), headers.get('X-Klappay-Signature') ?? '', secret),
    ).toBe(true)
    expect(headers.get('X-Klap-Signature')).toBeNull()
  })
})
