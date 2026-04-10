# Firecrawl — Engineer View (Summary)

**Source:** mendableai/firecrawl · **Stars:** 106,772 · **Lang:** TypeScript
68.2% **License:** AGPL-3.0 · **Scan:** Standard · **Session:** #273

## Dimension scores

| Dimension       | Score |   Band    | Notes                                                                                            |
| --------------- | :---: | :-------: | ------------------------------------------------------------------------------------------------ |
| Security        |  70   |  Healthy  | Auth well-beyond bearer, tiered rate limiting, Zod boundary; gaps in sanitization/CSP visibility |
| Reliability     |  78   |  Healthy  | Engine fallback chain, Sentry, idempotency service, distributed locks — production posture       |
| Maintainability |  68   |  Healthy  | Clean engine abstraction, version-parallel trees, 7-SDK duplication tax                          |
| Documentation   |  72   |  Healthy  | Strong README + 58 examples + CLAUDE.md, but zero architecture prose docs                        |
| Test Infra      |  85   | Excellent | 9 E2E buckets, capability-gated, dedicated test-site, load tests, harness boot                   |
| Velocity        |  80   |  Healthy  | v2 active, multi-LLM examples kept current (o1 → o3 → o4-mini → Llama 4)                         |

**Composite:** 75.5 — **Healthy** band.

## Adoption assessment: **Extract** (primary) / **Trial** (secondary)

**Extract** the specific transferable patterns: engine-fallback architecture
(for website-analysis expansion), capability-gated test pattern (for SoNash's
test suite), 58-example cookbook pattern (for skill docs). These are bounded,
self-contained ideas that don't require adopting firecrawl itself.

**Trial** (not Adopt) firecrawl-as-a-service if SoNash ever needs heterogeneous
web extraction beyond what chrome-extension covers. The API surface is
well-designed and the hosted tier exists. But don't build SoNash's
website-analysis _on top of_ firecrawl — the dependency weight is wrong for a
personal-tool project.

Don't **Adopt** self-hosted firecrawl. Operational cost is too high for a
personal project (Supabase + Redis + Postgres + 7 workers + Playwright service +
Go HTML-to-MD service). Revisit only if JASON-OS ever ships to environments
where hosted firecrawl isn't accessible.

## Scoring lenses

| Lens     | Score | Band    | Primary? |
| -------- | :---: | ------- | :------: |
| adoption |  77   | Healthy |   yes    |
| creator  |  72   | Healthy |          |

**Quality score:** 77 · **Personal fit:** 60 · **Classification:** active-sprint

Personal fit is moderate — firecrawl is commercial-OSS with a different
architecture profile than SoNash, but several bounded patterns port cleanly. Not
a direct dependency, but worth having in the mental model when expanding
extraction surface.

## Dimension detail

See:

- `dimensions/security.md` — Auth model, input validation, rate limiting,
  Sentry, self-hosted gating
- `dimensions/architecture.md` — 13 sub-apps, version-parallel controllers,
  scrapeURL engine abstraction, queue infrastructure, service layer
- `dimensions/documentation.md` — README strength, CLAUDE.md exemplary, 58
  examples, architecture doc absence
- `dimensions/tests.md` — 9 E2E buckets, capability gating, harness boot,
  test-site + test-suite sub-apps
- `deep-read.md` — Artifact catalog, examples inventory, feed-forward to creator
  view
- `creator-view.md` — Primary analytical output
- `content-eval.jsonl` — 14 content items scored against SoNash context
- `value-map.json` — Knowledge/pattern/content/anti-pattern candidates (next
  phase)

## Notable absences

- No `docs/` directory with architecture prose
- No ADR log
- No v0→v1→v2 migration guide
- No feature flag layer (env-var branching instead)
- No shared SDK package (manual polyglot parity)
- No visible secret scanning config
- No coverage threshold / mutation testing in the Jest setup
