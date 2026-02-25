---
name: audit-process
description:
  Run a comprehensive multi-stage automation audit with parallel agents
---

# Comprehensive Automation Audit

**Version:** 2.4 **Last Updated:** 2026-02-24 **Status:** ACTIVE

This audit covers **16 automation types** across **12 audit categories** using a
**7-stage approach** with parallel agent execution.

---

## When to Use

- Tasks related to audit-process
- User explicitly invokes `/audit-process`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Quick Reference

| Stage | Name                          | Parallel Agents | Output                        |
| ----- | ----------------------------- | --------------- | ----------------------------- |
| 1     | Inventory & Dependency Map    | 6               | `stage-1-inventory.md`        |
| 2     | Redundancy & Dead Code        | 3               | `stage-2-redundancy.jsonl`    |
| 3     | Effectiveness & Functionality | 4               | `stage-3-effectiveness.jsonl` |
| 4     | Performance & Bloat           | 3               | `stage-4-performance.jsonl`   |
| 5     | Quality & Consistency         | 3               | `stage-5-quality.jsonl`       |
| 6     | Coverage Gaps & Improvements  | 3               | `stage-6-improvements.jsonl`  |
| 7     | Synthesis & Prioritization    | 1 (sequential)  | Final report + action plan    |

**Total: 22 parallel agents across 6 stages + 1 synthesis stage**

---

## CRITICAL: Persistence Rules

**EVERY agent MUST write outputs directly to files. NEVER rely on conversation
context.**

1. **Agent outputs go to files, not conversation** -- each agent prompt MUST
   include: `Write findings to: ${AUDIT_DIR}/[filename].jsonl`
2. **Verify after each stage** -- check all output files exist and are non-zero
3. **Why this matters** -- context compaction can happen at any time; only files
   persist

---

## Scope: 16 Automation Types

| #   | Type                     | Location                    | Count    |
| --- | ------------------------ | --------------------------- | -------- |
| 1   | Claude Code Hooks        | `.claude/hooks/`            | ~29      |
| 2   | Claude Code Skills       | `.claude/skills/`           | ~49      |
| 3   | Claude Code Commands     | `.claude/commands/`         | ~12      |
| 4   | npm Scripts              | `package.json`              | ~60      |
| 5   | Standalone Scripts       | `scripts/`                  | ~61      |
| 6   | Script Libraries         | `scripts/lib/`              | ~4       |
| 7   | GitHub Actions Workflows | `.github/workflows/`        | ~10      |
| 8   | Git Hooks (Husky)        | `.husky/`                   | 2        |
| 9   | lint-staged              | `package.json`              | 1 config |
| 10  | ESLint                   | `eslint.config.mjs`         | 1 config |
| 11  | Prettier                 | `.prettierrc`               | 1 config |
| 12  | Firebase Cloud Functions | `functions/src/`            | ~8       |
| 13  | Firebase Scheduled Jobs  | `functions/src/jobs.ts`     | ~3+      |
| 14  | Firebase Rules           | `*.rules`                   | 2        |
| 15  | MCP Servers              | `mcp.json` / `scripts/mcp/` | ~6       |
| 16  | TypeScript Configs       | `tsconfig*.json`            | 2+       |

## Audit Categories: 12 Dimensions

| #   | Category                 | Focus                           |
| --- | ------------------------ | ------------------------------- |
| 1   | Redundancy & Duplication | Same thing in multiple places   |
| 2   | Dead/Orphaned Code       | Never called, does nothing      |
| 3   | Effectiveness            | Too weak, always passes         |
| 4   | Performance & Bloat      | Slow, unnecessary work          |
| 5   | Error Handling           | Silent failures, wrong severity |
| 6   | Dependency & Call Chain  | What triggers what              |
| 7   | Consistency              | Mixed patterns, naming          |
| 8   | Coverage Gaps            | Missing checks                  |
| 9   | Maintainability          | Complex, undocumented           |
| 10  | Functionality            | Does it actually work?          |
| 11  | Improvements             | Could be better                 |
| 12  | Code Quality             | Bugs, security, bad patterns    |

---

## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for standard audit procedures.

## Agent Prompts

> Read `.claude/skills/audit-process/prompts.md` for full agent prompt
> specifications.

### Agent Summary

