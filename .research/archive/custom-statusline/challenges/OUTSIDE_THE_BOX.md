# Statusline Research: What the Structured Research Didn't Ask

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
**Parent:** [RESEARCH_OUTPUT.md](../RESEARCH_OUTPUT.md)
**Purpose:** Lateral analysis of assumptions, alternatives, and blind spots in the statusline research
<!-- prettier-ignore-end -->

---

## 1. What If the Statusline Isn't the Right Abstraction?

### Insight 1.1: ntfy.sh Already Solves the Director's Core Problem Better Than Any Widget

**Rating: HIGH (decision-changing)**

The CLI tools research (D-25, D-40) already plans to install ntfy.sh with two
triggers: session-end and input-needed. These are exactly the two events that
actually require director intervention. The statusline research's 10-widget
design assumes the director is _watching the terminal_ -- but the entire point
of ntfy was that the director is _not watching the terminal_.

The statusline shows "context at 84% ~6 msgs" -- but to whom? If the user is
watching, they already see Claude's output. If they are not watching, the
statusline is invisible. ntfy can push "Context critical: ~6 messages remain,
session-end recommended" to the user's phone. That notification reaches the user
in every room of the house. The statusline only reaches them if they are staring
at the terminal.

**Actionable decision:** Before building any anomaly widget, define which
anomalies are "push-worthy" (ntfy) vs "glance-worthy" (statusline). The split
might be:

| Anomaly                  | Channel                | Why                                     |
| ------------------------ | ---------------------- | --------------------------------------- |
| Context >= 80%           | ntfy push + statusline | Director must act (session-end)         |
| Hook failure             | statusline only        | Director acts next time they look       |
| Cost >= $5               | ntfy push              | Budget decision, may not be at terminal |
| S0 debt > 0              | statusline only        | Informational, not urgent               |
| Input needed (2min idle) | ntfy push              | Already planned (D-40)                  |
| Session complete         | ntfy push              | Already planned (D-40)                  |
| Health grade C or below  | statusline only        | Trend, not emergency                    |
| Rate limit >= 90%        | ntfy push              | May need to pause work                  |

This table does not exist anywhere in the statusline research. It should be the
_first_ design artifact -- before widget mockups, before implementation
approach.

### Insight 1.2: The Terminal Bell Is Already Built Into Claude Code and Costs Zero Development

**Rating: HIGH (decision-changing)**

Claude Code has a built-in `preferredNotifChannel` setting that supports
`terminal_bell`. Setting
`claude config set --global preferredNotifChannel terminal_bell` enables an
audible beep when tasks complete or input is needed. This is zero-cost,
zero-maintenance, and already works on Windows Terminal.

