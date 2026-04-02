# W4c: Research & Discovery Standard -- Proposed Architecture

<!-- prettier-ignore-start -->
**Type:** Synthesis / Architecture Proposal
**Date:** 2026-03-24
**Author:** Claude Opus 4.6 (1M context)
**Status:** PROPOSAL -- feeds /deep-plan
**Source findings:** SQ1 through SQ10, SQ7a, SQ7b (11 findings files)
<!-- prettier-ignore-end -->

---

## 1. Standard Structure

The Research & Discovery Standard comprises **6 documents** organized in a
dependency hierarchy. Each document has a clear owner and audience.

### 1A. Document Inventory

| #   | Document                | Purpose                                                                                                                                                     | Audience                                   | Owner         |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------- |
| 1   | **RDS-PROTOCOL.md**     | The CANON protocol document. Defines the 4-tier model, unified confidence scale, shared vocabulary, and inter-system contracts. The "constitution" of R&D.  | All AI agents, all skills that do research | R&D Ecosystem |
| 2   | **RDS-ENFORCEMENT.md**  | Enforcement manifest. Maps every requirement to a gate tier (pre-commit, pre-push, behavioral, skill-internal) with severity levels.                        | Hook authors, skill maintainers            | R&D Ecosystem |
| 3   | **RDS-TIERS.md**        | Detailed tier definitions. Triggers, tools, agents/teams, verification, artifacts, time budgets, escalation/de-escalation criteria for each of the 4 tiers. | AI agents during tier selection            | R&D Ecosystem |
| 4   | **RDS-TOOLS.md**        | Tool selection guide. When to use which tool/MCP/agent for research. Consolidates SQ5's tool inventory into actionable decision rules.                      | AI agents during research execution        | R&D Ecosystem |
| 5   | **RDS-TEAMS.md**        | Team composition guide. When solo agent, when team, which composition. Agent selection rules per tier.                                                      | AI agents and skill orchestrators          | R&D Ecosystem |
| 6   | **RDS-VERIFICATION.md** | Verification protocol per tier. Maps SQ9's graduated model to each tier with concrete checklists.                                                           | AI agents during verification phases       | R&D Ecosystem |

### 1B. Rationale for This Structure

**Why 6 documents instead of 1?** [Source: SQ2 Pattern Family analysis, SQ8
consulting methodology analogy]

A single monolithic document would exceed 2000 lines and create token waste on
every load. The 6-document split follows the CLAUDE.md pattern: a core protocol
document (loaded always) plus reference docs (loaded on demand per Section 8).

**Why not fold into existing skills?** [Source: SQ10 Section 4]

Research & Discovery spans 4 skills (deep-research, deep-plan, convergence-loop,
CL-PROTOCOL) plus 14+ non-core skills that do research (SQ2). A standard that
lives inside one skill cannot govern the others. The standard must sit above
individual skills as an ecosystem-level protocol.

**Placement:**

- RDS-PROTOCOL.md: referenced in CLAUDE.md Section 8 (always-loadable)
- RDS-ENFORCEMENT.md: `.canon/ecosystems/research-discovery/enforcement.jsonl`
  (once CANON Phase 1 infrastructure exists)
- RDS-TIERS.md through RDS-VERIFICATION.md: `docs/agent_docs/` (on-demand
  reference, same pattern as AGENT_ORCHESTRATION.md)

---

## 2. Tier Definitions

### 2A. The Four-Tier Model

Four tiers emerged as the natural convergence point across multiple independent
domains: software incident response recommends four severity levels as "the
sweet spot" [SQ8 Source 24], consulting research uses three tiers that map to
our T1-T3 [SQ8 Section 4a], intelligence collection uses three disciplines that
map with the addition of a T0 automatic layer [SQ8 Section 4b], and the academic
deep research taxonomy identifies three complexity axes that produce four
natural groupings [SQ7b Finding 15].

The "Tier 0: Automatic" layer is this standard's unique contribution -- no
existing framework has a zero-cost tier that fires without conscious invocation.
It maps to the hook-based detection layer identified in SQ6.

### 2B. Tier 0: Automatic (Reflexive)

**Description:** Research that happens without the AI consciously deciding to
research. Embedded in hooks and behavioral rules. Zero additional cognitive
overhead.

| Attribute            | Value                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Triggers**         | Hook detects research-adjacent keywords (SQ6 Section 4.1 Phase 1); AI encounters technology beyond training cutoff (SQ6 Gap G2); AI reads files in unfamiliar directory subtree (SQ6 Gap G1) |
| **Tools**            | Inline Read/Grep/Glob only. No agent spawning. No web search.                                                                                                                                |
| **Agents/Teams**     | None -- orchestrator handles directly                                                                                                                                                        |
| **Verification**     | None formal. AI's existing fact-check heuristics apply.                                                                                                                                      |
| **Artifacts**        | None persisted. Findings are inline in conversation.                                                                                                                                         |
| **Time budget**      | < 2 minutes                                                                                                                                                                                  |
| **Model**            | Current session model (no model routing)                                                                                                                                                     |
| **Escalation to T1** | AI recognizes it cannot answer with inline tools; question has 2+ facets; user asks "are you sure?" or "where did you get that?"                                                             |

**Examples:**

- Checking `npm view zod version` before citing Zod API syntax
- Reading ROADMAP.md before proposing a new feature
- Searching episodic memory for prior context on a topic
- Verifying a file exists before asserting its contents

**Source rationale:** SQ6 Gap G1/G2 identify unfamiliar code and new domain
questions as undetected research-worthy situations. T0 catches these with
near-zero cost. SQ7a Pattern 1 confirms that research-before-action is universal
across all AI dev tools. SQ9 Finding 14 (Ralph Loop) validates
machine-verifiable checks as the foundation layer.

### 2C. Tier 1: Quick Investigation

**Description:** A focused lookup requiring 1-3 tools and producing a direct
answer. The AI recognizes a knowledge gap and fills it without formal research
infrastructure.

