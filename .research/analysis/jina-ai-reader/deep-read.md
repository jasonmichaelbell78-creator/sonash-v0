# Deep Read — jina-ai/reader

## Scope

Internal artifacts beyond `.ts` source: documentation files, CI configuration,
build scripts, Dockerfile, workflow secrets, submodule boundary, referenced
external resources.

## Artifacts Present

| Artifact                   | Size / Lines | Read?     | Notes                                                                             |
| -------------------------- | ------------ | --------- | --------------------------------------------------------------------------------- |
| `README.md`                | 12,421 bytes | Yes       | Only first-party doc. User-facing API reference style.                            |
| `LICENSE`                  | 10,826 bytes | Skim only | Apache-2.0 standard text.                                                         |
| `Dockerfile`               | 1,342 bytes  | Yes       | Two-stage: `lwthiker/curl-impersonate:0.6-chrome-slim-bullseye` → `node:22`.      |
| `.github/workflows/cd.yml` | 4,551 bytes  | Yes       | Single workflow, deploy-only; no PR/test workflow.                                |
| `.gitmodules`              | 104 bytes    | Yes       | `thinapps-shared` → `git@github.com:jina-ai/thinapps-shared.git` (private, SSH).  |
| `tsconfig.json`            | 560 bytes    | Yes       | `strict`, `noImplicitReturns`, `noUnusedLocals`, `noImplicitOverride`.            |
| `integrity-check.cjs`      | 269 bytes    | Yes       | 11 lines. Verifies `licensed/GeoLite2-City.mmdb` exists pre-build. Not a test.    |
| `public/robots.txt`        | 28 bytes     | Sample    | Standard.                                                                         |
| `package.json`             | 2,476 bytes  | Yes       | No `test` script. Scripts: `lint`, `build`, `serve`, `start`, `debug`, `dry-run`. |

## Artifacts Absent

- No `docs/` directory
- No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- No Jupyter notebooks
- No `.github/ISSUE_TEMPLATE/` or `pull_request_template.md`
- No `ci.yml` / PR workflow (only `cd.yml`)
- No example scripts beyond the 3 `stand-alone/` runners
- No ADRs or architecture documents

## Knowledge Captured Beyond Source Code

### From `cd.yml` — Deployment Topology

Single image → **6 Cloud Run services** via
`--args build/stand-alone/<entry>.js`:

- `crawl` / `crawl-eu` (us-central1, europe-west1) — powers `r.jina.ai`
- `search` / `search-eu` (us-central1, europe-west1) — powers `s.jina.ai`
- `serp` / `serp-hk` (us-central1, asia-east2) — SERP-only endpoint

Properties: `--async`, `--min-instances 0`, `--deploy-health-check`,
`--use-http2`. Triggers: push to main/ci-debug/dev AND all tags. Fetches
`thinapps-shared` using `THINAPPS_SHARED_READ_TOKEN` secret. Downloads
`GeoLite2-City.mmdb` and `SourceHanSansSC-Regular.otf` at CI time (never
committed, `licensed/` is fetched not versioned).

### From `Dockerfile` — Runtime Envelope

- **curl-impersonate as `LD_PRELOAD`** — Chrome 116 TLS/TCP fingerprint spoofing
  system-wide. Any outbound `libcurl` hop impersonates Chrome network stack.
  This defeats anti-bot fingerprinting that firecrawl/crawl4ai do not.
- Non-root `jina` user (positive security posture).
- `npm run dry-run` executed during Docker build = bootstrap smoke test (catches
  DI failures, not behavior).
- `NODE_COMPILE_CACHE=node_modules` — V8 bytecode cache to cut cold start.
- `EXPOSE 3000 3001 8080 8081` — four ports but Cloud Run uses `PORT=8080`.
- `ENV OVERRIDE_CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable` — real
  Chrome, not Chromium.

### From `thinapps-shared` Import Graph (submodule itself private)

The public repo imports these from `../shared/`:

- `services/rate-limit` — `RateLimitControl`, `RateLimitDesc`,
  `RateLimitTriggeredError`
