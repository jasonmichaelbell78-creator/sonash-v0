# Implementation Plan: Custom Statusline (Go Binary)

## Summary

Build a Go binary that renders a 22-widget, 3-line Claude Code statusline for
SoNash. Replaces the existing Node.js statusline with a TOML-configurable,
cross-locale-portable solution that renders in <50ms. Includes background cache
fetching for API-backed widgets (weather, GitHub PR/CI status) with exponential
backoff retry.

**Decisions:** See DECISIONS.md (20 decisions) **Effort Estimate:** L (full
build in one pass, then extensive testing)

---

## Files to Create/Modify

### New Files (11)

1. **`tools/statusline/main.go`** — Stdin reader, widget orchestrator, stdout
   writer, background cache goroutine
2. **`tools/statusline/config.go`** — TOML config parsing, defaults, local
   override merge
3. **`tools/statusline/widgets.go`** — All 22 widget functions
4. **`tools/statusline/cache.go`** — Background fetch, backoff logic, staleness
   detection, `?` indicator
5. **`tools/statusline/render.go`** — 3-line layout assembly, ANSI 16-color,
   thin pipe separators
6. **`tools/statusline/statusline_test.go`** — Go tests: per-widget unit tests +
   full binary stdin/stdout integration test
7. **`tools/statusline/config.toml`** — Shared defaults (committed): thresholds,
   widget order, colors, weather location, timezone
8. **`tools/statusline/config.local.toml.example`** — Example local config
   showing all override-able fields
9. **`tools/statusline/build.sh`** — Full setup: verify Go, run tests, compile,
   copy binary, update settings.json, test render, print summary
10. **`tools/statusline/.gitignore`** — Ignores `config.local.toml`, compiled
    binary, cache files
11. **`tools/statusline/go.mod`** — Go module definition with TOML dependency

### Modified Files (3)

1. **`.claude/settings.json`** — Update `statusLine.command` to point to
   compiled binary
2. **`.gitignore`** — Add `tools/statusline/config.local.toml` and binary
   patterns
3. **`tests/hooks/global/statusline.test.ts`** — Remove (replaced by Go tests)

### Removed Files (1)

1. **`.claude/hooks/global/statusline.js`** — Replaced by Go binary (keep until
   Go version is verified working)

---

## Step 1: Initialize Go Module and Project Structure

Create `tools/statusline/` directory, initialize `go.mod`, add TOML parsing
dependency (`github.com/BurntSushi/toml`).

Create skeleton files with package declarations and imports.

**Done when:** `go build` succeeds with an empty main function **Depends on:**
None **Triggers:** None

---

## Step 2: Config System (config.go + config.toml)

Build the TOML config layer. Per Decision #12 and #14.

**config.toml (shared defaults):**

```toml
[general]
separator = "│"
lines = 3
color_mode = "16"  # 16, 256, or truecolor

[weather]
location = "Nashville,TN,US"
units = "imperial"  # imperial or metric
cache_ttl_minutes = 5

[timezone]
zone = "America/Chicago"
format = "15:04 CST"

[thresholds]
context_yellow = 50
context_orange = 65
context_red = 80
rate_limit_warning = 70
rate_limit_critical = 90

[cache]
fetch_interval_minutes = 5
retry_backoff = [1, 2, 5, 10]  # minutes
stale_indicator = "?"

[placeholders]
worktree = "wt:none"
agent = "agent:none"
task = "task:none"
pr = "PR:none"
ci = "CI:none"
unavailable = "..."
```

**config.local.toml.example:**

```toml
# Copy to config.local.toml and fill in your values.
# This file is gitignored — machine-specific overrides only.

[api_keys]
weather_api_key = "YOUR_OPENWEATHERMAP_API_KEY"

[paths]
# Override if your binary install location differs
binary_dir = "~/.claude/statusline"
```

Config loading: read `config.toml`, then merge `config.local.toml` on top if it
exists. Missing local file is not an error.

**Done when:** Config loads with defaults, local override merges correctly,
missing local file handled gracefully. Test covers all three cases. **Depends
on:** Step 1 **Triggers:** None

---

## Step 3: Stdin JSON Parser (main.go)

Read JSON from stdin, parse into a Go struct matching Claude Code's v2.1.81
schema. Per research Theme 4 data sources.

**Struct fields needed:**

- `model.id`, `model.display_name`
- `session_id`
- `workspace.current_dir`, `workspace.project_dir`
- `context_window.used_percentage`, `remaining_percentage`,
  `context_window_size`
