# fixtures

## `klap fixtures charge`

```bash
klap fixtures charge [--status <status>] [--overpaid] [--settlement <status>] [--amount <amount>] [--accept <token:network>] [--fee-payer merchant|payer] [--env test|live]
```

Prints a realistic `Charge` JSON object to stdout — no API call, no
`klap login` needed, no testnet funds. Useful for building and testing
your own checkout UI or webhook handler against every charge state on
demand, the same fixture pattern klap-checkout and klap-checkout-kit
already use internally in their own tests.

```bash
# defaults to a fresh pending charge, $49.90, USDC:base
klap fixtures charge

# every lifecycle status
klap fixtures charge --status pending
klap fixtures charge --status partially_paid
klap fixtures charge --status confirmed
klap fixtures charge --status underpaid
klap fixtures charge --status expired

# a confirmed, overpaid charge (isOverpaid: true, amountReceived > amount)
klap fixtures charge --overpaid

# a confirmed charge with a specific settlement outcome
klap fixtures charge --status confirmed --settlement completed
klap fixtures charge --status confirmed --settlement failed
klap fixtures charge --status confirmed --settlement pending

# override amount and accepted payments
klap fixtures charge --status confirmed --amount 100 --accept USDT:optimism

# a live-environment fixture (only changes the environment/checkoutUrl fields)
klap fixtures charge --status confirmed --env live

# a fixture where the payer covers the fee — merchantAmount equals amount
klap fixtures charge --amount 100 --fee-payer payer
```

### Sample output

```bash
klap fixtures charge --status confirmed --settlement completed
```

```json
{
  "id": "ch_fixture_c5dfab0b9101",
  "amount": 49.9,
  "amountReceived": 49.9,
  "isOverpaid": false,
  "currency": "USD",
  "feePayer": "merchant",
  "feePercent": 1,
  "feeAmount": 0.5,
  "merchantAmount": 49.4,
  "acceptedPayments": [{ "token": "USDC", "network": "base" }],
  "paidWith": [{ "token": "USDC", "network": "base" }],
  "swapAlternatives": [],
  "address": "0xbf99ce5225af4e3f60c4c46620755e0b35f871c8",
  "status": "confirmed",
  "settlementStatus": "completed",
  "environment": "test",
  "checkoutUrl": "https://pay.stage.klappay.com/c/ch_fixture_c5dfab0b9101",
  "createdAt": "2026-09-01T12:00:00.000Z",
  "expiresAt": "2026-09-01T13:00:00.000Z",
  "confirmedAt": "2026-09-01T12:00:00.000Z",
  "settledAt": "2026-09-01T12:00:00.000Z",
  "lastActivityAt": "2026-09-01T12:00:00.000Z"
}
```

### Piping into your own tests

```bash
klap fixtures charge --status underpaid > fixtures/underpaid-charge.json
klap fixtures charge --status confirmed --overpaid | jq '.amountReceived'
```

`--status` defaults to `pending`; `--overpaid` forces a confirmed,
overpaid charge regardless of `--status`; `--settlement` only takes
effect once the charge is confirmed; `--fee-payer` defaults to
`merchant` and only changes `feeAmount`/`merchantAmount` (`feePercent`
is a fixed `1` in every fixture — it's a per-org configured value in
production, not something to simulate variance for here).
