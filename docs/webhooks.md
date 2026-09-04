# webhooks

Thin wrapper over `klap.webhooks` in `@klappay/node`.

## `klap webhooks create`

```bash
klap webhooks create --url <url> [--event <event>]... [--category <category>]... [--env test|live]
```

```bash
# subscribe to specific events
klap webhooks create \
  --url https://example.com/webhooks \
  --event charge.confirmed --event charge.settled

# subscribe to an entire category
klap webhooks create --url https://example.com/webhooks --category payments

# subscribe to everything
klap webhooks create --url https://example.com/webhooks --event '*'

# accept the API's own default subscription — omit both flags
klap webhooks create --url https://example.com/webhooks
```

```
 TEST  — sandbox, no real funds
wh_f1e2d3c4b5
  url:              https://example.com/webhooks
  environment:      test
  events:           charge.confirmed, charge.settled
  eventCategories:  none
  secret:           whsec_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
  (shown once — store it now, it is used to verify delivered payloads)
```

The signing secret is printed **only here, in full** — `klap webhooks
list` never shows it again, only a masked hint. Save it immediately;
you'll need it to verify incoming deliveries with
`klap.webhooks.verifySignature()`/`constructEvent()` from `@klappay/node`.

## `klap webhooks list`

```bash
klap webhooks list [--env test|live]
```

```
wh_f1e2d3c4b5
  url:              https://example.com/webhooks
  environment:      test
  events:           charge.confirmed, charge.settled
  eventCategories:  none
  secret:           whsec_1a2b...c6d
```

## `klap webhooks deliveries`

```bash
klap webhooks deliveries <id> [--env test|live]
```

```bash
klap webhooks deliveries wh_f1e2d3c4b5
```

```
del_9z8y7x6w
  event:         charge.confirmed
  status:        delivered
  attempts:      1
  responseCode:  200
  createdAt:     2026-09-01T12:00:45.000Z

del_5v4u3t2s
  event:         charge.settled
  status:        failed
  attempts:      3
  responseCode:  500
  createdAt:     2026-09-01T12:01:10.000Z
```

## `klap webhooks retry`

```bash
klap webhooks retry <id> <deliveryId> [--env test|live]
```

```bash
klap webhooks retry wh_f1e2d3c4b5 del_5v4u3t2s
```

Re-queues a failed delivery for another attempt.

## `klap webhooks delete`

```bash
klap webhooks delete <id> [--env test|live]
```

```bash
klap webhooks delete wh_f1e2d3c4b5
```

## `klap webhooks trigger`

```bash
klap webhooks trigger <event> --url <url> --secret <secret> [--charge <id>] [--env test|live]
```

Signs a realistic webhook payload and delivers it straight to a local URL
— **no Core involved at all**, no charge, no registered webhook, no
login (unless you use `--charge`, see below). From your handler's
point of view it's indistinguishable from a real delivery: same
`X-Klap-Signature: t=<unix-seconds>,v1=<hex HMAC-SHA256>` header, same
`X-Klap-Event`/`X-Klap-Delivery` headers, same JSON shape. Use it to test
your handler's signature verification and parsing logic in isolation,
on demand, without waiting for anything real to happen.

`<event>` is any of the 13 real event types — the 10 `charge.*` lifecycle
events plus the 3 webhook-health events (`webhook.delivery_failed`,
`webhook.delivery_recovered`, `webhook.endpoint_unhealthy`) — **not**
`'*'`, which is a subscription filter, not a real event that gets
delivered. `--secret` is required and not generated for you: it has to
match whatever your handler actually verifies against — the secret
`klap webhooks create` printed for a real registered webhook, or one you
made up for local dev.

```bash
# the basic case — no login needed at all
klap webhooks trigger charge.confirmed \
  --url http://localhost:3000/webhooks --secret whsec_test123

# a webhook-health event — different data shape entirely
# ({ webhookId, url, failureRatio } instead of a Charge)
klap webhooks trigger webhook.endpoint_unhealthy \
  --url http://localhost:3000/webhooks --secret whsec_test123

# walk a handler through an entire lifecycle in one go
for event in charge.confirmed charge.partially_paid charge.underpaid charge.settled; do
  klap webhooks trigger "$event" \
    --url http://localhost:3000/webhooks --secret whsec_test123
done

# against a charge you actually created, instead of a synthesized fixture
klap charges create --amount 25 --accept USDC:base --expires-in 3600
# ↳ prints ch_a1b2c3d4e5 — use it below
klap webhooks trigger charge.confirmed \
  --url http://localhost:3000/webhooks --secret whsec_test123 \
  --charge ch_a1b2c3d4e5
```

```
--> charge.confirmed [200] 31ms
```

Prints `[failed] <message>` instead of a status code if the request
itself couldn't complete (connection refused, timeout after 8s) — the
same format `klap listen --forward-to` already uses, since both share
the same signing/delivery code underneath.

### `--charge <id>` — deliver a real charge's real data

By default, the payload's `data` is a synthesized fixture (the same
generator `klap fixtures charge` uses), shaped to match the event you
asked for (e.g. `charge.settled` gets a confirmed charge with
`settlementStatus: 'completed'`). Pass `--charge <id>` to fetch that
charge for real via `GET /v1/charges/{id}` and use its actual current
data instead — this is the one path that needs `klap login` and
`--env`. It delivers the charge's data **exactly as it is right now** —
it does not reshape it to match the event you named. Asking for
`charge.confirmed` on a charge that's still `pending` delivers a
`pending` charge under a `charge.confirmed` envelope; that's expected —
this command tests your handler's signature/parsing logic, not a real
state transition (that's what `klap sandbox trigger` is for). Only
valid for a `charge.*` event — combining it with a `webhook.*` event is
rejected with a clear error.

### `trigger` vs `sandbox trigger` vs `listen`

| | Touches Core? | Needs login? | What it proves |
|---|---|---|---|
| `klap webhooks trigger` | Never | Only with `--charge` | Your handler correctly verifies signatures and parses every payload shape |
| `klap sandbox trigger` | Yes — mutates a real `test` charge | Yes | The real event actually fires and is delivered end-to-end |
| `klap listen` | Yes — relays real dispatched events | Yes | What's actually happening on your account right now |

## Testing without a public endpoint

You don't need `klap webhooks create` at all to develop locally — see
[Listen](/listen), which streams every event straight to your own
`localhost` without registering anything, or `klap webhooks trigger`
above for testing your handler in complete isolation.
