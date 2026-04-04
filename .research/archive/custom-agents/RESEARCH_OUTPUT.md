# Research Output: Custom Agents for Deep-Research and General Duty

<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-03-30
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Topic:** Custom agents for deep-research and general duty within this project
**Depth:** L4 (29 searcher agents, 4 waves + gap-pursuit wave) **Date:**
2026-03-29 **Version:** 3.0 (Phase 6 Amendment — gap-pursuit, verification
corrections, confidence upgrades)

---

## Executive Summary

SoNash v0 operates a Claude Code agent ecosystem of 39 agents (26 local + 13
global). The most recent quality audit (March 17, 2026) scored all 36 agents
existing at that time at an initial mean of 51/100, rising to 54/100 after six
agents were actively improved within the audit session itself. This F-grade
designation is a diagnostic baseline, not a static crisis — the ecosystem
demonstrated self-correction within the audit session. Three agents added after
the audit are unscored. A systematic remediation program addressing the 10
highest-priority gaps would move the ecosystem mean to ≥75/100 in the next full
re-audit within two focused implementation cycles.

The root cause of underperformance is well-understood: agent bodies replace (not
supplement) Claude's generic base system prompt. However, CLAUDE.md files and
project memory load through the normal message flow and are present in all agent
invocations — the risk is **context incompleteness**, not security boundary
absence. What agents without full definitions lack is: explicit stack version
strings (React 19.2.4, Next.js 16.2.0, Firebase 12.10.0), pattern-specific
examples (sanitize-error.js usage, httpsCallable convention), structured return
format expectations, and model assignments. CLAUDE.md security rules (write
gates, behavioral guardrails, anti-patterns) are already inherited.

The most strategically important gap is the deep-research pipeline: 6 pipeline
roles exist across 5 phases, but only the searcher and synthesizer have custom
definitions. The other 4 roles (verifier, dispute-resolver, gap-pursuer,
final-synthesizer) are covered by 15-37 line templates or inline prompts.
Without custom definitions, these roles produce inconsistent outputs — the Phase
2.5 verification role has no template at all, and the Phase 3.97 re-synthesizer
has a high probability of collapsing to full-rewrite behavior that destroys
verification and challenge work. Adding 6 custom definitions (verifier,
contrarian-challenger, otb-challenger, dispute-resolver, gap-pursuer,
final-synthesizer) would close the deep-research pipeline gap completely. This
is a closed set: exactly 6 agents, no further pipeline agents are needed.

The local agent roster requires consolidation (26 → 17 agents, 35% reduction)
through removing 9 stub/orphan agents, elevating 3 stubs to full definitions,
and replacing 1 misdirected definition. Before any deletion, a cross-reference
audit of all 9 removal candidates across CLAUDE.md, skills, teams, and state
files is required. Removed agents should have 60-day redirect stubs to prevent
silent fallback on habitual invocations. Six system/plugin agents need
project-level overrides to inject SoNash stack context, specificity patterns,
and structured return protocols — but hooks (not overrides) are the enforcement
layer for structural constraints. The `sonash-context` shared skill should be
created before new agent definitions to centralize version strings and reduce
per-definition token count.

**Gap-pursuit amendments (v3.0):** Four high-priority corrections from the
gap-pursuit wave: (1) The security-auditor model field is currently
`model: sonnet` (not `model: opus` as the D8 dispute resolution assumed) — the
correct remediation is to explicitly upgrade to `model: opus` at next
substantive update, leveraging Opus 4.6's 1.67x (not 5x) cost differential and
its GPQA Diamond advantage for deep security reasoning. (2) App Check is
architecturally implemented but currently DISABLED (`requireAppCheck: false`)
across all Cloud Functions — this is a doc-vs-runtime gap not tracked in
MASTER_DEBT. (3) Auto-delegation operates via pure LLM reasoning with no
classifier; CLAUDE.md Section 7 is the highest- reliability routing layer; 3
agents have effectively empty descriptions (1-2 chars) that are routing failures
waiting to happen. (4) Firebase official agent skills (11 skills, not 13 as
originally reported) do not cover Cloud Functions, App Check, or httpsCallable —
a `firebase-specialist` agent is justified.

External research validates the project's existing two-team configurations
(audit-review-team and research-plan-team) as architecturally sound. Per-agent
initialization costs 20K-85K tokens; a `TeammateIdle` hook is documented as
absent and should be added to the audit-review-team as a quality gate.

**Implementation order (post gap-pursuit amendment):**

- P0 (Infrastructure): Define success metrics. Create `sonash-context` skill.
  Verify `skills:` injection position. Fix compliance test. Run cross-reference
  audit for 9 removal candidates. Extend hooks for structural enforcement.
  Evaluate Firebase MCP server for live project inspection.
- P1 (Quick wins): General-purpose override. Consolidation with redirect stubs.
  Upgrade security-auditor to `model: opus` at next substantive update. Fix 3
  agents with zero-signal descriptions. "Wait" technique in synthesizer prompts.
- P2 (Deep-research pipeline): 6 pipeline agents — pilot verifier first, then
  proceed. Stub elevations. System overrides. Add `<example>` blocks to agent
  descriptions. Add TeammateIdle hook to audit-review-team.
- P3 (Net-new, capacity-dependent): Only agents passing the 4-criterion creation
  gate. Hard 30-agent total ceiling (one-in-one-out rule). firebase-specialist
  after manual Firebase skills validation.

---

## Key Findings

### Theme 1: Agent Body Semantics — The Foundation Issue

**1.1 Agent body replaces (not supplements) Claude's generic base system prompt
— but CLAUDE.md IS inherited.** [1][2] When a `.claude/agents/*.md` file is
invoked, its body replaces the base system prompt (the generic Claude behavior).
However, CLAUDE.md files and git status load through the normal message flow and
are present in all agent invocations. What the agent body must supply explicitly
are stack versions, pattern examples, and structured return formats. The
CLAUDE.md security rules (write gates, behavioral guardrails, anti-patterns from
Sections 2-5) are already inherited by all agents without any additional action
required.

**1.2 Description field is the primary routing signal.** [1][2][G3]
Auto-delegation depends on the `description` field matching the user's request.
Claude Code uses pure LLM reasoning (no embeddings, classifiers, or regex) to
decide which agent to invoke — all agent names and descriptions are formatted
into the Agent tool's prompt and Claude evaluates them simultaneously during its
forward pass. Official docs confirm: "Claude uses each subagent's description to
decide when to delegate." Anthropic's own plugin agents (`pr-review-toolkit`)
use `<example>` blocks with `<commentary>` inside description fields, confirming
this as a best practice. However, `<example>` blocks are not used by any SoNash
local agents (GV2 confirmed zero matches).

**1.3 Agent names are NOT confirmed to be case-insensitive.** [2][CL1] The
official docs mandate "lowercase letters and hyphens only" for the `name` field
as a hard constraint. No official source confirms case-insensitive runtime name
resolution. The claim "Explore, explore, and EXPLORE resolve to the same agent"
has been DOWNGRADED from MEDIUM to LOW confidence — it is unconfirmed and likely
inverted. CLAUDE.md currently references
`\`Explore\``(capital E) while the agent file defines`name: explore`
(lowercase). Design agent names as lowercase to match the schema standard;
update any CLAUDE.md display-casing to match canonical names.

**1.4 The official frontmatter schema has 16 fields.** [1][2] Fields: name,
description, tools, disallowedTools, model, permissionMode, maxTurns, skills,
mcpServers, hooks, memory, background, effort, isolation, initialPrompt, color.
(Note: D1b header states "17 fields" but the table contains exactly 16 entries —
the header has an off-by-one error.) Plugin agents cannot use hooks, mcpServers,
or permissionMode.

**1.5 The 500-2000 token sweet spot for agent bodies is empirically supported.**
[1] Agents shorter than ~500 tokens lack the specificity to reliably produce
correct outputs. Agents longer than ~2000 tokens push early context out of the
attention window, degrading adherence to later instructions. Current extremes:
fullstack-developer (1281 lines), security-engineer (985 lines), gsd-planner
(1477 lines) — these are at or beyond the upper bound.

---

### Theme 2: Auto-Delegation Architecture and Reliability

**2.1 Auto-delegation is pure LLM reasoning — not algorithmic routing.** [G3]
Claude Code does not use embeddings, classifiers, regex matching, or any
algorithmic routing to select agents. All agent names and descriptions are
formatted into the Agent tool's prompt; Claude makes the delegation decision via
natural language reasoning during the forward pass. This explains both why it
can work well (semantic understanding) and why it fails (probabilistic, context-
sensitive, non-deterministic).

**2.2 Six failure modes for auto-delegation.** [G3] (a) Vague/overlapping
descriptions — LLM cannot reliably choose. (b) Task "looks small enough to do
inline" — Claude judges delegation as unnecessary. (c) Opus over-delegation —
documented Opus 4.6 tendency to over-spawn. (d) Interpretive compliance bias —
Claude infers user intent doesn't require delegation. (e) Context compaction —
post-compaction reconstruction can lose agent descriptions. (f) Name- keyword
collision — one GitHub report shows meaningful keywords in agent names interfere
with routing. Note: SoNash uses `.claude/agents/` (project-scoped), which is
more reliable than `~/.claude/agents/` (user-scoped), where discovery bugs
occurred in Nov 2025–Feb 2026.

