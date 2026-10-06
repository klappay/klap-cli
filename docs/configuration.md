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
Writes are atomic (a temp file in `~/.klap`, then a rename), so an
interrupted `klap login` never leaves a half-written file behind.

**Symbolic links are refused.** If `~/.klap` or `~/.klap/config.json` is a
symlink, every command that reads or writes credentials (`login`,
`logout`, and anything that talks to the API) stops with an error instead
of following it — a link could otherwise redirect your keys to, or read
them from, a location you didn't intend. Older CLI versions followed such
links silently; if you relied on that (e.g. a dotfiles-managed `~/.klap`),
remove the link and run `klap login` again to create a real directory.

**A corrupted or invalid file is an error, not "logged out".** If
`config.json` isn't valid JSON, has no `baseUrl`, or stores a key under the
wrong slot (a `klap_live_...` key under `test`, or vice versa), commands
fail with a message naming the file instead of silently ignoring it. Run
`klap logout` to remove it, then `klap login` again.

**Shared with the Klap MCP server.** `@klappay/mcp` reads the same
`~/.klap/config.json`, so logging in once with the CLI is enough for both.
Both go through the same storage code — this package's own
[`@klappay/cli/credentials`](#programmatic-access-klappay-cli-credentials)
export — so the rules above apply identically to each.

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
look like `{ "apiKey": "...", "baseUrl": "..." }`. The CLI detects
this shape automatically and treats it as if you'd logged in with just
that one key (environment inferred from its prefix) — no action needed,
and the file converges to the new shape the next time you run
`klap login`.

## No default base URL

There is no default `--base-url` — same reasoning as `@klappay/node`'s
`createClient({ baseUrl })`: there's no single known production domain to
fall back to, and a wrong silent default is a much harder bug to notice
than a required flag.

## Programmatic access (`@klappay/cli/credentials`)

The code `klap login`/`logout` and every command use to read and write
`~/.klap/config.json` is also published as a subpath export, so other
local tools share one store and one set of rules for picking a `test` or
`live` key instead of each re-implementing them. The Klap MCP server
(`@klappay/mcp`) uses it, which is why a single `klap login` is enough
for both.

```bash
npm install @klappay/cli
```

It's a separate, lightweight, Node-only entry point: importing
`@klappay/cli/credentials` doesn't load the CLI itself (no `commander`,
no `picocolors`, no `@klappay/node`), only Node built-ins. ESM only. Use
it from tools that run on a developer's own machine, not from a deployed
server — a backend should pass its key to `createClient()` explicitly
(or via `KLAP_API_KEY`) and never touch `~/.klap`.

```ts
import { createClient } from '@klappay/node'
import { loadCredentials, resolveApiKey } from '@klappay/cli/credentials'

const config = await loadCredentials()
const { key, env } = resolveApiKey(config, 'test')

const klap = createClient({ apiKey: key, baseUrl: config?.baseUrl })
console.log(`Using the ${env} key`)
```

### File format and location

`credentialsPath()` returns the absolute path (`$HOME/.klap/config.json`,
resolved when called, not at import time); `CREDENTIALS_DISPLAY_PATH` is
the `~/.klap/config.json` string to show in messages. `KLAP_ENVIRONMENTS`
is `['test', 'live']`.

```json
{
  "baseUrl": "https://your-klap-api-host",
  "apiKeys": {
    "test": "klap_test_...",
    "live": "klap_live_..."
  }
}
```

