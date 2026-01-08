---
description: Run a single-session process and automation audit on the codebase
---

# Single-Session Process/Automation Audit

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results.
- If no thresholds triggered: "⚠️ No review thresholds triggered. Proceed anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# CI workflow status
ls -la .github/workflows/ 2>/dev/null

# Hook inventory
ls -la .claude/hooks/ 2>/dev/null
ls -la .husky/ 2>/dev/null

# Script inventory
ls -la scripts/*.js scripts/*.sh 2>/dev/null | head -20

# Slash command inventory
ls -la .claude/commands/ 2>/dev/null

# npm scripts
grep -A 50 '"scripts"' package.json | head -60
```

**Step 3: Check Template Currency**

Read `docs/templates/MULTI_AI_PROCESS_AUDIT_TEMPLATE.md` and verify:
- [ ] CI/CD workflow list is current
- [ ] Hook inventory is complete
- [ ] Script coverage is documented

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (6 Categories):**
1. CI/CD Pipeline (workflow coverage, reliability, speed)
2. Git Hooks (pre-commit, pre-push effectiveness)
3. Claude Hooks (session hooks, tool hooks)
4. Script Health (test coverage, error handling, documentation)
5. Trigger Thresholds (appropriateness, coverage)
6. Process Documentation (accuracy, completeness)

**For each category:**
1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (breaks CI) | S1 (reduces effectiveness) | S2 (inconvenient) | S3 (polish)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)

**Process Checks:**
- All CI workflows pass on current branch
- Hooks exit with correct codes
- Scripts have error handling
- Triggers are documented in TRIGGERS.md
- Slash commands have descriptions
- npm scripts are documented in DEVELOPMENT.md

**Scope:**
- Include: `.github/`, `.claude/`, `.husky/`, `scripts/`, `package.json`
- Exclude: `node_modules/`

---

## Output Requirements

**1. Markdown Summary (display to user):**
```markdown
## Process/Automation Audit - [DATE]

### Baselines
- CI workflows: X files
- Git hooks: X hooks
- Claude hooks: X hooks
- Scripts: X files
- Slash commands: X commands
- npm scripts: X scripts

### Findings Summary
| Severity | Count | Category |
|----------|-------|----------|
| S0 | X | ... |
| S1 | X | ... |
| S2 | X | ... |
| S3 | X | ... |

### CI/CD Issues
1. [workflow.yml:line] - Description
2. ...

### Hook Issues
1. [hook.sh:line] - Description
2. ...

### Script Issues
1. [script.js:line] - Description
2. ...

### Recommendations
- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/process/audit-[YYYY-MM-DD].jsonl`

Each line:
```json
{"id":"PROC-001","category":"CI|GitHooks|ClaudeHooks|Scripts|Triggers|ProcessDocs","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","file":"path/to/file","line":123,"title":"Short description","description":"Detailed issue","recommendation":"How to fix","evidence":["relevant code or config"]}
```

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/process/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and improvement plan.

---

## Post-Audit

1. Display summary to user
2. Confirm files saved
3. Ask: "Would you like me to fix any of these process issues now?"

---

## Threshold Reset Note

Single-session audits do NOT reset multi-AI review thresholds. Those reset only after:
- Full multi-AI audit (3+ models) completed
- Logged in AI_REVIEW_LEARNINGS_LOG.md with Review # entry
- CANON findings aggregated

This audit provides interim visibility between major reviews.
