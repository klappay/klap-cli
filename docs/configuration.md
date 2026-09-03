# Configuration

`klap login --api-key <key> --base-url <url>` writes to `~/.klap/config.json`.
The environment (`test`/`live`) is auto-detected from the key's own prefix —
you never specify it separately. Running `klap login` again with a key for
the **other** environment adds it alongside the first, it doesn't overwrite
it:

```json
{
  "baseUrl": "https://api.klap.example",
  "apiKeys": {
    "test": "klap_test_...",
    "live": "klap_live_..."
  }
}
```

Both fields are optional inside `apiKeys` — store just the one you need, or
both. `baseUrl` is shared across environments (one Klap API serves both
`test` and `live` traffic, differentiated only by which key you present),
so logging in again always updates it for both.

## Choosing which key a command uses

Every command that talks to the API (`charges create`, `sandbox trigger`,
`listen`, `logs`, `webhooks`) accepts `--env test` or `--env live`:

```bash
klap listen --forward-to http://localhost:3000/webhooks --env live
klap charges create --amount 10 --accept USDC:base --expires-in 3600 --env test
klap webhooks list --env live
klap logs --tail --env test
```

`klap fixtures charge` also accepts `--env`, but it's unrelated to
credentials — no login is required at all for `fixtures`. It only
changes the `environment` field (and the `checkoutUrl` domain) on the
printed JSON. See [Fixtures](/fixtures).

- **Only one key configured** — `--env` is optional, that key is used
  automatically.
- **Both configured** — `--env` is **required**. There is no silent
  default (not to `test`, not to `live`) — the CLI errors and asks you to
  choose rather than guess. Every command that resolves an environment
  prints it loudly at the top of its output (`LIVE` gets a highlighted
  banner) specifically so you're never uncertain which one you're looking
  at mid-session.

## Removing credentials

```bash
klap logout                # remove everything — both keys and the base URL
klap logout --env test     # remove just the test key, keep live + baseUrl
klap logout --env live     # remove just the live key, keep test + baseUrl
```

`klap logout` with no `--env` removes the whole file. `klap logout --env
test` (or `--env live`) removes just that one key, keeping the other and
`baseUrl` intact. See [Login / logout](/login).

## Security notes

Treat this file like any other stored credential (it's your real API
key(s), in plaintext, at rest) — same posture as `~/.aws/credentials` or
`gh`'s own local token storage. Permissions are enforced on every write:
the `~/.klap` directory is `0700`, the file itself `0600` — tightened even
if either already existed with looser permissions from an older version.

**Trade-off worth knowing**: storing both keys in one file means a leak of
that file exposes both environments at once, where storing only one key
(the old behavior, and still what happens if you only ever `klap login`
one environment) would only expose that one. This mirrors how
`~/.aws/credentials` already stores multiple profiles' secrets in a single
file — if an attacker can read one key from your home directory, they can
usually read the other too, so splitting into separate files wouldn't
meaningfully reduce real-world risk, just add complexity. If you only ever
work in one environment from a given machine, only ever log in with that
environment's key — nothing requires configuring both.

**How you pass the key to `klap login` matters too.** `--api-key <key>`
on the command line is simplest, but it writes the key to your shell
history (`~/.bash_history`/`~/.zsh_history`) and exposes it to any local
user running `ps`/`/proc`/`htop` while the `login` process is running —
neither of those is protected by the `0600` config file permission
above. Two alternatives avoid both:

```bash
# stdin — nothing on the command line, nothing in shell history
echo -n "klap_test_..." | klap login --api-key - --base-url https://api.klap.example

# environment variable — same reasoning, useful in scripts/CI
KLAP_API_KEY=klap_live_... klap login --base-url https://api.klap.example
```

`--api-key <key>` still works and isn't going away — it's the right
choice for a script that already accepts this trade-off consciously (the
same way `aws configure` still lets you pass `--profile`-scoped values
directly in some contexts). Prefer stdin or the env var otherwise.

## Migrating from an older CLI version

Config files written by a CLI version before multi-environment support
look like `{ "apiKey": "...", "baseUrl": "..." }`. `loadConfig()` detects
this shape automatically and treats it as if you'd logged in with just
that one key (environment inferred from its prefix) — no action needed,
and the file converges to the new shape the next time you run
`klap login`.

## No default base URL

There is no default `--base-url` — same reasoning as `@klappay/node`'s
`createClient({ baseUrl })`: there's no single known production domain to
fall back to, and a wrong silent default is a much harder bug to notice
than a required flag.
