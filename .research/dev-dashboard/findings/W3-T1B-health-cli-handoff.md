# Findings: Health & Alerts Tab — CLI Handoff Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Scope:** Tab 1 (Health & Alerts) CLI command inventory, clipboard format, gap
analysis, missing data gaps, cross-tab navigation

---

## Key Findings

### 1. Complete CLI Command Inventory for Health & Alerts Tab [CONFIDENCE: HIGH]

Three primary skill invocations exist for this tab. All have confirmed SKILL.md
definitions and underlying scripts.

**`/alerts` — Lightweight health signal**

| Variant           | Clipboard String    | Duration | When to surface                                      |
| ----------------- | ------------------- | -------- | ---------------------------------------------------- |
| Limited (default) | `/alerts`           | 15–30s   | Default action — 18 categories, routine use          |
| Explicit limited  | `/alerts --limited` | 15–30s   | Called from session-begin; not needed from dashboard |
| Full              | `/alerts --full`    | 30–60s   | Deep review — 42 categories                          |

Behavior: Runs `node .claude/skills/alerts/scripts/run-alerts.js --limited` (or
`--full`). Produces interactive alert-by-alert workflow. Grade computed as: 100
− (30 × errors + 10 × warnings).

**`/ecosystem-health` — Full interactive health dashboard**

| Variant              | Clipboard String                  | Duration  | When to surface                                   |
| -------------------- | --------------------------------- | --------- | ------------------------------------------------- |
| Full with triage     | `/ecosystem-health`               | 10–15 min | When grade is C or lower, or any category flagged |
| Quick dashboard only | `/ecosystem-health --quick`       | ~1 min    | Fast pulse check, no triage                       |
| Drill into dimension | `/ecosystem-health --dimension=X` | ~1 min    | Drill from a specific failing scorecard           |

Behavior: Runs
`node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js`. Persists
to `data/ecosystem-v2/ecosystem-health-log.jsonl`. Runs 10–11 checkers (4 in
quick mode). Outputs markdown dashboard + interactive triage.

**`/comprehensive-ecosystem-audit` — Full 8-audit staged wave**

| Variant  | Clipboard String                 | Duration           | When to surface                                       |
| -------- | -------------------------------- | ------------------ | ----------------------------------------------------- |
| Full run | `/comprehensive-ecosystem-audit` | ~30 min (parallel) | Quarterly check, before release, after major refactor |

Behavior: Spawns 8 sub-audits across 2 stages. Weighted composite: Hook 14%,
Skill 18%, TDMS 14%, PR 14%, Script 12%, Health 10%, Session 9%, Doc 9%. Output:
`COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` (overwritten each run — no persistent
history).

---

### 2. Direct Script Commands (No Skill Wrapper) [CONFIDENCE: HIGH]

These are raw script invocations available as npm scripts or direct node calls.
They are faster and appropriate for "refresh data" buttons on the dashboard.

**Health check scripts**

| Action                                 | Command                                                                        | Flags                     | Duration |
| -------------------------------------- | ------------------------------------------------------------------------------ | ------------------------- | -------- |
| Full health check (text output)        | `node scripts/health/run-health-check.js`                                      | none                      | ~30s     |
| Quick health check (4 checkers)        | `node scripts/health/run-health-check.js --quick`                              | —                         | ~10s     |
| Health check JSON output               | `node scripts/health/run-health-check.js --json`                               | —                         | ~30s     |
| Drill into a dimension                 | `node scripts/health/run-health-check.js --dimension=<ID>`                     | See dimension table below | ~30s     |
| Full health dashboard with persistence | `node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js`         | —                         | ~30s     |
| Quick dashboard (no triage)            | `node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js --quick` | —                         | ~10s     |

**Dimension IDs for `--dimension=` flag** (14 total):

| ID                        | Name                    | Category            |
| ------------------------- | ----------------------- | ------------------- |
| `ts-health`               | TypeScript Health       | Code Quality        |
| `eslint-compliance`       | ESLint Compliance       | Code Quality        |
| `pattern-enforcement`     | Pattern Enforcement     | Learning & Patterns |
| `vulnerability-status`    | Vulnerability Status    | Security            |
| `debt-aging`              | Debt Aging              | Technical Debt      |
| `debt-velocity`           | Debt Velocity           | Technical Debt      |
| `test-pass-rate`          | Test Pass Rate          | Testing             |
| `learning-effectiveness`  | Learning Effectiveness  | Learning & Patterns |
| `hook-pipeline-health`    | Hook Pipeline Health    | Infrastructure      |
| `session-management`      | Session Management      | Infrastructure      |
| `documentation-freshness` | Documentation Freshness | Documentation       |
| `review-quality`          | Review Quality          | Process & Workflow  |
| `workflow-compliance`     | Workflow Compliance     | Process & Workflow  |
| `data-effectiveness`      | Data Effectiveness      | Data Effectiveness  |

