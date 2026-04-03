# Repo Cleanup: Comprehensive Research Report

<!-- prettier-ignore-start -->
**Document Version:** 2.0 (post-challenge)
**Last Updated:** 2026-03-23
**Status:** ACTIVE
**Depth:** L1 (Exhaustive)
<!-- prettier-ignore-end -->

---

## Executive Summary

A comprehensive audit of the SoNash repository was conducted across 12
sub-questions using 13 agents in 5 waves. The audit inventoried 187 files across
scripts, hooks, configs, and state directories; 67 skills and 37 agents; 582
active documentation entries; and all planning/research artifacts. The
repository is in strong overall health -- zero broken wiring connections, zero
ghost references, and excellent CI/hook coverage. The primary concerns are
maintenance debt, not structural rot.

The most actionable findings fall into three categories: (1) **state file
hygiene** -- three high-volume JSONL files lack rotation policies and will grow
unbounded, with `commit-log.jsonl` already at 212KB; (2) **skill/agent
structural compliance** -- seven oversized skills violate the 300-line
SKILL_STANDARDS.md threshold, 13 agents lack explicit `maxTurns`, and index
files overcount skills (67 claimed vs 65 actual); (3) **documentation
staleness** -- seven docs have version mismatches or missing hook coverage, with
ARCHITECTURE.md and docs/TRIGGERS.md being the most impactful.

