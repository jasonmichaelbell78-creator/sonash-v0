# [Project Name] Multi-AI Security Audit Plan

**Document Version:** 1.0
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Status:** PENDING | IN_PROGRESS | COMPLETE
**Overall Completion:** 0%

---

## Purpose

This document serves as the **execution plan** for running a multi-AI security-focused audit on [Project Name]. Use this template when:

- Security posture assessment is needed
- Before deploying to production
- After significant auth/data handling changes
- Quarterly security review
- After adding new public endpoints or user inputs
- Compliance requirements demand audit

**This template enforces the mandatory standards from [GLOBAL_SECURITY_STANDARDS.md](../GLOBAL_SECURITY_STANDARDS.md).**

**Review Focus Areas (7 Mandatory Categories):**
1. Rate Limiting & Throttling
2. Input Validation & Sanitization
3. API Keys & Secrets Management
4. Authentication & Authorization
5. Firebase Security (Rules, App Check, Functions)
6. Dependency Security & Supply Chain
7. OWASP Top 10 Compliance

**Expected Output:** Security findings with remediation plan, compliance status for each mandatory standard.

---

## Status Dashboard

| Step | Description | Status | Completion |
|------|-------------|--------|------------|
| Step 1 | Prepare audit context | PENDING | 0% |
| Step 2 | Run multi-AI security audit (4-6 models) | PENDING | 0% |
| Step 3 | Collect and validate outputs | PENDING | 0% |
| Step 4 | Run aggregation | PENDING | 0% |
| Step 5 | Create canonical findings doc | PENDING | 0% |
| Step 6 | Generate remediation plan | PENDING | 0% |

**Overall Progress:** 0/6 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Security Audit: [YYYY-MM-DD or "Never"]
```

### Tech Stack Security Considerations

```
- Framework: [e.g., Next.js 16.1] - SSR/CSR boundaries, API routes
- Authentication: [e.g., Firebase Auth] - Session management, token handling
- Database: [e.g., Firestore] - Rules, access patterns
- Security Tools: [e.g., App Check, reCAPTCHA] - Enforcement status
- Rate Limiting: [e.g., Custom RateLimiter] - Coverage status
```

### Scope

```
Security-Critical Paths:
- Authentication flows: [list files/endpoints]
- Data write operations: [list files/endpoints]
- Admin operations: [list files/endpoints]
- Public endpoints: [list files/endpoints]

Include: [directories, e.g., app/, components/, hooks/, lib/, functions/]
Exclude: [directories, e.g., docs/, public/, tests/]
```

### Known Security Context

[Document any known security decisions, exceptions, or pending remediation:]
- Previous audit findings status
- Known accepted risks
- Pending security work

---

## AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model | Capabilities | Security Strength |
|-------|--------------|-------------------|
| Claude Opus 4.5 | browse_files=yes, run_commands=yes | Comprehensive security audit, Firebase expertise, latest attack patterns |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes | Cost-effective security analysis, OWASP knowledge |
| GPT-5.2-Codex | browse_files=yes, run_commands=yes | Deep code analysis, vulnerability detection |
| Gemini 3 Pro | browse_files=yes, run_commands=yes | Alternative security lens, fresh perspective |
| GitHub Copilot | browse_files=yes, run_commands=limited | Pattern detection, quick verification |
| ChatGPT-4o | browse_files=no, run_commands=no | Broad OWASP knowledge |

**Selection criteria:**
- At least 2 models with `run_commands=yes` for grep/lint verification
- At least 1 model with strong OWASP knowledge
- Total 4-6 models for good consensus on security findings

---

## Security Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a senior security engineer performing a comprehensive security audit. Your goal is to verify compliance with mandatory security standards and identify vulnerabilities.

REPO

[GITHUB_REPO_URL]

MANDATORY SECURITY STANDARDS (from GLOBAL_SECURITY_STANDARDS.md)

All code MUST comply with these 4 standards:
1. Rate Limiting: All endpoints have IP + user-based limits with graceful 429s
2. Input Validation: All inputs validated with schemas, type checks, length limits
3. Secrets Management: No hardcoded keys; all secrets in env vars; nothing client-side
4. OWASP Compliance: Follow OWASP Top 10; clear comments; no breaking changes

STACK / CONTEXT

- [Framework]: [Version]
- [Authentication]: [Provider]
- [Database]: [Type]
- [Security Tools]: [List]

PRE-REVIEW CONTEXT (REQUIRED READING)

Before beginning security analysis, review these project-specific resources:

1. **AI Learnings** (claude.md Section 4): Critical anti-patterns and security lessons from past reviews
2. **Pattern History** (docs/AI_REVIEW_LEARNINGS_LOG.md): Documented security patterns from Reviews #1-60+
3. **Current Compliance** (npm run patterns:check output): Known anti-pattern violations baseline
4. **Dependency Health**:
   - Circular dependencies: npm run deps:circular (baseline: 0 expected)
   - Unused exports: npm run deps:unused (baseline documented in DEVELOPMENT.md)
5. **Static Analysis** (docs/analysis/sonarqube-manifest.md): Pre-identified issues including security concerns
6. **Firebase Policy** (FIREBASE_CHANGE_POLICY.md): Required security review process for Firebase changes

These resources provide essential context about known issues and security patterns to avoid.

SCOPE

Security-Critical: [paths]
Include: [directories]
Exclude: [directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:
- Run in "NO-REPO MODE": Cannot complete security audit without repo access
- Stop immediately and report limitation
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A security finding is CONFIRMED only if it includes:
- at least one concrete file path AND
- at least one specific vulnerability indicator (code snippet, config value, missing check)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these 7 categories)

1) Rate Limiting & Throttling
2) Input Validation & Sanitization
3) API Keys & Secrets Management
4) Authentication & Authorization
5) Firebase Security
6) Dependency Security & Supply Chain
7) OWASP Top 10 Compliance
```

