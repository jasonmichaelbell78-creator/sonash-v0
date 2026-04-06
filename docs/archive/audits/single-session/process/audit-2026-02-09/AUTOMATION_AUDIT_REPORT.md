<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Automation Audit Report — 2026-02-09

## Executive Summary

- **Total findings:** 258
- **By severity:** 3 S0, 24 S1, 88 S2, 139 S3, 4 S4
- **By effort:** 12 E0 (trivial), 120 E1 (hours), 112 E2 (day), 14 E3
  (multi-week)
- **Stages completed:** 7/7
- **Parallel agents used:** 22

### Findings by Stage

| Stage                   | Focus         | Findings |
| ----------------------- | ------------- | -------- |
| Stage 2 (Redundancy)    | Redundancy    | 45       |
| Stage 3 (Effectiveness) | Effectiveness | 62       |
| Stage 4 (Performance)   | Performance   | 41       |
| Stage 5 (Quality)       | Quality       | 38       |
| Stage 6 (Improvements)  | Improvements  | 72       |
| **Total**               |               | **258**  |

---

## Inventory Summary (Stage 1)

- **Claude Hooks:** 33 JavaScript hooks across 7 event types
- **Husky Hooks:** 2 (pre-commit with 14 checks, pre-push with 7 checks)
- **lint-staged:** 1 rule (Prettier auto-format)
- **Scripts:** 56 JavaScript + 14 TypeScript files
- **Shared Libraries:** 4 (security-helpers, validate-paths, ai-pattern-checks,
  sanitize-error)
- **npm Scripts:** 76 scripts in package.json
- **GitHub Workflows:** 10 YAML workflows
- **Claude Skills:** 49 skills
- **Firebase Functions:** 5 callable + 7 scheduled + 33 admin
- **MCP Servers:** 5 active, 6 disabled/template-only
- **Config Files:** 2 ESLint, 1 Prettier, 4 TypeScript configs

---

## Critical Findings (S0)

### CI gap: pull_request_target security vulnerability allows untrusted code execution

- **Files:** .github/workflows/deploy-firebase.yml:7
- **Why:** Using pull_request_target with code checkout from PR head (line 32)
  allows malicious PRs to execute arbitrary code with repository secrets access.
  This is a well-documented GitHub Actions security anti-pattern that could lead
  to credential theft or repository compromise.
- **Fix:** Replace pull_request_target with pull_request and use a separate
  workflow for preview deploys that runs after CI passes. Alternatively, use
  pull_request_target but only checkout base branch code, then merge PR changes
  in a sandboxed environment. See GitHub's security hardening guide.

### Error handling: continueOnError used appropriately in settings.json

- **Files:** .claude/settings.json:24, .claude/settings.json:31,
  .claude/settings.json:250
- **Why:** continueOnError is correctly used for non-critical operations: remote
  branch checks (network may be unavailable), dashboard cleanup (dev-only), and
  commit tracking (metadata only). These should not block the workflow
- **Fix:** No fix needed - usage is appropriate. These hooks enhance the
  workflow but aren't critical path

### Security: Potential command injection in resolve-item.js execSync

- **Files:** scripts/debt/resolve-item.js:21
- **Why:** execSync imported from child_process at line 21. While not directly
  visible in first 100 lines, use of execSync with string concatenation is a
  critical security issue per CODE_PATTERNS.md. Need to verify later in file
  that execFileSync is used or execSync uses only array arguments.
- **Fix:** If execSync is used with string templates: replace with
  execFileSync(cmd, [arg1, arg2], options). CODE_PATTERNS.md Security pattern:
  'Use execFileSync(cmd, [arg1, arg2]) not execSync(`cmd ${var}`)' eliminates
  injection vectors even with validated inputs.

---

## High Priority Findings (S1)

### Orphaned: assign-review-tier.js disabled in workflow

