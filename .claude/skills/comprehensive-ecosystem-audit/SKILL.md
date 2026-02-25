---
name: comprehensive-ecosystem-audit
description: |
  Orchestrates all 7 ecosystem audits in staged waves with 4-concurrent-agent
  limit, aggregates results into a unified health report with cross-audit
  insights, domain heat maps, and priority-ranked findings.
supports_parallel: true
fallback_available: false
estimated_time_parallel: 30 min
estimated_time_sequential: 90 min
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Ecosystem Audit

Orchestrates all 7 ecosystem audits (hook, session, TDMS, PR, skill, doc,
script) in 2 staged waves, aggregates results into a unified health report with
cross-audit insights, domain heat maps, and priority-ranked findings.

**Invocation:** `/comprehensive-ecosystem-audit`

**What This Does:** Spawns 7 specialized audit agents across 2 waves (4+3,
respecting max 4 concurrent limit), collects their JSON output, computes a
weighted composite health grade, identifies cross-audit patterns, and generates
a comprehensive report.

**Output:** `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` in the project root.

---

## CRITICAL RULES (Read First)

1. **CHECK for saved progress first** -- resume from
   `.claude/tmp/comprehensive-ecosystem-audit-progress.json` if it exists and is
   < 2 hours old. Never re-run audits that already completed.
2. **Run audits via their npm scripts / node commands, NOT by reading checker
   code directly.** The scripts produce structured JSON output that this skill
   consumes.
3. **CRITICAL RETURN PROTOCOL:** When launching audit agents via Task tool, each
   agent prompt MUST end with:
   ```
   Run the audit script and capture its JSON output.
   Save the full JSON to .claude/tmp/ecosystem-{name}-result.json
   Return ONLY this single line:
   COMPLETE: {audit-name} grade {grade} score {score} errors {N} warnings {N} info {N}
   Do NOT include the full JSON output or findings in your response.
   ```
4. **Check agent completion via `wc -l` on output files, NEVER read full output
   into context.** Use `head -c 200` to verify JSON structure if needed.
5. **Save progress after each stage completes** to survive context compaction.

---

## Compaction Guard

Ecosystem audits are long-running workflows vulnerable to context compaction. To
survive compaction, save progress after every stage and check for existing
progress on startup.

### State File

Path: `.claude/tmp/comprehensive-ecosystem-audit-progress.json`

Schema:

```json
{
  "started": "2026-02-24T10:00:00Z",
  "lastUpdated": "2026-02-24T10:15:00Z",
  "stages": {
    "1": {
      "status": "pending|completed",
      "audits": {
        "hook": "pending|running|completed|failed",
        "session": "pending|running|completed|failed",
        "tdms": "pending|running|completed|failed",
        "pr": "pending|running|completed|failed"
      }
    },
    "2": {
      "status": "pending|completed",
      "audits": {
        "skill": "pending|running|completed|failed",
        "doc": "pending|running|completed|failed",
        "script": "pending|running|completed|failed"
      }
    },
    "3": { "status": "pending|completed" }
  },
  "results": {
    "hook": {
      "grade": "B",
      "score": 85,
      "errors": 3,
      "warnings": 12,
      "info": 8
    },
    "session": null,
    "tdms": null,
    "pr": null,
    "skill": null,
    "doc": null,
    "script": null
  }
}
```

### Recovery Table

| State                                  | Resume Action                             |
| -------------------------------------- | ----------------------------------------- |
| No progress file (or > 2 hours old)    | Start from beginning                      |
| Stage 1 pending, some audits completed | Re-run only pending/failed Stage 1 audits |
| Stage 1 complete, Stage 2 pending      | Run Stage 2                               |
| Stage 2 complete, Stage 3 pending      | Run Stage 3 (aggregation + report)        |
| Stage 3 complete                       | Display final report                      |

### On Skill Start (Before Stage 1)

1. Check if `.claude/tmp/comprehensive-ecosystem-audit-progress.json` exists
2. If yes and < 2 hours old: **resume from saved position**
   - Read the progress file
   - Identify which stage to resume from
   - Show: "Resuming ecosystem audit from Stage {N} ({completed}/{total} audits
     done)"
   - Skip completed audits, re-run only pending/failed ones
3. If no (or stale): proceed to Stage 1 normally
   - Create `.claude/tmp/` directory if needed
   - Initialize progress file with all stages pending

> **Details:** See
> [reference/RECOVERY_PROCEDURES.md](reference/RECOVERY_PROCEDURES.md) for full
> recovery matrix and error handling.

---

## Stage 1: Foundation Audits (4 parallel)

Launch 4 agents in parallel using the Task tool. Each agent runs one ecosystem
audit script.

**Agent 1 — Hook Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-hook-result.json

Return ONLY this single line:
COMPLETE: hook grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

**Agent 2 — Session Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-session-result.json

Return ONLY this single line:
COMPLETE: session grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