| Attribute               | Value                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Triggers**            | Single factual question about a technology or pattern; "how does X work in this project?"; API syntax question for bleeding-edge stack; user asks for a specific comparison (X vs Y for one dimension) |
| **Tools**               | Read, Grep, Glob, Bash (git log, npm), Context7 (library docs), WebSearch (single query), Episodic Memory (search for prior context)                                                                   |
| **Agents/Teams**        | Optional: Explore agent for unfamiliar codebase area. No teams.                                                                                                                                        |
| **Verification**        | Source existence check (did I find an authoritative source?). CRAAP score >= 3 on primary source. If answer comes from training data only, tag as `[UNVERIFIED]`.                                      |
| **Artifacts**           | None persisted. Answer is inline. If answer will be referenced later, note it in conversation.                                                                                                         |
| **Time budget**         | 5-15 minutes                                                                                                                                                                                           |
| **Model**               | Sonnet-class (current session model for most tasks)                                                                                                                                                    |
| **Escalation to T2**    | Initial lookup finds contradictions; question has 3+ facets; 2+ sources disagree; answer requires synthesis across multiple domains; user expresses this is for a decision                             |
| **De-escalation to T0** | Answer found immediately in codebase/docs with no ambiguity                                                                                                                                            |

**Examples:**

- "What's the Zod 4 syntax for discriminated unions?"
- "How does the rate limiter work in our Cloud Functions?"
- "Does Next.js 16 support server actions in route handlers?"
- "What did we decide about auth token refresh in the last session?"

**Source rationale:** SQ6 Section 5 Tier 1 defines quick lookup signals. SQ8
Section 4a maps to "desk research" (analyze existing data). SQ5 Gap GAP-4
identifies Context7 as underused for library doc lookups -- T1 is where it
becomes standard. SQ1 Section 1.6 identifies deep-plan's binary confidence as
the simplest model -- T1 uses this: either you found a source or you didn't.

### 2D. Tier 2: Focused Research

**Description:** A structured investigation requiring multiple sources,
comparison of approaches, or synthesis. Uses the deep-research infrastructure
but at reduced scale (1-3 sub-questions, 2-4 searcher agents).

| Attribute               | Value                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Triggers**            | "What are the options for X?"; "Compare X vs Y"; "Best practice for X in our stack"; security design for new feature (SQ6 Gap G4); first integration with unfamiliar external service (SQ6 Gap G7); question with 2-4 sub-dimensions |
| **Tools**               | All T1 tools plus: WebFetch (targeted page extraction), SonarCloud MCP (code quality baseline), health checker scripts (quantitative baseline), Sequential Thinking MCP (structured decomposition)                                   |
| **Agents/Teams**        | 2-4 searcher agents (parallel). 1 synthesizer. Optional: Explore agent for codebase component. No contrarian pass required. No teams.                                                                                                |
| **Verification**        | Standard verification (SQ9 Tier 1): CRAAP scoring on all sources, SIFT lateral reading on key claims, 2+ independent sources for primary findings, contradiction detection (surface, do not resolve silently)                        |
| **Artifacts**           | `.research/<topic-slug>/` directory with: RESEARCH_OUTPUT.md (abbreviated), claims.jsonl, sources.jsonl, metadata.json. Findings files gitignored.                                                                                   |
| **Time budget**         | 30-90 minutes                                                                                                                                                                                                                        |
| **Model**               | Sonnet for searchers, Sonnet for synthesizer                                                                                                                                                                                         |
| **Escalation to T3**    | 2+ sources directly contradict; topic has 5+ sub-dimensions; findings will drive multi-session implementation; domain is novel with sparse sources; user flags as high-stakes                                                        |
| **De-escalation to T1** | All sub-questions answered by single authoritative source; no contradictions found                                                                                                                                                   |

**Examples:**

- "Compare Zod vs Valibot for our validation layer"
- "Best practice for Firebase auth token refresh in Next.js 16"
- "What are the options for server-side caching in our stack?"
- "Design the auth flow for the new admin panel" (security + design)

**Source rationale:** SQ8 Section 4a maps to "targeted primary research." SQ1
Section 2.2 documents deep-research's agent allocation formula -- T2 uses the
lower end (D=2-3, producing 5-6 agents). SQ5 Gap GAP-3 identifies Sequential
Thinking as underused for decomposition -- T2 is where it enters the standard.
SQ7b Finding 12 (Anthropic's multi-agent system) confirms 90% improvement over
single-agent, justifying multi-agent even at T2. SQ7b Finding 13 (DeepMind 17x
error trap) caps parallel agents at 4 for T2 to stay within safe coordination
bounds.

### 2E. Tier 3: Full Research Campaign

**Description:** The full deep-research pipeline. Structured methodology,
multiple perspectives, convergence-verified findings. Used for complex domains,
strategic decisions, or novel territory.

| Attribute               | Value                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Triggers**            | Multi-phase project starting (SQ6 Gap G5); domain unfamiliarity flagged by user; architecture decision ("should we migrate X to Y?"); 5+ sub-questions identified; previous T2 research escalated due to contradictions; `/deep-research` explicitly invoked                                                                |
| **Tools**               | All T2 tools plus: Gemini CLI (cross-model verification), Playwright/Chrome (documentation capture), source-reputation.jsonl (cross-session source tracking), strategy-log.jsonl (strategy persistence)                                                                                                                     |
| **Agents/Teams**        | Full deep-research allocation: D + 3 + floor(D/5) searchers (SQ1 Section 2.2). 1 synthesizer. 1-3 contrarian agents (depth-scaled). 1-3 OTB agents (depth-scaled). research-plan-team when feeding into deep-plan (SQ4 Section 2). Total: 8-17+ agents.                                                                     |
| **Verification**        | Enhanced verification (SQ9 Tier 2): All standard verification plus adversarial disconfirmation (actively search for counter-evidence), cross-model verification (Gemini CLI), convergence-loop with research-claims preset (6 behaviors), source trace to origin (SIFT step 4), confidence calibration (behavioral signals) |
| **Artifacts**           | Full `.research/<topic-slug>/` directory: RESEARCH_OUTPUT.md (complete), claims.jsonl, sources.jsonl, metadata.json, findings/\*.md, challenges/CONTRARIAN.md, challenges/OUTSIDE_THE_BOX.md. Plus cross-session registries: research-index.jsonl, strategy-log.jsonl, source-reputation.jsonl.                             |
| **Time budget**         | 2-6 hours                                                                                                                                                                                                                                                                                                                   |
| **Model**               | Sonnet for searchers, Opus for contrarian/OTB, Opus for planner in research-plan-team                                                                                                                                                                                                                                       |
| **No escalation**       | T3 is the maximum tier for this standard. If T3 is insufficient, the finding is: "this question cannot be answered with available tools and requires human expert consultation."                                                                                                                                            |
| **De-escalation to T2** | After Phase 0 classification, all sub-questions turn out to be well-covered by existing sources with no contradictions                                                                                                                                                                                                      |

**Examples:**

- "Should we migrate from Firestore to Postgres?"
- "Design the real-time analytics architecture for SoNash"
- "What's the state of the art for privacy-preserving health journaling?"
- Research preceding a multi-session feature build

**Source rationale:** SQ1 Section 2 documents the full deep-research pipeline in
detail. SQ7a Pattern 2 confirms multi-layer context assembly. SQ7b Findings 1-5
provide the orchestrator-worker pattern, planner-executor-synthesizer pipeline,
explicit effort tiers, detailed task descriptions, and max 4 parallel agents per
wave -- all implemented in T3's deep-research architecture. SQ8 maps to "field
research" (high cost, deep, narrow). SQ9 Finding 18 recommends the graduated
verification model that T3 implements.

---

## 3. Unified Confidence Scale

### 3A. The Problem

SQ1 Section 5.3 identifies incompatible confidence systems:

- **deep-plan Phase 0:** Binary (verified / `[UNVERIFIED]`)
- **deep-research:** 4-level source-based (HIGH / MEDIUM / LOW / UNVERIFIED)
- **CL-PROTOCOL:** 3-level evidence-based (HIGH / MEDIUM / LOW)
- **convergence-loop:** 3-level process-based (HIGH / MEDIUM / LOW)

These cannot interoperate. A claim rated HIGH by convergence-loop (0 corrections
in 2 passes) may be rated MEDIUM by deep-research (only 1 authoritative source).

### 3B. Proposed Unified Scale: 4-Level with Dual Basis

The unified scale uses deep-research's 4-level system as the foundation (it is
the most mature per SQ1 Section 2.6) but adds a **basis annotation** to
distinguish how confidence was determined.

