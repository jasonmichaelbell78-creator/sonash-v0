# Research & Discovery Standard -- Research Output

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-24
**Status:** ACTIVE
**Topic:** Research & Discovery Standard for SoNash AI Workflow
**Depth:** L1 (Comprehensive)
**Date:** 2026-03-24
**Agents:** 18 (10 internal searchers, 4 external searchers, 2 synthesizers, 2 contrarians, 2 OTB challengers)
**Findings Files:** 14 (SQ1-SQ10, W4a, W4b, W4c)
**Challenge Files:** 4 (contrarian-internal, contrarian-external, otb-alternative, otb-user)
**Overall Confidence:** HIGH (internal), MEDIUM-HIGH (external), MEDIUM (synthesis/recommendations)
<!-- prettier-ignore-end -->

---

## 1. Executive Summary

This research investigated what a Research & Discovery Standard should look like
for the SoNash AI workflow -- a solo-developer project with 100+ skills, 40+
agents, MCP servers, hooks, and agent teams. The investigation spanned 10
sub-questions across 5 research waves, producing 14 findings files and 4
challenge documents from 18 agent passes.

**What exists today:** SoNash already has a strong research foundation. Four
core systems (deep-research, deep-plan, CL-PROTOCOL, convergence-loop) contain
43 quality gates, formula-driven agent allocation, CRAAP+SIFT source evaluation,
cross-model verification via Gemini CLI, and graduated per-claim convergence --
capabilities that match or exceed every external system studied [SQ1, W4b]. The
external landscape validation confirmed 12 of 12 best-practice patterns are
already implemented at MODERATE-to-STRONG alignment [W4b]. The system's unique
differentiators are cross-model Gemini verification, graduated convergence
tracking, and formula-driven agent allocation.

**What is broken:** Despite this strong foundation, research invocation is
entirely behavioral with zero hook enforcement [SQ6], confidence scales are
incompatible across all 4 systems [SQ1], CL-PROTOCOL writes nothing to disk
[SQ1], and 7 categories of research-worthy situations go undetected [SQ6]. The
formalized teams (audit-review-team, research-plan-team) have never been spawned
[SQ4], and the Development Team referenced in CLAUDE.md has no definition file
[SQ4].

**What the challenges corrected:** The contrarian and OTB passes significantly
revised the initial architecture. The "48% agent underuse" claim was reframed
from a crisis to "3 high-value agents need triggers + 6 are retirement
candidates" [W5a-C1]. Opt-out team spawning was rejected as premature given zero
evidence of team value [W5a-C2]. The CL-PROTOCOL refactor to invoke
convergence-loop was rejected -- their independence is a feature, not a bug
[W5a-C5]. The 6-document, 7-session implementation was challenged as
over-engineered for a solo developer [W5a-C6, W5d-C1]. The strongest
recommendation from challenges: launch as a minimal behavioral protocol first,
expand only after measured value [W5a-C6, W5d-C3].

**Key conclusion:** The Research & Discovery Standard should be implemented in a
"Phase 0: Minimal Viable Standard" of 1-2 sessions delivering: (1) a shared
vocabulary and unified confidence labels, (2) one CLAUDE.md guardrail, (3)
hook-based research hints (~30 lines of code), and (4) CL-PROTOCOL artifact
persistence. The full 4-tier model, 6-phase implementation, and CANON
registration are a validated design but should be deferred behind a validation
gate requiring measured improvement in research quality across 10+ sessions.

---

## 2. Current State Assessment

### 2.1 Capability Map

The research inventory identified ~200+ research/discovery tools organized
across four tiers of capability [SQ5, W4a]:

**Tier 1 -- Quick Lookup (minutes, single source):**

- Codebase search: Grep (content), Glob (paths, mod-time sorted), Read [SQ5]
- Library documentation: Context7 MCP (available but only in 4 of 40 agents)
  [SQ5]
- Session history: Episodic Memory MCP (semantic search + date filtering) [SQ5]
- Code quality snapshot: SonarCloud MCP (4 tools) [SQ5]
- Health metrics: 11 health checker scripts via npm [SQ5]
- Codebase exploration: Explore agent (read-only, 25-turn, sonnet) [SQ3]

**Tier 2 -- Focused Investigation (30-60 minutes, multiple sources):**

- Scientific debugging: /systematic-debugging (5-phase) [SQ2]
- Code quality investigation: code-reviewer agent [SQ2, SQ3]
- Security assessment: security-auditor agent (SoNash-customized) [SQ3]
- Single-domain audits: 4 ecosystem audit skills [SQ2]
- Convergence verification: /convergence-loop (2-8 agents, composable) [SQ1]
- Deep-plan context: Phase 0 DIAGNOSIS.md with 7 quality gates [SQ1]

**Tier 3 -- Full Research Campaign (2+ hours, structured multi-agent):**

- Multi-agent domain research: /deep-research (5-17+ agents, 5 phases, 14
  quality gates) [SQ1]
- Structured planning: /deep-plan (6 phases, CL-integrated) [SQ1]
- Plan execution verification: CL-PROTOCOL (D1-D4/V1-V4, opus-mandated, 12
  quality gates) [SQ1]
- GSD project research: /gsd:new-project (4 parallel researchers + synthesizer)
  [SQ3]