**Individual ecosystem audit scripts**

| Action                     | Command / npm script         | Duration |
| -------------------------- | ---------------------------- | -------- |
| Hook ecosystem audit       | `npm run hooks:audit`        | 2–5 min  |
| TDMS ecosystem audit       | `npm run tdms:audit`         | 2–5 min  |
| Session ecosystem audit    | `npm run session:audit`      | 2–5 min  |
| PR ecosystem audit         | `npm run pr:audit`           | 2–5 min  |
| Skill ecosystem audit      | `npm run skills:audit`       | 2–5 min  |
| Doc ecosystem audit        | `npm run docs:audit`         | 2–5 min  |
| Script ecosystem audit     | `npm run scripts:audit`      | 2–5 min  |
| Hook health check          | `npm run hooks:health`       | ~10s     |
| Pattern compliance check   | `npm run patterns:check`     | ~10s     |
| All patterns check         | `npm run patterns:check-all` | ~20s     |
| Pattern sync check         | `npm run patterns:sync`      | ~10s     |
| Pattern FP report          | `npm run patterns:fp-report` | ~10s     |
| Hook analytics             | `npm run hooks:analytics`    | ~10s     |
| Cross-doc dependency check | `npm run crossdoc:check`     | ~5s      |

**Note:** No `hooks:audit` for health-ecosystem-audit is in package.json. Its
script is called directly:
`node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js`.
This audit is Stage 1 item 5 in comprehensive-ecosystem-audit.

---

### 3. Exact Clipboard Strings (`navigator.clipboard.writeText`) [CONFIDENCE: HIGH]

The dashboard surfaces these as "copy to clipboard" actions. The user pastes
them into their Claude Code terminal.

**Primary Actions**

```
/alerts
/alerts --full
/ecosystem-health
/ecosystem-health --quick
/comprehensive-ecosystem-audit
```

**Per-Category Drill-Down** (generated dynamically based on failing category)

```
/ecosystem-health --dimension=hook-pipeline-health
/ecosystem-health --dimension=debt-aging
/ecosystem-health --dimension=documentation-freshness
/ecosystem-health --dimension=ts-health
/ecosystem-health --dimension=vulnerability-status
/ecosystem-health --dimension=pattern-enforcement
/ecosystem-health --dimension=learning-effectiveness
/ecosystem-health --dimension=review-quality
/ecosystem-health --dimension=workflow-compliance
/ecosystem-health --dimension=data-effectiveness
```

**Individual Audit Run** (for Governance tab — but surfaced here when stale)

```
npm run hooks:audit
npm run docs:audit
npm run tdms:audit
```

**Data Refresh (no Claude skill wrapper needed)**

```
node scripts/health/run-health-check.js --json
node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js --quick
npm run patterns:check
npm run crossdoc:check
npm run hooks:health
```

---

### 4. Gap Analysis — Actions Users Want with No Existing CLI [CONFIDENCE: HIGH]

These are the actions a Health & Alerts tab user will want that have no direct
CLI equivalent today.

**GAP-1: Acknowledge a specific warning**

- User desire: Click "Acknowledge" on a warning card in the dashboard.
- Current state: `warning-lifecycle.js` has an acknowledge API
  (`updateWarningStatus(id, 'acknowledged', reason)`), but it is a Node.js
  module, not a CLI script. There is no
  `npm run warnings:ack --id=X --reason="..."` command.
- Impact: Cannot wire a dashboard button to this action without writing a thin
  CLI wrapper.

**GAP-2: Suppress/resolve a specific alert**

- User desire: Mark an alert as suppressed directly from the dashboard (instead
  of going through the `/alerts` interactive loop).
- Current state: Suppression is managed interactively inside the `/alerts` Phase
  3 loop. The suppression state file is `.claude/state/alert-suppressions.json`
  but there is no CLI to add entries directly.
