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
[`klap sandbox trigger`](./commands.md#klap-sandbox-trigger), which lets you
simulate any charge event without moving real funds.

You can also log in with a `live` key later — `klap login` auto-detects
the environment from the key's own prefix and adds it alongside, without
removing the one you already have:

```bash
klap login --api-key klap_live_... --base-url https://api.klap.example
```

With both configured, every command that talks to the API requires
`--env test` or `--env live` to pick one — no silent default. With only
one configured, it's picked automatically. See
[`configuration.md`](./configuration.md) for the full picture, including
the security trade-off of storing both.

## Your first charge

```bash
klap charges create --amount 10 --accept USDC:base --expires-in 3600
```

Prints the created charge, including its `id` and on-chain `address`.
`--accept` is repeatable — pass it more than once (e.g. `--accept
USDC:base --accept USDT:base`) to let the payer choose which pair to
pay with; see [`commands.md`](./commands.md) for details.

## Receive webhooks locally

```bash
klap listen --forward-to http://localhost:3000/webhooks
```

Opens a live connection and forwards every event for your organization to
your own local server, signed exactly like a real webhook delivery — no
tunnel, no public URL, nothing to deploy. See [`listen.md`](./listen.md)
for how this works and why it's safe to run on your own machine.

## Where to go next

- [`commands.md`](./commands.md) — every command, in depth
- [`listen.md`](./listen.md) — how `klap listen` works, and why it isn't a tunnel
- [`configuration.md`](./configuration.md) — where credentials are stored
