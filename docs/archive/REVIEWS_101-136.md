# AI Review Learnings Archive: Reviews #101-136

**Archived:** 2026-01-18 **Coverage:** 2026-01-08 to 2026-01-13 **Status:**
Reviews #101-136 archived (audit trail preserved).

**Consolidation note:** See [CODE_PATTERNS.md](../agent_docs/CODE_PATTERNS.md)
for consolidated patterns (latest as of 2026-01-18: v2.0 - CONSOLIDATION #13).

---

## Purpose

This archive contains the audit trail reference for Reviews #101-136. These
reviews cover:

- PR #225-236 comprehensive security hardening (Reviews #109-128)
- SonarQube Quality Gate and compliance fixes (Reviews #101-108)
- Multi-AI aggregated audits: Refactoring, Documentation, Process (Reviews
  #114-116)
- IPv6 normalization, SSRF protection, GitHub Action supply chain (Review #127)
- Cognitive complexity refactoring (Reviews #102, #129)
- Path canonicalization and traversal protection (Reviews #106, #110, #133-134)

**For active reviews, see:**
[AI_REVIEW_LEARNINGS_LOG.md](../AI_REVIEW_LEARNINGS_LOG.md)

---

## Key Patterns Consolidated

### Critical Security Patterns

| Pattern                 | From Review    | Description                                                   |
| ----------------------- | -------------- | ------------------------------------------------------------- |
| Supply chain pinning    | #127           | Pin GitHub Actions to SHA, not tags (CVE-2025-30066)          |
| IPv6-safe normalization | #127           | Don't split by `:` - breaks IPv6 addresses                    |
| SSRF URL allowlist      | #111-113       | Validate external URLs against allowlist before fetch         |
| Path canonicalization   | #110           | Always canonicalize paths after join() before boundary checks |
| ReDoS prevention        | #101, #105-106 | Use bounded patterns, not unbounded `[\s\S]*?`                |

### Major Reliability Patterns

| Pattern               | From Review | Description                                       |
| --------------------- | ----------- | ------------------------------------------------- |
| Cognitive complexity  | #102, #129  | Extract helpers when complexity exceeds 15        |
| JSONL fault tolerance | #105        | Parse lines individually to isolate failures      |
| JSON output mode      | #101        | Guard all console.error when --json flag active   |
| Path containment      | #133-134    | Use path.relative() + `rel === ""` check          |
| Error sanitization    | #111-112    | Log details server-side, return generic to client |

### Process/CI Patterns

| Pattern                    | From Review | Description                          |
| -------------------------- | ----------- | ------------------------------------ |
| Complete TODOs immediately | #103        | Don't leave placeholder functions    |
| Smart fallbacks            | #103        | Use git history for dynamic defaults |
| Exit code documentation    | #121        | Document all script exit codes       |
| Large file gitignore       | #121        | Gitignore large generated JSON files |

---

## Review Summary Index

| Review | Date       | PR/Context            | Items  | Key Focus                                 |
| ------ | ---------- | --------------------- | ------ | ----------------------------------------- |
| #136   | 2026-01-12 | PR #238 Round 3       | 14     | Admin PII logging, batch delete chunking  |
| #135   | 2026-01-12 | PR #238 Round 2       | 10     | Prettier 518 files, dependency cleanup    |
| #134   | 2026-01-12 | PR #238 Round 1       | 12     | Path containment, regex escaping          |
| #133   | 2026-01-12 | PR #238               | 12     | Path.relative containment pattern         |
| #132   | 2026-01-12 | PR #238 Compliance    | 14     | Command injection, Windows paths          |
| #131   | 2026-01-12 | PR #238 CI            | 17     | ESLint globals, spawnSync security        |
| #130   | 2026-01-12 | PR #236 Round 4       | 27     | Sensitive logging in admin functions      |
| #129   | 2026-01-12 | PR #236 Post-Commit   | 9      | Cognitive complexity, fail-closed         |
| #128   | 2026-01-11 | PR #236 Follow-up     | 5      | Sentry IP privacy, CLI arg separator      |
| #127   | 2026-01-11 | PR #236 Comprehensive | 14     | Supply chain, IPv6, reCAPTCHA bypass      |
| #126   | 2026-01-11 | Tier-2 Round 3        | 4      | HUMAN_SUMMARY merged IDs                  |
| #125   | 2026-01-11 | Tier-2 Round 2        | 4      | DEDUP IDs in Top 5 table                  |
| #124   | 2026-01-11 | Tier-2 Round 1        | 9      | PR_PLAN dedup IDs                         |
| #123   | 2026-01-11 | Tier-2 Aggregation    | 118→97 | Cross-category unification                |
| #122   | 2026-01-11 | PR #232 Round 2       | 3      | CRLF normalization, process.exitCode      |
| #121   | 2026-01-11 | PR #232               | 13     | Exit codes, stderr, large JSON            |
| #116   | 2026-01-11 | Process Audit         | 38→14  | Multi-AI audit, CI gates                  |
| #115   | 2026-01-11 | Docs Audit            | 37→14  | Multi-AI audit, broken links              |
| #114   | 2026-01-10 | Refactoring Audit     | 65→27  | Multi-AI audit, complexity                |
| #113   | 2026-01-09 | PR #225 Final         | 6      | Ampersand entity, HTTPS enforcement       |
| #112   | 2026-01-09 | PR #225 Compliance    | 10     | Request timeout, stack trace sanitization |
| #111   | 2026-01-09 | PR #225               | 12     | SSRF allowlist, pagination warning        |
| #110   | 2026-01-09 | PR #225 Follow-up     | 6      | Path canonicalization, boundary checks    |
| #109   | 2026-01-09 | PR #225 Feedback      | 16     | FS error handling, JSON mode              |
| #108   | 2026-01-09 | Update Dependencies   | 1      | Mandatory pattern for coupled docs        |
| #107   | 2026-01-09 | PR #224               | 2      | SSR guard, fetch-pr-feedback auto         |
| #106   | 2026-01-08 | PR Review             | 16     | ReDoS, path traversal, ID parsing         |
| #105   | 2026-01-08 | validate-audit.js     | 17     | ReDoS protection, JSONL resilience        |
| #104   | 2026-01-08 | Single-Session        | 18     | Security patterns, JSON output            |
| #103   | 2026-01-08 | Qodo/SonarQube        | 10     | TODO completion, dynamic fallbacks        |
| #102   | 2026-01-08 | Qodo/SonarQube        | 16     | Cognitive complexity, node: prefix        |
| #101   | 2026-01-08 | SonarQube/Qodo        | 36     | ReDoS (12 instances), JSON corruption     |
| #92-97 | 2026-01-07 | Security Audit        | 24     | Schema improvements, OWASP arrays         |

---

## Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.0     | 2026-01-18 | Initial archive from CONSOLIDATION #13 + ARCHIVE #4 |

---

**Note:** Full review content is preserved in git history. To access original
review details, use `git log` to find commits from 2026-01-08 to 2026-01-13 that
modified `docs/AI_REVIEW_LEARNINGS_LOG.md`.
