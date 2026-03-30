<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-29
**Status:** DRAFT
<!-- prettier-ignore-end -->

# PLAN: Hook If-Conditions Implementation

**Research:** `.research/hook-if-conditions/` (33 agents, 60 claims)
**Decisions:** `.planning/hook-if-implementation/DECISIONS.md` (21 decisions)
**Effort:** L (3 sessions — 1 wave per session per D18)

---

## Wave 1: Infrastructure + Inline Gates (~2-3 hours)

### Step 1: Lean ensure-fnm.sh wrapper (Per D2, D3)

Add fast-path node check at the top of `.claude/hooks/ensure-fnm.sh`. If node is
already on PATH, skip fnm initialization entirely and `exec "$@"` immediately.
Preserves full fnm fallback for locales where node isn't on PATH.

**Implementation:**

```bash
# Fast-path: if node is already available, skip fnm (saves ~140ms per call)
if command -v node >/dev/null 2>&1; then
  exec "$@"
fi
# ... existing fnm initialization below ...
```

**Files:** `.claude/hooks/ensure-fnm.sh` **Depends on:** Nothing **Done when:**
`time bash .claude/hooks/ensure-fnm.sh node -e "process.exit(0)"` completes in
<70ms (vs current ~234ms). Both `node -v` and `fnm --version` still work after
the change.

---

### Step 2: GSD context-monitor broad matcher (Per D4)

Add matcher to the gsd-context-monitor PostToolUse hook in user-level settings.
Scopes from ALL tool calls to
Write/Edit/MultiEdit/Bash/Task/Agent/WebSearch/WebFetch.

**Implementation:** Edit `~/.claude/settings.json`, add `"matcher"` field:

```json
{
  "matcher": "^(?i)(write|edit|multiedit|bash|task|agent|websearch|webfetch)$",
  "hooks": [{ "type": "command", "command": "..." }]
}
```

**Files:** `~/.claude/settings.json` (user-level, home locale only per D4)
**Depends on:** Nothing **Done when:** Hook fires on Write/Bash calls but NOT on
Read/Grep/Glob calls.

---

### Step 3: Remove duplicate GSD update check (Per D5)

Remove the P4 GSD update check from project settings. U1 (user-level) is the
more robust version with multi-IDE detection and `windowsHide`.

**Implementation:** Remove the SessionStart hook entry for `gsd-check-update.js`
from `.claude/settings.json`.

**Files:** `.claude/settings.json` **Depends on:** Nothing **Done when:** Only
one GSD update check exists (in `~/.claude/settings.json`). `git diff` confirms
the removal. Verify no other hook references the removed entry.

---

### Step 4: .env.local.encrypted PreToolUse block (Per D6, D13)

Add inline PreToolUse gate that blocks any Write to `.env.local.encrypted` with
exit code 2. No external script — inline bash one-liner. Also append warning to
hook-warnings-log.jsonl for `/alerts` wiring (per D13).

**Implementation:** Add to `.claude/settings.json` PreToolUse section:

```json
{
  "matcher": "^(?i)write$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(.env.local.encrypted)",
      "command": "bash -c 'echo \"[env-guard] BLOCKED: .env.local.encrypted must not be overwritten by AI agents\" >&2 && node scripts/append-hook-warning.js --hook=pre-tool --type=env-guard --severity=error --message=\"Blocked write to .env.local.encrypted\" 2>/dev/null; exit 2'",
      "statusMessage": "Checking env file protection..."
    }
  ]
}
```

**Files:** `.claude/settings.json` **Depends on:** Nothing **Done when:** Write
to `.env.local.encrypted` is blocked (exit 2). Warning appears in
hook-warnings-log.jsonl. Other Write operations unaffected. **Wiring (D8):**
trigger=Write(.env.local.encrypted) → script=inline bash → output=stderr + JSONL
→ consumer=/alerts surfaces it.

---

### Step 5: Activate dead code validators in post-write-validator (Per D17)

Wire up the existing but unused `isMarkdownFile` and `isConfigFile` flags in
`post-write-validator.js`. Add markdown unclosed-fence detection and JSON syntax
validation.

**Implementation:**

