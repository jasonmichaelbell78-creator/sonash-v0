# Decision Record: Repo-Wide Code Quality Overhaul

**Date:** 2026-03-12
**Questions Asked:** 26
**Decisions Captured:** 26

## Cross-Cutting Directives

These user directives apply to ALL workstreams and override any individual decision that might conflict:

1. **Zero warnings target** — CI failures are getting ridiculous
2. **No half measures** — full solutions where avoidable
3. **Warnings must demand action (block, not inform)** — warnings without action are useless
4. **Guardrails AND fix problems** — applies to EVERYTHING, not just individual workstreams
5. **Fix ALL violations** — triage determines order, not scope
6. **Research loop is convergence-based** — repeat until no new issues found
7. **Each step needs extensive testing** — guard against severe breakage
8. **All files are AI-maintained** — MD is for human consumption, JSONL is for AI consumption
9. **Final reconciliation required** — parse ROADMAP, planning files, MASTER_DEBT for completed items

## Scope & Strategy Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Plan 1/Plan 2 overlap on WS7 (Orphans) | Plan 1 = one-time cleanup, Plan 2 = automated detection tooling (SKILL_INDEX↔filesystem, npm script↔file, hook↔file validators). Complementary. | Prevents orphans from recurring; Plan 1 handles existing mess, Plan 2 builds prevention |
| 2 | ESLint v10 migration ordering | v10 migration FIRST, then warning triage on v10 state. Upgrade changes warning landscape. | v10 adds 3 new rules, changes JSX tracking, sonash plugin needs API migration. Triaging on v9 then upgrading would invalidate triage. |
| 3 | Warning reduction target | Zero warnings (or as close as humanly possible). | User wants clean CI, not managed baselines |
| 6 | MD readers (4 ROADMAP.md scripts) | Leave as-is. ROADMAP stays without JSONL backing. | Despite AI-maintained reframe, ROADMAP conversion too large/disruptive for this plan's scope |
| 12 | Multi-agent research loop specification | 4-pass convergence loop: SCAN→TRIAGE→IMPLEMENT→VERIFY as loop body, repeated until verify pass finds zero new issues. Each pass produces JSONL artifacts. | Most thorough. Convergence-based termination ensures nothing is missed. Auditable via JSONL artifacts per pass. |
| 13 | Warning-as-blocker strategy | Cleanup first, then lock: fix warnings → `--max-warnings 0` in CI. Pre-commit stays warn-level. | Zero tolerance in CI after cleanup. Pre-commit warn for developer ergonomics. Cleanup IS the plan; `--max-warnings 0` is the lock. |
| 19 | Implementation ordering | v10 → warning triage → complexity ‖ propagation ‖ fragility → truncation guardrails → orphan detection → lock + MD audit. Each step has extensive testing. Final reconciliation step. | v10 first (changes warning landscape), then cleanup, then lock. Parallelization where safe. |
| 20 | Baseline management during transition | `--max-warnings N` ratchet in CI (never increases) + pre-commit blocks new warnings on staged files. Belt and suspenders. | Ratchet + pre-commit = monotonic decrease toward zero. Count can only go down. |
| 23 | Plan 1 vs Plan 2 execution sequencing | Plan 1 fully first, then Plan 2 with explicit handoff notes. | Plan 1 is smaller/faster. Completing it first gives Plan 2 a clean baseline — plugin optimized, dead code removed, workflows fixed. |
| 24 | Per-rule fix strategies | Pre-specify fix patterns in plan: `no-unused-vars`=remove, `no-non-atomic-write`=temp+rename, `complexity`=extract functions, `no-unguarded-loadconfig`=try/catch. Research loop applies recipes. | Loop is execution mechanism. Known fix patterns shouldn't be research questions. |

