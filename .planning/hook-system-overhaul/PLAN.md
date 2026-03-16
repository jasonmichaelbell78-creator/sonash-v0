# PLAN: Pre-Commit/Pre-Push Hook System Overhaul

**Date:** 2026-03-16
**Decisions:** 44 (see DECISIONS.md)
**Effort:** XL (9 waves + verification)
**Scope:** Pre-commit/pre-push git hooks only. Feeds into SWS D36 (Hooks L3→L4).

---

## Wave 0: Verification of Existing Mechanisms

**Per Decision:** D22

**Purpose:** Confirm mini-audit implementations (PR #427) are active before adding new layers. If broken, fix before proceeding.

### Step 0.1: Verify "pre-existing" ban enforcement

**Implementation:**
- Run `SKIP_CHECKS="patterns" SKIP_REASON="pre-existing violations" git commit --allow-empty -m "test"`
- Expect: rejection with message about banned "pre-existing" phrase
- Check `_shared.sh` `require_skip_reason()` for the case-insensitive match

**Done when:** Ban confirmed active OR fixed if broken. Document result.

### Step 0.2: Verify CC baseline regression-only mode

**Implementation:**
- Read `.claude/state/known-debt-baseline.json` — confirm it has entries
- Run `node scripts/check-cc.js` and verify baseline suppression is working (should show "N violations suppressed by baseline" message)
- If no baseline entries: run `node scripts/check-cc.js --update-baseline` to establish baseline

**Done when:** CC baseline mode confirmed active. Propagation + CC overrides should drop in future.

### Step 0.3: Verify code-reviewer 4-hour gate

**Implementation:**
- Read `.husky/pre-push` code-reviewer gate section (line ~59-96)
- Confirm it reads `agent-invocations.jsonl` with 4-hour cutoff
- Verify inline Node.js logic parses timestamps correctly

**Done when:** Gate confirmed active with correct 4-hour window.

**Commit:** `verify: confirm mini-audit mechanisms active (pre-existing ban, CC baseline, reviewer gate)`

---

## Wave 1: Hook Contract Manifest

**Per Decisions:** D14, D14a-e, D15, D24, D32

**Purpose:** Create the declarative hook contract registry. This is a CANON artifact.

### Step 1.1: Create `scripts/config/hook-checks.json`

**Implementation:**
- Create the manifest with schema_version 1
- Register ALL pre-commit checks (13 checks, waves 0-12):
  - secrets-scan, eslint, tests, lint-staged, pattern-compliance, audit-s0s1, skill-validation, cross-doc-deps, doc-index, doc-headers, agent-compliance, debt-schema, jsonl-md-sync
- Register ALL pre-push checks (9 checks):
  - circular-deps, pattern-compliance-push, code-reviewer-gate, propagation, hook-tests, security-check, type-check, cyclomatic-cc, cognitive-cc, npm-audit, triggers
- For each check: id, name, description, hook, wave, command, flags, blocking (block/warn/auto-fix), escalation_blocking, skip_flag, exit_codes, condition, parallel_group, timeout_ms, dependencies, writes_to, reads_from, warning_type, actions (investigate/fix/defer), category, owner, test_command, sws_tenets, added

**Forked from:** Schema example in DECISIONS.md D14 discussion

**Done when:** Manifest contains all checks with all fields populated. Valid JSON.

### Step 1.2: Create `scripts/validate-hook-manifest.js`

**Implementation:**
- Read `scripts/config/hook-checks.json`
- Parse `.husky/pre-commit` and `.husky/pre-push` to extract check IDs (grep for wave/check markers)
- Validate bi-directionally: every manifest check exists in bash, every bash check exists in manifest
- Validate all `command` paths resolve to existing files
- Validate all `reads_from` / `writes_to` paths exist (or are expected-created)
- Validate all `skip_flag` values appear in SKIP_CHECKS handling
- Validate no duplicate IDs
- Use `sanitizeError()` for all error output
- Follow `scripts/lib/security-helpers.js` patterns for file I/O

**Done when:** Script passes when run against the manifest. Integrated into `npm run hooks:test`.

### Step 1.3: Wire into hooks:test

**Implementation:**
- Edit `scripts/test-hooks.js` to call `validate-hook-manifest.js` as part of its test suite
- Add to the test output: "Hook manifest: N checks registered, all validated"

**Done when:** `npm run hooks:test` includes manifest validation and passes.

**Commit:** `feat: hook contract manifest v1 + validation script (D14, D24)`

---

## Wave 2: Silent Failure Fixes

**Per Decisions:** D17, D2 (inline), D3

**Purpose:** Eliminate all 10 silent failure paths. Every failure now either logs to hook-warnings OR echoes to stderr.

### Step 2.1: Fix Group A — Missing tool warnings (pre-commit)

**Files:** `.husky/pre-commit`

**Implementation:**
- **gitleaks not installed** (wave 0): Replace silent continue with:
  ```bash
  node scripts/append-hook-warning.js --hook=pre-commit --type=missing-tool --severity=warning \
    --message="gitleaks not installed — secrets scan skipped" \
    --action='{"investigate":"winget search gitleaks","fix":"winget install gitleaks"}' \
    || echo "⚠️ gitleaks not installed — secrets scan skipped" >&3
  ```
- **lint-staged not installed** (wave 1b): Same pattern with `npm install -D lint-staged`
- **fnm unavailable** (`_shared.sh`): Add stderr warning in `_shared_init_fnm()` fallback path

**Done when:** Each missing tool scenario produces a visible warning (JSONL or stderr).

### Step 2.2: Fix Group B — Network failure (pre-push)

**Files:** `.husky/pre-push`

**Implementation:**
- **npm audit network error** (check 6): When exit code indicates network failure (check for "ENOTFOUND" or "ETIMEDOUT" in output), call:
  ```bash
  node scripts/append-hook-warning.js --hook=pre-push --type=network-error --severity=info \
    --message="npm audit skipped — network unavailable" \
    || echo "⚠️ npm audit skipped — network unavailable" >&3
  ```

**Done when:** Network failure produces a visible warning instead of silent skip.

### Step 2.3: Fix Group C — Logging infrastructure failures (pre-push)

**Files:** `.husky/pre-push`

**Implementation:**
- Replace all 5 `|| true` on `append-hook-warning.js` calls (lines 51, 90, 119, 194, 281) with D3 stderr fallback pattern:
  ```bash
  node scripts/append-hook-warning.js ... || echo "⚠️ Warning write failed: <context message>" >&3
  ```
- In `scripts/append-hook-warning.js`: add stderr message when 2MB size guard triggers (line 76) and when symlink detected
- In `scripts/log-override.js`: add `console.error` in rotation failure catch blocks (lines 126, 139) and auto-DEBT creation catch (line 265)

**Done when:** No `|| true` remains on warning write calls. Every logging failure produces stderr output.

### Step 2.4: Fix Group D — Script behavior

**Files:** `scripts/check-propagation.js`, `scripts/log-override.js`

**Implementation:**
- **check-propagation.js**: Add `console.log("✅ Propagation check passed")` when exit 0 with no warnings
- **log-override.js auto-DEBT**: Add `console.error("⚠️ Auto-generated DEBT entry: DEBT-XXXXX for check: <name>")` when DEBT is created (line ~263)

**Done when:** Propagation shows output on pass. Auto-DEBT creation is visible.

**Commit:** `fix: eliminate 10 silent failure paths — inline warnings + stderr fallbacks (D17)`

---

## Wave 3: End-of-Hook Summary + hook-runs.jsonl

**Per Decisions:** D6, D7, D11, D12, D20, D21, D29

**Purpose:** Create the call-to-action summary and persistent run-summary log.

### Step 3.1: Add timing infrastructure to pre-commit

**Files:** `.husky/pre-commit`

**Implementation:**
- At hook start: `HOOK_START=$(date +%s%N)` and initialize a CHECKS_RESULT array/temp file
- Before each check: `CHECK_START=$(date +%s%N)`
- After each check: compute duration, append to results: `echo "$CHECK_ID|$STATUS|$DURATION_MS" >> "$CHECKS_TMPFILE"`
- Status values: `pass`, `skip`, `warn`, `fail`, `auto-fix`

**Done when:** Every check has timing captured in temp file.

### Step 3.2: Add timing infrastructure to pre-push

**Files:** `.husky/pre-push`

**Implementation:** Same pattern as Step 3.1 for all pre-push checks.

**Done when:** Every pre-push check has timing captured.

### Step 3.3: Create end-of-hook summary function

**Files:** `.husky/_shared.sh` (new function) or inline in both hooks

**Implementation:**
- Read CHECKS_TMPFILE, compute totals
- On all pass: `echo "✅ Pre-commit: 13/13 passed (12.3s)" >&3`
- On warn/fail: print per-check table to stderr (fd 3):
  ```
  ┌─ Pre-commit Summary ─────────────────────────────────┐
  │ ✅ secrets-scan          pass     1.2s                │
  │ ✅ eslint                pass     4.5s                │
  │ ⚠️  pattern-compliance   warn     0.8s                │
  │ ✅ debt-schema           pass     0.3s                │
  ├───────────────────────────────────────────────────────┤
  │ 12 passed, 1 warning, 0 failed (12.3s)               │
  ├─ Actions ─────────────────────────────────────────────┤
  │ ⚠️  pattern-compliance:                               │
  │   Investigate: node scripts/check-pattern-compliance.js --all --verbose │
  │   Defer: node scripts/debt/intake-audit.js --source=hook --check=pattern-compliance │
  └───────────────────────────────────────────────────────┘
  ```
- Actions populated from `hook-checks.json` manifest (read check ID → look up actions)

**Done when:** Summary function produces correct output for pass, warn, and fail scenarios.

### Step 3.4: Write hook-runs.jsonl

**Files:** New logic at end of each hook (pre-commit, pre-push)

**Implementation:**
- After summary, write one JSONL line to `.claude/state/hook-runs.jsonl`:
  ```json
  {"hook":"pre-commit","timestamp":"...","branch":"...","commit":"...","total_checks":13,"checks":[{"id":"secrets-scan","status":"pass","duration_ms":1200},...],"total_duration_ms":12300,"outcome":"pass","skipped_checks":[],"warnings":0,"errors":0}
  ```
- Include rotation: if >200 entries, keep 100 (per D21)
- Use symlink guard and atomic write pattern

**Done when:** hook-runs.jsonl written after every hook run with correct schema.

**Commit:** `feat: end-of-hook summary + hook-runs.jsonl with per-check timing (D6, D7, D11)`

---

## Wave 4: Escalation Gate in Pre-Push

**Per Decisions:** D4, D19, D19-rev, D28

**Purpose:** Make escalated warnings block pushes. This is the core tenet enforcement.

### Step 4.1: Add escalation gate as first check in pre-push

**Files:** `.husky/pre-push`

**Implementation:**
- Insert new check at the very top (before circular deps):
  ```bash
  # Wave 0: Escalation gate — block on unacknowledged error-level warnings
  if [ "${CI:-}" != "true" ]; then
    ESCALATED=$(node -e "
      const fs = require('fs');
      const p = '.claude/hook-warnings.json';
      const a = '.claude/state/hook-warnings-ack.json';
      if (!fs.existsSync(p)) { process.exit(0); }
      const w = JSON.parse(fs.readFileSync(p, 'utf8'));
      const ack = fs.existsSync(a) ? JSON.parse(fs.readFileSync(a, 'utf8')) : {};
      const errors = (w.warnings || []).filter(e =>
        e.severity === 'error' &&
        (!ack[e.type] || new Date(e.timestamp) > new Date(ack[e.type]))
      );
      if (errors.length > 0) {
        errors.forEach(e => console.error('  ❌ ' + e.type + ': ' + e.message));
        process.exit(1);
      }
    " 2>&1)
    GATE_EXIT=$?
    if [ $GATE_EXIT -ne 0 ]; then
      echo "❌ PUSH BLOCKED: Unacknowledged error-level warnings" >&3
      echo "$ESCALATED" >&3
      echo "" >&3
      echo "   Fix the underlying issues, or:" >&3
      echo "   Skip: SKIP_WARNINGS=1 SKIP_REASON=\"...\" git push" >&3

      if is_skipped "warnings"; then
        require_skip_reason "SKIP_WARNINGS=1"
        node scripts/log-override.js --quick --check=escalation-gate --reason="$SKIP_REASON" \
          || echo "⚠️ Override log failed" >&3
      else
        exit 1
      fi
    fi
  fi
  ```
- Add `warnings` to SKIP_CHECKS handling in pre-push
- CI=true bypasses entirely (D28)

**Done when:** Push blocked when unacknowledged "error" warnings exist. SKIP_WARNINGS bypass works with reason logging. CI not affected.

### Step 4.2: Register escalation gate in manifest

**Files:** `scripts/config/hook-checks.json`

**Implementation:**
- Add entry for `escalation-gate` check with blocking: "block", skip_flag: "warnings", condition: null (always runs), actions showing the three resolution paths

**Done when:** Manifest includes escalation gate.

**Commit:** `feat: escalation gate in pre-push — error warnings block until resolved (D4, D19)`

---

## Wave 5: Data Store Fixes

**Per Decisions:** D5a, D5b, D5c, D13

**Purpose:** Fix orphaned/broken data stores. Every store has a writer and a consumer.

### Step 5.1: Verify warned-files.json graduation system (D5a)

**Implementation:**
- Read `scripts/check-pattern-compliance.js` graduation logic
- Trace the write path to `.claude/state/warned-files.json`
- Create a test: stage a file with a known violation, run pattern-compliance twice, verify second run blocks
- If graduation system is broken: fix the write logic

**Done when:** Graduation system confirmed working (warn first, block on repeat) OR fixed.

### Step 5.2: Wire commit-failures.jsonl (D5b)

**Files:** `.claude/hooks/commit-tracker.js`

**Implementation:**
- In the commit failure detection branch (HEAD unchanged after commit command):
  - Append entry to `.claude/state/commit-failures.jsonl`:
    ```json
    {"timestamp":"...","command":"git commit ...","branch":"...","session":"...","hook_output_excerpt":"first 5 lines of .git/hook-output.log"}
    ```
  - Use existing `safeAppendFileSync` pattern with symlink guard
  - Add rotation: keep 50 entries max

**Done when:** `commit-failures.jsonl` gets written on commit failures. `hook-analytics.js` reads non-empty data.

### Step 5.3: Add rotation to agent-invocations.jsonl (D5c)

**Files:** `.claude/hooks/track-agent-invocation.js`

**Implementation:**
- After appending new entry, check file size
- If > 32KB: read all entries, keep last 100, rewrite
- Use atomic write (temp + rename) pattern

**Done when:** Rotation active. File stays bounded.

### Step 5.4: Remove check-triggers.js fallback writer (D13)

**Files:** `scripts/check-triggers.js`

**Implementation:**
- Remove lines 361-402 (direct write to override-log.jsonl)
- Replace with: call `log-override.js --quick` only, with D3 stderr fallback if it fails
- Single owner: `log-override.js` is the only writer to `override-log.jsonl`

**Done when:** Only `log-override.js` writes to `override-log.jsonl`. grep confirms no other direct writers.

**Commit:** `fix: data store fixes — graduation system, commit-failures, rotation, single-owner (D5, D13)`

---

## Wave 6: Parallelization

**Per Decision:** D18

**Purpose:** Parallelize independent checks in pre-commit for ~3-4s time savings.

### Step 6.1: Parallelize compliance checks in pre-commit

**Files:** `.husky/pre-commit`

**Implementation:**
- Group into parallel: pattern-compliance + audit-s0s1 + skill-validation (waves 3, 4, 6)
- Use same background-job + wait pattern as pre-push section 5:
  ```bash
  # Parallel compliance checks
  (node scripts/check-pattern-compliance.js --staged > "$PATTERNS_TMP" 2>&1; echo $? > "${PATTERNS_TMP}.rc") &
  PATTERNS_PID=$!

  (node scripts/validate-audit.js --strict-s0s1 ... > "$AUDIT_TMP" 2>&1; echo $? > "${AUDIT_TMP}.rc") &
  AUDIT_PID=$!

  (npm run skills:validate > "$SKILLS_TMP" 2>&1; echo $? > "${SKILLS_TMP}.rc") &
  SKILLS_PID=$!

  wait $PATTERNS_PID $AUDIT_PID $SKILLS_PID
  # Process results sequentially
  ```
- Add exit trap for temp file cleanup
- Update timing capture to work with parallel execution

**Depends on:** Wave 3 (timing infrastructure must support parallel checks)

### Step 6.2: Parallelize doc checks in pre-commit

**Files:** `.husky/pre-commit`

**Implementation:**
- Group: cross-doc-deps + doc-headers (waves 7, 9)
- Same pattern as Step 6.1
- Note: doc-index (wave 8, auto-fix) must remain sequential because it modifies staged files

**Done when:** Pre-commit runs compliance-checks and doc-checks in parallel. Total time reduced by ~3-4s. All checks still produce correct results.

### Step 6.3: Update manifest parallel_group fields

**Files:** `scripts/config/hook-checks.json`

**Implementation:**
- Set `parallel_group: "compliance-checks"` on pattern-compliance, audit-s0s1, skill-validation
- Set `parallel_group: "doc-checks"` on cross-doc-deps, doc-headers

**Done when:** Manifest reflects actual parallelization.

**Commit:** `perf: parallelize compliance + doc checks in pre-commit (~3-4s savings) (D18)`

---

## Wave 7: Source-of-Truth Regeneration

**Per Decisions:** D16, D30, D9

**Purpose:** Make hook-warnings-log.jsonl the single canonical source. hook-warnings.json becomes a generated view.

### Step 7.1: Create hook-warnings-ack.json (D30)

**Files:** New: `.claude/state/hook-warnings-ack.json`

**Implementation:**
- Schema: `{"acknowledged": {"<warning_type>": "<iso_timestamp>"}, "lastCleared": "<iso_timestamp>"}`
- Migrate existing acknowledgment data from hook-warnings.json to this file
- Update `append-hook-warning.js` to NOT write acknowledgment data to hook-warnings.json

**Done when:** Ack state lives in dedicated file. hook-warnings.json no longer stores ack state.

### Step 7.2: Add regeneration logic to session-start

**Files:** `.claude/hooks/session-start.js`

**Implementation:**
- At session start, regenerate hook-warnings.json:
  1. Read hook-warnings-log.jsonl (all entries)
  2. Read hook-warnings-ack.json (acknowledgment state)
  3. Filter: keep entries where `timestamp > ack[type]` (unacknowledged)
  4. Deduplicate by (hook, type, message) — keep most recent
  5. Compute `occurrences` and `occurrences_since_ack` from JSONL counts
  6. Write regenerated hook-warnings.json (max 50 entries)
- This replaces the current "read and display" logic with "regenerate and display"

**Done when:** hook-warnings.json is regenerated from JSONL + ack state at every session start. Verified by: delete hook-warnings.json, start session, confirm it's regenerated correctly.

### Step 7.3: Update append-hook-warning.js

**Files:** `scripts/append-hook-warning.js`

**Implementation:**
- Continue writing to hook-warnings-log.jsonl (canonical source)
- Continue writing to hook-warnings.json (for immediate pre-push consumption between sessions)
- BUT: hook-warnings.json is now understood as a cache that session-start regenerates
- Remove acknowledgment-related writes from this script

**Done when:** Writes are clean: JSONL = canonical append, JSON = cache for inter-session reads.

**Commit:** `refactor: JSONL as canonical source, hook-warnings.json as regenerated view (D16, D30)`

---

## Wave 8: /Alerts Integration + Analytics + Maturity

**Per Decisions:** D25, D8, D33b

**Purpose:** Wire new data into existing observability. Update maturity tracking.

### Step 8.1: Add hook completeness dimension to /alerts

**Files:** `.claude/skills/alerts/scripts/run-alerts.js` or hook-pipeline health checker

**Implementation:**
- Read `.claude/state/hook-runs.jsonl`
- New alerts:
  - "Hook check X hasn't run in 3+ days" (from hook-runs check frequency)
  - "Check X skipped N times in last 7 days" (from hook-runs skip counts)
  - "Check X average duration increased >50% vs 7-day baseline" (from timing data)
  - "N checks not registered in hook-checks.json manifest" (from manifest validation)

**Done when:** `/alerts` shows hook completeness metrics.

### Step 8.2: Add --since default to hook-analytics.js (D8)

**Files:** `scripts/hook-analytics.js`

**Implementation:**
- Add logic: if no `--since` flag provided, default to PR #427 merge date (the date "pre-existing" ban shipped)
- This filters out stale override entries automatically
- Add note in output: "Filtering from <date> (post pre-existing ban)"

**Done when:** `npm run hooks:analytics` shows clean data without "pre-existing" noise.

### Step 8.3: Update L3→L4 maturity checklist (D33b)

**Files:** Relevant maturity tracking document (likely in `.planning/system-wide-standardization/`)

**Implementation:**
- Document which L4 checklist items this plan satisfies:
  - Hook contract manifest (T5, T17)
  - No silent failures (T11)
  - Warnings are actionable (T8)
  - Data stores have lifecycle (T5, no orphans)
  - Run-summary with timing (T14)
  - Escalation enforcement (T8, T11)

**Done when:** Maturity checklist updated with items checked off.

**Commit:** `feat: /alerts hook completeness + analytics filter + L3→L4 maturity update (D25, D8, D33b)`

---

## Wave 9: Execution-Based Testing Verification

**Per Decision:** D26

**Purpose:** Verify ALL changes work end-to-end using the same multi-agent execution pattern from Phase 0 discovery.

### Step 9.1: Tier 1 — Unit verification

**Implementation:** Launch parallel agents to verify each modified script:
- Run each of the 10 silent failure scenarios and verify warnings appear (JSONL or stderr)
- Run `append-hook-warning.js` with intentionally broken JSONL path → verify stderr fallback
- Run hook manifest validation → verify it passes
- Write test entry to hook-runs.jsonl → verify schema and rotation
- Verify hook-warnings-ack.json created and readable

**Done when:** Every modified script produces expected output.

### Step 9.2: Tier 2 — Integration verification

**Implementation:**
- Stage a file with a known pattern violation → commit → verify summary shows warning with actions
- Create an escalated warning → push → verify it blocks → SKIP_WARNINGS bypass → verify override logged
- Run full pre-commit with all checks → verify hook-runs.jsonl entry with timing
- Run full pre-push → verify escalation gate, summary, and hook-runs entry
- Verify parallel checks produce same results as sequential (no race conditions)

**Done when:** End-to-end hook flows work correctly.

### Step 9.3: Tier 3 — Multi-agent verification sweep

**Implementation:** Launch parallel agents (same pattern as Phase 0):
- Agent 1: Verify all state files exist, valid format, recent data
- Agent 2: Verify all scripts run without error
- Agent 3: Verify consumer scripts (run-alerts, hook-analytics, hook-pipeline) read new data correctly
- Agent 4: Verify manifest matches bash hooks bi-directionally
- Agent 5: Verify no `|| true` on warning writes, no silent failure paths remain

**Done when:** All 5 verification agents pass. Zero silent failures. All data stores have writers and consumers.

**Commit:** `test: 3-tier execution-based verification of hook system overhaul (D26)`

---

## Audit Checkpoint

After Wave 9, before declaring complete:

1. Run `code-reviewer` agent on all modified files
2. Run `npm run hooks:test` — all tests pass
3. Run `npm run patterns:check` — no new violations
4. Verify `scripts/config/hook-checks.json` manifest validates
5. Verify hook-runs.jsonl has entries from the test runs
6. Run `/alerts` — hook completeness dimension shows green

---

## Effort Estimate

| Wave | Focus | Estimated Effort |
|------|-------|-----------------|
| 0 | Verification | S (30 min) |
| 1 | Hook contract manifest | L (90 min) |
| 2 | Silent failure fixes | M (60 min) |
| 3 | Summary + hook-runs.jsonl | L (90 min) |
| 4 | Escalation gate | M (45 min) |
| 5 | Data store fixes | M (60 min) |
| 6 | Parallelization | M (45 min) |
| 7 | Source-of-truth regen | M (60 min) |
| 8 | /Alerts + analytics + maturity | M (45 min) |
| 9 | Testing verification | L (90 min) |
| **Total** | | **XL (~10 hours)** |

---

## Parallelizable Waves

- **Waves 1 + 2** can run in parallel (manifest creation + silent failure fixes are independent)
- **Waves 5 + 6** can run in parallel (data store fixes + parallelization are independent)
- **Wave 8** depends on Waves 3 + 7 (needs hook-runs.jsonl and regenerated warnings)
- **Wave 9** depends on ALL prior waves
