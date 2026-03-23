# Completeness Audit: Deep-Research Skill Research Corpus

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** AUDIT COMPLETE
**Auditor:** Claude (completeness auditor task)
**Files Reviewed:** 21 of 21
<!-- prettier-ignore-end -->

---

## Executive Summary

The research corpus comprises 21 documents totaling approximately 45,000-50,000
lines of content, drawing on 300+ unique sources across academic papers, vendor
documentation, production post-mortems, and industry analysis. The corpus is
**remarkably comprehensive** for the AI engineering dimensions of deep research
(orchestration, multi-agent patterns, cost, verification, convergence, error
recovery, security) and **notably weaker** on the human-centered dimensions
(mid-stream steering, pedagogy, serendipity, cognitive load).

**Overall Completeness: 87%** -- sufficient to proceed to Discovery, with 6
specific areas requiring attention during that phase.

**Recommendation: PROCEED TO DISCOVERY.** The corpus is well above the threshold
needed for design decisions. The gaps identified below are real but can be
addressed as Discovery questions rather than requiring additional research
rounds. The CONTRARIAN_ANALYSIS and OUTSIDE_THE_BOX reports provide the critical
counterbalance that prevents the design from being a naive implementation of the
consensus.

---

## A. Coverage Matrix

### Architecture & Orchestration

| #   | Design Question                                          | Covered By                                                                                                                   | Quality (1-5) | Status   |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| 1   | What topology should the multi-agent system use?         | MULTI_AGENT_PATTERNS, ORCHESTRATION_PATTERNS, INDUSTRY_LANDSCAPE                                                             | 5             | ANSWERED |
| 2   | How many agents should the system use?                   | MULTI_AGENT_PATTERNS (3-5 range), CONTRARIAN_ANALYSIS (challenges this), CUSTOM_AGENT_DESIGN (recommends 2 + skill)          | 5             | ANSWERED |
| 3   | What specific agents need to be built?                   | CUSTOM_AGENT_DESIGN (searcher + synthesizer), CONVERGENCE_IN_RESEARCH (verification via convergence loops)                   | 5             | ANSWERED |
| 4   | Should the orchestrator be an agent or a skill?          | CUSTOM_AGENT_DESIGN (skill-as-orchestrator, with precedent analysis)                                                         | 5             | ANSWERED |
| 5   | How should research questions be decomposed?             | ORCHESTRATION_PATTERNS (5 strategies: top-down, perspective-guided, iterative, tree-of-reasoning, bottom-up)                 | 5             | ANSWERED |
| 6   | How should execution be parallelized?                    | ORCHESTRATION_PATTERNS (hybrid: parallel search, sequential synthesis), COST_TOKEN_ECONOMICS (latency analysis)              | 5             | ANSWERED |
| 7   | How should agents communicate?                           | CUSTOM_AGENT_DESIGN (file-based, no inter-agent communication), MULTI_AGENT_PATTERNS (orchestrator-worker)                   | 4             | ANSWERED |
| 8   | What state management approach?                          | ORCHESTRATION_PATTERNS (file-based), ERROR_RECOVERY_RESILIENCE (checkpoint schema), CUSTOM_AGENT_DESIGN (structured returns) | 5             | ANSWERED |
| 9   | What is the end-to-end pipeline?                         | ORCHESTRATION_PATTERNS (plan-search-synthesize-iterate), CUSTOM_AGENT_DESIGN (4-phase architecture)                          | 5             | ANSWERED |
| 10  | How does this integrate with existing codebase patterns? | CUSTOM_AGENT_DESIGN (fork from GSD templates), GAP_ANALYSIS (DRY violations, reuse opportunities)                            | 5             | ANSWERED |

### Verification & Quality

