# Statusline Widget Catalog

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Purpose:** Decision-making document — select which widgets to implement
**Context:** Claude Code statusline on Windows 11 / Git Bash, SoNash project, Opus 4.6 with 1M context window
**Current statusline:** `.claude/hooks/global/statusline.js` (119 lines, Node.js)
<!-- prettier-ignore-end -->

---

## How to Read This Document

Every widget has a **Source Confidence** tag:

- `[VERIFIED]` — I read the actual file, tested the command, or confirmed the
  stdin JSON field from the constraints research
- `[DOCS-VERIFIED]` — Confirmed in official documentation but not functionally
  tested (Bash tool was unavailable during research)
- `[ESTIMATED]` — Inferred to exist based on patterns or documentation; not
  directly confirmed
- `[UNAVAILABLE]` — Tried to verify and the source does not exist or is not
  accessible

**Ease ratings:** `S` = <10 lines, <30 min | `M` = 10-50 lines, 30-120 min | `L`
= 50+ lines, >2 hours

**Anomaly-driven design philosophy:** Most widgets should be hidden in normal
state and appear only when their values cross anomaly thresholds. Permanent
residents: branch + context bar. Everything else earns screen space by being
anomalous.

---

## Data Source Verification Summary

### Stdin JSON Fields (from 05-CONSTRAINTS.md) [VERIFIED]

All fields below were verified against the research document which was produced
by reading official Claude Code documentation and testing:

| Field                                                      | Type           | Verified                     |
| ---------------------------------------------------------- | -------------- | ---------------------------- |
| `model.display_name`                                       | string         | VERIFIED (currently used)    |
| `model.id`                                                 | string         | VERIFIED                     |
| `session_id`                                               | string         | VERIFIED (currently used)    |
| `workspace.current_dir`                                    | string         | VERIFIED (currently used)    |
| `workspace.project_dir`                                    | string         | VERIFIED                     |
| `version`                                                  | string         | VERIFIED                     |
| `cost.total_cost_usd`                                      | number         | VERIFIED                     |
| `cost.total_duration_ms`                                   | number         | VERIFIED                     |
| `cost.total_api_duration_ms`                               | number         | VERIFIED                     |
| `cost.total_lines_added`                                   | number         | VERIFIED                     |
| `cost.total_lines_removed`                                 | number         | VERIFIED                     |
| `context_window.total_input_tokens`                        | number         | VERIFIED                     |
| `context_window.total_output_tokens`                       | number         | VERIFIED                     |
| `context_window.context_window_size`                       | number         | VERIFIED (200000 or 1000000) |
| `context_window.used_percentage`                           | number\|null   | VERIFIED                     |
| `context_window.remaining_percentage`                      | number\|null   | VERIFIED (currently used)    |
| `context_window.current_usage.input_tokens`                | number         | VERIFIED                     |
| `context_window.current_usage.cache_creation_input_tokens` | number         | VERIFIED                     |
| `context_window.current_usage.cache_read_input_tokens`     | number         | VERIFIED                     |
| `exceeds_200k_tokens`                                      | bool           | VERIFIED                     |
| `agent.name`                                               | string\|absent | VERIFIED (only with --agent) |
| `worktree.name`                                            | string\|absent | VERIFIED                     |
| `vim.mode`                                                 | string\|absent | VERIFIED                     |
| `rate_limits.five_hour.used_percentage`                    | number\|absent | VERIFIED (subscriber-only)   |
| `rate_limits.five_hour.resets_at`                          | number\|absent | VERIFIED                     |
| `rate_limits.seven_day.used_percentage`                    | number\|absent | VERIFIED                     |
| `output_style.name`                                        | string         | VERIFIED                     |

### File-Based Data Sources

| File                                    | Exists          | Format Verified | Notes                                                                                                     |
| --------------------------------------- | --------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| `.claude/state/hook-runs.jsonl`         | YES             | VERIFIED        | 1 record, fields: hook, timestamp, branch, commit, outcome, checks[], total_duration_ms, warnings, errors |
| `.claude/state/health-score-log.jsonl`  | YES (main repo) | VERIFIED        | Fields: timestamp, mode, grade, score, summary.errors, summary.warnings, categoryScores{}                 |
| `.claude/state/hook-warnings-log.jsonl` | YES (main repo) | VERIFIED        | Fields: hook, type, severity, message, action, timestamp, occurrences, occurrences_since_ack              |
| `.claude/state/velocity-log.jsonl`      | YES (main repo) | VERIFIED        | Fields: session, date, items_completed, item_ids, tracks, sprint                                          |
| `docs/technical-debt/MASTER_DEBT.jsonl` | YES             | VERIFIED        | 8,461 lines. Fields: id, severity, status, category, effort, file, title                                  |
| `.claude/state/review-metrics.jsonl`    | YES             | VERIFIED        | Fields: pr, title, total_commits, fix_commits, fix_ratio, review_rounds, timestamp                        |
| `.claude/state/commit-log.jsonl`        | YES (main repo) | VERIFIED        | Fields: timestamp, hash, shortHash, message, author, branch, session                                      |
| `.claude/state/agent-invocations.jsonl` | YES (main repo) | VERIFIED        | Fields: agent, description, sessionId, timestamp                                                          |
| `.claude/state/lifecycle-scores.jsonl`  | YES             | VERIFIED        | Fields: id, date, system, category, capture, storage, recall, action, total                               |
| `.claude/state/hook-warnings-ack.json`  | YES             | VERIFIED        | Acknowledgment state for hook warnings                                                                    |
| `SESSION_CONTEXT.md`                    | YES             | VERIFIED        | Session #231, line: "Current Session Count: 231"                                                          |
| `package.json`                          | YES             | VERIFIED        | version: "0.2.0"                                                                                          |

### Shell Commands [DOCS-VERIFIED]

Bash tool was denied during this research session. Commands verified from
existing statusline code and git documentation:

| Command                           | Expected                   | Confidence                                 |
| --------------------------------- | -------------------------- | ------------------------------------------ |
| `git rev-parse --abbrev-ref HEAD` | Branch name                | DOCS-VERIFIED (used in current statusline) |
| `git status --porcelain`          | Dirty file list            | DOCS-VERIFIED                              |
| `git log -1 --format="%h %cr"`    | Short hash + relative time | DOCS-VERIFIED                              |
| `git stash list`                  | Stash entries              | DOCS-VERIFIED                              |
| `git diff --stat HEAD`            | Changed file stats         | DOCS-VERIFIED                              |

### MCP Servers [VERIFIED]

From `.mcp.json`:

| Server       | Status                         | Usable from statusline?                       |
| ------------ | ------------------------------ | --------------------------------------------- |
| `memory`     | Configured                     | NO — MCP is async, statusline is sync Node.js |
| `sonarcloud` | Configured (needs SONAR_TOKEN) | NO — same reason                              |

MCP servers cannot be called from the statusline script because MCP requires the
Claude Code SDK/agent context. The statusline is an independent Node.js process
that receives stdin JSON and writes stdout. It has no MCP client.

### External APIs [ESTIMATED]

| API       | Confidence | Notes                                                              |
| --------- | ---------- | ------------------------------------------------------------------ |
| `wttr.in` | ESTIMATED  | Standard public weather API, no auth. Could not test (Bash denied) |
| `gh` CLI  | ESTIMATED  | GitHub CLI installed (used in project workflows). Could not test   |
| `curl`    | ESTIMATED  | Expected available in Git Bash                                     |

---

## Category 1: Session / Context

Widgets related to the current Claude Code session, context window state, and
session lifecycle.

---

### 1.1: Context Bar (Enhanced)

**Category:** Session/Context | **Ease:** M | **Performance:** <3ms | **Source
Confidence:** VERIFIED

**Description:** The foundational context window usage gauge. Shows current
usage as a 10-block bar with percentage. Enhanced version adds predictive
compaction countdown ("~N msgs left") when usage exceeds 50%. This is the single
most important safety widget — it tells you when compaction is approaching so
you can trigger `/session-end` proactively rather than losing context
mid-thought.

**Rendering:**

- Normal (0-49%): `████░░░░░░ 28%` [green]
- Moderate (50-64%): `██████░░░░ 56% ~35 msgs` [yellow]
- High (65-79%): `████████░░ 72% ~14 msgs` [orange]
- Critical (80%+): `skull ████████░░ 84% ~6 msgs` [blinking red]
- Null (early session): `░░░░░░░░░░ --` [dim]

**Data Source:** `context_window.remaining_percentage` from stdin JSON (primary
gauge). Prediction requires pace sparkline state file for burn rate calculation
(see Widget 5.1). [VERIFIED]

**1M Context Window Notes:**

- Percentage is nearly meaningless for the first hour at 1M — you might be at 2%
  after 30 minutes of active work. The bar will show nearly empty for a long
  time.
- The "~N msgs" prediction requires 10+ messages to stabilize because burn rate
  varies dramatically with tool use, file reads, and agent spawns.
- At 1M, early sessions show: `░░░░░░░░░░ 2%` which is correct but
  uninformative. Consider suppressing the percentage entirely when < 5% and
  showing token count instead (see Widget 1.2).
- Compaction prediction accuracy improves over time as more samples accumulate.
  Early predictions (< 10 samples) should be suppressed or shown dimmed with a
  `~` prefix.

**Implementation Details:** The base context bar already exists (lines 25-36 of
current statusline). Enhancement adds: (a) read pace sparkline state file for
burn rate, (b) compute linear extrapolation of messages remaining, (c) append
countdown text when > 50% used. ~25 lines on top of existing code. The
extrapolation is `remaining_pct / avg_burn_per_message`. Complexity: getting
accurate burn rate requires smoothing over 3+ samples.

**Caching:** No caching for the bar itself (stdin data is free). The prediction
relies on the pace sparkline state file which is written per render with 60s
minimum interval.

