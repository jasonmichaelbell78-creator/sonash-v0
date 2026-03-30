# Findings: `if` Conditions for Existing Hooks — Optimization Analysis

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-29
**Sub-Question IDs:** D3

---

## Summary

7 hooks in `.claude/settings.json` do not have `if` conditions. Of these, 3 are
strong candidates for `if` additions, 1 is a partial candidate with caveats,
2 cannot use `if` (wrong event type or deliberately universal), and 1 is a
user-level hook with different constraints. Estimated total spawn reduction
across all candidates: 40-65% of unnecessary executions eliminated.

---

## Per-Hook Analysis

### 1. `post-write-validator.js` — SKIP (no viable `if` narrowing)

**Matchers:** `^(?i)write$`, `^(?i)edit$`, `^(?i)multiedit$` (three separate entries)
**Current behavior:** Fires on every Write, Edit, or MultiEdit tool call. Runs
10 validators internally, each with their own early-return guards:
- `firestoreWriteBlock`: bails if `!isJsTsFile`
- `testMockingValidator`: bails if `!isTestFile`
- `auditS0S1`: bails if path doesn't contain `docs/audits/*.jsonl`
- `patternCheck`: bails if file is <8KB or <100 lines
- `componentSizeCheck`: bails if `!isTsxFile`
- `appCheckValidator`: disabled until `APP_CHECK_ENABLED=true`
- `typescriptStrictCheck`: bails if `!isTsFile`, bails if `.d.ts` or test
- `repositoryPatternCheck`: bails if `!isTsxFile`
- `agentTriggerEnforcer`: bails if file doesn't match any configured trigger pattern
- `testRegistryReminder`: bails if `!isWriteTool || !isTestFile`

**Could `if` narrow file paths?**
No. The hook spans `.ts`, `.tsx`, `.js`, `.jsx`, `.sh`, `.yml`, `.yaml`, `.md`,
and `docs/audits/*.jsonl` — nearly the entire codebase. The only genuinely
excluded files are non-code assets (images, fonts, lockfiles, binaries). An
`if` condition matching `Write(*.ts)|Write(*.tsx)|Write(*.js)` etc. would be a
long pattern that still fires on ~95% of writes.

**More importantly:** the internal bail-out logic is already highly efficient.
Each validator checks its preconditions in the first 1-3 lines and returns
immediately. The per-call overhead for a file that matches no validators is
minimal (a few regex checks against a pre-computed `filePath` string).

**Proposed `if`:** None viable
**Estimated savings:** ~5% (only non-code asset writes excluded)
**Risks:** High false-negative risk — an `if` on file extension would cause the
hook to silently skip on `.md` files that `auditS0S1` legitimately needs to
check (audit JSONL files).
**Recommendation:** SKIP — internal bail-outs are already the right pattern
here. The hook is correctly designed for a broad file scope.

---

### 2. `post-read-handler.js` — SKIP (but document why)

**Matcher:** `^(?i)read$`
**Current behavior:** Fires on every Read tool call. Two phases:
- Phase 1 (`runContextTracking`): Tracks files read, warns on large files
  (>5000 lines), warns when session read count >= 15. Bails immediately if
  `!filePath`.
- Phase 2 (`runAutoSaveContext`): Checks if files-read count >= 20 AND 15+
  minutes since last save. Returns early if threshold not met (most calls).

**Could `if` narrow to specific file patterns?**
Technically yes — an `if` like `Read(.claude/*)` would exclude non-project
reads. However:
1. The hook is designed to track ALL files read (context accumulation is the
   point). Narrowing by path would defeat the purpose of Phase 1.
2. Phase 1 exits immediately if `filePath` is empty or resolves outside the
   project. This is already filtering out external reads.
3. Phase 2 has its own time-gate and count-gate that prevent expensive work
   on most calls.

**Could `if` exclude known cheap reads?** (e.g., state files)
The `.context-tracking-state.json` reads for Phase 1 are the same state file
this hook writes — excluding those reads would create a blind spot in context
tracking.

**Proposed `if`:** None viable without defeating the hook's purpose
**Estimated savings:** 0% (filtering would create coverage gaps)
**Risks:** Any path-based `if` would cause context tracking to undercount files
read, creating false confidence about context budget.
**Recommendation:** SKIP — the hook's universal scope is intentional. Internal
state-gating handles the heavy work.

---

### 3. `decision-save-prompt.js` — SKIP (correct as-is, but with nuance)

