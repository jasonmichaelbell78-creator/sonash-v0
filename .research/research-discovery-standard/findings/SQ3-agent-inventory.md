# SQ3: Complete Agent Inventory

<!-- prettier-ignore-start -->
**Sub-question:** Complete agent inventory — all agents, capabilities, model assignments, invocation patterns, and underuse signals.
**Confidence:** HIGH
**Sources:** `.claude/agents/`, `.claude/agents/global/`, `.claude/teams/`, `.claude/settings.json`, `CLAUDE.md` Section 7, `docs/agent_docs/AGENT_ORCHESTRATION.md`, `.claude/skills/` cross-references
<!-- prettier-ignore-end -->

---

## 1. Complete Agent Inventory

### 1A. Project-Level Agents (`.claude/agents/`)

27 agents total. Sorted by research/discovery relevance.

| #   | Agent Name                     | Model  | Tools                                    | Read-Only? | Max Turns | Disallowed         | Research Classification | SoNash Customized? |
| --- | ------------------------------ | ------ | ---------------------------------------- | ---------- | --------- | ------------------ | ----------------------- | ------------------ |
| 1   | explore                        | sonnet | Read, Bash, Grep, Glob                   | YES        | 25        | Agent, Write, Edit | **PRIMARY**             | YES (deep)         |
| 2   | plan                           | sonnet | Read, Bash, Grep, Glob                   | YES        | 25        | Agent, Write, Edit | **PRIMARY**             | YES (deep)         |
| 3   | code-reviewer                  | sonnet | Read, Write, Edit, Bash, Grep, Glob      | No         | 25        | Agent              | **SECONDARY**           | YES (deep)         |
| 4   | security-auditor               | sonnet | Read, Write, Edit, Bash, Grep, Glob      | No         | 25        | Agent              | **SECONDARY**           | YES (deep)         |
| 5   | test-engineer                  | opus   | Read, Write, Edit, Bash                  | No         | default   | --                 | SECONDARY               | YES (partial)      |
| 6   | frontend-developer             | sonnet | Read, Write, Edit, Bash                  | No         | default   | --                 | NONE                    | YES (deep)         |
| 7   | documentation-expert           | sonnet | Read, Write, Edit, Grep                  | No         | default   | --                 | SECONDARY               | YES (deep)         |
| 8   | dependency-manager             | sonnet | Read, Bash, Grep                         | No         | default   | --                 | SECONDARY               | YES (partial)      |
| 9   | debugger                       | sonnet | Read, Write, Edit, Bash, Grep            | No         | default   | --                 | **SECONDARY**           | NO (generic)       |
| 10  | error-detective                | sonnet | Read, Write, Edit, Bash, Grep            | No         | default   | --                 | **PRIMARY**             | NO (generic)       |
| 11  | backend-architect              | sonnet | Read, Write, Edit, Bash                  | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 12  | database-architect             | opus   | Read, Write, Edit, Bash                  | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 13  | deployment-engineer            | sonnet | Read, Write, Edit, Bash, AskUserQuestion | No         | default   | --                 | NONE                    | NO (generic)       |
| 14  | devops-troubleshooter          | sonnet | Read, Write, Edit, Bash, Grep            | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 15  | fullstack-developer            | opus   | Read, Write, Edit, Bash                  | No         | default   | --                 | NONE                    | NO (generic)       |
| 16  | git-flow-manager               | sonnet | Read, Bash, Grep, Glob, Edit, Write      | No         | default   | --                 | NONE                    | NO (generic)       |
| 17  | markdown-syntax-formatter      | sonnet | Read, Write, Edit                        | No         | default   | --                 | NONE                    | NO (generic)       |
| 18  | mcp-expert                     | sonnet | Read, Write, Edit                        | No         | default   | --                 | NONE                    | NO (generic)       |
| 19  | nextjs-architecture-expert     | sonnet | Read, Write, Edit, Bash, Grep, Glob      | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 20  | penetration-tester             | opus   | Read, Write, Edit, Bash                  | No         | default   | --                 | **PRIMARY**             | NO (generic)       |
| 21  | performance-engineer           | opus   | Read, Write, Edit, Bash                  | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 22  | prompt-engineer                | opus   | Read, Write, Edit                        | No         | default   | --                 | NONE                    | NO (generic)       |
| 23  | react-performance-optimization | sonnet | Read, Write, Edit, Bash                  | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 24  | security-engineer              | opus   | Read, Write, Edit, Bash                  | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 25  | technical-writer               | sonnet | Read, Write, Edit, Grep                  | No         | default   | --                 | NONE                    | NO (generic)       |
| 26  | ui-ux-designer                 | sonnet | Read, Write, Edit                        | No         | default   | --                 | SECONDARY               | NO (generic)       |
| 27  | markdown-syntax-formatter      | sonnet | Read, Write, Edit                        | No         | default   | --                 | NONE                    | NO (generic)       |

