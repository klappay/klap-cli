# recipients

Inspect the split recipients registered for your organization. Creating,
revoking and changing payout eligibility aren't commands here: use
`klap.recipients` from [`@klappay/node`](https://www.npmjs.com/package/@klappay/node)
for those.

## `klap recipients list`

```bash
klap recipients list [--limit <n>] [--cursor <cursor>] [--env test|live]
```

Prints one recipient per line: id, address, label (`-` if none), and
`[payout]` if it's eligible to be an API key's payout address. Requires
`recipients:read`.

```
 TEST  — sandbox, no real funds
rc_a1b2c3d4e5  0x1234567890abcdef1234567890abcdef12345678  supplier  [payout]
rc_f6a7b8c9d0  0xabcdefabcdefabcdefabcdefabcdefabcdefabcd  -
```

Results come 20 at a time by default (`--limit` goes up to 100). When
there's another page, the last line prints the `--cursor` to pass next.

## `klap recipients transferability`

```bash
klap recipients transferability <id> [--env test|live]
```

Reports what each token issuer's own contract says about the recipient's
address, for every token/network pair enabled in your key's environment.
Requires `recipients:read`.

```
 TEST  — sandbox, no real funds
rc_a1b2c3d4e5
  address:  0x1234567890abcdef1234567890abcdef12345678
  pairs:
    USDC:base             receive: allowed     send: allowed
    USDT:base             receive: allowed     send: restricted
```

`receive` says whether the address can be credited, `send` whether it can
move funds out. Each is one of:

- **`restricted`** — the issuer blocks this address in this direction.
  On `receive`, `klap charges create` fails with
  `422 recipient_transfer_restricted` if that pair is accepted. On
  `send` the charge still goes through, but funds the address receives
  may stay stuck until the issuer lifts the restriction, which is worth
  telling its owner. USDT only checks the sender, so its `receive` is
  always `allowed`.
- **`allowed`** — the contract doesn't restrict this address in this
  direction.
- **`unknown`** — no answer: no such function on that network, or the
  read failed or timed out. It never blocks anything.

The only source is the token contract's on-chain view function, never a
Klappay list or a sanctions provider. `pairs` is empty for a TRON address
today. Results are cached server-side for a few minutes and the endpoint
has its own per-tenant rate limit, so run it when investigating a
rejected charge rather than in a loop. An unknown or revoked id fails
with `recipient_not_found`.
