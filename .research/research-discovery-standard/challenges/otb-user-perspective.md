# OTB Challenge: User Perspective on the Research & Discovery Standard

<!-- prettier-ignore-start -->
**Challenger:** Claude Opus 4.6 (1M context) -- representing USER perspective
**Date:** 2026-03-24
**Target:** W4c Standard Architecture + SQ6 Natural Invocation
**Role:** Solo developer who uses Claude Code daily, maintains 100+ skills, 40+ agents, hooks, teams, MCP servers
<!-- prettier-ignore-end -->

---

## Challenge 1: Cognitive Load -- The Complexity Ceiling

**UX Concern:**

The user already manages: CLAUDE.md (135 lines of rules), 27+ agents, 100+
skills, 4 hook files, 2 teams, 5+ MCP servers, CANON ecosystems, SWS phases, a
TDMS pipeline, and a pre-commit enforcement chain. The proposed standard adds 6
new documents (RDS-PROTOCOL, RDS-ENFORCEMENT, RDS-TIERS, RDS-TOOLS, RDS-TEAMS,
RDS-VERIFICATION), a 4-tier model with escalation/de-escalation criteria, a
unified confidence scale with 4 levels and 4 basis tags, 17 verification checks
at the highest tier, and a shared vocabulary of 10+ controlled terms.

The architecture document itself is 900 lines across 12 sections. That is the
_specification_ -- the documents it specifies will be longer.

There is a real threshold where a solo developer's tooling infrastructure
requires more maintenance effort than the work it supports. The user is not
running a consultancy with analysts who specialize in methodology. The user is
one person building a health journaling app. When the meta-system (the system
that governs how systems are built) consumes 30%+ of session time in overhead,
the tooling has become the product instead of serving the product.

Specific concern: Section 9 introduces 10 controlled vocabulary terms. The user
must now remember that "finding" replaces "claim, discovery, violation, result"
and that "claim" is a subtype of "finding." This is terminology management on
top of an already terminology-heavy environment (CANON tenets, SWS phases, TDMS
pipelines, hook tiers, enforcement levels).

**Proposed Mitigation:**

- Cut the document count from 6 to 3: merge RDS-PROTOCOL + RDS-TIERS (the user
  needs tier definitions alongside the protocol), merge RDS-TOOLS + RDS-TEAMS
  (tool and agent selection are a single decision), and merge RDS-ENFORCEMENT +
  RDS-VERIFICATION (enforcement is meaningless without the verification it
  enforces). Three documents, not six.
- The controlled vocabulary should be an appendix, not a section. The AI should
  use the vocabulary internally; the user should not need to learn it.
- RDS-PROTOCOL.md (the always-loaded document) must stay under 80 lines. The
  current proposal says "under 200 lines" -- that is too long for something
  loaded on every session alongside CLAUDE.md's 135 lines.

**Priority:** HIGH -- If the standard is too complex to internalize, it will be
ignored regardless of how well-designed it is. Complexity is the primary failure
mode for solo developer tooling.

---

## Challenge 2: "Just Let Me Work" -- Unwanted Friction on Known Tasks

**UX Concern:**

