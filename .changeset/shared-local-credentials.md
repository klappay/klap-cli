---
"@klappay/cli": minor
---

Add a `@klappay/cli/credentials` subpath export: the code that reads and writes `~/.klap/config.json` (`loadCredentials`, `saveCredentials`, `deleteCredentials`, `setApiKey`, `clearApiKey`, `detectEnvironment`, `resolveApiKey`, and typed `KlapCredentialsError` subclasses with stable `code`s). It is a lightweight, ESM-only, Node-only entry point that doesn't load the CLI itself. The Klap MCP server (`@klappay/mcp`) uses it, so the CLI and the MCP server read and write the file the same way. See `docs/configuration.md`.

The CLI now uses this module itself, and writes to `~/.klap/config.json` are atomic (temp file, then rename, `0600` file inside a `0700` directory). Behavior changes: a symlinked `~/.klap` or `~/.klap/config.json` is now refused with an error instead of being followed. A corrupted or invalid config file (bad JSON, missing `baseUrl`, or a key stored under the wrong environment slot) now fails with a message pointing to `klap logout` + `klap login` instead of being treated as "not logged in". Error messages never include any part of an API key. Existing messages for `--env` selection and missing keys are unchanged.
