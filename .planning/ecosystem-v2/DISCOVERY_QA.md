<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-28
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Ecosystem v2 — Discovery Q&A Record

**Date:** 2026-02-28 (Session #197) **Context:** Deep-plan discovery for full PR
Review Ecosystem v2 rebuild based on diagnosis in
`docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md`

---

## Batch 1 — Strategic Direction

### Q1: JSONL Data Layer Strategy

**Question:** What's the end-state vision for the JSONL data layer?

**Answer:** Full redesign (recommended by Claude).

**Decision:** Split into multiple JSONL files (`reviews.jsonl`, `retros.jsonl`,
`deferred-items.jsonl`), normalize source IDs, add schema version field, design
for queryability. Keep JSONL format (no database).

### Q2: Backfill Scope

**Question:** How to handle the 89% of review history (#1-363) with no JSONL
data?

**Answer:** Backfill everything.

**Decision:** Parse all 13 archives + active log to build complete JSONL history
from review #1. Accept that early archives have inconsistent formats and some
are summary-only.

### Q3: Test Coverage Ambition

**Question:** What level of test coverage for pipeline scripts?

**Answer:** Contract + E2E smoke.

**Decision:** Contract tests for all 10 data handoff points between scripts PLUS
a full pipeline smoke test (markdown → JSONL → consolidation → patterns →
enforcement). The gold standard.

### Q4: True Scope

**Question:** What's the real scope beyond the diagnosis?

**Answer:** Full ecosystem v2.

**Decision:** Treat this as a v2 rebuild of the entire PR review ecosystem.
Redesign data flow, eliminate dead ends, build for measurability from the ground
up. The diagnosis becomes input, not the plan.

---

## Batch 2 — Architecture & Structural Reform

### Q5: Script Consolidation Strategy

**Question:** How aggressively should we consolidate the 35 components?

**Answer:** Rationalize full pipeline.

**Decision:** Redesign the pipeline from capture→storage→analysis→promotion→
enforcement as a clean pipeline with clear single-responsibility scripts. May
mean rewriting several scripts.

### Q6: Skill Sprawl (27 review-related skills)

**Question:** How to handle 6 core + 21 audit variant skills?

**Answer:** Keep all, fix broken ones.

**Decision:** The skills exist and work individually. Focus on fixing the broken
data they consume rather than reducing skill count. Skill rationalization is out
of scope for this initiative.

### Q7: Cross-Doc Deps Gate (48.9% override rate)

**Question:** Fix or remove the cross-doc-deps gate?

**Answer:** Recalibrate rules.

**Decision:** Review all rules in `doc-dependencies.json`, tighten triggers (add
`diffPattern` filters, `gitFilter`), remove false-positive-prone rules. Target
<15% override rate.

### Q8: Deferred Item Tracking

**Question:** How should the new deferred tracking system work?

**Answer:** Itemized + auto-escalation + dashboard.

**Decision:** New `deferred-items.jsonl` captures each deferred item with: item
description, source PR, severity, reason for deferral, resolution status.
Automatic escalation when item deferred in 2+ PRs (auto-promote to S1, create
DEBT entry). Dashboard surfaces unresolved deferrals at session-start (expanded
to full ecosystem health dashboard — see Q12).

---

## Batch 3 — Execution Strategy & Edge Cases

### Q9: Multi-Session Structure

**Question:** How to structure work across 10-20+ sessions?

**Answer:** GSD project.

**Decision:** Use the `/gsd:new-project` workflow to create a dedicated project
with phases, research, and execution plans. Most structured approach.

### Q10: Roadmap Fit

**Question:** How does ecosystem v2 relate to existing ROADMAP initiatives?

**Answer:** New parallel initiative.

**Decision:** Add as a separate ROADMAP initiative alongside Operational
Visibility and GRAND PLAN. It's related but distinct enough to track
independently.

### Q11: Migration Path

**Question:** Build new pipeline alongside old, or replace in-place?

**Answer:** Parallel build, then swap.

**Decision:** Build v2 scripts alongside v1. Once v2 is tested and backfilled,
swap session-start/hooks to point at v2. Old scripts stay as fallback. Safest
approach.

### Q12: User Input Timing

**Question:** Share your input before or after discovery?

**Answer:** Finish questions first, then share.

---

## Batch 4 — Data Model Details & Enforcement

### Q13: Schema Enforcement

**Question:** Write-time, read-time, or both?

**Answer:** Most thorough (Claude recommendation).

**Decision:** All three combined:

1. **Write-time Zod validation** — shared write function validates every record
   against schema before writing. Invalid records rejected with error.
2. **Read-time validation** — consumers log warnings for malformed records.
   Catches legacy issues.
3. **Migration script** — one-time script validates and fixes all existing
   records. Clean slate.

### Q14: Source ID Format

**Question:** How to normalize source IDs to prevent drift?

**Answer:** Minimize drift (Claude recommendation).

**Decision:** Structured `origin` field (not string normalization). Each record
gets a Zod-validated `origin` object:

```json
{
  "origin": {
    "type": "pr-review",
    "pr": 398,
    "round": 1
  }
}
```

- Queries use the structured field, not string parsing
- Write-time Zod validation makes drift impossible
- Free-text `source_id` kept for human readability but never queried

### Q15: Dashboard Triggers (Deferred Items → Full Ecosystem)

**Question:** What triggers attention in the dashboard?

**Answer:** Severity-weighted, BUT dashboard should encompass the whole
ecosystem health, not just deferred items.

**Decision:** Severity-weighted triggers for deferred items (S0/S1 after 7 days,
S2 after 14 days, S3 after 30 days; recurrence always surfaces immediately).
Dashboard expanded to full ecosystem health (see Q17).

### Q16: Rule Generation

**Question:** How should pattern-to-enforcement work?

**Answer:** Fully automated with thresholds.

**Decision:** If a pattern recurs N times across M PRs, auto-add to compliance
checker. No human gate. Maximum automation.

---

## Batch 5 — Dashboard & File Layout

### Q17: Ecosystem Health Dashboard Scope

**Question:** What should the dashboard cover?

**Answer:** All 4 categories + additional ideas (Claude recommendation).

**Decision:** Dashboard covers 10 dimensions:

1. **Data quality metrics** — JSONL completeness, field coverage, duplicate
   detection, schema validation pass rate, temporal coverage gaps
2. **Pipeline throughput** — discovery rate, promotion rate, enforcement rate,
   pipeline velocity, suggested rule conversion rate
3. **Review effectiveness** — recurrence rate, FP rate by source, churn ratio,
   fix-or-track rate, deferred resolution rate, round trends
4. **Gate & enforcement health** — override rates per gate, pattern coverage,
   false positive trends, hook failure rates, agent invocation compliance
5. **Component health scorecards** — letter grades for each component, tracked
   across sessions
6. **Deferred item aging** — heatmap by age and severity
7. **DEBT pipeline flow** — new vs resolved vs stuck per session, velocity
   trends
8. **Cross-document sync drift** — which docs have diverged from source-of-truth
9. **Archive integrity** — overlap/gap detection results
10. **Session productivity** — items resolved per session, review rounds trend

### Q18: Dashboard Trigger

**Question:** When should the dashboard run?

**Answer:** On-demand + alerts.

**Decision:** Dedicated `/ecosystem-health` command for full detailed view
anytime, PLUS alert thresholds that surface warnings mid-session if metrics
degrade (e.g., new duplicate detected during a review). NOT auto-run at
session-start (avoid overhead).

### Q19: File Layout for v2 Scripts

**Question:** Where should v2 scripts live?

**Answer:** Claude recommendation.

**Decision:** `scripts/reviews/` — domain-specific directory. V2 scripts go
here; v1 stays in `scripts/`. After migration, v1 scripts deleted and
`scripts/reviews/` becomes permanent home. No version numbering in directory
name.

### Q20: Consolidation Role in v2

**Question:** Should consolidation remain separate or merge?

**Answer:** Claude recommendation.

**Decision:** Merge consolidation into promotion. One script handles the full
cycle: detect recurring patterns → generate rules → promote to CODE_PATTERNS.
Eliminates the dead-end artifact. Periodic batch aspect remains as a threshold
trigger inside the merged script.

---

## Summary of Decisions

| #   | Decision             | Choice                                                   |
| --- | -------------------- | -------------------------------------------------------- |
| 1   | JSONL strategy       | Full redesign — split files, schema versions, normalized |
| 2   | Backfill scope       | Everything (#1-406, all 13 archives)                     |
| 3   | Test coverage        | Contract tests + E2E smoke test                          |
| 4   | Overall scope        | Full ecosystem v2 rebuild                                |
| 5   | Script consolidation | Rationalize full pipeline                                |
| 6   | Skill sprawl         | Keep all, fix broken data                                |
| 7   | Cross-doc gate       | Recalibrate to <15% override                             |
| 8   | Deferred tracking    | Itemized + auto-escalation + dashboard                   |
| 9   | Session structure    | GSD project                                              |
| 10  | Roadmap fit          | New parallel initiative                                  |
| 11  | Migration path       | Parallel build, then swap                                |
| 12  | Schema enforcement   | Write-time Zod + read-time warnings + migration script   |
| 13  | Source ID format     | Structured origin field (Zod-validated object)           |
| 14  | Dashboard scope      | 10 dimensions (full ecosystem health)                    |
| 15  | Dashboard trigger    | On-demand command + mid-session alerts                   |
| 16  | Rule generation      | Fully automated with thresholds                          |
| 17  | File layout          | scripts/reviews/ (domain-specific, permanent)            |
| 18  | Consolidation role   | Merge into promotion (one script, no dead ends)          |

---

---

## User Review Comments (Post-Discovery)

### UC-1: Data Flow Direction (JSONL-first)

**Context:** Diagnosis shows markdown → JSONL flow, with sync script causing
85-100% data loss from parsing free-text.

**User challenge:** Shouldn't JSONL be the source of truth, not the markdown?
The AI coder is both primary producer and consumer. JSONL is more reliable for
data collection.

**Decision:** **JSONL-first architecture.** AI writes structured JSONL records
as the source of truth. Markdown becomes a generated view for human readability.
Reverses the current markdown→JSONL flow. Eliminates the parsing problem
entirely.

**Impact:** This is a fundamental architectural shift that:

- Eliminates `sync-reviews-to-jsonl.js` entirely (no more markdown→JSONL sync)
- Replaces it with a `render-reviews-to-markdown.js` (JSONL→markdown view)
- Changes how `pr-review` and `pr-retro` skills write data (JSONL first)
- Makes the backfill a one-time migration (parse old markdown into JSONL, then
  markdown is generated going forward)

### UC-2: Backfill Completeness Strategy

**Context:** Backfilling ~406 reviews but only ~80% have full structured data.
Old reviews won't have v2-only fields. Risk of partial records breaking
analytics, tests, and downstream consumers.

**Decision:** Three-tier completeness model with explicit missing-field
tracking.

**Schema field tiers:**

| Tier                    | Fields                                                                                     | Rule                               |
| ----------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| Required (always)       | `id`, `date`, `schema_version`, `completeness`, `origin`                                   | Zod required — write fails without |
| Standard (full/partial) | `title`, `pr`, `source`, `total`, `fixed`, `deferred`, `rejected`, `patterns`, `learnings` | Zod optional — nullable            |
| Extended (v2-only)      | `severity_breakdown`, `per_round_detail`, `rejection_analysis`, `ping_pong_chains`         | Zod optional — only from v2 skills |

**Record metadata:**

- `completeness`: `"full"` | `"partial"` | `"stub"` on every record
- `completeness_missing`: array of field names explicitly absent (e.g.,
  `["patterns", "learnings"]`)
- Disambiguates "field is zero (real value)" from "field is zero (couldn't
  extract)"

**Consumer contract:**

- Analytics filter by completeness tier as needed
- Every pipeline function tested against all 3 fixture types (full, partial,
  stub)
- Partial records produce degraded-but-valid output; stub records skipped or
  minimal — **none throw**
- Helper function `hasField(record, field)` checks both null AND
  `completeness_missing` array

**Test fixtures:**

- `test/fixtures/review-full.json` — all fields, happy path
- `test/fixtures/review-partial.json` — missing patterns + learnings
- `test/fixtures/review-stub.json` — minimal fields only

### UC-3: Pattern Enforcement Strategy

**Context:** 76% of patterns (210/275) have no automated enforcement. Current
coverage is 24% via regex checker (43 rules) + ESLint plugin (22 rules).

**Decision:** Tiered enforcement model targeting 50% automated + 80% total.

**Enforcement tiers:**

| Tier                             | Mechanism                             | Best For                                                | Target          |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------- | --------------- |
| 1a — Regex rules                 | `check-pattern-compliance.js`         | String-level patterns (imports, banned funcs, naming)   | Expand existing |
| 1b — ESLint AST rules            | Custom ESLint plugin                  | Code structure (hooks, error handling, unsafe patterns) | Expand existing |
| 1c — TypeScript config           | `tsconfig.json` strict settings       | Type-level patterns (no `any`, strict nulls)            | Already active  |
| 2a — Pattern-aware code-reviewer | Feed pattern list as context to agent | Complex code patterns that resist static analysis       | New for v2      |
| 2b — PostToolUse write validator | Extend existing 10 sub-validators     | Patterns in newly written code                          | Extend existing |
| 3a — Skill-embedded checks       | Process checks in skill protocols     | "Always run X before Y" workflow patterns               | New for v2      |
| 3b — Hook-based gates            | Pre-commit/push checks                | "Did you do X?" enforcement                             | Extend existing |
| 3c — Session checklists          | Session-start/end reminders           | Unautomatic workflow patterns                           | Existing        |

**Pattern enforceability classification:**

| Category         | % of Patterns | Enforcement Path                                    |
| ---------------- | ------------- | --------------------------------------------------- |
| Auto-enforceable | ~40%          | Regex or ESLint rules — fully automated             |
| AI-assistable    | ~30%          | Code-reviewer agent context — checked during review |
| Process-only     | ~20%          | Skill/checklist embedded — reminders                |
| Unenforceble     | ~10%          | Too contextual — documentation-only, accepted       |

**Targets:**

- 50% automated enforcement (up from 24%) via:
  - Convert 22 idle suggested rules to actual regex/ESLint rules
  - Auto-generate rules from recurrence pipeline (Q16 decision)
  - Extend write validator with pattern checks
- 80% "any enforcement" (automated + AI-assisted + process) via:
  - Feed pattern context to code-reviewer agent
  - Embed checks in skill protocols

**Enforcement tool spectrum (when to use what):**

| Tool              | Effort/Rule   | Catches          | FP Risk  | Best For                                                 |
| ----------------- | ------------- | ---------------- | -------- | -------------------------------------------------------- |
| Regex             | ~15 min       | ~30% of patterns | Med-High | Banned strings, imports, naming, config values           |
| ESLint AST        | ~1-2 hrs      | ~60% of patterns | Low      | Code structure, scope-aware checks, hooks                |
| Semgrep (NEW)     | ~30 min       | ~70% of patterns | Low      | Multi-line patterns, try/catch wrapping, taint tracking  |
| TypeScript strict | Zero (config) | Type-level       | Zero     | `noExplicitAny`, `strictNullChecks`                      |
| AI-assisted       | Low (prompt)  | ~95% of patterns | Medium   | Semantic/contextual patterns that resist static analysis |

**Key insight: Semgrep.** Already installed as GitHub Action
(`returntocorp/semgrep-action`) but no custom rules written. Fills the gap
between regex (too dumb) and ESLint (too much effort). Pattern syntax is
code-like — you write what bad code looks like, not AST visitor logic.

**Regex is right for:** banned strings, import paths, naming conventions,
comment formats, config values — anything that's about TEXT not code structure.

**Regex fails for:** context-dependent patterns, multi-line/scope checks,
proving something is MISSING, type-aware checks, semantic patterns, and
distinguishing code from comments/strings.

**Updated tool allocation:**

| Tool                 | Existing Rules | New Rules to Write  | Target                      |
| -------------------- | -------------- | ------------------- | --------------------------- |
| Regex                | 43             | +10-15              | Simple text patterns        |
| ESLint AST           | 22             | +5-10               | JS/TS structure             |
| Semgrep custom (NEW) | 0              | +20-30              | Multi-line, wrapping, taint |
| TypeScript strict    | Config-only    | Config-only         | Type discipline             |
| AI-assisted          | 0              | Pattern list prompt | Everything else             |

**Updated targets:** 55-60% automated enforcement (up from 24%), with Semgrep
doing heavy lifting on patterns regex can't handle.

**Automated rule generation pipeline (from Q16):**

1. Detect: pattern recurs N times across M reviews
2. Classify: what enforcement tier fits? (regex? AST? Semgrep? process?)
3. Generate: auto-create rule (regex pattern, Semgrep YAML, ESLint skeleton, or
   process check)
4. Deploy: add to compliance checker automatically
5. Monitor: track FP rate, auto-disable if FP > threshold

### UC-4: suggested-rules.md Elimination

**Context:** `consolidation-output/suggested-rules.md` contains 22 unconverted
rule stubs with `TODO_REGEX` placeholders. Intended as bridge between pattern
discovery and enforcement but the human step never happens. Diagnosis calls it a
"dead end."

**Decision:** Delete `suggested-rules.md` in v2. Its purpose is absorbed into
the merged promotion script's automated rule generation pipeline.

**Why the file failed:**

- Stubs are too vague — identify THAT a term recurs, not WHAT the enforceable
  pattern is
- Human effort to go from `TODO_REGEX` to real rule ≈ writing from scratch
- No feedback loop, no urgency, no automation — stubs accumulate and rot

**How v2 replaces it:**

```
CURRENT:  consolidation → suggested-rules.md → [human never acts] → nothing
V2:       Pattern recurs N×M → auto-classify tier → generate real rule → deploy
```

- No intermediate file — rules go directly into the enforcement system
- Auto-classification determines target (regex / Semgrep / ESLint / process)
- Rich pattern descriptions from JSONL-first architecture (UC-1) enable the
  generator to produce real rules, not stubs
- FP monitoring auto-disables bad rules

**Artifacts to delete:** `consolidation-output/suggested-rules.md` and the
`generateSuggestedRules()` function in `run-consolidation.js` (which itself is
being merged into the v2 promotion script per Q20).

### UC-5: Endorsement of Recommended Investment Areas

**Context:** Diagnosis Executive Summary recommends 5 investment areas (ranked
by impact).

**User comment:** Agrees with all 5 as a starting point. Expects scope to grow
beyond these.

**Endorsed areas:**

1. **JSONL data pipeline rebuild** — superseded by UC-1 (JSONL-first
   architecture, which goes further than just fixing sync)
2. **Deferred item itemization** — superseded by Q8 (itemized + auto-escalation
   - dashboard) and UC-2 (completeness model)
3. **Enforcement coverage expansion** — superseded by UC-3 (tiered enforcement
   with Semgrep, targeting 55-60% automated)
4. **Pipeline test coverage** — per Q3 (contract tests + E2E smoke)
5. **DEBT resolution workflow** — to be designed in v2 (not yet detailed)

**Note:** These are the floor, not the ceiling. V2 scope encompasses these plus
structural reform, ecosystem health dashboard, rationalized pipeline, and
automated rule generation.

### UC-6: Layer Priority Assessment

**Context:** 35 components across 7 layers. User asked which need the most work.

**Decision:** Layer-by-layer priority order established for v2 execution.

**Layer grades and work scope:**

| Priority | Layer                 | Grade | v2 Scope                                                                           |
| -------- | --------------------- | ----- | ---------------------------------------------------------------------------------- |
| 1st      | Layer 2: Storage      | F     | Complete rebuild — split JSONL, Zod schemas, delete sync script, backfill          |
| 2nd      | Layer 3: Analysis     | D     | Major rewrite — merge consolidation+promotion, rewrite effectiveness analyzer      |
| 3rd      | Layer 6: Tracking     | D+    | Significant rework — new deferred-items.jsonl, normalize source IDs, DEBT workflow |
| 4th      | Layer 4: Promotion    | C-    | Merge + automate — one script for pattern lifecycle, sync drifted docs             |
| 5th      | Layer 5: Enforcement  | C+    | Expand — add Semgrep, +35-55 rules across tools, recalibrate gates                 |
| 6th      | Layer 1: Capture      | B-    | Moderate — update skills to write JSONL-first, feed patterns to code-reviewer      |
| 7th      | Layer 7: Audit & Meta | B     | Minor — fix agent tracker, repoint at v2 data                                      |

**Dependency chain:**

```
Layer 2 (Storage) → Layer 3 (Analysis) → Layer 4 (Promotion) → Layer 5 (Enforcement)
Layer 2 (Storage) → Layer 6 (Tracking)
Layer 2 (Storage) → Layer 1 (Capture) — skills need v2 schema to write to
Layer 2 (Storage) → Layer 7 (Audit) — audits need clean data to report on
```

Layer 2 is the critical path — everything else depends on it.

**Key component-level changes:**

- **Delete:** `sync-reviews-to-jsonl.js`, `suggested-rules.md`
- **New:** `deferred-items.jsonl`, `render-reviews-to-markdown.js`, Semgrep
  custom rules, ecosystem health dashboard, DEBT triage workflow
- **Merge:** `run-consolidation.js` + `promote-patterns.js` → single v2 script
- **Rewrite:** `analyze-learning-effectiveness.js` (consume clean JSONL, proper
  API for pattern list)
- **Update:** `pr-review` skill, `pr-retro` skill, `code-reviewer` agent
  context, session-start automation, agent invocation tracker
- **Expand:** `check-pattern-compliance.js` (+10-15 rules), ESLint plugin (+5-10
  rules), Semgrep (+20-30 rules)
- **Recalibrate:** cross-doc deps gate (48.9% → <15% override rate)
- **Sync:** SECURITY_CHECKLIST.md with ESLint reality, FIX_TEMPLATES.md gaps
- **Audit:** 19 Qodo suppression rules for staleness

### UC-7: Skill UX Preservation

**Context:** User likes existing skills and workflows. Wants to keep invoking
them the same way.

**Decision:** Same skills, same invocations, different plumbing, better outputs.

**What stays the same:** All skill commands (`/pr-review`, `/pr-retro`,
`/code-reviewer`, `/session-begin`, `/session-end`, `/add-debt`), workflows, and
invocation patterns.

**What changes under the hood:** Data flow direction (JSONL-first), script
plumbing, validation, deferred tracking.

**What changes in visible output:** Deferred items become itemized lists (not
counts), ecosystem health dashboard available on-demand, richer enforcement
violations (Semgrep + ESLint), auto-generated rules appear, mid-session alerts
for aged/recurring deferrals.

**Skill protocol caveat:** Internal protocols for `/pr-review` and `/pr-retro`
updated to write JSONL first, then render markdown. Steps reordered slightly but
analysis/workflow logic preserved.

### UC-8: Manual Step Automation

**Context:** Manual steps (like `/add-debt` after deferring items) get forgotten
~90% of the time. 123 deferred items lost because the human step was skipped.

**Decision:** Three-level automation principle: if a step can be forgotten, it
must be automated or enforced, never just documented.

**Automation levels:**

| Level             | Mechanism                            | When to use              |
| ----------------- | ------------------------------------ | ------------------------ |
| Fully automated   | Script does it, no human involvement | Default for data writes  |
| Enforced gate     | Can't proceed without doing it       | Pre-commit/push blocking |
| Prompted reminder | System surfaces it, human acts       | Session-end checklist    |

**Specific automation changes:**

| Manual Step                    | Current                                           | v2                                                                                 |
| ------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/add-debt` for deferred items | Manual invocation after pr-review (90% skip rate) | **Fully automated** — review JSONL write auto-creates deferred-items.jsonl entries |
| Pattern promotion              | Manual curation of stubs (never happens)          | **Fully automated** — recurrence detection + auto-rule generation                  |
| Cross-doc sync                 | Enforced gate (48.9% override)                    | **Enforced gate (recalibrated)** — target <15% override                            |
| Code-reviewer invocation       | Enforced gate (4.6% override)                     | **Keep as-is** — well-calibrated                                                   |
| Review archival                | Semi-automated (suggests, human confirms)         | **Fully automated** — threshold hit triggers auto-archive                          |
| ROADMAP/doc updates            | Session-end checklist (often missed)              | **Prompted reminder** with specific items to update                                |

**General v2 skill design principle:** Skills become self-contained. No dangling
"now manually run X" steps. Data writes happen inside the skill as side effects.
`/add-debt` remains available for ad-hoc manual debt entry but is no longer
required as part of the review/retro workflow.

### UC-9: Unified Invocation Tracking

**Context:** `track-agent-invocation.js` only watches Task tool. All Skill tool
invocations (`/pr-review`, `/pr-retro`, etc.) are invisible. Pre-push gate can
verify code-reviewer but not pr-review.

**Decision:** Option 4 — Unified invocation ledger.

**Replace** `agent-invocations.jsonl` with `invocations.jsonl` tracking
everything in one Zod-validated file:

```json
{
  "timestamp": "2026-02-28T04:32:00Z",
  "schema_version": 1,
  "type": "skill | agent | hook | automation",
  "name": "pr-review",
  "event": "invoked | completed | failed",
  "trigger": "user | post-task | pre-commit | session-start",
  "session": 197,
  "metrics": {}
}
```

**Tracking mechanism (two layers):**

1. **PostToolUse hook (guaranteed):** Catches every Task and Skill tool
   invocation. Writes `event: "invoked"` record. Cannot be skipped.
2. **Skill self-reporting (best-effort):** Skills write `event: "completed"`
   with output metrics as part of their JSONL-first writes (UC-8). Baked into
   skill plumbing, not a manual step.

**Benefits:**

- Single source for "what happened this session?" queries
- Feeds directly into ecosystem health dashboard (Q17)
- Pre-push gate becomes a simple query against unified ledger
- Extensible to check for any required invocation, not just code-reviewer
- Fits v2 JSONL-first architecture with Zod validation

**Migration:**

- Delete: `agent-invocations.jsonl` (after migration)
- New: `invocations.jsonl` with unified schema
- Update: `track-agent-invocation.js` hook to watch Skill tool + write new
  schema
- Update: Pre-push gate consumers to read new file

### UC-10: Anti-Staleness Strategy

**Context:** Staleness is a recurring theme across the ecosystem — docs drift
from reality with no detection. Root causes: no freshness metadata, one-way
updates, no cost to staleness, manual sync burden.

**Decision:** Five-tier anti-staleness strategy. Principle: every artifact
should either be auto-generated (can't go stale) or have a freshness check
(staleness detected and surfaced).

**Tier 1 — Eliminate by design (auto-generation):**

Artifacts that are generated from a source of truth cannot go stale.

- `AI_REVIEW_LEARNINGS_LOG.md` → generated view from JSONL (UC-1)
- `suggested-rules.md` → deleted, rules auto-generated (UC-4)
- Enforcement rules → auto-generated from recurrence pipeline
- Review archives → auto-archived at threshold

**Tier 2 — Freshness metadata on every non-generated document:**

```markdown
<!-- freshness:
  last_verified: 2026-02-28
  verified_against: [CODE_PATTERNS.md, eslint-plugin/index.js]
  max_age_days: 30
  staleness_check: scripts/checks/verify-security-checklist.js
-->
```

Fields: `last_verified`, `verified_against` (sources to sync with),
`max_age_days`, optional `staleness_check` script.

**Tier 3 — Automated staleness detection (session-start + dashboard):**

Script scans all docs with freshness headers:

1. `last_verified > max_age_days`? → STALE WARNING
2. `verified_against` sources modified since `last_verified`? → DRIFT WARNING
3. `staleness_check` script passes? → VERIFIED / FAILED

Feeds into ecosystem health dashboard as "Document Freshness" dimension (#11).

**Tier 4 — Staleness has consequences:**

| Level    | Trigger                     | Consequence                                 |
| -------- | --------------------------- | ------------------------------------------- |
| Warning  | >max_age_days               | Dashboard yellow, session-start surfaces it |
| Drift    | Source changed, doc didn't  | Dashboard red, mid-session alert            |
| Critical | S0/S1 doc stale >2x max_age | Pre-commit gate blocks until verified       |

**Tier 5 — Dependency graph enforcement (recalibrated cross-doc gate):**

- Keep dependency graph in `doc-dependencies.json`
- Add freshness metadata to rules (not just co-staging, but verification within
  N days)
- Separate blocking deps (security-critical) from advisory deps
- Recalibrate with `diffPattern` filters (Q7)

**Specific staleness fixes:**

| Artifact               | Mechanism                                                                     |
| ---------------------- | ----------------------------------------------------------------------------- |
| SECURITY_CHECKLIST.md  | Freshness check script diffs against ESLint plugin rule list                  |
| Qodo suppression rules | Freshness metadata + audit script (flag rules referencing PRs >30 days old)   |
| CODE_PATTERNS.md       | Auto-maintained by promotion script; freshness check against compliance rules |
| FIX_TEMPLATES.md       | Freshness check: every enforced pattern should have a template                |
| Cross-doc references   | Recalibrated gate + freshness metadata                                        |
| Archives               | Auto-generated in v2 — can't go stale                                         |
| ROADMAP.md             | `roadmap:hygiene` feeds into dashboard                                        |
| SESSION_CONTEXT.md     | Session gap detector feeds into dashboard                                     |
| Deferred items         | `deferred-items.jsonl` with age tracking + auto-escalation                    |

**Dashboard dimension #11: Document Freshness Report** — shows verification
status, age, and staleness warnings for all tracked documents.

### UC-11: Over-Engineering Guardrails

**Context:** Risk that v2 ecosystem becomes heavier than v1. Single-developer
project with 4 JSONL files, 11+ dashboard dimensions, 5-tier staleness, etc.

**Decision:** Fixed performance budgets and simplification principles, BUT
dashboard stays full-featured (not reduced).

**Performance budgets (hard limits):**

| Phase                    | Target | Hard Limit                             |
| ------------------------ | ------ | -------------------------------------- |
| Pre-commit gates (total) | <10s   | Each gate <3s; blocking only for S0/S1 |
| Session-start scripts    | <30s   | 60s — anything over gets cut           |
| Session-end scripts      | <20s   | 45s                                    |
| Dashboard (on-demand)    | <15s   | 30s                                    |

**Design principles:**

1. Gates: <3s each, <10s total. Blocking only for S0/S1 issues.
2. Session tax: <30s start, <20s end. Hard limits, not guidelines.
3. Dashboard: On-demand, fully-featured (11+ dimensions). No reductions.
4. Staleness: Auto-generate what you can. Freshness-check critical docs only.
5. Automation: Automate data writes (invisible). Don't automate interruptions.
6. New components: Must pay for themselves. If maintenance > value, cut it.
7. Escape hatches: Every gate overridable in <5s with logged reason.
8. North star: v2 should feel LIGHTER than v1, not heavier.

**Simplifications applied:**

- Mid-session alerts: **Cut.** On-demand dashboard + session-start summary +
  warning escalation is enough. Mid-session alerts are interruptions.
- Staleness tiers: Reduced from 5 to 2 operational tiers (auto-generate or
  freshness-check). The conceptual framework stays for documentation but
  implementation is simpler.
- Read-time schema validation: Just a warning log from Zod parse, not a separate
  system.

**NOT simplified (user override):**

- Dashboard dimensions: Kept at 11+ (will expand further with warnings/
  advisories — see UC-12).

### UC-12: Warning Lifecycle & Advisory Resolution

**Context:** Advisory/warning gates that nobody acts on are just noise. The
cross-doc gate's 48.9% override rate proves that blocking without a deferral
path causes overrides, not compliance.

**Decision:** Structured warning lifecycle with actionable queue, concrete
resolution paths, and escalation gradient.

**Warning record schema (`warnings.jsonl`):**

```json
{
  "id": "WARN-001",
  "schema_version": 1,
  "source": "cross-doc-deps",
  "severity": "advisory",
  "message": "SECURITY_CHECKLIST.md may be stale (45 days)",
  "action": "Run: node scripts/checks/verify-security-checklist.js --fix",
  "context": {},
  "created": "2026-02-28",
  "status": "open | resolved | dismissed",
  "dismiss_reason": null,
  "escalates_to_blocking": "2026-03-14",
  "resolved_at": null
}
```

**Key design rules:**

- Every warning has a concrete `action` field (runnable command or specific
  instruction). No vague "consider updating X."
- Optional `escalates_to_blocking` date — advisory becomes blocking if
  unresolved. Creates natural deadline without immediate friction.
- Dismissed warnings don't re-fire for 90 days.

**Visibility timeline:**

| Moment              | What Happens                                               |
| ------------------- | ---------------------------------------------------------- |
| Pre-commit          | Warning flashes but doesn't block. Keep working.           |
| Session-start       | Brief summary: "3 open advisories (1 escalates in 4 days)" |
| On-demand dashboard | Full warning queue with actions, ages, escalation dates    |
| Escalation date hit | Advisory becomes blocking — must resolve or dismiss        |

**Three resolution paths:**

1. **Fix it** — run the `action` command, warning auto-resolves
2. **Dismiss it** — provide reason, warning closed for 90 days
3. **Batch triage** — session-start shows list, spend 30s scanning, fix/defer

**Escalation timelines by type:**

| Warning Type                   | Escalates? | Timeline           |
| ------------------------------ | ---------- | ------------------ |
| Security doc staleness         | Yes        | 14 days → blocking |
| Cross-doc drift (non-security) | Yes        | 21 days → blocking |
| Pattern doc drift              | Yes        | 30 days → blocking |
| Qodo/config rule staleness     | No         | Advisory forever   |
| Performance/metric warnings    | No         | Advisory forever   |

**Why this avoids the override problem:** Three options instead of two. Current
gates offer "comply now or override." V2 adds "acknowledge and defer with
deadline." Respects flow while ensuring eventual resolution. Escalation to
blocking is the safety net — justified because you had weeks to address it.

### UC-13: Interactive Dashboard Design

**Context:** User wants dashboard as thorough and interactive as possible,
modeled after the `/alerts` skill. Dashboard is the primary interface for
ecosystem health, warnings, and decision-making.

**Decision:** Fully interactive on-demand dashboard with all information needed
to make informed decisions. Dimensions expanded to include warning/advisory
queue.

**Dashboard dimensions (12+):**

1. Data quality metrics — JSONL completeness, field coverage, duplicates, schema
   validation pass rate, temporal gaps
2. Pipeline throughput — discovery rate, promotion rate, enforcement rate,
   pipeline velocity, rule conversion rate
3. Review effectiveness — recurrence rate, FP rate by source, churn ratio,
   fix-or-track rate, deferred resolution, round trends
4. Gate & enforcement health — override rates per gate, pattern coverage, FP
   trends, hook failures, invocation compliance
5. Component health scorecards — letter grades per component, tracked across
   sessions
6. Deferred item aging — heatmap by age and severity, escalation status
7. DEBT pipeline flow — new vs resolved vs stuck per session, velocity trends
8. Cross-document sync drift — which docs diverged from source-of-truth
9. Archive integrity — overlap/gap detection results
10. Session productivity — items resolved per session, review rounds trend
11. Document freshness — verification status, age, staleness warnings per doc
12. **Warning/advisory queue** — open advisories with actions, ages, escalation
    dates, resolution options

**Interactive features (modeled after `/alerts` skill):**

- **Summary view** (default): Color-coded health grades per dimension, open
  warning count, items needing attention
- **Drill-down**: Select any dimension to see full detail with context
- **Action prompts**: Each warning/issue shows its resolution command — user can
  choose to act, defer, or dismiss inline
- **Filtering**: By severity, by dimension, by age, by escalation status
- **Trend comparison**: Current vs previous session metrics where data exists
- **Decision context**: Each item shows enough information (source, history,
  impact) to make an informed decision without reading other files

**Invocation:** `/ecosystem-health` command (dedicated skill).

**JSONL files feeding the dashboard:**

- `reviews.jsonl` — data quality + review effectiveness
- `retros.jsonl` — pipeline throughput + review trends
- `deferred-items.jsonl` — deferred aging + escalation
- `invocations.jsonl` — gate health + invocation compliance
- `warnings.jsonl` — warning queue + staleness
- `MASTER_DEBT.jsonl` — DEBT pipeline flow
- Freshness metadata from document headers — document freshness

### UC-14: Pipeline Test Strategy

**Context:** 0/14 scripts tested, 0/7 E2E tests, 1/10 contract tests. Any
refactor could silently break the ecosystem with no detection for weeks.

**Decision:** Three-purpose testing: development (build phase), regression
(every commit), and health monitoring (every session on real data).

**v2 handoff simplification:** JSONL-first architecture reduces 10 handoffs to
~7 by eliminating markdown→JSONL sync and archive parsing.

**Contract tests (7 test files):**

| Test                             | Validates                                                    |
| -------------------------------- | ------------------------------------------------------------ |
| `review-write.test.js`           | Skill writes valid JSONL, all 3 completeness tiers pass Zod  |
| `deferred-write.test.js`         | Deferred items auto-created when review has deferrals        |
| `promotion-input.test.js`        | Promotion script reads JSONL pattern data correctly          |
| `promotion-output.test.js`       | Promotion script writes CODE_PATTERNS correctly              |
| `effectiveness-input.test.js`    | Effectiveness analyzer reads JSONL, produces correct metrics |
| `enforcement-generation.test.js` | Auto-generated rules are valid regex/Semgrep/ESLint          |
| `markdown-render.test.js`        | JSONL→markdown renderer produces correct output              |

**E2E smoke test (1 test file):**

Full pipeline: write review → auto-create deferred items → trigger promotion →
generate rule → rule catches violation → render markdown → run effectiveness →
run dashboard. "Review enters, enforcement exits."

**Test infrastructure:**

| Decision      | Choice                                                      |
| ------------- | ----------------------------------------------------------- |
| Runner        | Jest (existing)                                             |
| Fixtures      | `test/fixtures/ecosystem-v2/` (full, partial, stub records) |
| Test location | `scripts/reviews/__tests__/` (co-located with v2 scripts)   |
| Isolation     | Temp directory per test, auto-cleanup                       |
| CI            | Added to existing `npm test`                                |

**Three testing purposes:**

| Purpose           | When                         | What                                                    | Catches                        |
| ----------------- | ---------------------------- | ------------------------------------------------------- | ------------------------------ |
| Development       | While building v2            | Contract + E2E tests on fixtures                        | Bugs during implementation     |
| Regression        | Every commit (forever)       | Same tests in pre-commit + CI                           | Breakage from future refactors |
| Health monitoring | Every session (on real data) | Zod validation, completeness audit, duplicate detection | Data quality degradation       |

**Test suite vs health monitoring:**

- Test suite validates **the code works** (fixtures, deterministic)
- Health monitoring validates **the data is clean** (real JSONL, runtime)
- Both needed: tests pass but data bad = skill writing wrong values; data clean
  but tests fail = refactor broke something

**Regression integration:**

| Trigger           | Runs                | Budget                          |
| ----------------- | ------------------- | ------------------------------- |
| `npm test`        | All contract + E2E  | Part of existing 330-test suite |
| Pre-commit        | Contract tests only | <10s (within gate budget)       |
| GitHub Actions CI | Full suite          | Every PR                        |

**New test count:** ~11-13 new test files (~341-343 total tests).

**Deliberately NOT tested:** Skill protocol steps (AI-driven), dashboard
rendering (interactive), hook firing order (tested by hook system), Semgrep/
ESLint rule correctness (tested by their own frameworks).

### UC-15: JSONL Field Completeness — 5-Layer Defense

**Context:** 85-100% field loss in v1 caused by no write-time validation, parser
mismatches, and format drift. Fields went empty silently for months.

**Decision:** 5-layer defense-in-depth preventing, detecting, and gracefully
handling incomplete data.

**Layers:**

1. **Zod schema (type correctness)** — required fields present, types valid.
   Write rejected if required tier fields missing.
2. **Completeness validation (honesty)** — records claiming `"full"` verified
   against standard field list. Auto-downgrade to `"partial"` if any standard
   field empty. `completeness_missing` auto-populated.
3. **AI writes structured data (prevention)** — no parsing. AI has the numbers,
   writes them directly as structured fields. Eliminates regex→prose mismatch.
4. **Health monitoring (drift detection)** — zero-field alert triggers warning
   if field empty on 5+ consecutive reviews. Dashboard shows field coverage
   stats. Detection within days, not months.
5. **Contract tests (regression guard)** — write path tested against all 3
   completeness tiers on every commit.

### UC-16: Graceful Degradation Contract

**Context:** Even with 5-layer defense, occasional missed fields will happen.
System must work correctly with incomplete data, not just perfect data.

**Decision:** Missing fields reduce output quality, never cause failures.
Confidence scoring on every metric.

**Consumer contract:**

| Input            | Behavior                 | Output                          |
| ---------------- | ------------------------ | ------------------------------- |
| Full record      | Full analysis            | Complete results                |
| Partial record   | Skip missing-field calcs | Partial results, clearly marked |
| Stub record      | Include in counts only   | Counted but not analyzed        |
| Malformed record | Log warning, skip        | Excluded with audit trail       |

**Implementation patterns:**

- **`hasField(record, field)`** — checks both null AND `completeness_missing`.
  Distinguishes "field is 0 (real)" from "field is 0 (missing)".
- **`null` means "unknown"** — distinct from `0` meaning "checked and found
  none". Flows through to dashboard.
- **Aggregations exclude gracefully** — metrics computed on available data,
  report sample size and exclusion count.

**Confidence scoring on every dashboard metric:**

| Coverage | Confidence   | Meaning                                |
| -------- | ------------ | -------------------------------------- |
| >=90%    | HIGH         | Metric is reliable                     |
| 70-89%   | MEDIUM       | Directionally accurate, some gaps      |
| 40-69%   | LOW          | Treat as signal, not fact              |
| <40%     | INSUFFICIENT | Shown but flagged — not decision-grade |

**Dashboard display pattern:**

```
FP rate by source: 18.2%  (confidence: MEDIUM — 76% have source field)
Churn trend:       ↓      (confidence: LOW — 45% have round data)
```

**Contract tests enforce degradation:**

- Every consumer function tested with full, partial, stub, and mixed fixtures
- Tests verify: correct metrics for available data, correct confidence level,
  correct exclusion count, no crashes
- Not just "doesn't throw" — "produces mathematically correct partial results"

**Full flow for occasional missed field:**

```
Missed field → auto-downgrade to "partial" (Layer 2)
  → completeness_missing lists it (UC-2)
  → hasField() returns false → consumer skips gracefully
  → dashboard metric still accurate for available data
  → confidence reflects the gap
  → 5+ consecutive misses → warning triggers (Layer 4)
  → contract tests guarantee this path works (Layer 5)
```

**Nothing breaks. Nothing lies. Nothing hides.**

### UC-17: Retro Skill JSONL-First Data Model

**Context:** User confirmed retros should be JSONL-first like reviews. Current
pr-retro writes markdown block first, JSONL sync captures 40-50%.

**Decision:** `retros.jsonl` is the primary store for all retrospective data.
Markdown is a generated view.

**Retro JSONL schema (key fields):**

```
id, schema_version, completeness, origin, date, pr,
summary: { rounds, total_items, fixed, rejected, deferred },
per_round: [{ round, date, source, items, fixed, deferred, rejected, key_patterns }],
severity_breakdown: { critical, major, minor, trivial },
ping_pong_chains: [{ name, rounds, avoidable_rounds, root_cause, files }],
rejection_analysis: [{ category, count, rounds, justification }],
deferred_items: [{ description, severity, reason, source_round }],
automation_candidates: [...],
skills_to_update: [...],
process_improvements: [...],
learnings: [...]
```

**Dual-writes (automated, not manual):**

| Data                       | Primary Store                     | Also Written To        | Mechanism         |
| -------------------------- | --------------------------------- | ---------------------- | ----------------- |
| Retro record               | `retros.jsonl`                    | —                      | Skill plumbing    |
| Deferred items             | `retros.jsonl` (as part of retro) | `deferred-items.jsonl` | Auto-write (UC-8) |
| Unimplemented action items | `retros.jsonl`                    | MASTER_DEBT.jsonl      | Auto-write (UC-8) |
| Rejected items             | `retros.jsonl`                    | Qodo/Gemini configs    | Existing sync     |
| Human-readable retro       | —                                 | Learnings log markdown | Generated view    |

**Skill experience unchanged:**

1. Invoke `/pr-retro 398` (same)
2. AI analyzes review cycle (same)
3. AI presents retro in conversation (same)
4. Under the hood: JSONL written, deferred items tracked, DEBT entries created,
   markdown view generated — all automatic, no manual steps

### UC-18: Compaction Safeguards for v2 Ecosystem Work

**Context:** Existing 4-layer compaction defense has gaps: no commits during
planning sessions, no auto-checkpoint on token threshold, 60-min staleness
cutoff too conservative, no teammate compaction protocol, session notes never
auto-written.

**Decision:** Extend compaction safeguards for long operations (planning, skill
runs, GSD execution, dashboard interaction).

**New safeguards:**

| Safeguard                           | What                                                                    | Mechanism                                  |
| ----------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| Auto-checkpoint on token threshold  | 70%+ context usage triggers auto-write of `handoff.json`                | Extend existing context tracking hook      |
| Decision ledger on disk             | All decisions written to files as made                                  | Already standard (DISCOVERY_QA.md pattern) |
| Plan file as recovery anchor        | GSD plan file contains everything needed to resume                      | Built into GSD workflow                    |
| Session notes auto-population       | Pre-compaction hook auto-writes summary to `session-notes.json`         | Extend pre-compaction hook                 |
| Extend handoff staleness to 4 hours | 60-min cutoff too conservative for real sessions                        | Config change in compact-restore.js        |
| Teammate compaction protocol        | GSD teammates write task progress to shared task list before compaction | New PreCompact hook for teammates          |
| Skill-level checkpointing           | Long skills write intermediate state at key milestones                  | Skill protocol update                      |

**Skill-level checkpointing pattern:**

```
Skill starts → writes {skill, status: "started", step: 1} to state file
  → completes step 3 → updates {step: 3, partial_output: {...}}
  → compaction happens mid-skill
  → restore reads state → skill resumes from step 3, not step 1
```

Critical for: ecosystem health dashboard (12+ dimensions), pr-retro (multi-step
analysis), pr-review (multi-round processing), any GSD phase execution.

**Existing safeguards to keep:**

- Layer A (commit tracker) — works, no changes
- Layer C (pre-compaction save) — extend with auto-session-notes
- Restore (compact-restore.js) — extend staleness to 4 hours
- Layer D (gap detection) — works, no changes
- `/checkpoint` skill — keep as manual option

### UC-19: Review Archival Automation

**Context:** Manual `npm run reviews:archive` when >20 active reviews. User
sometimes forgets; suggestion gets ignored.

**Decision:** Auto-archive during session-end when active count exceeds 20.

The `npm run reviews:archive -- --apply` command already exists. Wire it into
session-end as auto-execute instead of advisory print. No human confirmation
needed — the threshold and archive logic are already proven.

### UC-20: Qodo Suppression Rule Auto-Pruning

**Context:** 19 Qodo suppression rules accumulated (NG-7), referencing PRs
#366-#396. Rules may be stale but nobody checks.

**Decision:** New script `scripts/reviews/prune-qodo-suppressions.js`. Runs
during session-start.

**Logic:**

1. Parse `.qodo/pr-agent.toml`, extract PR references from each suppression rule
2. Check if referenced PR is >30 days old → flag in `warnings.jsonl`
3. After 60 days with no re-trigger → auto-comment out rule with
   `# STALE: last seen PR #XXX`
4. User confirms permanent removal during dashboard triage

**Note:** PR review auto-fetch rejected (UC-19b) — GitHub API gives less info
than user copy/paste. Confirmed by user from prior experience.

### UC-21: SECURITY_CHECKLIST.md Auto-Sync

**Context:** Checklist drifts from ESLint rules. 22 migrations not reflected
(KG-9). UC-10 covers freshness metadata but not content sync.

**Decision:** New script `scripts/reviews/sync-security-checklist.js`. Runs
during session-start (within 30s budget).

**Logic:**

- Diff ESLint plugin rule list against SECURITY_CHECKLIST.md entries
- New rules without checklist coverage → auto-append stub entries + create
  warning
- Checklist references deleted rules → flag for removal
- Content sync, not just freshness flagging

### UC-22: FIX_TEMPLATES Auto-Generation

**Context:** New enforced patterns need FIX_TEMPLATES but nobody writes them. No
auto-generation exists.

**Decision:** When the promotion script creates a new enforced pattern in
CODE_PATTERNS.md, it also generates a FIX_TEMPLATE stub.

**Stub contents:**

- Pattern name (from promotion)
- Violation example (from the detection rule)
- Fix example (inverted violation)
- `TODO: verify fix example` marker

Flagged in `warnings.jsonl` until TODO is resolved. Stub is better than nothing
— most templates follow a predictable structure.

### UC-23: DEBT Triage Automation

**Context:** 558 review-sourced DEBT items stuck at VERIFIED status (87.5%).
6.9% resolution rate. No triage workflow exists.

**Decision:** New script `scripts/reviews/triage-verified-debt.js`. Runs during
session-start.

**Auto-classification logic:**

| Condition                                    | Action                                     |
| -------------------------------------------- | ------------------------------------------ |
| Matching resolved items exist (same pattern) | Auto-mark RESOLVED                         |
| Referenced files no longer exist             | Auto-mark FALSE_POSITIVE                   |
| S0/S1 items open >30 days                    | Escalate to warning queue                  |
| Everything else                              | Remains VERIFIED, age-flagged in dashboard |

**Target:** Reduce 558 stuck items by 30-40% automatically. Surface the rest for
human triage via ecosystem health dashboard.

### UC-24: Archive Overlap/Gap Cleanup

**Context:** 3 overlapping review ranges, 7 coverage gaps, duplicate numbering
(KG-7, NG-13).

**Decision:** One-time script `scripts/reviews/fix-archive-overlaps.js`.

- Deduplicate reviews #366-#369 across 3 files
- Resolve numbering collisions
- Fill 7 coverage gaps with stub entries where source data exists
- Run once during v2 build

Post-fix: archive integrity becomes a dashboard health dimension (UC-13) that
prevents recurrence.

### UC-25: Pattern #5/#13 Correction

**Context:** Pattern #5 ("Propagation") falsely archived, but recurs as Pattern
#13 ("Fix-One-Audit-All"). False resolution inflates pattern resolution rate
from 31% to 38% (NG-8).

**Decision:** One-time fix during v2 build. Update CODE_PATTERNS.md to mark
Pattern #5 as "renamed to #13 (Fix-One-Audit-All)" instead of
"archived/resolved."

### UC-26: Gemini Config Version Control

**Context:** Gemini configuration not in-repo, configured at GitHub level
(NG-12). Not version-controlled, changes not auditable.

**Decision:** Move Gemini configuration into `.gemini/` directory in-repo
(already partially done — `.gemini/config.yaml` and `styleguide.md` exist from
Session #195). Add cross-doc freshness check: if `.gemini/styleguide.md` >30
days old → flag in warnings. No complex automation — just version control +
staleness detection.

### UC-27: S1 Escalation Auto-Trigger

**Context:** S1 escalation mechanism exists in learning log Step 5.2 but has
never been used (KG-10). Recurring deferrals are undetectable with current
counts-only model (KG-12).

**Decision:** Wire into deferred item tracking from UC-8.

**Trigger logic:** When `deferred-items.jsonl` shows the same item deferred in
2+ different PRs (matched by pattern ID + description similarity):

1. Auto-create S1 DEBT entry
2. Add to warning queue with "recurring deferral" tag
3. Flag in dashboard's deferred aging heatmap (UC-13, dimension #6)

Consumes structured JSONL instead of requiring manual invocation.

### UC-28: Cross-Doc Auto-Fix Mode

**Context:** Cross-doc dependency checker has 48.9% override rate (NG-4). Flags
drift but user must manually fix. Most drift is mechanical (version numbers,
file references, count mismatches).

**Decision:** Extend `check-cross-doc-deps.js` with `--fix` mode.

**Auto-fixable drift types:**

- Version numbers (package.json → docs)
- File path references (renamed/moved files)
- Count mismatches (test counts, pattern counts)
- Missing cross-references (new file not referenced)

**Non-auto-fixable (stays as warning):**

- Semantic content drift (description doesn't match implementation)
- Architectural guidance vs reality
- Anything requiring judgment

**Target:** Reduce 48.9% override rate to <15% by auto-fixing mechanical drift
and only flagging what genuinely needs human judgment.

### UC-29: Consolidation Counter Reconciliation

**Context:** Consolidation counter reset without documentation (NG-2). State
file says #4, version history shows #18 historical runs.

**Decision:** One-time fix during v2 build. Update
`.claude/state/consolidation.json` to document the reset: old system #6-#18, new
system #1-#4, total ~17 runs. Add a `history` field to the state file so future
resets are self-documenting.

---

## Automation Coverage Summary (UC-19 through UC-29)

| UC    | What                             | Type                 | Trigger                 |
| ----- | -------------------------------- | -------------------- | ----------------------- |
| UC-19 | Auto-archive reviews             | Ongoing              | Session-end, >20 active |
| UC-20 | Prune stale Qodo suppressions    | Ongoing              | Session-start           |
| UC-21 | Sync SECURITY_CHECKLIST.md       | Ongoing              | Session-start           |
| UC-22 | Auto-generate FIX_TEMPLATE stubs | Ongoing              | Pattern promotion       |
| UC-23 | Triage VERIFIED DEBT             | Ongoing              | Session-start           |
| UC-24 | Fix archive overlaps/gaps        | One-time             | v2 build                |
| UC-25 | Correct Pattern #5/#13           | One-time             | v2 build                |
| UC-26 | Version-control Gemini config    | One-time + freshness | v2 build + ongoing      |
| UC-27 | Auto-trigger S1 escalation       | Ongoing              | Deferred item write     |
| UC-28 | Cross-doc auto-fix mode          | Ongoing              | Pre-commit gate         |
| UC-29 | Reconcile consolidation counter  | One-time             | v2 build                |

**Total decisions: 47** (Q1-Q20 + UC-1 through UC-29)

**Remaining manual steps after v2:**

- PR review intake (copy/paste — intentional, UC-20 note)
- `/pr-retro` invocation (manual trigger, but all downstream automated)
- Dashboard interaction (on-demand, interactive by design)
- ROADMAP/doc prose updates (prompted reminder at session-end)

### UC-30: Temporal Coverage Monitoring

**Context:** UC-10 covers document staleness (is this doc current?) but not
temporal data gaps (are there holes in our timeline?). The original 85% JSONL
data loss went undetected for months because nothing monitored whether data was
being written continuously. Staleness ≠ temporal coverage.

**Decision:** Three temporal coverage dimensions added to health monitoring and
dashboard.

**Dimension 1 — JSONL Temporal Continuity:**

Detects time-range gaps in JSONL files. If `reviews.jsonl` has no entries for

> 7 days during an active work period (commits exist but no reviews), flag as
> warning.

| Condition                                         | Signal                                                  |
| ------------------------------------------------- | ------------------------------------------------------- |
| No review entries for 7+ days AND commits exist   | "Silent data loss" warning — sync may be broken         |
| No review entries for 7+ days AND no commits      | Healthy — no work happening                             |
| No retro entries for 3+ PRs with reviews          | "Retro gap" warning — pr-retro not being run            |
| No deferred entries for 5+ reviews with deferrals | "Deferred tracking gap" — UC-8 auto-write may be broken |

**Feeds into:** Dashboard dimension #1 (data quality) as "temporal gaps"
sub-metric.

**Dimension 2 — Pattern "Last Seen" Tracking:**

Each pattern in CODE_PATTERNS.md tracks when it was last encountered in a review
(via JSONL pattern tags from Q14).

| Pattern Age | Interpretation                      | Dashboard Action                     |
| ----------- | ----------------------------------- | ------------------------------------ |
| <30 days    | Active — pattern still recurring    | Show recurrence count                |
| 30-60 days  | Fading — may be fixed or missed     | Show with "verify" prompt            |
| 60+ days    | Cold — likely fixed OR being missed | Flag for human judgment with context |

**Context enrichment:** When a pattern goes cold, dashboard cross-references
with git history — was there a fix commit? If yes, suggest marking pattern as
"resolved." If no, suggest verifying enforcement rule still works.

**Feeds into:** Dashboard dimension #2 (pipeline throughput) as "pattern
freshness."

**Dimension 3 — Pipeline Stall Alerting:**

Detects when pipeline stages stop producing output despite input existing.

| Pipeline Stage    | Stall Threshold       | Cross-Reference                                  |
| ----------------- | --------------------- | ------------------------------------------------ |
| Pattern promotion | 30 days no promotions | Check if new patterns discovered (input exists?) |
| Rule generation   | 45 days no new rules  | Check if promotions happened (input exists?)     |
| Consolidation     | 60 days no runs       | Check if review count exceeds threshold          |

**Key distinction:** "Healthy quiet" (no input → no output) vs "broken quiet"
(input exists → no output). Cross-referencing review activity with pipeline
output distinguishes the two.

**Feeds into:** Dashboard dimension #2 (pipeline throughput) as "pipeline
activity."

**Implementation:** All three dimensions are read-only analytics over existing
JSONL files + git history. No new data writes needed. Computed on-demand during
dashboard invocation and as part of session-start health summary.

---

### UC-31: Auto-Generate claude.md Anti-Pattern Table

**Context:** The full pipeline chain is now automated end-to-end EXCEPT the last
link: CODE_PATTERNS.md → claude.md Section 4 ("Critical Anti-Patterns"). The
"Top 5" table is manually curated and static. When new patterns get
auto-promoted and enforced, claude.md doesn't reflect the current top patterns.

**Decision:** Auto-generate claude.md Section 4 from CODE_PATTERNS.md ranked by
recurrence frequency. Completes the full automation chain.

**Full automated chain (v2):**

```
Reviews (JSONL-first)
  → Auto-archive (UC-19)
  → Recurrence detection from JSONL pattern tags (Q16)
  → Auto-promote to CODE_PATTERNS.md (Q20)
  → Auto-generate enforcement rule (Q16)
  → Auto-generate FIX_TEMPLATE stub (UC-22)
  → Auto-update claude.md Section 4 (UC-31)  ← NEW
```

**Mechanism:**

1. Runs as part of the promotion script (same trigger as Q20)
2. Queries CODE_PATTERNS.md for top 5 patterns by recurrence count
3. Regenerates the claude.md Section 4 table between marker comments:
   ```
   <!-- AUTO-GENERATED: top-patterns-start -->
   | Pattern | Rule |
   |---------|------|
   | ... | ... |
   <!-- AUTO-GENERATED: top-patterns-end -->
   ```
4. Only modifies the table rows — surrounding text preserved
5. Commit includes both CODE_PATTERNS.md and claude.md changes

**Marker comments** prevent accidental edits and make the auto-generated region
explicit. Manual additions go outside the markers.

**Staleness eliminated:** claude.md Section 4 can never drift from
CODE_PATTERNS.md because it's regenerated on every promotion.

### UC-32: Cross-Doc Gate Recalibration & Override Accountability

**Context:** Cross-doc dependency gate has 48.9% override rate (NG-4). 131 total
overrides logged but never analyzed (NG-14). UC-28 adds `--fix` mode for the
output side, but detection side is also broken — flags too many non-issues,
creating override muscle memory that bleeds into legitimate gates.

**Decision:** Four-part fix: recalibrate detection, analyze overrides, auto-flag
miscalibrated gates, graduate override costs.

**Part 1 — Cross-doc gate recalibration:**

| Fix                            | What                                                    | Impact                                            |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------- |
| `diffPattern` scoping          | Only check deps relevant to changed files               | Eliminates ~60% of false flags                    |
| Severity tiers                 | Split deps into blocking (security) vs advisory (docs)  | Advisory deps don't trigger overrides             |
| Auto-maintain dependency graph | Scan for broken refs, suggest removals, detect new deps | Stops stale graph from generating false positives |
| Path-based filtering           | `scripts/lib/*.js` changes don't require doc co-staging | Matches actual dependency reality                 |

**Updated dependency types:**

| Type            | Trigger                       | Response                        |
| --------------- | ----------------------------- | ------------------------------- |
| `blocking`      | Security docs, schema files   | Must co-stage or provide reason |
| `advisory`      | General docs, reference files | Warning in dashboard, no block  |
| `informational` | Loosely related docs          | Session-start summary only      |

**Part 2 — Override analytics (new dashboard dimension #13):**

Dashboard shows:

- Override rate per gate (rolling 30 days)
- Trend arrows (improving/worsening)
- Top overridden checks (which specific rules get skipped most)
- Repeated overrides (same person + same check + same file pattern =
  miscalibration signal)
- Override reasons word cloud (what reasons are users giving?)

**Feeds from:** `.claude/override-log.jsonl` (already exists, 131 entries)

**Part 3 — Auto-recalibration trigger:**

| Condition                                        | Action                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Gate override rate >25% for 2+ consecutive weeks | Auto-create warning: "Gate X may be miscalibrated"               |
| Gate override rate >40% for 1+ week              | Auto-downgrade gate from blocking to advisory until recalibrated |
| Gate override rate drops below 15% for 4+ weeks  | Candidate for upgrade back to blocking                           |

**Key principle:** If users consistently override a gate, the gate is wrong —
not the users. Auto-downgrade prevents override fatigue from spreading to
well-calibrated gates.

**Part 4 — Graduated override costs:**

| Gate Severity             | Override Mechanism                     | Dashboard Visibility                         |
| ------------------------- | -------------------------------------- | -------------------------------------------- |
| S0/S1 (security-critical) | Must type reason (>10 chars)           | Flagged prominently, reviewed at session-end |
| S2 (quality gates)        | One-click with auto-logged context     | Shown in override analytics                  |
| S3 (advisory)             | No override needed — notification only | Counted but not highlighted                  |

**Absorbs:** NG-14 (override log not analyzed) — now has full dashboard
dimension with trends and recalibration triggers.

**Target metrics after recalibration:**

| Gate               | Current Override Rate | Target           |
| ------------------ | --------------------- | ---------------- |
| cross-doc-deps     | 48.9%                 | <15%             |
| pattern-compliance | 16.0%                 | <10%             |
| audit-s0s1         | 15.3%                 | <10%             |
| code-reviewer      | 4.6%                  | <5% (keep as-is) |

### UC-33: Close ALL Cross-Document Sync Gaps

**Context:** User directive — close all cross-document sync gaps identified in
the diagnosis, not just the ones with individual UC decisions. This is a blanket
requirement.

**Decision:** Every cross-doc sync gap from the diagnosis (KG-9, NG-4) and any
discovered during v2 build must be resolved. No partial fixes.

**Known gaps from diagnosis to close:**

| Gap                                                | Source                 | Target                           | Fix                        |
| -------------------------------------------------- | ---------------------- | -------------------------------- | -------------------------- |
| 22 ESLint migrations not in SECURITY_CHECKLIST     | ESLint plugin rules    | SECURITY_CHECKLIST.md            | UC-21 auto-sync script     |
| Test mocking missing from SECURITY_CHECKLIST       | Test patterns          | SECURITY_CHECKLIST.md            | UC-21 auto-sync script     |
| CODE_PATTERNS count != compliance checker count    | CODE_PATTERNS.md (275) | check-pattern-compliance.js (43) | UC-3 enforcement expansion |
| FIX_TEMPLATES gaps for enforced patterns           | CODE_PATTERNS.md       | FIX_TEMPLATES.md                 | UC-22 auto-generate stubs  |
| claude.md Section 4 drift from CODE_PATTERNS       | CODE_PATTERNS.md       | claude.md                        | UC-31 auto-generate        |
| Qodo suppressions reference stale PRs              | PR history             | .qodo/pr-agent.toml              | UC-20 auto-prune           |
| Gemini config not version-controlled               | GitHub settings        | .gemini/                         | UC-26 in-repo config       |
| ROADMAP.md vs SESSION_CONTEXT.md priority mismatch | Both docs              | Each other                       | UC-28 auto-fix mode        |
| Pattern #5 falsely archived                        | Pattern history        | CODE_PATTERNS.md                 | UC-25 one-time fix         |
| Consolidation counter inconsistency                | State file             | Version history                  | UC-29 one-time fix         |
| Archive overlap/numbering collisions               | 3 archive files        | Each other                       | UC-24 one-time fix         |

**Enforcement principle:** After v2, no cross-doc sync gap should be possible
for auto-generated artifacts (they're generated from source of truth). For
manually-maintained docs, the recalibrated cross-doc gate (UC-32) + freshness
metadata (UC-10) + auto-fix mode (UC-28) form a three-layer prevention system.

**During v2 build:** If additional sync gaps are discovered, they are in-scope
and must be fixed — not deferred.

### UC-34: Effectiveness Metrics — Three Missing Dimensions

**Context:** Effectiveness is a primary metric across most tracked items in v2.
But three dimensions are unmeasured: skill effectiveness over time, automation
ROI, and learning capture quality.

**Decision:** Add all three. V2's JSONL-first architecture makes them measurable
for the first time.

**Dimension 1 — Skill Effectiveness Over Time:**

Track whether skills improve as the ecosystem matures.

| Metric                           | Formula                                  | Good       | Poor       |
| -------------------------------- | ---------------------------------------- | ---------- | ---------- |
| Issues per round (pr-review)     | Total items / rounds                     | Decreasing | Increasing |
| Pre-check catch rate             | Items caught by pre-checks / total items | ≥30%       | <10%       |
| First-round fix rate             | Items fixed in R1 / total items          | ≥70%       | <50%       |
| Retro action implementation rate | Implemented actions / total actions      | ≥70%       | <40%       |

**Source:** `reviews.jsonl` (per-round data), `retros.jsonl` (action tracking),
`invocations.jsonl` (skill usage frequency).

**Dashboard:** Trend lines showing skill metrics across sessions. "Is pr-review
getting better at catching things earlier?"

**Dimension 2 — Automation ROI:**

Track whether each automation saves more time than it costs to maintain.

| Metric                | How Measured                                                        |
| --------------------- | ------------------------------------------------------------------- |
| Gate execution time   | Timed during pre-commit/push (already budgeted in UC-11)            |
| Gate value (catches)  | Items caught by gate / total items found in review                  |
| Override cost         | Time spent overriding × override frequency                          |
| Maintenance incidents | Times a script needed fixing / total runs                           |
| Net value             | (Items caught × avg fix time) − (execution time + maintenance time) |

**Source:** `invocations.jsonl` (with timing data added to schema), override
log, gate output logs.

**Dashboard:** Per-automation ROI card. Green = pays for itself. Red = costs
more than it saves. Feeds directly into UC-11 principle: "Must pay for
themselves. If maintenance > value, cut it."

**Dimension 3 — Learning Capture Quality:**

Track whether captured learnings actually prevent recurrence.

| Metric                       | Formula                                                                       | Good | Poor |
| ---------------------------- | ----------------------------------------------------------------------------- | ---- | ---- |
| Learning prevention rate     | Patterns with learning that stopped recurring / total patterns with learnings | ≥60% | <30% |
| Learning-to-enforcement rate | Learnings that became enforcement rules / total learnings                     | ≥40% | <20% |
| Repeat despite learning      | Patterns recurring after learning captured                                    | <10% | >25% |

**Source:** `reviews.jsonl` (pattern tags + learnings field), CODE_PATTERNS.md
(enforcement status), pattern "last seen" tracking (UC-30).

**Dashboard:** "Did writing it down actually help?" Shows which learnings
converted to enforcement vs which are just documentation. Highlights patterns
that keep recurring despite having a learning entry — candidates for stronger
enforcement.

**All three feed into dashboard as sub-metrics of existing dimensions:**

- Skill effectiveness → dimension #3 (Review effectiveness)
- Automation ROI → dimension #4 (Gate & enforcement health)
- Learning quality → dimension #2 (Pipeline throughput)

### UC-35: Comprehensive Metrics Catalog & Composite Scoring System

**Context:** Effectiveness is a primary metric across most tracked items in v2.
Need a complete catalog of every metric with a weighted composite score that
gives a single "ecosystem health" number.

**Decision:** 57 individual metrics across 8 categories, weighted composite
score with letter grade, confidence integration, and trend tracking.

**8 Categories with weights:**

| Category               | Weight | Metric Count | Core Question                                      |
| ---------------------- | ------ | ------------ | -------------------------------------------------- |
| Review Effectiveness   | 20%    | 11           | Is the ecosystem improving code quality?           |
| Data Quality           | 15%    | 6            | Is our data reliable?                              |
| Pipeline Throughput    | 15%    | 8            | Are patterns flowing from discovery → enforcement? |
| Gate & Enforcement     | 15%    | 9            | Is enforcement catching things?                    |
| Deferred & DEBT Health | 10%    | 6            | Are issues resolving or accumulating?              |
| Document Health        | 10%    | 4            | Are docs reliable and current?                     |
| Session & Productivity | 10%    | 5            | Is the ecosystem lightweight?                      |
| Skill Effectiveness    | 5%     | 3            | Are skills improving over time?                    |

**Full metric list (57 metrics):**

**Cat 1 — Data Quality (15%):**

1. JSONL field completeness (non-null / total: ≥80% good, <60% poor)
2. Schema validation pass rate (valid / total: ≥98% good, <90% poor)
3. Completeness tier distribution (% full: ≥70% good, <50% poor)
4. Duplicate record rate (dupes / total: <1% good, >3% poor)
5. Temporal continuity (max gap days: <3 good, >7 poor)
6. Backfill coverage (backfilled / known: ≥80% good, <60% poor)

**Cat 2 — Pipeline Throughput (15%):** 7. Discovery rate (new patterns per 10
reviews: ≥3 good, 0 poor) 8. Promotion rate (promoted / discovered: ≥40% good,
<20% poor) 9. Enforcement rate (enforced / promoted: ≥60% good, <30% poor) 10.
Pipeline velocity (days discovery→enforcement: <14 good, >30 poor) 11. Rule
conversion rate (auto-generated / promotions: ≥80% good, <50% poor) 12. Pattern
freshness (seen in 60d / active: ≥70% good, <40% poor) 13. Pipeline stall score
(active stages / total: 100% good, <67% poor) 14. Learning-to-enforcement rate
(learnings→rules / total: ≥40% good, <20% poor)

**Cat 3 — Review Effectiveness (20%):** 15. Recurrence rate (recurring after
promotion: <10% good, >25% poor) 16. FP rate by source (rejected / total per
source: <15% good, >30% poor) 17. Churn ratio (avoidable rounds / total: <20%
good, >40% poor) 18. Fix-or-track rate (fixed or DEBT / total: ≥95% good, <80%
poor) 19. Deferred resolution rate (resolved / total deferred: ≥50% good, <20%
poor) 20. Round trend (avg rounds vs prior 30d: decreasing good, increasing
poor) 21. First-round fix rate (R1 fixes / total: ≥70% good, <50% poor) 22.
Learning capture rate (reviews w/ learnings / total: ≥80% good, <50% poor) 23.
Pattern yield (reviews w/ patterns / total: ≥70% good, <40% poor) 24. Retro
coverage (PRs w/ retros / PRs w/ reviews: ≥80% good, <50% poor) 25. Learning
prevention rate (stopped / total w/ learning: ≥60% good, <30% poor)

**Cat 4 — Gate & Enforcement Health (15%):** 26. Overall pattern coverage
(enforced / known: ≥55% good, <30% poor) 27. Pre-check catch rate (pre-check /
total issues: ≥30% good, <10% poor) 28. Override rate per gate (overrides /
runs: <10% good, >25% poor) 29. Override trend (rate vs prior 30d: decreasing
good, increasing poor) 30. Gate execution time (avg per gate: <3s good, >5s
poor) 31. Invocation compliance (required completed / required: ≥95% good, <80%
poor) 32. Hook failure rate (failed / total runs: <2% good, >5% poor) 33.
Automation ROI (value − cost: positive good, negative poor) 34. Gate
recalibration alerts (gates flagged: 0 good, >1 poor)

**Cat 5 — Deferred & DEBT Health (10%):** 35. Deferred item age median (days:
<14 good, >30 poor) 36. Deferred escalation rate (escalated / total: <10%
good, >25% poor) 37. Recurring deferral rate (2+ times / total: <5% good, >15%
poor) 38. DEBT resolution velocity (resolved per session: ≥5 good, <2 poor) 39.
DEBT stuck rate (VERIFIED >30d / total: <20% good, >40% poor) 40. DEBT
inflow/outflow ratio (new / resolved: <1.0 good, >1.5 poor)

**Cat 6 — Document Health (10%):** 41. Document freshness (verified / tracked:
≥90% good, <70% poor) 42. Cross-doc sync score (synced / total deps: ≥95% good,
<80% poor) 43. Archive integrity (clean ranges / total: 100% good, <90%
poor) 44. Auto-generated coverage (auto / total docs: ≥60% good, <40% poor)

**Cat 7 — Session & Productivity (10%):** 45. Items resolved per session
(ROADMAP items: ≥3 good, 0 poor) 46. Session-start time (total: <30s good, >45s
poor) 47. Session-end time (total: <20s good, >35s poor) 48. Warning queue size
(open at end: <5 good, >10 poor) 49. Warning resolution rate (resolved / opened:
≥1.0 good, <0.5 poor)

**Cat 8 — Skill Effectiveness (5%):** 50. Issues per round trend (rolling avg:
decreasing good, increasing poor) 51. Retro action impl rate (impl / total: ≥70%
good, <40% poor) 52. Skill failure rate (failed / total: <5% good, >10% poor)

**Composite scoring formula:**

Per-metric: 0-100 score (linear interpolation: Poor=0, Avg=50, Good=100)
Per-category: Equal-weighted average of member metrics Composite: Weighted sum
of category scores using weights above

**Letter grade mapping:**

| Score  | Grade | Meaning                                  |
| ------ | ----- | ---------------------------------------- |
| 90-100 | A     | Excellent — measurable value delivery    |
| 80-89  | B     | Good — most systems working              |
| 70-79  | C     | Adequate — functional, needs improvement |
| 60-69  | D     | Poor — significant gaps                  |
| <60    | F     | Failing — not delivering                 |

**Confidence integration (from UC-16):**

- Categories with LOW/INSUFFICIENT confidence shown but don't drag composite
  down until MEDIUM+ confidence reached
- Dashboard shows confidence level per category
- Metrics with INSUFFICIENT confidence (<40% field coverage) excluded from
  category average, flagged separately

**Trend tracking:**

- Composite score logged per session to `ecosystem-health-log.jsonl`
- Dashboard shows rolling trend, best/worst categories, biggest movers
- Session-start shows delta: "ECOSYSTEM HEALTH: B+ (83) ↑12 from last session"

**Dashboard display format:**

```
ECOSYSTEM HEALTH: B+ (83/100)                    ↑12 from last session

  Data Quality:        ████████░░  82  (HIGH confidence)
  Pipeline Throughput: ███████░░░  71  (MEDIUM confidence)
  Review Effectiveness:████████░░  85  (HIGH confidence)
  Gate & Enforcement:  █████████░  88  (HIGH confidence)
  Deferred & DEBT:     ██████░░░░  63  (MEDIUM confidence)  ⚠ trending down
  Document Health:     █████████░  91  (HIGH confidence)
  Session/Productivity:████████░░  84  (HIGH confidence)
  Skill Effectiveness: ███████░░░  72  (LOW confidence)

  Open warnings: 3 (1 escalates in 4 days)
  Metrics with INSUFFICIENT confidence: 2
```

**Current estimated grade:** D+ (from diagnosis) **Target:** B+ within 3 months,
A within 6 months

**Note:** 57 metrics listed but only 52 numbered above due to 5 metrics being
trend-based (computed from other metrics' history, not independent data points).
All 57 are computed and displayed; the catalog numbers are for reference.

### UC-36: Known Pattern Staleness Resolution & Lifecycle

**Context:** 13 known patterns, only 31% truly resolved (38% claimed but #5
falsely archived). 7 active patterns have no enforcement mechanism. No lifecycle
tracking, no anti-false-resolution, no auto-registration of new patterns.

**Decision:** Resolve all 7 active patterns with concrete enforcement, implement
pattern lifecycle tracking, and prevent false resolution.

**Part 1 — Enforcement for all 7 active patterns:**

| Pattern                     | Enforcement Mechanism                                                                                          | Type                        | Trigger        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------- |
| #6 FS Guard Lifecycle       | Semgrep rule: writeFileSync/renameSync without guard check                                                     | Automatic (pre-commit)      | Semgrep        |
| #7 Path Containment         | Semgrep rule: path operations without `path.relative()` containment                                            | Automatic (pre-commit)      | Semgrep        |
| #8 Algorithm Hardening      | Pre-check: functions with CC >10 and no test matrix warn before commit                                         | Automatic (pre-commit)      | Custom script  |
| #10 Stale Reviewer Comments | Auto-stale-HEAD detection in pr-review intake: compare reviewer commit against HEAD, auto-reject stale batches | Automatic (pr-review skill) | Skill plumbing |
| #11 Cross-Platform Path     | Semgrep rule: `includes`/`endsWith` on paths without `toPosixPath`                                             | Automatic (pre-commit)      | Semgrep        |
| #12 ChainExpression         | ESLint rule: `.type` access on AST nodes without `unwrapNode`                                                  | Automatic (pre-commit)      | ESLint         |
| #13 Fix-One-Audit-All       | Pre-commit grep: pattern-fixing commits trigger codebase search for same gap                                   | Automatic (pre-commit)      | Custom script  |

**Action model — two paths:**

1. **Automatic enforcement** — rules catch violations at commit time. Developer
   sees error, fixes before commit lands. No manual intervention.
2. **Dashboard investigation** — pattern health sub-view in `/ecosystem-health`
   shows all patterns with status, last seen, enforcement type, recurrence
   count. User drills into cold/recurring patterns and decides action.

**Part 2 — Pattern lifecycle tracking:**

```
Discovered → Active → Enforcement Added → Monitoring → Resolved
                 ↑                              │
                 └──── Recurring ←──────────────┘
```

Every pattern in CODE_PATTERNS.md gets structured metadata:

```markdown
<!-- pattern-meta:
  id: 13
  name: Fix-One-Audit-All
  status: enforcement_added
  discovered: 2026-02-24
  last_seen: 2026-02-28
  enforcement: [semgrep:fix-one-audit-all, pre-commit:grep-propagation]
  recurrence_count: 4
  resolution_blocked_by: "still recurring"
-->
```

**Part 3 — Anti-false-resolution rules:**

A pattern can only move to "Resolved" if ALL three conditions met:

1. Enforcement rule exists
2. Zero recurrences in last 60 days
3. Pattern "last seen" (UC-30) confirms it's cold

Otherwise stays "Active" or "Monitoring." Prevents the #5 situation.

Attempted false resolution (marking resolved without meeting criteria) → warning
in `warnings.jsonl` with context.

**Part 4 — Pattern health in dashboard:**

Sub-view under dimension #2 (Pipeline Throughput):

- All patterns listed with current lifecycle status
- Color-coded: green (resolved), yellow (monitoring), red (active/recurring)
- Last seen date + days since
- Enforcement mechanism (or "NONE" in red)
- Recurrence count + trend
- Action prompts: "Verify resolution", "Add enforcement", "Investigate
  recurrence"

**Part 5 — New pattern auto-registration:**

When pr-review or pr-retro identifies a recurring pattern (seen in 2+ reviews):

1. Auto-check CODE_PATTERNS.md for existing entry
2. If not found → auto-create entry with `status: "discovered"`, zero
   enforcement
3. Promotion pipeline (Q16/Q20) picks it up for rule generation
4. Dashboard shows "N newly discovered patterns awaiting enforcement"

### UC-37: Test & Health Monitoring Invocation Architecture

**Context:** V2 has two fundamentally different validation needs: code
correctness (deterministic, fixtures) and data quality (live data, runtime).
Need clear invocation points for both.

**Decision:** Two separate npm pipelines with defined triggers and budgets.

**Pipeline 1 — Code Correctness (`npm test`, Jest):**

| Test Type      | Count | What                             |
| -------------- | ----- | -------------------------------- |
| Existing tests | ~330  | Current test suite               |
| Contract tests | 7 new | Data handoff validation (UC-14)  |
| E2E smoke test | 1 new | Full pipeline round-trip (UC-14) |
| **Total**      | ~338  | All deterministic, fixture-based |

**Pipeline 2 — Data Health (`npm run health`, custom scripts):**

| Check               | Command                       | What                                 |
| ------------------- | ----------------------------- | ------------------------------------ |
| Schema validation   | `npm run health:validate`     | All JSONL records pass Zod           |
| Completeness audit  | `npm run health:completeness` | Field coverage, tier distribution    |
| Duplicate detection | `npm run health:duplicates`   | Duplicate IDs across all JSONL       |
| Temporal continuity | `npm run health:temporal`     | Gaps vs commit activity (UC-30)      |
| Warning queue       | `npm run health:warnings`     | Open/escalating/stale warnings       |
| Override analysis   | `npm run health:overrides`    | Rate trends, recalibration (UC-32)   |
| Pattern staleness   | `npm run health:patterns`     | Last-seen, cold patterns (UC-36)     |
| Pipeline stall      | `npm run health:pipeline`     | Stages with no recent output (UC-30) |
| Cross-doc sync      | `npm run health:crossdoc`     | Dependency drift (UC-33)             |
| Composite score     | `npm run health:score`        | Full 57-metric scoring (UC-35)       |
| **All checks**      | `npm run health`              | Runs all above                       |
| **Quick checks**    | `npm run health:quick`        | Top 5 critical only                  |

**Invocation matrix:**

| Trigger                | What Runs                          | Budget       | Auto/Manual               |
| ---------------------- | ---------------------------------- | ------------ | ------------------------- |
| Pre-commit             | Jest contract tests only           | <10s (UC-11) | Automatic                 |
| `npm test`             | Full Jest suite (338 tests)        | No budget    | Manual / CI               |
| `npm run health:quick` | Top 5 health checks                | <5s          | Automatic (session-start) |
| `npm run health`       | All 10 health checks               | <15s         | Manual / CI               |
| `npm run health:score` | Composite score + log              | <5s          | Automatic (session-end)   |
| Session-start          | `health:quick` (within 30s budget) | <5s          | Automatic                 |
| Session-end            | `health:score` (within 20s budget) | <5s          | Automatic                 |
| `/ecosystem-health`    | `health` + interactive dashboard   | <15s compute | Manual (on-demand)        |
| CI (GitHub Actions)    | `npm test` + `npm run health`      | Full suite   | Automatic (every PR)      |

**Composite score persistence:**

- `npm run health:score` computes all 57 metrics and appends to
  `ecosystem-health-log.jsonl`
- Session-end auto-runs it (within budget)
- Dashboard reads log for trend display and delta calculation
- Format: `{ session, date, composite, categories: {...}, confidence: {...} }`

**`health:quick` — the 5 critical checks (session-start):**

1. Schema validation (catches broken writes immediately)
2. Duplicate detection (catches dedup failures)
3. Temporal continuity (catches silent data loss — the original root problem)
4. Warning queue summary (surfaces escalating items)
5. Composite score delta (quick: "score dropped 8 points since last session")

**Dashboard as manual action center:**

The `/ecosystem-health` dashboard is the manual investigation and action
interface. Every health check result is drillable:

- Red metric → drill into details → see specific failing records/patterns
- Action prompts on every issue ("Run: `npm run health:validate --fix`")
- Pattern health sub-view (UC-36) for lifecycle management
- Override analytics (UC-32) for gate recalibration decisions
- Warning queue (UC-12) for triage and resolution

### UC-38: Complete Test Catalog — Every Script Mapped

**Context:** UC-14 covers 7 contract tests + 1 E2E for new v2 data pipeline
scripts. But 9 existing kept/enhanced scripts and ~14 new v2 scripts have no
test coverage in any decision. The diagnosis identified 14 scripts needing
tests; some are eliminated/rewritten in v2 but the kept ones still need
coverage.

**Decision:** Complete test catalog for every script in the v2 ecosystem. No
untested scripts. Organized by priority tier.

**Tier 1 — v2 Data Pipeline (from UC-14, already decided):**

| Test File                      | Script                         | Type     |
| ------------------------------ | ------------------------------ | -------- |
| review-write.test.js           | Skill JSONL write path         | Contract |
| deferred-write.test.js         | Auto-deferred-item creation    | Contract |
| promotion-input.test.js        | Promotion reads JSONL          | Contract |
| promotion-output.test.js       | Promotion writes CODE_PATTERNS | Contract |
| effectiveness-input.test.js    | Effectiveness analyzer         | Contract |
| enforcement-generation.test.js | Auto-rule generation           | Contract |
| markdown-render.test.js        | JSONL→markdown renderer        | Contract |
| pipeline-e2e.test.js           | Full round-trip smoke test     | E2E      |

**Count: 8 test files (already planned)**

**Tier 2 — Kept/Enhanced v1 Scripts (P1, from diagnosis catalog):**

| Test File                 | Script                  | Type       | Why Critical                                            |
| ------------------------- | ----------------------- | ---------- | ------------------------------------------------------- |
| cross-doc-deps.test.js    | check-cross-doc-deps.js | Regression | 48.9% override — recalibration must not break detection |
| sync-sonarcloud.test.js   | sync-sonarcloud.js      | Contract   | Zero tests, API change breaks silently                  |
| check-propagation.test.js | check-propagation.js    | Regression | Pre-push gate, false negatives miss gaps                |

**Count: 3 test files**

**Tier 3 — Kept/Enhanced v1 Scripts (P2-P3):**

| Test File                    | Script                  | Type        | Why Needed                                            |
| ---------------------------- | ----------------------- | ----------- | ----------------------------------------------------- |
| session-start-hook.test.js   | session-start.js        | Integration | Orchestrates 5+ operations, new health checks added   |
| post-write-validator.test.js | post-write-validator.js | Regression  | 10 sub-validators, any breakage = silent bad writes   |
| log-override.test.js         | log-override.js         | Contract    | Audit trail format must be stable for UC-32 analytics |
| check-review-needed.test.js  | check-review-needed.js  | Threshold   | Drives GitHub workflow label assignment               |
| assign-review-tier.test.js   | assign-review-tier.js   | Threshold   | Drives GitHub workflow tier labels                    |
| commit-tracker.test.js       | commit-tracker.js       | Contract    | Feeds review dependency detection                     |

**Count: 6 test files**

**Tier 4 — New v2 Automation Scripts:**

| Test File                       | Script (from UC)                      | Type     | What to Test                                                   |
| ------------------------------- | ------------------------------------- | -------- | -------------------------------------------------------------- |
| prune-qodo.test.js              | prune-qodo-suppressions.js (UC-20)    | Logic    | Staleness detection, age calculation, comment-out logic        |
| sync-security-checklist.test.js | sync-security-checklist.js (UC-21)    | Contract | ESLint rule diff, stub generation, removal flagging            |
| auto-fix-templates.test.js      | FIX_TEMPLATE generator (UC-22)        | Contract | Stub content, TODO marker, trigger on promotion                |
| triage-debt.test.js             | triage-verified-debt.js (UC-23)       | Logic    | Auto-resolve, auto-FP, escalation, age calculation             |
| fix-archive-overlaps.test.js    | fix-archive-overlaps.js (UC-24)       | One-time | Dedup logic, gap fill, numbering collision resolution          |
| pattern-lifecycle.test.js       | Pattern lifecycle tracker (UC-36)     | Logic    | Status transitions, anti-false-resolution rules                |
| auto-registration.test.js       | Pattern auto-registration (UC-36)     | Contract | Duplicate detection, CODE_PATTERNS entry creation              |
| unified-invocation.test.js      | Unified invocation tracker (UC-9)     | Contract | Skill + agent + hook tracking, schema validation               |
| cross-doc-autofix.test.js       | Cross-doc --fix mode (UC-28)          | Logic    | Mechanical fixes correct, semantic drift untouched             |
| s1-escalation.test.js           | S1 auto-escalation (UC-27)            | Logic    | 2+ deferral detection, DEBT creation, warning creation         |
| claude-md-autogen.test.js       | claude.md Section 4 generator (UC-31) | Contract | Marker detection, table generation, surrounding text preserved |
| override-analytics.test.js      | Override analytics (UC-32)            | Logic    | Rate calculation, trend detection, recalibration trigger       |

**Count: 12 test files**

**Tier 5 — Health Monitoring Scripts (UC-37):**

| Test File                   | Health Check            | Type        | What to Test                                   |
| --------------------------- | ----------------------- | ----------- | ---------------------------------------------- |
| health-validate.test.js     | Schema validation sweep | Contract    | Catches invalid records, reports correctly     |
| health-completeness.test.js | Completeness audit      | Logic       | Field coverage calc, tier distribution         |
| health-duplicates.test.js   | Duplicate detection     | Logic       | Cross-file dedup, ID collision detection       |
| health-temporal.test.js     | Temporal continuity     | Logic       | Gap detection, commit cross-reference          |
| health-warnings.test.js     | Warning queue           | Contract    | Escalation date calc, status transitions       |
| health-overrides.test.js    | Override analysis       | Logic       | Rate calc, trend arrows, recalibration flag    |
| health-patterns.test.js     | Pattern staleness       | Logic       | Last-seen calc, cold detection                 |
| health-pipeline.test.js     | Pipeline stall          | Logic       | Stall threshold, healthy-quiet vs broken-quiet |
| health-crossdoc.test.js     | Cross-doc sync          | Contract    | Drift detection accuracy                       |
| health-score.test.js        | Composite score         | Integration | All 57 metrics, weight calc, confidence, grade |

**Count: 10 test files**

**Grand Total:**

| Tier      | Description              | Test Files        |
| --------- | ------------------------ | ----------------- |
| Tier 1    | v2 data pipeline (UC-14) | 8                 |
| Tier 2    | Kept v1 scripts (P1)     | 3                 |
| Tier 3    | Kept v1 scripts (P2-P3)  | 6                 |
| Tier 4    | New v2 automation        | 12                |
| Tier 5    | Health monitoring        | 10                |
| **Total** |                          | **39 test files** |

**Added to existing 330 tests → estimated ~370-400 total tests.**

**Test execution tiers (matching UC-37 invocation):**

| Trigger             | Which Tiers Run              | Budget     |
| ------------------- | ---------------------------- | ---------- |
| Pre-commit          | Tier 1 only (contract)       | <10s       |
| `npm test`          | Tiers 1-4 (all code tests)   | Full suite |
| `npm run health`    | Tier 5 (health on real data) | <15s       |
| CI (GitHub Actions) | All tiers                    | No budget  |

**Build order:** Tier 1 first (during v2 data pipeline build), then Tier 4
(alongside each new script), then Tier 2-3 (existing scripts), then Tier 5
(after health system built). Tests written alongside the code they validate —
never after.

### UC-39: One-Time Cleanup — Duplicate DEBT Pairs (NG-5)

**Context:** 7 duplicate DEBT entry pairs from pr-retro (DEBT-2236/10673,
DEBT-2364/10798, etc.). Future dupes prevented by UC-17 JSONL-first retro, but
existing pairs need cleanup.

**Decision:** One-time dedup script during v2 build.

**Logic:**

- Identify 7 known duplicate pairs by matching description + source PR
- Keep the older entry (lower DEBT ID)
- Mark newer entry as `FALSE_POSITIVE` with reason: "Duplicate of DEBT-XXXX"
- Also write to `raw/deduped.jsonl` (dual-write rule from MEMORY.md)

**Verification:** Run `health:duplicates` after cleanup to confirm zero dupes.

### UC-40: One-Time Cleanup — Retro Arithmetic Mismatches (NG-6)

**Context:** 4 retros have `fixed + rejected + deferred < total_items` with up
to 63 items unaccounted. Future mismatches prevented by UC-17 structured schema.
Existing mismatches need investigation and tagging.

**Decision:** During backfill (Q2), tag affected retros appropriately.

**Logic:**

- Identify the 4 retros with arithmetic gaps
- Investigate: are unaccounted items partially addressed, withdrawn, or
  uncategorized? (Most likely: items marked "acknowledged" or "noted" without
  fix/reject/defer classification — a v1 pr-review protocol gap)
- Tag with `completeness: "partial"` and
  `completeness_missing: ["item_categorization"]`
- Add `arithmetic_gap: N` field to retro record for transparency
- Dashboard shows these as partial records with explanation, not errors

**No retroactive fix attempted** — we can't reconstruct categorization for items
from months ago. Honest labeling is the correct approach.

### UC-41: One-Time Authoring — 3 Missing Security FIX_TEMPLATES (NG-9)

**Context:** SSRF, defense-in-depth, and git pathspec magic are documented
security patterns with no FIX_TEMPLATE guidance. UC-22 auto-generates stubs
going forward, but these 3 need full templates NOW — they're high-value security
patterns referenced in reviews.

**Decision:** Author 3 complete FIX_TEMPLATES during v2 build (not stubs).

**Templates to create:**

| Template                              | Pattern                                     | Key Content                                                                                |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| FIX_TEMPLATE #35: SSRF Prevention     | Server-side URL fetching without validation | URL allowlist pattern, hostname validation, private IP blocking, redirect following limits |
| FIX_TEMPLATE #36: Defense-in-Depth    | Single-layer security checks                | Layered validation pattern: input validation + business logic check + output encoding      |
| FIX_TEMPLATE #37: Git Pathspec Safety | `git` commands with user-influenced paths   | `--` separator, pathspec sanitization, `git -c` safe config, glob escaping                 |

**Format:** Follow existing FIX_TEMPLATES.md structure — violation example, fix
example, explanation, edge cases.

**Verification:** After authoring, run freshness check to confirm every enforced
pattern has a corresponding template (UC-22 ongoing check).

### Gap Coverage — NG-11 (Skill Sprawl): Intentionally Deferred

**Decision:** User explicitly chose not to address skill sprawl (27
review-related skills, S3 severity). Low maintenance burden, low impact.
Recorded as intentional deferral, not an oversight.

---

**Gap Catalog Final Scorecard:**

|                       | Fully Addressed | Intentionally Deferred | Total              |
| --------------------- | --------------- | ---------------------- | ------------------ |
| Known (KG-1 to KG-13) | 13              | 0                      | 13                 |
| New (NG-1 to NG-14)   | 13              | 1 (NG-11)              | 14                 |
| **Total**             | **26**          | **1**                  | **27**             |
| **Coverage**          | **96%**         | **4% (by choice)**     | **100% accounted** |

### UC-42: Continuous Testing & Documentation Maintenance During Build

**Context:** User directive — testing must be immense, happen throughout the
build process (not just at the end), and all dependencies/referenced/linked/
associated docs must be updated as we go.

**Decision:** Two mandates that apply to EVERY phase of the v2 build.

**Mandate 1 — Test-alongside, not test-after:**

| Build Step                | Testing Required Before Moving On                            |
| ------------------------- | ------------------------------------------------------------ |
| Write a new script        | Write its test file in the same commit                       |
| Modify an existing script | Update/create test in the same commit                        |
| Create a JSONL schema     | Write Zod validation test + fixture files                    |
| Wire a new automation     | Write integration test verifying trigger→output              |
| Build a health check      | Write test with known-good and known-bad fixtures            |
| Build dashboard dimension | Write test verifying metric calculation correctness          |
| Complete a phase          | Run full `npm test` + `npm run health` before phase sign-off |

**No script lands without its test.** This is not a suggestion — it's a gate. If
a commit adds a `.js` file in `scripts/reviews/` without a corresponding
`.test.js` file, the PR review flags it as incomplete.

**Testing cadence during build:**

| Frequency              | What Runs                             | Purpose                    |
| ---------------------- | ------------------------------------- | -------------------------- |
| Every commit           | Jest contract tests for changed files | Immediate regression catch |
| Every phase completion | Full `npm test` (all tiers)           | Cross-phase regression     |
| Every phase completion | `npm run health` on real data         | Data quality verification  |
| Every 3rd phase        | Full E2E smoke test                   | Pipeline integration check |
| Before final sign-off  | All tests + health + manual smoke     | Complete validation        |

**Mandate 2 — Update docs as you go, not after:**

Every commit that changes behavior must also update affected docs in the SAME
commit. Not in a follow-up. Not in a docs phase. In the same commit.

**Doc update checklist per commit:**

| If You Changed...        | Update These                                                               |
| ------------------------ | -------------------------------------------------------------------------- |
| A script's behavior      | Its JSDoc, any referencing skill, README if applicable                     |
| A JSONL schema           | Zod schema file, any consuming script's comments, dashboard dimension docs |
| A skill's protocol       | The skill .md file, SLASH_COMMANDS_REFERENCE.md                            |
| A hook's behavior        | Hook comments, TRIGGERS.md if applicable                                   |
| A gate's thresholds      | Gate docs, AI_REVIEW_PROCESS.md if referenced                              |
| CODE_PATTERNS.md         | claude.md auto-updates (UC-31), FIX_TEMPLATES check (UC-22)                |
| Any cross-doc dependency | Run `npm run health:crossdoc` before committing                            |

**Enforcement:** Cross-doc gate (UC-32, recalibrated) catches doc drift at
commit time. `diffPattern` scoping ensures only relevant docs are flagged — not
everything.

**Phase-level doc gates:**

| Phase Milestone | Doc Verification                                      |
| --------------- | ----------------------------------------------------- |
| Phase start     | Read relevant existing docs, note what needs updating |
| Phase complete  | Run `npm run health:crossdoc`, verify zero drift      |
| Phase sign-off  | All referenced docs verified current                  |

**This decision supersedes any "docs phase" in the build plan.** There is no
separate documentation phase. Docs are maintained continuously as a property of
every commit.

---

**DISCOVERY PHASE COMPLETE**

Total decisions: **60** (Q1-Q20 + UC-1 through UC-42 + 1 intentional deferral)

All 27 diagnosis gaps accounted for (26 addressed, 1 deferred by choice).

Ready for plan compilation via GSD project.

---

**Status:** Discovery complete. User has no more questions. Ready for Phase 3
(plan compilation) and Phase 4 (approval).

---

**Status:** User reviewing PR_ECOSYSTEM_DIAGNOSIS.md. Recording decisions as
they arise.