True orphaned files total **~10** after challenge verification: 2 from initial
research (data/local-resources.ts, scripts/test-semgrep-rules.js), 1 overturned
by contrarian (.claude/hooks/state-utils.js IS orphaned — the "architectural
split" justification was wrong), 1 missed by all agents (.mcp.json.bak), and 5-7
orphan test files found by OTB (tests for removed hooks/scripts). Additionally,
3 unused devDependencies (msw, @firebase/rules-unit-testing, @playwright/test)
were found — two explicitly suppressed in knip.json but never cleaned up. A
meta-issue was identified: `.research/**/challenges/` is gitignored, meaning
challenge outputs are silently lost from version control.

**Post-challenge grade: B** (downgraded from B+). The challenges revealed blind
spots in test file hygiene, dependency hygiene, and overcounting in Wave 1 agent
reports.

---

## Repo Health Scorecard

| Category            | Grade  | Key Metric                  | Notes                                                                 |
| ------------------- | :----: | --------------------------- | --------------------------------------------------------------------- |
| Orphaned Files      | **B+** | ~10 total                   | 3 scripts/files + 5-7 test orphans + 1 .mcp.json.bak (post-challenge) |
| Ghost References    | **A**  | 0 file ghosts               | Index overcounts are soft ghosts (downgraded from A+)                 |
| Doc Staleness       | **B-** | 7 stale docs                | ARCHITECTURE.md, TRIGGERS.md most impactful                           |
| Archive Hygiene     | **A-** | 4 ready to archive          | All planning dirs properly categorized                                |
| Skill/Agent Health  | **B**  | 7 oversized, 13 no maxTurns | Structural compliance gaps; index overcounts                          |
| State File Health   | **B-** | 3 unrotated, 2 dead files   | Severity recalibrated HIGH not CRITICAL (post-challenge)              |
| Script Wiring       | **A+** | 0 broken / 450+ verified    | NPM, hooks, CI all healthy                                            |
| Planning Health     | **A-** | 8 active, 10 archived       | 1 superseded dir to archive                                           |
| Cross-Ref Integrity | **A-** | 3 minor mismatches          | SKILL_INDEX stale, 1 missing memory file                              |
| Dependency Hygiene  | **B-** | 3 unused devDeps            | msw, @firebase/rules-unit-testing, @playwright/test (OTB)             |
| Test File Hygiene   | **B**  | 5-7 orphan tests            | Tests for removed hooks/scripts (OTB)                                 |

**Overall Grade: B** (post-challenge, downgraded from B+) -- Structurally sound,
maintenance debt in state files, skill compliance, and newly discovered
test/dependency hygiene gaps.

---

## Process Map

### Layer 1: Entry Points

```
CLAUDE.md (v5.6)
  --> S2: Security Rules (Cloud Functions, App Check, Rate Limiting)
  --> S3: Architecture (lib/firestore-service.ts, types/)
  --> S4: Behavioral Guardrails (14 rules)
  --> S5: Anti-Patterns (6 enforced patterns)
  --> S7: Agent/Skill Triggers --> Layer 2
  --> S8: Reference Docs --> Layer 5

settings.json
  --> hooks/ (15 registered) --> Layer 3
  --> statusLine --> global/statusline.js

package.json
  --> 120+ npm scripts --> Layer 3
  --> scripts/config/*.json (12 config files)
  --> husky + lint-staged --> pre-commit pipeline

.github/workflows/ (18 workflows)
  --> npm scripts (lint, build, test:coverage)
  --> scripts/assign-review-tier.js (CI-only)
```

### Layer 2: Skills and Agents

```
.claude/skills/ (65 actual directories)
  --> 65/65 have SKILL.md with YAML frontmatter
  --> ~40 have REFERENCE.md companions
  --> 18+ have scripts/ directories --> Layer 3
  --> SKILL_INDEX.md (claims 67, actual 65)
  --> COMMAND_REFERENCE.md (lists 61, missing 4)

.claude/agents/ (25 custom .md files)
  --> 2/25 have explicit maxTurns (code-reviewer, security-auditor)
  --> 4 built-in agents (Explore, Plan, Bash, general-purpose)
  --> All wired to CLAUDE.md S7 or COMMAND_REFERENCE.md
```

### Layer 3: Scripts and Hooks

```
scripts/ (150 files)
  --> scripts/lib/ (12 shared helpers)
  --> scripts/config/ (12 config JSON files)
  --> scripts/debt/ (30 TDMS pipeline scripts)
  --> scripts/health/ (38 health check files)
  --> scripts/archive/ (4 superseded scripts)

.claude/hooks/ (15 registered + 6 lib files)
  --> lib/state-utils.js (low-level primitives)
  --> state-utils.js (high-level task API) [architectural split]
  --> lib/rotate-state.js, git-utils.js, sanitize-input.js
  --> lib/symlink-guard.js, inline-patterns.js
  --> backup/ (7 historical copies, gitignored)
```

### Layer 4: State and Data

```
.claude/state/ (52 files)
  --> Active: 28 (session, reviews, health, hooks, alerts)
  --> Stale: 24 (completed plans, old PR states, backups)
  --> Critical: hook-runs.jsonl, commit-log.jsonl (no rotation)

data/ (12 files)
  --> 4 TS exports (glossary, resources, quotes, slogans)
  --> data/ecosystem-v2/ (6 active JSONL + 2 archived)

docs/technical-debt/
  --> raw/ (pipeline: intake --> normalize --> dedup --> reconcile)
  --> MASTER_DEBT.jsonl + .bak (4.3M backup orphan)
```

### Layer 5: Documentation

```
Root docs (14 files)
  --> CLAUDE.md, SESSION_CONTEXT.md, ROADMAP.md: CURRENT
  --> ARCHITECTURE.md, TRIGGERS.md, SECURITY.md: STALE

docs/agent_docs/ (10 files, all referenced in CLAUDE.md)
.claude/ docs (7 files: COMMAND_REFERENCE, HOOKS, STATE_SCHEMA, etc.)
DOCUMENTATION_INDEX.md (582 active, 104 archived, auto-generated)
docs/archive/ (~100+ files)
```

### Layer 6: Planning

```
.planning/ (8 active + 10 archived)
  --> Infrastructure: PROJECT.md, MILESTONES.md, STATE.md
  --> Active plans: agent-env, cli-tools, custom-statusline, PSR, propagation, SWS
  --> statusline-research: superseded, archive candidate

.research/ (3 directories)
  --> cli-tools: COMPLETE, consumed by .planning/cli-tools-implementation
  --> custom-statusline: COMPLETE, consumed by .planning/custom-statusline
  --> repo-cleanup: IN PROGRESS (this research)
```

---

## Findings by Category

### 1. Orphaned Files

**Source:** SQ-002, SQ-GAP1

Wave 1 flagged 7 suspected orphans. Deep verification reduced this to **2
confirmed + 1 likely**:

| File                            | Status               | Evidence                                                    | Action             |
| ------------------------------- | -------------------- | ----------------------------------------------------------- | ------------------ |
| `data/local-resources.ts`       | **CONFIRMED ORPHAN** | No imports in app code; feature never implemented           | Delete or archive  |
| `scripts/test-semgrep-rules.js` | **CONFIRMED ORPHAN** | No package.json entry, no test file, no hook refs           | Delete or register |
| `scripts/refine-scaffolds.js`   | **LIKELY ORPHAN**    | Has test file but not in package.json, unused in automation | Verify with user   |

**Cleared suspects:** repair-archives.js (has test), rotate-jsonl.js (has test +
lib ref), assign-review-tier.js (CI workflow), generate-detailed-sonar-report.js
(has test). Principle: test existence confirms intent; CI-only invocation is
valid.

### 2. Ghost References

**Source:** SQ-003

**Zero ghost references found** across 200+ path references in CLAUDE.md,
skills, agents, planning, CI workflows, npm scripts, and cross-linked
documentation. The automatic indexing (`npm run docs:index`) and cross-doc
checking (`npm run crossdoc:check`) maintain excellent reference hygiene.

### 3. Documentation Staleness

**Source:** SQ-005

7 stale documents identified:

| File                                     | Age | Issue                                                               | Severity    |
| ---------------------------------------- | --- | ------------------------------------------------------------------- | ----------- |
| `ARCHITECTURE.md`                        | 80d | Lists Next.js 16.1 (actual 16.2.0), React 19.2.3 (actual 19.2.4)    | MEDIUM      |
| `docs/TRIGGERS.md`                       | 55d | Missing PreToolUse hooks; trigger count understated                 | MEDIUM-HIGH |
| `docs/SECURITY.md`                       | 77d | Not referencing CLAUDE.md v5.6 guardrails; outdated rotation policy | MEDIUM      |
| `.claude/HOOKS.md`                       | 29d | Missing gsd-check-update.js; SessionStart count wrong (3 vs 4)      | MEDIUM      |
| `docs/agent_docs/AGENT_ORCHESTRATION.md` | 42d | References "claude.md v4.2" (now v5.6); missing guardrails 7-14     | LOW         |
| `DEVELOPMENT.md`                         | 40d | Predates sessions #232-234                                          | LOW         |
| `AI_WORKFLOW.md`                         | 29d | Could clarify security doc hierarchy                                | LOW         |

### 4. Archive Candidates

**Source:** SQ-006, SQ-010

**4 definite + 3 probable archive candidates:**

| File/Directory                                        | Reason                                                                    | Action                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| `.claude/state/deep-plan-review-lifecycle.state.json` | 9/9 steps COMPLETE                                                        | Delete or archive                         |
| `data/ecosystem-v2/retros.jsonl.archived-20260318`    | Already marked .archived                                                  | Move to data/archive/                     |
| `data/ecosystem-v2/reviews.jsonl.archived-20260318`   | Already marked .archived                                                  | Move to data/archive/                     |
| `.claude/override-log-1772919008171.jsonl`            | Old session log, superseded                                               | Delete                                    |
| `.planning/statusline-research/`                      | Superseded by .research/custom-statusline/ + .planning/custom-statusline/ | Archive after confirmation                |
| Ecosystem audit history state files (6)               | Superseded by newer runs                                                  | Archive after next cycle                  |
| `scripts/archive/` (4 files)                          | run-consolidation.v1, sync-reviews-to-jsonl v1/v2, archive-reviews        | Already in archive dir; consider deletion |

### 5. Skill & Agent Health

**Source:** SQ-004, SQ-GAP1

**Actual counts (resolved):** 65 skills, 25 custom agents + 4 built-in.

#### Oversized Skills (>300 lines, no REFERENCE.md)

| Skill                 | Lines | Violation                         |
| --------------------- | ----- | --------------------------------- |
| audit-enhancements    | 505   | SKILL_STANDARDS.md >300 line rule |
| audit-ai-optimization | ~499  | Same                              |
| audit-comprehensive   | 493   | Same                              |
| pr-review             | 479   | Same                              |
| doc-optimizer         | 471   | Same                              |
| pr-ecosystem-audit    | 470   | Same                              |
| session-end           | 451   | Same                              |

#### Missing maxTurns (13 agents)

frontend-developer, debugger, database-architect, deployment-engineer,
documentation-expert, react-performance-optimization, test-engineer,
ui-ux-designer, mcp-expert, nextjs-architecture-expert, fullstack-developer,
deep-research-searcher, deep-research-synthesizer

#### Skills Missing Version History (3)

quick-fix, artifacts-builder, task-next

#### Index Discrepancies

| Index                 | Claims | Actual                 | Delta                |
| --------------------- | ------ | ---------------------- | -------------------- |
| SKILL_INDEX.md        | 67     | 65                     | -2                   |
| COMMAND_REFERENCE.md  | 61     | 65                     | -4 missing           |
| Agent count (SQ-001b) | 37     | 25 custom + 4 built-in | Clarification needed |

Missing from COMMAND_REFERENCE.md: `/data-effectiveness-audit`, `/debt-runner`,
`/convergence-loop`, +1 TBD.

### 6. State & Data File Health

**Source:** SQ-008

**Critical: 3 files missing rotation policy:**

| File                                             | Size | Writer                    | Issue                                  |
| ------------------------------------------------ | ---- | ------------------------- | -------------------------------------- |
| `.claude/state/hook-runs.jsonl`                  | 44K  | pre-commit/pre-push hooks | Not in rotation-policy.json            |
| `.claude/state/commit-log.jsonl`                 | 212K | commit-tracker.js         | Listed but rotation may not be working |
| `docs/technical-debt/raw/scattered-intake.jsonl` | 320K | intake scripts            | Not in rotation-policy.json            |

**Dead/orphan state files:**

| File                                        | Size | Issue                           |
| ------------------------------------------- | ---- | ------------------------------- |
| `docs/technical-debt/raw/reviews.jsonl`     | 1K   | Empty, no reader/writer         |
| `docs/technical-debt/MASTER_DEBT.jsonl.bak` | 4.3M | Manual backup, nothing reads it |

**Weakly-maintained files (writer exists, no/minimal readers):**
pending-refinements.jsonl, velocity-log.jsonl, alert-suppressions.json,
deferred-items.jsonl, warnings.jsonl

**Bloated files (>100KB):** 8 files totaling ~14MB, dominated by tech debt
pipeline intermediates.

### 7. Script & Hook Wiring

**Source:** SQ-009

**Excellent health. 450+ connections verified. 0 broken.**

- 120 npm scripts: all valid
- 15 registered hooks: all valid with complete import chains
- 18 GitHub workflows: all script references valid
- Pre-commit/pre-push pipeline: Husky + lint-staged properly configured

Only housekeeping items: 7 gitignored backup hooks in `.claude/hooks/backup/`
and the `state-utils.js` architectural split (resolved in SQ-GAP1 as
intentional, not orphaned).

### 8. Cross-Reference Integrity

**Source:** SQ-007

3 minor issues in otherwise healthy index system:

1. **SKILL_INDEX.md stale** -- claims 67 skills, actual 65. Last regenerated
   2026-03-13.
2. **Missing memory file** -- `feedback_learnings_must_complete.md` referenced
   in MEMORY.md but does not exist.
3. **COMMAND_REFERENCE.md undercount** -- lists 61 skills, actual 65 (4 missing
   entries).

All other indexes healthy: DOCUMENTATION_INDEX.md (582 entries, auto-generated),
CLAUDE.md S7/S8 references, SESSION_CONTEXT.md links.

### 9. Planning Directory Health

**Source:** SQ-010

**Grade: A-**. 8 active planning directories, 10 properly archived.
Infrastructure files (PROJECT.md, MILESTONES.md, STATE.md) all current.

Two decision points:

1. `.planning/statusline-research/` -- superseded by newer research + planning
   pair; recommend archive.
2. `.planning/system-wide-standardization/` -- still DRAFT (19 days), awaiting
   user approval to execute.

3 plans ready to execute (agent-env, cli-tools, custom-statusline), 3 in
planning phase.

---

## Consolidated Action Items

### CRITICAL (blocks work or causes data issues)

| #   | Action                                                                           | Files                                                                  | Effort | Source |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ | ------ |
| 1   | Add hook-runs.jsonl to rotation-policy.json (operational tier, 30-day retention) | `.claude/state/hook-runs.jsonl`, rotation-policy.json                  | S      | SQ-008 |
| 2   | Verify commit-log.jsonl rotation is actually executing (212KB and growing)       | `.claude/state/commit-log.jsonl`, `.claude/hooks/lib/rotate-state.js`  | S      | SQ-008 |
| 3   | Add scattered-intake.jsonl to rotation-policy.json                               | `docs/technical-debt/raw/scattered-intake.jsonl`, rotation-policy.json | S      | SQ-008 |

### HIGH (actively misleading or growing unbounded)

| #   | Action                                                                                                         | Files                                                                                                                     | Effort | Source                  |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------- |
| 4   | Regenerate SKILL_INDEX.md (65 actual, not 67)                                                                  | `.claude/skills/SKILL_INDEX.md`                                                                                           | S      | SQ-004, SQ-007, SQ-GAP1 |
| 5   | Add 4 missing skills to COMMAND_REFERENCE.md (data-effectiveness-audit, debt-runner, convergence-loop, +1 TBD) | `.claude/COMMAND_REFERENCE.md`                                                                                            | S      | SQ-007, SQ-GAP1         |
| 6   | Delete empty orphan: docs/technical-debt/raw/reviews.jsonl                                                     | `docs/technical-debt/raw/reviews.jsonl`                                                                                   | S      | SQ-008                  |
| 7   | Delete or archive MASTER_DEBT.jsonl.bak (4.3M dead backup)                                                     | `docs/technical-debt/MASTER_DEBT.jsonl.bak`                                                                               | S      | SQ-008                  |
| 8   | Update ARCHITECTURE.md version table (Next.js 16.1->16.2.0, React 19.2.3->19.2.4)                              | `ARCHITECTURE.md`                                                                                                         | S      | SQ-005                  |
| 9   | Update docs/TRIGGERS.md with PreToolUse hooks and correct trigger count                                        | `docs/TRIGGERS.md`                                                                                                        | M      | SQ-005                  |
| 10  | Create missing memory file or remove MEMORY.md reference: feedback_learnings_must_complete.md                  | MEMORY.md or memory directory                                                                                             | S      | SQ-007                  |
| 11  | Extract 7 oversized skills to REFERENCE.md companions (>300 lines each)                                        | audit-enhancements, audit-ai-optimization, audit-comprehensive, pr-review, doc-optimizer, pr-ecosystem-audit, session-end | L      | SQ-004                  |

### MEDIUM (maintenance debt)

| #   | Action                                                                                                            | Files                                                                                                   | Effort | Source          |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ | --------------- |
| 12  | Add maxTurns: 25 to 13 agents missing it                                                                          | 13 agent .md files in `.claude/agents/`                                                                 | S      | SQ-004          |
| 13  | Add version history to 3 skills (quick-fix, artifacts-builder, task-next)                                         | 3 SKILL.md files                                                                                        | S      | SQ-004          |
| 14  | Delete confirmed orphan: data/local-resources.ts                                                                  | `data/local-resources.ts`                                                                               | S      | SQ-002          |
| 15  | Delete confirmed orphan: scripts/test-semgrep-rules.js                                                            | `scripts/test-semgrep-rules.js`                                                                         | S      | SQ-002          |
| 16  | Archive completed state file: deep-plan-review-lifecycle.state.json                                               | `.claude/state/deep-plan-review-lifecycle.state.json`                                                   | S      | SQ-006          |
| 17  | Move 2 already-archived JSONL files to data/archive/                                                              | `data/ecosystem-v2/retros.jsonl.archived-20260318`, `data/ecosystem-v2/reviews.jsonl.archived-20260318` | S      | SQ-006          |
| 18  | Delete old session log: .claude/override-log-1772919008171.jsonl                                                  | `.claude/override-log-1772919008171.jsonl`                                                              | S      | SQ-006          |
| 19  | Update docs/SECURITY.md to reference CLAUDE.md v5.6 guardrails                                                    | `docs/SECURITY.md`                                                                                      | M      | SQ-005          |
| 20  | Update .claude/HOOKS.md with gsd-check-update.js and correct SessionStart count                                   | `.claude/HOOKS.md`                                                                                      | S      | SQ-005          |
| 21  | Archive .planning/statusline-research/ (superseded by newer pair)                                                 | `.planning/statusline-research/`                                                                        | S      | SQ-010          |
| 22  | Document state-utils.js architectural split (root vs lib/)                                                        | `.claude/hooks/state-utils.js`, `.claude/hooks/lib/state-utils.js`                                      | S      | SQ-GAP1         |
| 23  | Verify scripts/refine-scaffolds.js -- delete if unneeded                                                          | `scripts/refine-scaffolds.js`                                                                           | S      | SQ-002          |
| 24  | Consolidate health logging: choose canonical system between ecosystem-health-log.jsonl and health-score-log.jsonl | `data/ecosystem-v2/ecosystem-health-log.jsonl`, `.claude/state/health-score-log.jsonl`                  | M      | SQ-008          |
| 25  | Add cleanup step to debt pipeline for intermediate files                                                          | `scripts/debt/` pipeline                                                                                | M      | SQ-008          |
| 26  | Clarify built-in vs custom agents in COMMAND_REFERENCE.md                                                         | `.claude/COMMAND_REFERENCE.md`                                                                          | S      | SQ-007          |
| 27  | Resolve agent count documentation (25 custom + 4 built-in = 29, not 37)                                           | COMMAND_REFERENCE.md, SKILL_INDEX.md                                                                    | S      | SQ-004, SQ-GAP1 |

### LOW (cosmetic or nice-to-have)

| #   | Action                                                                     | Files                                    | Effort | Source  |
| --- | -------------------------------------------------------------------------- | ---------------------------------------- | ------ | ------- |
| 28  | Update AGENT_ORCHESTRATION.md version reference (v4.2 -> v5.6)             | `docs/agent_docs/AGENT_ORCHESTRATION.md` | S      | SQ-005  |
| 29  | Refresh DEVELOPMENT.md for sessions #232-234                               | `DEVELOPMENT.md`                         | S      | SQ-005  |
| 30  | Clarify AI_WORKFLOW.md security doc hierarchy                              | `AI_WORKFLOW.md`                         | S      | SQ-005  |
| 31  | Add SKILL.md -> REFERENCE.md "See also" cross-links                        | ~40 skill SKILL.md files                 | M      | SQ-001b |
| 32  | Consider ARCHIVE_INDEX.md for docs/archive/ (~100+ files)                  | `docs/archive/`                          | M      | SQ-001b |
| 33  | Document skill enforcement tiers (enforced triggers vs discoverable)       | CLAUDE.md or COMMAND_REFERENCE.md        | S      | SQ-001b |
| 34  | Document retention purpose for deferred-items.jsonl and warnings.jsonl     | `data/ecosystem-v2/`                     | S      | SQ-008  |
| 35  | Add pre-commit check enforcing 300-line skill limit + REFERENCE.md pairing | Pre-commit hook pipeline                 | M      | SQ-004  |
| 36  | Add agent maxTurns validation to pre-commit                                | Pre-commit hook pipeline                 | S      | SQ-004  |
| 37  | Verify DOCUMENTATION_INDEX.md generation runs in pre-commit or CI          | CI/pre-commit config                     | S      | SQ-001b |
| 38  | Delete or document .claude/hooks/backup/ files (7 gitignored backups)      | `.claude/hooks/backup/`                  | S      | SQ-009  |

---

## Contradictions Resolved

**Source:** SQ-GAP1

| #   | Contradiction                                                          | Winner                                 | Resolution                                                             | Action              |
| --- | ---------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- | ------------------- |
| 1   | state-utils.js: SQ-009 says orphan duplicate, SQ-002 says no duplicate | Both exist (SQ-009), but NOT redundant | Different concerns: root = high-level API, lib/ = low-level primitives | Document the split  |
| 2   | Orphan count: SQ-001a says 7, SQ-002 says 2                            | SQ-002                                 | 4 scripts have test files or CI usage. Test existence confirms intent. | True orphans: 2     |
| 3   | Skill count: 67 (SQ-001b) vs 64 (SQ-004) vs 65 (SQ-GAP1)               | SQ-GAP1: **65 actual**                 | SKILL_INDEX overcounts, COMMAND_REFERENCE undercounts by 4             | Update both indexes |
| 4   | assign-review-tier.js: SQ-001a says orphan, SQ-002 says active         | SQ-002                                 | Active in CI workflow auto-label-review-tier.yml                       | No action needed    |

---

## Confidence Assessment

| Category            | Confidence | Basis                                                     |
| ------------------- | :--------: | --------------------------------------------------------- |
| Orphaned Files      |  **HIGH**  | Deep verification with test files, CI, imports            |
| Ghost References    |  **HIGH**  | 200+ references checked, 0 failures                       |
| Doc Staleness       |  **HIGH**  | Version numbers + dates compared against filesystem       |
| Archive Candidates  |  **HIGH**  | State files inspected, planning dirs cross-referenced     |
| Skill/Agent Health  | **MEDIUM** | Counts verified by 3 agents, minor TBD on 1 missing skill |
| State File Health   |  **HIGH**  | File sizes, readers/writers verified                      |
| Script Wiring       |  **HIGH**  | 450+ connections verified                                 |
| Planning Health     |  **HIGH**  | All directories inspected, cross-refs checked             |
| Cross-Ref Integrity |  **HIGH**  | All major indexes checked against filesystem              |

---

## Methodology

### Research Design

- **Sub-questions:** 10 primary (SQ-001 through SQ-010) + 1 gap analysis
  (SQ-GAP1), split into SQ-001a/SQ-001b for inventory scope
- **Total findings files:** 12
- **Agents used:** 13 (SQ-001a, SQ-001b, SQ-002 through SQ-010, SQ-GAP1)
- **Waves:** 5
  - Wave 1: Inventory (SQ-001a, SQ-001b) -- baseline file counts and categories
  - Wave 2: Detection (SQ-002 orphans, SQ-003 ghosts, SQ-004 skill health) --
    anomaly finding
  - Wave 3: Health assessment (SQ-005 docs, SQ-006 archives, SQ-007 cross-refs)
    -- quality grading
  - Wave 4: Deep inspection (SQ-008 state, SQ-009 wiring, SQ-010 planning) --
    structural verification
  - Wave 5: Gap analysis (SQ-GAP1) -- contradiction resolution across all prior
    findings

### Verification Approach

Each finding was cross-checked against filesystem state using `ls`, `cat`,
`grep`, and direct file reads. Wave 1 inventory counts were treated as
hypotheses, not facts, with subsequent waves verifying or correcting. The
SQ-GAP1 agent specifically targeted 4 contradictions between earlier agents and
resolved all with evidence.

---

## Post-Challenge Amendments (Phase 3)

Two challenge agents (contrarian + OTB) stress-tested the findings. Results:

### Contrarian: 1 Overturned, 9 Weakened

**OVERTURNED:** `.claude/hooks/state-utils.js` (root) IS orphaned. SQ-GAP1's
"architectural split" justification was wrong — zero importers across entire
codebase. Only `lib/state-utils.js` is imported. A prior audit (AO-17,
2026-02-22) already reached this conclusion. Orphan count corrected: 2 → 3.

**WEAKENED (key items):**

- Ghost References A+ → A: Index overcounts (SKILL_INDEX.md) are soft ghost
  references
- CRITICAL severity for rotation gaps → HIGH: 44KB file ≠ "blocks work"
- SQ-001b internal contradictions: Claimed "67/67 have version history" and "all
  37 agents have maxTurns" — both disproven by SQ-004 but never retracted in
  findings
- Process map missing: MCP config, gitignore architecture, functions/ directory
- B+ overall grade → B: At upper boundary, "structurally excellent" overstated

### OTB: 5 New Findings, 2 New Categories

**SIGNIFICANT:**

1. **5-7 orphan test files** — tests/hooks/stop-serena-dashboard.test.ts (hook
   removed), tests/hooks/gsd-context-monitor.test.ts (hook gitignored),
   tests/scripts/check-pending-refinements.test.ts (script never existed),
   tests/scripts/validate-audit-s0s1.test.ts (misnamed)
2. **3 unused devDependencies** — msw, @firebase/rules-unit-testing,
   @playwright/test (2 suppressed in knip.json but never removed)
3. **challenges/ gitignored** — .research/\*\*/challenges/ is gitignored, so
   challenge outputs are silently lost from version control (meta-issue for
   research pipeline)

**MINOR:** 4. Husky v10 migration risk — .husky/\_/husky.sh deprecation
warning 5. Dormant workflow — validate-plan.yml triggers only on archived file
modification

### Impact Assessment

- Claims changed: ~16 of 45 (~35%, exceeds 20% re-synthesis threshold)
- Grades adjusted: 3 categories changed, 2 new categories added
- Overall grade: B+ → B
- New action items: ~8 added from challenges
