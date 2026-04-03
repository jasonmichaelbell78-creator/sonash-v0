# Findings: Session Lifecycle and Hook Compliance Processes

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ1c-2

---

## Key Findings

### 1. Session Lifecycle: A 5-Phase CLI-Driven Process [CONFIDENCE: HIGH]

The session lifecycle is entirely orchestrated through slash commands and
automated hooks. It has five major phases:

```
[Claude Code Launch]
       |
       v
[SessionStart Hook fires automatically]
  - session-start.js: npm install, build, pattern check, consolidation
  - check-mcp-servers.js: MCP availability check
  - check-remote-session-context.js: branch context drift check
  (if resuming after compaction → compact-restore.js fires instead)
       |
       v
[/session-begin skill invoked by user]
  Phase 1: Secrets check, cross-session validation
  Phase 2: Context loading (SESSION_CONTEXT.md, ROADMAP.md, session counter increment)
  Phase 3: 9 health scripts (patterns:check, review:check, lessons:surface, etc.)
  Phase 4: Warning gates (anomaly check, warning acknowledgment, build failures, tech debt)
  Phase 5: Summary + goal selection
       |
       v
[Active Work — hooks fire continuously on every tool use]
  Every Write/Edit/MultiEdit → post-write-validator.js
  Every Read → post-read-handler.js
  Every git commit attempt → pre-commit-agent-compliance.js (PreToolUse)
  Every git commit (post) → commit-tracker.js (PostToolUse)
  Every agent invocation → track-agent-invocation.js (PostToolUse)
  Every AskUserQuestion → decision-save-prompt.js (PostToolUse)
  Every user prompt → user-prompt-handler.js (UserPromptSubmit)
  Every git push attempt → block-push-to-main.js (PreToolUse)
  Write to .env.local.encrypted → blocked (PreToolUse)
  Write/Edit settings.json → settings-guardian.js (PreToolUse)
  Write/Edit firestore.rules → firestore-rules-guard.js (PreToolUse)
  Write/Edit CLAUDE.md or settings.json → governance-logger.js (PostToolUse)
  Build/test failures → loop-detector.js (PostToolUseFailure)
  [/checkpoint: mid-session state save to handoff.json + SESSION_CONTEXT.md]
       |
       v
[PreCompact fires if context compaction begins]
  - pre-compaction-save.js: writes handoff.json with full session snapshot
       |
       v
[/session-end skill invoked by user]
  Phase 1: Context preservation (SESSION_CONTEXT.md update — all 3 sections)
  Phase 2: Compliance review (agent gaps, override audit, hook learning synthesizer)
  Phase 3: Metrics pipeline (velocity, reviews sync, ecosystem health, TDMS consolidation)
  Phase 4: Cleanup (delete ephemeral state files) + pre-commit summary + final commit
       |
       v
[/alerts: callable anytime for health dashboard — 18 or 42 categories]
```

Source: session-begin/SKILL.md v2.0, session-end/SKILL.md v2.2, settings.json
hooks config.

---

### 2. Hook Inventory: 16 Active Scripts Across 6 Event Types [CONFIDENCE: HIGH]

Every hook is a Node.js script (cross-platform). The `ensure-fnm.sh` wrapper
ensures the correct Node version before each hook runs.

