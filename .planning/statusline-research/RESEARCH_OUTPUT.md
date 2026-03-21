# Statusline Research: Synthesis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** ACTIVE
**Source:** Synthesis of 8 research findings (01-CURRENT_IMPL through 08-OUTSIDE_THE_BOX)
<!-- prettier-ignore-end -->

---

## Executive Summary

Eight research findings were produced: current implementation analysis, external
repo survey, build/adopt/fork decision, widget design, constraints, architecture
options, a contrarian review, and an outside-the-box reframe.

**The contrarian and outside-the-box findings materially changed the
conclusions.** Three HIGH-severity issues were surfaced:

1. The widget lists across findings 03, 04, and 06 are mutually inconsistent --
   three different scopes were being designed for simultaneously.
2. The Windows statusline may be broken upstream (issue #31670, v2.1.71) --
   unverified on our machine, which blocks all implementation.
3. The fnm wrapper adds 100-300ms per render and dominates the performance
   budget, yet the primary findings proposed no fix.

The outside-the-box reframe introduced **anomaly-driven visibility**: the
statusline should be QUIET when everything is fine and NOISY when something
needs attention. This directly addresses CLAUDE.md guardrail #6 ("Unacknowledged
warnings become wallpaper") and transforms the design philosophy from "dashboard
with N permanent widgets" to "minimal baseline + anomaly-triggered expansion."

**Final recommendation:** Enhance the current 119-line monolith with inline
try/catch per widget, anomaly-driven visibility as the layout philosophy, and
predictive compaction as the killer feature. But first, resolve the two
pre-implementation blockers (Windows verification, fnm benchmark).

---

## Pre-Implementation Blockers

These MUST be resolved before any widget development begins. Spending 3+ hours
enhancing a feature that does not render is wasted effort.

### Blocker 1: Verify the statusline renders on our Windows 11 machine

**Source:** Contrarian Challenge 3, Constraints Finding (05) Section 7.

GitHub issue #31670 reports the statusline command is "completely
non-functional" on Windows as of Claude Code v2.1.71 (regression from v2.1.45).
Issue #30725 reports PowerShell statusline stopped rendering in v2.1.68.

**Unresolved question:** Our setup uses Git Bash invocation
(`bash .claude/hooks/ensure-fnm.sh node ...`), not PowerShell. The issue may
only affect PowerShell-based invocations. But this has not been verified.

**Required actions:**

- [ ] Run `claude --version` to confirm our Claude Code version
- [ ] Observe whether the statusline currently renders during a session
- [ ] If broken: check if issue #31670 matches our invocation pattern (Git Bash
      vs PowerShell)
- [ ] If broken: pin to a working version or track the upstream fix; defer all
      enhancement work

### Blocker 2: Benchmark fnm wrapper overhead and eliminate it

**Source:** Contrarian Challenge 4, Current Impl (01) Section 3, Constraints
(05) Section 11.

The current launch chain is: `bash` -> `ensure-fnm.sh` (evals `fnm env`, runs
`fnm use`) -> `node statusline.js` -> `execFileSync("git")`. This creates 4
processes per render. The fnm wrapper alone adds an estimated 100-300ms, which
is the single largest cost in the entire statusline -- larger than all proposed
widgets combined.

Every finding discussed microsecond-level widget optimizations (tail reads,
cache files, mtime checks) while ignoring this 200ms elephant. Fixing fnm
overhead reclaims enough budget for all widgets without any caching.

**Required actions:**

- [ ] Benchmark the current statusline end-to-end (wall clock from invocation to
      stdout), including fnm overhead
- [ ] Benchmark with a direct `node` invocation (absolute path, bypassing
      ensure-fnm.sh) to measure the delta
- [ ] If delta > 100ms: update `settings.json` to use the absolute node path
- [ ] Re-measure to establish the real performance budget for widget expansion

---

## The Canonical Widget List

The contrarian (Challenge 5) identified that three findings proposed three
different widget lists:

| Finding             | Widgets Proposed                                                                   | Character                                     |
| ------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| 04-WIDGET_DESIGN    | Debt ticker, Hook health, Health grade, Session counter, Git dirty, Pace sparkline | SoNash project health (file-heavy, expensive) |
| 03-BUILD_ADOPT_FORK | Cost, Rate limits, Duration, Hook warnings, Commit count, Lines changed            | Session telemetry (stdin-heavy, cheap)        |
| 06-ARCHITECTURE     | Model, Git Branch, Current Task, Context Window, Session Cost, Hook Health         | Existing 5 + 1 new                            |

The outside-the-box reframe (Idea 7) then added a filter: **most of these
widgets are informational, not actionable.** Only widgets that change user
behavior in the next 5 minutes deserve permanent screen space. The rest should
appear only on anomaly.

### Reconciled Canonical List

The list below merges all three sources, applies the actionability filter from
the contrarian and anomaly-driven philosophy from outside-the-box, and resolves
every conflict.

**Tier 1: Always Visible (anchor widgets)**

| #   | Widget                                  | Source                            | Rationale                                                                                              |
| --- | --------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | **Git branch**                          | Existing                          | Orientation -- which branch am I on?                                                                   |
| 2   | **Context bar + predictive compaction** | Existing + Outside-the-box Idea 3 | Safety -- the only widget that reliably drives `/session-end`. Enhanced with "~N msgs left" when >50%. |

**Tier 2: Anomaly-Activated (appear only when thresholds crossed)**

| #   | Widget                   | Data Source                                                           | Anomaly Threshold                                                    | Hidden When                            |
| --- | ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| 3   | **Rate limits**          | `data.rate_limits.five_hour` (stdin JSON)                             | >= 70% of 5-hour limit                                               | < 70%                                  |
| 4   | **Cost**                 | `data.cost.total_cost_usd` (stdin JSON)                               | >= $2.00 (yellow), >= $5.00 with burn rate (orange), >= $10.00 (red) | < $2.00                                |
| 5   | **Hook health**          | `.claude/state/hook-runs.jsonl` (tail 10) + `hook-warnings-log.jsonl` | Any WARN or FAIL in last run, or unacked warnings > 0                | Last run passed AND 0 unacked warnings |
| 6   | **Health grade**         | `.claude/state/health-score-log.jsonl` (last line)                    | Grade C or below (score < 80)                                        | Grade A or B                           |
| 7   | **Debt S0 count**        | `.claude/state/debt-summary-cache.json` (pre-computed)                | S0 > 0                                                               | S0 = 0                                 |
| 8   | **Conversational state** | `data.agent.name` + todo status (stdin JSON, free)                    | Agent active OR waiting state detected                               | Idle with no active agent              |

**Tier 3: Deferred (cut from initial implementation)**

| Widget          | Why Deferred                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git dirty count | Performance destroyer: 50-200ms shell-out doubles git cost. The contrarian correctly identified this as unachievable within budget. Revisit only with a daemon/cache model. |
| Pace sparkline  | Too complex for peripheral vision (contrarian Challenge 6). The predictive compaction extension to the context bar captures the same insight more effectively.              |
| Session counter | Not actionable. No behavior change tied to knowing `S#231`.                                                                                                                 |
| Duration        | Not actionable. Available on demand via `/session-end`.                                                                                                                     |
| Lines changed   | Not actionable. Available in commit summaries.                                                                                                                              |
| Commit count    | Not actionable. Visible in git log.                                                                                                                                         |

### Why this list is correct

1. **Tier 1** (branch + context bar): Survives every width tier. Always needed.
   The predictive compaction enhancement is the single most novel feature -- no
   external tool does this. It turns a passive gauge into an actionable
   countdown.

2. **Tier 2** (anomaly-activated): Each widget has a clear "this changes what I
   do" trigger. Rate limits at 70% -> pace work or switch models. Cost at $5+ ->
   investigate runaway agents. Hook FAIL -> investigate before next commit.
   Health grade C -> something degraded. Debt S0 > 0 -> critical debt exists.
   Conversational state -> awareness of agent activity.

3. **Tier 3** (deferred): Every deferred widget fails the actionability test OR
   the performance budget test. They can be reconsidered when the statusline has
   a caching layer or daemon model.

### Normal vs. Anomaly State

**Normal operation (everything fine) -- 2 widgets:**

