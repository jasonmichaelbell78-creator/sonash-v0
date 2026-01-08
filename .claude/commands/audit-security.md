---
description: Run a single-session security audit on the codebase
---

# Single-Session Security Audit

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results. Check for security-sensitive file changes.
- Display count of security-sensitive files changed
- If none: "⚠️ No security-sensitive changes detected. Proceed anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Dependency vulnerabilities
npm audit --json 2>&1 | head -50

# Security lint warnings
npm run lint 2>&1 | grep -i "security" | head -10

# Pattern compliance (security patterns)
npm run patterns:check 2>&1

# Check for .env files
ls -la .env* 2>/dev/null || echo "No .env files found"
```

**Step 3: Check Template Currency**

Read `docs/templates/MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md` and verify:
- [ ] FIREBASE_CHANGE_POLICY.md reference is valid
- [ ] Security-sensitive file list is current
- [ ] OWASP categories are complete
- [ ] Firestore rules path is correct

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (6 Categories):**
1. Authentication & Authorization (auth checks, role validation)
2. Input Validation (sanitization, injection prevention)
3. Data Protection (encryption, PII handling, secrets)
4. Firebase/Firestore Security (rules, Cloud Functions)
5. Dependency Security (npm audit, outdated packages)
6. OWASP Top 10 Coverage

**For each category:**
1. Search relevant files using Grep/Glob
2. Identify specific vulnerabilities with file:line references
3. Classify severity: S0 (Critical) | S1 (High) | S2 (Medium) | S3 (Low)
4. Classify OWASP category if applicable
5. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)

**Security-Sensitive Files to Check:**
- `firestore.rules`
- `functions/src/**/*.ts`
- `lib/firebase*.ts`
- `lib/auth*.ts`
- `middleware.ts`
- Any file with "security", "auth", "token", "secret" in name

**Scope:**
- Include: `app/`, `components/`, `lib/`, `functions/`, `firestore.rules`
- Exclude: `node_modules/`, `.next/`, `docs/`

---

## Output Requirements

**1. Markdown Summary (display to user):**
```markdown
## Security Audit - [DATE]

### Baselines
- npm audit: X vulnerabilities (Y critical, Z high)
- Security patterns: X violations
- Security-sensitive files: X changed since last audit

### Findings Summary
| Severity | Count | OWASP Category |
|----------|-------|----------------|
| S0 | X | ... |
| S1 | X | ... |
| S2 | X | ... |
| S3 | X | ... |

### Critical/High Findings (Immediate Action)
1. [file:line] - Description (S0/OWASP-A01)
2. ...

### Dependency Vulnerabilities
- ...

### Recommendations
- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/security/audit-[YYYY-MM-DD].jsonl`

Each line:
```json
{"id":"SEC-001","category":"Auth|Input|Data|Firebase|Deps|OWASP","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","owasp":["A01","A03"],"file":"path/to/file.ts","line":123,"title":"Short description","description":"Detailed vulnerability","recommendation":"How to fix","cwe":"CWE-XXX","evidence":["code snippet"]}
```

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/security/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and remediation plan.

---

## Post-Audit

1. Display summary to user
2. Confirm files saved to `docs/audits/single-session/security/`
3. **Update AUDIT_TRACKER.md** - Add entry to "Security Audits" table:
   - Date: Today's date
   - Session: Current session number from SESSION_CONTEXT.md
   - Commits Covered: Number of commits since last security audit
   - Files Covered: Number of security-sensitive files analyzed
   - Findings: Total count (e.g., "1 S0, 2 S1, 3 S2")
   - Reset Threshold: YES
4. If S0/S1 findings: "⚠️ Critical security issues found. Recommend immediate remediation."
5. Ask: "Would you like me to fix any of these issues now?"

---

## Threshold System

### Category-Specific Thresholds

This audit resets ONLY the **Security** category threshold in `docs/AUDIT_TRACKER.md`.

**Security audit triggers (check AUDIT_TRACKER.md):**
- ANY security-sensitive file modified, OR
- 20+ commits since last security audit

### Multi-AI Escalation

After 3 single-session security audits, a full multi-AI Security Audit is recommended.
Track this in AUDIT_TRACKER.md "Single audits completed" counter.
