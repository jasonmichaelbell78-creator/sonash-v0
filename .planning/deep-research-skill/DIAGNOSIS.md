# Diagnosis: Deep Research Skill/Agent(s)

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Task:** Design a deep-research skill and associated agents for thorough,
multi-source, domain-agnostic research within Claude Code
<!-- prettier-ignore-end -->

## ROADMAP Alignment

**Aligned** — The SoNash ROADMAP's "Evidence-Based" vision principle directly
supports a research capability. The skill fills a critical gap identified by gap
analysis: there is no standalone research invocation outside the GSD pipeline.
This capability strengthens the entire skill ecosystem by feeding deep-plan,
skill-creator, GSD, convergence-loop, TDMS, and memory.

## Research Conducted

**Scale:** 23 agents produced 24 research files totaling **111,087 words**
across **17,144 lines**, citing **200+ unique external sources**.

### Primary Research (18 dimensions)

| #   | Report                  | Words  | Key Contribution                                          |
| --- | ----------------------- | ------ | --------------------------------------------------------- |
| 1   | Industry Landscape      | 4,178  | 7 commercial + 7 open-source systems mapped               |
| 2   | Multi-Agent Patterns    | 4,700  | 3-5 agent sweet spot, hub-and-spoke validated             |
| 3   | Source Verification     | 4,700  | SAFE framework, confidence propagation rules              |
| 4   | Orchestration Patterns  | 4,361  | Adaptive hybrid execution, saturation detection           |
| 5   | Gap Analysis            | ~3,500 | No standalone research, 210 lines duplicated in GSD       |
| 6   | UX/Output Patterns      | 5,095  | 3-layer progressive disclosure, `[+][~][?][!]` confidence |
| 7   | Custom Agent Design     | ~3,000 | Hybrid: skill orchestrator + 2 custom agents              |
| 8   | Existing Tools          | 3,568  | Tavily/Brave/Firecrawl MCP as P1 integrations             |
| 9   | Convergence in Research | ~3,800 | 6 new convergence behaviors, tiered verification          |
| 10  | Domain-Agnostic Design  | 4,580  | CRAAP+SIFT universal framework, pluggable domain modules  |
| 11  | Source Registry         | 6,000  | 22 sources inventoried, 22-field metadata schema          |
| 12  | Cost & Token Economics  | ~4,500 | 4 depth tiers, 60/20/10/10 budget, 55% tiering savings    |
| 13  | Research Memory         | ~4,000 | 3-tier persistence, domain half-life staleness            |
| 14  | Error Recovery          | ~5,000 | 10 failure modes, checkpoint/resume, progressive output   |
| 15  | Security & Privacy      | ~4,500 | Query leakage, 4-tier classification, MCP security        |
| 16  | Quality Evaluation      | 6,800  | 8 dimensions, DRACO benchmarks, 7 anti-patterns           |
| 17  | Downstream Integration  | ~5,000 | 9 consumers, claims.jsonl backbone, adapter contracts     |
| 18  | Self-Audit Architecture | ~5,500 | 10 audit dimensions, 3 tiers, zero-tolerance fabrication  |

### Meta-Research (2 adversarial agents)

| #   | Report              | Key Contribution                                                                      |
| --- | ------------------- | ------------------------------------------------------------------------------------- |
| 19  | Contrarian Analysis | 5 challenges: citation error caught, over-engineering warning, LLM-as-judge blindspot |
| 20  | Outside the Box     | 5 blind spots: human-in-loop, pedagogy, serendipity, afterlife, unique value prop     |

### Audit Phase (3 agents)

| #   | Report                | Key Finding                                                          |
| --- | --------------------- | -------------------------------------------------------------------- |
| 21  | Cross-Reference Audit | 7 high-confidence claims, 8 contradictions, echo chamber MEDIUM-HIGH |
| 22  | Completeness Audit    | 87% complete (66/77 questions answered), proceed to Discovery        |
| 23  | Synthesis             | 929-line unified design vision with 10 design principles             |

## Relevant Existing Systems

| System              | Relationship                                                             | Pattern to Follow                                  |
| ------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| GSD researchers     | Direct predecessor — `gsd-project-researcher` and `gsd-phase-researcher` | Source hierarchy, confidence levels, output format |
| `/deep-plan`        | Primary consumer — research feeds Phase 0                                | DIAGNOSIS.md template, state file pattern          |
| `/convergence-loop` | Verification backbone — reuse for research claims                        | Programmatic mode, composable behaviors            |
| `/skill-creator`    | Downstream consumer — research informs skill creation                    | Discovery phase integration                        |
| TDMS                | Downstream consumer — research-discovered debt routes here               | intake-audit.js contract                           |
| Memory system       | Downstream consumer — durable insights persist                           | Auto-memory frontmatter format                     |

## Reframe Check

The task is what it appears to be — with one important reframe:

**Original framing:** "A deep-research skill/agent(s)" **Reframed:** "A research
orchestration system that is a skill + agent team, with downstream integration
as a first-class concern, and overkill as the default depth."

The outside-the-box agent identified the critical differentiator: this is NOT a
Perplexity clone in the terminal. It's a **contextual research system that leads
to action** — it knows the user's codebase, stack, constraints, and prior
decisions, and its outputs feed directly into planning, implementation, and
decision-making workflows. No external tool can do this.

## Core Design Principle

> **Overkill by default. Leave no stone unturned.**

This is a user directive, not a suggestion. Exhaustive is the default depth.
Quick/standard modes exist but are opt-in downgrades. Even quick mode should
exceed competitors' deep mode.

## Key Tensions to Resolve in Discovery

1. **Overkill vs pragmatism** — The user wants overkill; the contrarian warns
   about over-engineering. Resolution: build MVP first, prove value, layer
   complexity incrementally. But the MVP's "quick" mode should still be more
   thorough than competitors' "deep" mode.

2. **Domain-agnostic vs domain-expert** — CRAAP+SIFT works universally but can't
   replace domain-specific reasoning (legal, medical). Resolution: pluggable
   domain modules with behavioral overrides, not just parameter tuning.

3. **Multi-agent vs single-agent** — Research supports multi-agent but the
   improvement may come from token spend, not agent count. Resolution: build
   both paths (solo for quick, multi-agent for deep+exhaustive), let usage data
   decide.

4. **LLM-as-judge limitations** — Convergence loops have documented self-
   preference bias. Resolution: honest about limits, cross-model verification
   where possible, "raises confidence" not "confirms truth."

## Recommendation

**Proceed to Discovery.** The research corpus is 87% complete (per completeness
audit), with no unanswered questions and 11 partially-answered questions that
can be resolved through user input in Phase 1. The synthesis provides a clear
architectural vision with 11 open questions ready for Discovery.

**Artifacts location:** `.planning/deep-research-skill/research/` (24 files)
**Synthesis:** `.planning/deep-research-skill/research/SYNTHESIS.md` (930 lines)