```
housecleaning | ████░░░░░░ 28%
```

**Mild anomalies (1 line, expanded) -- up to 6 widgets:**

```
housecleaning | D:32! | $3.41 | 5hr:72% | ████████░░ 62% ~22 msgs
```

**Critical anomalies (2 lines) -- all anomalous widgets shown:**

```
housecleaning | HOOKS:FAIL | D:32! | $8.23(+$2/hr) | ████████░░ 84% ~6 msgs
HEALTH:C(72)v | 5hr:89% resets 2:15pm | Reviewing (code-reviewer)
```

The statusline width itself becomes a signal: a longer line means "pay
attention." A second line means "something is critically wrong." This directly
addresses CLAUDE.md guardrail #6.

---

## Approach: Enhance Current + Anomaly-Driven Visibility

### Build/Adopt/Fork Resolution

**Winner: Enhance current** (Option A from 03-BUILD_ADOPT_FORK), confirmed but
with corrections from the contrarian.

The decision matrix in 03-BUILD_ADOPT_FORK scored enhance at 9.00 vs adopt at
5.35. The contrarian correctly noted that the security weight (25%) was the
thumb on the scale and that a hybrid option (ccstatusline + sanitize wrapper)
was never evaluated.

However, the core argument survives challenge: the 6 Tier 2 widgets are
SoNash-specific health metrics. No external tool provides them. ccstatusline has
cost, rate limits, and git -- but not hook health, health grade, debt ticker,
conversational state, or predictive compaction. We would still need to write the
hard widgets ourselves regardless of approach.

The contrarian's hybrid option (ccstatusline + sanitize wrapper) gains us
theming and 30+ generic widgets but does not reduce the work for SoNash-specific
widgets. And it adds: React/Ink runtime, npm dependency, process spawn overhead,
version tracking. For a solo developer, the maintenance cost exceeds the
benefit.

**Forking is definitively wrong.** All findings agree. Maintaining a React/Ink
TypeScript fork is indefensible for one developer.

### Architecture Resolution

**Winner: Enhanced monolith with inline try/catch** -- NOT the compiled/bundled
architecture from 06-ARCHITECTURE.

The contrarian (Challenge 2) correctly identified that the bundled architecture
(Option D, scored 28/30) is over-engineered for 8 widgets maintained by 1
developer. The proposal included: `src/statusline/` source directory, per-widget
files, a concatenation build script, `npm run statusline:build`, Zod config
schema, a 3-phase implementation plan across 3 sessions.

The right answer for our scale: add `try/catch` around each widget function in
the existing monolith. Each widget is 5-20 lines. The file grows from 119 to
approximately 250-300 lines -- a single screen of code. No build step, no config
file, no widget contract interface.

The `enabled()` function from the widget contract is still valuable -- but it
becomes a simple if-check at the top of each widget function, not a formal
interface. The anomaly threshold IS the enabled check.

If we later grow to 12+ widgets or 2+ developers, refactoring to the bundled
architecture (Option D) is straightforward. The monolith is not a dead end.

### Key Innovations to Incorporate

From the outside-the-box analysis:

1. **Anomaly-driven visibility** (Idea 7): The layout philosophy. Widgets appear
   only when their values cross anomaly thresholds. The statusline is quiet when
   everything is fine. This is not extra code -- it changes the semantics of
   each widget's display condition.

2. **Predictive compaction** (Idea 3): Extend the context bar to show
   `~N msgs left` when context exceeds 50%. Uses the pace tracking state file.
   No external tool does this. ~15 lines on top of the context bar.

3. **Conversational state** (Idea 2): Display the current workflow phase
   (idle/planning/implementing/reviewing) from `agent.name` + todo status. Free
   data from stdin JSON. ~30 lines.

4. **Statusline snapshot writes** (Idea 5): Write a summary JSON on every render
   to `.claude/state/statusline-snapshot.json`. Becomes a fast path for
   `/session-start`, compaction recovery, and crash recovery. ~20 lines.

5. **Threshold-activated cost** (Idea 6): Show cost only above $2.00, with burn
   rate above $5.00. Prevents cost from becoming wallpaper. ~15 lines.

---

## What We Got Wrong Initially

