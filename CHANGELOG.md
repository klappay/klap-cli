# @klappay/cli

## 1.4.0

### Minor Changes

- 6b75371: Add a `@klappay/cli/credentials` subpath export: the code that reads and writes `~/.klap/config.json` (`loadCredentials`, `saveCredentials`, `deleteCredentials`, `setApiKey`, `clearApiKey`, `detectEnvironment`, `resolveApiKey`, and typed `KlapCredentialsError` subclasses with stable `code`s). It is a lightweight, ESM-only, Node-only entry point that doesn't load the CLI itself. The Klap MCP server (`@klappay/mcp`) uses it, so the CLI and the MCP server read and write the file the same way. See `docs/configuration.md`.

  The CLI now uses this module itself, and writes to `~/.klap/config.json` are atomic (temp file, then rename, `0600` file inside a `0700` directory). Behavior changes: a symlinked `~/.klap` or `~/.klap/config.json` is now refused with an error instead of being followed. A corrupted or invalid config file (bad JSON, missing `baseUrl`, or a key stored under the wrong environment slot) now fails with a message pointing to `klap logout` + `klap login` instead of being treated as "not logged in". Error messages never include any part of an API key. Existing messages for `--env` selection and missing keys are unchanged.

### Patch Changes

- 92b6f49: Bump `@klappay/node` to 5.1.4.

## 1.3.3

### Patch Changes

- 38773ae: Bump `@klappay/node` to `^5.1.3` and `@klappay/types` to `^6.0.0`. Arc now settles through the official 0xSplits v2.2 contracts, so `klap charges create` can mix `--accept …:arc` with any other EVM network in one charge (only `tron` stays isolated — the API enforces this; the CLI has no rule of its own). `@klappay/types` 6.0.0's breaking change is removing `'arc'` from `NetworkFamily`, which this CLI never referenced, so no flag or output changes. `docs/charges.md` now documents the EVM/TRON mixing rule.

## 1.3.2

### Patch Changes

- 158b471: Bump `@klappay/node` to `^5.1.2` and `@klappay/types` to `^5.2.0`. Picks up the `tron` and `arc` networks and USDC/USDT on BNB Chain (`live`) — `klap charges create --accept` validates against `NetworkSchema`/`TokenSchema`, so those pairs are accepted with no CLI change. Everything else in between is additive or internal to the SDK (cross-family `acceptedPayments` rejection is enforced by the API, a `@klappay/types/constants` bundle-size fix); no flag or output changes here.
- f942424: Updates the README/docs logo, favicon, and docs dark-theme accent to Klappay's new brand. The duplicate root `logo.png` is no longer shipped in the package; the README now points at `docs/public/logo.png`.

## 1.3.1

### Patch Changes

- 67b8561: Bump `@klappay/node` to `^5.0.0` and `@klappay/types` to `^5.0.0`. `@klappay/node` 5.0.0's breaking change is `recipients.list()`'s cursor-based pagination (plus a new `recipients.listAll()`), and `@klappay/types` 5.0.0 renames the `AltTokenSchema` literal `'MATIC'` to `'POL'` and adds `LINK`/`ARB`/`OP`/`CBETH` — neither `recipients` nor that literal is referenced anywhere in this CLI, so there's no behavior change or migration needed here.

## 1.3.0

### Minor Changes

- a5a2079: Bump `@klappay/node` to `4.2.0`. Adds `klap charges watch <id>`, a live tail of a single charge's status and confirmation progress straight from its own event stream — no webhook endpoint or `klap listen` relay needed.

## 1.2.1

### Patch Changes

- 061978c: Bump `@klappay/node` to `^4.1.1` and `@klappay/types` to `^4.0.0`. `@klappay/types` 4.0.0 renames the `moralis_webhook` `TransactionSource` value to `contract_watcher` and `HealthSchema.lastMoralisEventAgeSeconds` to `lastContractWatcherEventAgeSeconds` (Core's move from Moralis Streams to a self-hosted contract-watcher), but neither symbol is referenced anywhere in this CLI, so there's no behavior change here.

## 1.2.0

### Minor Changes

- 7a56a6b: Bumps `@klappay/node` to `^4.1.0` and `@klappay/types` to `^3.8.0`, and picks up `feePayer` through the CLI: `klap charges create --fee-payer merchant|payer` (defaults to `merchant`, matching the API), and `klap fixtures charge --fee-payer merchant|payer`. `klap charges create`/`klap sandbox trigger` now also print the fee breakdown (`fee`, `merchantAmount`) that's on every `Charge` in this version.

## 1.1.0

### Minor Changes

- dded2cd: Added `klap webhooks trigger <event>` — signs and delivers a fake webhook payload straight to a local URL, with no Core involved and no login required (unless `--charge <id>` is used to substitute a real charge's data for the synthesized fixture). Same HMAC signature scheme `klap listen --forward-to` already uses, so a handler under test can't tell the difference from a real delivery.

## 1.0.0

### Major Changes

- 3f55252: First real release of the CLI, rewired to work end-to-end against the actual `@klappay/node`/`@klappay/types` packages instead of the placeholder `@klappay/sdk` dependency it shipped with.

  - Fixed dependencies: `@klappay/sdk` → `@klappay/node`, pinned real published `@klappay/types` versions instead of an unresolved `workspace:*`.
  - Fixed `klap listen`/`klap logs --tail` to hit the real relay endpoint (`GET /v1/webhooks/listen`).
  - Removed `charges create --mode continuous` and `sandbox trigger-event` — neither corresponds to anything in the current API.
  - `charges create` now requires `--amount`/`--expires-in` (the API has no "any amount"/"never expires" charge), and prints the charge's `checkoutUrl` so you can open the hosted checkout page straight from the terminal.
  - `klap listen --forward-to` is now optional — omit it to just print events live, same as `klap logs --tail`. Both now also accept `--charge <id>` to filter to a single charge.
  - Added `klap webhooks create/list/delete/deliveries/retry`.
  - Added `klap fixtures charge` — a realistic `Charge` JSON object for any lifecycle status, no API call or login required.
  - Added a full test suite (vitest), typecheck, and biome lint, all wired into CI.
  - Added a documentation site (VitePress, deployed to cli.klappay.com) and the standard klappay tooling: commitlint, husky, changesets, GitHub Actions CI/release/docs workflows.
