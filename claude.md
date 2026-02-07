# AI Context & Rules for SoNash

**Document Version:** 4.1 **Last Updated:** 2026-02-07

---

## Purpose

This document provides essential context and rules for AI assistants working on
the SoNash project. It contains:

- Bleeding-edge stack versions to prevent false "outdated" warnings
- Critical security rules and anti-patterns to prevent vulnerabilities
- Architecture patterns and coding standards
- Required agent/skill triggers for specific tasks
- Documentation index and navigation guides

This is a **Tier 4 document** - always loaded in AI context to prevent repeated
violations and ensure consistency across sessions.

## Session Start Protocol (DO THIS FIRST)

> [!IMPORTANT] Hook output is collapsed in Claude Code UI. You MUST proactively
> surface alerts - they won't be seen otherwise.

**At the start of EVERY session:**

1. **Read `.claude/pending-alerts.json`** - Tell the user about alerts in your
   first response. Example: "You have 3 deferred PR items and 2 S1 backlog
   items. Want details?"

2. **Search Episodic Memory** - Use
   `mcp__plugin_episodic-memory_episodic-memory__search` to find relevant
   context from past sessions:
   - Query current branch/feature name + "decisions"
   - Query recent error patterns if debugging
   - Summarize relevant findings for the user

3. **Follow checklist** - SESSION_CONTEXT.md, ROADMAP.md, active blockers

4. **Before compaction** - Use `mcp__serena__write_memory()` to save critical
   decisions that must survive context reset (optional, for important decisions)

---

## AI Instructions

This is the primary context file for Claude Code sessions:

- Read this file at session start
- Follow all patterns in Section 4
- Reference linked docs for detailed procedures

---

## 1. Stack Versions (Bleeding Edge)

**DO NOT** flag these as invalid - they're newer than your training cutoff:

| Package      | Version | Notes       |
| ------------ | ------- | ----------- |
| Next.js      | 16.1.1  | App Router  |
| React        | 19.2.3  | Stable      |
| Firebase     | 12.8.0  | Modular SDK |
| Tailwind CSS | 4.1.9   |             |
| Zod          | 4.2.1   |             |

## 2. Security Rules

> [!WARNING] Security violations lead to immediate rejection.

1. **NO DIRECT WRITES** to `journal`, `daily_logs`, `inventoryEntries` - use
   Cloud Functions (`httpsCallable`)
2. **App Check Required** - all Cloud Functions verify tokens
3. **Rate Limiting** - handle `429` errors gracefully (use `sonner` toasts)

## 3. Architecture

**Repository Pattern**: `lib/firestore-service.ts`

- Add new queries to service files, not inline in components
- Use types from `types/` or `functions/src/schemas.ts`

## 4. Critical Anti-Patterns

> ⚠️ **SELF-AUDIT**: Scan before writing shell scripts, workflows, or security
> code.

**Top 5 (enforced by `npm run patterns:check`):**

| Pattern            | Rule                                                              |
| ------------------ | ----------------------------------------------------------------- |
| Error sanitization | Use `scripts/lib/sanitize-error.js` - never log raw error.message |
| Path traversal     | Use `/^\.\.(?:[\\/]&#124;$)/.test(rel)` NOT `startsWith('..')`    |
| Test mocking       | Mock `httpsCallable`, NOT direct Firestore writes                 |
| File reads         | Wrap ALL in try/catch (existsSync race condition)                 |
| exec() loops       | `/g` flag REQUIRED (no /g = infinite loop)                        |

**Full Reference**:
[docs/agent_docs/CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md) (230+
patterns with priority tiers 🔴/🟡/⚪ from 259 reviews)

**Pre-Write Checklist**:
[docs/agent_docs/SECURITY_CHECKLIST.md](docs/agent_docs/SECURITY_CHECKLIST.md) -
Check BEFORE writing scripts that handle file I/O, git, CLI args, or shell
commands. Use helpers from `scripts/lib/security-helpers.js`.

**App-Specific:**

- `migrateAnonymousUserData` handles merges - don't merge manually
- Google OAuth requires COOP/COEP headers in `firebase.json`
- Meeting widget `setInterval`: define `useCallback` before effect

