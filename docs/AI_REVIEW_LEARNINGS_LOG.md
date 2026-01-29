# AI Review Learnings Log

**Document Version:** 12.1 **Created:** 2026-01-02 **Last Updated:** 2026-01-28

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

| Version | Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.0    | 2026-01-24 | **SECURITY INFRASTRUCTURE**: Created proactive security prevention framework after Review #201 required 6 rounds of fixes. **NEW FILES**: (1) `docs/agent_docs/SECURITY_CHECKLIST.md` - Pre-write checklist with 180+ patterns from CODE_PATTERNS.md; (2) `scripts/lib/security-helpers.js` - Reusable secure implementations (sanitizeError, escapeMd, refuseSymlinkWithParents, validatePathInDir, safeWriteFile, safeGitAdd, safeGitCommit, sanitizeFilename, parseCliArgs, safeReadFile, validateUrl, safeRegexExec, maskEmail); (3) `scripts/check-pattern-sync.js` - Verifies consistency between docs and automation. **NEW SCRIPT**: `npm run patterns:sync`. **FEEDBACK LOOP**: PR review → Learnings log → Consolidation → Pattern sync → Checklist/helpers update → Automation.                                                                                                                          |
| 12.0    | 2026-01-27 | Review #212: Session #103 CI Fix - Pattern Checker False Positives (2 items - 2 MAJOR CI blockers). **MAJOR**: (1) check-roadmap-health.js:39 readFileSync IS in try/catch (L38-47) - added to pathExcludeList; (2) check-roadmap-health.js:175 `rel === ""` IS present - added to pathExclude regex. Both verified false positives. Active reviews #180-212.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 11.9    | 2026-01-27 | Review #211: Session #103 Testing Infrastructure PR - Qodo + SonarCloud + CI (18 items - 5 MAJOR, 6 MINOR, 1 TRIVIAL, 2 DEFERRED, 1 REJECTED). **MAJOR**: (1) readFile error handling with instanceof check; (2-3) CRLF regex compatibility `\r?\n`; (4) Bug L141 - conditional returns same value; (5) Path traversal regex `^\.\.(?:[\\/]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | $)` instead of startsWith. **MINOR**: (1) Test factory counter vs Date.now(); (2) Warning for skipped ROADMAP_FUTURE checks; (3) Track naming regex excludes subsections; (4) PG validation matches "Group" format; (5) Scoped version history regex; (6) Session #102→#103. **DEFERRED**: MCP Memory vs Vector DB; --fix CLI flag. **REJECTED**: Unstructured logging (CLI intentional). **NEW PATTERNS**: (63) Counter-based unique IDs for test factories; (64) Scope regex to relevant section; (65) Format matching for validation scripts (Group vs PG). Active reviews #180-211. |
| 11.8    | 2026-01-27 | Reviews #208-210: Session #102 Hook Robustness & Security (3 rounds, 20+ items). **Review #208** (7 items): Pattern checker exclusions (3 verified try/catch files), remote branch normalization, path traversal startsWith fix, state write error logging, description sanitization, deleted files filter, stderr warnings. **Review #209** (6 items): Path containment hardening (path.relative), detached HEAD handling, null sessionId state reset prevention, session identity validation, execSync timeout/maxBuffer, agentsInvoked 200-entry cap. **Review #210 R1** (4 items): Project dir validation, stale state false pass fix, task matcher regex ((?i) not JS), atomic state writes (tmp+rename). **Review #210 R2** (4 items): Cross-platform path regex `^\.\.(?:[\\/]                                                                                                                               | $)`, email regex fix [A-Za-z] (was [A-Z                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | a-z] matching literal \|), CI null session skip, hook pathExclude update. **NEW PATTERNS**: (60) Atomic file writes via tmp+rename; (61) Task agent matchers need explicit case variants; (62) path.relative for containment validation. Active reviews #180-210. |
| 11.7    | 2026-01-26 | Review #207: Session #99 PR Round 2 - Storage Robustness + React Patterns (6 items - 1 MAJOR CI, 1 MEDIUM placeholder detection, 4 MEDIUM React/storage). **MAJOR CI**: (1) npm run audit:validate needs `--` before `--all` for args to pass through. **MEDIUM**: (2) isPlaceholderLink - add path/anchor detection to avoid false negatives; (3) today-page.tsx getLocalStorage try/catch for Safari private mode; (4) today-page.tsx setLocalStorage isolated try/catch to not block Firestore; (5) use-smart-prompts.ts - move persistence from state updater to useEffect for React Strict Mode. **DEFERRED**: (6) saveBackup logging - silent fail intentional. **PATTERNS**: (57) npm args require `--` separator to pass to script; (58) React state updaters should be pure - move side effects to useEffect; (59) Storage operations need isolation to not block critical saves. Active reviews #180-207. |
| 11.6    | 2026-01-26 | Review #206: Session #99 PR CI Fixes (6 items - 2 MAJOR CI blockers, 3 MINOR, 1 TRIVIAL). **MAJOR CI**: (1) docs/aggregation/README.md missing Purpose section heading - inline bold not recognized as section; (2) audit:validate needs --all flag + continue-on-error (script requires args). **MINOR**: (3) /example/i pattern too broad - matches "example.com" - changed to /^example$/i; (4) Angle bracket pattern too broad - changed to /^<[a-z_-]+>$/i; (5) Generic words check required SAME word match, not just both generic. **TRIVIAL**: (6) saveBackup try/catch for storage quota errors. **PATTERNS**: (55) Tier-1 docs need proper ## section headings, not inline bold; (56) CI scripts needing args must have continue-on-error or explicit args. Active reviews #180-206.                                                                                                                      |
| 11.5    | 2026-01-26 | Review #205: Audit False Positive Prevention - Process improvement after CANON-0107/0108 false positives (storage.rules claimed missing but existed). **ROOT CAUSE**: Existence-based findings had HIGH confidence without command output evidence; S2/S3 skip verification. **FIXES TO audit-security.md**: (1) Existence findings MUST include actual command output; (2) Cap confidence at MEDIUM for existence/negative assertions; (3) Add Pre-Backlog Verification step; (4) Check firebase.json references. **NEW PATTERNS**: (53) Verify existence claims with actual ls output; (54) Absence of evidence ≠ evidence of absence. Active reviews #180-205.                                                                                                                                                                                                                                                   |
| 11.4    | 2026-01-26 | Review #204 Round 3: Session #98 PR - CI Pattern Compliance Fixes (3 items - 3 CRITICAL CI blockers). **CRITICAL**: Path validation `startsWith("..")` has false positives for files like "..hidden.md" - use regex `/^\.\.(?:[/\\]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | $)/`; empty string edge case in path.relative(); JSONL parse errors must block strict S0/S1 mode. **FIXES**: Changed to proper regex check + empty check + isAbsolute for Windows drives; added \_parseError blocking in validateS0S1Strict. **PATTERNS**: (52) Regex-based path traversal detection `^\.\.(?:[/\\]                                                                                                                                                                                                                                                                     | $)` instead of startsWith. Total 14 fixes across 3 rounds. Active reviews #180-204.                                                                                                                                                                               |
| 11.3    | 2026-01-26 | Review #204 Round 2: Session #98 PR - Qodo Security Hardening (5 items - 2 CRITICAL, 2 MAJOR, 1 MINOR). **CRITICAL**: Path traversal in audit-s0s1-validator.js (containment + symlink rejection), trap cleanup bug. **MAJOR**: Fail-closed on invalid dates (empty string return), silent JSONL parse failures (track \_parseError). **MINOR**: ROLLOUT_MODE normalization (trim/uppercase). **NEW PATTERNS**: (50) Path containment validation; (51) Fail-closed parsing. Total 11 fixes across 2 rounds. Active reviews #180-204.                                                                                                                                                                                                                                                                                                                                                                                |
| 11.2    | 2026-01-26 | Review #204 Round 1: Session #98 PR - Qodo Compliance + CI Fixes (7 items - 3 CRITICAL, 2 MAJOR, 2 MINOR). **CRITICAL**: Subshell guardrail bypass in pre-commit hook (temp file + while read), lint-staged knip false positive, readFileSync pattern compliance false positive. **MAJOR**: UTC timezone bug in getNextDay, command injection input validation (already mitigated by sanitizeDateString). **MINOR**: ROLLOUT_MODE env-configurable, duplicate constants noted. **NEW PATTERNS**: (48) Pipe subshell variable isolation; (49) UTC date arithmetic. Active reviews #180-204.                                                                                                                                                                                                                                                                                                                          |
| 11.1    | 2026-01-24 | Review #203: PR #312 ROADMAP v3.9 Reorganization - Qodo Quality Fixes (24 items - 0 CRITICAL, 2 MAJOR, 10 MINOR, 12 TRIVIAL). **MAJOR**: Security schema explicit encryption fields for sharedPackets snapshot (ciphertext/iv/algorithm), sponsor contact PII encryption comments. **MINOR**: Version metadata v3.0→v3.9 in 3 analysis files, missing-priority count 28→18 correction, priority normalization P4→P3, validation metrics alignment. **TRIVIAL**: Count fixes (T7 3→4, M7-F1 12→11, M7-F4 14→15, M7-F9 5→7, M9-F1 9→8), naming consistency (M4.5 "Security & Privacy"), contradictory completion status removal. Documentation accuracy fixes. Active reviews #180-203.                                                                                                                                                                                                                               |
| 10.9    | 2026-01-24 | Review #201: PR #310 Learning Effectiveness Analyzer - Qodo Security Hardening (33 items across 6 rounds - 1 CRITICAL, 26 MAJOR, 4 MINOR, 2 DEFERRED). **CRITICAL**: Git option injection. **MAJOR (R1-5)**: Temp file wx, Markdown injection, relative logging, path validation, escapeMd(), refuseSymlink(), git add -A removal, empty fallback, JSON output. **MAJOR (R6)**: Symlink parent traversal, Git pathspec magic `:`, repo root path validation, wx for JSON, Markdown escape fix. **NEW PATTERNS**: (31-38) R4-5 patterns; (39-41) Symlink parent, pathspec magic, repo root. Total 31 fixes. Active reviews #180-201. Consolidation counter: 0.                                                                                                                                                                                                                                                       |
| 10.8    | 2026-01-24 | Review #200 Round 4: PR #309 Round 4 - Qodo Final Hardening (12 items - 5 HIGH imp 8-9 Security, 4 MEDIUM imp 7 Quality, 3 MINOR imp 6 Compliance). **HIGH**: Path traversal segment regex `/(?:^\|\/)\.\.(?:\/\|$)/`, CLAUDE_PROJECT_DIR absolute path validation, 4096 char DoS caps, Unicode separator stripping (`\u2028`, `\u2029`), control char removal in sanitizeFilesystemError. **MEDIUM**: Deduplicated sanitization (export from validate-paths.js), segment-based containment (no startsWith), binary file skip, precheck graceful exit. **MINOR**: 500 char log cap, `filePath[0] === "-"` pattern trigger fix. **NEW PATTERNS**: (27) Segment-based path checks; (28) Unicode log injection; (29) Input length DoS caps; (30) Code deduplication via exports. Total 12 fixes. Pattern-check.js: 230 lines. Active reviews #180-200. Consolidation counter: 0.                                       |
| 10.7    | 2026-01-23 | Review #199 Round 6: Qodo Security Compliance + Code Suggestions (6 items - 1 CRITICAL 🔴 reversed rejection, 4 MAJOR imp 7, 1 ADVISORY). **CRITICAL**: Structured JSON logging (reversed R5 rejection due to escalation - hybrid: JSON for file audit trail, human-readable for console). **MAJOR**: PowerShell null/"null"/array handling, invalid PID filtering (NaN prevention), exact name matching + word-boundary regex for process allowlist, log file permission enforcement (fchmodSync/chmodSync). **ADVISORY**: Process termination design trade-off documented. **NEW PATTERNS**: (23) Structured audit logging (hybrid approach); (24) PowerShell JSON edge cases; (25) Subprocess output validation; (26) Process matching precision. Total 37 fixes across 6 rounds. Final: 386 lines. Active reviews #180-199. Consolidation counter: 0.                                                           |
| 10.6    | 2026-01-23 | Review #199 Round 5: Qodo Code Suggestions + Generic Compliance (7 items - 2 HIGH imp 7-8, 1 MEDIUM imp 6, 1 Compliance, 2 DEFERRED, 1 REJECTED). **HIGH**: Removed deprecated WMIC CSV parsing (use PowerShell directly), added /T flag to taskkill (kills process tree). **MEDIUM**: Normalize Windows newlines (/\r?\n/ regex). **COMPLIANCE**: Added logging to silent catch. **DEFERRED**: Multiple PIDs (same as R3), sleep buffer optimization (marginal benefit). **REJECTED**: Structured logging (overkill for local hook). **NEW PATTERNS**: (20) Deprecated command elimination; (21) Process tree termination; (22) Cross-platform newline handling. Total 32 fixes across 5 rounds. Final: 333 lines. Active reviews #180-199. Consolidation counter: 0.                                                                                                                                              |
| 10.5    | 2026-01-23 | Review #199: PR #308 Round 4 - CI Security Scanner + Qodo (4 items - 1 CI CRITICAL blocker, 3 Qodo HIGH importance 7-8). **CRITICAL**: Refactored all execSync to execFileSync with args arrays (eliminates template interpolation). **HIGH**: File type validation for log target (fstatSync/isFile), ESRCH vs EPERM error code handling in process polling, process disappearance race condition handling. **NEW PATTERNS**: (16) Args arrays over template interpolation; (17) Log target type validation; (18) Process signal error code semantics; (19) Process disappearance race handling. Total 28 fixes across 4 rounds. Active reviews #180-199. Consolidation counter: 0.                                                                                                                                                                                                                                |
| 10.4    | 2026-01-23 | Review #198 Round 3: Qodo + CI (9 items - 1 CRITICAL CI blocker unsafe error.message, 2 MAJOR: TOCTOU symlink race + command line exposure, 6 MINOR). **NEW PATTERNS**: (11) TOCTOU-safe file ops (O_NOFOLLOW); (12) Redact command lines in logs; (13) Native process signaling; (14) Graceful shutdown polling; (15) Error message instanceof check. Total 24 fixes across 3 rounds. Final: 278 lines with defense-in-depth. Commits: c674ec3 (R1), a2e6e27 (R2), b49d88e (R3). Active reviews #180-198. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                |
| 10.3    | 2026-01-23 | Review #198 Follow-up: Qodo Round 2 - 7 additional security/compliance fixes (2 MAJOR: symlink log overwrite via lstatSync, stricter process allowlist; 3 MINOR: user context in logs, PID validation, Windows PowerShell fallback; 2 TRIVIAL: Atomics.wait sleep, catch block logging). **NEW PATTERNS**: Symlink protection for log files, stricter allowlist for generic processes, user context in security logs, deprecated command fallbacks, cross-platform sleep. Total 15 fixes across 2 rounds. Active reviews #180-198. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                        |
| 10.2    | 2026-01-23 | Review #198: PR #308 Serena Dashboard Hook - Qodo Security & Compliance (8 items - 1 Critical cross-platform, 2 Major security, 3 Minor logging/error handling, 2 Trivial). **KEY PATTERNS**: (1) Cross-platform hooks need Node.js with platform detection; (2) Process termination requires allowlist validation + state checking + audit logging; (3) Git merges can silently remove hook configs - verify after merge; (4) `continueOnError: true` prevents session startup failures. Review #197: PR claude/new-session-z2qIR Expansion Evaluation Tracker (11 items). Active reviews now #180-198. Consolidation counter: 0.                                                                                                                                                                                                                                                                                  |
| 10.1    | 2026-01-22 | **ARCHIVE #5**: Reviews #137-179 → REVIEWS_137-179.md (~1195 lines removed). Active reviews now #180-194. Consolidation counter unchanged (0 - no new patterns to consolidate). Archive covers: PR #243 Phase 4B/4C, Settings Page accessibility, Operational visibility sprint, Track A admin panel, aggregate-audit-findings hardening, PR #277 pagination patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 10.0    | 2026-01-20 | Review #190: Cherry-Pick PR Qodo Third Follow-up - 10 fixes (3 Security, 5 Major, 2 Minor). **SECURITY**: Symlink traversal protection in check-docs-light.js, phase-complete-check.js, archive-doc.js using lstatSync + realpathSync. **MAJOR**: Deterministic merge order in aggregate-audit-findings.js (sort after Set→Array), bulk fix conflict detection in verify-sonar-phase.js, safeToIso helper in admin.ts, Windows path detection in check-pattern-compliance.js. **PATTERNS**: (1) Always use lstatSync before statSync to detect symlinks; (2) Sort indices after Array.from(Set) for deterministic iteration; (3) Bulk operations must validate against individual entries for conflicts.                                                                                                                                                                                                            |
| 9.9     | 2026-01-19 | Review #185: PR 2 TypeScript Files - S3776 Cognitive Complexity Reduction (5 high-complexity TS/TSX files). Files: jobs.ts (42→~15), resources-page.tsx (48→~15), users-tab.tsx (41→~15), settings-page.tsx (41→~15), security-wrapper.ts (39→~15). **KEY PATTERNS FOR TYPESCRIPT**: (1) Extract health check helpers (e.g., `checkErrorRateHealth()`, `checkJobStatusHealth()`); (2) Extract badge/styling helpers (e.g., `getMeetingTypeBadgeClasses()`, `getHomeGenderBadgeClasses()`); (3) Extract state update helpers (e.g., `updateUserInList()`); (4) Extract validation builders (e.g., `buildCleanStartTimestamp()`, `parseDateTimeParts()`); (5) Extract security check steps (e.g., `checkUserRateLimit()`, `handleRecaptchaVerification()`). React pattern: Move helpers outside component to module scope for reuse.                                                                                  |
| 9.8     | 2026-01-19 | Review #184: PR 2 Continued - S3776 Cognitive Complexity Reduction (~40 issues fixed in 9 high-complexity scripts). Files: aggregate-audit-findings.js (87→~25), check-docs-light.js (55→~15), check-backlog-health.js (39→~12), validate-canon-schema.js (37→~12), security-check.js (35→~12), run-consolidation.js (34→~12), validate-audit.js (34→~12), log-session-activity.js (32→~12), generate-documentation-index.js (56→~15). **KEY PATTERNS**: (1) Extract lookup maps for nested ternaries (e.g., `TIER_DESCRIPTIONS`, `ID_PREFIX_CATEGORY_MAP`); (2) Extract `process*IntoSummary()` helpers for event/state processing; (3) Extract `validate*()` helpers for validation chains; (4) Extract `output*()` helpers for console output; (5) Move nested functions to module scope (S2004).                                                                                                                |
| 9.7     | 2026-01-19 | Reviews #182-183: SonarCloud Cleanup Sprint learnings consolidated from deleted AI_LESSONS_LOG.md. Review #182: PR 1 Mechanical Fixes (186 issues, 8 rules, 48 files - node: prefix, shell modernization). Review #183: PR 2 Critical Issues partial (~20 issues, 6 rules - cognitive complexity refactoring, void operator, mutable exports). **KEY LEARNINGS**: Helper extraction for complexity reduction, factory functions for SSR exports, syntax validation after batch operations.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 9.6     | 2026-01-18 | Review #142: PR #281 SonarCloud workflow configuration - 11 fixes across 2 rounds (4 Major: SHA pinning, contents:read, Basic auth fix, conclusion polling; 7 Minor: permissions, fork skip, GITHUB_TOKEN). 1 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9.5     | 2026-01-18 | **CONSOLIDATION #13 + ARCHIVE #4**: Patterns from Reviews #137-143, #154-179 (33 reviews) → CODE_PATTERNS.md v2.0. **22 new patterns added**: 6 React/Frontend (cursor pagination, Firestore-first, capture before tx, primitive deps, functional setState, claims preservation); 5 Security (isPlainObject, O(n²) DoS, npx --no-install, URL allowlist, self-scanner exclusion); 4 JS/TS (listDocuments, non-greedy JSON, Next.js bundling, cognitive complexity); 3 CI (per-item error, complete loops, pre-push); 2 Docs (YAML frontmatter, xargs hang); 1 GitHub Actions (boolean outputs). **ARCHIVE #4**: Reviews #101-136 → REVIEWS_101-136.md. Active reviews now #137-179. Counter reset.                                                                                                                                                                                                                  |
| 9.4     | 2026-01-18 | Review #179: PR #277 Round 4 - 8 items (1 CRITICAL: cursor-based pagination for batch jobs to prevent infinite loops; 3 MAJOR: Firestore-first operation order, full rollback with captured original values, functional setState updates; 2 MINOR: primitive useEffect deps, null check for days display; 2 VERIFIED: admin error messages acceptable, logSecurityEvent sanitizes). **KEY LESSONS: (1) startAfter(lastDoc) for batch jobs, not hasMore flag; (2) Firestore first for easier rollback; (3) Capture original values before transaction.**                                                                                                                                                                                                                                                                                                                                                             |
| 9.3     | 2026-01-18 | Review #178: PR #277 Soft-Delete + Error Export - 18 items (6 MAJOR: hardcoded bucket→default bucket, auth deletion only ignore user-not-found, paged batches for hard delete, Firestore transaction for undelete with expiry check, rollback soft-delete if Firestore fails, block admin self-deletion; 8 MEDIUM: zod validation with trim/max, stale state fix with uid capture, reset dialog on user change, NaN prevention, timeout cleanup ×2, accessibility keyboard listeners ×2; 4 MINOR: structured logging types, ARIA attributes, URL redaction, whitespace trim). **KEY LESSONS: (1) Use admin.storage().bucket() not hardcoded names; (2) Only ignore auth/user-not-found to prevent orphaned accounts; (3) Process batches until empty, not just first 50.**                                                                                                                                          |
| 9.2     | 2026-01-17 | Review #177: Qodo PR #273 - 3 items (1 MAJOR: use `--no-verify` instead of `HUSKY=0` env for CI hook bypass - more explicit/standard; 2 MINOR: trailing slash consistency for `functions/src/admin/` trigger, fix Session #XX→#72 comment). **KEY LESSON: `git commit --no-verify` is more explicit and standard than HUSKY env var for bypassing hooks in CI.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 9.1     | 2026-01-17 | Review #176: Qodo Round 4 - 7 items (1 SECURITY: path traversal hardened in check-docs-light.js with resolve()+startsWith()+sep for Windows drive letter handling; 2 BUG: CRLF JSONL parsing via .trim() before JSON.parse, pipe-safe table parsing using fixed positions from end; 3 DATA: EFFP-\*→engineering-productivity category mapping, self-dependency filtering to prevent loops, omit empty cwe fields; 1 CI: auto-Prettier in npm script chain). **KEY LESSON: resolve()+startsWith()+sep handles Windows paths safely - regex-based path traversal can be bypassed with different drive letters.**                                                                                                                                                                                                                                                                                                      |
| 9.0     | 2026-01-17 | Review #175: Qodo Round 3 - 10 items (2 SECURITY: path traversal in check-docs-light.js fixed with /^\.\.(?:[\\/]\|$)/.test(rel), markdown injection prevented with safeCell() escaping; 4 ROBUSTNESS: merged*from ID indexing for stable dependency lookups, blank ROI→undefined handling, REPO_ROOT for cwd-independent paths, ID prefix→category mapping for SEC-010; 2 PERFORMANCE: category bucket cap at 250 to prevent O(n²) blowup; 1 CI: try/catch for all readFileSync + pathExclude update). \*\*KEY LESSON: ID prefix (SEC-*, PERF-\_) is authoritative for category - subcategory metadata can be inconsistent.\*\*                                                                                                                                                                                                                                                                                    |
| 8.9     | 2026-01-17 | Review #174: Qodo Round 2 - 4 items (1 HIGH: multi-pass deduplication until fixpoint - merged items may match new candidates; 2 MEDIUM: ROI normalization to uppercase for consistent scoring, O(1) ID index for DEDUP->CANON lookups; 1 CI: Prettier on regenerated output files). **KEY LESSON: Single-pass deduplication is incomplete when merges create new match opportunities - iterate until fixpoint.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8.8     | 2026-01-17 | Review #173: Qodo Code Suggestions - 5 items (1 HIGH: section-based backlog parsing to avoid missing items with long content; 4 MEDIUM: full merge ancestry preservation, confidence field normalization number→string, deduplication O(n²)→O(n·bucket) with pre-bucketing; 1 CI: Prettier formatting on MASTER_ISSUE_LIST.md). **KEY LESSON: Pre-bucketing by file/category before O(n²) deduplication dramatically reduces comparisons.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 8.7     | 2026-01-17 | Review #172: SonarCloud Regex Complexity + Code Smells - 7 items (1 MAJOR: regex complexity 24>20 in table parsing; 6 MINOR: catch param naming, exception handling, replaceAll() preferences). **KEY LESSON: Complex table-parsing regex should be split into multiple simpler patterns or use a step-wise parsing approach.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 8.6     | 2026-01-17 | Review #171: aggregate-audit-findings.js PR Hardening - 29 items (6 MAJOR: 3 ReDoS regex vulnerabilities, 2 cognitive complexity refactors, 1 algorithmic DoS; 13 MINOR: outputDir guard, error sanitization, unused variables, Array() syntax; 10 TRIVIAL: replaceAll(), Prettier; 2 DEFERRED: CLI logging style, local file access). **KEY LESSON: Pattern compliance scripts need same security rigor as production code.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 8.5     | 2026-01-17 | Review #170: Non-Plain Object Redaction + GCP URL Whitelist - 10 items (3 MAJOR: non-plain object redaction bypass, GCP URL whitelist for open redirect, set() merge vs update(); 6 MINOR: adminGetLogs access log, structured storage cleanup errors, typeof for rollback value, Number.isFinite for userCount, cursor type validation, useEffect unmount guard, always-mounted tab panels; 1 REJECTED: Zod validation details - admin endpoint acceptable). **KEY LESSON: isPlainObject() returns non-plain objects unchanged - must serialize to safe representation.**                                                                                                                                                                                                                                                                                                                                          |
| 8.4     | 2026-01-17 | Review #169: ReDoS + Rollback Fix + Console Redaction - 8 items (3 MAJOR: ReDoS in email regex, rollback uses prev privilege not 'free', redact console output; 5 MINOR: severity clamp, metadata type check, string cursor sentinels, typeof userCount checks; 2 REJECTED: 5th index scope flip-flop, storage risk-accepted). **KEY LESSON: Console output bypasses Firestore redaction - must redact metadata before logging.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 8.3     | 2026-01-17 | Review #168: Claims Rollback + JSON Safety - 7 items (4 MAJOR: rollback Firestore on claims failure, toJsonSafe for Timestamps, sentinel timestamps for cursors, error key redaction; 3 MINOR: Array.isArray in adminSetUserPrivilege, tabpanel ARIA elements, userCount N/A display). **KEY LESSON: Claims can fail after Firestore write - need try/catch rollback for atomicity.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 8.2     | 2026-01-17 | Review #167: Asymmetric Privilege Security + Robustness - 14 items (2 CRITICAL: CI Prettier, asymmetric privilege order GRANT:Firestore→claims REVOKE:claims→Firestore; 4 MAJOR: block privilege deletion in use, pagination cursor stability, truncate log fields, structured error logging; 8 MINOR: ARIA tabs semantics, tablist role, userCount nullable, label fix, metadata validation, privilege sanitization, Array.isArray guard, type-only React import; 1 REJECTED: 4th flip-flop on index scope). **KEY LESSON: Privilege changes need asymmetric fail-safe order - grant=Firestore-first, revoke=claims-first.**                                                                                                                                                                                                                                                                                       |
| 8.1     | 2026-01-17 | Review #166: Track A CI Fixes & Robustness - 16 items (3 CRITICAL: CI TS error from #165 JSX.Element→React.ComponentType, missing version history; 4 MAJOR: privilege update order, userCount fallback, storeLogInFirestore error sanitization, userId validation; 2 MINOR: preserve non-plain metadata, normalize privilege defaults; 7 REJECTED: 3rd flip-flop on index scope, risk-accepted issues, duplicates). **KEY LESSON: JSX.Element requires React import; React.ComponentType is safer. AI keeps flip-flopping on index scope - ALWAYS verify against code.**                                                                                                                                                                                                                                                                                                                                            |
| 8.0     | 2026-01-17 | Review #165: Track A Follow-up Qodo Compliance - 12 items (1 CRITICAL: CI Prettier blocker; 4 MAJOR: raw error logging, pagination loop guard, isPlainObject metadata, REVERT #164 index scope error; 2 MINOR: storage deploy cmd, button a11y; 1 TRIVIAL: React namespace type; 4 REJECTED: message PII redesign, compliance-only). **KEY LESSON: Verify AI suggestions against actual code - #164 gave wrong advice about COLLECTION_GROUP vs COLLECTION scope.** New patterns: isPlainObject() for metadata redaction, pagination loop guards. ⚠️ **NOTE: JSX.Element change caused TS2503 - reverted in #166.**                                                                                                                                                                                                                                                                                                 |
| 7.9     | 2026-01-17 | Review #164: Track A Cherry-Pick PR Qodo Compliance - 10 items (1 CRITICAL: Firestore index queryScope; 3 MAJOR: PII in logs, storage pagination, metadata redaction on read; 3 MINOR: structured logging, array validation, Storage ACL docs; 3 REJECTED: risk-accepted Firestore logging, compliance-only items). New patterns: COLLECTION_GROUP for collection group queries, paginate bucket.getFiles(), redact metadata on read for defense-in-depth. ⚠️ **NOTE: Index scope change was INCORRECT - reverted in #165.**                                                                                                                                                                                                                                                                                                                                                                                        |
| 7.8     | 2026-01-17 | Review #163: Track A PR Follow-up Compliance - 12 items (5 MAJOR: per-item error handling, transaction for privilege updates, auth error propagation, schema validation, raw error UI; 5 MINOR: rename cleanupOldDailyLogs, null for claims, listDocuments, built-in types guarantee, observability note; 2 TRIVIAL: storage ACL docs, message PII risk-accept). New patterns: Per-item error handling in jobs, Firestore transactions for updates, listDocuments() for ID-only queries.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 7.7     | 2026-01-16 | Review #162: Track A Admin Panel PR Feedback - 22 items (1 CRITICAL: CI blocker README formatting; 8 MAJOR: error swallowing, PII in logs, claims bug, orphan detection, N+1 queries; 11 MINOR: UX improvements; 2 DEFERRED to roadmap). New patterns: Metadata redaction, preserve custom claims, collectionGroup queries, batch auth lookups.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 7.6     | 2026-01-16 | Review #161: lint-staged PR Feedback - 3 items (2 MAJOR: supply-chain risk with npx, hidden stderr errors; 1 MINOR: README/ROADMAP Prettier formatting). New patterns: Use `npx --no-install` for security, expose hook error output for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 7.5     | 2026-01-16 | Review #160: PR #265 Qodo Suggestions - 2 items (2 MINOR: scope getConsolidationStatus to section for robustness, normalize paths for cross-platform matching). New patterns: Scope document section parsing to prevent accidental matches elsewhere, normalize backslashes + lowercase for Windows compatibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 7.4     | 2026-01-16 | Review #159: PR #265 CI Round 3 - 6 items (1 MAJOR: false positive readFileSync:413 - add to pathExclude; 5 MINOR: remove unused path import, unused \_error→\_, stdout/stderr logging for debugging, quiet mode output suppression, TTY-aware colors). New patterns: Update pathExclude for verified try/catch files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7.3     | 2026-01-16 | Review #158: PR #265 CI Round 2 - 8 items (3 MAJOR: unsafe error.message at check-cross-doc-deps.js:280, readFileSync without try/catch at run-consolidation.js:386, git option injection missing -- separator; 5 MINOR: escape regex in dynamic RegExp, ESM→CommonJS consistency, scope updateConsolidationCounter to section, path matching improvements, session-start warnings counter). 2 REJECTED: audit context + unstructured logs are intentional CLI design. New patterns: Always use -- before paths in git commands, escape user input in RegExp constructors.                                                                                                                                                                                                                                                                                                                                          |
| 7.2     | 2026-01-16 | Review #157: PR #265 Session #69 Feedback - 11 items (1 MAJOR: ReDoS prevention bounded regex; 6 MINOR: execFileSync for getStagedFiles, verbose logging, TTY-aware colors, regex validation, exit code warning, path.basename matching; 4 TRIVIAL: unused imports, pre-commit override hint, Prettier). 1 REJECTED: Qodo false positive on exitCode definition. New patterns: Bound regex quantifiers for ReDoS, TTY-aware ANSI colors, path.basename for file matching.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7.1     | 2026-01-16 | Review #156: Security Hardening & Pre-Push Fix - 4 items (2 MAJOR: pre-push scans pushed commits not staged, --file path traversal protection; 2 MINOR: backlog excludes Rejected Items, cross-platform regex). New patterns: Pre-push vs pre-commit file selection, path traversal in CLI args, cross-platform regex.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7.0     | 2026-01-16 | Review #155: Security Check Self-Detection & CI Fix - 4 items (2 MAJOR: security-check.js/check-pattern-compliance.js SEC-002 self-exclusion; 2 MINOR: CI workflow boolean flag for --all detection, session-start.js execSync timeout/maxBuffer). New patterns: Self-referential exclusion for security scanners, multiline output comparison in GitHub Actions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6.9     | 2026-01-15 | Review #154: Admin Error Utils Security Hardening - 5 items (5 MINOR: URL credential/port rejection, JWT token redaction, phone regex separator requirement, boundary test fix). New patterns: URL credential injection prevention, JWT base64url detection, phone regex precision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6.8     | 2026-01-15 | Review #153: Admin Error Utils Follow-up - 6 items (1 CRITICAL: CI blocker transient, 5 MINOR: TLD regex bound {2,63}, large input guard 50K chars, nullable types on all 3 functions with tests). New patterns: TLD max 63 chars per RFC, guard against large payloads, explicit nullable types for robustness.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 6.7     | 2026-01-15 | Review #152: Admin Error Utils PR Feedback - 7 items (1 CRITICAL: CI blocker already resolved, 1 MAJOR: email regex ReDoS fix with RFC 5321 length limits, 1 MINOR: trim whitespace dates, 2 TRIVIAL: code cleanup, 2 REJECTED: SonarCloud false positives on security tests). New patterns: Regex ReDoS prevention with length limits, security test false positives in SonarCloud.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 6.6     | 2026-01-15 | Review #148: Dev Dashboard Security Hardening - 8 items fixed (3 MAJOR: Prettier blank line, raw error exposure, client write-only; 5 MINOR: network errors, stale state, null guard, safe error extraction, non-nullable prop). New patterns: Never expose raw Firebase errors, dev data client read-only, defensive null guards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6.5     | 2026-01-15 | Review #147: CI Blocker Fixes + Firebase Error Handling - 7 items (1 CRITICAL: logger.debug TS2339; 3 MAJOR: ROADMAP date format, Firestore dev/\* rules, Firebase error specificity; 3 MINOR: token refresh, network errors, errorCode logging). New patterns: prettier-ignore for linter conflicts, explicit admin rules for dev collections, getIdTokenResult(true) for fresh claims.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6.4     | 2026-01-14 | Review #145: Settings Page Accessibility & Security - 14 items (5 MAJOR: toggle accessibility, date validation, preference preservation, timezone bug, form labels; 9 MINOR: useAuth deprecated, props readonly, silent return, error logging, audit logging, change detection). New patterns: Accessible toggle (button+role=switch), local date formatting, preference spread.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 6.3     | 2026-01-13 | Review #141: PR Review Processing Round 3 - 5 items (1 MEDIUM: schema category token normalization, 4 LOW: grep -E portability, header verification coverage). New patterns: Schema category enums should be single CamelCase tokens without spaces, always use grep -E for alternation patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6.2     | 2026-01-13 | Review #140: PR Review Processing Round 2 - 7 items (1 MEDIUM: grep xargs hang fix, 6 LOW: category enum alignment, improved grep patterns for empty catches and correlation IDs, grep portability fixes). New patterns: Use while read instead of xargs, align category names with schema enums.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6.1     | 2026-01-13 | Review #139: PR Review Processing - 11 items (2 MAJOR: missing YAML frontmatter in slash commands, 8 MINOR: documentation lint fixes, grep pattern improvements, Debugging Ergonomics category added to audit-code). New patterns: Commands need YAML frontmatter, Tier-2 docs need Purpose/Version History sections.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6.0     | 2026-01-12 | ARCHIVE #3: Reviews #61-100 → REVIEWS_61-100.md (1740 lines removed, 3170→1430 lines). Active reviews now #101-136. Session #58.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5.9     | 2026-01-12 | CONSOLIDATION #11: Reviews #121-136 → CODE_PATTERNS.md v1.7 (16 new patterns: 6 Security, 4 JS/TS, 5 CI/Automation, 1 GitHub Actions). Counter reset. Session #57.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 5.8     | 2026-01-12 | Review #136: PR CI Feedback Round 3 (SonarQube + Qodo + CI) - 14 items. Fixed: 7 MAJOR security (admin.ts PII logging sanitized - log queryLength/queryType instead of raw query, leaky error message in adminTriggerJob, Firestore auto-ID instead of Date.now() for collision resistance, id field placement after spread, HttpsError preservation in migrateAnonymousUserData, meetings.ts batch delete chunking for 500-doc limit, use-journal.ts sanitization order - script/style before tags), 3 MAJOR quality (Array.isArray guards in generateSearchableText, unused deps added to knip ignore), 4 MINOR (GLOBAL_EXCLUDE added to pattern checker for dev utility scripts with pre-existing debt). New pattern: Chunk batch operations under Firestore 500-op limit. Session #55.                                                                                                                          |
| 5.7     | 2026-01-12 | Review #135: PR Cherry-Pick CI Feedback Round 2 (Qodo + CI) - 10 items. Fixed: 6 MAJOR (Prettier formatting 518 files, dependency issues - removed @modelcontextprotocol/sdk + undici, added globals + postcss-load-config, duplicate exports in error-boundary.tsx, pattern compliance pathExclude for meta-detection, matchesWord() wildcard support for ".?" patterns), 4 MINOR (coderabbit exit code opt-in via CODERABBIT_EXIT_ON_FINDINGS env var, pattern-check.js cross-platform path handling using path.sep). Pre-existing issues documented in ROADMAP.md. Session #55.                                                                                                                                                                                                                                                                                                                                  |
| 5.6     | 2026-01-12 | Review #134: PR Cherry-Pick CI Feedback (Qodo + CI) - 12 items. Fixed: 7 MAJOR (session-start.js path containment security bug using path.relative(), add rel === "" checks to 5 hook files, escape regex in analyze-user-request.js), 5 MINOR (detect sensitive paths in coderabbit-review.js, cap file sizes, exit non-zero on findings, trim input, secure logging). Verified 4 false positives from pattern checker (readFileSync already in try/catch). New pattern: Include rel === "" in all path.relative() containment checks. Session #55.                                                                                                                                                                                                                                                                                                                                                                |
| 5.5     | 2026-01-12 | Review #133: PR #238 Round 3 (Qodo + CI) - 12 items. Fixed: 6 MAJOR (JSON arg parsing + path containment + sensitive file filter in coderabbit-review.js, path.relative() containment in check-write/edit-requirements.js + check-mcp-servers.js, lockfile hash null handling in session-start.js), 5 MINOR (filter empty server names, check error/signal in pattern-check.js, wrap realpathSync, stderr for messages, path.relative in pattern-check.js). New patterns: Use path.relative() for robust cross-platform containment, return null not 'unknown' on hash failures, filter sensitive files before external tool calls. Session #55.                                                                                                                                                                                                                                                                    |
| 5.4     | 2026-01-12 | Review #132: PR #238 Compliance Fixes (Qodo + CI) - 14 items. Fixed: 1 MAJOR command injection (quote $ARGUMENTS in settings.json for coderabbit-review.js), 1 MAJOR project dir validation (pattern-check.js), 4 MINOR security hardening (Windows backslash normalization, option-like/multiline path rejection in check-write/edit-requirements.js), 3 MINOR (combine stdout+stderr in pattern-check.js, file size cap DoS protection in check-mcp-servers.js, TOCTOU try/catch in coderabbit-review.js), 2 MINOR (5s timeout for hasCodeRabbit(), CLI arg ordering fix --plain before --), 1 FIX (dead else-if ESLint error). New patterns: Quote all shell arguments, normalize Windows paths for cross-platform, cap file sizes before reads. Session #55.                                                                                                                                                    |
| 5.3     | 2026-01-12 | Review #131: PR #238 CI Fix (ESLint + Qodo Compliance) - 17 items. Fixed: 7 CRITICAL ESLint errors in all .claude/hooks/_.js files (no-undef for process/console/require - use `/_ global require, process, console _/`for flat config), 1 MAJOR command injection (execSync→spawnSync in pattern-check.js), 3 MAJOR path traversal (use path.resolve + containment check), 2 MINOR (remove 'design' keyword ambiguity, fix unused 'error' var), 4 MINOR (useless escape, unused import). New patterns: Use`/_ global _/`not`/_ eslint-env \*/` for ESLint flat config, use spawnSync for safe subprocess calls. Session #55.                                                                                                                                                                                                                                                                                       |
| 5.2     | 2026-01-12 | Review #130: PR #236 Round 4 (SonarQube + Qodo) - 27 items parsed across 2 rounds. Fixed: 5 MAJOR (sensitive logging in admin search/journal/crud-table, error.message in alerts), 2 MINOR (doc lint patterns, midnight refresh for daily quote). 16 items verified ALREADY FIXED from #127-129. New pattern: Log errorType/errorCode only, use generic user-facing messages. Session #54.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 5.1     | 2026-01-12 | Review #129: PR #236 Post-Commit Feedback (SonarQube + Qodo) - 9 items on new code (2 CRITICAL: cognitive complexity refactor, production reCAPTCHA fail-closed; 4 MAJOR: cache failures, initial state alignment, localStorage try/catch, error cause chain; 3 MINOR: globalThis.window, Intl.DateTimeFormat, secure logging). New patterns: Extract helpers to reduce complexity, fail-closed security in production, cache error states to prevent retry storms, use globalThis over window for SSR. Session #53.                                                                                                                                                                                                                                                                                                                                                                                                |
| 5.0     | 2026-01-11 | Review #128: PR #236 Follow-up (Qodo) - 5 items (1 HIGH: Sentry IP privacy fix; 1 MEDIUM: CI arg separator; 1 DEFERRED: doc ID hashing; 2 ALREADY DONE from #127). New patterns: Third-party PII hygiene, CLI arg injection prevention. Session #52.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 4.9     | 2026-01-11 | Review #127: PR #236 Comprehensive Review (SonarQube + Qodo) - 14 items (3 CRITICAL: pin GitHub Action SHA, harden reCAPTCHA bypass, fix IPv6 normalization; 4 MAJOR: regex precedence, sanitize error messages, reset journalLoading; 6 MINOR: operationName granularity, CI main-only push, simplify IP retrieval, audit trails, log sensitivity). Session #50.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4.8     | 2026-01-11 | Review #126: Tier-2 Output PR Feedback Round 3 (Qodo) - 4 items (3 MINOR: HUMAN_SUMMARY merged IDs column for traceability, CANON_QUICK_REFERENCE enum clarification, AUDIT_PROCESS_IMPROVEMENTS normalize:canon fallback note; 1 TRIVIAL: version header already 4.7). All applied. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4.7     | 2026-01-11 | Review #125: Tier-2 Output PR Feedback Round 2 (Qodo) - 4 items (2 MINOR: HUMAN_SUMMARY DEDUP IDs in Top 5 table, PR_PLAN.json PR3 dedup IDs; 1 TRIVIAL: version header 4.5→4.6). 1 rejected (assign PR19 to App Check items - PR19 doesn't exist, "-" is correct). Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4.6     | 2026-01-11 | Review #124: Tier-2 Output PR Feedback (Qodo) - 9 items (1 MAJOR rejected: project management tools - static docs intentional for AI context; 6 MINOR: PR_PLAN dedup IDs, REFACTOR_BACKLOG PR associations, PR-LINT reference, HUMAN_SUMMARY next steps, included_dedup_ids field; 2 TRIVIAL: npm script note, hardcoded count). 1 rejected (CANON-0005 distinct from DEDUP-0001: client vs server App Check). New pattern: Dedup IDs should be explicitly linked in PR plans. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 4.5     | 2026-01-11 | Review #123: TIER-2 AGGREGATION (Task 4.3.1-4.3.6) - Cross-category unification of 118 CANON findings. Output: 97 unique findings (21 merged as duplicates), 12 duplicate clusters identified, 21 PRs planned. Key findings: 5 S0 Critical (memory leak, legacy writes, CI gates, complexity, App Check), 32 S1 High, 42 S2 Medium, 18 S3 Low. Comprehensive scope: CANON + SonarQube (548) + ESLint (246) = ~891 total. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 4.4     | 2026-01-11 | Review #122: PR #232 Round 2 - 3 items (1 MEDIUM: CRLF normalization + regex whitespace; 2 LOW: process.exitCode for buffer flush, bash version check). New patterns: Normalize CRLF for cross-platform, use process.exitCode over process.exit(), check BASH_VERSION for bash-specific scripts. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 4.3     | 2026-01-11 | Review #121: PR #232 Qodo/SonarCloud - 13 items (4 MAJOR: exit code docs, stderr suppression, large JSON gitignore, CI trigger syntax; 5 MINOR: line counting, script detection, archive parsing, repo-root path, try/catch; 3 LOW: NaN guard, glob reliability, merge conflict). New patterns: Document all exit codes, capture stderr for debugging, gitignore large generated files. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 4.2     | 2026-01-11 | CONSOLIDATION #10: Reviews #109-120 → CODE_PATTERNS.md v1.6 (5 new patterns: 3 Security, 2 JS/TS). Counter reset. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4.1     | 2026-01-11 | Review #120: PR #228 Qodo Round 3 - 4 items (2 URGENT prototype pollution/secure logging, 1 HIGH fail-fast validation, 1 MEDIUM GitHub Actions workflow undefined fix). CANON-0043 verified correct. New patterns: Use Map for untrusted keys, never log raw input content, fail-fast on parse errors. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 4.0     | 2026-01-11 | Review #119: PR #228 Qodo Round 2 - 9 items (2 MAJOR NaN-safe sorting/missing-ID validation, 6 MINOR category normalization/coverage output/session tracking/finding count, 1 TRIVIAL trailing newline). Deferred: JSON Schema migration. New pattern: Ensure numeric fields have robust fallbacks for sorting. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 3.9     | 2026-01-11 | Review #118: PR #228 Follow-up Feedback - 1 item (1 HIGH report-to-JSONL ID mismatches). Updated 3 markdown audit reports + CANON-REFACTOR.jsonl to use normalized CANON-XXXX IDs. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3.8     | 2026-01-11 | Review #117: PR #228 Qodo Feedback - 8 items (1 CRITICAL dependency ID rewriting bug in normalize script, 3 HIGH error handling/outdated IDs, 4 MEDIUM duplicate detection/category handling/FS error handling/legacy ID references). New patterns: CANON ID normalization must update all references including dependencies. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3.7     | 2026-01-11 | Review #116: PROCESS/AUTOMATION AUDIT (Task 4.2.6) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 38 raw findings → 14 canonical. Severity: S0 (1): non-blocking CI gates; S1 (3): script coverage, security scanning, deploy gcloud; S2 (6): pre-commit slow, workflow docs; S3 (4): permissions, false positives. **SUB-PHASE 4.2 COMPLETE** - All 6 audit categories finished. Session #46.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3.6     | 2026-01-11 | Review #115: DOCUMENTATION AUDIT (Task 4.2.5) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 37 raw findings → 14 canonical. Severity: S1 (2): broken links, [X] placeholders; S2 (8): Tier 2 metadata, orphaned docs; S3 (4): archive rot, fragile anchors. Session #46.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3.5     | 2026-01-10 | Review #114: REFACTORING AUDIT (Task 4.2.4) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 65 raw findings → 27 canonical. Severity: S0 (1): cognitive complexity; S1 (7): type drift, deprecated paths; S2 (15): duplication clusters; S3 (4): batch fixes. Session #45.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3.4     | 2026-01-09 | Review #113: PR #225 Comprehensive Compliance - 6 items (1 HIGH ampersand entity injection, 2 MEDIUM HTTPS enforcement/JSON parsing, 3 MINOR encodeURI/private:true/nullish coalescing). Session #39 continued.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3.3     | 2026-01-09 | Review #112: PR #225 Final Compliance - 6 items (3 HIGH injection/SSRF/stack-trace, 3 MEDIUM timeout/logging/archived-paths). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3.2     | 2026-01-09 | Review #111: PR #225 Compliance Fixes - 8 items (2 HIGH SSRF/secret exposure, 5 MEDIUM error handling/validation/performance, 1 LOW unstructured logging). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 3.1     | 2026-01-09 | Review #110: PR #225 Follow-up - 6 items (3 MAJOR path canonicalization/archive boundary/exclude boundary, 3 MINOR indented code blocks/recursion deferred). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3.0     | 2026-01-09 | Review #109: PR #225 Feedback - 16 items (2 CRITICAL FS error handling/error exposure, 4 MAJOR JSON mode/ReDoS/symlink/cross-platform, 9 MINOR, 1 TRIVIAL). Rejected framework suggestion. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2.9     | 2026-01-09 | CONSOLIDATION #9: Reviews #98-108 → CODE_PATTERNS.md v1.4 (18 patterns: 6 JS/TS, 4 Security, 3 CI/Automation, 3 Documentation, 2 General). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2.8     | 2026-01-09 | Review #108: Update Dependencies Protocol - new mandatory pattern for tightly-coupled docs. Added ⚠️ Update Dependencies to 4 key documents. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2.7     | 2026-01-09 | Review #107: PR #224 Feedback - 2 items (SSR guard, status label) + process fix (/fetch-pr-feedback auto-invoke). Consolidation threshold reached (10 reviews). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2.6     | 2026-01-08 | Review #106: PR Review Processing - 16 items (8 MAJOR ReDoS/path-traversal/ID-parsing/validation/threshold-consistency, 6 MINOR env-metadata/FP-patterns/scope-clarity, 2 TRIVIAL). Session #40.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2.5     | 2026-01-08 | Review #105: PR Review Processing - 17 items (4 MAJOR ReDoS/JSONL/schema, 9 MINOR docs/patterns, 4 TRIVIAL). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2.4     | 2026-01-08 | Review #104: PR Review Processing - 18 items (4 MAJOR security pattern/baselines/JSON metrics, 9 MINOR shell portability/INP metrics, 5 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2.3     | 2026-01-08 | Review #103: PR Review Processing - 10 items (2 MAJOR hasComplexityWarnings+getRepoStartDate, 5 MINOR JSON/docs, 3 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2.2     | 2026-01-08 | Review #102: PR Review Processing - 19 items (1 MAJOR cognitive complexity refactor, 5 MINOR date validation/node: prefix/Number.parseInt/String.raw, 10 TRIVIAL code style). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.1     | 2026-01-08 | Review #101: PR Review Processing - 36 items (12 Critical, 5 Major, 17 Minor, 2 Trivial). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2.0     | 2026-01-07 | CONSOLIDATION #8: Reviews #83-97 → CODE_PATTERNS.md v1.3 (6 Security Audit patterns, new category). Session #33 session-end cleanup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.99    | 2026-01-07 | Reviews #92-97: Security audit PR review feedback (6 reviews, 24 items total). Schema improvements: OWASP string→array, file_globs field, severity_normalization for divergent findings, F-010 conditional risk acceptance with dependencies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.93    | 2026-01-07 | Review #91: Audit traceability improvements (5 items) - 5 MINOR (severity_normalization field, adjudication field, F-010 severity in remediation, item count, log lines metric), 6 REJECTED (⚪ compliance items - doc-only PR, code fixes in Step 4B)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.92    | 2026-01-07 | Review #90: Security audit metadata fixes (7 items) - 5 MINOR (log lines metric, severity breakdown, secrets_management status, F-010 duplicate, Review #88 severity clarity), 1 TRIVIAL (hyphenation), 1 REJECTED (consolidation count)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.91    | 2026-01-07 | Review #89: Security audit documentation fixes (9 items) - 8 MINOR (F-010 severity, secrets_management status, duplicate model entry, SESSION_CONTEXT dates/status, active review range/count, progress percentage), 1 TRIVIAL (hyphenation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.90    | 2026-01-07 | Review #88: SECURITY AUDIT (Phase 4.2) - Multi-AI aggregated audit (Claude Opus 4.5 + ChatGPT 5.2), 10 canonical findings. Severity: S0 (1): F-001 Firestore bypass; S1 (2): F-002 rate-limiting, F-003 reCAPTCHA; S2 (6): F-004–F-009; S3 (1): F-010 risk-accepted. Overall: NON_COMPLIANT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.89    | 2026-01-07 | Review #87: Schema symmetry & markdown syntax (4 fixes) - 1 MAJOR (QUALITY_METRICS_JSON null schema), 3 MINOR (stray code fences in PROCESS/REFACTORING/DOCUMENTATION)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.88    | 2026-01-07 | Review #86: Qodo follow-up on Review #85 (3 fixes, 1 rejected) - 1 MINOR (broken link), 2 TRIVIAL (Bash-only clarity, copy-safe snippet), 1 REJECTED (duplicate pathspec separator)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.87    | 2026-01-07 | Review #84-85: Process quality improvements - #84: Review #83 follow-up (4 metadata fixes), #85: Qodo suggestions on Review #84 commit (3 fixes: git verification, threshold clarity, archive status)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.86    | 2026-01-07 | Review #83: Archive & Consolidation Metadata Fixes (5 fixes) - 1 REJECTED (false positive: #41 data loss), 1 MAJOR (broken links), 1 MINOR (status sync), 2 TRIVIAL (line count, wording)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.85    | 2026-01-07 | CONSOLIDATION #7: Reviews #73-82 → CODE_PATTERNS.md v1.2 (9 patterns: 3 Bash/Shell portability, 6 Documentation quality)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.84    | 2026-01-07 | ARCHIVE #2: Reviews #42-60 → REVIEWS_42-60.md (1048 lines removed, 2425→1377 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.83    | 2026-01-07 | Review #82: Post-commit review fixes (6 items) - 0 MAJOR, 5 MINOR (review range, Last Updated date, SECURITY.md path, markdown formatting, CANON-0032 status), 1 TRIVIAL (code fence), 1 HIGH-LEVEL (generator fix recommendation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.82    | 2026-01-07 | Review #81: Documentation linter fixes (57 errors) - 3 MAJOR (missing ARCHITECTURE.md/DEVELOPMENT.md links, missing Purpose in claude.md), 8 MINOR (broken links, missing sections), 4 TRIVIAL (date placeholders, metadata)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.81    | 2026-01-07 | Review #80: 3 fixes - 2 MINOR (PR_PLAN.json structured acceptance_tests, CANON-CODE.jsonl source identifiers), 1 TRIVIAL (document version sync)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.80    | 2026-01-06 | Review #79: 10 fixes, 1 rejected - 3 MAJOR (JSONL parser-breaking output in 3 templates), 4 MINOR (bash portability, JSON validity, path clarity, count accuracy), 3 TRIVIAL (metadata consistency) - rejected 1 suggestion contradicting established canonical format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.79    | 2026-01-06 | Review #78: 12 fixes - 2 MAJOR (invalid JSONL NO-REPO output, missing pipefail in validator), 7 MINOR (JSON placeholders, NO-REPO contract, markdown links, category count, model names, audit scope, last updated date), 3 TRIVIAL (review range, version history, model name consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.78    | 2026-01-06 | Review #77: 9 fixes - 2 MAJOR (shell script portability, broken relative links), 5 MINOR (invalid JSONL, severity scale, category example, version dates, review range), 2 TRIVIAL (environment fields, inline guidance)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.77    | 2026-01-06 | Review #76: 13 fixes - 3 MAJOR (model naming, broken link paths, PERFORMANCE doc links), 8 MINOR (SECURITY root cause evidence, shell exit codes, transitive closure, division-by-zero, NO-REPO contract, category enum, model standardization, vulnerability type), 2 TRIVIAL (version metadata, review range)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.76    | 2026-01-06 | Review #75: 17 fixes - 2 MAJOR (SECURITY schema category names, vulnerability deduplication), 8 MINOR (regex robustness, JSONL validation, deduplication rules, averaging methodology, model matrix, link paths), 2 TRIVIAL (version verification, duplicate check), 1 REJECTED (incorrect path suggestion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.75    | 2026-01-06 | Review #74: 18 fixes - 6 MAJOR (broken links, schema fields, deduplication clarity, observability, placeholders, GPT-4o capabilities), 9 MINOR (fail-fast, URL filtering, NO-REPO MODE, environment, methodology, output specs, links, alignment), 3 TRIVIAL (version, dates, context)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.74    | 2026-01-06 | Review #73: 9 fixes - 2 MAJOR (model name self-inconsistency, NO-REPO MODE clarity), 4 MINOR (chunk sizing, regex, JSONL validation, stack versions), 3 TRIVIAL (documentation consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.73    | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 → CODE_PATTERNS.md v1.1 (10 Documentation patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.72    | 2026-01-06 | Review #72: 21 fixes - 12 CRITICAL (broken links to JSONL_SCHEMA, GLOBAL_SECURITY_STANDARDS, SECURITY.md, EIGHT_PHASE_REFACTOR), 5 MAJOR (version/stack placeholders), 4 MINOR (paths, regex, commands)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.71    | 2026-01-06 | Review #71: Documentation improvements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.70    | 2026-01-06 | Review #70: Template refinements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.69    | 2026-01-06 | Review #69: Multi-AI audit plan setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.68    | 2026-01-06 | Review #68: 17 fixes - 4 MAJOR (App Check path, SonarQube remediation, function rename, review ordering), 10 MINOR (sorting, grep, versions, regex, ranges), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.67    | 2026-01-06 | Review #67: 14 fixes - 4 MAJOR (grep -E, deterministic IDs, App Check tracking, SonarQube tracking), 7 MINOR (verification, enums, paths, ordering), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.66    | 2026-01-05 | Review #66: 13 fixes - 4 MAJOR (evidence rules, output format, npm safety, apiKey guidance), 8 MINOR (counters, grep portability, YAML, model names), 1 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.65    | 2026-01-05 | Review #65: 19 fixes - 4 MAJOR (security doc hardening, deterministic CANON IDs), 10 MINOR (paths, assertions, category names), 5 TRIVIAL (model names)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.64    | 2026-01-05 | Review #64: 31 fixes - 6 MAJOR (security pseudocode, Firebase key clarity, grep hardening), 8 MINOR (progress calc, paths), 17 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.63    | 2026-01-05 | Review #63: 15 fixes total - 7 broken relative paths, 8 minor improvements (version entries, secrets example, tier notes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.62    | 2026-01-05 | Review #62: 10 fixes - 1 CRITICAL (client-side credentials), 4 MAJOR (schema, links, model), 5 MINOR/TRIVIAL (2 Minor, 3 Trivial)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.61    | 2026-01-05 | Review #61: Stale review assessment, path prefix fix, terminology update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.60    | 2026-01-05 | CONSOLIDATION #5: Reviews #51-60 → claude.md v2.9 (10 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.59    | 2026-01-05 | Review #60: Document sync, grep exclusion fix, CANON-ID guidance, duplicate link removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.58    | 2026-01-05 | Review #59: Prompt schema improvements, grep --exclude, Quick Start section, link text consistency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.57    | 2026-01-05 | Review #58: Template compliance (MULTI_AI_REFACTOR_AUDIT_PROMPT.md), link format consistency, American English                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.56    | 2026-01-05 | Review #57: CI fix (broken stub links), effort estimate arithmetic, optional artifact semantics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.55    | 2026-01-05 | Review #56: Effort estimate correction, remaining code fences, stub path references (PARTIAL FIX - see #57)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.54    | 2026-01-05 | Review #55: Nested code fence fixes, artifact naming, acceptance criteria, schema references                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.53    | 2026-01-05 | Review #54: Step 4B + SLASH_COMMANDS.md, broken archive links, code fence escaping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.52    | 2026-01-05 | Review #53: CI fix, regex bounding, path.relative() security                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.51    | 2026-01-05 | Review #52: Document health/archival fixes from Qodo/CodeRabbit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.50    | 2026-01-04 | RESTRUCTURE: Tiered access model, Reviews #1-40 archived (3544→~1000 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.49    | 2026-01-04 | Review #51: ESLint audit follow-up, infinite loop fix, regex hardening                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.48    | 2026-01-04 | EFFECTIVENESS AUDIT: Fixed 26→0 violations in critical files; patterns:check now blocking                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.47    | 2026-01-04 | CONSOLIDATION #4: Reviews #41-50 → claude.md v2.8 (12 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.46    | 2026-01-04 | Review #50: Audit trails, label auto-creation, .env multi-segment, biome-ignore                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.45    | 2026-01-04 | Review #49: Workflow hardening, robust module detection, dead code removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.44    | 2026-01-04 | Review #48: Security hardening, OSC escapes, fail-closed realpath, pathspec fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.43    | 2026-01-04 | Review #47: PII masking, sensitive dirs, printf workflow, fault-tolerant labels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.42    | 2026-01-04 | Review #46: Symlink protection, realpath hardening, buffer overflow, jq/awk fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.41    | 2026-01-04 | Review #45: TOCTOU fix, error.message handling, path containment, tier matching, PR spam                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.40    | 2026-01-03 | CONSOLIDATION #3: Reviews #31-40 → claude.md v2.7 (14 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

