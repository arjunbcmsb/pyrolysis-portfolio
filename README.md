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

Vercel Web Analytics stays off until an explicit Allow visit statistics choice. A separate non-modal popup uses the site palette and typography, with No thanks equally available. It sits outside the page layout and leaves chat and Unity available. Permission lasts up to 180 days; legacy automatic-on settings never count as consent. Privacy and Contact provide withdrawal. The SDK has automatic tracking disabled, and only a consent-checked manual page view is sent, so withdrawal does not reload Unity or chat. URL query strings/fragments are removed. Contact and chat link to the site privacy notice and provider policies. Content blockers can prevent collection.

The per-visitor AI cap is 20,000 tokens per rolling 24 hours, identified by a keyed hash of Vercel's trusted client IP. Raw IPs and questions are not stored in the budget ledger. The shared 75,000-unit cap also applies. Both limits are reserved atomically and settled to reported total input/output tokens. People sharing an IP share the visitor limit. Missing identity or storage failure prevents a live call. Old unassigned ledger entries still count towards the shared cap.
