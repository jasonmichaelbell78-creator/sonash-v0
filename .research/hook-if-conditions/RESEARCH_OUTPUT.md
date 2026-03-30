# Research Report: Claude Code Hook `if` Conditions — Comprehensive Analysis

**Topic:** Claude Code Hook `if` Conditions — Comprehensive Analysis **Depth:**
L1 (Comprehensive) **Date:** 2026-03-29 **Agents:** 33 total (12 primary D1–D9 +
D3-S/D5-S/D7-S + 8 gap-fill G1–G6 + 2 verifiers GV1–GV2 + 1 contrarian + 1 OTB +
1 OTB-2 + 1 re-synthesis) **Status:** COMPLETE (Gap-fill phase incorporated)

---

## 1. Executive Summary

The `if` field is a hook handler filter introduced in Claude Code v2.1.85 (March
27, 2026) that prevents process spawning when a tool call does not match a
specified pattern. It uses the same permission rule syntax as `allow`/`deny`
rules (e.g., `Bash(git *)`, `Edit(*.ts)`) and applies only to four tool-related
events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, and
`PermissionRequest`. On all other events, a hook with an `if` field never runs —
silently. [D1-spec]

This project already has three `if` conditions in place (on
`block-push-to-main.js`, `pre-commit-agent-compliance.js`, and
`commit-tracker.js`), all added in the session preceding this research. These
target git push and commit commands specifically, and are the correct,
well-scoped application of the feature. They eliminate an estimated 25–130
seconds of cumulative spawn overhead per session by preventing spawns on the
~95% of Bash calls that are not git operations. [D2-inventory]

A critical contradiction was resolved during this research: D7-performance
initially claimed `if` applies only to Bash tool hooks. This was an inductive
fallacy based on observing that all existing `if` conditions in the repo use
`Bash(...)` patterns. Official documentation explicitly names `Edit(*.ts)` as an
equally valid `if` pattern. `if` works with all tool types — Bash, Edit, Write,
Read, Glob, Grep, WebFetch, WebSearch, and Agent. Cross-model verification (G1,
Gemini 2.5 Pro) agreed with 7/9 tested claims, partially agreed with 2, and
meaningfully disagreed with 1 (the case where `if`-based splitting of
post-write-validator could benefit some file types). [D3-S-tool-compatibility,
G1-cross-model]

The biggest single optimization opportunity is not `if` conditions at all — it
is the `ensure-fnm.sh` wrapper. This wrapper adds **167ms** to every hook
invocation on this machine, yet node is already on the Windows User PATH via
fnm's permanent alias. A lean wrapper that skips fnm initialization when node is
already available would reduce per-spawn cost from ~234ms to ~5ms, saving an
estimated 8–56 seconds per session depending on session intensity. This dwarfs
any `if` condition gain possible. [D7-S-fnm-overhead, G1-cross-model]

Two major findings were added by the gap-fill phase. First: the D4-suggested
`if` template syntax (`{{ context_window.remaining_percentage }} < 40`) is
definitively **not supported** — the `if` field accepts only
`ToolName(argument_pattern)` permission rule syntax and has no access to session
state. Multiple open GitHub feature requests confirm the gap. The GSD context
monitor must use a matcher plus internal debounce, not template syntax.
[G5-template-syntax, GV2-verification]

