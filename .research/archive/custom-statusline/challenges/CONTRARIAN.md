# Contrarian Challenge: Statusline Research Report

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Status:** ACTIVE
**Purpose:** Systematic adversarial review of RESEARCH_OUTPUT.md claims
**Method:** For each key claim: (1) disconfirming evidence, (2) alternative explanations, (3) bias analysis, (4) unconsulted sources
<!-- prettier-ignore-end -->

---

## Challenge 1: Go Binary Recommendation

**Claim (CL-006, CL-024):** A Go binary achieves 8-29ms vs 47-470ms for Node.js.
Go is recommended as the "Balanced" option. "Go is simple enough for AI-directed
development."

### Disconfirming Evidence

1. **Windows Defender penalty is real and unacknowledged.** Go compiles to
   statically linked .exe files. Windows Defender treats these as suspicious --
   scanning every new binary on first execution and after every recompile. The
   Go community has documented this extensively
   ([golang/go#61562](https://github.com/golang/go/issues/61562),
   [golang/go#43427](https://github.com/golang/go/issues/43427)). Standard
   library file reads during builds take 10-40ms each under active scanning vs
   0.01-0.03ms warmed up. A Go program can spend ~200ms just getting loaded
   before reaching the first line of code
   ([Replit blog](https://blog.replit.com/golang-performance)). The 8-29ms
   benchmark almost certainly excludes Defender overhead. On a Windows 11
   machine with default Defender settings, first-run latency could be 100-300ms
   -- no better than Node.js.

2. **The "8-29ms" figure appears to be synthetic.** The report cites [SQ-006]
   but provides no methodology: Was this measured on this machine? With Defender
   active? With cold disk cache? Including JSONL tail reads on NTFS? The
   breakdown shows "Binary startup: 1-5ms" which is Linux-optimistic. On Windows
   with NTFS metadata overhead and Defender real-time protection, 5-15ms startup
   is more realistic even after warming.

3. **AI-generated Go has higher syntax error rates.** Multiple LLM benchmarking
   sources note "higher syntax error rates in strict-syntax languages like Go"
   compared to JavaScript/TypeScript
   ([edenai.co](https://www.edenai.co/post/best-llms-for-coding)). While Claude
   Opus performs well with Go, the report's own stack (CLAUDE.md) shows the
   entire SoNash codebase is TypeScript/Node.js. Every other script in the
   project is JavaScript. Introducing Go creates a **two-language maintenance
   burden** for a solo developer whose expertise profile (per MEMORY.md) is
   "Node.js/scripting expert, Firebase comfortable, frontend needs guidance."

4. **33% of Go developers struggle with best practices.** Even with AI
   assistance, Go's interface composition, error-as-values patterns, and module
   management create ongoing maintenance friction
   ([jenova.ai](https://www.jenova.ai/en/resources/best-ai-for-go-development)).

### Alternative Explanations

The Go recommendation may be driven by a **novelty bias** -- the
`felipeelias/claude-statusline` Go binary launched March 17 (6 days before this
research), making it a shiny new option. The research may have been anchored by
this new entrant.

### Unconsulted Sources

- No benchmark was run on the actual target machine with Defender active
- No comparison of total-cost-of-ownership (build pipeline, CI, debugging
  tooling) between a single .js file and a Go project with Makefile
- The JetBrains "Write Modern Go Code with Claude Code" article was found but
  not cited in the original research despite being relevant

### Verdict: WEAKENED

The performance advantage is real in principle but the 8-29ms figure is
unreliable for Windows with Defender. The realistic Go advantage on this machine
is likely 30-80ms vs 47-150ms for direct Node.js -- a 2x improvement, not 5-16x.
The maintenance burden for a solo Node.js developer is a real cost the report
understates. The recommendation should be conditional: "Go is better IF you
exclude Defender overhead AND you accept maintaining a second language."

---

## Challenge 2: ccstatusline (5.8k Stars) Dismissed Too Quickly?

**Claim (CL-002, CL-020, CL-026):** Build custom rather than adopt ccstatusline
because (a) SoNash widgets require local file reads no third-party tool
provides, (b) ccstatusline has 80-150ms execution overhead, and (c) custom
commands each spawn a subprocess.

### Disconfirming Evidence

1. **ccstatusline HAS a custom-command widget.** The report acknowledges this in
   a footnote ("ccstatusline has custom-command widgets, but each spawns a
   subprocess") but dismisses it. However, ccstatusline's custom-command widget
   receives the same stdin JSON from Claude Code, and can execute arbitrary
   shell commands including `cat` of local state files. A `jq` one-liner reading
   `.claude/state/hook-runs.jsonl | tail -1` costs 5-10ms. The subprocess
   penalty is real but may be within budget for 2-3 custom widgets.

2. **The "80-150ms execution" number needs context.** ccstatusline added a block
   timer cache to reduce JSONL parsing on every render, with per-config hashed
   cache files and automatic invalidation
   ([sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline)). The
   report cites warm execution of 40-80ms for React+Ink overhead, but one
   developer reports "not noticing any latency despite four custom commands"
   running on every update. If the total stays under 200ms, it falls within the
   "it works" territory given that the 300ms debounce is a throttle, not a hard
   kill.

3. **NIH bias indicators are present.** The research was conducted specifically
   to justify building a custom statusline -- the prior Session #229 already
   recommended "enhance custom." The research question was never "should we
   adopt ccstatusline?" but "what should we build?" MIT Sloan research on NIH
   syndrome finds that 84% of innovation projects are affected by NIH bias
   ([sloanreview.mit.edu](https://sloanreview.mit.edu/article/beating-not-invented-here-syndrome/)).
   The key NIH diagnostic question: "If there's an accepted solution on the
   market, and it isn't your core differentiating technology, and there's no
   obvious reason not to take it, then take it"
   ([wundergraph.com](https://wundergraph.com/blog/how-not-invented-here-kills-innovation-and-five-rules-to-avoid-it)).

4. **The adoption path is cheaper than acknowledged.** ccstatusline offers
   30-minute setup, 30+ built-in widgets, community maintenance, TUI
   configuration, themes, and Powerline styling. Multiple forks exist
   (ccstatusline-aicodemirror, syou6162/ccstatusline with YAML config). A hybrid
   approach -- adopt ccstatusline for standard widgets + 2-3 custom-command
   widgets for SoNash-specific data -- was evaluated as "Approach C" but
   dismissed for performance. Yet the performance dismissal assumed sequential
   subprocess spawning. If ccstatusline passes stdin JSON to custom commands
   (which it does), the subprocess overhead is the shell startup + jq, not a
   full Node.js boot.

### Alternative Explanations

The SoNash-specific widgets (debt ticker, hook health, health grade, GSD
tracking, predictive compaction, PR review state) are the genuine
differentiators. But only 2 of these (predictive compaction, PR review state)
are truly unique. The others (hook health = pass/fail status, health grade =
read a number, debt count = read a number) are trivially implementable as
ccstatusline custom commands.

### What Would the User ACTUALLY Lose by Adopting?

- **Anomaly-driven visibility:** ccstatusline does NOT support conditional
  widget visibility based on thresholds. This is the core design thesis. You
  would get all widgets all the time, which the research correctly identifies as
  "wallpaper."
- **Predictive compaction:** No external tool does this. Period.
- **Snapshot persistence:** No external tool writes statusline state to disk.

### Unconsulted Sources

- No testing of ccstatusline custom-command latency on this machine
- No evaluation of ccstatusline's width-aware degradation (it has flex
  separators and smart width detection)
- No conversation with ccstatusline maintainers about threshold-based widget
  hiding (could be a feature request or PR)

### Verdict: WEAKENED

The dismissal is too quick, but the core reasoning holds for one specific
reason: **anomaly-driven visibility cannot be retrofitted into ccstatusline
without forking it.** The threshold engine that hides widgets when healthy and
shows them when broken is the fundamental differentiator, and ccstatusline's
architecture (React component tree with static widget list) does not support
this. However, the report should have evaluated "fork ccstatusline and add
threshold logic" as Approach J. The 30+ existing widgets and community
maintenance have real value that custom-from-scratch discards.

---

## Challenge 3: Anomaly-Driven Design Creates Anxiety

**Claim (CL-008, CL-021):** The anomaly-driven visibility pattern ("quiet when
healthy, expanding when problems detected") is confirmed as optimal by
cross-referencing 15+ tools.

### Disconfirming Evidence

1. **UX research on notification fatigue directly contradicts "surprise
   elements."** A study published in Computers in Human Behavior found that
   receiving an unexpected notification disrupts concentration for approximately
   7 seconds -- and the disruption is caused purely by the visual movement of an
   unexpected object, even when blurred
   ([psypost.org](https://www.psypost.org/new-psychology-research-reveals-the-cognitive-cost-of-smartphone-notifications/)).
   An anomaly-driven statusline that suddenly grows from 1 segment to 5 segments
   is exactly this: an unexpected visual change in the peripheral field.

2. **"Micro-interruptions force your brain to reorient repeatedly."** Psychology
   Today research on notification overload documents that repeated partial
   attention shifts increase anxiety, irritability, and the sense of being
   "always behind"
   ([psychologytoday.com](https://www.psychologytoday.com/us/blog/social-instincts/202309/2-ways-to-avoid-notification-overload-and-digital-fatigue)).
   If the statusline changes shape every time context crosses 50%, cost exceeds
   $2, or a hook run completes, the user faces 10-20 visual reorientations per
   session.

3. **The 15+ tools cited do NOT all use anomaly-driven design.** The report
   claims cross-validation from "Starship, lualine, VS Code, JetBrains, Copilot,
   btop, and lazygit." But VS Code's status bar is a **fixed-width bar** that
   changes background color -- it does not add or remove segments. JetBrains
   inspections use a **fixed-position icon** that changes from checkmark to
   warning -- the bar does not grow. Copilot is a **fixed 1-char icon** that
   changes state. The "healthy=quiet" principle is about **content change**, not
   **layout change**. Growing the bar is a different UX pattern than changing an
   icon's color.

4. **Progressive disclosure research supports the _concept_ but warns about
   predictability.** The IxDF literature review states that "predictability in
   progressive disclosure helps users feel in control and reduces anxiety"
   ([ixdf.org](https://ixdf.org/literature/topics/progressive-disclosure)). An
   anomaly-driven bar is unpredictable by design -- the user cannot anticipate
   when it will grow or shrink.

### Alternative Explanations

The anomaly-driven pattern may be confused with the **color-as-state pattern**.
What actually works in VS Code, JetBrains, and Copilot is: a fixed-layout bar
where colors change to signal state. What the report recommends is: a
variable-layout bar where segments appear and disappear. These are different UX
patterns with different cognitive costs.

### What Would Confirm the Claim

User testing with the actual SoNash statusline showing that anomaly-activated
widgets are noticed (not missed) AND do not cause context-switching anxiety. No
such testing has been conducted.

### Unconsulted Sources

- No UX research on variable-width status bars specifically
- NN/g progressive disclosure article was found in search but not cited in the
  original research for its caveats about predictability
- No evaluation of "fixed layout, color change" as an alternative to "variable
  layout, segment appearance"

### Verdict: WEAKENED

The "healthy=quiet" principle is well-supported. But the **implementation** --
segments that appear and disappear, changing the bar's width and visual shape --
is a different and riskier UX pattern than what the cited inspirations actually
use. The report should have evaluated a "fixed segments, variable colors"
alternative (all widgets always present but dimmed/hidden via color, not via
layout change). This would achieve the same signal-to-noise ratio without the
cognitive cost of layout instability.

---

## Challenge 4: Windows Workaround Reliability

**Claim (CL-003, CL-030):** The Windows statusline regression (GitHub #31670)
has a confirmed community workaround: create `~/.claude/.claude.json` with
workspace trust entries.

### Disconfirming Evidence

1. **The workaround was posted ONE DAY before research.** The report states the
   workaround was found on March 22 by user "apocalx." The research was
   conducted on March 23. This means:
   - Zero days of community validation
   - No confirmation from other users
   - No confirmation from Anthropic engineers
   - No testing on the user's actual machine

2. **The workaround modifies an internal Claude Code file.** The
   `~/.claude/.claude.json` file is an internal state file managed by Claude
   Code. Any Claude Code update could overwrite it, change its schema, or
   relocate it. The report acknowledges this in Open Question #1 but still lists
   it as a recommendation.

3. **Multiple Windows statusline issues remain open.** The report itself lists
   four open issues (#31670, #32917, #12870, #27161). Issue #32917 (intermittent
   blank frames) is **not addressed by the trust file workaround** -- it's a
   separate process abort race condition. Even with the workaround, users
   experience occasional blank renders.

4. **There was a security advisory about this exact mechanism.** GitHub security
   advisory
   [GHSA-mmgp-wc2j-qcv7](https://github.com/anthropics/claude-code/security/advisories/GHSA-mmgp-wc2j-qcv7)
   documents "Workspace Trust Dialog Bypass via Repo-Controlled Settings File."
   The workaround may interact with this security surface area -- manually
   creating trust entries could be the exact behavior the security fix was
   designed to prevent.

### Alternative Explanations

The workaround may work coincidentally: perhaps v2.1.81 partially fixed the
underlying bug, and the trust file happens to bypass the remaining failure path.
If the real fix is in v2.1.81 itself, the trust file may be unnecessary.

### Verdict: WEAKENED

The workaround is unverified, one day old, modifies an internal state file, and
potentially conflicts with a security advisory. The report's confidence level of
"medium" is appropriate, but the recommendation to "apply this workaround"
(Recommendation #1) should be conditional: "Test on our machine first, and be
prepared for it to break on any Claude Code update." The security advisory
interaction is a new finding the original research did not consider.

---

## Challenge 5: Performance Claims (8-29ms)

**Claim (CL-006):** Go binary achieves 8-29ms total execution time. This is a
5-16x improvement over Node.js.

### Disconfirming Evidence

1. **The benchmark methodology is not disclosed.** The report provides a neat
   breakdown table (Binary startup: 1-5ms, JSON parse: <1ms, Git rev-parse:
   5-20ms, File reads: 3-15ms) but never states:
   - Was this measured or estimated?
   - On what OS? (Linux benchmarks cannot represent Windows)
   - Was Defender active?
   - Was the binary cached in memory or cold from disk?
   - Was NTFS metadata overhead included?
   - How many iterations?

2. **Go binary startup on Windows is NOT 1-5ms.** The report claims "Binary
   startup: 1-5ms." Go's runtime initialization includes goroutine scheduler
   setup, GC initialization, and package `init()` functions. On Linux with warm
   disk cache, 1-5ms is plausible. On Windows with NTFS and Defender, 5-20ms is
   more realistic for a simple binary. With file I/O (reading TOML config, JSONL
   state files), add 5-15ms of NTFS overhead. Realistic cold-start total on
   Windows: **25-80ms**.

3. **Git rev-parse at 5-20ms assumes warm git index.** On NTFS with a large repo
   (SoNash has substantial history), `git rev-parse --abbrev-ref HEAD` with cold
   index can take 30-80ms. The 5s cache TTL helps on subsequent calls but the
   first call per session will be slow.

4. **The Node.js comparison includes fnm overhead in the worst case.** The
   "47-470ms" range for Node.js includes the fnm shim (167-470ms) which the
   report itself recommends eliminating. The fair comparison is Go (25-80ms on
   Windows) vs Node.js direct (47-150ms) -- a 2x improvement, not 5-16x.

### Alternative Explanations

The performance numbers may come from the `felipeelias/claude-statusline` blog
post (March 17) which was likely benchmarked on Linux/macOS. Presenting Linux
benchmarks as applicable to Windows is a common error in cross-platform tool
evaluation.

### Verdict: WEAKENED

The directional claim (Go is faster than Node.js) is correct. The magnitude
claim (5-16x, 8-29ms) is unreliable for this user's Windows environment.
Realistic advantage is approximately 2x. This changes the cost-benefit
calculation: a 2x speedup may not justify introducing a second language.

---

## Challenge 6: "Only One Statusline Command" Limitation

**Claim (CL-019, implicit throughout):** Claude Code executes exactly ONE
`statusLine.command`. The compositor pattern is unviable because each tool
spawns a sequential subprocess.

### Disconfirming Evidence

1. **The official docs confirm single command, but the command can be
   anything.** The docs state `statusLine.command` takes a single string. But
   that string can be a shell command that internally calls multiple programs.
   The limitation is "one config entry," not "one process." A bash wrapper that
   calls ccstatusline and a custom script in parallel (using `&` and `wait`)
   would produce combined output.

2. **The plugin marketplace may change this.** The report acknowledges the
   plugin marketplace (72+ plugins, 24 categories) but dismisses it for
   statusline use. However, the marketplace added `source: 'settings'` for
   inline plugin declarations. If Anthropic adds statusline plugin support
   (which is a natural extension), the single-command limitation could
   disappear.

3. **ccstatusline already solves this internally.** ccstatusline accepts
   custom-command widgets that run alongside built-in widgets within a single
   process invocation. The "compositor" pattern (Approach I) was dismissed for
   spawning sequential subprocesses, but ccstatusline's approach is
   "coordinator" -- one process that internally dispatches to widgets, some of
   which shell out.

### What Would Confirm the Claim

Evidence that Claude Code hard-kills the statusline process after a specific
timeout, making it impossible for a coordinator process to run both built-in and
custom logic within budget. The report does not provide this evidence.

### Verdict: CONFIRMED (with caveats)

The single-command limitation is real and documented. However, the report
overstates its impact by conflating "one config entry" with "one simple script."
The compositor pattern (multiple independent tools concatenated) is correctly
dismissed, but the coordinator pattern (one tool that internally manages
multiple widgets) is viable and is exactly what ccstatusline does. The plugin
marketplace could also change this constraint in the future.

---

## Challenge 7: The 300ms Budget

**Claim (CL-005):** Claude Code's statusline debounce interval is 300ms with
in-flight cancellation. Scripts taking longer than 300ms risk being cancelled
before output is rendered.

### Disconfirming Evidence

1. **300ms is a debounce interval, not a timeout.** The official docs state:
   "Updates are debounced at 300ms, meaning rapid changes batch together and
   your script runs once things settle." This means Claude Code waits 300ms of
   quiet before triggering the script. It does NOT mean scripts must complete
   within 300ms.

2. **In-flight cancellation is event-driven, not time-driven.** "If a new update
   triggers while your script is still running, the in-flight execution is
   cancelled." This means a slow script is only cancelled if a NEW event arrives
   while it's running. If the user is idle (reading AI output), no new events
   fire, and a 500ms or even 1000ms script would complete fine.

3. **Community tools routinely exceed 300ms.** ccstatusline with React+Ink
   overhead runs at 80-230ms per the report's own data. With custom commands,
   total time could reach 300-400ms. If the 300ms were a hard kill, ccstatusline
   would be broken for most users. It has 5.7k stars, suggesting it works.

4. **The report's own Open Question #3 admits uncertainty.** "What is the actual
   hard timeout for statusline scripts? Official docs reference a timeout but
   give no specific value. Community reports suggest scripts over 1 second are
   reliably killed, but the exact threshold between 300ms (debounce) and 1000ms
   is unknown." This directly contradicts the confident "high" rating on CL-005.

5. **The actual hard timeout appears to be much higher.** Community guides
   recommend caching git info and refreshing every 5 seconds, suggesting scripts
   routinely take hundreds of milliseconds. ccstatusline's custom-command
   timeout is user-configurable, implying scripts commonly run long enough to
   need a timeout.

### Alternative Explanations

The 300ms figure may have been conflated from two separate mechanisms: (1) the
debounce delay before triggering, and (2) the in-flight cancellation on new
events. These are complementary, not additive. The actual execution budget is
likely closer to "complete before the next event" which, during idle reading,
could be 5-30 seconds.

### What This Changes

If the real budget is 500ms-1s (rather than 300ms), the Node.js direct approach
(47-150ms) is comfortably within budget, and the Go performance advantage
becomes less compelling. The entire "performance is critical" framing shifts
from "must be under 300ms or die" to "faster is better UX but 150ms is fine."

### Verdict: WEAKENED

The 300ms is a debounce interval, not a hard timeout. The report conflates
throttling with killing. Scripts up to ~1 second appear to work in practice
based on community tool adoption. The "high confidence" rating on this claim is
not supported by the evidence. This weakens the performance urgency that drives
the Go recommendation.

---

## Summary Matrix

| #   | Challenge                 | Claim          | Verdict       | Impact on Recommendations                                           |
| --- | ------------------------- | -------------- | ------------- | ------------------------------------------------------------------- |
| 1   | Go binary recommendation  | CL-006, CL-024 | **WEAKENED**  | 2x advantage (not 5-16x) on Windows; maintenance burden understated |
| 2   | ccstatusline dismissed    | CL-002, CL-020 | **WEAKENED**  | Anomaly-driven visibility is the real blocker, not performance      |
| 3   | Anomaly-driven design     | CL-008, CL-021 | **WEAKENED**  | Layout change vs color change distinction missed; anxiety risk      |
| 4   | Windows workaround        | CL-003, CL-030 | **WEAKENED**  | Unverified, 1-day old, security advisory conflict                   |
| 5   | Performance claims        | CL-006         | **WEAKENED**  | 25-80ms realistic on Windows, not 8-29ms                            |
| 6   | Single command limitation | CL-019         | **CONFIRMED** | Real but overstated; coordinator pattern is viable                  |
| 7   | 300ms budget              | CL-005         | **WEAKENED**  | Debounce, not timeout; ~1s real budget; reduces Go urgency          |

## Net Assessment

The research report's **directional conclusions are sound**: custom over adopt
(because anomaly-driven visibility), Go is faster than Node.js (but not by as
much as claimed on Windows), and the anomaly-driven philosophy is correct (but
the implementation via layout change rather than color change needs UX
validation).

The report's **magnitude claims are unreliable for this environment**: the Go
benchmarks are Linux-optimistic, the 300ms "budget" is mischaracterized, and the
Windows workaround is unverified.

### Revised Recommendation

If this contrarian analysis were to drive the decision:

1. **Start with Option 1 (Enhanced Node.js monolith)** -- the stack you know,
   within the real performance budget (~1s, not 300ms), shipping in one session
2. **Evaluate "fixed layout, variable color" as an alternative to "variable
   layout"** for the anomaly-driven design before committing to segment
   appearance/disappearance
3. **Test the Windows workaround on this machine** before making any other
   decision -- if it fails, everything else is moot
4. **Defer the Go decision** until the Node.js version proves the concept and
   validates the widget set. Port to Go only if measured performance on this
   Windows machine with Defender is actually problematic
5. **Evaluate ccstatusline fork** as an alternative to building from scratch --
   the 30+ widgets and community maintenance have real value; adding threshold
   logic to a fork may be less work than building all widgets from zero

---

## Sources

### Go Performance on Windows

- [Go builds slow: Windows Defender default settings (golang/go#61562)](https://github.com/golang/go/issues/61562)
- [How to Prevent Windows Defender from Scanning During Builds (golang/go#43427)](https://github.com/golang/go/issues/43427)
- [Performance Mystery: Is Golang's Startup Time Slow? (Replit)](https://blog.replit.com/golang-performance)
- [Go binary antivirus issue discussion (golang-nuts)](https://groups.google.com/g/golang-nuts/c/bFQomXKWXOs)

### AI + Go Code Quality

- [Write Modern Go Code With Junie and Claude Code (JetBrains)](https://blog.jetbrains.com/go/2026/02/20/write-modern-go-code-with-junie-and-claude-code/)
- [Best AI for Go Development (jenova.ai)](https://www.jenova.ai/en/resources/best-ai-for-go-development)
- [Best LLMs for Coding in 2026 (edenai.co)](https://www.edenai.co/post/best-llms-for-coding)
- [A case for Go as the best language for AI agents (HN)](https://news.ycombinator.com/item?id=47222270)

### NIH Syndrome

- [Beating 'Not Invented Here' Syndrome (MIT Sloan Review)](https://sloanreview.mit.edu/article/beating-not-invented-here-syndrome/)
- [How Not Invented Here Kills Innovation (WunderGraph)](https://wundergraph.com/blog/how-not-invented-here-kills-innovation-and-five-rules-to-avoid-it)
- [Opening the Black Box of NIH (Academy of Management)](https://journals.aom.org/doi/10.5465/amp.2013.0091)

### UX / Notification Fatigue

- [Progressive Disclosure (IxDF)](https://ixdf.org/literature/topics/progressive-disclosure)
- [Progressive Disclosure (NN/g)](https://www.nngroup.com/articles/progressive-disclosure/)
- [Cognitive cost of smartphone notifications (PsyPost)](https://www.psypost.org/new-psychology-research-reveals-the-cognitive-cost-of-smartphone-notifications/)
- [Notification Overload and Digital Fatigue (Psychology Today)](https://www.psychologytoday.com/us/blog/social-instincts/202309/2-ways-to-avoid-notification-overload-and-digital-fatigue)
- [Designing Calm: UX Principles for Reducing Anxiety (UXmatters)](https://www.uxmatters.com/mt/archives/2025/05/designing-calm-ux-principles-for-reducing-users-anxiety.php)

### ccstatusline

- [sirmalloc/ccstatusline (GitHub)](https://github.com/sirmalloc/ccstatusline)
- [ccstatusline Issue #128: Integrate new Claude Code info](https://github.com/sirmalloc/ccstatusline/issues/128)
- [ccstatusline (ClaudeLog)](https://claudelog.com/claude-code-mcps/ccstatusline/)

### Claude Code Statusline Docs & Issues

- [Customize your status line (Official Docs)](https://code.claude.com/docs/en/statusline)
- [Issue #31670: Statusline not executed on Windows](https://github.com/anthropics/claude-code/issues/31670)
- [Security Advisory: Trust Dialog Bypass (GHSA-mmgp-wc2j-qcv7)](https://github.com/anthropics/claude-code/security/advisories/GHSA-mmgp-wc2j-qcv7)
- [Claude Code Status Line Guide (claudefa.st)](https://claudefa.st/blog/tools/statusline-guide)

### Community Guides

- [Claude Code Status Line Setup (codelynx.dev)](https://codelynx.dev/posts/claude-code-usage-limits-statusline)
- [claude-statusline Go binary (felipeelias)](https://felipeelias.github.io/2026/03/17/claude-statusline.html)
- [Claude Code Status Lines That Actually Matter (Substack)](https://ovidiueftimie.substack.com/p/claude-code-status-lines-that-actually)