- Cross-model verification: Gemini CLI in deep-research Phase 3 [SQ1]

**Tier 4 -- Campaign Orchestration (multi-session, team-scale):**

- Research-to-plan team: research-plan-team (3 members) [SQ4]
- Multi-target audit team: audit-review-team (2 members) [SQ4]
- GSD lifecycle: new-project -> plan-phase -> execute-phase -> verify-phase
  [SQ3]

### 2.2 Agent Inventory

41 total agents: 27 project-level + 14 global [SQ3]. Model distribution is 83%
sonnet / 17% opus. SoNash customization is concentrated in 8 of 27 project-level
agents (explore, plan, code-reviewer, security-auditor, frontend-developer,
documentation-expert, test-engineer, dependency-manager) [SQ3].

**Challenge-adjusted underuse assessment [W5a-C1]:**

- ORIGINAL claim: "48% of agents have no structured invocation pathway"
- REVISED assessment: **3 agents (11%) are high-value without triggers**
  (penetration-tester, nextjs-architecture-expert, performance-engineer); **6
  agents are candidates for retirement** (error-detective,
  devops-troubleshooter, deployment-engineer, fullstack-developer,
  git-flow-manager, mcp-expert); **8 agents serve their role as ad-hoc
  specialists** that are available but rarely needed.
- Confidence: HIGH [SQ3, W5a-C1]

### 2.3 Team Status

