# Test Infrastructure Dimension — jina-ai/reader

## Headline Band: Critical (22/100)

Zero automated tests, zero test-step in CI, zero custom lint rules. Quality
rests on three thin pillars: TypeScript `strict`, Google's ESLint style config,
and a Dockerfile-embedded startup smoke test (`npm run dry-run`) that fails the
image build if DI wiring can't bootstrap. An adopter self-hosting this code
inherits a black box — they'll discover regressions the way Jina does: in
production, on Cloud Run, behind a managed health check.

---

## Test presence

- **Count found:** 0 test files
  - No `.test.ts`, `.test.js`, `.spec.ts`, `.spec.js` anywhere
  - No `tests/`, `test/`, `__tests__/`, `__test__/`, `spec/` directories
  - No `describe(`, no `it(` in source (one hit — `test()` method on the `CIDR`
    class in `utils/ip.ts:106` — is unrelated business logic)
- **Test framework declared:** `firebase-functions-test@^3.0.0` in
  `devDependencies` — **never imported anywhere** in the codebase. Orphaned dep,
  likely legacy from an earlier template.
- **Test script:** `package.json` has **no `test` script**. `npm test` would run
  the npm default (exit 1 with "no test specified"). The 8 scripts present
  (`lint`, `build`, `build:watch`, `build:clean`, `serve`, `debug`, `start`,
  `dry-run`) are all build/run/serve — none execute assertions.
- **Patterns used:** N/A — nothing to pattern-match.

## CI / automation

- **Workflow files:** Exactly one — `.github/workflows/cd.yml` (plus an empty
  `.keep`). Named "Build push and deploy (CD)". **No CI workflow exists.**
- **Triggers:** Push to `main`, `dev`, `ci-debug`, and any tag.
- **What CI runs (in order):**
  1. `npm ci` (install)
  2. Download MaxMind GeoLite2 + Source Han Sans (external fetch)
  3. `npm run build` → `integrity-check.cjs && tsc -p .`
  4. `npm version --no-git-tag-version ${RELEASE_VERSION}` (on tag push)
  5. `docker build` (which internally runs `npm run dry-run` — see below)
  6. `docker push` to GCR `us-docker.pkg.dev/reader-6b7dc/jina-reader/reader`
  7. `gcloud run deploy` to 6 Cloud Run services × regions: `crawl`, `search`,
     `serp` (us-central1), `crawl-eu`, `search-eu` (europe-west1), `serp-hk`
     (asia-east2)
- **No quality gates:** no test step, no coverage check, no security scan
  (`npm audit`, CodeQL, Snyk all absent), no container scan, no preview/staging
  deploy. **Tag push → production.** The sole pre-deploy guard is Cloud Run's
  `--deploy-health-check` flag, which checks that the container's HTTP port
  responds; it does not assert behavior.
- **No PR workflow:** there's no `.github/workflows/pr.yml`, `ci.yml`, or lint
  workflow. Pull requests receive zero automated feedback.

## Type safety as compensation

- **`tsconfig.json` strictness:** `strict: true` plus `noImplicitReturns`,
  `noUnusedLocals`, `noImplicitOverride`. **Target es2022, Node16 modules.**
- **Type-aware linting:** None. `@typescript-eslint/*` v5.12 is installed but no
  ESLint config file exists anywhere (`.eslintrc.*`, `eslint.config.js`) and
  `package.json` has no `eslintConfig` field. ESLint therefore falls back to
  whatever plugins load by default — in practice the Google style guide only,
  since `eslint-config-google` is a devDependency.
- **Net effect:** TypeScript carries the entire quality burden. It catches `any`
  leaks and null-dereference in new code, but cannot assert behavioral contracts
  (rate-limiter correctness, markdown tidying edge cases, puppeteer stealth
  bypass effectiveness, PDF text extraction fidelity, SERP provider parity).
  Strict types can't tell you that your Readability replacement broke on a site
  class with `<article role="main">`.