Second: the compound command bypass risk (D9's 97% figure) was materially
overstated. The 97.9% figure came from GitHub issue #4956, which reported a bug
in the **permission allow/deny engine** that was subsequently **fixed**. The
`if` field did not exist when that bug was filed. Whether the `if` field uses
the same compound-aware post-fix engine is undocumented. Practically, the risk
to this project is LOW because `block-push-to-main.js` already implements
3-layer defense: `if` condition, internal regex matching `git`+`push` anywhere
in the full string, and a `permissions.deny` rule that is confirmed
compound-aware. [G6-compound-bypass, GV2-verification]

Eight new PreToolUse prevention gates were designed (G3), covering settings.json
self-protection, firestore rules, env file blocking, firebase.json headers,
package.json lockfile sync, large file reads, and agent constraint injection.
The settings.json guardian is self-bootstrapping — once installed, it blocks its
own removal via the Write/Edit tool path. Live testing confirmed hooks are NOT
hot-reloaded mid-session; Windows paths ARE POSIX-normalized before `if`
matching (verified by official docs via GV1). Exit code 2 = BLOCK is confirmed.
[G3-pretooluse-gates, GV1-verification]

An OTB triage (G4) identified 3 Tier 1 implementations ready for the next
session: Settings Guardian, Governance Change Logger, and Groundhog Day Loop
Detector (the first PostToolUseFailure hook in this project). Four Tier 2 items
are planned for the session after that.

---

## 2. The `if` Field Specification

### 2.1 Version and Placement

The `if` field requires **Claude Code v2.1.85 or later** (March 27, 2026). On
earlier versions it is silently ignored — the hook fires on every matched call
with no error or warning. [D1-spec]

The field is placed on individual handler objects (the innermost `hooks` array),
not on the matcher group:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "/path/to/script.sh"
          }
        ]
      }
    ]
  }
}
```

### 2.2 Supported Events

`if` is **only evaluated** on these four events:

- `PreToolUse`
- `PostToolUse`
- `PostToolUseFailure`
- `PermissionRequest`

On all other events (`UserPromptSubmit`, `SessionStart`, `Stop`, `Notification`,
etc.), a hook with an `if` field **never runs** — silently, without error. This
is a hard rule, not degraded behavior. [D1-spec, D9-risks]

### 2.3 Pattern Syntax and Tool Coverage

`if` uses permission rule syntax: `"ToolName(argument_pattern)"`. This applies
to all tool types — not just Bash. Each tool type has a distinct matched field:
[D1-spec, D3-S-tool-compatibility, G1-cross-model]

| Tool       | Matched Field                 | Example Pattern                |
| ---------- | ----------------------------- | ------------------------------ |
| Bash       | `command` (full shell string) | `Bash(git commit *)`           |
| Edit       | `file_path`                   | `Edit(*.ts)`                   |
| Write      | `file_path`                   | `Write(src/**)`                |
| Read       | `file_path`                   | `Read(./.env)`                 |
| Glob       | `pattern`                     | `Glob(*.ts)`                   |
| Grep       | `pattern`                     | `Grep(TODO)`                   |
| WebFetch   | `url`                         | `WebFetch(domain:example.com)` |
| WebSearch  | `query`                       | `WebSearch(*)`                 |
| Agent/Task | `prompt`                      | `Agent(Explore)`               |

### 2.4 Wildcard and Path Semantics

- `Bash(git *)` — the space before `*` enforces a word boundary: matches
  `git commit` but NOT `gitignore`
- `Bash(git push *)` — bare `git push` (no arguments) does **not** match because
  there is no suffix after the space [D9-risks]
- `Edit(src/**/*.ts)` — `**` matches recursively; `Edit(src/*.ts)` only matches
  files directly in `src/` [D1-spec]
- File path patterns: `//path` = absolute, `~/path` = home-relative, `/path` =
  project-root-relative, `path` = cwd-relative [D1-spec]
- On Windows, paths are normalized to POSIX form before matching:
  `C:\Users\alice` becomes `/c/Users/alice`; use `//c/**/.env` for
  drive-relative patterns [D1-spec, GV1-verification]
- **VERIFIED**: This POSIX normalization applies to the `if` field's pattern
  evaluation engine — not to the `$ARGUMENTS`/stdin passed to hook commands
  (which still receive Windows-native paths). [GV1-verification]

### 2.5 How `if` Interacts with `matcher`

Execution order:

1. Event fires
2. `matcher` checks tool name (regex) — filtered at group level
3. `if` checks tool name + arguments — filtered per handler
4. If `if` passes → hook process spawns
5. If `if` fails → handler skipped, no process spawned (the performance benefit)

Setting `matcher: "Bash"` and `if: "Edit(*.ts)"` creates a logical impossibility
— the Edit tool is filtered out by the matcher before `if` is evaluated. Keep
matcher and `if` consistent. [D1-spec]

### 2.6 OR Conditions

OR at the matcher level: `"matcher": "Edit|Write"` (pipe syntax, works) OR
within `if`: pipe inside a single `if` value (`"Bash(git *)|Bash(npm *)"`) —
**unconfirmed** per official docs but demonstrably working in this project (P14
commit-tracker). Gemini cross-model test agreed this is
working-but-undocumented. For security-critical hooks, use separate handler
objects. [D1-spec, G1-cross-model]

### 2.7 Template Syntax: NOT SUPPORTED

`"if": "{{ context_window.remaining_percentage }} < 40"` is **definitively not
valid**. The `if` field is evaluated by the permission rule engine — a static
pattern matcher. It has no access to:

- Session state (context window usage, token counts, cost)
- Environment variables
- Filesystem state
- Any runtime value beyond the tool call itself

Context window data (`remaining_percentage`, etc.) is available only to the
`statusLine` command — a completely separate system. Five open GitHub issues
(#34340, #27969, #34879, #32014, #4446) request this capability, confirming it
does not yet exist. [G5-template-syntax, GV2-verification]

### 2.8 Session Lifecycle: No Hot-Reload

Hooks are loaded when a Claude Code session starts. **Changes to settings.json
mid-session are not picked up until the next session.** This was both
empirically confirmed (G2: a newly added hook did not fire within the same
session) and documented in official Claude Code docs. [G2-windows-path-test,
GV1-verification]

**Implication:** Any new hook configuration (including the Tier 1 gates from
G3/G4) takes effect only after a session restart.

---

## 3. Current Hook Inventory and Assessment

### 3.1 Project-Level Hooks (17 total)

| #   | Event            | Matcher                                  | `if` Condition                                                                       | Script                                 | Purpose                                                  |
| --- | ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------- |
| P1  | SessionStart     | (none)                                   | none                                                                                 | `session-start.js`                     | Full session init: npm deps, build, pattern check, state |
| P2  | SessionStart     | (none)                                   | none                                                                                 | `check-mcp-servers.js`                 | Print available MCP server names                         |
| P3  | SessionStart     | (none)                                   | none                                                                                 | `check-remote-session-context.js`      | Git fetch + remote branch scan                           |
| P4  | SessionStart     | `compact`                                | none                                                                                 | `global/gsd-check-update.js`           | Background npm GSD version check                         |
| P5  | SessionStart     | `compact`                                | none                                                                                 | `compact-restore.js`                   | Post-compaction recovery                                 |
| P6  | PreToolUse       | `^(?i)bash$`                             | `Bash(git push *)`                                                                   | `block-push-to-main.js`                | Block pushes to main/master                              |
| P7  | PreToolUse       | `^(?i)bash$`                             | `Bash(git commit *)`                                                                 | `pre-commit-agent-compliance.js`       | Require code-reviewer before commit                      |
| P8  | PreCompact       | (none)                                   | none                                                                                 | `pre-compaction-save.js`               | Snapshot session state before compaction                 |
| P9  | PostToolUse      | `^(?i)write$`                            | none                                                                                 | `post-write-validator.js`              | 9-check consolidated validator                           |
| P10 | PostToolUse      | `^(?i)edit$`                             | none                                                                                 | `post-write-validator.js`              | Same                                                     |
| P11 | PostToolUse      | `^(?i)multiedit$`                        | none                                                                                 | `post-write-validator.js`              | Same                                                     |
| P12 | PostToolUse      | `^(?i)read$`                             | none                                                                                 | `post-read-handler.js`                 | Context tracking + large-file warnings                   |
| P13 | PostToolUse      | `^(askuserquestion\|...)$`               | none                                                                                 | `decision-save-prompt.js`              | Decision documentation prompt                            |
| P14 | PostToolUse      | `^(?i)bash$`                             | `Bash(git commit *)\|Bash(git cherry-pick *)\|Bash(git merge *)\|Bash(git revert *)` | `commit-tracker.js`                    | Track commits to JSONL, health alerts                    |
| P15 | PostToolUse      | `^(task\|Task\|...\|agent\|Agent\|...)$` | none                                                                                 | `track-agent-invocation.js`            | Record agent invocations                                 |
| P16 | UserPromptSubmit | (none)                                   | none                                                                                 | `user-prompt-handler.js`               | 6 analyses: guardrails, frustration, alerts              |
| P17 | Notification     | (none)                                   | none                                                                                 | `curl -s -d ... ntfy.sh/sonash-claude` | Push notification via ntfy.sh                            |

### 3.2 User-Level Hooks (4 total, HOME locale)

| #   | Event            | Matcher | `if` | Script                                   | Purpose                           |
| --- | ---------------- | ------- | ---- | ---------------------------------------- | --------------------------------- |
| U1  | SessionStart     | (none)  | none | `~/.claude/hooks/gsd-check-update.js`    | Same as P4 — duplicate check      |
| U2  | PostToolUse      | (none)  | none | `~/.claude/hooks/gsd-context-monitor.js` | Context warning injector          |
| U3  | PreToolUse       | `Skill` | none | `npx -y ccstatusline@latest --hook`      | Statusline update on Skill use    |
| U4  | UserPromptSubmit | (none)  | none | `npx -y ccstatusline@latest --hook`      | Statusline update on every prompt |

### 3.3 Unnecessary Spawn Rate Summary

| Rank | Hook                            | Est. Unnecessary Spawn % | Root Cause                                       |
| ---- | ------------------------------- | ------------------------ | ------------------------------------------------ |
| 1    | U2 gsd-context-monitor          | ~92%                     | No matcher; exits immediately when context > 35% |
| 2    | P13 decision-save-prompt        | ~65%                     | Most AskUserQuestion calls are simple            |
| 3    | P9/P10/P11 post-write-validator | ~20%                     | Markdown/config files skip most validators       |
| 4    | P16 user-prompt-handler         | ~10%                     | Trivial acks where all sub-functions no-op       |

P6, P7, P14 were previously at ~95% unnecessary spawn rate and were fixed this
session with `if` conditions. [D2-inventory]

---

## 4. What Is Already Optimized

Three hooks received `if` conditions in the session preceding this research:

**P6 — block-push-to-main.js:** `if: "Bash(git push *)"` — fires only on git
push commands (~3–5 times per session) instead of all Bash calls (~50–150 per
session). Saves an estimated 9–44 seconds of spawn cost per session.
[D2-inventory]

**P7 — pre-commit-agent-compliance.js:** `if: "Bash(git commit *)"` — fires only
on git commit commands. Saves 8–42 seconds per session. [D2-inventory]

**P14 — commit-tracker.js:**
`if: "Bash(git commit *)|Bash(git cherry-pick *)|Bash(git merge *)|Bash(git revert *)"`
— fires only on git state-change operations. Saves 8–44 seconds per session.
[D2-inventory]

**Combined estimated savings: 25–130 seconds per session** from these three `if`
additions alone.

Note: P14's `if` condition uses pipe OR syntax inside a single `if` value. Per
D1-spec, this syntax is unconfirmed by official docs (which recommend separate
handler objects). The current implementation is working in practice, and Gemini
cross-model verification agreed this is "working-but-undocumented" with low risk
for non-security-critical hooks. [D1-spec, G1-cross-model]

---

## 5. Remaining Optimization Opportunities

### 5.1 Existing Hooks — Mostly Ruled Out

Analysis of the 14 hooks without `if` conditions:

- **post-write-validator.js (P9/P10/P11):** SKIP for full-split approach. The
  hook spans nearly the entire codebase (`.ts`, `.tsx`, `.js`, `.md`, `.yaml`,
  etc.). An `if` condition on file extensions would still fire on ~95% of
  writes. More importantly, internal bail-outs (`isJsTsFile`, `isTsxFile`,
  `isTestFile`) are already more precise than any glob pattern can express. The
  monolith was explicitly consolidated from 10 hooks to save ~800ms Windows
  spawn cost — any `if`-based split would partially restore that cost.
  [D3-optimization, D6-new-validation-config]

  **GV1 nuance:** Gemini raised a valid architectural counter-point: for
  non-code file types (`.sh`, `.yml`, `.yaml`, `.jsonl`, `.md`, `.json`), the
  monolith spawns ~234ms only to run 0–1 validators and bail. A hybrid approach
  (keep monolith for JS/TS, add `if`-gated skip for confirmed non-code types)
  would be optimal but adds complexity for marginal gain. The research's
  conclusion (keep the monolith) remains correct for this project's file
  distribution. [GV1-verification]

- **post-read-handler.js (P12):** SKIP. The hook is designed to track ALL files
  read for context budget management. Filtering by path would create blind spots
  in context tracking. Phase 2 auto-save has its own count-gate that prevents
  expensive work in ~95% of calls. [D3-optimization]

- **decision-save-prompt.js (P13):** SKIP. Significance detection requires
  parsing the JSON questions array — there is no glob pattern that predicts
  "this question set has 3+ options with architecture keywords" before parsing.
  At ~10ms execution cost, this is not a meaningful performance target.
  [D3-optimization]

- **track-agent-invocation.js (P15):** SKIP. All Task/Agent events are
  intentionally tracked for agent analytics. Adding an `if` condition would
  create gaps in the invocation log. [D3-optimization]

- **user-prompt-handler.js (P16):** N/A. `UserPromptSubmit` is not a tool event;
  `if` is incompatible with this event type. [D3-optimization]

- **SessionStart hooks (P1–P5):** N/A. `if` does not apply to `SessionStart`
  events. [D1-spec]

**Bottom line:** The `if` field's strength is eliminating spawns for hooks that
should fire on SOME but not ALL invocations of a tool. The remaining hooks
either fire universally by design, use events where `if` is unsupported, or have
internal bail-outs that are already more efficient than any string pattern could
be.

### 5.2 GSD Context Monitor (U2) — Best Remaining `if` Target

`gsd-context-monitor.js` has the highest unnecessary spawn ratio in the system
(~92%) and the highest session-level overhead. It fires on every PostToolUse
event with no matcher, reading a bridge file from the statusline binary and
exiting immediately when context is healthy. [D4-gsd]

**Key characteristic:** The script is completely tool-agnostic. It does not
inspect `tool_name`, `tool_input`, or `tool_output`. It only reads `session_id`
(to locate the bridge file) and `cwd` (to detect GSD active state). This means
any tool-based matcher only trades warning frequency for spawn reduction — it
does not create logical gaps.

**Measured spawn cost:** 179ms median per invocation on this machine (vs. 234ms
for project hooks using `ensure-fnm.sh` — the user hook uses inline `fnm env`
which is slightly faster). At 259 PostToolUse fires per typical session, this is
~46 seconds of non-blocking overhead. [D5-S-gsd-scoping]

**Recommended approach — Option A (broad tool matcher):**

```json
"PostToolUse": [
  {
    "matcher": "^(Write|Edit|MultiEdit|Bash|Task|Agent|WebSearch|WebFetch)$",
    "hooks": [
      {
        "type": "command",
        "command": "bash -c 'eval \"$(fnm env --shell bash 2>/dev/null)\"; node \"C:/Users/jason/.claude/hooks/gsd-context-monitor.js\"'"
      }
    ]
  }
]
```

This excludes Read, Grep, and Glob (pure read/search tools). Spawn reduction:
~48% average, up to 70% in research-heavy sessions. Risk: occasional warning
delay during read-heavy phases at low context — the agent is warned later, not
never. [D5-S-gsd-scoping]

**Complementary approach — time-based internal debounce (Option C):** Add a
30-second skip if the last check was recent. Combined with Option A, this yields
74–84% total spawn reduction. Requires editing the hook script (~30 minutes
effort). [D5-S-gsd-scoping]

**What NOT to do:** Bash-only matcher (Option B) — reduces spawns by 81% but
creates dangerous blind spots where context exhaustion goes undetected during
non-Bash execution phases. [D5-S-gsd-scoping]

**Confirmed: Template syntax does NOT work.** The previously-flagged option of
`"if": "{{ context_window.remaining_percentage }} < 40"` is definitively
invalid. The `if` field has no access to context window state. Use a matcher +
internal debounce instead. [G5-template-syntax, GV2-verification]

### 5.3 ensure-fnm.sh — Bigger Win Than Any `if` Condition

The most impactful available optimization is not `if` conditions — it is
replacing the `ensure-fnm.sh` wrapper.

**Measured facts:** [D7-S-fnm-overhead]

- `ensure-fnm.sh` adds 167ms per invocation (vs. bare node at 66ms)
- This overhead comes from two fnm binary spawns: `fnm env --shell bash` (~80ms)
  and `fnm use --silent-if-unchanged` (~70ms)
- **node IS already on PATH without ensure-fnm.sh** on this machine:
  `fnm/aliases/default` is in the Windows User environment registry permanently
- The `.nvmrc` pins v22; fnm default alias points to v22.22.1 — `fnm use` is a
  no-op on every invocation

**Session-level impact:** At conservative 50 invocations/session, the redundant
wrapper costs 8.4 seconds. At typical 336 invocations, it costs 56 seconds. This
exceeds the ~25–130 second savings from all three `if` conditions combined in
higher-activity sessions.

**Recommended fix — Option B (lean PATH-check wrapper):**

```bash
#!/bin/bash
# Fast path: if node is already on PATH, skip fnm init entirely
if command -v node >/dev/null 2>&1; then
  exec "$@"
fi
# Slow path: initialize fnm and retry
if ! command -v fnm >/dev/null 2>&1; then
  echo "ensure-fnm.sh: neither node nor fnm available" >&2; exit 1
fi
eval "$(fnm env --shell bash 2>/dev/null)" || exit 1
fnm use --silent-if-unchanged >/dev/null 2>&1 || true
exec "$@"
```

This reduces overhead to ~5ms on this machine (just the `command -v node` check)
while maintaining the fnm fallback for any locale where node is not on PATH
without fnm initialization. Risk: MEDIUM — cannot be confirmed safe without
testing at the WORK locale. If the work locale also has `fnm/aliases/default` in
its Windows User PATH, Option A (full removal) is safe everywhere.
[D7-S-fnm-overhead]

---

## 6. New Hook Proposals

### 6.1 Deploy Safeguards (HOOK-D5-A)

**Pre-deploy environment and build check:**

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Event          | PreToolUse                                             |
| Matcher        | `^(?i)bash$`                                           |
| `if` condition | `Bash(firebase deploy *)\|Bash(npx firebase deploy *)` |
| Script         | `.claude/hooks/pre-deploy-safeguard.js`                |
| Blocks?        | No (advisory, exit 0)                                  |
| Effort         | Low (1–2 hours)                                        |
| Value          | High                                                   |

What it checks: (1) `out/` exists and was modified within 30 minutes, (2) all
six `NEXT_PUBLIC_*` env vars are set and non-empty, (3) no uncommitted changes
in `firestore.rules` or `storage.rules`.

Evidence base: `firebase.json` has a `predeploy` build step for Cloud Functions
but hosting deploys require a separate `npm run build` producing `out/`. CI
(`deploy-firebase.yml`) sets six Firebase env vars from GitHub secrets — a local
deploy without these vars bakes empty/undefined values into the bundle.
`firebase-service-account.json` exists at repo root, making local deploys
technically possible. [D5-new-security-deploy]

### 6.2 Test-Runner Tracking (HOOK-D5-B)

**PostToolUse capture of test pass/fail/duration:**

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Event          | PostToolUse                                                  |
| Matcher        | `^(?i)bash$`                                                 |
| `if` condition | `Bash(npm test *)\|Bash(npm run test *)\|Bash(npx vitest *)` |
| Script         | `.claude/hooks/test-run-tracker.js`                          |
| Blocks?        | No                                                           |
| Effort         | Medium (3–4 hours)                                           |
| Value          | Medium                                                       |

Parses Node `--test` runner output and vitest output, appends to
`.claude/state/test-run-log.jsonl`. Template: `commit-tracker.js`. Note:
duration requires a PreToolUse companion to timestamp the start (PostToolUse has
no start time). [D5-new-security-deploy]

### 6.3 Security-File Guards (HOOK-D5-C/D/E)

Three hooks sharing a single `security-file-guard.js` script:

**HOOK-D5-C — Firestore/Storage rules integrity guard (HIGHEST VALUE,
PostToolUse):**

| Field          | Value                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| Event          | PostToolUse                                                                                |
| Matcher        | `^(?i)(write\|edit\|multiedit)$`                                                           |
| `if` condition | `Write(firestore.rules)\|Edit(firestore.rules)\|Write(storage.rules)\|Edit(storage.rules)` |
| Blocks?        | YES (exit 2 on critical rule removal)                                                      |
| Value          | Very High                                                                                  |

Checks that `allow create, update: if false` still exists for `journal`,
`daily_logs`, and `inventoryEntries` collections. These three patterns are the
only server-side enforcement of the Cloud Functions-only write requirement per
SECURITY.md. Accidental removal would silently weaken the security model before
the next CI deploy. [D5-new-security-deploy]

**G3 PreToolUse complement (HIGHEST PRIORITY):** A PreToolUse version of this
gate (G3 Gate 1) fires BEFORE the write and can block it entirely. This is
architecturally superior to PostToolUse for a security-critical file — damage
prevention vs. post-hoc alerting. The script reads `tool_input.content` (for
Write) or `tool_input.new_string` (for Edit) and exits 2 if protected patterns
are absent. [G3-pretooluse-gates, GV1-verification]

**HOOK-D5-D — Env file guard:**
`Write(.env.production)|Edit(.env.production)|Write(.env.local)|Edit(.env.local)`
— advisory warning, checks for real secrets (non-placeholder values). Advisory
only (exit 0). [D5-new-security-deploy]

**HOOK-D5-E — firebase.json guard:** `Write(firebase.json)|Edit(firebase.json)`
— checks HSTS header, X-Frame-Options: DENY, and `functions.predeploy` build
step still present. Advisory. [D5-new-security-deploy]

Note: Whether dotfile patterns (`Write(.env.production)`) correctly match in the
`if` glob system is unverified — may require `Write(**/.env.production)` or
equivalent. [D5-new-security-deploy]

### 6.4 Monolith Extensions vs. New Hooks (D6)

Four proposals belong inside `post-write-validator.js`, not as separate hooks:

**D6-A — JSON syntax validator:** `isConfigFile` is already computed in the
monolith but never used (dead code). Adding `JSON.parse` validation for `.json`
files costs ~0ms additional since it uses the existing dispatch pattern.
External hook would add ~80ms Windows spawn overhead per JSON write. Use lenient
parser for tsconfig trailing commas. [D6-new-validation-config]

**D6-C — Markdown fence checker:** `isMarkdownFile` is computed in the monolith
but never used (dead code). Adding unclosed code fence detection (odd-count ```
analysis) is trivial to implement and fills this gap. [D6-new-validation-config]

