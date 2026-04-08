---
name: session-begin
description: >-
  Pre-flight checklist for work sessions — loads context, runs health scripts,
  surfaces warnings, and gates on acknowledgment before work begins.
---

# Session Begin Pre-Flight

Pre-flight checklist that orients the session: loads context, validates
environment, runs health scripts, surfaces warnings, and hands off to the user
with a goal-selection prompt.

**Time budget:** Session-begin SHOULD complete in under 5 minutes. If script
issues or staleness require extended remediation, present findings and defer
fixes to user decision.

## Critical Rules (MUST follow)

1. **Duplicate detection first** — MUST check before any action (see below).
2. **Never double-increment** — MUST verify the session counter wasn't already
   incremented in this conversation or after compaction before incrementing.
3. **Announce session number** — MUST output "Session #N started on [branch]"
   after incrementing.
4. **Script failures escalate to user** — MUST present failures with options
   (fix now / defer / ignore). Do not decide unilaterally.
5. **Stale docs are a user decision** — MUST present discrepancies and ask
   "Update now or defer?" Do not auto-fix.
6. **Scope explosion guard** — if 3+ scripts failed or 3+ actionable findings
   surfaced, MUST present a triage list before acting on any.

## Duplicate Detection (MUST — before anything)

Check all three:

1. Have I already completed this checklist in the current conversation?
2. Was SESSION_CONTEXT.md "Last Updated" modified today? (date-only field —
   sub-day relies on checks #1 and #3)
3. Did I already increment the session counter in this conversation?

**If ANY true:** "Session #N already active. What would you like to work on?"
**If ALL false:** Proceed with full checklist.

## When to Use

- Start of every AI work session
- User explicitly invokes `/session-begin`

## When NOT to Use

- Mid-session health check → `/alerts`
- Session closure → `/session-end`
- State snapshot → `/checkpoint`
- Already ran this session → duplicate detection catches it

## Hook Boundary

The **SessionStart hook** handles: consolidation, cross-session validation,
dependency install, build. This skill handles: context loading, counter
increment, script health checks, warning gates, goal selection. If the hook
already completed a step (check its output), skip it.

---

## Warm-Up (MUST — first output after duplicate detection passes)

"Starting Session #N pre-flight on [branch]. Will load context, run 9 health
scripts, and surface any warnings."

---

## Phase 1: Environment Setup (MUST)

### 1.1 Secrets Decryption Check (SHOULD — remote sessions only)

```bash
if [ -f ".env.local.encrypted" ] && [ ! -f ".env.local" ]; then
  echo "Encrypted secrets found but not decrypted"
fi
```

If secrets need decrypting: ask user for passphrase, run:
`echo "<passphrase>" | node scripts/secrets/decrypt-secrets.js --stdin` Verify
`.env.local` exists. Never store or log the passphrase.

If already decrypted or no encrypted file: skip.

### 1.2 Cross-Session Validation (handled by hook)

Handled by SessionStart hook. **If "Cross-Session Warning" appears:** check
`git status`, `git log --oneline -5`, run `npm run hooks:health`. Update
SESSION_CONTEXT.md if prior session missed `/session-end`.

---

## Phase 2: Context Loading (MUST)

### 2.1 Load Session Context (MUST)

- Read [SESSION_CONTEXT.md](../../../SESSION_CONTEXT.md) — status, blockers,
  goals
- Increment session counter (MUST — verify not already incremented first)
- Output: "Session #N started on [branch]"
- Read [ROADMAP.md](../../../ROADMAP.md) lines 1-100 (Active Sprint only)

### 2.2 Branch Validation (MUST)

Verify SESSION_CONTEXT.md's documented branch matches
`git branch --show-current`. If mismatch, warn user before proceeding.

### 2.3 Stale Documentation Check (MUST)

```bash
git log --oneline -30
```

Compare commits against ROADMAP.md Active Sprint checkboxes. If discrepancies
found, present them: "Docs appear stale: [specifics]. Update now or defer?"

Let the user decide. Do not auto-update.

### 2.4 Session Gap Detection (handled by scripts)

Automated via `npm run session:gaps` in Phase 3. If gaps detected, run
`npm run session:gaps:fix` and present suggestions.

### 2.5 Consolidation Status (handled by hook)

Automated by SessionStart hook. If it failed (check hook output), run:
`node scripts/run-consolidation.js --apply`

### 2.6 Prior Research Surface (SHOULD)

Check if `.research/research-index.jsonl` exists and is non-empty. If so, read
the last 5 entries and present a brief summary:

> **Prior research:** N topics analyzed. Most recent: {topic} ({date}).

This is non-blocking — if the file is missing or empty, skip silently. The
purpose is to surface prior `/repo-analysis`, `/website-analysis`, and
`/deep-research` work so the user knows what context is available.

---

## Phase 3: Health Scripts (MUST)

**Output:** "Running 10 health scripts..."

```bash
npm run patterns:check
npm run review:check
npm run lessons:surface
npm run session:gaps
npm run roadmap:hygiene
npm run reviews:sync -- --apply
npm run reviews:check-archive
npm run reviews:archive
npm run hooks:analytics -- --since=$(date -d '7 days ago' +%Y-%m-%d)
node scripts/run-github-health.js --quick
```

**After all scripts:** "Scripts complete: N passed, M failed, K warnings."

**If any script fails (MUST):** Present to user: "Script X failed: [error]. Fix
now / Defer / Ignore?" Do not silently decide.

**Record results** — these must be marked as "Ran" or "Failed (reason)" in
`/session-end` audit.

### 3.1 Cross-Document Dependency Check (SHOULD)

```bash
npm run crossdoc:check
```

### 3.2 Velocity & Task Dependencies (SHOULD)

```bash
node scripts/velocity/generate-report.js 2>/dev/null || true
node scripts/tasks/resolve-dependencies.js 2>/dev/null || true
```

---

## Phase 4: Warning Gates (MUST)

### 4.1 Hook Anomaly Gate (MUST)

Check for anomalies (best-effort — skip files that don't exist):

1. **Override trend:** Read `.claude/override-log.jsonl`. Count overrides in
   last 7 days vs previous 7 days. If 50%+ higher and 5+ more → warn.
2. **Hook warnings:** Read `.claude/state/hook-warnings-log.jsonl`. If 10+ in
   last 7 days → warn.
3. **Health grade drop:** Read `.claude/state/health-score-log.jsonl`. If grade
   dropped 2+ levels → warn.

If anomalies found, present and recommend `/alerts --full`. If none: skip
silently.

### 4.2 Warning Acknowledgment Gate (MUST)

Read `.claude/hook-warnings.json`. If unacknowledged warnings exist (added since
`lastCleared`):

```
Unacknowledged hook warnings (N):
  1. [type] message (occurrences)
  2. ...

  Acknowledge all? [Y] or review individually? [R]
```

**Y:** Record timestamp in `hook-warnings.json`, proceed. **R:** Present each
for individual decision. **No warnings:** Skip silently.

**After all acknowledgments:** Run `node scripts/sync-warnings-ack.js` to sync
`lastCleared` with per-type acks. This updates the statusline unacked count.

### 4.3 Infrastructure Failure Gate (MUST)

Check for state files written by session-start.js passive-surfacing fixes:

1. **Build failures:** Read `.claude/state/session-start-failures.json`. If it
   exists and has entries, present each failure with its `Fix:` command:

   ```
   Session-start build failures (N):
     1. [description] — Fix: [command]
     2. ...

   Fix now / Acknowledge / Defer?
   ```

2. **Pending test registry:** Read `.claude/state/pending-test-registry.json`.
   If it exists, remind: "Test registry needs update. Run: npm run
   tests:registry"
3. **Pending decisions:** Read `.claude/hook-warnings.json` for
   `decision-documentation` type entries. Surface undocumented decisions.

**All items require acknowledgment** before proceeding. Do not skip silently.

### 4.4 Technical Debt Snapshot (SHOULD)

Read [Technical Debt INDEX](../../../docs/technical-debt/INDEX.md). Note S0/S1
counts for the summary.

---

## Phase 5: Summary & Goal Selection (MUST)

### Summary Template

Present using this format:

```
Session #N — Pre-Flight Summary
Branch: [branch]

| Script | Status |
|--------|--------|
| patterns:check | Pass/Fail |
| review:check | Pass/Warn |
| ... | ... |

Warnings: N acknowledged | Tech Debt: N S0, M S1
Next Goals (from SESSION_CONTEXT.md):
  [list ALL goals from both "Immediate Priority" and "After Debt-Runner"
   sections — do not truncate or cap the list]
```

### Goal Selection (MUST)

After the summary: "Which goal would you like to focus on, or something else?"
Reference the surfaced goals — do not use a generic open-ended prompt.

### Closure Signal (MUST)

"Session #N pre-flight complete. [N] scripts ran, [M] warnings acknowledged.
Ready to work."

**Done when:** Session counter incremented, context loaded, all scripts ran (or
failures escalated to user), warnings acknowledged, goal selected.

---

## Guard Rails

- **Scope explosion:** If 3+ scripts failed or 3+ findings surfaced, present a
  triage list: "Multiple issues found. Which to address now vs defer?" Do not
  auto-fix multiple issues.
- **Disengagement:** If user says "skip" or "let's work" mid-checklist, stop
  immediately. Present what's completed vs remaining. Proceed to goal selection.
- **Compaction recovery:** If compaction occurs mid-session-begin, re-read
  SESSION_CONTEXT.md. If counter was already incremented, do not re-increment.
  Resume from the last unfinished phase.

---

## Integration

- **Neighbors:** `session-end` (receives session context), `checkpoint`
  (mid-session state), `alerts` (detailed health drill-down)
  - Note: `/alerts` uses `.claude/tmp/alerts-progress-{date}.json` for
    compaction resilience. If this file exists and is <2h old, alerts will offer
    to resume a previous session.
- **Handoff to session-end:** SESSION_CONTEXT.md updated with session number and
  current work. Script results marked as "Ran" or "Failed."
- **Reference material:** See [REFERENCE.md](./REFERENCE.md) for skill routing,
  code review procedures, and anti-pattern guidance.

---

## Version History

| Version | Date       | Description                                    |
| ------- | ---------- | ---------------------------------------------- |
| 2.0     | 2026-03-16 | Skill-audit rewrite: 31 decisions, 51→73 score |
| 1.0     | 2026-02-25 | Initial implementation                         |
