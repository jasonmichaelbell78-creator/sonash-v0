# Findings: Remaining Skills — Data Inventory for Dev Dashboard

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question:** Catalog remaining skills not covered by other agents and what
data/output they produce that could surface on a web dashboard.

---

## Methodology

All 14 skill SKILL.md files were read directly from `.claude/skills/`. Each
skill was assessed for:

- Persistent artifacts written to disk
- Output formats (JSONL, JSON, MD, etc.)
- Whether output survives the session
- Dashboard relevance
- Grouping affinity with other skills/systems

---

## Skill Catalog

### 1. `add-debt`

**Purpose:** Add technical debt items (single or batch) to MASTER_DEBT.jsonl
from PR review or ad-hoc discovery.

| Dimension                     | Detail                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | `docs/technical-debt/MASTER_DEBT.jsonl` (appended), `docs/technical-debt/raw/deduped.jsonl` (regenerated), view markdown files (regenerated via `generate-views.js`) |
| **What it represents**        | Individual debt entries: file/line, title, severity (S0-S3), category, effort, source PR, status                                                                     |
| **CLI-only vs persistent**    | Fully persistent — JSONL append is atomic. Views regenerate on disk.                                                                                                 |
| **Web dashboard relevance**   | **HIGH** — MASTER_DEBT.jsonl is the canonical debt store for the whole project. Every debt metric surfaces here. This is the write path for the debt dashboard.      |
| **Natural grouping affinity** | `debt-runner`, `pr-review`, `tdms-ecosystem-audit`, `comprehensive-ecosystem-audit`                                                                                  |

---

### 2. `gh-fix-ci`

**Purpose:** Fetch failing GitHub Actions logs from a PR, summarize failures,
create and implement a fix plan.

| Dimension                     | Detail                                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | No persistent output files defined. Operates via `gh` CLI commands and the bundled `scripts/inspect_pr_checks.py`. Any fix is applied as code changes and committed.                                                    |
| **What it represents**        | CI failure diagnostics — check names, run URLs, log snippets. Ephemeral during session.                                                                                                                                 |
| **CLI-only vs persistent**    | CLI-only — output is conversational and code diffs. No JSONL or state files written.                                                                                                                                    |
| **Web dashboard relevance**   | **LOW** — No persistent data emitted. Dashboard could link to GitHub Actions run URLs, but the skill itself produces no files to surface. Indirect value: GitHub Actions run status is already surfaced via GitHub API. |
| **Natural grouping affinity** | `quick-fix`, `pr-review`, `systematic-debugging`                                                                                                                                                                        |

---

### 3. `quick-fix`

**Purpose:** Auto-suggest and apply fixes for pre-commit/pattern compliance
failures (ESLint, Prettier, TypeScript, pattern violations).

| Dimension                     | Detail                                                                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | No dedicated output files. Runs `npm run lint -- --fix`, stages files, re-runs checks. Side-effects go to modified source files.                                            |
| **What it represents**        | Fix suggestions and auto-fix results for common blocking issues.                                                                                                            |
| **CLI-only vs persistent**    | CLI-only — conversational output only. No JSONL or state files.                                                                                                             |
| **Web dashboard relevance**   | **LOW** — No persistent data produced. However, if pre-commit hook failures were tracked in a JSONL, this skill would reduce that count. Currently no data pipeline to tap. |
| **Natural grouping affinity** | `gh-fix-ci`, `pre-commit-fixer`, `systematic-debugging`                                                                                                                     |

---

### 4. `doc-optimizer`

**Purpose:** 5-wave, 13-agent orchestrator that auto-fixes doc
formatting/headers/links, reports issues as JSONL, and generates enhancement
recommendations.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | `.claude/state/doc-optimizer/` — 13 wave-specific JSONL files (`wave1-format.jsonl`, `wave1-headers.jsonl`, `wave1-external-links.jsonl`, `wave1-accuracy.jsonl`, `wave2-internal-links.jsonl`, `wave2-orphans.jsonl`, `wave2-lifecycle.jsonl`, `wave2-crossrefs.jsonl`, `wave3-coherence.jsonl`, `wave3-structure.jsonl`, `wave4-quality.jsonl`, `wave4-gaps.jsonl`, `wave4-navigation.jsonl`), `all-findings.jsonl` (unified), `SUMMARY_REPORT.md`, `progress.json`. Post-run, temp files are **deleted**; TDMS intake to `MASTER_DEBT.jsonl` persists. |
| **What it represents**        | Documentation health: format/lint issues, broken links, orphaned docs, freshness, quality scores, enhancement opportunities. Each finding has severity, effort, confidence, wave, agent, and `finding_type` (issue vs enhancement).                                                                                                                                                                                                                                                                                                                       |
| **CLI-only vs persistent**    | Partially persistent during run; temp files deleted post-run. Net persistent output: `MASTER_DEBT.jsonl` entries + regenerated `docs/` index. `SUMMARY_REPORT.md` exists briefly then may be discarded.                                                                                                                                                                                                                                                                                                                                                   |
| **Web dashboard relevance**   | **MEDIUM** — The `SUMMARY_REPORT.md` and per-wave finding counts could feed a "Doc Health" panel. Quality scores per document (from `wave4-quality.jsonl`) would make an excellent doc freshness heatmap. The problem: temp files are deleted post-run, so the dashboard would need to capture data before cleanup or read from MASTER_DEBT.                                                                                                                                                                                                              |
| **Natural grouping affinity** | `doc-ecosystem-audit`, `comprehensive-ecosystem-audit`, `audit-documentation`                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