**D6-D — .claude/ config change alert (HIGH PRIORITY):** Alert when
`.claude/settings.local.json`, `.claude/hooks/*.js`, or `.claude/skills/**` are
modified. Recommend `npm run test:hooks` when hook files change. Log to
`.claude/state/config-change-log.jsonl`. [D6-new-validation-config]

**D6-F — Security rules change alert:** Alert when `firestore.rules` or
`storage.rules` are modified, recommend `security-auditor` agent. (Note:
HOOK-D5-C provides blocking enforcement; D6-F provides the write-time advisory
as a complement.) [D6-new-validation-config]

Proposals NOT recommended as separate hooks: TypeScript tsc reminder (D6-B, low
value — existing `typescriptStrictCheck` covers the key case), branch tracker on
checkout (D6-G, low value). [D6-new-validation-config]

### 6.5 Config Change Alerts (D6)

**D6-E — package.json dependency diff alert:** Parse
`git show HEAD:package.json` vs. written version, list added/removed/changed
deps, warn if lockfile not updated. Medium effort (requires git diff logic),
medium-high value. Implement inside monolith to avoid spawn overhead.
[D6-new-validation-config]

**D6-H — Branch-commit policy checker:** PostToolUse on `Bash(git commit *)`,
reads current branch and warns on direct commits to `main`/`release/*`. Closes
the gap between the existing push block (P6) and the commit stage. Low effort —
`git-utils.js` already provides `gitExec`. Better implemented by extending
`commit-tracker.js` directly. [D6-new-validation-config]

