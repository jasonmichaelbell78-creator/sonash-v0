# AI Review Learnings Log

<!-- markdownlint-disable MD038 -->

**Document Version:** 17.104 **Created:** 2026-01-02 **Last Updated:**
2026-03-18

## Purpose

This document is the **audit trail** of all AI code review learnings. Each
review entry captures patterns identified, resolutions applied, and process
improvements made.

**Related Documents:**

- **[AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md)** - How to triage and handle
  reviews
- **[claude.md](../CLAUDE.md)** - Distilled patterns (always in AI context)

---

## Quick Start

1. Check recent reviews for relevant patterns
2. Review consolidation status
3. Add new learnings using Review #XX format

---

## Version History

<details>
<summary>Full version history (v1.0 – v17.35) — click to expand</summary>

| Version  | Date                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17.105   | 2026-03-18               | Review #489: PR #448 R4 — Mixed (CI+Qodo+SonarCloud). 10 fixes: security scan exclusions for test files, symlink staged filter, deterministic error counting, safeAppend root containment, shared sanitizeError, CC extraction. 7 repeat-rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 17.104   | 2026-03-18               | Review #488: PR #448 R3 — Mixed (Qodo+SonarCloud). 10 fixes: resolveLinkPath path traversal, options.stagedFiles validation, DOMPurify FORBID_CONTENTS, churn-tracker latest-index, numeric normalization, CC reductions, token redaction. 8 repeat-rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 17.103   | 2026-03-18               | Review #487: PR #448 R2 — Mixed (CI+Qodo+SonarCloud). 19 fixes: ESLint CJS config for \_\_dirname, no-control-regex block disable, CLI path traversal guard, Promise.allSettled, NaN→Number.NaN propagation, CC reductions. 8 auto-rejected (R1 stale repeats).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 17.102   | 2026-03-18               | Review #486: PR #448 R1 — Mixed (Qodo+Gemini+SonarCloud). 47 fixes: propagation grep false-positive, migration archived-file fallback, timestamp string→Date.parse (4 files), review_rounds mutation bug, semgrep over-suppression, 9 CC reductions, 4 security hardening, @ts-nocheck removal. 2 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.63    | 2026-03-16               | Review #479: PR #443 R2 — Qodo. Relative link depth fix (../../ → ../../../) in session-begin SKILL+REFERENCE, session counter off-by-one. 2 fixed, 1 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 17.62    | 2026-03-16               | Review #478: PR #443 R1 — Mixed (Doc Lint CI+Qodo Compliance+Qodo Reviewer+CI Failure). Invocation schema consistency (duration_ms/error fields). 3 fixed, 3 deferred (DEBT-45531/45532/45533), 2 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.61    | 2026-03-14               | Review #477: PR #432 R4 — Mixed (Qodo+CodeQL+CI+SonarCloud). Terminal injection (control char strip), CodeQL process.env contradiction resolved (by=cli), schema field alignment (\_pending_test→pending_enforcement_test), write audit trail, safe error.code access. 6 fixed, 2 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.60    | 2026-03-14               | Review #476: PR #432 R3 — Mixed (Qodo+CI+SonarCloud). Cache retry bug (re-throw after log), alert truncation consistency, existsSync TOCTOU removal, audit trail actor context. 6 fixed, 1 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 17.59    | 2026-03-07               | Review #459: PR #420 R2 — Mixed (Gemini+Qodo+Semgrep). claude.md case mismatch (Linux CI), warned-files schema fix (timestamps→counts), failedCheck field, skill-registry generator fix (description: >-), process.execPath propagation (4x), swallowed catch debuggability (2x). 7 fixed, 6 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.58    | 2026-03-07               | Review #458: PR #420 R1 — Mixed (SonarCloud+Semgrep+Qodo+CI). Path containment bypass (realpathSync+path.relative), CC reduction (main→3 funcs), lazy projectDir eval, token redaction, broken archive links (7), missing Version History section. 8 fixed, 2 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 17.57    | 2026-02-24               | PR #388 Final Retrospective: 7 rounds, 144 items, ~4.5 avoidable. Supersedes R1-R4 retro. Large PR scope #1 driver (4x recommended). Propagation partially automated (9x). Stale reviewer pattern new.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.56    | 2026-02-24               | Review #378: PR #388 R7 — Lightest round (1 fix + 2 propagation, 8 rejected). typeof guard on lazy-loaded imports, stale reviewer detection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17.55    | 2026-02-24               | Review #377: PR #388 R6 — CI blockers, lstatSync propagation (4 state-managers), JSONL dedup (1685 entries). 11 fixed, 3 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 17.54    | 2026-02-24               | Review #376: PR #388 R5 — SonarCloud+CI+Gemini+Qodo multi-source review. CC reduction (searchForFunction 26→~10), funcName regex escaping, 3 sanitizeInput fixes, test predicate logic fix, dedup helper extraction. 14 fixed, 4 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17.53    | 2026-02-24               | PR #388 Retrospective: 4 rounds, 96 items, ~4 avoidable. Heuristic ping-pong (isInsideTryCatch 3 rounds), data-quality-dedup self-referential set, regex safety escalation. Fix Review #372 label (PR #387→#388). Propagation check 8x recommended.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 17.52    | 2026-02-23               | Review #375: PR #388 R4 — CI blocker (RegExp→indexOf), brace depth correction, iterative DFS, BigInt, invalidCount, null vs falsy, scoped function body, nearest stage, writesDeduped fallback, hook path priority. 15 fixed, 1 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 17.51    | 2026-02-23               | PR #386 Retrospective: 2 rounds, 25 items, ~1 avoidable round. S5852 regex two-stage (R1→R2), CC in testFn IIFE. Cleanest cycle in series.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17.50    | 2026-02-23               | Review #371: PR #386 R2 — S5852 string parsing, CC reduction (main→3 funcs, testFn IIFE), concurrency-safe tmp, match snippets. 6 fixed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 17.49    | 2026-02-23               | Review #370: PR #386 R1 — SonarCloud regex complexity (2 testFn conversions), seed-commit-log.js hardening (8 fixes), optional chaining (3), CI Prettier fix. 17 fixed, 1 rejected (FP), 1 architectural.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 17.48    | 2026-02-23               | PR #384 Retrospective: 4 rounds, 197 items, ~2.5 avoidable rounds. CI pattern compliance cascade (R1→R2), CC progressive reduction (R1→R3→R4).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 17.46    | 2026-02-20               | PR #379 Retrospective: 11 rounds across 2 branches, ~190 raw suggestions (106 fixed, ~61 rejected, 4 deferred). 4 ping-pong chains: evidence algorithm hardening (R2-R7, 4 avoidable), protocol non-compliance cascade (R8-R10, 2 avoidable), CRLF propagation miss (R9-R10, 1 avoidable), linter self-flagging (R10-R11, 1 avoidable). ~73% avoidable rounds. New Pattern 8: Incremental Algorithm Hardening.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 17.45    | 2026-02-20               | Reviews #357-#361: PR #379 R3-R7 on cherry-pick branch. Protocol compliance restored from R10 onward.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 17.44    | 2026-02-20               | Reviews #357-#360 (retroactive): PR #379 R3-R6 on cherry-pick branch. Process failures documented.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 17.37    | 2026-02-19               | Review #356: PR #378 R2 — GIT_DIR resolution, broken table row. 2 fixed, 3 rejected, 1 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 17.36    | 2026-02-18               | Review #355: PR #378 R1 — exit code coercion, TOCTOU race, absolute paths, system-test checklist gaps. 7 fixed, 4 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.35    | 2026-02-18               | Review #354: SonarCloud + Qodo R2 — CC reduction (extractReviewIds 22→~8 via helper extraction), nested ternary→lookup, error log sanitization (4 catches), DoS caps (range expansion + gap scan). 5 fixed, 1 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 17.34    | 2026-02-18               | Review #353: Qodo review of check-review-archive.js — silent catch logging (5 catches), groupConsecutive sort/dedupe. 3 fixed + 2 propagation, 1 rejected (false positive).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.33    | 2026-02-17               | Overhaul: removed stale Quick Index, collapsed version history, removed Pattern Effectiveness Audit, cleaned stale placeholders, fixed JSONL data quality, added retro parsing, added archive-reviews.js + promote-patterns.js automation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17.32    | 2026-02-17               | Format audit: collapsed version history ≤17.21 into details, fixed stale tiered access (#180→#285), added missing archives 6-8, updated document health metrics (3400 lines, 63 active reviews — both over threshold).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.31    | 2026-02-17               | PR #370 Retrospective: 5 rounds, 53 items (46 fixed, 6 rejected, 1 deferred). 3 ping-pong chains (normalizeFilePath 3 rounds, TOCTOU 2 rounds, unknown args 2 rounds). CC lint rule recommended 4th time. Trend improving (5 rounds vs 9 in #369).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 17.30    | 2026-02-17               | Review #347: PR #370 R5 — 9 items (3 MAJOR, 3 MINOR, 3 rejected). TOCTOU file path fix, CWD-independent normalizeFilePath, trailing slash preservation, unknown non-flag token errors, assignedIds filter, improved error message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 17.29    | 2026-02-17               | Review #346: PR #370 R4 — 11 items (3 MAJOR, 5 MINOR, 3 rejected). Dynamic path prefix in normalizeFilePath, ensureDefaults on merged items, unknown CLI arg errors, negated condition flip, symlink check reorder, evidence guard, --file path validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.28    | 2026-02-17               | Review #345: PR #370 R3 — 11 items (6 MAJOR, 4 MINOR, 1 enhancement). parseArgs CC reduction (while-loop + extracted validators), writeOutputJson hardening (symlink order, tmp cleanup, pre-remove), generate-views.js manual item preservation, source data normalization, --pr validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 17.27    | 2026-02-17               | Review #344: PR #370 R2 — 11 items (1 CRITICAL, 4 MAJOR, 3 MINOR, 2 data quality, 1 deferred). Path traversal on --output-json, SonarCloud i assignment, extracted writeOutputJson helper, 5 orphaned ROADMAP DEBT refs, evidence dedup + absolute path re-apply, symlink guards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 17.26    | 2026-02-17               | PR #369 Retrospective: 9 rounds, 119 items (78 fixed, 41 rejected). Symlink ping-pong (8 rounds), CC ping-pong (6 rounds). Key action: add CC complexity lint rule to pre-commit hook.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.25    | 2026-02-17               | Review #338: PR #369 R4 — 12 items (3 MAJOR, 3 MINOR, 6 rejected). realpathSync symlink hardening (post-audit), atomic write tmp+rename (generate-results-index), early return invalid date, fail fast JSONL, String(title), safe error.message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 17.24    | 2026-02-17               | Review #337: PR #369 R3 — 12 items (4 MAJOR, 3 MINOR, 5 rejected). Repo containment (post-audit), canonical category mapping (generate-results-index), sinceDate validation, writeFileSync try/catch, string line normalization in getFileRef, push batching residuals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 17.23    | 2026-02-17               | Review #336: PR #369 R2 — 38 items (6 MAJOR, 10 MINOR, 14 rejected). CC reduction (3 functions), push batching (4 files), normalizeRepoRelPath, table column alignment, symlink guards, line normalization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.22    | 2026-02-17               | Review #335: PR #369 R1 — 63 items (5 CRITICAL, 16 MAJOR, 37 MINOR, 5 data quality). CI blocker: execSync command injection in 3 new audit scripts. Pattern: new scripts generated without security-helpers integration. 8 CC reductions, findingKey collision fix, .bak file removal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17.21    | 2026-02-16               | PR #368 Retrospective: 6 rounds, 65 items, symlink/TOCTOU ping-pong across R1-R6, SKIP_REASON persistence rejected 4x. Key action: fstatSync-after-open pattern rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 17.20    | 2026-02-16               | Review #334: PR #368 R6 — fstatSync fd validation, empty-reason-on-failure, console truncation, EXIT trap robustness, Object.values iteration, cross_domain marker, partial TDMS guard. 8 fixed, 3 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17.19    | 2026-02-16               | Review #333: PR #368 R5 — TOCTOU fd-write, argument injection, symlink directory guard, domains dedupe, canonical category, partial data guard. 8 fixed, 4 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 17.18    | 2026-02-16               | Review #330: PR #367 R7 — codePointAt (3 files), suppressAll category guard, code fence parsing, POSIX EXIT trap helper, shell control char validation. 8 fixed, 6 CC deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 17.17    | 2026-02-16               | Review #329: PR #367 R6 — Control char + length validation (3 JS scripts), POSIX-safe CR detection (2 hooks), suppressAll explicit flag, severity normalization. 5 fixed, 6 CC deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 17.16    | 2026-02-16               | Review #328: PR #367 R5 — Suppression type validation, POSIX-safe grep replacement, SKIP_REASON newline propagation to 3 JS scripts, ENOENT code preservation, toCount string coercion, triggers fail-closed. 9 fixed, 6 CC deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 17.15    | 2026-02-16               | Review #327: PR #367 R4 — Fail closed security (5 files), log injection prevention (pre-commit/pre-push), trap chaining, audit output capture, input normalization (toCount/filesRead), exit code preservation. 13 fixed, 6 CC deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 17.14    | 2026-02-16               | Review #326: PR #367 R3 — Weight normalization (1.02→1.00), CC reduction (archive-doc.js, sync-reviews-to-jsonl.js), suppression filter type checks, for-of loops, dedup learnings. 8 fixed, 6 CC deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.13    | 2026-02-16               | Review #325: PR #367 R2 — Trend bug fix, suppression filter logic, security hardening. 21 fixed, 6 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17.12    | 2026-02-16               | Review #324: PR #367 R1 — Alerts overhaul security + code quality. 49 items from SonarCloud/Qodo: runCommandSafe shell injection hardening, parseInt→Number.parseInt (6), replace→replaceAll (10), empty regex guard, symlink guards (2 scripts), skip reason validation, cognitive complexity deferrals (6). 3 parallel agents.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 17.11    | 2026-02-15               | Review #323: PR #366 R8 — tmpPath symlink guards (5 files), Firestore regex hyphen bypass fix (\w+ → [A-Za-z0-9_-]+), log-override path.resolve safety. 7 fixed, 5 rejected (wx flag, bidirectional containment, env path trust, cooldown read symlink, streaming line count). Propagation check confirmed all atomic write paths now guarded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 17.10    | 2026-02-15               | Review #322: PR #366 R7 — Comprehensive symlink hardening: path.isAbsolute guard, tmp path guards (7 files), rotate-state.js (4 paths), inline→shared helper migration, commit-tracker author restore. 9 fixed, 3 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 17.9     | 2026-02-15               | Review #321: PR #366 R6 — Shared symlink-guard.js helper (ancestor traversal), self-healing cooldown, TOCTOU try/catch, milestone string bug, NUL delimiter, directive "ok" output. 11 fixed, 2 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 17.8     | 2026-02-15               | Review #320: PR #366 R5 — Parent dir symlink, clock skew defense, prototype pollution (Object.create(null)), getContent symlink read, size-based rotation. 8 fixed, 1 already-tracked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.7     | 2026-02-15               | Review #319: PR #366 R4 — Symlink write guard, future timestamp defense, file list caps, skip-abuse 24h/7d bug fix, CRLF JSONL trim, Number.isFinite cooldown. 6 fixed, 3 already-tracked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17.6     | 2026-02-15               | Review #318: PR #366 R3 — Atomic write hardening (backup-swap, mkdirSync), state shape normalization (3 files), numeric coercion guards, porcelain validation. 10 fixed, 1 deferred, 1 rejected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 17.5     | 2026-02-15               | Review #317: PR #366 R2 — SonarCloud two-strikes regex→string (2), rename/copy parse bug, atomic write consistency, state normalization, Number.isFinite guard. 11 fixed, 3 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 17.4     | 2026-02-14               | Review #316: PR #366 R1 — SonarCloud regex two-strikes (testFn), atomic writes (3 hooks), state pruning (2 files), CI blocker fixes (30+ links, 5 DEBT entries). 15 fixed, 6 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.3     | 2026-02-13               | Fix: Consolidation counter corruption — manual counter showed 0 but 26 reviews pending (#285-#310). Root cause: `updateConsolidationCounter` injected "Next consolidation due" into Status field, creating duplicates that grew on each run. Fixed run-consolidation.js Status/Next replacement order, corrected counter to 26, cleaned corrupted "Review #320 Review #320..." text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 17.2     | 2026-02-13               | Review #310: PR #364 Qodo Suggestions — Alerts v3 health score normalization, git edge cases, path separators. 10 review rounds addressed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17.1     | 2026-02-12               | Review #306: PR #362 R2 — Edge case fixes (line 0, falsy field preservation, Windows paths, validate-schema consistency). Consolidation counter 16→17.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17.0     | 2026-02-12               | Review #305: PR #362 R1 — Cognitive complexity reduction (3 functions), shared helper extraction (mapFirstFileToFile, mapCommonAuditFields, preserveEnhancementFields, printFormatStats, printFilePathWarnings), replaceAll(), negated condition fix, warnings-on-error, normalized path storage, non-string coercion skip, intake-log schema consistency. Consolidation counter 15→16. Active reviews #266-305.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 16.9     | 2026-02-12               | Review #304: PR #361 R5 — State wipe prevention (null-aware save), dir symlink guards (both files), isSymlink try/catch, ESLint fixer return removal, null title guard. Consolidation counter 14→15. Active reviews #266-304.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 16.8     | 2026-02-12               | Review #303: PR #361 R4 — TOCTOU symlink fix (lstatSync direct), corrupt state guard (null return), cognitive complexity extraction (tryUnlink/isSymlink helpers), `exclude`→`pathExclude` bug fix, non-destructive ESLint suggestion, verbose crash prevention. Consolidation counter 13→14. Active reviews #266-303.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 16.7     | 2026-02-12               | Review #302: PR #361 R3 — Symlink clobber guards, backup-and-replace writes, BOM stripping, ESLint loc fallback, O(n) TOCTOU index, verbose match truncation. Skill update: #TBD deferred numbering to prevent review number collisions. Consolidation counter 12→13. Active reviews #266-302.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 16.6     | 2026-02-11               | Review #294: PR #360 R12 — CI fix: eslint-disable block for control-char regex, sanitizeLogSnippet extraction, BiDi control strip, escapeMarkdown String coercion + \r\n, valid-only ENH-ID idMap, TOCTOU symlink recheck before unlink, EEXIST recovery for resolve-item, strict digits-only line parsing, decoupled log/review writes, toLineNumber reject 0/negative, Windows-safe metrics rename. Active reviews #266-294.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 16.5     | 2026-02-11               | Review #293: PR #360 R11 — Markdown injection (HTML strip in escapeMarkdown), stale temp EEXIST recovery, safeCloneObject throw on deep nesting + module-scope in dedup, deduped.jsonl non-fatal write, non-critical log/review write guard, safeCloneObject for MASTER_DEBT.jsonl, terminal escape sanitization, robust line number sanitization, Windows-safe unlink-before-rename, schema config validation. Active reviews #266-293.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 16.4     | 2026-02-11               | Review #292: PR #360 R10 — assertNotSymlink fail-closed (rethrow unknown errors, all 5 files), safeCloneObject in resolve-item.js + validate-schema.js, temp-file symlink+wx flag (dedup-multi-pass.js + generate-views.js), atomic writes for metrics.json + METRICS.md, atomic rollback restore, existingEvidence sanitization, line number validation, Pass 2 DoS cap (5000 items), dedup run_metadata audit trail, pipeline write error handling. Active reviews #266-292.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 16.3     | 2026-02-11               | Review #291: PR #360 R9 — Prototype pollution guard (safeCloneObject in dedup-multi-pass.js + generate-views.js), assertNotSymlink EACCES/EPERM fail-closed (all 5 files), atomic write for generate-views.js MASTER_FILE, schema-stable reviewNeeded entries, symlink guards on generate-metrics.js (3 write paths) + resolve-item.js (saveMasterImprovements + logResolution), acceptance evidence sanitization, BOM strip in resolve-item.js. Active reviews #266-291.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 16.2     | 2026-02-11               | Review #290: PR #360 R8 — CI fix (assertNotSymlink instanceof Error), Pass 0 no-file guard, symlink guards on generate-views.js + logIntake(), enhancement-audit format precision, \_\_dirname child script, fingerprint type guard, Pass 3 comparison cap (50k), isStringArray for-loop + Number.isFinite. Consolidation counter 8→9 (consolidation due). Active reviews #266-290.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 16.1     | 2026-02-11               | Review #289: PR #360 R7 — Symlink guards (intake-audit + dedup), Pass 3 grouped by file (O(n²) → O(n²/k)), regex flag preservation, non-fatal operator hash, honesty guard (counter_argument), non-object JSONL rejection in dedup, whitespace-only required field validation, timestamp spread in resolve-item, hardened schema config (isStringArray + confidence range). Consolidation counter 7→8 (consolidation due). Active reviews #266-289.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 16.0     | 2026-02-11               | Review #288: PR #360 R6 — Pass 3 semantic match changed to flag-only (no destructive merge), PII removal (hash operator, basename input_file), timestamp integrity (spread order), stateful regex guard, normalizeFilePath line-suffix stripping, non-object JSONL validation, accurate ingestion outcome, empty evidence cleanup. Consolidation counter 6→7 (consolidation due). Active reviews #266-288.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 15.9     | 2026-02-11               | Review #287: PR #360 R5 — impactSort falsy bug (                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | → ??), ID drift from @line: suffix, missing title guard, always-sanitize evidence, BOM in intake JSONL, logIntake outcome field + try/catch. Consolidation counter 5→6. Active reviews #266-287.                                                                                                                                                                                                                                                                                                                                                                                        |
| 15.8     | 2026-02-11               | Review #286: PR #360 R4 — Prototype pollution (safeCloneObject after parse), TOCTOU (use realPath), evidence sanitization, BOM handling, absolute script paths, logging try/catch, stderr for errors. ENH-0003 (Markdown injection) routed to IMS. Consolidation counter 4→5. Active reviews #266-286.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 15.7     | 2026-02-10               | Review #282: PR #358 R2 — SSR guards, regex simplification, key stability (24 items - 0 CRITICAL, 1 MAJOR SonarCloud, 21 MINOR, 2 REJECTED). **MAJOR**: Replace SENSITIVE_KEY_PATTERN regex (complexity 21) with Set-based SENSITIVE_KEYS lookup. **MINOR**: 8× typeof→direct undefined comparison (SonarCloud), SSR guards (keydown/confirm/location/navigator/matchMedia), unmount guard for async copy, select value validation, composite React keys (2 files), Firestore limit(7), window ref for event listeners (2 files), try/catch String(input), deploy-firebase TODO removal, robust reload. **REJECTED**: auth-error-banner toast dedup (works correctly), NightReviewCard React namespace type (too minor). Consolidation counter 11→12 (consolidation due). Active reviews #266-282.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 15.6     | 2026-02-10               | Review #281: PR #358 Sprint 2 — Shared State, Redaction, Key Stability (9 items - 1 MAJOR, 7 MINOR, 1 TRIVIAL, 0 REJECTED). **MAJOR**: Module-level Set shared state bug in auth-error-banner.tsx → useState. **MINOR**: Key-name-based PII redaction (SENSITIVE_KEY_PATTERN), deepRedactValue null check, composite React keys (3 files), guard clause for optional params, SSR-safe reload. **TRIVIAL**: Removed redundant onKeyDown on backdrop div. Consolidation counter 10→11 (consolidation due). Active reviews #266-281.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 15.5     | 2026-02-09               | Review #272: PR #352 Round 6 — FINAL loadConfig sweep (12 items - 1 Security, 8 MAJOR, 2 MINOR, 1 REJECTED). **SECURITY**: Path traversal guard in load-config.js (reject .., /, \\). **MAJOR**: Complete sweep of ALL remaining unguarded loadConfig calls (6 files: validate-schema.js, normalize-all.js, intake-manual.js, intake-audit.js, intake-pr-deferred.js, validate-skill-config.js), description fallback YAML artifact filter, path-boundary archive regex, overlapping trigger exclusion. **REJECTED**: audit-schema.json category rename + 3 shape validation suggestions (over-engineering). **MILESTONE**: Zero unguarded loadConfig calls remain in codebase. Consolidation counter 7→8. Active reviews #266-272.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 15.4     | 2026-02-09               | Review #271: PR #352 Round 5 - Qodo Suggestions + Compliance (7 items - 4 MAJOR, 2 MINOR, 1 REJECTED). **MAJOR**: Stateful regex bug (g flag removed from skill-config.json deprecatedPatterns), path-boundary anchored excludePaths regex (agent-triggers.json), unguarded loadConfig try/catch (check-pattern-compliance.js + generate-documentation-index.js + surface-lessons-learned.js). **MINOR**: Empty patterns fail-closed (ai-pattern-checks.js). **REJECTED**: check-review-needed.js 15-line shape validation (over-engineering). Consolidation counter 6→7. Active reviews #266-271.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 15.3     | 2026-02-09               | Review #270: PR #352 Round 4 - Qodo Suggestions + Compliance (7 items - 4 MAJOR, 1 MINOR, 1 REJECTED, 1 INFORMATIONAL). **MAJOR**: YAML block scalar handling in parseFrontmatter (generate-skill-registry.js), silent catch→console.warn (search-capabilities.js), unguarded loadConfigWithRegex try/catch (check-review-needed.js + ai-pattern-checks.js). **REJECTED**: sanitizeError guard in validate-audit-integration.js (already has inline fallback via try/catch). Consolidation counter 5→6. Active reviews #266-270.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 15.2     | 2026-02-09               | Review #269: PR #352 Round 3 - Qodo Security + Compliance + Suggestions (7 items - 1 Security, 1 Compliance, 5 Code). **SECURITY**: Symlink guard (lstatSync) before reading SKILL.md in generate-skill-registry.js. **COMPLIANCE**: Silent catch blocks replaced with console.warn for diagnosability. **MAJOR**: parseFrontmatter slice(3) to skip opening ---, fail-closed empty rules (check-cross-doc-deps.js), unguarded loadConfig try/catch (validate-audit-integration.js + check-doc-headers.js). **MINOR**: Object.freeze on VALID_SEVERITIES_CACHED. Consolidation counter 4→5. Active reviews #266-269.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 15.1     | 2026-02-09               | Review #268: PR #352 Round 2 - Qodo + CI (7 items - 0 CRITICAL, 3 MAJOR, 1 MINOR, 2 REJECTED, 1 INFORMATIONAL). **CI FIX**: 2 remaining false positives (intake-pr-deferred.js:107, normalize-all.js:143) added to verified-patterns.json. **MAJOR**: process.exit(1) on read failure instead of return [] (intake-pr-deferred.js), try/catch + Array.isArray guard for module-scope loadConfig (transform-jsonl-schema.js), empty rules warning (check-cross-doc-deps.js). **REJECTED**: Composite dedup key in generate-skill-registry.js (intentional first-wins behavior), config shape validation in load-config.js (over-engineering for internal configs). Consolidation counter 3→4. Active reviews #266-268.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 15.0     | 2026-02-07               | **CONSOLIDATION #17**: Reviews #254-265 (12 reviews) → CODE_PATTERNS.md v2.6. Added 23 patterns: 4 Security, 7 JS/TS, 8 CI/Automation, 3 Process Management, 1 Bash/Shell. Source: PR #346 Audit Trigger Reset reviews (Qodo/SonarCloud rounds 1-6). Counter reset 12→0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 14.9     | 2026-02-07               | Review #265: PR #346 Round 6 Qodo (6 items - 1 MAJOR, 3 already fixed, 2 rejected). **MAJOR**: Backup-swap saveJson atomic write (rm+rename crash window). **Already fixed in 5f3f312**: empty entries guard, section scoping, table date regex. **Rejected**: .filter(Boolean) on hardcoded constants, auto-generated DOCUMENTATION_INDEX.md. Consolidation counter 11→12 (consolidation due). Active reviews #213-265.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 14.8     | 2026-02-07               | Review #260-264: PR #346 Audit Trigger Reset - 5 rounds Qodo + SonarCloud + CI (29 items across 5 rounds). **R1** (11 items): execFileSync conversion (SonarCloud HIGH), regex DoS backtracking, Object.create(null), \x1f delimiter, NaN guard, Math.min guard, CI false positive exclusions. **R2** (4 items): delimiter mismatch bug, date validation, robust category matching. **R3** (5 items): execFileSync ×2 files, timezone drift, getCategoryAuditDates wrong-table bug. **R4** (3 items): multi-word category capitalization, Windows atomic rename, JSON.parse safety. **R5** (6 items): section-scoped regex, table-column date parsing, empty entries guard. Consolidation counter now at 11 (threshold reached). Active reviews #213-264.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 14.7     | 2026-02-06               | Review #257-259: PR Cherry-Pick Rounds 3-5 - Qodo Compliance + PII Scrub (27 items across 3 rounds). **R3** (7 items): Atomic rename fallback cleanup for Windows, PII in audit logs as design decision. **R4** (9 items): startsWith path containment weakness (use path.relative+regex), markdown fences in AI output breaking JSONL parsers. **R5** (11 items - 1 CRITICAL PII): PII in committed artifacts (absolute paths with username), operator tracking via SHA-256 hash prefix, copyFileSync safer than rm+rename. Active reviews #213-259.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 14.6     | 2026-02-06               | Review #255-256: PR Cherry-Pick - Qodo + SonarCloud + CI (30 items R1 + 8 items R2). **R1**: Hardcoded Windows path with PII, path traversal protection, readFileSync try/catch, content block normalization, multi-line JSON brace tracking, assign-roadmap-refs data loss via copyFileSync, API pagination guards, AbortController timeouts. **R2**: CI blocker pattern compliance false positive (forward-only lookahead), brace tracker escape hardening, startsWith path stripping, atomic output writes, try-first rename for Windows. 20 CANON audit items rejected (not PR issues). Active reviews #213-256.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 14.55    | 2026-02-05               | Review #251-254: PR #338 eval-sonarcloud Skill - 4 Rounds Qodo + CI (46 items). **R1** (26 items - 2 CRITICAL, 12 MAJOR): Path traversal in CLI scripts (validateSessionPath), readFileSync pattern compliance, duplicate file reads. **R2** (9 items - 4 MAJOR): Token exposure in docs (curl secrets), symlink defense (realpathSync), silent parse errors. **R3** (8 items - 3 CRITICAL): Incomplete symlink defense in sibling functions, token exposure in generated content, silent error swallowing. **R4** (3 items - 1 CRITICAL): Here-string token interpolation, multiple similar functions missed, PII in audit logs. Active reviews #213-254.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 14.5     | 2026-02-05               | Review #250: PR #337 Agent QoL Infrastructure - Qodo + CI (22 items - 1 CRITICAL, 7 MAJOR, 10 MINOR, 4 TRIVIAL, 0 REJECTED). **CRITICAL**: Path traversal in state-utils.js (basename validation). **MAJOR**: sync-sonarcloud.js readFileSync try/catch, 3× unsafe error.message, title guard, non-fatal logging, atomic write; state-utils.js updateTaskState step concat. **MINOR**: 4 false positive readFileSync exclusions, docs/archive/ GLOBAL_EXCLUDE, sonarcloud SKILL.md curl secret, agent-trigger-enforcer path normalization, COMMAND_REFERENCE.md duplicate removal. **TRIVIAL**: session-end handoff preservation, pre-commit-fixer commit -F, deprecated command examples. Active reviews #213-250.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 14.4     | 2026-02-05               | Review #249: PR #336 Multi-AI Audit System - Qodo Compliance + Code Suggestions + SonarCloud + CI (60+ items - 2 CRITICAL, 9 MAJOR, 7 MINOR, 1 TRIVIAL, 4 REJECTED + 41 S5852 DoS regex hotspots). **CRITICAL**: [1] Path traversal via unvalidated sessionPath in 4 eval scripts (regex-based containment), [2] Broken link CI blocker SECURITY_AUDIT_PLAN.md. **MAJOR**: [3] docs/docs/ prefix, [4] Cross-cutting sources not combined, [5] Empty results false PASS, [6] DEBT ID instability (deferred - pipeline issue), [7] Missing snapshot field guard, [8] NaN confidence, [9] Division by zero, [10] Empty fields pass validation, [11] Broken shell &; syntax. **MINOR**: readFileSync try/catch (17 locs), unsafe error.message (6 locs), file path regex, orphaned refs halt, flag consistency, session ID constant, CRLF regex. **S5852 DoS**: 41 regex backtracking hotspots across 23 scripts - added bounds to all unbounded quantifiers. **REJECTED**: Unstructured logs (CLI intentional), missing actor context (CLI), ETL framework (architectural), streaming for eval-report (files too small). **PARALLEL AGENTS**: Used 7+ agents (security-auditor, code-reviewer×2, technical-writer, fullstack-developer×3). Active reviews #213-249. |
| 14.3     | 2026-02-04               | Review #248: PR #335 Round 9 - Qodo Compliance + Code Suggestions (14 items - 0 CRITICAL, 2 MAJOR, 8 MINOR, 1 TRIVIAL, 3 REJECTED). **REJECTED FALSE POSITIVES**: [1,2] userIdHash field suggestions - userId field IS the hash (security-logger.ts:137), [3] METRICS.md version history - intentional for Tier 2 compliance. **MAJOR**: [4] analytics-tab onRetry unmount guard, [5] errors-tab UserCorrelationSection unmount guard. **MINOR**: [6] UTC date parsing determinism, [7] Export size cap (2000 rows), [8] Request ID pattern for UserActivityModal, [9] Parallelize retention queries (Promise.all), [10-12] admin.ts robustness (metadata shape, persisted value coercion, capMetadata try/catch). **TRIVIAL**: [14] Unique chart keys. **COMPLIANCE INFORMATIONAL**: Resource exhaustion (already mitigated), Zod messages (admin-only), partially redacted email (intentional). Active reviews #213-248.                                                                                                                                                                                                                                                                                                                                       |
| 14.2     | 2026-02-04               | Review #247: PR #335 Round 8 - Qodo Code Suggestions (6 items - 0 CRITICAL, 1 HIGH, 3 MEDIUM, 1 LOW, 1 REJECTED). **CI BLOCKER**: METRICS.md missing required sections (added Overview + Version History for Tier 2 compliance). **HIGH**: [1] Wrap loadAnalytics in arrow function for onRetry prop (prevents event object injection). **MEDIUM**: [2] Add isActive guard to JobRunHistoryPanel (unmount safety). [3] Parallelize feature usage aggregation (Promise.all for 4 features). **LOW**: [4] Cap large metadata payloads in adminGetErrorsWithUsers (2KB limit). **REJECTED**: [5] Consolidation threshold suggestion (incorrectly wanted to revert 2→8 - we just fixed this in #246). Active reviews #213-247.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 14.1     | 2026-02-04               | Review #246: PR #335 Round 7 - Qodo Code Suggestions (8 items - 0 CRITICAL, 2 MAJOR, 4 MINOR, 2 TRIVIAL). **MAJOR**: [1] Inclusive date range filtering (parseDateBoundaryUtc helper for end-of-day). [6] Prevent broken user correlation keys (return null for non-hashes). **MINOR**: [2] Normalize hashes before comparing (toLowerCase). [3,7] Defer blob URL cleanup in logs-tab.tsx + jobs-tab.tsx (setTimeout). [8] Guard state updates after unmount in analytics-tab.tsx (isActive pattern). **TRIVIAL**: [4] resultSummary undefined vs {}. [5] String cast for error code. **PARALLEL AGENTS**: Used 4 agents (code-reviewer×2, frontend-developer×2). Active reviews #213-246.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 14.0     | 2026-02-04               | Review #245: PR #335 Round 6 - Qodo Compliance + Code Suggestions (9 items - 0 CRITICAL, 2 MAJOR, 5 MINOR, 2 TRIVIAL). **MAJOR**: [2] adminGetErrorsWithUsers audit log misattribution (UID→functionName). [4] ISO week Math.round→Math.floor for boundary accuracy. **MINOR**: [5] deepRedact bigint/function/symbol handling. [6] Removed side-effect logging from ensureUserIdHash (read-path helper). [8] SSR guard for sessionStorage. [9] Guard readErr.code access in sync-consolidation-counter.js. [10] useTabRefresh for UserCorrelationSection. **TRIVIAL**: [7] Job history Date.now() for accurate endTime. [11] Safe date formatting in DailyTrendsChart. **INFORMATIONAL**: [1] Sensitive data design, [3] Partially redacted email (acceptable for admin). **PARALLEL AGENTS**: Used 4 agents (code-reviewer×2, frontend-developer×2). Active reviews #213-245.                                                                                                                                                                                                                                                                                                                                                                                  |
| 13.9     | 2026-02-04               | Review #244: PR #335 Round 5 - Qodo Compliance + Code Suggestions (10 items - 0 CRITICAL, 3 MAJOR, 5 MINOR, 1 TRIVIAL). **MAJOR**: [1,10] adminGetUserActivityByHash message sanitization. [5] ISO week year rollover bug (UTC methods + correct week-year). [6] Misattributed audit events (5 logSecurityEvent calls with UID as functionName → proper function names + userId in options). **MINOR**: [2] Hash once and reuse in ensureUserIdHash. [3] Simplified resource exhaustion check (removed flawed extra query). [4] Circular reference handling in deepRedact (WeakSet). [7] Stale modal state clearing + API response normalization. [8] sessionStorage try/catch. **TRIVIAL**: [9] Job history timestamp consistency (calculated endTime vs serverTimestamp). **PARALLEL AGENTS**: Used 4 agents (code-reviewer×2, frontend-developer×2). Active reviews #213-244.                                                                                                                                                                                                                                                                                                                                                                                 |
| 13.8     | 2026-02-04               | Review #243: PR #335 Round 4 - Qodo Compliance + Code Suggestions (10 items - 0 CRITICAL, 4 MAJOR, 5 MINOR, 1 TRIVIAL). **MAJOR**: [2,3,8] Error sanitization - 30+ catch blocks with String(error) → sanitizeErrorMessage, data.message sanitization in adminGetErrorsWithUsers. [4] Unstructured console.warn → logSecurityEvent with severity WARNING. [5] Deep redact for exports - Bearer tokens and JWTs, recursive deepRedact function. **MINOR**: [6] False resource exhaustion fix - check for more users before throwing. [7] Fan-out cap - maxJobsToQuery=25 for multi-job queries. [9] Case-insensitive type filtering in logs-tab.tsx. [11] Promise.allSettled for partial modal data in UserActivityModal. **TRIVIAL**: [10] Markdown table header separator fix. **INFORMATIONAL**: [1] User enumeration - acknowledged design limitation. **PARALLEL AGENTS**: Used 3 agents (code-reviewer, frontend-developer×2). Active reviews #213-243.                                                                                                                                                                                                                                                                                                     |
| 13.7     | 2026-02-04               | Review #242: PR #335 Round 3 - Qodo Compliance + CI + SonarCloud (17 items - 1 CRITICAL CI, 9 MAJOR, 6 MINOR, 1 TRIVIAL). **CRITICAL CI**: readFileSync without try/catch in sync-consolidation-counter.js (refactored to dedicated try/catch block + pathExcludeList). **MAJOR**: [1] Sensitive log exposure in admin.ts, [4,9] Error logging sanitization in jobs.ts/admin.ts, [5,15] PII redaction in exports (logs-tab.tsx, jobs-tab.tsx), [6] Fan-out query cap (maxTotalResults=500), [7] Retention thresholds using weekStart, [12] Capped scan with throw at limit, [17,18] ReDoS stackTracePattern bounded quantifiers. **MINOR**: [2,10] UI error sanitization (errors-tab.tsx), [11] Modal ARIA accessibility, [13] Hash case normalization, [14] Null checks in search filter, [8] ISO week Math.floor fix. **PARALLEL AGENTS**: Used 4 agents (code-reviewer×2, frontend-developer, security-auditor). Active reviews #213-242.                                                                                                                                                                                                                                                                                                                     |
| 13.6     | 2026-02-04               | Review #241: PR #335 Round 2 - Qodo Compliance + CI + SonarCloud (21 items - 0 CRITICAL, 8 MAJOR, 11 MINOR, 2 TRIVIAL). **MAJOR**: [1,2] Sensitive data in errors (sanitizeErrorMessage), [3] Missing audit logs for admin functions (logSecurityEvent), [4] adminGetErrorsWithUsers Zod validation, [13] Unbounded query fan-out (limit 200), [14] ISO week calculation fix, [20,21] ReDoS regex patterns (SonarCloud S5852). **MINOR**: [5] Timestamp-based sorting, [7] userIdHash case normalization, [8] Non-object result guard, [9] Date range validation, [10,11] Download try/finally cleanup, [12,17,18] Error message sanitization, [15] "use client" (already present), [16] Await history writes. **TRIVIAL**: [6] URL.revokeObjectURL defer, [19] Unused devDeps (knip ignore). **PARALLEL AGENTS**: Used 4 agents (security-auditor, 2×code-reviewer, frontend-developer). Active reviews #213-241.                                                                                                                                                                                                                                                                                                                                               |
| 13.5     | 2026-02-04               | Review #240: Track A Phase 2 PR - Qodo + CI + SonarCloud (24 items - 3 CRITICAL, 8 MAJOR, 11 MINOR, 1 TRIVIAL, 1 DEFERRED). **CRITICAL**: [1] Sensitive data exposure admin.ts:2273-2487, [18] Raw user identifiers admin.ts:2296-2310, [24] Weak cryptography Math.random jobs.ts:348. **MAJOR**: [3] Unredacted console logging, [4] Parameter validation, [11] Missing throw after job failure jobs.ts:444-448, [12] O(n) collection scan admin.ts:2452-2478, [13] N+1 query admin.ts:1922-1971, [14] Excessive queries cohort retention admin.ts:3593-3628, [16] Date filter validation, [22] Job result sanitization. **MINOR**: React hooks, download reliability, modal accessibility. **TRIVIAL**: Prettier formatting. Active reviews #213-240.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 13.4     | 2026-02-04               | Review #239: PR #334 Round 3 - Qodo Security Hardening (9 items - 1 CRITICAL, 3 MAJOR, 3 MINOR, 2 TRIVIAL). **CRITICAL**: validation-state.json local path exposure (added to .gitignore). **MAJOR**: Symlink race in atomic writes (lstatSync + wx flag), exit code propagation for CI, silent failures in --all mode. **MINOR**: Unique temp filenames (PID+timestamp), case normalization (toUpperCase), cross-platform rename. **TRIVIAL**: Early directory rejection, CI exit tracking. Active reviews #213-239.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 13.3     | 2026-02-03               | Review #238: PR #334 Round 2 - Qodo (19 items - 5 CRITICAL, 4 MAJOR, 4 MINOR, 3 TRIVIAL). **CRITICAL**: Symlink path traversal (realpathSync.native), parse error data loss (abort on failures), atomic writes (tmp+rename). **MAJOR**: Deep merge verification_steps, severity/effort validation. **MINOR**: Fingerprint sanitization, files/acceptance_tests validation, confidence clamping, BOM handling. **FALSE POSITIVES**: 3 (readFileSync IS in try/catch, readdirSync file vars not user input). Active reviews #213-238.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 13.2     | 2026-02-03               | Review #237: PR #334 transform-jsonl-schema.js Security Hardening - Qodo/CI (15 items - 2 CRITICAL CI, 5 MAJOR, 5 MINOR, 3 DEFERRED). **CRITICAL CI**: Path traversal prevention (startsWith→regex), readFileSync try/catch compliance. **MAJOR**: Path containment validation, safe error.message access, category map normalization, --output flag validation, input type guards. **FALSE POSITIVES**: 2 pattern checker items (multi-line try/catch detection). Active reviews #213-237.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 13.15    | 2026-02-03               | Review #236: PR #333 Audit Validation Wrapper - Qodo/CI (15 items - 5 MAJOR, 6 MINOR, 3 TRIVIAL, 1 DEFERRED). **MAJOR**: sanitizeError() for error messages, JSON-serializable fingerprints (Set→array), path validation for CLI, documentation lint compliance, strict overall status logic. **DEFERRED**: ajv schema validator (architectural). Active reviews #213-236.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 13.1     | 2026-02-03               | Review #235: PR #332 Audit Documentation 6-Stage - Qodo/CI (8 items - 2 CRITICAL CI, 1 MAJOR, 4 MINOR, 1 DEFERRED). **CRITICAL CI**: YAML syntax (project.yml indentation + empty arrays), Prettier breaking episodic memory function names in 10 skills. **MAJOR**: Python process filtering tightened in stop-serena-dashboard.js. **DEFERRED**: Episodic memory systemic redesign (DEBT-0869). Active reviews #213-235.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 13.0     | 2026-02-03               | Review #227: PR #331 Audit Comprehensive Staged Execution - Qodo + CI (12 items - 4 CRITICAL CI, 5 MAJOR, 2 MINOR, 1 DEFERRED). **CRITICAL CI**: Unsafe error.message access (2), readFileSync without try/catch (2). **MAJOR**: Prototype pollution protection (safeCloneObject helper), type guard for files[0].match(), user context in audit logs, path traversal check in SKILL.md. **DEFERRED**: Unify TDMS schema (architectural). **FALSE POSITIVES**: 2 (pattern checker multi-line try/catch detection). Active reviews #180-227.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 12.9     | 2026-02-03               | Review #226: ai-pattern-checks.js Enhancement - CI + SonarCloud + Qodo (22 items - 3 CRITICAL CI, 7 MAJOR, 10 MINOR, 2 TRIVIAL). **CRITICAL CI**: (1) startsWith() path validation → regex; (2) Regex /g flag with .test() in loop; (3) readFileSync pattern compliance. **MAJOR**: (4-5) SonarCloud S5852 regex DoS fixes - bounded quantifiers; (6) Division by zero safePercent(); (7) File path validation; (8-10) Multi-line detection, scoped packages, query patterns. **NEW PATTERNS**: (78-81) Pattern compliance startsWith→regex, bounded quantifiers, safe percentage, exec() loop. Active reviews #180-226.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 12.8     | 2026-02-02               | Review #225: PR #329 Audit Documentation Enhancement - SonarCloud + Qodo (57 items - 1 CRITICAL SSRF, 6 HIGH, ~45 MEDIUM/LOW). **CRITICAL**: SSRF vulnerability in check-external-links.js - block internal IPs (RFC1918, localhost, cloud metadata). **HIGH**: (1) Timeout validation for CLI args; (2) HTTP redirect handling (3xx = success); (3) 405 Method Not Allowed retry with GET; (4) .planning directory exclusion from archive candidates; (5) Regex operator precedence fix; (6) Shell redirection order fix. **CODE QUALITY**: Number.parseInt, replaceAll, Set for O(1) lookups, batched Array.push, removed unused imports, simplified duplicate checks in regex. **PARALLEL AGENT APPROACH**: Used 4 specialized agents (security-auditor, 2×code-reviewer, technical-writer) in parallel for different file types. Active reviews #180-225.                                                                                                                                                                                                                                                                                                                                                                                                    |
| 12.6     | 2026-02-02               | Review #224: Cross-Platform Config PR - CI Pattern Compliance + SonarCloud + Qodo (27 fixes - 1 CRITICAL, 5 MAJOR, 21 MINOR). **CRITICAL**: GitHub Actions script injection in resolve-debt.yml (S7630) - pass PR body via env var. **MAJOR**: Path containment validation (5 locations). **MINOR**: readFileSync try/catch (8), unsafe error.message (1), percentage clamping (1), MCP null check (1), timestamp validation (1), agent diff content (1), JSON.parse try/catch (1), null object diffing (1), statSync race (1), empty input (1), negative age (1), Array.isArray (1), atomic writes (1), write failures (1). **NEW PATTERNS**: (72) GitHub Actions script injection prevention; (73) env var for user input. 7 false positives rejected. Active reviews #180-224.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 12.3     | 2026-01-31               | Review #223: PR #327 Process Audit System Round 3 - Qodo Security (4 items - 2 HIGH, 2 MEDIUM). **HIGH**: sanitizeError() for check-phase-status.js and intake-manual.js error messages. **MEDIUM**: rollback mechanism for multi-file writes, generic path in error messages. **NEW PATTERNS**: (70) sanitizeError() for user-visible errors; (71) Multi-file write rollback. Active reviews #180-223.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 12.2     | 2026-01-31               | Review #222: PR #327 Process Audit System Round 2 - Qodo (8 items - 6 HIGH, 2 MEDIUM). **HIGH**: (1) intake-manual.js appendFileSync try/catch; (2-4) check-phase-status.js: complete:false on READ_ERROR, only PASS=complete, readdirSync try/catch; (5-6) SKILL.md: Stage 5/6 glob self-inclusion fix, all-findings-raw.jsonl canonical rollups only. **NEW PATTERNS**: (66) Append writes need try/catch; (67) Phase verification = exists AND readable AND PASS; (68) Glob-to-file self-inclusion; (69) Aggregate files use canonical rollups. Active reviews #180-222.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 12.1     | 2026-01-31               | Review #221: PR #327 Process Audit System - CI + Qodo (12 items - 4 CRITICAL CI, 6 MAJOR, 2 MINOR). **CRITICAL CI**: (1) JSONL blank lines/EOF markers; (2) check-phase-status.js syntax error; (3) pathExcludeList false positives for verified try/catch files. **MAJOR**: SKILL.md fixes - AUDIT_DIR realpath validation, explicit file lists for stage 2/3/4 merges. Active reviews #180-221.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 11.0     | 2026-01-24               | **SECURITY INFRASTRUCTURE**: Created proactive security prevention framework after Review #201 required 6 rounds of fixes. **NEW FILES**: (1) `docs/agent_docs/SECURITY_CHECKLIST.md` - Pre-write checklist with 180+ patterns from CODE_PATTERNS.md; (2) `scripts/lib/security-helpers.js` - Reusable secure implementations (sanitizeError, escapeMd, refuseSymlinkWithParents, validatePathInDir, safeWriteFile, safeGitAdd, safeGitCommit, sanitizeFilename, parseCliArgs, safeReadFile, validateUrl, safeRegexExec, maskEmail); (3) `scripts/check-pattern-sync.js` - Verifies consistency between docs and automation. **NEW SCRIPT**: `npm run patterns:sync`. **FEEDBACK LOOP**: PR review → Learnings log → Consolidation → Pattern sync → Checklist/helpers update → Automation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 12.0     | 2026-01-27               | Review #212: Session #103 CI Fix - Pattern Checker False Positives (2 items - 2 MAJOR CI blockers). **MAJOR**: (1) check-roadmap-health.js:39 readFileSync IS in try/catch (L38-47) - added to pathExcludeList; (2) check-roadmap-health.js:175 `rel === ""` IS present - added to pathExclude regex. Both verified false positives. Active reviews #180-212.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 11.9     | 2026-01-27               | Review #211: Session #103 Testing Infrastructure PR - Qodo + SonarCloud + CI (18 items - 5 MAJOR, 6 MINOR, 1 TRIVIAL, 2 DEFERRED, 1 REJECTED). **MAJOR**: (1) readFile error handling with instanceof check; (2-3) CRLF regex compatibility `\r?\n`; (4) Bug L141 - conditional returns same value; (5) Path traversal regex `^\.\.(?:[\\/]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | $)` instead of startsWith. **MINOR**: (1) Test factory counter vs Date.now(); (2) Warning for skipped ROADMAP_FUTURE checks; (3) Track naming regex excludes subsections; (4) PG validation matches "Group" format; (5) Scoped version history regex; (6) Session #102→#103. **DEFERRED**: MCP Memory vs Vector DB; --fix CLI flag. **REJECTED**: Unstructured logging (CLI intentional). **NEW PATTERNS**: (63) Counter-based unique IDs for test factories; (64) Scope regex to relevant section; (65) Format matching for validation scripts (Group vs PG). Active reviews #180-211.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 11.8     | 2026-01-27               | Reviews #208-210: Session #102 Hook Robustness & Security (3 rounds, 20+ items). **Review #208** (7 items): Pattern checker exclusions (3 verified try/catch files), remote branch normalization, path traversal startsWith fix, state write error logging, description sanitization, deleted files filter, stderr warnings. **Review #209** (6 items): Path containment hardening (path.relative), detached HEAD handling, null sessionId state reset prevention, session identity validation, execSync timeout/maxBuffer, agentsInvoked 200-entry cap. **Review #210 R1** (4 items): Project dir validation, stale state false pass fix, task matcher regex ((?i) not JS), atomic state writes (tmp+rename). **Review #210 R2** (4 items): Cross-platform path regex `^\.\.(?:[\\/]                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | $)`, email regex fix [A-Za-z] (was [A-Z                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | a-z] matching literal \|), CI null session skip, hook pathExclude update. **NEW PATTERNS**: (60) Atomic file writes via tmp+rename; (61) Task agent matchers need explicit case variants; (62) path.relative for containment validation. Active reviews #180-210.                                                                                                                                                                                                                                                                                                                       |
| 11.7     | 2026-01-26               | Review #207: Session #99 PR Round 2 - Storage Robustness + React Patterns (6 items - 1 MAJOR CI, 1 MEDIUM placeholder detection, 4 MEDIUM React/storage). **MAJOR CI**: (1) npm run audit:validate needs `--` before `--all` for args to pass through. **MEDIUM**: (2) isPlaceholderLink - add path/anchor detection to avoid false negatives; (3) today-page.tsx getLocalStorage try/catch for Safari private mode; (4) today-page.tsx setLocalStorage isolated try/catch to not block Firestore; (5) use-smart-prompts.ts - move persistence from state updater to useEffect for React Strict Mode. **DEFERRED**: (6) saveBackup logging - silent fail intentional. **PATTERNS**: (57) npm args require `--` separator to pass to script; (58) React state updaters should be pure - move side effects to useEffect; (59) Storage operations need isolation to not block critical saves. Active reviews #180-207.                                                                                                                                                                                                                                                                                                                                              |
| 11.6     | 2026-01-26               | Review #206: Session #99 PR CI Fixes (6 items - 2 MAJOR CI blockers, 3 MINOR, 1 TRIVIAL). **MAJOR CI**: (1) docs/aggregation/README.md missing Purpose section heading - inline bold not recognized as section; (2) audit:validate needs --all flag + continue-on-error (script requires args). **MINOR**: (3) /example/i pattern too broad - matches "example.com" - changed to /^example$/i; (4) Angle bracket pattern too broad - changed to /^<[a-z_-]+>$/i; (5) Generic words check required SAME word match, not just both generic. **TRIVIAL**: (6) saveBackup try/catch for storage quota errors. **PATTERNS**: (55) Tier-1 docs need proper ## section headings, not inline bold; (56) CI scripts needing args must have continue-on-error or explicit args. Active reviews #180-206.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 11.5     | 2026-01-26               | Review #205: Audit False Positive Prevention - Process improvement after CANON-0107/0108 false positives (storage.rules claimed missing but existed). **ROOT CAUSE**: Existence-based findings had HIGH confidence without command output evidence; S2/S3 skip verification. **FIXES TO audit-security.md**: (1) Existence findings MUST include actual command output; (2) Cap confidence at MEDIUM for existence/negative assertions; (3) Add Pre-Backlog Verification step; (4) Check firebase.json references. **NEW PATTERNS**: (53) Verify existence claims with actual ls output; (54) Absence of evidence ≠ evidence of absence. Active reviews #180-205.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 11.4     | 2026-01-26               | Review #204 Round 3: Session #98 PR - CI Pattern Compliance Fixes (3 items - 3 CRITICAL CI blockers). **CRITICAL**: Path validation `startsWith("..")` has false positives for files like "..hidden.md" - use regex `/^\.\.(?:[/\\]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | $)/`; empty string edge case in path.relative(); JSONL parse errors must block strict S0/S1 mode. **FIXES**: Changed to proper regex check + empty check + isAbsolute for Windows drives; added \_parseError blocking in validateS0S1Strict. **PATTERNS**: (52) Regex-based path traversal detection `^\.\.(?:[/\\]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | $)` instead of startsWith. Total 14 fixes across 3 rounds. Active reviews #180-204.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 11.3     | 2026-01-26               | Review #204 Round 2: Session #98 PR - Qodo Security Hardening (5 items - 2 CRITICAL, 2 MAJOR, 1 MINOR). **CRITICAL**: Path traversal in audit-s0s1-validator.js (containment + symlink rejection), trap cleanup bug. **MAJOR**: Fail-closed on invalid dates (empty string return), silent JSONL parse failures (track \_parseError). **MINOR**: ROLLOUT_MODE normalization (trim/uppercase). **NEW PATTERNS**: (50) Path containment validation; (51) Fail-closed parsing. Total 11 fixes across 2 rounds. Active reviews #180-204.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 11.2     | 2026-01-26               | Review #204 Round 1: Session #98 PR - Qodo Compliance + CI Fixes (7 items - 3 CRITICAL, 2 MAJOR, 2 MINOR). **CRITICAL**: Subshell guardrail bypass in pre-commit hook (temp file + while read), lint-staged knip false positive, readFileSync pattern compliance false positive. **MAJOR**: UTC timezone bug in getNextDay, command injection input validation (already mitigated by sanitizeDateString). **MINOR**: ROLLOUT_MODE env-configurable, duplicate constants noted. **NEW PATTERNS**: (48) Pipe subshell variable isolation; (49) UTC date arithmetic. Active reviews #180-204.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 11.1     | 2026-01-24               | Review #203: PR #312 ROADMAP v3.9 Reorganization - Qodo Quality Fixes (24 items - 0 CRITICAL, 2 MAJOR, 10 MINOR, 12 TRIVIAL). **MAJOR**: Security schema explicit encryption fields for sharedPackets snapshot (ciphertext/iv/algorithm), sponsor contact PII encryption comments. **MINOR**: Version metadata v3.0→v3.9 in 3 analysis files, missing-priority count 28→18 correction, priority normalization P4→P3, validation metrics alignment. **TRIVIAL**: Count fixes (T7 3→4, M7-F1 12→11, M7-F4 14→15, M7-F9 5→7, M9-F1 9→8), naming consistency (M4.5 "Security & Privacy"), contradictory completion status removal. Documentation accuracy fixes. Active reviews #180-203.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 10.9     | 2026-01-24               | Review #201: PR #310 Learning Effectiveness Analyzer - Qodo Security Hardening (33 items across 6 rounds - 1 CRITICAL, 26 MAJOR, 4 MINOR, 2 DEFERRED). **CRITICAL**: Git option injection. **MAJOR (R1-5)**: Temp file wx, Markdown injection, relative logging, path validation, escapeMd(), refuseSymlink(), git add -A removal, empty fallback, JSON output. **MAJOR (R6)**: Symlink parent traversal, Git pathspec magic `:`, repo root path validation, wx for JSON, Markdown escape fix. **NEW PATTERNS**: (31-38) R4-5 patterns; (39-41) Symlink parent, pathspec magic, repo root. Total 31 fixes. Active reviews #180-201. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 10.8     | 2026-01-24               | Review #200 Round 4: PR #309 Round 4 - Qodo Final Hardening (12 items - 5 HIGH imp 8-9 Security, 4 MEDIUM imp 7 Quality, 3 MINOR imp 6 Compliance). **HIGH**: Path traversal segment regex `/(?:^\|\/)\.\.(?:\/\|$)/`, CLAUDE_PROJECT_DIR absolute path validation, 4096 char DoS caps, Unicode separator stripping (`\u2028`, `\u2029`), control char removal in sanitizeFilesystemError. **MEDIUM**: Deduplicated sanitization (export from validate-paths.js), segment-based containment (no startsWith), binary file skip, precheck graceful exit. **MINOR**: 500 char log cap, `filePath[0] === "-"` pattern trigger fix. **NEW PATTERNS**: (27) Segment-based path checks; (28) Unicode log injection; (29) Input length DoS caps; (30) Code deduplication via exports. Total 12 fixes. Pattern-check.js: 230 lines. Active reviews #180-200. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                    |
| 10.7     | 2026-01-23               | Review #199 Round 6: Qodo Security Compliance + Code Suggestions (6 items - 1 CRITICAL 🔴 reversed rejection, 4 MAJOR imp 7, 1 ADVISORY). **CRITICAL**: Structured JSON logging (reversed R5 rejection due to escalation - hybrid: JSON for file audit trail, human-readable for console). **MAJOR**: PowerShell null/"null"/array handling, invalid PID filtering (NaN prevention), exact name matching + word-boundary regex for process allowlist, log file permission enforcement (fchmodSync/chmodSync). **ADVISORY**: Process termination design trade-off documented. **NEW PATTERNS**: (23) Structured audit logging (hybrid approach); (24) PowerShell JSON edge cases; (25) Subprocess output validation; (26) Process matching precision. Total 37 fixes across 6 rounds. Final: 386 lines. Active reviews #180-199. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                        |
| 10.6     | 2026-01-23               | Review #199 Round 5: Qodo Code Suggestions + Generic Compliance (7 items - 2 HIGH imp 7-8, 1 MEDIUM imp 6, 1 Compliance, 2 DEFERRED, 1 REJECTED). **HIGH**: Removed deprecated WMIC CSV parsing (use PowerShell directly), added /T flag to taskkill (kills process tree). **MEDIUM**: Normalize Windows newlines (/\r?\n/ regex). **COMPLIANCE**: Added logging to silent catch. **DEFERRED**: Multiple PIDs (same as R3), sleep buffer optimization (marginal benefit). **REJECTED**: Structured logging (overkill for local hook). **NEW PATTERNS**: (20) Deprecated command elimination; (21) Process tree termination; (22) Cross-platform newline handling. Total 32 fixes across 5 rounds. Final: 333 lines. Active reviews #180-199. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 10.5     | 2026-01-23               | Review #199: PR #308 Round 4 - CI Security Scanner + Qodo (4 items - 1 CI CRITICAL blocker, 3 Qodo HIGH importance 7-8). **CRITICAL**: Refactored all execSync to execFileSync with args arrays (eliminates template interpolation). **HIGH**: File type validation for log target (fstatSync/isFile), ESRCH vs EPERM error code handling in process polling, process disappearance race condition handling. **NEW PATTERNS**: (16) Args arrays over template interpolation; (17) Log target type validation; (18) Process signal error code semantics; (19) Process disappearance race handling. Total 28 fixes across 4 rounds. Active reviews #180-199. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 10.4     | 2026-01-23               | Review #198 Round 3: Qodo + CI (9 items - 1 CRITICAL CI blocker unsafe error.message, 2 MAJOR: TOCTOU symlink race + command line exposure, 6 MINOR). **NEW PATTERNS**: (11) TOCTOU-safe file ops (O_NOFOLLOW); (12) Redact command lines in logs; (13) Native process signaling; (14) Graceful shutdown polling; (15) Error message instanceof check. Total 24 fixes across 3 rounds. Final: 278 lines with defense-in-depth. Commits: c674ec3 (R1), a2e6e27 (R2), b49d88e (R3). Active reviews #180-198. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 10.3     | 2026-01-23               | Review #198 Follow-up: Qodo Round 2 - 7 additional security/compliance fixes (2 MAJOR: symlink log overwrite via lstatSync, stricter process allowlist; 3 MINOR: user context in logs, PID validation, Windows PowerShell fallback; 2 TRIVIAL: Atomics.wait sleep, catch block logging). **NEW PATTERNS**: Symlink protection for log files, stricter allowlist for generic processes, user context in security logs, deprecated command fallbacks, cross-platform sleep. Total 15 fixes across 2 rounds. Active reviews #180-198. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10.2     | 2026-01-23               | Review #198: PR #308 Serena Dashboard Hook - Qodo Security & Compliance (8 items - 1 Critical cross-platform, 2 Major security, 3 Minor logging/error handling, 2 Trivial). **KEY PATTERNS**: (1) Cross-platform hooks need Node.js with platform detection; (2) Process termination requires allowlist validation + state checking + audit logging; (3) Git merges can silently remove hook configs - verify after merge; (4) `continueOnError: true` prevents session startup failures. Review #197: PR claude/new-session-z2qIR Expansion Evaluation Tracker (11 items). Active reviews now #180-198. Consolidation counter: 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 10.1     | 2026-01-22               | **ARCHIVE #5**: Reviews #137-179 → REVIEWS_137-179.md (~1195 lines removed). Active reviews now #180-194. Consolidation counter unchanged (0 - no new patterns to consolidate). Archive covers: PR #243 Phase 4B/4C, Settings Page accessibility, Operational visibility sprint, Track A admin panel, aggregate-audit-findings hardening, PR #277 pagination patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 10.0     | 2026-01-20               | Review #190: Cherry-Pick PR Qodo Third Follow-up - 10 fixes (3 Security, 5 Major, 2 Minor). **SECURITY**: Symlink traversal protection in check-docs-light.js, phase-complete-check.js, archive-doc.js using lstatSync + realpathSync. **MAJOR**: Deterministic merge order in aggregate-audit-findings.js (sort after Set→Array), bulk fix conflict detection in verify-sonar-phase.js, safeToIso helper in admin.ts, Windows path detection in check-pattern-compliance.js. **PATTERNS**: (1) Always use lstatSync before statSync to detect symlinks; (2) Sort indices after Array.from(Set) for deterministic iteration; (3) Bulk operations must validate against individual entries for conflicts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9.9      | 2026-01-19               | Review #185: PR 2 TypeScript Files - S3776 Cognitive Complexity Reduction (5 high-complexity TS/TSX files). Files: jobs.ts (42→~15), resources-page.tsx (48→~15), users-tab.tsx (41→~15), settings-page.tsx (41→~15), security-wrapper.ts (39→~15). **KEY PATTERNS FOR TYPESCRIPT**: (1) Extract health check helpers (e.g., `checkErrorRateHealth()`, `checkJobStatusHealth()`); (2) Extract badge/styling helpers (e.g., `getMeetingTypeBadgeClasses()`, `getHomeGenderBadgeClasses()`); (3) Extract state update helpers (e.g., `updateUserInList()`); (4) Extract validation builders (e.g., `buildCleanStartTimestamp()`, `parseDateTimeParts()`); (5) Extract security check steps (e.g., `checkUserRateLimit()`, `handleRecaptchaVerification()`). React pattern: Move helpers outside component to module scope for reuse.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9.8      | 2026-01-19               | Review #184: PR 2 Continued - S3776 Cognitive Complexity Reduction (~40 issues fixed in 9 high-complexity scripts). Files: aggregate-audit-findings.js (87→~25), check-docs-light.js (55→~15), check-backlog-health.js (39→~12), validate-canon-schema.js (37→~12), security-check.js (35→~12), run-consolidation.js (34→~12), validate-audit.js (34→~12), log-session-activity.js (32→~12), generate-documentation-index.js (56→~15). **KEY PATTERNS**: (1) Extract lookup maps for nested ternaries (e.g., `TIER_DESCRIPTIONS`, `ID_PREFIX_CATEGORY_MAP`); (2) Extract `process*IntoSummary()` helpers for event/state processing; (3) Extract `validate*()` helpers for validation chains; (4) Extract `output*()` helpers for console output; (5) Move nested functions to module scope (S2004).                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9.7      | 2026-01-19               | Reviews #182-183: SonarCloud Cleanup Sprint learnings consolidated from deleted AI_LESSONS_LOG.md. Review #182: PR 1 Mechanical Fixes (186 issues, 8 rules, 48 files - node: prefix, shell modernization). Review #183: PR 2 Critical Issues partial (~20 issues, 6 rules - cognitive complexity refactoring, void operator, mutable exports). **KEY LEARNINGS**: Helper extraction for complexity reduction, factory functions for SSR exports, syntax validation after batch operations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 9.6      | 2026-01-18               | Review #142: PR #281 SonarCloud workflow configuration - 11 fixes across 2 rounds (4 Major: SHA pinning, contents:read, Basic auth fix, conclusion polling; 7 Minor: permissions, fork skip, GITHUB_TOKEN). 1 deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 9.5      | 2026-01-18               | **CONSOLIDATION #13 + ARCHIVE #4**: Patterns from Reviews #137-143, #154-179 (33 reviews) → CODE_PATTERNS.md v2.0. **22 new patterns added**: 6 React/Frontend (cursor pagination, Firestore-first, capture before tx, primitive deps, functional setState, claims preservation); 5 Security (isPlainObject, O(n²) DoS, npx --no-install, URL allowlist, self-scanner exclusion); 4 JS/TS (listDocuments, non-greedy JSON, Next.js bundling, cognitive complexity); 3 CI (per-item error, complete loops, pre-push); 2 Docs (YAML frontmatter, xargs hang); 1 GitHub Actions (boolean outputs). **ARCHIVE #4**: Reviews #101-136 → REVIEWS_101-136.md. Active reviews now #137-179. Counter reset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9.4      | 2026-01-18               | Review #179: PR #277 Round 4 - 8 items (1 CRITICAL: cursor-based pagination for batch jobs to prevent infinite loops; 3 MAJOR: Firestore-first operation order, full rollback with captured original values, functional setState updates; 2 MINOR: primitive useEffect deps, null check for days display; 2 VERIFIED: admin error messages acceptable, logSecurityEvent sanitizes). **KEY LESSONS: (1) startAfter(lastDoc) for batch jobs, not hasMore flag; (2) Firestore first for easier rollback; (3) Capture original values before transaction.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 9.3      | 2026-01-18               | Review #178: PR #277 Soft-Delete + Error Export - 18 items (6 MAJOR: hardcoded bucket→default bucket, auth deletion only ignore user-not-found, paged batches for hard delete, Firestore transaction for undelete with expiry check, rollback soft-delete if Firestore fails, block admin self-deletion; 8 MEDIUM: zod validation with trim/max, stale state fix with uid capture, reset dialog on user change, NaN prevention, timeout cleanup ×2, accessibility keyboard listeners ×2; 4 MINOR: structured logging types, ARIA attributes, URL redaction, whitespace trim). **KEY LESSONS: (1) Use admin.storage().bucket() not hardcoded names; (2) Only ignore auth/user-not-found to prevent orphaned accounts; (3) Process batches until empty, not just first 50.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 9.2      | 2026-01-17               | Review #177: Qodo PR #273 - 3 items (1 MAJOR: use `--no-verify` instead of `HUSKY=0` env for CI hook bypass - more explicit/standard; 2 MINOR: trailing slash consistency for `functions/src/admin/` trigger, fix Session #XX→#72 comment). **KEY LESSON: `git commit --no-verify` is more explicit and standard than HUSKY env var for bypassing hooks in CI.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 9.1      | 2026-01-17               | Review #176: Qodo Round 4 - 7 items (1 SECURITY: path traversal hardened in check-docs-light.js with resolve()+startsWith()+sep for Windows drive letter handling; 2 BUG: CRLF JSONL parsing via .trim() before JSON.parse, pipe-safe table parsing using fixed positions from end; 3 DATA: EFFP-\*→engineering-productivity category mapping, self-dependency filtering to prevent loops, omit empty cwe fields; 1 CI: auto-Prettier in npm script chain). **KEY LESSON: resolve()+startsWith()+sep handles Windows paths safely - regex-based path traversal can be bypassed with different drive letters.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 9.0      | 2026-01-17               | Review #175: Qodo Round 3 - 10 items (2 SECURITY: path traversal in check-docs-light.js fixed with /^\.\.(?:[\\/]\|$)/.test(rel), markdown injection prevented with safeCell() escaping; 4 ROBUSTNESS: merged*from ID indexing for stable dependency lookups, blank ROI→undefined handling, REPO_ROOT for cwd-independent paths, ID prefix→category mapping for SEC-010; 2 PERFORMANCE: category bucket cap at 250 to prevent O(n²) blowup; 1 CI: try/catch for all readFileSync + pathExclude update). \*\*KEY LESSON: ID prefix (SEC-*, PERF-\_) is authoritative for category - subcategory metadata can be inconsistent.\*\*                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 8.9      | 2026-01-17               | Review #174: Qodo Round 2 - 4 items (1 HIGH: multi-pass deduplication until fixpoint - merged items may match new candidates; 2 MEDIUM: ROI normalization to uppercase for consistent scoring, O(1) ID index for DEDUP->CANON lookups; 1 CI: Prettier on regenerated output files). **KEY LESSON: Single-pass deduplication is incomplete when merges create new match opportunities - iterate until fixpoint.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 8.8      | 2026-01-17               | Review #173: Qodo Code Suggestions - 5 items (1 HIGH: section-based backlog parsing to avoid missing items with long content; 4 MEDIUM: full merge ancestry preservation, confidence field normalization number→string, deduplication O(n²)→O(n·bucket) with pre-bucketing; 1 CI: Prettier formatting on MASTER_ISSUE_LIST.md). **KEY LESSON: Pre-bucketing by file/category before O(n²) deduplication dramatically reduces comparisons.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 8.7      | 2026-01-17               | Review #172: SonarCloud Regex Complexity + Code Smells - 7 items (1 MAJOR: regex complexity 24>20 in table parsing; 6 MINOR: catch param naming, exception handling, replaceAll() preferences). **KEY LESSON: Complex table-parsing regex should be split into multiple simpler patterns or use a step-wise parsing approach.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 8.6      | 2026-01-17               | Review #171: aggregate-audit-findings.js PR Hardening - 29 items (6 MAJOR: 3 ReDoS regex vulnerabilities, 2 cognitive complexity refactors, 1 algorithmic DoS; 13 MINOR: outputDir guard, error sanitization, unused variables, Array() syntax; 10 TRIVIAL: replaceAll(), Prettier; 2 DEFERRED: CLI logging style, local file access). **KEY LESSON: Pattern compliance scripts need same security rigor as production code.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 8.5      | 2026-01-17               | Review #170: Non-Plain Object Redaction + GCP URL Whitelist - 10 items (3 MAJOR: non-plain object redaction bypass, GCP URL whitelist for open redirect, set() merge vs update(); 6 MINOR: adminGetLogs access log, structured storage cleanup errors, typeof for rollback value, Number.isFinite for userCount, cursor type validation, useEffect unmount guard, always-mounted tab panels; 1 REJECTED: Zod validation details - admin endpoint acceptable). **KEY LESSON: isPlainObject() returns non-plain objects unchanged - must serialize to safe representation.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 8.4      | 2026-01-17               | Review #169: ReDoS + Rollback Fix + Console Redaction - 8 items (3 MAJOR: ReDoS in email regex, rollback uses prev privilege not 'free', redact console output; 5 MINOR: severity clamp, metadata type check, string cursor sentinels, typeof userCount checks; 2 REJECTED: 5th index scope flip-flop, storage risk-accepted). **KEY LESSON: Console output bypasses Firestore redaction - must redact metadata before logging.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 8.3      | 2026-01-17               | Review #168: Claims Rollback + JSON Safety - 7 items (4 MAJOR: rollback Firestore on claims failure, toJsonSafe for Timestamps, sentinel timestamps for cursors, error key redaction; 3 MINOR: Array.isArray in adminSetUserPrivilege, tabpanel ARIA elements, userCount N/A display). **KEY LESSON: Claims can fail after Firestore write - need try/catch rollback for atomicity.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 8.2      | 2026-01-17               | Review #167: Asymmetric Privilege Security + Robustness - 14 items (2 CRITICAL: CI Prettier, asymmetric privilege order GRANT:Firestore→claims REVOKE:claims→Firestore; 4 MAJOR: block privilege deletion in use, pagination cursor stability, truncate log fields, structured error logging; 8 MINOR: ARIA tabs semantics, tablist role, userCount nullable, label fix, metadata validation, privilege sanitization, Array.isArray guard, type-only React import; 1 REJECTED: 4th flip-flop on index scope). **KEY LESSON: Privilege changes need asymmetric fail-safe order - grant=Firestore-first, revoke=claims-first.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8.1      | 2026-01-17               | Review #166: Track A CI Fixes & Robustness - 16 items (3 CRITICAL: CI TS error from #165 JSX.Element→React.ComponentType, missing version history; 4 MAJOR: privilege update order, userCount fallback, storeLogInFirestore error sanitization, userId validation; 2 MINOR: preserve non-plain metadata, normalize privilege defaults; 7 REJECTED: 3rd flip-flop on index scope, risk-accepted issues, duplicates). **KEY LESSON: JSX.Element requires React import; React.ComponentType is safer. AI keeps flip-flopping on index scope - ALWAYS verify against code.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 8.0      | 2026-01-17               | Review #165: Track A Follow-up Qodo Compliance - 12 items (1 CRITICAL: CI Prettier blocker; 4 MAJOR: raw error logging, pagination loop guard, isPlainObject metadata, REVERT #164 index scope error; 2 MINOR: storage deploy cmd, button a11y; 1 TRIVIAL: React namespace type; 4 REJECTED: message PII redesign, compliance-only). **KEY LESSON: Verify AI suggestions against actual code - #164 gave wrong advice about COLLECTION_GROUP vs COLLECTION scope.** New patterns: isPlainObject() for metadata redaction, pagination loop guards. ⚠️ **NOTE: JSX.Element change caused TS2503 - reverted in #166.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7.9      | 2026-01-17               | Review #164: Track A Cherry-Pick PR Qodo Compliance - 10 items (1 CRITICAL: Firestore index queryScope; 3 MAJOR: PII in logs, storage pagination, metadata redaction on read; 3 MINOR: structured logging, array validation, Storage ACL docs; 3 REJECTED: risk-accepted Firestore logging, compliance-only items). New patterns: COLLECTION_GROUP for collection group queries, paginate bucket.getFiles(), redact metadata on read for defense-in-depth. ⚠️ **NOTE: Index scope change was INCORRECT - reverted in #165.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 7.8      | 2026-01-17               | Review #163: Track A PR Follow-up Compliance - 12 items (5 MAJOR: per-item error handling, transaction for privilege updates, auth error propagation, schema validation, raw error UI; 5 MINOR: rename cleanupOldDailyLogs, null for claims, listDocuments, built-in types guarantee, observability note; 2 TRIVIAL: storage ACL docs, message PII risk-accept). New patterns: Per-item error handling in jobs, Firestore transactions for updates, listDocuments() for ID-only queries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 7.7      | 2026-01-16               | Review #162: Track A Admin Panel PR Feedback - 22 items (1 CRITICAL: CI blocker README formatting; 8 MAJOR: error swallowing, PII in logs, claims bug, orphan detection, N+1 queries; 11 MINOR: UX improvements; 2 DEFERRED to roadmap). New patterns: Metadata redaction, preserve custom claims, collectionGroup queries, batch auth lookups.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 7.6      | 2026-01-16               | Review #161: lint-staged PR Feedback - 3 items (2 MAJOR: supply-chain risk with npx, hidden stderr errors; 1 MINOR: README/ROADMAP Prettier formatting). New patterns: Use `npx --no-install` for security, expose hook error output for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7.5      | 2026-01-16               | Review #160: PR #265 Qodo Suggestions - 2 items (2 MINOR: scope getConsolidationStatus to section for robustness, normalize paths for cross-platform matching). New patterns: Scope document section parsing to prevent accidental matches elsewhere, normalize backslashes + lowercase for Windows compatibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 7.4      | 2026-01-16               | Review #159: PR #265 CI Round 3 - 6 items (1 MAJOR: false positive readFileSync:413 - add to pathExclude; 5 MINOR: remove unused path import, unused \_error→\_, stdout/stderr logging for debugging, quiet mode output suppression, TTY-aware colors). New patterns: Update pathExclude for verified try/catch files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7.3      | 2026-01-16               | Review #158: PR #265 CI Round 2 - 8 items (3 MAJOR: unsafe error.message at check-cross-doc-deps.js:280, readFileSync without try/catch at run-consolidation.js:386, git option injection missing -- separator; 5 MINOR: escape regex in dynamic RegExp, ESM→CommonJS consistency, scope updateConsolidationCounter to section, path matching improvements, session-start warnings counter). 2 REJECTED: audit context + unstructured logs are intentional CLI design. New patterns: Always use -- before paths in git commands, escape user input in RegExp constructors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7.2      | 2026-01-16               | Review #157: PR #265 Session #69 Feedback - 11 items (1 MAJOR: ReDoS prevention bounded regex; 6 MINOR: execFileSync for getStagedFiles, verbose logging, TTY-aware colors, regex validation, exit code warning, path.basename matching; 4 TRIVIAL: unused imports, pre-commit override hint, Prettier). 1 REJECTED: Qodo false positive on exitCode definition. New patterns: Bound regex quantifiers for ReDoS, TTY-aware ANSI colors, path.basename for file matching.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 7.1      | 2026-01-16               | Review #156: Security Hardening & Pre-Push Fix - 4 items (2 MAJOR: pre-push scans pushed commits not staged, --file path traversal protection; 2 MINOR: backlog excludes Rejected Items, cross-platform regex). New patterns: Pre-push vs pre-commit file selection, path traversal in CLI args, cross-platform regex.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7.0      | 2026-01-16               | Review #155: Security Check Self-Detection & CI Fix - 4 items (2 MAJOR: security-check.js/check-pattern-compliance.js SEC-002 self-exclusion; 2 MINOR: CI workflow boolean flag for --all detection, session-start.js execSync timeout/maxBuffer). New patterns: Self-referential exclusion for security scanners, multiline output comparison in GitHub Actions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 6.9      | 2026-01-15               | Review #154: Admin Error Utils Security Hardening - 5 items (5 MINOR: URL credential/port rejection, JWT token redaction, phone regex separator requirement, boundary test fix). New patterns: URL credential injection prevention, JWT base64url detection, phone regex precision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 6.8      | 2026-01-15               | Review #153: Admin Error Utils Follow-up - 6 items (1 CRITICAL: CI blocker transient, 5 MINOR: TLD regex bound {2,63}, large input guard 50K chars, nullable types on all 3 functions with tests). New patterns: TLD max 63 chars per RFC, guard against large payloads, explicit nullable types for robustness.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6.7      | 2026-01-15               | Review #152: Admin Error Utils PR Feedback - 7 items (1 CRITICAL: CI blocker already resolved, 1 MAJOR: email regex ReDoS fix with RFC 5321 length limits, 1 MINOR: trim whitespace dates, 2 TRIVIAL: code cleanup, 2 REJECTED: SonarCloud false positives on security tests). New patterns: Regex ReDoS prevention with length limits, security test false positives in SonarCloud.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 6.6      | 2026-01-15               | Review #148: Dev Dashboard Security Hardening - 8 items fixed (3 MAJOR: Prettier blank line, raw error exposure, client write-only; 5 MINOR: network errors, stale state, null guard, safe error extraction, non-nullable prop). New patterns: Never expose raw Firebase errors, dev data client read-only, defensive null guards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6.5      | 2026-01-15               | Review #147: CI Blocker Fixes + Firebase Error Handling - 7 items (1 CRITICAL: logger.debug TS2339; 3 MAJOR: ROADMAP date format, Firestore dev/\* rules, Firebase error specificity; 3 MINOR: token refresh, network errors, errorCode logging). New patterns: prettier-ignore for linter conflicts, explicit admin rules for dev collections, getIdTokenResult(true) for fresh claims.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6.4      | 2026-01-14               | Review #145: Settings Page Accessibility & Security - 14 items (5 MAJOR: toggle accessibility, date validation, preference preservation, timezone bug, form labels; 9 MINOR: useAuth deprecated, props readonly, silent return, error logging, audit logging, change detection). New patterns: Accessible toggle (button+role=switch), local date formatting, preference spread.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6.3      | 2026-01-13               | Review #141: PR Review Processing Round 3 - 5 items (1 MEDIUM: schema category token normalization, 4 LOW: grep -E portability, header verification coverage). New patterns: Schema category enums should be single CamelCase tokens without spaces, always use grep -E for alternation patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 6.2      | 2026-01-13               | Review #140: PR Review Processing Round 2 - 7 items (1 MEDIUM: grep xargs hang fix, 6 LOW: category enum alignment, improved grep patterns for empty catches and correlation IDs, grep portability fixes). New patterns: Use while read instead of xargs, align category names with schema enums.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 6.1      | 2026-01-13               | Review #139: PR Review Processing - 11 items (2 MAJOR: missing YAML frontmatter in slash commands, 8 MINOR: documentation lint fixes, grep pattern improvements, Debugging Ergonomics category added to audit-code). New patterns: Commands need YAML frontmatter, Tier-2 docs need Purpose/Version History sections.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6.0      | 2026-01-12               | ARCHIVE #3: Reviews #61-100 → REVIEWS_61-100.md (1740 lines removed, 3170→1430 lines). Active reviews now #101-136. Session #58.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5.9      | 2026-01-12               | CONSOLIDATION #11: Reviews #121-136 → CODE_PATTERNS.md v1.7 (16 new patterns: 6 Security, 4 JS/TS, 5 CI/Automation, 1 GitHub Actions). Counter reset. Session #57.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 5.8      | 2026-01-12               | Review #136: PR CI Feedback Round 3 (SonarQube + Qodo + CI) - 14 items. Fixed: 7 MAJOR security (admin.ts PII logging sanitized - log queryLength/queryType instead of raw query, leaky error message in adminTriggerJob, Firestore auto-ID instead of Date.now() for collision resistance, id field placement after spread, HttpsError preservation in migrateAnonymousUserData, meetings.ts batch delete chunking for 500-doc limit, use-journal.ts sanitization order - script/style before tags), 3 MAJOR quality (Array.isArray guards in generateSearchableText, unused deps added to knip ignore), 4 MINOR (GLOBAL_EXCLUDE added to pattern checker for dev utility scripts with pre-existing debt). New pattern: Chunk batch operations under Firestore 500-op limit. Session #55.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 5.7      | 2026-01-12               | Review #135: PR Cherry-Pick CI Feedback Round 2 (Qodo + CI) - 10 items. Fixed: 6 MAJOR (Prettier formatting 518 files, dependency issues - removed @modelcontextprotocol/sdk + undici, added globals + postcss-load-config, duplicate exports in error-boundary.tsx, pattern compliance pathExclude for meta-detection, matchesWord() wildcard support for ".?" patterns), 4 MINOR (coderabbit exit code opt-in via CODERABBIT_EXIT_ON_FINDINGS env var, pattern-check.js cross-platform path handling using path.sep). Pre-existing issues documented in ROADMAP.md. Session #55.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 5.6      | 2026-01-12               | Review #134: PR Cherry-Pick CI Feedback (Qodo + CI) - 12 items. Fixed: 7 MAJOR (session-start.js path containment security bug using path.relative(), add rel === "" checks to 5 hook files, escape regex in analyze-user-request.js), 5 MINOR (detect sensitive paths in coderabbit-review.js, cap file sizes, exit non-zero on findings, trim input, secure logging). Verified 4 false positives from pattern checker (readFileSync already in try/catch). New pattern: Include rel === "" in all path.relative() containment checks. Session #55.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 5.5      | 2026-01-12               | Review #133: PR #238 Round 3 (Qodo + CI) - 12 items. Fixed: 6 MAJOR (JSON arg parsing + path containment + sensitive file filter in coderabbit-review.js, path.relative() containment in check-write/edit-requirements.js + check-mcp-servers.js, lockfile hash null handling in session-start.js), 5 MINOR (filter empty server names, check error/signal in pattern-check.js, wrap realpathSync, stderr for messages, path.relative in pattern-check.js). New patterns: Use path.relative() for robust cross-platform containment, return null not 'unknown' on hash failures, filter sensitive files before external tool calls. Session #55.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5.4      | 2026-01-12               | Review #132: PR #238 Compliance Fixes (Qodo + CI) - 14 items. Fixed: 1 MAJOR command injection (quote $ARGUMENTS in settings.json for coderabbit-review.js), 1 MAJOR project dir validation (pattern-check.js), 4 MINOR security hardening (Windows backslash normalization, option-like/multiline path rejection in check-write/edit-requirements.js), 3 MINOR (combine stdout+stderr in pattern-check.js, file size cap DoS protection in check-mcp-servers.js, TOCTOU try/catch in coderabbit-review.js), 2 MINOR (5s timeout for hasCodeRabbit(), CLI arg ordering fix --plain before --), 1 FIX (dead else-if ESLint error). New patterns: Quote all shell arguments, normalize Windows paths for cross-platform, cap file sizes before reads. Session #55.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5.3      | 2026-01-12               | Review #131: PR #238 CI Fix (ESLint + Qodo Compliance) - 17 items. Fixed: 7 CRITICAL ESLint errors in all .claude/hooks/_.js files (no-undef for process/console/require - use `/_ global require, process, console _/`for flat config), 1 MAJOR command injection (execSync→spawnSync in pattern-check.js), 3 MAJOR path traversal (use path.resolve + containment check), 2 MINOR (remove 'design' keyword ambiguity, fix unused 'error' var), 4 MINOR (useless escape, unused import). New patterns: Use`/_ global _/`not`/_ eslint-env \*/` for ESLint flat config, use spawnSync for safe subprocess calls. Session #55.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5.2      | 2026-01-12               | Review #130: PR #236 Round 4 (SonarQube + Qodo) - 27 items parsed across 2 rounds. Fixed: 5 MAJOR (sensitive logging in admin search/journal/crud-table, error.message in alerts), 2 MINOR (doc lint patterns, midnight refresh for daily quote). 16 items verified ALREADY FIXED from #127-129. New pattern: Log errorType/errorCode only, use generic user-facing messages. Session #54.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 5.1      | 2026-01-12               | Review #129: PR #236 Post-Commit Feedback (SonarQube + Qodo) - 9 items on new code (2 CRITICAL: cognitive complexity refactor, production reCAPTCHA fail-closed; 4 MAJOR: cache failures, initial state alignment, localStorage try/catch, error cause chain; 3 MINOR: globalThis.window, Intl.DateTimeFormat, secure logging). New patterns: Extract helpers to reduce complexity, fail-closed security in production, cache error states to prevent retry storms, use globalThis over window for SSR. Session #53.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 5.0      | 2026-01-11               | Review #128: PR #236 Follow-up (Qodo) - 5 items (1 HIGH: Sentry IP privacy fix; 1 MEDIUM: CI arg separator; 1 DEFERRED: doc ID hashing; 2 ALREADY DONE from #127). New patterns: Third-party PII hygiene, CLI arg injection prevention. Session #52.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4.9      | 2026-01-11               | Review #127: PR #236 Comprehensive Review (SonarQube + Qodo) - 14 items (3 CRITICAL: pin GitHub Action SHA, harden reCAPTCHA bypass, fix IPv6 normalization; 4 MAJOR: regex precedence, sanitize error messages, reset journalLoading; 6 MINOR: operationName granularity, CI main-only push, simplify IP retrieval, audit trails, log sensitivity). Session #50.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 4.8      | 2026-01-11               | Review #126: Tier-2 Output PR Feedback Round 3 (Qodo) - 4 items (3 MINOR: HUMAN_SUMMARY merged IDs column for traceability, CANON_QUICK_REFERENCE enum clarification, AUDIT_PROCESS_IMPROVEMENTS normalize:canon fallback note; 1 TRIVIAL: version header already 4.7). All applied. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 4.7      | 2026-01-11               | Review #125: Tier-2 Output PR Feedback Round 2 (Qodo) - 4 items (2 MINOR: HUMAN_SUMMARY DEDUP IDs in Top 5 table, PR_PLAN.json PR3 dedup IDs; 1 TRIVIAL: version header 4.5→4.6). 1 rejected (assign PR19 to App Check items - PR19 doesn't exist, "-" is correct). Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 4.6      | 2026-01-11               | Review #124: Tier-2 Output PR Feedback (Qodo) - 9 items (1 MAJOR rejected: project management tools - static docs intentional for AI context; 6 MINOR: PR_PLAN dedup IDs, REFACTOR_BACKLOG PR associations, PR-LINT reference, HUMAN_SUMMARY next steps, included_dedup_ids field; 2 TRIVIAL: npm script note, hardcoded count). 1 rejected (CANON-0005 distinct from DEDUP-0001: client vs server App Check). New pattern: Dedup IDs should be explicitly linked in PR plans. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4.5      | 2026-01-11               | Review #123: TIER-2 AGGREGATION (Task 4.3.1-4.3.6) - Cross-category unification of 118 CANON findings. Output: 97 unique findings (21 merged as duplicates), 12 duplicate clusters identified, 21 PRs planned. Key findings: 5 S0 Critical (memory leak, legacy writes, CI gates, complexity, App Check), 32 S1 High, 42 S2 Medium, 18 S3 Low. Comprehensive scope: CANON + SonarQube (548) + ESLint (246) = ~891 total. Session #49.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4.4      | 2026-01-11               | Review #122: PR #232 Round 2 - 3 items (1 MEDIUM: CRLF normalization + regex whitespace; 2 LOW: process.exitCode for buffer flush, bash version check). New patterns: Normalize CRLF for cross-platform, use process.exitCode over process.exit(), check BASH_VERSION for bash-specific scripts. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4.3      | 2026-01-11               | Review #121: PR #232 Qodo/SonarCloud - 13 items (4 MAJOR: exit code docs, stderr suppression, large JSON gitignore, CI trigger syntax; 5 MINOR: line counting, script detection, archive parsing, repo-root path, try/catch; 3 LOW: NaN guard, glob reliability, merge conflict). New patterns: Document all exit codes, capture stderr for debugging, gitignore large generated files. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4.2      | 2026-01-11               | CONSOLIDATION #10: Reviews #109-120 → CODE_PATTERNS.md v1.6 (5 new patterns: 3 Security, 2 JS/TS). Counter reset. Session #48.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4.1      | 2026-01-11               | Review #120: PR #228 Qodo Round 3 - 4 items (2 URGENT prototype pollution/secure logging, 1 HIGH fail-fast validation, 1 MEDIUM GitHub Actions workflow undefined fix). CANON-0043 verified correct. New patterns: Use Map for untrusted keys, never log raw input content, fail-fast on parse errors. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 4.0      | 2026-01-11               | Review #119: PR #228 Qodo Round 2 - 9 items (2 MAJOR NaN-safe sorting/missing-ID validation, 6 MINOR category normalization/coverage output/session tracking/finding count, 1 TRIVIAL trailing newline). Deferred: JSON Schema migration. New pattern: Ensure numeric fields have robust fallbacks for sorting. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3.9      | 2026-01-11               | Review #118: PR #228 Follow-up Feedback - 1 item (1 HIGH report-to-JSONL ID mismatches). Updated 3 markdown audit reports + CANON-REFACTOR.jsonl to use normalized CANON-XXXX IDs. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3.8      | 2026-01-11               | Review #117: PR #228 Qodo Feedback - 8 items (1 CRITICAL dependency ID rewriting bug in normalize script, 3 HIGH error handling/outdated IDs, 4 MEDIUM duplicate detection/category handling/FS error handling/legacy ID references). New patterns: CANON ID normalization must update all references including dependencies. Session #47.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3.7      | 2026-01-11               | Review #116: PROCESS/AUTOMATION AUDIT (Task 4.2.6) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 38 raw findings → 14 canonical. Severity: S0 (1): non-blocking CI gates; S1 (3): script coverage, security scanning, deploy gcloud; S2 (6): pre-commit slow, workflow docs; S3 (4): permissions, false positives. **SUB-PHASE 4.2 COMPLETE** - All 6 audit categories finished. Session #46.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3.6      | 2026-01-11               | Review #115: DOCUMENTATION AUDIT (Task 4.2.5) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 37 raw findings → 14 canonical. Severity: S1 (2): broken links, [X] placeholders; S2 (8): Tier 2 metadata, orphaned docs; S3 (4): archive rot, fragile anchors. Session #46.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.5      | 2026-01-10               | Review #114: REFACTORING AUDIT (Task 4.2.4) - Multi-AI aggregated audit (5 models: Copilot, Sonnet 4.5, Opus 4.5, Codex, ChatGPT 5.2). 65 raw findings → 27 canonical. Severity: S0 (1): cognitive complexity; S1 (7): type drift, deprecated paths; S2 (15): duplication clusters; S3 (4): batch fixes. Session #45.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3.4      | 2026-01-09               | Review #113: PR #225 Comprehensive Compliance - 6 items (1 HIGH ampersand entity injection, 2 MEDIUM HTTPS enforcement/JSON parsing, 3 MINOR encodeURI/private:true/nullish coalescing). Session #39 continued.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3.3      | 2026-01-09               | Review #112: PR #225 Final Compliance - 6 items (3 HIGH injection/SSRF/stack-trace, 3 MEDIUM timeout/logging/archived-paths). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3.2      | 2026-01-09               | Review #111: PR #225 Compliance Fixes - 8 items (2 HIGH SSRF/secret exposure, 5 MEDIUM error handling/validation/performance, 1 LOW unstructured logging). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3.1      | 2026-01-09               | Review #110: PR #225 Follow-up - 6 items (3 MAJOR path canonicalization/archive boundary/exclude boundary, 3 MINOR indented code blocks/recursion deferred). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 3.0      | 2026-01-09               | Review #109: PR #225 Feedback - 16 items (2 CRITICAL FS error handling/error exposure, 4 MAJOR JSON mode/ReDoS/symlink/cross-platform, 9 MINOR, 1 TRIVIAL). Rejected framework suggestion. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.9      | 2026-01-09               | CONSOLIDATION #9: Reviews #98-108 → CODE_PATTERNS.md v1.4 (18 patterns: 6 JS/TS, 4 Security, 3 CI/Automation, 3 Documentation, 2 General). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.8      | 2026-01-09               | Review #108: Update Dependencies Protocol - new mandatory pattern for tightly-coupled docs. Added ⚠️ Update Dependencies to 4 key documents. Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2.7      | 2026-01-09               | Review #107: PR #224 Feedback - 2 items (SSR guard, status label) + process fix (/fetch-pr-feedback auto-invoke). Consolidation threshold reached (10 reviews). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2.6      | 2026-01-08               | Review #106: PR Review Processing - 16 items (8 MAJOR ReDoS/path-traversal/ID-parsing/validation/threshold-consistency, 6 MINOR env-metadata/FP-patterns/scope-clarity, 2 TRIVIAL). Session #40.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2.5      | 2026-01-08               | Review #105: PR Review Processing - 17 items (4 MAJOR ReDoS/JSONL/schema, 9 MINOR docs/patterns, 4 TRIVIAL). Session #39.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2.4      | 2026-01-08               | Review #104: PR Review Processing - 18 items (4 MAJOR security pattern/baselines/JSON metrics, 9 MINOR shell portability/INP metrics, 5 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2.3      | 2026-01-08               | Review #103: PR Review Processing - 10 items (2 MAJOR hasComplexityWarnings+getRepoStartDate, 5 MINOR JSON/docs, 3 TRIVIAL). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2.2      | 2026-01-08               | Review #102: PR Review Processing - 19 items (1 MAJOR cognitive complexity refactor, 5 MINOR date validation/node: prefix/Number.parseInt/String.raw, 10 TRIVIAL code style). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2.1      | 2026-01-08               | Review #101: PR Review Processing - 36 items (12 Critical, 5 Major, 17 Minor, 2 Trivial). Session #38.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2.0      | 2026-01-07               | CONSOLIDATION #8: Reviews #83-97 → CODE_PATTERNS.md v1.3 (6 Security Audit patterns, new category). Session #33 session-end cleanup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.99     | 2026-01-07               | Reviews #92-97: Security audit PR review feedback (6 reviews, 24 items total). Schema improvements: OWASP string→array, file_globs field, severity_normalization for divergent findings, F-010 conditional risk acceptance with dependencies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.93     | 2026-01-07               | Review #91: Audit traceability improvements (5 items) - 5 MINOR (severity_normalization field, adjudication field, F-010 severity in remediation, item count, log lines metric), 6 REJECTED (⚪ compliance items - doc-only PR, code fixes in Step 4B)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.92     | 2026-01-07               | Review #90: Security audit metadata fixes (7 items) - 5 MINOR (log lines metric, severity breakdown, secrets_management status, F-010 duplicate, Review #88 severity clarity), 1 TRIVIAL (hyphenation), 1 REJECTED (consolidation count)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.91     | 2026-01-07               | Review #89: Security audit documentation fixes (9 items) - 8 MINOR (F-010 severity, secrets_management status, duplicate model entry, SESSION_CONTEXT dates/status, active review range/count, progress percentage), 1 TRIVIAL (hyphenation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.90     | 2026-01-07               | Review #88: SECURITY AUDIT (Phase 4.2) - Multi-AI aggregated audit (Claude Opus 4.5 + ChatGPT 5.2), 10 canonical findings. Severity: S0 (1): F-001 Firestore bypass; S1 (2): F-002 rate-limiting, F-003 reCAPTCHA; S2 (6): F-004–F-009; S3 (1): F-010 risk-accepted. Overall: NON_COMPLIANT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.89     | 2026-01-07               | Review #87: Schema symmetry & markdown syntax (4 fixes) - 1 MAJOR (QUALITY_METRICS_JSON null schema), 3 MINOR (stray code fences in PROCESS/REFACTORING/DOCUMENTATION)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.88     | 2026-01-07               | Review #86: Qodo follow-up on Review #85 (3 fixes, 1 rejected) - 1 MINOR (broken link), 2 TRIVIAL (Bash-only clarity, copy-safe snippet), 1 REJECTED (duplicate pathspec separator)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.87     | 2026-01-07               | Review #84-85: Process quality improvements - #84: Review #83 follow-up (4 metadata fixes), #85: Qodo suggestions on Review #84 commit (3 fixes: git verification, threshold clarity, archive status)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.86     | 2026-01-07               | Review #83: Archive & Consolidation Metadata Fixes (5 fixes) - 1 REJECTED (false positive: #41 data loss), 1 MAJOR (broken links), 1 MINOR (status sync), 2 TRIVIAL (line count, wording)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.85     | 2026-01-07               | CONSOLIDATION #7: Reviews #73-82 → CODE_PATTERNS.md v1.2 (9 patterns: 3 Bash/Shell portability, 6 Documentation quality)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.84     | 2026-01-07               | ARCHIVE #2: Reviews #42-60 → REVIEWS_42-60.md (1048 lines removed, 2425→1377 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.83     | 2026-01-07               | Review #82: Post-commit review fixes (6 items) - 0 MAJOR, 5 MINOR (review range, Last Updated date, SECURITY.md path, markdown formatting, CANON-0032 status), 1 TRIVIAL (code fence), 1 HIGH-LEVEL (generator fix recommendation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.82     | 2026-01-07               | Review #81: Documentation linter fixes (57 errors) - 3 MAJOR (missing ARCHITECTURE.md/DEVELOPMENT.md links, missing Purpose in claude.md), 8 MINOR (broken links, missing sections), 4 TRIVIAL (date placeholders, metadata)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.81     | 2026-01-07               | Review #80: 3 fixes - 2 MINOR (PR_PLAN.json structured acceptance_tests, CANON-CODE.jsonl source identifiers), 1 TRIVIAL (document version sync)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.80     | 2026-01-06               | Review #79: 10 fixes, 1 rejected - 3 MAJOR (JSONL parser-breaking output in 3 templates), 4 MINOR (bash portability, JSON validity, path clarity, count accuracy), 3 TRIVIAL (metadata consistency) - rejected 1 suggestion contradicting established canonical format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.79     | 2026-01-06               | Review #78: 12 fixes - 2 MAJOR (invalid JSONL NO-REPO output, missing pipefail in validator), 7 MINOR (JSON placeholders, NO-REPO contract, markdown links, category count, model names, audit scope, last updated date), 3 TRIVIAL (review range, version history, model name consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.78     | 2026-01-06               | Review #77: 9 fixes - 2 MAJOR (shell script portability, broken relative links), 5 MINOR (invalid JSONL, severity scale, category example, version dates, review range), 2 TRIVIAL (environment fields, inline guidance)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.77     | 2026-01-06               | Review #76: 13 fixes - 3 MAJOR (model naming, broken link paths, PERFORMANCE doc links), 8 MINOR (SECURITY root cause evidence, shell exit codes, transitive closure, division-by-zero, NO-REPO contract, category enum, model standardization, vulnerability type), 2 TRIVIAL (version metadata, review range)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.76     | 2026-01-06               | Review #75: 17 fixes - 2 MAJOR (SECURITY schema category names, vulnerability deduplication), 8 MINOR (regex robustness, JSONL validation, deduplication rules, averaging methodology, model matrix, link paths), 2 TRIVIAL (version verification, duplicate check), 1 REJECTED (incorrect path suggestion)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.75     | 2026-01-06               | Review #74: 18 fixes - 6 MAJOR (broken links, schema fields, deduplication clarity, observability, placeholders, GPT-4o capabilities), 9 MINOR (fail-fast, URL filtering, NO-REPO MODE, environment, methodology, output specs, links, alignment), 3 TRIVIAL (version, dates, context)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.74     | 2026-01-06               | Review #73: 9 fixes - 2 MAJOR (model name self-inconsistency, NO-REPO MODE clarity), 4 MINOR (chunk sizing, regex, JSONL validation, stack versions), 3 TRIVIAL (documentation consistency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.73     | 2026-01-06               | CONSOLIDATION #6: Reviews #61-72 → CODE_PATTERNS.md v1.1 (10 Documentation patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.72     | 2026-01-06               | Review #72: 21 fixes - 12 CRITICAL (broken links to JSONL_SCHEMA, GLOBAL_SECURITY_STANDARDS, SECURITY.md, EIGHT_PHASE_REFACTOR), 5 MAJOR (version/stack placeholders), 4 MINOR (paths, regex, commands)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.71     | 2026-01-06               | Review #71: Documentation improvements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.70     | 2026-01-06               | Review #70: Template refinements                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.69     | 2026-01-06               | Review #69: Multi-AI audit plan setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.68     | 2026-01-06               | Review #68: 17 fixes - 4 MAJOR (App Check path, SonarQube remediation, function rename, review ordering), 10 MINOR (sorting, grep, versions, regex, ranges), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.67     | 2026-01-06               | Review #67: 14 fixes - 4 MAJOR (grep -E, deterministic IDs, App Check tracking, SonarQube tracking), 7 MINOR (verification, enums, paths, ordering), 3 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.66     | 2026-01-05               | Review #66: 13 fixes - 4 MAJOR (evidence rules, output format, npm safety, apiKey guidance), 8 MINOR (counters, grep portability, YAML, model names), 1 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.65     | 2026-01-05               | Review #65: 19 fixes - 4 MAJOR (security doc hardening, deterministic CANON IDs), 10 MINOR (paths, assertions, category names), 5 TRIVIAL (model names)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.64     | 2026-01-05               | Review #64: 31 fixes - 6 MAJOR (security pseudocode, Firebase key clarity, grep hardening), 8 MINOR (progress calc, paths), 17 TRIVIAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.63     | 2026-01-05               | Review #63: 15 fixes total - 7 broken relative paths, 8 minor improvements (version entries, secrets example, tier notes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.62     | 2026-01-05               | Review #62: 10 fixes - 1 CRITICAL (client-side credentials), 4 MAJOR (schema, links, model), 5 MINOR/TRIVIAL (2 Minor, 3 Trivial)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.61     | 2026-01-05               | Review #61: Stale review assessment, path prefix fix, terminology update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.60     | 2026-01-05               | CONSOLIDATION #5: Reviews #51-60 → claude.md v2.9 (10 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.59     | 2026-01-05               | Review #60: Document sync, grep exclusion fix, CANON-ID guidance, duplicate link removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.58     | 2026-01-05               | Review #59: Prompt schema improvements, grep --exclude, Quick Start section, link text consistency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.57     | 2026-01-05               | Review #58: Template compliance (MULTI_AI_REFACTOR_AUDIT_PROMPT.md), link format consistency, American English                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.56     | 2026-01-05               | Review #57: CI fix (broken stub links), effort estimate arithmetic, optional artifact semantics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.55     | 2026-01-05               | Review #56: Effort estimate correction, remaining code fences, stub path references (PARTIAL FIX - see #57)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.54     | 2026-01-05               | Review #55: Nested code fence fixes, artifact naming, acceptance criteria, schema references                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.53     | 2026-01-05               | Review #54: Step 4B + SLASH_COMMANDS.md, broken archive links, code fence escaping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.52     | 2026-01-05               | Review #53: CI fix, regex bounding, path.relative() security                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.51     | 2026-01-05               | Review #52: Document health/archival fixes from Qodo/CodeRabbit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.50     | 2026-01-04               | RESTRUCTURE: Tiered access model, Reviews #1-40 archived (3544→~1000 lines)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.49     | 2026-01-04               | Review #51: ESLint audit follow-up, infinite loop fix, regex hardening                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.48     | 2026-01-04               | EFFECTIVENESS AUDIT: Fixed 26→0 violations in critical files; patterns:check now blocking                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.47     | 2026-01-04               | CONSOLIDATION #4: Reviews #41-50 → claude.md v2.8 (12 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.46     | 2026-01-04               | Review #50: Audit trails, label auto-creation, .env multi-segment, biome-ignore                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.45     | 2026-01-04               | Review #49: Workflow hardening, robust module detection, dead code removal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.44     | 2026-01-04               | Review #48: Security hardening, OSC escapes, fail-closed realpath, pathspec fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.43     | 2026-01-04               | Review #47: PII masking, sensitive dirs, printf workflow, fault-tolerant labels                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.42     | 2026-01-04               | Review #46: Symlink protection, realpath hardening, buffer overflow, jq/awk fixes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.41     | 2026-01-04               | Review #45: TOCTOU fix, error.message handling, path containment, tier matching, PR spam                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.40     | 2026-01-03               | CONSOLIDATION #3: Reviews #31-40 → claude.md v2.7 (14 patterns added)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.39-1.0 | 2026-01-02 to 2026-01-03 | Reviews #1-40 (see [archive](./archive/reviews-markdown-legacy/REVIEWS_1-40.md))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

