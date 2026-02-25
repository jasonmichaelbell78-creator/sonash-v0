---
name: audit-documentation
description:
  Run a multi-stage parallel documentation audit with 18 specialized agents
supports_parallel: true
fallback_available: true
estimated_time_parallel: 20 min
estimated_time_sequential: 90 min
---

# Single-Session Documentation Audit

## When to Use

- User explicitly invokes `/audit-documentation`

## When NOT to Use

- When a more specialized skill exists for the specific task

## Execution Mode Selection

| Condition                    | Mode       | Time    |
| ---------------------------- | ---------- | ------- |
| Task tool available          | Parallel   | ~20 min |
| Task tool unavailable        | Sequential | ~90 min |
| Context low (<20% remaining) | Sequential | ~90 min |

---

## Overview

6-stage parallel audit analyzing documentation quality, accuracy, and lifecycle.
Each stage produces JSONL output for synthesis.

**Total Agents:** 18 across 5 stages + 1 synthesis stage **Output:**
`docs/audits/single-session/documentation/audit-[YYYY-MM-DD]/`

**Agent prompts and templates:** See [prompts.md](prompts.md) for all agent
prompt text, JSONL schemas, and report templates.

---

## Pre-Audit Validation

1. **Episodic Memory Search** — past documentation audit findings
2. **Read False Positives** — `docs/technical-debt/FALSE_POSITIVES.jsonl`
3. **Check Prior Audits** — `docs/audits/single-session/documentation/`
4. **Verify Output Directory** — `mkdir -p "$AUDIT_DIR"`
5. **Check Thresholds** — `npm run review:check`

---

## Stage 1: Inventory & Baseline (3 Parallel Agents)

**Dependencies:** 1A, 1B, 1C are fully independent. Stage 2 depends on 1C's link
graph.

| Agent | Task               | Output                 |
| ----- | ------------------ | ---------------------- |
| 1A    | Document inventory | `stage-1-inventory.md` |
| 1B    | Baseline metrics   | `stage-1-baselines.md` |
| 1C    | Link extraction    | `stage-1-links.json`   |

**Completion:** Verify all 3 files exist and are non-empty.

---

## Stage 2: Link Validation (4 Parallel Agents)

| Agent | Task                   | Output                         |
| ----- | ---------------------- | ------------------------------ |
| 2A    | Internal link checker  | `stage-2-internal-links.jsonl` |
| 2B    | External URL checker   | `stage-2-external-links.jsonl` |
| 2C    | Cross-reference valid. | `stage-2-cross-refs.jsonl`     |
| 2D    | Orphan & connectivity  | `stage-2-orphans.jsonl`        |

**Completion:** Validate JSONL schemas:
`node scripts/debt/validate-schema.js ${AUDIT_DIR}/stage-2-*.jsonl`

---

## Stage 3: Content Quality (4 Parallel Agents)

| Agent | Task                 | Output                       |
| ----- | -------------------- | ---------------------------- |
| 3A    | Accuracy checker     | `stage-3-accuracy.jsonl`     |
| 3B    | Completeness checker | `stage-3-completeness.jsonl` |
| 3C    | Coherence checker    | `stage-3-coherence.jsonl`    |
| 3D    | Freshness checker    | `stage-3-freshness.jsonl`    |

---

## Stage 4: Format & Structure (3 Parallel Agents)

| Agent | Task                | Output                       |
| ----- | ------------------- | ---------------------------- |
| 4A    | Markdown lint       | `stage-4-markdownlint.jsonl` |
| 4B    | Prettier compliance | `stage-4-prettier.jsonl`     |
| 4C    | Structure standards | `stage-4-structure.jsonl`    |

---

## Stage 5: Placement & Lifecycle (3+1 Agents)

5A, 5B, 5C run in parallel. 5D runs after 5B completes.

| Agent | Task               | Output                                 | Dep |
| ----- | ------------------ | -------------------------------------- | --- |
| 5A    | Location validator | `stage-5-location.jsonl`               | -   |
| 5B    | Archive candidates | `stage-5-archive-candidates-raw.jsonl` | -   |
| 5C    | Cleanup candidates | `stage-5-cleanup-candidates.jsonl`     | -   |
| 5D    | Deep lifecycle     | `stage-5-lifecycle-analysis.jsonl`     | 5B  |

---

## Stage 6: Synthesis & Prioritization (Sequential)

### 6.1 Merge All Findings