**Agent 3 — TDMS Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-tdms-result.json

Return ONLY this single line:
COMPLETE: tdms grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

**Agent 4 — PR Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-pr-result.json

Return ONLY this single line:
COMPLETE: pr grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

### After Stage 1 Completes

1. Parse each agent's return line to extract grade/score/counts
2. Verify result files exist:
   `ls -la .claude/tmp/ecosystem-{hook,session,tdms,pr}-result.json`
3. Check file sizes with `wc -c` (must be > 0 bytes each)
4. Update progress file: set Stage 1 status to "completed" for each successful
   audit
5. If any audit failed: mark as "failed" in progress, note the error, continue
6. Save progress file

> **Details:** See [reference/WAVE_DETAILS.md](reference/WAVE_DETAILS.md) for
> checkpoint verification commands and error handling for failed audits.

---

## Stage 2: Extended Audits (3 parallel)

Launch 3 agents in parallel using the Task tool.

**Agent 5 — Skill Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-skill-result.json

Return ONLY this single line:
COMPLETE: skill grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

**Agent 6 — Doc Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-doc-result.json

Return ONLY this single line:
COMPLETE: doc grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

**Agent 7 — Script Ecosystem Audit:**

```
Run the following command and capture its full JSON output:

node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js --batch --summary

Save the full JSON output to .claude/tmp/ecosystem-script-result.json

Return ONLY this single line:
COMPLETE: script grade {grade} score {score} errors {N} warnings {N} info {N}
Do NOT include the full JSON output or findings in your response.
```

### After Stage 2 Completes

1. Parse each agent's return line
2. Verify result files exist:
   `ls -la .claude/tmp/ecosystem-{skill,doc,script}-result.json`
3. Check file sizes with `wc -c`
4. Update progress file: set Stage 2 status to "completed"
5. Handle failures same as Stage 1
6. Save progress file

---

## Stage 3: Aggregation & Report Generation

This stage runs sequentially (no agents needed). The orchestrator reads all 7
result files and computes the unified report.

> **Details:** See
> [reference/AGGREGATION_GUIDE.md](reference/AGGREGATION_GUIDE.md) for the
> weighted scoring formula, cross-audit insight detection, and domain heat map
> computation.

### Step 1: Read Result Summaries

For each of the 7 result files, read ONLY the summary section (first 50 lines or
the `summary` key in the JSON). Do NOT read full findings into context.

```bash
# Read just the summary from each result file
for name in hook session tdms pr skill doc script; do
  echo "=== $name ==="
  node -e "
    const d = require('./.claude/tmp/ecosystem-${name}-result.json');
    console.log(JSON.stringify({
      grade: d.grade, score: d.score,
      errors: d.summary?.errors || 0,
      warnings: d.summary?.warnings || 0,
      info: d.summary?.info || 0,
      categories: Object.keys(d.categories || {}).length,
      topFindings: (d.findings || []).slice(0, 3).map(f => f.message || f.title)
    }, null, 2));
  "
done
```

### Step 2: Compute Overall Health Grade

Apply weighted average across all 7 audit scores:

| Audit   | Weight | Rationale                                           |
| ------- | ------ | --------------------------------------------------- |
| hook    | 15%    | Core infrastructure -- hooks drive all automation   |
| session | 10%    | Session management -- important but narrower scope  |
| tdms    | 15%    | Debt tracking -- central to technical health        |
| pr      | 15%    | Review workflow -- quality gate for all changes     |
| skill   | 20%    | Skill quality -- largest surface area, most agents  |
| doc     | 10%    | Documentation -- supporting infrastructure          |
| script  | 15%    | Script infrastructure -- build/test/deploy pipeline |

**Formula:**
`overallScore = sum(auditScore * weight) / sum(weights_of_completed_audits)`

**Grade scale:**

| Score  | Grade |
| ------ | ----- |
| 90-100 | A     |
| 80-89  | B     |
| 70-79  | C     |
| 60-69  | D     |
| 0-59   | F     |

If any audit failed to run, compute the weighted average using only the
completed audits and note the missing coverage in the report.

### Step 3: Build Domain Heat Map

Collect category scores from each audit's result JSON. For each category across
all 7 audits:

1. Extract the category name and score
2. Sort all categories by score ascending (weakest first)
3. Take the bottom 10 as the "heat map" (weakest areas)

### Step 4: Identify Cross-Audit Insights

Look for patterns appearing in multiple audits:

1. **Shared file hotspots:** Files appearing in findings from 3+ audits
2. **Common pattern violations:** Same anti-pattern flagged by multiple audits
3. **Infrastructure gaps:** Missing capability noted by multiple audits

### Step 5: Rank Top 20 Findings

From all 7 audits, collect the top 3 findings from each (21 total), then rank by
impact score descending. Take the top 20.

### Step 6: Generate Report

Write `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` in the project root:

```markdown
# Comprehensive Ecosystem Audit Report

**Date:** {YYYY-MM-DD} **Overall Grade:** {grade} ({score}/100) **Audits Run:**
{completed}/7

## Executive Summary

{2-3 sentences about overall ecosystem health, strongest/weakest areas, and
whether health is improving or declining}

## Audit Results

| Audit   | Grade | Score | Errors | Warnings | Info | Weight |
| ------- | ----- | ----- | ------ | -------- | ---- | ------ |
| Hook    | {g}   | {s}   | {e}    | {w}      | {i}  | 15%    |
| Session | {g}   | {s}   | {e}    | {w}      | {i}  | 10%    |
| TDMS    | {g}   | {s}   | {e}    | {w}      | {i}  | 15%    |
| PR      | {g}   | {s}   | {e}    | {w}      | {i}  | 15%    |
| Skill   | {g}   | {s}   | {e}    | {w}      | {i}  | 20%    |
| Doc     | {g}   | {s}   | {e}    | {w}      | {i}  | 10%    |
| Script  | {g}   | {s}   | {e}    | {w}      | {i}  | 15%    |

## Domain Heat Map (Weakest Areas)

| Rank | Category | Audit | Score | Rating |
| ---- | -------- | ----- | ----- | ------ |
| 1    | {cat}    | {aud} | {s}   | Poor   |
| 2    | {cat}    | {aud} | {s}   | Poor   |
| ...  | ...      | ...   | ...   | ...    |
| 10   | {cat}    | {aud} | {s}   | Avg    |

## Top 20 Priority Findings

| Rank | Audit | Severity | Category | Message | Impact |
| ---- | ----- | -------- | -------- | ------- | ------ |
| 1    | {aud} | ERROR    | {cat}    | {msg}   | {imp}  |
| ...  | ...   | ...      | ...      | ...     | ...    |

## Cross-Audit Insights

### Shared File Hotspots

{files appearing in findings from 3+ audits}

### Common Pattern Violations

{anti-patterns flagged by multiple audits}

### Infrastructure Gaps

{missing capabilities noted by multiple audits}

## Recommendations

{5-7 actionable next steps based on findings, ordered by impact}

1. **{area}:** {recommendation}
2. ...

## Appendix

### Audit Scripts

| Audit   | Script Path                                                                     |
| ------- | ------------------------------------------------------------------------------- |
| Hook    | `.claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js`       |
| Session | `.claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js` |
| TDMS    | `.claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js`       |
| PR      | `.claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js`           |
| Skill   | `.claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js`     |
| Doc     | `.claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js`         |
| Script  | `.claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js`   |

### Failed Audits

{list any audits that failed to run, with error details}
```

### Step 7: Update Progress and Cleanup

1. Update progress file: set Stage 3 to "completed"
2. Delete all `.claude/tmp/ecosystem-*-result.json` files
3. Delete `.claude/tmp/comprehensive-ecosystem-audit-progress.json`
4. Present the report summary to the user

---

## Partial Failure Handling

If one or more audits fail, the skill continues with the remaining audits:

1. Mark the failed audit as "failed" in progress.json
2. Log the error message
3. Continue launching remaining audits in the stage
4. In the aggregation stage, compute weighted average using only completed
   audits
5. In the report, clearly note which audits failed and why
6. The overall grade reflects only completed audits (with a note about coverage)

**Never block the entire audit because one sub-audit failed.**

---

## When to Use

- **Quarterly health check** -- comprehensive view of all ecosystem health
- **After major refactoring** -- verify nothing regressed across all domains
- **Before a release** -- confirm all systems are healthy
- **New team member onboarding** -- understand current ecosystem state
- **After adding new hooks/skills/scripts** -- verify integration health

## When NOT to Use

- **Quick single-domain check** -- use individual audit skills instead
  (`/hook-ecosystem-audit`, `/session-ecosystem-audit`, etc.)
- **Debugging a specific issue** -- use `/systematic-debugging`
- **Code review** -- use `/code-reviewer` or `/audit-code`
- **When context budget is tight** -- this skill uses significant context across
  7 agent launches; ensure you have a fresh session

---

## Related Skills

- `/hook-ecosystem-audit` -- Individual hook ecosystem audit
- `/session-ecosystem-audit` -- Individual session ecosystem audit
- `/tdms-ecosystem-audit` -- Individual TDMS ecosystem audit
- `/pr-ecosystem-audit` -- Individual PR ecosystem audit
- `/skill-ecosystem-audit` -- Individual skill ecosystem audit
- `/doc-ecosystem-audit` -- Individual doc ecosystem audit
- `/script-ecosystem-audit` -- Individual script ecosystem audit
- `/audit-comprehensive` -- 9-domain code audit (different scope: code quality,
  security, performance, etc.)

---

## Version History

| Version | Date       | Description                                                           |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.0     | 2026-02-24 | Initial implementation -- 7 audits in 2 staged waves with aggregation |
