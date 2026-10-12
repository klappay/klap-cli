# charges

## `klap charges create`

```bash
klap charges create --amount <amount> --accept <token:network> --expires-in <seconds> [--fee-payer merchant|payer] [--env test|live]
```

Thin wrapper over `klap.charges.create()` in `@klappay/node`. `--amount`,
`--accept`, and `--expires-in` are all required — the API has no
"any amount"/"never expires" charge.

Every EVM network (Arc included) can be mixed freely across `--accept`
flags, but `tron` can't be mixed with any of them — a charge pays out to
one split address predicted up front, and TRON's split contract differs
from the EVM one, so the API rejects that combination with
`400 validation_error`.

```bash
# $10, USDC on Base, expires in 1 hour
klap charges create --amount 10 --accept USDC:base --expires-in 3600

# accept more than one (token, network) pair — repeat the flag; the payer
# picks whichever they hold
klap charges create \
  --amount 49.90 \
  --accept USDC:base --accept USDT:base --accept USDC:optimism \
  --expires-in 3600

# a charge that expires in a full day
klap charges create --amount 5 --accept USDC:polygon --expires-in 86400

# force a specific environment when both a test and a live key are configured
klap charges create --amount 25 --accept USDC:base --expires-in 1800 --env test

# gross up --amount so the payer covers Klappay's fee instead of you —
# you receive the full $50, not $50 minus the fee
klap charges create --amount 50 --accept USDC:base --expires-in 3600 --fee-payer payer
```

### Output

```
 TEST  — sandbox, no real funds
ch_a1b2c3d4e5
  status:            pending
  settlementStatus:  null
  amount:            49.9
  amountReceived:    null
  fee:               0.499 (1%, paid by merchant)
  merchantAmount:    49.401
  acceptedPayments:  USDC:base, USDT:base, USDC:optimism
  paidWith:          none yet
  address:           0x1234567890abcdef1234567890abcdef12345678
  environment:       test
  checkoutUrl:       https://pay.stage.klappay.com/c/ch_a1b2c3d4e5
```

- **`acceptedPayments`** — every `(token, network)` pair you configured.
- **`paidWith`** — every pair actually paid so far, comma-separated, or
  `none yet` until the first transfer arrives. A charge with multiple
  `acceptedPayments` can be paid with any combination of them; every
  transfer on an accepted pair sums toward the charge total.
- **`fee`/`merchantAmount`** — your fee tier's `feePercent`, the
  resulting `feeAmount`, and who's covering it (`--fee-payer`).
  `merchantAmount` is always what actually lands in your payout,
  regardless of who paid the fee — with `--fee-payer merchant` (the
  default) it's `amount` minus the fee; with `--fee-payer payer`,
  `amount` itself is grossed up so `merchantAmount` equals the amount
  you asked for.
- **`checkoutUrl`** — a live link to the hosted checkout page for this
  exact charge, printed underlined so it's easy to click straight from
  the terminal. It comes directly from the API response (the CLI never
  constructs it) and is `null` if the deployment you're pointed at has no
  hosted checkout configured. Open it to watch the charge update live as
  a payer connects a wallet and pays — the same page `klap sandbox
  trigger` and `klap listen` let you drive/observe from the terminal.

`--env` is required only if both a `test` and a `live` key are
configured — see [Configuration](/configuration). The `LIVE`/`TEST`
banner above the charge is printed by every command that resolves an
environment, so you're never uncertain which one you're looking at.

### Then what?

```bash
# watch it live as events come in — no webhook or relay setup needed
klap charges watch ch_a1b2c3d4e5

# or drive it yourself, without waiting for a real payment
klap sandbox trigger ch_a1b2c3d4e5 charge.confirmed
```

See [Sandbox](/sandbox) and [Logs](/logs).

## `klap charges get`

```bash
klap charges get <id> [--env test|live]
```

Thin wrapper over `klap.charges.get()`. Prints the charge's current
state in the same shape as `klap charges create` — useful for a charge
created elsewhere (your backend, the checkout page) when you just want
one snapshot instead of `watch`'s live stream.

## `klap charges list`

```bash
klap charges list [--status <status>] [--token <token>] [--network <network>] \
  [--since <iso-datetime>] [--overpaid | --no-overpaid] \
  [--limit <n>] [--cursor <cursor>] [--env test|live]
```

Thin wrapper over `klap.charges.list()`: one page of charges, one line
each — id, status, amount, and `createdAt`.

```bash
# every confirmed charge paid in USDC on Base since October 1st
klap charges list --status confirmed --token USDC --network base --since 2026-10-01T00:00:00Z

# only charges where the payer sent more than the amount
klap charges list --overpaid
```

```
 TEST  — sandbox, no real funds
ch_a1b2c3d4e5  confirmed               10 USD  2026-10-12T14:02:11.000Z
ch_f6g7h8i9j0  pending               49.9 USD  2026-10-12T13:58:40.000Z
More results — rerun with the same filters plus --cursor eyJpZCI6ImNoX2Y2...
```

- **`--status`** — one of `pending`, `partially_paid`, `confirmed`,
  `expired`, `underpaid`.
- **`--token`/`--network`** — filter on the pair actually *paid*
  (`paidWith`), not on what the charge accepted.
- **`--since`** — an ISO 8601 datetime; filters on `createdAt`, not on
  when the status last changed.
- **`--overpaid`/`--no-overpaid`** — only overpaid charges, or only
  charges that aren't. Omit both for either.
- **`--limit`** — page size, 1–100 (default 20).
- **`--cursor`** — when there's another page, the last line prints the
  cursor to fetch it. Pass it back verbatim with the same filters; it's
  opaque, never build or edit it yourself.

Every flag is validated against `@klappay/types`'s own schema before
any request is sent, so a typo'd status or a malformed date fails
locally with the flag's name in the error.

## `klap charges watch`

```bash
klap charges watch <id> [--env test|live]
```

Opens a live connection straight to this charge's own event stream and
prints its current state every time `status`/`settlementStatus` changes,
plus a confirmation progress bar while a detected transfer is still
waiting on block confirmations. Unlike `klap logs --tail`, it needs no
webhook endpoint or `klap listen` relay — just the charge id. Runs until
the charge reaches a terminal state or you stop it with Ctrl+C.

Not the same tool as `klap listen --charge <id>`: that relays every raw
webhook event dispatched for your org, filtered to one charge, with no
confirmation progress bar. See [`watch` vs `listen`](/listen#watch-vs-listen).

```
 TEST  — sandbox, no real funds
[#######-------------] 33%  base 4/12 blocks
ch_a1b2c3d4e5
  status:            confirmed
  settlementStatus:  pending
  amount:            10
  amountReceived:    10
  fee:               0.1 (1%, paid by merchant)
  merchantAmount:    9.9
  acceptedPayments:  USDC:base
  paidWith:          USDC:base
  address:           0x1234567890abcdef1234567890abcdef12345678
  environment:       test
  checkoutUrl:       https://pay.stage.klappay.com/c/ch_a1b2c3d4e5
```