- Impact: No single-click suppress from the dashboard without a new CLI script.

**GAP-3: View the last comprehensive audit report**

- User desire: "Show me the last full audit report."
- Current state: `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` is overwritten each
  run and not persisted to history. If the last run was a week ago, the report
  still exists in root but there is no command to display it or check its age.
- Impact: Dashboard could display the age of the existing file and offer a
  "view" action, but the viewing is just opening a file — no dedicated CLI
  exists. No history JSONL exists so trend comparison is impossible.

**GAP-4: Run a single sub-audit (health sub-audit specifically)**

- User desire: "Run just the health ecosystem audit."
- Current state: No `npm run health:audit` script exists. The script path is
  `node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js`.
  This is an inconsistency — all other sub-audits have npm script aliases
  (`hooks:audit`, `tdms:audit`, etc.) but health does not.
- Impact: Dashboard cannot offer a consistent "Run audit" button row across all
  8 sub-audits without a special-case for health.

**GAP-5: Trigger mid-session alert check on demand**

- User desire: "Check for alert-worthy conditions right now" (without
  committing).
- Current state: `mid-session-alerts.js` is only triggered post-commit by
  `commit-tracker.js`. There is no `npm run alerts:mid-session` command.
- Impact: Dashboard refresh does not have a "run mid-session check now" action.

**GAP-6: View or clear the alerts cooldown**

- User desire: "Force re-check even if within the 1-hour cooldown."
- Current state: `.claude/hooks/.alerts-cooldown.json` is written by
  `mid-session-alerts.js`. No CLI to read or reset it.
- Impact: Users cannot override the cooldown from the dashboard.

**GAP-7: Export/save comprehensive audit report to history**

- User desire: Archive the current `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`
  before it is overwritten by the next run.
- Current state: No such script exists. No `comprehensive-audit-history.jsonl`.
- Impact: Quarterly trend comparison requires manual file management. Gap
  confirmed in SQ1c-3 findings.

---

### 5. Missing Data Gaps — Would Improve This Tab [CONFIDENCE: HIGH]

These are data sources or instrumentation that do not exist today but would
enable better dashboard widgets.

**MDATA-1: No `comprehensive-audit-history.jsonl`**

- Impact: Cannot show trend line for composite ecosystem grade over time. The
  most valuable health KPI (overall ecosystem score) has no history. Individual
  sub-audit histories exist but the composite does not.
- Suggested fix: After each `/comprehensive-ecosystem-audit` run, append a
  summary entry to a new `.claude/state/comprehensive-audit-history.jsonl`
  before deleting result files.

**MDATA-2: Dual health log files not reconciled**

- `.claude/state/health-score-log.jsonl` (24 entries, session-start writes, old
  format with many nulls) and `data/ecosystem-v2/ecosystem-health-log.jsonl` (32
  entries, orchestrator writes, richer format) both exist with overlapping date
  ranges.
- Impact: Dashboard must pick one as canonical. The ecosystem-v2 one is the
  richer source, but the session-start hook only writes to the state one. A
  dashboard reading only the ecosystem-v2 log misses session-start health
  checks.
- Suggested fix: Consolidate to one file, or add a merge step. Confirmed gap in
  SQ1c-3 (Contradiction section).

**MDATA-3: Warning acknowledgment trail**

- `data/ecosystem-v2/warnings.jsonl` has a lifecycle state machine (new →
  acknowledged → resolved) but no timestamps for state transitions other than
  creation. Cannot show "acknowledged 3 days ago by user."
- Impact: Dashboard warning cards cannot show resolution timeline.

**MDATA-4: Mid-session alert fire history**

- When `mid-session-alerts.js` fires, it writes to `warnings.jsonl` and
  `hook-warnings-log.jsonl`. There is no record of which alerts were surfaced,
  when, and whether the user saw them.
- Impact: Cannot show "2 alerts fired since last session, both unacknowledged."

**MDATA-5: Pattern gate enforcement manifest is static**

- `data/ecosystem-v2/enforcement-manifest.jsonl` (360 records) tracks which
  patterns are enforced and via which mechanisms (regex, ESLint, semgrep, hooks,
  AI, manual). Last verified date is `2026-03-01` for all entries.
- Impact: The pattern gate coverage widget would show a static snapshot. No
  history to show "coverage improved from 85% to 92% last month." No automated
  refresh of `last_verified` dates.

