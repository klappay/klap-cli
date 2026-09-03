# @klappay/cli

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
