# AI Review Learnings Log

**Document Version:** 17.75 **Created:** 2026-01-02 **Last Updated:** 2026-02-27

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

<details>
<summary>Full version history (v1.0 – v17.35) — click to expand</summary>

| Version  | Date                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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
| 1.39-1.0 | 2026-01-02 to 2026-01-03 | Reviews #1-40 (see [archive](./archive/REVIEWS_1-40.md))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

</details>

---

## 📊 Tiered Access Model

This log uses a tiered structure to optimize context consumption:

| Tier  | Content                                                                                                                                                                                                                                                                                                                                      | When to Read                  | Size        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------- |
| **1** | [claude.md](../claude.md)                                                                                                                                                                                                                                                                                                                    | Always (in AI context)        | ~115 lines  |
| **2** | [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)                                                                                                                                                                                                                                                                                            | When investigating violations | ~612 lines  |
| **3** | Active Reviews (below)                                                                                                                                                                                                                                                                                                                       | Deep investigation            | ~2400 lines |
| **4** | Archive ([#1-40](./archive/REVIEWS_1-40.md), [#42-60](./archive/REVIEWS_42-60.md), [#61-100](./archive/REVIEWS_61-100.md), [#101-136](./archive/REVIEWS_101-136.md), [#137-179](./archive/REVIEWS_137-179.md), [#180-201](./archive/REVIEWS_180-201.md), [#202-212](./archive/REVIEWS_202-212.md), [#213-284](./archive/REVIEWS_213-284.md)) | Historical research           | ~8000 lines |

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
<summary>Previous Consolidation (#1)</summary>

- **Date:** 2026-02-27
- **Reviews consolidated:** #385-#399
- **Recurring patterns:**
  - No recurring patterns above threshold

</details>
<details>
<summary>Previous Consolidation (#2)</summary>

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
| Main log lines | ~1820          | 1500      | Run `npm run reviews:archive -- --apply` |
| Active reviews | 15 (#385-#399) | 20        | Run `npm run reviews:archive -- --apply` |

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

**Reviews #1-388** have been archived in twelve files:

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

### Archive 6: Reviews #180-201

- **Archive location:**
  [docs/archive/REVIEWS_180-201.md](./archive/REVIEWS_180-201.md)
- **Coverage:** 2026-01-18 to 2026-01-24
- **Status:** Reviews #180-201 archived (Consolidation #14: 2026-01-24).

### Archive 7: Reviews #202-212

- **Archive location:**
  [docs/archive/REVIEWS_202-212.md](./archive/REVIEWS_202-212.md)
- **Coverage:** 2026-01-24 to 2026-02-02
- **Status:** Reviews #202-212 archived (Consolidation #15: 2026-02-02).

### Archive 8: Reviews #213-284

- **Archive location:**
  [docs/archive/REVIEWS_213-284.md](./archive/REVIEWS_213-284.md)
- **Coverage:** 2026-02-02 to 2026-02-07
- **Status:** Reviews #213-284 archived (Consolidation #17-#21).

### Archive 9: Reviews #285-346

- **Archive location:**
  [docs/archive/REVIEWS_285-346.md](./archive/REVIEWS_285-346.md)
- **Coverage:** Archived on 2026-02-20
- **Status:** Reviews #285-346 archived.

### Archive 10: Reviews #347-369

- **Archive location:**
  [docs/archive/REVIEWS_347-369.md](./archive/REVIEWS_347-369.md)
- **Coverage:** Archived on 2026-02-22
- **Status:** Reviews #347-369 archived.

### Archive 11: Reviews #354-357

- **Archive location:**
  [docs/archive/REVIEWS_354-357.md](./archive/REVIEWS_354-357.md)
- **Coverage:** Archived on 2026-02-23
- **Status:** Reviews #354-357 archived.

### Archive 12: Reviews #358-388

- **Archive location:**
  [docs/archive/REVIEWS_358-388.md](./archive/REVIEWS_358-388.md)
- **Coverage:** Archived on 2026-02-27
- **Status:** Reviews #358-388 archived.

Access archives only for historical investigation of specific patterns.

---

## Active Reviews

### PR #396 Retrospective (2026-02-27)

_ESLint + pattern compliance fixes. PR scope: 27 items across safe-fs.js,
check-pattern-compliance.js, categorize-and-assign.js, generate-views.js, and
test files. 2 review rounds._

#### Review Cycle Summary

| Metric         | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Rounds         | 2 (R1: 2026-02-26, R2: 2026-02-26)                         |
| Total items    | 48 (38 R1 + 10 R2)                                         |
| Fixed          | 30                                                         |
| Deferred       | 1 (N/A — out of scope)                                     |
| Rejected       | 16                                                         |
| Duplicate      | 1                                                          |
| Files changed  | ~15 (safe-fs.js, check-pattern-compliance.js, tests, etc.) |
| Review sources | Qodo Compliance, SonarCloud, Qodo PR Suggestions, CI       |

#### Per-Round Breakdown

| Round     | Date       | Source                                   | Items  | Fixed  | Def.  | Rej.   | Key Patterns                                                                                                                       |
| --------- | ---------- | ---------------------------------------- | ------ | ------ | ----- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| R1        | 2026-02-26 | Qodo Compliance (26), SonarCloud (12)    | 38     | 24     | 1     | 12     | safe-fs security (symlink guard, dir-over-file, atomic write cleanup, Unicode), path containment, regex broadening, unused imports |
| R2        | 2026-02-26 | Qodo Compliance (4), Qodo PR (7), CI (1) | 10     | 6      | 0     | 4      | Same-path rename guard, test regex alignment, POSIX path normalization                                                             |
| **Total** |            |                                          | **48** | **30** | **1** | **16** |                                                                                                                                    |

**Trajectory:** 38 → 10. Strong convergence — 74% reduction in items from R1 to
R2.

**Severity distribution:** 0 CRITICAL, 6 MAJOR (security: symlink guard,
same-path rename, atomic cleanup), 18 MINOR (code quality, regex), 24 TRIVIAL
(unused imports, cosmetic). The security fixes in safe-fs.js were high-value
real bug fixes.

#### Ping-Pong Chains

##### Chain 1: Test Regex Alignment (R1→R2, 2 rounds)

| Round | What Happened                                                                          | Files Affected              | Root Cause                                     |
| ----- | -------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| R1    | Broadened `no-raw-fs-write` regex with `\b` word boundary to detect destructured calls | check-pattern-compliance.js | Regex improvement                              |
| R2    | Test file regex didn't match production regex (`\b(?:fs\.)?` pattern) — CI failing     | pattern-compliance.test.js  | Test not updated when production regex changed |

**Resolution:** Aligned test regex with production regex pattern. Added
`String.raw` for clarity.

**Avoidable rounds:** 0.5. When modifying a regex in production code, the
corresponding test regex should be updated in the same commit. This is a
specific case of the general pattern: "when changing behavior, update tests in
the same commit."

**Prevention:** pr-review pre-check: after modifying any regex in a checker
script, verify the corresponding test file uses the same pattern.

##### Chain 2: Qodo Compliance Repeat Rejections (R1→R2, 2 rounds)

| Round | What Happened                                              | Files Affected | Root Cause                          |
| ----- | ---------------------------------------------------------- | -------------- | ----------------------------------- |
| R1    | Rejected: TOCTOU, audit trails, logging — design decisions | safe-fs.js     | Qodo Compliance standard findings   |
| R2    | Same 3 items re-raised + 1 ESM/CJS false positive          | safe-fs.js     | Qodo doesn't track prior rejections |

**Resolution:** Batch-rejected per pr-review v3.3 Step 0.5 #13 with "same
justification as R1" note.

**Avoidable rounds:** 0.5 (4 of R2's 10 items were repeats/FP, ~40% of the
round).

**Total avoidable rounds: ~1 of 2 (~50%)**

#### Rejection Analysis

| Category                         | Count | Round(s) | Specific Items                                   | Justification                                 |
| -------------------------------- | ----- | -------- | ------------------------------------------------ | --------------------------------------------- |
| S4036 PATH binary hijacking (FP) | 1     | R1       | Hardcoded "node" in execSync                     | No shell injection risk, hardcoded binary     |
| Arbitrary file overwrite (FP)    | 1     | R1       | safe-fs.js write — covered by directory guard    | Already guarded by isSafeToWrite              |
| Missing audit log                | 1     | R1       | Single-user CLI tool, not a service              | CLI tools don't need audit trails             |
| EXDEV rollback                   | 1     | R1       | Atomic write cross-device — copy succeeds = safe | Copy is the rollback mechanism itself         |
| Error basename exposure          | 1     | R1       | Internal tool, not user-facing                   | Error paths in internal CLI are acceptable    |
| Unbounded payload                | 1     | R1       | Internally constructed data                      | No external input                             |
| No allowlist                     | 1     | R1       | All callers are hardcoded                        | Allowlist unnecessary for known callers       |
| Consolidate isSafeToWrite        | 1     | R1       | Defensive fallback by design                     | Intentional redundancy                        |
| Remove limit(200)                | 1     | R1       | Deliberate unbounded-query fix                   | The limit IS the fix                          |
| test.before() suggestion         | 1     | R1       | Sequential test runner                           | test.before() not needed in sequential runner |
| Pre-existing try/catch           | 1     | R1       | Out of scope for this PR                         | Pre-existing code, not changed in this PR     |
| Temp cleanup concurrency         | 1     | R1       | Sequential execution                             | No concurrent access to temp files            |
| Qodo Compliance repeats          | 3     | R2       | TOCTOU, audit trails, logging — same as R1       | Batch-rejected per pr-review v3.3             |
| ESM/CJS import (FP)              | 1     | R2       | Runtime verified — module works correctly        | False positive — verified at runtime          |

**Rejection accuracy:** 16/16 correct (100%). No wrongly rejected items
resurfaced — all rejections held.

**False-positive rate by source:**

| Source           | Total Items | Rejected | FP Rate | Notes                                        |
| ---------------- | ----------- | -------- | ------- | -------------------------------------------- |
| Qodo Compliance  | 30          | 15       | 50%     | 12 R1 + 3 R2 repeats. Standard FP categories |
| SonarCloud       | 12          | 0        | 0%      | All 12 items were actionable                 |
| Qodo Suggestions | 7           | 1        | 14%     | ESM/CJS false positive                       |
| CI               | 1           | 0        | 0%      | Test alignment fix was valid                 |

**Trend:** Qodo Compliance FP rate (50%) continues high, driven by known
categories (TOCTOU, audit trails, S4036). SonarCloud maintains 0% FP — all items
actionable.

#### Recurring Patterns (Automation Candidates)

| Pattern                                      | This PR  | Cross-PR History      | Already Automated?       | Recommended Action                                          | Est. Effort |
| -------------------------------------------- | -------- | --------------------- | ------------------------ | ----------------------------------------------------------- | ----------- |
| Qodo Compliance repeat rejections            | R1→R2    | #390-#395             | **YES** (pr-review v3.3) | Done — batch rejection working as designed                  | Done        |
| Test regex not updated with production regex | R1→R2    | New pattern           | No                       | pr-review pre-check: verify test patterns match production  | ~5 min      |
| Unused import cleanup                        | R1 (11x) | Common across all PRs | Partial (ESLint)         | ESLint `no-unused-imports` rule should catch at commit time | ~10 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                          | Implemented?              | Impact on PR #396                                 | Avoidable Rounds Caused |
| ------- | ------------------------------------------- | ------------------------- | ------------------------------------------------- | ----------------------- |
| PR #395 | Verify Template #45 JSON key quoting        | **YES** (done in #395)    | No trigger (no secret redaction in #396)          | 0                       |
| PR #394 | FIX_TEMPLATE #42-44                         | **YES**                   | No trigger (no ESLint rule creation in #396)      | 0                       |
| PR #394 | Split large PRs                             | **FOLLOWED**              | PR #396 is focused — ESLint compliance fixes only | -0.5 (saved ~0.5 round) |
| PR #392 | Cross-platform path normalization pre-check | **YES** (pre-check #14)   | Applied in R2 — POSIX normalization for test file | 0                       |
| PR #392 | JSONL schema validation                     | **NOT DONE** (DEBT-11312) | No trigger (no JSONL work in #396)                | 0                       |

**Implemented rate:** 4/5 (80%). All "do now" items from recent retros were
implemented or followed. Only JSONL schema validation remains deferred.

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Avoidable % | Rejections | Rej. Rate | Key Issue                             |
| -------- | ------ | ----------- | ---------------- | ----------- | ---------- | --------- | ------------------------------------- |
| #391     | 3      | 122         | ~3               | 100%        | 7          | 6%        | Path containment + symlink + dedup    |
| #392     | 4      | 54          | ~2               | 50%         | 12         | 22%       | Logic + path normalization + JSONL    |
| #393     | 2      | 15          | ~0               | 0%          | 9          | 60%       | Over-engineering cleanup (mostly FP)  |
| #394     | 12     | ~321        | ~5               | 42%         | ~112       | 35%       | Large PR, CC, ChainExpression         |
| #395     | 2      | 18          | ~0               | 0%          | 1          | 6%        | Focused: security + data quality      |
| **#396** | **2**  | **48**      | **~1**           | **50%**     | **16**     | **33%**   | **ESLint compliance + safe-fs fixes** |

**Persistent cross-PR patterns (updated):**

| Pattern                       | PRs Affected           | Times Rec. | Status                        | Trend                             |
| ----------------------------- | ---------------------- | ---------- | ----------------------------- | --------------------------------- |
| Large PR scope → more rounds  | #383-#394              | **6x**     | **FOLLOWED** in #395, #396    | **Improving** — 3rd clean follow  |
| TDMS data quality             | #383, #391, #392, #395 | **4x**     | Not automated (DEBT-11312)    | **Stable** — no trigger in #396   |
| Qodo Compliance repeat reject | #390-#396              | **5x**     | **RESOLVED** (pr-review v3.3) | **Resolved** — batch-reject works |
| Test/prod regex sync          | #396                   | **1x**     | Not automated                 | **New** — first occurrence        |

#### Skills/Templates to Update

| Item | Target Document             | Change                                                                                        | Priority | Est. Effort |
| ---- | --------------------------- | --------------------------------------------------------------------------------------------- | -------- | ----------- |
| 1    | pr-review SKILL.md Step 0.5 | Add pre-check #18: "After modifying regex in checker, verify test file uses matching pattern" | Do now   | ~5 min      |
| 2    | CODE_PATTERNS.md            | Add pattern: same-path rename guard (`src === dest` early return before destructive ops)      | Do now   | ~3 min      |

#### Process Improvements

1. **safe-fs.js received substantive security fixes** — Symlink guard,
   directory- over-file guard, tmp cleanup on atomic write failure, Unicode
   codePointAt, and same-path rename guard are all real bugs with data-loss
   potential. This PR had the highest ratio of genuine security findings to
   total items.

2. **SonarCloud 0% FP rate** — All 12 SonarCloud items in R1 were actionable.
   This continues to validate SonarCloud as the highest-signal review source.

3. **Qodo Compliance FP rate remains high (50%)** — Dominated by known FP
   categories (TOCTOU on single-user CLI, audit trails, S4036 PATH). These could
   be suppressed via `.qodo/suppression.yaml` to reduce noise.

4. **Test-production regex sync is a new pattern** — When modifying a regex in
   production code, the test should be updated in the same commit. This caused
   ~0.5 avoidable rounds in R2. A pr-review pre-check can prevent recurrence.

5. **Unused import cleanup (11 files)** — `writeFileSync` imports were removed
   from 11 files. This suggests the ESLint `no-unused-imports` rule should be
   enabled at the pre-commit level to catch these automatically.

#### Verdict

**PR #396** had a **moderately efficient review cycle** — 2 rounds with 48
items, 30 fixed. **~1 of 2 rounds partially avoidable (~50%)**, driven by:

- Chain 1: Test regex not updated with production regex (R1→R2, ~0.5 avoidable)
- Chain 2: Qodo Compliance repeat rejections (R1→R2, ~0.5 avoidable)

**Trend: Consistent 2-round cycles for focused PRs.**

| Metric         | #393 | #394 | #395 | **#396** | Direction |
| -------------- | ---- | ---- | ---- | -------- | --------- |
| Rounds         | 2    | 12   | 2    | **2**    | Stable    |
| Items/round    | 7.5  | 26.8 | 9.0  | **24.0** | Higher\*  |
| Avoidable %    | 0%   | 42%  | 0%   | **50%**  | Moderate  |
| Rejection rate | 60%  | 35%  | 6%   | **33%**  | Moderate  |

\*Higher items/round driven by Qodo Compliance's 26-item R1 dump (many standard
boilerplate findings). Excluding Qodo Compliance FP: 12 SonarCloud + ~12
actionable Qodo items = 24 genuine items / 2 rounds = 12 items/round.

**The single highest-impact change:** Add Qodo Compliance suppressions for known
FP categories (TOCTOU on CLI tools, audit trails, S4036 PATH on hardcoded
binaries). This would reduce R1 from 38 to ~26 items and eliminate the repeat
rejection chain entirely.

**Positive signals:** (1) safe-fs.js received 6 genuine security fixes (symlink,
directory guard, atomic cleanup, Unicode, same-path rename). (2) SonarCloud
maintained 0% FP rate. (3) Pre-check #14 (POSIX normalization) applied
successfully in R2. (4) Focused PR scope — 2 rounds, not 12.

---

### PR #395 Retrospective (2026-02-27)

_Retro action items implementation + secret redaction hardening + TDMS data
quality fixes. PR scope: ~12 files. 2 review rounds._

#### Review Cycle Summary

| Metric         | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Rounds         | 2 (R1: 2026-02-26, R2: 2026-02-26)                       |
| Total items    | 18 (10 R1 + 8 R2)                                        |
| Fixed          | 17                                                       |
| Deferred       | 0                                                        |
| Rejected       | 1                                                        |
| Files changed  | ~12 (sanitize-error.js, sanitize-input.js, MASTER_DEBT)  |
| Review sources | Qodo PR Suggestions, Gemini Code Assist, Qodo Compliance |

#### Per-Round Breakdown

| Round     | Date       | Source                                       | Items  | Fixed  | Def.  | Rej.  | Key Patterns                                                          |
| --------- | ---------- | -------------------------------------------- | ------ | ------ | ----- | ----- | --------------------------------------------------------------------- |
| R1        | 2026-02-26 | Qodo PR (9), Gemini (1), Qodo Compliance (2) | 10     | 10     | 0     | 0     | Secret redaction consolidation, escaped quotes, single-quote patterns |
| R2        | 2026-02-26 | Qodo PR Suggestions (8)                      | 8      | 7      | 0     | 1     | JSON key quoting, TDMS data quality (5 DEBT entries)                  |
| **Total** |            |                                              | **18** | **17** | **0** | **1** |                                                                       |

**Trajectory:** 10 → 8. Clean convergence — no item count spikes.

**Severity distribution:** 0 CRITICAL, 5 MAJOR (security), 8 MINOR (TDMS data),
5 TRIVIAL (cosmetic). Security fixes were high-value, data fixes were routine.

#### Ping-Pong Chains

None found. Clean forward progression across both rounds. R2 items were entirely
new findings (JSON key quoting, different DEBT entries), not regressions from R1
fixes.

#### Rejection Analysis

| Category                       | Count | Round | Items                         | Justification                                      |
| ------------------------------ | ----- | ----- | ----------------------------- | -------------------------------------------------- |
| Schema convention disagreement | 1     | R2    | DEBT-7595 roadmap_ref null→"" | Standardized on `null` in R1; `""` is inconsistent |

**Rejection accuracy:** 1/1 correct (100%). The `null` convention was
established in R1 and applied consistently — changing back to `""` would create
inconsistency.

**False-positive rate by source:**

| Source          | Total Items | Rejected | FP Rate | Notes                     |
| --------------- | ----------- | -------- | ------- | ------------------------- |
| Qodo PR         | 17          | 1        | 6%      | Lowest FP rate in series  |
| Qodo Compliance | 2           | 0        | 0%      | Informational only        |
| Gemini          | 1           | 0        | 0%      | Converged with Qodo on #1 |

**Trend:** Extremely low rejection rate (6%). Multi-source convergence (Gemini +
Qodo) on the secret redaction consolidation was high-signal — both identified
the same gap independently.

#### Recurring Patterns (Automation Candidates)

| Pattern                             | This PR  | Cross-PR History    | Already Automated?      | Recommended Action                               | Est. Effort |
| ----------------------------------- | -------- | ------------------- | ----------------------- | ------------------------------------------------ | ----------- |
| Dual-file propagation (sanitize-\*) | R1 all 4 | #393 (same pattern) | **YES** (pre-check #17) | Done — propagation discipline followed correctly | Done        |
| TDMS data quality (missing fields)  | R1-R2    | #392 R4, #391       | No                      | Schema validation in intake scripts (DEBT-11312) | ~30 min     |
| Secret redaction pattern gaps       | R1       | #393 (quoted-value) | Partial (#45)           | FIX_TEMPLATE #45 updated with all edge cases     | Done        |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                            | Implemented?              | Impact on PR #395                                      | Avoidable Rounds Caused     |
| ------- | --------------------------------------------- | ------------------------- | ------------------------------------------------------ | --------------------------- |
| PR #394 | FIX_TEMPLATE #42 CC extraction                | **YES** (template exists) | No trigger (no ESLint rule work in #395)               | 0                           |
| PR #394 | FIX_TEMPLATE #43 ChainExpression unwrap       | **YES** (template exists) | No trigger (no AST work in #395)                       | 0                           |
| PR #394 | Split large PRs                               | **FOLLOWED**              | PR #395 is focused scope — retro actions only          | -0.5 (saved ~0.5 round)     |
| PR #393 | Quoted-value secret redaction edge case tests | **YES** (this PR)         | Core feature — PR IS this implementation               | 0                           |
| PR #392 | Cross-platform path normalization pre-check   | **YES** (pre-check #14)   | No trigger (no path work in #395)                      | 0                           |
| PR #392 | JSONL schema validation in intake scripts     | **NOT DONE** (DEBT-11312) | TDMS data quality items surfaced again (5 in R1, 5 R2) | 0 (items found, not caused) |
| PR #392 | Auto-increment review numbers from JSONL max  | **NOT DONE** (DEBT-7582)  | No collision in #395                                   | 0                           |

**Implemented rate:** 5/7 (71%). All "do now" items from #394 and #393 were
implemented. 2 deferred TDMS items remain open but caused zero avoidable rounds.

**Impact of unimplemented items:** 0 avoidable rounds. The TDMS data quality
items in R1/R2 were organic findings from the PR's own DEBT entries, not caused
by missing schema validation. Schema validation would have prevented the bad
data from being created initially, but the PR's fix was the correct remediation.

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Avoidable % | Rejections | Rej. Rate | Key Issue                            |
| -------- | ------ | ----------- | ---------------- | ----------- | ---------- | --------- | ------------------------------------ |
| #388     | 7      | 144         | ~4.5             | 64%         | 29         | 20%       | Heuristic + regex + propagation      |
| #390     | 4      | 25          | ~1.5             | 38%         | 4          | 16%       | Qodo repeats + date/cache fixes      |
| #391     | 3      | 122         | ~3               | 100%        | 7          | 6%        | Path containment + symlink + dedup   |
| #392     | 4      | 54          | ~2               | 50%         | 12         | 22%       | Logic + path normalization + JSONL   |
| #393     | 2      | 15          | ~0               | 0%          | 9          | 60%       | Over-engineering cleanup (mostly FP) |
| #394     | 12     | ~321        | ~5               | 42%         | ~112       | 35%       | Large PR, CC, ChainExpression        |
| **#395** | **2**  | **18**      | **~0**           | **0%**      | **1**      | **6%**    | **Focused: security + data quality** |

**Persistent cross-PR patterns (updated):**

| Pattern                      | PRs Affected           | Times Rec. | Status                          | Trend                                 |
| ---------------------------- | ---------------------- | ---------- | ------------------------------- | ------------------------------------- |
| Large PR scope → more rounds | #383-#394              | **6x**     | **FOLLOWED** in #395            | **Improving** — 2nd clean follow      |
| TDMS data quality            | #383, #391, #392, #395 | **4x**     | Not automated (DEBT-11312)      | **Recurring** — needs validation      |
| Dual-file propagation        | #393, #395             | **2x**     | **RESOLVED** (pre-check #17)    | **Resolved** — discipline followed    |
| Secret redaction gaps        | #393, #395             | **2x**     | **RESOLVED** (FIX_TEMPLATE #45) | **Resolved** — template comprehensive |

#### Skills/Templates to Update

| Item | Target Document  | Change                                                                                     | Priority | Est. Effort |
| ---- | ---------------- | ------------------------------------------------------------------------------------------ | -------- | ----------- |
| 1    | FIX_TEMPLATES.md | Verify Template #45 covers JSON key quoting (`"token": "value"`)                           | Do now   | ~2 min      |
| 2    | CODE_PATTERNS.md | Add pattern: TDMS DEBT entry must have `source` field and `null` for empty optional fields | Do now   | ~3 min      |

**Note:** No new templates or pre-checks needed — PR #395 validated existing
templates (#45) and pre-checks (#17). This is a positive signal that the tooling
from prior retros is working.

#### Process Improvements

1. **Focused PR scope continues to pay off** — PR #395 had 2 rounds, 18 items,
   0% avoidable. Compare: PR #394 had 12 rounds with 42% avoidable. The "retro
   action items" scope was tight and well-defined.

2. **Propagation discipline held** — All 4 security fixes in R1 were propagated
   between `sanitize-error.js` and `sanitize-input.js` in the same commit. This
   is pre-check #17 working as designed.

3. **Multi-source convergence is high-signal** — Gemini and Qodo independently
   identified the secret redaction consolidation gap. When 2+ reviewers converge
   on the same finding, priority should be elevated automatically.

4. **TDMS data quality is the remaining systemic issue** — 10 of 18 items were
   TDMS data fixes (missing fields, duplicates, truncated titles). This is now
   the 4th PR where TDMS data quality appears. Schema validation (DEBT-11312) is
   the structural fix.

5. **FIX_TEMPLATE #45 is production-validated** — Created in PR #393, applied
   and refined in PR #395. The template correctly guided the secret redaction
   improvements. R2's JSON key quoting addition extended the template further.

#### Verdict

**PR #395** had an **efficient review cycle** — 2 rounds with 18 items, 17
fixed. **~0 rounds avoidable (0%)**. This is the best efficiency score since PR
#393.

**Trend: Continued improvement for focused PRs.**

| Metric         | #392 | #393 | #394 | **#395** | Direction |
| -------------- | ---- | ---- | ---- | -------- | --------- |
| Rounds         | 4    | 2    | 12   | **2**    | Improving |
| Items/round    | 13.5 | 7.5  | 26.8 | **9.0**  | Improving |
| Avoidable %    | 50%  | 0%   | 42%  | **0%**   | Improving |
| Rejection rate | 22%  | 60%  | 35%  | **6%**   | Improving |

**The single highest-impact change:** Implement JSONL schema validation
(DEBT-11312). This would eliminate ~55% of all items in this PR (10 of 18 were
TDMS data quality fixes that schema validation would have prevented at intake
time).

**Positive signals:** (1) 0% avoidable rounds — only the 2nd PR to achieve this
(after #393). (2) Propagation discipline (pre-check #17) fully followed — all
sanitize-\* fixes cross-propagated. (3) FIX_TEMPLATE #45 production-validated
and extended. (4) Lowest rejection rate in the series (6%). (5) Multi-source
convergence confirmed as high-signal pattern.

---

### PR #392 Retrospective (2026-02-25)

_Covers 4 review rounds on `check-propagation.js` pattern checker + JSONL data
quality fixes. PR scope: 5 files (+5,670/-4,673). First PR to follow "small
scope" recommendation._

#### Review Cycle Summary

| Metric          | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Rounds          | 4 (R1–R4, all 2026-02-25)                                |
| Total items     | 54                                                       |
| Fixed           | 35                                                       |
| Deferred        | 4 (pipeline-generated JSONL, R1)                         |
| Rejected        | 12                                                       |
| Repeat-rejected | 3 (Qodo Compliance R2)                                   |
| Files changed   | 5 (1 script, 2 JSONL data, 1 JSONL sync, 1 doc)          |
| Diff size       | +5,670/-4,673 (JSONL churn inflates; script: +175/-175)  |
| Review sources  | SonarCloud, Qodo Compliance, Qodo PR Suggestions, Gemini |

#### Per-Round Breakdown

| Round     | Date       | Source                                             | Items  | Fixed  | Def.  | Rej.   | Severity                 | Files Modified                                                                                      | Key Patterns                                                                                                                                                                                                                                             |
| --------- | ---------- | -------------------------------------------------- | ------ | ------ | ----- | ------ | ------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1        | 2026-02-25 | SonarCloud (2), Qodo (1), Gemini (2), Qodo PR (13) | 18     | 11     | 0     | 7      | 0C, 3 MAJ, 8 MIN, 7 TRIV | check-propagation.js, AI_REVIEW_LEARNINGS_LOG.md                                                    | checkKnownPatterns logic flaw (checked unguardedFiles not uniqueMatches), git glob :(glob) pathspec, empty catch swallowing all exit codes, toPosixPath(), TS/TSX coverage, secure logging                                                               |
| R2        | 2026-02-25 | SonarCloud (1), Qodo Compliance (3), Qodo PR (9)   | 13     | 6      | 4     | 3      | 0C, 2 MAJ, 7 MIN, 4 TRIV | check-propagation.js, AI_REVIEW_LEARNINGS_LOG.md                                                    | changedInArea R1 fix incomplete (directory overlap approach), String(err) → err.message, regex.lastIndex=0 before .test() in loops, toFsPath() for Windows FS API, defensive String() cast                                                               |
| R3        | 2026-02-25 | Qodo PR Suggestions (5)                            | 5      | 3      | 2     | 0      | 0C, 1 MAJ, 2 MIN, 2 TRIV | check-propagation.js, AI_REVIEW_LEARNINGS_LOG.md                                                    | path.dirname returns backslash on Windows even for POSIX inputs (replaced with posixDirname), \b invalid in POSIX ERE (use character class boundary), \s → [[:space:]], revert filterUnguardedFiles to fail-open                                         |
| R4        | 2026-02-25 | Qodo Compliance (3), SonarCloud (1), Qodo PR (14)  | 18     | 15     | 0     | 3      | 0C, 2 MAJ, 7 MIN, 9 TRIV | check-propagation.js, audits.jsonl, normalized-all.jsonl, deduped.jsonl, AI_REVIEW_LEARNINGS_LOG.md | excludeFilePattern missed .isSymbolicLink() method calls, changedPaths normalization missing ./ strip, shouldSkipMatch not POSIX-normalizing before string checks, --blocking fail-fast, param naming (p→filePath), JSONL data quality (111+764 records) |
| **Total** |            |                                                    | **54** | **35** | **4** | **12** |                          |                                                                                                     |                                                                                                                                                                                                                                                          |

**Trajectory:** 18 → 13 → 5 → 18. R3 convergence (5 items) then R4 spike from
JSONL data quality items (9 data records) and Qodo Compliance re-raising items.
Without JSONL data fixes, R4 would have been 9 items — clean convergence.

**Severity distribution across all rounds:** 0 CRITICAL, 8 MAJOR, 24 MINOR, 22
TRIVIAL. No security or data-loss issues — entirely code quality and robustness.

**Scope analysis — This-PR vs Pre-existing:**

| Origin              | Count | Rounds | Examples                                                |
| ------------------- | ----- | ------ | ------------------------------------------------------- |
| This-PR (code)      | 27    | R1–R4  | Logic flaws, path handling, naming, error handling      |
| This-PR (data)      | 9     | R4     | JSONL verified_by type, file:line, directory paths      |
| Pre-existing (data) | 6     | R4     | Truncated titles, empty file fields, section headers    |
| Repeat-rejected     | 3     | R2     | Qodo Compliance items from R1                           |
| Stale/pre-existing  | 5     | R1     | Already-addressed items, pipeline-generated artifacts   |
| Architectural       | 4     | R1, R4 | Pipeline JSONL structure, fail-open design, CLI logging |

---

#### Ping-Pong Chains

##### Chain 1: checkKnownPatterns Logic (R1→R2, 2 rounds)

| Round | What Happened                                                                                                                   | Files Affected           | Root Cause                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------- |
| R1    | `changedInArea` checked `unguardedFiles` instead of `uniqueMatches` — fixed files were excluded before the area check ran       | check-propagation.js:417 | Logic error: filter before check            |
| R2    | R1 fix (checking `uniqueMatches`) still incomplete — files where pattern was REMOVED no longer appear in `uniqueMatches` at all | check-propagation.js:428 | Edge case: grep can't find what was deleted |

**Resolution:** R2 introduced directory overlap approach — check if any changed
file shares a directory with unguarded files. This is semantically correct
because a developer working in a directory with unguarded files should see the
warning regardless of whether their fix removed the pattern.

**Avoidable rounds:** 0.5. The R2 edge case (removed pattern not appearing in
grep) was a genuine insight that required rethinking the approach. However, the
R1 fix could have been validated with a mental test matrix: "what happens when
dev fixes file A (removing the pattern) but file B in the same dir still has
it?"

**Prevention:** Before committing logic fixes for pattern-matching code, define
a test matrix: (1) pattern present+changed, (2) pattern present+unchanged, (3)
pattern removed+changed, (4) no pattern+changed. Validate each case.

##### Chain 2: Cross-Platform Path Handling (R3→R4, 2 rounds)

| Round | What Happened                                                                                                              | Files Affected                                    | Root Cause                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| R3    | `path.dirname` on Windows returns `scripts\check-propagation` (backslash) even for `scripts/check-propagation.js` (POSIX)  | check-propagation.js:62 (posixDirname introduced) | Node.js path module uses OS-native separators             |
| R4    | `shouldSkipMatch` used `file.includes()` on non-normalized paths; `changedPaths` in `checkKnownPatterns` didn't strip `./` | check-propagation.js:241, :419                    | R3 fixed dirname but didn't audit all string-based checks |

**Resolution:** R4 added `toPosixPath()` normalization at entry to
`shouldSkipMatch`, and `./` strip + `toPosixPath()` for `changedPaths` set in
`checkKnownPatterns`. This aligns with `findPatternMatches` which already
normalized with `.replace(/^\.\//, "")`.

**Avoidable rounds:** 0.5. After R3 introduced cross-platform dirname fix, a
propagation grep for all string-based path comparisons (`includes`, `endsWith`,
`has`) would have caught R4's issues. The pattern is: when fixing path handling,
audit ALL path comparisons in the same file, not just the one that broke.

**Prevention:** New pattern: "When fixing cross-platform path handling in a
file, grep that file for all `includes(`, `endsWith(`, `has(`, `startsWith(` on
path variables and verify each uses normalized paths."

##### Chain 3: Qodo Compliance Repeat Rejections (R1→R2, 2 rounds)

| Round | What Happened                                                                          | Files Affected       | Root Cause                          |
| ----- | -------------------------------------------------------------------------------------- | -------------------- | ----------------------------------- |
| R1    | Rejected: S4036 PATH binary hijacking on `execFileSync("git",...)`, Qodo audit entries | check-propagation.js | Qodo Compliance standard findings   |
| R2    | Same 3 items re-raised by Qodo Compliance. Batch-rejected with note "same as R1"       | check-propagation.js | Qodo doesn't track prior rejections |

**Resolution:** pr-review SKILL.md v3.3 added Qodo Compliance batch rejection
pre-check (Step 0.5 #13). Applied successfully in R2 — 3 items handled in one
batch note instead of individual investigation.

**Avoidable rounds:** 0.5 (3 of R2's 13 items were repeats, ~23% of the round).
The remaining 10 R2 items were genuine new findings.

##### Chain 4: filterUnguardedFiles Fail-Open Direction (R2→R3→R4, 3 rounds)

| Round | What Happened                                                            | Files Affected                   | Root Cause                        |
| ----- | ------------------------------------------------------------------------ | -------------------------------- | --------------------------------- |
| R2    | Changed to fail-closed (return false = skip unreadable files)            | check-propagation.js:402-408     | R1 reviewer suggested less noise  |
| R3    | Reverted to fail-open (return true = flag unreadable as unguarded)       | check-propagation.js:402-408     | Security check: false neg > FP    |
| R4    | R4 reviewer re-suggested fail-closed; rejected with documented rationale | check-propagation.js (no change) | Reviewer didn't read R3 rationale |

**Avoidable rounds:** 0.5. The R3 revert was correct (security checkers should
fail-open), but R2's change should not have been accepted. In security-sensitive
code, don't flip error-handling direction without documenting the security
rationale.

**Prevention:** When a reviewer suggests changing error-handling direction in
security code, verify: "does this pattern detect security issues? If yes,
fail-open (flag it) is correct. If no, fail-closed (skip it) is correct." Add
inline comment documenting the choice.

**Total avoidable rounds: ~2 of 4 (~50%)**

---

#### Rejection Analysis

| Category                         | Count | Round(s) | Specific Items                                                            | Justification                                                  |
| -------------------------------- | ----- | -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Qodo Compliance repeats          | 3     | R2       | S4036 PATH hijacking, swallowed exceptions, raw audit entry               | Same items as R1, batch-rejected (pr-review v3.3 pre-check)    |
| S4036 PATH binary hijacking (FP) | 1     | R1       | `execFileSync("git", [...])` — hardcoded binary + array args              | No shell injection risk, local-only script, array args safe    |
| Pipeline-generated artifacts     | 2     | R1       | Qodo raw audit JSONL entries, pipeline-generated JSONL structure          | These are intake pipeline artifacts, not hand-written code     |
| Stale/pre-existing               | 2     | R1       | Items from previous rounds already addressed                              | Verified in codebase — already fixed                           |
| S5852 regex DoS (FP)             | 1     | R4       | `/\/+$/` in posixDirname — single char class + quantifier anchored to `$` | No backtracking risk; input is bounded file paths; first flag  |
| Fail-open correct (design)       | 1     | R4       | `filterUnguardedFiles` fail-open → fail-closed                            | Security checker: false negatives worse than false positives   |
| Structured logging (FP)          | 1     | R4       | "Use structured logging" for CLI pre-push hook                            | `console.log` is correct for CLI scripts, not services         |
| Secure Logging (compliance)      | 1     | R4       | "Unstructured console.log messages"                                       | Same as above — CLI script, not a service with log aggregation |

**Rejection accuracy:** 12/12 correct (100%). No wrongly rejected items
resurfaced in subsequent rounds — all R4 rejections held.

**False-positive rate by source:**

| Source           | Total Items | Rejected | FP Rate | Notes                                         |
| ---------------- | ----------- | -------- | ------- | --------------------------------------------- |
| Qodo Compliance  | 7           | 4        | 57%     | 3 repeats + 1 S4036 (all known FP categories) |
| SonarCloud       | 4           | 1        | 25%     | S5852 regex DoS on simple pattern             |
| Qodo Suggestions | 41          | 5        | 12%     | Pipeline artifacts + stale items              |
| Gemini           | 2           | 0        | 0%      | Both were valid suggestions in R1             |

**Trend:** Qodo Compliance FP rate (57%) is highest, driven entirely by repeat
rejections and S4036. Without repeats: 1/4 = 25%. SonarCloud continues to flag
simple regexes (S5852) — first flag, two-strikes rule not yet triggered.

---

#### Scope Creep Analysis

**In-scope (This-PR, check-propagation.js):** 36 of 54 items (67%) — all code
changes were to the single script file introduced in this PR's parent commit.
Clean scope containment.

**Out-of-scope (JSONL data quality):** 15 of 54 items (28%) — R4 included 9
JSONL data record fixes (audits.jsonl, normalized-all.jsonl) plus 6 pre-existing
data quality items. These were accepted because they were < 5 min each and
improved downstream tooling. However, they inflated R4's item count from 9 to 18
and obscured the actual code convergence.

**Repeat rejections:** 3 of 54 items (5%) — Qodo Compliance re-raising R1 items.

---

#### Recurring Patterns (Automation Candidates)

| Pattern                                   | This PR  | Cross-PR History              | Already Automated?       | Recommended Action                                                            | Est. Effort |
| ----------------------------------------- | -------- | ----------------------------- | ------------------------ | ----------------------------------------------------------------------------- | ----------- |
| Cross-platform path normalization         | R3→R4    | #388 R5-R6, #391 R1-R3        | No                       | Add ESLint custom rule or CODE_PATTERNS entry: normalize before string checks | ~20 min     |
| Qodo Compliance repeat rejections         | R1→R2    | #390 R3-R4, #391 R3           | **YES** (pr-review v3.3) | Done — batch rejection pre-check working as designed                          | Done        |
| JSONL data quality (type consistency)     | R4       | #383, #391                    | No                       | Add JSONL schema validation to intake scripts (verified_by type, file format) | ~30 min     |
| Logic fix without test matrix             | R1→R2    | #388 R2-R4 (isInsideTryCatch) | Pattern 8 in pr-retro    | Enforce "define test matrix before committing logic fixes" in Step 0.5        | ~5 min      |
| Fail-open/fail-closed direction flip-flop | R2→R3→R4 | None prior                    | No                       | Add inline comment template for error-handling direction rationale            | ~5 min      |

---

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                                      | Implemented?             | Impact on PR #392                                                        | Avoidable Rounds Caused |
| ------- | ------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ | ----------------------- |
| PR #391 | Add path-containment to check-propagation.js patterns   | **YES** (this PR)        | Core feature — the PR IS this implementation                             | 0                       |
| PR #391 | Add statSync→lstatSync to check-propagation.js patterns | **YES** (this PR)        | Core feature — the PR IS this implementation                             | 0                       |
| PR #391 | Batch-reject known Qodo Compliance repeats              | **YES** (pr-review v3.3) | Applied in R2 — 3 items batch-rejected in one note                       | 0                       |
| PR #391 | Audit skill template unique IDs                         | **NOT DONE**             | No impact (no new audit skills in #392)                                  | 0                       |
| PR #391 | Auto-increment review numbers from JSONL max            | **NOT DONE**             | Review #376-#378 reused across PRs (collision). Data quality issue only. | 0                       |
| PR #388 | Split multi-skill PRs                                   | **FOLLOWED**             | PR #392 = 1 script + data = small scope → cleaner cycle                  | -1 (saved ~1 round)     |
| PR #388 | Heuristic test matrices before commit                   | **NOT DONE**             | No impact (no new heuristics in #392)                                    | 0                       |
| PR #388 | pr-review Step 1.4: verify reviewer HEAD                | **YES** (R1 applied)     | Checked reviewer analyzed current HEAD — all items valid                 | 0                       |
| PR #386 | S5852 regex complexity pre-push check                   | **NOT DONE** (DEBT-7543) | S5852 flagged in R4 on `/\/+$/`, correctly rejected as FP                | 0                       |
| PR #386 | Small PRs = fewer rounds                                | **FOLLOWED**             | Same as "split" above — 5 files instead of 153                           | -1 (saved ~1 round)     |

**Implemented rate:** 5/10 (50%). All 3 "do now" items from PR #391 retro were
implemented. Both process recommendations (small scope, verify reviewer HEAD)
were followed. 5 items remain unimplemented (2 deferred to TDMS, 3 had no impact
this PR).

**Impact of unimplemented items:** 0 avoidable rounds. All unimplemented items
either had no trigger in this PR (no heuristics, no new audit skills) or were
informational (review number collision, S5852 pre-push). This is the first PR
where unimplemented retro items caused zero avoidable rounds.

---

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Avoidable % | Rejections | Rej. Rate | Key Issue                              |
| -------- | ------ | ----------- | ---------------- | ----------- | ---------- | --------- | -------------------------------------- |
| #384     | 4      | 197         | ~2.5             | 63%         | ~18        | 9%        | CI pattern cascade + CC                |
| #386     | 2      | 25          | ~1               | 50%         | 1          | 4%        | S5852 regex + CC                       |
| #388     | 7      | 144         | ~4.5             | 64%         | 29         | 20%       | Heuristic + regex + propagation        |
| #390     | 4      | 25          | ~1.5             | 38%         | 4          | 16%       | Qodo repeats + date/cache fixes        |
| #391     | 3      | 122         | ~3               | 100%        | 7          | 6%        | Path containment + symlink + dedup     |
| **#392** | **4**  | **54**      | **~2**           | **50%**     | **12**     | **22%**   | **Logic + path normalization + JSONL** |

**Persistent cross-PR patterns (updated):**

| Pattern                       | PRs Affected     | Times Rec. | Status                             | Trend                              |
| ----------------------------- | ---------------- | ---------- | ---------------------------------- | ---------------------------------- |
| Large PR scope → more rounds  | #383-#391        | **5x**     | **FOLLOWED** in #392               | **Improving** — first clean follow |
| Propagation check (automated) | #366-#392        | **10x**    | **RESOLVED** (automated in #392)   | **Resolved** — pre-push hook works |
| Qodo Compliance repeat reject | #390-#392        | **3x**     | **RESOLVED** (pr-review v3.3)      | **Resolved** — batch-reject works  |
| Cross-platform path handling  | #388, #391, #392 | **3x**     | Partial (ad-hoc fixes per PR)      | **Recurring** — needs automation   |
| JSONL data quality            | #383, #391, #392 | **3x**     | Not automated                      | **Recurring** — needs validation   |
| Review number collisions      | #389, #392       | **2x**     | Not automated (DEBT needed)        | Recurring — data quality risk      |
| Logic fix without test matrix | #388, #392       | **2x**     | Pattern 8 documented, not enforced | Recurring — needs Step 0.5 check   |

**Resolution milestone:** PR #392 marks the first PR where 2 long-standing
systemic patterns (propagation check 10x, Qodo repeat rejection 3x) are **fully
resolved**. Combined with the "small PR scope" recommendation being followed, 3
of the top 5 systemic patterns are now addressed.

---

#### Skills/Templates to Update

| Item | Target Document             | Change                                                                                              | Priority     | Est. Effort |
| ---- | --------------------------- | --------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 1    | pr-review SKILL.md Step 0.5 | Add pre-check #14: "Cross-platform path normalization: verify all string checks use POSIX paths"    | Do now       | ~5 min      |
| 2    | pr-review SKILL.md Step 0.5 | Add pre-check #15: "Logic fix test matrix: define inputs→outputs before committing logic changes"   | Do now       | ~5 min      |
| 3    | FIX_TEMPLATES.md            | Add Template #38: POSIX path normalization before string comparison                                 | Do now       | ~5 min      |
| 4    | FIX_TEMPLATES.md            | Add Template #39: Error-handling direction comment (fail-open vs fail-closed rationale)             | Do now       | ~5 min      |
| 5    | CODE_PATTERNS.md            | Add pattern: "Path normalization before string checks — toPosixPath() before includes/endsWith/has" | Do now       | ~5 min      |
| 6    | pr-retro SKILL.md           | Add Pattern 11: Cross-platform path normalization (3x across #388, #391, #392)                      | Do now       | ~5 min      |
| 7    | JSONL intake scripts        | Add schema validation: verified_by type, file field format, no trailing slashes                     | Defer (TDMS) | ~30 min     |
| 8    | reviews:sync script         | Auto-increment review numbers from JSONL max to prevent collisions                                  | Defer (TDMS) | ~20 min     |

---

#### Process Improvements

1. **PR scope discipline paid off** — PR #392 had 5 files (+5,670/-4,673, but
   script only +175/-175). 4 rounds with 54 items (13.5 items/round). Compare:
   PR #391 had 153 files and 122 items (40.7 items/round). **3x fewer items per
   round** with 30x fewer files. Evidence: items/round correlates with file
   count (r=0.87 across #384-#392), not with code complexity.

2. **Propagation automation is production-validated** — The
   `check-propagation.js` patterns (statSync→lstatSync, path containment) ran in
   pre-push during the R4 push and correctly identified 50+ files with unguarded
   patterns. This resolves the **10th** propagation recommendation (PRs
   #366-#392). The script caught in pre-push what would have been 1-2 additional
   review rounds in prior PRs.

3. **Qodo batch rejection saves investigation time** — R2's 3 repeat items were
   handled in one batch note ("same justification as R1") per pr-review v3.3
   Step 0.5 #13. Estimated savings: ~15 min of re-investigation per repeat item
   = ~45 min saved. Resolves the **3rd** recommendation.

4. **Cross-platform path normalization is now the #1 recurring pattern** — Chain
   2 (R3→R4) was entirely caused by incomplete path normalization. This pattern
   appeared in 3 consecutive PRs (#388, #391, #392). The fix is structural: a
   CODE_PATTERNS entry + FIX_TEMPLATE + pr-review Step 0.5 pre-check that says
   "when fixing path handling, grep the file for ALL string-based path
   comparisons."

5. **JSONL data quality inflates review metrics** — R4's 18 items included 9
   JSONL data fixes that are not code quality issues but data cleanup. Without
   them, R4 would have been 9 items — clean convergence matching R3's 5.
   Consider separating data-quality fixes from code-quality fixes in future PR
   scoping.

6. **Zero avoidable rounds from unimplemented retro items** — First time in the
   PR series (#384-#392). All 5 unimplemented items from prior retros had no
   trigger in this PR. This validates the severity-based TDMS tracking: S2 items
   can wait without causing review churn, as long as they're tracked.

---

#### Verdict

**PR #392** had a **moderately efficient review cycle** — 4 rounds with 54
items, 35 fixed. ~2 of 4 rounds were partially avoidable (~50%), driven by:

- Chain 1: Incomplete logic fix without test matrix (R1→R2, ~0.5 avoidable)
- Chain 2: Incomplete path normalization propagation (R3→R4, ~0.5 avoidable)
- Chain 3: Qodo Compliance repeat rejections (R1→R2, ~0.5 avoidable)
- Chain 4: Fail-open direction flip-flop (R2→R3→R4, ~0.5 avoidable)

**Trend: Improving across all key metrics.**

| Metric         | #388 | #390 | #391 | **#392** | Direction |
| -------------- | ---- | ---- | ---- | -------- | --------- |
| Rounds         | 7    | 4    | 3    | **4**    | Stable    |
| Items/round    | 20.6 | 6.25 | 40.7 | **13.5** | Improving |
| Avoidable %    | 64%  | 38%  | 100% | **50%**  | Improving |
| Rejection rate | 20%  | 16%  | 5.7% | **22%**  | Higher\*  |
| Files          | 36+  | 10   | 153  | **5**    | Improving |

\*Higher rejection rate driven by Qodo Compliance repeats (3) and architectural
rejections (4). Excluding repeats: 9/54 = 17%, in line with historical average.

**The single highest-impact change:** Add cross-platform path normalization
pre-check to pr-review Step 0.5 + CODE_PATTERNS.md entry. This would have
eliminated Chain 2 entirely (~0.5 rounds) and prevents the pattern from
recurring in future PRs. Combined with the "logic fix test matrix" pre-check
(Chain 1), these two additions would prevent ~1 round per PR.

**Resolution milestone:** Two long-standing systemic patterns are now **fully
resolved** in PR #392:

- **Propagation check** (10x recommended, PRs #366-#392) — automated via
  `check-propagation.js` with statSync + path-containment patterns in pre-push
- **Qodo Compliance repeat rejection** (3x recommended, PRs #390-#392) —
  automated via pr-review v3.3 Step 0.5 #13 batch rejection pre-check

**Positive signals:** (1) All 3 "do now" items from PR #391 retro were
implemented. (2) First PR to follow "small scope" recommendation — validates the
5x recommendation with data. (3) Zero avoidable rounds from unimplemented retro
items — first time in series. (4) 100% rejection accuracy maintained across all
4 rounds. (5) Propagation pre-push hook ran successfully and identified 50+
files — production validation of the automation.

---

### PR #391 Retrospective (2026-02-25)

_Covers 3 review rounds. Reviews filed under "PR #389" naming due to branch
reuse (`claude/cherry-pick-commits-TNgtU`). Also includes PR #390 retro (4
rounds)._

#### Review Cycle Summary — PR #391

| Metric         | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Rounds         | 3 (R1 2026-02-24, R2-R3 2026-02-25)                                      |
| Total items    | 122                                                                      |
| Fixed          | 108                                                                      |
| Deferred       | 0                                                                        |
| Rejected       | 7                                                                        |
| Stale          | 6 (R3 items already fixed in R1)                                         |
| Pre-fixed      | 1                                                                        |
| Files changed  | 153 (+31,797/-18,702)                                                    |
| Review sources | CI (Pattern Compliance), SonarCloud, Qodo Compliance+Suggestions, Gemini |

**Note:** Review numbering collision — Reviews #367/#368 duplicated for PR #389
vs PR #384. The PR #389 entries (lines ~2951/2983) use `####` h4 headers.

#### Per-Round Breakdown — PR #391

| Round     | Date       | Source                    | Items   | Fixed   | Rej.  | Stale | Key Patterns                                                                                   |
| --------- | ---------- | ------------------------- | ------- | ------- | ----- | ----- | ---------------------------------------------------------------------------------------------- |
| R1        | 2026-02-24 | CI+SonarCloud+Qodo+Gemini | 57      | 55      | 2     | 0     | CI pattern violations (35), path containment (4 files), dedup O(n²)→Map, chained replace regex |
| R2        | 2026-02-25 | Qodo+Gemini               | 25      | 22      | 2     | 0     | Path containment (6 files), lstatSync+symlink skip, code fence state machine, frontmatter      |
| R3        | 2026-02-25 | Qodo+Compliance           | 40      | 31      | 3     | 6     | symlink propagation, dedup IDs O(n²), YAML indentation, brace direction, DoS caps, abs reject  |
| **Total** |            |                           | **122** | **108** | **7** | **6** |                                                                                                |

**Trajectory:** 57 → 25 → 40. R3 spike from Qodo Compliance adding 6 stale items
(already fixed in R1) plus new propagation findings.

---

#### Review Cycle Summary — PR #390

| Metric         | Value                                           |
| -------------- | ----------------------------------------------- |
| Rounds         | 4 (R1–R4, all 2026-02-24)                       |
| Total items    | 25                                              |
| Fixed          | 20                                              |
| Deferred       | 0                                               |
| Rejected       | 4                                               |
| Tracked (TDMS) | 1 (pre-existing docs:index date bug)            |
| Files changed  | 10 (+942/-594)                                  |
| Review sources | Qodo Compliance+Suggestions, SonarCloud, Gemini |

#### Per-Round Breakdown — PR #390

| Round     | Date       | Source                | Items  | Fixed  | Rej.  | Key Patterns                                                                  |
| --------- | ---------- | --------------------- | ------ | ------ | ----- | ----------------------------------------------------------------------------- |
| R1        | 2026-02-24 | Gemini+Qodo           | 8      | 7      | 0     | Metrics inconsistency, pattern syntax, section numbering, undefined var       |
| R2        | 2026-02-24 | Qodo Suggestions      | 7      | 7      | 0     | Committer date (%cI), git log cache, backslash normalization, fd 0 stdin      |
| R3        | 2026-02-24 | SonarCloud+Qodo       | 6      | 4      | 2     | git --follow, .has() for Map, cache key normalization, replaceAll propagation |
| R4        | 2026-02-24 | Qodo Compliance+Sugg. | 4      | 2      | 2     | Deterministic date fallback, rejected numbering fix. 2 repeat rejections.     |
| **Total** |            |                       | **25** | **20** | **4** |                                                                               |

**Trajectory:** 8 → 7 → 6 → 4. Clean linear convergence.

---

#### Ping-Pong Chains

##### PR #391 Chain 1: Path Containment Guards (R1→R2→R3, 3 rounds)

| Round | What Happened                                                        | Files Affected             | Root Cause                    |
| ----- | -------------------------------------------------------------------- | -------------------------- | ----------------------------- |
| R1    | 4 files lacked containment guards on `path.resolve()` results        | 4 audit checker files      | New code without guards       |
| R2    | 6 MORE files had same issue (path containment on external file refs) | 6 additional checker files | Propagation miss from R1      |
| R3    | `resolveRelativePath` strips leading slashes from absolute paths     | Shared utility             | Edge case not caught in R1/R2 |

**Avoidable rounds:** 1.5. R2 propagation miss (should have grepped all checkers
in R1). R3 absolute path edge case was testable.

**Prevention:** After adding a security guard (path containment, symlink check,
etc.), immediately grep ALL similar files for the same missing guard.

##### PR #391 Chain 2: Symlink/lstatSync Propagation (R1→R2→R3, 3 rounds)

| Round | What Happened                                                     | Files Affected                     | Root Cause                    |
| ----- | ----------------------------------------------------------------- | ---------------------------------- | ----------------------------- |
| R1    | Some walkers used `statSync` without symlink check                | Audit runner files                 | New walker code               |
| R2    | `lstatSync` + `isSymbolicLink()` skip recommended for all walkers | module-consistency, code-quality   | Same pattern, different files |
| R3    | `collectScriptFiles` in 2 more files still had `statSync`         | content-quality, coverage-complete | Propagation miss from R2      |

**Avoidable rounds:** 1. R3 was a pure propagation miss.

**Prevention:** `check-propagation.js` should include `statSync→lstatSync`
pattern. This is the **10th propagation recommendation** across retros.

##### PR #391 Chain 3: Dedup ID Generation O(n²) (R1→R3, 2 rounds)

| Round | What Happened                                           | Files Affected                  | Root Cause                       |
| ----- | ------------------------------------------------------- | ------------------------------- | -------------------------------- |
| R1    | Dedup used `deduped[deduped.indexOf(existing)]` — O(n²) | 3 audit runner files            | Copy-paste from template         |
| R3    | 6 checker files had non-unique `id: "SIA-400"` in loops | 6 checker files across 3 audits | Same pattern, counter suffix fix |

**Avoidable rounds:** 0.5. R3 IDs were a different manifestation of same
dedup/uniqueness issue.

##### PR #390 Chain 1: Qodo Repeat Rejections (R3→R4, 2 rounds)

| Round | What Happened                                                           | Files | Root Cause                          |
| ----- | ----------------------------------------------------------------------- | ----- | ----------------------------------- |
| R3    | Rejected: PATH binary hijacking (S4036), swallowed exceptions           | 2     | Qodo Compliance standard findings   |
| R4    | SAME 2 items re-raised by Qodo Compliance. Re-rejected with same reason | 2     | Qodo doesn't track prior rejections |

**Avoidable rounds:** 1 (R4 entirely). Qodo Compliance re-raises rejected items.

**Prevention:** Add batch rejection note in PR for repeat Qodo compliance items.

##### PR #390 Chain 2: getLastModifiedDate Multi-Fix (R1→R2, 2 rounds)

| Round | What Happened                                                                   | Files | Root Cause                      |
| ----- | ------------------------------------------------------------------------------- | ----- | ------------------------------- |
| R1    | Section numbering, undefined var, pattern syntax in retro action items          | 3     | Documentation quality issues    |
| R2    | 3 improvements in same function: date format (%cI), caching, path normalization | 1     | Related suggestions not batched |

**Avoidable rounds:** 0.5. R2's 3 improvements could have been anticipated as a
single refactor pass in R1 if the function was examined holistically.

**Total avoidable rounds: PR #391 ~3 of 3, PR #390 ~1.5 of 4 = ~4.5 of 7 total
(~64%)**

---

#### Rejection Analysis

##### PR #391 Rejections (7/122 = 5.7%)

| Category                     | Count | Round | Examples                                                          |
| ---------------------------- | ----- | ----- | ----------------------------------------------------------------- |
| Architectural (out of scope) | 2     | R1    | "Use ESLint custom rules", "Duplicate safeReadFile"               |
| Silent catch (intentional)   | 3     | R2,R3 | safeReadFile/safeRequire catches — graceful degradation by design |
| Pre-fixed (stale)            | 1     | R2    | auditName negative lookbehind already applied                     |
| Finding snippets local       | 1     | R2    | Audit snippets are local-only, no sanitization needed             |

##### PR #390 Rejections (4/25 = 16%)

| Category                   | Count | Round | Examples                                                |
| -------------------------- | ----- | ----- | ------------------------------------------------------- |
| PATH binary hijacking (FP) | 2     | R3,R4 | `execFileSync("git")` — hardcoded cmd, array args, safe |
| Swallowed exceptions (FP)  | 2     | R3,R4 | Intentional graceful degradation with fallback chain    |

**Overall rejection accuracy:** 11/11 correct (100%).

**FP rate by source:** Qodo Compliance ~20% (repeat items inflate), Gemini ~10%
(stale review), SonarCloud S4036 ~100% for local tooling scripts, CI ~5%.

---

#### Recurring Patterns (Automation Candidates)

| Pattern                        | PRs Affected     | Rounds  | Already Automated? | Recommended Action                                        | Est. Effort |
| ------------------------------ | ---------------- | ------- | ------------------ | --------------------------------------------------------- | ----------- |
| Path containment propagation   | #391 R1→R2→R3    | 3       | No                 | Add path-containment to check-propagation.js patterns     | ~30 min     |
| lstatSync propagation          | #388 R5→R6, #391 | 5       | Partial (script)   | Add statSync→lstatSync to propagation script              | ~15 min     |
| Qodo Compliance repeat reject  | #390 R3→R4       | 2       | No                 | Batch-reject known Qodo compliance repeats in PR comments | ~5 min      |
| Dedup/uniqueness in audit code | #391 R1, R3      | 2       | No                 | Add to audit skill template: unique ID + Map-based dedup  | ~10 min     |
| Review number collisions       | #389/#384 (#367) | Ongoing | No                 | Auto-increment from JSONL max to prevent numbering gaps   | ~20 min     |

---

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                        | Implemented?             | Impact on #390/#391                                        |
| ------- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| PR #388 | pr-review Step 1.4: Verify reviewer HEAD  | **YES** (1 match)        | R3 stale items caught faster                               |
| PR #388 | FIX_TEMPLATES #37: lazy-load typeof guard | **YES** (1 match)        | Not triggered in #390/#391                                 |
| PR #388 | CODE_PATTERNS.md: POSIX ERE               | **YES** (2 matches)      | No POSIX ERE issues in #390/#391                           |
| PR #388 | pr-retro Pattern 10: stale reviews        | **YES** (v2.6)           | Applied in #391 R3 stale item handling                     |
| PR #388 | Heuristic test matrices                   | **NOT DONE**             | No impact (no new heuristics)                              |
| PR #388 | Split multi-skill PRs                     | **NOT FOLLOWED**         | **DIRECT IMPACT**: #391 had 153 files, 3 rounds, 122 items |
| PR #386 | S5852 regex complexity pre-push           | **NOT DONE** (DEBT-7543) | No impact (no S5852 in #390/#391)                          |
| PR #386 | Small PRs = fewer rounds                  | **NOT FOLLOWED**         | Same as "split" above — 5th recommendation                 |

**Implemented rate: 4/8 (50%).** All 4 "do now" items from PR #388 retro were
implemented. The 2 process recommendations (split PRs, heuristic matrices) and 2
automation items (S5852 pre-push, test matrices) remain unimplemented.

---

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | Avoidable Rounds | Rejections | Key Issue                              |
| -------- | ------ | ----------- | ---------------- | ---------- | -------------------------------------- |
| #384     | 4      | 197         | ~2.5             | ~18        | CI pattern cascade + CC                |
| #386     | 2      | 25          | ~1               | 1          | S5852 regex + CC                       |
| #388     | 7      | 144         | ~4.5             | 29         | Heuristic + regex + propagation        |
| **#390** | **4**  | **25**      | **~1.5**         | **4**      | **Qodo repeats + date/cache fixes**    |
| **#391** | **3**  | **122**     | **~3**           | **7**      | **Path containment + symlink + dedup** |

**Persistent cross-PR patterns:**

| Pattern                           | PRs Affected | Times Recommended | Status                        | Required Action                                     |
| --------------------------------- | ------------ | ----------------- | ----------------------------- | --------------------------------------------------- |
| Large PR scope → more rounds      | #383-#391    | **5x**            | **NOT FOLLOWED**              | Split multi-skill PRs — strongest signal in dataset |
| Propagation check                 | #366-#391    | **10x**           | **PARTIAL** (script + manual) | Add path-containment + statSync patterns to script  |
| Qodo Compliance repeat rejections | #390, #382   | 2x                | Not automated                 | Batch-reject template for known false positives     |
| CC lint rule                      | #366-#371    | 5x                | **RESOLVED** (pre-commit)     | None                                                |
| Local patterns:check before push  | #384-#388    | 3x                | **RESOLVED** (pre-push hook)  | None                                                |

---

#### Skills/Templates to Update

1. **check-propagation.js:** Add `path.resolve.*containment` and
   `statSync→lstatSync` patterns (~30 min)
2. **Audit skill templates:** Add unique ID generation + Map-based dedup as
   standard patterns (~10 min)
3. **pr-review SKILL.md:** Add "batch-reject known Qodo Compliance repeat items
   (PATH hijack, swallowed exceptions)" (~5 min)
4. **reviews:sync script:** Auto-increment review numbers from JSONL max to
   prevent numbering collisions (~20 min)

---

#### Process Improvements

1. **Large PR scope remains the #1 systemic driver** — PR #391 had 153 files, 3
   rounds, 122 items. PR #390 had 10 files, 4 rounds, 25 items. Scope correlates
   with item count (15.3x files = 4.9x items) but not necessarily round count.
   **5th retro recommending split.** Evidence: all PRs >50 files get 100+ review
   items.
2. **Propagation is the persistent #2 driver** — 10th recommendation. PR #391
   had 2 propagation chains (path containment R1→R2, lstatSync R2→R3). The
   `check-propagation.js` script exists but doesn't cover path containment or
   statSync patterns. Adding these 2 patterns would eliminate ~1.5 rounds.
3. **PR #390 shows small PRs work** — 10 files, 4 rounds, but only 25 items
   (6.25 items/round). Rounds driven by Qodo repeat rejections, not real issues.
   Effective fix rate: 20/21 real items (95%) in 2 rounds.
4. **R1 review quality improving** — PR #391 R1 had 55/57 items fixed (96% fix
   rate). PR #390 R1 had 7/8 (88%). Both are strong first-round execution.

---

#### Verdict

**PR #391** had a **moderately efficient review cycle** — 3 rounds with 122
items, 108 fixed. ~3 of 3 rounds were partially avoidable (~100%), all driven by
propagation misses (path containment, lstatSync, dedup patterns). The massive
scope (153 files, +31K/-18K lines) is the root cause — impossible to catch all
propagation targets manually in a PR this large.

**PR #390** had an **efficient review cycle** — 4 rounds with 25 items, 20
fixed. ~1.5 of 4 rounds were avoidable (~38%), driven by Qodo Compliance
re-raising already-rejected items (R4 entirely avoidable). The small scope (10
files) kept item counts manageable.

**Trend: Mixed.** Round count: #388(7) → **#390(4)** → **#391(3)**. Items per
round: #388(20.6) → **#390(6.25)** → **#391(40.7)**. Rejection rate: #388(20%) →
**#390(16%)** → **#391(5.7%)**. PR #391's high items/round reflects massive
scope, not process regression. PR #390's clean cycle validates the "small PR"
recommendation.

**The single highest-impact change:** Add path-containment and
statSync→lstatSync patterns to `check-propagation.js`. This would have
eliminated ~2.5 rounds across both PRs. Combined with the 5x-recommended PR
scope reduction, these two changes would prevent ~80% of avoidable review
cycles.

**Positive signals:** (1) All 4 "do now" action items from PR #388 retro were
implemented. (2) PR #391 rejection rate dropped to 5.7% (best in series). (3) PR
#390 demonstrates small PRs converge faster. (4) Review number collision is a
data quality issue, not a process issue.

**Data quality issue:** Review numbers #367 and #368 are used for both PR #384
and PR #389, creating ambiguity in the learnings log. Recommend auto-increment
from JSONL max.

---

### PR #390 Retrospective (2026-02-25)

_Incorporated into PR #391 dual retro above. See "Review Cycle Summary — PR
#390" section._

---

### PR #393 Retrospective (2026-02-26)

_Over-engineering audit: hook consolidation, token reduction, dead code cleanup.
PR scope: 44 files (+10,605/-many). 2 review rounds._

**Review Cycle Summary:**

| Metric      | Value                              |
| ----------- | ---------------------------------- |
| Rounds      | 2 (R1: 2026-02-25, R2: 2026-02-26) |
| Total items | 15 (6 unique R1 + 9 R2)            |
| Fixed       | 6                                  |
| Deferred    | 0                                  |
| Rejected    | 9 (5 Qodo repeats + 4 design/FP)   |

**Ping-Pong Chains:** None. Clean forward progression.

**Rejection accuracy:** 9/9 correct (100%).

**Key findings:** (1) Deletion-heavy PRs have lower review surface — 44 files
but only 2 rounds. (2) Gemini + Qodo convergence on quoted-value secret
redaction bug (high-signal multi-source agreement). (3) Qodo Compliance FP rate
78% — 5 repeats + 2 design rejections.

**Action items:** Add quoted-value secret redaction edge case tests. Pattern:
`KEY="multi word"` + `KEY=\n` boundary. Implemented in FIX_TEMPLATE #45.

**Verdict:** Efficient 2-round cycle. ~0 rounds avoidable. First 2-round PR in
the #384-#394 series.

---

### PR #394 Retrospective (2026-02-26)

_Resolve over-engineering findings: delete 12K+ lines of dead code, migrate
linter to ESLint AST. PR scope: 151 files (+11,460/-many). 12 review rounds._

**Review Cycle Summary:**

| Metric      | Value                              |
| ----------- | ---------------------------------- |
| Rounds      | 12 (R1-R12, all 2026-02-26)        |
| Total items | ~321                               |
| Fixed       | ~153                               |
| Deferred    | ~35 (Enhancement Plan items)       |
| Rejected    | ~112 (~40 Qodo Compliance repeats) |

**Ping-Pong Chains (5):**

1. **Chain 1: walkAst/containsCallTo CC** (R1→R2→R3→R6→R7, 5 rounds, ~2
   avoidable). CC extracted incrementally instead of to ≤10 in one pass.
2. **Chain 2: isInsideTryBlock** (R1→R2, 2 rounds, 1 avoidable). 4th occurrence
   of this pattern across PRs #374, #375, #388, #394. Now BLOCKING.
3. **Chain 3: hasRenameSyncNearby** (R1→R3→R5, 3 rounds, ~1 avoidable).
   Hand-enumerated AST types insufficient; generic walker needed.
4. **Chain 4: ChainExpression** (R4→R5→R6, 3 rounds, ~1 avoidable). Added to one
   utility, missed 2 others. Fix-one-audit-all principle.
5. **Chain 5: Qodo Compliance repeats** (R1→R12, ~40 items). Batch-rejected per
   pr-review v3.3.

**Total avoidable rounds: ~5 of 12 (~42%)**

**Key findings:** (1) Large PR scope is dominant efficiency problem — 151 files,
12 rounds. (2) CC reduction predictably incremental — target ≤10 not ≤15. (3)
ChainExpression is new systemic AST pattern — fix one, audit all. (4) Generic
AST walker (Object.keys + recurse) > hand-enumerated types. (5) Lazy quantifiers
(`.*?`, `.+?`) are NOT safe for ReDoS — still unbounded.

**Action items implemented:**

- FIX_TEMPLATE #42: ESLint rule CC extraction (visitChild pattern)
- FIX_TEMPLATE #43: ChainExpression unwrap + WeakSet dedup
- FIX_TEMPLATE #44: Generic AST walker
- FIX_TEMPLATE #45: Quoted-value secret redaction
- CODE_PATTERNS: 4 new patterns (lazy quantifiers, generic walker, per-access
  guard, fix-one-audit-all)
- pr-retro: Pattern 8 upgraded to BLOCKING, Patterns 12-13 added
- pr-review: Pre-checks #16-17 added

**Verdict:** Inefficient but productive — 12 rounds, ~153 fixes, ~42% avoidable.
Single highest-impact change: split large PRs. Second: create ESLint rule
template with built-in ChainExpression/walker/CC patterns.

---

#### Review #406: Maintenance PR R7 (2026-02-27)

- **Source**: SonarCloud (1) + Qodo Compliance (5) + Qodo PR Suggestions (5)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 11 total → 6 actionable (5 compliance batch-rejected), 6 fixed, 0
  deferred, 0 rejected
- **Key fix**: SonarCloud CC=18 in intake-pr-deferred.js main() — R6's try/catch
  addition pushed CC over the 15 threshold. Extracted `validateInputs()` helper
  to reduce CC. Also reduced duplication by extracting `ensureDebtDirs()`,
  `snapshotFile()`, and `rollbackFile()` helpers in safe-fs.js.
- **Pattern**: CC-creep-from-error-handling — adding try/catch blocks to
  existing functions can silently push CC over thresholds. When adding error
  handling, check if the function is already near the CC limit and extract
  proactively.

---

#### Review #405: Maintenance PR R6 (2026-02-27)

- **Source**: SonarCloud (2) + Qodo Compliance (5) + Qodo PR Suggestions (5)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 12 total → 7 actionable (5 compliance batch-rejected), 7 fixed, 0
  deferred, 0 rejected
- **Key fix**: SonarCloud flagged the `indexOf() !== -1` ternary introduced in
  R5 as both "unexpected negated condition" and "use .includes()". Both issues
  on same line — R5's string-parsing approach was correct but used non-idiomatic
  JS. Lesson: when replacing regex with string ops, use `.includes()` for
  existence checks, not `.indexOf() !== -1`.
- **Pattern**: indexOf-to-includes — every time `.indexOf(x) !== -1` is written,
  use `.includes(x)` instead for readability and to avoid SonarCloud flags.

---

#### Review #404: Maintenance PR R5 (2026-02-27)

- **Source**: SonarCloud (1) + Qodo Compliance (5) + Qodo PR Suggestions (2)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 8 total → 3 actionable (5 compliance batch-rejected), 1 fixed, 0
  deferred, 2 rejected (atomicWriteViaTmp already guarded by inner calls; inline
  pre-filter duplicates existing post-normalization check)
- **Key fix**: S5852 regex in Format 4 bullet extraction — replaced matchAll
  regex with line-by-line string parsing (same two-strikes pattern as R4).
  SonarCloud flags `\s*-\s+` as backtracking even when input is bounded to 2000
  chars. Lesson: when SonarCloud flags any regex in a file, proactively sweep
  ALL regexes in that file (Pre-check #10) to avoid serial rounds.
- **Pattern**: serial-regex-flagging — SonarCloud flags regexes one-per-round.
  After fixing one, the next round flags another in the same file. Prevention:
  on first S5852 flag, grep entire file for all regex patterns and replace any
  with backtracking potential in the same commit.

---

#### Review #403: Maintenance PR R4 (2026-02-27)

- **Source**: SonarCloud (5) + Qodo Compliance (5) + Qodo PR Suggestions (4)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 14 total → 9 actionable (5 compliance batch-rejected), 8 fixed, 0
  deferred, 1 rejected (retro dedupe key over-strengthening)
- **Key fix**: S5852 regex DoS — replaced backtracking regex with string parsing
  (two-strikes rule). R3 applied regex per Qodo suggestion, R4 SonarCloud
  flagged it as security hotspot. Lesson: reviewer suggestions can introduce new
  issues; always validate regex for backtracking before adopting.
- **Pattern**: review-suggestion-creates-new-issue — when a reviewer suggestion
  is applied verbatim and the next round flags the result, apply the two-strikes
  rule (Pre-check #10) to replace with a fundamentally different approach rather
  than patching.
- **CC reduction pattern**: When SonarCloud flags CC on a function you just
  modified, extract the added logic into a named helper to keep CC within
  budget. The nested ternary for ID parsing → `parseNumericId()` helper.

---

#### Review #402: Maintenance PR R3 (2026-02-27)

- **Source**: Qodo Compliance (5) + Qodo PR Suggestions (12)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 13 unique → 9 fixed, 3 deferred (JSONL metadata), 5 rejected (4
  compliance repeat-rejected + 1 new compliance)
- **Key fixes**:
  - sync-reviews-to-jsonl.js: HIGH — retro dedupe used `r.id` as key which can
    be undefined; switched to composite `pr:date` key to prevent data loss.
  - safe-fs.js: HIGH — `appendMasterDebtSync` now captures file sizes before
    dual-append and rolls back on partial failure to maintain MASTER<->deduped
    consistency.
  - sync-reviews-to-jsonl.js: collision resolution now checks `mdIds` set to
    avoid assigning new IDs that collide with existing markdown review IDs.
  - sync-reviews-to-jsonl.js: `loadExistingReviewObjects` now handles string IDs
    via `Number.parseInt` to prevent collision detection misses.
  - run-consolidation.js: version row insertion uses anchored regex for
    separator detection; pattern names capped at 10 in table row.
  - sync-reviews-to-jsonl.js: inline pattern filter now checks PATTERN_SKIP set.
  - safe-fs.js: `breakStaleLock` rmSync wrapped in try/catch for crash safety.
  - assign-roadmap-refs.js: defensive per-line JSONL parsing with abort on
    malformed data.
- **Rejections**: 4 Qodo Compliance repeat-rejected (same justification as R2:
  swallowed exceptions, audit trails, secure logging, TOCTOU). 1 new: untrusted
  exec — `execFileSync("npm")` runs on known trusted repo, PATH hijacking
  requires compromised environment.
- **Deferred**: 3 JSONL metadata items (TODO line numbers, report file/line,
  duplicate entries) — fix intake pipeline, not data file.
- **Patterns**: Composite-Key-For-Nullable-IDs; Rollback-On-Dual-Write-Failure;
  Check-All-ID-Sets-On-Collision-Resolution

---

#### Review #401: Maintenance PR R2 (2026-02-27)

- **Source**: SonarCloud (1) + Qodo Compliance (5) + Qodo PR Suggestions (15)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 19 unique → 8 fixed, 8 deferred (JSONL metadata), 4 rejected
  (compliance items for dev tool)
- **Key fixes**:
  - safe-fs.js: CRITICAL — acquireLock CC 22→~12 via 3 extracted helpers
    (`guardLockSymlink`, `isLockHolderAlive`, `tryBreakExistingLock`)
  - safe-fs.js: NaN-safe timestamp validation (`Number.isFinite`) prevents stale
    lock detection from breaking on corrupted lock data
  - safe-fs.js: PID-alive check (`process.kill(pid, 0)`) prevents breaking locks
    held by live processes on the same host
  - safe-fs.js: mkdirSync for output directories in dual-write functions
  - sync-reviews-to-jsonl.js: Active log concatenated BEFORE archive so newer
    data wins dedup on ID collisions (data loss prevention)
  - sync-reviews-to-jsonl.js: Inline pattern regex now case-insensitive with
    comma+semicolon splitting
  - run-consolidation.js: Version row insertion uses separator line anchor
    instead of fragile multi-skip logic
  - normalized-all.jsonl: Fixed 2 truncated titles ("...meetings.ts and")
- **Rejections**: TOCTOU symlink (defense-in-depth, O_EXCL is real guard),
  silent catches (intentional fail-safe), audit trails (dev tool), structured
  logging (dev tool)
- **Deferred**: 8 JSONL metadata quality items (line numbers, source locations,
  duplicates, provenance) — auto-generated data, fix intake script instead
- **Patterns**: CC-Extract-Helpers-Proactively; NaN-Safe-Timestamp-Validation;
  Active-Log-Priority-Over-Archive; PID-Alive-Lock-Check

---

#### Review #400: Maintenance PR R1 (2026-02-27)

- **Source**: SonarCloud (17) + Qodo Compliance (2) + Qodo PR Suggestions (18) +
  Gemini (2)
- **PR**: Maintenance — pipeline repair + deep-plan automation + TDMS refresh
- **Items**: 37 total (32 unique after dedup) → 22 fixed, 10 deferred (JSONL
  data quality), 1 rejected (false positive)
- **Key fixes**:
  - sync-reviews-to-jsonl.js: CRITICAL bug — `existingIds.add(newId)` caused
    renumbered reviews to be silently dropped (data loss). Fixed with separate
    `newlyAssignedIds` set.
  - safe-fs.js: CRITICAL security — added symlink guard (`lstatSync` check) to
    `acquireLock`/`breakStaleLock` to prevent symlink attacks on lock files.
  - safe-fs.js: Replaced CPU-intensive busy-wait with `Atomics.wait()` sleep.
  - 6 CC reductions via helper extraction (CC 40→~5, 35→~4, 26→~8, 18→~10,
    18→~9, 16→~10) across 6 files.
  - pattern-lifecycle.js: fixed false positive in consolidation auto-update
    detection by targeting specific consolidation number.
- **Rejections**: Qodo #21 (isSafeToWrite not imported in rotate-state.js) —
  FALSE POSITIVE: import exists at module level (line 15).
- **Deferred**: 10 JSONL metadata quality items in normalized-all.jsonl —
  generated data file, should be fixed via intake script improvement.
- **Patterns**: Fix-One-Audit-All; CC-Extract-Helpers-Proactively;
  Separate-Tracking-Sets-For-Mutation
- **Agents**: 4 parallel code-reviewer agents for CC reductions

---

#### Review #399: PR #396 R2 (2026-02-26)

- **Source**: Qodo Compliance (4) + Qodo PR Suggestions (7) + CI Feedback (1)
- **PR**: PR #396 — ESLint + pattern compliance fixes
- **Items**: 10 unique → 6 fixed, 4 rejected
- **Key fixes**:
  - safe-fs.js: same-path rename guard (`absSrc === absDest` early return)
    prevents data loss on self-rename
  - pattern-compliance.test.js: aligned test regex with production regex
    (`\b(?:fs\.)?` word boundary pattern) — CI was failing on this mismatch
  - pattern-compliance.test.ts: POSIX path normalization for cross-platform
    reliability
  - safe-fs.test.ts: BOM assertion robustness, `t.skip()` for symlink tests
  - library.ts: added `id` to 3 error log calls for debugging context
- **Rejections**: ESM/CJS import (false positive — runtime verified), 3 repeats
  from R1 (TOCTOU, audit trails, logging — same justification)
- **Pattern**: Same-path rename is a real data loss bug — `rmSync(dest)` then
  `renameSync(src, dest)` when src===dest deletes the only copy.

---

#### Review #398: PR #396 R1 (2026-02-26)

- **Source**: Qodo Compliance (26) + SonarCloud (12)
- **PR**: PR #396 — ESLint + pattern compliance fixes (27 items)
- **Items**: 38 total → 24 fixed, 1 deferred (N/A), 12 rejected, 1 duplicate
- **Key fixes**:
  - safe-fs.js: source symlink guard, directory-over-file guard, tmp cleanup on
    atomic write failure, `codePointAt` for Unicode correctness
  - categorize-and-assign.js: path containment via `path.relative()` pattern
  - check-pattern-compliance.js: broadened no-raw-fs-write regex with `\b` word
    boundary to detect destructured `writeFileSync(` without matching
    `safeWriteFileSync(`
  - generate-views.js: `.trim()` on status field to prevent whitespace dedup
    failures
  - pattern-compliance.test.ts: relative path fix (absolute paths rejected by
    security guard in checker), stricter assertion
  - 11 files: removed unused `writeFileSync` imports
  - check-roadmap-hygiene.js: reverted `\r?\n` to `\n` (regex CC reduction)
  - pattern-compliance.test.js: `String.raw` fixes, new destructured test
- **Rejections**: S4036 PATH binary hijacking (hardcoded "node"), arbitrary file
  overwrite (covered by directory guard), missing audit log (single-user CLI),
  EXDEV rollback (copy succeeds = safe), error basename exposure (internal
  tool), unbounded payload (internally constructed), no allowlist (all callers
  hardcoded), consolidate isSafeToWrite (defensive fallback by design), remove
  limit(200) (deliberate unbounded-query fix), test.before() (sequential
  runner), pre-existing try/catch (out of scope), temp cleanup concurrency
  (sequential)
- **Pattern**: Integration test must use relative paths when invoking the
  compliance checker — the script rejects absolute paths as a security measure.
  This was the root cause of the test failure after strictifying the assertion.

---

#### Review #397: PR #395 R2 (2026-02-26)

- **Source**: Qodo PR Suggestions (8)
- **PR**: PR #395 — retro action items, secret redaction hardening
- **Items**: 8 unique → 7 fixed, 0 deferred, 1 rejected

#### Security Fixes (2)

1. **sanitize-error.js + sanitize-input.js: JSON key quoting** — Added `"?`
   around keyword names to handle JSON format `"token": "value"`. Both files
   updated consistently. (Qodo impact 9)

#### TDMS Data Quality Fixes (5)

2. **DEBT-7598**: Added missing `source: "intake"` field
3. **DEBT-7603**: Anchored file/line from source_file metadata
4. **DEBT-7606/7607**: Merged duplicate "Medium Severity" entries into single
   canonical entry
5. **DEBT-7609**: Fixed line metadata (0 → 4)
6. **DEBT-7611**: Fixed truncated title (removed trailing "and"), line 0 → 5

All TDMS fixes applied to both MASTER_DEBT.jsonl and raw/deduped.jsonl.

#### Rejected (1)

7. **DEBT-7595 roadmap_ref null→""** — Rejected. We standardized on `null` for
   empty optional fields in R1. The `""` convention is inconsistent with the
   rest of the file.

#### Patterns

- **JSON format coverage**: Secret redaction must handle `"key": "value"` not
  just `key=value`. The `"?` wrapper around keyword names handles both formats.
- **FIX_TEMPLATE #45 updated**: Reflected JSON key handling in template.

---

#### Review #396: PR #395 R1 (2026-02-26)

- **Source**: Qodo PR Suggestions (9), Gemini Code Assist (1), Qodo Compliance
  (2 informational)
- **PR**: PR #395 — retro action items, ESLint migration, over-engineering
  cleanup
- **Items**: 10 unique actionable → 10 fixed, 0 deferred, 0 rejected

#### Security Fixes (5)

1. **sanitize-error.js: Consolidate unquoted patterns** — Replaced 4 individual
   unquoted patterns (password, api_key, token, secret) with single consolidated
   regex adding `credential` and `auth` keywords. Aligned with sanitize-input.js
   pattern. (Qodo impact 8, Gemini high)
2. **sanitize-error.js: Harden quoted regex** — Changed `[^"]*` to
   `([^"\\]|\\.)+` to handle escaped quotes and require nonempty values.
   Propagated to sanitize-input.js. (Qodo impact 7)
3. **sanitize-input.js: Single-quoted secrets** — Added `'[^']+'` pattern
   between quoted and unquoted. Propagated to sanitize-error.js. (Qodo impact 7)
4. **sanitize-input.js: Delimiter refinement** — Changed `\S{2,}` to
   `[^\s"',;)\]}]{2,}` to avoid consuming trailing delimiters. Propagated to
   sanitize-error.js. (Qodo impact 7)
5. **FIX_TEMPLATE #45 updated** — Reflected all 4 pattern improvements in the
   template's Good Code section and edge case table.

#### TDMS Data Quality Fixes (5)

6. **DEBT-7595**: `roadmap_ref: ""` → `null` for consistency
7. **DEBT-7597**: Added missing `source: "intake"` field
8. **DEBT-7602**: Made non-actionable header entry actionable (added source,
   file, description, recommendation)
9. **DEBT-7604/7605**: Merged duplicate "High Severity Findings" entries into
   single canonical entry with merged_from array
10. **DEBT-7610**: Fixed truncated title, added full description and
    recommendation

All TDMS fixes applied to both MASTER_DEBT.jsonl and raw/deduped.jsonl
(dual-file rule).

#### Patterns

- **Propagation discipline**: All sanitize-input.js fixes propagated to
  sanitize-error.js and vice versa (pre-check #17)
- **Schema consistency**: TDMS entries should always have `source` field and
  `null` (not `""`) for empty optional fields

---

#### Review #395: PR #394 R12 (2026-02-26)

- **Source**: SonarCloud (2), CI (1 — 393 pre-existing), Qodo Compliance (4
  repeats), Qodo PR Suggestions (10+)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 17 unique → 7 fixed, 4 Qodo Compliance repeat-rejected, 6 rejected
- **Fixed**: (1) no-unbounded-regex.js — move `isRegExpCallee` to outer scope
  (SonarCloud); (2) generate-views.js — CC reduction via `readDedupedLines`
  extraction (SonarCloud); (3) no-unescaped-regexp-input.js — use
  `arg.regex != null` instead of `instanceof RegExp` for parser robustness;
  (4-5) no-unsafe-division.js — LogicalExpression support in `getCheckedName` +
  function boundary stop in `isGuarded`; (6-7) no-unsafe-error-access.js —
  LogicalExpression in `isInstanceofGuardTest` + early-exit guard pattern
  (`if (!(err instanceof Error)) return;`)
- **Rejected**: no-non-atomic-write rename destination matching
  (over-engineering), no-unguarded-loadconfig range-based containment (current
  approach correct), no-writefile-missing-encoding options detection (scope
  creep), read-jsonl crash-proof logging (already handled), normalize-file-path
  regex escaping (reviewer display artifact), CI 393 pre-existing violations

---

#### Review #394: PR #394 R11 (2026-02-26)

- **Source**: SonarCloud (7 issues + 1 hotspot), CI (1 — 393 pre-existing
  violations), Qodo Compliance (4 repeats), Qodo PR Suggestions (7)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 20 unique → 14 fixed, 6 rejected (4 Qodo Compliance repeats, 1
  S4036 hardcoded execSync, 1 CI pre-existing violations)
- **Fixed**: (1) no-non-atomic-write.js CC 24→15 — extract `isVarAssignedToTmp`,
  `isRenameSyncFromTmp` helpers; (2) no-unsafe-division.js CC 17→15 — extract
  `getCheckedNameFromBinary`, move `isZero`/`isOne` to module level; (3)
  no-unsafe-error-access.js `endsWith("Error")` instead of regex, per-access
  `isAccessGuarded` replacing block-level check; (4) no-unbounded-regex.js
  remove lazy quantifier exemption (.\*? still ReDoS), add `isRegExpCallee` for
  member invocations; (5) no-unescaped-regexp-input.js string-only literals +
  RegExp literal support + CallExpression handler; (6) generate-views.js CC
  reduction via `getMaxDebtId`/`parseJsonlLine` + `ensureDefaults` on MASTER
  items; (7) generate-content-hash.js `JSON.stringify` hash input +
  `replaceAll`; (8) normalize-category.js `Object.hasOwn()` x2; (9) test updates
  for lazy quantifier and string-only literal changes
- **Rejected**: (A) S4036 PATH hijacking — hardcoded `execFileSync("git", ...)`
  not user-controlled; (B) CI 393 violations — all pre-existing from earlier PR
  commits; (C) Qodo Compliance x4 — repeat rejections from R10
- **Patterns**: Lazy quantifiers (.\*?, .+?) are still unbounded for ReDoS;
  RegExp literals should be treated as safe static input; per-access instanceof
  guard is more correct than block-level check; `JSON.stringify` prevents hash
  collisions from delimiter-containing content
- **Process**: Direct sequential fixes — 5 ESLint rules + 3 scripts + test
  updates. Context compaction mid-session recovered cleanly.

---

#### Review #393: PR #394 R10 (2026-02-26)

- **Source**: CI (1 — test file false positives), Qodo Compliance (3), Qodo PR
  Suggestions (19)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 24 unique → 20 fixed, 4 rejected (3 Qodo Compliance repeats, 1
  correct code)
- **Fixed**: (1) SEC-003/007/010 test file excludes in security-check.js; (2)
  SEC-004 cross-platform path separator `[\\/]`; (3) SKIP_PATTERNS add
  backup/out dirs; (4) `hasInstanceofErrorCheck` require IfStatement wrapper;
  (5) `isEscapedVariable` check arg name not result var; (6) `getCheckedName`
  expand to truthy/!== 0/>= 1/negated guards; (7) `isLocalRequireCall` add
  Windows abs/UNC paths; (8) `containsRenameSyncFromTmp` recognize tmp-path
  variables; (9) `getEnclosingTryStatement` for finally-block atomic renames;
  (10) `no-empty-path-check` optional chain via unwrapNode; (11)
  `no-path-startswith` optional chain via unwrapNode; (12)
  `no-hardcoded-secrets` skip computed keys; (13)
  `no-writefile-missing-encoding` only flag string data; (14) generate-views.js
  trim JSONL lines; (15) normalize-category.js hasOwnProperty.call; (16)
  generate-content-hash.js null guard + normalize text; (17-20) test updates for
  new behaviors
- **Rejected**: (A) normalize-file-path.js regex — `String.raw` is correct; (B)
  Qodo Compliance x3 — repeat of R9 rejections (internal tooling)
- **Patterns**: Cross-platform path separators in regex excludes; backup/out
  dirs should always be skipped; parallel agents effective for 20+ items
- **Process**: Parallel agent execution (2 agents, 20 items) completed all fixes
  correctly; one test needed adjustment for writefile-missing-encoding behavior
  change

---

#### Review #392: PR #394 R9 (2026-02-26)

- **Source**: SonarCloud (4), CI (1 — SEC-004 false positive), Qodo Compliance
  (2), Qodo PR Suggestions (8)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 15 unique → 13 fixed, 2 rejected (stale)
- **Fixed**: (1) SEC-004 false positive — add eslint-plugin-sonash to exclude
  list; (2) CC 16→15 on `getCalleeName()` — extract `unwrapNode()` helper; (3)
  CC 22→15 on `no-unescaped-regexp-input` — extract `isEscapedInput()` and
  `isEscapeHelper()` helpers; (4) `hasRenameSyncNearby()` now validates rename
  is from .tmp file; (5) `no-unbounded-regex` also checks `RegExp()` call form;
  (6) `no-unsafe-innerhtml` catches computed `el['innerHTML']`; (7)
  `hasStringInterpolation` if-then-else → single return; (8)
  `no-unsafe-division` optional chain; (9) generate-views.js swallowed error →
  log error info; (10) `normalizeCategory()` trims input; (11)
  `hasInstanceofErrorCheck` recognizes Error subclass guards; (12)
  `ingestFromDeduped` derives maxId from in-memory masterItems; (13)
  generate-views.js JSONL log sanitized
- **Rejected**: (A) `hasStringInterpolation` "incomplete" — function was already
  complete (stale review); (B) "Fix escaping guidance" — regex in message was
  already correctly escaped
- **Patterns**: CC reduction via helper extraction; security scanner exclusion
  for rule files; optional chaining simplification

---

#### Review #391: PR #394 R8 (2026-02-26)

- **Source**: SonarCloud (1 — optional chain), Qodo Compliance (4), Qodo PR
  Suggestions (14), CI Pattern Compliance (blocking — pre-existing)
- **PR**: PR #394 — ESLint plugin + TDMS script robustness round
- **Items**: 17 unique → 13 fixed, 3 rejected, 1 pre-existing (CI)
- **Fixed**: (1) `no-unsafe-division` optional chain cleanup (SonarCloud); (2)
  `hasStringInterpolation()` no longer false-positives on `"a" + "b"` static
  concatenation; (3) `getCalleeName()` now handles computed members
  `obj["prop"]`; (4) `getCalleeName()` unwraps TS-ESTree wrapper nodes
  (TSNonNullExpression, TSAsExpression, etc.); (5) `no-non-atomic-write`
  `walkAstNodes` stops at function boundaries — nested function renameSync no
  longer falsely satisfies outer writeFileSync; (6) `no-empty-path-check` skips
  non-identifier receivers to avoid false positives on expressions; (7)
  `no-unescaped-regexp-input` allows `escapeRegExp()` helper calls; (8)
  `no-unsafe-innerhtml` allows `DOMPurify.sanitize()` on RHS; (9)
  `normalize-file-path.js` preserves UNC `//server/share` paths + re-strips
  leading slash after org prefix removal; (10) `normalize-category.js` coerces
  non-string input to String before `.toLowerCase()`; (11)
  `generate-content-hash.js` now uses shared `normalizeFilePath()` instead of
  inline regex; (12) `generate-views.js` ingest loop warns on invalid JSON lines
  instead of silently swallowing; (13) `generate-views.js` `appendNewItems`
  checks if MASTER_DEBT.jsonl ends with newline before appending to prevent
  JSONL line merge corruption
- **Rejected**: (a) Qodo Compliance "secure logging" — internal CLI, line slice
  is safe and aids debugging; (b) Qodo Compliance "path exposure" — internal
  CLI, filesystem paths are expected output; (c) Qodo Compliance "untrusted JSON
  ingestion" — internal TDMS tooling, schema validation already handled by
  `ensureDefaults()`
- **Key Learning**: (1) AST utility functions should handle both JS and TS node
  wrappers — TS-ESTree wraps nodes in TSNonNullExpression etc. which breaks bare
  type checks. Use a while-loop unwrapper. (2) `BinaryExpression` with `+`
  operator needs deeper inspection — two static string literals concatenated
  (`"a" + "b"`) is NOT interpolation, only dynamic values are. (3) JSONL append
  operations must check trailing newline — `appendFileSync` doesn't add a
  separator, so missing trailing newline in the master file corrupts the
  boundary.

---

#### Review #390: PR #394 R7 (2026-02-26)

- **Source**: SonarCloud (5 new — CC 17>15, 2 move-to-outer-scope, 2 optional
  chain), Qodo PR Suggestions (14 new on R6 code at e23481f)
- **PR**: PR #394 — ESLint plugin robustness round
- **Items**: 19 total → 9 fixed, 2 rejected, 8 deferred
- **Fixed**: (1) `walkAstNodes` CC 17→≤15 via `visitAstChild` extraction +
  WeakSet cycle safety; (2-3) `hasUnboundedDot`/`getStaticParts` moved to outer
  module scope (SonarCloud `javascript:S1530`); (4) `no-div-onclick-no-role`
  optional chain `attr.name?.type` (SonarCloud); (5) `no-unsafe-division`
  optional chain `test.right?.value` + full `object.property` key for
  MemberExpression guards — prevents `total.length > 0 ? x / arr.length : 0`
  false negative; (6) `walkAst` in `no-unsafe-error-access` stops at function
  boundaries — prevents nested function accesses matching outer catch; (7)
  `isMessageMember` uses `typeof prop?.value === "string"` for parser compat;
  (8) Updated divisor extraction to full `obj.prop` key; (9) Added
  `arr.length > 0` valid test case
- **Rejected**: (a) Skip safe literals in shell/sql injection —
  `hasStringInterpolation` already returns false for Literals/plain templates,
  change is no-op; (b) Correct regex escaping in normalize-file-path.js —
  `String.raw\`\\$&\`` and
  `"\\$&"` produce identical strings, suggestion is
  incorrect
- **Deferred**: 8 items (UNC paths, base ID on master, hash normalization, fail
  fast JSON, escaped-input FPs, shadowing FPs, compliance TOCTOU/atomic/logging)
- **Key Learning**: (1) Extracting a `visitAstChild` helper from `walkAstNodes`
  is the cleanest way to split CC without changing behavior — the outer loop and
  inner child-type dispatch go into separate functions. (2) AST walkers must
  stop at function boundaries (FunctionDeclaration/Expression/Arrow) to respect
  scope — `err.message` inside `() => { err.message }` is a different `err`. (3)
  For MemberExpression guard matching, use full `object.property` key (e.g.
  `arr.length`) not just the property name — prevents unrelated guards matching.

---

#### Review #389: PR #394 R6 (2026-02-26)

- **Source**: SonarCloud (1 new — CC 19>15 on containsCallTo), Qodo PR
  Suggestions (12 new on R5 code at ef1bf7e)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: 13 total → 11 fixed, 1 deferred, 1 N/A (no-non-atomic-write
  renameSync arg validation re-raise)
- **Fixed**: (1) `containsCallTo` CC reduction via `walkAstNodes` extraction
  (SonarCloud Critical); (2) `no-unbounded-regex` replaced regex lookbehind with
  manual string scan — fixes subtle bug on `\\.*` (even backslash count) and
  adds BinaryExpression concat detection; (3) `no-div-onclick-no-role` added
  `JSXIdentifier` type check — prevents crash on JSXNamespacedName; (4)
  `no-hallucinated-api` added ChainExpression unwrap for `crypto?.secureHash()`;
  (5) `no-index-key` `containsIndexIdentifier` extended with MemberExpression
  (`index.toString()`), ChainExpression, and callee support; (6)
  `no-unsafe-division` `isGuarded` now verifies guard variable matches divisor
  name — catches `total > 0 ? items / count : 0`; (7-8)
  `no-sql-injection`/`no-shell-injection` null guards on `arguments[0]`; (9)
  `generate-views.js` `.filter(Boolean)` on masterIds; (10)
  `findMessageAccesses` ChainExpression dedup via WeakSet — prevents double
  report on `err?.message`; (11) Added tests for err?.message, concat regex,
  mismatched guard
- **Deferred**: hasRenameSyncNearby arg validation — complex, re-raised from R5
- **Key Learning**: (1) ChainExpression unwrap in AST walkers causes double
  reports — the walker visits both ChainExpression and its inner
  MemberExpression. Use WeakSet to dedup. (2) Regex lookbehinds with backslash
  counting are subtly broken — `(?<!\\)` only checks one position, but `\\` (two
  backslashes) means the preceding `\` escapes the OTHER `\`, leaving the dot
  literal. Manual scan with backslash parity check is more correct.

---

#### Review #388: PR #394 R5 (2026-02-26)

- **Source**: Qodo PR Suggestions (~10 new on R4 code at 5176cdf), Qodo
  Compliance (repeat across 4 checkpoints), CI (393 blocking — same
  pre-existing), SonarCloud Quality Gate (11.6% duplication — same), Gemini (1
  stale comment)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~20 total → 5 fixed, 4 deferred, ~11 rejected/repeat
- **Fixed**: (1) `no-unescaped-regexp-input` extended to catch template literals
  with expressions and string concatenation — was only detecting
  Identifier/MemberExpression (Qodo importance 9/10); (2) `no-unbounded-regex`
  added negative lookbehind `(?<!\\)` to avoid false positives on escaped dots
  like `\.*` (importance 8/10); (3) `findMessageAccesses` in
  `no-unsafe-error-access` now unwraps ChainExpression for `err?.message` and
  handles computed `err["message"]` (importance 8/10); (4) `containsCallTo` in
  `no-non-atomic-write` replaced with generic AST walker — limited traversal
  missed renameSync in VariableDeclarations, ReturnStatements, finally blocks
  (importance 8/10); (5) `no-div-onclick-no-role` skips reporting when
  JSXSpreadAttribute present — `{...props}` could pass role (importance 7/10)
- **Deferred**: (1) hasRenameSyncNearby arg validation — complex, enhancement
  level; (2) read-jsonl.js throw instead of process.exit — callers need
  updating; (3) describe.sequential for RuleTester — no actual flakes observed;
  (4) normalizeFilePath in generate-content-hash.js — consistency only
- **Rejected**: All Qodo Compliance items — repeat-rejected from R1-R4; CI 393
  blockers — pre-existing; Quality Gate duplication — structural; Gemini
  hasRenameSyncNearby — stale (fixed in R3)
- **Key Learning**: The generic AST walker pattern (iterate Object.keys, skip
  "parent", recurse into nodes/arrays) is more robust than hand-enumerating
  statement types. Every new AST node type is automatically handled. Applied to
  containsCallTo — same pattern should be considered for future AST utilities.

---

#### Review #387: PR #394 R4 (2026-02-26)

- **Source**: Qodo PR Suggestions (8 new on R3 code), Qodo Compliance (repeat
  across 4 checkpoints), CI (393 blocking — same pre-existing), SonarCloud
  Quality Gate (11.7% duplication — same), Gemini (1 stale comment), ESLint
  (2390 warnings, 0 errors)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~20 total → 3 fixed, 5 deferred, ~12 rejected/repeat
- **Fixed**: (1) `hasStringInterpolation` made recursive — prevents injection
  rule bypass via nested `BinaryExpression` (Qodo importance 9/10); (2)
  `getCalleeName` handles `ChainExpression` for optional chaining
  (`fs?.readFileSync`) — prevents rule misses (importance 8/10); (3)
  `no-unbounded-regex` uses `q.value.cooked ?? q.value.raw` for accurate
  template literal analysis (importance 7/10)
- **Deferred**: (1) walkAst stopAtFunctionBoundary — enhancement, not a bug; (2)
  Recognize `!rel`/`rel.length === 0` in isEmptyStringCheck — enhancement; (3)
  Tie length guards to same array in no-math-max-spread — enhancement; (4)
  Cross-platform hash stabilization — Linux-only CI; (5) Windows absolute
  requires in no-unguarded-loadconfig — Linux-only CI
- **Rejected**: (1) All Qodo Compliance items — repeat-rejected from R1-R3
  (TOCTOU, silent parse, raw content, missing actor, sample secrets, weak
  validation); (2) CI 393 blockers — pre-existing, tracked in Phase 1; (3)
  Quality Gate duplication 11.7% — structural similarity in 25 rule files, not
  extractable; (4) Gemini hasRenameSyncNearby — stale, already fixed in R3
- **Key Learning**: Qodo batch rejection for R2+ rounds is effective — 12+ items
  repeat-rejected without re-investigation. Recursive `hasStringInterpolation`
  is a real correctness fix: `"SELECT " + (prefix + userInput)` was being
  missed.

---

#### Review #386: PR #394 R3 (2026-02-26)

- **Source**: SonarCloud (2 new + Quality Gate failure), Qodo PR Suggestions
  (~25 across R1-R3), Qodo Compliance (8 items, 5 repeat-rejected), Gemini (1
  comment), CI (393 blocking — all pre-existing)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~42 total → 8 fixed, ~10 deferred (overlap with Enhancement Plan),
  ~24 rejected/repeat
- **Fixed**: (1) walkAst CC 16→≤15 via `visitChild` extraction; (2)
  `no-empty-path-check.js` optional chain + same-variable receiver check (Plan
  Item 8); (3) `no-unbounded-regex.js` template literal join `""` not `"_"`; (4)
  `no-non-atomic-write.js` remove `/tmp/i` heuristic bypass; (5)
  `hasRenameSyncNearby` rewritten from range-based to parent traversal; (6)
  Remove `unlinkSync` as atomic write indicator; (7) Shared AST utilities
  extraction (`lib/ast-utils.js`) — `getCalleeName`, `getEnclosingScope`,
  `hasStringInterpolation` deduplicated across 8 rule files; (8) Updated tests
  for new `tmpPath` behavior
- **Deferred**: ~10 Qodo suggestions already tracked in Enhancement Plan (Items
  9-10, 14-18) or enhancement-level (computed property detection, scope
  analysis, JSX spread handling, Windows paths, custom error classes)
- **Rejected**: (1) Qodo "Fix rule file parse error" — FALSE POSITIVE (display
  truncation, not actual code issue); (2) 5 Qodo Compliance repeat-rejected
  (TOCTOU, silent parse, raw content — all addressed in R2); (3) CI 393 blockers
  — pre-existing, tracked in Phase 1 of fix plan; (4) ~10 low-value suggestions
  (library process.exit, binary write FP, timing attacks in tests)
- **Key Learning**: Shared utility extraction (`lib/ast-utils.js`) is the
  correct approach for reducing SonarCloud duplication across ESLint rule files.
  A single `getCalleeName` function replaces 5+ inline callee resolution blocks.
  Quality Gate duplication threshold (3%) requires proactive deduplication when
  adding multiple structurally similar files.

---

#### Review #385: PR #394 R2 (2026-02-26)

- **Source**: SonarCloud (7 new), Qodo PR Suggestions (~20), Qodo Compliance (5
  repeat), CI (393 blocking — all pre-existing)
- **PR**: PR #394 — Over-engineering resolution, ESLint AST migration
- **Items**: ~32 total → 8 fixed, 7 deferred (overlap with Enhancement Plan),
  ~17 rejected/skipped
- **Fixed**: (1) CC reduction: `containsCallTo` extracted `isCallToFunc` helper;
  (2) CC reduction: `walkAst` extracted `isAstNode` helper; (3) CC reduction:
  `ingestFromDeduped` extracted `appendNewItems` helper; (4) Optional chain in
  `no-non-atomic-write.js`; (5) Optional chain in `no-empty-path-check.js`; (6)
  Optional chain in `no-unsafe-error-access.js`; (7) `isInsideTryBlock`
  rewritten from range-based to parent-traversal (eliminates range dependency);
  (8) JSONL parse warnings with line numbers in `loadMasterItems`
- **Deferred to Enhancement Plan**: 7 items already tracked in
  `.claude/plans/ESLINT_ENHANCEMENT_SUGGESTIONS_PLAN.md` (empty check receiver,
  escaped regex dots, index key types, DOMPurify exemption, binary write FP,
  category trim, atomic write improvements)
- **Rejected**: 5 Compliance items repeat-rejected (same justification as R1),
  process.exit in library (CLI-only), shared path normalization (hash-breaking),
  Windows require paths (Linux-only CI), range:true in tests (eliminated by
  parent traversal fix), ~5 other low-value suggestions
- **Key Learning**: Parent-traversal (`prev === current.block`) is more robust
  than range-based checks for determining try-block containment. Range requires
  parser options and can fail silently.

---
