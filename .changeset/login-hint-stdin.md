---
"@klappay/cli": patch
---

The "not logged in", "no live/test key", corrupted-config and symlinked-config errors now suggest piping the key into `klap login --api-key - --base-url <url>` instead of `klap login --api-key <key> ...`, so following the hint no longer leaves the key in shell history or a process listing.
