---
name: audit-process
description:
  Run a comprehensive multi-stage automation audit with parallel agents
---

# Comprehensive Automation Audit

**Version:** 2.0 (Expanded - Session #120)

This audit covers **16 automation types** across **12 audit categories** using a
**7-stage approach** with parallel agent execution.

---

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

---

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

## Pre-Audit Setup

### Step 1: Check Thresholds

```bash
npm run review:check
```

- If no thresholds triggered: "No review thresholds triggered. Proceed anyway?"
- Continue regardless if user invoked intentionally

### Step 2: Create Audit Directory

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_DIR="docs/audits/single-session/process/audit-${AUDIT_DATE}"
mkdir -p "${AUDIT_DIR}"
```

### Step 3: Load False Positives

Read `docs/audits/FALSE_POSITIVES.jsonl` and note patterns to exclude.

---

## Stage 1: Inventory & Dependency Mapping

**Goal:** Build complete map of all 16 automation types and their relationships.

**Run 6 agents IN PARALLEL using Task tool:**

### Agent 1A: Hooks Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory all hooks in this codebase:

1. Claude hooks in .claude/hooks/ - list each file, what event it handles
2. Husky hooks in .husky/ - list each file, what it does
3. lint-staged config in package.json - what it runs

For each hook, document:
- File path
- Trigger event (SessionStart, PostToolUse, pre-commit, etc.)
- What it calls/executes
- Dependencies on other scripts

Output as structured markdown table.
""")
```

### Agent 1B: Scripts Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory all scripts:

1. scripts/*.js and scripts/*.ts - list each with one-line description
2. scripts/lib/ - shared utilities
3. npm scripts in package.json - list each with what it runs

For each script, document:
- File path
- Purpose (from comments or code analysis)
- What calls it (npm script, hook, CI, manual)
- What it calls (other scripts, external commands)

Output as structured markdown table.
""")
```

### Agent 1C: Skills & Commands Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory all Claude skills and commands:

1. .claude/skills/ - each subdirectory is a skill
2. .claude/commands/ - each .md file is a command

For each skill/command, document:
- Name
- Description (from SKILL.md or file header)
- Scripts it uses (if any)
- Dependencies

Output as structured markdown table.
""")
```

### Agent 1D: CI & Config Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory CI and config:

1. .github/workflows/ - each YAML workflow
2. eslint.config.mjs - what rules/plugins
3. .prettierrc - configuration
4. tsconfig*.json - all TypeScript configs

For each, document:
- File path
- Purpose
- Triggers (for workflows)
- What it validates/enforces

Output as structured markdown table.
""")
```

### Agent 1E: Firebase Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory Firebase automation:

1. functions/src/*.ts - Cloud Functions (callable and scheduled)
2. functions/src/jobs.ts - Scheduled jobs specifically
3. firestore.rules - Security rules
4. storage.rules - Storage security rules
5. firestore.indexes.json - Indexes

For each function, document:
- Name
- Type (callable, scheduled, trigger)
- Schedule (if applicable)
- What it does

Output as structured markdown table.
""")
```

### Agent 1F: MCP Servers Inventory

```
Task(subagent_type="Explore", prompt="""
Inventory MCP servers:

1. Check mcp.json.example for configured servers
2. Check scripts/mcp/ for custom MCP implementations
3. Check .claude/settings.json for enabled/disabled servers

For each server, document:
- Name
- Source (npm package or local script)
- Purpose
- Status (enabled/disabled)

Output as structured markdown table.
""")
```

### Stage 1 Output

After all 6 agents complete:

1. Merge results into `stage-1-inventory.md`
2. Build dependency graph showing what calls what
3. Identify orphans (things nothing calls)
4. **No JSONL findings yet** - this is discovery only

---

## Stage 2: Redundancy & Dead Code Analysis

**Goal:** Find duplications and orphaned code.

**Run 3 agents IN PARALLEL:**

### Agent 2A: Orphan Detection

```
Task(subagent_type="Explore", prompt="""
Using the Stage 1 inventory, find orphaned automation:

1. Scripts never called by npm scripts, hooks, CI, or other scripts
2. npm scripts never used in hooks, CI, or documentation
3. Skills/commands that duplicate built-in functionality
4. GitHub Actions that never trigger (impossible conditions)
5. Firebase functions not referenced anywhere

Cross-reference the dependency graph from Stage 1.

For each orphan found, output JSONL:
{
  "title": "Orphaned: [name]",
  "severity": "S2",
  "category": "process",
  "file": "path/to/file",
  "line": 1,
  "description": "This [script/skill/function] is never called by anything",
  "recommendation": "Remove if unused, or document intended use"
}
""")
```

### Agent 2B: Duplication Detection

```
Task(subagent_type="Explore", prompt="""
Find duplicated logic across automation:

1. Same validation running in pre-commit AND CI (unnecessary duplication)
2. Same check in multiple hooks
3. Scripts that do the same thing with different names
4. Pattern checks duplicated between hook and script
5. Similar error handling code copy-pasted

For each duplication found, output JSONL:
{
  "title": "Duplicated: [description]",
  "severity": "S2",
  "category": "process",
  "file": "path/to/file",
  "line": 123,
  "description": "Same logic exists in [other locations]",
  "recommendation": "Consolidate into single source, call from both places"
}
""")
```

### Agent 2C: Unused & Never-Triggered

```
Task(subagent_type="Explore", prompt="""
Find automation that never executes:

1. npm scripts with no callers and not in documentation
2. GitHub Actions with triggers that never fire
3. Hooks configured but for events that don't occur
4. Firebase scheduled jobs that are disabled
5. Dead code paths in scripts (unreachable conditions)

For each finding, output JSONL:
{
  "title": "Never executes: [name]",
  "severity": "S3",
  "category": "process",
  "file": "path/to/file",
  "line": 1,
  "description": "This automation never runs because [reason]",
  "recommendation": "Remove or fix trigger condition"
}
""")
```

### Stage 2 Output

1. Merge agent outputs into `stage-2-redundancy.jsonl`
2. Run TDMS intake:
   ```bash
   node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-2-redundancy.jsonl
   ```

---

## Stage 3: Effectiveness & Functionality

**Goal:** Does each thing actually work and catch issues?

**Run 4 agents IN PARALLEL:**

### Agent 3A: Hook Effectiveness

```
Task(subagent_type="code-reviewer", prompt="""
Analyze hook effectiveness:

1. Do pre-commit hooks actually catch the issues they're designed for?
2. Are there bypass conditions that are too easy to trigger?
3. Do Claude hooks provide useful feedback or just noise?
4. Are hook error messages actionable?

Test methodology:
- Read hook code and identify what it checks
- Determine if checks are robust or easily bypassed
- Check if error messages help developers fix issues

For each ineffective hook, output JSONL with severity S1-S2.
""")
```

### Agent 3B: CI Workflow Effectiveness

```
Task(subagent_type="code-reviewer", prompt="""
Analyze CI workflow effectiveness:

1. Do workflows actually catch failures before merge?
2. Are there race conditions or timing issues?
3. Do workflows test the right things?
4. Are there gaps where bad code could slip through?

For each workflow, verify:
- Triggers are appropriate
- Steps actually validate what they claim
- Failure modes are handled

For each issue, output JSONL with severity S0-S2.
""")
```

### Agent 3C: Script Functionality

```
Task(subagent_type="code-reviewer", prompt="""
Verify script functionality:

1. Do scripts handle edge cases (empty input, missing files)?
2. Do scripts fail gracefully with useful errors?
3. Are there scripts that silently do nothing?
4. Do scripts actually accomplish their stated purpose?

For high-complexity scripts (check MASTER_DEBT.jsonl for complexity findings),
pay extra attention to logic correctness.

For each issue, output JSONL with severity S1-S3.
""")
```

### Agent 3D: Skill/Command Functionality

```
Task(subagent_type="code-reviewer", prompt="""
Verify skill and command functionality:

1. Do skill prompts actually guide Claude effectively?
2. Are there skills that produce poor/wrong outputs?
3. Do commands reference files that don't exist?
4. Are skill dependencies satisfied?

For each issue, output JSONL with severity S2-S3.
""")
```

### Stage 3 Output

1. Merge agent outputs into `stage-3-effectiveness.jsonl`
2. Run TDMS intake:
   ```bash
   node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-3-effectiveness.jsonl
   ```

---

## Stage 4: Performance & Bloat

**Goal:** Identify slow operations and unnecessary work.

**Run 3 agents IN PARALLEL:**

### Agent 4A: Git Hook Performance

```
Task(subagent_type="Explore", prompt="""
Analyze pre-commit and pre-push performance:

1. What's the total time for pre-commit? (should be <10s for good DX)
2. Which checks are slowest?
3. Are there checks that could run in parallel but don't?
4. Are there checks that could be skipped for certain file types?
5. Is there unnecessary work (full scans when partial would do)?

For each performance issue, output JSONL:
{
  "title": "Slow: [check name]",
  "severity": "S2",
  "category": "process",
  "file": ".husky/pre-commit",
  "line": [line],
  "description": "Takes [X]s, could be [Y]s with [optimization]",
  "recommendation": "[specific optimization]"
}
""")
```

### Agent 4B: CI Performance

```
Task(subagent_type="Explore", prompt="""
Analyze CI workflow performance:

1. Which jobs take longest?
2. Are there jobs that could run in parallel?
3. Is caching used effectively?
4. Are there redundant installs or builds?
5. Could any jobs be skipped based on changed files?

For each issue, output JSONL with severity S2-S3.
""")
```

### Agent 4C: Script Performance

```
Task(subagent_type="code-reviewer", prompt="""
Analyze script performance:

1. Scripts that scan all files when they could be selective
2. Synchronous operations that could be async
3. Repeated file reads that could be cached
4. O(n^2) or worse algorithms
5. Spawning too many child processes

Focus on scripts in the critical path (hooks, CI).

For each issue, output JSONL with severity S2-S3.
""")
```

### Stage 4 Output

1. Merge agent outputs into `stage-4-performance.jsonl`
2. Run TDMS intake:
   ```bash
   node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-4-performance.jsonl
   ```

---

## Stage 5: Quality & Consistency

**Goal:** Error handling, code quality, pattern consistency.

**Run 3 agents IN PARALLEL:**

### Agent 5A: Error Handling Audit

```
Task(subagent_type="code-reviewer", prompt="""
Audit error handling in automation:

1. Silent failures (catch blocks that swallow errors)
2. Missing try/catch around file operations
3. Incorrect exit codes (0 on failure, non-zero on success)
4. continueOnError overuse in hooks
5. Missing error messages or unhelpful ones

For each issue, output JSONL:
{
  "severity": "S1" for silent failures that hide real problems,
  "severity": "S2" for poor error messages
}
""")
```

### Agent 5B: Code Quality Audit

```
Task(subagent_type="code-reviewer", prompt="""
Audit code quality in scripts and hooks:

1. Security issues (command injection, path traversal)
2. Race conditions (TOCTOU)
3. Hardcoded paths that should be configurable
4. Magic numbers/strings without explanation
5. Missing input validation

Use patterns from docs/agent_docs/CODE_PATTERNS.md as reference.

For each issue, output JSONL with appropriate severity.
""")
```

### Agent 5C: Consistency Audit

```
Task(subagent_type="Explore", prompt="""
Audit consistency across automation:

1. Mixed JS and shell doing the same thing differently
2. Inconsistent naming (kebab-case vs camelCase vs snake_case)
3. Different error message formats
4. Some async, some sync for similar operations
5. Different logging approaches

For each inconsistency, output JSONL with severity S3.
""")
```

### Stage 5 Output

1. Merge agent outputs into `stage-5-quality.jsonl`
2. Run TDMS intake:
   ```bash
   node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-5-quality.jsonl
   ```

---

## Stage 6: Coverage Gaps & Improvements

**Goal:** What's missing? What could be better?

**Run 3 agents IN PARALLEL:**

### Agent 6A: Coverage Gap Analysis

```
Task(subagent_type="Explore", prompt="""
Identify coverage gaps:

1. File types not covered by linting
2. Code paths not validated by any check
3. Missing pre-push checks that CI catches too late
4. Firebase functions without integration tests
5. Skills without usage documentation

For each gap, output JSONL:
{
  "title": "Gap: [description]",
  "severity": "S2",
  "category": "process",
  "file": "[relevant file or 'N/A']",
  "line": 1,
  "description": "[what's missing]",
  "recommendation": "[how to add coverage]"
}
""")
```

### Agent 6B: Improvement Opportunities

```
Task(subagent_type="general-purpose", prompt="""
Identify improvement opportunities:

1. Scripts that could be consolidated
2. Manual processes that could be automated
3. Better tools that could replace current ones
4. Hooks that could provide better DX
5. CI optimizations (caching, parallelization)

For each opportunity, output JSONL:
{
  "title": "Improve: [description]",
  "severity": "S3",
  "category": "process",
  "description": "[current state] -> [improved state]",
  "recommendation": "[specific implementation suggestion]"
}
""")
```

### Agent 6C: Documentation & Maintainability

```
Task(subagent_type="Explore", prompt="""
Audit documentation and maintainability:

1. Scripts without header comments explaining purpose
2. Complex logic without inline comments
3. Missing README files in key directories
4. Outdated documentation (references non-existent files)
5. TRIGGERS.md missing entries for new automation

For each issue, output JSONL with severity S3.
""")
```

### Stage 6 Output

1. Merge agent outputs into `stage-6-improvements.jsonl`
2. Run TDMS intake:
   ```bash
   node scripts/debt/intake-audit.js ${AUDIT_DIR}/stage-6-improvements.jsonl
   ```

---

## Stage 7: Synthesis & Prioritization

**Goal:** Consolidate all findings, dedupe, prioritize.

**This stage runs SEQUENTIALLY (not parallel).**

### Step 7.1: Merge All Stage Findings

```bash
# Combine all JSONL files
cat ${AUDIT_DIR}/stage-*.jsonl > ${AUDIT_DIR}/all-findings-raw.jsonl
```

### Step 7.2: Deduplicate

Check for findings that describe the same issue from different angles. Merge
duplicates, keeping the most detailed description.

### Step 7.3: Cross-Reference with Existing Debt

```bash
# Check what's already in MASTER_DEBT.jsonl
node scripts/debt/validate-schema.js ${AUDIT_DIR}/all-findings-raw.jsonl --check-duplicates
```

### Step 7.4: Generate Priority Action Plan

Create prioritized list:

1. **Immediate (S0-S1):** Fix before next commit
2. **Short-term (S2 + quick wins):** Fix this sprint
3. **Backlog (S3 + complex S2):** Add to roadmap

### Step 7.5: Generate Final Report

Create `${AUDIT_DIR}/AUTOMATION_AUDIT_REPORT.md`:

```markdown
# Automation Audit Report - [DATE]

## Executive Summary

- Total findings: X
- By severity: X S0, X S1, X S2, X S3
- By category: [breakdown]

## Inventory Summary

[From Stage 1]

## Key Findings

### Critical (S0-S1)

[List with file:line references]

### Redundancy & Dead Code

[From Stage 2]

### Effectiveness Issues

[From Stage 3]

### Performance Issues

[From Stage 4]

### Quality Issues

[From Stage 5]

### Improvement Opportunities

[From Stage 6]

## Priority Action Plan

[Grouped by timeframe]

## Dependency Graph

[Visual or text representation]
```

---

## Post-Audit (MANDATORY)

### 1. Validate All Findings

```bash
node scripts/validate-audit.js ${AUDIT_DIR}/all-findings-raw.jsonl
```

### 2. Update AUDIT_TRACKER.md

Add entry with:

- Date, Session number
- Findings count by severity
- Stages completed
- Validation status

### 3. Final TDMS Reconciliation

Ensure all findings have DEBT-XXXX IDs:

```bash
# Verify all items ingested
node scripts/debt/validate-schema.js docs/technical-debt/MASTER_DEBT.jsonl
```

### 4. Regenerate Views

```bash
node scripts/debt/generate-views.js
```

### 5. Commit Audit Results

```bash
git add docs/audits/single-session/process/
git add docs/technical-debt/
git commit -m "audit: comprehensive automation audit - Session #[N]"
```

---

## Running Individual Stages

You can run stages individually if needed:

- `/audit-process stage 1` - Run only Stage 1 (Inventory)
- `/audit-process stage 2` - Run only Stage 2 (Redundancy)
- `/audit-process stage 3-4` - Run Stages 3 and 4
- `/audit-process full` - Run all 7 stages (default)

**Note:** Stages 2-6 depend on Stage 1 inventory. If Stage 1 hasn't been run
recently, run it first.

---

## Threshold System

This audit **resets the process category threshold** in `docs/AUDIT_TRACKER.md`.

**Process audit triggers:**

- ANY CI/hook/script file changed since last audit, OR
- 75+ commits since last audit (increased from 30 for expanded scope)

---

## Evidence Requirements

**All findings MUST include:**

1. **file** - Full path from repo root
2. **line** - Specific line number (use 1 if file-wide)
3. **title** - Short description
4. **description** - Detailed explanation
5. **recommendation** - How to fix
6. **severity** - S0/S1/S2/S3
7. **category** - Must be "process" for TDMS routing

**S0/S1 require:**

- HIGH or MEDIUM confidence
- Dual-pass verification
- Tool validation where possible

---

## Version History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| 2.0     | 2026-01-31 | Expanded: 16 types, 12 categories, 7 stages, parallel agents |
| 1.0     | 2026-01-17 | Initial single-session process audit                         |
