# Audit Agent Quality — Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Category definitions, scoring rubrics, agent prompt templates, and operational
details for the audit-agent-quality skill.

---

## 11 Evaluation Categories

### Category 1: Prompt Quality (Weight: 15%)

**What it evaluates:** Role clarity, specificity of instructions, behavioral
guidance, edge case handling, structured workflow presence.

| Score | Criteria                                                       |
| ----- | -------------------------------------------------------------- |
| 9-10  | Comprehensive workflow, edge cases covered, clear role framing |
| 7-8   | Good instructions, some gaps in edge cases                     |
| 5-6   | Basic instructions, missing workflow structure                 |
| 3-4   | Minimal role description, no behavioral guidance               |
| 1-2   | Stub — just a title and generic description                    |

### Category 2: Model Appropriateness (Weight: 10%)

**What it evaluates:** Whether the assigned model matches the agent's complexity
and purpose per Decision #18 criteria.

| Score | Criteria                                                                        |
| ----- | ------------------------------------------------------------------------------- |
| 9-10  | Model explicitly set, matches complexity (opus for complex, sonnet for routine) |
| 7-8   | Model set, reasonable choice but could be optimized                             |
| 5-6   | Model set but questionable (e.g., haiku for complex analysis)                   |
| 3-4   | Model unspecified (inherits, may be inappropriate)                              |
| 1-2   | Model actively wrong for the use case                                           |

### Category 3: Tool List Correctness (Weight: 10%)

**What it evaluates:** Tool declarations match actual needs. No missing tools,
no unnecessary tools, explicit least-privilege.