The statusline research spent significant effort designing an "agent status"
widget (widget #8) to show `thinking`/`needs-you`/`done` states. The terminal
bell already communicates the transition from "thinking" to "done/needs-you" --
the only transition the director cares about.

Windows Terminal supports configuring the bell style (audible, visual flash, or
both) via `profiles.defaults.bellStyle`. The bell can also be combined with
Windows Terminal's built-in task-complete notification toast on Windows 11.

**Actionable decision:** Enable `terminal_bell` immediately as a zero-cost
baseline. This may eliminate the need for the agent status widget entirely. Test
whether the bell fires on the right events (task complete, permission request)
before investing in a custom widget that duplicates this.

### Insight 1.3: A Companion Dashboard Pane Would Be More Readable Than Cramming 10 Widgets Into 100 Characters

**Rating: MEDIUM (worth noting)**

The statusline research evaluated 8 layout patterns (A through H) but all share
one constraint: fitting data into the Claude Code statusline's single rendering
slot. An alternative exists: a companion TUI dashboard running in a split pane
via Windows Terminal's native split-pane support.

Windows Terminal supports
`wt -w 0 sp -V --size 0.25 --title "SoNash Health" bash -c "watch -n5 node .claude/tools/dashboard.js"`.
This would give a persistent 25%-width pane showing all health metrics in a
readable format, updated every 5 seconds. No 100-character width constraint. No
progressive degradation needed. Full color, multi-line, sparklines, everything.

However, this has real drawbacks:

- Consumes 25% of terminal width permanently
- Requires manual setup each session (or a session-start script)
- `watch` on Windows requires Git Bash or busybox-w32
- Cannot read Claude Code's stdin JSON (different process)
- Would need to read state files directly (already feasible per the research's
  Tier 2 data sources)

**Actionable decision:** This is a "Phase 2" option. Build the minimal
statusline first (2-3 widgets). If the user finds they want more data, a
companion pane is a better expansion path than cramming more widgets into the
statusline. The state files (hook-runs.jsonl, health-score-log.jsonl,
debt-summary-cache.json) are all readable by any process, not just the
statusline.

### Insight 1.4: OSC Window Title Is Free Real Estate the Research Ignored

**Rating: MEDIUM (worth noting)**

The statusline research never considered using the Windows Terminal tab/window
title as a secondary display channel. The OSC escape sequence `\033]0;TITLE\007`
sets the window/tab title from any script, including the statusline script
itself.

The statusline script could set the tab title to `SoNash S#234 | main | 28%`
while showing the anomaly-driven statusline content in the statusline area. This
effectively doubles the display surface at zero width cost. The tab title is
visible even when the terminal is minimized to the taskbar -- it shows in the
taskbar hover tooltip on Windows 11.

**Actionable decision:** Add
`process.stdout.write('\033]0;SoNash S#234 | ' + branch + ' | ' + usedPct + '%\007')`
to the statusline script. This moves the "always visible" identity data (session
number, branch, context %) to the tab title, freeing the statusline body
entirely for anomaly content. The tab title becomes the "normal state" and the
statusline body only appears when something is wrong.

---

## 2. What Can the User's Existing Tools Already Show?

### Insight 2.1: Starship Prompt Can Show Git State, Node Version, and Directory -- Three Things the Statusline Also Shows

**Rating: HIGH (decision-changing)**

Starship (planned for install per D-17) renders at every prompt. It natively
shows git branch, git status (dirty/clean/ahead/behind), Node.js version,
directory name, and command duration. The current statusline script
(`statusline.js` lines 91-100) spends 10-50ms on `git rev-parse` to get the
branch name. Starship already gets this at prompt render time.

The overlap is:

| Data             | Statusline                 | Starship          | Both needed?             |
| ---------------- | -------------------------- | ----------------- | ------------------------ |
| Git branch       | Yes (10-50ms shell-out)    | Yes (native)      | No -- Starship wins      |
| Directory name   | Yes                        | Yes (native)      | No -- Starship wins      |
| Git dirty state  | Planned but cut from scope | Yes (native)      | No -- Starship covers it |
| Node version     | No                         | Yes (native)      | N/A                      |
| Command duration | No                         | Yes (> threshold) | N/A                      |
| Context %        | Yes (stdin JSON)           | No                | Yes -- statusline only   |
| Cost             | Yes (stdin JSON)           | No                | Yes -- statusline only   |
| Hook health      | Yes (file read)            | No                | Yes -- statusline only   |

Once Starship is installed, the statusline should NOT duplicate branch,
directory, or git state. Those are prompt concerns, not statusline concerns.
This cuts the statusline down to what _only_ the statusline can provide: data
from Claude Code's stdin JSON (context, cost, rate limits, agent, model) and
data from SoNash state files (hooks, health, debt).

The current statusline script shows
`model | branch | task | directory | context` -- three of those five items
become redundant with Starship.

**Actionable decision:** Once Starship is installed, redesign the statusline to
show ONLY Claude Code session data + SoNash health data. Remove branch,
directory, and model from the statusline. This dramatically simplifies the
implementation and eliminates the 10-50ms git shell-out.

### Insight 2.2: lazygit Already Provides a Superior Git Dashboard

**Rating: LOW (interesting)**

lazygit (planned for install per D-19) provides a full TUI for git operations
including branch visualization, commit history, staging, stash, and merge
conflict resolution. The statusline's git-related widgets (branch display, dirty
count) are a pale shadow of what lazygit shows.

For a director who does not write code, lazygit is the tool for understanding
git state. The statusline's branch name serves only as orientation ("am I on the
right branch?") -- a question Starship already answers at the prompt.