| Level          | Definition                                                                                                                              | Assignment Rules                                                                                                                 | Basis Tag                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **HIGH**       | Multiple independent sources agree, or authoritative source directly confirms, AND no contradicting evidence found in adversarial check | 2+ independent sources agree + CRAAP avg >= 4 on primary source + adversarial disconfirmation attempted with no counter-evidence | `[source]`, `[process]`, or `[code]` |
| **MEDIUM**     | At least one verified source supports the claim, but coverage is incomplete or minor contradictions exist                               | 1 authoritative source OR 2+ community sources agree. Contradictions exist but are surfaced.                                     | `[source]`, `[process]`, or `[code]` |
| **LOW**        | Claim is plausible but based on limited evidence, a single unverified source, or training data with partial corroboration               | Single blog post, forum answer, or partial match in codebase. No contradicting evidence found but search was not exhaustive.     | `[source]`, `[process]`, or `[code]` |
| **UNVERIFIED** | Claim comes from AI training data only, or source could not be located, or claim has not been checked against any external evidence     | No external source found. Training data assertion only. Must be tagged `[UNVERIFIED]` in all outputs.                            | `[training]`                         |

### 3C. Basis Tags

| Tag          | Meaning                                                                        | Used By                                  |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `[source]`   | Confidence derived from source quality and cross-referencing                   | deep-research, T1/T2/T3 findings         |
| `[process]`  | Confidence derived from convergence-loop pass outcomes                         | convergence-loop, CL-PROTOCOL            |
| `[code]`     | Confidence derived from code evidence (line numbers, test results, grep proof) | CL-PROTOCOL, code-reviewer, skill-audit  |
| `[training]` | Based on AI training data only -- automatically UNVERIFIED                     | Any system when no external source found |

### 3D. Mapping Existing Systems to the Unified Scale

| System                | Current Scale                                                                      | Mapping to Unified Scale                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **deep-plan Phase 0** | verified / `[UNVERIFIED]`                                                          | verified = MEDIUM `[code]` minimum (has verify command); `[UNVERIFIED]` = UNVERIFIED `[training]`                                                                            |
| **deep-research**     | HIGH / MEDIUM / LOW / UNVERIFIED                                                   | Direct mapping. Add `[source]` basis tag.                                                                                                                                    |
| **CL-PROTOCOL**       | HIGH / MEDIUM / LOW (findings); CONFIRMED / WEAKENED / FALSE-POSITIVE (contrarian) | Direct mapping for findings with `[code]` basis. Contrarian ratings are NOT confidence levels -- they are status transitions on existing findings.                           |
| **convergence-loop**  | HIGH / MEDIUM / LOW (output)                                                       | Direct mapping. Add `[process]` basis tag. T20 tallies (Confirmed/Corrected/Extended/New) remain as the tracking mechanism; the output confidence maps to the unified scale. |

### 3E. Cross-System Handoff Rules

When a claim passes between systems (e.g., deep-research finding fed into
deep-plan), its confidence is the **minimum** of the source and destination
assessments. A claim cannot gain confidence by moving between systems -- only by
additional verification.

**Rationale:** SQ9 Finding 11 (triangulation) establishes that convergent
evidence from different methods increases confidence. The minimum rule prevents
inflation while still allowing upgrade through additional verification.

---

## 4. Natural Invocation Design

### 4A. The Three-Layer Detection Model

SQ6 establishes that research detection needs three complementary layers: hooks
(catch what the AI forgets), behavioral rules (cover nuance), and skill
internals (enforce process). The standard formalizes this into a detection
pipeline.

```
USER PROMPT
     |
     v
[LAYER 1: Hook Detection]          -- user-prompt-handler.js
  Keyword/phrase matching            -- Fires on every prompt
  Compound signal detection          -- Multi-signal thresholds
  Output: stderr hint OR stdout      -- Anti-fatigue: compound signals only
  directive
     |
     v
[LAYER 2: Behavioral Rules]        -- CLAUDE.md Section 7 + RDS-PROTOCOL
  AI recognizes knowledge gaps       -- Context-dependent judgment
  AI detects contradictions          -- Cannot be automated via hooks
  AI identifies unfamiliar territory -- Session-state awareness
  Output: AI decides to invoke       -- AI self-directs to appropriate tier
  appropriate tier
     |
     v
[LAYER 3: Skill Internals]         -- deep-research, deep-plan, etc.
  Phase gates enforce process        -- Cannot be skipped
  Quality gates block progression    -- Mandatory verification points
  Output: Enforced research quality  -- Process compliance
```

### 4B. Layer 1: Hook Enhancements

**New additions to `user-prompt-handler.js`** (SQ6 Section 4.3):

**Phase 1 (low risk, high value):** Add research keyword detection as Priority
5.5 between Planning and Exploration:

- Trigger words: "research", "investigate", "what are the options", "compare
  approaches", "best practice for", "recommended way to"
- Output: `suggestStderr("Consider /deep-research for domain investigation")`
- Anti-fatigue: once per topic per session (dedup by topic slug)

