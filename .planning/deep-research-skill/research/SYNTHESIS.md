# Deep Research Skill: Research Synthesis

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Research Reports:** 21
**Total Research Volume:** ~750KB across 20 agents + 1 core design principle
**Synthesis Author:** Claude (research synthesizer)
<!-- prettier-ignore-end -->

---

## Executive Summary

Twenty research agents investigated the design space for a deep-research skill
for Claude Code. The research spans industry landscape analysis, multi-agent
architecture patterns, orchestration strategies, convergence loops, domain-
agnostic design, existing tools, UX patterns, cost economics, security, quality
evaluation, source verification, source registry design, downstream integration,
custom agent design, error recovery, research memory, self-audit, gap analysis,
and two adversarial reports (contrarian analysis, outside-the-box thinking).

**What we learned:**

The deep-research skill fills a critical gap in the SoNash codebase: there is no
way to do standalone, ad-hoc technical research outside the GSD pipeline
[GAP_ANALYSIS]. The skill should be a **SKILL.md-as-orchestrator** that
decomposes a research question, spawns 2-4 parallel searcher agents, collects
findings into files on disk, synthesizes via a dedicated synthesizer agent, and
optionally verifies via the existing `/convergence-loop` skill
[CUSTOM_AGENT_DESIGN, ORCHESTRATION_PATTERNS, CONVERGENCE_IN_RESEARCH].

**Architecture consensus:** Hub-and-spoke (orchestrator-workers) is the only
validated production topology. Every commercial system (Google, OpenAI,
Perplexity, Anthropic) and every successful open-source system (STORM,
GPT-Researcher, DeerFlow) uses this pattern. The optimal agent count is 2-4
workers per session, with diminishing returns beyond 5 [MULTI_AGENT_PATTERNS].

**Cost reality:** A standard research session (4 sub-questions, 2-3 search
rounds) costs $3-8 with model tiering (Opus orchestrator + Sonnet workers),
consuming ~300-500K tokens. Without tiering, costs double. The 60/20/10/10
budget split (search/verification/synthesis/overhead) is well-justified
[COST_TOKEN_ECONOMICS].

**Key tension:** The "overkill by default" design principle [CORE_DESIGN_
PRINCIPLE] conflicts with the contrarian report's warning that the system is
over-engineered for a solo developer's CLI tool [CONTRARIAN_ANALYSIS]. The
resolution: build the MVP with 2 custom agents + 1 skill, prove value, then
layer in verification/convergence/domain-detection incrementally. Even "quick"
mode should be more thorough than competitors' deep mode.

**Strongest validated findings:** (1) Hub-and-spoke topology is correct, (2)
token budget management is critical, (3) file-based state persistence is the
right pattern for Claude Code, (4) progressive disclosure (3-layer output) is
validated UX, (5) citation-forward output is table stakes, (6) query
sanitization for security is a real concern, (7) MCP security risks are
legitimate [CONTRARIAN_ANALYSIS validated findings].

---

## The Design Vision

This skill is **not** a Perplexity clone in the terminal. It is a research
system designed for a solo developer who needs research that directly feeds
planning, implementation, and decision-making workflows.

**What makes it unique** [distilled from all reports]:

1. **Downstream integration as a first-class concern.** Research output flows
   directly into `/deep-plan` (Phase 0 context), `/gsd:*` (STACK.md,
   PITFALLS.md), `/convergence-loop` (claim verification), TDMS (debt intake),
   and the memory system. No other research tool is designed as a feeder system
   for a development workflow [DOWNSTREAM_INTEGRATION].

2. **Confidence is structural, not decorative.** Every claim carries HIGH/
   MEDIUM/LOW/UNVERIFIED with mandatory evidence qualifiers. Confidence
   propagates through the pipeline and gates downstream consumption: only HIGH
   confidence claims become memory candidates or decision candidates
   [SOURCE_VERIFICATION, QUALITY_EVALUATION].

3. **Overkill is the default depth.** Exhaustive verification, contrarian
   analysis, and completeness auditing are the default, not the exception. Quick
   and standard modes exist but are opt-in downgrades [CORE_DESIGN_PRINCIPLE].