---

## 7. PreToolUse Prevention Gates (New — G3)

Eight PreToolUse gates were designed by G3 after the Contrarian agent identified
a PostToolUse bias in the original research. PreToolUse with `if` is
architecturally distinct: it fires BEFORE the tool runs. Exit code 2 = BLOCK.
The hook prevents the operation entirely — damage prevention, not post-hoc
remediation.

### 7.1 Top 5 Gates (Ranked by Value)

**Gate 1 — Settings.json Self-Protection (Self-Bootstrapping) [Value: 8/10,
Effort: 2–3 hrs]**

`.claude/settings.json` controls all 17 hooks. If corrupted or stripped of
security hooks, the entire safety infrastructure is silently broken for all
subsequent sessions. A PreToolUse Write/Edit gate reads the proposed content and
blocks if critical hooks (`block-push-to-main.js`,
`pre-commit-agent-compliance.js`) would be removed or the JSON is malformed.

The key insight: once installed, this gate is **self-bootstrapping** — a Write
or Edit attempting to remove it triggers the hook, which detects the removal and
exits 2 to block the operation. Verified by GV1.

Known gap: Bash-based operations (`echo '{}' > .claude/settings.json`) bypass
the gate entirely. The gate covers only Write/Edit tool paths.
[G3-pretooluse-gates, GV1-verification]

**Gate 2 — Firestore Rules Guard (PreToolUse) [Value: 9/10, Effort: 2–3 hrs]**

Intercepts Write/Edit to `firestore.rules` BEFORE the write. Scans proposed
content for removal of `allow create, update: if false` on protected
collections. Complementary to the PostToolUse HOOK-D5-C (which runs after the
write). The PreToolUse version is superior for security — it prevents the
weakening rather than detecting it after the fact. [G3-pretooluse-gates]

**Gate 3 — .env.local.encrypted Block (5-minute ship) [Value: HIGH, Effort: < 5
min]**

An inline bash one-liner in the settings.json `command` field. No external
script required. Unconditionally blocks any Write to `.env.local.encrypted` with
exit 2. Deployment steps: add JSON block, restart session. The fastest
high-value improvement in the entire priority matrix. [G3-pretooluse-gates,
GV1-verification]

```json
{
  "type": "command",
  "if": "Write(.env.local.encrypted)",
  "command": "bash -c 'echo \"[env-guard] BLOCKED: .env.local.encrypted must not be overwritten by AI agents.\" >&2; exit 2'",
  "statusMessage": "Blocking env encrypted write..."
}
```

**Gate 4 — Governance Change Logger (PostToolUse with `if`) [Value: 9/10,
Effort: 20–30 min]**

Fires on Write/Edit to CLAUDE.md or settings.json. Runs `git show HEAD:<file>`,
computes line diff, appends JSONL entry to
`.claude/state/governance-changes.jsonl`. [G3-pretooluse-gates, G4-otb-triage]

**Gate 5 — Package.json Lockfile Warning (PreToolUse) [Value: 5/10, Effort: 1–2
hrs]**

Fires on Edit to `package.json`. Reads `tool_input.old_string` and
`tool_input.new_string`, diffs the `dependencies`/`devDependencies` sections. If
dep changes detected, warns via stderr before the edit is applied. Behavioral
interrupt rather than a block. [G3-pretooluse-gates]

### 7.2 Full 8-Gate Inventory

| Gate | File/Pattern                     | Type                               | Value       | Effort    | Tier |
| ---- | -------------------------------- | ---------------------------------- | ----------- | --------- | ---- |
| 1    | `.claude/settings.json`          | Self-protection (PreToolUse block) | 8/10        | 2–3 hrs   | T1   |
| 2    | `firestore.rules`                | Security guard (PreToolUse block)  | 9/10        | 2–3 hrs   | T1   |
| 3    | `.env.local.encrypted`           | Inline bash block                  | HIGH        | 5 min     | T1   |
| 4    | `CLAUDE.md`, `settings.json`     | Change logger (PostToolUse log)    | 9/10        | 20–30 min | T1   |
| 5    | `package.json`                   | Lockfile sync warn                 | 5/10        | 1–2 hrs   | T2   |
| 6    | Large reads (`*.jsonl`, `*.log`) | Context budget gate                | 4/10        | 1 hr      | T2   |
| 7    | `firebase.json`                  | Security headers guard             | 7/10        | 2 hrs     | T2   |
| 8    | `Agent(Explore)`                 | Read-only constraint inject        | Speculative | 15 min    | T3   |

---

## 8. OTB Feasibility Triage (G4)

The OTB agent proposed 26 implementations across 2 rounds. G4 triaged these
against the actual codebase, producing a 4-tier priority ranking.

### 8.1 Tier 1: Implement Next Session (< 2 hours total)

**T1-1: Settings.json Guardian Hook (30–45 min)**

PostToolUse hook with
`if: "Write(.claude/settings.json)|Edit(.claude/settings.json)"`. Reads disk
after write, validates JSON structure, confirms critical hooks still present. No
existing conflicts — adds a new matcher group. Verified feasible by GV2.
[G4-otb-triage, GV2-verification]

**T1-2: Governance Change Logger (20–30 min)**

