# Research Synthesis — Agent Environment Analysis Phase 1

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
**Source:** Session #225, Phase 1 Step 1.5 — Team lead synthesis of all 4 research outputs
<!-- prettier-ignore-end -->

## Research Team

| Member           | Step | Output                  | Key Finding                                                                                |
| ---------------- | ---- | ----------------------- | ------------------------------------------------------------------------------------------ |
| inventory-agent  | 1.1  | AGENT_INVENTORY.md      | 36 agents: 11 stub, 5 light, 3 medium, 17 heavy. 2 redundancy clusters, 3 tool gaps        |
| gap-analyst      | 1.2  | WORKFLOW_GAPS.md        | 7 gaps totaling 360-675 min/month savings. Top: code-reviewer tracking, deep-plan underuse |
| external-scout   | 1.3  | EXTERNAL_RESEARCH.md    | 14.1k-star mega-collections, 11 unused frontmatter fields, strict CL convergence           |
| teams-researcher | 1.4  | AGENT_TEAMS_RESEARCH.md | Full API docs, 3-7x token cost, 4 team patterns, 4 infrastructure gaps                     |

---

## Cross-Cutting Theme 1: Stub Agents Are the Core Problem

**Inventory** found 11 stub agents (37-42 lines) — essentially role
descriptions, not behavioral specs. **External research** found mega-collections
(VoltAgent 127+, wshobson 112) with 300-800+ line agents covering edge cases,
tool guidance, and return protocols. **Workflow gaps** found mandated agents
(code-reviewer, systematic-debugging) show 0 invocations — stubs may not be
effective enough to auto-trigger.

**Synthesis:** Stub→heavy upgrade is the highest-ROI improvement. External
collections provide templates. Priority agents for upgrade: code-reviewer,
security-auditor, debugger, documentation-expert.

---

## Cross-Cutting Theme 2: 11 Unused Frontmatter Fields

**External research** identified 11 frontmatter fields we don't use: `memory`,
`isolation`, `skills`, `mcpServers`, `hooks`, `background`, `maxTurns`,
`permissionMode`, `disallowedTools`, plus advanced features. **Inventory**
confirmed no agents use these. **Teams research** identified
`isolation: worktree` as particularly valuable for parallel code editing.

**Synthesis:** Adopting these fields transforms agent capabilities without
changing prompt content:

| Field                 | Target Agents                             | Value                                   |
| --------------------- | ----------------------------------------- | --------------------------------------- |
| `memory: project`     | code-reviewer, debugger, security-auditor | Institutional knowledge across sessions |
| `isolation: worktree` | executor agents                           | Safe parallel edits                     |
| `disallowedTools`     | read-only agents                          | Explicit least-privilege                |
| `maxTurns`            | all agents                                | Prevent runaway execution               |
| `hooks`               | code-modifying agents                     | Auto-lint after edit                    |

---

## Cross-Cutting Theme 3: Invocation Tracking Is Blind

**Inventory** found invocations.jsonl tracks skills only, not agents. **Workflow
gaps** found code-reviewer shows 0 invocations despite being mandated
(hook-based invocations bypass logging). **Teams research** found no team
observability infrastructure.

**Synthesis:** Data infrastructure gap undermines all optimization. Without
knowing which agents are used, improvements are guesswork. Priority fix: wire
agent invocations into ecosystem-v2 JSONL.

---

## Cross-Cutting Theme 4: Redundancy Is Concentrated

**Inventory** found 2 clusters:

1. **Debugging** (5 agents, 80%+ overlap): debugger, error-detective,
   devops-troubleshooter, gsd-debugger, systematic-debugging skill
2. **Documentation** (3 agents, 95%+ overlap): technical-writer,
   documentation-expert, plus docs-maintain skill

**External research** found top ecosystems avoid this via clear scope boundaries
and auto-delegation descriptions. **Workflow gaps** confirmed neither cluster
shows invocations (all 0).

**Synthesis:** Consolidate each to 1 primary agent (promoted to medium/heavy) +
1 specialist (GSD-debugger stays). Use `description` improvements for
auto-delegation.