**Actionable decision:** No direct action, but reinforces Insight 2.1: git data
in the statusline is redundant once Starship and lazygit are available.

### Insight 2.3: The Composite Stack (Starship + Minimal Statusline + ntfy + Terminal Bell) Covers Everything Without Building 10 Widgets

**Rating: HIGH (decision-changing)**

Mapping the original 10-widget plan to the available tool stack:

| Widget                      | Best Channel         | Why                                       |
| --------------------------- | -------------------- | ----------------------------------------- |
| 1. Git branch               | Starship prompt      | Renders at every prompt, native           |
| 2. Context bar + predictive | Statusline (KEEP)    | Only source: Claude stdin JSON            |
| 3. Session tracking         | Tab title (OSC)      | Identity info, always visible             |
| 4. Cost / rate limit        | Statusline (anomaly) | Only source: Claude stdin JSON            |
| 5. Hook health              | Statusline (anomaly) | Only source: SoNash state files           |
| 6. Health grade             | Statusline (anomaly) | Only source: SoNash state files           |
| 7. Debt S0 count            | Statusline (anomaly) | Only source: SoNash state files           |
| 8. Agent status             | Terminal bell + ntfy | Bell for state transitions, ntfy for idle |
| 9. PR review state          | Statusline (anomaly) | Only source: SoNash state files           |
| 10. Predictive compaction   | Merged into #2       | Same data source                          |

This reduces the statusline from 10 widgets to 6, with 4 handled by other
channels. The remaining 6 are split into 1 always-visible (context bar) and 5
anomaly-activated (cost, hooks, health, debt, PR review). The "quiet when fine,
noisy when problems" philosophy is preserved but with far less custom code.

**Actionable decision:** Adopt the composite stack model. Build only the widgets
that _cannot_ be served by Starship, ntfy, terminal bell, or tab title. This
cuts implementation effort by roughly 40% and maintenance burden proportionally.

---

## 3. The "Director, Not Developer" Angle

### Insight 3.1: Only Two Statusline States Actually Drive Director Behavior

**Rating: HIGH (decision-changing)**

The user's expertise profile states: "Role: Director, not developer. User
directs AI agents to write code; does not code themselves." The research
identified 10 widgets by surveying what a _developer_ might want to see.
Filtering through the director lens changes the picture dramatically.

A director's decision space during a session is narrow:

1. **Should I end this session?** (context running out, cost too high)
2. **Is something broken that will waste future work?** (hook failure, S0 debt)
3. **Does Claude need me?** (input required, permission needed)

Decision #3 is handled by terminal bell + ntfy (Insight 1.2). Decision #2 is
handled by anomaly-activated widgets. Decision #1 is the _only_ thing that
requires persistent, always-visible display.

This means the context bar with predictive compaction ("~N msgs left") is not
just "the most important widget" -- it may be the _only_ widget that drives
director behavior on every glance. Everything else is noise until it becomes an
anomaly.

A developer would want branch, dirty count, model, cost-per-hour, agent status,
and token speed because they are _working with_ those things. A director just
needs "is this session healthy?" and "how much runway is left?"

**Actionable decision:** The statusline's "normal state" should be brutally
minimal -- perhaps literally just the context bar:

```
████░░░░░░ 28%
```

No branch (Starship shows it). No model (irrelevant to director decisions). No
session number (tab title shows it). No cost (not actionable below $2). The bar
_is_ the statusline. When anomalies appear, the bar grows. When everything is
fine, it is one tiny quiet gauge.

### Insight 3.2: A Three-State Session Health Indicator May Be the Optimal Director Interface

**Rating: MEDIUM (worth noting)**

Drawing from agentic AI oversight research, the optimal supervisor dashboard
shows three tiers of autonomy status:

- **Green (autonomous):** Agent is working, no intervention needed
- **Yellow (advisory):** Something worth knowing, no immediate action needed
- **Red (intervention):** Director must act now

Mapping this to the statusline:

```
Normal:    ● 28%                          (green dot, just context)
Advisory:  ◆ 62% ~22 | $3.41 | hooks:1⚠  (yellow diamond, anomalies shown)
Critical:  ✕ 84% ~6 | HOOKS:FAIL | S0:3!  (red X, must act)
```

