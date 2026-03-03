---
name: audit-security
description: Run a single-session security audit on the codebase
supports_parallel: true
fallback_available: true
estimated_time_parallel: 15 min
estimated_time_sequential: 60 min
---

# Single-Session Security Audit

## When to Use

- Tasks related to audit-security
- User explicitly invokes `/audit-security`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Execution Mode Selection

| Condition                                 | Mode       | Time    |
| ----------------------------------------- | ---------- | ------- |
| Task tool available + no context pressure | Parallel   | ~15 min |
| Task tool unavailable                     | Sequential | ~60 min |
| Context running low (<20% remaining)      | Sequential | ~60 min |
| User requests sequential                  | Sequential | ~60 min |

---

## Section A: Parallel Architecture (4 Agents)

**When to use:** Task tool available, sufficient context budget, no S0/S1 in
scope

### Agent 1: vulnerability-scanner

**Focus Areas:**

- Authentication & Authorization
- Input Validation & Injection Prevention
- OWASP Top 10 Coverage

**Files:**

- `src/api/**/*.ts` (API routes)
- `middleware.ts`
- `lib/auth*.ts`
- Form handlers, input components

### Agent 2: supply-chain-auditor

**Focus Areas:**

- Dependency Security & Supply Chain
- Package vulnerabilities (npm audit)
- License compliance
- Unpinned versions, risky postinstall scripts

**Files:**

- `package.json`, `package-lock.json`
- All import statements

### Agent 3: framework-security-auditor

**Focus Areas:**

- Framework-Specific Security
- Hosting & Headers Security
- Server/client boundary leaks

**Files:**

- `config/**`
- Any framework config files

### Agent 4: ai-code-security-auditor

**Focus Areas:**

- AI-Generated Code & Agent Security
- Crypto & Randomness
- File Handling Security
- Product/UX Security Risks

**Files:**

- `.claude/` configs
- Files with `crypto`, `random`, `hash` patterns
- File upload handlers
- Admin UI components

### Parallel Execution Command

```markdown
Invoke all 4 agents in a SINGLE Task message:

Task 1: vulnerability-scanner agent - audit auth, input validation, OWASP
Task 2: supply-chain-auditor agent - audit dependencies, npm packages
Task 3: framework-security-auditor agent - audit framework security, headers
Task 4: ai-code-security-auditor agent - audit AI patterns, crypto, files

Each agent prompt MUST end with:

CRITICAL RETURN PROTOCOL:

- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: [agent-id] wrote N findings to [output-path]`
- Do NOT return full findings content — orchestrator checks completion via file
```

**Dependency constraints:** All 4 agents are independent -- no ordering
required. Each writes to a separate JSONL section. S0/S1 findings trigger
immediate notification but do not block other agents.

### Coordination Rules

1. Each agent writes findings to separate JSONL section
2. S0/S1 findings trigger immediate notification
3. File conflicts resolved by framework-security-auditor (highest authority)

---

## Section B: Sequential Fallback (Single Agent)

**When to use:** Task tool unavailable, context limits, or user preference

**Execution Order (priority-first):**

1. AI Security Patterns (S0 potential) - 15 min
2. Auth & Authorization - 10 min
3. Input Validation - 10 min
4. Supply Chain (npm audit) - 5 min
5. Remaining categories - 20 min

**Total:** ~60 min (vs ~15 min parallel)

**Checkpointing:** After each category, write intermediate findings to file
before continuing. This protects against context loss.

### Checkpoint Format

```json
{
  "started_at": "ISO timestamp",
  "categories_completed": ["Auth", "Input"],
  "current_category": "DataProtection",
  "findings_count": 24,
  "last_file_written": "stage-2-findings.jsonl"
}
```

---

## Pre-Audit Validation

**Step 0: Episodic Memory Search**

Before running security audit, search for context from past security sessions:

```javascript
mcp__plugin_episodic_memory_episodic_memory__search({
  query: ['security audit', 'S0', 'vulnerability'],
  limit: 5,
});

mcp__plugin_episodic_memory_episodic_memory__search({
  query: ['OWASP', 'injection', 'auth bypass'],
  limit: 5,
});
```

**Why this matters:**

- Compare against previous security findings (regression detection)
- Identify recurring vulnerabilities (may indicate architectural issue)
- Track which S0/S1 issues were resolved vs still open
- Prevent re-flagging known false positives

---

**Step 1: Check Thresholds**

Run `npm run review:check` and report results. Check for security-sensitive file
changes.

- Display count of security-sensitive files changed
- If none: "No security-sensitive changes detected. Proceed anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Dependency vulnerabilities (extract summary without truncating JSON)
npm audit --json 2>/dev/null | node -e '
try {
  const d = JSON.parse(require("fs").readFileSync(0,"utf8"));
  console.log(JSON.stringify(d.metadata?.vulnerabilities ?? d.vulnerabilities ?? {}, null, 2));
} catch (e) {
  console.log("{\"error\": \"Invalid JSON from npm audit\"}");
}
'

# Security lint warnings
npm run lint 2>&1 | grep -i "security" | head -10

# Check for .env files (existence only - no permission/owner metadata needed)
ls .env* 2>/dev/null || echo "No .env files found"
```

