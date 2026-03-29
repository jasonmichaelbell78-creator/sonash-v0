# G4: OTB Proposals Feasibility Triage

**Agent:** Feasibility assessment agent
**Date:** 2026-03-29
**Inputs:** OTB-1 (20 proposals), OTB-2 (6 architectural ideas)
**Codebase version:** v2.1.86 confirmed (if field supported)

---

## Current State Summary

**Already in place (settings.json):**

- 3 `if` conditions: `Bash(git push *)`, `Bash(git commit *)`,
  `Bash(git commit *)|Bash(git cherry-pick *)|Bash(git merge *)|Bash(git revert *)`
- Pipe OR syntax in `if` is already in production (commit-tracker uses it)
- 17 project hooks, 4 user hooks across 7 event types

**Key constraints verified:**

- `ensure-fnm.sh` overhead: 167ms per spawn (lean wrapper NOT yet built)
- Windows path `if` patterns: HIGH RISK per D9-risks (backslash normalization
  failure documented in GitHub issue #30736)
- `if` only works on 4 tool events (PreToolUse, PostToolUse, PostToolUseFailure,
  PermissionRequest)
- Pipe OR in `if` field: unconfirmed by official docs but demonstrably working
  in this project's commit-tracker hook
- `post-write-validator.js` is a 40KB monolith handling 10 validators -- adding
  to it is the proven pattern for PostToolUse Write/Edit hooks

---

## Tier 1: Implement Now (< 1 hour, high value, low risk)

### T1-1. Settings.json Guardian Hook (OTB 6A)

**Score:** Value 10, Feasibility 8 | **Effort: 30-45 min**

**Codebase verification:**

- `settings.json` is at `.claude/settings.json` (root-relative, no path issues)
- `if: "Write(.claude/settings.json)|Edit(.claude/settings.json)"` uses
  relative path patterns. However, the Windows path risk applies -- Claude may
  pass an absolute path to the Write/Edit tool. MITIGATION: the script should
  also verify internally by checking stdin `tool_input.file_path`.
- No conflict with existing hooks. Post-write-validator fires on ALL writes
  already, but adding a separate specialized hook is justified because this is
  a meta-safety concern that should run independently.

**Exact hook config:**

```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(.claude/settings.json)|Edit(.claude/settings.json)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/settings-validator.js $ARGUMENTS",
      "statusMessage": "Validating hook configuration...",
      "continueOnError": true
    }
  ]
}
```

**What the script needs to do:**

1. Parse new settings.json from disk (not from stdin -- PostToolUse means the
   write already happened)
2. Validate JSON syntax (catches broken JSON before next tool call)
3. Check all `command` paths in hooks reference scripts that exist on disk
4. Warn if any `if` field is on a non-tool event (SessionStart, UserPromptSubmit,
   etc.)
5. Verify security-critical hooks still present: `block-push-to-main.js`,
   `pre-commit-agent-compliance.js`
6. Check matcher/if consistency (no `matcher: "Bash"` with `if: "Edit(*)"`)

**Dependencies:** None. Uses existing `ensure-fnm.sh` and lib/ utilities.

**Conflict check:** Fires only on settings.json writes (~0-2 per session).
Zero overhead on normal writes. The existing Write/Edit matcher groups already
have `post-write-validator.js` -- this adds a NEW matcher group, not a sibling
handler, so no parallel execution concern.

**Risk:** `continueOnError: true` prevents a bug in the validator from blocking
all future settings.json edits. The recursive "what if this validator breaks"
scenario is mitigated.

---

### T1-2. Governance Change Logger (OTB 4C)

**Score:** Value 9, Feasibility 9 | **Effort: 20-30 min**

**Codebase verification:**

- `CLAUDE.md` and `.claude/settings.json` are root-level files with stable paths
- `.claude/state/` directory exists with 50+ state files, JSONL append pattern
  well-established (commit-log.jsonl, agent-invocations.jsonl, etc.)
- `lib/state-utils.js` provides `loadJson`/`saveJson` helpers
- `lib/git-utils.js` provides `gitExec`/`projectDir`

**Exact hook config:**

```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(CLAUDE.md)|Edit(CLAUDE.md)|Write(.claude/settings.json)|Edit(.claude/settings.json)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/governance-change-logger.js $ARGUMENTS",
      "statusMessage": "Logging governance change...",
      "continueOnError": true
    }
  ]
}
```

**What the script needs to do:**

1. Read stdin JSON for `tool_input.file_path` to identify which file changed
2. Run `git show HEAD:<file>` to get the previous version
3. Compute a simple line-level diff (added/removed/changed line counts)
4. Append a JSONL entry to `.claude/state/governance-changes.jsonl`:
   `{ timestamp, file, linesAdded, linesRemoved, sessionId }`
5. Print a brief summary to stderr for Claude to surface

**Dependencies:** None beyond existing lib/. `git show HEAD:<file>` works in
Git Bash on Windows.

**Conflict check:** Could be combined with T1-1 into one script if desired,
but independent hooks are cleaner and follow the micro-hook direction. Fires
~1-3 times per session on governance files only.

---

### T1-3. Groundhog Day Loop Detector (OTB 8D)

**Score:** Value 10, Feasibility 7 | **Effort: 45-60 min**

**Codebase verification:**

- `PostToolUseFailure` is a supported event for `if` conditions (D1-spec
  confirms). No examples in this project yet -- this would be the first
  PostToolUseFailure hook.
- The existing `hook-runs.jsonl` has 108 entries, confirming the state logging
  infrastructure works.
- No existing loop detection mechanism in any hook.

**Exact hook config:**

```json
{
  "matcher": "^(?i)bash$",
  "hooks": [
    {
      "type": "command",
      "if": "Bash(npm run build *)|Bash(npm test *)|Bash(npx tsc *)|Bash(npm run build)|Bash(npm test)|Bash(npx tsc)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/loop-detector.js $ARGUMENTS",
      "statusMessage": "Checking for repeated failures...",
      "continueOnError": true
    }
  ]
}
```

Note: added exact-match variants (`Bash(npm run build)`, etc.) alongside
wildcard variants to catch both bare commands and commands with trailing args.
`Bash(npm run build *)` does NOT match bare `npm run build` per D9 findings.

**What the script needs to do:**

1. Read stdin for `tool_input.command` and `tool_output` (error text)
2. Hash the error output (strip line numbers for fuzzy matching -- regex
   replace `:(\d+):(\d+)` with `:N:N`)
3. Read `.claude/state/error-loop-tracker.json` (rolling window of last 10
   failures with timestamps and hashes)
4. If same hash appears 3+ times within a 15-minute window, return a warning
   via stdout JSON: `{ "description": "LOOP DETECTED: ..." }`
5. Append current failure to the rolling window, trim to 10 entries

**Dependencies:** None. PostToolUseFailure provides the same stdin format as
PostToolUse. The `description` field in hook output is surfaced by Claude as
inline context.

**Conflict check:** No existing PostToolUseFailure hooks. This is the first.
Zero overhead on successful commands (PostToolUseFailure only fires on failures).

**Windows note:** Fully compatible. No file-path patterns -- Bash command string
matching only.

---

## Tier 2: Plan for Next Session (1-4 hours, high value)

### T2-1. Large File Read Warning / Pre-Read Gate (OTB 3A)

**Score:** Value 9, Feasibility 7 | **Effort: 1-2 hours**

**Codebase verification:**

- PreToolUse Read hooks: NONE currently exist. The only Read hook is PostToolUse
  `post-read-handler.js`.
- `if: "Read(*.jsonl)|Read(*.log)|Read(*.csv)"` uses extension-only patterns
  (no directory paths), which avoids the Windows backslash problem. The `*`
  matches the filename only, not path separators.
- HOWEVER: per D1-spec, `Read` rules apply to "all tools that read files" --
  this means the `if` might also fire on Grep and Glob targeting these
  extensions. This is actually desirable behavior for the gate use case.

**Exact hook config:**

```json
{
  "matcher": "^(?i)read$",
  "hooks": [
    {
      "type": "command",
      "if": "Read(*.jsonl)|Read(*.log)|Read(*.csv)|Read(*.json)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/large-file-gate.js $ARGUMENTS",
      "statusMessage": "Checking file size..."
    }
  ]
}
```

Event: **PreToolUse** (blocks before Read happens)

**What the script needs to do:**

1. Read stdin for `tool_input.file_path`
2. `fs.statSync(file_path)` to get file size
3. If > 500KB (configurable), return blocking JSON:
   `{ "decision": "block", "reason": "File is X MB. Use offset/limit or Grep." }`
4. If < threshold, exit 0 (allow)

**Dependencies:** Need to test that extension-only `if` patterns (`Read(*.jsonl)`)
actually match on Windows. The research flagged this as uncertain for path-based
patterns, but extension-only globs may work because they don't involve directory
separators. **Requires live testing before deployment.**

**Why Tier 2 not Tier 1:** The uncertainty around Windows file-path `if` pattern
matching requires validation. The script itself is trivial, but deploying a
PreToolUse blocking hook that might not fire (leaving large reads unblocked) or
might fire too broadly (blocking reads of small .json files) needs testing first.

**Effort breakdown:** 30 min to write the script, 30 min to test `if` pattern
matching for Read tool on Windows, 30 min to tune thresholds and handle edge
cases (what about `Read` with offset/limit params already set?).

---

### T2-2. Branch Context Restorer (OTB 8C)

**Score:** Value 9, Feasibility 7 | **Effort: 2-3 hours**

**Codebase verification:**

- `compact-restore.js` (9KB) already saves/restores context on compaction --
  demonstrates the context restoration pattern.
- `.claude/state/handoff.json` (47KB) stores session handoff data -- proves
  large context state persistence works.
- `if: "Bash(git checkout *)|Bash(git switch *)"` uses Bash command string
  patterns -- no Windows path risk.
- Missing: the companion "save" hook. On commit or session-end, context for the
  current branch needs to be written to
  `.claude/state/branch-contexts/<branch-name>.json`.

**Exact hook config (restore -- PostToolUse):**

```json
{
  "matcher": "^(?i)bash$",
  "hooks": [
    {
      "type": "command",
      "if": "Bash(git checkout *)|Bash(git switch *)|Bash(git stash pop *)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/branch-context-restorer.js $ARGUMENTS",
      "statusMessage": "Restoring branch context...",
      "continueOnError": true
    }
  ]
}
```

**What needs to happen:**

1. **Restore hook (above):** After branch switch, look up
   `branch-contexts/<new-branch>.json`, inject summary as `description` in
   hook response.
2. **Save companion:** Either extend `commit-tracker.js` to also save branch
   context on each commit, or add a new PostToolUse handler with
   `if: "Bash(git commit *)"` that writes the current branch context after
   each commit.
3. **Session-end integration:** `/session-end` should also dump current branch
   context.

**Dependencies:** Companion save hook + session-end integration. This is a
two-piece system that requires both halves to be useful. The restore hook alone
is useless without saved context.

**Why Tier 2 not Tier 1:** Two-part implementation (save + restore) with
integration into session-end. Can't be done in < 1 hour.

---

### T2-3. Dependency Safety Check (OTB 8B)

**Score:** Value 8, Feasibility 6 | **Effort: 2-3 hours**

**Codebase verification:**

- `if: "Bash(npm install *)|Bash(npm i *)|Bash(npx *)"` uses clean Bash command
  patterns. No Windows path risk.
- `package.json` exists at project root with 50+ dependencies -- typosquatting
  distance calculation has a meaningful comparison corpus.
- No existing hook watches npm install commands.

**Exact hook config (PreToolUse):**

```json
{
  "matcher": "^(?i)bash$",
  "hooks": [
    {
      "type": "command",
      "if": "Bash(npm install *)|Bash(npm i *)|Bash(npx *)|Bash(npm install)|Bash(npm i)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/dep-safety-check.js $ARGUMENTS",
      "statusMessage": "Checking dependency safety..."
    }
  ]
}
```

Event: **PreToolUse** (blocks before install happens)

**What the script needs to do:**

1. Extract package name from command (`npm install <pkg>`, `npm i <pkg>`,
   `npx <pkg>`)
2. Levenshtein distance check against existing deps in package.json (distance
   < 2 = warning)
3. Local blocklist check (maintain a small JSON blocklist of known-malicious
   packages)
4. For `npx` commands: extra warning since these execute without installation
5. Block with user confirmation on suspicious packages; allow known packages

**Dependencies:**

- Levenshtein implementation (trivial, ~20 lines of JS)
- A curated blocklist file (can start empty and grow)
- No external API needed for v1 (Socket.dev integration can come later)

**Why Tier 2 not Tier 1:** Parsing npm commands correctly (handling
`--save-dev`, `@scope/package@version`, multiple packages in one install) takes
care. Typosquatting comparison against 50+ deps needs testing to avoid false
positives.

---

### T2-4. Permission Drift Detector (OTB 6C)

**Score:** Value 7, Feasibility 8 | **Effort: 1-2 hours**

**Codebase verification:**

- `settings.json` has `permissions.allow` (12 entries) and `permissions.deny`
  (4 entries).
- `settings.local.json` exists with 24 additional allow entries (mostly Go and
  statusline tool permissions) -- this is the locale-specific permission file
  that could drift.
- The `if` pattern covers both files:
  `"Write(.claude/settings.json)|Edit(.claude/settings.json)|Write(.claude/settings.local.json)|Edit(.claude/settings.local.json)"`

**Could combine with T1-1 (Settings Guardian) and T1-2 (Governance Logger).**
All three fire on settings.json edits. Options:

- (a) Three separate hooks: cleanest architecture, ~500ms additional spawn
  overhead on settings.json edits (rare, acceptable)
- (b) Combine into one `settings-change-handler.js` that runs all three
  checks: one spawn, more complex script

Recommendation: **Option (a)** -- settings.json edits are rare (0-2 per session),
so 500ms overhead on those specific edits is negligible. Keep hooks independent.

**Dependencies:** None. JSON diffing against `git show HEAD:.claude/settings.json`
is straightforward.

---

## Tier 3: Interesting but Defer (needs more research or infra)

### T3-1. Micro-Hook Architecture (OTB-2, Section 1)

**Why defer:** The math does not work until `ensure-fnm.sh` is replaced with a
lean wrapper. At 167ms per spawn, 10 micro-hooks at 50% combined fire rate =
835ms. The monolith at 167ms once is 5x cheaper. The architecture becomes viable
only when spawn cost drops to ~5ms.

**Prerequisite:** Build the lean fnm wrapper (P1 from RESEARCH_OUTPUT). Once
spawn cost is ~5ms, revisit this and extract validators from
`post-write-validator.js` one-by-one.

---

### T3-2. Skill Definition Validator (OTB 2A)

**Why defer:** The `if` pattern `Write(.claude/skills/*)` uses file-path
matching, which is HIGH RISK on Windows per D9. The 80+ skills in this project
make this high-value, but the Windows path normalization issue means the `if`
condition may silently fail to fire.

**Workaround available:** Add skill validation as a new check inside
`post-write-validator.js` (which already fires on ALL writes). Check if the
file path matches `.claude/skills/` internally. This avoids the `if` path risk
entirely but trades the spawn optimization -- acceptable since
`post-write-validator.js` already fires on every write.

**Prerequisite:** Windows `if` path pattern testing, or just add to the
monolith.

---

### T3-3. Agent Definition Auto-Tester (OTB 2B)

**Why defer:** Same Windows path issue as T3-2. Additionally, validating agent
YAML requires a YAML parser dependency that isn't currently used in hooks.
Static schema validation is feasible; dry-run testing is not achievable within
PostToolUse time budgets.

**Workaround:** Same as T3-2 -- add to `post-write-validator.js` with internal
path filtering.

---

### T3-4. Hook Composition Pipelines (OTB-2, Section 2)

**Why defer:** The Firestore rules pipeline (PreToolUse gate + PostToolUse
validate + PostToolUse deploy-verify) is architecturally sound but introduces
implicit coupling between hooks with filesystem-based state passing. The project
currently does not have deploy workflows in Claude Code sessions. Defer until
deploy automation is added.

**When to revisit:** When `firebase deploy` commands appear in hook-runs.jsonl,
indicating deploy workflows are being used in sessions.

---

### T3-5. Hook Testing Framework (OTB-2, Section 5)

**Why defer:** Layer 1 (if-pattern tests) and Layer 2 (hook logic tests) are
both high-value. However, implementing a pattern matcher that accurately
replicates Claude Code's internal glob engine carries reimplementation risk.
The test would test our model of the matcher, not the actual matcher.

**Practical alternative:** Maintain a manual test matrix in a markdown file
(this triage document partially serves that purpose). Add integration test
cases to `npm run test:hooks` that validate hook behavior end-to-end.

---

### T3-6. Context Budget Fence for Exploration Spirals (OTB 3B)

**Why defer:** `Read(node_modules/*)` pattern matching is uncertain on Windows.
If Claude passes absolute paths to the Read tool (which it often does), the
pattern `Read(node_modules/*)` won't match
`Read(/c/Users/jason/Workspace/dev-projects/sonash-v0/node_modules/react/...)`.

**Workaround:** Add an `node_modules` check inside the existing
`post-read-handler.js` (which fires on all reads). This hook already exists
as PostToolUse -- converting to PreToolUse blocking would require a new hook.

---

### T3-7. Domain Routing Layer (OTB-2, Section 3)

**Why defer:** This is a documentation convention, not a runtime feature. Worth
doing but has no implementation complexity -- it's a comment-adding exercise
for settings.json. Can be done in any session with 5 minutes of effort.

**Concrete action (when ready):** Add `"_domain": "security"` (or similar
non-functional field) to each hook entry in settings.json. JSON permits
unknown fields.

---

### T3-8. Dynamic if Generation / Linter (OTB-2, Section 4)

**Why defer:** The manual analysis in RESEARCH_OUTPUT already identified all
viable candidates. An automated linter solves a problem that won't recur until
the hook count grows significantly (past ~30 hooks). The 3 `if` conditions
already in place plus the 3-5 proposed in Tier 1/2 bring the total to 6-8.
Not enough complexity to justify automated tooling.

---

## Tier 4: Not Feasible / Not Worth It

### T4-1. Read Frequency Tracker / Cascading Context Alerts (OTB 3C)

**Why not feasible:** Fires on EVERY source file Read. At 167ms per spawn (via
ensure-fnm.sh), this adds ~167ms to every Read tool call -- hundreds per
session. The `if` scoping to `Read(*.ts)|Read(*.tsx)|Read(*.md)` helps, but
these are the most-read file types. Without the lean fnm wrapper, the overhead
is unacceptable.

**Overlap:** `post-read-handler.js` already tracks context consumption. Adding
re-read detection is better done inside that existing hook than as a new
spawned process.

---

### T4-2. Hot-File Index Builder (OTB 7A)

**Why not feasible:** Same performance concern as T4-1 -- fires on every source
file read. The existing `post-read-handler.js` already provides partial
coverage. Extending it to track access frequency is a 15-minute edit to the
existing script, not a new `if`-conditioned hook.

**Recommendation:** Add hot-file tracking to `post-read-handler.js` as a new
internal phase. No new hook needed.

---

### T4-3. Write Amplification Tracker (OTB 7B)

**Why not feasible:** The existing `post-write-validator.js` already fires on
every write. Adding write frequency counting is a small addition to the
existing monolith (~20 lines), not a separate hook.

**Recommendation:** Add to `post-write-validator.js` as an internal counter.
No new hook needed.

---

### T4-4. Session Cost Estimator (OTB 7C)

**Why not feasible:** `if: "Agent(*)|Task(*)"` pattern matching against Agent/
Task tools is uncertain. The research confirms these tools match against the
`prompt` field, but `Agent(*)` matching all prompts is unverified. More
critically, the existing `track-agent-invocation.js` already fires on all
Agent/Task calls without an `if` condition. Adding cost estimation is better
done inside that hook (~30 lines of cost lookup logic).

**Recommendation:** Extend `track-agent-invocation.js`. No new hook needed.

---

### T4-5. Dev Server Lifecycle Tracker (OTB 5A)

**Why not worth it:** Value 4/10 per OTB-1's own assessment. Dev server starts
are infrequent (~1-2 per session) and the data provides minimal actionable
insight. The `if` pattern is clean but the hook solves a problem that doesn't
meaningfully exist.

---

### T4-6. Firebase Emulator Usage Tracker (OTB 5B)

**Why not worth it:** Value 5/10. Firebase emulators are used rarely in this
project. Cross-reference with test runs is interesting but the implementation
complexity (port checking on Windows) exceeds the benefit.

---

### T4-7. Conversation Tone Detector / Git State Narrator (OTB 8A)

**Why not worth it:** Value 5/10. The AI already sees git output. Adding a
"complexity signal" synthesis is marginally useful but the hook fires on every
`git status`, `git log`, `git diff` -- high-frequency commands. At 167ms per
spawn, this adds measurable latency to routine git operations.

---

### T4-8. Auto-Commit Session Context (OTB 4A)

**Why not feasible as proposed:** Running `git commit` from inside a PostToolUse
hook is dangerous. The hook runs asynchronously while Claude continues working.
A `git commit` inside the hook could conflict with a `git commit` Claude runs
moments later. Git does not handle concurrent commits gracefully.

**Safer alternative:** Flag the user via hook `description` output:
"SESSION_CONTEXT.md was updated. Consider committing." Let the user or the
session-end pipeline handle the commit.

---

### T4-9. ROADMAP.md Change Impact Analysis (OTB 4B)

**Why not worth it as a separate hook:** The roadmap is edited ~1-2 times per
session. The semantic diffing (moved vs deleted vs added items) requires
non-trivial parsing. Simpler to let the code-reviewer agent catch roadmap drift
during PR review than to build a real-time analyzer for a rarely-edited file.

---

### T4-10. Pattern Learning from Corrections (OTB 2C)

**Why not worth it:** Hook evolution is already tracked by git history.
`git log --follow .claude/hooks/` provides the same information this hook would
capture, with better context (commit messages explain why changes were made).
The hook-evolution-log.jsonl would duplicate what git already provides.

---

### T4-11. Error Pattern Detector on PostToolUseFailure (OTB 5C)

**Why downgraded from OTB's high rating:** Overlaps significantly with T1-3
(Groundhog Day Loop Detector). The loop detector catches repeated failures;
this catches one-off failures with diagnostic hints. The diagnostic hint value
is moderate (the AI is already good at reading error messages), but the loop
detection value is high. Implement T1-3 first; if diagnostic hints are still
needed, extend that script.

---

## Implementation Priority Summary

| Priority | ID | Proposal | Effort | Spawn Cost |
|---|---|---|---|---|
| **T1-1** | 6A | Settings.json Guardian | 30-45 min | ~0-2/session |
| **T1-2** | 4C | Governance Change Logger | 20-30 min | ~1-3/session |
| **T1-3** | 8D | Groundhog Day Loop Detector | 45-60 min | ~0-5/session (failures only) |
| **T2-1** | 3A | Large File Read Warning | 1-2 hrs | ~2-10/session |
| **T2-2** | 8C | Branch Context Restorer | 2-3 hrs | ~1-3/session |
| **T2-3** | 8B | Dependency Safety Check | 2-3 hrs | ~0-3/session |
| **T2-4** | 6C | Permission Drift Detector | 1-2 hrs | ~0-2/session |

**Total new spawns from Tier 1:** 1-10 per session (on rare events). At 167ms
per spawn, worst case is 1.67 seconds per session -- negligible.

**Total new spawns from Tier 2:** 3-18 per session. At 167ms per spawn, worst
case is ~3 seconds per session -- still acceptable.

---

## Key Dependencies

1. **Lean fnm wrapper (P1):** Unblocks T3-1 (micro-hooks), T4-1/2/3 (high-
   frequency hooks), and reduces cost of all Tier 1/2 hooks from 167ms to ~5ms.
   This is the single highest-leverage infrastructure improvement.

2. **Windows file-path `if` pattern testing:** Unblocks T2-1 (Read gate), T3-2
   (skill validator), T3-3 (agent validator), T3-6 (exploration fence). A simple
   test: add a hook with `if: "Read(*.jsonl)"` and verify it fires when Claude
   reads a .jsonl file.

3. **Pipe OR syntax in `if` confirmation:** Already working in production
   (commit-tracker uses it). Official docs say "unverified" but empirical
   evidence from this project confirms it works. Low risk to continue using.

---

## Existing Hooks to Extend (No New Hook Needed)

These proposals are better implemented as additions to existing hooks:

| Proposal | Extend This Hook | Lines of Code |
|---|---|---|
| Hot-File Index (7A) | `post-read-handler.js` | ~20 lines |
| Write Amplification (7B) | `post-write-validator.js` | ~20 lines |
| Session Cost (7C) | `track-agent-invocation.js` | ~30 lines |
| Skill Validator (2A) | `post-write-validator.js` | ~40 lines |
| Agent Validator (2B) | `post-write-validator.js` | ~40 lines |
| Read Frequency (3C) | `post-read-handler.js` | ~30 lines |

---

## Architecture Recommendations from OTB-2

| OTB-2 Idea | Verdict | Action |
|---|---|---|
| 1. Micro-hook arch | Blocked by fnm | Plan for post-lean-wrapper |
| 2. Hook pipelines | Sound but premature | Implement when deploy workflows exist |
| 3. Domain routing | Low cost, do whenever | Add `_domain` comments to settings.json |
| 4. Dynamic generation | Over-engineering | Skip; manual analysis is sufficient |
| 5. Testing framework | Worth doing | Start with Layer 1 pattern tests |
| 6. Tool comparison | Informational | Confirms pioneering position; no action |
