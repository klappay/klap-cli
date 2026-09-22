---
"@klappay/cli": patch
---

Bump `@klappay/node` to `^5.0.0` and `@klappay/types` to `^5.0.0`. `@klappay/node` 5.0.0's breaking change is `recipients.list()`'s cursor-based pagination (plus a new `recipients.listAll()`), and `@klappay/types` 5.0.0 renames the `AltTokenSchema` literal `'MATIC'` to `'POL'` and adds `LINK`/`ARB`/`OP`/`CBETH` — neither `recipients` nor that literal is referenced anywhere in this CLI, so there's no behavior change or migration needed here.