**Phase 2 (medium risk):** Enhance plan-mode suggestion to detect
research-before-plan need:

- When the multi-step banner fires, check if topic involves technology beyond
  training cutoff (cross-ref CLAUDE.md Section 1 Stack Versions table)
- If so, add: "Consider /deep-research before /deep-plan for this topic"

**Phase 3 (higher complexity):** Add exploration-to-research escalation in
`post-read-handler.js`:

- Track directory subtrees being read for the first time in session
- After 5+ files in a new subtree + modification intent, suggest: "You're
  exploring an unfamiliar area. Consider Explore agent or /deep-research."

### 4C. Layer 2: CLAUDE.md Additions

**New guardrail for Section 4** (behavioral, no automated enforcement):

> **15. Research before implementation in unfamiliar territory.** Before
> modifying code in a subsystem not previously read this session, or
> implementing features involving technology beyond training cutoff, assess
> whether research is needed. Use the tier model from RDS-PROTOCOL.md: T0 for
> inline checks, T1 for quick lookups, T2 for focused research, T3 for full
> campaigns. Do not skip research to save time -- wrong assumptions cost more
> than research.

**New entry in Section 7 PRE-TASK triggers:**

| Trigger                           | Action                                                                    | Tool           |
| --------------------------------- | ------------------------------------------------------------------------- | -------------- |
| Domain/technology research needed | Assess tier (T0-T3) per RDS-PROTOCOL.md, then invoke appropriate workflow | Varies by tier |

**New entry in Section 8 Reference Docs:**

| Document                                                           | Purpose                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [docs/agent_docs/RDS-PROTOCOL.md](docs/agent_docs/RDS-PROTOCOL.md) | Research & Discovery Standard: tier model, confidence scale, vocabulary |

### 4D. Layer 3: Skill Internal Enforcement

Skills that do research already have internal enforcement (SQ1 documents 43
quality gates across 4 systems). The standard adds:

1. **Tier declaration at skill entry:** Every skill that does research must
   declare its operating tier in its frontmatter or Phase 0. This makes the tier
   selection explicit and auditable.

2. **Escalation protocol:** If a skill encounters conditions that exceed its
   tier (e.g., T1 finds contradictions), it must surface the escalation
   recommendation to the user, not silently upgrade.

3. **De-escalation protocol:** If T2/T3 research discovers the question is
   simpler than expected, the skill may simplify its process but must note the
   de-escalation in its output artifacts.

### 4E. Anti-Fatigue Design

SQ6 Section 4.1 identifies alert fatigue risk. The standard addresses this:

1. **Compound signal thresholds:** No single keyword triggers research
   suggestions. Require 2+ signals converging (e.g., technology keyword +
   version mention + "how to").

2. **Session-level dedup:** Each research suggestion fires once per topic per
   session. Tracked in `.context-tracking-state.json`.

3. **Tiered output strength:** T0/T1 suggestions use stderr (hints). T2/T3
   suggestions use stdout (directives) only when compound signals are strong.

4. **User sensitivity control:** A `researchSensitivity` setting
   (low/medium/high) in agent trigger state. Low = only stdout directives.
   Medium = stdout + T2 stderr hints. High = all suggestions.

---

## 5. Agent/Team Selection Rules

### 5A. The Selection Decision Tree

Based on SQ3 (agent inventory), SQ4 (team inventory), SQ7b Finding 13 (DeepMind
4-agent saturation threshold), and SQ7b Finding 12 (Anthropic 90% improvement
with multi-agent):

```
Research task identified
     |
     v
How many sub-questions / dimensions?
     |
     +-- 0-1: Solo (T0/T1)
     |         No agent spawning. Orchestrator handles directly.
     |
     +-- 2-4: Parallel subagents (T2)
     |         2-4 searcher agents + 1 synthesizer
     |         Max 4 concurrent (DeepMind threshold)
     |         Sonnet for all agents
     |
     +-- 5+: Full agent complement (T3)
     |         D + 3 + floor(D/5) searchers
     |         1 synthesizer + 1-3 contrarian + 1-3 OTB
     |         Waves of max 4 concurrent
     |         Sonnet for searchers, Opus for contrarian/OTB
     |
     v
Does research feed into planning?
     |
     +-- No: Subagents only (default)
     |
     +-- Yes, and complexity is L/XL:
               Spawn research-plan-team (3 members)
               researcher (sonnet) + planner (opus) + verifier (sonnet)
               [SQ4 Section 1B]
```

### 5B. Team Spawn Rules (Inverted Default)

SQ4 Section 6 identifies that teams are never spawned because the decision
defaults to solo/subagent. The standard inverts this per SQ4 Recommendation R1:

**For documented triggers, spawn the team UNLESS one of these exceptions
applies:**

| Team                                  | Default Trigger                                                             | Exceptions (do NOT spawn)                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **research-plan-team**                | `/deep-research` followed by `/deep-plan` on same topic, OR complexity L/XL | Research has <= 2 sub-questions; plan is for a well-understood topic; user says "quick plan"               |
| **audit-review-team**                 | `/skill-audit` with 3+ targets, OR `/audit-comprehensive`                   | Single-skill audit; quick spot-check on 1-2 items; security-specific audit (use security-auditor directly) |
| **development-team** (needs creation) | Multi-file feature (3+ files) per CLAUDE.md Section 7                       | Trivial changes across files (e.g., rename); user says "just do it"                                        |

### 5C. Agent Selection by Research Context

| Research Context           | Primary Agent                      | Secondary Agents                                 | Rationale                                                        |
| -------------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Codebase exploration       | `explore`                          | None                                             | Read-only, structured return protocol [SQ3 Section 1A]           |
| Security research          | `security-auditor`                 | `penetration-tester` (if adversarial needed)     | SoNash-customized, well-integrated [SQ3 Section 6]               |
| Code quality investigation | `code-reviewer`                    | None                                             | Episodic memory pre-search built in [SQ2 Section 3]              |
| External documentation     | `deep-research-searcher`           | None                                             | Only agent with WebSearch + WebFetch + Context7 [SQ3 Section 1B] |
| Performance investigation  | `performance-engineer`             | `react-performance-optimization` (frontend only) | Opus model for deep analysis [SQ3 Section 2]                     |
| Root cause investigation   | `debugger`                         | None (deliberate single-investigator)            | Scientific method requires hypothesis discipline [SQ2 Section 5] |
| Multi-domain research      | Parallel domain-specific searchers | `deep-research-synthesizer` for combination      | Fan-out/gather pattern [SQ7a Pattern 3]                          |

