# Implementation Phases: P0/P1/P2/P3 Specification

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Phase:** Discovery (distilled from Research phase)
**Source Reports:** SYNTHESIS, CUSTOM_AGENT_DESIGN, COST_TOKEN_ECONOMICS, CONVERGENCE_IN_RESEARCH, DOWNSTREAM_INTEGRATION, CONTRARIAN_ANALYSIS, SELF_AUDIT_ARCHITECTURE, OUTSIDE_THE_BOX, RESEARCH_MEMORY_LEARNING, GAP_ANALYSIS
<!-- prettier-ignore-end -->

---

## Purpose

Define a phased implementation plan that follows the contrarian's guidance:
**build the MVP, prove value, layer complexity incrementally.** Every feature
beyond P0 must earn its place through demonstrated quality failures in the
simpler version.

---

## P0: Minimum Viable Research (Must-Have for First Use)

**Goal:** A working `/deep-research` skill that accepts a question, researches
it with parallel agents, and produces a cited report. Ship and use before
building anything else.

**Estimated effort:** 950-1,350 lines across 3 artifacts **Estimated timeline:**
1-2 sessions

### Artifacts to Create

| Artifact                       | Type  | Location                                             | Est. Lines |
| ------------------------------ | ----- | ---------------------------------------------------- | ---------- |
| `deep-research` SKILL.md       | Skill | `.claude/skills/deep-research/SKILL.md`              | 200-300    |
| `deep-research-searcher.md`    | Agent | `.claude/agents/global/deep-research-searcher.md`    | 500-700    |
| `deep-research-synthesizer.md` | Agent | `.claude/agents/global/deep-research-synthesizer.md` | 250-350    |

### P0 Capabilities

1. **Question decomposition** -- Break complex queries into 3-7 MECE sub-
   questions. Top-down with iterative refinement. Present plan to user before
   executing.

2. **Parallel web research** -- 2-4 searcher agents execute concurrently using
   WebSearch + WebFetch. Each writes findings to disk immediately
   (write-to-disk- first pattern).

3. **Multi-source synthesis with citations** -- Synthesizer combines findings
   into coherent output with inline numbered citations `[n]`. Every claim
   traceable to source.

4. **Confidence scoring** -- THREE-level (HIGH/MEDIUM/LOW) + UNVERIFIED with
   mandatory evidence qualifiers. Not decorative -- drives downstream routing.

5. **Structured dual output** -- `RESEARCH_OUTPUT.md` (human-readable) +
   `claims.jsonl` (machine-parseable). Both produced on every invocation.

6. **File-based state with checkpoint/resume** -- Survive crashes, compaction,
   and session boundaries. State file at
   `.claude/state/deep-research.<topic>. state.json`.

7. **Depth levels** -- Quick ($0.50-$1), Standard ($2-$5), Deep ($5-$12),
   Exhaustive ($12-$25+). Auto-select based on question type; user override
   available. Exhaustive is default.

8. **Model tiering** -- Opus for orchestration/synthesis, Sonnet for search
   workers. Saves ~55% vs Opus-only.

### P0 Output Structure

```
.planning/<topic>/research/
  <sub-query-1>-FINDINGS.md   # Written by searcher agent 1
  <sub-query-2>-FINDINGS.md   # Written by searcher agent 2
  <sub-query-N>-FINDINGS.md   # Written by searcher agent N
  RESEARCH_OUTPUT.md           # Written by synthesizer agent
  claims.jsonl                 # Written by synthesizer agent
  sources.jsonl                # Written by synthesizer agent
  metadata.json                # Written by skill orchestrator
```

### P0 Orchestration Flow

