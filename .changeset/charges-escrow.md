---
"@klappay/cli": minor
---

Add escrow commands: `klap charges prepare-release <id>`/`prepare-refund <id>` print the exact Safe transaction to sign (`--out <file>` also writes it, `typedData` included, as JSON), and `klap charges release <id>`/`refund <id> --signature <hex>` submit it. Charge output now shows an `escrow` block for escrow charges. `escrow_invalid_signature` and `escrow_safe_mismatch` errors print a hint on what to do next.