2 formalized team definitions exist (audit-review-team, research-plan-team) with
zero invocations in formalized form [SQ4]. 3 ad hoc teams were used during
agent-env analysis (Sessions #225-236) but patterns were not carried forward
[SQ4]. The Development Team is referenced in CLAUDE.md Section 7 as a PRE-TASK
trigger but has no definition file -- a direct compliance gap [SQ4].

Root causes for non-spawning: (1) implicit complexity assessment, (2) token cost
bias, (3) opt-in default, (4) no feedback loop confirming team value [SQ4].

### 2.4 Tool Utilization

Of ~200 total research tool surface area: ~25% actively used, ~40% underused,
~35% never invoked for research [SQ5].

**Severely underused for research:**

- Sequential Thinking MCP: zero invocations by any skill or agent [SQ5]
- Memory Knowledge Graph: used for project memory only, not research [SQ5]
- Chrome Superpowers auto-capture: zero research use [SQ5]

**Significantly underused:**

- Context7: only in 4 agents' tool lists [SQ5]
- Episodic Memory mid-research: session-start only, not for "have we researched
  this?" [SQ5]
- Health checkers: never invoked by research skills as baselines [SQ5]

### 2.5 Hook and Natural Invocation

**The word "research" appears nowhere in any hook detection logic** [SQ6].
Research is entirely in the behavioral-rule layer (CLAUDE.md Section 7), making
it fragile to compaction, rationalization, and context loss [SQ6]. Seven
categories of research-worthy situations go undetected:

| Gap | Situation                                   | Impact                                               |
| --- | ------------------------------------------- | ---------------------------------------------------- |
| G1  | AI enters unfamiliar codebase area          | HIGH -- AI guesses at architecture [SQ6]             |
| G2  | Technology questions beyond training cutoff | HIGH -- stack is 2026, training is May 2025 [SQ6]    |
| G3  | Conflicting information encountered         | MEDIUM-HIGH -- silent contradiction resolution [SQ6] |
| G5  | Multi-session project starting              | HIGH -- plans built on assumptions [SQ6]             |
| G6  | Debugging stalls after 3+ failed attempts   | MEDIUM [SQ6]                                         |
| G7  | First external integration touch            | MEDIUM [SQ6]                                         |

**Challenge correction [W5d-C2, W5d-C4]:** The behavioral-only trigger problem
may be overstated [W5a-C7E]. Planning and exploration also rely primarily on
behavioral rules. However, the 7 documented detection gaps represent real
situations where research should happen but does not [SQ6]. The hook approach
should be limited to Phase 1 only (keyword hints, ~30 lines), deferring Phases
2-3 until Phase 1 proves value [W5c-C3].

### 2.6 Pattern Conflicts

| Conflict                                     | Systems                                      | Severity   | Source |
| -------------------------------------------- | -------------------------------------------- | ---------- | ------ |
| Incompatible confidence scales               | All 4 core systems                           | HIGH       | SQ1    |
| CL-PROTOCOL writes nothing to disk           | CL-PROTOCOL                                  | HIGH       | SQ1    |
| 3 independent contrarian implementations     | deep-research, CL-PROTOCOL, convergence-loop | MEDIUM     | SQ1    |
| Ecosystem audits don't use convergence loops | 4 audit skills                               | MEDIUM     | SQ2    |
| Citation standards range from none to formal | All 4 core systems                           | LOW-MEDIUM | SQ1    |

### 2.7 SWS Integration Status

Research & Discovery is assessed at **L1 (Identified)** on the CANON maturity
scale: 2 items PRESENT, 5 PARTIAL, 9 ABSENT on the 16-item checklist [SQ10].
Target: L3 (Monitored). Six existing SWS tenets directly govern R&D behavior:
T19 (extensive_discovery_first), T20 (research_convergence_loops), T22
(honest_findings_only), T23 (all_planning_via_deep_plan), T15
(interactivity_first), T13 (plan_as_you_go) [SQ10].

---

## 3. External Landscape

### 3.1 AI Development Workflows

Seven major systems were studied: Cursor, Windsurf, Devin, OpenHands, SWE-agent,
Aider, and Claude Code [SQ7a].

**Cross-cutting patterns confirmed at HIGH confidence:**

1. **Research-before-action is universal** -- every system researches before
   acting, but mechanisms differ (index-based vs on-demand vs hybrid) [SQ7a]
2. **Context assembly is multi-layer** -- rules + memory + code + actions +
   external knowledge [SQ7a]
3. **Parallel execution is the frontier, not the default** -- only Cursor,
   Claude Code, and OpenHands support true parallel agents [SQ7a]
4. **Verification forms a spectrum** -- from automatic (SWE-agent lint-on-edit)
   through agent self-review (Devin) to human review (all systems) [SQ7a]
5. **Scaffolding matters more than model** -- mini-swe-agent (100 lines,
   bash-only) scores 74% on SWE-bench Verified [SQ7a]
6. **Multi-source research remains rare in practice** -- only Devin and Claude
   Code natively combine code + web + docs [SQ7a]
7. **Tiered complexity models are emergent, not standard** -- no system has a
   formal research tier model [SQ7a]

### 3.2 Multi-Agent Research Frameworks

Twelve systems were studied: CrewAI, STORM, GPT-Researcher, AutoGen, LangGraph,
Perplexity, Elicit, Consensus, ReAct/Reflexion/LATS, Microsoft Copilot, GitHub
Copilot, and Anthropic's multi-agent system [SQ7b].

**Key transferable findings:**

- **Orchestrator-worker with parallel subagents** outperforms single-agent by
  90.2% (Anthropic data) [SQ7b]
- **"Bag of agents" without topology amplifies errors 17.2x** (DeepMind
  research) [SQ7b]
- **Coordination gains plateau beyond 4 agents** [SQ7b]
- **Agents cannot self-calibrate research effort** -- scaling rules must be
  embedded in prompts (Anthropic) [SQ7b]
- **Multi-agent costs ~15x more tokens** than single-agent (Anthropic) [SQ7b]

### 3.3 Challenge-Filtered Transferability

**What actually transfers (confirmed by W5b):**

- Convergence loops (Evaluator-Optimizer, Ralph Loop) -- solve real
  solo-developer quality problems [W5b-C7]
- CRAAP + SIFT source evaluation -- scale-independent [W5b-C7]
- Adversarial verification -- solo developers are especially vulnerable to
  confirmation bias [W5b-C7]
- Hub-and-spoke coordination -- correct topology if using multi-agent at all
  [W5b-C7]

**What is cargo-cult risk (W5b-C7):**

- STORM's multi-perspective simulation -- solves broad encyclopedic writing, not
  narrow technical questions
- Perplexity's meta-router -- designed for millions of queries/day, we handle
  5-10/week
- GPT-Researcher's tree exploration -- over-engineered for bounded search spaces
- Knowledge graph persistence -- enterprise pattern; solo developer already
  knows what they researched

**What does not transfer (confirmed by W4b Section 3):**

- Persistent codebase embeddings (Cursor/Windsurf) -- on-demand search is
  simpler [W4b-NT1]
- Parallel agents in git worktrees -- solves multi-developer merge conflicts
  [W4b-NT2]
- Full desktop environments (Devin/OpenHands) -- terminal-native is validated
  [W4b-NT3]
- Conversational agent debate (AutoGen) -- 4x more tokens for same result
  [W4b-NT4]
- Fully autonomous deep research -- guardrail #2 prohibits implementation
  without approval [W4b-NT5]

---

## 4. Proposed Tier Model (Challenge-Adjusted)

### 4.1 Evolution from Original to Revised

**ORIGINAL (W4b/W4c):** 4 tiers (T0-T3) with 6 documents, 4 levels, graduated
verification (up to 17 checks), team spawning rules, and CANON registration.

**Challenge corrections applied:**

- W5a-C3: "3 tiers might suffice -- T0/T1 happen naturally, T2 could be a
  deep-research flag"
- W5a-C6: "Phase 0 MVS first, defer heavy infrastructure"
- W5d-C1: "Cut to 3 documents max, RDS-PROTOCOL under 80 lines"
- W5d-C2: "T0/T1 must be invisible to user, no friction on known tasks"
- W5d-C4: "Research suggestions should REPLACE planning suggestions, not stack"
- W5b-C6: "Verification should be per-finding adaptive, not blanket tier-level"
- W5c-C1: "Continuous adaptation -- soften tier boundaries"

### 4.2 Revised Tier Model

The revised model retains 4 tiers as a design taxonomy (validated by
cross-domain convergence [SQ8] but acknowledged as a design choice, not an
empirically validated structure [W5b-C3]) with significantly softer boundaries
and reduced ceremony.

| Tier   | Name             | Description                                                                                | Visibility to User                                                               | Verification                                                          |
| ------ | ---------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **T0** | Reflexive        | Inline checks the AI does naturally -- version verification, file existence, ROADMAP check | **Invisible** -- no message, no artifact                                         | Automatic: source exists? Recency OK?                                 |
| **T1** | Quick Lookup     | 1-3 tools, direct answer, Context7/WebSearch/episodic memory                               | **One-line breadcrumb** in response: "Checked Zod 4 docs -- confirmed"           | Source existence + CRAAP >= 3 on primary source                       |
| **T2** | Focused Research | Structured investigation, 2-4 sub-questions, /deep-research at L1-L2 depth                 | **User approves plan** (but AI starts immediately; user can redirect)            | CRAAP + SIFT + 2+ sources cross-reference + contradiction surfacing   |
| **T3** | Full Campaign    | Full /deep-research pipeline, 5+ sub-questions, contrarian + OTB                           | **Full user gates** -- plan approval, mid-research checkpoint, findings approval | All T2 + adversarial disconfirmation + cross-model + convergence-loop |

**Key changes from original:**

- T0 and T1 are invisible to the user [W5d-C2]
- T1-to-T2 boundary is soft -- the AI can silently deepen within the time budget
  [W5c-C1]
- T2 approval is non-blocking -- AI presents plan and starts, user redirects if
  needed [W5d-C3]
- Verification is per-finding adaptive, not blanket tier-level [W5b-C6]: every
  finding starts with T1 verification; checks escalate only on failure or
  ambiguity
- Confidence: MEDIUM [W5b-C3 -- tier count is a design choice, calibrate with
  usage data]

### 4.3 Tier Escalation/De-escalation

| Direction | Trigger                                                            | Mechanism                                         |
| --------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| T1 -> T2  | Contradictions found, 3+ facets identified, sources disagree       | Auto-suggest with user approval                   |
| T2 -> T3  | 2+ sources directly contradict, 5+ sub-dimensions, domain is novel | Auto-suggest with user approval                   |
| T3 -> T2  | After Phase 1: >80% findings HIGH confidence, <2 contradictions    | Auto-suggest: "Findings converging, recommend T2" |
| T2 -> T1  | Single authoritative source answers completely                     | Auto-suggest: "Authoritative answer found"        |

De-escalation is a novel contribution -- no existing framework addresses it [SQ8
Gap 5, W4c D9].

---

## 5. Key Design Decisions

### D1: Four tiers, with soft boundaries

- **Options:** 3 tiers (W5a-C3) / 4 tiers (W4c) / continuous (W5c-C1)
- **Recommendation:** 4 tiers as taxonomy, soft boundaries allowing silent
  T1->T2 deepening
- **Rationale:** Cross-domain convergence on ~4 levels [SQ8], but T0/T1 merge in
  practice and boundaries are checkpoints not rigid categories [W5c-C1]
- **Challenge disposition:** W5a-C3 partially accepted -- T2 can also be
  accessed as /deep-research --focused
- **User decision needed:** No

### D2: Unified confidence LABELS, not unified assignment rules

- **ORIGINAL:** Unified 4-level scale with basis tags and cross-system minimum
  rule [W4c]
- **REVISED:** Unify labels (HIGH/MEDIUM/LOW/UNVERIFIED) across all systems;
  each system assigns by its own criteria; basis tags remain for human
  readability but cross-system minimum rule is dropped [W5a-C4]
- **Rationale:** The basis tags acknowledge that a single scale is insufficient
  [W5a-C4]. CL-PROTOCOL's 3 vocabularies (findings, fix status, contrarian
  ratings) measure different things -- forcing them into one scale is a category
  error [W5a-C4]