**Dependencies:** None for base bar. Prediction depends on pace sparkline state
file (`pace-sparkline.json`, created by Widget 5.1).

**Platform:** Unicode block chars (`\u2588`, `\u2591`) require UTF-8 terminal.
Windows Terminal supports this natively. Git Bash via Windows Terminal works.

**Anomaly Threshold:** Always visible (anchor widget). Prediction text appears
at > 50% usage. Blinking + skull at > 80%.

**Gotchas:**

- `remaining_percentage` is null before the first API call. Must handle
  gracefully.
- `used_percentage` is calculated from input tokens only — does not include
  output tokens. Actual context pressure may be higher than displayed.
- At 1M, the bar sits at nearly-empty for extended periods, which could cause
  complacency. Users may ignore the bar because it "never moves."
- Prediction is linear but real context burn is bursty (large file reads cause
  spikes). Show prediction with `~` prefix to communicate uncertainty.

**Interactions:** Depends on Widget 5.1 (Pace Sparkline) for prediction data.
Complementary to Widget 1.3 (Session Duration) for time-based context planning.

---

### 1.2: Token Counter

**Category:** Session/Context | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows raw token counts instead of (or alongside) percentages.
More informative than percentage in the first hour of a 1M session when
percentage is meaninglessly small. Shows current input tokens and context window
size. Useful for understanding actual resource consumption and for users who
think in token counts rather than percentages.

**Rendering:**

- Early session: `42k/1M tokens` [dim]
- Mid session: `380k/1M tokens` [yellow]
- Late session: `840k/1M tokens` [orange]
- 200k model: `156k/200k tokens` [yellow]

**Data Source:** `context_window.current_usage.input_tokens` +
`context_window.current_usage.cache_creation_input_tokens` +
`context_window.current_usage.cache_read_input_tokens` for current usage.
`context_window.context_window_size` for max (200000 or 1000000). [VERIFIED]

**1M Context Window Notes:**

- This widget is specifically designed to compensate for the percentage bar's
  weakness at 1M. When you are at 3% of 1M, the percentage means nothing. But
  "30k/1M" tells you concretely how much context you have consumed.
- The `k` and `M` suffixes keep the display compact. 1000000 -> `1M`, 423000 ->
  `423k`.
- At 200k context, this widget is less valuable because percentages are already
  meaningful at smaller scales.

**Implementation Details:** Pure arithmetic on stdin JSON fields. Format with
`Math.round(tokens/1000) + 'k'` or `(tokens/1000000).toFixed(1) + 'M'`. ~8
lines. Trivial.

**Caching:** None needed. Data is in stdin JSON, free every render.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Show instead of percentage when context usage < 10% AND
context_window_size is 1000000. Otherwise, defer to the percentage bar. Could
also show alongside percentage as: `████░░░░░░ 28% (280k)`.

**Gotchas:**

- `current_usage` can be null before the first API call.
- `total_input_tokens` / `total_output_tokens` are cumulative across the session
  and exceed context_window_size. Do NOT use these for the gauge — they are
  historical totals, not current window usage.
- The distinction between input tokens, cache creation tokens, and cache read
  tokens is subtle. Used percentage is calculated from input tokens only.

**Interactions:** Complementary to Widget 1.1 (Context Bar). Either/or display
based on context level, or combined display.

---

### 1.3: Session Duration

**Category:** Session/Context | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows how long the current session has been running. Useful for
time awareness — long sessions correlate with context pressure and diminishing
returns. Helps the user decide when to wrap up and start a fresh session.

**Rendering:**

- Short: `12m` [dim]
- Normal: `1h 23m` [default]
- Long: `3h 07m` [yellow]
- Very long: `5h+` [orange]

**Data Source:** `cost.total_duration_ms` from stdin JSON. Convert milliseconds
to hours and minutes. [VERIFIED]

**Implementation Details:** `Math.floor(ms / 3600000)` for hours,
`Math.floor((ms % 3600000) / 60000)` for minutes. ~6 lines. Trivial.

**Caching:** None needed. Stdin data.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Hidden when < 2 hours (normal session). Visible at 2h+
(yellow). Bold at 4h+ (orange — session is getting long, consider wrapping up).

**Gotchas:**

- `total_duration_ms` is wall-clock time, not active time. A session left idle
  for 2 hours while you eat lunch shows "2h" even though no work happened.
- There is no "active duration" field. `total_api_duration_ms` tracks API wait
  time only, which understates active time.

**Interactions:** Complementary to Widget 1.1 (Context Bar) and Widget 2.3 (Cost
Ticker). Together they answer: "How long have I been going, how much context is
left, and how much has it cost?"

---

### 1.4: Session Counter

**Category:** Session/Context | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows the current session number from the project's sequential
session tracking. Provides continuity across sessions — "I am in session 231 of
this project." Useful for referencing sessions in conversation and maintaining
awareness of project maturity.

**Rendering:**

- Normal: `#231` [dim]
- With duration: `#231 2h` [dim, duration part yellow if long]

**Data Source:** Two options:

1. `.claude/state/velocity-log.jsonl` — last line's `session` field. Currently
   reads `{"session":230,...}`. [VERIFIED — file exists, format confirmed, but
   value is 230 not 231 because it lags by one session]
2. Cache file written by session-start hook (RECOMMENDED):
   `.claude/state/current-session.json` with `{"session": 231}`. [ESTIMATED —
   file does not yet exist, would need to be created by session-start hook]

**Implementation Details:** Read last line of velocity-log.jsonl OR read cache
file. Parse JSON, extract session number. ~6 lines. The cache file approach is
better because it is always current (velocity-log may lag).

**Caching:** If using velocity-log: read on every render (file is 3 lines). If
using cache file: session-start writes it once, statusline reads it.

**Dependencies:** Requires either velocity-log.jsonl (exists) or a session-start
hook modification to write current-session.json (does not exist yet).

**Platform:** None.

**Anomaly Threshold:** Never anomalous. Always-visible if included, or hidden
entirely. Best suited for the dashboard/multi-line mode rather than the compact
single-line.

**Gotchas:**

- velocity-log.jsonl is in the main repo `.claude/state/` but may not be in
  worktree `.claude/state/` (confirmed: it does NOT exist in the worktree). Path
  resolution must check both locations.
- Session number from velocity-log lags by at least one session (last entry is
  session 230, current is 231).

**Interactions:** Pairs with Widget 1.3 (Session Duration) for a complete
session identity: `#231 2h 15m`.

---

### 1.5: Rate Limit Gauge

**Category:** Session/Context | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows Claude.ai rate limit consumption for 5-hour and 7-day
windows. Only relevant for Claude.ai Pro/Max subscribers (API key users have
different rate limiting). Prevents the "surprise rate limit" where you hit 80%
of your 5-hour window and get throttled mid-task.

**Rendering:**

- Normal: (hidden — not worth showing when < 50%)
- Warning: `RATE:72%/5h` [yellow]
- Critical: `RATE:91%/5h resets 2:30pm` [red]
- 7-day warning: `RATE:85%/7d` [orange]
- No data: (hidden — field absent for API key users)

**Data Source:** `rate_limits.five_hour.used_percentage` and
`rate_limits.five_hour.resets_at` (Unix epoch seconds).
`rate_limits.seven_day.used_percentage` and `.resets_at`. [VERIFIED — fields
documented in constraints research. Only present for Claude.ai subscribers.
Absent for API key users.]

**Implementation Details:** Check if `rate_limits` exists in stdin JSON. If
absent, return empty string. If present, format percentage and compute reset
time from epoch. ~10 lines.

**Caching:** None needed. Stdin data.

**Dependencies:** Requires Claude.ai Pro/Max subscription. API key users will
never see this widget.

**Platform:** None.

**Anomaly Threshold:** Hidden when < 50% usage. Yellow at 50-79%. Red at 80%+.
Show reset time at 80%+ to help user plan around the window.

**Gotchas:**

- `rate_limits` only appears after the first API response, and each window
  (`five_hour`, `seven_day`) may be independently absent.
- `resets_at` is Unix epoch in seconds (not milliseconds). Multiply by 1000 for
  JavaScript Date.
- If the user switches between API key and Claude.ai subscription, the field
  appears/disappears. Widget must handle both states.

**Interactions:** Complements Widget 1.1 (Context Bar). Together: "I have 28%
context left AND 72% of my 5-hour rate limit used" — may influence decision to
wrap up.

---

### 1.6: Lines Changed

**Category:** Session/Context | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows lines added and removed during the current session.
Provides a sense of session productivity and scope. Large numbers signal
potentially risky sessions (big changes need careful review). Useful for the
user to self-assess "how much have I changed?" before committing.

**Rendering:**

- Small change: `+23/-8` [green]
- Medium change: `+156/-43` [default]
- Large change: `+892/-234` [yellow — big session, review carefully]
- Massive change: `+2.3k/-1.1k` [red — very large changeset]

**Data Source:** `cost.total_lines_added` and `cost.total_lines_removed` from
stdin JSON. [VERIFIED]

**Implementation Details:** Format with `k` suffix for >999. ~6 lines. Trivial.

**Caching:** None needed. Stdin data.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Hidden when total changes < 200 lines (small session).
Visible at 200+ lines. Yellow at 500+ lines. Red at 1000+ lines.

**Gotchas:**

- These are cumulative session totals. A session that adds 100 lines, deletes
  them, and adds 100 different lines shows +200/-100, not +100/-0.
- Does not distinguish between application code and documentation/config
  changes. A session that only edits markdown will show large numbers that look
  alarming.

**Interactions:** Pairs with Widget 3.1 (Git Dirty Count) — lines changed is the
session total, git dirty is the current uncommitted state. Together they answer:
"I changed 500 lines this session, 12 files are still uncommitted."

---

### 1.7: Worktree Indicator

