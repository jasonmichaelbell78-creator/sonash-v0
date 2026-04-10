# Engineer View Summary — opendatalab/MinerU

**Skill version:** repo-analysis v4.3 **Depth:** standard **Generated:**
2026-04-10 **Upgraded from:** quick scan (2026-04-09)

## Snapshot

| Field           | Value                                         |
| --------------- | --------------------------------------------- |
| Repository      | opendatalab/MinerU                            |
| Stars           | 58,549                                        |
| Forks           | 4,848                                         |
| Contributors    | 73                                            |
| Language        | Python                                        |
| License         | AGPL-3.0 (strong copyleft — adoption blocker) |
| Latest tag      | v3.0.0 (2026/03/29)                           |
| Open issues     | 160                                           |
| Repo type       | framework (document-parsing-engine)           |
| Absence pattern | none (well-developed across all dimensions)   |

## 6-dimension scoring bands

| Dimension       | Band | Score | Notes                                                              |
| --------------- | ---- | ----- | ------------------------------------------------------------------ |
| Security        | C    | 68    | Solid path handling + no hardcoded secrets, but HTTP API unarmored |
| Reliability     | A    | 94    | Sliding window, thread-safety, TTL cleanup, graceful degradation   |
| Maintainability | B    | 78    | Clean backend separation, good code organization, few comments     |
| Documentation   | B    | 70    | Exemplary output schema + env-var catalog, gaps in API ref + i18n  |
| Process         | A    | 85    | Thoughtful changelogs, CLA, disclosure process, linked CVEs        |
| Velocity        | A    | 95    | 3.0 released 2026/03/29, 73 contributors, high issue throughput    |
| Architecture    | A    | 88    | Three-backend pattern, scored router, async task API — high signal |
| Tests           | F    | 18    | One e2e test, 0.2% coverage floor, no PR test gating               |

**Composite (weighted):** 74/100 — "Good" with notable split between excellent
architecture/velocity and poor test/security posture.

## Absence pattern

`none` — MinerU is well-developed across all dimensions, including dimensions
the automated classifiers would otherwise flag as absent. No category scores
zero.

## Adoption verdict

**Extract** (patterns + knowledge), not **Adopt** (as dependency).

Three adoption blockers make direct dependency inadvisable:

1. **AGPL-3.0 license** — Strong copyleft triggers SoNash's own licensing
   concerns. Even as a runtime dependency, AGPL's network-use clause is risky
   for any SoNash feature that might expose MinerU-processed output through a
   web endpoint.
2. **Test thinness** — One e2e test is not a quality baseline SoNash can trust.
   Regressions would land silently.
3. **HTTP surface unarmored** — If SoNash were to deploy mineru-api anywhere, it
   would require auth/rate-limit/upload-cap middleware that the upstream doesn't
   ship. Maintaining a hardened fork is more cost than copying the patterns.

**What to extract:**

- Architectural patterns (three-backend dispatch, async task state machine,
  scored load balancer) — as knowledge, not code
- Documentation patterns (structured output contract page, env-var catalog,
  hardware decision matrix) — as templates to mirror for SoNash's own docs
- Lessons to avoid (test thinness, unarmored HTTP, silent-retry CI, i18n drift)
  — as anti-patterns to guard against

## Two-lens scoring

| Lens     | Score | Band      | Notes                                                    |
| -------- | ----- | --------- | -------------------------------------------------------- |
| Adoption | 52    | Trial     | AGPL + test thinness + unarmored HTTP blocks adoption    |
| Creator  | 82    | Excellent | High-signal architecture + strong documentation patterns |

**Primary lens: adoption** (default for framework/library repos). Creator lens
reported as secondary because the creator-view findings are the valuable output
of this analysis, not the adoption verdict.

## Key strengths

- **Three-backend pattern with clean dispatch** (mineru/backend/): pipeline,
  vlm, hybrid with duck-typed signatures and deferred imports
- **Sliding window memory bounding** applied identically across all three
  backends (default size 64, tunable via MINERU_PROCESSING_WINDOW_SIZE)
- **Scored router load balancer**: (queued + processing + pending) /
  max_concurrent with shuffle+sort jitter
- **Exemplary structured output spec** (docs/en/reference/output_files.md)
- **Prose env-var catalog** (docs/en/usage/cli_tools.md) — 15+ tunables
  documented with defaults, effects, scoping
- **Hardware decision matrix** in quick_start (5 backends × 8 constraints)
- **Changelog discipline**: prose with issue refs, CVE refs, quantified perf
  improvements, explicit breaking-change callouts
- **Layered install recipes** via pyproject.toml optional-dependencies
- **Thread-safety optimization** shipped in 3.0.0 with explicit threading.RLock
  and threading.Lock predicate guards

## Key weaknesses

- **Test infrastructure near-absence**: 1 test file, 1 test function, 0.2%
  coverage floor, no PR test gating, silent retry workflow masking flake
- **HTTP API unarmored**: no auth, no rate limit, no upload size cap, no CORS
  middleware, no TrustedHost, FastAPI docs enabled by default
- **SSRF primitive**: user-controlled server_url field in vlm-http-client mode
  is a textbook SSRF vector
- **i18n parity broken**: 13 Chinese-only acceleration card docs with no English
  equivalents; the README claims 10+ chip support but English readers get
  nothing concrete
- **FAQ outsourced to AI assistant**: 2 real FAQ entries, rest defers to an
  external tool
- **Single-PDF test corpus**: no DOCX/PPTX/image fixtures in tests
- **No backend decision matrix as a single page**: scattered across 3 docs
- **No API reference page**: endpoint docs buried in a TIP admonition in a usage
  page

## Timeline context

- **v2.5** (2025/09): first VLM technical report, breaking output changes
- **v2.6** (2025/10): mlx-engine, chinese formula support, ocr speed +200%
- **v2.7** (2025/12–2026/02): hybrid backend, 10+ chinese chip adapters
- **v3.0** (2026/03/29, 12 days before this analysis): DOCX native parsing,
  async task API, mineru-router, sliding window, thread-safety, streaming
  writes, removed AGPLv3-encumbered models

v3.0.0 is major and recent — this analysis captures the repo at a moment where
many patterns just shipped.

## Self-audit notes

- All 6 MUST creator-view sections present
- All 4 dimension-wave files present with summary bands
- Coverage audit to follow in Phase 6b
- No extraction candidates include code lift (AGPL blocker) — all are
  knowledge/pattern tier
