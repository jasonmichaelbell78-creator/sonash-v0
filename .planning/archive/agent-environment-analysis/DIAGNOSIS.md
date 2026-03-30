# Agent Environment Analysis — Diagnosis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## ROADMAP Alignment

**Aligned.** PLAN-v3.md Step 3.14 explicitly plans agent ecosystem
standardization (L2→L3 maturity, M effort, 3-5 sessions). This deep-plan
accelerates and expands that scope — adding external research, audit creation,
and convergence-loop-driven analysis that Step 3.14 doesn't cover.

## Current Agent Ecosystem

### By the Numbers

- **36 agents** total in `.claude/agents/`
- **24 custom** project agents (backend-architect, code-reviewer, etc.)
- **12 GSD** framework agents (gsd-planner, gsd-executor, etc.)
- **Line count range:** 37–1309 lines (35x variance)
- **Models:** mix of sonnet, opus, and unspecified
- **2 agents** missing model/tool specification (dependency-manager,
  documentation-expert)

### Quality Tiers (Verified)

| Tier   | Lines    | Count | Examples                                                              |
| ------ | -------- | ----- | --------------------------------------------------------------------- |
| Stub   | 37-42    | 12    | code-reviewer, debugger, backend-architect, security-auditor          |
| Light  | 65-121   | 5     | dependency-manager, documentation-expert, prompt-engineer             |
| Medium | 215-371  | 3     | nextjs-architecture-expert, mcp-expert, git-flow-manager              |
| Heavy  | 489-1309 | 16    | All GSD agents, fullstack-developer, security-engineer, test-engineer |

### Current Audit Coverage

Skill-ecosystem-audit Domain 5 checks 4 categories:

1. Agent prompt consistency (COMPLETE: return protocol)
2. Agent-skill alignment (CLAUDE.md triggers vs actual skills)
3. Parallelization correctness (dependency documentation)
4. Team config health (settings.json structure)

**What's NOT checked:** Agent behavioral quality, prompt effectiveness, model
appropriateness, tool list correctness, inter-agent coordination,
redundancy/overlap, external alternatives.

### Existing Plans (PLAN-v3.md Step 3.14)

- Zod 4 schemas for agent definitions
- Lifecycle formalization (definition → invocation → monitoring → deprecation)
- Health checker for agent ecosystem
- Inter-ecosystem contracts (agents↔skills, agents↔sessions)
- Invocation JSONL canonization
- Status: PLANNED, not started, depends on Step 3.12

## Key Findings

1. **Stub agents dominate custom agents** — 12 of 24 custom agents are 37-42
   line stubs. These are essentially role descriptions, not behavioral
   specifications. The GSD agents show what "good" looks like (489-1309 lines
   with structured workflows).

2. **No external benchmarking** — agents were created ad-hoc without researching
   what's available in the Claude Code ecosystem, GitHub, or marketplaces.
   Better agents may already exist.

3. **No agent audit capability** — the skill-ecosystem-audit checks structural
   properties but nothing behavioral. No way to evaluate whether an agent
   actually performs well at its stated purpose.

4. **Model assignment seems arbitrary** — some agents specify sonnet, some opus,
   some nothing. No documented criteria for which model an agent should use.

5. **Convergence loops not used for agent research** — the very tool designed
   for multi-pass verification hasn't been applied to understanding the agent
   ecosystem itself.

6. **Agent Teams enabled but undocumented** — settings.json has
   `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` but no skills or docs describe how
   to use teams effectively.

## Reframe Check

The task is what it appears to be — but it's larger than a single deep-plan.
This is really 4 workstreams:

1. **Research** — CL-driven analysis of current agents + external alternatives
2. **Audit creation** — `/create-audit` to build an agent audit skill
3. **Improvement plan** — prioritized fixes based on research + audit findings
4. **Process integration** — wire improvements into existing workflows

Recommendation: Plan all 4 workstreams now, execute in phases.