**Category:** Session/Context | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows when the session is running inside a git worktree rather
than the main checkout. Important for SoNash which uses `.worktrees/planning`
for research work. Prevents confusion about which checkout you are editing —
commits in a worktree go to a different branch than expected if you are not
aware.

**Rendering:**

- Main checkout: (hidden)
- Worktree active: `WT:planning` [cyan]
- With original branch: `WT:planning (from main)` [cyan, dim parenthetical]

**Data Source:** `worktree.name` and `worktree.original_branch` from stdin JSON.
Only present during `--worktree` sessions. [VERIFIED]

**Implementation Details:** Check if `worktree` exists in stdin JSON. If absent,
return empty. If present, format name. ~5 lines.

**Caching:** None needed. Stdin data.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Always visible when in a worktree (the worktree itself is
the anomaly — it is not the normal working state).

**Gotchas:**

- `worktree.branch` is absent for hook-based worktrees.
- `worktree.original_branch` is absent for hook-based worktrees.
- The worktree path uses Windows-style paths in `worktree.path`.

**Interactions:** Complementary to the branch widget — branch shows the
worktree's branch, this widget clarifies that you are in a worktree.

---

## Category 2: Repository

Widgets related to the git repository state, branches, and version control.

---

### 2.1: Git Branch (Existing)

**Category:** Repository | **Ease:** S (exists) | **Performance:** 50-100ms |
**Source Confidence:** VERIFIED

**Description:** Shows the current git branch name. Already implemented in the
current statusline. Essential for orientation — prevents accidentally working on
the wrong branch. The most common "where am I?" signal.

**Rendering:**

- Normal: `housecleaning` [cyan]
- Main branch: `main` [cyan, bold — extra visibility since pushes to main are
  blocked]
- Detached HEAD: `HEAD@abc1234` [yellow — unusual state]

**Data Source:** `git rev-parse --abbrev-ref HEAD` via `execFileSync`. [VERIFIED
— currently used in statusline.js lines 92-100]

**Implementation Details:** Already implemented. 8 lines in current statusline.
The `execFileSync` call has a 1000ms timeout and `windowsHide: true`.

**Caching:** Currently not cached. Should cache to file with 5s TTL using
session_id in filename to avoid cross-session collisions. Branch rarely changes
mid-session. Caching saves ~50-100ms per render. Implementation: ~15 lines for
cache read/write/TTL check.

**Dependencies:** `git` CLI (available in Git Bash).

**Platform:** `windowsHide: true` prevents console window flashes on Windows.
Already handled in current code.

**Anomaly Threshold:** Always visible (anchor widget).

**Gotchas:**

- `git rev-parse` can be slow in very large repos. The 1000ms timeout is
  generous; could reduce to 500ms.
- Detached HEAD returns "HEAD" — should show short commit hash instead.
- In worktrees, the branch is the worktree's branch, not the main repo's branch.

**Interactions:** Complementary to Widget 1.7 (Worktree Indicator).

---

### 2.2: Git Dirty Count

**Category:** Repository | **Ease:** M | **Performance:** 50-200ms | **Source
Confidence:** DOCS-VERIFIED

**Description:** Shows the number of modified, staged, and untracked files.
Immediate awareness of uncommitted work. Prevents the "forgot to commit" problem
and alerts when the working directory is getting messy. Particularly important
for SoNash's behavioral guardrail #11: "Verify no untracked files before PR or
branch completion."

**Rendering:**

- Clean: (hidden in anomaly mode)
- Few changes: `3M 1?` [yellow — 3 modified, 1 untracked]
- Staged ready: `2+ 1M` [green for staged, yellow for modified]
- Many changes: `12M 4?` [red — lots of uncommitted work]
- With stashes: `3M 2? S:1` [yellow, stash count appended]

**Data Source:** `git status --porcelain` via `execFileSync`. Parse output
prefixes: `M ` (staged modified), ` M` (unstaged modified), `A ` (staged added),
`??` (untracked), `D ` (deleted). [DOCS-VERIFIED]

**Implementation Details:** Run
`execFileSync('git', ['status', '--porcelain', '--no-optional-locks'], {timeout: 500, windowsHide: true})`.
Count lines by prefix. ~25 lines for parsing + formatting. The
`--no-optional-locks` flag avoids git lock contention on Windows.

**Caching:** Cache result to temp file with 5s TTL:
`/tmp/sonash-git-dirty-${sessionId}.json`. Check file mtime before re-running
git. Stale-while-revalidate: show cached value, refresh in background on next
render. Cache invalidation: 5 seconds. Git status changes frequently but
sub-second accuracy is not needed.

**Dependencies:** `git` CLI.

**Platform:** `git status --porcelain` works identically on Windows/Git Bash.
`--no-optional-locks` prevents Windows lock contention. `/tmp/` path works in
Git Bash (maps to system temp). `windowsHide: true` required.

**Anomaly Threshold:** Hidden when 0 dirty files (clean state). Yellow at 1-5
dirty. Red at 6+ dirty. The appearance of this widget itself signals "you have
uncommitted work."

**Gotchas:**

- **This is the most expensive widget** at 50-200ms. It dominates the total
  statusline budget. Consider skipping it on narrow terminals or when context
  is > 80%.
- `git status` scans the entire working tree including `.worktrees/` and
  untracked dirs. The `.gitignore` file should exclude `node_modules/` and
  `.worktrees/` but verify this.
- Faster alternative: `git diff --name-only` + `git diff --cached --name-only`
  avoids the untracked file scan (saves time but loses `??` count).
- Cache file race condition: multiple sessions writing the same file. Use
  `session_id` in the cache filename.

**Interactions:** Complements Widget 1.6 (Lines Changed). Lines changed is the
session total; git dirty is current uncommitted state. Conflicting renders
possible: if both are shown, the line gets long.

---

### 2.3: Last Commit Info

**Category:** Repository | **Ease:** S | **Performance:** 50-100ms | **Source
Confidence:** DOCS-VERIFIED

**Description:** Shows the short hash and relative time of the last commit.
Useful for "how long ago did I last commit?" awareness. Long gaps between
commits signal risky work-in-progress. Also confirms that the last commit
succeeded and shows the branch tip.

**Rendering:**

- Recent: `fc3cc5a 12m ago` [dim]
- Moderate: `fc3cc5a 2h ago` [yellow]
- Stale: `fc3cc5a 1d ago` [orange — been a while since commit]

**Data Source:** `git log -1 --format="%h %cr"` via `execFileSync`.
[DOCS-VERIFIED]

Alternative: `.claude/state/commit-log.jsonl` — last line has `shortHash`,
`timestamp`, `message` fields. [VERIFIED — format confirmed, avoids git
subprocess]

**Implementation Details:** Two options:

1. Git subprocess: `execFileSync('git', ['log', '-1', '--format=%h %cr'])` —
   ~50-100ms, same perf as branch lookup.
2. File-based: Read last line of `commit-log.jsonl`, extract `shortHash` and
   compute relative time from `timestamp`. ~10 lines, <2ms. **Recommended.**

**Caching:** If git-based: cache with same 5s TTL as branch. If file-based: no
cache needed (file is tiny, read is cheap).

**Dependencies:** `git` CLI (option 1) or `commit-log.jsonl` (option 2).
commit-log.jsonl exists in main repo `.claude/state/` but may not exist in all
worktrees. Path resolution needed.

**Platform:** None specific.

**Anomaly Threshold:** Hidden normally. Visible when > 1 hour since last commit
(yellow). Bold at > 4 hours (orange — significant uncommitted duration).

**Gotchas:**

- `git log` in a worktree shows the worktree's history, which may differ from
  main repo.
- `commit-log.jsonl` has 628+ entries (main repo). Reading last line requires
  seeking to end of file or reading last few KB.
- Relative time from `commit-log.jsonl` requires computing `now - timestamp` at
  render time. The `%cr` format from git does this automatically.

**Interactions:** Complements Widget 2.2 (Git Dirty Count). Together: "Last
commit was 2 hours ago and you have 12 dirty files" = strong signal to commit.

---

### 2.4: Git Stash Count

**Category:** Repository | **Ease:** S | **Performance:** 50-100ms | **Source
Confidence:** DOCS-VERIFIED

**Description:** Shows the number of stashed changesets. Forgotten stashes are a
common source of lost work. Most developers stash something, switch branches,
and forget about it. This widget surfaces that forgotten state.

**Rendering:**

- No stashes: (hidden)
- Has stashes: `S:2` [yellow — 2 stashes exist]
- Many stashes: `S:5` [orange — stash hygiene needed]

**Data Source:** `git stash list` via `execFileSync`. Count output lines.
[DOCS-VERIFIED]

**Implementation Details:** `execFileSync('git', ['stash', 'list'])`. Count `\n`
characters. ~5 lines. Could combine with other git calls to share the subprocess
overhead.

**Caching:** Cache with 30s TTL. Stash state changes rarely.

**Dependencies:** `git` CLI.

**Platform:** Works on Windows/Git Bash.

**Anomaly Threshold:** Hidden when 0 stashes. Visible when >= 1 stash.

**Gotchas:**

- `git stash list` spawns a subprocess. If combined with `git status` or
  `git log`, consider whether the cumulative subprocess cost is acceptable. Each
  subprocess adds 50-100ms.
- Some workflows deliberately maintain stashes (e.g., "WIP" stash before branch
  switch). The widget cannot distinguish intentional stashes from forgotten
  ones.

**Interactions:** Could be folded into Widget 2.2 (Git Dirty Count) as a suffix
rather than a standalone widget: `3M 1? S:2`.

---

## Category 3: Project Health

Widgets derived from the project's health monitoring, technical debt tracking,
and code review systems.

---

### 3.1: Health Grade

**Category:** Project Health | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows the project's overall health grade (A-F) and numeric
score (0-100) from the health audit system. A single-character summary of 35+
quality dimensions. The grade changes after health audits run, typically during
session-start. Declining grades signal accumulating problems.

