# Automation Gap Closure — Design Spec

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Date:** 2026-03-14 **Status:** APPROVED **Context:** Data Effectiveness Audit
(PR #431) left 21 scaffolded routes unrefined, 5 scripts unwired, and a "hybrid"
approach (D14) that contradicted the audit's own "AUTOMATION ALWAYS" principle
(D9, Overarching Principle #2).

---

## Problem Statement

The Data Effectiveness Audit correctly identified gaps and built infrastructure,
but:

1. **21 scaffolded routes** in `learning-routes.jsonl` have TODO markers and
   never progressed past `"scaffolded"` status
2. **5 scripts** (`ratchet-baselines.js`, `verify-enforcement.js`,
   `route-lifecycle-gaps.js`, `route-enforcement-gaps.js`,
   `generate-lifecycle-scores-md.js`) exist with tests but are manual-invocation
   only
3. **D14's "hybrid" approach** ("script scaffolds, AI refines") introduced a
   manual step that violated D9 ("auto-learnings must become AUTOMATED CHANGES,
   not human acknowledgment") and Overarching Principle #2 ("AUTOMATION ALWAYS —
   manual processes are a bug")

The plan explicitly specified wiring for some of these (Wave 6.3: "Wire
`ratchet-baselines.js` into session-start", Wave 9.3: "Wire
`verify-enforcement.js` into session-start and /alerts") but this was never
implemented.

---

## Decisions (from Brainstorming)

| #   | Question                                 | Decision                                                                  |
| --- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Q1  | How to close scaffold→enforcement gap    | **Auto-refinement script** post-scaffolding (not smarter router)          |
| Q2  | Where to wire orphaned scripts           | **4 scripts to session-start**, 1 post-audit only                         |
| Q3  | Promotion gate for scaffolds             | **Confidence-tiered**: high=auto-enforce, low=refined+alert               |
| Q4  | Action required for low-confidence items | **Fix-or-DEBT**: approve, edit+approve, or DEBT item. No silent dismissal |
| Q5  | Existing 21 scaffolded routes            | **Retroactively process all 21** through the new pipeline                 |

**Approach chosen:** Two-Layer Addition (Classifier + Refiner) — clean
separation of confidence classification logic from refinement/promotion logic.

---

## New Files

### 1. `scripts/lib/confidence-classifier.js`

Pure function library. Takes a scaffolded route entry, returns confidence level
and rationale.

**Function signature:**

```javascript
function classify(entry) → { confidence: 'high' | 'low', reason: string, action: object }
```

**Classification rules (priority order):**

1. `type === "code"` AND pattern contains "unbounded" or "no rotation" →
   **high** (action: add to rotation config)
2. `type === "code"` AND pattern maps to existing verified-pattern → **high**
   (action: update regex in verified-patterns.json, using the
   `verified-patterns.json` schema:
   `{ id, anti_pattern, positive_pattern_ref, enforcement, severity }` — NOT the
   router's scaffold schema)
3. `type === "behavioral"` → always **low** (reason: proxy metrics need human
   judgment on measurement approach)
4. `type === "process"` AND the learning's _subject system_ already has an
   existing consumer script in `scripts/` (e.g., the JSONL file the gap
   describes has a known reader) → **high** (action: extend that consumer with
   enforcement logic). Note: this checks the subject of the gap, NOT whether the
   scaffolded hook target file exists (it won't — that's what we're creating).
5. `type === "process"` otherwise → **low** (reason: enforcement target is
   ambiguous)

**Applied to existing 21 entries:**

- **High confidence (2 entries):**
  - `3689cfd62f77` — code: Audit Findings: unbounded, no rotation → add to
    rotation
  - `eaa8292230ef` — code: Aggregation Data: unbounded pipeline artifacts → add
    to rotation

- **Low confidence (19 entries):**
  - 10 behavioral (CLAUDE.md annotations — all need human judgment)
  - 9 process (hook gate stubs — enforcement target is ambiguous)

### 2. `scripts/refine-scaffolds.js`

Action script. Reads all `"scaffolded"` entries from `learning-routes.jsonl`,
runs each through the classifier, then:

- **High confidence:** Generates functional enforcement code (fills TODOs with
  real regex/logic), writes to target file, updates `learning-routes.jsonl`
  status to `"enforced"`. MUST also populate `enforcement_test` (path to a
  generated test file) and `metrics` (initial violation count snapshot) on the
  entry — without these, `verify-enforcement.js` will skip the entry and it will
  never reach `"verified"`.
- **Low confidence:** Generates best-effort enforcement code, updates status to
  `"refined"`, writes entry to `pending-refinements.jsonl` for `/alerts` to
  surface

### 3. `.claude/state/pending-refinements.jsonl` (created at runtime)

Queue for low-confidence items awaiting fix-or-DEBT resolution.

**Schema per entry:**

```json
{
  "id": "matches learning-routes entry id",
  "route_type": "claude-md-annotation | hook-gate | verified-pattern | lint-rule",
  "pattern": "description of the gap",
  "generated_code": "best-effort enforcement code",
  "confidence": "low",
  "reason": "why this needs human judgment",
  "surfaced_count": 0,
  "created": "ISO timestamp"
}
```

---

## Session-Start Wiring

Four scripts added to `session-start.js` after the existing `rotate-jsonl.js`
block (insert before the `seed-commit-log.js` block), in dependency order:

```
session-start.js execution order:
  ... (existing: deps, build, patterns, consolidation, archive, rotate-jsonl) ...
  1. route-lifecycle-gaps.js      — discover gaps → new scaffolded entries
  2. route-enforcement-gaps.js    — discover gaps → new scaffolded entries
  3. refine-scaffolds.js (NEW)    — scaffolded → enforced or refined
  4. verify-enforcement.js        — enforced → verified, or demote to scaffolded
  5. ratchet-baselines.js         — tighten violation thresholds
```

**Execution order matters:** gaps → refine → verify → ratchet. Each feeds the
next.

All non-fatal (won't block session start), with try/catch and timeouts matching
existing pattern (~10-20s each). Total worst-case: ~50-80s. Idle runs (no new
gaps, all entries verified): <2s each.

**`ratchet-baselines.js` exit code handling:** This script calls
`process.exit(1)` when violations have regressed above baseline. When wired via
`execFileSync`, this throws and triggers the catch block. The session-start
wiring MUST pass `--check-only` flag (to be added to ratchet-baselines.js) which
reports regressions to stderr but exits 0. Actual enforcement (blocking on
regression) happens via the pre-commit hook, not session-start. Session-start
ratchets DOWN only — it should never block.

**`generate-lifecycle-scores-md.js`** is NOT wired to session-start. It only
runs after the `data-effectiveness-audit` skill is invoked (it's a view
generator, not an enforcement mechanism).

---

## Alerts Integration (Fix-or-DEBT)

**Modified file:** `.claude/skills/alerts/scripts/run-alerts.js`

`run-alerts.js` already reads `learning-routes.jsonl` (in the
`checkEnforcementVerification()` function). Extend it by adding a new
`checkPendingRefinements()` function after `checkEnforcementVerification()` that
reads `pending-refinements.jsonl`.

For each pending item, surface with generated code visible and require one of:

1. **Approve** → promotes to `"enforced"` in learning-routes, removes from
   pending
2. **Edit + Approve** → user modifies the code, then promotes
3. **DEBT** → creates entry in `MASTER_DEBT.jsonl` AND `raw/deduped.jsonl` (per
   critical bug: generate-views.js overwrites MASTER_DEBT), removes from
   pending, marks route as `"deferred"` with deadline

**No silent dismissal.** If `/alerts` runs and pending refinements exist, they
must be resolved before the alert section completes.

**Escalation:** `surfaced_count` increments each time `/alerts` shows the item.
Items surfaced 3+ times without action trigger automatic DEBT creation: a
MASTER_DEBT.jsonl entry is auto-created at S1 severity with a 7-day deadline,
the pending-refinements entry is removed, and the learning-routes entry is
marked `"deferred"`. This prevents the "wallpaper" problem — items that sit
unresolved get actioned automatically rather than just displayed more
prominently.

---

## Status Lifecycle & Data Flow

### Full Lifecycle Map

```
scaffolded ──→ [confidence-classifier] ──→ HIGH ──→ enforced ──→ [verify-enforcement] ──→ verified
                                           │                            │
                                           │                      (verify fails)
                                           │                            │
                                           │                     demote to scaffolded
                                           │                     (re-enters pipeline
                                           │                      next session)
                                           │
                                           └──→ LOW ──→ refined ──→ pending-refinements.jsonl
                                                                         │
                                                                    /alerts surfaces
                                                                    (fix-or-DEBT)
                                                                    │        │
                                                                 approve    DEBT
                                                                    │        │
                                                                enforced   deferred
                                                                    │        │
                                                            (re-enters    MASTER_DEBT.jsonl
                                                             verify       (with deadline)
                                                             pipeline)
```

### Per-Session Data Flow

```
session-start
  ├─ rotate-jsonl.js             (existing — clean up old data)
  ├─ route-lifecycle-gaps.js     (discover gaps → scaffolded entries)
  ├─ route-enforcement-gaps.js   (discover gaps → scaffolded entries)
  ├─ refine-scaffolds.js         (NEW — scaffolded → enforced or refined)
  ├─ verify-enforcement.js       (enforced → verified, or demote)
  └─ ratchet-baselines.js        (tighten violation thresholds)

/alerts (user-invoked skill)
  ├─ reads pending-refinements.jsonl
  ├─ surfaces low-confidence items with generated code
  └─ requires: approve / edit+approve / DEBT

learning-routes.jsonl            (single source of truth for all statuses)
pending-refinements.jsonl        (queue for low-confidence items needing action)
```

### File Impact Summary

**Files created:**

- `scripts/lib/confidence-classifier.js` — classification logic
- `scripts/refine-scaffolds.js` — refinement action script
- `.claude/state/pending-refinements.jsonl` — runtime queue (auto-created)

**Files modified:**

- `.claude/hooks/session-start.js` — add 4 `execFileSync` calls after
  rotate-jsonl
- `.claude/skills/alerts/scripts/run-alerts.js` — add
  `checkPendingRefinements()` function + fix-or-DEBT gate
- `scripts/lib/learning-router.js` — update dedup logic in `route()` to treat
  `"refined"` and `"deferred"` as "in-pipeline" statuses (skip, don't
  re-scaffold). Without this fix, `route-lifecycle-gaps.js` re-running in
  subsequent sessions would create duplicate entries for patterns already at
  `"refined"` status, causing unbounded growth of `learning-routes.jsonl`.
- `scripts/reviews/lib/schemas/learning-route.ts` — add `"deferred"` to the
  status enum:
  `z.enum(["scaffolded", "refined", "enforced", "verified", "deferred"])`.
  Without this, the DEBT path writing `status: "deferred"` will fail schema
  validation.
- `scripts/ratchet-baselines.js` — add `--check-only` flag that reports
  regressions to stderr but exits 0 (for session-start context where blocking is
  inappropriate)

**Files unchanged but consumed differently:**

- `.claude/state/learning-routes.jsonl` — status field now actively progresses
  (was always "scaffolded")
- `.claude/state/known-debt-baseline.json` — ratchet-baselines now runs every
  session
- `scripts/config/verified-patterns.json` — high-confidence code routes write
  here
- `docs/technical-debt/MASTER_DEBT.jsonl` — DEBT path writes here
- `docs/technical-debt/raw/deduped.jsonl` — DEBT path also writes here (critical
  bug fix)

---

## Governing Principles

Inherited from the original Data Effectiveness Audit, with D14 corrected:

1. **No passive surfacing** — all data surfaces must require action
2. **AUTOMATION ALWAYS** — manual processes are a bug (D14 hybrid approach
   replaced with automated refinement)
3. **Actionable = automated enforcement**, not human acknowledgment
4. **Fix-or-DEBT** — no silent dismissal of low-confidence items
5. **Escalation on inaction** — surfaced_count tracks wallpaper risk,
   auto-escalates at 3+

---

## Testing Requirements

Each new file needs tests:

- `confidence-classifier.test.js` — unit tests for all 5 classification rules,
  edge cases (unknown types, missing fields)
- `refine-scaffolds.test.js` — integration tests: mock learning-routes.jsonl
  with mixed entries, verify correct status transitions and file writes
- Extend existing `run-alerts.test.js` (if exists) or create new test for
  pending-refinements surfacing logic

Existing tests for `ratchet-baselines.js`, `verify-enforcement.js`,
`route-lifecycle-gaps.js`, and `route-enforcement-gaps.js` should continue
passing without modification (wiring is additive).

---

## Success Criteria

1. **Zero `"scaffolded"` entries remain** in learning-routes.jsonl after first
   run — all 21 promoted to either `"enforced"` or `"refined"`. Note:
   `"enforced"` entries won't reach `"verified"` until `verify-enforcement.js`
   runs in a subsequent session with populated `enforcement_test`/`metrics`
   fields — this is expected behavior, not a failure.
2. **5 scripts wired to automation** — 4 in session-start, 1 in audit skill
3. **No manual invocation required** for any enforcement pipeline step
4. **Low-confidence items surface in `/alerts`** with fix-or-DEBT gate
5. **Escalation works** — surfaced_count increments, S1 at 3+
6. **Session-start time increase < 30s** for idle runs (no new gaps)
7. **All existing tests pass** — no regressions from wiring changes

---

## Spec Review Findings (Resolved)

Code review identified 3 blockers, 5 warnings, 3 nits. All resolved in this
version:

| #   | Severity | Issue                                                                                                            | Resolution                                                                                        |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Blocker  | `learning-router.js` dedup skips `"scaffolded"` and `"enforced"` but not `"refined"` — re-runs create duplicates | Added `learning-router.js` to modified files: `"refined"` and `"deferred"` treated as in-pipeline |
| 2   | Blocker  | `"deferred"` status not in Zod schema at `learning-route.ts`                                                     | Added schema modification to file impact                                                          |
| 3   | Blocker  | `ratchet-baselines.js` exits 1 on regression — session-start UX unspecified                                      | Added `--check-only` flag requirement; session-start ratchets down only                           |
| 4   | Warning  | Insertion point "~line 599" is unstable                                                                          | Changed to content anchor: "after rotate-jsonl block, before seed-commit-log"                     |
| 5   | Warning  | `refine-scaffolds.js` doesn't populate `enforcement_test`/`metrics` — verify-enforcement skips                   | Added MUST requirement to populate both fields on enforced entries                                |
| 6   | Warning  | S1 escalation mechanism unspecified (3 possible behaviors)                                                       | Specified: auto-create DEBT at S1 with 7-day deadline, remove from pending                        |
| 7   | Warning  | Classification rule 4 predicate "consumer exists" ambiguous                                                      | Clarified: checks subject system's consumer, not scaffolded target file                           |
| 8   | Warning  | `run-alerts.js` insertion at "line 3687" is unstable                                                             | Changed to function anchor: `checkPendingRefinements()` after `checkEnforcementVerification()`    |
| 9   | Nit      | `verified-patterns.json` schema differs from scaffold output                                                     | Added note: use VP schema (`id, anti_pattern, ...`), not scaffold schema                          |
| 10  | Nit      | `route_type` omits `lint-rule`                                                                                   | Added `lint-rule` to enum                                                                         |
| 11  | Nit      | Success criterion 1 misleading about full lifecycle timing                                                       | Added clarifying note about enforced→verified timing                                              |