- Find `isMarkdownFile` and `isConfigFile` variable declarations
- Add markdown validator: check for unclosed code fences (odd number of ```
  lines)
- Add JSON validator: `JSON.parse()` with try/catch, warn on syntax errors.
  Handle trailing commas gracefully (tsconfig.json uses them)
- Both validators should WARN (exit 0), not BLOCK

**Files:** `.claude/hooks/post-write-validator.js` **Depends on:** Nothing
**Done when:** Writing a `.md` file with an unclosed fence produces a warning.
Writing invalid JSON to a `.json` file produces a warning. Valid files pass
silently. Trailing commas in tsconfig.json do NOT trigger warnings.

---

### Step 6: Wave 1 Audit

Run code-reviewer agent on all Wave 1 changes. Verify:

- ensure-fnm.sh fast-path works at home locale
- No hooks broken by settings.json changes
- Validators don't produce false positives on existing files
- `npm test` passes

**Depends on:** Steps 1-5 **Done when:** code-reviewer report with 0 blocking
findings. All tests pass.

---

## Wave 2: PreToolUse Gates + OTB Tier 1 (~4-5 hours)

### Step 7: Gate test harness (Per D14)

Build a script that simulates PreToolUse/PostToolUse stdin and invokes gate
scripts directly. This enables testing without Claude Code session restarts.

**Implementation:** `scripts/test-hook-gates.js`

- Accepts:
  `--hook=<script> --event=PreToolUse|PostToolUse --tool=Write --input='{"file_path":"firestore.rules"}'`
- Pipes simulated stdin JSON to the hook script
- Reports: exit code, stdout, stderr
- Runs as part of `npm run test:hooks`

**Files:** `scripts/test-hook-gates.js`, `package.json` (add test:gates script)
**Depends on:** Nothing (can run before any gates exist) **Done when:**
`npm run test:gates` executes and reports results. Harness correctly simulates
PreToolUse stdin format.

---

### Step 8: Settings.json PreToolUse guardian (Per D9, D20)

PreToolUse gate that blocks Write/Edit to `.claude/settings.json` if:

- Proposed content is not valid JSON
- Critical hooks would be removed (block-push-to-main,
  pre-commit-agent-compliance)
- The gate itself would be removed (self-bootstrapping)

Respects `SKIP_GATES=1` kill switch (per D20).

**Implementation:** `.claude/hooks/settings-guardian.js`

- Reads proposed content from stdin (PreToolUse provides tool_input)
- Parses JSON, checks for critical hook presence
- Exit 2 to block, exit 0 to allow
- Appends to hook-warnings-log.jsonl on block (per D13)

Hook config:

```json
{
  "matcher": "^(?i)(write|edit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(.claude/settings.json)|Edit(.claude/settings.json)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/settings-guardian.js",
      "statusMessage": "Validating settings.json integrity..."
    }
  ]
}
```

**Files:** `.claude/hooks/settings-guardian.js`, `.claude/settings.json`
**Depends on:** Step 7 (test with harness first) **Done when:** Test harness
confirms: valid edit passes, invalid JSON blocks, critical hook removal blocks,
self-removal blocks. Kill switch `SKIP_GATES=1` bypasses all checks. **Wiring
(D8):** trigger=Write/Edit(.claude/settings.json) → script=settings-guardian.js
→ output=stderr + JSONL → consumer=/alerts.

---

### Step 9: Settings.json PostToolUse logger (Per D9, D11)

PostToolUse hook that logs what changed in settings.json after a successful
write. Runs `git diff` on the file, appends structured JSONL entry.

**Implementation:** `.claude/hooks/governance-logger.js`

- Fires on Write/Edit to CLAUDE.md and .claude/settings.json (per D11)
- Runs `git show HEAD:<file>` vs current file
- Appends to `.claude/state/governance-changes.jsonl`:
  `{"timestamp":"...","file":"...","sessionNumber":N,"diff":"...","linesAdded":N,"linesRemoved":N}`
- Appends summary to hook-warnings-log.jsonl for /alerts wiring (per D13)

Hook config:

```json
{
  "matcher": "^(?i)(write|edit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(CLAUDE.md)|Edit(CLAUDE.md)|Write(.claude/settings.json)|Edit(.claude/settings.json)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/governance-logger.js",
      "statusMessage": "Logging governance change..."
    }
  ]
}
```

**Files:** `.claude/hooks/governance-logger.js`, `.claude/settings.json`
**Depends on:** Step 7 (test with harness) **Done when:** Editing CLAUDE.md
produces a JSONL entry in governance-changes.jsonl with git diff content. Entry
appears in /alerts. **Wiring (D8):** trigger=Write/Edit(CLAUDE.md|settings.json)
→ script=governance-logger.js → output=governance-changes.jsonl +
hook-warnings-log.jsonl → consumer=/alerts + audit trail.

---

### Step 10: Firestore rules PreToolUse guard (Per D10, D20)

PreToolUse gate that blocks removal of `allow create, update: if false` patterns
from `firestore.rules`. Block with override (`ALLOW_RULES_EDIT=1`).

**Implementation:** `.claude/hooks/firestore-rules-guard.js`

- Reads proposed content from stdin
- Scans for presence of write-block patterns on protected collections (journal,
  daily_logs, inventoryEntries)
- If any pattern missing: exit 2 (block)
- `ALLOW_RULES_EDIT=1` bypasses all checks
- `SKIP_GATES=1` also bypasses (per D20)
- Appends to hook-warnings-log.jsonl on block (per D13)

Hook config:

```json
{
  "matcher": "^(?i)(write|edit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(**/firestore.rules)|Edit(**/firestore.rules)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/firestore-rules-guard.js",
      "statusMessage": "Checking firestore rules integrity..."
    }
  ]
}
```

**Files:** `.claude/hooks/firestore-rules-guard.js`, `.claude/settings.json`
**Depends on:** Step 7 (test with harness) **Done when:** Test harness confirms:
valid rules edit passes, removing write-block pattern blocks,
`ALLOW_RULES_EDIT=1` bypasses, `SKIP_GATES=1` bypasses. Warning appears in
JSONL. **Wiring (D8):** trigger=Write/Edit(firestore.rules) →
script=firestore-rules-guard.js → output=stderr + JSONL → consumer=/alerts.

---

### Step 11: Groundhog Day loop detector (Per D12)

First PostToolUseFailure hook in this project. Detects repeated identical
failures and warns Claude to try a different approach.

**Implementation:** `.claude/hooks/loop-detector.js`

- Event: PostToolUseFailure
- `if`:
  `"Bash(npm run build *)|Bash(npm test *)|Bash(npx tsc *)|Bash(npm run lint *)"`
- Reads error output from stdin
- Hashes error (strip line numbers, timestamps for fuzzy match)
- Maintains rolling window in `.claude/state/error-loop-tracker.json`:
  `{"hashes":[{"hash":"...","count":N,"firstSeen":"...","lastSeen":"..."}]}`
- If same hash 3+ times within 20 minutes (per D12): return warning via stdout
  (`description` field for Claude to read)
- Appends to hook-warnings-log.jsonl (per D13)

Hook config:

```json
{
  "hooks": {
    "PostToolUseFailure": [
      {
        "matcher": "^(?i)bash$",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(npm run build *)|Bash(npm test *)|Bash(npx tsc *)|Bash(npm run lint *)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/loop-detector.js",
            "statusMessage": "Checking for error loops...",
            "continueOnError": true
          }
        ]
      }
    ]
  }
}
```

**Files:** `.claude/hooks/loop-detector.js`, `.claude/settings.json` **Depends
on:** Step 7 (test with harness) **Done when:** Test harness confirms: first
failure passes silently, 3rd identical failure within 20 min produces warning,
different failures don't trigger, old failures expire. Warning appears in JSONL.
**Wiring (D8):** trigger=PostToolUseFailure(npm/tsc) → script=loop-detector.js →
output=stdout warning + JSONL → consumer=Claude reads warning + /alerts.

---

### Step 12: Wave 2 Audit (Per D19)

Run code-reviewer agent on all Wave 2 changes. Verify:

- Test harness works for all gates
- PreToolUse gates block correctly (exit 2)
- Kill switch works for all gates
- PostToolUseFailure hook functions
- No false positives on normal operations
- `npm test` passes
- All JSONL wiring confirmed via /alerts

**Depends on:** Steps 7-11 **Done when:** code-reviewer report with 0 blocking
findings. All tests pass. All hooks wired end-to-end per D8.

---

## Wave 3: Stretch Goals (~3-4 hours, per D21)

### Step 13: Pre-deploy safeguard (Per D15)

PreToolUse gate on `Bash(firebase deploy *)` and `Bash(npx firebase deploy *)`.
Checks build freshness, `.env.local` existence, and last test run status.

**Implementation:** `.claude/hooks/deploy-safeguard.js`

- Checks: `.next/` build dir mtime vs source mtime, `.env.local` exists with
  required vars, `.claude/state/test-runs.jsonl` last entry = pass
- Exit 2 to block if any check fails
- `SKIP_GATES=1` bypasses (per D20)

Hook config:

```json
{
  "matcher": "^(?i)bash$",
  "hooks": [
    {
      "type": "command",
      "if": "Bash(firebase deploy *)|Bash(npx firebase deploy *)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/deploy-safeguard.js",
      "statusMessage": "Running pre-deploy checks..."
    }
  ]
}
```

**Files:** `.claude/hooks/deploy-safeguard.js`, `.claude/settings.json`
**Depends on:** Step 16 (test-runner provides test status data) **Done when:**
Test harness confirms: stale build blocks, missing env blocks, failed tests
block, all-clear passes. Kill switch bypasses. **Wiring (D8):**
trigger=Bash(firebase deploy) → script=deploy-safeguard.js → output=stderr +
JSONL → consumer=/alerts.

---

### Step 14: Test-runner tracking (Per D16)

PostToolUse hook that captures test run results (pass/fail + duration).

**Implementation:** `.claude/hooks/test-tracker.js`

- `if`: `"Bash(npm test *)|Bash(npx vitest *)"`
- Reads exit code from tool output
- Appends to `.claude/state/test-runs.jsonl`:
  `{"timestamp":"...","command":"...","exitCode":N,"durationMs":N,"session":N}`
- No JSONL warning on pass; warn on fail (per D13)

**Files:** `.claude/hooks/test-tracker.js`, `.claude/settings.json` **Depends
on:** Nothing **Done when:** Running `npm test` produces a JSONL entry. Failed
tests also appear in hook-warnings-log.jsonl. **Wiring (D8):** trigger=Bash(npm
test) → script=test-tracker.js → output=test-runs.jsonl + (on fail)
hook-warnings-log.jsonl → consumer=deploy-safeguard reads test status + /alerts
on failures.

---

### Step 15: Large file read warning (Stretch)

PreToolUse gate on Read for large files. Checks file size before read.

**Implementation:** `.claude/hooks/large-file-gate.js`

- `if`: `"Read(*.jsonl)|Read(*.log)|Read(*.csv)|Read(*.jsonl)"`
- Checks file size via `fs.statSync`
- \>5MB: exit 2 (block with message suggesting limit/offset params)
- \>500KB: warn via stderr (proceed)
- `SKIP_GATES=1` bypasses

**Files:** `.claude/hooks/large-file-gate.js`, `.claude/settings.json` **Depends
on:** Step 7 (test harness) **Done when:** Reading a >5MB file is blocked.
Reading a >500KB file warns. Normal files pass silently. **Wiring (D8):**
trigger=Read(_.jsonl|_.log|\*.csv) → script=large-file-gate.js → output=stderr +
JSONL → consumer=/alerts.

---

### Step 16: Wave 3 Audit (Per D19)

Run code-reviewer agent on all Wave 3 changes.

**Depends on:** Steps 13-15 **Done when:** code-reviewer report with 0 blocking
findings. All tests pass.

---

## Parallelization Notes

**Wave 1:** Steps 1-5 are all independent — can run as parallel subagents. Step
6 (audit) depends on all completing.

**Wave 2:** Step 7 (test harness) must complete first. Steps 8-11 can then run
in parallel (all use the harness independently). Step 12 (audit) depends on all.

**Wave 3:** Steps 13 depends on 14 (deploy safeguard reads test data). Step 15
is independent. Step 16 (audit) depends on all.

---

## Rollback (Per D20)

All gates respect `SKIP_GATES=1` environment variable. Quick disable:

```bash
SKIP_GATES=1 claude
```

Permanent removal: delete the hook entry from `.claude/settings.json` and the
corresponding script from `.claude/hooks/`.

---

## Summary

| Wave      | Steps        | Effort             | Key Deliverables                                                                   |
| --------- | ------------ | ------------------ | ---------------------------------------------------------------------------------- |
| W1        | 1-6          | ~2-3 hrs           | Lean fnm wrapper, GSD matcher, env block, monolith validators                      |
| W2        | 7-12         | ~4-5 hrs           | Test harness, settings guardian, governance logger, firestore guard, loop detector |
| W3        | 13-16        | ~3-4 hrs (stretch) | Deploy safeguard, test tracker, large file gate                                    |
| **Total** | **16 steps** | **~9-12 hrs**      | **3 infra fixes, 5 new hooks, 2 monolith validators, test harness**                |
