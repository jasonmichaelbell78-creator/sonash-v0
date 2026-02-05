---
name: eval-multi-ai-audit
description:
  Evaluation wrapper that instruments a live multi-AI audit run and scores each
  pipeline stage. Temporary skill for validating the multi-ai-audit system.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** ACTIVE (TEMPORARY)
<!-- prettier-ignore-end -->

# Multi-AI Audit Evaluation Wrapper

**Purpose:** Run a real, live multi-AI audit using the `/multi-ai-audit` skill
while instrumenting every stage to measure reliability, correctness, and data
integrity. Produces a scored evaluation report with actionable improvement
recommendations.

**Invocation:** `/eval-multi-ai-audit`

**Type:** Temporary — remove after evaluation is complete and issues are
resolved.

---

## What This Evaluates

| Stage  | Component              | What's Measured                               |
| ------ | ---------------------- | --------------------------------------------- |
| **E1** | Session Initialization | State file, directory structure               |
| **E2** | Template Output        | All 7 templates load, prompt extraction works |
| **E3** | Format Normalization   | Real AI output → valid JSONL conversion       |
| **E4** | Schema Fixing          | Field completeness, valid enums, confidence   |
| **E5** | Category Aggregation   | Dedup accuracy, consensus scoring, CANON IDs  |
| **E6** | Unification            | Cross-cutting detection, priority scoring     |
| **E7** | TDMS Intake            | Dedup detection, DEBT IDs, view regeneration  |
| **E8** | Roadmap Integration    | Track assignment, reference validation        |

---

## Prerequisites

Before invoking this skill:

1. The `/multi-ai-audit` skill must be available
2. At least 2 external AI systems accessible (e.g., Claude web + GPT/Gemini)
3. The codebase should be in a testable state (no uncommitted critical changes)

---

## Workflow

### Phase 1: Pre-Audit Snapshot

**Execute immediately on skill invocation:**

```bash
# The session path will be determined after /multi-ai-audit creates it.
# For now, capture the baseline state in a temp location.
node scripts/multi-ai/eval-check-stage.js /tmp/eval-pending E2
```

Wait — the snapshot needs the session path. Instead:

1. **Capture baseline BEFORE starting the audit:**

```bash
# Create a temporary eval staging area
mkdir -p /tmp/eval-multi-ai-staging

# Snapshot current MASTER_DEBT and system state
node scripts/multi-ai/eval-snapshot.js pre /tmp/eval-multi-ai-staging
```

2. **Note the pre-snapshot location** for later move.

### Phase 2: Run the Live Audit

**Invoke the real audit skill:**

Tell the user:

```
=== EVALUATION MODE ===

Starting a live multi-AI audit with instrumentation.
This is a REAL audit — use real AI systems and real findings.

The evaluation will measure each pipeline stage as you work through it.

Proceeding to start /multi-ai-audit...
```

**Follow the full `/multi-ai-audit` workflow (Phases 1-8).** This is NOT
simulated. The user will:

- Select categories
- Paste real findings from real external AIs
- Aggregate, unify, intake, and assign roadmap refs

**Key difference from normal runs:** After each phase transition, run the
corresponding evaluation check. See Phase 3 below.

### Phase 3: Instrument Each Stage

**After each `/multi-ai-audit` phase completes, run the corresponding eval
check.**

The session path will be: `docs/audits/multi-ai/<session-id>/`

#### After Phase 1 (Session Init):

```bash
# Move pre-snapshot to session eval dir
cp /tmp/eval-multi-ai-staging/eval/pre-snapshot.json docs/audits/multi-ai/<session>/eval/pre-snapshot.json

# Check E1
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E1
```

#### After Phase 2 (Template Output) — run once, covers all templates:

```bash
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E2
```

#### After Phase 3 (each "add \<source\>" command):

```bash
# Run after EACH source is added to check normalization quality
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E3
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E4
```

Note: E3 and E4 accumulate — each run appends to stage-results.jsonl. The final
report uses the LAST result per stage (most complete data).

#### After Phase 4 (each "done" command — category aggregation):

```bash
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E5
```

#### After Phase 5 (unification — user says "finish"):

```bash
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E6
```

#### After Phase 6 (TDMS intake):

```bash
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E7
```

#### After Phase 7 (roadmap integration):

```bash
node scripts/multi-ai/eval-check-stage.js docs/audits/multi-ai/<session> E8
```