4. **Research teaches, not just tells.** A "mental model" section helps the user
   build domain understanding, not just receive facts. Serendipitous findings
   surface in an "Unexpected Findings" section. Negative research (what failed,
   what doesn't exist) is a deliberate research strategy [OUTSIDE_THE_BOX].

5. **Human-in-the-loop during research.** Interaction hooks at phase transitions
   allow the user to steer, inject knowledge, redirect, or deepen specific
   threads mid-stream [OUTSIDE_THE_BOX].

---

## Architecture Consensus

### Orchestration Model

All reports converge on **skill-as-orchestrator with parallel subagents**:

```
/deep-research SKILL.md (orchestrator)
  |
  |-- Phase 0: Classify + Decompose (inline in skill)
  |     Detect domain, question type, depth level
  |     Generate MECE sub-questions
  |     Present plan to user for approval [Gemini pattern]
  |
  |-- Phase 1: Research (parallel subagents via Task tool)
  |     Spawn 2-4 deep-research-searcher agents
  |     Each writes: .planning/<topic>/research/<sub-query>-FINDINGS.md
  |     Write-to-disk-first (findings survive crashes)
  |
  |-- Phase 2: Synthesis (subagent)
  |     Spawn deep-research-synthesizer agent
  |     Reads all FINDINGS.md files
  |     Writes: RESEARCH_OUTPUT.md + claims.jsonl + sources.jsonl + metadata.json
  |
  |-- Phase 3: Verification (convergence-loop, inline, depth-dependent)
  |     Run convergence-loop on synthesis (programmatic mode)
  |     If gaps found: spawn additional searcher(s)
  |     Re-run synthesizer with augmented findings
  |
  |-- Phase 4: Self-Audit (depth-dependent)
  |     Cross-consistency, claim verification, completeness audit
  |     Confidence calibration check
  |
  |-- Phase 5: Presentation + Downstream Routing (inline in skill)
  |     Present RESEARCH_OUTPUT.md to user
  |     Surface downstream options: deep-plan, GSD, TDMS, memory, convergence
  |     Require acknowledgment per guardrail #6
```

[CUSTOM_AGENT_DESIGN, ORCHESTRATION_PATTERNS, CONVERGENCE_IN_RESEARCH,
DOWNSTREAM_INTEGRATION, SELF_AUDIT_ARCHITECTURE]

### Agent Roles and Count

**Minimum viable set (Phase 1 build):**

| Artifact                       | Type                 | Est. Lines | Priority |
| ------------------------------ | -------------------- | ---------- | -------- |
| `deep-research` SKILL.md       | Skill (orchestrator) | 200-300    | P0       |
| `deep-research-searcher.md`    | Custom agent         | 500-700    | P0       |
| `deep-research-synthesizer.md` | Custom agent         | 250-350    | P0       |

**Explicitly NOT building:**

| Role                  | Reason                                      |
| --------------------- | ------------------------------------------- |
| Decomposer agent      | Inline in skill; needs orchestrator context |
| Critic/verifier agent | `/convergence-loop` handles this            |
| Orchestrator agent    | Skill IS the orchestrator                   |
| Formatter agent       | Synthesizer handles output formatting       |

[CUSTOM_AGENT_DESIGN]

### Data Flow

```
User query
  -> Skill classifies (domain, question type, depth)
  -> Skill decomposes into sub-questions
  -> User approves plan (or modifies)
  -> Parallel searchers write FINDINGS.md files to disk
  -> Synthesizer reads all FINDINGS.md, writes:
       RESEARCH_OUTPUT.md (human-readable)
       claims.jsonl (machine-parseable, backbone for all integrations)
       sources.jsonl (source registry)
       metadata.json (session metadata + consumer_hints)
  -> Verification pass (depth-dependent)
  -> Self-audit pass (depth-dependent)
  -> Presentation with downstream routing options
```

[DOWNSTREAM_INTEGRATION, CUSTOM_AGENT_DESIGN]

### State Management

Research state persists in `.claude/state/deep-research.<topic-slug>.state.json`
following the proven `deep-plan` pattern. State file tracks: research plan with
sub-query statuses, findings summary with confidence distribution, error log,
budget tracking, synthesis status, and resume point. Updated after every state-
changing event. Enables idempotent resume after crash/compaction.

[ERROR_RECOVERY_RESILIENCE, CUSTOM_AGENT_DESIGN]

---

## Core Capabilities (Prioritized)

### P0: Must-Have for MVP

1. **Question decomposition** -- Break complex queries into 3-7 MECE sub-
   questions. Top-down with iterative refinement. Present plan to user before
   executing [ORCHESTRATION_PATTERNS, DOMAIN_AGNOSTIC_DESIGN].

2. **Parallel web research** -- 2-4 searcher agents execute concurrently using
   WebSearch + WebFetch. Each writes findings to disk immediately
   [MULTI_AGENT_PATTERNS, CUSTOM_AGENT_DESIGN].

3. **Multi-source synthesis with citations** -- Synthesizer combines findings
   into coherent output with inline numbered citations `[n]`. Every claim
   traceable to source [UX_OUTPUT_PATTERNS, SOURCE_VERIFICATION].

4. **Confidence scoring** -- THREE-level (HIGH/MEDIUM/LOW) + UNVERIFIED with
   mandatory evidence qualifiers. Not decorative -- drives downstream routing
   [SOURCE_VERIFICATION, QUALITY_EVALUATION].

5. **Structured dual output** -- RESEARCH_OUTPUT.md (human-readable) +
   claims.jsonl (machine-parseable). Both produced on every invocation
   [DOWNSTREAM_INTEGRATION].

6. **File-based state with checkpoint/resume** -- Survive crashes, compaction,
   and session boundaries. Write-to-disk-first pattern for all findings
   [ERROR_RECOVERY_RESILIENCE].

7. **Depth levels** -- Quick ($0.50-1), Standard ($2-5), Deep ($5-12),
   Exhaustive ($12-25+). Auto-select based on question type; user override
   available [COST_TOKEN_ECONOMICS, DOMAIN_AGNOSTIC_DESIGN].

8. **Model tiering** -- Opus for orchestration/synthesis, Sonnet for search
   workers. Saves ~55% vs Opus-only [COST_TOKEN_ECONOMICS].

### P1: Add After MVP Validated

9. **Convergence-loop verification** -- Programmatic mode with research-
   specific behaviors (verify-sources, cross-reference, temporal-check,
   completeness-audit, bias-check, synthesis-fidelity)
   [CONVERGENCE_IN_RESEARCH].

10. **Domain detection and adaptation** -- Classify query domain to tune source
    authority maps, verification rules, and output format. 8+ domain modules as
    YAML configuration [DOMAIN_AGNOSTIC_DESIGN].

11. **Downstream adapters** -- GSD adapter (claims -> STACK.md, PITFALLS.md
    etc.), deep-plan adapter (claims -> DIAGNOSIS.md context), TDMS adapter
    (debt claims -> intake JSONL), memory adapter (durable insights -> memory
    files) [DOWNSTREAM_INTEGRATION].

12. **Self-audit phase** -- Cross-consistency, claim verification, completeness
    audit, source diversity check, confidence calibration
    [SELF_AUDIT_ARCHITECTURE].

### P2: Enhancement Layer

13. **Human-in-the-loop steering** -- Interaction hooks at phase transitions for
    user to redirect, inject knowledge, or deepen specific threads
    [OUTSIDE_THE_BOX].

14. **Research memory and cross-session building** -- JSONL research index +
    overlap detection + staleness management + incremental building
    [RESEARCH_MEMORY_LEARNING].

15. **Serendipity register** -- Surface high-value out-of-scope findings in
    "Unexpected Findings" section [OUTSIDE_THE_BOX].

16. **Negative research** -- Deliberately look for failures, abandoned
    approaches, and gaps [OUTSIDE_THE_BOX].

17. **Academic research mode** -- Paper Search MCP, citation chain following,
    systematic review patterns [EXISTING_TOOLS_LANDSCAPE, GAP_ANALYSIS].

---

## Source Strategy

### Source Hierarchy (from Source Registry)

The skill has access to a rich source ecosystem. Priority ordering depends on
domain, but the default hierarchy is:

| Tier | Source                    | Trust Level  | Best For                                       |
| ---- | ------------------------- | ------------ | ---------------------------------------------- |
| 1    | Context7 MCP              | Highest      | Library/framework docs, verified API reference |
| 2    | WebFetch (official docs)  | High         | Official documentation, release notes, specs   |
| 3    | WebSearch (general)       | Medium       | Ecosystem discovery, community patterns, news  |
| 4    | Codebase (Grep/Glob/Read) | High (local) | Existing patterns, current implementation      |
| 5    | Training data             | Lowest       | Fallback only, always marked [UNVERIFIED]      |

[SOURCE_REGISTRY_DESIGN, DOMAIN_AGNOSTIC_DESIGN]

### Source Selection Algorithm

```
1. Classify query domain (technology, academic, medical, legal, etc.)
2. Load domain-specific source authority map
3. For each sub-question:
   a. Route to highest-tier available source
   b. If primary source returns no results: fall through to next tier
   c. Cross-reference findings across 2+ independent sources
   d. Assign initial confidence based on source tier and agreement
4. Parallel access where sources are independent
5. Sequential access where one source's output determines the next query
```

[SOURCE_REGISTRY_DESIGN]

### External Tool Integration (Priority Order)

| Priority | Tool                          | Why                                            | Status            |
| -------- | ----------------------------- | ---------------------------------------------- | ----------------- |
| P0       | WebSearch + WebFetch (native) | Already available, zero cost                   | Use now           |
| P1       | Tavily MCP                    | LLM-optimized search+extract, $0.008/req       | Add to .mcp.json  |
| P1       | Brave Search MCP              | Independent index for cross-verification       | Add to .mcp.json  |
| P1       | Firecrawl MCP                 | Deep extraction, JS rendering, structured data | Add to .mcp.json  |
| P2       | Paper Search MCP              | 20+ academic databases in one server           | For academic mode |
| P2       | Jina AI Grounding             | Fact-checking with factuality scores           | For verification  |

[EXISTING_TOOLS_LANDSCAPE]

### CRAAP+SIFT Universal Framework

All sources are evaluated using the combined CRAAP+SIFT framework from library
science and digital literacy, adapted for AI research:

- **CRAAP:** Currency, Relevance, Authority, Accuracy, Purpose
- **SIFT:** Stop, Investigate the source, Find better coverage, Trace claims

This provides domain-agnostic source evaluation that works even for unknown
domains [DOMAIN_AGNOSTIC_DESIGN].

---

## Verification Architecture

### Three Convergence Points

Verification runs at three pipeline points, with depth scaled to research mode:

| Research Depth | Finding Verification | Synthesis Verification | Completeness Check  |
| -------------- | -------------------- | ---------------------- | ------------------- |
| Quick          | None                 | None                   | None                |
| Standard       | quick (2 passes)     | quick (2 passes)       | None                |
| Deep           | standard (3 passes)  | standard (3 passes)    | quick (2 passes)    |
| Exhaustive     | thorough (5 passes)  | thorough (5 passes)    | standard (3 passes) |

[CONVERGENCE_IN_RESEARCH]

### Six Research-Specific Convergence Behaviors

New behaviors extending the existing convergence-loop skill:

1. **verify-sources** -- Check cited URLs exist and support the claims
2. **cross-reference** -- Find independent corroborating sources
3. **temporal-check** -- Verify information is current
4. **completeness-audit** -- Check all sub-questions were addressed
5. **bias-check** -- Assess perspective diversity and source concentration
6. **synthesis-fidelity** -- Verify synthesis accurately represents findings

[CONVERGENCE_IN_RESEARCH]

### Adversarial Verification (Optional Upgrade)

Available at any depth via `--adversarial` flag:

```
Pass 1: source-check (neutral)
Pass 2: discovery (adversarial prompt -- "find what's wrong")
Pass 3: verification (resolve red-team challenges)
Pass 4: fresh-eyes (independent final assessment)
```

[CONVERGENCE_IN_RESEARCH]

### Contrarian Caution on Verification

Same-model verification (Claude verifying Claude) has documented biases:
self-preference, verbosity bias, position bias, subtle error blindness. The
design must acknowledge that convergence loops are a light filter, not a quality
guarantee. Consider using a different model family for verification agents, or
treating all verification as "raises confidence" rather than "confirms truth"
[CONTRARIAN_ANALYSIS].

---

## Output & Integration

### Output Structure (3-Layer Progressive Disclosure)

**Layer 1: Terminal summary** (5-10 lines, always shown)

- Topic, domain, overall confidence, claim counts
- Primary recommendation (one sentence)
- Pointer to full report file path

**Layer 2: Full report** (RESEARCH_OUTPUT.md on disk)

- Executive summary (3-5 paragraphs)
- Key findings with inline citations and confidence
- Technology landscape / architecture patterns / pitfalls
- Open questions and decision candidates
- Sources (tiered by authority)
- Metadata (agents used, passes completed, duration)

**Layer 3: Machine-parseable data** (claims.jsonl + sources.jsonl +
metadata.json)

- Structured claims with categories, confidence, source IDs, routing flags
- Source registry with verification status
- Session metadata with consumer_hints for downstream routing

[UX_OUTPUT_PATTERNS, DOWNSTREAM_INTEGRATION]

### Downstream Consumer Map (9 Primary Consumers)

| Consumer             | What It Gets                                        | Handoff Type                  |
| -------------------- | --------------------------------------------------- | ----------------------------- |
| `/deep-plan` Phase 0 | Research context section for DIAGNOSIS.md           | Auto-detect or user-initiated |
| `/skill-creator`     | Domain patterns, guard rails, defaults              | User-initiated                |
| GSD Pipeline         | STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md | Adapter script                |
| `/convergence-loop`  | LOW/MEDIUM confidence claims for verification       | Auto-suggest                  |
| TDMS                 | Debt intake JSONL via `intake-audit.js`             | Semi-automatic                |
| Memory system        | HIGH confidence durable insights                    | Auto-suggest                  |
| Decision records     | DECISION_CANDIDATES.md (never final decisions)      | Manual only                   |
| `code-reviewer`      | Security findings as review criteria                | Manual                        |
| SESSION_CONTEXT.md   | One-line session summary                            | Automatic                     |

**Critical rule:** Research writes ONLY to its own output directory. Adapters
mediate all cross-boundary writes. Research never overwrites consumer-owned
artifacts (DIAGNOSIS.md, MASTER_DEBT.jsonl, PLAN.md) [DOWNSTREAM_INTEGRATION].

### Follow-Up Suggestions

Every research output ends with suggested next actions (recognition over
recall):

- "Research found N low-confidence claims. Verify with /convergence-loop?"
- "Route N debt items to TDMS?"
- "Save N durable insights to memory?"
- "N decisions ready. Review candidates?"
- "Deepen research on: [suggested sub-topics]"

[UX_OUTPUT_PATTERNS, DOWNSTREAM_INTEGRATION]

---

## Security Model

### Query Leakage as Intelligence

Every outbound search query reveals intent, knowledge gaps, and project
architecture. The system treats queries as sensitive data, not just results
[SECURITY_PRIVACY].

### Four-Level Data Classification

| Level        | Examples                                     | Allowed Sources                 |
| ------------ | -------------------------------------------- | ------------------------------- |
| PUBLIC       | General technology knowledge                 | All sources                     |
| INTERNAL     | Project architecture evaluation              | All sources, sanitized queries  |
| CONFIDENTIAL | Vulnerability research, competitive analysis | Local + trusted sources only    |
| RESTRICTED   | PII, financial data, regulations             | Local only, no external queries |

Classification is auto-detected via keyword/topic heuristics, with user override
[SECURITY_PRIVACY].

### Query Sanitization

Before any external search:

1. Remove project-specific identifiers (project names, internal codenames)
2. Generalize specific vulnerability references
3. Replace internal terms with generic equivalents
4. Log sanitized queries for audit trail

[SECURITY_PRIVACY]

### MCP Security Posture

MCP servers are treated as low trust. The 82% statistic (MCP implementations
using filesystem operations prone to path traversal) describes attack surface,
not confirmed vulnerabilities, but 30+ CVEs in 60 days confirm real risk.
Mitigation: validate all MCP inputs/outputs, minimize filesystem access grants,
prefer well-known official servers [CONTRARIAN_ANALYSIS, SECURITY_PRIVACY].

---

## Economic Model

### Cost Tiers by Depth

| Depth      | Token Budget | Est. Cost (Tiered) | Agents   | Search Rounds |
| ---------- | ------------ | ------------------ | -------- | ------------- |
| Quick      | 80K          | $0.50-$1.00        | 1 (solo) | 1             |
| Standard   | 300K         | $2.00-$5.00        | 2-3      | 2-3           |
| Deep       | 600K         | $5.00-$12.00       | 3-4      | 3-5           |
| Exhaustive | 1.2M+        | $12.00-$25.00      | 4-5      | 5-8           |

[COST_TOKEN_ECONOMICS]

### Budget Allocation: 60/20/10/10

| Phase           | Share | Purpose                                      |
| --------------- | ----- | -------------------------------------------- |
| Search & Gather | 60%   | WebSearch, WebFetch, source discovery        |
| Verification    | 20%   | Cross-source verification, convergence loops |
| Synthesis       | 10%   | Report generation (always runs, reserved)    |
| Overhead        | 10%   | Orchestration, routing, retries              |

[COST_TOKEN_ECONOMICS]

### Model Tiering (Single Largest Cost Lever)

| Role             | Model      | Rationale                                             |
| ---------------- | ---------- | ----------------------------------------------------- |
| Orchestrator     | Opus 4.6   | Planning, synthesis, judgment -- quality caps system  |
| Search workers   | Sonnet 4.6 | Tool use, extraction -- near-Opus quality at 60% cost |
| Verifier         | Sonnet 4.6 | Pattern-matching against sources                      |
| Citation manager | Haiku 4.5  | URL checking, dedup -- purely mechanical              |

**Impact:** Tiered approach saves ~55% vs Opus-only ($3.80 vs $8.50 for a
standard session) [COST_TOKEN_ECONOMICS].

### Budget Enforcement

- 70% consumed: prioritize remaining sub-questions by importance
- 85% consumed: stop spawning agents, begin synthesis
- 95% consumed: forced synthesis with BUDGET-LIMITED flag
- 100%: hard stop, return partial results with gap documentation
- Circuit breaker: 3 retries max per operation, kill after that

[COST_TOKEN_ECONOMICS, ERROR_RECOVERY_RESILIENCE]

### Diminishing Returns

The transition from Quick to Standard adds +40-60% quality at 3-5x cost (almost
always worth it). Standard to Deep adds +15-25% at 2-3x cost (worth it for
important decisions). Deep to Exhaustive adds +5-10% at 2-3x cost (only for
critical/high-stakes). Beyond Exhaustive adds +1-3% at unbounded cost (almost
never worth it) [COST_TOKEN_ECONOMICS].

---

## Resilience Model

### Six Key Failure Modes and Mitigations

| Failure Mode                            | Probability | Mitigation                                                                  |
| --------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| WebSearch returns no/irrelevant results | 15-25%      | 3-step query reformulation cascade, then training data with [UNVERIFIED]    |
| WebFetch fails (paywall, 403, timeout)  | 20-40%      | Wayback fallback, alternative source search, confidence downgrade           |
| Agent crash mid-research                | 5-15%       | Write-to-disk-first; check for partial findings; respawn once if critical   |
| Rate limiting                           | 10-20%      | Exponential backoff with jitter, stagger agent launches, reduce parallelism |
| Context window overflow                 | 20-35%      | Write findings to disk after each cycle, summarize before storing           |
| Compaction wipes context                | 10-20%      | Topic-specific state file, automatic recovery via compact-restore hooks     |

[ERROR_RECOVERY_RESILIENCE]

### Core Resilience Principles

1. **Assume every external call will fail.** Design for degraded output, not no
   output.
2. **File-based state is the only reliable persistence.** Only files on disk
   survive all failure modes.
3. **Checkpoint early, checkpoint often.** Every intermediate result persisted
   before the next step.
4. **Partial results are acceptable; silent loss is not.** "Investigated 7 of 10
   sub-topics" is far better than silent omission.
5. **Retry has bounds; fallback has chains.** Max 3 reformulations, max 4
   retries, then flag the gap.
6. **Agent failures are expected, not exceptional.** ~15-30% of runs will have
   at least one agent failure.

[ERROR_RECOVERY_RESILIENCE]

### Progressive Output Architecture

Research produces usable output at every stage:

| Stage                 | Available Output            | Quality Level   |
| --------------------- | --------------------------- | --------------- |
| Plan created          | Sub-questions and strategy  | Metadata only   |
| 1 agent completes     | Single-perspective findings | Partial         |
| 50% agents complete   | Multi-perspective findings  | Improving       |
| All agents complete   | Full findings set           | Pre-synthesis   |
| Synthesis complete    | Coherent research document  | Full quality    |
| Verification complete | Verified research document  | Highest quality |

[ERROR_RECOVERY_RESILIENCE]

---

## Memory & Learning

### Three-Tier Research Memory

| Tier                | Mechanism                             | Purpose                              |
| ------------------- | ------------------------------------- | ------------------------------------ |
| Research index      | `.planning/research-index.jsonl`      | Fast topic lookup, overlap detection |
| Finding files       | `.planning/<topic>/research/*.md`     | Human-readable persistent findings   |
| MCP memory entities | `@modelcontextprotocol/server-memory` | Cross-session entity graphs          |

[RESEARCH_MEMORY_LEARNING]

### Staleness Management

| Domain                      | Stale After  | Expired After |
| --------------------------- | ------------ | ------------- |
| Technology (APIs, versions) | 7 days       | 30 days       |
| Business/competitive        | 14 days      | 60 days       |
| Academic/theoretical        | 90 days      | 365 days      |
| Historical/legal precedent  | No staleness | No expiry     |

Research consumed after staleness triggers warning; after expiry, requires
re-research [RESEARCH_MEMORY_LEARNING, COST_TOKEN_ECONOMICS].

### What Gets Persisted to Memory

Only HIGH-confidence, cross-session-relevant, durable insights qualify:

- "Library X does not support feature Y" (saves future re-research)
- "Domain Z requires approach W" (architectural insight)
- "Pattern Q is deprecated since v3" (prevents future misuse)

Task-specific findings, unverified claims, and comparison matrices do NOT
persist [DOWNSTREAM_INTEGRATION, RESEARCH_MEMORY_LEARNING].

---

## Quality Assurance

### Eight Quality Dimensions

| Dimension     | What It Measures                           | Measurement Approach                         |
| ------------- | ------------------------------------------ | -------------------------------------------- |
| Accuracy      | Are facts correct and verifiable?          | Citation verification, cross-source checking |
| Completeness  | Were all sub-questions covered?            | Sub-question coverage scoring                |
| Relevance     | Is content useful for the actual question? | RAG-style answer relevancy                   |
| Depth         | Did research go beyond surface level?      | Analysis-to-summary ratio, insight density   |
| Recency       | Is information current?                    | Domain-appropriate source age assessment     |
| Objectivity   | Are multiple perspectives represented?     | Source diversity, perspective balance        |
| Actionability | Can the user make decisions from this?     | Presence of recommendations, trade-offs      |
| Verifiability | Can claims be traced to sources?           | Citation density, source accessibility       |

[QUALITY_EVALUATION]

### Self-Audit Tiers

| Tier                    | Dimensions Checked                                  | When                         |
| ----------------------- | --------------------------------------------------- | ---------------------------- |
| Tier 1 (non-negotiable) | Cross-consistency, claim verification, completeness | Every invocation             |
| Tier 2 (important)      | Source diversity, confidence calibration            | Standard + Deep + Exhaustive |
| Tier 3 (thorough)       | Temporal validity, bias detection, actionability    | Deep + Exhaustive            |
| Tier 4 (exhaustive)     | Full 8-dimension assessment + adversarial challenge | Exhaustive only              |

[SELF_AUDIT_ARCHITECTURE, QUALITY_EVALUATION]

### Anti-Patterns to Detect

| Anti-Pattern         | Detection Signal                                     |
| -------------------- | ---------------------------------------------------- |
| Wikipedia-ism        | Covers everything at surface level, no insight       |
| Echo chamber         | All sources trace to same original                   |
| Confidence theater   | All claims rated HIGH regardless of evidence         |
| Source stacking      | Many citations but all from same domain/author       |
| Recency blindness    | No sources newer than 12 months on fast-moving topic |
| Fabricated citations | URLs return 404 or don't support the claim           |

[QUALITY_EVALUATION, SELF_AUDIT_ARCHITECTURE, SOURCE_VERIFICATION]

---

## Contrarian Corrections

The contrarian analysis [CONTRARIAN_ANALYSIS] identified five serious weaknesses
in the research consensus. These corrections are incorporated into the design:

### C1: The 90.2% Multi-Agent Improvement Stat Is Vendor Marketing

Anthropic's 90.2% figure comes from a non-peer-reviewed blog with opaque
methodology. Token usage explains 80% of performance variance, suggesting a
well-budgeted single agent might match multi-agent performance.

**Design impact:** Do not architect around the assumption that multi-agent
delivers 90% improvement. Build a single-agent "quick" mode as the baseline. If
multi-agent clearly wins in practice, great. If not, the quick mode is already
useful.

### C2: Cost Savings Statistics Are Misattributed

The 45.6-65.8% cost savings figure is from MALBO, not arxiv 2508.02694
("Efficient Agents"), which shows 28.4%. This citation error propagated across 3
reports.

**Design impact:** Use 28.4% (Efficient Agents) as the conservative estimate for
model tiering savings, not 45.6-65.8%. The ~55% savings calculated from actual
Opus vs Sonnet pricing is independently derived and reliable.

### C3: Same-Model Convergence Loops Have Fundamental Limitations

LLM-as-judge research documents self-preference bias, verbosity bias, and
position bias. Claude verifying Claude is auto-correlation, not independent
verification.

**Design impact:** Convergence loops are a "raises confidence" filter, not a
"confirms truth" guarantee. Acknowledge this limitation in the output. Consider
using a different model family for verification (Sonnet for verification of Opus
synthesis, or vice versa). Never claim convergence-verified findings are
"independently verified."

### C4: Domain-Agnostic Design Risks Mediocrity

Legal and medical research require fundamentally different reasoning patterns,
not just different source lists. CRAAP+SIFT is a decent fallback but not a
replacement for domain expertise.

**Design impact:** Domain modules must allow behavioral overrides, not just
parameter overrides. Acknowledge that some domains (legal, medical, security)
may eventually need purpose-built research paths. Start with CRAAP+SIFT as
universal default; add domain-specific reasoning patterns when usage data
reveals where they are needed.

### C5: Over-Engineering Warning

The full proposed system (orchestrator + 2 agents + convergence at 3 points +
domain detection + source registry + model tiering + state management +
progressive synthesis + 8 quality dimensions + adversarial verification) is
2,000-4,000 lines. Karpathy's autoresearch loop achieves results in 630 lines.

**Design impact:** Build Phase 1 (2 agents + 1 skill, ~950-1,350 lines) and
prove value before adding complexity. Every additional feature must earn its
place through demonstrated quality failures in the simple version.

---

## Blind Spots Addressed

The outside-the-box analysis [OUTSIDE_THE_BOX] identified dimensions absent from
all other reports. These enrich the design:

### B1: Human-AI Collaborative Steering During Research (Must-Have)

Current design treats the user as input/output terminal. Real research is
iterative and conversational. OpenAI's 2026 redesign allows mid-run redirection
without restart.

**Incorporated:** Design explicit interaction hooks at phase transitions. After
breadth pass, show findings and ask which threads to deepen. Allow user to
inject search terms, exclude sources, or add findings mid-stream.

### B2: Research as Pedagogy (Should-Have)

Research that only delivers conclusions creates learned helplessness. Harvard
(2025) found AI usage correlates with reduced critical thinking.

**Incorporated:** Add optional "mental model" section. Include "conceptual
prerequisites" block. Reference the user's known stack (from codebase) for
analogies.

### B3: Serendipity Register (Should-Have)

Goal-directed research has a structural blind spot: it only finds answers to
questions it asks. No existing tool has a serendipity mechanism.

**Incorporated:** During search, agents flag high-value out-of-scope findings in
a serendipity register. Final report includes "Unexpected Findings" section.

### B4: Research Afterlife / Living Documents (Should-Have)

Research treated as disposable. Decisions based on stale research are invisible
risks.

**Incorporated:** Tag findings with staleness dates. Store decision-finding
links for provenance. Implement `/stale-check` capability.

### B5: Negative Research (Should-Have)

No report includes negative research as a strategy. Knowing what doesn't exist
or what failed is often more valuable than knowing what does.

**Incorporated:** Add "negative questions" to decomposition: "What has been
tried and failed?" and "What doesn't exist yet?"

### B6: Cognitive Load Management (Should-Have)

Research can produce too much information. The user needs help processing, not
just receiving.

**Incorporated:** Offer "walk me through it" mode. Include decision-relevant
summary. For long reports, generate a reading guide prioritizing by relevance.

---

## Open Questions for Discovery

These questions could not be answered by research alone and should become Phase
1 Discovery questions in `/deep-plan`:

### Architecture Questions

1. **Should the searcher agent be a single generic agent or should there be
   variants** (web-searcher, codebase-searcher, academic-searcher)? The custom
   agent analysis leans toward a single combined agent, but the source registry
   suggests domain-specific variants may add value.

2. **How should the skill handle the plan-approval gate?** Gemini shows the plan
   and waits. OpenAI asks clarifying questions. The overkill principle suggests
   showing the plan, but the solo developer context suggests minimal friction.

3. **What is the right max-agent count?** Research says 3-5 is optimal, but the
   contrarian notes this is task-dependent and the gap with single-agent is
   narrowing. Should max be 3 (conservative) or 5 (overkill)?

4. **How should Context7 integration work?** It's the highest-confidence source
   for library docs but is listed in `.mcp.json.example` (not active). Is it a
   P0 dependency or a P1 enhancement?

### User Experience Questions

5. **How verbose should terminal output be during research?** Options range from
   progress dots to live-streaming findings. The UX report says progress must be
   visible, but too much terminal output is noise.

6. **Should "quick" mode even use subagents?** The cost analysis shows solo
   agent at ~$2 vs 3-agent at ~$4. For quick lookups, a single-agent pass may be
   faster and cheaper with comparable quality.

7. **What level of mid-stream steering is practical?** Full OpenAI-style
   redirection? Or simpler "approve/modify plan" gates at phase boundaries?

### Quality Questions

8. **How do we benchmark quality without a gold standard?** DeepResearchGym and
   DRACO exist but are external. Should we build an internal eval set of 10
   representative research questions with human-graded expected outputs?

9. **What is the acceptable fabrication rate for citations?** Studies show
   28-40% of LLM citations contain errors. Is <10% achievable? At what cost?

### Economic Questions

10. **Is the pre-research cost estimate valuable enough to justify its own token
    cost?** The estimation itself consumes tokens. For quick lookups, the
    estimate might cost more than the research.

11. **Should cross-session knowledge caching be file-based (simple) or use the
    MCP memory server (richer)?** The research memory report recommends both,
    but implementing both increases complexity.

---

## Key Statistics

### Research Coverage

- **Total unique external sources cited:** 200+ across all reports (academic
  papers, vendor documentation, blog posts, GitHub repositories, security
  advisories)
- **Reports with highest confidence findings:** INDUSTRY_LANDSCAPE (all HIGH
  confidence on commercial product analysis), COST_TOKEN_ECONOMICS (grounded in
  real pricing data), GAP_ANALYSIS (verified against filesystem)
- **Reports with lowest confidence / highest uncertainty:** OUTSIDE_THE_BOX
  (speculative by design), RESEARCH_MEMORY_LEARNING (many design options, few
  proven patterns for this specific context)

### Areas Needing User Input

- **Domain priority:** Which domains matter most for SoNash? Technology is
  assumed primary, but the "Evidence-Based" vision may require academic research
  capability sooner.
- **Integration priority:** Which downstream consumers are most important?
  deep-plan and GSD are assumed primary, but TDMS and memory may matter more in
  practice.
- **Complexity budget:** How many implementation hours is the user willing to
  invest? The contrarian's 80/20 alternative (200-400 lines) vs the full system
  (2,000-4,000 lines) represents fundamentally different ambitions.

### Citation Error Corrections (from Contrarian)

| Claim                           | Cited Source     | Actual Source          | Correct Figure                                                                    |
| ------------------------------- | ---------------- | ---------------------- | --------------------------------------------------------------------------------- |
| "45.6-65.8% cost savings"       | arxiv 2508.02694 | MALBO (separate paper) | 28.4% (Efficient Agents)                                                          |
| "82% have path traversal vulns" | Security reports | Same reports           | 82% use filesystem ops _prone to_ traversal (attack surface, not confirmed vulns) |
| "90.2% improvement"             | Anthropic blog   | Same                   | Vendor marketing, not peer-reviewed; token-spend confound significant             |

---

## Design Principles

Distilled from CORE_DESIGN_PRINCIPLE.md and all 21 research reports:

1. **Overkill by default.** Exhaustive is the default depth. Quick/standard
   modes are opt-in downgrades. Even quick mode should exceed competitors' deep
   mode. [CORE_DESIGN_PRINCIPLE]

2. **Findings survive everything.** Write to disk first, always. File-based
   state is the only reliable persistence. Every intermediate result has value.
   [ERROR_RECOVERY_RESILIENCE, CUSTOM_AGENT_DESIGN]

3. **Confidence is structural.** Every claim carries evidence-qualified
   confidence. Confidence gates downstream consumption. Never present UNVERIFIED
   claims as established fact. [SOURCE_VERIFICATION, QUALITY_EVALUATION]

4. **Research feeds systems, not just humans.** The dual output format
   (human-readable + machine-parseable) enables downstream integration as a
   first-class concern. [DOWNSTREAM_INTEGRATION]

5. **Start simple, earn complexity.** Build the 2-agent MVP. Add convergence
   loops, domain detection, and source registries only when specific quality
   failures demand them. [CONTRARIAN_ANALYSIS]

6. **Partial results beat silent failure.** A research document that says
   "investigated 7 of 10 sub-topics" is infinitely more valuable than one that
   silently omits 3 topics. [ERROR_RECOVERY_RESILIENCE]

7. **Budget is a first-class constraint.** Every session declares a token budget
   upfront. Graceful degradation at 70/85/95/100% thresholds. Pre-research cost
   estimates enable informed user choice. [COST_TOKEN_ECONOMICS]

8. **Verification is honest about its limits.** Same-model convergence loops
   raise confidence but do not confirm truth. Acknowledge LLM-as-judge biases in
   the output. [CONTRARIAN_ANALYSIS, CONVERGENCE_IN_RESEARCH]

9. **The user is a co-researcher, not a customer.** Interaction hooks,
   mid-stream steering, plan approval gates, and acknowledgment requirements
   keep the user engaged and in control. [OUTSIDE_THE_BOX, CLAUDE.md guardrails]

10. **Research teaches, not just tells.** Build mental models, surface the
    unexpected, investigate failures, and help the user think -- not just
    consume. [OUTSIDE_THE_BOX]

---

## Version History

| Version | Date       | Description                |
| ------- | ---------- | -------------------------- |
| 1.0     | 2026-03-20 | Initial research synthesis |