- `cost.total_cost_usd`, `total_duration_ms`, `total_lines_added`,
  `total_lines_removed`
- `rate_limits.five_hour.used_percentage`, `resets_at`
- `rate_limits.seven_day.used_percentage`, `resets_at`
- `agent.name`
- `worktree.name`, `worktree.branch`
- `output_style.name`
- `vim.mode`

Handle null/missing fields gracefully — any field can be absent before first API
call.

**Done when:** Sample JSON parses correctly, missing fields default to zero
values, test covers normal + partial + empty JSON. **Depends on:** Step 1
**Triggers:** None

---

## Step 4: Stdin-Only Widgets (widgets.go — 12 widgets)

Implement all widgets that need only stdin JSON data (zero I/O cost):

| Widget            | ID  | Implementation                                           |
| ----------------- | --- | -------------------------------------------------------- |
| Model name        | A1  | `data.Model.DisplayName`                                 |
| Session duration  | A3  | `data.Cost.TotalDurationMs` → format as `Xh Ym`          |
| Permission mode   | A4  | `data.OutputStyle.Name` with `⏵⏵` prefix                 |
| Active agent      | A6  | `data.Agent.Name` or placeholder `agent:none`            |
| Project directory | B2  | `filepath.Base(data.Workspace.CurrentDir)`               |
| Worktree          | B3  | `data.Worktree.Name` or placeholder `wt:none`            |
| Context gauge     | C1  | Color-coded bar (green/yellow/orange/red per thresholds) |
| Rate limit 5hr    | C5  | `data.RateLimits.FiveHour.UsedPercentage`                |
| Rate limit reset  | C7  | `data.RateLimits.FiveHour.ResetsAt` → format as time     |
| Rate limit 7d     | C6  | `data.RateLimits.SevenDay.UsedPercentage`                |
| Lines changed     | C8  | `+N -M` from `total_lines_added/removed`                 |
| Clock             | F4  | `time.Now().In(configuredZone)`                          |

Each widget function returns a `WidgetResult{text string, color int}`.

**Done when:** All 12 widgets produce correct output for sample data,
placeholders work for missing fields, color coding matches thresholds from
config. Tests cover each widget. **Depends on:** Steps 2, 3 **Triggers:** None

---

## Step 5: Git Branch Widget (widgets.go — 1 widget)

| Widget     | ID  | Implementation                                        |
| ---------- | --- | ----------------------------------------------------- |
| Git branch | B1  | `git rev-parse --abbrev-ref HEAD` with 5-second cache |

Shell out to git with 1-second timeout. Cache result for 5 seconds to avoid
repeated calls during rapid statusline updates.

**Done when:** Branch displays correctly, cache prevents repeated git calls
within 5s, timeout handles missing git gracefully. Test covers cache
hit/miss/timeout. **Depends on:** Step 1 **Triggers:** None

---

## Step 6: File-Read Widgets (widgets.go — 5 widgets)

Implement widgets that read local state files:

| Widget              | ID  | File                                        | Read Strategy                              |
| ------------------- | --- | ------------------------------------------- | ------------------------------------------ |
| Hook health         | D1  | `.claude/state/hook-runs.jsonl`             | Tail last line, parse JSON                 |
| Unacked warnings    | D5  | `.claude/state/hook-warnings-log.jsonl`     | Count lines with `"acked":false`           |
| Current task        | E1  | `~/.claude/todos/{session}-agent-*.json`    | Find newest, read in_progress task         |
| Uptime              | F15 | System query                                | Windows: `net stats workstation` or `wmic` |
| Session count today | I4  | `~/.claude/statusline/sessions-today.count` | Simple counter file, reset at midnight     |

For I4 (session count): the binary increments a counter file on first run of
each session (keyed by `session_id` from stdin). Counter resets when date
changes.

All file reads wrapped in error handling — missing file → placeholder per
Decision #15.

**Done when:** Each widget reads its file correctly, missing files show
placeholder, malformed files don't crash. Tests use temp files with known
content. **Depends on:** Steps 2, 3 **Triggers:** None

---

## Step 7: Cache System for API-Backed Widgets (cache.go)

Build the background fetch + cache layer per Decisions #13, #16.

**Architecture:**

```
main() → parse stdin → render with current cache → kick background refresh if stale → exit
```

The binary is invoked fresh each render cycle (not a long-running process), so
"background goroutine" means: check cache age, if stale, spawn a goroutine that
fetches and writes cache, but don't wait for it — render with stale data now. On
next invocation, fresh cache is available.

**Cache file format:** JSON files in `~/.claude/statusline/cache/`

