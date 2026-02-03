---
name: audit-comprehensive
description: Run all 6 domain audits in staged waves and aggregate results
---

# Comprehensive Multi-Domain Audit Orchestrator

**Version:** 2.0 (Staged Execution with S0/S1 Escalation) **Time Savings:** 70%
faster than sequential (150min → 45min) **Stages:** 3 stages with 4+2+1 agent
configuration

**What This Does:** Spawns 6 specialized audit agents in staged waves
(respecting max 4 concurrent limit), with verification checkpoints and S0/S1
escalation, then aggregates findings into a comprehensive report.

---

## Overview

This skill orchestrates a complete codebase audit across all 6 domains:

1. **Code Quality** (`audit-code`) - Code hygiene, types, framework patterns
2. **Security** (`audit-security`) - Auth, input validation, OWASP compliance
3. **Performance** (`audit-performance`) - Load times, queries, caching
4. **Documentation** (`audit-documentation`) - README, API docs, architecture
5. **Refactoring** (`audit-refactoring`) - Technical debt, complexity, DRY
6. **Process/Automation** (`audit-process`) - CI/CD, testing, workflows

**Output:** Single unified report in
`docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md`

---

## Execution Flow

```
┌─────────────────────────────────────────────────────┐
│ Pre-Flight Validation                               │
│   - Verify all 6 audit skills exist                 │
│   - Create output directory                         │
│   - Gather baselines (tests, lint, patterns)        │
│   - Load false positives database                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ Stage 1: Technical Core (4 agents parallel)         │
│   - audit-code                                      │
│   - audit-security                                  │
│   - audit-performance                               │
│   - audit-refactoring                               │
│                                                     │
│ Checkpoint:                                         │
│   ✓ Verify 4 report files exist and non-empty      │
│   ✓ S0/S1 Check: If security finds criticals →     │
│     notify user before proceeding                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ Stage 2: Supporting (2 agents parallel)             │
│   - audit-documentation                             │
│   - audit-process                                   │
│                                                     │
│ Checkpoint:                                         │
│   ✓ Verify 2 report files exist and non-empty      │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ Stage 3: Aggregation (sequential)                   │
│   - audit-aggregator                                │
│                                                     │
│ Checkpoint:                                         │
│   ✓ Verify COMPREHENSIVE_AUDIT_REPORT.md exists    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ Post-Audit                                          │
│   - Update AUDIT_TRACKER.md                         │
│   - Display final summary                           │
│   - Recommend next steps                            │
└─────────────────────────────────────────────────────┘
```

---

## Pre-Flight Validation

**Step 1: Verify Skills Exist**

Check that all 6 audit skills are available:

```bash
ls -1 .claude/skills/audit-*/SKILL.md | wc -l
# Should return 6
```

If not all present, notify user which audits are missing and ask whether to
proceed with available audits only.

**Step 2: Create Output Directory**

```bash
mkdir -p docs/audits/comprehensive
```

**Step 2.5: Verify Output Directory (CRITICAL)**

Before running ANY agent, verify AUDIT_DIR is valid:

```bash
AUDIT_DIR="docs/audits/comprehensive"
AUDIT_PATH=$(realpath "${AUDIT_DIR}" 2>/dev/null || echo "${AUDIT_DIR}")
# Check for empty, root path, or path traversal attempts
if [ -z "${AUDIT_DIR}" ] || [ "${AUDIT_PATH}" = "/" ] || [[ "${AUDIT_DIR}" == ".."* ]]; then
  echo "FATAL: Invalid or unsafe AUDIT_DIR"
  exit 1
fi
echo "Output directory: ${AUDIT_DIR}"
```

**Why:** Context compaction can cause variable loss. Always verify before agent
launches.

**Step 3: Run Baseline Checks**

Gather current metrics to provide to all audits:

```bash
# Test count
npm test 2>&1 | grep -E "Tests:|passing|failed" | head -5

# Lint status
npm run lint 2>&1 | tail -10

# Pattern compliance
npm run patterns:check 2>&1 | head -20
```

Store results in `docs/audits/comprehensive/baseline.txt` for reference.

