# Dynamic Agent Allocation Model

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Phase:** Discovery (distilled from Research phase)
**Source Reports:** MULTI_AGENT_PATTERNS, CUSTOM_AGENT_DESIGN, COST_TOKEN_ECONOMICS, ORCHESTRATION_PATTERNS, CONTRARIAN_ANALYSIS, SYNTHESIS
<!-- prettier-ignore-end -->

---

## Purpose

Define how many agents to spawn, what model each uses, how budget is allocated
across them, and when to scale up or down during a research session. This is the
economic and architectural heart of the system.

---

## Architecture: Skill-as-Orchestrator + Parallel Subagents

All research converges on **hub-and-spoke (orchestrator-workers)** as the only
validated production topology. Every commercial system (Google, OpenAI,
Perplexity, Anthropic) and every successful open-source system (STORM,
GPT-Researcher, DeerFlow) uses this pattern.

```
/deep-research SKILL.md (orchestrator, Opus)
  |
  |-- Searcher Agent 1 (Sonnet) -- Sub-question A
  |-- Searcher Agent 2 (Sonnet) -- Sub-question B
  |-- Searcher Agent 3 (Sonnet) -- Sub-question C
  |     [parallel execution, independent, no inter-agent communication]
  |
  |-- Synthesizer Agent (Sonnet) -- reads all FINDINGS.md files
  |
  |-- Verification (convergence-loop, inline) -- depth-dependent
```

**Why this topology:**

- Centralized error containment: 4.4x error amplification (centralized) vs 17.2x
  (independent agents) per Google/MIT scaling paper
- Natural parallelization: Anthropic achieved 90% latency reduction
- Clear accountability: orchestrator owns quality
- No coordination protocol needed between workers (they write to files)

**Key constraint:** Agents do NOT spawn other agents. Only the
skill/orchestrator spawns agents. This is a strict hierarchy: Skill -> Agent,
never Agent -> Agent.

---

## Agent Count by Depth Level

| Depth      | Searcher Agents | Synthesizer | Total Agents | Rationale                                        |
| ---------- | --------------- | ----------- | ------------ | ------------------------------------------------ |
| Quick      | 0 (solo mode)   | 0 (inline)  | 0            | Orchestrator handles everything in a single pass |
| Standard   | 2               | 1           | 3            | Minimum for parallel sub-topic coverage          |
| Deep       | 3               | 1           | 4            | Sweet spot per Google/MIT saturation threshold   |
| Exhaustive | 4-5             | 1           | 5-6          | Maximum before diminishing returns dominate      |

**Scaling principles:**

- Agent count should match sub-question count (1 searcher per sub-question
  group)