### Part 3: Security Audit Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning, verify you can access the repository:
1. State whether you can access files
2. If YES, list 3-5 security-critical files you can see
3. If NO, stop immediately

PHASE 2: ATTACK SURFACE MAPPING

Map the security-critical surface:
- List all public endpoints (API routes, Cloud Functions)
- List all authentication checkpoints
- List all user input handlers
- List all Firestore write operations
- Identify trust boundaries (client vs server)
At the end: "Phase 2 complete - Attack surface mapped: [count] endpoints"

PHASE 3: MANDATORY STANDARDS VERIFICATION

For each of the 6 mandatory categories, perform systematic verification:

Category 1: Rate Limiting & Throttling
REQUIRED CHECKS:
[ ] All public endpoints have rate limiting
[ ] IP-based limiting implemented
[ ] User-based limiting implemented (for authenticated endpoints)
[ ] Sensible defaults defined (Auth: 5/min, Writes: 10/min, Reads: 60/min)
[ ] Graceful 429 responses with Retry-After header
[ ] Rate limit violations logged

VERIFICATION COMMANDS:
- grep -rn "RateLimiter\|rateLimit" --include="*.ts"
- grep -rn "onCall" functions/src/ (check each has rate limit)
- Review lib/constants.ts for RATE_LIMITS

Mark each check: PASS | FAIL | PARTIAL | N/A
Quote specific evidence for each finding.

Category 2: Input Validation & Sanitization
REQUIRED CHECKS:
[ ] Schema-based validation (Zod) on all API inputs
[ ] Type enforcement at runtime
[ ] Length limits on all string inputs
[ ] Unknown fields rejected (.strict())
[ ] XSS prevention on displayed content
[ ] SQL/NoSQL injection prevention

VERIFICATION COMMANDS:
- grep -rn "z\.\|zod" --include="*.ts"
- grep -rn "\.parse(\|\.safeParse(" --include="*.ts"
- grep -rn "\.strict()" --include="*.ts"
- grep -rn "request\.data\[" functions/src/

Mark each check: PASS | FAIL | PARTIAL | N/A
Quote specific evidence for each finding.

Category 3: API Keys & Secrets Management
REQUIRED CHECKS:
[ ] No hardcoded API keys in code
[ ] No hardcoded passwords or secrets
[ ] All secrets in environment variables
[ ] No secrets in NEXT_PUBLIC_ variables
[ ] .env files in .gitignore
[ ] .env.example exists (without values)