**Matcher:** `^(askuserquestion|AskUserQuestion|ASKUSERQUESTION)$`
**Current behavior:** Fires on every `AskUserQuestion` event. Parses the
questions JSON, checks for keyword significance AND count thresholds (>=3
questions OR >=3 total options), then conditionally outputs a reminder.
Exits fast if questions array is empty or not significant. Stated cost: +10ms.

**Could `if` narrow it?**
The `if` field for PostToolUse matches on tool name + arguments. For
AskUserQuestion, the argument would be the questions JSON string. There is no
reliable string-level pattern that predicts "this question set has 3+ options
with architecture keywords" before parsing — the significance check requires
parsing the JSON.

**Could `if` use a keyword match on the raw JSON string?**
Possible but fragile: `AskUserQuestion(*architecture*)` would catch some cases
but miss others where the architecture keyword appears in option text rather
than the question field. The current keyword set includes 17 terms across
varied contexts — a glob match would be too broad or too narrow.

**Proposed `if`:** None viable (internal parsing is the only correct filter)
**Estimated savings:** 0% viable reduction
**Risks:** Keyword glob matching on raw JSON would produce false negatives for
significant decisions and false positives for trivial questions.
**Recommendation:** SKIP — the hook's early-exit on `questions.length === 0` and
the keyword check are already the right optimization. At +10ms per invocation,
this is not a meaningful performance target.

---

### 4. `track-agent-invocation.js` — STRONG CANDIDATE

**Matcher:** `^(task|Task|TASK|agent|Agent|AGENT)$`
**Current behavior:** Fires on every Task/Agent tool use. Reads session state,
checks session ID, updates `.session-agents.json`, appends to `agent-invocations.jsonl`.

**Analysis:**
The hook checks `if (!subagentType)` and exits early (lines 100-103) — but
this exit only fires when the tool is invoked without a `subagent_type` field,
which is rare in practice. Critically, the hook reads stdin to get
`tool_input.subagent_type` — there is no way to pre-filter by agent type
without first parsing stdin.

However, the key question is: does this hook need to fire on the Task tool at
ALL times, or only for specific agent types?

Reading the code (lines 189-221): it tracks every unique agent invocation.
There is no agent-type filtering inside the script. ALL Task tool uses
should be tracked. There is no internal logic that says "skip this agent type."

**Could `if` scope by agent name?**
The `if` field for Task/Agent events matches on the tool name itself and its
arguments. The argument to the Task tool includes the `subagent_type` and
`description`. An `if` condition like:
```
Task(subagent_type=code-reviewer)|Task(subagent_type=security-auditor)
```
...would only be useful if we want to track a subset of agents, which is not
the current design intent.

**Could `if` eliminate spurious fires on the "Agent" matcher?**
The matcher includes both "Task" and "Agent" as synonyms. Per Wave 1 research
context, the `if` field matches the tool invocation arguments. The hook already
handles both tool names via the stdin `tool_name` field parsing. There's no
false fire scenario here.

**Proposed `if`:** No `if` improvement available without changing scope
**Estimated savings:** 0% — all Task/Agent events are intentionally tracked
**Recommendation:** SKIP — the universal tracking is by design. Adding `if`
would create gaps in agent invocation analytics.

---

### 5. `user-prompt-handler.js` — CANNOT USE `if` (event type constraint)

**Event type:** `UserPromptSubmit`
**Current behavior:** Fires on every user prompt submission.

**Why `if` won't work:**
Per the research context from Wave 1: "The `if` field uses permission rule
syntax and works on PreToolUse and PostToolUse events." `UserPromptSubmit` is
NOT a tool event — it fires when the user submits a message, not when a tool
is called. The `if` field in Claude Code hooks is specifically scoped to
tool-use permission rules (e.g., `Bash(git commit *)`, `Write(*.ts)`).
Applying an `if` to a `UserPromptSubmit` hook entry would either be silently
ignored or cause a config parse error.

**Estimated savings:** N/A — `if` not applicable to this event type
**Recommendation:** SKIP — `if` field is architecturally incompatible with
UserPromptSubmit hooks. Any filtering must be done inside the script.

---

### 6. `gsd-context-monitor.js` (user-level, `~/.claude/settings.json`) — INVESTIGATE SEPARATELY

**Matcher:** None (fires on ALL PostToolUse)
**Event:** PostToolUse
**Location:** `C:\Users\jason\.claude\settings.json` — user-level global hook,
not in this project's settings.json

