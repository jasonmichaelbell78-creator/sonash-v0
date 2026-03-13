# Data Effectiveness Audit — PLAN

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-13
**Status:** APPROVED
<!-- prettier-ignore-end -->

**Date:** 2026-03-13 **Deep-Plan Topic:** data-effectiveness-audit
**Decisions:** 35 (see DECISIONS.md) **Execution:** Wave-based,
dependency-ordered (per D23) **Effort Estimate:** XL (~8-12 hours across 3-5
sessions)

---

## Overview

Fix the project's core data problem: **write-eager, read-lazy**. Data is
captured extensively (40+ files, 12 capture systems) but insufficiently
consumed, enforced, or acted upon. The deliverable is NOT better surfaces — it's
a **learning-to-automation pipeline** that converts discovered patterns into
automated enforcement (D8/D9 reframe).

### What This Plan Produces

1. **Lifecycle scores** for every data system (Capture/Storage/Recall/Action,
   0-12 each) — identifies what's broken
2. **Fixed broken flows** — orphaned JSONL wired to consumers, dead files
   deleted, unbounded files rotated
3. **Learning-to-automation router** — shared library that any skill can call to
   convert a learning into enforcement
4. **Enforcement scaffolding** — templates that generate verified-pattern
   entries, hook gates, ESLint/Semgrep skeletons
5. **CLAUDE.md enforcement annotations** — every rule shows its enforcement
   mechanism (or lack thereof)
6. **Defense-in-depth at creation time** — positive templates, verification
   agent, behavioral checklist
7. **Ecosystem-health Data Effectiveness dimension** — 15% weight, lifecycle
   scoring
8. **data-effectiveness-audit skill** — reusable byproduct, refined via
   skill-audit before use
9. **Re-scored existing systems** — ALL 40+ data files scored and gaps fixed

### Governing Principles (from DECISIONS.md)

- No passive surfacing — all data surfaces must require action
- AUTOMATION ALWAYS — manual processes are a bug
- Actionable = automated enforcement, not human acknowledgment
- No deferrals unless user explicitly asks
- AI-optimized formats throughout

---

## Wave 0: Cleanup & Foundation (no dependencies)

_Estimated: 30 min | Files: 5-8_

### Step 0.1: Delete orphaned JSONL files

Per D6/D25: Remove files with zero consumers and no future use.

**Files to delete:**

- `.claude/state/enforcement-manifest.jsonl`
- `.claude/state/dedup-log.jsonl`

**Done when:** Files deleted, no references remain in scripts or skills.

### Step 0.2: Create unified JSONL rotation script

Per D11/D25: Implement tiered rotation.

**Create:** `scripts/rotate-jsonl.js`

```javascript
// Tier configuration
const TIERS = {
  operational: {
    maxAge: 30, // days
    files: [
      ".claude/state/hook-warnings-log.jsonl",
      ".claude/state/override-log.jsonl",
      ".claude/state/commit-log.jsonl",
      ".claude/state/agent-invocations.jsonl",
    ],
  },
  historical: {
    maxAge: 90,
    files: [
      ".claude/state/reviews.jsonl",
      ".claude/state/retros.jsonl",
      ".claude/state/review-metrics.jsonl",
      // 7 ecosystem audit history files
    ],
  },
  permanent: {
    maxAge: null, // never rotate
    files: [
      ".claude/state/health-score-log.jsonl",
      "docs/technical-debt/MASTER_DEBT.jsonl",
      ".claude/state/velocity-log.jsonl",
    ],
  },
};
```

**Wire into session-start:** Add `node scripts/rotate-jsonl.js` call to
`.claude/hooks/session-start.js`.

**Done when:** Script runs on session-start, rotates files by tier, logs
rotation count. Test with mock data.

### Step 0.3: Fix pattern_recurrence population

Per D7: Populate at retro creation time, auto-escalate at >=3.

**Modify:** `.claude/skills/pr-retro/SKILL.md` (or its REFERENCE.md)

When pr-retro identifies a pattern:

1. Read `retros.jsonl`, search for prior occurrences of same pattern category
2. Set `pattern_recurrence` to count of prior occurrences
3. If count >= 3, auto-tag finding as CRITICAL

