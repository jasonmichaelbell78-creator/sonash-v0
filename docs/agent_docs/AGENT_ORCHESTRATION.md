# Agent Orchestration Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Status:** ACTIVE
<!-- prettier-ignore-end -->

## Purpose

Detailed guidance for parallelizing agents, forming teams, and managing
multi-agent coordination. Loaded on-demand when spawning agents.

**Source:** Extracted from claude.md Sections 6.2-6.7 (v4.2)

---

## Delegated Code Review

After modifying 5+ code files, a delegated review should be triggered per
CLAUDE.md Section 6 POST-TASK triggers. When this applies:

1. Spawn a `code-reviewer` subagent with the diff of changes
2. The subagent writes findings to a file (not inline in conversation)
3. Main conversation reads the summary — saves 1000+ tokens of review output

> **Note:** The `agent-trigger-enforcer.js` hook was removed. Code review
> triggering is now managed through CLAUDE.md Section 6 guidance.

This keeps the orchestrating conversation lean and compaction-safe.

**With Agent Teams enabled:** Instead of queuing to pending-reviews.json, spawn
a persistent reviewer teammate. The reviewer works in background while the main
session continues coding. The reviewer can message the lead to ask about intent
behind specific changes, producing higher quality reviews.

**Without Agent Teams:** Continue using pending-reviews.json queue + subagent
pattern (current behavior).

## Parallelization Decision Matrix

**When to Use Parallel Agents:**

Use PARALLEL execution when **ALL** criteria are met:

| Criterion         | Threshold           |
| ----------------- | ------------------- |
| Total items       | >= 12               |
| Distinct files    | >= 3                |
| Concern areas     | >= 2                |
| Security severity | None are S0/S1      |
| Dependencies      | Items are unrelated |

**Max concurrent agents:** 4 (prevents context overload)

**When to Use Sequential:**

- < 12 items total
- Issues in 1-2 files only
- S0/S1 security issues present (require immediate, focused attention)
- Items have dependencies (A -> B -> C)
- Simple/straightforward fixes

## Agent Grouping Strategy

**Group by Concern Area:**

| Concern       | Primary Agent          |
| ------------- | ---------------------- |
| Security      | `security-auditor`     |
| Testing       | `test-engineer`        |
| Performance   | `performance-engineer` |
| Documentation | `documentation-expert` |
| Architecture  | `backend-architect`    |
| Code Quality  | `code-reviewer`        |
| UI/Frontend   | `frontend-developer`   |

**Batching Algorithm:**

1. Count items per concern area
2. If 1 area has >= 60% of items -> single agent
3. Otherwise, distribute across 2-4 agents
4. Target 4-8 items per agent

## Parallel Agent Coordination

**Execution Protocol:**

1. **Invoke** all agents in SINGLE Task message (parallel)
2. **Each agent** receives: file list, issue numbers, awareness of other agents
3. **Agents work independently** (no inter-agent communication)
4. **Collect results** when all complete
5. **Verify** no overlapping file edits
6. **Merge** in priority order (CRITICAL first)

**Conflict Resolution:**

If 2+ agents modified same file:

1. Re-read original file
2. Apply CRITICAL fixes first
3. Re-read, apply remaining fixes
4. Verify merged result compiles/tests pass

**Escalation Triggers:**

| Situation            | Action              |
| -------------------- | ------------------- |
| Agent exceeds 30 min | Resume next session |
| 3+ file conflicts    | Re-run sequentially |
| Agent returns errors | Log, defer, notify  |

## Agent Capacity Reference

| Agent                  | Items/Session | Speed  | Best For          |
| ---------------------- | ------------- | ------ | ----------------- |
| `security-auditor`     | 8-12          | Fast   | Critical path     |
| `code-reviewer`        | 10-15         | Medium | Broadest scope    |
| `test-engineer`        | 5-8           | Slow   | Deep analysis     |
| `documentation-expert` | 8-12          | Fast   | Low risk          |
| `backend-architect`    | 3-5           | Slow   | Complex decisions |
| `frontend-developer`   | 6-10          | Medium | UI components     |
| `performance-engineer` | 3-7           | Slow   | Optimization      |
| `debugger`             | 5-9           | Medium | Forensic work     |

## Agent Teams (Experimental)

> **Note:** Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in
> settings.json env. If not enabled, fall back to subagent patterns above.

**Agent teams vs. subagents — use the right tool:**

| Situation                         | Use Subagents | Use Agent Team |
| --------------------------------- | ------------- | -------------- |
| Bounded, independent tasks        | Yes           | No (overkill)  |
| Tasks need to share findings      | No            | Yes            |
| Quick one-off analysis            | Yes           | No             |
| Multi-file feature implementation | No            | Yes            |
| Cross-domain audit (7 categories) | Possible      | Preferred      |
| PR review with 20+ items          | Possible      | Preferred      |
| Single code review pass           | Yes           | No             |

**Decision rule:** If agents would benefit from talking to each other during
execution (not just reporting results), use a team. Otherwise use subagents.

### Team Formation Triggers

Form an agent team automatically when ALL criteria are met:

| Criterion               | Threshold                             |
| ----------------------- | ------------------------------------- |
| Estimated work items    | >= 15                                 |
| Distinct concern areas  | >= 3                                  |
| Cross-cutting potential | High (items likely affect each other) |
| User hasn't opted out   | No "use subagents" instruction        |

### Standard Team Configurations

**Audit Team** (for `/audit-comprehensive`):

- Lead: orchestrator + aggregator
- Teammates: 2-4 domain specialists (grouped by related domains)
- Groupings: {code+refactoring}, {security+performance}, {docs+process+eng-prod}
- Communication: teammates flag cross-cutting findings to lead and relevant peer

**Review Team** (for PR reviews with 20+ items):

- Lead: triages items, synthesizes final report
- Teammates: grouped by concern (security, code-quality, testing)
- Communication: security teammate alerts code-quality teammate about auth
  issues

**Development Team** (for multi-file feature work):

- Lead: primary implementer
- Teammate 1: test writer (writes tests in parallel with implementation)
- Teammate 2: doc updater (keeps docs in sync with changes)
- Communication: test writer asks lead about expected behavior; doc writer asks
  about API surface changes

### Team Budget Limits

| Team Type   | Max Teammates | Token Budget | Auto-Shutdown                |
| ----------- | ------------- | ------------ | ---------------------------- |
| Audit       | 4             | 250K total   | After aggregation complete   |
| Review      | 3             | 200K total   | After all items addressed    |
| Development | 2             | 300K total   | When feature branch is ready |
| Exploration | 2             | 100K total   | When question is answered    |

If a team approaches its token budget, the lead should:

1. Message teammates to wrap up current work
2. Collect partial results
3. Shut down teammates
4. Continue as single agent with collected context

### Team Lifecycle

1. **Formation:** Lead announces team creation, assigns initial tasks
2. **Execution:** Teammates claim tasks from shared list, message on
   cross-cutting
3. **Coordination:** Lead resolves file conflicts (CRITICAL fixes first)
4. **Completion:** Lead collects all results, shuts down teammates
5. **Handoff:** Lead writes summary to conversation (not teammates)

### When NOT to Form Teams

- Single-file changes (any complexity)
- Sequential workflows where Step N depends on Step N-1
- User explicitly requests subagents or sequential work
- Session is already past 50% context usage (team overhead risks compaction)
- Simple bug fixes, even across multiple files
- Hook/script development (shell-based, no team benefit)

## Version History

| Version | Date       | Change                                  |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2026-02-10 | Extracted from claude.md v4.2 S6.2-S6.7 |
