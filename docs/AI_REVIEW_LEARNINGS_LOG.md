# AI Review Learnings Log

**Document Version:** 6.5 **Created:** 2026-01-02 **Last Updated:** 2026-01-15

## Purpose

This document is the **audit trail** of all AI code review learnings. Each
review entry captures patterns identified, resolutions applied, and process
improvements made.

**Related Documents:**

- **[AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md)** - How to triage and handle
  reviews
- **[claude.md](../claude.md)** - Distilled patterns (always in AI context)

---

## Quick Start

1. Check recent reviews for relevant patterns
2. Review consolidation status
3. Add new learnings using Review #XX format

---

## Version History

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6.6     | 2026-01-15 | Review #148: Dev Dashboard Security Hardening - 8 items fixed (3 MAJOR: Prettier blank line, raw error exposure, client write-only; 5 MINOR: network errors, stale state, null guard, safe error extraction, non-nullable prop). New patterns: Never expose raw Firebase errors, dev data client read-only, defensive null guards.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6.5     | 2026-01-15 | Review #147: CI Blocker Fixes + Firebase Error Handling - 7 items (1 CRITICAL: logger.debug TS2339; 3 MAJOR: ROADMAP date format, Firestore dev/\* rules, Firebase error specificity; 3 MINOR: token refresh, network errors, errorCode logging). New patterns: prettier-ignore for linter conflicts, explicit admin rules for dev collections, getIdTokenResult(true) for fresh claims.                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6.4     | 2026-01-14 | Review #145: Settings Page Accessibility & Security - 14 items (5 MAJOR: toggle accessibility, date validation, preference preservation, timezone bug, form labels; 9 MINOR: useAuth deprecated, props readonly, silent return, error logging, audit logging, change detection). New patterns: Accessible toggle (button+role=switch), local date formatting, preference spread.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 6.3     | 2026-01-13 | Review #141: PR Review Processing Round 3 - 5 items (1 MEDIUM: schema category token normalization, 4 LOW: grep -E portability, header verification coverage). New patterns: Schema category enums should be single CamelCase tokens without spaces, always use grep -E for alternation patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 6.2     | 2026-01-13 | Review #140: PR Review Processing Round 2 - 7 items (1 MEDIUM: grep xargs hang fix, 6 LOW: category enum alignment, improved grep patterns for empty catches and correlation IDs, grep portability fixes). New patterns: Use while read instead of xargs, align category names with schema enums.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 6.1     | 2026-01-13 | Review #139: PR Review Processing - 11 items (2 MAJOR: missing YAML frontmatter in slash commands, 8 MINOR: documentation lint fixes, grep pattern improvements, Debugging Ergonomics category added to audit-code). New patterns: Commands need YAML frontmatter, Tier-2 docs need Purpose/Version History sections.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6.0     | 2026-01-12 | ARCHIVE #3: Reviews #61-100 → REVIEWS_61-100.md (1740 lines removed, 3170→1430 lines). Active reviews now #101-136. Session #58.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 5.9     | 2026-01-12 | CONSOLIDATION #11: Reviews #121-136 → CODE_PATTERNS.md v1.7 (16 new patterns: 6 Security, 4 JS/TS, 5 CI/Automation, 1 GitHub Actions). Counter reset. Session #57.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 5.8     | 2026-01-12 | Review #136: PR CI Feedback Round 3 (SonarQube + Qodo + CI) - 14 items. Fixed: 7 MAJOR security (admin.ts PII logging sanitized - log queryLength/queryType instead of raw query, leaky error message in adminTriggerJob, Firestore auto-ID instead of Date.now() for collision resistance, id field placement after spread, HttpsError preservation in migrateAnonymousUserData, meetings.ts batch delete chunking for 500-doc limit, use-journal.ts sanitization order - script/style before tags), 3 MAJOR quality (Array.isArray guards in generateSearchableText, unused deps added to knip ignore), 4 MINOR (GLOBAL_EXCLUDE added to pattern checker for dev utility scripts with pre-existing debt). New pattern: Chunk batch operations under Firestore 500-op limit. Session #55. |
| 5.7     | 2026-01-12 | Review #135: PR Cherry-Pick CI Feedback Round 2 (Qodo + CI) - 10 items. Fixed: 6 MAJOR (Prettier formatting 518 files, dependency issues - removed @modelcontextprotocol/sdk + undici, added globals + postcss-load-config, duplicate exports in error-boundary.tsx, pattern compliance pathExclude for meta-detection, matchesWord() wildcard support for ".?" patterns), 4 MINOR (coderabbit exit code opt-in via CODERABBIT_EXIT_ON_FINDINGS env var, pattern-check.js cross-platform path handling using path.sep). Pre-existing issues documented in ROADMAP.md. Session #55.                                                                                                                                                                                                         |
| 5.6     | 2026-01-12 | Review #134: PR Cherry-Pick CI Feedback (Qodo + CI) - 12 items. Fixed: 7 MAJOR (session-start.js path containment security bug using path.relative(), add rel === "" checks to 5 hook files, escape regex in analyze-user-request.js), 5 MINOR (detect sensitive paths in coderabbit-review.js, cap file sizes, exit non-zero on findings, trim input, secure logging). Verified 4 false positives from pattern checker (readFileSync already in try/catch). New pattern: Include rel === "" in all path.relative() containment checks. Session #55.                                                                                                                                                                                                                                       |
| 5.5     | 2026-01-12 | Review #133: PR #238 Round 3 (Qodo + CI) - 12 items. Fixed: 6 MAJOR (JSON arg parsing + path containment + sensitive file filter in coderabbit-review.js, path.relative() containment in check-write/edit-requirements.js + check-mcp-servers.js, lockfile hash null handling in session-start.js), 5 MINOR (filter empty server names, check error/signal in pattern-check.js, wrap realpathSync, stderr for messages, path.relative in pattern-check.js). New patterns: Use path.relative() for robust cross-platform containment, return null not 'unknown' on hash failures, filter sensitive files before external tool calls. Session #55.                                                                                                                                           |
| 5.4     | 2026-01-12 | Review #132: PR #238 Compliance Fixes (Qodo + CI) - 14 items. Fixed: 1 MAJOR command injection (quote $ARGUMENTS in settings.json for coderabbit-review.js), 1 MAJOR project dir validation (pattern-check.js), 4 MINOR security hardening (Windows backslash normalization, option-like/multiline path rejection in check-write/edit-requirements.js), 3 MINOR (combine stdout+stderr in pattern-check.js, file size cap DoS protection in check-mcp-servers.js, TOCTOU try/catch in coderabbit-review.js), 2 MINOR (5s timeout for hasCodeRabbit(), CLI arg ordering fix --plain before --), 1 FIX (dead else-if ESLint error). New patterns: Quote all shell arguments, normalize Windows paths for cross-platform, cap file sizes before reads. Session #55.                           |
| 5.3     | 2026-01-12 | Review #131: PR #238 CI Fix (ESLint + Qodo Compliance) - 17 items. Fixed: 7 CRITICAL ESLint errors in all .claude/hooks/_.js files (no-undef for process/console/require - use `/_ global require, process, console _/`for flat config), 1 MAJOR command injection (execSync→spawnSync in pattern-check.js), 3 MAJOR path traversal (use path.resolve + containment check), 2 MINOR (remove 'design' keyword ambiguity, fix unused 'error' var), 4 MINOR (useless escape, unused import). New patterns: Use`/_ global _/`not`/_ eslint-env \*/` for ESLint flat config, use spawnSync for safe subprocess calls. Session #55.                                                                                                                                                              |
| 5.2     | 2026-01-12 | Review #130: PR #236 Round 4 (SonarQube + Qodo) - 27 items parsed across 2 rounds. Fixed: 5 MAJOR (sensitive logging in admin search/journal/crud-table, error.message in alerts), 2 MINOR (doc lint patterns, midnight refresh for daily quote). 16 items verified ALREADY FIXED from #127-129. New pattern: Log errorType/errorCode only, use generic user-facing messages. Session #54.                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5.1     | 2026-01-12 | Review #129: PR #236 Post-Commit Feedback (SonarQube + Qodo) - 9 items on new code (2 CRITICAL: cognitive complexity refactor, production reCAPTCHA fail-closed; 4 MAJOR: cache failures, initial state alignment, localStorage try/catch, error cause chain; 3 MINOR: globalThis.window, Intl.DateTimeFormat, secure logging). New patterns: Extract helpers to reduce complexity, fail-closed security in production, cache error states to prevent retry storms, use globalThis over window for SSR. Session #53.                                                                                                                                                                                                                                                                       |
| 5.0     | 2026-01-11 | Review #128: PR #236 Follow-up (Qodo) - 5 items (1 HIGH: Sentry IP privacy fix; 1 MEDIUM: CI arg separator; 1 DEFERRED: doc ID hashing; 2 ALREADY DONE from #127). New patterns: Third-party PII hygiene, CLI arg injection prevention. Session #52.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 4.9     | 2026-01-11 | Review #127: PR #236 Comprehensive Review (SonarQube + Qodo) - 14 items (3 CRITICAL: pin GitHub Action SHA, harden reCAPTCHA bypass, fix IPv6 normalization; 4 MAJOR: regex precedence, sanitize error messages, reset journalLoading; 6 MINOR: operationName granularity, CI main-only push, simplify IP retrieval, audit trails, log sensitivity). Session #50.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4.8     | 2026-01-11 | Review #126: Tier-2 Output PR Feedback Round 3 (Qodo) - 4 items (3 MINOR: HUMAN_SUMMARY merged IDs column for traceability, CANON_QUICK_REFERENCE enum clarification, AUDIT_PROCESS_IMPROVEMENTS normalize:canon fallback note; 1 TRIVIAL: version header already 4.7). All applied. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4.7     | 2026-01-11 | Review #125: Tier-2 Output PR Feedback Round 2 (Qodo) - 4 items (2 MINOR: HUMAN_SUMMARY DEDUP IDs in Top 5 table, PR_PLAN.json PR3 dedup IDs; 1 TRIVIAL: version header 4.5→4.6). 1 rejected (assign PR19 to App Check items - PR19 doesn't exist, "-" is correct). Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4.6     | 2026-01-11 | Review #124: Tier-2 Output PR Feedback (Qodo) - 9 items (1 MAJOR rejected: project management tools - static docs intentional for AI context; 6 MINOR: PR_PLAN dedup IDs, REFACTOR_BACKLOG PR associations, PR-LINT reference, HUMAN_SUMMARY next steps, included_dedup_ids field; 2 TRIVIAL: npm script note, hardcoded count). 1 rejected (CANON-0005 distinct from DEDUP-0001: client vs server App Check). New pattern: Dedup IDs should be explicitly linked in PR plans. Session #49.                                                                                                                                                                                                                                                                                                |
| 4.5     | 2026-01-11 | Review #123: TIER-2 AGGREGATION (Task 4.3.1-4.3.6) - Cross-category unification of 118 CANON findings. Output: 97 unique findings (21 merged as duplicates), 12 duplicate clusters identified, 21 PRs planned. Key findings: 5 S0 Critical (memory leak, legacy writes, CI gates, complexity, App Check), 32 S1 High, 42 S2 Medium, 18 S3 Low. Comprehensive scope: CANON + SonarQube (548) + ESLint (246) = ~891 total. Session #49.                                                                                                                                                                                                                                                                                                                                                      |
| 4.4     | 2026-01-11 | Review #122: PR #232 Round 2 - 3 items (1 MEDIUM: CRLF normalization + regex whitespace; 2 LOW: process.exitCode for buffer flush, bash version check). New patterns: Normalize CRLF for cross-platform, use process.exitCode over process.exit(), check BASH_VERSION for bash-specific scripts. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 4.3     | 2026-01-11 | Review #121: PR #232 Qodo/SonarCloud - 13 items (4 MAJOR: exit code docs, stderr suppression, large JSON gitignore, CI trigger syntax; 5 MINOR: line counting, script detection, archive parsing, repo-root path, try/catch; 3 LOW: NaN guard, glob reliability, merge conflict). New patterns: Document all exit codes, capture stderr for debugging, gitignore large generated files. Session #48.                                                                                                                                                                                                                                                                                                                                                                                       |
| 4.2     | 2026-01-11 | CONSOLIDATION #10: Reviews #109-120 → CODE_PATTERNS.md v1.6 (5 new patterns: 3 Security, 2 JS/TS). Counter reset. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4.1     | 2026-01-11 | Review #120: PR #228 Qodo Round 3 - 4 items (2 URGENT prototype pollution/secure logging, 1 HIGH fail-fast validation, 1 MEDIUM GitHub Actions workflow undefined fix). CANON-0043 verified correct. New patterns: Use Map for untrusted keys, never log raw input content, fail-fast on parse errors. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 4.0     | 2026-01-11 | Review #119: PR #228 Qodo Round 2 - 9 items (2 MAJOR NaN-safe sorting/missing-ID validation, 6 MINOR category normalization/coverage output/session tracking/finding count, 1 TRIVIAL trailing newline). Deferred: JSON Schema migration. New pattern: Ensure numeric fields have robust fallbacks for sorting. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3.9     | 2026-01-11 | Review #118: PR #228 Follow-up Feedback - 1 item (1 HIGH report-to-JSONL ID mismatches). Updated 3 markdown audit reports + CANON-REFACTOR.jsonl to use normalized CANON-XXXX IDs. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.8     | 2026-01-11 | Review #117: PR #228 Qodo Feedback - 8 items (1 CRITICAL dependency ID rewriting bug in normalize script, 3 HIGH error handling/outdated IDs, 4 MEDIUM duplicate detection/category handling/FS error handling/legacy ID references). New patterns: CANON ID normalization must update all references including dependencies. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3.7     | 2026-01-11 | Review #116: PROCESS/AUTOMATION AUDIT (Task 4.2.6) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 38 raw findings → 14 canonical. Severity: S0 (1): non-blocking CI gates; S1 (3): script coverage, security scanning, deploy gcloud; S2 (6): pre-commit slow, workflow docs; S3 (4): permissions, false positives. **SUB-PHASE 4.2 COMPLETE** - All 6 audit categories finished. Session #46.                                                                                                                                                                                                                                                                                                                                                 |
| 3.6     | 2026-01-11 | Review #115: DOCUMENTATION AUDIT (Task 4.2.5) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 37 raw findings → 14 canonical. Severity: S1 (2): broken links, [X] placeholders; S2 (8): Tier 2 metadata, orphaned docs; S3 (4): archive rot, fragile anchors. Session #46.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3.5     | 2026-01-10 | Review #114: REFACTORING AUDIT (Task 4.2.4) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 65 raw findings → 27 canonical. Severity: S0 (1): cognitive complexity; S1 (7): type drift, deprecated paths; S2 (15): duplication clusters; S3 (4): batch fixes. Session #45.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3.4     | 2026-01-09 | Review #113: PR #225 Comprehensive Compliance - 6 items (1 HIGH ampersand entity injection, 2 MEDIUM HTTPS enforcement/JSON parsing, 3 MINOR encodeURI/private:true/nullish coalescing). Session #39 continued.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.3     | 2026-01-09 | Review #112: PR #225 Final Compliance - 6 items (3 HIGH injection/SSRF/stack-trace, 3 MEDIUM timeout/logging/archived-paths). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3.2     | 2026-01-09 | Review #111: PR #225 Compliance Fixes - 8 items (2 HIGH SSRF/secret exposure, 5 MEDIUM error handling/validation/performance, 1 LOW unstructured logging). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3.1     | 2026-01-09 | Review #110: PR #225 Follow-up - 6 items (3 MAJOR path canonicalization/archive boundary/exclude boundary, 3 MINOR indented code blocks/recursion deferred). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3.0     | 2026-01-09 | Review #109: PR #225 Feedback - 16 items (2 CRITICAL FS error handling/error exposure, 4 MAJOR JSON mode/ReDoS/symlink/cross-platform, 9 MINOR, 1 TRIVIAL). Rejected framework suggestion. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2.9     | 2026-01-09 | CONSOLIDATION #9: Reviews #98-108 → CODE_PATTERNS.md v1.4 (18 patterns: 6 JS/TS, 4 Security, 3 CI/Automation, 3 Documentation, 2 General). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2.8     | 2026-01-09 | Review #108: Update Dependencies Protocol - new mandatory pattern for tightly-coupled docs. Added ⚠️ Update Dependencies to 4 key documents. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2.7     | 2026-01-09 | Review #107: PR #224 Feedback - 2 items (SSR guard, status label) + process fix (/fetch-pr-feedback auto-invoke). Consolidation threshold reached (10 reviews). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2.6     | 2026-01-08 | Review #106: PR Review Processing - 16 items (8 MAJOR ReDoS/path-traversal/ID-parsing/validation/threshold-consistency, 6 MINOR env-metadata/FP-patterns/scope-clarity, 2 TRIVIAL). Session #40.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2.5     | 2026-01-08 | Review #105: PR Review Processing - 17 items (4 MAJOR ReDoS/JSONL/schema, 9 MINOR docs/patterns, 4 TRIVIAL). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2.4     | 2026-01-08 | Review #104: PR Review Processing - 18 items (4 MAJOR security pattern/baselines/JSON metrics, 9 MINOR shell portability/INP metrics, 5 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2.3     | 2026-01-08 | Review #103: PR Review Processing - 10 items (2 MAJOR hasComplexityWarnings+getRepoStartDate, 5 MINOR JSON/docs, 3 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2.2     | 2026-01-08 | Review #102: PR Review Processing - 19 items (1 MAJOR cognitive complexity refactor, 5 MINOR date validation/node: prefix/Number.parseInt/String.raw, 10 TRIVIAL code style). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2.1     | 2026-01-08 | Review #101: PR Review Processing - 36 items (12 Critical, 5 Major, 17 Minor, 2 Trivial). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2.0     | 2026-01-07 | CONSOLIDATION #8: Reviews #83-97 → CODE_PATTERNS.md v1.3 (6 Security Audit patterns, new category). Session #33 session-end cleanup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.99    | 2026-01-07 | Reviews #92-97: Security audit PR review feedback (6 reviews, 24 items total). Schema improvements: OWASP string→array, file_globs field, severity_normalization for divergent findings, F-010 conditional risk acceptance with dependencies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.93    | 2026-01-07 | Review #91: Audit traceability improvements (5 items) - 5 MINOR (severity_normalization field, adjudication field, F-010 severity in remediation, item count, log lines metric), 6 REJECTED (⚪ compliance items - doc-only PR, code fixes in Step 4B)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.92    | 2026-01-07 | Review #90: Security audit metadata fixes (7 items) - 5 MINOR (log lines metric, severity breakdown, secrets_management status, F-010 duplicate, Review #88 severity clarity), 1 TRIVIAL (hyphenation), 1 REJECTED (consolidation count)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.91    | 2026-01-07 | Review #89: Security audit documentation fixes (9 items) - 8 MINOR (F-010 severity, secrets_management status, duplicate model entry, SESSION_CONTEXT dates/status, active review range/count, progress percentage), 1 TRIVIAL (hyphenation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.90    | 2026-01-07 | Review #88: SECURITY AUDIT (Phase 4.2) - Multi-AI aggregated audit (Claude Opus 4.5 + ChatGPT 5.2), 10 canonical findings. Severity: S0 (1): F-001 Firestore bypass; S1 (2): F-002 rate-limiting, F-003 reCAPTCHA; S2 (6): F-004–F-009; S3 (1): F-010 risk-accepted. Overall: NON_COMPLIANT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.89    | 2026-01-07 | Review #87: Schema symmetry & markdown syntax (4 fixes) - 1 MAJOR (QUALITY_METRICS_JSON null schema), 3 MINOR (stray code fences in PROCESS/REFACTORING/DOCUMENTATION)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.88    | 2026-01-07 | Review #86: Qodo follow-up on Review #85 (3 fixes, 1 rejected) - 1 MINOR (broken link), 2 TRIVIAL (Bash-only clarity, copy-safe snippet), 1 REJECTED (duplicate pathspec separator)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.87    | 2026-01-07 | Review #84-85: Process quality improvements - #84: Review #83 follow-up (4 metadata fixes), #85: Qodo suggestions on Review #84 commit (3 fixes: git verification, threshold clarity, archive status)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.86    | 2026-01-07 | Review #83: Archive & Consolidation Metadata Fixes (5 fixes) - 1 REJECTED (false positive: #41 data loss), 1 MAJOR (broken links), 1 MINOR (status sync), 2 TRIVIAL (line count, wording)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.85    | 2026-01-07 | CONSOLIDATION #7: Reviews #73-82 → CODE_PATTERNS.md v1.2 (9 patterns: 3 Bash/Shell portability, 6 Documentation quality)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.84    | 2026-01-07 | ARCHIVE #2: Reviews #42-60 → REVIEWS_42-60.md (1048 lines removed, 2425→1377 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.83    | 2026-01-07 | Review #82: Post-commit review fixes (6 items) - 0 MAJOR, 5 MINOR (review range, Last Updated date, SECURITY.md path, markdown formatting, CANON-0032 status), 1 TRIVIAL (code fence), 1 HIGH-LEVEL (generator fix recommendation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.82    | 2026-01-07 | Review #81: Documentation linter fixes (57 errors) - 3 MAJOR (missing ARCHITECTURE.md/DEVELOPMENT.md links, missing Purpose in claude.md), 8 MINOR (broken links, missing sections), 4 TRIVIAL (date placeholders, metadata)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.81    | 2026-01-07 | Review #80: 3 fixes - 2 MINOR (PR_PLAN.json structured acceptance_tests, CANON-CODE.jsonl source identifiers), 1 TRIVIAL (document version sync)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.80    | 2026-01-06 | Review #79: 10 fixes, 1 rejected - 3 MAJOR (JSONL parser-breaking output in 3 templates), 4 MINOR (bash portability, JSON validity, path clarity, count accuracy), 3 TRIVIAL (metadata consistency) - rejected 1 suggestion contradicting established canonical format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.79    | 2026-01-06 | Review #78: 12 fixes - 2 MAJOR (invalid JSONL NO-REPO output, missing pipefail in validator), 7 MINOR (JSON placeholders, NO-REPO contract, markdown links, category count, model names, audit scope, last updated date), 3 TRIVIAL (review range, version history, model name consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.78    | 2026-01-06 | Review #77: 9 fixes - 2 MAJOR (shell script portability, broken relative links), 5 MINOR (invalid JSONL, severity scale, category example, version dates, review range), 2 TRIVIAL (environment fields, inline guidance)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.77    | 2026-01-06 | Review #76: 13 fixes - 3 MAJOR (model naming, broken link paths, PERFORMANCE doc links), 8 MINOR (SECURITY root cause evidence, shell exit codes, transitive closure, division-by-zero, NO-REPO contract, category enum, model standardization, vulnerability type), 2 TRIVIAL (version metadata, review range)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.76    | 2026-01-06 | Review #75: 17 fixes - 2 MAJOR (SECURITY schema category names, vulnerability deduplication), 8 MINOR (regex robustness, JSONL validation, deduplication rules, averaging methodology, model matrix, link paths), 2 TRIVIAL (version verification, duplicate check), 1 REJECTED (incorrect path suggestion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.75    | 2026-01-06 | Review #74: 18 fixes - 6 MAJOR (broken links, schema fields, deduplication clarity, observability, placeholders, GPT-4o capabilities), 9 MINOR (fail-fast, URL filtering, NO-REPO MODE, environment, methodology, output specs, links, alignment), 3 TRIVIAL (version, dates, context)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.74    | 2026-01-06 | Review #73: 9 fixes - 2 MAJOR (model name self-inconsistency, NO-REPO MODE clarity), 4 MINOR (chunk sizing, regex, JSONL validation, stack versions), 3 TRIVIAL (documentation consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.73    | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 → CODE_PATTERNS.md v1.1 (10 Documentation patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.72    | 2026-01-06 | Review #72: 21 fixes - 12 CRITICAL (broken links to JSONL_SCHEMA, GLOBAL_SECURITY_STANDARDS, SECURITY.md, EIGHT_PHASE_REFACTOR), 5 MAJOR (version/stack placeholders), 4 MINOR (paths, regex, commands)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.71    | 2026-01-06 | Review #71: Documentation improvements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.70    | 2026-01-06 | Review #70: Template refinements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.69    | 2026-01-06 | Review #69: Multi-AI audit plan setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.68    | 2026-01-06 | Review #68: 17 fixes - 4 MAJOR (App Check path, SonarQube remediation, function rename, review ordering), 10 MINOR (sorting, grep, versions, regex, ranges), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.67    | 2026-01-06 | Review #67: 14 fixes - 4 MAJOR (grep -E, deterministic IDs, App Check tracking, SonarQube tracking), 7 MINOR (verification, enums, paths, ordering), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.66    | 2026-01-05 | Review #66: 13 fixes - 4 MAJOR (evidence rules, output format, npm safety, apiKey guidance), 8 MINOR (counters, grep portability, YAML, model names), 1 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.65    | 2026-01-05 | Review #65: 19 fixes - 4 MAJOR (security doc hardening, deterministic CANON IDs), 10 MINOR (paths, assertions, category names), 5 TRIVIAL (model names)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.64    | 2026-01-05 | Review #64: 31 fixes - 6 MAJOR (security pseudocode, Firebase key clarity, grep hardening), 8 MINOR (progress calc, paths), 17 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.63    | 2026-01-05 | Review #63: 15 fixes total - 7 broken relative paths, 8 minor improvements (version entries, secrets example, tier notes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.62    | 2026-01-05 | Review #62: 10 fixes - 1 CRITICAL (client-side credentials), 4 MAJOR (schema, links, model), 5 MINOR/TRIVIAL (2 Minor, 3 Trivial)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.61    | 2026-01-05 | Review #61: Stale review assessment, path prefix fix, terminology update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.60    | 2026-01-05 | CONSOLIDATION #5: Reviews #51-60 → claude.md v2.9 (10 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.59    | 2026-01-05 | Review #60: Document sync, grep exclusion fix, CANON-ID guidance, duplicate link removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.58    | 2026-01-05 | Review #59: Prompt schema improvements, grep --exclude, Quick Start section, link text consistency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.57    | 2026-01-05 | Review #58: Template compliance (MULTI_AI_REFACTOR_AUDIT_PROMPT.md), link format consistency, American English                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.56    | 2026-01-05 | Review #57: CI fix (broken stub links), effort estimate arithmetic, optional artifact semantics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.55    | 2026-01-05 | Review #56: Effort estimate correction, remaining code fences, stub path references (PARTIAL FIX - see #57)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.54    | 2026-01-05 | Review #55: Nested code fence fixes, artifact naming, acceptance criteria, schema references                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.53    | 2026-01-05 | Review #54: Step 4B + SLASH_COMMANDS.md, broken archive links, code fence escaping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.52    | 2026-01-05 | Review #53: CI fix, regex bounding, path.relative() security                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.51    | 2026-01-05 | Review #52: Document health/archival fixes from Qodo/CodeRabbit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.50    | 2026-01-04 | RESTRUCTURE: Tiered access model, Reviews #1-40 archived (3544→~1000 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.49    | 2026-01-04 | Review #51: ESLint audit follow-up, infinite loop fix, regex hardening                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.48    | 2026-01-04 | EFFECTIVENESS AUDIT: Fixed 26→0 violations in critical files; patterns:check now blocking                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.47    | 2026-01-04 | CONSOLIDATION #4: Reviews #41-50 → claude.md v2.8 (12 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.46    | 2026-01-04 | Review #50: Audit trails, label auto-creation, .env multi-segment, biome-ignore                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.45    | 2026-01-04 | Review #49: Workflow hardening, robust module detection, dead code removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.44    | 2026-01-04 | Review #48: Security hardening, OSC escapes, fail-closed realpath, pathspec fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.43    | 2026-01-04 | Review #47: PII masking, sensitive dirs, printf workflow, fault-tolerant labels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.42    | 2026-01-04 | Review #46: Symlink protection, realpath hardening, buffer overflow, jq/awk fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.41    | 2026-01-04 | Review #45: TOCTOU fix, error.message handling, path containment, tier matching, PR spam                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.40    | 2026-01-03 | CONSOLIDATION #3: Reviews #31-40 → claude.md v2.7 (14 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