```
User: /deep-research "How should we implement X?"
  |
  |-- Skill classifies question type + domain (inline)
  |-- Skill decomposes into sub-questions (inline)
  |-- Skill presents plan with cost estimate to user
  |-- User approves (or modifies)
  |
  |-- Spawn 2-4 searcher agents in parallel (Task tool)
  |     Each gets: sub-question, source strategy, output path, budget
  |     Each writes: <sub-query>-FINDINGS.md
  |
  |-- Spawn synthesizer agent (Task tool)
  |     Reads all FINDINGS.md files
  |     Writes: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl
  |
  |-- Skill presents results to user
  |     Terminal summary (5-10 lines)
  |     Full report file path
  |     "What would you like to do next?" suggestions
```

### P0 Searcher Agent Design

Fork from `gsd-project-researcher` (proven template). Key sections:

- `<role>`: General-purpose web researcher, spawned by deep-research skill
- `<tool_strategy>`: WebSearch query formulation, WebFetch deep-read, source
  verification protocol (CRAAP+SIFT basics)
- `<source_hierarchy>`: WebFetch (official docs) > WebSearch (general) >
  Training data (always [UNVERIFIED])
- `<output_format>`: FINDINGS.md with Key Findings, Sources (with confidence),
  Contradictions, Gaps, Confidence Assessment
- `<execution_flow>`: Search -> Read -> Analyze -> Verify -> Write
- `<structured_returns>`: `## RESEARCH COMPLETE` with findings summary

### P0 Synthesizer Agent Design

Fork from `gsd-research-synthesizer` (proven template). Key sections:

- `<role>`: Combine multiple FINDINGS.md files into coherent research output
- `<output_format>`: RESEARCH_OUTPUT.md (executive summary, key findings by
  theme, contradictions, confidence assessment, gaps, recommendations, sources)
- `<execution_flow>`: Read all findings -> Deduplicate -> Theme extraction ->
  Draft report -> Citation pass -> Write output files
- `<structured_returns>`: `## SYNTHESIS COMPLETE` with report summary

### What P0 Does NOT Include

- No convergence-loop verification
- No domain detection (treats everything as technology/general)
- No downstream adapters
- No self-audit phase
- No human-in-the-loop mid-stream steering
- No research memory / cross-session building
- No serendipity register
- No negative research
- No academic research mode
- No codebase research profile

---

## P1: Verification and Domain Awareness

**Goal:** Add the verification layer and domain-specific tuning. Triggered by
quality failures observed in P0 usage.

**Estimated effort:** 500-800 additional lines **Prerequisite:** P0 in active
use, quality issues documented

### P1 Capabilities

9. **Convergence-loop verification** -- Programmatic mode with 6 research-
   specific behaviors:
   - `verify-sources`: Check cited URLs exist and support the claims
   - `cross-reference`: Find independent corroborating sources
   - `temporal-check`: Verify information is current
   - `completeness-audit`: Check all sub-questions were addressed
   - `bias-check`: Assess perspective diversity and source concentration
   - `synthesis-fidelity`: Verify synthesis accurately represents findings

10. **Domain detection and adaptation** -- Classify query domain to tune source
    authority maps, verification rules, and output format. Start with 3 domain
    modules: `technology` (default), `academic`, `business`. Implement as YAML
    configuration files, not code.

11. **Downstream adapters** -- Bridge between research output and consumers:
    - **deep-plan adapter**: Claims -> DIAGNOSIS.md context section
    - **GSD adapter**: Claims -> STACK.md, FEATURES.md, PITFALLS.md format
    - **TDMS adapter**: Debt claims -> intake JSONL via `intake-audit.js`
    - **Memory adapter**: HIGH-confidence durable insights -> memory files

12. **Self-audit phase** -- Tier 1-2 self-audit:
    - Cross-consistency between agent findings
    - Claim verification against cited sources
    - Completeness audit (all sub-questions addressed?)
    - Source diversity check
    - Confidence calibration (are HIGH claims really high quality?)

### P1 Artifacts