- **User decision needed:** No

### D3: CL-PROTOCOL stays independent from convergence-loop

- **ORIGINAL:** Refactor CL-PROTOCOL to invoke convergence-loop [W4c D6]
- **REVISED:** Keep independent. Extract shared patterns (contrarian
  prompt, >20% threshold) into shared utilities. Add CL-PROTOCOL artifact
  persistence. Standardize vocabulary (CONFIRMED/WEAKENED/FALSE-POSITIVE)
  [W5a-C5]
- **Rationale:** CL-PROTOCOL serves a different purpose (plan execution
  verification vs claims verification), mandates opus (convergence-loop is
  model-agnostic), and was designed for speed in execution context [W5a-C5].
  Risk profile of coupling is LOW likelihood / HIGH impact [W5a-C5]
- **User decision needed:** No

### D4: Teams are opt-in with controlled experiments, NOT opt-out

- **ORIGINAL:** Invert team default to opt-out [W4c D4, SQ4 R1]
- **REVISED:** Keep opt-in. Run 3-5 controlled team experiments first. Track
  quality + token cost vs solo. Only invert if data shows measurably better
  outcomes [W5a-C2]
- **Rationale:** Zero evidence of team value in formalized form. Token cost of
  3-7x is a direct user expense. The root causes for non-spawning include
  rational economic preferences, not just bugs [W5a-C2]
- **STILL DO:** Create development-team.md (compliance gap) [SQ4] and add team
  outcome tracking to session-end [SQ4 R4]
- **User decision needed:** When to run the controlled experiments

### D5: Max 4 parallel agents per wave (unchanged)

- **Rationale:** DeepMind research shows coordination gains plateau beyond 4
  [SQ7b]. Already an existing parallelization rule [SQ3]
- Confidence: HIGH

### D6: Raise multi-agent threshold for T2

- **ORIGINAL:** 2+ sub-questions -> parallel subagents [W4c]
- **REVISED:** 2-3 sub-questions -> solo agent with sequential investigation; 4+
  sub-questions -> parallel subagents [W5c-C4]
