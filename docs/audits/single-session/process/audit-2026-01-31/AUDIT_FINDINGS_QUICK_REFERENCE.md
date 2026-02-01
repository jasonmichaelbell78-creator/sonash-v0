# SoNash Security Audit - Quick Reference Card

## Critical Issues (Fix Immediately)

### CANON-0003: NUL Byte Path Traversal

```javascript
// VULNERABLE
function validatePathInDir(baseDir, userPath) {
  if (!userPath || typeof userPath !== "string" || userPath.trim() === "") {
    throw new Error(`Path must be within ${path.basename(baseDir)}/`);
  }
  // MISSING: NUL byte check!
  const resolved = path.resolve(baseDir, userPath);
```

**FIX:** Add before path.resolve():

```javascript
if (userPath.includes("\x00")) {
  throw new Error("NUL byte in path rejected");
}
```

**FILE:** `scripts/lib/security-helpers.js:104-118` **EFFORT:** 3 lines

---

### CANON-0008: Command Injection via PATH Manipulation

```javascript
// VULNERABLE
execFileSync("git", ["add", "--", validPath], { cwd: repoRoot });
// 'git' resolved from potentially untrusted PATH
```

**FIX:** Use absolute path:

```javascript
const GIT_BIN =
  process.platform === "win32"
    ? "C:\\Program Files\\Git\\bin\\git.exe"
    : "/usr/bin/git";
execFileSync(GIT_BIN, ["add", "--", validPath], { cwd: repoRoot });
```

**FILE:** `scripts/lib/security-helpers.js:171-182` **EFFORT:** 10+ lines

---

## High Priority Issues (Fix Next Release)

### CANON-0013: SSRF via Unvalidated Port

```javascript
// VULNERABLE: Allows https://api.github.com:6379
validateUrl("https://api.github.com:6379", ["api.github.com"]); // Returns valid!
```

**FIX:** Add port check:

```javascript
if (url.port && url.port !== "" && url.port !== "443") {
  return { valid: false, error: "Custom ports not allowed" };
}
```

**FILE:** `scripts/lib/security-helpers.js:352-389` **EFFORT:** 5 lines

---

## Medium Priority Issues

### CANON-0002: Overly Broad Error Sanitization

Remove pattern: `/\/[^\s]*\/[^\s]+/g` - matches too broadly

### CANON-0004: Missing Number Validation

Add check: `if (!Number.isFinite(num)) { ... }`

### CANON-0006: TOCTOU Race in verifyContainment

Document as acceptable for git hooks, or resolve projectDir once

### CANON-0010: DoS in maskEmail

Cap email at 254 chars, domain labels at 50

### CANON-0014: Weak IPv4 Validation

Validate octet bounds (0-255), not just regex matching

---

## Audit Statistics

| Category           | Count |
| ------------------ | ----- |
| Total Findings     | 15    |
| Resolved           | 1     |
| Critical (S1)      | 2     |
| Important (S2)     | 7     |
| Minor (S3)         | 5     |
| Pattern Violations | 0     |

---

## Files Audited

- `scripts/lib/sanitize-error.js` (157 lines) - PASSED
- `scripts/lib/security-helpers.js` (489 lines) - PASSED with findings
- `scripts/lib/validate-paths.js` (228 lines) - PASSED with findings

---

## Key Strengths

- Uses `execFileSync()` with argument arrays (prevents shell injection)
- Good symlink detection with parent directory checks
- Proper try/catch wrapping for file operations
- Exclusive file creation with `wx` flag and 0o600 permissions
- Comprehensive pattern matching with /g flag reset

---

## Key Vulnerabilities

1. **Path Traversal:** Missing NUL byte validation (S1)
2. **Command Injection:** Git binary not validated (S1)
3. **SSRF:** No port validation in URL allowlist (S2 - High)
4. **DoS:** Unbounded email processing (S2)
5. **Over-Sanitization:** Broad regex patterns lose context (S2)

---

## Implementation Order

### Immediate

1. CANON-0003: NUL byte validation
2. CANON-0008: Git binary resolution

### Next Release

3. CANON-0013: Port validation
4. CANON-0002: Sanitization refactor
5. CANON-0004: Number validation
6. CANON-0010: Email bounds

### Backlog

7. CANON-0006: TOCTOU documentation
8. CANON-0014: IPv4 validation
9. S3 findings

---

## Testing Checklist

- [ ] Unit tests for NUL byte rejection
- [ ] Unit tests for git binary resolution
- [ ] Unit tests for port validation
- [ ] Fuzz tests for URL/email validation
- [ ] Regression tests for path traversal
- [ ] Integration tests for git operations
- [ ] Run `npm audit` and `snyk` scan

---

## Reference Documents

- **Full Report:** `SECURITY_AUDIT_REPORT.md`
- **Patches:** `SECURITY_AUDIT_PATCHES.md`
- **Machine-Readable:** `audit-findings.jsonl`
- **CODE_PATTERNS.md:** 180+ patterns from SoNash
- **SECURITY_CHECKLIST.md:** Pre-write security checklist

---

**Generated:** 2026-01-31 **Scope:** Security helper modules **Status:** 2
Critical, 7 Important, 5 Minor findings
