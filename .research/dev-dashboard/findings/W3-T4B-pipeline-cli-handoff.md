# Findings: Build Pipeline & Process Compliance — CLI Handoff Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Questions Addressed:** CLI command inventory, clipboard format strings,
process compliance actions, gap analysis, hook script inventory

---

## 1. CLI Command Inventory — Session Lifecycle

### Primary Session Skills

| CLI Command         | Skill File                                 | Purpose                                                                                                                                   | Flags                                                          |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/session-begin`    | `.claude/skills/session-begin/SKILL.md`    | Pre-flight checklist: env setup, context load, 9 health scripts, warning gates, goal selection                                            | None (always full)                                             |
| `/session-end`      | `.claude/skills/session-end/SKILL.md`      | Full closure: context preservation, compliance review, metrics pipeline (5 scripts), cleanup, commit                                      | `--no-push` (runs steps 1-8, skips commit)                     |
| `/checkpoint`       | `.claude/skills/checkpoint/SKILL.md`       | Mid-session state save: writes handoff.json + SESSION_CONTEXT.md Quick Recovery block. No metrics, no commit.                             | `--mcp` (also saves to MCP memory)                             |
| `/alerts`           | `.claude/skills/alerts/SKILL.md`           | Health signal: runs checker script, 18 or 42 categories, interactive alert walkthrough                                                    | `--limited` (18 categories, ~15-30s), `--full` (42 categories) |
| `/pre-commit-fixer` | `.claude/skills/pre-commit-fixer/SKILL.md` | Diagnose + fix git pre-commit failures. Reads `.git/hook-output.log`, classifies, spawns subagents, presents report before re-committing. | `--dry-run` (classify only, no fixes)                          |

### Extended Hook/Pipeline Skills (available, not in primary Tab 4 list)

| CLI Command               | Purpose                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/hook-ecosystem-audit`   | Deep diagnostic: 20 categories, 6 domains, composite grade A-F, trend tracking, patch suggestions. Use after hook changes or test failures. |
| `npm run hooks:health`    | Script-level: `scripts/check-hook-health.js` — quick structural health check                                                                |
| `npm run hooks:analytics` | Script-level: `scripts/hook-analytics.js -- --since=<date>` — hook run trend analysis                                                       |
| `npm run hooks:test`      | Script-level: `scripts/test-hooks.js` — functional hook test suite                                                                          |
| `npm run hooks:audit`     | Script-level: runs `hook-ecosystem-audit` script directly                                                                                   |
| `npm run patterns:check`  | Script-level: `scripts/check-pattern-compliance.js` — AI pattern compliance check                                                           |

---

## 2. Exact Clipboard Command Format Strings

These are the confirmed trigger strings from the skill files. Each maps to a
skill's canonical invocation.

| UI Action                 | Clipboard Command        | Source                                                                    |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| "Start session"           | `/session-begin`         | session-begin/SKILL.md — "User explicitly invokes `/session-begin`"       |
| "End session"             | `/session-end`           | session-end/SKILL.md — "User explicitly invokes `/session-end`"           |
| "Fix pre-commit failures" | `/pre-commit-fixer`      | pre-commit-fixer/SKILL.md — "User explicitly invokes `/pre-commit-fixer`" |
| "Save checkpoint"         | `/checkpoint`            | checkpoint/SKILL.md — usage section                                       |
| "Run health check"        | `/alerts`                | alerts/SKILL.md — "User explicitly invokes `/alerts`"                     |
| "Full health check"       | `/alerts --full`         | alerts/SKILL.md — 42 categories vs 18 limited                             |
| "Audit hook ecosystem"    | `/hook-ecosystem-audit`  | hook-ecosystem-audit/SKILL.md                                             |
| "End session (no push)"   | `/session-end --no-push` | session-end/SKILL.md — documented flag                                    |
| "Save checkpoint to MCP"  | `/checkpoint --mcp`      | checkpoint/SKILL.md — documented flag                                     |

---

## 3. Process Compliance Actions

### What "Process Compliance" (T7 Hygiene) Means in Tab 4

From CHECKPOINT-tab-decisions.md, Tab 4's Process Compliance section tracks:

- Bypass rate by check type (override-log)
- Auto-fix rate / silent remediations (hook-runs auto-fix status)
- Chronic skip detection (hook-runs skip patterns, e.g., `cognitive-cc`)
- Agent compliance rate (required agents invoked before commit?)
- Retro action item follow-through rate (retros.jsonl cross-ref)