### 5. `find-skills`

**Purpose:** Discovery wizard to help users find installable skills from
skills.sh and plugin marketplaces via `scripts/search-capabilities.js`.

| Dimension                     | Detail                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | No persistent files. Runs `node scripts/search-capabilities.js [query]` and `npx skills find [query]`. Output is conversational.                                                   |
| **What it represents**        | Skills ecosystem discovery — what's installed vs available.                                                                                                                        |
| **CLI-only vs persistent**    | CLI-only — no JSONL or state files written.                                                                                                                                        |
| **Web dashboard relevance**   | **LOW** — No data files produced. A dashboard "Skills Registry" panel would be better fed by `scripts/search-capabilities.js` output or `SKILL_INDEX.md` directly, not this skill. |
| **Natural grouping affinity** | `validate-claude-folder`, `skill-ecosystem-audit`, `skill-creator`                                                                                                                 |

---

### 6. `comprehensive-ecosystem-audit`

**Purpose:** Orchestrates all 8 individual ecosystem audits (hook, session,
TDMS, PR, health, skill, doc, script) in 2 staged waves. Aggregates into a
unified health report with weighted grades.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data produced**             | `.claude/tmp/ecosystem-{name}-result.json` (8 files, per-audit JSON summary with grade/score/counts) — **deleted at cleanup**. `.claude/tmp/comprehensive-ecosystem-audit-progress.json` — **deleted at cleanup**. `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` in project root — **persistent**.                                                         |
| **What it represents**        | System-wide health score across 8 domains: weighted composite grade (A-F), per-domain scores, top 20 priority findings, domain heat map, shared file hotspots, common pattern violations.                                                                                                                                                              |
| **CLI-only vs persistent**    | `COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md` is persistent. Individual JSON results are deleted post-run.                                                                                                                                                                                                                                                 |
| **Web dashboard relevance**   | **HIGH** — The weighted composite health grade and per-domain scores are exactly what an executive health dashboard panel needs. If the per-audit result JSONs were retained (or if individual audits wrote to persistent state), this would be a tier-1 data source. Currently requires parsing the markdown report or retaining JSON before cleanup. |
| **Natural grouping affinity** | All 8 individual ecosystem audits, `data-effectiveness-audit`, health monitoring system                                                                                                                                                                                                                                                                |

---

### 7. `create-audit`

**Purpose:** Interactive wizard for creating new audit infrastructure (skill,
template, output directory, supporting file updates) for any domain. Not an
auditing skill itself — it generates audit skills.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | `.claude/state/task-create-audit-{name}.state.json` (phase/decision/progress state, persistent until cleanup). Generated files: `.claude/skills/audit-{name}/SKILL.md`, `docs/audits/multi-ai/templates/{NAME}_AUDIT.md`, `docs/audits/single-session/{name}/` directory. Invocation tracking via `scripts/reviews/dist/write-invocation.js`. |
| **What it represents**        | Audit creation history and process state. The invocation record feeds `agent-invocations.jsonl`.                                                                                                                                                                                                                                              |
| **CLI-only vs persistent**    | State file is persistent (survives session). Generated skill files are permanent artifacts. Invocation tracked to JSONL.                                                                                                                                                                                                                      |
| **Web dashboard relevance**   | **LOW** — This is a meta-skill (creates other skills). Its invocation count could appear in a "skill creation" metric panel, but it generates no domain data directly. The state file is a session artifact, not dashboard data.                                                                                                              |
| **Natural grouping affinity** | `skill-creator`, `skill-ecosystem-audit`, `validate-claude-folder`                                                                                                                                                                                                                                                                            |