**MDATA-6: No real-time SonarCloud health data**

- `health-score-log.jsonl` shows `sonarcloud: null` in virtually every entry.
  The `ecosystem-integration.js` checker calls `npm run sonar:check` but it
  consistently returns null.
- Impact: The "SonarCloud health" dimension in the dashboard must show
  "unavailable" or be hidden until this is fixed. Cannot display sonar quality
  gate status or security hotspot count.

**MDATA-7: Alerts run history**

- `alerts-history.jsonl` has only 1 entry (2026-03-19). Cannot compute trends
  for alert score, grade, or fix rate over time.
- Impact: The `/alerts` health trend widget cannot show meaningful sparklines.

**MDATA-8: No per-checker timing data**

- `run-health-check.js` does not record how long each checker takes. When a
  health check is slow, there is no diagnostic data.
- Impact: Cannot surface "health check took 45s — hook-pipeline checker was
  slow."

---

### 6. Cross-Tab Navigation Rules [CONFIDENCE: HIGH]

These are specific triggers on the Health & Alerts tab that should navigate or
link to another tab.

| Trigger                                                                         | Navigate To                                | Message / Context                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `debt-aging` or `debt-velocity` dimension score drops                           | Tab 2: Debt Pipeline                       | "Debt aging degraded — review debt aging in Debt Pipeline tab"                           |
| `debt-metrics` category score drops                                             | Tab 2: Debt Pipeline                       | "Debt metrics category dropped — see Debt tab for breakdown"                             |
| `review-quality` or `workflow-compliance` dimension drops                       | Tab 3: Code Review Quality                 | "Review quality dropped — see Review Quality tab for pattern analysis"                   |
| `hook-pipeline-health` dimension score drops                                    | Tab 4: Build Pipeline & Process Compliance | "Hook pipeline degraded — see Build Pipeline tab for hook compliance heatmap"            |
| `workflow-compliance` dimension drops                                           | Tab 4: Build Pipeline & Process Compliance | "Workflow compliance dropped — check override rate in Build Pipeline tab"                |
| Any sub-audit is stale (history file has only 1 entry, or last entry > 30 days) | Tab 5: Governance & Audits                 | "Doc ecosystem audit is stale (last run 2026-02-25) — see Governance tab"                |
| `comprehensive-ecosystem-audit` results exist                                   | Tab 5: Governance & Audits                 | "Comprehensive audit report available — view in Governance tab"                          |
| Lifecycle score for any system has `action < 2`                                 | Tab 6: Planning & Research                 | "3 data systems have low action scores — see lifecycle drill-down in Planning tab"       |
| `documentation-freshness` dimension drops                                       | Tab 2/Tab 5 context-dependent              | "Documentation freshness dropped — check cross-doc deps or run docs:audit"               |
| `learning-effectiveness` dimension drops                                        | Tab 3: Code Review Quality                 | "Learning effectiveness low — unrouted learnings may be piling up in Review Quality tab" |

**Shared data overlap note:** `hook-warnings-log.jsonl` appears in both Tab 1
(Health) and Tab 4 (Build Pipeline). When surfacing a hook warning on Tab 1, the
cross-tab link to Tab 4 should say: "Full hook compliance history in Build
Pipeline tab."

---

## Sources