The contrarian review (07) surfaced corrections that must be internalized:

### 1. Three competing widget lists were never reconciled

Findings 03, 04, and 06 each proposed a different set of "the 6 SoNash widgets"
without acknowledging the others. The 03 list (session telemetry) was used to
justify the "2.75 hours, 80-120 lines" estimate. The 04 list (project health)
was used for the detailed widget designs. The 06 list (existing 5 + 1 new) was
used for architecture evaluation.

Each estimate and architectural decision was calibrated to a different scope.
This is resolved above in "The Canonical Widget List."

### 2. The performance budget excluded the largest cost

Findings 01, 04, and 06 analyzed widget-level performance (1-5ms per file read,
50-200ms for git) but the 04-WIDGET_DESIGN budget of <210ms excluded the fnm
wrapper overhead (100-300ms) and Node.js startup (50-100ms). The real worst-case
is 836ms (contrarian estimate), which exceeds the 300ms debounce and would
result in the statusline being cancelled before it finishes.

### 3. The decision matrix had a built-in bias

The security criterion (25% weight) was the decisive factor in the build vs
adopt decision. A perfect 10 for enhance vs 3 for adopt on the highest-weighted
criterion predetermined the outcome. The contrarian's point about a sanitize
wrapper (pipe ccstatusline output through our `sanitize()` function) was valid
and never evaluated.

However, the core conclusion (enhance) still holds for the deeper reason that
SoNash-specific widgets cannot come from external tools.

### 4. Most proposed widgets fail the actionability test

The contrarian (Challenge 6) asked the uncomfortable question: does anyone
actually change their behavior based on the statusline? The honest answer for
most widgets (debt ticker showing the same 7,274 every session, hooks showing OK
when hooks are stable, session counter prompting no action) is no.

Only context bar, rate limits, and cost reliably drive behavior changes.

---

## What We Almost Missed

The outside-the-box analysis (08) surfaced five innovations that the structured
research overlooked:

### 1. Anomaly-driven visibility (the anti-wallpaper design)

The most important insight. All 6 primary findings designed a permanently
visible dashboard. The outside-the-box reframe recognized that a statusline
showing "everything is fine" 95% of the time trains users to stop looking. The
solution: widgets appear only when anomalous. The statusline width itself
becomes a signal.

This directly operationalizes CLAUDE.md guardrail #6 and transforms the entire
design philosophy.

### 2. Predictive compaction warning

No external tool predicts compaction. They detect it (claudia-statusline's
"Compacting..." spinner) or display current usage. The prediction -- "~6 msgs to
compaction" -- gives the user time to proactively run `/session-end` before
compaction catches them mid-thought. The data already exists in the pace
tracking state file. Implementation is ~15 lines of arithmetic.

### 3. The statusline as a persistence mechanism

The statusline runs after every assistant message -- the most reliable write
trigger in the system. Writing a snapshot JSON on every render creates a
compaction recovery anchor, session-start accelerator, and crash recovery
signal. No external tool does this because they are general-purpose; only a
project-specific statusline can serve as state persistence.

### 4. Conversational state display

The most valuable information for a developer working with an AI agent is not
system metrics -- it is workflow state. "What phase is the AI in? Is it
implementing, reviewing, or waiting for me?" The `agent.name` field is free in
stdin JSON and provides this signal at zero I/O cost.

### 5. Threshold-activated cost

Cost below $2 is noise. Cost above $10 is a stop-loss signal. Showing cost only
when it crosses thresholds prevents it from becoming wallpaper while preserving
its value as a runaway-agent detector.

---

## Recommended Action Plan

### Phase 0: Pre-Implementation Verification (before any coding)

| #   | Action                                                           | Estimated Time | Blocker?                           |
| --- | ---------------------------------------------------------------- | -------------- | ---------------------------------- |
| 0a  | Run `claude --version`, verify statusline renders on Windows 11  | 5 min          | YES -- if broken, defer everything |
| 0b  | Benchmark current statusline end-to-end (including fnm overhead) | 15 min         | YES -- establishes real budget     |
| 0c  | Replace fnm wrapper with absolute node path in `settings.json`   | 15 min         | YES -- reclaims 100-200ms budget   |
| 0d  | Re-benchmark to establish post-fix performance budget            | 10 min         | YES -- determines widget capacity  |

