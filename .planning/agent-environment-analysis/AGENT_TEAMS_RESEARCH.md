# Agent Teams Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
**Source:** Session #225, Phase 1 Step 1.4 (teams-researcher)
<!-- prettier-ignore-end -->

## Executive Summary

Agent Teams is an experimental feature (shipped with Opus 4.6, Feb 2026)
coordinating multiple Claude Code instances as a unified group. Unlike subagents
(which report results back), team members communicate directly through shared
task lists and messaging.

---

## Architecture

| Component | Role                                                           |
| --------- | -------------------------------------------------------------- |
| Team Lead | Main session; creates team, spawns teammates, coordinates      |
| Teammates | Independent instances with own context windows (up to 1M each) |
| Task List | Shared work items with status, ownership, dependencies         |
| Mailbox   | Inbox-based direct inter-agent communication                   |

**Display modes:** in-process (default), split panes (tmux/iTerm2), auto

---

## Token Cost Model

| Configuration | Approximate Token Usage |
| ------------- | ----------------------- |
| Solo session  | ~200K tokens            |
| 3 subagents   | ~440K tokens            |
| 3-person team | ~800K tokens            |
| 5-person team | ~1.2M+ tokens           |

**Team mode with plan mode:** ~7x more tokens than standard sessions.

### Cost Drivers

1. Each teammate gets own full context window — scales linearly
2. Active teammates consume tokens even when idle
3. Each message adds to both sender's and receiver's context
4. Spawn prompt overhead (CLAUDE.md + MCP + skills + prompt)

### Optimization Strategies

- Sonnet for teammates (balance capability and cost)
- Small teams (3-5 max)
- Focused spawn prompts
- Clean up teams when done
- 5-6 tasks per teammate optimal ratio

---

## Subagents vs. Teams Decision Matrix

| Criterion        | Subagents                  | Agent Teams                       |
| ---------------- | -------------------------- | --------------------------------- |
| Context          | Own window; results return | Own window; fully independent     |
| Communication    | Report back only           | Direct inter-agent messaging      |
| Best for         | Focused tasks, result-only | Complex work requiring discussion |
| Token cost       | Lower                      | 3-7x higher                       |
| Inter-agent talk | Not possible               | Direct messaging                  |
| Persistence      | Ephemeral                  | Until shutdown                    |

**Decision rule:** If agents would benefit from **talking to each other during
execution**, use a team. Otherwise use subagents.

---

## Workflow Benefit Analysis

| Workflow               | Benefit | Recommendation                                                |
| ---------------------- | ------- | ------------------------------------------------------------- |
| Audit Execution        | HIGH    | Teams — cross-domain findings sharing                         |
| Development (3+ files) | HIGH    | Teams — parallel test/doc writing                             |
| Deep-Plan Execution    | MEDIUM  | Teams only for 3+ parallel phases                             |
| Convergence Loop       | MEDIUM  | Teams for milestone audits spanning 3+ phases                 |
| Session Lifecycle      | LOW     | Stay with subagents                                           |
| Research Phase         | MEDIUM  | Current subagent pattern works; upgrade if high cross-cutting |

---

## Frequency Thresholds

| Invocations/Session | Recommendation                           |
| ------------------- | ---------------------------------------- |
| 1                   | Subagent (always)                        |
| 2                   | Subagent (unless high cross-cutting)     |
| 3-4                 | Team if inter-agent communication needed |
| 5+                  | Team (amortized spawn cost justified)    |

---

## Team Composition Patterns

### Pattern 1: Parallel Specialists (Research/Review)

3-5 teammates with distinct domain lens. Minimal inter-agent comms. Lead
synthesizes.

### Pattern 2: Sequential Pipeline with Parallel Support

Lead drives main workflow. 1-2 teammates handle parallel auxiliary work.

### Pattern 3: Adversarial Debate

3-5 teammates with competing hypotheses. High inter-agent comms.

### Pattern 4: Self-Organizing Swarm

Workers claim tasks from shared queue independently. Minimal comms.

---

## Known Limitations

1. No session resumption (`/resume` doesn't restore teammates)
2. One team per session
3. No nested teams
4. Lead is fixed (can't transfer leadership)
5. Split panes not supported in VS Code terminal or Windows Terminal
6. Idle ping flood (>50% of inbox can be idle notifications)
7. File conflicts (two teammates editing same file)

---

## Gaps to Address in This Project

1. **No TeammateIdle/TaskCompleted hooks** — no quality gates on teammate output
2. **No team observability** — no metrics tracking for team performance
3. **No team-specific CLAUDE.md guidance** — teammates load same CLAUDE.md
4. **GSD agents don't reference teams** — designed as subagents, need prompt
   mods

---

## Implementation Priority

| Priority | Workflow             | Team Type               | Token Overhead |
| -------- | -------------------- | ----------------------- | -------------- |
| P1       | Comprehensive Audit  | 2-4 specialists         | ~4x solo       |
| P2       | Multi-File Features  | 2-3 (impl + test + doc) | ~3x solo       |
| P3       | Large PR Review      | 2-3 specialists         | ~3x solo       |
| P4       | Multi-Phase Planning | 2 (only for 3+ phases)  | ~2x solo       |