| Artifact                                  | Type         | Action                                            |
| ----------------------------------------- | ------------ | ------------------------------------------------- |
| Convergence-loop `research-claims` preset | Skill update | Add to `/convergence-loop`                        |
| Domain module configs                     | YAML files   | Create in `.claude/skills/deep-research/domains/` |
| Downstream adapter scripts                | JS/Bash      | Create in `scripts/` or inline in skill           |
| Searcher tool strategy refinements        | Agent update | Enhance `deep-research-searcher.md`               |

---

## P2: Enhancement Layer

**Goal:** Add the human-centered and intelligence features that make the system
genuinely unique. These are the differentiators identified by the
outside-the-box analysis.

**Estimated effort:** 800-1,200 additional lines **Prerequisite:** P1 in active
use, domain detection working

### P2 Capabilities

13. **Human-in-the-loop steering** -- Interaction hooks at phase transitions:
    - After breadth pass: show findings, ask which threads to deepen
    - After contradictions found: ask user for domain knowledge
    - Allow user to inject search terms, exclude sources, add findings
      mid-stream
    - Research plan is a living document editable at any point

14. **Research memory and cross-session building** -- Persistent research
    knowledge:
    - `.planning/research-index.jsonl` for fast topic lookup and overlap
      detection
    - Domain-specific staleness thresholds (tech: 7 days, academic: 90 days)
    - Incremental building: "last time we researched X, here's what changed"
    - MCP memory entities for cross-session entity graphs

15. **Serendipity register** -- During search, agents flag high-value out-of-
    scope findings. Final report includes "Unexpected Findings" section. Unique
    capability no competing tool offers.

16. **Negative research** -- Deliberately look for failures, abandoned
    approaches, and gaps. Add "negative questions" to decomposition: "What has
    been tried and failed?" and "What doesn't exist yet?"

17. **Academic research mode** -- Paper Search MCP integration, citation chain
    following, systematic review patterns. Adds `academic` search profile to the
    searcher agent.

### P2 Artifacts

| Artifact                             | Type              | Action                                |
| ------------------------------------ | ----------------- | ------------------------------------- |
| Steering hooks in SKILL.md           | Skill update      | Add interaction points                |
| Research index system                | JSONL + utilities | Create `research-index.jsonl` pattern |
| Searcher academic profile            | Agent update      | Add profile to searcher               |
| Serendipity section in output format | Agent update      | Add to synthesizer                    |

---

## P3: Advanced Capabilities

**Goal:** The full vision -- adversarial verification, codebase research, living
documents, and pedagogical output. Only build if P0-P2 are proven valuable.

**Estimated effort:** 1,000-1,500 additional lines **Prerequisite:** P2 in
active use, system has >20 research sessions completed

### P3 Capabilities

18. **Adversarial verification (Exhaustive mode)** -- Full 4-pass adversarial:
    - Pass 1: source-check (neutral)
    - Pass 2: discovery (adversarial -- "find what's wrong")
    - Pass 3: verification (resolve red-team challenges)
    - Pass 4: fresh-eyes (independent final assessment)

19. **Codebase research profile** -- `codebase` search profile for the searcher
    agent using Grep/Glob/Read. Enables "research our codebase's approach to X"
    queries that combine web research with local code analysis.

20. **Research as pedagogy** -- "Mental model" section in output. "Conceptual
    prerequisites" block. Reference user's known stack (from codebase) for
    analogies. Optional "walk me through it" mode. Build understanding, not just
    deliver facts.

21. **Living documents and decision provenance** -- Tag findings with staleness
    dates. Store decision-finding links for provenance. Implement `/stale-check`
    capability to detect when prior research may be outdated.

22. **Full Tier 4 self-audit** -- Complete 8-dimension quality assessment:
    Accuracy, Completeness, Relevance, Depth, Recency, Objectivity,
    Actionability, Verifiability. Plus adversarial challenge of key findings.

23. **Cognitive load management** -- For long reports, generate a reading guide
    prioritizing by relevance. "Decision-relevant summary" for executives. Offer
    "walk me through it" interactive mode.

