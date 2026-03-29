# V2: Codebase Verification (D2, D3, D4, D6)

**Verifier:** Verification agent
**Date:** 2026-03-29
**Method:** Direct file reads of all referenced scripts and settings files

---

## Claim 1: 21 hooks exist (17 project + 4 user-level)

**VERIFIED**

### Project-level hooks (`.claude/settings.json`) — 17 hooks

| # | Event | Script |
|---|-------|--------|
| P1 | SessionStart | `session-start.js` |
| P2 | SessionStart | `check-mcp-servers.js` |
| P3 | SessionStart | `check-remote-session-context.js` |
| P4 | SessionStart | `global/gsd-check-update.js` |
| P5 | SessionStart (compact) | `compact-restore.js` |
| P6 | PreToolUse (Bash) | `block-push-to-main.js` — `if: "Bash(git push *)"` |
| P7 | PreToolUse (Bash) | `pre-commit-agent-compliance.js` — `if: "Bash(git commit *)"` |
| P8 | PreCompact | `pre-compaction-save.js` |
| P9 | PostToolUse (Write) | `post-write-validator.js` |
| P10 | PostToolUse (Edit) | `post-write-validator.js` |
| P11 | PostToolUse (MultiEdit) | `post-write-validator.js` |
| P12 | PostToolUse (Read) | `post-read-handler.js` |
| P13 | PostToolUse (AskUserQuestion) | `decision-save-prompt.js` |
| P14 | PostToolUse (Bash) | `commit-tracker.js` — `if: "Bash(git commit *)|..."` |
| P15 | PostToolUse (Task/Agent) | `track-agent-invocation.js` |
| P16 | UserPromptSubmit | `user-prompt-handler.js` |
| P17 | Notification | `curl ntfy.sh` |

### User-level hooks (`~/.claude/settings.json`) — 4 hooks

| # | Event | Script |
|---|-------|--------|
| U1 | SessionStart | `~/.claude/hooks/gsd-check-update.js` |
| U2 | PostToolUse | `~/.claude/hooks/gsd-context-monitor.js` |
| U3 | PreToolUse (Skill) | `npx ccstatusline --hook` |
| U4 | UserPromptSubmit | `npx ccstatusline --hook` |

**Evidence:** `.claude/settings.json` lines 29-193, `~/.claude/settings.json` lines 8-51.

---

## Claim 2: gsd-context-monitor has no matcher and fires on all PostToolUse

**VERIFIED**

In `~/.claude/settings.json` lines 19-28, the PostToolUse entry for `gsd-context-monitor.js` has:
```json
"PostToolUse": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash -c 'eval \"$(fnm env --shell bash 2>/dev/null)\"; node \"C:/Users/jason/.claude/hooks/gsd-context-monitor.js\"'"
      }
    ]
  }
]
```

No `matcher` field. No `if` field. This hook fires on every single PostToolUse event regardless of which tool was invoked.

---

## Claim 3: gsd-context-monitor reads `/tmp/claude-ctx-{session_id}.json` bridge file

**VERIFIED (with platform nuance)**

`~/.claude/hooks/gsd-context-monitor.js` lines 46-48:
```javascript
const tmpDir = os.tmpdir();
const metricsPath = path.join(tmpDir, `claude-ctx-${sessionId}.json`);
```

The script uses `os.tmpdir()` (not a hardcoded `/tmp/`), which on Windows resolves to the user's temp directory (e.g., `C:\Users\jason\AppData\Local\Temp`). The research's description of `/tmp/claude-ctx-{session_id}.json` is the POSIX equivalent; the actual path is platform-dependent. The filename pattern `claude-ctx-{session_id}.json` is exactly as claimed.

The script reads `session_id` from stdin JSON (line 40: `const sessionId = data.session_id`), constructs the path, reads and parses the metrics file, then checks `remaining_percentage` against thresholds (35% warning, 25% critical). Confirmed at lines 64-66.

---

## Claim 4: post-write-validator.js has dead code (appCheckValidator, isMarkdownFile, isConfigFile)

**PARTIALLY VERIFIED — nuance required**

### `isMarkdownFile` — VERIFIED DEAD CODE
Defined at line 140: `const isMarkdownFile = filename.endsWith(".md");`
Grep for `isMarkdownFile` across the entire file returns only this single definition. Never referenced by any validator function.

### `isConfigFile` — VERIFIED DEAD CODE
Defined at line 142: `const isConfigFile = /\.(env|env\..+|config|cfg|ini|yaml|yml|json)$/.test(filename);`
Grep for `isConfigFile` across the entire file returns only this single definition. Never referenced by any validator function.

### `appCheckValidator` — REFUTED as "dead code"; it is SUPPRESSED, not dead
Defined at lines 552-598. It IS invoked at line 1017: `runValidator("appCheckValidator", appCheckValidator)`. It executes on every Write/Edit/MultiEdit call but immediately returns at line 572 (`if (!appCheckEnabled) return`) because App Check is disabled per ROADMAP.md M2. The function is structurally alive and would activate if `APP_CHECK_ENABLED=true` were set. Calling it "dead code" is misleading — it is intentionally dormant with a documented re-enablement path.

**Summary:** `isMarkdownFile` and `isConfigFile` are genuine dead code (defined, never used). `appCheckValidator` is active but suppressed by a feature flag.

---

## Claim 5: D3 says no remaining hooks benefit from `if` — re-examination with Write/Edit/Read `if` awareness

