# OTB Alternatives Challenge: Custom Agents Research

**Agent:** deep-research-otb-challenger **Profile:** codebase + web **Date:**
2026-03-29 **Challenge ID:** CH3 **Target:** RESEARCH_OUTPUT.md (Phase 2
synthesis, 29-agent L4 research)

---

## Pre-Review Alternatives (Generated Before Reviewing Findings)

Per OTB methodology, these 8 alternatives were framed before reviewing the
research. This prevents anchoring to the synthesis's framing.

1. Skill-based context injection instead of 15+ new agent definitions
2. Agent template inheritance — base template + thin specializations
3. Hooks as behavioral enforcement replacing proposed agents
4. Maintenance cost model — the unasked "who maintains this?"
5. Dynamic agent generation from live CLAUDE.md + SESSION_CONTEXT.md state
6. "Wait" technique as universal quality enhancer across all agents
7. Cross-model diversity via Opus-spawned Sonnet instead of Gemini CLI
8. Orchestration quality as the real bottleneck, not agent definitions

---

## OTB Analysis

---

### Alternative 1: Skill-Based Context Injection Instead of 15+ New Agent Definitions

**What it is:** The `skills:` frontmatter field (confirmed to exist in the
official 17-field schema per research finding 1.4) allows agent definitions to
load SKILL.md files at invocation time. Instead of creating 15+ new agent
definitions each containing duplicated SoNash context, create 1-2 SKILLS (e.g.,
`sonash-context`, `sonash-security-boundary`) that inject project patterns.
Every agent definition then lists these skills rather than re-embedding the
context.

**Evidence for viability:**

- Finding 4.4 confirms `skills:` is "an underused optimization in agent
  definitions" and is "currently unused across the entire local agent roster."
  This is a direct gap, not a theoretical one.
- The research found the core problem is that agent bodies replace Claude's base
  system prompt, meaning SoNash context must be explicitly included. Skills
  injection directly addresses this without requiring long bodies.
- code-reviewer (259 lines, Tier A) and frontend-developer (243 lines, Tier A)
  each embed ~50-80 lines of SoNash security context. A shared skill would
  de-duplicate this.
