# research-plan-team

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-24
**Status:** ACTIVE
**Source:** agent-env Phase 4, Step 4.2
<!-- prettier-ignore-end -->

## Purpose

Coordinates the deep-research to deep-plan pipeline when a single topic flows
through both phases. The researcher investigates domain knowledge, the planner
translates findings into actionable decisions and steps, and the verifier
performs convergence-loop verification on claims and plan assumptions. This team
exists because the three roles benefit from direct inter-agent communication
during execution -- the planner can ask the researcher for clarification, and
the verifier can challenge both.

## Member Roster

| #   | Agent Name | Role                | Model  | Tools                                       | Purpose                                                                                          |
| --- | ---------- | ------------------- | ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | researcher | Domain investigator | sonnet | Read, Grep, Glob, Bash, WebSearch, WebFetch | Investigates domain, evaluates sources, produces evidence-backed findings with confidence levels |
| 2   | planner    | Decision architect  | opus   | Read, Write, Edit, Bash, Grep, Glob         | Translates research findings into decisions, steps, dependencies, and effort estimates           |
| 3   | verifier   | CL auditor          | sonnet | Read, Grep, Glob, Bash                      | Convergence-loop verification of claims and plan assumptions; challenges unsupported assertions  |

### Why 3 Members

The research-to-plan pipeline has three distinct cognitive modes that benefit
from separation:

1. **researcher** -- divergent thinking, broad source evaluation, evidence
   gathering. Optimized for breadth.
2. **planner** -- convergent thinking, decision-making, step sequencing.
   Optimized for structure. Uses opus because plan quality directly determines
   implementation success (per Decision #18: lean opus for high-stakes output).
3. **verifier** -- adversarial thinking, assumption challenging, claim
   verification. Optimized for rigor.

Without a team, these modes compete for attention in a single context window.
The planner starts structuring before research is complete; the verifier's
challenges get buried in research noise. Separation ensures each mode runs to
convergence independently.

### Token Cost Justification

- 3-member team: ~4x solo cost (per research model)
- Justified when: research topic is complex (3+ sub-questions), plan will drive
  multi-session implementation, or claims need independent verification
- NOT justified for: simple research questions, plans with < 3 phases, topics
  where the user already has strong domain knowledge

## Spawn Trigger

Spawn this team when ALL of these conditions are met:

1. **`/deep-research` followed by `/deep-plan`** on the same topic within one
   session
2. **Research complexity is L or XL** (3+ sub-questions, multiple source types)
3. **Plan will drive multi-session implementation** (not a quick task)

Also spawn when:

4. **`/deep-plan` with `--research` flag** requesting integrated research phase
5. **Plan phase involves domain the user explicitly flags as unfamiliar**

Do NOT spawn for:

- Simple `/deep-research` that won't feed into a plan (use subagents)
- `/deep-plan` on a well-understood topic (planner works solo)
- Research with 1-2 sub-questions (subagent searchers are sufficient)
- Any case where the user says "quick plan" or "rough plan" (subagent)

## Coordination Model

```
                    +------------------+
                    |   Team Lead      |
                    | (main session)   |
                    +--------+---------+
                             |
              Topic + constraints
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v--------+  +------v-------+  +--------v--------+
|   researcher     |  |   planner    |  |   verifier       |
| Domain research  |  | Decisions &  |  | CL verification  |
| Source evaluation|  | step design  |  | Claim challenges  |
| Evidence scoring |  | Dependencies |  | Assumption tests  |
+--------+--------+  +------+-------+  +--------+--------+
         |                   |                   |
         +------- msg ------>|                   |
         |                   +------- msg ------>|
         |<------ msg -------+                   |
         |                   |<------ msg -------+
         |                   |                   |
         +-------------------+-------------------+
                             |
                    Final plan to Lead
```

### Phase 1: Research (researcher-driven)

1. **Lead -> researcher:** "Research [topic]. Sub-questions: [list]. Evaluate
   sources with confidence levels. Send findings to planner after each
   sub-question convergence."
2. **researcher -> planner (progressive):** After each sub-question converges,
   sends findings with evidence quality scores. Planner can begin structuring
   early.
3. **planner -> researcher (clarification):** "Need more detail on [specific
   finding]. What are the constraints around [X]?" Direct inter-agent
   communication avoids round-tripping through the lead.

### Phase 2: Planning (planner-driven)

4. **planner drafts plan** using research findings. Structures decisions, steps,
   dependencies, effort estimates.
5. **planner -> verifier:** "Verify these claims: [list]. Check these
   assumptions: [list]. Challenge any unsupported assertions."
6. **verifier -> planner:** "Claim #3 unsupported -- researcher found X but
   planner inferred Y without evidence. Claim #7 confirmed. Assumption #2 needs
   qualification."
7. **planner revises** based on verifier feedback. Second verification pass if
   needed.

### Phase 3: Convergence (verifier-driven)

8. **verifier -> Lead:** "Verification complete. N claims verified, M
   challenged, K revised. Residual risks: [list]."
9. **Lead -> user:** Presents plan with verification status. Flags any claims
   the verifier could not confirm.

### Inter-Agent Communication Benefits

This is why a team (not subagents) is needed:

- **Step 3:** Planner asks researcher for clarification directly. With
  subagents, this would require the lead to relay, doubling latency and losing
  context.
- **Step 6:** Verifier challenges planner directly. The adversarial exchange
  produces sharper plans than a single-pass review.
- **Progressive handoff (Step 2):** Planner starts structuring before all
  research is complete, enabled by real-time messaging.

## Persistence Model

**Ephemeral (per research-plan cycle).**

Rationale:

- Each research-plan cycle is a discrete workstream with clear boundaries
- The team's accumulated context (research findings, plan decisions,
  verification results) is captured in output documents, not in team state
- Persistent teams would idle between research-plan cycles, burning tokens
- One team per session limit (Claude Code constraint) means a persistent
  research-plan team would block other team usage

### Lifecycle

```
1. /deep-research triggers team consideration
2. Lead evaluates complexity against spawn criteria
3. TeamCreate("research-plan-team") with 3 members
4. Phase 1: Research (researcher drives, planner receives progressively)
5. Phase 2: Planning (planner drives, verifier challenges)
6. Phase 3: Convergence (verifier confirms, lead receives)
7. Lead presents verified plan to user
8. TeamDelete after user approves or modifies plan
```

Expected duration: 30-90 minutes depending on research depth and plan
complexity.

## Example Invocation

### TeamCreate Call

```
TeamCreate("research-plan-team")
  members:
    - name: "researcher"
      role: "Domain investigator. Research the assigned topic using web search,
            codebase analysis, and documentation review. For each sub-question,
            produce findings with confidence levels (HIGH/MEDIUM/LOW) and source
            citations. Send findings progressively to planner via SendMessage
            as each sub-question converges. Respond to planner clarification
            requests directly."
      model: "sonnet"
      tools: ["Read", "Grep", "Glob", "Bash", "WebSearch", "WebFetch"]

    - name: "planner"
      role: "Decision architect. Receive research findings from researcher.
            Structure into a plan with: decisions (numbered, with rationale),
            steps (with dependencies and effort estimates), phases (with done-
            when criteria). Ask researcher for clarification when findings are
            ambiguous. Send draft claims and assumptions to verifier for CL
            verification before finalizing."
      model: "opus"
      tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]

    - name: "verifier"
      role: "Convergence loop auditor. Receive claims and assumptions from
            planner. For each claim: verify against researcher evidence, flag
            unsupported inferences, challenge assumptions without evidence.
            Return verification results with status (VERIFIED / CHALLENGED /
            NEEDS_QUALIFICATION) and specific issues. Run minimum 2 passes
            on the full claim set."
      model: "sonnet"
      tools: ["Read", "Grep", "Glob", "Bash"]
```

### Task Assignment Example (deep-research on "state management migration")

```
# Phase 1: Research
SendMessage("researcher", "Research state management migration from Context API
  to Zustand for the SoNash project. Sub-questions:
  1. What are the migration patterns for React 19 + Context -> Zustand?
  2. What are the performance implications for our 12 context providers?
  3. What breaking changes exist in Zustand v5 with React 19?
  4. What is the migration effort for projects of our size (50-80 components)?
  Send findings to planner after each sub-question converges.")

# Phase 2: Planning (after researcher sends findings)
SendMessage("planner", "Using researcher findings, create a migration plan.
  Structure as: decisions, phases, steps with dependencies. Send claims and
  assumptions to verifier before finalizing.")

# Phase 3: Verification (after planner sends claims)
SendMessage("verifier", "Verify planner's claims and assumptions against
  researcher evidence. Flag any unsupported inferences. Minimum 2 verification
  passes.")
```

### Debrief and Teardown

```
SendMessage("researcher", "Final summary: key findings, confidence levels,
  gaps in available evidence.")
SendMessage("planner", "Final plan with verification annotations.")
SendMessage("verifier", "Verification summary: N verified, M challenged,
  K qualified. Residual risks.")
# Lead compiles into PLAN.md + DECISIONS.md
TeamDelete("research-plan-team")
```

## Constraints and Guardrails

1. **researcher does not make decisions.** It gathers and evaluates evidence.
   Decision-making authority belongs to planner (and ultimately the user).
2. **planner does not verify its own claims.** All claims and assumptions must
   pass through verifier before the plan is presented to the user.
3. **verifier is adversarial, not obstructionist.** It challenges unsupported
   claims but does not block the plan. It flags risks and lets the user decide.
4. **5-6 tasks per teammate maximum.** For research with 8+ sub-questions, batch
   into waves of 5.
5. **No nested teams.** Cannot spawn sub-teams within this team.
6. **Progressive handoff required.** Researcher must not hold all findings until
   complete. Send to planner after each sub-question converges to enable early
   structuring.
7. **Opus for planner only.** Researcher and verifier use sonnet to control
   token cost. Planner uses opus because plan quality is the highest-leverage
   output (per Decision #18).

## Integration Points

| System              | Integration                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `/deep-research`    | Evaluate spawn criteria; if met, spawn team instead of solo subagents |
| `/deep-plan`        | If preceded by `/deep-research` on same topic, suggest team           |
| CLAUDE.md Section 7 | Trigger table: "research + plan pipeline" -> research-plan-team       |
| Pre-commit hooks    | Not applicable (research/planning is pre-implementation)              |
| Token monitoring    | Log to `.claude/state/agent-token-usage.jsonl` via PostToolUse        |

## Comparison: Team vs Subagent for This Workflow

| Aspect                   | Subagent approach              | Team approach                     |
| ------------------------ | ------------------------------ | --------------------------------- |
| Researcher-planner talk  | Lead relays (2x latency)       | Direct messaging (1x latency)     |
| Progressive handoff      | Not possible (return-only)     | Real-time via SendMessage         |
| Adversarial verification | Single-pass (subagent returns) | Multi-pass (verifier <-> planner) |
| Token cost               | ~2x solo                       | ~4x solo                          |
| Best for                 | Simple research, 1-2 questions | Complex research, 3+ questions    |

The team approach is justified when the inter-agent communication benefit
(progressive handoff, adversarial verification, direct clarification) outweighs
the 2x additional token cost.
