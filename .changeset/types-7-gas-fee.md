---
"@klappay/cli": minor
---

Bumps `@klappay/node` to `^5.4.0` and `@klappay/types` to `^7.0.0`. This fixes `klap listen` and `klap logs --tail` exiting on the new `charge.settlement_below_minimum` event, which the previous schema rejected.

Charge output now shows `requestedAmount` and `gasFee`, plus a `selfSettlement` block while `settlementStatus` is `below_minimum`. `amount_below_minimum`, `gas_quote_unavailable`, `recipient_transfer_restricted` and `escrow_release_not_covered` errors print a hint on what to do next. `klap sandbox trigger`, `klap webhooks trigger` and `klap fixtures charge` support the new settlement state.

**Fixture change:** `klap fixtures charge` now returns `amount` as `merchantAmount + feeAmount + gasFeeAmount`, so `--amount` maps to `requestedAmount` and no longer equals `amount`.