### CLI Commands That Address Hygiene Issues

| Hygiene Problem                                                       | CLI Action                                     | Mechanism                                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Chronic `cognitive-cc` override accumulation                          | `/pre-commit-fixer` or `/hook-ecosystem-audit` | pre-commit-fixer classifies failures; hook-ecosystem-audit identifies systemic patterns and patch suggestions              |
| Agent compliance failures (code-reviewer not invoked)                 | Manual: invoke `/code-reviewer` before commit  | `pre-commit-agent-compliance.js` checks `.claude/hooks/.session-agents.json` — no CLI to retroactively fix, must run agent |
| Escalation gate blocked (unacknowledged errors in hook-warnings.json) | `/alerts`                                      | Surfaces and allows acknowledgment; clears `lastCleared` timestamp                                                         |
| Override pattern review                                               | `/session-end` (Step 5)                        | Step 5 runs `node scripts/log-override.js --list` and reviews justification                                                |
| Hook warnings accumulation                                            | `/alerts` or `/session-begin` (Phase 4.2)      | Both read `.claude/hook-warnings.json`; session-begin gates acknowledgment                                                 |
| Hook infrastructure failures                                          | `/hook-ecosystem-audit`                        | Full diagnostic with patch suggestions                                                                                     |
| Pattern compliance violations (inline)                                | `npm run patterns:check`                       | Also runs in session-begin Phase 3                                                                                         |
| Pre-commit hook failure (any cause)                                   | `/pre-commit-fixer`                            | Primary path per CLAUDE.md guardrail #9                                                                                    |
| Session hook health check                                             | `npm run hooks:health`                         | Quick structural check; also called in session-end Step 6                                                                  |

### The Override/Bypass Hygiene Loop

The override-log.jsonl at `.claude/override-log.jsonl` stores structured bypass
records:

```json
{
  "timestamp": "...",
  "check": "cognitive-cc",
  "reason": "...",
  "user": "Owner",
  "cwd": "...",
  "git_branch": "..."
}
```

`/session-end` Step 5b synthesizes top 3 recurring hook issues from
override-log + hook-warnings-log + health-score-log. This is the primary hygiene
feedback mechanism.

`/session-begin` Phase 4.1 checks override trend (7-day vs prior 7-day; warns if
50%+ higher with 5+ more).

**No dedicated CLI exists to resolve override debt** — the workflow is: surface
via session-begin/alerts → decide to raise baseline or fix root cause → if fix,
use `/pre-commit-fixer` or `/hook-ecosystem-audit`.

---

## 4. Gap Analysis — Actions With No CLI Command

### Confirmed Gaps

| Hygiene Action                          | Current State                                                                                                                                                                                 | Gap                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Resolve chronic cognitive-cc**        | No dedicated CLI. Must manually raise `SKIP_COG_CC` in environment or refactor code. `/hook-ecosystem-audit` gives suggestions but doesn't auto-fix.                                          | No `/raise-cc-baseline` or equivalent command |
| **Override log review/triage**          | `node scripts/log-override.js --list` is a script command, not a skill slash command. Not surfaced in Tab 4 checkpoint.                                                                       | No `/review-overrides` skill                  |
| **Agent compliance audit**              | Checked by `pre-commit-agent-compliance.js` at commit time. No proactive CLI to check status during session before a commit is attempted.                                                     | No `/check-agent-compliance` or equivalent    |
| **Retroactive hook-runs analysis**      | `npm run hooks:analytics` is script-only, no interactive skill. Tab 4 shows hook compliance heatmap but no CLI to drill into specific check failure history.                                  | No `/hook-analytics` skill                    |
| **Session gap detection standalone**    | `npm run session:gaps` (called in session-begin Phase 2.4). No standalone skill invocation.                                                                                                   | Not a blocking gap — session-begin calls it   |
| **SKIP_REASON audit**                   | CLAUDE.md guardrail #14 prohibits autonomous SKIP_REASON. There is no CLI to review all prior SKIP_REASONs for quality/justification.                                                         | No `/audit-skip-reasons`                      |
| **Velocity log repair**                 | `velocity-log.jsonl` is noted as broken in CHECKPOINT-tab-decisions.md ("show unavailable state"). `node scripts/velocity/track-session.js` is called in session-end but fix path is unclear. | No repair CLI; just "unavailable" display     |
| **Force-acknowledge all hook warnings** | `/alerts` allows per-alert acknowledgment, but no "acknowledge all" CLI shortcut outside the interactive flow.                                                                                | Minor gap — `/alerts` covers it               |