- **Files:** .github/workflows/auto-label-review-tier.yml:56,
  scripts/assign-review-tier.js:1
- **Fix:** Either integrate assign-review-tier.js or remove it and keep inline
  logic

### Obsolete: backlog-enforcement.yml checks deleted file

- **Files:** .github/workflows/backlog-enforcement.yml:32
- **Fix:** Remove backlog-health job or update to check
  docs/technical-debt/MASTER_DEBT.jsonl instead

### Duplicated: Test execution in pre-commit AND CI

- **Files:** .husky/pre-commit:59-87, .github/workflows/ci.yml:115
- **Fix:** Pre-commit: quick smoke tests only for high-risk changes. CI: full
  test suite. Or skip pre-commit tests entirely, rely on CI

### Duplicated: Path validation logic across 16+ hooks

- **Files:** .claude/hooks/check-edit-requirements.js:18-63,
  .claude/hooks/check-write-requirements.js:18-63,
  .claude/hooks/firestore-write-block.js:40-99,
  .claude/hooks/repository-pattern-check.js:50-108,
  .claude/hooks/typescript-strict-check.js:19-78,
  .claude/hooks/test-mocking-validator.js:19-78,
  .claude/hooks/app-check-validator.js:19-78,
  scripts/lib/validate-paths.js:50-137
- **Fix:** All hooks import and use validateFilePath() from
  scripts/lib/validate-paths.js. Delete inline duplicates

### Duplicated: Error message extraction pattern across 42+ files

- **Files:** scripts/check-pattern-compliance.js:40,
  scripts/check-doc-headers.js:65-67, scripts/check-cross-doc-deps.js:64,
  scripts/debt/validate-schema.js:31, scripts/lib/sanitize-error.js:63-95
- **Fix:** All scripts import and use sanitizeError() from
  scripts/lib/sanitize-error.js. Replace inline pattern

### Duplicated: check-edit-requirements and check-write-requirements logic

- **Files:** .claude/hooks/check-edit-requirements.js:1-108,
  .claude/hooks/check-write-requirements.js:1-106
- **Fix:** Merge into single check-file-requirements.js that handles both Edit
  and Write. Pass operation type as parameter

### CI gap: No test coverage thresholds enforced

- **Files:** .github/workflows/ci.yml:115
- **Fix:** Add c8 configuration with minimum thresholds (e.g., 70% lines, 60%
  branches). Update ci.yml line 115 to fail if thresholds not met: npm run
  test:coverage -- --check-coverage --lines 70 --branches 60

### Skill issue: gh-fix-ci references non-existent inspect_pr_checks.py

- **Files:** .claude/skills/gh-fix-ci/SKILL.md:36
- **Fix:** Either: (1) Create
  .claude/skills/gh-fix-ci/scripts/inspect_pr_checks.py implementing the
  documented API (--repo, --pr, --json flags), OR (2) Update gh-fix-ci skill to
  use gh CLI commands directly without the wrapper script. Option 2 is simpler
  but loses abstraction benefits.

### Perf: check-docs-light.js - Synchronous file reads in map()

- **Files:** scripts/check-docs-light.js:825, scripts/check-docs-light.js:495
- **Fix:** Convert lintDocument to async function, use Promise.all() with batch
  size limit (10 concurrent). Replace readFileSync with fs.promises.readFile in
  readDocumentContent

### Perf: generate-documentation-index.js - Synchronous file reads in loop

- **Files:** scripts/generate-documentation-index.js:913,
  scripts/generate-documentation-index.js:485
- **Fix:** Convert processFile to async, use Promise.all with batch limit (15
  concurrent): const batches = chunk(activeFiles, 15); for (batch of batches)
  await Promise.all(batch.map(processFile))

### Perf: aggregate-audit-findings.js - O(n^2) deduplication with large buckets

- **Files:** scripts/aggregate-audit-findings.js:1309,
  scripts/aggregate-audit-findings.js:1320