```
weather.json     — { "temp": 72, "condition": "☀", "high": 78, "low": 55, "fetched_at": "..." }
github-pr.json   — { "number": 462, "status": "passing", "fetched_at": "..." }
github-ci.json   — { "status": "passing", "conclusion": "success", "fetched_at": "..." }
```

**Backoff state:** `~/.claude/statusline/cache/backoff.json`

```json
{ "weather": { "failures": 0, "next_retry_at": "..." }, ... }
```

**Staleness indicator:** When cache is stale (past TTL + in backoff), append dim
`?` to widget output per Decision #16.

**Done when:** Cache read/write works, staleness detection correct, backoff
increments on failure, resets on success, `?` indicator appears for stale data.
Tests cover fresh/stale/missing/backoff-capped scenarios. **Depends on:** Step 2
**Triggers:** Step 8

---

## Step 8: API-Backed Widgets (widgets.go + cache.go — 4 widgets)

| Widget           | ID  | API            | Cache Key        | Command/URL                                                                              |
| ---------------- | --- | -------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| Weather current  | F6  | OpenWeatherMap | `weather.json`   | `https://api.openweathermap.org/data/2.5/weather?q={location}&units={units}&appid={key}` |
| Weather forecast | F7  | Same response  | Same             | Uses `temp_max`, `temp_min` from same API call                                           |
| GitHub PR status | H2  | GitHub CLI     | `github-pr.json` | `gh pr status --json number,statusCheckRollup`                                           |
| CI/CD pipeline   | H3  | GitHub CLI     | `github-ci.json` | `gh run list --limit 1 --json status,conclusion`                                         |

Weather: single API call populates both F6 and F7. Free tier allows 1000
calls/day (far more than needed at 5-min intervals).

GitHub: uses `gh` CLI (already authenticated). No API key needed.

**Done when:** All 4 widgets render from cache, background fetch populates
cache, API failures trigger backoff, stale data shows `?`. Tests mock API
responses. **Depends on:** Step 7 **Triggers:** None

---

## Step 9: 3-Line Renderer (render.go)

Assemble all 22 widgets into the 3-line layout per Decision #7.

**Line construction:**

```
Line 1: A1 │ B1 │ B3 │ B2 │ A4 │ A6 │ E1
Line 2: D1 │ D5 │ H2 │ H3 │ C8 │ C1 │ C5 resets C7 │ C6
Line 3: F6 F7 │ F4 │ A3 │ F15 │ I4
```

