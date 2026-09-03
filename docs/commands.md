# Commands

## `klap login`

```bash
klap login --api-key <key> --base-url <url>

# or, avoiding the key ever touching shell history / a process listing:
echo -n "klap_test_..." | klap login --api-key - --base-url <url>
KLAP_API_KEY=klap_live_... klap login --base-url <url>
```

Stores the key locally — environment (`test`/`live`) is auto-detected
from the key's own prefix, and adding one doesn't remove the other.
`--api-key <key>` is the simplest form but writes the secret to shell
history and exposes it to `ps`/`/proc` for any local user while the
process runs; `--api-key -` (reads from stdin) and `KLAP_API_KEY` (env
var) avoid both, and are the recommended default. See
[`configuration.md`](./configuration.md).

## `klap logout`

```bash
klap logout                # remove everything
klap logout --env test     # remove just the test key, keep live + baseUrl
klap logout --env live
```

## `klap charges create`

```bash
klap charges create --amount 49.90 --accept USDC:base --expires-in 3600 [--env test|live]

# accept more than one (token, network) pair — repeat the flag:
klap charges create --amount 49.90 --expires-in 3600 --accept USDC:base --accept USDT:base --accept USDC:optimism
```

Thin wrapper over `klap.charges.create()` in `@klappay/node`. `--amount`,
`--accept`, and `--expires-in` are all required — the API has no
"any amount"/"never expires" charge. `--accept` takes a `TOKEN:NETWORK`
pair (e.g. `USDC:base`) and is repeatable — the payer can pay with any
combination of the pairs you list, and every transfer on an accepted
pair sums toward the charge total (see `paidWith` in the printed
output). Prints the created charge, including `acceptedPayments` (what
was configured) and `paidWith` (every pair actually paid so far,
printed as a comma-separated `token:network` list, or `none yet` until
the first transfer arrives). `--env` is required only if both a `test`
and a `live` key are configured.

## `klap sandbox trigger`

```bash
klap sandbox trigger <chargeId> <event> [--amount <amount>] [--env test|live]
```

`event` is one of: `charge.confirmed`, `charge.partially_paid`,
`charge.overpaid`, `charge.expired`, `charge.underpaid`, `charge.settled`,
`charge.settlement_failed`. Requires a `test`-environment key — see the
main API docs' `security.md` for why (a test key can only ever act on a
test charge, and vice versa; passing `--env live` here will reach the
server but get rejected). Each event has a precondition on the charge's
current state — e.g. `charge.underpaid` requires it to already be
`charge.partially_paid` — the API returns a clear `422
invalid_trigger_state` if you trigger one out of order. `--amount` applies
to `charge.partially_paid` (defaults to half the charge amount) and
`charge.overpaid` (defaults to 1.5x the charge amount, must be greater
than it). Both are also rejected with `422 invalid_trigger_state` on a
charge with no `amount` — neither is a reachable state without a target
to be partial against or exceed; `charge.confirmed` still works (any
positive transfer confirms it immediately).

`charge.settled`/`charge.settlement_failed` never touch the blockchain —
they simulate the outcome directly, so a test charge never spends real
gas, matching this API's guarantee that test charges never move real
funds. `charge.overpaid` also dispatches `charge.confirmed` alongside it,
matching real behavior — it's never a standalone state.

## `klap listen`

```bash
klap listen --forward-to http://localhost:3000/webhooks [--env test|live]
```

See [`listen.md`](./listen.md) for the full mechanism, including how
`test`/`live` charge events are scoped to the key you connect with.

## `klap logs`

```bash
klap logs --charge <id> [--env test|live]              # print that charge's timeline once
klap logs --tail [--env test|live]                      # stream every event for your org, live
klap logs --tail --charge <id> [--env test|live]        # stream, filtered to one charge
```

Without `--tail`, fetches `GET /v1/charges/{id}/timeline` and prints it —
requires `--charge`. With `--tail`, connects to the same relay
`klap listen` uses, printing events as they arrive instead of forwarding
them anywhere.

## `klap webhooks`

```bash
klap webhooks create --url https://example.com/webhooks [--event charge.confirmed]... [--category payments]... [--env test|live]
klap webhooks list [--env test|live]
klap webhooks delete <id> [--env test|live]
klap webhooks deliveries <id> [--env test|live]
klap webhooks retry <id> <deliveryId> [--env test|live]
```

Thin wrapper over `klap.webhooks` in `@klappay/node`. `create` prints the
webhook's signing secret — the only time it's ever shown in full; `list`
prints a masked hint instead (`klap.webhooks.list()` never returns the
real secret). Omit both `--event` and `--category` to accept the API's
own default subscription. `deliveries` shows recent delivery attempts
(status, HTTP response code, attempt count); `retry` re-queues one that
failed.

## `klap fixtures charge`

```bash
klap fixtures charge [--status pending|partially_paid|confirmed|expired|underpaid] [--overpaid] [--settlement pending|completed|failed] [--amount 49.90] [--accept USDC:base] [--env test|live]
```

Prints a realistic `Charge` JSON object to stdout — no API call, no
`klap login` needed, no testnet funds. Useful for building/testing your
own checkout UI or webhook handler against every charge state on demand,
the same fixture pattern klap-checkout and klap-checkout-kit already use
internally in their own tests. `--status` defaults to `pending`;
`--overpaid` forces a confirmed, overpaid charge regardless of `--status`;
`--settlement` only takes effect once the charge is confirmed.
