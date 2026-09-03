# logs

```bash
klap logs --charge <id> [--env test|live]              # print that charge's timeline once
klap logs --tail [--env test|live]                      # stream every event for your org, live
klap logs --tail --charge <id> [--env test|live]        # stream, filtered to one charge
```

## Print a charge's history once

```bash
klap logs --charge ch_a1b2c3d4e5
```

```
2026-09-01T12:00:00.000Z  charge.created
2026-09-01T12:00:15.000Z  charge.transfer_detected
2026-09-01T12:00:45.000Z  charge.confirmed
```

Fetches `GET /v1/charges/{id}/timeline` and prints it — requires
`--charge`.

## Tail everything, live

```bash
klap logs --tail
```

```
 TEST  — sandbox, no real funds
2026-09-01T12:00:45.000Z  charge.confirmed  ch_a1b2c3d4e5
2026-09-01T12:01:02.000Z  webhook.delivery_failed  -
2026-09-01T12:01:10.000Z  charge.settled  ch_a1b2c3d4e5
```

Connects to the same relay `klap listen` uses (`GET
/v1/webhooks/listen`), printing events as they arrive instead of
forwarding them anywhere. `-` in the third column means the event
doesn't belong to a charge (e.g. a `webhook.*` delivery-health event).

## Tail, filtered to one charge

```bash
klap logs --tail --charge ch_a1b2c3d4e5
```

Same live stream, but only events for that specific charge are printed —
useful while debugging a single payment without the rest of your org's
traffic scrolling past.

## Combine with sandbox

```bash
# terminal 1
klap logs --tail --charge ch_a1b2c3d4e5

# terminal 2
klap sandbox trigger ch_a1b2c3d4e5 charge.confirmed
klap sandbox trigger ch_a1b2c3d4e5 charge.settled
```

Watch each simulated event land in real time. See [Sandbox](/sandbox).

`Ctrl-C` stops either mode cleanly.
