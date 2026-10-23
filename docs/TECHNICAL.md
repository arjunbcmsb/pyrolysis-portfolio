# Technical guide

[Return to the product case study](../README.md)

## Architecture

```text
Browser
  Website: public/index.html, styles.css, app.js
  Unity: same-origin iframe -> public/demo/ -> compiled Web build
  Chat: POST /api/chat -> validation -> shared Redis budget -> LLM7
  Statistics: optional consent -> Vercel Web Analytics
```

Vercel serves `public/` and runs the Node.js function in `api/chat.mjs`. The project has no frontend build step or npm runtime dependencies. GitHub pushes to the connected production branch trigger deployments.

## Local preview and checks

Use Node.js 22:

```sh
npm run dev
npm test
npm run check
```

The preview binds to `127.0.0.1:4173`. Open `http://localhost:4173/`.

The test suite has 44 automated checks across chat, shared budgets, analytics consent and Unity integration. The public-file scan checks local asset links, unsafe chat rendering patterns and common accidental exposures. These are targeted checks, not a guarantee that every security issue is absent.

## Unity integration

- The website displays immediately and preloads the existing Web export in a same-origin iframe.
- Actual Unity progress and readiness are passed to the parent page. The parent validates message origin and source.
- Launch becomes available when the player is ready. It opens the existing Unity Home scene.
- The player preserves the 960 × 600 proportions and provides fullscreen, retry and image fallbacks.
- The export uses `.unityweb` decompression fallback. Preserve the files and do not add `Content-Encoding` headers to them.
- Original Unity source and Blender files are outside this repository. The export is not an editable Unity project.

## Assistant configuration

The live assistant calls LLM7's `default` model selector through a server endpoint, so LLM7 can choose its currently available general-purpose model. Credentials stay in private Vercel environment variables. `.env.example` contains names and empty values only.

| Variable | Purpose |
| --- | --- |
| `LLM7_API_KEY` | Private provider credential. |
| `CHAT_ENABLED` | Explicitly enables live provider calls. Defaults to disabled. |
| `CHAT_RATE_LIMIT_READY` | Deployment guard, set only after the IP firewall rule is configured and verified. |
| `KV_REST_API_URL` | Upstash Redis REST endpoint. |
| `KV_REST_API_TOKEN` | Private Redis credential. |

The local preview does not automatically load `.env` files. It works without provider credentials and then uses prepared answers. Production configuration is separate from the committed example.

The assistant uses curated project knowledge, answers the current question and includes limited history only for recognised follow-ups. Replies are capped at five sentences. The model has no tools or file access, and the browser renders replies as plain text.

Live responses depend on provider availability, account limits and the shared budget. Prepared answers are the fallback when live AI is unavailable. Topic filtering reduces unrelated requests but is not perfect.

## Usage controls

| Control | Current setting |
| --- | --- |
| Vercel firewall | Five `POST /api/chat` requests per minute per IP. Configure on the hosting project; this rule is not created by cloning the repo. |
| Visitor allowance | 50,000 tokens per rolling 24 hours. |
| Shared allowance | 75,000 units per rolling 24 hours, reserved before calls and settled to reported total token usage. |
| Question size | 600 characters; request body limited to 8 KB. |
| Provider input/output | 16 KB input limit; 512 output tokens. |
| Provider timeout | 30 seconds. |

Redis reservations are atomic. Missing usage retains the conservative reservation. Missing trusted visitor identity or failed storage prevents a live provider call.

Visitor counters use a keyed hash of Vercel's trusted client IP. The budget ledger does not store raw IPs or questions. Visitors sharing an IP share an allowance, and changing IP can yield another visitor allowance. The site-wide cap still applies.

## Optional statistics

Vercel Web Analytics remains off until the visitor selects **Allow visit statistics**. **No thanks** leaves Unity and chat available. The separate popup uses the website's palette and typography.

The browser remembers the choice for up to 180 days. Automatic SDK tracking is disabled; only a consent-checked manual page view is sent, with URL query strings and fragments removed. Consent withdrawal is available through Contact and Privacy and synchronises across tabs without reloading Unity or chat. Content blockers may prevent collection.

## Repository boundaries

The repository excludes environment files, local verification records, the private report and original project sources. Documentation screenshots in `docs/images/` show the public product. The font's bundled licence remains with the font assets.

Do not commit API keys, Redis tokens, reports containing student IDs or deployment credentials. Public availability does not grant ownership of third-party assets.

## Verification scope and limitations

Start, Restart, Back, fullscreen and Unity readiness have been checked in a desktop browser. Layouts at 320, 390 and 768 pixels have previously been checked for horizontal overflow. Physical phones have not been tested.

The first Unity visit still requires downloading and initialising the build. Browser/device limitations and provider rate limits can affect the experience. The application is an educational visualisation, not a validated process-engineering simulator.