### Could post-write-validator benefit from `if: "Write(*.ts)|Edit(*.ts)"`?

**No — VERIFIED that the D3 conclusion is correct.**

Reading post-write-validator.js, it runs 9 validators across many file types:

| Validator | Fires on |
|-----------|----------|
| auditS0S1 | `*.jsonl` (Write only) |
| patternCheck | `.js`, `.ts`, `.tsx`, `.jsx`, `.sh`, `.yml`, `.yaml` |
| componentSizeCheck | `.tsx` files |
| firestoreWriteBlock | `.ts`, `.tsx`, `.js`, `.jsx` |
| testMockingValidator | `.test.ts`, `.spec.ts` etc. |
| appCheckValidator | `functions/src/*.ts` (suppressed) |
| typescriptStrictCheck | `.ts`, `.tsx` |
| repositoryPatternCheck | `.ts`, `.tsx`, `.js`, `.jsx` |
| agentTriggerEnforcer | ALL files (tracks modification count) |
| testRegistryReminder | test files (Write only) |

An `if` condition like `Write(*.ts)|Edit(*.ts)` would exclude `.jsx`, `.js`, `.sh`, `.yml`, `.yaml`, `.jsonl`, and `.tsx` files — breaking most validators. Even a broader pattern like `Write(*.ts)|Write(*.tsx)|Write(*.js)|Write(*.jsx)|Write(*.md)|Write(*.yaml)|Write(*.yml)|Write(*.jsonl)|Edit(*.ts)|...` would be unwieldy and still miss `agentTriggerEnforcer` which tracks ALL files.

The monolith's internal bail-outs (`isJsTsFile`, `isTsxFile`, `isTestFile`, `isPatternCheckable`) are already more precise than any glob pattern. The consolidation from 10 hooks to 1 was specifically done to save ~800ms Windows spawn overhead — splitting back via `if` patterns would partially reverse that gain.

**D3 conclusion stands: no `if` condition would help post-write-validator.**

### Could post-read-handler benefit from `if: "Read(SESSION_CONTEXT.md)|Read(ROADMAP.md)"`?

**No — VERIFIED that the D3 conclusion is correct.**

Reading post-read-handler.js, it has two phases:

1. **Phase 1 (Context Tracking):** Tracks ALL files read for context budget management. It counts unique files read (`contextState.filesRead`), warns when single files exceed 5000 lines, and warns when 15+ files have been read in a session. Filtering by path would create blind spots — the whole point is to monitor ALL reads.

2. **Phase 2 (Auto-Save Context):** Checks if enough files have been read (threshold: 20) and enough time has passed (15 minutes) to trigger an auto-save. This is a session-level metric that needs to see all reads.

Neither phase does special handling for specific files like SESSION_CONTEXT.md or ROADMAP.md. The hook is designed to be universal — an `if` condition restricting to specific files would defeat its purpose entirely.

**D3 conclusion stands: no `if` condition would help post-read-handler.**

---

## Claim 6: P4 and U1 are duplicate GSD update checks

**VERIFIED — both exist and perform the same function, but they are different script files**

### P4: `.claude/hooks/global/gsd-check-update.js` (project-level)
- Location: `.claude/settings.json` line 51
- Spawns a detached child process that runs `npm view get-shit-done-cc version`
- Compares against `~/.claude/get-shit-done/VERSION`
- Writes result to `~/.claude/cache/gsd-update-check.json`
- Simpler implementation: hardcodes `~/.claude/` as config dir

### U1: `~/.claude/hooks/gsd-check-update.js` (user-level)
- Location: `~/.claude/settings.json` line 14
- Spawns a detached child process that runs `npm view get-shit-done-cc version`
- Compares against VERSION file (checks both project and global locations)
- Writes result to same cache file: `~/.claude/cache/gsd-update-check.json`
- More sophisticated: uses `detectConfigDir()` to search across `.config/opencode`, `.opencode`, `.gemini`, `.claude` directories; respects `CLAUDE_CONFIG_DIR` env var; uses `windowsHide: true`

**Both scripts do the same thing:** check for GSD updates and write to the same cache file. They are not identical code — U1 is a newer, more portable version — but they produce the same output to the same location. Running both in the same session is redundant; the second to complete simply overwrites the first's result.

**The duplication is confirmed.** The user-level hook (U1) is the more robust version. The project-level hook (P4) could be removed without loss of functionality, though it would mean the check only runs at repos where the user-level settings are active.

---

## Summary Table

| # | Claim | Verdict | Key Evidence |
|---|-------|---------|--------------|
| 1 | 21 hooks (17+4) | **VERIFIED** | Direct count from both settings.json files |
| 2 | gsd-context-monitor has no matcher | **VERIFIED** | `~/.claude/settings.json` lines 19-28: no matcher field |
| 3 | gsd-context-monitor reads bridge file | **VERIFIED** | `gsd-context-monitor.js` line 47: `os.tmpdir()` + `claude-ctx-${sessionId}.json` |
| 4 | Dead code in post-write-validator | **PARTIALLY VERIFIED** | `isMarkdownFile` (L140) and `isConfigFile` (L142) are dead. `appCheckValidator` is suppressed, not dead. |
| 5 | No remaining hooks benefit from `if` | **VERIFIED** | post-write-validator needs ALL file types; post-read-handler needs ALL reads |
| 6 | P4 and U1 are duplicate GSD checks | **VERIFIED** | Both run `npm view get-shit-done-cc version`, write to same cache file |
