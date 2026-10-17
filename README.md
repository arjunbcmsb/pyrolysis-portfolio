# Pyrolysis of Plastics

A portfolio website with an interactive Unity Web export and a project assistant.

Live website: https://pyrolysis3d.vercel.app

## Local preview

Requires Node.js 22 or newer. No frontend dependency installation is needed.

Run `node scripts/preview.mjs`, then visit http://localhost:4173/.

## Hosting

Vercel serves `public/` and the Node function at `/api/chat` using `vercel.json`.
Connect this repository to the existing `pyrolysis-by-arjun` project. Pushes to the production branch can deploy automatically.

The Unity export uses `.unityweb` decompression fallback. Preserve these files and do not add Content-Encoding headers to them.

## Assistant

Prepared FAQs work without credentials. Provider credentials belong in private Vercel environment variables, never browser code or Git.
See `.env.example` for configuration names. Live mode is deliberately disabled until its activation requirements are configured.

## Checks

`node --test tests/*.test.mjs`

`node scripts/check.mjs`

Original Unity source files and the project report are excluded from this repository.

Chat uses a five-per-minute per-IP firewall rule plus a shared rolling 24-hour budget in free Upstash Redis. Common suggested questions use approved answers without an AI request. Store failures and exhausted budgets use FAQs. Paid auto-upgrades are disabled.

## Optional visit statistics

Free Vercel Web Analytics loads only after Accept. Decline prevents collection; Privacy preferences in Contact lets visitors change their choice. The choice stays in local storage, with no analytics cookies. URLs exclude query strings and fragments. Withdrawing consent blocks future analytics events. Only consenting visits appear in the dashboard.