<details>
<summary>Older versions (click to expand)</summary>

| Version  | Date                     | Description                                              |
| -------- | ------------------------ | -------------------------------------------------------- |
| 1.39-1.0 | 2026-01-02 to 2026-01-03 | Reviews #1-40 (see [archive](./archive/REVIEWS_1-40.md)) |

</details>

---

## 📊 Tiered Access Model

This log uses a tiered structure to optimize context consumption:

| Tier   | Content                                                                                                                    | When to Read                  | Size        |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------- |
| **1**  | [claude.md](../claude.md)                                                                                                  | Always (in AI context)        | ~115 lines  |
| **1b** | [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)                                                                          | When investigating violations | ~190 lines  |
| **2**  | Quick Index (below)                                                                                                        | Pattern lookup                | ~50 lines   |
| **3**  | Active Reviews (#101-136)                                                                                                  | Deep investigation            | ~1000 lines |
| **4**  | Archive ([#1-40](./archive/REVIEWS_1-40.md), [#42-60](./archive/REVIEWS_42-60.md), [#61-100](./archive/REVIEWS_61-100.md)) | Historical research           | ~4400 lines |

**Read Tier 3 only when:**

- Investigating a specific pattern's origin
- Processing new review feedback
- Checking for similar past issues

---

## 🔍 Quick Pattern Index

Find patterns by category. Numbers reference review entries.

### Security Patterns

| Pattern              | Summary                                             | Reviews       |
| -------------------- | --------------------------------------------------- | ------------- |
| path-traversal       | Reject `../`, don't rewrite; check ALL touch points | #30, #40, #45 |
| symlink-escape       | Use realpathSync() after resolve()                  | #46           |
| fail-closed-realpath | If realpath fails but file exists, reject           | #48           |
| pii-masking          | maskEmail(), maskUid() before logging               | #47, #50      |
| command-injection    | Never trust external input in execSync              | #13           |
| sensitive-dirs       | Check path components, not just filename            | #47           |

### Shell/Bash Patterns

| Pattern           | Summary                                       | Reviews       |
| ----------------- | --------------------------------------------- | ------------- |
| exit-code-capture | `if ! OUT=$(cmd)` not `OUT=$(cmd); if [ $? ]` | #13, #14      |
| file-iteration    | `while IFS= read -r` not `for file in $list`  | #13           |
| printf-over-echo  | Use `printf '%s'` for user input              | #30, #47      |
| temp-file-cleanup | Always `trap 'rm -f "$TMP"' EXIT`             | #18           |
| crlf-regex        | Use `\r?\n` for cross-platform                | #40, #47, #51 |

### JavaScript/TypeScript Patterns

| Pattern            | Summary                                  | Reviews       |
| ------------------ | ---------------------------------------- | ------------- |
| safe-error-message | `instanceof Error ? .message : String()` | #17, #45, #51 |
| sanitize-error     | Strip paths/credentials before logging   | #20, #21      |
| global-flag-exec   | exec() loops require /g flag             | #51           |
| wrap-file-reads    | All readFileSync in try/catch            | #36, #37      |

### GitHub Actions Patterns

| Pattern             | Summary                                  | Reviews |
| ------------------- | ---------------------------------------- | ------- |
| string-comparison   | Use `== '4'` not `== 4` in if conditions | #48     |
| label-auto-create   | Check getLabel, create on 404            | #50     |
| api-error-tolerance | Catch 404/422 on removeLabel             | #47     |

### Documentation Patterns

| Pattern           | Summary                              | Reviews |
| ----------------- | ------------------------------------ | ------- |
| self-compliance   | Standards docs must follow own rules | #1      |
| time-bound-claims | "Audited as X (date)" not "All X"    | #51     |

---

## How to Use This Log

1. **After addressing AI review feedback**, add a new Review #N entry
2. **Reference previous entries** when similar patterns emerge
3. **Extract key patterns** to [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)
   when recurring (3+ occurrences); only critical 5 go in claude.md
4. **Run pattern audit** periodically: `npm run patterns:check-all`

### Review Sources

Log findings from ALL AI code review sources:

- **Qodo** - PR suggestions (appears as "PR Code Suggestions")
- **CodeRabbit PR** - GitHub PR reviews (appears as comments/suggestions on PRs)
- **CodeRabbit CLI** - Local reviews via PostToolUse hook (appears in Claude
  session output)

---

## 🔔 Consolidation Trigger

**Reviews since last consolidation:** 7 **Consolidation threshold:** 10 reviews
**Status:** ✅ Current **Next consolidation due:** After Review #150

### When to Consolidate

Consolidation is needed when:

- Reviews since last consolidation reaches 10+
- Multiple reviews mention similar patterns
- New security or critical patterns are identified

### Consolidation Process

1. Review all entries since last consolidation
2. Identify recurring patterns (3+ mentions)
3. Add patterns to [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md); critical 5
   only to claude.md
4. Update pattern compliance checker if automatable
5. Reset "Reviews since last consolidation" counter
6. Note consolidation in version history

### Last Consolidation

- **Date:** 2026-01-12 (Session #57)
- **Reviews consolidated:** #121-#136 (16 reviews)
- **Patterns added to CODE_PATTERNS.md v1.7:**
  - **Security (6 patterns):**
    - IPv6-safe IP parsing
    - Third-party PII hygiene (Sentry)
    - Defense-in-depth bypass protection
    - Production fail-closed security
    - Firestore batch chunking (500-op limit)
    - Sensitive file filtering before external tools
  - **JavaScript/TypeScript (4 patterns):**
    - path.relative() empty string check
    - Error cause preservation
    - globalThis over window (SSR-safe)
    - Array.isArray guards
  - **CI/Automation (5 patterns):**
    - CLI arg separator (--)
    - Quote shell arguments
    - Project directory validation
    - Cross-platform paths
    - Exit code best practice (process.exitCode)
  - **GitHub Actions (1 pattern):**
    - Supply chain pinning (SHA over tag)

<details>
<summary>Previous Consolidation (#10)</summary>

- **Date:** 2026-01-11 (Session #48)
- **Reviews consolidated:** #109-#120 (12 reviews)
- **Patterns added to CODE_PATTERNS.md v1.6:**
  - **Security (3 patterns):**
    - Entity escaping order (ampersand first)
    - SSRF explicit allowlist + protocol enforcement
    - External request timeout (AbortController)
  - **JavaScript/TypeScript (2 patterns):**
    - lstatSync for symlink detection
    - NaN-safe numeric sorting
  - **Security Audit (3 patterns, already added in v1.5):**
    - Prototype pollution prevention
    - Secure error logging
    - Fail-fast validation

</details>

<details>
<summary>Previous Consolidation (#9)</summary>

- **Date:** 2026-01-09 (Session #39)
- **Reviews consolidated:** #98-#108 (11 reviews)
- **Patterns added to CODE_PATTERNS.md v1.4:**
  - **JavaScript/TypeScript (6 patterns):**
    - Falsy vs missing check (`!field` fails for 0)
    - Node.js module prefix (`node:fs`, `node:path`)
    - Number.parseInt with radix
    - Dead code after throwing functions
    - SSR-safe browser APIs
    - Cognitive complexity extraction
  - **Security (4 patterns):**
    - Regex state leak prevention
    - ReDoS protection for user patterns
    - Path containment post-resolution
    - JSONL parse resilience
  - **CI/Automation (3 patterns):**
    - JSON output isolation
    - Empty-state guards
    - Unimplemented CLI flags blocking

</details>

### Previous Consolidation (#8)

- **Date:** 2026-01-07 (Session #33)
- **Reviews consolidated:** #83-#97 (15 reviews)
- **Patterns added:** Security Audit (6 patterns)
- **Key themes:** Canonical finding schema, multi-AI audit traceability

### Previous Consolidation (#7)

- **Date:** 2026-01-07 (Session #29)
- **Reviews consolidated:** #73-#82 (10 reviews)
- **Patterns added:** Bash/Shell (3), Documentation (6)
- **Key themes:** Multi-AI audit template refinement, documentation linter
  cleanup

---

## 📊 Pattern Effectiveness Audit

**Last Audit:** 2026-01-04 (Session #23) **Next Audit Due:** After 10 new
reviews or 2 weeks

| Metric                           | Value | Target | Status |
| -------------------------------- | ----- | ------ | ------ |
| Critical files (14) violations   | 0     | 0      | ✅     |
| Full repo violations             | 63    | <50    | ⚠️     |
| Patterns in claude.md            | 60+   | -      | ✅     |
| Reviews since last consolidation | 0     | <10    | ✅     |

**ESLint Security Warnings Audit (2026-01-04):** | Rule | Count | Verdict |
|------|-------|---------| | `detect-object-injection` | 91 | Audited as false
positives - safe iteration/lookups | | `detect-non-literal-fs-filename` | 66 |
Audited as false positives - CLI scripts | | `detect-unsafe-regex` | 14 |
Audited as safe - bounded input, linear patterns | | `detect-non-literal-regexp`
| 6 | Audited as false positives - intentional dynamic patterns | |
`detect-possible-timing-attacks` | 1 | Audited as false positive - user's own
password compare | | `@typescript-eslint/no-unused-vars` | 3 | Audited as
legitimate - type definitions | | **Total** | **181** | **Audited as false
positives (2026-01-04)** |

**Recommendations:**

- [ ] Gradually fix migration script violations (low priority - run once)
- [x] Keep `patterns:check` blocking for critical files
- [x] ESLint warnings audited and documented (181 baseline as of 2026-01-04)
- [ ] Review full repo quarterly
- [ ] **DEFERRED (Review #51)**: Consider migrating regex patterns to AST-based
      ESLint rules

---

## 📏 Document Health Monitoring

**Check at regular intervals (every 10 reviews or weekly).**

### Current Metrics

| Metric              | Value        | Threshold | Action if Exceeded                                                                |
| ------------------- | ------------ | --------- | --------------------------------------------------------------------------------- |
| Main log lines      | ~1530        | 1500      | Archive oldest reviews                                                            |
| Active reviews      | 46 (#61-106) | 20        | Archive oldest active reviews until ≤20 remain (even if consolidation is current) |
| Quick Index entries | ~25          | 50        | Prune or categorize                                                               |

### Health Check Process

1. **Count lines**: `wc -l docs/AI_REVIEW_LEARNINGS_LOG.md`
2. **If over threshold**:
   - Archive consolidated reviews to `docs/archive/`
   - Update Quick Index (remove stale, add new)
   - Reset active review range
3. **Update this table** with new values

### Restructure History

| Date       | Change                                       | Before → After     |
| ---------- | -------------------------------------------- | ------------------ |
| 2026-01-07 | Document health maintenance, archived #42-60 | 2425 → 1386 lines  |
| 2026-01-04 | Tiered access model, archived #1-40          | 3544 → ~1000 lines |

---

## 🤖 AI Instructions

**This document is the audit trail for all AI code review learnings.**

### Tiered Reading Strategy

1. **Always have:** claude.md (critical patterns) +
   [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md) for details
2. **For pattern lookup:** Read Quick Index above
3. **For investigation:** Read specific review by number
4. **For history:** Access archive only when needed

### When to Update

1. **After each code review cycle** - Add a new Review #N entry
2. **When patterns recur 3+ times** - Extract to
   [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)
3. **Every 10 reviews** - Check consolidation trigger status
4. **When version changes** - Update version history table

### How to Add Review Entries

1. **Title format**: `#### Review #N: Brief Description (YYYY-MM-DD)`
2. **Include context**: Source (Qodo/CodeRabbit PR/CodeRabbit CLI), PR link,
   commit hash
3. **Document patterns**: Root cause → Prevention → Resolution
4. **Use severity tags**: 🔴 Critical, 🟠 Major, 🟡 Minor, ⚪ Low
5. **Update Quick Index** if new pattern category emerges

---

## 📁 Archive Reference

**Reviews #1-100** have been archived in three files:

### Archive 1: Reviews #1-40

- **Archive location:**
  [docs/archive/REVIEWS_1-40.md](./archive/REVIEWS_1-40.md)
- **Coverage:** 2026-01-01 to 2026-01-03
- **Status:** Fully consolidated into claude.md v2.7

### Archive 2: Reviews #42-60

- **Archive location:**
  [docs/archive/REVIEWS_42-60.md](./archive/REVIEWS_42-60.md)
- **Coverage:** 2026-01-03 to 2026-01-05
- **Status:** Reviews #42-60 archived (audit trail preserved).
- **Consolidation note:** See CODE_PATTERNS.md for consolidated patterns (latest
  as of 2026-01-07: v1.2).

### Archive 3: Reviews #61-100

- **Archive location:**
  [docs/archive/REVIEWS_61-100.md](./archive/REVIEWS_61-100.md)
- **Coverage:** 2026-01-05 to 2026-01-08
- **Status:** Reviews #61-100 archived (audit trail preserved).
- **Consolidation note:** See CODE_PATTERNS.md for consolidated patterns (latest
  as of 2026-01-12: v1.7).

Access archives only for historical investigation of specific patterns.

---

## Active Reviews (Tier 3)

Reviews #101-145 are actively maintained below. Older reviews are in the
archive.

---

#### Review #145: Settings Page Accessibility & Security (2026-01-14)

**Source:** SonarCloud + Qodo PR Compliance + Qodo PR Suggestions **PR/Branch:**
claude/general-dev-session-A1az1 **Suggestions:** 14 items (Major: 5, Minor: 9)

**Issues Fixed:**

| #     | Issue                                    | Severity | Category        | Fix                                                        |
| ----- | ---------------------------------------- | -------- | --------------- | ---------------------------------------------------------- |
| 1     | Toggle switches missing keyboard support | Major    | Accessibility   | Convert div→button with role="switch", aria-checked        |
| 2     | Missing input validation for date/time   | Major    | Security        | Add NaN checks, range validation before Timestamp creation |
| 3     | Preference data loss (theme overwritten) | Major    | Bug             | Spread profile.preferences before updating                 |
| 4     | Timezone bug in date display             | Major    | Bug             | Use local date extraction instead of toISOString()         |
| 5     | Form labels not associated with controls | Major    | Accessibility   | Add htmlFor/id, aria-labelledby                            |
| 6     | useAuth deprecated warning               | Minor    | Maintainability | Replace with useAuthCore()                                 |
| 7     | Props not marked read-only               | Minor    | TypeScript      | Add readonly modifier to interface                         |
| 8     | Silent early return in handleSave        | Minor    | UX              | Add toast error for missing user/profile                   |
| 9     | Raw error logging                        | Minor    | Security        | Sanitize error, log type/truncated message only            |
| 10    | Missing audit logging                    | Minor    | Compliance      | Add logger.info for profile updates                        |
| 11    | cleanTime changes not detected           | Minor    | Bug             | Include time in change detection                           |
| 12-14 | Form label accessibility (3 instances)   | Minor    | Accessibility   | Add id/aria-labelledby to email, toggle labels             |

**Patterns Identified:**

1. **Accessible Toggle Pattern**: Custom toggle switches need button element
   with role="switch" and aria-checked
2. **Local Date Formatting**: Use getFullYear/getMonth/getDate for local dates,
   not toISOString()
3. **Preference Preservation**: Always spread existing preferences before
   updating fields

**Key Learnings:**

- Custom interactive elements (toggles) must use native button or add role +
  keyboard support
- toISOString() converts to UTC which can shift dates - use local date
  extraction
- When updating nested objects (preferences), spread existing values to preserve
  unmodified fields
- Input validation must happen before Firestore writes - NaN checks, range
  validation
- Audit logging should capture action type and changed fields, not sensitive
  values

---

#### Review #146: Operational Visibility Sprint PR Feedback (2026-01-15)

**Source:** Documentation Lint + Qodo Compliance + CI + PR Suggestions
**PR/Branch:** claude/lighthouse-integration-planning-YdBkz **Suggestions:** 21
items (Major: 7, Minor: 8, Trivial: 2, Deferred: 1)

**Issues Fixed:**

| #   | Issue                                        | Severity | Category      | Fix                                          |
| --- | -------------------------------------------- | -------- | ------------- | -------------------------------------------- |
| 1   | ROADMAP.md 4 broken archive links            | Major    | Documentation | Remove non-existent archive file references  |
| 2   | ROADMAP.md invalid date format               | Major    | Documentation | Split header to separate lines               |
| 3   | lighthouse-tab.tsx setError unused           | Major    | Code Quality  | Use setError in catch, structured logging    |
| 4   | app/dev/page.tsx repeated auth subscriptions | Major    | React         | Remove state from useEffect deps             |
| 5   | lighthouse-tab.tsx failed audit crash        | Major    | Robustness    | Guard result.success before accessing scores |
| 6   | admin.ts SENTRY_ORG/PROJECT as secrets       | Major    | Configuration | Use process.env for non-sensitive config     |
| 7   | lighthouse-tab.tsx Firestore timestamp       | Minor    | Type Safety   | Handle Timestamp.toDate() vs string          |
| 8   | lighthouse-audit.js includes /dev route      | Minor    | Dev Tool      | Remove auth-protected route from audits      |
| 9   | 8 files need Prettier formatting             | Trivial  | CI            | Run npm run format                           |
| 10  | ANTIGRAVITY_GUIDE.md broken link             | Major    | Documentation | Remove non-existent file reference           |

**Deferred:**

- Separate dev dashboard as distinct app (architectural - valid but out of scope
  for this PR)

**Patterns Identified:**

1. **useEffect dependency on state causes re-subscriptions**: When auth listener
   depends on local state, it can create multiple subscriptions
2. **Firestore timestamps need type handling**: Data from Firestore may be
   Timestamp objects requiring .toDate() conversion
3. **Auth-protected routes fail Lighthouse audits**: Exclude routes that require
   login from audit scripts

**Key Learnings:**

- Client-side DSNs (like Sentry) are acceptable to commit as they're public by
  design
- --no-sandbox in local dev scripts is acceptable, not a CI security risk
- Non-sensitive config (org names, project names) should use env vars, not GCP
  Secret Manager

---

#### Review #147: CI Blocker Fixes + Firebase Error Handling (2026-01-15)

**Source:** CI Failures + Qodo Compliance + PR Suggestions **PR/Branch:**
claude/lighthouse-integration-planning-YdBkz **Suggestions:** 7 items (Critical:
1, Major: 3, Minor: 3)

**Issues Fixed:**

| #   | Issue                                      | Severity | Category   | Fix                                             |
| --- | ------------------------------------------ | -------- | ---------- | ----------------------------------------------- |
| 1   | logger.debug doesn't exist (TS2339)        | Critical | CI Blocker | Changed to logger.info                          |
| 2   | ROADMAP.md date format (Prettier reverted) | Major    | CI Blocker | Added prettier-ignore comments                  |
| 3   | Firestore dev/\* rules missing             | Major    | Security   | Added admin-only rules for dev/{document=\*\*}  |
| 4   | Firebase error handling not specific       | Major    | UX         | Show permission-denied vs network errors        |
| 5   | Stale admin claims not detected            | Minor    | Auth       | Force token refresh with getIdTokenResult(true) |
| 6   | Generic error messages for network issues  | Minor    | UX         | Show specific "Network error" message           |
| 7   | Swallowed Firebase errors                  | Minor    | Debugging  | Include errorCode in logs                       |

**Patterns Identified:**

1. **Prettier can override linter requirements**: Use prettier-ignore comments
   when formatters conflict with linters
2. **Firestore implicit deny needs explicit rules**: Add explicit admin-only
   rules for dev collections for clarity
3. **Force token refresh for admin checks**: `getIdTokenResult(true)` catches
   recent claim changes

**Key Learnings:**

- The logger module only has info/warn/error methods - no debug level
- Firestore denies access by default but explicit rules improve auditability
- Show specific error types (permission-denied, network) for better UX

---

#### Review #148: Dev Dashboard Security Hardening (2026-01-15)

**Source:** CI Feedback + Qodo Compliance + PR Suggestions **PR/Branch:**
claude/lighthouse-integration-planning-YdBkz **Suggestions:** 11 items (Major:
3, Minor: 5, Acceptable: 3)

**Issues Fixed:**

| #   | Issue                                       | Severity | Category | Fix                                          |
| --- | ------------------------------------------- | -------- | -------- | -------------------------------------------- |
| 1   | ROADMAP.md Prettier formatting (blank line) | Major    | CI       | Prettier auto-added blank line after ignore  |
| 2   | Raw error exposed in handleLogin            | Major    | Security | Use generic message, log errorCode only      |
| 3   | dev/\* Firestore allows client writes       | Major    | Security | Changed to read-only (write: if false)       |
| 4   | Network errors not distinguished            | Minor    | UX       | Show "Network error" for unavailable/network |
| 5   | Stale user state on error                   | Minor    | State    | Added setUser(null) in catch block           |
| 6   | Null user could reach DevDashboard          | Minor    | Safety   | Added null guard before rendering            |
| 7   | Unsafe error.message access                 | Minor    | Safety   | Safe extraction with type checking           |
| 8   | DevDashboard user prop nullable             | Minor    | Types    | Changed to non-nullable User                 |

**Acceptable Items (not fixed):**

- Access control bypass - Already fixed in #147 (Firestore rules)
- Chrome sandbox disabled - Acceptable for local dev scripts (#146)
- No ticket provided - N/A for dev branch

**Patterns Identified:**

1. **Never expose raw error.message to users**: Firebase errors can leak
   implementation details
2. **Client-side read-only for dev data**: Writes should only come from Admin
   SDK (CI/Cloud Functions)
3. **Defensive null guards**: Even if state logic prevents it, guard against
   null at render boundary

**Key Learnings:**

- Prettier may want blank lines after prettier-ignore-end comments
- Dev dashboards should be read-only for clients - CI writes the data
- Error handling should distinguish popup-closed-by-user from real failures

---

#### Review #149: Robustness & Error Handling Improvements (2026-01-15)

**Source:** CI Feedback + PR Suggestions **PR/Branch:**
claude/lighthouse-integration-planning-YdBkz **Suggestions:** 5 items (Major: 1,
Minor: 4)

**Issues Fixed:**

| #   | Issue                               | Severity | Category    | Fix                                         |
| --- | ----------------------------------- | -------- | ----------- | ------------------------------------------- |
| 1   | Pattern check: unsafe error.message | Major    | CI (false+) | Already fixed in #148 - CI cache issue      |
| 2   | Malformed Firestore data crash      | Minor    | Robustness  | Runtime validation for timestamp/results    |
| 3   | Sentry double init in Strict Mode   | Minor    | React       | Module-level didInit flag                   |
| 4   | handleLogout no error handling      | Minor    | UX          | try/catch/finally with setUser(null)        |
| 5   | Login errors not specific           | Minor    | UX          | Added popup-blocked, network error messages |

**Patterns Identified:**

1. **React Strict Mode double-invoke**: Use module-level flags to prevent double
   initialization of side effects
2. **Runtime data validation**: Always validate Firestore data structure before
   use, even with TypeScript
3. **Consistent state cleanup**: Use finally blocks to ensure state cleanup
   regardless of success/failure

**Key Learnings:**

- Pattern compliance CI can flag safe code if regex doesn't understand context
- React Strict Mode runs effects twice in dev - guard initialization with flags
- Firestore Partial<T> + validation is safer than direct type assertion

---

#### Review #150: Deployment Safety & Async Cleanup (2026-01-15)

**Source:** PR Code Suggestions (Qodo) **PR/Branch:**
claude/lighthouse-integration-planning-YdBkz **Suggestions:** 7 items (Major: 2,
Minor: 5)

**Issues Fixed:**

| #   | Issue                               | Severity | Category   | Fix                                         |
| --- | ----------------------------------- | -------- | ---------- | ------------------------------------------- |
| 1   | process.env fails in deployed funcs | Major    | Deployment | Use defineString for SENTRY_ORG/PROJECT     |
| 2   | Missing Lighthouse category crashes | Major    | Robustness | Safe scoreFor() helper with optional chain  |
| 3   | Firestore index errors hidden       | Minor    | UX         | Show specific error for failed-precondition |
| 4   | Sentry init failure permanent       | Minor    | Resilience | Allow retry with try/catch on didInit       |
| 5   | Auth useEffect unmount race         | Minor    | React      | Add isCancelled flag with cleanup           |
| 6   | Lighthouse useEffect unmount race   | Minor    | React      | Add isCancelled flag with cleanup           |
| 7   | (robust Firestore validation)       | Minor    | Safety     | Already done in #149, refined error message |

**Patterns Identified:**

1. **defineString for deployment safety**: process.env doesn't work in deployed
   Cloud Functions - use defineString for non-secret config
2. **Async cleanup pattern**: Use `let isCancelled = false` in useEffect with
   cleanup function to prevent state updates after unmount
3. **Optional chaining for external data**: Lighthouse categories can be absent
   - use `?.` chain with fallback to 0

**Key Learnings:**

- Firebase Functions don't have access to .env files in production - only
  defineSecret and defineString work reliably
- React Strict Mode double-invokes effects - but isCancelled pattern handles
  both Strict Mode and normal unmount
- Firestore failed-precondition usually means missing index, not missing data

---

#### Review #144: Step 6-7 PR CI Fixes (2026-01-14)

**Source:** CI Failures + Qodo PR Suggestions **PR/Branch:**
claude/step6-roadmap-integration-nGkAt **Suggestions:** 8 items (Critical: 1,
Major: 2, Minor: 4, Deferred: 1)

**Issues Fixed:**

| #   | Issue                                       | Severity | Category      | Fix                                                    |
| --- | ------------------------------------------- | -------- | ------------- | ------------------------------------------------------ |
| 1   | validate-phase-completion.js ENOENT         | Critical | CI Blocker    | Update path to archived INTEGRATED_IMPROVEMENT_PLAN.md |
| 2   | Prettier formatting (7 files)               | Major    | CI Blocker    | Run `npm run format`                                   |
| 3   | POSIX `local` keyword in pre-commit         | Major    | Portability   | Remove `local` for `/bin/sh` compatibility             |
| 4   | Obsolete INTEGRATED_IMPROVEMENT_PLAN checks | Minor    | Maintenance   | Remove archived file checks from pre-commit            |
| 5   | Broken relative link in session-end.md      | Minor    | Documentation | Fix path `../docs/` → `../../docs/`                    |
| 6   | package.json check too broad                | Minor    | UX (noise)    | Refine to only scripts section changes                 |
| 7   | Hook warning missing DEVELOPMENT.md         | Minor    | Consistency   | Add DEVELOPMENT.md to hook change warning              |

**Deferred:**

- Parse dependency rules from DOCUMENT_DEPENDENCIES.md (architectural - tracked)

**Key Learnings:**

- When archiving files, update ALL scripts that reference them
  (validate-phase-completion.js)
- Shell scripts in pre-commit hooks may run with `/bin/sh`, avoid bash-only
  syntax
- Cross-document dependency checks should be updated when archiving source docs

---

#### Review #143: CI Pattern Compliance and Command Injection Fix (2026-01-13)

**Source:** Qodo PR Compliance + SonarCloud + Pattern Compliance CI
**PR/Branch:** claude/cherry-pick-security-phase-5-nGkAt **Suggestions:** 20+
items (Critical: 1, Major: 6, Minor: 8+)

**Issues Fixed:**

| #   | Issue                                  | Severity | Category       | Fix                                                     |
| --- | -------------------------------------- | -------- | -------------- | ------------------------------------------------------- |
| 1   | Command injection via SKIP_REASON      | Critical | Security       | Use execFileSync instead of execSync with shell         |
| 2   | getStagedFiles returns [] on failure   | Major    | Fail-Open Risk | Return null on failure, block push (fail-closed)        |
| 3   | Unsafe error.message access (6 files)  | Major    | Crash Risk     | Use `err instanceof Error ? err.message : String(err)`  |
| 4   | readFileSync without try/catch (4)     | Major    | Race Condition | Wrap in try/catch after existsSync checks               |
| 5   | Unlisted dependency import             | Major    | Build Failure  | Added leaflet.markercluster to package.json             |
| 6   | logEvent returns null but logs success | Minor    | Silent Failure | Check return value before success message               |
| 7   | Pattern checker false positives        | Minor    | CI             | Add verified files to pathExclude in pattern compliance |

**Key Learnings:**

- Shell interpolation with env vars is command injection - use execFileSync with
  args array
- When security checks can't determine state, fail-closed (block) not fail-open
  (allow)
- `existsSync()` does NOT guarantee `readFileSync()` will succeed - race
  conditions, permissions
- Error objects in JS are not guaranteed - non-Error values can be thrown
- CSS imports from transitive dependencies need explicit package.json entries
- Pattern compliance false positives: add verified files to pathExclude with
  audit comments

---

#### Review #142: Phase 5 Cherry-Pick Security Hardening (2026-01-13)

**Source:** Qodo PR Suggestions + SonarCloud Security Hotspots **PR/Branch:**
claude/cherry-pick-security-phase-5-nGkAt **Suggestions:** 12 items (Critical:
1, Major: 4, Minor: 6, Trivial: 1)

**Issues Fixed:**

| #   | Issue                                  | Severity   | Category        | Fix                                                       |
| --- | -------------------------------------- | ---------- | --------------- | --------------------------------------------------------- |
| 1   | SKIP_TRIGGERS override not implemented | Critical   | Functionality   | Added SKIP_TRIGGERS env check at start of check-triggers  |
| 2   | Sentry logging could crash app         | Major      | Error Handling  | Wrapped Sentry.captureMessage in try/catch                |
| 3   | Log write failures could crash scripts | Major      | Error Handling  | Added try/catch to appendFileSync in log-session-activity |
| 4   | Override log write failures unhandled  | Major      | Error Handling  | Added try/catch to appendFileSync in log-override         |
| 5   | getStagedFiles fallback unreliable     | Minor      | Git Workflow    | Added git merge-base for better branch detection          |
| 6   | Arg parsing breaks on = in values      | Minor      | CLI             | Used slice(1).join("=") for --check= argument             |
| 7   | Unbounded regex (ReDoS risk)           | Minor      | Security        | Added bounded quantifiers to link regex                   |
| 8   | Hook path not CWD-safe                 | Minor      | Portability     | Added REPO_ROOT to log-session-activity path              |
| 9   | CRLF frontmatter not supported         | Minor      | Portability     | Changed regex to handle \r\n line endings                 |
| 10  | Reason string not sanitized            | Minor      | Security        | Added truncation and control char stripping               |
| 11  | /session/i pattern too broad           | Trivial    | False Positives | Removed from security trigger patterns                    |
| 12  | Prettier formatting issues             | Auto-fixed | Code Style      | Ran npm run format                                        |

**Key Learnings:**

- Environment variable overrides must be checked at script start, before any
  blocking logic
- External service calls (Sentry) should never crash the application - wrap in
  try/catch
- All file system operations in hooks/scripts need graceful error handling
- Use `git merge-base` for reliable branch divergence detection
- Regex patterns with unbounded quantifiers are ReDoS vectors - use `{0,N}`
  limits
- Sanitize and truncate user-provided log inputs to prevent log injection
- Security keyword patterns need careful tuning to avoid false positives

---

#### Review #141: PR Review Processing Round 3 (2026-01-13)

**Source:** Qodo PR Suggestions **PR/Branch:** PR /
claude/cherry-pick-security-audit-CqGum **Suggestions:** 5 items (Medium: 1,
Low: 4)

**Issues Fixed:**

| #   | Issue                                  | Severity  | Category    | Fix                                                   |
| --- | -------------------------------------- | --------- | ----------- | ----------------------------------------------------- |
| 1   | Schema category tokens have spaces     | 🟡 Medium | Consistency | Normalized to CamelCase tokens (e.g., RateLimiting)   |
| 2   | grep alternation missing -E flag       | 🟢 Low    | Portability | Added -E flag for NEXT_PUBLIC pattern                 |
| 3   | Offline greps missing -E flag          | 🟢 Low    | Portability | Added -E flag for IndexedDB and status patterns       |
| 4   | Header verification missing file types | 🟢 Low    | Coverage    | Added .tsx, .js, .mjs to includes                     |
| 5   | Code review schema inconsistent        | 🟢 Low    | Consistency | Normalized to `Hygiene\|Types\|Framework\|...` format |

**Key Learnings:**

- Schema category enums should be single CamelCase tokens (no spaces/multiline)
- Always use `grep -E` for patterns with alternation (`|`)
- Include all relevant file types (.ts, .tsx, .js, .mjs, .json) in grep patterns

---

#### Review #140: PR Review Processing Round 2 (2026-01-13)

**Source:** Qodo PR Suggestions **PR/Branch:** PR /
claude/cherry-pick-security-audit-CqGum **Suggestions:** 7 items (Medium: 1,
Low: 6)

**Issues Fixed:**

| #   | Issue                                      | Severity  | Category     | Fix                                             |
| --- | ------------------------------------------ | --------- | ------------ | ----------------------------------------------- |
| 1   | grep xargs can hang on empty results       | 🟡 Medium | Shell        | Use `while IFS= read -r f` instead of `xargs`   |
| 2   | Empty catch regex too narrow               | 🟢 Low    | Code Quality | Use `[[:space:]]` POSIX class for portability   |
| 3   | AICode category name vs schema mismatch    | 🟢 Low    | Consistency  | Renamed to `AICode (AI-Generated Code...)` form |
| 4   | Debugging category name vs schema mismatch | 🟢 Low    | Consistency  | Renamed to `Debugging (Debugging Ergonomics)`   |
| 5   | Correlation ID grep missing .tsx           | 🟢 Low    | Coverage     | Added `--include="*.tsx"` and `-E` flag         |
| 6   | Security template grep portability         | 🟢 Low    | Shell        | Replaced `cat \| grep` with direct `grep`       |
| 7   | ProductRisk vs ProductUXRisk enum          | 🟢 Low    | Consistency  | Changed to ProductUXRisk in audit-security.md   |

**Key Learnings:**

- Pipe to `while read` instead of `xargs` to prevent hangs on empty input
- Category names in Focus Areas should match schema enum values
- Use POSIX character classes `[[:space:]]` for portable regex
- Always include both .ts and .tsx in grep patterns for React projects

---

#### Review #139: PR Cherry-Pick Security Audit CI Fixes (2026-01-13)

**Source:** Qodo Compliance + CI Feedback **PR/Branch:** PR /
claude/cherry-pick-security-audit-CqGum **Suggestions:** 11 items (Critical: 0,
Major: 2, Minor: 8, Trivial: 1)

**Patterns Identified:**

1. [Missing YAML frontmatter in slash commands]: Commands without
   `---\ndescription: ...\n---` frontmatter aren't recognized
   - Root cause: Some commands were created without proper frontmatter structure
   - Prevention: Always add frontmatter when creating new commands

2. [Documentation lint requirements for audit files]: Tier-2 docs require
   Purpose and Version History sections
   - Root cause: Audit reports were missing standard sections
   - Prevention: Include Purpose, Version History, and Last Updated in all audit
     documents

**Resolution:**

- Fixed: 11 items
- Deferred: 0
- Rejected: 0

**Issues Fixed:**

| #   | Issue                                       | Severity   | Category      | Fix                                            |
| --- | ------------------------------------------- | ---------- | ------------- | ---------------------------------------------- |
| 1   | pr-review.md missing YAML frontmatter       | 🔴 Major   | Configuration | Added `---\ndescription: ...\n---` frontmatter |
| 2   | docs-sync.md missing YAML frontmatter       | 🔴 Major   | Configuration | Added proper frontmatter                       |
| 3   | fetch-pr-feedback.md malformed frontmatter  | 🟡 Minor   | Configuration | Fixed frontmatter structure                    |
| 4   | audit-2026-01-13.md missing Purpose section | 🟡 Minor   | Documentation | Added Purpose section                          |
| 5   | audit-2026-01-13.md missing Version History | 🟡 Minor   | Documentation | Added Version History table                    |
| 6   | audit-2026-01-13.md missing Last Updated    | 🟡 Minor   | Documentation | Added Last Updated metadata                    |
| 7   | audit-code.md missing Debugging Ergonomics  | 🟡 Minor   | Consistency   | Added Category 7 with 5 debugging checks       |
| 8   | Grep pattern for client-side secrets        | 🟡 Minor   | Security      | Improved to find "use client" files first      |
| 9   | Grep pattern for empty catches              | 🟡 Minor   | Code Quality  | Improved regex to detect empty/comment-only    |
| 10  | Category enum in audit-code.md              | 🟡 Minor   | Consistency   | Added Debugging to schema                      |
| 11  | Description alignment in READMEs            | 🟢 Trivial | Documentation | Already aligned from previous session          |

**Key Learnings:**

- All `.claude/commands/*.md` files MUST have YAML frontmatter with a
  description field
- The frontmatter must be at the very start of the file:
  `---\ndescription: Description\n---`
- Audit documents should follow Tier-2 requirements including Purpose and
  Version History sections

---

#### Review #138: PR #243 Step 4C Qodo Compliance Review (2026-01-13)

**Source:** Qodo Compliance (2 rounds) **PR/Branch:** PR #243 /
claude/cherry-pick-phase-4b-fAyRp **Suggestions:** 7 items (Critical: 0, Major:
1, Minor: 3, Trivial: 0, Rejected: 3)

**Context:** Post-commit review of Step 4C SonarCloud Issue Triage changes.

**Issues Fixed:**

| #   | Issue                                      | Severity | Category | Fix                                               |
| --- | ------------------------------------------ | -------- | -------- | ------------------------------------------------- |
| 1   | Env var oracle: dynamic process.env lookup | 🟡 Minor | Security | Added ALLOWED_FEATURE_FLAGS allowlist             |
| 2   | Test files in SonarCloud issue analysis    | 🟡 Minor | Config   | Use sonar.tests instead of exclusions             |
| 3   | Next.js client bundling broken             | 🔴 Major | Bug      | Static FEATURE_FLAG_VALUES map with explicit refs |
| 4   | Better SonarCloud test identification      | 🟡 Minor | Config   | Added sonar.test.inclusions                       |

**Rejected Items:**

| #   | Issue              | Reason                                                           |
| --- | ------------------ | ---------------------------------------------------------------- |
| 5   | No ticket provided | Administrative - not code-related                                |
| 6   | Codebase context   | Configuration - not code-related                                 |
| 7   | sort() vs reduce() | Reviewer confirms reduce is correct; O(n) better than O(n log n) |

**Patterns Identified:**

1. **Feature flag allowlist** (Minor - Defensive)
   - Root cause: `process.env[featureId]` with dynamic key could probe env vars
   - Prevention: Allowlist valid feature flag names, reject unknown keys

2. **Next.js env var client bundling** (Major - Bug fix)
   - Root cause: Dynamic `process.env[key]` is NOT inlined by Next.js on client
   - Prevention: Use static map with explicit `process.env.NEXT_PUBLIC_*`
     references
   - Pattern: For client-side env access, always use explicit string literals

**Resolution:** Fixed 4 items, rejected 3 (2 administrative, 1 false positive)

---

#### Review #137: PR #243 SonarQube Security Hotspots & Qodo Suggestions (2026-01-13)

**Source:** Mixed - SonarQube Security Hotspots + Qodo PR Code Suggestions
**PR/Branch:** PR #243 / claude/cherry-pick-phase-4b-fAyRp **Suggestions:** 12
items (Critical: 0, Major: 0, Minor: 3, Trivial: 2, Rejected: 5) - 5 fixed

**Context:** Post-merge review of Step 4B Remediation Sprint PR. SonarQube
flagged 4 Security Hotspots (2 ReDoS, 2 PATH variable) and Qodo suggested 8 code
improvements.

**Issues Fixed:**

| #   | Issue                                     | Severity   | Category     | Fix                                          |
| --- | ----------------------------------------- | ---------- | ------------ | -------------------------------------------- |
| 1   | ReDoS: greedy regex in extractJSON        | 🟡 Minor   | Security/DoS | Changed `/\{[\s\S]*\}/` to `/\{[\s\S]*?\}/`  |
| 2   | ReDoS: greedy regex in test assertion     | 🟡 Minor   | Security/DoS | Same non-greedy fix                          |
| 3   | Empty catch block silently ignores errors | 🟡 Minor   | Test Quality | Added explicit skip with console.log message |
| 4   | Null reasons could be added to array      | ⚪ Trivial | Robustness   | Added `newReason ?` guard                    |
| 5   | Missing maxBuffer in spawnSync            | ⚪ Trivial | Robustness   | Added `maxBuffer: 10 * 1024 * 1024`          |

**Rejected Items:**

| #   | Issue                           | Reason                                            |
| --- | ------------------------------- | ------------------------------------------------- |
| 6-7 | PATH variable in test spawnSync | Test context with controlled environment - Safe   |
| 8   | Missing "use client" directive  | Already exists on line 1 - False positive         |
| 9   | Non-portable command in docs    | Historical archive documentation, not active code |
| 10  | realRel === "" check removal    | Intentional design - skip project root directory  |
| 11  | Greedy regex in archived docs   | Historical archive documentation, not active code |

**Patterns Identified:**

1. **Non-greedy regex for JSON extraction** (Minor)
   - Root cause: Greedy `[\s\S]*` can backtrack on malformed input
   - Prevention: Use `[\s\S]*?` for bounded matching
   - Pattern: Already in CODE_PATTERNS.md as "Regex brace matching"

2. **Explicit test skip over silent catch** (Minor)
   - Root cause: Empty catch blocks hide test failures
   - Prevention: Use explicit skip with log message or fail assertion
   - Pattern: `console.log("Skipping: reason"); return;`

**Resolution:** Fixed 5 items, rejected 7 (5 false positives, 2 historical docs)

---

#### Review #127: PR #236 Comprehensive Review - Security Hardening & SonarQube Fixes (2026-01-11)

**Source:** Mixed - SonarQube Cloud + Qodo Compliance + Qodo Code Suggestions
**PR/Branch:** PR #236 / claude/new-session-azYVp **Suggestions:** 14 items
(Critical: 3, Major: 4, Minor: 6, Low: 1) - all fixed

**Context:** Comprehensive PR review addressing SonarQube Quality Gate failure
(1 Security Hotspot, C Reliability Rating) and Qodo compliance/code suggestions
for the Step 4B Remediation Sprint PR.

**Issues Fixed:**

| #   | Issue                                                                     | Severity    | Category      | Fix                                                      |
| --- | ------------------------------------------------------------------------- | ----------- | ------------- | -------------------------------------------------------- |
| 1   | Unpinned GitHub Action (tj-actions/changed-files@v46) - supply chain risk | 🔴 Critical | Security      | Pinned to SHA `26a38635...` (v46.0.2) with CVE note      |
| 2   | reCAPTCHA bypass toggle could be enabled in production                    | 🔴 Critical | Security      | Added isEmulator + isProduction checks                   |
| 3   | IPv6 normalization flaw (DoS via incorrect rate limiting)                 | 🔴 Critical | Security      | Rewrote to preserve full IPv6, strip port from IPv4 only |
| 4   | Regex precedence not explicit (SonarQube)                                 | 🟠 Major    | Reliability   | Used `replaceAll()` with clearer logic                   |
| 5   | Leaky error messages to users                                             | 🟠 Major    | Security      | Return generic "Too many requests" to client             |
| 6   | Rate limit error messages expose internals                                | 🟠 Major    | Security      | Sanitized all 3 rate limit error paths                   |
| 7   | Missing loading reset on user change                                      | 🟠 Major    | UX            | Added `setJournalLoading(true)` before new subscription  |
| 8   | Missing distinct operationName in admin functions                         | 🟡 Minor    | Observability | Added unique names to all 15 admin functions             |
| 9   | Push pattern check runs on all branches                                   | 🟡 Minor    | CI            | Limited to main branch only                              |
| 10  | IP retrieval fallback to x-forwarded-for                                  | 🟡 Minor    | Code Quality  | Simplified to use rawRequest.ip only                     |
| 11  | IP truncation in logs                                                     | 🟡 Minor    | Security      | Removed truncation, log full IP for security analysis    |
| 12  | Missing audit trail for successful admin auth                             | 🟡 Minor    | Security      | Added ADMIN_ACTION log after requireAdmin passes         |
| 13  | Spoofable IP not documented                                               | 🟡 Minor    | Documentation | Added comment noting secondary defense limitation        |
| 14  | Secure Logging (doc.id sensitivity)                                       | ⚪ Low      | Security      | Reviewed - doc.id is non-PII, kept for debugging         |

**Patterns Identified:**

1. **Supply Chain Security for GitHub Actions** (Critical)
   - Root cause: Using `@v46` tag instead of SHA allows tag retargeting attacks
     (CVE-2025-30066)
   - Prevention: Always pin third-party actions to full commit SHA
   - Pattern: `uses: action@SHA # vX.Y.Z` with version comment

2. **Defense-in-Depth Bypass Protection** (Critical)
   - Root cause: Single env var could disable security control in all
     environments
   - Prevention: Multi-condition bypass requiring emulator OR non-production
     context
   - Pattern: `bypass = flagSet && (isEmulator || !isProduction)`

3. **IPv6-Safe IP Normalization** (Critical)
   - Root cause: Splitting by `:` breaks IPv6 addresses (2001:db8:... becomes
     just 2001)
   - Prevention: Only strip port from IPv4 (contains `.`), preserve full IPv6
   - Pattern: `lastIndexOf(':')` + `.includes('.')` check for IPv4 detection

4. **Error Message Sanitization** (Major)
   - Root cause: Throwing internal error messages to clients leaks
     implementation details
   - Prevention: Log detailed error server-side, return generic message to
     client
   - Pattern:
     `logSecurityEvent(internalMessage); throw HttpsError(genericMessage)`

5. **Admin Function Granularity** (Minor)
   - Root cause: All admin functions used default "admin_operation" name
   - Prevention: Pass unique operation name to rate limiter/logger
   - Pattern: `requireAdmin(request, 'specificFunctionName')`

**Resolution:**

- Fixed: 14 items (3 Critical, 4 Major, 6 Minor, 1 Low)
- Deferred: 0 items
- Rejected: 0 items

**Verification:**

- ESLint: 0 errors (warnings are pre-existing)
- Firebase Functions build: Success
- Tests: 115/115 pass

**Key Learnings:**

- **GitHub Action supply chain:** The tj-actions/changed-files compromise
  (CVE-2025-30066) shows why SHA pinning matters
- **Production bypass prevention:** Multi-condition checks prevent accidental
  security bypass in production
- **IPv6 awareness:** IP normalization code must handle both IPv4 and IPv6
  correctly
- **Error message hygiene:** Always sanitize before returning to client, log
  detail server-side

---

#### Review #128: PR #236 Follow-up - IP Privacy & CI Hardening (2026-01-11)

**Source:** Qodo Code Suggestions (post-commit 93ed9f5) **PR/Branch:** PR #236 /
claude/continue-session-azYVp-KmwmN **Suggestions:** 5 items (High: 1, Medium:
3, Deferred: 1)

**Context:** Follow-up feedback on commit 93ed9f5 identifying additional
security and hardening improvements after the initial Review #127 fixes.

**Issues Fixed:**

| #   | Issue                                              | Severity  | Category | Fix                                                  |
| --- | -------------------------------------------------- | --------- | -------- | ---------------------------------------------------- |
| 1   | IP addresses sent to Sentry (third-party PII leak) | 🟠 High   | Privacy  | Added `captureToSentry: false` to IP rate limit logs |
| 2   | Missing `--` separator in CI file arg passing      | 🟡 Medium | Security | Added `--` to prevent `-filename` injection          |

**Deferred:**

| #   | Issue                        | Severity  | Reason                                                                                   |
| --- | ---------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| 3   | Hash rate-limit document IDs | 🟡 Medium | Low risk - Firestore doc IDs not client-accessible; rate_limits collection is admin-only |

**Already Fixed (from Review #127):**

- GitHub Action SHA pinning ✅
- journalLoading reset on user change ✅

**Patterns Identified:**

1. **Third-Party PII Hygiene** (High)
   - Root cause: Raw IP addresses in logSecurityEvent metadata sent to Sentry
   - Prevention: Set `captureToSentry: false` for logs containing PII
   - Pattern:
     `logSecurityEvent(..., { metadata: { ip }, captureToSentry: false })`

2. **CLI Argument Injection Prevention** (Medium)
   - Root cause: File paths passed directly to node script could start with `-`
   - Prevention: Use `--` separator to mark end of options
   - Pattern: `node script.js -- $FILES` instead of `node script.js $FILES`

**Resolution:**

- Fixed: 2 items (1 High, 1 Medium)
- Deferred: 1 item (with justification)
- Already done: 2 items (from Review #127)

**Key Learnings:**

- **PII in logging:** Even internal logs may flow to third parties (Sentry);
  explicitly disable for sensitive data
- **Shell injection vectors:** The `--` separator is a critical defense against
  filename-based injection

---

#### Review #112: PR #225 Final Compliance - Injection & SSRF Hardening (2026-01-09)

**Source:** PR Compliance Review (WebFetch) **PR/Branch:** PR #225 /
claude/new-session-DJX87 **Suggestions:** 10 items (High: 3, Medium: 3,
Verified: 4) - 6 fixed, 4 already compliant

**Context:** Final compliance pass addressing remaining "not compliant" and
"requires human verification" items from PR #225.

**Patterns Identified:**

1. **Complete Markdown Injection Prevention** (High pattern)
   - Root cause: escapeTableCell only escaped pipe/brackets, not
     parens/backticks/angles
   - Prevention: Add escaping for backslash, parentheses (prevents link
     injection), backticks (code), and HTML angle brackets
   - Pattern: Comprehensive markdown escaping includes `\`, `|`, `[]`, `()`,
     `` ` ``, `<>`

2. **Request Timeout Protection** (High pattern)
   - Root cause: No timeout on HTTP fetch could hang indefinitely
   - Prevention: Use AbortController with setTimeout for fetch operations
   - Pattern: Always add timeout to external HTTP requests (30s default)

3. **Stack Trace Sanitization** (High pattern)
   - Root cause: main().catch(console.error) exposes full stack traces
   - Prevention: Wrap in error handler that only logs error.message
   - Pattern: Sanitize caught errors at process boundary

4. **Environment-Controlled SSRF Allowlist** (Medium pattern)
   - Root cause: localhost in allowlist could leak credentials in shared
     environments
   - Prevention: Add SONAR_ALLOW_LOCAL env var to enable localhost (default:
     disabled)
   - Pattern: Use env vars to control security-sensitive features
     per-environment

5. **Archived Table Path Escaping** (Medium pattern)
   - Root cause: Archived file paths not escaped in markdown table
   - Prevention: Apply escapeTableCell to all table cell content including file
     paths
   - Pattern: Escape all user-controlled content in markdown, not just obvious
     fields

**Resolution:**

- Fixed: 6 items (3 HIGH, 3 MEDIUM)
- Already Compliant: 4 items (FS error handling verified as already guarded)

**Commit:** 29c593a

**Key Learnings:**

- **Markdown injection is comprehensive**: Not just pipes - parens enable
  `](javascript:...)`, backticks enable code injection
- **Timeout at network boundary**: All external requests need explicit timeout;
  AbortController is the modern approach
- **SSRF allowlists should be minimal**: Only enable localhost via opt-in env
  var, not by default

---

#### Review #113: PR #225 Comprehensive Compliance - Recurring Issues Resolution (2026-01-09)

**Source:** PR Compliance Review (recurring suggestions) **PR/Branch:** PR #225
/ claude/new-session-DJX87 **Suggestions:** 6 items (High: 1, Medium: 2,
Minor: 3) - all fixed

**Context:** Addressing recurring compliance issues that kept appearing in PR
feedback. User noted "we keep getting these compliance issues over and over
again." This review comprehensively addresses all remaining items.

**Patterns Identified:**

1. **Ampersand HTML Entity Injection** (High pattern)
   - Root cause: `&` not escaped before other HTML entities, allowing `&lt;` →
     `<` injection
   - Prevention: Add `&` → `&amp;` as FIRST replacement in escapeTableCell
     (before backslash)
   - Pattern: Order of HTML entity escaping matters: ampersand MUST be first

2. **HTTPS Enforcement for SSRF Protection** (Medium pattern)
   - Root cause: URL allowlist checked hostname but not protocol
   - Prevention: Enforce `https:` protocol for non-local hosts in
     `isAllowedSonarHost()`
   - Pattern: SSRF protection must validate both host AND protocol

3. **JSON Response Parsing Safety** (Medium pattern)
   - Root cause: `response.json()` can throw on malformed responses
   - Prevention: Wrap in try/catch with sanitized error message
   - Pattern: All JSON parsing at system boundary needs error handling

4. **Proper URL Encoding with encodeURI** (Minor pattern)
   - Root cause: Manual `.replace(/ /g, '%20')` only handles spaces
   - Prevention: Use `encodeURI()` which handles all special characters
     correctly
   - Pattern: Use built-in encoding functions; don't roll your own

5. **Private Package Prevention** (Minor pattern)
   - Root cause: Missing `private: true` could lead to accidental npm publishing
   - Prevention: Add `"private": true` to package.json for internal packages
   - Pattern: Always mark internal packages as private

6. **Nullish Coalescing for Zero Values** (Minor pattern)
   - Root cause: `||` treats 0 as falsy, breaking pagination when total is 0
   - Prevention: Use `??` (nullish coalescing) to only fall back on
     null/undefined
   - Pattern: Use `??` instead of `||` when 0 is a valid value

**Resolution:**

- Fixed: 6 items (1 HIGH, 2 MEDIUM, 3 MINOR)
- All recurring compliance issues addressed comprehensively

**Commit:** b99cb85

**Key Learnings:**

- **Entity escaping order is critical**: Ampersand must be escaped first or it
  corrupts other HTML entities
- **SSRF is multi-dimensional**: Host allowlisting alone is insufficient;
  protocol enforcement is equally important
- **Recurring issues indicate incomplete fixes**: Each compliance iteration
  should aim for comprehensive coverage, not incremental patches

---

#### Review #111: PR #225 Compliance Fixes - Security & Performance (2026-01-09)

**Source:** PR Compliance Review (WebFetch) **PR/Branch:** PR #225 /
claude/new-session-DJX87 **Suggestions:** 12 total (High: 2, Medium: 7,
Low: 2) - 8 fixed, 1 already fixed, 3 not applicable

**Context:** Follow-up compliance review focusing on security hardening and
performance optimization. Addressing "Requires Further Human Verification"
items.

**Patterns Identified:**

1. **SSRF Protection with URL Allowlisting** (High pattern)
   - Root cause: SONAR_URL env var could redirect auth headers to
     attacker-controlled servers
   - Prevention: Add explicit domain allowlist (sonarcloud.io, sonarqube.com,
     localhost)
   - Pattern: Validate external URLs against allowlist before fetching

2. **Secret Exposure in Config** (High pattern - previously fixed)
   - Root cause: Token placeholder in .mcp.json encourages storing secrets in
     repo
   - Prevention: Remove placeholder; rely on environment variable or Claude
     desktop config
   - Pattern: Never commit even placeholder secrets; use env vars

3. **Error Response Sanitization** (Medium pattern)
   - Root cause: Upstream error details returned directly to callers
   - Prevention: Map status codes to generic messages; don't expose upstream
     error text
   - Pattern: Sanitize external API errors before returning to users

4. **Pagination Truncation Warning** (Medium pattern)
   - Root cause: Silent truncation at page 100 without notification
   - Prevention: Return `truncated: true` flag when limit reached; log warning
   - Pattern: Surface incomplete results to callers

5. **Input Argument Validation** (Medium pattern)
   - Root cause: MCP tool arguments forwarded without validation
   - Prevention: Add null check, type validation, and length limits
     (MAX_INPUT_LENGTH = 500)
   - Pattern: Validate all external inputs at system boundaries

6. **O(n²) to O(1) Lookup Optimization** (Medium pattern)
   - Root cause: Repeated docs.find() inside loops creates O(n²) complexity
   - Prevention: Create docsByPath Map once; use Map.get() for O(1) lookups
   - Pattern: Precompute lookup Maps for repeated searches

**Resolution:**

- Fixed: 8 items (2 HIGH, 5 MEDIUM, 1 LOW)
- Already Fixed: 2 items (ReDoS, writeFileSync)
- Not Applicable: 2 items (unstructured logging - acceptable for CLI tool)

**Commit:** 0f990b2

**Key Learnings:**

- **SSRF requires explicit allowlists**: Environment variables should be
  validated, not trusted
- **Error sanitization at boundaries**: External API errors should never
  propagate raw to users
- **Precompute for performance**: Convert O(n) lookups to O(1) with Map for
  repeated access

---

#### Review #110: PR #225 Follow-up - Path Canonicalization & Boundary Checks (2026-01-09)

**Source:** Qodo PR Suggestions (post-commit b56cd42) **PR/Branch:** PR #225 /
claude/new-session-DJX87 **Suggestions:** 6 total (Major: 3, Minor: 2,
Deferred: 1)

**Context:** Follow-up Qodo suggestions after initial PR #225 fixes. Focus on
path security hardening and edge case handling.

**Patterns Identified:**

1. **Path Canonicalization** (Major pattern - Qodo)
   - Root cause: join() doesn't resolve `..` segments, allowing
     `docs/../scripts/file.md` to bypass checks
   - Prevention: Implement canonicalizePath() that resolves `.` and `..`
     segments
   - Pattern: Always canonicalize paths after join() before boundary checks

2. **Archive Directory Boundary Check** (Major pattern - Qodo)
   - Root cause: startsWith('docs/archive') matches 'docs/archiveXYZ'
   - Prevention: Check for exact match OR starts with prefix + '/'
   - Pattern: Use `path === prefix || path.startsWith(prefix + '/')` for
     directory matching

3. **Excluded Directory Boundary Check** (Major pattern - Qodo)
   - Root cause: Same prefix matching issue as archive directories
   - Prevention: Apply same boundary check pattern
   - Pattern: Consistent boundary checking across all path filters

4. **Indented Code Block Detection** (Minor pattern - Qodo)
   - Root cause: CommonMark allows 0-3 spaces before fence
   - Prevention: Update regex to `^( {0,3})(\`{3,}|~{3,})`
   - Pattern: Follow spec for indented fenced code blocks

**Resolution:**

- Fixed: 5 items (3 MAJOR, 2 MINOR)
- Deferred: 1 item (recursion avoidance - theoretical edge case for extremely
  deep directories)

**Key Learnings:**

- **Canonicalize after join**: join() preserves `..` segments; must resolve them
  explicitly
- **Boundary checks need separators**: `startsWith(prefix)` is insufficient; add
  path separator check
- **CommonMark compliance**: Fenced code blocks can have 0-3 space indent

---

#### Review #109: PR #225 Feedback - Documentation Index Generator Hardening (2026-01-09)

**Source:** Qodo PR Compliance + Qodo PR Suggestions + SonarQube **PR/Branch:**
PR #225 / claude/new-session-DJX87 **Suggestions:** 16 total (Critical: 2,
Major: 4, Minor: 9, Trivial: 1) + 1 REJECTED

**Context:** First PR review of the new documentation index generator script.
Focus on filesystem error handling, security hardening, and JSON output
isolation.

**Patterns Identified:**

1. **FS Error Handling with lstatSync** (Critical pattern - Qodo)
   - Root cause: statSync doesn't detect symlinks; permission errors unhandled
   - Prevention: Use lstatSync to detect symlinks; wrap in try/catch with error
     codes
   - Pattern: Use lstatSync + try/catch for safe directory traversal

2. **Error Detail Exposure** (Critical pattern - Qodo)
   - Root cause: Raw error.message may expose filesystem paths
   - Prevention: Log only error.code, not full message
   - Pattern: Sanitize errors to codes only in output

3. **JSON Output Isolation** (Major pattern - Qodo)
   - Root cause: console.log calls mixed with JSON output break parsers
   - Prevention: Create log() helper that checks jsonOutput flag
   - Pattern: Guard ALL logging when JSON mode is active

4. **ReDoS in Link Regex** (Major pattern - Qodo)
   - Root cause: Unbounded `[^\]]+` quantifiers in markdown link regex
   - Prevention: Add bounded quantifiers `{1,500}`
   - Pattern: Bound all regex quantifiers processing external content

5. **Link Deduplication** (Minor pattern - Qodo)
   - Root cause: Same link target counted multiple times
   - Prevention: Use Set to track seen targets
   - Pattern: Deduplicate reference counts for accurate metrics

6. **Code Block Stripping** (Minor pattern - Qodo)
   - Root cause: Links in code examples counted as real references
   - Prevention: Strip fenced code blocks before parsing links
   - Pattern: Clean content before parsing for structured data

**Resolution:**

- Fixed: 16 items (2 CRITICAL, 4 MAJOR, 9 MINOR, 1 TRIVIAL)
- Rejected: 1 item (standard framework suggestion - architecture change out of
  scope)

**Key Learnings:**

- **lstatSync over statSync**: Detects symlinks without following them
- **Error sanitization**: Only expose error codes, not full messages
- **JSON mode isolation**: Create log() helper to guard all output
- **Bounded regex**: Always bound quantifiers when processing external content

---

#### Review #108: Process Improvement - Update Dependencies Protocol (2026-01-09)

**Source:** Self-identified (User feedback + pattern analysis) **PR/Branch:**
claude/new-session-DJX87 **Commit:** 59590f9 **Suggestions:** 1 process
improvement (self-identified)

**Context:** User identified recurring issue where document updates weren't
propagating to related documents (e.g., adding Category 6 to multi-AI audit
template but forgetting to update single-session audit command). Root cause: no
explicit instructions in documents telling what else to update.

**Patterns Identified:**

1. **Missing Update Dependencies Instructions** (Process pattern -
   User-identified)
   - Root cause: Tightly-coupled documents don't have explicit "also update X"
     instructions
   - Impact: Repeated misses when updating templates/commands (user had to
     remind multiple times)
   - Prevention: Added "Update Dependencies Protocol" to
     DOCUMENTATION_STANDARDS.md
   - Fix: Added ⚠️ Update Dependencies sections to 4 key documents

**Resolution:**

- Process: 1 item (new protocol + 4 document updates)

**Files Modified:** | File | Change | |------|--------| |
`docs/DOCUMENTATION_STANDARDS.md` | Added "Update Dependencies Protocol" as
mandatory for tightly-coupled docs | |
`docs/templates/MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md` | Added ⚠️ Update
Dependencies section | | `.claude/commands/audit-documentation.md` | Added ⚠️
Update Dependencies section | | `.claude/commands/fetch-pr-feedback.md` | Added
⚠️ Update Dependencies section | | `.claude/commands/pr-review.md` | Added ⚠️
Update Dependencies section |

**Key Learnings:**

- Centralized tracking (DOCUMENT_DEPENDENCIES.md) is not enough - decentralized
  instructions in each document are needed
- "Related Documents" sections are for reference; "Update Dependencies" sections
  are for action
- When a sync miss happens multiple times, add explicit instructions to prevent
  future misses (institutional memory)

---

#### Review #107: PR #224 Feedback - SSR Safety & Process Gap Identification (2026-01-09)

**Source:** Mixed (Qodo PR Suggestions via WebFetch) **PR/Branch:** PR #224 /
claude/new-session-DJX87 **Commit:** e168a87 **Suggestions:** 2 total (Minor: 2)

**Context:** Processed remaining Qodo feedback on PR #224 after multi-AI
performance audit aggregation. During processing, identified process gap where
`/fetch-pr-feedback` doesn't auto-invoke `/pr-review`, causing learnings to be
missed.

**Patterns Identified:**

1. **SSR-Safe Browser API Access** (Minor pattern - Qodo)
   - Root cause: Code example used `window.matchMedia()` without checking if
     running in browser
   - Prevention: Always guard browser APIs with `typeof window !== 'undefined'`
   - Fix: Added SSR guard to PERF-006 code example in performance audit findings

2. **Process Gap: /fetch-pr-feedback Skips Protocol** (Process pattern -
   Self-identified)
   - Root cause: `/fetch-pr-feedback` only "offered" to run `/pr-review` instead
     of auto-invoking
   - Impact: When user says "yes" to quick fixes, full protocol (including
     learnings) was bypassed
   - Prevention: Updated `/fetch-pr-feedback` Step 5 to auto-invoke `/pr-review`
     protocol
   - Fix: Modified `.claude/commands/fetch-pr-feedback.md` to automatically
     proceed with full protocol

**Resolution:**

- Fixed: 2 items (SSR guard, status label)
- Process: 1 item (updated /fetch-pr-feedback to auto-invoke /pr-review)

**Key Learnings:**

- Browser API code examples in documentation should include SSR guards
- Slash commands that "offer" next steps can create protocol gaps; prefer
  auto-invoke when the next step is expected
- Retroactive learnings capture is valid when process gap is identified

---

#### Review #106: PR Review Processing - ReDoS & Path Security Hardening (2026-01-08)

**Source:** Mixed (Qodo PR Compliance + Qodo PR Suggestions + SonarQube +
CodeRabbit PR) **PR/Branch:** claude/new-session-70MS0 **Commit:** 8ebb293
(Review #105) **Suggestions:** 16 total (Major: 8, Minor: 6, Trivial: 2)

**Context:** Post-commit review of PR Review #105 fixes. Focus on ReDoS
protection completeness, path traversal security, ID parsing robustness, and
threshold consistency.

**Patterns Identified:**

1. **ReDoS Protection in add-false-positive.js** (Major pattern - Qodo)
   - Root cause: Only validate-audit.js had ReDoS heuristic;
     add-false-positive.js missing same protection
   - Prevention: Apply same `isLikelyUnsafeRegex` check to all regex entry
     points
   - Pattern: Security patterns must be applied consistently across all entry
     points

2. **Path Traversal with resolve() Escapes** (Major pattern - Qodo)
   - Root cause: `path.join` preserves `../` sequences; resolve doesn't
     guarantee containment
   - Prevention: Use resolve(), then verify result stays within expected root
   - Pattern: Path resolution must include post-resolution containment check

3. **Number.parseInt Strict Base** (Major pattern - SonarQube)
   - Root cause: parseInt without radix can misinterpret strings starting with 0
   - Prevention: Always specify radix 10 for decimal parsing
   - Pattern: Use Number.parseInt(str, 10) not parseInt(str)

4. **ID Parsing Fault Tolerance** (Major pattern - Qodo)
   - Root cause: FP-XXX ID extraction assumed format, crashed on malformed
     entries
   - Prevention: Guard against malformed entries with null checks
   - Pattern: Parse untrusted data defensively with explicit validation

5. **Threshold Reset Documentation Consistency** (Minor pattern - CodeRabbit)
   - Root cause: Different audit templates described threshold reset differently
   - Prevention: Standardize threshold reset semantics across all templates
   - Pattern: Cross-template consistency for shared concepts

6. **Shell Pipeline Portability** (Major pattern - Qodo)
   - Root cause: `| sort -u | grep -v` pipelines don't work on Windows
   - Prevention: Replace shell pipelines with JavaScript array operations
   - Pattern: Use language-native filtering instead of shell utilities

**Resolution:**

- Fixed: 16 items (8 MAJOR, 6 MINOR, 2 TRIVIAL)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- **Security patterns need consistency**: If one file has ReDoS protection, all
  entry points need it
- **Path containment requires post-resolution check**: resolve() alone doesn't
  prevent escapes
- **Shell portability matters**: JavaScript filtering is more portable than
  shell pipes
- **Parse defensively**: External/user data should be validated before
  processing

---

#### Review #105: PR Review Processing - validate-audit.js Hardening (2026-01-08)

**Source:** Mixed (Qodo PR Compliance + Qodo PR Suggestions + SonarQube +
CodeRabbit PR) **PR/Branch:** claude/new-session-70MS0 **Commit:** 3f69691
(Review #104) **Suggestions:** 17 total (Major: 4, Minor: 9, Trivial: 4)

**Context:** Post-commit review of PR Review #104 fixes. Focus on
validate-audit.js ReDoS protection, error handling, and documentation
consistency.

**Patterns Identified:**

1. **ReDoS Protection in Pattern Matching** (Major pattern - Qodo)
   - Root cause: User-editable FALSE_POSITIVES.jsonl patterns could contain
     catastrophic backtracking regex
   - Prevention: Add heuristic detection for dangerous patterns (nested
     quantifiers, length limits)
   - Pattern: Validate regex patterns from untrusted sources before execution

2. **Falsy Check vs Missing Check** (Major pattern - Qodo)
   - Root cause: `!finding[field]` returns true for value 0, false empty string
     detection
   - Prevention: Use explicit null/undefined check for numeric fields like
     `line`
   - Pattern: Use `=== undefined || === null` for fields that can have 0 value

3. **JSONL Parse Resilience** (Major pattern - Qodo)
   - Root cause: Single malformed line in JSONL crashes script
   - Prevention: Wrap individual line parsing in try/catch, continue with valid
     entries
   - Pattern: Parse JSONL lines individually to isolate failures

4. **Schema Documentation Consistency** (Minor pattern - CodeRabbit)
   - Root cause: audit-performance.md referenced AUDIT_TRACKER.md fields that
     don't exist
   - Prevention: Verify referenced fields exist in target documents
   - Pattern: Cross-reference documentation schemas before publishing

**Resolution:**

- Fixed: 17 items (4 MAJOR, 9 MINOR, 4 TRIVIAL)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- **Validate user-provided regex**: Add ReDoS detection before executing
  patterns
- **Numeric fields need explicit checks**: `!field` fails for value 0
- **JSONL should be fault-tolerant**: Skip bad lines, don't crash

---

#### Review #104: PR Review Processing - Single-Session Audit Checks (2026-01-08)

**Source:** Mixed (Qodo PR Compliance + Qodo PR Suggestions + SonarQube +
CodeRabbit PR) **PR/Branch:** claude/new-session-70MS0 **Commit:** 018c39b
(Review #103) + 2560ceb (audit improvements) **Suggestions:** 18 total (Major:
4, Minor: 9, Trivial: 5)

**Context:** Post-commit review of single-session audit improvements and
previous Review #103 fixes. Focus on security patterns, shell portability, and
JSON output consistency.

**Patterns Identified:**

1. **Security File Pattern Completeness** (Major pattern - Qodo)
   - Root cause: Security-sensitive file regex missed critical files like
     firestore.rules, middleware.ts
   - Prevention: Explicitly include known security files, not just keyword
     patterns
   - Pattern: Security patterns should whitelist critical files by name

2. **JSON Parsing Robustness** (Major pattern - Qodo)
   - Root cause: npm audit --json can output non-JSON on error, causing parse
     failures
   - Prevention: Wrap JSON.parse in try/catch with fallback to empty object
   - Pattern: External command output should always have parse error handling

3. **Shell Portability** (Minor pattern - Qodo)
   - Root cause: `| head -1` and `| sort -u | grep -v` are not portable across
     all systems
   - Prevention: Use git native flags (-1) or JavaScript logic instead of shell
     pipes
   - Pattern: Prefer language-native operations over shell pipelines

4. **Web Vitals Metric Updates** (Minor pattern - Qodo)
   - Root cause: FID is deprecated, INP is the modern replacement
   - Prevention: Keep up with Core Web Vitals changes
   - Pattern: Use current metrics (INP not FID) in audit schemas

5. **JSON Output Structure Clarity** (Major pattern - CodeRabbit)
   - Root cause: Flat trigger structure with ambiguous value/threshold pairs
   - Prevention: Restructure JSON to have explicit commits/files sub-objects
   - Pattern: Machine-parseable output should have unambiguous field semantics

**Resolution:**

- Fixed: 13 items (4 MAJOR, 6 MINOR, 3 TRIVIAL)
- Deferred: 3 items (metric key alignment, doc path - unclear requirements)
- Already OK: 2 items (JSONL schema already formatted)

**Key Learnings:**

- **Security patterns need explicit file lists**: Don't rely only on keyword
  matching
- **Always handle parse errors**: External commands can produce unexpected
  output
- **Shell portability matters**: Use native language features when possible
- **Keep metrics current**: Web Vitals evolve; update schemas accordingly
- **JSON output needs unambiguous structure**: Nested objects clarify metric
  semantics

---

#### Review #103: PR Review Processing - Qodo, SonarQube, CodeRabbit (2026-01-08)

**Source:** Mixed (Qodo PR + SonarQube + CodeRabbit PR) **PR/Branch:**
claude/new-session-70MS0 **Suggestions:** 10 total (Major: 2, Minor: 5,
Trivial: 3)

**Context:** Follow-up PR review on commit 2d7d466 (Review #102). Focus on
completing TODO placeholders, improving baseline detection, and fixing output
inconsistencies.

**Patterns Identified:**

1. **TODO Placeholder Completion** (Major pattern - SonarQube + Qodo)
   - Root cause: hasComplexityWarnings() returned false unconditionally with
     TODO comment
   - Prevention: Implement functionality when creating placeholder; don't defer
     forever
   - Pattern: Complete TODOs during the session that creates them

2. **Dynamic Baseline vs Hardcoded Fallback** (Major pattern - Qodo)
   - Root cause: Missing AUDIT_TRACKER.md caused all triggers to fire from
     2025-01-01
   - Prevention: Use git log to get actual repo start date as smart fallback
   - Pattern: Use dynamic fallbacks for missing configuration files

3. **Output Mode Consistency** (Minor pattern - CodeRabbit)
   - Root cause: JSON recommendation showed only first category; text showed all
   - Prevention: Extract command list logic to shared helper or duplicate
     consistently
   - Pattern: Text and JSON output should convey equivalent information

**Resolution:**

- Fixed: 10 items (2 MAJOR, 5 MINOR, 3 TRIVIAL)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- **Complete TODOs immediately**: Don't leave placeholder functions; implement
  or remove
- **Smart fallbacks**: Use git history for dynamic defaults instead of hardcoded
  dates
- **Output parity**: JSON and text modes should provide equivalent information

---

#### Review #102: PR Review Processing - Qodo, SonarQube, CodeRabbit (2026-01-08)

**Source:** Mixed (Qodo PR + SonarQube + CodeRabbit PR) **PR/Branch:**
claude/new-session-70MS0 **Suggestions:** 16 total (Major: 1, Minor: 5, Trivial:
9, Deferred: 1)

**Context:** Post-Review #101 feedback on commit 36fd20f. Primary focus on
cognitive complexity refactoring and code style improvements.

**Patterns Identified:**

1. **Cognitive Complexity Refactoring** (Major pattern - SonarQube S3776)
   - Root cause: formatTextOutput() had complexity 23 (threshold 15) due to
     nested loops/conditionals
   - Prevention: Extract helper functions for distinct output sections
   - Pattern: Keep functions under 15 cognitive complexity by extracting helpers

2. **Node.js Built-in Module Prefixes** (Minor pattern - SonarQube S6803)
   - Root cause: Using `fs` instead of `node:fs` for built-in imports
   - Prevention: Always use `node:` prefix for built-in modules
   - Pattern: `node:fs`, `node:path`, `node:url`, `node:child_process`

3. **Number Methods on Global** (Minor pattern - SonarQube S6759)
   - Root cause: Using `parseInt()` instead of `Number.parseInt()`
   - Prevention: Prefer explicit `Number.parseInt()` and `Number.isNaN()`
   - Pattern: Use Number methods for parsing and validation

**Resolution:**

- Fixed: 15 items (1 MAJOR, 5 MINOR, 9 TRIVIAL)
- Deferred: 1 item (JSONL schema alignment - Step 4 scope)
- Rejected: 0 items

---

#### Reviews #92-97: Security Audit PR Review Feedback (2026-01-07)

**Source:** Qodo PR + CodeRabbit PR **PR/Branch:** claude/new-session-YUxGa
**Commits:** 644723b (R#92), 844e1cc (R#93), 7241314 (R#94), 2d8cc19 (R#95),
5bac39a (R#96), 439e827 (R#97) **Suggestions:** 24 total (3 MAJOR, 18 MINOR, 3
REJECTED)

**Context:** Six rounds of PR review feedback on the security audit
documentation (security-audit-2026-01-07.md and CANON-SECURITY.jsonl). These
reviews drove schema improvements and traceability enhancements for the
canonical findings format.

**Issues Fixed:**

| Review | Items | Category        | Key Changes                                                                                             |
| ------ | ----- | --------------- | ------------------------------------------------------------------------------------------------------- |
| #92    | 3     | Structure       | Added missing Purpose/Version History sections, fixed Step 4 progress 17%→33%, path format consistency  |
| #93    | 3     | Traceability    | Added explicit file paths to version 1.3, full JSONL path in Purpose, "Canonical JSONL" terminology     |
| #94    | 4     | Schema          | Converted OWASP strings to JSON arrays (10 findings), added file_globs field to F-007, clickable links  |
| #95    | 5     | Schema          | Added severity_normalization to F-001 (S0/S1 divergence), OWASP arrays in markdown JSON blocks          |
| #96    | 5     | Risk Acceptance | F-010 contingency on F-002/F-003, dependencies field, stable link text, severity_normalization to F-007 |
| #97    | 4     | Exit Criteria   | F-010 conditional notes strengthened, verification criteria reference, exit criteria requirements       |

**Rejected:**

| Review | Issue                            | Reason                                                               |
| ------ | -------------------------------- | -------------------------------------------------------------------- |
| #94    | Revert OWASP to string format    | Intentional improvement from #94 (arrays better for machine parsing) |
| #96    | OWASP back to slash-delimited    | Same - array format is intentional schema improvement                |
| #97    | Merge file_globs back into files | Intentional separation of glob patterns from concrete file paths     |

**Schema Improvements Introduced:**

1. **OWASP Field Format** (Review #94)
   - Changed: `"owasp": "A01/A05"` → `"owasp": ["A01", "A05"]`
   - Rationale: JSON arrays enable machine parsing, filter operations,
     aggregation
   - Applied to: All 10 canonical findings in CANON-SECURITY.jsonl

2. **file_globs Field** (Review #94)
   - Added: `"file_globs": ["components/**", "functions/src/**", "lib/**"]` to
     F-007
   - Rationale: Separates glob patterns (for searching) from concrete file paths
     (for linking)
   - Pattern: Use `files` for exact paths, `file_globs` for patterns

3. **severity_normalization Field** (Reviews #95-96)
   - Structure:
     `{"canonical": "S0", "reported": ["S0", "S1"], "reason": "...", "contingency": "..."}`
   - Applied to: F-001 (S0/S1 divergence), F-007 (S2/S3 divergence), F-010
     (S0→S3 risk acceptance)
   - Purpose: Tracks when AI models disagree on severity and documents
     adjudication rationale

4. **Conditional Risk Acceptance** (Reviews #96-97)
   - Added: `"dependencies": ["F-002", "F-003"]` to F-010
   - Added:
     `"contingency": "Risk acceptance contingent on F-002/F-003 remediation"` in
     severity_normalization
   - Pattern: Risk acceptance must specify compensating controls and
     prerequisites

**Patterns Identified:**

1. **Schema Evolution Through Review** (6 reviews - Process)
   - Root cause: Initial canonical format lacked machine-parseable fields
   - Prevention: Design schemas for automation from start (arrays over strings)
   - Pattern: PR review is valid mechanism for schema refinement

2. **Severity Divergence Documentation** (2 findings - Audit Quality)
   - Root cause: Different AI models assessed severity differently
   - Prevention: Always document when models disagree; require adjudication
     rationale
   - Pattern: severity_normalization field captures canonical decision +
     reasoning

3. **Conditional Risk Acceptance** (1 finding - Security)
   - Root cause: Risk acceptance without prerequisites can leave gaps
   - Prevention: Risk acceptance must specify dependencies and contingencies
   - Pattern: F-010 pattern - acceptance valid only after F-002/F-003 resolved

**Key Learnings:**

- **Schema Refinement Through Review**: PR feedback successfully improved
  canonical format
- **Reject Reversions**: When reviewers suggest reverting intentional
  improvements, document rejection reason
- **Traceability Matters**: Explicit file paths, links, and version history
  enable audit trail

**Resolution:**

- Fixed: 24 items (3 MAJOR, 18 MINOR, 3 TRIVIAL)
- Rejected: 3 items (intentional schema improvements)
- All commits pushed to claude/new-session-YUxGa

---

#### Review #101: PR Review Processing - SonarQube, Qodo, CodeRabbit (2026-01-08)

**Source:** Mixed (SonarQube S5852 + Qodo Compliance + CodeRabbit PR)
**PR/Branch:** claude/new-session-70MS0 **Suggestions:** 36 total (Critical: 12,
Major: 5, Minor: 17, Trivial: 2)

**Context:** Comprehensive PR review feedback from SonarQube (12 regex DoS),
Qodo (secure logging), and CodeRabbit (workflow compatibility, documentation).
Multi-pass analysis (3 passes) to ensure complete coverage.

**Patterns Identified:**

1. **Regex Backtracking DoS (SonarQube S5852)** (Critical pattern - 12
   instances)
   - Root cause: `[\s\S]*?` patterns in regex can cause super-linear runtime on
     crafted input
   - Prevention: Use bounded line-by-line parsing via `extractSection()` helper
     function
   - Pattern: Replace unbounded regex with iterative line processing for
     security-critical code

2. **JSON Output Corruption** (Major pattern - Qodo)
   - Root cause: `console.error()` mixed with JSON output when `--json` flag is
     set
   - Prevention: Check `JSON_OUTPUT` flag before any stderr output; use
     `console.log(JSON.stringify())` for errors
   - Pattern: Guard all console.error calls when JSON mode is active

3. **Workflow-Incompatible JSON Schema** (Major pattern - CodeRabbit)
   - Root cause: GitHub Actions workflow expected `triggers` object and
     `recommendation` string
   - Prevention: Document expected JSON schema; add required fields for workflow
     consumers
   - Pattern: JSON output contracts must match consumer expectations

4. **False Positive on Fresh Projects** (Major pattern - CodeRabbit)
   - Root cause: Multi-AI commit trigger fires when no audit history exists
     (empty `allDates`)
   - Prevention: Guard trigger logic inside `allDates.length > 0` check
   - Pattern: Empty-state guards prevent false positives in threshold systems

5. **Single-Session Audit Threshold Confusion** (Minor pattern - Documentation)
   - Root cause: 6 audit command files incorrectly stated "Reset Threshold: YES"
   - Prevention: Single-session audits do NOT reset thresholds (only multi-AI
     audits do)
   - Pattern: Document threshold reset policy clearly at point of use

**Key Learnings:**

- **Bounded Parsing**: Replace `[\s\S]*?` regex with line-by-line iteration for
  security
- **Output Isolation**: JSON mode requires ALL output go through JSON, not just
  success
- **Contract Documentation**: Workflow consumers need documented schema
  expectations
- **Empty-State Guards**: Always handle "no prior data" case in
  threshold/trigger systems

**Resolution:**

- Fixed: 34 items (12 Critical regex, 5 Major logic, 17 Minor JSDoc/docs)
- Deferred: 5 items (Performance audit action items → Step 4.2.3a)
- Rejected: None

**Fixes Applied:**

| #     | Severity | Issue                               | File(s)                        | Fix                                                 |
| ----- | -------- | ----------------------------------- | ------------------------------ | --------------------------------------------------- |
| 1-12  | CRITICAL | Regex backtracking DoS (S5852)      | check-review-needed.js         | Added `extractSection()` with line-by-line parsing  |
| 13    | MAJOR    | console.error corrupts JSON output  | check-review-needed.js:557-561 | Guard with `if (JSON_OUTPUT)` check                 |
| 14    | MAJOR    | Missing workflow JSON fields        | check-review-needed.js:636-649 | Added `triggers` object and `recommendation` string |
| 15    | MAJOR    | False positive on no audit history  | check-review-needed.js:461     | Guard inside `allDates.length > 0`                  |
| 16    | MAJOR    | Special-case if/else for categories | check-review-needed.js:372-415 | Refactored to generic file matching                 |
| 17    | MINOR    | Missing checkBundle logic           | check-review-needed.js:398-401 | Added `isBundleChanged()` call                      |
| 18-23 | MINOR    | Incorrect threshold reset docs      | 6 audit-\*.md files            | Changed "Reset: YES" to "NO (single-session)"       |
| 24-40 | MINOR    | Missing JSDoc documentation         | check-review-needed.js         | Added 17 complete JSDoc blocks                      |

---

## Review #146 - Settings Page PR Feedback

**Date:** 2026-01-14 **Source:** Qodo PR Review **Trigger:** PR feedback on
Settings page implementation **Category:** MINOR (all suggestions)

**Items Received:** 3

1. **Scroll Containment Missing** (Minor - Qodo)
   - Root cause: Nested scrollable content can chain scroll to parent elements
   - Fix: Added `overscroll-contain` class to journal-layout.tsx content wrapper
   - Pattern: Always add `overscroll-contain` to nested scrollable containers

2. **Whitespace in Nickname Not Trimmed** (Minor - Qodo)
   - Root cause: Zod schema accepted whitespace-only nicknames
   - Fix: Added `.trim()` to nickname schema in users.ts
   - Pattern: Use Zod's `.trim()` for user-input strings to normalize whitespace

3. **Truthy Check Instead of Strict Null** (Minor - Qodo)
   - Root cause: `!profile.cleanStart && cleanDate` relies on falsy coercion
   - Fix: Changed to `profile.cleanStart === null && cleanDate !== ""`
   - Pattern: Use strict equality for null checks on nullable fields

**Key Learnings:**

- **Scroll Containment**: `overscroll-contain` prevents scroll chaining in
  nested containers
- **Input Normalization**: Zod's `.trim()` handles whitespace at validation
  layer
- **Type Safety**: Strict null checks are more explicit than truthy/falsy checks

**Resolution:**

- Fixed: 3 items (all MINOR)
- Deferred: None
- Rejected: None

**Fixes Applied:**

| #   | Severity | Issue                      | File(s)               | Fix                               |
| --- | -------- | -------------------------- | --------------------- | --------------------------------- |
| 1   | MINOR    | Missing overscroll-contain | journal-layout.tsx:77 | Added `overscroll-contain` class  |
| 2   | MINOR    | Whitespace not trimmed     | users.ts:61           | Added `.trim()` to Zod schema     |
| 3   | MINOR    | Truthy instead of strict   | settings-page.tsx:156 | Changed to strict null comparison |

---