24. **Cross-model verification** -- Use different model families for
    verification agents (Sonnet verifying Opus synthesis, or vice versa) to
    reduce same-model bias documented by the contrarian analysis.

### P3 Artifacts

| Artifact                      | Type                | Action                  |
| ----------------------------- | ------------------- | ----------------------- |
| Adversarial verification flow | Skill update        | Add to SKILL.md         |
| Codebase search profile       | Agent update        | Add profile to searcher |
| Pedagogy output sections      | Agent update        | Add to synthesizer      |
| Staleness check capability    | New skill or script | Create `/stale-check`   |
| Full self-audit engine        | Skill update        | Add Tier 4 to SKILL.md  |

---

## Phase Dependencies

```
P0 (MVP)
  |
  |-- P1 (Verification + Domains)
  |     |
  |     |-- P2 (Human + Intelligence)
  |     |     |
  |     |     |-- P3 (Advanced)
  |     |
  |     |-- P2 can start without P1 fully complete
  |           (steering and memory are independent of verification)
  |
  P0 must be fully working before P1 starts
  P1 must have convergence working before P3 adversarial
  P2 memory must exist before P3 staleness check
```

---

## Success Criteria by Phase

### P0 Success

- [ ] `/deep-research "question"` produces a cited report
- [ ] 2-4 parallel searcher agents complete without coordination failure
- [ ] Synthesizer combines findings without information loss
- [ ] Output includes confidence levels that correlate with actual quality
- [ ] State file enables resume after interruption
- [ ] Cost stays within estimated budget (2x max)
- [ ] Quick mode works in <90 seconds for simple questions
- [ ] Exhaustive mode produces >30 sources for complex questions

### P1 Success

- [ ] Convergence loop catches at least 1 error per 5 research sessions
- [ ] Domain detection correctly classifies >80% of queries
- [ ] At least 2 downstream adapters produce usable output
- [ ] Self-audit catches quality issues that P0 missed

### P2 Success

- [ ] User can redirect research mid-stream without restart
- [ ] Cross-session memory detects overlap with prior research
- [ ] Serendipity register surfaces at least 1 unexpected finding per 3 sessions
- [ ] Negative research reveals failures/gaps in at least 50% of sessions

### P3 Success

- [ ] Adversarial verification catches errors convergence loop missed
- [ ] Codebase research produces useful local + external combined reports
- [ ] Staleness check correctly identifies outdated research
- [ ] Pedagogical output measurably improves user comprehension

---

## Contrarian Checkpoints

At each phase transition, ask:

1. **Is the current phase actually being used?** If P0 has been used <5 times,
   do not proceed to P1. Use it more, discover real problems.
2. **What quality failures justify the next phase?** Document specific failures
   that the next phase's features would have prevented.
3. **Is the cost justified?** Each phase adds 500-1,500 lines of maintenance
   burden. Is the quality improvement worth it?
4. **Could a simpler solution work?** Before building a full downstream adapter,
   could a copy-paste workflow suffice? Before building memory, could the user
   just re-run research?

The contrarian's warning: "Karpathy's autoresearch achieves results in 630
lines. Every additional feature must earn its place through demonstrated quality
failures in the simple version."

---

## Total System Size Estimates

| Phase       | Cumulative Lines | Cumulative Cost/Session    | New Artifacts                           |
| ----------- | ---------------- | -------------------------- | --------------------------------------- |
| P0          | 950-1,350        | $3-$8 (Standard)           | 3 (1 skill, 2 agents)                   |
| P0+P1       | 1,450-2,150      | $4-$10 (with verification) | +4 (configs, presets, adapters)         |
| P0+P1+P2    | 2,250-3,350      | $5-$12 (with memory)       | +4 (index, profiles, hooks)             |
| P0+P1+P2+P3 | 3,250-4,850      | $8-$25 (full Exhaustive)   | +5 (adversarial, stale-check, pedagogy) |
