---
description: Run a single-session refactoring audit on the codebase
---

# Single-Session Refactoring Audit

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results.
- If no thresholds triggered: "⚠️ No review thresholds triggered. Proceed anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# SonarQube issues (if manifest exists)
cat docs/analysis/sonarqube-manifest.md 2>/dev/null | head -30 || echo "No SonarQube manifest"

# Circular dependencies
npm run deps:circular 2>&1

# Unused exports
npm run deps:unused 2>&1 | head -30

# Large files (potential god objects)
find app components lib -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | sort -n | tail -20

# Duplicate code patterns
grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l
```

**Step 3: Check Template Currency**

Read `docs/templates/MULTI_AI_REFACTORING_PLAN_TEMPLATE.md` and verify:
- [ ] SonarQube baseline is current (778 issues, 47 CRITICAL)
- [ ] Known god objects are listed
- [ ] Batch fix opportunities are documented

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (5 Categories):**
1. God Objects (large files, too many responsibilities)
2. Code Duplication (repeated patterns, copy-paste code)
3. Cognitive Complexity (SonarQube CRITICAL targets)
4. Architecture Violations (layer boundaries, import cycles)
5. Technical Debt Markers (TODOs, FIXMEs, HACKs)

**For each category:**
1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (blocking) | S1 (major friction) | S2 (annoying) | S3 (nice-to-have)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)

**Refactoring Targets:**
- Files > 300 lines (potential split candidates)
- Functions > 50 lines (complexity risk)
- Components with > 10 props (interface too large)
- Files with > 5 imports from different domains (coupling)
- Circular dependencies (from deps:circular)
- Unused exports (from deps:unused)

**Scope:**
- Include: `app/`, `components/`, `lib/`, `hooks/`, `functions/`
- Exclude: `node_modules/`, `.next/`, `docs/`

---

## Output Requirements

**1. Markdown Summary (display to user):**
```markdown
## Refactoring Audit - [DATE]

### Baselines
- SonarQube CRITICAL: X issues
- Circular dependencies: X
- Unused exports: X
- Files > 300 lines: X
- TODO/FIXME/HACK markers: X

### Findings Summary
| Severity | Count | Category |
|----------|-------|----------|
| S0 | X | ... |
| S1 | X | ... |
| S2 | X | ... |
| S3 | X | ... |

### Top Refactoring Candidates
1. [file] - X lines, Y responsibilities (S1/E2)
2. ...

### Quick Wins (E0-E1)
- ...

### Batch Fix Opportunities
- X instances of [pattern] can be auto-fixed
- ...

### Recommendations
- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/refactoring/audit-[YYYY-MM-DD].jsonl`

Each line:
```json
{"id":"REF-001","category":"GodObject|Duplication|Complexity|Architecture|TechDebt","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","file":"path/to/file.ts","line":123,"title":"Short description","description":"Detailed issue","metrics":{"lines":450,"functions":25,"complexity":45},"recommendation":"How to refactor","batch_fixable":true,"evidence":["code structure info"]}
```

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/refactoring/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and refactoring plan.

---

## Post-Audit

1. Display summary to user
2. Confirm files saved to `docs/audits/single-session/refactoring/`
3. **Update AUDIT_TRACKER.md** - Add entry to "Refactoring Audits" table:
   - Date: Today's date
   - Session: Current session number from SESSION_CONTEXT.md
   - Commits Covered: Number of commits since last refactoring audit
   - Files Covered: Number of files analyzed for refactoring
   - Findings: Total count (e.g., "1 S1, 3 S2, 5 S3")
   - Reset Threshold: NO (single-session audits do not reset thresholds)
4. Ask: "Would you like me to tackle any of these refactoring tasks now? (Recommend starting with batch fixes)"

---

## Threshold System

### Category-Specific Thresholds

This audit does **NOT** reset thresholds in `docs/AUDIT_TRACKER.md` (threshold resets are reserved for multi-AI audits only).

**Refactoring audit triggers (check AUDIT_TRACKER.md):**
- 40+ commits since last refactoring audit, OR
- 3+ new complexity warnings, OR
- Circular dependency detected

### Multi-AI Escalation

After 3 single-session refactoring audits, a full multi-AI Refactoring Audit is recommended.
Track this in AUDIT_TRACKER.md "Single audits completed" counter.