- Never exceed 5 concurrent searchers (saturation threshold from research)
- If more sub-questions than agents: batch sub-questions into groups per agent
- If fewer sub-questions than allocated agents: reduce agent count (don't waste)

**Quick mode is solo:** For simple factual lookups, spawning subagents adds
latency and cost without meaningful quality improvement. The orchestrator (Opus)
handles search, analysis, and synthesis inline.

---

## Model Tiering (Single Largest Cost Lever)

### Assignment Matrix

| Role                 | Model      | Cost/1M (in/out) | Rationale                                                                               |
| -------------------- | ---------- | ---------------- | --------------------------------------------------------------------------------------- |
| **Orchestrator**     | Opus 4.6   | $5 / $25         | Planning, synthesis, judgment, quality assessment. Quality caps the system.             |
| **Search Workers**   | Sonnet 4.6 | $3 / $15         | Tool use, search execution, information extraction. Near-Opus quality for search tasks. |
| **Synthesizer**      | Sonnet 4.6 | $3 / $15         | Reading and combining findings. Structured synthesis is well within Sonnet capability.  |
| **Verifier/Critic**  | Sonnet 4.6 | $3 / $15         | Cross-reference checking, gap detection. Pattern-matching against sources.              |
| **Citation Manager** | Haiku 4.5  | $1 / $5          | URL checking, format normalization. Purely mechanical tasks.                            |

### Cost Impact

For a standard 3-agent research session (~440K tokens):

| Strategy                                | Estimated Cost | Savings vs Opus-Only |
| --------------------------------------- | -------------- | -------------------- |
| All Opus                                | $8.50          | --                   |
| All Sonnet                              | $4.20          | 51%                  |
| **Tiered (Opus orch + Sonnet workers)** | **$3.80**      | **55%**              |
| Tiered + Haiku citations                | $3.40          | 60%                  |

**Recommendation:** Opus orchestrator + Sonnet workers. This matches Anthropic's
own multi-agent research system design and delivers ~55% savings over Opus-only.

### Cascade Pattern for Edge Cases

When a Sonnet worker encounters a task requiring deeper reasoning:

```
Sonnet worker attempts task
  -> If confidence < 0.6 on complex analysis
  -> Escalate to Opus for that specific subtask
  -> Return to Sonnet for remaining work
```

Expected escalation rate: 5-15% of worker tasks.

---

## Budget Allocation: 60/20/10/10

Every research session operates within a declared token budget, allocated across
four phases:

| Phase               | Budget Share | Purpose                                         | Enforcement                 |
| ------------------- | ------------ | ----------------------------------------------- | --------------------------- |
| **Search & Gather** | 60%          | WebSearch, WebFetch, source discovery           | Hard cap at allocated share |
| **Verification**    | 20%          | Cross-source verification, convergence loops    | Hard cap at allocated share |
| **Synthesis**       | 10%          | Draft generation, report writing                | Reserved -- always runs     |
| **Overhead**        | 10%          | Orchestration, routing, retries, error handling | Buffer for unexpected costs |

**Why 60/20/10/10:** Search is the most token-intensive phase (many tool calls,
large page reads). Verification is essential but bounded (convergence loops have
hard iteration caps). Synthesis is efficient (one pass over aggregated
findings). Overhead covers coordination and provides a safety margin.

### Per-Depth Budget Profiles

| Depth      | Total Budget | Search (60%) | Verify (20%) | Synth (10%) | Overhead (10%) |
| ---------- | ------------ | ------------ | ------------ | ----------- | -------------- |
| Quick      | 80K          | 48K          | 16K          | 8K          | 8K             |
| Standard   | 300K         | 180K         | 60K          | 30K         | 30K            |
| Deep       | 600K         | 360K         | 120K         | 60K         | 60K            |
| Exhaustive | 1.2M         | 720K         | 240K         | 120K        | 120K           |

---

## Budget Enforcement and Graceful Degradation

### Monitoring Thresholds

| Budget Consumed | Action                                                         |
| --------------- | -------------------------------------------------------------- |
| 70%             | Soft warning: prioritize remaining sub-questions by importance |
| 85%             | Stop spawning new search tasks, complete in-progress work      |
| 95%             | Forced synthesis with available findings + BUDGET-LIMITED flag |
| 100%            | Hard stop, return partial results with gap documentation       |

### Circuit Breakers

- If an agent retries the same operation 3 times -> kill the task
- If a single agent consumes >40% of total budget -> pause and reassess
- If total cost exceeds 2x original estimate -> require user confirmation

### Pre-Research Cost Estimation

Before research begins, the orchestrator provides a cost estimate:

```
Research Plan: "Compare React Server Components vs Islands Architecture"
Estimated depth: Standard
Sub-questions identified: 4
Estimated searches: 12-16
Estimated token budget: ~300K tokens
Estimated cost: $3.00-$5.00 (Sonnet workers)
```

---

## Dynamic Scaling During Research

### Scale-Up Triggers

- Sub-question produces conflicting sources -> spawn additional searcher to
  resolve
- Gap analysis reveals missing coverage area -> spawn searcher for new sub-topic
- User injects new sub-question mid-stream -> spawn searcher if budget allows

### Scale-Down Triggers

- Multiple searchers returning overlapping findings -> merge remaining sub-
  questions into fewer agents
- Budget reaching 70% threshold with many sub-questions remaining -> serialize
  remaining work into single agent
- Quick mode or simple factual query -> stay in solo mode, never spawn

### Agent Lifecycle

```
Spawned by orchestrator with:
  - Sub-question(s) assignment
  - Source strategy (which tools to use, which sources to prefer)
  - Output path (.planning/<topic>/research/<sub-query>-FINDINGS.md)
  - Budget allocation (max tokens for this agent)
  - Confidence requirements (minimum source count, verification depth)

Returns to orchestrator:
  - Structured status ("## RESEARCH COMPLETE")
  - Key findings summary (inline in return, not just file)
  - Confidence assessment
  - Gaps identified
  - Suggestions for additional research
```

---

## Minimum Viable Agent Set (P0 Build)

| Artifact                       | Type                 | Est. Lines | Priority |
| ------------------------------ | -------------------- | ---------- | -------- |
| `deep-research` SKILL.md       | Skill (orchestrator) | 200-300    | P0       |
| `deep-research-searcher.md`    | Custom agent         | 500-700    | P0       |
| `deep-research-synthesizer.md` | Custom agent         | 250-350    | P0       |

**Total: ~950-1,350 lines for MVP**

### What to Explicitly NOT Build

| Role                    | Why Not                                     |
| ----------------------- | ------------------------------------------- |
| Decomposer agent        | Inline in skill; needs orchestrator context |
| Critic/verifier agent   | `/convergence-loop` handles this            |
| Orchestrator agent      | Skill IS the orchestrator                   |
| Formatter agent         | Synthesizer handles output formatting       |
| Codebase-searcher agent | P2 variant, not needed for MVP              |

---

## Contrarian Considerations

### The single-agent question

The contrarian analysis warns that multi-agent improvement may come from token
spend, not agent count. A well-budgeted single agent might match multi-agent
performance. The design accounts for this: Quick mode is explicitly solo. If
usage data shows solo mode produces comparable quality to multi-agent at the
same budget, the multi-agent path can be deprecated.

### Agent count vs quality

Research says 3-5 is optimal, but this is task-dependent. For parallelizable
sub-topic research, the range is valid. For sequential reasoning tasks, adding
agents degrades performance by up to 70%. All deep-research sub-tasks are
designed to be parallelizable (different sub-questions, independent searches).

### Over-engineering warning

Karpathy's autoresearch achieves results in 630 lines. The proposed MVP at
950-1,350 lines is reasonable. The full system at 2,000-4,000 lines must be
justified by demonstrated quality failures in the MVP, not assumed necessity.