---

### 8. `data-effectiveness-audit`

**Purpose:** Systematic audit of all JSONL/state data systems using lifecycle
scoring (Capture / Storage / Recall / Action, 0-3 each, 0-12 total). Routes gaps
through learning-to-automation pipeline.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data produced**             | `.claude/state/lifecycle-scores.jsonl` (updated scores per system), `.planning/system-wide-standardization/learnings-effectiveness-audit/LIFECYCLE_SCORES.md` (generated dashboard), `.claude/state/learning-routes.jsonl` (gap routing decisions), `.claude/tmp/data-effectiveness-audit-report-{date}.md` (session report). Integration also writes to `MASTER_DEBT.jsonl` for deferred items. |
| **What it represents**        | Per-data-system lifecycle health: are systems write-only? Do they have consumers? Are they enforced? Composite grade and per-dimension scores. Identifies orphaned systems and systems with no rotation policy.                                                                                                                                                                                  |
| **CLI-only vs persistent**    | Fully persistent — `lifecycle-scores.jsonl`, `LIFECYCLE_SCORES.md`, and `learning-routes.jsonl` all survive session. The `.tmp` report is transient.                                                                                                                                                                                                                                             |
| **Web dashboard relevance**   | **HIGH** — `lifecycle-scores.jsonl` is a ready-made per-system health dataset. The generated `LIFECYCLE_SCORES.md` dashboard could be rendered directly. A "Data System Health" panel with per-system grades and composite score would consume this directly. This is one of the cleanest data sources in the project.                                                                           |
| **Natural grouping affinity** | `health-ecosystem-audit`, `comprehensive-ecosystem-audit`, `session-ecosystem-audit`                                                                                                                                                                                                                                                                                                             |

---

### 9. `multi-ai-audit`

**Purpose:** Orchestrates multi-AI consensus audits across 9 categories (code,
security, performance, refactoring, documentation, process,
engineering-productivity, enhancements, ai-optimization). Aggregates findings
from multiple AI sources, normalizes to JSONL, runs TDMS intake.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | `docs/audits/multi-ai/{session-id}/raw/` (pasted AI findings), `docs/audits/multi-ai/{session-id}/canon/` (aggregated per category), `docs/audits/multi-ai/{session-id}/final/` (unified output). `.claude/multi-ai-audit/session-state.json` (progress state). Final flow: `MASTER_DEBT.jsonl` via `intake-audit.js`, roadmap refs via `assign-roadmap-refs.js`. |
| **What it represents**        | Cross-AI consensus on code quality findings across 9 domains. Each finding has severity, category, file, confidence, and source AI attribution.                                                                                                                                                                                                                   |
| **CLI-only vs persistent**    | Fully persistent — session dirs under `docs/audits/multi-ai/` are permanent. State JSON persists across compaction.                                                                                                                                                                                                                                               |
| **Web dashboard relevance**   | **MEDIUM** — The per-session unified JSONL files are rich audit data but not continuously updated (run ad-hoc). A "Audit History" panel showing past multi-AI sessions with finding counts per category would be useful. More relevant as a periodic report than live metrics.                                                                                    |
| **Natural grouping affinity** | `comprehensive-ecosystem-audit`, `add-debt`, `pr-review`, `create-audit`                                                                                                                                                                                                                                                                                          |

---

### 10. `systematic-debugging`

**Purpose:** Structured debugging protocol enforcing root-cause investigation
before fixes. 5-phase process (memory check, root cause, pattern analysis,
hypothesis, implementation).

| Dimension                     | Detail                                                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | No persistent output files. Instructs use of `mcp__plugin_episodic_memory__search` for memory lookups. Any fixes are code changes.                                                                        |
| **What it represents**        | Process enforcement for debugging — no data artifacts.                                                                                                                                                    |
| **CLI-only vs persistent**    | CLI-only — entirely conversational and procedural.                                                                                                                                                        |
| **Web dashboard relevance**   | **LOW** — No data files produced. If debugging sessions were tracked in an invocation JSONL, "debugging session count" or "phases completed" could appear as a metric. Currently no data pipeline exists. |
| **Natural grouping affinity** | `gh-fix-ci`, `quick-fix`, `pre-commit-fixer`                                                                                                                                                              |

---

### 11. `task-next`