- `services/proxy-provider` — `ProxyProviderService`
- `services/firebase-storage-bucket` — `FirebaseStorageBucketControl`
- `services/secrets` — `SecretExposer`, `envConfig`
- `services/common-iminterrogate` — `ImageInterrogationManager` (VLM alt-text)
- `lib/firestore` — `FirestoreRecord` base class (extended by 7 public DAOs)
- `db/jina-embeddings-token-account` — auth record
- `db/api-roll` — `API_CALL_STATUS` + billing counters
- `3rd-party/serper-search` — Serper.dev client
- `3rd-party/brave-search`, `3rd-party/brave-types` — Brave Search client
- `3rd-party/jina-embeddings` — `JinaEmbeddingsDashboardHTTP`
- `dto/jina-embeddings-auth` — `JinaEmbeddingsAuthDTO`
- `utils/openai` — `countGPTToken`
- Decorators from `../shared/` index: `CloudHTTPv2`, `CloudTaskV2`, `Ctx`,
  `Param`, `RPCReflect`, `Logger`, `FirebaseStorageBucketControl`

**Implication for adopters:** The repo is **not independently runnable from
source**. A self-hoster must either (a) obtain submodule access from Jina, (b)
stub every `../shared/*` import, or (c) accept the hosted service as-is. This
caveat is absent from the README.

### From `tsconfig.json` — Quality Floor

TypeScript is doing the heavy lifting (no tests). Flags enabled: `strict`,
`noImplicitReturns`, `noUnusedLocals`, `noImplicitOverride`. Flags **not**
enabled: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. ESLint config
file absent — falls back to `eslint-config-google` defaults.

### From `integrity-check.cjs` — Not a Test

Eleven lines. Asserts `licensed/GeoLite2-City.mmdb` exists. Fails build if
absent. Named "integrity check" but is a file-presence check, not an integrity
verification (no checksum).

## External Resources Cataloged for Phase 4b

| URL                                                                                   | Type                           | Relevance Signal                                               |
| ------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `https://jina.ai/reader`                                                              | Homepage + live demo + pricing | Primary product page; pricing indicates commercial focus.      |
| `https://jina.ai/reader#apiform`                                                      | Interactive code builder       | Lets users try header combinations before integrating.         |
| `https://jina.ai/news/jina-reader-for-search-grounding-to-improve-factuality-of-llms` | Blog post                      | Explains `s.jina.ai` rationale (search-grounding for LLMs).    |
| `https://deepwiki.com/jina-ai/reader`                                                 | Auto-generated wiki            | Substitute for real architecture docs. Separate provenance.    |
| `https://colab.research.google.com/drive/1uoBy6_7BhxqpFQ45vuhgDDDGwstaCt4P`           | Colab notebook                 | Full-site fetching pattern — only practical multi-URL example. |
| `https://github.com/puppeteer/puppeteer`                                              | Framework repo                 | Core runtime dependency.                                       |
| `@mozilla/readability` (npm)                                                          | Content extraction library     | The extractor's heart.                                         |
| `https://github.com/lwthiker/curl-impersonate`                                        | TLS fingerprint spoofer        | Docker base image; key differentiator vs peers.                |

## What This Reveals About the Repo's Knowledge

1. **The README teaches how to USE `r.jina.ai`, not how to build one.** The "How
   it works" section is a DeepWiki badge — zero first-party architecture
   exposition.
2. **curl-impersonate is the secret ingredient.** Neither firecrawl nor crawl4ai
   base their runtime on a TLS fingerprint spoofer. This is jina-ai/reader's
   moat.
3. **The repo is a showroom, not a kit.** Public code + private submodule + no
   self-host docs + no tests = "inspect the implementation, use the hosted
   service."
4. **The `x-*` header convention is substantial protocol design.** 11+ headers
   provide runtime control with no URL query-string pollution. Deserves
   promotion as a pattern.
5. **Multi-target deployment from one image is a real pattern.** The `--args`
   trick collapses what would normally be 3-6 separate repos into one.

## Caveats Flagged for Downstream Phases

- Private submodule hides: rate-limit policy details, secrets handling,
  `SecurityCompromiseError` behavior, `marshalErrorLike` sanitization — security
  findings may be under- or over-stated.
- No reproducible build from source alone — self-hosting claims cannot be fully
  verified.
- Velocity signal: last push `2025-05-08`. ~11 months at time of analysis.
  Either "stable in maintenance" or "attention shifted." Flag for Engineer View
  velocity banding.
