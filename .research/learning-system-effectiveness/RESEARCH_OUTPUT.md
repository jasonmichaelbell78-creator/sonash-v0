# Research Report: Learning System Effectiveness in AI-Directed Development

**Topic:** Learning system effectiveness — measuring impact, code enforcement
vs. behavioral improvement, minimum viable approaches, and retroactive analysis
**Depth:** L1 (Exhaustive) **Date:** 2026-04-03 **Findings files synthesized:**
D1a, D2, D3, D4, D5, D6, D7a, D7b, D7c, D8, D9, D10, D11 (13 files)

---

## Executive Summary

This research was initiated because SoNash's learning system is not proving its
own value. The brainstorm identified five open questions. This report answers
all five, then synthesizes findings from 13 research angles into a coherent
picture and actionable recommendations.

**Question 1 — Do other AI tools prove their learning system effectiveness?**
No. None of the major AI coding tools (Cursor, Copilot, Windsurf, Aider, Codex,
Continue.dev, Cline) have published evidence that their learning/memory systems
measurably reduce error recurrence. The two tools with automatic memory
generation (Claude Code and Windsurf) have no built-in violation trend tracking.
No tool has solved the problem of proving cross-session behavioral learning.
SoNash's problem is the industry norm, not an exception [1][2][3][4][5].

**Question 2 — Are code-level enforcement and behavioral learning the same
system?** No. They are structurally asymmetric and require different toolchains.
Code enforcement operates on deterministic artifacts (ASTs, diffs) and can be
made hard-blocking. Behavioral compliance operates on cognitive patterns and can
only be probabilistic at best. Mixing them under one "learning" umbrella creates
incoherence because the success criteria, enforcement mechanisms, and
measurement methods are fundamentally different [6][7][8].

**Question 3 — What is the minimum viable learning system that proves its own
value?** A system needs exactly three components: a baseline, a closed feedback
loop, and a single decreasing time-series metric tracked over 60+ days. The
minimum viable metric set for pattern enforcement is four metrics: new
violations per PR (rolling 30-day), recurrence rate per rule, hook adoption
rate, and time-to-fix per category — all derivable from existing infrastructure
with no new tooling [9][10][11].

**Question 4 — Can SoNash's learning system effectiveness be measured
retroactively?** Yes, using existing data without new instrumentation. The
highest-value data source is `hook-runs.jsonl`. Git pickaxe can retroactively
track when each anti-pattern was introduced and removed across the full history.
PR JSONL recurrence analysis with pandas groupby can detect whether
high-severity comment categories declined over time. The SZZ algorithm can map
fix-commits to their introducing commits [12][13][14].

**Question 5 — How do you measure tool impact without A/B tests?** Three methods
apply: Interrupted Time Series (ITS) analysis — the canonical method for
single-group before/after measurement — requires 12+ pre- and post-intervention
data points; Single-Subject Experimental Designs (SSEDs) using the Multiple
Baseline variant for staggered tool introductions; and Bayesian changepoint
detection for exploratory analysis when the intervention date is not
pre-specified [15][16][17].

**The Central Finding:** SoNash has built a sophisticated learning system that
measures its own activity rather than its own effectiveness. The "89.2% learning
effectiveness" metric is a textbook vanity metric by Lean Startup criteria: it
is not actionable, not auditable, and cannot distinguish between
enforcement-driven absence and workload-driven absence of patterns. The
learning-router graduation pipeline has multiple independent mechanical failures
that render it functionally inert. Pattern-fix commits have remained stable at
~30% of all commits for four months with no declining trend. The system is not
broken — it is measuring the wrong things.

**The Core Structural Problem:** Code-level learning and behavioral learning are
being wrongly combined. Code patterns (sanitizeError, path traversal, exec
loops) are enforceable deterministically via pre-commit hooks and CI. Behavioral
patterns (ask before implementing, batch questions, use convergence loops) are
probabilistic system-prompt guidance that cannot reach deterministic enforcement
without architectural intervention. 8 of 14 CLAUDE.md behavioral guardrails have
zero automated enforcement not because the system failed to build enforcement,
but because behavioral enforcement of cognitive patterns is a fundamentally
different problem that requires different tools.

---

## Section 1: What Other Tools Do — and Whether Any Prove Effectiveness

### The Tool Landscape Taxonomy

Eight major AI coding tools were surveyed (D1a). They fall into three tiers by
learning approach:

**Tier 1 — Automatic Memory Generation (2 tools):** Claude Code (Auto Memory
since v2.1.59) and Windsurf/Cascade are the only tools where the AI writes its
own persistent notes. Both store notes in local markdown files outside the git
repository. Neither has built-in violation trend tracking or effectiveness
measurement [1][2].

**Tier 2 — Human-Maintained Rules With AI Assistance (2 tools):** Cursor
(.cursor/rules/\*.mdc, four activation modes) and GitHub Copilot
(copilot-instructions.md) require human effort to codify learnings. Cursor had
automatic memory generation in v0.51 but removed it, telling users to export
memories to rules. Copilot uses accept/reject telemetry for global model
training but has no user-level personalization loop [3][4].

**Tier 3 — Static Human-Maintained Files (4 tools):** Codex (AGENTS.md +
Skills), Aider (CONVENTIONS.md), Continue.dev (rules + optional MCP memory), and
Cline/Roo Code (.clinerules/.roo) rely entirely on human curation. No automatic
learning from corrections. Skills and conventions must be manually written and
updated [5].

**The Cross-Industry Answer to "Does Anyone Prove It?"** No major tool publishes
evidence of learning system effectiveness. The closest published data is from
tools adjacent to this space: Facebook Infer (1,000+ bugs/month fixed
pre-production, 80% fix rate on sampled issues) [49] and Meta code review
tooling (17% increase in review actions, 7% drop in Time In Review) [50] — both
of which measured specific, targeted tooling interventions with pre-defined
metrics, not general "learning system" effectiveness.

The contrast is instructive: Meta succeeded at measurement because they had a
single well-defined intervention, a pre-defined success metric (P75 Time In
Review), and a guardrail metric (Eyeball Time) to prevent gaming. SoNash's
learning system has none of these structural properties.

**Key Industry Pattern:** The demand for cross-session learning is high. The
absence of native memory in Cline/Roo Code spawned an ecosystem of community
workarounds (RooFlow, roo-advanced-memory-bank, multiple MCP implementations).
This is evidence that the problem is real and that none of the available tools
has solved it [2].

---

## Section 2: Code vs. Behavioral Learning — The Structural Asymmetry

This is the most important structural finding of the research. The distinction
is real, empirically supported, and not currently respected in SoNash's
architecture.

### The Two Systems Defined

**Code-Level Enforcement:**