### Phase 4: Post-Audit Snapshot

**After Phase 8 of the audit completes:**

```bash
node scripts/multi-ai/eval-snapshot.js post docs/audits/multi-ai/<session>
```

### Phase 5: Generate Evaluation Report

```bash
node scripts/multi-ai/eval-report.js docs/audits/multi-ai/<session>
```

This generates: `docs/audits/multi-ai/<session>/eval/EVALUATION-REPORT.md`

### Phase 6: Present Results

Show the user the full report, highlighting:

1. **Overall grade** and pass/fail
2. **Failing stages** with specific issues
3. **Data integrity check** — were any findings lost?
4. **Recommendations** grouped by category:
   - Pipeline improvements
   - Mapping rule corrections
   - Schema/format gaps
   - Process improvements
5. **Pre/post comparison** — what changed in the system

---

## Context Compaction Survival

This wrapper survives context compaction because:

1. **Pre-snapshot** saved to disk immediately on invocation
2. **Stage results** appended to `stage-results.jsonl` after each check
3. **Session path** discoverable from
   `.claude/multi-ai-audit/session-state.json`
4. The underlying `/multi-ai-audit` skill has its own compaction recovery

**On resume after compaction:**

1. Read `.claude/multi-ai-audit/session-state.json` to find session path
2. Check `eval/stage-results.jsonl` to see which stages were already checked
3. Resume from the next unchecked stage
4. The pre-snapshot is already on disk

---

## Error Recovery

### Stage Check Fails

If `eval-check-stage.js` itself errors:

- The error does NOT block the audit — the audit continues normally
- Note the error and re-run the check after the audit completes
- All stages can be run retroactively: `eval-check-stage.js <path> all`

### Audit Fails Mid-Way

If the `/multi-ai-audit` skill fails during the evaluation:

- Run checks for all completed stages: `eval-check-stage.js <path> all`
- Generate a partial report: `eval-report.js <path>`
- The report will show which stages were evaluated and which were missed

### Pre-Snapshot Missing

If `/tmp/eval-multi-ai-staging` was lost:

- Create a fresh snapshot: `eval-snapshot.js pre <session-path>`
- Note: pre/post comparison will be less accurate (uses current state as
  baseline)

---

## Guardrails: Nothing Left Behind

The evaluation explicitly checks for data loss at every stage:

| Check Point        | What's Verified                                      | Stage |
| ------------------ | ---------------------------------------------------- | ----- |
| Original preserved | `.original.txt` exists for every normalized `.jsonl` | E3    |
| Fields complete    | 100% of items have title+severity+category           | E4    |
| Dedup transparent  | Raw count → canon count ratio reported               | E5    |
| All unified        | UNIFIED-FINDINGS.jsonl count matches expectations    | E6    |
| All ingested       | unified count - new MASTER_DEBT items = duplicates   | E7    |
| No orphan hashes   | Zero duplicate content_hash in MASTER_DEBT           | E7    |
| All assigned       | 100% of new items have roadmap_ref                   | E8    |
| Fallback tracked   | Items hitting M2.1 default explicitly counted        | E8    |

---

## Output Files

| File                                  | Purpose                    |
| ------------------------------------- | -------------------------- |
| `<session>/eval/pre-snapshot.json`    | State before audit         |
| `<session>/eval/post-snapshot.json`   | State after audit          |
| `<session>/eval/stage-results.jsonl`  | Per-stage pass/fail + data |
| `<session>/eval/EVALUATION-REPORT.md` | Final scored report        |

---

## Cleanup

After the evaluation is complete and issues are addressed:

1. The eval data in `<session>/eval/` can be kept for reference or deleted
2. This skill (`eval-multi-ai-audit`) should be removed once the multi-ai-audit
   system is validated
3. The evaluation scripts in `scripts/multi-ai/eval-*.js` can remain for future
   regression testing

---

## Related

- [multi-ai-audit SKILL.md](../../skills/multi-ai-audit/SKILL.md) — The system
  being evaluated
- [scripts/multi-ai/eval-snapshot.js](../../../scripts/multi-ai/eval-snapshot.js)
- [scripts/multi-ai/eval-check-stage.js](../../../scripts/multi-ai/eval-check-stage.js)
- [scripts/multi-ai/eval-report.js](../../../scripts/multi-ai/eval-report.js)

---

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0     | 2026-02-05 | Initial evaluation wrapper skill |