**Done when:** New retro entries have accurate `pattern_recurrence` values. Test
by checking retros.jsonl for a known recurring pattern.

---

## Wave 1: Broken Flow Wiring (depends on Wave 0 for clean state)

_Estimated: 60-90 min | Files: 6-8_

### Step 1.1: Wire retros → pr-review (backward flow)

Per D26: When pr-review runs, read last 3 retros' `action_items[]` and check if
current PR repeats any pattern.

**Modify:** `.claude/skills/pr-review/SKILL.md` (or REFERENCE.md)

Add a step early in the review process:

1. Read `.claude/state/retros.jsonl` (last 3 entries)
2. Extract `action_items[]` from each
3. For each action item with `status !== 'complete'`, check if the current PR's
   changes match the pattern
4. If match found: flag in review with "[REPEAT PATTERN from retro X]"

**Done when:** pr-review surfaces repeat patterns from recent retros. Test by
creating a mock retro entry and running pr-review.

### Step 1.2: Wire invocations → session-end summary

Per D26: Agent invocations get summarized at session-end.

**Modify:** `.claude/skills/session-end/SKILL.md` (or REFERENCE.md)

Add a step to session-end:

1. Read `.claude/state/agent-invocations.jsonl` (current session entries)
2. Summarize: which agents ran, success/fail, duration
3. Include in session summary output

**Done when:** session-end includes agent invocation summary.

### Step 1.3: Wire review-metrics → /alerts

Per D12/D26: Define thresholds and add to alerts.

**Modify:** `.claude/skills/alerts/scripts/run-alerts.js`

Add a check:

1. Read `.claude/state/review-metrics.jsonl`
2. Calculate avoidable round rate over last 5 PRs
3. If > 40%, generate alert: "Review churn: X% avoidable rounds (threshold:
   40%)"

**Done when:** /alerts surfaces review-metrics alerts. Test with sample data.

### Step 1.4: Wire review-metrics → pr-retro

Per D12: pr-retro uses review-metrics data.

**Modify:** `.claude/skills/pr-retro/SKILL.md` (or REFERENCE.md)

Add a step:

1. Read review-metrics.jsonl for the PR being retro'd
2. Include churn metrics in retro analysis (rounds, avoidable count, time)

**Done when:** pr-retro includes review-metrics data in analysis.

---

## Wave 2: Learning-to-Automation Router (core infrastructure)

_Estimated: 90-120 min | Files: 4-6_

### Step 2.1: Create shared learning router library

Per D13/D22/D29: Event-driven, type-based routing.

**Create:** `scripts/lib/learning-router.js`

```javascript
/**
 * Learning-to-Automation Router
 * Called by any skill that identifies a pattern/learning.
 * Routes to appropriate enforcement mechanism.
 *
 * @param {Object} learning
 * @param {string} learning.type - 'code' | 'process' | 'behavioral'
 * @param {string} learning.pattern - Description of the pattern
 * @param {string} learning.source - Skill/script that identified it
 * @param {string} learning.severity - 'critical' | 'high' | 'medium' | 'low'
 * @param {Object} learning.evidence - Supporting data
 * @returns {Object} routing result with enforcement action taken
 */

// Route by type (per D13):
// code → scaffold verified-pattern entry + lint rule
// process → scaffold hook gate stub
// behavioral → CLAUDE.md annotation + proxy metric definition
```

Core functions:

- `route(learning)` — main entry point, categorizes and dispatches
- `scaffoldVerifiedPattern(learning)` — generates verified-patterns.json entry
- `scaffoldHookGate(learning)` — generates shell function or check script stub
- `scaffoldLintRule(learning)` — generates ESLint/Semgrep rule skeleton
- `scaffoldClaudeMdAnnotation(learning)` — annotates CLAUDE.md rule
- `trackRouting(learning, result)` — logs routing decision for verification

**Per D14:** Script scaffolds structure, AI refines content. The scaffold
functions produce templates with TODO markers that the AI fills in.

**Per D30:** Each scaffold type has a distinct template:

- verified-pattern: `{ pattern, regex, severity, fileGlobs, autofix }`
- hook gate: shell function with check logic placeholder
- lint rule: `{ meta: {...}, create(context) { /* TODO */ } }`
- CLAUDE.md annotation: `[ENFORCEMENT: type] rule text`

