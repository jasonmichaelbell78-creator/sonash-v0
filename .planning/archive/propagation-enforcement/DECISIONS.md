<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# DECISIONS: 3-Layer Propagation Enforcement

**Research:** `.planning/archive/propagation-research/` **Diagnosis:**
`.planning/propagation-enforcement/DIAGNOSIS.md`

---

| #   | Decision                             | Choice                                                                                                                                           | Rationale                                                                     |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| D1  | Refactor or replace existing scripts | Refactor both to consume shared registry                                                                                                         | Preserve existing baseline support, skip flags, diff parsing, hook wiring     |
| D2  | Pattern registry format              | Categorized JSON: `id`, `description`, `pattern`, `antiPattern`, `searchGlob`, `severity`, `source`                                              | Self-documenting, filterable by severity, auditable                           |
| D3  | Pre-commit blocking behavior         | Configurable per-pattern via registry `severity` field (BLOCK or WARN)                                                                           | Security patterns BLOCK, newer/lower-confidence patterns WARN until validated |
| D4  | Pre-push scope expansion             | `scripts/**/*.js`, `lib/**/*.{js,ts,tsx}`, `.claude/hooks/**/*.js`, `.claude/skills/**/*.md`                                                     | Covers all historically affected areas                                        |
| D5  | Pre-commit scan scope                | Glob from registry — `searchGlob` field per pattern entry                                                                                        | Per-pattern control; security scans broad, niche scans narrow                 |
| D6  | Skip/override mechanism              | Align both with `SKIP_CHECKS` infrastructure + `SKIP_REASON` required                                                                            | Consistent with other hooks, feeds `/alerts`                                  |
| D7  | Baseline integration                 | Keep existing `known-propagation-baseline.json`, share across both scripts                                                                       | Already scaffolded; add `addedAt` and `reason` fields to entries              |
| D8  | CANON registration                   | Register `propagation-staged` in `hook-checks.json` with `blocking: "block"`                                                                     | Closes CANON registry gap                                                     |
| D9  | Initial registry contents            | Seed 10 patterns from retro evidence (see list below)                                                                                            | All have 4-6x recurrence across 13+ PRs                                       |
| D10 | Detection mode                       | Diff-based: scan `git diff --cached` for pattern matches, not full file content                                                                  | More precise, fewer false positives than full-file scanning                   |
| D11 | Miss definition                      | Primary: `antiPattern` presence (bad version). Optional `missDetection` field for pattern-absence mode                                           | Look for the bad version by default; configurable per entry                   |
| D12 | Keep function-name diffing           | Yes — keep Mode A alongside new registry Mode B in pre-push                                                                                      | Catches different class of propagation (renamed/refactored functions)         |
| D13 | antiPattern vs pattern               | `pattern` = correct usage regex, `antiPattern` = incorrect usage regex (nullable for import-check patterns)                                      | Covers both regex-based and function-import patterns                          |
| D14 | JSON output                          | Add `--json` flag: `{ patterns, misses, blocked }`                                                                                               | Feeds `/alerts` and `/pr-retro` cleanly                                       |
| D15 | Test strategy                        | Unit tests for registry loader + pattern matching. Integration via `test-hook-gates.js`. No e2e git tests                                        | Registry logic testable in isolation; hook wiring already proven              |
| D16 | Performance budget                   | 2-second budget for pre-commit propagation check; log warning if exceeded                                                                        | Prevents propagation check from dominating 19s pre-commit pipeline            |
| D17 | Registry maintenance                 | AI-directed: `pr-retro` and `pr-review` skills auto-detect propagation misses and propose additions. Registry header documents format for Claude | Matches non-developer AI-directed workflow; no CLI script needed              |
| D18 | Pattern compliance overlap           | None — propagation and pattern-compliance stay independent                                                                                       | Complementary checks: anti-patterns vs incomplete fixes                       |
| D19 | Debt resolution                      | DEBT-45524/45525 (skip abuse): resolved-by-plan. DEBT-11335/11339 (backlog): populate baseline with current violations, resolve incrementally    | Skip abuse drops with proper BLOCK/WARN severity; backlog gets tracked        |

## D9: Initial Pattern Registry

| #   | ID               | Pattern (correct)                  | AntiPattern (incorrect)                      | Severity | searchGlob                               |
| --- | ---------------- | ---------------------------------- | -------------------------------------------- | -------- | ---------------------------------------- |
| 1   | `sanitize-error` | `sanitizeError(`                   | Raw `error.message` without sanitize         | BLOCK    | `scripts/**/*.js`                        |
| 2   | `safe-to-write`  | `isSafeToWrite(`                   | `writeFileSync(` without symlink guard       | BLOCK    | `scripts/**/*.js, .claude/hooks/**/*.js` |
| 3   | `lstat-symlink`  | `lstatSync(` with `isSymbolicLink` | `statSync(` without `isSymbolicLink()` guard | BLOCK    | `scripts/**/*.js`                        |
| 4   | `validate-path`  | `validatePathInDir(`               | `path.resolve(` without containment check    | BLOCK    | `scripts/**/*.js`                        |
| 5   | `escape-cell`    | `escapeCell(`                      | Markdown write without `escapeCell(`         | WARN     | `scripts/**/*.js`                        |
| 6   | `exec-path`      | `process.execPath`                 | `"node"` in `execFileSync` calls             | WARN     | `scripts/**/*.js`                        |
| 7   | `safe-write`     | `safeWriteFileSync(`               | Direct `writeFileSync(`                      | BLOCK    | `scripts/**/*.js, .claude/hooks/**/*.js` |
| 8   | `path-traversal` | `/^\.\.(?:[\\/]\|$)/.test(rel)`    | `startsWith('..')`                           | BLOCK    | `scripts/**/*.js`                        |
| 9   | `refuse-symlink` | `refuseSymlink(`                   | Missing symlink rejection                    | BLOCK    | `scripts/**/*.js`                        |
| 10  | `number-nan`     | `Number.NaN`                       | Bare `NaN`                                   | WARN     | `scripts/**/*.js, lib/**/*.ts`           |