**Step 3: Load False Positives Database**

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and filter findings matching:

- Category: `security`
- Expired entries (skip if `expires` date passed)

Note patterns to exclude from final findings.

---

## Audit Execution

**Focus Areas (12+ Categories):**

1. Authentication & Authorization (auth checks, role validation, IDOR, privilege
   escalation)
2. Input Validation & Injection Prevention:
   - SQL/NoSQL injection, command injection
   - Template injection, eval/Function(), new Function()
   - Unsafe deserialization, prototype pollution
3. Data Protection (encryption, PII handling, secrets, overly verbose errors)
4. Dependency Security & Supply Chain:
   - npm audit, outdated packages
   - Unpinned versions, risky postinstall scripts
   - Unused dependencies with known vulnerabilities
5. OWASP Top 10 Coverage
6. Hosting & Headers Security:
   - CSP, HSTS, X-Frame-Options, X-Content-Type-Options
   - COOP, COEP, Referrer-Policy, Permissions-Policy
7. Framework-Specific Security:
   - Server/client boundary leaks (secrets in client bundles)
   - API route / middleware auth gates
8. File Handling Security:
   - Insecure file upload, path traversal
   - MIME type validation, file size limits
9. Crypto & Randomness:
   - Weak randomness (Math.random for security), broken hashing
   - Unsafe JWT/session handling, homegrown crypto
10. Product/UX Security Risks:
    - Misleading "security UI" (toggles without server enforcement)
    - Dangerous defaults not clearly communicated
    - Admin-only flows accessible via client routes without backend checks
11. AI-Generated Code & Agent Security:
    - Prompt-injection surfaces in scripts/configs
    - Agent config files with unsafe patterns
    - Suspicious strings/comments that could manipulate AI agents
12. AI Security Patterns (AI-Codebase Specific):
    - Prompt Injection Surfaces: `.claude/` configs, agent prompts, LLM
      integrations with user input (S0)
    - Hallucinated Security APIs: Security functions that don't exist or have
      wrong signatures (S1)
    - AI-Suggested Insecure Defaults: Default `any` types, `*` CORS, overly
      permissive rules (S1)
    - Inconsistent Auth Patterns: Different auth approaches across AI sessions
      (S2)
    - AI-Generated Crypto: Homegrown crypto patterns AI might generate (S0)

**For each category:**

1. Search relevant files using Grep/Glob
2. Identify specific vulnerabilities with file:line references
3. Classify severity: S0 (Critical) | S1 (High) | S2 (Medium) | S3 (Low)
4. Classify OWASP category if applicable
5. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)
6. **Assign confidence level** (see Evidence Requirements below)

**Additional Checks for AI-Assisted Codebases:**

- Search for `eval(`, `new Function(`, `Function(` - dynamic code execution
- Search for `dangerouslySetInnerHTML` - XSS vectors
- Search for env vars leaking to client bundles
- Search for `process.env` in client components - boundary leaks
- Search for `postinstall`, `preinstall` in package.json - supply chain
- Search for suspicious patterns in `.claude/` that could be prompt injection

**Scope:**

- Include: `src/`, `components/`, `lib/`, `.claude/`
- Exclude: `node_modules/`, `dist/`, `build/`, `docs/`, `tests/`

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

| Severity | Count | OWASP Category | Confidence  |
| -------- | ----- | -------------- | ----------- |
| S0       | X     | ...            | HIGH/MEDIUM |
| S1       | X     | ...            | HIGH/MEDIUM |
| S2       | X     | ...            | ...         |
| S3       | X     | ...            | ...         |

### Critical/High Findings (Immediate Action)

1. [file:line] - Description (S0/OWASP-A01) - DUAL_PASS_CONFIRMED
2. ...

### False Positives Filtered

- X findings excluded (matched FALSE_POSITIVES.jsonl patterns)

### Dependency Vulnerabilities

- ...

### Recommendations

- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/security/audit-[YYYY-MM-DD].jsonl`

**Category field:** `category` MUST be `security`. Also include `owasp_category`
and `cvss_estimate` fields.

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/security/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and remediation plan.

---

## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements,
> Dual-Pass Verification, Cross-Reference Validation, JSONL Output Format,
> Context Recovery, Post-Audit Validation, MASTER_DEBT Cross-Reference,
> Interactive Review, TDMS Intake & Commit, Documentation References, Agent
> Return Protocol, and Honesty Guardrails.

**Skill-specific TDMS intake:**

```bash
node scripts/debt/intake-audit.js <output.jsonl> --source "audit-security-<date>"
```

**Security audit triggers (check AUDIT_TRACKER.md):**

- ANY security-sensitive file modified, OR
- 20+ commits since last security audit

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
