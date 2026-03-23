# 08 - Outside the Box: What the Structured Research Missed

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH COMPLETE
**Source:** Lateral analysis of findings 01-06, identifying blind spots and unexplored directions
<!-- prettier-ignore-end -->

---

## Diagnosis: What the Research Assumed Without Questioning

Every finding (01-06) shares three unexamined assumptions:

1. **The statusline is a passive display.** Data flows one direction: system
   state -> render -> eyeballs. No finding considers the statusline as an input
   mechanism, a communication channel, or a persistence layer.

2. **The audience is the user's eyes.** Every widget is designed for human
   visual scanning. No finding considers the statusline as a machine-readable
   signal, a trigger for other systems, or a data source for post-session
   analysis.

3. **Widgets show current state.** Every widget reads a file and displays its
   contents. No finding considers predictive state, trend-based alerts, or
   information that only becomes valuable when it changes.

The seven ideas below challenge each of these assumptions.

---

## Idea 1: The Actionable Statusline (Interactive Widgets)

### What the research assumed

Widgets display text. The user reads them. End of interaction.

### What nobody explored

OSC 8 hyperlinks are confirmed supported (Finding 05, Section 2: "OSC 8
hyperlinks: `\e]8;;URL\a TEXT \e]8;;\a` makes text clickable"). ccstatusline
already renders OSC 8 links for git branches (Finding 02, Section 2.2: "OSC8
hyperlink rendering -- clickable git branch links to GitHub, IDE paths").

But every implementation uses them for navigation (open a URL in a browser).
Nobody has used them for **in-context action triggers**.

### What becomes possible

```
DEBT:32 S0  -->  click opens: file:///.claude/state/debt-s0-view.html
HOOKS:WARN(3)  -->  click opens: file:///tmp/sonash-hook-warnings.txt
A91^  -->  click opens: file:///tmp/sonash-health-detail.txt
```

The statusline widget generates a temp file with detail data on each render, and
the OSC 8 link points to it. Cmd+click (macOS) or Ctrl+click (Windows Terminal)
opens the detail in the default viewer. Zero latency, zero API cost, works
offline.

### Practical limits

- OSC 8 support varies: works in iTerm2, Kitty, WezTerm, Windows Terminal. Does
  NOT work in Terminal.app, some tmux configurations, or VS Code's terminal
  (which Claude Code often runs in).
- SSH sessions may strip OSC sequences.
- The current statusline already strips OSC sequences via sanitization
  (`\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)`). The sanitizer would need a
  **whitelist** for statusline-generated OSC 8 links (do not sanitize our own
  output, only sanitize user-derived dynamic values).

### Verdict

**Feasible but niche.** Depends on terminal support. Worth implementing for the
debt ticker widget specifically, where "click to see S0 list" has concrete
value. Not worth redesigning the entire statusline around interactivity.

---

## Idea 2: Conversational State Display

### What the research assumed

The statusline shows **system** state: model, branch, context usage, hook
health, debt counts. All derived from files or the stdin JSON.

### What nobody explored

The most valuable information for a solo developer working with an AI agent is
not system state -- it is **conversational state**. Where am I in the workflow?
What is the AI doing? What does it need from me?

Examples of conversational state:

| Signal                 | Source                                              | Display                              |
| ---------------------- | --------------------------------------------------- | ------------------------------------ |
| Current workflow phase | Active skill/agent name from `agent.name` field     | `deep-plan:3/5`                      |
| Waiting for approval   | Agent state detection (plan presented, no "go")     | `WAITING` (blinking)                 |
| Research progress      | Agent spawn tracking from `agent-invocations.jsonl` | `Research: 5/8`                      |
| Implementation step    | Todo file parsing (already exists in statusline)    | `Step 3/7`                           |
| Session phase          | Duration + activity pattern                         | `Active`, `Reviewing`, `Wrapping up` |

### What the stdin JSON already provides

Finding 05 documents the `agent.name` field: "Only with `--agent` flag or agent
settings." When an agent is active, the statusline knows. Combined with the
existing todo-file parsing (which reads `in_progress` status), the statusline
can distinguish between:

- **Idle**: no active task, no agent
- **Planning**: agent active, no implementation task
- **Implementing**: task `in_progress` found
- **Reviewing**: `code-reviewer` agent detected
- **Waiting**: plan has been presented but no subsequent messages (timer-based)

### How to implement cheaply

The `agent.name` field is free (stdin JSON). The todo-file parsing is already
implemented. The only new element is a heuristic for "waiting" -- which could be
approximated by checking if `cost.total_duration_ms` minus the last known value
exceeds a threshold (no new API activity = waiting for user).

### Verdict

**High value, low cost.** The `agent.name` field alone adds useful context. A
simple state machine (idle/planning/implementing/reviewing) built from existing
data sources would be more informative than any file-based metric. This is the
single highest-impact idea in this document.

---

## Idea 3: Predictive Compaction Warning

### What the research assumed

Context usage is displayed as a percentage bar. Color thresholds warn at 50%,
65%, 80%. Finding 01 documents the skull emoji + blinking red at 80%+.

### What nobody explored

The percentage tells you WHERE you are. It does not tell you WHEN you will hit
compaction. But the data to predict this exists:

- `context_window.used_percentage` on every render = a time series
- `cost.total_duration_ms` on every render = wall-clock elapsed
- The pace sparkline (Finding 04, Widget 6) was designed to track burn rate

If the pace sparkline already tracks `remaining_percentage` over time with
timestamps, computing a linear extrapolation is trivial:

```
burn_rate = (sample[n].pct - sample[n-3].pct) / (sample[n].t - sample[n-3].t)
if burn_rate < 0:
  messages_remaining = remaining_pct / abs(burn_rate_per_message)
  time_remaining = remaining_pct / abs(burn_rate_per_second)
```

### Display

Normal (context < 50%):

```
████████░░ 28%
```

Predictive (context 50-79%):

```
████████░░ 62% ~22 msgs left
```

Critical (context > 80%):

```
skull ████████░░ 84% ~6 msgs to compaction
```

### Why this matters for SoNash specifically

SoNash uses `/session-end` for context preservation, which writes state files
and commits before compaction. An early warning like "~6 messages to compaction"
gives the user time to trigger `/session-end` proactively rather than having
compaction catch them mid-thought.

claudia-statusline (Finding 02, Section 4.1) has compaction _detection_ (hook-
based, shows "Compacting..." spinner during process). But detection is reactive
-- it fires AFTER compaction starts. Prediction fires BEFORE, when you can still
act.

### Technical feasibility

The pace sparkline state file (`.claude/state/pace-sparkline.json`) already
stores `{samples: [{t, pct}, ...]}`. The extrapolation is 5 lines of arithmetic.
The only question is accuracy: context burn is not linear (tool calls and file
reads cause bursts). A rolling 3-sample average smooths this.

### Verdict

**Highly feasible, genuinely novel.** No external tool does this. The data
already exists in the pace sparkline design. The implementation cost is ~10
lines on top of the pace sparkline widget. This should be a first-class feature
of the context bar widget, not a separate widget.

---

## Idea 4: Multi-Line Dashboard Mode

### What the research assumed

Finding 05 confirms: "Multiple lines are supported: each `echo`/`print`/
`console.log` produces a separate row in the status area." ccstatusline removed
its 3-line limit in v2.0.11 (Finding 02, Section 2.2). rz1989s supports 1-9
configurable lines (Finding 02, Section 3.4).

Yet Finding 04's layout design only proposes a single-line layout with width
tiers.

### What nobody explored

A mode toggle based on terminal height (not width):

```
Terminal height >= 40 rows:  Dashboard mode (3 lines)
Terminal height  < 40 rows:  Compact mode (1 line)
```

Dashboard mode layout:

```
Line 1: Claude Opus 4 | housecleaning | Step 3/7: Fix CI pipeline | sonash-v0
Line 2: HEALTH:A(91)^ | HOOKS:OK | DEBT 7274(S0:32) | GIT:3M 2? | S#231
Line 3: ████████░░ 62% ~22 msgs left | $1.47 | 2h 15m | +156/-23 | ▁▂▃▁▅▃▂▁
```

Compact mode (1 line, current approach plus cost):

```
housecleaning | A91^ | D:32! | $1.47 | ████████░░ 62%
```

### Why this matters

The structured research identified 10 widgets (Finding 04, priority table).
Fitting them on one line requires aggressive compaction (4-char widget labels)
that makes them unreadable. Multi-line resolves the tension between information
density and readability.

### Technical implementation

```javascript
const rows = process.stdout.rows || 24;
const mode = rows >= 40 ? "dashboard" : "compact";
if (mode === "dashboard") {
  console.log(line1);
  console.log(line2);
  console.log(line3);
} else {
  process.stdout.write(compactLine);
}
```

### Risks

- **Vertical space cost**: 3 rows of terminal permanently occupied means 3 fewer
  rows for conversation. On a 40-row terminal, that is 7.5% of the viewport.
- **Visual noise**: 3 lines of data can become wallpaper faster than 1 line. The
  "anomaly-only" approach (Idea 7) would be undermined by a permanent dashboard.
- **Claude Code behavior**: The status area may not resize dynamically. If
  Claude Code allocates a fixed number of rows for the statusline, switching
  modes mid-session could cause rendering glitches.

### Verdict

**Technically trivial, UX questionable.** The implementation is a 5-line
conditional. But 3 rows of always-visible data is a significant cognitive load
tradeoff. Better approach: default to 1 line, expand to 2 lines only when an
anomaly exists (Idea 7), never go to 3 lines in normal operation.

---

## Idea 5: The Statusline as Session Memory (Compaction-Surviving State)

### What the research assumed

The statusline is a view layer. It reads data and displays it. It does not write
anything.

The single exception in the findings is the pace sparkline (Finding 04, Widget
6), which writes a state file for its own time-series samples. But even that is
treated as a widget implementation detail, not as a general mechanism.

### What nobody explored

The statusline runs on EVERY render cycle -- after every assistant message. That
makes it the most reliable write trigger in the entire system. More reliable
than hooks (which only fire on commit/push), more reliable than skills (which
must be explicitly invoked), more reliable than session-end (which can be
forgotten).

What if the statusline wrote a "last known good state" file on every render?

```json
{
  "lastRender": "2026-03-20T14:32:00Z",
  "session": 231,
  "model": "Opus 4.6 (1M)",
  "branch": "housecleaning",
  "contextUsed": 62,
  "cost": 1.47,
  "duration": 8100000,
  "linesAdded": 156,
  "linesRemoved": 23,
  "lastTask": "Fix CI pipeline",
  "healthGrade": "A",
  "hookStatus": "OK",
  "debtS0": 32,
  "agentName": null,
  "predictedMsgsToCompaction": 22
}
```

This file (`/.claude/state/statusline-snapshot.json`) becomes:

1. **A compaction recovery signal.** After compaction, the agent's context is
   wiped. Session-start can read this file to say: "Before compaction, you were
   on branch `housecleaning`, working on `Fix CI pipeline`, at 62% context
   usage, health grade A, with 32 S0 debt items."

2. **A session-start accelerator.** `/session-start` currently reads
   `SESSION_CONTEXT.md` and multiple state files. The statusline snapshot is a
   pre-aggregated summary of the most important state, updated every few
   seconds.

3. **A crash recovery signal.** If Claude Code crashes mid-session, the snapshot
   is the most recent record of what was happening. More recent than any commit
   or hook-generated state file.

4. **A cross-session metric source.** Append-mode variant: write one line per
   render to a JSONL file. After N sessions, you have a complete time series of
   context burn rates, cost accumulation, and session patterns. This is free
   telemetry.

### Performance cost

One atomic JSON write per render. Using the existing `atomicWriteJson` pattern
from `state-utils.js`: tmp file + rename. ~2ms per render. The pace sparkline
already plans to do exactly this (Finding 04, Section "Pace Sparkline",
"Read+write: Every render"). Extending it to a full snapshot adds zero
architectural cost.

### Why nobody does this

External statusline tools (ccstatusline, claude-hud, etc.) are general-purpose.
They do not know about your project's state files or session model. Only a
project-specific statusline can serve as a state persistence mechanism.

### Verdict

**The single most undervalued capability.** The statusline-as-writer is a free
persistence mechanism running on the most reliable trigger in the system. The
snapshot file alone justifies the entire statusline overhaul -- it gives
`/session-start` a pre-aggregated summary, gives compaction recovery a ground-
truth anchor, and gives crash recovery a last-known-good state.

Implementation: add one `writeFileSync` call at the end of the render function.

---

## Idea 6: Live Cost Ticker

### What the research assumed

Finding 03 lists "Cost tracker" as a proposed widget reading
`data.cost.total_cost_usd`. Finding 04 does not include a cost widget. Finding
06 lists "Session Cost" as Widget 5 with "Low" complexity. But all treat it as a
simple number display.

### What nobody explored

The question is not "can we show the cost" (trivially yes -- it is in stdin
JSON). The question is: **when does cost information change behavior?**

For normal sessions, cost is noise. For the 23-agent research sessions the user
just ran, real-time cost is operationally critical. The difference:

| Session type                | Typical cost | Cost display value                      |
| --------------------------- | ------------ | --------------------------------------- |
| Normal coding               | $0.50-2.00   | Low (confirmation bias -- "looks fine") |
| Deep research (multi-agent) | $5-20+       | **High** (anomaly detection)            |
| Runaway agent loop          | $10-50+      | **Critical** (stop-loss trigger)        |

### Smart cost display

Instead of always showing cost, show it only when it matters:

```
$0.00 - $2.00:  Hidden (normal session)
$2.00 - $5.00:  Dim gray: $3.41
$5.00 - $10.00: Yellow: $7.23
$10.00+:         Red, bold: $14.67
```

With burn rate annotation at high cost:

```
$14.67 (+$2.30/hr)
```

### The cost/context crossover

The most interesting metric is cost-per-context-percentage. If you are burning
$2/hr at 30% context, that is sustainable. If you are burning $2/hr at 85%
context, you are about to hit compaction AND spending money doing it.

```
Efficient session:  $1.47 at 28% context  ->  silent
Expensive session:  $8.23 at 72% context  ->  $8.23 (~$11/ctx-fill)
```

"$11 per context fill" tells you the session is expensive AND approaching the
wall. Neither metric alone conveys this.

### Verdict

**Implement as a threshold-activated widget.** Do not show cost below $2. Show
cost + burn rate above $5. Show cost + "per context fill" projection above $10.
This avoids wallpaper syndrome for cheap sessions and provides genuine
operational intelligence for expensive ones.

---

## Idea 7: Anomaly-Driven Visibility (The "Anti-Wallpaper" Design)

### What the research assumed

All 6 findings design the statusline as a permanently visible bar with N widgets
always displayed. Width tiers control which widgets render, but the statusline
always shows something.

### What nobody explored

The fundamental problem with statuslines is not what they show -- it is that
they are always there. A statusline showing "everything is fine" 95% of the time
trains the user to stop looking. This is the wallpaper problem explicitly called
out in CLAUDE.md Section 4, Rule 6: "Unacknowledged warnings become wallpaper."

### Anomaly-driven design

**Normal state (everything fine):**

```
housecleaning | ████░░░░░░ 28%
```

Two widgets. Branch for orientation, context bar for safety. Nothing else.
Minimal visual footprint, minimal cognitive load.

**Anomaly state (something needs attention):**

```
housecleaning | HOOKS:FAIL | D:32! | $8.23(+$2/hr) | ████████░░ 72% ~12 msgs
```

Widgets appear ONLY when their values cross anomaly thresholds. When they return
to normal, they disappear. The statusline width itself becomes a signal: a long
statusline means "pay attention."

### Anomaly thresholds per widget

| Widget       | Normal (hidden)     | Anomaly (visible)    |
| ------------ | ------------------- | -------------------- |
| Context bar  | Always visible      | N/A (anchor widget)  |
| Branch       | Always visible      | N/A (anchor widget)  |
| Health Grade | A or B              | C, D, or F           |
| Hook Health  | OK (100% pass)      | Any WARN or FAIL     |
| Debt Ticker  | S0 = 0              | S0 > 0               |
| Git Dirty    | 0-5 files           | 6+ files             |
| Cost         | < $2.00             | >= $2.00             |
| Pace         | Stable/declining    | Accelerating burn    |
| Compaction   | > 30 msgs remaining | <= 15 msgs remaining |

### Multi-line anomaly escalation

Normal (1 line):

```
housecleaning | ████░░░░░░ 28%
```

Warning (1 line, expanded):

```
housecleaning | D:32! | ████████░░ 62% ~22 msgs
```

Critical (2 lines -- anomaly forces expansion):

```
housecleaning | HOOKS:FAIL | D:32! | $8.23 | ████████░░ 84% ~6 msgs
HEALTH:C(72)v | GIT:12M 4? | Implementing step 3/7 | S#231 2h15m
```

The jump from 1 line to 2 lines is itself an attention signal. The user does not
need to read the content -- the visual expansion means "something changed."

### Why this is psychologically correct

Human attention systems respond to **change**, not to static information. A
statusline that changes shape (1 line -> 2 lines) when anomalies arise exploits
the same perceptual mechanism as a notification badge. But unlike a badge, it
does not interrupt -- it is peripheral and optional to process.

FlineDev's pace sustainability coloring (Finding 02, Section 4.3) applies a
similar insight to a single widget (color means "sustainable" not "high"). The
anomaly-driven design applies this insight to the entire statusline layout.

### Verdict

**This is the design philosophy, not just a feature.** Every other idea in this
document should be filtered through this lens: does this widget justify
permanent screen real estate, or should it appear only when anomalous? The
answer for most widgets is "anomaly only." The only permanent residents should
be branch and context bar.

---

## Synthesis: What Actually Changes the Implementation Plan

The structured research (01-06) produced a solid plan: Option D architecture, 6
widgets, widget contract, build system. This outside-the-box analysis does not
invalidate that plan. It augments it with five actionable modifications:

### Modification 1: Add conversational state to the widget roster

The `agent.name` field is free. A simple state machine
(idle/planning/implementing/reviewing/waiting) derived from `agent.name` + todo
status + duration gaps is the highest-value new widget identified. Add it to the
Phase 2 widget list.

**Effort:** ~30 lines. No new data sources.

### Modification 2: Merge predictive compaction into the context bar

Do not create a separate "compaction prediction" widget. Extend the existing
context bar widget to show `~N msgs left` when context exceeds 50%. The pace
sparkline state file provides the data. This turns a passive gauge into an
actionable countdown.

**Effort:** ~15 lines on top of pace sparkline implementation.

### Modification 3: Add statusline snapshot writes

At the end of every render, write a snapshot JSON to
`.claude/state/statusline-snapshot.json`. This becomes the fastest path for
`/session-start` and compaction recovery. Cheap to implement, high value for
session continuity.

**Effort:** ~20 lines. One `writeFileSync` call.

### Modification 4: Adopt anomaly-driven visibility as the layout philosophy

Do not show all 10 widgets all the time. Default to 2 (branch + context bar).
Each widget has an anomaly threshold; crossing it makes the widget appear. This
is not extra code -- it is a different default for each widget's `enabled`
function in the widget contract.

**Effort:** Zero additional code. Changes the `enabled()` function semantics
from "is data available?" to "does data cross an anomaly threshold?"

### Modification 5: Threshold-activate the cost ticker

Show cost only above $2.00. Show cost + burn rate above $5.00. Show cost +
per-context-fill projection above $10.00. This prevents cost from becoming
wallpaper during cheap sessions.

**Effort:** ~15 lines of conditional formatting.

### What NOT to implement

- **OSC 8 interactive links**: Terminal support is too inconsistent. Defer until
  Windows Terminal and VS Code terminal both support it reliably.
- **Full 3-line dashboard mode**: Permanent 3-line display is a cognitive load
  trap. Use anomaly-driven expansion instead (1 line -> 2 lines only on critical
  anomalies).
- **JSONL time-series logging**: The append-mode telemetry variant of the
  snapshot is interesting for post-session analysis but adds write volume and
  file growth without clear immediate value. Defer to a later phase.

---

## Priority Stack (New Ideas Only)

| #   | Idea                                 | Value  | Effort               | Phase    |
| --- | ------------------------------------ | ------ | -------------------- | -------- |
| 1   | Anomaly-driven visibility            | High   | Zero (design change) | Phase 1  |
| 2   | Conversational state widget          | High   | 30 lines             | Phase 2  |
| 3   | Statusline snapshot writes           | High   | 20 lines             | Phase 2  |
| 4   | Predictive compaction in context bar | High   | 15 lines             | Phase 2  |
| 5   | Threshold-activated cost             | Medium | 15 lines             | Phase 2  |
| 6   | OSC 8 action links                   | Low    | 40 lines             | Phase 3+ |
| 7   | Multi-line anomaly escalation        | Medium | 25 lines             | Phase 3  |

Total new effort for items 1-5: ~80 lines, all in Phase 2.

---

## Sources

### Findings Referenced

- 01-CURRENT_IMPL.md: Current statusline analysis, sanitization patterns
- 02-EXTERNAL_REPOS.md: ccstatusline OSC 8 links, claudia-statusline compaction
  detection, FlineDev pace sustainability, SaharCarmel code quality detection
- 03-BUILD_ADOPT_FORK.md: Option A recommendation, widget roster
- 04-WIDGET_DESIGN.md: Pace sparkline state file design, layout width tiers
- 05-CONSTRAINTS.md: Stdin JSON schema (agent.name, cost, context_window),
  multi-line support, OSC 8 support, debounce behavior
- 06-ARCHITECTURE.md: Option D recommendation, widget contract specification

### Behavioral Science

- CLAUDE.md Section 4, Rule 6: "Unacknowledged warnings become wallpaper"
- Change blindness research: humans detect changes in peripheral vision more
  reliably than they monitor static displays
- FlineDev CustomStatusline: pace sustainability coloring as precedent for
  psychologically-informed widget design
