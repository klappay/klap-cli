---
'@klappay/cli': minor
---

Added `klap webhooks trigger <event>` — signs and delivers a fake webhook payload straight to a local URL, with no Core involved and no login required (unless `--charge <id>` is used to substitute a real charge's data for the synthesized fixture). Same HMAC signature scheme `klap listen --forward-to` already uses, so a handler under test can't tell the difference from a real delivery.
