# charges

## `klap charges create`

```bash
klap charges create --amount <amount> --accept <token:network> --expires-in <seconds> [--fee-payer merchant|payer] [--env test|live]
```

Thin wrapper over `klap.charges.create()` in `@klappay/node`. `--amount`,
`--accept`, and `--expires-in` are all required — the API has no
"any amount"/"never expires" charge.

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
# watch it live as events come in
klap logs --tail --charge ch_a1b2c3d4e5

# or drive it yourself, without waiting for a real payment
klap sandbox trigger ch_a1b2c3d4e5 charge.confirmed
```

See [Sandbox](/sandbox) and [Logs](/logs).