## WS1: MD → JSONL Audit

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 25 | WS1 scope — AI-facing file audit | Research loop audits ALL AI-facing MDs (SKILL_INDEX.md, SESSION_CONTEXT.md, etc.) → per-file recommendation (JSONL-back / leave as prose / hybrid). ROADMAP.md excluded (D#6). | All files are AI-maintained. JSONL is better for AI. Loop determines which files justify pipeline investment. |

## WS2: ESLint Cleanup + v10 Migration

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 7 | Security false positive handling | Disable both `eslint-plugin-security` rules (`detect-non-literal-fs-filename`, `detect-object-injection`). −517 warnings. | Notoriously high false-positive rates. Semgrep + CodeQL + SonarCloud cover same attack surface with far better precision. |
| 18 | ESLint v10 sonash plugin migration | TDD migration: pin existing tests on v9 as baseline → upgrade to v10 → fix each rule until tests pass. Tests need mechanical migration too (remove `type` property). | Existing test suite is safety net. Tests define correct behavior; migration changes implementation. |
| 21 | oxlint interaction | Audit rule overlap post-v10, deduplicate (disable duplicates in oxlint), keep oxlint for speed on unique rules in pre-commit. | oxlint speed valuable in pre-commit. Post-v10 overlap creates authority confusion. Deduplicate. |
| 22 | `no-unsafe-error-access` (472 warnings) | Tighten rule first (skip typed catch, skip instanceof-guarded → reduce false positives), then research loop triages remaining. | Rule improvement before loop run = most efficient. Don't fix 200+ false positives manually. |

## WS3: Propagation Pattern Fixes

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 8 | Propagation rule expansion | Full expansion: fix ALL existing violations, add new patterns from research loop, make function-duplicate detection a blocker. | "Guardrails AND fix problems" applies to everything. |

## WS4: Cyclomatic/Cognitive Complexity

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 4 | Complexity scope | Add cognitive complexity (`eslint-plugin-sonarjs`) AND fix all pre-existing CC>15 violations. | Not just prevention — active remediation of 358 existing violations |
| 9 | CC refactoring triage strategy | Hybrid severity × domain weight for ordering, fix ALL 358. CC>25 in pre-commit hook outranks CC>35 in test helper. | Triage determines order, not scope. Hybrid catches dangerous-by-complexity AND dangerous-by-context. |
| 10 | Cognitive complexity threshold | 15 (sonarjs default), matching CC. Both rules active. Enforcement: warn → error for staged → blocker in CI after cleanup. | Cognitive and cyclomatic measure different things. Both catch real problems. No warnings without action. |

## WS5: Code Fragility Fixes

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 11 | Fragility fix scope | Fix known issues + research loop finds all fragile patterns + add prevention guardrails (new sonash rules / pattern-compliance patterns). Fix AND prevent. | Consistent with D#4 and cross-cutting "guardrails AND fix" directive. |

## WS6: Truncation/Reformatting Protection

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 5 | Truncation protection approach | Full solution: file-size regression check + no-section-removal guard + JSONL→MD generation validation. All must block, not warn. | No half measures. Warnings must be actionable. |
| 14 | Implementation location | Both: post-write-validator (AI writes) + pre-commit (manual edits). Pre-commit is lightweight file-size delta. | Defense in depth. Two enforcement points cover AI and human edit paths. |
| 15 | File-size threshold | Tiered: 50% for <100 lines, 30% for 100-500 lines, 20% for >500 lines. | Flat percentage misses context. Larger files get tighter protection. |
| 16 | File scope | Auto-populated allowlist in `.truncation-guard.json` with per-file thresholds. Automated process maintains it. | Explicit, auditable, extensible. Auto-population prevents the guard from becoming an orphan. |
| 26 | Pre-existing truncation detection | Git history analysis: scan for files that shrank >30% in single commit → flag as potential past truncation → review and restore. Generated files validated against JSONL source. | Closes the WS6 research+fix gap. Generated files: regenerate from JSONL. Non-generated: git history is the reference. |

## WS7: Full Orphan Search

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 17 | Orphan detection tooling | Standalone validator scripts registered as pattern-compliance categories. SKILL_INDEX↔filesystem, npm scripts↔files, hooks↔files. Must also fix ALL existing orphans. | Filesystem checks need `fs.existsSync`. Pattern-compliance integration gives pre-commit + CI coverage. Fix AND prevent. |