**Purpose:** Dependency-aware task selector that reads ROADMAP.md, parses
`[depends: X1, X2]` annotations, builds a DAG, and shows which tasks are ready
vs blocked.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | No persistent output files from the skill itself. Drives `scripts/tasks/resolve-dependencies.js` which outputs to stdout. Modifies `ROADMAP.md` checkboxes when tasks complete.                                                                                                                                                          |
| **What it represents**        | Task dependency resolution state — which ROADMAP tasks are unblocked, blocked, and completed.                                                                                                                                                                                                                                            |
| **CLI-only vs persistent**    | CLI-only for the computed dependency state. ROADMAP.md checkbox updates are persistent (via direct file edit).                                                                                                                                                                                                                           |
| **Web dashboard relevance**   | **MEDIUM** — `ROADMAP.md` is a persistent artifact. A dashboard "Sprint Board" could read ROADMAP.md task status, completion counts, and dependency chains. The `resolve-dependencies.js` script output could be exposed as a JSON endpoint. However the skill itself doesn't write a JSONL — it relies on ROADMAP.md as the data store. |
| **Natural grouping affinity** | `gsd`, `session-start`, `deep-plan`, `pr-review`                                                                                                                                                                                                                                                                                         |

---

### 12. `validate-claude-folder`

**Purpose:** Runs consistency checks on the `.claude/` folder: MCP server
config, hook file presence, skill/command alignment, documentation freshness,
secrets configuration, agent file frontmatter.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | No persistent output files. Produces a conversational summary table.                                                                                                                                                                                                                                    |
| **What it represents**        | Structural integrity of the `.claude/` configuration folder.                                                                                                                                                                                                                                            |
| **CLI-only vs persistent**    | CLI-only — output is a markdown summary table in conversation. No JSONL, no state files.                                                                                                                                                                                                                |
| **Web dashboard relevance**   | **MEDIUM** — The validation checks are well-defined and could be run as a script generating a health JSON. A "Claude Config Health" panel with pass/fail per check (MCP, hooks, skills, docs, secrets, agents) would be dashboardable if output were written to disk. Currently no persistent artifact. |
| **Natural grouping affinity** | `skill-ecosystem-audit`, `hook-ecosystem-audit`, `find-skills`                                                                                                                                                                                                                                          |

---

### 13. `content-research-writer`

**Purpose:** Writing partner for blog posts, articles, tutorials — outlines,
research, citations, feedback, voice preservation.

| Dimension                     | Detail                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data produced**             | User-created files in arbitrary user directories (`~/writing/`). No project-level JSONL or state files. No structured output schema.                 |
| **What it represents**        | Writing workflow assistance — no project metrics.                                                                                                    |
| **CLI-only vs persistent**    | Persistent to user-chosen paths, but outside project structure. No data pipeline.                                                                    |
| **Web dashboard relevance**   | **LOW** — Entirely outside the dev infrastructure domain. No project-relevant data produced. Not applicable to a developer command center dashboard. |
| **Natural grouping affinity** | `deep-research` (external research workflows)                                                                                                        |

---

### 14. `developer-growth-analysis`

**Purpose:** Reads `~/.claude/history.jsonl` (last 24-48h of Claude Code chats),
identifies development patterns and skill gaps, generates a growth report,
curates HackerNews learning resources, and sends the report to Slack DMs.

| Dimension                     | Detail                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data produced**             | Report is sent to Slack DMs and presented conversationally. No project-level JSONL files written. Reads `~/.claude/history.jsonl` (user-level, not project-level).                                                                                                                                                                                                             |
| **What it represents**        | Developer skill gap analysis based on recent chat history — improvement areas, strengths, curated learning resources.                                                                                                                                                                                                                                                          |
| **CLI-only vs persistent**    | The report is ephemeral (Slack message + conversation). Source data (`~/.claude/history.jsonl`) is persistent but user-level, not project-level.                                                                                                                                                                                                                               |
| **Web dashboard relevance**   | **MEDIUM** — Conceptually high relevance (developer growth metrics on a dashboard is compelling), but the current implementation produces no persistent project-level artifact. If the report were written to a project JSONL (`session-growth-report.jsonl`), it would feed a "Developer Growth" panel directly. Currently requires architectural change to be dashboardable. |
| **Natural grouping affinity** | `session-ecosystem-audit`, `session-start`, `session-end`, `pr-review`                                                                                                                                                                                                                                                                                                         |

---

## Summary Table

