# audit-review-team

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-24
**Status:** ACTIVE
**Source:** agent-env Phase 4, Step 4.2
<!-- prettier-ignore-end -->

## Purpose

Coordinates audit execution workflows where a reviewer produces findings and a
fixer implements remediation. Used for skill audits, code review audits, and
ecosystem audits where cross-domain findings sharing improves quality and the
reviewer-fixer loop benefits from persistent context across multiple audit
targets.

## Member Roster

| #   | Agent Name | Role     | Model  | Tools                               | Purpose                                                                                                                  |
| --- | ---------- | -------- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | reviewer   | Analyst  | sonnet | Read, Grep, Glob, Bash              | Reads code/artifacts, evaluates against audit categories, produces structured findings with severity and file references |
| 2   | fixer      | Executor | sonnet | Read, Write, Edit, Bash, Grep, Glob | Implements fixes from reviewer findings, drafts prompt rewrites, proposes concrete code changes                          |

### Why 2 Members (Not More)

Per learnings from Session #225 (feedback_agent_teams_learnings.md):

- Token cost scales linearly per teammate (each gets own context window)
- 2-member teams run ~3x solo cost; 3+ members push to 4-7x
- The reviewer-fixer pipeline is sequential, not parallel -- adding a third
  member would idle-wait most of the time
- Idle notification flood increases with team size (50%+ inbox at 4 members)

## Spawn Trigger

Spawn this team when ANY of these conditions are met:

1. **`/audit-*` or `/skill-audit` invocation** targeting 3+ artifacts
2. **`/audit-comprehensive`** on any domain
3. **Manual audit** across 5+ agents, skills, or ecosystem components
4. **Post-phase audit checkpoint** (e.g., after Phase 3 or Phase 5 of a plan)

Do NOT spawn for:

- Single-file code review (use `code-reviewer` agent directly)
- Quick spot-checks on 1-2 items (subagent is sufficient)
- Security-specific audits (use `security-auditor` agent directly)

## Coordination Model

```
                    +------------------+
                    |   Team Lead      |
                    | (main session)   |
                    +--------+---------+
                             |
                    Assigns audit target
                             |
              +--------------+--------------+
              |                             |
     +--------v---------+         +--------v---------+
     |    reviewer       |         |    fixer          |
     | Evaluates target  |  --->   | Drafts fixes for  |
     | against categories|  msg    | each finding       |
     | Scores findings   |         | Sends back to lead |
     +------------------+         +-------------------+
```

### Message Flow (per audit target)

1. **Lead -> reviewer:** "Audit [target]. Categories: [list]. Output structured
   findings."
2. **reviewer -> fixer (via SendMessage):** "Findings for [target]: [structured
   list with severity, file:line, description]."
3. **fixer -> Lead (via SendMessage):** "Proposed fixes for [target]:
   [per-finding fix with code snippets or prompt rewrites]."
4. **Lead -> user:** Presents reviewer findings + fixer proposals together. User
   decides: implement, backlog, or skip per finding.

### Cross-Target Pattern Accumulation

The persistent context benefit emerges after 3+ targets:

- **reviewer** recognizes systemic patterns: "Same missing return protocol as
  targets #2, #4, #7 -- this is a systemic gap, not isolated."
- **fixer** reuses proven fixes: "Applied the same prompt pattern that worked
  for target #3 -- confirmed effective."
- **Lead** tracks pattern frequency for prioritized systemic fixes after
  individual audits complete.

## Persistence Model

**Ephemeral (per-audit invocation).**

Rationale (per Decision #15 and frequency thresholds from research):

- Audits are distinct workstreams, not continuous background tasks
- Each audit run has clear start/end boundaries
- Persistent teams cost tokens when idle between audit invocations
- The frequency threshold for persistent teams (5+ invocations/session) is
  rarely met for audits

### Lifecycle

```
1. Skill/workflow triggers team spawn
2. TeamCreate("audit-review-team") with 2 members
3. Reviewer + fixer process all audit targets
4. Lead collects cross-target patterns
5. TeamDelete after final target + debrief
```

Expected duration: 15-45 minutes depending on target count.

## Example Invocation

### TeamCreate Call

```
TeamCreate("audit-review-team")
  members:
    - name: "reviewer"
      role: "Audit analyst. Read artifacts, evaluate against provided audit
            categories, produce structured findings with severity (CRITICAL /
            WARNING / SUGGESTION), file:line references, and descriptions.
            After 3+ targets, flag systemic patterns. Send findings to fixer
            via SendMessage."
      model: "sonnet"
      tools: ["Read", "Grep", "Glob", "Bash"]

    - name: "fixer"
      role: "Fix implementer. Receive findings from reviewer. For each finding,
            draft a concrete fix (code change, prompt rewrite, config update).
            Reuse proven patterns from earlier targets when applicable. Send
            proposed fixes to team lead via SendMessage."
      model: "sonnet"
      tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
```

### Task Assignment Example (skill-audit on 5 skills)

```
SendMessage("reviewer", "Audit these 5 skills against the 11 skill-audit
  categories: [skill-1, skill-2, skill-3, skill-4, skill-5]. Process one at a
  time. After each, send findings to fixer. After all 5, send a systemic
  patterns summary to me.")
```

### Debrief and Teardown

```
SendMessage("reviewer", "Send final systemic patterns summary.")
SendMessage("fixer", "Send reusable fix patterns that worked across targets.")
# Lead compiles into audit report
TeamDelete("audit-review-team")
```

## Constraints and Guardrails

1. **reviewer is read-only for audit targets.** It reads and analyzes but does
   not modify files. All modifications go through fixer, with user approval.
2. **fixer proposes, does not auto-apply.** All fix proposals are presented to
   the user before implementation. Per CLAUDE.md guardrail #2: never implement
   without explicit approval.
3. **5-6 tasks per teammate maximum** (per Session #225 learnings). For audits
   with 10+ targets, batch into groups of 5.
4. **No nested teams.** This team cannot spawn sub-teams (Claude Code
   limitation: one team per session).
5. **No file conflict risk.** reviewer reads only; fixer writes only after
   reviewer is done with a target. Sequential per-target pipeline prevents
   concurrent edits.
6. **Token budget awareness.** At ~3x solo cost, a 5-target audit consumes
   roughly the same tokens as 15 solo agent invocations. Justify team usage when
   targets < 3.

## Integration Points

| System                 | Integration                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `/skill-audit`         | Spawn team when target count >= 3                              |
| `/audit-comprehensive` | Always spawn team (comprehensive audits are multi-target)      |
| CLAUDE.md Section 7    | Trigger table: "audit execution" -> audit-review-team          |
| Pre-commit hooks       | Not applicable (audits run interactively, not in commit flow)  |
| Token monitoring       | Log to `.claude/state/agent-token-usage.jsonl` via PostToolUse |