The single leading character (dot/diamond/X) becomes the primary signal. The
director can check the statusline in under 1 second: green means keep doing
whatever you are doing, yellow means glance at the details, red means come to
the terminal now. This directly operationalizes the agentic AI "tiered autonomy"
pattern for the SoNash context.

**Actionable decision:** Consider adding a single-character "session health
summary" as the leftmost element. This character alone could be the minimum
viable statusline -- everything after it is optional detail.

### Insight 3.3: The Model Name Widget Is Developer Vanity -- Directors Don't Care

**Rating: LOW (interesting)**

The current statusline script (line 81) shows the model name (e.g., "Opus 4.6
(1M context)"). Every third-party tool also shows the model. This is a developer
concern -- developers care which model is running because it affects code
quality and capability. The director cares about _outcomes_, not which model
produced them. The model name consumes 20-30 characters of precious statusline
width.

The context window size (200k vs 1M) is indirectly visible through the context
percentage -- a 1M context session at 28% has far more absolute runway than a
200k session at 28%, but the percentage is what drives the session-end decision.

**Actionable decision:** Remove model name from statusline. If the director ever
needs to know the model, it is in the session header at startup.

---

## 4. Maintenance Burden Over Time

### Insight 4.1: Each Widget Is a Coupling Point to an Unstable API Surface

**Rating: HIGH (decision-changing)**

The statusline research documented 6 "cheap data" sources (state files) and 14
"free data" fields (stdin JSON). Each widget that reads these sources creates a
maintenance dependency:

- **Stdin JSON schema changes**: Claude Code is pre-1.0. The `rate_limits`
  fields were added in v2.1.81 (3 days ago). Fields can be added, renamed, or
  removed in any release. The prior research already documented one tool
  (`mapleleafu/ccstatusline`) that went 404 in 3 days. Every field read is a
  potential breakage point.

- **State file format changes**: SoNash's own state files (`hook-runs.jsonl`,
  `health-score-log.jsonl`, `debt-summary-cache.json`) are maintained by SoNash
  hooks. When hooks change their output format, the statusline must be updated
  in lockstep. This is a coordination cost that does not exist today.

- **Windows rendering regressions**: Issue #31670 broke Windows rendering. Issue
  #32917 causes intermittent blank frames. Issue #12870 causes width truncation.
  Each widget adds visual surface area that can be affected by these
  regressions.

Quantifying the maintenance cost:

| Widget Count | Coupling Points | Expected Breaks/6mo | Fix Effort/Break |
| ------------ | --------------- | ------------------- | ---------------- |
| 3 widgets    | ~5              | 1-2                 | 15-30min         |
| 6 widgets    | ~10             | 2-4                 | 15-30min         |
| 10 widgets   | ~18             | 4-8                 | 15-45min         |

With 10 widgets, expect 4-8 maintenance incidents over 6 months. With 3 widgets,
expect 1-2. The difference is not enormous in absolute terms, but each incident
interrupts a session and may require investigation time to identify which widget
broke and why.

**Actionable decision:** Cap the initial release at 3-4 widgets maximum. Expand
only when a specific widget has been _requested by the user_ after actual use,
not because the research identified it as potentially useful.

### Insight 4.2: The Statusline Should Self-Validate Its Data Sources on Every Render

**Rating: MEDIUM (worth noting)**

Rather than discovering broken widgets when they produce garbled output, the
statusline script should verify each data source on every render:

```javascript
// Instead of: const health = JSON.parse(fs.readFileSync(healthFile))
// Do:
function safeReadWidget(filePath, parser, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = parser(fs.readFileSync(filePath, "utf8"));
    if (data === undefined || data === null) return fallback;
    return data;
  } catch {
    return fallback;
  }
}
```

The fallback should be "widget disappears" (consistent with anomaly-driven
design), not "widget shows error" (which adds noise). A widget that cannot read
its data source is equivalent to "no anomaly detected" -- safe to hide.

This pattern already exists in the current statusline.js (the `findCurrentTask`
function fails silently). Extending it to all widgets creates a self-healing
statusline that degrades gracefully when data sources change.

