import { streamSSEEvents } from '@klappay/node'
import { type WebhookPayload, WebhookPayloadSchema } from '@klappay/types'

export type RelayEvent =
  | { type: 'session'; secret: string }
  | { type: 'webhook'; payload: WebhookPayload }

export function parseSessionSecret(data: unknown): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as { secret?: unknown }).secret === 'string'
  ) {
    return (data as { secret: string }).secret
  }
  throw new Error(`Relay sent a malformed session event: ${JSON.stringify(data)}`)
}

export async function* connectToRelay(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal,
): AsyncGenerator<RelayEvent> {
  const events = streamSSEEvents<unknown>({ baseUrl, apiKey }, '/v1/webhooks/listen', signal)
  for await (const { event, data } of events) {
    if (event === 'session') yield { type: 'session', secret: parseSessionSecret(data) }
    else if (event === 'webhook')
      yield { type: 'webhook', payload: WebhookPayloadSchema.parse(data) }
  }
}
