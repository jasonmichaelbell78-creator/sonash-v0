# Statusline Current Implementation Analysis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** ACTIVE
**Source:** Filesystem analysis of `.claude/hooks/global/statusline.js`, test suite, settings, and state files
<!-- prettier-ignore-end -->

---

## 1. What It Currently Shows

The statusline renders a single-line terminal output with 5 components separated
by `|` delimiters:

| #   | Component          | Source                            | Format                                    |
| --- | ------------------ | --------------------------------- | ----------------------------------------- |
| 1   | **Model name**     | `data.model.display_name`         | Dim text (`\x1b[2m`)                      |
| 2   | **Git branch**     | `git rev-parse --abbrev-ref HEAD` | Cyan text (`\x1b[36m`)                    |
| 3   | **Current task**   | Todo files in `~/.claude/todos/`  | Bold text (`\x1b[1m`), optional           |
| 4   | **Directory name** | `path.basename(dir)`              | Dim text                                  |
| 5   | **Context usage**  | `data.context_window.remaining_%` | Color-coded bar (green/yellow/orange/red) |

**Layout examples:**

- With task:
  `Claude Opus 4 | housecleaning | Fix CI pipeline | sonash-v0 [bar 28%]`
- Without task: `Claude Opus 4 | housecleaning | sonash-v0 [bar 28%]`

**Context bar behavior:**

| Usage   | Color        | Visual                   |
| ------- | ------------ | ------------------------ |
| 0-49%   | Green        | `[bar] N%`               |
| 50-64%  | Yellow       | `[bar] N%`               |
| 65-79%  | Orange 208   | `[bar] N%`               |
| 80-100% | Blinking red | Skull emoji + `[bar] N%` |

---

## 2. What It Does NOT Show (Gap Analysis)

Six potential SoNash widgets were identified in prior research (Session #229
statusline survey, agent-environment-analysis DECISIONS.md #20, Session #230
zero-warning infrastructure):

| Widget              | Available Data Source                              | Data Volume | Currently Shown |
| ------------------- | -------------------------------------------------- | ----------- | --------------- |
| **Debt ticker**     | `docs/technical-debt/MASTER_DEBT.jsonl`            | 8,461 lines | NO              |
| **Hook health**     | `.claude/state/hook-runs.jsonl`                    | 100 entries | NO              |
| **Health grade**    | `.claude/state/health-score-log.jsonl`             | 4 entries   | NO              |
| **Session counter** | `SESSION_CONTEXT.md` (line 41)                     | Single int  | NO              |
| **Git dirty count** | `git status --porcelain` (would require shell-out) | Dynamic     | NO              |
| **Pace sparkline**  | `.claude/state/velocity-log.jsonl`                 | 3 entries   | NO              |

**Additional potential widgets from state files (75 files in
`.claude/state/`):**

| Data Source               | Lines  | Potential Widget             |
| ------------------------- | ------ | ---------------------------- |
| `commit-log.jsonl`        | 628    | Commits-this-session counter |
| `hook-warnings-log.jsonl` | 30     | Unacked warnings count       |
| `reviews.jsonl`           | 29     | Open review count            |
| `review-metrics.jsonl`    | 291    | Fix ratio trend              |
| `agent-invocations.jsonl` | varies | Active agent count           |
| `pending-reviews.json`    | single | Pending review indicator     |
| `alerts-baseline.json`    | single | Alert delta since baseline   |

---

## 3. Performance Analysis

### Current Costs

| Operation                  | Type           | Est. Duration                   | Blocking? |
| -------------------------- | -------------- | ------------------------------- | --------- |
| Parse JSON from stdin      | In-process     | <1ms                            | No        |
| `git rev-parse` shell-out  | `execFileSync` | 50-200ms (cold), 10-50ms (warm) | **YES**   |
| Todo dir `readdirSync`     | Filesystem     | 1-10ms                          | YES       |
| Todo file `statSync` (N)   | Filesystem     | N \* 1-5ms                      | YES       |
| Todo file `readFileSync`   | Filesystem     | 1-5ms                           | YES       |
| `path.basename` + sanitize | In-process     | <1ms                            | No        |

**Total estimated: 60-220ms per invocation (dominated by git shell-out).**