### 5D. Human-in-the-Loop Rules

Based on SQ7b's Deloitte autonomy spectrum and SQ9's verification framework:

| Situation                                     | Human Involvement                                                                                       | Rationale                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| T0 automatic checks                           | None                                                                                                    | Zero-cost, always runs                                                                                                            |
| T1 quick lookup                               | None, unless answer is UNVERIFIED                                                                       | Low stakes, fast                                                                                                                  |
| T2 focused research                           | Approval of research plan (sub-questions + agent allocation) before execution                           | Medium stakes, moderate cost                                                                                                      |
| T3 full campaign                              | Approval of plan + mid-research checkpoint (after Phase 1) + approval of findings before downstream use | High stakes, high cost. SQ7b Finding 12: "developers integrate AI into 60% of work while maintaining active oversight on 80-100%" |
| Any research feeding a security decision      | Mandatory human review of findings                                                                      | Security decisions are irreversible [CLAUDE.md Section 2]                                                                         |
| Any research feeding an architecture decision | Mandatory human review of findings                                                                      | Architecture decisions have long-term consequences                                                                                |

---

## 6. Verification Protocol Per Tier

### 6A. Graduated Verification Model

Synthesized from SQ9's findings, mapped to the 4-tier model. Each tier includes
all verification from lower tiers.

### Tier 0: Automatic Verification

| Check            | Method                                         | Pass Criteria                                                    | Failure Action                                 |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| Source existence | Did I find any external source?                | Source URL or file path exists                                   | Tag claim as `[UNVERIFIED]`                    |
| Recency check    | Is the source within domain recency threshold? | Source date within 2 years (technology) or 5 years (methodology) | Flag as potentially outdated, search for newer |
| Self-consistency | Does the claim remain stable if rephrased?     | Same conclusion across 2 formulations                            | Flag as unstable, escalate to T1               |

**Gate type:** Automatic, no iteration. Pass/fail. **Source:** SQ9 Finding 18
Tier 0.

### Tier 1: Standard Verification

| Check                   | Method                                                                       | Pass Criteria                                    | Failure Action                                                               |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| All T0 checks           | (inherited)                                                                  | (inherited)                                      | (inherited)                                                                  |
| CRAAP scoring           | Score source on Currency, Relevance, Authority, Accuracy, Purpose (1-5 each) | Average >= 3.0                                   | Search for better source or downgrade confidence                             |
| SIFT lateral reading    | Stop, Investigate source, Find better coverage, Trace to origin              | No red flags from lateral check                  | Downgrade confidence, note concern                                           |
| Cross-reference         | Check 2+ independent sources                                                 | 2+ sources agree on core claim                   | Downgrade to LOW if only 1 source, surface contradiction if sources disagree |
| Contradiction detection | Surface any disagreements between sources                                    | Contradictions documented, not silently resolved | Present contradictions to user with evidence from both sides                 |

**Gate type:** Single iteration with human review of contradictions.
**Convergence:** Passes when CRAAP >= 3 and 2+ sources agree. Max 1 refinement
cycle (search for better sources). **Source:** SQ9 Findings 9-11.

### Tier 2: Enhanced Verification

| Check                       | Method                                                                                                                  | Pass Criteria                                                                             | Failure Action                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| All T1 checks               | (inherited)                                                                                                             | (inherited)                                                                               | (inherited)                                                |
| Adversarial disconfirmation | Search for counter-evidence using neutralized queries (SQ9 DREAM framework)                                             | No compelling counter-evidence found, OR counter-evidence is from lower-authority sources | Downgrade confidence, present counter-evidence to user     |
| Cross-model verification    | Verify key claims with a different LLM (Gemini CLI) or different agent                                                  | Models agree on core claims                                                               | Surface disagreements as findings; do not silently resolve |
| Source trace to origin      | For each key claim, trace upstream to the original source (not a summary or repost)                                     | Original source located and confirms claim                                                | Downgrade confidence if only secondary sources found       |
| Confidence calibration      | Assess based on behavioral signals: consistency across reformulations, grounding in evidence, convergence across passes | Confidence level matches behavioral evidence                                              | Adjust confidence level to match behavioral signals        |

**Gate type:** Iterative (Evaluator-Optimizer pattern). Max 3 refinement cycles.
**Convergence:** Passes when adversarial search finds no contradicting evidence
AND cross-model verification agrees. **Source:** SQ9 Findings 2-4, 13, 16.

### Tier 3: Critical Audit Verification

| Check                                     | Method                                                                                                         | Pass Criteria                                                | Failure Action                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| All T2 checks                             | (inherited)                                                                                                    | (inherited)                                                  | (inherited)                                                                                    |
| Convergence-loop (research-claims preset) | 6-behavior multi-pass: source-check, discovery, verification, fresh-eyes, write-then-verify, fix-and-re-verify | Per-claim graduated convergence (2+ consecutive "Confirmed") | Claims that do not converge are tagged with their convergence status                           |
| Confidence distribution check             | Not >80% HIGH or >80% LOW in findings                                                                          | Distribution is balanced                                     | Investigate why distribution is skewed -- may indicate confirmation bias or insufficient depth |
| Source diversity check                    | >= 2 source tiers, >= 3 distinct authors                                                                       | Diversity criteria met                                       | Search for additional source types/authors                                                     |
| Self-audit checklist                      | 6-item self-audit per deep-research REFERENCE.md L430-439                                                      | All items pass                                               | Fix failing items before declaring complete                                                    |
| DREAM multi-dimensional assessment        | Factuality + Citation Integrity + Domain Authoritativeness + Writing Quality                                   | All dimensions acceptable                                    | Revise findings on failing dimensions                                                          |

**Gate type:** Multi-round Delphi-style. Max 5 rounds (convergence-loop hard
cap). **Convergence:** All claims reach graduated convergence or are explicitly
marked as non-convergent with documented disagreements. **Source:** SQ9 Findings
13-16, SQ1 Section 2.3.

### 6B. Tier-Verification Mapping Summary

| Tier | Checks      | Gate Type           | Max Iterations | Human Gate?             |
| ---- | ----------- | ------------------- | -------------- | ----------------------- |
| T0   | 3 automatic | Pass/fail           | 0              | No                      |
| T1   | 7 (3 + 4)   | Single iteration    | 1 refinement   | Only for contradictions |
| T2   | 11 (7 + 4)  | Evaluator-Optimizer | 3 refinements  | Approval of findings    |
| T3   | 17 (11 + 6) | Delphi consensus    | 5 rounds       | Mid-research + final    |