**Step 4: Load False Positives**

Read `docs/audits/FALSE_POSITIVES.jsonl` to pass to aggregator (prevents
duplicate flagging of known false positives).

---

## Stage 1: Technical Core Audits (4 Parallel)

**Launch 4 agents IN PARALLEL using Task tool with `run_in_background: true`:**

| Agent | Skill             | Output File                   |
| ----- | ----------------- | ----------------------------- |
| 1A    | audit-code        | `audit-code-report.md`        |
| 1B    | audit-security    | `audit-security-report.md`    |
| 1C    | audit-performance | `audit-performance-report.md` |
| 1D    | audit-refactoring | `audit-refactoring-report.md` |

**Why these 4 first:**

- Core technical analysis
- Security findings needed for S0/S1 escalation check
- Respects max 4 concurrent agents (CLAUDE.md Section 6.3)

**Display Initial Status:**

```
🚀 Comprehensive Audit Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stage 1: Technical Core (4 parallel)
  ⏳ Code Quality
  ⏳ Security
  ⏳ Performance
  ⏳ Refactoring

Stage 2: Supporting (waiting)
  ⏸️ Documentation
  ⏸️ Process/Automation

Stage 3: Aggregation (waiting)
  ⏸️ Aggregator

Estimated time: 40-45 minutes
(vs 150 minutes if run sequentially - 70% faster!)
```

### Stage 1 Checkpoint (MANDATORY)

Before proceeding to Stage 2, perform these checks:

**1. Verify output files exist:**

```bash
for f in audit-code-report.md audit-security-report.md audit-performance-report.md audit-refactoring-report.md; do
  if [ ! -s "docs/audits/comprehensive/$f" ]; then
    echo "❌ MISSING: $f - re-run agent"
  else
    echo "✅ $f exists"
  fi
done
```

**2. S0/S1 Security Escalation Check:**

```bash
grep -cE "\bS0\b|\bS1\b" docs/audits/comprehensive/audit-security-report.md
```

If S0/S1 findings exist, display:

```
⚠️ SECURITY ESCALATION
━━━━━━━━━━━━━━━━━━━━━━━

Security audit found critical/high findings.
These should be reviewed before continuing.

S0 Critical: X findings
S1 High: Y findings

Options:
1. Review security findings now (recommended for S0)
2. Continue with remaining audits
3. Stop and address security issues first

What would you like to do?
```

**3. Display Stage 1 Summary:**

```
✅ Stage 1 Complete (Technical Core)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Code Quality    (X findings)
  ✅ Security        (X findings, Y critical)
  ✅ Performance     (X findings)
  ✅ Refactoring     (X findings)

Proceeding to Stage 2...
```

---

## Stage 2: Supporting Audits (2 Parallel)

**Launch 2 agents IN PARALLEL using Task tool with `run_in_background: true`:**

| Agent | Skill               | Output File                     |
| ----- | ------------------- | ------------------------------- |
| 2A    | audit-documentation | `audit-documentation-report.md` |
| 2B    | audit-process       | `audit-process-report.md`       |

**Why these in Stage 2:**

- Supporting audits that can use Stage 1 context
- Lower priority than technical core
- Completes the full 6-domain coverage

### Stage 2 Checkpoint (MANDATORY)

**1. Verify output files exist:**

```bash
for f in audit-documentation-report.md audit-process-report.md; do
  if [ ! -s "docs/audits/comprehensive/$f" ]; then
    echo "❌ MISSING: $f - re-run agent"
  else
    echo "✅ $f exists"
  fi
done
```

**2. Display Stage 2 Summary:**

```
✅ Stage 2 Complete (Supporting)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Documentation   (X findings)
  ✅ Process/Auto    (X findings)

All 6 audits complete. Proceeding to aggregation...
```

---

## Stage 3: Aggregation Phase

**Launch Aggregator Agent**

Use Task tool to spawn `audit-aggregator` agent:

```javascript
Task({
  subagent_type: "audit-aggregator",
  description: "Aggregate and deduplicate audit results",
  prompt: `
