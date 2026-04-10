# Firecrawl — Test Infrastructure Dimension

**Source:** mendableai/firecrawl · **Analyzed:** 2026-04-10 · **Session:** #273

## Test runner

**Jest 30** across the TypeScript code. Individual test commands in
`apps/api/package.json`:

```
test               → excludes e2e_noAuth
test:local-no-auth → excludes e2e_withAuth
test:full          → excludes BOTH e2e_noAuth and e2e_withAuth (unit only)
test:prod          → excludes noAuth, full_withAuth, and scrapeURL engine tests
test:snips         → ONLY runs snips/v1, snips/v2
```

Five distinct Jest invocations — each targeting a different runtime / credential
tier. This is the production-grade answer to "my tests keep hitting live APIs in
CI".

## Test directory stratification

`apps/api/src/__tests__/` has a surprisingly precise bucket structure:

```
__tests__/
  snips/                  — integration tests (v0, v1, v2, mocks, utils)
  e2e_noAuth/             — self-hostable E2E (no hosted creds)
  e2e_withAuth/           — hosted E2E (needs hosted creds)
  e2e_full_withAuth/      — long-running hosted E2E
  e2e_v1_withAuth/        — v1-specific hosted E2E
  e2e_v1_withAuth_all_params/ — parameter coverage sweep
  e2e_extract/            — extract endpoint E2E
  e2e_map/                — map endpoint E2E
  deep-research/unit/     — deep research unit tests
  lib/                    — lib-level tests (branding, etc.)
```

Nine parallel buckets. The stratification by endpoint (`e2e_extract`,
`e2e_map`), version (`e2e_v1_*`), and auth requirement (`_noAuth`, `_withAuth`,
`_full_withAuth`) means CI can run exactly the subset that matches the current
environment's capabilities.

## Inline colocated tests

Outside `__tests__/`, tests are colocated with source:

- `services/rate-limiter.test.ts`
- `lib/canonical-url.test.ts`
- `lib/crawl-redis.test.ts`
- `lib/ranker.test.ts`
- `lib/validateUrl.test.ts`
- `lib/permu-refactor.test.ts`
- `lib/__tests__/` — multiple utility tests (deduplicate-obs-array,
  html-to-markdown, html-transformer, job-priority, merge-null-val-objs,
  mix-schemas, spread-schema-objects, transform-array-to-obj, url-utils)
- `controllers/v1/__tests__/urlValidation.test.ts`
- `controllers/v2/__tests__/agent-status.test.ts`
- `controllers/v2/__tests__/browser-billing.test.ts`
- `scraper/scrapeURL/scrapeURL.test.ts`

Unit tests follow one layout, integration/E2E tests follow another. No ambiguity
about "where do I put a new test?".

## Test gating (exemplary pattern)

From CLAUDE.md (verbatim):

> These tests will be ran on a variety of configurations. You should gate tests
> in the following manner:
>
> - If it requires fire-engine: `!process.env.TEST_SUITE_SELF_HOSTED`
> - If it requires AI:
>   `!process.env.TEST_SUITE_SELF_HOSTED || process.env.OPENAI_API_KEY || process.env.OLLAMA_BASE_URL`

This is a **runtime capability check**, not a "skip in CI" fence. Self-hosted
users run the same test file but hit the locally-available subset. The gate
logic is documented once and reused. This is the right pattern for any project
with tiered service dependencies.

## Harness pattern

```bash
pnpm harness jest ...
```

`apps/api/src/harness.ts` boots the API server + workers before Jest runs.
CLAUDE.md explicitly warns not to `pnpm start` manually. The harness
encapsulates boot order + teardown — tests can assume the services are up.
Contrast with most projects that spawn a dev server in `beforeAll` per test
file.

Required util: `scrapeTimeout` from `./lib` — CLAUDE.md mandates it for all
scrape timeouts so they stay consistent across tests. Centralized timeout
constant is the right move for flaky network tests.

## Test-site + test-suite sub-apps

- `apps/test-site/` — reference HTML site that scrape tests can hit without
  leaving the repo. Known, stable content = deterministic tests.
- `apps/test-suite/` — has `load-test.yml` (load tests), `package.json`,
  pnpm-lock. Load tests are first-class, not an afterthought.

Most OSS projects scrape real public sites in tests and then wonder why CI is
flaky. Firecrawl sidesteps this by shipping its own test site.

## Absence patterns

- **No visible coverage config.** Didn't find a `jest.config` coverage threshold
  or `c8` / `nyc` setup in the quick sweep.
- **No visible mutation testing** (stryker etc.).
- **No visible contract test** against the frozen OpenAPI specs — SDKs aren't
  test-verified to match the current openapi.json in this sweep. (Coverage audit
  could dig deeper.)

## Band: Excellent (85)

The test stratification is exemplary. Nine E2E buckets split by auth / endpoint
/ version, five Jest invocations for different environments, a harness that owns
service boot, a capability-gated pattern in CLAUDE.md, a dedicated test-site
sub-app for deterministic scraping, and a test-suite sub-app with load tests.
The `snips` naming convention is cute ("snippets" = integration tests) but
actually communicates the intent — "short, self-contained runs". The pattern
"gate tests by runtime capability, not by CI fence" is the transferable idea
worth writing down.
