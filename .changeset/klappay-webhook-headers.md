---
"@klappay/cli": patch
---

Forwarded and test webhooks now use the same header names as real Klap deliveries: `X-Klappay-Signature`, `X-Klappay-Event` and `X-Klappay-Delivery` (they were sent as `X-Klap-*`, so handlers written against the docs failed verification locally).