</details>

---

## 📊 Tiered Access Model

This log uses a tiered structure to optimize context consumption:

| Tier  | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | When to Read                  | Size        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----------- |
| **1** | [claude.md](../CLAUDE.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Always (in AI context)        | ~115 lines  |
| **2** | [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | When investigating violations | ~612 lines  |
| **3** | Active Reviews (below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Deep investigation            | ~2400 lines |
| **4** | Archive ([#1-40](./archive/reviews-markdown-legacy/REVIEWS_1-40.md), [#42-138](./archive/reviews-markdown-legacy/REVIEWS_42-138.md), [#139-195](./archive/reviews-markdown-legacy/REVIEWS_139-195.md), [#196-259](./archive/reviews-markdown-legacy/REVIEWS_196-259.md), [#260-299](./archive/reviews-markdown-legacy/REVIEWS_260-299.md), [#300-341](./archive/reviews-markdown-legacy/REVIEWS_300-341.md), [#342-383](./archive/reviews-markdown-legacy/REVIEWS_342-383.md), [#384-423](./archive/reviews-markdown-legacy/REVIEWS_384-423.md), [#424-457](./archive/reviews-markdown-legacy/REVIEWS_424-457.md)) | Historical research           | ~8000 lines |

**Read Tier 3 only when:**

- Investigating a specific pattern's origin
- Processing new review feedback
- Checking for similar past issues

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

## 🔔 Consolidation

Consolidation state is managed automatically via JSONL files (Session #156):

- **State:** `.claude/state/consolidation.json`
- **Reviews:** `.claude/state/reviews.jsonl`
- **Auto-trigger:** `node scripts/run-consolidation.js --auto` (runs at
  session-start)
- **Manual run:** `npm run consolidation:run -- --apply`

No manual counter updates needed. The system auto-consolidates when 10+ reviews
accumulate.

> **Note:** Consolidation state was corrupted (stuck at #0) from ~Session #156
> to #192. Six stale consolidation records from that period have been removed
> (all showed "no patterns found" due to empty JSONL pattern data). State was
> reset and fixed in Session #193. See consolidation.json for current state.

<details>
<summary>Previous Consolidation (#3)</summary>

- **Date:** 2026-03-13
- **Reviews consolidated:** #471-#484
- **Recurring patterns:**
  - qodo (11x)
  - ci (9x)
  - sonarcloud (9x)

</details>
<details>
<summary>Previous Consolidation (#2)</summary>

- **Date:** 2026-03-09
- **Reviews consolidated:** #452-#470
- **Recurring patterns:**
  - qodo (19x)
  - gemini (13x)
  - ci (11x)
  - clarify-ai-implementation-time (9x)
  - verify-doc-math-before-commit (9x)
  - --tests-without-assertions-are-worse-than-no-tests-they-prov (4x)
  - cache-counting-bug (4x)
  - fp-1fp-4-test-assertions (4x)
  - global-settings-deterministic-testing (4x)
  - restore-continueonerror (4x)
  - secret-packaging-denylist (4x)
  - yaml-boundary-detection (4x)

</details>
<details>
<summary>Previous Consolidation (#1)</summary>

- **Date:** 2026-03-06
- **Reviews consolidated:** #438-#451
- **Recurring patterns:**
  - qodo (14x)
  - sonarcloud (12x)
  - gemini (8x)
  - ci (7x)

</details>
<details>
<summary>Previous Consolidation (#2)</summary>

- **Date:** 2026-03-05
- **Reviews consolidated:** #448-#458
- **Recurring patterns:**
  - add-planning-exclusions-to-all-scanning-tools-before-committ (6x)
  - add-security-checklist-to-ecosystem-audit-checker-template (6x)
  - auto-compute-changelog-metrics (6x)
  - avoidable- (6x)
  - avoidable-rounds (6x)
  - batch-related-fixes (6x)
  - batched-protocol-effectiveness (6x)
  - batched-protocol-is-effective (6x)
  - blocking-implement-cc-pre-push-check (6x)
  - cc-pre-push-check (6x)
  - cc-progressive-reduction (6x)
  - composite-key-for-nullable-ids (6x)
  - critical-implement-cc-pre-push-check (6x)
  - critical-suppress-qodo-cjs-compliance-noise (6x)
  - custom-semgrep-rule-maturation (6x)
  - design-validators-with-dry-runcomparison-pattern-from-the-st (6x)
  - ecosystem-audit-template (6x)
  - efficiency (6x)
  - enforce-propagation-grep-on-truthy-filters (6x)
  - escapecell-propagation (6x)
  - first-scan-volume (6x)
  - fixtemplates (6x)
  - geministyleguidemd (6x)
  - no-new-fixtemplates-needed (6x)
  - no-new-templates-needed (6x)
  - note (6x)
  - pattern-13-fix-one-audit-all (6x)
  - pattern-checker (6x)
  - planning-artifact-template (6x)
  - pre-push-hook (6x)
  - propagation-miss (6x)
  - qodo-repeat-rejection-noise (6x)
  - qodo-suppression (6x)
  - qodopr-agenttoml (6x)
  - regex-sweep-after-any-s5852-fix (6x)
  - review-data (6x)
  - rollback-on-dual-write-failure (6x)
  - run-propagation-audit-before-pushing-review-fixes (6x)
  - run-sonarcloud-locally-before-pushing (6x)
  - score (6x)
  - semgrep-rule-template (6x)
  - semgrep-rule-test-harness (6x)
  - single-highest-impact-change (6x)
  - sonarcloud-config (6x)
  - sonarcloud-repeat-fps (6x)
  - sonarcloud-s6354-suppression (6x)
  - suppress-internal-tooling-security-noise (6x)
  - suppress-sonarcloud-s5852s4036-false-positives (6x)
  - tool-exclusions-needed-upfront (6x)
  - trend (6x)
  - when-adding-escapesanitization-functions (6x)
  - ci (5x)
  - ci-1 (5x)
  - qodo (5x)
  - log-malformed-jsonl-lines (3x)
  - qodo-10 (3x)
  - rejected-4 (3x)
  - semgrep-1 (3x)
  - sonarcloud (3x)
  - sonarcloud-8 (3x)
  - validate-cli-args-before-parse (3x)

</details>
<details>
<summary>Previous Consolidation (#13)</summary>

- **Date:** 2026-03-04
- **Reviews consolidated:** #402-#449
- **Recurring patterns:**
  - qodo (13x)
  - sonarcloud (12x)
  - ci (7x)
  - gemini (5x)
  - learnings (4x)
  - composite-key-for-nullable-ids (3x)
  - rollback-on-dual-write-failure (3x)

</details>
<details>
<summary>Previous Consolidation (#12)</summary>

- **Date:** 2026-03-04
- **Reviews consolidated:** #402-#444
- **Recurring patterns:**
  - qodo (10x)
  - sonarcloud (9x)
  - ci (6x)
  - learnings (4x)
  - gemini (3x)

</details>
<details>
<summary>Previous Consolidation (#11)</summary>

- **Date:** 2026-03-02
- **Reviews consolidated:** #402-#442
- **Recurring patterns:**
  - qodo (8x)
  - sonarcloud (8x)
  - ci (4x)
  - learnings (4x)

</details>
<details>
<summary>Previous Consolidation (#10)</summary>

- **Date:** 2026-03-02
- **Reviews consolidated:** #466-#477
- **Recurring patterns:**
  - qodo (8x)
  - sonarcloud (8x)
  - cc-reduction-getlatestloghash (4x)
  - cognitive-complexity-extraction (4x)
  - composite-key-for-nullable-ids (4x)
  - fd-based-file-operations-toctou-mitigation (4x)
  - handle-exception-context (4x)
  - harden-table-input (4x)
  - invocation-id-collision (4x)
  - line-number-accuracy (4x)
  - regex-character-class-escaping (4x)
  - relax-reviewid-regex (4x)
  - retrorecordparse-safeparse (4x)
  - rollback-on-dual-write-failure (4x)
  - safeparse-for (4x)
  - sanitize-markdown-headings (4x)
  - sanitize-markdown-render (4x)
  - stringraw (4x)
  - temp-file-symlink-race (4x)
  - toctou-race-appendentries (4x)

</details>
<details>
<summary>Previous Consolidation (#9)</summary>

- **Date:** 2026-03-01
- **Reviews consolidated:** #454-#465
- **Recurring patterns:**
  - qodo (6x)
  - sonarcloud (5x)

</details>
<details>
<summary>Previous Consolidation (#8)</summary>

- **Date:** 2026-03-01
- **Reviews consolidated:** #442-#453
- **Recurring patterns:**
  - qodo (6x)
  - compliance (4x)
  - ci (3x)
  - pattern-checker-rename-no-fallback-requires-all-4-elements (3x)
  - sonarcloud (3x)

</details>
<details>
<summary>Previous Consolidation (#7)</summary>

- **Date:** 2026-03-01
- **Reviews consolidated:** #431-#441
- **Recurring patterns:**
  - qodo (5x)
  - sonarcloud (5x)
  - learnings (3x)

</details>
<details>
<summary>Previous Consolidation (#6)</summary>

- **Date:** 2026-03-01
- **Reviews consolidated:** #420-#430
- **Recurring patterns:**
  - qodo (9x)
  - ci (7x)
  - sonarcloud (7x)
  - learnings (5x)

</details>
<details>
<summary>Previous Consolidation (#5)</summary>

- **Date:** 2026-03-01
- **Reviews consolidated:** #407-#419
- **Recurring patterns:**
  - premature-dedup-new-set-before-duplicate-detection-defeats (7x)
  - qodo (5x)
  - ci (3x)
  - learnings (3x)
  - sonarcloud (3x)

</details>
<details>
<summary>Previous Consolidation (#4)</summary>

- **Date:** 2026-02-27
- **Reviews consolidated:** #392-#406
- **Recurring patterns:**
  - No recurring patterns above threshold

</details>
<details>
<summary>Previous Consolidation (#3) — 2026-02-27</summary>

- **Date:** 2026-02-27
- **Reviews consolidated:** #385-#399
- **Recurring patterns:**
  - No recurring patterns above threshold

</details>
<details>
<summary>Previous Consolidation (#2) — 2026-02-27</summary>

- **Date:** 2026-02-27
- **Reviews consolidated:** #1-#399
- **Recurring patterns:**
  - qodo (100x)
  - ci (49x)
  - security (39x)
  - sonarcloud (38x)
  - compliance (29x)
  - documentation (20x)
  - symlink (20x)
  - cc (12x)
  - validation (11x)
  - atomic write (8x)
  - sanitiz (5x)
  - cc reduction (4x)
  - cognitive complexity (4x)
  - cross-platform (4x)
  - error handling (4x)
  - fail-closed (4x)
  - gemini (4x)
  - injection (4x)
  - atomic-file-writes (3x)
  - eslint (3x)
  - propagation (3x)
  - prototype pollution (3x)
  - redos (3x)
  - refactor (3x)
  - regex dos (3x)

</details>
<details>
<summary>Consolidation #1 (2026-02-27, Session #193)</summary>

- **Reviews consolidated:** #358-#399 (50 reviews)
- **Root cause fix:** Expanded keyword matching in run-consolidation.js (added
  CC, SonarCloud, Qodo, Gemini, CI, symlink, propagation, compliance, CRLF)
- **Recurring patterns:**
  - qodo (7x)
  - ci (6x)
  - sonarcloud (6x)
  - cc (5x)
  - gemini (4x)
  - compliance (3x)

</details>
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

## 📏 Document Health Monitoring

**Check at regular intervals (every 10 reviews or weekly).**

**Automated archival:** `npm run reviews:archive` (preview) or
`npm run reviews:archive -- --apply` (execute).

### Current Metrics

| Metric         | Value          | Threshold | Action if Exceeded                       |
| -------------- | -------------- | --------- | ---------------------------------------- |
| Main log lines | ~2048          | 1500      | Run `npm run reviews:archive -- --apply` |
| Active reviews | 24 (#353-#490) | 30        | Run `npm run reviews:archive -- --apply` |

### Restructure History

| Date       | Change                                                            | Before → After      |
| ---------- | ----------------------------------------------------------------- | ------------------- |
| 2026-02-17 | Overhaul: removed Quick Index, collapsed version history, cleanup | ~3400 → ~3100 lines |
| 2026-01-07 | Document health maintenance, archived #42-60                      | 2425 → 1386 lines   |
| 2026-01-04 | Tiered access model, archived #1-40                               | 3544 → ~1000 lines  |

---

## 🤖 AI Instructions

**This document is the audit trail for all AI code review learnings.**

### Tiered Reading Strategy

1. **Always have:** claude.md (critical patterns) +
   [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md) for details
2. **For pattern lookup:** Read CODE_PATTERNS.md
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
5. **Run** `npm run reviews:sync -- --apply` to sync to JSONL

---

## 📁 Archive Reference

**Reviews #1-457** have been archived in nine files (repaired 2026-03-05:
deduplicated, non-overlapping ranges):

### Archive 1: Reviews #1-40

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_1-40.md](./archive/reviews-markdown-legacy/REVIEWS_1-40.md)
- **Status:** 40 reviews archived.

### Archive 2: Reviews #42-138

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_42-138.md](./archive/reviews-markdown-legacy/REVIEWS_42-138.md)
- **Status:** 40 reviews archived.

### Archive 3: Reviews #139-195

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_139-195.md](./archive/reviews-markdown-legacy/REVIEWS_139-195.md)
- **Status:** 40 reviews archived.

### Archive 4: Reviews #196-259

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_196-259.md](./archive/reviews-markdown-legacy/REVIEWS_196-259.md)
- **Status:** 40 reviews archived.

### Archive 5: Reviews #260-299

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_260-299.md](./archive/reviews-markdown-legacy/REVIEWS_260-299.md)
- **Status:** 40 reviews archived.

### Archive 6: Reviews #300-341

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_300-341.md](./archive/reviews-markdown-legacy/REVIEWS_300-341.md)
- **Status:** 40 reviews archived.

### Archive 7: Reviews #342-383

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_342-383.md](./archive/reviews-markdown-legacy/REVIEWS_342-383.md)
- **Status:** 40 reviews + 11 retrospectives archived.

### Archive 8: Reviews #384-423

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_384-423.md](./archive/reviews-markdown-legacy/REVIEWS_384-423.md)
- **Status:** 40 reviews + 9 retrospectives archived.

### Archive 9: Reviews #424-457

- **Archive location:**
  [docs/archive/reviews-markdown-legacy/REVIEWS_424-457.md](./archive/reviews-markdown-legacy/REVIEWS_424-457.md)
- **Status:** 20 reviews archived. Access archives only for historical
  investigation of specific patterns.

---

## Active Reviews

### Review 492: PR #453 R4 — Mixed (CI+SonarCloud+Qodo) (2026-03-19)

**Date:** 2026-03-19 | **PR:** #453 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 16    | 11    | 0        | 5        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 1        | 2     | 10    | 3       |

**Patterns:**

- prettier-ci-formatting
- cc-extraction-helper
- code-fence-negated-condition
- atomic-write-backup-hardening
- validatePaths-defensive-guard
- heading-vs-shell-comment

**Learnings:**

- R3 code-fence logic increased CC from 15 to 16 — extract helper to stay under
  threshold
- Prettier must be run after code edits, not just before commit
- Qodo flip-flops between rounds — evaluate on merits, don't blindly follow
- shouldSkipNpmLine # check must distinguish shell comments from Markdown
  headings
- R4 fix rate 69% — still productive, R5 may hit diminishing returns

---

### Review 491: PR #453 R3 — Mixed (Qodo+SonarCloud+CI) (2026-03-19)

**Date:** 2026-03-19 | **PR:** #453 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 23    | 22    | 0        | 1        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 3     | 13    | 7       |

**Patterns:**

- secret-redaction-global-regex
- date-validation-nan-guard
- atomic-write-backup-restore
- section-heading-regex-robustness
- memory-guard-large-files
- fail-fast-missing-dependency
- code-fence-language-aware-skip
- dedup-key-completeness

**Learnings:**

- indexOf-based secret redaction only finds first occurrence per line — use
  global regex
- daysSince without date format validation propagates NaN silently
- Corrupted state files reported as missing hides data integrity issues
- Code block skipping should be language-aware to validate shell examples
- Large JSONL logs should use appendFileSync above 2MB to avoid memory blowup

---

### Review 356: PR #431 R2 — Data Effectiveness Audit Schema & Security Fixes (2026-03-13)

**Date:** 2026-03-13 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 54    | 54    | 0        | 0        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 2        | 8     | 21    | 23      |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Schema refactored without updating all consumers
- Prevention: Schema migration checklist — grep all consumers before shipping
- Root cause: Ad-hoc regex instead of using existing validatePathInDir helper
- Prevention: Always use security-helpers.js for path validation
- Root cause: Copy-paste fallbacks diverged from canonical implementation
- Prevention: All fallbacks must match the 5-replace canonical pattern

---

### Review 357: PR #431 R3 — Robustness, Complexity & Propagation Fixes (2026-03-13)

**Date:** 2026-03-13 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 26    | 16    | 0        | 10       |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 2        | 8     | 14    | 2       |

**Patterns:**

- root-cause
- prevention
- propagation

**Learnings:**

- Root cause: Overly broad catch-all added to complement Windows path
- Prevention: Canonical sanitizeError should only redact known-sensitive
- Propagation: Fixed in 8 files (canonical + 7 fallback copies)
- Root cause: Single functions doing too much — iteration + mutation +
- Prevention: Extract helpers when function has >2 concerns
- Root cause: Test helper didn't account for the security boundary

---

### Review 482: PR #429 R1 — SonarCloud + Qodo + CI (2026-03-13)

**Date:** 2026-03-13 | **PR:** #429 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 15    | 12    | 1        | 2        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 1        | 5     | 6     | 0       |

**Learnings:**

- Mixed (SonarCloud Security Hotspots, SonarCloud Code Smells, Qodo PR
- PR #429 / tooling-code-plan **Items:** 15 total (Critical: 1,
- First review round on tooling/code-plan PR (46 files). Mix of new
- Deferred: 1 item (DEBT-45528)
- Rejected: 2 items (S4036 PATH: `execFileSync` doesn't use shell; secure
- Dead imports from pre-migration code can trigger CI blockers — `setDoc` was in
- Hook placement matters: `block-push-to-main.js` is a PreToolUse hook (blocks

---

### Review 483: PR #429 R2 — Qodo + Gemini + CI (2026-03-13)

**Date:** 2026-03-13 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 0     | 0     | 0        | 0        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 0     | 0     | 0       |

**Learnings:**

- Auto-generated DEBT entries (e.g. from log-override.js hook bypass detection)
- When Zod schemas and documentation disagree on enum values, check existing
- SARIF upload guarded by `hashFiles() != ''` without asserting file existence
- Validator scripts claiming "all files" coverage but only checking a hardcoded

---

### Review 484: PR #429 R3 — SonarCloud + Qodo + CI (2026-03-13)

**Date:** 2026-03-13 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 0     | 0     | 0        | 0        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 0     | 0     | 0       |

**Learnings:**

- Semgrep `--test` mode catch blocks must distinguish between "flag not
- IIFE-in-template-literal (`${(() => {...})()}`) is valid JS but hurts
- Cross-round dedup saves effort: R3 item 7 (hook.command logging risk) was

---

### Review 358: PR #431 R4 — Modernization, Complexity & Data Guards (2026-03-14)

**Date:** 2026-03-14 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 52    | 37    | 0        | 15       |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 2        | 3     | 0     | 34      |

**Patterns:**

- lesson

**Learnings:**

- Lesson: When SonarCloud will re-flag the same items every round, fix them
- Rejected: 15 items (2 R3 dedup, 13 over-engineering/false-positive)
- POSIX path redaction (R3 dedup — R3 deliberately removed this regex)
- OS temp directory for tests (R3 dedup — tests need repo boundary compat)
- Symlink security in run-alerts.js (isSafeToWrite guard already at L515)

---

### Review 359: PR #431 R5 — Backup Safety, Nullish Coalescing & Error Context (2026-03-14)

**Date:** 2026-03-14 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 18    | 11    | 0        | 7        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 2     | 9     | 7       |

**Learnings:**

- Fixed: 11 items across 9 files
- Rejected: 7 items (5 cross-round dedup from R3/R4, 1 architectural, 1 FP)
- Symlink overwrite risk (R4 dedup — isSafeToWrite guard at L515)
- Set.has x2 (R4 dedup — string.includes(), not array)
- Unix path redaction (R3+R4 dedup — deliberately removed in R3)
- Type-dependent design (R4 dedup — simple boolean in 6-line function)

---

### Review 360: PR #431 R6 — Sanitization, Scaffold Validity & Baseline Bug (2026-03-14)

**Date:** 2026-03-14 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 20    | 14    | 0        | 6        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 1     | 12    | 7       |

**Learnings:**

- Fixed: 14 items across 8 files
- Rejected: 6 items (3 cross-round dedup R4+R5, 1 architectural, 2
- Set.has for tableContent (R4+R5 dedup — string.includes(), not array)
- Set.has for antiPatternSection (R4+R5 dedup — string.includes(), not array)
- Type-dependent design (R4+R5 dedup — simple boolean in 6-line function)
- No JSONL schema validation (architectural — downstream has Number.isFinite and

---

### Review 361: PR #431 R7 — Flagged Section Sanitization, TOCTOU & Diminishing Returns (2026-03-14)

**Date:** 2026-03-14 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 17    | 6     | 0        | 11       |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 1     | 9     | 7       |

**Learnings:**

- Fixed: 6 items across 5 files
- Rejected: 11 items (4 cross-round dedup R4-R6, 1 intentional TODO scaffold, 6
- Set.has for tableContent (R4+R5+R6 dedup — string.includes())
- Set.has for antiPatternSection (R4+R5+R6 dedup — string.includes())
- Type-dependent design (R4+R5+R6 dedup — simple boolean)
- OS temp dir for test (R3+R4 dedup — repo boundary needed)

---

### Review 485: PR #436 R1 — Qodo + Gemini + CI (2026-03-15)

**Date:** 2026-03-15 | **PR:** #436 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 7     | 2     | 0        | 5        |

---

### Review 486: PR #448 R1 — Mixed (Qodo+Gemini+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 49    | 47    | 0        | 2        |

---

### Review 487: PR #448 R2 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 0     | 0     | 0        | 0        |

---

### Review 488: PR #448 R3 — Mixed (Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 0     | 0     | 0        | 0        |

---

### Review 489: PR #448 R4 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 0     | 0     | 0        | 0        |

---

### Review 490: PR #448 R5 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 0     | 0     | 0        | 0        |

---

### Review rev-1: PR #448 R1 — Mixed (Qodo+Gemini+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 49    | 47    | 0        | 2        |

**Patterns:**

- grep-false-positive
- migration-silent-noop
- timestamp-string-comparison
- review_rounds-mutation-bug
- semgrep-over-suppression
- cc-extraction
- path-traversal-fix
- symlink-guard

**Learnings:**

- grep patterns must not match success messages
- migration scripts must fail loudly on missing source
- use Date.parse not string comparison for timestamps
- semgrep pattern-not-inside with $X.map suppresses unrelated $ARR[0]

---

### Review rev-2: PR #448 R2 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 27    | 19    | 0        | 8        |

**Patterns:**

- eslint-cjs-config
- no-control-regex-block
- cli-path-traversal
- promise-allsettled
- number-nan-convention
- cc-extraction

**Learnings:**

- eslint-disable-next-line only covers one line
- CJS files need sourceType commonjs for \_\_dirname
- passthrough entries change test expectations

---

### Review rev-3: PR #448 R3 — Mixed (Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 18    | 10    | 0        | 8        |

**Patterns:**

- path-traversal-resolution
- dompurify-forbid-contents
- dedup-index-latest
- numeric-normalization
- cc-extraction

**Learnings:**

- DOMPurify ALLOWED_TAGS:[] preserves script body — use FORBID_CONTENTS
- dedup index must keep latest entry per key
- path traversal guards at every entry point

---

### Review rev-4: PR #448 R4 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 17    | 10    | 0        | 7        |

**Patterns:**

- security-scan-exclusions
- symlink-staged-filter
- deterministic-errors
- safeappend-containment
- shared-sanitize
- cc-extraction

**Learnings:**

- security scan false-positives on test files asserting pattern strings
- replaceAll propagation to test assertions

---

### Review rev-5: PR #448 R5 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**Date:** 2026-03-18 | **PR:** #448 | **Source:** mixed

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 18    | 11    | 0        | 7        |

**Patterns:**

- eslint-compiled-output
- coerce-int-validation
- bidirectional-crossdb
- toctou-lstat
- dedup-timestamp-fallback

**Learnings:**

- CI compiled output needs ESLint ignores
- non-numeric coercion to 0 hides violations

---

### Review 354: PR #427 R4 — TOCTOU Hardening, Sanitize Fallbacks, Semgrep Rule ID Fix (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 25    | 20    | 0        | 5        |

---

### Review 353: PR #427 R2 — Security Fail-Closed, Error Safety Codemod, Bulk Lint (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 21    | 18    | 0        | 3        |

---

### Review 480: PR #427 R3 — Mixed (CI + CodeQL + Semgrep + Qodo + SonarCloud) (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 45    | 45    | 0        | 0        |

---

### Review 481: PR #427 R5 — Qodo + Semgrep + SonarCloud (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 23    | 20    | 0        | 3        |

## Key Patterns

- **AI hallucination in planning docs:** DIAGNOSIS.md claimed
  `aggregate-audit-findings.js` L1950 had "10-level nested instanceof
  corruption" — verified false against actual codebase. AI-generated planning
  docs must be verified before accepting claims about code state.
- **Forward-referencing non-existent software:** Plan referenced "ESLint v10
  Migration" with `npm install eslint@^10.0.0`, but DIAGNOSIS.md in the same set
  correctly noted v10 doesn't exist (v9.39.4 is stable). Plans must not assume
  future software exists — use "preparation" language instead.
- **Worktree compatibility:** Pre-commit hook used
  `$(git rev-parse --show-toplevel)/.git/hook-output.log` which fails in
  worktrees where `.git` is a file, not a directory. Fix: use
  `$(git rev-parse --git-dir)/hook-output.log`.
- **Doc lint as automated quality gate:** Missing Purpose/Scope,
  Status/Progress, Version History sections were caught by CI doc lint. These
  sections should be included from the start in planning doc templates.

---

#### Review #354: PR #427 R4 — TOCTOU Hardening, Sanitize Fallbacks, Semgrep Rule ID Fix (2026-03-12)

**Source:** Mixed (Qodo Compliance + Suggestions, Semgrep/CodeQL, CI Pattern
Compliance) **PR/Branch:** PR #427 / testing-31126 **Suggestions:** 25 total
(Critical: 2, Major: 11, Minor: 8, Trivial: 4)

**Patterns Identified:**

1. TOCTOU in atomic write helpers: isSafeToWrite checks at function entry become
   stale by the time mutation ops execute in error-recovery paths.
   - Root cause: Single upfront check doesn't protect retry/fallback paths
   - Prevention: Re-check isSafeToWrite immediately before each mutation op

2. Fallback sanitizeInput missing control char stripping: 6 hook files had
   `String(v).slice(0, 500)` fallback — no protection against log injection via
   control characters.
   - Root cause: Original fallback only truncated, didn't sanitize
   - Prevention: Propagation sweep caught all 6 instances (2 flagged + 4 found)

3. Semgrep nosemgrep comments using wrong rule ID: Custom rule
   `sonash.security.no-eval-usage` not suppressed by community rule ID
   `javascript.lang.security.detect-eval-with-expression`.
   - Root cause: nosemgrep comments copied from community rule, not updated for
     custom rule
   - Prevention: Both rule IDs now in all nosemgrep comments

4. Pattern compliance checker heuristic is line-based: rmSync within 10 lines of
   renameSync = violation, regardless of control flow (catch handlers, error
   paths). Copy+unlink is the safe alternative.
   - Root cause: Simple line-scanning heuristic doesn't model try/catch
   - Prevention: Use copy+unlink fallback pattern instead of rmSync+renameSync

**Resolution:**

- Fixed: 20 items (including 4 propagation fixes for sanitizeInput fallbacks)
- Deferred: 0 items
- Rejected: 5 items (4 compliance items: hooks lack user context by design; 1
  code suggestion: pre-delete conflicts with compliance checker)

**Key Learnings:**

- Propagation sweep is critical: sanitizeInput fallback fix found 4 additional
  unfixed files beyond the 2 Qodo flagged
- Pattern compliance heuristic doesn't understand control flow — restructure
  code to avoid the pattern entirely rather than adding it in catch handlers
- Always add BOTH community + custom rule IDs to nosemgrep comments

---

#### Review #353: PR #427 R2 — Security Fail-Closed, Error Safety Codemod, Bulk Lint (2026-03-12)

**Source:** Mixed (Qodo Compliance, Semgrep, SonarCloud, CI, Qodo Suggestions)
**PR/Branch:** PR #427 / testing-31126 **Suggestions:** 21 total (Critical: 1,
Major: 6, Minor: 8, Trivial: 3, Rejected: 2, Stale: 1)

**Patterns Identified:**

1. Symlink guard fail-open: 8 instances of `isSafeToWrite = () => true` fallback
   across 7 hook files — security module failure silently disables all write
   protections.
   - Root cause: R1 introduced try/catch guards but used fail-open fallback
   - Prevention: ESLint rule for fail-open patterns in security guard loading

2. Unsafe error.message access: 308 instances across 129 files — catch params
   accessed without instanceof Error check crash on non-Error throws.
   - Root cause: Pattern accumulated over time, no auto-fixer existed
   - Prevention: Added auto-fixer to ESLint rule + ConditionalExpression guard
     detection to prevent cascading re-fixes

3. Atomic write patterns: Multiple files using rmSync+renameSync instead of
   try-rename-first approach — data loss window between delete and rename.
   - Root cause: Inconsistent application of atomic write best practice
   - Prevention: Consider ESLint rule for rmSync-before-renameSync anti-pattern

**Resolution:**

- Fixed: 18 items (including 308 error.message instances via auto-fixer)
- Deferred: 0 items
- Rejected: 2 items (1 false positive, 1 intentional design)

**Key Learnings:**

- ESLint auto-fixers are the right tool for mechanical codebase-wide fixes —
  added fixer to no-unsafe-error-access rule with ConditionalExpression guard
  detection to prevent cascading
- pr-review skill Rule 6 updated: "pre-existing" no longer auto-dismissible;
  must present user with fix (+ effort estimate) or DEBT options

---

### Review #480: PR #427 R3 — Mixed (CI + CodeQL + Semgrep + Qodo + SonarCloud) (2026-03-12)

**Source:** Mixed (CI blocking, CodeQL, Semgrep, Qodo Compliance, Qodo
Suggestions, SonarCloud) **PR/Branch:** PR #427 / testing-31126 **Items:** 45
total (Fixed: 45, Deferred: 0, Rejected: 0)

**Patterns Identified:**

1. R2 auto-fixer nested ternary residue: ESLint auto-fixer for
   no-unsafe-error-access produced overly nested ternaries
   (`error && typeof error === "object" && "message" in error ? error instanceof Error ? error.message : String(error) : String(error)`)
   that SonarCloud flagged as cognitive complexity and object-stringification
   issues.
   - Root cause: R2 auto-fixer didn't simplify pre-guarded patterns
   - Fix: Manual simplification to
     `error instanceof Error ? error.message : String(error)`
   - Files: assign-review-tier.js, check-backlog-health.js, lighthouse-audit.js

2. rmSync-before-renameSync in 7 state-manager.js copies: CI blocking pattern
   (data-loss window). First agent fix introduced NEW violations by using bare
   renameSync without try/catch, requiring a second pass.
   - Root cause: Agent didn't understand cross-device rename semantics
   - Fix: `safeRename` helper with copyFileSync+unlinkSync fallback
   - Prevention: Agent instructions need explicit cross-device fallback pattern

3. Cognitive complexity reduction (3 files): check-backlog-health.js (CC 22→15),
   cleanup-alert-sessions.js (CC 17→15), validate-canon-schema.js (CC 17→15).
   - Technique: Extract helper functions (parseSingleEntry,
     tryDeleteSessionFile, readFileContent, checkDuplicateId,
     parseAndValidateLine)

4. Semgrep false positives on safe patterns: setTimeout with arrow (not string
   eval), process.argv[1] for main-module detection (not filesystem access),
   execFileSync with clamped integer arg (not injection).
   - Fix: nosemgrep comments with justification

5. Eval-usage false positives: CodeQL/Semgrep flagged setTimeout, Function
   constructor usage that were safe. Fixed with inline suppression comments.

**Resolution:**

- Fixed: 45 items (28 original + 17 SonarCloud)
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- ESLint auto-fixer output should be reviewed for over-nesting before commit —
  R2's auto-fixer created 4 files with unnecessarily complex ternaries that
  triggered SonarCloud in R3
- Agent fixes for pattern compliance need explicit verification — Agent 1's
  initial rmSync fix introduced 18 new violations (up from 5 original)
- Cross-device rename fallback (copyFileSync+unlinkSync) must be in every
  safeRename helper — bare renameSync fails on cross-device moves
- CC reduction via helper extraction is mechanical but effective — 3 files
  reduced by extracting 2-3 helpers each

---

### Review #481: PR #427 R5 — Qodo + Semgrep + SonarCloud (2026-03-12)

**Source:** Mixed (Qodo Compliance, Qodo Code Suggestions, Semgrep, SonarCloud)
**PR/Branch:** PR #427 / testing-31126 **Items:** 23 total (Major: 6, Minor: 12,
Trivial: 5)

**Context:** Fifth review round on large hook-systems-audit PR (426 files). R5
focused on security hardening of fallback implementations, CC reduction, and
pattern compliance.

**Issues Found:**

1. Fallback sanitizeInput regex too permissive:
   `[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]` preserved tab, LF, CR, and ESC — enabling
   potential log injection and ANSI escape attacks. Fixed by expanding to
   `[\x00-\x1f\x7f]` across all 7 fallback implementations. Propagation sweep
   confirmed zero remaining old-pattern instances.

2. Fallback isSafeToWrite parent dir traversal: rotate-state.js had a fallback
   that checked only the leaf path for symlinks. An attacker could create a
   symlinked parent directory. Fixed by walking parent chain.

3. Semgrep taint-path-traversal re-flag: R4 added inline validation but
   Semgrep's taint analysis didn't recognize it. Refactored to use
   validatePathInDir() from security-helpers.js — the Semgrep-approved helper.

4. Object spread on optional sub-properties: `...provided?.first_pass` throws
   TypeError when provided exists but first_pass is undefined. Fixed with
   `?? {}`.

5. SonarCloud CC reduction: Extracted countBypassesInWindow() from
   checkBypassDebtThreshold (18→12) and readRawContent() from readJsonl (16→11).

**Resolution:**

- Fixed: 20 items
- Deferred: 0 items
- Rejected: 3 items (C3: local error logging not a leak, C4: system-generated
  fields not user data, SC5: mutable accumulator pattern — false positive)

**Key Learnings:**

- Expanding control char regex from `[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]` to
  `[\x00-\x1f\x7f]` is a single-line fix that addresses both ANSI escape
  injection (Q2/Q4) and log injection (Q5/Q6) simultaneously — 4 items with 1
  regex change
- Semgrep taint analysis requires using the project's approved helper functions
  (validatePathInDir) — inline validation that achieves the same result won't
  satisfy the taint tracker
- Parent directory symlink traversal is a real attack vector even when the leaf
  path is checked — fallback isSafeToWrite implementations need the parent walk

---

### PR #427 Retrospective (2026-03-12)

**PR:** feat: Grand Plan Removal, Hook Systems Mini-Audit (35 Decisions, 8
Waves), Batch Retros, Pre-Push CC Gate, writeFileSync Security Migration (21
Scripts) **Rounds:** 5 | **Items:** 139 total (127 fixed, 1 deferred, 15
rejected) | **Fix Rate:** 91% | **Rejection Rate:** 10.8% **Score:** 7/10

#### Review Cycle Summary

| Round | Source                                    | Items | Fixed | Deferred | Rejected |
| ----- | ----------------------------------------- | ----- | ----- | -------- | -------- |
| R1    | SonarCloud + Semgrep + CI + Qodo          | 25    | 24    | 1        | 5        |
| R2    | Qodo + Semgrep + SonarCloud + CI          | 21    | 18    | 0        | 2        |
| R3    | CI + CodeQL + Semgrep + Qodo + SonarCloud | 45    | 45    | 0        | 0        |
| R4    | Qodo + Semgrep + CI Pattern Compliance    | 25    | 20    | 0        | 5        |
| R5    | Qodo + Semgrep + SonarCloud               | 23    | 20    | 0        | 3        |

#### Ping-Pong Chains

1. **isSafeToWrite 4-round evolution (R1→R2→R4→R5):** fail-open fallback →
   fail-closed → TOCTOU in atomic writes → parent dir symlink traversal. Classic
   Pattern 8 incremental hardening. ~2 avoidable rounds.
2. **ESLint auto-fixer cascade (R2→R3):** Auto-fixer for error.message produced
   overly nested ternaries. SonarCloud flagged cognitive complexity in R3. ~0.5
   avoidable rounds.
3. **Agent fix regression (R3):** Agent fixed rmSync-before-renameSync but
   introduced bare renameSync without cross-device fallback. Required second
   pass with safeRename helper. ~0.5 avoidable rounds.
4. **sanitizeInput incremental hardening (R4→R5):** Narrow control char regex in
   R4 missed ANSI escapes. Widened to full C0 block in R5. ~0.5 avoidable
   rounds.

#### Rejection Analysis

15/139 = 10.8% — best for a 5-round, 247-file PR. R3 achieved 0% rejection.
Rejections were appropriate: hooks lacking user context by design (4), local
error logging not a leak (1), mutable accumulator FP (1), intentional design
choices (2), false positives (7).

#### Top Wins

- 10.8% rejection rate — best for a large multi-round PR in project history
- 308-file error.message codemod via ESLint auto-fixer with
  ConditionalExpression guard detection
- Propagation sweeps caught 4 additional sanitizeInput files beyond reviewer
  flags
- pr-review v4.1 improvements (first-scan batch-ack, cross-round dedup)
  validated

#### Top Misses

- isSafeToWrite evolved across 4 of 5 rounds (Pattern 8)
- ESLint auto-fixer output not reviewed before commit — cascading SonarCloud
  flags
- Agent fix introduced NEW violations on rmSync pattern
- CC pre-push check: 6th recommendation, still not implemented

#### Process Changes

1. Security Guard Lifecycle Checklist → SECURITY_CHECKLIST.md
2. Auto-fixer output review pre-check → pr-review PRE_CHECKS.md
3. Cross-device rename fallback pattern → CODE_PATTERNS.md
4. Wire check-cc.js into pre-push hook (CRITICAL — 6th recommendation)
5. AI hallucination verification → deep-plan skill
6. Worktree .git compatibility → CODE_PATTERNS.md
7. CRITICAL: Retro JSONL schema — add action_items with per-item tracking
8. CRITICAL: Step 1.4 — run stored verify commands, not keyword grep
9. CRITICAL: Step 6 — write implementation status to state file

#### Verdict

Solid review cycle for a 247-file PR. 91% fix rate and 10.8% rejection show
pr-review v4.1 is working. Main cost was incremental security hardening (~3.5
avoidable rounds from 4 ping-pong chains). The systemic finding — retro
infrastructure disconnect causing action items to be silently dropped — is the
most impactful outcome of this retro.

---

### PR #428 Retrospective (2026-03-12)

**PR:** docs: Two Deep Plans — Tooling Audit (30 decisions) + Code Quality
Overhaul (26 decisions) **Rounds:** 1 | **Items:** 10 total (10 fixed, 0
deferred, 0 rejected) | **Fix Rate:** 100% | **Rejection Rate:** 0% **Score:**
9/10

#### Review Cycle Summary

| Round | Source                        | Items | Fixed | Deferred | Rejected |
| ----- | ----------------------------- | ----- | ----- | -------- | -------- |
| R1    | Doc Lint + Qodo + Gemini + CI | 10    | 10    | 0        | 0        |

#### Key Findings

- **AI hallucination:** DIAGNOSIS.md claimed phantom "10-level nested instanceof
  corruption" — verified false against codebase
- **Forward-referencing:** Plan referenced ESLint v10 migration when v10 doesn't
  exist (v9.39.4 is stable)
- **Worktree compatibility:** Pre-commit hook used `.git/` path instead of
  `$(git rev-parse --git-dir)/`
- **Doc lint effectiveness:** Missing Purpose/Scope/Version History caught by
  automated CI gate

#### Verdict

Perfect single-round cycle. Validates focused-scope planning PRs as the cleanest
PR type (joining PR #414 at 100% fix rate, PR #416 at 0 rounds). AI
hallucination in planning docs is the only process concern — fixable with
verification requirements in the deep-plan skill.

---

### Review #482: PR #429 R1 — SonarCloud + Qodo + CI (2026-03-13)

**Source:** Mixed (SonarCloud Security Hotspots, SonarCloud Code Smells, Qodo PR
Reviewer Guide, Qodo Compliance, Qodo Code Suggestions, CI Failure)
**PR/Branch:** PR #429 / tooling-code-plan **Items:** 15 total (Critical: 1,
Major: 5, Minor: 6, Rejected: 3)

**Context:** First review round on tooling/code-plan PR (46 files). Mix of new
scripts (semgrep test harness, JSONL validator, changelog metrics), hook test
enhancements, and deep-plan artifacts.

**Issues Found:**

1. CI BLOCKER: `lib/firestore-service.ts` imported `setDoc` (direct Firestore
   write) despite all methods using `httpsCallable` Cloud Functions. Dead import
   from pre-migration era. Removed import, type member, and default dep.

2. Hook test `block-push-to-main.js` listed in `CRITICAL_POSTTOOL_HOOKS` but
   actually configured in PreToolUse, not PostToolUse. Test silently passed via
   `continue` before review caught it. Split into `CRITICAL_PRETOOLUSE_HOOKS`
   with dedicated test.

3. Semgrep test harness fallback reported PASS without checking `parsed.errors`,
   hiding scan/config errors. Added error field check + documented that fallback
   doesn't validate `// ruleid:` annotations.

4. Duplicate DEBT entries from casing variations in `log-override.js` — same
   check generating `hook-bypass-propagation` and `hook-bypass-PROPAGATION`
   source_ids, inflating metrics. Deferred as DEBT-45528.

**Resolution:**

- Fixed: 12 items
- Deferred: 1 item (DEBT-45528)
- Rejected: 2 items (S4036 PATH: `execFileSync` doesn't use shell; secure
  logging: hook commands are script paths, not secrets)

**Key Learnings:**

- Dead imports from pre-migration code can trigger CI blockers — `setDoc` was in
  DI deps but no method called it. Pattern compliance checks catch these.
- Hook placement matters: `block-push-to-main.js` is a PreToolUse hook (blocks
  before `git push` command runs), not PostToolUse. Test lists must match actual
  settings.json configuration.
- `if (!hook) continue` in hook tests creates silent passes — caught by Qodo.
  Changed to `assert.ok` for both critical and non-critical hooks to ensure hook
  presence is verified.
- Semgrep JSON output can contain an `errors` array even on exit code 0 — always
  check it before reporting PASS.

---

### Review #483: PR #429 R2 — Qodo + Gemini + CI (2026-03-13)

**Key learnings:**

- Auto-generated DEBT entries (e.g. from log-override.js hook bypass detection)
  must use DEBT-XXXX format IDs and valid type enums. `AUTO-BYPASS-*` IDs and
  `process-debt` type broke CI schema validation. Root cause: the generator
  script doesn't validate against TDMS schema before writing.
- When Zod schemas and documentation disagree on enum values, check existing
  data to determine truth. Gemini suggested changing `"implemented"` to `"done"`
  in retro schema, but 11 existing records use `"implemented"` — fix the docs,
  not the schema.
- SARIF upload guarded by `hashFiles() != ''` without asserting file existence
  means Semgrep execution failures are invisible. Always add an existence
  assertion step before conditional uploads.
- Validator scripts claiming "all files" coverage but only checking a hardcoded
  subset creates false confidence. Either add schemas or be honest about partial
  coverage.

---

### Review #484: PR #429 R3 — SonarCloud + Qodo + CI (2026-03-13)

**Key learnings:**

- Semgrep `--test` mode catch blocks must distinguish between "flag not
  supported" (fallback to `--json` scan) and real test failures (exit non-zero).
  Swallowing all errors silently hides annotation mismatches.
- `readFileSync` on JSONL files without size guards risks OOM on unexpectedly
  large files. Add `statSync` size check before reading (50MB cap is reasonable
  for ecosystem data files).
- IIFE-in-template-literal (`${(() => {...})()}`) is valid JS but hurts
  readability in test assertions. Extract to a named helper for clarity and
  reusability.
- Cross-round dedup saves effort: R3 item 7 (hook.command logging risk) was
  already addressed in R2 truncation fix — auto-rejected with prior-round
  reference.

---

#### Review #356: PR #431 R2 — Data Effectiveness Audit Schema & Security Fixes (2026-03-13)

**Source:** Qodo / SonarCloud / Gemini / CI **PR/Branch:** #431
plan-implementation **Suggestions:** 54 total (Critical: 2, Major: 8, Minor: 21,
Trivial: 23)

**Patterns Identified:**

1. Schema migration breaks consumers: verified-patterns.json restructured to
   `{schema_version, patterns, exemptions}` but check-pattern-compliance.js
   still indexed the flat object. Baseline keys didn't match antipattern IDs.
   - Root cause: Schema refactored without updating all consumers
   - Prevention: Schema migration checklist — grep all consumers before shipping
2. Traversal validation incomplete: rotate-jsonl.js regex only caught leading
   `..`, missing mid-path traversal like `x/../../y`.
   - Root cause: Ad-hoc regex instead of using existing validatePathInDir helper
   - Prevention: Always use security-helpers.js for path validation
3. sanitizeError fallbacks leak raw err.message: 8 scripts had fallbacks missing
   the full redaction chain from the canonical sanitizeError.
   - Root cause: Copy-paste fallbacks diverged from canonical implementation
   - Prevention: All fallbacks must match the 5-replace canonical pattern

**Resolution:**

- Fixed: 54 items
- Deferred: 0 items
- Rejected: 0 items

**Key Learnings:**

- Schema changes require consumer audit — the verified-patterns.json change
  broke exemption loading AND FP reporting because only the config was updated.
- Baseline key names must exactly match the antiPattern.id values emitted by
  check-pattern-compliance.js. The mismatch caused silent ratchet failures.
- check-cc.js and ratchet-baselines.js share known-debt-baseline.json but use
  different sections (checks vs baselines). Both must be preserved on write.

---

#### Review #361: PR #431 R7 — Flagged Section Sanitization, TOCTOU & Diminishing Returns (2026-03-14)

**Source:** Qodo + SonarCloud **PR/Branch:** #431 plan-implementation
**Suggestions:** 17 total (Critical: 0, Major: 1, Minor: 9, Trivial: 7)

**Patterns Identified:**

1. Incomplete sanitization propagation: R6 sanitized the systems table but not
   the flagged section in generate-lifecycle-scores-md.js. Pattern: after fixing
   one section, check ALL output paths in the same file.
2. TOCTOU in rollback paths: existsSync before renameSync in error recovery
   creates a race. Replace with direct rename + ENOENT catch.
3. Diminishing returns at R7: fix rate dropped to 35%. Cross-round dedup now
   covers 7 rounds — same items (Set.has, type-dependent design) resurfacing
   every round despite repeated rejection.

| Round | Source | Items | Fixed | Deferred | Rejected |
| ----- | ------ | ----- | ----- | -------- | -------- |
| R7    | Qodo   | 17    | 6     | 0        | 11       |

- Fixed: 6 items across 5 files
- Rejected: 11 items (4 cross-round dedup R4-R6, 1 intentional TODO scaffold, 6
  over-engineering/no-behavior-change)

**Rejected Items:**

- Set.has for tableContent (R4+R5+R6 dedup — string.includes())
- Set.has for antiPatternSection (R4+R5+R6 dedup — string.includes())
- Type-dependent design (R4+R5+R6 dedup — simple boolean)
- OS temp dir for test (R3+R4 dedup — repo boundary needed)
- TODO comment in scaffold (intentional placeholder)
- Baseline write try/catch (writeFileSync failure leaves file unchanged)
- Config parsing tightening (internal config, theoretical edge cases)
- Sanitize exitCode in test (test-only, literal values)
- Defensive error.code access (doesn't change behavior)
- Skip tests on missing fixtures (should fail loudly)
- Guard JSONL stringify (internal objects can't fail)

**Key Learnings:**

- R7 fix rate (35%) triggers merge recommendation. This PR has processed 220+
  items across 7 rounds. Recommend merging after this round.
- Sanitization fixes propagate across output functions, not just the one
  flagged. Future reviews should check all render paths in the same file.

---

#### Review #360: PR #431 R6 — Sanitization, Scaffold Validity & Baseline Bug (2026-03-14)

**Source:** Qodo **PR/Branch:** #431 plan-implementation **Suggestions:** 20
total (Critical: 0, Major: 1, Minor: 12, Trivial: 7)

**Patterns Identified:**

1. Detached object reference in getBaselines: When a getter returns a new `{}`
   instead of initializing `baselineData.baselines`, mutations to the returned
   object don't persist back — improvements silently lost on write.
2. Scaffold validity: ESLint rule `create` property must be a function, not a
   string. Scaffolded skeletons should be loadable without runtime errors.
3. Sanitization propagation: stderr writes, markdown table fields, and JSONL
   parse errors all need consistent sanitization. Pattern: after fixing one
   instance, grep for the same pattern across the codebase.
4. Cross-round dedup efficiency: R4+R5 rejections (Set.has, type-dependent
   design) continue to resurface. May need permanent suppression rules.

| Round | Source | Items | Fixed | Deferred | Rejected |
| ----- | ------ | ----- | ----- | -------- | -------- |
| R6    | Qodo   | 20    | 14    | 0        | 6        |

- Fixed: 14 items across 8 files
- Rejected: 6 items (3 cross-round dedup R4+R5, 1 architectural, 2
  over-engineering)

**Rejected Items:**

- Set.has for tableContent (R4+R5 dedup — string.includes(), not array)
- Set.has for antiPatternSection (R4+R5 dedup — string.includes(), not array)
- Type-dependent design (R4+R5 dedup — simple boolean in 6-line function)
- No JSONL schema validation (architectural — downstream has Number.isFinite and
  Array.isArray guards)
- Use shared sanitizeError in session-start.js (cross-boundary import fragile;
  hook has own sanitizeInput)
- Normalize malformed baseline in persistBaselines (over-engineering — input
  always from script's own prior output)

**Key Learnings:**

- Detached-object-reference is a subtle bug category: `return obj.field ?? {}`
  looks safe but mutations to the returned `{}` are lost. Always initialize the
  parent when the getter creates a fallback.
- R6 fix rate (70%) is above merge threshold but cumulative review cost is high.
  This PR (R1-R6) has processed 200+ items total.

---

#### Review #359: PR #431 R5 — Backup Safety, Nullish Coalescing & Error Context (2026-03-14)

**Source:** Qodo **PR/Branch:** #431 plan-implementation **Suggestions:** 18
total (Critical: 0, Major: 2, Minor: 9, Trivial: 7)

**Patterns Identified:**

1. Backup-and-restore for file replacement: The unlinkSync+copyFileSync fallback
   in run-alerts.js risked data loss if the copy failed after deletion. Replaced
   with rename-to-backup, copy, then cleanup/rollback pattern.
2. Nullish coalescing (`??`) vs logical OR (`||`): `|| 0` treats valid zero
   values as falsy, skipping to fallback. Fixed velocity metric fields to use
   `??` for zero-preserving semantics.
3. Error context in JSONL parsing: Silent catch blocks that swallow parse errors
   make corruption debugging harder. Added safe excerpts and error reasons.
4. String.raw for escaped replacements: `"\\|"` and `"\\$&"` are clearer as
   `String.raw\`\|\``and`String.raw\`\$&\``.

| Round | Source | Items | Fixed | Deferred | Rejected |
| ----- | ------ | ----- | ----- | -------- | -------- |
| R5    | Qodo   | 18    | 11    | 0        | 7        |

- Fixed: 11 items across 9 files
- Rejected: 7 items (5 cross-round dedup from R3/R4, 1 architectural, 1 FP)

**Rejected Items:**

- Symlink overwrite risk (R4 dedup — isSafeToWrite guard at L515)
- Set.has x2 (R4 dedup — string.includes(), not array)
- Unix path redaction (R3+R4 dedup — deliberately removed in R3)
- Type-dependent design (R4 dedup — simple boolean in 6-line function)
- Audit logging (architectural — internal report generator, no user context)

**Key Learnings:**

- Cross-round dedup now covers 5 rounds of this PR. Items that survive R3+R4
  rejection keep coming back — may need permanent suppression.
- Backup-and-restore is strictly superior to delete-then-copy for file
  replacement. This pattern should be in FIX_TEMPLATES.
- Fix rate at R5 (61%) is within normal range but trending downward. Diminishing
  returns expected by R6.

---

#### Review #358: PR #431 R4 — Modernization, Complexity & Data Guards (2026-03-14)

**Source:** Qodo / SonarCloud / CI **PR/Branch:** #431 plan-implementation
**Suggestions:** 53 raw (52 unique after dedup) (Critical: 2, Major: 3, Minor:
13, Trivial: 34)

**Patterns Identified:**

1. SonarCloud replaceAll re-flag: R3 rejected 37 replaceAll items as "no
   semantic benefit." R4 re-flagged 28. Fixed this round to clear persistent
   noise and prevent infinite review loops on cosmetic items.
   - Lesson: When SonarCloud will re-flag the same items every round, fix them
     even if cosmetic — the review cycle cost exceeds the change cost.
2. Cognitive complexity regression: ratchet-baselines.js crept from 15→16 after
   R3's reduction (24→15). Extracted `getBaselines` and `persistBaselines`.
   route-lifecycle-gaps.js at 19 — extracted `buildLearning` helper.
3. Data validation gaps: generateFlaggedSection still called `e.files.join()`
   without Array guard and `e.total` without Number.isFinite.
   generateSystemsTable had unguarded sub-scores
   (capture/storage/recall/action).
4. CI blocker on single-letter vars: `const r` in composite.test.js and
   wave6-alerts.test.js triggered patterns:check blocking violation.
5. Pre-existing test failure: wave6-alerts.test.js `checkCommitPatterns` test
   expects `sessionEndPct: 50` but implementation returns 0 when `fired: false`.

**Resolution:**

- Fixed: 37 items
- Deferred: 0 items
- Rejected: 15 items (2 R3 dedup, 13 over-engineering/false-positive)

**Rejected Items:**

- POSIX path redaction (R3 dedup — R3 deliberately removed this regex)
- OS temp directory for tests (R3 dedup — tests need repo boundary compat)
- Symlink security in run-alerts.js (isSafeToWrite guard already at L515)
- mkdirSync in test helper (parent dir always exists)
- stderr JSON fallback (child process outputs JSON to stdout only)
- Recompute totals (stored total is authoritative)
- File read try/catch (over-engineering readJsonl callers)
- Normalize rotation results (over-engineering internal returns)
- Guard require() in loop (Node caches modules)
- chmod test scripts (node invoked directly, not via shebang)
- Skip tests when fixtures missing (silent skip hides problems)
- Capture test output (adds complexity for marginal debugging)
- Set.has x2 (SonarCloud FP — string.includes(), not array)
- json parameter design smell (simple boolean in 6-line function)

**Key Learnings:**

- SonarCloud cosmetic items that persist across rounds should be fixed even if
  the change is purely mechanical. The review overhead of re-triaging them every
  round exceeds the 5-minute fix.
- Complexity extractions can regress if the function is subsequently modified
  without re-checking complexity. Consider adding complexity to CI gates.

---

#### Review #357: PR #431 R3 — Robustness, Complexity & Propagation Fixes (2026-03-13)

**Source:** Qodo / SonarCloud / Gemini **PR/Branch:** #431 plan-implementation
**Suggestions:** 26 consolidated (Critical: 2, Major: 8, Minor: 14, Trivial: 2)

**Patterns Identified:**

1. Over-redacting regex in sanitizeError: `/\/[^\s]*\/[^\s]+/g` matched any
   path-like string (URLs, API paths), destroying useful debug context.
   - Root cause: Overly broad catch-all added to complement Windows path
     redaction
   - Prevention: Canonical sanitizeError should only redact known-sensitive
     prefixes (/home, /Users, C:\Users), not arbitrary unix paths
   - Propagation: Fixed in 8 files (canonical + 7 fallback copies)
2. Cognitive complexity in new scripts: ratchet-baselines.js (24→15) and
   verify-enforcement.js (16→15) exceeded SonarCloud threshold.
   - Root cause: Single functions doing too much — iteration + mutation +
     reporting
   - Prevention: Extract helpers when function has >2 concerns
3. Pre-existing test failure: verify-enforcement tests created temp scripts in
   os.tmpdir() but runEnforcementTest enforces repo boundary check.
   - Root cause: Test helper didn't account for the security boundary
   - Fix: Create temp dirs inside project root (.tmp/) instead

**Resolution:**

- Fixed: 16 items
- Deferred: 0 items
- Rejected: 10 items (3 already-fixed, 7 no-value-add)

**Rejected Items:**

- Exemptions schema (already handled at check-pattern-compliance.js:49)
- Baseline schema breaks (file retains `checks` key, IDs match violation IDs)
- Unguarded baseline overwrite (already uses safeWriteFileSync)
- sanitizeError fallbacks (R2 fixed — full 5-replace chain present)
- Symlink validation in run-alerts.js (BASELINE_PATH is hardcoded internal)
- json parameter design smell (simple boolean in 7-line function)
- Missing CLI validation (internal script)
- replaceAll x37 (all regex with /g flag — no semantic benefit)
- Set.has x2 (SonarCloud FP — string.includes(), not array)
- structuredClone (JSON roundtrip is intentional serialization validation)

**Key Learnings:**

- When sanitizing errors, only redact known-sensitive path prefixes. A catch-all
  unix path regex destroys useful diagnostic info (API paths, URLs).
- Test helpers must respect the same security boundaries as production code.
  When scripts enforce repo-root containment, test fixtures must live inside the
  repo.

---

### Review #485: PR #436 R1 — Qodo + Gemini + CI (2026-03-15)

**PR:** #436 | **Round:** R1 | **Source:** Mixed (Qodo, Gemini, CI)

**Items:** 7 total (2 fixed, 0 deferred, 5 rejected)

**Severity Breakdown:** 0 Critical, 1 Major, 4 Minor, 2 Trivial

**Fixes Applied:**

- **REFERENCE.md try/catch wrapping** (Gemini, MAJOR): Wrapped file read in
  debt-runner REFERENCE.md example script with try/catch per CODE_PATTERNS.md
  file-read-in-try/catch rule. Even documentation examples should demonstrate
  correct patterns.
- **Prettier formatting** (CI, MAJOR): Ran Prettier on 15 files that failed CI
  formatting check. Includes auto-generated TDMS view files and skill
  documentation.

**Rejections:**

- **3 Qodo advisory focus areas** (Data Consistency, Lifecycle Integrity,
  Snapshot Alignment): Informational "verify this" advisories with no specific
  code change requested. Data files are auto-generated by pipeline scripts.
- **Missing actor context in JSONL** (Qodo compliance): Health snapshots are
  automated system measurements, not user-action audit trails. Actor context is
  not applicable to automated health checks.
- **Table formatting suggestion** (Qodo): Subsumed by Prettier fix — Prettier
  auto-pads markdown table columns, making the manual formatting suggestion
  redundant.

**Key Learnings:**

- Auto-generated markdown files (TDMS views) should be included in Prettier
  formatting runs before pushing to avoid CI failures on generated content.
- Documentation code examples should follow the same patterns as production code
  (file-read-in-try/catch) to avoid review noise.

---

### Review #490: PR #448 R5 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**PR:** #448 | **Round:** R5 | **Source:** Mixed (CI/ESLint, Qodo, SonarCloud)

**Items:** 11 fixed, 0 deferred, 7 rejected (repeat R1-R4)

**Fixes:** ESLint ignore for `scripts/tests/` (CI compiled output), coerceInt
helper for disposition validation, bidirectional cross-db check, safeAppend
TOCTOU fix, buildExistingIndex missing-timestamp handling, sanitizeError
fallback robustness, buildLatestMetricsMap tiebreaker.

**Rejections (7):** retro-config "should be Set" (repeat R1-R4).

**Key Learnings:**

- CI build steps (`test:build`) may produce compiled JS output that ESLint
  scans. If compiled output redeclares globals, add the output path to ignores.
- Validation helpers that treat non-numeric values as 0 silently skip integrity
  violations. Use explicit coercion with `Number()` + `Number.isFinite()`.

---

### Review #489: PR #448 R4 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**PR:** #448 | **Round:** R4 | **Source:** Mixed (CI/Security, Qodo, SonarCloud)

**Items:** 10 fixed, 0 deferred, 7 rejected (repeat from R1/R2/R3)

**Severity Breakdown:** 0 Critical, 1 Major, 5 Minor, 4 Trivial

**Fixes Applied:**

- **Security scan exclusions** (CI, MAJOR): Added wave test files to SEC-002
  exclude list and test files to SEC-008 exclude.
- **Symlink staged filter** (Qodo, MINOR): lstatSync rejection in staged filter.
- **Deterministic error counting** (Qodo, MINOR): Return-value-based errors in
  processFileChunk instead of mutable callback.
- **safeAppend root containment** (Qodo, MINOR): path.relative traversal check.
- **Shared sanitizeError** (Qodo, TRIVIAL): Import from scripts/lib/ instead of
  inline duplicate.
- **sanitizeError fallback** (MINOR): Reduced to name+code only.
- **review_rounds normalize** (Qodo, TRIVIAL): String coercion + truncation.
- **CC extraction** (SonarCloud): buildExistingIndex from appendMetrics.
- **Misc** (TRIVIAL): DOMPurify String()+RETURN_DOM, replaceAll propagation.

**Rejections (7):** retro-config "should be Set" (repeat R1-R3 —
string.includes).

**Key Learnings:**

- Security scan regex detectors false-positive on test files that assert
  security patterns exist in rule definitions. Add test exclusions.
- When changing .replace() to .replaceAll() in source, update test assertions
  that check for the method name as a string literal.

---

### Review #488: PR #448 R3 — Mixed (Qodo+SonarCloud) (2026-03-18)

**PR:** #448 | **Round:** R3 | **Source:** Mixed (Qodo Compliance + Suggestions,
SonarCloud)

**Items:** 10 fixed, 0 deferred, 8 rejected (repeat from R1/R2)

**Severity Breakdown:** 0 Critical, 1 Major, 5 Minor, 4 Trivial

**Fixes Applied:**

- **resolveLinkPath path traversal** (Qodo compliance, MAJOR): Added
  `path.relative` + `..` regex check before `existsSync` to prevent probing
  files outside docDir.
- **options.stagedFiles validation** (Qodo suggestion, MINOR): Added path
  containment filter on programmatic override, matching CLI validation.
- **DOMPurify FORBID_CONTENTS** (Qodo suggestion, MINOR): Added
  `FORBID_CONTENTS: ["script", "style"]` — ALLOWED_TAGS:[] alone doesn't strip
  script/style tag contents.
- **churn-tracker latest-index** (Qodo suggestion, MINOR): Index now keeps only
  the entry with the latest timestamp per PR, preventing stale-entry updates.
- **Numeric normalization** (Qodo suggestion, MINOR): Migration script now uses
  `toNonNegInt()` helper for all numeric fields.
- **CC reductions** (SonarCloud): Extracted `processFileChunk` (jobs.ts) and
  `writeMetrics` (churn-tracker).
- **Token redaction** (Qodo compliance, TRIVIAL): Added GitHub/API token
  patterns to sanitizeError in check-propagation-staged.
- **Misc** (TRIVIAL): yamlHasKey null guard, wave4 regex→string literal.

**Rejections (8):** 7× retro-config "should be Set" (string.includes, not array
— repeat from R1+R2), 1× Audit Trails (repeat — local CLI scripts).

**Key Learnings:**

- DOMPurify `ALLOWED_TAGS: []` strips tags but preserves their text content,
  including `<script>` body. Use `FORBID_CONTENTS` to remove content too.
- When building a dedup index from existing entries, keep only the latest per
  key — otherwise out-of-order entries cause the wrong record to be updated.
- Path traversal guards must be applied at EVERY entry point for a path (CLI
  args, programmatic override, link resolution), not just the most obvious one.

---

### Review #487: PR #448 R2 — Mixed (CI+Qodo+SonarCloud) (2026-03-18)

**PR:** #448 | **Round:** R2 | **Source:** Mixed (CI/ESLint, Qodo Compliance +
Suggestions, SonarCloud)

**Items:** 19 fixed, 0 deferred, 8 rejected (5 R1-stale Qodo repeats, 3
repeat-rejected from R1)

**Severity Breakdown:** 0 Critical, 2 Major, 9 Minor, 8 Trivial

**Fixes Applied:**

- **ESLint \_\_dirname no-undef** (CI, MAJOR): CJS files under `scripts/` were
  configured as ESM in eslint.config.mjs, excluding `__dirname` from globals.
  Added CJS override for `scripts/**/__tests__/**/*.js` and
  `migrate-ecosystem-v2.js`.
- **ESLint no-control-regex** (CI, MAJOR): `eslint-disable-next-line` doesn't
  span multi-line chained calls. Changed to block disable/enable.
- **CLI path traversal** (Qodo compliance, MINOR): Added path containment filter
  on `--staged-files` CLI override.
- **source_pr NaN guard** (Qodo compliance, MINOR): Added `Number.isFinite` +
  `Number.isInteger` + positive check.
- **Promise.allSettled** (Qodo suggestion, MINOR): Prevents single file error
  from aborting entire cleanup batch.
- **Quadratic dedup** (Qodo suggestion, MINOR): Pre-built Map index for O(N)
  dedup instead of O(N\*M) findIndex.
- **NaN → Number.NaN** (SonarCloud, TRIVIAL): 7 instances across 4 files.
- **CC reductions** (SonarCloud, MINOR): check-docs-light, review-lifecycle,
  migrate-ecosystem-v2 — extracted helpers.
- **Various** (TRIVIAL): replaceAll, null guard, comment detection, hard-coded
  version, fallback violation IDs.

**Rejections:**

- **Qodo items 1-5** (R1 stale): Already fixed in R1 commit `7f9c51ee`. Qodo
  reviewed original diff, not HEAD after R1.
- **Audit trails** (repeat from R1 #25): Same rejection — local CLI scripts.
- **retro-config Set conversion** (repeat from R1 #23): String.includes, not
  array.

**Key Learnings:**

- `eslint-disable-next-line` only suppresses the immediately following line. For
  multi-line chained expressions, use block `eslint-disable`/`eslint-enable`.
- ESLint CJS vs ESM sourceType must match the actual module format. Files using
  `require()` and `__dirname` need `sourceType: "commonjs"` regardless of their
  directory.
- When adding passthrough for non-PR entries in dedup, update tests that
  expected those entries to be dropped.

---

### Review #486: PR #448 R1 — Mixed (Qodo+Gemini+SonarCloud) (2026-03-18)

**PR:** #448 | **Round:** R1 | **Source:** Mixed (Qodo 22, Gemini 4,
SonarCloud 33)

**Items:** 49 total (47 fixed, 0 deferred, 2 rejected)

**Severity Breakdown:** 0 Critical, 8 Major, 14 Minor, 27 Trivial

**Fixes Applied:**

- **Propagation check false-positive** (Qodo, MAJOR): Pre-commit grep
  `"propagation miss"` matched success message `"no propagation misses"`.
  Changed to `"Propagation miss:"` to match only real miss lines.
- **Migration script silent no-op** (Qodo, MAJOR): `migrate-ecosystem-v2.js`
  read non-existent files, `readJsonl()` returned `[]` silently. Added
  `findSourceFile()` fallback to `.archived-*` variants + exit non-zero if
  neither exists.
- **review_rounds never updated** (Qodo suggestion, MAJOR): `dedupMetrics()` set
  `jsonl_review_records` but never actually wrote to `review_rounds`. Added
  missing assignment.
- **Timestamp string comparison** (Qodo suggestion, MAJOR): 4 files used
  `entry.timestamp > existing.timestamp` (string comparison). Replaced with
  `Date.parse()` numeric comparison in `dedup-review-metrics.js`,
  `review-churn-tracker.js`, `review-lifecycle.js`, `cross-db-validation.test`.
- **Semgrep over-suppression** (Qodo, MAJOR): `no-unchecked-array-access` rule
  suppressed `$ARR[0]` inside any `.map/.filter/.forEach` callback regardless of
  whether `$ARR` was the iterated element. Removed 10 broad suppressions.
- **Disposition validation order** (Qodo suggestion, MAJOR): Moved
  `validateDispositionIntegrity` after `ReviewRecord.parse()` to validate on
  canonical typed data, preventing string-bypass.
- **Security: scorecard permissions** (SonarCloud, MINOR): Replaced `read-all`
  with specific `contents: read`.
- **Security: path traversal** (Qodo suggestion, HIGH): 3 files using
  `startsWith(root + path.sep)` → `path.relative()` + regex test.
- **Security: symlink guards** (Qodo suggestion/compliance): Added to
  `readExistingMetrics()` and both write paths in `migrate-ecosystem-v2.js`.
- **CC reduction** (SonarCloud, 9 functions): Extracted helpers in `jobs.ts`,
  `check-docs-light.js`, `check-propagation-staged.js`,
  `dedup-review-metrics.js`, `review-churn-tracker.js`, `review-lifecycle.js`,
  `migrate-ecosystem-v2.js`, `cross-db-validation.test.js`,
  `pipeline-consistency.test.js`.
- **Style fixes** (SonarCloud/Qodo): @ts-nocheck removal, CRLF normalization,
  Set conversions, String.raw, replaceAll, unused variable removal, try/catch
  wrapping in test files.

**Rejections:**

- **Audit Trails - actor identity** (Qodo compliance): Local CLI validation
  scripts — not production services. Actor identity not applicable.
- **Secure Logging - path leakage** (Qodo compliance): Reviewer acknowledged
  "appears safe for a dev tool." Already uses sanitizeError.

**Key Learnings:**

- Grep patterns in hooks must account for success messages containing the
  failure substring (e.g., "no propagation misses" matches "propagation miss").
  Use specific prefixes like `"Propagation miss:"` instead.
- Migration/recovery scripts must fail loudly when source files are missing.
  Silent `[]` returns on read errors make no-ops look like success.
- String timestamp comparison (`a > b`) works for ISO-8601 in many cases but
  fails for mixed formats, missing values, or non-ISO strings. Always use
  `Date.parse()` for robustness.
- Semgrep `pattern-not-inside` with `$X.map(...)` suppresses ALL `$ARR[0]`
  inside the callback, not just accesses on the iterated element. Unrelated
  property access (`item.parts[0]`) becomes a false negative.
- When multiple npm dependencies are broken (hermes-parser, oxlint), the
  pre-commit hook blocks all commits. The ESLint check now supports
  `is_skipped eslint` for this scenario.
- When bumping a runtime version (e.g. Node), grep for all version pins (.nvmrc,
  engines, tsconfig target) and update them atomically. Partial bumps cause
  local/CI/deploy divergence.

---

### Review #493: PR #456 R1 — Mixed (Qodo + Gemini + CI) (2026-03-20)

**Date:** 2026-03-20 | **PR:** #456 | **Source:** qodo+gemini+ci

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 5     | 3     | 0        | 2        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 2     | 3     | 0       |

**Patterns:**

- Runtime version bumps need atomic propagation across all pins (.nvmrc,
  engines, tsconfig)
- Cherry-picked release-please files need Prettier formatting

**Learnings:**

- Always propagate runtime version changes to all config files atomically
- Qodo suggestion to revert nodejs22→20 was incorrect (all other configs already
  target 22)
- Qodo suggestion to downgrade codeql-action was incorrect (only one step,
  already consistent at v4)

---

### Review #494: PR #456 R2 — Mixed (CI + Qodo) (2026-03-20)

**Date:** 2026-03-20 | **PR:** #456 | **Source:** ci+qodo

| Total | Fixed | Deferred | Rejected |
| ----- | ----- | -------- | -------- |
| 4     | 3     | 0        | 1        |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
| -------- | ----- | ----- | ------- |
| 0        | 1     | 3     | 0       |

**Patterns:**

- Auto-generated files (release-please) need docs linter exclusion, not header
  injection
- Review record IDs must be numeric and sequential, not string-based

**Learnings:**

- Exclude auto-generated files (CHANGELOG.md, release-notes.md) from docs linter
- Review numbering must check max(existing IDs) + 1, not count entries
- Pinning exact Node patch in .nvmrc diverges from project convention
  (major-only)

---