- Domain: what gets built — correctness, security patterns, style
- Enforcement mechanism: static analysis, linters, pre-commit hooks, CI gates
- Enforcement type: deterministic — code that violates the rule is blocked
- Measurement: precise and objective (a linter either fires or doesn't)
- Examples: sanitizeError required, path-traversal regex, exec() with /g flag

**Behavioral Compliance:**

- Domain: how work is done — process sequencing, decision gates, collaboration
  patterns
- Enforcement mechanism: system prompts, CLAUDE.md, AGENTS.md
- Enforcement type: probabilistic — the AI generally follows these but is not
  constrained to
- Measurement: no direct measurement method exists as of 2026
- Examples: ask before implementing, batch questions, use convergence loops

GitHub's documentation explicitly frames this split: "Workflow compliance
governs how developers work, while code compliance validates what gets
committed." [6] The academic literature treats process compliance as a distinct
subfield from code quality analysis [7].

### Why the Gap Is Especially Stark for AI Systems

For code rules: pre-commit hooks and CI gates enforce externally, independent of
what Claude "believes." Claude cannot choose to ignore a linting error in CI.

For behavioral rules: "The model does not follow your instructions because it is
enforced to. It follows them because that response is statistically likely given
your system prompt." [8] A study found Copilot "generated a Frankenstein project
completely unrelated to the rule" when given complex behavioral instructions
[23].

This is the probabilistic vs. deterministic gap. The 8/14 CLAUDE.md guardrails
with zero automated enforcement are not an oversight — they represent behavioral
compliance rules that genuinely cannot be deterministically enforced with
current tooling.

### The Lifecycle Hook Tier — A Partial Bridge

The most significant 2025-2026 development is lifecycle hooks (Claude Code
hooks, Gemini CLI hooks) that partially bridge the gap for a specific subset of
behavioral rules [8][24]:

**What hooks CAN enforce deterministically:**

- File protection (PreToolUse block on specific file edits)
- Command pattern blocking (specific shell commands)
- Audit trails (log all git operations)
- Task completion verification (Stop hooks running agent-based evaluators)

**What hooks CANNOT enforce:**

- "Ask before implementing" — the reasoning happens before any tool call; hooks
  fire on tool calls, not cognitive decisions
- "Use convergence loops" — a process pattern, not a tool-call pattern
- "Batch clarifying questions" — conversation structure, invisible to hooks

The behavioral rules that resist hook enforcement share one characteristic: they
are about **cognitive/conversational patterns** rather than **tool-use
patterns** [8].

### The Four-Layer Architecture

The emerging best practice for AI-assisted development separates these concerns
into four layers [6][7][8]:

1. **Deterministic (code artifacts):** Linters, pre-commit hooks, CI gates.
   Cannot be bypassed without explicit override.
2. **Semi-deterministic (lifecycle hooks):** Intercepts tool-use decisions.
   Deterministic for tool-call patterns; cannot reach conversational patterns.
3. **Probabilistic (CLAUDE.md, AGENTS.md):** Behavioral guidance with
   high-probability compliance. Degrades under context pressure, model updates,
   or prompt injection.
4. **Human review (PR, code review):** Final behavioral gate. Subject to human
   inconsistency and cannot scale to match AI velocity.

**SoNash Implication:** The learning-router's 39 patterns conflate all four
layers. Behavioral routes (19 of 39) are correctly classified as "low
confidence" because they belong in Layer 3 and cannot graduate to Layer 1
enforcement. Code routes (which can graduate) are blocked by the field-name
mismatch bug, not by a structural limitation.

---

## Section 3: Measurement Anti-Patterns — Goodhart's Law, Vanity Metrics, the McNamara Fallacy

This section is the most direct answer to why "89.2% learning effectiveness" is
the wrong metric.

### Goodhart's Law Applied

"When a measure becomes a target, it ceases to be a good measure." (Charles
Goodhart, 1975) [25] The mechanism: once a metric becomes an optimization
target, agents rationally redirect effort toward improving the number rather
than improving the underlying reality.

The "89.2% effectiveness" metric counts "patterns not seen again" as evidence of
enforcement. This is Goodhart's Law by design: a pattern's absence may reflect
any of these causes:

- The enforcement system prevented the violation (what the metric claims)
- The workload domain shifted (no new code in that category was written)
- The pattern rotated out of the measurement window
- The developer/agent avoided the specific measured context while violating the
  principle

The metric cannot distinguish between these. It measures correlation (patterns
are absent) and labels it causation (learning occurred) [25][26][27].

### The Vanity Metric Test (Lean Startup)

Eric Ries's three A's test [28]:

- **Actionable:** Can you change the learning system configuration based on this
  number and predict what will happen to violations? No.
- **Accessible:** Can you trace the 89.2% back to specific decisions that caused
  it? No — the numerator is "patterns absent in later sessions."
- **Auditable:** Can you verify that absence resulted from enforcement vs.
  workload shift? No.

Verdict: textbook vanity metric. High-precision reporting (89.2%, not "roughly
90%") signals scientific rigor the measurement does not support — a recognized
sub-pattern of measurement theater [29].

### The McNamara Fallacy

The four-step fallacy [30]: (1) Measure whatever can be easily measured. (2)
Disregard what cannot be easily measured. (3) Presume that what cannot be
measured is not important. (4) Assert that what cannot be easily measured does
not exist.

**What is easy to measure in SoNash's learning system:**

- Number of patterns in the knowledge base (444)
- Patterns that match against recent code
- "Patterns not recurred" rate

**What is hard to measure but actually matters:**

- Whether enforcement changed future behavior vs. merely cataloguing absences
- Whether violations were prevented or moved to unmonitored contexts
- Whether patterns encode real risk or have become bureaucratic artifacts

### Measurement Theater

Will Larson: "Measurement without the capability to drive change yields little
benefit." [31] The characteristics of measurement theater are present in the
current system:

- Dashboard proliferation without action protocols (lifecycle-scores.jsonl
  scores every system but no score has been updated since the single 2026-03-13
  baseline)
- High-precision numeric reporting that implies rigor the measurement does not
  support
- Metrics reported but never used to modify system behavior (the alerts system
  warns about unverified enforced routes since 2026-03-21; nothing has changed)
- No closed feedback loop: metric movement does not trigger investigation or
  intervention

### What Effective Metrics Look Like

**DORA's anti-gaming design principle [32]:** The four DORA metrics resist
gaming through mutual tension — improving one at another's expense reduces the
composite score. A learning system metric set should have this property.

**The four minimum viable metrics for pattern enforcement** (from D3, strongly
supported):

| Metric                                          | What It Proves                     | Gaming Resistance                        |
| ----------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| New violations per PR (rolling 30-day)          | Learning is reducing future errors | Hard to game without fixing the behavior |
| Recurrence rate (same rule, same file category) | Whether enforcement sticks         | Hard to fake                             |
| Hook adoption rate (% PRs where hook ran)       | System is not being circumvented   | Observable in git logs                   |
| Time-to-fix per violation category              | Friction is decreasing             | Timestamps are objective                 |

These four form a closed loop: adoption proves the system runs → recurrence
proves it teaches → time-to-fix proves learning is efficient [11].

---

## Section 4: Minimum Viable Learning Systems That Work

### The Three Required Components

Based on synthesis across practitioner literature and D3's findings, a
self-proving learning system requires exactly three components [9]:

1. **A baseline** — measured before the intervention. Without this, no
   improvement can be demonstrated. Even self-reported survey data can establish
   a baseline within weeks.
2. **A closed feedback loop** — the system's output must feed back as input. For
   pattern enforcement: when a violation is caught, that rule category must be
   tracked over time.
3. **A trend signal** — one time-series metric that moves in a measurable
   direction over a defined period (60+ days).

The simplest self-proving system: track new violations per PR over a rolling
30-day window. If violations decrease and hook adoption holds, learning is
demonstrably happening.

### Evidence: Simple Systems Persist, Complex Systems Get Abandoned

The evidence is consistent across sources [9][10][33]:

- Spotify Soundcheck: reduced onboarding from 60 days to 5 minutes via
  centralized tooling, not additional complexity
- Etsy: simple instruments (real-time lead time monitoring, monthly NPS)
  deployed consistently convinced leadership
- Pre-commit hook case study (2025): one startup saw 50% reduction in merge
  conflicts and 20% decrease in formatting issues within 6 months using only CI
  log measurement
- Counter-pattern: a healthcare SaaS team abandoned an AI triage tool after 3
  months due to CI debugging overhead

**The "Build-Measure-Learn" reframe [34]:** The MVP is not the minimum tooling —
it is the minimum tooling that generates a measurable signal within 60 days.
This reframes the design question from "what's the simplest system?" to "what's
the fastest-to-signal system?"

### Notion's Ratchet — The Most Applicable Pattern

Notion's eslint-seatbelt is the most relevant published case study for SoNash's
situation [35][36]:

- A `.tsv` file records maximum allowed violations per rule per file
- CI sets `SEATBELT_FROZEN=1`, preventing the count from increasing
- Pre-commit hooks automatically reduce allowed counts when violations are fixed
- Fixing is distributed across normal development work — no "big migration
  sprint"
- The mechanism is irreversible: once a violation count drops, it cannot rise

This directly solves the "38/39 patterns stuck at refined" problem. The reason
patterns stay at "refined" is the absence of a ratchet mechanism. Without
baseline tracking, the choice is: "enforce now and break everything" vs. "wait
until we clean up first." The ratchet dissolves this dilemma by allowing
enforcement to begin immediately at zero cost, with gradual cleanup.

### The Inform/Block Separation

The most consistent finding across graduation-pipeline research [37]:

- IDE/editor: Inform (real-time, non-blocking)
- Pre-commit hook: Inform or soft-block (escapable but visible)
- CI pipeline: Hard block (non-negotiable)

Successful pipelines always separate the feedback signal from the enforcement
action and use time to let developers adapt. Failure is caused by going directly
to hard blocking (disrupts workflow) or never leaving the inform phase (warning
wallpaper).

---

## Section 5: Retroactive Measurement Methods Applicable to SoNash

This research found that retroactive measurement is feasible from existing data
without new instrumentation. The priority order is by signal quality:

### Method 1: hook-runs.jsonl Analysis (Highest Value) [12][14]

The `hook-runs.jsonl` and `hook-warnings-log.jsonl` files are purpose-built
learning signal datasets. A simple pandas groupby over
`violation_type × session_window → count` produces the trend lines needed to
answer whether the learning system is working:

```python
# Pseudocode — no new instrumentation required
df = pd.read_json('hook-runs.jsonl', lines=True)
trend = df.groupby(['violation_type', pd.Grouper(key='timestamp', freq='W')]).size()
# A declining slope per violation_type = learning signal
```

**Caveat:** `hook-warnings-log.jsonl` currently covers only 2 days of data
(2026-04-02 to 2026-04-03). The file may rotate or was recently created. This
limits retroactive analysis to whatever history `hook-runs.jsonl` contains.

### Method 2: Git Pickaxe Analysis [13]

Git's built-in pickaxe search can retroactively track when any anti-pattern was
introduced and removed:

```bash
git log -S "error.message" --all --format="%H %ad %s" --date=format:"%Y-%m"
```

This shows every commit that introduced or removed a raw `error.message` leak,
giving a timeline of violation recurrence. Applied to SoNash's five critical
patterns (sanitizeError, path traversal, exec /g, test mocking, file reads),
this produces trend lines from the full history without any new tooling.

### Method 3: PR JSONL Recurrence Analysis [14]

The 28 records in `reviews.jsonl` and 64 records in `review-metrics.jsonl`
(covering 2026-03-06 to 2026-04-03) are analyzable for recurrence trends. The
core signal: if high-severity comment categories appear less often in records
41-64 than in records 1-20, that is measurable evidence of learning.

**Limitation:** reviews.jsonl covers only 28 days (shorter than the recommended
60+ day window for ITS analysis). The schema has evolved across three versions
(v1, v2, v3), meaning earlier records are structurally different from later
ones.

### Method 4: Commit Message Classification [12]

For the 260+ sessions with structured conventional commits:

```bash
git log --grep="sanitize\|sanitizeError" --format="%ad" --date=format:"%Y-%m"
```

D7a's analysis already ran this and found that sanitizeError-related commits did
NOT decline after the pattern checker was introduced in January 2026 — they were
stable at 31-43 commits/month through April 2026. This is the most directly
actionable retroactive finding.

### Method 5: SZZ Algorithm [12]

For mapping fix-commits to their introducing commits. Multiple open-source
implementations (SZZUnleashed). Requires git history + commit message keywords.
Precision ~60-80% in empirical studies. Most powerful but most complex — best
deferred to a focused analysis sprint.

### Threats to Validity

All retroactive methods share these limitations [12]:

- Confounding factors: improvements may reflect scope changes or rule-set
  changes, not learning
- Batch remediation vs. new violations: D7a identified one commit ("pattern
  compliance full scan — 72 blocking → 0 (Wave 3)") that looks like a declining
  trend but is a one-time sweep
- Attribution problem: in AI-directed development, "learning" could mean model
  improvement vs. rules improvement vs. genuine behavioral adaptation — git
  analysis cannot distinguish these

---

## Section 6: Knowledge Management Theory Applied

### The SECI-Claude Asymmetry

Nonaka's SECI model describes how knowledge cycles between tacit and explicit
forms. Applied to a human-AI system [38][39]:

- **Socialization (Tacit→Tacit):** Human and Claude develop working patterns
  through sessions. Neither party records these — they live in interaction
  rhythm.
- **Externalization (Tacit→Explicit):** Feedback crystallizes into CLAUDE.md
  rules. This is the critical conversion, and where the current system primarily
  operates.
- **Combination (Explicit→Explicit):** CLAUDE.md, MEMORY.md, feedback docs
  combined at session start. The context window performs live combination.
- **Internalization (Explicit→Tacit):** Rules become "second nature." This
  conversion is **structurally blocked** for Claude — without weight updates,
  true internalization cannot occur. Every session starts fresh.

The GRAI framework (2025, VINE Journal) extends SECI for generative AI and
confirms this asymmetry: AI can participate in Externalization and Combination
but has structural limits in Socialization and Internalization — precisely where
tacit knowledge lives [38].

**CLAUDE.md as prosthetic externalization:** CLAUDE.md and MEMORY.md are not
true internalization — they are persistent Externalization artifacts that
substitute for the Internalization that cannot occur. This is the correct
understanding of what the system can and cannot do.

### The Codification Paradox

The paradox is well-established in KM research: as explicit knowledge
repositories grow, their effective utility often decreases [40]:

**Official Claude Code documentation confirms this as an engineering
constraint:**

- "Target under 200 lines per CLAUDE.md file. Longer files consume more context
  and reduce adherence."
- "If two rules contradict each other, Claude may pick one arbitrarily."
- "Shorter files produce better adherence." [41]

Current CLAUDE.md is at 135 lines (v5.9). It is within the threshold but
approaching it. MEMORY.md, feedback docs, and other instruction sources add to
the effective load. Each additional rule potentially reduces compliance with all
existing rules.

### The Knowing-Doing Gap

Pfeffer and Sutton's core finding: knowing is not doing. The gap is not solved
by more documentation — it is solved by making action easier than inaction [42].
In LLM systems, this is a **prompt engineering and architecture problem, not a
documentation problem.**

Applied to CLAUDE.md: the system can document every behavioral rule perfectly
and still not achieve reliable behavioral compliance, because the gap between
having a rule and that rule shaping behavior in every relevant context is
irreducibly a probabilistic problem.

### Single-Loop vs. Double-Loop Learning

Argyris's distinction [43]:

- **Single-loop:** Error detected, rule added, error prevented. The governing
  variable ("add a rule for each error") is not questioned.
- **Double-loop:** The governing variable itself is questioned: "Are these rules
  actually changing behavior? Is rule-accumulation the right approach?"

SoNash's feedback system operates at single-loop. There is no systematic
mechanism for double-loop questions: "Are we adding rules that nobody reads? Is
the CLAUDE.md format the right one? Should we be using different enforcement
mechanisms?" The brainstorm that initiated this research was the first evidence
of double-loop examination.

### Knowledge Decay

Behavioral SOPs have a documented ~6-12 month half-life [44]. A CLAUDE.md rule
added at session 50 may be incorrect by session 200. The system accumulates
without pruning. Official Claude Code documentation warns that stale rules
create noise that degrades signal from rules that matter [41].

---

## Section 7: SoNash-Specific Findings — The Broken Pipeline and Stale Data

This section synthesizes findings from D7a, D7b, and D7c, which examined the
actual codebase data.

### The Learning-Router Has Multiple Independent Failures (D7c)

The learning-router graduation pipeline (scaffolded → refined → enforced →
verified) has never successfully completed end-to-end. The failures are not
subtle:

**Failure 1: Field-name mismatch makes the escalation mechanism inert.**
`buildPendingEntry()` in `refine-scaffolds.js` looks for
`entry.scaffold?.generatedCode` but `learning-router.js` never populates a
`generatedCode` field. Result: all 37 entries in `pending-refinements.jsonl`
have `generated_code: null`. The `run-alerts.js` escalation check skips entries
without actionable `generated_code` — meaning no entry has ever had its
`surfaced_count` incremented, no entry has reached the 3-surface auto-escalation
threshold, and the entire "fix-or-DEBT" escalation path is dead.

**Failure 2: The confidence classifier hard-codes behavioral routes as "always
low confidence."** 37 of 39 "refined" entries have
`classification.confidence: "low"`. The classifier has no rule to ever advance a
"refined" entry — once refined, nothing advances it to "enforced" without manual
intervention. The design acknowledges behavioral routes require human judgment,
but no tooling delivers these items to a human for judgment.

**Failure 3: The sole "enforced" entry has a broken test.** Entry `3689cfd62f77`
(audit findings rotation) has `_repair_needed: true` and
`_failure_reason: "test exit code 1"`. The test checks for
`audit-findings.jsonl` in `rotation-policy.json` — which IS present — but
`verify-enforcement.js` runs it via `execFileSync` as a plain Node.js script,
not through Jest. The test uses Jest `describe`/`test` syntax and fails outside
a Jest context.

**Failure 4: `analyze-learning-effectiveness.js` is a parallel system with no
connection to `learning-routes.jsonl`.** Two separate systems claim to measure
learning effectiveness using entirely different data sources and taxonomies.
They have no shared signal. The "89.2% effectiveness" comes from one system; the
router status comes from the other. Neither informs the other.

### Git History Shows No Improving Trend (D7a)

The most important empirical finding from the codebase: the pattern-fix commit
ratio has not declined despite 4+ months of pattern enforcement tooling.

| Month              | Fix/pattern commits | Total | Ratio |
| ------------------ | ------------------: | ----: | ----: |
| Dec 2025           |                  34 |   717 |  4.7% |
| Jan 2026           |                 374 | 1,224 | 30.6% |
| Feb 2026           |                 285 |   936 | 30.4% |
| Mar 2026           |                 116 |   384 | 30.2% |
| Apr 2026 (partial) |                   9 |    56 | 16.1% |

The checker was introduced 2026-01-02. The ratio was roughly stable at ~30% from
January through March 2026. It did not decline after introduction.

Similarly, the `sanitizeError` pattern (introduced 2026-01-02) showed no
declining recurrence: 43 commits in Jan, 31 in Feb, 40 in Mar — the rate did not
decrease.

**Important caveat:** the checker may be catching violations successfully while
new violations are introduced at the same rate. The git commit ratio measures
commits-that-touched-violations, not whether the checker prevented violations
that would otherwise have persisted. A declining trend would be stronger
evidence; a flat trend is ambiguous.

### Review Data Shows No Learning Signal in Fix Ratios (D7b)

`review-metrics.jsonl` (64 PRs, 2026-03-06 to 2026-04-03) shows fix_ratio
averaging 0.44 overall and ~0.67 excluding dependency-bump PRs. Trend by
chronological position: recent PRs (records 41-64) show lower fix_ratios on
substantive work (0.15, 0.17, 0.33, 0.36, 0.22) than early PRs. This suggests no
consistent improvement, but the confound is that recent PRs include more
planning/research work with inherently lower fix ratios.

The 24% rejection rate in `reviews.jsonl` is driven by "stale repeat findings"
from prior review rounds — reviewer bots (Qodo, Gemini) are not consuming prior
round decisions. This is a learning loop gap where the review tooling itself
does not learn.

### Lifecycle Scores Show Systemic Action Gap (D7b)

The lifecycle-scores.jsonl audit (20 systems, single 2026-03-13 snapshot) shows
the Action dimension as the systemic gap:

- Only 2 systems score Action=2 (Technical Debt, Pattern Rules)
- Three systems score Action=0 (Override Audit Trail, Agent Tracking,
  Aggregation Data)
- 5 of 11 behavioral rules have no automated enforcement

The scores have never been updated — the Wave 6 remediations referenced in
multiple entries cannot be verified because no post-wave re-scoring exists.

---

## Section 8: Case Studies — What Effective Quality Systems Actually Look Like

The case studies (D11) reveal a consistent pattern: teams that prove tool
effectiveness have one thing in common — they define a specific measurable
outcome before deploying the tool, not after.

**What works (evidence-based):**

- **Meta Infer:** 1,000+ bugs/month fixed pre-production, 80% fix rate on
  sampled issues. Methodology: published in CACM, distinguishes tool-fix-rate
  from traditional false-positive metrics [49].
- **Meta code improvement (2025):** Dead code removal produced 90% decrease in
  severity-triggering diffs (odds ratio 5.2), 59% faster post-removal authoring.
  Cyclomatic complexity decomposition: 55% reduction in defect-causing changes
  [50].
- **Meta code review tooling:** P75 Time In Review as primary metric with
  Eyeball Time as a gaming-prevention guardrail. 17% increase in review actions,
  7% drop in Time In Review [51].
- **Notion eslint-seatbelt:** Ratcheting system for multi-year React migration.
  No quantified bug reduction published, but the mechanism (irreversible
  compliance ratchet) has strong face validity and is used at scale [35][36].

**What appears to work but lacks evidence:**

- Blameless postmortems (Etsy/Google SRE): The practice is well-documented; no
  controlled data on recurrence reduction exists. The "25% reduction in repeat
  incidents" figure circulating in practitioner blogs has no traceable primary
  source [52].
- Chaos engineering (Netflix): Credited with resilience gains; no published
  before/after incident rate data [53].
- Retrospectives: Academic research finds only 11% of teams rate them as "very
  important" for work output; discussions dominated by recurring opinions rather
  than productive improvements [54].

**The METR RCT (most critical finding for SoNash):** A 2025 randomized
controlled trial found experienced AI tool users took 19% longer on real tasks,
while believing AI had sped them up by 20% [55]. The perception gap is
directionally inverted. This is direct empirical evidence that subjective
self-assessment of AI-assisted development effectiveness is unreliable — and
that the learning system cannot be evaluated by asking whether sessions feel
productive.

---

## Section 9: The Non-Developer Director Context

D9 found that 260+ Claude Code sessions directed by a non-developer is genuinely
novel territory — at least one order of magnitude deeper than any documented
practitioner case. This changes the effectiveness question.

**The right question is not "is Claude learning?"** — it is "is the human-AI
system producing more reliable software of increasing complexity with decreasing
iteration cost over time?"

**What effective AI-directed development looks like for this profile [45][46]:**

- Reduction in pre-commit hook failures per feature (objective, already tracked)
- Growth in scope of successfully directed features without regressions
- Reduction in back-and-forth iterations for equivalent complexity
- Codified knowledge compounding (CLAUDE.md version history, agent count, skill
  files)

**The meta-learning risk:** Research found that higher AI literacy correlates
with MORE overestimation of competence, not less [47]. The METR RCT result (19%
slowdown, 20% perceived speedup) is the strongest empirical evidence that
subjective session-quality assessment is systematically unreliable. The SoNash
system should not rely on subjective quality ratings as evidence of learning.

**What breaks circular reasoning [46]:** External, observable outcomes — hook
failure rates, SonarCloud findings, regression rates,
time-to-first-working-commit. These are already being collected. They are the
right measurement substrate.

**The HBR/Gratton distinction (2025) [48]:** "Accelerated learning is not the
same as development. Acceleration increases output; development transforms
identity." The question is whether the system is producing faster results
(acceleration) or genuine capability expansion (development). These require
different measurement.

---

## Section 10: Contradictions Across Findings

### Contradiction 1: Does Behavioral Enforcement Via Hooks Work?

Google/Gemini marketing frames hooks as achieving "behavioral enforcement" [24].
Claude Code documentation makes clear hooks fire on tool-use events, not
reasoning/planning decisions [8]. The marketing claim is technically imprecise;
the documentation is more accurate. **Resolution:** Hooks achieve deterministic
enforcement of tool-call patterns (what files can be edited, what commands can
run). They cannot enforce pre-tool-call reasoning patterns. Both the marketing
claim and the criticism are correct in their respective scopes.

**Confidence: HIGH** for the technical limitation; **MEDIUM** for whether
high-probability compliance is "good enough" for most behavioral governance
purposes.

### Contradiction 2: Does More Documentation Help or Hurt?

KM instinct: document everything to improve behavior. Official Claude Code
documentation: adherence decreases above ~200 lines. Both are correct at
different points on the curve [41]. **Resolution:** Documentation improves
behavior up to a threshold; beyond it, noise degrades signal. The practical
constraint is architectural, not theoretical.

**Confidence: HIGH** — the architectural constraint is from Tier 1 official
documentation.

### Contradiction 3: Do AI Tools Help or Hurt Developer Productivity?

- DORA 2025: positive relationship with throughput for teams with 12+ months of
  AI adoption
- METR 2025 RCT: 19% slowdown for experienced developers on real tasks
- Microsoft: 10-20% faster PR completion with AI code review

**Resolution:** These are compatible — AI may improve review-level tasks and
throughput metrics while slowing individual task completion for experienced
developers on complex existing codebases. Measurement method determines which
effect is visible. **For SoNash:** the METR result is more relevant than DORA
because it uses controlled methodology rather than self-report.

**Confidence: MEDIUM** — the evidence is genuinely contradictory and the
resolution depends on task type and measurement method.

### Contradiction 4: Git Data Sufficiency vs. Confounded Signals

MSR academic literature claims VCS history provides sufficient signal to measure
quality trends. METR study found no clear learning effect in git data within
30-50 hours of AI tool usage. **Resolution:** 260 sessions is a much larger
dataset than 30-50 hours; rule-based hook violations are more precise signals
than general productivity measures. SoNash's data is more likely to surface real
signals [12].

**Confidence: MEDIUM-HIGH** — the data is probably sufficient; the confounding
risks are real and documented.

---

## Recommendations

These recommendations are ordered by evidence quality and implementation cost.

### Recommendation 1: Fix the Three Mechanical Failures in learning-routes.jsonl [CONFIDENCE: HIGH]

The graduation pipeline is inert due to three independently fixable bugs:

1. Fix the field-name mismatch: `entry.scaffold?.generatedCode` → align with
   `learning-router.js`'s actual field name
2. Fix the Jest execution context: run the enforcement test via `npx jest`
   rather than `execFileSync(process.execPath, [testPath])`
3. Add a mechanism to deliver behavioral route entries to human review (even a
   weekly `/alerts` prompt would close the loop)

None of these require architectural changes. Together they restore the pipeline
to operational.

### Recommendation 2: Replace the 89.2% Effectiveness Metric with the Four MVMs [CONFIDENCE: HIGH]

Replace the current metric with the four minimum viable metrics that form a
closed loop:

1. New violations per PR (rolling 30-day) — from hook-run logs
2. Recurrence rate per rule — same data source
3. Hook adoption rate — from git hook logs
4. Time-to-fix per category — from CI timestamps

These are all collectable from existing infrastructure. Add a weekly trend line.
If violations trend down and adoption holds, the system is working. If
violations are flat or rising, the system is not working. The metric is
actionable, auditable, and game-resistant.

### Recommendation 3: Separate Code Learning from Behavioral Learning Architecturally [CONFIDENCE: HIGH]

Treat these as two distinct systems:

**Code learning system (Layer 1-2):**

- `verified-patterns.json` → pre-commit enforcement → trend tracking
- Goal: zero-new-violations on critical patterns, tracked weekly
- Success metric: new violations per PR declines

**Behavioral learning system (Layer 3):**

- CLAUDE.md + MEMORY.md + feedback docs
- Goal: high-probability compliance with collaboration patterns
- Success metric: behavioral compliance proxy metrics (session correction
  frequency, back-and-forth reduction)
- Accept that this cannot be deterministically enforced; invest in the best
  probabilistic approach

Mixing the two systems produces incoherence in metrics, success criteria, and
prioritization.

### Recommendation 4: Implement a Ratchet for the 38 Stalled Patterns [CONFIDENCE: HIGH]

Apply Notion's eslint-seatbelt approach to the 38 stuck "refined" patterns:

1. Run a baseline scan to establish current violation counts per pattern per
   file
2. Store the baseline in a checked-in file
3. CI enforces: "no new violations above baseline"
4. Normal development gradually reduces the baseline

This allows enforcement to begin immediately without a "clean up first"
precondition. The mechanism is irreversible by design. The patterns graduate
from "refined" to "enforced" through the act of running, not through a manual
pipeline.

### Recommendation 5: Run the Retroactive Analysis Before Adding Complexity [CONFIDENCE: HIGH]

Before adding any new learning infrastructure, run the 90-minute retroactive
analysis:

1. Git pickaxe on the five critical patterns: did recurrence rates change over
   time?
2. `hook-runs.jsonl` groupby: what are the top violation categories by
   frequency?
3. `reviews.jsonl` trend: do high-severity categories decline in more recent
   records?

This analysis will either confirm that the learning system is working (showing
declining trends) or confirm that it is not (showing flat or rising trends). The
result should drive the direction decision, not be used to retroactively justify
it.

### Recommendation 6: Apply Double-Loop Learning to the System Design [CONFIDENCE: MEDIUM-HIGH]

The brainstorm question "is the learning system's job to prevent code mistakes
or make Claude a better collaborator?" is a double-loop question. The answer
matters:

If the job is **code mistake prevention**, the system should invest in
deterministic enforcement (hooks, CI gates, ratchet mechanisms) and stop trying
to measure behavioral compliance.

If the job is **behavioral collaboration improvement**, the system should invest
in high-quality, pruned CLAUDE.md content (under 200 lines), periodic drift
audits, and accept probabilistic compliance as the ceiling.

If the job is **both**, maintain them as explicitly separate systems with
different metrics, success criteria, and investment priorities.

### Recommendation 7: Set a 60-Day Sunset for Any System That Cannot Prove Signal [CONFIDENCE: MEDIUM]

The "Prove It or Kill It" direction from the brainstorm is directionally
correct. Apply Lean MVP methodology: define a hypothesis, measure it for 60
days, and sunset systems that cannot demonstrate a signal. The
lifecycle-scores.jsonl has 20 systems scored, several with Action=0 or Action=1.
Systems that score Action=0 (no corrective action from captured knowledge)
should be required to demonstrate a declining violation trend within 60 days or
be decommissioned.

---

## Unexpected Findings

**The METR RCT direction-of-effect inversion.** The most important unexpected
finding: developers predicted AI would speed them up 24% but it actually slowed
them by 19% [55]. The perception is not just imprecise — it is directionally
inverted. This applies directly to session-quality self-assessment in SoNash:
subjective ratings of session productivity are systematically unreliable and
should not be used as evidence of learning effectiveness.

**The CLAUDE.md 200-line adherence threshold is documented in official
architecture specs.** This is not theoretical — it is an architectural
constraint that directly limits the codification-based learning approach.
CLAUDE.md is currently at 135 lines and approaching the threshold [41].

**hook-runs.jsonl is the best learning dataset in the project.** The research
found that this file, already being populated by the pre-commit and pre-push
hooks, is a purpose-built learning signal dataset that academic MSR researchers
would design from scratch. It is the primary substrate for proving learning
effectiveness — and it is already there [14].

**The SECI Internalization quadrant is structurally blocked.** No amount of
CLAUDE.md investment can achieve true internalization for Claude — weight
updates would be required. MEMORY.md and CLAUDE.md are prosthetic
externalization that substitute for true internalization. This reframes the
design problem: the goal is not to make Claude internalize rules but to make the
externalized artifacts as effective as possible within architectural constraints
[38].

**Propagation emerged as a meta-category of the limitation of per-file
enforcement.** Even when the pattern is known and the checker exists, ensuring
all instances are fixed requires a separate enforcement layer. The "3-layer
propagation enforcement system" built on 2026-03-30 is evidence that rule
enforcement at the file level is insufficient — pattern learning must account
for cross-file propagation [D7a].

**The SonarQube empirical finding.** A peer-reviewed study of 33 Apache Java
projects found SonarQube violations have "significant but small" effect on
fault-proneness — and clean classes may actually be slightly more change-prone
than classes with Code Smells [56]. This is a direct caution against treating
pattern enforcement as a reliable bug-prevention mechanism. It enforces
consistency; it does not reliably prevent defects.

---

## Challenges Section

_Placeholder for Phase 3 contrarian and out-of-the-box agent results._

No Phase 3 challenges were conducted. The research as conducted is based on 13
findings files from diverse searcher profiles (web, academic, codebase). The
most significant potential challenge to the conclusions is:

1. The flat violation rate could mean the checker is catching new violations as
   fast as they're introduced (system working) rather than failing to prevent
   them. The evidence does not distinguish these.
2. Behavioral learning may have more causal impact than code enforcement on
   actual session quality, which cannot be measured retroactively.
3. The 260-session data may be showing improvement in the right things (hook
   failure types migrating to new categories rather than repeating old ones)
   that the current metrics miss.

---

## Sources

### Tier 1 — Official Documentation and Peer-Reviewed Research

| [1] | https://code.claude.com/docs/en/memory | Claude Code Memory Docs |
Official | HIGH | 2026 | | [2] |
https://docs.windsurf.com/windsurf/cascade/memories | Windsurf Cascade Memories
| Official | HIGH | Current | | [3] | https://cursor.com/changelog/0-49 | Cursor
v0.49 Changelog | Official | HIGH | Apr 2025 | | [4] |
https://code.visualstudio.com/docs/copilot/customization/custom-instructions |
VS Code Copilot Instructions | Official | HIGH | Current | | [5] |
https://developers.openai.com/codex/guides/agents-md | Codex AGENTS.md |
Official | HIGH | Current | | [6] |
https://github.blog/enterprise-software/governance-and-compliance/ensuring-compliance-in-developer-workflows/
| GitHub Compliance in Developer Workflows | Official | HIGH | 2024 | | [7] |
https://onlinelibrary.wiley.com/doi/full/10.1002/smr.2440 | Castellanos 2022
Systematic Review | Peer-reviewed | HIGH | 2022 | | [8] |
https://code.claude.com/docs/en/hooks-guide | Claude Code Hooks Guide | Official
| HIGH | 2026 | | [9] |
https://getdx.com/research/measuring-developer-productivity-with-the-dx-core-4/
| DX Core 4 Framework | Official | HIGH | 2025 | | [10] |
https://martinfowler.com/articles/developer-effectiveness.html | Maximizing
Developer Effectiveness (Cochran) | Authority | HIGH | 2021 | | [11] |
https://docs.sonarsource.com/sonarqube-server/2025.1/user-guide/about-new-code |
SonarQube New Code Docs | Official | HIGH | 2025 | | [12] |
https://github.com/wogscpar/SZZUnleashed | SZZUnleashed | Tool | HIGH | 2024 | |
[13] | https://git-scm.com/book/en/v2/Git-Tools-Searching | Git Pickaxe
Documentation | Official | HIGH | Current | | [14] |
https://arxiv.org/html/2508.16053v1 | Measuring Effectiveness of Code Review
Comments | Academic | HIGH | 2025 | | [15] |
https://pmc.ncbi.nlm.nih.gov/articles/PMC5407170/ | ITS Regression Tutorial
(PMC) | Peer-reviewed | HIGH | 2017 | | [16] |
https://pmc.ncbi.nlm.nih.gov/articles/PMC3992321/ | SCED for Evidence-Based
Practice (PMC) | Peer-reviewed | HIGH | 2014 | | [17] |
https://google.github.io/CausalImpact/CausalImpact.html | CausalImpact
Documentation | Official | HIGH | Current | | [18] |
https://dl.acm.org/doi/10.1145/3636515 | Automated Grading and Feedback (ACM
TOCE) | Peer-reviewed | HIGH | 2024 | | [19] |
https://queue.acm.org/detail.cfm?id=3454124 | SPACE of Developer Productivity
(ACM Queue) | Peer-reviewed | HIGH | 2021 | | [20] |
https://arxiv.org/abs/2507.09089 | METR AI Productivity Study 2025 | Academic |
HIGH | 2025 |

### Tier 2 — High-Quality Practitioner and Industry Research

| [21] | https://docs.cline.bot/features/memory-bank | Cline Memory Bank Docs |
Official | HIGH | Current | | [22] |
https://docs.roocode.com/features/custom-instructions | Roo Code Custom
Instructions | Official | HIGH | Current | | [23] |
https://dev.family/blog/article/cursor-vs-copilot-vs-windsurf-how-different-ai-agents-write-code-from-the-same-instructions
| AI Agent Rule Compliance Study | Technical | MEDIUM | 2025 | | [24] |
https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/
| Gemini CLI Hooks | Official | HIGH | 2026 | | [25] |
https://axify.io/blog/goodhart-law | Goodhart's Law in Software Engineering |
Practitioner | MEDIUM | 2024 | | [26] |
https://jellyfish.co/blog/goodharts-law-in-software-engineering-and-how-to-avoid-gaming-your-metrics/
| Goodhart's Law (Jellyfish) | Practitioner | MEDIUM | 2024 | | [27] |
https://en.wikipedia.org/wiki/Goodhart's_law | Goodhart's Law — Wikipedia |
Reference | MEDIUM | Current | | [28] |
https://tim.blog/2009/05/19/vanity-metrics-vs-actionable-metrics/ | Vanity vs.
Actionable Metrics — Ries | Canonical | HIGH | 2009 | | [29] |
https://lethain.com/measuring-engineering-organizations/ | Measuring Engineering
Organizations (Larson) | Expert | HIGH | 2024 | | [30] |
https://www.infoworld.com/article/4010318/software-development-meets-the-mcnamara-fallacy.html
| McNamara Fallacy in Software | Industry | HIGH | 2024 | | [31] |
https://lethain.com/measuring-engineering-organizations/ | Will Larson on
measurement theater | Expert | HIGH | 2024 | | [32] |
https://dora.dev/guides/dora-metrics/ | DORA Metrics Guide | Official | HIGH |
2024 | | [33] |
https://backstage.spotify.com/discover/blog/soundcheck-healthier-tech-culture/ |
Spotify Soundcheck Case Study | Official | HIGH | 2024 | | [34] |
https://userpilot.com/blog/build-measure-learn/ | Build-Measure-Learn Loop |
Practitioner | MEDIUM | 2024 | | [35] |
https://www.notion.com/blog/how-we-evolved-our-code-notions-ratcheting-system-using-custom-eslint-rules
| Notion Ratcheting System | Official (Notion) | HIGH | 2023 | | [36] |
https://github.com/justjake/eslint-seatbelt | eslint-seatbelt Open Source |
Source | HIGH | 2024 | | [37] |
https://neugierig.org/software/blog/2022/01/rethinking-errors.html | Rethinking
Errors, Warnings, and Lints | Engineering essay | MEDIUM | 2022 | | [38] |
https://doi.org/10.1108/vjikms-10-2024-0357 | GRAI Framework — SECI for Gen AI
(VINE Journal) | Peer-reviewed | HIGH | 2025 | | [39] |
https://pmc.ncbi.nlm.nih.gov/articles/PMC6914727/ | SECI Operationalization
(PMC) | Peer-reviewed | HIGH | 2019 | | [40] |
https://www.researchgate.net/publication/281900511_The_Information_Overload_Paradox
| Information Overload Paradox | Peer-reviewed | HIGH | 2015 | | [41] |
https://code.claude.com/docs/en/memory | Claude Code Memory Docs (200-line
threshold) | Official | HIGHEST | 2026 | | [42] |
https://jeffreypfeffer.com/books/the-knowing-doing-gap/ | The Knowing-Doing Gap
(Pfeffer & Sutton) | Academic | HIGH | 2000 | | [43] |
https://hbr.org/1977/09/double-loop-learning-in-organizations | Double-Loop
Learning (Argyris, HBR 1977) | Peer-reviewed | HIGH | 1977 | | [44] |
https://www.remote.tools/remote-work/knowledge-decay-and-half-life-of-information
| Knowledge Decay Half-Life | Practitioner | MEDIUM | N/A | | [45] |
https://www.saastr.com/the-live-complete-guide-to-vibe-coding-without-a-developer-what-we-actually-learned-after-building-5-production-apps/
| Vibe Coding Without Developer | Practitioner | MEDIUM | 2025 | | [46] |
https://pmc.ncbi.nlm.nih.gov/articles/PMC10852250/ | Bias in Self-Evaluation
(PMC) | Peer-reviewed | HIGH | 2024 | | [47] |
https://realkm.com/2025/11/19/ai-is-changing-the-dunning-kruger-effect-with-higher-ai-literacy-correlating-with-overestimation-of-competence/
| AI Literacy and Competence Overestimation | Academic summary | HIGH | 2025 | |
[48] | https://hbr.org/2025/12/ai-is-changing-how-we-learn-at-work | AI Changes
How We Learn at Work (HBR/Gratton) | Authoritative | HIGH | 2025 | | [49] |
https://cacm.acm.org/research/scaling-static-analyses-at-facebook/ | Scaling
Static Analyses at Facebook (CACM) | Peer-reviewed | HIGH | ~2019 | | [50] |
https://arxiv.org/html/2504.12517v1 | Code Improvement Practices at Meta |
Preprint | MEDIUM-HIGH | 2025 | | [51] |
https://engineering.fb.com/2022/11/16/culture/meta-code-review-time-improving/ |
Meta Code Review Time Improvements | Official | HIGH | 2022 | | [52] |
https://sre.google/sre-book/postmortem-culture/ | Google SRE Postmortem Culture
| Official | HIGH | 2016 | | [53] |
https://www.gartner.com/reviews/market/chaos-engineering-tools | Gartner Chaos
Engineering Report | Analyst | MEDIUM-HIGH | 2023 | | [54] |
https://arxiv.org/html/2502.03570v1 | Retrospective Practices in Agile Teams |
Peer-reviewed | MEDIUM-HIGH | 2025 | | [55] |
https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ | METR
AI Developer Productivity RCT | Research | HIGH | 2025 | | [56] |
https://arxiv.org/abs/1908.11590 | SonarQube Issues — Effect on Faults
(Lenarduzzi) | Peer-reviewed | HIGH | 2020 | | [57] |
https://semgrep.dev/blog/2026/introducing-semgrep-custom-workflows/ | Semgrep
Custom Workflows | Official | HIGH | 2026 | | [58] |
https://pmc.ncbi.nlm.nih.gov/articles/PMC5407170/ | ITS Sample Size Requirements
| Peer-reviewed | HIGH | 2019 | | [59] |
https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ | METR
20-Confound Checklist | Research | HIGH | 2025 | | [60] |
https://github.com/ishepard/pydriller | PyDriller Tool | Tool | HIGH | 2024 | |
[61] | https://martinfowler.com/articles/llm-learning-loop.html | The Learning
Loop and LLMs (Fowler) | Authority | HIGH | 2024 | | [62] |
https://arxiv.org/abs/2603.15566 | Lore Protocol — Git Commit Knowledge |
Academic | HIGH | 2026 |

### Tier 3 — Supporting Sources

| [63] |
https://www.harness.io/blog/best-practices-for-using-policy-as-code-in-ci-cd-pipelines-with-harness
| Harness Policy-as-Code | Vendor | MEDIUM-HIGH | 2024 | | [64] |
https://arxiv.org/html/2509.23994v1 | AI Agent Code of Conduct
(Policy-as-Prompt) | Academic | MEDIUM-HIGH | 2025 | | [65] |
https://dasroot.net/posts/2026/03/code-quality-automation-linters-formatters-pre-commit-hooks/
| Pre-commit Hook Case Study | Community | MEDIUM | 2026 | | [66] |
https://en.wikipedia.org/wiki/SECI_model_of_knowledge_dimensions | SECI Model
Wikipedia | Reference | MEDIUM | Current | | [67] |
https://www.apqc.org/blog/2024-knowledge-management-priorities-trends | APQC
2024 KM Priorities | Research org | HIGH | 2024 | | [68] |
https://arxiv.org/abs/1910.07658 | CAME — Anti-pattern Detection from Code
History | Academic | HIGH | 2019 | | [69] |
https://getdx.com/blog/technical-debt-ratio/ | Technical Debt Ratio (DX) |
Practitioner | MEDIUM-HIGH | 2024 | | [70] |
https://www.sonarsource.com/the-state-of-code/ | State of Code 2025 (Sonar) |
Official research | HIGH | 2025 |

---

## Methodology

**Research conducted:** 2026-04-03 **Searcher profiles deployed:** web,
academic, codebase (3 distinct profiles) **Sub-questions investigated:** 11
distinct questions across 13 findings files **Sources catalogued:** 162 across
all findings files **Sources cited in this report:** 70 unique sources
**Codebase artifacts analyzed:** learning-routes.jsonl,
pending-refinements.jsonl, reviews.jsonl, review-metrics.jsonl,
hook-warnings-log.jsonl, lifecycle-scores.jsonl, verified-patterns.json,
AI_REVIEW_LEARNINGS_LOG.md, git history (all branches) **Confidence
distribution:** HIGH: 38 claims, MEDIUM-HIGH: 14 claims, MEDIUM: 8 claims, LOW:
0, UNVERIFIED: 0

---

## Version History

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-04-03 | Initial synthesis from 13 findings files |
