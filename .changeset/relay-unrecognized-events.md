---
"@klappay/cli": patch
---

`klap listen` and `klap logs --tail` no longer exit on an event this CLI version doesn't recognize. They skip it and print a warning naming the event.
