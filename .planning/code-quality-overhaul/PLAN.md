# Implementation Plan: Repo-Wide Code Quality Overhaul

## Summary

Comprehensive code quality overhaul across 7 workstreams: ESLint v9 warning
cleanup and v10 preparation (sonash plugin API migration), zero-warnings
campaign (2,124→0), cyclomatic+cognitive complexity remediation (358+
violations), propagation pattern expansion, code fragility fixes, truncation
protection guardrails, orphan detection tooling, and AI-facing file format
audit. Every workstream follows the trifecta: research (convergence loop) → fix
pre-existing → guardrail (prevention).

**Decisions:** See DECISIONS.md (26 decisions) **Effort Estimate:** XL — 12
implementation steps across enforcement, data integrity, cleanup, and
reconciliation **Prerequisite:** Plan 1 (Tooling & Infrastructure Audit) must be
fully implemented first (per Decision #23). Plan 1 optimizes the sonash plugin,
removes dead code, and fixes workflows — giving this plan a clean baseline.

---

## Research Loop Specification (Per Decision #12)

Every workstream uses the same convergence loop during implementation. This
section defines the loop; steps reference it as "run convergence loop."

```
┌─────────────────────────────────────────────────────────┐
│                   CONVERGENCE LOOP                       │
│                                                          │
│  Pass 1: SCAN                                           │
│    Tools: ESLint, grep, AST analysis, custom scripts    │
│    Output: findings.{iteration}.jsonl                    │
│    Each finding: {file, line, rule, severity, category}  │
│                                                          │
│  Pass 2: TRIAGE                                         │
│    Agent classifies each finding:                        │
│      - auto-fixable (known recipe exists)               │
│      - needs-refactoring (manual, recipe provided)      │
│      - false-positive (suppress with justification)     │
│      - needs-discussion (escalate to user)              │
│    Output: triage.{iteration}.jsonl                      │
│                                                          │
│  Pass 3: IMPLEMENT                                      │
│    Auto-fix trivial items                               │
│    Apply refactoring recipes to needs-refactoring       │
│    Add eslint-disable with justification for FPs        │
│    Queue needs-discussion items for user review          │
│    Output: changes.{iteration}.jsonl (what was done)     │
│                                                          │
│  Pass 4: VERIFY                                         │
│    Re-run all scans from Pass 1                         │
│    Compare findings count: delta report                 │
│    If new_findings > 0 → LOOP BACK to Pass 1            │
│    If new_findings == 0 → CONVERGED, exit loop          │
│    Output: verify.{iteration}.jsonl                      │
│                                                          │
│  Artifacts stored: .planning/code-quality-overhaul/      │
│                    research/{workstream}/{iteration}/     │
└─────────────────────────────────────────────────────────┘
```

**Convergence criteria:** Verify pass finds zero new issues not present in
previous iteration. **Max iterations:** 5 (safety valve — if not converged by
iteration 5, report remaining to user). **Artifact format:** JSONL (per D77-D79
convention). One file per pass per iteration.

---

## Testing Protocol (Per User Directive: "Extensive Testing Per Step")

Every step MUST follow this testing protocol. The "testing checkpoint" in each
step is the minimum — not the ceiling.

### Required at every step boundary:

1. **Full test suite:** `npm test` — ALL tests, not just domain-specific. Any
   failure = stop, diagnose, fix before proceeding.
2. **Full lint pass:** `npm run lint` — capture warning count. Compare against
   ratchet baseline. Count must not increase.
3. **Pre-commit dry run:** Stage a test file change, run `.husky/pre-commit`
   manually. All 15 checks must pass.
4. **Build check:** `npm run build` — ensure no build regressions from
   refactoring.
5. **Regression comparison:** Diff current warning/error counts against the
   step's entry baseline. Document deltas.
6. **Rollback readiness:** Each step should be atomic-committable. If step N
   breaks something, `git revert` must cleanly undo it without affecting steps 1
   through N-1.

### Additional per-domain tests:

| Step                 | Additional Testing                                                                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1 (v9 cleanup)  | Run sonash plugin tests individually per rule after API migration. Every rule must still fire correctly. Verify no regressions from deprecated API replacement.                                                                                    |
| Step 2 (triage)      | Verify disabled rules produce zero output. Verify tightened rule still catches genuine violations (add test cases). Verify oxlint pre-commit speed didn't regress (time it).                                                                       |
| Step 3 (complexity)  | For each refactored function: verify CC≤15 AND cognitive≤15. Run any unit tests that cover the refactored function. If no tests exist, add a smoke test confirming the function's contract.                                                        |
| Step 4 (propagation) | Run `check-propagation.js --all` in full-repo mode. Verify function-duplicate detection correctly blocks (test with intentional duplicate). Verify new rules catch their target patterns.                                                          |
| Step 5 (fragility)   | Run affected scripts end-to-end (not just lint). New prevention rules must catch test inputs.                                                                                                                                                      |
| Step 6 (truncation)  | Test truncation guard with intentional truncation: write a file that exceeds threshold, verify block. Test with file that's within threshold, verify pass. Test auto-population idempotency. Test git history scanner on known truncation commits. |
| Step 7 (cleanup)     | `npm run lint -- --max-warnings 0` must pass. Pre-commit must block a staged file with a new warning. CI workflow must reject a PR with warnings (test locally with `act` if possible).                                                            |
| Step 8 (orphans)     | Intentionally create an orphan (add to SKILL_INDEX but not filesystem), verify validator catches it. Verify pattern-compliance integration runs the new categories.                                                                                |
| Step 9 (MD audit)    | For each converted file: verify JSONL→MD generation produces content matching the original. Verify all consumers read correctly from new source. Run consumer scripts with actual data.                                                            |
| Step 10 (docs)       | Grep all docs for stale version numbers, stale counts, references to removed items. Cross-reference ROADMAP checkboxes against actual completion state. Verify MASTER_DEBT resolved items have correct status.                                     |

### Failure protocol:

If any test fails:

1. **Do NOT proceed** to the next step
2. Diagnose the root cause (not the symptom)
3. Fix and re-run the FULL testing protocol for the current step
4. Only proceed when all checks pass

---

## Fix Recipe Reference (Per Decision #24)

Pre-specified fix patterns for known rule violations. Research loop applies
these rather than re-discovering them.

| Rule                                | Recipe                                                                                                   | Notes                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `@typescript-eslint/no-unused-vars` | Remove unused import/variable/parameter                                                                  | Auto-fixable. Prefix with `_` if parameter is required by interface.                |
| `sonash/no-non-atomic-write`        | Replace `writeFileSync(path, data)` with: write to `${path}.tmp`, then `renameSync('${path}.tmp', path)` | Use `scripts/lib/security-helpers.js` `atomicWriteSync` if available.               |
| `complexity` (CC>15)                | Extract helper functions. Each extracted function should do one thing. Name descriptively.               | Triage order: hybrid severity × domain (D#9).                                       |
| `sonarjs/cognitive-complexity`      | Reduce nesting: early returns, guard clauses, extract conditions into named booleans.                    | Different from CC — targets readability, not path count.                            |
| `sonash/no-unguarded-loadconfig`    | Wrap in try/catch. Plan 1 merges this into `no-unguarded-file-read` first.                               | 162 violations. Try/catch with meaningful error message.                            |
| `sonash/no-unsafe-error-access`     | Add `instanceof Error` guard or use typed catch (`catch (error: Error)`).                                | D#22: tighten rule first to reduce false positives, then apply recipe to remaining. |

---

## Files to Create/Modify

### New Files (8+)

1. **`.truncation-guard.json`** — Auto-populated allowlist of protected files
   with per-file thresholds
2. **`scripts/validators/check-skill-index-sync.js`** — SKILL_INDEX↔filesystem
   orphan validator
3. **`scripts/validators/check-npm-script-refs.js`** — npm script↔referenced
   file validator
4. **`scripts/validators/check-hook-refs.js`** — Hook↔referenced file validator
5. **`scripts/validators/populate-truncation-guard.js`** — Auto-populates
   `.truncation-guard.json`
6. **`scripts/validators/check-truncation-guard.js`** — Truncation check
   (post-write + pre-commit)
7. **`.planning/code-quality-overhaul/research/`** — Convergence loop artifacts
   (JSONL per pass)
8. **Research loop iteration artifacts** — `findings.N.jsonl`, `triage.N.jsonl`,
   `changes.N.jsonl`, `verify.N.jsonl` per workstream

### Modified Files (15+)

1. **`package.json`** — Add `eslint-plugin-sonarjs` devDep, update oxlint config
2. **`eslint.config.mjs`** — Disable 2 security rules, add sonarjs
   cognitive-complexity, configure ratchet, update sonash rule configs
3. **`eslint-plugin-sonash/`** — Migrate all rules to forward-compatible API
   (replace deprecated context methods), tighten `no-unsafe-error-access`
4. **`tests/eslint-plugin-sonash.test.js`** — Migrate to future-proof RuleTester
   format (remove `type` property, fix valid cases)
5. **`.oxlintrc.json`** — Remove rules that duplicate ESLint post-dedup audit
6. **`scripts/check-propagation.js`** — Add new patterns, make
   function-duplicate a blocker
7. **`scripts/post-write-validator.js`** — Add truncation check using
   `.truncation-guard.json`
8. **`.husky/pre-commit`** — Add truncation guard check, integrate orphan
   validators
9. **`scripts/check-pattern-compliance.js`** — Register new orphan validator
   categories
10. **`.github/workflows/ci.yml`** — Add `--max-warnings N` ratchet
    (decreasing), enforce zero-warning lock when ready
11. **Multiple `scripts/` files** — Complexity refactoring (358+ functions)
12. **Multiple `src/` files** — Unused vars removal, error access fixes, atomic
    writes
13. **`ROADMAP.md`** — Mark completed items from this work
14. **`MASTER_DEBT.jsonl` + `raw/deduped.jsonl`** — Mark resolved items (both
    files per TDMS convention)
15. **Various docs** — Update references affected by changes

---

## Step 1: ESLint v9 Warning Cleanup & v10 Preparation (WS2)

**Per Decisions #2, #18**

This is the foundation — all other workstreams operate on a clean warning
landscape. ESLint v10 does not exist yet (current stable is v9.39.4). This step
cleans up v9 warnings and prepares the sonash plugin for the v10 API migration
when v10 is released.

### 1a: Prepare — Pin test baseline on v9

```bash
# Run full test suite on current ESLint v9.39.4
npm test -- --testPathPattern="eslint-plugin-sonash"
# Capture output as baseline
npm run lint 2>&1 | tee .planning/code-quality-overhaul/research/ws2/v9-baseline.txt
```

### 1b: Migrate sonash plugin to v10-compatible API (forward-compat)

Audit all 31 custom rules (after Plan 1 optimization reduces this to ~28) for
deprecated v9 APIs that will be removed in v10. Migrating now ensures the plugin
works on v9 AND will be ready for v10 when released:

| Deprecated API (v9)                    | Replacement (v9+v10 compatible)                        |
| -------------------------------------- | ------------------------------------------------------ |
| `context.getCwd()`                     | `context.cwd`                                          |
| `context.getFilename()`                | `context.filename`                                     |
| `context.getSourceCode()`              | `context.sourceCode`                                   |
| `context.parserOptions`                | `context.languageOptions.parserOptions`                |
| `sourceCode.getTokenOrCommentBefore()` | `sourceCode.getTokenBefore({ includeComments: true })` |
| `sourceCode.isSpaceBetweenTokens()`    | `sourceCode.isSpaceBetween()`                          |

For each rule:

1. Search for deprecated API calls
2. Replace with forward-compatible equivalents
3. Verify fixer methods pass string arguments (not AST nodes)

### 1c: Migrate tests to future-proof RuleTester format

In `tests/eslint-plugin-sonash.test.js`:

- Remove `type` property from all `invalid` test cases (deprecated in v9,
  removed in v10)
- Remove `errors` and `output` from `valid` test cases (if any)

### 1d: Run tests, fix until green

```bash
npm test -- --testPathPattern="eslint-plugin-sonash"
npm run lint
```

Iterate until all tests pass and lint runs without errors (warnings OK at this
stage).

### 1e: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite, ALL tests green (not just eslint-plugin tests)
2. `npm run lint` — zero errors, warning count captured as post-migration
   baseline
3. `npm run build` — build succeeds (no regressions from API migration)
4. Pre-commit dry run — all 15 checks pass
5. **Rule-by-rule regression:** Verify every rule still fires correctly after
   deprecated API replacement. Document any behavior changes.
6. **Sonash plugin per-rule tests:** Run each rule's test individually, verify
   all pass
7. **Warning delta:** Document exact count: pre-migration → post-migration (API
   changes may surface new warnings)

**Done when:** All 28+ sonash rules migrated to forward-compatible API, full
test suite green, build succeeds, pre-commit passes, warning delta documented.
**Depends on:** Plan 1 fully complete (especially Step 5: sonash plugin
optimization). **Triggers:** Step 2 (warning triage happens on clean baseline).

---

## Step 2: Warning Triage + Security Rule Removal (WS2)

**Per Decisions #3, #7, #21, #22**

With a clean v9 baseline (deprecated APIs replaced), triage all warnings toward
zero.

### 2a: Disable security false-positive rules

In `eslint.config.mjs`:

```javascript
// Remove or set to "off":
"security/detect-non-literal-fs-filename": "off",
"security/detect-object-injection": "off",
```

Expected impact: −517 warnings.

### 2b: Tighten `no-unsafe-error-access` rule

In `eslint-plugin-sonash/rules/no-unsafe-error-access.js`:

- Skip violations where catch parameter has type annotation
  (`catch (error: Error)`)
- Skip violations inside `if (error instanceof Error)` guards
- Skip violations where error is typed via function signature

Re-run lint, measure reduction from 472.

### 2c: Audit oxlint rule overlap

```bash
# List all oxlint rules in .oxlintrc.json
# Compare against eslint.config.mjs active rules
# Identify duplicates
```

For each duplicate:

- Disable in `.oxlintrc.json` (ESLint is canonical)
- Keep oxlint rules that ESLint doesn't have

### 2d: Establish ratchet baseline

```bash
# Count current warnings after Steps 2a-2c
npx eslint . --format json 2>/dev/null | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const total = data.reduce((sum, f) => sum + f.warningCount, 0);
  console.log('Warning count:', total);
"
```

Set `--max-warnings <count>` in CI workflow. This number can only decrease from
here.

### 2e: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green
2. `npm run lint` — zero errors, warning count captured (must be significantly
   lower than Step 1 exit)
3. `npm run build` — build succeeds
4. Pre-commit dry run — all checks pass, **time pre-commit** to verify oxlint
   dedup didn't regress speed
5. **Security rule verification:** Confirm disabled rules produce zero output
   (grep lint output for `detect-non-literal`, `detect-object-injection` — must
   be absent)
6. **Error-access rule verification:** Run tightened rule against test cases —
   must still catch genuine unsafe access, skip false positives (add new test
   cases for the tightened patterns)
7. **oxlint verification:** Run oxlint standalone, confirm no duplicate findings
   with ESLint
8. **Ratchet verification:** CI workflow has `--max-warnings N` where N =
   current count. Test locally: add a warning, verify it would be caught
9. **Warning delta documentation:** pre-migration baseline → post-migration
   baseline → post-triage count. Each transition must show decrease or explain
   increase.

**Done when:** Security rules off (−517), error-access tightened with test
cases, oxlint deduped and timed, CI ratchet active, full suite green. **Depends
on:** Step 1 (API migration complete). **Triggers:** Steps 3, 4, 5 (can run in
parallel).

---

## Step 3: Complexity Remediation (WS4)

**Per Decisions #4, #9, #10, #24**

### 3a: Install and configure cognitive complexity

```bash
npm install -D eslint-plugin-sonarjs
```

In `eslint.config.mjs`:

```javascript
import sonarjs from 'eslint-plugin-sonarjs';

// In rules:
"sonarjs/cognitive-complexity": ["warn", 15],
```

### 3b: Run convergence loop — complexity

**SCAN:** Run ESLint with both `complexity` and `sonarjs/cognitive-complexity`
rules. Capture all violations.

**TRIAGE:** Classify each violation using hybrid severity × domain weight:

- **Priority 1:** CC>25 OR cognitive>25 in scripts/, hooks/, validators
- **Priority 2:** CC>25 OR cognitive>25 in src/ critical paths
- **Priority 3:** CC>20 in any location
- **Priority 4:** CC>15 in any location

Apply fix recipe: extract helper functions, early returns, guard clauses, named
boolean conditions.

**IMPLEMENT:** Refactor in priority order. Each refactored function must:

- Maintain identical behavior (test coverage required)
- Result in CC≤15 AND cognitive≤15
- Have descriptive extracted function names

**VERIFY:** Re-run scans. If new violations found (from extracted functions that
are themselves complex), loop back.

### 3c: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green. **Every refactored function's tests must
   pass.** If a refactored function has no tests, add a smoke test confirming
   its contract before and after refactoring.
2. `npm run lint` — zero complexity warnings (both CC and cognitive). Warning
   count must decrease from Step 2 exit.
3. `npm run build` — build succeeds (refactoring in src/ could break imports)
4. Pre-commit dry run — all checks pass
5. **Per-function verification:** For each refactored function, verify CC≤15 AND
   cognitive≤15 individually
6. **Behavioral regression:** Run any integration tests or scripts that exercise
   refactored functions. Output must be identical pre/post refactoring.
7. **Extracted function quality:** New helper functions must have descriptive
   names, single responsibility, and their own CC≤15/cognitive≤15
8. **Convergence proof:** Loop artifacts in
   `.planning/code-quality-overhaul/research/ws4/` show iteration-over-iteration
   decrease to zero

**Done when:** Zero complexity warnings. Both rules at 15. Full suite green.
Every refactored function tested. Convergence proven via artifacts. **Depends
on:** Step 2 (triage baseline established). **Triggers:** Step 7 (ratchet
decrease).

---

## Step 4: Propagation Pattern Fixes (WS3)

**Per Decision #8**

### 4a: Run convergence loop — propagation

**SCAN:** Run `check-propagation.js` in full-repo mode (not just staged). Also
grep for patterns not yet in known-pattern rules.

**TRIAGE:** For each violation:

- Existing 6 rules: classify as fixable (apply pattern fix) or exception
  (justify)
- New patterns discovered: evaluate for rule addition

**IMPLEMENT:**

- Fix ALL existing violations of the 6 known-pattern rules
- Add new rules to `KNOWN_PATTERN_RULES` in `check-propagation.js` for patterns
  discovered
- Change function-duplicate detection from warning to blocker (error exit code)

**VERIFY:** Re-run propagation check. Loop until clean.

### 4b: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green
2. `npm run lint` — warning count does not increase
3. `npm run build` — build succeeds
4. Pre-commit dry run — all checks pass
5. **Full-repo propagation:** `node scripts/check-propagation.js --all` (or
   equivalent full-repo mode) — zero findings
6. **Blocker verification:** Intentionally create a function duplicate, verify
   `check-propagation.js` exits with error (not warning)
7. **New rule verification:** For each new pattern rule added, create a test
   case that triggers it, verify detection
8. **Fix verification:** For each fixed violation, verify the fix actually
   addresses the pattern (not just suppresses it)

**Done when:** Zero propagation findings in full-repo scan. Function-duplicate
blocks. New rules have test cases. Full suite green. **Depends on:** Step 2
(triage baseline). **Triggers:** Step 7 (ratchet decrease).

---

## Step 5: Fragility Fixes + Prevention (WS5)

**Per Decision #11**

### 5a: Run convergence loop — fragility

**SCAN:** Search for fragility patterns:

- Nested `instanceof` chains (deep conditional nesting patterns)
- Regex-based MD parsing in scripts that could use structured data
- Hardcoded format assumptions (string splitting on assumed delimiters)
- Error handling chains that don't follow project patterns
- `JSON.parse` without try/catch on external input

**TRIAGE:** Classify each:

- Auto-fixable (known pattern, clear recipe)
- Needs-refactoring (structural change needed)
- Prevention-candidate (should become a lint rule or pattern-compliance check)

**IMPLEMENT:**

- Fix all discovered fragile patterns
- For prevention candidates: add to `eslint-plugin-sonash` as new rules OR to
  `check-pattern-compliance.js` as new patterns

**VERIFY:** Re-scan. Loop until clean.

### 5b: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green
2. `npm run lint` — warning count does not increase
3. `npm run build` — build succeeds
4. Pre-commit dry run — all checks pass
5. **Fragile script end-to-end:** Run each fixed script with real inputs, verify
   output matches expectations
6. **Prevention rule testing:** For each new fragility prevention rule (sonash
   or pattern-compliance), create test input that triggers it, verify detection
7. **Regression scan:** Re-run the fragility SCAN pass one more time on the
   fixed codebase — must find zero issues

**Done when:** Zero fragility findings. Prevention rules active with test cases.
Fixed scripts produce correct output on real data. Full suite green. **Depends
on:** Step 2 (triage baseline). **Triggers:** Step 7 (ratchet decrease).

---

## Step 6: Truncation Protection Guardrails (WS6)

**Per Decisions #5, #14, #15, #16, #26**

### 6a: Build auto-population script

Create `scripts/validators/populate-truncation-guard.js`:

- Scan for generated files (files with JSONL sources: `*_VIEW.md`,
  decision/discovery views)
- Scan for large files (>200 lines)
- For each, compute current line count and assign tiered threshold:
  - <100 lines: 50% reduction threshold
  - 100-500 lines: 30% reduction threshold
  - > 500 lines: 20% reduction threshold
- Write `.truncation-guard.json`:
  ```json
  {
    "files": {
      "docs/technical-debt/MASTER_DEBT_VIEW.md": {
        "min_lines": 800,
        "max_reduction_pct": 20,
        "source": "auto"
      },
      "ROADMAP.md": {
        "min_lines": 400,
        "max_reduction_pct": 20,
        "source": "auto"
      }
    },
    "updated": "ISO timestamp"
  }
  ```

### 6b: Build truncation check script

Create `scripts/validators/check-truncation-guard.js`:

- Read `.truncation-guard.json`
- For each protected file in the staged changes:
  - Compare staged line count vs HEAD line count
  - If reduction exceeds threshold → BLOCK with clear message
- For generated files: validate against JSONL source (line count must match
  expected)

### 6c: Integrate into enforcement points

**post-write-validator.js:** Add truncation check (check #11) — runs on every AI
Write/Edit/MultiEdit.

**.husky/pre-commit:** Add truncation guard check as a Wave 0 check (fast,
file-size comparison only).

### 6d: Git history truncation scan (Decision #26)

Run git history analysis:

```bash
# For each file, find commits where size dropped >30%
git log --all --diff-filter=M --numstat --format="%H %s" -- '*.md' '*.js' '*.ts' '*.json'
# Process output to find significant shrinks
```

For each flagged file:

- If generated: regenerate from JSONL source, verify content is complete
- If non-generated: review git diff of shrink commit, determine if content was
  lost
- Restore lost content where identified

### 6e: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green
2. `npm run lint` — warning count does not increase
3. `npm run build` — build succeeds
4. Pre-commit dry run — all checks pass (including new truncation check)
5. **Intentional truncation test (post-write-validator):** Simulate an AI write
   that reduces a protected file by >threshold → verify BLOCK with clear error
   message
6. **Intentional truncation test (pre-commit):** Stage a change that truncates a
   protected file → verify pre-commit catches it
7. **Within-threshold test:** Stage a legitimate edit that reduces a file
   slightly → verify it PASSES (no false positive)
8. **Auto-population idempotency:** Run `populate-truncation-guard.js` twice →
   identical `.truncation-guard.json` output
9. **Auto-population correctness:** Verify all generated files and files >200
   lines appear in the allowlist. Verify tiered thresholds are correctly
   assigned based on line count.
10. **Git history scan results:** Document all flagged files. For each: verify
    whether content was actually lost, and if so, confirm restoration.
11. **JSONL source validation:** For all generated MD files, verify content
    matches JSONL source (no existing truncation)

**Done when:** Truncation guardrails active in both enforcement points, tested
with intentional truncation AND legitimate edits. Auto-population correct and
idempotent. Past truncation identified, reviewed, and restored. Full suite
green. **Depends on:** Step 2 (triage baseline — need to know file state after
earlier changes). **Triggers:** Step 7 (ratchet decrease).

---

## Step 7: Remaining Warning Cleanup (WS2 continued)

**Per Decisions #3, #13, #24**

After Steps 3-6 resolve their domain-specific warnings, handle remaining rules.

### 7a: Run convergence loop — remaining warnings

**SCAN:** `npm run lint -- --format json` → count warnings by rule.

**TRIAGE:** Apply pre-specified fix recipes (Decision #24):

- `no-unused-vars` (112): Remove unused imports/vars. Prefix with `_` if
  interface-required.
- `no-non-atomic-write` (103): Apply temp+rename atomic write pattern.
- `no-unguarded-loadconfig`/`no-unguarded-file-read` (162): Wrap in try/catch.
- Any remaining `no-unsafe-error-access`: Add instanceof guards.
- Any new violations surfaced by API migration: Fix per rule semantics.

**IMPLEMENT:** Apply recipes. For `no-non-atomic-write`, use `atomicWriteSync`
helper from `scripts/lib/security-helpers.js` where available.

**VERIFY:** Re-run lint. If new warnings → loop back. Continue until zero.

### 7b: Lock — enable --max-warnings 0

Once warning count reaches 0:

```yaml
# In .github/workflows/ci.yml:
- run: npx eslint . --max-warnings 0
```

Update pre-commit to error on warnings for staged files (not just inform).

### 7c: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green (warning fixes like removing unused vars or
   adding try/catch could break tests)
2. `npm run lint -- --max-warnings 0` — PASSES. This is THE milestone. Zero
   warnings.
3. `npm run build` — build succeeds
4. Pre-commit dry run — all checks pass
5. **CI lock test:** Verify CI workflow file has `--max-warnings 0`. Test
   locally: `npx eslint . --max-warnings 0` exits 0.
6. **Regression test:** Intentionally add a warning (unused var) to a staged
   file → verify pre-commit blocks it
7. **Warning archaeology:** Document the full journey: 2,124 →
   post-API-migration → post-triage → post-complexity → post-propagation →
   post-fragility → 0
8. **Ratchet retirement:** The ratchet (`--max-warnings N`) is replaced by the
   hard lock (`--max-warnings 0`). Verify both CI and pre-commit enforce this.

**Done when:** `npm run lint -- --max-warnings 0` passes. CI locked. Pre-commit
blocks new warnings. Full journey documented. Full suite green. **Depends on:**
Steps 3, 4, 5, 6 (domain warnings must be resolved first). **Triggers:** Step 8
(orphan detection can see final state).

---

## Step 8: Orphan Detection Tooling (WS7)

**Per Decisions #1, #17**

### 8a: Build SKILL_INDEX↔filesystem validator

Create `scripts/validators/check-skill-index-sync.js`:

- Parse `SKILL_INDEX.md` for listed skills (name, path)
- For each: `fs.existsSync(path)` — flag missing
- Reverse: scan `.claude/skills/` filesystem — flag unlisted skills
- Output: JSONL findings

### 8b: Build npm script↔file validator

Create `scripts/validators/check-npm-script-refs.js`:

- Parse `package.json` scripts
- For each script command: extract referenced file paths
- For each: `fs.existsSync` — flag missing files
- Output: JSONL findings

### 8c: Build hook↔file validator

Create `scripts/validators/check-hook-refs.js`:

- Parse `.husky/pre-commit`, `.husky/pre-push`, `.husky/commit-msg`
- Extract referenced script paths
- For each: `fs.existsSync` — flag missing
- Parse `.claude/settings.json` hook entries — flag missing hook files
- Output: JSONL findings

### 8d: Register as pattern-compliance categories

In `scripts/check-pattern-compliance.js`, add categories:

- `skill-index-sync` — runs `check-skill-index-sync.js`
- `npm-script-refs` — runs `check-npm-script-refs.js`
- `hook-refs` — runs `check-hook-refs.js`

### 8e: Fix ALL existing orphans

Run all 3 validators. For each finding:

- Missing skill directory: remove from SKILL_INDEX.md (or create if intended)
- Dead npm script: remove from package.json
- Missing hook reference: fix reference or remove entry

### 8f: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green
2. `npm run lint -- --max-warnings 0` — still passes after orphan fixes
3. `npm run build` — build succeeds
4. Pre-commit dry run — all checks pass (including new orphan validators)
5. **Validator smoke tests:** Each validator runs successfully on clean repo →
   zero findings
6. **Intentional orphan test (skill):** Add an entry to SKILL_INDEX.md for a
   nonexistent skill → verify `check-skill-index-sync.js` catches it
7. **Intentional orphan test (npm):** Add an npm script referencing a
   nonexistent file → verify `check-npm-script-refs.js` catches it
8. **Intentional orphan test (hook):** Add a hook entry referencing a
   nonexistent script → verify `check-hook-refs.js` catches it
9. **Reverse orphan test:** Create a skill directory not in SKILL_INDEX.md →
   verify validator catches unlisted skill
10. **Pattern-compliance integration:** Verify `check-pattern-compliance.js`
    runs all 3 new categories during pre-commit

**Done when:** 3 validators built, integrated, tested with intentional orphans
AND clean repo. All existing orphans fixed. Full suite green. **Depends on:**
Step 7 (need final state to detect orphans accurately). **Triggers:** Step 9 (MD
audit).

---

## Step 9: AI-Facing File Format Audit (WS1)

**Per Decision #25**

### 9a: Run convergence loop — AI-facing files

**SCAN:** Identify all MD files that AI reads/writes regularly:

- Files referenced in CLAUDE.md, AI_WORKFLOW.md
- Files read by scripts/hooks/skills
- Files with structured data (tables, registries, checklists, metrics)

**TRIAGE:** For each file, recommend:

- **JSONL-back:** Contains structured data that multiple scripts consume.
  Pipeline investment justified.
- **Leave as prose:** Genuinely prose content (procedures, rules, explanations).
  No structured data to extract.
- **Hybrid:** Mix of prose and structured data — JSONL-back the structured
  parts, leave prose sections.

Exclude ROADMAP.md (per Decision #6).

**IMPLEMENT:** For files recommended for JSONL backing:

1. Create JSONL source file with schema
2. Create generation script (JSONL→MD)
3. Migrate existing content into JSONL
4. Verify generated MD matches original
5. Update consumers to read JSONL instead of regex-parsing MD

**VERIFY:** All converted files generate correctly. No consumer breakage.

### 9b: Testing checkpoint (EXTENSIVE — per Testing Protocol)

1. `npm test` — full suite green
2. `npm run lint -- --max-warnings 0` — still passes
3. `npm run build` — build succeeds (especially if src/ files consumed converted
   data)
4. Pre-commit dry run — all checks pass
5. **For each converted file:**
   - JSONL source validates against schema (Zod or JSON Schema)
   - Generation script produces MD that matches original content (diff must be
     minimal — formatting only)
   - All consumer scripts/hooks/skills read from JSONL correctly (run each
     consumer)
   - Generated MD is human-readable and complete
6. **For each non-converted file:** Justification documented (why prose, not
   structured data)
7. **Consumer regression:** Run all scripts that previously regex-parsed the MD
   files — verify they work with the new data source
8. **Round-trip test:** Modify JSONL source → regenerate MD → verify change
   appears correctly

**Done when:** All AI-facing files audited with justified recommendations.
Converted files have working JSONL→MD pipelines with tested consumers. Full
suite green. **Depends on:** Step 8 (need final file state). **Triggers:** Step
10 (documentation).

---

## Step 10: Documentation Update + Debt Reconciliation

**Per Decision #19 (final reconciliation) — THIS STEP IS AS IMPORTANT AS THE
FIXES THEMSELVES**

Unreconciled docs and debt records mean the work might as well not have happened
— future sessions will re-discover "issues" that are already fixed, creating
wasted effort and confusion.

### 10a: Update affected documentation

After all workstreams complete, update every doc that references anything
changed:

| Document                                | What to Update                                                             |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `eslint.config.mjs` comment block       | Rule counts, warning counts (now 0), new sonarjs plugin                    |
| `CLAUDE.md` Section 1                   | ESLint version if mentioned                                                |
| `CLAUDE.md` Section 5                   | Update pattern table if any patterns changed (atomic writes, error access) |
| `AI_WORKFLOW.md`                        | Update if any workflow steps changed by new validators or tooling          |
| `SESSION_CONTEXT.md`                    | Update current state if it references warning counts or quality metrics    |
| `scripts/README.md` or equivalent       | Document new validator scripts, updated check-propagation behavior         |
| `.github/copilot-instructions.md`       | New devDeps, updated rule counts, new validators                           |
| `docs/agent_docs/CODE_PATTERNS.md`      | Update if any enforced patterns changed (atomic writes, error handling)    |
| `docs/agent_docs/SECURITY_CHECKLIST.md` | Update if security rule changes affect checklist items                     |
| `SKILL_INDEX.md`                        | Update if any skills were affected by orphan fixes                         |

**Verification:** Grep ALL docs for stale references:

```bash
grep -r "v9\." docs/ CLAUDE.md AI_WORKFLOW.md SESSION_CONTEXT.md  # Stale ESLint version
grep -r "2,124\|2124" docs/ .planning/  # Stale warning count
grep -r "358" docs/ .planning/  # Stale complexity count
grep -r "517" docs/ .planning/  # Stale security FP count
```

### 10b: ROADMAP reconciliation

Parse `ROADMAP.md` systematically. Search for items resolved by this work:

| Search Term                      | Expected Matches                                        | Action                                            |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `complexity`                     | CANON-0138 (47 CRITICAL functions), any M2.1 CC items   | Mark complete — all 358 fixed                     |
| `eslint` / `lint`                | M2.1 ESLint items, warning reduction items              | Mark complete — zero warnings                     |
| `orphan`                         | Any orphan cleanup items                                | Mark complete — validators built + existing fixed |
| `truncation`                     | D39 enforcement items                                   | Mark complete — guardrails active                 |
| `propagation`                    | Propagation fix items                                   | Mark complete — all violations fixed              |
| `fragil`                         | Fragility items                                         | Mark complete — patterns fixed + prevention added |
| `security.*alert` / `code.*scan` | 30 open code scanning alerts (deferred from Plan 1 D#3) | Mark complete or update count                     |
| `warning`                        | Warning reduction items                                 | Mark complete — zero warnings achieved            |

For each match: mark checkbox complete, add date annotation if ROADMAP
convention requires it.

### 10c: MASTER_DEBT reconciliation (CRITICAL — must update BOTH files)

**Both `MASTER_DEBT.jsonl` AND `raw/deduped.jsonl` must be updated** (per TDMS
convention — `generate-views.js` reads from `deduped.jsonl` and overwrites
`MASTER_DEBT.jsonl`).

Search `MASTER_DEBT.jsonl` for items resolved by this work. Search terms and
expected matches:

| Search Pattern                                                       | Workstream | Expected Debt Items                                              |
| -------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `eslint` / `warning` / `lint`                                        | WS2        | Warning-related debt (2,124 warnings, rule configuration issues) |
| `complexity` / `cyclomatic` / `cognitive`                            | WS4        | CC>15 violations, complexity refactoring needs                   |
| `security.*false` / `detect-non-literal` / `detect-object-injection` | WS2        | Security false positive noise                                    |
| `propagation` / `duplicate.*function`                                | WS3        | Propagation pattern violations                                   |
| `truncat` / `file.*size` / `shrink`                                  | WS6        | Missing truncation protection                                    |
| `orphan` / `dead.*script` / `missing.*skill`                         | WS7        | Orphaned references                                              |
| `fragil` / `regex.*pars` / `hardcoded.*format`                       | WS5        | Fragile code patterns                                            |
| `error.*access` / `unsafe.*error`                                    | WS2        | Unsafe error access patterns                                     |
| `atomic.*write` / `writeFileSync`                                    | WS2        | Non-atomic file writes                                           |
| `unused.*var` / `no-unused`                                          | WS2        | Unused variables                                                 |
| `JSONL` / `MD.*format` / `AI.*facing`                                | WS1        | File format optimization needs                                   |
| `v10` / `eslint.*migrat` / `eslint.*upgrade`                         | WS2        | ESLint upgrade items                                             |

For each matching debt item:

1. **Verify it's actually resolved** — don't mark complete if the fix was
   partial
2. **Update status:** Set `"status": "resolved"` with
   `"resolved_by": "code-quality-overhaul-plan2"` and
   `"resolved_date": "YYYY-MM-DD"`
3. **Update in BOTH files:** `MASTER_DEBT.jsonl` AND `raw/deduped.jsonl`
4. **Run `generate-views.js`** to regenerate MD views
5. **Verify views:** Check that `MASTER_DEBT_VIEW.md` reflects the resolved
   items

**TDMS integrity check after reconciliation:**

```bash
# Verify MASTER_DEBT.jsonl and deduped.jsonl are in sync
node -e "
  const master = require('fs').readFileSync('docs/technical-debt/MASTER_DEBT.jsonl','utf8').trim().split('\n').length;
  const deduped = require('fs').readFileSync('docs/technical-debt/raw/deduped.jsonl','utf8').trim().split('\n').length;
  console.log('MASTER_DEBT:', master, 'deduped:', deduped, master === deduped ? 'IN SYNC' : 'OUT OF SYNC');
"
# Regenerate views
node scripts/debt/generate-views.js
# Verify no truncation in generated view
```

### 10d: Planning file reconciliation

Check ALL planning files for references to issues we just fixed:

| Location                                                    | What to Check                                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `.planning/system-wide-standardization/DISCOVERY_RECORD.md` | References to ESLint warnings, complexity, orphans — update as resolved       |
| `.planning/tooling-infrastructure-audit/PLAN.md`            | Plan 1 Step 5 references to sonash plugin — note that API migration completed |
| `.claude/state/task-mini-audit-hook-systems.state.json`     | Hook audit decisions referencing propagation/complexity — note as implemented |
| `.planning/code-quality-overhaul/DIAGNOSIS.md`              | Update current state metrics at top — before/after                            |
| Any other `.planning/` docs                                 | Search for stale metric references (2,124 warnings, 358 CC, etc.)             |

### 10e: Future ROADMAP items

If this work uncovers issues that are OUT OF SCOPE for this plan but should be
tracked:

- Add to `MASTER_DEBT.jsonl` AND `raw/deduped.jsonl` as new items
- Add to ROADMAP.md in appropriate milestone
- Document in this plan's completion metrics (Step 12)

### 10f: Testing checkpoint (EXTENSIVE)

1. **Doc accuracy:** Grep for stale version numbers, stale counts, references to
   removed/changed items across ALL docs
2. **ROADMAP completeness:** Every item that this plan resolved is marked
   complete. No false completions (item not actually resolved).
3. **MASTER_DEBT integrity:**
   - All resolved items have correct status in BOTH `MASTER_DEBT.jsonl` and
     `raw/deduped.jsonl`
   - Both files are in sync (same item count)
   - `generate-views.js` produces correct output
   - MD views reflect resolved items
   - No new items accidentally removed or corrupted
4. **Cross-reference check:** No doc references a file/rule/script/agent that no
   longer exists
5. **Planning file check:** No planning doc references stale metrics
6. **Full test suite:** `npm test` passes (docs changes shouldn't break tests,
   but verify)
7. **Pre-commit dry run:** Ensure doc changes pass all 15 pre-commit checks

**Done when:** All docs current with accurate counts/versions. ROADMAP items
marked. MASTER_DEBT fully reconciled (both files + views). Planning files
updated. Zero stale references anywhere. **Depends on:** Steps 1-9 (needs final
state). **Triggers:** Step 11 (audit).

---

## Step 11: Comprehensive Audit

Run code-reviewer agent on ALL new and modified files. This is the final quality
gate.

### 11a: Automated verification suite

Run ALL of these — every single one must pass:

```bash
# 1. Full test suite
npm test

# 2. Zero warnings
npm run lint -- --max-warnings 0

# 3. Build
npm run build

# 4. Propagation (full repo)
node scripts/check-propagation.js --all

# 5. Pattern compliance
node scripts/check-pattern-compliance.js

# 6. Orphan validators
node scripts/validators/check-skill-index-sync.js
node scripts/validators/check-npm-script-refs.js
node scripts/validators/check-hook-refs.js

# 7. Truncation guard
node scripts/validators/check-truncation-guard.js

# 8. Pre-commit (full dry run)
.husky/pre-commit
```

### 11b: Manual verification

1. **Trifecta coverage:** Every workstream has research findings (JSONL
   artifacts), pre-existing fixes (code changes), and prevention guardrails (new
   rules/validators)
2. **Documentation accuracy:** Grep all docs for stale counts (2124, 358, 517),
   stale versions (v9), removed item references
3. **MASTER_DEBT reconciliation verification:**
   - Count resolved items — must match expected count from Step 10c
   - Verify `MASTER_DEBT.jsonl` and `raw/deduped.jsonl` are in sync
   - Verify `MASTER_DEBT_VIEW.md` reflects all resolutions
   - Verify no items were accidentally deleted (count total items: resolved +
     unresolved should equal pre-plan total + any new items added)
4. **ROADMAP verification:** Verify all completed checkboxes correspond to
   actually-completed work
5. **No regressions:** Compare pre-implementation baseline metrics with
   post-implementation metrics (Step 12a table)
6. **Cross-reference integrity:** No doc/skill/hook/script references a file
   that doesn't exist

### 11c: Code review

Run code-reviewer agent on all new files (validators, truncation guard, etc.)
and heavily-modified files (refactored complex functions, migrated plugin
rules). Focus on:

- Security (new validators handle path traversal?)
- Correctness (refactored functions behave identically?)
- Style (new code follows project patterns?)

### Audit checkpoint

- Every finding addressed or tracked in TDMS (new items in MASTER_DEBT)
- No high-severity issues remaining
- CI passes end-to-end
- MASTER_DEBT item counts are consistent

**Done when:** All automated checks pass. All manual verifications complete.
Code review clean. MASTER_DEBT fully reconciled and verified. **Depends on:**
All previous steps. **Triggers:** Step 12 (completion).

---

## Step 12: Completion & Metrics

### 12a: Final metrics snapshot

Document the delta:

```
BEFORE → AFTER
ESLint warnings:     2,124 → 0
ESLint errors:       0 → 0
CC>15 violations:    358 → 0
Cognitive>15:        N/A → 0
Security FPs:        517 → 0 (rules disabled)
Propagation issues:  N → 0
Orphaned refs:       6+ → 0
Truncation guards:   0 → active (N files protected)
AI-facing JSONL:     existing → expanded (N files converted)
```

### 12b: Lock verification

- CI: `--max-warnings 0` enforced
- Pre-commit: staged file warnings block
- Propagation: function-duplicate is blocker
- Truncation: post-write-validator + pre-commit active
- Orphan validators: integrated in pattern-compliance

**Done when:** Metrics documented. All locks verified active. **Depends on:**
Step 11 (audit clean).

---

## Parallelization Guide

```
Plan 1 (prerequisite): Steps 1-9 (Tooling & Infrastructure Audit)
                ↓
Step 1:  ESLint v9 Cleanup & v10 Prep
                ↓
Step 2:  Warning Triage + Security Rules + Ratchet
                ↓
    ┌───────────┼───────────┬───────────┐
Step 3:     Step 4:     Step 5:     Step 6:
Complexity  Propagation Fragility   Truncation
    └───────────┼───────────┴───────────┘
                ↓
Step 7:  Remaining Warning Cleanup + Lock
                ↓
Step 8:  Orphan Detection Tooling
                ↓
Step 9:  AI-Facing File Format Audit
                ↓
Step 10: Documentation + Reconciliation
                ↓
Step 11: Comprehensive Audit
                ↓
Step 12: Completion & Metrics
```

Steps 3, 4, 5, 6 are fully independent and can run in parallel. Steps 1→2 are
strictly sequential. Steps 7→8→9→10→11→12 are strictly sequential.