- **Gap vs. SoNash baseline:** SoNash runs ~3,500 tests on top of TypeScript
  strict. Jina Reader's ratio is 0:0.

## Integrity checks

- **`integrity-check.cjs` purpose:** 11 lines. Verifies
  `licensed/GeoLite2-City.mmdb` exists before `tsc` runs. Exits 1 if absent.
  This is a **build prerequisite check**, not a test. It protects against
  shipping an image without the GeoIP database — a runtime crash that would
  otherwise surface only when the first request hits IP-lookup code. Zero
  behavioral coverage.
- **`dry-run` purpose:** `NODE_ENV=dry-run node ./build/stand-alone/search.js`.
  In `src/stand-alone/search.ts:174-178` the entry point branches:
  ```ts
  if (process.env.NODE_ENV?.includes('dry-run')) {
      instance.serviceReady().then(() => finalizer.terminate());
  } else {
      instance.serviceReady().then((s) => s.h2c().listen(...));
  }
  ```
  It instantiates the full tsyringe DI container, resolves
  `SearchStandAloneServer`, waits for `serviceReady()` (which awaits all
  `AsyncService` dependencies), then exits cleanly. **This is a startup smoke
  test.** It catches: circular DI, missing env vars that throw in `init()`,
  Firestore/Minio/GeoIP client misconfiguration surfaced at boot. It does
  **not** catch: wrong HTTP response shape, broken crawl output, SERP provider
  regression, markdown mis-formatting, auth bypass, rate-limit drift.
- **Where dry-run actually runs:** `Dockerfile:32` —
  `RUN NODE_COMPILE_CACHE=node_modules npm run dry-run`. This makes dry-run a
  **Docker build-time gate**: if the service can't bootstrap inside the final
  image (with licensed MMDB, fonts, Chrome, curl-impersonate all in place), the
  `docker build` command fails and CI won't push. It's the closest thing to a
  pre-deploy quality check they have.
- **Substitute for tests?** Only for "does the app start?" — equivalent to a
  bare liveness probe. It's better than nothing, but it's maybe 5% of what a
  real test suite provides.

## Testability of the code

- **tsyringe DI is pervasive:** 34+ `singleton()` / `@singleton()` usages. Every
  `services/` class and every API host is a tsyringe-managed singleton resolved
  via `container.resolve(...)` at the entry point. **In principle**, swap-out
  via `container.register(Token, { useValue: mock })` is viable. This is the
  best testability signal in the codebase.
- **`utils/` is test-friendly:** `utils/markdown.ts` (`tidyMarkdown`),
  `utils/encoding.ts` (`decodeFileStream`), `utils/ip.ts` (CIDR parsing) are
  pure or near-pure functions with string/Buffer inputs and string/Buffer
  outputs. These could have unit tests shipping tomorrow. None exist.
- **`db/` is not easily mockable:** Seven files (`crawled.ts`, `searched.ts`,
  `pdf.ts`, `img-alt.ts`, `domain-blockade.ts`, `domain-profile.ts`,
  `adaptive-crawl-task.ts`) all `extends FirestoreRecord` from
  `thinapps-shared/backend`. Testing any of them requires either
  `firebase-functions-test` harness (installed but unused) or an emulator
  running (no `firebase.json` visible, no emulator setup). **14 references** to
  FirestoreRecord means the db layer is tightly bound to Firestore semantics.
- **Services coupled to heavyweight subsystems:** `services/puppeteer.ts`
  imports real Puppeteer, reads `Readability.js` from disk at module load, owns
  browser lifecycle. `services/curl.ts` wraps `node-libcurl`.
  `services/geoip.ts` owns a maxmind reader. Unit-testing any of these requires
  either exhaustive interface mocks or containerized integration environments.
  The shared submodule `thinapps-shared` is not inspectable here (git submodule,
  external repo).
