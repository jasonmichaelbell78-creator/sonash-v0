# Findings: SQ5 (Part B) — Which HOOK and SESSION Workflows Currently Lack Dedicated Agents?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ5-B

---

## Executive Summary

The hook and session ecosystem has 15 hook scripts, 4 multi-step skills
(session-begin, session-end, pr-review, pre-commit-fixer), and 1 retrospective
skill (pr-retro). Agent invocation is currently **sparse and inconsistent**.
Only 2 of 15 hook scripts explicitly check for agent compliance; 0 hooks
actively spawn agents. The skills invoke agents conditionally (pr-review Step 3
for 20+ items; pre-commit-fixer Step 4 for ESLint/pattern failures) but these
are advisory patterns — they are not wired to mandatory agent invocation. Five
high-value gaps were identified where dedicated agents would materially improve
output quality and consistency.

---

## Key Findings

### Finding 1: PreToolUse Hook — Agent Compliance Is Checking, Not Spawning [CONFIDENCE: HIGH]

The `pre-commit-agent-compliance.js` hook (PreToolUse, fires before
`git commit`) checks `.claude/hooks/.session-agents.json` to verify
`code-reviewer` and `security-auditor` were invoked before allowing a commit
[1]. If they were not invoked, it exits with code 2 (block) and prints a
message.

**What it does:** Passive compliance gate. It reads the agent invocation list
and blocks if required agents are absent.

**What it does NOT do:** It cannot spawn agents. It has no mechanism to
autonomously invoke `code-reviewer` or `security-auditor`. It simply refuses the
commit and tells the user to run the agents manually.

**Gap:** Prior Decision #28 proposed wiring PreToolUse hooks to mandatory agent
invocation. The implementation today fulfills the blocking half but not the
spawning half. A dedicated `pre-commit-reviewer` agent that reads staged files,
runs the code-reviewer pass, and writes the result to `.session-agents.json`
would close this gap. Without it, the flow degrades to a soft gate that can be
bypassed with `--no-verify`.

**Sources:** `.claude/hooks/pre-commit-agent-compliance.js` (lines 64-91),
`.claude/settings.json` PreToolUse section [1, 2].

---

### Finding 2: PostToolUse Hook — Agent Trigger Enforcer Is Advisory-Only [CONFIDENCE: HIGH]

The `post-write-validator.js` hook (PostToolUse, fires after
Write/Edit/MultiEdit) includes an `agentTriggerEnforcer` function [1]. This
function reads `scripts/config/agent-triggers.json`, which maps file patterns to
agents:

- `.ts|.tsx|.js|.jsx` files → `code-reviewer`
- `functions/src/**/*.ts` files → `security-auditor`
- `firestore.rules` → `security-auditor`

The enforcer operates in three phases (controlled by
`.claude/hooks/.agent-trigger-state.json`):

- Phase 1: SUGGEST (default) — writes suggestion to stderr, no blocking
- Phase 2: WARNING — stronger guidance
- Phase 3: BLOCKING — blocks the operation

**Gap:** The enforcer is currently Phase 1 (advisory) for all projects. There is
no evidence in `.agent-trigger-state.json` that it has been promoted to Phase 2
or 3. The `agentTriggers` config only covers `code-reviewer` and
`security-auditor` for three file patterns — it omits test files (which should
trigger `test-engineer`), documentation files (which should trigger
`documentation-expert`), and hook scripts (which should trigger
`security-auditor` and potentially a dedicated `hook-validator` agent).

**Sources:** `.claude/hooks/post-write-validator.js` (lines 834-1034),
`scripts/config/agent-triggers.json` [1, 3].

---

### Finding 3: Session-Begin Skill — No Agent Spawning Despite Complex Health Analysis [CONFIDENCE: HIGH]

The `session-begin` SKILL.md (v2.0, 2026-03-16) runs 9 health scripts in Phase 3
and performs multi-layer gate checks in Phase 4, including: hook anomaly
detection, override trend analysis, infrastructure failure review, and technical
debt snapshot [4].

**Current agent usage:** Zero. The skill is entirely procedural — it runs bash
scripts, reads files, and presents output to the user. No agents are spawned at
any point.

**Identified gaps:**

