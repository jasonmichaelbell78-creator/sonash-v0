# SQ4: Complete Agent Team Inventory

**Sub-question:** Complete agent team inventory -- compositions, when spawned,
how often, gaps in team usage.

**Confidence:** HIGH (verified against filesystem, team definition files, skill
cross-references, state files, invocation logs, and canonical memory)

**Sources:** `.claude/teams/audit-review-team.md`,
`.claude/teams/research-plan-team.md`, `CLAUDE.md` Section 7,
`docs/agent_docs/AGENT_ORCHESTRATION.md`,
`.planning/plan-orchestration/CL-PROTOCOL.md`,
`.planning/agent-environment-analysis/PLAN.md`,
`.planning/agent-environment-analysis/DECISIONS.md`,
`.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md`,
`.planning/agent-environment-analysis/RESEARCH_SYNTHESIS.md`,
`.claude/canonical-memory/feedback_agent_teams_learnings.md`,
`.claude/state/agent-invocations.jsonl`,
`.claude/state/agent-token-usage.jsonl`, `.claude/hooks/pre-compaction-save.js`

---

## 1. Defined Team Compositions

### 1A. audit-review-team

| Property              | Value                                |
| --------------------- | ------------------------------------ |
| **File**              | `.claude/teams/audit-review-team.md` |
| **Version**           | 1.0 (2026-03-24)                     |
| **Source**            | agent-env Phase 4, Step 4.2          |
| **Member Count**      | 2                                    |
| **Persistence**       | Ephemeral (per audit invocation)     |
| **Expected Duration** | 15-45 minutes                        |
| **Token Cost**        | ~3x solo                             |

**Members:**

| #   | Name     | Role     | Model  | Tools                               | Purpose                                                                                                             |
| --- | -------- | -------- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | reviewer | Analyst  | sonnet | Read, Grep, Glob, Bash              | Reads artifacts, evaluates against audit categories, produces structured findings with severity and file references |
| 2   | fixer    | Executor | sonnet | Read, Write, Edit, Bash, Grep, Glob | Implements fixes from reviewer findings, drafts prompt rewrites, proposes concrete code changes                     |

**Design rationale:** The reviewer-fixer pipeline is sequential (not parallel),
making a 2-member team optimal. A third member would idle-wait most of the time.
After 3+ audit targets, the persistent context enables cross-target pattern
recognition that subagents cannot achieve.

**Model override rule (CL-PROTOCOL.md):** When spawned for CL Protocol work
(Phase D or Phase V), both members should be overridden to opus. This override
applies only for CL work, not routine audits.

### 1B. research-plan-team

| Property              | Value                                 |
| --------------------- | ------------------------------------- |
| **File**              | `.claude/teams/research-plan-team.md` |
| **Version**           | 1.0 (2026-03-24)                      |
| **Source**            | agent-env Phase 4, Step 4.2           |
| **Member Count**      | 3                                     |
| **Persistence**       | Ephemeral (per research-plan cycle)   |
| **Expected Duration** | 30-90 minutes                         |
| **Token Cost**        | ~4x solo                              |

**Members:**

| #   | Name       | Role                | Model  | Tools                                       | Purpose                                                                                          |
| --- | ---------- | ------------------- | ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | researcher | Domain investigator | sonnet | Read, Grep, Glob, Bash, WebSearch, WebFetch | Investigates domain, evaluates sources, produces evidence-backed findings with confidence levels |
| 2   | planner    | Decision architect  | opus   | Read, Write, Edit, Bash, Grep, Glob         | Translates research findings into decisions, steps, dependencies, and effort estimates           |
| 3   | verifier   | CL auditor          | sonnet | Read, Grep, Glob, Bash                      | Convergence-loop verification of claims and plan assumptions; challenges unsupported assertions  |

