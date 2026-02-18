# AI Review Learnings Log

**Document Version:** 17.33 **Created:** 2026-01-02 **Last Updated:** 2026-02-17

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
<summary>Full version history (v1.0 – v17.33) — click to expand</summary>

| Version  | Date                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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

| Metric         | Value         | Threshold | Action if Exceeded                       |
| -------------- | ------------- | --------- | ---------------------------------------- |
| Main log lines | ~3100         | 1500      | Run `npm run reviews:archive -- --apply` |
| Active reviews | 63 (#285-347) | 20        | Run `npm run reviews:archive -- --apply` |

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

**Reviews #1-284** have been archived in eight files:

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

Access archives only for historical investigation of specific patterns.

---

## Active Reviews

### PR #371 Retrospective (2026-02-17)

#### Review Cycle Summary

| Metric         | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Rounds         | 2 (R1 2026-02-17, R2 2026-02-17)                              |
| Total items    | 45 (34 R1 + 11 R2)                                            |
| Fixed          | 38                                                            |
| Deferred       | 0                                                             |
| Rejected       | 7 (3 R1 + 4 R2)                                               |
| Review sources | SonarCloud (hotspots + issues), Qodo Compliance + Suggestions |

#### Per-Round Breakdown

| Round     | Date       | Source                      | Items  | Fixed  | Rejected | Key Patterns                                                    |
| --------- | ---------- | --------------------------- | ------ | ------ | -------- | --------------------------------------------------------------- |
| R1        | 2026-02-17 | SonarCloud (22) + Qodo (12) | 34     | 31     | 3        | S5852 regex DoS (10), CC >15 (12), atomic write, symlink guards |
| R2        | 2026-02-17 | SonarCloud (7) + Qodo (4)   | 11     | 7      | 4        | CC extraction (2), options object, for-of, negated condition    |
| **Total** |            |                             | **45** | **38** | **7**    |                                                                 |

#### Ping-Pong Chains

##### Chain 1: Cognitive Complexity Extraction (R1→R2 = 2 rounds)

| Round | What Happened                                                                                           | Files Affected                 | Root Cause                                     |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| R1    | Flagged 12 CC >15 functions. Extracted ~15 helpers. Two new helpers still had CC 33 and CC 17.          | sync-reviews, promote, archive | Extraction didn't verify helpers stayed <CC 15 |
| R2    | SonarCloud flagged `parseSeverityCount` CC 33 and `parseRetrospectives` CC 17. Extracted 5 sub-helpers. | sync-reviews-to-jsonl.js       | Helpers inherited CC from parent functions     |

**Avoidable rounds:** 0.5 (partial — R2 also had 5 unrelated items)
**Prevention:** After extracting helpers, run
`npx eslint --rule 'complexity: [error, 15]'` on modified files.

##### Chain 2: executeArchival Parameter Count (R1→R2 = 2 rounds)

| Round | What Happened                                                         | Files Affected     | Root Cause                         |
| ----- | --------------------------------------------------------------------- | ------------------ | ---------------------------------- |
| R1    | Extracted `executeArchival` from `main()` with 10 individual params   | archive-reviews.js | Focused on CC, not API design      |
| R2    | SonarCloud: "Too many parameters (10). Max 7." Refactored to options. | archive-reviews.js | R1 didn't consider parameter count |

**Avoidable rounds:** 0.5 (partial) **Prevention:** Use options object pattern
when extracting with 7+ params.

**Total avoidable rounds across all chains: ~1**

#### Rejection Analysis

| Category                  | Count | Rounds | Examples                                                            |
| ------------------------- | ----- | ------ | ------------------------------------------------------------------- |
| Unstructured logging      | 2     | R1, R2 | "Use structured JSON logs" — CLI dev tool by design                 |
| No audit trail            | 2     | R1, R2 | "Log actor identity" — local dev script                             |
| Silent JSONL parse errors | 2     | R1, R2 | "Swallowed catch blocks" — intentional tolerance for JSONL          |
| Absolute path leakage     | 1     | R2     | "Paths in DEBT table" — pre-existing in TDMS data, not from this PR |

**Rejection accuracy:** 7/7 correct (100%). 4 of 7 R2 rejections were exact
repeats from R1 despite `.qodo/pr-agent.toml` suppression config.

#### Recurring Patterns (Automation Candidates)

| Pattern                      | Rounds | Also in PRs | Already Automated? | Recommended Action                                         | Est. Effort |
| ---------------------------- | ------ | ----------- | ------------------ | ---------------------------------------------------------- | ----------- |
| CC >15 violations            | R1, R2 | #366-#370   | Yes (warn)         | Upgrade `complexity` from `warn` to `error`                | ~5 min      |
| S5852 Regex DoS false pos.   | R1     | #369        | No (resolved)      | String parsing eliminates pattern. Done.                   | Done        |
| Repeat Qodo Compliance       | R1, R2 | #367-#370   | Partial (pr-agent) | Investigate suppression config format for Compliance rules | ~15 min     |
| Options object for 7+ params | R2     | New         | No                 | Add to FIX_TEMPLATES extraction guidelines                 | ~10 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                     | Implemented?            | Impact on #371                                     |
| ------- | -------------------------------------- | ----------------------- | -------------------------------------------------- |
| PR #367 | CC eslint complexity rule              | **YES (warn)**          | Caught as warnings but didn't block push           |
| PR #368 | FIX_TEMPLATES #22 (atomic write)       | DONE                    | Applied consistently in R1                         |
| PR #368 | Qodo suppression for recurring items   | **YES but ineffective** | Same compliance items appeared in both rounds      |
| PR #369 | FIX_TEMPLATES #28 (fail-closed catch)  | DONE                    | Not needed in #371                                 |
| PR #369 | TDMS entries for retro action items    | DONE                    | Working — action items tracked                     |
| PR #370 | CC eslint as error (upgrade from warn) | **NOT DONE**            | CC violations reached SonarCloud despite warn rule |
| PR #370 | Qodo suppression for actor/logs items  | Partial                 | Still appearing                                    |

**Total avoidable rounds from unimplemented retro actions: ~0.5** (CC error rule
would have caught R2 CC items pre-push)

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | CC Rounds   | Security Rounds | Rejections | Key Issue               |
| -------- | ------ | ----------- | ----------- | --------------- | ---------- | ----------------------- |
| #366     | 8      | ~90         | 4           | 5               | ~20        | Symlink ping-pong       |
| #367     | 7      | ~193        | 6(deferred) | 0               | ~24        | SKIP_REASON validation  |
| #368     | 6      | ~65         | 3           | 3               | ~15        | TOCTOU fd-based write   |
| #369     | 9      | 119         | 6           | 8               | 41         | Both CC + symlink       |
| #370     | 5      | 53          | 1           | 3               | 6          | Path normalization      |
| **#371** | **2**  | **45**      | **2**       | **0**           | **7**      | **CC extraction+S5852** |

**Persistent cross-PR patterns:**

| Pattern          | PRs Affected | Times Recommended | Status                       | Required Action                                       |
| ---------------- | ------------ | ----------------- | ---------------------------- | ----------------------------------------------------- |
| CC lint rule     | #366-#371    | 5x (warn since)   | Partially implemented        | Upgrade to `error` — warn doesn't block pushes        |
| Qodo suppression | #369-#371    | 3x                | Implemented, **ineffective** | Investigate pr-agent.toml format for Compliance rules |
| TDMS for retros  | #369-#370    | 2x                | **DONE**                     | Resolved                                              |

#### Skills/Templates to Update

1. **eslint.config.mjs:** Upgrade `complexity` from `["warn", 15]` to
   `["error", 15]`. Warnings don't block commits/pushes. (~5 min)
2. **.qodo/pr-agent.toml:** Investigate why repeat compliance items are not
   suppressed. May need compliance-specific rules vs suggestion rules. (~15 min)
3. **FIX_TEMPLATES.md:** Add extraction guideline: "Use options object for 7+
   params. Verify extracted helpers stay under CC 15." (~10 min)

#### Process Improvements

1. **Post-extraction CC verification** — After extracting helpers to reduce CC,
   run the CC check on new helpers too. R1 extracted ~15 helpers without
   checking, creating 2 CC violations caught in R2. Evidence: R1→R2 CC chain.
2. **Upgrade CC rule to error** — `warn` was a good first step but doesn't
   prevent CI churn. Evidence: R2 CC items despite warn rule.
3. **Fix Qodo suppression** — `.qodo/pr-agent.toml` did not suppress the 4
   repeat items in R2. Needs investigation. Evidence: identical R1+R2
   rejections.

#### Verdict

PR #371 had the **most efficient review cycle in the last 6 PRs** — just 2
rounds to resolve 45 items (38 fixed, 7 rejected, 84% fix rate). This is a 60%
reduction from #370 (5 rounds) and 78% from #369 (9 rounds).

Approximately **0.5-1 round was avoidable**. The R2 items split between CC
violations in extracted helpers (preventable with post-extraction check) and
genuinely new SonarCloud findings (for-of, negated conditions, .indexOf).

The single highest-impact change is upgrading CC from `warn` to `error` (~5
min). This blocks pushes with CC >15, preventing the helpers-exceeding-CC
pattern.

**Trend: Strongly improving.** Rounds: 9→5→2. Items: 119→53→45. Security rounds:
8→3→0. Rejections: 41→6→7. Prior retro actions (CC warn rule, atomic write
templates, TDMS tracking) are paying off. One more upgrade (CC error + Qodo
suppression fix) should enable 1-round cycles.

---

### PR #367 Retrospective (2026-02-16)

**Rounds:** 7 (R1-R7, all same day) | **Items:** 193 total appearances, ~100
unique | **Fixed:** 100 | **Deferred:** 6 CC (pre-existing) | **Rejected:** ~24

**Ping-pong chains (3-4 avoidable rounds):**

- **SKIP_REASON validation** (R4-R7): 4 rounds of progressive hardening
  (newlines, propagation to JS, control chars, codePointAt). Should have been
  one comprehensive pass. **Fix:** Extract to shared
  `scripts/lib/validate-skip-reason.js`.
- **POSIX portability** (R4-R6): `grep -P` then `$'\r'` then `printf '\r'`. Each
  fix used a still-non-POSIX construct. **Fix:** Add `shellcheck` to pre-commit.
- **suppressAll edge cases** (R5-R7): Type guard then explicit flag then
  category requirement. 3 rounds for one filter function. **Fix:** Unit tests
  for `filterSuppressedAlerts()`.

**Automation candidates:** CC eslint rule (~30 min), shared validateSkipReason
(~20 min), shellcheck for hooks (~15 min), suppress SonarCloud S7741 Math.max
(~5 min).

**Verdict:** R1-R3 productive. R4-R7 were progressive hardening ping-pong.
Highest-impact fix: shared SKIP_REASON validator + filterSuppressedAlerts tests
would have saved 3 rounds.

---

### PR #368 Retrospective (2026-02-16)

#### Review Cycle Summary

- **Rounds:** 6 (R1 through R6, all on 2026-02-16)
- **Total items processed:** ~65 (Fixed: ~50, Rejected: ~15, Deferred: 0)
- **TDMS items created:** 0
- **Key files:** `check-triggers.js` (+93 lines), `validate-skip-reason.js`
  (+35/-20), `run-alerts.js` (+20), `SKILL.md` (+27), `.husky/pre-commit`
  (+13/-13), `FIX_TEMPLATES.md` (+13/-13)

#### Churn Analysis

- **R1->R2: Symlink guard incomplete** (ping-pong)
  - R1 added realpathSync on logDir; R2 Qodo flagged logPath itself could be a
    symlink
  - **Root cause:** Partial fix — checked directory but not file
  - **Prevention:** Checklist: "symlink guards must cover both directory AND
    file targets"

- **R2->R3: Symlink still incomplete + shell:true recurring** (ping-pong)
  - R2 added lstatSync on file; R3 Qodo flagged ancestor directory + shell:true
    again
  - **Root cause:** shell:true was "explained away" with comments in R1-R2
    instead of eliminated
  - **Prevention:** "Explain-away" is not a fix. Eliminate the attack surface
    (`.cmd` suffix approach)

- **R3->R4: DoS in validation + TOCTOU in file creation** (ping-pong)
  - R3 added validateSkipReason but length check was after char iteration
  - **Root cause:** Validation order wasn't optimized (cheap checks first)
  - **Prevention:** Input validation template:
    type→trim→empty→length→format→encoding (Step 5.7)

- **R4->R5: TOCTOU in file creation race** (ping-pong)
  - R4 added explicit file permissions but via separate existsSync +
    openSync("wx") + appendFileSync
  - **Root cause:** Three separate fs calls = TOCTOU window
  - **Prevention:** Atomic fd-based pattern: openSync("a") + fchmodSync +
    writeSync + closeSync

- **R5->R6: fstatSync gap in fd-based write** (ping-pong)
  - R5 introduced fd-based write but didn't verify fd points to regular file
  - **Root cause:** Incremental hardening — each round fixed one layer but not
    the next
  - **Prevention:** FIX_TEMPLATES.md template for "secure file write" covering
    the full chain

- **SKIP_REASON persistence: rejected consistently R3-R6** (NOT ping-pong)
  - Qodo compliance re-flagged this every round; rejected each time with same
    justification
  - This is correct behavior — consistent rejection prevents churn

#### Recurring Patterns (Automation Candidates)

| Pattern                           | Rounds      | Already Automated?                 | Recommended Action                                                                                   |
| --------------------------------- | ----------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Symlink guard completeness        | R1,R2,R3    | Partial (check-pattern-compliance) | Add rule: `writeFileSync\|appendFileSync\|openSync` must have both dir+file symlink checks (~30 min) |
| TOCTOU file write                 | R4,R5,R6    | No                                 | Add FIX_TEMPLATES.md template #22: "Secure Audit File Write" with full fd-based pattern (~15 min)    |
| SKIP_REASON persistence rejection | R3,R4,R5,R6 | No                                 | Add Qodo suppression rule for "sensitive log persistence" on `override-log.jsonl` (~10 min)          |
| shell:true elimination            | R1,R2,R3    | No (fixed at source)               | Fixed permanently in R3 via .cmd suffix — no automation needed                                       |
| Validation order (cheap first)    | R3,R4       | No                                 | Already codified in Step 5.7 of pr-review SKILL.md                                                   |

#### Skills/Templates to Update

- **FIX_TEMPLATES.md:** Add Template #22 "Secure Audit File Write" — the full
  fd-based write pattern (openSync→fstatSync→fchmodSync→writeSync→closeSync)
  used in R5+R6. Would have saved 2 rounds (~15 min effort).
- **pr-review SKILL.md:** The Step 5.7 input validation chain (added from PR
  #367 retro) worked — R4 was the only validation-order issue. No update needed.
- **CODE_PATTERNS.md:** Document fstatSync-after-open as mandatory for
  security-sensitive writes (~10 min effort).

#### Process Improvements

1. **"Full chain" security fixes, not incremental** — R1-R6 each fixed one layer
   of the symlink/TOCTOU defense (dir check → file check → realpath →
   permissions → fd-based → fstatSync). A single comprehensive fix using
   FIX_TEMPLATES would have resolved this in R1-R2. Evidence: 4 rounds of TOCTOU
   ping-pong (R3-R6).
2. **Consistent rejection prevents churn** — SKIP_REASON persistence was
   rejected identically in R3-R6 with the same justification. This is working
   correctly — the reviewer re-flags it each round, we reject it each round, no
   code changes. Evidence: 0 wasted commits from this pattern.
3. **Eliminate, don't explain** — shell:true persisted R1-R3 because the "fix"
   was adding comments. The R3 `.cmd` suffix approach eliminated the risk
   entirely. Rule: if a reviewer keeps flagging the same thing despite your
   comments, eliminate the surface area instead.

#### Verdict

The review cycle was **moderately inefficient** — 6 rounds where 3 would have
sufficed. The core issue was **incremental security hardening** instead of
applying the full defense-in-depth pattern upfront. Rounds R1-R2 were productive
(adding new functionality). Rounds R3-R6 were progressive layering of the same
symlink/TOCTOU fix that could have been done once with a complete template.

**Highest-impact change:** Create FIX_TEMPLATES.md Template #22 ("Secure Audit
File Write") with the full fd-based chain. This single template would have
prevented R4-R6 entirely, saving ~3 review rounds.

---

### PR #369 Retrospective (2026-02-17)

#### Review Cycle Summary

- **Rounds:** 9 (R1–R9, all on 2026-02-17)
- **Total items processed:** 119 (Fixed: 78, Rejected: 41, Deferred: 0)
- **TDMS items created:** 0
- **Review IDs:** #335 (R1) through #343 (R9)
- **Files in original PR diff:** 12 scripts across `scripts/audit/`,
  `scripts/debt/`, `scripts/check-pattern-compliance.js`
- **Review sources:** SonarCloud (CC, hotspots, code smells) + Qodo (security,
  compliance, code suggestions)

#### Per-Round Breakdown

| Round | Items | Fixed | Rejected | Key Focus Area                                          |
| ----- | ----- | ----- | -------- | ------------------------------------------------------- |
| R1    | 63    | 58    | 5        | execSync→execFileSync (CRITICAL), CC reduction          |
| R2    | 38    | 24    | 14       | CC extraction, push batching, normalizeRepoRelPath      |
| R3    | 12    | 7     | 5        | Repo containment, category mapping, date validation     |
| R4    | 12    | 6     | 6        | realpathSync, atomic write, fail-fast JSONL             |
| R5    | 12    | 7     | 5        | CC extraction, tmpFile symlink, ISO normalization       |
| R6    | 11    | 7     | 4        | CC extraction x2, wx flag, atomic writeMasterDebt       |
| R7    | 10    | 7     | 3        | CC indexByKey, ancestor symlink, fstatSync scan         |
| R8    | 13    | 8     | 5        | CC buildResults+safeRename, symlink walk, format        |
| R9    | 9     | 5     | 4        | Fail-closed guard, non-object guard, pattern recognizer |

**Observation:** R1 was the only high-volume round (63 items — 5 CRITICAL
command injection). R2 was moderate (38 items). R3-R9 were all 9-13 items each,
suggesting diminishing returns after R2.

#### Churn Analysis — Detailed Ping-Pong Chains

**Chain 1: Symlink/Security Hardening (R2→R3→R4→R5→R6→R7→R8→R9 = 8 rounds)**

This was the dominant churn driver. Each round added one layer of defense, and
the next round found a gap:

| Round | What was added                           | What the next round found missing                   |
| ----- | ---------------------------------------- | --------------------------------------------------- |
| R2    | Basic lstatSync symlink check on outputs | R3: No containment check on CLI input path          |
| R3    | `startsWith(REPO_ROOT)` containment      | R4: startsWith bypassable via symlinks→realpathSync |
| R4    | realpathSync + atomic write (tmp+rename) | R5: tmpFile itself could be pre-existing symlink    |
| R5    | lstatSync on tmpFile + Windows fallback  | R6: Should use `wx` flag instead of manual check    |
| R6    | `wx` flag, extracted guardSymlink()      | R7: Ancestor dir could be symlink (realpathSync)    |
| R7    | Ancestor containment, dir/dest fallback  | R8: walk() follows symlinks during directory scan   |
| R8    | `isSymbolicLink()` in walk()             | R9: guardSymlink catch swallows EPERM/EIO           |
| R9    | Fail-closed catch (ENOENT/ENOTDIR only)  | (resolved)                                          |

- **Root cause:** Incremental hardening — each round fixed the specific issue
  flagged without auditing all write paths holistically. The propagation check
  (SKILL.md v2.2) was added mid-cycle but not applied retroactively.
- **What should have happened:** R2 fix + `grep -rn 'writeFileSync\|renameSync'`
  across all files in scope → apply Template 27 (Secure Audit File Write) to
  every write path in one pass. This existed in FIX_TEMPLATES.md since PR #368
  but wasn't used.
- **Avoidable rounds:** R4-R9 (6 rounds) could have been resolved in R3-R4 with
  holistic write-path audit.

**Chain 2: Cognitive Complexity (R1→R2→R5→R6→R7→R8 = 6 rounds)**

SonarCloud flagged CC >15 in new/modified functions each round:

| Round | Functions flagged (CC)                                         | Extraction applied                                           |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| R1    | Multiple main() functions (CC 20-30)                           | Some extracted, most deferred to R2                          |
| R2    | count-commits-since main(), results-index, validate-templates  | findThresholdTableStart, collectSingleSession, etc.          |
| R5    | post-audit.js main() (CC 20)                                   | validateInputPath() extracted                                |
| R6    | results-index main() (CC 17), track-resolutions main() (CC 22) | guardSymlink+atomicWrite, classifyOpenItems+applyResolutions |
| R7    | compare-audits compareFindings() (CC 17)                       | indexByKey() extracted                                       |
| R8    | count-commits main() (CC 17), writeMasterDebt (CC 20)          | buildResults+statusIcon, guardSymlink+safeRename             |

- **Root cause:** No CC lint rule exists. Functions are written, SonarCloud
  flags them post-push, extraction creates new functions that sometimes also
  exceed CC 15.
- **What should have happened:** Run
  `npx eslint --rule 'complexity: [error, 15]'` on all new files BEFORE first
  push. Every CC violation would have been caught in R1.
- **Cross-PR pattern:** This is the #1 systemic issue. PR #366 had CC in 4
  rounds. PR #367 had CC in 6 rounds (deferred). PR #368 had CC in 3 rounds. PR
  #369 had CC in 6 rounds. **The CC lint rule has been recommended in every
  retro since #367 and has never been implemented.**
- **Avoidable rounds:** R5-R8 CC items (4 rounds) would not have existed if R1
  had clean functions.

**Chain 3: check-pattern-compliance.js (R7→R8→R9 = 3 rounds)**

| Round | What changed                                | What was incomplete                                  |
| ----- | ------------------------------------------- | ---------------------------------------------------- |
| R7    | Added fstatSync forward scan                | Scanned from `backStart` not `i`, applied to all ops |
| R8    | Restricted to `hasOpenSync`, start from `i` | Didn't recognize `guardSymlink` as valid guard       |
| R9    | Added `guardSymlink` to guard patterns      | (resolved)                                           |

- **Root cause:** Pattern checker modifications were done one-at-a-time without
  enumerating all guard function names or all scan directions.
- **Avoidable rounds:** R8-R9 if R7 had added all guard names and correct scan
  bounds.

**Chain 4: intake-audit.js detectAndMapFormat (R8→R9 = 2 rounds)**

| Round | What changed                       | What was incomplete           |
| ----- | ---------------------------------- | ----------------------------- |
| R8    | Refactored to early-return pattern | No guard for non-object input |
| R9    | Added plain-object type check      | (resolved)                    |

- **Root cause:** Refactoring focused on control flow, not input validation.
- **Avoidable rounds:** R9 if R8 refactor included type guard.

#### Rejection Analysis (41 items = 34% of total)

The same JSONL data quality suggestions appeared in **every round R1-R9**:

| Rejection Category                   | Occurrences | Files Affected                     |
| ------------------------------------ | ----------- | ---------------------------------- |
| JSONL evidence schema normalization  | ~12         | normalized-all.jsonl, audits.jsonl |
| JSONL file/line field normalization  | ~8          | audits.jsonl                       |
| JSONL recommendation "" → null       | ~5          | audits.jsonl                       |
| state-manager.js CLI dedup/filtering | ~6          | state-manager.js                   |
| SonarCloud S5852 regex DoS (false +) | ~6          | count-commits-since.js             |
| SonarCloud S4036 PATH lookup         | ~2          | compare-audits.js                  |
| Other pre-existing                   | ~2          | various                            |

These are legitimate observations about pre-existing data quality, but they are
**not addressable in this PR** (the JSONL files are pipeline output, not
hand-edited). They add ~4-5 items of noise per round.

#### Previous Retro Action Items — Implementation Status

Checking what was recommended in previous PR retros and whether it was done:

| Retro   | Recommended Action                               | Status             | Impact on #369                       |
| ------- | ------------------------------------------------ | ------------------ | ------------------------------------ |
| PR #367 | CC eslint complexity rule (~30 min)              | **NOT DONE**       | Would have saved 4+ rounds           |
| PR #367 | Shared validate-skip-reason.js (~20 min)         | DONE               | Not relevant to #369                 |
| PR #367 | shellcheck for .husky hooks (~15 min)            | **NOT DONE**       | Not relevant to #369                 |
| PR #368 | FIX_TEMPLATES Template #22 (atomic write)        | DONE (Template 22) | Available but not consistently used  |
| PR #368 | FIX_TEMPLATES Template #27 (fd-based write)      | DONE (Template 27) | Available but not used for new files |
| PR #368 | Qodo suppression for SKIP_REASON (~10 min)       | **NOT DONE**       | Not relevant to #369                 |
| PR #368 | CODE_PATTERNS fstatSync-after-open doc (~10 min) | **UNKNOWN**        | fstatSync was flagged again in R7    |

**Key finding: The #1 recommended action from both PR #367 and PR #368 retros —
adding a CC complexity rule — has never been implemented. This single omission
caused 4-6 avoidable rounds in each of the last 3 PRs.**

#### Recurring Patterns (Automation Candidates)

| Pattern              | Rounds in #369 | Also in PRs    | Already Automated?   | Recommended Action                                             | Effort          |
| -------------------- | -------------- | -------------- | -------------------- | -------------------------------------------------------------- | --------------- |
| CC >15 violations    | R1,R2,R5-R8    | #366,#367,#368 | **NO** (3 retros!)   | Add `complexity: [error, 15]` to eslint.config.mjs             | ~30 min         |
| Symlink guard        | R2-R9          | #366,#368      | Partial              | guardSymlink now shared + in pattern checker. Done for this PR | Done            |
| JSONL data quality   | R1-R9 (noise)  | #366,#367,#368 | **NO**               | Add `.qodo/suppression.yaml` for pre-existing JSONL patterns   | ~15 min         |
| Atomic write         | R4-R6          | #368           | Yes (Template 22/27) | Templates exist but weren't used for new audit scripts         | ~0 (discipline) |
| Fail-closed catch    | R9             | New            | **NO**               | Add Template 28 to FIX_TEMPLATES.md                            | ~15 min         |
| Pattern checker gaps | R7-R9          | New            | **NO**               | When modifying checker, enumerate ALL guard names in one pass  | ~0 (discipline) |

#### Skills/Templates to Update

1. **eslint.config.mjs:** Add `complexity: ["error", 15]` rule. This is the
   single highest-impact automation item — recommended in 3 consecutive retros,
   never implemented. Estimated savings: 4-6 review rounds per PR. (~30 min)

2. **FIX_TEMPLATES.md:** Add Template 28: "Fail-Closed Catch Block" — only allow
   ENOENT/ENOTDIR through, treat all other errors as fatal. Pattern:

   ```javascript
   } catch (err) {
     const code = err && typeof err === "object" ? err.code : null;
     if (code === "ENOENT" || code === "ENOTDIR") return;
     const msg = err instanceof Error ? err.message : String(err);
     console.error(`Error: ${msg}`);
     process.exit(1);
   }
   ```

   (~15 min)

3. **pr-review SKILL.md Step 0.5:** Add: "Run
   `npx eslint --rule 'complexity: [error, 15]'` on all new/modified .js files
   before first push." This catches CC before SonarCloud sees it. (~5 min)

4. **CODE_PATTERNS.md:** Add `guardSymlink` to the "recognized symlink guard
   patterns" list alongside `isSafeToWrite` and `isSymbolicLink`. (~5 min)

5. **.qodo/ suppression config:** Suppress JSONL data quality patterns (evidence
   schema, file/line normalization, recommendation null) for pipeline output
   files. Would eliminate ~4 rejected items per round. (~15 min)

#### Process Improvements

1. **IMPLEMENT THE CC RULE** — This has been recommended in 3 consecutive retros
   (#367, #368, #369) and never done. Each time it's listed as "~30 min" and
   each time it would have saved 4-6 review rounds. The cumulative cost of NOT
   implementing it across PRs #366-#369 is approximately **18 avoidable review
   rounds** of CC-related fixes. This is no longer a "nice to have" — it's the
   single biggest source of review churn in the project.

2. **Use FIX_TEMPLATES for new files** — Templates 22 and 27 exist (atomic
   write, fd-based write) but were not applied when writing the original audit
   scripts. The scripts were written with raw `writeFileSync` and then hardened
   over 8 rounds. When writing NEW scripts that do file I/O, check FIX_TEMPLATES
   FIRST and use the established pattern from the start.

3. **Holistic security audit on first flag** — The propagation check (SKILL.md
   v2.2) was added mid-cycle but never applied retroactively. When a security
   pattern is first flagged (R2 in this case), immediately:

   ```bash
   grep -rn 'writeFileSync\|renameSync\|appendFileSync' scripts/ --include="*.js"
   ```

   and fix ALL instances, not just the flagged one. Evidence: 6 avoidable rounds
   (R4-R9) from incremental hardening.

4. **Suppress recurring rejections** — 34% of all items processed (41/119) were
   pre-existing JSONL data quality rejections that appeared in every round. This
   wastes time categorizing, documenting, and rejecting the same items 9 times.
   A Qodo suppression config or comment would eliminate this noise entirely.

5. **Complete pattern checker modifications in one pass** — When adding a new
   guard pattern to check-pattern-compliance.js, enumerate ALL recognized guard
   function names AND scan directions (forward + backward) before committing.
   Evidence: 3 rounds (R7-R9) of incremental pattern checker fixes.

#### Cross-PR Systemic Analysis

Comparing the last 4 PR review cycles:

| PR   | Rounds | Total Items | CC Rounds   | Symlink Rounds | JSONL Rejections | Key Issue              |
| ---- | ------ | ----------- | ----------- | -------------- | ---------------- | ---------------------- |
| #366 | 8      | ~90         | 4           | 5              | ~20              | Symlink ping-pong      |
| #367 | 7      | ~193        | 6(deferred) | 0              | ~24              | SKIP_REASON validation |
| #368 | 6      | ~65         | 3           | 3              | ~15              | TOCTOU fd-based write  |
| #369 | 9      | 119         | 6           | 8              | 41               | Both CC + symlink      |

**Systemic patterns visible across all 4 PRs:**

1. **CC is the #1 cross-PR churn driver** — Appeared in every PR, consuming 19+
   rounds total across the 4 PRs. A lint rule would have prevented nearly all of
   them.

2. **Symlink/security hardening is the #2 driver** — PR #366 pioneered the
   patterns, #368 refined with fd-based writes, #369 re-learned the same lessons
   on new files. The templates (22, 27) exist but aren't used proactively.

3. **JSONL data quality is persistent noise** — ~100 rejected items across 4
   PRs, all the same patterns (evidence schema, file normalization). Never
   suppressed, never fixed (because they're pipeline output), just rejected
   every round.

4. **Retro action items are not being implemented** — The CC rule has been
   recommended 3 times. Qodo suppression has been recommended 2 times. Neither
   has been done. This suggests retro action items need a tracking mechanism
   (e.g., TDMS entries or sprint tasks) rather than just documenting them in the
   learnings log.

#### Verdict

The review cycle was **significantly longer than necessary** — 9 rounds where
3-4 would have sufficed with existing tooling. This is the 4th consecutive PR
with the same root causes (CC violations, incremental security hardening, JSONL
rejection noise). The retro process itself is failing — action items are
documented but never executed.

**Three concrete actions that would have the most impact:**

1. **Add `complexity: [error, 15]` to eslint.config.mjs** (~30 min). This is the
   single highest-ROI change. It has been recommended in 3 retros and would have
   saved ~18 rounds across the last 4 PRs.

2. **Create TDMS entries for retro action items** — Stop relying on the
   learnings log to drive implementation. Create DEBT entries with owners and
   sprint assignments so they actually get done.

3. **Add Qodo suppression for JSONL pipeline output** (~15 min). Eliminates ~34%
   of all review items as noise.

---

### PR #370 Retrospective (2026-02-17)

#### Review Cycle Summary

| Metric         | Value                                         |
| -------------- | --------------------------------------------- |
| Rounds         | 5 (R1-R5, all on 2026-02-17)                  |
| Total items    | 53                                            |
| Fixed          | 46                                            |
| Deferred       | 1 (docs:check pre-existing errors)            |
| Rejected       | 6                                             |
| Review sources | SonarCloud, Qodo Compliance, Qodo Suggestions |

#### Per-Round Breakdown

| Round     | Date       | Source               | Items  | Fixed  | Rejected | Key Patterns                                               |
| --------- | ---------- | -------------------- | ------ | ------ | -------- | ---------------------------------------------------------- |
| R1        | 2026-02-17 | Qodo                 | 11     | 11     | 0        | Schema validation, security writeFileSync, data quality    |
| R2        | 2026-02-17 | SonarCloud+Qodo+CI   | 11     | 10     | 0        | Path traversal, i assignment, write helper, orphaned refs  |
| R3        | 2026-02-17 | SonarCloud+Qodo+User | 11     | 11     | 0        | CC 16>15, i assignment, symlink order, view preservation   |
| R4        | 2026-02-17 | SonarCloud+Qodo      | 11     | 8      | 3        | Hard-coded path, merged defaults, unknown args, negated    |
| R5        | 2026-02-17 | Qodo                 | 9      | 6      | 3        | TOCTOU file path, CWD resolve, trailing slash, assignedIds |
| **Total** |            |                      | **53** | **46** | **6**    |                                                            |

**Note:** R1 has no learnings log entry (predates numbering). Data from commit
a5e6d28.

#### Ping-Pong Chains

##### Chain 1: normalizeFilePath Progressive Hardening (R3->R4->R5 = 3 rounds)

| Round | What Happened                                                                                                                        | Files Affected    | Root Cause                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | --------------------------- |
| R3    | Added `normalizeFilePath()` with hard-coded string `"home/user/sonash-v0/"`                                                          | generate-views.js | Initial implementation      |
| R4    | Qodo flagged hard-coded prefix. Changed to `path.resolve(__dirname, "../..")`. Also: `path.resolve(filePath)` resolves against CWD   | generate-views.js | Non-portable, CWD-dependent |
| R5    | Qodo flagged CWD-dependence. Changed to `path.resolve(repoRootAbs, filePath)`. Also: trailing slash stripped (`scripts/`->`scripts`) | generate-views.js | Incomplete fix from R4      |

**Avoidable rounds:** 1 (R5). If R4 had resolved against repo root AND preserved
trailing slashes in one pass, R5 would have had no normalizeFilePath items.

**Prevention:** When implementing path normalization, test with: (1) absolute
paths, (2) relative paths from different CWD, (3) directory paths with trailing
slash. A simple test matrix catches all edge cases.

##### Chain 2: --file Path Validation (R4->R5 = 2 rounds)

| Round | What Happened                                                     | Files Affected  | Root Cause                                     |
| ----- | ----------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| R4    | Added `validatePathInDir` for --file arg                          | resolve-bulk.js | Initial implementation                         |
| R5    | Qodo flagged TOCTOU: validated resolved path but stored raw input | resolve-bulk.js | Incomplete fix — didn't persist resolved value |

**Avoidable rounds:** 1 (R5). If R4 had stored `resolvedFilePath` instead of
`next`, the TOCTOU gap wouldn't exist.

**Prevention:** When validating paths, always store the resolved/validated form.
Never validate one form and store another.

##### Chain 3: Unknown Arg Handling (R4->R5 = 2 rounds)

| Round | What Happened                                                | Files Affected  | Root Cause                           |
| ----- | ------------------------------------------------------------ | --------------- | ------------------------------------ |
| R4    | Added `else if (arg.startsWith("-"))` to catch unknown flags | resolve-bulk.js | Initial implementation               |
| R5    | Qodo flagged non-flag, non-DEBT args still silently ignored  | resolve-bulk.js | Incomplete — only handled `-` prefix |

**Avoidable rounds:** 1 (R5). If R4 had added a final `else` clause for ALL
unrecognized args (not just flags), R5 wouldn't flag this.

**Prevention:** When adding CLI arg validation, always include a catch-all
`else` for any unrecognized input. This is a standard pattern.

##### Chain 4: Repeat Compliance Items (R3->R4->R5 = 3 rounds, no code churn)

"Missing actor context" and "Unstructured console logs" were flagged by Qodo
Compliance in R3, R4, and R5, rejected each time with the same rationale. This
is NOT ping-pong (no code changes), but adds categorization overhead.

**Total avoidable rounds across all chains: 3** (R5 normalizeFilePath, R5
TOCTOU, R5 unknown args — all could have been resolved in R4 with more thorough
fixes)

#### Rejection Analysis

| Category                   | Count | Rounds   | Examples                                                    |
| -------------------------- | ----- | -------- | ----------------------------------------------------------- |
| Audit trail actor identity | 3     | R4,R4,R5 | "Missing actor context" — captured in resolution-log.jsonl  |
| Unstructured console logs  | 3     | R4,R4,R5 | "Use structured logging" — pre-existing pattern (DEBT-0455) |

**Rejection accuracy:** 6/6 rejections were correct (100% accuracy). Both items
are legitimate observations about pre-existing architectural patterns, but
fixing them is out of scope for this PR (tracked in DEBT-0455 for structured
logging; resolution-log.jsonl already captures actor identity for audit trail).

**Note:** The same 2 Qodo compliance items repeated in R3, R4, and R5. Unlike PR
#369 where JSONL data quality rejections added ~4-5 items of noise per round, PR
#370's rejection noise was limited to 2-3 items per round in R4-R5. This is a
significant improvement, likely because PR #370 only modified 2 script files
(not 12+ like #369).

#### Recurring Patterns (Automation Candidates)

| Pattern                      | Rounds | Also in PRs                | Already Automated?  | Recommended Action                                                     | Est. Effort |
| ---------------------------- | ------ | -------------------------- | ------------------- | ---------------------------------------------------------------------- | ----------- |
| CC >15                       | R3     | #366-#369                  | **NO (4th retro!)** | Add `complexity: [error, 15]` to eslint.config.mjs                     | ~30 min     |
| Incremental path hardening   | R3-R5  | New for path normalization | No                  | Test matrix for normalizeFilePath (abs, relative, trailing slash, CWD) | ~15 min     |
| TOCTOU validate-then-store   | R4-R5  | #368 (fd-based write)      | No                  | FIX_TEMPLATES: "Always store validated/resolved path, never raw input" | ~10 min     |
| Repeat compliance rejections | R3-R5  | #369 (JSONL quality)       | **NO (2nd retro)**  | `.qodo/suppression.yaml` for actor context + unstructured logs         | ~15 min     |

#### Previous Retro Action Item Audit

| Retro   | Recommended Action                                   | Implemented? | Impact on #370                                  |
| ------- | ---------------------------------------------------- | ------------ | ----------------------------------------------- |
| PR #367 | CC eslint complexity rule (~30 min)                  | **NOT DONE** | Caused 1 round (R3 CC 16>15)                    |
| PR #367 | Shared validate-skip-reason.js (~20 min)             | DONE         | Not relevant to #370                            |
| PR #367 | shellcheck for .husky hooks (~15 min)                | **NOT DONE** | Not relevant to #370                            |
| PR #368 | FIX_TEMPLATES Template #22 (atomic write)            | DONE         | Used in writeOutputJson (R2)                    |
| PR #368 | FIX_TEMPLATES Template #27 (fd-based write)          | DONE         | Not directly used in #370                       |
| PR #368 | Qodo suppression for SKIP_REASON (~10 min)           | **NOT DONE** | Not relevant to #370                            |
| PR #368 | CODE_PATTERNS fstatSync-after-open doc               | **NOT DONE** | Not relevant to #370                            |
| PR #369 | CC eslint complexity rule (~30 min)                  | **NOT DONE** | Same as #367 — caused 1 round                   |
| PR #369 | Qodo suppression for JSONL pipeline output (~15 min) | **NOT DONE** | Would have suppressed 2-3 repeat items in R4-R5 |
| PR #369 | FIX_TEMPLATES Template #28 (fail-closed catch)       | **NOT DONE** | Not relevant to #370                            |
| PR #369 | TDMS entries for retro action items                  | **NOT DONE** | Retro actions continue to be undone             |

**Total avoidable rounds from unimplemented retro actions: 1** (CC rule would
have caught R3's CC 16>15 pre-push). Lower impact than previous PRs because PR
#370 only touched 2 script files vs 12+ in #369.

#### Cross-PR Systemic Analysis

| PR       | Rounds | Total Items | CC Rounds   | Path/Security Rounds | Rejections | Key Issue              |
| -------- | ------ | ----------- | ----------- | -------------------- | ---------- | ---------------------- |
| #366     | 8      | ~90         | 4           | 5                    | ~20        | Symlink ping-pong      |
| #367     | 7      | ~193        | 6(deferred) | 0                    | ~24        | SKIP_REASON validation |
| #368     | 6      | ~65         | 3           | 3                    | ~15        | TOCTOU fd-based write  |
| #369     | 9      | 119         | 6           | 8                    | 41         | Both CC + symlink      |
| **#370** | **5**  | **53**      | **1**       | **3**                | **6**      | **Path normalization** |

**Trend: Significant improvement.** PR #370 is the shortest review cycle in the
last 5 PRs (5 rounds vs 6-9), with the fewest total items (53 vs 65-193), and
the lowest rejection count (6 vs 15-41).

**Reasons for improvement:**

1. **Smaller scope** — 2 script files modified vs 12+ in #369
2. **Existing hardening patterns applied** — writeOutputJson used Template #22
   from R1/R2, preventing 2-3 symlink/atomic write rounds
3. **Stable rejections** — Only 2 recurring compliance items, rejected
   consistently (no waffling that causes churn)
4. **generate-views.js preservation** — The mergeManualItems() pattern worked
   well, requiring only incremental refinements (not architectural rework)

**Persistent cross-PR patterns:**

| Pattern                         | PRs Affected | Times Recommended | Status            | Required Action                                            |
| ------------------------------- | ------------ | ----------------- | ----------------- | ---------------------------------------------------------- |
| CC lint rule                    | #366-#370    | **4x**            | Never implemented | **BLOCKING — 4 retros, ~20 avoidable rounds across 5 PRs** |
| Qodo suppression                | #369,#370    | 2x                | Never implemented | Should implement before next PR                            |
| TDMS tracking for retro actions | #369,#370    | 2x                | Never implemented | Retro recommendations decay without tracking               |
| FIX_TEMPLATES #28 (fail-closed) | #369         | 1x                | Not done          | Low urgency — only relevant to new audit scripts           |

#### Skills/Templates to Update

1. **eslint.config.mjs:** Add `complexity: ["error", 15]` rule. **4th retro
   recommending this. BLOCKING.** Estimated savings: ~20 avoidable rounds across
   5 PRs. (~30 min)

2. **FIX_TEMPLATES.md:** Add template: "Validate-then-store path pattern" — when
   validating a user-supplied path, always store the resolved/validated form,
   not the raw input. Pattern from R5 TOCTOU fix. (~10 min)

3. **pr-review SKILL.md Step 5:** Add: "When implementing path normalization,
   verify with test matrix: absolute paths, relative paths from non-repo CWD,
   directory paths with trailing slash." (~5 min)

4. **.qodo/ suppression config:** Suppress "actor context in JSON output" and
   "unstructured console logs" for scripts that already use resolution-log.jsonl
   for audit trails. (~15 min)

#### Process Improvements

1. **Path normalization needs a test matrix** — `normalizeFilePath` went through
   3 rounds (R3-R5) because edge cases (CWD independence, trailing slashes) were
   missed. When writing any path manipulation function, immediately test with:
   absolute path, relative path from different CWD, directory with trailing
   slash, empty string, non-string input. Evidence: R3-R5 chain.

2. **CLI arg validation: always include catch-all else** — The unknown arg
   handler went through 2 rounds (R4-R5) because R4 only handled `-` prefixed
   args. Standard pattern: known options -> DEBT-XXXX match -> flag check ->
   **else: error**. Evidence: R4-R5 chain.

3. **Store validated forms, not raw input** — The TOCTOU on --file path was a
   classic validate-then-use-raw pattern. After any `validatePathInDir()` or
   `path.resolve()`, store the result. Evidence: R4-R5 chain.

4. **Retro action items MUST be tracked in TDMS** — For the 4th consecutive PR,
   the CC lint rule is recommended and not implemented. The learnings log is
   clearly insufficient as a tracking mechanism. Action items need DEBT entries
   with sprint assignments. Evidence: 4 retros, 0 implementation.

#### Verdict

PR #370 had the **most efficient review cycle in the last 5 PRs** — 5 rounds
with 53 total items, compared to 9 rounds/119 items (#369), 6 rounds/65 items
(#368), 7 rounds/193 items (#367), and 8 rounds/90 items (#366). This is a clear
positive trend driven by smaller PR scope and reuse of hardening patterns from
prior rounds.

Of the 5 rounds, **R1-R3 were fully productive** (100% fix rate, genuine new
issues). **R4-R5 showed mild ping-pong** in normalizeFilePath (3 rounds) and CLI
arg validation (2 rounds), but each chain involved genuinely new edge cases
rather than the deep incremental hardening seen in #369's symlink chain.

**Approximately 1 round was avoidable** (60% of R5 items were incremental
refinements to R4 fixes). This is a significant improvement over #369's ~6
avoidable rounds.

**Single highest-impact change:** Implement the CC lint rule
(`complexity: [error, 15]` in eslint.config.mjs). This has been recommended in
**4 consecutive retros** and never implemented. While it only caused 1 avoidable
round in this PR, it has caused ~20 avoidable rounds across the last 5 PRs
cumulatively. This is the project's most persistent and expensive process gap.

**Trend comparison:** Improving. The per-round efficiency has increased (46/53 =
87% fix rate vs 78/119 = 66% in #369), rejection noise has decreased (6 vs 41),
and total cycle length has decreased (5 vs 9). If the CC lint rule is finally
implemented, the next similarly-scoped PR should achieve a 2-3 round cycle.

---

#### Review #351: PR #374 R2 — Path Sep Boundary, New-File Guard, Evidence Dedup (2026-02-17)

**Source:** Qodo Compliance + Code Suggestions **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR #374) **Suggestions:** 3 total
(Fixed: 3)

**Patterns:**

1. **Path separator boundary** — `startsWith(dir)` without `+ path.sep` allows
   sibling-prefix bypass (`/repo/app` matches `/repo/app-malicious`). Fix: check
   `a === b || a.startsWith(b + path.sep)`. Also case-insensitive on Windows.
2. **realpathSync on new files** — Fallback `isSafeToWrite` used `realpathSync`
   on paths that don't exist yet (`.tmp`, `.bak`). Fix: realpath the parent dir
   and rejoin basename.
3. **Evidence dedup** — 27 JSONL entries had 3x duplicated `code_reference` and
   `description` objects in evidence arrays. Fixed with Set-based dedup.

---

#### Review #350: PR #374 R1 — Bidirectional Containment, Fail-Closed Guard, backupSwap Safety (2026-02-17)

**Source:** Qodo Compliance + CI (Prettier) + SonarCloud Duplication
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #374)
**Suggestions:** 15 total (Fixed: 8, Deferred: 4, Rejected: 3)

**Patterns:**

1. **Bidirectional containment on env vars** — `CLAUDE_PROJECT_DIR` resolved
   without checking it stays within expected bounds. Fix: `realpathSync` +
   bidirectional `startsWith` check between resolved and CWD.
2. **Fail-closed fallback** — When `symlink-guard` module unavailable, fallback
   was `() => true` (allow all). Fix: restrict to known `.claude/state/` dir.
3. **backupSwap data loss** — `renameSync` without try/catch after moving
   original to `.bak` could lose both files. Fix: wrap in try/catch with
   rollback.
4. **Propagation win** — Found same unsafe `projectDir` pattern in
   `post-write-validator.js` and migrated to shared `git-utils.js`.
5. **Seed data immutability** — `readonly` array prevents accidental mutation of
   constants used in reset operations.

**Key learning:** When extracting shared libraries from hooks, the security
properties of the original inline code must transfer to the shared module. The
`resolveProjectDir()` function now centralizes validation that was previously
done (or missing) in each hook independently.

---

#### Review #348: PR #371 R1+R2 — SonarCloud S5852 regex DoS, CC refactoring, atomic writes, symlink guards (2026-02-17)

**Source:** R1: SonarCloud (10 hotspots + 12 issues) + Qodo Compliance (2) +
Qodo Suggestions (11). R2: SonarCloud (7 issues) + Qodo Compliance (4).
**PR/Branch:** claude/new-session-6kCvR (PR #371) **Suggestions:** R1: 34 total
(Fixed: 31, Rejected: 3). R2: 11 total (Fixed: 7, Rejected: 4).

**Patterns Identified:**

1. **Regex DoS false positives (S5852)** — SonarCloud flags simple patterns like
   `\d+\s*CRITICAL` that have disjoint character classes and no backtracking
   risk. Replace with string parsing to clear quality gate.
2. **CC explosion in parsing functions** — Functions that parse markdown with
   multiple format variants (bold, table, inline) accumulate CC rapidly. Extract
   format-specific helpers to keep each under CC 15.
3. **Atomic write consistency** — Some write paths use atomic tmp+rename, others
   use direct `writeFileSync`. Standardize on atomic pattern for all state
   files.
4. **Symlink guard propagation** — Backup write paths (.bak) missed symlink
   guards despite main paths being protected.
5. **Extracted helpers still exceeding CC 15** — R1 refactoring pushed CC into
   new helper functions (parseSeverityCount CC 33, parseRetrospectives CC 17).
   Need to extract sub-helpers from helpers.
6. **Options object pattern** — Functions with 7+ params should use a single
   options object for readability and maintainability.

**R1 Rejected:** [25] Unstructured logging (CLI tool by design), [26] No audit
trail (local dev script), [27] Silent parse failures (intentional for JSONL
tolerance)

**R2 Rejected:** [8] Swallowed parse errors (repeat from R1 — intentional for
JSONL tolerance), [9] Absolute path leakage (pre-existing in TDMS data, not
introduced by this PR), [10] Audit trail (repeat from R1), [11] Console output
review (repeat from R1)

**Resolution Stats:** R1: 31/34 fixed (91%), 3/34 rejected. R2: 7/11 fixed
(64%), 4/11 rejected (all repeats).

---

#### Review #347: PR #370 R5 — TOCTOU file path, CWD-independent normalization, trailing slash preservation (2026-02-17)

**Source:** Qodo Compliance (3) + Qodo Suggestions (6) **PR/Branch:**
claude/new-session-6kCvR (PR #370) **Suggestions:** 9 total (Fixed: 6,
Rejected: 3)

**Patterns Identified:**

1. **TOCTOU on validated path** — `validatePathInDir` checks resolved path but
   raw input is stored. Must persist the resolved value.
2. **CWD-dependent path.resolve** — `path.resolve(filePath)` resolves against
   CWD, not repo root. Fragile if script invoked from different directory.
3. **Path normalization strips trailing slash** — `normalizeFilePath` converts
   `scripts/` to `scripts`, breaking directory-level DEBT item file references.
4. **Repeat items converging** — Actor context (R3,R4,R5) and unstructured logs
   (R3,R4,R5) repeatedly flagged despite rejection. Stable rejection rationale.

**Rejected:** [1] Arbitrary file overwrite (already constrained to REPO_ROOT via
validatePathInDir + refuseSymlinkWithParents), [2] Missing actor context (3rd
repeat — captured in resolution-log.jsonl), [3] Unstructured console logs (3rd
repeat — pre-existing pattern, DEBT-0455)

**Resolution Stats:** 6/9 fixed (67%), 3/9 rejected

---

#### Review #346: PR #370 R4 — dynamic path prefix, merged defaults, unknown arg guard, negated condition (2026-02-17)

**Source:** SonarCloud (1) + Qodo Suggestions (5) + Qodo Compliance (5)
**PR/Branch:** claude/new-session-6kCvR (PR #370) **Suggestions:** 11 total
(Fixed: 8, Rejected: 3)

**Patterns Identified:**

1. **Hard-coded path prefix** — `normalizeFilePath` used literal
   `"home/user/sonash-v0/"` instead of dynamic `path.resolve(__dirname)`.
   Non-portable across environments.
2. **Merged items bypass pipeline** — `mergeManualItems` pushed items without
   calling `ensureDefaults()`, so path normalization was skipped.
3. **Unknown args silently ignored** — parseArgs dropped unrecognized flags
   without warning, making typos in CI invisible.
4. **Negated condition readability** — SonarCloud flags `if (!x.includes(y))` as
   harder to read. Flip to positive condition first.

**Rejected:** [8,11] Actor in JSON (captured in resolution-log.jsonl), [9]
Unstructured logs (pre-existing architectural pattern across all TDMS scripts)

**Resolution Stats:** 8/11 fixed (73%), 3/11 rejected

---

#### Review #345: PR #370 R3 — parseArgs CC+i refactor, writeOutputJson hardening, generate-views preservation (2026-02-17)

**Source:** SonarCloud (4) + Qodo Suggestions (6) + User Request (1)
**PR/Branch:** claude/new-session-6kCvR (PR #370) **Suggestions:** 11 total
(Fixed: 11, Deferred: 0)

**Patterns Identified:**

1. **for-loop i assignment** — SonarCloud flags `i += 1` in for-loop body. Fix:
   convert to while-loop where i management is explicit.
2. **CC reduction via extraction** — parseArgs CC 16>15. Fix: extract
   `validateOutputJsonPath` and `validatePrNumber` validators.
3. **Symlink check ordering** — Must check parent symlinks BEFORE mkdirSync, not
   after. Also clean up tmp file on error.
4. **generate-views.js overwrites** — Manual additions to MASTER_DEBT.jsonl lost
   when generate-views rebuilds from raw/deduped.jsonl. Fix: preserve existing
   items not present in deduped input.
5. **Cross-platform rename** — Pre-remove destination before renameSync for
   Windows compatibility.
6. **Source data normalization** — Absolute paths in raw/deduped.jsonl propagate
   to MASTER_DEBT.jsonl and views on every regeneration. Fix: normalize at
   source AND add normalizeFilePath guard in generate-views.js pipeline.

**Resolution Stats:** 11/11 fixed (100%), 0 deferred

---

#### Review #344: PR #370 R2 — resolve-bulk.js hardening, MASTER_DEBT data quality, orphaned ROADMAP refs (2026-02-17)

**Source:** SonarCloud (1) + Qodo Compliance (3) + Qodo Suggestions (5) + CI (2)
**PR/Branch:** claude/new-session-6kCvR (PR #370) **Suggestions:** 11 total
(Fixed: 10, Deferred: 1)

**Patterns Identified:**

1. **Path traversal on CLI --output-json** — Arbitrary file write via
   user-supplied path. Fix: validatePathInDir to restrict within repo root.
2. **SonarCloud i assignment** — `parsed.outputJson = args[++i]` flagged. Fix:
   separate increment from assignment.
3. **Duplicated write blocks** — Two identical writeFileSync blocks triggered
   7.4% SonarCloud duplication. Fix: extract `writeOutputJson` helper with
   atomic tmp+rename, path validation, and timestamp.
4. **Orphaned ROADMAP DEBT refs** — sync-roadmap-refs CI check catches refs to
   DEBT IDs not in MASTER_DEBT.jsonl.
5. **lint-staged evidence loss** — Large JSONL changes (dedup + path fix) lost
   during lint-staged backup/restore cycle. Fix: re-apply and commit carefully.
6. **generate-views.js overwrites MASTER_DEBT** — Running generate-views.js
   after manually adding items to MASTER_DEBT.jsonl destroys those additions
   because it rebuilds from raw/deduped.jsonl. Fix: add items after view
   generation, or add to raw/deduped.jsonl source.

**Resolution Stats:** 10/11 fixed (91%), 1/11 deferred (docs:check 36
pre-existing errors → DEBT tracking)

---

#### Review #343: PR #369 R9 — Fail-Closed guardSymlink, Non-Object Guard, Pattern Recognizer, Source ID Regex (2026-02-17)

**Source:** Qodo Suggestions (9) **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR \#369) **Suggestions:** 9 total
(Fixed: 5, Rejected: 4)

**Patterns Identified:**

1. **Fail-closed guardSymlink** — Generic catch in guardSymlink silently
   swallows unexpected errors (EPERM, EIO). Only ignore ENOENT/ENOTDIR; treat
   all others as fatal. Propagated to both track-resolutions.js and
   generate-results-index.js.
2. **Non-object guard in detectAndMapFormat** — Malformed JSONL lines can parse
   to primitives/arrays. Added plain-object check with "invalid" format marker.
3. **Recognize guardSymlink in pattern checker** — New guardSymlink function
   wasn't listed as a recognized guard pattern in check-pattern-compliance.js,
   causing false positives on compliant code.
4. **Source ID regex alignment** — validate-schema.js regex allowed both colon
   and hyphen separators but warning message only documented colons. Tightened
   regex to match documented format.
5. **File path normalization warning** — Non-empty file paths that normalize to
   empty were silently ignored. Added explicit warning for unnormalizable paths.

**Resolution Stats:** 5/9 fixed (56%), 4/9 rejected (JSONL data quality x4)

---

#### Review #342: PR #369 R8 — CC buildResults+statusIcon, guardSymlink+safeRename, Symlink Walk, detectAndMapFormat (2026-02-17)

**Source:** SonarCloud (3 Issues) + Qodo Security (1) + Qodo Compliance (2) +
Qodo Suggestions (7) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
\#369) **Suggestions:** 13 total (Fixed: 8, Rejected: 5)

**Patterns Identified:**

1. **Extract buildResults()+statusIcon() for CC reduction** —
   count-commits-since.js main() CC 17→~8 by extracting the commit-counting loop
   and nested ternary into named helpers.
2. **Extract guardSymlink()+safeRename() for CC reduction** —
   track-resolutions.js writeMasterDebt() CC 20→~6 by extracting symlink guard
   and cross-platform rename into reusable helpers.
3. **Skip symlinks in directory walk** — generate-results-index.js walk()
   traversed symlinks, risking infinite loops or path traversal.
   `entry.isSymbolicLink()` check added before `isDirectory()`.
4. **Restrict fstatSync scan to openSync** — Pattern compliance checker's
   forward scan for fstatSync should only trigger for openSync calls (not
   writeFileSync), and should start from current line `i` not `backStart`.
5. **Sequential format detection** — intake-audit.js detectAndMapFormat
   refactored from mutating let variables to early-return pattern, preventing
   accidental remapping of already-TDMS items.
6. **Error field as string** — JSON output error field changed from boolean to
   descriptive string "Failed to count commits" for consumer clarity.
7. **Silent error in --json mode** — printNoData now outputs
   `{"error":"message"}` instead of `{}` so callers can distinguish failure from
   "no thresholds exceeded".

**Resolution Stats:** 8/13 fixed (62%), 5/13 rejected (JSONL data quality x3,
file/line normalization x1, state-manager dedup x1)

---

#### Review #341: PR #369 R7 — CC indexByKey, Ancestor Symlink, fstatSync Forward Scan, Error -1 (2026-02-17)

**Source:** SonarCloud (1 CC Issue) + Qodo Security (2) + Qodo Compliance (2) +
Qodo Suggestions (5) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
\#369) **Suggestions:** 10 total (Fixed: 7, Rejected: 3)

**Patterns Identified:**

1. **Extract indexByKey() for CC reduction** — compare-audits.js
   compareFindings() CC 17→~10 by extracting collision-aware Map indexing into a
   reusable helper.
2. **Ancestor symlink containment** — Checking only outputDir and outputFile for
   symlinks misses ancestor path components. Use `realpathSync` +
   `path.relative` to verify the resolved path stays within repo root.
3. **Dir + dest symlink guards in fallback** — The Windows cross-platform rename
   fallback path (rmSync + rename) lacked symlink re-checks. Added lstatSync
   guards on both directory and destination before rmSync.
4. **fstatSync forward scan** — Pattern compliance checker only looked backward
   for fstatSync guards, but fd-based chains (openSync→fstatSync) place the
   guard after the open. Added forward scan to avoid false positives.
5. **Return -1 on git error** — Returning 0 from countCommitsSince on error
   masks failures as "no commits needed". Return -1 and surface as ERROR in
   output.

**Resolution Stats:** 7/10 fixed (70%), 3/10 rejected (JSONL data quality x2,
state-manager dedup)

---

#### Review #340: PR #369 R6 — CC Extraction x2, wx Flag, Atomic writeMasterDebt, Collision Detection (2026-02-17)

**Source:** SonarCloud (2 CC Issues) + Qodo Security (1) + Qodo Suggestions (8)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR \#369)
**Suggestions:** 11 total (Fixed: 7, Rejected: 4)

**Patterns Identified:**

1. **Extract guardSymlink() + atomicWrite() for CC reduction** —
   generate-results-index.js main() CC 17→~5 by extracting symlink guards and
   atomic write into reusable helpers.
2. **Extract classifyOpenItems() + applyResolutions() for CC reduction** —
   track-resolutions.js main() CC 22→~8 by extracting classification loop and
   --apply logic into separate functions.
3. **Exclusive-create flag "wx"** — Using `{ flag: "wx" }` in writeFileSync
   atomically prevents TOCTOU/symlink races on tmp files, eliminating the need
   for a separate lstatSync guard.
4. **Atomic write for writeMasterDebt()** — Replaced direct writeFileSync with
   tmp+rename pattern (wx flag + cross-platform fallback) to close TOCTOU
   window.
5. **Return canonical path** — validateInputPath() was returning resolvedInput
   (pre-realpath) instead of inputReal (post-realpath), undermining containment.
6. **Finding key collision detection** — Map.set() silently overwrites duplicate
   keys. Added has() check + warning to prevent silent data loss in comparisons.

**Resolution Stats:** 7/11 fixed (64%), 4/11 rejected (JSONL data quality x4)

---

#### Review #339: PR #369 R5 — CC Extraction, tmpFile Symlink, ISO Date Normalization (2026-02-17)

**Source:** SonarCloud (1 CC Issue) + Qodo Security (1) + Qodo Compliance (1) +
Qodo Suggestions (9) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
\#369) **Suggestions:** 12 total (Fixed: 7, Rejected: 5)

**Patterns Identified:**

1. **Extract validateInputPath() for CC reduction** — SonarCloud CC 20>15 on
   main(). Extracted path resolution, symlink check, and containment validation
   into a dedicated helper.
2. **tmpFile symlink guard** — Atomic write pattern writes to tmp path without
   checking if it's a pre-existing symlink. Add `lstatSync` check before
   `writeFileSync` on the tmp path.
3. **ISO timestamp normalization** — `sinceDate` from MASTER_DEBT.jsonl may be
   full ISO (2026-02-16T...). Use `.trim().slice(0, 10)` before YYYY-MM-DD
   validation.
4. **Guard --apply loop against closed/filtered items** — The update loop
   iterated over `allItems` ignoring filters applied to `openItems`. Added
   status and category guards to prevent re-resolving already-closed items.
5. **Cross-platform atomic rename** — `fs.renameSync` may fail on Windows if
   destination exists. Added fallback: `rmSync(dest)` then retry rename.

**Resolution Stats:** 7/12 fixed (58%), 5/12 rejected (JSONL data quality x3,
title case preservation, state-manager CLI parsing)

---

#### Review #338: PR #369 R4 — realpathSync Hardening, Atomic Write, Fail-Fast JSONL (2026-02-17)

**Source:** SonarCloud (1 Hotspot) + Qodo Suggestions (11) **PR/Branch:**
claude/cherry-pick-recent-commits-X1eKD (PR #369) **Suggestions:** 12 total
(Fixed: 6, Rejected: 6)

**Patterns Identified:**

1. **realpathSync + lstatSync for path containment** — Simple `startsWith` check
   can be bypassed via symlinks. Use `realpathSync` to resolve canonical paths,
   then `lstatSync` to reject symlinked inputs, then `path.relative` check.
2. **Atomic write pattern** — `writeFileSync` directly to target has TOCTOU
   window. Write to `.tmp-${process.pid}` then `renameSync` to target. Clean up
   tmp on error.
3. **Fail fast on invalid JSONL** — Best-effort processing of malformed input
   can cascade errors through pipeline. Exit immediately with clear error.
4. **Early return on invalid date** — If `sinceDate` is provided but malformed,
   return -1 immediately instead of running `git log` without `--since=` (which
   returns full history and causes misclassification).

**Resolution Stats:** 6/12 fixed (50%), 6/12 rejected (S5852 repeat x3, 5x JSONL
data quality pre-existing)

---

#### Review #337: PR #369 R3 — Repo Containment, Canonical Categories, Date Validation, Write Guard (2026-02-17)

**Source:** SonarCloud (1 Hotspot + 2 Issues) + Qodo Compliance (3) + Qodo
Suggestions (7) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #369)
**Suggestions:** 12 total (Fixed: 7, Rejected: 5)

**Patterns Identified:**

1. **Repo containment for CLI input** — `post-audit.js` accepted arbitrary paths
   via `path.resolve()`. Added `startsWith(REPO_ROOT + path.sep)` check.
2. **Dir-to-canonical category mapping** — `generate-results-index.js` used raw
   directory names (e.g. `code`) instead of canonical categories
   (`code-quality`). Added `DIR_TO_CANONICAL` lookup map.
3. **sinceDate validation** — `track-resolutions.js` passed unsanitized date
   strings to `git log --since=`. Added `/^\d{4}-\d{2}-\d{2}$/` format check.
4. **writeFileSync try/catch** — `generate-results-index.js` documented exit
   code 2 for write errors but didn't catch them. Added try/catch wrapper.
5. **String line normalization in getFileRef** — Consistent with findingKey fix
   from R2, applied same `typeof === "string" ? parseInt()` pattern.

**Resolution Stats:** 7/12 fixed (58%), 5/12 rejected (S5852 repeat, audit trail
architectural, 3x JSONL data quality pre-existing)

---

#### Review #336: PR #369 R2 — CC Reduction, Push Batching, Symlink Guards, Line Normalization (2026-02-17)

**Source:** SonarCloud (18 Issues + 3 Hotspots) + Qodo Compliance (5) + Qodo
Suggestions (14) **PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR
#369) **Suggestions:** 38 total (Fixed: 24, Rejected: 14)

**Patterns Identified:**

1. **CC extraction helpers** — SonarCloud CC 20>15 flags resolved by extracting
   `findThresholdTableStart()`/`extractTableRows()` (count-commits-since),
   `collectSingleSessionAudits()`/`collectComprehensiveAudits()`/`collectMultiAiAudits()`
   (generate-results-index), `exitWithError()`/`validateAllTemplates()`
   (validate-templates).
2. **Array#push batching** — SonarCloud flags consecutive `.push()` calls. Fix:
   batch into single `.push(a, b, c)`. Applied across 4 files (compare-audits,
   post-audit, validate-templates).
3. **normalizeRepoRelPath** — File paths with `:lineNumber` suffix (e.g.
   `file.js:123`) cause false "file deleted" classifications. Strip with
   `.replace(/:(\d+)$/, "")` before fs/git operations.
4. **Table column alignment** — Markdown table parsing with
   `.filter(c => c.length > 0)` silently drops empty cells, shifting column
   indices. Use `.slice(1, -1)` instead.
5. **Number.isFinite for line 0** — Truthy check `if (finding.line)` skips
   line 0. Use `Number.isFinite()` for line number checks.

**Key Rejections (14):**

- S5852 regex DoS (3): Linear regex `(\d+)\s+commits` has no backtracking risk
- S4036 PATH lookup (2): Dev CLI tools, not production server code
- TOCTOU race: Acceptable for local dev tooling
- JSONL data quality (6): Pre-existing entries outside PR diff scope
- state-manager.js CLI parsing: Pre-existing, not touched by this PR

**Resolution Stats:** 24/38 fixed (63%), 14/38 rejected with justification

---

#### Review #334: PR #368 R6 — fstatSync fd Validation, Empty-Reason-on-Failure, EXIT Trap Robustness (2026-02-16)

**Source:** Qodo Compliance (3) + Qodo Suggestions (7) + SonarCloud (2 Hotspots)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 10 total (Fixed: 8, Rejected: 3 — 1 overlap with fix)

**Patterns Identified:**

1. **fstatSync after fd open** — After `openSync`, verify via
   `fstatSync(fd).isFile()` that the descriptor points to a regular file. This
   closes the remaining TOCTOU window between pre-open lstatSync checks and the
   actual write. Also use `writeSync(fd, ...)` instead of
   `writeFileSync(fd, ...)` for consistency.
2. **Never return unsafe values on validation failure** — All failure paths in
   validators should return sanitized (empty) values, not echo back the invalid
   input. Callers may log the returned `reason` field without re-checking
   `valid`.
3. **Shell trap chaining via variable accumulation** — Parsing `trap -p EXIT`
   output with `sed` is fragile across shells. Using a shell variable
   (`EXIT_TRAP_CHAIN`) to accumulate commands is simpler and more portable.
4. **Propagation: template changes must update live code** — When a template
   (FIX_TEMPLATES.md) is updated, the live implementation (.husky/pre-commit)
   must be updated in the same commit to stay in sync.

**Key Learnings:**

- SonarCloud 2 Security Hotspots were the same TOCTOU/symlink pattern from R5.
  The fstatSync fix closes the remaining gap after fd-based write was introduced
  in R5. Cross-referencing tools continues to prevent duplicate work.
- Qodo compliance continues to flag SKIP_REASON persistence (R3-R6) — by-design,
  consistently rejecting.
- Pseudocode in SKILL.md needs the same rigor as production code — `groupBy`
  returns an object, `Object.values()` is needed to iterate correctly.

---

#### Review #333: PR #368 R5 — TOCTOU fd-Write, Argument Injection, Symlink Directory Guard (2026-02-16)

**Source:** Qodo Compliance (3) + Qodo Suggestions (9) + SonarCloud (1)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 12 total (Fixed: 8, Rejected: 4)

**Patterns Identified:**

1. **TOCTOU in file creation + write** — Separate `existsSync` +
   `openSync("wx")`
   - `appendFileSync` has a race window. Using a single `openSync("a", 0o600)` +
     `fchmodSync` + `writeFileSync(fd)` + `closeSync(fd)` eliminates the race
     entirely.
2. **Argument injection via concatenated flags** — `--reason=${reason}` lets a
   reason starting with `-` be parsed as a flag. Passing `"--reason", reason` as
   separate args prevents this.
3. **Symlink directory pre-check** — Check `lstatSync(dir).isSymbolicLink()`
   BEFORE `mkdirSync({ recursive: true })` to prevent `mkdirSync` from creating
   directories through a symlinked path.
4. **Don't propagate invalid input** — When validation rejects oversized input,
   return empty string instead of echoing the full oversized value back.

**Key Learnings:**

- SonarCloud Security Hotspot matched the TOCTOU race already identified by Qodo
  suggestion [1]. Cross-referencing tools prevents duplicate work.
- Qodo compliance continues to flag SKIP_REASON stdout logging (R3, R4, R5) —
  consistently rejecting as by-design prevents ping-pong.
- The `e?.cause?.code` pattern for Node.js error chain traversal improves
  robustness when ENOENT wrapping varies across Node versions.

---

#### Review #332: PR #368 R4 — DoS Length Check, Fingerprint Stability, File Perms (2026-02-16)

**Source:** SonarCloud (2) + Qodo Compliance (5) + Qodo Suggestions (5)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 12 total (Fixed: 8, Rejected: 4)

**Patterns Identified:**

1. **Length check before expensive iteration** — validate-skip-reason iterated
   all chars via `[...reason].some()` before checking length, enabling DoS.
   Always check length first for bounded-input functions.
2. **Deterministic fingerprint generation** — Sorting findings before generating
   the cross-domain ID ensures stable deduplication across runs. Without
   sorting, non-deterministic input order produces different IDs for the same
   findings.
3. **Restrictive file permissions on audit logs** — New files created via
   `appendFileSync` inherit umask (often 0o644). Explicitly creating with 0o600
   prevents info leaks on shared systems.
4. **Schema alignment: fingerprint vs id** — TDMS schema uses `fingerprint` as
   canonical key; using `id` for the same purpose creates pipeline mismatches.

**Key Learnings:**

- Qodo compliance continues to flag SKIP_REASON persistence as a risk across
  multiple rounds ([3], [6], [7]). This is by-design: audit logs MUST contain
  the reason to be useful. The `.claude/` directory is gitignored. Truncation
  (200 chars) is sufficient mitigation. Rejecting these consistently prevents
  ping-pong.
- The symlink guard ancestor-directory claim is incorrect — `realpathSync`
  already resolves all symlinks in the entire path chain. Validating each claim
  before accepting saves unnecessary code churn.

---

#### Review #331: PR #368 R3 — Symlink Hardening, shell:true Elimination, Ternary Extract (2026-02-16)

**Source:** SonarCloud (1) + Qodo Compliance (5) + Qodo Suggestions (7)
**PR/Branch:** claude/cherry-pick-recent-commits-X1eKD (PR #368)
**Suggestions:** 13 total (Fixed: 12, Duplicate: 1)

**Patterns Identified:**

1. **Symlink guard must check file AND directory** — realpathSync on logDir
   alone doesn't prevent the file itself being a symlink; use lstatSync on the
   file too
2. **shell:true → .cmd suffix on Windows** — Instead of `shell: true` for
   npm/npx/gh on Windows, directly invoke `bin.cmd` to eliminate shell injection
   surface entirely
3. **Nested ternaries are SonarCloud code smells** — Extract to if/else
   statements for maintainability
4. **Capture error in catch blocks** — Bare `catch {}` hinders debugging; at
   minimum log to stderr
5. **Truncate user-supplied audit fields** — Cap `reason` at 200 chars to
   prevent accidental secret persistence
6. **spawnSync needs status/error checks** — Check `res.error` and `res.status`
   before trusting stdout; set explicit stdio to prevent interactive hangs

**Key Learnings:**

- Round 2 found the symlink guard from R1 was incomplete (checked dir but not
  file). Pattern: security reviews iterate until every attack vector is
  addressed.
- The shell:true issue persisted across 4 compliance rounds because the fix was
  always "add a comment explaining it's safe" instead of eliminating the risk.
  Qodo's imp:9 suggestion to use `.cmd` suffix was the correct resolution.
- Non-canonical categories in TDMS examples (`cross-domain`) would break
  downstream automation. Template examples must use real enum values.

---

#### Review #330: PR #367 R7 — codePointAt, suppressAll Category Guard, Code Fence Parsing, EXIT Trap (2026-02-16)

**Source:** SonarCloud (11) + Qodo Compliance (2) + Qodo Suggestions (8)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 21
total (Fixed: 8, Already Deferred: 6, Already Rejected: 2, Rejected: 5)

**Patterns Identified:**

1. **codePointAt vs charCodeAt** — `charCodeAt` doesn't handle multi-byte
   Unicode correctly; `codePointAt` is the safer default for character code
   comparisons
2. **suppressAll requires category** — suppressAll without a category would
   suppress ALL alerts across ALL categories; now requires valid category string
3. **Code fence awareness** — Markdown parser incorrectly matched review headers
   inside fenced code blocks; skip lines when `inFence` is true
4. **POSIX EXIT trap chaining** — Manual `trap -p EXIT | sed` is brittle and
   non-portable; `add_exit_trap` helper safely chains cleanup commands
5. **Shell control char validation** — Propagated from JS scripts to shell hooks
   using POSIX `LC_ALL=C grep -q '[[:cntrl:]]'`

**Key Learnings:**

- `codePointAt` handles surrogate pairs and astral Unicode correctly
- Category-wide suppression needs both `suppressAll: true` AND a valid category
- Markdown parsing must account for code fences to avoid false header matches
- Shell trap chaining via sed is fragile; a helper function is more maintainable
- Always propagate validation patterns from JS to shell hooks and vice versa

---

#### Review #329: PR #367 R6 — Control Chars, suppressAll, POSIX CR Fix, Severity Normalization (2026-02-16)

**Source:** SonarCloud (8) + Qodo Compliance (3) + Qodo Suggestions (5)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 16
total (Fixed: 5, Already Deferred: 6, Already Rejected: 2, Rejected: 3)

**Patterns Identified:**

1. **Control char + length validation** — SKIP_REASON can contain control chars
   beyond CR/LF; added `[\u0000-\u001f\u007f]` check and 500-char max
2. **suppressAll explicit flag** — Empty messagePattern was suppressing entire
   categories; now requires `suppressAll: true` for category-wide suppression
3. **POSIX CR detection** — `$'\r'` is bash-specific; use `printf '\r'` variable
4. **Severity normalization** — Unexpected severity values in warnings caused
   NaN counts; clamp to known values

**Key Learnings:**

- Control character validation catches more injection vectors than just CR/LF
- Category-wide suppression is a dangerous footgun — require explicit opt-in
- Shell portability: `$'...'` ANSI-C quoting is bash-only, not POSIX sh
- Propagation of validation patterns across all 3 JS scripts + 2 shell hooks

---

#### Review #328: PR #367 R5 — Suppression Validation, POSIX Portability, Newline Propagation (2026-02-16)

**Source:** SonarCloud (8) + Qodo PR Compliance (5) + Qodo Code Suggestions (9)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 22
total (Fixed: 9, Already Deferred: 6, Already Rejected: 2, Rejected: 5)

**Patterns Identified:**

1. **Suppression type guard** — filterSuppressedAlerts crashed on non-object
   entries in suppressions JSON; added defensive filter
2. **POSIX portability** — `grep -P` not available on all systems; replaced with
   `wc -l` + `grep -q $'\r'` for newline detection
3. **Propagation miss** — R4 added newline guards to shell hooks but missed JS
   scripts (check-triggers.js, check-cross-doc-deps.js, check-doc-headers.js)
4. **ENOENT preservation** — string error codes from execFileSync lost in catch;
   now appended to stderr for debugging

**Key Learnings:**

- Propagation checks must cover BOTH shell hooks AND JS scripts that handle the
  same env vars
- `grep -P` (Perl regex) is a GNU extension, not POSIX — use `wc -l` for newline
  counting
- `typeof error.code === "string"` captures ENOENT/EACCES while numeric check
  captures exit codes
- Suppression files are external input — always validate entry types before
  property access

---

#### Review #327: PR #367 R4 — Fail Closed, Log Injection, Trap Chaining, Input Normalization (2026-02-16)

**Source:** SonarCloud (9) + Qodo PR Compliance (5) + Qodo Code Suggestions (10)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 24
total (Fixed: 13, Already Deferred: 6, Already Fixed: 1, Rejected: 4)

**Patterns Identified:**

1. **Fail-closed security** — `isSafeToWrite = () => true` fallback changed to
   `() => false` across all 5 files
2. **Log injection prevention** — SKIP_REASON newline guard added to pre-commit
   and pre-push hooks
3. **Shell trap chaining** — Second `trap ... EXIT` overwrites first; use
   `trap -p EXIT` to capture and chain

**Key Learnings:**

- Fail-open fallbacks for security modules are a recurring anti-pattern
- Shell EXIT traps must be chained, not overwritten
- `handoff.json` field types vary; normalize with `toCount()` helper
- Running validate-audit.js twice is wasteful; capture output once

---

#### Review #326: PR #367 R3 — Weight Normalization, CC Reduction, Symlink Guards (2026-02-16)

**Source:** SonarCloud (11) + Qodo PR Compliance (2) + Qodo Code Suggestions (8)
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:** 21
total (Fixed: 8, Already Deferred: 6, Already Rejected: 3, New Rejected: 4)

**Patterns Identified:**

1. **Tool conflict resolution** — SonarCloud wants `Math.max()` but pattern
   compliance blocks it; resolved by classifying as REJECT with documented
   reason
2. **CC reduction via extraction** — Moving symlink checks outside try blocks or
   into helper functions reduces nesting-based cognitive complexity
3. **Type-safe defensive coding** — `typeof x === "string"` before `.trim()`,
   `Array.isArray()` before `.reduce()` prevents crashes from malformed JSON
   data

**Key Learnings:**

- When tools conflict (SonarCloud vs pattern compliance), document the conflict
  and reject the item with a clear rationale rather than flip-flopping
- Health score weight normalization is already handled by `measuredWeight`
  division, but keeping raw weights summing to 1.0 prevents confusion
- Deduplicating extracted learnings with a Set prevents data quality issues in
  JSONL consumption files

---

#### Review #325: PR #367 R2 — Trend Bug, Suppression Logic, Security Hardening (2026-02-16)

**Source:** CI (Prettier) + SonarCloud (15) + Qodo PR Compliance (5) + Qodo Code
Suggestions (20) **PR/Branch:** claude/read-session-commits-ZpJLX (PR #367)
**Suggestions:** 40 total (Fixed: 21, Deferred: 6, Rejected: 5)

**Patterns Identified:**

1. **R1 agent incomplete fixes** — 3 parallel agents in R1 missed several items
   (trend bug, suppressions, runCommandSafe). Verification pass didn't catch
   them.
2. **EXIT trap overwrite** — Shell scripts using multiple mktemp calls each set
   their own trap, overwriting previous cleanup.
3. **Category-wide suppression blocked** — Empty messagePattern returned false
   instead of true, preventing category-level suppression.

**Key Learnings:**

- Parallel agent results need explicit verification against the original item
  list
- Shell EXIT trap chaining requires capturing previous trap with `trap -p EXIT`
- SonarCloud cognitive complexity items are consistently pre-existing (CC 16-64)

**Resolution Stats:** 21 fixed (7 major, 12 minor, 2 trivial), 6 deferred
(cognitive complexity, pre-existing), 5 rejected (false positives/design). 3
parallel agents, 12 files modified.

---

#### Review #324: PR #367 R1 — Alerts Overhaul Security + Code Quality (2026-02-16)

**Source:** SonarCloud (24) + Qodo PR Compliance (6) + Qodo Code Suggestions
(14) **PR/Branch:** claude/read-session-commits-ZpJLX (PR #367) **Suggestions:**
49 total (Fixed: 36, Deferred: 7, Rejected: 7)

**Patterns Identified:**

1. `runCommandSafe` options spread allows `shell: true` injection — hardened
   with explicit allowlist
2. `parseInt` → `Number.parseInt` consistency (6 instances across 3 files)
3. `.replace(/x/g, y)` → `.replaceAll("x", y)` modernization (10 instances)
4. Empty regex `new RegExp("")` matches everything — must guard in suppression
   filter
5. Symlink write guards missing in 2 new utility scripts (propagation check
   caught)

**Key Learnings:**

- Parallel 3-agent review processing (security / code quality / hooks+docs)
- First use of propagation check on new scripts added in same PR
- SonarCloud cognitive complexity deferrals (6 items, all pre-existing CC 16-64)

**Resolution Stats:** 36 fixed, 7 deferred (cognitive complexity), 7 rejected
(false positives/design choices). 3 parallel agents, 10 files modified.

---

#### Review #322: PR #366 R7 — Comprehensive Symlink Guard Hardening (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 12 total (Fixed: 9,
Rejected: 3 compliance)

**Key pattern:** Every atomic write needs `isSafeToWrite()` on BOTH the target
file AND the `.tmp` file. R6 created the shared helper but missed tmp paths.

**Fixes applied:**

- `symlink-guard.js`: Added `path.isAbsolute()` check — reject relative paths
- `post-write-validator.js`: Replaced 2 inline TOCTOU checks with shared
  `isSafeToWrite` import
- `analyze-user-request.js`: Added `isSafeToWrite` import + guard on directive
  write (standalone file missed in R6)
- `rotate-state.js`: Added `isSafeToWrite` guards on all 4 atomic write paths
- `log-override.js`: Added symlink guard + `lstatSync` instead of `statSync`
- `check-remote-session-context.js`, `post-read-handler.js`,
  `user-prompt-handler.js`: Added `isSafeToWrite(tmpPath)` guards
- `commit-tracker.js`: Restored `author`/`authorDate` fields in git log format

**Rejected:** 3 compliance items (silent catch blocks are intentional fail-safe,
sanitizeFilesystemError already sanitizes, log snippets are code not PII)

**Lesson:** When introducing a shared security helper, audit ALL write paths in
one pass — including tmp files, backup files, and standalone copies of
consolidated functions.

---

#### Review #321: PR #366 R6 — Shared Symlink Guard + Self-Healing Cooldown + Bug Fixes (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 14 total (Critical:
0, Major: 2, Minor: 9, Trivial: 1, Rejected: 2)

**Architectural fix:** Created shared `.claude/hooks/lib/symlink-guard.js` with
`isSafeToWrite()` that checks file + all ancestor directories. Applied to all
hook write paths to stop symlink ping-pong across review rounds.

**Patterns Identified:**

1. **Shared symlink helper** — Each round found more write paths missing symlink
   guards. Root cause fix: centralized `isSafeToWrite()` with ancestor
   traversal.
2. **Self-healing future timestamps** — `ageMs < 0` deletes corrupt cooldown
   instead of permanently blocking the hook.
3. **TOCTOU race** — `existsSync` + `lstatSync` wrapped in try/catch,
   fail-closed.
4. **Milestone string bug** — Off-by-one slice replaced with template literal.
5. **Hook output protocol** — Must print "ok" even when suppressing directives.

**Resolution:** 11 fixed, 2 rejected

| #   | Issue                            | Severity | Action                | Origin       |
| --- | -------------------------------- | -------- | --------------------- | ------------ |
| 2   | recordDirective symlink guard    | Minor    | Fixed (shared helper) | This-PR      |
| 3   | saveJson ancestor traversal      | Minor    | Fixed (shared helper) | This-PR      |
| 4   | Self-healing future timestamp    | Major    | Fixed                 | This-PR      |
| 5   | statePath TOCTOU try/catch       | Minor    | Fixed                 | This-PR      |
| 6   | Milestone string bug             | Major    | Fixed                 | Pre-existing |
| 7   | Directive "ok" output            | Minor    | Fixed                 | This-PR      |
| 8   | updateFetchCache symlink guard   | Minor    | Fixed (shared helper) | This-PR      |
| 9   | Cooldown write symlink (alerts)  | Minor    | Fixed (shared helper) | This-PR      |
| 10  | lstatSync for file size          | Minor    | Fixed                 | This-PR      |
| 11  | Cooldown write symlink (handler) | Minor    | Fixed (shared helper) | This-PR      |
| 12  | reviewQueue TOCTOU try/catch     | Minor    | Fixed                 | This-PR      |
| 13  | NUL delimiter for git log        | Trivial  | Fixed                 | Pre-existing |

**Rejected:** [1] Bidirectional containment removal — breaks cwd-inside-project
setups. [14] saveJson error leaking — dev-only CLI output, aids debugging.

---

#### Review #320: PR #366 R5 — Parent Dir Symlink + Clock Skew + Prototype Pollution (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 9 total (Critical:
0, Major: 0, Minor: 8, Already-tracked: 1)

**Batch rule applied:** Same files appearing 3+ consecutive rounds — holistic
fix approach.

**Patterns Identified:**

1. **Parent directory symlink attack** — Checking file symlinks is insufficient;
   parent directory can also be a symlink redirecting writes. Added
   `path.dirname()` + `lstatSync()` check to saveJson in post-read-handler.js.
2. **Clock skew defense** — Future timestamps (`ageMs < 0`) should trigger
   cooldown, not bypass it. Applied to alerts-reminder.js (nested if with
   `ageMs < 0 || ageMs < COOLDOWN_MS`).
3. **Prototype pollution via counter objects** — `{}` as counter with external
   keys allows `__proto__` injection. Use `Object.create(null)` + `String(key)`.
   Applied to run-alerts.js skip-abuse counters.
4. **Symlink check on reads** — getContent() in post-write-validator.js reads
   files without symlink check, allowing arbitrary file content injection.
5. **Size-based rotation guard** — Entry-count rotation on every append is
   wasteful; gate behind `fs.statSync()` size threshold (64KB).

**Resolution:** 8 fixed, 1 already-tracked (DEBT-2957/2958/2959)

| #   | Issue                          | Severity | Action          | Origin              |
| --- | ------------------------------ | -------- | --------------- | ------------------- |
| 1   | Parent dir symlink in saveJson | Minor    | Fixed           | This-PR             |
| 2   | Cooldown symlink check         | Minor    | Fixed           | This-PR             |
| 3   | Object.create(null) counters   | Minor    | Fixed           | This-PR             |
| 4   | Clock skew cooldown            | Minor    | Fixed           | This-PR             |
| 5   | getContent symlink check       | Minor    | Fixed           | This-PR             |
| 6   | statePath/reviewQueue symlink  | Minor    | Fixed           | This-PR             |
| 7   | Fetch cache Number.isFinite    | Minor    | Fixed           | This-PR             |
| 8   | Size-based rotation threshold  | Minor    | Fixed           | This-PR             |
| 9   | Compliance: symlink writes     | —        | Already-tracked | DEBT-2957/2958/2959 |

---

#### Review #319: PR #366 R4 — Symlink Guard + Future Timestamp + Skip-Abuse Bug (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 9 total (Critical:
0, Major: 1, Minor: 5, Already-tracked: 3)

**Key Patterns:**

1. **Symlink write guard in saveJson**: post-read-handler.js now checks
   `lstatSync().isSymbolicLink()` before writing — prevents symlink-based file
   redirect attacks on state files.
2. **Future timestamp defense**: alerts-reminder.js cooldown now checks
   `ageMs >= 0` — a future timestamp from clock skew would no longer permanently
   disable the hook.
3. **Skip-abuse alert 24h/7d data mismatch bug**: run-alerts.js "By type"
   breakdown was using 7d data in a 24h alert message. Split into byType24h and
   byType7d for accurate reporting.
4. **CRLF JSONL parsing on Windows**: post-write-validator.js JSONL parser now
   trims each line before JSON.parse to handle `\r\n` endings.
5. **Consistent caps on file lists**: pre-compaction-save.js staged/uncommitted
   arrays now capped at 50 (matching existing untracked cap of 20).

**Fixed (6):** Symlink guard (1), future timestamp (1), skip-abuse bug (1), CRLF
trim (1), file list caps (1), Number.isFinite cooldown (1)

**Already tracked (3):** DEBT-2957 (env path trust), DEBT-2958 (audit trails),
DEBT-2959 (secure logging)

---

#### Review #318: PR #366 R3 — Atomic Write Hardening + State Normalization (2026-02-15)

**Source:** Qodo PR Compliance + Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #366) **Suggestions:** 15 total (Critical:
0, Major: 0, Minor: 10, Deferred: 4, Rejected: 1)

**Key Patterns:**

1. **Backup-swap atomic writes**: post-read-handler.js saveJson upgraded from
   rm+rename to backup-swap pattern (write tmp → rename original to .bak →
   rename tmp to original → rm .bak) with rollback on failure.
2. **mkdirSync before atomic write**: user-prompt-handler.js cooldown and
   directive state writes now create parent directory first — prevents failure
   on first run in clean environment.
3. **State shape normalization**: Three files now validate JSON state shape
   after parse — post-write-validator.js (numeric uses/phase),
   post-read-handler.js (contextState fields), analyze-user-request.js (data
   object check).
4. **Git porcelain record validation**: pre-compaction-save.js now validates
   line length and format before parsing XY fields, preventing crashes on
   malformed git output.
5. **Number.isFinite guards**: alerts-reminder.js cooldown timestamp and
   post-write-validator.js state.uses/phase now validate numeric types before
   arithmetic.

**Fixed (10):** mkdirSync cooldown dir (1), atomic directive writes (1), numeric
state normalization (1), data shape validation + atomic writes (2), porcelain
validation (1), backup-swap atomic write (1), contextState normalization (1),
Number.isFinite cooldown (1), Number.isFinite uses/phase (1)

**Deferred (4):** DEBT-2960 (symlink overwrite in rotate-state.js —
architectural), DEBT-2958 (audit trails — already tracked R2), DEBT-2959 (secure
logging — already tracked R2), context export sensitivity (acceptable risk —
sanitizeContextData already strips fields)

**Rejected (1):** Chunk-based line counting for large-context-warning.js — byte
estimation is sufficient for the warning threshold (overcount is acceptable)

---

#### Review #317: PR #366 R2 — SonarCloud Two-Strikes + Qodo Robustness (2026-02-15)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance **PR/Branch:** claude/read-session-commits-ZpJLX (PR #366)
**Suggestions:** 14 total (Critical: 0, Major: 3, Minor: 8, Deferred: 3)

**Key Patterns:**

1. **SonarCloud S5852 two-strikes rule applied**: track-session.js flagged again
   for remaining regexes in the R1 string-parsing replacement code. Replaced
   both `/^(?:Active Sprint|Current Sprint)[:\s-]*/i` and
   `/M1[.\d]*\s*[-–]\s*(.+)/` with pure string parsing (indexOf, startsWith,
   character scanning).
2. **Git status --porcelain -z rename/copy parse bug**: pre-compaction-save.js
   `for...of` loop failed to consume the second NUL-separated path field for R/C
   entries. Fixed with indexed loop + `i++` skip.
3. **Defensive state shape normalization**: post-write-validator.js agent
   trigger state could crash if JSON was corrupted (non-object, missing
   suggestedAgents).
4. **Atomic write consistency**: user-prompt-handler.js cooldown was non-atomic
   — aligned with the write-tmp-rm-rename pattern used elsewhere.
5. **Number.isFinite guard for timestamp purging**: analyze-user-request.js
   directive dedup would never purge entries with corrupted non-numeric
   timestamps.

**Fixed (11):** Two-strikes regex→string (2), rename/copy parse (1), sprint type
guard (1), atomic write (1), state normalization (1), logOverride fail-fast (1),
cache null guard + mkdirSync (1), Number.isFinite guard (1), Array.isArray
testFn guard (1), mkdirSync cooldown dir (1)

**Deferred (3):** DEBT-2957 (project dir escape — architectural), DEBT-2958
(audit trails — generic compliance), DEBT-2959 (secure logging — generic
compliance)

---

#### Review #316: PR #366 R1 — SonarCloud Regex + Qodo Robustness + CI Blockers (2026-02-14)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance + CI Failures **PR/Branch:** claude/read-session-commits-ZpJLX (PR
#366) **Suggestions:** 21 total (Critical: 0, Major: 4, Minor: 11, Deferred: 6)

**Patterns Identified:**

1. SonarCloud S5852 two-strikes rule: Both flagged regexes replaced with
   string-based parsing (check-pattern-compliance.js `testFn`, track-session.js
   line-by-line scan)
   - New: `testFn` alternative to `pattern` field in pattern compliance checker
2. Atomic file writes: 3 hooks (alerts-reminder, check-remote-session-context,
   cooldown files) now use tmp+rmSync+rename pattern (Review #289 standard)
3. Unbounded state growth: 2 state files now have pruning (directive-dedup.json
   24h TTL, suggestedAgents 30-day expiry)
4. CI broken links: ~30 links in AUDIT_TRACKER.md pointed to non-existent audit
   reports. Replaced link markup with plain text + annotation.
5. MASTER_DEBT.jsonl sync: 5 entries lost due to generate-views.js overwrite bug
   (MEMORY.md documents this). Restored from deduped.jsonl.

**Resolutions:**

- [1] check-pattern-compliance.js: Added `testFn` support + replaced regex
- [2] track-session.js: Line-by-line string parsing for sprint name
- [9] analyze-user-request.js: 24h TTL pruning for directive dedup state
- [10] post-read-handler.js: Skip save when context state unchanged
- [12] log-override.js: process.exit(0) after quick mode
- [13] run-alerts.js: Rating key `no_reason` → `no_reason_pct`
- [14] commit-tracker.js: Branch regex simplified
- [15] pre-compaction-save.js: NUL-separated git status (-z flag)
- [16] alerts-reminder.js: Atomic cooldown write
- [17] rotate-state.js: Math.max(1) prevents truncation to 0
- [18] check-remote-session-context.js: Atomic cache write + init order fix
- [19] post-write-validator.js: 30-day agent suggestion pruning
- [20] AUDIT_TRACKER.md: ~30 broken doc links fixed (agent)
- [21] ROADMAP.md + MASTER_DEBT.jsonl: Orphaned DEBT refs + missing entries
  (agent)

**Deferred (6 items):**

- [3-7] Qodo compliance (symlink audit trails, integration tests, audit logging)
  → DEBT-2951 through DEBT-2955
- [8] HookRunner framework proposal → DEBT-2956

---

#### Review #315: SonarCloud + Qodo R5 — Residual Regex, Stack Traces, Windows Compat (2026-02-14)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance **PR/Branch:** claude/read-session-commits-ZpJLX (PR #365)
**Suggestions:** 13 total (Critical: 0, Major: 4, Minor: 7, Trivial: 2)

**Patterns Identified:**

1. Stack trace leakage via rethrown errors: Sanitizing the message but then
   `throw err` still exposes full stack to user
   - Root cause: Incomplete sanitization — caught + logged but then rethrown
   - Prevention: Use `process.exit(1)` instead of `throw` when error is fatal
2. Complex regex where string parsing suffices: Version History section
   extraction used regex with `[\s\S]{0,20000}?` when line-by-line scan works
   - Root cause: Regex was the initial tool; never reconsidered as complexity
     grew
   - Prevention: For section extraction, prefer split-and-scan over regex
3. Windows `renameSync` fails when destination exists: Unlike POSIX, Windows
   `rename()` does not atomically overwrite — must remove target first
   - Root cause: Pattern added in Review #255 without Windows testing
   - Prevention: Always `unlinkSync(dest)` before `renameSync(src, dest)`
4. File-size budgets for regex scanning: Inline pattern checker had no upper
   bound on input size, allowing ReDoS on crafted large files
   - Root cause: Only lower bound (8KB skip) was added, not upper bound
   - Prevention: Add both floor AND ceiling guards on file-size-gated operations

**Resolution:**

- Fixed: 13 items across 8 files
- Deferred: 0
- Rejected: 0

**Key Learnings:**

- `path.basename()` for log output prevents leaking user home directory paths
- `git rev-parse --show-toplevel` is more reliable than `process.cwd()` for repo
  root
- Block comment interior lines (`* ...`) should be treated as trivial in diff
  analysis
- Memoizing `isTrivialChange` with a Map avoids redundant git diff calls per
  file

---

#### Review #314: SonarCloud Regex Hotspots + Qodo Robustness R4 — PR #365 (2026-02-14)

**Source:** SonarCloud Security Hotspots (S5852) + Qodo PR Suggestions + Qodo
Compliance **PR/Branch:** claude/read-session-commits-ZpJLX (PR #365)
**Suggestions:** 13 total (Critical: 0, Major: 5, Minor: 6, Compliance: 2)

**Patterns Identified:**

1. Dead code harboring regex complexity: `checkMilestoneItemCounts` had a
   complex regex for a check disabled since Review #213 — SonarCloud still
   flagged it
   - Root cause: Function kept as stub but regex not removed
   - Prevention: When disabling a check, remove the regex too
2. Incremental line counting bug: `lastIdx` must advance past the full match,
   not just to `match.index`, to avoid double-counting newlines
   - Root cause: Off-by-one in O(n) optimization from Review #255
   - Prevention: Always set `lastIdx = match.index + match[0].length`
3. Regex lookahead factoring: `(?=\r?\n##\s|\r?\n---\s*$|$)` has redundant
   `\r?\n` prefix in each alternative — factor to `(?=\r?\n(?:##\s|---\s*$)|$)`
   - Root cause: Alternatives added incrementally without refactoring
   - Prevention: Factor common prefixes in regex alternations
4. Non-global regex guard: `exec()` loops require `/g` flag — missing flag
   causes infinite loop
   - Root cause: Pattern definitions could theoretically omit `/g`
   - Prevention: Defensive `flags.includes("g")` check before exec loop

**Resolution:**

- Fixed: 13 items across 6 files
- Rejected: 0
- Deferred: 0

**Key Learnings:**

- Remove regex from disabled checks — dead code still triggers SonarCloud
- `\s*` → `\s+` is a simple backtracking reduction when at least one space is
  always present
- File size guards before `readFileSync` prevent local DoS on state files
- Repo-relative paths (`path.relative(cwd, abs)`) are more reliable than raw
  string normalization for git diff

---

#### Review #313: CI Feedback + Qodo R3 — Orphaned DEBT + Bounded Regex (2026-02-14)

**Source:** CI Failures + Qodo PR Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #365) **Suggestions:** 11 total (Critical:
0, Major: 3, Minor: 6, Compliance: 2)

**Patterns Identified:**

1. Dedup removing referenced DEBT entries: consolidate-all.js dedup removed 9
   entries still referenced by ROADMAP.md
   - Root cause: Dedup heuristic too aggressive on similar entries
   - Prevention: Cross-check ROADMAP.md references before dedup
2. Prototype pollution in config objects: `FILE_OVERRIDES` from JSON config
   could contain `__proto__` keys
   - Root cause: Direct object spread from parsed config
   - Prevention: Use `Object.create(null)` + skip dangerous keys
3. Emoji-tolerant section matching: Section headers may have emoji prefixes that
   break `##\s+Name` patterns
   - Root cause: Regex assumes `##` directly followed by whitespace+text
   - Prevention: Use `##\s*(?:[^\w\r\n]+\s*)?Name` for emoji tolerance

**Resolution:**

- Fixed: 11 items (restored 9 DEBT entries from git history, 5 code fixes)
- Rejected: 0
- Deferred: 0

**Key Learnings:**

- MEMORY.md critical bug: changes to MASTER_DEBT.jsonl MUST sync to
  raw/deduped.jsonl
- Atomic writes (`write .tmp` + `rename`) prevent corruption on crash
- Context-aware trivial detection: `#` is a comment in .sh/.yml but a heading in
  .md

---

#### Review #312: CI Regex Complexity + Qodo R2 — PR #365 (2026-02-14)

**Source:** SonarCloud Code Smell + Qodo PR Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX (PR #365) **Suggestions:** 8 total (Critical:
0, Major: 1 CI-blocking, Minor: 7)

**Patterns Identified:**

1. SonarCloud regex complexity 21 > 20: Milestones Overview lookahead had too
   many alternatives
   - Root cause: `(?=\r?\n\r?\n|\r?\n##|\r?\n---)` — 3 alternatives with shared
     prefix
   - Fix: `(?=\r?\n(?:\r?\n|##|---))` — factor out common `\r?\n`
2. Document Version regex anchoring: Matching version in full content could
   match Version History table entries
   - Root cause: Regex not constrained to header area
   - Prevention: Slice content to header area (first 4000 chars) before matching

**Resolution:**

- Fixed: 8 items across 5 files
- Rejected: 0
- Deferred: 0

**Key Learnings:**

- `spawnSync` without timeout can hang in pre-push hooks — always add
  `timeout: 3000`
- `maxBuffer` on `execFileSync` prevents crash on large diffs — add
  `maxBuffer: 5 * 1024 * 1024`
- `isTrivialChange()` needs file-type awareness: `#` lines in .sh are comments
  (trivial) but headings in .md (non-trivial)

---

#### Review #311: SonarCloud + Qodo — PR #365 Audit Ecosystem Branch (2026-02-14)

**Source:** SonarCloud Issues/Hotspots + Qodo PR Suggestions + Qodo Compliance
**PR/Branch:** claude/read-session-commits-ZpJLX (PR #365) **Suggestions:** 34
total (Critical: 1, Major: 5, Minor: 21, Security Hotspots: 7)

**Patterns Identified:**

1. Global regex lastIndex bug: Using `/g` regex with `.test()` in loops causes
   skipped matches due to persistent `lastIndex` state
   - Root cause: PATTERN_KEYWORDS array uses `/gi` flags
   - Prevention: Always reset `lastIndex = 0` or use `exec()` pattern
2. Windows cross-platform gaps: Path sanitization rejecting colons, backslash
   normalization missing in fast-path hooks
   - Root cause: Unix-first development, untested Windows paths
   - Prevention: Always normalize with `replaceAll("\\", "/")` in hooks
3. Regex complexity accumulation: pathExclude lists grow unbounded as new files
   are added, exceeding SonarCloud's complexity limit of 20
   - Root cause: Using single regex alternation for file exclusion lists
   - Prevention: Use `pathExcludeList` (string array) instead of regex
4. Unbounded `\s*` in markdown parsing regex: SonarCloud flags backtracking risk
   - Root cause: `\s*` matches unlimited whitespace including newlines
   - Prevention: Use bounded `\s{0,10}` or `[ ]*` (space-only) where newlines
     aren't expected

**Resolution:**

- Fixed: 33 items across 13 files
- Rejected: 1 item (streaming for reviews.jsonl — file is always <1KB)
- Deferred: 0

**Key Learnings:**

- `pathExcludeList` is the preferred mechanism for file exclusions (avoids regex
  complexity limits)
- Persist state cleanup (warned-files.json TTL purge was in-memory only)
- `spawnSync("git", ["rev-parse", "--show-toplevel"])` is the reliable way to
  find repo root

---

#### Review #310: Qodo PR Suggestions — Alerts v3 Health Score, Edge Cases, Path Normalization (2026-02-13)

**Source:** Qodo PR Code Suggestions **PR/Branch:**
claude/read-session-commits-ZpJLX **Suggestions:** 4 total (Critical: 0, Major:
1, Minor: 2, Architectural: 1)

**Patterns Identified:**

1. Health score inflation: Normalizing by available weight instead of total
   weight inflates scores when categories are missing.
   - Root cause: `continue` on missing categories + dynamic `totalWeight`
   - Prevention: Always normalize against fixed total possible weight
2. Initial commit edge case: `git diff HEAD~1 HEAD` fails on first commit.
   - Root cause: No parent commit to diff against
   - Prevention: Fallback to empty tree hash
     (`4b825dc642cb6eb9a060e54bf8d69288fbee4904`)
3. Backslash path separators: Windows-style `\\` in JSONL source_file fields.
   - Root cause: Audit tool outputs Windows paths
   - Prevention: Normalize at ingest time

**Resolution:**

- Fixed: 3 items (health score normalization, git diff fallback, path separators
  in 740 lines across 3 JSONL files)
- Deferred: 1 item (architectural — decompose monolithic run-alerts.js, flagged
  to user)

**Key Learnings:**

- Health score functions should normalize against fixed total weight, not
  dynamic available weight
- Git operations should handle initial-commit edge cases with empty tree hash
- JSONL data files should normalize path separators at ingest time for
  cross-platform consistency

---

#### Review #309: PR #362 R5 — ReDoS Overlapping Quantifiers, Complexity Extraction, Multiline Regex (2026-02-12)

**Source:** SonarCloud (2 S5852 + 3 code smells) + Qodo Suggestions (8)
**PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 13 total
(Fix: 9, Dismiss: 8)

**Key Patterns:**

1. **ReDoS from overlapping quantifiers: `\s*` before `[^|]*`** — Even safe
   character classes become vulnerable when preceded by `\s*` that matches the
   same whitespace. Remove redundant `\s*` when captures are `.trim()`'d anyway.
2. **Cognitive complexity reduction via standalone function extraction** —
   Extract loops and parsing logic into standalone functions (not just class
   methods) to maximize complexity reduction per extraction.
3. **`JSON.stringify()` over manual string escaping in templates** — Eliminates
   nested template literals AND handles all special characters. Safer than
   `.replaceAll('"', ...)`.
4. **Scope regex character classes to single lines with `[^\n...]`** — Generic
   negated classes like `[^|]*` or `[^,)]+` can match across newlines. Add `\n`
   to negation for line-scoped patterns.
5. **Shell `if ! var="$(cmd)"` for `set -e` safety** — Combining assignment and
   test in one statement prevents `set -e` from aborting on non-zero exit before
   the variable is set.

---

#### Review #308: PR #362 R4 — ReDoS Fix, Cognitive Complexity, Cross-Validation, Atomic Writes (2026-02-12)

**Source:** SonarCloud (1 CRITICAL) + Qodo Compliance (6) + Qodo Suggestions
(11) **PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 18 total
(Fix: 12, Dismiss: 6)

**Key Patterns:**

1. **S5852 ReDoS: Replace lazy `[^|]+?` with greedy `[^|]*` in table-parsing
   regex** (CRITICAL) — Lazy quantifiers on negated character classes create
   catastrophic backtracking. Greedy `[^|]*` is inherently safe because the
   character class can't match the delimiter.
2. **Cross-validation must APPLY mismatch, not just warn** — The old
   markdown-based scripts detected mismatches but continued using wrong values.
   Session #156 fix: replaced with `.claude/state/consolidation.json` as single
   source of truth (no cross-validation needed).
3. **Cognitive complexity reduction via function extraction** — Extract
   `crossValidateLastConsolidated()` and `parseTriggerSection()` to keep
   `getConsolidationStatus()` under 15.
4. **Backup-swap atomic write with try...finally cleanup** — Write to .tmp,
   rename existing to .bak, rename .tmp to target, clean up .bak on success.
   Restore from .bak if rename fails. Always clean up .tmp in finally block.
5. **`replaceAll` over `replace` with `/g` flag** — ES2021 `replaceAll` is
   clearer for global replacements. For literal strings, avoids regex entirely.
6. **Regex operator precedence: `^-|-$` needs `(?:^-|-$)`** — Without grouping,
   `^-|-$` is parsed as `(^-)` OR `(-$)`, not alternation of anchored patterns.
7. **Capture output once in shell hooks** — Instead of running a command twice
   (once suppressed, once to show output), capture with `$(cmd 2>&1)` and check
   `$?`. Halves execution time.

---

#### Review #307: PR #362 R3 — SonarCloud Negated Condition + File Path Warning Guard (2026-02-12)

**Source:** Qodo Compliance (3) + Qodo Suggestions (5) + SonarCloud (1)
**PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 9 total (Fix:
2, Dismiss: 7)

**Patterns Identified:**

1. Negated conditions reduce readability: `if (x !== undefined)` puts the
   exceptional case first
   - Prevention: Put positive/meaningful case first with `=== undefined`
2. Missing guard on file path warning: items with no `file` field get false
   "invalid path" warnings
   - Prevention: Guard with `normalizedFile &&` before validation

**Resolution:**

- Fixed: SC-1 (flip negated condition L128), QS-5 (guard file path warning)
- Dismissed: CMP-1 (operator field already present since R1), CMP-2 (historical
  JSONL data, not code), CMP-3 (warnings-not-errors by design), QS-1 (regex
  guarantees digits), QS-2 (validate-schema already guards), QS-3 (.test()
  converts to string), QS-4 (ensureValid covers types)

**Key Learnings:**

- SonarCloud "unexpected negated condition" catches real readability issues
- File validation should skip items without file fields entirely, not warn

---

#### Review #306: PR #362 R2 — Edge Cases: Line 0, Falsy Fields, Windows Paths (2026-02-12)

**Source:** Qodo Compliance (5) + Qodo Suggestions (6) **PR/Branch:** PR #362
(claude/new-session-uaNwX) **Suggestions:** 11 total (Fix: 4, Dismiss: 7)

**Patterns Identified:**

1. Line 0 is falsy in JS: `if (item.line)` fails for `line: 0`
   - Prevention: Use `!== undefined` for numeric fields that can be 0
2. Empty string is falsy: truthy check drops valid empty `counter_argument`
   - Prevention: Use `!== undefined` for string fields that can be empty
3. Windows path separator not checked in `isValidFilePath`
   - Prevention: Check for `.`, `/`, AND `\\` in path validation

**Resolution:**

- Fixed: QS-1 (line 0 edge case), QS-4 (preserveEnhancementFields !==
  undefined), QS-5 (isValidFilePath trim + backslash), QS-6 (validate-schema.js
  consistency)
- Dismissed: SEC-1 (terminal escape - CLI tool), CMP-1/CMP-2 (pre-existing
  code), CMP-3 (repeat), CMP-4 (trusted input), QS-2 (contradicts R1), QS-3
  (schema guarantees)

**Key Learnings:**

- `!== undefined` is safer than truthy check for any field that accepts 0 or ""
- File path validation should handle Windows backslash separators
- Qodo R2 sometimes contradicts R1 suggestions (pr_number null vs omit)

---

#### Review #305: PR #362 R1 — IMS→TDMS Merge Cognitive Complexity + Code Quality (2026-02-12)

**Source:** SonarCloud (5 issues) + Qodo Compliance (1) + Qodo Suggestions (8)
**PR/Branch:** PR #362 (claude/new-session-uaNwX) **Suggestions:** 14 total
(Fix: 9, Defer: 3, Dismiss: 1, False Positive: 1)

**Patterns Identified:**

1. Shared helper extraction for duplicated format-mapping logic
   - Root cause: mapDocStandardsToTdms and mapEnhancementAuditToTdms had 60+
     duplicated lines
   - Prevention: Extract mapFirstFileToFile + mapCommonAuditFields shared
     helpers
2. Enhancement field preservation loop replaces 10 individual if-statements
   - Root cause: Each field checked individually → high cognitive complexity
   - Prevention: preserveEnhancementFields iterates field array
3. Format stats/warnings printing extracted from main results function
   - Root cause: printProcessingResults had 3 nested print sections
   - Prevention: printFormatStats + printFilePathWarnings helpers

**Resolution:**

- Fixed: SC-1 (complexity 47→~12), SC-2 (replaceAll), SC-3 (negated condition),
  SC-4 (complexity 33→~18), SC-5 (complexity 26→~8), QS-3 (warnings on error),
  QS-5 (store normalized path), QS-6 (skip non-string coercion), QS-8 (log
  schema)
- Deferred: QS-1 (pluggable architecture), QS-2 (shared isValidFilePath export),
  QS-7 (dotless filenames)
- False Positive: QC-1 (operator already added at L867-873)

**Key Learnings:**

- Shared helpers reduce complexity across multiple callers simultaneously
- replaceAll() preferred over replace(/pattern/g) (SonarCloud es2021 rule)
- Return warnings alongside errors for complete validation feedback

---

#### Review #304: PR #361 R5 — State Wipe Prevention, Dir Symlink Guard, Fixer Safety (2026-02-12)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud **PR/Branch:**
PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** ~22 total (6 new
fixes, 5+ repeats rejected, rest compliance notes)

**Patterns Identified:**

1. Corrupt state wipe: loadWarnedFiles null + saveWarnedFiles overwrite = data
   loss
   - Root cause: applyGraduation saved even when load failed
   - Prevention: Track null vs {} separately, skip save on null
2. Directory-level symlink attacks: checking files but not parent dir
   - Root cause: Only file-level symlink check, dir can also be a symlink
   - Prevention: Check dir with isSymlink() before mkdirSync/writes

**Resolution:**

- Fixed: 6 items (state wipe prevention, dir symlink x2, isSymlink try/catch,
  ESLint fixer return removal, null title guard)
- Rejected: 16 items (repeats: String.raw, regex 38, i assignment, catch naming,
  empty catch; compliance notes: acceptable risk for local dev tool)

**Key Learnings:**

- When loadWarnedFiles returns null (corruption), caller must NOT overwrite
- Directory symlinks are as dangerous as file symlinks
- ESLint auto-fix `return;` is invalid outside functions — use empty TODO block

---

#### Review #303: PR #361 R4 — TOCTOU Symlink, Corrupt State Guard, Cognitive Complexity, Bug Fix (2026-02-12)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud **PR/Branch:**
PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** 20 total (Critical:
1, Major: 2, Minor: 7, Trivial: 5, Rejected: 5)

**Patterns Identified:**

1. TOCTOU in symlink check: existsSync before lstatSync is racy
   - Root cause: check-then-use pattern on filesystem
   - Prevention: Call lstatSync directly, handle ENOENT in catch
2. Corrupt state wipes graduation history: loadWarnedFiles returned {} on parse
   error
   - Root cause: Same fallback for "no file" and "corrupt file"
   - Prevention: Return null for corruption, {} for ENOENT, caller uses ??
3. `exclude` vs `pathExclude` property name bug in writefile-missing-encoding
   - Root cause: Copy-paste from different pattern format
   - Prevention: Schema validation for pattern definitions

**Resolution:**

- Fixed: 10 items
- Rejected: 5 items (String.raw x2, regex 38, i assignment x2 — repeats from
  R2/R3)

**Key Learnings:**

- existsSync+lstatSync is itself a TOCTOU; call lstatSync directly
- Extract helpers (tryUnlink, isSymlink) to reduce cognitive complexity
- Property name typos in config objects are silent bugs

---

#### Review #302: PR #361 R3 — Symlink Clobber, Backup-and-Replace, ESLint Loc Fallback, O(n) Index (2026-02-12)

**Source:** Qodo Compliance + Qodo Code Suggestions + SonarCloud **PR/Branch:**
PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** 14 total (Critical:
0, Major: 3, Minor: 6, Trivial: 1, Rejected: 4)

**Patterns Identified:**

1. Symlink clobber on state writes: `saveWarnedFiles` and `appendMetrics` wrote
   to fixed paths without verifying they're not symlinks
   - Root cause: mkdirSync + writeFileSync pattern doesn't check symlinks
   - Prevention: Always lstatSync before writing to verify not a symlink
2. State loss on failed rename: delete-then-rename loses data if rename fails
   - Root cause: unlinkSync before renameSync is not atomic
   - Prevention: backup-and-replace pattern (rename old to .bak, rename new,
     delete .bak)
3. ESLint fixer crash without loc: `target.loc.start.column` crashes if loc
   missing
   - Root cause: Some parsers don't populate loc
   - Prevention: Always guard with `target.loc ? ... : fallback`

**Resolution:**

- Fixed: 10 items (3 MAJOR, 6 MINOR, 1 TRIVIAL)
- Rejected: 4 items (String.raw x2 = regex false positives, regex complexity 38
  = kept for detection accuracy, i assignment x2 = intentional skip behavior)

**Key Learnings:**

- Our own BOM-handling pattern checker missed our own new code (ironic)
- Backup-and-replace is safer than delete-then-rename for atomic writes on
  Windows
- O(n^2) nested loop in TOCTOU rule indexed to O(n) with Map

---

#### Review #301: PR #342 Multi-AI Audit Data Quality - Doc Lint + Qodo (2026-02-06)

**Source:** Doc Lint + Qodo Code Suggestions **PR/Branch:**
claude/cherry-pick-commits-yLnZV (PR #342) **Suggestions:** 18 total (Doc Lint:
10, Qodo: 8; Fixed: 14, Deferred: 1, Rejected: 3)

**Patterns Identified:**

1. [SKILL.md Relative Paths]: Links in .claude/skills/ used repo-root-relative
   paths instead of ../../../ prefix
   - Root cause: Author wrote links relative to repo root, not file location
   - Prevention: Doc lint catches this automatically; run before commit

2. [JSONL Severity Standardization]: Kimi-sourced findings used P2/P3 instead of
   S2/S3
   - Root cause: Kimi model outputs non-standard severity format
   - Prevention: fix-schema.js should normalize P-severity to S-severity

3. [Duplicate CANON Entries]: 4 CANON-PERFORMANCE entries for same
   images.unoptimized finding, 1 CANON-SECURITY duplicate for App Check
   - Root cause: aggregate-category.js fingerprint matching not catching all
     variations
   - Prevention: Add fingerprint normalization (lowercase, strip punctuation)

4. [Key Naming Inconsistency]: suggested_fix vs remediation in raw JSONL
   - Root cause: Schema field was renamed but not all entries updated
   - Prevention: fix-schema.js should normalize key names

**Resolution:**

- Fixed: 14 items (SKILL.md lint x10, CANON dedup x4, severity x8, key x1)
- Deferred: 1 item (intermediate file .gitignore - architectural decision)
- Rejected: 3 items (evidence "cleanup" too minor to warrant changes)

**Key Learnings:**

- Skills in .claude/skills/ need ../../../ prefix for repo-root file links
- Kimi model outputs P-severity; add normalization to fix-schema.js pipeline
- aggregate-category.js needs more aggressive fingerprint dedup

#### Review #300: PR #351 ROADMAP Cleanup - CI + Qodo + SonarCloud (2026-02-08)

**Source:** Mixed (CI failures, Qodo PR Suggestions, SonarCloud S5852)
**PR/Branch:** claude/cherry-pick-commits-yLnZV (PR #351) **Suggestions:** 10
total (Critical: 0, Major: 2, Minor: 6, Trivial: 0, Rejected: 2)

**Patterns Identified:**

1. [Doc lint required sections]: Tier 2 docs require `Purpose/Overview/Scope`
   and `Version History` sections — TDMS plan was missing both
   - Root cause: Plan was written before doc linting was enforced
   - Prevention: Doc header + section check runs in CI on all changed `.md`
     files
2. [ReDoS in frontmatter regex]: `[\s\S]*?` with `^---` anchor creates
   backtracking risk (SonarCloud S5852)
   - Root cause: Regex used nested `[\s\S]*?` quantifiers
   - Prevention: Use string-based parsing (indexOf + split) for frontmatter
3. [Case-insensitive installId]: Plugin matching failed when case differed
   between `claude plugin list` output and marketplace directory names
   - Root cause: Set comparison was case-sensitive
   - Prevention: Normalize to lowercase on both add and lookup
4. [CLI flag injection via user args]: User query passed directly to
   `execFileSync` args could be interpreted as flags
   - Root cause: No `--` separator before user-controlled arguments
   - Prevention: Always add `--` before user input in execFileSync calls

**Resolution:**

- Fixed: 8 items (TDMS Purpose + Version History, readFileSync try/catch ×2,
  ReDoS regex → string parsing, case-insensitive installId, empty array catch,
  `--` flag injection, args as array)
- Rejected: 2 items (`.agents` naming is correct, slice vs substring no
  difference)

**Key Learnings:**

- Auto-generated DOCUMENTATION_INDEX.md picks up
  `<!-- prettier-ignore-start -->` as description if it's the first non-heading
  line — need to fix generator
- Pattern compliance `pathExcludeList` is the correct way to handle verified
  try/catch files

---

#### Review #299: PR #361 R2 — Cognitive Complexity, ESLint Fixer Safety, Cross-Platform Fixes (2026-02-12)

**Source:** SonarCloud + Qodo Code Suggestions **PR/Branch:** PR #361
(claude/analyze-repo-install-ceMkn) **Suggestions:** 23 total (Critical: 3,
Major: 10, Minor: 10)

**Patterns Identified:**

1. Cognitive complexity extraction: SonarCloud flags functions at CC 16-17
   (threshold 15)
   - Root cause: Mixed concerns in single functions (formatting + logic + I/O)
   - Prevention: Extract formatting helpers (formatResultRow, printViolation,
     printSummaryFooter)
2. ESLint auto-fixer scope safety: VariableDeclaration wrapping changes variable
   scope
   - Root cause: Auto-fix assumed all statements could be wrapped in try/catch
   - Prevention: Only auto-fix ExpressionStatements, return null for others
3. Cross-platform atomic rename: renameSync fails on Windows if destination
   exists
   - Root cause: POSIX rename is atomic, Windows rename requires destination
     removal
   - Prevention: unlinkSync destination before renameSync
4. Path normalization for state tracking: backslash vs forward slash
   inconsistency
   - Root cause: Windows paths use backslash, state keys stored with mixed
     separators
   - Prevention: Normalize with replaceAll("\\", "/") before key creation
5. Parser-agnostic AST node positioning: ESLint rules using deprecated
   node.start/end
   - Root cause: Different parsers provide range or loc but not both
   - Prevention: Check range first, fall back to loc-based calculation
6. String.raw SonarCloud findings: False positive on regex literal `[\\/]`
   - Root cause: SonarCloud can't distinguish regex escapes from string escapes
   - Resolution: Reviewed-safe (regex literals, not template strings)

**Resolution:**

- Fixed: 18 items
- Reviewed-safe: 5 (3 regex complexity in detection patterns, 2 String.raw false
  positives)

**Key Learnings:**

- Extract helper functions to reduce cognitive complexity below SonarCloud
  threshold
- ESLint auto-fixers must never change variable scope (wrap only
  ExpressionStatements)
- Windows needs unlinkSync before renameSync for atomic write pattern
- Normalize path separators in state tracking keys for cross-platform
  consistency

---

#### Review #298: PR #361 — Graduation State Safety, Append Flag, JSON Parse Guards (2026-02-12)

**Source:** Qodo Compliance + SonarCloud + Qodo Code Suggestions + Doc Lint
**PR/Branch:** PR #361 (claude/analyze-repo-install-ceMkn) **Suggestions:** 19
total (Critical: 0, Major: 5, Minor: 8, Trivial: 4, Deferred: 1)

**Patterns Identified:**

1. TOCTOU in loadWarnedFiles: existsSync + readFileSync race condition
   - Root cause: Copied common Node.js pattern without thinking about atomicity
   - Prevention: Direct read in try/catch, check err.code for ENOENT
2. Non-atomic saveWarnedFiles: writeFileSync without tmp+rename
   - Root cause: "Best effort" state file didn't seem critical enough for atomic
   - Prevention: All state files should use atomic write pattern
3. Unbounded file growth via read+append pattern: readFileSync + writeFileSync
   - Root cause: Didn't know about `{ flag: 'a' }` option
   - Prevention: Use append flag for JSONL files
4. Silent catch blocks in the very file that detects them (ironic)
   - Root cause: Graduation state is "best effort" but still needs visibility
   - Prevention: At minimum log with sanitizeError
5. SonarCloud regex DoS (5 hotspots): Patterns in check-pattern-compliance.js
   - Assessment: SAFE — inputs are bounded source files, not user input
   - V8 has backtracking limits; pre-commit has timeout protections
6. ESLint auto-fix generates swallowed catch blocks
   - Root cause: Template aimed for minimal disruption, too minimal
   - Prevention: Auto-fix should re-throw to preserve failure behavior

**Resolution:**

- Fixed: 17 items
- Deferred: 1 item (consolidate regex linter into ESLint — architectural scope)
- Reviewed-Safe: 5 SonarCloud regex hotspots (bounded input, not user-facing)

**Key Learnings:**

- State persistence code needs the same rigor as production code
- Pattern checker should eat its own dog food (practice what it preaches)
- JSONL append: use `{ flag: 'a' }` not read+concatenate+write

---

#### Review #297: PR #359 R3 — Windows Atomic Writes, Null State Dir, Evidence Dedup (2026-02-11)

**Source:** Qodo Code Suggestions **PR/Branch:** PR #359
(claude/analyze-repo-install-ceMkn) **Suggestions:** 11 total (Critical: 0,
Major: 0, Medium: 8, Low: 3)

**Accepted (10):**

1. **state-utils.js getStateDir null fallback**: Return `null` instead of
   `projectDir` when state dir creation fails — prevents writing to wrong
   location. Updated all 4 callers with null guards.
2. **Windows-safe atomic writes (7 locations)**: Added
   `fs.rmSync(dest, {force: true})` before `fs.renameSync()` across
   session-start.js, large-context-warning.js (2x), agent-trigger-enforcer.js
   (2x), commit-tracker.js, auto-save-context.js. Also added `.tmp` cleanup in
   catch blocks where missing.
3. **DEBT-2450 evidence dedup**: Removed duplicated `code_reference` and
   `description` objects in MASTER_DEBT.jsonl and deduped.jsonl.

**Deferred (1):**

1. **merged_from unknown removal**: Removing `merged_from: ["unknown"]` could
   break downstream scripts that expect the field to always exist.

**Key Pattern:** Windows `fs.renameSync` fails if destination exists — always
`rmSync` first. This is CODE_PATTERNS.md "Windows atomic rename" pattern
(already documented).

---

#### Review #296: PR #359 R2 — Path Redaction, Atomic Writes, State Dir Fallback (2026-02-10)

**Source:** Qodo Compliance + Code Suggestions **PR/Branch:** PR #359
(claude/analyze-repo-install-ceMkn) **Suggestions:** 7 total (Critical: 0,
Major: 2, Minor: 5, Trivial: 0)

**Patterns Identified:**

1. **Path info leakage (conflicting reviews)**: Review #283 Qodo asked for full
   paths; Review #284 Qodo flagged full paths as security risk. Resolution: use
   `path.basename()` — security wins over debuggability
   - Root cause: Reviewers optimize for different concerns
   - Prevention: Default to `path.basename()` in hook logs
2. **Non-atomic file writes**: `writeFileSync` without tmp+rename risks
   corruption on interruption
   - Root cause: Original code used simple writeFileSync
   - Prevention: Always use tmp+rename pattern for state files

**Resolution:**

- Fixed: 7 items (2 path redaction, 4 atomic writes, 1 state dir fallback)
- Deferred: 0
- Rejected: 0

**Key Learnings:**

- When reviewers conflict, security concerns take priority
- Atomic write pattern: `writeFileSync(tmp) → renameSync(tmp, target)`
- State dir creation should fall back to projectDir on failure

---

#### Review #295: PR #359 — Unsafe err.message, Silent Catches, Full Filepath Logging (2026-02-10)

**Source:** SonarCloud + Qodo + CI Pattern Compliance **PR/Branch:** PR #359
(claude/analyze-repo-install-ceMkn) **Suggestions:** 15 total (Critical: 9,
Major: 0, Minor: 4, Trivial: 0)

**Patterns Identified:**

1. **Unsafe err.message access (recurring)**: Wave 2 agents added `console.warn`
   with `err.message` but didn't use safe pattern
   - Root cause: Agent prompt didn't specify the safe pattern explicitly
   - Prevention: Pattern checker catches this in CI; always use
     `err instanceof Error ? err.message : String(err)`
2. **Silent catch blocks**: Empty catches swallow errors, hindering debugging
   - Root cause: Defensive "don't break hooks" approach went too far
   - Prevention: Always log at minimum `console.warn` with context

**Resolution:**

- Fixed: 13 items (9 unsafe err.message, 2 silent catches, 2 filepath logging)
- Deferred: 2 items (atomic writes for state files — architectural change)
- Rejected: 1 item (SonarCloud L396 false positive — checklist text contains
  "Error" word)

**Key Learnings:**

- Agent-generated code must be validated against project pattern rules
- The `err instanceof Error ? err.message : String(err)` pattern is enforced by
  CI — new code MUST use it

---

#### Review #294: PR #360 R12 — CI Fix, TOCTOU Recheck, BiDi Strip, ID Validation, Log Decoupling (2026-02-11)

**Source:** CI Failure (ESLint no-control-regex) + Qodo Compliance R12 + Qodo
Code Suggestions R12 **PR/Branch:** claude/new-session-NgVGX (PR #360)
**Suggestions:** 12 code + 2 compliance (Security: 2, Medium: 7, Low: 3,
Compliance: 2)

**Patterns Identified:**

1. **CI failure**: `eslint-disable-next-line` doesn't work when the regex is on
   a subsequent line from `.replace(` — use block-level
   `eslint-disable`/`enable` instead.
2. **TOCTOU recheck**: assertNotSymlink must be called immediately before
   unlinkSync, not just at function entry, to close the race window.
3. **BiDi spoofing**: Unicode bidirectional control characters (\u202A-\u202E,
   \u2066-\u2069) can spoof terminal/log output — strip them.
4. **escapeMarkdown robustness**: Non-string inputs need String() coercion; \r\n
   should be normalized, not just \n.
5. **ID propagation**: Only valid ENH-XXXX IDs should populate idMap —
   invalid/legacy IDs should not be mapped for stable lookup.
6. **Log decoupling**: Separate try/catch for log vs review file writes prevents
   one failure from blocking the other.
7. **Line number strictness**: parseInt("12abc", 10) silently returns 12 — use
   digits-only regex guard.

**Resolution:**

- Fixed: 12 items across 6 scripts + learnings log
- Deferred: 0
- CI: green (0 ESLint errors)

**Key Learnings:**

- `eslint-disable-next-line` applies to the NEXT LINE only; multi-line
  `.replace()` calls put the regex on line+2, requiring block-level
  disable/enable
- Extracted `sanitizeLogSnippet()` with compiled regexes at module scope for
  reuse
- TOCTOU mitigation: re-assert symlink check immediately before destructive
  operation
- BiDi control chars: `/[\u202A-\u202E\u2066-\u2069]/g`
- `String(text)` coercion handles numeric/boolean inputs in escapeMarkdown
- `/^\d+$/.test(s)` guards parseInt from accepting malformed strings like
  "12abc"
- `toLineNumber()` should reject 0 and negative values for line numbers

---

#### Review #293: PR #360 R11 — Markdown Injection, EEXIST Recovery, Windows Compat, Schema Validation (2026-02-11)

**Source:** Qodo Compliance R11 + Qodo Code Suggestions R11 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 11 code + 2 compliance
(Security: 2, Medium: 7, Low: 2, Compliance: 2)

**Patterns Identified:**

1. **Markdown injection**: escapeMarkdown only handled pipe/newline — need HTML
   tag stripping to prevent `<script>` injection in rendered Markdown views.
2. **Stale temp files**: `wx` flag fails on EEXIST if a previous run crashed —
   need cleanup-and-retry fallback.
3. **Deep nesting**: safeCloneObject silently truncated at depth 200 — should
   throw to surface malicious/malformed input explicitly.
4. **Non-fatal fallback writes**: deduped.jsonl is regenerated by dedup
   pipeline, so write failure should warn rather than exit(2).
5. **Cross-source pollution**: MASTER_DEBT.jsonl parser lacked safeCloneObject
   protection (moved safeCloneObject to module scope).
6. **Terminal escape injection**: Untrusted content in error messages could
   inject ANSI escape sequences into terminal output.
7. **Windows compat**: fs.renameSync fails on Windows when destination exists —
   need unlink-before-rename pattern.

**Resolution:**

- Fixed: 11 items across 7 files (6 scripts + learnings log)
- Deferred: 0

**Key Learnings:**

- `<[^>]*>` regex strips HTML tags from Markdown output to prevent injection
- EEXIST recovery: unlink stale tmp + retry with wx flag
- safeCloneObject should throw on depth > 200, not silently truncate
- Fallback/regenerable files should use console.warn, not process.exit
- Terminal escape strip regex:
  `/[\u001b\u009b][[()#;?]*...[0-9A-ORZcf-nqry=><]/g`
- Windows rename compat: `if (existsSync) unlinkSync` before `renameSync`
- Schema config arrays should be validated immediately after load

---

#### Review #292: PR #360 R10 — Fail-Closed Guards, safeClone Coverage, DoS Cap, Audit Trail (2026-02-11)

**Source:** Qodo Compliance R10 + Qodo Code Suggestions R10 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 11 code + 4 compliance
(High: 5, Medium: 4, Low: 2, Compliance: 4)

**Patterns Identified:**

1. **assertNotSymlink fail-closed**: Previous impl swallowed unknown errors —
   must rethrow to prevent silent bypass of symlink protection.
2. **safeCloneObject coverage gap**: resolve-item.js and validate-schema.js
   parsed JSONL without prototype pollution protection (dedup + generate-views
   already had it).
3. **Temp file hardening**: Atomic write tmp files need their own symlink
   check + `wx` flag to prevent TOCTOU race conditions.
4. **Algorithmic DoS**: Pass 2 (near-match) was unbounded O(n^2) — added
   5000-item cap.
5. **Audit trail**: dedup-log.jsonl lacked operator/timestamp metadata for
   traceability.
6. **Pipeline write resilience**: Append writes to
   normalized-all.jsonl/deduped.jsonl were unwrapped, risking partial state on
   I/O failure.

**Resolution:**

- Fixed: 11 items across 7 files (5 scripts + validate-schema + learnings log)
- Deferred: 1 (evidence data dedup — pipeline handles)

**Key Learnings:**

- assertNotSymlink must rethrow at end of catch to fail closed on unexpected
  errors
- `{ flag: "wx" }` prevents overwriting existing tmp files (TOCTOU defense)
- Pairwise pass cap (MAX_PAIRWISE_ITEMS=5000) prevents quadratic blowup
- run_metadata entry in dedup log enables standalone execution reconstruction
- Pipeline append writes need try/catch + process.exit(2) for controlled failure
- Sanitize BOTH existing evidence and new acceptance evidence for consistency

---

#### Review #291: PR #360 R9 — Prototype Pollution Guard, Fail-Closed Symlink, Atomic Writes (2026-02-11)

**Source:** Qodo Compliance R9 + Qodo Code Suggestions R9 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total (High: 5, Medium:
3, Low: 3, Deferred: 1)

**Patterns Identified:**

1. **Prototype pollution**: JSONL records parsed from disk need `__proto__`,
   `constructor`, `prototype` keys stripped before spread/merge —
   `safeCloneObject`.
2. **Fail-closed symlink guard**: EACCES/EPERM during lstat means we can't
   verify symlink status — must refuse write, not silently proceed.
3. **Atomic write for canonical output**: MASTER_IMPROVEMENTS.jsonl needs atomic
   write-to-tmp-then-rename in generate-views.js (already done in
   resolve-item.js).
4. **Schema-stable reviewNeeded entries**: `item_a` should always be a full item
   (or null), metadata goes in a separate `meta` field.
5. **Symlink guard coverage**: generate-metrics.js (3 write paths) and
   resolve-item.js (saveMasterImprovements + logResolution) were unguarded.

**Resolution:**

- Fixed: 10 items across 5 files
- Deferred: 1 (evidence dedup data fix — pipeline handles)

**Key Learnings:**

- `safeCloneObject` with `Object.create(null)` prevents prototype pollution from
  JSONL
- Fail-closed: if lstat throws EACCES/EPERM, throw rather than silently continue
- Atomic write pattern: writeFileSync to `.tmp.${pid}` + renameSync + finally
  cleanup
- reviewNeeded entries: consistent shape (`item_a`, `item_b`, `meta`) aids
  downstream
- Acceptance evidence: sanitize with type coercion, trim, filter, and length cap
  (500)
- BOM strip on first line + CRLF trimEnd prevents parse failures on
  Windows-edited files

---

#### Review #290: PR #360 R8 — CI Fix, Pass 0 No-File Guard, Symlink Guards Expansion, Format Precision (2026-02-11)

**Source:** Qodo Compliance R8 + Qodo Code Suggestions R8 + CI Failure
**PR/Branch:** claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total
(Blocker: 2, High: 1, Minor: 8, Deferred: 1)

**Patterns Identified:**

1. **CI blocker**: Pattern checker flagged `err.message` in assertNotSymlink
   catch blocks — needed `instanceof Error` guard to satisfy automated checker.
2. **Pass 0 no-file guard**: Items without file paths were grouped together by
   empty string key, causing unrelated items to merge. Use `randomUUID()` keys.
3. **Symlink guard expansion**: logIntake() and all generate-views.js write
   paths needed assertNotSymlink() before writes.
4. **Enhancement-audit format precision**: Truthy checks on fields like `[]` or
   `""` could false-positive; need type-precise checks.
5. **Pass 3 safety cap**: 50,000 comparison cap per file group prevents hang on
   pathological inputs.

**Resolution:**

- Fixed: 11 items (2 CI blockers + 9 improvements)
- Deferred: 1 (evidence dedup data fix — pipeline handles)

**Key Learnings:**

- Pattern checker requires `instanceof Error` before `.message` — use canonical
  form
- Pass 0 parametric dedup: items without `file` must not share group keys
- `crypto.randomUUID()` creates unique keys for ungroupable items
- Enhancement-audit detection: check `typeof === "string" && trim()` and
  `Array.isArray && length > 0`
- `__dirname` for child script paths ensures CWD independence
- Fingerprint field needs type guard (`typeof !== "string"` → error, not crash)
- Number.isFinite rejects NaN/Infinity; for-loop catches sparse array holes

---

#### Review #289: PR #360 R7 — Symlink Guards, Pass 3 File Grouping, Schema Hardening, Honesty Guard (2026-02-11)

**Source:** Qodo Compliance R7 + Qodo Code Suggestions R7 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 12 total (Major: 1, Minor:
9, Deferred: 2)

**Patterns Identified:**

1. **Symlink file overwrite**: Writing to fixed JSONL paths without checking for
   symlinks enables local arbitrary file write. Added `assertNotSymlink()` guard
   using `fs.lstatSync()` before all file writes.
2. **Pass 3 file grouping**: Grouping items by file path before pairwise
   comparison reduces semantic match cost from O(n²) to O(n²/k) where k is the
   number of unique files. Partially addresses DEBT-2747.
3. **Honesty guard**: Enhancement-audit format items should require
   `counter_argument` to maintain data integrity.
4. **Schema config hardening**: Array validation should check element types, not
   just `Array.isArray()`. Confidence threshold needs range bounds (0-100).

**Resolution:**

- Fixed: 10 items
- Skipped: 0
- Deferred: 2 (evidence dedup data fix, placeholder provenance data fix —
  pipeline handles)

**Key Learnings:**

- Symlink guard pattern: `fs.lstatSync().isSymbolicLink()` before writes, ENOENT
  is safe
- File grouping for pairwise passes reduces complexity proportionally to file
  distribution
- `new RegExp(source)` drops flags — use
  `new RegExp(source, flags.replace(/g|y/g, ""))` + `lastIndex=0`
- Non-fatal operator hashing: initialize with fallback, single try/catch,
  String() coercion
- Honesty guard: `counter_argument` required for enhancement-audit format inputs
- Whitespace-only strings should be treated as missing for required fields
- Schema arrays should validate element types (isStringArray), not just
  Array.isArray
- Confidence threshold needs range validation (0-100) in schema config

---

#### Review #288: PR #360 R6 — Semantic Merge Logic, PII in Logs, Timestamp Integrity, Path Normalization (2026-02-11)

**Source:** Qodo Compliance R6 + Qodo Code Suggestions R6 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 10 total (Major: 2, Minor:
6, Deferred: 2)

**Patterns Identified:**

1. **Flag-only vs destructive merge**: Pass 3 semantic matches were flagged for
   review AND merged simultaneously — defeating the purpose of the review flag.
   Changed to flag-only (no merge) so human review is meaningful.
2. **PII in audit logs**: Raw operator username and full input_file paths
   constitute PII. Hash the operator (SHA-256 truncated to 12 chars) and log
   only `path.basename(inputFile)`.
3. **Timestamp integrity**: `{ timestamp, ...activity }` lets the activity
   object overwrite the timestamp. Reversed spread order:
   `{ ...activity, timestamp }`.
4. **Stateful regex in loops**: `RegExp.test()` with global/sticky flags has
   stateful `lastIndex`, causing intermittent failures in loops.

**Resolution:**

- Fixed: 8 items
- Skipped: 0
- Deferred: 2 (streaming JSONL — arch change; dedup audit coverage — scope
  expansion)

**Key Learnings:**

- Semantic match Pass 3 should flag-only, not merge — uncertain items need human
  review
- PII compliance: hash usernames, log only basenames of file paths
- Spread order matters: `{ ...obj, timestamp }` protects system-generated fields
- Guard `RegExp.test()` in loops against stateful g/y flags
- `normalizeFilePath` should strip trailing `:line` suffixes for hash
  consistency
- Non-object JSON (null, arrays, primitives) can pass `JSON.parse()` — validate
  type
- Audit outcome should reflect scope: "ingested" vs "success" when downstream
  steps remain
- Empty evidence arrays should be deleted, not set to `[]`

---

#### Review #287: PR #360 R5 — impactSort Falsy Bug, ID Drift, Audit Outcome, Evidence Sanitization (2026-02-11)

**Source:** Qodo Compliance R5 + Qodo Code Suggestions R5 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 8 total (Major: 2, Minor: 5,
Deferred: 1)

**Patterns Identified:**

1. **Falsy 0 in lookup tables**: `order[a.impact] || 4` treats I0 (value 0) as
   falsy, making I0 items sort last instead of first. Use `??` (nullish
   coalescing) for numeric lookup tables.
2. **ID drift from @line: suffixes in merged_from**: Source IDs with `@line:N`
   suffixes don't match their base form during ID lookup, causing duplicate ENH
   IDs across regeneration cycles.
3. **Always sanitize, not just on merge**: Evidence arrays should be sanitized
   unconditionally, not only when secondary has items — otherwise malformed data
   in primary persists.
4. **Audit log outcome field**: Without an explicit success/failure outcome,
   downstream consumers must infer result from error counts.

**Resolution:**

- Fixed: 7 items
- Skipped: 0
- Deferred: 1 (resource exhaustion — already DEBT-2747 S2 scope)

**Key Learnings:**

- `||` vs `??` for numeric lookup: 0 is falsy, null/undefined are nullish
- merged_from IDs with @line: suffixes need base-form normalization for stable
  lookups
- Evidence sanitization must run unconditionally (no guard on secondary length)
- Audit logs need explicit outcome field (success/partial_failure/failure)
- logIntake needs same try/catch pattern as logResolution (Review #286 R4)
- BOM stripping needed in intake-audit.js too, not just validate-schema.js

---

#### Review #286: PR #360 R4 — Prototype Pollution, TOCTOU, Evidence Sanitization, CLI Robustness (2026-02-11)

**Source:** Qodo Compliance R4 + Qodo Code Suggestions R4 **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 11 total (Major: 2, Minor:
5, Trivial: 1, Deferred: 3 — 1 new IMS + 2 already tracked)

**Patterns Identified:**

1. **safeCloneObject must be applied immediately after JSON.parse**: The
   prototype pollution fix (safeCloneObject) was being bypassed because the raw
   parsed object was passed to validateAndNormalize before cloning. Clone at the
   earliest point possible.
2. **TOCTOU in path validation**: validateAndVerifyPath returns a realPath but
   the code was still using the original filePath for subsequent reads. Always
   use the validated realPath for file operations.
3. **Evidence array type sanitization**: Evidence arrays from JSONL may contain
   non-string values. Filter to strings + trim + deduplicate.
4. **UTF-8 BOM on first line**: Files saved from Windows editors may have BOM
   prefix that breaks JSON.parse on line 1.
5. **Absolute script paths in execFileSync**: Using relative paths like
   "scripts/improvements/..." fails if CWD is not project root. Use
   path.join(\_\_dirname, ...) instead.

**Resolution:**

- Fixed: 8 items
- Skipped: 0
- Deferred: 3 (1 new ENH-0003 Markdown injection, 2 already tracked)

**Key Learnings:**

- safeCloneObject must wrap JSON.parse output BEFORE any property access
- TOCTOU: always use validated/resolved path for all subsequent file operations
- Evidence arrays need type + trim + dedup sanitization (not just Array.isArray)
- BOM stripping is essential for cross-platform JSONL parsing
- CLI scripts must use \_\_dirname-relative paths for execFileSync portability
- Logging functions should never crash the main flow — wrap in try/catch
- Validation errors go to stderr (console.error), not stdout (console.log)

---

#### Review #285: PR #360 R3 — Pre-commit Hook Fix, Final severity Sweep, Defensive Parsing (2026-02-11)

**Source:** Qodo Code Suggestions R3 + CI Failure **PR/Branch:**
claude/new-session-NgVGX (PR #360) **Suggestions:** 7 total (Critical: 1, Major:
2, Minor: 4)

**Patterns Identified:**

1. **DOCUMENTATION_INDEX.md Prettier CI failure (3rd occurrence!)**: Root cause
   identified — pre-commit hook regenerates the file AFTER lint-staged runs
   Prettier, so the regenerated file is unformatted. Fixed by adding
   `npx prettier --write` after `npm run docs:index` in the hook.
2. **severity→impact in resolve-item.js:220**: Yet another missed occurrence. R1
   fixed mergeItems, R2 fixed hasHighImpact/clustering/counts, R3 fixed display
   output. Lesson: field renames need `grep -rn` across the ENTIRE
   scripts/improvements/ directory, not just individual files.
3. **Object.create(null) for prototype-less clones**: Using `{}` still has
   Object.prototype, while `Object.create(null)` is truly safe for untrusted
   data.

**Resolution:**

- Fixed: 7 items
- Skipped: 0
- Deferred: 0

**Key Learnings:**

- Pre-commit hooks that regenerate files MUST re-run formatters before staging
- Field renames across a codebase need `grep -rn` on the ENTIRE directory
- Three rounds to fully sweep severity→impact proves grep-first approach is
  essential
- Object.create(null) is safer than {} for untrusted data cloning

---

### Review #349: PR #371 R3 — Argument Injection, Suppression Scope, Pipeline Robustness

**Date:** 2026-02-17 **Source:** Qodo PR Compliance + Code Suggestions
**PR/Branch:** PR #371

**Summary:** 7 suggestions (4 consolidated to 1 MAJOR, 2 MINOR, 1 rejected).
Main issue: unquoted `$staged_js` in the new CC pre-commit gate enabled argument
injection via crafted filenames and broke on filenames with spaces. Fixed by
switching from bare `$staged_js` expansion to `printf | xargs ... --` pattern,
which handles word-splitting safely and uses `--` to prevent `-`-prefixed
filenames from being interpreted as flags.

**Patterns Identified:**

1. **Unquoted shell variable in command arguments**: `$staged_js` was passed
   directly to `npx eslint`, enabling both argument injection (filenames
   starting with `-`) and word-splitting on spaces/newlines. Fixed with
   `printf '%s\n' "$staged_js" | xargs ... --` pattern.
2. **Qodo suppression scope mismatch**: `pr_compliance_checker` section scoped
   to `scripts/` and `.claude/hooks/` but not `docs/technical-debt/`, causing
   "Absolute path leakage" false positives to persist on TDMS data files.
3. **grep|head pipeline not fail-safe**: In a Husky hook that may run with
   `set -e`, `grep "complexity" | head -10` would terminate the script if grep
   finds no matches, before the proper error message is displayed.

**Resolution:**

- Fixed: 5 items (consolidated from 7 — 4 overlapping suggestions merged)
- Rejected: 1 item (reviews.jsonl id type — string IDs for retro entries are
  intentional and consistent across retro-367 through retro-371)
- Deferred: 0

**Key Learnings:**

- Shell variables used as command arguments must be quoted or piped through
  xargs
- The `--` separator prevents filenames from being parsed as flags
- Qodo compliance checker has separate scope from pr_reviewer — both need
  matching suppression rules
- Pipeline commands in hooks should append `|| true` when running under set -e

---