PostToolUse hook with
`if: "Write(CLAUDE.md)|Edit(CLAUDE.md)|Write(.claude/settings.json)|Edit(.claude/settings.json)"`.
Appends JSONL diff entry to `.claude/state/governance-changes.jsonl`. Uses
existing `lib/state-utils.js` and `lib/git-utils.js`. Verified feasible by GV2.
[G4-otb-triage, GV2-verification]

**T1-3: Groundhog Day Loop Detector (45–60 min)**

**First PostToolUseFailure hook in this project.** Fires on failed
`npm run build`, `npm test`, `npx tsc` commands. Hashes error output (strips
line numbers for fuzzy match), maintains rolling window of last 10 failures in
`.claude/state/error-loop-tracker.json`. If same error hash appears 3+ times
within 15 minutes, returns warning description to Claude. PostToolUseFailure
event confirmed as a supported `if` event by D1-spec and GV2. [G4-otb-triage,
GV2-verification]

### 8.2 Tier 2: Next-Next Session (1–4 hours each)

| ID   | Proposal                                   | Effort  | Key Dependency                    |
| ---- | ------------------------------------------ | ------- | --------------------------------- |
| T2-1 | Large File Read Warning (PreToolUse gate)  | 1–2 hrs | Windows `if` path pattern testing |
| T2-2 | Branch Context Restorer (on git checkout)  | 2–3 hrs | Companion save hook needed        |
| T2-3 | Dependency Safety Check (npm install gate) | 2–3 hrs | Package name parsing edge cases   |
| T2-4 | Permission Drift Detector (settings drift) | 1–2 hrs | Can combine with T1-1             |

### 8.3 Tier 3: Deferred (blocked by fnm overhead or Windows paths)

T3-1 (Micro-Hook Architecture) — blocked by fnm spawn cost (167ms makes
micro-hooks 5x more expensive than monolith). Unblocked by lean wrapper.
T3-2/T3-3 (Skill/Agent validators) — blocked by Windows file-path `if` pattern
uncertainty. Workaround: add to `post-write-validator.js` monolith with internal
path check.

### 8.4 Tier 4: Not Feasible / Not Worth It

Items extending existing hooks (T4-1/2/3/5), items blocked by performance (T4-1
Read Frequency Tracker), or items with excessive overlap (T4-11 overlaps T1-3
Loop Detector).

### 8.5 Extend Existing Hooks (No New Hook Needed)

| Proposal                        | Extend This Hook            | Estimated Lines |
| ------------------------------- | --------------------------- | --------------- |
| Hot-File Index (OTB 7A)         | `post-read-handler.js`      | ~20 lines       |
| Write Amplification (OTB 7B)    | `post-write-validator.js`   | ~20 lines       |
| Session Cost Estimator (OTB 7C) | `track-agent-invocation.js` | ~30 lines       |
| Skill Validator (OTB 2A)        | `post-write-validator.js`   | ~40 lines       |
| Agent Validator (OTB 2B)        | `post-write-validator.js`   | ~40 lines       |

---

## 9. Cross-Locale Considerations

This project operates from two Windows locales: HOME (jason, unrestricted,
winget/cargo/go) and WORK (jbell, no admin). All 17 project hooks in
`.claude/settings.json` are committed to git and shared across both locales.
[D8-locale]

### Existing `if` Conditions Are Locale-Safe

All three existing `if` conditions (`Bash(git push *)`, `Bash(git commit *)`,
commit multi-pattern) use Bash command string matching — not file paths. Git is
in Git Bash's built-in PATH at both locales. The pattern engine evaluates
command strings before any subprocess spawns, requiring no external tools.
[D8-locale]

### File-Path `if` Conditions: POSIX Normalization Confirmed

Official docs explicitly state: `C:\Users\alice` becomes `/c/Users/alice` before
`if` pattern matching. D8-locale's warning about backslash escape failures was
based on inference, not official documentation — it is refuted for the `if`
field specifically. However, the concern remains valid for **hook script
internals** that process `$ARGUMENTS` or stdin (which still receive
Windows-native paths). [GV1-verification, D1-spec]

Practical guidance:

- Root-level relative patterns (`Write(firestore.rules)`,
  `Edit(.claude/settings.json)`) are safe regardless of normalization — no path
  separators involved.
- Subdirectory patterns (`Write(src/**/*.ts)`) should work per official docs but
  remain empirically unverified on this machine.