<details>
<summary>Older versions (click to expand)</summary>

| Version  | Date                     | Description                                              |
| -------- | ------------------------ | -------------------------------------------------------- |
| 1.39-1.0 | 2026-01-02 to 2026-01-03 | Reviews #1-40 (see [archive](./archive/REVIEWS_1-40.md)) |

</details>

---

## 📊 Tiered Access Model

This log uses a tiered structure to optimize context consumption:

| Tier   | Content                                                                                                                                                                                                        | When to Read                  | Size        |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------- |
| **1**  | [claude.md](../claude.md)                                                                                                                                                                                      | Always (in AI context)        | ~115 lines  |
| **1b** | [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)                                                                                                                                                              | When investigating violations | ~190 lines  |
| **2**  | Quick Index (below)                                                                                                                                                                                            | Pattern lookup                | ~50 lines   |
| **3**  | Active Reviews (#180-198)                                                                                                                                                                                      | Deep investigation            | ~850 lines  |
| **4**  | Archive ([#1-40](./archive/REVIEWS_1-40.md), [#42-60](./archive/REVIEWS_42-60.md), [#61-100](./archive/REVIEWS_61-100.md), [#101-136](./archive/REVIEWS_101-136.md), [#137-179](./archive/REVIEWS_137-179.md)) | Historical research           | ~5600 lines |

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
**Status:** ✅ Current **Next consolidation due:** After Review #222

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

- **Date:** 2026-01-29 (Session #114)
- **Reviews consolidated:** #184-#212 (29 reviews) **Last consolidated review:**
  #212
- **Patterns added to CODE_PATTERNS.md v2.4:**
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

### Archive 5: Reviews #137-179

- **Archive location:**
  [docs/archive/REVIEWS_137-179.md](./archive/REVIEWS_137-179.md)
- **Coverage:** 2026-01-13 to 2026-01-18
- **Status:** Reviews #137-179 archived (audit trail preserved).
- **Consolidation note:** See CODE_PATTERNS.md for consolidated patterns (latest
  as of 2026-01-20: v2.0 - CONSOLIDATION #13).

Access archives only for historical investigation of specific patterns.

---

## Active Reviews (Tier 3)

_No active reviews. All reviews through #201 have been consolidated and
archived._

---

_Reviews #180-201 have been archived to
[docs/archive/REVIEWS_180-201.md](./archive/REVIEWS_180-201.md). See Archive 6
(Consolidation #14: 2026-01-24)._

_Reviews #137-179 have been archived to
[docs/archive/REVIEWS_137-179.md](./archive/REVIEWS_137-179.md). See Archive 5._

---

#### Review #202: PR #311 Learning Effectiveness Analyzer + Security Infrastructure - Qodo (2026-01-24)

**Round 1:** 22 items (5 CRITICAL, 8 MAJOR, 7 MINOR, 2 TRIVIAL)

**CRITICAL (5):**

1. **Path traversal in --file option** - Added path.resolve + relative check +
   symlink detection
2. **TOCTOU race in safeWriteFile** - Removed existsSync, rely on atomic wx flag
3. **SSRF allowlist bypass** - Block localhost/loopback, IP addresses, require
   exact hostname match
4. **Symlinked archive reads** - Added lstatSync checks before reading archive
   files
5. **Duplicate review counting** - Added seenReviewNumbers Set for deduplication
   with --all-archives

**MAJOR (8):**

1. **CI: Regex /g with .test()** - Removed /g flag from boolean-only tests in
   check-pattern-sync.js
2. **CI: readFileSync without try/catch** - Wrapped 3 occurrences with proper
   error handling
3. **CI: Empty string path validation** - Added upfront check for falsy/empty
   paths
4. **Word-boundary matching** - Changed substring includes() to word-boundary
   regex
5. **Pattern ID fallbacks** - Added fallback IDs when sanitization produces
   empty string
6. **Email masking edge case** - Handle domains without dots gracefully
7. **Commit message newlines** - Already handled by sanitizeDisplayString
8. **readFileSync in safeReadFile** - Already wrapped in try/catch (false
   positive)

**MINOR (7):**

1. **Markdown table malformed** - Fixed escaped pipe characters in regex in
   version history
2. Applied other minor code quality improvements

**Round 2:** 6 items (2 CRITICAL, 2 MAJOR, 2 MINOR)

**CRITICAL (2):**

1. **TOCTOU for overwrite** - Recheck symlink with lstatSync immediately before
   overwrite
2. **Regex DoS in getPatternDetails** - Replaced `[^]*?` with line-by-line
   parsing

**MAJOR (2):**

1. **safeRegexExec zero-length match** - Prevent infinite loops by advancing
   lastIndex
2. **False pattern matches** - Refined regex to only match explicit "Pattern #N"
   references

**MINOR (2):**

1. **Email masking subdomains** - Mask main domain, keep subdomains visible
2. **Pattern checker exclusions** - Added check-pattern-sync.js,
   security-helpers.js

**NEW PATTERNS:**

- (42) TOCTOU prevention: Use atomic flags (wx) instead of existsSync + write
- (43) SSRF hardening: Block localhost variants, IP addresses, require exact
  hostname match
- (44) Deduplication: Use Set to track seen items when combining multiple
  sources
- (45) Word-boundary matching: Use `\b` regex anchors instead of substring
  includes()
- (46) Regex DoS prevention: Use line-by-line parsing instead of unbounded lazy
  matches
- (47) Zero-length match handling: Advance lastIndex to prevent infinite loops

**Files Changed:** analyze-learning-effectiveness.js, security-helpers.js,
check-pattern-sync.js, AI_REVIEW_LEARNINGS_LOG.md

---

#### Review #204: Session #98 S0/S1 Guardrails PR - Qodo Compliance + CI (2026-01-26)

**Source:** Qodo PR Compliance + CI Failure Analysis **PR/Branch:**
claude/new-session-bt3vZ **Suggestions:** 7 total (Critical: 3, Major: 2,
Minor: 2)

**CRITICAL (3):**

1. **Subshell guardrail bypass** - Pre-commit hook used `echo | while` which
   creates a subshell where `AUDIT_FAILED=1` doesn't propagate. Fixed by using
   here-string `<<< "$STAGED_AUDIT_FILES"` instead of pipe.
2. **lint-staged knip false positive** - Knip flagged lint-staged as unused
   because it's only called from shell scripts, not JS imports. Added to
   `ignoreDependencies` in knip.json.
3. **readFileSync pattern compliance false positive** - audit-s0s1-validator.js
   L216 IS in try/catch (L214-221). Added to pathExcludeList.

**MAJOR (2):**

1. **UTC timezone bug in getNextDay** - Non-UTC date parsing could cause
   off-by-one errors across timezones. Fixed by parsing as UTC midnight
   (`dateString + "T00:00:00Z"`) and using `setUTCDate()`/`getUTCDate()`.
2. **Command injection concern** - Date strings interpolated into git commands.
   Already mitigated by `sanitizeDateString()` which validates against strict
   ISO pattern and returns only valid dates.

**MINOR (2):**

1. **ROLLOUT_MODE env-configurable** - Made audit hook mode configurable via
   `AUDIT_S0S1_MODE` environment variable for gradual rollout.
2. **Duplicate validation constants** - Noted duplication between
   audit-s0s1-validator.js and validate-audit.js. Deferred centralization to
   future cleanup.

**NEW PATTERNS:**

- (48) **Pipe subshell variable isolation**: `echo | while` runs loop in
  subshell where variable assignments don't propagate. Use here-string
  `<<< "$var"` or process substitution to keep loop in current shell.
- (49) **UTC date arithmetic**: When doing date math, parse as UTC midnight and
  use UTC methods to avoid timezone-related off-by-one errors.

**Round 2** (Post 368228e): 5 additional items

**CRITICAL (2):**

1. **Path traversal in audit-s0s1-validator.js** - isAuditFile() regex allowed
   `../` segments. Fixed by: rejecting path traversal patterns, path containment
   validation, symlink rejection.
2. **Trap cleanup bug** - `trap 'rm -f "$TEST_TMPFILE" "$AUDIT_TMPFILE"'`
   overwrites previous trap. Added 2>/dev/null for safety.

**MAJOR (2):**

1. **Fail-closed on invalid dates** - getNextDay() returned original string on
   parse failure (potential command injection if sanitization fails). Changed to
   return empty string.
2. **Silent JSONL parse failures** - parseJSONLContent() silently skipped
   invalid lines. Now tracks `_parseError` to prevent S0/S1 evasion.

**MINOR (1):**

1. **Normalize ROLLOUT_MODE** - Added `.trim().toUpperCase()` and EFFECTIVE_MODE
   for robust env var handling.

**NEW PATTERNS (Round 2):**

- (50) **Path containment validation**: Use `path.relative()` + startsWith("..")
  check after `path.resolve()` to prevent traversal.
- (51) **Fail-closed parsing**: Return empty/default values on parse failure
  rather than echoing potentially malicious input.

**Resolution (Total):**

- Fixed: 11 items (6 in Round 1 + 5 in Round 2)
- Deferred: 1 item (duplicate constants - minor, non-blocking)
- Rejected: 1 item (unstructured logs - advisory only, local tooling)

**Files Changed:** .husky/pre-commit, knip.json,
scripts/check-pattern-compliance.js, scripts/check-review-needed.js,
.claude/hooks/audit-s0s1-validator.js

---

#### Review #211: Session #103 Testing Infrastructure PR - Qodo + SonarCloud + CI (2026-01-27)

**Source:** Qodo PR Compliance + SonarCloud + CI Failure Analysis **PR/Branch:**
claude/resume-previous-session-D9N5N **Suggestions:** 18 total (MAJOR: 5, MINOR:
6, TRIVIAL: 1, DEFERRED: 2, REJECTED: 1)

**Files Modified:**

- `scripts/check-roadmap-health.js` - 11 fixes
- `docs/plans/TESTING_INFRASTRUCTURE_PLAN.md` - 1 fix

**MAJOR (5):**

1. **readFile error handling with context** - Added `instanceof Error` check
   before accessing `.message` and `.code` properties. Pattern compliance
   requires safe error property access.

2. **CRLF regex line 89 (Milestones Overview)** - Changed regex to use `\r?\n`
   for cross-platform CRLF compatibility in milestone table parsing.

3. **CRLF regex line 107 (Sprint Section)** - Changed regex to use `\r?\n` for
   cross-platform CRLF compatibility in sprint section parsing.

4. **Bug L141 conditional same value** - Removed redundant ternary that returned
   same value regardless of condition. Changed from
   `rows.length > 0 ? rows[0][1] : rows[0][1]` to proper null check.

5. **Path traversal prevention** - Replaced `startsWith("..")` with regex
   `/^\.\.(?:[\\/]|$)/.test(rel)` to handle edge cases like "..hidden.md" and
   cross-platform path separators. Combined with `path.relative()` and
   `path.isAbsolute()` for complete protection.

**MINOR (6):**

1. **Test factory counter vs Date.now()** - Changed test data factory example in
   TESTING_INFRASTRUCTURE_PLAN.md to use counter-based unique IDs instead of
   `Date.now()` to avoid race conditions in parallel tests.

2. **Warning for skipped ROADMAP_FUTURE checks** - Added `console.warn()` when
   ROADMAP_FUTURE.md cannot be read, rather than silently skipping checks.

3. **Track naming regex excludes subsections** - Changed regex from
   `/### Track ([A-Z])/g` to `/### Track ([A-Z])(?:\s+-|\s*:)/g` to only match
   main track headers (e.g., "Track A - Name") and exclude subsections (e.g.,
   "Track A-Test", "Track A-P2").

4. **PG validation matches "Group" format** - PARALLEL_EXECUTION_GUIDE.md uses
   "Group 1" format while roadmap uses "⏸ PG1". Changed validation to extract
   from guide using `Group\s*(\d+)` regex for proper matching.

5. **Scoped version history regex** - Limited version search to Version History
   section only to avoid false matches from version numbers elsewhere in
   document.

6. **Session #102 → #103** - Updated script header comment to correct session
   number.

**TRIVIAL (1):**

1. Session number comment update in file header.

**DEFERRED (2):**

1. **MCP Memory vs Vector DB decision** - Architectural decision about knowledge
   graph vs vector database for context preservation. Deferred to later session.

2. **--fix CLI flag** - Auto-fix capability for validation script. Nice-to-have
   but not blocking.

**REJECTED (1):**

1. **Unstructured logging** - console.log is intentional for CLI tool output.
   Structured logging is overkill for local validation scripts.

**NEW PATTERNS (3):**

- **(63) Counter-based unique IDs for test factories** - Use incrementing
  counters instead of `Date.now()` to avoid collisions in parallel tests
- **(64) Scope regex to relevant section** - When searching for patterns like
  version numbers, extract the section first to avoid false positives
- **(65) Format matching for validation scripts** - When validating references
  between documents, ensure regex matches the actual format used in each
  document (e.g., "Group 1" vs "PG1")

#### Review #212: Session #103 CI Fix - Pattern Checker False Positives (2026-01-27)

**Source:** CI Failure Analysis **PR/Branch:**
claude/resume-previous-session-D9N5N **Suggestions:** 2 total (MAJOR: 2 - CI
blockers, both false positives)

**Files Modified:**

- `scripts/check-pattern-compliance.js` - 2 exclusion updates

**MAJOR (2 - CI BLOCKERS, BOTH FALSE POSITIVES):**

1. **readFileSync without try/catch at L39** - FALSE POSITIVE. The `readFile`
   function at L37-48 wraps `readFileSync` in a try/catch block. Pattern checker
   does simple line-by-line check without function context.
   - Fix: Added `check-roadmap-health.js` to `pathExcludeList` with audit
     comment

2. **Path validation empty string at L175** - FALSE POSITIVE. The condition at
   L175 explicitly includes `rel === ""` at the start:
   `if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel))`
   Pattern checker regex looks FORWARD only, misses check at START.
   - Fix: Added `check-roadmap-health` to `pathExclude` regex with audit comment

**NEW PATTERN (1):**

- **(66) Pattern checker limitations** - Line-by-line pattern checks cannot
  detect function-level context (try/catch wrapping) or check ordering (rel ===
  "" at start vs end of condition). When adding verified false positives to
  exclusions, document the specific line numbers and verification in comments.

---

#### Review #213: PR #321 Doc Compliance - Qodo + SonarCloud (2026-01-28)

**Source:** Qodo PR Code Suggestions + SonarCloud Issues **PR/Branch:**
claude/resume-previous-session-D9N5N **Suggestions:** 6 total (MAJOR: 2, MINOR:
3, DEFERRED: 1)

**Files Modified:**

- `.husky/pre-commit` - ADM filter + quoted variables
- `scripts/check-docs-light.js` - Unicode emoji regex + URL decoding
- `scripts/check-roadmap-health.js` - Removed redundant return
- `scripts/generate-documentation-index.js` - Purpose/Version History sections +
  parentheses encoding

**MAJOR (2):**

1. **Broaden pre-commit doc index check** - Changed `--diff-filter=A` to
   `--diff-filter=ADM` to catch modified/deleted docs, not just added. Also
   quoted variables for robust filename handling with spaces.

2. **Simplify regex complexity** - SonarCloud flagged emoji regex at 27
   alternations (max 20). Changed to `\p{Extended_Pictographic}` Unicode
   property escape + `replaceAll()` for ES2021+ idiom.

**MINOR (3):**

3. **URL decode file paths** - Docs linter wasn't decoding `%20` etc. in links,
   causing false "broken link" errors. Added `decodeURIComponent()` with
   try/catch fallback.

4. **Remove redundant return** - SonarCloud flagged `return;` at L112 in
   check-roadmap-health.js - function ends immediately after anyway.

5. **Encode parentheses in markdown links** - `encodeURI()` doesn't encode `(`
   and `)`, breaking markdown link parsing. Created `encodeMarkdownPath()`
   helper that also encodes `%28`/`%29`.

**DEFERRED (1):**

6. **Cross-file anchor validation** - Qodo suggested implementing full
   cross-file anchor resolution with caching. Deferred as significant feature
   enhancement requiring new functions and caching logic.

**NEW PATTERNS (3):**

- **(67) Unicode property escapes for emoji** - Use `\p{Extended_Pictographic}`
  instead of listing individual emojis to reduce regex complexity
- **(68) Markdown link parentheses encoding** - `encodeURI()` doesn't encode
  `()` which breaks markdown `[text](url)` parsing
- **(69) Pre-commit ADM filter** - Check Added/Deleted/Modified files, not just
  Added, for complete doc index freshness

---

#### Review #214: PR #322 Alert System & Context Preservation - Qodo + SonarCloud + CI (2026-01-28)

**Source:** Qodo PR Compliance + Code Suggestions, SonarCloud, CI Pattern Check
**PR/Branch:** claude/resume-previous-session-D9N5N **Suggestions:** 35+ total
(CRITICAL: 21 CI, MAJOR: 11, MINOR: 6, DEFERRED: 1)

**Files Modified:**

- `.claude/hooks/alerts-reminder.js` - try/catch wrapping (5 locations)
- `.claude/hooks/auto-save-context.js` - security fixes + try/catch
- `.claude/skills/alerts/scripts/run-alerts.js` - path fixes + try/catch
- `scripts/generate-pending-alerts.js` - try/catch + regex fix + race condition
- `scripts/append-hook-warning.js` - try/catch wrapping
- `.claude/hooks/large-context-warning.js` - try/catch wrapping
- `claude.md` - fixed path traversal regex character
- `.husky/pre-push` - empty alert prevention

**CRITICAL CI (21 - Pattern Compliance):**

All 21 violations are `readFileSync without try/catch` - existsSync does NOT
guarantee read success due to race conditions, permission changes, encoding
errors. See Review #36, #37 for pattern background.

**MAJOR (11):**

1. **Directory traversal fix** - `auto-save-context.js` path.relative check
   vulnerable. Changed to use `startsWith(safeBaseDir + path.sep)` method.

2. **Sensitive data persistence** - `auto-save-context.js` saves raw context to
   disk. Added sanitization to exclude sensitive fields before persisting.

3. **Path traversal regex character** - `claude.md` line 90 had box-drawing
   character │ instead of pipe |. Fixed regex: `/^\.\.(?:[\\/]|$)/`.

4. **Session-state path mismatch** - `run-alerts.js` used wrong path
   `.claude/session-state.json` instead of `.claude/hooks/.session-state.json`.

5. **SESSION_CONTEXT.md path** - `run-alerts.js` checked wrong path
   `ROOT_DIR/SESSION_CONTEXT.md` instead of `ROOT_DIR/docs/SESSION_CONTEXT.md`.

6. **getRecentDecisions order** - Got oldest decisions, not newest. Changed to
   collect all then `.slice(-limit)` to get most recent.

7. **Race condition data loss** - `readHookWarnings()` cleared warnings before
   processing complete. Moved clear to separate acknowledged flow.

8. **SonarQube regex precedence** - L47 in `generate-pending-alerts.js` needs
   explicit grouping for operator precedence clarity.

9. **Type-check always report** - `run-alerts.js` silently ignored type errors
   when count couldn't be parsed. Now always reports failure.

10. **Platform root search** - `findProjectRoot()` used hardcoded "/" which
    fails on Windows. Changed to `path.parse(dir).root`.

11. **Empty alert prevention** - `pre-push` hook could create empty alerts.
    Added guard to check for non-empty warning message.

**MINOR (6):**

12. Unused 'require' in session-end-reminder.js (line 2)
13. Unused 'error' in session-start.js (line 470)
14. Unsafe regex patterns in session-end-reminder.js (documented, not fixed)
15. Consistent session state path across files
16. Improved secret detection regex
17. More specific alert messages in pre-commit

**DEFERRED (1):**

- **Replace custom alerting with standard tools** - Valid architectural
  suggestion to use issue tracker/CI dashboards instead of markdown parsing. Too
  large for this PR, deferred to ROADMAP_FUTURE.md consideration.

**NEW PATTERNS (4):**

- **(70) existsSync + readFileSync race** - ALWAYS wrap readFileSync in
  try/catch even after existsSync - file can be deleted/locked/permissions
  changed between checks
- **(71) path.relative security** - For containment validation, prefer
  `!resolved.startsWith(base + path.sep) && resolved !== base` over
  path.relative checks which have edge cases
- **(72) Regex character encoding** - Watch for Unicode box-drawing characters
  (│) being confused with pipe (|) in documentation - they look similar
- **(73) Platform-agnostic root** - Use `path.parse(dir).root` not hardcoded "/"
  for cross-platform compatibility

---

#### Review #215: PR #324 Round 2 - Gap-Safe Consolidation Counting (2026-01-29)

**Source:** Qodo PR Code Suggestions **PR/Branch:** PR #324 /
claude/new-session-yBRX5 **Suggestions:** 7 total (Critical: 0, Major: 3, Minor:
3, Trivial: 1)

**Patterns Identified:**

1. **Gap-safe counting**: Subtraction-based counting (highest - last) fails when
   review numbers have gaps
   - Root cause: Reviews may be skipped or deleted, leaving gaps in numbering
   - Prevention: Use Set-based counting of unique review numbers > threshold

2. **Read/write location mismatch**: Script reads from one section but writes to
   another
   - Root cause: getLastConsolidatedReview only checks "Last Consolidation"
     section
   - Prevention: Add fallback to check "Consolidation Trigger" section where
     updates happen

**Resolution:**

- Fixed: 7 items (all suggestions applied)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- Gap-safe counting (Set-based) is more robust than arithmetic subtraction
- Always ensure read/write locations match in parsing logic

---

#### Review #216: PR #324 Round 3 - Defensive Math Operations (2026-01-29)

**Source:** Qodo PR Code Suggestions **PR/Branch:** PR #324 /
claude/new-session-yBRX5 **Suggestions:** 5 total (Critical: 0, Major: 3, Minor:
2, Trivial: 0)

**Patterns Identified:**

1. **Math.max on empty array**: `Math.max(...[])` returns -Infinity, not 0
   - Root cause: Filter may produce empty array, spread to Math.max fails
   - Prevention: Check filtered array length before calling Math.max

2. **Spread operator stack limits**: `Math.max(...largeArray)` can overflow call
   stack
   - Root cause: Spread converts array to function arguments (limited ~65k)
   - Prevention: Use reduce() for unbounded arrays

3. **Script parity**: Check script missing fallback that run script has
   - Root cause: Only updated one script's getLastConsolidatedReview
   - Prevention: When updating shared logic, update all scripts

**Resolution:**

- Fixed: 5 items (all suggestions applied)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- Always filter to a variable, check length, then call Math.max/min
- Use reduce() instead of spread for potentially large arrays
- Keep validation scripts in sync with their runner counterparts

---

<!--
Next review entry will go here. Use format:

#### Review #217: PR #XXX Title - Review Source (DATE)


-->