| ID  | Name                        | Type            | Stage |
| --- | --------------------------- | --------------- | ----- |
| 1A  | Hooks Inventory             | Explore         | 1     |
| 1B  | Scripts Inventory           | Explore         | 1     |
| 1C  | Skills & Commands           | Explore         | 1     |
| 1D  | CI & Config                 | Explore         | 1     |
| 1E  | Firebase                    | Explore         | 1     |
| 1F  | MCP Servers                 | Explore         | 1     |
| 2A  | Orphan Detection            | Explore         | 2     |
| 2B  | Duplication Detection       | Explore         | 2     |
| 2C  | Unused & Never-Triggered    | Explore         | 2     |
| 3A  | Hook Effectiveness          | code-reviewer   | 3     |
| 3B  | CI Workflow Effectiveness   | code-reviewer   | 3     |
| 3C  | Script Functionality        | code-reviewer   | 3     |
| 3D  | Skill/Command Functionality | code-reviewer   | 3     |
| 4A  | Git Hook Performance        | Explore         | 4     |
| 4B  | CI Performance              | Explore         | 4     |
| 4C  | Script Performance          | code-reviewer   | 4     |
| 5A  | Error Handling              | code-reviewer   | 5     |
| 5B  | Code Quality                | code-reviewer   | 5     |
| 5C  | Consistency                 | Explore         | 5     |
| 6A  | Coverage Gap Analysis       | Explore         | 6     |
| 6B  | Improvement Opportunities   | general-purpose | 6     |
| 6C  | Documentation & Maint.      | Explore         | 6     |

---

## Pre-Audit Setup

### Step 0: Episodic Memory Search

Search for context from past sessions before running:

```javascript
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["process audit", "automation", "hooks"],
    limit: 5,
  });
```

### Step 1: Check Thresholds

```bash
npm run review:check
```

### Step 2: Create Audit Directory

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/single-session/process/audit-${AUDIT_DATE}"
mkdir -p "${AUDIT_DIR}"
```

### Step 3: Verify Output Directory Variable (CRITICAL)

```bash
echo "AUDIT_DIR is: ${AUDIT_DIR}"
ls -la "${AUDIT_DIR}" || echo "ERROR: AUDIT_DIR does not exist"

AUDIT_PATH=$(realpath "${AUDIT_DIR}" 2>/dev/null || echo "${AUDIT_DIR}")
REPO_ROOT=$(realpath "." 2>/dev/null || echo ".")
if [ -z "${AUDIT_DIR}" ] || [ "${AUDIT_PATH}" = "/" ] || [ "${AUDIT_PATH}" = "${REPO_ROOT}" ]; then
  echo "FATAL: AUDIT_DIR must be a proper subdirectory under the repo, not root"
  exit 1
fi
```

### Step 4: Load False Positives

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and note patterns to exclude.

---

## Stage Execution

### Stage 1: Inventory & Dependency Mapping (6 parallel agents)

Run agents 1A-1F in parallel. After completion, merge into
`stage-1-inventory.md`, build dependency graph, identify orphans. **No JSONL
findings yet** -- discovery only.

### Stage 1 Verification (MANDATORY)

```bash
STAGE1_FILES="stage-1a-hooks.md stage-1b-scripts.md stage-1c-skills.md stage-1d-ci-config.md stage-1e-firebase.md stage-1f-mcp.md"
for f in $STAGE1_FILES; do
  if [ ! -s "${AUDIT_DIR}/$f" ]; then
    echo "ERROR: Missing or empty: ${AUDIT_DIR}/$f"
    exit 1
  fi
done
```

### Stages 2-6: Analysis (3-4 parallel agents each)

Each stage follows the same pattern:

1. Launch parallel agents (see prompts.md for specifications)
2. Verify all output files exist and are non-zero
3. Merge sub-stage files into canonical rollup (e.g.,
   `stage-2-redundancy.jsonl`)
4. Run TDMS intake:
   `node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-N-*.jsonl`

**Stage verification template** (run before proceeding to next stage):

```bash
# Check for misplaced files in root (context compaction recovery)
ROOT_AUDIT_FILES=$(ls *.jsonl 2>/dev/null | grep -E "stage-N" | wc -l)
if [ "$ROOT_AUDIT_FILES" -gt 0 ]; then
  echo "WARNING: Found stage files in root directory!"
  mv stage-N*.jsonl "${AUDIT_DIR}/" 2>/dev/null || true