- Absolute drive-relative patterns must use `//c/` prefix, not `C:\`.

### Cross-Locale Impact Matrix

| `if` Pattern Type    | HOME                    | WORK                    | Notes                          |
| -------------------- | ----------------------- | ----------------------- | ------------------------------ |
| `Bash(git push *)`   | Safe                    | Safe                    | Already in use                 |
| `Bash(git commit *)` | Safe                    | Safe                    | Already in use                 |
| `Bash(cargo *)`      | Safe                    | Risk                    | cargo HOME-only                |
| `Bash(winget *)`     | Safe                    | Breaks                  | winget HOME-only               |
| `Edit(*.ts)`         | Safe (POSIX-normalized) | Safe (POSIX-normalized) | Empirically unverified         |
| `Bash(npm *)`        | Safe                    | Safe                    | npm via fnm, same availability |

### Cross-Locale Infrastructure Gap (Critical)

If fnm is not installed at WORK, all 17 hooks fail at the `ensure-fnm.sh`
wrapper stage before any `if` condition or script is reached. The hooks with
`continueOnError: false` (including `block-push-to-main.js` and
`pre-commit-agent-compliance.js`) fail open — the safety gates are silently
bypassed. fnm is NOT in the `install-cli-tools.sh` manifest. Adding fnm to the
GitHub releases fallback in the installer would resolve this single largest
cross-locale hook risk. [D8-locale]

---

## 10. Risks and Anti-Patterns

### 10.1 Critical: Compound Command Bypass — Risk DOWNGRADED to LOW for this project

**Revised assessment (G6, GV2):** D9's original HIGH-confidence claim
("97.9–100% bypass rate") was misattributed. The 97.9% figure came from GitHub
issue #4956, which reported a bug in the **permission allow/deny engine** — not
the `if` field. The issue was subsequently fixed (closed as COMPLETED). The `if`
field was introduced in v2.1.85, _after_ the fix was applied.

Current status:

- The permission engine IS compound-aware (official docs confirmed via GV2).
- Whether the `if` field uses the same compound-aware engine is
  **undocumented**.
- Practical risk to this project is **LOW** because `block-push-to-main.js` has
  3-layer defense: (a) `if: "Bash(git push *)"` spawn filter, (b) internal regex
  `\bgit\b` and `\bpush\b` matching anywhere in the full command string, (c)
  `permissions.deny: "Bash(git push origin main)"` using the confirmed
  compound-aware engine. If layer (a) fails, layer (c) still catches it.
- **The recommendation remains the same:** Never rely on `if` as the sole
  security gate. The reasoning is now about defense-in-depth rather than
  documented bypass rates.

[G6-compound-bypass, GV2-verification, D9-risks]

### 10.2 Critical: Silent Death on Non-Tool Events

Adding `if` to `UserPromptSubmit`, `Stop`, `SessionStart`, or any non-tool event
causes the hook to **never run** — silently, with no error. This is the most
common misconfiguration for developers who add `if` conditions without reading
the event type constraint. [D1-spec, D9-risks]

### 10.3 High: Template Syntax in `if` Is Invalid

`"if": "{{ context_window.remaining_percentage }} < 40"` silently never matches.
The `if` field is a static pattern matcher — no template expressions, no session
state access, no CEL evaluation. This is definitively confirmed by official
docs, changelog, and 5 open GitHub feature requests. [G5-template-syntax,
GV2-verification]

### 10.4 High: Version Compatibility Silent Failure

On versions before v2.1.85, `if` is silently ignored — hooks fire
unconditionally. This creates false security confidence when `if` is used as a
performance optimization that doubles as a filter for dangerous operations.
[D1-spec, D9-risks]

### 10.5 Medium: Narrow Pattern False Negatives

- `Bash(git push *)` misses bare `git push` (no arguments after the space)
- `Edit(*.ts)` misses MultiEdit — needs separate handlers for `Edit`, `Write`,
  and `MultiEdit`
- Patterns fail against command aliases and indirect variable expansion
  (`VAR=git; $VAR push`)
- Argument reordering defeats argument-order-dependent patterns [D9-risks]

### 10.6 Anti-Pattern Table

| Anti-Pattern                        | Risk     | Correct Approach                                                |
| ----------------------------------- | -------- | --------------------------------------------------------------- |
| `if` as sole security gate          | CRITICAL | `if` for scoping only; validate inside script                   |
| `if` on non-tool events             | HIGH     | Remove `if`; filter inside script                               |
| Template syntax `{{ }}` in `if`     | HIGH     | Use matcher + internal script logic instead                     |
| `Edit(*.ts)` without empirical test | MEDIUM   | Root-level relative paths are safer; test subdirectory patterns |
| `Bash(git push *)` only             | MEDIUM   | Also test compound command variants; add permissions.deny layer |
| Duplicate tool in matcher AND `if`  | LOW      | Keep consistent; comment intent                                 |

---

## 11. Cross-Model Verification Summary (G1)

Gemini 2.5 Pro independently verified 9 of 10 selected claims. Results:

| Claim                              | Research Confidence | Gemini Verdict      | Outcome                                                                               |
| ---------------------------------- | ------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `if` works with all tool types     | HIGH                | AGREE               | Confirmed                                                                             |
| ensure-fnm.sh adds ~167ms overhead | HIGH                | AGREE               | Confirmed; version drift caveat added                                                 |
| Compound commands bypass `if`      | HIGH                | AGREE               | DOWNGRADED (see G6 correction)                                                        |
| GSD 92% waste                      | HIGH                | AGREE               | Confirmed                                                                             |
| Only 3 hooks benefit from `if`     | HIGH                | PARTIAL             | Gemini confused event types (AfterFileChange is not real)                             |
| Silent fail on non-tool events     | HIGH                | PARTIAL             | Mechanism dispute (CEL vs hard rule); observable behavior confirmed                   |
| post-write-validator no benefit    | HIGH                | DISAGREE            | Valid architectural counter for 1-validator file types; monolith wins for common case |
| Lean wrapper saves ~138ms          | MEDIUM              | AGREE               | Version drift caveat added                                                            |
| `if` is performance, not security  | HIGH                | AGREE               | Strong alignment; "client-side advisory" framing                                      |
| Pipe OR syntax unconfirmed         | MEDIUM              | N/A (Gemini failed) | Independent assessment: working-but-undocumented                                      |

**Gemini reliability:** HIGH for confirming claims, MODERATE for novel insights,
LOW for Claude Code internals accuracy (hallucinated `AfterFileChange` event,
`hookify` plugin, CEL expression evaluation — none of which exist in Claude Code
hooks). Overall concordance: 7/9 full agreement.

---

## 12. Updated Implementation Priority Matrix

Incorporates original research plus G3 (PreToolUse gates), G4 (OTB triage), and
infrastructure fixes:

| Priority | Item                                                   | Type                             | Effort    | Value     | Risk   | Notes                                              |
| -------- | ------------------------------------------------------ | -------------------------------- | --------- | --------- | ------ | -------------------------------------------------- |
| **I1**   | `.env.local.encrypted` inline block                    | PreToolUse gate (inline)         | 5 min     | High      | None   | Single JSON entry + session restart                |
| **I2**   | Replace `ensure-fnm.sh` with lean wrapper              | Infrastructure                   | 30 min    | Very High | Medium | Needs WORK locale testing first                    |
| **I3**   | `gsd-context-monitor.js` broad matcher                 | Config change                    | 5 min     | High      | Low    | Option A from D5-S; template syntax debunked       |
| **P1**   | T1-2: Governance Change Logger                         | New hook (PostToolUse+if)        | 20–30 min | High      | Low    | Fastest new hook deliverable                       |
| **P2**   | T1-1: Settings.json Guardian                           | New hook (PostToolUse+if)        | 30–45 min | High      | Low    | Self-bootstrapping protection                      |
| **P3**   | T1-3: Groundhog Day Loop Detector                      | New hook (PostToolUseFailure+if) | 45–60 min | High      | Low    | First PostToolUseFailure hook in project           |
| **P4**   | HOOK-D5-C/G3-Gate2: Firestore rules guard (PreToolUse) | New hook (block)                 | 2–3 hrs   | Very High | Low    | PreToolUse preferred over PostToolUse for security |
| **P5**   | D6-D: .claude/ config change alert                     | Monolith addition                | 1 hr      | High      | Low    | Uses existing `isConfigFile` dead code             |
| **P6**   | HOOK-D5-A: Pre-deploy safeguard                        | New hook (advisory)              | 1–2 hrs   | High      | Low    | Advisory only                                      |
| **P7**   | D6-A: JSON syntax validator                            | Monolith addition                | 1 hr      | Medium    | Low    | Uses existing `isConfigFile` dead code             |
| **P8**   | D6-C: Markdown fence checker                           | Monolith addition                | 1 hr      | Medium    | Low    | Uses existing `isMarkdownFile` dead code           |
| **P9**   | D6-F: Security rules change alert                      | Monolith addition                | 1 hr      | High      | Low    | Complements HOOK-D5-C                              |
| **P10**  | D6-H: Branch-commit policy                             | Extend commit-tracker            | 1–2 hrs   | Medium    | Low    | Closes push-block gap                              |
| **P11**  | `gsd-context-monitor.js` time debounce                 | Script edit                      | 30 min    | Medium    | Low    | Compound with I3 for 74–84% reduction              |
| **P12**  | G3-Gate7: firebase.json headers guard                  | New hook (PreToolUse block)      | 2 hrs     | High      | Low    | COOP/COEP protection from CLAUDE.md §5             |
| **P13**  | T2-1: Large File Read Warning                          | New hook (PreToolUse warn)       | 1–2 hrs   | Medium    | Low    | Windows path test required first                   |
| **P14**  | HOOK-D5-B: Test run tracker                            | New hook                         | 3–4 hrs   | Medium    | Low    | Needs two-hook duration pattern                    |
| **P15**  | HOOK-D5-D/E: Env/firebase.json guards                  | New hook (advisory)              | 1 hr      | Medium    | Low    | Verify dotfile glob syntax first                   |
| **P16**  | D6-E: package.json dep diff                            | Monolith addition                | 2–3 hrs   | Medium    | Medium | Requires git diff logic                            |
| Defer    | D6-B: TypeScript tsc reminder                          | New hook                         | 1 hr      | Low       | Medium | Existing validator covers key case                 |
| Defer    | D6-G: Branch tracker on checkout                       | New hook                         | 1 hr      | Low       | Low    | Limited practical value                            |
| Defer    | fnm full removal (Option A)                            | Infrastructure                   | 10 min    | Very High | High   | Test WORK locale first; Option B is safer          |
| Plan     | T2-2: Branch Context Restorer                          | New hook (PostToolUse+if)        | 2–3 hrs   | High      | Low    | Needs companion save hook                          |
| Plan     | T2-3: Dependency Safety Check                          | New hook (PreToolUse block)      | 2–3 hrs   | High      | Low    | Parse edge cases need care                         |

**Infrastructure fixes I1–I3 are the highest-leverage quick wins:** combined ~40
minutes of effort, delivering the encrypted-env absolute block, the largest
performance improvement (lean wrapper), and the GSD monitor scoping.

---

## 13. Key Contradictions Resolved

### Contradiction 1: `if` Works with ALL Tool Types (D1 vs. D7)

**D7-performance.md** claimed: "The `if` condition feature only applies to
PreToolUse and PostToolUse hooks with a Bash matcher."

**D3-S-tool-compatibility.md** verdict: **D7 is wrong.** Official docs
explicitly state: "The `if` field accepts the same patterns as permission rules:
`Bash(git *)`, `Edit(*.ts)`, and so on." Cross-model verification (G1) agreed.

**D7's performance measurements remain valid** — unaffected by the Bash-only
inference error.

### Contradiction 2: D4's `if` Context-Level Template Syntax — DEFINITIVELY DEBUNKED

**D4-gsd.md** recommended:
`"if": "{{ context_window.remaining_percentage }} < 40"` as the primary
recommendation.

**G5-template-syntax.md** verdict: **Definitively not supported.** The `if`
field is a static pattern matcher. No template expressions, no payload field
access. This would silently never match. Confirmed by official docs, changelog,
and 5 open GitHub feature requests. GV2 independently verified.

**Resolution:** Use matcher + internal debounce for GSD context monitor. The
"Unverified option" note in the original report is replaced by a definitive "NOT
SUPPORTED" finding.

### Contradiction 3: D8 `ensure-fnm.sh` Necessity vs. D7-S Direct Measurement

**D8-locale** identified `ensure-fnm.sh` as critical for cross-locale
compatibility.

**D7-S-fnm-overhead** found: on this machine, the wrapper is redundant at 167ms
cost per invocation.

**Resolution:** Both are correct at different scope. Lean wrapper (Option B)
captures the performance benefit while maintaining the safety net.

### Contradiction 4: D9 Compound Bypass Risk — OVERSTATED (G6)

**D9-risks** claimed HIGH confidence in 97.9–100% bypass rate for `if`
conditions.

**G6-compound-bypass.md** verdict: The 97.9% figure was for the **pre-fix
permission engine**, not for `if` conditions. The bug was fixed before the `if`
field existed. The permission engine is now compound-aware per official docs.

**Resolution:** Confidence for C-033 downgraded from HIGH to MEDIUM. Practical
risk for this project is LOW (3-layer defense). Security recommendations remain
valid but the specific evidence was misattributed. V1's MEDIUM downgrade was
correct.

### Contradiction 5: D8 Windows Path Separator Risk vs. D1 POSIX Normalization

**D8-locale** warned that file-path `if` patterns fail on Windows because Claude
generates backslash paths.

**GV1-verification** confirmed via official permissions docs: paths ARE
POSIX-normalized before `if` matching. `C:\Users\alice` becomes
`/c/Users/alice`. D8's concern was based on inference from hook script behavior
(which still receives raw backslash paths), not from the `if` evaluation layer.

**Resolution:** D8's warning is refuted for `if` field evaluation. It remains
valid for hook script internals. Root-level relative patterns (no directory
separators) are safe regardless.

---

## 14. Recommendations

### Immediate Actions (< 1 hour total)

1. **Add `.env.local.encrypted` inline block** (5 minutes, zero risk). Add the
   inline bash JSON block to settings.json PreToolUse section, restart session.
   [G3-pretooluse-gates, GV1-verification]

2. **Add broad matcher to gsd-context-monitor.js** (Option A) — confirmed
   template syntax does not work. Change `~/.claude/settings.json` to add
   `"matcher": "^(Write|Edit|MultiEdit|Bash|Task|Agent|WebSearch|WebFetch)$"` to
   the U2 hook. ~48% spawn reduction, near-zero risk. [D5-S-gsd-scoping,
   G5-template-syntax]

3. **Verify WORK locale PATH before touching ensure-fnm.sh.** Check whether
   `fnm/aliases/default` is in the Windows User PATH at the WORK machine. If
   yes, deploy Option B (lean wrapper) for the largest available optimization.

### Short-Term (1 day)

4. **Implement T1-1/T1-2/T1-3** (total ~1.5–2 hours). Governance Logger first
   (fastest), then Settings Guardian, then Loop Detector. All
   feasibility-verified by GV2. Start a new session after configuration changes
   — hooks require session restart. [G4-otb-triage, GV2-verification]

5. **Implement PreToolUse Firestore rules guard** (G3 Gate 2).
   Highest-security-value new hook — PreToolUse blocks the write before it
   happens. [G3-pretooluse-gates]

6. **Add D6-D (.claude/ config change alert) inside post-write-validator.js.**
   `isConfigFile` is already computed and unused. [D6-new-validation-config]

7. **Add D6-A (JSON syntax validator) and D6-C (markdown fence checker) inside
   post-write-validator.js.** Both use existing dead-code computed variables.
   [D6-new-validation-config]

8. **Add fnm to `install-cli-tools.sh`** GitHub releases fallback to eliminate
   the WORK locale hook infrastructure gap. [D8-locale]

### Medium-Term (1 week)

9. **Implement HOOK-D5-A (pre-deploy safeguard).** Advisory hook preventing
   stale-build and missing-env-var deploys. [D5-new-security-deploy]

10. **Add time-based debounce to gsd-context-monitor.js** (Option C) to compound
    spawn reduction with matcher change. [D5-S-gsd-scoping]

11. **Extend commit-tracker.js with branch-commit policy** (D6-H). Closes the
    gap between the push block and the commit stage. [D6-new-validation-config]

12. **Implement T2-1 (Large File Read Warning)** after empirically testing
    `Read(*.jsonl)` pattern matching on Windows. [G4-otb-triage]

### Do Not Do

- Do not use `{{ variable }}` template syntax in `if` fields — definitively
  unsupported, silently fails [G5-template-syntax]
- Do not rely solely on `if` conditions for security enforcement — always
  validate inside the hook script [D9-risks, G6-compound-bypass]
- Do not split post-write-validator.js into separate `if`-conditioned hooks
  without the lean fnm wrapper — restores ~800ms spawn cost
  [D6-new-validation-config]
- Do not remove `ensure-fnm.sh` entirely without confirming node is on PATH at
  the WORK locale [D7-S-fnm-overhead, D8-locale]
- Do not add file-path `if` patterns with subdirectory traversal
  (`Edit(src/**/*.ts)`) without empirical live testing on this machine — POSIX
  normalization is documented but unverified in this project specifically
  [G2-windows-path-test]

---

## 15. Unexpected Findings

1. **Dead code in post-write-validator.js:** Two computed variables
   (`isMarkdownFile` line 140, `isConfigFile` line 142) are never referenced by
   any validator. These represent unfulfilled original intent from the
   consolidation. They are extension points that make D6-A, D6-C, and D6-D
   trivial to implement with zero additional overhead.
   [D6-new-validation-config]

2. **P4 and U1 are duplicate GSD update checks.** Both project-level (P4:
   `global/gsd-check-update.js`) and user-level (U1:
   `~/.claude/hooks/gsd-check-update.js`) fire on SessionStart and write to the
   same cache file (`~/.claude/cache/gsd-update-check.json`). The second write
   harmlessly overwrites the first. Cost is near-zero (~5ms each,
   fire-and-forget), but it results in two npm version lookups per session.
   [D2-inventory]

3. **settings.local.json is committed to git but contains HOME-only
   permissions.** The file includes Go binary path permissions
   (`Bash("C:/Program Files/Go/bin/go.exe" version)`) that only exist at HOME.
   At WORK these permissions are silently inert. The file is not locale-specific
   in practice but its naming implies it should be. [D8-locale]

4. **appCheckValidator is dead code.** This validator inside
   post-write-validator.js returns early unconditionally unless
   `APP_CHECK_ENABLED=true` is set. It contributes startup cost with zero
   benefit in current operation. [D3-optimization]

5. **The debounce counter increments even on silent exits.** When
   gsd-context-monitor.js exits due to debounce suppression (not a "real"
   warning), the counter still writes back to disk. This means every
   threshold-crossing call — warning or not — incurs a disk write cost, which
   continues even during the "silenced" window. [D5-S-gsd-scoping]

6. **fnm multishell directories accumulate stale entries.**
   `/c/Users/jason/AppData/Local/fnm_multishells/` contained 5 entries from
   previous sessions, not auto-cleaned. Dead PATH entries from nvm4w also add
   minor overhead to every PATH lookup. [D7-S-fnm-overhead]

7. **Security research found 84% bypass rate against hook-based guardrails.** A
   comprehensive security study documented an 84% success rate when attacking
   Claude Code hook configurations, rising to 90%+ with adaptation. D9's 97%
   compound bypass figure was misattributed (pre-fix permission engine, not `if`
   fields) but the general framing holds. [D9-risks, G6-compound-bypass]

8. **Gemini 2.5 Pro hallucinated Claude Code concepts.** During cross-model
   verification, Gemini cited `AfterFileChange` (non-existent event), `hookify`
   plugin (not a Claude Code concept), and CEL expression evaluation (not used
   in hook `if` fields). When constrained to supported features, Gemini's
   assessments were accurate and added genuine value (version drift caveats,
   cooldown flag suggestion, "client-side advisory" framing). [G1-cross-model]

9. **Settings.json self-protection is a novel design pattern.** The
   self-bootstrapping property of G3's settings guard (once installed, it blocks
   its own removal via the Write/Edit path) is a form of quine-like protection
   applicable to any hook infrastructure. The pattern generalizes: any
   PreToolUse hook guarding a configuration file where the hook's own
   configuration lives is self-reinforcing. [G3-pretooluse-gates,
   GV1-verification]

10. **No PostToolUseFailure hooks exist in this project yet.** T1-3 (Loop
    Detector) would be the first. PostToolUseFailure is a confirmed
    `if`-compatible event, making loop detection with command-string `if`
    patterns economically viable — zero overhead on successful commands.
    [G4-otb-triage, GV2-verification]

---

## 16. Open Questions

- **WORK locale node PATH status:** Cannot verify without testing that machine
  directly.

- **Pipe OR syntax in `if` field:** Whether
  `"Bash(git commit *)|Bash(git cherry-pick *)"` within a single `if` value is
  officially supported (it works in practice for P14, but official docs
  recommend separate handler objects).

- **MultiEdit `if` behavior:** Whether `if: "MultiEdit(*.ts)"` matches when ANY
  file in the batch matches `*.ts`, or only when ALL do, is not documented.

- **`if` compound-awareness:** Whether the `if` field uses the same
  compound-aware matching engine as permissions or a simpler prefix matcher.
  Answered definitively only by instrumented test or source code review.

- **PostToolUseFailure stdin format:** Whether the `if` matcher for
  PostToolUseFailure receives the original Bash `command` argument (as
  PostToolUse does) is assumed-but-unverified. Affects T1-3 Loop Detector's `if`
  pattern design.

---

## 17. Sources

### Tier 1: Official Documentation (Highest Authority)

| #     | Source                                      | Type          | Trust |
| ----- | ------------------------------------------- | ------------- | ----- |
| S-001 | https://code.claude.com/docs/en/hooks-guide | Official docs | HIGH  |
| S-002 | https://code.claude.com/docs/en/hooks       | Official docs | HIGH  |
| S-003 | https://code.claude.com/docs/en/permissions | Official docs | HIGH  |
| S-030 | https://code.claude.com/docs/en/statusline  | Official docs | HIGH  |

### Tier 2: Direct Measurement and Filesystem Ground Truth

| #     | Source                                         | Type               | Trust |
| ----- | ---------------------------------------------- | ------------------ | ----- |
| S-004 | `.claude/settings.json` (17 hooks)             | Codebase           | HIGH  |
| S-005 | `~/.claude/settings.json` (4 hooks)            | Codebase           | HIGH  |
| S-006 | `.claude/hooks/*.js` (13 scripts)              | Codebase           | HIGH  |
| S-007 | `~/.claude/hooks/gsd-context-monitor.js`       | Codebase           | HIGH  |
| S-008 | `~/.claude/hooks/gsd-check-update.js`          | Codebase           | HIGH  |
| S-009 | `.claude/hooks/ensure-fnm.sh`                  | Codebase           | HIGH  |
| S-010 | `.claude/hooks/post-write-validator.js`        | Codebase           | HIGH  |
| S-011 | `.claude/hooks/commit-tracker.js`              | Codebase           | HIGH  |
| S-012 | `.claude/state/hook-runs.jsonl` (108 entries)  | Measurement        | HIGH  |
| S-013 | `.claude/state/commit-log.jsonl` (639 entries) | Measurement        | HIGH  |
| S-014 | Bash `time` measurements (10-run averages)     | Direct measurement | HIGH  |
| S-015 | PowerShell Windows User PATH registry query    | Direct measurement | HIGH  |
| S-016 | `firebase.json`                                | Codebase           | HIGH  |
| S-017 | `firestore.rules`                              | Codebase           | HIGH  |
| S-018 | `storage.rules`                                | Codebase           | HIGH  |
| S-019 | `.github/workflows/deploy-firebase.yml`        | Codebase           | HIGH  |
| S-020 | `SECURITY.md`                                  | Codebase           | HIGH  |
| S-021 | `package.json` scripts section                 | Codebase           | HIGH  |
| S-031 | `.claude/hooks/block-push-to-main.js`          | Codebase           | HIGH  |
| S-032 | G2 empirical hook reload test (in-session)     | Direct measurement | HIGH  |

### Tier 3: Community, Third-Party, and Cross-Model Sources

| #     | Source                                                                    | Type                                      | Trust  |
| ----- | ------------------------------------------------------------------------- | ----------------------------------------- | ------ |
| S-022 | https://releasebot.io/updates/anthropic/claude-code                       | Third-party changelog                     | MEDIUM |
| S-023 | https://claude-world.com/articles/claude-code-2185-release/               | Third-party summary                       | MEDIUM |
| S-024 | https://github.com/anthropics/claude-code/issues/4956                     | GitHub issue (bypass bug — pre-fix)       | HIGH   |
| S-025 | https://github.com/anthropics/claude-code/issues/30736                    | GitHub issue (Windows paths)              | HIGH   |
| S-026 | https://github.com/anthropics/claude-code/issues/29991                    | GitHub issue (SDK continue)               | HIGH   |
| S-027 | https://gist.github.com/hartphoenix/698eb8ef8b08ad2ce6a99cf7346cd7cc      | Security research gist                    | MEDIUM |
| S-028 | https://www.brethorsting.com/blog/2025/08/demystifying-claude-code-hooks/ | Community blog                            | MEDIUM |
| S-029 | docs/archive/HOOKIFY_STRATEGY.md                                          | Historical doc (Jan 2026)                 | MEDIUM |
| S-033 | https://github.com/anthropics/claude-code/issues/34340                    | GitHub issue (context env var request)    | HIGH   |
| S-034 | https://github.com/anthropics/claude-code/issues/27969                    | GitHub issue (context percentage request) | HIGH   |
| S-035 | https://github.com/anthropics/claude-code/issues/34879                    | GitHub issue (context metrics request)    | HIGH   |
| S-036 | https://github.com/anthropics/claude-code/issues/32014                    | GitHub issue (statusline bug)             | HIGH   |
| S-037 | https://github.com/anthropics/claude-code/issues/4446                     | GitHub issue (conditional hooks proposal) | HIGH   |
| S-038 | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md          | Official changelog                        | HIGH   |
| S-039 | Gemini 2.5 Pro CLI — cross-model verification (G1)                        | Cross-model assessment                    | MEDIUM |

---

## 18. Methodology

**Phase 1 — Parallel Search (12 agents):**

- D1-spec: Web + docs — `if` field complete specification
- D2-inventory: Codebase — hook fire rates, spawn costs, bail-out patterns
- D3-optimization: Codebase — `if` conditions for existing hooks
- D3-S-tool-compatibility: Web + docs — contradiction resolution (D1 vs D7
  Bash-only claim)
- D4-gsd: Codebase — gsd-context-monitor.js deep-dive
- D5-new-security-deploy: Codebase — new deploy/security hook proposals
- D5-S-gsd-scoping: Codebase + web — GSD matcher scoping options with
  measurements
- D6-new-validation-config: Codebase — new validation/config hook proposals
- D7-performance: Codebase + measurement — performance baseline
- D7-S-fnm-overhead: Codebase — ensure-fnm.sh overhead deep-dive
- D8-locale: Codebase — cross-locale constraints
- D9-risks: Web + docs — risks and anti-patterns

**Phase 2 — Synthesis (original RESEARCH_OUTPUT.md)**

**Phase 3 — Challenge (Contrarian + OTB):**

- Contrarian-1: Identified PostToolUse bias — all hooks were PostToolUse;
  PreToolUse blocking was underexplored
- OTB-1: 20 out-of-the-box hook proposals
- OTB-2: 6 architectural ideas (micro-hooks, pipelines, domain routing, testing
  framework)

**Phase 4 — Gap Fill (8 agents):**

- G1-cross-model: Gemini 2.5 Pro verification of 10 key claims
- G2-windows-path-test: Empirical Windows hook testing (discovered no
  hot-reload)
- G3-pretooluse-gates: 8 PreToolUse gate designs from first principles
- G4-otb-triage: OTB feasibility triage → 3 Tier 1, 4 Tier 2, multiple deferred
- G5-template-syntax: Confirmed template syntax NOT supported in `if` fields
- G6-compound-bypass: Corrected D9's 97% bypass attribution — pre-fix permission
  engine, not `if`
- GV1-verification: Verified G1 Claim 7, G2 hot-reload claim, G2 POSIX
  normalization, G3 self-bootstrapping, G3 `.env.local.encrypted` exit-code
  behavior
- GV2-verification: Verified G4 Tier 1 feasibility, G5 template syntax, G6
  compound awareness, block-push-to-main.js 3-layer defense

**Phase 5 — Re-synthesis (this document)**

**Total agents:** 33 **Search passes completed:** 1 primary + 2
contradiction-resolution + 1 contrarian + 1 OTB-1 + 1 OTB-2 + 8 gap-fill + 2
verification **Data sources:** 39 unique sources across official docs, codebase
ground truth, direct measurement, community sources, and cross-model
verification.
