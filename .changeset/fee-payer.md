---
'@klappay/cli': minor
---

Bumps `@klappay/node` to `^4.1.0` and `@klappay/types` to `^3.8.0`, and picks up `feePayer` through the CLI: `klap charges create --fee-payer merchant|payer` (defaults to `merchant`, matching the API), and `klap fixtures charge --fee-payer merchant|payer`. `klap charges create`/`klap sandbox trigger` now also print the fee breakdown (`fee`, `merchantAmount`) that's on every `Charge` in this version.