### Critical Performance Facts

1. **Single `execFileSync` call**: `git rev-parse --abbrev-ref HEAD` with a
   1-second timeout. This is the main bottleneck. Uses `windowsHide: true` for
   Windows compatibility.

2. **File I/O**: Reads 1-2 files total (todo directory listing + one todo JSON).
   The todo lookup only happens when `session_id` is present AND the todos
   directory exists. Does NOT read any `.claude/state/` files.

3. **No caching**: Every statusline invocation re-shells to git and re-reads the
   filesystem. No memoization, no file watchers, no IPC.

4. **Invocation overhead**: The statusline is launched as a new Node.js process
   per invocation (`bash ensure-fnm.sh node statusline.js`). Node startup alone
   is ~50-100ms. The `ensure-fnm.sh` wrapper adds additional overhead (fnm env
   eval, fnm use). Total cold-start overhead is likely 150-300ms before the
   script even begins executing.

### Performance Budget for Widget Expansion

Adding widgets that read `.claude/state/` files would add:

- **1 JSONL tail read per widget**: ~2-5ms each (small files)
- **MASTER_DEBT.jsonl**: 8,461 lines. A naive `readFileSync` + line count would
  cost 20-50ms. Need line counting (e.g., `wc -l` or stream counting).
- **git status for dirty count**: Another `execFileSync`, ~50-200ms. Would
  roughly double the git cost.
- **SESSION_CONTEXT.md grep**: Text parse for session counter, ~5-10ms.

**Estimated budget with 6 new widgets: 200-500ms total** (up from 60-220ms).
This is within acceptable bounds for a statusline that refreshes every few
seconds, but would benefit from caching or a daemon model.

---

## 4. Test Coverage

**File**: `tests/hooks/global/statusline.test.ts` (187 lines)

### What IS Tested (4 describe blocks, 17 test cases)

| Block                    | Tests | Coverage                                          |
| ------------------------ | ----- | ------------------------------------------------- |
| `computeContextUsage`    | 7     | null/undefined, 0/50/100%, clamping, NaN          |
| `sanitizeTerminalOutput` | 6     | Control chars, ANSI, OSC, truncation, safe, empty |
| `isPathContained`        | 3     | Inside, outside (../), self-reference             |
| `JSON input parsing`     | 4     | Model extraction, fallback, dir, context %        |

### What is NOT Tested

| Gap                         | Risk                                                                             |
| --------------------------- | -------------------------------------------------------------------------------- |
| **Git shell-out**           | `execFileSync` to `git rev-parse` not tested (requires mock or integration test) |
| **Todo file discovery**     | `findCurrentTask()` not tested (filesystem mock needed)                          |
| **End-to-end stdin/stdout** | No integration test piping JSON in and checking rendered output                  |
| **Error paths**             | Empty stdin, malformed JSON, git timeout, missing todos dir                      |
| **Color code assignment**   | Which threshold gets which color not verified                                    |
| **Windows path handling**   | No Windows-specific path tests                                                   |
| **Concurrent invocations**  | No test for race conditions in todo file reads                                   |

**Testing approach**: Tests re-implement logic extracted from the hook rather
than importing it. The hook is a CommonJS script using `require()` and
`process.stdin`; the tests copy the pure functions (computeContextUsage,
sanitizeTerminalOutput, isPathContained) and test them independently. This means
a logic drift between the hook and the tests would go undetected.

---

## 5. Security Patterns

### Strengths

1. **Input sanitization (`sanitize()`)**: Strips control characters
   (`\x00-\x1f`, `\x7f-\x9f`), CSI escape sequences, and OSC sequences. Caps
   output to 80 characters. Applied to model name, branch name, directory name.

2. **Path traversal protection**: `findCurrentTask()` uses the correct pattern
   from `CLAUDE.md` anti-patterns: `/^\.\.(?:[\\/]|$)/.test(rel)` plus absolute
   path check plus empty-string check. This prevents reading files outside the
   todos directory.

3. **`execFileSync` not `execSync`**: Uses `execFileSync("git", [...])` which
   avoids shell injection. Arguments are passed as an array, not interpolated
   into a string.

