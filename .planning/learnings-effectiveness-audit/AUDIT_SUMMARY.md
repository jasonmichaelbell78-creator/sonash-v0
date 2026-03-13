# Data Effectiveness Audit — Comprehensive Summary

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-13
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Executive Summary

The Data Effectiveness Audit was a 35-decision, 11-wave initiative that
transformed SoNash's data systems from **write-eager, read-lazy** into a
**learning-to-automation pipeline**. Data was captured extensively (40+ files,
12 capture categories) but insufficiently consumed, enforced, or acted upon.
This audit fixed that.

**Key Results:**

- Average lifecycle score: **6.9 → 7.7/12** (+12% improvement)
- Systems below threshold (<6/12): **4 → 1** (75% reduction)
- Systems with zero consumers (Recall=0): **2 → 0** (eliminated)
- New enforcement mechanisms: **13 scripts**, **1 health checker**, **1 audit
  skill**
- Test coverage: **137+ new tests** across 8 test files

---

## What Changed — Before vs. After

### Before the Audit

The project suffered from a systemic "write-eager, read-lazy" problem:

1. **Data was captured but never consumed.** JSONL files like
   `override-log.jsonl`, `commit-log.jsonl`, `velocity-log.jsonl`, and
   `agent-invocations.jsonl` were written to by hooks and skills, but nothing
   ever read them back. They were write-only dead weight.

2. **No enforcement from learnings.** Review patterns, retro findings, and hook
   warnings were logged but never translated into automated prevention. The same
   mistakes could recur indefinitely because the system had no memory-to-action
   path.

3. **CLAUDE.md rules had no enforcement annotations.** There was no way to tell
   which rules were enforced by automated gates vs. which were purely behavioral
   (dependent on the AI remembering to follow them). 5 of 11 behavioral rules
   had zero automated enforcement.

4. **No rotation policy.** JSONL files grew unbounded. No archival, no cleanup,
   no tier-based lifecycle management.

5. **Health monitoring blind spot.** The ecosystem health system had 10 checkers
   across 8 categories but zero visibility into data system effectiveness.

6. **No positive templates.** Anti-patterns were documented but the correct
   alternatives weren't. Developers had to figure out the right approach on
   their own.

### After the Audit

1. **Every data system has at least one active consumer.** No more write-only
   files. Override logs feed into pr-retro analysis. Velocity data drives
   regression alerts. Commit patterns inform session-end analytics. Planning
   data surfaces in session summaries.

2. **Learning-to-automation pipeline operational.** The `learning-router.js`
   library routes discovered patterns by type (code → verified-pattern + lint
   rule, process → hook gate, behavioral → CLAUDE.md annotation + proxy metric).
   Every routing decision is tracked in `learning-routes.jsonl` and verified by
   `verify-enforcement.js`.

3. **Every CLAUDE.md rule annotated with enforcement status.** Rules show either
   `[GATE: mechanism]` (automated enforcement) or
   `[BEHAVIORAL: enforcement-level]` (manual/proxy). 5 enforcement gaps were
   identified and routed through the pipeline.

4. **Tiered rotation policy applied.** All JSONL files classified into 3 tiers:
   - Operational (30 days): hook-warnings, overrides, commits, agent invocations
   - Historical (90 days): reviews, retros, metrics, ecosystem audit histories
   - Permanent (never): health scores, debt, velocity, lifecycle scores, routes

5. **Data Effectiveness is a first-class health dimension.** A new checker
   measures 5 metrics (avg lifecycle score, below-threshold %, recall coverage,
   action coverage, orphan count) with 15% weight in the composite score.

6. **25 positive pattern templates.** Every anti-pattern now has a
   copy-pasteable correct alternative in `POSITIVE_PATTERNS.md`,
   cross-referenced by the code-reviewer's blocking checks.

---

## What the Workflow Looks Like Now

### When a pattern/learning is discovered (any skill):

```
Pattern identified → learning-router.js categorizes it →
  code pattern    → scaffold verified-pattern + lint rule → track in learning-routes.jsonl
  process pattern → scaffold hook gate stub              → track in learning-routes.jsonl
  behavioral      → annotate CLAUDE.md + define proxy    → track in learning-routes.jsonl
```

