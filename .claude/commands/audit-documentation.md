---
description: Run a single-session documentation audit on the codebase
---

# Single-Session Documentation Audit

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results.
- If no thresholds triggered: "⚠️ No review thresholds triggered. Proceed anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Documentation lint
npm run docs:check 2>&1 | tail -30

# Document sync check
npm run docs:sync-check 2>&1 | head -30

# Count documentation files
find docs -name "*.md" 2>/dev/null | wc -l

# Check for broken links
grep -rn "\[.*\](.*\.md)" docs/ --include="*.md" 2>/dev/null | head -20

# Recent doc changes
git log --oneline --since="7 days ago" -- "*.md" | head -10
```

**Step 3: Check Template Currency**

Read `docs/templates/MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md` and verify:
- [ ] Document inventory is current
- [ ] Template-instance relationships are tracked
- [ ] Tier structure is accurate

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (6 Categories):**
1. Broken Links (internal cross-references that 404)
2. Stale Content (outdated versions, deprecated info)
3. Coverage Gaps (undocumented features, missing guides)
4. Tier Compliance (docs in correct folders per tier)
5. Frontmatter Consistency (required fields present)
6. Template-Instance Sync (templates match instances)

**For each category:**
1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (Critical - blocks work) | S1 (Major - causes confusion) | S2 (Minor) | S3 (Trivial)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)

**Documentation Checks:**
- All `[text](path.md)` links resolve
- Version numbers in docs match package.json
- Dates in "Last Updated" are reasonable
- Required sections present (Purpose, Usage, etc.)
- No placeholder content ([TODO], [PLACEHOLDER], [X])
- Archive docs properly excluded from lint

**Scope:**
- Include: `docs/`, `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`
- Exclude: `node_modules/`, `.next/`

---

## Output Requirements

**1. Markdown Summary (display to user):**
```markdown
## Documentation Audit - [DATE]

### Baselines
- Total docs: X files
- docs:check errors: X
- docs:sync-check issues: X
- Docs changed (7 days): X

### Findings Summary
| Severity | Count | Category |
|----------|-------|----------|
| S0 | X | ... |
| S1 | X | ... |
| S2 | X | ... |
| S3 | X | ... |

### Broken Links
1. [source.md:line] -> [target.md] (missing)
2. ...

### Stale Documents
1. [file.md] - Last updated X days ago, references deprecated feature
2. ...

### Coverage Gaps
- Feature X has no documentation
- ...

### Recommendations
- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/documentation/audit-[YYYY-MM-DD].jsonl`

Each line:
```json
{"id":"DOC-001","category":"Links|Stale|Coverage|Tier|Frontmatter|Sync","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","file":"docs/path/to/file.md","line":123,"title":"Short description","description":"Detailed issue","recommendation":"How to fix","evidence":["broken link text or stale content"]}
```

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/documentation/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and fix plan.

---

## Post-Audit

1. Display summary to user
2. Confirm files saved to `docs/audits/single-session/documentation/`
3. **Update AUDIT_TRACKER.md** - Add entry to "Documentation Audits" table:
   - Date: Today's date
   - Session: Current session number from SESSION_CONTEXT.md
   - Commits Covered: Number of commits since last documentation audit
   - Files Covered: Number of documentation files analyzed
   - Findings: Total count (e.g., "2 S1, 4 S2, 3 S3")
   - Reset Threshold: YES
4. Ask: "Would you like me to fix any of these documentation issues now?"

---

## Threshold System

### Category-Specific Thresholds

This audit resets ONLY the **Documentation** category threshold in `docs/AUDIT_TRACKER.md`.

**Documentation audit triggers (check AUDIT_TRACKER.md):**
- 20+ doc files changed since last documentation audit, OR
- 30+ commits since last documentation audit

### Multi-AI Escalation

After 3 single-session documentation audits, a full multi-AI Documentation Audit is recommended.
Track this in AUDIT_TRACKER.md "Single audits completed" counter.
