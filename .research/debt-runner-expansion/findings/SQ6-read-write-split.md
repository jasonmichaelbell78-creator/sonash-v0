# Findings: Capability Assignment Matrix — Web vs. CLI Tier

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-006

---

## Overview

The hybrid architecture places two tiers in distinct roles:

- **CLI (`/debt-runner`)**: AI-powered orchestration, script execution, mutation
  pipelines, agent spawning, convergence-loop verification. Operates on the
  filesystem directly. Writes to staging files, then to MASTER_DEBT via scripts.
- **Web (`/dev/debt`)**: Read-only visualization, browsing, dashboards, trend
  charts, full-text search, drill-down, comparison. No mutations. Human-readable
  presentation of data that the CLI produces.

The assignment logic for every capability follows from these first principles:

1. **Anything that writes to MASTER_DEBT → CLI only.** The CLI owns all mutation
   paths via staging + existing scripts. The web has no write access.
2. **Anything that spawns agents or runs Node.js scripts → CLI only.** Agent
   coordination, convergence-loop integration, and script orchestration are
   Claude-session activities, not browser activities.
3. **Anything that benefits from interactive charts, trend lines, filters, or
   side-by-side comparison → Web (primary) or BOTH.** The web tier's value is
   its ability to render rich, navigable views that a terminal cannot.
