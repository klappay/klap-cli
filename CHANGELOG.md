# @klappay/cli

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