| Score | Criteria                                                                  |
| ----- | ------------------------------------------------------------------------- |
| 9-10  | Tools explicitly listed, match prompt references, least-privilege applied |
| 7-8   | Tools listed and mostly correct, minor gaps                               |
| 5-6   | Tools listed but some mismatches with prompt content                      |
| 3-4   | Tools missing entirely (inherits all — no least-privilege)                |
| 1-2   | Tools declared but wrong (references tools agent can't use)               |

### Category 4: Return Protocol Compliance (Weight: 5%)

**What it evaluates:** Agent includes COMPLETE: return format per
SKILL_STANDARDS.md.

| Score | Criteria                                         |
| ----- | ------------------------------------------------ |
| 9-10  | COMPLETE: protocol present with output path      |
| 5-6   | Partial return protocol (missing path or format) |
| 1-2   | No return protocol defined                       |

### Category 5: Redundancy (Weight: 10%)

**What it evaluates:** Whether this agent overlaps significantly with other
agents in scope, description, or purpose.

| Score | Criteria                                                |
| ----- | ------------------------------------------------------- |
| 9-10  | Unique scope, clearly differentiated from all neighbors |
| 7-8   | Minor overlap with 1 agent, clear scope boundaries      |
| 5-6   | Moderate overlap with 2+ agents, boundaries unclear     |
| 3-4   | High overlap (80%+) with another agent                  |
| 1-2   | Near-duplicate of another agent                         |

### Category 6: External Benchmark (Weight: 5%)

**What it evaluates:** How this agent compares to best-in-class external agents
found during Phase 1 research. Reference: EXTERNAL_RESEARCH.md.

| Score | Criteria                                                      |
| ----- | ------------------------------------------------------------- |
| 9-10  | Exceeds or matches best external equivalents                  |
| 7-8   | Comparable to external agents                                 |
| 5-6   | Below external standard but has unique project-specific value |
| 3-4   | Significantly below external standard                         |
| 1-2   | External replacement available that's clearly superior        |

### Category 7: Usage Frequency (Weight: 5%)

**What it evaluates:** Whether the agent is actually invoked. Based on
invocations.jsonl + CLAUDE.md triggers + session history.

| Score | Criteria                                                |
| ----- | ------------------------------------------------------- |
| 9-10  | Regularly invoked (5+/month) or mandated by CLAUDE.md   |
| 7-8   | Occasionally invoked (1-4/month)                        |
| 5-6   | Rarely invoked but has clear use case                   |
| 3-4   | Never invoked, theoretical use case only                |
| 1-2   | Never invoked, no clear use case, candidate for pruning |

### Category 8: Integration Surface (Weight: 10%)

**What it evaluates:** How well the agent connects to skills, workflows,
CLAUDE.md triggers, and other agents.

| Score | Criteria                                              |
| ----- | ----------------------------------------------------- |
| 9-10  | Referenced in CLAUDE.md triggers + skills + workflows |
| 7-8   | Referenced in 2 of 3 integration points               |
| 5-6   | Referenced in 1 integration point                     |
| 3-4   | Not referenced anywhere but could be                  |
| 1-2   | Orphaned — no integration points                      |

### Category 9: Frontmatter Completeness (Weight: 10%)

**What it evaluates:** How many of the 14 available frontmatter fields are
utilized (name, description, model, tools, disallowedTools, permissionMode,
maxTurns, skills, mcpServers, hooks, memory, background, isolation).

| Score | Criteria                                                       |
| ----- | -------------------------------------------------------------- |
| 9-10  | Uses 6+ relevant fields including memory/isolation/hooks       |
| 7-8   | Uses 4-5 fields (name, description, model, tools + 1 advanced) |
| 5-6   | Uses 3 fields (name, description, model or tools)              |
| 3-4   | Uses 2 fields (name, description only)                         |
| 1-2   | Missing required fields                                        |

### Category 10: Attention Management (Weight: 10%)

**What it evaluates:** Whether critical instructions are front-loaded, uses
checklists over prose, repeats key rules at point-of-use.

| Score | Criteria                                                           |
| ----- | ------------------------------------------------------------------ |
| 9-10  | Critical rules in first third, checklists used, key rules repeated |
| 7-8   | Good structure, minor attention management gaps                    |
| 5-6   | Adequate structure but critical info buried                        |
| 3-4   | Wall of text, no structural hierarchy                              |
| 1-2   | Stub — too short to evaluate                                       |

### Category 11: Agent Teams Readiness (Weight: 10%)

**What it evaluates:** Whether this agent could work effectively as a team
member — clear role boundaries, messaging-compatible output, scope that
complements other agents.

| Score | Criteria                                                           |
| ----- | ------------------------------------------------------------------ |
| 9-10  | Explicit team-ready design (role, messaging, scope boundaries)     |
| 7-8   | Could work as team member with minor adaptation                    |
| 5-6   | Would need significant adaptation for team use                     |
| 3-4   | Too generic or too coupled to work in a team                       |
| 1-2   | Not team-compatible (e.g., overlaps with every potential teammate) |

### Category 12: Reference Code Patterns (Weight: 5%)

**What it evaluates:** Whether the agent includes embedded code examples,
templates, or patterns that improve output quality for its domain.

| Score | Criteria                                                                      |
| ----- | ----------------------------------------------------------------------------- |
| 9-10  | Comprehensive project-specific patterns (correct idioms, anti-patterns shown) |
| 7-8   | Good code examples covering main use cases                                    |
| 5-6   | Some code examples but generic (not project-specific)                         |
| 3-4   | No code examples but domain would clearly benefit from them                   |
| 1-2   | No code examples AND agent produces code as output (critical gap)             |
| N/A   | Agent does not produce or evaluate code (score excluded from composite)       |

### Category 13: Script Automation (Weight: 5%)

**What it evaluates:** Whether the agent leverages executable scripts (via Bash
tool) as part of its workflow — linters, validators, test runners, state
management tools, or custom project scripts.

| Score | Criteria                                                                   |
| ----- | -------------------------------------------------------------------------- |
| 9-10  | Runs project-specific scripts that automate key workflow steps             |
| 7-8   | Runs standard CLI tools (eslint, jest, git) as part of structured workflow |
| 5-6   | Has Bash tool but only uses it for basic commands (ls, cat)                |
| 3-4   | Has Bash tool but no script execution instructions in prompt               |
| 1-2   | No Bash tool AND workflow would clearly benefit from script automation     |
| N/A   | Agent's purpose doesn't benefit from script execution (score excluded)     |

---

## Scoring Formula

**Per-agent composite (0-100):**

```
score = (C1 * 0.13) + (C2 * 0.08) + (C3 * 0.08) + (C4 * 0.05) +
        (C5 * 0.08) + (C6 * 0.05) + (C7 * 0.05) + (C8 * 0.08) +
        (C9 * 0.08) + (C10 * 0.08) + (C11 * 0.08) +
        (C12 * 0.08) + (C13 * 0.08)

# 13 categories, weights rebalanced to sum to 1.0
# C12/C13 can be N/A — if excluded, redistribute weight proportionally
# Each category scored 0-10, then weighted and multiplied by 10
```

**Ecosystem grade:**

| Mean Score | Grade |
| ---------- | ----- |
| 90-100     | A     |
| 80-89      | B     |
| 70-79      | C     |
| 60-69      | D     |
| Below 60   | F     |

---

## Stage 1 Agent Prompt Templates

### Agent 1A: Frontmatter Validator

```
You are a frontmatter validation agent. Scan ALL .md files in .claude/agents/.

For each agent, check:
1. name field present and lowercase-kebab-case
2. description field present, specific (not generic), includes "Use proactively" or "Use when"
3. model field present (sonnet/opus/haiku/inherit)
4. tools field present with explicit list (not omitted = inherits all)
5. Advanced fields used: memory, isolation, hooks, maxTurns, permissionMode,
   disallowedTools, skills, mcpServers, background

Examples of findings:
- Bad: description is "Use this agent for debugging" (generic, no trigger context)
  Good: "Use when encountering test failures or unexpected runtime behavior to perform systematic root-cause analysis"
- Bad: tools omitted entirely (inherits all — violates least-privilege)
  Good: tools: Read, Grep, Bash (matches what the agent actually needs)

Write one JSONL line per finding to AUDIT_DIR/stage-1a-frontmatter.jsonl.
Finding schema: {"category":"frontmatter","title":"...","fingerprint":"frontmatter::FILE::ISSUE","severity":"S2","effort":"E0","confidence":90,"files":["path"],"why_it_matters":"...","suggested_fix":"..."}

COMPLETE: 1A wrote N findings to AUDIT_DIR/stage-1a-frontmatter.jsonl
```

### Agent 1B: Tool & Model Checker

```
You are a tool and model verification agent. For each agent in .claude/agents/:

1. Read the frontmatter tool list
2. Read the prompt body — identify tool references (Read, Write, Edit, Bash, Grep, etc.)
3. Flag: tools in frontmatter but never referenced in prompt
4. Flag: tools referenced in prompt but not in frontmatter
5. Check model assignment against complexity (heavy prompts should use opus)
6. Check for references to non-existent scripts, paths, or files

Examples of findings:
- Bad: tools: Read, Write, Edit, Bash, Grep (full list) when prompt only uses Read
  Good: tools: Read, Grep (matches actual prompt references)
- Bad: model unspecified on a 500-line agent with complex analysis workflow
  Good: model: opus (matches heavy-tier complexity)

Write JSONL findings to ${AUDIT_DIR}/stage-1b-tools.jsonl.

COMPLETE: 1B wrote N findings to ${AUDIT_DIR}/stage-1b-tools.jsonl
```

### Agent 1C: Redundancy & Integration Scanner

```
You are a redundancy and integration scanner. Analyze all agents in .claude/agents/:

1. Compare description fields — flag pairs with >80% semantic overlap
2. Check CLAUDE.md Section 7 trigger tables — which agents are referenced?
3. Check .claude/skills/ — which agents are spawned by skills?
4. Read data/ecosystem-v2/invocations.jsonl — agent invocation counts
5. Identify orphaned agents (no triggers, no skill refs, no invocations)
6. Identify redundancy clusters (3+ agents in same domain)

Write JSONL findings to ${AUDIT_DIR}/stage-1c-redundancy.jsonl.

COMPLETE: 1C wrote N findings to ${AUDIT_DIR}/stage-1c-redundancy.jsonl
```

---

## History JSONL Schema

Path: `.claude/state/audit-agent-quality-history.jsonl`

```json
{
  "date": "2026-03-17",
  "agents_total": 36,
  "agents_audited": 36,
  "ecosystem_grade": "C",
  "mean_score": 72,
  "structural_findings": 15,
  "behavioral_findings": 28,
  "decisions": { "improve": 8, "backlog": 12, "skip": 16 },
  "top_gap": "prompt-quality",
  "cl_corrections": 3
}
```

---

## Artifact Contracts

| Artifact       | Producer    | Consumer                      | Lifetime   |
| -------------- | ----------- | ----------------------------- | ---------- |
| State file     | This skill  | This skill (resume) + Phase 4 | Persistent |
| JSONL findings | Stage 1 + 3 | TDMS pipeline                 | Persistent |
| History JSONL  | Stage 3     | /alerts, /session-begin       | Persistent |
| Report MD      | Stage 3     | User, /session-end            | Persistent |

---

## Anti-Patterns (MUST avoid)

1. **Scoring stubs identically without reading prompts** — every stub has
   different content even if line counts are similar. Read each one.
2. **Skipping mid-audit CL** — score drift is real. By agent #12, your context
   changes how you'd score agent #3. Run the verification pass.
3. **Batch-approving without reviewing fixer proposals** — fixer drafts need
   human review. A bad prompt rewrite is worse than no rewrite.
4. **Treating all GSD agents as a monolith** — they share an ecosystem but have
   individual quality levels. Score each independently.
5. **Ignoring Stage 1 structural findings during Stage 2** — structural data is
   objective evidence. If Stage 1 found missing tools, Stage 2 tool score should
   reflect that.

---

## Agent Priority Order

Audit agents in this order (most-invoked and most-critical first):

1. **Priority agents** (mandated by CLAUDE.md or high invocation):
   code-reviewer, security-auditor, Explore, documentation-expert,
   frontend-developer, fullstack-developer, test-engineer

2. **GSD agents** (tightly integrated ecosystem — audit as group): gsd-planner,
   gsd-executor, gsd-phase-researcher, gsd-plan-checker, gsd-verifier,
   gsd-debugger, gsd-roadmapper, gsd-codebase-mapper, gsd-integration-checker,
   gsd-nyquist-auditor, gsd-research-synthesizer, gsd-project-researcher

3. **Remaining custom agents** (alphabetical): backend-architect,
   database-architect, debugger, dependency-manager, deployment-engineer,
   devops-troubleshooter, error-detective, git-flow-manager,
   markdown-syntax-formatter, mcp-expert, nextjs-architecture-expert,
   penetration-tester, performance-engineer, prompt-engineer,
   react-performance-optimization, security-engineer, technical-writer,
   ui-ux-designer