4. **Anything that bridges the two tiers** (e.g., "view in web, then generate
   CLI command to act on it") belongs to BOTH with a clear handoff mechanism.

---

## Key Findings

### 1. Existing Modes — Assignment [CONFIDENCE: HIGH]

Each of the 7 current debt-runner modes maps cleanly to CLI-ONLY because they
are all mutation pipelines or AI verification workflows.

**Summary table:**

| Mode     | Assignment | Rationale                                                                                                                                            |
| -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| verify   | CLI-ONLY   | Spawns CL agents to check codebase accuracy; writes corrections to staging; runs resolve-bulk.js                                                     |
| sync     | CLI-ONLY   | Calls sync-sonarcloud.js (live API fetch + write); requires SONAR_TOKEN; mutations go to staging                                                     |
| plan     | CLI-ONLY   | AI-generates resolution plan JSONL + markdown; requires file write; CL verification                                                                  |
| health   | BOTH       | CLI runs generate-metrics.js + debt-health.js and prints text dashboard; Web renders the same metrics.json as visual cards, trend charts, sparklines |
| dedup    | CLI-ONLY   | Runs dedup-multi-pass.js with staged merge decisions; requires user per-cluster decisions; writes to staging                                         |
| validate | CLI-ONLY   | Runs validate-schema.js + verify-resolutions.js; writes fixes to staging                                                                             |
| cleanup  | CLI-ONLY   | Archives resolved items, clears FPs, regenerates views; all mutations via scripts                                                                    |

**Detailed rationale for BOTH assignment (health):**

- CLI side: Executes `generate-metrics.js` and `debt-health.js`, computes fresh
  metrics, displays text dashboard with severity breakdown, trend indicators,
  stale count, top categories. Required for mutation pipeline contexts (e.g.,
  "what changed after cleanup?"). Also triggers CL quick preset for count-match
  verification.
- Web side: Reads `docs/technical-debt/metrics.json` and
  `docs/technical-debt/logs/metrics-log.jsonl` to render: metric cards
  (S0/S1/S2/S3 counts), resolution velocity chart (items resolved vs added per
  week), severity distribution donut/bar chart, stale item aging histogram, top
  category breakdown chart, trend sparklines for each metric over time. Web adds
  value the CLI text dashboard cannot provide.
- Handoff: Web can surface "Last metrics computed: 3 days ago. Run
  `debt-runner health` to refresh."

---

### 2. Proposed New Modes — Assignment [CONFIDENCE: HIGH]

| Mode          | Assignment | Rationale                                                                                                                                                                                                                                                                                                                     |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| intake        | CLI-ONLY   | Surfaces disconnected sources (26 gap categories from SQ8a); runs discovery scripts; routes new items through intake scripts to staging; requires agent spawning for AI-enhanced intake                                                                                                                                       |
| sources       | BOTH       | CLI runs source health checks (connectivity to SonarCloud API, script exit codes, last-sync dates); Web renders source health dashboard with status indicators, last-run timestamps, item counts per source, failure alerts                                                                                                   |
| roadmap       | BOTH       | CLI runs reconcile-roadmap.js + sync-roadmap-refs.js and presents alignment gaps for user decisions; Web renders ROADMAP alignment view showing which debt items block which milestones, with clickable links between items and roadmap entries                                                                               |
| triage        | CLI-ONLY   | Processes verification queue (2,125 NEW-status items) via CL-verified agent review; interactive per-item decisions (confirm/resolve/FP/escalate); requires agent spawning and staging writes                                                                                                                                  |
| review-needed | CLI-ONLY   | Processes raw/review-needed.jsonl (uncertain dedup pairs from dedup-multi-pass.js); requires per-pair user decisions; writes approved merges to staging and applies via dedup-multi-pass.js --force                                                                                                                           |
| dark-debt     | BOTH       | CLI spawns discovery agents to scan shadow stores (extract-scattered-debt.js, code-reviewer outputs, gh-fix-ci residuals, pattern compliance GitHub Issues, Semgrep/CodeQL, npm audit); Web shows dark debt source map dashboard indicating which stores are connected vs. disconnected, with item counts and last-scan dates |

**Detailed rationale for BOTH assignments:**

**sources:**

- CLI: Executes connectivity checks, runs `sync-sonarcloud.js --dry-run` to test
  API reach, checks for `SONAR_TOKEN` availability, reads
  `docs/technical-debt/logs/intake-log.jsonl` for last-sync timestamps. Reports
  pass/fail per source with actionable remediation hints.
- Web: Source health dashboard with status badges (green/yellow/red), timeline
  of last successful syncs, item contribution bar chart per source (sonarcloud:
  2,561, audit: 2,942, etc.), alert when any source is >14 days stale. Read-only
  view of the same source metadata the CLI checks.

**roadmap:**

- CLI: Runs `reconcile-roadmap.js --write` and `sync-roadmap-refs.js`; presents
  debt items that lack roadmap refs, roadmap milestones that lack linked debt
  items, and orphaned DEBT IDs in plan files. Interactive confirmation before
  writing. CL standard preset to verify alignment claims.
- Web: Visual alignment map linking debt items to roadmap phases. Clickable grid
  view: rows = roadmap milestones, columns = severity tiers. Each cell shows
  count of linked debt items. Click into cell to browse items. Also shows
  "unlinked debt" as a separate swim lane.

**dark-debt:**

- CLI: Spawns agent(s) to scan shadow stores; produces a gap report; offers
  per-source "integrate now / defer / suppress" decisions; routes approved items
  through intake scripts. The AI judgment needed to classify whether a code
  comment represents debt belongs in the CLI agent layer.
- Web: Dark debt visibility panel showing each shadow store as a tile:
  "code-reviewer findings: 0 connected (GAP)", "GitHub pattern issues: 47
  disconnected", "npm audit: not synced", etc. Pure read-only coverage map. No
  remediation from web — clicking a tile shows CLI command to fix it.

---

### 3. New Capabilities — Assignment [CONFIDENCE: HIGH]

| Capability                              | Assignment                          | Rationale                                                                                                                                                                                                       |
| --------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trend visualization                     | WEB-ONLY                            | Time-series charts require rendering engine; metrics-log.jsonl has the data; terminal cannot render charts meaningfully                                                                                         |
| Source health dashboard                 | WEB (primary) + CLI (status check)  | Web renders visual dashboard; CLI has the sources mode health-check; overlaps with "sources" mode                                                                                                               |
| Severity distribution chart             | WEB-ONLY                            | Donut/bar chart of S0-S3 distribution over time; terminal can print counts but not trend charts                                                                                                                 |
| Resolution velocity tracking            | WEB-ONLY                            | Chart of items resolved vs. added per sprint/week; requires time-series rendering from metrics-log.jsonl                                                                                                        |
| Full-text search across items           | WEB-ONLY                            | Browser-based search across MASTER_DEBT content (title, file path, category, description); instant filter without CLI invocation                                                                                |
| Item detail drill-down                  | WEB-ONLY                            | Click a debt item to see full record, file path link, resolution history, linked PR, roadmap ref; requires hyperlink-capable rendering                                                                          |
| Export (CSV, JSONL)                     | WEB-ONLY                            | Download filtered/searched result sets as CSV or JSONL; CLI already has MASTER_DEBT.jsonl natively so export is a web-tier convenience                                                                          |
| Bookmarking / annotation                | WEB-ONLY                            | Save custom views, mark items for follow-up, add notes; requires persistent user-session state in the web tier                                                                                                  |
| CLI handoff (generate commands)         | WEB-ONLY (output) + CLI (execution) | Web generates a `debt-runner` invocation string pre-filtered to current web view (e.g., "debt-runner triage --severity S0,S1 --ids DEBT-0042,DEBT-0099"); user copies and runs in terminal                      |
| Discovery agents (7 types)              | CLI-ONLY                            | code-scanner, pattern-checker, security-scanner, dependency-auditor, complexity-scanner, test-coverage-auditor, schema-drift-checker; all require file I/O, agent spawning, AI reasoning; cannot run in browser |
| Bulk operations                         | CLI-ONLY                            | Bulk resolve, bulk reclassify, bulk archive; all require staging + script pipeline; mutations belong to CLI                                                                                                     |
| Saved filter presets                    | WEB-ONLY                            | Persist named filter combinations (e.g., "S0 unverified security items"); browser-side persistent state; the CLI has --severity flag but no named preset concept                                                |
| Comparison views (session-over-session) | WEB-ONLY                            | Side-by-side diff of two metrics snapshots from metrics-log.jsonl; "last week vs. this week" severity breakdown; requires rendered comparison layout                                                            |

---

### 4. WEB-ONLY Capabilities (Exhaustive List) [CONFIDENCE: HIGH]

These capabilities only make sense in the web tier. They rely on rendering,
interactivity, or persistent browser state that a terminal cannot provide:

1. **Trend visualization** — Time-series charts for every metric in
   metrics-log.jsonl. Severity over time, resolution rate curve, net flow (added
   minus resolved) per week.

2. **Severity distribution chart** — Donut or stacked bar showing current
   S0/S1/S2/S3 breakdown. Animated on filter change.

3. **Resolution velocity tracking** — Chart of items resolved vs. items added
   per sprint (7-day or 14-day rolling window). Shows whether debt is growing or
   shrinking.

4. **Full-text search** — Client-side (or server-side with SQLite per SQ1a)
   search across all 8,470+ items. Filter by severity, category, source, status,
   file path, date range simultaneously.

5. **Item detail drill-down** — Click any item in any list or chart to open a
   detail panel: full JSONL record, file path as a link, resolution history,
   linked PR number, roadmap reference. Impossible in terminal.

6. **Export (CSV, JSONL)** — Download button for current filtered/searched
   result set. Users can pull data into spreadsheets or other tools. Not
   meaningful on CLI where MASTER_DEBT.jsonl is already directly accessible.

7. **Bookmarking / annotation** — User can star specific items, tag them with
   custom labels, add session notes. Requires persistent web-session state
   (localStorage or server-side). CLI has no concept of user-level annotations
   on items.

8. **Saved filter presets** — Named, saveable filter combinations. "My S0
   watchlist", "Auth module debt", "Sprint 47 targets". The CLI --severity and
   --ids flags achieve similar scoping but cannot be named and persisted.

9. **Comparison views** — Side-by-side snapshot comparison between any two dates
   in metrics-log.jsonl. Shows delta counts per severity, category shifts,
   resolution rate changes. A web-tier differentiator.

10. **CLI handoff output** — The web generates a ready-to-run `debt-runner`
    command string pre-populated with the IDs, severity filter, and mode
    matching the current web view. The user copies and pastes into terminal.
    This is web-generated output, not web-executed action.

---

### 5. CLI-ONLY Capabilities (Exhaustive List) [CONFIDENCE: HIGH]

These capabilities require agent spawning, script execution, filesystem writes,
or AI-driven verification that cannot run in a browser:

1. **verify** — CL standard preset; agents read codebase; writes corrections to
   staging/verify-corrections.jsonl; applies via resolve-bulk.js.

2. **sync** — Calls sync-sonarcloud.js with live API; requires SONAR_TOKEN;
   writes to staging and MASTER_DEBT via scripts.

3. **plan** — AI generates resolution JSONL + markdown plan; CL verifies plan
   claims; user approves; writes to docs/technical-debt/plans/.

4. **dedup** — Runs dedup-multi-pass.js dry-run + force; CL verifies merge
   clusters; user decisions per cluster; writes staging/dedup-merges.jsonl;
   applies via dedup-multi-pass.js --force + consolidate-all.js.

5. **validate** — Runs validate-schema.js + verify-resolutions.js; CL verifies
   violations; writes staging/validate-fixes.jsonl; applies fixes.

6. **cleanup** — Archives resolved items; clears FPs; runs sync-deduped.js +
   generate-views.js + generate-metrics.js; all mutations via scripts.

7. **intake** — Surfaces 26 disconnected sources; routes new findings through
   intake scripts; requires agent spawning for AI-enhanced severity
   classification; writes to staging.

8. **triage** — Processes 2,125 NEW-status items via CL-verified agent review;
   interactive per-item decisions; writes staging corrections; applies via
   resolve-bulk.js or validate-schema.js.

9. **review-needed** — Processes raw/review-needed.jsonl dedup candidates;
   per-pair user decisions; applies approved merges.

10. **Discovery agents (all 7 types)** — code-scanner, pattern-checker,
    security-scanner, dependency-auditor, complexity-scanner,
    test-coverage-auditor, schema-drift-checker. All spawn as subagents, write
    JSONL to staging/, return structured output. No browser can spawn Claude
    agents.

11. **Bulk operations** — Bulk resolve, bulk reclassify, bulk archive. All go
    through staging + script pipeline. The web can surface the item list and
    generate the CLI command; the CLI executes it.

12. **Post-mutation sync check** — CL quick preset on MASTER_DEBT vs
    deduped.jsonl after every mutation mode. Internal CLI guardrail with no web
    equivalent.

---

### 6. BOTH Tier — Detailed Handoff Specifications [CONFIDENCE: HIGH]

For capabilities assigned BOTH, the following table clarifies the division of
responsibility and the handoff mechanism:

| Capability | Web Does                                                                                                                    | CLI Does                                                                                                  | Handoff Mechanism                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| health     | Renders metrics.json as visual cards, trend charts, sparklines, severity distribution, aging histogram                      | Runs generate-metrics.js + debt-health.js; computes fresh metrics; prints text dashboard; CL quick preset | Web shows "Last computed: [date]". Refresh button generates: `debt-runner health` command string |
| sources    | Renders source health dashboard: status badges, timeline of syncs, item counts per source, staleness alerts                 | Runs connectivity checks, tests API reachability, reads intake-log.jsonl for last-sync timestamps         | Web shows per-source "Run: `debt-runner sources`" when stale                                     |
| roadmap    | Renders visual alignment map (milestone × severity grid), shows unlinked debt swim lane, links DEBT IDs to ROADMAP sections | Runs reconcile-roadmap.js + sync-roadmap-refs.js; presents alignment gaps; confirms writes; CL preset     | Web shows "roadmap.md last reconciled: [date]. Run: `debt-runner roadmap`"                       |
| dark-debt  | Renders shadow store coverage map: tile per store with status (connected/disconnected/gap), item counts, last scan date     | Spawns discovery agents per shadow store; presents integration decisions; routes approved items to intake | Web shows "N stores disconnected. Run: `debt-runner dark-debt` to investigate"                   |

---

### 7. Architectural Constraint: Why the Web Cannot Write [CONFIDENCE: HIGH]

The SKILL.md Critical Rule #1 is absolute: "Never write MASTER_DEBT.jsonl
directly — all mutations go to staging files in `docs/technical-debt/staging/`."

This rule, combined with the fact that all mutation pipelines require:

- CL (convergence-loop) verification with agent spawning
- User approval gates before applying
- Staged intermediate files
- Script execution via Node.js

...means that the web tier architecturally cannot be a write path. It is a
read-only consumer of the data that the CLI produces.

The one apparent exception — CLI handoff commands generated by the web — is not
a web mutation: the web generates a command string that the user pastes into
their terminal. The CLI then executes it. The web has no direct API access to
MASTER_DEBT.

This constraint is also consistent with the `SQ1b-sync-architecture.md` findings
(SQLite + file-watch sync approach for web), which confirmed that the web tier
reads from a SQLite representation of MASTER_DEBT with no reverse-write path
back.

---

### 8. Capability Assignment Matrix — Complete Reference [CONFIDENCE: HIGH]

```
LEGEND:
  WEB   = Web-only capability
  CLI   = CLI-only capability
  BOTH  = Both tiers with distinct responsibilities
  [W]   = Web does the primary work in BOTH
  [C]   = CLI does the primary work in BOTH

┌─────────────────────────────────────┬──────────────┬──────────────────────────────────────┐
│ Capability                          │ Assignment   │ Primary Constraint / Rationale       │
├─────────────────────────────────────┼──────────────┼──────────────────────────────────────┤
│ EXISTING MODES                      │              │                                      │
│ verify                              │ CLI          │ Agent spawning + mutation pipeline   │
│ sync                                │ CLI          │ External API + write path            │
│ plan                                │ CLI          │ AI generation + file write           │
│ health                              │ BOTH [C→W]   │ CLI computes; Web visualizes         │
│ dedup                               │ CLI          │ Merge decisions + mutation pipeline  │
│ validate                            │ CLI          │ Schema checks + mutation pipeline    │
│ cleanup                             │ CLI          │ Archive/FP clearing + regeneration   │
├─────────────────────────────────────┼──────────────┼──────────────────────────────────────┤
│ PROPOSED NEW MODES                  │              │                                      │
│ intake                              │ CLI          │ Discovery agents + intake scripts    │
│ sources                             │ BOTH [C→W]   │ CLI checks; Web shows status tiles   │
│ roadmap                             │ BOTH [C→W]   │ CLI reconciles; Web maps alignment   │
│ triage                              │ CLI          │ CL agents + per-item interactive     │
│ review-needed                       │ CLI          │ Per-pair merge decisions + writes    │
│ dark-debt                           │ BOTH [C→W]   │ CLI discovers; Web shows gap map     │
├─────────────────────────────────────┼──────────────┼──────────────────────────────────────┤
│ NEW CAPABILITIES                    │              │                                      │
│ Trend visualization                 │ WEB          │ Chart rendering; terminal can't      │
│ Source health dashboard             │ WEB (+CLI)   │ Visual dashboard; CLI feeds data     │
│ Severity distribution chart         │ WEB          │ Chart rendering                      │
│ Resolution velocity tracking        │ WEB          │ Time-series chart; metrics-log.jsonl │
│ Full-text search across items       │ WEB          │ Browser filter; 8,470+ items         │
│ Item detail drill-down              │ WEB          │ Hyperlinks, detail panels            │
│ Export (CSV, JSONL)                 │ WEB          │ Download; CLI has files natively     │
│ Bookmarking / annotation            │ WEB          │ Persistent user-session state        │
│ CLI handoff (generate commands)     │ WEB (output) │ Web generates; CLI executes          │
│ Discovery agents (7 types)          │ CLI          │ Agent spawning; file I/O; reasoning  │
│ Bulk operations                     │ CLI          │ Staging + script pipeline (writes)   │
│ Saved filter presets                │ WEB          │ Named persistent browser state       │
│ Comparison views (session-over-ses) │ WEB          │ Side-by-side snapshot diff rendering │
└─────────────────────────────────────┴──────────────┴──────────────────────────────────────┘
```

---

### 9. Count Summary by Assignment [CONFIDENCE: HIGH]

Total capabilities assessed: 26

| Assignment                              | Count | Capabilities                                                                                                                                                                                     |
| --------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLI-ONLY                                | 13    | verify, sync, plan, dedup, validate, cleanup, intake, triage, review-needed, discovery agents, bulk operations, (+ post-mutation sync check as internal guardrail)                               |
| WEB-ONLY                                | 9     | Trend visualization, Severity distribution chart, Resolution velocity tracking, Full-text search, Item detail drill-down, Export, Bookmarking/annotation, Saved filter presets, Comparison views |
| BOTH (CLI primary, Web visualizes)      | 4     | health, sources, roadmap, dark-debt                                                                                                                                                              |
| BOTH (Web primary output, CLI executes) | 1     | CLI handoff (generate commands)                                                                                                                                                                  |

The 13 CLI-only capabilities are almost entirely mutation-path or agent-spawning
capabilities. The 9 web-only capabilities are entirely visualization and
interactive browsing capabilities. The 4 BOTH capabilities follow a consistent
"CLI computes → Web renders" pattern, with the CLI driving the data production
and the web adding the visual layer on top.

---

### 10. Notable Asymmetry: Intake Modes Are CLI-Heavy [CONFIDENCE: HIGH]

Of the 6 proposed new modes, 4 are CLI-only (intake, triage, review-needed) or
CLI-primary (dark-debt). Only sources and roadmap have meaningful web presence.

This asymmetry is structural, not accidental. The proposed modes address the 26
intake gaps identified in SQ8a and the 18 defer-path locations from SQ8b — both
of which are write-path problems. They require mutation pipelines to solve. The
web tier can only surface the symptoms (disconnected sources, unprocessed
queues) and generate CLI commands to fix them.

The practical implication: the web's value in the new modes is as a **diagnostic
dashboard** that shows what work needs to be done in the CLI, not as an
execution surface. Each web tile for a new mode should include an estimated "run
time" for the corresponding CLI mode and a ready-to-copy command.

---

## Sources

| #   | Path                                                                      | Type                         | Trust | CRAAP     | Date       |
| --- | ------------------------------------------------------------------------- | ---------------------------- | ----- | --------- | ---------- |
| 1   | `.claude/skills/debt-runner/SKILL.md`                                     | Skill definition (canonical) | HIGH  | 5/5/5/5/5 | 2026-03-15 |
| 2   | `.research/debt-runner-expansion/findings-v1/SQ1-debt-runner-current.md`  | Prior research findings      | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 3   | `.research/debt-runner-expansion/findings-v1/SQ9-interactive-patterns.md` | Prior research findings      | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 4   | `.research/debt-runner-expansion/findings-v1/SQ8a-intake-gaps.md`         | Prior research findings      | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 5   | `.research/debt-runner-expansion/findings-v1/SQ8b-defer-path-audit.md`    | Prior research findings      | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 6   | `.research/debt-runner-expansion/findings-v1/SQ10-discovery-layer.md`     | Prior research findings      | HIGH  | 5/5/5/5/5 | 2026-03-26 |
| 7   | `.research/debt-runner-expansion/findings/SQ1b-sync-architecture.md`      | Prior research findings      | HIGH  | 5/5/5/5/5 | 2026-03-27 |

---

## Contradictions

**None identified.** The web-read/CLI-write split is structurally enforced by
SKILL.md Critical Rule #1 (no direct writes to MASTER_DEBT) and by the
architectural constraint that all mutation pipelines require CL verification
with agent spawning. There is no capability where both the web and CLI would
reasonably compete to be the primary execution surface.

One tension to note (not a contradiction): the `health` mode is assigned BOTH,
but the CLI's text dashboard and the web's visual dashboard overlap in content.
This is intentional — the CLI dashboard serves users who are already in a
debt-runner session and want inline context, while the web dashboard serves
users who want trend analysis and comparison. They serve different use cases
with the same underlying data.

---

## Gaps

1. **Dark debt store enumeration not fully confirmed.** The SQ8a findings
   identified 26 intake gaps, but the exact list of "6 dark debt stores"
   referenced in the spawn prompt was not separately catalogued in the prior
   findings. The dark-debt mode assignment (BOTH) is based on the structural
   pattern of the intake gaps, not a specific enumerated list.

2. **Web architecture for bookmarking/annotation is not designed.** The
   assignment as WEB-ONLY is correct, but the specific persistence mechanism
   (localStorage, SQLite user table, or file-backed annotations) was not
   resolved in this research. See SQ1a for SQLite schema research.

3. **CLI handoff command format not specified.** The concept of the web
   generating ready-to-run CLI commands was assigned WEB (output), but the exact
   format (e.g., does it use --ids with a list? a filter expression? a
   saved-view export?) requires design work not covered by this sub-question.

4. **Comparison views data freshness.** The web comparison view reads from
   metrics-log.jsonl, which is only appended when `generate-metrics.js` runs. If
   debt-runner health is run infrequently, comparison views may lack the
   granularity users expect. This is a data quality dependency, not a
   tier-assignment question.

---

## Serendipity

**The "BOTH" pattern consistently follows one direction: CLI computes, Web
renders.** There is no case where the Web computes something new and the CLI
renders it. This unidirectional dependency simplifies the sync architecture: the
web only needs read access to the files the CLI produces (metrics.json,
metrics-log.jsonl, MASTER_DEBT.jsonl, source logs). No reverse channel is
needed.

**CLI handoff commands are a powerful UX bridge.** By having the web generate
pre-populated `debt-runner` commands that match the current web view, users can
move fluidly from "I see a cluster of S1 auth items in the web" to "I paste this
command into terminal and triage exactly those items." This pattern — web as
discovery surface, CLI as execution surface — is architecturally clean and
preserves all mutation safety guarantees.

**The `sources` mode fills a critical awareness gap.** Of the 26 intake gaps
from SQ8a, the most impactful are the ones that users cannot see without
actively checking (SonarCloud CI not auto-syncing, GitHub Security not
connected, npm audit not tracked). The `sources` mode + web source health
dashboard makes the invisible visible: users see at a glance which intake pipes
are broken without having to run each check manually.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All assignments are derived from direct reading of SKILL.md (the canonical
source) and prior research findings files (all grounded in direct codebase
reads). The architectural constraint (no web writes) is stated explicitly in
SKILL.md Critical Rule #1 and is independently confirmed by the sync
architecture in SQ1b-sync-architecture.md. No training data inference was used.