Read all 6 audit reports from docs/audits/comprehensive/

Perform:
1. Deduplicate findings (same file:line across multiple audits → merge)
2. Identify cross-cutting patterns (files appearing in 3+ audits)
3. Priority ranking (severity × cross-domain count × effort)
4. Generate executive summary with top 20 findings

Output to: docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md
  `,
});
```

**Expected Output:**

- `docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md` (unified report)

**Wait for aggregator to complete** (typically 3-5 minutes)

### Stage 3 Checkpoint (MANDATORY)

After aggregator completes, verify:

```bash
if [ ! -s "docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md" ]; then
  echo "❌ Aggregation failed - report not generated"
  echo "Individual reports still available for manual review"
else
  echo "✅ Comprehensive report generated"
fi
```

---

## Final Report Structure

The `COMPREHENSIVE_AUDIT_REPORT.md` should contain:

### Executive Summary

- Total unique findings (after deduplication)
- Severity breakdown (S0: X, S1: Y, S2: Z, S3: W)
- Top 3 cross-domain insights
- Recommended fix order
- Effort estimate (total hours)

### Priority-Ranked Findings (Top 20)

Table format:

| Rank | ID       | Severity | Domains | File:Line  | Description        | Effort |
| ---- | -------- | -------: | ------: | ---------- | ------------------ | -----: |
| 1    | COMP-001 |       S0 |       3 | auth.ts:45 | Missing auth check |     E1 |
| ...  | ...      |      ... |     ... | ...        | ...                |    ... |

### Cross-Domain Insights

Examples:

- "Files X, Y, Z appear in 4+ audits → Comprehensive refactor needed"
- "Security + Performance overlap: 12 findings where fixing one helps both"
- "Documentation gaps align with code complexity hotspots"

### Full Findings (Deduplicated)

Complete table of all findings grouped by severity, with links to original audit
reports.

### Appendix

- Links to individual audit reports
- Baseline metrics snapshot
- False positives excluded (count)

---

## Post-Audit (MANDATORY)

**After aggregation completes, you MUST update tracking:**

### 1. Update AUDIT_TRACKER.md

Add an entry to **each of the 6 category tables** in `docs/AUDIT_TRACKER.md`:

| Date    | Session       | Commits Covered | Files Covered | Findings                     | Reset Threshold |
| ------- | ------------- | --------------- | ------------- | ---------------------------- | --------------- |
| {TODAY} | Comprehensive | Full codebase   | All           | Session #{N} - [report link] | ✅ (all)        |

### 2. Update Threshold Summary Table

In the "Current Thresholds" section, update all 6 categories:

- Set "Last Audit" to today's date with "(Comprehensive)"
- Reset "Commits Since" to 0
- Reset "Files Since" to 0

### 3. Update Multi-AI Thresholds

In the "Multi-AI Audit Thresholds" section:

- Update "Total commits" reset date to today
- Update "Time elapsed" to "0 days (comprehensive audit {TODAY})"

**This step ensures `npm run review:check` correctly shows no triggers after the
audit.**

---

## Completion

**Display Final Summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 COMPREHENSIVE AUDIT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Results Summary:
   • 142 raw findings → 97 unique (45 merged)
   • S0 Critical: 3
   • S1 High: 24
   • S2 Medium: 42
   • S3 Low: 28

🔍 Cross-Domain Insights:
   • 8 files need comprehensive refactor (4+ audits)
   • 12 security/performance overlaps
   • 5 documentation gaps in complex areas

📄 Full Report:
   docs/audits/comprehensive/COMPREHENSIVE_AUDIT_REPORT.md

⏱️  Total Time: ~45 minutes
   (vs 150 minutes sequential - saved ~105 minutes!)

🎯 Recommended Next Steps:
   1. Review top 20 priority findings
   2. Create GitHub issues for S0/S1
   3. Plan refactor for hotspot files
