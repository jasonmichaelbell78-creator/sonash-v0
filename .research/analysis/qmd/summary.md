# Engineer View: tobi/qmd

## Repository Profile

| Metric                | Value                                        |
| --------------------- | -------------------------------------------- |
| Stars                 | 21,126                                       |
| Forks                 | 1,297                                        |
| Open Issues           | 293                                          |
| Contributors          | 30+ (page 1)                                 |
| Language              | TypeScript                                   |
| License               | MIT                                          |
| Latest Release        | v2.1.0 (2026-04-05)                          |
| Last Push             | 2026-04-11 (yesterday)                       |
| Repo Age              | 4 months (created 2025-12-08)                |
| Files                 | 141                                          |
| Source LOC            | ~13,298 (TypeScript)                         |
| Test LOC              | ~12,213 (1:0.92 test-to-source ratio)        |
| Direct Dependencies   | 9 (very small)                               |
| Optional Dependencies | 8 (platform binaries + tree-sitter grammars) |
| Author                | Tobi Lütke (Shopify CEO)                     |

## Summary Bands

| Dimension       | Band    | Score | Key Evidence                                                                                                                                                        |
| --------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | A- (83) | 83    | Minimal attack surface (9 deps, exact pins). Local-first (no API keys). No auth needed (CLI). MCP binds localhost. Minor: HTTP daemon no auth.                      |
| Reliability     | A- (85) | 85    | Multi-runtime tested (Node 22/23 + Bun × ubuntu/macos). 0.92 test ratio. Rich eval harness. 25+ community PRs fixed stability bugs in v2.1.0.                       |
| Maintainability | A- (84) | 84    | Small, focused codebase. Clean CLI/SDK/MCP separation. Keep-a-Changelog discipline. Exact dep pins. But store.ts is 4673 lines (monolith risk).                     |
| Documentation   | A (88)  | 88    | 945-line README with ASCII architecture diagram + scoring formulas. Formal EBNF query syntax. Detailed CHANGELOG. finetune/README is thorough.                      |
| Process         | A- (85) | 85    | 3 CI workflows (ci, nix, publish). Matrix testing. Nix flake for reproducibility. Release skill enforces changelog + dep updates. 25+ community PRs in one release. |
| Velocity        | A (92)  | 92    | 21K stars in 4 months. v2.1.0 in 4 months (7 minor/patch releases). Pushed yesterday. 25+ contributors per release. Tobi personally reviews.                        |

## Absence Pattern Analysis

| Pattern                 | Present? | Evidence                                                                                         |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| CONTRIBUTING.md         | ABSENT   | Contribution guide not explicitly documented                                                     |
| E2E tests               | PARTIAL  | No Playwright/Cypress, but CLI integration tests + smoke-install.sh + launcher-detection.test.sh |
| Frontend tests          | N/A      | No frontend                                                                                      |
| API documentation       | PRESENT  | docs/SYNTAX.md + README SDK section                                                              |
| Plugin documentation    | PRESENT  | marketplace.json + SKILL.md files                                                                |
| .env.example            | N/A      | No env-var complexity                                                                            |
| Changelog               | PRESENT  | Excellent — Keep a Changelog format                                                              |
| Dependency scanning CI  | ABSENT   | No Dependabot/Snyk visible                                                                       |
| Code coverage reporting | ABSENT   | No coverage threshold or codecov                                                                 |
| Auth on HTTP server     | ABSENT   | Localhost-only binding is the only safety                                                        |
| Retrieval feedback loop | ABSENT   | No user-feedback-driven reranking                                                                |
| MCP auth for HTTP       | ABSENT   | No per-client auth tokens                                                                        |

## Detailed Dimension Scores (inline analysis)

### Security (inline)

