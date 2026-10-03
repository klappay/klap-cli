---
"@klappay/cli": patch
---

Bump `@klappay/node` to `^5.1.2` and `@klappay/types` to `^5.2.0`. Picks up the `tron` and `arc` networks and USDC/USDT on BNB Chain (`live`) — `klap charges create --accept` validates against `NetworkSchema`/`TokenSchema`, so those pairs are accepted with no CLI change. Everything else in between is additive or internal to the SDK (cross-family `acceptedPayments` rejection is enforced by the API, a `@klappay/types/constants` bundle-size fix); no flag or output changes here.
