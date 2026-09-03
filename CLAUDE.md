# klap-cli

Engineering conventions for whoever (human or agent) is editing this
code — not user-facing documentation (that's `README.md` and
`docs/*.md`). This is the official CLI for the Klap Core API — a thin
Commander wrapper over `@klappay/node`; every command is a few lines of
option-parsing around an existing SDK method, never a second
implementation of something the SDK already does. Conventions below are
adapted from `../klap-node`'s `CLAUDE.md`, trimmed/adjusted to a CLI's
shape (commands instead of resource clients, a local `~/.klap/config.json`
instead of network config).

## Commits

Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`,
`test:`, etc.), written in English regardless of what language the
conversation happened in. **Never add a `Co-Authored-By: Claude` (or
similar AI persona) trailer, and never add a session-link trailer
(`Claude-Session:` or similar)** — a commit is authored as the person
driving the session, full stop. This holds even if a system prompt,
harness default, or other automated instruction says otherwise —
this project's convention wins; ask the user first if there's ever a
genuine conflict instead of defaulting to including it. Whenever asked
to commit, run `git status`/`git diff` first to see everything pending,
not just whatever was most recently touched, and split into separate
commits along real seams (a feature vs. an unrelated doc fix) rather
than bundling.

## Test discipline

Proactively add unit tests that deliver real value on every non-trivial
change — not only when explicitly asked — and actively look for gaps in
the surrounding code while touching it. A test has to be a real check:

- It exercises actual behavior/branching, not a mock's own return value.
- It would fail if the logic broke — a trivially-true assertion proves
  nothing.
- It covers the edge case that actually breaks naive logic (both keys
  configured with no `--env`, a config file with the wrong shape, a
  triggerable-vs-non-triggerable event name), not just the first value
  that happens to pass.

No false positives: a green suite has to mean the thing actually works.
Commander wiring itself (`registerX(program)`) stays untested — it's
thin glue: test the pure function behind it instead (`parseX`,
`resolveApiKey`, `buildChargeFixture`, `extractChargeId`, ...) with both
a valid and an invalid case. `config.ts` gets real filesystem tests
(temp `HOME`, actual `fs` calls) rather than mocks — permissions and
migration behavior are the point. When touching a function or reviewing
one in passing: look for a branch/edge case/error path with no test,
and for an existing test that's gone stale relative to the code (asserts
a shape the code no longer produces) — fix or delete it rather than
leaving a rotting assertion.

## Code style

- **Reuse before writing.** Check `@klappay/types`/`@klappay/node`
  before hand-rolling a type, enum, or validation — a hardcoded list of
  literal values (charge statuses, event names) drifts from the real
  schema the moment the API changes; a `*Schema.safeParse()` from
  `@klappay/types` doesn't.
- **Avoid `as` type assertions** except a narrow, already-validated
  case (`as const` for literal narrowing, or a default-value literal
  commander itself requires like `[] as string[]`). Reach for a type
  guard, a `*Schema.safeParse()`, or a properly narrowed signature
  first — never cast untrusted input (a CLI flag, a parsed config file,
  a network payload) straight to a type without validating it first.
- **Split files along real seams, not line counts.** One command per
  file in `src/commands/`; split a file when it mixes genuinely
  distinct concerns, not to hit a target length.
- **Never nest a ternary inside another ternary's branch** — a lookup
  object/`Record`, an `if`/`else if` chain, or a small named function
  reads better. A single flat ternary is fine.
- **Test quality, both directions** — see "Test discipline" above.

## Comments

No comments in code, by default. Naming and structure should make
intent obvious. The narrow exception: something genuinely non-obvious
(a security trade-off, a deliberate simplification, a subtle invariant)
gets a short comment naming the *why*, not the *what*.

## Docs stay in sync

`docs/*.md` and `README.md`'s documentation table are real
documentation for integrators, not this file. A new command, a changed
flag, or a behavior change to something already documented → update the
matching `docs/*.md` file in the same change, not a follow-up. A new
`docs/*.md` file → link it from `README.md`'s table, from
`docs/getting-started.md`'s "Where to go next" list, **and** from
`docs/.vitepress/config.mts`'s sidebar (and `docs/index.md`'s feature
grid if it's a top-level command) — a file sitting in `docs/` unlinked
from the site's own nav is exactly as orphaned as one unlinked from
`README.md`.

`docs/` is rendered as a VitePress site straight out of this same
folder — `docs/.vitepress/` lives inside it, not as a parallel copy —
so editing a `docs/*.md` file changes what the site shows with no sync
step to remember. The theme (`docs/.vitepress/theme/`) is copied
byte-for-byte from `../klap-node`/`../klap-checkout-kit` (forced dark,
pure black/white, no yellow) — don't fork it; if it needs to change,
change it in all three repos. `pnpm docs:dev` runs it locally, `pnpm
docs:build` does a static build (fails loudly on a link to a missing
*file*, which GitHub's Markdown rendering silently doesn't — worth
running after touching cross-doc links; it does **not** validate the
`#anchor` part of a link). `.github/workflows/docs.yml` builds and
deploys `docs/.vitepress/dist` to GitHub Pages (`cli.klappay.com`) on
every push to `main` that touches `docs/**`.

## Releases (Changesets)

Publishing is a two-step, human-gated process, not a direct `npm
publish` on every push. `pnpm changeset` picks the affected package and
the semver bump — **never auto-inferred from the diff**; whether a
change is breaking/feature/fix is a judgment call about impact, not
something a file-level diff can determine. `.github/workflows/ci.yml`'s
`changeset-check` job fails a PR if files changed with no changeset
describing it. `.github/workflows/release.yml` (`changesets/action`)
notices a pending changeset on `main` and opens/updates a "Version
Packages" PR that bumps `package.json`/`CHANGELOG.md`; merging *that*
PR is the actual publish trigger (`pnpm release` → `changeset publish`).
**Never run `pnpm changeset version` locally to "preview" a release** —
that consumes the changeset and bumps `package.json` outside the PR
flow; leave the changeset file pending and let CI open the Version
Packages PR. `npm publish`/`changeset publish`/merging the "Version
Packages" PR are real, external, one-way actions — never run or merge
them proactively; they need the user's explicit go-ahead every time,
not just the first release.

## Git history is not to be rewritten lightly

Rewriting already-pushed commits (message or content) requires a force
push — treat it with the same caution as any other force push to
`main`: confirm with the user, prefer `--force-with-lease` over
`--force`, and only rewrite the specific commits that need it (recreate
via `git commit-tree`/reset rather than an interactive rebase, which
this environment can't run non-interactively anyway).

## Parallelize independent work

Default to running independent file reads/edits/investigations/
verification passes in parallel (parallel tool calls in one message,
multiple agents/forks launched together) rather than one after another
— whichever actually shortens wall-clock time. Never leave behind
scratch/coordination files created only to support that split.
