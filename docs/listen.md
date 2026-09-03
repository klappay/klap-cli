# `klap listen` — how it works, and why it's safe

```bash
klap listen --forward-to http://localhost:3000/webhooks --env test
```

`--env` picks which key connects (only required if you have both a
`test` and a `live` key configured — see [`configuration.md`](./configuration.md)).
This is what determines which charge events you see; see "Environment
scoping" below.

## It is not a tunnel

Tools like ngrok expose your machine to the internet — they open an
**inbound** path so an outside service can reach `localhost`. `klap listen`
does the opposite: the connection is always initiated **from your
machine, outward**, to the Klap API. Klap's servers never make an inbound
request to your laptop; they push events over a connection your own CLI
process already opened.

```
your machine                          Klap's servers
┌─────────────┐                      ┌──────────────────┐
│ klap listen │──(1) outbound conn───▶│ GET /v1/webhooks/listen│
│             │◀─(2) event pushed────│  (SSE)             │
└──────┬──────┘                      └──────────────────┘
       │
       │ (3) POST — made by your own CLI process,
       ▼     never by Klap's servers
your local server (--forward-to)
```

Step 3 is the key: it's the CLI, running on your machine, that makes the
local HTTP call — not Klap's backend. Klap's servers never see or resolve
`localhost`; they only ever talk to the outbound connection your CLI
opened. There is no new inbound exposure to reason about.

## Real signatures, every time

Each connection gets its own ephemeral signing secret (`whsec_...`),
generated when you connect and **never persisted** — different from the
real secret behind any webhook you've registered with
`POST /v1/webhooks`. `klap listen` signs every forwarded payload with it
using the exact same scheme a real webhook delivery uses:
`X-Klap-Signature: t=<unix-seconds>,v1=<hex-encoded HMAC-SHA256 of
"{timestamp}.{raw body}">`. Your handler code doesn't need a special
"test mode" branch — the same signature verification you ship to
production works unchanged while testing locally.

## What it's built on

`GET /v1/webhooks/listen` (authenticated with your API key) streams every
webhook event dispatched for your organization — regardless of whether
you have any webhook registered — as Server-Sent Events. This is the same
mechanism documented in the main API docs' `realtime.md`, generalized
from "one charge" to "every event for this org." Combine it with
[`klap sandbox trigger`](./commands.md#klap-sandbox-trigger) to drive events on
demand instead of waiting for a real payment.

## Environment scoping

Charge events (the `payments` category — `charge.confirmed`, etc.) are
filtered server-side to match the environment of the key you connected
with: a `test` key never sees `live` charge events, and vice versa. This
isn't optional or client-side — it's enforced in the same request handler
that streams the events, so there's no way to see across the boundary by
mistake, only by deliberately reconnecting with the other key.

Account, security, and webhook-delivery events (`payout_address.changed`,
`auth.suspicious_activity`, `webhook.endpoint_unhealthy`, ...) are **not**
filtered by environment — they describe the organization itself, not a
charge, so there's no `test`/`live` distinction to make. Either key sees
all of them.

## Stopping

`Ctrl-C` closes the connection cleanly — the server-side stream ends the
moment it sees you disconnect.
