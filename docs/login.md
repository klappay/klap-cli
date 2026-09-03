# login / logout

## `klap login`

```bash
klap login --api-key <key> --base-url <url>
```

Stores the key locally — environment (`test`/`live`) is auto-detected
from the key's own prefix, and adding one doesn't remove the other.

```bash
# test key, pointed at a staging deployment
klap login --api-key klap_test_abc123 --base-url https://api.stage.klap.example

# add a live key later — kept alongside the test key, not replacing it
klap login --api-key klap_live_xyz789 --base-url https://api.klap.example
```

**Avoid the key touching shell history or a process listing.**
`--api-key <key>` on the command line is the simplest form, but it writes
the secret to `~/.bash_history`/`~/.zsh_history` and exposes it to any
local user running `ps`/`/proc` while the process runs. Two alternatives
avoid both:

```bash
# stdin — nothing on the command line, nothing in shell history
echo -n "klap_test_abc123" | klap login --api-key - --base-url https://api.klap.example

# environment variable — same reasoning, ideal for CI
KLAP_API_KEY=klap_live_xyz789 klap login --base-url https://api.klap.example
```

`--api-key <key>` still works and isn't going away — it's the right
choice for a script that already accepts this trade-off consciously. See
[Configuration](/configuration) for the full security discussion.

## `klap logout`

```bash
klap logout                # remove everything — both keys and the base URL
klap logout --env test     # remove just the test key, keep live + baseUrl
klap logout --env live     # remove just the live key, keep test + baseUrl
```

Running it with no `--env` deletes `~/.klap/config.json` entirely. With
`--env`, only that one key is cleared — the other environment (and
`baseUrl`) stays intact, so you don't have to log back in for the key
you're keeping.