### 1B. Global Agents (`.claude/agents/global/`)

14 agents. These serve the GSD (Get Stuff Done) and deep-research skill
families.

| #   | Agent Name                | Model  | Tools                                                               | Research Classification | Parent Skill       |
| --- | ------------------------- | ------ | ------------------------------------------------------------------- | ----------------------- | ------------------ |
| 1   | deep-research-searcher    | sonnet | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp\_\_context7 | **PRIMARY**             | /deep-research     |
| 2   | deep-research-synthesizer | sonnet | Read, Write, Bash                                                   | **PRIMARY**             | /deep-research     |
| 3   | gsd-project-researcher    | sonnet | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp\_\_context7 | **PRIMARY**             | /gsd:new-project   |
| 4   | gsd-phase-researcher      | sonnet | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp\_\_context7 | **PRIMARY**             | /gsd:plan-phase    |
| 5   | gsd-research-synthesizer  | sonnet | Read, Write, Bash                                                   | **PRIMARY**             | /gsd:new-project   |
| 6   | gsd-codebase-mapper       | sonnet | Read, Bash, Grep, Glob, Write                                       | **PRIMARY**             | /gsd:map-codebase  |
| 7   | gsd-planner               | sonnet | Read, Write, Bash, Glob, Grep, WebFetch, mcp\_\_context7            | SECONDARY               | /gsd:plan-phase    |
| 8   | gsd-plan-checker          | sonnet | Read, Bash, Glob, Grep                                              | **PRIMARY**             | /gsd:plan-phase    |
| 9   | gsd-verifier              | sonnet | Read, Bash, Grep, Glob                                              | **PRIMARY**             | /gsd:verify-phase  |
| 10  | gsd-integration-checker   | sonnet | Read, Bash, Grep, Glob                                              | **PRIMARY**             | milestone auditor  |
| 11  | gsd-executor              | sonnet | Read, Write, Edit, Bash, Grep, Glob                                 | NONE                    | /gsd:execute-phase |
| 12  | gsd-debugger              | sonnet | Read, Write, Edit, Bash, Grep, Glob, WebSearch                      | SECONDARY               | /gsd:debug         |
| 13  | gsd-roadmapper            | sonnet | Read, Write, Bash, Glob, Grep                                       | SECONDARY               | /gsd:new-project   |
| 14  | gsd-roadmapper            | sonnet | Read, Write, Bash, Glob, Grep                                       | SECONDARY               | /gsd:new-project   |

### 1C. Agent Teams (`.claude/teams/`)

2 team definitions. Teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
(enabled in `settings.json`).

| #   | Team Name          | Members                             | Models                 | Persistence | Spawn Trigger                                                |
| --- | ------------------ | ----------------------------------- | ---------------------- | ----------- | ------------------------------------------------------------ |
| 1   | audit-review-team  | 2 (reviewer + fixer)                | sonnet + sonnet        | Ephemeral   | /skill-audit with 3+ targets, /audit-comprehensive           |
| 2   | research-plan-team | 3 (researcher + planner + verifier) | sonnet + opus + sonnet | Ephemeral   | /deep-research -> /deep-plan pipeline, complex L/XL research |

---

## 2. Model Assignment Patterns

### Distribution

| Model  | Project Agents | Global Agents | Team Members | Total |
| ------ | -------------- | ------------- | ------------ | ----- |
| sonnet | 20             | 14            | 4            | 38    |
| opus   | 7              | 0             | 1            | 8     |

