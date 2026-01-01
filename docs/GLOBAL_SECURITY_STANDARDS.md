# Global Security Standards

**Document Type:** FOUNDATION (Tier 2)
**Version:** 1.0
**Created:** 2026-01-01
**Last Updated:** 2026-01-01
**Status:** ACTIVE
**Authority:** MANDATORY for all code changes

---

## Purpose

This document defines **mandatory security standards** that apply to ALL code in this repository, regardless of who writes it (human or AI). These standards must be followed during:

- New feature development
- Bug fixes
- Refactoring
- Code reviews
- Security audits

**No code should be merged that violates these standards without an approved exception.**

---

## Quick Reference (TL;DR)

Before writing or reviewing ANY code, verify:

| # | Standard | One-Line Check |
|---|----------|----------------|
| 1 | **Rate Limiting** | All public endpoints have IP + user-based limits with graceful 429s |
| 2 | **Input Validation** | All user inputs validated with schemas, type checks, length limits |
| 3 | **Secrets Management** | No hardcoded keys; all secrets in env vars; nothing exposed client-side |
| 4 | **OWASP Compliance** | Code follows OWASP Top 10; clear comments; no breaking changes |

---

## Standard 1: Rate Limiting & Throttling

### Requirements

All public-facing endpoints and user-triggered actions MUST have rate limiting:

| Requirement | Details | Status Check |
|-------------|---------|--------------|
| IP-based limiting | Prevent abuse from single IP | `grep -r "RateLimiter" --include="*.ts"` |
| User-based limiting | Prevent abuse from authenticated users | Check limiter uses `userId` |
| Sensible defaults | Auth: 5/min, Writes: 10/min, Reads: 60/min | Review `lib/constants.ts` |
| Graceful 429 responses | Include `Retry-After` header, user-friendly message | Test endpoint manually |
| Client-side UX limiting | Disable buttons during cooldown | Check UI components |

### Implementation Checklist

```
[ ] Cloud Functions: All callable functions use rate limiting
[ ] API routes: All Next.js API routes have rate limiting middleware
[ ] Client hooks: Write operations use client-side rate limiter for UX
[ ] Constants: RATE_LIMITS defined in lib/constants.ts
[ ] Logging: Rate limit violations are logged for monitoring
```

### Verification Commands

```bash
# Check all Cloud Functions have rate limiting
grep -rn "onCall" functions/src/ | head -20
# Then verify each has rate limit check

# Check rate limit constants exist
grep -rn "RATE_LIMITS" lib/

# Check for rate limiter usage
grep -rn "RateLimiter\|rateLimiter\|rateLimit" --include="*.ts" --include="*.tsx"
```

### Approved Patterns

```typescript
// Cloud Function with rate limiting
export const myCallable = onCall(async (request) => {
  // Rate limit check FIRST
  await enforceRateLimit(request.auth?.uid, 'myCallable', {
    maxRequests: 10,
    windowMs: 60000
  });

  // Then proceed with logic
});

// Client-side rate limiting for UX
const { isLimited, tryAction } = useRateLimiter('saveEntry', {
  maxRequests: 5,
  windowMs: 60000
});
```

---

## Standard 2: Input Validation & Sanitization

### Requirements

ALL user inputs MUST be validated before processing:

| Requirement | Details | Status Check |
|-------------|---------|--------------|
| Schema-based validation | Use Zod or similar for structured validation | `grep -r "z\." --include="*.ts"` |
| Type enforcement | TypeScript types + runtime validation | Check service layer |
| Length limits | Max lengths for all string inputs | Review schemas |
| Reject unknown fields | `.strict()` mode on schemas | Check schema definitions |
| Sanitization | XSS prevention on displayed content | Check output encoding |

### Implementation Checklist

```
[ ] All API inputs: Validated with Zod schema before processing
[ ] All form inputs: Client-side validation + server-side validation
[ ] Firestore writes: Data validated before write, not just after
[ ] Error messages: Do not expose internal details
[ ] File uploads: Type, size, and content validation (if applicable)
```