### Partial Gaps (CLI exists but no Tab 4 surface)

| Action                               | CLI                                                                                               | Issue                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Review pre-push propagation failures | `/pre-commit-fixer` is scoped to pre-commit only; pre-push failures are out of scope per SKILL.md | Pre-push failures have no dedicated fixer skill        |
| Triage ecosystem health degradation  | `/ecosystem-health` exists but is 15min+ deep audit                                               | No lightweight "why did my health score drop" shortcut |

---

## 5. Hook Script Inventory

### Project Hooks (`.claude/hooks/`)

All hooks use `ensure-fnm.sh` wrapper for Windows Node.js path resolution.
Failure behavior: unless noted, all hooks use "fail-open" (exit 0) to avoid
blocking work on hook errors.

#### SessionStart Event

| Hook Script                       | Trigger                                  | Writes To                                                                                                                                                  | Failure Behavior                                                                                 |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `session-start.js`                | SessionStart (no matcher — all sessions) | `.claude/state/session-start-failures.json` (on failure), regenerates `hook-warnings.json`, rotates `hook-warnings-log.jsonl` and `health-score-log.jsonl` | Logs failures to `session-start-failures.json` for session-begin Phase 4.3 to surface; continues |
| `check-mcp-servers.js`            | SessionStart (no matcher)                | None (stdout output only)                                                                                                                                  | Fail-open; warns if MCP servers unavailable                                                      |
| `check-remote-session-context.js` | SessionStart (no matcher)                | None (stdout output only)                                                                                                                                  | Fail-open; warns if remote has newer SESSION_CONTEXT.md                                          |
| `compact-restore.js`              | SessionStart (matcher: `compact`)        | None (outputs recovery context to stdout)                                                                                                                  | Fail-open; outputs what it found in handoff.json                                                 |

#### PreToolUse Event

| Hook Script                      | Matcher                        | Blocks?                                                                                  | Writes To                          | Failure Behavior                                            |
| -------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `block-push-to-main.js`          | `^(?i)bash$`                   | YES (exit 2) — blocks `git push` to main/master                                          | None                               | Exit 0 on parse failure (fail-open)                         |
| `env-guard` (inline bash)        | `^(?i)write$`                  | YES — blocks overwrite of `.env.local.encrypted`                                         | None                               | Hard block via bash -c echo                                 |
| `settings-guardian.js`           | `^(?i)(write\|edit)$`          | YES (exit 2) — blocks writes that corrupt hook infrastructure in `.claude/settings.json` | `hook-warnings-log.jsonl` on block | Fail-open on errors; respects `SKIP_GATES=1`                |
| `firestore-rules-guard.js`       | `^(?i)(write\|edit)$`          | YES (exit 2) — blocks removal of write-block patterns from `firestore.rules`             | `hook-warnings-log.jsonl` on block | Fail-open; respects `SKIP_GATES=1` and `ALLOW_RULES_EDIT=1` |
| `large-file-gate.js`             | `^(?i)read$`                   | YES (exit 2) for >5MB; WARN for >500KB                                                   | `hook-warnings-log.jsonl` on block | Fail-open; respects `SKIP_GATES=1`                          |
| `pre-commit-agent-compliance.js` | `^(?i)bash$` (git commit)      | YES (exit 2) — blocks commit if required agents not invoked                              | None                               | Fail-open on state file read errors; logs to stderr         |
| `deploy-safeguard.js`            | `^(?i)bash$` (firebase deploy) | YES (exit 2) — blocks deploy if build stale, env missing, or last test failed            | None                               | Fail-open on script errors                                  |

#### PreCompact Event

| Hook Script              | Trigger                                   | Writes To                                                   | Failure Behavior                          |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `pre-compaction-save.js` | PreCompact (no matcher — all compactions) | `.claude/state/handoff.json` (comprehensive state snapshot) | Logs error to stderr; exits 0 (fail-open) |

#### PostToolUse Event

