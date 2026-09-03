<img src="./logo.png" alt="Klap" width="80" />

# @klappay/cli

Official CLI for the Klap Core API — non-custodial crypto payments.
Create charges from the terminal, simulate any sandbox event without
touching real funds, and forward real-time webhooks to your own
`localhost` with `klap listen` — no tunnel, no public URL, nothing to
deploy.

Built on top of [`@klappay/node`](https://www.npmjs.com/package/@klappay/node) — every command is a thin
wrapper over the same official client, so the CLI never has a second
implementation of anything the SDK already does correctly.

## Install

```bash
npm install -g @klappay/cli
# or, without installing:
npx @klappay/cli --help
```

## Quick start

```bash
klap login --api-key klap_test_... --base-url https://api.klap.example
klap charges create --amount 10 --accept USDC:base --expires-in 3600
klap listen --forward-to http://localhost:3000/webhooks
```

You can also log in with both a `test` and a `live` key — `klap login`
auto-detects which is which from the key's own prefix. With both
configured, every command requires `--env test`/`--env live` to pick
one, and prints which one it's using loudly (`LIVE` gets a highlighted
banner) so you're never uncertain mid-session. See
[`docs/configuration.md`](./docs/configuration.md).

## Documentation

| Doc | Covers |
|---|---|
| [`docs/getting-started.md`](./docs/getting-started.md) | Install, login, your first charge |
| [`docs/commands.md`](./docs/commands.md) | Every command, in depth |
| [`docs/listen.md`](./docs/listen.md) | How `klap listen` works, and why it's not a tunnel |
| [`docs/configuration.md`](./docs/configuration.md) | Where credentials are stored locally |

## License

MIT — see [`LICENSE`](./LICENSE).