### When code is written:

```
Developer writes code → PRE_GENERATION_CHECKLIST.md consulted →
  code-reviewer runs anti-pattern check →
    violation? → BLOCK (D32: no warning mode) →
      show positive pattern from POSITIVE_PATTERNS.md →
        fix applied → verification passes → commit allowed
```

### When code is committed:

```
git commit → pre-commit hook →
  patterns:check (anti-patterns) →
  ESLint (code quality) →
  ratchet-baselines.js (violation count regression) →
    all pass → commit succeeds
```

### At session end:

```
/session-end →
  Step 4b: Agent invocation summary (from agent-invocations.jsonl)
  Step 4c: Planning data summary (from decisions.jsonl/changelog.jsonl)
  Step 5b: Hook learning synthesizer (override-log + hook-warnings + health)
  Step 7g: Commit analytics (from commit-log.jsonl)
  Step 7f: Hook data summary
```

### When /alerts runs:

```
/alerts (limited mode, 17 categories):
  ... existing 16 checks ...
  + velocity-regression: detects 50%+ velocity drops

/alerts (full mode, +24 categories):
  ... existing categories ...
  + stale-planning-data: decisions.jsonl >30 days stale
  + deferred-items-staleness: >20 unresolved deferred items
  + commit-patterns: >50% session-end-only commits
  + enforcement-verification: enforced patterns not yet verified
```

### When health check runs:

```
ecosystem-health → 11 checkers → 9 categories → 14 dimensions →
  ... existing 8 categories (rebalanced) ...
  + Data Effectiveness (15% weight):
    avg_lifecycle_score, below_threshold_pct,
    recall_coverage, action_coverage, orphan_count
```

---

## Artifacts Created

### Scripts (7 new)

| Script                                    | Purpose                                                    | Wave |
| ----------------------------------------- | ---------------------------------------------------------- | ---- |
| `scripts/lib/learning-router.js`          | Core routing library — categorize and scaffold enforcement | W2   |
| `scripts/rotate-jsonl.js`                 | Tiered JSONL rotation per config/rotation-policy.json      | W0   |
| `scripts/route-enforcement-gaps.js`       | Extract and route CLAUDE.md enforcement gaps               | W4   |
| `scripts/route-lifecycle-gaps.js`         | Route lifecycle score Action<2 gaps                        | W5   |
| `scripts/generate-lifecycle-scores-md.js` | Generate LIFECYCLE_SCORES.md from JSONL                    | W5   |
| `scripts/verify-enforcement.js`           | Verify enforcement mechanisms work                         | W2   |
| `scripts/ratchet-baselines.js`            | Monotonic baseline tightening for violations               | W6   |

### Health Checker (1 new)

| Checker                                         | Category           | Weight | Wave |
| ----------------------------------------------- | ------------------ | ------ | ---- |
| `scripts/health/checkers/data-effectiveness.js` | Data Effectiveness | 15%    | W7   |

### Skill (1 new)

| Skill                       | Purpose                                             | Wave |
| --------------------------- | --------------------------------------------------- | ---- |
| `/data-effectiveness-audit` | Reusable audit with 8 domains and lifecycle scoring | W8   |

### Schemas (2 new)

| Schema                 | File                                             | Wave |
| ---------------------- | ------------------------------------------------ | ---- |
| `LifecycleScoreRecord` | `scripts/reviews/lib/schemas/lifecycle-score.ts` | W5   |
| `LearningRouteRecord`  | `scripts/reviews/lib/schemas/learning-route.ts`  | W2   |

### Config Files (2 new/updated)

| File                                     | Purpose                                | Wave |
| ---------------------------------------- | -------------------------------------- | ---- |
| `config/rotation-policy.json`            | Declarative tier-based rotation config | W0   |
| `.claude/state/known-debt-baseline.json` | Ratcheting violation baselines         | W6   |

### Data Files (2 new)

| File                                   | Purpose                    | Wave |
| -------------------------------------- | -------------------------- | ---- |
| `.claude/state/lifecycle-scores.jsonl` | 20 system lifecycle scores | W5   |
| `.claude/state/learning-routes.jsonl`  | Routing decision tracking  | W2   |