VERIFICATION COMMANDS:
- grep -rn "sk_live\|sk_test\|api_key.*=.*['\"]" --include="*.ts"
- grep -rn "password.*=.*['\"]" --include="*.ts"
- grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*KEY" --include="*.ts"
- cat .gitignore | grep -i env
- ls -la | grep env

Mark each check: PASS | FAIL | N/A
Quote specific evidence for each finding.

Category 4: Authentication & Authorization
REQUIRED CHECKS:
[ ] All protected routes require authentication
[ ] User can only access own data (userId checks)
[ ] Admin routes have role verification
[ ] Session management is secure
[ ] Token handling follows best practices
[ ] Logout properly invalidates session

VERIFICATION COMMANDS:
- grep -rn "useAuth\|getServerSession" app/ --include="*.tsx"
- grep -rn "request\.auth\.uid" functions/src/
- Review auth-provider.tsx for session handling

Mark each check: PASS | FAIL | PARTIAL | N/A
Quote specific evidence for each finding.

Category 5: Firebase Security
REQUIRED CHECKS:
[ ] Firestore rules enforce user scoping
[ ] Rules match code-level access patterns
[ ] App Check enabled and enforced
[ ] Cloud Functions verify auth before processing
[ ] Rate limiting in Cloud Functions
[ ] No direct client Firestore writes to sensitive collections

VERIFICATION COMMANDS:
- cat firestore.rules
- grep -rn "request.auth.uid" firestore.rules
- grep -rn "appCheck" --include="*.ts"
- grep -rn "onCall" functions/src/ (verify auth checks)

Mark each check: PASS | FAIL | PARTIAL | N/A
Quote specific evidence for each finding.

Category 6: Dependency Security & Supply Chain
REQUIRED CHECKS:
[ ] npm audit shows no critical/high vulnerabilities
[ ] All dependencies up to date or documented exceptions
[ ] License compliance verified (no GPL in production without approval)
[ ] No known vulnerable package versions
[ ] Supply chain risk assessment completed
[ ] Direct dependencies vetted for security practices
[ ] Transitive dependency tree reviewed

VERIFICATION COMMANDS:
- npm audit --json
- npm outdated
- npx license-checker --summary
- npm ls --depth=1 (check direct dependencies)
- Review package-lock.json for unexpected additions

FOCUS AREAS:
- Vulnerability severity (CRITICAL > HIGH > MEDIUM)
- Outdated packages with security patches available
- License compatibility issues
- Suspicious or unmaintained packages
- Large transitive dependency trees

Mark each check: PASS | FAIL | PARTIAL | N/A
Quote specific evidence for each finding.

Category 7: OWASP Top 10 Compliance
Check each OWASP category:

A01 - Broken Access Control:
[ ] Auth checks on all protected routes
[ ] No privilege escalation paths

A02 - Cryptographic Failures:
[ ] Using established auth (Firebase Auth, not custom)
[ ] No weak crypto implementations

A03 - Injection:
[ ] Parameterized queries / ORM usage
[ ] No string concatenation for queries/paths

A04 - Insecure Design:
[ ] Follows established security patterns
[ ] Defense in depth implemented

A05 - Security Misconfiguration:
[ ] Firestore rules properly configured
[ ] No debug modes in production
[ ] Error messages don't expose internals

A06 - Vulnerable Components:
[ ] npm audit clean or issues documented
[ ] No known vulnerable dependencies

A07 - Auth Failures:
[ ] Strong password requirements (if applicable)
[ ] Rate limiting on auth endpoints
[ ] Session timeout configured

A08 - Data Integrity Failures:
[ ] All external data validated
[ ] No unsafe deserialization

A09 - Logging Failures:
[ ] Security events logged
[ ] No sensitive data in logs

A10 - SSRF:
[ ] URL inputs validated
[ ] Allowlists for external requests

Mark each: PASS | FAIL | PARTIAL | N/A

After each category: "Category X complete - Issues found: [number]"

PHASE 4: DRAFT SECURITY FINDINGS