**Gate:** If the statusline does not render, stop. Track upstream issue and
defer. If post-fix budget exceeds 150ms baseline, investigate further before
adding widgets.

### Phase 1: Foundation (1 session, ~1.5 hours)

| #   | Action                                                                     | Lines | Notes                                                                 |
| --- | -------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| 1a  | Refactor existing statusline to per-widget functions with inline try/catch | ~30   | Extract 5 existing widgets into functions within the same file        |
| 1b  | Add anomaly-driven layout logic (width detection, tier system)             | ~25   | `process.stdout.columns` check, priority-based widget selection       |
| 1c  | Add pace tracking state file (samples array for burn rate)                 | ~25   | Read + write `.claude/state/pace-sparkline.json`, 60s sample interval |
| 1d  | Extend context bar with predictive compaction                              | ~15   | Linear extrapolation from pace samples, `~N msgs left` display        |
| 1e  | Add statusline snapshot writes                                             | ~20   | Write `.claude/state/statusline-snapshot.json` on every render        |
| 1f  | Tests for new functionality                                                | ~40   | Pace tracking, compaction prediction, snapshot schema                 |

### Phase 2: Anomaly Widgets (1 session, ~1.5 hours)

| #   | Action                            | Lines | Anomaly Threshold                             |
| --- | --------------------------------- | ----- | --------------------------------------------- |
| 2a  | Rate limits widget                | ~20   | >= 70% of 5-hour limit                        |
| 2b  | Cost widget (threshold-activated) | ~20   | >= $2 (dim), >= $5 (+burn rate), >= $10 (red) |
| 2c  | Hook health widget                | ~25   | Any WARN/FAIL or unacked warnings             |
| 2d  | Health grade widget               | ~15   | Grade C or below                              |
| 2e  | Debt S0 widget                    | ~10   | S0 > 0, reads `debt-summary-cache.json`       |
| 2f  | Conversational state widget       | ~30   | Agent active or waiting detected              |
| 2g  | Tests for all new widgets         | ~60   | Per-widget unit tests                         |

### Phase 3: Polish and Hardening (0.5 session, ~45 min)

| #   | Action                                                         | Notes                                            |
| --- | -------------------------------------------------------------- | ------------------------------------------------ |
| 3a  | Performance profiling (target: <80ms p95 without git dirty)    | Verify budget holds with all widgets             |
| 3b  | Multi-line anomaly escalation (1 line -> 2 lines on critical)  | Optional, only if single line becomes cramped    |
| 3c  | Ensure `debt-summary-cache.json` is generated by session-start | Wire up the cache generation for the debt widget |
| 3d  | Windows 11 rendering verification                              | Full widget set renders correctly                |

### What is explicitly NOT in scope

- Git dirty widget (performance destroyer, deferred indefinitely)
- Pace sparkline as a visible widget (replaced by predictive compaction in
  context bar)
- Session counter, duration, lines-changed widgets (not actionable)
- Bundled/compiled architecture (over-engineered for our scale)
- External tool adoption or forking (wrong fit for SoNash-specific widgets)
- OSC 8 interactive links (terminal support too inconsistent)
- 3-line permanent dashboard (cognitive load trap)

---

## Self-Audit

### Did the synthesis address all contrarian challenges?

| #   | Challenge                                        | Severity | Resolution                                                                                                                                                                              |
| --- | ------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Decision matrix omits hybrid option              | Medium   | Acknowledged. Hybrid option was evaluated in synthesis -- it reduces work for generic widgets but not for SoNash-specific ones. Core conclusion (enhance) stands for different reasons. |
| 2   | Architecture over-engineered                     | Medium   | **Accepted.** Downgraded from compiled/bundled to enhanced monolith with inline try/catch.                                                                                              |
| 3   | Windows broken status unverified                 | HIGH     | **Promoted to Blocker 1.** Must verify before any coding.                                                                                                                               |
| 4   | Performance budget unrealistic with fnm overhead | HIGH     | **Promoted to Blocker 2.** fnm fix is prerequisite. Git dirty widget cut.                                                                                                               |
| 5   | Three widget lists don't match                   | HIGH     | **Resolved.** Canonical list produced with explicit rationale for every inclusion and exclusion.                                                                                        |
| 6   | Most widgets not actionable                      | Medium   | **Accepted.** Anomaly-driven visibility adopted. Only actionable widgets get permanent space; others appear on threshold.                                                               |

