# Firecrawl — Security Dimension

**Source:** mendableai/firecrawl · **Analyzed:** 2026-04-10 · **Session:** #273

## Auth model

- **API key → Supabase lookup → Redis-cached ACUC** (Auth Credit Usage Chunk).
  Flow in `apps/api/src/controllers/auth.ts` (600 lines):
  1. Extract API key from request
  2. UUID format check via `uuid` package (`normalizedApiIsUuid`)
  3. Lookup credit usage from Supabase
  4. Cache the resulting ACUC in Redis for 10 minutes
  5. Rate limit via `getRateLimiter()` (rate-limiter-flexible on Redis)
- **Redlock for distributed cache updates.** `redlock.using([key], 10000, ...)`
  serialises ACUC mutations across multiple API pods so two workers can't race
  on the same cache slot.
- **x402 modern payment flow.** `apps/api/src/controllers/v2/x402-search.ts`
  implements HTTP 402 Payment Required for paid search, a non-default auth
  surface worth noting.

## Input validation

- **Zod 4.1.12** is the canonical validation layer.
  `apps/api/src/scraper/scrapeURL/README.md` explicitly notes the URL validation
  duty was moved from an in-code helper
  (`WebScraperDataProvider.validateInitialUrl`) **to the Zod layer above
  scrapeUrl**. This is a clean "validate at the boundary, trust internally"
  pattern.
- URL validators: `apps/api/src/lib/validateUrl.test.ts` and
  `apps/api/src/lib/canonical-url.test.ts` — URL normalisation has dedicated
  test coverage.
- Fire-engine branding has an isolated print-script
  (`apps/api/src/scraper/scrapeURL/engines/fire-engine/branding-script/print-script.js`)
  to keep branding mutation separated from scraping logic.

## Rate limiting

- `apps/api/src/services/rate-limiter.ts` (47 lines) — thin wrapper over
  `rate-limiter-flexible` with `RateLimiterMode` enum for tiered limits
  (different endpoints get different budgets).
- `rate-limiter.test.ts` present alongside — tested.

## Secrets & error telemetry

- **Sentry** (`@sentry/core` 10.28) for error telemetry with source maps upload
  (`sentry:sourcemaps` script). Sourcemap injection runs pre-deploy.
- Idempotency service (`apps/api/src/services/idempotency/`) — replay protection
  for paid endpoints.

## Operational security

- **Self-hosted vs hosted isolation.** CLAUDE.md documents explicit test gating
  via `TEST_SUITE_SELF_HOSTED`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL` so tests
  don't leak hosted-only credentials into self-hosted CI. This is a discipline
  more projects should adopt.
- Dedicated `apps/api/src/services/alerts/` subsystem — means incidents have a
  code-owned alerting layer, not ad-hoc.

## Absence patterns

- **No visible input-sanitization helpers** beyond Zod. No HTML sanitizer
  wrapper in grep sweep — relies on downstream (markdown converter) to
  neutralize injected content.
- **No visible CSP / CORS hardening** in the top-level Express setup (didn't
  grep exhaustively — coverage audit should verify).
- **No visible secret-scanning config** in apps/api root.

## Band: Healthy (70)

Auth is credit-metered with distributed locking — well beyond the usual "check
bearer, done" pattern. Rate limiting is tiered and tested. Zod-at-the-boundary
is a clean pattern. The main gaps are the absences: no clear sanitization layer,
no visible CSP, no visible secret scanning in the main app. Sentry +
idempotency + dedicated alerts service signal a mature production posture. The
self-hosted gating pattern in CLAUDE.md is a transferable idea.
