# sandbox

## `klap sandbox trigger`

```bash
klap sandbox trigger <chargeId> <event> [--amount <amount>] [--env test|live]
```

`event` is one of: `charge.confirmed`, `charge.partially_paid`,
`charge.overpaid`, `charge.expired`, `charge.underpaid`, `charge.settled`,
`charge.settlement_failed`. Requires a `test`-environment key — a test
key can only ever act on a test charge, and vice versa; passing
`--env live` here reaches the server but gets rejected.

```bash
# any positive transfer confirms it immediately
klap sandbox trigger ch_a1b2c3d4e5 charge.confirmed

# half the charge amount by default
klap sandbox trigger ch_a1b2c3d4e5 charge.partially_paid

# a specific partial amount
klap sandbox trigger ch_a1b2c3d4e5 charge.partially_paid --amount 5

# 1.5x the charge amount by default — also dispatches charge.confirmed
klap sandbox trigger ch_a1b2c3d4e5 charge.overpaid

# a specific overpaid amount (must exceed the charge amount)
klap sandbox trigger ch_a1b2c3d4e5 charge.overpaid --amount 75

# simulate settlement outcomes directly — no blockchain, no gas
klap sandbox trigger ch_a1b2c3d4e5 charge.settled
klap sandbox trigger ch_a1b2c3d4e5 charge.settlement_failed

# a charge that ran out the clock unpaid
klap sandbox trigger ch_a1b2c3d4e5 charge.expired

# a charge that expired while only partially paid — requires it to
# already be charge.partially_paid
klap sandbox trigger ch_a1b2c3d4e5 charge.underpaid
```

### Preconditions

Each event has a precondition on the charge's current state — e.g.
`charge.underpaid` requires it to already be `charge.partially_paid` —
the API returns a clear `422 invalid_trigger_state` if you trigger one
out of order. `charge.partially_paid`/`charge.overpaid` are also
rejected on a charge with no target `amount` (nothing to be partial
against or exceed) — `charge.confirmed` still works there.

### Why this is safe

`charge.settled`/`charge.settlement_failed` never touch the blockchain —
they simulate the outcome directly, matching this API's guarantee that
test charges never move real funds or spend real gas.

### Combine with `listen`/`logs`

```bash
klap listen --forward-to http://localhost:3000/webhooks --env test &
klap sandbox trigger ch_a1b2c3d4e5 charge.confirmed
```

Drives your webhook handler with a real signed delivery, on demand,
instead of waiting for an actual payment. See [Listen](/listen) and
[Logs](/logs).