---

## Cross-Cutting Theme 5: Teams Are Ready but Untested

**Teams research** provided comprehensive API docs, cost model, and patterns.
**Inventory** confirmed GSD agents don't reference teams. **Workflow gaps**
found team orchestration is ad-hoc despite AGENT_ORCHESTRATION.md specs.

**This session's research-team is the first real test.** Observations:

- 4-member Explore+general-purpose team worked well for parallel research
- Message delivery is automatic and reliable
- Idle notification flood is real (~50% of inbox)
- Read-only agents (Explore) can't write output files — team lead must write
- All 4 members converged independently with no contradictions
- Total wall-clock time: ~10 minutes for 4 parallel research streams

**Recommendation:** Audit Team (P1) and Development Team (P2) are ready. Use
general-purpose subagent type when agents need to write files.

---

## Consolidated Recommendations (Priority-Ordered)

### P0: Infrastructure (Must-Have Before Other Improvements)

1. **Wire agent invocation logging** into ecosystem-v2 JSONL
2. **Fill 3 missing tool declarations** (dependency-manager,
   documentation-expert, gsd-nyquist-auditor)

### P1: High-ROI Agent Improvements

3. **Upgrade code-reviewer from stub (37 lines) to heavy** — most-mandated
   agent. Import two-stage review (spec→quality) from Superpowers
4. **Consolidate debugging cluster** — merge 3 stubs into 1 primary heavy agent
5. **Upgrade security-auditor** — import Trail of Bits methodology
6. **Consolidate documentation agents** — merge technical-writer +
   documentation-expert

### P2: Frontmatter Adoption

7. **Add `memory: project`** to code-reviewer, debugger, security-auditor
8. **Add `disallowedTools`** to read-only agents
9. **Add `isolation: worktree`** to code-modifying agents
10. **Add `maxTurns`** to all agents

### P3: Workflow Integration

11. **Implement Audit Team** pattern (cross-domain finding sharing)
12. **Implement Development Team** pattern (parallel test/doc writing)
13. **Add deep-plan heuristic** to session-start (>10 design decisions → prompt)
14. **Wire systematic-debugging** hook for error detection
15. **Add deferral tracking** mode to /debt-runner

### P4: Strategic Additions

16. **Compliance auditor** agent (privacy-first, SoNash aligned)
17. **Workflow orchestrators** (modeled on wshobson's 16 prebuilt)
18. **Team quality hooks** (TeammateIdle/TaskCompleted validation)
19. **Team observability** (adopt
    disler/claude-code-hooks-multi-agent-observability pattern)

---

## Contradictions Resolved

| Finding A                                  | Finding B                           | Resolution                                                                         |
| ------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------- |
| Inventory: "Model assignments appropriate" | External: "No documented criteria"  | Both true — assignments reasonable but criteria undocumented. Add to agent README. |
| Gaps: "code-reviewer 0 invocations"        | Inventory: "exists and mandated"    | Tracking gap, not usage gap. Hook invokes but doesn't log.                         |
| Teams: "3-7x token cost"                   | Gaps: "Teams save 60-120 min/month" | Cost justified for high-value workflows only. Subagents as default.                |
| External: "127+ agents available"          | Inventory: "36 agents, 11 stubs"    | Import selectively — upgrade stubs using external templates, don't bulk-import.    |

---

## Phase 2 Input

This synthesis feeds directly into Phase 2 (Audit Creation). Recommended audit
categories:

1. Prompt quality (stub vs heavy tier analysis)
2. Model appropriateness (Decision #18 criteria)
3. Tool list correctness (3 agents with missing declarations)
4. Return protocol compliance
5. Redundancy detection (2 clusters identified)
6. External benchmark (vs external collections)
7. Usage frequency (requires invocation logging fix)
8. Integration surface (CLAUDE.md Section 7 triggers)
9. Frontmatter completeness (11 unused fields)
10. Attention management (critical instructions front-loaded?)
11. Agent Teams readiness (team member capability)