| Hook Script                 | Matcher                                             | Blocking?                                                                                                                             | Writes To                                                                     | Failure Behavior                            |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| `post-write-validator.js`   | `^(?i)(write\|edit\|multiedit)$`                    | Selective: BLOCK for Firestore writes, test mocking violations; WARN for patterns, component size, TS strict, repo pattern, App Check | `pending-reviews.json` (via agent trigger enforcer)                           | Exits 0 on catastrophic errors              |
| `post-read-handler.js`      | `^(?i)read$`                                        | WARN only                                                                                                                             | `.context-tracking-state.json`, triggers MCP save at threshold                | Fail-open                                   |
| `decision-save-prompt.js`   | `AskUserQuestion`                                   | WARN/prompt only                                                                                                                      | None (stdout output to Claude)                                                | Fail-open                                   |
| `commit-tracker.js`         | `^(?i)bash$`                                        | No                                                                                                                                    | `.claude/state/commit-log.jsonl`, `.claude/state/commit-failures.jsonl`       | Fail-open; fast bail on non-commit commands |
| `test-tracker.js`           | `^(?i)bash$`                                        | No                                                                                                                                    | `.claude/state/test-runs.jsonl`, `hook-warnings-log.jsonl` on test failure    | Fail-open                                   |
| `track-agent-invocation.js` | `Task/Agent`                                        | No                                                                                                                                    | `.claude/state/agent-invocations.jsonl`, `.claude/hooks/.session-agents.json` | Fail-open                                   |
| `governance-logger.js`      | `^(?i)(write\|edit)$` on CLAUDE.md or settings.json | No (logger only)                                                                                                                      | `.claude/state/governance-changes.jsonl`, `hook-warnings-log.jsonl`           | Always exits 0                              |

#### UserPromptSubmit Event

