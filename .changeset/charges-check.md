---
"@klappay/cli": minor
---

Add `klap charges check <id> [--tx-hash <hash> --network <network>]`, which asks the API to re-check a charge on-chain now. With a transaction hint it also prints the payer evidence `@klappay/types` 6.1.0 added: `transactionSender`, `tokenSenders` and `userOperationSenders`.
