---
"@klappay/cli": patch
---

Bump `@klappay/node` to `^4.1.1` and `@klappay/types` to `^4.0.0`. `@klappay/types` 4.0.0 renames the `moralis_webhook` `TransactionSource` value to `contract_watcher` and `HealthSchema.lastMoralisEventAgeSeconds` to `lastContractWatcherEventAgeSeconds` (Core's move from Moralis Streams to a self-hosted contract-watcher), but neither symbol is referenced anywhere in this CLI, so there's no behavior change here.