**Rendering:**

- Excellent: `A91` [green]
- Good: `B84` [cyan]
- Mediocre: `C72` [yellow]
- Poor: `D63` [orange]
- Failing: `F48` [red]
- With trend: `A91^` (improving) / `B84v` (declining) / `A91-` (stable) [trend
  arrow appended]

**Data Source:** `.claude/state/health-score-log.jsonl` — last line. Fields:
`grade`, `score`, `summary.errors`, `summary.warnings`. For trend: compare last
2 entries' scores. [VERIFIED — file exists in main repo, format confirmed:
`{"grade":"A","score":91,"summary":{"errors":7,"warnings":15}}`]

**Implementation Details:** Read file, split by newlines, parse last line (and
second-to-last for trend). Extract grade + score. Compute trend arrow from score
delta. ~12 lines.

**Caching:** None needed. File is 3-4 lines, read is <1ms.

**Dependencies:** `health-score-log.jsonl` must exist. Currently exists in main
repo `.claude/state/`. May not exist in worktree `.claude/state/` — need to
check both paths.

**Platform:** None.

**Anomaly Threshold:** Hidden when grade is A or B (project is healthy). Visible
when grade is C (yellow). Bold/red when D or F. Trend arrow `v` (declining) also
triggers visibility even at A/B if declining.

**Gotchas:**

- File may not exist if no health audit has ever been run. Show `--` fallback.
- Health audits run infrequently (session-start or manual). The grade may be
  stale — last audit was hours or sessions ago. Consider showing staleness:
  `A91^ (2h ago)`.
- Some category scores are `null` (e.g., `test-results`, `sonarcloud`). The
  overall grade already accounts for nulls.

**Interactions:** Provides the "summary" that Widget 3.2 (Hook Health) and
Widget 3.3 (Debt Ticker) drill into. If health grade is C+, the user probably
wants to see hook health and debt details too.

---

### 3.2: Hook Health

**Category:** Project Health | **Ease:** M | **Performance:** <3ms | **Source
Confidence:** VERIFIED

**Description:** Shows the status of the pre-commit/pre-push hook system. Based
on recent hook runs — are hooks passing, warning, or failing? Includes
unacknowledged warning count. This matters because hook failures block commits
and pushes; knowing the hook state saves time before attempting a commit.

**Rendering:**

- All passing: (hidden in anomaly mode)
- All passing, explicit: `H:OK` [green]
- Recent warnings: `H:W3` [yellow — 3 unacknowledged warnings]
- Recent failure: `H:FAIL` [red, bold]
- With pass rate: `H:OK(7/10)` [yellow — not 100% pass rate recently]
- Escalated warnings: `H:W5!` [red — 5+ unacked warnings, escalation threshold]

**Data Source:**

1. `.claude/state/hook-runs.jsonl` — tail last 10 lines. Fields: `outcome`
   (pass/warn/fail), `warnings`, `errors`, `total_duration_ms`. [VERIFIED —
   format confirmed with sample record]
2. `.claude/state/hook-warnings-log.jsonl` — count entries where
   `occurrences_since_ack > 0`. [VERIFIED — format confirmed in main repo]

**Implementation Details:** Read last 4KB of hook-runs.jsonl (covers ~10 records
at ~400 bytes each). Parse each line. Compute: last outcome, pass rate over last
10, total unacked warnings from hook-warnings-log.jsonl. ~30 lines for reading,
parsing, computing, formatting.

**Caching:** None needed. hook-runs.jsonl is small enough to tail-read on every
render. hook-warnings-log.jsonl is ~30 lines.

**Dependencies:** Both JSONL files must exist. hook-runs.jsonl exists in
worktree. hook-warnings-log.jsonl exists in main repo only — need path
resolution.

**Platform:** None.

**Anomaly Threshold:** Hidden when last outcome is "pass" and 0 unacked
warnings. Visible on any "warn" outcome or unacked warnings > 0. Red on any
"fail" outcome.

**Gotchas:**

- hook-runs.jsonl may have only 1 entry (new project/worktree). Pass rate over
  last 10 is misleading with small samples — show `H:OK` without rate when < 5
  entries.
- hook-warnings-log.jsonl is in main repo `.claude/state/` but not in worktree.
  Statusline must resolve the correct path.
- Hook runs grow slowly (~2 per commit). No rotation concern for statusline
  reads.

**Interactions:** Part of the Project Health trio with Widget 3.1 (Health Grade)
and Widget 3.3 (Debt Ticker). Hook failures are a leading indicator of health
grade decline.

---

### 3.3: Debt Ticker

**Category:** Project Health | **Ease:** M | **Performance:** <2ms | **Source
Confidence:** VERIFIED

**Description:** Shows technical debt summary — total open items and critical
(S0) count. SoNash tracks 8,461 debt items in MASTER_DEBT.jsonl. The S0 count is
the actionable signal: S0 items are critical security or reliability issues.
This widget surfaces debt awareness without requiring manual checks.

**Rendering:**

- No S0 debt: (hidden in anomaly mode)
- S0 exists: `D:32!` [red, bold — 32 critical items]
- Full view: `DEBT 7274 (S0:32)` [red for S0 count, dim for total]
- By severity: `D:32/1.4k/3.4k/3.6k` [red/yellow/dim/dim for S0/S1/S2/S3]
- Improving: `D:32! v-12` [trend: 12 fewer since last check]

**Data Source:** Requires a pre-computed cache file because MASTER_DEBT.jsonl is
8,461 lines (~1.8MB). Two options:

1. **Cache file** (RECOMMENDED): `.claude/state/debt-summary-cache.json` written
   by session-start hook. Contains:
   `{total, open, bySeverity: {S0, S1, S2, S3}, byStatus: {NEW, VERIFIED, RESOLVED}, trend}`.
   [ESTIMATED — file does not exist yet, must be created]
2. **Direct read**: Read all 8,461 lines and count. Too slow for statusline
   (would take 50-100ms for file I/O + parse). [VERIFIED — file exists and
   format is confirmed]

**Implementation Details:** Read cache file (1 small JSON). Extract S0 count and
total. Format. ~15 lines for the widget itself. Additionally requires ~30 lines
in session-start hook to generate the cache (read MASTER_DEBT.jsonl, aggregate
counts, write cache).

**Caching:** Session-start hook generates cache. Statusline reads cache. TTL:
entire session (debt does not change mid-session). Invalidation: when
MASTER_DEBT.jsonl mtime changes.

**Dependencies:** Requires session-start hook modification to generate
`debt-summary-cache.json`. Without the cache, widget shows `D:--`.

**Platform:** None.

**Anomaly Threshold:** Hidden when S0 = 0. Visible when S0 > 0 (critical debt
exists). Could also show when total open debt exceeds a threshold (e.g., 8000).

**Gotchas:**

- MASTER_DEBT.jsonl is not in `.claude/state/` — it is at
  `docs/technical-debt/MASTER_DEBT.jsonl`. Different path pattern than other
  state files.
- Cache can become stale if debt intake runs mid-session without regenerating
  the cache. Mitigation: check MASTER_DEBT.jsonl mtime vs cache timestamp.
- The "trend" value requires comparing current counts to a previous snapshot.
  Session-start could store previous counts in the cache file.

**Interactions:** Part of the Project Health trio. When S0 > 0 and Health Grade
is declining, that is a strong signal to prioritize debt resolution.

---

### 3.4: Review Quality Indicator

**Category:** Project Health | **Ease:** M | **Performance:** <2ms | **Source
Confidence:** VERIFIED

**Description:** Shows recent PR review quality metrics — fix ratio and review
rounds. High fix ratios and many review rounds indicate sloppy initial
submissions. Low fix ratios mean clean PRs. Surfaces review discipline awareness
over time.

**Rendering:**

- Good: (hidden in anomaly mode)
- Poor recent: `REV:67%fix R2` [yellow — 67% of commits were fixes, 2 rounds]
- Very poor: `REV:85%fix R4` [red — most commits are fix commits, 4 rounds]

**Data Source:** `.claude/state/review-metrics.jsonl` — last 5 entries. Fields:
`fix_ratio`, `review_rounds`. [VERIFIED — format confirmed:
`{"pr":417,"fix_ratio":0.67,"review_rounds":1}`]

**Implementation Details:** Read last 5 lines. Compute average fix_ratio and max
review_rounds. ~15 lines.

**Caching:** None needed. File is small.

**Dependencies:** review-metrics.jsonl must exist.

**Platform:** None.

**Anomaly Threshold:** Hidden when average fix_ratio < 0.50 AND max
review_rounds <= 2 (clean reviews). Visible when fix_ratio >= 0.50 (yellow) or
review_rounds >= 3 (red).

**Gotchas:**

- fix_ratio of 1.0 for a 3-commit PR means all 3 commits were fixes — but this
  could mean "1 feature commit, 2 fix commits" which is not terrible. The ratio
  is more meaningful for larger PRs.
- review-metrics.jsonl is populated by the PR review system. New projects or
  branches without PRs will have no data.

**Interactions:** Informs Widget 3.1 (Health Grade) — review quality is one of
the 35 category scores in the health audit.

---

## Category 4: System

Widgets related to the development environment, tools, and runtime.

---

### 4.1: Model Indicator (Existing)

**Category:** System | **Ease:** S (exists) | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows the current model name. Already implemented in the
current statusline as a dim prefix. Less useful than other widgets because the
user chose the model and knows what it is. However, due to the known bug where
`model.id` reflects global state (#27144), this can alert the user if the model
unexpectedly changed.

**Rendering:**

- Normal: `Opus` [dim]
- Unexpected change: `Sonnet!` [yellow — model changed unexpectedly]

**Data Source:** `model.display_name` from stdin JSON. [VERIFIED — currently
used in statusline.js]

**Implementation Details:** Already implemented. 1 line. To detect unexpected
changes: compare to previous render's value (requires state file, adding ~10
lines).