- **Coupled entry points:** `src/stand-alone/search.ts` does
  `container.resolve(SearchStandAloneServer)` at module load and instantiates a
  default export singleton. Importing the module for testing triggers the whole
  DI graph — no way to isolate the class without Jest module-factory mocking or
  `container.reset()` dance.
- **Summary:** Utils are trivially testable. Services are testable via DI but
  expensive. db layer is essentially untestable without a Firestore emulator.
  The codebase could support tests — it simply doesn't have any.

## Production validation

- **How they catch regressions:** Cloud Run `--deploy-health-check` (L4
  readiness ping), dry-run smoke test at image build, and — inferred —
  production observability. The `services/logger.ts` + pino-pretty dep suggests
  structured logging to GCP Cloud Logging, and the 6 Cloud Run services emit
  traces to Cloud Trace (evidenced by `x-cloud-trace-context` handling in
  `search.ts:137`). **The production dashboard is the test suite.**
- **Commit cadence signal:** Last push 2025-05-08 (~11 months ago at time of
  assessment). Combined with the deploy-on-tag CI, this reads as "stable service
  in maintenance mode" rather than "abandoned." r.jina.ai is a live,
  commercially-used endpoint — if it were broken, it would be visible
  externally. That's not the same as saying the code is healthy; it means the
  happy path is production-hardened by volume.
- **Weakness:** regressions on edge-case paths (a new site class that breaks the
  Readability extractor, a SERP provider changing its response shape, a
  rate-limit logic drift between the three API hosts) have no pre-deploy
  detector. Internal team may have undocumented manual QA or private staging
  tests, but nothing is in the public repo.

## Impact on adoption decision

- **For self-hosting:** High risk. An adopter cloning this repo has no way to:
  1. Verify their build works beyond "does the container start"
  2. Validate they didn't break anything when patching (e.g., swapping SERP
     providers, tweaking rate limits, customizing the extractor)
  3. Catch Firestore schema drift after civkit or firebase-admin upgrades
  4. Regression-test the markdown pipeline after adding a site-specific rule
     They'd be writing their own test suite from scratch before they can
     confidently modify anything.
- **For extraction/inspiration (reading code to port patterns):** Low risk.
  Individual functions (`tidyMarkdown`, puppeteer stealth config, SERP fallback
  chain) can be lifted and wrapped in tests in the adopter's project. The lack
  of tests doesn't hurt this use case.
- **For forking as a baseline:** Medium-high risk. A fork that diverges
  meaningfully needs tests added immediately — before the first significant
  change — or it inherits all the silent-regression risk that Jina's production
  dashboard currently absorbs.
- **Stance:** This is **"mature service that has been production-hardened
  despite having no tests,"** not "technical debt adopters inherit" — but only
  if you're Jina operating it at scale with real-time observability. For anyone
  else, the production-hardening doesn't transfer. The evidence: (a) it's live
  and serving traffic commercially, (b) CI deploys to 6 regions on tag push
  without blowing up, (c) the dry-run smoke test and integrity check show
  someone did think about bootstrap failure modes, (d) low commit velocity reads
  as "stable" given the lights are still on. But an adopter doesn't have the
  logging, the traffic volume, or the institutional knowledge of "what usually
  breaks," so the hardening doesn't come with the code.

## Summary

jina-ai/reader has **zero tests, no CI gate, no lint rules beyond Google
style**, and relies entirely on TypeScript strict mode plus a Dockerfile-
embedded startup smoke test (`dry-run`) as its quality floor. It's survived in
production because Jina operates it with real-time observability, not because
the code is self-verifying. The codebase is testable in principle (pervasive
tsyringe DI, pure utils) but expensive in practice (Firestore coupling,
Puppeteer lifecycle). For adopters, this is the riskiest dimension of the repo:
you cannot self-host with confidence or fork without immediately writing your
own test suite. **Critical band, 22/100** — the score isn't lower only because
the dry-run smoke test and integrity-check.cjs show deliberate (if minimal)
engineering around bootstrap failure modes.