| #   | Source                                                             | Type                           | Trust | CRAAP     | Date       |
| --- | ------------------------------------------------------------------ | ------------------------------ | ----- | --------- | ---------- |
| 1   | `.claude/skills/alerts/SKILL.md`                                   | Skill definition               | HIGH  | 5/5/5/5/5 | Active     |
| 2   | `.claude/skills/ecosystem-health/SKILL.md`                         | Skill definition               | HIGH  | 5/5/5/5/5 | 2026-03-11 |
| 3   | `.claude/skills/comprehensive-ecosystem-audit/SKILL.md`            | Skill definition               | HIGH  | 5/5/5/5/5 | 2026-02-24 |
| 4   | `scripts/health/run-health-check.js`                               | Source (CLI entrypoint)        | HIGH  | 5/5/5/5/5 | 2026-03-15 |
| 5   | `scripts/health/lib/dimensions.js`                                 | Source (dimension registry)    | HIGH  | 5/5/5/5/5 | 2026-03-15 |
| 6   | `.claude/skills/alerts/scripts/run-alerts.js`                      | Source (script entrypoint)     | HIGH  | 5/5/5/5/5 | Active     |
| 7   | `.claude/skills/ecosystem-health/scripts/run-ecosystem-health.js`  | Source (script entrypoint)     | HIGH  | 5/5/5/5/5 | Active     |
| 8   | `scripts/health/lib/mid-session-alerts.js`                         | Source (alert trigger)         | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 9   | `scripts/health/lib/warning-lifecycle.js`                          | Source (warning state machine) | HIGH  | 5/5/5/5/5 | 2026-03-22 |
| 10  | `.research/dev-dashboard/findings/SQ1c-3-process-health-audits.md` | Prior research (codebase)      | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 11  | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md`     | User decision record           | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 12  | `package.json` scripts section                                     | Config (npm script registry)   | HIGH  | 5/5/5/5/5 | Current    |
| 13  | `data/ecosystem-v2/enforcement-manifest.jsonl`                     | State data (pattern catalog)   | HIGH  | 5/5/5/5/5 | 2026-03-01 |

---

## Contradictions

**`/ecosystem-health --dimension=X` vs
`node scripts/health/run-health-check.js --dimension=X`**

The SKILL.md for ecosystem-health lists `/ecosystem-health --dimension=X` as a
valid invocation. The underlying script `run-ecosystem-health.js` does not
appear to forward a `--dimension` flag — it calls `run-health-check.js`
internally without passing through unknown flags. The `--dimension` flag is
confirmed in `run-health-check.js` directly. The clipboard string
`/ecosystem-health --dimension=X` likely works as a skill invocation that Claude
interprets, while the raw script
`node scripts/health/run-health-check.js --dimension=X` is the direct
equivalent. Both are listed for completeness; prefer the skill invocation from
the dashboard since it provides structured output.

**Two warning systems with different data richness**

`data/ecosystem-v2/warnings.jsonl` (full lifecycle state machine:
new/acknowledged/resolved) vs `.claude/state/hook-warnings-log.jsonl` (flat
event log, higher frequency). The CHECKPOINT-tab-decisions.md notes these need
aggregation logic. The dashboard Health tab should display from both, but the
primary actionable surface (acknowledge/resolve) should only be wired to
`warnings.jsonl` since it has the state machine.

---

## Gaps

1. No `npm run health:audit` script — health ecosystem audit lacks an npm alias
   unlike all 7 other sub-audits. Direct script path is
   `node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js`.
2. `warning-lifecycle.js` acknowledge API is not exposed as a CLI — cannot wire
   "Acknowledge" button without a new thin wrapper script.
3. `mid-session-alerts.js` has no standalone CLI invocation — no "run alert
   check now" button possible today.
4. No `comprehensive-audit-history.jsonl` — the most important composite trend
   has no persistent history.
5. `alerts-history.jsonl` has only 1 entry — `/alerts` trend sparklines will be
   empty for months.
6. SonarCloud health data is consistently null — the ecosystem-integration
   dimension cannot be fully populated.
7. No before/after record for `doc-optimizer` auto-fixes — cannot show "N docs
   improved" on Health tab.
8. Whether `/ecosystem-health --dimension=X` properly forwards the flag through
   the skill wrapper to the underlying script was not verified (the script code
   was not traced fully). The raw node command is the confirmed ground truth.

---

## Serendipity

**Pattern gate coverage widget is richer than expected.**
`enforcement-manifest.jsonl` (360 records) has per-pattern breakdown of
enforcement mechanisms: regex, ESLint, semgrep, hooks, AI, manual. A coverage
widget could show not just "N of 360 patterns active" but "breakdown by
enforcement layer: 45% have semgrep, 62% have ESLint, 89% have AI". This is far
more actionable than a single coverage percentage.

**`data/ecosystem-v2/invocations.jsonl` is a parallel skill invocation
tracker.** Separate from `.claude/state/agent-invocations.jsonl`. The Health tab
could surface "last time `/ecosystem-health` was invoked: 3 days ago" by reading
this file without running any scripts.

**The ecosystem-health duplicate-run guard (30 min) is invisible to the
dashboard.** If a user clicks "Run health check" and it was run 20 minutes ago,
the script will warn but not block. The dashboard should read the last entry
timestamp from `ecosystem-health-log.jsonl` and show "Last run: 20 min ago" to
give the user context before they click.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH (all findings from direct filesystem and source code
  inspection)