**Done when:** Library exports all functions, has JSDoc types, includes tests
for routing logic. Each scaffold produces valid starter templates.

### Step 2.2: Create routing tracker

Per D30/D31: Trackable enforcement pipeline.

**Create:** `.claude/state/learning-routes.jsonl`

Schema per entry:

```json
{
  "timestamp": "ISO",
  "learning": { "type": "code", "pattern": "...", "source": "pr-retro" },
  "route": "verified-pattern",
  "scaffold": "scripts/config/verified-patterns.json",
  "status": "scaffolded|refined|enforced|verified",
  "enforcement_test": "path/to/test",
  "metrics": { "violations_before": 20, "violations_after": 0 }
}
```

**Done when:** Router logs every routing decision. Status tracks full lifecycle
from scaffolded → verified.

### Step 2.3: Create enforcement verification framework

Per D31: Tests + metrics for every enforcement mechanism.

**Create:** `scripts/verify-enforcement.js`

For each entry in `learning-routes.jsonl` with status `enforced`:

1. Run the associated test (`enforcement_test` path)
2. Check violation metrics (before vs. after)
3. If test passes AND violations decreased → status = `verified`
4. If test fails OR violations unchanged → flag for repair

**Add to session-start or periodic run (per D33).**

**Done when:** Script verifies all enforced learnings. Flags failures.

---

## Wave 3: Moment-of-Creation Enforcement (depends on Wave 2 router)

_Estimated: 60-90 min | Files: 6-10_

### Step 3.1: Create positive pattern templates

Per D27 (primary prevention): Instead of catching violations after code is
written, provide the RIGHT way to do things upfront.

**Create:** `docs/agent_docs/POSITIVE_PATTERNS.md`

For each anti-pattern in CODE_PATTERNS.md, create the positive equivalent:

- `writeFileSync` → `safeWriteFileSync` (from safe-fs.js) — include import path
- `path.resolve` → validated resolve with containment check — include snippet
- Raw `error.message` → `sanitizeError(error)` — include import path
- `startsWith('..')` → regex path traversal check — include exact regex
- Direct Firestore writes → `httpsCallable` pattern — include template

**Done when:** Every anti-pattern has a corresponding positive template with
exact import/usage. Referenced in CLAUDE.md Section 5.

### Step 3.2: Create verification agent integration

Per D27 (safety net): Post-generation, pre-commit verification.

**Modify:** `.claude/skills/code-reviewer/` (or create a lightweight
pre-commit-review step)

Add a check that runs BEFORE commit:

1. Diff staged files
2. Check against known anti-patterns (verified-patterns.json)
3. Check against positive patterns (are safe alternatives used?)
4. If violations found: block with specific fix instructions referencing
   positive templates

**Per D32:** No warning mode. Violations block immediately.

**Done when:** Pre-commit verification catches anti-patterns and suggests
positive alternatives. Tests confirm blocking behavior.

### Step 3.3: Create behavioral checklist for AI

Per D27 (behavioral reminder) + D15: For patterns that can't be automated.

**Create:** `docs/agent_docs/PRE_GENERATION_CHECKLIST.md`

Checklist items derived from CLAUDE.md Section 4 behavioral guardrails:

- [ ] Did I read the file before editing?
- [ ] Did I get explicit approval for this approach?
- [ ] Did I read the skill format before following it?
- [ ] Am I using safe-fs instead of raw fs?
- [ ] Am I importing from the right locations (types/, schemas)?

**Wire into CLAUDE.md** as a reference. Define proxy metrics (D15) for each:

- "Read before edit" → metric: edit-without-read count in commit hooks
- "Explicit approval" → metric: implementation-before-plan count in session logs

**Done when:** Checklist exists, proxy metrics defined, wired into CLAUDE.md.

---

## Wave 4: CLAUDE.md Restructure (depends on Wave 2 router, Wave 3 patterns)

_Estimated: 30-45 min | Files: 2-3_

### Step 4.1: Annotate CLAUDE.md rules with enforcement status

Per D10/D19: Every rule gets an enforcement annotation.

**Modify:** `CLAUDE.md`

Annotation format:

```markdown
## 2. Security Rules

1. **NO DIRECT WRITES** to journal, daily_logs, inventoryEntries
   `[GATE: pre-commit patterns:check]`
2. **App Check Required** `[GATE: Cloud Functions runtime]`
3. **Rate Limiting** `[BEHAVIORAL: no automated enforcement]`
```

For each section:

- Section 2 (Security): Identify which rules have hooks/gates, which don't
- Section 4 (Behavioral): Most will be `[BEHAVIORAL: proxy metrics only]`
- Section 5 (Anti-Patterns): Most will be `[GATE: patterns:check]` or
  `[GATE: pre-commit]`
- Section 6 (Coding Standards): `[GATE: tsconfig]`, `[GATE: eslint]`, etc.
- Section 7 (Triggers): `[BEHAVIORAL: no enforcement]` for most — candidates for
  new gates

**Done when:** Every rule in CLAUDE.md has an enforcement annotation. Gap list
produced for Wave 5.

### Step 4.2: Create enforcement gap tracker

From 4.1 annotations, compile a list of rules with
`[BEHAVIORAL: no enforcement]` or similar gaps.

**Feed into router (Wave 2):** Each gap becomes a learning that the router
categorizes and scaffolds enforcement for.

**Done when:** Gap list created, each gap routed through learning-router.

---

## Wave 5: Existing System Lifecycle Scoring (depends on Waves 0-2)

_Estimated: 90-120 min | Files: 10-15_

### Step 5.1: Score ALL data systems

Per D4/D5/D24: Apply lifecycle scoring to every data system identified in
DIAGNOSIS.md.

**Create:** `.planning/learnings-effectiveness-audit/LIFECYCLE_SCORES.md`

Score each of the 40+ data files across all 12 capture categories:

```markdown
| System           | File(s)                                  | Capture | Storage | Recall | Action | Total | Gap                               |
| ---------------- | ---------------------------------------- | ------- | ------- | ------ | ------ | ----- | --------------------------------- |
| Pattern rules    | CODE_PATTERNS.md, verified-patterns.json | 3       | 2       | 2      | 2      | 9     | Action: not all patterns enforced |
| Hook warnings    | hook-warnings-log.jsonl                  | 3       | 1→2\*   | 2      | 1      | 7→8   | Storage: rotation added (W0)      |
| Review learnings | AI_REVIEW_LEARNINGS_LOG.md               | 2       | 1       | 0      | 0      | 3     | Recall: no consumer. Action: none |
| ...              | ...                                      | ...     | ...     | ...    | ...    | ...   | ...                               |
```

_Scores updated as waves fix issues (e.g., rotation improves Storage score)._

**Done when:** Every data system scored. Gap column identifies specific fix
needed. Systems below 6/12 flagged for Wave 6 remediation.

### Step 5.2: Identify enforcement gaps across all systems

From 5.1 scores, compile systems where Action < 2 (semi-automated or worse).

**For each gap:**

1. Categorize (code/process/behavioral)
2. Route through learning-router (Wave 2)
3. Track in learning-routes.jsonl

**Done when:** All Action < 2 systems have routing entries. Scaffolds generated.

### Step 5.3: Fix Storage gaps — apply rotation

From 5.1, any system with Storage < 2 that should have rotation:

- Verify it's in the rotation script (Wave 0.2)
- Add if missing
- Update score

**Done when:** All JSONL files classified and rotated per D25 tiers.

---

## Wave 6: Consumer Wiring & Feedback Loops (depends on Waves 1, 5)

_Estimated: 60-90 min | Files: 8-12_

### Step 6.1: Fix Recall gaps — wire consumers

From Wave 5 scores, systems with Recall < 2 need consumers.

**Priority order** (security/data-loss first per D28):

1. Systems with Recall=0 (no consumer at all)
2. Systems with Recall=1 (one informational consumer)