1. **Health triage agent:** When 3+ scripts fail or 3+ findings surface, the
   skill presents a "scope explosion" triage list but performs no analysis of
   root causes. A dedicated `health-triage` agent (or reuse of the existing
   `debugger` agent) could analyze failures, cross-reference past patterns in
   `hook-warnings-log.jsonl`, and provide prioritized recommendations —
   currently this analysis is done ad-hoc.

2. **Stale docs checker:** Phase 2 Step 2.3 compares git log against ROADMAP.md
   checkboxes but has no mechanism to detect deeper cross-document staleness.
   The `documentation-expert` agent is listed in CLAUDE.md's trigger table for
   "new documentation" but not for documentation staleness detection during
   session-begin.

3. **Checkpoint recovery:** After compaction (`compact` matcher in
   SessionStart), `compact-restore.js` reads `handoff.json` and outputs recovery
   context. This is structural data only — no agent analyzes whether the
   recovery state is complete, whether tasks were in an inconsistent state, or
   what the best resumption strategy is.

**Sources:** `.claude/skills/session-begin/SKILL.md` (Phase 3, Phase 4, Guard
Rails), `.claude/hooks/compact-restore.js` [4, 5].

---

### Finding 4: Session-End Skill — Agent Compliance Review Is Manual and Incomplete [CONFIDENCE: HIGH]

The `session-end` SKILL.md (v2.2, 2026-03-13) includes Step 4 "Agent Compliance
Review" which reads `.claude/hooks/.session-agents.json` and
`.agent-trigger-state.json` to compare `agentsInvoked` against suggestions [4].
It also reads `pending-reviews.json` for queued code-reviewer invocations.

**Current agent usage:** Zero spawning. The step reports compliance gaps but
does not act on them.

**Identified gaps:**

1. **Compliance enforcement agent:** If session-end detects that `code-reviewer`
   was queued but not invoked (`pending-reviews.json` shows `queued: true`), it
   flags this as a gap but takes no action. A `post-session-compliance` agent
   could run the outstanding reviews at session-end to ensure no code escapes
   review before commit.

2. **Hook learning synthesizer (Step 5b):** This step reads three JSONL files,
   merges top contributors, deduplicates, and ranks the top 3 recurring issues.
   This is non-trivial synthesis work — it is currently performed by the main
   Claude context, consuming tokens that could be offloaded to a lightweight
   `hook-analyst` agent.

3. **Metrics pipeline analysis:** Phase 3 (Step 7) runs 5 commands and generates
   reports. If the health score degraded or velocity dropped, no analysis is
   performed — just a data dump. A `session-metrics-analyst` agent (or reuse of
   `performance-engineer`) could interpret trends and surface actionable
   recommendations.

**Sources:** `.claude/skills/session-end/SKILL.md` (Steps 4, 4b, 5b, 7) [4].

---

### Finding 5: PR-Review Skill — Agents Are Conditional, Not Guaranteed [CONFIDENCE: HIGH]

The `pr-review` SKILL.md (v4.6, 2026-03-18) Step 3 states: "For 20+ items across
3+ concerns, dispatch specialized agents: `security-auditor`, `test-engineer`,
`performance-engineer`, `code-reviewer`" [6].

**Current agent usage:** Conditional — only if >20 items AND >3 concerns. Step 3
is also marked SHOULD (not MUST) and is skipped for <=5 items ("fast path").

**Identified gaps:**

1. **Per-reviewer-bot agents:** Each review bot (CodeRabbit, Qodo, SonarCloud,
   Gemini) has distinct output formats, strengths, and noise patterns. Currently
   all bots are parsed by the same pr-review skill in a unified flow. Dedicated
   parsing agents would improve accuracy:
   - `sonarcloud-processor` agent: apply known suppression patterns (S5852,
     S4036, S106), enrich code snippets, handle first-scan volume automatically
   - `qodo-processor` agent: handle stale-diff cross-round dedup, R-style
     function signature noise
   - `coderabbit-processor` agent: extract inline vs summary comments cleanly

2. **Security threat model agent:** Step 0 includes a conditional Security
   Threat Model checklist when PRs touch `scripts/`, `.claude/hooks/`, or
   auth-related paths. This is currently a manual checklist — a
   `security-auditor` agent invocation here would be more rigorous than checkbox
   completion.