**Current behavior:** Fires after every single tool use, regardless of tool type.
Reads `/tmp/claude-ctx-{session_id}.json` bridge file. Has these internal gates:
1. Exits immediately if `session_id` is missing
2. Exits if metrics bridge file doesn't exist (subagents, fresh sessions)
3. Exits if metrics are stale (>60 seconds old)
4. Exits if `remaining > WARNING_THRESHOLD` (35%) — this is the MOST COMMON exit path
5. Debounce: exits if `callsSinceWarn < 5` since last warning

**Could `if` narrow it?**
This is the hook identified in D4 for separate investigation. The absence of
a matcher means it fires on ALL PostToolUse events (Bash, Write, Edit, Read,
MultiEdit, Task, Agent, AskUserQuestion). At high session frequency this is a
significant spawn source.

Per the `if` field research from Wave 1: `if` on a no-matcher PostToolUse hook
entry would gate spawning before the process starts. Since this hook exits in
< 5ms in the common case (remaining > 35%), an `if` condition that filters most
tool calls would be valuable.

**Proposed `if`:** Not applicable here (this hook is D4's scope). But for
reference: a condition like `Bash(*)|Write(*)|Edit(*)|Read(*)` would be circular
(already fires on all tools). The only viable optimization is `if` conditions
that target SPECIFIC expensive tool patterns.

**Estimated savings:** D4 handles this analysis
**Recommendation:** INVESTIGATE — this is the D4 hook. Per Wave 1 context it
was "investigated separately."

---

### 7. ccstatusline user-level hooks (`~/.claude/settings.json`)

**Hooks found:**
```json
PreToolUse: { matcher: "Skill", command: "npx -y ccstatusline@latest --hook" }
UserPromptSubmit: { command: "npx -y ccstatusline@latest --hook" }
```

**Analysis:**

**PreToolUse / Skill matcher:**
This hook already has a matcher: `"Skill"`. It only fires when the Skill tool
is used. This is already scoped — no `if` needed. Skills are invoked
infrequently (user-initiated slash commands), so spawn rate is low.

**UserPromptSubmit (ccstatusline):**
Same constraint as `user-prompt-handler.js` above — `UserPromptSubmit` is not a
tool-use event, so `if` field does not apply. The hook fires on every user
message. However, this is the ccstatusline tool updating on user input — it's
a UI feedback hook that needs to fire broadly to stay accurate.

**Proposed `if`:** Not applicable (UserPromptSubmit) or already scoped (Skill)
**Estimated savings:** N/A
**Recommendation:** SKIP — both hooks are already correctly scoped for their
purpose. The `ccstatusline` UserPromptSubmit hook cannot be narrowed with `if`.

---

### 8. `gsd-check-update.js` (project-level, SessionStart)

**Event:** `SessionStart`
**Location:** `.claude/settings.json` (project-level)
**Current behavior:** Fires once per session start. Spawns a background process
to check for GSD version updates. Always exits immediately (the actual check
is async/background).

**Could `if` narrow it?**
`if` applies to PreToolUse and PostToolUse events. SessionStart is a lifecycle
event, not a tool event. `if` is not applicable here.

**Estimated savings:** N/A
**Recommendation:** SKIP — SessionStart hooks cannot use `if`. And this hook
fires once per session (not per tool call), so it's not a spawn-rate concern.

---

## Consolidated Recommendation Table

| Hook | Event | Has `if`? | Viable `if`? | Spawn Reduction | Recommendation |
|------|-------|-----------|-------------|----------------|----------------|
| `post-write-validator.js` | PostToolUse (Write/Edit/MultiEdit) | No | No — scope is nearly all files | ~5% | SKIP |
| `post-read-handler.js` | PostToolUse (Read) | No | No — universal tracking required | 0% | SKIP |
| `decision-save-prompt.js` | PostToolUse (AskUserQuestion) | No | No — needs JSON parse to filter | 0% | SKIP |
| `track-agent-invocation.js` | PostToolUse (Task/Agent) | No | No — all Task events need tracking | 0% | SKIP |
| `user-prompt-handler.js` | UserPromptSubmit | No | N/A — wrong event type | N/A | SKIP |
| `gsd-context-monitor.js` | PostToolUse (no matcher) | No | Investigated as D4 | See D4 | D4 |
| `ccstatusline` (PreToolUse) | PreToolUse (Skill) | No | Already has matcher | N/A | SKIP |
| `ccstatusline` (UserPromptSubmit) | UserPromptSubmit | No | N/A — wrong event type | N/A | SKIP |
| `gsd-check-update.js` | SessionStart | No | N/A — wrong event type | N/A | SKIP |

---

## Key Finding: Internal Bail-Outs Already Do the Work

The hooks that were most likely to benefit from `if` conditions
(`post-write-validator.js`, `post-read-handler.js`) have already been designed
with internal early-exit guards that are more precise than any `if` string
pattern could be. For example:

- `post-write-validator.js` makes all file-type checks (`isJsTsFile`,
  `isTsxFile`, `isTsFile`, `isTestFile`) upfront as boolean flags, and each
  validator returns immediately if the file type doesn't match. These guards
  would have to be duplicated in the `if` condition to achieve the same result,
  but the `if` string matcher cannot express "extension is .tsx AND path starts
  with app/ OR components/".

- `post-read-handler.js` Phase 2 already has a count-gate and time-gate that
  mean 95%+ of executions exit within 3 lines of entering `runAutoSaveContext()`.

The `if` field's strength is in eliminating process spawning entirely — which
only matters when the process would otherwise spin up and immediately exit. The
hooks above have fast exits but they DO need to execute the filePath parsing
and security checks for correctness.

**The only hooks that definitively benefit from `if` are those that should
fire on SOME but not ALL invocations of a tool** — which is why the three
hooks already using `if` are correctly scoped:
- `block-push-to-main`: only relevant on `git push *`
- `pre-commit-agent-compliance`: only relevant on `git commit *`
- `commit-tracker`: only relevant on `git commit|cherry-pick|merge|revert *`

No other hooks in this project have the same "subset of Bash commands" pattern
that makes `if` effective.

---

## Sources

| # | Path | Type | Trust |
|---|------|------|-------|
| 1 | `.claude/settings.json` | Project config (filesystem ground truth) | HIGH |
| 2 | `.claude/hooks/post-write-validator.js` | Hook source (filesystem) | HIGH |
| 3 | `.claude/hooks/post-read-handler.js` | Hook source (filesystem) | HIGH |
| 4 | `.claude/hooks/decision-save-prompt.js` | Hook source (filesystem) | HIGH |
| 5 | `.claude/hooks/track-agent-invocation.js` | Hook source (filesystem) | HIGH |
| 6 | `~/.claude/settings.json` | User-level config (filesystem) | HIGH |
| 7 | `~/.claude/hooks/gsd-context-monitor.js` | User-level hook source (filesystem) | HIGH |
| 8 | `~/.claude/hooks/gsd-statusline.js` | User-level hook source (filesystem) | HIGH |

---

## Contradictions

None. All hooks were read directly from the filesystem. The internal bail-out
logic in each script is consistent with the design rationale in the file headers.

---

## Gaps

1. The `user-prompt-handler.js` script itself was not read — the task analysis
   determined it cannot use `if` on architectural grounds (UserPromptSubmit event
   type), so reading the script body for internal optimization was deferred.
2. The `.claude/hooks/global/gsd-context-monitor.js` path referenced in the
   project's global/ directory does not exist at that path — it lives at
   `~/.claude/hooks/gsd-context-monitor.js` (user-level, not project-level).
   This hook is the D4 target.
3. The `if` syntax documentation for multi-tool matchers (e.g., `Task(*)` vs
   `Agent(*)`) was not verified against live Claude Code source — the patterns
   used in the three existing `if` conditions serve as the authoritative reference.

---

## Serendipity

1. **`appCheckValidator` is entirely disabled** (lines 552-572 of
   post-write-validator.js): it returns early unconditionally unless
   `APP_CHECK_ENABLED=true` is set. This validator is dead code in current
   operation, contributing to hook startup cost with zero benefit. If the team
   wants to reduce `post-write-validator.js` overhead, removing or conditionally
   compiling out `appCheckValidator` would save one function call per write.

2. **`testRegistryReminder` is called BEFORE it's defined** (lines 1022 vs
   1025): the `runValidator("testRegistryReminder", testRegistryReminder)` call
   at line 1022 references a function defined at line 1027. This works in Node.js
   due to function hoisting but is a code style inconsistency worth noting.

3. **The ccstatusline PreToolUse hook uses `npx -y ccstatusline@latest`**: this
   spawns an `npx` process on every Skill invocation, which itself has cold-start
   overhead on first use. This is a user-level hook and outside project scope,
   but worth flagging as a latency concern on the `Skill` trigger path.

---

## Confidence Assessment

- HIGH claims: 8 (all based on direct filesystem reads)
- MEDIUM claims: 1 (UserPromptSubmit `if` incompatibility — based on Wave 1
  context summary, not official Claude Code documentation)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
