# Summary — jina-ai/reader

**URL:** https://github.com/jina-ai/reader **Analyzed:** 2026-04-12 (Standard
depth, v4.5 skill) **License:** Apache-2.0 | **Stars:** 10,540 | **Last Push:**
2025-05-08 (~11 months stale)

## One-line description

Production TypeScript codebase behind `r.jina.ai` — converts any URL to
LLM-friendly markdown via curl-impersonate + Puppeteer + Readability + Turndown,
deployed as 6 Cloud Run services from one Docker image.

## Health Bands

| Dimension       | Band       | Score |
| --------------- | ---------- | ----- |
| Security        | Needs Work | 48    |
| Reliability     | Healthy    | 70    |
| Maintainability | Needs Work | 55    |
| Documentation   | Needs Work | 52    |
| Process         | Critical   | 35    |
| Velocity        | Needs Work | 50    |

## Dual-Lens Verdict

| Lens                  | Score           | Verdict                            |
| --------------------- | --------------- | ---------------------------------- |
| **Creator** (primary) | 72 / Healthy    | Extract patterns selectively       |
| **Adoption**          | 42 / Needs Work | Trial (hosted) / Avoid (self-host) |

## Top Findings

- **S0 x3**: SSRF via `x-proxy-url`, SSRF via `injectFrameScript` raw fetch,
  global `SSL_VERIFYPEER=false`
- **S1 x6**: DNS rebinding, IPv4-mapped IPv6 bypass, bearer tokens as Firestore
  `_id`, weak anon rate limit, no PR workflow, god classes
- **S2 x5** / **S3 x4** (see `findings.jsonl`)

## Top Patterns Worth Studying

1. Multi-provider fallback generator (`iterProviders`) — small port, high reuse
2. `x-*` request header protocol — runtime config surface worth studying for MCP
3. Tiered fetch fallback chain with `sideLoad` body hint
4. `curl-impersonate` as `LD_PRELOAD` Docker layer for TLS fingerprint spoofing
5. Multi-target Cloud Run deployment via `--args` override

## Top Anti-Patterns Flagged

1. "How it works" as DeepWiki badge (no first-party architecture docs)
2. Public repo with private submodule (non-runnable without permissions)
3. Zero automated tests in a 10k-star production service

## Recommendation for SoNash

**Don't adopt the codebase. Consider r.jina.ai (hosted) as a fetch-backend
candidate for `/website-analysis`, but instrument first** — measure the gap in
your current `superpowers-chrome` flow before committing. File the 3 patterns +
3 anti-patterns to the value map. Flag for eventual cross-repo synthesis with
firecrawl / crawl4ai (both already analyzed).