| Hook Script                       | Event                              | Trigger Condition                            | Action                                                                                                                                                  | Output                                                             |
| --------------------------------- | ---------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `session-start.js`                | SessionStart                       | Always                                       | npm install, build, pattern check, consolidation, review-lifecycle                                                                                      | stdout (Claude sees it), writes session-start-failures.json        |
| `check-mcp-servers.js`            | SessionStart                       | Always                                       | Check .mcp.json server availability                                                                                                                     | stdout status                                                      |
| `check-remote-session-context.js` | SessionStart                       | Always                                       | Compare SESSION_CONTEXT.md across remote branches                                                                                                       | stdout warning if drift                                            |
| `compact-restore.js`              | SessionStart (compact matcher)     | After compaction                             | Read handoff.json, output recovery context                                                                                                              | stdout recovery data                                               |
| `block-push-to-main.js`           | PreToolUse (Bash)                  | `if: Bash(git push *)`                       | Block pushes to main/master                                                                                                                             | Exit 2 blocks operation                                            |
| `pre-commit-agent-compliance.js`  | PreToolUse (Bash)                  | `if: Bash(git commit *)`                     | Check agent invocations before allowing commit                                                                                                          | Exit 2 blocks commit; appends to hook-warnings-log.jsonl           |
| `settings-guardian.js`            | PreToolUse (Write/Edit)            | `if: Write/Edit(.claude/settings.json)`      | Validate settings.json won't corrupt hook infra                                                                                                         | Exit 2 blocks write                                                |
| `firestore-rules-guard.js`        | PreToolUse (Write/Edit)            | `if: Write/Edit(**/firestore.rules)`         | Block removal of security write-block patterns                                                                                                          | Exit 2 blocks write                                                |
| env-guard (inline)                | PreToolUse (Write)                 | `if: Write(.env.local.encrypted)`            | Block overwrite of encrypted secrets                                                                                                                    | Exit 2 blocks write; appends to hook-warnings-log.jsonl            |
| `post-write-validator.js`         | PostToolUse (Write/Edit/MultiEdit) | Always                                       | 9 checks: S0/S1 audit, pattern compliance, component size, Firestore block, test mocking, App Check, TS strict, repo pattern, agent trigger enforcement | stdout "ok" or "block: reason"; appends to hook-warnings-log.jsonl |
| `post-read-handler.js`            | PostToolUse (Read)                 | Always                                       | Context size tracking, auto-save to MCP when thresholds hit                                                                                             | Updates .context-tracking-state.json                               |
| `decision-save-prompt.js`         | PostToolUse (AskUserQuestion)      | Always                                       | Prompt to save decisions when 3+ options presented                                                                                                      | stdout reminder (non-blocking)                                     |
| `commit-tracker.js`               | PostToolUse (Bash)                 | `if: Bash(git commit *)`                     | Append commit metadata to commit-log.jsonl                                                                                                              | Writes commit-log.jsonl                                            |
| `track-agent-invocation.js`       | PostToolUse (Task/Agent)           | Always                                       | Record agent name, description, sessionId, timestamp                                                                                                    | Appends to agent-invocations.jsonl                                 |
| `governance-logger.js`            | PostToolUse (Write/Edit)           | `if: Write/Edit(CLAUDE.md or settings.json)` | Log governance changes with git diff                                                                                                                    | Appends to governance-changes.jsonl + hook-warnings-log.jsonl      |
| `loop-detector.js`                | PostToolUseFailure (Bash)          | `if: Bash(npm run build/test/lint)`          | Detect repeated identical errors (3+ times in 20min)                                                                                                    | stdout warning to Claude (non-blocking)                            |
| `pre-compaction-save.js`          | PreCompact                         | Always                                       | Save full session snapshot                                                                                                                              | Writes .claude/state/handoff.json                                  |
| `user-prompt-handler.js`          | UserPromptSubmit                   | Always                                       | Surface unacknowledged alerts, context warnings                                                                                                         | stdout (Claude sees it on next prompt)                             |
| Notification (curl)               | Notification                       | Always                                       | Push ntfy.sh notification                                                                                                                               | External HTTP call                                                 |

Source: .claude/settings.json hooks config, individual hook file headers.

---

### 3. Data Touchpoints: 40+ State Files Read/Written During Session Lifecycle [CONFIDENCE: HIGH]

The session lifecycle creates a rich paper trail across many state files:

**Session-start hook writes:**

- `.claude/hooks/.session-state.json` — session begin/end timestamps, session
  ID, begin/end counts
- `.claude/state/session-start-failures.json` — build/install failures (cleared
  if none)