## 5. Documentation Index

| Document                                               | Purpose                                      |
| ------------------------------------------------------ | -------------------------------------------- |
| [AI_WORKFLOW.md](./AI_WORKFLOW.md)                     | **START HERE** - session startup, navigation |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                   | Schema, security layers, components          |
| [DEVELOPMENT.md](./DEVELOPMENT.md)                     | Setup, testing, directory structure          |
| [ROADMAP.md](./ROADMAP.md)                             | Planned vs completed features                |
| [SESSION_CONTEXT.md](./SESSION_CONTEXT.md)             | Current sprint, recent context               |
| [docs/SESSION_DECISIONS.md](docs/SESSION_DECISIONS.md) | Decision log to survive context compaction   |

## 6. Agent/Skill Triggers

> [!CAUTION] Agents are REQUIRED when triggers match - not optional suggestions.

### PRE-TASK (before starting work)

| Trigger                       | Action                       | Tool  | Parallel? | Team? |
| ----------------------------- | ---------------------------- | ----- | --------- | ----- |
| Bug/error/unexpected behavior | `systematic-debugging`       | Skill | No        | No    |
| Exploring unfamiliar code     | `Explore` agent              | Task  | No        | No    |
| Multi-step implementation     | `Plan` agent                 | Task  | No        | No    |
| Multi-file feature (3+ files) | Development team             | Team  | Yes       | Yes   |
| Security/auth (no S0/S1)      | `security-auditor` agent     | Task  | Yes       | No    |
| New documentation             | `documentation-expert` agent | Task  | Yes       | No    |
| UI/frontend work              | `frontend-design` skill      | Skill | Yes       | No    |
| Code review <12 items         | `code-reviewer` agent        | Task  | No        | No    |
| Code review 12-19 items       | Multiple agents              | Task  | Yes       | No    |
| Code review >= 20 items       | Review team                  | Team  | Yes       | Yes   |
| Audits (comprehensive)        | Audit team                   | Team  | Yes       | Yes   |
| Audits (single domain)        | Domain audit agent           | Task  | Yes       | No    |

### POST-TASK (before committing)

| What You Did        | Action                       | Tool | Parallel? |
| ------------------- | ---------------------------- | ---- | --------- |
| Wrote/modified code | `code-reviewer` agent        | Task | See above |
| New documentation   | `documentation-expert` agent | Task | Yes       |
| Security changes    | `security-auditor` agent     | Task | See above |

**Session End**: Run `/session-end` for full audit checklist.

### 6.2 Delegated Code Review

After modifying 5+ code files, the `agent-trigger-enforcer.js` hook queues a
delegated review to `.claude/state/pending-reviews.json`. When this triggers:

1. Spawn a `code-reviewer` subagent with the diff of changes
2. The subagent writes findings to a file (not inline in conversation)
3. Main conversation reads the summary — saves 1000+ tokens of review output

This keeps the orchestrating conversation lean and compaction-safe.

**With Agent Teams enabled:** Instead of queuing to pending-reviews.json, spawn
a persistent reviewer teammate. The reviewer works in background while the main
session continues coding. The reviewer can message the lead to ask about intent
behind specific changes, producing higher quality reviews.

**Without Agent Teams:** Continue using pending-reviews.json queue + subagent
pattern (current behavior).

### 6.3 Parallelization Decision Matrix

**When to Use Parallel Agents:**

Use PARALLEL execution when **ALL** criteria are met:

| Criterion         | Threshold           |
| ----------------- | ------------------- |
| Total items       | ≥ 12                |
| Distinct files    | ≥ 3                 |
| Concern areas     | ≥ 2                 |
| Security severity | None are S0/S1      |
| Dependencies      | Items are unrelated |

**Max concurrent agents:** 4 (prevents context overload)

**When to Use Sequential:**

- < 12 items total
- Issues in 1-2 files only
- S0/S1 security issues present (require immediate, focused attention)
- Items have dependencies (A → B → C)
- Simple/straightforward fixes