| Sub-dimension                 | Score | Band         |
| ----------------------------- | ----- | ------------ |
| Attack surface (dependencies) | 95    | A+           |
| Authentication/authz model    | 70    | B-           |
| Input validation (Zod)        | 85    | A            |
| Secrets management            | N/A   | (no secrets) |
| Rate limiting                 | N/A   | (local tool) |
| Infrastructure security       | 85    | A            |

### Architecture (inline)

| Sub-dimension            | Score | Band |
| ------------------------ | ----- | ---- |
| CLI/SDK/MCP separation   | 88    | A    |
| Search pipeline design   | 92    | A+   |
| Chunking algorithm       | 88    | A    |
| Plugin architecture      | 90    | A    |
| Module boundaries        | 75    | B    |
| Monolith risk (store.ts) | 65    | C+   |

### Documentation (inline)

| Sub-dimension            | Score | Band |
| ------------------------ | ----- | ---- |
| README quality           | 95    | A+   |
| Architecture docs        | 90    | A    |
| Query syntax spec (EBNF) | 95    | A+   |
| CHANGELOG discipline     | 92    | A    |
| CLAUDE.md / AGENTS.md    | 78    | B    |
| SKILL.md files           | 88    | A    |
| Code comments (JSDoc)    | 75    | B    |

### Test Infrastructure (inline)

| Sub-dimension                  | Score | Band |
| ------------------------------ | ----- | ---- |
| Framework config (Vitest)      | 85    | A    |
| Test-to-source ratio (0.92)    | 92    | A    |
| Eval harness                   | 92    | A    |
| Benchmark framework            | 88    | A    |
| CI matrix (multi-runtime × OS) | 90    | A    |
| Mocking strategy               | 75    | B    |
| Coverage reporting             | 30    | D    |

## Dual-Lens Scoring

### Adoption Lens (primary for library/tool)

| Factor                  | Score     | Notes                                                                                                       |
| ----------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| Would I install this?   | 92        | Yes — `npm install -g @tobilu/qmd` then `qmd collection add .research`. Solves a real SoNash problem today. |
| Would I contribute?     | 85        | Active, responsive, MIT-licensed. 25+ community PRs in v2.1.0.                                              |
| Would I depend on this? | 80        | 9 direct deps, exact pins, Tobi's active stewardship. Personal project risk.                                |
| Overall Adoption        | **Adopt** | Real candidate for SoNash extraction-journal.jsonl search layer.                                            |

### Creator Lens (pattern extraction)

| Factor                       | Score       | Notes                                                                                 |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| What does it teach?          | 92          | Claude Code plugin, MCP transports, query DSL, RRF + blending, chunking, fine-tuning. |
| How does it challenge me?    | 95          | Why doesn't SoNash have this? Plugin packaging gap. Search layer gap.                 |
| What patterns can I extract? | 90          | 15 candidates (4 T1 high-relevance, 5 T2, 6 T3).                                      |
| Overall Creator              | **Extract** | High extraction value AND high adoption value — rare combination.                     |

**Primary Lens:** Both (Adoption + Creator) — this repo uniquely scores high on
both. Most repos are one or the other.

## Adoption Assessment: Adopt (with extraction)

Unlike Outline (Extract-only due to different product domain + BSL license), qmd
is a genuine Adopt candidate. SoNash could install qmd today and use it to
search extraction-journal.jsonl. The data format is compatible (markdown +
metadata). The extraction value is separate and additional — plugin
architecture, skill frontmatter patterns, MCP transports, query DSL.

**Recommended next steps:**

1. **Adopt:** `npm install -g @tobilu/qmd` and
   `qmd collection add .research --name extractions`. Try it on the existing
   extraction-journal. Low risk, immediate value.
2. **Extract:** Claude Code plugin manifest pattern (marketplace.json) for
   future SoNash plugin packaging.
3. **Extract:** `allowed-tools` + `disable-model-invocation` frontmatter for
   SoNash's 81 skills.
4. **Extract:** Query DSL design for SoNash's recall skill.