### Did the synthesis incorporate outside-the-box innovations?

| #   | Idea                                | Incorporated? | How                                                 |
| --- | ----------------------------------- | ------------- | --------------------------------------------------- |
| 1   | Actionable statusline (OSC 8 links) | Deferred      | Terminal support too inconsistent                   |
| 2   | Conversational state                | **Yes**       | Tier 2 widget #8                                    |
| 3   | Predictive compaction               | **Yes**       | Phase 1, merged into context bar                    |
| 4   | Multi-line dashboard                | Partially     | Anomaly escalation to 2 lines, not permanent 3-line |
| 5   | Statusline as session memory        | **Yes**       | Phase 1, snapshot writes                            |
| 6   | Live cost ticker                    | **Yes**       | Phase 2, threshold-activated                        |
| 7   | Anomaly-driven visibility           | **Yes**       | Core layout philosophy                              |

### Does the plan respect performance constraints?

Post-fnm-fix estimated budget:

| Component                 | Min      | Max       |
| ------------------------- | -------- | --------- |
| Node.js startup           | 50ms     | 100ms     |
| Git rev-parse (existing)  | 10ms     | 50ms      |
| Stdin JSON parsing        | <1ms     | <1ms      |
| 6 Tier 2 widget functions | 3ms      | 15ms      |
| Pace state read+write     | 1ms      | 3ms       |
| Snapshot write            | 1ms      | 3ms       |
| **Total**                 | **66ms** | **172ms** |

This is within the <200ms practical limit and well under the 300ms debounce
cancellation boundary. The git dirty widget (50-200ms) remains correctly
excluded.

### Does the plan align with CLAUDE.md?

| CLAUDE.md Rule                                          | Compliance                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Section 4.6: "Unacknowledged warnings become wallpaper" | Anomaly-driven visibility directly addresses this               |
| Section 5: Error sanitization via `sanitize-error.js`   | Existing sanitization preserved and extended to all new widgets |
| Section 5: File reads wrapped in try/catch              | Per-widget try/catch isolation                                  |
| Section 5: Path traversal check pattern                 | Existing pattern preserved for todo file reads                  |
| Section 5: exec() with /g flag                          | No new regex exec loops introduced                              |

---

## Sources

### Research Findings (this project)

- `01-CURRENT_IMPL.md` -- Current statusline analysis (119 lines, 5 widgets,
  performance, security, gaps)
- `02-EXTERNAL_REPOS.md` -- 15 external repos surveyed (ccstatusline,
  claude-hud, CCometixLine, etc.)
- `03-BUILD_ADOPT_FORK.md` -- Build vs adopt vs fork decision (enhance current
  won 9.00 weighted)
- `04-WIDGET_DESIGN.md` -- Detailed widget specifications for 6 SoNash health
  widgets
- `05-CONSTRAINTS.md` -- Claude Code statusline API contract, stdin JSON schema,
  Windows issues
- `06-ARCHITECTURE.md` -- 4 architecture options (monolith, plugin, config,
  bundled)
- `07-CONTRARIAN.md` -- 6 challenges (widget list mismatch, Windows blocker, fnm
  overhead, actionability)
- `08-OUTSIDE_THE_BOX.md` -- 7 innovations (anomaly-driven, predictive
  compaction, snapshot writes, conversational state)

### Key External Sources

- [Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline) --
  Official API contract
- [GitHub #31670](https://github.com/anthropics/claude-code/issues/31670) --
  Windows statusline regression (v2.1.71)
- [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline) -- 5.6k
  stars, 30+ widgets (evaluated, not adopted)
- [FlineDev/CustomStatusline](https://github.com/FlineDev/CustomStatusline) --
  Pace sustainability coloring precedent
- [hagan/claudia-statusline](https://github.com/hagan/claudia-statusline) --
  Compaction detection precedent