### 6.4 Agent Grouping Strategy

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
2. If 1 area has ≥60% of items → single agent
3. Otherwise, distribute across 2-4 agents
4. Target 4-8 items per agent

### 6.5 Parallel Agent Coordination

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

### 6.6 Agent Capacity Reference

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

### 6.7 Agent Teams (Experimental)

> [!NOTE] Agent teams require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in
> settings.json env. If not enabled, fall back to subagent patterns in 6.3-6.6.

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

#### Team Formation Triggers

Form an agent team automatically when ALL criteria are met:

| Criterion               | Threshold                             |
| ----------------------- | ------------------------------------- |
| Estimated work items    | >= 15                                 |
| Distinct concern areas  | >= 3                                  |
| Cross-cutting potential | High (items likely affect each other) |
| User hasn't opted out   | No "use subagents" instruction        |

#### Standard Team Configurations

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

#### Team Budget Limits

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

#### Team Lifecycle

1. **Formation:** Lead announces team creation, assigns initial tasks
2. **Execution:** Teammates claim tasks from shared list, message on
   cross-cutting
3. **Coordination:** Lead resolves file conflicts (CRITICAL fixes first)
4. **Completion:** Lead collects all results, shuts down teammates
5. **Handoff:** Lead writes summary to conversation (not teammates)

#### When NOT to Form Teams

- Single-file changes (any complexity)
- Sequential workflows where Step N depends on Step N-1
- User explicitly requests subagents or sequential work
- Session is already past 50% context usage (team overhead risks compaction)
- Simple bug fixes, even across multiple files
- Hook/script development (shell-based, no team benefit)

## 7. Context Preservation & Compaction Safety

> [!IMPORTANT] Prevent loss of important decisions during context compaction.

### 7.1 Decision Logging

**Auto-save to `docs/SESSION_DECISIONS.md` when:**

- Presenting 3+ options to user for a decision
- User makes a significant architectural/feature choice
- Discussing implementation approaches with trade-offs
- Any decision that would be painful to re-research

**Format:**

```markdown
### [DATE] - [SHORT TITLE]

**Context:** What prompted this **Options:** Numbered list of choices **User
Choice:** What was selected **Implementation:** Link to PR/commit/roadmap
```

### 7.2 File-Based State Persistence

**For any multi-step task (3+ steps)**, write progress to
`.claude/state/task-{name}.state.json`:

```json
{
  "task": "task-name",
  "started": "ISO datetime",
  "lastUpdated": "ISO datetime",
  "steps": [
    { "name": "Step 1", "status": "completed", "output": "file.md" },
    { "name": "Step 2", "status": "in_progress" },
    { "name": "Step 3", "status": "pending" }
  ],
  "context": { "branch": "branch-name", "notes": "key info" }
}
```

This file survives compaction and enables clean resumption. Update it after
completing each step. The `.claude/state/` directory is gitignored for ephemeral
session data.

### 7.3 Compaction-Resilient State Persistence (4 Layers)

Automatic multi-layer defense against state loss during context compaction:

| Layer         | Hook                     | Trigger                       | Output                           |
| ------------- | ------------------------ | ----------------------------- | -------------------------------- |
| A: Commit Log | `commit-tracker.js`      | PostToolUse: Bash             | `.claude/state/commit-log.jsonl` |
| B: Threshold  | `compaction-handoff.js`  | PostToolUse: Read (25+ files) | `.claude/state/handoff.json`     |
| C: PreCompact | `pre-compaction-save.js` | PreCompact (auto/manual)      | `.claude/state/handoff.json`     |
| Restore       | `compact-restore.js`     | SessionStart:compact          | stdout (context injection)       |
| D: Gap Detect | `check-session-gaps.js`  | Session begin (npm script)    | Console warnings                 |

- **Layer A** logs every git commit to append-only JSONL — survives all failure
  modes including crashes
- **Layer C** is the most reliable — fires at exactly the right moment before
  compaction, captures full task states + commit log + git context
- **Restore** automatically outputs structured recovery context after compaction
  (task progress, recent commits, git status)
- **Layer D** detects sessions missing from SESSION_CONTEXT.md at next session
  start (`npm run session:gaps`)