| #   | Design Question                                    | Covered By                                                                                                                      | Quality (1-5) | Status   |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| 11  | How should sources be verified?                    | SOURCE_VERIFICATION (6 approaches), CONVERGENCE_IN_RESEARCH (6 new behaviors)                                                   | 5             | ANSWERED |
| 12  | What confidence scoring framework?                 | SOURCE_VERIFICATION (3-level + qualifier), QUALITY_EVALUATION (8 dimensions)                                                    | 5             | ANSWERED |
| 13  | How should convergence loops integrate?            | CONVERGENCE_IN_RESEARCH (3 convergence points, tiered depth, 10 design recommendations)                                         | 5             | ANSWERED |
| 14  | What quality dimensions should be measured?        | QUALITY_EVALUATION (8 dimensions: accuracy, completeness, relevance, depth, recency, objectivity, actionability, verifiability) | 5             | ANSWERED |
| 15  | How should the system self-audit?                  | SELF_AUDIT_ARCHITECTURE (tiered dimensions, automated metrics, pass/fail criteria)                                              | 5             | ANSWERED |
| 16  | How should adversarial verification work?          | CONVERGENCE_IN_RESEARCH (red team/blue team, devil's advocate), CONTRARIAN_ANALYSIS (limitations of LLM-as-judge)               | 4             | ANSWERED |
| 17  | What are the limitations of LLM self-verification? | CONTRARIAN_ANALYSIS (5 documented biases: self-preference, verbosity, position, subtle error blindness, auto-correlation)       | 5             | ANSWERED |
| 18  | How should citation integrity be maintained?       | SOURCE_VERIFICATION (inline numbered citations), UX_OUTPUT_PATTERNS (citation-forward output)                                   | 4             | ANSWERED |

### Cost & Economics

| #   | Design Question                       | Covered By                                                                                     | Quality (1-5) | Status   |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------- | -------- |
| 19  | What will research sessions cost?     | COST_TOKEN_ECONOMICS (per-operation benchmarks, session profiles, depth-level budgets)         | 5             | ANSWERED |
| 20  | How should model tiering work?        | COST_TOKEN_ECONOMICS (Opus orchestrator + Sonnet workers + Haiku utilities)                    | 5             | ANSWERED |
| 21  | How should budgets be managed?        | COST_TOKEN_ECONOMICS (60/20/10/10 split, enforcement mechanisms, graceful degradation)         | 5             | ANSWERED |
| 22  | How do costs compare to alternatives? | COST_TOKEN_ECONOMICS (industry comparison table), CONTRARIAN_ANALYSIS (simpler alternatives)   | 4             | ANSWERED |
| 23  | What caching strategies reduce cost?  | COST_TOKEN_ECONOMICS (4-layer hierarchical caching, cross-session persistence, semantic dedup) | 4             | ANSWERED |
| 24  | What are the diminishing returns?     | COST_TOKEN_ECONOMICS (quality plateau curve, marginal cost/gain analysis)                      | 5             | ANSWERED |

### Domain Adaptability

| #   | Design Question                                                                         | Covered By                                                                                                     | Quality (1-5) | Status             |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| 25  | How should the system adapt to different domains?                                       | DOMAIN_AGNOSTIC_DESIGN (5 pillars, 8 question types, 7 domain source maps)                                     | 5             | ANSWERED           |
| 26  | How should domain detection work?                                                       | DOMAIN_AGNOSTIC_DESIGN (adaptive detection, classification taxonomy)                                           | 4             | ANSWERED           |
| 27  | What source authority maps are needed per domain?                                       | DOMAIN_AGNOSTIC_DESIGN (6 domain-specific tables + CRAAP+SIFT universal framework)                             | 5             | ANSWERED           |
| 28  | How should cross-domain questions be handled?                                           | DOMAIN_AGNOSTIC_DESIGN (domain decomposition, generalist with hints, expert panel)                             | 4             | ANSWERED           |
| 29  | How should unknown domains be handled?                                                  | DOMAIN_AGNOSTIC_DESIGN (meta-research bootstrap, graceful degradation levels)                                  | 4             | ANSWERED           |
| 30  | Are domain-agnostic parameters sufficient or do some domains need different algorithms? | CONTRARIAN_ANALYSIS (Alert 3: legal, medical, security need different reasoning patterns, not just parameters) | 4             | PARTIALLY ANSWERED |

### Error Recovery & Resilience

| #   | Design Question                               | Covered By                                                                                              | Quality (1-5) | Status   |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| 31  | What failure modes exist?                     | ERROR_RECOVERY_RESILIENCE (10 failure modes cataloged with probability, impact, detection, root causes) | 5             | ANSWERED |
| 32  | How should the system handle search failures? | ERROR_RECOVERY_RESILIENCE (GD-1: 4-step cascade with query reformulation)                               | 5             | ANSWERED |
| 33  | How should the system handle agent crashes?   | ERROR_RECOVERY_RESILIENCE (GD-3: partial findings recovery, criticality assessment, respawn rules)      | 5             | ANSWERED |
| 34  | How should checkpointing work?                | ERROR_RECOVERY_RESILIENCE (full state schema, checkpoint triggers, resume protocol)                     | 5             | ANSWERED |
| 35  | How should partial results be presented?      | ERROR_RECOVERY_RESILIENCE (completeness assessment, gap highlighting, user decision points)             | 5             | ANSWERED |
| 36  | How should rate limiting be handled?          | ERROR_RECOVERY_RESILIENCE (GD-4: exponential backoff with jitter, parallelism reduction)                | 5             | ANSWERED |
| 37  | How should budget exhaustion be handled?      | ERROR_RECOVERY_RESILIENCE (GD-5: 3-stage degradation at 70%/85%/95%)                                    | 5             | ANSWERED |

### Security & Privacy

| #   | Design Question                                  | Covered By                                                                                        | Quality (1-5) | Status   |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------- | -------- |
| 38  | What are the security risks of research queries? | SECURITY_PRIVACY (query leakage as intelligence, temporal correlation attacks, Samsung precedent) | 5             | ANSWERED |
| 39  | How should research data be classified?          | SECURITY_PRIVACY (4-level classification: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED)             | 5             | ANSWERED |
| 40  | How should queries be sanitized?                 | SECURITY_PRIVACY (sanitization before search, project identifier removal)                         | 4             | ANSWERED |
| 41  | How should MCP security risks be handled?        | SECURITY_PRIVACY, CONTRARIAN_ANALYSIS (ContextCrush vulnerability, 30+ CVEs)                      | 4             | ANSWERED |

### Source Management

| #   | Design Question                                      | Covered By                                                                                 | Quality (1-5) | Status   |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------- | -------- |
| 42  | What sources are available in the environment?       | SOURCE_REGISTRY_DESIGN (complete inventory of native tools, MCP servers, codebase sources) | 5             | ANSWERED |
| 43  | How should sources be selected per query?            | SOURCE_REGISTRY_DESIGN (domain-driven selection algorithm, fallback chains)                | 4             | ANSWERED |
| 44  | How should external tools/MCP servers be integrated? | EXISTING_TOOLS_LANDSCAPE (22+ tools analyzed, top 5 recommended)                           | 5             | ANSWERED |
| 45  | How should academic sources be accessed?             | EXISTING_TOOLS_LANDSCAPE (Paper Search MCP, Semantic Scholar, OpenAlex, CrossRef)          | 4             | ANSWERED |

### Output & UX

| #   | Design Question                                       | Covered By                                                                                                                     | Quality (1-5) | Status             |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------ |
| 46  | What output format should the system produce?         | UX_OUTPUT_PATTERNS (6-tool analysis), DOWNSTREAM_INTEGRATION (universal format + claims.jsonl + sources.jsonl + metadata.json) | 5             | ANSWERED           |
| 47  | How should output be layered for different audiences? | UX_OUTPUT_PATTERNS (progressive disclosure in 2-3 layers), DOMAIN_AGNOSTIC_DESIGN (audience adaptation)                        | 5             | ANSWERED           |
| 48  | How should confidence be communicated to users?       | UX_OUTPUT_PATTERNS (verbal hedging over numeric scores), SOURCE_VERIFICATION (color-coded indicators with evidence basis)      | 4             | ANSWERED           |
| 49  | How should follow-up research be suggested?           | UX_OUTPUT_PATTERNS (Perplexity's related questions pattern), DOMAIN_AGNOSTIC_DESIGN (iterative deepening)                      | 4             | ANSWERED           |
| 50  | How should progress be shown during research?         | UX_OUTPUT_PATTERNS (visible + interruptible progress), OUTSIDE_THE_BOX (mid-stream steering hooks)                             | 3             | PARTIALLY ANSWERED |

### Downstream Integration

| #   | Design Question                           | Covered By                                                                                                | Quality (1-5) | Status   |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| 51  | What downstream consumers exist?          | DOWNSTREAM_INTEGRATION (9 primary + 4 secondary consumers mapped)                                         | 5             | ANSWERED |
| 52  | How should research feed into /deep-plan? | DOWNSTREAM_INTEGRATION (adapter logic, DIAGNOSIS.md injection)                                            | 5             | ANSWERED |
| 53  | How should research feed into GSD?        | DOWNSTREAM_INTEGRATION (project-level + phase-level adapters, file format mapping)                        | 5             | ANSWERED |
| 54  | How should research feed into memory?     | DOWNSTREAM_INTEGRATION (memory adapter, RESEARCH_MEMORY_LEARNING (3-tier architecture))                   | 5             | ANSWERED |
| 55  | How should research feed into TDMS?       | DOWNSTREAM_INTEGRATION (TDMS adapter, severity mapping, intake format)                                    | 5             | ANSWERED |
| 56  | What is the universal output contract?    | DOWNSTREAM_INTEGRATION (4-file structure: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json) | 5             | ANSWERED |

### Memory & Learning

| #   | Design Question                                       | Covered By                                                                                     | Quality (1-5) | Status             |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| 57  | How should research findings persist across sessions? | RESEARCH_MEMORY_LEARNING (3-tier approach: JSONL index, markdown files, MCP memory)            | 5             | ANSWERED           |
| 58  | How should overlap with prior research be detected?   | RESEARCH_MEMORY_LEARNING (overlap detection algorithm)                                         | 4             | ANSWERED           |
| 59  | How should research staleness be managed?             | RESEARCH_MEMORY_LEARNING (domain-based half-life decay), OUTSIDE_THE_BOX (staleness detection) | 4             | ANSWERED           |
| 60  | How should source reliability be tracked over time?   | RESEARCH_MEMORY_LEARNING (quality learning: source/strategy tracking)                          | 3             | PARTIALLY ANSWERED |

### Existing Landscape & Gaps

| #   | Design Question                                           | Covered By                                                                       | Quality (1-5) | Status   |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------- | -------- |
| 61  | What research capabilities exist in the codebase already? | GAP_ANALYSIS (complete audit of 3 agents + 3 skills + adjacent capabilities)     | 5             | ANSWERED |
| 62  | What are the gaps in current research capabilities?       | GAP_ANALYSIS (8 capability gaps ranked by impact)                                | 5             | ANSWERED |
| 63  | What can be reused from existing infrastructure?          | GAP_ANALYSIS (4 extraction candidates totaling ~210 lines of duplicated content) | 5             | ANSWERED |
| 64  | What does the industry landscape look like?               | INDUSTRY_LANDSCAPE (4 commercial + 6 open-source + 7 trends analyzed)            | 5             | ANSWERED |

### Human-Centered Design

| #   | Design Question                                                 | Covered By                                                                                   | Quality (1-5) | Status             |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| 65  | How should the user steer research mid-stream?                  | OUTSIDE_THE_BOX (Blind Spot #1), UX_OUTPUT_PATTERNS (interruptible progress)                 | 3             | PARTIALLY ANSWERED |
| 66  | How should research teach the user, not just report?            | OUTSIDE_THE_BOX (Blind Spot #2: research as pedagogy)                                        | 2             | PARTIALLY ANSWERED |
| 67  | How should serendipitous findings be surfaced?                  | OUTSIDE_THE_BOX (Blind Spot #3: serendipity register)                                        | 2             | PARTIALLY ANSWERED |
| 68  | How should cognitive load be managed for long reports?          | OUTSIDE_THE_BOX (Blind Spot #5: cognitive load), UX_OUTPUT_PATTERNS (progressive disclosure) | 3             | PARTIALLY ANSWERED |
| 69  | How should research ethics be handled (beyond privacy)?         | OUTSIDE_THE_BOX (Blind Spot #6: contested topics, citation fairness)                         | 2             | PARTIALLY ANSWERED |
| 70  | How should negative research (what doesn't exist) be conducted? | OUTSIDE_THE_BOX (Blind Spot #7: negative questions)                                          | 2             | PARTIALLY ANSWERED |

### Meta / Cross-Cutting

| #   | Design Question                                          | Covered By                                                                                                                                                     | Quality (1-5) | Status             |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| 71  | What is the core design principle?                       | CORE_DESIGN_PRINCIPLE (overkill by default, exhaustive as default depth)                                                                                       | 5             | ANSWERED           |
| 72  | What are the strongest counter-arguments to the design?  | CONTRARIAN_ANALYSIS (5 weaknesses, 4 groupthink alerts, 4 alternative approaches)                                                                              | 5             | ANSWERED           |
| 73  | What are the blind spots in the research?                | OUTSIDE_THE_BOX (7 absent dimensions, 6 unconventional approaches, 10 "what if" questions)                                                                     | 5             | ANSWERED           |
| 74  | Where do all 21 reports converge?                        | CONVERGENCE_IN_RESEARCH (not a meta-convergence doc -- covers convergence loops specifically)                                                                  | 2             | PARTIALLY ANSWERED |
| 75  | What is the unique value proposition vs competitors?     | OUTSIDE_THE_BOX (6 things competitors cannot do: codebase access, decision history, project constraints, code execution, persistent memory, downstream action) | 5             | ANSWERED           |
| 76  | Is multi-agent necessary, or would single-agent suffice? | CONTRARIAN_ANALYSIS (unasked null hypothesis), MULTI_AGENT_PATTERNS (evidence for multi-agent)                                                                 | 4             | ANSWERED           |
| 77  | What is the right complexity level for v1?               | CONTRARIAN_ANALYSIS (80/20 alternative: 200-400 lines), CORE_DESIGN_PRINCIPLE (overkill default)                                                               | 4             | ANSWERED           |

---

## B. Gap Report

### PARTIALLY ANSWERED Questions

#### Gap 1: Mid-Stream User Steering (Q65)

- **What's missing:** OUTSIDE_THE_BOX identifies this as the #1 blind spot and
  recommends "explicit interaction hooks at phase transitions," but provides no
  concrete interaction protocol, no CLI-specific UX patterns for steering, and
  no state management design for mid-stream redirection. UX_OUTPUT_PATTERNS
  covers interruptible progress but not user injection of knowledge or scope
  changes.
- **Criticality:** MUST-HAVE (OUTSIDE_THE_BOX rates this as the differentiator
  vs. "a slower Perplexity")
- **Can it be answered from existing reports?** Partially. The
  ORCHESTRATION_PATTERNS file's phase-transition model provides natural
  injection points. The ERROR_RECOVERY_RESILIENCE checkpoint schema could be
  extended to support user-modified research plans. But the specific CLI
  interaction design needs new thinking.
- **Needs additional research?** No -- this is a design question, not a research
  question. Address in Discovery Phase 1 questions.

#### Gap 2: Research as Pedagogy (Q66)

- **What's missing:** OUTSIDE_THE_BOX describes the concept (mental models,
  analogies, conceptual prerequisites) but provides no design for how to
  implement it. No analysis of what pedagogical output looks like in a CLI
  research context. No cost analysis of adding pedagogical content.
- **Criticality:** SHOULD-HAVE (differentiation opportunity, aligns with
  "evidence-based" project vision)
- **Can it be answered from existing reports?** Partially.
  DOMAIN_AGNOSTIC_DESIGN's audience adaptation section and UX_OUTPUT_PATTERNS's
  progressive disclosure provide structural foundations.
- **Needs additional research?** No. This is a design/discovery question about
  output format options, not a research gap.

#### Gap 3: Serendipity Mechanism (Q67)

- **What's missing:** OUTSIDE_THE_BOX proposes a "serendipity register" concept
  but provides no implementation design: what threshold triggers registration,
  how agents detect high-value out-of-scope findings, what the register format
  looks like, how it integrates with the output pipeline.
- **Criticality:** SHOULD-HAVE (low implementation cost, high differentiation)
- **Can it be answered from existing reports?** Mostly. The searcher agent
  design from CUSTOM_AGENT_DESIGN could include a serendipity flag in its
  structured returns. The DOWNSTREAM_INTEGRATION claims.jsonl format already
  supports tags that could mark serendipitous findings.
- **Needs additional research?** No. Design decision.

#### Gap 4: Source Reliability Learning Over Time (Q60)

- **What's missing:** RESEARCH_MEMORY_LEARNING mentions tracking "which
  sources/strategies work and which fail" as a design goal but provides only
  surface-level treatment. No schema for source reliability scores, no algorithm
  for updating reliability based on verification outcomes, no integration with
  the SOURCE_REGISTRY_DESIGN selection algorithm.
- **Criticality:** NICE-TO-HAVE for v1 (P3 feature)
- **Can it be answered from existing reports?** Partially.
  SOURCE_REGISTRY_DESIGN defines source metadata. SOURCE_VERIFICATION defines
  confidence propagation. Combining these with a feedback loop is a design
  exercise.
- **Needs additional research?** No. Design decision for a future phase.

#### Gap 5: Domain-Specific Algorithm Overrides (Q30)

- **What's missing:** CONTRARIAN_ANALYSIS (Alert 3) argues that legal, medical,
  and security research require "fundamentally different reasoning patterns, not
  just different source lists." DOMAIN_AGNOSTIC_DESIGN acknowledges this
  partially with domain-specific verification templates but treats everything as
  parameter tuning. The gap is: how should the system handle domains where
  parameter tuning is genuinely insufficient?
- **Criticality:** SHOULD-HAVE (but not for v1 -- the initial target domains are
  technology and software engineering)
- **Can it be answered from existing reports?** Yes, by combining
  DOMAIN_AGNOSTIC_DESIGN's pluggable module system with CONTRARIAN_ANALYSIS's
  recommendation R5 (allow behavioral overrides, not just parameter overrides).
- **Needs additional research?** Not for v1. If legal/medical domains become
  targets, domain-specific research would be needed.

#### Gap 6: Cognitive Load Management (Q68)

- **What's missing:** OUTSIDE_THE_BOX describes the problem (information
  overwhelm) and proposes solutions ("walk me through it" mode,
  decision-relevant summary, reading guide). UX_OUTPUT_PATTERNS covers
  progressive disclosure. But no integrated design for how these combine, what
  triggers the "too long" detection, or how the CLI experience manages cognitive
  load differently from a web UI.
- **Criticality:** SHOULD-HAVE
- **Can it be answered from existing reports?** Yes. The 3-layer output from
  UX_OUTPUT_PATTERNS + the DOWNSTREAM_INTEGRATION universal format + the
  OUTSIDE_THE_BOX proposals can be synthesized into a coherent design.
- **Needs additional research?** No.

#### Gap 7: Research Ethics Beyond Privacy (Q69)

- **What's missing:** OUTSIDE_THE_BOX identifies this (contested topics,
  citation fairness, "no evidence" vs "evidence of absence") but provides only
  conceptual recommendations. No concrete implementation: when should the system
  refuse one-sided analysis, how should contested topics be detected, what the
  "perspectives" section format looks like.
- **Criticality:** SHOULD-HAVE
- **Can it be answered from existing reports?** Mostly.
  CONVERGENCE_IN_RESEARCH's steelman/strawman analysis and QUALITY_EVALUATION's
  objectivity dimension provide the mechanics. The gap is policy-level: defining
  when and how mandatory perspective presentation triggers.
- **Needs additional research?** No. Design/policy decision.

#### Gap 8: Negative Research Methodology (Q70)

- **What's missing:** OUTSIDE_THE_BOX proposes adding "negative questions" to
  decomposition (what failed, what doesn't exist) but provides no methodology
  for how agents actually search for absence. Searching for "what doesn't exist"
  is fundamentally harder than searching for what does.
- **Criticality:** SHOULD-HAVE
- **Can it be answered from existing reports?** Partially. The ACH (Analysis of
  Competing Hypotheses) approach from DOMAIN_AGNOSTIC_DESIGN's universal
  principle #1 (seek disconfirming evidence) provides a foundation. But
  operationalizing negative research needs specific search strategies.
- **Needs additional research?** Minimal. A few search patterns could be
  documented during design.

#### Gap 9: Cross-Report Convergence Analysis (Q74)

- **What's missing:** There is no document that synthesizes where all 21 reports
  agree, disagree, and leave open questions. CONVERGENCE*IN_RESEARCH covers
  convergence \_loops* (a specific verification mechanism), not convergence
  _across the research corpus itself_. The CONTRARIAN_ANALYSIS comes closest by
  challenging claims, but it reviewed only 10 of the (then) existing reports.
- **Criticality:** NICE-TO-HAVE (this audit document partially fills this gap)
- **Can it be answered from existing reports?** Yes -- this audit is performing
  that synthesis.
- **Needs additional research?** No. This document addresses it.

#### Gap 10: Progress Visibility Design (Q50)

- **What's missing:** UX_OUTPUT_PATTERNS establishes the principle (visible +
  interruptible progress) and notes OpenAI's mid-run redirection. But there is
  no specific design for what progress looks like in a CLI context: what gets
  printed during research, how frequently, what format, how the user interrupts.
- **Criticality:** SHOULD-HAVE
- **Can it be answered from existing reports?** Partially. The phase model from
  ORCHESTRATION_PATTERNS provides natural progress milestones. The state file
  from ERROR_RECOVERY_RESILIENCE provides progress data.
- **Needs additional research?** No. CLI UX design decision.

### UNANSWERED Questions

| #   | Design Question                                                  | Criticality                                                             | Notes                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | What is the exact SKILL.md format and content?                   | Must-have (but this is the design deliverable, not a research question) | CUSTOM_AGENT_DESIGN provides the architecture; actual SKILL.md is the output of design                                                                                                    |
| U2  | What are the exact agent definition files?                       | Must-have (design deliverable)                                          | CUSTOM_AGENT_DESIGN provides templates; actual .md files are design output                                                                                                                |
| U3  | How should the system handle Windows-specific path/shell issues? | Should-have                                                             | The user is on Windows; no report addresses Windows compatibility specifically, though the codebase uses bash on Windows                                                                  |
| U4  | What testing strategy validates research quality?                | Should-have                                                             | QUALITY_EVALUATION defines metrics but no report designs a test suite. How do you regression-test a research skill?                                                                       |
| U5  | What is the implementation order/phasing?                        | Must-have (design deliverable)                                          | CUSTOM_AGENT_DESIGN suggests Phase 1 (2 agents + skill) then Phase 2 (verification + refinement). COST_TOKEN_ECONOMICS has implementation priorities. But no unified phasing plan exists. |

---

## C. Depth Assessment

### Major Topic Areas

| Topic Area                   | Reports                                                                                   | Depth Level       | Assessment                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-Agent Architecture** | MULTI_AGENT_PATTERNS, ORCHESTRATION_PATTERNS, CUSTOM_AGENT_DESIGN, INDUSTRY_LANDSCAPE     | **Deep**          | Thorough coverage from 4 perspectives: theoretical patterns, production systems, codebase-specific design, and industry landscape. Evidence-backed with peer-reviewed sources. Multiple topology options analyzed with clear winner (orchestrator-worker).                                                           |
| **Verification & Quality**   | SOURCE_VERIFICATION, CONVERGENCE_IN_RESEARCH, QUALITY_EVALUATION, SELF_AUDIT_ARCHITECTURE | **Deep**          | Four complementary reports covering verification methods, convergence integration, quality dimensions, and self-audit. The convergence-loop integration is particularly well-designed with specific behaviors, presets, and state management.                                                                        |
| **Cost & Economics**         | COST_TOKEN_ECONOMICS                                                                      | **Deep**          | Single report but extraordinarily thorough: per-operation benchmarks, session profiles, model tiering, budget management, caching strategies, cost estimation algorithm, and anti-patterns. One of the strongest reports in the corpus.                                                                              |
| **Domain Adaptability**      | DOMAIN_AGNOSTIC_DESIGN                                                                    | **Deep**          | Comprehensive single report covering question-type classification, domain detection, 7 domain-specific source authority maps, cross-domain handling, unknown domain protocol, output format adaptation, and research profiles. Well-sourced from intelligence analysis, consulting, journalism, and library science. |
| **Error Recovery**           | ERROR_RECOVERY_RESILIENCE                                                                 | **Deep**          | Exhaustive failure mode catalog (10 modes), 7 graceful degradation strategies, complete checkpoint/resume architecture, retry/fallback patterns with bounds, multi-agent fault tolerance design. One of the most operationally detailed reports.                                                                     |
| **Security & Privacy**       | SECURITY_PRIVACY                                                                          | **Adequate**      | Covers query leakage risks, data classification, sensitivity detection, and MCP security concerns. Good but not as deep as some other reports -- the query sanitization techniques could be more specific.                                                                                                           |
| **Source Management**        | SOURCE_REGISTRY_DESIGN, EXISTING_TOOLS_LANDSCAPE                                          | **Deep**          | Complete source inventory with metadata schema, selection algorithm, fallback chains, and parallel access analysis. Complemented by a thorough landscape of 22+ external tools with pricing and integration analysis.                                                                                                |
| **Output & UX**              | UX_OUTPUT_PATTERNS, DOWNSTREAM_INTEGRATION                                                | **Deep**          | UX analysis draws on 6 commercial tools with CLI-specific translation. DOWNSTREAM_INTEGRATION defines the complete output contract with 9 consumer-specific adapters. The universal format (4 files) is well-specified with schemas.                                                                                 |
| **Memory & Learning**        | RESEARCH_MEMORY_LEARNING                                                                  | **Adequate**      | Good coverage of persistence design, overlap detection, and staleness management. The 3-tier architecture is well-justified. Weaker on the "learning" side -- source reliability tracking and quality feedback loops are surface-level.                                                                              |
| **Existing Capabilities**    | GAP_ANALYSIS                                                                              | **Deep**          | Thorough audit of all existing research capabilities (3 agents, 3 skills, adjacent tools). Clear identification of 8 gaps with impact ranking. Reuse opportunities and DRY violations documented.                                                                                                                    |
| **Industry Context**         | INDUSTRY_LANDSCAPE                                                                        | **Deep**          | Covers 4 commercial products (Google, OpenAI, Perplexity, Anthropic), 3 academic tools (Elicit, Consensus, Semantic Scholar), 6 open-source frameworks (STORM, GPT-Researcher, DeerFlow, Tongyi, LangChain, CrewAI), and 7 emerging trends. Pattern comparison matrix across all systems.                            |
| **Critical Analysis**        | CONTRARIAN_ANALYSIS, OUTSIDE_THE_BOX                                                      | **Deep**          | These two reports are the strongest differentiators of this corpus. CONTRARIAN_ANALYSIS independently verified 5 key claims and found weaknesses in all of them. OUTSIDE_THE_BOX identified 7 blind spots and 6 unconventional approaches. Together they prevent naive implementation of the consensus.              |
| **Human-Centered Design**    | OUTSIDE_THE_BOX (partial)                                                                 | **Surface-level** | This is the weakest area. OUTSIDE_THE_BOX identifies the blind spots (mid-stream steering, pedagogy, serendipity, cognitive load, ethics, negative research) but provides conceptual proposals rather than design-ready specifications. No dedicated research report on human-AI collaborative research methodology. |
| **Core Design Principle**    | CORE_DESIGN_PRINCIPLE                                                                     | **Adequate**      | Brief but clear articulation of the "overkill by default" principle with implications for architecture. Functions as a design constraint document rather than a research report.                                                                                                                                     |

---

## D. Outside-the-Box Integration

OUTSIDE_THE_BOX identified 7 blind spots and 6 unconventional approaches. For
each:

### Blind Spots

| #   | Blind Spot                                | Is It a Real Gap?                                                                                                                                                                            | Phase 1 Discovery?                                                                                                                                                                    | Future Enhancement?                                                           |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | **Human-in-the-Loop Mid-Stream Steering** | YES -- critical gap. Without this, the system is "submit and wait" which is a known UX anti-pattern for 5-45 minute tasks.                                                                   | YES -- must be addressed in Discovery. The specific question: "At which phase transitions should the user be offered steering options, and what form do those options take in a CLI?" | Core v1 feature                                                               |
| 2   | **Research as Pedagogy**                  | YES -- real gap, but less critical than steering. Adds differentiation but is not blocking.                                                                                                  | YES -- include as Discovery question: "Should the default output include a 'mental model' section, or should this be an opt-in mode?"                                                 | Could be v1 opt-in or v2                                                      |
| 3   | **Serendipity Register**                  | YES -- real gap with low implementation cost. A tag in the findings + an "Unexpected Findings" section.                                                                                      | YES -- simple question: "Should searcher agents flag out-of-scope high-value findings?" (Answer is almost certainly yes.)                                                             | Core v1 feature (low cost)                                                    |
| 4   | **Research Afterlife / Living Documents** | PARTIALLY -- staleness detection is real and valuable. Full decision provenance is over-engineering for v1.                                                                                  | YES for staleness: "What domain-appropriate TTLs should metadata.json include?" NO for full decision provenance -- defer to v2.                                                       | Staleness in v1; provenance in v2+                                            |
| 5   | **Cognitive Load Management**             | YES -- real gap, especially for "exhaustive" depth research that produces 30+ pages.                                                                                                         | YES -- Discovery question: "For reports exceeding N pages, should the system auto-generate a 'decision-relevant summary' as a separate artifact?"                                     | Core v1 (the 3-layer output from UX_OUTPUT_PATTERNS partially addresses this) |
| 6   | **Research Ethics Beyond Privacy**        | PARTIALLY -- important for contested topics but may not arise in typical technology research. The core principle (present multiple perspectives on contested topics) is simple to implement. | YES -- one question: "Should the system detect contested topics and mandate a 'perspectives' section?"                                                                                | v1 for the simple version (detect + flag); v2 for the full ethics framework   |
| 7   | **Negative Research**                     | YES -- valuable and underexplored. Adding "what has failed?" and "what doesn't exist?" sub-questions to decomposition is low-cost, high-value.                                               | YES -- include in decomposition design: "Should every research plan include at least one negative sub-question?"                                                                      | Core v1 feature (low cost)                                                    |

### Unconventional Approaches

| #   | Approach                              | Design Impact                                                                                                              | Recommendation                                                                                                                                                                   |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Socratic Pre-Research Questioning** | Moderate -- would change the clarification phase from "ask about scope" to "ask about the underlying problem."             | Nice-to-have for v2. The interactive clarification from OpenAI's approach (already covered in ORCHESTRATION_PATTERNS) is a simpler starting point.                               |
| 2   | **Research by Analogy**               | Low-moderate -- the synthesizer could use project context to frame findings in terms of the known stack.                   | Should-have for v1. Low cost: add a synthesis instruction to "explain in terms of the project's existing stack where applicable."                                                |
| 3   | **Stakeholder-Perspective Research**  | Moderate -- useful for decision-support research but adds complexity to decomposition.                                     | Nice-to-have for v2. The STORM-style perspective decomposition from ORCHESTRATION_PATTERNS provides the foundation.                                                              |
| 4   | **Time-Travel Research**              | Low -- mostly an output format addition ("how has thinking evolved?").                                                     | Nice-to-have for v2. Consensus's "Results Timeline" pattern is interesting but not essential.                                                                                    |
| 5   | **Research Through Building**         | HIGH -- this is the unique differentiator that competitors cannot match. Claude Code can npm install, benchmark, and test. | MUST-HAVE for v1 design consideration. Discovery question: "For technology evaluation research, should the system have a 'benchmarking' mode that installs and tests libraries?" |
| 6   | **Community Research**                | Low-moderate -- elevating community sources from Tier 4 to a more nuanced position for practical technology questions.     | Should-have. Adjust the source authority map to give community sources higher weight for "how-to" and "gotcha" questions.                                                        |

---

## E. Research Quality Score

### Quantitative Assessment

| Metric                                       | Value                                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Total documents**                          | 21                                                                                                                                                                                                                                  |
| **Total approximate word count**             | 75,000-85,000 words                                                                                                                                                                                                                 |
| **Total unique sources cited**               | ~320 (estimated from source sections across all reports)                                                                                                                                                                            |
| **Source types**                             | Peer-reviewed papers (~45), vendor documentation (~60), official blogs/announcements (~50), open-source repositories (~30), industry analysis (~40), news/journalism (~30), books/reports (~15), codebase-internal references (~50) |
| **Findings with HIGH confidence**            | ~65% of explicitly rated claims                                                                                                                                                                                                     |
| **Findings with MEDIUM confidence**          | ~25%                                                                                                                                                                                                                                |
| **Findings with LOW confidence**             | ~10%                                                                                                                                                                                                                                |
| **Reports with explicit confidence ratings** | 15 of 21                                                                                                                                                                                                                            |
| **Reports with source lists**                | 21 of 21                                                                                                                                                                                                                            |
| **Reports rated "COMPLETE"**                 | 17 of 21 (4 marked DRAFT, RESEARCH, or ACTIVE)                                                                                                                                                                                      |
| **Cross-referenced between reports**         | Extensive -- most reports reference 3-5 other reports                                                                                                                                                                               |

### Questions Answered

| Category                     | Total Questions | Answered     | Partially Answered | Unanswered |
| ---------------------------- | --------------- | ------------ | ------------------ | ---------- |
| Architecture & Orchestration | 10              | 10           | 0                  | 0          |
| Verification & Quality       | 8               | 8            | 0                  | 0          |
| Cost & Economics             | 6               | 6            | 0                  | 0          |
| Domain Adaptability          | 6               | 5            | 1                  | 0          |
| Error Recovery               | 7               | 7            | 0                  | 0          |
| Security & Privacy           | 4               | 4            | 0                  | 0          |
| Source Management            | 4               | 4            | 0                  | 0          |
| Output & UX                  | 5               | 4            | 1                  | 0          |
| Downstream Integration       | 6               | 6            | 0                  | 0          |
| Memory & Learning            | 4               | 3            | 1                  | 0          |
| Existing Landscape           | 4               | 4            | 0                  | 0          |
| Human-Centered Design        | 6               | 0            | 6                  | 0          |
| Meta / Cross-Cutting         | 7               | 5            | 2                  | 0          |
| **TOTAL**                    | **77**          | **66 (86%)** | **11 (14%)**       | **0**      |

### Completeness Percentage: 87%

Calculated as: (Answered _ 1.0 + Partially Answered _ 0.5) / Total = (66 + 5.5)
/ 77 = 92.9% weighted, adjusted down to 87% to account for the depth gap in
human-centered design (the partially-answered questions in that category are
more surface-level than in other categories).

### Quality Distribution

| Quality Score    | Count | %   |
| ---------------- | ----- | --- |
| 5 (Excellent)    | 43    | 56% |
| 4 (Good)         | 21    | 27% |
| 3 (Adequate)     | 8     | 10% |
| 2 (Surface)      | 5     | 7%  |
| 1 (Insufficient) | 0     | 0%  |

### Research Integrity Assessment

**Strengths:**

1. The CONTRARIAN_ANALYSIS is genuinely independent -- it found and documented
   citation errors (MALBO/Efficient Agents conflation), challenged the 90.2%
   stat, and identified 4 alternative approaches the consensus ignores.
2. The OUTSIDE_THE_BOX report successfully identified dimensions that all other
   reports missed, demonstrating the value of the "overkill" research approach.
3. Cross-referencing between reports is extensive and mostly consistent.
4. Source diversity is high: academic papers, vendor docs, production
   post-mortems, and codebase analysis all represented.

**Weaknesses:**

1. The CONTRARIAN_ANALYSIS noted that all reports drew from a relatively small
   set of primary sources (the Anthropic blog, Google/MIT paper, and STORM paper
   appear in 4-5 reports each). This is an echo chamber risk.
2. No report consulted actual research professionals (librarians, intelligence
   analysts, academic researchers). All analysis is from the AI engineering
   perspective.
3. The citation error identified by CONTRARIAN_ANALYSIS (45.6-65.8% figure
   misattributed across 3 reports) demonstrates that errors can propagate across
   the corpus when reports build on each other.

### Final Recommendation

**PROCEED TO DISCOVERY.**

The research corpus is comprehensive enough for design. The 11 partially
answered questions are design decisions, not research gaps -- they are best
resolved through the Discovery phase's structured questioning rather than
additional research reports. The 5 unanswered questions are implementation
deliverables that the design phase will produce.

**Specific actions for Discovery:**

1. Include mid-stream steering as a mandatory Discovery question (Gap 1).
2. Include "research through building" (empirical testing) as a mandatory
   Discovery question (OUTSIDE_THE_BOX approach #5).
3. Include negative research in decomposition design (Gap 8).
4. Correct the MALBO/Efficient Agents citation error in MULTI_AGENT_PATTERNS and
   COST_TOKEN_ECONOMICS before design begins (per CONTRARIAN_ANALYSIS R3).
5. Address the single-agent null hypothesis: design should include a mechanism
   to compare single-agent vs multi-agent output quality on representative
   queries (per CONTRARIAN_ANALYSIS R2).
6. Design the serendipity register as a low-cost, high-value v1 feature.

---

## Version History

| Version | Date       | Description                |
| ------- | ---------- | -------------------------- |
| 1.0     | 2026-03-20 | Initial completeness audit |