For each issue, create detailed entry:
- Exact file path and line numbers
- Vulnerability description
- Exploitation scenario (how could this be attacked?)
- Severity (S0/S1/S2/S3) with security-specific criteria
- CVSS-like impact assessment
- Remediation steps
- Acceptance tests to verify fix

Security Severity Guide:
- S0 (Critical): Active exploit possible, data breach, privilege escalation
- S1 (High): Significant security weakness, likely exploitable
- S2 (Medium): Security gap, exploitation requires specific conditions
- S3 (Low): Security improvement, hardening recommendation

Number findings sequentially.
At the end: "Phase 4 complete - Total security findings: [count]"

PHASE 5: COMPLIANCE SUMMARY

Summarize compliance status:
- Standard 1 (Rate Limiting): COMPLIANT | NON-COMPLIANT | PARTIAL
- Standard 2 (Input Validation): COMPLIANT | NON-COMPLIANT | PARTIAL
- Standard 3 (Secrets Management): COMPLIANT | NON-COMPLIANT | PARTIAL
- Standard 4 (OWASP Compliance): COMPLIANT | NON-COMPLIANT | PARTIAL

For each NON-COMPLIANT or PARTIAL, list the gaps.

PHASE 6: REMEDIATION PRIORITIES

Rank findings by:
1. Exploitability (how easy to attack)
2. Impact (what's the damage)
3. Affected users (scope)
4. Fix complexity (effort)

Identify:
- Must fix before production
- Should fix within 30 days
- Nice to have improvements

At the end: "Phase 6 complete - Ready to output"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order:

1) COMPLIANCE_STATUS_JSON
{
  "audit_date": "YYYY-MM-DD",
  "overall_status": "COMPLIANT|NON_COMPLIANT|PARTIAL",
  "standards": {
    "rate_limiting": {"status": "...", "gaps": ["..."]},
    "input_validation": {"status": "...", "gaps": ["..."]},
    "secrets_management": {"status": "...", "gaps": ["..."]},
    "owasp_compliance": {"status": "...", "gaps": ["..."]}
  }
}

2) FINDINGS_JSONL
(one JSON object per line, each must be valid JSON)

Schema:
{
  "category": "Rate Limiting|Input Validation|Secrets Management|Authentication|Firebase Security|OWASP",
  "title": "short, specific vulnerability",
  "fingerprint": "<category>::<primary_file>::<vulnerability_type>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "path2"],
  "vulnerability_details": {
    "description": "what's wrong",
    "exploitation": "how it could be attacked",
    "impact": "what damage could occur",
    "affected_data": "what data is at risk"
  },
  "remediation": {
    "steps": ["step 1", "step 2"],
    "code_example": "optional: show fix pattern",
    "verification": ["how to verify fix"]
  },
  "owasp_category": "A01|A02|...|A10|N/A",
  "cvss_estimate": "LOW|MEDIUM|HIGH|CRITICAL",
  "evidence": ["grep output or code snippet"],
  "notes": "optional"
}

3) SUSPECTED_FINDINGS_JSONL
(same schema, but confidence <= 40; needs more investigation)

4) HUMAN_SUMMARY (markdown)
- Compliance status overview (4 standards)
- Critical/High findings requiring immediate action
- Top 5 security risks
- Remediation priority list (ordered)
- Estimated effort for full compliance
```

### Part 5: Security Verification Commands

```markdown
SECURITY VERIFICATION (run if run_commands=yes)

1) Secrets Detection:
- grep -rn "sk_live\|sk_test\|api_key.*=.*['\"][A-Za-z0-9]" --include="*.ts" --include="*.tsx"
- grep -rn "password.*=.*['\"]" --include="*.ts" --include="*.tsx"

2) Rate Limiting Coverage:
- grep -rn "RateLimiter\|rateLimit" --include="*.ts" | wc -l
- grep -rn "onCall" functions/src/ | wc -l

3) Validation Coverage:
- grep -rn "\.parse(\|\.safeParse(" --include="*.ts" | wc -l
- grep -rn "z\.object\|z\.string\|z\.number" --include="*.ts" | wc -l

4) Dependency Vulnerabilities:
- npm audit --json 2>/dev/null | head -50

5) Firebase Rules Check:
- cat firestore.rules | head -100

