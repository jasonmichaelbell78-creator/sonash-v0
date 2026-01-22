# AI Review Learnings Log

**Document Version:** 10.0 **Created:** 2026-01-02 **Last Updated:** 2026-01-20

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

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.0    | 2026-01-20 | Review #190: Cherry-Pick PR Qodo Third Follow-up - 10 fixes (3 Security, 5 Major, 2 Minor). **SECURITY**: Symlink traversal protection in check-docs-light.js, phase-complete-check.js, archive-doc.js using lstatSync + realpathSync. **MAJOR**: Deterministic merge order in aggregate-audit-findings.js (sort after Set→Array), bulk fix conflict detection in verify-sonar-phase.js, safeToIso helper in admin.ts, Windows path detection in check-pattern-compliance.js. **PATTERNS**: (1) Always use lstatSync before statSync to detect symlinks; (2) Sort indices after Array.from(Set) for deterministic iteration; (3) Bulk operations must validate against individual entries for conflicts.                                                                                                                           |
| 9.9     | 2026-01-19 | Review #185: PR 2 TypeScript Files - S3776 Cognitive Complexity Reduction (5 high-complexity TS/TSX files). Files: jobs.ts (42→~15), resources-page.tsx (48→~15), users-tab.tsx (41→~15), settings-page.tsx (41→~15), security-wrapper.ts (39→~15). **KEY PATTERNS FOR TYPESCRIPT**: (1) Extract health check helpers (e.g., `checkErrorRateHealth()`, `checkJobStatusHealth()`); (2) Extract badge/styling helpers (e.g., `getMeetingTypeBadgeClasses()`, `getHomeGenderBadgeClasses()`); (3) Extract state update helpers (e.g., `updateUserInList()`); (4) Extract validation builders (e.g., `buildCleanStartTimestamp()`, `parseDateTimeParts()`); (5) Extract security check steps (e.g., `checkUserRateLimit()`, `handleRecaptchaVerification()`). React pattern: Move helpers outside component to module scope for reuse. |
| 9.8     | 2026-01-19 | Review #184: PR 2 Continued - S3776 Cognitive Complexity Reduction (~40 issues fixed in 9 high-complexity scripts). Files: aggregate-audit-findings.js (87→~25), check-docs-light.js (55→~15), check-backlog-health.js (39→~12), validate-canon-schema.js (37→~12), security-check.js (35→~12), run-consolidation.js (34→~12), validate-audit.js (34→~12), log-session-activity.js (32→~12), generate-documentation-index.js (56→~15). **KEY PATTERNS**: (1) Extract lookup maps for nested ternaries (e.g., `TIER_DESCRIPTIONS`, `ID_PREFIX_CATEGORY_MAP`); (2) Extract `process*IntoSummary()` helpers for event/state processing; (3) Extract `validate*()` helpers for validation chains; (4) Extract `output*()` helpers for console output; (5) Move nested functions to module scope (S2004).                               |
| 9.7     | 2026-01-19 | Reviews #182-183: SonarCloud Cleanup Sprint learnings consolidated from deleted AI_LESSONS_LOG.md. Review #182: PR 1 Mechanical Fixes (186 issues, 8 rules, 48 files - node: prefix, shell modernization). Review #183: PR 2 Critical Issues partial (~20 issues, 6 rules - cognitive complexity refactoring, void operator, mutable exports). **KEY LEARNINGS**: Helper extraction for complexity reduction, factory functions for SSR exports, syntax validation after batch operations.                                                                                                                                                                                                                                                                                                                                         |
| 9.6     | 2026-01-18 | Review #142: PR #281 SonarCloud workflow configuration - 11 fixes across 2 rounds (4 Major: SHA pinning, contents:read, Basic auth fix, conclusion polling; 7 Minor: permissions, fork skip, GITHUB_TOKEN). 1 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 9.5     | 2026-01-18 | **CONSOLIDATION #13 + ARCHIVE #4**: Patterns from Reviews #137-143, #154-179 (33 reviews) → CODE_PATTERNS.md v2.0. **22 new patterns added**: 6 React/Frontend (cursor pagination, Firestore-first, capture before tx, primitive deps, functional setState, claims preservation); 5 Security (isPlainObject, O(n²) DoS, npx --no-install, URL allowlist, self-scanner exclusion); 4 JS/TS (listDocuments, non-greedy JSON, Next.js bundling, cognitive complexity); 3 CI (per-item error, complete loops, pre-push); 2 Docs (YAML frontmatter, xargs hang); 1 GitHub Actions (boolean outputs). **ARCHIVE #4**: Reviews #101-136 → REVIEWS_101-136.md. Active reviews now #137-179. Counter reset.                                                                                                                                 |
| 9.4     | 2026-01-18 | Review #179: PR #277 Round 4 - 8 items (1 CRITICAL: cursor-based pagination for batch jobs to prevent infinite loops; 3 MAJOR: Firestore-first operation order, full rollback with captured original values, functional setState updates; 2 MINOR: primitive useEffect deps, null check for days display; 2 VERIFIED: admin error messages acceptable, logSecurityEvent sanitizes). **KEY LESSONS: (1) startAfter(lastDoc) for batch jobs, not hasMore flag; (2) Firestore first for easier rollback; (3) Capture original values before transaction.**                                                                                                                                                                                                                                                                            |
| 9.3     | 2026-01-18 | Review #178: PR #277 Soft-Delete + Error Export - 18 items (6 MAJOR: hardcoded bucket→default bucket, auth deletion only ignore user-not-found, paged batches for hard delete, Firestore transaction for undelete with expiry check, rollback soft-delete if Firestore fails, block admin self-deletion; 8 MEDIUM: zod validation with trim/max, stale state fix with uid capture, reset dialog on user change, NaN prevention, timeout cleanup ×2, accessibility keyboard listeners ×2; 4 MINOR: structured logging types, ARIA attributes, URL redaction, whitespace trim). **KEY LESSONS: (1) Use admin.storage().bucket() not hardcoded names; (2) Only ignore auth/user-not-found to prevent orphaned accounts; (3) Process batches until empty, not just first 50.**                                                         |
| 9.2     | 2026-01-17 | Review #177: Qodo PR #273 - 3 items (1 MAJOR: use `--no-verify` instead of `HUSKY=0` env for CI hook bypass - more explicit/standard; 2 MINOR: trailing slash consistency for `functions/src/admin/` trigger, fix Session #XX→#72 comment). **KEY LESSON: `git commit --no-verify` is more explicit and standard than HUSKY env var for bypassing hooks in CI.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 9.1     | 2026-01-17 | Review #176: Qodo Round 4 - 7 items (1 SECURITY: path traversal hardened in check-docs-light.js with resolve()+startsWith()+sep for Windows drive letter handling; 2 BUG: CRLF JSONL parsing via .trim() before JSON.parse, pipe-safe table parsing using fixed positions from end; 3 DATA: EFFP-\*→engineering-productivity category mapping, self-dependency filtering to prevent loops, omit empty cwe fields; 1 CI: auto-Prettier in npm script chain). **KEY LESSON: resolve()+startsWith()+sep handles Windows paths safely - regex-based path traversal can be bypassed with different drive letters.**                                                                                                                                                                                                                     |
| 9.0     | 2026-01-17 | Review #175: Qodo Round 3 - 10 items (2 SECURITY: path traversal in check-docs-light.js fixed with /^\.\.(?:[\\/]\|$)/.test(rel), markdown injection prevented with safeCell() escaping; 4 ROBUSTNESS: merged*from ID indexing for stable dependency lookups, blank ROI→undefined handling, REPO_ROOT for cwd-independent paths, ID prefix→category mapping for SEC-010; 2 PERFORMANCE: category bucket cap at 250 to prevent O(n²) blowup; 1 CI: try/catch for all readFileSync + pathExclude update). \*\*KEY LESSON: ID prefix (SEC-*, PERF-\_) is authoritative for category - subcategory metadata can be inconsistent.\*\*                                                                                                                                                                                                   |
| 8.9     | 2026-01-17 | Review #174: Qodo Round 2 - 4 items (1 HIGH: multi-pass deduplication until fixpoint - merged items may match new candidates; 2 MEDIUM: ROI normalization to uppercase for consistent scoring, O(1) ID index for DEDUP->CANON lookups; 1 CI: Prettier on regenerated output files). **KEY LESSON: Single-pass deduplication is incomplete when merges create new match opportunities - iterate until fixpoint.**                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 8.8     | 2026-01-17 | Review #173: Qodo Code Suggestions - 5 items (1 HIGH: section-based backlog parsing to avoid missing items with long content; 4 MEDIUM: full merge ancestry preservation, confidence field normalization number→string, deduplication O(n²)→O(n·bucket) with pre-bucketing; 1 CI: Prettier formatting on MASTER_ISSUE_LIST.md). **KEY LESSON: Pre-bucketing by file/category before O(n²) deduplication dramatically reduces comparisons.**                                                                                                                                                                                                                                                                                                                                                                                        |
| 8.7     | 2026-01-17 | Review #172: SonarCloud Regex Complexity + Code Smells - 7 items (1 MAJOR: regex complexity 24>20 in table parsing; 6 MINOR: catch param naming, exception handling, replaceAll() preferences). **KEY LESSON: Complex table-parsing regex should be split into multiple simpler patterns or use a step-wise parsing approach.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8.6     | 2026-01-17 | Review #171: aggregate-audit-findings.js PR Hardening - 29 items (6 MAJOR: 3 ReDoS regex vulnerabilities, 2 cognitive complexity refactors, 1 algorithmic DoS; 13 MINOR: outputDir guard, error sanitization, unused variables, Array() syntax; 10 TRIVIAL: replaceAll(), Prettier; 2 DEFERRED: CLI logging style, local file access). **KEY LESSON: Pattern compliance scripts need same security rigor as production code.**                                                                                                                                                                                                                                                                                                                                                                                                     |
| 8.5     | 2026-01-17 | Review #170: Non-Plain Object Redaction + GCP URL Whitelist - 10 items (3 MAJOR: non-plain object redaction bypass, GCP URL whitelist for open redirect, set() merge vs update(); 6 MINOR: adminGetLogs access log, structured storage cleanup errors, typeof for rollback value, Number.isFinite for userCount, cursor type validation, useEffect unmount guard, always-mounted tab panels; 1 REJECTED: Zod validation details - admin endpoint acceptable). **KEY LESSON: isPlainObject() returns non-plain objects unchanged - must serialize to safe representation.**                                                                                                                                                                                                                                                         |
| 8.4     | 2026-01-17 | Review #169: ReDoS + Rollback Fix + Console Redaction - 8 items (3 MAJOR: ReDoS in email regex, rollback uses prev privilege not 'free', redact console output; 5 MINOR: severity clamp, metadata type check, string cursor sentinels, typeof userCount checks; 2 REJECTED: 5th index scope flip-flop, storage risk-accepted). **KEY LESSON: Console output bypasses Firestore redaction - must redact metadata before logging.**                                                                                                                                                                                                                                                                                                                                                                                                  |
| 8.3     | 2026-01-17 | Review #168: Claims Rollback + JSON Safety - 7 items (4 MAJOR: rollback Firestore on claims failure, toJsonSafe for Timestamps, sentinel timestamps for cursors, error key redaction; 3 MINOR: Array.isArray in adminSetUserPrivilege, tabpanel ARIA elements, userCount N/A display). **KEY LESSON: Claims can fail after Firestore write - need try/catch rollback for atomicity.**                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 8.2     | 2026-01-17 | Review #167: Asymmetric Privilege Security + Robustness - 14 items (2 CRITICAL: CI Prettier, asymmetric privilege order GRANT:Firestore→claims REVOKE:claims→Firestore; 4 MAJOR: block privilege deletion in use, pagination cursor stability, truncate log fields, structured error logging; 8 MINOR: ARIA tabs semantics, tablist role, userCount nullable, label fix, metadata validation, privilege sanitization, Array.isArray guard, type-only React import; 1 REJECTED: 4th flip-flop on index scope). **KEY LESSON: Privilege changes need asymmetric fail-safe order - grant=Firestore-first, revoke=claims-first.**                                                                                                                                                                                                      |
| 8.1     | 2026-01-17 | Review #166: Track A CI Fixes & Robustness - 16 items (3 CRITICAL: CI TS error from #165 JSX.Element→React.ComponentType, missing version history; 4 MAJOR: privilege update order, userCount fallback, storeLogInFirestore error sanitization, userId validation; 2 MINOR: preserve non-plain metadata, normalize privilege defaults; 7 REJECTED: 3rd flip-flop on index scope, risk-accepted issues, duplicates). **KEY LESSON: JSX.Element requires React import; React.ComponentType is safer. AI keeps flip-flopping on index scope - ALWAYS verify against code.**                                                                                                                                                                                                                                                           |
| 8.0     | 2026-01-17 | Review #165: Track A Follow-up Qodo Compliance - 12 items (1 CRITICAL: CI Prettier blocker; 4 MAJOR: raw error logging, pagination loop guard, isPlainObject metadata, REVERT #164 index scope error; 2 MINOR: storage deploy cmd, button a11y; 1 TRIVIAL: React namespace type; 4 REJECTED: message PII redesign, compliance-only). **KEY LESSON: Verify AI suggestions against actual code - #164 gave wrong advice about COLLECTION_GROUP vs COLLECTION scope.** New patterns: isPlainObject() for metadata redaction, pagination loop guards. ⚠️ **NOTE: JSX.Element change caused TS2503 - reverted in #166.**                                                                                                                                                                                                                |
| 7.9     | 2026-01-17 | Review #164: Track A Cherry-Pick PR Qodo Compliance - 10 items (1 CRITICAL: Firestore index queryScope; 3 MAJOR: PII in logs, storage pagination, metadata redaction on read; 3 MINOR: structured logging, array validation, Storage ACL docs; 3 REJECTED: risk-accepted Firestore logging, compliance-only items). New patterns: COLLECTION_GROUP for collection group queries, paginate bucket.getFiles(), redact metadata on read for defense-in-depth. ⚠️ **NOTE: Index scope change was INCORRECT - reverted in #165.**                                                                                                                                                                                                                                                                                                       |
| 7.8     | 2026-01-17 | Review #163: Track A PR Follow-up Compliance - 12 items (5 MAJOR: per-item error handling, transaction for privilege updates, auth error propagation, schema validation, raw error UI; 5 MINOR: rename cleanupOldDailyLogs, null for claims, listDocuments, built-in types guarantee, observability note; 2 TRIVIAL: storage ACL docs, message PII risk-accept). New patterns: Per-item error handling in jobs, Firestore transactions for updates, listDocuments() for ID-only queries.                                                                                                                                                                                                                                                                                                                                           |
| 7.7     | 2026-01-16 | Review #162: Track A Admin Panel PR Feedback - 22 items (1 CRITICAL: CI blocker README formatting; 8 MAJOR: error swallowing, PII in logs, claims bug, orphan detection, N+1 queries; 11 MINOR: UX improvements; 2 DEFERRED to roadmap). New patterns: Metadata redaction, preserve custom claims, collectionGroup queries, batch auth lookups.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 7.6     | 2026-01-16 | Review #161: lint-staged PR Feedback - 3 items (2 MAJOR: supply-chain risk with npx, hidden stderr errors; 1 MINOR: README/ROADMAP Prettier formatting). New patterns: Use `npx --no-install` for security, expose hook error output for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 7.5     | 2026-01-16 | Review #160: PR #265 Qodo Suggestions - 2 items (2 MINOR: scope getConsolidationStatus to section for robustness, normalize paths for cross-platform matching). New patterns: Scope document section parsing to prevent accidental matches elsewhere, normalize backslashes + lowercase for Windows compatibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 7.4     | 2026-01-16 | Review #159: PR #265 CI Round 3 - 6 items (1 MAJOR: false positive readFileSync:413 - add to pathExclude; 5 MINOR: remove unused path import, unused \_error→\_, stdout/stderr logging for debugging, quiet mode output suppression, TTY-aware colors). New patterns: Update pathExclude for verified try/catch files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 7.3     | 2026-01-16 | Review #158: PR #265 CI Round 2 - 8 items (3 MAJOR: unsafe error.message at check-cross-doc-deps.js:280, readFileSync without try/catch at run-consolidation.js:386, git option injection missing -- separator; 5 MINOR: escape regex in dynamic RegExp, ESM→CommonJS consistency, scope updateConsolidationCounter to section, path matching improvements, session-start warnings counter). 2 REJECTED: audit context + unstructured logs are intentional CLI design. New patterns: Always use -- before paths in git commands, escape user input in RegExp constructors.                                                                                                                                                                                                                                                         |
| 7.2     | 2026-01-16 | Review #157: PR #265 Session #69 Feedback - 11 items (1 MAJOR: ReDoS prevention bounded regex; 6 MINOR: execFileSync for getStagedFiles, verbose logging, TTY-aware colors, regex validation, exit code warning, path.basename matching; 4 TRIVIAL: unused imports, pre-commit override hint, Prettier). 1 REJECTED: Qodo false positive on exitCode definition. New patterns: Bound regex quantifiers for ReDoS, TTY-aware ANSI colors, path.basename for file matching.                                                                                                                                                                                                                                                                                                                                                          |
| 7.1     | 2026-01-16 | Review #156: Security Hardening & Pre-Push Fix - 4 items (2 MAJOR: pre-push scans pushed commits not staged, --file path traversal protection; 2 MINOR: backlog excludes Rejected Items, cross-platform regex). New patterns: Pre-push vs pre-commit file selection, path traversal in CLI args, cross-platform regex.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 7.0     | 2026-01-16 | Review #155: Security Check Self-Detection & CI Fix - 4 items (2 MAJOR: security-check.js/check-pattern-compliance.js SEC-002 self-exclusion; 2 MINOR: CI workflow boolean flag for --all detection, session-start.js execSync timeout/maxBuffer). New patterns: Self-referential exclusion for security scanners, multiline output comparison in GitHub Actions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6.9     | 2026-01-15 | Review #154: Admin Error Utils Security Hardening - 5 items (5 MINOR: URL credential/port rejection, JWT token redaction, phone regex separator requirement, boundary test fix). New patterns: URL credential injection prevention, JWT base64url detection, phone regex precision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 6.8     | 2026-01-15 | Review #153: Admin Error Utils Follow-up - 6 items (1 CRITICAL: CI blocker transient, 5 MINOR: TLD regex bound {2,63}, large input guard 50K chars, nullable types on all 3 functions with tests). New patterns: TLD max 63 chars per RFC, guard against large payloads, explicit nullable types for robustness.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6.7     | 2026-01-15 | Review #152: Admin Error Utils PR Feedback - 7 items (1 CRITICAL: CI blocker already resolved, 1 MAJOR: email regex ReDoS fix with RFC 5321 length limits, 1 MINOR: trim whitespace dates, 2 TRIVIAL: code cleanup, 2 REJECTED: SonarCloud false positives on security tests). New patterns: Regex ReDoS prevention with length limits, security test false positives in SonarCloud.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6.6     | 2026-01-15 | Review #148: Dev Dashboard Security Hardening - 8 items fixed (3 MAJOR: Prettier blank line, raw error exposure, client write-only; 5 MINOR: network errors, stale state, null guard, safe error extraction, non-nullable prop). New patterns: Never expose raw Firebase errors, dev data client read-only, defensive null guards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6.5     | 2026-01-15 | Review #147: CI Blocker Fixes + Firebase Error Handling - 7 items (1 CRITICAL: logger.debug TS2339; 3 MAJOR: ROADMAP date format, Firestore dev/\* rules, Firebase error specificity; 3 MINOR: token refresh, network errors, errorCode logging). New patterns: prettier-ignore for linter conflicts, explicit admin rules for dev collections, getIdTokenResult(true) for fresh claims.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 6.4     | 2026-01-14 | Review #145: Settings Page Accessibility & Security - 14 items (5 MAJOR: toggle accessibility, date validation, preference preservation, timezone bug, form labels; 9 MINOR: useAuth deprecated, props readonly, silent return, error logging, audit logging, change detection). New patterns: Accessible toggle (button+role=switch), local date formatting, preference spread.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6.3     | 2026-01-13 | Review #141: PR Review Processing Round 3 - 5 items (1 MEDIUM: schema category token normalization, 4 LOW: grep -E portability, header verification coverage). New patterns: Schema category enums should be single CamelCase tokens without spaces, always use grep -E for alternation patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6.2     | 2026-01-13 | Review #140: PR Review Processing Round 2 - 7 items (1 MEDIUM: grep xargs hang fix, 6 LOW: category enum alignment, improved grep patterns for empty catches and correlation IDs, grep portability fixes). New patterns: Use while read instead of xargs, align category names with schema enums.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6.1     | 2026-01-13 | Review #139: PR Review Processing - 11 items (2 MAJOR: missing YAML frontmatter in slash commands, 8 MINOR: documentation lint fixes, grep pattern improvements, Debugging Ergonomics category added to audit-code). New patterns: Commands need YAML frontmatter, Tier-2 docs need Purpose/Version History sections.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 6.0     | 2026-01-12 | ARCHIVE #3: Reviews #61-100 → REVIEWS_61-100.md (1740 lines removed, 3170→1430 lines). Active reviews now #101-136. Session #58.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 5.9     | 2026-01-12 | CONSOLIDATION #11: Reviews #121-136 → CODE_PATTERNS.md v1.7 (16 new patterns: 6 Security, 4 JS/TS, 5 CI/Automation, 1 GitHub Actions). Counter reset. Session #57.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5.8     | 2026-01-12 | Review #136: PR CI Feedback Round 3 (SonarQube + Qodo + CI) - 14 items. Fixed: 7 MAJOR security (admin.ts PII logging sanitized - log queryLength/queryType instead of raw query, leaky error message in adminTriggerJob, Firestore auto-ID instead of Date.now() for collision resistance, id field placement after spread, HttpsError preservation in migrateAnonymousUserData, meetings.ts batch delete chunking for 500-doc limit, use-journal.ts sanitization order - script/style before tags), 3 MAJOR quality (Array.isArray guards in generateSearchableText, unused deps added to knip ignore), 4 MINOR (GLOBAL_EXCLUDE added to pattern checker for dev utility scripts with pre-existing debt). New pattern: Chunk batch operations under Firestore 500-op limit. Session #55.                                         |
| 5.7     | 2026-01-12 | Review #135: PR Cherry-Pick CI Feedback Round 2 (Qodo + CI) - 10 items. Fixed: 6 MAJOR (Prettier formatting 518 files, dependency issues - removed @modelcontextprotocol/sdk + undici, added globals + postcss-load-config, duplicate exports in error-boundary.tsx, pattern compliance pathExclude for meta-detection, matchesWord() wildcard support for ".?" patterns), 4 MINOR (coderabbit exit code opt-in via CODERABBIT_EXIT_ON_FINDINGS env var, pattern-check.js cross-platform path handling using path.sep). Pre-existing issues documented in ROADMAP.md. Session #55.                                                                                                                                                                                                                                                 |
| 5.6     | 2026-01-12 | Review #134: PR Cherry-Pick CI Feedback (Qodo + CI) - 12 items. Fixed: 7 MAJOR (session-start.js path containment security bug using path.relative(), add rel === "" checks to 5 hook files, escape regex in analyze-user-request.js), 5 MINOR (detect sensitive paths in coderabbit-review.js, cap file sizes, exit non-zero on findings, trim input, secure logging). Verified 4 false positives from pattern checker (readFileSync already in try/catch). New pattern: Include rel === "" in all path.relative() containment checks. Session #55.                                                                                                                                                                                                                                                                               |
| 5.5     | 2026-01-12 | Review #133: PR #238 Round 3 (Qodo + CI) - 12 items. Fixed: 6 MAJOR (JSON arg parsing + path containment + sensitive file filter in coderabbit-review.js, path.relative() containment in check-write/edit-requirements.js + check-mcp-servers.js, lockfile hash null handling in session-start.js), 5 MINOR (filter empty server names, check error/signal in pattern-check.js, wrap realpathSync, stderr for messages, path.relative in pattern-check.js). New patterns: Use path.relative() for robust cross-platform containment, return null not 'unknown' on hash failures, filter sensitive files before external tool calls. Session #55.                                                                                                                                                                                   |
| 5.4     | 2026-01-12 | Review #132: PR #238 Compliance Fixes (Qodo + CI) - 14 items. Fixed: 1 MAJOR command injection (quote $ARGUMENTS in settings.json for coderabbit-review.js), 1 MAJOR project dir validation (pattern-check.js), 4 MINOR security hardening (Windows backslash normalization, option-like/multiline path rejection in check-write/edit-requirements.js), 3 MINOR (combine stdout+stderr in pattern-check.js, file size cap DoS protection in check-mcp-servers.js, TOCTOU try/catch in coderabbit-review.js), 2 MINOR (5s timeout for hasCodeRabbit(), CLI arg ordering fix --plain before --), 1 FIX (dead else-if ESLint error). New patterns: Quote all shell arguments, normalize Windows paths for cross-platform, cap file sizes before reads. Session #55.                                                                   |
| 5.3     | 2026-01-12 | Review #131: PR #238 CI Fix (ESLint + Qodo Compliance) - 17 items. Fixed: 7 CRITICAL ESLint errors in all .claude/hooks/_.js files (no-undef for process/console/require - use `/_ global require, process, console _/`for flat config), 1 MAJOR command injection (execSync→spawnSync in pattern-check.js), 3 MAJOR path traversal (use path.resolve + containment check), 2 MINOR (remove 'design' keyword ambiguity, fix unused 'error' var), 4 MINOR (useless escape, unused import). New patterns: Use`/_ global _/`not`/_ eslint-env \*/` for ESLint flat config, use spawnSync for safe subprocess calls. Session #55.                                                                                                                                                                                                      |
| 5.2     | 2026-01-12 | Review #130: PR #236 Round 4 (SonarQube + Qodo) - 27 items parsed across 2 rounds. Fixed: 5 MAJOR (sensitive logging in admin search/journal/crud-table, error.message in alerts), 2 MINOR (doc lint patterns, midnight refresh for daily quote). 16 items verified ALREADY FIXED from #127-129. New pattern: Log errorType/errorCode only, use generic user-facing messages. Session #54.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 5.1     | 2026-01-12 | Review #129: PR #236 Post-Commit Feedback (SonarQube + Qodo) - 9 items on new code (2 CRITICAL: cognitive complexity refactor, production reCAPTCHA fail-closed; 4 MAJOR: cache failures, initial state alignment, localStorage try/catch, error cause chain; 3 MINOR: globalThis.window, Intl.DateTimeFormat, secure logging). New patterns: Extract helpers to reduce complexity, fail-closed security in production, cache error states to prevent retry storms, use globalThis over window for SSR. Session #53.                                                                                                                                                                                                                                                                                                               |
| 5.0     | 2026-01-11 | Review #128: PR #236 Follow-up (Qodo) - 5 items (1 HIGH: Sentry IP privacy fix; 1 MEDIUM: CI arg separator; 1 DEFERRED: doc ID hashing; 2 ALREADY DONE from #127). New patterns: Third-party PII hygiene, CLI arg injection prevention. Session #52.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 4.9     | 2026-01-11 | Review #127: PR #236 Comprehensive Review (SonarQube + Qodo) - 14 items (3 CRITICAL: pin GitHub Action SHA, harden reCAPTCHA bypass, fix IPv6 normalization; 4 MAJOR: regex precedence, sanitize error messages, reset journalLoading; 6 MINOR: operationName granularity, CI main-only push, simplify IP retrieval, audit trails, log sensitivity). Session #50.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4.8     | 2026-01-11 | Review #126: Tier-2 Output PR Feedback Round 3 (Qodo) - 4 items (3 MINOR: HUMAN_SUMMARY merged IDs column for traceability, CANON_QUICK_REFERENCE enum clarification, AUDIT_PROCESS_IMPROVEMENTS normalize:canon fallback note; 1 TRIVIAL: version header already 4.7). All applied. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4.7     | 2026-01-11 | Review #125: Tier-2 Output PR Feedback Round 2 (Qodo) - 4 items (2 MINOR: HUMAN_SUMMARY DEDUP IDs in Top 5 table, PR_PLAN.json PR3 dedup IDs; 1 TRIVIAL: version header 4.5→4.6). 1 rejected (assign PR19 to App Check items - PR19 doesn't exist, "-" is correct). Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4.6     | 2026-01-11 | Review #124: Tier-2 Output PR Feedback (Qodo) - 9 items (1 MAJOR rejected: project management tools - static docs intentional for AI context; 6 MINOR: PR_PLAN dedup IDs, REFACTOR_BACKLOG PR associations, PR-LINT reference, HUMAN_SUMMARY next steps, included_dedup_ids field; 2 TRIVIAL: npm script note, hardcoded count). 1 rejected (CANON-0005 distinct from DEDUP-0001: client vs server App Check). New pattern: Dedup IDs should be explicitly linked in PR plans. Session #49.                                                                                                                                                                                                                                                                                                                                        |
| 4.5     | 2026-01-11 | Review #123: TIER-2 AGGREGATION (Task 4.3.1-4.3.6) - Cross-category unification of 118 CANON findings. Output: 97 unique findings (21 merged as duplicates), 12 duplicate clusters identified, 21 PRs planned. Key findings: 5 S0 Critical (memory leak, legacy writes, CI gates, complexity, App Check), 32 S1 High, 42 S2 Medium, 18 S3 Low. Comprehensive scope: CANON + SonarQube (548) + ESLint (246) = ~891 total. Session #49.                                                                                                                                                                                                                                                                                                                                                                                              |
| 4.4     | 2026-01-11 | Review #122: PR #232 Round 2 - 3 items (1 MEDIUM: CRLF normalization + regex whitespace; 2 LOW: process.exitCode for buffer flush, bash version check). New patterns: Normalize CRLF for cross-platform, use process.exitCode over process.exit(), check BASH_VERSION for bash-specific scripts. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4.3     | 2026-01-11 | Review #121: PR #232 Qodo/SonarCloud - 13 items (4 MAJOR: exit code docs, stderr suppression, large JSON gitignore, CI trigger syntax; 5 MINOR: line counting, script detection, archive parsing, repo-root path, try/catch; 3 LOW: NaN guard, glob reliability, merge conflict). New patterns: Document all exit codes, capture stderr for debugging, gitignore large generated files. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 4.2     | 2026-01-11 | CONSOLIDATION #10: Reviews #109-120 → CODE_PATTERNS.md v1.6 (5 new patterns: 3 Security, 2 JS/TS). Counter reset. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4.1     | 2026-01-11 | Review #120: PR #228 Qodo Round 3 - 4 items (2 URGENT prototype pollution/secure logging, 1 HIGH fail-fast validation, 1 MEDIUM GitHub Actions workflow undefined fix). CANON-0043 verified correct. New patterns: Use Map for untrusted keys, never log raw input content, fail-fast on parse errors. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 4.0     | 2026-01-11 | Review #119: PR #228 Qodo Round 2 - 9 items (2 MAJOR NaN-safe sorting/missing-ID validation, 6 MINOR category normalization/coverage output/session tracking/finding count, 1 TRIVIAL trailing newline). Deferred: JSON Schema migration. New pattern: Ensure numeric fields have robust fallbacks for sorting. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3.9     | 2026-01-11 | Review #118: PR #228 Follow-up Feedback - 1 item (1 HIGH report-to-JSONL ID mismatches). Updated 3 markdown audit reports + CANON-REFACTOR.jsonl to use normalized CANON-XXXX IDs. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3.8     | 2026-01-11 | Review #117: PR #228 Qodo Feedback - 8 items (1 CRITICAL dependency ID rewriting bug in normalize script, 3 HIGH error handling/outdated IDs, 4 MEDIUM duplicate detection/category handling/FS error handling/legacy ID references). New patterns: CANON ID normalization must update all references including dependencies. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 3.7     | 2026-01-11 | Review #116: PROCESS/AUTOMATION AUDIT (Task 4.2.6) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 38 raw findings → 14 canonical. Severity: S0 (1): non-blocking CI gates; S1 (3): script coverage, security scanning, deploy gcloud; S2 (6): pre-commit slow, workflow docs; S3 (4): permissions, false positives. **SUB-PHASE 4.2 COMPLETE** - All 6 audit categories finished. Session #46.                                                                                                                                                                                                                                                                                                                                                                                         |
| 3.6     | 2026-01-11 | Review #115: DOCUMENTATION AUDIT (Task 4.2.5) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 37 raw findings → 14 canonical. Severity: S1 (2): broken links, [X] placeholders; S2 (8): Tier 2 metadata, orphaned docs; S3 (4): archive rot, fragile anchors. Session #46.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3.5     | 2026-01-10 | Review #114: REFACTORING AUDIT (Task 4.2.4) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 65 raw findings → 27 canonical. Severity: S0 (1): cognitive complexity; S1 (7): type drift, deprecated paths; S2 (15): duplication clusters; S3 (4): batch fixes. Session #45.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3.4     | 2026-01-09 | Review #113: PR #225 Comprehensive Compliance - 6 items (1 HIGH ampersand entity injection, 2 MEDIUM HTTPS enforcement/JSON parsing, 3 MINOR encodeURI/private:true/nullish coalescing). Session #39 continued.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3.3     | 2026-01-09 | Review #112: PR #225 Final Compliance - 6 items (3 HIGH injection/SSRF/stack-trace, 3 MEDIUM timeout/logging/archived-paths). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 3.2     | 2026-01-09 | Review #111: PR #225 Compliance Fixes - 8 items (2 HIGH SSRF/secret exposure, 5 MEDIUM error handling/validation/performance, 1 LOW unstructured logging). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.1     | 2026-01-09 | Review #110: PR #225 Follow-up - 6 items (3 MAJOR path canonicalization/archive boundary/exclude boundary, 3 MINOR indented code blocks/recursion deferred). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3.0     | 2026-01-09 | Review #109: PR #225 Feedback - 16 items (2 CRITICAL FS error handling/error exposure, 4 MAJOR JSON mode/ReDoS/symlink/cross-platform, 9 MINOR, 1 TRIVIAL). Rejected framework suggestion. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2.9     | 2026-01-09 | CONSOLIDATION #9: Reviews #98-108 → CODE_PATTERNS.md v1.4 (18 patterns: 6 JS/TS, 4 Security, 3 CI/Automation, 3 Documentation, 2 General). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2.8     | 2026-01-09 | Review #108: Update Dependencies Protocol - new mandatory pattern for tightly-coupled docs. Added ⚠️ Update Dependencies to 4 key documents. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.7     | 2026-01-09 | Review #107: PR #224 Feedback - 2 items (SSR guard, status label) + process fix (/fetch-pr-feedback auto-invoke). Consolidation threshold reached (10 reviews). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2.6     | 2026-01-08 | Review #106: PR Review Processing - 16 items (8 MAJOR ReDoS/path-traversal/ID-parsing/validation/threshold-consistency, 6 MINOR env-metadata/FP-patterns/scope-clarity, 2 TRIVIAL). Session #40.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2.5     | 2026-01-08 | Review #105: PR Review Processing - 17 items (4 MAJOR ReDoS/JSONL/schema, 9 MINOR docs/patterns, 4 TRIVIAL). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.4     | 2026-01-08 | Review #104: PR Review Processing - 18 items (4 MAJOR security pattern/baselines/JSON metrics, 9 MINOR shell portability/INP metrics, 5 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2.3     | 2026-01-08 | Review #103: PR Review Processing - 10 items (2 MAJOR hasComplexityWarnings+getRepoStartDate, 5 MINOR JSON/docs, 3 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.2     | 2026-01-08 | Review #102: PR Review Processing - 19 items (1 MAJOR cognitive complexity refactor, 5 MINOR date validation/node: prefix/Number.parseInt/String.raw, 10 TRIVIAL code style). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2.1     | 2026-01-08 | Review #101: PR Review Processing - 36 items (12 Critical, 5 Major, 17 Minor, 2 Trivial). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2.0     | 2026-01-07 | CONSOLIDATION #8: Reviews #83-97 → CODE_PATTERNS.md v1.3 (6 Security Audit patterns, new category). Session #33 session-end cleanup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.99    | 2026-01-07 | Reviews #92-97: Security audit PR review feedback (6 reviews, 24 items total). Schema improvements: OWASP string→array, file_globs field, severity_normalization for divergent findings, F-010 conditional risk acceptance with dependencies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.93    | 2026-01-07 | Review #91: Audit traceability improvements (5 items) - 5 MINOR (severity_normalization field, adjudication field, F-010 severity in remediation, item count, log lines metric), 6 REJECTED (⚪ compliance items - doc-only PR, code fixes in Step 4B)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.92    | 2026-01-07 | Review #90: Security audit metadata fixes (7 items) - 5 MINOR (log lines metric, severity breakdown, secrets_management status, F-010 duplicate, Review #88 severity clarity), 1 TRIVIAL (hyphenation), 1 REJECTED (consolidation count)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.91    | 2026-01-07 | Review #89: Security audit documentation fixes (9 items) - 8 MINOR (F-010 severity, secrets_management status, duplicate model entry, SESSION_CONTEXT dates/status, active review range/count, progress percentage), 1 TRIVIAL (hyphenation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.90    | 2026-01-07 | Review #88: SECURITY AUDIT (Phase 4.2) - Multi-AI aggregated audit (Claude Opus 4.5 + ChatGPT 5.2), 10 canonical findings. Severity: S0 (1): F-001 Firestore bypass; S1 (2): F-002 rate-limiting, F-003 reCAPTCHA; S2 (6): F-004–F-009; S3 (1): F-010 risk-accepted. Overall: NON_COMPLIANT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.89    | 2026-01-07 | Review #87: Schema symmetry & markdown syntax (4 fixes) - 1 MAJOR (QUALITY_METRICS_JSON null schema), 3 MINOR (stray code fences in PROCESS/REFACTORING/DOCUMENTATION)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.88    | 2026-01-07 | Review #86: Qodo follow-up on Review #85 (3 fixes, 1 rejected) - 1 MINOR (broken link), 2 TRIVIAL (Bash-only clarity, copy-safe snippet), 1 REJECTED (duplicate pathspec separator)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.87    | 2026-01-07 | Review #84-85: Process quality improvements - #84: Review #83 follow-up (4 metadata fixes), #85: Qodo suggestions on Review #84 commit (3 fixes: git verification, threshold clarity, archive status)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.86    | 2026-01-07 | Review #83: Archive & Consolidation Metadata Fixes (5 fixes) - 1 REJECTED (false positive: #41 data loss), 1 MAJOR (broken links), 1 MINOR (status sync), 2 TRIVIAL (line count, wording)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.85    | 2026-01-07 | CONSOLIDATION #7: Reviews #73-82 → CODE_PATTERNS.md v1.2 (9 patterns: 3 Bash/Shell portability, 6 Documentation quality)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.84    | 2026-01-07 | ARCHIVE #2: Reviews #42-60 → REVIEWS_42-60.md (1048 lines removed, 2425→1377 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.83    | 2026-01-07 | Review #82: Post-commit review fixes (6 items) - 0 MAJOR, 5 MINOR (review range, Last Updated date, SECURITY.md path, markdown formatting, CANON-0032 status), 1 TRIVIAL (code fence), 1 HIGH-LEVEL (generator fix recommendation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.82    | 2026-01-07 | Review #81: Documentation linter fixes (57 errors) - 3 MAJOR (missing ARCHITECTURE.md/DEVELOPMENT.md links, missing Purpose in claude.md), 8 MINOR (broken links, missing sections), 4 TRIVIAL (date placeholders, metadata)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.81    | 2026-01-07 | Review #80: 3 fixes - 2 MINOR (PR_PLAN.json structured acceptance_tests, CANON-CODE.jsonl source identifiers), 1 TRIVIAL (document version sync)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.80    | 2026-01-06 | Review #79: 10 fixes, 1 rejected - 3 MAJOR (JSONL parser-breaking output in 3 templates), 4 MINOR (bash portability, JSON validity, path clarity, count accuracy), 3 TRIVIAL (metadata consistency) - rejected 1 suggestion contradicting established canonical format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.79    | 2026-01-06 | Review #78: 12 fixes - 2 MAJOR (invalid JSONL NO-REPO output, missing pipefail in validator), 7 MINOR (JSON placeholders, NO-REPO contract, markdown links, category count, model names, audit scope, last updated date), 3 TRIVIAL (review range, version history, model name consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.78    | 2026-01-06 | Review #77: 9 fixes - 2 MAJOR (shell script portability, broken relative links), 5 MINOR (invalid JSONL, severity scale, category example, version dates, review range), 2 TRIVIAL (environment fields, inline guidance)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.77    | 2026-01-06 | Review #76: 13 fixes - 3 MAJOR (model naming, broken link paths, PERFORMANCE doc links), 8 MINOR (SECURITY root cause evidence, shell exit codes, transitive closure, division-by-zero, NO-REPO contract, category enum, model standardization, vulnerability type), 2 TRIVIAL (version metadata, review range)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.76    | 2026-01-06 | Review #75: 17 fixes - 2 MAJOR (SECURITY schema category names, vulnerability deduplication), 8 MINOR (regex robustness, JSONL validation, deduplication rules, averaging methodology, model matrix, link paths), 2 TRIVIAL (version verification, duplicate check), 1 REJECTED (incorrect path suggestion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.75    | 2026-01-06 | Review #74: 18 fixes - 6 MAJOR (broken links, schema fields, deduplication clarity, observability, placeholders, GPT-4o capabilities), 9 MINOR (fail-fast, URL filtering, NO-REPO MODE, environment, methodology, output specs, links, alignment), 3 TRIVIAL (version, dates, context)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.74    | 2026-01-06 | Review #73: 9 fixes - 2 MAJOR (model name self-inconsistency, NO-REPO MODE clarity), 4 MINOR (chunk sizing, regex, JSONL validation, stack versions), 3 TRIVIAL (documentation consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.73    | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 → CODE_PATTERNS.md v1.1 (10 Documentation patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.72    | 2026-01-06 | Review #72: 21 fixes - 12 CRITICAL (broken links to JSONL_SCHEMA, GLOBAL_SECURITY_STANDARDS, SECURITY.md, EIGHT_PHASE_REFACTOR), 5 MAJOR (version/stack placeholders), 4 MINOR (paths, regex, commands)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.71    | 2026-01-06 | Review #71: Documentation improvements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.70    | 2026-01-06 | Review #70: Template refinements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.69    | 2026-01-06 | Review #69: Multi-AI audit plan setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.68    | 2026-01-06 | Review #68: 17 fixes - 4 MAJOR (App Check path, SonarQube remediation, function rename, review ordering), 10 MINOR (sorting, grep, versions, regex, ranges), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.67    | 2026-01-06 | Review #67: 14 fixes - 4 MAJOR (grep -E, deterministic IDs, App Check tracking, SonarQube tracking), 7 MINOR (verification, enums, paths, ordering), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.66    | 2026-01-05 | Review #66: 13 fixes - 4 MAJOR (evidence rules, output format, npm safety, apiKey guidance), 8 MINOR (counters, grep portability, YAML, model names), 1 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.65    | 2026-01-05 | Review #65: 19 fixes - 4 MAJOR (security doc hardening, deterministic CANON IDs), 10 MINOR (paths, assertions, category names), 5 TRIVIAL (model names)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.64    | 2026-01-05 | Review #64: 31 fixes - 6 MAJOR (security pseudocode, Firebase key clarity, grep hardening), 8 MINOR (progress calc, paths), 17 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.63    | 2026-01-05 | Review #63: 15 fixes total - 7 broken relative paths, 8 minor improvements (version entries, secrets example, tier notes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.62    | 2026-01-05 | Review #62: 10 fixes - 1 CRITICAL (client-side credentials), 4 MAJOR (schema, links, model), 5 MINOR/TRIVIAL (2 Minor, 3 Trivial)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.61    | 2026-01-05 | Review #61: Stale review assessment, path prefix fix, terminology update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.60    | 2026-01-05 | CONSOLIDATION #5: Reviews #51-60 → claude.md v2.9 (10 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.59    | 2026-01-05 | Review #60: Document sync, grep exclusion fix, CANON-ID guidance, duplicate link removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.58    | 2026-01-05 | Review #59: Prompt schema improvements, grep --exclude, Quick Start section, link text consistency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.57    | 2026-01-05 | Review #58: Template compliance (MULTI_AI_REFACTOR_AUDIT_PROMPT.md), link format consistency, American English                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.56    | 2026-01-05 | Review #57: CI fix (broken stub links), effort estimate arithmetic, optional artifact semantics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.55    | 2026-01-05 | Review #56: Effort estimate correction, remaining code fences, stub path references (PARTIAL FIX - see #57)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.54    | 2026-01-05 | Review #55: Nested code fence fixes, artifact naming, acceptance criteria, schema references                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.53    | 2026-01-05 | Review #54: Step 4B + SLASH_COMMANDS.md, broken archive links, code fence escaping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.52    | 2026-01-05 | Review #53: CI fix, regex bounding, path.relative() security                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.51    | 2026-01-05 | Review #52: Document health/archival fixes from Qodo/CodeRabbit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.50    | 2026-01-04 | RESTRUCTURE: Tiered access model, Reviews #1-40 archived (3544→~1000 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.49    | 2026-01-04 | Review #51: ESLint audit follow-up, infinite loop fix, regex hardening                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.48    | 2026-01-04 | EFFECTIVENESS AUDIT: Fixed 26→0 violations in critical files; patterns:check now blocking                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.47    | 2026-01-04 | CONSOLIDATION #4: Reviews #41-50 → claude.md v2.8 (12 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.46    | 2026-01-04 | Review #50: Audit trails, label auto-creation, .env multi-segment, biome-ignore                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.45    | 2026-01-04 | Review #49: Workflow hardening, robust module detection, dead code removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.44    | 2026-01-04 | Review #48: Security hardening, OSC escapes, fail-closed realpath, pathspec fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.43    | 2026-01-04 | Review #47: PII masking, sensitive dirs, printf workflow, fault-tolerant labels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.42    | 2026-01-04 | Review #46: Symlink protection, realpath hardening, buffer overflow, jq/awk fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.41    | 2026-01-04 | Review #45: TOCTOU fix, error.message handling, path containment, tier matching, PR spam                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.40    | 2026-01-03 | CONSOLIDATION #3: Reviews #31-40 → claude.md v2.7 (14 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

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
| **3**  | Active Reviews (#137-183)                                                                                                  | Deep investigation            | ~1200 lines |
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

**Reviews since last consolidation:** 0 **Consolidation threshold:** 10 reviews
**Status:** ✅ Current **Next consolidation due:** After Review #195

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

- **Date:** 2026-01-20 (Session #69+)
- **Reviews consolidated:** #144-#153 (10 reviews)
- **Patterns added to CODE_PATTERNS.md v1.8:**
  - **React/Frontend (11 patterns, NEW SECTION):**
    - Accessible toggle switches (button + role=switch)
    - Local date extraction (getFullYear not toISOString)
    - Preference spread on update
    - useEffect state dependency issues
    - Firestore Timestamp handling (.toDate())
    - Module-level init flags (Strict Mode)
    - Async cleanup pattern (isCancelled)
    - useMemo for derived data
    - Null guards at render boundary
    - finally for state cleanup
    - Error user-facing messages (generic)
  - **Security (12 patterns):**
    - URL protocol allowlist
    - Regex length limits (ReDoS prevention)
    - Email regex RFC 5321 ({1,64}@{1,253}.{2,63})
    - Large input guards
    - Sanitizer whitespace handling
    - Nullable utility types
    - Firebase defineString (not process.env)
    - Prettier-linter conflict resolution
    - Force token refresh (getIdTokenResult)
    - Dev data client-only Firestore rules

<details>
<summary>Previous Consolidation (#11)</summary>

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

</details>

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

### Archive 4: Reviews #101-136

- **Archive location:**
  [docs/archive/REVIEWS_101-136.md](./archive/REVIEWS_101-136.md)
- **Coverage:** 2026-01-08 to 2026-01-13
- **Status:** Reviews #101-136 archived (audit trail preserved).
- **Consolidation note:** See CODE_PATTERNS.md for consolidated patterns (latest
  as of 2026-01-18: v2.0 - CONSOLIDATION #13).

Access archives only for historical investigation of specific patterns.

---

## Active Reviews (Tier 3)

Reviews #137-183 are actively maintained below. Older reviews (#101-136) are in
Archive 4.

---

#### Review #192: PR Documentation Lint + Qodo Suggestions (2026-01-21)

**Source:** CI Documentation Linter + Qodo Code Review **PR/Branch:**
claude/audit-copilot-expansion-work-session88 **Suggestions:** 6 total
(Critical: 1, Major: 2, Minor: 3, Trivial: 0)

**Patterns Identified:**

1. **Documentation Linting**: SESSION_DECISIONS.md missing required sections
   - Root cause: Document created without proper structure/frontmatter
   - Prevention: Follow Tier 2 doc template (Purpose + Version History + AI
     Instructions + Quick Start)

2. **Static Audit Reports Anti-Pattern**: Committing SonarCloud snapshots
   - Root cause: Audit reports hardcoded instead of using live dashboard
   - Prevention: Use SonarCloud dashboard + issue tracker, not static markdown
     files

3. **Sensitive IDE Configuration**: User-specific settings in shared
   .vscode/settings.json
   - Root cause: IDE-specific config committed to shared workspace settings
   - Prevention: Keep user settings in .vscode/settings.json, not shared config

**Resolution:**

- Fixed: 6 items
  - CRITICAL: Added Purpose, AI Instructions, Quick Start sections to
    SESSION_DECISIONS.md (CI blocker resolved)
  - MAJOR: Removed static audit report
    `docs/audits/sonarcloud-snapshots/20260119.md`
  - MAJOR: Removed sensitive `sonarlint.connectedMode.project` from
    `.vscode/settings.json`
  - MINOR: Fixed "Last Updated" date format in SESSION_DECISIONS.md (2026-01-21)
  - MINOR: All structural improvements included in SESSION_DECISIONS.md fixes
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- Tier 2 documentation requires specific structural sections for CI linting
  (Purpose, AI Instructions, Quick Start, Version History)
- Static audit reports create maintenance debt and duplication - prefer live
  dashboards and issue trackers
- IDE connection configurations are user-specific and should not be committed to
  shared workspace settings
- Document date formats should be actual dates (YYYY-MM-DD), not placeholder
  strings

- Fixed: 6 items (1 Critical CI blocker, 2 Major, 3 Minor)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- Tier 2 documentation requires Purpose, Version History, AI Instructions, Quick
  Start sections
- Static audit reports should never be committed - use live dashboards instead
- IDE user-specific settings (like SonarLint connection) should be gitignored

**Files Modified:**

- docs/SESSION_DECISIONS.md - Added missing sections, fixed date format
- docs/audits/sonarcloud-snapshots/20260119.md - DELETED (anti-pattern)
- .vscode/settings.json - Removed sensitive SonarLint config

---

#### Review #183: SonarCloud Sprint PR 2 - Critical Issues Partial (2026-01-19)

**Source:** SonarCloud Sprint Plan + Code Quality Analysis **PR/Branch:**
claude/enhance-sonarcloud-report-3lp4i (PR #284 continued) **Issues Fixed:** ~20
(6 rules across 7 files)

**Summary:** High-impact critical issues including cognitive complexity
refactoring of the two worst offenders (complexity 42 and 34), void operator
removal, and mutable export fixes.

**Issues Fixed:**

| #   | Issue                              | Severity | Category   | Fix                                                                        |
| --- | ---------------------------------- | -------- | ---------- | -------------------------------------------------------------------------- |
| 1   | S3776: cleanupOrphanedStorageFiles | Critical | Complexity | Extract 4 helpers (processStorageFile, isFileOlderThan, etc.)              |
| 2   | S3776: hardDeleteSoftDeletedUsers  | Critical | Complexity | Extract 3 helpers (performHardDeleteForUser, deleteUserStorageFiles, etc.) |
| 3   | S3735: void operator (12x)         | Critical | Code Smell | Remove `void` prefix from async calls in 4 files                           |
| 4   | S6861: mutable let exports (3x)    | Critical | Code Smell | Refactor to factory function in lib/firebase.ts                            |
| 5   | S2871: sort without compare        | Critical | Bug        | Add localeCompare to .sort() in sync-geocache.ts                           |

**Patterns Identified:**

1. **Cognitive complexity in job functions**: Background jobs accumulate
   complexity due to pagination loops, nested try/catch, and inline error
   handling
2. **Void operator pattern**: `void asyncFunction()` used to ignore promise
   returns in React hooks - can be safely removed
3. **Mutable exports for SSR**: `let app; let auth; let db;` pattern should use
   factory function returning const destructured values

**Fix Techniques:**

| Rule  | Technique                     | Example                                                 |
| ----- | ----------------------------- | ------------------------------------------------------- |
| S3776 | Extract helper functions      | `processStorageFile()`, `performHardDeleteForUser()`    |
| S3735 | Remove void operator          | `void loadLinks()` → `loadLinks()`                      |
| S6861 | Factory function for init     | `const { app, auth, db } = initializeFirebaseExports()` |
| S2871 | Add explicit compare function | `.sort()` → `.sort((a, b) => a.localeCompare(b))`       |

**Key Learnings:**

- Each helper function should do one thing; names should describe the
  check/action
- Firebase job functions grow organically without refactoring - set complexity
  alerts
- `void promise` is often unnecessary if the function handles its own errors

**Deferred:** ~90 issues (S3776: 80 remaining complexity, S2004: 5 nested
functions, S2871: 3 sort comparisons)

#### Review #184: PR #286 SonarCloud + Qodo Combined Review (2026-01-19)

**Source:** SonarCloud PR API + Qodo PR Compliance + Qodo Code Suggestions
**PR/Branch:** claude/enhance-sonarcloud-report-3lp4i (PR #286) **Suggestions:**
32 total (Critical: 3, Hotspots: 2, Major: 16, Minor: 11)

**Issues Fixed:**

| #   | Issue                                   | Severity | File                               | Fix                                            |
| --- | --------------------------------------- | -------- | ---------------------------------- | ---------------------------------------------- |
| 1   | S3776: findPatternMatches complexity 16 | Critical | check-pattern-compliance.js:606    | Create new RegExp to avoid shared state        |
| 2   | Non-global regex infinite loop          | Critical | security-check.js:154              | Add non-global regex handling                  |
| 3   | PII: clientIp in logs                   | Critical | security-wrapper.ts:129            | Hash IP address before logging                 |
| 4   | S5852: ReDoS in path cleanup            | Hotspot  | phase-complete-check.js:191        | Simplify regex, limit input length             |
| 5   | S5852: ReDoS in time parsing            | Hotspot  | meetings/all/page.tsx:212          | Mark as safe (linear pattern)                  |
| 6   | S5843: Regex complexity 21              | Major    | check-pattern-compliance.js:406    | Split pathExclude into array                   |
| 7   | S3358: Nested ternary                   | Major    | validate-audit.js:187              | Extract to helper function                     |
| 8   | S2301: Boolean method flag              | Major    | users-tab.tsx:381,388              | REJECTED: Simple return functions, not actions |
| 9   | S3358: Nested ternary                   | Major    | entry-card.tsx:110                 | Extract getStatusIcon helper                   |
| 10  | Interpolated Firestore path             | Major    | jobs.ts:80                         | Use .collection().doc().collection()           |
| 11  | Skip unknown rules                      | Major    | verify-sonar-phase.js:194          | Continue if extractedRule is null              |
| 12  | Parse headers with colons               | Major    | verify-sonar-phase.js:219          | Update regex with anchors                      |
| 13  | Empty table cells                       | Major    | update-readme-status.js:187        | Use slice instead of filter                    |
| 14  | getPreviousPrivilegeType error          | Major    | admin.ts:311                       | Add try-catch wrapper                          |
| 15  | Shared regex state mutation             | Major    | check-pattern-compliance.js:606    | Create new RegExp instance                     |
| 16  | Empty reviews check                     | Major    | run-consolidation.js:425           | Add length check before Math.max               |
| 17  | JSON parse error                        | Major    | check-review-needed.js:383         | Add try-catch for json()                       |
| 18  | Missing thresholds crash                | Major    | check-review-needed.js:922         | Add optional chaining                          |
| 19  | Validate userId path traversal          | Major    | jobs.ts:45                         | Add . and .. checks, regex validation          |
| 20  | Silent error in buildUserSearchResult   | Major    | admin.ts:81                        | Add console.warn for debugging                 |
| 21  | S7781: Use replaceAll                   | Minor    | update-readme-status.js:153        | Already using replaceAll, fix regex            |
| 22  | S7781: Simplify regex                   | Minor    | phase-complete-check.js:185        | Use string literal                             |
| 23  | S7781: Simplify CRLF regex              | Minor    | run-consolidation.js:484           | Use string literal                             |
| 24  | S7778: Multiple push                    | Minor    | generate-documentation-index.js    | Use spread in single push                      |
| 25  | Malformed href guard                    | Minor    | generate-documentation-index.js:51 | Add null/type check                            |
| 26  | False missing-value arg                 | Minor    | add-false-positive.js:268          | Check undefined instead of startsWith          |
| 27  | Duplicate ID error context              | Minor    | normalize-canon-ids.js:245         | Include filename in error message              |

**Patterns Identified:**

1. **Shared regex state mutation**: Reusing `antiPattern.pattern.lastIndex`
   across calls creates subtle bugs - always create new RegExp instances
2. **PII in security logs**: Even "internal only" logs may be exposed;
   hash/redact IPs before logging
3. **Non-global regex in loops**: `while (regex.exec())` infinite loops if regex
   lacks /g flag - handle separately
4. **Empty array edge cases**: `Math.max(...[])` returns -Infinity; always guard
   against empty inputs

**Key Learnings:**

- SonarCloud catches shared state issues human reviewers miss
- Qodo excels at defensive programming suggestions (null guards, error handling)
- Security hotspots for ReDoS often false positives for simple patterns
- Boolean method flags (S2301) appropriate for simple return functions

**Resolution:**

- Fixed: 27 items
- Rejected: 1 item (S2301 for simple getter functions)
- Deferred: 0 items

---

#### Review #186: PR #287 Qodo + SonarCloud Follow-up (2026-01-20)

**Source:** Qodo PR Code Suggestions + SonarCloud Security Hotspots
**PR/Branch:** claude/new-session-Qy21d (PR #287) **Suggestions:** 12 total
(Major: 3, Minor: 6, Trivial: 2, Deferred: 1)

**Issues Fixed:**

| #   | Issue                           | Severity | File                        | Fix                                   |
| --- | ------------------------------- | -------- | --------------------------- | ------------------------------------- | ---------- | --- |
| 1   | S5852: ReDoS in separator regex | Major    | update-readme-status.js:189 | Replace `[-                           | ]+`with`[- | ]+` |
| 2   | S5852: ReDoS in path cleanup    | Major    | phase-complete-check.js:194 | FALSE POSITIVE - char class is linear |
| 3   | S5852: ReDoS in time parsing    | Major    | page.tsx:217                | FALSE POSITIVE - already documented   |
| 4   | Validate empty milestone names  | Minor    | update-readme-status.js:205 | Add empty name check with warning     |
| 5   | Throw error for unknown args    | Minor    | add-false-positive.js:276   | Add unknown argument validation       |
| 6   | Enable Sentry for hashed IP     | Minor    | security-wrapper.ts:132     | Set captureToSentry: true             |
| 7   | Log refresh callback errors     | Minor    | use-tab-refresh.ts:68       | Add console.error for debugging       |
| 8   | Use relative path on error      | Minor    | check-docs-light.js:457     | Use relative() for consistency        |
| 9   | Filter string evidence only     | Minor    | validate-audit.js:200       | Filter instead of stringify           |
| 10  | Log file AND skill in suffix    | Trivial  | log-session-activity.js:454 | Concatenate both args                 |
| 11  | Refactor duplicated exclusion   | Trivial  | check-pattern-compliance.js | OBSERVATION ONLY - no code change     |

**Patterns Identified:**

1. **ReDoS false positives in simple patterns**: Character classes like `[xyz]+`
   are linear - SonarCloud flags them but they're safe
2. **Input validation gaps**: Empty/missing input validation prevents confusing
   downstream errors
3. **Anonymized data can be sent to third parties**: Once PII is hashed, it's
   safe for external services

**Key Learnings:**

- SonarCloud S5852 often flags linear patterns - verify before fixing
- Defensive validation (empty names, unknown args) improves error messages
- Hashed IP addresses are no longer PII and can be sent to Sentry

**Resolution:**

- Fixed: 9 items
- Rejected: 2 items (S5852 false positives already documented)
- Deferred: 1 item (helper modularization - architectural refactoring)

---

#### Review #187: Cherry-Pick PR Qodo Compliance Review (2026-01-20)

**Source:** Qodo PR Compliance + Qodo PR Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-pr-review-NlFAz **Suggestions:** 20 total (Critical:
0, Major: 6, Minor: 11, Trivial: 3)

**Issues Fixed:**

| #   | Issue                              | Severity | File                         | Fix                                      |
| --- | ---------------------------------- | -------- | ---------------------------- | ---------------------------------------- |
| 1   | Non-global regex misses matches    | Major    | security-check.js:154        | Always add 'g' flag if missing           |
| 2   | Sync errors escape Promise.resolve | Major    | use-tab-refresh.ts:68        | Wrap onRefresh() in .then() block        |
| 3   | Hashed IP sent to Sentry           | Major    | security-wrapper.ts:132      | Revert to captureToSentry: false         |
| 4   | Raw attemptedUserId in logs        | Major    | security-wrapper.ts:266      | Hash userId before logging               |
| 5   | statSync follows symlinks          | Major    | validate-canon-schema.js:385 | Use lstatSync + skip symlinks            |
| 6   | Sensitive String(error) logged     | Major    | admin.ts:2521                | Log error type/code, not raw message     |
| 7   | Multi-column separator regex       | Minor    | update-readme-status.js:190  | Handle tables with multiple columns      |
| 8   | Unhandled duplicate error          | Minor    | normalize-canon-ids.js:304   | Wrap processFileForMapping in try/catch  |
| 9   | Windows path backslash             | Minor    | check-docs-light.js:127      | Normalize path separators                |
| 10  | Crash on non-string d.path         | Minor    | phase-complete-check.js:183  | Add typeof guard                         |
| 11  | Crash on failed cross-ref          | Minor    | archive-doc.js:527           | Check refResult.success before accessing |
| 12  | Malformed API payload crash        | Minor    | check-review-needed.js:268   | Guard with Array.isArray                 |
| 13  | JSONL read error handling          | Minor    | normalize-canon-ids.js:215   | Use instanceof Error for message         |
| 14  | Unbounded regex input              | Minor    | validate-audit.js:196        | Cap text length at 50K                   |
| 15  | Unexpected args silently ignored   | Minor    | add-false-positive.js:282    | Throw on unexpected positional args      |
| 16  | Truthy isSoftDeleted check         | Minor    | use-journal.ts:174           | Use strict === true comparison           |
| 17  | Duplicate bucket indices           | Minor    | aggregate-audit-findings.js  | Check last element before push           |
| 18  | Log uses args instead of eventData | Trivial  | log-session-activity.js:455  | Use processed eventData values           |
| 19  | parseInt without radix             | Trivial  | check-docs-light.js:90       | Add radix 10 to parseInt                 |
| 20  | Swallowed errors in searchByEmail  | Trivial  | admin.ts:139                 | Add debug logging for non-user-not-found |

**Patterns Identified:**

1. **Global regex flag for scanning**: When iterating all matches with exec(),
   patterns without /g flag cause infinite loops or miss occurrences
2. **Promise.resolve for sync errors**: Wrapping in .then() catches both sync
   and async errors in the same chain
3. **IP hash still privacy-sensitive**: Even hashed identifiers shouldn't go to
   third parties
4. **lstatSync for symlink detection**: statSync follows symlinks, potentially
   escaping project boundaries
5. **Error type over message**: Log error.name/error.code, not error.message
   which may contain sensitive paths

**Key Learnings:**

- Security scanners must detect ALL matches - non-global regex is a critical bug
- Use `Promise.resolve().then(() => fn())` pattern to catch sync exceptions
- Even anonymized data should stay out of third-party services (privacy best
  practice)
- symlink traversal is a real security concern for file processing scripts
- Error messages may contain API keys, paths, or PII - log type/code only

**Resolution:**

- Fixed: 20 items
- Rejected: 0 items
- Deferred: 0 items

---

#### Review #188: Cherry-Pick PR Qodo Follow-up Review (2026-01-20)

**Source:** Qodo PR Code Suggestions (Follow-up) **PR/Branch:**
claude/cherry-pick-commits-pr-review-NlFAz **Suggestions:** 8 total (Critical:
0, Major: 1, Minor: 5, Trivial: 1, Rejected: 1)

**Issues Fixed:**

| #   | Issue                         | Severity | File                        | Fix                                    |
| --- | ----------------------------- | -------- | --------------------------- | -------------------------------------- | --------- |
| 1   | Non-string file path crash    | Major    | validate-audit.js:312       | Add typeof check before string methods |
| 2   | Exclude regex state mutation  | Minor    | check-pattern-compliance.js | Clone exclude regex before use         |
| 3   | Missing trailing pipe parsing | Minor    | update-readme-status.js:187 | Handle optional trailing               | in tables |
| 4   | Array dedup unreliable        | Minor    | aggregate-audit-findings.js | Use Set for true deduplication         |
| 5   | API count coercion            | Minor    | check-review-needed.js:267  | Safely coerce counts to numbers        |
| 6   | --key=value syntax rejected   | Minor    | add-false-positive.js:282   | Support equals-style CLI flags         |
| 7   | Unknown event types logged    | Trivial  | log-session-activity.js:374 | Add event type allowlist validation    |

**Rejected Items:**

| #   | Issue                          | Reason                                                     |
| --- | ------------------------------ | ---------------------------------------------------------- |
| 1   | Block whitespace-only searches | FALSE POSITIVE: Check already exists at admin.ts:1020-1022 |

**Patterns Identified:**

1. **Type guards before string methods**: Always check `typeof x === "string"`
   before calling `.includes()`, `.trim()`, etc. on values from external sources
2. **Stateful regex cloning**: Clone both pattern AND exclude regexes when
   testing multiple matches to prevent state leakage from g/y flags
3. **Set for deduplication**: Use Set instead of array-based adjacent dedup for
   reliable uniqueness guarantees
4. **CLI argument flexibility**: Support both `--key value` and `--key=value`
   syntax for better UX

**Key Learnings:**

- Qodo can flag issues that are already handled elsewhere - always verify with
  code
- Adjacent-only deduplication (`arr[arr.length-1] !== value`) doesn't prevent
  non-adjacent duplicates
- API responses may return numbers as strings - use explicit coercion
- Event type allowlists prevent malformed log entries and improve error messages

**Resolution:**

- Fixed: 7 items
- Rejected: 1 item (false positive - check exists)
- Deferred: 0 items

---

#### Review #189: Cherry-Pick PR Qodo Second Follow-up (2026-01-20)

**Source:** Qodo PR Code Suggestions (Second Follow-up) **PR/Branch:**
claude/cherry-pick-commits-pr-review-NlFAz **Suggestions:** 11 total (Critical:
1, Major: 2, Minor: 5, Trivial: 2, Rejected: 1)

**Issues Fixed:**

| #   | Issue                           | Severity | File                            | Fix                                       |
| --- | ------------------------------- | -------- | ------------------------------- | ----------------------------------------- |
| 1   | Set iteration bug (Review #188) | Critical | aggregate-audit-findings.js:756 | Convert Set to Array before iteration     |
| 2   | Exclude regex state leak        | Major    | check-pattern-compliance.js:644 | Reset exclude.lastIndex before test       |
| 3   | CRLF line number mismatch       | Major    | security-check.js:154           | Normalize CRLF to LF before scanning      |
| 4   | Timestamp.toDate() crash        | Minor    | admin.ts:88                     | Guard with typeof .toDate === "function"  |
| 5   | Non-string href crash           | Minor    | generate-documentation-index.js | Add typeof href !== "string" check        |
| 6   | Folder boundary false match     | Minor    | check-docs-light.js:100         | Enforce trailing / in folder patterns     |
| 7   | Error handler crash             | Minor    | normalize-canon-ids.js:284      | Use instanceof Error for message access   |
| 8   | Hotspot count as string         | Minor    | check-review-needed.js:299      | Coerce paging.total to number             |
| 9   | Redundant prefix search         | Trivial  | admin.ts:163                    | Skip prefix if exact match fills limit    |
| 10  | Inconsistent bulk entry shape   | Trivial  | verify-sonar-phase.js:239       | Add file: "\*", line: "N/A" to bulk fixes |

**Rejected Items:**

| #   | Issue                          | Reason                                                 |
| --- | ------------------------------ | ------------------------------------------------------ |
| 1   | "PR is unnecessary complexity" | REJECTED: Intentional SonarCloud S3776 compliance work |

**Patterns Identified:**

1. **Set vs Array iteration**: When changing from Array to Set for
   deduplication, update all consumers that use `.length` or `[index]` access to
   `Array.from()` first
2. **Regex lastIndex reset**: Always reset `.lastIndex = 0` before calling
   `.test()` on a regex that may be global (g flag) or sticky (y flag)
3. **Cross-platform line endings**: Normalize `\r\n` to `\n` before line-based
   regex scans to ensure accurate line number calculations on Windows files
4. **Firestore Timestamp safety**: Always check
   `typeof x?.toDate === "function"` before calling `.toDate()` on potentially
   non-Timestamp values

**Key Learnings:**

- Changing data structures (Array→Set) has ripple effects on iteration code
- Regex with g/y flags maintain state between calls - reset before each use
- Windows files processed on Unix (or vice versa) can have mismatched line
  endings
- Firestore timestamps may be null, undefined, or even plain objects in edge
  cases

**Resolution:**

- Fixed: 10 items
- Rejected: 1 item (high-level PR criticism - intentional work)
- Deferred: 0 items

---

#### Review #190: Cherry-Pick PR Qodo Third Follow-up (2026-01-20)

**Source:** Qodo PR Code Suggestions (Third Follow-up) **PR/Branch:**
claude/cherry-pick-commits-pr-review-NlFAz **Suggestions:** 10 total (Security:
3, Major: 5, Minor: 2, Rejected: 0)

**Issues Fixed:**

| #   | Issue                             | Severity | File                        | Fix                                            |
| --- | --------------------------------- | -------- | --------------------------- | ---------------------------------------------- |
| 1   | Symlink traversal in file args    | Security | check-docs-light.js:552     | Use lstatSync + realpathSync for symlink check |
| 2   | Symlink traversal in deliverables | Security | phase-complete-check.js:207 | Block symlinked paths with lstatSync           |
| 3   | Symlink traversal in archive scan | Security | archive-doc.js:282          | Skip symlinks in getMarkdownFiles              |
| 4   | Non-deterministic merge order     | Major    | aggregate-audit-findings.js | Sort indices for deterministic merge order     |
| 5   | Bulk fix conflict detection       | Major    | verify-sonar-phase.js:245   | Detect bulk fix vs dismissal conflicts         |
| 6   | Timestamp conversion safety       | Major    | admin.ts:69                 | Extract safeToIso helper function              |
| 7   | Windows path detection            | Major    | check-pattern-compliance.js | Normalize backslashes for .husky detection     |
| 8   | Inconsistent line lookup          | Major    | security-check.js:155       | Use normalizedLines from normalizedContent     |
| 9   | Magic number timer delay          | Minor    | use-daily-quote.ts:26       | Extract MIDNIGHT_REFRESH_DELAY_SECONDS const   |
| 10  | Segment-based archive detection   | Minor    | archive-doc.js:509          | Use path segments to detect archive folder     |

**Patterns Identified:**

1. **Symlink traversal protection**: Use `lstatSync()` before `statSync()` to
   detect symlinks, then verify target is within allowed directory with
   `realpathSync()` and `path.relative()`
2. **Deterministic Set iteration**: When converting Set to Array for iteration,
   sort the result to ensure deterministic order across runs
3. **Bulk fix conflict detection**: Bulk fixes (rule-level) should check for
   conflicts with individual dismissals for the same rule
4. **Helper extraction for safety**: Extract safety-critical patterns (like
   timestamp conversion) into helpers to ensure consistent application

**Key Learnings:**

- Symlink attacks can bypass path traversal checks - always use lstatSync first
- Set iteration order is undefined in JS - sort after Array.from() for
  reproducibility
- Bulk operations need to validate against individual entries to prevent
  conflicts
- Magic numbers should be named constants for clarity and maintainability

**Resolution:**

- Fixed: 10 items
- Rejected: 0 items
- Deferred: 0 items

---

#### Review #191: Encrypted Secrets PR CI + Qodo Compliance (2026-01-21)

**Source:** CI Pattern Compliance + Qodo PR Suggestions (2 rounds)
**PR/Branch:** claude/review-cherry-pick-commits-RBG4e **Suggestions:** 17 total
(Round 1: 10, Round 2: 7)

**Issues Fixed (Round 1 - CI Pattern Compliance):**

| #   | Issue                           | Severity | File                   | Fix                                                    |
| --- | ------------------------------- | -------- | ---------------------- | ------------------------------------------------------ |
| 1   | Passphrase echo exposure        | Major    | encrypt/decrypt-\*.js  | Use process.stdin.setRawMode for hidden input          |
| 2   | .env.local insecure permissions | Major    | decrypt-secrets.js     | fs.chmodSync(path, 0o600) after write                  |
| 3   | .encrypted insecure permissions | Major    | encrypt-secrets.js     | fs.chmodSync(path, 0o600) after write                  |
| 4   | Unsafe error.message access     | Minor    | decrypt-secrets.js:59  | error instanceof Error ? error.message : String(error) |
| 5   | Unsafe error.message access     | Minor    | decrypt-secrets.js:167 | error instanceof Error ? error.message : String(error) |
| 6   | Unsanitized error logging       | Minor    | decrypt-secrets.js:172 | Sanitize with instanceof check                         |
| 7   | Unsanitized error logging       | Minor    | encrypt-secrets.js:123 | Sanitize with instanceof check                         |
| 8   | readFileSync without try/catch  | Minor    | decrypt-secrets.js:121 | Wrap in try/catch                                      |
| 9   | readFileSync without try/catch  | Minor    | decrypt-secrets.js:132 | Wrap in try/catch                                      |
| 10  | readFileSync without try/catch  | Minor    | encrypt-secrets.js:80  | Wrap in try/catch                                      |

**Issues Fixed (Round 2 - Qodo Security Compliance):**

| #   | Issue                       | Severity | File                | Fix                                              |
| --- | --------------------------- | -------- | ------------------- | ------------------------------------------------ |
| 11  | Buffer length validation    | Major    | decrypt-secrets.js  | Check minimum length before slicing              |
| 12  | Atomic file write race      | Major    | decrypt-secrets.js  | Use temp file + rename for atomic write          |
| 13  | Terminal state cleanup      | Major    | encrypt/decrypt-\*  | Add cleanup() function for raw mode handler      |
| 14  | Passphrase in shell history | Minor    | session-begin SKILL | Use --stdin pipe instead of env var              |
| 15  | Placeholder token detection | Minor    | session-start.js    | looksLikeRealToken() checks for common templates |
| 16  | EOF handling (Ctrl+D)       | Minor    | encrypt/decrypt-\*  | Handle \\u0004 in raw mode                       |
| 17  | Atomic encrypted write      | Minor    | encrypt-secrets.js  | Use temp file + rename for atomic write          |

**Patterns Identified:**

1. **Hidden passphrase input**: readline.question() echoes input - use
   process.stdin.setRawMode(true) for secure password entry
2. **Secure file permissions**: Secrets files should have 0600 permissions to
   prevent other users from reading
3. **Atomic file writes**: Use temp file + rename to prevent race conditions on
   permissions
4. **Buffer validation**: Always validate buffer length before slicing to
   prevent confusing errors on corrupt files
5. **Terminal state cleanup**: Always restore terminal state on exit, including
   Ctrl+C and Ctrl+D
6. **Placeholder detection**: Check for common placeholder patterns like
   "your\_", "\_here", "example", "xxx", etc.

**Key Learnings:**

- Node.js readline doesn't hide input by default - need raw mode for passwords
- fs.writeFileSync doesn't set restrictive permissions - use temp+rename pattern
- Pattern compliance catches issues that linters miss
- Shell history exposure: prefer --stdin over env var for sensitive values
- Always validate input buffers before crypto operations

**Resolution:**

- Fixed: 17 items (Round 1: 10, Round 2: 7)
- Rejected: 0 items
- Deferred: 0 items

---

#### Review #182: SonarCloud Sprint PR 1 - Mechanical Fixes (2026-01-19)

**Source:** SonarCloud Sprint Plan + Automated Analysis **PR/Branch:**
claude/enhance-sonarcloud-report-3lp4i (PR #284) **Issues Fixed:** 186 (8 rules
across 48 files)

**Summary:** All mechanical/automatable SonarCloud issues including Node.js
import conventions and shell script best practices.

**Issues Fixed:**

| #   | Issue                        | Severity | Category     | Fix                                  |
| --- | ---------------------------- | -------- | ------------ | ------------------------------------ |
| 1   | S7772: Missing node: prefix  | Minor    | Node.js      | Add `node:` prefix to 117 imports    |
| 2   | S7688: Legacy `[` syntax     | Major    | Shell Script | Convert to `[[` in 10 shell scripts  |
| 3   | S7682: Missing return        | Major    | Shell Script | Add explicit `return 0` to functions |
| 4   | S7677: Errors to stdout      | Major    | Shell Script | Redirect to stderr with `>&2`        |
| 5   | S1192: Repeated literals     | Minor    | Shell Script | Define `readonly` constants          |
| 6   | S131: Missing default case   | Major    | Shell Script | Add `*) ;; # default case`           |
| 7   | S7679: Raw positional params | Minor    | Shell Script | Assign to locals: `local input="$1"` |

**Patterns Identified:**

1. **Node.js import inconsistency**: Mixed `require('fs')` and
   `require('node:fs')` with no established convention - 117 issues across 40
   files
2. **Shell script modernization**: Legacy `[ ]` syntax, missing returns,
   inconsistent error handling - 73 issues across 10 shell scripts
3. **Repeated string literals**: Same strings repeated instead of constants - 4
   issues

**Secondary Learnings (from PR Review #181):**

1. **SonarCloud fixes can introduce bugs**: `[ ]` to `[[ ]]` conversion
   introduced `[[[` typo caught by pattern compliance
2. **ESM namespace imports**: Use `import * as fs from 'node:fs'` not
   `import fs`
3. **Path containment patterns**: Use regex `/^\.\.(?:[\\/]|$)/.test(relative)`
   instead of simple `.startsWith('..')`
4. **Shell variable order**: With `set -u`, variables must be defined before use

**Fix Techniques:**

| Rule  | Technique                     | Example                                |
| ----- | ----------------------------- | -------------------------------------- |
| S7772 | Add `node:` prefix            | `require('fs')` → `require('node:fs')` |
| S7688 | Use `[[` for tests            | `[ -z "$var" ]` → `[[ -z "$var" ]]`    |
| S7682 | Add explicit return           | Add `return 0` at function end         |
| S7677 | Redirect errors to stderr     | `echo "Error"` → `echo "Error" >&2`    |
| S1192 | Define constants for literals | `readonly SEPARATOR="━━━"`             |

**Key Learnings:**

- Run syntax validation after batch find-replace operations
- Node.js built-ins need namespace imports in ESM (`import * as fs`)
- Path security checks need robust regex patterns, not simple string methods
- Shell variable order matters with strict mode (`set -u`)

**Metrics:** 186 issues fixed, 48 files modified, 8 rules addressed, 0 false
positives

---

#### Review #181: PR #284 SonarCloud Cleanup CI Compliance (2026-01-19)

**Source:** Qodo Compliance + CI Pattern Check + Qodo PR Suggestions
**PR/Branch:** claude/enhance-sonarcloud-report-3lp4i (PR #284) **Suggestions:**
33 total (Critical: 4, Major: 18, Minor: 9, Trivial: 1, Rejected: 1)

**Issues Fixed:**

| #   | Issue                              | Severity | Category      | Fix                                                        |
| --- | ---------------------------------- | -------- | ------------- | ---------------------------------------------------------- |
| 1   | Bash syntax `[ ... ]]` error       | Critical | Shell Script  | Unified to `[[ ... ]]` syntax in pattern-check.sh:95       |
| 2   | Invalid `if [[[` syntax            | Critical | Shell Script  | Fixed to `if [[` in session-start.sh:168                   |
| 3   | Invalid `if [[[` syntax (3x)       | Critical | Shell Script  | Fixed to `if [[` in coderabbit-review.sh:101,116,134       |
| 4   | SEPARATOR_LINE used before defined | Critical | Shell Script  | Moved constant definition before first use                 |
| 5   | ESM imports `import fs`            | Major    | Node.js       | Changed to `import * as fs` in 3 scripts                   |
| 6   | readFileSync without try/catch     | Major    | Error Handle  | Added try/catch to 9 locations across 3 scripts            |
| 7   | path.join without containment      | Major    | Security      | Added path traversal check in getCodeSnippet functions     |
| 8   | Unsafe error.message access        | Major    | Error Handle  | Changed to `err instanceof Error ? err.message : String()` |
| 9   | Hardcoded /tmp paths               | Major    | Portability   | Changed to env vars with .sonar/ directory fallback        |
| 10  | JSON.parse without try/catch       | Major    | Error Handle  | Added try/catch around all JSON.parse calls                |
| 11  | Mismatched markdown fences         | Trivial  | Documentation | Fixed 4-backtick fences to 3-backtick in runbook           |

**Rejected (1):**

| Issue                         | Reason                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| void loadLinks() needs .catch | loadLinks() already has internal try/catch with toast.error - deliberate |

**Patterns Identified:**

1. **Shell syntax validation**: Use `shellcheck` or similar to catch `[[[` and
   `[ ... ]]` mismatches before commit
2. **ESM namespace imports**: Node.js built-in modules need `import * as fs` not
   `import fs` for proper ESM compatibility
3. **Path containment checks**: Any path.join with external input needs
   `path.relative()` validation to prevent traversal

**Key Learnings:**

- Shell scripts with `set -u` will fail if variables are used before definition
- SonarCloud fixes can introduce new bugs if not validated (triple bracket)
- Pattern compliance checks catch issues before SonarCloud does
- `void promise` is acceptable when the function handles its own errors

---

#### Review #180: PR #282 SonarCloud Cleanup Sprint Documentation (2026-01-19)

**Source:** Qodo Compliance + Doc Lint + Qodo PR Suggestions **PR/Branch:**
feature/admin-panel-phase-3 (PR #282) **Suggestions:** 4 items (Major: 2,
Minor: 2)

**Issues Fixed:**

| #   | Issue                              | Severity | Category      | Fix                                                        |
| --- | ---------------------------------- | -------- | ------------- | ---------------------------------------------------------- |
| 1   | Missing Purpose section in runbook | Major    | Documentation | Added Purpose section and scope to runbook header          |
| 2   | Inconsistent PR structures (5/15)  | Major    | Documentation | Consolidated snapshot to match 5-PR plan structure         |
| 3   | Missing Last Updated metadata      | Minor    | Documentation | Added Last Updated date to runbook                         |
| 4   | Incorrect version history counts   | Minor    | Documentation | Fixed 202→1,213 issue counts in ROADMAP.md version history |

**Additional Investigation:**

- **Code Review Triggers GHA Issue**: Analyzed why workflow shows 91 commits
  instead of expected 30
- **Root Cause**: Git `--since` date interpretation differs between UTC (GHA)
  and local timezone, causing more commits to be counted
- **Impact**: Pre-existing issue, not blocking; timezone-aware dates would fix
- **Status**: Documented for future improvement (not fixed in this PR)

**Patterns Identified:**

1. **Doc lint required sections**: Tier 2+ documents need Purpose/Overview/Scope
   section
2. **Document consistency**: When referencing plans across files, structure must
   match
3. **Timezone-aware git dates**: Git `--since` interprets dates in local
   timezone; use full ISO timestamps for cross-environment consistency

**Key Learnings:**

- Documentation linter enforces Purpose section for Tier 2+ docs
- Snapshot files should reference and align with authoritative plan documents
- Version history entries should be updated when issue counts change
- Git date queries behave differently in UTC vs local timezones

---

#### Review #179: PR #277 Round 4 - Consistency & Pagination (2026-01-18)

**Source:** Qodo Compliance + Qodo PR Suggestions **PR/Branch:**
feature/admin-panel-phase-3 (PR #277) **Suggestions:** 8 items (Critical: 1,
Major: 3, Minor: 2, Verified: 2)

**Issues Fixed:**

| #   | Issue                              | Severity | Category    | Fix                                                               |
| --- | ---------------------------------- | -------- | ----------- | ----------------------------------------------------------------- |
| 1   | Infinite batch loop in hard-delete | Critical | Bug         | Cursor-based pagination with startAfter() instead of hasMore flag |
| 2   | Partial soft-delete states         | Major    | Consistency | Firestore first, then Auth; complete rollback on Auth failure     |
| 3   | Incomplete undelete rollback       | Major    | Consistency | Capture original values in transaction, restore all on Auth fail  |
| 4   | Stale state in setActiveTab        | Major    | React       | Functional updates in useCallback to avoid closure state          |
| 5   | Unstable useEffect dependency      | Minor    | React       | Use primitive uid instead of selectedUser object                  |
| 6   | Invalid days display               | Minor    | UI          | Null check for getDaysUntilHardDelete before rendering            |
| V1  | Existence-revealing admin errors   | Verified | Security    | Acceptable for admin-only functions protected by requireAdmin()   |
| V2  | Raw error logging                  | Verified | Security    | logSecurityEvent uses redactSensitiveMetadata() for sanitization  |

**Patterns Identified:**

1. **Cursor pagination for batch jobs**: When processing batches where items may
   fail, use `startAfter(lastDoc)` cursor instead of `hasMore = size === limit`
   to prevent infinite loops.
2. **Operation order for consistency**: Firestore first (source of truth), then
   Auth/external services - easier to rollback Firestore on external failure.
3. **Capture before transaction**: Store original values before transaction for
   full rollback if post-transaction steps fail.
4. **Primitive dependencies**: Use primitive values (uid) not objects in
   useEffect deps to prevent unnecessary re-renders.

**Key Learnings:**

- Batch processing with `hasMore = snapshot.size === 50` causes infinite loops
  if any item fails to delete
- Functional setState updates (`setActiveTabState((prev) => ...)`) avoid stale
  closure issues in useCallback
- Admin error messages like "User not found" are acceptable in admin-only
  functions that require privilege verification

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

#### Review #151: ErrorsTab Expandable Details PR Feedback (2026-01-15)

**Source:** CI Feedback + Qodo PR Compliance + PR Code Suggestions
**PR/Branch:** claude/new-session-UhAVn **Suggestions:** 9 items (Critical: 1,
Major: 2, Minor: 5, Deferred: 1)

**Issues Fixed:**

| #   | Issue                                | Severity | Category      | Fix                                                  |
| --- | ------------------------------------ | -------- | ------------- | ---------------------------------------------------- |
| 1   | Prettier formatting errors-tab.tsx   | Critical | CI Blocker    | Run `npm run format`                                 |
| 2   | Untrusted link injection (permalink) | Major    | Security      | Validate URL protocol (https:// allowlist)           |
| 3   | Invalid date crash in formatting     | Major    | Robustness    | Validate dates with isNaN check before format        |
| 4   | Interactive tr should use button     | Minor    | Accessibility | Move click handler to button inside first cell       |
| 5   | Missing noopener in rel attribute    | Minor    | Security      | Add noopener to rel="noopener noreferrer"            |
| 6   | findErrorKnowledge called per render | Minor    | Performance   | Memoize issues with knowledge using useMemo          |
| 7   | Redundant date formatting calls      | Minor    | Performance   | Calculate firstSeen/lastSeen once at component start |
| 8   | getSeverityColor not exhaustive      | Minor    | Type Safety   | Add exhaustive check pattern                         |

**Deferred:**

- Move knowledge base to Firestore (architectural change - tracked for separate
  PR)

**Patterns Identified:**

1. **URL Protocol Validation**: External URLs (from APIs like Sentry) must be
   validated before rendering in anchor tags - use allowlist pattern
   (https://sentry.io only)
2. **Date Validation Before Formatting**: Always check `!isNaN(date.getTime())`
   before passing to date-fns formatDistanceToNow
3. **Memoize Derived Render Data**: When mapping arrays to add derived data, use
   useMemo to prevent recalculation on every render

**Key Learnings:**

- Sentry permalinks should only ever be https://sentry.io URLs, but defensive
  validation prevents injection if API is compromised
- Interactive table rows cause accessibility issues - use semantic button
  elements
- rel="noreferrer" already implies noopener in modern browsers, but explicit
  noopener is defensive best practice

---

#### Review #152: Admin Error Utils PR Feedback (2026-01-15)

**Source:** SonarCloud Security Hotspots + Qodo PR Code Suggestions + CI
Feedback **PR/Branch:** claude/new-session-UhAVn **Suggestions:** 7 items
(Critical: 1, Major: 1, Minor: 1, Trivial: 2, Rejected: 2)

**Issues Fixed:**

| #   | Issue                            | Severity | Category       | Fix                                                    |
| --- | -------------------------------- | -------- | -------------- | ------------------------------------------------------ |
| 1   | README.md Prettier formatting    | Critical | CI Blocker     | Already fixed (transient CI issue)                     |
| 2   | Email regex ReDoS vulnerability  | Major    | Security (DoS) | Add length limits `{1,64}@{1,253}` per RFC 5321        |
| 3   | Whitespace-only date not handled | Minor    | Robustness     | Add `dateString?.trim()` check and trim before parsing |
| 4   | Redundant `if (!url)` check      | Trivial  | Code Quality   | Remove - try/catch handles null/empty URLs             |

**Rejected:**

- [2] javascript: protocol in test - **FALSE POSITIVE** - Test validates
  security function correctly blocks javascript: URLs
- [3] http:// in test - **FALSE POSITIVE** - Test validates security function
  correctly blocks non-https URLs

**Patterns Identified:**

1. **Regex ReDoS Prevention**: Use explicit length limits `{1,N}` instead of
   unbounded `+` quantifiers to prevent catastrophic backtracking
2. **Security Test False Positives**: SonarCloud flags security-related string
   literals in tests that are actually validating security - review before
   acting
3. **Whitespace Validation**: Always trim and check for empty after trim for
   user input that could contain whitespace-only values

**Key Learnings:**

- Email regex per RFC 5321: local-part max 64 chars, domain max 253 chars
- SonarCloud security hotspots in test files often flag the test inputs, not
  actual vulnerabilities
- `new URL("")` throws - explicit early return is optional but adds clarity

---

#### Review #171: aggregate-audit-findings.js PR Hardening (2026-01-17)

**Source:** SonarCloud Security Hotspots + SonarCloud Issues + Qodo PR
Compliance + CI Feedback **PR/Branch:** audit/single-session-2026-01-17
**Suggestions:** 29 items (Critical: 0, Major: 6, Minor: 13, Trivial: 10,
Deferred: 2)

**Issues Fixed:**

| #   | Issue                                         | Severity | Category     | Fix                                                      |
| --- | --------------------------------------------- | -------- | ------------ | -------------------------------------------------------- |
| 1   | Algorithmic DoS - O(n²) Levenshtein pairwise  | Major    | Performance  | Add MAX_LEVENSHTEIN_LENGTH=500, truncate inputs          |
| 6   | Regex DoS at line 158 (S5852)                 | Major    | Security     | Remove unused `tableRowPattern` variable                 |
| 7   | Regex DoS at line 178 (S5852)                 | Major    | Security     | Replace `\s*` with bounded ` {0,10}` in table regex      |
| 8   | Regex DoS at line 211 (S5852)                 | Major    | Security     | Replace `[^]*?` with bounded `[\s\S]{0,500}?`            |
| 21  | Cognitive Complexity 16 > 15 at line 373      | Major    | Code Quality | Extract `checkDedupCanon/FileTile/CategoryTitle` helpers |
| 26  | Cognitive Complexity 21 > 15 at line 472      | Major    | Code Quality | Extract `parseSingleSession/Canon/dedup/printSummary`    |
| 2   | Missing outputDir guard before writing        | Minor    | Robustness   | Add `fs.existsSync` + `mkdirSync` before first write     |
| 3   | Stack trace in console output (lines 975-979) | Minor    | Security     | Sanitize: log type + truncated message (200 chars max)   |
| 9   | Empty catch block at line 135                 | Minor    | Code Quality | Rename `e` → `_e` with comment                           |
| 10  | Unused variable tableRowPattern at line 157   | Minor    | Code Quality | Removed with #6                                          |
| 11  | Unused variable match at line 159             | Minor    | Code Quality | Removed with #6                                          |
| 14  | Use new Array() at line 335                   | Minor    | Code Style   | Changed `Array(m+1)` → `new Array(m+1)`                  |
| 15  | Use new Array() at line 337                   | Minor    | Code Style   | Changed `Array(n+1)` → `new Array(n+1)`                  |
| 22  | Unused variable crossRef1 at line 377         | Minor    | Code Quality | Removed with #21 refactor                                |
| 23  | Unused variable crossRef2 at line 378         | Minor    | Code Quality | Removed with #21 refactor                                |
| 16  | Use replaceAll() at line 360                  | Trivial  | Code Style   | N/A - using regex with /g flag is correct                |
| 17  | Use replaceAll() at line 361                  | Trivial  | Code Style   | N/A - using regex with /g flag is correct                |
| 29  | Prettier formatting - 8 markdown files        | Trivial  | CI           | Run `npm run format`                                     |

**Deferred Items:**

| #   | Issue                             | Reason                                       |
| --- | --------------------------------- | -------------------------------------------- |
| 4   | Unstructured logging format       | CLI tool - human-readable output acceptable  |
| 5   | Absolute file path in file access | Intentional - script operates on local files |

**Patterns Identified:**

1. **Bounded Regex for ReDoS Prevention**: Replace unbounded `\s*` and `[^]*?`
   with bounded alternatives like ` {0,10}` or `[\s\S]{0,500}?`
   - Root cause: Backtracking regex with unbounded quantifiers on alternations
   - Prevention: Use explicit character class with length limits

2. **O(n²) Algorithm DoS Protection**: For algorithms with quadratic complexity
   on string length (like Levenshtein), truncate inputs to a maximum size
   - Root cause: Algorithmic complexity becomes exploitable with large inputs
   - Prevention: Define MAX_LENGTH constant, truncate before processing

3. **Cognitive Complexity Extraction**: When SonarCloud flags complexity > 15,
   extract focused helper functions that each do one thing
   - Root cause: Functions accumulating nested conditionals over time
   - Prevention: Proactively extract helpers when adding new branches

4. **Error Sanitization for CLI Tools**: Even CLI scripts should sanitize error
   output - log type and truncated message, not full stack traces
   - Root cause: Stack traces may contain file paths or sensitive context
   - Prevention: Extract error type + truncate message to fixed length

**Resolution:**

- Fixed: 17 items (6 Major, 9 Minor, 2 Trivial verified as false positives)
- Deferred: 2 items (with documented justification)

**Key Learnings:**

- Pattern compliance scripts need the same security rigor as production code
- SonarCloud S5852 (ReDoS) often flags patterns with `\s*` - bounded
  alternatives like ` {0,10}` are safer
- `replaceAll()` suggestions are false positives when using regex with `/g` flag
- Extracting helper functions reduces cognitive complexity AND improves code
  organization

---

#### Review #165: Track A Follow-up Qodo Compliance (2026-01-17)

**Source:** Qodo Compliance + PR Code Suggestions + CI Feedback **PR/Branch:**
claude/cherry-pick-track-a-6TRVG **Suggestions:** 12 items (Critical: 1, Major:
4, Minor: 2, Trivial: 1, Rejected: 4)

**Issues Fixed:**

| #   | Issue                                            | Severity | Category       | Fix                                          |
| --- | ------------------------------------------------ | -------- | -------------- | -------------------------------------------- |
| 12  | Prettier formatting (CI blocker)                 | Critical | CI             | Run prettier --write on 3 files              |
| 4   | Raw error in console.error (storeLogInFirestore) | Major    | Security       | Sanitize error before logging                |
| 5   | Pagination infinite loop potential               | Major    | Reliability    | Add prevPageToken guard with break condition |
| 7   | Non-plain object corruption in redactMetadata    | Major    | Data Integrity | Add isPlainObject() helper function          |
| 8   | Index scope COLLECTION_GROUP incorrect           | Major    | Config         | **REVERT #164**: Change back to COLLECTION   |
| 6   | Wrong storage deploy command                     | Minor    | Documentation  | Change storage:rules → storage               |
| 10  | Button missing a11y attributes                   | Minor    | Accessibility  | Add type, aria-pressed, aria-label           |
| 11  | React.ComponentType namespace dependency         | Trivial  | Code Style     | Use inline function type                     |

**Rejected Items:**

| #   | Issue                            | Reason                                              |
| --- | -------------------------------- | --------------------------------------------------- |
| 1   | Sensitive log exposure (message) | Requires major architecture redesign; risk-accepted |
| 2   | No ticket provided               | Compliance check only, not actionable               |
| 3   | Codebase context not defined     | Compliance check only, not actionable               |
| 9   | Pagination cursor robustness     | Already covered by #5 pagination loop guard         |

**Patterns Identified:**

1. **⚠️ AI Reviewer Contradiction**: Review #164 said use COLLECTION_GROUP,
   Review #165 says use COLLECTION. **ALWAYS verify against actual code!**
   - Root cause: AI reviewers don't have full context between reviews
   - Prevention: Check actual query code before applying index scope changes
   - Actual code: `db.collection("security_logs")` → needs COLLECTION scope

2. **isPlainObject Guard**: Metadata redaction must not corrupt special objects
   - Root cause: typeof obj === "object" matches Date, Timestamp, etc.
   - Prevention: Check Object.getPrototypeOf() === Object.prototype

3. **Pagination Loop Guard**: Always add infinite loop protection
   - Root cause: pageToken could theoretically repeat
   - Prevention: Track prevPageToken, break if unchanged

**Resolution:**

- Fixed: 8 items
- Rejected: 4 items (with documented justification)

**Key Learnings:**

- **CRITICAL**: AI reviewers can give contradictory advice across reviews.
  Always verify suggestions against actual implementation code.
- Firebase index scope must match query type: collection() → COLLECTION,
  collectionGroup() → COLLECTION_GROUP
- isPlainObject() helper prevents corrupting Date/Timestamp objects
- Pagination loops need safeguards against infinite iteration

---

#### Review #164: Track A Cherry-Pick PR Qodo Compliance (2026-01-17)

**Source:** Qodo Compliance + PR Code Suggestions **PR/Branch:**
claude/cherry-pick-track-a-6TRVG **Suggestions:** 10 items (Critical: 1, Major:
3, Minor: 3, Rejected: 3)

**Issues Fixed:**

| #   | Issue                                            | Severity | Category      | Fix                                                |
| --- | ------------------------------------------------ | -------- | ------------- | -------------------------------------------------- |
| 9   | Incorrect index queryScope (COLLECTION vs GROUP) | Critical | Configuration | Changed to COLLECTION_GROUP for security_logs      |
| 5   | PII in console.error (userId in file.name)       | Major    | Security      | Log error count/type instead of full path          |
| 6   | No pagination in bucket.getFiles()               | Major    | Scalability   | Add pagination with maxResults:500, pageToken loop |
| 10  | No metadata redaction on read in adminGetLogs    | Major    | Security      | Add server-side redaction before sending to client |
| 7   | console.error instead of logSecurityEvent        | Minor    | Observability | Use structured logging for consistency             |
| 8   | No Array.isArray check for Firestore types field | Minor    | Robustness    | Add validation to prevent runtime errors           |
| 2   | Storage ACL documentation (already in code)      | Minor    | Documentation | Document in deployment guide                       |

**Rejected Items:**

| #   | Issue                        | Reason                                                      |
| --- | ---------------------------- | ----------------------------------------------------------- |
| 1   | Firestore log exposure       | Risk-accepted: comprehensive metadata redaction implemented |
| 3   | No ticket provided           | Compliance check only, not actionable                       |
| 4   | Codebase context not defined | Compliance check only, not actionable                       |

**Patterns Identified:**

1. **Firestore Index Query Scope**: Collection group queries require
   `queryScope: "COLLECTION_GROUP"` not `"COLLECTION"`
   - Root cause: Configuration mismatch between index definition and query usage
   - Prevention: Validate indexes match query patterns (collectionGroup queries
     need COLLECTION_GROUP scope)

2. **Storage Pagination for Scalability**: Always paginate `bucket.getFiles()`
   to prevent OOM
   - Root cause: Loading all files into memory can exhaust resources at scale
   - Prevention: Use `maxResults` + `pageToken` pagination pattern, process in
     batches

3. **Defense-in-Depth Metadata Redaction**: Redact sensitive data both on write
   AND read
   - Root cause: Legacy data may bypass write-time redaction
   - Prevention: Add read-time redaction as safety net for UI exposure

**Resolution:**

- Fixed: 7 items
- Rejected: 3 items (with documented justification)

**Key Learnings:**

- Firestore collection group queries fail silently if index queryScope is wrong
  - must be COLLECTION_GROUP
- Pagination is essential for Storage operations - use maxResults:500 as
  reasonable batch size
- Defense-in-depth: redact sensitive metadata at multiple layers (write + read)
  to protect against legacy data
- Risk acceptance should be documented with implemented mitigations (e.g.,
  Firestore logging with SENSITIVE_KEYS redaction)

---

#### Review #163: Track A PR Follow-up Compliance (2026-01-17)

**Source:** Qodo PR Compliance + PR Code Suggestions **PR/Branch:**
claude/cherry-pick-track-a-6TRVG **Suggestions:** 12 items (Major: 5, Minor: 5,
Trivial: 2)

**Issues Fixed:**

| #   | Issue                                    | Severity | Category    | Fix                                                           |
| --- | ---------------------------------------- | -------- | ----------- | ------------------------------------------------------------- |
| 1   | Misleading job name (cleanupOldSessions) | Minor    | Naming      | Rename to cleanupOldDailyLogs with backward-compatible alias  |
| 2   | Non-resilient orphan cleanup loop        | Major    | Robustness  | Add per-item try/catch, continue on errors                    |
| 3   | Raw error to UI (users-tab.tsx)          | Major    | Security    | Replace err.message with generic user-facing messages         |
| 4   | Weak privilege type validation           | Major    | Security    | Add Zod schema with length/pattern constraints                |
| 5   | Race condition in privilege updates      | Major    | Concurrency | Wrap in Firestore transaction                                 |
| 6   | Swallowed auth errors in adminListUsers  | Major    | Reliability | Propagate errors instead of returning partial data            |
| 7   | Admin claim removal method               | Minor    | Best Prac.  | Use null instead of destructuring to remove claims            |
| 8   | Inefficient user ID pre-fetch            | Minor    | Performance | Use listDocuments() instead of select().get()                 |
| 9   | Privilege types can be empty             | Minor    | Robustness  | Always return BUILT_IN_PRIVILEGE_TYPES merged with custom     |
| 10  | INFO events not persisted to Firestore   | Minor    | Observabil. | Note as design decision (documented, not changed)             |
| 11  | Storage ACL verification note            | Trivial  | Security    | Add security note in cleanupOrphanedStorageFiles JSDoc        |
| 12  | Firestore log message PII                | Trivial  | Security    | Note: messages come from code, not user input (risk accepted) |

**Patterns Identified:**

1. **Per-item Error Handling in Jobs**: Use try/catch around individual file
   operations so one failure doesn't abort the entire job
2. **Firestore Transactions for Multi-read-write**: When updating document based
   on current state, use runTransaction() to prevent race conditions
3. **Schema Validation for Admin APIs**: Use Zod to validate complex input
   structures with length/pattern constraints
4. **listDocuments() for ID-only Queries**: When only document IDs needed, use
   listDocuments() instead of select().get() to avoid reading document data
5. **Null to Remove Claims**: Set custom claim to null rather than destructuring
   to remove it - more idiomatic Firebase approach
6. **Error Propagation over Swallowing**: When auth batch fails, throw error
   rather than return partial data that could be misleading

**Key Learnings:**

- Function names should reflect what they clean up, not the collection they
  target (cleanupOldDailyLogs > cleanupOldSessions)
- Per-item error handling makes jobs resilient to transient failures
- Always validate admin API inputs with schemas, not just presence checks
- Transactions prevent concurrent admin updates from corrupting data

---

#### Review #162: Track A Admin Panel PR Feedback (2026-01-16)

**Source:** Qodo PR Compliance + PR Code Suggestions + CI Feedback
**PR/Branch:** claude/complete-track-a-jZCcz **Suggestions:** 22 items
(Critical: 1, Major: 8, Minor: 11, Deferred: 2)

**Issues Fixed:**

| #   | Issue                                     | Severity | Category    | Fix                                                     |
| --- | ----------------------------------------- | -------- | ----------- | ------------------------------------------------------- |
| 1   | README.md Prettier formatting             | Critical | CI Blocker  | Run Prettier on README.md                               |
| 2   | storeLogInFirestore swallows errors       | Major    | Debugging   | Log errors to console.error                             |
| 3   | PII in logs (userId/targetUid)            | Major    | Security    | Redact sensitive metadata before storing in Firestore   |
| 4   | Admin claims wipes existing claims        | Major    | Bug         | Preserve existing claims when setting admin privilege   |
| 5   | cleanupOrphanedStorageFiles brittle URL   | Major    | Data Safety | Use file.name path comparison + fallback URL substring  |
| 6   | cleanupOldSessions N+1 query              | Major    | Performance | Use collectionGroup query instead of per-user iteration |
| 7   | adminListUsers N+1 auth lookups           | Major    | Performance | Batch getUsers() call instead of sequential             |
| 8   | cleanupOldRateLimits deletes only 1 batch | Major    | Bug         | Loop until all expired documents deleted                |
| 9   | Raw error surfaced to UI (err.message)    | Minor    | Security    | Use generic error message in UI                         |
| 10  | Pagination missing tie-breaker            | Minor    | Reliability | Add documentId() as secondary sort                      |
| 11  | JSON.stringify can crash on circular refs | Minor    | Robustness  | Add safe serialization with error handling              |
| 12  | generateUsageAnalytics sequential queries | Minor    | Performance | Use Promise.all for parallel execution                  |
| 13  | adminGetLogs duplicated query building    | Minor    | Code Style  | Refactor to conditional where clause                    |
| 14  | Expanded rows not reset on filter change  | Minor    | UX          | Add useEffect to clear expanded rows                    |
| 15  | Privilege dropdown empty during load      | Minor    | UX          | Add loading state to dropdown                           |
| 16  | Refresh button enabled during load        | Minor    | UX          | Disable button while loading                            |

**Deferred to Roadmap:**

| #   | Issue                             | Reason                                     |
| --- | --------------------------------- | ------------------------------------------ |
| D1  | Query GCP Cloud Logging directly  | Major architecture change, add to backlog  |
| D2  | Sensitive log persistence warning | Architectural concern, document in roadmap |

**Patterns Identified:**

1. **Metadata Redaction**: Always redact sensitive keys (token, password,
   secret, cookie, authorization) before persisting logs to Firestore
2. **Preserve Custom Claims**: When modifying Firebase Auth custom claims,
   spread existing claims and only modify the target claim
3. **Collection Group Queries**: For operations across user subcollections, use
   collectionGroup() instead of iterating users
4. **Batch Auth Operations**: Use admin.auth().getUsers() for batched user
   lookups instead of sequential getUser() calls
5. **Complete Cleanup Loops**: Cleanup jobs must loop until no more documents
   match, not just process one batch

**Key Learnings:**

- Firebase custom claims are replaced entirely by setCustomUserClaims - always
  preserve existing claims with spread operator
- Storage file orphan detection using publicUrl() is brittle - prefer file.name
  path matching with fallback
- N+1 patterns in Cloud Functions can cause timeouts at scale - batch where
  possible
- CI formatting checks run after local hooks - ensure consistent formatting

---

#### Review #161: lint-staged PR Feedback (2026-01-16)

**Source:** Qodo PR Compliance + CI Feedback **PR/Branch:**
claude/roadmap-analysis-6LQlO **Suggestions:** 3 items (Major: 2, Minor: 1)

**Issues Fixed:**

| #   | Issue                              | Severity | Category | Fix                                                  |
| --- | ---------------------------------- | -------- | -------- | ---------------------------------------------------- |
| 1   | Supply-chain risk with npx         | Major    | Security | Use `npx --no-install lint-staged` to prevent fetch  |
| 2   | Hidden stderr errors (2>/dev/null) | Major    | Debug    | Remove stderr suppression, improve conditional logic |
| 3   | README/ROADMAP Prettier formatting | Minor    | Format   | Run `npm run format` on documentation files          |

**Patterns Identified:**

1. **Supply-chain Security with npx**: Use `npx --no-install <package>` to
   ensure only the locally installed version runs, preventing remote code fetch
2. **Hook Error Visibility**: Never suppress stderr in git hooks - errors need
   to be visible for debugging failed commits

**Key Learnings:**

- `npx` can fetch packages from npm if not found locally - use `--no-install`
  flag for security
- Suppressing stderr (`2>/dev/null`) in hooks hides actionable failure context
- CI checks formatting after local hooks - ensure lint-staged formats before
  push

---

#### Review #156: Security Hardening & Pre-Push Fix (2026-01-16)

**Source:** Qodo PR Code Suggestions + CI Feedback **PR/Branch:**
claude/new-session-UhAVn **Suggestions:** 4 items (Major: 2, Minor: 2)

**Issues Fixed:**

| #   | Issue                                       | Severity | Category | Fix                                                             |
| --- | ------------------------------------------- | -------- | -------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | pre-push scanned staged files not pushed    | Major    | Logic    | Use `git diff @{u}...HEAD` to scan files being pushed           |
| 2   | --file path traversal vulnerability         | Major    | Security | Add path.relative() containment check before scanning           |
| 3   | check-backlog-health.js misses Rejected sec | Minor    | Logic    | Add cutIndex logic to exclude both Completed and Rejected Items |
| 4   | SEC-002 exclusions not cross-platform       | Minor    | Compat   | Use `(?:^                                                       | [\\/])` pattern for path-separator agnostic matching |

**Patterns Identified:**

1. **Pre-push vs Pre-commit File Selection**: Pre-commit hooks check staged
   files; pre-push hooks should check commits being pushed (`@{u}...HEAD`)
2. **Path Traversal in CLI Args**: User-provided paths must be resolved relative
   to project root and validated with path.relative() containment check
3. **Cross-platform Regex**: Use `[\\/]` to match both / and \ path separators

**Key Learnings:**

- `@{u}` refers to the upstream tracking branch - use `@{u}...HEAD` to get
  commits that will be pushed
- CLI tools accepting file paths need path traversal protection even for
  internal tools - defense in depth principle
- Windows uses backslash, POSIX uses forward slash - regex patterns matching
  file paths should account for both

---

#### Review #155: Security Check Self-Detection & CI Fix (2026-01-16)

**Source:** Qodo PR Code Suggestions + CI Feedback **PR/Branch:**
claude/new-session-UhAVn **Suggestions:** 4 items (Major: 2, Minor: 2)

**Issues Fixed:**

| #   | Issue                                     | Severity | Category   | Fix                                                      |
| --- | ----------------------------------------- | -------- | ---------- | -------------------------------------------------------- |
| 1   | security-check.js flags itself (SEC-002)  | Major    | False Pos  | Add `/security-check\.js$/` to SEC-002 exclude           |
| 2   | check-pattern-compliance.js flags itself  | Major    | False Pos  | Add `/check-pattern-compliance\.js$/` to SEC-002 exclude |
| 3   | CI workflow --all flag detection broken   | Minor    | CI         | Use boolean `check_all` output instead of string compare |
| 4   | session-start.js execSync missing options | Minor    | Robustness | Add timeout/maxBuffer to backlog health check            |

**Patterns Identified:**

1. **Self-Referential Exclusion**: Security scanners that define patterns in
   message strings may match their own source code - exclude the scanner itself
2. **Multiline Output Comparison**: GitHub Actions outputs containing newlines
   cannot be reliably compared with string equality - use separate boolean flags

**Key Learnings:**

- Regex patterns like `/\beval\s*\(/` will match message strings containing
  "eval()" examples - scanner scripts need self-exclusion
- GitHub Actions `${{ steps.x.outputs.y }}` for multiline values returns all
  lines - use dedicated boolean outputs for conditional logic
- execSync without timeout/maxBuffer can hang on large outputs or slow
  processes - always specify both options for robustness

---

#### Review #154: Admin Error Utils Security Hardening (2026-01-15)

**Source:** Qodo PR Code Suggestions + CI Feedback **PR/Branch:**
claude/new-session-UhAVn **Suggestions:** 5 items (Minor: 5)

**Issues Fixed:**

| #   | Issue                                  | Severity | Category | Fix                                                     |
| --- | -------------------------------------- | -------- | -------- | ------------------------------------------------------- |
| 1   | URLs with embedded credentials allowed | Minor    | Security | Reject URLs with username/password via URL.username     |
| 2   | URLs with explicit ports allowed       | Minor    | Security | Reject URLs with non-standard ports via URL.port        |
| 3   | JWT tokens not redacted                | Minor    | Security | Add JWT regex: 3 base64url segments with dots           |
| 4   | Phone regex matches plain 10 digits    | Minor    | Quality  | Require at least one separator (reduce false positives) |
| 5   | 50K boundary test matched hex regex    | Minor    | Testing  | Use 'x' instead of 'a' to avoid hex token false match   |

**Patterns Identified:**

1. **URL Credential Rejection**: Always check URL.username, URL.password, and
   URL.port to prevent credential injection and port-based bypass
2. **JWT Token Detection**: JWT format is `base64url.base64url.base64url` - use
   `[A-Za-z0-9_-]{10,200}` segments
3. **Phone Regex Precision**: Require separators (`-`, `.`, ` `) to avoid
   matching arbitrary numeric IDs

**Key Learnings:**

- URL API provides parsed username/password/port - check all three for security
- JWT tokens use base64url encoding (alphanumeric + hyphen + underscore)
- Test data should avoid matching production patterns (use 'x' not 'a' for
  non-hex test strings)

---

#### Review #153: Admin Error Utils Follow-up (2026-01-15)

**Source:** Qodo PR Code Suggestions + CI Feedback **PR/Branch:**
claude/new-session-UhAVn **Suggestions:** 6 items (Critical: 1, Minor: 5)

**Issues Fixed:**

| #   | Issue                                | Severity | Category    | Fix                                           |
| --- | ------------------------------------ | -------- | ----------- | --------------------------------------------- |
| 1   | README.md Prettier formatting        | Critical | CI Blocker  | Transient issue - already clean locally       |
| 2   | TLD regex no upper bound             | Minor    | Security    | Add `{2,63}` upper bound per RFC              |
| 3   | Large inputs could freeze UI         | Minor    | Performance | Add 50K char guard returning `[redacted]`     |
| 4   | redactSensitive accepts only string  | Minor    | Robustness  | Accept `string \| null \| undefined`          |
| 5   | safeFormatDate accepts only string   | Minor    | Robustness  | Accept `string \| null \| undefined`          |
| 6   | isValidSentryUrl accepts only string | Minor    | Robustness  | Accept `string \| null \| undefined` + trim() |

**Patterns Identified:**

1. **TLD Length Limit**: Per RFC 1035, TLDs are max 63 chars - use `{2,63}` not
   `{2,}`
2. **Large Input Guards**: Sanitization functions processing user input should
   have size limits to prevent DoS/UI freezes
3. **Nullable Type Signatures**: Functions that handle optional data should
   explicitly accept null/undefined in their type signatures for clarity

**Key Learnings:**

- Full email regex RFC compliance: local `{1,64}` + domain `{1,253}` + TLD
  `{2,63}`
- Large payload protection prevents both performance issues and ensures
  consistent [redacted] output
- Explicit nullable types make API contracts clearer even when implementation
  handles nulls implicitly

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

#### Review #142: PR #281 SonarCloud Workflow Configuration (2026-01-18)

**Source:** Qodo Compliance + Qodo PR Suggestions + SonarCloud (2 rounds)
**PR/Branch:** PR #281 / feature/admin-panel-phase-3 **Suggestions:** 12 unique
items across 2 rounds (Critical: 0, Major: 4, Minor: 7, Deferred: 1)

**Context:** Review of SonarCloud workflow configuration PR. Issues covered
supply-chain security (action pinning), workflow permissions, documentation
security, API authentication, and script robustness.

**Round 1 Issues Fixed:**

| #   | Issue                               | Severity | Category   | Fix                                              |
| --- | ----------------------------------- | -------- | ---------- | ------------------------------------------------ |
| 1   | Pin GitHub Actions to commit SHAs   | 🟠 Major | Security   | Pinned checkout@v4.3.1, sonarcloud@v3.1.0 to SHA |
| 2   | Missing contents: read permission   | 🟠 Major | CI         | Added `contents: read` for checkout step         |
| 3   | pull-requests: read → write         | 🟡 Minor | CI         | Changed to `write` for PR decoration             |
| 4   | Token handling in curl examples     | 🟡 Minor | Security   | Changed to header approach                       |
| 5   | Infinite loop in polling script     | 🟡 Minor | Robustness | Added case statement for terminal states         |
| 6   | Branch name not unique if run twice | 🟡 Minor | Usability  | Added `-H%M%S` timestamp to branch name          |

**Round 2 Issues Fixed:**

| #   | Issue                                | Severity | Category   | Fix                                                |
| --- | ------------------------------------ | -------- | ---------- | -------------------------------------------------- |
| 8   | SonarCloud API uses Basic not Bearer | 🟠 Major | API        | Changed to `Basic $(base64 "$TOKEN:")`             |
| 9   | Poll status only, not conclusion     | 🟠 Major | Robustness | Check both status=completed AND conclusion=success |
| 10  | Fork PRs fail (no secrets)           | 🟡 Minor | CI         | Added `if` condition to skip fork PRs              |
| 11  | Missing GITHUB_TOKEN for decoration  | 🟡 Minor | CI         | Added GITHUB_TOKEN to action env                   |
| 12  | Missing security-events permission   | 🟡 Minor | CI         | Added `security-events: write` for Code Scanning   |

**Deferred Items:**

| #   | Issue                                 | Reason                                                                                   |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| 7   | Centralize workflow logic into script | Intentional duplication for discoverability; skill and runbook serve different use cases |

**Patterns Identified:**

1. **Pin GitHub Actions to commit SHAs** (Major)
   - Root cause: Mutable tags (@v4, @v3) can be moved or compromised
   - Prevention: Use `action@<SHA> # v<version>` format
   - Pattern: Already in CODE_PATTERNS.md

2. **SonarCloud API uses Basic auth** (Major)
   - Root cause: API requires Basic auth, not Bearer tokens
   - Prevention: `printf "%s:" "$TOKEN" | base64` for Authorization header
   - Pattern: Always verify API auth method in documentation

3. **Check workflow conclusion, not just status** (Major)
   - Root cause: status=completed can have conclusion=failure
   - Prevention: Nested case checking both status AND conclusion
   - Pattern: `status == completed && conclusion == success`

4. **Skip CI for fork PRs** (Minor)
   - Root cause: Fork PRs don't have access to repo secrets
   - Prevention:
     `if: github.event.pull_request.head.repo.full_name == github.repository`
   - Pattern: Standard pattern for secret-dependent workflows

**Resolution:** Fixed 11 items, deferred 1 (intentional design)

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

_Reviews #101-136 have been archived to
[docs/archive/REVIEWS_101-136.md](./archive/REVIEWS_101-136.md). See Archive 4
section above for details._