```

---

## Error Handling

**If Individual Audit Fails:**

- Continue with remaining audits in the same stage
- Mark failed audit in status display (❌)
- Note failure in final report
- Suggest running failed audit individually for debugging

**If Aggregator Fails:**

- All individual reports still available
- User can manually review 6 separate reports
- Suggest creating GitHub issue for aggregator failure

**If All Audits Fail:**

- Check baseline environment (tests passing, lint working)
- Check for system issues (disk space, memory)
- Suggest running single audit first to isolate issue

---

## Context Recovery

If context compacts mid-audit, resume from last completed checkpoint:

### Determine Current State

```bash
echo "=== Checking audit progress ==="
ls -la docs/audits/comprehensive/*.md 2>/dev/null | wc -l
```

### Recovery Matrix

| Files Found                 | State              | Resume Action                 |
| --------------------------- | ------------------ | ----------------------------- |
| 0-3 reports                 | Stage 1 incomplete | Re-run missing Stage 1 audits |
| 4 reports                   | Stage 1 complete   | Start Stage 2                 |
| 5 reports                   | Stage 2 incomplete | Re-run missing Stage 2 audit  |
| 6 reports, no COMPREHENSIVE | Stage 2 complete   | Run Stage 3 (aggregator)      |
| COMPREHENSIVE exists        | Complete           | Run post-audit only           |

### Resume Commands

**Stage 1 incomplete:** Re-run only missing audits:

```bash
# Check which are missing
for audit in code security performance refactoring; do
  [ ! -f "docs/audits/comprehensive/audit-${audit}-report.md" ] && echo "Missing: $audit"
done
```

**Stage 2 incomplete:** Run documentation and/or process audits as needed.

**Stage 3:** Run aggregator on existing 6 reports.

---

## Usage Examples

**Quarterly Health Check:**

```
/audit-comprehensive
```

**Pre-Release Audit:**

```
/audit-comprehensive
```

**After Major Refactor:**

```
/audit-comprehensive
```

**Focused Audit (Not Comprehensive):**

Use individual skills instead:

```
/audit-security   (25 min - when you only need security review)
/audit-code       (30 min - when you only need code quality)
```

---

## Notes

- **Staged Execution:** 3 stages (4+2+1 agents) respects CLAUDE.md max 4
  concurrent limit
- **Time Estimate:** ~45 minutes (vs 150min sequential = 70% savings)
- **S0/S1 Escalation:** Security findings checked after Stage 1 before
  proceeding
- **Checkpoints:** Each stage verifies outputs exist and are non-empty
- **Context Recovery:** Can resume from any checkpoint after context compaction
- **Output Consistency:** All audits use same severity (S0-S3) and effort
  (E0-E3) scales

---

## Future Enhancements

- [ ] **Incremental Audits:** Only re-run audits for changed domains
- [ ] **Custom Audit Subset:** `--audits code,security` to run subset
- [ ] **Confidence Scoring:** Weight findings by audit confidence levels
- [ ] **Trend Analysis:** Compare against previous comprehensive audits
- [ ] **Auto-Issue Creation:** Create GitHub issues for S0/S1 findings
      automatically

---

## Related Skills

- `/audit-code` - Individual code quality audit
- `/audit-security` - Individual security audit
- `/audit-performance` - Individual performance audit
- `/audit-documentation` - Individual documentation audit
- `/audit-refactoring` - Individual refactoring audit
- `/audit-process` - Individual process/automation audit
- `/audit-aggregator` - Standalone aggregation (if you have existing reports)

---

## Documentation References

Before running this audit, review:

### TDMS Integration (Required)

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [MASTER_DEBT.jsonl](docs/technical-debt/MASTER_DEBT.jsonl) - Canonical debt
  store
- All individual audits automatically run TDMS intake after completion

### Documentation Standards (Required)

- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) - Output
  format requirements and TDMS field mapping (used by aggregator)
- [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md) - 5-tier doc
  hierarchy

---

## Version History

| Version | Date       | Description                                                               |
| ------- | ---------- | ------------------------------------------------------------------------- |
| 2.0     | 2026-02-02 | Staged execution (4+2+1), S0/S1 escalation, checkpoints, context recovery |
| 1.0     | 2026-01-28 | Initial version - flat parallel execution of all 6 audits                 |
