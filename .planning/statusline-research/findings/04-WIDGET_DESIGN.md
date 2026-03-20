# 04 - Widget Design Specification

**Document Version**: 1.0 **Last Updated**: 2026-03-20 **Status**: RESEARCH
COMPLETE

---

## Current Baseline

The existing statusline (`/.claude/hooks/global/statusline.js`, 119 lines)
renders:

```
Claude │ housecleaning │ [current task] │ sonash-v0 ████████░░ 72%
model    branch          task (optional)   dir       context bar
```

It reads JSON from stdin with fields: `model.display_name`,
`workspace.current_dir`, `session_id`, `context_window.remaining_percentage`.

**Config**: `.claude/settings.json` line 165-168, invoked via
`bash .claude/hooks/ensure-fnm.sh node .claude/hooks/global/statusline.js`.

---

## Widget 1: Debt Ticker

### Data Source

- **File**: `docs/technical-debt/MASTER_DEBT.jsonl`
- **Size**: 8,461 lines (~1.8 MB estimated)
- **Format**: One JSON object per line with fields: `id`, `severity` (S0-S3),
  `status` (NEW | VERIFIED | RESOLVED | FALSE_POSITIVE), `category`, `effort`

### Current Distribution

| Status         | Count |
| -------------- | ----- |
| NEW            | 2,116 |
| VERIFIED       | 5,158 |
| RESOLVED       | 1,113 |
| FALSE_POSITIVE | 74    |

| Severity | Count |
| -------- | ----- |
| S0       | 32    |
| S1       | 1,357 |
| S2       | 3,433 |
| S3       | 3,639 |

### Parsing Logic

Cannot read 8,461 lines on every render. Two approaches:

**Option A: Pre-computed cache file** (RECOMMENDED)

- A pre-commit hook or `/session-start` writes a summary JSON:
  ```json
  {
    "timestamp": "2026-03-20T12:00:00Z",
    "total": 8461,
    "open": 7274,
    "bySeverity": { "S0": 32, "S1": 1357, "S2": 3433, "S3": 3639 },
    "byStatus": {
      "NEW": 2116,
      "VERIFIED": 5158,
      "RESOLVED": 1113,
      "FALSE_POSITIVE": 74
    },
    "trend": -12
  }
  ```
- Location: `.claude/state/debt-summary-cache.json`
- Statusline reads 1 small file (~200 bytes)

**Option B: Tail-based approximation**

- Read last N lines of MASTER_DEBT to detect recent additions
- Not reliable for counts since items can be scattered through the file

### Caching Strategy

- **Generate**: On session-start hook + after any debt intake command
- **Invalidate**: When `MASTER_DEBT.jsonl` mtime changes (check mtime vs cached
  timestamp)
