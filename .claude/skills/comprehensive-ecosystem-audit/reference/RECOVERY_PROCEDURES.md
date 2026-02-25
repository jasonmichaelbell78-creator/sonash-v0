<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Ecosystem Audit Recovery Procedures

How to recover from interruptions during a comprehensive ecosystem audit. Covers
context compaction recovery, progress file management, stage resumption, and
handling missing result files.

---

## Table of Contents

- [Overview](#overview)
- [Interruption Types](#interruption-types)
- [Progress File](#progress-file)
- [Recovery Matrix](#recovery-matrix)
- [Recovery by Stage](#recovery-by-stage)
- [Missing Result Files](#missing-result-files)
- [Prevention Strategies](#prevention-strategies)

---

## Overview

The comprehensive ecosystem audit is a multi-stage operation (2 agent waves +
aggregation) that takes approximately 30 minutes. It may be interrupted by:

- **Context compaction** -- Claude's context resets mid-audit
- **Agent failures** -- Individual audit agents crash or timeout
- **User cancellation** -- User stops the audit partway through
- **System issues** -- Network problems, disk space, etc.

**Key principle:** The progress file at
`.claude/tmp/comprehensive-ecosystem-audit-progress.json` tracks exactly which
stages and audits have completed, enabling precise resumption.

---

## Interruption Types

### Type 1: Context Compaction (Most Common)

**Symptom:** Agent loses context between stages or mid-stage.

**Indicators:**

- Orchestrator does not remember which audits have been launched
- Shell variables (like loop counters) are lost
- Agent asks about audit state it should already know

**Impact:** Moderate -- can resume from progress file.

**Recovery time:** 2-5 minutes (read progress, resume from correct stage).

### Type 2: Agent Failure

**Symptom:** One or more audit agents fail to produce output.

**Indicators:**

- Agent returns an error message instead of the COMPLETE line
- Result file is missing or contains invalid JSON
- Agent times out (no response after 10 minutes)

**Impact:** Low -- mark failed audit, continue with others.

**Recovery time:** 0 minutes (handled automatically during execution).

### Type 3: User Cancellation

**Symptom:** User interrupts the audit before all stages complete.

**Indicators:**

- Progress file exists with some stages incomplete
- Some result files exist, others do not

**Impact:** Low -- resume from last completed stage on next invocation.

**Recovery time:** Depends on remaining stages.

---

## Progress File

### Location

`.claude/tmp/comprehensive-ecosystem-audit-progress.json`

### Schema

```json
{
  "started": "2026-02-24T10:00:00Z",
  "lastUpdated": "2026-02-24T10:20:00Z",
  "stages": {
    "1": {
      "status": "completed",
      "audits": {
        "hook": "completed",
        "session": "completed",
        "tdms": "failed",
        "pr": "completed"
      }
    },
    "2": {
      "status": "pending",
      "audits": {
        "skill": "pending",
        "doc": "pending",
        "script": "pending"
      }
    },
    "3": { "status": "pending" }
  },
  "results": {
    "hook": {
      "grade": "B",
      "score": 82,
      "errors": 5,
      "warnings": 18,
      "info": 12
    },
    "session": {
      "grade": "A",
      "score": 91,
      "errors": 1,
      "warnings": 8,
      "info": 5
    },
    "tdms": null,
    "pr": {
      "grade": "C",
      "score": 74,
      "errors": 8,
      "warnings": 22,
      "info": 15
    },
    "skill": null,
    "doc": null,
    "script": null
  },
  "errors": {
    "tdms": "Script exited with code 1: Cannot find module 'checkers/tdms-schema'"
  }
}
```

### Staleness Check

The progress file is considered stale if it is more than 2 hours old:

```bash
# Check if progress file exists and is fresh
PROG_FILE=".claude/tmp/comprehensive-ecosystem-audit-progress.json"
if [ -f "$PROG_FILE" ]; then
  # Get file age in seconds
  FILE_AGE=$(( $(date +%s) - $(date -r "$PROG_FILE" +%s) ))
  if [ "$FILE_AGE" -lt 7200 ]; then
    echo "FRESH: Progress file is $(( FILE_AGE / 60 )) minutes old"
  else
    echo "STALE: Progress file is $(( FILE_AGE / 3600 )) hours old — start fresh"
  fi
else
  echo "NONE: No progress file — start fresh"
fi
```

If stale, delete the progress file and any leftover result files, then start
from Stage 1.

---

## Recovery Matrix

| Progress State                    | Result Files Present   | Action                                    |
| --------------------------------- | ---------------------- | ----------------------------------------- |
| No progress file                  | None                   | Start from Stage 1                        |
| Stage 1 pending, 0 audits done    | None                   | Start Stage 1 from scratch                |
| Stage 1 pending, some audits done | Some Stage 1           | Re-run only pending/failed Stage 1 audits |
| Stage 1 complete, Stage 2 pending | All Stage 1            | Start Stage 2                             |
| Stage 2 pending, some audits done | Stage 1 + some Stage 2 | Re-run only pending/failed Stage 2 audits |
| Stage 2 complete, Stage 3 pending | All Stage 1 + 2        | Run Stage 3 (aggregation)                 |
| Stage 3 complete                  | Report exists          | Display final report (already done)       |
| Progress file stale (> 2 hours)   | Any                    | Delete all, start fresh                   |

---

## Recovery by Stage

### Resuming Stage 1

If Stage 1 is partially complete (some audits done, others pending/failed):

1. Read progress file to identify which audits completed
2. Check that result files exist for completed audits:
   ```bash
   for name in hook session tdms pr; do
     if [ -f ".claude/tmp/ecosystem-${name}-result.json" ]; then
       echo "EXISTS: $name"
     else
       echo "MISSING: $name"
     fi
   done
   ```
3. If a completed audit's result file is missing, mark it as "pending" again
4. Launch Task agents only for pending/failed audits
5. After all agents return, update progress file and proceed to Stage 2

### Resuming Stage 2

If Stage 1 is complete and Stage 2 is partially complete:

1. Verify Stage 1 result files still exist
2. Read progress file to identify which Stage 2 audits completed
3. Check result files for completed Stage 2 audits
4. Launch Task agents only for pending/failed audits
5. After all agents return, update progress file and proceed to Stage 3

### Resuming Stage 3

If both Stage 1 and 2 are complete but Stage 3 (aggregation) has not run:

1. Verify all result files exist
2. Run aggregation directly (no agents needed)
3. Generate the report
4. Clean up temp files

### Already Complete

If Stage 3 is marked complete:

1. Check if `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` exists in the project root
2. If yes, display it and confirm completion
3. If no, mark Stage 3 as pending and re-run aggregation

---

## Missing Result Files

Sometimes a result file may be missing even though the progress file says the
audit completed. This can happen if:

- The file was accidentally deleted
- A disk issue occurred
- Another process cleaned up `.claude/tmp/`

### Detection

```bash
# Verify all expected result files
MISSING=""
for name in hook session tdms pr skill doc script; do
  file=".claude/tmp/ecosystem-${name}-result.json"
  if [ -f "$file" ]; then
    # Also verify it's valid JSON
    node -e "JSON.parse(require('fs').readFileSync('${file}', 'utf8'))" 2>/dev/null
    if [ $? -ne 0 ]; then
      echo "INVALID: $name (corrupt JSON)"
      MISSING="$MISSING $name"
    else
      echo "OK: $name"
    fi
  else
    echo "MISSING: $name"
    MISSING="$MISSING $name"
  fi
done

if [ -n "$MISSING" ]; then
  echo "NEED RE-RUN:$MISSING"
fi
```

### Recovery

1. Update progress file to mark the missing audit as "pending"
2. Re-run only that specific audit agent
3. Continue with aggregation after the re-run completes

### If All Result Files Are Missing

If context compaction or cleanup deleted everything:

1. Delete the stale progress file
2. Start the entire audit from scratch
3. This is rare -- the progress file and result files are in the same directory

---

## Prevention Strategies

### 1. Save Progress Frequently

Write progress.json after every significant state change:

- After initializing the audit
- After each agent returns (whether success or failure)
- After completing each stage
- After generating the report

### 2. Use --batch Flag

The `--batch` flag on audit scripts suppresses state writes, which:

- Reduces disk I/O during the audit
- Prevents audit scripts from modifying their own state files
- Keeps the audit non-destructive

### 3. Minimize Context Usage

The CRITICAL RETURN PROTOCOL ensures agents return only a single summary line,
preventing context overflow that could trigger compaction.

### 4. Check Result Files Before Aggregation

Always verify that result files exist and contain valid JSON before starting
aggregation. A corrupt result file will cause aggregation to fail.

### 5. Atomic Stage Transitions

Update the progress file to mark a stage as "completed" only after verifying all
result files for that stage. This prevents a false "completed" state if an agent
returned a COMPLETE line but failed to write the result file.

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-24 | Initial implementation |