The user frequently knows exactly what to do. They want to grep a config file,
edit a function, commit, and move on. The proposed standard adds Layer 1 hook
detection (user-prompt-handler.js, Phase 1-3), Layer 2 behavioral rules (new
guardrail #15: "Research before implementation in unfamiliar territory"), and
Layer 3 skill-internal enforcement (tier declaration at entry, escalation
protocol).

Section 4C proposes a new guardrail: "Before modifying code in a subsystem not
previously read this session, or implementing features involving technology
beyond training cutoff, assess whether research is needed."

Every package in CLAUDE.md Section 1 is "beyond training cutoff" (all 2026
versions vs May 2025 training data). This guardrail would trigger on virtually
every implementation task. The user knows their own codebase. Being told "you're
in unfamiliar territory, consider research" when they wrote the code last week
is patronizing and wastes time.

The Phase 3 hook proposal (post-read-handler escalation after 5+ files in a new
subtree) would fire constantly during normal development. Reading 5 files in
`functions/src/` to understand a bug is not "exploring unfamiliar territory" --
it is debugging.

**Proposed Mitigation:**

- The "unfamiliar territory" signal must exclude directories the user has
  touched in the last 5 sessions, not just the current session. Use episodic
  memory or git log to check authorship recency.
- The "beyond training cutoff" trigger must be limited to API questions, not all
  implementation. The user knows how `useState` works even if the React version
  number changed.
- All T0 and T1 research should be invisible to the user. The AI does it
  internally as part of normal work. No message, no suggestion, no notification.
  The user should only be aware of research at T2+ when it requires their time.

**Priority:** HIGH -- Friction on routine tasks is the fastest way to make a
user disable a system entirely. The "just let me work" impulse is strong and
legitimate.

---

## Challenge 3: Session Time Budget -- Research vs. Implementation

**UX Concern:**

The user's typical session is 2-4 hours. The architecture proposes these time
budgets: T0 < 2 minutes, T1 5-15 minutes, T2 30-90 minutes, T3 2-6 hours. A
single T3 research campaign consumes an entire session with zero implementation.
A T2 investigation takes 25-50% of a 2-hour session.

The architecture proposes 6 implementation phases across 6-7 sessions just to
build the standard itself. That is 12-28 hours of session time before the
standard produces any value for the actual product (the health journaling app).

The human-in-the-loop rules (Section 5D) add further time cost: T2 requires
"approval of research plan before execution." T3 requires "approval of plan +
mid-research checkpoint + approval of findings." Each approval gate is a context
switch for the user -- they must stop thinking about their task, evaluate a
research plan, approve it, then re-enter their task context.

For a solo developer, the question is always: "Is this research time better
spent than just trying something and iterating?" Often, the answer is yes for
T3-class decisions but no for T1/T2 tasks where experimentation is faster than
systematic research.

**Proposed Mitigation:**

- Hard cap: research (all tiers combined) must not exceed 20% of any session
  unless the user explicitly declares a research session. The standard should
  track cumulative research time and surface a warning when approaching the cap.
- T2 approval gates should be opt-in, not default. The AI presents the
  sub-questions, starts working immediately, and the user can interrupt if the
  direction is wrong. This respects the user's time while maintaining
  transparency.
- The implementation phases should be cut. Build Phase 1 (behavioral rules) and
  Phase 3 (hook integration) only. Defer Phases 2, 4, 5, 6 until the user has
  evidence that the standard is helping. Do not front-load 7 sessions of
  meta-work.

**Priority:** HIGH -- Time is the scarcest resource for a solo developer. A
standard that consumes more time than it saves will be abandoned.

---

## Challenge 4: Alert Fatigue -- Another Layer of "You Should..."

**UX Concern:**

SQ6 Section 4.1 already identifies the alert fatigue problem honestly: the
current hook system generates a guardrails message on every non-trivial prompt,
alerts reminders every 10 minutes, plan mode banners on complex requests, agent
suggestions on every file write, and context warnings at 15+ files read.

The proposed additions: research keyword detection as Priority 5.5 in
user-prompt-handler.js, research-before-plan suggestions when the multi-step
banner fires, exploration-to-research escalation after 5+ files in a new
subtree, and research sensitivity settings.

The anti-fatigue mechanisms proposed (compound signals, session dedup, user
sensitivity control) are sensible in theory. But the compound signal approach
still adds detection logic that runs on every prompt, and the sensitivity
control is yet another setting the user must configure and remember.

The deeper issue: the architecture adds research suggestions to a system that
already surfaces security directives, bug routing, UI routing, database routing,
planning suggestions, exploration hints, agent suggestions, context warnings,
and compliance alerts. The user's attention is already saturated. Adding
"consider research" to this list -- even with dedup and compound signals --
contributes to the wallpaper effect that Guardrail #6 explicitly warns against.

**Proposed Mitigation:**

- Research suggestions should REPLACE planning suggestions when both would fire,
  not stack on top. If the hook detects "this is a complex task involving
  unfamiliar technology," the output should be ONE suggestion ("Consider
  /deep-research before planning") not TWO ("Consider /deep-plan" + "Consider
  /deep-research").
- Implement a global alert budget: maximum 2 hook-generated suggestions per
  prompt. If security (P1) and research (P5.5) both trigger, security wins and
  research is suppressed for that prompt.
- The sensitivity setting should default to "low" (only stdout directives), not
  "medium." Let the user opt into more suggestions after they have experienced
  the system, not before.
- Consider removing the post-read-handler escalation entirely (Phase 3 of hook
  integration). The cost-benefit is poor: it adds persistent state tracking,
  runs on every file read, and the signal (5+ files in a subtree) has a high
  false-positive rate for normal development workflows.

**Priority:** HIGH -- Alert fatigue is an acknowledged existing problem. Adding
to it while claiming to mitigate it is a contradiction the standard must
resolve.

---

## Challenge 5: Transparency -- Invisible Research Is a Trust Problem

**UX Concern:**

T0 (Automatic/Reflexive) is defined as "research that happens without the AI
consciously deciding to research" with "zero additional cognitive overhead" and
"no artifacts persisted." T1 also produces no persisted artifacts.

This means the AI is doing research work -- reading files, checking versions,
searching memory -- without the user knowing. The user sees the AI take 2
minutes longer on a response and does not know why. If the research was useful,
the user does not learn that. If the research was wrong, the user cannot debug
the AI's reasoning.

For a user who already has a trust relationship with their AI assistant (the
CLAUDE.md rules exist because of past trust violations), invisible work is a
concern. The user has guardrails like #12 ("Verify file state against the
filesystem, not documentation") precisely because they have been burned by the
AI making invisible assumptions.

The cross-system handoff rule (Section 3E: "confidence is the minimum of source
and destination assessments, a claim cannot gain confidence by moving between
systems") is sound methodology. But the user never sees these handoffs
happening. They see a final recommendation with a confidence label and no
insight into the pipeline that produced it.

**Proposed Mitigation:**

- T0 research should be invisible in the normal flow but logged. Add a
  lightweight T0 activity log (research-activity.jsonl or similar) that records
  what was checked and what was found. The user never sees this unless they ask,
  but it exists for debugging and for the value demonstration metric (Challenge
  7).
- T1 research should include a one-line summary in the response: "Checked Zod 4
  docs for discriminated union syntax -- confirmed API matches." Not a full
  research report, just a breadcrumb that shows work was done.
- T2/T3 research must show the confidence pipeline: "This recommendation is HIGH
  [source] -- based on 3 independent sources, adversarial check found no
  counter-evidence." The basis tags are a good idea but they should be surfaced
  to the user, not hidden in JSONL files.
- Never let invisible research silently influence a recommendation. If T0
  research changed the AI's approach, say so: "I checked the Next.js 16 docs and
  the API changed from what I initially expected, so I'm using X instead of Y."

**Priority:** MEDIUM -- Transparency is important but the current trust
relationship is functional. The mitigations here are enhancements, not
requirements for launch.

---

## Challenge 6: Override -- "Skip Research, I Know What I'm Doing"

**UX Concern:**

The architecture defines override mechanisms at each layer: Layer 1 (hooks) uses
stderr hints for T0/T1 and stdout directives for T2/T3. Layer 2 (behavioral
rules) is a guardrail that the AI follows. Layer 3 (skill internals) has phase
gates that "cannot be skipped."

The user should be able to say "skip research" at any point and have it work
immediately. Currently:

- Stderr hints can be ignored (good).
- Stdout directives require action from the AI, but the AI can be told to ignore
  them. This is awkward -- the user must override the hook through the AI.
- Behavioral rules (guardrail #15) can be overridden by the user saying "just do
  it" but the AI may push back ("the standard recommends research first").
- Skill internals with "cannot be skipped" phase gates are the biggest concern.
  If the user invokes `/deep-research` but realizes mid-way that they do not
  need it, can they exit cleanly? Or must they complete all phases?

The tiered human-in-the-loop rules (Section 5D) make T2 require plan approval
and T3 require plan + checkpoint + findings approval. These are sensible gates
but they are three separate interruptions. The user should be able to say
"approved, run it all" once and not be interrupted again unless something fails.

**Proposed Mitigation:**

- Add a universal override phrase: "skip research" or "I know this" that
  immediately suppresses all research suggestions for the current task. The AI
  acknowledges with a one-line note and proceeds. No pushback, no "are you
  sure?", no guardrail citation.
- For `/deep-research` and other explicit skill invocations, add a clean exit:
  `/stop` or `ctrl-c` equivalent that produces a partial output from whatever
  phases completed, rather than requiring all phases.
- T2/T3 approval gates should support batch approval: "approved, proceed through
  all checkpoints" as a single command. The user can still intervene at any
  point but is not forced to respond at every gate.
- Research sensitivity "low" setting should suppress ALL research suggestions,
  not "only stdout directives." The user who sets sensitivity to low is saying
  "I will invoke research when I want it, do not suggest it."

**Priority:** MEDIUM -- The override mechanisms exist in the proposal but need
to be faster and less friction-heavy. A solo developer will not tolerate a
system that fights their explicit instructions.

---

## Challenge 7: Value Demonstration -- How Do I Know This Is Helping?

**UX Concern:**

The standard proposes extensive infrastructure (6 documents, 4 tiers, hook
integration, team spawning rules, verification protocols) but has no feedback
loop that shows the user whether this infrastructure is producing value.

How does the user answer: "Was the 45-minute T2 research session worth it, or
could I have just tried something and fixed it in 20 minutes?"

The risk assessment (Section 11) lists "Standard is too complex, AI ignores it"
as MEDIUM likelihood / HIGH impact, with the mitigation "Phase 1 behavioral-only
approach tests adoption." But what metrics determine whether adoption succeeded?
The exit criteria for Phase 1 is "AI correctly identifies research tier for 5
test scenarios." This tests the AI, not the value to the user.

Without value demonstration, the standard becomes an article of faith. The user
maintains it because it seems like a good idea, not because they have evidence
it works. Eventually, faith erodes and the standard joins the pile of
well-intentioned infrastructure that nobody maintains.

The `/pr-retro` skill and `/session-end` pipeline already track metrics. But no
proposed metric captures "research prevented a bad decision" or "research saved
rework time."

**Proposed Mitigation:**

- Track a "research-influenced decisions" metric in session-end. When the AI
  does T1+ research and it changes the approach (compared to what the AI would
  have done without research), log it. Periodically surface: "In the last 10
  sessions, research changed the approach 4 times. 3 of those were confirmed
  correct in subsequent sessions."
- Track "research time vs rework time" as a proxy. If a session does T2 research
  (45 min) and has zero rework, compare against sessions without research that
  had rework. This requires several sessions of data but produces a meaningful
  signal.
- Add a lightweight "was this research useful?" prompt after T2/T3 completes. A
  single question: "Did this research change your approach? (yes/no/unsure)."
  Log the answer. Do not make it a survey.
- Phase 1 exit criteria should include a user-facing metric: "User reports the
  tier model helped with at least 2 decisions in the first 5 sessions." If it
  did not, stop building and reconsider the standard's scope.

**Priority:** MEDIUM -- Value demonstration is critical for long-term
sustainability but not required for initial launch. The standard can launch
without it and add metrics in Phase 2-3, as long as there is a commitment to
measuring value before proceeding to Phase 4+.

---

## Summary: Priority Matrix

| #   | Challenge           | Priority   | Core Risk                                                       |
| --- | ------------------- | ---------- | --------------------------------------------------------------- |
| 1   | Cognitive load      | **HIGH**   | Standard is too complex for a solo developer to internalize     |
| 2   | "Just let me work"  | **HIGH**   | Friction on routine tasks drives system disablement             |
| 3   | Session time budget | **HIGH**   | Research overhead exceeds implementation time                   |
| 4   | Alert fatigue       | **HIGH**   | Research suggestions become wallpaper alongside existing alerts |
| 5   | Transparency        | **MEDIUM** | Invisible research erodes trust and prevents debugging          |
| 6   | Override            | **MEDIUM** | Fighting the standard costs more than following it              |
| 7   | Value demonstration | **MEDIUM** | Without evidence of value, maintenance motivation decays        |

**Overall assessment:** The Research & Discovery Standard solves a real problem
(ad-hoc research with no consistency, no verification, and no reuse). The 4-tier
model and unified confidence scale are sound ideas. But the proposed
implementation scope -- 6 documents, 6 implementation phases across 7 sessions,
hook integration, team spawning rules, CANON ecosystem registration -- is
disproportionate to the problem for a solo developer building a health app.

The standard should launch as a lightweight behavioral protocol (guardrail +
reference doc, under 80 lines) with invisible T0/T1, user-visible T2/T3, and a
kill switch. Build the infrastructure only after the behavioral protocol
demonstrates value across 10+ sessions.