- `.claude/.lockfile-hash` — package-lock.json hash for skip-install
  optimization
- `.claude/.functions-lockfile-hash` — functions/package-lock.json hash

**Session-begin skill reads:**

- `SESSION_CONTEXT.md` — session counter, goals, status
- `ROADMAP.md` (lines 1-100) — active sprint
- `.claude/override-log.jsonl` — 7-day override trend
- `.claude/state/hook-warnings-log.jsonl` — 7-day warning count
- `.claude/state/health-score-log.jsonl` — grade drop detection
- `.claude/hook-warnings.json` — unacknowledged warnings (gate)
- `.claude/state/session-start-failures.json` — build failures (gate)
- `.claude/state/pending-test-registry.json` — test registry state (gate)
- `docs/technical-debt/INDEX.md` — S0/S1 counts

**Continuous work hooks write:**

- `.claude/state/commit-log.jsonl` — every commit (commit-tracker.js)
- `.claude/state/agent-invocations.jsonl` — every agent invocation
  (track-agent-invocation.js)
- `.claude/state/hook-warnings-log.jsonl` — warning events from multiple hooks
- `.claude/state/governance-changes.jsonl` — CLAUDE.md and settings.json changes
- `.claude/hooks/.context-tracking-state.json` — context size metrics
  (post-read-handler)
- `.claude/hooks/.session-agents.json` — agent compliance tracking
  (pre-commit-agent-compliance reads this)
- `.claude/hooks/.agent-trigger-state.json` — agent trigger suggestions
- `.claude/state/pending-reviews.json` — review queue state

**Pre-compaction hook writes:**

- `.claude/state/handoff.json` — full session snapshot (branch, commits, task
  states, agents)

**Checkpoint writes:**

- `.claude/state/handoff.json` — same as above but on-demand
- `.claude/state/task-{name}.state.json` — multi-step task progress

**Session-end skill reads/writes:**

- `SESSION_CONTEXT.md` (R/W) — all 3 sections updated
- `SESSION_HISTORY.md` (W) — archived session summaries
- `ROADMAP.md` (R/W) — feature completion status
- `.claude/hooks/.session-agents.json` (R/D) — agent compliance, then deleted
- `.claude/hooks/.agent-trigger-state.json` (R/D) — deleted at cleanup
- `.claude/state/pending-reviews.json` (R/D) — deleted at cleanup
- `.claude/state/agent-invocations.jsonl` (R) — session summary
- `.planning/system-wide-standardization/decisions.jsonl` (R) — planning context
- `.claude/state/velocity-log.jsonl` (W) — velocity metrics per session
- `.claude/state/ecosystem-health-log.jsonl` (W) — health score snapshots
- `docs/technical-debt/MASTER_DEBT.jsonl` (W) — consolidated debt
- `docs/technical-debt/metrics.json` (W) — machine-readable metrics
- `docs/technical-debt/METRICS.md` (W) — human-readable metrics
- `.claude/state/commit-log.jsonl` (R) — commit analytics
- `.claude/state/override-log.jsonl` (R) — override audit
- `.claude/state/hook-warnings-log.jsonl` (R) — hook learning synthesizer
- `.claude/state/health-score-log.jsonl` (R) — hook learning synthesizer
- `.claude/state/handoff.json` (D) — conditionally deleted if no in-progress
  tasks

**Alerts skill reads:**

- `.claude/state/alerts-history.jsonl` — cross-session trends
- `.claude/state/alert-suppressions.json` — suppressed alerts
- `.claude/state/alerts-baseline.json` — benchmark baselines
- `.claude/tmp/alerts-progress-{date}.json` — compaction-resilient progress

Source: session-begin/SKILL.md, session-end/SKILL.md Artifact Manifest, hook
source file headers.

---

### 4. Hook Warning Schema and Acknowledgment System [CONFIDENCE: HIGH]

Hook warnings use a defined JSONL schema:

```json
{
  "hook": "pre-push|pre-commit|post-write|...",
  "type": "trigger|reviewer|propagation-staged|pr-creep|env-guard|...",
  "severity": "error|warning|info",
  "message": "human-readable string",
  "action": "suggested fix or null",
  "timestamp": "ISO 8601",
  "occurrences": 13,
  "occurrences_since_ack": 13,
  "actor": "hook-system",
  "user": "jason|jbell|redacted",
  "outcome": "warned"
}
```

Acknowledgment state (hook-warnings-ack.json):

```json
{
  "acknowledged": {},
  "lastCleared": "2026-03-26T15:16:31.379Z"
}
```

The `lastCleared` timestamp is used as a shared boundary between session-begin
(which clears the gate) and `/alerts` (which skips items already acknowledged).
This prevents double-surfacing.

The log contains multi-locale entries (`user: jason`, `user: jbell`,
`user: redacted`) indicating the system operates across two work machines
sharing the same git repository.

Source: .claude/state/hook-warnings-log.jsonl (live data),
.claude/state/hook-warnings-ack.json.

---

### 5. Hook-Runs Log: Machine-Readable Compliance Record [CONFIDENCE: HIGH]

Every pre-commit and pre-push execution writes a structured record to
`.claude/state/hook-runs.jsonl`:

```json
{
  "hook": "pre-commit|pre-push",
  "timestamp": "ISO 8601",
  "branch": "branch-name",
  "commit": "hash (last known)",
  "total_checks": 14,
  "checks": [
    {"id": "secrets-scan", "status": "pass|fail|warn|skip|auto-fix", "duration_ms": 327},
    ...
  ],
  "total_duration_ms": 27325,
  "outcome": "pass|warn|fail",
  "skipped_checks": ["eslint", "audit-s0s1", ...],
  "warnings": 1,
  "errors": 0
}
```

Pre-commit has 14 checks; pre-push has 12 checks. Many checks are conditionally
skipped (e.g., `eslint` skips if no changed TS files). The `auto-fix` status
(used by `lint-staged` and `doc-index`) indicates automatic remediation occurred
silently — these are invisible to the user unless they read hook-runs.jsonl.

Live data shows the most common persistent warning is `cognitive-cc` (cognitive
complexity) on pre-push, with `propagation-staged` (security pattern
propagation) recurring on pre-commit.

Source: .claude/state/hook-runs.jsonl (live data).

---

### 6. Velocity-Log: Session Productivity Data Has Structural Gaps [CONFIDENCE: HIGH]

The velocity-log.jsonl schema:

```json
{
  "session": 187,
  "date": "2026-02-25",
  "items_completed": 0,
  "item_ids": [],
  "tracks": [],
  "sprint": "5. ACTIVE SPRINT: Operational Visibility (P0)"
}
```

A significant finding: `items_completed: 0` appears in every reviewed record
(sessions 148-187). The `item_ids` and `tracks` arrays are empty across all
sampled entries. This suggests the velocity tracking script (`track-session.js`)
is not successfully extracting completed ROADMAP items, making
velocity-log.jsonl a structurally incomplete data source. The `sprint` field
does correctly capture sprint context.

Source: .claude/state/velocity-log.jsonl (first 20 entries),
session-end/SKILL.md step 7a.

---

### 7. Alerts/Health Score System: Rich Trend Data [CONFIDENCE: HIGH]

The health-score-log.jsonl records ecosystem-wide scores after each
`/session-end`:

```json
{
  "timestamp": "...",
  "mode": "full",
  "grade": "B",
  "score": 87,
  "summary": {"errors": 4, "warnings": 15, "info": 12},
  "categoryScores": {
    "code": 60, "security": 100, "hook-health": 50,
    "hook-warnings": 50, "agent-compliance": 100,
    ...36 total categories
  }
}
```

The system scores 36 categories (full mode, 42 maximum). Current grade is B
(87). Notable category scores from latest run:

- `code`: 60 (degraded from 100)
- `hook-health`: 50 (persistent concern)
- `hook-warnings`: 50 (persistent concern)
- `skip-abuse`: 50 (check skipping frequency)
- `debt-metrics`: 70
- All security, compliance, velocity, review categories: 100

The grade dropped from A (91) to B (87) between March 19 and March 26. `code`
dropped from 100 to 60, and `sonarcloud` is consistently `null` (data
unavailable).

Source: .claude/state/health-score-log.jsonl (live data).

---

### 8. Visibility Gaps: Significant Hook Activity Has No Persistent Trail [CONFIDENCE: HIGH]

Several categories of hook activity are invisible or poorly tracked:

**No persistent log:**

- `loop-detector.js` results — detects repeated identical errors but writes no
  log file; warning exists only in Claude's context window
- `decision-save-prompt.js` decisions — prompts about saving decisions but the
  save itself goes to MCP memory (ephemeral unless the user saves) or is skipped
- `user-prompt-handler.js` context injection — injects context on each prompt
  but does not log what was injected or whether the user acted on it
- `compact-restore.js` recovery — reads and outputs handoff data but writes no
  recovery-success log
- `check-mcp-servers.js` results — outputs to stdout but no persistent
  availability log
- `check-remote-session-context.js` drift warnings — stdout only, no persistent
  record

**Ephemeral state files (deleted at session-end):**

- `.claude/hooks/.session-agents.json` — agent compliance tracking deleted after
  use
- `.claude/hooks/.agent-trigger-state.json` — agent trigger state deleted
- `.claude/state/pending-reviews.json` — review queue deleted
- `.claude/tmp/alerts-progress-{date}.json` — progress file, not committed

**Partial data:**

- `velocity-log.jsonl` — structurally present but `items_completed` always 0
  (broken extraction)
- `governance-changes.jsonl` — file exists by design but found empty in current
  state (no governance changes recently)
- `commit-log.jsonl` — recent entries show `session: null` and `filesChanged: 0`
  for seeded commits, indicating the live tracker and seed process produce
  different data quality

**Cross-session boundary:**

- No log of how long each `/session-begin` or `/session-end` took to run
- No log of which warning gates were triggered vs. silently passed
- No log of which of the 9 health scripts in session-begin passed/failed each
  session (only exposed in conversation output, not persisted)

Source: settings.json (hook configs), hook source file analysis, .claude/state/
directory listing.

---

### 9. Override Log: Bypass Events Are Tracked with User Context [CONFIDENCE: HIGH]

The override-log.jsonl schema:

```json
{
  "timestamp": "ISO 8601",
  "check": "reviewer|doc-header|...",
  "reason": "user-provided justification text",
  "user": "redacted",
  "cwd": "redacted",
  "git_branch": "branch-name"
}
```

The `user` and `cwd` fields are redacted in committed versions
(privacy-preserving). The check field identifies which hook was bypassed. Recent
overrides show `reviewer` (code-reviewer recognition in subagents) and
`doc-header` (research artifacts exempt from doc headers) as the most common
bypass reasons.

Source: .claude/override-log.jsonl (live data).

---

## Sources

