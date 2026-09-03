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
klap listen
```

`klap listen` prints every webhook event for your org live, no
`--forward-to` required. Pass `--charge <id>` to watch just the one you
just created:

```bash
klap listen --charge ch_a1b2c3d4e5
```

Need to actually forward events to a local server instead of just
watching them? Add `--forward-to`:

```bash
klap listen --forward-to http://localhost:3000/webhooks
```

You can also log in with both a `test` and a `live` key — `klap login`
auto-detects which is which from the key's own prefix. With both
configured, every command requires `--env test`/`--env live` to pick
one, and prints which one it's using loudly (`LIVE` gets a highlighted
banner) so you're never uncertain mid-session. See
[`docs/configuration.md`](https://github.com/klappay/klap-cli/tree/main/docs/configuration.md).

## Documentation

Full docs live at [`docs/`](https://github.com/klappay/klap-cli/tree/main/docs) on GitHub,
and as a browsable site at [cli.klappay.com](https://cli.klappay.com). The site also
publishes [`llms.txt`](https://cli.klappay.com/llms.txt) and
[`llms-full.txt`](https://cli.klappay.com/llms-full.txt) — plain-text, LLM-friendly
versions of these docs, regenerated on every deploy, for feeding an agent or MCP server.

| Doc | Covers |
|---|---|
| [`docs/getting-started.md`](https://github.com/klappay/klap-cli/tree/main/docs/getting-started.md) | Install, login, your first charge |
| [`docs/login.md`](https://github.com/klappay/klap-cli/tree/main/docs/login.md) | `klap login`/`klap logout` |
| [`docs/charges.md`](https://github.com/klappay/klap-cli/tree/main/docs/charges.md) | `klap charges create`, in depth — including the `checkoutUrl` it prints |
| [`docs/sandbox.md`](https://github.com/klappay/klap-cli/tree/main/docs/sandbox.md) | Simulating every charge lifecycle event |
| [`docs/listen.md`](https://github.com/klappay/klap-cli/tree/main/docs/listen.md) | How `klap listen` works, and why it's not a tunnel |
| [`docs/logs.md`](https://github.com/klappay/klap-cli/tree/main/docs/logs.md) | Timelines and live tailing |
| [`docs/webhooks.md`](https://github.com/klappay/klap-cli/tree/main/docs/webhooks.md) | Registering and managing webhook endpoints |
| [`docs/fixtures.md`](https://github.com/klappay/klap-cli/tree/main/docs/fixtures.md) | Realistic sample `Charge` data — no API call, no testnet funds |
| [`docs/configuration.md`](https://github.com/klappay/klap-cli/tree/main/docs/configuration.md) | Where credentials are stored locally |

## License

MIT — see [`LICENSE`](./LICENSE).