- **Staleness tolerance**: 1 session (debt doesn't change mid-session)

### Rendering

```
DEBT:32/1.3k/3.4k/3.6k
     S0  S1   S2   S3
```

Compact form (space-constrained):

```
D:32!
```

Shows only S0 count with alert marker when S0 > 0.

Full form:

```
DEBT 7274 (S0:32)
```

Open count + S0 highlight.

**Color coding**:

- S0 count > 0: `\x1b[31m` (red, bold) -- critical debt exists
- S0 = 0, S1 > threshold: `\x1b[33m` (yellow)
- All clean: `\x1b[32m` (green)

### Performance Budget

- Cache read: ~1ms (single small JSON file)
- Mtime check: ~0.5ms
- Total: **<2ms**

### Fallback

If cache file missing: show `DEBT:--` (dimmed). Do not attempt to read
MASTER_DEBT.jsonl inline.

---

## Widget 2: Hook Health

### Data Source

- **File**: `.claude/state/hook-runs.jsonl`
- **Size**: 100 lines (grows ~2 lines per commit: pre-commit + pre-push)
- **Format**: One JSON per run with: `hook`, `timestamp`, `branch`, `commit`,
  `outcome` (pass | warn | fail), `warnings`, `errors`, `total_duration_ms`,
  `checks[]` (each with `id`, `status`, `duration_ms`)

### Parsing Logic

Read the **last 10 lines** (tail) to compute:

- Last outcome: pass/warn/fail
- Recent pass rate: count of `outcome === "pass"` in last 10 runs
- Warning accumulation: sum of `warnings` field across last 10 runs
- Average duration: mean of `total_duration_ms` across last 10

Also check `.claude/state/hook-warnings-log.jsonl` (30 lines) for unacknowledged
warning count.

### Caching Strategy

- **Read**: On every render (file is small, ~100 lines)
- **Optimization**: Only read last 10 lines via negative offset. On Node.js,
  read last 4KB of file (covers ~10 records at ~300 bytes each)
- **Staleness tolerance**: Real-time (file changes with each hook run)

### Rendering

Based on last run outcome + recent trend:

| State                 | Display          | Color                     |
| --------------------- | ---------------- | ------------------------- |
| Last pass, 100% rate  | `HOOKS:OK`       | `\x1b[32m` green          |
| Last pass, <100% rate | `HOOKS:OK(7/10)` | `\x1b[33m` yellow         |
| Last warn             | `HOOKS:WARN(3)`  | `\x1b[33m` yellow         |
| Last fail             | `HOOKS:FAIL`     | `\x1b[31m` red, bold      |
| Unacked warnings > 5  | `HOOKS:WARN(3)!` | `\x1b[31m` red (escalate) |

Compact form: `H:OK` / `H:W3` / `H:FAIL`

### Performance Budget

- Read last 4KB: ~1ms
- Parse 10 JSON lines: ~0.5ms
- Total: **<2ms**

### Fallback

No hook-runs.jsonl: `HOOKS:--`

---

## Widget 3: Health Grade

### Data Source

- **File**: `.claude/state/health-score-log.jsonl`
- **Size**: 4 lines (very small, grows slowly -- one entry per health audit)
- **Format**: One JSON per audit with: `timestamp`, `mode`, `grade` (A/B/C/D/F),
  `score` (0-100), `summary.errors`, `summary.warnings`, `summary.info`,
  `categoryScores` (object with ~35 category keys, each 0-100 or null)

### Current Values

Most recent entry: grade=A, score=91, errors=6, warnings=15

### Parsing Logic

Read **last line only**. Parse JSON. Extract:

- `grade`: Letter grade (A/B/C/D/F)
- `score`: Numeric 0-100
- `summary.errors`: Error count
- `summary.warnings`: Warning count

For trend: compare last 2 entries' scores.

### Caching Strategy

- **Read**: On every render (file is 4 lines, negligible)
- **No cache needed**: Entire file fits in one read

### Rendering

```
HEALTH:A(91)
```

With trend arrow (compare last 2 scores):

```
HEALTH:A(91)^    (improving)
HEALTH:A(91)-    (stable)
HEALTH:B(78)v    (declining)
```

**Color coding**:

- A (90-100): `\x1b[32m` green
- B (80-89): `\x1b[36m` cyan
- C (70-79): `\x1b[33m` yellow
- D (60-69): `\x1b[38;5;208m` orange
- F (<60): `\x1b[31m` red

Compact form: `A91^` (4 chars)

### Performance Budget

- Read file: ~0.5ms
- Parse last line: ~0.2ms
- Total: **<1ms**

### Fallback

No health-score-log.jsonl: `HEALTH:--`

---

## Widget 4: Session Counter

### Data Source

- **Primary**: `SESSION_CONTEXT.md` header line containing session number (e.g.,
  "Session #231")
- **Alternative**: Stdin JSON `session_id` field (format:
  `session-{unix_timestamp_ms}`) -- provides uniqueness but not sequential
  number
- **State file**: `.claude/state/velocity-log.jsonl` (3 lines) has `session`
  field with numeric session ID

### Parsing Logic

**Option A: Read SESSION_CONTEXT.md** (NOT recommended for statusline)

- Requires parsing markdown header for `Session #NNN`
- File is ~300 lines, wasteful for a single number

**Option B: Use velocity-log.jsonl** (RECOMMENDED)

- Read last line, extract `session` field
- Only 3 lines, trivial to read
- Current last entry: `{"session":230,...}`

**Option C: Write session number to cache on session-start**

- session-start hook already reads SESSION_CONTEXT.md
- Could write `.claude/state/current-session.json`:
  `{"session": 231, "started": "2026-03-20T10:00:00Z"}`
- Statusline reads 1 tiny file

**Recommended: Option C** (session-start writes cache, statusline reads it)

### Caching Strategy

- **Generate**: session-start hook writes cache file
- **Lifetime**: Entire session (number doesn't change mid-session)

### Rendering

```
S#231
```

With optional duration (if start time tracked):

```
S#231 (2h)
```

Compact form: `#231` (4 chars)

### Performance Budget

- Read cache file: ~0.5ms
- Total: **<1ms**

### Fallback

No cache: `S#--`

---

## Widget 5: Git Dirty Count

### Data Source

- **Command**: `git status --porcelain`
- **Performance concern**: Can be slow on large repos. This repo has
  `.worktrees/` and `node_modules/` which should be gitignored.

### Parsing Logic

Run `execFileSync('git', ['status', '--porcelain'], ...)` with timeout.

Count lines by prefix:

- `M ` or `MM` = modified (staged)
- ` M` = modified (unstaged)
- `A ` = added (staged)
- `??` = untracked
- `D ` = deleted

Compute:

- `staged`: count of lines with non-space first char (excluding `??`)
- `unstaged`: count of lines with non-space second char
- `untracked`: count of `??` lines

### Caching Strategy

- **NO caching**: Git state changes constantly. Must run live.
- **Performance mitigation**: Use `--porcelain` (minimal output), set timeout to
  500ms (kill if slower)
- **Alternative**: `git diff --stat --cached` for staged-only (faster)

### Rendering

```
GIT:3M 2? 1+
    modified untracked staged
```

Simplified:

```
GIT:6       (total dirty count)
GIT:clean   (nothing dirty)
```

**Color coding**:

- Clean: `\x1b[32m` green
- 1-5 dirty: `\x1b[33m` yellow
- 6+ dirty: `\x1b[31m` red

Compact form: `G:6` / `G:0`

### Performance Budget

- git status: **50-200ms** (EXPENSIVE -- dominates total budget)
- This is the most expensive widget by far
- Consider: show on every Nth render, or only update on git-related tool use

**Mitigation strategies**:

1. Use `git diff --name-only` + `git diff --cached --name-only` instead of full
   `git status` (avoids untracked file scan)
2. Cache for 5 seconds (stale-while-revalidate pattern)
3. Skip entirely when context usage > 80% (save cycles when it matters most)

### Fallback

Timeout or error: `GIT:--`

---

## Widget 6: Pace Sparkline

### Data Source

No direct "tokens per minute" file exists. Possible sources:

1. **Context window burn rate**: Calculated from
   `context_window.remaining_percentage` over time. The statusline receives this
   on every render.
2. **Commit cadence**: From `.claude/state/commit-log.jsonl` (628 lines) --
   count commits per hour
3. **Agent invocations**: From `.claude/state/agent-invocations.jsonl` -- rate
   of agent calls

**Recommended: Context burn rate** -- the statusline already receives
`remaining_percentage` on each render. Track recent values to compute velocity.

### Parsing Logic

Maintain an in-memory ring buffer (since statusline is a new process each
render, this needs file-backed state):

**State file**: `.claude/state/pace-sparkline.json`

```json
{
  "samples": [
    { "t": 1710936000, "pct": 95 },
    { "t": 1710936300, "pct": 92 },
    { "t": 1710936600, "pct": 88 }
  ]
}
```

On each render:

1. Read state file
2. Append current `remaining_percentage` with timestamp
3. Keep last 8 samples (for 8-char sparkline)
4. Write back (atomic write via tmp+rename)
5. Compute deltas between consecutive samples
6. Map deltas to sparkline chars: `_` (no change) to `!` (large burn)

### Caching Strategy

- **Read+write**: Every render (file is tiny, ~200 bytes)
- **Sample interval**: Only record a new sample if >60 seconds since last
  (prevents flooding during rapid renders)

### Rendering

Using Unicode block elements for burn-rate per interval:

```
PACE:_..^!^_.
```

Each char represents one interval (~5 minutes). Higher = faster context burn.

Character set (burn rate mapping):

```
_ = 0%      (idle)
. = 0-1%    (light)
- = 1-2%    (moderate)
~ = 2-3%    (active)
^ = 3-5%    (heavy)
! = 5%+     (rapid burn)
```

Alternative: Unicode sparkline blocks `PACE:▁▂▃▁▅▃▂▁`

**Color coding**:

- Overall green if average burn < 2%/interval
- Yellow if 2-4%/interval
- Red if >4%/interval (burning context fast)

Compact form: `▁▂▃▁▅▃▂▁` (8 chars, no label)

### Performance Budget

- Read state file: ~0.5ms
- Append + write: ~1ms
- Compute sparkline: ~0.1ms
- Total: **<2ms**

### Fallback

No state file or <2 samples: `PACE:--`

---

## Layout and Priority

### Terminal Width Tiers

The statusline must work across terminal widths. The existing statusline already
uses ~60 chars for model+branch+dir+context. Adding 6 widgets requires
responsive layout.

**Measurement**: Each widget at full size vs compact:

| Widget         | Full Width | Compact Width | Priority |
| -------------- | ---------- | ------------- | -------- |
| Context bar    | 18 chars   | 18 chars      | P0       |
| Model          | 12 chars   | 0 chars       | P3       |
| Branch         | ~20 chars  | ~20 chars     | P1       |
| Dir name       | ~12 chars  | 0 chars       | P4       |
| Health Grade   | 14 chars   | 4 chars       | P1       |
| Hook Health    | 14 chars   | 5 chars       | P2       |
| Debt Ticker    | 15 chars   | 4 chars       | P2       |
| Git Dirty      | 10 chars   | 3 chars       | P1       |
| Session        | 5 chars    | 5 chars       | P3       |
| Pace Sparkline | 13 chars   | 8 chars       | P3       |

### Width Tiers

**Tier 1: Wide (>=140 cols)** -- Show everything full-size

```
Claude │ housecleaning │ sonash-v0 │ HEALTH:A(91)^ │ HOOKS:OK │ DEBT 7274(S0:32) │ GIT:3M │ S#231 │ ▁▂▃▁▅▃▂▁ │ ████████░░ 72%
```

**Tier 2: Standard (100-139 cols)** -- Drop model, dir; compact some widgets

```
housecleaning │ A91^ │ H:OK │ D:32! │ G:3 │ #231 │ ▁▂▃▁▅▃▂▁ │ ████████░░ 72%
```

**Tier 3: Narrow (80-99 cols)** -- Priority widgets only

```
housecleaning │ A91^ │ G:3 │ ████████░░ 72%
```

**Tier 4: Minimal (<80 cols)** -- Context bar + branch only

```
housecleaning │ ████████░░ 72%
```

### Priority Order (what survives width cuts)

1. **Context bar** (P0) -- always visible, core safety metric
2. **Branch** (P1) -- essential for orientation
3. **Health Grade** (P1) -- single-char summary of project state
4. **Git Dirty** (P1) -- immediate awareness of uncommitted work
5. **Hook Health** (P2) -- important but less urgent than health grade
6. **Debt Ticker** (P2) -- important but stable (doesn't change mid-session)
7. **Session** (P3) -- nice to have
8. **Pace Sparkline** (P3) -- nice to have, most optional
9. **Model** (P3) -- already known from prompt
10. **Dir name** (P4) -- least useful (user knows where they are)

### Width Detection

```javascript
const cols = process.stdout.columns || 120;
```

### Separator Strategy

Use `\u2502` (thin vertical bar) between widgets, dim color `\x1b[2m`. Each
separator costs 3 chars (space + bar + space).

---

## Implementation Architecture

### File Structure

```
.claude/hooks/global/
  statusline.js           # Main entry point (existing, modify)
  statusline-widgets/     # New directory
    debt-ticker.js        # Widget: debt count
    hook-health.js        # Widget: hook status
    health-grade.js       # Widget: project health
    session-counter.js    # Widget: session number
    git-dirty.js          # Widget: uncommitted files
    pace-sparkline.js     # Widget: context burn rate
    layout.js             # Width-tier logic + assembly
    cache.js              # Shared cache utilities
```

### Shared Utilities (cache.js)

```javascript
// Read last N lines of a JSONL file efficiently
function readTailJsonl(filePath, n) { ... }

// Read JSON cache with mtime validation
function readCacheIfFresh(cachePath, sourcePath) { ... }

// Atomic write (tmp + rename)
function atomicWriteJson(filePath, data) { ... }
```

### Performance Budget Summary

| Widget         | Target | Method               | Bottleneck          |
| -------------- | ------ | -------------------- | ------------------- |
| Debt Ticker    | <2ms   | Cache file read      | Cache miss = skip   |
| Hook Health    | <2ms   | Tail read (last 4KB) | Parse 10 JSON lines |
| Health Grade   | <1ms   | Full file read       | 4-line file         |
| Session        | <1ms   | Cache file read      | Trivial             |
| Git Dirty      | <200ms | execFileSync         | git status latency  |
| Pace Sparkline | <2ms   | Read+write cache     | Atomic write        |
| Layout logic   | <1ms   | Pure computation     | String concat       |
| **TOTAL**      | <210ms | **Git dominates**    | --                  |

### Git Dirty Optimization

Git dirty is the performance outlier. Strategies (pick one):

1. **Run in parallel with other work**: Use `execFile` async, render other
   widgets first, append git result when ready. However, statusline.js writes to
   stdout once -- this requires buffering.

2. **Use `--no-optional-locks` flag**: Prevents git from acquiring optional
   locks, faster on Windows.

   ```javascript
   execFileSync(
     "git",
     [
       "-c",
       "core.preloadIndex=true",
       "status",
       "--porcelain",
       "--no-optional-locks",
     ],
     { timeout: 500 }
   );
   ```

3. **Cache with short TTL**: Write result to `/tmp/sonash-git-dirty-{pid}.json`
   with timestamp. On next render, reuse if <5 seconds old.

4. **Skip on narrow terminals**: If width tier 3 or 4, don't even run git.

**Recommended**: Combine strategies 2 + 3 + 4.

---

## Cache File Inventory

New files created by this system:

| File                                    | Created By     | Read By         | Size  |
| --------------------------------------- | -------------- | --------------- | ----- |
| `.claude/state/debt-summary-cache.json` | session-start  | debt-ticker     | ~200B |
| `.claude/state/current-session.json`    | session-start  | session-counter | ~80B  |
| `.claude/state/pace-sparkline.json`     | pace-sparkline | pace-sparkline  | ~300B |

Existing files read (no new writes needed):

| File                                    | Read By      | Read Strategy   |
| --------------------------------------- | ------------ | --------------- |
| `.claude/state/hook-runs.jsonl`         | hook-health  | Tail last 4KB   |
| `.claude/state/hook-warnings-log.jsonl` | hook-health  | Full (30 lines) |
| `.claude/state/health-score-log.jsonl`  | health-grade | Full (4 lines)  |

---

## Error Handling Contract

Every widget function MUST:

1. Return a string (never throw)
2. Return fallback text on ANY error (file missing, parse failure, timeout)
3. Complete within its time budget (use sync operations with timeouts)
4. Sanitize all output through the existing `sanitize()` function
5. Never call `process.exit()` or throw uncaught exceptions

Pattern:

```javascript
function widgetDebtTicker(stateDir) {
  try {
    // ... read, parse, format
    return formatted;
  } catch {
    return ""; // or 'DEBT:--'
  }
}
```

---

## Open Questions for Implementation

1. **Git dirty widget inclusion**: At 50-200ms it dominates the total budget.
   Should it be included at all, or deferred to a "detailed" mode?

2. **Pace sparkline write frequency**: Writing a file on every statusline render
   could be excessive. Should we limit to 1 write per 60 seconds?

3. **Debt cache generation**: Should the pre-commit hook update the debt cache,
   or only session-start? Pre-commit adds latency to commits but keeps cache
   fresher.

4. **Widget color vs. accessibility**: Should there be a `--no-color` mode for
   terminals that don't support ANSI? The existing statusline assumes color
   support.

5. **Task widget preservation**: The existing `findCurrentTask()` function scans
   `.claude/todos/` directory. Should it be kept as a separate widget or removed
   in favor of the new widgets?