| #   | Path                                    | Title                    | Type                  | Trust | Date       |
| --- | --------------------------------------- | ------------------------ | --------------------- | ----- | ---------- |
| 1   | `.claude/skills/session-begin/SKILL.md` | Session Begin Skill v2.0 | codebase-canonical    | HIGH  | 2026-03-16 |
| 2   | `.claude/skills/session-end/SKILL.md`   | Session End Skill v2.2   | codebase-canonical    | HIGH  | 2026-03-13 |
| 3   | `.claude/skills/checkpoint/SKILL.md`    | Checkpoint Skill v2.0    | codebase-canonical    | HIGH  | 2026-02-14 |
| 4   | `.claude/skills/alerts/SKILL.md`        | Alerts Skill v3.1        | codebase-canonical    | HIGH  | 2026-03-24 |
| 5   | `.claude/settings.json`                 | Hook Configuration       | codebase-ground-truth | HIGH  | current    |
| 6   | `.claude/hooks/*.js` (all 16)           | Hook Implementations     | codebase-ground-truth | HIGH  | various    |
| 7   | `.claude/state/hook-warnings-log.jsonl` | Live Warning Data        | codebase-ground-truth | HIGH  | 2026-03-29 |
| 8   | `.claude/state/hook-warnings-ack.json`  | Acknowledgment State     | codebase-ground-truth | HIGH  | 2026-03-26 |
| 9   | `.claude/state/velocity-log.jsonl`      | Velocity Data            | codebase-ground-truth | HIGH  | 2026-03-29 |
| 10  | `.claude/state/alerts-history.jsonl`    | Health History           | codebase-ground-truth | HIGH  | 2026-03-19 |
| 11  | `.claude/state/health-score-log.jsonl`  | Health Score Trend       | codebase-ground-truth | HIGH  | 2026-03-29 |
| 12  | `.claude/state/hook-runs.jsonl`         | Hook Execution Records   | codebase-ground-truth | HIGH  | 2026-03-29 |
| 13  | `.claude/state/handoff.json`            | Pre-compaction Snapshot  | codebase-ground-truth | HIGH  | 2026-03-29 |
| 14  | `.claude/override-log.jsonl`            | Override History         | codebase-ground-truth | HIGH  | 2026-03-29 |
| 15  | `.claude/state/agent-invocations.jsonl` | Agent Tracking           | codebase-ground-truth | HIGH  | 2026-03-29 |
| 16  | `.claude/state/commit-log.jsonl`        | Commit History           | codebase-ground-truth | HIGH  | 2026-03-29 |

---

## Contradictions

**None identified.** All sources are internally consistent. The skill files
describe the expected behavior, and the live state files confirm that behavior
is occurring (hook-runs.jsonl, hook-warnings-log.jsonl, agent-invocations.jsonl
all show active use).

One apparent tension: session-end/SKILL.md Step 7a says velocity tracking fires
only "if roadmap items changed," but all sampled velocity-log.jsonl entries show
`items_completed: 0`. This is not a contradiction between sources but evidence
of a functional gap in the velocity tracking script.

---

## Gaps

1. **No log of session-begin health script results** — The 9 scripts run in
   Phase 3 of session-begin are reported in conversation output but not
   persisted. A dashboard cannot reconstruct whether patterns:check passed or
   failed last Tuesday without searching git history.

2. **velocity-log.jsonl broken extraction** — All 20 sampled entries have
   `items_completed: 0`. Root cause is unknown from this research (would require
   reading track-session.js). Dashboard value from this source is currently zero
   for productivity metrics.

3. **No intra-session hook performance log** — hook-runs.jsonl records
   pre-commit and pre-push, but there is no equivalent log for the PostToolUse
   hooks (post-write-validator, post-read-handler). High-frequency hooks that
   run on every file write have no queryable performance history.

4. **Loop-detector has no persistent output** — The groundhog-day detector warns
   Claude but leaves no queryable trail. A dashboard cannot show "AI hit the
   same error 3 times today."

5. **No session duration tracking** — No state file records when a session
   actually began (from the user's perspective, not the hook's) or how long it
   lasted. The `.claude/hooks/.session-state.json` tracks begin/end hook
   timestamps but this file was not in the committed state files list.

6. **Notification hook is fire-and-forget** — The `ntfy.sh` notification has
   `continueOnError: true` and no acknowledgment tracking. There is no log of
   whether notifications were delivered or seen.

---

## Serendipity

**Multi-locale operation is baked in.** The hook-warnings-log.jsonl shows
entries from `user: jason`, `user: jbell`, and `user: redacted` on consecutive
days. The system has implicit multi-locale support (two work machines sharing a
git repo), but the dashboard opportunity here is significant: showing which
locale generated which warnings, or whether one locale is consistently
generating more bypass events.