### Verification Commands

```bash
# Check for Zod usage
grep -rn "import.*from 'zod'\|from \"zod\"" --include="*.ts"

# Check for .parse() or .safeParse() calls
grep -rn "\.parse(\|\.safeParse(" --include="*.ts"

# Check for strict schemas
grep -rn "\.strict()" --include="*.ts"

# Look for potential unvalidated inputs
grep -rn "request\.data\[" functions/src/
```

### Approved Patterns

```typescript
// Schema definition with all requirements
const JournalEntrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().max(50)).max(10).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
}).strict(); // Reject unknown fields

// Validation in Cloud Function
export const saveEntry = onCall(async (request) => {
  const result = JournalEntrySchema.safeParse(request.data);
  if (!result.success) {
    throw new HttpsError('invalid-argument', 'Invalid entry data');
  }
  const validatedData = result.data;
  // Proceed with validated data only
});
```

---

## Standard 3: API Keys & Secrets Management

### Requirements

NO secrets should ever be hardcoded or exposed client-side:

| Requirement | Details | Status Check |
|-------------|---------|--------------|
| No hardcoded keys | Zero API keys, passwords, or secrets in code | Grep verification |
| Environment variables | All secrets loaded from env vars | Check `.env.example` |
| Server-side only | Secrets never sent to client bundle | Check `NEXT_PUBLIC_` usage |
| Key rotation | Rotation policy documented | Check docs |
| .env in .gitignore | Env files never committed | Check `.gitignore` |

### Implementation Checklist

```
[ ] Grep clean: No hardcoded keys found (see commands below)
[ ] .env.example: Documents all required env vars (no values)
[ ] .gitignore: Includes .env, .env.local, .env.*.local
[ ] Client bundle: Only NEXT_PUBLIC_ vars are safe (and contain no secrets)
[ ] Firebase config: Uses environment variables, not hardcoded
[ ] Cloud Functions: Secrets via Firebase config or Secret Manager
```

### Verification Commands

```bash
# Check for hardcoded API keys (common patterns)
grep -rn "sk_live\|sk_test\|api_key.*=.*['\"]" --include="*.ts" --include="*.tsx" --include="*.js"

# Check for hardcoded Firebase config
grep -rn "apiKey.*:.*['\"][A-Za-z0-9]" --include="*.ts" --include="*.tsx"

# Check for secrets in client-accessible code
grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*PASSWORD" --include="*.ts"

# Verify .gitignore includes env files
grep -n "\.env" .gitignore

# Check what's in .env.example (should have no actual values)
cat .env.example 2>/dev/null || echo "No .env.example found"
```

### Approved Patterns

```typescript
// Server-side only (Cloud Functions)
const apiKey = process.env.EXTERNAL_API_KEY;
if (!apiKey) {
  throw new Error('EXTERNAL_API_KEY not configured');
}

// Next.js server-side
// In lib/config.ts (server only)
export const serverConfig = {
  apiKey: process.env.API_KEY!, // Not NEXT_PUBLIC_
};

// Firebase config from env vars
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // This is OK - Firebase API key is designed to be public
  // But other secrets must NOT use NEXT_PUBLIC_
};
```

### Forbidden Patterns

```typescript
// NEVER do this
const API_KEY = "sk_live_abc123xyz"; // Hardcoded secret

// NEVER do this
const SECRET = process.env.NEXT_PUBLIC_SECRET_KEY; // Secret exposed to client

// NEVER commit this
// .env with real values (should be in .gitignore)
```

---

## Standard 4: OWASP Top 10 Compliance

### Requirements

Code must follow OWASP best practices and not introduce vulnerabilities:

| OWASP Category | Our Requirement | Verification |
|----------------|-----------------|--------------|
| A01: Broken Access Control | Auth checks on all protected routes/functions | Review auth guards |
| A02: Cryptographic Failures | Use Firebase Auth, no custom crypto | Check auth implementation |
| A03: Injection | Parameterized queries, no string concat for paths | Code review |
| A04: Insecure Design | Follow established patterns | Architecture review |
| A05: Security Misconfiguration | Firestore rules match code assumptions | Rules audit |
| A06: Vulnerable Components | Regular dependency updates | `npm audit` |
| A07: Auth Failures | Firebase Auth with proper session handling | Auth flow review |
| A08: Data Integrity Failures | Validate all external data | Schema validation |
| A09: Logging Failures | Log security events, no sensitive data | Log review |
| A10: SSRF | Validate URLs, use allowlists | URL handling review |

### Implementation Checklist

```
[ ] Authentication: All protected routes check auth state
[ ] Authorization: Users can only access their own data (userId checks)
[ ] Firestore rules: Match code-level access patterns
[ ] Dependencies: No known vulnerabilities (npm audit clean)
[ ] Error handling: Errors don't expose internals
[ ] Comments: Security-relevant code has clear comments
[ ] No breaking changes: Existing functionality preserved
```

### Verification Commands

```bash
# Check for auth guards on protected routes
grep -rn "useAuth\|getServerSession\|auth\(\)" app/ --include="*.tsx"

# Check Firestore rules for user scoping
grep -n "request.auth.uid" firestore.rules

# Run dependency vulnerability check
npm audit

# Check for console.log with potentially sensitive data
grep -rn "console\.log.*password\|console\.log.*token\|console\.log.*secret" --include="*.ts"
```

### Comment Requirements

Security-relevant code MUST have clear comments:

```typescript
// SECURITY: Rate limiting enforced before any data access
await enforceRateLimit(userId, 'readEntries');

// SECURITY: User can only read their own journal entries
// This mirrors firestore.rules: match /users/{userId}/journal/{entryId}
const entries = await getUserJournalEntries(userId);

// SECURITY: Input validated against schema before Firestore write
const validated = JournalEntrySchema.parse(data);
```

---

## Exception Process

If a standard cannot be met, you MUST:

1. **Document the exception** in the PR description
2. **Explain why** the standard cannot be met
3. **Get explicit approval** from a code owner
4. **Add a TODO** with timeline for remediation
5. **Track in ROADMAP.md** if remediation is deferred

**Exception format in PR:**

```markdown
## Security Exception Request

**Standard:** [Which standard]
**Reason:** [Why it cannot be met]
**Risk assessment:** [What's the risk]
**Mitigation:** [What we're doing instead]
**Remediation timeline:** [When will this be fixed]
**Approver:** [Who approved this exception]
```

---

## Automated Enforcement

These standards are enforced at multiple levels:

| Level | Tool | What It Checks |
|-------|------|----------------|
| Pre-commit | Husky + lint-staged | Secrets detection, lint errors |
| CI/CD | GitHub Actions | npm audit, lint, test, build |
| Code Review | AI Review (CodeRabbit/Qodo) | Pattern detection |
| Security Audit | Multi-AI Security Audit | Comprehensive review |

### Pre-commit Hook (to be added)

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for hardcoded secrets
if grep -rn "sk_live\|sk_test\|api_key.*=.*['\"][A-Za-z0-9]" --include="*.ts" --include="*.tsx" .; then
  echo "ERROR: Potential hardcoded secret detected"
  exit 1
fi

npm run lint-staged
```

---

## Related Documents

- **AI_WORKFLOW.md** - AI session workflow (references this doc)
- **MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md** - Security audit template
- **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md** - Code review template
- **firestore.rules** - Firestore security rules
- **EIGHT_PHASE_REFACTOR_PLAN.md** - Security refactoring tracking

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-01 | Initial creation with 4 mandatory standards | Claude |

---

**END OF GLOBAL_SECURITY_STANDARDS.md**