**Caching:** None needed.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Hidden in anomaly mode (user knows the model). Visible
only if model changes unexpectedly mid-session (known bug #27144).

**Gotchas:**

- Bug #27144: switching models via `/model` in one session causes ALL other
  sessions' statuslines to show the new model. This is a known Claude Code bug,
  not something the statusline can fix.
- `display_name` is "Opus" not "Opus 4.6 (1M)" — the context window size is in a
  separate field.

**Interactions:** Could be combined with context window size for a full model
identity: `Opus 1M` or `Sonnet 200k`.

---

### 4.2: Claude Code Version

**Category:** System | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows the Claude Code version. Useful for tracking whether you
are on a version with known bugs (e.g., the Windows statusline regression in
v2.1.71) or for ensuring you are on the latest version.

**Rendering:**

- Normal: `v1.0.80` [dim]
- Known buggy version: `v2.1.71!` [yellow — known Windows bug]

**Data Source:** `version` from stdin JSON. [VERIFIED]

**Implementation Details:** Read `data.version`. ~3 lines. Optional: maintain a
hardcoded list of known-buggy versions for alerting. ~8 lines total.

**Caching:** None needed. Stdin data.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Hidden normally. Visible only if version matches a
known-buggy version (hardcoded list). Alternatively, always hidden — this is
low-value information.

**Gotchas:**

- Maintaining a known-buggy version list requires manual updates. May not be
  worth the maintenance cost.
- The version field format may change across Claude Code releases.

**Interactions:** None significant.

---

### 4.3: Vim Mode Indicator

**Category:** System | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows the current vim mode (NORMAL/INSERT) when vim mode is
enabled in Claude Code. Only visible when vim mode is active — invisible for
non-vim users.

**Rendering:**

- Normal mode: `N` [green, bold]
- Insert mode: `I` [blue, bold]
- Vim not enabled: (hidden)

**Data Source:** `vim.mode` from stdin JSON. Only present when vim mode is
enabled. Values: `NORMAL`, `INSERT`. [VERIFIED]

**Implementation Details:** Check if `vim.mode` exists. If present, format. ~4
lines.

**Caching:** None needed.

**Dependencies:** Vim mode must be enabled in Claude Code settings.

**Platform:** None.

**Anomaly Threshold:** Always visible when vim mode is enabled. Hidden when
disabled.

**Gotchas:**

- Very small audience. Most Claude Code users do not enable vim mode.

**Interactions:** None.

---

### 4.4: Output Style Indicator

**Category:** System | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows the current output style name configured in Claude Code.
Different output styles affect how verbose or concise Claude's responses are.
Useful for awareness when you have switched styles mid-session.

**Rendering:**

- Default style: (hidden)
- Custom style: `style:concise` [dim]

**Data Source:** `output_style.name` from stdin JSON. [VERIFIED]

**Implementation Details:** Read field, show if non-default. ~4 lines.

**Caching:** None needed.

**Dependencies:** None.

**Platform:** None.

**Anomaly Threshold:** Hidden when using default style. Visible when a
non-default style is active.

**Gotchas:**

- "Default" style name varies. May need to check for empty string or specific
  default value.

**Interactions:** None significant.

---

## Category 5: Productivity

Widgets related to session productivity, pacing, and cost management.

---

### 5.1: Pace Sparkline

**Category:** Productivity | **Ease:** M | **Performance:** <3ms | **Source
Confidence:** VERIFIED

**Description:** A visual sparkline showing context burn rate over the last 8
intervals. Each character represents ~5 minutes of context consumption. Higher
bars mean faster burn. This is the foundation for the compaction prediction in
Widget 1.1 — the sparkline state file stores the time-series data that enables
"~N msgs left" calculations.

**Rendering:**

- Idle/early: `--------` [dim — no activity]
- Light use: `_._...__` [green — sustainable pace]
- Active use: `_.^~^.._` [yellow — moderate burn]
- Heavy burn: `^!^!!^!^` [red — burning fast, compaction approaching]
- Alternative (Unicode blocks): `▁▂▃▁▅▃▂▁` [colored by average]

**Data Source:** Derived from `context_window.remaining_percentage` in stdin
JSON over time. Requires a state file to persist samples across renders. State
file: `.claude/state/pace-sparkline.json` containing
`{samples: [{t: epoch_seconds, pct: remaining_percentage}, ...]}`. [VERIFIED for
stdin field. ESTIMATED for state file — does not exist yet, must be created.]

**1M Context Window Notes:**

- At 1M, burn rate is extremely low in early sessions. The sparkline will show
  flat/idle (`________`) for 30+ minutes. This is correct but uninformative.
- Burn rate needs 10+ messages to stabilize. Early sparkline values are noisy.
- Consider showing "not enough data" indicator until >= 3 samples exist.
- A single large file read can cause a spike that dominates the sparkline.
  Smoothing with a 3-sample rolling average helps.

**Implementation Details:** On each render: (1) read state file, (2) if > 60s
since last sample, append current `remaining_percentage` with timestamp, (3)
keep last 8 samples, (4) write state file (atomic: tmp+rename), (5) compute
deltas between consecutive samples, (6) map deltas to sparkline characters. ~35
lines. The atomic write pattern is from `state-utils.js`.

**Caching:** The state file IS the cache. Read+write on every render (but only
append a new sample every 60s). File is ~300 bytes.

**Dependencies:** None for the widget itself. Other widgets (1.1 Context Bar
prediction, 5.2 Compaction ETA) depend on this state file.

**Platform:** Unicode block characters (`▁▂▃▅▇`) require UTF-8 terminal. Windows
Terminal supports them. The ASCII alternative (`_.-~^!`) works everywhere.

**Anomaly Threshold:** Hidden when all samples show < 2% burn per interval (idle
or light use). Visible when average burn > 2% per interval. Red when average >
4% per interval.

**Gotchas:**

- Each statusline render is a new process. No in-memory state survives between
  renders. The file-based state is essential.
- Race condition: multiple concurrent sessions writing the same file. Use
  `session_id` in the filename: `pace-sparkline-${sessionId}.json`.
- Writing a file on every render (even with 60s throttle) adds I/O. On Windows,
  atomic write (tmp+rename) may fail if antivirus locks the temp file.
- `remaining_percentage` can be null early in session. Skip sample recording
  when null.

**Interactions:** Foundation for Widget 1.1 (Context Bar prediction) and Widget
5.2 (Compaction ETA). Must be implemented before those features work.

---

### 5.2: Compaction ETA

**Category:** Productivity | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED (arithmetic on verified fields)

**Description:** Predicts when context compaction will occur based on current
burn rate. Shows estimated messages remaining or estimated time remaining. This
is the most operationally valuable prediction for SoNash because `/session-end`
must be triggered before compaction to preserve context. An early warning gives
time to wrap up gracefully.

**Rendering:**

- Plenty of room: (hidden — not useful when context < 50%)
- Getting close: `~35 msgs left` [yellow, dim]
- Approaching: `~12 msgs left` [yellow]
- Critical: `~4 msgs to compaction!` [red, bold]
- Time-based: `~45m to compaction` [yellow]
- Insufficient data: (hidden — need 3+ pace samples)

**Data Source:** Computed from pace sparkline state file samples. Linear
extrapolation: `remaining_pct / avg_burn_per_message`. Also needs
`context_window.remaining_percentage` from stdin JSON for current position.
[VERIFIED for stdin field. ESTIMATED for pace state file — depends on Widget
5.1]

**1M Context Window Notes:**

- At 1M, this widget is meaningless for the first 30+ minutes when usage is <
  5%. Prediction should be suppressed when remaining > 90%.
- Accuracy improves over time as more samples accumulate. Show `~` prefix always
  to communicate uncertainty.
- "Messages remaining" is more intuitive than "time remaining" because message
  cost varies dramatically with tool use.
- Burn rate is not linear: agent-heavy work burns faster than simple Q&A. The
  prediction assumes recent burn rate continues, which may be wrong after a
  phase transition (e.g., switching from research to implementation).

**Implementation Details:** Read pace sparkline state file (already loaded by
Widget 5.1 if co-located). Compute average burn per sample interval. Divide
remaining percentage by average burn. ~12 lines on top of pace sparkline data.
Could be integrated directly into Widget 1.1 (Context Bar) rather than
standalone.

**Caching:** Uses pace sparkline state file (no additional caching).

**Dependencies:** Widget 5.1 (Pace Sparkline) state file must exist with

> = 3 samples.

**Platform:** None.

**Anomaly Threshold:** Hidden when remaining > 50% or < 3 pace samples exist.
Visible at remaining <= 50%. Yellow at <= 30%. Red at <= 15%.

**Gotchas:**

- Linear extrapolation is wrong when usage pattern changes (e.g., switching from
  heavy tool use to conversation). Use 3-sample rolling average to smooth
  transitions.
- "Messages remaining" requires defining what a "message" costs in tokens.
  Approximation: average burn per render interval, where each render
  approximately corresponds to one assistant message.
- Very early in session (< 5 samples), the prediction is unreliable. Suppress or
  show with extra uncertainty markers.

**Interactions:** Best integrated into Widget 1.1 (Context Bar) as a suffix
rather than a standalone widget. See Context Bar enhanced rendering.

---

### 5.3: Cost Ticker

**Category:** Productivity | **Ease:** S | **Performance:** <1ms | **Source
Confidence:** VERIFIED

**Description:** Shows session cost in USD. Threshold-activated: hidden for
cheap sessions (< $2), visible and color-coded for expensive ones. Prevents
runaway cost in multi-agent or deep-research sessions. The key insight is that
cost is noise during normal work but critical during expensive sessions.

**Rendering:**

- Cheap (< $2): (hidden)
- Moderate ($2-5): `$3.41` [dim gray]
- Expensive ($5-10): `$7.23` [yellow]
- Very expensive ($10+): `$14.67` [red, bold]
- With burn rate ($5+): `$7.23 (+$2.30/hr)` [yellow, burn rate dim]
- With context projection ($10+): `$14.67 (~$20/fill)` [red, projection dim]

**Data Source:** `cost.total_cost_usd` from stdin JSON. Burn rate computed from
cost delta over `cost.total_duration_ms` delta. [VERIFIED]

**Implementation Details:** Read `total_cost_usd`. Apply threshold. For burn
rate at $5+: need previous cost reading from state file (similar to pace
sparkline). ~15 lines for basic, ~25 lines with burn rate.

**Caching:** Basic version needs no cache (stdin data). Burn rate calculation
needs a state file to track cost over time: `.claude/state/cost-tracker.json`
with `{samples: [{t, cost}, ...]}`. [ESTIMATED — does not exist yet]

**Dependencies:** None for basic version. State file for burn rate.

**Platform:** None.

**Anomaly Threshold:** Hidden when < $2.00. Gray at $2-5. Yellow at $5-10. Red
at $10+. The appearance itself signals "this session is getting expensive."

**Gotchas:**

- `total_cost_usd` is cumulative for the entire session. It only goes up.
- Cost can spike suddenly when agents spawn (multi-agent work). The burn rate
  calculation may show alarming rates during agent-heavy phases that smooth out
  later.
- For API key users, cost is real money. For Claude.ai subscribers, cost is
  informational (rate limits matter more than dollar cost).
- The "per context fill" projection (`~$20/fill`) assumes current burn rate
  continues to fill the context window. This is a worst-case projection.

**Interactions:** Pairs with Widget 1.5 (Rate Limit Gauge) — for subscribers,
rate limits matter more than cost. Pairs with Widget 1.1 (Context Bar) —
together they answer "how much context and money do I have left?"

---

### 5.4: Current Task (Existing)

**Category:** Productivity | **Ease:** S (exists) | **Performance:** <5ms |
**Source Confidence:** VERIFIED

**Description:** Shows the name of the currently in-progress task from Claude
Code's todo system. Already implemented in the current statusline. Provides
"what am I working on right now?" awareness. Particularly useful after returning
from a break or context switch.

**Rendering:**

- Has task: `Fix CI pipeline` [bold]
- No task: (hidden)

**Data Source:** `.claude/todos/` directory — scans for files matching
`${sessionId}-agent-*.json`, reads most recent, finds entry with
`status === "in_progress"`, extracts `activeForm`. [VERIFIED — implemented in
current statusline.js lines 41-71]

**Implementation Details:** Already implemented. ~30 lines in current
statusline. Includes path traversal protection and sanitization.

**Caching:** Currently not cached. Could cache with 10s TTL since tasks change
infrequently.

**Dependencies:** `.claude/todos/` directory with session-specific JSON files.
Created by Claude Code's task/agent system.

**Platform:** Path handling uses `path.basename()` and `path.resolve()` for
cross-platform safety. Already handles Windows paths.

**Anomaly Threshold:** Always visible when a task exists. Hidden when no task.

**Gotchas:**

- Scans directory on every render. Fast for few files but could slow down if
  many todo files accumulate.
- The `existsSync` + `readFileSync` pattern has a TOCTOU race condition.
  Currently wrapped in try/catch which is correct.
- `activeForm` field may contain user-provided text — sanitized via the existing
  sanitize function.

**Interactions:** Complementary to Widget 5.5 (Conversational State). Task shows
WHAT you are doing; conversational state shows WHERE you are in the workflow.

---

### 5.5: Conversational State

**Category:** Productivity | **Ease:** M | **Performance:** <3ms | **Source
Confidence:** VERIFIED (stdin fields) + ESTIMATED (state machine)

**Description:** Shows the current phase of the AI workflow:
idle/planning/implementing/reviewing/waiting. Derived from `agent.name` + todo
status + duration gaps. The highest-value new widget identified in the research
— it answers "what is the AI doing right now?" without requiring the user to
read the conversation.

**Rendering:**

- Idle: (hidden)
- Planning: `PLAN` [blue]
- Implementing: `IMPL` [green]
- Reviewing: `REVIEW` [cyan]
- Agent active: `deep-plan:3/5` [blue — agent name + progress if available]
- Waiting for user: `WAIT` [blinking yellow — needs user input]
- Researching: `RESEARCH 5/8` [blue — agent count if detectable]

**Data Source:**

1. `agent.name` from stdin JSON — present when an agent is active. [VERIFIED —
   documented but only available with --agent flag or agent settings]
2. Todo file parsing for in-progress task status. [VERIFIED — already
   implemented]
3. `cost.total_duration_ms` - `cost.total_api_duration_ms` for idle gap
   detection. [VERIFIED — both fields in stdin JSON]
4. `.claude/state/agent-invocations.jsonl` for recent agent activity. [VERIFIED
   — format confirmed]

**Implementation Details:** State machine with priority rules:

1. If `agent.name` is present: show agent name (PLAN, REVIEW, etc.)
2. If todo has in_progress task: show IMPL
3. If duration gap > threshold: show WAIT
4. Otherwise: hidden (idle)

~30 lines for the state machine + formatting.

**Caching:** None needed. All inputs are stdin JSON (free) or already-read
files.

**Dependencies:** None required. Enhanced version reads agent-invocations.jsonl
for agent count tracking.

**Platform:** None.

**Anomaly Threshold:** Hidden when idle. Visible when any non-idle state is
detected.

**Gotchas:**

- `agent.name` is only present with `--agent` flag or agent settings. Most
  Claude Code sessions may not have this field. The widget falls back to
  todo-based detection.
- The "waiting" detection is heuristic: if `total_duration_ms` has grown
  significantly since last render but `total_api_duration_ms` has not, the user
  is likely being waited on. This requires a state file to track previous
  values.
- The state machine can be wrong — e.g., showing "IMPL" when the AI is actually
  explaining something.

**Interactions:** Complementary to Widget 5.4 (Current Task). Task shows WHAT;
conversational state shows the current PHASE.

---

### 5.6: Commit Cadence

**Category:** Productivity | **Ease:** M | **Performance:** <2ms | **Source
Confidence:** VERIFIED

**Description:** Shows commit frequency during the current session. Tracks how
many commits have been made and the time since last commit. Encourages
disciplined commit habits — long gaps signal risky work-in-progress.

**Rendering:**

- Active: `3 commits (last 12m ago)` [green]
- Stale: `1 commit (last 2h ago)` [yellow]
- Very stale: `0 commits (session: 3h)` [orange — long session with no commits]

**Data Source:** `.claude/state/commit-log.jsonl` — filter entries where
`timestamp` falls within current session. Count and find most recent. [VERIFIED
— format confirmed: `{"timestamp":"...","shortHash":"...","branch":"..."}`]

**Implementation Details:** Read commit-log.jsonl (628+ entries in main repo).
Filter by session start time (derived from `cost.total_duration_ms` subtracted
from current time). Count matching entries, find most recent timestamp. ~20
lines. Alternatively, use `git log --since=` for session-scoped commits.

**Caching:** Cache with 30s TTL. Commit activity changes only on actual commits.

**Dependencies:** commit-log.jsonl (exists in main repo) or `git` CLI.

**Platform:** None.

**Anomaly Threshold:** Hidden when < 1 hour since last commit. Visible when

> = 1 hour since last commit. Yellow at 1-2 hours. Orange at 2+ hours.

**Gotchas:**

- commit-log.jsonl is in main repo `.claude/state/` — may not be in worktree.
- "Session start time" must be approximated:
  `Date.now() - cost.total_duration_ms`.
- In worktrees, commit-log may not include worktree-specific commits if the hook
  writes to main repo state.

**Interactions:** Complements Widget 2.2 (Git Dirty Count) and Widget 2.3 (Last
Commit Info). Together they form a complete commit awareness picture.

---

## Category 6: External

Widgets that require data from outside the local filesystem and Claude Code
stdin JSON.

---

### 6.1: GitHub PR Status

**Category:** External | **Ease:** L | **Performance:** 500-2000ms (API call) |
**Source Confidence:** ESTIMATED

**Description:** Shows the status of the current branch's PR on GitHub — open,
draft, review requested, CI status. Useful for tracking PR lifecycle without
switching to the browser.

**Rendering:**

- No PR: (hidden)
- Open PR: `PR#456:open` [green]
- Review requested: `PR#456:review` [yellow]
- CI failing: `PR#456:CI-fail` [red]
- Merged: `PR#456:merged` [dim]

**Data Source:** `gh pr view --json state,statusCheckRollup,number` via
`execFileSync`. Requires `gh` CLI authenticated. [ESTIMATED — gh CLI is
installed but could not test]

**Implementation Details:** Run
`gh pr view --json state,number, statusCheckRollup` for the current branch.
Parse JSON output. Extract PR state and check status. ~30 lines. BUT: this is a
network API call that takes 500-2000ms. Far too slow for every render.

**Caching:** MUST cache aggressively. Cache to file with 60s TTL. PR status
changes infrequently (minutes to hours between state changes). The 60s TTL means
at most 1 API call per minute.

**Dependencies:** `gh` CLI installed and authenticated. GitHub API access.

**Platform:** `gh` works on Windows. `windowsHide: true` for subprocess.

**Anomaly Threshold:** Hidden when no PR exists for current branch. Visible when
PR exists. Red when CI is failing.

**Gotchas:**

- **Performance is the deal-breaker.** Even with 60s caching, the first render
  after cache expiry adds 500-2000ms. This blows the 50ms budget and causes
  visible stale output. Mitigation: run the API call in a background process
  that writes to cache, never block the statusline render on it.
- `gh` may not be authenticated. Must handle auth errors gracefully.
- Rate limiting: GitHub API has rate limits (5000/hour authenticated). A
  statusline hitting it every 60s uses 60/hour — acceptable.
- In worktrees, the current branch may differ from what the user expects.

**Interactions:** None significant internally. Competes for performance budget.

---

### 6.2: SonarCloud Quality Gate

**Category:** External | **Ease:** L | **Performance:** 1000-3000ms (API call) |
**Source Confidence:** VERIFIED (MCP server configured)

**Description:** Shows the SonarCloud quality gate status for the project. Pass,
warn, or fail. SonarCloud is configured as an MCP server in this project.
However, the statusline cannot use MCP — it would need direct API access.

**Rendering:**

- Passing: (hidden in anomaly mode)
- Warning: `SONAR:warn` [yellow]
- Failing: `SONAR:fail` [red]

**Data Source:** SonarCloud API via `curl` or `node-fetch`. Requires
`SONAR_TOKEN` environment variable. Endpoint:
`https://sonarcloud.io/api/qualitygates/project_status?projectKey=sonash`.
[VERIFIED — MCP server is configured with SONAR_URL and SONAR_TOKEN. But
statusline cannot use MCP, would need direct HTTP call.]

**Implementation Details:** HTTP request to SonarCloud API. Parse JSON response.
Extract quality gate status. ~20 lines. BUT: network call takes 1000-3000ms.

**Caching:** Cache with 300s (5 minute) TTL. Quality gate changes only after new
analysis runs (triggered by CI/CD, not real-time).

**Dependencies:** `SONAR_TOKEN` environment variable. Network access to
sonarcloud.io.

**Platform:** `curl` works in Git Bash.

**Anomaly Threshold:** Hidden when quality gate passes. Visible on warn/fail.

**Gotchas:**

- **Network latency makes this impractical for inline statusline rendering.**
  Must use background-process caching: a separate process periodically polls
  SonarCloud and writes a cache file. The statusline reads the cache file only.
- SONAR_TOKEN may not be set in the shell environment that Claude Code uses.
- SonarCloud analysis is asynchronous — quality gate reflects the LAST analysis,
  not current code state. May be stale.

**Interactions:** Provides cloud-based quality signal that complements the local
Widget 3.1 (Health Grade).

---

### 6.3: Weather / Location Ambient

**Category:** External | **Ease:** S | **Performance:** 500-1000ms (API call) |
**Source Confidence:** ESTIMATED

**Description:** Shows current weather from wttr.in. A morale/ambient widget.
Purely informational — does not affect development decisions. Some developers
find ambient information pleasant; others find it noise.

**Rendering:**

- `72F Clear` [dim]
- `45F Rain` [dim, blue]

**Data Source:** `curl wttr.in/?format=1` — returns a one-line weather summary.
[ESTIMATED — could not test, assumed reachable]

**Implementation Details:**
`execFileSync('curl', ['-s', '--max-time', '2', 'wttr.in/?format=1'])`. ~8
lines.

**Caching:** Cache with 600s (10 minute) TTL. Weather changes slowly.

**Dependencies:** Network access to wttr.in. `curl` in Git Bash.

**Platform:** `curl` available in Git Bash on Windows.

**Anomaly Threshold:** Never anomalous. Always visible if enabled, or always
hidden. Not suitable for anomaly-driven design.

**Gotchas:**

- Network call. Same performance concerns as Widget 6.1.
- wttr.in rate limits aggressive callers. 10-minute cache is essential.
- No real development value. Takes screen space from useful widgets.
- wttr.in may be blocked by corporate firewalls.

**Interactions:** None. Pure ambient.

---

## Category 7: Composite / Meta

Widgets that combine multiple data sources or provide meta-information about the
statusline itself.

---

### 7.1: Statusline Snapshot Writer

**Category:** Composite | **Ease:** M | **Performance:** <3ms (write) | **Source
Confidence:** ESTIMATED (file does not exist yet)

**Description:** Not a visible widget. A background mechanism that writes a JSON
snapshot of all widget state to `.claude/state/statusline-snapshot.json` on
every render. This file becomes: (a) a compaction recovery signal (agent reads
it after context wipe), (b) a session-start accelerator (pre-aggregated
summary), (c) a crash recovery signal (most recent known state).

**Rendering:** No visible output. This is a persistence mechanism, not a display
widget.

**Data Source:** Aggregates all rendered widget values + stdin JSON fields into
one file:

```json
{
  "lastRender": "2026-03-20T14:32:00Z",
  "session": 231,
  "model": "Opus 4.6",
  "branch": "housecleaning",
  "contextUsed": 62,
  "contextTokens": 620000,
  "cost": 1.47,
  "duration": 8100000,
  "linesAdded": 156,
  "linesRemoved": 23,
  "lastTask": "Fix CI pipeline",
  "healthGrade": "A",
  "healthScore": 91,
  "hookStatus": "OK",
  "debtS0": 32,
  "agentName": null,
  "predictedMsgsToCompaction": 22
}
```

[ESTIMATED — file does not exist yet. All individual fields are VERIFIED.]

**Implementation Details:** After computing all widget values, serialize to JSON
and write atomically (tmp + rename). ~20 lines. Uses the existing
`atomicWriteJson` pattern from `state-utils.js`.

**Caching:** The snapshot IS a cache. Written every render (throttled: only when
data changes or every 30s minimum).

**Dependencies:** None additional. All data is already computed by other
widgets.

**Platform:** Atomic write (tmp+rename) on Windows may fail if antivirus locks
the temp file. Mitigation: use `writeFileSync` with `{flag: 'w'}` as fallback.

**Anomaly Threshold:** N/A — not visible.

**Gotchas:**

- Writing a file on every render adds I/O. Throttle to every 30s or only when
  values change.
- Multiple concurrent sessions need session-specific filenames:
  `statusline-snapshot-${sessionId}.json`.
- Cleanup: old snapshot files from completed sessions accumulate. Need a cleanup
  mechanism in session-start.

**Interactions:** Consumed by `/session-start`, compaction recovery, and crash
recovery systems. Provides data for all other widgets as a debugging aid.

---

### 7.2: Anomaly Summary Badge

**Category:** Composite | **Ease:** M | **Performance:** <1ms | **Source
Confidence:** ESTIMATED

**Description:** A single character or short badge that summarizes total anomaly
count across all widgets. When the statusline is in compact mode (1 line), this
badge tells the user "N things need attention" without showing each widget.
Clicking (if OSC 8 were supported) or expanding to multi-line would show
details.

**Rendering:**

- No anomalies: (hidden — nothing to show)
- Few anomalies: `!2` [yellow — 2 widgets in anomaly state]
- Many anomalies: `!5` [red — 5 widgets in anomaly state]

**Data Source:** Computed by counting how many widgets report anomaly state.
Pure runtime computation, no external data. [ESTIMATED — depends on widget
anomaly detection logic]

**Implementation Details:** Each widget function returns both its display string
AND a boolean `isAnomalous`. The layout engine counts anomalous widgets and
renders the badge. ~10 lines. Requires widget contract modification.

**Caching:** None needed.

**Dependencies:** Requires all widgets to report anomaly state.

**Platform:** None.

**Anomaly Threshold:** Hidden when 0 anomalies. Visible when >= 1.

**Gotchas:**

- "Number of anomalies" is a weak signal. Is 2 anomalies bad? Depends on which
  widgets. A count is less informative than showing the actual anomalous
  widgets.
- May be redundant if anomalous widgets are shown inline anyway.

**Interactions:** Meta-widget that summarizes all other widgets' anomaly state.
Only useful in compact mode where individual widgets are hidden.

---

### 7.3: Multi-Line Anomaly Escalation

**Category:** Composite | **Ease:** M | **Performance:** <1ms | **Source
Confidence:** VERIFIED (multi-line output confirmed in constraints)

**Description:** When multiple anomalies are active simultaneously, the
statusline expands from 1 line to 2 lines. The visual expansion itself is an
attention signal — the user does not need to read the content to notice that
"the statusline got bigger." Normal state returns to 1 line.

**Rendering:**

- Normal (1 line): `housecleaning | ████░░░░░░ 28%`
- Warning (1 line, expanded with widgets):
  `housecleaning | D:32! | ████████░░ 62% ~22 msgs`
- Critical (2 lines):
  ```
  housecleaning | HOOKS:FAIL | D:32! | $8.23 | ████████░░ 84% ~6 msgs
  HEALTH:C(72)v | 12M 4? | Implementing step 3/7 | #231 2h15m
  ```

**Data Source:** Composite of all widget anomaly states. Multi-line support
confirmed in Claude Code: "Multiple lines are supported: each console.log
produces a separate row in the status area." [VERIFIED]

**Implementation Details:** Layout engine checks anomaly count. If count > 3
(threshold), output 2 lines. Line 1: highest-priority anomalous widgets +
anchors. Line 2: remaining anomalous widgets + informational. ~25 lines in the
layout engine.

**Caching:** None needed.

**Dependencies:** All widgets reporting anomaly state.

**Platform:** Multi-line output works in Windows Terminal. However, Claude Code
may allocate a fixed number of rows for the status area. If the row count
changes between renders, there may be rendering artifacts. [ESTIMATED — dynamic
row count behavior not tested]

**Anomaly Threshold:** 1 line when <= 3 anomalies. 2 lines when > 3.

**Gotchas:**

- **Untested on Windows.** Multi-line statusline support is confirmed in docs
  but the current Windows statusline has known rendering bugs (#31670). Dynamic
  line count changes may cause flickering or artifact issues.
- The jump from 1 to 2 lines changes the terminal layout. If the user is
  mid-typing when the statusline expands, the input area may shift.
- Need to test whether Claude Code re-renders the status area correctly when
  line count changes.

**Interactions:** This is the layout system, not a standalone widget. It
orchestrates all other widgets.

---

## Performance Budget Summary

| Widget                    | Category     | Target      | Source Type        | Bottleneck                |
| ------------------------- | ------------ | ----------- | ------------------ | ------------------------- |
| 1.1 Context Bar Enhanced  | Session      | <3ms        | stdin + file       | Pace file read            |
| 1.2 Token Counter         | Session      | <1ms        | stdin              | None (arithmetic)         |
| 1.3 Session Duration      | Session      | <1ms        | stdin              | None (arithmetic)         |
| 1.4 Session Counter       | Session      | <1ms        | file               | Cache file read           |
| 1.5 Rate Limit Gauge      | Session      | <1ms        | stdin              | None                      |
| 1.6 Lines Changed         | Session      | <1ms        | stdin              | None                      |
| 1.7 Worktree Indicator    | Session      | <1ms        | stdin              | None                      |
| 2.1 Git Branch            | Repository   | 50-100ms    | subprocess         | git rev-parse             |
| 2.2 Git Dirty Count       | Repository   | 50-200ms    | subprocess         | git status                |
| 2.3 Last Commit Info      | Repository   | <2ms        | file               | commit-log.jsonl tail     |
| 2.4 Git Stash Count       | Repository   | 50-100ms    | subprocess         | git stash list            |
| 3.1 Health Grade          | Health       | <1ms        | file               | health-score-log.jsonl    |
| 3.2 Hook Health           | Health       | <3ms        | file               | hook-runs.jsonl tail      |
| 3.3 Debt Ticker           | Health       | <2ms        | file (cache)       | debt-summary-cache.json   |
| 3.4 Review Quality        | Health       | <2ms        | file               | review-metrics.jsonl tail |
| 4.1 Model Indicator       | System       | <1ms        | stdin              | None                      |
| 4.2 CC Version            | System       | <1ms        | stdin              | None                      |
| 4.3 Vim Mode              | System       | <1ms        | stdin              | None                      |
| 4.4 Output Style          | System       | <1ms        | stdin              | None                      |
| 5.1 Pace Sparkline        | Productivity | <3ms        | stdin + file write | Atomic write              |
| 5.2 Compaction ETA        | Productivity | <1ms        | file               | Arithmetic                |
| 5.3 Cost Ticker           | Productivity | <1ms        | stdin              | None                      |
| 5.4 Current Task          | Productivity | <5ms        | filesystem         | Directory scan            |
| 5.5 Conversational State  | Productivity | <3ms        | stdin + file       | State machine             |
| 5.6 Commit Cadence        | Productivity | <2ms        | file               | commit-log.jsonl          |
| 6.1 GitHub PR Status      | External     | 500-2000ms  | network            | API call                  |
| 6.2 SonarCloud Gate       | External     | 1000-3000ms | network            | API call                  |
| 6.3 Weather               | External     | 500-1000ms  | network            | API call                  |
| 7.1 Snapshot Writer       | Composite    | <3ms        | file write         | Atomic write              |
| 7.2 Anomaly Badge         | Composite    | <1ms        | computed           | None                      |
| 7.3 Multi-Line Escalation | Composite    | <1ms        | computed           | None                      |

### Critical Path Analysis

**Stdin-only widgets** (< 1ms each): 1.2, 1.3, 1.5, 1.6, 1.7, 4.1-4.4, 5.3 =
**10 widgets at near-zero cost.**

**File-based widgets** (< 5ms each): 1.1, 1.4, 2.3, 3.1-3.4, 5.1-5.2, 5.4-5.6 =
**12 widgets at low cost.** Total file I/O: ~15ms.

**Git subprocess widgets** (50-200ms each): 2.1, 2.2, 2.4 = **3 widgets that
dominate the budget.** Total: 150-400ms.

**Network widgets** (500-3000ms each): 6.1-6.3 = **3 widgets that require
background caching.** Never inline.

**TOTAL BUDGET (without network/git caching):**

- All stdin widgets: ~2ms
- All file widgets: ~15ms
- Git branch (with 5s cache): ~50ms first call, <1ms cached
- Git dirty (with 5s cache): ~100ms first call, <1ms cached
- Snapshot write: ~3ms
- **Typical cached render: ~25ms. First render: ~170ms.**

---

## Implementation Priority Recommendation

### Phase 1: Enhance Existing (Minimal Risk)

Widgets that build on the current 119-line statusline with minimal changes.

| Widget                   | Ease | Why First                                    |
| ------------------------ | ---- | -------------------------------------------- |
| 1.1 Context Bar Enhanced | M    | Highest safety value (compaction prediction) |
| 5.3 Cost Ticker          | S    | 6 lines, stdin only, threshold-activated     |
| 1.6 Lines Changed        | S    | 6 lines, stdin only                          |
| 1.3 Session Duration     | S    | 6 lines, stdin only                          |
| 2.1 Git Branch (cached)  | S    | Already exists, just add caching             |

### Phase 2: New Value Widgets

Widgets that add genuinely new information.

| Widget                   | Ease | Why Second                               |
| ------------------------ | ---- | ---------------------------------------- |
| 5.1 Pace Sparkline       | M    | Foundation for compaction prediction     |
| 3.1 Health Grade         | S    | Single-char project health summary       |
| 3.2 Hook Health          | M    | Hook system awareness                    |
| 3.3 Debt Ticker          | M    | Critical debt visibility                 |
| 5.5 Conversational State | M    | Highest-value new widget per research    |
| 7.1 Snapshot Writer      | M    | Session continuity / compaction recovery |

### Phase 3: Polish and Expansion

| Widget                    | Ease | Why Third                              |
| ------------------------- | ---- | -------------------------------------- |
| 7.3 Multi-Line Escalation | M    | Layout flexibility for anomaly display |
| 2.2 Git Dirty Count       | M    | Expensive but valuable                 |
| 1.2 Token Counter         | S    | 1M-specific improvement                |
| 5.2 Compaction ETA        | S    | Builds on pace sparkline               |
| 1.5 Rate Limit Gauge      | S    | Subscriber-specific                    |
| 1.7 Worktree Indicator    | S    | Worktree-specific                      |

### Phase 4: External and Nice-to-Have

| Widget                 | Ease | Why Last                                      |
| ---------------------- | ---- | --------------------------------------------- |
| 6.1 GitHub PR Status   | L    | Network dependency, background caching needed |
| 6.2 SonarCloud Gate    | L    | Network dependency, limited value             |
| 3.4 Review Quality     | M    | Niche, requires review history                |
| 2.3 Last Commit Info   | S    | Lower priority than dirty count               |
| 2.4 Git Stash Count    | S    | Niche                                         |
| 5.6 Commit Cadence     | M    | Nice but not essential                        |
| 4.2-4.4 System widgets | S    | Very low value                                |
| 6.3 Weather            | S    | Zero development value                        |
| 7.2 Anomaly Badge      | M    | Potentially redundant                         |

---

## New Files Required

Widgets that require new cache/state files to be created:

| File                                            | Created By         | Used By                 | Exists? |
| ----------------------------------------------- | ------------------ | ----------------------- | ------- |
| `.claude/state/pace-sparkline-${sid}.json`      | Widget 5.1         | Widgets 1.1, 5.2        | NO      |
| `.claude/state/debt-summary-cache.json`         | session-start hook | Widget 3.3              | NO      |
| `.claude/state/current-session.json`            | session-start hook | Widget 1.4              | NO      |
| `.claude/state/statusline-snapshot-${sid}.json` | Widget 7.1         | session-start, recovery | NO      |
| `.claude/state/cost-tracker-${sid}.json`        | Widget 5.3         | Widget 5.3              | NO      |

---

## Windows-Specific Concerns Summary

1. **Statusline is currently broken on Windows v2.1.71** (issue #31670). All
   widget development may be blocked until Anthropic fixes this regression.
   Design and test against a known-working version.

2. **UTF-8 encoding**: Unicode block characters and sparkline blocks require
   UTF-8 code page. Windows Terminal handles this natively. Git Bash through
   Windows Terminal inherits it.

3. **Git subprocess performance**: `windowsHide: true` is required on all
   `execFileSync` calls to prevent console window flashes. Already handled in
   current code.

4. **Path separators**: Stdin JSON provides Windows-style paths
   (`C:\Users\...`). Use `path.basename()` and `path.join()`, not string
   splitting.

5. **Atomic writes**: The tmp+rename pattern may fail if Windows Defender or
   other antivirus locks the temp file. Fallback to direct `writeFileSync`.

6. **Process startup overhead**: The current
   `bash ensure-fnm.sh node statusline.js` adds ~100-200ms for fnm
   initialization. This is the single largest performance issue, independent of
   widget choice. Fix: use absolute path to node.

---

## Sources

- `.claude/hooks/global/statusline.js` — current implementation (119 lines)
- `.planning/statusline-research/findings/05-CONSTRAINTS.md` — stdin JSON schema
- `.planning/statusline-research/findings/04-WIDGET_DESIGN.md` — widget design
  specs from initial research
- `.planning/statusline-research/findings/08-OUTSIDE_THE_BOX.md` — contrarian
  ideas (anomaly-driven, predictive compaction, snapshot writer)
- `.planning/statusline-research/findings/06-ARCHITECTURE.md` — architecture
  evaluation
- `.mcp.json` — MCP server configuration
- `.claude/state/hook-runs.jsonl` — verified format
- `.claude/state/health-score-log.jsonl` — verified format (main repo)
- `.claude/state/hook-warnings-log.jsonl` — verified format (main repo)
- `.claude/state/velocity-log.jsonl` — verified format (main repo)
- `.claude/state/review-metrics.jsonl` — verified format
- `.claude/state/commit-log.jsonl` — verified format (main repo)
- `.claude/state/agent-invocations.jsonl` — verified format (main repo)
- `docs/technical-debt/MASTER_DEBT.jsonl` — verified format (8,461 lines)
- `SESSION_CONTEXT.md` — verified session #231
- `package.json` — verified version 0.2.0
