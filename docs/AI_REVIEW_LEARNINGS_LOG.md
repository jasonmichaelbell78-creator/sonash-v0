# AI Review Learnings Log

**Document Version:** 17.101 **Created:** 2026-01-02 **Last Updated:**
2026-03-14

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
| 1.39-1.0 | 2026-01-02 to 2026-01-03 | Reviews #1-40 (see [archive](./archive/REVIEWS_1-40.md))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

</details>

---

## 📊 Tiered Access Model

This log uses a tiered structure to optimize context consumption:

| Tier  | Content                                                                                                                                                                                                                                                                                                                                                                                    | When to Read                  | Size        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----------- |
| **1** | [claude.md](../CLAUDE.md)                                                                                                                                                                                                                                                                                                                                                                  | Always (in AI context)        | ~115 lines  |
| **2** | [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)                                                                                                                                                                                                                                                                                                                                          | When investigating violations | ~612 lines  |
| **3** | Active Reviews (below)                                                                                                                                                                                                                                                                                                                                                                     | Deep investigation            | ~2400 lines |
| **4** | Archive ([#1-40](./archive/REVIEWS_1-40.md), [#42-138](./archive/REVIEWS_42-138.md), [#139-195](./archive/REVIEWS_139-195.md), [#196-259](./archive/REVIEWS_196-259.md), [#260-299](./archive/REVIEWS_260-299.md), [#300-341](./archive/REVIEWS_300-341.md), [#342-383](./archive/REVIEWS_342-383.md), [#384-423](./archive/REVIEWS_384-423.md), [#424-457](./archive/REVIEWS_424-457.md)) | Historical research           | ~8000 lines |

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
| Active reviews | 20 (#441-#479) | 20        | Run `npm run reviews:archive -- --apply` |

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
  [docs/archive/REVIEWS_1-40.md](./archive/REVIEWS_1-40.md)
- **Status:** 40 reviews archived.

### Archive 2: Reviews #42-138

- **Archive location:**
  [docs/archive/REVIEWS_42-138.md](./archive/REVIEWS_42-138.md)
- **Status:** 40 reviews archived.

### Archive 3: Reviews #139-195

- **Archive location:**
  [docs/archive/REVIEWS_139-195.md](./archive/REVIEWS_139-195.md)
- **Status:** 40 reviews archived.

### Archive 4: Reviews #196-259

- **Archive location:**
  [docs/archive/REVIEWS_196-259.md](./archive/REVIEWS_196-259.md)
- **Status:** 40 reviews archived.

### Archive 5: Reviews #260-299

- **Archive location:**
  [docs/archive/REVIEWS_260-299.md](./archive/REVIEWS_260-299.md)
- **Status:** 40 reviews archived.

### Archive 6: Reviews #300-341

- **Archive location:**
  [docs/archive/REVIEWS_300-341.md](./archive/REVIEWS_300-341.md)
- **Status:** 40 reviews archived.

### Archive 7: Reviews #342-383

- **Archive location:**
  [docs/archive/REVIEWS_342-383.md](./archive/REVIEWS_342-383.md)
- **Status:** 40 reviews + 11 retrospectives archived.

### Archive 8: Reviews #384-423

- **Archive location:**
  [docs/archive/REVIEWS_384-423.md](./archive/REVIEWS_384-423.md)
- **Status:** 40 reviews + 9 retrospectives archived.

### Archive 9: Reviews #424-457

- **Archive location:**
  [docs/archive/REVIEWS_424-457.md](./archive/REVIEWS_424-457.md)
- **Status:** 20 reviews archived. Access archives only for historical
  investigation of specific patterns.

---

## Retrospectives

### Retro retro-367: PR #367 Retrospective (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Rounds:** 7 | **Total Items:** 193

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 100 | 24 | 6 |

**Learnings:**

- R1-R3 productive. R4-R7 were progressive hardening ping-pong.

---

### Retro retro-368: PR #368 Retrospective (2026-02-16)

**Date:** 2026-02-16 | **PR:** #368 | **Rounds:** 6 | **Total Items:** 65

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 50 | 15 | 0 |

**Process Improvements:**

- "Full chain" security fixes, not incremental
- Consistent rejection prevents churn
- Eliminate, don't explain

**Skills to Update:**

- FIX_TEMPLATES.md
- pr-review SKILL.md
- CODE_PATTERNS.md

**Learnings:**

- Create FIX_TEMPLATES.md Template #22 ("Secure Audit

---

### Retro retro-369: PR #369 Retrospective (2026-02-17)

**Date:** 2026-02-17 | **PR:** #369 | **Rounds:** 9 | **Total Items:** 119

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 78 | 41 | 0 |

**Process Improvements:**

- IMPLEMENT THE CC RULE
- Use FIX_TEMPLATES for new files
- Holistic security audit on first flag
- Suppress recurring rejections
- Complete pattern checker modifications in one pass

---

### Retro retro-370: PR #370 Retrospective (2026-02-17)

**Date:** 2026-02-17 | **PR:** #370 | **Rounds:** 5 | **Total Items:** 53

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 46 | 6 | 1 |

**Process Improvements:**

- Path normalization needs a test matrix
- CLI arg validation: always include catch-all else
- Store validated forms, not raw input
- Retro action items MUST be tracked in TDMS

---

### Retro retro-371: PR #371 Retrospective (2026-02-17)

**Date:** 2026-02-17 | **PR:** #371 | **Rounds:** 2 | **Total Items:** 45

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 38 | 7 | 0 |

**Process Improvements:**

- Post-extraction CC verification
- Upgrade CC rule to error
- Fix Qodo suppression

---

### Retro retro-374: PR #374 Retrospective (2026-02-18)

**Date:** 2026-02-18 | **PR:** #374 | **Rounds:** 5 | **Total Items:** 40

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 29 | 5 | 5 |

**Process Improvements:**

- Path containment decisions need upfront design
- Filesystem guard test matrix at implementation time
- Propagation check enforcement

---

### Retro retro-378: PR #378 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #378 | **Rounds:** 2 | **Total Items:** 17

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 9 | 7 | 1 |

**Process Improvements:**

- Suppress internal tooling security noise

**Skills to Update:**

- `.gemini/styleguide.md`
- `.qodo/pr-agent.toml`
- No new FIX_TEMPLATES needed

---

### Retro retro-379: PR #379 Retrospective (2026-02-20)

**Date:** 2026-02-20 | **PR:** #379 | **Rounds:** 11 | **Total Items:** 190

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 106 | 61 | 4 |

**Process Improvements:**

- Algorithm design before implementation
- Protocol compliance is non-negotiable
- Propagation enforcement still missing
- Test your own code against your own linter

---

### Retro retro-381: PR #381 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #381 | **Rounds:** 2 | **Total Items:** 15

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 11 | 4 | 0 |

**Process Improvements:**

- Enforce propagation grep on truthy filters

**Skills to Update:**

- No new templates needed
- Review data

---

### Retro retro-382: PR #382 Retrospective (2026-02-20)

**Date:** 2026-02-20 | **PR:** #382 | **Rounds:** 3 | **Total Items:** 76

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 61 | 13 | 0 |

**Process Improvements:**

- Complete severity/mapping audits
- Dedup algorithm boundaries
- Same-file regex DoS sweep

---

### Retro retro-383: PR #383 Retrospective (2026-02-21)

**Date:** 2026-02-21 | **PR:** #383 | **Rounds:** 8 | **Total Items:** 282

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 192 | 23 | 67 |

**Process Improvements:**

- Propagation is the #1 churn driver
- CC rule implementation paid off
- Large PRs amplify review cycles

**Skills to Update:**

- FIX_TEMPLATES.md
- pr-review SKILL.md Step 0.5
- check-pattern-compliance.js

---

### Retro retro-384: PR #384 Retrospective (2026-02-23)

**Date:** 2026-02-23 | **PR:** #384 | **Rounds:** 4 | **Total Items:** 197

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 171 | 9 | 8 |

**Process Improvements:**

- Run pattern checker before pushing review fixes
- CC re-check after extraction is not optional
- Propagation enforcement remains the top systemic issue

---

### Retro retro-386: PR #386 Retrospective (2026-02-23)

**Date:** 2026-02-23 | **PR:** #386 | **Rounds:** 2 | **Total Items:** 25

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 23 | 1 | 0 |

**Process Improvements:**

- S5852 requires recursive regex audit
- Pre-commit CC hook may not cover IIFE expressions
- Small PRs = fewer rounds

---

### Retro retro-389: PR #389 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #389 | **Rounds:** 2 | **Total Items:** 53

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 49 | 4 | 0 |

**Process Improvements:**

- Add security checklist to ecosystem audit checker template

**Skills to Update:**

- No new templates needed
- Ecosystem audit template

---

### Retro retro-390: PR #390 Retrospective (2026-02-25)

**Date:** 2026-02-25 | **PR:** #390 | **Rounds:** 0 | **Total Items:** 0

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 0 | 0 | 0 |

---

### Retro retro-391: PR #391 Retrospective (2026-02-25)

**Date:** 2026-02-25 | **PR:** #391 | **Rounds:** 3 | **Total Items:** 122

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 108 | 7 | 0 |

**Process Improvements:**

- Large PR scope remains the #1 systemic driver
- Propagation is the persistent #2 driver
- PR #390 shows small PRs work
- R1 review quality improving

---

### Retro retro-392: PR #392 Retrospective (2026-02-25)

**Date:** 2026-02-25 | **PR:** #392 | **Rounds:** 4 | **Total Items:** 54

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 35 | 12 | 4 |

**Process Improvements:**

- PR scope discipline paid off
- Propagation automation is production-validated
- Qodo batch rejection saves investigation time
- Cross-platform path normalization is now the #1 recurring pattern
- JSONL data quality inflates review metrics
- Zero avoidable rounds from unimplemented retro items

---

### Retro retro-393: PR #393 Retrospective (2026-02-26)

**Date:** 2026-02-26 | **PR:** #393 | **Rounds:** 2 | **Total Items:** 15

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 6 | 9 | 0 |

**Learnings:**

- Efficient 2-round cycle. ~0 rounds avoidable. First 2-round PR in

---

### Retro retro-394: PR #394 Retrospective (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Rounds:** 12 | **Total Items:** 321

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 153 | 112 | 35 |

**Learnings:**

- Inefficient but productive — 12 rounds, ~153 fixes, ~42% avoidable.

---

### Retro retro-395: PR #395 Retrospective (2026-02-27)

**Date:** 2026-02-27 | **PR:** #395 | **Rounds:** 2 | **Total Items:** 18

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 17 | 1 | 0 |

**Process Improvements:**

- Focused PR scope continues to pay off
- Propagation discipline held
- Multi-source convergence is high-signal
- TDMS data quality is the remaining systemic issue
- FIX_TEMPLATE #45 is production-validated

---

### Retro retro-396: PR #396 Retrospective (2026-02-27)

**Date:** 2026-02-27 | **PR:** #396 | **Rounds:** 2 | **Total Items:** 48

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 4 | 11 | 1 |

**Process Improvements:**

- safe-fs.js received substantive security fixes
- SonarCloud 0% FP rate
- Qodo Compliance FP rate remains high (50%)
- Test-production regex sync is a new pattern
- Unused import cleanup (11 files)

---

### Retro retro-397: PR #397 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #397 | **Rounds:** 7 | **Total Items:** 82

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 68 | 13 | 11 |

**Process Improvements:**

- BLOCKING: Implement CC pre-push check
- Regex sweep after any S5852 fix

**Skills to Update:**

- FIX_TEMPLATES
- Pre-push hook

---

### Retro retro-398: PR #398 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #398 | **Rounds:** 2 | **Total Items:** 29

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 23 | 5 | 1 |

**Process Improvements:**

- When adding escape/sanitization functions

---

### Retro retro-414: PR #414 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #414 | **Rounds:** 1 | **Total Items:** 8

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 8 | 0 | 0 |

**Process Improvements:**

- Auto-compute changelog metrics

---

### Retro retro-416: PR #416 Retrospective (2026-03-04)

**Date:** 2026-03-04 | **PR:** #416 | **Rounds:** 0 | **Total Items:** 0

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 0 | 0 | 0 |

---

### Retro retro-427: PR #427 Retrospective (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Rounds:** 5 | **Total Items:** 139

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 0 | 0 | 0 |

---

### Retro retro-428: PR #428 Retrospective (2026-03-12)

**Date:** 2026-03-12 | **PR:** #428 | **Rounds:** 1 | **Total Items:** 10

| Fixed | Rejected | Deferred |
|-------|----------|----------|
| 0 | 0 | 0 |



## Active Reviews

### Review 1: Phase 1 Documentation Templates (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 2 | 10 | 0 |

**Patterns:**

- self-compliance-failure
- status-synchronization-gap
- template-placeholder-ambiguity
- redundant-wording
- missing-cross-reference-validation
- metadata-inconsistency
- root-cause
- prevention

**Learnings:**

- Root cause: DOCUMENTATION_STANDARDS.md created without validating against
- Prevention: Added "Document follows its own standards" to Pre-Commit
- Root cause: Updated PLAN document but didn't sync SESSION_CONTEXT.md (62% →
- Prevention: Added Status Synchronization Protocol matrix to
- Root cause: Placeholders like `[Step 1]`, `[Brief description]` too generic
- Prevention: Added concrete examples and clarifying text to all templates
- Root cause: No static analysis run during creation

---

### Review 2: File Rename & Cross-Reference Updates (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 17 | 4 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- tool-specific-language-persistence
- incomplete-link-format-coverage
- missing-forward-reference-annotations
- template-contradictions
- broken-shell-commands-in-examples
- generic-examples-lacking-concrete-mappings
- root-cause
- prevention
- files

**Learnings:**

- CodeRabbit 🐰 + Qodo (first multi-tool review)
- Root cause: After renaming CODERABBIT_REVIEW_PROCESS.md →
- Prevention: When renaming files, grep for old terminology in
- Files: AI_HANDOFF.md:61, ROADMAP_LOG.md:21
- Root cause: Cross-Reference Validation protocol only listed inline links
- Prevention: Expanded protocol to cover all Markdown link formats
- Files: DOCUMENTATION_STANDARDS.md:558-570

---

### Review 3: Mandatory Learning Enforcement (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 2 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 2 | 0 |

**Patterns:**

- phase-assignment-inconsistency
- document-type-classification-ambiguity
- root-cause
- prevention
- files

**Learnings:**

- CodeRabbit 🐰 (review of learning system additions)
- Root cause: "Phase 1 or 4" placeholder left from template, not updated when
- Prevention: When documenting forward references, commit to single phase or
- Files: AI_REVIEW_PROCESS.md:448
- Root cause: Related Documents section mixes Markdown docs with
- Prevention: Could separate "Documentation" vs "Tools/Automation"
- Files: AI_REVIEW_PROCESS.md:418-422 (deferred - functional as-is)

---

### Review 4: Phase 1.5 Multi-AI Review System (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 46 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- process-overheadcomplexity-creep
- script-robustness-gaps
- documentation-accuracy-drift
- unused-code-artifacts
- root-cause
- example
- prevention
- examples
- -git-command-guards-check-commit-count-before-headn
- -command-availability-checks-command--v-before-using-tools
- -accurate-completion-messages-track-warningsfailures

**Learnings:**

- CodeRabbit 🐰 + Qodo (comprehensive review of governance
- Root cause: Layering governance procedures without considering cumulative
- Example: "1% chance" threshold creates decision fatigue; multiple mandatory
- Prevention: During reviews, explicitly analyze complexity/overhead impact.
- Resolution: Softened "1% chance" to "clearly applies" - maintains intent
- Root cause: Scripts written for happy-path only without edge case guards
- Examples: HEAD~10 fails on repos with <10 commits; timeout command not

---

### Review 5: CodeRabbit Round 2 - Minor Fixes (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 18 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- npm-install-robustness
- markdown-lint-violations
- misleading-variable-names
- overly-broad-pattern-matching
- root-cause
- example
- prevention

**Learnings:**

- Root cause: npm install can fail on peer dependency conflicts in sandboxed
- Example: Missing --legacy-peer-deps flag in session-start.sh
- Prevention: Always include --legacy-peer-deps in automated npm install
- Resolution: Added flag to both npm install commands in session-start.sh
- Root cause: Blank lines between consecutive blockquotes flagged by
- Example: Blockquotes in AI_WORKFLOW.md separated by blank lines
- Prevention: Use `>` continuation for consecutive blockquotes, or join into

---

### Review 6: CodeRabbit Round 3 - Process Gaps (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- -learning-capture-failure
- scope-creep-documentation-gap
- acceptance-criteria-inconsistency
- root-cause
- example
- prevention

**Learnings:**

- Root cause: Review #5 was processed but learning entry was NOT added before
- Example: Addressed 4 CodeRabbit suggestions, committed fix, but skipped
- Prevention: **MANDATORY ENFORCEMENT NEEDED** - see "Learning Capture
- Resolution: Adding Review #5 and #6 retroactively; implementing enforcement
- Root cause: Phase deliverables section not updated when additional work
- Example: Phase 1.5 deliverables list 5 items, but "What Was Accomplished"
- Prevention: When adding bonus deliverables, update both sections OR

---

### Review 7: CodeRabbit Round 4 - Off-by-One Bug (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- off-by-one-in-git-history-commands
- root-cause
- example
- prevention

**Learnings:**

- Root cause: HEAD~N requires N+1 commits in history; if COMMIT_COUNT=10,
- Example: `LOOKBACK=$((COMMIT_COUNT < 10 ? COMMIT_COUNT : 10))` allows
- Prevention: Always use `COMMIT_COUNT - 1` as upper bound for HEAD~N
- Resolution: Fixed LOOKBACK calculation to ensure LOOKBACK < COMMIT_COUNT
- Edge cases in git commands compound - the original guard for

---

### Review 8: CI Fix & Reference Corrections (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- missing-explicit-dependency
- section-reference-inaccuracy
- document-archival-conflict
- undocumented-advisory-content
- root-cause
- example
- prevention

**Learnings:**

- Root cause: eslint required as peer dependency but not installed explicitly
- Example: `npm ci` failed with "Missing: eslint@9.39.2 from lock file"
- Prevention: When adding packages that require eslint (e.g.,
- Resolution: Added eslint ^9.39.2 to devDependencies
- Root cause: Referenced section by abbreviated name instead of full title
- Example: "Enforcement Mechanism" instead of "Learning Capture Enforcement

---

### Review 9: CodeRabbit Round 6 - Documentation Clarity (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- conflicting-code-examples
- retrospective-context-ambiguity
- forward-looking-enforcement-vagueness
- ambiguous-version-history-phrasing
- root-cause
- example
- prevention

**Learnings:**

- Root cause: Review #4 pattern for HEAD~N guard was incorrect, Review #7
- Example: Two different LOOKBACK formulas in same document created confusion
- Prevention: When fixing bugs in documented patterns, annotate the original
- Resolution: Added correction note to Review #4 with corrected code inline
- Root cause: Review #6 read as contemporaneous discovery of Review #5's gap
- Example: "Adding Review #5 and #6 retroactively" wasn't clear about
- Prevention: Explicitly label retrospective analyses upfront

---

### Review 10: Session Hook Robustness & CI Fixes (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- npm-install-modifies-lockfile
- missing-transitive-dependencies
- lockfile-existence-not-checked
- emptycorrupted-lockfile-edge-case
- unsafe-variable-increment
- missing---legacy-peer-deps
- root-cause
- example
- prevention

**Learnings:**

- ROOT CAUSE of repeated CI
- Root cause: Session hook used `npm install` which modifies
- Example: Every session start created lockfile drift, breaking CI's `npm ci`
- Prevention: Always use `npm ci` in automated scripts; never `npm install`
- Resolution: Changed session-start.sh to use `npm ci`
- Root cause: External deployment check expected jest, not in package.json

---

### Review 11: Lockfile Sync & Workflow Configuration (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- lockfile-structural-inconsistencies
- feature-branches-in-workflow-triggers
- missing-firebase-environment-variables
- npm-cache-keyed-on-wrong-lockfile
- secrets-validation-missing
- root-cause
- example
- prevention

**Learnings:**

- Root cause: Lockfile generated with duplicated/invalid entries that npm ci
- Example: CI failed with "Missing jest@30.2.0" but package-lock.json HAD
- Prevention: After ANY lockfile changes, verify with
- Resolution: Complete regeneration (`rm package-lock.json && npm install`)
- Root cause: Adding feature branch to deploy-firebase.yml for testing
- Example: `claude/review-repo-docs-D4nYF` in triggers is temporary

---

### Review 12: The Jest Incident - Understanding WHY Before Fixing (2026-01-01)

**Date:** 2026-01-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- -fixing-without-understanding-critical---anti-pattern
- npm-ci-vs-npm-install-vs-cloud-build
- peer-dependencies-are-real-dependencies
- cascade-effect-of-wrong-fixes
- root-cause
- example
- prevention
- does-this-project-actually-use-x
- what-is-the-real-root-cause
- is-this-symptom-or-cause
- details
- npm-ci---legacy-peer-deps
- npm-ci-plain
- npm-install
- timeline
- added-jest-lockfile-bloated
- lockfile-sync-issues-more-regeneration-attempts
- multiple-commits-user-frustration-wasted-time

**Learnings:**

- CI failures across multiple commits **Tools:** Qodo + CI +
- A cascade of CI failures over multiple hours, caused by
- Root cause: Saw "jest" in error message → assumed project needed jest →
- Example: "an external CI check expects jest" - but this was WRONG
- Prevention: **ALWAYS ask "WHY?" before making changes:**
- Resolution: Removed jest from root package.json; fixed actual issue (peer
- Root cause: Different npm commands have different peer dependency behavior

---

### Review 13: Phase 2 Automation Scripts (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- -command-injection-vulnerability
- -arbitrary-file-deletion
- -exit-code-capture-bug
- filename-with-spaces-breaks-loop
- missing-workflow-permissions
- unused-parameters-not-cleaned
- dry-violation---duplicated-helpers
- double-script-execution
- brittle-output-parsing
- regex-with-global-flag-in-loop
- root-cause
- example
- prevention
- examples
- files

**Learnings:**

- CodeRabbit 🐰 + Qodo + GitHub Actions CI
- Root cause: Shell command interpolation without sanitization
- Example: `git rev-list --count --since="${sinceDate}" HEAD` in
- Prevention: Sanitize all external inputs before shell interpolation; use
- Resolution: Add input validation for date strings (regex match ISO format

---

### Review 14: CodeRabbit/Qodo Fix Implementation (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- exit-code-capture
- file-iteration
- regex-with-test-in-loops
- input-validation-patterns
- unused-variables
- the-latter-captures-assignment-exit-code-always-0-not-comman
- spaces-in-filenames-break-word-splitting-in-for-loops
- global-flag-makes-lastindex-stateful-causing-missed-matches
- dates
- paths

**Learnings:**

- Implementation session following Review #13 findings **Scope:** All
- DRY violation: Extract `safeReadFile`/`safeWriteFile` to
- ESLint JSON output parsing (requires jq dependency)
- Cross-platform path normalization for Windows compatibility
- The latter captures assignment exit code (always 0), not command exit code
- `while IFS= read -r file` NOT `for file in $list`
- Spaces in filenames break word-splitting in for loops

---

### Review 15: CI Workflow and Documentation Fixes (2026-01-02)

**Date:** 2026-01-02 | **Source:** ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- subshell-variable-scope
- yaml-template-literal-safety
- github-actions-bot-detection
- documentation-compliance
- wrong
- right

**Learnings:**

- CI failure feedback + continuation of Review #14 fixes **Scope:**
- Variables set in `while` loop fed by pipe (`|`)
- Template literals with `${}` at line start
- Wrong: Template literal spanning multiple lines in YAML
- Right: `['line1', 'line2', variable].join('\n')`
- Wrong: `c.user.type === 'Bot'` (GitHub Actions may not set this)
- Right: `c.user.login === 'github-actions[bot]'`

---

### Review 16: Security Hardening and Robustness (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- markdown-injection-prevention
- safe-github-actions-interpolation
- filename-safe-file-lists
- exit-code-over-output-parsing
- escape-triple-backticks
- escape-github-actions-syntax
- wrong
- right
- add-separator
- update-parsing-to-use-same-separator

**Learnings:**

- CodeRabbit/Qodo continued feedback on Review #15 commit **Scope:**
- Always sanitize user/tool output before
- Escape triple backticks: `sed 's/\`\`\`/\\\\`\\\\`\\\\`/g'`
- Escape GitHub Actions syntax: `sed 's/\${{/\\${{/g'`
- Never use `${{ }}` in JavaScript
- Wrong: `const x = \`${{ steps.foo.outputs.bar }}\`;`
- Right: Use `env:` block and `process.env.VAR`

---

### Review 17: Remaining Qodo/CodeRabbit Fixes (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cross-platform-path-handling
- safe-error-handling-for-non-error-throws
- yaml-expression-parsing-gotcha
- markdown-link-portability
- husky-ci-compatibility
- stderr-corrupts-json-parsing
- wrong
- right

**Learnings:**

- Full Qodo compliance feedback + CodeRabbit suggestions from Review
- Cross-platform compatibility, robustness, workflow YAML fixes
- Use `path.relative()` instead of string
- Wrong: `resolvedPath.startsWith(resolvedRoot)` (fails on Windows
- Right: `path.relative(root, path).startsWith('..')` (works everywhere)
- JavaScript allows throwing any
- Wrong: `error.message` (crashes if non-Error thrown)

---

### Review 18: Security Hardening and Temp File Cleanup (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- windows-cross-drive-security
- accurate-path-traversal-detection
- shell-temp-file-cleanup
- exit-code-differentiation
- retry-loops-for-race-conditions
- secure-error-handling
- secure-logging-practices
- check
- wrong
- right
- works-even-if-script-exits-early-due-to-error
- 0-successno-action-needed
- 1-action-recommended-not-an-error
- 2-actual-error
- check-exit-code-explicitly-not-just-if-command-failed

**Learnings:**

- Qodo compliance feedback + CodeRabbit PR suggestions **Scope:**
- Check: Compare drive letters before using relative path check
- Simple `startsWith('..')` has false
- Wrong: `rel.startsWith('..')` matches filenames like `..hidden.md`
- Right: `/^\.\.(?:[\\/]|$)/.test(rel)` ensures it's actually traversing up
- Always use trap for guaranteed cleanup
- Pattern: `TMPFILE=$(mktemp); trap 'rm -f "$TMPFILE"' EXIT`

---

### Review 19: Follow-up Refinements (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- retry-loop-failure-tracking
- block-dangerous-paths-early
- guarantee-valid-json-output
- proper-nouns-in-documentation
- wrong
- right
- block-absolute-unix-paths
- block-absolute-windows-paths
- block-unc-paths
- markdown-not-markdown-language-name-is-a-proper-noun
- javascript-not-javascript-github-not-github-etc

**Learnings:**

- CodeRabbit and Qodo follow-up suggestions after Review #18 fixes.
- Don't assume loop exit means success
- Wrong: `for i in 1 2 3; do cmd && break; sleep 5; done`
- Right: Track `SUCCESS=false`, set `SUCCESS=true` on success, fail if still
- Check user input before path resolution
- Block absolute Unix paths: `filePath.startsWith('/')`
- Block absolute Windows paths: `/^[A-Za-z]:/.test(filePath)`

---

### Review 20: Security Error Handling & Cross-Platform Fixes (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- recurring-issues-must-be-fixed-not-noted
- error-sanitization-pattern
- extensionless-file-detection-by-shebang
- unique-delimiter-for-githuboutput
- preserve-stderr-for-debugging-while-checking-exit-code

**Learnings:**

- FINALLY addressing the recurring Qodo compliance findings for
- Reusable error sanitization utility that:
- Strips sensitive patterns (home directories, credentials, connection
- Works with Error objects, strings, and unknown throws
- Provides `sanitizeError()`, `sanitizeErrorForJson()`, `createSafeLogger()`,
- Qodo compliance findings for
- Pattern #1 (error sanitization) - This is now a

---

### Review 21: Robust Error Handling & Centralized Sanitization (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- incomplete-sanitization-patterns
- code-duplication
- silent-error-swallowing
- ip-regex-bug
- centralized-utilities-must-be-used-not-just-created
- aborterror-handling-for-web-share-api
- path-traversal-prevention
- robust-file-reading
- github-actions-expression-defaults
- creating-sanitize-errorjs-was-not-enough
- typescript-files-continued-using-incomplete-inline-regex

**Learnings:**

- Follow-up to Review #20 addressing recurring compliance findings
- Why Error Handling Issues Kept Getting Flagged:**
- TypeScript re-export wrapper providing
- Creating `sanitize-error.js` was not enough
- TypeScript files continued using incomplete inline regex
- Fix: Import shared utility in ALL files, create TS wrapper for type safety
- Pattern #1 (centralized utilities) - reinforced

---

### Review 22: Phase 3 CodeRabbit Reviews (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- documentation-must-match-codebase-state
- sequential-numbering-must-be-verified
- link-references-must-be-consistent
- warning-terminology-should-be-meaningful
- ai-instructions-should-be-document-specific
- when-copyingediting-sections-check-for-duplicate-numbers
- easy-to-miss
- if-a-file-is-archived-all-references-should-use-the-archived
- dont-mix-plain-text-references-with-markdown-links
- reserve-blocker-for-actual-blockers
- use-note-for-informational-notices
- use-critical-sparingly-for-actual-critical-items

**Learnings:**

- CodeRabbit automated reviews during Phase 3 documentation
- When copying/editing sections, check for duplicate numbers
- Easy to miss: "Layer 5" appearing twice in security layers
- If a file is archived, ALL references should use the archived path
- Don't mix plain text references with markdown links
- Reserve "⚠️ BLOCKER" for actual blockers
- Use "📌 NOTE" for informational notices

---

### Review 23: Link Text Consistency (2026-01-02)

**Date:** 2026-01-02 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- CodeRabbit review of TRIGGERS.md addition and prior Phase 3
- Link display text should show clean filename; actual path goes in the
- Consistency in documentation formatting matters even for small

---

### Review 24: Pattern Automation Script Security (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- secure-logging-for-code-analysis-tools
- existssync-before-readfilesync
- fallback-regex-wildcards
- content-based-hashing-for-stable-ids
- root-cause
- example
- prevention

**Learnings:**

- Qodo PR Compliance Review of `suggest-pattern-automation.js` **PR:**
- Qodo Compliance Checker
- Root cause: Script logged extracted code snippets directly, potentially
- Example: `console.log(\`Code: ${code.slice(0, 60)}\`)` - could log API keys
- Prevention: Always sanitize before logging extracted code: redact long
- Resolution: Added `sanitizeCodeForLogging()` with secret/path redaction
- Root cause: `readFileSync()` without existence check crashes with unhelpful

---

### Review 25: Pattern Automation Script Robustness (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- path-disclosure-prevention
- regex-key-matching
- review-metadata-preservation
- original-flag-preservation
- parse-failure-abort
- basename-for-error-messages
- regex-keys-vs-literal-keys
- capture-groups-for-metadata
- preserve-original-semantics
- fail-fast-on-parse-errors
- root-cause
- prevention
- example

**Learnings:**

- Qodo/CodeRabbit Second Review of `suggest-pattern-automation.js`
- Qodo Compliance Checker, CodeRabbit
- Wrong: `console.error(\`File not found: ${LEARNINGS_FILE}\`)`
- Right: `const LEARNINGS_FILENAME = basename(LEARNINGS_FILE);` then use
- Why: Full paths can expose filesystem structure, usernames, deployment
- Wrong: `if (code.toLowerCase().includes(key.toLowerCase()))`
- Right: `const keyRegex = new RegExp(key, 'i'); if (keyRegex.test(code))`

---

### Review 26: Pattern Automation Script - Third Round (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- sanitize-pattern-output
- improved-path-redaction
- original-flag-preservation
- lazy-quantifiers-in-retry-loop-pattern
- derived-data-needs-same-sanitization
- path-regex-completeness
- nullish-coalescing-for-semantic-defaults
- lazy-quantifiers-for-bounded-patterns
- root-cause
- prevention
- example

**Learnings:**

- Qodo/CodeRabbit Third Review of `suggest-pattern-automation.js`
- Qodo Compliance Checker, CodeRabbit
- Wrong: `suggested.pattern.slice(0, 50)` - truncates but doesn't sanitize
- Right: `sanitizeCodeForLogging(suggested.pattern, 50)` - sanitizes AND
- Why: Patterns are derived from code and may contain embedded secrets
- Wrong: `/\/[A-Za-z]\/[^/\s]+\/[^/\s]+/g` - only matches `/A/path/segments`
- Right: Unix: `/(?:^|[\s"'\`(])\/(?:[^/\s]+\/){2,}[^/\s]+/g`

---

### Review 27: Pattern Automation Script - Fourth Round (2026-01-02)

**Date:** 2026-01-02 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- sanitize-originalcode-before-persistence
- capture-groups-for-path-redaction
- multiline-regex-lookahead
- regex-flags-sanitization
- stateful-global-regex-with-test
- restrictive-file-permissions
- artifact-vs-console-sanitization
- capture-groups-for-replacements
- global-flag-with-test
- multiline-lookahead
- flag-validation-for-dynamic-regexp
- root-cause
- prevention
- example

**Learnings:**

- Qodo/CodeRabbit Fourth Review of `suggest-pattern-automation.js`
- Qodo Compliance Checker, CodeRabbit
- Wrong: `originalCode: code` - raw code written to JSON file
- Right: `originalCode: sanitizeCodeForLogging(code, 120)`
- Why: Artifacts (JSON files) persist beyond the session and can leak secrets
- Wrong: `.replace(/pattern/g, (m) => m[0] + 'replacement')` - callback
- Right: `.replace(/(prefix)(path)/g, '$1/[REDACTED]')` - capture groups

---

### Review 28: Documentation & Process Planning Improvements (2026-01-03)

**Date:** 2026-01-03 | **Source:** coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 44 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- document-consistency-for-severity-levels
- avoid-brittle-line-number-references
- explicit-security-item-tracking
- avoid-planning-document-fragmentation
- verify-counts-when-referencing-external-docs
- root-cause
- prevention

**Learnings:**

- CodeRabbit PR Review + technical-writer Agent Review **PR:**
- CodeRabbit, technical-writer agent
- Created INTEGRATED_IMPROVEMENT_PLAN.md to consolidate fragmented
- Root cause: claude.md and AI_WORKFLOW.md used different MUST/SHOULD for
- Prevention: When creating parallel checklists in multiple docs, ensure
- Resolution: SHOULD for quality-improvement tools (technical-writer,

---

### Review 29: Documentation Consistency & Verification Refinements (2026-01-03)

**Date:** 2026-01-03 | **Source:** coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- make-acceptance-criteria-objectively-verifiable
- clarify-trigger-ordering-when-multiple-apply
- specify-workflow-ordering-in-multi-step-triggers
- keep-cross-document-references-current
- root-cause
- prevention

**Learnings:**

- CodeRabbit Third Round Review **PR:** `claude/session-start-h9O9F`
- Follow-up review after addressing second round feedback. Focus on
- Root cause: "Broken links fixed" is subjective; no verification step
- Prevention: Always include verification command in acceptance criteria
- Pattern: "- [ ] X completed (validated by `npm run Y`)"
- Root cause: Both systematic-debugging and debugger could apply to complex
- Prevention: When triggers can overlap, specify ordering explicitly

---

### Review 30: Claude Hooks PR Compliance & Security (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- move-complex-hook-logic-to-scripts
- prioritize-security-over-general-patterns
- validate-and-sanitize-hook-arguments
- never-expose-config-secrets-in-hook-output
- order-file-type-detection-by-specificity
- use-case-insensitive-matching-for-security-keywords
- cover-all-related-tools-in-hooks
- root-cause
- prevention
- benefit
- example
- check-for-empty-input
- sanitize
- truncate
- wrong
- applies-to

**Learnings:**

- Qodo Code Review + CodeRabbit **PR:**
- PR adding PostToolUse and UserPromptSubmit hooks to
- Root cause: Inline prompts with 400+ char decision trees are unmaintainable
- Prevention: Create dedicated `.claude/hooks/*.sh` scripts
- Benefit: Scripts are testable, maintainable, and can use proper control

---

### Review 31: CodeRabbit CLI Hook Improvements (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- iterate-over-all-arguments-in-hooks
- unquoted-arguments-for-multi-value
- timeout-external-commands
- bash-parameter-expansion-over-external-commands
- root-cause
- prevention
- wrong
- right
- applies-to
- trade-off
- note

**Learnings:**

- Qodo + CodeRabbit PR (combined) **PR:**
- First review of the new CodeRabbit CLI integration hook.
- Root cause: Only `$1` was processed, ignoring rest of `$@`
- Prevention: Use `for FILE in "$@"; do ... done` loop
- Wrong: `FILE="${1:-}"`
- Right: `for FILE in "$@"; do ... done`

---

### Review 32: CodeRabbit CLI Robustness (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- capture-exit-status-dont-swallow-errors
- use-set--f-to-prevent-glob-expansion
- portable-bash-version-compatibility
- bound-hook-runtime-with-file-limits
- keep-protocol-output-clean-stdout-vs-stderr
- root-cause
- prevention
- wrong
- right
- note
- trade-off
- principle

**Learnings:**

- Qodo + CodeRabbit PR **PR:**
- Second round of feedback on CodeRabbit CLI integration addressing
- Root cause: `|| true` hides whether command failed
- Prevention: Use `|| STATUS=$?` and check status explicitly
- Wrong: `OUTPUT=$(cmd) || true`
- Right: `OUTPUT=$(cmd) || STATUS=$?; if [[ $STATUS -eq 124 ]]; then ...`

---

### Review 33: Qodo PR Compliance + Script Security & Documentation Fixes (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- path-traversal-prevention-with-containment-check
- distinguish-enoent-from-other-errors
- always-close-readline-interface
- fail-ci-fast-on-missing-required-config
- cross-platform-exec-with-stdio-options
- root-cause
- prevention
- wrong
- right
- note
- principle

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #12 (code
- Comprehensive code review addressing security vulnerabilities,
- Root cause: User-controlled paths used with `fs.statSync`/`fs.readFileSync`
- Prevention: Resolve path with `path.resolve()`, then verify it stays within
- Wrong: `fs.readFileSync(path.join(projectRoot, userPath))`
- Note: Also check edge case where resolved path equals projectRoot exactly

---

### Review 34: Qodo PR Compliance Follow-up - Security Hardening & Documentation (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- use-pathrelative-for-containment-checks
- validate-cli-arguments-at-entry-point
- redact-secrets-from-historical-docs
- include-all-working-tree-changes-in-detection
- preserve-multi-group-regex-matches
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #12
- Second round of feedback following Review #33, addressing remaining
- Root cause: String-based `startsWith()` can be bypassed on different OS
- Prevention: Use `path.relative()` - if result starts with `..` or is
- Note: `rel === ''` means path equals root exactly (may or may not be
- Root cause: User-supplied paths passed directly to filesystem operations

---

### Review 35: Qodo PR Compliance + CodeRabbit Documentation & Script Fixes (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 20 | 2025 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- ciauto-mode-should-be-stricter
- validate-cli-arguments-defensively
- handle-git-rename-format
- prevent-double-archive-lookup
- keep-adr-links-relative-to-doc-location
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #13 **Tools:**
- Third round of feedback addressing remaining script robustness,
- Root cause: Interactive-friendly limits (20 items) silently skip checks in
- Prevention: In --auto mode, check everything; limits are for human
- Pattern: `isAutoMode ? allItems : allItems.slice(0, MAX)` not
- Note: CI failures should be explicit, not silent truncation
- Root cause: `args[index + 1]` can be undefined, empty, or another flag

---

### Review 36: Qodo PR Compliance + CodeRabbit Script & Documentation Fixes (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- wrap-all-file-operations-in-trycatch
- sanitize-error-output-for-ci-logs
- directories-are-valid-deliverables
- dont-suppress-script-errors
- deduplicate-user-input
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #14 **Tools:**
- Fourth round of feedback addressing error handling robustness,
- Root cause: fs.existsSync followed by fs.readFileSync without try/catch
- Prevention: Always wrap filesystem operations that can fail with
- Note: existsSync doesn't guarantee readFileSync success (race conditions,
- Root cause: main().catch exposing full error messages and stack traces
- Prevention: Redact home directories and omit stack traces in production/CI

---

### Review 37: Qodo PR Compliance + CodeRabbit Script Security & Documentation (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- use-splitn0-for-error-first-line
- wrap-all-planconfig-file-reads
- use-relative-paths-in-logs
- normalize-quotedprefixed-paths
- never-recommend-committing-env-files
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #15 **Tools:**
- Fifth round of feedback addressing plan file error handling, stack
- Root cause: String(err) can include multi-line stack traces with file paths
- Prevention: Extract first line before sanitizing paths
- Note: Stack traces often contain full paths that reveal environment details
- Root cause: fs.readFileSync can fail with permission/encoding errors
- Prevention: Try/catch with structured failure response for CI mode

---

### Review 38: CodeRabbit Security Hardening + Regex Accuracy (2026-01-03)

**Date:** 2026-01-03 | **Source:** coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- reject-path-traversal-before-processing
- strip-control-characters-from-errors
- consistent-return-shapes-for-audit-results
- match-actual-heading-levels-in-regex
- root-cause
- prevention
- note

**Learnings:**

- CodeRabbit **PR:** Session #16 **Tools:** CodeRabbit
- Sixth round of feedback addressing path traversal vulnerabilities,
- Root cause: Paths from documents could contain `..` to escape intended
- Prevention: Filter out paths containing `..` segments before any file
- Pattern: `.filter(d => !d.path.split('/').includes('..'))`
- Note: Check after normalization but before file existence checks
- Root cause: Error messages could contain ANSI escape codes for terminal

---

### Review 39: Qodo Script Robustness + Terminal Sanitization (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- explicit-requests-should-fail-explicitly
- cross-platform-path-security
- preserve-safe-whitespace-in-sanitization
- sanitize-file-derived-terminal-output
- regex-must-match-actual-content-structure
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide **PR:** Session #17 **Tools:** Qodo
- Seventh round of feedback addressing explicit plan failure
- Root cause: --plan flag accepts path but missing file silently passes in
- Prevention: Track `planWasProvided` flag, fail even in interactive if
- Note: Silent success on explicit request violates principle of least
- Root cause: Path traversal check split on `/` but Windows uses `\`
- Prevention: Normalize path separators before security checks

---

### Review 40: Qodo Archive Security + Cross-Platform Robustness (2026-01-03)

**Date:** 2026-01-03 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- archive-paths-need-containment-checks
- invalid-files-are-worse-than-missing-files
- windows-crlf-requires-explicit-handling
- empty-path-after-resolution-must-be-rejected
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide **PR:** Session #18 **Tools:** Qodo
- Eighth round of feedback addressing archive path traversal, invalid
- Root cause: Archive fallback lookup joined untrusted path with archive root
- Prevention: Verify resolved path is within archive root before fs
- Pattern: `path.relative(archiveRoot, resolved)` must not start with `..`
- Note: Same pattern as projectRoot checks; apply to all secondary roots
- Root cause: Required file exists but is empty/invalid, yet check passes

---

### Review 42: Qodo/CodeRabbit Hook Hardening Round 2 (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- block-cli-option-like-paths
- use-specific-traversal-patterns
- portable-path-resolution
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #19
- Follow-up review with additional security hardening for
- Root cause: Path starting with `-` could be interpreted as CLI option
- Prevention: Reject paths matching `-*` before further processing
- Pattern: `case "$path" in -*) exit 0 ;; esac`
- Note: Also block newlines to prevent multi-line spoofing

---

### Review 43: Qodo/CodeRabbit Additional Hardening (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- grep--e-for-alternation
- block-post-normalization-absolute-paths
- alternative-rejected
- integratedimprovementplanmd
- adr-folder-structure
- adr-001
- preserve-investment-adjust-course
- validate-before-acting-on-stale-plans
- single-source-of-truth-for-improvement-work
- explicit-what-we-decided-not-to-do
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #19
- Third round of hardening for pattern-check.sh and
- Root cause: Basic grep treats `\|` literally, not as alternation
- Prevention: Always use `grep -E` for alternation patterns
- Pattern: `grep -E "a|b|c"` not `grep "a\|b\|c"`
- Note: This was silently failing, outputting nothing

---

### Review 44: Hook Refinements & Output Limiting (unknown)

**Date:** unknown | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- self-monitoring-for-pattern-checkers
- windows-path-pattern-precision
- output-limiting-for-terminal-safety
- root-cause
- prevention

**Learnings:**

- Qodo PR Compliance Guide **PR:** Session #19
- Fourth round of refinements for pattern-check.sh and
- Root cause: Scripts that enforce patterns should be checked themselves
- Prevention: Add enforcement scripts to their own scan list
- Pattern: Include `pattern-check.sh` in default files for
- Root cause: `[A-Za-z]:*` matches valid POSIX files containing colons (e.g.,
- Prevention: Check for `[A-Za-z]:/*` to require the slash after drive letter

---

### Review 45: Comprehensive Security & Compliance Hardening (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- toctou-prevention
- safe-error-property-access
- block-list-vs-allow-list-conflicts
- space-to-newline-for-grep-anchors
- event-specific-actions-in-ci
- defensive-error-handler-wrappers
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #23 (continued
- Comprehensive multi-pass review of all scripts for security and
- Root cause: Using original path for existsSync after security check allows
- Prevention: Resolve path once at validation, use resolved path for all
- Note: Attacker could swap file between security check and read
- Root cause: Catch blocks assume `error.message` exists, but throws can be

---

### Review 46: Advanced Security Hardening & Script Robustness (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- symlink-escape-prevention-with-realpathsync
- maxbuffer-for-execsync
- ansi-escape-sequence-stripping
- jq-array-counting-pattern
- awk-vs-sed-for-multi-section-extraction
- argument-parsing-with-values
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #23
- Second round of fixes from PR Compliance Guide, addressing symlink
- Root cause: resolve() creates canonical path, but file could be symlink
- Prevention: After resolve(), use realpathSync() and verify relative path
- Note: Falls back to resolved path when file doesn't exist yet
- Root cause: Default maxBuffer is 1MB, large outputs cause ENOBUFS error

---

### Review 47: PII Protection & Workflow Robustness (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- pii-masking-for-logs
- sensitive-directory-detection
- printf-vs-echo-in-shell-scripts
- fault-tolerant-api-calls-in-workflows
- drive-agnostic-windows-path-sanitization
- relative-path-navigation-in-docs
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #23
- Third round of compliance fixes addressing PII logging, sensitive
- Root cause: Console.log/error directly output user email addresses
- Prevention: Create maskEmail() helper that preserves structure but hides
- Pattern: `u***@e***.com` format - shows first char of local/domain, masks
- Note: Even in error cases, mask the email before logging

---

### Review 48: Security Hardening & Documentation Fixes (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- explicit-filename-blocklists
- fail-closed-security-for-realpath
- osc-escape-sequence-stripping
- edge-case-handling-in-string-functions
- string-vs-number-comparison-in-yaml
- git-pathspec-separator
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #23
- Fourth round of compliance fixes addressing secret exfiltration
- Root cause: Regex patterns with wildcards can miss common exact filenames
- Prevention: Add explicit exact-match patterns for known sensitive files
- Pattern: `/^firebase-service-account\.json$/i` alongside
- Note: Defense-in-depth - both pattern-based and exact-match protection

---

### Review 49: Workflow Hardening & Code Cleanup (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- critical-file-pattern-coverage
- path-boundary-anchoring-in-regex
- robust-main-module-detection
- log-file-reading-direction
- relative-path-context-in-docs
- dead-code-from-security-hardening
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #23
- Fifth round of compliance fixes addressing workflow tier detection
- Root cause: Tier 4 patterns missing next.config.js/mjs which is a critical
- Prevention: When defining tier patterns, cross-reference with documented
- Pattern: `next\.config\.(js|mjs)$` - covers both CommonJS and ESM configs
- Note: Temporary workflow patterns should match the authoritative script

---

### Review 50: Audit Trails & Comprehensive Hardening (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- structured-audit-logging
- label-auto-creation-in-workflows
- multi-segment-env-pattern
- explicit-flag-validation
- uid-masking-for-logs
- biome-ignore-for-security-regexes
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #23
- Sixth round of compliance fixes addressing audit trail
- Root cause: Admin actions logged only human-readable messages without
- Prevention: Emit JSON audit entries with timestamp, operator, action,
- Note: Mask all identifiers (email, uid) in audit entries too
- Root cause: addLabels fails if label doesn't exist in fresh repos/forks

---

### Review 51: ESLint Audit Follow-up & Pattern Checker Fixes (2026-01-04)

**Date:** 2026-01-04 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 5 | 0 |

**Patterns:**

- global-flag-required-for-exec-loops
- regex-scope-limits-miss-multi-line-catch-blocks
- crlf-cross-platform-regex
- path-boundary-anchoring-in-exclusions
- redundant-regex-alternatives
- command-output-caching-in-hooks
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance + CodeRabbit **PR:** Session #23 (ESLint audit
- Follow-up review of ESLint warning audit commit (71a4390) and
- AST-based linting migration (architectural suggestion for future)
- Root cause: Pattern without `/g` flag used in `while (exec())` loop never
- Prevention: Every pattern used with exec() must have `/g` flag
- Pattern: Always add `/g` when pattern will be used in a loop

---

### Review 52: Document Health & Archival Fixes (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 2 |

**Patterns:**

- path-boundary-anchoring
- document-archival-standards
- portable-shell-commands-in-templates
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance + CodeRabbit **PR:** Session after tiered
- Review of tiered access model implementation and planning doc
- None new (AST-based linting already deferred from #51)
- Root cause: pathExclude patterns without anchors match substrings
- Prevention: Always use `(?:^|[\\/])` for path-based exclusions
- Note: Same pattern from #51 applied to validate-phase-completion.js

---

### Review 53: CI Fix & Security Pattern Corrections (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+ci+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 4 | 1 |

**Patterns:**

- pathrelative-security-misconception
- regex-scope-in-pattern-checkers
- ci-reference-updates-after-archival
- root-cause
- reality
- prevention
- trade-off

**Learnings:**

- Qodo PR Compliance + CodeRabbit + CI Feedback **PR:** Session after
- Review of document archival commit that broke CI
- Pre-push set +e/set -e: Script doesn't use set -e, current code works
- Root cause: False belief that path.relative() never returns bare ".."
- Reality: `path.relative('/a', '/')` returns ".." (no separator)
- Prevention: Never exclude files from security scans based on this

---

### Review 54: Step 4B Addition & Slash Commands Reference (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+ci+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 1 | 6 | 1 |

**Patterns:**

- archive-link-updates
- nested-code-fences-in-markdown
- step-range-in-effort-tracking
- root-cause
- prevention

**Learnings:**

- GitHub Actions docs-lint + Qodo PR Compliance + CodeRabbit **PR:**
- Review of Step 4B (Remediation Sprint) addition to
- Critical/High sections (256-778); Medium/Template sections (803+) fixed in Review #56 |
- Root cause: Links to archived files not updated when files moved
- Prevention: `grep -r "FILENAME" docs/` before marking archival complete
- Pattern: Always update references when archiving

---

### Review 55: Comprehensive Nested Code Fence Fix & Schema Clarity (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 7 | 2 |

**Patterns:**

- comprehensive-code-fence-audit
- artifact-naming-consistency
- acceptance-criteria-completeness
- root-cause
- prevention

**Learnings:**

- Qodo PR Compliance + CodeRabbit **PR:** Commit after e0444ee (PR
- Qodo (4 suggestions), CodeRabbit (6 suggestions)
- Follow-up review after Review #54 fixes. Identified that nested
- Root cause: Fixing one instance doesn't fix all - must search
- Prevention: `grep -n '^\`\`\`' FILE | wc -l` to count all fence lines
- Pattern: After fixing code fences, audit entire file for other instances
- Root cause: Output file format suffix not always explicit

---

### Review 56: Effort Estimate Accuracy & Complete Code Fence Fix (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 1 | 6 | 0 |

**Patterns:**

- effort-estimate-verification
- complete-pattern-fix-audit
- stub-link-strategy
- root-cause
- prevention

**Learnings:**

- Qodo PR Compliance + CodeRabbit **PR:** Commit after a525c01 (PR
- Qodo (4 suggestions), CodeRabbit (1 critical +
- Follow-up review after Review #55 fixes. Identified that Step 4
- Root cause: Estimate stated without summing detailed task breakdown
- Prevention: Always verify rollup matches sum of component estimates
- Pattern: `grep -o "hours)" FILE | wc -l` to count task hours, then verify
- Root cause: Fixing critical sections, missing lower-priority sections

---

### Review 57: CI Failure Fix & Effort Estimate Accuracy (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+ci+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 4 | 0 |

**Patterns:**

- verify-ai-suggestions-about-file-paths
- effort-estimate-arithmetic-verification
- optional-vs-required-artifact-semantics
- root-cause
- prevention

**Learnings:**

- Qodo PR Compliance + CodeRabbit + CI docs-lint failure **PR:**
- Qodo (3 suggestions),
- CI docs-lint workflow failed due to broken links introduced in
- Root cause: Qodo suggested using stub files that don't exist
- Prevention: Always verify target files exist before changing link paths:
- Pattern: AI path suggestions are hypothetical until verified
- Root cause: Range estimate (24-30h) didn't match exact sum (28h)

---

### Review 58: Template Compliance & Documentation Consistency (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+ci+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 10 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 6 | 3 |

**Patterns:**

- renamed-files-need-compliance-check
- link-format-consistency
- root-cause
- prevention

**Learnings:**

- Mixed - GitHub Actions CI + Qodo PR Suggestions + CodeRabbit PR
- Document cleanup PR introduced a renamed file
- S3 is appropriate for defensive
- Grep command alternative syntax - Current `--exclude` format is acceptable and
- Root cause: File renamed without adding required template sections
- Prevention: After renaming, run `npm run docs:lint` on changed files

---

### Review 59: Prompt Schema & Documentation Consistency (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 9 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 5 | 4 |

**Patterns:**

- prompt-schema-clarity
- grep-file-exclusion
- root-cause
- prevention

**Learnings:**

- Qodo PR Suggestions + CodeRabbit PR **PR:**
- Follow-up review after broken link fixes found additional
- Root cause: JSON examples in prompts can confuse AI about output format
- Prevention: Use bullet list format for schemas when showing structure
- Pattern: "Reference only" labels help prevent format copying
- Root cause: `grep -v "pattern"` filters by line content, not filename
- Prevention: Use `--exclude="filename"` for file-based filtering

---

### Review 60: Document Sync & Documentation Clarity (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 7 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 5 | 3 |

**Patterns:**

- document-counter-synchronization
- grep---exclude-path-behavior
- root-cause
- prevention

**Learnings:**

- Qodo PR Suggestions + CodeRabbit PR **PR:**
- Follow-up review after Review #59 found document synchronization
- Non-existent file references - SESSION_CONTEXT.md and ROADMAP.md exist at root
- Root cause: Adding reviews without updating range references
- Prevention: After adding review, grep for range patterns and update all
- Pattern: `grep -n "#[0-9]*-[0-9]*" docs/AI_REVIEW_LEARNINGS_LOG.md`
- Root cause: `--exclude` matches filename, not full path

---

### Review 61: Stale Review Assessment & Path/Terminology Fixes (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 2 | 2 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- stale-review-detection
- root-cause
- prevention

**Learnings:**

- Review feedback was 10 commits behind HEAD
- Most issues (grep exclusion, code fence clarity, duplicate links, review
- Only 2 current issues identified
- SESSION_CONTEXT.md and ROADMAP.md exist at
- Root cause: Reviews queued while development continues
- Prevention: Check HEAD vs review commit before processing

---

### Review 62: Multi-AI Template & Security Doc Fixes (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 21 | 10 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 4 | 11 |

**Patterns:**

- security-documentation-must-be-explicit
- archived-document-path-handling
- template-schema-completeness
- model-name-accuracy
- technology-appropriate-security-checks
- root-cause
- prevention
- note

**Learnings:**

- Review of Multi-AI audit template additions and documentation
- Several trivial suggestions were duplicates or not relevant to current files
- Root cause: Ambiguous comment could imply unsafe practice
- Prevention: Security docs must explicitly state prohibitions, not just hint
- Pattern: "NOTE: Service account credentials must NEVER be used in
- Note: Even comments can create security misconceptions

---

### Review 63: Documentation Link Fixes & Template Updates (2026-01-05)

**Date:** 2026-01-05 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 28 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 7 | 0 | 10 |

**Patterns:**

- relative-path-context-in-templates
- template-placeholder-hygiene
- root-cause
- prevention
- note

**Learnings:**

- Review of Multi-AI template additions and documentation updates.
- Root cause: Templates in `docs/templates/` using `docs/` paths instead of
- Prevention: When in subdirectory, use `../` to reference sibling
- Pattern: Files in `docs/templates/` should use `../file.md` not
- Note: Applies to all templates referencing other docs
- Root cause: Placeholder values (YYYY-MM-DD, [Author]) left in version

---

### Review 72: 2026 Q1 Multi-AI Audit Plans - Documentation Lint & AI Review Fixes (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 12 | 5 | 4 | 0 |

**Patterns:**

- scope
- trigger
- session
- branch
- jsonlschemastandardmd-broken-links
- globalsecuritystandardsmd-broken-links
- securitymd-broken-link
- eightphaserefactorplanmd-broken-links
- codereview-version-placeholders
- documentation-audit-structure-placeholders
- process-automation-inventory-placeholders
- process-stack-placeholders
- refactoring-stack-placeholders
- codereview-absolute-paths
- documentation-greedy-regex
- performance-non-portable-du-command
- readme-model-names-and-output-clarifications
- documentation-audit-history-table
- documentation-known-issues-section
- relative-path-calculation
- documentation-link-hygiene
- template-completion-checklist
- multi-pass-review-effectiveness
- link-validation-is-critical
- placeholder-discipline
- from-docsreviews2026-q1-to-docs
- from-docsreviews2026-q1-to-root
- always-verify-with-test--f-from-target-directory
- all-internal-links-must-use-relative-paths
- verify-link-targets-exist-before-committing
- use-standard-markdown-link-syntax-consistently-bracket-text-
- replace-all-placeholder-tokens-before-using-template
- fill-version-numbers-with-actual-values
- update-directoryfile-inventories-with-project-specifics
- verify-all-referenced-files-exist

**Learnings:**

- Documentation Lint, Qodo PR suggestions, CodeRabbit PR review
- Step 4.2 completion - comprehensive multi-AI review feedback
- Broken Documentation Links (12 fixes)**
- Root cause: All 6 plan files referenced `./JSONL_SCHEMA_STANDARD.md` but
- Files: SECURITY_AUDIT, CODE_REVIEW, PROCESS, PERFORMANCE, DOCUMENTATION,
- Fix: Changed all to `../../templates/JSONL_SCHEMA_STANDARD.md`
- Prevention: Verify relative paths match actual file location in directory

---

### Review 73: Multi-AI Audit Plan Scaffold (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- path-containment-at-shell-level
- robust-json-parsing-in-shell
- terminal-output-sanitization
- root-cause
- prevention
- note

**Learnings:**

- Qodo PR Compliance Guide + CodeRabbit **PR:** Session #19 **Tools:**
- Ninth round of feedback addressing pattern-check.sh security (path
- Root cause: Hook accepts file_path from JSON and passes to node script
- Prevention: Validate path is relative AND within project root using
- Pattern: `realpath -m "$path"` must start with
- Note: Shell scripts need same containment discipline as JS
- Root cause: sed-based parsing fails on escaped quotes, backslashes

---

### Review 74: Multi-AI Audit Plan Polish (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- relative-path-calculation-from-subdirectories
- schema-progress-tracking-fields
- explicit-deduplication-rules
- no-repo-mode-output-completeness
- environment-context-for-performance-metrics
- structured-humansummary-requirements
- root-cause
- prevention
- note
- fields
- sections

**Learnings:**

- Mixed (Qodo PR + CodeRabbit PR) **PR:** Session #27 **Commit:**
- Qodo Code Suggestions, CodeRabbit PR Review
- Comprehensive review of 6 Multi-AI Audit Plan files (2026-Q1) after
- Root cause: Files in `docs/reviews/2026-Q1/` linking to `docs/` need
- Prevention: Count directory levels when creating relative links
- Pattern: From `docs/reviews/2026-Q1/FILE.md` to `docs/TARGET.md` =
- Note: Already established in Consolidation #6, reinforced here

---

### Review 75: Multi-AI Audit Plan Methodology Enhancement (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- conflicting-pr-review-suggestions
- methodology-ambiguity-in-multi-ai-workflows
- schema-category-enum-clarity
- regex-robustness-for-markdown-links
- jsonl-validation-robustness
- false-positive-issue-detection
- root-cause
- prevention
- note
- decisions
- examples

**Learnings:**

- Mixed (Qodo PR + CodeRabbit PR) **PR:** Session #27 **Commit:**
- Qodo Code Suggestions, CodeRabbit PR Review
- Second-round review of Multi-AI Audit Plan files (2026-Q1)
- Root cause: Qodo and CodeRabbit provided contradictory path corrections for
- Prevention: Verify actual file structure before applying path fixes
- Resolution: Used `find` to locate actual file, confirmed current path
- Note: AI reviewers can hallucinate incorrect paths without repo context

---

### Review 76: Multi-AI Audit Plan Polish - Round 3 (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- shell-script-exit-code-propagation
- relative-path-calculation-errors
- model-name-standardization
- methodology-edge-case-handling
- version-metadata-consistency
- cross-file-consistency-for-enums
- root-cause
- prevention
- note
- reference
- examples
- codereviewplan-claudemd-claudemd-was-going-up-3
- performanceauditplan-missing-prefix-on-related-documents-lin
- verification
- chatgpt-4o-gpt-4o-openais-official-name-excludes-chat
- gpt-52-codex-gpt-5-codex-standardized-version-format
- division-by-zero
- root-cause-merges
- transitive-closure
- no-repo-mode
- vulnerability-type
- example

**Learnings:**

- Mixed (Qodo PR + CodeRabbit PR) **PR:** Session #27 **Commit:**
- Qodo Code Suggestions, CodeRabbit PR Review
- Third-round review of Multi-AI Audit Plan files (2026-Q1)
- Automation Robustness)
- Root cause: Pipes don't propagate exit codes in bash; `grep | while`
- Prevention: Use process substitution
- Pattern: Exit codes preserved through process substitution, not through

---

### Review 77: Multi-AI Audit Plan Refinement (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 9 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 2 |

**Patterns:**

- shell-script-portability-bash-specific-constructs
- relative-path-calculation-from-nested-directories
- jsonl-schema-validity
- documentation-consistency-severity-scales
- version-history-date-logic
- schema-completeness-for-reproducibility
- relative-path-errors-persist
- shell-script-portability-matters
- schema-validity-critical
- pattern-repetition-indicates-systematic-issue
- root-cause
- prevention
- note
- reference
- verification

**Learnings:**

- Mixed (Qodo PR + CodeRabbit PR) **PR:** Session #27 **Commit:**
- Qodo Code Suggestions, CodeRabbit PR Review
- Fourth-round review of Multi-AI Audit Plan files (2026-Q1)
- Root cause: Used bash-specific `< <(...)` process substitution which is not
- Prevention: Use standard pipe + `nl -ba` for line numbers instead of
- Pattern: `grep ... | nl -ba | while IFS=$'\t' read -r n line` for portable
- Note: Also improved error messages with line numbers and filtered

---

### Review 78: Multi-AI Audit Plan Quality & Validation (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 12 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 7 | 3 |

**Patterns:**

- jsonl-validity-in-no-repo-mode-instructions
- shell-script-fail-fast-reliability
- json-schema-placeholder-validity
- model-name-standardization
- metadata-accuracy-dates-counts-ranges
- no-repo-mode-output-contract-completeness
- critical-automation-pattern
- schema-design-principle
- no-repo-mode-consistency
- metadata-synchronization-gap
- root-cause
- prevention
- note
- impact
- verification
- automation
- related
- recommendation

**Learnings:**

- Mixed (Qodo PR + CodeRabbit PR) **PR:** Session #28 **Commit:**
- Qodo Code Suggestions (9 items), CodeRabbit PR Review (4
- Fifth-round review of Multi-AI Audit Plan files (2026-Q1)
- Root cause: Instructed AI to output literal non-JSON text
- Prevention: NO-REPO MODE instructions must specify truly empty output or
- Pattern: Empty JSONL sections should have zero lines, not placeholder text
- Note: Related to Review #77 pattern #3 (JSONL Schema Validity)

---

### Review 79: Multi-AI Audit Plan JSONL & Schema Corrections (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 10 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 4 | 3 |

**Patterns:**

- no-repo-mode-parser-breaking-output-instructions
- schema-contradiction-in-no-repo-instructions
- bash-specific-features-in-documentation-scripts
- invalid-json-tokens-in-schema-examples
- model-name-canonical-format-establishment
- metadata-drift-across-reviews
- critical-pattern-completion
- schema-first-principle
- canonical-format-enforcement
- bash-portability-trade-off
- metadata-synchronization-gap-persists
- root-cause
- prevention
- note
- impact
- cross-reference
- verification
- related
- automation-opportunity
- lesson
- recommendation

**Learnings:**

- Qodo PR Code Suggestions **PR:** Session #28 **Commit:** 7753d6a
- Qodo PR (10 suggestions)
- Sixth-round review of Multi-AI Audit Plan files (2026-Q1)
- Critical Schema Issue)
- Root cause: Instructions told AI to output literal non-JSON text in JSONL
- Prevention: NO-REPO MODE instructions must specify header + zero lines, not
- Pattern: "Print the header `FINDINGS_JSONL` and then output zero lines —

---

### Review 81: Capability-Tiered Context & NO-REPO MODE Standardization (2026-01-07)

**Date:** 2026-01-07 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 5 | 1 |

**Patterns:**

- cross-template-consistency-required
- inline-context-must-be-complete
- grep-commands-need-full-file-coverage
- terminology-drift-detection
- output-contract-clarity
- file-type-coverage
- root-cause
- prevention

**Learnings:**

- Post-implementation review of capability-tiered PRE-REVIEW CONTEXT
- Root cause: Each template evolved independently, creating terminology drift
- Prevention: When adding features to multiple templates, audit all for
- Pattern: "NO-REPO MODE" is canonical; "LIMITED MODE" deprecated
- Root cause: Inline summaries only covered highlights, not full inventory
- Prevention: When providing fallback context, list ALL relevant items

---

### Review 82: Inline-Context Completeness & Schema Definitions (2026-01-07)

**Date:** 2026-01-07 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 8 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 1 |

**Patterns:**

- inline-context-must-have-exact-counts
- schema-must-precede-usage
- verify-before-documenting
- schema-first
- grep-coverage-consistency
- root-cause
- prevention

**Learnings:**

- Post-implementation review of PR Review #81 fixes. Review
- Root cause: Initial inline-context used approximations like "2-3 locations"
- Prevention: Always use grep to verify exact counts before documenting
- Pattern: "DailyQuoteCard: 2 locations" not "DailyQuoteCard: 2-3 locations"
- Root cause: NO-REPO MODE referenced REFACTORING_METRICS_JSON without
- Prevention: When adding new JSON outputs, define schema immediately

---

### Review 87: Schema Symmetry & Markdown Syntax (2026-01-07)

**Date:** 2026-01-07 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 4 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 3 | 0 |

**Patterns:**

- schema-symmetry-across-plans
- validate-markdown-after-code-block-edits
- cross-plan-consistency
- markdown-fence-hygiene
- root-cause
- prevention

**Learnings:**

- Review identified missing QUALITY_METRICS_JSON null schema in
- Root cause: Added REFACTORING_METRICS_JSON in Review #82 but forgot
- Prevention: When adding schema to one plan, check all similar plans for
- Pattern: All audit plans with metrics output need explicit null-structure
- Root cause: Adding content above code blocks left orphan closing fences
- Prevention: When editing near fenced blocks, verify open/close matching

---

### Review 88: Phase 4.2 Multi-AI Security Audit (2026-01-07)

**Date:** 2026-01-07 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- defense-in-depth-gaps
- legacy-path-bypass
- fail-open-security-controls
- multi-model-agreement
- risk-acceptance-documentation
- compensating-controls
- root-cause
- prevention

**Learnings:**

- Multi-AI Security Audit (Claude Opus 4.5 + ChatGPT 5.2)
- Phase 4.2 Execution - SECURITY_AUDIT_PLAN_2026_Q1 **Findings:**
- Comprehensive security audit aggregating findings from Claude Opus
- Root cause: Multiple security layers incomplete (rate limiting, bot gating,
- Prevention: Security checklist for each endpoint (auth + rate limit +
- Pattern: Every callable needs: rate limit + schema validation + bot gating
- Root cause: Old Firestore rules allow direct writes that bypass new

---

### Review 89: b: Audit Plan Placeholder Validation (2026-01-07)

**Date:** 2026-01-07 | **Source:** coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 1 | 3 | 2 |

**Patterns:**

- placeholder-content-validation
- scope-boundary-definition
- documentation-consistency
- template-instantiation-validation
- example-vs-actual
- cross-file-consistency
- root-cause
- prevention

**Learnings:**

- CodeRabbit review of placeholder replacement fixes in
- Root cause: Template-derived files populated with example data not
- Prevention: After replacing placeholders, verify all referenced
- Pattern: SCOPE sections must reference actual app routes, not example paths
- Root cause: Performance audit scope incorrectly included test files
- Prevention: Audit scopes should match audit purpose (performance ≠ tests)

---

### Review 98: Document Sync Validation Script - Security & Quality Fixes (2026-01-08)

**Date:** 2026-01-08 | **Source:** sonarcloud+qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 18 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 5 | 1 | 8 | 4 |

**Patterns:**

- regex-state-leak
- path-traversal-in-dependency-files
- redos-vulnerabilities
- unimplemented-cli-flags
- regex-security-triad
- documentation-validation
- timestamp-precision
- root-cause
- prevention

**Learnings:**

- Mixed (Qodo Compliance + Qodo PR + CodeRabbit PR x2 + SonarQube)
- Multi-source review of Session #35 commits implementing document
- Root cause: Global regex patterns reused across forEach iterations without
- Prevention: Reset lastIndex before each line or use non-global patterns in
- Pattern: `/g` flag + .exec() in loops = stateful lastIndex causes missed

---

### Review 99: Document Sync Validator - Follow-up Security & Quality Issues (2026-01-08)

**Date:** 2026-01-08 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 6 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 3 | 0 | 1 |

**Patterns:**

- silent-error-handling
- path-traversal-in-link-checker
- overly-broad-regex-scope
- non-portable-path-validation
- ai-review-tool-false-positive-detection
- error-visibility
- defense-in-depth
- scope-before-match
- verify-ai-claims
- claim
- verification
- result
- lesson
- root-cause
- prevention

**Learnings:**

- Follow-up review of Review #98 commit (555c3d8 + 80fa31e)
- Root cause: checkStaleness returns `{isStale: false}` when date
- Prevention: Surface parse errors to caller; invalid data should fail
- Pattern: Treating parse failure as "valid but not stale" = silent data
- Root cause: checkBrokenLinks doesn't validate that link targets stay within

---

### Review 100: Review #99 Post-Commit Refinements (2026-01-08)

**Date:** 2026-01-08 | **Source:** sonarcloud+qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 4 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 2 | 1 |

**Patterns:**

- dead-code-after-exception-throwing-calls
- error-severity-mismatches
- ineffective-validation-conditions
- review-numbering-conflicts
- exception-semantics
- error-type-differentiation
- validation-redundancy
- audit-trail-integrity
- root-cause
- prevention

**Learnings:**

- Follow-up review of Review #99 commit (e06b918) identified dead
- Root cause: existsSync check placed after successful realpathSync (which
- Prevention: Remember realpathSync throws on non-existent paths; success =
- Pattern: Code after try/catch with throwing functions may be unreachable
- Root cause: Invalid date format treated as MINOR staleness issue instead of
- Prevention: Use parseError flag to escalate severity for data validation

---

### Review 137: PR #243 SonarQube Security Hotspots & Qodo Suggestions (2026-01-13)

**Date:** 2026-01-13 | **PR:** #243 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 5 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 3 | 2 |

**Patterns:**

- non-greedy-regex-for-json-extraction
- explicit-test-skip-over-silent-catch
- root-cause
- prevention

**Learnings:**

- Mixed - SonarQube Security Hotspots + Qodo PR Code Suggestions
- Post-merge review of Step 4B Remediation Sprint PR. SonarQube
- False positive |
- Root cause: Greedy `[\s\S]*` can backtrack on malformed input
- Prevention: Use `[\s\S]*?` for bounded matching
- Pattern: Already in CODE_PATTERNS.md as "Regex brace matching"

---

### Review 138: PR #243 Step 4C Qodo Compliance Review (2026-01-13)

**Date:** 2026-01-13 | **PR:** #243 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 4 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 3 | 0 |

**Patterns:**

- feature-flag-allowlist
- nextjs-env-var-client-bundling
- root-cause
- prevention

**Learnings:**

- Post-commit review of Step 4C SonarCloud Issue Triage changes.
- Root cause: `process.env[featureId]` with dynamic key could probe env vars
- Prevention: Allowlist valid feature flag names, reject unknown keys
- Root cause: Dynamic `process.env[key]` is NOT inlined by Next.js on client
- Prevention: Use static map with explicit `process.env.NEXT_PUBLIC_*`
- Pattern: For client-side env access, always use explicit string literals

---

### Review 139: PR Cherry-Pick Security Audit CI Fixes (2026-01-13)

**Date:** 2026-01-13 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 8 | 1 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Some commands were created without proper frontmatter structure
- Prevention: Always add frontmatter when creating new commands
- Root cause: Audit reports were missing standard sections
- Prevention: Include Purpose, Version History, and Last Updated in all audit
- All `.claude/commands/*.md` files MUST have YAML frontmatter with a
- The frontmatter must be at the very start of the file:

---

### Review 140: PR Review Processing Round 2 (2026-01-13)

**Date:** 2026-01-13 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Pipe to `while read` instead of `xargs` to prevent hangs on empty input
- Category names in Focus Areas should match schema enum values
- Use POSIX character classes `[[:space:]]` for portable regex
- Always include both .ts and .tsx in grep patterns for React projects

---

### Review 141: PR Review Processing Round 3 (2026-01-13)

**Date:** 2026-01-13 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Schema category enums should be single CamelCase tokens (no spaces/multiline)
- Always use `grep -E` for patterns with alternation (`|`)
- Include all relevant file types (.ts, .tsx, .js, .mjs, .json) in grep patterns

---

### Review 142: PR #281 SonarCloud Workflow Configuration (2026-01-18)

**Date:** 2026-01-18 | **PR:** #281 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 4 | 7 | 0 |

**Patterns:**

- pin-github-actions-to-commit-shas
- sonarcloud-api-uses-basic-auth
- check-workflow-conclusion-not-just-status
- skip-ci-for-fork-prs
- root-cause
- prevention

**Learnings:**

- Qodo Compliance + Qodo PR Suggestions + SonarCloud (2 rounds)
- Review of SonarCloud workflow configuration PR. Issues covered
- Root cause: Mutable tags (@v4, @v3) can be moved or compromised
- Prevention: Use `action@<SHA> # v<version>` format
- Pattern: Already in CODE_PATTERNS.md
- Root cause: API requires Basic auth, not Bearer tokens

---

### Review 143: CI Pattern Compliance and Command Injection Fix (2026-01-13)

**Date:** 2026-01-13 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 6 | 8 | 0 |

**Learnings:**

- Qodo PR Compliance + SonarCloud + Pattern Compliance CI
- Shell interpolation with env vars is command injection - use execFileSync with
- When security checks can't determine state, fail-closed (block) not fail-open
- Error objects in JS are not guaranteed - non-Error values can be thrown
- CSS imports from transitive dependencies need explicit package.json entries
- Pattern compliance false positives: add verified files to pathExclude with

---

### Review 144: Step 6-7 PR CI Fixes (2026-01-14)

**Date:** 2026-01-14 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 4 | 0 |

**Learnings:**

- Parse dependency rules from DOCUMENT_DEPENDENCIES.md (architectural - tracked)
- When archiving files, update ALL scripts that reference them
- Shell scripts in pre-commit hooks may run with `/bin/sh`, avoid bash-only
- Cross-document dependency checks should be updated when archiving source docs

---

### Review 145: Settings Page Accessibility & Security (2026-01-14)

**Date:** 2026-01-14 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 9 | 0 |

**Patterns:**

- accessible-toggle-pattern
- local-date-formatting
- preference-preservation

**Learnings:**

- Custom interactive elements (toggles) must use native button or add role +
- When updating nested objects (preferences), spread existing values to preserve
- Input validation must happen before Firestore writes - NaN checks, range
- Audit logging should capture action type and changed fields, not sensitive

---

### Review 146: Operational Visibility Sprint PR Feedback (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 7 | 8 | 2 |

**Patterns:**

- useeffect-dependency-on-state-causes-re-subscriptions
- firestore-timestamps-need-type-handling
- auth-protected-routes-fail-lighthouse-audits

**Learnings:**

- Documentation Lint + Qodo Compliance + CI + PR Suggestions
- Separate dev dashboard as distinct app (architectural - valid but out of scope
- Client-side DSNs (like Sentry) are acceptable to commit as they're public by
- Non-sensitive config (org names, project names) should use env vars, not GCP

---

### Review 147: CI Blocker Fixes + Firebase Error Handling (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 3 | 0 |

**Patterns:**

- prettier-can-override-linter-requirements
- firestore-implicit-deny-needs-explicit-rules
- force-token-refresh-for-admin-checks

**Learnings:**

- The logger module only has info/warn/error methods - no debug level
- Firestore denies access by default but explicit rules improve auditability
- Show specific error types (permission-denied, network) for better UX

---

### Review 148: Dev Dashboard Security Hardening (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 5 | 0 |

**Patterns:**

- never-expose-raw-errormessage-to-users
- client-side-read-only-for-dev-data
- defensive-null-guards

**Learnings:**

- Firestore allows client writes | Major | Security | Changed to read-only (write: if false) |
- Access control bypass - Already fixed in #147 (Firestore rules)
- Chrome sandbox disabled - Acceptable for local dev scripts (#146)
- No ticket provided - N/A for dev branch
- Prettier may want blank lines after prettier-ignore-end comments
- Dev dashboards should be read-only for clients - CI writes the data

---

### Review 149: Robustness & Error Handling Improvements (2026-01-15)

**Date:** 2026-01-15 | **Source:** ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 4 | 0 |

**Patterns:**

- react-strict-mode-double-invoke
- runtime-data-validation
- consistent-state-cleanup

**Learnings:**

- CI cache issue |
- Pattern compliance CI can flag safe code if regex doesn't understand context
- React Strict Mode runs effects twice in dev - guard initialization with flags
- Firestore Partial<T> + validation is safer than direct type assertion

---

### Review 150: Deployment Safety & Async Cleanup (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 0 |

**Patterns:**

- definestring-for-deployment-safety
- async-cleanup-pattern
- optional-chaining-for-external-data
- use-chain-with-fallback-to-0

**Learnings:**

- Firebase Functions don't have access to .env files in production - only
- React Strict Mode double-invokes effects - but isCancelled pattern handles
- Firestore failed-precondition usually means missing index, not missing data

---

### Review 151: ErrorsTab Expandable Details PR Feedback (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 5 | 0 |

**Patterns:**

- url-protocol-validation
- date-validation-before-formatting
- memoize-derived-render-data

**Learnings:**

- CI Feedback + Qodo PR Compliance + PR Code Suggestions
- Move knowledge base to Firestore (architectural change - tracked for separate
- Sentry permalinks should only ever be https://sentry.io URLs, but defensive
- Interactive table rows cause accessibility issues - use semantic button

---

### Review 152: Admin Error Utils PR Feedback (2026-01-15)

**Date:** 2026-01-15 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 1 | 1 | 2 |

**Patterns:**

- regex-redos-prevention
- security-test-false-positives
- whitespace-validation

**Learnings:**

- SonarCloud Security Hotspots + Qodo PR Code Suggestions + CI
- Test validates security function
- Email regex per RFC 5321: local-part max 64 chars, domain max 253 chars
- SonarCloud security hotspots in test files often flag the test inputs, not

---

### Review 153: Admin Error Utils Follow-up (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 5 | 0 |

**Patterns:**

- tld-length-limit
- large-input-guards
- nullable-type-signatures

**Learnings:**

- Full email regex RFC compliance: local `{1,64}` + domain `{1,253}` + TLD
- Large payload protection prevents both performance issues and ensures
- Explicit nullable types make API contracts clearer even when implementation

---

### Review 154: Admin Error Utils Security Hardening (2026-01-15)

**Date:** 2026-01-15 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 5 | 0 |

**Patterns:**

- url-credential-rejection
- jwt-token-detection
- phone-regex-precision

**Learnings:**

- URL API provides parsed username/password/port - check all three for security
- JWT tokens use base64url encoding (alphanumeric + hyphen + underscore)
- Test data should avoid matching production patterns (use 'x' not 'a' for

---

### Review 155: Security Check Self-Detection & CI Fix (2026-01-16)

**Date:** 2026-01-16 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 2 | 0 |

**Patterns:**

- self-referential-exclusion
- multiline-output-comparison

**Learnings:**

- Regex patterns like `/\beval\s*\(/` will match message strings containing
- GitHub Actions `${{ steps.x.outputs.y }}` for multiline values returns all

---

### Review 156: Security Hardening & Pre-Push Fix (2026-01-16)

**Date:** 2026-01-16 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 2 | 0 |

**Patterns:**

- pre-push-vs-pre-commit-file-selection
- path-traversal-in-cli-args
- cross-platform-regex

**Learnings:**

- CLI tools accepting file paths need path traversal protection even for
- Windows uses backslash, POSIX uses forward slash - regex patterns matching

---

### Review 161: lint-staged PR Feedback (2026-01-16)

**Date:** 2026-01-16 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 3 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 1 | 0 |

**Patterns:**

- supply-chain-security-with-npx
- hook-error-visibility

**Learnings:**

- Suppressing stderr (`2>/dev/null`) in hooks hides actionable failure context
- CI checks formatting after local hooks - ensure lint-staged formats before

---

### Review 162: Track A Admin Panel PR Feedback (2026-01-16)

**Date:** 2026-01-16 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 22 | 0 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 8 | 11 | 0 |

**Patterns:**

- metadata-redaction
- preserve-custom-claims
- collection-group-queries
- batch-auth-operations
- complete-cleanup-loops

**Learnings:**

- Qodo PR Compliance + PR Code Suggestions + CI Feedback
- Firebase custom claims are replaced entirely by setCustomUserClaims - always
- Storage file orphan detection using publicUrl() is brittle - prefer file.name
- N+1 patterns in Cloud Functions can cause timeouts at scale - batch where
- CI formatting checks run after local hooks - ensure consistent formatting

---

### Review 163: Track A PR Follow-up Compliance (2026-01-17)

**Date:** 2026-01-17 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 5 | 2 |

**Patterns:**

- per-item-error-handling-in-jobs
- firestore-transactions-for-multi-read-write
- schema-validation-for-admin-apis
- listdocuments-for-id-only-queries
- null-to-remove-claims
- error-propagation-over-swallowing

**Learnings:**

- Function names should reflect what they clean up, not the collection they
- Per-item error handling makes jobs resilient to transient failures
- Always validate admin API inputs with schemas, not just presence checks
- Transactions prevent concurrent admin updates from corrupting data

---

### Review 164: Track A Cherry-Pick PR Qodo Compliance (2026-01-17)

**Date:** 2026-01-17 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 7 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 3 | 0 |

**Patterns:**

- firestore-index-query-scope
- storage-pagination-for-scalability
- defense-in-depth-metadata-redaction
- root-cause
- prevention

**Learnings:**

- Root cause: Configuration mismatch between index definition and query usage
- Prevention: Validate indexes match query patterns (collectionGroup queries
- Root cause: Loading all files into memory can exhaust resources at scale
- Prevention: Use `maxResults` + `pageToken` pagination pattern, process in
- Root cause: Legacy data may bypass write-time redaction
- Prevention: Add read-time redaction as safety net for UI exposure

---

### Review 165: Track A Follow-up Qodo Compliance (2026-01-17)

**Date:** 2026-01-17 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 8 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 2 | 1 |

**Patterns:**

- -ai-reviewer-contradiction
- isplainobject-guard
- pagination-loop-guard
- critical
- root-cause
- prevention
- actual-code

**Learnings:**

- Root cause: AI reviewers don't have full context between reviews
- Prevention: Check actual query code before applying index scope changes
- Actual code: `db.collection("security_logs")` → needs COLLECTION scope
- Root cause: typeof obj === "object" matches Date, Timestamp, etc.
- Prevention: Check Object.getPrototypeOf() === Object.prototype
- Root cause: pageToken could theoretically repeat

---

### Review 171: aggregate-audit-findings.js PR Hardening (2026-01-17)

**Date:** 2026-01-17 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 29 | 17 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 6 | 13 | 10 |

**Patterns:**

- bounded-regex-for-redos-prevention
- on-algorithm-dos-protection
- cognitive-complexity-extraction
- error-sanitization-for-cli-tools
- root-cause
- prevention

**Learnings:**

- SonarCloud Security Hotspots + SonarCloud Issues + Qodo PR
- O(n²) Levenshtein pairwise | Major | Performance | Add MAX_LEVENSHTEIN_LENGTH=500, truncate inputs |
- Root cause: Backtracking regex with unbounded quantifiers on alternations
- Prevention: Use explicit character class with length limits
- Root cause: Algorithmic complexity becomes exploitable with large inputs
- Prevention: Define MAX_LENGTH constant, truncate before processing
- Root cause: Functions accumulating nested conditionals over time

---

### Review 179: PR #277 Round 4 - Consistency & Pagination (2026-01-18)

**Date:** 2026-01-18 | **PR:** #277 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 3 | 2 | 0 |

**Patterns:**

- cursor-pagination-for-batch-jobs
- operation-order-for-consistency
- capture-before-transaction
- primitive-dependencies

**Learnings:**

- Batch processing with `hasMore = snapshot.size === 50` causes infinite loops
- Functional setState updates (`setActiveTabState((prev) => ...)`) avoid stale
- Admin error messages like "User not found" are acceptable in admin-only

---

### Review 180: PR #282 SonarCloud Cleanup Sprint Documentation (2026-01-19)

**Date:** 2026-01-19 | **PR:** #282 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 202 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 2 | 0 |

**Patterns:**

- code-review-triggers-gha-issue
- root-cause
- impact
- status
- doc-lint-required-sections
- document-consistency
- timezone-aware-git-dates

**Learnings:**

- Documentation linter enforces Purpose section for Tier 2+ docs
- Snapshot files should reference and align with authoritative plan documents
- Version history entries should be updated when issue counts change
- Git date queries behave differently in UTC vs local timezones

---

### Review 181: PR #284 SonarCloud Cleanup CI Compliance (2026-01-19)

**Date:** 2026-01-19 | **PR:** #284 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 33 | 4 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 4 | 18 | 9 | 1 |

**Patterns:**

- shell-syntax-validation
- esm-namespace-imports
- path-containment-checks

**Learnings:**

- Qodo Compliance + CI Pattern Check + Qodo PR Suggestions
- Shell scripts with `set -u` will fail if variables are used before definition
- SonarCloud fixes can introduce new bugs if not validated (triple bracket)
- Pattern compliance checks catch issues before SonarCloud does

---

### Review 182: SonarCloud Sprint PR 1 - Mechanical Fixes (2026-01-19)

**Date:** 2026-01-19 | **PR:** #284 | **Source:** sonarcloud

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- nodejs-import-inconsistency
- shell-script-modernization
- repeated-string-literals
- sonarcloud-fixes-can-introduce-bugs
- esm-namespace-imports
- path-containment-patterns
- shell-variable-order

**Learnings:**

- All mechanical/automatable SonarCloud issues including Node.js
- Run syntax validation after batch find-replace operations
- Node.js built-ins need namespace imports in ESM (`import * as fs`)
- Path security checks need robust regex patterns, not simple string methods
- Shell variable order matters with strict mode (`set -u`)

---

### Review 183: SonarCloud Sprint PR 2 - Critical Issues Partial (2026-01-19)

**Date:** 2026-01-19 | **PR:** #284 | **Source:** sonarcloud

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cognitive-complexity-in-job-functions
- void-operator-pattern
- mutable-exports-for-ssr

**Learnings:**

- High-impact critical issues including cognitive complexity
- Each helper function should do one thing; names should describe the
- Firebase job functions grow organically without refactoring - set complexity

---

### Review 184: PR #286 SonarCloud + Qodo Combined Review (2026-01-19)

**Date:** 2026-01-19 | **PR:** #286 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 32 | 27 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 16 | 11 | 0 |

**Patterns:**

- shared-regex-state-mutation
- pii-in-security-logs
- non-global-regex-in-loops
- empty-array-edge-cases

**Learnings:**

- SonarCloud PR API + Qodo PR Compliance + Qodo Code Suggestions
- SonarCloud catches shared state issues human reviewers miss
- Qodo excels at defensive programming suggestions (null guards, error handling)
- Security hotspots for ReDoS often false positives for simple patterns
- Boolean method flags (S2301) appropriate for simple return functions
- Rejected: 1 item (S2301 for simple getter functions)

---

### Review 186: PR #287 Qodo + SonarCloud Follow-up (2026-01-20)

**Date:** 2026-01-20 | **PR:** #287 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 9 | 1 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 6 | 2 |

**Patterns:**

- redos-false-positives-in-simple-patterns
- input-validation-gaps
- anonymized-data-can-be-sent-to-third-parties

**Learnings:**

- Qodo PR Code Suggestions + SonarCloud Security Hotspots
- SonarCloud flags them but they're safe
- SonarCloud S5852 often flags linear patterns - verify before fixing
- Defensive validation (empty names, unknown args) improves error messages
- Hashed IP addresses are no longer PII and can be sent to Sentry
- Rejected: 2 items (S5852 false positives already documented)
- Deferred: 1 item (helper modularization - architectural refactoring)

---

### Review 187: Cherry-Pick PR Qodo Compliance Review (2026-01-20)

**Date:** 2026-01-20 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 20 | 20 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 6 | 11 | 3 |

**Patterns:**

- global-regex-flag-for-scanning
- promiseresolve-for-sync-errors
- ip-hash-still-privacy-sensitive
- lstatsync-for-symlink-detection
- error-type-over-message

**Learnings:**

- Security scanners must detect ALL matches - non-global regex is a critical bug
- Use `Promise.resolve().then(() => fn())` pattern to catch sync exceptions
- Even anonymized data should stay out of third-party services (privacy best
- Error messages may contain API keys, paths, or PII - log type/code only

---

### Review 188: Cherry-Pick PR Qodo Follow-up Review (2026-01-20)

**Date:** 2026-01-20 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 7 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 5 | 1 |

**Patterns:**

- type-guards-before-string-methods
- stateful-regex-cloning
- set-for-deduplication
- cli-argument-flexibility

**Learnings:**

- Qodo can flag issues that are already handled elsewhere - always verify with
- Adjacent-only deduplication (`arr[arr.length-1] !== value`) doesn't prevent
- API responses may return numbers as strings - use explicit coercion
- Event type allowlists prevent malformed log entries and improve error messages
- Rejected: 1 item (false positive - check exists)

---

### Review 189: Cherry-Pick PR Qodo Second Follow-up (2026-01-20)

**Date:** 2026-01-20 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 10 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 2 |

**Patterns:**

- set-vs-array-iteration
- regex-lastindex-reset
- cross-platform-line-endings
- firestore-timestamp-safety

**Learnings:**

- Changing data structures (Array→Set) has ripple effects on iteration code
- Regex with g/y flags maintain state between calls - reset before each use
- Windows files processed on Unix (or vice versa) can have mismatched line
- Firestore timestamps may be null, undefined, or even plain objects in edge
- Rejected: 1 item (high-level PR criticism - intentional work)

---

### Review 190: Cherry-Pick PR Qodo Third Follow-up (2026-01-20)

**Date:** 2026-01-20 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 10 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 2 | 0 |

**Patterns:**

- symlink-traversal-protection
- deterministic-set-iteration
- bulk-fix-conflict-detection
- helper-extraction-for-safety

**Learnings:**

- Symlink attacks can bypass path traversal checks - always use lstatSync first
- Set iteration order is undefined in JS - sort after Array.from() for
- Bulk operations need to validate against individual entries to prevent
- Magic numbers should be named constants for clarity and maintainability

---

### Review 191: Encrypted Secrets PR CI + Qodo Compliance (2026-01-21)

**Date:** 2026-01-21 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 17 | 17 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- hidden-passphrase-input
- secure-file-permissions
- atomic-file-writes
- buffer-validation
- terminal-state-cleanup
- placeholder-detection

**Learnings:**

- CI Pattern Compliance + Qodo PR Suggestions (2 rounds)
- CI Pattern Compliance):**
- Qodo Security Compliance):**
- Node.js readline doesn't hide input by default - need raw mode for passwords
- Pattern compliance catches issues that linters miss
- Shell history exposure: prefer --stdin over env var for sensitive values
- Always validate input buffers before crypto operations

---

### Review 192: PR Documentation Lint + Qodo Suggestions (2026-01-21)

**Date:** 2026-01-21 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 6 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 3 | 0 |

**Patterns:**

- documentation-linting
- static-audit-reports-anti-pattern
- sensitive-ide-configuration
- root-cause
- prevention

**Learnings:**

- Root cause: Document created without proper structure/frontmatter
- Prevention: Follow Tier 2 doc template (Purpose + Version History + AI
- Root cause: Audit reports hardcoded instead of using live dashboard
- Prevention: Use SonarCloud dashboard + issue tracker, not static markdown
- Root cause: IDE-specific config committed to shared workspace settings
- Prevention: Keep user settings in .vscode/settings.json, not shared config

---

### Review 193: Qodo PR Security Compliance + Code Suggestions (2026-01-21)

**Date:** 2026-01-21 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 6 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 4 | 0 | 2 | 0 |

**Patterns:**

- local-config-committed
- duplicate-documentation-content
- invalid-markdown-structure
- root-cause
- prevention

**Learnings:**

- Root cause: .local.json files are user-specific, not for shared repository
- Prevention: Ensure .local.json in .gitignore, never commit user-specific
- Root cause: Manual content editing without verification
- Prevention: Review diff before committing, use unique section markers
- Root cause: Line continuation without proper list syntax
- Prevention: Validate markdown structure, add newlines between list items

---

### Review 194: PR #296 Hookify Infrastructure - Qodo + CI Pattern Compliance (2026-01-22)

**Date:** 2026-01-22 | **PR:** #296 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 50 | 10 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 4 | 3 | 2 |

**Patterns:**

- arbitrary-file-write-without-path-containment
- startswith-path-validation-fails-on-windows
- readfilesync-without-trycatch
- template-literal-regex-bypass
- root-cause
- prevention

**Learnings:**

- Qodo Security Compliance + Code Suggestions + CI Pattern Compliance
- Review of comprehensive hook infrastructure implementation (11 new
- Root cause: CLAUDE_PROJECT_DIR used without validation
- Prevention: Always validate environment variables with path.relative()
- Root cause: startsWith() doesn't handle Windows paths or edge cases
- Prevention: Use path.relative() and check for ".." prefix with proper regex

---

### Review 195: PR #334f459 Expansion Placement Metadata - CI Lint + Qodo Suggestions (2026-01-22)

**Date:** 2026-01-22 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 4 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 4 | 0 |

**Patterns:**

- documentation-lint-violations
- non-deterministic-insertion-order
- major-added-purpose-section
- minor-added-ai-instructions-section
- minor-added-quick-start-section
- minor-refined-insert-after-column
- tracker-format-migration
- documentation-compliance
- deterministic-metadata
- markdown-as-database-technical-debt
- architectural-decisions
- root-cause
- prevention

**Learnings:**

- Review of placement metadata framework added to
- Root cause: New tracker document lacked required Tier-2 sections
- Prevention: All Tier-2 docs require Purpose/Overview, AI Instructions,
- Pattern: EXPANSION_EVALUATION_TRACKER is state tracking doc, needs
- Root cause: Multiple items using "Create M4.5" instead of referencing
- Prevention: Use linked-list style insertion (each item references previous

---

### Review 196: PR #036fab3 Expansion Metadata Refinement - Qodo Follow-up (2026-01-22)

**Date:** 2026-01-22 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 10 | 0 |

**Patterns:**

- broken-insertion-chain-logic
- inconsistent-command-namespace
- ambiguous-metadata-values
- critical-fixed-broken-insertion-chain
- minor-standardized-command-namespace
- minor-fixed-suggestion-count
- minor-fixed-placement-count
- minor-made-end-of-list-deterministic
- minor-added-type-prefixes-to-insert-after
- minor-normalized-relationship-column
- minor-added-feature-group-registry
- cross-list-reference-integrity
- command-namespace-consistency
- type-prefix-disambiguation
- controlled-vocabularies
- registry-formalization
- arithmetic-vigilance
- root-cause
- prevention

**Learnings:**

- Follow-up review of fixes applied in Review #195, identifying
- Root cause: F4.2 references F4.4 in Insert After, but F4.4 is in deferred
- Prevention: Insertion chains must only reference items within same list
- Pattern: Cross-list references break linked-list integrity
- Root cause: Mixed use of `/expansion` and `/expansion-evaluation` commands
- Prevention: Use full namespace consistently across all documentation

---

### Review 197: PR claude/new-session-z2qIR Expansion Evaluation Tracker - Qodo Consistency Check (2026-01-23)

**Date:** 2026-01-23 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 10 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 6 | 5 |

**Patterns:**

- cross-document-count-synchronization
- stale-handoff-next-steps
- placement-status-consistency
- false-positive-detection---qodo-limitations
- root-cause
- prevention

**Learnings:**

- Follow-up review of expansion evaluation tracker after F1
- Root cause: Evaluation totals in EXPANSION_EVALUATION_TRACKER (Technical:
- Prevention: After evaluation milestones, verify all summary counts match
- Pattern: Multi-document tracking requires explicit sync checkpoints
- Root cause: SESSION_CONTEXT Next Step described completed work ("Update
- Prevention: Update Next Step field when transitioning between evaluation

---

### Review 198: PR #308 Serena Dashboard Hook - Qodo Security & Compliance (2026-01-23)

**Date:** 2026-01-23 | **PR:** #308 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 1 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 3 | 2 |

**Patterns:**

- cross-platform-process-termination
- process-verification-before-termination
- listener-vs-client-state-targeting
- audit-logging-for-security-events
- graceful-vs-forced-shutdown
- created
- updated
- symlink-protection-for-log-files
- stricter-process-allowlist-validation
- user-context-in-audit-logs
- deprecated-command-fallbacks
- cross-platform-sleep
- total-fixed
- final-file
- commits
- toctou-safe-file-operations
- sensitive-data-in-audit-logs
- native-process-signaling
- graceful-shutdown-polling
- error-message-safety
- root-cause
- prevention
- command-line-matching

**Learnings:**

- Qodo security compliance review of PR #308 (Serena dashboard
- Root cause: PowerShell-only hook (`Get-NetTCPConnection`, `Stop-Process`)
- Prevention: Use Node.js with platform detection (`process.platform`) and
- Pattern: Session hooks must support all platforms (Windows, macOS, Linux)
- Root cause: Blind process termination without verification could kill wrong
- Prevention: Allowlist-based validation (`PROCESS_ALLOWLIST`) + process name

---

### Review 199: PR #308 Round 4 - CI Security Scanner + Qodo Hardening (2026-01-23)

**Date:** 2026-01-23 | **PR:** #308 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 10 | 15 | 4 |

**Patterns:**

- security-scanner-context-limitations
- file-type-validation-for-log-targets
- error-code-semantics-in-process-signals
- process-discovery-race-conditions
- args-arrays-over-template-interpolation
- log-target-type-validation
- process-signal-error-code-semantics
- process-disappearance-race-handling
- deprecated-command-elimination
- process-tree-termination
- cross-platform-newline-handling
- total-fixed
- final-file
- commits
- structured-audit-logging-hybrid-approach
- powershell-json-edge-case-handling
- subprocess-output-validation-nan-prevention
- process-matching-precision-security
- advisory-documented
- root-cause
- prevention

**Learnings:**

- CI security scanner blocked PR #308 merge with HIGH severity issues
- Root cause: Static analysis tools flag template interpolation in shell
- Prevention: Refactor to `execFileSync`/`spawnSync` with args arrays to
- Pattern: Even with validation, prefer args arrays over string interpolation
- Root cause: Writing to directories or FIFOs instead of regular files can be
- Prevention: Use `fstatSync(fd).isFile()` on Unix after opening,

---

### Review 200: PR #309 Round 4 - Qodo Final Security Hardening (2026-01-24)

**Date:** 2026-01-24 | **PR:** #309 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 3 | 0 |

**Patterns:**

- pattern-27-segment-based-path-containment-checks
- pattern-28-unicode-line-separator-log-injection
- pattern-29-input-length-dos-protection
- pattern-30-code-deduplication-via-module-exports
- improved-path-traversal-regex
- claudeprojectdir-absolute-path-validation
- binary-file-detection-in-precheck
- graceful-precheck-failure-handling
- segment-based-analysis
- unicode-characters
- input-length-caps
- code-deduplication
- pattern-compliance
- graceful-degradation
- root-cause
- prevention
- impact

**Learnings:**

- Round 4 final hardening after Rounds 1-3 (commits 925e397, 0d189e4,
- Root cause: `startsWith(".." + path.sep)` misses multi-segment traversal
- Prevention: Use `path.relative().split(path.sep)[0] === ".."` for
- Pattern: Path segment analysis is more robust than string prefix matching
- Impact: Prevents path traversal bypasses in containment validation
- Root cause: `\u2028` and `\u2029` Unicode separators bypass `\n\r`

---

### Review 201: PR #310 Learning Effectiveness Analyzer - Qodo Security Hardening (2026-01-24)

**Date:** 2026-01-24 | **PR:** #310 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 33 | 31 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 26 | 4 | 0 |

**Patterns:**

- pattern-31-git-option-injection-via-leading-dashes
- pattern-32-temp-file-hardening-with-wx-flag
- pattern-33-markdown-injection-in-generated-docs
- pattern-34-relative-path-logging
- pattern-35-markdown-metacharacter-escaping
- pattern-36-symlink-protection-for-generated-files
- pattern-37-empty-filename-fallback
- pattern-38-git-add--a-avoidance
- pattern-39-symlink-parent-directory-traversal
- pattern-40-git-pathspec-magic-injection
- pattern-41-repository-root-path-validation
- git-commands-with-paths
- generated-filenames
- temp-file-creation
- generated-markdown
- audit-trails-and-structured-logging
- markdown-escaping
- symlink-protection
- git-add--a
- symlink-checks-must-include-parents
- git-pathspec-magic
- all-paths-to-git
- root-cause
- prevention
- impact

**Learnings:**

- New learning effectiveness analyzer script with interactive
- Root cause: Filenames starting with `-` can be interpreted as git options
- Prevention: (a) Strip leading dashes from generated names with
- Pattern: Always use `["add", "--", path]` not `["add", path]` for git
- Impact: Prevents arbitrary git option injection via malicious filenames
- Root cause: Standard file creation can overwrite symlinked files

---

### Review 202: PR #311 Learning Effectiveness Analyzer + Security Infrastructure - Qodo (2026-01-24)

**Date:** 2026-01-24 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 22 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 5 | 8 | 7 | 2 |

**Patterns:**

- path-traversal-in---file-option
- toctou-race-in-safewritefile
- ssrf-allowlist-bypass
- symlinked-archive-reads
- duplicate-review-counting
- ci-regex-g-with-test
- ci-readfilesync-without-trycatch
- ci-empty-string-path-validation
- word-boundary-matching
- pattern-id-fallbacks
- email-masking-edge-case
- commit-message-newlines
- readfilesync-in-safereadfile
- markdown-table-malformed
- toctou-for-overwrite
- regex-dos-in-getpatterndetails
- saferegexexec-zero-length-match
- false-pattern-matches
- email-masking-subdomains
- pattern-checker-exclusions

**Learnings:**

- Added path.resolve + relative check +
- Removed existsSync, rely on atomic wx flag
- Block localhost/loopback, IP addresses, require
- Added lstatSync checks before reading archive
- Added seenReviewNumbers Set for deduplication
- Removed /g flag from boolean-only tests in
- Wrapped 3 occurrences with proper

---

### Review 204: Session #98 S0/S1 Guardrails PR - Qodo Compliance + CI (2026-01-26)

**Date:** 2026-01-26 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 11 | 1 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 2 | 2 | 0 |

**Patterns:**

- subshell-guardrail-bypass
- lint-staged-knip-false-positive
- readfilesync-pattern-compliance-false-positive
- utc-timezone-bug-in-getnextday
- command-injection-concern
- rolloutmode-env-configurable
- duplicate-validation-constants
- path-traversal-in-audit-s0s1-validatorjs
- trap-cleanup-bug
- fail-closed-on-invalid-dates
- silent-jsonl-parse-failures
- normalize-rolloutmode

**Learnings:**

- Pre-commit hook used `echo | while` which
- Knip flagged lint-staged as unused
- Non-UTC date parsing could cause
- Date strings interpolated into git commands.
- Made audit hook mode configurable via
- Noted duplication between

---

### Review 211: Session #103 Testing Infrastructure PR - Qodo + SonarCloud + CI (2026-01-27)

**Date:** 2026-01-27 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 18 | 0 | 2 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 0 | 1 |

**Patterns:**

- readfile-error-handling-with-context
- crlf-regex-line-89-milestones-overview
- crlf-regex-line-107-sprint-section
- bug-l141-conditional-same-value
- path-traversal-prevention
- test-factory-counter-vs-datenow
- warning-for-skipped-roadmapfuture-checks
- track-naming-regex-excludes-subsections
- pg-validation-matches-group-format
- scoped-version-history-regex
- session-102-103
- mcp-memory-vs-vector-db-decision
- --fix-cli-flag
- unstructured-logging
- 63-counter-based-unique-ids-for-test-factories
- 64-scope-regex-to-relevant-section
- 65-format-matching-for-validation-scripts

**Learnings:**

- Added `instanceof Error` check
- Changed regex to use `\r?\n`
- Changed regex to use `\r?\n` for
- Removed redundant ternary that returned
- Replaced `startsWith("..")` with regex
- Changed test data factory example in

---

### Review 212: Session #103 CI Fix - Pattern Checker False Positives (2026-01-27)

**Date:** 2026-01-27 | **Source:** ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 2 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 0 | 0 |

**Patterns:**

- readfilesync-without-trycatch-at-l39
- path-validation-empty-string-at-l175
- 66-pattern-checker-limitations

**Learnings:**

- CI BLOCKERS, BOTH FALSE POSITIVES):**
- FALSE POSITIVE. The `readFile`
- Fix: Added `check-roadmap-health.js` to `pathExcludeList` with audit
- FALSE POSITIVE. The condition at
- Fix: Added `check-roadmap-health` to `pathExclude` regex with audit comment
- Line-by-line pattern checks cannot

---

### Review 213: PR #321 Doc Compliance - Qodo + SonarCloud (2026-01-28)

**Date:** 2026-01-28 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 0 | 0 |

**Patterns:**

- broaden-pre-commit-doc-index-check
- simplify-regex-complexity
- url-decode-file-paths
- remove-redundant-return
- encode-parentheses-in-markdown-links
- cross-file-anchor-validation
- 67-unicode-property-escapes-for-emoji
- 68-markdown-link-parentheses-encoding
- 69-pre-commit-adm-filter

**Learnings:**

- ADM filter + quoted variables
- Unicode emoji regex + URL decoding
- Removed redundant return
- Purpose/Version History sections +
- Changed `--diff-filter=A` to
- SonarCloud flagged emoji regex at 27

---

### Review 214: PR #322 Alert System & Context Preservation - Qodo + SonarCloud + CI (2026-01-28)

**Date:** 2026-01-28 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 21 | 11 | 6 | 0 |

**Patterns:**

- directory-traversal-fix
- sensitive-data-persistence
- path-traversal-regex-character
- session-state-path-mismatch
- sessioncontextmd-path
- getrecentdecisions-order
- race-condition-data-loss
- sonarqube-regex-precedence
- type-check-always-report
- platform-root-search
- empty-alert-prevention
- replace-custom-alerting-with-standard-tools
- 70-existssync-readfilesync-race
- 71-pathrelative-security
- 72-regex-character-encoding
- 73-platform-agnostic-root

**Learnings:**

- Qodo PR Compliance + Code Suggestions, SonarCloud, CI Pattern Check
- Pattern Compliance):**
- Got oldest decisions, not newest. Changed to
- L47 in `generate-pending-alerts.js` needs
- ALWAYS wrap readFileSync in
- For containment validation, prefer

---

### Review 215: PR #324 Round 2 - Gap-Safe Consolidation Counting (2026-01-29)

**Date:** 2026-01-29 | **PR:** #324 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 7 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 0 | 1 |

**Patterns:**

- gap-safe-counting
- readwrite-location-mismatch
- root-cause
- prevention

**Learnings:**

- Root cause: Reviews may be skipped or deleted, leaving gaps in numbering
- Prevention: Use Set-based counting of unique review numbers > threshold
- Root cause: getLastConsolidatedReview only checks "Last Consolidation"
- Prevention: Add fallback to check "Consolidation Trigger" section where
- Fixed: 7 items (all suggestions applied)

---

### Review 216: PR #324 Round 3 - Defensive Math Operations (2026-01-29)

**Date:** 2026-01-29 | **PR:** #324 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 5 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 0 | 0 |

**Patterns:**

- mathmax-on-empty-array
- spread-operator-stack-limits
- script-parity
- root-cause
- prevention

**Learnings:**

- Root cause: Filter may produce empty array, spread to Math.max fails
- Prevention: Check filtered array length before calling Math.max
- Root cause: Spread converts array to function arguments (limited ~65k)
- Prevention: Use reduce() for unbounded arrays
- Root cause: Only updated one script's getLastConsolidatedReview
- Prevention: When updating shared logic, update all scripts

---

### Review 217: PR #325 Session #115 - Qodo + SonarCloud + CI (2026-01-29)

**Date:** 2026-01-29 | **PR:** #325 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 10 | 2 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 5 | 2 | 1 |

**Patterns:**

- command-injection-via-execsync
- detached-head-edge-case
- silent-git-failures
- basename-not-checked-for-exemptions
- override-flag-documented-but-not-implemented
- aria-accessibility-regression
- root-cause
- prevention

**Learnings:**

- Qodo Compliance + SonarCloud Security Hotspots + CI Pattern
- Root cause: `execSync(\`git push -u origin ${branch}\`)` vulnerable if
- Prevention: Use execFileSync with array arguments:
- Root cause: `git branch --show-current` returns empty string in detached
- Prevention: Check for empty branch before using in commands
- Root cause: getStagedFiles() swallows errors silently

---

### Review 218: TDMS Phase 1-8 PR - Qodo Compliance + CI (2026-01-31)

**Date:** 2026-01-31 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 26 | 26 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 4 | 9 | 11 | 2 |

**Patterns:**

- append-only-canonical-files
- api-pagination-required
- stable-ids-are-critical
- guard-against-missing-hash-fields
- safe-jsonl-parsing
- atomic-file-writes
- root-cause
- prevention

**Learnings:**

- Root cause: Initial implementation used writeFileSync without reading
- Prevention: Always read existing, merge, then write
- Root cause: SonarCloud API defaults to 500 results per page
- Prevention: Always check for pagination in API docs, implement fetch loops
- Root cause: generate-views.js reassigned IDs after sorting
- Prevention: IDs assigned once at creation, never modified

---

### Review 219: TDMS PR Follow-up - Qodo Compliance + CI (2026-01-31)

**Date:** 2026-01-31 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 25 | 25 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 9 | 14 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Copy-paste without consistent error handling patterns
- Prevention: All loadMasterDebt/loadItems functions need try-catch with line
- Root cause: Line 0 treated as valid when comparing distances
- Prevention: Require positive finite line numbers before proximity checks
- Root cause: No tracking of already-used IDs in current run
- Prevention: Track usedIds set during ID assignment

---

### Review 221: PR #327 Process Audit System - CI + Qodo (2026-01-31)

**Date:** 2026-01-31 | **PR:** #327 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 27 | 20 | 7 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 6 | 11 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- CI Pattern Compliance + Qodo Compliance + Qodo Code Suggestions +
- PR #327 (7-stage process audit system + recovery)
- Root cause: Line-based regex detection can't parse AST
- Prevention: Add verified files to pathExcludeList with audit comment
- Root cause: Context compaction can corrupt file formats
- Prevention: Validate JSONL before commit, remove blank lines
- Root cause: Glob patterns match the output file on re-runs

---

### Review 222: PR #327 Process Audit System Round 2 - Qodo (2026-01-31)

**Date:** 2026-01-31 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Error Handling & State Logic** (importance 8-9):
- FAIL/UNKNOWN shouldn't count
- Shell Safety** (importance 7):

---

### Review 223: PR #327 Process Audit System Round 3 - Qodo Security (2026-01-31)

**Date:** 2026-01-31 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Secure Error Handling** (Qodo Generic Compliance):
- Data Consistency** (importance 9):

---

### Review 224: Cross-Platform Config PR - CI Pattern Compliance + SonarCloud + Qodo (2026-02-02)

**Date:** 2026-02-02 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 27 | 27 | 0 | 7 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 17 | 0 |

**Patterns:**

- unsafe-errormessage-access
- clamp-percentages
- crash-on-missing-mcpservers
- invalid-timestamps-corrupt-metrics
- agent-diff-compares-names-not-content
- jsonparse-without-trycatch
- null-object-diffing
- statsync-race-condition
- empty-input-file
- negative-age-metrics
- arrayisarray-guard-for-todos
- atomic-writes
- write-failure-handling

**Learnings:**

- CI Pattern Compliance Failure + SonarCloud Security Hotspot + Qodo
- Script injection vulnerability
- Path containment, try/catch, percentage
- Path containment (4 locations), try/catch
- Fix: Pass PR body via environment variable instead of interpolation
- Fix: Add containment validation using path.relative check
- Fix: Wrap all file reads in try/catch

---

### Review 225: PR #329 Audit Documentation Enhancement - SonarCloud + Qodo (2026-02-02)

**Date:** 2026-02-02 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 52 | 0 | 5 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 0 | 0 |

**Patterns:**

- timeout-validation-missing
- http-redirects-marked-as-failures
- 405-method-not-allowed-not-retried
- planning-directory-excluded
- regex-operator-precedence-bug
- shell-redirection-order

**Learnings:**

- SonarCloud Security Analysis + Qodo Compliance + Qodo Code
- Fix: Added `isInternalIP()` function blocking RFC1918, localhost, link-local,
- Fix: Added validation with Number.isFinite() and range clamping
- Fix: Changed 3xx responses to `ok: true` with redirect info preserved
- HEAD requests returning 405 weren't
- Fix: Extracted `makeRequest()` helper, retry with GET on 405 response
- Fix: Changed filter to `entry.startsWith(".") && entry !== ".planning"`

---

### Review 226: ai-pattern-checks.js Enhancement - CI + SonarCloud + Qodo (2026-02-03)

**Date:** 2026-02-03 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 21 | 21 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 7 | 10 | 2 |

**Patterns:**

- path-validation-with-startswith
- regex-g-flag-with-test-in-loop
- readfilesync-without-explicit-trycatch-context
- sonarcloud-s5852-naivedatafetch-regex-dos
- sonarcloud-s5852-extractimports-regex-dos
- division-by-zero
- unvalidated-file-path
- multi-line-regex-detection-failure
- scoped-package-detection-bug
- multi-line-query-patterns
- score-clamping
- absolute-path-validation
- path-alias-support
- canonical-builtin-list
- deep-import-support
- word-boundaries
- re-export-detection
- packagejson-caching
- unused-variables-removed
- all-startswith-converted
- documentation-terminology
- pattern-exclusion-documentation
- qodo-19

**Learnings:**

- CI Pattern Compliance Failure + SonarCloud Security Hotspots + Qodo
- Line 83 used `startsWith("/")` which
- Fix: Converted to regex `/^[/\\]/.test()` for CI compliance
- Line 220 `detectAIPatterns()` used
- Fix: Rewrote to use `exec()` loop with fresh RegExp and zero-length match
- Fix: Removed existsSync, rely purely on try/catch. Added to pathExcludeList.

---

### Review 227: PR #331 Audit Comprehensive Staged Execution - Qodo + CI (2026-02-03)

**Date:** 2026-02-03 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 11 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 4 | 5 | 2 | 0 |

**Patterns:**

- prototype-pollution-in-jsonl-processing
- type-guards-before-string-methods
- user-context-for-audit-trails

**Learnings:**

- Qodo Compliance + CI Pattern Checker **PR:** #331
- Unsafe error.message access →
- Same error.message fix
- Fixed: 11 items (4 CRITICAL, 5 MAJOR, 2 MINOR)
- Deferred: 1 item (architectural)
- False Positives: 2 items (pattern checker doesn't detect multi-line try/catch

---

### Review 235: PR #332 Audit Documentation 6-Stage - Qodo/CI (2026-02-03)

**Date:** 2026-02-03 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 6 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 1 | 4 | 0 |

**Patterns:**

- redesign-episodic-memory-as-systemic-feature
- yaml-list-indentation
- yaml-explicit-empty-arrays
- prettier-function-name-splitting
- process-filtering-precision

**Learnings:**

- Qodo/CI Review Feedback **PR:** #332
- YAML syntax errors: improper list indentation for
- Episodic memory function name broken by Prettier across
- Python process filtering too broad. Generic
- JSON output for cycle detection (DEFERRED - current text
- Alert on missing circular dependency script instead of
- Anchor canonical paths regex for robustness:

---

### Review 236: PR #333 Audit Validation Wrapper - Qodo/CI (2026-02-03)

**Date:** 2026-02-03 | **PR:** #333 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 14 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 6 | 3 |

**Patterns:**

- secure-error-handling-compliance
- json-serialization-of-set-objects
- path-validation-for-cli-tools
- documentation-lint-requirements
- strict-overall-status-logic

**Learnings:**

- Deferred: 1 item (ajv schema validator - architectural change)
- Use sanitizeError() helper for all error messages in scripts
- Store unique fingerprints as array not Set for JSON serialization
- Add isPathWithinRepo() validation for CLI file inputs
- Support CRLF line endings with `/\r?\n/` split pattern

---

### Review 237: PR #334 transform-jsonl-schema.js Security Hardening - Qodo/CI (2026-02-03)

**Date:** 2026-02-03 | **PR:** #334 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 12 | 3 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 5 | 5 | 0 |

**Patterns:**

- path-traversal-prevention-with-regex
- path-containment-validation
- safe-error-message-access
- category-map-key-normalization
- guard-against-invalid-input-types
- --output-flag-validation
- readfilesync-trycatch-compliance
- file-existence-check-before-read

**Learnings:**

- Fixed: 12 items (2 CRITICAL CI, 5 MAJOR, 5 MINOR)
- Deferred: 3 items (ajv schema validation - architectural, intentional PII in
- False Positives: 2 (readFileSync IS in try/catch at line 374, file at line 471
- Pattern checker may have false positives for multi-line try/catch blocks
- File paths from `fs.readdirSync()` are system-provided, not user input
- Lowercase category map keys eliminate case-sensitivity bugs

---

### Review 238: PR #334 Round 2 transform-jsonl-schema.js Hardening - Qodo (2026-02-03)

**Date:** 2026-02-03 | **PR:** #334 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 19 | 16 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 5 | 4 | 8 | 3 |

**Patterns:**

- symlink-path-traversal-prevention
- atomic-file-writes
- parse-error-data-loss-prevention
- fingerprint-delimiter-sanitization
- field-validation-with-defaults
- confidence-normalization
- utf-8-bom-handling
- deep-merge-for-nested-structures

**Learnings:**

- Qodo PR Compliance + Code Suggestions + CI Pattern Check
- Fixed: 16 items (5 CRITICAL, 4 MAJOR, 4 MINOR, 3 TRIVIAL)
- False Positives: 3 (readFileSync at L497 IS in try/catch L496-502, file paths
- Pattern checker may flag false positives for variable names like `file` even
- Symlink resolution must happen BEFORE containment validation, not after

---

### Review 239: PR #334 Round 3 Security Hardening - Qodo (2026-02-03)

**Date:** 2026-02-03 | **PR:** #334 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 9 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 3 | 3 | 2 |

**Patterns:**

- critical---sensitive-path-exposure
- major---symlink-race-in-atomic-writes
- major---exit-code-propagation
- major---silent-failures-in---all-mode
- minor---predictable-temp-filenames
- minor---case-sensitivity-in-validation
- minor---cross-platform-rename
- trivial---directory-path-errors
- trivial---ci-exit-tracking

**Learnings:**

- Sensitive Path Exposure:** `validation-state.json` committed to
- Symlink Race in Atomic Writes:** Temp file creation vulnerable to
- Exit Code Propagation:** Script returns 0 even on errors, breaking
- Silent Failures in --all Mode:** Files that fail transformation are
- Predictable Temp Filenames:** Using just `.tmp` suffix allows race
- Case Sensitivity in Validation:** Severity/effort fields rejected

---

### Review 249: PR #336 Multi-AI Audit System - Qodo + SonarCloud + CI (2026-02-05)

**Date:** 2026-02-05 | **PR:** #336 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 55 | 1 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 0 | 7 | 1 |

**Patterns:**

- critical---path-traversal
- critical---ci-blocker
- major---cross-cutting-sources
- major---false-pass
- major---debt-id-instability
- s5852-dos-regex
- bounded-all-x

**Learnings:**

- Qodo PR Compliance + Code Suggestions + SonarCloud Quality Gate + CI
- Path traversal fix, snapshot field
- Path traversal fix, readFileSync
- Path traversal fix, cross-cutting
- Path validation regex, file path
- NaN confidence, Levenshtein
- Empty results guard, readFileSync

---

### Review 250: PR #337 Agent QoL Infrastructure - Qodo + CI (2026-02-05)

**Date:** 2026-02-05 | **PR:** #337 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 22 | 22 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 7 | 10 | 4 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo PR Compliance + Code Suggestions + CI Pattern Compliance
- Root cause: Utility functions trusted caller input
- Prevention: Always validate filenames are simple basenames in shared utils
- Root cause: Shallow spread operator replaced arrays
- Prevention: Use array concat for append-only collections
- Root cause: Pattern check ran on all changed files including archived ones
- Prevention: Add docs/archive/ to GLOBAL_EXCLUDE

---

### Review 251: PR #338 eval-sonarcloud Skill - Qodo + CI (2026-02-05)

**Date:** 2026-02-05 | **PR:** #338 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 26 | 24 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 12 | 8 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: eval-sonarcloud-report.js lacked validateSessionPath() unlike
- Prevention: Copy validateSessionPath pattern to ALL scripts accepting paths
- Root cause: Wrote code assuming existsSync guarantees read success
- Prevention: ALWAYS wrap readFileSync in try/catch, even after existsSync
- Root cause: Copy-paste from different sections without refactoring
- Prevention: Hoist shared file reads to function start

---

### Review 252: PR #338 eval-sonarcloud Skill Follow-up - Qodo (2026-02-05)

**Date:** 2026-02-05 | **PR:** #338 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 6 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Debug commands reveal partial/full tokens in process
- Prevention: Use stdin-based patterns like `curl --config -` for sensitive
- Root cause: Path validation used logical paths, not real paths
- Prevention: Use fs.realpathSync() to resolve symlinks before path
- Root cause: Destructuring only `items`, ignoring `errors` return value
- Prevention: Always check `errors` when calling loadJsonlFile

---

### Review 253: PR #338 eval-sonarcloud Symlink Defense - Qodo (2026-02-05)

**Date:** 2026-02-05 | **PR:** #338 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 8 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 1 | 4 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Applied fix to one function but not sibling functions with same
- Prevention: When fixing security pattern, grep for ALL instances across ALL
- Root cause: Hardcoded debug commands in generated report, separate from
- Prevention: Audit ALL output strings for sensitive command patterns
- Root cause: Brevity prioritized over debuggability
- Prevention: Always log parse failures, even when returning fallback

---

### Review 254: PR #338 Token Exposure + Parse Logging - Qodo (2026-02-05)

**Date:** 2026-02-05 | **PR:** #338 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 3 | 3 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 1 | 1 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Thought heredoc avoided expansion but `$VAR` outside quotes
- Prevention: Remove manual curl commands; use scripts that handle auth
- Root cause: Same pattern in same file, different function name
- Prevention: When fixing a pattern, grep for ALL functions with similar code
- Root cause: Added user context for audit trail without considering PII
- Prevention: Hash identifiers in logs to preserve traceability without

---

### Review 255: PR Cherry-Pick - Qodo Compliance + SonarCloud + CI (2026-02-06)

**Date:** 2026-02-06 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 22 | 22 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 6 | 12 | 1 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo Compliance + Qodo PR Suggestions + SonarCloud Quality Gate + CI
- Root cause: Script authored on Windows with hardcoded user path
- Prevention: Always use dynamic path.resolve(\_\_dirname, "../../")
- Root cause: Regex-based checker + exclusion list not updated for new files
- Prevention: Add verified try/catch files to exclusion list immediately
- Root cause: copyFileSync replaces entire file instead of merging updates
- Prevention: Use in-place update or merge strategy for sync operations

---

### Review 256: PR Cherry-Pick Round 2 - Qodo Suggestions + CI (2026-02-06)

**Date:** 2026-02-06 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 30 | 8 | 2 | 20 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 7 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo Compliance + Qodo PR Code Suggestions + CI Pattern Compliance
- Root cause: Regex negative lookahead only checks chars after match
- Prevention: Add file to pathExclude when `rel === ""` is at start of
- Root cause: Escape detection not guarded by `inString` flag
- Prevention: Always guard escape handling with string context check
- Root cause: replace() is not anchored to start of string
- Prevention: Use startsWith() + slice() for prefix removal

---

### Review 257: PR Cherry-Pick Round 3 - Qodo Compliance + Suggestions (2026-02-06)

**Date:** 2026-02-06 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 3 | 2 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Fallback rm+rename not wrapped in its own try/catch
- Prevention: Always wrap fallback with cleanup of tmp on failure
- Fixed: 3 items (Windows rename fallback in 3 files)
- Rejected: 2 items (audit trail completeness already has timestamp+action;
- Deferred: 2 items (PII in audit logs via os.userInfo() - intentional design
- Atomic file operations need defense-in-depth: try rename, catch → rm+rename,

---

### Review 258: PR Cherry-Pick Round 4 - Qodo Compliance + Suggestions (2026-02-06)

**Date:** 2026-02-06 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 4 | 2 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 3 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: String prefix matching is not path-aware
- Prevention: Use `path.relative()` + regex for all containment checks
- Root cause: Parsers don't filter non-JSON decorators
- Prevention: Skip lines starting with triple backticks
- Fixed: 4 items (path containment, trailing newline, rename fallback, fence
- Rejected: 3 items (source exfiltration by design, audit trail for CLI,

---

### Review 259: PR Cherry-Pick Round 5 - PII Scrub + Hardening (2026-02-06)

**Date:** 2026-02-06 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 5 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Eval scripts log absolute `path.resolve()` output into reports
- Prevention: Always use relative paths in generated reports
- Root cause: Audit trail needed operator identity but raw username is PII
- Prevention: Use getOperatorId() helper (CI="ci", local=hash, opt-in raw)
- Root cause: Two-step operation leaves gap for data loss
- Prevention: Use copyFileSync + unlinkSync (dest always has content)

---

### Review 260: PR #346 Audit Trigger Reset - Round 1 Qodo + SonarCloud + CI (2026-02-07)

**Date:** 2026-02-07 | **PR:** #346 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 8 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 3 | 3 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo PR Code Suggestions + SonarCloud Security Hotspots + CI
- Root cause: `seed-commit-log.js` used `execSync(cmd)` string form
- Prevention: Always use `execFileSync("binary", [args])`
- Root cause: `reset-audit-triggers.js` used unbounded regex quantifiers
- Prevention: Always add `\n` to negated character classes in table parsing
- Root cause: `check-session-gaps.js` used `{}` for groupBySession
- Prevention: Use `Object.create(null)` for any user-influenced map keys

---

### Review 261: PR #346 Audit Trigger Reset - Round 2 Qodo (2026-02-07)

**Date:** 2026-02-07 | **PR:** #346 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 4 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Incomplete find-replace when changing delimiters
- Prevention: Search for ALL occurrences of old delimiter when changing
- Root cause: No validation on parsed date from markdown
- Prevention: Always validate dates with
- Root cause: `reset-audit-triggers.js` displayName regex too strict
- Prevention: Use `[-\\s]+` pattern between word parts

---

### Review 262: PR #346 Audit Trigger Reset - Round 3 Qodo + SonarCloud (2026-02-07)

**Date:** 2026-02-07 | **PR:** #346 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 5 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Original hooks used string-based `execSync` for git commands
- Prevention: Always use `execFileSync` with array args for subprocess calls
- Root cause: Re-parsing YYYY-MM-DD string through Date constructor
- Prevention: Use original date string directly, don't round-trip through
- Root cause: Regex matched first table with category names
- Prevention: Read from specifically named section (fixed in R5)

---

### Review 263: PR #346 Audit Trigger Reset - Round 4 Qodo (2026-02-07)

**Date:** 2026-02-07 | **PR:** #346 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 3 | 3 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 1 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Same bug as `reset-audit-triggers.js` but in different function
- Prevention: Extract shared `toDisplayName()` helper for category names
- Root cause: Windows does not support POSIX rename-over semantics
- Prevention: Always add `rmSync(dest, {force:true})` before `renameSync`
- Root cause: Entries are JSON strings but could be corrupted
- Prevention: Wrap in try-catch via safe helper function

---

### Review 264: PR #346 Audit Trigger Reset - Round 5 Qodo (2026-02-07)

**Date:** 2026-02-07 | **PR:** #346 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 3 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 0 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: `getCategoryAuditDates()` matched against entire file content
- Prevention: Always scope markdown regex to the relevant `##` section
- Root cause: Generic `\d{4}-\d{2}-\d{2}` matches dates in comments/links
- Prevention: Anchor date regex to table row structure
- Root cause: `seed-commit-log.js` could write empty file if all hashes fail
- Prevention: Add length check + exit after validation loop

---

### Review 265: PR #346 Audit Trigger Reset - Round 6 Qodo (2026-02-07)

**Date:** 2026-02-07 | **PR:** #346 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 3 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 0 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: `saveJson()` did rmSync(dest) then renameSync(tmp, dest)
- Prevention: Use backup-swap pattern (dest→.bak, tmp→dest, rm .bak)
- Root cause: Automated review bots run on push, not on latest HEAD
- Prevention: Check commit hash in feedback header against current HEAD
- Fixed: 1 item (backup-swap saveJson)
- Already Fixed: 3 items (empty entries guard, section scoping, table date regex

---

### Review 266: PR #347 Doc-Optimizer + Artifact Cleanup - Qodo (2026-02-07)

**Date:** 2026-02-07 | **PR:** #347 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 3 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Agent findings used `path.resolve()` absolute paths
- Prevention: intake-audit.js should strip project root from file paths
- Fix: Python script to strip prefix from 15 entries in both JSONL files
- Root cause: Batch FALSE_POSITIVE script wrote to wrong field
- Prevention: Validate schema on write (resolution should be null or enum)
- Fixed: 3 items (15 PII paths stripped, 228 resolution fields moved, views

---

### Review 267: PR #352 Config Refactor Hardening - Qodo + CI (2026-02-09)

**Date:** 2026-02-09 | **PR:** #352 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 9 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 6 | 3 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo PR Compliance + Code Suggestions + CI Pattern Compliance
- Root cause: JSON configs are new (Session #142 refactor) — no error
- Prevention: Wrap top-level config loads in try/catch with graceful fallback
- Root cause: Regex-based pattern checker doesn't analyze scope nesting
- Prevention: Add verified-patterns.json entries for confirmed false
- Root cause: Quick refactor moved inline constant to loadConfig without
- Prevention: Cache config at module scope when used in hot loops

---

### Review 268: PR #352 Round 2 - Qodo + CI False Positives (2026-02-09)

**Date:** 2026-02-09 | **PR:** #352 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 1 | 0 |

**Learnings:**

- Pattern checker line numbers shift after edits — always re-verify false
- Module-scope `loadConfig()` needs try/catch even more than function-scope

---

### Review 269: PR #352 Round 3 - Qodo Security + Config Resilience (2026-02-09)

**Date:** 2026-02-09 | **PR:** #352 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 1 | 0 |

**Learnings:**

- Qodo PR Security Compliance + Code Suggestions (Round 3)
- Every module-scope `loadConfig()` call in the codebase needs try/catch — this
- Symlink guards needed even for internal tooling directories (`.claude/skills`)
- Silent catch blocks prevent diagnosis — always log at least a warning
- Fail-closed is the safe default for CI enforcement hooks when config is empty

---

### Review 270: PR #352 Round 4 - Qodo Config Guards + YAML Parsing (2026-02-09)

**Date:** 2026-02-09 | **PR:** #352 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 4 | 1 | 0 |

**Learnings:**

- Systematic pattern: every `loadConfig*()` at module scope across the codebase
- YAML block scalars (`|`, `>`) are common in SKILL.md frontmatter but the

---

### Review 271: PR #352 Round 5 - Qodo Regex + Config Guards (2026-02-09)

**Date:** 2026-02-09 | **PR:** #352 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 4 | 2 | 0 |

**Learnings:**

- Global `g` flag on regex used with `.test()` is a recurring bug pattern —
- Path-matching regex needs anchoring at path boundaries, not just substring
- All 10 config consumers from the Session #142 JSON extraction are now guarded

---

### Review 272: PR #352 Round 6 — Final loadConfig Sweep (2026-02-09)

**Date:** 2026-02-09 | **PR:** #352 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 8 | 2 | 0 |

**Learnings:**

- Instead of fixing one file per round, grep'd entire
- Zero unguarded loadConfig calls remain in codebase.

---

### Review 273: PR #353 — TDMS Pipeline Robustness (2026-02-09)

**Date:** 2026-02-09 | **PR:** #353 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 9 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 5 | 3 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo Compliance + Qodo Code Suggestions + CI Pattern Compliance
- Root cause: execFileSync catch blocks logged generic warnings without error
- Prevention: Always capture `(err)` and include
- Root cause: JSONL items from external sources may have string-typed line
- Prevention: Normalize line values with `Number()` before `Number.isFinite`
- Root cause: Condition only checked if existing had value, not if new item
- Prevention: Only copy preserved field when new item lacks it

---

### Review 274: PR #355 — GRAND PLAN Sprint 1 Code Quality Review (2026-02-10)

**Date:** 2026-02-10 | **PR:** #355 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 33 | 28 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 15 | 10 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Qodo Compliance + Qodo Code Suggestions + SonarCloud + CI Pattern
- Root cause: Wave refactoring preserved existsSync but didn't add try/catch
- Prevention: Pattern checker correctly catches these
- Root cause: Node v22 auto-detects ESM syntax; tsx handles TS files
- Prevention: Check for import statements before assuming CJS
- Root cause: Log entry pushed from matchResult without updating kept/removed
- Prevention: Always derive log fields from actual merge direction

---

### Review 275: PR #355 R2 — Qodo Round 2 Compliance + Suggestions (2026-02-10)

**Date:** 2026-02-10 | **PR:** #355 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 17 | 14 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 4 | 7 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Wave 2 TLA conversion preserved const destructuring
- Prevention: TypeScript strict mode catches this; run tsc before push
- Root cause: Qodo doesn't detect Node v22 ESM auto-detection
- Prevention: Document in rejection notes for future rounds
- Root cause: parseInt returns NaN for invalid input
- Prevention: Always validate parsed numeric args with Number.isFinite

---

### Review 276: PR #355 R3 — Qodo Round 3 Robustness + Coordinates (2026-02-10)

**Date:** 2026-02-10 | **PR:** #355 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 12 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 7 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: No validation between parse and write
- Prevention: Always validate parsed numbers before DB operations
- Root cause: Using truthy check on numeric values
- Prevention: Use typeof === "number" && Number.isFinite
- Root cause: R2 fix was too specific (ENOENT-only)
- Prevention: Security functions should always fail-closed

---

### Review 277: PR #355 R4 — Qodo Round 4 Defensive Guards + Shape Validation (2026-02-10)

**Date:** 2026-02-10 | **PR:** #355 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 4 | 6 | 0 |

**Learnings:**

- Fix: Use `uniqueUrlCount - failed` for consistent unique-URL counting

---

### Review 278: PR #355 R5 — Qodo Round 5 Critical Bug + Robustness (2026-02-10)

**Date:** 2026-02-10 | **PR:** #355 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 6 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: R2 refactored const→let but didn't catch the continue
- Prevention: Always verify control flow statements match their scope

---

### Review 279: PR #355 R6 — Qodo Round 6 Deterministic IDs + Loop Fix (2026-02-10)

**Date:** 2026-02-10 | **PR:** #355 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 0 | 0 | 7 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: R5 early-return refactor removed the if block that naturally
- Prevention: When flattening if-else with early continue, add break at end

---

### Review 280: Qodo Evidence Deduplication in JSONL Debt Files (2026-02-10)

**Date:** 2026-02-10 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 21 | 14 | 0 | 7 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 13 | 1 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Upstream aggregation script merges evidence without dedup
- Prevention: Created `scripts/debt/dedup-evidence.js` for batch cleanup;
- Fix: Script removes these automatically
- Fixed: 14 items (all via dedup script — 84 total entries fixed across 3 files)
- Rejected: 7 (R2: stale content_hash × 5, restore merged_from, schema change)
- Qodo found 14 instances but the script found 28 per file — always fix

---

### Review 281: PR #358 Sprint 2 — Shared State, Redaction, Key Stability (2026-02-10)

**Date:** 2026-02-10 | **PR:** #358 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 9 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 7 | 1 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Module-scope variables in React components are singletons
- Prevention: Never use module-level mutable state for per-instance data
- Fixed: 9 items (1 MAJOR, 7 MINOR, 1 TRIVIAL)
- Module-scope `Set`/`Map` in React components = shared singleton bug. Always
- PII redaction needs both value-pattern AND key-name matching for defense in
- When lists may have duplicate values, always use composite keys

---

### Review 282: PR #358 R2 — SSR Guards, Regex Simplification, Key Stability (2026-02-10)

**Date:** 2026-02-10 | **PR:** #358 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 26 | 24 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 21 | 2 |

**Learnings:**

- Fixed: 24 items (1 Major, 21 Minor, 2 Trivial)
- Rejected: 2 (auth-error-banner toast dedup — works correctly after #281 fix;
- Set-based key lookup is preferable to regex for sensitive field detection —
- When using `globalThis` for browser APIs, always guard with
- Firestore queries should use `limit()` when the max result count is known

---

### Review 283: PR #360 — IMS Pipeline Bug Fixes & Security Hardening (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 19 | 15 | 4 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 8 | 1 |

**Patterns:**

- severityimpact-field-mismatch
- blank-line-filtering-corrupts-line-numbers
- shallow-clone-insufficient-for-prototype-pollution
- root-cause
- prevention

**Learnings:**

- Root cause: Copy from TDMS code which uses `severity` field
- Prevention: Field name review when adapting code between systems
- Root cause: `content.split("\n").filter(...)` loses original line indexes
- Prevention: Iterate all lines, skip blanks inside loop
- Root cause: Incomplete recursive implementation
- Prevention: Always deep-clone when dealing with untrusted JSONL input

---

### Review 284: PR #360 R2 — Remaining severity/impact + Security Depth (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 8 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 3 | 4 | 0 |

**Patterns:**

- incomplete-severityimpact-sweep
- recursive-clone-without-depth-limit
- ims-routing-established
- root-cause
- prevention

**Learnings:**

- Qodo Compliance + Qodo Code Suggestions R2 + CI Failure
- Root cause: Searching for pattern in one function, not globally
- Prevention: Always `grep -n .severity` across entire file after field
- Fixed: 8 items (including 3 additional severity→impact bugs found by R2)
- Skipped: 2 items (regex lastIndex non-issue, counter_argument already tracked)
- Deferred to IMS: 2 items (ENH-0001, ENH-0002)
- When fixing a field rename (severity→impact), ALWAYS grep the entire file for

---

### Review 285: PR #360 R3 — Pre-commit Hook Fix, Final severity Sweep, Defensive Parsing (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 7 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 4 | 0 |

**Patterns:**

- documentationindexmd-prettier-ci-failure-3rd-occurrence
- severityimpact-in-resolve-itemjs220
- objectcreatenull-for-prototype-less-clones

**Learnings:**

- Pre-commit hooks that regenerate files MUST re-run formatters before staging
- Field renames across a codebase need `grep -rn` on the ENTIRE directory
- Three rounds to fully sweep severity→impact proves grep-first approach is
- Object.create(null) is safer than {} for untrusted data cloning

---

### Review 286: PR #360 R4 — Prototype Pollution, TOCTOU, Evidence Sanitization, CLI Robustness (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 8 | 3 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 0 | 1 |

**Patterns:**

- safecloneobject-must-be-applied-immediately-after-jsonparse
- toctou-in-path-validation
- evidence-array-type-sanitization
- utf-8-bom-on-first-line
- absolute-script-paths-in-execfilesync

**Learnings:**

- Deferred: 3 (1 new ENH-0003 Markdown injection, 2 already tracked)
- TOCTOU: always use validated/resolved path for all subsequent file operations
- Evidence arrays need type + trim + dedup sanitization (not just Array.isArray)
- BOM stripping is essential for cross-platform JSONL parsing
- CLI scripts must use \_\_dirname-relative paths for execFileSync portability
- Logging functions should never crash the main flow — wrap in try/catch

---

### Review 287: PR #360 R5 — impactSort Falsy Bug, ID Drift, Audit Outcome, Evidence Sanitization (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 7 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 0 |

**Patterns:**

- falsy-0-in-lookup-tables
- id-drift-from-line-suffixes-in-mergedfrom
- always-sanitize-not-just-on-merge
- audit-log-outcome-field

**Learnings:**

- Deferred: 1 (resource exhaustion — already DEBT-2747 S2 scope)
- Evidence sanitization must run unconditionally (no guard on secondary length)
- Audit logs need explicit outcome field (success/partial_failure/failure)
- BOM stripping needed in intake-audit.js too, not just validate-schema.js

---

### Review 288: PR #360 R6 — Semantic Merge Logic, PII in Logs, Timestamp Integrity, Path Normalization (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 8 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 0 | 0 |

**Patterns:**

- flag-only-vs-destructive-merge
- pii-in-audit-logs
- timestamp-integrity
- stateful-regex-in-loops

**Learnings:**

- Deferred: 2 (streaming JSONL — arch change; dedup audit coverage — scope
- Semantic match Pass 3 should flag-only, not merge — uncertain items need human
- PII compliance: hash usernames, log only basenames of file paths
- Spread order matters: `{ ...obj, timestamp }` protects system-generated fields
- Guard `RegExp.test()` in loops against stateful g/y flags
- Non-object JSON (null, arrays, primitives) can pass `JSON.parse()` — validate

---

### Review 289: PR #360 R7 — Symlink Guards, Pass 3 File Grouping, Schema Hardening, Honesty Guard (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 10 | 2 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 0 | 0 |

**Patterns:**

- symlink-file-overwrite
- pass-3-file-grouping
- honesty-guard
- schema-config-hardening

**Learnings:**

- Deferred: 2 (evidence dedup data fix, placeholder provenance data fix —
- Symlink guard pattern: `fs.lstatSync().isSymbolicLink()` before writes, ENOENT
- File grouping for pairwise passes reduces complexity proportionally to file
- Non-fatal operator hashing: initialize with fallback, single try/catch,
- Honesty guard: `counter_argument` required for enhancement-audit format inputs
- Whitespace-only strings should be treated as missing for required fields

---

### Review 290: PR #360 R8 — CI Fix, Pass 0 No-File Guard, Symlink Guards Expansion, Format Precision (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 11 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 8 | 0 |

**Patterns:**

- ci-blocker
- pass-0-no-file-guard
- symlink-guard-expansion
- enhancement-audit-format-precision
- pass-3-safety-cap

**Learnings:**

- Qodo Compliance R8 + Qodo Code Suggestions R8 + CI Failure
- Fixed: 11 items (2 CI blockers + 9 improvements)
- Deferred: 1 (evidence dedup data fix — pipeline handles)
- Pattern checker requires `instanceof Error` before `.message` — use canonical
- Pass 0 parametric dedup: items without `file` must not share group keys
- Enhancement-audit detection: check `typeof === "string" && trim()` and
- Fingerprint field needs type guard (`typeof !== "string"` → error, not crash)

---

### Review 291: PR #360 R9 — Prototype Pollution Guard, Fail-Closed Symlink, Atomic Writes (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 10 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- prototype-pollution
- fail-closed-symlink-guard
- atomic-write-for-canonical-output
- schema-stable-reviewneeded-entries
- symlink-guard-coverage

**Learnings:**

- Fixed: 10 items across 5 files
- Deferred: 1 (evidence dedup data fix — pipeline handles)
- Fail-closed: if lstat throws EACCES/EPERM, throw rather than silently continue
- Atomic write pattern: writeFileSync to `.tmp.${pid}` + renameSync + finally
- Acceptance evidence: sanitize with type coercion, trim, filter, and length cap
- BOM strip on first line + CRLF trimEnd prevents parse failures on

---

### Review 292: PR #360 R10 — Fail-Closed Guards, safeClone Coverage, DoS Cap, Audit Trail (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- assertnotsymlink-fail-closed
- safecloneobject-coverage-gap
- temp-file-hardening
- algorithmic-dos
- audit-trail
- pipeline-write-resilience

**Learnings:**

- Fixed: 11 items across 7 files (5 scripts + validate-schema + learnings log)
- Deferred: 1 (evidence data dedup — pipeline handles)
- Pairwise pass cap (MAX_PAIRWISE_ITEMS=5000) prevents quadratic blowup
- Pipeline append writes need try/catch + process.exit(2) for controlled failure
- Sanitize BOTH existing evidence and new acceptance evidence for consistency

---

### Review 293: PR #360 R11 — Markdown Injection, EEXIST Recovery, Windows Compat, Schema Validation (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- markdown-injection
- stale-temp-files
- deep-nesting
- non-fatal-fallback-writes
- cross-source-pollution
- terminal-escape-injection
- windows-compat

**Learnings:**

- Fixed: 11 items across 7 files (6 scripts + learnings log)
- EEXIST recovery: unlink stale tmp + retry with wx flag
- Fallback/regenerable files should use console.warn, not process.exit
- Terminal escape strip regex:
- Windows rename compat: `if (existsSync) unlinkSync` before `renameSync`
- Schema config arrays should be validated immediately after load

---

### Review 294: PR #360 R12 — CI Fix, TOCTOU Recheck, BiDi Strip, ID Validation, Log Decoupling (2026-02-11)

**Date:** 2026-02-11 | **PR:** #360 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 12 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- ci-failure
- toctou-recheck
- bidi-spoofing
- escapemarkdown-robustness
- id-propagation
- log-decoupling
- line-number-strictness

**Learnings:**

- CI Failure (ESLint no-control-regex) + Qodo Compliance R12 + Qodo
- Fixed: 12 items across 6 scripts + learnings log
- CI: green (0 ESLint errors)
- Extracted `sanitizeLogSnippet()` with compiled regexes at module scope for
- TOCTOU mitigation: re-assert symlink check immediately before destructive
- BiDi control chars: `/[\u202A-\u202E\u2066-\u2069]/g`

---

### Review 295: PR #359 — Unsafe err.message, Silent Catches, Full Filepath Logging (2026-02-10)

**Date:** 2026-02-10 | **PR:** #359 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 13 | 2 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 9 | 0 | 4 | 0 |

**Patterns:**

- unsafe-errmessage-access-recurring
- silent-catch-blocks
- root-cause
- prevention

**Learnings:**

- Root cause: Agent prompt didn't specify the safe pattern explicitly
- Prevention: Pattern checker catches this in CI; always use
- Root cause: Defensive "don't break hooks" approach went too far
- Prevention: Always log at minimum `console.warn` with context
- Fixed: 13 items (9 unsafe err.message, 2 silent catches, 2 filepath logging)
- Deferred: 2 items (atomic writes for state files — architectural change)

---

### Review 296: PR #359 R2 — Path Redaction, Atomic Writes, State Dir Fallback (2026-02-10)

**Date:** 2026-02-10 | **PR:** #359 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 7 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 5 | 0 |

**Patterns:**

- path-info-leakage-conflicting-reviews
- non-atomic-file-writes
- root-cause
- prevention

**Learnings:**

- Root cause: Reviewers optimize for different concerns
- Prevention: Default to `path.basename()` in hook logs
- Root cause: Original code used simple writeFileSync
- Prevention: Always use tmp+rename pattern for state files
- Fixed: 7 items (2 path redaction, 4 atomic writes, 1 state dir fallback)
- When reviewers conflict, security concerns take priority

---

### Review 297: PR #359 R3 — Windows Atomic Writes, Null State Dir, Evidence Dedup (2026-02-11)

**Date:** 2026-02-11 | **PR:** #359 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- state-utilsjs-getstatedir-null-fallback
- windows-safe-atomic-writes-7-locations
- debt-2450-evidence-dedup
- mergedfrom-unknown-removal

**Learnings:**

- Windows `fs.renameSync` fails if destination exists — always

---

### Review 298: PR #361 — Graduation State Safety, Append Flag, JSON Parse Guards (2026-02-12)

**Date:** 2026-02-12 | **PR:** #361 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 17 | 17 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 8 | 4 |

**Patterns:**

- root-cause
- prevention
- assessment
- v8-has-backtracking-limits-pre-commit-has-timeout-protection

**Learnings:**

- Qodo Compliance + SonarCloud + Qodo Code Suggestions + Doc Lint
- Root cause: Copied common Node.js pattern without thinking about atomicity
- Prevention: Direct read in try/catch, check err.code for ENOENT
- Root cause: "Best effort" state file didn't seem critical enough for atomic
- Prevention: All state files should use atomic write pattern
- Root cause: Didn't know about `{ flag: 'a' }` option

---

### Review 299: PR #361 R2 — Cognitive Complexity, ESLint Fixer Safety, Cross-Platform Fixes (2026-02-12)

**Date:** 2026-02-12 | **PR:** #361 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 23 | 18 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 10 | 10 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Mixed concerns in single functions (formatting + logic + I/O)
- Prevention: Extract formatting helpers (formatResultRow, printViolation,
- Root cause: Auto-fix assumed all statements could be wrapped in try/catch
- Prevention: Only auto-fix ExpressionStatements, return null for others
- Root cause: POSIX rename is atomic, Windows rename requires destination
- Prevention: unlinkSync destination before renameSync

---

### Review 300: PR #351 ROADMAP Cleanup - CI + Qodo + SonarCloud (2026-02-08)

**Date:** 2026-02-08 | **PR:** #351 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 8 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 6 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Mixed (CI failures, Qodo PR Suggestions, SonarCloud S5852)
- Root cause: Plan was written before doc linting was enforced
- Prevention: Doc header + section check runs in CI on all changed `.md`
- Root cause: Regex used nested `[\s\S]*?` quantifiers
- Prevention: Use string-based parsing (indexOf + split) for frontmatter
- Root cause: Set comparison was case-sensitive
- Prevention: Normalize to lowercase on both add and lookup

---

### Review 301: PR #342 Multi-AI Audit Data Quality - Doc Lint + Qodo (2026-02-06)

**Date:** 2026-02-06 | **PR:** #342 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 18 | 14 | 1 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Author wrote links relative to repo root, not file location
- Prevention: Doc lint catches this automatically; run before commit
- Root cause: Kimi model outputs non-standard severity format
- Prevention: fix-schema.js should normalize P-severity to S-severity
- Root cause: aggregate-category.js fingerprint matching not catching all
- Prevention: Add fingerprint normalization (lowercase, strip punctuation)

---

### Review 302: PR #361 R3 — Symlink Clobber, Backup-and-Replace, ESLint Loc Fallback, O(n) Index (2026-02-12)

**Date:** 2026-02-12 | **PR:** #361 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 10 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 6 | 1 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: mkdirSync + writeFileSync pattern doesn't check symlinks
- Prevention: Always lstatSync before writing to verify not a symlink
- Root cause: unlinkSync before renameSync is not atomic
- Prevention: backup-and-replace pattern (rename old to .bak, rename new,
- Root cause: Some parsers don't populate loc
- Prevention: Always guard with `target.loc ? ... : fallback`

---

### Review 303: PR #361 R4 — TOCTOU Symlink, Corrupt State Guard, Cognitive Complexity, Bug Fix (2026-02-12)

**Date:** 2026-02-12 | **PR:** #361 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 20 | 10 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 7 | 5 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: check-then-use pattern on filesystem
- Prevention: Call lstatSync directly, handle ENOENT in catch
- Root cause: Same fallback for "no file" and "corrupt file"
- Prevention: Return null for corruption, {} for ENOENT, caller uses ??
- Root cause: Copy-paste from different pattern format
- Prevention: Schema validation for pattern definitions

---

### Review 304: PR #361 R5 — State Wipe Prevention, Dir Symlink Guard, Fixer Safety (2026-02-12)

**Date:** 2026-02-12 | **PR:** #361 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 22 | 6 | 0 | 16 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: applyGraduation saved even when load failed
- Prevention: Track null vs {} separately, skip save on null
- Root cause: Only file-level symlink check, dir can also be a symlink
- Prevention: Check dir with isSymlink() before mkdirSync/writes
- Fixed: 6 items (state wipe prevention, dir symlink x2, isSymlink try/catch,
- Rejected: 16 items (repeats: String.raw, regex 38, i assignment, catch naming,

---

### Review 305: PR #362 R1 — IMS→TDMS Merge Cognitive Complexity + Code Quality (2026-02-12)

**Date:** 2026-02-12 | **PR:** #362 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- SonarCloud (5 issues) + Qodo Compliance (1) + Qodo Suggestions (8)
- Root cause: mapDocStandardsToTdms and mapEnhancementAuditToTdms had 60+
- Prevention: Extract mapFirstFileToFile + mapCommonAuditFields shared
- Root cause: Each field checked individually → high cognitive complexity
- Prevention: preserveEnhancementFields iterates field array
- Root cause: printProcessingResults had 3 nested print sections

---

### Review 306: PR #362 R2 — Edge Cases: Line 0, Falsy Fields, Windows Paths (2026-02-12)

**Date:** 2026-02-12 | **PR:** #362 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- prevention

**Learnings:**

- Prevention: Use `!== undefined` for numeric fields that can be 0
- Prevention: Use `!== undefined` for string fields that can be empty
- Prevention: Check for `.`, `/`, AND `\\` in path validation
- Fixed: QS-1 (line 0 edge case), QS-4 (preserveEnhancementFields !==
- Dismissed: SEC-1 (terminal escape - CLI tool), CMP-1/CMP-2 (pre-existing
- File path validation should handle Windows backslash separators

---

### Review 307: PR #362 R3 — SonarCloud Negated Condition + File Path Warning Guard (2026-02-12)

**Date:** 2026-02-12 | **PR:** #362 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- prevention

**Learnings:**

- Qodo Compliance (3) + Qodo Suggestions (5) + SonarCloud (1)
- Prevention: Put positive/meaningful case first with `=== undefined`
- Prevention: Guard with `normalizedFile &&` before validation
- Fixed: SC-1 (flip negated condition L128), QS-5 (guard file path warning)
- Dismissed: CMP-1 (operator field already present since R1), CMP-2 (historical
- SonarCloud "unexpected negated condition" catches real readability issues

---

### Review 308: PR #362 R4 — ReDoS Fix, Cognitive Complexity, Cross-Validation, Atomic Writes (2026-02-12)

**Date:** 2026-02-12 | **PR:** #362 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 18 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 0 | 0 |

**Patterns:**

- cross-validation-must-apply-mismatch-not-just-warn
- cognitive-complexity-reduction-via-function-extraction
- backup-swap-atomic-write-with-tryfinally-cleanup
- replaceall-over-replace-with-g-flag
- regex-operator-precedence----needs---
- capture-output-once-in-shell-hooks

**Learnings:**

- SonarCloud (1 CRITICAL) + Qodo Compliance (6) + Qodo Suggestions

---

### Review 309: PR #362 R5 — ReDoS Overlapping Quantifiers, Complexity Extraction, Multiline Regex (2026-02-12)

**Date:** 2026-02-12 | **PR:** #362 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cognitive-complexity-reduction-via-standalone-function-extra
- jsonstringify-over-manual-string-escaping-in-templates
- scope-regex-character-classes-to-single-lines-with-n
- shell-if-varcmd-for-set--e-safety

**Learnings:**

- SonarCloud (2 S5852 + 3 code smells) + Qodo Suggestions (8)

---

### Review 310: Qodo PR Suggestions — Alerts v3 Health Score, Edge Cases, Path Normalization (2026-02-13)

**Date:** 2026-02-13 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 3 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 2 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: `continue` on missing categories + dynamic `totalWeight`
- Prevention: Always normalize against fixed total possible weight
- Root cause: No parent commit to diff against
- Prevention: Fallback to empty tree hash
- Root cause: Audit tool outputs Windows paths
- Prevention: Normalize at ingest time

---

### Review 311: SonarCloud + Qodo — PR #365 Audit Ecosystem Branch (2026-02-14)

**Date:** 2026-02-14 | **PR:** #365 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 33 | 33 | 0 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 21 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- SonarCloud Issues/Hotspots + Qodo PR Suggestions + Qodo Compliance
- Root cause: PATTERN_KEYWORDS array uses `/gi` flags
- Prevention: Always reset `lastIndex = 0` or use `exec()` pattern
- Root cause: Unix-first development, untested Windows paths
- Prevention: Always normalize with `replaceAll("\\", "/")` in hooks
- Root cause: Using single regex alternation for file exclusion lists
- Prevention: Use `pathExcludeList` (string array) instead of regex

---

### Review 312: CI Regex Complexity + Qodo R2 — PR #365 (2026-02-14)

**Date:** 2026-02-14 | **PR:** #365 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 8 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 7 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: `(?=\r?\n\r?\n|\r?\n##|\r?\n---)` — 3 alternatives with shared
- Fix: `(?=\r?\n(?:\r?\n|##|---))` — factor out common `\r?\n`
- Root cause: Regex not constrained to header area
- Prevention: Slice content to header area (first 4000 chars) before matching
- Fixed: 8 items across 5 files

---

### Review 313: CI Feedback + Qodo R3 — Orphaned DEBT + Bounded Regex (2026-02-14)

**Date:** 2026-02-14 | **PR:** #365 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 6 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: Dedup heuristic too aggressive on similar entries
- Prevention: Cross-check ROADMAP.md references before dedup
- Root cause: Direct object spread from parsed config
- Prevention: Use `Object.create(null)` + skip dangerous keys
- Root cause: Regex assumes `##` directly followed by whitespace+text
- Prevention: Use `##\s*(?:[^\w\r\n]+\s*)?Name` for emoji tolerance

---

### Review 314: SonarCloud Regex Hotspots + Qodo Robustness R4 — PR #365 (2026-02-14)

**Date:** 2026-02-14 | **PR:** #365 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 13 | 13 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 5 | 6 | 0 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
- Root cause: Function kept as stub but regex not removed
- Prevention: When disabling a check, remove the regex too
- Root cause: Off-by-one in O(n) optimization from Review #255
- Prevention: Always set `lastIdx = match.index + match[0].length`
- Root cause: Alternatives added incrementally without refactoring
- Prevention: Factor common prefixes in regex alternations

---

### Review 315: SonarCloud + Qodo R5 — Residual Regex, Stack Traces, Windows Compat (2026-02-14)

**Date:** 2026-02-14 | **PR:** #365 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 13 | 13 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 4 | 7 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
- Root cause: Incomplete sanitization — caught + logged but then rethrown
- Prevention: Use `process.exit(1)` instead of `throw` when error is fatal
- Root cause: Regex was the initial tool; never reconsidered as complexity
- Prevention: For section extraction, prefer split-and-scan over regex
- Root cause: Pattern added in Review #255 without Windows testing
- Prevention: Always `unlinkSync(dest)` before `renameSync(src, dest)`

---

### Review 316: PR #366 R1 — SonarCloud Regex + Qodo Robustness + CI Blockers (2026-02-14)

**Date:** 2026-02-14 | **PR:** #366 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 21 | 0 | 6 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 4 | 11 | 0 |

**Learnings:**

- SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
- New: `testFn` alternative to `pattern` field in pattern compliance checker

---

### Review 317: PR #366 R2 — SonarCloud Two-Strikes + Qodo Robustness (2026-02-15)

**Date:** 2026-02-15 | **PR:** #366 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 0 | 3 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 8 | 0 |

**Patterns:**

- sonarcloud-s5852-two-strikes-rule-applied
- git-status---porcelain--z-renamecopy-parse-bug
- defensive-state-shape-normalization
- atomic-write-consistency
- numberisfinite-guard-for-timestamp-purging

**Learnings:**

- SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
- Two-strikes regex→string (2), rename/copy parse (1), sprint type
- DEBT-2957 (project dir escape — architectural), DEBT-2958

---

### Review 318: PR #366 R3 — Atomic Write Hardening + State Normalization (2026-02-15)

**Date:** 2026-02-15 | **PR:** #366 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 0 | 4 | 1 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 10 | 0 |

**Patterns:**

- backup-swap-atomic-writes
- mkdirsync-before-atomic-write
- state-shape-normalization
- git-porcelain-record-validation
- numberisfinite-guards

**Learnings:**

- DEBT-2960 (symlink overwrite in rotate-state.js —
- Chunk-based line counting for large-context-warning.js — byte

---

### Review 319: PR #366 R4 — Symlink Guard + Future Timestamp + Skip-Abuse Bug (2026-02-15)

**Date:** 2026-02-15 | **PR:** #366 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 5 | 0 |

**Patterns:**

- symlink-write-guard-in-savejson
- future-timestamp-defense
- skip-abuse-alert-24h7d-data-mismatch-bug
- crlf-jsonl-parsing-on-windows
- consistent-caps-on-file-lists

**Learnings:**

- Symlink guard (1), future timestamp (1), skip-abuse bug (1), CRLF
- DEBT-2957 (env path trust), DEBT-2958 (audit trails),

---

### Review 320: PR #366 R5 — Parent Dir Symlink + Clock Skew + Prototype Pollution (2026-02-15)

**Date:** 2026-02-15 | **PR:** #366 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 8 | 0 |

**Patterns:**

- parent-directory-symlink-attack
- clock-skew-defense
- prototype-pollution-via-counter-objects
- symlink-check-on-reads
- size-based-rotation-guard

**Learnings:**

- Same files appearing 3+ consecutive rounds — holistic

---

### Review 321: PR #366 R6 — Shared Symlink Guard + Self-Healing Cooldown + Bug Fixes (2026-02-15)

**Date:** 2026-02-15 | **PR:** #366 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 0 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 9 | 1 |

**Patterns:**

- shared-symlink-helper
- self-healing-future-timestamps
- toctou-race
- milestone-string-bug
- hook-output-protocol

**Learnings:**

- Created shared `.claude/hooks/lib/symlink-guard.js` with

---

### Review 322: PR #366 R7 — Comprehensive Symlink Guard Hardening (2026-02-15)

**Date:** 2026-02-15 | **PR:** #366 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 9 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Every atomic write needs `isSafeToWrite()` on BOTH the target
- When introducing a shared security helper, audit ALL write paths in

---

### Review 324: PR #367 R1 — Alerts Overhaul Security + Code Quality (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 30 | 36 | 7 | 7 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- SonarCloud (24) + Qodo PR Compliance (6) + Qodo Code Suggestions
- Parallel 3-agent review processing (security / code quality / hooks+docs)
- First use of propagation check on new scripts added in same PR
- SonarCloud cognitive complexity deferrals (6 items, all pre-existing CC 16-64)

---

### Review 325: PR #367 R2 — Trend Bug, Suppression Logic, Security Hardening (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 40 | 21 | 6 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 7 | 12 | 2 |

**Patterns:**

- r1-agent-incomplete-fixes
- exit-trap-overwrite
- category-wide-suppression-blocked

**Learnings:**

- CI (Prettier) + SonarCloud (15) + Qodo PR Compliance (5) + Qodo Code
- Parallel agent results need explicit verification against the original item
- Shell EXIT trap chaining requires capturing previous trap with `trap -p EXIT`
- SonarCloud cognitive complexity items are consistently pre-existing (CC 16-64)

---

### Review 326: PR #367 R3 — Weight Normalization, CC Reduction, Symlink Guards (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 8 | 6 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- tool-conflict-resolution
- cc-reduction-via-extraction
- type-safe-defensive-coding

**Learnings:**

- SonarCloud (11) + Qodo PR Compliance (2) + Qodo Code Suggestions (8)
- When tools conflict (SonarCloud vs pattern compliance), document the conflict
- Health score weight normalization is already handled by `measuredWeight`
- Deduplicating extracted learnings with a Set prevents data quality issues in

---

### Review 327: PR #367 R4 — Fail Closed, Log Injection, Trap Chaining, Input Normalization (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 13 | 6 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- fail-closed-security
- log-injection-prevention
- shell-trap-chaining

**Learnings:**

- SonarCloud (9) + Qodo PR Compliance (5) + Qodo Code Suggestions (10)
- Fail-open fallbacks for security modules are a recurring anti-pattern
- Shell EXIT traps must be chained, not overwritten
- Running validate-audit.js twice is wasteful; capture output once

---

### Review 328: PR #367 R5 — Suppression Validation, POSIX Portability, Newline Propagation (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 9 | 6 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- suppression-type-guard
- posix-portability
- propagation-miss
- enoent-preservation

**Learnings:**

- SonarCloud (8) + Qodo PR Compliance (5) + Qodo Code Suggestions (9)
- Propagation checks must cover BOTH shell hooks AND JS scripts that handle the
- Suppression files are external input — always validate entry types before

---

### Review 329: PR #367 R6 — Control Chars, suppressAll, POSIX CR Fix, Severity Normalization (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 5 | 6 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- control-char-length-validation
- suppressall-explicit-flag
- posix-cr-detection
- severity-normalization

**Learnings:**

- SonarCloud (8) + Qodo Compliance (3) + Qodo Suggestions (5)
- Control character validation catches more injection vectors than just CR/LF
- Category-wide suppression is a dangerous footgun — require explicit opt-in
- Shell portability: `$'...'` ANSI-C quoting is bash-only, not POSIX sh
- Propagation of validation patterns across all 3 JS scripts + 2 shell hooks

---

### Review 330: PR #367 R7 — codePointAt, suppressAll Category Guard, Code Fence Parsing, EXIT Trap (2026-02-16)

**Date:** 2026-02-16 | **PR:** #367 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 8 | 6 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- codepointat-vs-charcodeat
- suppressall-requires-category
- code-fence-awareness
- posix-exit-trap-chaining
- shell-control-char-validation

**Learnings:**

- SonarCloud (11) + Qodo Compliance (2) + Qodo Suggestions (8)
- Category-wide suppression needs both `suppressAll: true` AND a valid category
- Markdown parsing must account for code fences to avoid false header matches
- Shell trap chaining via sed is fragile; a helper function is more maintainable
- Always propagate validation patterns from JS to shell hooks and vice versa

---

### Review 331: PR #368 R3 — Symlink Hardening, shell:true Elimination, Ternary Extract (2026-02-16)

**Date:** 2026-02-16 | **PR:** #368 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 13 | 12 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- symlink-guard-must-check-file-and-directory
- shelltrue-cmd-suffix-on-windows
- nested-ternaries-are-sonarcloud-code-smells
- capture-error-in-catch-blocks
- truncate-user-supplied-audit-fields
- spawnsync-needs-statuserror-checks

**Learnings:**

- SonarCloud (1) + Qodo Compliance (5) + Qodo Suggestions (7)
- Round 2 found the symlink guard from R1 was incomplete (checked dir but not
- The shell:true issue persisted across 4 compliance rounds because the fix was
- Non-canonical categories in TDMS examples (`cross-domain`) would break

---

### Review 332: PR #368 R4 — DoS Length Check, Fingerprint Stability, File Perms (2026-02-16)

**Date:** 2026-02-16 | **PR:** #368 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 8 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- length-check-before-expensive-iteration
- deterministic-fingerprint-generation
- restrictive-file-permissions-on-audit-logs
- schema-alignment-fingerprint-vs-id

**Learnings:**

- SonarCloud (2) + Qodo Compliance (5) + Qodo Suggestions (5)
- Qodo compliance continues to flag SKIP_REASON persistence as a risk across
- The symlink guard ancestor-directory claim is incorrect — `realpathSync`

---

### Review 333: PR #368 R5 — TOCTOU fd-Write, Argument Injection, Symlink Directory Guard (2026-02-16)

**Date:** 2026-02-16 | **PR:** #368 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 13 | 8 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- toctou-in-file-creation-write
- argument-injection-via-concatenated-flags
- symlink-directory-pre-check
- dont-propagate-invalid-input
- appendfilesync-has-a-race-window-using-a-single-opensynca-0o

**Learnings:**

- Qodo Compliance (3) + Qodo Suggestions (9) + SonarCloud (1)
- SonarCloud Security Hotspot matched the TOCTOU race already identified by Qodo
- Qodo compliance continues to flag SKIP_REASON stdout logging (R3, R4, R5) —
- The `e?.cause?.code` pattern for Node.js error chain traversal improves

---

### Review 334: PR #368 R6 — fstatSync fd Validation, Empty-Reason-on-Failure, EXIT Trap Robustness (2026-02-16)

**Date:** 2026-02-16 | **PR:** #368 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 8 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- fstatsync-after-fd-open
- never-return-unsafe-values-on-validation-failure
- shell-trap-chaining-via-variable-accumulation
- propagation-template-changes-must-update-live-code

**Learnings:**

- Qodo Compliance (3) + Qodo Suggestions (7) + SonarCloud (2 Hotspots)
- SonarCloud 2 Security Hotspots were the same TOCTOU/symlink pattern from R5.
- Qodo compliance continues to flag SKIP_REASON persistence (R3-R6) — by-design,
- Pseudocode in SKILL.md needs the same rigor as production code — `groupBy`

---

### Review 336: PR #369 R2 — CC Reduction, Push Batching, Symlink Guards, Line Normalization (2026-02-17)

**Date:** 2026-02-17 | **PR:** #369 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 5 | 24 | 0 | 14 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cc-extraction-helpers
- arraypush-batching
- normalizereporelpath
- table-column-alignment
- numberisfinite-for-line-0

**Learnings:**

- SonarCloud (18 Issues + 3 Hotspots) + Qodo Compliance (5) + Qodo
- S5852 regex DoS (3): Linear regex `(\d+)\s+commits` has no backtracking risk
- S4036 PATH lookup (2): Dev CLI tools, not production server code
- TOCTOU race: Acceptable for local dev tooling
- JSONL data quality (6): Pre-existing entries outside PR diff scope

---

### Review 337: PR #369 R3 — Repo Containment, Canonical Categories, Date Validation, Write Guard (2026-02-17)

**Date:** 2026-02-17 | **PR:** #369 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 3 | 7 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- repo-containment-for-cli-input
- dir-to-canonical-category-mapping
- sincedate-validation
- writefilesync-trycatch
- string-line-normalization-in-getfileref

**Learnings:**

- SonarCloud (1 Hotspot + 2 Issues) + Qodo Compliance (3) + Qodo

---

### Review 338: PR #369 R4 — realpathSync Hardening, Atomic Write, Fail-Fast JSONL (2026-02-17)

**Date:** 2026-02-17 | **PR:** #369 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 6 | 0 | 6 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- realpathsync-lstatsync-for-path-containment
- atomic-write-pattern
- fail-fast-on-invalid-jsonl
- early-return-on-invalid-date

---

### Review 339: PR #369 R5 — CC Extraction, tmpFile Symlink, ISO Date Normalization (2026-02-17)

**Date:** 2026-02-17 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 2 | 7 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- extract-validateinputpath-for-cc-reduction
- tmpfile-symlink-guard
- iso-timestamp-normalization
- guard---apply-loop-against-closedfiltered-items
- cross-platform-atomic-rename

**Learnings:**

- SonarCloud (1 CC Issue) + Qodo Security (1) + Qodo Compliance (1) +

---

### Review 340: PR #369 R6 — CC Extraction x2, wx Flag, Atomic writeMasterDebt, Collision Detection (2026-02-17)

**Date:** 2026-02-17 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 7 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- extract-guardsymlink-atomicwrite-for-cc-reduction
- extract-classifyopenitems-applyresolutions-for-cc-reduction
- exclusive-create-flag-wx
- atomic-write-for-writemasterdebt
- return-canonical-path
- finding-key-collision-detection
- -apply-logic-into-separate-functions

**Learnings:**

- SonarCloud (2 CC Issues) + Qodo Security (1) + Qodo Suggestions (8)

---

### Review 341: PR #369 R7 — CC indexByKey, Ancestor Symlink, fstatSync Forward Scan, Error -1 (2026-02-17)

**Date:** 2026-02-17 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 7 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- extract-indexbykey-for-cc-reduction
- ancestor-symlink-containment
- dir-dest-symlink-guards-in-fallback
- fstatsync-forward-scan
- return--1-on-git-error

**Learnings:**

- SonarCloud (1 CC Issue) + Qodo Security (2) + Qodo Compliance (2) +

---

### Review 342: PR #369 R8 — CC buildResults+statusIcon, guardSymlink+safeRename, Symlink Walk, detectAndMapFormat (2026-02-17)

**Date:** 2026-02-17 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 3 | 8 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- extract-buildresultsstatusicon-for-cc-reduction
- extract-guardsymlinksaferename-for-cc-reduction
- skip-symlinks-in-directory-walk
- restrict-fstatsync-scan-to-opensync
- sequential-format-detection
- error-field-as-string
- silent-error-in---json-mode

**Learnings:**

- SonarCloud (3 Issues) + Qodo Security (1) + Qodo Compliance (2) +

---

### Review 343: PR #369 R9 — Fail-Closed guardSymlink, Non-Object Guard, Pattern Recognizer, Source ID Regex (2026-02-17)

**Date:** 2026-02-17 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 5 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- fail-closed-guardsymlink
- non-object-guard-in-detectandmapformat
- recognize-guardsymlink-in-pattern-checker
- source-id-regex-alignment
- file-path-normalization-warning

---

### Review 344: PR #370 R2 — resolve-bulk.js hardening, MASTER_DEBT data quality, orphaned ROADMAP refs (2026-02-17)

**Date:** 2026-02-17 | **PR:** #370 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 10 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- path-traversal-on-cli---output-json
- sonarcloud-i-assignment
- duplicated-write-blocks
- orphaned-roadmap-debt-refs
- lint-staged-evidence-loss
- generate-viewsjs-overwrites-masterdebt

**Learnings:**

- SonarCloud (1) + Qodo Compliance (3) + Qodo Suggestions (5) + CI (2)

---

### Review 345: PR #370 R3 — parseArgs CC+i refactor, writeOutputJson hardening, generate-views preservation (2026-02-17)

**Date:** 2026-02-17 | **PR:** #370 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 11 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- for-loop-i-assignment
- cc-reduction-via-extraction
- symlink-check-ordering
- generate-viewsjs-overwrites
- cross-platform-rename
- source-data-normalization

**Learnings:**

- SonarCloud (4) + Qodo Suggestions (6) + User Request (1)

---

### Review 346: PR #370 R4 — dynamic path prefix, merged defaults, unknown arg guard, negated condition (2026-02-17)

**Date:** 2026-02-17 | **PR:** #370 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 8 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- hard-coded-path-prefix
- merged-items-bypass-pipeline
- unknown-args-silently-ignored
- negated-condition-readability

**Learnings:**

- SonarCloud (1) + Qodo Suggestions (5) + Qodo Compliance (5)

---

### Review 347: PR #370 R5 — TOCTOU file path, CWD-independent normalization, trailing slash preservation (2026-02-17)

**Date:** 2026-02-17 | **PR:** #370 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 6 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- toctou-on-validated-path
- cwd-dependent-pathresolve
- path-normalization-strips-trailing-slash
- repeat-items-converging

---

### Review 348: PR #371 R1+R2 — SonarCloud S5852 regex DoS, CC refactoring, atomic writes, symlink guards (2026-02-17)

**Date:** 2026-02-17 | **PR:** #371 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 2 | 31 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- regex-dos-false-positives-s5852
- cc-explosion-in-parsing-functions
- atomic-write-consistency
- symlink-guard-propagation
- extracted-helpers-still-exceeding-cc-15
- options-object-pattern

**Learnings:**

- R1: SonarCloud (10 hotspots + 12 issues) + Qodo Compliance (2) +
- R1: 31/34 fixed (91%), 3/34 rejected. R2: 7/11 fixed

---

### Review 350: PR #374 R1 — Bidirectional Containment, Fail-Closed Guard, backupSwap Safety (2026-02-17)

**Date:** 2026-02-17 | **PR:** #374 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 8 | 4 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- bidirectional-containment-on-env-vars
- fail-closed-fallback
- backupswap-data-loss
- propagation-win
- seed-data-immutability
- 1-bidirectional-containment-on-env-vars-claudeprojectdir-res

**Learnings:**

- Qodo Compliance + CI (Prettier) + SonarCloud Duplication
- When extracting shared libraries from hooks, the security

---

### Review 351: PR #374 R2 — Path Sep Boundary, New-File Guard, Evidence Dedup (2026-02-17)

**Date:** 2026-02-17 | **PR:** #374 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 3 | 3 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- path-separator-boundary
- realpathsync-on-new-files
- evidence-dedup
- 1-path-separator-boundary-startswithdir-without-pathsep-allo

---

### Review 352: PR #374 R3 — Descendant Containment, backupSwap Copy, mkdirSync Order, CI Fix (2026-02-17)

**Date:** 2026-02-17 | **PR:** #374 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 7 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- descendant-only-containment
- backupswap-copy-fallback
- mkdirsync-before-issafetowrite
- issafetowrite-hooks-dir
- npm-ua-parsing-crash
- masterdebt-orphaned-refs
- 1-descendant-only-containment-bidirectional-startswith-allow

**Learnings:**

- The MASTER_DEBT/deduped.jsonl sync is fragile. When deduping

---

### Review 353: PR #427 R2 — Security Fail-Closed, Error Safety Codemod, Bulk Lint (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 21 | 18 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 6 | 8 | 3 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Mixed (Qodo Compliance, Semgrep, SonarCloud, CI, Qodo Suggestions)
- Root cause: R1 introduced try/catch guards but used fail-open fallback
- Prevention: ESLint rule for fail-open patterns in security guard loading
- Root cause: Pattern accumulated over time, no auto-fixer existed
- Prevention: Added auto-fixer to ESLint rule + ConditionalExpression guard
- Root cause: Inconsistent application of atomic write best practice

---

### Review 354: PR #427 R4 — TOCTOU Hardening, Sanitize Fallbacks, Semgrep Rule ID Fix (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 25 | 20 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 11 | 8 | 4 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Mixed (Qodo Compliance + Suggestions, Semgrep/CodeQL, CI Pattern
- Root cause: Single upfront check doesn't protect retry/fallback paths
- Prevention: Re-check isSafeToWrite immediately before each mutation op
- Root cause: Original fallback only truncated, didn't sanitize
- Prevention: Propagation sweep caught all 6 instances (2 flagged + 4 found)
- Root cause: nosemgrep comments copied from community rule, not updated for

---

### Review 355: Gemini Code Assist — EXIT Trap, Evidence Dedup, mktemp Guards (2026-02-19)

**Date:** 2026-02-19 | **PR:** #379 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 3 | 1 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- silent-hook-output-after-posix-migration
- object-dedup-by-reference-vs-value
- mktemp-mv-error-handling

**Learnings:**

- When replacing bash-isms with POSIX equivalents, audit the DX

---

### Review 356: PR #431 R2 — Data Effectiveness Audit Schema & Security Fixes (2026-03-13)

**Date:** 2026-03-13 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 54 | 54 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 8 | 21 | 23 |

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
|-------|-------|----------|----------|
| 16 | 16 | 0 | 10 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 8 | 14 | 2 |

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

### Review 358: PR #431 R4 — Modernization, Complexity & Data Guards (2026-03-14)

**Date:** 2026-03-14 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 37 | 37 | 0 | 15 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 3 | 0 | 34 |

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
|-------|-------|----------|----------|
| 11 | 11 | 0 | 7 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 9 | 7 |

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
|-------|-------|----------|----------|
| 14 | 14 | 0 | 6 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 12 | 7 |

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
|-------|-------|----------|----------|
| 17 | 6 | 0 | 11 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 9 | 7 |

**Learnings:**

- Fixed: 6 items across 5 files
- Rejected: 11 items (4 cross-round dedup R4-R6, 1 intentional TODO scaffold, 6
- Set.has for tableContent (R4+R5+R6 dedup — string.includes())
- Set.has for antiPatternSection (R4+R5+R6 dedup — string.includes())
- Type-dependent design (R4+R5+R6 dedup — simple boolean)
- OS temp dir for test (R3+R4 dedup — repo boundary needed)

---

### Review 362: PR #382 R1 — Regex DoS, Severity Mapping Bug, Table Parsing, 49 Items (2026-02-20)

**Date:** 2026-02-20 | **PR:** #382 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 49 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- two-strikes-regex
- severity-mapping-bug
- filterboolean-on-table-splits-drops-empty-cells-shifting-col
- title-only-dedup-key-causes-distinct-findings-same-title-dif
- explicit-severity-markers-s0-s3-must-be-checked-before-keywo
- sourceid-sequence-suffix-source-file-line-number-false-posit

**Learnings:**

- SonarCloud (23) + Gemini Code Assist (3) + Qodo PR Suggestions (23)
- PR #382 / claude/fix-tool-use-ids-EfyvE **Total:** 49 raw → 42
- TWO-STRIKES regex: `matchNumberedHeading` L548 flagged for both DoS (S5852)
- Severity mapping bug: `critical→S1` instead of `S0` caused 374 items to be
- Title-only dedup key causes distinct findings (same title, different files) to
- Explicit severity markers (S0-S3) must be checked before keyword heuristics
- Regex complexity >20 from large alternation sets → replace with Set + function

---

### Review 363: PR #382 R2 — Regex DoS String Parse, CC Extraction, Severity Split, 16 Items (2026-02-20)

**Date:** 2026-02-20 | **PR:** #382 | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- two-strikes-regex-r2
- cc-extraction
- severity-split
- h1-heading-guard
- within-run-dedup
- end-of-line-severity

**Learnings:**

- SonarCloud (12) + CI/Prettier (1) + Qodo PR Suggestions (6)
- PR #382 / claude/fix-tool-use-ids-EfyvE **Total:** 16 unique → 14
- TWO-STRIKES regex (R2): `isTableHeaderLine` separator regex flagged again for
- CC extraction: `extractFromBullets` CC 19>15 — extracted `processBulletLine`
- Severity split: `medium` and `low` were both mapped to S3 — split to
- H1 heading guard: `matchNumberedHeading` accepted H1 (`# Title`) due to
- Within-run dedup: `buildFindings` in roadmap script could produce duplicates

---

### Review 364: PR #382 R3 — Cross-Report Dedup, Milestone Reset, Severity Case, 5 Fixes (2026-02-20)

**Date:** 2026-02-20 | **PR:** #382 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cross-report-dedup-gap
- stale-milestone
- case-insensitive-severity
- stringraw-for-regexp

**Learnings:**

- SonarCloud (2) + Qodo Compliance (6) + Qodo PR Suggestions (3)
- PR #382 / claude/fix-tool-use-ids-EfyvE **Total:** 11 raw → 5
- Cross-report dedup gap: `existingHashes` not updated during report loop —
- Stale milestone: `currentMilestone` persisted across non-milestone headings,
- Case-insensitive severity: `S[0-3]` regex missed lowercase `s0` markers in
- String.raw for RegExp: `\\d+` in template literal → `String.raw` avoids
- When accumulating dedup hashes across a loop, update the hash set inside the

---

### Review 365: PR #383 R1-R4 — SonarCloud Bulk Fixes, Qodo Compliance, CI Doc Lint (2026-02-21)

**Date:** 2026-02-21 | **PR:** #383 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- catch-parameter-naming-whack-a-mole
- assignment-expression-vs-increment
- destructured-import-bug
- missing-learning-log-entries

**Learnings:**

- SonarCloud (R1-R4) + Qodo Compliance (R2-R4) + Qodo PR Suggestions

---

### Review 366: — PR #383 R5 (SonarCloud + Qodo + CI) — 2026-02-21 (unknown)

**Date:** unknown | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- secret-leakage-in-redaction
- path-traversal-2-files
- mathrandom-prng
- atomic-dual-file-writes
- over-broad-s0-downgrade
- sync-by-idhash
- duplicate-debt-ids
- unreachable-null-guard
- swallowed-parse-errors
- per-line-jsonl-safety
- jsonparse-guard
- body-discard-guard
- -backreference-leaks-secrets
- startswithroot-sep-is-fragile
- dual-file-writes-need-atomicity
- readjsonl-silent-catch-is-a-smell

**Learnings:**

- SonarCloud (24), Qodo Compliance (5), Qodo Code Suggestions (12), CI

---

### Review 367: — PR #383 R6 (SonarCloud + Qodo + CI) — 2026-02-21 (unknown)

**Date:** unknown | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- symlink-directory-bypass
- verify-resolutionsjs-savejsonl
- double-counting-bug
- readjsonlfromgit-crash
- reverify-resolvedjs-crash
- partial-atomic-write
- dedup-key-normalization
- hotspot-body-discard
- remove-assignment-of-i
- responsebodycancel
- propagation-misses-are-the-1-r6-driver
- indexof-based-arg-parsing-avoids-sonarcloud-s1854
- iswritesafe-must-check-parent-dirs

**Learnings:**

- SonarCloud (25), Qodo Compliance (5), Qodo Code Suggestions (9), CI

---

### Review 368: — PR #383 R7 (SonarCloud + Qodo + CI) — 2026-02-21 (unknown)

**Date:** unknown | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- 25-cc-reductions
- 5-security-hotspots
- compliance-fixes

**Learnings:**

- SonarCloud (30), Qodo Compliance (5), Qodo Code Suggestions (15), CI

---

### Review 369: — PR #383 R8 (Qodo + SonarCloud) — 2026-02-21 (unknown)

**Date:** unknown | **Source:** sonarcloud+qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- symlink-guard-sync-dedupedjs
- fail-closed-fallback
- atomic-paired-writes-with-rollback
- parent-dir-symlink-check
- path-traversal-guards
- token-validation
- sprint-status-robustness
- triage-scattered-intake
- verify-resolutionsjs
- roadmap-debt-refs
- propagation-remains-dominant
- fail-closed-is-the-correct-default
- parent-directory-symlink-traversal

**Learnings:**

- Qodo Code Suggestions (12), Qodo Compliance (5), SonarCloud (4), CI

---

### Review 370: PR #386 R1 — SonarCloud + Qodo + Gemini + CI (2026-02-23)

**Date:** 2026-02-23 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 19 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- sonarcloud-s5852-two-strikes
- regex-dos-in-seed-commit-logjs
- optional-chaining
- array-mutation
- git-log-parsing
- atomic-write-hardening
- repo-root-resolution
- sticky-boolean-false-positive
- prettier-ci-fix
- verified-patterns

**Learnings:**

- SonarCloud S5852 two-strikes: replaced 2 complex regexes (complexity 31
- Regex DoS in seed-commit-log.js: replaced complex session counter regex with
- Optional chaining: 3 instances of `x && x.test()` → `x?.test()` in
- Array mutation: `keys.sort()` → `[...keys].sort()` for non-mutating sort
- Git log parsing: `parts.length < 4` → `< 6` to match 6-field format
- Atomic write hardening: added try/catch cleanup, rmSync before renameSync,
- Repo root resolution: `process.cwd()` → `git rev-parse --show-toplevel`

---

### Review 371: PR #386 R2 — SonarCloud S5852 + CC Reduction + Qodo Hardening (2026-02-23)

**Date:** 2026-02-23 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- s5852-two-strikes
- cc-reduction
- concurrency-safe-tmp
- fallback-unlinksync-guard
- stringraw-for-backslash
- match-snippets

**Learnings:**

- S5852 two-strikes: replaced `/(\d+)\s*$/` regex with backward digit walk (pure
- CC reduction: extracted `parseCommitLines` and `writeEntries` from `main()`
- CC reduction: wrapped `logical-or-numeric-fallback` testFn in IIFE with
- Concurrency-safe tmp: `COMMIT_LOG.tmp` → `COMMIT_LOG.tmp.${pid}.${Date.now()}`
- Fallback unlinkSync guard: added try/catch around cross-drive cleanup
- String.raw for backslash: `"\\|"` → `String.raw\`\\|\``
- Match snippets: added `match: line.trim().slice(0, 120)` to both testFn

---

### Review 372: PR #388 R1 (2026-02-23)

**Date:** 2026-02-23 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 373: PR #388 R2 (2026-02-23)

**Date:** 2026-02-23 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 374: PR #388 R3 (2026-02-23)

**Date:** 2026-02-23 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 376: PR #392 R1 (2026-02-25)

**Date:** 2026-02-25 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 3 | 0 |

**Patterns:**

- git-glob-pathspecs-require-glob-prefix-when-using

---

### Review 377: PR #392 R2 (2026-02-25)

**Date:** 2026-02-25 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- 3-qodo-compliance-items-repeat-rejected
- stringerr-on-exec-error-objects-produces-object-object-

---

### Review 378: PR #392 R4 (2026-02-25)

**Date:** 2026-02-25 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 111 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- data-quality
- cross-platform-path-normalization-must-happen-before-string

---

### Review 379: PR #388 R1 (2026-02-24)

**Date:** 2026-02-24 | **PR:** #388 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- data-inconsistency-in-retro-metrics-fixed-count-mismatch

---

### Review 380: PR #390 R2 (2026-02-24)

**Date:** 2026-02-24 | **PR:** #390 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- use-committer-date-ci-not-author-date-ai-to-prevent-date

---

### Review 381: PR #390 R3 (2026-02-24)

**Date:** 2026-02-24 | **PR:** #390 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- combine-cache-key-normalization-with-cache-check-improvement

---

### Review 382: PR #390 R4 (2026-02-24)

**Date:** 2026-02-24 | **PR:** #390 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 4 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 383: PR #393 R1 (2026-02-25)

**Date:** 2026-02-25 | **PR:** #393 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 193 | 78 | 0 | 41 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 5 | 0 | 0 | 0 |

**Patterns:**

- skipreason-validation
- posix-portability
- suppressall-edge-cases
- rounds
- total-items-processed
- tdms-items-created
- key-files
- r1-r2-symlink-guard-incomplete
- r2-r3-symlink-still-incomplete-shelltrue-recurring
- r3-r4-dos-in-validation-toctou-in-file-creation
- r4-r5-toctou-in-file-creation-race
- r5-r6-fstatsync-gap-in-fd-based-write
- skipreason-persistence-rejected-consistently-r3-r6
- fixtemplatesmd
- pr-review-skillmd
- codepatternsmd
- full-chain-security-fixes-not-incremental
- consistent-rejection-prevents-churn
- eliminate-dont-explain
- review-ids
- files-in-original-pr-diff
- review-sources
- root-cause
- what-should-have-happened
- avoidable-rounds
- cross-pr-pattern
- eslintconfigmjs
- pr-review-skillmd-step-05
- qodo-suppression-config
- implement-the-cc-rule
- use-fixtemplates-for-new-files
- holistic-security-audit-on-first-flag
- suppress-recurring-rejections
- complete-pattern-checker-modifications-in-one-pass
- cc-is-the-1-cross-pr-churn-driver
- symlinksecurity-hardening-is-the-2-driver
- jsonl-data-quality-is-persistent-noise
- retro-action-items-are-not-being-implemented
- add-complexity-error-15-to-eslintconfigmjs
- create-tdms-entries-for-retro-action-items
- add-qodo-suppression-for-jsonl-pipeline-output
- smaller-scope
- existing-hardening-patterns-applied
- stable-rejections
- generate-viewsjs-preservation
- pr-review-skillmd-step-5
- path-normalization-needs-a-test-matrix
- cli-arg-validation-always-include-catch-all-else
- store-validated-forms-not-raw-input
- retro-action-items-must-be-tracked-in-tdms
- qodopr-agenttoml
- post-extraction-cc-verification
- upgrade-cc-rule-to-error
- fix-qodo-suppression
- path-containment-decisions-need-upfront-design
- filesystem-guard-test-matrix-at-implementation-time
- propagation-check-enforcement
- geministyleguidemd
- no-new-fixtemplates-needed
- suppress-internal-tooling-security-noise
- efficiency
- avoidable-
- single-highest-impact-change
- trend
- score
- pr-retro-skillmd
- shared-loadjsonl-refactor
- algorithm-design-before-implementation
- protocol-compliance-is-non-negotiable
- propagation-enforcement-still-missing
- test-your-own-code-against-your-own-linter
- no-new-templates-needed
- review-data
- enforce-propagation-grep-on-truthy-filters
- complete-severitymapping-audits
- dedup-algorithm-boundaries
- same-file-regex-dos-sweep
- check-pattern-compliancejs
- propagation-is-the-1-churn-driver
- cc-rule-implementation-paid-off
- large-prs-amplify-review-cycles
- gemini-and-qodo-independently-flagged-the-same-redaction-bug

**Learnings:**

- Add `shellcheck` to pre-commit.
- CC eslint rule (~30 min), shared validateSkipReason
- R1-R3 productive. R4-R7 were progressive hardening ping-pong.
- R1 added realpathSync on logDir; R2 Qodo flagged logPath itself could be a
- Partial fix — checked directory but not file
- Checklist: "symlink guards must cover both directory AND

---

### Review 384: PR #393 R2 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #393 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 385: PR #394 R2 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 32 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- deferred-to-enhancement-plan

---

### Review 386: PR #394 R3 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 42 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 387: PR #394 R4 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 20 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 388: PR #394 R5 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 20 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 389: PR #394 R6 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 13 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 390: PR #394 R7 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 19 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 391: PR #394 R8 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 392: PR #394 R9 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cc-reduction-via-helper-extraction
- security-scanner-exclusion

---

### Review 393: PR #394 R10 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 20 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cross-platform-path-separators-in-regex-excludes
- backupout

---

### Review 394: PR #394 R11 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- lazy-quantifiers-
- -are-still-unbounded-for-redos

---

### Review 395: PR #394 R12 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #394 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

---

### Review 396: PR #395 R1 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #395 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- sanitize-errorjs-consolidate-unquoted-patterns
- sanitize-errorjs-harden-quoted-regex
- sanitize-inputjs-single-quoted-secrets
- sanitize-inputjs-delimiter-refinement
- fixtemplate-45-updated
- debt-7595
- debt-7597
- debt-7602
- debt-76047605
- debt-7610
- propagation-discipline
- schema-consistency

---

### Review 397: PR #407 R2 — Qodo/Gemini/CI (2026-02-28)

**Date:** 2026-02-28 | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- mapfn-passes-element
- index
- array-never-pass-functions

---

### Review 398: PR #396 R1 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #396 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 38 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- integration-test-must-use-relative-paths-when-invoking-the

---

### Review 399: PR #396 R2 (2026-02-26)

**Date:** 2026-02-26 | **PR:** #396 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- same-path-rename-is-a-real-data-loss-bug-rmsyncdest-then

---

### Review 400: Maintenance PR R1 (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 37 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- agents
- fix-one-audit-all
- cc-extract-helpers-proactively

---

### Review 401: Maintenance PR R2 (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 2 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cc-extract-helpers-proactively
- nan-safe-timestamp-validation

---

### Review 402: PR #407 R6 — SonarCloud/Qodo/CI (2026-02-28)

**Date:** 2026-02-28 | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 18 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- pattern-checker-cant-detect-rmsync-within-nested-trycatch-

---

### Review 403: Maintenance PR R4 (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cc-reduction-pattern
- review-suggestion-creates-new-issue-when-a-reviewer-suggesti

---

### Review 404: Maintenance PR R5 (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 8 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- serial-regex-flagging-sonarcloud-flags-regexes-one-per-round

---

### Review 405: Maintenance PR R6 (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- indexof-to-includes-every-time-indexofx--1-is-written

---

### Review 406: Maintenance PR R7 (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 11 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cc-creep-from-error-handling-adding-trycatch-blocks-to

---

### Review 407: PR #398 R1 — Ecosystem Diagnosis + GitHub Automation (2026-02-27)

**Date:** 2026-02-27 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 12 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 0 | 0 | 0 |

**Patterns:**

- learnings
- --escapetablecell-overuse-dont-use-table-cell-escaping-for-m

**Learnings:**

- CRITICAL: `.serena/project.yml` YAML indentation (duplicate `- typescript`)
- MAJOR: Pin GitHub Actions to SHA hashes (dependabot/fetch-metadata,
- MAJOR: Known-duplicate ID logic now catches within-file dups (Qodo #11)
- MINOR: SESSION_HISTORY.md missing purpose section + doc headers
- MINOR: `escapeTableCell` used for link text caused `&amp;` — added
- MINOR: Broken DOCUMENTATION_INDEX table row (2-line split)
- MINOR: Prettier formatting on new GitHub workflow files

---

### Review 408: PR #407 R3 — SonarCloud + Qodo Batch 1 (2026-02-28)

**Date:** 2026-02-28 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 45 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- learnings
- cc-extraction
- replaceall-migration
- stringraw-for-regex

---

### Review 409:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 410:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 411:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 412:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 413:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- learnings
- cc-extraction
- replaceall-migration

**Learnings:**

- PR #407 R3 — SonarCloud + Qodo Batch 1

---

### Review 414:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 415:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- mapfn-passes-element
- index
- array-never-pass-functions

**Learnings:**

- PR #407 R2 — Qodo/Gemini/CI **Patterns:**

---

### Review 416: PR #407 R7 — SonarCloud + Qodo + CI (2026-03-01)

**Date:** 2026-03-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 23 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- already-fixed-stale
- learnings
- verify-tsconfig-moduletarget-before-accepting-top-level-awai

---

### Review 417: PR #407 R8 — CI/Qodo/SonarCloud (2026-03-01)

**Date:** 2026-03-01 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 26 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 3 | 7 | 5 | 0 |

**Patterns:**

- severity
- learnings
- isretrosectionend-logic-inversion-prheadingretestline

**Learnings:**

- SonarCloud (4 code smells)

---

### Review 418: PR #407 R10 — SonarCloud/Qodo/Dependency Review (2026-03-01)

**Date:** 2026-03-01 | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- atomic-writes-should-attempt-renamesync-first
- fall-back-to

---

### Review 419: PR #407 R11 — Qodo Suggestions + SonarCloud (2026-03-01)

**Date:** 2026-03-01 | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- local-issafetowrite-copies-diverge-from-safe-fsjs-canonical

---

### Review 420:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- learnings
- atomic-write-must-not-delete-target-before-rename

**Learnings:**

- PR #407 R7 — SonarCloud + Qodo + CI

---

### Review 421:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- learnings
- cc-extraction
- replaceall-migration

**Learnings:**

- PR #407 R3 — SonarCloud + Qodo Batch 1

---

### Review 422:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- pattern-checker-cant-detect-rmsync-within-nested-trycatch-

**Learnings:**

- PR #407 R6 — SonarCloud/Qodo/CI **Patterns:**

---

### Review 423:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 197 | 19 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 6 | 0 | 0 | 0 |

**Patterns:**

- qodopr-agenttoml
- fixtemplatesmd
- pr-retro-skillmd
- run-pattern-checker-before-pushing-review-fixes
- cc-re-check-after-extraction-is-not-optional
- propagation-enforcement-remains-the-top-systemic-issue
- pr-review-skillmd-step-05
- s5852-requires-recursive-regex-audit
- pre-commit-cc-hook-may-not-cover-iife-expressions
- small-prs-fewer-rounds
- pr-review-skillmd-step-14
- codepatternsmd
- large-pr-scope-is-the-1-systemic-driver
- propagation-is-now-partially-automated
- multi-source-review-has-diminishing-returns
- review-convergence-achieved
- no-new-templates-needed
- ecosystem-audit-template
- add-security-checklist-to-ecosystem-audit-checker-template
- efficiency
- avoidable-rounds
- avoidable-
- single-highest-impact-change
- trend
- score
- chain-1-walkastcontainscallto-cc
- chain-2-isinsidetryblock
- chain-3-hasrenamesyncnearby
- chain-4-chainexpression
- chain-5-qodo-compliance-repeats
- cc-progressive-reduction
- propagation-miss
- qodo-repeat-rejection-noise
- fixtemplates
- pre-push-hook
- blocking-implement-cc-pre-push-check
- regex-sweep-after-any-s5852-fix
- when-adding-escapesanitization-functions
- auto-compute-changelog-metrics
- note
- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**
- Add `npm run patterns:check --staged` to the R1 fix workflow.
- After extracting helpers for CC reduction, always re-check the
- Add `scripts/debt/` to compliance exclusion paths
- Add reminder to CC extraction template: "After
- No new known churn patterns needed. PR #384's issues
- Round count: #379(11) → #382(3) → #383(8) → **#384(4)**.

---

### Review 424:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- mapfn-passes-element
- index
- array-never-pass-functions

**Learnings:**

- PR #407 R2 — Qodo/Gemini/CI **Patterns:**

---

### Review 425:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- severity
- learnings
- isretrosectionend-logic-inversion-prheadingretestline

**Learnings:**

- PR #407 R8 — CI/Qodo/SonarCloud **Patterns:**

---

### Review 426:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- already-fixed-stale
- learnings

**Learnings:**

- PR #407 R7 — SonarCloud + Qodo + CI

---

### Review 427:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- learnings
- cc-extraction
- replaceall-migration

**Learnings:**

- PR #407 R3 — SonarCloud + Qodo Batch 1

---

### Review 428:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- pattern-checker-cant-detect-rmsync-within-nested-trycatch-

**Learnings:**

- PR #407 R6 — SonarCloud/Qodo/CI **Patterns:**

---

### Review 429:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 430:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- mapfn-passes-element
- index
- array-never-pass-functions

**Learnings:**

- PR #407 R2 — Qodo/Gemini/CI **Patterns:**

---

### Review 431:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- severity
- learnings
- isretrosectionend-logic-inversion-prheadingretestline

**Learnings:**

- PR #407 R8 — CI/Qodo/SonarCloud **Patterns:**
- SonarCloud (4 code smells)

---

### Review 432:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- already-fixed-stale
- learnings

**Learnings:**

- PR #407 R7 — SonarCloud + Qodo + CI

---

### Review 433:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- learnings
- cc-extraction
- replaceall-migration

**Learnings:**

- PR #407 R3 — SonarCloud + Qodo Batch 1

---

### Review 434:  (unknown)

**Date:** unknown | **PR:** #407 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- atomic-writes-should-attempt-renamesync-first
- fall-back-to

**Learnings:**

- PR #407 R10 — SonarCloud/Qodo/Dependency Review

---

### Review 435:  (unknown)

**Date:** unknown | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- composite-key-for-nullable-ids
- rollback-on-dual-write-failure

**Learnings:**

- Maintenance PR R3 **Patterns:**

---

### Review 436:  (unknown)

**Date:** unknown | **PR:** #395 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- sanitize-errorjs-sanitize-inputjs-json-key-quoting
- debt-7598
- debt-7603

**Learnings:**

- PR #395 R2 **Patterns:**

---

### Review 437:  (unknown)

**Date:** unknown | **PR:** #398 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- premature-dedup-new-set-before-duplicate-detection-defeats

**Learnings:**

- PR #398 R2 **Patterns:**

---

### Review 438: PR #407 R12 — SonarCloud + Qodo (2026-03-01)

**Date:** 2026-03-01 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 2 | 0 | 0 |

**Patterns:**

- nested-ternary-extraction
- cc-reduction-writedebtoutput
- cc-reduction-processarchiveline
- cross-device-write-hardening
- cjs-vs-esm-awareness-reject-top-level-await-in-cjs

**Learnings:**

- SonarCloud (5), Qodo PR Suggestions (10) **Total:** 15 **Fixed:** 4
- SC: Top-level await ×2 (`promote-patterns.js`, `backfill-reviews.ts`) — CJS
- Q: V1 ID type normalization — V1 IDs are always numeric from JSON.parse. Type
- Q: Undated retro fallback — All retro headings have dates. Sentinel
- Q: Table wrapping EOL regex — First-run code, markers already exist in
- Q: Retro #### termination — Archives don't use #### within retro sections.
- Q: Prefixed ID parsing — `rev-` is output format, not input. V1 has plain

---

### Review 439: PR #407 R14 — SonarCloud + Qodo (2026-03-01)

**Date:** 2026-03-01 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 4 | 7 | 0 |

**Patterns:**

- cc-reduction-getlatestloghash
- toctou-race-appendentries
- temp-file-symlink-race
- retrorecordparse-safeparse
- invocation-id-collision
- line-number-accuracy
- harden-table-input
- sanitize-markdown-headings
- sanitize-markdown-render
- relax-reviewid-regex
- handle-exception-context
- stringraw
- fd-based-file-operations-toctou-mitigation
- safeparse-for

**Learnings:**

- SonarCloud (5), Qodo Compliance (3), Qodo PR Suggestions (10)
- SC: Top-level await ×2 — **Repeat-rejected from R12.** CJS modules (tsconfig
- Q: String-based numeric ID handling — Already handled downstream in
- Q Compliance: Silent catches — By-design race condition guards per
- Q Compliance: CLI input trust boundary — Local dev tool with Zod validation.
- Q Compliance: Implicit code execution — By-design session hook behavior.

---

### Review 440: PR #407 R16 — Qodo + SonarCloud (2026-03-01)

**Date:** 2026-03-01 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 4 | 0 |

**Patterns:**

- regex-character-class-escaping
- cognitive-complexity-extraction

**Learnings:**

- Qodo Compliance (1), Qodo PR Suggestions (11), SonarCloud (3)
- Character classes in regex: `[` and `]` must be escaped as `\[` `\]` inside
- Extract rename-with-fallback helpers to reduce CC in atomic write functions
- Validate JSON payload shape: Redundant with TypeScript typing + Zod validation
- Sanitize markdown-bound strings: Pattern names are internal, not

---

### Review 452: Multi-AI Audit Plan Polish (2026-01-06)

**Date:** 2026-01-06 | **Source:** qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 9 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 4 | 3 |

**Patterns:**

- self-inconsistency-detection
- shell-command-portability
- documentation-metadata-consistency
- self-consistency-check
- shell-portability-matters
- metadata-discipline
- provider-neutral-specs
- root-cause
- prevention
- file-size-sorting
- line-reading
- regex-character-classes

**Learnings:**

- Mixed - Qodo PR Code Suggestions + CodeRabbit PR Review
- Post-Review #72 feedback on the updated multi-AI audit plan files.
- Root cause: PR adds documentation rule in CODE_PATTERNS.md while violating
- Prevention: Cross-check new rules against files being modified in same PR
- Pattern: When adding/updating pattern rules, grep for violations in PR diff
- Fix: Made all model names provider-neutral ("Claude Opus (verify at
- Root cause: Using non-portable commands (`ls -lh | sort -k5`,

---

### Review 453: GitHub Actions Documentation Lint + Qodo MCP Audit Contradiction (2026-01-22)

**Date:** 2026-01-22 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 6 | 6 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 2 | 3 | 0 |

**Patterns:**

- documentation-moved-without-standardization
- self-contradictory-audit-documentation
- root-cause
- prevention

**Learnings:**

- Root cause: Moved .serena memory file without adding required documentation
- Prevention: Always check documentation linter requirements when moving
- Root cause: Initial analysis assumed permissions = usage; actual
- Prevention: Verify usage before making recommendations; update
- Fixed: 6 items (1 Critical, 2 Major, 3 Minor)

---

### Review 454: PR #384 R1 — SonarCloud + Qodo + CI (2026-02-22)

**Date:** 2026-02-22 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 28 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- cc-extraction-creates-new-cc
- fp-report-double-counting
- duplicate-code-in-ifelse-if
- regex-cc-with-i-flag
- division-by-zero-in-analytics
- pathexcludelist-merging-counts-without-tracking-source-infla

---

### Review 455: PR #389 R1 — Qodo + Gemini (2026-02-25)

**Date:** 2026-02-25 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 25 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- path-containment-across-new-audit-checkers
- basename-only-dedup-in-run-files
- symlink-skip-via-lstatsync
- canverifypkgscripts-flag
- code-fence-counting-needs-state-machine
- frontmatter-regex-must-anchor-to-file-start

---

### Review 456: PR #389 R2 — Qodo + Gemini + Compliance (2026-02-25)

**Date:** 2026-02-25 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 31 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- collectscriptfiles-symlink-propagation
- findingsfilter-id-generation
- yaml-multiline-run-parsing
- isinsidetrycatch-brace-logic
- resolverelativepath-absolute-path-stripping
- dos-caps-for-recursive-walkers
- yaml-multiline-run

---

### Review 457: PR #394 R1 — SonarCloud + Qodo + Gemini + CI (2026-02-26)

**Date:** 2026-02-26 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 42 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 8 | 0 | 0 | 0 |

**Patterns:**

- cc-reduction-via-generic-ast-walker
- isinsidetryblock-must-check-range-not-just-ancestor-type
- hasrenamesyncnearby-ordering-matters
- pre-existing-violations-surface-when-file-is-modified
- sec-004-triggered-by-inline-comment-examples
- duplicate-hash-prevention-in-batch-ingestion

---

### Review 470: SonarCloud R2-2 — ReDoS regex simplification + CI exec blocker (2026-03-09)

**Date:** 2026-03-09 | **PR:** #393 | **Source:** sonarcloud+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 7 | 8 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 8 | 24 | 5 |

**Patterns:**

- check-propagationjs
- audit-skill-templates
- pr-review-skillmd
- reviewssync-script
- large-pr-scope-remains-the-1-systemic-driver
- propagation-is-the-persistent-2-driver
- pr-390-shows-small-prs-work
- r1-review-quality-improving
- pr-scope-discipline-paid-off
- propagation-automation-is-production-validated
- qodo-batch-rejection-saves-investigation-time
- cross-platform-path-normalization-is-now-the-1-recurring-pat
- jsonl-data-quality-inflates-review-metrics
- zero-avoidable-rounds-from-unimplemented-retro-items
- propagation-check
- qodo-compliance-repeat-rejection
- focused-pr-scope-continues-to-pay-off
- propagation-discipline-held
- multi-source-convergence-is-high-signal
- tdms-data-quality-is-the-remaining-systemic-issue
- fixtemplate-45-is-production-validated
- safe-fsjs-received-substantive-security-fixes
- sonarcloud-0-fp-rate
- qodo-compliance-fp-rate-remains-high-50
- test-production-regex-sync-is-a-new-pattern
- unused-import-cleanup-11-files

**Learnings:**

- SonarCloud Security Hotspots + CI | **Round:** R2-2
- Fixed: 8 items (1 CI blocker + 7 S5852 regex simplifications across 8 files)
- Rejected: 3 items (S1523 string literal FP, S2245 test PRNG FP, S5443 test
- Two-strikes rule works well for test isolation patterns — simple string
- None. Clean forward progression.
- Add quoted-value secret redaction edge case tests. Pattern:

---

### Review 471: Qodo R2-3 — error handling, duplicate detection, cross-platform (2026-03-09)

**Date:** 2026-03-09 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 9 | 9 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Qodo Compliance + Code Suggestions | **Round:** R2-3
- Fixed: 9 items (across 17 files with propagation)
- Rejected: 4 items (CI step dedupe, registry sort, checker validation,
- Duplicate category keys across checkers are a silent data-clobbering risk —
- Cross-platform test portability: always use `os.tmpdir()` instead of `/tmp`

---

### Review 472: Mixed (Qodo + SonarCloud) R1 — ecosystem expansion test infrastructure (2026-03-09)

**Date:** 2026-03-09 | **Source:** sonarcloud+qodo+coderabbit

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 197 | 197 | 3 | 6 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Qodo/CodeRabbit + SonarCloud | **Round:** R1 (3
- Fixed: 197 items across 60+ files
- Deferred: 3 items (cognitive complexity refactors — architectural)
- Rejected: 6 items (test fixture passwords, safe Math.random, bounded regex)
- When mocking via mutable function refs, give the DEFAULT value a matching
- Broad `catch {}` in test setup hides real failures — always catch specific
- SonarCloud S2068 (hard-coded passwords) is a known FP for test fixtures that

---

### Review 473: Qodo R6 — diminishing returns, JSONL data normalization (2026-03-08)

**Date:** 2026-03-08 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 2 | 0 | 8 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 1 | 7 | 2 |

**Learnings:**

- Fixed: 2 items (rev-436 completeness, `""` → `null` x7 entries x2 files)
- Rejected: 8 items (3 repeats, 5 pre-existing/over-engineering)
- After 5+ rounds, most new items are repeat FPs or diminishing-value hardening
- Consider merging PR after R5 when fix rate drops below 30%
- JSONL empty fields should use `null` not `""` for consistency

---

### Review 474: Qodo R5 — eval input validation, maxBuffer, TDMS provenance (2026-03-08)

**Date:** 2026-03-08 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 10 | 5 | 0 | 5 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 2 | 6 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: R4 added capture-before-eval but not content validation.
- Prevention: Any eval of external command output should validate content.
- Root cause: `/add-debt` skill doesn't inject `"source"` field
- Prevention: Check field parity with existing entries when appending JSONL.
- Fixed: 5 items (+ propagation to 12 TDMS entries across 2 files)

---

### Review 475: Qodo R4 — fnm eval safety, gitleaks regex, cwd determinism (2026-03-07)

**Date:** 2026-03-07 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 13 | 11 | 0 | 2 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 3 | 8 | 2 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: R3 fixed standalone scripts but missed the central wrapper.
- Prevention: Always capture command substitution output, validate non-empty,
- Root cause: Overly broad word-boundary regex without negative lookbehind.
- Prevention: Use negative lookbehind `(?<!no\s)` for patterns that have
- Root cause: Inconsistency during incremental additions to the hook.
- Prevention: When adding execFileSync with relative paths, always include

---

### Review 476: Qodo R3 — fnm ripple effects, gitleaks hardening, cross-platform globs (2026-03-07)

**Date:** 2026-03-07 | **PR:** #421 | **Source:** qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 14 | 10 | 0 | 4 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 2 | 3 | 8 | 1 |

**Patterns:**

- root-cause
- prevention

**Learnings:**

- Root cause: fnm migration (PR #421) focused on ensure-fnm.sh wrapper but
- Prevention: Grep for `fnm env` after any fnm-related change; always pair
- Root cause: Package.json test scripts written with Unix-first assumptions.
- Prevention: Always use escaped double quotes (`\"..\"`) in package.json
- Root cause: Defensive "don't break the developer" approach didn't account
- Prevention: Security scanners should fail-closed; non-security tools can

---

### Review 480: PR #427 R3 — Mixed (CI + CodeQL + Semgrep + Qodo + SonarCloud) (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** qodo+ci

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 45 | 45 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Patterns:**

- root-cause
- files
- prevention
- technique

**Learnings:**

- Mixed (CI blocking, CodeQL, Semgrep, Qodo Compliance, Qodo
- PR #427 / testing-31126 **Items:** 45
- Root cause: R2 auto-fixer didn't simplify pre-guarded patterns
- Fix: Manual simplification to
- Files: assign-review-tier.js, check-backlog-health.js, lighthouse-audit.js
- Root cause: Agent didn't understand cross-device rename semantics
- Fix: `safeRename` helper with copyFileSync+unlinkSync fallback

---

### Review 481: PR #427 R5 — Qodo + Semgrep + SonarCloud (2026-03-12)

**Date:** 2026-03-12 | **PR:** #427 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 23 | 20 | 0 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 6 | 12 | 5 |

**Patterns:**

- issafetowrite-4-round-evolution-r1r2r4r5
- eslint-auto-fixer-cascade-r2r3
- agent-fix-regression-r3
- sanitizeinput-incremental-hardening-r4r5
- ai-hallucination
- forward-referencing
- worktree-compatibility
- doc-lint-effectiveness

**Learnings:**

- Mixed (Qodo Compliance, Qodo Code Suggestions, Semgrep, SonarCloud)
- PR #427 / testing-31126 **Items:** 23 total (Major: 6, Minor: 12,
- Fifth review round on large hook-systems-audit PR (426 files). R5
- Rejected: 3 items (C3: local error logging not a leak, C4: system-generated
- Expanding control char regex from `[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]` to
- Semgrep taint analysis requires using the project's approved helper functions

---

### Review 482: PR #429 R1 — SonarCloud + Qodo + CI (2026-03-13)

**Date:** 2026-03-13 | **PR:** #429 | **Source:** sonarcloud+qodo

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 15 | 12 | 1 | 3 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 1 | 5 | 6 | 0 |

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
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Auto-generated DEBT entries (e.g. from log-override.js hook bypass detection)
- When Zod schemas and documentation disagree on enum values, check existing
- SARIF upload guarded by `hashFiles() != ''` without asserting file existence
- Validator scripts claiming "all files" coverage but only checking a hardcoded

---

### Review 484: PR #429 R3 — SonarCloud + Qodo + CI (2026-03-13)

**Date:** 2026-03-13 | **Source:** manual

| Total | Fixed | Deferred | Rejected |
|-------|-------|----------|----------|
| 0 | 0 | 0 | 0 |

**Severity Breakdown:**

| Critical | Major | Minor | Trivial |
|----------|-------|-------|---------|
| 0 | 0 | 0 | 0 |

**Learnings:**

- Semgrep `--test` mode catch blocks must distinguish between "flag not
- IIFE-in-template-literal (`${(() => {...})()}`) is valid JS but hurts
- Cross-round dedup saves effort: R3 item 7 (hook.command logging risk) was

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