3. **Propagation sweep agent:** Step 4 requires grepping the entire codebase for
   the same pattern after every fix (the "#1 source of avoidable review
   rounds"). This sweep is currently done inline by the main context. A
   dedicated `propagation-checker` agent (subagent of `code-reviewer`) would run
   this exhaustively without consuming main context budget.

**Sources:** `.claude/skills/pr-review/SKILL.md` (Steps 0, 3, 4) [6].

---

### Finding 6: Pre-Commit-Fixer Skill — Subagent Spawning Exists But Is Narrow [CONFIDENCE: HIGH]

The `pre-commit-fixer` SKILL.md (v2.0, 2026-03-22) Step 4 explicitly spawns
subagents for complex failures:

- ESLint/oxlint: `Agent({subagent_type: "debugger", ...})`
- Pattern compliance: `Agent({subagent_type: "code-reviewer", ...})`
- Skill validation: `Agent({subagent_type: "general-purpose", ...})`
- TypeScript errors: `Agent({subagent_type: "debugger", ...})`

**Current agent usage:** The most mature agent usage in the hook/session
ecosystem. Subagents are spawned by category.

**Remaining gaps:**

1. **Secrets/gitleaks category:** The MUST STOP rule for `leaks found` sends the
   user to a manual decision flow. There is no agent invoked to analyze what
   leaked, determine its severity, or propose remediation. A `security-auditor`
   agent invocation here would add structured threat analysis.

2. **Cross-category coordination:** When multiple failure categories are present
   simultaneously (e.g., ESLint + pattern compliance + doc headers), each spawns
   a separate subagent but there is no coordinator. Fixes in one category can
   create failures in another (documented as "regression detection" in Step 6).
   A coordinator agent or parallel-with-convergence pattern would handle
   multi-category failures more robustly.

3. **Post-fix verification agent:** After re-commit (Step 6), hook output is
   reviewed but the verification is done by the main context. A dedicated
   `pre-commit-verifier` subagent could re-run the exact failing checks in
   isolation and confirm clean status before the main context acts.

**Sources:** `.claude/skills/pre-commit-fixer/SKILL.md` (Steps 4, 6) [7].

---

### Finding 7: PR-Retro Skill — Uses Convergence Loop (CL) But No Domain Agents [CONFIDENCE: HIGH]

The `pr-retro` SKILL.md (v4.8, 2026-03-18) Steps 1.2 and 3 invoke a "quick CL
(2-pass)" (convergence loop) to verify deliverables and top findings [8]. This
is a notable pattern: the skill explicitly delegates analysis to a subagent
loop.

**Current agent usage:** Convergence loop (CL) is used. No other dedicated
agents.

**Identified gaps:**

1. **Pattern recurrence analysis agent:** Step 2.5 builds a "recurrence map"
   from all retros' action items, flags recurrence >= 3 as CRITICAL, and runs a
   quick CL to verify the pattern still exists. This recurrence analysis is
   non-trivial and could be offloaded to a `pattern-analyst` agent that
   maintains and queries the recurrence database across PRs.

2. **Action item implementation tracking:** The skill's Rule 10 ("MUST implement
   accepted action items — retro is blocked until every item is done") requires
   Claude to implement fixes inline. A `fix-implementer` agent dispatched per
   action item would allow parallel implementation and isolation from the retro
   analysis context.

**Sources:** `.claude/skills/pr-retro/SKILL.md` (Steps 1.2, 2.5, Rule 10) [8].

---

### Finding 8: PostToolUseFailure Hook — Loop Detector Is Passive, No Agent Escalation [CONFIDENCE: HIGH]

The `loop-detector.js` hook (PostToolUseFailure, fires after build/test/lint
failures) tracks identical errors over a 20-minute rolling window and warns
after 3 occurrences [9].

**Current agent usage:** Zero. The hook warns to stdout and logs to JSONL.

**Gap:** When a loop is detected (3 identical failures), the optimal response is
to spawn a `systematic-debugging` agent with the error hash, command, and loop
count as context. Currently the hook emits a warning message and nothing more —
the user must notice the message and manually invoke debugging. A
`loop-escalation` hook (or upgrade to the existing loop-detector) that spawns
`systematic-debugging` automatically at the threshold would convert passive
detection into active remediation.

**Sources:** `.claude/hooks/loop-detector.js` (lines 264-277) [9].

---

### Finding 9: UserPromptSubmit Hook — Directive-Only, No Invocation Pipeline [CONFIDENCE: HIGH]

The `user-prompt-handler.js` hook fires on every user prompt submission and
analyzes the prompt to emit directives like:

- `"PRE-TASK: MUST use security-auditor agent"`
- `"PRE-TASK: MUST use systematic-debugging skill FIRST"`
- `"PRE-TASK: MUST use database-architect agent"`
- `"PRE-TASK: MUST use frontend-design skill"`

**Current agent usage:** Zero. The hook emits text directives to stdout that
Claude reads as system context. It does not and cannot spawn agents.

**Gap:** The hook effectively implements Decision #28's intent (mandatory agent
invocation) at the text-directive level only. The gap is structural:
UserPromptSubmit hooks can output directives but Claude Code has no mechanism
for hooks to directly spawn agents. The only enforcement path is the directive
text being read and honored by Claude — which is advisory, not mechanical.

