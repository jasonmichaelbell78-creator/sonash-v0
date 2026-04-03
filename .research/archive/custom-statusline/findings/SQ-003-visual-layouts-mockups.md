# SQ-003: Visual Layouts & Design Patterns for Terminal Status Bars

**Research Date:** 2026-03-23 **Status:** COMPLETE **Researcher:** Claude Agent
(SQ-003 sub-question)

---

## Table of Contents

1. [Real-World Inspirations](#1-real-world-inspirations)
2. [Pattern A: Minimal Single-Line](#pattern-a-minimal-single-line)
3. [Pattern B: Segmented Single-Line](#pattern-b-segmented-single-line)
4. [Pattern C: Icon-Based Single-Line](#pattern-c-icon-based-single-line)
5. [Pattern D: Multi-Line Always](#pattern-d-multi-line-always)
6. [Pattern E: Anomaly-Driven](#pattern-e-anomaly-driven)
7. [Pattern F: Dashboard-Style](#pattern-f-dashboard-style)
8. [Pattern G: Sparkline/Graph-Based](#pattern-g-sparklinegraph-based)
9. [Pattern H: Color-Zone](#pattern-h-color-zone)
10. [Comparison Matrix](#comparison-matrix)
11. [Degradation Strategies](#degradation-strategies)
12. [Recommendation for SoNash](#recommendation-for-sonash)

---

## 1. Real-World Inspirations

### tmux (3-zone architecture)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [session:0]  0:bash* 1:vim  2:logs                              cpu:12% │ mem:4.2G │ 23-Mar 14:30 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
 ← status-left          ← window list (center)                       →            status-right →
```

**Key design lesson:** tmux divides its bar into three logical zones (left,
center, right). The center is reserved for a "list" (windows), while left/right
hold metadata. Responsive: tmux uses `if-shell` with `#{client_width}` to
conditionally show/hide segments at different terminal widths (e.g., show CPU
only when width > 120).

### Neovim lualine (6-section symmetry)

<!-- prettier-ignore -->
```
┌────────┬─────────────────────┬──────────────────────────────────────┬───────────┬──────────┬───────┐
│ NORMAL │  main  +3 ~1 -0    │ src/app/page.tsx                     │ utf-8  lf │ ts  42%  │ 23:17 │
│   A    │         B           │               C                      │     X     │    Y     │   Z   │
└────────┴─────────────────────┴──────────────────────────────────────┴───────────┴──────────┴───────┘
```

**Key design lesson:** Lualine's A-B-C-X-Y-Z sections create visual hierarchy
through background color intensity. Section A (mode) has the strongest color; it
fades through B and C. Powerline arrow separators (`, `) create flowing
transitions. The `always_divide_middle` option prevents left-side content from
swallowing the right side.

### Starship Prompt (conditional modules)

<!-- prettier-ignore -->
```
  ~/.local/bin/sonash-v0 on  main via  v22.14.0 took 3s
❯
```

**Key design lesson:** Starship only shows modules when they are relevant. The
Node version appears only when a `package.json` is detected. Duration appears
only when a command took >2 seconds. This is the foundational idea behind
Pattern E (anomaly-driven).

### VS Code Status Bar (color-coded zones)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  main*  0⚠  0✕ │                                               │ Ln 23, Col 17 │ UTF-8 │ TS  │
│ ← workspace scope (left)                                          → file scope (right) →          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key design lesson:** VS Code changes the ENTIRE status bar background color
based on state: blue = normal workspace, orange = debugging, purple = no folder
open. This is the inspiration for Pattern H. Individual items can also have
`warningBackground` or `errorBackground` to highlight specific problems.

### iTerm2 Status Bar (configurable components)

<!-- prettier-ignore -->
```
┌──────────┬─────────────┬─────────────┬──────────┬──────────────┬─────────────┐
│ CPU: 12% │ MEM: 4.2 GB │ NET: ↑2 ↓14 │  ~/src   │ user@macbook │ 14:30:22    │
└──────────┴─────────────┴─────────────┴──────────┴──────────────┴─────────────┘
```

**Key design lesson:** iTerm2 uses a drag-and-drop component model with
configurable "compression resistance" (priority). When the terminal narrows,
low-priority components collapse first. The auto-rainbow feature assigns
distinct colors automatically for visual differentiation.

### ccstatusline (Claude Code ecosystem)

<!-- prettier-ignore -->
```
 Opus 4   main  📁 sonash-v0  ⏱ 02:34  🔤 12.4K tokens  ████████░░ 62%
```

**Key design lesson:** ccstatusline pioneered powerline-mode rendering for
Claude Code with widget alignment, theme support, and "block timer" tracking.
Smart width detection auto-adapts to terminal width using flex separators.

### Claude Code Current (SoNash existing implementation)

<!-- prettier-ignore -->
```
Claude │ main │ current-task-name │ sonash-v0 ████████░░ 62%
```

**Key design lesson:** The existing SoNash statusline
(`.claude/hooks/global/statusline.js`) already uses color-coded context bars
(green <50%, yellow <65%, orange <80%, blinking red skull >=80%). Task display
is conditional (only shown when an agent todo is in-progress).

---

## Pattern A: Minimal Single-Line

> **Philosophy:** Show almost nothing. Let the user focus. Only essential
> navigation context.

### Layout (100 chars)

<!-- prettier-ignore -->
```
main │ ████░░░░░░ 28%
```

### Narrow (60 chars)

<!-- prettier-ignore -->
```
main │ ████░░ 28%
```

### Ultra-narrow (40 chars)

<!-- prettier-ignore -->
```
main │ 28%
```

### Color Description

- `main` — cyan (git branch convention)
- Progress bar — green (<50%), yellow (<65%), orange (<80%), red (>=80%)
- All other text — dim white

### Assessment

| Criterion              | Rating    | Notes                                             |
| ---------------------- | --------- | ------------------------------------------------- |
| **Min width**          | ~20ch     | Branch + percentage only                          |
| **Max info density**   | Very low  | Only branch + context percentage                  |
| **Implementation**     | Trivial   | 2 data sources: git branch, context remaining     |
| **Accessibility**      | Excellent | Works without colors/icons; just text + ASCII bar |
| **Narrow degradation** | Excellent | Drop bar chars, then drop bar entirely            |
| **Cognitive load**     | Near zero | Nothing to parse                                  |

**Pros:** Zero distraction; perfect for users who want the terminal to stay out
of the way; no font requirements; works everywhere.

**Cons:** No session cost, no health info, no hook status, no debt — requires
manually running `/alerts` for everything. Defeats the purpose of the statusline
project (anomaly surfacing).

**Best for:** Users who explicitly want minimal chrome. Not suitable as default
for SoNash.

---

## Pattern B: Segmented Single-Line

> **Philosophy:** Pack maximum useful information into one line using
> pipe-delimited segments. Every segment earns its space.

### Layout (100 chars)

<!-- prettier-ignore -->
```
main │ S#234 │ $1.23 │ 5hr:42% │ ████████░░ 62% ~22 msgs
```

### Narrow (80 chars)

<!-- prettier-ignore -->
```
main │ S#234 │ $1.23 │ ████████░░ 62% ~22 msgs
```

### Narrow (60 chars)

<!-- prettier-ignore -->
```
main │ $1.23 │ ████░░ 62% ~22
```

### Ultra-narrow (40 chars)

<!-- prettier-ignore -->
```
main │ $1.23 │ 62%
```

### Segment Breakdown

| Segment | Example                   | Source            | Priority         |
| ------- | ------------------------- | ----------------- | ---------------- |
| Branch  | `main`                    | `git rev-parse`   | 1 (always show)  |
| Session | `S#234`                   | session counter   | 4 (drop first)   |
| Cost    | `$1.23`                   | API cost tracking | 2 (important)    |
| Block   | `5hr:42%`                 | block timer       | 3 (drop at 80ch) |
| Context | `████████░░ 62% ~22 msgs` | context API       | 1 (always show)  |

### Color Description

- Branch — cyan
- Session — dim white
- Cost — green (<$2), yellow (<$5), red (>=$5)
- Block timer — dim white, yellow at <20% remaining
- Context bar — green/yellow/orange/red gradient
- `~22 msgs` — dim, estimated messages remaining

### Assessment

| Criterion              | Rating | Notes                                                                  |
| ---------------------- | ------ | ---------------------------------------------------------------------- |
| **Min width**          | ~35ch  | Branch + cost + percentage                                             |
| **Max info density**   | High   | 5 data points in one line                                              |
| **Implementation**     | Medium | Needs cost tracking, block timer, msg estimation                       |
| **Accessibility**      | Good   | All text-based, no icon dependency                                     |
| **Narrow degradation** | Good   | Priority-based segment dropping                                        |
| **Cognitive load**     | Medium | Practiced users scan quickly; new users need to learn segment meanings |

**Pros:** Information-dense; priority-based degradation is well-understood
(tmux, lualine both do this); no special fonts needed; every segment is
self-labeling.

**Cons:** At full width it can feel "wall of text"; the pipe separators are
visually monotone; no visual hierarchy (everything looks equally important);
cost and context compete for attention.

**Best for:** Power users who want everything visible at a glance. This is
essentially what tmux users build.

**Real-world analog:** tmux with powerline plugins, iTerm2 status bar.

---

## Pattern C: Icon-Based Single-Line

> **Philosophy:** Replace text labels with Nerd Font / Unicode icons for
> density. Visually distinctive segments.

### Layout (100 chars)

<!-- prettier-ignore -->
```
 main │  234 │ 💲1.23 │  42% │ ████████░░ 62%
```

### Alternative with Nerd Font only (no emoji)

<!-- prettier-ignore -->
```
 main │  234 │  $1.23 │  42% │  A │ ████████░░ 62%
```

### Narrow (60 chars)

<!-- prettier-ignore -->
```
 main │  $1.23 │ ████░░ 62%
```

### Ultra-narrow (40 chars)

<!-- prettier-ignore -->
```
 main │ 62%
```

### Icon Reference

| Icon | Nerd Font Code      | Meaning     | Fallback (no icons) |
| ---- | ------------------- | ----------- | ------------------- |
|      | `nf-dev-git_branch` | Git branch  | `br:`               |
|      | `nf-oct-hash`       | Session #   | `S#`                |
| 💲   | Unicode emoji       | Cost        | `$`                 |
|      | `nf-fa-clock_o`     | Block timer | `blk:`              |
|      | `nf-fa-heartbeat`   | Health      | `H:`                |
|      | `nf-fa-bar_chart`   | Context     | `ctx:`              |

### Color Description

- Icons inherit their segment's color
- Branch icon + text — cyan
- Cost icon — green/yellow/red based on amount
- Health icon — green (A/B), yellow (C), red (D/F)
- Context bar — standard gradient

### Assessment

| Criterion              | Rating         | Notes                                                                                                                     |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Min width**          | ~25ch          | Icons are more compact than text labels                                                                                   |
| **Max info density**   | Very high      | Icons replace 3-5 char labels with 1-2 chars                                                                              |
| **Implementation**     | Medium         | Same data sources as Pattern B + icon rendering                                                                           |
| **Accessibility**      | Poor           | Requires Nerd Fonts; icons meaningless without legend; colorblind users lose icon meaning if color is only differentiator |
| **Narrow degradation** | Good           | Icons compress well, but lose meaning at a distance                                                                       |
| **Cognitive load**     | High initially | Must learn icon vocabulary; becomes low after learning                                                                    |

**Pros:** Most compact representation; visually distinctive; feels "modern" and
polished; Nerd Font adoption is widespread in dev tooling (starship, lualine,
powerlevel10k all assume it).

**Cons:** Hard accessibility barrier — users without Nerd Fonts see rectangles
or question marks; icon meanings are not self-documenting; emoji rendering is
inconsistent across terminals (especially Windows Terminal vs ConEmu); requires
fallback path for plain terminals.

**Best for:** Users who already have Nerd Fonts installed and are comfortable
with the icon vocabulary from starship/lualine. Not suitable as the only mode.

**Real-world analog:** starship prompt, powerlevel10k, lualine with devicons.

---

## Pattern D: Multi-Line Always

> **Philosophy:** Use two lines to separate "navigation" (line 1) from "system
> health" (line 2). More space = more data without crowding.

### Layout (100 chars)

<!-- prettier-ignore -->
```
 main │ ████████░░ 62% ~22 msgs │ $1.23 (+$0.50/hr)
 HOOKS:✓ │ HEALTH:A(91) │ DEBT:S0=0 S1=2 │ BLK 5hr:42%
```

### Narrow (80 chars)

<!-- prettier-ignore -->
```
 main │ ████████░░ 62% ~22 msgs │ $1.23
 HOOKS:✓ │ HEALTH:A │ DEBT:S0=0 │ 5hr:42%
```

### Narrow (60 chars)

<!-- prettier-ignore -->
```
 main │ ████░░ 62% │ $1.23
 HOOKS:✓ │ HEALTH:A │ S0=0
```

### Ultra-narrow (40 chars)

<!-- prettier-ignore -->
```
 main │ 62% │ $1.23
 ✓ │ A │ S0=0
```

### Line Breakdown

| Line | Purpose      | Content                                             |
| ---- | ------------ | --------------------------------------------------- |
| 1    | Navigation   | Branch, context bar+estimate, cost (+ burn rate)    |
| 2    | System state | Hook status, health grade, debt counts, block timer |

### Color Description

**Line 1:**

- Branch — cyan
- Context bar — standard gradient
- Cost — green/yellow/red
- Burn rate `(+$0.50/hr)` — dim

**Line 2:**

- `HOOKS:✓` — green; `HOOKS:FAIL` — red blinking
- `HEALTH:A(91)` — green (A/B), yellow (C), red (D/F)
- `DEBT:S0=0` — green (0), red (>0)
- Block timer — dim, yellow at <20%

### Assessment

| Criterion              | Rating    | Notes                                               |
| ---------------------- | --------- | --------------------------------------------------- |
| **Min width**          | ~40ch     | Both lines degrade independently                    |
| **Max info density**   | Very high | 8+ data points across two lines                     |
| **Implementation**     | High      | Needs all data sources + two-line rendering in hook |
| **Accessibility**      | Good      | All text labels, no icon dependency                 |
| **Narrow degradation** | Good      | Each line has independent priority dropping         |
| **Cognitive load**     | Medium    | Two lines is easy to scan once spatial memory forms |

**Pros:** Room to breathe — no segment feels cramped; clear separation between
"where am I" and "how's the system"; enough space for labels (no cryptic
abbreviations needed); easy to add new widgets without crowding existing ones.

**Cons:** Permanently consumes an extra terminal line; some users viscerally
dislike multi-line status (feels "heavy"); Claude Code's statusline API may not
support multi-line cleanly (needs verification); the second line may feel like
visual noise during focused coding.

**Best for:** Users who want a comprehensive dashboard view at all times.
Particularly good for SoNash's health-monitoring use case.

**Real-world analog:** vim airline (multi-line mode), some tmux configs with two
status bars (status + status2).

---

## Pattern E: Anomaly-Driven (Adaptive)

> **Philosophy:** Quiet when everything is fine. Noisy when something needs
> attention. The status bar earns its visual weight only when there is an
> anomaly to surface.

### Normal State (everything OK)

<!-- prettier-ignore -->
```
main │ ████░░░░░░ 28%
```

### Anomaly: High Context Usage

<!-- prettier-ignore -->
```
main │ $1.23 │ ████████████████░░ 84% ~6 msgs ⚠ COMPACT SOON
```

### Anomaly: Hook Failure

<!-- prettier-ignore -->
```
main │ HOOKS:FAIL(2) │ ████░░░░░░ 28%
```

### Anomaly: Critical Debt

<!-- prettier-ignore -->
```
main │ S0:3! │ ████░░░░░░ 28%
```

### Anomaly: Multiple Issues (worst case)

<!-- prettier-ignore -->
```
main │ HOOKS:FAIL │ S0:3! │ $8.23 │ ████████████████░░ 84% ~6 msgs
```

### Anomaly: Cost Spike

<!-- prettier-ignore -->
```
main │ $5.41 (+$2.10/hr) │ ████████░░ 62%
```

### State Transition Rules

| Metric       | Normal (hidden) | Warning (appears)   | Critical (highlighted) |
| ------------ | --------------- | ------------------- | ---------------------- |
| Context      | <50% used       | >=65% used          | >=80% used (blinking)  |
| Cost         | <$2.00 session  | >=$2 (shows amount) | >=$5 (red + burn rate) |
| Hooks        | All passing     | Warnings exist      | Failures exist         |
| Debt S0      | S0=0            | --                  | S0>0 (always critical) |
| Health Grade | A or B          | C (shows grade)     | D or F (red + grade)   |
| Block Timer  | >30% remaining  | <20% remaining      | <10% remaining         |

### Narrow (60 chars, anomaly state)

<!-- prettier-ignore -->
```
main │ HOOKS:FAIL │ 84% ~6 ⚠
```

### Ultra-narrow (40 chars, anomaly state)

<!-- prettier-ignore -->
```
main │ FAIL │ 84%⚠
```

### Color Description

**Normal state:** All dim/subdued — branch in cyan, context bar in green.
Nothing grabs attention.

**Anomaly state:** Only the anomalous segment gets bright/saturated color.
Everything else stays dim. The anomaly "pops" from the noise floor.

- Warning — yellow foreground
- Critical — red foreground, optional blink for context >=80%
- `⚠` marker — yellow, appears only during warnings/criticals

### Assessment

| Criterion               | Rating            | Notes                                                                   |
| ----------------------- | ----------------- | ----------------------------------------------------------------------- |
| **Min width (normal)**  | ~20ch             | Same as Pattern A when quiet                                            |
| **Min width (anomaly)** | ~40ch             | Expands only as needed                                                  |
| **Max info density**    | Adaptive          | Low normally, high during anomalies                                     |
| **Implementation**      | High              | Needs threshold logic, state tracking, conditional rendering            |
| **Accessibility**       | Good              | Text labels, no icons required; color enhances but text carries meaning |
| **Narrow degradation**  | Excellent         | Normal state is already minimal; anomaly state has priority dropping    |
| **Cognitive load**      | Very low normally | Nothing to parse when fine; anomalies self-announce                     |

**Pros:** Respects attention as a finite resource; status bar is invisible when
it should be invisible; anomalies FORCE attention because the bar visually
changes (motion/color draws the eye); naturally maps to SoNash's project health
philosophy; best signal-to-noise ratio of any pattern.

**Cons:** Users might forget the statusline exists (can't check cost proactively
without running a command); "what counts as anomaly" requires tuning and may
feel arbitrary initially; implementation is the most complex (threshold engine);
a bug in threshold detection could silently hide real problems.

**Best for:** SoNash's stated design goal of "anomaly-driven, quiet when fine."
This was the recommended approach from prior research.

**Real-world analog:** starship (conditional modules), macOS menu bar (badges
only on problems), car dashboard warning lights.

---

## Pattern F: Dashboard-Style

> **Philosophy:** Treat the status area as a mini-dashboard with a header,
> metrics row, and progress bar. Visual structure through lines and centering.

### Layout (100 chars)

<!-- prettier-ignore -->
```
───────────────────────── SoNash Session #234 ──────────────────────────
 main   $1.23   5hr:42%   HEALTH:A   S0:0   HOOKS:✓
████████████████████████████████░░░░░░░░░░░░ 62% ~22 msgs remaining
```

### Alternative: Boxed Dashboard

<!-- prettier-ignore -->
```
┌──────────────────────── SoNash S#234 ─────────────────────────┐
│  main  │ $1.23 │ 5hr:42% │ HEALTH:A │ S0=0 │ HOOKS:✓        │
│ ████████████████████████████████░░░░░░░░░░░░ 62% ~22 msgs    │
└──────────────────────────────────────────────────────────────────┘
```

### Narrow (60 chars)

<!-- prettier-ignore -->
```
──────── SoNash S#234 ────────
 main  $1.23  A  S0:0  ✓
██████████████░░░░░░ 62% ~22
```

### Ultra-narrow (40 chars)

<!-- prettier-ignore -->
```
──── S#234 ────
main $1.23 A ✓
██████░░░░ 62%
```

### Color Description

- Header line (`───`) — dim white
- Session identifier — bold white
- Metrics row — each segment gets its own color (branch cyan, cost
  green/yellow/red, etc.)
- Progress bar — full-width gradient, takes entire bottom line

### Assessment

| Criterion              | Rating    | Notes                                                       |
| ---------------------- | --------- | ----------------------------------------------------------- |
| **Min width**          | ~40ch     | Degrades but header line still takes space                  |
| **Max info density**   | Very high | 3 lines = lots of room                                      |
| **Implementation**     | Very high | Multi-line with box drawing, centering, full-width bar      |
| **Accessibility**      | Good      | All text, no icons; box chars are universal UTF-8           |
| **Narrow degradation** | Fair      | Box/header wastes horizontal space at narrow widths         |
| **Cognitive load**     | Medium    | Structured layout makes scanning easy, but 3 lines is heavy |

**Pros:** Most visually polished option; full-width progress bar is very
readable; the header provides clear session identification; dashboard mental
model is familiar from web UIs; easy to add new metrics (just add to row 2).

**Cons:** Three lines is a LOT of terminal real estate; the decorative header
line adds zero information; box-drawing characters can break in some terminals
(especially SSH through certain proxies); feels "heavy" for a CLI tool; may
conflict with Claude Code's own UI chrome.

**Best for:** Dedicated dashboard or monitoring view, not a persistent status
bar. Could work as a `/dashboard` command output rather than always-on status.

**Real-world analog:** htop header, btop, lazygit status area.

---

## Pattern G: Sparkline/Graph-Based

> **Philosophy:** Replace numbers with visual trends. A sparkline tells you
> direction, not just magnitude.

### Layout (100 chars)

<!-- prettier-ignore -->
```
main │ ▁▂▃▅▇ cost │ ▇▅▃▂▁ context │ HEALTH:A │ S0:0 │ HOOKS:✓
```

### With Numeric Labels

<!-- prettier-ignore -->
```
main │ $▁▂▃▅▇ $1.23 │ ▇▅▃▂▁ 62% │ A(91) │ S0:0
```

### Context Sparkline Detail (shows last N context snapshots)

<!-- prettier-ignore -->
```
main │ ▁▁▂▂▃▃▄▅▅▆ 62% │ $▁▁▂▃▅ $1.23 │ A │ ✓
```

### Narrow (60 chars)

<!-- prettier-ignore -->
```
main │ ▁▂▃▅▇ $1.23 │ ▇▃▁ 62%
```

### Ultra-narrow (40 chars)

<!-- prettier-ignore -->
```
main │ $1.23 │ 62%
```

### Sparkline Character Reference

| Character | Block Height | Value Range |
| --------- | ------------ | ----------- |
| `▁`       | 1/8          | 0-12%       |
| `▂`       | 2/8          | 13-25%      |
| `▃`       | 3/8          | 26-37%      |
| `▄`       | 4/8          | 38-50%      |
| `▅`       | 5/8          | 51-62%      |
| `▆`       | 6/8          | 63-75%      |
| `▇`       | 7/8          | 76-87%      |
| `█`       | 8/8          | 88-100%     |

Note: These are U+2581 through U+2588. They render wider than normal characters
in many monospace fonts, which can cause alignment issues.

### Color Description

- Cost sparkline — green (low trend), yellow (rising), red (spike)
- Context sparkline — green (plenty left), grading to red (filling up)
- Each sparkline character can be individually colored to show the gradient

### Assessment

| Criterion              | Rating    | Notes                                                                                                                                                          |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Min width**          | ~35ch     | Sparklines need 5-8 chars minimum to show a trend                                                                                                              |
| **Max info density**   | Very high | Encodes temporal trend in <10 chars                                                                                                                            |
| **Implementation**     | Very high | Needs historical data storage (cost/context over time), sparkline rendering                                                                                    |
| **Accessibility**      | Poor      | Sparkline chars may render incorrectly; width issues in some fonts; colorblind users can't distinguish colored sparklines; screen readers can't interpret them |
| **Narrow degradation** | Fair      | Sparklines compress poorly — they need minimum chars to convey trend; fall back to numbers                                                                     |
| **Cognitive load**     | Medium    | "Is that going up or down?" is instant; exact values require the number too                                                                                    |

**Pros:** Encodes time-series information that no other pattern can show — "is
cost accelerating?" and "how fast is context filling?" are answered at a glance;
visually distinctive and memorable; sparklines are an Edward Tufte classic for
information density.

**Cons:** Requires historical data persistence (need to track cost/context over
the session); Unicode block chars render at inconsistent widths across terminals
and fonts; sparklines without numeric labels are ambiguous ("is that $2 or
$20?"); adds significant implementation complexity for questionable value in a
status bar context.

**Best for:** Supplementary widget within another pattern, not a standalone
design. A cost sparkline inside Pattern B or E would be powerful.

**Real-world analog:** GitHub contribution graphs, iOS battery usage graph,
iTerm2 CPU sparkline component.

---

## Pattern H: Color-Zone

> **Philosophy:** The entire status bar changes color based on overall system
> state. No parsing needed — the color IS the message.

### GREEN Zone (All Clear)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [on green background]  main │ 28% context │ all clear                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### YELLOW Zone (Warnings)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [on yellow background]  main │ 62% context │ $3.41 │ hooks: 1 warn                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### RED Zone (Critical)

<!-- prettier-ignore -->
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [on red background]  main │ 84% context ~6 msgs │ $8.23 │ HOOKS:FAIL │ S0:3                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Transition Logic

```
Zone = worst(
  context >= 80%       → RED,
  context >= 65%       → YELLOW,
  hooks_failing        → RED,
  hooks_warnings       → YELLOW,
  cost >= $5           → RED,
  cost >= $2           → YELLOW,
  S0 > 0               → RED,
  health_grade in D,F  → RED,
  health_grade == C    → YELLOW,
  default              → GREEN
)
```

### Narrow (60 chars, yellow zone)

<!-- prettier-ignore -->
```
[yellow bg] main │ 62% │ $3.41 │ 1 warn
```

### Ultra-narrow (40 chars, red zone)

<!-- prettier-ignore -->
```
[red bg] main │ 84% │ FAIL
```

### Color Description

- GREEN zone: green or dark-green background, white text
- YELLOW zone: yellow/amber background, dark text
- RED zone: red background, white text, optional bold for critical items
- Text within each zone uses high-contrast foreground against the zone
  background

### Assessment

| Criterion              | Rating   | Notes                                                                                                                                  |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Min width**          | ~25ch    | Color carries most of the information                                                                                                  |
| **Max info density**   | Medium   | Still shows text segments, but color does heavy lifting                                                                                |
| **Implementation**     | Medium   | Threshold logic + background color control via ANSI codes                                                                              |
| **Accessibility**      | Poor     | Completely dependent on color perception; colorblind users (8% of males) get zero signal from the zone change; MUST have text fallback |
| **Narrow degradation** | Good     | Color carries signal regardless of width                                                                                               |
| **Cognitive load**     | Very low | "Green = good, red = bad" is universal                                                                                                 |

**Pros:** Highest possible signal-to-noise ratio for "is everything OK?";
peripheral vision catches color changes even when not reading the bar; VS Code
proved this works (blue/orange/purple state); the simplest mental model
possible; works even at 20-char width (color alone tells the story).

**Cons:** Color-only signaling is an accessibility failure (colorblind users,
low-contrast terminals, SSH sessions without color support); the "worst metric
wins" logic means one yellow metric makes the entire bar yellow even if
everything else is green (loses nuance); background colors can clash with
terminal themes; the status bar text must carry all information for non-color
scenarios.

**Best for:** Combined with another pattern as an enhancement. Pattern E +
Pattern H = anomaly-driven with color zones. Never use color as the SOLE
information channel.

**Real-world analog:** VS Code status bar (blue/orange/purple), traffic lights,
macOS stoplight buttons.

---

## Comparison Matrix

<!-- prettier-ignore -->
| Pattern | Lines | Min Width | Info Density | Impl Complexity | Accessibility | Narrow Degrade | Cognitive Load |
| ------- | ----- | --------- | ------------ | --------------- | ------------- | -------------- | -------------- |
| A: Minimal       | 1 | 20ch | Very Low  | Trivial | Excellent | Excellent | Near Zero |
| B: Segmented     | 1 | 35ch | High      | Medium  | Good      | Good      | Medium    |
| C: Icon-Based    | 1 | 25ch | Very High | Medium  | Poor      | Good      | High→Low  |
| D: Multi-Line    | 2 | 40ch | Very High | High    | Good      | Good      | Medium    |
| E: Anomaly-Driven| 1* | 20-40ch | Adaptive | High   | Good      | Excellent | Very Low  |
| F: Dashboard     | 3 | 40ch | Very High | Very High | Good   | Fair      | Medium    |
| G: Sparkline     | 1 | 35ch | Very High | Very High | Poor   | Fair      | Medium    |
| H: Color-Zone    | 1 | 25ch | Medium    | Medium  | Poor      | Good      | Very Low  |

\*Pattern E uses 1 line normally, can expand to 1 dense line during anomalies.

### By SoNash Use Case Fit

| Priority | Pattern                                  | Rationale                                                                                                    |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **1st**  | E (Anomaly) + H (Color) hybrid           | Best signal-to-noise; aligns with "quiet when fine" philosophy; color zones enhance but text carries meaning |
| **2nd**  | B (Segmented) with E thresholds          | Good fallback if anomaly logic proves too complex; static segments are simpler                               |
| **3rd**  | D (Multi-Line)                           | If two lines are acceptable, gives the most room for health data                                             |
| **4th**  | B + G (Segmented with sparkline accents) | Adds temporal dimension; high implementation cost                                                            |

---

## Degradation Strategies

### Priority-Based Segment Dropping (tmux approach)

Used by Patterns B, C, D, E. Each segment has a priority number. As width
shrinks, lowest-priority segments are dropped first.

```
Width >= 100: [branch] [session] [cost] [block] [hooks] [health] [debt] [context-bar+estimate]
Width >= 80:  [branch] [cost] [block] [hooks] [context-bar+estimate]
Width >= 60:  [branch] [cost] [context-bar]
Width >= 40:  [branch] [cost] [context-%]
Width < 40:   [branch] [context-%]
```

### Progressive Detail Reduction (starship approach)

Used by Patterns A, E. Instead of dropping segments, reduce detail within
segments.

```
Wide:   ████████░░ 62% ~22 msgs remaining
Medium: ████████░░ 62% ~22
Narrow: ████░░ 62%
Tiny:   62%
```

### Line Collapse (multi-line specific)

Used by Pattern D, F. When width shrinks past a threshold, collapse from
multi-line to single-line.

```
Wide (2 lines):
   main │ ████████░░ 62% ~22 msgs │ $1.23
   HOOKS:✓ │ HEALTH:A │ DEBT:S0=0 │ 5hr:42%

Narrow (collapses to 1 line):
   main │ ✓ │ A │ ████░░ 62% │ $1.23
```

### Truncation with Ellipsis (VS Code approach)

Used as last resort. Long segment values get truncated.

```
Wide:   feature/implement-statusline-widgets
Medium: feature/implement-sta…
Narrow: feature/…
```

---

## Recommendation for SoNash

Based on this analysis, the recommended approach for SoNash is a **hybrid of
Pattern E (Anomaly-Driven) with Pattern H (Color-Zone) enhancements** and
**Pattern B (Segmented) as the underlying segment architecture**.

### Proposed Design: "Adaptive Segmented"

**Normal state** (all metrics healthy):

<!-- prettier-ignore -->
```
main │ ████░░░░░░ 28%
```

(dim colors, minimal presence — Pattern A equivalent)

**Warning state** (one or more warnings):

<!-- prettier-ignore -->
```
[yellow accent] main │ $3.41 │ hooks:1⚠ │ ████████░░ 62% ~22
```

(warning segments appear, color accent on the anomalous item)

**Critical state** (one or more criticals):

<!-- prettier-ignore -->
```
[red accent] main │ HOOKS:FAIL │ S0:3! │ $8.23 │ ████████████████░░ 84% ~6
```

(all relevant segments visible, critical items in red)

### Why This Hybrid

1. **Attention-respecting:** Normal state is invisible (Pattern A/E)
2. **Self-documenting:** Anomaly segments use text labels, not just icons
   (accessibility)
3. **Color as enhancement, not sole signal:** Color accents draw the eye but
   text carries meaning (Pattern H fix)
4. **Progressive disclosure:** Only shows what you need when you need it
5. **Width-resilient:** Normal state needs only ~20 chars; worst-case anomaly
   uses priority dropping
6. **Builds on existing code:** The current SoNash statusline already has
   color-coded context bars and conditional task display — this extends that
   approach
7. **Matches project philosophy:** "Quiet when fine, noisy when problems" aligns
   with SoNash's evidence-based, privacy-first design principles

---

## Sources

- [Evil Martians: CLI UX Best Practices](https://evilmartians.com/chronicles/cli-ux-best-practices-3-patterns-for-improving-progress-displays)
- [Tao of tmux: Status Bar](https://tao-of-tmux.readthedocs.io/en/latest/manuscript/09-status-bar.html)
- [Baeldung: tmux Status Bar Customization](https://www.baeldung.com/linux/tmux-status-bar-customization)
- [Coderwall: Responsive tmux Status Bar](https://coderwall.com/p/trgyrq/make-your-tmux-status-bar-responsive)
- [lualine.nvim GitHub](https://github.com/nvim-lualine/lualine.nvim)
- [mini.statusline GitHub](https://github.com/echasnovski/mini.statusline)
- [A Boring Statusline for Neovim](https://zignar.net/2022/01/21/a-boring-statusline-for-neovim/)
- [Starship Configuration](https://starship.rs/config/)
- [Starship GitHub](https://github.com/starship/starship)
- [VS Code Status Bar UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/status-bar)
- [VS Code Theme Colors: Status Bar](https://code.visualstudio.com/api/references/theme-color)
- [iTerm2 Status Bar Documentation](https://iterm2.com/documentation-status-bar.html)
- [ccstatusline npm](https://www.npmjs.com/package/ccstatusline)
- [ccstatusline GitHub](https://github.com/sirmalloc/ccstatusline)
- [Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline)
- [CC Statusline: Creating The Perfect Status Line](https://www.aihero.dev/creating-the-perfect-claude-code-status-line)
- [ClaudeLog: ccstatusline Guide](https://claudelog.com/claude-code-mcps/ccstatusline/)
- [Command Line Interface Guidelines](https://clig.dev/)
- [Unicode Progress Bars](https://changaco.oy.lc/unicode-progress-bars/)
- [Mike42: Better CLI Progress Bars with Unicode](https://mike42.me/blog/2018-06-make-better-cli-progress-bars-with-unicode-block-characters)
- [Sparkline in Unicode - Rosetta Code](https://rosettacode.org/wiki/Sparkline_in_unicode)
- [shox: Terminal Status Bar](https://github.com/liamg/shox)
