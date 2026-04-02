# Findings: Governance & Audits Tab — CLI Handoff Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Scope:** Tab 5 (Governance & Audits) — CLI command inventory, clipboard
strings, duration estimates, gap analysis, TDMS integration flow

---

## 1. CLI Command Inventory

Every audit trigger command with exact syntax, sourced directly from SKILL.md
invocation declarations.

### 1A: Ecosystem Audit Suite (8 individual + 1 orchestrator)

| Audit                 | Invocation                       | Script Equivalent                                                                    | Output File                                  |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| Comprehensive (all 8) | `/comprehensive-ecosystem-audit` | Orchestrates all below                                                               | `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`    |
| Hook                  | `/hook-ecosystem-audit`          | `node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js`       | `.claude/tmp/hook-audit-report-{date}.md`    |
| Session               | `/session-ecosystem-audit`       | `node .claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js` | `.claude/tmp/session-audit-report-{date}.md` |
| TDMS                  | `/tdms-ecosystem-audit`          | `node .claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js`       | `.claude/tmp/tdms-audit-report-{date}.md`    |
| PR                    | `/pr-ecosystem-audit`            | `node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js`           | `.claude/tmp/pr-audit-report-{date}.md`      |
| Health                | `/health-ecosystem-audit`        | `node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js`   | `.claude/tmp/health-audit-report-{date}.md`  |
| Skill                 | `/skill-ecosystem-audit`         | `node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js`     | `.claude/tmp/skill-audit-report-{date}.md`   |
| Doc                   | `/doc-ecosystem-audit`           | `node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js`         | `.claude/tmp/doc-audit-report-{date}.md`     |
| Script                | `/script-ecosystem-audit`        | `node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js`   | `.claude/tmp/script-audit-report-{date}.md`  |

### 1B: Agent Quality Audit (separate hybrid skill)

| Audit                      | Invocation                              | Scope Flags          | Output Dir                                               |
| -------------------------- | --------------------------------------- | -------------------- | -------------------------------------------------------- |
| Agent quality (all)        | `/audit-agent-quality`                  | —                    | `docs/audits/single-session/agent-quality/audit-{date}/` |
| Agent quality (GSD only)   | `/audit-agent-quality --scope gsd`      | GSD framework agents | same                                                     |
| Agent quality (stubs only) | `/audit-agent-quality --scope stubs`    | Stub agents          | same                                                     |
| Agent quality (priority)   | `/audit-agent-quality --scope priority` | High-priority agents | same                                                     |

### 1C: Batch Mode Commands (non-interactive, for orchestration)

These are the commands used by `/comprehensive-ecosystem-audit` Stage 1/2
agents. They are not intended for direct user invocation but are relevant for
understanding what the dashboard is measuring when it shows "last run":

```bash
# Stage 1 (run in parallel)
node .claude/skills/hook-ecosystem-audit/scripts/run-hook-ecosystem-audit.js --batch --summary
node .claude/skills/session-ecosystem-audit/scripts/run-session-ecosystem-audit.js --batch --summary
node .claude/skills/tdms-ecosystem-audit/scripts/run-tdms-ecosystem-audit.js --batch --summary
node .claude/skills/pr-ecosystem-audit/scripts/run-pr-ecosystem-audit.js --batch --summary
node .claude/skills/health-ecosystem-audit/scripts/run-health-ecosystem-audit.js --batch --summary --skip-live-tests

# Stage 2 (run in parallel after Stage 1)
node .claude/skills/skill-ecosystem-audit/scripts/run-skill-ecosystem-audit.js --batch --summary
node .claude/skills/doc-ecosystem-audit/scripts/run-doc-ecosystem-audit.js --batch --summary
node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js --batch --summary
```

---

## 2. Clipboard Command Strings

Exact strings to copy into the Claude Code input box. These are the "Run" button
payloads for the dashboard.