Either slot may be absent. A key must be a string whose prefix matches
its slot — a `klap_live_` key in the `test` slot (or the reverse) makes
the whole file invalid rather than silently being used against the wrong
environment. Unknown fields are dropped on load. The older single-key
shape (see [Migrating from an older CLI version](#migrating-from-an-older-cli-version))
is read and migrated in memory into the slot its prefix names; it gets
rewritten in the new shape the next time you save.

### Reading and writing

| Function | Behavior |
|---|---|
| `loadCredentials()` | `Promise<KlapCredentialsConfig \| null>` — `null` when `~/.klap` or `config.json` doesn't exist. Throws `InvalidCredentialsFileError` for corrupted JSON or an unexpected shape, never returns `null` for it. |
| `saveCredentials(config)` | Validates `config` with the same rules as loading (throws `InvalidCredentialsFileError` and writes nothing if it fails), then writes it atomically. |
| `setApiKey(config, baseUrl, apiKey)` | Pure: returns a new config with `apiKey` stored in the slot its prefix names, replacing that slot only, and `baseUrl` replaced. `config` may be `null`. |
| `clearApiKey(config, env)` | Pure: returns a new config without that environment's key. |
| `deleteCredentials()` | Removes `config.json`; a no-op if it doesn't exist. |
| `detectEnvironment(apiKey)` | `'test'` for `klap_test_`, `'live'` for `klap_live_`, otherwise throws `InvalidApiKeyPrefixError`. |

```ts
import { loadCredentials, saveCredentials, setApiKey } from '@klappay/cli/credentials'

const existing = await loadCredentials()
await saveCredentials(setApiKey(existing, 'https://your-klap-api-host', 'klap_test_...'))
```

`saveCredentials` creates `~/.klap` with mode `0700` (resetting it if it
already existed with looser permissions), writes a fresh temp file in the
same directory (created exclusively, mode `0600`), flushes it, then
renames it over `config.json` — a crash mid-write never leaves a
half-written file, and the final file is always `0600`. The temp file is
removed if anything fails. Reads open `config.json` with `O_NOFOLLOW`.

If `~/.klap` or `~/.klap/config.json` is a symbolic link,
`loadCredentials`/`saveCredentials` throw `SymlinkedCredentialsPathError`
instead of following it, and `deleteCredentials` refuses a symlinked
`~/.klap` — a key file is a high-value target, and following a planted
link would read secrets from, or write them to, a place you didn't
choose.

### Choosing test vs. live

`resolveApiKey(config, env?)` returns `{ key, env }` and never guesses
when the choice is ambiguous:

| Call | Result |
|---|---|
| `env` given, that slot configured | that key |
| `env` given, that slot empty | throws `MissingEnvironmentKeyError` (`err.environment` is the one you asked for) |
| no `env`, exactly one slot configured | that key |
| no `env`, both slots configured | throws `AmbiguousEnvironmentError` |
| no `env`, nothing configured, or `config` is `null` | throws `NoCredentialsError` |

### Errors

Every error extends `KlapCredentialsError`, which carries a stable `code`
(typed as `KlapCredentialsErrorCode`) to branch on. No message ever
includes any part of an API key — not even for a key with the wrong
prefix, and not the JSON parser's own error text for a corrupted file
(which would echo the file's contents). The CLI maps each `code` to its
own wording; a library caller gets a generic message and should branch
on `code`, not on the text.

| Class | `code` | Thrown when |
|---|---|---|
| `InvalidApiKeyPrefixError` | `invalid_api_key_prefix` | A key doesn't start with `klap_test_`/`klap_live_` (`detectEnvironment`, `setApiKey`) |
| `InvalidCredentialsFileError` | `invalid_credentials_file` | Corrupted JSON, unexpected shape, a key in the wrong slot, `config.json` isn't a regular file — or a config passed to `saveCredentials` fails the same rules |
| `SymlinkedCredentialsPathError` | `credentials_path_symlink` | `~/.klap` or `config.json` is a symbolic link |
| `NoCredentialsError` | `no_credentials` | `resolveApiKey` found no key at all |
| `MissingEnvironmentKeyError` | `missing_environment_key` | `resolveApiKey` was asked for an environment that has no key; carries `environment` |
| `AmbiguousEnvironmentError` | `ambiguous_environment` | `resolveApiKey` found both keys and no environment was given |

Filesystem errors other than "not found" (e.g. `EACCES`) are rethrown
as-is.

```ts
import {
  AmbiguousEnvironmentError,
  KlapCredentialsError,
  loadCredentials,
  resolveApiKey,
} from '@klappay/cli/credentials'

try {
  const { key } = resolveApiKey(await loadCredentials())
} catch (err) {
  if (err instanceof AmbiguousEnvironmentError) {
    console.error('Both keys are configured — pick test or live explicitly.')
  } else if (err instanceof KlapCredentialsError) {
    console.error(`Credentials problem (${err.code}): ${err.message}`)
  } else {
    throw err
  }
}
```