This means the entire mandatory agent routing in CLAUDE.md Section 7 (security
tasks, debugging, database, UI/frontend, planning) is enforced by behavioral
guardrail, not technical gate. A dedicated `task-router` agent that reads the
prompt, classifies it against CLAUDE.md triggers, and pre-loads relevant agents
into context would convert advisory routing into pre-loaded execution.

**Sources:** `.claude/hooks/user-prompt-handler.js` (lines 280-440), `CLAUDE.md`
Section 7 [10, 2].

---

## Priority Ranking

| Rank | Workflow                                | Gap                                        | Recommendation                                  | Impact                                      |
| ---- | --------------------------------------- | ------------------------------------------ | ----------------------------------------------- | ------------------------------------------- |
| P1   | PostToolUseFailure hook (loop-detector) | Loop detected, no escalation               | Spawn `systematic-debugging` at threshold       | Converts passive detection to active fix    |
| P1   | Pre-commit-fixer — secrets category     | `leaks found` has no analysis              | Invoke `security-auditor` on gitleaks output    | Critical: secrets require structured triage |
| P2   | Pre-commit-agent-compliance hook        | Blocks but cannot spawn                    | `pre-commit-reviewer` agent to close the gate   | Removes manual step in enforcement path     |
| P2   | Session-end — compliance review         | Queued reviews never auto-run              | `post-session-compliance` agent                 | Prevents code escaping review               |
| P3   | PR-review — SonarCloud category         | First-scan noise handled manually          | `sonarcloud-processor` agent                    | Reduces per-PR triage burden                |
| P3   | PR-review — security threat model       | Manual checklist                           | Invoke `security-auditor` for hooks/scripts PRs | More rigorous than checkbox                 |
| P4   | Session-begin — health triage           | 3+ failures = scope explosion, no analysis | `health-triage` agent                           | Reduces session startup burden              |
| P4   | Post-write-validator — agent triggers   | Phase 1 only (advisory)                    | Promote to Phase 2+                             | Stronger enforcement                        |
| P5   | Session-end — hook learning synthesizer | Synthesis done in main context             | `hook-analyst` agent                            | Context budget optimization                 |
| P5   | PR-retro — action item implementation   | Inline fixes block retro                   | `fix-implementer` per action item               | Parallel implementation                     |

---

## Sources