**Actionable decision:** Make silent fallback the mandatory pattern for every
widget. No widget should ever produce an error or garbled output. If the data
source is unavailable, the widget vanishes.

### Insight 4.3: A Self-Audit Skill Would Catch Widget Drift Before Users Notice

**Rating: LOW (interesting)**

The SoNash ecosystem already has multiple audit skills (hook-ecosystem-audit,
script-ecosystem-audit, session-ecosystem-audit). A `statusline-health-audit`
skill could run periodically (e.g., in session-start or weekly) and verify:

1. All state files referenced by widgets exist and are recent (< 24h old)
2. The stdin JSON schema matches expected field names
3. The statusline script renders without errors given mock input
4. Widget output fits within 100-character width at all breakpoints

This is over-engineering for 3 widgets. It becomes worthwhile at 6+ widgets or
if the statusline is rewritten in Go (where the audit script would need to parse
Go source to find field references).

**Actionable decision:** Defer. Revisit if widget count exceeds 5.

---

## 5. What About the Other Locale?

### Insight 5.1: The Statusline Works Identically at Both Locales -- But Installation Differs

**Rating: MEDIUM (worth noting)**

The statusline renders inside Claude Code's process. Claude Code is installed at
both locales. The `~/.claude/settings.json` file that configures the statusline
command is per-machine (not synced via git). The statusline _script_ is in the
repo (`.claude/hooks/global/statusline.js`) and syncs via git.

This means:

- **Script sync:** Automatic via `git pull`. Both locales get the same script.
- **Settings sync:** Manual. The `statusLine.command` in `settings.json` must be
  configured at each locale. The path format differs:
  - Home: `C:/Users/jason/...`
  - Work: `C:/Users/jbell/...`
- **Trust file:** The `~/.claude/.claude.json` workaround for Windows (Insight
  from RESEARCH_OUTPUT.md Theme 6) must be created at each locale with the
  correct project path.
- **State files:** Synced via git (`.claude/state/` is committed). Both locales
  see the same hook health, debt counts, etc. -- but only if the user
  `git pull`s before starting a session at the other locale.

If a Go binary is chosen (Option 2/3), it must be cross-compiled or built at
each locale. The home locale has full admin and can install Go or use
pre-compiled binaries. The work locale can use `go install` (Go is available at
`C:/Users/jbell/bin/go`) or receive a committed `.exe` in the repo.

**Actionable decision:** For a Go binary, commit the compiled `.exe` to the repo
in `tools/statusline/` (or `.claude/tools/`). Both locales get it via git pull.
Binary size for a simple Go program is ~5-8MB, acceptable for repo storage. For
Node.js, no action needed -- the script already syncs.

### Insight 5.2: The Home Locale Has No Corporate Restrictions -- It Could Run a Richer Stack

**Rating: LOW (interesting)**

The home locale (`C:\Users\jason`) has full admin, no PATH restrictions, and can
install anything. In theory, it could run a richer statusline setup (e.g.,
tmux-based dashboard, additional TUI tools, custom fonts) that would not work at
the work locale.

However, locale-specific configurations create divergence. If the user develops
a workflow habit around a rich dashboard at home, returning to the minimal
statusline at work feels like a downgrade. The CLI tools research explicitly
chose tools that work at both locales to avoid this problem (D-04, D-07).

**Actionable decision:** Design for the work locale's constraints. Anything that
works at work will also work at home. Do not create locale-specific statusline
configurations.

### Insight 5.3: State File Freshness Varies by Locale

**Rating: MEDIUM (worth noting)**

State files like `hook-runs.jsonl` and `health-score-log.jsonl` are committed to
git and synced across locales. But they are only _updated_ at the locale where
work happens. If the user works at home for 3 days, then switches to work, the
state files at work (after `git pull`) reflect home-locale data.