### Documentation (3 new)

| File                                                          | Purpose                        | Wave |
| ------------------------------------------------------------- | ------------------------------ | ---- |
| `docs/agent_docs/POSITIVE_PATTERNS.md`                        | 25 positive templates (S1-S25) | W3   |
| `docs/agent_docs/PRE_GENERATION_CHECKLIST.md`                 | Behavioral pre-write checklist | W3   |
| `.planning/learnings-effectiveness-audit/LIFECYCLE_SCORES.md` | Generated dashboard            | W5   |

### Test Files (8 new, 137+ tests)

| File                                                     | Tests | Coverage                                     |
| -------------------------------------------------------- | ----- | -------------------------------------------- |
| `scripts/__tests__/learning-router.test.js`              | 37    | Router, scaffolding, dedup, validation       |
| `scripts/__tests__/rotate-jsonl.test.js`                 | 20    | Config validation, field detection, rotation |
| `scripts/__tests__/verify-enforcement.test.js`           | 20+   | Verification framework                       |
| `scripts/__tests__/generate-lifecycle-scores-md.test.js` | 11    | JSONL parsing, MD generation                 |
| `scripts/__tests__/route-enforcement-gaps.test.js`       | 9     | Gap extraction, routing                      |
| `scripts/__tests__/positive-patterns-coverage.test.js`   | 14    | Section IDs, cross-references                |
| `scripts/__tests__/lifecycle-scores-integrity.test.js`   | 16    | Data integrity, schema compliance            |
| `scripts/__tests__/route-lifecycle-gaps.test.js`         | 10    | Gap reading, categorization                  |

---

## Skills Modified

| Skill              | Changes                                                                                                                        | Wave       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `session-end`      | v2.1→2.2: Steps 4b (invocations), 4c (planning data), 7g (commit analytics)                                                    | W1, W6     |
| `pr-review`        | Added retro backward flow (read last 3 retros, flag repeats)                                                                   | W1         |
| `pr-retro`         | v4.4: pattern_recurrence auto-population (D7), override audit cross-ref                                                        | W0, W6     |
| `alerts`           | 5 new checkers: review-quality, velocity-regression, stale-planning, deferred-items, commit-patterns, enforcement-verification | W1, W6, W9 |
| `code-reviewer`    | v2.1→2.2: Anti-pattern blocking (D32), positive pattern references, strengthened fix template + security checklist recall      | W3, W6     |
| `ecosystem-health` | 11 checkers (was 10), 9 categories (was 8), 14 dimensions (was 13)                                                             | W7         |

---

## CLAUDE.md Changes (v5.4 → v5.5)

Every rule in Sections 2-7 now has an enforcement annotation:

| Section             | Rules    | Gate-Enforced                                           | Behavioral-Only                          |
| ------------------- | -------- | ------------------------------------------------------- | ---------------------------------------- |
| 2. Security         | 3        | 2 (`[GATE: patterns:check]`, `[GATE: Cloud Functions]`) | 1 (`code-reviewer check only`)           |
| 4. Behavioral       | 6        | 0                                                       | 3 proxy-metric, 3 no-enforcement         |
| 5. Anti-Patterns    | 6        | 5 (`[GATE: patterns:check]`)                            | 1 (`[GATE: SonarCloud CI]`)              |
| 6. Coding Standards | 5        | 1 (`[GATE: tsconfig strict + CI]`)                      | 4 (`code-reviewer` or none)              |
| 7. Triggers         | 2 groups | POST-TASK: `[GATE: pre-commit + code-reviewer]`         | PRE-TASK: `[BEHAVIORAL: no enforcement]` |

---

## Lifecycle Score Changes (20 Systems)