| Skill                           | Persistent Output                         | Output Format                                 | Dashboard Relevance | Dashboard Panel Affinity                        |
| ------------------------------- | ----------------------------------------- | --------------------------------------------- | ------------------- | ----------------------------------------------- |
| `add-debt`                      | Yes                                       | JSONL (MASTER_DEBT)                           | **HIGH**            | Debt tracking, severity heatmap                 |
| `gh-fix-ci`                     | No                                        | None                                          | **LOW**             | CI status (via GitHub API, not skill)           |
| `quick-fix`                     | No                                        | None                                          | **LOW**             | None currently                                  |
| `doc-optimizer`                 | Partial (deleted post-run, TDMS survives) | JSONL (13 wave files), MD report              | **MEDIUM**          | Doc health scores, freshness heatmap            |
| `find-skills`                   | No                                        | None                                          | **LOW**             | Skills registry (indirect)                      |
| `comprehensive-ecosystem-audit` | Yes (MD report)                           | MD report, temp JSON (deleted)                | **HIGH**            | System health composite grade, domain heat map  |
| `create-audit`                  | Yes (state + generated files)             | JSON state, SKILL.md                          | **LOW**             | Meta-skill, invocation count only               |
| `data-effectiveness-audit`      | Yes                                       | JSONL (lifecycle scores), MD dashboard        | **HIGH**            | Data system health panel, lifecycle scores grid |
| `multi-ai-audit`                | Yes                                       | JSONL (per-session, per-category), state JSON | **MEDIUM**          | Audit history, finding counts per category      |
| `systematic-debugging`          | No                                        | None                                          | **LOW**             | None currently                                  |
| `task-next`                     | Partial (ROADMAP.md edits)                | MD (ROADMAP checkboxes)                       | **MEDIUM**          | Sprint board, unblocked task count              |
| `validate-claude-folder`        | No                                        | None                                          | **MEDIUM**          | Claude config health (if script added)          |
| `content-research-writer`       | User-chosen paths                         | MD (user files)                               | **LOW**             | Not applicable                                  |
| `developer-growth-analysis`     | No (Slack only)                           | MD report to Slack                            | **MEDIUM**          | Developer growth (requires arch change)         |

---

## Key Dashboard-Ready Data Sources (from this set)

### Tier 1 — Already Dashboardable

1. **`MASTER_DEBT.jsonl`** (written by `add-debt`) — debt severity distribution,
   category breakdown, open vs. resolved counts, S0/S1 count alert.
2. **`lifecycle-scores.jsonl`** (written by `data-effectiveness-audit`) —
   per-system health scores with A-F grades, orphan count, unbounded growth
   count.
3. **`COMPREHENSIVE_ECOSYSTEM_AUDIT_REPORT.md`** (written by
   `comprehensive-ecosystem-audit`) — weighted composite grade, per-domain
   scores. Currently MD only — JSON persistence during run would make it fully
   dashboardable.

### Tier 2 — Dashboardable With Minor Changes

4. **`multi-ai-audit` session dirs**
   (`docs/audits/multi-ai/{session-id}/final/`) — already JSONL, just not
   continuously updated. An index file listing sessions and summary stats would
   enable dashboard consumption.
5. **ROADMAP.md task state** (updated by `task-next`) — with
   `resolve-dependencies.js --json` output written to a state file, sprint board
   data would be available.
6. **`developer-growth-analysis` reports** — if written to
   `docs/growth-reports/{date}.json` instead of Slack-only, would feed a
   developer growth panel.

### Tier 3 — Require Architectural Work to Dashboard

7. **`doc-optimizer` quality scores** — currently in temp files deleted
   post-run. Retaining `wave4-quality.jsonl` to a permanent location would
   enable per-document quality scoring on the dashboard.
8. **`validate-claude-folder` checks** — currently conversational only. A
   `scripts/validate-claude-folder.js --json` output script would expose config
   health as structured data.

---

## Contradictions / Gaps

- **`comprehensive-ecosystem-audit` temp cleanup:** The 8 per-audit JSON result
  files (the richest structured data produced by this skill) are deleted at the
  end of the run. Only the markdown report persists. This is a significant gap
  for dashboard consumption — the report would need to be kept, or the result
  JSONs retained to a permanent path.
- **`doc-optimizer` temp cleanup:** Same pattern — detailed wave JSONL files
  deleted post-run. The only permanent trail is TDMS intake. A dashboard cannot
  consume ephemeral files.
- **`gh-fix-ci` and `quick-fix`:** No data artifacts at all. These are pure
  workflow skills. Any dashboard representation would need hooks to track
  invocation outcomes.
- **`developer-growth-analysis` Slack dependency:** Assumes Slack connection
  (via Rube MCP). Report delivery depends on external integration. Report
  content is not written locally.

---

## Confidence Assessment

- HIGH claims: 12 (file paths, formats, persistence from direct SKILL.md reads)
- MEDIUM claims: 2 (post-run cleanup behavior inferred from step descriptions)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all findings sourced directly from SKILL.md
  files via filesystem read.