For most widgets, this is fine -- the data is project-level, not locale-level.
Hook health from the last session applies regardless of where it ran. But cost
data and rate limit data (from Claude's stdin JSON) are per-session and
locale-irrelevant -- they come fresh from Claude Code on every render.

**Actionable decision:** No special handling needed. State files are
project-scoped, not locale-scoped. The statusline correctly shows "last known
state" which is always the most recent session regardless of locale.

---

## 6. Synthesis: The Minimal Viable Statusline

Combining all HIGH-rated insights produces a radically different design from the
research's 10-widget recommendation:

### Before (Research Recommendation)

```
housecleaning | $3.41 | 5hr:72% | ████████░░ 62% ~22 msgs
```

10 widgets, 6-18 hours implementation, Go binary or enhanced monolith.

### After (Lateral Analysis)

**Tab title (OSC):** `SoNash S#234 | housecleaning` **Starship prompt:**
` housecleaning  v22.1.0  node v22` **Statusline (normal):** `● 28%`
**Statusline (anomaly):** `◆ 62% ~22 | $3.41 | hooks:1⚠` **ntfy push:** "Context
critical: ~6 msgs remain" (phone notification) **Terminal bell:** _beep_ (task
complete / input needed)

### What This Buys

| Metric                       | 10-Widget      | Composite Stack                        |
| ---------------------------- | -------------- | -------------------------------------- |
| Custom statusline widgets    | 10             | 3-4                                    |
| Implementation effort        | 6-18h          | 2-4h                                   |
| Maintenance coupling points  | ~18            | ~6                                     |
| Expected breaks/6mo          | 4-8            | 1-2                                    |
| Director decisions supported | All            | All (via multiple channels)            |
| Information missed           | None           | None                                   |
| Channels used                | 1 (statusline) | 4 (statusline + prompt + title + push) |

### Recommended Build Order

1. **Immediate (15 min):** Enable `terminal_bell` via Claude Code config. Zero
   code.
2. **Phase 0 (30 min):** Fix fnm shim overhead, create trust file, add OSC title
   output to existing statusline script.
3. **Phase 1 (1-2h):** Reduce current statusline to context bar only + anomaly
   framework. Remove branch, model, directory (Starship will cover those). Add
   the single-character health summary indicator.
4. **Phase 2 (1-2h):** Add cost and hook health as anomaly widgets. These are
   the two anomalies most likely to require director action.
5. **Phase 3 (when ntfy is installed):** Wire ntfy push for context >= 80% and
   rate limit >= 90%. Remove agent status widget from statusline scope.
6. **Phase 4 (after 2+ weeks of use):** Evaluate whether health grade, debt S0,
   and PR review widgets are actually needed based on real usage patterns. Add
   only the ones the user explicitly requests.

---

## Confidence Assessment

| Insight                   | Confidence | Basis                                                                |
| ------------------------- | ---------- | -------------------------------------------------------------------- |
| 1.1 ntfy vs statusline    | HIGH       | ntfy already planned (D-25, D-40), channel overlap undeniable        |
| 1.2 Terminal bell         | HIGH       | Claude Code docs confirm feature, zero-cost to enable                |
| 1.3 Companion dashboard   | MEDIUM     | Feasible but untested; Windows Terminal split-pane API confirmed     |
| 1.4 OSC window title      | HIGH       | Standard VT100 sequence, confirmed working on Windows Terminal       |
| 2.1 Starship overlap      | HIGH       | Starship config docs confirm all overlapping modules                 |
| 2.2 lazygit overlap       | HIGH       | Feature set well-documented                                          |
| 2.3 Composite stack       | HIGH       | Each component independently verified                                |
| 3.1 Director decisions    | HIGH       | User expertise profile explicitly states "director, not developer"   |
| 3.2 Three-state indicator | MEDIUM     | Agentic AI oversight research supports pattern, untested in terminal |
| 3.3 Model name removal    | HIGH       | Logical extension of director-not-developer principle                |
| 4.1 Maintenance coupling  | MEDIUM     | Break estimates are projections, not measurements                    |
| 4.2 Self-validation       | HIGH       | Pattern already used in existing statusline.js                       |
| 4.3 Self-audit skill      | LOW        | Speculative, deferred                                                |
| 5.1 Cross-locale install  | HIGH       | Both locales verified, constraints documented                        |
| 5.2 Locale divergence     | MEDIUM     | Design principle, not technical finding                              |
| 5.3 State freshness       | HIGH       | Git-synced state files are project-scoped by design                  |