**2.3 Description token budget: 45% used, but 3 agents have zero-signal
descriptions.** [GV1] Current SoNash usage: 6,725 characters across 39 agents
against the ~15,000 char ceiling (45% used). Description crowding is not an
immediate concern. However, three agents have 1-2 character descriptions:
`dependency-manager` (1 char), `deep-research-searcher` (2 chars),
`deep-research-synthesizer` (2 chars). These cannot be auto-delegated to
reliably. The `deep-research-*` near-empty descriptions are likely intentional
(programmatic spawn); `dependency-manager` having 1 char is almost certainly a
truncation bug. Fix in P1.

**2.4 CLAUDE.md Section 7 is the highest-reliability routing layer.** [G3]
CLAUDE.md's agent trigger table uses prescriptive "REQUIRED when triggers match"
language and is loaded into every session with high authority. This is more
reliable than description-based auto-delegation. The failure mode for SoNash is
not "Claude doesn't know which agent to use" but "Claude doesn't proactively
scan the CLAUDE.md trigger table without being prompted." Keep both paths:
CLAUDE.md as authoritative routing + @-mention as explicit fallback.

**2.5 Adding `<example>` blocks is the highest-leverage description
improvement.** [CL1][G3] Zero SoNash local agents currently use `<example>`
blocks. Anthropic ships these in their own official plugin agents. The
`<example>` blocks are not in the `description` field per official docs — they
appear inside the description value itself. Add as P2 improvement; use the
pr-review-toolkit plugin agents as the reference template.

---

### Theme 3: Consolidation — 26 to 17 Local Agents