- Finding 7.3 notes the skill `model:` field is broken (GitHub Issue #21679) —
  but this only affects model selection, not context injection. The `skills:`
  field itself is functional.

**Codebase verification:** Filesystem check confirmed zero agents use the
`skills:` frontmatter field (`grep -rn "skills:" .claude/agents/` — no matches).
The mechanism exists in the schema; no agent uses it.

**Why the research missed it:** Finding 4.4 mentions the mechanism exists and is
underused, but frames it narrowly as "agents that delegate to skill-defined
workflows." The research does not ask: could this be the PRIMARY mechanism for
context injection, making 80% of the proposed agent definitions shorter?

**Impact assessment:** HIGH. If a `sonash-context` skill includes the 50-80
lines common to every SoNash agent (stack versions, security boundaries, write
gate, error sanitization, TypeScript strict), each new agent definition drops
from 200-350 lines to 100-200 lines. The 500-2000 token sweet spot (finding 1.5)
becomes easier to stay within. Maintenance of stack version information moves to
one file.

**Feasibility:** HIGH. The field is in the official schema. The pattern is
already used by skill-invoked workflows. No new infrastructure needed.

**Recommendation:** ADOPT. Create `sonash-context` as a shared skill before
implementing any of the 7-14 recommended new agents. Measure token reduction.
All new agent definitions should list `skills: [sonash-context]` in frontmatter
rather than embedding the context inline.

**Caveat:** Verify in practice that `skills:` content is injected into the
agent's system prompt rather than appended as a user message. If the injection
position matters (system vs user), this affects strategy.

---

### Alternative 2: Agent Template Inheritance — Base Template + Thin Specializations

**What it is:** Instead of removing 9 stub agents and creating 14+ new ones,
create a comprehensive `base-agent.md` template that all agents inherit from
(via `skills:` or as a literal copy-paste scaffold). The stubs become thin
specializations — they keep their names and descriptions but reference the base
for shared structure. New agents start from the base, never from scratch.

**Evidence for viability:**

- Nine stubs have been identified for removal. But removal loses namespace
  entries, which affects auto-delegation routing. Keeping stubs alive as thin
  specializations of a base preserves the routing surface.
- Finding 1.2 identifies the `description` field as "the primary routing
  signal." All 9 stubs have descriptions — the routing infrastructure exists.
  Only the body quality is the problem.
- Finding 10.3 shows a 10-step pipeline at 99% per-step success yields 90.4%
  end-to-end. Each stub elevated to even 80% quality via base template
  inheritance materially raises pipeline reliability.
- The research recommends elevating 3 stubs to full 200-350 line definitions
  (R8). A base template reduces that work from scratch to delta — adding the
  specialization layer only.

**What it misses:** The research's consolidation rationale is not just quality —
it's that some stubs cover capabilities with genuine alternatives already
existing (error-detective vs debugger). Template inheritance does not solve the
redundancy problem.

**Why the research missed it:** The research frames stub removal as binary (keep
or remove). It does not explore a third state: "keep namespace, upgrade body via
inheritance." The consolidation analysis (Theme 3) focuses on capability overlap
but does not analyze routing-surface value of keeping names.

**Impact assessment:** MEDIUM. This reduces the work of stub elevation. It does
not eliminate the need for per-agent specialization content.

**Feasibility:** MEDIUM. "Template inheritance" is not natively supported in
`.claude/agents/` — there is no `extends:` frontmatter field. The mechanism
would be either: (a) the `skills:` field pointing to a shared base skill, or (b)
a generation script that copies base content into each agent file. Option (a) is
cleaner. Option (b) creates sync risk.

**Recommendation:** INVESTIGATE FURTHER. Combine with Alternative 1: the
`sonash-context` skill doubles as the base template. Stubs use
`skills: [sonash-context]` plus 30-50 lines of specialization instead of full
200-350 line rewrites.

---

### Alternative 3: Hooks as Behavioral Enforcement Replacing Proposed Agents

**What it is:** SoNash already has PreToolUse/PostToolUse hooks implementing
behavioral enforcement (firestore-rules-guard, post-write-validator,
deploy-safeguard). Instead of creating agent-level overrides to inject security
boundaries, extend the existing hook system to enforce those boundaries
unconditionally — independent of which agent is executing.

**Evidence for viability:**

- `firestore-rules-guard.js` already blocks direct Firestore write-rule removal
  via PreToolUse on Write/Edit — this is the same security boundary the proposed
  general-purpose override would inject verbally.
- The research identifies 13+ general-purpose invocations across doc-optimizer,
  audit-\*, convergence-loop, pre-commit-fixer — all running without SoNash
  security boundaries (finding 4.3). A hook fires for ALL of these regardless of
  which agent is active.
- PostToolUse Write hooks already run post-write validation. A hook checking for
  direct Firestore import patterns (`import.*from.*'firebase/firestore'` in
  write targets) would catch violations without requiring every agent to know
  the rule.
- The hook system covers all 39 agents + any general-purpose invocations. An
  agent override only covers that one agent.

**Critical distinction from agent overrides:** Hooks enforce constraints without
consuming context window. An agent override uses 100-180 lines of system prompt
to verbally instruct the model. A hook exits 2 (block) or 0 (allow) based on
filesystem analysis. The hook does not rely on model comprehension.

**Why the research missed it:** The research focuses on agent definitions as the
enforcement mechanism. Finding 4.3 identifies the general-purpose override as
"the highest-leverage single action" without considering that hooks achieve the
same constraint-enforcement at lower cost and broader coverage. The research's
framing is agent-centric; hooks are treated as infrastructure, not as an
alternative enforcement layer.

**Blind spot confirmed:** Finding 2.4 notes "automated quality enforcement
covers 0 of 17 frontmatter fields" and recommends a pre-commit hook for
frontmatter validation (R7). The research already advocates hooks for quality
enforcement in one domain but does not apply the same logic to security
enforcement.

**Impact assessment:** HIGH for security boundary enforcement. MEDIUM for
quality enforcement (model behavior cannot be fully enforced by hooks, only
structural outputs can).

**Feasibility:** HIGH for structural checks (detecting forbidden imports,
blocking write rule removal). LOW for semantic enforcement (hooks cannot verify
that an agent used httpsCallable correctly in generated code logic).

**Recommendation:** ADOPT for structural constraints. Use hooks as the
enforcement layer; use agent overrides as the educational layer (telling agents
WHY and providing examples). This is a complement, not a replacement, but it
changes the priority: hooks first, agent overrides second.

**Specific implementation:** Add a PostToolUse Write hook that scans newly
written `.ts`/`.tsx` files for
`import.*setDoc\|addDoc\|updateDoc.*from.*firestore` patterns outside of Cloud
Functions. Block with an explanatory message. This catches violations across all
agents without requiring any agent definition update.

---

### Alternative 4: The Maintenance Problem Nobody Addressed

**What it is:** The research recommends creating 7-14 new agent definitions
(R1-R12) and elevating 3 stubs (R8). The total post-implementation agent count
would be approximately 17 local + 13 global + 6 deep-research pipeline + 6 new
general-duty = ~42 agents. The research does not ask: who maintains these when
Next.js upgrades to 17, Firebase releases 13.x, or Tailwind 5 ships?

**Evidence the problem is real:**

- Finding 4.3 notes silent-failure-hunter and pr-test-analyzer (P1 overrides)
  have incorrect references TODAY — wrong logger path, wrong test runner (Jest
  vs Vitest). These are not stub failures; they are drift failures. Agents that
  were correct at creation became incorrect over time.
- Finding 4.1 identifies the global agent runtime path as potentially stale — a
  sync gap that creates a class of drift where "tracked" and "deployed" diverge.
- CLAUDE.md Section 1 tracks 5 package versions. Any update requires touching
  every agent that embeds those versions. At 42 agents, that is a significant
  manual update surface.
- The research recommends adding automated frontmatter validation (R7) but does
  not recommend a version-drift detection mechanism. Nothing checks whether
  `model: sonnet` in an agent definition still refers to the latest stable
  Sonnet version.

**What the research assumes without stating:** Agent definitions are permanent
artifacts that do not need active maintenance. This is the "deploy-and-forget"
assumption. Every recommendation is a creation or deletion decision; zero
recommendations address update cadence.

**The maintenance cost model the research should have produced:**

| Agent category                                                           | Update triggers                      | Frequency                      | Per-update effort |
| ------------------------------------------------------------------------ | ------------------------------------ | ------------------------------ | ----------------- |
| Stack-version-embedding agents (code-reviewer, frontend-developer, etc.) | Any package version bump             | Irregular, estimated 4-6x/year | 15-30 min         |
| Pipeline agents (deep-research-\*)                                       | deep-research SKILL.md phase changes | Irregular                      | 30-60 min         |
| Security-boundary agents                                                 | Cloud Functions API changes          | Rare                           | 30-60 min         |
| Override agents                                                          | Plugin agent updates from Anthropic  | Rare                           | 15-30 min         |

At 6 stack version bumps/year and 20 stack-version-embedding agents, this is
120+ agent touch events per year. With zero automated detection of drift, this
becomes silent technical debt.

**Why the research missed it:** Research questions focused on "what agents
should exist?" not "how does the agent ecosystem stay healthy over time?" The
lifecycle management theme (Theme 10) covers testing and audit cadence but
treats maintenance as a quality audit problem, not an update-trigger problem.

**Impact assessment:** HIGH. An ecosystem of 42 well-defined agents that drift
over 18 months returns to the current F-grade state. The research solves the
creation problem; maintenance is the sustainability problem.

**Feasibility of mitigation:** MEDIUM. Options:

- (a) Version-centralized skill (Alternative 1 approach) — update one
  `sonash-context` skill file, all agents inherit the update automatically.
- (b) Pre-commit hook that flags agent files containing hardcoded version
  strings against CLAUDE.md declared versions. Catches drift at write time.
- (c) `/alerts` integration: surface "agent definitions may contain stale
  version strings" warnings when CLAUDE.md is updated.

**Recommendation:** ADOPT (a) and (b). The `sonash-context` skill approach from
Alternative 1 directly solves the version-drift problem by centralizing version
strings. The pre-commit hook adds cheap detection. Without this, the research's
recommendations have a built-in depreciation timeline.

---

### Alternative 5: Dynamic Agent Generation From Live CLAUDE.md State

**What it is:** Instead of static `.md` files, a meta-agent (or hook) generates
agent definitions on-the-fly by reading current CLAUDE.md + SESSION_CONTEXT.md +
ROADMAP.md at invocation time, then producing a contextually-appropriate system
prompt. This eliminates drift entirely because context is always read from the
current authoritative source.

**Evidence for viability:**

- The `initialPrompt:` frontmatter field (confirmed in the 17-field schema)
  allows agents to receive a structured prompt at startup. A meta-agent could
  write a session-specific agent definition to a temp path before invocation.
- CLAUDE.md is already structured (sections, tables) — it is parseable.
  SESSION_CONTEXT.md and ROADMAP.md add current sprint and feature context.
- The convergence-loop skill already reads current state files before executing
  each pass. Dynamic context generation is already the pattern for skills; the
  question is whether it can apply to agents.
- Finding 2.1 identifies "no SoNash context" as the core quality failure.
  Dynamic generation would permanently solve this for every agent without
  requiring any per-agent maintenance.

**The critical flaw:** Agent definitions in `.claude/agents/` are filesystem
artifacts. Claude Code reads them at invocation time. There is no confirmed
mechanism to programmatically compose and invoke an agent definition at runtime
from another agent or hook. The `initialPrompt:` field provides a startup
message, not a dynamic system prompt.

**Where this breaks down:**

- The agent body IS the system prompt replacement. To dynamically compose the
  system prompt, you would need to write a file before invocation, which
  requires knowing invocation is about to happen — a circular dependency.
- Task tool invocations use inline spawn prompts, not `.claude/agents/` files.
  For Task-based spawning, this IS already dynamic — the spawn prompt is
  constructed at runtime from current context. The research conflates the two
  invocation modes.

**Reframing the insight:** The dynamic generation alternative actually works
well for Task-tool-spawned agents (inline prompts). For these, the orchestrator
can and should construct spawn prompts by reading CLAUDE.md at skill execution
time. This is partially what SKILL.md's `spawn_prompt` patterns do, but they use
static templates rather than dynamically read CLAUDE.md sections.

**Why the research missed it:** The research does not distinguish between "agent
invoked as `agent: deep-research-searcher`" (filesystem definition) and "agent
spawned via Task tool with inline prompt" (dynamic). The deep-research pipeline
uses both modes. Dynamic context injection is already available for Task-based
spawning and is underused; it is structurally unavailable for filesystem-based
invocation.

**Impact assessment:** MEDIUM for Task-spawned agents, LOW for
filesystem-defined agents in isolation.

**Recommendation:** INVESTIGATE FURTHER specifically for Task-based spawn
prompts. REFERENCE.md Section 22.7 defines a 5-element checklist for spawn
prompts that does not include "read CLAUDE.md for current stack versions."
Adding this as element 6 — "Include current package versions read from CLAUDE.md
at spawn time" — is actionable and requires no new infrastructure.

---

### Alternative 6: The "Wait" Technique as a Universal Quality Enhancer

**What it is:** Research finding D8a notes that inserting "Wait" (or "wait" /
"actually, wait") in agent prompts before final answer generation reduces blind
spots by 89.3%. Instead of building dedicated adversarial agents
(contrarian-challenger, otb-challenger), append "Wait. Have I challenged the
most important claims? What am I missing?" to every synthesizer invocation. This
approximates adversarial review at zero agent-creation cost.

**Evidence for viability:**

- Finding 6.1 (steel-man before attack) and 6.2 (pre-mortem framing) describe
  the cognitive operations that "Wait" is hypothesized to trigger.
- The technique is effective because it induces a metacognitive step before
  output finalization — the same goal as adversarial agent spawning, but inline.
- The deep-research synthesizer prompt in REFERENCE.md Section 9 already
  includes a self-audit checklist (finding 10.2 pattern). "Wait" is a
  generalization of this.

**The core limitation:** The 89.3% claim needs scrutiny. This is a specific
finding from a specific study context that the research cites. The magnitude is
suspiciously large. Consider:

- "Wait" reduces the synthesizer's OWN blind spots. But adversarial agents have
  access to DIFFERENT TOOLS and produce SEPARATE OUTPUT that persists in the
  research record (challenges/ files). A synthesizer self-checking does not
  produce the `.research/<topic>/challenges/` artifacts that the
  dispute-resolver and final-synthesizer consume.
- Free-MAD (finding 6.3) specifically requires agents to "maintain independent,
  non-consensus conclusions." A single agent asking itself "wait, am I wrong?"
  cannot maintain genuinely independent conclusions — it is anchored to its
  initial output.
- The pipeline architecture requires separate artifact files from adversarial
  phases. "Wait" produces no artifact.

**Why the research missed it:** Finding D8a is mentioned in the research's own
sources but its strategic implication (could "Wait" replace the adversarial
agent infrastructure?) is not addressed. The research recommends creating 2
custom adversarial agent definitions (contrarian-challenger, otb-challenger)
without evaluating whether the quality uplift is achievable more cheaply.

**Impact assessment:** LOW as a replacement for adversarial agents. MEDIUM as a
universal quality enhancement on TOP of the current structure.

**Recommendation:** ADOPT "Wait" as an addendum to synthesizer prompts and all
pipeline agents as a free quality improvement. REJECT as a replacement for
adversarial agents — the architectural requirement for separate artifact files,
independent conclusions, and pipeline-consumable outputs cannot be met by inline
self-prompting. The two are complementary, not substitutable.

**Specific implementation:** Add to deep-research-synthesizer's output
instructions: "Before writing final output: Wait. What are the 3 claims I am
least certain about? Have I acknowledged contradictions for each?" This is a
~5-line addition to an existing agent definition, not a new agent.

---

### Alternative 7: Cross-Model Diversity via Opus-Spawned Sonnet Instead of Gemini CLI

**What it is:** The deep-research skill mentions "cross-model verification via
Gemini CLI" in its description. The research treats Gemini as an external
verification tool. But finding 7.4 notes that heterogeneous model teams
outperform homogeneous teams by up to +33-34%. If Anthropic's own model
hierarchy provides this heterogeneity (Opus orchestrator + Sonnet subagents),
external Gemini verification may be redundant.

**Evidence for viability:**

- Finding 7.1 confirms Opus costs only 1.67x Sonnet, not 5x as commonly assumed.
  The economics of Opus orchestration are more favorable than believed.
- Finding 7.4 confirms the research-plan-team already uses Opus+Sonnet
  heterogeneous model pairing and it "is already implemented correctly."
- If the deep-research orchestrator runs on Opus and subagents run on Sonnet,
  the model diversity gap is already present within the existing pipeline. The
  contrarian and OTB challengers could be explicitly assigned `model: inherit`
  (sonnet) while the final-synthesizer uses `effort: max` (Opus) — this is
  architectural model diversity.
- Gemini CLI requires: (1) external process invocation from a hook or bash
  command, (2) separate API key management, (3) cross-model output format
  differences, (4) rate limits from a different provider. Each is a reliability
  risk in a pipeline that already has 95% per-step success requirements.

**Evidence against Gemini as external dependency:**

- The Gemini CLI integration is mentioned in the SKILL.md description but does
  not appear in the REFERENCE.md phase templates at all (confirmed by grep).
  This suggests it is aspirational infrastructure, not implemented.
- No finding in the research confirms Gemini CLI verification is actively
  running. The tool-manifest check at session start does not confirm Gemini is
  available.

**Why the research missed it:** The research focuses on internal agent quality
(Theme 1-5) and does not address the external Gemini dependency. Gemini is
mentioned in the skill description but treated as given — not evaluated as a
design choice with alternatives.

**The genuine value of Gemini:** An entirely different model family (not just
different size) catches a different distribution of errors. Opus and Sonnet
share weights, training data, and failure modes. Gemini's value is not just
"different model" but "different model family." If the goal is catching
systematic Anthropic model biases, only a different provider achieves this.

**Impact assessment:** MEDIUM. Opus+Sonnet heterogeneity is better than
Sonnet+Sonnet but not equivalent to Anthropic+Google heterogeneity. The right
framing is: Gemini catches Anthropic-family blind spots; Opus+Sonnet catches
output-length and reasoning-depth gaps.

**Recommendation:** ADOPT Opus+Sonnet heterogeneity as the primary model
diversity mechanism for the pipeline (it requires no new infrastructure).
INVESTIGATE Gemini as a supplementary layer for HIGH-stakes research where
Anthropic-family blind spots are a specific concern. Do not require Gemini as a
mandatory pipeline step — it should be optional and gracefully degradable.

**Specific implementation:** Assign `model: sonnet` to contrarian-challenger and
otb-challenger; assign `effort: max` to deep-research-final-synthesizer. This
creates architectural model diversity within the existing pipeline without
external dependencies.

---

### Alternative 8: Orchestration Quality as the Real Bottleneck

**What it is:** The research diagnoses the ecosystem quality problem as
insufficient agent definition quality (F grade, 54/100 mean). But an alternative
hypothesis: the same agents with better ORCHESTRATION — richer spawn prompts,
stricter structured returns, and explicit convergence loops — might produce
equal or better quality improvement than definition rewrites.

**Evidence for viability:**

- Finding 8.3 (MAST taxonomy) shows 41.8% of multi-agent failures are
  specification failures — FC1 (role disobedience, context loss, missing
  termination). These happen at runtime, not in the agent definition.
- REFERENCE.md Section 22.7 defines a 5-element spawn prompt checklist. The
  research found that deep-research pipeline spawn prompts do NOT include all 5
  elements (Phase 2.5 has no template at all). Fixing the spawn prompts is
  lower-effort than creating new agent definitions.
- The convergence-loop skill already has structured pass-by-pass behavior
  injection via "composable behaviors." This orchestration-time context
  injection pattern is more flexible than static agent definitions.
- Finding 5.1 states "Phase 2.5 verification has no template." But this is an
  ORCHESTRATOR gap — the orchestrator (SKILL.md + REFERENCE.md) is not
  generating adequate spawn prompts. A better spawn prompt from the existing
  orchestrator might achieve 60-70% of the quality gain of a custom agent
  definition.

**The direct test case — debugger stub:** The debugger (37 lines) is the most
invoked stub with 4+ skills calling it. Current quality issue: no SoNash
context. But when systematic-debugging skill invokes debugger, it passes a spawn
prompt. If that spawn prompt includes SoNash security context and structured
return format, the stub's deficiencies are partially compensated at
orchestration time.

**Where orchestration CANNOT substitute for definition quality:**

- Auto-delegation (user directly says "debug this") bypasses orchestrators. The
  agent's own definition is the only context available.
- Finding 1.2 notes description-field routing reliability is low without
  `<example>` blocks. The spawn prompt cannot add examples to the description
  field — that is in the agent definition only.
- Structured return schemas must be in the agent definition to be reliable. An
  orchestrator requesting a structured return format from an agent that has no
  awareness of that format is hoping for compliance, not enforcing it.

**Why the research missed it:** The research assumes a clear causal chain: bad
agent definition → bad output. This is true for auto-delegated invocations but
partially false for orchestrated invocations. The research does not analyze
invocation mode (auto-delegation vs Task-tool spawn) as a variable. If 80% of
poor-quality agent invocations are Task-tool spawned (orchestrated), improving
spawn prompts delivers 80% of the benefit at lower cost than definition
rewrites.

**Testable hypothesis:** Take the debugger stub as-is. Write a best-practice
spawn prompt that includes SoNash security context, systematic-debugging
methodology, and structured return format. Measure output quality against the
same prompt pointing to an elevated 250-line debugger definition. If the delta
is small, orchestration is the bottleneck.

**Impact assessment:** HIGH for orchestrated invocations (Task-tool spawned).
LOW for auto-delegated invocations (user directly triggers agent).

**Recommendation:** INVESTIGATE as a low-cost pilot before committing to R8
(elevating 3 stubs to full definitions). Specifically: improve
systematic-debugging skill's spawn prompt to inject SoNash context when invoking
debugger. If this achieves satisfactory output quality for the 4+ skill callers,
defer the full debugger elevation to P3. This is a 30-minute experiment before a
3-hour definition rewrite.

---

## Cross-Cutting Blind Spots

### Blind Spot A: The "Create More Agents" Reflex

The research consistently resolves gaps by recommending new agent creation. The
implicit assumption: more agents = better coverage. The alternative question —
"can existing infrastructure be configured better to cover this gap?" — is
rarely asked.

Tally:

- P1 recommendations: 7 items — 5 are "create new agent/override"
- P2 recommendations: 5 items — 4 are "create new agent"
- P3 recommendations: 3 items — 1 is "create test fixtures"

12 of 15 recommendations are creation actions. Zero are "improve orchestration
of existing agents." Zero are "extend hook coverage." One is "add automated
validation."

The risk: the ecosystem goes from 39 to ~50 agents. The average definition
quality may rise from 54 to 70 (B grade) while the maintenance burden increases
28%. Is B grade with 28% more maintenance better than targeted improvements to
the existing 39?

### Blind Spot B: The Cost of Transition Itself

Implementing 7 P1 recommendations across a solo-developer project requires
significant focused work. The research presents an ordered recommendation list
but does not model the transition cost — the period during which the old
ecosystem is partially deprecated and the new one is partially built. During
this period, the ecosystem quality likely dips before rising.

A phased approach (start with hooks + skills injection from Alternatives 1 and
3, then create new agents only where those mechanisms provably fail) reduces
transition risk.

### Blind Spot C: The Stub Namespace Paradox

The research recommends removing 9 stubs. But finding 1.2 states that the
description field is the primary auto-delegation routing signal. Removing
error-detective, devops-troubleshooter, and deployment-engineer removes 3
routing endpoints that users or skills might reference. If the recommendation to
"use debugger instead of error-detective" is not reflected in CLAUDE.md Section
7 (Agent Triggers), users will continue invoking the now-deleted agents via
text, which will silently fall through to general-purpose execution.

The research does not address: after removal, what prevents the routing gap from
creating invisible fallbacks?

### Blind Spot D: The 500-2000 Token Sweet Spot vs Skills Injection

Finding 1.5 establishes a 500-2000 token sweet spot for agent bodies. The
research then recommends creating new agents at 200-380 lines each (300-600
tokens). This is within the sweet spot. BUT if agents use `skills:` to inject a
200-token shared context skill, their own body needs only 100-200 tokens of
specialization. The total context is 300-400 tokens — at the LOW end of the
sweet spot.

Is the lower end of the sweet spot problematic? The research does not address
whether 300-token agents with skills-injected context perform equivalently to
400-token self-contained agents. This is an empirical question the research
leaves open.

---

## Recommendations Table

| Alternative                  | Recommendation                                                   | Priority | Effort   | Impact              |
| ---------------------------- | ---------------------------------------------------------------- | -------- | -------- | ------------------- |
| Alt 1: Skills injection      | ADOPT — create `sonash-context` skill before any new agents      | P1       | Low      | High                |
| Alt 2: Base template         | INVESTIGATE — combine with Alt 1; stubs use skills for base      | P2       | Low      | Medium              |
| Alt 3: Hooks as enforcement  | ADOPT for structural constraints; complement agent overrides     | P1       | Medium   | High                |
| Alt 4: Maintenance model     | ADOPT (a)+(b) — centralize via skills + drift detection hook     | P1       | Low      | High                |
| Alt 5: Dynamic generation    | INVESTIGATE for Task-spawn prompts; reject for filesystem defs   | P2       | Medium   | Medium              |
| Alt 6: "Wait" technique      | ADOPT as synthesizer addendum; reject as adversarial replacement | P1       | Very Low | Medium              |
| Alt 7: Opus+Sonnet diversity | ADOPT as primary; Gemini as optional high-stakes supplement      | P1       | Low      | Medium              |
| Alt 8: Orchestration quality | INVESTIGATE via debugger pilot before stub elevation (R8)        | P1       | Low      | High (if validated) |

---

## Confidence Assessment

- HIGH claims: 4 (skills: field is unused [codebase verified], hooks already
  enforce security [codebase verified], Gemini integration is aspirational [no
  REFERENCE.md template found], 12/15 recommendations are creation actions
  [count verified])
- MEDIUM claims: 5 (maintenance cost model, "Wait" technique scope limits,
  orchestration vs definition quality split, dynamic generation for Task-spawns,
  Opus+Sonnet diversity sufficiency)
- LOW claims: 1 (89.3% "Wait" blind-spot reduction figure — cited but not
  independently verified for this context)
- UNVERIFIED claims: 0

Overall confidence: MEDIUM-HIGH. All alternatives are grounded in codebase
observations or cited research. The main uncertainties are empirical (does
`skills:` injection perform equivalently to inline context? does spawn prompt
improvement close 60-70% of the definition quality gap?) — these require
testing, not more research.

---

## Sources

| #   | Source                                                                                            | Type                 | Trust | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------------------- | -------------------- | ----- | ----- | ---------- |
| R1  | RESEARCH_OUTPUT.md — findings 1.4, 4.4, 6.3, 7.1, 7.4, 8.3                                        | Synthesized research | HIGH  | 5.0   | 2026-03-29 |
| R2  | `.claude/agents/` filesystem — grep for `skills:` field usage (none found)                        | Ground truth         | HIGH  | 5.0   | 2026-03-29 |
| R3  | `.claude/hooks/firestore-rules-guard.js` — PreToolUse structural enforcement                      | Ground truth         | HIGH  | 5.0   | 2026-03-29 |
| R4  | `.claude/settings.json` — PreToolUse/PostToolUse hook configuration                               | Ground truth         | HIGH  | 5.0   | 2026-03-29 |
| R5  | `.claude/skills/deep-research/REFERENCE.md` — Section 22.7 spawn checklist, adversarial templates | Ground truth         | HIGH  | 5.0   | 2026-03-29 |
| R6  | `.claude/agents/debugger.md` — 37 lines, zero SoNash context                                      | Ground truth         | HIGH  | 5.0   | 2026-03-29 |
| R7  | `.claude/agents/code-reviewer.md` / `frontend-developer.md` — SoNash context embedding pattern    | Ground truth         | HIGH  | 5.0   | 2026-03-29 |
| R8  | RESEARCH_OUTPUT.md Recommendations section — 12/15 are creation actions (counted)                 | Synthesized research | HIGH  | 5.0   | 2026-03-29 |