**Session IDs are ephemeral timestamps.** The `currentSessionId` in
.session-state.json is `"session-1774738230139"` — a Unix timestamp, not a
human-readable counter. The session counter in SESSION_CONTEXT.md (e.g., #244)
is the human-readable ID, but it is stored only in a markdown file, not in any
JSONL. Cross-referencing "Session #244" with specific hook events in
hook-runs.jsonl requires date-based joining, not ID-based joining.

**`auto-fix` status is a hidden silent remediation.** In hook-runs.jsonl,
lint-staged and doc-index frequently show `status: "auto-fix"`. These are
automatic corrections that happened without user awareness. A dashboard could
surface "N auto-fixes applied this week" as a useful hygiene signal.

**pre-push `cognitive-cc` warning is persistent.** Every single pre-push record
in hook-runs.jsonl shows `cognitive-cc: warn`. This is a chronic issue that is
never resolved — it is treated as background noise. A dashboard trend line would
make this chronic nature explicit.

---

## Web Dashboard Opportunities

Based on the data sources above, the highest-value dashboard panels for
session/hook data:

1. **Session Health Timeline** — health-score-log.jsonl provides grade
   (A/B/C/D/F) + 36 category scores per session-end. A time-series chart of
   overall grade + selected problem categories (code, hook-health,
   hook-warnings) would make the A→B regression immediately visible.

2. **Hook Compliance Heatmap** — hook-runs.jsonl provides per-check
   pass/warn/fail/skip/auto-fix per commit. A matrix of check vs. date with
   color coding would surface persistent warnings (cognitive-cc) vs.
   intermittent ones (propagation-staged).

3. **Override Audit Log** — override-log.jsonl is clean and committed. A table
   of recent overrides with check, reason, branch, and date would help track
   bypass patterns without reading raw JSONL.

4. **Warning Trend Chart** — hook-warnings-log.jsonl records type, severity,
   occurrences, and occurrences_since_ack. Grouping by `type` over time would
   show whether the `pre-push trigger` and `propagation-staged` warnings are
   growing or stable.

5. **Agent Compliance Summary** — agent-invocations.jsonl records agent name,
   sessionId, timestamp. A per-session summary of "agents invoked this session"
   would be dashboard-ready, especially cross-referenced against the pre-commit
   compliance gate results.

6. **Auto-Fix Counter** — hook-runs.jsonl status: "auto-fix" events are
   unacknowledged silent remediations. A weekly count of auto-fixes
   (lint-staged, doc-index) surfaces hygiene work that is currently invisible.

---

## CLI Handoff Points

Where a web dashboard user would need to trigger CLI actions (no pure web
equivalent):

| Scenario                | CLI Command                                               | Dashboard Trigger                                  |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| Start session           | `/session-begin` (Claude command)                         | "Start Session" button → opens Claude              |
| Run health check        | `node .claude/skills/alerts/scripts/run-alerts.js --full` | "Refresh Health" button → runs script              |
| Acknowledge warnings    | `/alerts` (interactive)                                   | "Review Warnings" → opens Claude                   |
| Fix hook violation      | User-specific (shown in warning action field)             | "Fix Now" link from warning detail                 |
| Override a check        | `node scripts/log-override.js`                            | "Log Override" form → writes to override-log.jsonl |
| Rebuild health baseline | `node scripts/rebuild-alerts-baseline.js`                 | "Rebuild Baseline" button                          |
| End session + metrics   | `/session-end` (Claude command)                           | "End Session" button → opens Claude                |

The dashboard can **read** all JSONL state files without CLI access. Write
operations (acknowledging warnings, logging overrides, triggering health runs)
require either CLI access or a backend API layer that does not currently exist.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are directly verified against live codebase files (skill specs,
hook source code, live state files). No training data was used.
