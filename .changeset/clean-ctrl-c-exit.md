---
"@klappay/cli": patch
---

`klap charges watch`, `klap listen` and `klap logs --tail` now exit cleanly (code 0, no output) when stopped with Ctrl+C, as the docs already said. Previously the cancelled stream surfaced as an error: they printed `This operation was aborted` and exited with code 1. Any other error while streaming still fails as before.