fi
```

### Stage 7: Synthesis & Prioritization (sequential)

1. Merge canonical rollup files into `all-findings-raw.jsonl`
2. Deduplicate findings
3. Cross-reference with `MASTER_DEBT.jsonl`
4. Generate priority action plan (Immediate S0-S1, Short-term S2, Backlog S3)
5. Generate `AUTOMATION_AUDIT_REPORT.md`

---

## MASTER_DEBT Cross-Reference (MANDATORY -- before Interactive Review)

**Do NOT present findings for review until cross-referenced against
MASTER_DEBT.jsonl.** Classify each finding as: Already Tracked (skip), New
Finding (review), or Possibly Related (flag). Present only New and Possibly
Related findings.

---

## Interactive Review (MANDATORY -- after cross-reference, before TDMS intake)

Present findings in **batches of 3-5 items**, grouped by severity (S0 first).
Each item shows: title, severity, effort, confidence, current state, suggested
fix, acceptance tests, counter-argument, and recommendation.

Create `${AUDIT_DIR}/REVIEW_DECISIONS.md` after first batch to track decisions.
Process: ACCEPTED -> TDMS intake, DECLINED -> remove, DEFERRED -> keep as NEW.

---

## Post-Audit (MANDATORY)

1. Validate:
   `node scripts/validate-audit.js ${AUDIT_DIR}/all-findings-raw.jsonl`
2. Update AUDIT_TRACKER.md with date, session, findings count, validation status
3. Reset threshold:
   `node scripts/reset-audit-triggers.js --type=single --category=process --apply`
4. Reconcile TDMS:
   `node scripts/debt/validate-schema.js docs/technical-debt/MASTER_DEBT.jsonl`
5. Regenerate views: `node scripts/debt/generate-views.js`
6. Commit: `git add docs/audits/single-session/process/ docs/technical-debt/`

---

## Running Individual Stages

- `/audit-process stage 1` - Run only Stage 1 (Inventory)
- `/audit-process stage 2` - Run only Stage 2 (Redundancy)
- `/audit-process stage 3-4` - Run Stages 3 and 4
- `/audit-process full` - Run all 7 stages (default)

**Note:** Stages 2-6 depend on Stage 1 inventory.

---

## Threshold System

Process audit triggers: ANY CI/hook/script file changed since last audit, OR 75+
commits since last audit.

---

## Evidence Requirements

All findings MUST include: file, line, title, description, recommendation,
severity, category. S0/S1 require HIGH or MEDIUM confidence, dual-pass
verification, and tool validation where possible.

---

## Context Recovery

If the session is interrupted:

1. Check state file: `.claude/state/audit-process-<date>.state.json`
2. If < 24 hours old: resume from last completed stage
3. If stale: start fresh
4. Check root for misplaced files and move to `${AUDIT_DIR}/`
5. Identify completed vs missing stages and resume

```bash
for stage in 1 2 3 4 5 6; do
  count=$(ls ${AUDIT_DIR}/stage-${stage}*.* 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "Stage $stage: FOUND ($count files)"
  else
    echo "Stage $stage: MISSING"
  fi
done
```

---

## Version History

| Version | Date       | Changes                                                                  |
| ------- | ---------- | ------------------------------------------------------------------------ |
| 2.4     | 2026-02-24 | Extract 22 agent prompts to prompts.md (68% size reduction)              |
| 2.3     | 2026-02-23 | Add mandatory MASTER_DEBT cross-reference step before interactive review |
| 2.2     | 2026-01-31 | Added recovery procedures, root check safeguards, Step 2.5               |
| 2.1     | 2026-01-31 | Added CRITICAL persistence rules: agents MUST write to files             |
| 2.0     | 2026-01-31 | Expanded: 16 types, 12 categories, 7 stages, parallel agents             |
| 1.0     | 2026-01-17 | Initial single-session process audit                                     |

---

## Documentation References

### TDMS Integration (Required)

- [PROCEDURE.md](docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [MASTER_DEBT.jsonl](docs/technical-debt/MASTER_DEBT.jsonl) - Canonical debt
  store

### Documentation Standards (Required)

- [JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md) - Output
  format requirements and TDMS field mapping
- [DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md) - 5-tier doc
  hierarchy
- [CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md) - Anti-patterns to check