| Hook Script              | Trigger          | Writes To               | Behavior                                                                                                                                                                                                 |
| ------------------------ | ---------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user-prompt-handler.js` | All user prompts | `.alerts-cooldown.json` | Checks for pending alerts (reads `pending-alerts.json`), context tracking threshold warnings, pending MCP saves. Outputs reminder text to Claude's context. Cooldown: 10 minutes between reminder fires. |

#### Notification Event

| Hook                                  | Trigger                 | Behavior                                       |
| ------------------------------------- | ----------------------- | ---------------------------------------------- |
| `curl ntfy.sh/sonash-claude` (inline) | All Notification events | Sends push notification to ntfy.sh. No writes. |

#### PostToolUseFailure Event

| Hook Script        | Matcher      | Writes To                                      | Behavior                                                                                                                       |
| ------------------ | ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `loop-detector.js` | `^(?i)bash$` | In-memory rolling window (no persistent write) | Detects repeated identical build/test failures (same error hash 3+ times in 20min). Outputs warning to stdout. Exits 0 always. |

#### Global Hooks (`.claude/hooks/global/`)

| Hook Script           | Purpose                                                         | Writes To                               |
| --------------------- | --------------------------------------------------------------- | --------------------------------------- |
| `gsd-check-update.js` | Checks for GSD (global system) updates once per session         | `~/.claude/cache/gsd-update-check.json` |
| `statusline.js`       | Generates Claude Code statusline (model, branch, task, context) | None (stdout only)                      |

### Pre-commit Git Hook Checks (canonical registry: `scripts/config/hook-checks.json`)

These run via Husky `.husky/pre-commit` and `.husky/pre-push` — separate from
the Claude Code hooks above.

#### Pre-commit Checks

| Check ID             | Blocking | Skip Flag    | Description                      |
| -------------------- | -------- | ------------ | -------------------------------- |
| `secrets-scan`       | BLOCK    | `gitleaks`   | Gitleaks staged scan             |
| `eslint`             | BLOCK    | (none)       | ESLint on staged files           |
| `tests`              | BLOCK    | `tests`      | Test suite                       |
| `lint-staged`        | BLOCK    | (none)       | Prettier + lint-staged           |
| `pattern-compliance` | BLOCK    | `patterns`   | AI pattern compliance            |
| `audit-s0s1`         | BLOCK    | `audit`      | S0/S1 JSONL schema validation    |
| `skill-validation`   | WARN     | (none)       | Skill file validation            |
| `cross-doc-deps`     | BLOCK    | `cross-doc`  | Cross-document dependency check  |
| `doc-index`          | AUTO-FIX | `doc-index`  | DOCUMENTATION_INDEX.md staleness |
| `doc-headers`        | BLOCK    | `doc-header` | Document header presence         |
| `agent-compliance`   | WARN     | (none)       | Agent invocation check           |
| `debt-schema`        | BLOCK    | `debt`       | Debt JSONL schema validation     |
| `jsonl-md-sync`      | WARN     | `jsonl-sync` | JSONL/markdown sync              |

#### Pre-push Checks

| Check ID                  | Blocking | Skip Flag          | Description                                               |
| ------------------------- | -------- | ------------------ | --------------------------------------------------------- |
| `escalation-gate`         | BLOCK    | `warnings`         | Unacknowledged error-level warnings in hook-warnings.json |
| `circular-deps`           | BLOCK    | (none)             | Circular dependency detection                             |
| `pattern-compliance-push` | WARN     | (none)             | Pattern compliance at push                                |
| `code-reviewer-gate`      | BLOCK    | `SKIP_REVIEWER`    | Code reviewer must have run                               |
| `propagation`             | BLOCK    | `SKIP_PROPAGATION` | Propagation pattern check                                 |
| `hook-tests`              | BLOCK    | (none)             | Hook test suite                                           |
| `security-check`          | BLOCK    | (none)             | Security scan                                             |
| `type-check`              | BLOCK    | (none)             | TypeScript type check                                     |
| `cyclomatic-cc`           | BLOCK    | `SKIP_CC`          | Cyclomatic complexity                                     |
| `cognitive-cc`            | BLOCK    | `SKIP_COG_CC`      | **Cognitive complexity** — most commonly overridden check |
| `npm-audit`               | WARN     | (none)             | npm vulnerability audit                                   |
| `triggers`                | BLOCK    | `SKIP_TRIGGERS`    | Agent trigger compliance                                  |

---

## 6. Skill Integration Map for Tab 4

### Data Flow: What Each CLI Writes That Tab 4 Displays

| CLI Command                                          | Writes                                                                                                                                 | Tab 4 Widget                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/session-begin`                                     | Reads override-log, hook-warnings-log, health-score-log (doesn't write)                                                                | Indirectly: surfaces anomalies the user acknowledges |
| `/session-end`                                       | `agent-invocations.jsonl` (via session step), `override-log` (via step 5 review), `hook-runs.jsonl` (via pre-commit-fixer integration) | Commit activity, agent invocations, override trends  |
| `/pre-commit-fixer`                                  | Appends to `hook-runs.jsonl`                                                                                                           | Hook compliance heatmap                              |
| `/alerts`                                            | `alerts-history.jsonl`, `alert-suppressions.json`                                                                                      | Health alerts feed (not directly Tab 4 data)         |
| `/checkpoint`                                        | `handoff.json`, `SESSION_CONTEXT.md`                                                                                                   | Not Tab 4 data directly                              |
| Git commits (via `commit-tracker.js` hook)           | `commit-log.jsonl`                                                                                                                     | Commit activity timeline                             |
| Task tool use (via `track-agent-invocation.js` hook) | `agent-invocations.jsonl`                                                                                                              | Agent invocations by session                         |
| Override via `log-override.js` script                | `override-log.jsonl`                                                                                                                   | Override/bypass rate trends                          |

---

## Sources

| #   | Source                                                          | Type                            | Trust | Date       |
| --- | --------------------------------------------------------------- | ------------------------------- | ----- | ---------- |
| 1   | `.claude/skills/session-begin/SKILL.md` v2.0                    | Codebase (skill definition)     | HIGH  | 2026-03-16 |
| 2   | `.claude/skills/session-end/SKILL.md` v2.2                      | Codebase (skill definition)     | HIGH  | 2026-03-13 |
| 3   | `.claude/skills/pre-commit-fixer/SKILL.md` v2.0                 | Codebase (skill definition)     | HIGH  | 2026-03-22 |
| 4   | `.claude/skills/checkpoint/SKILL.md` v2.0                       | Codebase (skill definition)     | HIGH  | 2026-02-14 |
| 5   | `.claude/skills/alerts/SKILL.md` v3.1                           | Codebase (skill definition)     | HIGH  | 2026-03-24 |
| 6   | `.claude/skills/hook-ecosystem-audit/SKILL.md` v2.0             | Codebase (skill definition)     | HIGH  | 2026-03-08 |
| 7   | `.claude/hooks/` — all 19 hook scripts                          | Codebase (hook implementations) | HIGH  | Active     |
| 8   | `.claude/settings.json` — hooks event configuration             | Codebase (config)               | HIGH  | Active     |
| 9   | `scripts/config/hook-checks.json` — 25-check canonical registry | Codebase (contract schema)      | HIGH  | 2026-03-16 |
| 10  | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md`  | Internal research checkpoint    | HIGH  | 2026-03-29 |
| 11  | `package.json` — npm scripts                                    | Codebase (config)               | HIGH  | Active     |

---

## Contradictions

**None found.** The skill files, hook implementations, settings.json, and
hook-checks.json are consistent with each other. The session-begin SKILL.md
explicitly delineates the boundary with the SessionStart hook ("The SessionStart
hook handles: consolidation, cross-session validation, dependency install,
build. This skill handles: context loading...").

One minor ambiguity: `post-read-handler.js` header says "Phase 3
(compaction-handoff) removed" but the skill references both
`post-read-handler.js` and `pre-compaction-save.js` for compaction state. These
are correctly differentiated (pre-compaction-save.js is authoritative,
post-read-handler is for context threshold warnings only).

---

## Gaps

1. **`pre-commit-fixer` scope boundary is pre-commit only.** Pre-push failures
   (cognitive-cc, type-check, propagation, security-check) are explicitly out of
   scope per SKILL.md. These failures have no dedicated fixer skill — must be
   handled manually or via `/systematic-debugging`.

2. **No CLI for override debt triage.** `node scripts/log-override.js --list` is
   a script, not a skill. `/session-end` Step 5 checks this if overrides were
   used this session, but there is no proactive "review my bypass history"
   skill.

3. **`velocity-log.jsonl` is broken** (acknowledged in CHECKPOINT decisions).
   `node scripts/velocity/track-session.js` is called in session-end but the
   data is known unavailable. No repair CLI documented.

4. **Hook run data lineage ambiguity.** CHECKPOINT says Tab 4 shows "Hook
   compliance heatmap (hook-runs.jsonl)". The `pre-commit-fixer` SKILL.md says
   it "appends fix summary to `hook-runs.jsonl`". But the primary pre-commit
   gate run results are written by the husky pre-commit scripts via
   `hook-checks.json` infrastructure — the exact writer for `hook-runs.jsonl`
   was not directly verified in hook script source code (would require reading
   husky scripts).

5. **`override-log.jsonl` location ambiguity.** File exists at
   `.claude/override-log.jsonl` (confirmed from sample data). `session-end`
   SKILL.md references `.claude/state/override-log.jsonl`. One of these may be a
   copy/symlink — not verified.

---

## Serendipity

1. **`user-prompt-handler.js` is an invisible alerting layer.** On every user
   prompt (with 10-min cooldown), it checks `pending-alerts.json` and fires a
   reminder to Claude if unacknowledged alerts exist. This means the dashboard's
   "pending alerts" badge should reflect the same state Claude is being reminded
   about — a natural consistency point.

2. **`pre-commit-agent-compliance.js` reads `.session-agents.json` at commit
   time but this file is deleted at session-end Step 8.** If a user re-tries a
   commit after running session-end (in the same session), agent compliance will
   always pass (file not found = empty list = no required agents found). This is
   a mild logic gap.

3. **`loop-detector.js` is the only PostToolUseFailure hook.** It detects
   "groundhog day" failure loops (same error hash 3+ times / 20min) but never
   writes to disk — purely ephemeral. No persistent record of detected loops
   exists in any log file. Tab 4 cannot retrospectively show "Claude got stuck N
   times."

4. **`cognitive-cc` is the most structurally significant hygiene gap.** It is:
   the most frequently overridden check (confirmed by override-log sample), a
   pre-push BLOCK check with skip flag `SKIP_COG_CC`, and explicitly named in
   Tab 4's Process Compliance spec as "chronic skip detection." It is also the
   check with no inline fix path — raising the baseline requires editing config,
   not running a skill.

5. **The `ensure-fnm.sh` wrapper is universal.** Every single Claude Code hook
   (all 19) uses `bash .claude/hooks/ensure-fnm.sh node <hook>.js` as its
   command. This means `ensure-fnm.sh` is a single point of failure for ALL
   Claude Code hooks on Windows. Its logic (fast-path if `node` on PATH,
   fallback to fnm) is straightforward but any failure cascades to all hooks.

---

## Confidence Assessment

- HIGH claims: 22 (all sourced directly from codebase files)
- MEDIUM claims: 2 (hook-runs.jsonl write path, override-log location)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All findings derived directly from SKILL.md files and hook script source code in
the codebase. No web search or training data was used.