4. **Timeout on git**: 1-second timeout prevents hanging if git is unresponsive.

5. **`windowsHide: true`**: Prevents console window flash on Windows.

6. **Silent failure**: Top-level catch swallows all errors to avoid breaking the
   statusline display on unexpected inputs.

### Potential Concerns

| Concern                                  | Severity | Notes                                                                                                          |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| No sanitization on task content          | Low      | `activeForm` gets control-char strip but not full `sanitize()` (no ANSI/OSC strip, no 80-char cap)             |
| Todo file JSON parsing                   | Low      | Parses untrusted JSON from filesystem; if `~/.claude/todos/` is writable by other processes, could inject data |
| No `stdio: ['pipe','pipe','ignore']` doc | Info     | Good practice but undocumented why stderr is ignored                                                           |
| Silent catch hides real errors           | Info     | Makes debugging difficult; no logging to a debug file                                                          |

---

## 6. Windows Compatibility

### What Works

- `execFileSync("git", [...])` with `windowsHide: true` — correct for Windows
- `path.basename()`, `path.resolve()`, `path.relative()` — Node's path module
  handles Windows paths
- `os.homedir()` — resolves correctly on Windows
- Path traversal regex `[\\/]` — handles both forward and back slashes
- `ensure-fnm.sh` wrapper: Works in Git Bash / MSYS2 environment that Claude
  Code provides

### Potential Issues

| Issue                         | Severity | Detail                                                                                                                              |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **fnm startup cost**          | Medium   | `ensure-fnm.sh` evals `fnm env` every invocation. On Windows with antivirus, this can add 100-300ms                                 |
| **ANSI escape support**       | Low      | Windows Terminal supports ANSI natively. Legacy `cmd.exe` does not but is unlikely to be the host terminal                          |
| **`fs.existsSync` race**      | Low      | TOCTOU race on `todosDir` — possible but unlikely in practice                                                                       |
| **Process spawning overhead** | Medium   | Windows process creation is heavier than Unix (~2-3x). Each statusline invocation creates: bash -> fnm -> node -> git. 4 processes. |

---

## 7. Architecture Assessment

### Current: Single-File Monolith

The implementation is a **119-line CommonJS script** that:

1. Reads JSON from stdin
2. Computes 5 display values
3. Shells out to git once
4. Reads todo files
5. Writes formatted output to stdout

**No module system, no imports (beyond Node built-ins), no configuration, no
plugin mechanism.**

### Could It Support Plugins/Widgets?

**Not in current form.** To support widgets, it would need:

| Requirement           | Current State           | What's Needed                           |
| --------------------- | ----------------------- | --------------------------------------- |
| Widget registration   | None                    | Widget manifest or directory convention |
| Data collection layer | Inline in main script   | Separate data-fetcher functions/modules |
| Layout engine         | Hardcoded string concat | Template or composition system          |
| Configuration         | None                    | Widget enable/disable, ordering         |
| Error isolation       | Single try/catch        | Per-widget error boundaries             |
| Performance budget    | No tracking             | Per-widget timing + total budget cap    |

**Recommended architecture for widget support:**

```
statusline.js (orchestrator)
  |-- widgets/
  |     |-- model.js
  |     |-- branch.js
  |     |-- task.js
  |     |-- context.js
  |     |-- health-grade.js    (new)
  |     |-- debt-ticker.js     (new)
  |     |-- hook-health.js     (new)
  |     |-- session-counter.js (new)
  |     |-- git-dirty.js       (new)
  |     |-- pace-sparkline.js  (new)
  |-- lib/
  |     |-- sanitize.js
  |     |-- file-reader.js     (cached JSONL tail reader)
  |     |-- timer.js           (performance budget enforcer)
```

Each widget would export `{ id, collect(data), render(value), priority }` and
the orchestrator would run them with per-widget timeouts and error isolation.

---

## 8. Data Sources Available for Widgets

### Tier 1: Direct Read (small files, fast access)