### Opus Assignment Rationale

Opus is assigned to agents where **decision quality is the highest-leverage
output**:

| Agent                      | Why Opus                                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| database-architect         | Complex schema design decisions with long-term consequences                 |
| fullstack-developer        | End-to-end implementation requiring broad context integration               |
| penetration-tester         | Security assessment requiring adversarial creativity                        |
| performance-engineer       | Performance optimization requiring deep analysis                            |
| prompt-engineer            | Prompt quality directly determines AI agent effectiveness                   |
| security-engineer          | Infrastructure security decisions with compliance implications              |
| test-engineer              | Test strategy and comprehensive coverage analysis                           |
| research-plan-team/planner | Plan quality determines multi-session implementation success (Decision #18) |

### Pattern: Sonnet is the default; opus is reserved for high-stakes analytical work.

The GSD global agents are ALL sonnet -- even researchers and planners. This
contrasts with the research-plan-team, which elevates the planner to opus when
operating in team mode. This suggests the team is the "upgrade path" for
critical planning tasks.

---

## 3. Research/Discovery Capability Classification

### PRIMARY Research Agents (main job is investigation/analysis)

| Agent                     | Research Type                                                 | Web Access? | Write Access?  | Invocation Pattern                    |
| ------------------------- | ------------------------------------------------------------- | ----------- | -------------- | ------------------------------------- |
| explore                   | Codebase exploration, feature tracing, dependency mapping     | No          | No (read-only) | Direct subagent via CLAUDE.md trigger |
| plan                      | Implementation planning, constraint identification            | No          | No (read-only) | Direct subagent via CLAUDE.md trigger |
| error-detective           | Log analysis, error pattern detection, anomaly identification | No          | Yes            | Direct subagent (ad hoc)              |
| penetration-tester        | Security reconnaissance, vulnerability identification         | No          | Yes            | Direct subagent (ad hoc)              |
| deep-research-searcher    | Web research, source evaluation, evidence gathering           | YES         | Yes            | Spawned by /deep-research skill       |
| deep-research-synthesizer | Cross-source synthesis, deduplication, theme extraction       | No          | Yes            | Spawned by /deep-research skill       |
| gsd-project-researcher    | Domain ecosystem survey, technology landscape mapping         | YES         | Yes            | Spawned by /gsd:new-project           |
| gsd-phase-researcher      | Phase-specific technical domain investigation                 | YES         | Yes            | Spawned by /gsd:plan-phase            |
| gsd-research-synthesizer  | Multi-researcher output synthesis                             | No          | Yes            | Spawned by /gsd:new-project           |
| gsd-codebase-mapper       | Codebase structure analysis, tech stack analysis              | No          | Yes            | Spawned by /gsd:map-codebase          |
| gsd-plan-checker          | Plan quality verification, goal-backward analysis             | No          | No             | Spawned by /gsd:plan-phase            |
| gsd-verifier              | Phase goal achievement verification against codebase          | No          | No             | Spawned by /gsd:verify-phase          |
| gsd-integration-checker   | Cross-phase integration verification, E2E flow checking       | No          | No             | Spawned by milestone auditor          |

### SECONDARY Research Agents (research as part of larger task)

| Agent                          | How Research Fits In                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| code-reviewer                  | Investigates code changes, patterns:check, lint analysis before producing findings    |
| security-auditor               | Investigates security posture, Firestore rules, Cloud Functions boundary before audit |
| test-engineer                  | Analyzes test coverage, identifies gaps, investigates failure patterns                |
| documentation-expert           | Reviews existing docs, verifies cross-references, identifies gaps                     |
| dependency-manager             | Scans for vulnerabilities, analyzes dependency tree, license audit                    |
| debugger                       | Root cause analysis through hypothesis testing and log analysis                       |
| devops-troubleshooter          | Production incident investigation, log correlation                                    |
| backend-architect              | Service boundary analysis, data consistency requirements assessment                   |
| database-architect             | Data modeling analysis, scalability assessment                                        |
| nextjs-architecture-expert     | Architecture pattern analysis, migration path investigation                           |
| performance-engineer           | Application profiling, bottleneck identification                                      |
| react-performance-optimization | Rendering analysis, bundle analysis, memory leak detection                            |
| security-engineer              | Infrastructure security assessment, compliance analysis                               |
| ui-ux-designer                 | User research, usability analysis                                                     |
| gsd-planner                    | Investigates codebase to inform plan design                                           |
| gsd-debugger                   | Bug investigation through scientific method                                           |
| gsd-roadmapper                 | Requirement analysis to inform phase structure                                        |

### NONE (no research function)

| Agent                     | Primary Function                  |
| ------------------------- | --------------------------------- |
| frontend-developer        | Builds UI components              |
| fullstack-developer       | End-to-end feature implementation |
| deployment-engineer       | CI/CD pipeline configuration      |
| git-flow-manager          | Branch management and merging     |
| markdown-syntax-formatter | Markdown formatting               |
| mcp-expert                | MCP server configuration          |
| prompt-engineer           | Prompt crafting                   |
| technical-writer          | User-facing documentation         |
| gsd-executor              | Plan execution                    |

---

## 4. CLAUDE.md Trigger Table Cross-Reference

CLAUDE.md Section 7 defines two trigger tables (PRE-TASK and POST-TASK). Here is
which agents are referenced vs. which are not.

### Agents Referenced in CLAUDE.md Triggers

| Trigger                       | Agent                               | Tool Type |
| ----------------------------- | ----------------------------------- | --------- |
| Thorough planning requested   | deep-plan skill                     | Skill     |
| Domain/technology research    | deep-research skill                 | Skill     |
| Bug/error/unexpected behavior | systematic-debugging                | Skill     |
| Exploring unfamiliar code     | Explore agent                       | Task      |
| Multi-step implementation     | Plan agent                          | Task      |
| Multi-file feature (3+ files) | Development team                    | Team      |
| Multi-phase project           | /gsd:new-project or /gsd:plan-phase | Skill     |
| Security/auth (no S0/S1)      | security-auditor agent              | Task      |
| New documentation             | documentation-expert agent          | Task      |
| React/frontend component work | frontend-developer agent            | Task      |
| UI/frontend design            | frontend-design skill               | Skill     |
| Wrote/modified code           | code-reviewer agent                 | Task      |
| Built UI feature              | /test-suite --protocol=NAME         | Skill     |
| Security changes              | security-auditor agent              | Task      |
| PR ready for merge            | /test-suite --smoke                 | Skill     |

### Agents NOT Referenced in CLAUDE.md Triggers

These agents exist in `.claude/agents/` but have no explicit trigger in
CLAUDE.md:

| Agent                          | Likely Reason                                           |
| ------------------------------ | ------------------------------------------------------- |
| backend-architect              | Covered by plan agent for architecture decisions        |
| database-architect             | Covered by plan agent for data modeling                 |
| debugger                       | Covered by /systematic-debugging skill                  |
| deployment-engineer            | Rarely needed (Firebase hosting, not custom infra)      |
| devops-troubleshooter          | Rarely needed (no production ops workflow for solo dev) |
| error-detective                | Overlaps with debugger and /systematic-debugging        |
| fullstack-developer            | Covered by frontend-developer + plan for most tasks     |
| git-flow-manager               | Manual git workflow preferred per user                  |
| markdown-syntax-formatter      | Invoked ad hoc by documentation-expert or user          |
| mcp-expert                     | Invoked ad hoc for MCP configuration tasks              |
| nextjs-architecture-expert     | Covered by plan agent + frontend-developer              |
| penetration-tester             | Covered by security-auditor for most cases              |
| performance-engineer           | Invoked ad hoc for performance issues                   |
| prompt-engineer                | Invoked ad hoc for prompt crafting                      |
| react-performance-optimization | Covered by frontend-developer for most cases            |
| security-engineer              | Covered by security-auditor for most cases              |
| technical-writer               | Covered by documentation-expert for most cases          |
| ui-ux-designer                 | Covered by frontend-design skill                        |
| dependency-manager             | Invoked ad hoc for dependency management                |

---

## 5. Skill-to-Agent Cross-Reference

Skill files reference agents extensively. Here are the key patterns:

| Skill Family                    | Agents Spawned                                                                        | Notes                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| /deep-research                  | deep-research-searcher (N parallel), deep-research-synthesizer (1)                    | Multi-agent parallel research with source evaluation    |
| /deep-plan                      | explore, plan, code-reviewer                                                          | Read-only investigation -> planning -> review           |
| /gsd:new-project                | gsd-project-researcher (4 parallel), gsd-research-synthesizer (1), gsd-roadmapper (1) | 4 parallel researchers for stack/features/arch/pitfalls |
| /gsd:plan-phase                 | gsd-phase-researcher (1), gsd-planner (1), gsd-plan-checker (1)                       | Sequential research -> plan -> verify pipeline          |
| /gsd:execute-phase              | gsd-executor (1)                                                                      | Single execution agent                                  |
| /gsd:debug                      | gsd-debugger (1)                                                                      | Scientific method debugging                             |
| /gsd:map-codebase               | gsd-codebase-mapper (N parallel, up to 4)                                             | One per focus area (tech/arch/quality/concerns)         |
| /audit-comprehensive            | 9 domain audit agents across 4 stages                                                 | Staged parallel execution                               |
| /audit-code                     | 3 parallel agents (hygiene, framework, security)                                      | Domain-specific code audit                              |
| /audit-documentation            | 18 agents across 5 stages                                                             | Massive parallel documentation audit                    |
| /audit-engineering-productivity | 3 parallel agents (DX, debugging, offline)                                            | Engineering productivity audit                          |
| /audit-ai-optimization          | 11 agents across 3 stages                                                             | AI workflow optimization audit                          |
| /skill-audit                    | audit-review-team (reviewer + fixer)                                                  | Team-based for 3+ targets                               |
| /code-reviewer                  | code-reviewer agent                                                                   | Direct invocation                                       |
| /systematic-debugging           | debugger or explore                                                                   | Investigation agents                                    |

---

## 6. Underuse Analysis

### Definitively Underused Agents

These agents are defined, not referenced in any trigger table, and have
minimal/zero skill cross-references:

| Agent                     | Evidence of Underuse                                                  | Potential Value                                          |
| ------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| **error-detective**       | 0 skill references, no CLAUDE.md trigger, overlaps with debugger      | LOW -- debugger + /systematic-debugging covers this      |
| **devops-troubleshooter** | 0 skill references, no trigger, SoNash has no production ops workflow | LOW -- solo dev on Firebase hosting                      |
| **deployment-engineer**   | 0 skill references, no trigger, Firebase handles deployment           | LOW -- Firebase hosting, no custom infra                 |
| **fullstack-developer**   | 0 skill references, no trigger, 33KB of generic examples              | LOW -- frontend-developer + plan covers SoNash work      |
| **git-flow-manager**      | 0 skill references, no trigger, user manages git manually             | LOW -- user preference for manual git                    |
| **penetration-tester**    | 0 skill references, no trigger, security-auditor is SoNash-customized | MEDIUM -- could add value for focused pen-test scenarios |
| **mcp-expert**            | 0 skill references, no trigger                                        | LOW -- very niche, ad hoc only                           |

### Potentially Underused (Have Value but No Trigger)

| Agent                              | Evidence                                                          | Potential Value                                 |
| ---------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| **backend-architect**              | Referenced in AGENT_ORCHESTRATION.md concern table but no trigger | MEDIUM -- useful for API design decisions       |
| **nextjs-architecture-expert**     | No trigger, but SoNash IS a Next.js app                           | MEDIUM -- could improve architecture decisions  |
| **performance-engineer**           | Referenced in AGENT_ORCHESTRATION.md but no trigger               | MEDIUM -- useful for perf optimization tasks    |
| **react-performance-optimization** | No trigger, overlaps with performance-engineer                    | LOW -- redundant with performance-engineer      |
| **dependency-manager**             | No trigger, but SoNash-customized                                 | MEDIUM -- useful for npm audit workflows        |
| **prompt-engineer**                | No trigger                                                        | MEDIUM -- useful for agent/skill prompt quality |

### Well-Used Agents (Strong Integration)

| Agent                  | Evidence                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| explore                | CLAUDE.md trigger, /deep-plan integration, /audit-ai-optimization, multiple skill references |
| plan                   | CLAUDE.md trigger, /deep-plan integration, multiple skill references                         |
| code-reviewer          | CLAUDE.md trigger, /code-reviewer skill, PR review pipeline, delegated review pattern        |
| security-auditor       | CLAUDE.md trigger (2x), /audit-security skill, 7+ skill references                           |
| documentation-expert   | CLAUDE.md trigger, /audit-documentation, doc pipeline                                        |
| frontend-developer     | CLAUDE.md trigger, AGENT_ORCHESTRATION.md capacity table                                     |
| test-engineer          | AGENT_ORCHESTRATION.md capacity table, test suite integration                                |
| deep-research-searcher | Core of /deep-research skill                                                                 |
| gsd-\* agents (all 13) | Integral to GSD skill family                                                                 |

---

## 7. Capability Overlaps

### Significant Overlaps

| Overlap Area                | Agents Involved                                                                                    | Resolution                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Debugging/Investigation** | debugger, error-detective, devops-troubleshooter, gsd-debugger                                     | debugger is the generic agent; gsd-debugger is the GSD-integrated version; error-detective and devops-troubleshooter are redundant |
| **Security Review**         | security-auditor, security-engineer, penetration-tester                                            | security-auditor is SoNash-customized and well-integrated; security-engineer and penetration-tester are generic and unused         |
| **Performance**             | performance-engineer, react-performance-optimization                                               | performance-engineer is broader; react-performance-optimization is React-specific but both are generic                             |
| **Documentation**           | documentation-expert, technical-writer                                                             | Explicitly scoped: documentation-expert handles system/API docs; technical-writer handles user-facing content                      |
| **Planning**                | plan, gsd-planner, research-plan-team/planner                                                      | plan is the direct subagent; gsd-planner is GSD-integrated; team planner is the opus upgrade path                                  |
| **Research**                | explore, deep-research-searcher, gsd-project-researcher, gsd-phase-researcher, gsd-codebase-mapper | Each serves a different research context; explore is codebase-only, deep-research adds web, gsd-\* adds project lifecycle context  |

---

## 8. Missing Capabilities

### Research/Discovery Gaps

| Gap                                | Description                                                                 | Current Workaround                                    |
| ---------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Automated regression research**  | No agent specifically investigates "what broke and when" across git history | debugger + manual git log                             |
| **Cost/billing research**          | No agent analyzes Firebase billing, token costs, or infrastructure spend    | Manual analysis                                       |
| **User behavior research**         | No agent analyzes user analytics or usage patterns                          | Not applicable (privacy-first app, minimal analytics) |
| **Competitive analysis**           | No agent dedicated to analyzing competing products/features                 | deep-research-searcher can be directed to this        |
| **Cross-session pattern analysis** | No agent that reads session history to identify recurring issues            | /alerts skill does partial passive surfacing          |
| **Test failure analysis**          | No dedicated agent for analyzing test failure patterns across runs          | test-engineer does this manually per invocation       |

### Non-Research Gaps

| Gap                       | Description                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Accessibility auditor** | No dedicated agent for WCAG compliance auditing (front-end-developer mentions a11y but it's not the primary focus) |
| **Migration assistant**   | No agent specifically for data/schema migration planning (database-architect is generic)                           |

---

## 9. Invocation Patterns Summary

### How Agents Are Invoked

| Pattern                            | Count               | Examples                                                |
| ---------------------------------- | ------------------- | ------------------------------------------------------- |
| **Subagent via Task tool**         | Most common         | explore, plan, code-reviewer, security-auditor          |
| **Skill orchestrator spawns**      | GSD + deep-research | gsd-\*, deep-research-searcher/synthesizer              |
| **Team member**                    | 2 teams             | audit-review-team, research-plan-team                   |
| **Ad hoc by user**                 | Generic agents      | prompt-engineer, mcp-expert, database-architect         |
| **Delegated by CLAUDE.md trigger** | Core workflow       | code-reviewer (POST-TASK), security-auditor (POST-TASK) |

### Agent Lifecycle

| Type          | Lifecycle                                                                 | Cost Model                           |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| Subagent      | Spawn -> execute -> return result -> destroyed                            | 1x base cost per invocation          |
| Team member   | Spawn -> execute multiple tasks -> inter-agent messaging -> destroyed     | 3-4x base cost, amortized over tasks |
| Skill-spawned | Skill orchestrator creates -> executes within skill pipeline -> destroyed | Embedded in skill cost               |

---

## 10. Configuration Details

### settings.json Agent-Relevant Config

- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` -- Teams are ENABLED
- Agent invocation tracking: `track-agent-invocation.js` hook on PostToolUse for
  Task/Agent tool calls
- Agent compliance: `pre-commit-agent-compliance.js` hook on PreToolUse for Bash
  commands
- Token monitoring: Teams log to `.claude/state/agent-token-usage.jsonl`

### Agent Capacity Reference (from AGENT_ORCHESTRATION.md)

| Agent                | Items/Session | Speed  | Best For          |
| -------------------- | ------------- | ------ | ----------------- |
| security-auditor     | 8-12          | Fast   | Critical path     |
| code-reviewer        | 10-15         | Medium | Broadest scope    |
| test-engineer        | 5-8           | Slow   | Deep analysis     |
| documentation-expert | 8-12          | Fast   | Low risk          |
| backend-architect    | 3-5           | Slow   | Complex decisions |
| frontend-developer   | 6-10          | Medium | UI components     |
| performance-engineer | 3-7           | Slow   | Optimization      |
| debugger             | 5-9           | Medium | Forensic work     |

### Parallelization Rules

- Max concurrent agents: 4
- Parallel when: >= 12 items, >= 3 distinct files, >= 2 concern areas, no S0/S1
  security, items independent
- Sequential when: < 12 items, 1-2 files, S0/S1 present, items have dependencies

---

## 11. Key Findings Summary

1. **Total agent count: 41** (27 project-level + 14 global). Plus 2 team
   definitions with 5 virtual member roles.

2. **Model distribution is sonnet-heavy (83%):** 38 sonnet vs 8 opus. Opus
   reserved for high-stakes analytical work (database-architect,
   security-engineer, performance-engineer, test-engineer, fullstack-developer,
   penetration-tester, prompt-engineer, team planner).

3. **SoNash customization is concentrated:** Only 8 of 27 project-level agents
   are SoNash-customized (explore, plan, code-reviewer, security-auditor,
   frontend-developer, documentation-expert, test-engineer, dependency-manager).
   The other 19 are generic templates.

4. **7 agents are definitively underused:** error-detective,
   devops-troubleshooter, deployment-engineer, fullstack-developer,
   git-flow-manager, penetration-tester, mcp-expert. These have zero skill
   references and no CLAUDE.md triggers.

5. **Research capability is strong but fragmented:** 13 PRIMARY research agents
   exist, but they are spread across 3 systems (direct subagents, GSD pipeline,
   deep-research pipeline) with no unified research orchestration layer.

6. **The GSD agent family (13 agents) is the most structured:** Clear spawn
   triggers, inter-agent data flows, and lifecycle management. This is the gold
   standard for agent integration in the project.

7. **Debugging overlap is the most significant redundancy:** debugger,
   error-detective, devops-troubleshooter, and gsd-debugger all do investigation
   work. Only gsd-debugger has structured integration.

8. **Only 5 agents have explicit safeguards** (maxTurns, disallowedTools):
   explore, plan, code-reviewer, security-auditor are constrained. The other 23
   project-level agents run with default limits.

9. **Web search capability is limited to global agents:** Only
   deep-research-searcher, gsd-project-researcher, gsd-phase-researcher, and
   gsd-debugger have WebSearch/WebFetch tools. No project-level agent has web
   access.

10. **Team mode is the upgrade path for quality-sensitive work:**
    research-plan-team elevates the planner from sonnet to opus and adds a
    verifier role. This pattern could be applied to other workflows (e.g.,
    security audit team with opus-level security-engineer).
