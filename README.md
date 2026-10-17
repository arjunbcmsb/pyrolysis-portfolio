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

Chat uses a five-per-minute per-IP firewall rule plus a shared rolling 24-hour budget in free Upstash Redis. Suggested questions use live AI when available. Only greetings use prepared answers immediately. A shared 75,000-unit rolling 24-hour cap reserves worst-case usage before each request, then settles successful calls to the provider-reported total token count. Missing usage retains the full reservation. Store failures and exhausted budgets use FAQs. Paid auto-upgrades are disabled.

## Visit statistics

Free Vercel Web Analytics collects aggregate visitor statistics without analytics cookies or a consent popup. URLs exclude query strings and fragments. Contact includes a link to Vercel's visitor privacy information. Content blockers can prevent collection.