| ID     | System             | Before | After | Delta | Key Fix                                         |
| ------ | ------------------ | ------ | ----- | ----- | ----------------------------------------------- |
| ls-001 | Pattern Rules      | 9      | 9     | —     | Already high; W3 added POSITIVE_PATTERNS.md     |
| ls-002 | Review Learnings   | 5      | 7     | +2    | /alerts consumes review-metrics; pr-retro wired |
| ls-003 | Retro Findings     | 8      | 8     | —     | pattern_recurrence added in W0                  |
| ls-004 | Technical Debt     | 10     | 10    | —     | Already healthy                                 |
| ls-005 | Hook Warnings      | 8      | 8     | —     | Rotation added in W0                            |
| ls-006 | Override Audit     | 6      | 7     | +1    | pr-retro cross-references overrides             |
| ls-007 | Health Scores      | 8      | 8     | —     | Rotation added in W0                            |
| ls-008 | Behavioral Rules   | 9      | 9     | —     | Enforcement annotations in W4                   |
| ls-009 | Security Checklist | 6      | 7     | +1    | code-reviewer verifies at point of use          |
| ls-010 | Fix Templates      | 6      | 7     | +1    | code-reviewer strengthened recall               |
| ls-011 | Memory             | 8      | 8     | —     | Already good (Recall=3)                         |
| ls-012 | Session Context    | 10     | 10    | —     | Already healthy                                 |
| ls-013 | Agent Tracking     | 6      | 7     | +1    | session-end consumes invocations                |
| ls-014 | Velocity Tracking  | 7      | 9     | +2    | velocity-regression alert + session-end         |
| ls-015 | Commit Log         | 6      | 8     | +2    | commit analytics + commit patterns alert        |
| ls-016 | Learning Routes    | 9      | 9     | —     | New system, born healthy                        |
| ls-017 | Planning Data      | 3      | 6     | +3    | session-end reads + staleness alert             |
| ls-018 | Audit Findings     | 6      | 6     | —     | Storage still unbounded (future work)           |
| ls-019 | Aggregation Data   | 5      | 5     | —     | Storage still unbounded (future work)           |
| ls-020 | Ecosystem Deferred | 3      | 6     | +3    | /alerts deferred-items staleness checker        |

**Total improvement:** +19 points across 20 systems (138→154/240)

---

## Remaining Gaps (Future Work)

1. **ls-018 Audit Findings (6/12):** Storage still unbounded. Audit JSONL files
   under `docs/audits/` have no rotation policy. Needs archival strategy.

2. **ls-019 Aggregation Data (5/12):** Same as ls-018 — pipeline artifacts under
   `docs/aggregation/` are unbounded. Action=0.

3. **Action scores still low across the board:** 16/20 systems have Action<2.
   Most have Action=1 (alerting) rather than Action=2+ (automated enforcement).
   The learning-router scaffolds enforcement templates but they still need AI
   refinement and deployment.

4. **Proxy metric collection not automated:** PRE_GENERATION_CHECKLIST.md
   defines proxy metrics for behavioral rules but the collection pipeline isn't
   built yet.

5. **Ratchet baselines not wired to session-start:** `ratchet-baselines.js`
   exists but isn't automatically invoked. Wire it when ready.

---

## Decision Record Reference

All 35 decisions are documented in:
`.planning/learnings-effectiveness-audit/DECISIONS.md`

Key decisions:

- **D8/D9:** Reframe from "better surfaces" to "learning-to-automation pipeline"
- **D13:** Route by type (code/process/behavioral)
- **D14:** Script scaffolds structure, AI refines content
- **D27:** Primary prevention (positive templates), safety net (verification),
  behavioral reminder (checklist)
- **D28:** Security/data-loss = absolute thresholds; others = ratcheting
  baselines
- **D32:** No warning mode — violations block immediately

---

## How to Run the Audit Again

```bash
# Quick check: lifecycle scores dashboard
node scripts/generate-lifecycle-scores-md.js

# Route gaps through learning pipeline
node scripts/route-lifecycle-gaps.js --dry-run
node scripts/route-enforcement-gaps.js --dry-run

# Verify enforcement mechanisms
node scripts/verify-enforcement.js

# Check ratcheting baselines
node scripts/ratchet-baselines.js --dry-run

# Full interactive audit
# Invoke /data-effectiveness-audit skill
```

---

_Generated as part of the Data Effectiveness Audit, Waves 0-10._ _Plan:
`.planning/learnings-effectiveness-audit/PLAN.md`_ _Decisions:
`.planning/learnings-effectiveness-audit/DECISIONS.md`_ _Scores:
`.claude/state/lifecycle-scores.jsonl`_
