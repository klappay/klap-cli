import { createHmac } from 'node:crypto'
import type { WebhookPayload } from '@klappay/types'

const DELIVERY_TIMEOUT_MS = 8_000

export function signWebhookPayload(rawBody: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  return `t=${timestamp},v1=${signature}`
}

export type DeliveryResult = { status: number; ms: number } | { error: string; ms: number }

export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload)
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Klap-Signature': signWebhookPayload(body, secret),
        'X-Klap-Event': payload.event,
        'X-Klap-Delivery': payload.id,
      },
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    })
    return { status: res.status, ms: Date.now() - start }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ms: Date.now() - start }
  }
}
