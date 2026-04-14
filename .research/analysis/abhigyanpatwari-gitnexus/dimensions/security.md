# GitNexus Security Audit

**Band:** Adequate | **Score:** 68/100

**Justification:** Strong SSRF/URL validation, output sanitization, and no
hardcoded secrets; however, LLM prompt injection surface is unguarded,
credentials leakage paths exist via Git environment, and CI lacks
SBOM/dependency scanning.

---

## Executive Summary

GitNexus is a TypeScript-based code intelligence tool that runs locally or in
browsers, indexing repositories and querying them via MCP/CLI. The security
model assumes trusted, local execution (localhost-only CORS, server-local
binding). Key strengths include URL validation (SSRF protection) and output
escaping. Key risks stem from:

1. **Unguarded LLM prompt injection** — user code from indexed repos feeds
   directly into LLM prompts
2. **Credential leakage via Git subprocess** — inherited process.env may leak
   GitHub tokens
3. **No dependency scanning in CI** — no automated CVE checks
4. **Implicit trust in local file system** — limited path traversal checks

---

## Top 5 Security Findings

### S1 | LLM Prompt Injection (High Risk)

**Severity:** S2 (High) **File:** gitnexus/src/core/wiki/prompts.ts **Pattern:**
User-supplied code concatenated into LLM prompts without sanitization
**Details:**

- SOURCE_CODE, INTRA_CALLS, etc. embedded directly in prompts
- No tokenization or isolation between user code and LLM input
- Malicious code comments could inject instructions
- No output validation

### S2 | Git Credential Leakage via Inherited Env

**Severity:** S2 (High) **File:** gitnexus/src/server/git-clone.ts:196-206
**Pattern:** spawn('git', args, { env: {...process.env} }) **Details:**

- Full process.env inherited including GITHUB_TOKEN, SSH keys
- No credentials filtering before subprocess spawn
- Malicious repos could exfiltrate tokens via git hooks

### S3 | Mermaid Diagram Rendering XSS Risk

**Severity:** S2 (High - mitigated with DOMPurify) **File:**
gitnexus-web/src/components/MermaidDiagram.tsx:73-77 **Pattern:**
dangerouslySetInnerHTML + DOMPurify.sanitize() **Details:**

- htmlLabels: true enables HTML rendering
- DOMPurify applied post-render
- No Content Security Policy observed

### S4 | Missing Dependency Scanning in CI

**Severity:** S1 (Critical - supply chain risk) **File:**
.github/workflows/ci.yml **Pattern:** No npm audit, snyk, or SBOM generation
**Details:**

- Pulls from 20+ tree-sitter parsers
- No enforcement against vulnerable transitive deps
- Publish workflow lacks security gates

### S5 | No CORS Policy Verification

**Severity:** S1 (Medium) **File:** gitnexus/src/server/api.ts:58-107
**Pattern:** Hardcoded https://gitnexus.vercel.app without pinning **Details:**

- No certificate pinning
- Low impact because tool runs on localhost by default

---

## Auth & Token Handling

- No built-in GitHub OAuth integration
- Git clones rely on user's existing credentials
- GIT_TERMINAL_PROMPT=0 prevents interactive prompts
- GITNEXUS_EMBEDDING_API_KEY read from process.env (not persisted)
- Risk: Tokens inherited by git subprocess

---

## Dependency Risk Assessment

High-Signal Dependencies:

- @huggingface/transformers ^3.0.0 - ML model loading
- onnxruntime-node ^1.24.0 - Native module; platform-specific
- tree-sitter-\* 0.23.x - Parser complexity
- mermaid ^11.12.2 - Diagram rendering with JS execution
- dompurify ^3.3.3 - Well-maintained; audited
- express ^4.19.2 - Latest; no known issues

---

## Positive Security Signals

1. URL Validation (SSRF): Comprehensive checks for private IPs. EXCELLENT.
2. Output Sanitization: DOMPurify used for Mermaid SVG. STRONG.
3. Localhost-Only by Default: HTTP server binds to localhost. SAFE.
4. No Hardcoded Secrets: Repository is clean. GOOD HYGIENE.
5. Husky + Lint Hooks: Pre-commit enforcement. PREVENTIVE.
6. Type Safety: Full TypeScript with --strict. REDUCES ERRORS.
7. File Permissions: Config files 0o600 on Unix. PROTECTION.
8. Git Credential Isolation: GIT_TERMINAL_PROMPT=0. REDUCES SURFACE.

---

## Recommendations

### Critical (P0)

- Implement LLM prompt injection defense with tokenization and escaping
- Filter inherited env in Git subprocess before spawn
- Add npm audit and dependency scanning to CI

### High (P1)

- Disable htmlLabels: true in Mermaid
- Implement Content Security Policy (CSP)
- Document Git credential handling risks

### Medium (P2)

- Add SBOM generation to publish workflow
- Pin transitive dependencies for security-critical packages
- Validate symbol names before embedding in prompts

### Low (P3)

- Remove hardcoded Vercel origin or make configurable
- Add symlink checks to .gitnexus/ directory
- Log security events

---

**Audit Date:** 2026-04-13 **Reviewer:** Claude Code Security Audit **Scope:**
GitNexus v1.6.1 monorepo