For each, identify the natural consumer (per D26 approach — wire to existing
skills/scripts, don't create new ones) and implement the wiring.

**Done when:** Every data system has at least one active consumer (Recall >= 2).

### Step 6.2: Fix Action gaps — create enforcement

From Wave 5 scores, systems with Action < 2.

For each, use the router (Wave 2) to scaffold enforcement. Then refine the
scaffold per D14 (AI refines).

**Per D32:** Enforcement goes live immediately. No warning period. **Per D28:**
Security/data-loss patterns get absolute thresholds. Others get ratcheting
baselines.

**Done when:** Every data system with automatable patterns has enforcement
(Action >= 2). Non-automatable patterns have proxy metrics (D15).

### Step 6.3: Implement ratcheting baselines

Per D28: For non-security patterns, record current violation count as baseline.
New violations block. As fixes reduce counts, auto-tighten baseline.

**Modify:** `.claude/state/known-debt-baseline.json` (already exists from hook
audit)

Add entries for each baselined pattern with:

```json
{
  "pattern": "writeFileSync-without-guard",
  "baseline": 321,
  "recorded": "2026-03-13",
  "ratchet_history": []
}
```

**Create:** `scripts/ratchet-baselines.js` — reads current violation counts,
compares to baseline, updates baseline downward if violations decreased.

**Wire into session-start** for automatic ratcheting.

**Done when:** Baselines recorded for all non-security patterns. Ratchet script
runs on session-start.

---

## Wave 7: Ecosystem-Health Integration (depends on Waves 2, 5)

_Estimated: 45-60 min | Files: 4-6_

### Step 7.1: Create Data Effectiveness health checker

Per D17: Replace learning-effectiveness checker with lifecycle scoring.

**Create:** Checker function (either in ecosystem-health scripts or standalone)

Checker logic:

1. Read LIFECYCLE_SCORES.md (or compute scores from live data)
2. Score 8 domains (per D16):
   - Capture completeness: % of systems with Capture >= 2
   - Consumer coverage: % of systems with Recall >= 2
   - Feedback loop closure: % of systems with Action >= 2
   - Automation coverage: % of enforcement that's automated (Action=3)
   - Orphan detection: count of files with zero consumers
   - Growth management: % of JSONL files with rotation
   - Cross-system integration: count of cross-skill data flows
   - Opportunities: count of identified but unimplemented improvements
3. Compute composite score (0-100)
4. Map to letter grade (A-F)

**Done when:** Checker runs, produces grade, integrates with ecosystem-health.

### Step 7.2: Add Data Effectiveness dimension to ecosystem-health

Per D17/D35: 15% weight in composite score.

**Modify:** `.claude/skills/ecosystem-health/SKILL.md` and
`scripts/run-ecosystem-health.js`

Add the new dimension alongside existing ones (Hook Config, Code Quality, etc.).
Weight: 15%. Recalculate other weights proportionally.

**Done when:** ecosystem-health includes Data Effectiveness in composite grade.

### Step 7.3: Set up trigger-based audit runs

Per D33: Auto-trigger data-effectiveness-audit when health score drops.

**Modify:** `.claude/skills/alerts/scripts/run-alerts.js`

Add check:

1. Read Data Effectiveness score from last ecosystem-health run
2. If score dropped 10+ points or grade dropped 1+ level → alert
3. Alert recommends running `/data-effectiveness-audit`

**Done when:** /alerts surfaces Data Effectiveness degradation.

---

## Wave 8: Audit Skill Creation (depends on all previous waves)

_Estimated: 60-90 min | Files: 5-8_

### Step 8.1: Create data-effectiveness-audit skill

Per D3/D21: Standalone skill, byproduct of this audit process.

**Create:** `.claude/skills/data-effectiveness-audit/SKILL.md`

Skill structure (following ecosystem audit conventions):

- 8 audit domains (per D16) as the checklist
- Lifecycle scoring rubric (per D4/D24) as the scoring method
- Produces: LIFECYCLE_SCORES.md, gap list, routing entries
- Uses learning-router (Wave 2) to scaffold enforcement for gaps
- Outputs opportunities section (per D2/D20)

### Step 8.2: Create skill REFERENCE.md

Templates, schemas, scoring rubric details, example outputs.

### Step 8.3: Register in SKILL_INDEX.md

Add to "Audit & Code Quality" category.

**Done when:** Skill exists, follows conventions, is registered.

### Step 8.4: Run through skill-audit for refinement

Per D3: Before first real use, run the skill-audit process on this skill.

**Done when:** Skill-audit findings addressed.

---

## Wave 9: Defense-in-Depth Strengthening (depends on Waves 3, 6)

_Estimated: 45-60 min | Files: 5-8_

### Step 9.1: Wire positive templates into enforcement pipeline

Per D27: Ensure positive patterns are referenced by:

- verification agent (Wave 3.2)
- pre-commit hooks (existing)
- CLAUDE.md Section 5 (Wave 4.1)

Cross-reference: every anti-pattern in verified-patterns.json should have a
corresponding positive pattern in POSITIVE_PATTERNS.md.

**Done when:** 1:1 mapping between anti-patterns and positive templates.

### Step 9.2: Implement conflict resolution logic

Per D34: When router encounters a pattern that already has enforcement:

1. Run existing enforcement test
2. Check violation metrics
3. If enforcement works → skip, log "existing enforcement verified"
4. If enforcement insufficient → widen scope, log "enforcement strengthened"

**Add to:** `scripts/lib/learning-router.js` (conflict resolution branch)

**Done when:** Router handles duplicates gracefully. Tests cover both paths.

### Step 9.3: Connect verification loop

Per D31/D34: End-to-end verification.

Wire `scripts/verify-enforcement.js` (Wave 2.3) into:

- session-start (run verification on `enforced` status entries)
- /alerts (surface failed verifications)

**Done when:** Failed enforcement automatically surfaces in /alerts.

---

## Wave 10: Audit Checkpoint + Final Scoring

_Estimated: 30-45 min_

### Step 10.1: Re-score all systems

Run the data-effectiveness-audit skill (Wave 8) on the CURRENT state after all
waves are applied. Compare before/after lifecycle scores.

**Expected:** Significant improvement in Recall and Action scores across the
board. Storage scores improved by rotation. No system should remain at Action=0
unless explicitly categorized as behavioral-only (D15).

### Step 10.2: Code review

Run code-reviewer agent on all new/modified files across all waves.

### Step 10.3: Test suite

Run full test suite. All new scripts/checkers must have tests.

### Step 10.4: Update documentation

- SESSION_CONTEXT.md — update with audit results
- ROADMAP.md — mark data effectiveness items as addressed
- MEMORY.md — add reference to audit artifacts

**Done when:** Before/after comparison shows measurable improvement. All tests
pass. Code review clean.

---

## Dependency Graph

```
Wave 0 (cleanup) ──┬──→ Wave 1 (wiring) ──→ Wave 6 (consumers)
                    │                              │
                    └──→ Wave 2 (router) ──┬──→ Wave 5 (scoring) ──→ Wave 7 (health)
                                           │                              │
                                           └──→ Wave 3 (creation-time) ──→ Wave 9 (strengthen)
                                                      │
                                                      └──→ Wave 4 (CLAUDE.md)

Wave 8 (skill) depends on all of 0-7
Wave 10 (checkpoint) depends on all of 0-9
```

**Parallelizable:** Waves 1 and 2 can run in parallel after Wave 0. Waves 3 and
5 can overlap. Wave 4 can start after Wave 2.

---

## Risk Register

| Risk                                                | Mitigation                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Scope creep — 40+ systems to score                  | Batch scoring in groups of 5-8. Score, fix, move on.                                                |
| Router complexity — type detection may be ambiguous | Start with explicit type annotation. AI categorizes, human confirms first 5, then trust the router. |
| False positives in new gates                        | Per D32: fix the gate, don't weaken enforcement. Have a fast-fix path.                              |
| Compaction during long waves                        | Save state after each wave. Each wave is independently resumable.                                   |
| Test suite growth                                   | Each new script needs tests but scope to enforcement behavior, not comprehensive coverage.          |

---

## Success Criteria

1. **Every data system scored** — 40+ files × 4 lifecycle stages = complete
   matrix
2. **No orphaned JSONL** — every file has at least one consumer
3. **No unbounded JSONL** — every file has rotation policy
4. **Learning-router functional** — can route code/process/behavioral patterns
   to appropriate enforcement
5. **CLAUDE.md annotated** — every rule shows enforcement status
6. **Ecosystem-health integrated** — Data Effectiveness dimension at 15%
7. **Before/after improvement** — measurable increase in average lifecycle
   scores, especially Recall and Action
8. **Audit skill exists** — data-effectiveness-audit skill created, registered,
   refined via skill-audit