```bash
cat ${AUDIT_DIR}/stage-2-*.jsonl ${AUDIT_DIR}/stage-3-*.jsonl \
    ${AUDIT_DIR}/stage-4-*.jsonl ${AUDIT_DIR}/stage-5-*.jsonl \
    > ${AUDIT_DIR}/all-findings-raw.jsonl
```

### 6.2 Deduplicate

Remove duplicates by file:line. Keep higher severity/confidence/evidence count.

### 6.3 Cross-Reference FALSE_POSITIVES.jsonl

Filter by file pattern, title pattern, expiration dates.

### 6.4 Priority Scoring

```
priority = (severityWeight * categoryMultiplier * confidenceWeight) / effortWeight
```

Weights: severity S0=100/S1=50/S2=20/S3=5, category links=1.5/accuracy=1.3/
freshness=1.0/format=0.8, confidence HIGH=1.0/MEDIUM=0.7/LOW=0.4, effort
E0=1/E1=2/E2=4/E3=8.

### 6.5 Generate Action Plan

Three queues: Immediate Fixes (S0/S1, E0/E1), Archive Queue, Delete/Merge Queue.

### 6.6 Generate Final Report

Output `${AUDIT_DIR}/FINAL_REPORT.md`. See [prompts.md](prompts.md) for
template.

---

## MASTER_DEBT Cross-Reference (MANDATORY)

Before presenting findings, cross-reference against MASTER_DEBT.jsonl by file
path, title similarity, root cause. Classify: **Already Tracked** (skip) |
**New** (review) | **Possibly Related** (flag). Only New and Possibly Related
proceed to Interactive Review.

---

## Interactive Review (MANDATORY)

Present in batches of 3-5 by severity. Each shows: title, severity, effort,
confidence, current state, suggested fix, acceptance tests, counter-argument,
recommendation. Track decisions in `${AUDIT_DIR}/REVIEW_DECISIONS.md`. See
[prompts.md](prompts.md) for format.

---

## Post-Audit Validation

```bash
node scripts/validate-audit.js ${AUDIT_DIR}/all-findings.jsonl
```

Check: required fields, no FALSE_POSITIVES matches, no duplicates, S0/S1 have
HIGH/MEDIUM confidence.

---

## TDMS Intake & Commit

1. Verify all stage files saved
2. Run schema validation
3. `npm run validate:canon` (if CANON files updated)
4. Update AUDIT_TRACKER.md
5. Reset triggers:
   `node scripts/reset-audit-triggers.js --type=single --category=documentation --apply`
6. **TDMS Intake:**
   `node scripts/debt/intake-audit.js ${AUDIT_DIR}/all-findings.jsonl --source "audit-documentation-$(date +%Y-%m-%d)"`
7. Ask: "Fix any issues now?"

## Category Mapping

| Stage         | Category ID Prefix | TDMS Category |
| ------------- | ------------------ | ------------- |
| 2 - Links     | DOC-LINK-\*        | documentation |
| 3 - Content   | DOC-CONTENT-\*     | documentation |
| 4 - Format    | DOC-FORMAT-\*      | documentation |
| 5 - Lifecycle | DOC-LIFECYCLE-\*   | documentation |

---

## Context Recovery

If interrupted: check `.claude/state/audit-documentation-<date>.state.json`. If
< 24h old, resume from last stage. If stale, start fresh. Preserve partial
findings in output directory.

State file tracks: `audit_type`, `date`, `stage_completed`,
`partial_findings_path`, `last_updated`.

**Stage failures:** Re-run specific agent. **Empty output:** Check for errors.
**Context compaction:** Re-read `${AUDIT_DIR}/` and resume.

---

## Update Dependencies

| Document                                                | Section                        |
| ------------------------------------------------------- | ------------------------------ |
| `docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md` | Sync category list             |
| `docs/SLASH_COMMANDS_REFERENCE.md`                      | /audit-documentation reference |

---

## Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 2.2     | 2026-02-24 | Trim to <500 lines: extract prompts to prompts.md       |
| 2.1     | 2026-02-23 | Add mandatory MASTER_DEBT cross-reference step          |
| 2.0     | 2026-02-02 | Complete rewrite: 6-stage parallel audit with 18 agents |
| 1.0     | 2025-xx-xx | Original single-session sequential audit                |

---

## Documentation References

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) - Output
  format
- [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md) - 5-tier
  hierarchy
