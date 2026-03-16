# Agent Environment Analysis — Implementation Plan

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Effort:** L (4-6 sessions) | **Decisions:** [DECISIONS.md](./DECISIONS.md) |
**Diagnosis:** [DIAGNOSIS.md](./DIAGNOSIS.md)

## Plan Overview

5 phases executed back-to-back. Each phase produces standalone value. Agent
Teams are used within execution where they add value (marked with [TEAM]).

```
Phase 1: Research (CL-driven)     → Agent inventory, external scan, Agent Teams deep-dive [TEAM: research-team]
Phase 2: Audit Creation           → /create-audit agent-quality (hybrid type)
Phase 3: Audit Execution          → Run the created audit on all agents [TEAM: audit-team]
Phase 4: Improvements             → Interactive per-agent fixes, new agents, team configs [TEAM: improvement-team]
Phase 5: Process Integration      → Wire into triggers, skills, hooks, token monitoring
```

## Agent Teams Used in This Plan

Teams are spawned at phase start and disbanded at phase end (ephemeral per
Decision #15, since each phase is a distinct workstream). This plan is our first
real Agent Teams usage — eat our own cooking.

| Team               | Phase | Members                                                        | Persistence      | Purpose                                   |
| ------------------ | ----- | -------------------------------------------------------------- | ---------------- | ----------------------------------------- |
| `research-team`    | 1     | inventory-agent, gap-analyst, external-scout, teams-researcher | Phase 1 duration | Cross-source synthesis during research    |
| `audit-team`       | 3     | reviewer, fixer                                                | Phase 3 duration | Persistent context across 36 agent audits |
| `improvement-team` | 4     | researcher, writer, reviewer                                   | Phase 4 duration | Three perspectives per agent improvement  |

---

## Phase 1: Research [TEAM: research-team]

**Goal:** Complete picture of current agents, external alternatives, Agent Teams
capabilities, and workflow gaps. CL-verified at every stage.

**Effort:** L (1-2 sessions)

### Step 1.0: Spawn Research Team

Create `research-team` with 4 named members:

```
TeamCreate("research-team")
  → inventory-agent: Internal agent cataloging + redundancy detection
  → gap-analyst: Workflow analysis + invocation pattern mining
  → external-scout: GitHub/marketplace/framework research
  → teams-researcher: Agent Teams docs + experimentation
```

**Coordination model:** Each member works Steps 1.1-1.4 respectively. The
coordinator (main conversation) runs inter-step synthesis via SendMessage after
each member completes a CL pass. Members flag cross-findings:

- inventory-agent finds a stub → sends to external-scout: "find replacement for
  X"
- gap-analyst finds unused workflow → sends to teams-researcher: "could a team
  help here?"
- external-scout finds a pattern → sends to inventory-agent: "does X already
  exist internally?"

**Done when:** Team spawned, members acknowledged roles.

### Step 1.1: Internal Agent Inventory (CL 3-pass) [inventory-agent]

Per Decision #7, run a 3-pass convergence loop on the current agent ecosystem.

**Pass 1:** Catalog all 36 agents with: name, lines, model, tools, description,
quality tier (stub/light/medium/heavy), last meaningful update, invocation
frequency (from invocations.jsonl).

**Pass 2:** Verify catalog accuracy — cross-check tool lists against what agents
actually use in their prompts, verify model assignments match frontmatter,
identify agents that reference non-existent scripts or paths.

**Pass 3:** Identify redundancies — agents with overlapping responsibilities
(e.g., devops-troubleshooter vs debugger, error-detective vs debugger,
security-auditor vs security-engineer).

**Output:** `.planning/agent-environment-analysis/AGENT_INVENTORY.md`

**Done when:** T20 tally shows convergence. Inventory reviewed by user.

### Step 1.2: Workflow Gap Analysis (CL multi-pass) [gap-analyst]

Per Decision #12, analyze invocation history and session patterns.

**Data sources:**

- `data/ecosystem-v2/invocations.jsonl` — skill/agent invocations
- `.claude/state/` — session state files
- Session patterns from SESSION_CONTEXT.md and session history

**Analysis:**

- Where does the user spend manual effort that an agent could handle?
- Which skills spawn agents vs do work inline that could be delegated?
- Which CLAUDE.md Section 7 triggers are missing agent assignments?
- Where do convergence loops run without dedicated verification agents?

**CL verification:** Multi-pass to ensure no workflow gaps are missed. Minimum 3
passes on invocation data, 2 passes on skill analysis.

**Output:** `.planning/agent-environment-analysis/WORKFLOW_GAPS.md`

**Done when:** Gap list reviewed by user. Each gap has: description, current
manual cost, proposed agent solution, priority (high/medium/low).

### Step 1.3: External Agent Research (CL 5-pass, strict convergence) [external-scout]

Per Decisions #3 and #8, search for better/replacement agents.

**Sources (search in order):**

1. Anthropic official Claude Code agent documentation
2. GitHub: `claude-code agents` repos, `.claude/agents` directory patterns
3. Superpowers marketplace and plugin ecosystem
4. Community repos and Claude Code forums/discussions
5. CrewAI/AutoGen — prompt techniques and architectural patterns (Decision #17)

**Per source, collect:**

- Agent definitions available
- Quality level (stub/detailed/framework)
- Compatibility with our frontmatter format
- Unique capabilities not in our ecosystem
- Prompt engineering techniques we could import

**CL verification (5+ passes, strict per Decision #8):**

- Pass 1: Broad search across all sources
- Pass 2: Verify sources not missed (check alternative search terms)
- Pass 3: Deep dive into top findings — read actual agent files
- Pass 4: Cross-reference findings — do multiple sources confirm quality?
- Pass 5: Final verification — any remaining gaps? Convergence declaration.

**Output:** `.planning/agent-environment-analysis/EXTERNAL_RESEARCH.md`

**Done when:** T20 tally shows strict convergence. Research reviewed by user.

### Step 1.4: Agent Teams Deep-Dive (Decision #9) [teams-researcher]

Per Decisions #2 and #9, research Agent Teams comprehensively.

**Research:**

1. **Anthropic docs/source:** TeamCreate, SendMessage, TeamDelete tool schemas.
   How do teams communicate? What's the message-passing model?
2. **GitHub patterns:** Search for repos using `TeamCreate` or
   `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. How do others use teams?
3. **Hands-on experimentation:** In a worktree, spawn a test team with 2
   members. Test: message passing, context sharing, persistence across tool
   calls, token cost of idle members, disbanding behavior.

**Architecture analysis:**

- Which of our workflows benefit from persistent teams (Decision #15)?
- Token cost model: idle cost, message cost, context growth rate
- Frequency threshold: how many invocations/session justifies persistence?
- Team composition patterns: which agents work well together?

**Output:** `.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md`

**Done when:** Experimentation complete. Team composition candidates identified.
Token cost model documented.

### Step 1.5: Research Team Synthesis

Before disbanding, run cross-team synthesis:

1. Each member sends final findings summary to coordinator via SendMessage
2. Coordinator identifies cross-cutting themes (e.g., external-scout found an
   agent that fills a gap-analyst gap)
3. Produce unified `.planning/agent-environment-analysis/RESEARCH_SYNTHESIS.md`
4. Present to user for review

**Done when:** Synthesis reviewed. Contradictions resolved. Team disbanded.

### Step 1.6: Step 3.14 Coverage Audit (Decision #6)

Per Decision #6, verify this plan covers everything in PLAN-v3.md Step 3.14.

**Check each 3.14 requirement:**

- [ ] 35 agent definitions standardized → covered by Phase 3 + 4
- [ ] Zod 4 schemas for definitions → add if missing from this plan
- [ ] Lifecycle formalization → covered by audit categories
- [ ] Health checker → covered by Phase 2 (audit creation)
- [ ] Inter-ecosystem contracts → covered by audit category 8 (integration)
- [ ] Invocation JSONL canonization → covered by Phase 5

**Output:** Gap list appended to DECISIONS.md if any 3.14 items are missing.

**Done when:** All 3.14 requirements mapped to this plan or explicitly deferred.

---

## Phase 2: Audit Creation

**Goal:** Create a dedicated agent audit skill using `/create-audit`. **Depends
on:** Phase 1 (research informs audit categories) **Effort:** M (1 session)

### Step 2.1: Prepare Audit Categories

Per Decisions #10 and #11, design the hybrid audit with expanded categories.

**Base categories (from Decision #11):**

1. Prompt quality (role clarity, specificity, behavioral instructions)
2. Model appropriateness (sonnet vs opus per Decision #18 criteria)
3. Tool list correctness (needs vs has, missing tools)
4. Return protocol compliance (COMPLETE: format)
5. Redundancy detection (overlapping agents)
6. External benchmark (better version available from Phase 1.3)
7. Usage frequency (invoked vs dormant)
8. Integration surface (skill/workflow connections)

**Expansion:** Cross-reference against skill-audit's 11 categories and other
audit category sets. Add categories that apply to agents:

- Attention management (critical instructions front-loaded in prompt?)
- Compaction awareness (does agent handle large contexts well?)
- Agent Teams readiness (can this agent work as a team member?)

**Output:** Final category list for `/create-audit` input.

**Done when:** Categories finalized, each with evaluation criteria and scoring
rubric.

### Step 2.2: Run /create-audit

Invoke `/create-audit agent-quality` with:

- **Type:** Hybrid (Decision #10) — automated structural checkers + interactive
  behavioral review
- **Categories:** From Step 2.1
- **TDMS integration:** Yes
- **Comprehensive inclusion:** After audit proves stable

Follow the create-audit workflow through all 7 phases. The skill we just audited
and improved will produce the agent audit.

**Output:** `.claude/skills/audit-agent-quality/SKILL.md` + companions

**Done when:** `/skill-audit` passes on the created audit (per create-audit
Phase 5 gate).

---

## Phase 3: Audit Execution [TEAM: audit-team]

**Goal:** Run the agent audit on all agents, starting with priority agents.
**Depends on:** Phase 2 (audit skill must exist) **Effort:** M-L (1-2 sessions)

### Step 3.0: Spawn Audit Team

Create `audit-team` with 2 named members:

```
TeamCreate("audit-team")
  → reviewer: Evaluates each agent against audit categories, scores findings
  → fixer: Proposes concrete fixes for each finding (prompt rewrites, model
    changes, tool list corrections)
```

**Coordination model:** Reviewer audits an agent, sends findings to fixer via
SendMessage. Fixer drafts improvements and sends back. Coordinator presents
reviewer findings + fixer proposals to user together for each agent.

**Persistent context benefit:** By agent #10, the team has seen patterns across
agents. Reviewer can flag "same issue as agents #3, #5, #7 — systemic gap"
instead of treating each as isolated. Fixer can reuse proven prompt patterns
from earlier fixes.

**Done when:** Team spawned, members acknowledged roles.

### Step 3.1: Priority Agent Audit

Per Decision #4, audit the most-invoked agents first:

- code-reviewer
- security-auditor
- Explore (built-in)
- documentation-expert
- All GSD agents referenced by workflows (gsd-planner, gsd-executor,
  gsd-phase-researcher, gsd-plan-checker, gsd-verifier)

For each agent: reviewer evaluates → fixer proposes → user decides.

**Done when:** Priority agents audited, findings documented.

### Step 3.2: Full Agent Audit

Audit remaining agents. Per Decision #5, flag unused stubs for pruning.

**Triage during audit:**

- **Keep + improve:** Agents that are invoked and valuable
- **Replace:** Agents where external research (Phase 1.3) found better versions
- **Prune:** Agents never invoked with no clear use case
- **Merge:** Redundant agents (identified in Phase 1.1 Pass 3)

**Output:** Per-agent disposition in audit findings.

### Step 3.3: Audit Team Debrief

Before disbanding:

1. Reviewer sends systemic patterns summary (most common gaps, recurring issues)
2. Fixer sends reusable prompt patterns that worked across multiple agents
3. Coordinator compiles into `AUDIT_PATTERNS.md` for Phase 4 use

**Done when:** All 36 agents audited. Disposition assigned to each. Team
disbanded. Patterns documented.

---

## Phase 4: Improvements [TEAM: improvement-team]

**Goal:** Implement improvements interactively, one agent at a time. **Depends
on:** Phase 3 (audit findings drive priorities) **Effort:** M-L (1-2 sessions)

### Step 4.0: Spawn Improvement Team

Create `improvement-team` with 3 named members:

```
TeamCreate("improvement-team")
  → researcher: Finds best practices, external examples, prompt patterns for
    the specific agent type being improved. Uses AUDIT_PATTERNS.md from Phase 3.
  → writer: Drafts the improved agent prompt based on researcher findings +
    audit-team fixer proposals. Produces complete .md file.
  → reviewer: Validates the draft against audit categories, checks for
    regressions, verifies return protocol and tool list.
```

**Coordination model:** For each agent improvement:

1. Researcher investigates (best practices for this agent type) → sends to
   writer
2. Writer drafts improved prompt → sends to reviewer
3. Reviewer validates → sends pass/fail + issues back to writer if needed
4. Final draft presented to user for approval

**Three perspectives benefit:** Researcher ensures we're not reinventing
patterns that exist. Writer focuses on quality prose. Reviewer catches issues
the writer is too close to see.

**Done when:** Team spawned, members acknowledged roles.

### Step 4.1: Agent Improvements (Interactive, per Decision #13)

For each agent with accepted improvements, the improvement-team produces a
draft. Present to user:

"Agent: [name]. Current: [tier]. Audit score: [N]. Team-proposed changes:
[list]. Implement now, backlog, or skip?"

**Improvement types:**

- **Prompt rewrite:** Upgrade stub to medium/heavy tier
- **Model change:** Reassign per Decision #18 criteria (lean opus)
- **Tool list fix:** Add missing tools, remove unused
- **External replacement:** Swap for better external agent (Decision #16, light
  adaptation)
- **New agent creation:** Fill workflow gaps from Phase 1.2
- **Merge:** Combine redundant agents

**Done when:** All priority agents improved. Backlog documented for remaining.

### Step 4.2: Agent Teams Configuration

Per Decisions #14 and #15, implement team configurations.

**For each workflow identified in Phase 1.4:**

1. Define team composition (which agents, what roles)
2. Determine persistence model (persistent vs ephemeral)
3. Write team spawn configuration (TeamCreate params)
4. Wire into the relevant skill/workflow

**Priority candidates (from Decision #14):**

- Audit execution teams
- Deep-plan execution teams
- Session lifecycle review team
- Convergence loop verification teams

**Done when:** At least 2 team configurations implemented and tested.

### Step 4.3: New Agent Creation

For workflow gaps identified in Phase 1.2 that aren't filled by existing or
external agents, create new agents.

**Per new agent:**

- Follow the quality standard set by GSD agents (medium/heavy tier)
- Model: opus unless analysis-only (Decision #18)
- Include COMPLETE: return protocol
- Test with a real invocation

**Done when:** All high-priority workflow gaps have an agent.

---

## Phase 5: Process Integration

**Goal:** Wire all improvements into existing processes. **Depends on:** Phase 4
(improvements must be implemented) **Effort:** M (1 session)

### Step 5.1: CLAUDE.md Section 7 Update (Decision #13a)

Update the trigger table with:

- New agents from Phase 4.3
- Revised agent assignments from Phase 4.1
- Agent Teams triggers where applicable
- Remove triggers for pruned agents

**Done when:** Section 7 reflects current agent ecosystem.

### Step 5.2: Skill Workflow Integration (Decision #13b)

Update skills that should spawn agents or teams:

- `/convergence-loop` — team-based verification where applicable
- `/deep-plan` — agent delegation in execution routing
- `/skill-audit` — agent-based verification in Phase 5
- `/create-audit` — agent architecture recommendations in discovery
- Other skills identified in Phase 1.2

**Done when:** Skills reference correct agents with correct invocation patterns.

### Step 5.3: Hook Integration (Decision #13d)

Wire agent improvements into pre-commit/pre-push hooks where valuable:

- Agent-based code review in pre-push (if frequency justifies)
- Agent-based security scan trigger on security file changes
- Other hook-based agent triggers from research

**Done when:** Hooks updated, tested with dry-run.

### Step 5.4: Token Monitoring (Decision #20)

Build the token monitoring pipeline:

**Data layer:**

- Hook on Task tool that logs `{team, agent, tokens, timestamp}` to
  `.claude/state/agent-token-usage.jsonl`

**Surface 1 — Statusline:**

- Add agent team token count to GSD statusline hook
- Format: `Teams: N active | Tokens: Nk`

**Surface 2 — Session-end:**

- Add "Agent Teams" section to `/session-end` metrics
- Per-team: name, members, messages, tokens, cost estimate

**Surface 3 — Alerts:**

- Add "Agent Cost" category to `/alerts`
- Track: session trend, per-team averages, threshold warnings

**Done when:** All three surfaces functional. JSONL logging verified.

### Step 5.5: Invocation Tracking Canonization (from Step 3.14)

Per Decision #6, canonize agent invocation JSONL format:

- Schema: `{agent, team, model, tokens, duration, success, context, timestamp}`
- Validate with existing `validate-schema.js`
- Update `write-invocation.js` if needed

**Done when:** Schema documented, validation passing.

---

## Audit Checkpoint

After Phase 5, run:

1. `code-reviewer` agent on all modified files
2. `/skill-ecosystem-audit` Domain 5 to verify agent orchestration health
3. Coverage check against PLAN-v3.md Step 3.14 requirements
4. User retro: "What did research surface that you didn't expect?"

---

## Parallelization Notes

- **Steps 1.1-1.4 run in parallel via research-team** — each member owns a step.
  Cross-findings shared via SendMessage during execution.
- Step 1.5 (synthesis) depends on all members completing → Step 1.6 (3.14 audit)
  depends on synthesis
- Phase 2 depends on Phase 1 (categories informed by research)
- **Steps 3.1 and 3.2 are sequential** but audit-team persists across both,
  building accumulated context
- **Steps 4.1, 4.2, 4.3 partially overlap** — improvement-team handles 4.1,
  coordinator handles 4.2 team configs in parallel when waiting for user
  decisions
- Steps 5.1-5.5 can partially overlap (independent integration targets)

## Team Lifecycle

```
Phase 1: research-team spawned → 4 members work 1.1-1.4 in parallel → synthesis → disband
Phase 2: no team (interactive /create-audit)
Phase 3: audit-team spawned → reviewer+fixer across 36 agents → debrief → disband
Phase 4: improvement-team spawned → researcher+writer+reviewer per agent → disband
Phase 5: no team (integration scripting)
```

Total team member-sessions: 9 (4 + 2 + 3). Each team is ephemeral to its phase.

## Risk Mitigation

- **Agent Teams experimentation could break things:** Use worktree isolation
- **External research may find nothing useful:** Plan still delivers value
  through internal audit and improvements alone
- **Token monitoring adds overhead:** Start with JSONL logging only, add
  surfaces incrementally. Kill switch: disable the hook.
- **Scope creep:** Each phase has "Done when" criteria. If a phase exceeds
  estimate, pause and reassess before continuing.