Each widget returns `{text, color}`. Renderer applies ANSI color codes (16-color
per Decision #5), joins with `│` separator (per Decision #8), and writes to
stdout.

Sanitize all dynamic values: strip control characters, CSI/OSC escape sequences,
cap individual widget length. Mirror the security pattern from the existing
`statusline.js`.

**Done when:** Full 3-line output matches canonical mockup from DECISIONS.md.
Placeholders appear correctly for inactive/missing widgets. All output is
sanitized. Test compares against expected output string. **Depends on:** Steps
4, 5, 6, 8 **Triggers:** None

---

## Step 10: Build Script (build.sh)

Per Decision #19 — full setup script.

```bash
#!/usr/bin/env bash
# tools/statusline/build.sh — Build and install SoNash statusline

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="$HOME/.claude/statusline"
BINARY_NAME="sonash-statusline"

# 1. Verify Go
echo "Checking Go installation..."
go version || { echo "ERROR: Go not found. Install Go first."; exit 1; }

# 2. Run tests
echo "Running tests..."
cd "$SCRIPT_DIR"
go test -v ./...

# 3. Compile
echo "Building binary..."
GOOS=$(go env GOOS) GOARCH=$(go env GOARCH) go build -o "$BINARY_NAME" .

# 4. Install
echo "Installing to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp "$BINARY_NAME" "$INSTALL_DIR/"

# 5. Update settings.json
SETTINGS_FILE="$SCRIPT_DIR/../../.claude/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
  # Update statusLine command using node (available via project)
  node -e "
    const fs = require('fs');
    const s = JSON.parse(fs.readFileSync('$SETTINGS_FILE','utf8'));
    s.statusLine = {type:'command', command:'$INSTALL_DIR/$BINARY_NAME'};
    fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(s,null,2)+'\\n');
  "
  echo "Updated .claude/settings.json"
fi

# 6. Test render with sample JSON
echo "Test render..."
echo '{"model":{"display_name":"Opus 4.6"},"context_window":{"used_percentage":42,"remaining_percentage":58},"workspace":{"current_dir":"'$(pwd)'"},"cost":{"total_duration_ms":5000000,"total_lines_added":124,"total_lines_removed":38},"session_id":"test-session"}' | "$INSTALL_DIR/$BINARY_NAME"
echo ""

# 7. Summary
echo ""
echo "=== SoNash Statusline Installed ==="
echo "Binary: $INSTALL_DIR/$BINARY_NAME"
echo "Config: $SCRIPT_DIR/config.toml"
echo "Local config: $SCRIPT_DIR/config.local.toml (create from .example if needed)"
echo ""
echo "Widgets active: 22"
echo "Lines: 3"
echo "Target render: <50ms"
```

**Done when:** Script runs end-to-end on Windows (Git Bash), binary is
installed, settings.json updated, test render produces 3-line output. Handles
missing Go gracefully. **Depends on:** Steps 1-9 **Triggers:** None

---

## Step 11: Cross-Locale Setup Documentation

Add setup instructions to `config.local.toml.example` header and ensure
`build.sh` prompts for missing config.

**Per-machine first-time setup:**

1. `cd tools/statusline`
2. `cp config.local.toml.example config.local.toml`
3. Add weather API key (free at openweathermap.org)
4. `bash build.sh`
5. Restart Claude Code — verify statusline renders

**After pulling changes on second machine:**

1. `cd tools/statusline && bash build.sh`
2. (config.local.toml already exists from initial setup)

**Done when:** Setup instructions are clear in the example file, build.sh warns
if config.local.toml is missing, both locales can build and run independently.
**Depends on:** Step 10 **Triggers:** None

---

## Step 12: Remove Old Statusline

Remove the Node.js statusline and its test:

- Delete `.claude/hooks/global/statusline.js`
- Delete `tests/hooks/global/statusline.test.ts`
- Delete `dist-tests/tests/hooks/global/statusline.test.js`

**Done when:** Old files removed, no references to old statusline in
settings.json, Go binary is the sole statusline. Verified by running Claude
Code. **Depends on:** Step 10 (new statusline verified working first)
**Triggers:** None

---

## Step 13: Testing

Per Decision #18 — test extensively after full build.

**Test matrix:**

| Test              | Method                                                     | What It Verifies                                      |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| Unit tests        | `go test ./...`                                            | Each widget function, config parsing, cache logic     |
| Integration test  | Sample JSON piped to binary                                | Full 3-line output matches expected format            |
| Missing data test | Empty/partial JSON piped to binary                         | Placeholders render correctly, no crash               |
| Cache test        | Run binary twice — first with no cache, second after fetch | `...` on first run, data on subsequent                |
| Stale cache test  | Set cache timestamp to past, break API                     | `?` indicator appears                                 |
| Performance test  | `time` the binary with full JSON                           | Renders in <50ms                                      |
| Settings test     | Verify settings.json points to correct binary              | Claude Code picks up the statusline                   |
| Live test         | Run Claude Code, observe statusline                        | All 3 lines render, widgets update after each message |
| Width test        | Narrow terminal window                                     | Output doesn't wrap or crash (may truncate)           |
| Cross-locale test | Pull on second machine, run build.sh                       | Same output, machine-specific config applied          |

**Done when:** All tests pass, live rendering confirmed in Claude Code.
**Depends on:** Steps 10, 11, 12 **Triggers:** None

---

## Step 14: Audit

Run code-reviewer agent on all new/modified files in `tools/statusline/`.

**Checklist:**

- [ ] No hardcoded API keys or secrets
- [ ] All external input (stdin JSON, file reads, API responses) sanitized
- [ ] Error handling on all file reads and shell-outs
- [ ] No path traversal vulnerabilities in file reads
- [ ] Binary doesn't hang on missing stdin
- [ ] TOML config validated (bad values don't crash)
- [ ] 16-color ANSI only (no truecolor escapes)
- [ ] Cross-platform paths (forward slashes, no Windows-only assumptions)

**Done when:** All audit findings addressed or tracked in TDMS. **Depends on:**
All implementation steps **Triggers:** None

---

## Parallelization Notes

- **Steps 2, 3 can run in parallel** (config and JSON parser are independent)
- **Steps 4, 5, 6 can run in parallel** (different widget groups, all depend on
  2+3)
- **Step 7 depends on 2 only** (cache system is independent of widgets)
- **Steps 8 depends on 7** (API widgets need cache layer)
- **Step 9 depends on 4, 5, 6, 8** (renderer needs all widgets)
- **Steps 10-12 are sequential** (build → setup → remove old)
- **Step 13 depends on everything** (testing)
- **Step 14 depends on everything** (audit)