- **Rationale:** Solo agent has zero coordination overhead, perfect context
  continuity, and cheaper tokens. Multi-agent empirically justified for T3
  (Anthropic 90% improvement) but case for T2 is weaker [W5c-C4]
- **User decision needed:** No

### D7: R&D as standalone CANON ecosystem (pending user decision)

- **Options:** (A) Insert between Skills and Hooks, (B) fold into Skills, (C)
  add as Step 22+
- **Recommendation:** Option A -- R&D spans 4 skills, 14+ non-core skills, and
  has its own artifacts [SQ10]
- **User decision needed:** YES -- D67 sequence amendment required

### D8: Behavioral enforcement first, automated enforcement last (strengthened)

- **ORIGINAL:** Behavioral -> skill-internal -> hook -> schema -> CANON [W4c]
- **REVISED:** Same sequence but with explicit validation gate between Phase 1
  and Phase 2 requiring measured improvement [W5a-C6, W5c-C5]
- **User decision needed:** What metrics constitute "measured improvement"

### D9: Model routing uses Sonnet as floor, not Haiku

- **ORIGINAL:** Haiku for T1, Sonnet for T2, Opus for T3 [W4b Adopt #1]
- **REVISED:** Sonnet for all tiers as floor. Opus for T3 contrarian/OTB. Never
  route T2+ to Haiku [W5b-C5]
- **Rationale:** Cost savings from T1-on-Haiku are small (~$2-5/month for solo
  developer); quality risk from confident hallucination is disproportionate
  [W5b-C5]. The 78-85% cost reduction figures are from high-volume production
  systems, not 5-10 tasks/week [W5b-C2]
- **User decision needed:** No

### D10: Verification is per-finding adaptive, not blanket tier-level

- **ORIGINAL:** T3 always gets 11 checks (all inherited) [W4c]
- **REVISED:** Every finding starts with T1 verification (3 checks). Escalate
  per-finding on failure/ambiguity [W5b-C6]
- **Rationale:** Marginal value of checks 10-17 is low when checks 1-5 all pass.
  Estimated 40-60% verification token cost reduction vs blanket approach
  [W5b-C6]
- **User decision needed:** No

---

## 6. Unified Confidence Scale (Revised)

### 6.1 Labels (Unified Across All Systems)

| Level          | Definition                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **HIGH**       | Multiple independent sources agree, or authoritative source confirms, AND no contradicting evidence                               |
| **MEDIUM**     | At least one verified source supports, but coverage incomplete or minor contradictions exist                                      |
| **LOW**        | Plausible but limited evidence, single unverified source, or partial corroboration                                                |
| **UNVERIFIED** | Training data only, or source not located, or not checked against external evidence. Must be tagged `[UNVERIFIED]` in all outputs |

### 6.2 Assignment Rules (Per-System, NOT Unified)

Per W5a-C4, each system assigns confidence by its own criteria. The labels are
shared for human readability; the assignment logic is domain-appropriate:

| System            | How It Assigns                                                         | Basis           |
| ----------------- | ---------------------------------------------------------------------- | --------------- |
| deep-research     | Source quality: 2+ sources = MEDIUM min, authoritative = HIGH eligible | Source          |
| deep-plan Phase 0 | Verified (has verify command) = MEDIUM min; unverified = UNVERIFIED    | Code evidence   |
| CL-PROTOCOL       | Direct code evidence = HIGH, inferred = MEDIUM, uncertain = LOW        | Code evidence   |
| convergence-loop  | 0 corrections in 2+ passes = HIGH, extensions only = MEDIUM            | Process outcome |

### 6.3 Cross-System Handoff

**ORIGINAL rule (dropped):** "Confidence is the minimum of source and
destination assessments" [W4c] **REVISED:** No automatic confidence algebra.
When claims flow between systems (e.g., deep-research -> deep-plan adapter), the
receiving system re-evaluates by its own criteria. The adapter already handles
this translation [W5a-C4].

Confidence in this design: MEDIUM -- the practical benefit of cross-system
confidence algebra is unclear given the main flow is deep-research -> deep-plan
(adapter handles it) [W5a-C4].

---

## 7. Natural Invocation Design (Revised)

### 7.1 Three-Layer Model (Retained, Proportionally Adjusted)

```
USER PROMPT
     |
     v
[LAYER 1: Hook Detection]          -- Lightweight hints only
  Phase 1 ONLY: keyword hints       -- ~30 lines added to user-prompt-handler.js
  Compound signals (2+ triggers)     -- Research replaces planning when both fire
  Global alert budget: max 2/prompt  -- Priority-based suppression
     |
     v
[LAYER 2: Behavioral Rules]        -- Primary investment
  CLAUDE.md guardrail #15            -- Research before unfamiliar implementation
  Well-crafted examples              -- What counts as "unfamiliar territory"
  Section 7 trigger update           -- Tier-aware research trigger
     |
     v
[LAYER 3: Skill Internals]         -- Existing enforcement (no changes)
  Phase gates in deep-research       -- 14 quality gates already exist
  Phase gates in deep-plan           -- 7 quality gates already exist
```

### 7.2 Layer 1: Hook Changes (Phase 1 Only)

Per W5c-C3 and W5d-C4, only Phase 1 of hook enhancement is recommended. Phases
2-3 are deferred until Phase 1 proves value.

**Phase 1 additions to user-prompt-handler.js (~30 lines):**

- New Priority 5.5 between Planning and Exploration
- Trigger words: "research", "investigate", "what are the options", "compare
  approaches", "best practice for"
- Output: `suggestStderr("Consider /deep-research for domain investigation")`
- Anti-fatigue: compound signals (2+ triggers), once per topic per session
- Research suggestions REPLACE planning suggestions when both fire [W5d-C4]
- Default sensitivity: "low" (only stdout directives) [W5d-C4]

**Deferred (Phase 2-3 of hook enhancement):**

- Plan-mode suggestion enhancement with research-before-plan
- Post-read-handler exploration-to-research escalation (high false-positive rate
  for normal development [W5d-C2])

### 7.3 Layer 2: CLAUDE.md Additions

**New guardrail #15:**

> "Research before implementation in unfamiliar territory. Before modifying code
> in a subsystem not previously read this session, or implementing features
> involving technology beyond training cutoff, assess whether research is
> needed. Use the tier model: T0 for inline checks, T1 for quick lookups, T2 for
> focused research, T3 for full campaigns."

**Constraint [W5d-C2]:** "Unfamiliar territory" must exclude directories touched
in the last 5 sessions (use git log, not just current session). "Beyond training
cutoff" applies only to API questions, not all implementation.

**Constraint [W5d-C2]:** T0 and T1 research must be invisible to the user. No
message, no suggestion. The user should only see research at T2+ when it
requires their time.

### 7.4 Alert Fatigue Mitigations (from W5d-C4)

1. Global alert budget: maximum 2 hook-generated suggestions per prompt
2. Research suggestions replace (not stack on top of) planning suggestions
3. Default sensitivity: "low"
4. Post-read-handler escalation (Phase 3) removed entirely -- high
   false-positive rate

---

## 8. Implementation Strategy (Revised)

### 8.1 Phase 0: Minimal Viable Standard (1-2 sessions)

Per W5a-C6 and W5d: deliver the highest-value items before any infrastructure.

**Deliverables:**

1. Shared vocabulary document (appendix to RDS-PROTOCOL, not user-facing) [W4c
   Section 9]
2. CLAUDE.md guardrail #15 (research before unfamiliar implementation) [W4c
   Section 4C]
