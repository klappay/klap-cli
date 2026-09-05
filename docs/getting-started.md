# Getting started

## Install

```bash
npm install -g @klappay/cli
# or, without installing:
npx @klappay/cli --help
```

The binary is `klap`.

## Log in

```bash
klap login --api-key klap_test_... --base-url https://api.klap.example
```

Stores your API key and the API's base URL in `~/.klap/config.json`. There
is no default base URL — same reasoning as `@klappay/node`'s `createClient()`:
there is no single known production domain to guess, so it's always
explicit.

Use a `klap_test_...` key while you're building — it unlocks
[`klap sandbox trigger`](/sandbox), which lets you simulate any charge
event without moving real funds.

You can also log in with a `live` key later — `klap login` auto-detects
the environment from the key's own prefix and adds it alongside, without
removing the one you already have:

```bash
klap login --api-key klap_live_... --base-url https://api.klap.example
```

With both configured, every command that talks to the API requires
`--env test` or `--env live` to pick one — no silent default. With only
one configured, it's picked automatically. See [Configuration](/configuration)
for the full picture, including the security trade-off of storing both.

## Your first charge

```bash
klap charges create --amount 10 --accept USDC:base --expires-in 3600
```

```
 TEST  — sandbox, no real funds
ch_a1b2c3d4e5
  status:            pending
  settlementStatus:  null
  amount:            10
  amountReceived:    null
  fee:               0.1 (1%, paid by merchant)
  merchantAmount:    9.9
  acceptedPayments:  USDC:base
  paidWith:          none yet
  address:           0x1234...
  environment:       test
  checkoutUrl:       https://pay.stage.klappay.com/c/ch_a1b2c3d4e5
```

`checkoutUrl` is printed underlined — click it (or `Cmd`/`Ctrl`-click in
most terminals) to open the hosted checkout page for that exact charge
and watch it update live as it gets paid. It comes straight from the API
response — the CLI never builds this URL itself, and it's `null` if the
deployment you're pointed at has no hosted checkout configured.

`--accept` is repeatable — pass it more than once (e.g. `--accept
USDC:base --accept USDT:base`) to let the payer choose which pair to
pay with:

```bash
klap charges create \
  --amount 49.90 \
  --accept USDC:base --accept USDT:base --accept USDC:optimism \
  --expires-in 3600
```

See [Charges](/charges) for the full command reference.

## Simulate a payment without real funds

```bash
klap sandbox trigger ch_a1b2c3d4e5 charge.confirmed
```

Works on any `test`-environment charge you just created — see
[Sandbox](/sandbox) for every triggerable event and its preconditions.

## Receive webhooks locally

```bash
klap listen --forward-to http://localhost:3000/webhooks
```

Opens a live connection and forwards every event for your organization to
your own local server, signed exactly like a real webhook delivery — no
tunnel, no public URL, nothing to deploy. Drop `--forward-to` to just
watch events live instead, or add `--charge <id>` to focus on one. See
[Listen](/listen) for how this works and why it's safe to run on your
own machine.

## Fire a fake webhook at a handler, with no Core involved

```bash
klap webhooks trigger charge.confirmed --url http://localhost:3000/webhooks --secret whsec_test123
```

No login, no charge, no waiting for `klap listen` to see anything —
signs a realistic payload and delivers it right now, so you can test
your handler's signature verification and parsing in isolation. See
[Webhooks](/webhooks#klap-webhooks-trigger).

## Generate test data without touching the API

```bash
klap fixtures charge --status confirmed
```

No login, no network call — prints a realistic `Charge` JSON object you
can pipe straight into your own tests. See [Fixtures](/fixtures).

## Where to go next

- [Login / logout](/login) — credential storage, environment auto-detection
- [Charges](/charges) — every flag, in depth
- [Sandbox](/sandbox) — simulating charge events
- [Listen](/listen) — how `klap listen` works, and why it isn't a tunnel
- [Logs](/logs) — timelines and live tailing
- [Webhooks](/webhooks) — registering and managing endpoints
- [Fixtures](/fixtures) — realistic sample data, offline
- [Configuration](/configuration) — where credentials are stored