**On session resume after compaction:**

1. `compact-restore.js` auto-outputs recovery context (no manual action needed)
2. Read `.claude/state/handoff.json` for full details if needed
3. Read any `.claude/state/task-*.state.json` for in-progress tasks
4. Cross-reference with `git log --oneline -5` and `git status`

**One-time setup:** Run `node scripts/seed-commit-log.js` to backfill commit log
from git history.

### 7.4 Other Preservation Tools

- Writing detailed plans to `.claude/plans/` before implementation
- Using `/checkpoint` before risky operations
- **MCP Memory for cross-session context** - Save important context with
  `mcp__memory__create_entities()` before compaction, retrieve with
  `mcp__memory__read_graph()` at session start

### 7.5 Pre-Commit Failure Recovery

When `git commit` fails on pre-commit hooks, use `/pre-commit-fixer` to classify
and fix failures efficiently instead of manual fix-retry cycles. Category A
errors (doc index, cross-doc deps) are auto-fixable inline. Category B errors
(ESLint, pattern violations) should be delegated to a focused subagent.

### 7.6 Agent Team Compaction Safety

Agent teams have unique compaction challenges because each teammate is a
separate context window:

- **Lead compaction:** If the lead's context compacts, teammates keep working.
  On restore, lead reads handoff.json + checks team status via task list.
- **Teammate compaction:** Individual teammates may compact independently. They
  restore from their own context. Lead should check teammate status after any
  pause.
- **Pre-compaction save:** The `pre-compaction-save.js` hook captures team
  status in handoff.json (active teammates, their assigned tasks, completion
  status).
- **Budget monitoring:** If total team token usage exceeds 80% of budget, lead
  should proactively wind down the team to prevent mid-work compaction.

## 8. Coding Standards

- **TypeScript**: Strict mode, no `any`
- **Components**: Functional + Hooks
- **Styling**: Tailwind (utility-first)
- **State**: `useState` local, Context global, Firestore server
- **Validation**: Zod runtime matching TS interfaces

---

## Version History

| Version | Date       | Description                                                                                                           |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 4.1     | 2026-02-07 | Added 6.7 (Agent Teams), 7.6 (Team Compaction Safety); updated 6.2, PRE-TASK table; updated audit-comprehensive skill |
| 4.0     | 2026-02-07 | Rewrote 7.3: 4-layer compaction-resilient state persistence (commit-tracker, PreCompact, compact-restore, gap detect) |
| 3.9     | 2026-02-05 | Added 7.2-7.5: File-based state persistence, compaction handoff, pre-commit fixer; Added 6.2: Delegated code review   |
| 3.7     | 2026-02-02 | Added sections 6.3-6.6: Parallelization guidance, agent grouping, coordination, capacity reference                    |
| 3.6     | 2026-01-28 | Promoted Session Start Protocol to top, fixed table formatting, added save reminder                                   |
| 3.5     | 2026-01-28 | Added Session Start Protocol - read alerts file, check MCP memory                                                     |
| 3.3     | 2026-01-18 | Updated CODE_PATTERNS.md count to 180+ with priority tiers (🔴/🟡/⚪)                                                 |
| 3.2     | 2026-01-17 | Added Section 7: Context Preservation - auto-save decisions to SESSION_DECISIONS.md                                   |
| 3.1     | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 → CODE_PATTERNS.md (10 Documentation patterns)                                       |
| 3.0     | 2026-01-05 | Refactored for conciseness: moved 90+ patterns to CODE_PATTERNS.md                                                    |
| 2.9     | 2026-01-05 | CONSOLIDATION #5: Reviews #51-60                                                                                      |
| 2.8     | 2026-01-04 | CONSOLIDATION #4: Reviews #41-50                                                                                      |
| 2.7     | 2026-01-03 | Added mandatory session-end audit                                                                                     |
| 2.6     | 2026-01-03 | Added CodeRabbit CLI integration                                                                                      |

---

**Before refactoring**: Check `SESSION_CONTEXT.md` and `ROADMAP.md` first.
**Before adding features**: Align with ROADMAP.md vision (Privacy-First,
Evidence-Based).