**Design rationale:** Three distinct cognitive modes that compete for attention
in a single context window: divergent (researcher), convergent (planner),
adversarial (verifier). Separation ensures each mode runs to convergence
independently. Planner uses opus because plan quality directly determines
implementation success (per Decision #18).

**Inter-agent communication flow:**

1. **Phase 1 (Research):** Researcher sends progressive findings to planner
   after each sub-question converges. Planner can ask researcher for
   clarification directly.
2. **Phase 2 (Planning):** Planner drafts plan, sends claims and assumptions to
   verifier for CL verification.
3. **Phase 3 (Convergence):** Verifier challenges claims, returns verification
   results. Planner revises. Second pass if needed.

### 1C. Conceptual Teams (Defined in AGENT_ORCHESTRATION.md, No Team File)

Three additional team patterns are described in `AGENT_ORCHESTRATION.md` but
have **no corresponding `.claude/teams/` definition file:**

| Team                 | Members                          | Token Budget | Described In                                         | Has Definition File?                         |
| -------------------- | -------------------------------- | ------------ | ---------------------------------------------------- | -------------------------------------------- |
| **Audit Team**       | 2-4 domain specialists           | 250K         | AGENT_ORCHESTRATION.md                               | NO (audit-review-team covers this partially) |
| **Review Team**      | Lead + 2-3 concern specialists   | 200K         | AGENT_ORCHESTRATION.md                               | NO                                           |
| **Development Team** | Lead + test writer + doc updater | 300K         | AGENT_ORCHESTRATION.md + CLAUDE.md Section 7 trigger | NO                                           |
| **Exploration Team** | 2 members                        | 100K         | AGENT_ORCHESTRATION.md                               | NO                                           |

**Critical gap:** The "Development team" is referenced in CLAUDE.md Section 7
PRE-TASK triggers (`Multi-file feature (3+ files) -> Development team -> Team`)
but has no definition file. This means the trigger exists in the canonical
reference but cannot be executed -- the AI has no TeamCreate specification to
follow.

### 1D. Ad Hoc Teams Used During agent-env Analysis (Historical)

The agent-environment-analysis plan (Session #225-236) defined three ad hoc
teams that were used during execution but were not formalized into
`.claude/teams/` definitions:

| Team             | Phase   | Members                                                                    | Purpose                                   | Formalized?                    |
| ---------------- | ------- | -------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| research-team    | Phase 1 | inventory-agent, gap-analyst, external-scout, teams-researcher (4 members) | Cross-source synthesis during research    | NO                             |
| audit-team       | Phase 3 | reviewer, fixer (2 members)                                                | Persistent context across 36 agent audits | YES (became audit-review-team) |
| improvement-team | Phase 4 | researcher, writer, reviewer (3 members)                                   | Three perspectives per agent improvement  | NO                             |

The research-team was the **first real Agent Teams usage** in the project
(Session #225). Learnings from that session were captured in canonical memory
(`feedback_agent_teams_learnings.md`) and directly informed the formalized team
definitions.

---

## 2. When Each Team SHOULD Be Spawned (Per Docs)

### audit-review-team

**Spawn when ANY of:**

1. `/audit-*` or `/skill-audit` invocation targeting 3+ artifacts
2. `/audit-comprehensive` on any domain
3. Manual audit across 5+ agents, skills, or ecosystem components
4. Post-phase audit checkpoint (e.g., after Phase 3 or Phase 5 of a plan)

**Do NOT spawn for:**

- Single-file code review (use code-reviewer directly)
- Quick spot-checks on 1-2 items (subagent sufficient)
- Security-specific audits (use security-auditor directly)

**Additional trigger from CL-PROTOCOL.md:**

- Discovery across 5+ files with shared concerns (spawn reviewer-only, 1 member)
- Discovery + immediate fix execution (full 2-member pipeline)

### research-plan-team

**Spawn when ALL of:**

1. `/deep-research` followed by `/deep-plan` on same topic within one session
2. Research complexity is L or XL (3+ sub-questions, multiple source types)
3. Plan will drive multi-session implementation (not a quick task)

**Also spawn when:**

4. `/deep-plan` with `--research` flag requesting integrated research phase
5. Plan phase involves domain the user explicitly flags as unfamiliar

**Do NOT spawn for:**

- Simple `/deep-research` that won't feed into a plan (use subagents)
- `/deep-plan` on a well-understood topic (planner works solo)
- Research with 1-2 sub-questions (subagent searchers sufficient)
- "Quick plan" or "rough plan" requests (subagent)

**Additional trigger from CL-PROTOCOL.md:**

- Complex plan with research -> planning -> verification pipeline
- When CL feeds into plan creation or revision (verifier maps to D3/V3
  contrarian role)

### Development Team (CLAUDE.md Section 7 -- no definition file)

**Spawn when:** Multi-file feature work involving 3+ files.

**Members (from AGENT_ORCHESTRATION.md):** Lead (primary implementer) + test
writer (parallel tests) + doc updater (keeps docs in sync).

**Status:** TRIGGER EXISTS, DEFINITION MISSING.

---

## 3. When Each Team IS Actually Spawned (Per Invocation Data)

### Evidence from State Files

**agent-invocations.jsonl:** Contains 8 entries, all from a single session
(`session-1774395645045`). Only `code-reviewer` and `Explore` agents recorded.
**Zero team invocations recorded.**

**agent-token-usage.jsonl:** Contains exactly 1 line (empty or minimal). **No
team token usage recorded.**

**skill-ecosystem-audit-history.jsonl:** 15 entries tracking
`team_config_health` scores (consistently 97/100, rated "average"). These are
health scores for team _configuration quality_, not invocation records.

**pre-compaction-save.js team tracking:** The hook checks
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json and looks for
invocations where the description contains "team" or "teammate". This means team
activity is tracked indirectly through agent descriptions, not through a
dedicated team invocation log.

### Evidence from Canonical Memory

`feedback_agent_teams_learnings.md` documents Session #225 as the **first real
usage** of Agent Teams. That session used a 4-member research-team during the
agent-environment-analysis plan. Key learnings:

1. Explore agents are read-only (cannot write/edit files)
2. 50%+ of inbox messages are idle pings
3. Token cost is 3-7x solo
4. 5-6 tasks per teammate is optimal
5. One team per session, no nested teams
6. No `/resume` for teams

This memory entry is flagged as **unverified** in MEMORY.md, suggesting the
learnings have not been re-confirmed in subsequent team usage.

### Actual Spawn Frequency Assessment

| Team                               | Known Spawns         | Evidence                             | Frequency |
| ---------------------------------- | -------------------- | ------------------------------------ | --------- |
| research-team (ad hoc, Phase 1)    | 1 (Session #225)     | Canonical memory, PLAN.md status     | Once ever |
| audit-team (ad hoc, Phase 3)       | 1 (Session #226-227) | PLAN.md status (Phase 3 COMPLETE)    | Once ever |
| improvement-team (ad hoc, Phase 4) | 1 (Session #236)     | PLAN.md status (Phase 4 COMPLETE)    | Once ever |
| audit-review-team (formalized)     | **0**                | No invocation records in state files | **Never** |
| research-plan-team (formalized)    | **0**                | No invocation records in state files | **Never** |
| Development Team (CLAUDE.md ref)   | **0**                | No definition file exists            | **Never** |

**Confidence: HIGH.** The formalized team definitions (`audit-review-team`,
`research-plan-team`) were created during Session #236 as part of agent-env
Phase 4, Step 4.2. They are **brand new** (dated 2026-03-24, the current date).
The ad hoc teams used during Sessions #225-236 pre-date the formalized
definitions.

**Key finding:** The formalized team definitions are design documents that have
never been executed. They codify patterns learned from the ad hoc teams used
during the agent-env analysis plan but have not yet been tested in their
formalized form.

---

## 4. Gap Analysis: Where Teams Would Be Better Than Solo Agents

### Gap 1: skill-audit with 3+ targets (audit-review-team trigger met, team not spawned)

**Situation:** `/skill-audit` has been invoked multiple times
(skill-ecosystem-audit-history.jsonl has 15 entries). The SKILL.md says to spawn
audit-review-team when targeting 3+ skills.

**Current behavior:** Solo execution, likely with subagents. The
skill-ecosystem-audit-history shows the audit runs scoring `team_config_health`
at 97, but the audit itself is not using a team.

**Why a team would be better:** Cross-target pattern accumulation. After
auditing 3+ skills, the reviewer would recognize systemic issues (e.g., "same
missing return protocol as skills #2, #4, #7") instead of treating each as
isolated. The fixer could reuse proven prompt patterns across targets.

**Confidence: HIGH.**

### Gap 2: /deep-research -> /deep-plan pipeline (research-plan-team trigger met, likely not spawned)

**Situation:** The `/deep-research` and `/deep-plan` skills both reference the
research-plan-team as an option when complexity is L/XL and the two skills are
used on the same topic.

**Current behavior:** Sequential solo execution. The deep-research skill spawns
parallel searchers (subagents), then the synthesizer. Deep-plan runs separately
afterward.

**Why a team would be better:** Progressive handoff (planner starts structuring
before all research is complete), direct clarification requests (planner asks
researcher, not through the lead), and adversarial verification (verifier
challenges both). These are the core inter-agent communication benefits that
justify the 4x token cost.

**Confidence: MEDIUM.** Without invocation records for deep-research/deep-plan,
it is uncertain how often L/XL complexity is reached in practice.

### Gap 3: Multi-file feature work (Development Team trigger exists, no definition)

**Situation:** CLAUDE.md Section 7 lists "Multi-file feature (3+ files) ->
Development team -> Team" as a PRE-TASK trigger. AGENT_ORCHESTRATION.md
describes the team pattern (lead + test writer + doc updater). But no
`.claude/teams/` definition file exists.

**Current behavior:** The trigger is un-actionable. When multi-file feature work
is encountered, the AI has no TeamCreate specification to follow. It likely
falls through to solo implementation with post-hoc code review.

**Why a team would be better:** Parallel test writing during implementation (not
after), continuous doc sync with code changes, and the test writer can ask the
lead about expected behavior in real-time.

**Confidence: HIGH.** This is the most clearcut gap -- a trigger exists in the
canonical reference document with no backing implementation.

### Gap 4: CL Protocol verification passes (team spawn rules exist, likely not used)

**Situation:** CL-PROTOCOL.md defines specific team spawn rules for CL work:
audit-review-team for 5+ file discovery, research-plan-team for complex plans
with research -> planning -> verification. It even specifies model overrides
(sonnet -> opus for CL work).

**Current behavior:** CL verification likely runs with solo general-purpose
agents (the protocol was created in Session #237, very recently).

**Why a team would be better:** For discovery across 5+ files, the reviewer's
cross-file pattern memory is valuable even without the fixer. For complex plans,
the verifier maps directly to the D3/V3 contrarian role, providing multi-pass
adversarial verification that is higher quality than a solo contrarian agent.

**Confidence: MEDIUM.** The CL-PROTOCOL is new enough that it may not have been
exercised with team spawning yet.

### Gap 5: PR review with 20+ items (AGENT_ORCHESTRATION.md pattern, no definition)

**Situation:** AGENT_ORCHESTRATION.md describes a "Review Team" pattern for PR
reviews with 20+ items (lead triages, specialists grouped by concern). No
`.claude/teams/` definition exists.

**Current behavior:** PR reviews likely use code-reviewer as a single subagent,
possibly with security-auditor as a second pass. Large PRs get a single-pass
review.

**Why a team would be better:** Security specialist can alert code-quality
specialist about auth issues discovered during review. Cross-concern findings
improve review quality for large PRs.

**Confidence: LOW.** The frequency of 20+ item PRs is uncertain for this solo
developer project.

### Gap 6: Comprehensive audits (AGENT_ORCHESTRATION.md pattern, partial coverage)

**Situation:** AGENT_ORCHESTRATION.md describes an "Audit Team" with 2-4 domain
specialists and cross-cutting groupings like `{code+refactoring}`,
`{security+performance}`, `{docs+process+eng-prod}`. The audit-review-team
covers a 2-member reviewer-fixer pattern but not the multi-specialist pattern.

**Current behavior:** `/audit-comprehensive` spawns 9 domain audit agents across
4 stages as parallel subagents. This works but loses cross-domain context.

**Why a team would be better:** When security findings affect code quality
findings, or when performance issues are caused by architecture decisions, a
team with shared context can identify these cross-cutting concerns.

**Confidence: MEDIUM.**

---

## 5. New Team Compositions for Research/Discovery

### 5A. Research Discovery Team (Proposed)

**Purpose:** Dedicated team for the research/discovery standard -- the exact
workflow this investigation is part of.

| Member           | Role                  | Model  | Tools                                       | Purpose                                                                             |
| ---------------- | --------------------- | ------ | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| lead-researcher  | Primary investigator  | opus   | Read, Grep, Glob, Bash, WebSearch, WebFetch | Drives sub-question investigation, manages progressive findings                     |
| codebase-analyst | Pattern miner         | sonnet | Read, Grep, Glob, Bash                      | Deep filesystem exploration, invocation data analysis, cross-reference verification |
| contrarian       | Assumption challenger | sonnet | Read, Grep, Glob, Bash                      | Challenges findings, verifies claims against evidence, identifies blind spots       |

**When to spawn:** Research involving 4+ sub-questions where findings are
interdependent (one sub-question's answer affects another's interpretation).

**Why it differs from research-plan-team:** No planner. The output is a findings
document, not an implementation plan. The contrarian role focuses on research
rigor (source quality, claim evidence) rather than plan feasibility.

**Token cost justification:** ~4x solo. Justified when sub-question
interdependency is high (e.g., "agent inventory" findings directly affect "team
usage" findings, which affect "gap analysis" findings).

**Confidence: MEDIUM.** The value depends on how often deeply interdependent
multi-sub-question research tasks arise. The current subagent pattern
(deep-research-searcher parallelism) handles independent sub-questions well. The
team adds value specifically for dependent sub-questions where one searcher's
findings should redirect another searcher's investigation.

### 5B. Ecosystem Audit Team (Proposed)

**Purpose:** Multi-domain audit team for ecosystem-level investigations that
span agents, skills, hooks, and documentation.

| Member            | Role                 | Model                | Tools                               | Purpose                                                                                   |
| ----------------- | -------------------- | -------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| reviewer          | Multi-domain analyst | sonnet (opus for CL) | Read, Grep, Glob, Bash              | Evaluates artifacts across all ecosystem domains                                          |
| cross-ref-checker | Consistency verifier | sonnet               | Read, Grep, Glob, Bash              | Verifies cross-references between agents/skills/hooks/docs are bidirectional and accurate |
| fixer             | Remediation drafter  | sonnet               | Read, Write, Edit, Bash, Grep, Glob | Drafts fixes for findings, reuses proven patterns                                         |

**When to spawn:** Ecosystem-level audits that touch 3+ artifact types (agents +
skills + hooks, or skills + docs + state files).

**Why it differs from audit-review-team:** Adds the cross-ref-checker role. The
current audit-review-team is designed for same-domain audits (audit N skills
sequentially). Ecosystem audits need someone specifically watching the
connections between domains, not just individual artifacts.

**Confidence: LOW.** The added complexity of a 3-member team over the 2-member
audit-review-team may not justify the token cost. The cross-ref-checker's job
could potentially be accomplished by the reviewer if the prompt is
well-designed.

### 5C. Implementation Verification Team (Proposed -- Fills Development Team Gap)

**Purpose:** The missing "Development Team" from CLAUDE.md Section 7, redesigned
for SoNash's solo developer workflow.

| Member      | Role             | Model  | Tools                               | Purpose                                                                      |
| ----------- | ---------------- | ------ | ----------------------------------- | ---------------------------------------------------------------------------- |
| implementer | Primary coder    | opus   | Read, Write, Edit, Bash, Grep, Glob | Writes the feature code                                                      |
| test-writer | Parallel testing | sonnet | Read, Write, Edit, Bash, Grep, Glob | Writes tests during implementation, asks implementer about expected behavior |
| reviewer    | Live review      | sonnet | Read, Grep, Glob, Bash              | Reviews code as it is written, flags issues before commit rather than after  |

**When to spawn:** Multi-file feature work (3+ files), as specified by the
existing CLAUDE.md trigger.

**Token cost:** ~4x solo (300K budget per AGENT_ORCHESTRATION.md).

**Confidence: HIGH that the gap exists.** MEDIUM that this composition is
optimal -- the reviewer role may be redundant with the post-task code-reviewer
trigger that already exists.

---

## 6. Making the AI Naturally Recognize "This Needs a Team"

### Current State: Why Teams Are Not Spawned

The investigation reveals a consistent pattern: teams are defined (or
referenced), triggers are documented, but the AI defaults to subagent or solo
execution. The root causes are:

**Root Cause 1: Complexity assessment is implicit, not measured.**

The spawn criteria use terms like "L or XL complexity," "3+ sub-questions," or
"cross-cutting potential: High." These require the AI to make a judgment call
against fuzzy thresholds. There is no automated complexity scorer that outputs
"this task exceeds team threshold."

**Root Cause 2: Token cost bias toward cheaper options.**

The AI has been trained (and reinforced through canonical memory) that teams
cost 3-7x more tokens. Without a countervailing signal that a team would produce
higher quality output, the default path-of-least-resistance is subagent
execution.

**Root Cause 3: Team spawn is an additive step, not a default path.**

The current flow is: encounter trigger -> decide solo vs subagent vs team. The
team option is the most effortful choice. Skills mention teams as "consider
spawning" rather than "spawn unless criteria are NOT met."

**Root Cause 4: No feedback loop confirming team value.**

After the Session #225 research-team, learnings were captured but focused on
operational issues (idle floods, read-only agents). No memory entry records
"team produced higher quality output than subagents would have" or "team saved
rework compared to solo execution." Without positive reinforcement, the AI has
no evidence that teams are worth the cost.

### Recommendations for Natural Team Recognition

**R1: Invert the decision default for documented triggers.** (Confidence: HIGH)

Instead of "consider spawning a team," the skill text should read "spawn the
team UNLESS one of these exceptions applies." This changes the cognitive default
from opt-in to opt-out. The exceptions become the judgment call, not the team
spawn itself.

**Where to apply:** `/skill-audit` SKILL.md, `/deep-research` SKILL.md,
`/deep-plan` SKILL.md, CL-PROTOCOL.md.

**R2: Add a complexity pre-check step to skill entry points.** (Confidence:
MEDIUM)

Before execution begins, the skill should explicitly evaluate:

- How many items/targets/sub-questions?
- How many files will be touched?
- Are findings interdependent across sub-questions?
- Has the user flagged this as complex or unfamiliar?

If 2+ of these exceed team thresholds, the skill should state: "Complexity
assessment: team-scale. Spawning [team-name] per [team-file]. Override with 'use
subagents' if preferred." This makes the decision visible and auditable.

**R3: Create the Development Team definition file.** (Confidence: HIGH)

The CLAUDE.md trigger table is the canonical reference for agent/skill
invocation. Having a trigger with no backing implementation is a direct
compliance gap. Create `.claude/teams/development-team.md` following the pattern
of the existing team definitions.

**R4: Add team outcome tracking to session-end.** (Confidence: MEDIUM)

When a team is used, the session-end pipeline should record:

- Team name and member count
- Tasks completed per member
- Token cost (from agent-token-usage.jsonl)
- Subjective quality assessment (user rates: "team added value" / "subagent
  would have sufficed")

This creates the feedback loop needed for Root Cause 4. Over time, the AI can
reference historical team outcomes to justify (or avoid) team usage.

**R5: Add a PreToolUse hook for team-eligible triggers.** (Confidence: LOW)

Decision #28 from agent-env analysis proposed a PreToolUse hook on the
Agent/Task tool. This could be extended to check: "Is this task associated with
a CLAUDE.md trigger that specifies Team tool type? If so, remind the AI to
evaluate team spawn criteria." This is the most automated approach but also the
most complex to implement.

**R6: Wire team spawn into GSD skills.** (Confidence: MEDIUM)

The GSD agent family (13 agents) is the most structured agent system in the
project, but none of the GSD skills reference teams. The AGENT_TEAMS_RESEARCH.md
notes: "GSD agents don't reference teams -- designed as subagents, need prompt
mods." For `/gsd:execute-phase` with 3+ parallel files, and `/gsd:new-project`
with 4 parallel researchers, team mode could improve cross-agent synthesis.

---

## 7. Key Findings Summary

1. **2 formalized team definitions exist** (audit-review-team,
   research-plan-team) with 5 virtual member roles total. Both are brand new
   (2026-03-24) and have **never been spawned in their formalized form.**

2. **3 ad hoc teams were used during agent-env analysis** (Sessions #225-236).
   Only one (audit-team) was formalized into a `.claude/teams/` definition. The
   research-team (4-member) and improvement-team (3-member) patterns were not
   formalized.

3. **3 conceptual team patterns exist in AGENT_ORCHESTRATION.md** (Audit Team,
   Review Team, Development Team) without definition files. The Development Team
   is referenced in CLAUDE.md Section 7 as a PRE-TASK trigger, making it the
   most urgent gap.

4. **Total team-related infrastructure:**
   - 2 definition files
   - 3 conceptual patterns (no files)
   - 1 canonical memory entry (feedback_agent_teams_learnings)
   - 1 research document (AGENT_TEAMS_RESEARCH.md)
   - 1 hook function tracking team activity (pre-compaction-save.js)
   - 1 env flag enabling teams (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
   - 0 recorded formalized team invocations

5. **The AI defaults to subagents over teams** because: complexity assessment is
   implicit, token cost bias, teams are opt-in not opt-out, and no feedback loop
   confirms team value.

6. **6 specific gaps identified** where teams would outperform solo agents, with
   confidence levels ranging from HIGH (development team missing definition,
   skill-audit not using teams) to LOW (PR review team, ecosystem audit team).

7. **3 new team compositions proposed** for research/discovery use cases. The
   highest confidence proposal is the Implementation Verification Team (fills
   the Development Team gap in CLAUDE.md Section 7).

8. **6 recommendations provided** for making the AI naturally recognize team-
   scale tasks. The highest impact recommendations are inverting the decision
   default (R1) and creating the Development Team definition file (R3).
