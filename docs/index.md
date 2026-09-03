---
layout: home

hero:
  name: '@klappay/cli'
  text: The official CLI for the Klap Core API
  tagline: Create charges, simulate sandbox events, forward webhooks to your own machine, and generate test fixtures — all from the terminal, on top of @klappay/node.
  image:
    src: /logo.png
    alt: '@klappay/cli'
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/klappay/klap-cli

features:
  - title: login / logout
    details: Store a test and/or live API key locally, with 0600/0700 permissions — auto-detected from the key's own prefix.
    link: /login
  - title: charges
    details: Create a charge from the terminal and get back a clickable checkoutUrl — no dashboard round-trip.
    link: /charges
  - title: sandbox
    details: Simulate any charge lifecycle event — confirmed, partially paid, overpaid, expired, settled — with no real funds involved.
    link: /sandbox
  - title: listen
    details: Forward every webhook event to your own localhost, signed exactly like a real delivery — no tunnel, no public URL.
    link: /listen
  - title: logs
    details: Print a charge's full timeline once, or tail every event for your org live.
    link: /logs
  - title: webhooks
    details: Register endpoints, list deliveries, and retry failed ones without leaving the terminal.
    link: /webhooks
  - title: fixtures
    details: Print a realistic Charge JSON object for any status — no API call, no login, no testnet funds.
    link: /fixtures
---
