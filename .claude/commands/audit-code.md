---
description: Run a single-session code review audit on the codebase
---

# Single-Session Code Review Audit

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results. If no thresholds are triggered:
- Display: "⚠️ No review thresholds triggered. Proceed anyway? (This is a lightweight single-session audit)"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Test count
npm test 2>&1 | grep -E "Tests:|passing|failed" | head -5

# Lint status
npm run lint 2>&1 | tail -10

# Pattern compliance
npm run patterns:check 2>&1

# Stack versions
grep -E '"(next|react|typescript)"' package.json | head -5
```

**Step 3: Check Template Currency**

Read `docs/templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md` and verify:
- [ ] Stack versions match package.json
- [ ] Test count baseline is accurate
- [ ] File paths in scope still exist
- [ ] Review range in AI_REVIEW_LEARNINGS_LOG.md is current

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (5 Categories):**
1. Code Hygiene (unused imports, dead code, console.logs)
2. Types & Correctness (any types, type safety, null checks)
3. Framework Best Practices (React patterns, Next.js conventions)
4. Testing Coverage (untested functions, missing edge cases)
5. Security Surface (input validation, auth checks)

**For each category:**
1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (Critical) | S1 (High) | S2 (Medium) | S3 (Low)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)

**Scope:**
- Include: `app/`, `components/`, `lib/`, `hooks/`, `types/`
- Exclude: `node_modules/`, `.next/`, `docs/`, `tests/` (unless testing coverage check)

---

## Output Requirements

**1. Markdown Summary (display to user):**
```markdown
## Code Review Audit - [DATE]

### Baselines
- Tests: X passing, Y failing
- Lint: X errors, Y warnings
- Patterns: X violations

### Findings Summary
| Severity | Count | Top Issues |
|----------|-------|------------|
| S0 | X | ... |
| S1 | X | ... |
| S2 | X | ... |
| S3 | X | ... |

### Top 5 Issues
1. [file:line] - Description (S1/E1)
2. ...

### Quick Wins (E0-E1)
- ...

### Recommendations
- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/code/audit-[YYYY-MM-DD].jsonl`

Each line:
```json
{"id":"CODE-001","category":"Hygiene|Types|Framework|Testing|Security","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","file":"path/to/file.ts","line":123,"title":"Short description","description":"Detailed issue","recommendation":"How to fix","evidence":["code snippet or grep output"]}
```

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/code/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and recommendations.

---

## Post-Audit

1. Display summary to user
2. Confirm files saved to `docs/audits/single-session/code/`
3. **Update AUDIT_TRACKER.md** - Add entry to "Code Audits" table:
   - Date: Today's date
   - Session: Current session number from SESSION_CONTEXT.md
   - Commits Covered: Number of commits since last code audit
   - Files Covered: Number of files analyzed
   - Findings: Total count (e.g., "3 S1, 5 S2, 2 S3")
   - Reset Threshold: YES
4. Ask: "Would you like me to fix any of these issues now?"

---

## Threshold System

### Category-Specific Thresholds

This audit resets ONLY the **Code** category threshold in `docs/AUDIT_TRACKER.md`.

**Code audit triggers (check AUDIT_TRACKER.md):**
- 25+ commits since last code audit, OR
- 15+ code files modified since last code audit

### Multi-AI Escalation

After 3 single-session code audits, a full multi-AI Code Review is recommended.
Track this in AUDIT_TRACKER.md "Single audits completed" counter.
