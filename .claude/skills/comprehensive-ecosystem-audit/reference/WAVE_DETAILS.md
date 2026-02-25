<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Ecosystem Audit Wave Details

Complete reference for staged execution of the 7-audit ecosystem audit system.
This document provides detailed instructions for each stage, including exact
agent launch commands, checkpoint verification, and error handling.

---

## Table of Contents

- [Stage Architecture](#stage-architecture)
- [Stage 1: Foundation Audits](#stage-1-foundation-audits)
- [Stage 2: Extended Audits](#stage-2-extended-audits)
- [Stage 3: Aggregation](#stage-3-aggregation)
- [Checkpoint Verification](#checkpoint-verification)
- [Error Handling](#error-handling)

---

## Stage Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Pre-Flight: Check progress file, verify audit scripts exist  │
└───────────────────────┬──────────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          │  Stage 1: Foundation       │
          │  ┌───────────────────────┐ │
          │  │ hook-ecosystem       │ │  4 agents parallel
          │  │ session-ecosystem    │ │  Time: ~10-15 min
          │  │ tdms-ecosystem       │ │
          │  │ pr-ecosystem         │ │
          │  └───────────────────────┘ │
          │  Checkpoint: 4 result files │
          └─────────────┬──────────────┘
                        │
          ┌─────────────┴──────────────┐
          │  Stage 2: Extended         │
          │  ┌───────────────────────┐ │
          │  │ skill-ecosystem      │ │  3 agents parallel
          │  │ doc-ecosystem        │ │  Time: ~10-15 min
          │  │ script-ecosystem     │ │
          │  └───────────────────────┘ │
          │  Checkpoint: 3 result files │
          └─────────────┬──────────────┘
                        │
          ┌─────────────┴──────────────┐
          │  Stage 3: Aggregation      │
          │  Sequential (orchestrator)  │
          │  - Compute weighted score  │  Time: ~5 min
          │  - Build domain heat map   │
          │  - Generate report         │
          │  - Cleanup temp files      │
          └────────────────────────────┘
```

---

## Stage 1: Foundation Audits

### Agent Launch Commands

Launch all 4 agents simultaneously using the Task tool. Each agent gets an
identical prompt structure with only the audit name and script path varying.

**Agent 1 -- Hook Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout (progress messages go to stderr, ignore those).

3. Write the full JSON output to: .claude/tmp/ecosystem-hook-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: hook grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
The orchestrator will read the result file directly.
```

**Agent 2 -- Session Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout.

3. Write the full JSON output to: .claude/tmp/ecosystem-session-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: session grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
```

**Agent 3 -- TDMS Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout.

3. Write the full JSON output to: .claude/tmp/ecosystem-tdms-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: tdms grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
```

**Agent 4 -- PR Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout.

3. Write the full JSON output to: .claude/tmp/ecosystem-pr-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: pr grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
```

### Stage 1 Checkpoint Verification

After all 4 agents return, verify results:

```bash
# Verify all 4 result files exist and are non-empty
for name in hook session tdms pr; do
  file=".claude/tmp/ecosystem-${name}-result.json"
  if [ -f "$file" ]; then
    size=$(wc -c < "$file")
    echo "OK: $name ($size bytes)"
  else
    echo "MISSING: $name"
  fi
done
```

**Expected output:** 4 lines, all starting with "OK".

If any file is missing, mark that audit as "failed" in progress.json and
continue to Stage 2. The failed audit will be noted in the final report.

---

## Stage 2: Extended Audits

### Agent Launch Commands

Launch 3 agents simultaneously.

**Agent 5 -- Skill Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout.

3. Write the full JSON output to: .claude/tmp/ecosystem-skill-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: skill grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
```

**Agent 6 -- Doc Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout.

3. Write the full JSON output to: .claude/tmp/ecosystem-doc-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: doc grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
```

**Agent 7 -- Script Ecosystem Audit:**

```
You are running an ecosystem audit as part of a comprehensive audit.

1. Run this command:
   node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js --batch --summary

2. Capture the JSON output from stdout.

3. Write the full JSON output to: .claude/tmp/ecosystem-script-result.json

4. Parse the JSON to extract: grade, score, error count, warning count, info count.

5. Return ONLY this single line — nothing else:
   COMPLETE: script grade {grade} score {score} errors {N} warnings {N} info {N}

CRITICAL: Do NOT include the full JSON, findings, or any other text in your response.
```

### Stage 2 Checkpoint Verification

```bash
# Verify all 3 result files exist and are non-empty
for name in skill doc script; do
  file=".claude/tmp/ecosystem-${name}-result.json"
  if [ -f "$file" ]; then
    size=$(wc -c < "$file")
    echo "OK: $name ($size bytes)"
  else
    echo "MISSING: $name"
  fi
done
```

---

## Stage 3: Aggregation

No agents are launched in this stage. The orchestrator performs aggregation
directly. See [AGGREGATION_GUIDE.md](AGGREGATION_GUIDE.md) for the full
computation procedure.

### Quick Summary Extraction

To read only summary data without loading full findings:

```bash
# Extract summary from each result file (minimal context usage)
for name in hook session tdms pr skill doc script; do
  file=".claude/tmp/ecosystem-${name}-result.json"
  if [ -f "$file" ]; then
    node -e "
      const d = require('./${file}');
      console.log(JSON.stringify({
        name: '${name}',
        grade: d.grade,
        score: d.score,
        errors: d.summary?.errors ?? d.summary?.errorCount ?? 0,
        warnings: d.summary?.warnings ?? d.summary?.warningCount ?? 0,
        info: d.summary?.info ?? d.summary?.infoCount ?? 0,
        topFindings: (d.findings || []).slice(0, 3).map(f => ({
          severity: f.severity,
          category: f.category,
          message: f.message || f.title,
          impactScore: f.impactScore
        }))
      }, null, 2));
    "
  fi
done
```

### Cleanup Commands

After the report is generated:

```bash
# Remove temporary result files
rm -f .claude/tmp/ecosystem-hook-result.json
rm -f .claude/tmp/ecosystem-session-result.json
rm -f .claude/tmp/ecosystem-tdms-result.json
rm -f .claude/tmp/ecosystem-pr-result.json
rm -f .claude/tmp/ecosystem-skill-result.json
rm -f .claude/tmp/ecosystem-doc-result.json
rm -f .claude/tmp/ecosystem-script-result.json
rm -f .claude/tmp/comprehensive-ecosystem-audit-progress.json
```

---

## Error Handling

### Individual Audit Failure

If one audit agent fails (returns an error, crashes, or produces no output):

1. **Do not retry automatically** -- the audit script may have a real issue
2. Mark the audit as "failed" in progress.json with the error message
3. Continue with the remaining audits in the current stage
4. In the final report, list the failed audit under "Failed Audits" appendix
5. Compute the weighted average using only successful audits (re-normalize
   weights to sum to 100%)

**Weight re-normalization example:**

If the session audit (10%) fails, redistribute its weight proportionally:

- Original: hook=15, session=10, tdms=15, pr=15, skill=20, doc=10, script=15
- Remaining total: 90%
- Adjusted: hook=16.7, tdms=16.7, pr=16.7, skill=22.2, doc=11.1, script=16.7

### All Audits in a Stage Fail

If all audits in a stage fail:

1. Save progress with all audits marked "failed"
2. Log the errors
3. Continue to the next stage (the other stage's audits are independent)
4. If both stages fail completely, skip aggregation and report the failure

### Agent Timeout

If an agent does not return within 10 minutes:

1. Check if the result file was written (agent may have succeeded but failed to
   return the summary line)
2. If the result file exists and is valid JSON, treat as success
3. If no result file, mark as failed

### Invalid JSON Output

If a result file contains invalid JSON:

1. Try to extract partial data (grade, score) from the raw output
2. If extraction fails, mark the audit as "failed"
3. Note "invalid output" as the failure reason

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-24 | Initial implementation |