3. Hook-based research hints (~30 lines in user-prompt-handler.js) [W4a Rank 3,
   SQ6]
4. CL-PROTOCOL artifact persistence: D4 ->
   `.planning/<plan>/cl-discovery-{step}.json`, V4 ->
   `.planning/<plan>/cl-verification-{step}.json` [W4a Rank 2]
5. Update CLAUDE.md Section 7 trigger table with tier-aware research entry
6. Update CLAUDE.md Section 8 to reference RDS-PROTOCOL.md

**Dependencies:** None. Can start immediately.

**Exit criteria / Validation gate:** Before proceeding to Phase 1, the following
must be demonstrated across 10+ sessions:

- AI correctly identifies research tier in at least 5 real (not test) scenarios
- User reports the tier model helped with at least 2 decisions [W5d-C7]
- Research hooks fire on at least 3 legitimate cases with zero false positives
  on 5 sampled non-research prompts
- CL-PROTOCOL artifact persistence is actively used for retrospective reference

### 8.2 Phase 1: Foundation (Sessions 2-3) -- Gated on Phase 0 Validation

**Deliverables:**

1. Write RDS-PROTOCOL.md (under 80 lines [W5d-C1], core tier model + confidence
   scale)
2. Unified confidence labels across all 4 core systems (label change only, not
   assignment rule change [W5a-C4])
