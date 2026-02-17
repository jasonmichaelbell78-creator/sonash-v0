<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Audit Recovery Procedures

Complete guide for recovering from interruptions during a comprehensive audit.
This document covers context recovery, checkpoint management, state file
handling, and stage resumption strategies.

---

## Table of Contents

- [Overview](#overview)
- [Interruption Types](#interruption-types)
- [Recovery Matrix](#recovery-matrix)
- [State File Locations](#state-file-locations)
- [Checkpoint Format](#checkpoint-format)
- [Recovery by Stage](#recovery-by-stage)
- [Partial Results Handling](#partial-results-handling)
- [Variable Recovery](#variable-recovery)
- [Error Recovery](#error-recovery)
- [Prevention Strategies](#prevention-strategies)

---

## Overview

Comprehensive audits are long-running operations (65+ minutes) that may be
interrupted by:

- **Context compaction** - Claude's memory resets mid-audit
- **Agent failures** - Individual audit agents error out
- **User cancellation** - User stops audit partway through
- **System issues** - Network problems, disk space, etc.

**Key principle:** Each stage writes checkpoint files so audits can resume from
the last completed stage, not from the beginning.

---

## Interruption Types

### Type 1: Context Compaction (Most Common)

**Symptom:** Agent loses context mid-stage or between stages.

**Indicators:**

- Environment variables (AUDIT_DIR) are empty
- Agent doesn't remember prior stage results
- Checkpoint files exist but agent can't find them

**Impact:** Moderate - Can resume from checkpoint

**Recovery time:** 5-10 minutes (to identify state and resume)

### Type 2: Agent Failure

**Symptom:** One or more audit agents fail to produce output.

**Indicators:**

- Missing report files (e.g., `security-audit.md` doesn't exist)
- Empty report files (0 bytes)
- Error messages in agent output

**Impact:** Low-Moderate - Re-run failed audit only

**Recovery time:** 15-25 minutes (time for one audit)

### Type 3: User Cancellation

**Symptom:** User interrupts audit before completion.

**Indicators:**

- User sends stop command
- User closes terminal
- User starts new task

**Impact:** Low - Partial results are usable

**Recovery time:** 0 minutes (user decision to resume or not)

### Type 4: System Failure

**Symptom:** Infrastructure issues prevent audit from completing.

**Indicators:**

- Disk full errors
- Out of memory errors
- Network timeout errors
- Rate limiting from external APIs

**Impact:** High - May need system fixes before resuming

**Recovery time:** Varies (depends on system issue)

---

## Recovery Matrix

| Checkpoint Files Found | Stage Status   | Resume Action       | Time to Complete |
| ---------------------- | -------------- | ------------------- | ---------------- |
| None                   | Not started    | Run from Stage 1    | 65 min           |
| `.checkpoint-stage1`   | Stage 1 done   | Skip to Stage 2     | 40 min           |
| `.checkpoint-stage2`   | Stage 2 done   | Skip to Stage 2.5   | 20 min           |
| `.checkpoint-stage2.5` | Stage 2.5 done | Skip to Stage 4     | 5 min            |
| `.checkpoint-stage4`   | Complete       | Run post-audit only | 2 min            |

### Recovery Decision Tree

```
┌─────────────────────────────────┐
│ Audit interrupted - determine   │
│ recovery point                  │
└───────────────┬─────────────────┘
                │
        ┌───────┴───────┐
        │ Check for     │
        │ checkpoint    │
        │ files         │
        └───────┬───────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌───────────┐       ┌───────────────┐
│ No files  │       │ Files found   │
│ found     │       │               │
└─────┬─────┘       └───────┬───────┘
      │                     │
      ▼                     ▼
┌───────────┐       ┌───────────────┐
│ Start     │       │ Identify last │
│ from      │       │ completed     │
│ Stage 1   │       │ stage         │
└───────────┘       └───────┬───────┘
                            │
                    ┌───────┴────────────┬────────────┬────────────┐
                    ▼                    ▼            ▼            ▼
            ┌───────────────┐    ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Stage 1 done  │    │ Stage 2  │ │ Stage 2.5│ │ Stage 4  │
            │ Resume Stage 2│    │ done     │ │ done     │ │ done     │
            └───────────────┘    └────┬─────┘ └────┬─────┘ └────┬─────┘
                                      │            │            │
                                      ▼            ▼            ▼
                                ┌──────────┐ ┌──────────┐ ┌──────────┐
                                │ Stage 2.5│ │ Stage 4  │ │ Post-    │
                                └──────────┘ └──────────┘ │ audit    │
                                                           └──────────┘
```

---

## State File Locations

### Primary State Directory

All state files are written to `.claude/state/` to survive context compaction.

**Directory structure:**

```
.claude/state/
├── audit-session.env           # Environment variables (AUDIT_DIR, AUDIT_DATE)
├── audit-progress.txt          # Human-readable progress summary
└── audit-metadata.json         # Structured metadata for recovery
```

### Checkpoint Files (in Audit Directory)

Checkpoints are written to the audit output directory for quick verification.

**Location pattern:**

```
docs/audits/comprehensive/audit-YYYY-MM-DD/
├── .checkpoint-stage1          # Stage 1 complete timestamp
├── .checkpoint-stage2          # Stage 2 complete timestamp
├── .checkpoint-stage2.5        # Stage 2.5 complete timestamp
├── .checkpoint-stage4          # Stage 4 complete timestamp
└── escalation-decisions.txt    # S0/S1 escalation decisions
```

### Report Files

Individual audit reports are the source of truth for completed audits.

**File pattern:**

```
docs/audits/comprehensive/audit-YYYY-MM-DD/
├── code-audit.md
├── security-audit.md
├── performance-audit.md
├── refactoring-audit.md
├── documentation-audit.md
├── process-audit.md
├── engineering-productivity-audit.md
├── enhancements-audit.md
├── ai-optimization-audit.md
└── COMPREHENSIVE_AUDIT_REPORT.md
```

---

## Checkpoint Format

### audit-session.env

**Purpose:** Persist critical environment variables across context compaction.

**Format:**

```bash
# Audit Session Environment Variables
# Generated: 2026-02-16T14:30:00Z

AUDIT_DATE=2026-02-16
AUDIT_DIR=/home/user/sonash-v0/docs/audits/comprehensive/audit-2026-02-16
AUDIT_START_TIME=2026-02-16T14:30:00Z
AUDIT_MODE=subagent
```

**Recovery usage:**

```bash
# Restore variables after compaction
source .claude/state/audit-session.env
echo "Recovered AUDIT_DIR: ${AUDIT_DIR}"
```

### audit-metadata.json

**Purpose:** Structured metadata for programmatic recovery.

**Format:**

```json
{
  "audit_id": "audit-2026-02-16",
  "started_at": "2026-02-16T14:30:00Z",
  "mode": "subagent",
  "stages": {
    "stage1": {
      "status": "complete",
      "completed_at": "2026-02-16T14:55:00Z",
      "reports": [
        "code-audit.md",
        "security-audit.md",
        "performance-audit.md",
        "refactoring-audit.md"
      ],
      "findings_count": 151,
      "s0_s1_escalation": "continue"
    },
    "stage2": {
      "status": "in_progress",
      "started_at": "2026-02-16T14:56:00Z",
      "reports": ["documentation-audit.md", "process-audit.md"],
      "missing": ["engineering-productivity-audit.md"]
    }
  }
}
```

### .checkpoint-stageN

**Purpose:** Quick file-based checkpoint for bash scripts.

**Format:**

```
STAGE_1_COMPLETE=2026-02-16T14:55:00Z
```

---

## Recovery by Stage

### Stage 1 Recovery (Foundation)

**Expected state:** 4 reports should exist

- `code-audit.md`
- `security-audit.md`
- `performance-audit.md`
- `refactoring-audit.md`

**Recovery script:**

```bash
#!/bin/bash
# Recover Stage 1 state

# Restore environment
source .claude/state/audit-session.env

# Check which reports exist
MISSING_REPORTS=""
for report in code security performance refactoring; do
  if [ ! -s "${AUDIT_DIR}/${report}-audit.md" ]; then
    MISSING_REPORTS="${MISSING_REPORTS} ${report}"
  fi
done

if [ -z "${MISSING_REPORTS}" ]; then
  echo "Stage 1 COMPLETE - all 4 reports found"
  echo "Resume from: Stage 2"
else
  echo "Stage 1 INCOMPLETE - missing:${MISSING_REPORTS}"
  echo "Re-run: /audit-${MISSING_REPORTS// / /audit-}"
fi
```

**Resume action:**

- **All 4 reports exist** → Skip to Stage 2
- **1-3 reports missing** → Re-run only missing audits
- **0 reports exist** → Start from Stage 1

### Stage 2 Recovery (Structure)

**Expected state:** 7 reports should exist (Stage 1 + Stage 2)

- Stage 1: 4 reports (code, security, performance, refactoring)
- Stage 2: 3 reports (documentation, process, engineering-productivity)

**Recovery script:**

```bash
#!/bin/bash
# Recover Stage 2 state

source .claude/state/audit-session.env

# Verify Stage 1 complete
if [ ! -f "${AUDIT_DIR}/.checkpoint-stage1" ]; then
  echo "ERROR: Stage 1 not complete - run Stage 1 first"
  exit 1
fi

# Check Stage 2 reports
MISSING_REPORTS=""
for report in documentation process engineering-productivity; do
  if [ ! -s "${AUDIT_DIR}/${report}-audit.md" ]; then
    MISSING_REPORTS="${MISSING_REPORTS} ${report}"
  fi
done

if [ -z "${MISSING_REPORTS}" ]; then
  echo "Stage 2 COMPLETE - all 3 reports found"
  echo "Resume from: Stage 2.5"
else
  echo "Stage 2 INCOMPLETE - missing:${MISSING_REPORTS}"
  echo "Re-run only missing audits"
fi
```

**Resume action:**

- **All 7 reports exist** → Skip to Stage 2.5
- **4-6 reports exist** → Re-run missing Stage 2 audits
- **Only 4 reports exist** → Start Stage 2 from beginning

### Stage 2.5 Recovery (Meta & Enhancement)

**Expected state:** 9 reports should exist (Stages 1+2+2.5)

- Stages 1+2: 7 reports
- Stage 2.5: 2 reports (enhancements, ai-optimization)

**Recovery script:**

```bash
#!/bin/bash
# Recover Stage 2.5 state

source .claude/state/audit-session.env

# Verify Stages 1 and 2 complete
if [ ! -f "${AUDIT_DIR}/.checkpoint-stage2" ]; then
  echo "ERROR: Stage 2 not complete - run Stage 2 first"
  exit 1
fi

# Check Stage 2.5 reports
MISSING_REPORTS=""
for report in enhancements ai-optimization; do
  if [ ! -s "${AUDIT_DIR}/${report}-audit.md" ]; then
    MISSING_REPORTS="${MISSING_REPORTS} ${report}"
  fi
done

if [ -z "${MISSING_REPORTS}" ]; then
  echo "Stage 2.5 COMPLETE - all 2 reports found"
  echo "Resume from: Stage 4 (Aggregation)"
else
  echo "Stage 2.5 INCOMPLETE - missing:${MISSING_REPORTS}"
  echo "Re-run only missing audits"
fi
```

**Resume action:**

- **All 9 reports exist** → Skip to Stage 4 (Aggregation)
- **7-8 reports exist** → Re-run missing Stage 2.5 audits
- **Only 7 reports exist** → Start Stage 2.5 from beginning

### Stage 4 Recovery (Aggregation)

**Expected state:** 9 individual reports + 1 comprehensive report

- Individual: 9 domain audit reports
- Comprehensive: `COMPREHENSIVE_AUDIT_REPORT.md`

**Recovery script:**

```bash
#!/bin/bash
# Recover Stage 4 state

source .claude/state/audit-session.env

# Verify all 9 reports exist
REPORT_COUNT=$(ls -1 "${AUDIT_DIR}"/*-audit.md 2>/dev/null | wc -l)

if [ "${REPORT_COUNT}" -ne 9 ]; then
  echo "ERROR: Only ${REPORT_COUNT}/9 reports found"
  echo "Complete prior stages before aggregation"
  exit 1
fi

# Check if aggregation complete
if [ -f "${AUDIT_DIR}/COMPREHENSIVE_AUDIT_REPORT.md" ]; then
  echo "Stage 4 COMPLETE - comprehensive report exists"
  echo "Resume from: Post-audit tasks"
else
  echo "Stage 4 NOT STARTED - all inputs ready"
  echo "Run: /audit-aggregator"
fi
```

**Resume action:**

- **Comprehensive report exists** → Skip to post-audit tasks
- **9 reports but no comprehensive** → Run aggregator
- **Fewer than 9 reports** → Complete missing stages first

---

## Partial Results Handling

### Scenario: Only Stage 1 Complete

**What you have:** 4 audit reports (code, security, performance, refactoring)

**Options:**

1. **Complete the audit** - Resume Stage 2 and continue
2. **Use partial results** - Review Stage 1 findings only, defer rest
3. **Abort and retry later** - Save state and return later

**Recommendation:** Complete the audit if time permits. Partial audits miss
cross-domain insights.

### Scenario: Stages 1 and 2 Complete

**What you have:** 7 audit reports (all except enhancements and ai-optimization)

**Options:**

1. **Complete Stage 2.5** - Quick (15 min) to get full picture
2. **Skip to aggregation** - Aggregate 7 reports, note missing domains
3. **Use as-is** - Review individual reports without aggregation

**Recommendation:** Complete Stage 2.5. It's quick and provides valuable
enhancement insights.

### Scenario: All Reports But No Aggregation

**What you have:** 9 individual domain reports

**Options:**

1. **Run aggregator** - Quick (5 min) to get deduplication and cross-domain
   insights
2. **Manual review** - Review 9 reports individually (time-consuming)
3. **Defer aggregation** - Track individual findings, aggregate later

**Recommendation:** Always run aggregator. Deduplication and priority ranking
are critical.

---

## Variable Recovery

### AUDIT_DIR Recovery

**Problem:** Context compaction clears environment variables.

**Prevention:**

```bash
# Write to state file immediately after creation
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/comprehensive/audit-${AUDIT_DATE}"

# Validate
if [ -z "${AUDIT_DIR}" ] || [ "${AUDIT_DIR}" = "/" ]; then
  echo "FATAL: Invalid AUDIT_DIR"
  exit 1
fi

# Persist
mkdir -p .claude/state
echo "AUDIT_DIR=${AUDIT_DIR}" > .claude/state/audit-session.env
echo "AUDIT_DATE=${AUDIT_DATE}" >> .claude/state/audit-session.env
```

**Recovery:**

```bash
# After context compaction
if [ -z "${AUDIT_DIR}" ]; then
  echo "AUDIT_DIR lost - recovering from state file"
  source .claude/state/audit-session.env

  if [ -z "${AUDIT_DIR}" ]; then
    echo "FATAL: Cannot recover AUDIT_DIR"
    echo "Check .claude/state/audit-session.env or restart audit"
    exit 1
  fi

  echo "Recovered: AUDIT_DIR=${AUDIT_DIR}"
fi
```

### AUDIT_DATE Recovery

**Problem:** Date changes if audit spans multiple days.

**Solution:** Always use original audit date from state file, not current date.

```bash
# WRONG - This will use new date after midnight
AUDIT_DATE=$(date +%Y-%m-%d)

# CORRECT - Use original date from state file
source .claude/state/audit-session.env
# AUDIT_DATE is restored from state file
```

---

## Error Recovery

### Error: Missing Checkpoint Files

**Symptom:** State files deleted or corrupted.

**Recovery:**

```bash
# Reconstruct state from report files
AUDIT_DIR=$(find docs/audits/comprehensive -type d -name "audit-*" -mtime -1 | head -1)

if [ -z "${AUDIT_DIR}" ]; then
  echo "No recent audit directory found"
  exit 1
fi

# Count reports to determine stage
REPORT_COUNT=$(ls -1 "${AUDIT_DIR}"/*-audit.md 2>/dev/null | wc -l)

case ${REPORT_COUNT} in
  4)
    echo "Stage 1 complete - resume from Stage 2"
    echo "STAGE_1_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage1"
    ;;
  7)
    echo "Stage 2 complete - resume from Stage 2.5"
    echo "STAGE_2_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage2"
    ;;
  9)
    echo "Stage 2.5 complete - resume from Stage 4"
    echo "STAGE_2_5_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage2.5"
    ;;
  *)
    echo "Unexpected report count: ${REPORT_COUNT}"
    ;;
esac
```

### Error: Corrupted Report File

**Symptom:** Report file exists but contains errors or incomplete data.

**Recovery:**

```bash
# Identify corrupted file
REPORT="security-audit.md"

# Check file size (should be >1KB)
SIZE=$(stat -f%z "${AUDIT_DIR}/${REPORT}" 2>/dev/null || stat -c%s "${AUDIT_DIR}/${REPORT}")

if [ "${SIZE}" -lt 1000 ]; then
  echo "WARNING: ${REPORT} is suspiciously small (${SIZE} bytes)"
  echo "Recommend re-running: /audit-security"
fi

# Check for error markers
if grep -q "ERROR\|FAILED\|TIMEOUT" "${AUDIT_DIR}/${REPORT}"; then
  echo "WARNING: ${REPORT} contains error markers"
  echo "Recommend re-running: /audit-security"
fi
```

**Action:** Delete corrupted file and re-run that specific audit.

### Error: Agent Never Started

**Symptom:** Checkpoint file exists but corresponding report doesn't.

**Recovery:**

```bash
# This should never happen - checkpoint written after report
# If it does, checkpoint is invalid

# Clear invalid checkpoint
rm -f "${AUDIT_DIR}/.checkpoint-stage1"

# Re-run stage
echo "Invalid checkpoint detected - re-running Stage 1"
```

---

## Prevention Strategies

### Strategy 1: State File Redundancy

Write state to multiple locations:

- `.claude/state/audit-session.env` (survives compaction)
- `${AUDIT_DIR}/.audit-state` (in audit directory)
- `docs/audits/.last-audit` (project-level backup)

```bash
# Write to all three locations
echo "AUDIT_DIR=${AUDIT_DIR}" | tee \
  .claude/state/audit-session.env \
  "${AUDIT_DIR}/.audit-state" \
  docs/audits/.last-audit > /dev/null
```

### Strategy 2: Frequent Checkpoints

Write checkpoint after every stage completion, not just at end:

```bash
# After each stage
write_checkpoint() {
  local stage=$1
  echo "STAGE_${stage}_COMPLETE=$(date -Iseconds)" > "${AUDIT_DIR}/.checkpoint-stage${stage}"
  echo "Checkpoint written: stage ${stage}"
}

# Usage
write_checkpoint 1  # After Stage 1
write_checkpoint 2  # After Stage 2
```

### Strategy 3: Validation Before Proceeding

Always validate environment before launching agents:

```bash
validate_environment() {
  # Check AUDIT_DIR is set
  if [ -z "${AUDIT_DIR}" ]; then
    echo "ERROR: AUDIT_DIR not set"
    return 1
  fi

  # Check AUDIT_DIR exists
  if [ ! -d "${AUDIT_DIR}" ]; then
    echo "ERROR: AUDIT_DIR does not exist: ${AUDIT_DIR}"
    return 1
  fi

  # Check AUDIT_DIR is safe
  if [ "${AUDIT_DIR}" = "/" ] || [[ "${AUDIT_DIR}" == ".."* ]]; then
    echo "ERROR: Unsafe AUDIT_DIR: ${AUDIT_DIR}"
    return 1
  fi

  echo "Environment validated"
  return 0
}

# Before each stage
validate_environment || exit 1
```

### Strategy 4: Progress Logging

Write human-readable progress log:

```bash
log_progress() {
  local message=$1
  echo "[$(date -Iseconds)] ${message}" >> .claude/state/audit-progress.txt
}

# Usage
log_progress "Stage 1 started"
log_progress "Stage 1 complete - 4 reports, 151 findings"
log_progress "S1 escalation: user chose CONTINUE"
```

---

## Notes

- **Checkpoint first** - Always write checkpoint files before announcing stage
  completion
- **State file priority** - `.claude/state/` files survive compaction better
  than audit directory files
- **Re-run vs skip** - When in doubt, re-run the stage (better than partial
  data)
- **Manual recovery** - Sometimes manual review of report files is faster than
  automated recovery
- **Time estimates** - Recovery should take <10min to identify state and resume
- **Communication** - Always tell user what stage you're resuming from

---

**End of Recovery Procedures**