Paste only minimal excerpts as evidence (file paths + 1-3 relevant lines).
```

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:
- `[model-name]_compliance.json`
- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Security Aggregator

Use this aggregation prompt with a capable model:

```markdown
ROLE

You are the Security Audit Aggregator. Merge multiple AI security audit outputs into one deduplicated, prioritized remediation plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent vulnerabilities not in auditor outputs
- Prioritize by exploitability and impact

COMPLIANCE AGGREGATION

For each of the 4 mandatory standards:
- If ANY model says NON_COMPLIANT → mark NON_COMPLIANT
- If ALL models say COMPLIANT → mark COMPLIANT
- Otherwise → mark PARTIAL

DEDUPLICATION RULES

1) Primary merge: same file + same vulnerability type
2) Secondary merge: same OWASP category + same remediation
3) Never merge different vulnerability types

SEVERITY ESCALATION

If models disagree on severity:
- Take the HIGHER severity if 2+ models agree
- Take the HIGHER severity if any model has evidence

OUTPUT

1) CONSOLIDATED_COMPLIANCE_JSON
2) DEDUPED_FINDINGS_JSONL (with canonical_id)
3) REMEDIATION_PLAN_JSON (ordered by priority)
4) HUMAN_SUMMARY
```

### Step 3: Create Security Findings Document

Create `docs/reviews/SECURITY_AUDIT_[YYYY]_Q[X].md` with:
- Compliance status dashboard
- All findings with remediation steps
- Prioritized fix order
- Estimated effort for full compliance

---

## Implementation Workflow

After aggregation, remediate findings using the same 4-step workflow:

### Step 1: Security Fix Implementer

```markdown
ROLE

You are a Security Engineer implementing fixes from a security audit.

HARD RULES
- Fix security issues ONLY - no feature changes
- Verify fix doesn't break existing functionality
- Add tests for each security fix
- Document each fix with SECURITY: comment

PROCESS
1) Implement fix
2) Run tests: npm test
3) Verify security: run grep checks from audit
4) Document: add SECURITY: comment explaining fix
```

### Step 2-4: Same as Code Review Template

Use R1, R2, and Between-PR checklist from MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md.

---

## Audit History

| Date | Type | Trigger | Models Used | Findings | Compliance Status |
|------|------|---------|-------------|----------|-------------------|
| [Date] | Security Audit | [Reason] | [Models] | [X findings] | [COMPLIANT/PARTIAL/NON_COMPLIANT] |

---

## AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/SECURITY_AUDIT_PLAN_[YYYY]_Q[X].md`
2. **Fill in Audit Context** with project-specific details
3. **Run the security audit prompt** on each model
4. **Collect outputs** in specified formats
5. **Run aggregation** for consolidated findings
6. **Create canonical findings doc**
7. **Prioritize and remediate** based on severity
8. **Update MULTI_AI_REVIEW_COORDINATOR.md** with audit results

**Quality checks before finalizing:**
- [ ] All 4 mandatory standards assessed
- [ ] OWASP Top 10 coverage complete
- [ ] Severity ratings justified
- [ ] Remediation steps actionable
- [ ] Compliance status accurate

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](./JSONL_SCHEMA_STANDARD.md)** - Canonical JSONL schema for all review templates
- **[GLOBAL_SECURITY_STANDARDS.md](../GLOBAL_SECURITY_STANDARDS.md)** - Mandatory standards being verified
- **MULTI_AI_REVIEW_COORDINATOR.md** - Master index and trigger tracking
- **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md** - General code review template
- **[SECURITY.md](../SECURITY.md)** - Additional security documentation
- **firestore.rules** - Firebase security rules

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2026-01-05 | Added PRE-REVIEW CONTEXT section with tooling references; Added Category 6: Dependency Security & Supply Chain (npm audit, license compliance, supply chain risk); Updated AI models to current versions (Opus 4.5, Sonnet 4.5, GPT-5.2-Codex, Gemini 3 Pro); Added reference to FIREBASE_CHANGE_POLICY.md | Claude |
| 1.0 | YYYY-MM-DD | Initial template creation | [Author] |

---

**END OF MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md**