3. Create development-team.md definition file [SQ4 Gap 3]
4. Add team outcome tracking to session-end [SQ4 R4]
5. Add Context7 to 6 agent tool lists [SQ5, W4b Adopt #6]
6. Add episodic memory pre-search to deep-research Phase 0 [SQ5, W4b Adopt #3]

### 8.3 Phase 2: Verification & Tools (Sessions 4-5) -- Gated on Phase 1

**Deliverables:**

1. Write RDS-TOOLS+TEAMS.md (merged document [W5d-C1]) -- tool + agent selection
   per tier
2. Extract shared contrarian patterns (prompt template, >20% threshold) into
   utilities [W5a-C5]
3. Add CL-PROTOCOL artifact persistence format to shared utilities
4. Integrate Sequential Thinking MCP into deep-research Phase 0 (zero-cost [W4b
   Adopt #2])
5. Add pre-registered success criteria to deep-research Phase 0 [W4b Adopt #4]
6. Run first 3 controlled team experiments [W5a-C2 recommendation]

### 8.4 Phase 3: CANON Registration (Sessions 6-7) -- Gated on Phase 2 + CANON Phase 1

**Deliverables:**

1. Register research-discovery in `.canon/ecosystems.jsonl` (requires CANON
   infrastructure)
2. Write health checker for research ecosystem
3. Write enforcement manifest
4. Zod schemas for .research/ artifacts
5. Born-compliant gate

### 8.5 Long-Term North Star: Research Agent [W5c-C7]

The 6 documents are a stepping stone toward an executable standard, not the
permanent end state. The long-term evolution:

1. **Now:** Behavioral standard (documentation defines the model)
2. **Medium-term:** Extract research primitives as shared tools [W5c-C2]
3. **Long-term:** Build a `research-agent` that encapsulates the standard as
   code [W5c-C7]

---

## 9. Open Questions for /deep-plan

### 9.1 Decisions Requiring User Input

| #   | Decision                        | Options                                                             | Recommendation                                                                             |
| --- | ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | D67 amendment for R&D ecosystem | (A) Insert between Skills/Hooks, (B) fold into Skills, (C) Step 22+ | A -- cross-cutting identity                                                                |
| 2   | Phase 0 validation metrics      | What counts as "measured improvement"?                              | 5 correct tier identifications, 2 user-reported helpful decisions, 3 legitimate hook fires |
| 3   | When to run team experiments    | During Phase 1, Phase 2, or deferred?                               | Phase 2 -- after basic infrastructure exists                                               |
| 4   | CL-PROTOCOL ownership           | R&D ecosystem or plan orchestration?                                | R&D owns the protocol; plan orchestration consumes it                                      |
| 5   | Research artifact format        | Stay with MD or migrate to JSONL-first?                             | MD for human readability; JSONL for machine-parseable (both, as today)                     |
| 6   | Document count                  | 6 (original), 3 (merged per W5d-C1), or 1 (minimal per W5c-C5)      | 3 documents: RDS-PROTOCOL, RDS-TOOLS+TEAMS, RDS-VERIFICATION+ENFORCEMENT                   |

### 9.2 Unresolved Tensions

| Tension                            | Position A                                 | Position B                                                         | Status                                                               |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Process vs creativity              | Standard constrains research quality [W4c] | Standard constrains research creativity [W5c-C5]                   | Resolved by soft tier boundaries and Phase 0 MVS                     |
| Multi-agent vs solo                | 90% improvement (Anthropic) [SQ7b]         | Coordination overhead, 15x token cost [W5c-C4]                     | Resolved by raising T2 threshold to 4+ sub-questions                 |
| Hook detection vs behavioral rules | Hooks catch what AI forgets [SQ6]          | Hooks cannot solve judgment problem [W5c-C3]                       | Resolved by Phase 1 hooks only + investment in guardrail #15 quality |
| Cross-model verification value     | Gemini catches what Claude misses [SQ1]    | Models share failure modes; agreement may be meaningless [W5a-C7F] | UNRESOLVED -- needs empirical data                                   |
| Sequential Thinking MCP value      | Purpose-built for decomposition [SQ5]      | Zero invocations may mean native reasoning is sufficient [W5a-C7C] | UNRESOLVED -- try it in Phase 2 and measure                          |

### 9.3 Areas Needing Further Research

1. **Failure modes of multi-agent research systems** -- the research studied
   only successful systems (survivorship bias) [W5b-C1]. Post-mortems from
   AutoGPT, abandoned CrewAI deployments, etc. would provide critical
   counter-evidence.
2. **Baseline measurement of current research quality** -- no data on whether
   current deep-research outputs are good or bad [W5a-C7B]. Needed before
   claiming the standard will improve things.
3. **Research volume modeling** -- how much total research volume will increase
   with hook detection and tier classification [W5a-C7G]. Risk of research scope
   creep.
4. **Solo developer research patterns** -- what does the user actually need from
   research? How often do they feel the AI under-researched vs over-researched?
   [W5a-C7A]

---

## 10. Source Cross-Reference

### 10.1 Internal Findings (14 files, 10 searcher agents)

| ID   | File                             | Scope                                                   | Key Contribution                                                                    | Confidence  |
| ---- | -------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| SQ1  | SQ1-core-research-patterns.md    | deep-plan, deep-research, CL-PROTOCOL, convergence-loop | 43 quality gates mapped, confidence incompatibility found, pattern taxonomy         | HIGH        |
| SQ2  | SQ2-other-skill-patterns.md      | 14 non-core skills                                      | 6 discovery approaches, 7 verification approaches, 4 pattern families               | HIGH        |
| SQ3  | SQ3-agent-inventory.md           | 41 agents                                               | Full inventory, underuse analysis, capability classification                        | HIGH        |
| SQ4  | SQ4-agent-team-inventory.md      | 2 teams, 3 conceptual teams                             | Zero invocations found, 4 root causes, 6 gaps                                       | HIGH        |
| SQ5  | SQ5-tool-inventory.md            | ~200 tools                                              | 10 MCP servers, 100+ scripts, 10 tool combination gaps                              | HIGH        |
| SQ6  | SQ6-hook-natural-invocation.md   | 4 hooks, CLAUDE.md triggers                             | Zero research hook detection, 7 gap categories, 3-tier signal taxonomy              | HIGH        |
| SQ7a | SQ7a-ai-dev-workflows.md         | 7 AI dev tools                                          | 7 cross-cutting patterns, capability matrix                                         | HIGH        |
| SQ7b | SQ7b-multi-agent-research.md     | 12+ research frameworks                                 | 17x error trap, 4-agent threshold, orchestrator-worker pattern                      | HIGH        |
| SQ8  | SQ8-tiered-complexity.md         | Tiered models across domains                            | DAAO, model routing, 4-tier convergence, quality gates                              | HIGH        |
| SQ9  | SQ9-verification-patterns.md     | Verification at scale                                   | CRAAP/SIFT, self-consistency, cross-model, graduated model                          | HIGH        |
| SQ10 | SQ10-sws-integration.md          | CANON/SWS                                               | L1 assessment, 16-item checklist, enforcement plan                                  | HIGH        |
| W4a  | W4a-internal-gap-synthesis.md    | Internal synthesis                                      | Capability map, 10 ranked targets, 6 cross-cutting themes                           | HIGH        |
| W4b  | W4b-external-internal-mapping.md | External-internal mapping                               | 12 validated patterns, 9 adoption candidates, 7 non-transfers, 6 novel combinations | HIGH        |
| W4c  | W4c-standard-architecture.md     | Architecture proposal                                   | 4-tier model, 6 documents, 10 design decisions, 6 phases                            | MEDIUM-HIGH |

### 10.2 Challenge Files (4 files, 4 challenger agents)

| ID  | File                          | Challenges | Strong Ratings                    | Changes to Recommendations                                                                       |
| --- | ----------------------------- | ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| W5a | contrarian-internal.md        | 7          | 4 (C1, C2, C5, C6)                | Reframe 48% -> 11%; defer opt-out teams; keep CL-PROTOCOL independent; add Phase 0 MVS           |
| W5b | contrarian-external.md        | 7          | 3 (C1, C2, C5)                    | Add failure analysis; re-evaluate for solo scale; Sonnet floor; adaptive verification            |
| W5c | otb-alternative-approaches.md | 7          | 0 REPLACE, 3 SUPPLEMENT, 4 INFORM | Soft tier boundaries; primitives library as Phase 4+; research agent as north star               |
| W5d | otb-user-perspective.md       | 7          | 4 HIGH priority                   | 3 documents max; T0/T1 invisible; global alert budget; launch as lightweight behavioral protocol |

### 10.3 Disposition of Major Claims

| Claim                                              | Source   | Challenge                      | Disposition                                                                |
| -------------------------------------------------- | -------- | ------------------------------ | -------------------------------------------------------------------------- |
| 48% of agents are underused                        | SQ3      | W5a-C1 (STRONG)                | **REVISED**: 11% are high-value untriggered; 22% are retirement candidates |
| Teams should default to opt-out                    | SQ4, W4c | W5a-C2 (STRONG)                | **REJECTED**: Keep opt-in, run experiments first                           |
| CL-PROTOCOL should invoke convergence-loop         | SQ1, W4c | W5a-C5 (STRONG)                | **REJECTED**: Extract shared patterns, keep independent                    |
| 6 documents, 7 sessions                            | W4c      | W5a-C6 (STRONG), W5d-C1 (HIGH) | **REVISED**: Phase 0 MVS (1-2 sessions), 3 documents max                   |
| 4-tier model validated by cross-domain convergence | SQ8      | W5b-C3 (MODERATE)              | **SOFTENED**: Design choice, not validated structure                       |
| Haiku for T1 model routing                         | W4b      | W5b-C5 (STRONG)                | **REVISED**: Sonnet floor for all tiers                                    |
| Blanket tier-level verification                    | W4c      | W5b-C6 (STRONG)                | **REVISED**: Per-finding adaptive verification                             |
| Unified confidence assignment rules                | W4c      | W5a-C4 (MODERATE)              | **REVISED**: Unified labels only, per-system assignment                    |

---

## Unexpected Findings

1. **The "Terminal Is All You Need" paper (March 2026)** [SQ7b] provides
   academic validation that terminal-native design is not a limitation but a
   design exemplar -- directly endorsing SoNash's CLI-native architecture.

2. **Mini-SWE-agent (100 lines, bash-only) scores 74%+ on SWE-bench** [SQ7a] --
   proving that tool simplicity trumps tool quantity and validating the
   investment in workflow design over raw capability.

3. **The system already implements 12 of 12 external best practices** at
   MODERATE-to-STRONG alignment [W4b] -- the research foundation is stronger
   than initially assumed. The gaps are in natural invocation and process
   unification, not in fundamental capability.

4. **De-escalation is a novel contribution** -- no existing framework in any
   domain addresses recognizing mid-research that a question is simpler than
   estimated [SQ8 Gap 5, W4c D9].

5. **Cross-model verification via Gemini CLI is unique** among all systems
   studied [W4b, SQ7a] -- SoNash is the only CLI tool that uses an external AI
   model for verification.

---

## Methodology

**Research waves:**

- Wave 1-3: 10 sub-question investigations (SQ1-SQ10) by 10 searcher agents
- Wave 4: 3 synthesis passes (W4a internal gap synthesis, W4b external-internal
  mapping, W4c standard architecture)
- Wave 5: 4 challenge passes (2 contrarian, 2 outside-the-box)

**Sources consulted:** 26 (SQ7a) + 25 (SQ7b) + 24 (SQ8) + 30 (SQ9) + internal
codebase files = 100+ unique external sources plus extensive internal codebase
analysis.

**Agent count:** 18 total agent passes across 5 waves.

**Challenge impact:** 4 STRONG contrarian challenges changed recommendations. 3
MODERATE challenges flagged for addressing. 7 OTB alternatives produced 3
SUPPLEMENT and 4 INFORM verdicts. No alternative warranted fully REPLACING the
proposed architecture.