| File                                    | Size       | Widget Use                | Read Cost |
| --------------------------------------- | ---------- | ------------------------- | --------- |
| `.claude/state/health-score-log.jsonl`  | 4 lines    | Health grade (last entry) | <1ms      |
| `.claude/state/velocity-log.jsonl`      | 3 lines    | Pace sparkline            | <1ms      |
| `.claude/state/hook-warnings-log.jsonl` | 30 lines   | Unacked warning count     | <1ms      |
| `SESSION_CONTEXT.md`                    | ~130 lines | Session counter (line 41) | 2-5ms     |

### Tier 2: Moderate Read (need tail or count)

| File                             | Size      | Widget Use            | Read Cost |
| -------------------------------- | --------- | --------------------- | --------- |
| `.claude/state/hook-runs.jsonl`  | 100 lines | Hook health (last N)  | 2-5ms     |
| `.claude/state/commit-log.jsonl` | 628 lines | Session commit count  | 5-10ms    |
| `.claude/state/reviews.jsonl`    | 29 lines  | Open review indicator | <2ms      |

### Tier 3: Expensive Read (large files or shell-out)

| File / Command                          | Size        | Widget Use          | Read Cost |
| --------------------------------------- | ----------- | ------------------- | --------- |
| `docs/technical-debt/MASTER_DEBT.jsonl` | 8,461 lines | Debt ticker count   | 20-50ms   |
| `git status --porcelain`                | Dynamic     | Git dirty count     | 50-200ms  |
| `git diff --stat`                       | Dynamic     | Changed lines count | 50-200ms  |

### Tier 4: Derived (require computation)

| Source                                 | Widget Use             | Computation           |
| -------------------------------------- | ---------------------- | --------------------- |
| Last N entries of `hook-runs.jsonl`    | Hook pass rate trend   | Count pass/fail/warn  |
| Last N `health-score-log.jsonl`        | Health trend arrow     | Compare last 2 scores |
| `MASTER_DEBT.jsonl` filtered by status | Open vs resolved ratio | JSON parse + filter   |

---

## 9. Configuration & Registration

### How the Statusline Hook is Registered

**Project settings** (`.claude/settings.json`, line 165-168):

```json
"statusLine": {
  "type": "command",
  "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/global/statusline.js"
}
```

**Global template** (`.claude/settings.global-template.json`, line 19-22):

```json
"statusLine": {
  "type": "command",
  "command": "bash -c 'if command -v fnm >/dev/null 2>&1; then eval \"$(fnm env --shell bash 2>/dev/null)\"; fnm use --silent-if-unchanged >/dev/null 2>&1 || true; fi; node \"$CLAUDE_PROJECT_DIR/.claude/hooks/global/statusline.js\"'"
}
```

**Key difference**: The project settings use the shared `ensure-fnm.sh` wrapper.
The global template inlines the fnm setup (older pattern, pre-wrapper). Both
point to the same `statusline.js` script.

**No widget configuration exists.** There is no mechanism to enable/disable
individual widgets, reorder them, or set per-widget options.

---

## 10. Summary of Key Findings

### Strengths

1. Clean, minimal implementation that does its core job well
2. Strong sanitization and path traversal protection
3. Proper Windows compatibility (`windowsHide`, path module, `[\\/]` regex)
4. Reasonable git timeout (1s)
5. Silent failure prevents statusline from breaking the UX

### Weaknesses

1. **No widget architecture** — adding anything requires editing the monolith
2. **No caching** — every invocation re-shells to git and re-reads files
3. **Process spawn overhead** — bash + fnm + node + git = 4 processes per
   invocation
4. **Test coverage gaps** — no integration tests, no git mock, no todo file
   tests, logic duplication between tests and source
5. **No configuration** — widgets cannot be enabled/disabled per user or project
6. **Shows 0 of 6 identified SoNash-specific widgets** — only generic Claude
   Code information (model, branch, task, dir, context)

### Risks for Widget Expansion

1. **Performance budget**: Adding 6 widgets naively could push latency from
   ~150ms to ~500ms+ (with additional git shell-outs and JSONL reads)
2. **MASTER_DEBT.jsonl size**: At 8,461 lines, cannot be fully parsed each
   invocation. Need line-count caching or a pre-computed summary file.
3. **Widget error isolation**: One failing widget could take down the entire
   statusline if not properly isolated.
4. **Test strategy**: Need to decide between mocking the filesystem (unit) vs
   running against real state files (integration).