| #   | File / Path                                                        | Title                            | Type                    | Trust | CRAAP     | Date                              |
| --- | ------------------------------------------------------------------ | -------------------------------- | ----------------------- | ----- | --------- | --------------------------------- |
| 1   | `.claude/hooks/pre-commit-agent-compliance.js`                     | Pre-commit agent compliance hook | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03 (Session #226)            |
| 2   | `.claude/settings.json`                                            | Hook configuration               | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03-29 (current)              |
| 3   | `scripts/config/agent-triggers.json`                               | Agent triggers config            | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03                           |
| 4   | `.claude/skills/session-begin/SKILL.md` and `session-end/SKILL.md` | Session lifecycle skills         | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | v2.0 2026-03-16 / v2.2 2026-03-13 |
| 5   | `.claude/hooks/compact-restore.js`                                 | Compact restore hook             | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03                           |
| 6   | `.claude/skills/pr-review/SKILL.md`                                | PR review skill                  | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | v4.6 2026-03-18                   |
| 7   | `.claude/skills/pre-commit-fixer/SKILL.md`                         | Pre-commit fixer skill           | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | v2.0 2026-03-22                   |
| 8   | `.claude/skills/pr-retro/SKILL.md`                                 | PR retrospective skill           | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | v4.8 2026-03-18                   |
| 9   | `.claude/hooks/loop-detector.js`                                   | Loop detector hook               | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03                           |
| 10  | `.claude/hooks/user-prompt-handler.js`                             | User prompt handler hook         | Codebase (ground truth) | HIGH  | 5/5/5/5/5 | 2026-03                           |

---

## Contradictions

**Pre-commit-fixer vs. pre-commit-agent-compliance:** The `pre-commit-fixer`
skill DOES spawn subagents (Step 4) and is the most mature agent-integration
point in the ecosystem. Yet the `pre-commit-agent-compliance` hook only checks
whether `code-reviewer` and `security-auditor` were invoked _before_ the commit
flow — it does not know whether they were invoked _by_ pre-commit-fixer as
subagents. There is a potential double-counting or gap: if `code-reviewer` runs
as a subagent inside pre-commit-fixer, does that satisfy the
pre-commit-agent-compliance check? The `.session-agents.json` tracking depends
on `track-agent-invocation.js` (PostToolUse on Task tool), so subagents spawned
within pre-commit-fixer would be tracked. This is consistent — but the
dependency chain is undocumented and fragile.

**Decision #28 vs. implementation reality:** Prior Decision #28 proposed
"PreToolUse hook for mandatory agent invocation." The current PreToolUse hooks
(`pre-commit-agent-compliance.js`, `block-push-to-main.js`,
`deploy-safeguard.js`) are all blocking gates, not invocation mechanisms. D28's
mandate is partially fulfilled (mandatory blocking) but the "invocation" half
was never implemented. This is not a contradiction in the code — it is an
intentional limitation of what hook scripts can do (they cannot spawn agents,
only output directives or block).

---

## Gaps

1. **PostToolUse Notification hook:** The `Notification` event hook in
   settings.json only sends an ntfy.sh curl notification. There is no analysis
   of what prompted the notification or whether it warrants an agent response.

2. **PreCompact hook — agent state verification:** The `pre-compaction-save.js`
   hook saves state before compaction but does not verify agent state
   consistency (e.g., whether any agent subagents were mid-execution when
   compaction occurred). This could leave orphaned agent state in
   `.session-agents.json`.

3. **Deploy pipeline agent gaps:** The `deploy-safeguard.js` hook checks build
   freshness, env vars, and test status. If it blocks a deploy, there is no
   agent to diagnose _why_ the build is stale or tests are failing — the user
   receives a block message and must investigate manually.

4. **SessionStart health check — no agent integration:** The `session-start.js`
   hook runs dependency install, build, pattern compliance, and consolidation
   status. Failures are written to `session-start-failures.json` for
   `session-begin` to surface, but no agent is ever spawned to resolve them.

---

## Serendipity

**The `agentTriggerEnforcer` phase system is a ready-made promotion path:** The
phase 1/2/3 system in `post-write-validator.js` provides a built-in escalation
mechanism from advisory to blocking. This is infrastructure that could be
leveraged for new agent triggers without adding new hooks — simply adding
entries to `agent-triggers.json` and promoting the enforcer to Phase 2+ would
immediately apply stronger enforcement. This is lower-friction than writing new
hook scripts.

**Pre-commit-fixer is the template for hook-spawned agents:** Because it already
uses `Agent({subagent_type: "debugger", ...})` in an operational context, it
demonstrates the spawning pattern works. New hook-to-agent wiring for other
categories (secrets analysis, deployment diagnosis, session health) can follow
the exact same pattern already proven here.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are derived directly from reading filesystem sources (codebase
profile). No training data or external web sources were consulted.