| Button Label                | Clipboard String                 | Notes                                                              |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| **Run all audits**          | `/comprehensive-ecosystem-audit` | Orchestrates 8 audits in 2 staged waves, 30 min                    |
| **Run hook audit**          | `/hook-ecosystem-audit`          | 15–30 min interactive                                              |
| **Run session audit**       | `/session-ecosystem-audit`       | 15–30 min interactive (estimated, see §3)                          |
| **Run TDMS audit**          | `/tdms-ecosystem-audit`          | 15–30 min interactive (estimated, see §3)                          |
| **Run PR audit**            | `/pr-ecosystem-audit`            | 15–30 min interactive (estimated, see §3)                          |
| **Run health audit**        | `/health-ecosystem-audit`        | 15–30 min interactive                                              |
| **Run skill audit**         | `/skill-ecosystem-audit`         | 15–30 min interactive (estimated, see §3)                          |
| **Run doc audit**           | `/doc-ecosystem-audit`           | 15–30 min interactive (estimated, see §3)                          |
| **Run script audit**        | `/script-ecosystem-audit`        | 15–30 min interactive (estimated, see §3)                          |
| **Run agent quality audit** | `/audit-agent-quality`           | ~70–100 min (Stage 1 ~5 min + Stage 2 ~60–90 min + Stage 3 ~5 min) |

---

## 3. Estimated Durations Per Audit

### 3A: Source Data

Durations sourced from SKILL.md frontmatter (`estimated_time_parallel` /
`estimated_time_sequential`) and inline warm-up text. Skills without frontmatter
fields were sourced from inline text in Phase warm-up sections.

| Audit Skill                      | Duration (User-Facing) | Parallel | Sequential | Source                                  |
| -------------------------------- | ---------------------- | -------- | ---------- | --------------------------------------- |
| `/comprehensive-ecosystem-audit` | ~30 min                | 30 min   | 90 min     | SKILL.md frontmatter                    |
| `/hook-ecosystem-audit`          | ~15–30 min             | —        | 15–30 min  | SKILL.md Phase warm-up                  |
| `/health-ecosystem-audit`        | ~15–30 min             | —        | 15–30 min  | SKILL.md warm-up text                   |
| `/skill-ecosystem-audit`         | ~15–30 min             | —        | estimated  | No explicit time in SKILL.md (see §3B)  |
| `/doc-ecosystem-audit`           | ~15–30 min             | —        | estimated  | No explicit time in SKILL.md (see §3B)  |
| `/pr-ecosystem-audit`            | ~15–30 min             | —        | estimated  | No explicit time in SKILL.md (see §3B)  |
| `/session-ecosystem-audit`       | ~15–30 min             | —        | estimated  | No explicit time in SKILL.md (see §3B)  |
| `/tdms-ecosystem-audit`          | ~15–30 min             | —        | estimated  | No explicit time in SKILL.md (see §3B)  |
| `/script-ecosystem-audit`        | ~15–30 min             | —        | estimated  | No explicit time in SKILL.md (see §3B)  |
| `/audit-agent-quality`           | ~70–100 min            | ~70 min  | ~100 min   | SKILL.md warm-up text (Stage breakdown) |

### 3B: Gap — 6 of 9 Skills Have No Explicit Duration

Only `comprehensive-ecosystem-audit` (frontmatter), `hook-ecosystem-audit`
(Phase warm-up), and `health-ecosystem-audit` (Phase warm-up) have explicit
duration estimates. The other 6 ecosystem audit SKILL.md files contain no
`estimated_time` frontmatter or warm-up text with times. The shared SKILL.md for
`script-ecosystem-audit` has `--summary` mode but no duration.

**Recommendation for dashboard:** Use "~15–30 min" uniformly for all 8
individual audits. This is consistent with the two confirmed estimates and
reflects the shared finding-walkthrough architecture (which is the dominant time
factor). Show "~30 min" for comprehensive.

### 3C: Recommended Dashboard Labels

| Button                  | Label       |
| ----------------------- | ----------- |
| Run all audits          | ~30 min     |
| Run hook audit          | ~15–30 min  |
| Run health audit        | ~15–30 min  |
| Run session audit       | ~15–30 min  |
| Run TDMS audit          | ~15–30 min  |
| Run PR audit            | ~15–30 min  |
| Run skill audit         | ~15–30 min  |
| Run doc audit           | ~15–30 min  |
| Run script audit        | ~15–30 min  |
| Run agent quality audit | ~70–100 min |

---

## 4. Gap Analysis — Governance Actions Without CLI Commands

### 4A: Actions That Have CLI Commands

All 8 ecosystem audits and the agent quality audit have direct `/skill-name`
invocations. The comprehensive orchestrator covers all 8 in one command.

### 4B: Governance Actions With No CLI Command