---

## 7. SWS Integration Path

### 7A. Registration as CANON Ecosystem

Based on SQ10's detailed analysis:

**Ecosystem ID:** `research-discovery` **Current maturity:** L1 (Identified) --
components exist but are informal (SQ10 Section 7 Step B) **Target maturity:**
L3 (Monitored) -- schemas, health checker, testing, state persistence, naming
compliance all formalized **Effort:** M (medium) **Dependencies:** Skills
ecosystem (#2) must be at L2+ first

### 7B. D67 Amendment Decision

SQ10 identifies three options for sequence placement:

| Option | Description                                                | Pros                                                     | Cons                                      | Recommendation |
| ------ | ---------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------- | -------------- |
| A      | Insert as new ecosystem between Skills (#2) and Hooks (#3) | Early standardization, informs all downstream ecosystems | Amends D67 locked sequence                |                |
| B      | Fold into Skills as sub-domain                             | No D67 change needed                                     | Dilutes focus, R&D spans more than skills |                |
| C      | Add as Step 22+ after current 21 steps                     | No D67 change, defers risk                               | Defers too far, R&D is cross-cutting      |                |

**This architecture recommends Option A** -- R&D is a cross-cutting concern that
informs how skills, agents, sessions, and audits operate. Folding it into Skills
would lose that cross-cutting identity. Deferring to Step 22+ means the standard
is built after many ecosystems have already been standardized without it.

**User decision required:** Amend D67 to insert `research-discovery` ecosystem.

### 7C. Inter-Ecosystem Contracts

From SQ10 Section 6:

| Contract           | R&D Role | Partner  | Interface                                                                                                                          |
| ------------------ | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| R&D <-> Skills     | Consumer | Provider | Skill lifecycle, SKILL.md format. R&D standard governs WHAT research skills do; Skills standard governs HOW they are structured.   |
| R&D <-> Agents     | Consumer | Provider | Agent allocation, team spawning. R&D standard specifies which agents are used per tier; Agents standard governs agent definitions. |
| R&D <-> Sessions   | Producer | Consumer | Research output feeds session context. Session-begin checks for stale research.                                                    |
| R&D <-> Docs       | Producer | Consumer | Research findings follow doc standards. Research artifacts are indexed by docs:index.                                              |
| R&D <-> Audits     | Peer     | Peer     | Audit findings can trigger T1/T2 research. Research findings feed audit baselines.                                                 |
| R&D <-> Plan Orch. | Producer | Consumer | CL-PROTOCOL uses R&D verification model. deep-plan consumes deep-research output.                                                  |

### 7D. Tenets Implementation

The R&D standard **implements** existing tenets (SQ10 Section 6), it does not
create new ones:

| Tenet                            | How R&D Standard Implements It                                                    |
| -------------------------------- | --------------------------------------------------------------------------------- |
| T19 (extensive_discovery_first)  | Tier model ensures appropriate discovery depth before action                      |
| T20 (research_convergence_loops) | Verification protocol per tier, convergence-loop integration at T3                |
| T22 (honest_findings_only)       | Unified confidence scale with `[UNVERIFIED]` tagging, adversarial disconfirmation |
| T23 (all_planning_via_deep_plan) | T2/T3 research feeds deep-plan via adapter contract                               |
| T15 (interactivity_first)        | Human-in-the-loop rules per tier, approval gates                                  |
| T13 (plan_as_you_go)             | Escalation/de-escalation between tiers, findings feed forward                     |

### 7E. Enforcement Phases

Following SQ10's phased enforcement plan:

**Phase 1: Behavioral (immediate, no CANON infra needed)**

- Add RDS-PROTOCOL.md guardrail to CLAUDE.md Section 4
- Add R&D reference to CLAUDE.md Section 8
- Update Section 7 trigger table with tier-aware research trigger
- Cost: ~1 session

**Phase 2: Skill-Level (during R&D ecosystem deep-plan)**

- Formalize deep-research 5-phase CL as the T3 process standard
- Align CL-PROTOCOL with convergence-loop (resolve the structural duplication
  identified in SQ1 Section 5.3)
- Define quality gates within skills per tier
- Cost: ~2-3 sessions

**Phase 3: Schema + Health (during R&D ecosystem execution)**

- Zod schemas for .research/ artifacts
- Health checker for research ecosystem (staleness, completeness, quality)
- Pre-commit validation of research artifact schemas
- Cost: ~2-3 sessions

**Phase 4: Enforcement Manifest (after R&D at L3)**

- Born-compliant gate: new research must follow standard
- Enforcement manifest with tier/severity rules
- CANON Phase 3 integration
- Cost: ~1-2 sessions

---

## 8. Implementation Phases

### 8A. Phase Order Rationale

The implementation follows the principle of "behavioral first, automated last"
from SQ10's enforcement model. Each phase is independently valuable -- if
implementation stops after any phase, the standard still provides benefit.

### 8B. Phase 1: Foundation (Sessions 1-2)

**Objective:** Establish the vocabulary, tier model, and confidence scale as
behavioral rules.

**Deliverables:**

1. Write RDS-PROTOCOL.md (core protocol document)
2. Write RDS-TIERS.md (tier definitions)
3. Add CLAUDE.md guardrail #15 (research before implementation)
4. Update CLAUDE.md Section 7 trigger table
5. Add RDS-PROTOCOL.md to CLAUDE.md Section 8 reference table

**Dependencies:** None. Can be implemented immediately.

**Exit criteria:** AI correctly identifies research tier for 5 test scenarios.

### 8C. Phase 2: Unified Confidence Scale (Session 2-3)

**Objective:** Resolve the confidence incompatibility across all 4 core systems.

**Deliverables:**

1. Update deep-research REFERENCE.md to declare unified scale as canonical
2. Update CL-PROTOCOL.md to use unified scale with `[code]` basis tag
3. Update convergence-loop SKILL.md to use unified scale with `[process]` tag
4. Update deep-plan SKILL.md to map binary verified/unverified to unified scale
5. Write cross-system handoff rules in RDS-PROTOCOL.md

**Dependencies:** Phase 1 (vocabulary must exist).

**Exit criteria:** All 4 systems use the same 4-level scale. A claim can flow
from deep-research to deep-plan to CL-PROTOCOL without confidence translation
errors.

### 8D. Phase 3: Hook Integration (Session 3-4)

**Objective:** Add research detection to the hook layer for natural invocation.

**Deliverables:**

1. Add research keyword detection to `user-prompt-handler.js` (Phase 1 from SQ6
   Section 4.3)
2. Enhance plan-mode suggestion with research-before-plan check (Phase 2)
3. Add exploration-to-research escalation to `post-read-handler.js` (Phase 3)
4. Add research sensitivity setting to agent trigger state
5. Write RDS-ENFORCEMENT.md

**Dependencies:** Phase 1 (tier model must exist for hook suggestions to
reference).

**Exit criteria:** Hooks suggest research for 3+ test scenarios. No false
positives on 5 test non-research scenarios.

### 8E. Phase 4: Tool & Agent Alignment (Session 4-5)

**Objective:** Ensure the right tools and agents are used per tier.

**Deliverables:**

1. Write RDS-TOOLS.md (tool selection guide)
2. Write RDS-TEAMS.md (team composition guide)
3. Add Context7 to agent tool lists for: security-auditor, code-reviewer,
   explore, debugger, frontend-developer (SQ5 Priority 2)
4. Add Sequential Thinking MCP usage to deep-research Phase 0 (SQ5 Priority 1)
5. Create development-team.md definition file (SQ4 Gap 3)
6. Invert team spawn defaults in skill SKILL.md files (SQ4 R1)

**Dependencies:** Phase 1 (tier model defines which agents per tier).

**Exit criteria:** Agent/tool selection follows documented rules for all tiers.
development-team.md exists and is actionable.

### 8F. Phase 5: Verification Protocol (Session 5-6)

**Objective:** Implement graduated verification per tier.

**Deliverables:**

1. Write RDS-VERIFICATION.md (verification protocol per tier)
2. Resolve CL-PROTOCOL / convergence-loop structural duplication (SQ1 Section
   5.3 -- make CL-PROTOCOL invoke convergence-loop instead of reimplementing)
3. Add DREAM-style neutralized query generation to adversarial disconfirmation
   (SQ9 Finding 16)
4. Add episodic memory pre-search to deep-research Phase 0 (SQ5 Priority 3)
5. Write Zod schemas for .research/ artifacts

**Dependencies:** Phase 2 (unified confidence scale must exist for verification
to produce consistent ratings).

**Exit criteria:** Verification produces correct confidence ratings per tier.
CL-PROTOCOL delegates to convergence-loop for verification passes.

### 8G. Phase 6: CANON Registration (Session 6-7)

**Objective:** Register R&D as a CANON ecosystem and reach L3 maturity.

**Deliverables:**

1. Add research-discovery to `.canon/ecosystems.jsonl` (requires CANON Phase 1
   to have created .canon/ directory)
2. Write health checker for research ecosystem
3. Write enforcement manifest
4. Activate born-compliant gate
5. Run `/convergence-loop` on the entire R&D standard to verify claims

**Dependencies:** CANON Phase 1 infrastructure must exist. All previous phases
complete.

**Exit criteria:** Research-discovery ecosystem assessed at L3. Health checker
passes. Born-compliant gate active.

### 8H. Implementation Timeline Summary

| Phase                     | Sessions | Dependencies   | Key Deliverable                                 |
| ------------------------- | -------- | -------------- | ----------------------------------------------- |
| 1: Foundation             | 1-2      | None           | RDS-PROTOCOL.md, CLAUDE.md updates              |
| 2: Confidence Scale       | 2-3      | Phase 1        | Unified 4-level scale across all systems        |
| 3: Hook Integration       | 3-4      | Phase 1        | Research detection in hooks                     |
| 4: Tool & Agent Alignment | 4-5      | Phase 1        | RDS-TOOLS.md, RDS-TEAMS.md, development-team.md |
| 5: Verification Protocol  | 5-6      | Phase 2        | RDS-VERIFICATION.md, CL-PROTOCOL refactor       |
| 6: CANON Registration     | 6-7      | All + CANON P1 | L3 maturity, health checker, enforcement        |

**Note:** Phases 3 and 4 can execute in parallel with Phase 2 (independent
dependencies). The critical path is: Phase 1 -> Phase 2 -> Phase 5 -> Phase 6.

---

## 9. Shared Vocabulary

A recurring finding across SQ1-SQ10 is the lack of shared terminology. The
standard introduces a controlled vocabulary:

| Term                  | Definition                                                            | Replaces                            |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| **Finding**           | A discrete piece of information discovered during research            | claim, discovery, violation, result |
| **Claim**             | A finding that asserts something testable about reality               | assertion, statement                |
| **Source**            | An external reference supporting a finding                            | citation, reference, evidence       |
| **Contradiction**     | Two findings that assert incompatible things                          | conflict, disagreement, divergence  |
| **Convergence**       | State where additional verification passes produce no new corrections | stability, completion, done         |
| **Tier**              | The complexity level determining research depth                       | level, depth, scale                 |
| **Escalation**        | Moving a research task to a higher tier                               | upgrade, expand                     |
| **De-escalation**     | Moving a research task to a lower tier                                | downgrade, simplify                 |
| **Research artifact** | Any file produced by the research process                             | output, deliverable                 |
| **Basis tag**         | Annotation indicating how confidence was determined                   | (new concept)                       |

---

## 10. Key Design Decisions and Rationale

### D1: Four tiers, not three or five

**Decision:** Four tiers (T0-T3). **Rationale:** Multiple independent domains
converge on four as the natural number (SQ8 Finding 5.4: incident response,
consulting, intelligence). Three lacks the T0 automatic layer. Five adds
complexity without improving decisions (SQ8 Source 24: "Four is the sweet
spot"). **Source:** SQ8 Section 5, SQ6 Section 5.

### D2: Unified confidence is 4-level with basis tags

**Decision:** Adopt deep-research's 4-level scale (HIGH/MEDIUM/LOW/UNVERIFIED)
with basis tag annotations (`[source]`/`[process]`/`[code]`/`[training]`).
**Rationale:** Deep-research has the most mature confidence system (SQ1 Section
2.6). Adding basis tags resolves the "same label, different meaning" problem
without changing any existing system's internal logic. **Source:** SQ1 Section
5.1, SQ1 Section 5.3.

### D3: Hooks suggest, skills enforce

**Decision:** Hooks provide suggestions (stderr hints for T0/T1, stdout
directives for T2/T3). Skills enforce process internally. **Rationale:** SQ6
Section 6.3 establishes that hooks catch what the AI forgets, while behavioral
rules cover nuance. Making hooks enforce research would create false positives
on non-research tasks (SQ6 Section 4.1 alert fatigue risk). **Source:** SQ6
Sections 4-6.

### D4: Teams are opt-out, not opt-in

**Decision:** For documented triggers, teams spawn by default. Exceptions
prevent spawning. **Rationale:** SQ4 Section 6 identifies that teams are never
spawned because the default is opt-in. Inverting to opt-out changes the
cognitive default. **Source:** SQ4 Recommendations R1, R2.

### D5: Max 4 parallel agents per wave

**Decision:** Cap concurrent agents at 4 per wave, use hierarchy for more.
**Rationale:** DeepMind research shows coordination gains plateau beyond 4
agents (SQ7b Finding 13). SQ3 Section 10 already documents max 4 concurrent as a
parallelization rule. **Source:** SQ7b Finding 13, SQ3 Section 10.

### D6: CL-PROTOCOL should invoke convergence-loop, not reimplement

**Decision:** Refactor CL-PROTOCOL to use convergence-loop as its verification
primitive, rather than maintaining a parallel D1-D4/V1-V4 implementation.
**Rationale:** SQ1 Section 5.3 identifies CL-PROTOCOL as "structurally
isomorphic to convergence-loop" but independently implemented. This creates
maintenance burden and potential drift. convergence-loop is the universal
verification primitive (SQ1 Section 4.1). **Source:** SQ1 Sections 3-4, SQ1
Section 5.3.

### D7: R&D gets its own CANON ecosystem (Option A)

**Decision:** Insert research-discovery as a new ecosystem, amending D67.
**Rationale:** R&D spans 4 skills, 14+ non-core skills, multiple agent types,
and has its own artifact pattern. Folding it into Skills loses the cross-cutting
identity (SQ10 Section 4). The standard governs process across ecosystem
boundaries. **Source:** SQ10 Section 4, SQ10 Section 7. **User decision
required:** D67 amendment.

### D8: Behavioral enforcement first, automated enforcement last

**Decision:** Implementation follows behavioral -> skill-internal -> hook ->
schema -> CANON registration. **Rationale:** SQ10 Section 5 identifies that
behavioral rules can be added immediately while CANON infrastructure is being
built. Each phase is independently valuable. The critical insight from SQ7a
Pattern 5: "the scaffolding matters more than the model" -- process design
before automation. **Source:** SQ10 Section 5, SQ7a Pattern 5.

### D9: De-escalation is supported, not just escalation

**Decision:** Every tier defines both escalation triggers (go up) and
de-escalation triggers (go down). **Rationale:** SQ8 Gap 5 identifies that all
tier models focus on escalation only. De-escalation prevents waste when a
question turns out to be simpler than initially assessed. No existing framework
addresses this. **Source:** SQ8 Gap 5 (novel contribution).

### D10: Episodic memory before formal research index

**Decision:** Research workflows check episodic memory for informal prior
research before checking the formal research-index.jsonl. **Rationale:** SQ5 Gap
GAP-1 identifies that deep-research only checks the formal index, missing
informal research from past conversations. Episodic memory search costs
near-zero and catches research done outside the `/deep-research` pipeline.
**Source:** SQ5 Gap GAP-1.

---

## 11. Risk Assessment

| Risk                                                                | Likelihood | Impact | Mitigation                                                                                                                 |
| ------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Standard is too complex, AI ignores it                              | MEDIUM     | HIGH   | Phase 1 behavioral-only approach tests adoption before adding complexity. RDS-PROTOCOL.md kept under 200 lines.            |
| Hook suggestions cause alert fatigue                                | MEDIUM     | MEDIUM | Compound signals + session dedup + user sensitivity control (Section 4E)                                                   |
| Team spawning costs too many tokens without quality improvement     | LOW        | MEDIUM | Team outcome tracking in session-end (SQ4 R4) provides feedback loop. Can revert to opt-in if data shows no benefit.       |
| CL-PROTOCOL refactor to use convergence-loop introduces regressions | LOW        | HIGH   | Phase 5 includes convergence-loop verification of the refactored CL-PROTOCOL itself.                                       |
| CANON Phase 1 delayed, blocking Phase 6                             | MEDIUM     | LOW    | Phases 1-5 are all independently valuable without CANON registration. Phase 6 can wait.                                    |
| Unified confidence scale is too complex for T0/T1 tasks             | LOW        | MEDIUM | T0/T1 use simplified checks (source exists? -> MEDIUM minimum; no source -> UNVERIFIED). Full scale only matters at T2/T3. |

---

## 12. Source Finding Cross-Reference

Every major architectural choice traces to specific research findings:

| Architecture Element       | Source Findings                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| 4-tier model               | SQ6 (hook gaps), SQ8 (cross-domain convergence on 4), SQ7b (academic taxonomy)                    |
| Tier 0 automatic           | SQ6 (Gaps G1, G2), SQ7a (Pattern 1: research-before-action universal)                             |
| Tier 1 quick investigation | SQ6 (Section 5 Tier 1), SQ8 (desk research analog), SQ5 (Context7 underuse)                       |
| Tier 2 focused research    | SQ8 (targeted primary), SQ7b (Anthropic 90% multi-agent improvement), SQ7b (DeepMind 4-agent cap) |
| Tier 3 full campaign       | SQ1 (deep-research pipeline), SQ7a/7b (patterns 1-7), SQ8 (field research)                        |
| Unified confidence scale   | SQ1 (incompatibility finding), SQ9 (Finding 5: calibration critical)                              |
| Basis tags                 | SQ1 (3 different confidence types: source, process, code)                                         |
| Hook integration           | SQ6 (all 7 gaps), SQ6 (3-layer model), SQ6 (anti-fatigue)                                         |
| Team opt-out default       | SQ4 (6 root causes for non-spawning), SQ4 (R1 inversion)                                          |
| Max 4 parallel agents      | SQ7b (DeepMind 17x error trap), SQ3 (existing parallelization rule)                               |
| CL-PROTOCOL refactor       | SQ1 (structural isomorphism finding), SQ1 (Section 5.3 gap)                                       |
| CANON registration         | SQ10 (full integration blueprint), SQ10 (L1 current assessment)                                   |
| Verification per tier      | SQ9 (all 18 findings), SQ2 (Pattern Family 2)                                                     |
| Tool selection             | SQ5 (all 10 gaps), SQ5 (tool inventory)                                                           |
| Agent selection            | SQ3 (full inventory), SQ3 (underuse analysis)                                                     |
| Shared vocabulary          | SQ1 (Section 5.3 gap: no shared vocabulary)                                                       |
| Implementation phases      | SQ10 (enforcement phases), SQ7a (Pattern 5: scaffolding > model)                                  |
