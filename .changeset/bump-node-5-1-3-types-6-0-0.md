---
"@klappay/cli": patch
---

Bump `@klappay/node` to `^5.1.3` and `@klappay/types` to `^6.0.0`. Arc now settles through the official 0xSplits v2.2 contracts, so `klap charges create` can mix `--accept …:arc` with any other EVM network in one charge (only `tron` stays isolated — the API enforces this; the CLI has no rule of its own). `@klappay/types` 6.0.0's breaking change is removing `'arc'` from `NetworkFamily`, which this CLI never referenced, so no flag or output changes. `docs/charges.md` now documents the EVM/TRON mixing rule.