| Action                                  | Gap Description                                                                                                                                    | Workaround                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **View last audit report**              | No CLI to display a saved `.claude/tmp/*-audit-report-{date}.md`; report is written but there is no `/show-last-audit-report` command              | Dashboard must read the history JSONL directly — not the report file                                              |
| **Schedule recurring audit**            | No scheduling CLI; audits are 100% manual on-demand                                                                                                | Dashboard "Last Run" staleness warning is the only nudge mechanism                                                |
| **Resume a paused audit**               | No explicit resume command; the skill auto-detects its own progress file on next invocation (same command re-invoked)                              | Re-invoke same command; compaction guard handles resume automatically                                             |
| **Clear audit progress**                | No `/clear-audit-progress` command; stale progress files persist for 2 hours then are ignored                                                      | Manual deletion of `.claude/tmp/*-audit-progress.json`                                                            |
| **Dismiss/acknowledge a stale warning** | No command to mark "I know this audit is stale, suppress warning"                                                                                  | Not implementable without a new command or state file entry                                                       |
| **View all deferred findings**          | No command to list all DEBT entries created by audits; TDMS pipeline stores them but no audit-specific view exists                                 | Query MASTER_DEBT.jsonl filtered by `source_id` prefix `review:*-ecosystem-audit-*`                               |
| **Force non-interactive audit**         | Scripts support `--batch --summary` flags but these are not exposed as user-facing commands; they are internal to `/comprehensive-ecosystem-audit` | Use node script directly with flags (not a skill invocation)                                                      |
| **Audit-specific TDMS view**            | No `/tdms-ecosystem-audit-deferred` or similar command to surface audit findings in TDMS                                                           | Query MASTER_DEBT.jsonl (see §5)                                                                                  |
| **Compare two audit runs**              | No diff/compare command between run N and run N-1                                                                                                  | Trend report within `/hook-ecosystem-audit` (Phase 7) covers single-skill trends; no cross-run comparison command |

### 4C: Notable Governance Gap — No "Audit All Findings" View

There is no command that surfaces "all currently-open audit findings across all
8 audits." The `/comprehensive-ecosystem-audit` report is a point-in-time
document that gets overwritten each run and contains a Top 20 ranking, but the
underlying findings are not stored in a queryable persistent format. Each
individual audit's `.claude/tmp/*-session-{date}.jsonl` contains per-run
decisions, but these are ephemeral (session-only, deleted on completion).

**Dashboard implication:** The dashboard can display "Last score per audit from
history JSONL" but cannot reconstruct "all open findings" without re-running the
audit. The only persistent finding proxy is MASTER_DEBT.jsonl entries with
`source_id` starting with `review:`.

---

## 5. TDMS Integration — How Deferred Audit Findings Flow to MASTER_DEBT.jsonl

### 5A: The Standard Path (All 8 Ecosystem Audits)

All 8 ecosystem audit skills use identical TDMS integration, defined in
`.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md` and
`CRITICAL_RULES.md`:

**Step 1: User defers a finding during walkthrough**

During Phase 3 (finding-by-finding walkthrough), when the user chooses "Defer"
for a finding, the skill immediately calls `/add-debt`:

```
/add-debt
  severity: S1  (for ERROR severity findings)
             S2  (for WARNING severity findings)
  category: engineering-productivity
  source_id: review:{audit-name}-ecosystem-audit-{YYYY-MM-DD}
```

Example source_id values:

- `review:hook-ecosystem-audit-2026-03-29`
- `review:doc-ecosystem-audit-2026-03-29`
- `review:tdms-ecosystem-audit-2026-03-29`

**Step 2: `/add-debt` runs intake-manual.js**

The `/add-debt` skill calls `scripts/debt/intake-manual.js`, which:

1. Creates a DEBT-XXXX entry with the supplied fields
2. Writes atomically to both `docs/technical-debt/MASTER_DEBT.jsonl` and
   `docs/technical-debt/raw/deduped.jsonl` (using `appendMasterDebtSync`)
3. Runs duplicate detection (content-hash dedup)

**Step 3: View and metrics regeneration**

After intake, `/add-debt` triggers:

```bash
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

This regenerates the views in `docs/technical-debt/views/*.md` and updates
`METRICS.md`.

**Step 4: Summary shown at Phase 4**

At the end of the audit (Phase 4: Summary), the skill displays a "TDMS Batch
Summary" listing all DEBT entries created during that run:

```
TDMS Batch Summary:
  - DEBT-XXXX: {finding title} (S1)
  - DEBT-YYYY: {finding title} (S2)
```

### 5B: The Agent Quality Audit Path (Different)

`/audit-agent-quality` uses a bulk TDMS intake path that bypasses `/add-debt`:

```bash
node scripts/debt/validate-schema.js AUDIT_DIR/all-findings-deduped.jsonl
node scripts/debt/intake-audit.js AUDIT_DIR/all-findings-deduped.jsonl --source "audit-agent-quality-$(date +%Y-%m-%d)"
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

This writes all findings as a batch using `intake-audit.js` (not
`intake-manual.js`). The source ID format is `audit-agent-quality-{date}` (no
`review:` prefix — different from ecosystem audits).

### 5C: Querying Audit-Originated DEBT Items

To find all DEBT entries created by ecosystem audits, filter MASTER_DEBT.jsonl
by source_id:

```bash
# All ecosystem audit deferred findings
grep '"source_id": "review:' docs/technical-debt/MASTER_DEBT.jsonl

# Hook audit specifically
grep '"source_id": "review:hook-ecosystem-audit' docs/technical-debt/MASTER_DEBT.jsonl

# Agent quality audit
grep '"source_id": "audit-agent-quality' docs/technical-debt/MASTER_DEBT.jsonl
```

### 5D: What the Dashboard Can Show About TDMS Flow

| Signal                                   | Data Source                                        | Update Mechanism                                |
| ---------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Count of audit-deferred items (lifetime) | `MASTER_DEBT.jsonl` filtered by `source_id` prefix | Updates each time an audit runs and user defers |
| Count by audit type                      | `MASTER_DEBT.jsonl` grouped by `source_id`         | Same                                            |
| Deferred item resolution rate            | Cross-reference MASTER_DEBT status vs source_id    | Requires TDMS tab data join                     |
| Recent deferrals (last audit run)        | MASTER_DEBT.jsonl filtered by date + source_id     | Available after each audit                      |

---

## 6. Comprehensive Audit State Deletion Note

The checkpoint file (`CHECKPOINT-tab-decisions.md`) flagged:
"comprehensive-ecosystem-audit deletes JSON at run end."

This is confirmed from SKILL.md Stage 3 (Cleanup section): After aggregation,
`/comprehensive-ecosystem-audit` deletes all 8 `ecosystem-{name}-result.json`
files and the progress file. The individual `-audit-report-{date}.md` temp files
also get cleaned up.

**Dashboard implication:** The only persistent record of a comprehensive audit
run is the 8 individual `*-ecosystem-audit-history.jsonl` files. The aggregated
`COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` written to the project root is the
human-readable artifact, but it is overwritten each run. The history files are
the stable data source.

---

## Sources

| #   | Path                                                                | Type       | Trust | Date              |
| --- | ------------------------------------------------------------------- | ---------- | ----- | ----------------- |
| 1   | `.claude/skills/comprehensive-ecosystem-audit/SKILL.md`             | filesystem | HIGH  | 2026-02-24 (v1.2) |
| 2   | `.claude/skills/hook-ecosystem-audit/SKILL.md`                      | filesystem | HIGH  | 2026-03-08 (v2.0) |
| 3   | `.claude/skills/doc-ecosystem-audit/SKILL.md`                       | filesystem | HIGH  | 2026-02-24 (v1.0) |
| 4   | `.claude/skills/skill-ecosystem-audit/SKILL.md`                     | filesystem | HIGH  | 2026-02-24 (v1.0) |
| 5   | `.claude/skills/tdms-ecosystem-audit/SKILL.md`                      | filesystem | HIGH  | 2026-02-23 (v1.0) |
| 6   | `.claude/skills/health-ecosystem-audit/SKILL.md`                    | filesystem | HIGH  | 2026-03-10 (v1.0) |
| 7   | `.claude/skills/pr-ecosystem-audit/SKILL.md`                        | filesystem | HIGH  | 2026-02-24 (v1.2) |
| 8   | `.claude/skills/session-ecosystem-audit/SKILL.md`                   | filesystem | HIGH  | 2026-02-23 (v1.0) |
| 9   | `.claude/skills/script-ecosystem-audit/SKILL.md`                    | filesystem | HIGH  | 2026-03-08 (v2.0) |
| 10  | `.claude/skills/audit-agent-quality/SKILL.md`                       | filesystem | HIGH  | 2026-03-17 (v1.2) |
| 11  | `.claude/skills/_shared/ecosystem-audit/FINDING_WALKTHROUGH.md`     | filesystem | HIGH  | 2026-03-25 (v1.0) |
| 12  | `.claude/skills/_shared/ecosystem-audit/CRITICAL_RULES.md`          | filesystem | HIGH  | 2026-03-25 (v1.0) |
| 13  | `.claude/skills/_shared/ecosystem-audit/CLOSURE_AND_GUARDRAILS.md`  | filesystem | HIGH  | 2026-03-25 (v1.0) |
| 14  | `.claude/skills/_shared/ecosystem-audit/SUMMARY_AND_TRENDS.md`      | filesystem | HIGH  | 2026-03-25 (v1.0) |
| 15  | `.claude/skills/add-debt/SKILL.md`                                  | filesystem | HIGH  | current           |
| 16  | `.research/dev-dashboard/findings/SQ1a-2-ecosystem-audit-skills.md` | findings   | HIGH  | 2026-03-29        |
| 17  | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md`      | findings   | HIGH  | 2026-03-29        |

---

## Contradictions

**None found.** The `/add-debt` skill and the shared `FINDING_WALKTHROUGH.md`
are consistent on TDMS integration: `intake-manual.js` via `/add-debt` for
individual deferrals; `intake-audit.js` directly for bulk audit-agent-quality
findings. Source ID naming conventions differ between the two paths (confirmed
from both skill files).

---

## Gaps

1. **Duration estimates absent for 6 of 9 skills.** `doc-ecosystem-audit`,
   `skill-ecosystem-audit`, `pr-ecosystem-audit`, `session-ecosystem-audit`,
   `tdms-ecosystem-audit`, and `script-ecosystem-audit` SKILL.md files contain
   no warm-up time estimate. The uniform "~15–30 min" recommendation above is
   inferred from the two confirmed estimates (hook and health) that share the
   same architecture. [CONFIDENCE: MEDIUM — architecture match is HIGH, but
   specific skill data varies by finding count]

2. **No resume command documented.** Re-invoking the same skill name is the
   resume mechanism (compaction guard reads progress file automatically), but
   this is implicit. The dashboard cannot distinguish "first run" from "resume"
   without reading the progress file. No documented command like
   `/hook-ecosystem-audit --resume`.

3. **No persistent open-findings list.** Session decision logs
   (`.claude/tmp/*-session-{date}.jsonl`) are ephemeral. Deferred items persist
   only if user explicitly chose "Defer" (creating a DEBT entry). Fixed and
   skipped findings disappear at session end. The dashboard cannot show "N
   findings remain unfixed" without re-running the audit.

4. **Agent quality audit TDMS source_id format differs.** Ecosystem audits use
   `review:{name}-ecosystem-audit-{date}`; agent quality uses
   `audit-agent-quality-{date}`. No `review:` prefix. A dashboard query
   filtering by `"source_id": "review:"` will miss agent quality deferrals. Both
   patterns are verified from the respective SKILL.md files.

5. **Comprehensive audit report is overwritten.**
   `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` at project root is a single file
   overwritten each run — not a time series. History JSONL files are the correct
   source for dashboard trend data.

---

## Serendipity

- The `--batch --summary` flags on each individual audit script enable
  non-interactive programmatic runs. This means a future "Run all
  (non-interactive)" dashboard button could execute each audit script directly
  without the full conversational walkthrough — producing score-only JSON output
  in parallel, completing in minutes rather than the full 30 min. The
  comprehensive skill already does this internally.

- The `script-ecosystem-audit` has a unique `--save-baseline` flag that
  snapshots current scores as a regression reference. No other ecosystem audit
  has this feature. Dashboard implication: the script audit could support a "Set
  baseline" button that the others cannot.

- The `source_id` field in MASTER_DEBT.jsonl is the only traceable link from a
  debt item back to the audit that generated it. This makes it possible to build
  a "Deferred findings" panel for Tab 5 without any new infrastructure — just
  filter MASTER_DEBT.jsonl by `source_id` prefix patterns.

- `/audit-agent-quality` is the only audit that runs a behavioral
  (invoke-and-evaluate) testing protocol on improved agents (Stage 2.5). This is
  qualitatively different from the ecosystem audits, which run static analysis
  scripts. Duration (~70–100 min) reflects this fundamentally heavier workload.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All command strings, TDMS flow steps, and duration estimates are verified
directly from SKILL.md files. Duration gaps for 6 skills are clearly flagged as
estimates.