- **Fix:** Add early termination: if bucket size > threshold AND no merges in
  last N comparisons, skip rest. Or use LSH (Locality Sensitive Hashing) to
  reduce comparison space. Lower MAX_FILE_BUCKET from 250 to 100

### Error handling: Empty catch blocks swallow errors in gsd-check-update.js

- **Files:** .claude/hooks/global/gsd-check-update.js:38,
  .claude/hooks/global/gsd-check-update.js:43
- **Fix:** Log errors to stderr or a debug log file. Example: catch (e) {
  console.error('Failed to check GSD version:', e.message); }

### Error handling: 200+ empty catch blocks across hooks and scripts

- **Files:** .claude/hooks/component-size-check.js:47,
  .claude/hooks/component-size-check.js:111,
  .claude/hooks/typescript-strict-check.js:45,
  .claude/hooks/typescript-strict-check.js:109,
  .claude/hooks/track-agent-invocation.js:48,
  .claude/hooks/track-agent-invocation.js:81,
  .claude/hooks/compaction-handoff.js:66,
  .claude/hooks/compaction-handoff.js:82, scripts/validate-canon-schema.js:391,
  scripts/validate-audit.js:101, scripts/phase-complete-check.js:76
- **Fix:** Add minimal error logging: catch (err) { console.error('Operation
  failed:', err.message); }. For non-critical operations, at least log to debug
  output

### Error handling: readFileSync without try/catch in multiple scripts

- **Files:** scripts/verify-sonar-phase.js:134,
  scripts/verify-sonar-phase.js:213, scripts/validate-skill-config.js:105,
  scripts/update-readme-status.js:71
- **Fix:** Wrap all readFileSync calls in try/catch with helpful error messages.
  Example: try { content = fs.readFileSync(file, 'utf8'); } catch (err) {
  console.error(`Failed to read config file: ${err.message}\nPlease ensure the file exists and is readable.`);
  process.exit(1); }

### Error handling: execSync without timeout or error handling

- **Files:** scripts/validate-audit.js:651,
  .claude/hooks/compaction-handoff.js:97, .claude/hooks/session-start.js:49
- **Fix:** Always include timeout option and wrap in try/catch. Example: try {
  const output = execSync(cmd, { timeout: 10000, encoding: 'utf8' }); } catch
  (err) { if (err.killed) { console.error('Command timed out after 10s'); } else
  { console.error('Command failed:', err.message); } process.exit(1); }

### Error handling: State file operations fail silently

- **Files:** .claude/hooks/state-utils.js:75,
  .claude/hooks/track-agent-invocation.js:90, .claude/hooks/session-start.js:85
- **Fix:** writeState() should return false on failure but caller should check
  the return value. Example: if (!writeState(data)) { console.error('⚠️ Failed
  to save session state - data may be lost after compaction'); }

### Error handling: Hook execution errors not propagated to user

- **Files:** .claude/hooks/component-size-check.js:47,
  .claude/hooks/pattern-check.js:60, .claude/hooks/audit-s0s1-validator.js:49
- **Fix:** Hooks should output clear status messages: 'ok' on success, error
  description on failure. Log to stderr for errors while preserving stdout for
  hook protocol. Example: catch (err) { console.error('Hook failed:',
  err.message); console.log('error'); process.exit(1); }

### Error handling: generate-pending-alerts.js throws error on write failure but doesn't clean up partial state

- **Files:** scripts/generate-pending-alerts.js:389,
  scripts/generate-pending-alerts.js:38, scripts/generate-pending-alerts.js:116
- **Fix:** Use atomic write pattern: write to temp file, validate, then rename.
  On failure, clean up temp file and preserve existing alerts file. Example:
  const tmp = file + '.tmp'; try { fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file); } catch (err) { fs.rmSync(tmp, {force:true}); throw
  err; }

### Error handling: execSync in validation scripts can hang on interactive prompts

- **Files:** scripts/validate-audit.js:651, scripts/validate-audit.js:707
- **Fix:** Already using stdio: ['ignore', 'pipe', 'pipe'] pattern correctly in
  validate-audit.js. Verify all other execSync calls use similar pattern to
  prevent stdin interaction

### Quality: TOCTOU race condition in ai-review.js

- **Files:** scripts/ai-review.js:139
- **Fix:** Remove existsSync check and wrap readFileSync in try/catch. Pattern
  from CODE_PATTERNS.md: try { const content = readFileSync(filePath, 'utf-8');
  return { success: true, content }; } catch (error) { if (error.code ===
  'ENOENT') { return { success: false, error: 'File not found' }; } ... }

### Quality: TOCTOU race condition in check-consolidation-status.js

- **Files:** scripts/check-consolidation-status.js:89
- **Fix:** Remove existsSync check at line 89. Change error handling to: try {
  const content = readFileSync(LOG_FILE, 'utf8'); ... } catch (err) { if
  (err.code === 'ENOENT') { console.error('File not found'); process.exitCode =
  2; return; } throw err; }

### Quality: TOCTOU race condition in resolve-item.js

- **Files:** scripts/debt/resolve-item.js:53
- **Fix:** Replace lines 52-59 with: function loadMasterDebt() { try { const
  content = fs.readFileSync(MASTER_FILE, 'utf8'); const lines =
  content.split('\n').filter(line => line.trim()); return lines.map(line =>
  JSON.parse(line)); } catch (err) { if (err.code === 'ENOENT') return []; throw
  err; } }

### Quality: Missing validation on parsed JSON objects

- **Files:** scripts/debt/intake-audit.js:119
- **Fix:** Add input validation: function mapDocStandardsToTdms(item) { if
  (!item || typeof item !== 'object' || Array.isArray(item)) { return { item:
  {}, metadata: { format_detected: 'invalid', error: 'Expected object' }}; } ...
  } Also validate array types before .map(), .length access.

### Quality: Unsafe regex patterns in pattern checker

- **Files:** scripts/check-pattern-compliance.js:106-300
- **Fix:** CODE_PATTERNS.md Security: 'Use {1,64} not + for bounded user input'
  and 'Add heuristic detection (nested quantifiers, length limits)'. Add input
  size guards before regex matching: if (content.length > 100000) {
  console.warn('File too large, skipping pattern checks'); return; }. Review
  each regex for nested quantifiers and add explicit bounds.

---

## Medium Priority Findings (S2) — 88 items

Key themes:

- **Orphaned:** 10 findings
- **Duplicated:** 10 findings
- **CI gap:** 10 findings
- **Perf:** 10 findings
- **Error handling:** 7 findings
- **Quality:** 7 findings
- **CI slow:** 5 findings
- **Gap:** 5 findings
- **Bug:** 4 findings
- **Skill issue:** 4 findings

---

## Low Priority Findings (S3) — 139 items

Primarily documentation gaps, consistency improvements, and minor process
enhancements.

---

## Priority Action Plan

### Immediate (S0-S1) — 27 items

Fix before next major release. Key items:

1. Review `pull_request_target` trigger in deploy workflow for security
2. Fix command injection risk in resolve-item.js
3. Consolidate duplicated path validation across 16+ hooks
4. Fix broken file references in CI workflows
5. Add proper error handling to 200+ empty catch blocks

### Short-term (S2 quick wins) — ~50 items

Fix in next sprint:

- Performance optimizations for slow hooks
- CI workflow improvements
- Missing test coverage thresholds

### Backlog (S3 + complex S2) — ~177 items

Add to roadmap for future sprints.

---

## Session Information

- **Session:** #143
- **Branch:** claude/cherry-pick-and-pr-xarOL
- **Date:** 2026-02-09
- **Trigger:** 35 process files changed (threshold: 20)