**3.1 Nine agents should be removed after a cross-reference audit (P1).**
[6][12] REMOVE: error-detective, devops-troubleshooter, deployment-engineer,
penetration-tester (all stubs with no SoNash context and genuine alternatives
available). Also: mcp-expert (references nonexistent paths — replace with
corrected definition). Before deletion, grep each agent name across CLAUDE.md,
AGENT*ORCHESTRATION.md, all skills/*.md, all teams/\_.md, and
agent-invocations.jsonl to confirm zero live references. Where references exist,
replace with a 60-day redirect stub.

**3.2 Three stub agents should be elevated to full definitions (P1-P2).**
[6][12] ELEVATE: debugger (P1 — 4+ skills invoke it), performance-engineer (P1 —
no alternative for load/memory analysis), technical-writer (P2 —
documentation-expert is doc-format, technical-writer is implementation spec).
Each needs SoNash context, security boundaries, and structured return protocol.

**3.3 Four redundancy clusters exist; most should be kept.** [12] Cluster
analysis: database-architect vs nextjs-architecture-expert (KEEP BOTH —
genuinely differentiated by layer), security-engineer vs security-auditor
(REMOVE security-engineer — AWS/Python enterprise content with zero SoNash
applicability and Python logging anti-patterns that violate CLAUDE.md Section
5), fullstack-developer vs other specialists (KEEP — unified full-stack view),
debugging cluster (debugger vs error-detective vs devops-troubleshooter: KEEP
debugger, REMOVE others).

**3.4 Net result: 26 → 17 local agents (35% reduction), 2 AGENT_ORCHESTRATION.md
updates needed.** [12] Final canonical action table: REMOVE 9, ELEVATE 3,
REPLACE 1, MODIFY 1, KEEP 8, DEFER 2. test-engineer was not evaluated in D7c
(gap noted — separate analysis needed).

---

### Theme 4: Global Sync Gap and System Override Priority

**4.1 Critical: global agents at runtime (~/.claude/agents/) have no model
field.** [3] The project-tracked agents at .claude/agents/global/ have model:
sonnet (fixed post-March-17 audit). But the runtime path ~/.claude/agents/ may
be stale or absent, depending on how Claude Code resolves global agents. This is
the single most critical infrastructure gap affecting all 13 global agents.

**4.2 Six system/plugin agents need project-level overrides (P1-P2).** [8][9]
Priority overrides: general-purpose (P1 — 13+ invocations, lacks stack-version
specificity), silent-failure-hunter (P1 — references wrong logger),
pr-test-analyzer (P1 — wrong test runner: Jest vs Vitest), code-simplifier (P2),
type-design-analyzer (P2). Note: the pr-review-toolkit plugin contains 6 agents
(not 5) — `comment-analyzer.md` is the sixth (CL1 finding; GV2: count
unverifiable from local filesystem, MEDIUM confidence). CLAUDE.md is NOT
automatically loaded into plugin agents (confirmed by official docs); these
agents receive only their own markdown body as system prompt.

**4.3 The general-purpose override is the highest-leverage specificity injection
action; hooks are the highest-leverage structural enforcement action.** [9][10]
13+ invocations across doc-optimizer, audit-\*, convergence-loop,
pre-commit-fixer currently lack explicit stack version strings, pattern
examples, and structured return formats. CLAUDE.md security rules ARE inherited.
The override injects: stack versions, error sanitization pattern examples,
httpsCallable convention, TypeScript strict mode, repository pattern. This is a
~100-180 line definition with project-wide specificity impact. Note: hooks
handle structural constraint enforcement (import patterns, write gates) — the
override and hook extension are complementary layers.

**4.4 skills: field is an underused optimization — create `sonash-context` skill
before new agents.** [9] The `skills:` frontmatter field (confirmed present in
the official schema) allows agents to load SKILL.md files at invocation time.
Currently unused across all 39 agents. Recommended action: create
`sonash-context` as a shared skill BEFORE implementing new agents. All new agent
definitions should use `skills: [sonash-context]` to inject stack versions and
common patterns. This reduces per-definition token count from 300-400 to 100-200
lines and centralizes version string maintenance. Verify injection position
(system prompt vs user message) in a 30-minute pilot before relying on this for
security context.

---

### Theme 5: Deep-Research Pipeline Gaps

**5.1 Phase 2.5 verification has no template — the most critical unresolved
pipeline gap.** [11][14] SKILL.md describes Phase 2.5 in one sentence.
REFERENCE.md confirms no template exists. Without a custom definition, the
verification agent has no enforcement for file:line citation, no differentiation
between codebase vs external claims, and produces no structured return for the
orchestrator's >20% trigger calculation.

**5.2 Six pipeline roles; only 2 have custom definitions.** [11][14] Phase 1
searcher: deep-research-searcher (385 lines, 11 sections — reference quality).
Phase 2 synthesizer: deep-research-synthesizer (343 lines — reference quality).
Phase 2.5 verification: NO TEMPLATE (REFERENCE.md v1.8 confirmed no Phase 2.5
template). Phase 3 adversarial (contrarian, OTB): REFERENCE.md v1.8 templates —
contrarian ~26 lines, OTB ~27 lines (expanded from 17-line inline in v1.4, but
not custom agents). Phase 3.5 dispute resolution: ~16-line code block template
(three gaps identified). Phase 3.95 gap pursuit: ~37 lines (lacks
profile-switching tool strategy). Phase 3.97 re-synthesis: ~35 lines
(mode-collapse risk to full rewrite without phase awareness).

**5.3 Six new custom agent definitions are needed to close the pipeline — a
closed set.** [11][14][15][16] Minimum viable set (P1, pilot verifier first):
deep-research-verifier, contrarian-challenger, otb-challenger. Ideal set
additions (P2): dispute-resolver, deep-research-gap-pursuer,
deep-research-final-synthesizer. The verifier and final-synthesizer each cover 2
pipeline phases. These 6 agents are a closed set — no further pipeline agents
are needed after this. Custom definitions are justified not because inline
prompts have observably failed, but because each role has a structural
enforcement requirement (structured return format, artifact discipline,
profile-switching tool strategy) that inline REFERENCE.md templates cannot
provide.

**5.4 The Phase 3.9 and 3.97 double-rewrite risk is an architectural hazard.**
[14] If Phase 3.9 (>20% claims changed) AND gap pursuit both trigger, a
general-purpose synthesizer invoked twice will not know what the first
invocation changed. The second invocation may undo Phase 3.9 corrections. A
phase-aware deep-research-final-synthesizer with explicit mode-awareness (which
input files are available) is the architectural solution.

**5.5 Four-verdict taxonomy is the industry standard for verification.** [15]
VERIFIED, REFUTED, UNVERIFIABLE, CONFLICTED (from AAR, OpenFactCheck,
RefChecker, Step-DeepResearch). CONFLICTED is the handoff point to dispute
resolution and is the key addition over the current VERIFIED/REFUTED binary used
in SKILL.md.

**5.6 FIRE architecture reduces verification cost 7.6x (LLM API) and 16.5x
(search API).** [15] Note: these are two separate cost axes, not a single range
(CL1 precision correction). Check model confidence before invoking tools. For
codebase verification: obvious claims (well-known stdlib, top-level files) can
be assessed without filesystem reads, reserving tool calls for genuinely
uncertain cases. Note: FIRE savings apply primarily to external fact-checking
(LLM API + search API costs). For codebase claims, the filesystem read is the
verification mechanism — confidence-checking before filesystem reads has lower
savings than the academic figures suggest for web-sourced claims.

---

### Theme 6: Adversarial Agent Design Patterns

**6.1 Steel-man before attack is the foundational adversarial pattern.** [7][10]
Before challenging any finding, the adversarial agent must articulate the
strongest possible version of the claim. This prevents strawman attacks and
produces higher-quality challenges that the dispute-resolver can actually
evaluate.

**6.2 Pre-mortem framing produces higher-quality challenges than direct
attack.** [7][10] "Assume this research is wrong in 6 months — why?" forces the
adversarial agent to enumerate failure modes rather than critique style. This is
the correct framing for the contrarian-challenger.

**6.3 Free-MAD shows 13-16% quality improvement from consensus-free debate.**
[4] Allowing agents to maintain independent, non-consensus conclusions
outperforms forced convergence for knowledge tasks. The contrarian-challenger
and OTB-challenger should maintain their challenges even when the synthesizer
has high confidence — the challenge is documented as a finding, not resolved by
consensus.

**6.4 iMAD selective triggering cuts adversarial agent cost 57-92%.**
[4][5][CL1] Range clarification (CL1): vs. MAD baseline the range is 57-70%; the
92% figure is vs. GroupDebate specifically. Team/debate activation should be
selective. Note: the specific savings figures come from RL-trained systems
evaluated on benchmark tasks. The applicability as a simple heuristic for
prompt-only pipelines is not independently validated — the direction (selective
triggering) is sound but the magnitude may not transfer.

**6.5 DRAGged five-type conflict taxonomy improves resolution quality in
benchmark evaluations.** [15] Conflict types: No Conflict, Complementary,
Conflicting Opinions, Freshness, Misinformation. Classifying the conflict type
before resolving it is what the dispute-resolver agent must do. Freshness
conflicts (temporal mismatch) are directly applicable to technology research
where 2023 and 2025 sources may both be correct but contradictory. Note: the
24-point improvement figure is from benchmark evaluation; codebase applicability
has not been separately validated.

---

### Theme 7: Model Selection and Tiering

**7.1 Opus 4.6 costs 1.67x Sonnet 4.6, not 5x.** [17][G1] Opus: $5/$25 per
million tokens (input/output). Sonnet: $3/$15. The 1.67x differential
significantly changes the cost-quality tradeoff compared to the assumed 5x
premium (the old "5x" figure referenced Opus 4 at $15/$75 — prior-generation
pricing). The practical implication: Opus is justified for any task with
meaningful reasoning complexity, not only the highest-stakes decisions.

**7.2 security-auditor model correction and remediation path.** [G1][GV1] The
current `security-auditor.md` has `model: sonnet` (GV1 confirmed — not
`model: opus` as D8 dispute resolution assumed). The D8 resolution was
predicated on a starting state that does not exist. The correct remediation:
explicitly upgrade security-auditor to `model: opus` at next substantive update.
Rationale: Anthropic used Opus 4.6 (not Sonnet) for their flagship security
research finding 500+ vulnerabilities in production codebases; GPQA Diamond gap
is 17.2 points (91.3% Opus vs 74.1% Sonnet); community consensus recommends Opus
for security audits. At 1.67x cost differential (not 5x), Opus is justified for
deep security analysis tasks. For routine reviews, Sonnet remains
cost-efficient. Bundle the upgrade with the security-auditor rewrite needed for
C-046 (Python logging anti-patterns). Note: `effort: max` is Opus 4.6 ONLY — it
is NOT a Sonnet capability upgrade and returns an API error when applied to
Sonnet. [G1]

**7.3 The skill model: field is broken (GitHub Issue #21679, open since Jan
2026, high-priority).** [17][18][CL1] Confirmed HIGH confidence (upgraded from
MEDIUM). Issue state as of 2026-03-20: still open, labeled `high-priority`,
confirmed by community reproduction. Skills cannot specify model selection. Any
model tiering for skill-invoked agents must be implemented in the skill's spawn
prompt, not in the skill frontmatter. No SKILL.md in the SoNash project uses
`model:` field (GV2 confirmed: zero matches).

**7.4 Heterogeneous model teams outperform homogeneous teams by up to +33-34%.**
[4][5] For the research-plan-team, planner on Opus + researcher on Sonnet is the
validated pattern. This is already implemented correctly.

**7.5 Built-in agents have assigned models: Explore = Haiku, Claude Code Guide =
Haiku, statusline-setup = Sonnet.** [18][CL1] Names corrected: "Guide" is
"Claude Code Guide"; "statusline" is "statusline-setup". Model assignments
confirmed HIGH (upgraded from MEDIUM) via official docs table. Override agents
should use `model: inherit` to preserve Claude Code's default behavior.

---

### Theme 8: Team Composition and Orchestration Patterns

**8.1 Both current team configs are architecturally sound.** [19][20][GV2]
audit-review-team (2-member sequential) matches the "Parallel Specialists with
sequential handoff" archetype. research-plan-team (3-member with progressive
handoff) matches the "Research-Plan-Verify" archetype. GV2 confirmed both team
configs match their described structure exactly. External empirical data
validates both designs.

**8.2 Agent team cost data: 3-7x multiplier, 20K-85K tokens per-agent init
overhead.** [G4] Official docs state 7x for plan mode; practitioners report 3-4x
for standard mode. Per-agent initialization cost: 20,000-85,000 tokens (context
bootstrapping + tool access verification + project understanding + communication
protocol setup). Ongoing per-agent per-minute: 500-2,000 tokens context
maintenance + 1,000-5,000 per inter-agent communication event. SoNash-specific:
audit-review-team ~3x solo cost (confirmed in team config), research-plan-team
~4x solo cost (confirmed in team config).

**8.3 MAST taxonomy: 41.8% of multi-agent failures are design-time
(preventable).** [5][19][CL1] FC1 specification failures (role disobedience,
context loss, missing termination) = 41.77%. FC2 inter-agent misalignment =
36.94%. FC3 task verification and termination = 21.30%. Figures confirmed HIGH
confidence (upgraded from MEDIUM) from MAST project page and paper abstract
(1,600+ annotated traces, kappa = 0.88). FC1 directly validates the stub
elevation and override creation program.

**8.4 Recommend against a PR review team and against a deep-research team
configuration.** [20] PR review team: RECOMMEND AGAINST for standard PR reviews.
The existing audit-review-team covers the high-security-sensitive use case. A
dedicated PR team would duplicate infrastructure without adding value for a solo
developer. Deep-research team: RECOMMEND AGAINST. The pipeline's sequential
phase structure means searchers, verifiers, and challengers do not benefit from
real-time messaging. The one-team-per-session constraint would block
audit-review-team or research-plan-team. Subagent orchestration with custom
per-role definitions is the correct pattern.

**8.5 research-plan-team researcher role is an ad-hoc approximation.** [20] The
team's researcher does not inherit deep-research-searcher's CRAAP+SIFT
evaluation, confidence calibration, or structured return format. Research
quality from the team is lower than from a full /deep-research invocation. This
trade-off is acceptable for the team's defined use case but should be explicitly
documented.

**8.6 TeammateIdle hook is absent — should be added to audit-review-team.**
[G4][GV2] The `TeammateIdle` hook (exit code 2 = keep working with feedback) is
a powerful quality enforcement mechanism. GV2 confirmed it is NOT configured in
`.claude/settings.json`. It appears only in research docs as a documented gap.
In the audit-review-team's sequential design, the reviewer and fixer alternate —
one is always idle. Adding a TeammateIdle hook that validates reviewer findings
format before the fixer receives them provides quality gate enforcement at the
hook level. Add as P2.

**8.7 Anthropic C compiler validation: 16 agent teams, ~100K lines of code,
~$20K.** [G4] Anthropic internally validated Agent Teams at scale by having "16
agent teams" work across ~2,000 sessions to rewrite a C compiler in Rust,
producing ~100,000 lines of code at approximately $20,000 (2 billion input
tokens, 140 million output tokens). "16 agent teams" means 16 sequential team
runs (given one-team-per-session limit). Key constraint still in effect: one
team per session, no nested teams.

---

### Theme 9: Net-New Agent Candidates

**9.1 Firebase official skills do NOT cover SoNash's core security patterns.**
[G2][GV1] The 11 official Firebase agent skills (not 13 as originally noted; 11
is the correct count from direct inspection) cover generic Firebase guidance but
omit: App Check enforcement, `httpsCallable` Cloud Functions, Zod validation,
`withSecurityChecks()` wrapper, rate limiting, and
`sonash.security.no-direct-firestore-write` Semgrep rule. GV1 confirmed:
`httpsCallable` is used in 12 SoNash files; Zod is present in Cloud Functions;
App Check infrastructure exists but is currently DISABLED
(`requireAppCheck: false`) across ALL functions. A `firebase-specialist` agent
is justified for "build it right the first time" guidance that supplements the
security-auditor's "verify correctness" role. Install the Firebase MCP server
separately for live operational tooling (live Firestore queries, Auth user
lookup, Functions log retrieval) — evaluate as P0 infrastructure step.

**9.2 App Check doc-vs-runtime gap is untracked debt.** [GV1] CLAUDE.md Section
2 states "App Check Required — all Cloud Functions verify tokens." Filesystem
reality: `requireAppCheck: false` with the same
`// TEMPORARILY DISABLED - waiting for throttle to clear` comment in every
function: `saveDailyLog`, `saveJournalEntry`, `softDeleteJournalEntry`,
`saveInventoryEntry`, `migrateAnonymousUserData` (App Check block commented out
entirely). No issue tracker reference or timeline is documented for when this
will be re-enabled. This is outside the scope of agent design but was discovered
during Firebase verification and should be entered into MASTER_DEBT.

**9.3 convergence-loop-verifier has 6+ caller skills but requires documented
failure before creation (P3).** [10][23] Caller skills: convergence-loop,
deep-plan, skill-audit, pr-retro, create-audit, all audit-\* discovery phases.
Currently these inject the T20 tally protocol via multi-line orchestrator
prompts. However, no documented session failure from T20 protocol drift has been
recorded. Defer to P3 with prerequisite: first demonstrate T20 protocol
inconsistency in 2 sessions. Skills injection via `skills:` frontmatter (see
Theme 4.4) may provide equivalent stabilization without a full custom agent.

**9.4 Top net-new general-duty agents by SoNash value (creation gate applies).**
[21][22][23]

1. general-purpose override (P1 — see Theme 4.3)
2. firebase-specialist (P3, after Firebase skills manual validation and MCP
   server evaluation)
3. refactoring-specialist (P3 if capacity allows — not in roster; code
   refactoring is frequent)
4. session-begin-health-triage and session-end-compliance-enforcer (P2) Note:
   self-improving pattern-promotion agent is REJECTED. Human judgment on
   CLAUDE.md content is a deliberate architecture decision. Automation removes
   the friction that prevents low-quality patterns from polluting the
   always-loaded context. CLAUDE.md's ~135-line constraint is explicit in
   Section 1.

**9.5 React 19 and Next.js 16 are post-training — version-specific agents
prevent regressions.** [22] Official Vercel React best-practices agent skill
encodes React 19.x patterns. SoNash runs React 19.2.4 — well after training data
cutoff. Without a React 19-specific agent, frontend-developer may generate React
18 patterns in an incompatible context.

**9.6 Creation gate: 4 criteria required before any net-new general-duty agent
is created.** [20]

1. The agent covers a capability with no current coverage (not redundant with
   existing agents)
2. The agent has 2+ invocations per week from skills OR is referenced in
   CLAUDE.md triggers
3. Inline prompts in the invoking skill have demonstrably failed in a documented
   session
4. The new agent count remains at or below the 30-agent hard ceiling
   (one-in-one-out at ceiling)

---

### Theme 10: Quality Validation and Lifecycle Management

**10.1 Three-layer testing is the production standard for agent quality.** [24]
Unit tests (prompt-response assertions via DeepEval/Promptfoo), integration
tests (agent-to-agent handoffs, tool sequences), behavioral tests
(spec-compliance across diverse scenarios). No SoNash agent has golden test
cases at any layer.

**10.2 Agent-Pex methodology enables specification-driven testing now.** [24]
Extract checkable rules from the agent's own role/instruction blocks. Test
traces against those rules. Violation detection output: output_spec_eval_score.
This is directly implementable using the existing audit-agent-quality skill
framework with a behavioral testing addition.

**10.3 10-step pipeline with 99% per-step success yields only 90.4%
end-to-end.** [24] At 95% per-step, a 5-agent pipeline is 77% end-to-end. This
quantifies why pipeline-entry agent quality matters disproportionately — early
failures cascade.

**10.4 TDMS integration for audit findings is defined but may not have run.**
[13][25] Post-audit TDMS commands (validate-schema.js, intake-audit.js,
generate-views.js) are listed but no evidence confirms the pipeline ran after
the March 2026 audit. 59 structural findings from the audit may not be in
MASTER_DEBT. The TDMS state file last entry is dated 2026-02-24 — over a month
before the March 17 audit.

**10.5 Periodic security audit of agent permissionMode values recommended.**
[G3][GV1] CVE-2025-59536 (March 2026, Check Point Research) documents RCE and
API token exfiltration through Claude Code project files. GV1 confirmed: zero
SoNash agents use `bypassPermissions` or `dontAsk` permission modes — attack
surface is reduced. However, all 39 agent files checked into version control
represent a supply chain attack surface regardless of permission mode. Add
periodic review of agent permissionMode values to the audit-agent-quality
cadence.

---

## Contradictions and Open Questions

### Contradiction Table

| Issue                                                               | Position A                                                                                             | Position B                                                                                                                               | Resolution                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLAUDE.md inheritance in agents                                     | Original synthesis: "no CLAUDE.md context is inherited unless explicitly included"                     | V1 C-001 MODIFIED + D1b official docs: CLAUDE.md and git status load automatically through normal message flow                           | V1/D1b wins. T1 official docs evidence confirmed by two independent codebase reads. The original claim misrepresents its own cited source. Threat model is context incompleteness, not security boundary absence.                                           |
| "18 agents skipped without scoring" vs JSONL                        | Original synthesis 2.1: "18 agents were skipped without scoring"                                       | V1 C-007 MODIFIED: `agents_audited=36` confirms ALL 36 agents were scored; `decisions.skip=18` = 18 improvement ACTIONS deferred         | V1 wins. T1 ground truth (JSONL direct read). The claim misread the JSONL schema.                                                                                                                                                                           |
| security-engineer vs security-auditor: KEEP BOTH vs REMOVE          | Original synthesis 3.3: "security-engineer vs security-auditor (KEEP BOTH)"                            | V1 C-048 REFUTED: D7c:172 explicitly states "Resolution: DELETE security-engineer"; D7c:298 includes it in REMOVE list                   | V1 wins. T1 ground truth (D7c direct filesystem read). security-engineer has AWS/Python content with zero SoNash applicability.                                                                                                                             |
| PR review team DEFERRED vs RECOMMEND AGAINST                        | Original synthesis 8.4 / C-086: "evaluated and DEFERRED"                                               | V2 C-086 REFUTED: D11b line 379 states "RECOMMEND AGAINST a PR review team for standard PR reviews"                                      | V2 wins. T1 ground truth (D11b direct read). "DEFERRED" does not appear in D11b context; recommendation is a clear rejection.                                                                                                                               |
| Color field non-standard: which agents?                             | Original synthesis / C-091: dependency-manager and documentation-expert have non-standard color values | V2 C-091 REFUTED: neither has a color field; non-standard colors are in deep-research-synthesizer (`purple`) and gsd-debugger (`orange`) | V2 wins. T1 ground truth (direct file reads + git history). D12b misidentified the agents.                                                                                                                                                                  |
| Gap-pursuer design                                                  | D8b: defer (extend searcher or separate TBD)                                                           | D9b: separate definition (non-recursion philosophy is distinct)                                                                          | D9b resolves D8b's uncertainty. Separate `deep-research-gap-pursuer` is the correct approach. D9b is more evidenced (filesystem ground truth vs theoretical framing).                                                                                       |
| Voting vs evidence-weight for knowledge disputes                    | ACL 2025 paper: consensus +2.8% for knowledge tasks                                                    | AgentAuditor: majority voting follows the herd into wrong consensus                                                                      | Not truly contradictory — the 2.8% gain may be small enough that evidence-weight dominates when adversarial challenges are possible. Evidence-weight is the correct approach for deep-research dispute resolution.                                          |
| Gap recursion depth: 1 round (current) vs 9-12 (empirical standard) | SKILL.md: 1 round of gap pursuit                                                                       | AgentCPM/Step-DeepResearch: 9-12 steps before diminishing returns                                                                        | These are not comparable — production systems use RL-trained depth balancing. Non-RL prompt pipelines likely plateau earlier. 2-3 rounds is a reasonable intermediate. Current 1-round limit is conservative but defensible.                                |
| Multi-agent quality improvement                                     | arXiv: finance analysis +80.9% with teams                                                              | Same source: planning tasks -39% to -70%                                                                                                 | Task-type dependent. Teams improve analysis/review; teams hurt planning/sequential work. Not contradictory — different task types.                                                                                                                          |
| LLM-as-Judge reliability                                            | AgentAuditor: reasoning-tree outperforms LLM-as-Judge                                                  | Anthropic/Google/Galileo: LLM-as-Judge as primary mechanism                                                                              | AgentAuditor may outperform naive LLM-as-Judge. Structured rubrics with per-dimension isolation remain valuable. Prefer reasoning-tree where available.                                                                                                     |
| "F to B in two cycles" framing                                      | Original synthesis: aspirational headline                                                              | D7 dispute resolution: needs defined measurement target                                                                                  | Resolved to: "Addressing P1+P2 recommendations, re-running audit-agent-quality with all agents scored, achieving mean ≥75/100 within 2 implementation cycles."                                                                                              |
| security-auditor model: opus vs model: sonnet                       | D8 dispute resolution: assumed `model: opus` as starting state; recommended migrating to `effort: max` | GV1: filesystem shows `model: sonnet`; D8's assumed starting state does not exist                                                        | GV1 wins. T1 ground truth (direct file read). Correct action: explicitly add `model: opus` at next substantive update. `effort: max` is Opus-exclusive and should not be added to a Sonnet-based agent.                                                     |
| `effort: max` as model-upgrade alias vs API error on Sonnet         | DR1 D8 interpretation: `effort: max` in frontmatter selects Opus 4.6 regardless of base model          | G1 interpretation: `effort: max` is a runtime effort parameter; returns API error on Sonnet                                              | G1 wins on the explicit official doc language: "Requests using `max` on other models return an error." The DR1 D8 "model-upgrade alias" interpretation is not supported by the official error language. Net effect is the same: use `model: opus` directly. |
| Agent name case-insensitivity                                       | D6c: "Explore, explore, EXPLORE resolve to same agent"                                                 | CL1 + official docs: `name` field mandates lowercase; no case-insensitive resolution confirmed                                           | CL1 wins. Docs mandate lowercase as hard constraint. The claim is unconfirmed and likely wrong. Downgrade to LOW.                                                                                                                                           |
| Firebase 13 skills vs 11 skills                                     | Original synthesis: "13 purpose-built Firebase skills"                                                 | G2 direct inspection: 11 skills (no "Cloud Functions" or "App Check" skills in the repo at research time)                                | G2 wins. Direct content inspection of the `firebase/agent-skills` repository. Count corrected to 11.                                                                                                                                                        |

### Unresolved Questions

1. **Global agent sync mechanism**: How does Claude Code resolve
   `~/.claude/agents/` vs `.claude/agents/global/`? The sync gap between
   project-tracked and runtime paths was identified but the resolution mechanism
   was not confirmed from official docs.

2. **Agent auto-delegation reliability in practice**: HN discussion surfaced
   contradiction between docs ("Claude automatically delegates when description
   matches") and practitioner experience ("Claude often completes the task
   itself"). Confidence: MEDIUM — delegation reliability may require explicit
   user invocation in many cases.

3. **Optimal gap-pursuit depth for non-RL pipelines**: The empirical 9-12 step
   limit comes from RL-trained systems. For prompt-only pipelines, the optimal
   depth before diminishing returns is unknown. 2-3 rounds is a reasonable
   estimate but not empirically validated.

4. **Return protocol schema for >20% trigger**: No schema exists for how the
   orchestrator counts claim changes across Phase 2.5 + Phase 3 + Phase 3.5
   returns. Designing structured returns for verification/challenge/dispute
   agents requires agreeing on a consistent change-count schema.

5. **test-engineer evaluation**: The D7c consolidation synthesis explicitly
   excluded test-engineer from the action table. It has a confirmed internal
   contradiction (Jest examples in body despite Vitest mandate in override
   section). Requires separate analysis before any consolidation decision.

6. **skills: injection position**: Whether `skills:` content injects into the
   system prompt or is appended as a user message is unverified. This determines
   whether `sonash-context` skill can be relied upon for security context. A
   30-minute verification experiment is required before relying on this
   mechanism.

7. **App Check re-enablement timeline**: `requireAppCheck: false` is present in
   all Cloud Functions with "TEMPORARILY DISABLED" comments but no timeline or
   issue tracker reference. Unknown how long App Check has been disabled.

8. **`effort: max` in agent frontmatter**: Whether `effort: max` in a Claude
   Code agent frontmatter file acts as a model-upgrade alias (selecting Opus
   4.6) vs a runtime effort parameter (returning API error on Sonnet) cannot be
   verified from the filesystem alone. The official API docs (G1) say "Requests
   using `max` on other models return an error." Use `model: opus` directly to
   avoid ambiguity.

---

## Confidence Assessment

| Category                                                | Confidence | Basis                                                                                                                       |
| ------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Agent frontmatter schema (16 fields)                    | HIGH       | Two independent codebase reads (D1, D1b) confirming same schema; V1 C-004 corrected off-by-one from 17 to 16                |
| CLAUDE.md IS inherited in all agents                    | HIGH       | D1b official docs + D6c override gap synthesis — two independent T1 sources                                                 |
| Ecosystem quality state (F grade, 54/100)               | HIGH       | Direct filesystem read of audit history JSONL; V1 C-007 corrected misread: all 36 agents were scored                        |
| Consolidation action table (26 → 17)                    | HIGH       | D7a, D7b, D7c convergence; V1 C-048 corrected security cluster to REMOVE security-engineer                                  |
| Pipeline agent gap analysis                             | HIGH       | D9b ground-truth filesystem reads; Phase 2.5 template absence confirmed by exhaustive REFERENCE.md grep                     |
| Global sync gap (runtime path stale)                    | HIGH       | D3c identified; V1 C-013 confirmed zero model fields in ~/.claude/agents/                                                   |
| PR review team recommendation                           | HIGH       | V2 C-086: D11b explicit RECOMMEND AGAINST (not deferral)                                                                    |
| Color field non-standard agents                         | HIGH       | V2 C-091: deep-research-synthesizer (purple) and gsd-debugger (orange) — not dependency-manager/documentation-expert        |
| Team config assessments                                 | HIGH       | D11b ground-truth reads + D11a external validation from 15 independent sources; GV2 confirmed all structural details        |
| Description as primary routing signal                   | HIGH       | CL1 upgraded from MEDIUM: two Tier-1 sources (official docs + official plugin examples)                                     |
| Skill model: field broken                               | HIGH       | CL1 upgraded from MEDIUM: GitHub Issue #21679 confirmed open, high-priority, active                                         |
| Built-in agent model assignments                        | HIGH       | CL1 upgraded from MEDIUM: confirmed verbatim in official docs table                                                         |
| MAST FC1/FC2 percentages                                | HIGH       | CL1 upgraded from MEDIUM: confirmed 41.77%/36.94% via multiple sources including official MAST page                         |
| iMAD 57-92% cost reduction                              | HIGH       | CL1 upgraded from MEDIUM with precision note: 57-70% vs MAD baseline, 92% vs GroupDebate                                    |
| FIRE 7.6x/16.5x cost reduction                          | HIGH       | CL1 upgraded from MEDIUM: confirmed in ACL Anthology as two separate cost axes                                              |
| Net-new agent value rankings                            | MEDIUM     | D10a/D10b cross-referenced across 3+ sources; creation gate reduces this to specific candidates                             |
| Model pricing (Opus 1.67x Sonnet)                       | HIGH       | D4a + G1 confirmed from official pricing pages                                                                              |
| gap-pursuit recursion depth recommendation (2-3 rounds) | MEDIUM     | Extrapolated from RL-trained system empirics; not directly tested in prompt-only pipelines                                  |
| Agent auto-delegation reliability                       | MEDIUM     | Contradiction between docs and practitioner experience; G3 added pure-LLM mechanism understanding                           |
| FIRE/iMAD/DRAGged codebase applicability                | LOW-MEDIUM | Quantified savings from external academic papers; codebase verification has different cost structure than web fact-checking |
| skills: injection position                              | LOW        | Mechanism documented in official schema but injection position (system prompt vs user message) is not filesystem-verified   |
| Agent name case-insensitivity                           | LOW        | CL1 downgraded from MEDIUM: no official source confirms runtime case-insensitive resolution; docs mandate lowercase         |
| App Check disabled in all Cloud Functions               | HIGH       | GV1 direct filesystem read: `requireAppCheck: false` in all 5 Cloud Functions                                               |
| Firebase MCP server not configured                      | HIGH       | GV1: no mcpServers key in settings.json; no Firebase in enabledPlugins                                                      |
| Team init overhead (20K-85K tokens/agent)               | MEDIUM     | G4 from practitioner estimates; no official Anthropic data published                                                        |

---

## Recommendations

### P0 — Infrastructure (Before Any Agent Creation Begins)

**P0.1 Define success metrics.** The target is mean ≥75/100 in the next full
re-audit with all agents scored, within 2 focused implementation cycles. This
replaces the aspirational "F to B" headline.

**P0.2 Create `sonash-context` shared skill and verify injection position.**
Create a SKILL.md file containing: stack versions (React 19.2.4, Next.js 16.2.0,
Firebase 12.10.0), error sanitization pattern, httpsCallable convention,
TypeScript strict mode, repository pattern. All new agent definitions use
`skills: [sonash-context]`. Run a 30-minute pilot to verify whether skills
inject into system prompt or user message.

**P0.3 Fix check-agent-compliance.test.ts.** The test re-implements
AGENT_TRIGGERS pattern matching that does not match the production script's
file-change detection logic. This provides false confidence. Fix the test to
validate the actual behavior before creating new agents.

**P0.4 Run cross-reference audit for 9 removal candidates.** For each of the 9
agents targeted for removal, grep across: CLAUDE.md, AGENT*ORCHESTRATION.md, all
skills/*.md, all teams/\_.md, agent-invocations.jsonl. Produce a reference map.
Agents with zero references may be deleted. Agents with any references get
60-day redirect stubs instead.

**P0.5 Extend hooks for structural constraint enforcement.** Add a PostToolUse
Write hook scanning for direct Firestore import patterns in new .ts/.tsx files.
This provides structural constraint enforcement across all 39 agents
simultaneously, without context window cost. This is the highest-leverage
security enforcement action — hooks cover what CLAUDE.md handles verbally but
mechanically is only enforced here.

**P0.6 Evaluate Firebase MCP server for live project inspection.** The Firebase
MCP server (bundled with `claude.com/plugins/firebase`) adds live Firestore
query, Auth user lookup, and Functions log retrieval tools that SoNash agents
currently lack. This is separate from the firebase-specialist agent question.
Install and test before building any Firebase-facing agents that might benefit
from live project access.

---

### P1 (Immediate — Highest Impact)

**R1. Create general-purpose project override.** [8][9][10] 100-180 lines.
Injects stack versions (React 19.2.4, Next.js 16.2.0, Firebase 12.10.0), error
sanitization pattern examples, httpsCallable convention, TypeScript strict mode,
repository pattern into all 13+ invocations across doc-optimizer, audit-\*,
convergence-loop, pre-commit-fixer. Note: hooks handle structural constraint
enforcement; this override handles specificity injection. These are
complementary. Use `model: inherit` to preserve default behavior.

**R2. Create deep-research-verifier (unified Phase 2.5 + 3.96).** [11][14][15]
300-380 lines. Two scope modes (codebase, consistency). Four-verdict taxonomy
(VERIFIED, REFUTED, UNVERIFIABLE, CONFLICTED). FIRE-style confidence gating
before tool invocation. Structured return for orchestrator's >20% trigger
calculation. Use `skills: [sonash-context]`. **Pilot this agent in one complete
deep-research session before proceeding with contrarian-challenger and remaining
pipeline agents.**

**R3. Create contrarian-challenger and otb-challenger.** [7][10][16] 250-320
lines each. Steel-man before attack. Pre-mortem framing. Anti-sycophancy
mandate. Salvagente Rule (serendipity seeds from rejected findings). Parallel
execution. Use `skills: [sonash-context]`. Custom definitions are justified
because these roles produce `.research/challenges/` files consumed by
dispute-resolver — inline prompts have no artifact discipline.

**R4. Create project overrides for silent-failure-hunter and pr-test-analyzer.**
[8][9] Both P1 due to active incorrect behavior (wrong logger references, wrong
test runner).

**R5. Remove 9 stub agents (after cross-reference audit from P0.4).** [6][12]
REMOVE with redirect stubs for any with references. 60-day redirect stub
duration. After 60 days, remove the stub files and update all referencing
documents.

**R6. Add "Wait" technique to deep-research-synthesizer and final-synthesizer
prompts.** The "wait" technique — explicitly pausing before acting on
synthesizer instructions — is a zero-cost universal quality enhancer. Add a
`<wait>` instruction at the top of the synthesizer's execution flow section.

**R7. Fix 3 agents with zero-signal descriptions.** [GV1][G3]
`dependency-manager` (1 char — likely truncation bug), `deep-research-searcher`
(2 chars), `deep-research-synthesizer` (2 chars). For the deep-research agents,
confirm whether empty descriptions are intentional (programmatic spawn only).
For `dependency-manager`, add a full condition-focused description. This fixes a
P1 routing failure risk.

**R8. Upgrade security-auditor to `model: opus` at next substantive update.**
[G1][GV1] Current state: `model: sonnet`. Correct action: add `model: opus`. Do
not add `effort: max` — this returns an API error on Sonnet and is not a valid
model-upgrade path. Bundle with the security-auditor rewrite needed for C-046
(Python logging anti-patterns in the body). For routine reviews, the operator
may choose to keep Sonnet; for deep security analysis sessions, `model: opus` is
justified by the GPQA Diamond gap and Anthropic's own security research
practice.

---

### P2 (Next Cycle)

**R9. Create dispute-resolver, deep-research-gap-pursuer,
deep-research-final-synthesizer.** [11][14][16] Completes the ideal-set for the
deep-research pipeline. Dispute-resolver handles DRAGged five-type conflict
classification. Gap-pursuer has non-recursion enforcement and profile-switching
tool strategy (codebase → Grep/Read/Bash, web → WebSearch/WebFetch, docs →
Context7 MCP). Final-synthesizer has explicit edit-mode philosophy (not full
rewrite) covering Phases 3.9 and 3.97. All use `skills: [sonash-context]`.

**R10. Elevate debugger, performance-engineer, technical-writer from stub to
full definitions.** [6][12] debugger (P1 among P2 group — 4+ skills invoke it),
performance-engineer, technical-writer. Each needs SoNash context (or
`skills: [sonash-context]`), security boundaries, structured return protocol.
Estimated 200-350 lines each.

**R11. Elevate research-plan-team researcher role to reference
deep-research-searcher protocols.** [19][20] Add CRAAP+SIFT evaluation,
confidence calibration, source hierarchy awareness to the team's researcher
role. Fix complexity trigger to reference SKILL.md L1-L4 depth levels instead of
"L or XL" labels.

**R12. Build firebase-specialist agent (after P0.6 MCP evaluation and manual
Firebase skills validation).** [G2][21][22] Wrap official Firebase agent skills
with SoNash-specific constraints (App Check enforcement, 3-collection write
gate, httpsCallable pattern). The official skills provide generic Firebase
guidance but are missing the entire SoNash security boundary architecture. The
specialist bridges between official skills (broad) and security-auditor
(narrow). Requires manual validation of 3 Firebase skills against SoNash test
scenarios before agent creation. Count: 11 official skills, no Cloud Functions
or App Check coverage confirmed.

**R13. Add `<example>` blocks to highest-invocation agents.** [CL1][G3] Zero
SoNash local agents use `<example>` blocks. Priority candidates: code-reviewer,
security-auditor, explore, plan (Tier A reference agents). Use the official
pr-review-toolkit plugin agents as format reference. Add to 3-4 highest-value
agents in P2; expand in P3.

**R14. Add TeammateIdle hook to audit-review-team.** [G4][GV2] Hook type
`TeammateIdle` with exit code 2 for quality gate enforcement. Validates reviewer
findings format before fixer receives them. Prevents idle notification flood
degrading lead context. Pattern: check reviewer output against expected findings
structure before allowing idle notification to propagate.

**R15. Add frontmatter validation to audit cadence (not pre-commit).** [13][24]
Per CH1 Challenge 4: per-commit frontmatter validation has low ROI (fires on
0.1% of commits). Higher-ROI alternative: add frontmatter schema checks to the
30-day audit-agent-quality run. Minimum checks: name/filename match, description
present, model present, tools present, no unknown fields.

**R16. Wire audit-agent-quality history JSONL into /alerts.** [13][25]
Low-friction cadence enforcement: compare current date vs last audit date,
surface recommendation when threshold reached. Currently defined as SHOULD in
SKILL.md but not implemented. This is the highest-ROI quality infrastructure for
a solo developer.

---

### P3 (Future Sessions — Creation Gate Required)

**R17. Probe for refactoring-specialist (if post-consolidation capacity
allows).** [21][22] Must pass 4-criterion creation gate (Theme 9.6). Not in
roster; code refactoring is frequent. Community templates exist; adaptation is
the primary work.

**R18. convergence-loop-verifier (if T20 drift is documented in practice).**
[10][23] Move from "highest-ROI" to creation-gate-gated P3. Prerequisite:
document T20 protocol inconsistency in 2 sessions. Skills injection via
`skills:` may achieve equivalent stabilization if it loads into the system
prompt.

**R19. Create persistent golden test fixtures for 7 CLAUDE.md-mandated agents.**
[13][24] Contingent on R16 (audit cadence) being established first. Input
fixtures with planted issues + expected findings checklist. Store in
tests/agents/<agent-name>/. Makes quality regression detectable across audit
cycles.

**R20. Resolve replace/keep decisions on code-simplifier,
type-design-analyzer.** [8][9] D6b recommended MEDIUM priority overrides. Both
are P3 after P1/P2 work completes.

**R21. Enter App Check disabled state into MASTER_DEBT.** [GV1] CLAUDE.md
Section 2 claims "App Check Required" but all Cloud Functions have
`requireAppCheck: false`. This is outside agent scope but was discovered during
Firebase verification. Create a MASTER_DEBT entry with the comment text as the
description and flag for follow-up. Consider this a security debt item.

### Solo Developer Constraint

This project is operated by a solo developer. The hard ceiling is 30 total
agents: 17 local (post-consolidation) + 13 global (with pipeline agents
replacing or adding within the existing slot). Any recommendation that adds
agents beyond the pipeline set of 6 requires removing one existing agent first
(one-in-one-out rule at the ceiling). Tracking and measurement overhead should
be reduced before adding complexity (R16 is the highest-priority quality
infrastructure investment for this constraint).

---

## Unexpected Findings

**Serendipity from the Research**

1. **The compliance test is testing the wrong implementation.** [13]
   check-agent-compliance.test.ts implements AGENT_TRIGGERS pattern matching
   that does not match check-agent-compliance.js's actual behavior. False
   confidence in the compliance system. (Source: D12b direct filesystem
   comparison; confirmed T1.)

2. **The Phase 3.9 and 3.97 double-rewrite is an unrecognized architectural
   hazard.** [14] Not flagged in SKILL.md or REFERENCE.md. If both phases
   trigger in sequence and both invoke a general-purpose synthesizer, the second
   invocation may silently undo Phase 3.9 corrections. (Source: D9b serendipity
   section.)

3. **FIRE's internal-knowledge-first principle is a generalizable cost-reduction
   strategy.** [15] Not limited to verification. Any agent that must make a
   decision can check model confidence before invoking tools. Applicable to
   searchers, verifiers, orchestrators. Note: savings are primarily for LLM
   API + search API costs; filesystem verification cost structure differs.

4. **Firebase official agent skills (11 skills) do NOT cover SoNash's security
   boundary.** [G2] Direct content inspection confirms: no App Check, no Cloud
   Functions, no httpsCallable coverage in any of the 11 official skills. The
   firebase-specialist agent is needed not as a replacement for official skills
   but as a SoNash-specific security constraint layer on top of them. (Source:
   G2 direct SKILL.md content inspection.)

5. **GoAgent (March 2026) uses group-centric topology, not graph diffusion.**
   [CL1] The original C-088 claim attributed "graph diffusion" to GoAgent
   (arXiv:2603.19677). The paper uses CIB-based group enumeration. The $5.60 vs
   $43.70 cost figures in C-088 do not appear anywhere in the paper. Three
   factual errors confirmed; claim remains LOW confidence. (Source: CL1 direct
   paper inspection.)

6. **GoAgent topology auto-generation (March 2026) may render manual team design
   obsolete within 1-2 years.** [19] Graph diffusion models (GTD,
   arXiv:2510.07799, separate paper) construct sparse collaboration graphs
   tailored to task complexity. The GoAgent paper achieves 93.84% average
   accuracy with ~17% token reduction vs SOTA. (Source: D11a serendipity; C-088
   corrected. Confidence: LOW — speculative extrapolation.)

7. **Anthropic's alignment auditing agents reach 88% discrimination accuracy
   with parallel aggregation.** [24] Running the auditor multiple times and
   aggregating results raises detection from 13% to 42%. Directly applicable to
   the audit-agent-quality skill. (Source: D12a Finding 14.)

8. **track-agent-invocation.js records general-purpose as an agent name.** [13]
   Multiple JSONL entries show "agent":"general-purpose" for unnamed Task tool
   invocations. The compliance checker and audit skill treat this as a valid
   agent, but it provides no quality signal. This also means zero recorded
   invocations ≠ zero actual invocations for agents invoked manually — the
   tracking system under-records habitual manual invocations.

9. **Runtime global agents at ~/.claude/agents/ lack model fields entirely.**
   [from V1] All 12 runtime GSD agents (gsd-\* at ~/.claude/agents/) have NO
   `model:` field. The fix applied to .claude/agents/global/ did not propagate
   to the runtime path. This is a broader gap than initially characterized.

10. **REFERENCE.md grew from ~950 to 1405 lines in a single session (v1.4,
    2026-03-29).** [from V2] Sections 21-22 were added, expanding dispute
    resolution, gap pursuit, and re-synthesis templates. The template size
    claims in original research (17 lines, 15 lines, 29 lines) reflect pre-v1.4
    state; current templates are larger. Phase 2.5 still has no template.

11. **App Check disabled across ALL Cloud Functions — doc-vs-runtime gap.**
    [GV1] CLAUDE.md Section 2 states "App Check Required" but GV1 filesystem
    verification found `requireAppCheck: false` with identical "TEMPORARILY
    DISABLED" comments in every Cloud Function. This is a security architecture
    gap not visible from documentation alone.

12. **Per-agent team initialization costs 20K-85K tokens.** [G4] This overhead
    exceeds the task cost for any workload under ~10K tokens, making team
    spawning cost-inefficient for small tasks. The idle notification flood is
    lead-side (processing notifications), not teammate-side (generating output)
    — a correction of how prior research framed this.

---

## Challenges

_This section summarizes findings from Phase 3 contrarian and OTB challenges
(CH1-CH4) and their adoption status after dispute resolution (DR1)._

### Adopted Challenges (incorporated into recommendations above)

| Challenge                                                                            | Source                     | Adopted As                                                            |
| ------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------- |
| CLAUDE.md IS inherited — reframe from "security absence" to "context incompleteness" | CH1 Challenge 7 + V1 C-001 | Executive Summary, Theme 1.1, Theme 4.3 updated                       |
| 60-day redirect stubs before deletion                                                | CH1 Challenge 1            | R5 and P0.4 cross-reference audit prerequisite                        |
| Cross-reference audit before 9-agent removal                                         | CH4 BS5                    | P0.4 added as mandatory prerequisite                                  |
| `sonash-context` shared skill before new agents                                      | CH3 Alt 1                  | Theme 4.4, P0.2, all new agent recommendations                        |
| Hooks as primary enforcement layer                                                   | CH3 Alt 3                  | P0.5, R1 reframed as "specificity injection not security enforcement" |
| "Wait" technique as universal quality enhancer                                       | CH3 Alt 6                  | R6                                                                    |
| Validation infrastructure before agents (pilot-first)                                | CH4 BS2                    | P0 section, R2 pilot note                                             |
| Define success metrics before starting                                               | CH4 BS9                    | P0.1                                                                  |
| Salvagente Rule ceiling — 30% max serendipitous seeds                                | CH2 Challenge 6            | Noted in pipeline agent design guidance                               |
| PR review team RECOMMEND AGAINST (not DEFERRED)                                      | V2 C-086                   | Theme 8.4, Contradictions table                                       |
| Pattern-promotion agent REJECTED                                                     | D5                         | Theme 9.4, R17 removed                                                |
| convergence-loop-verifier downgraded to P3                                           | D5                         | Theme 9.3, R18                                                        |
| Downgrade FIRE/iMAD/DRAGged confidence for codebase                                  | BS1, CH2 Challenge 4-5     | Themes 5.6, 6.4, 6.5 confidence notes                                 |
| security-auditor model correction                                                    | GV1 + G1                   | Theme 7.2, R8 — use `model: opus` not `effort: max`                   |
| C-003 case-insensitivity downgraded                                                  | CL1                        | Theme 1.3, Contradictions table                                       |

### Challenges NOT Adopted (reasons documented)

| Challenge                                                    | Source          | Reason Not Adopted                                                                                                                                                               |
| ------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archive was right — adversarial roles are convergence passes | CH2 Challenge 1 | D2 dispute resolution: Phase 2.5 has NO template (T1 evidence); structural enforcement requirements (structured returns, artifact discipline) are not solvable by inline prompts |
| Don't create custom agents for any pipeline role (too many)  | CH2 Challenge 3 | D5: 6 pipeline agents is a closed set with structural justification for each; archive was wrong about Phase 2.5 (no template is a gap, not a design choice)                      |
| Consolidation direction is wrong (specify, don't delete)     | CH1 Challenge 2 | D6: Deletion direction is correct; redirect stubs are the compromise; classification as orphan-or-stub with T1 evidence is sufficient for deletion authorization                 |
| Per-commit frontmatter validation hook (R7) is P1            | Original R7     | D4: Per-commit fires on 0.1% of commits; 30-day audit cadence is higher-ROI; moved to P2/audit integration                                                                       |
| Heterogeneous model research (Opus orchestration)            | CH4 BS1         | Methodological concern noted; does not invalidate T1 filesystem findings; external quantified claims (percentages) flagged as MEDIUM confidence                                  |
| D8 effort:max migration as written                           | GV1 + G1        | Starting state wrong (model: sonnet not opus); `effort: max` on Sonnet returns API error; replace with direct `model: opus` upgrade                                              |

---

## Sources

### Tier 1 — Official Documentation and Reference Quality

| #    | Source                                                                                                                        | Type                                               | Trust       | CRAAP | Date       |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------- | ----- | ---------- |
| [1]  | `.claude/skills/deep-research/REFERENCE.md` + official plugin-dev SKILL.md — agent frontmatter schema (16 fields)             | Official project + official docs                   | HIGH        | 5.0   | 2026-03-29 |
| [2]  | `.claude/agents/global/deep-research-searcher.md` + D1b format-docs findings                                                  | Official project files + official Claude Code docs | HIGH        | 5.0   | 2026-03-29 |
| [3]  | `.research/custom-agents/findings/D3a-local-agents-inventory.md` — 26-agent inventory with tier scores                        | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [4]  | arXiv:2511.11306v1 — iMAD: Intelligent Multi-Agent Debate                                                                     | Academic, peer-reviewed                            | HIGH        | 5.0   | Nov 2025   |
| [5]  | arXiv:2512.08296v1 — Towards a Science of Scaling Agent Systems (Google/MIT)                                                  | Academic, peer-reviewed                            | HIGH        | 4.8   | Dec 2025   |
| [6]  | `.research/custom-agents/findings/D7a-stub-elevation.md` — per-agent decision table                                           | Ground truth + codebase analysis                   | HIGH        | 5.0   | 2026-03-29 |
| [7]  | `.research/custom-agents/findings/D8a-adversarial-patterns-web.md` — steel-man, pre-mortem, Free-MAD                          | External research synthesis                        | HIGH        | 4.5   | 2026-03-29 |
| [8]  | `.research/custom-agents/findings/D6a-system-overrides-current.md + D6b-system-agent-catalog.md` — 5 agents needing overrides | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [9]  | `.research/custom-agents/findings/D6c-override-gap-synthesis.md` — override template specification                            | Ground truth + synthesis                           | HIGH        | 5.0   | 2026-03-29 |
| [10] | `.research/custom-agents/findings/D10c-netnew-internal.md` — 10 gap spec outlines                                             | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [11] | `.research/custom-agents/findings/D9b-pipeline-agents-internal.md` — pipeline role analysis                                   | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [12] | `.research/custom-agents/findings/D7b-redundancy-analysis.md + D7c-consolidation-synthesis.md` — canonical action table       | Ground truth + synthesis                           | HIGH        | 5.0   | 2026-03-29 |
| [13] | `.research/custom-agents/findings/D12b-quality-internal.md` — audit infrastructure analysis                                   | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [14] | `.research/custom-agents/findings/D9b-pipeline-agents-internal.md` — phase comparisons                                        | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [15] | `.research/custom-agents/findings/D9a-pipeline-agents-web.md` — FIRE, DRAGged, verdict taxonomy                               | External research synthesis                        | HIGH        | 4.5   | 2026-03-29 |
| [16] | `.research/custom-agents/findings/D8b-adversarial-internal.md` — 4 adversarial agent specs                                    | Ground truth + design analysis                     | HIGH        | 5.0   | 2026-03-29 |
| [17] | `.research/custom-agents/findings/D4a-model-selection-web.md` — model pricing, tiering                                        | External research + official pricing               | HIGH        | 4.5   | 2026-03-29 |
| [18] | `.research/custom-agents/findings/D4b-model-selection-docs.md` — effort field, built-in models                                | Official Claude Code docs                          | HIGH        | 5.0   | 2026-03-29 |
| [19] | `.research/custom-agents/findings/D11a-teams-web.md` — team archetypes, cost data                                             | External research (15 sources)                     | HIGH        | 4.6   | 2026-03-29 |
| [20] | `.research/custom-agents/findings/D11b-teams-internal.md` — team configuration analysis                                       | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [21] | firebase.google.com/docs/ai-assistance/agent-skills — Firebase official agent skills                                          | Official Firebase/Google docs                      | HIGH        | 5.0   | 2026-02    |
| [22] | `.research/custom-agents/findings/D10b-netnew-community.md` — community agent patterns                                        | Web research synthesis                             | MEDIUM-HIGH | 4.2   | 2026-03-29 |
| [23] | `.research/custom-agents/findings/D5a-workflow-gaps-skills.md` — convergence-loop verifier gap                                | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |
| [24] | `.research/custom-agents/findings/D12a-quality-validation-web.md` — Agent-Pex, Swiss Cheese, ADK criteria                     | External research (Tier 1 sources)                 | HIGH        | 4.8   | 2026-03-29 |
| [25] | `.research/custom-agents/findings/D12b-quality-internal.md` — audit skill TDMS gap                                            | Ground truth filesystem read                       | HIGH        | 5.0   | 2026-03-29 |

### Tier 2 — Academic Research and Community Collections

| #    | Source                                                                                           | Type                        | Trust       | CRAAP | Date      |
| ---- | ------------------------------------------------------------------------------------------------ | --------------------------- | ----------- | ----- | --------- |
| [26] | arXiv:2503.13657 — MAST: Multi-Agent System failure Taxonomy (UC Berkeley)                       | Academic, peer-reviewed     | HIGH        | 5.0   | Mar 2025  |
| [27] | arXiv:2602.13855 — AAR: Claim-Level Auditability for Deep Research Agents                        | Academic, peer-reviewed     | HIGH        | 4.5   | 2026      |
| [28] | arXiv:2411.00784 — FIRE: Fact-checking with Iterative Retrieval (NAACL 2025)                     | Academic, peer-reviewed     | HIGH        | 4.6   | 2025      |
| [29] | arxiv.org/html/2512.20491v1 — Step-DeepResearch Technical Report                                 | Technical report            | HIGH        | 4.3   | 2024      |
| [30] | arXiv:2506.08500 — DRAGged: Detecting and Addressing Conflicting Sources                         | Academic, peer-reviewed     | HIGH        | 4.4   | 2025      |
| [31] | arxiv.org/html/2602.06540 — AgentCPM-Report: Interleaving Drafting and Deepening                 | Academic, peer-reviewed     | HIGH        | 4.5   | 2026      |
| [32] | aclanthology.org/2025.findings-acl.606 — Voting or Consensus? ACL 2025                           | Academic, peer-reviewed     | HIGH        | 4.5   | 2025      |
| [33] | aclanthology.org/2025.findings-acl.1141 — CONSENSAGENT: Sycophancy Mitigation                    | Academic, peer-reviewed     | HIGH        | 4.3   | 2025      |
| [34] | VoltAgent/awesome-claude-code-subagents — community agent collection                             | Community collection        | MEDIUM-HIGH | 4.5   | 2025-2026 |
| [35] | anthropic.com/engineering/demystifying-evals-for-ai-agents — Eval best practices                 | Official Anthropic          | HIGH        | 5.0   | 2025      |
| [36] | microsoft.com/research/project/agent-pex — Agent-Pex specification testing                       | Microsoft Research          | HIGH        | 4.5   | 2025      |
| [37] | google.github.io/adk-docs/evaluate/criteria — ADK evaluation criteria                            | Official Google docs        | HIGH        | 4.8   | 2026      |
| [38] | alignment.anthropic.com/2025/automated-auditing — Alignment auditing agents                      | Official Anthropic research | HIGH        | 5.0   | 2025      |
| [39] | arxiv.org/html/2603.19677 — GoAgent: topology generation (methodology: CIB, not graph diffusion) | Academic, peer-reviewed     | HIGH        | 4.8   | Mar 2026  |

### Tier 3 — Verification and Challenge Sources (Phase 3-5)

| #    | Source                                                               | Type                             | Trust | Date       |
| ---- | -------------------------------------------------------------------- | -------------------------------- | ----- | ---------- |
| [40] | `.research/custom-agents/findings/V1-claims-1-50.md`                 | Verification pass 1 (codebase)   | HIGH  | 2026-03-29 |
| [41] | `.research/custom-agents/findings/V2-claims-51-100.md`               | Verification pass 2 (codebase)   | HIGH  | 2026-03-29 |
| [42] | `.research/custom-agents/findings/DR1-dispute-resolutions.md`        | Dispute resolution (10 disputes) | HIGH  | 2026-03-29 |
| [43] | `.research/custom-agents/challenges/CH1-contrarian-consolidation.md` | Contrarian challenge             | HIGH  | 2026-03-29 |
| [44] | `.research/custom-agents/challenges/CH2-contrarian-new-agents.md`    | Contrarian challenge             | HIGH  | 2026-03-29 |
| [45] | `.research/custom-agents/challenges/CH3-otb-alternatives.md`         | OTB challenge                    | HIGH  | 2026-03-29 |
| [46] | `.research/custom-agents/challenges/CH4-otb-blindspots.md`           | OTB meta-challenge               | HIGH  | 2026-03-29 |

### Tier 4 — Gap-Pursuit Sources (Phase 6 Amendment)

| #     | Source                                                                                                                     | Type                              | Trust | Date       |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----- | ---------- |
| [G1]  | `.research/custom-agents/findings/G1-effort-max-comparison.md` — effort:max Opus-exclusivity; Sonnet vs Opus quality delta | Official docs + benchmarks        | HIGH  | 2026-03-29 |
| [G2]  | `.research/custom-agents/findings/G2-firebase-skills-eval.md` — Firebase official skills evaluation; SoNash gap analysis   | Official docs + source inspection | HIGH  | 2026-03-29 |
| [G3]  | `.research/custom-agents/findings/G3-auto-delegation-deep.md` — auto-delegation root cause; failure modes; workarounds     | Official docs + community         | HIGH  | 2026-03-29 |
| [G4]  | `.research/custom-agents/findings/G4-teams-cost-quality.md` — teams cost/quality data; TeammateIdle; Anthropic C compiler  | Official docs + practitioners     | HIGH  | 2026-03-29 |
| [CL1] | `.research/custom-agents/findings/CL1-confidence-verification.md` — confidence upgrades/downgrades for 10 claims           | Official docs + academic papers   | HIGH  | 2026-03-29 |
| [GV1] | `.research/custom-agents/findings/GV1-gap-verification.md` — filesystem verification of G1, G2, G3 claims                  | Filesystem ground truth           | HIGH  | 2026-03-29 |
| [GV2] | `.research/custom-agents/findings/GV2-gap-verification.md` — filesystem verification of G4, CL1 claims                     | Filesystem ground truth           | HIGH  | 2026-03-29 |

---

## Methodology

**Research approach:** 29 searcher agents across 4 waves (L4 depth), followed by
verification (V1, V2), adversarial challenges (CH1-CH4), dispute resolution
(DR1), and a gap-pursuit amendment wave (G1-G4, CL1, GV1, GV2).

**Wave 1 — Foundation (7 agents, SQ1-SQ4):** Agent frontmatter schema,
orchestration patterns, local/global inventory, model selection.

**Wave 2 — Gap Analysis (8 agents, SQ5-SQ6):** Workflow gaps in
skills/hooks/pipelines, system/plugin override analysis.

**Wave 3 — Specific Design (10 agents, SQ7-SQ9):** Stub elevation decisions,
redundancy analysis, adversarial agent patterns, pipeline agent requirements.

**Wave 4 — Synthesis Research (4 agents, SQ10-SQ12):** Net-new agent candidates,
team composition analysis, quality validation methodology.

**Phase 3 — Adversarial Challenges:** CH1: Contrarian on
consolidation/infrastructure (10 challenges). CH2: Contrarian on new agents (9
challenges). CH3: OTB alternatives (8 pre-mortem alternatives). CH4: OTB
systemic blind spots (9 meta-challenges).

**Phase 5 — Dispute Resolution:** 10 disputes resolved using evidence-weight
arbitration. 5 corrections to original claims. 3 new recommendations added (P0
infrastructure steps, hook extension). 2 recommendations rejected
(pattern-promotion agent, per-commit frontmatter hook as P1).

**Phase 6 — Gap Pursuit and Amendment (v3.0):** G1: effort:max Opus-exclusivity
and Sonnet vs Opus quality comparison. G2: Firebase official agent skills
evaluation and SoNash gap analysis. G3: Auto-delegation root cause, failure
modes, and reliability architecture. G4: Agent teams cost-quality data,
communication overhead, TeammateIdle hook. CL1: Confidence verification for 10
LOW/MEDIUM claims (6 upgraded, 1 downgraded, 2 corrected). GV1: Filesystem
verification of G1, G2, G3 claims (6 VERIFIED, 3 MODIFIED, 1 REFUTED). GV2:
Filesystem verification of G4 and CL1 claims (4 CONFIRMED, 1 ABSENT, 3
MEDIUM/UNVERIFIABLE).

**Source profile distribution:**

- Codebase reads (ground truth): 18 of 29 original searcher agents + GV1 + GV2
- Web research: 11 of 29 original searcher agents + G1 + G2 + G3 + G4 + CL1
- Verification (codebase): 2 passes (V1, V2) + 2 gap verification passes (GV1,
  GV2)

**Key constraint applied in re-synthesis:** This project is operated by a solo
developer. All recommendations have been filtered through the solo-developer
feasibility lens (D7 dispute resolution). A hard ceiling of 30 total agents is
in effect.

**Verification correction summary (cumulative through v3.0):**

- REFUTED claims from V1+V2+GV1+GV2: 8 (C-001, C-007, C-048, C-086, C-091, C-017
  template sizes, C-009 line count, GV1-V4 security-auditor model assumption)
- MODIFIED claims from V1+V2+GV1+GV2: 19
- Disputes resolved: 10 (DR1) + 2 additional (G1/GV1 model correction, C-003
  downgrade)
- Claims confidence-upgraded in CL1: 6 (C-002, C-028, C-029, C-033, C-025,
  C-022)
- Claims confidence-downgraded in CL1: 1 (C-003)
