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

## Testing without a public endpoint

You don't need `klap webhooks create` at all to develop locally — see
[Listen](/listen), which streams every event straight to your own
`localhost` without registering anything.
