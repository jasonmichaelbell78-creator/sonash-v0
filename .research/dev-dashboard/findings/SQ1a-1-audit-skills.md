# Findings: Catalog of 13 audit-\* Skills — Data/Output for Web Dashboard

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ1a-1

---

## Method

All 13 SKILL.md files were read directly from `.claude/skills/audit-*/SKILL.md`.
Actual on-disk output directories and state files were inspected to verify
persistence claims. TDMS downstream artifacts (`MASTER_DEBT.jsonl`, `views/`)
were sampled to confirm the write pipeline.

---

## Skill Catalog

### 1. audit-agent-quality

**What it measures:** Quality of custom agent definitions in
`.claude/agents/*.md` across 13 behavioral categories (prompt quality, tool
correctness, model selection, redundancy, etc.). Produces per-agent scores
(0-100) and an ecosystem grade (A-F).

**Data produced:**

| File                                                                                   | Format         | Contents                                                                    |
| -------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `docs/audits/single-session/agent-quality/audit-YYYY-MM-DD/stage-1a-frontmatter.jsonl` | JSONL          | Structural frontmatter findings per agent                                   |
| `docs/audits/single-session/agent-quality/audit-YYYY-MM-DD/stage-1b-tools.jsonl`       | JSONL          | Tool/model mismatch findings                                                |
| `docs/audits/single-session/agent-quality/audit-YYYY-MM-DD/stage-1c-redundancy.jsonl`  | JSONL          | Overlap and dead agent findings                                             |
| `docs/audits/single-session/agent-quality/audit-YYYY-MM-DD/stage-1-merged.jsonl`       | JSONL          | Cross-agent verified merged findings                                        |
| `docs/audits/single-session/agent-quality/audit-YYYY-MM-DD/all-findings-deduped.jsonl` | JSONL          | Final deduped findings fed to TDMS                                          |
| `docs/audits/single-session/agent-quality/audit-YYYY-MM-DD/AGENT_QUALITY_REPORT.md`    | Markdown       | Executive summary with per-agent scores, ecosystem grade, systemic patterns |
| `.claude/state/audit-agent-quality-history.jsonl`                                      | JSONL (append) | One record per run: `{date, agents, grade, mean_score, findings}`           |

**Confirmed on disk:** `audit-2026-03-17/` with `AGENT_QUALITY_REPORT.md`,
`stage-1-merged.jsonl`, stage-1a/b/c/d/e JSONL files. History JSONL confirmed:
`{"date":"2026-03-17","agents_total":36,"ecosystem_grade":"F","mean_score":51}`.

**CLI-only vs persistent:** Fully persistent. All stages write to disk. History
JSONL appends across sessions.

**Web dashboard relevance:** HIGH — Ecosystem grade (A-F), mean score, per-agent
scores, and trend direction (from history JSONL) are directly displayable. The
history JSONL enables sparkline trend charts.

**Natural grouping affinity:** `audit-ai-optimization` (both cover the
`.claude/` AI infrastructure), `audit-process` (agent hooks), `audit-health`
(meta-health consumer).

---

### 2. audit-aggregator

**What it measures:** Not a standalone domain audit — it merges, deduplicates,
and priority-ranks findings from all 9 domain audits into one unified report.
Produces cross-domain insight analysis (hotspot files, domain overlap, category
patterns).

**Data produced:**

| File                                                                       | Format   | Contents                                                                                              |
| -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/COMPREHENSIVE_AUDIT_REPORT.md` | Markdown | Executive summary, top-20 priority-ranked findings, cross-domain insights, full deduplicated findings |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/comprehensive-findings.jsonl`  | JSONL    | All deduplicated findings with severity, effort, confidence, cross-domain count                       |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/DEDUP_VS_MASTER_DEBT.md`       | Markdown | Already-tracked vs new vs possibly-related breakdown                                                  |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/REVIEW_DECISIONS.md`           | Markdown | User accept/decline/defer decisions per finding                                                       |

**Confirmed on disk:** `docs/audits/comprehensive/audit-2026-02-22/` with
`COMPREHENSIVE_AUDIT_REPORT.md`, `DEDUP_VS_MASTER_DEBT.md`,
`REVIEW_DECISIONS.md`, per-domain markdown reports, and `intake.jsonl`.

**CLI-only vs persistent:** Fully persistent. Output survives sessions. Always
written to dated directory.

**Web dashboard relevance:** HIGH — This is the single richest data source for a
cross-domain health summary. The comprehensive findings JSONL has severity
counts, effort estimates, and cross-domain hit counts. The dedup report reveals
what's new vs already tracked. Top-20 priority table is dashboard-ready.

**Natural grouping affinity:** All 9 domain audit skills (it aggregates them),
`audit-health` (meta-consumer of comprehensive results).

---

### 3. audit-ai-optimization

**What it measures:** Efficiency of the AI infrastructure: token waste (dead
docs, dead scripts, format verbosity), AI instruction bloat (skill line counts,
CLAUDE.md bloat), hook latency, subprocess overhead, skill overlap, context
optimization, and state management bloat. 12 domains across 3 stages.

**Data produced:**

| File                                                                                              | Format   | Contents                                                       |
| ------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-1a-dead-assets.jsonl`          | JSONL    | Dead docs and orphaned scripts                                 |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-1b-parsing-format.jsonl`       | JSONL    | Fragile parsing and verbose format findings                    |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-1c-instruction-bloat.jsonl`    | JSONL    | SKILL.md and CLAUDE.md bloat findings                          |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-2a-hook-efficiency.jsonl`      | JSONL    | Hook latency and subprocess overhead                           |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-2b-skill-architecture.jsonl`   | JSONL    | Skill overlap and vague agent prompts                          |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-2c-mcp-config.jsonl`           | JSONL    | Unused MCP servers                                             |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-2d-context-optimization.jsonl` | JSONL    | Excessive context loading patterns                             |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-2e-memory-state.jsonl`         | JSONL    | Bloated state files, missing cleanup                           |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-3a-automation-gaps.jsonl`      | JSONL    | Unautomated manual processes                                   |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/stage-3b-cross-cutting.jsonl`        | JSONL    | Cross-domain systemic patterns                                 |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/all-findings-deduped.jsonl`          | JSONL    | Final deduped findings for TDMS                                |
| `docs/audits/single-session/ai-optimization/audit-YYYY-MM-DD/AI_OPTIMIZATION_AUDIT_REPORT.md`     | Markdown | Executive summary with domain heatmap, quick wins, action plan |

**CLI-only vs persistent:** Fully persistent. All stages write to dated
directory. TDMS intake feeds MASTER_DEBT.

**Web dashboard relevance:** MEDIUM-HIGH — The domain heatmap (which of 12
domains has most findings) and quick-wins list (S2+ with E0 effort) are good
dashboard widgets. Severity breakdown is straightforward. Less operationally
urgent than security/code but valuable for AI infrastructure health tracking.

**Natural grouping affinity:** `audit-agent-quality` (both cover `.claude/`
infrastructure), `audit-process` (hooks and scripts overlap), `audit-health`
(meta-consumer).

---

### 4. audit-code

**What it measures:** Code quality across 7 categories: hygiene (dead code,
unused imports), types/correctness, framework best practices (React/Next.js),
test coverage, security surface, AI-generated code failure modes, and debugging
ergonomics (correlation IDs, structured logging, Sentry).

**Data produced:**

| File                                                     | Format   | Contents                                                                                       |
| -------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `docs/audits/single-session/code/audit-YYYY-MM-DD.jsonl` | JSONL    | Findings with `category: "code-quality"`, severity, effort, confidence, file:line              |
| `docs/audits/single-session/code/audit-YYYY-MM-DD.md`    | Markdown | Full report with baselines (tests, lint, pattern compliance), findings by severity, quick wins |

**Confirmed on disk:** Directory `docs/audits/single-session/code/` exists.

**CLI-only vs persistent:** Fully persistent. Both files written to disk.

**Web dashboard relevance:** HIGH — Baseline metrics (passing tests, lint
errors, pattern violations) are directly dashboardable. Severity counts (S0-S3),
the AICode category findings (AI-generated failure modes), and SonarCloud
integration make this a strong candidate for a "Code Health" dashboard panel.

**Natural grouping affinity:** `audit-refactoring` (structural code issues),
`audit-security` (security surface overlaps), `audit-comprehensive` (code is
Stage 1 of comprehensive).

---

### 5. audit-comprehensive

**What it measures:** Orchestrator that runs all 9 domain audits in staged waves
and feeds `audit-aggregator`. Not itself an analysis skill — it coordinates
`audit-code`, `audit-security`, `audit-performance`, `audit-refactoring`,
`audit-documentation`, `audit-process`, `audit-engineering-productivity`,
`audit-enhancements`, and `audit-ai-optimization`. Produces the unified
comprehensive report.

**Data produced:**

| File                                                                       | Format        | Contents                                            |
| -------------------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/baseline.txt`                  | Text          | Test, lint, pattern compliance snapshot             |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/{domain}-audit.md`             | Markdown (x9) | Per-domain audit reports                            |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/COMPREHENSIVE_AUDIT_REPORT.md` | Markdown      | Final aggregated report (via audit-aggregator)      |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/DEDUP_VS_MASTER_DEBT.md`       | Markdown      | Cross-reference with existing tracked debt          |
| `docs/audits/comprehensive/audit-YYYY-MM-DD/REVIEW_DECISIONS.md`           | Markdown      | Per-finding user decisions                          |
| AUDIT_TRACKER.md (updated)                                                 | Markdown      | Running log of all audit runs across all categories |

**Confirmed on disk:** `docs/audits/comprehensive/audit-2026-02-22/` confirmed
with all above artifacts.

**CLI-only vs persistent:** Fully persistent. Produces the most comprehensive
artifact set of any skill.

**Web dashboard relevance:** HIGH — Comprehensive run results are the definitive
snapshot of overall codebase health. The AUDIT_TRACKER.md update means there's a
running history of when comprehensive audits ran and how many findings they
produced. Ideal for a "Last Comprehensive Audit" status widget.

**Natural grouping affinity:** All 9 domain skills (parent orchestrator),
`audit-aggregator` (child), `audit-health` (meta-consumer).

---

### 6. audit-documentation

**What it measures:** Documentation quality across 6 stages: inventory/baseline,
link validation (internal, external, cross-references, orphans), content quality
(accuracy, completeness, coherence, freshness), format/structure (markdown lint,
prettier, standards), placement/lifecycle (location, archive candidates, cleanup
candidates), and synthesis/prioritization.

**Data produced:**

| File                                                                                     | Format     | Contents                                                        |
| ---------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-1-inventory.md`         | Markdown   | Document count and baseline metrics                             |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-1-baselines.md`         | Markdown   | Baseline metrics                                                |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-1-links.json`           | JSON       | Full link graph                                                 |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-2-internal-links.jsonl` | JSONL      | Broken internal links                                           |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-2-external-links.jsonl` | JSONL      | Broken external URLs                                            |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-2-cross-refs.jsonl`     | JSONL      | Cross-reference validation failures                             |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-2-orphans.jsonl`        | JSONL      | Orphaned documents (unreachable)                                |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-3-accuracy.jsonl`       | JSONL      | Inaccurate/outdated content findings                            |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-3-completeness.jsonl`   | JSONL      | Missing documentation findings                                  |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-3-coherence.jsonl`      | JSONL      | Internal consistency issues                                     |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-3-freshness.jsonl`      | JSONL      | Stale content (last-modified age)                               |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-4-*.jsonl`              | JSONL (x3) | Format findings (markdownlint, prettier, structure)             |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/stage-5-*.jsonl`              | JSONL (x4) | Lifecycle findings (location, archive, cleanup, deep lifecycle) |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/all-findings.jsonl`           | JSONL      | Merged, deduplicated, prioritized findings                      |
| `docs/audits/single-session/documentation/audit-YYYY-MM-DD/FINAL_REPORT.md`              | Markdown   | Immediate fixes, archive queue, delete/merge queue              |

**Confirmed on disk:** `docs/audits/single-session/documentation/` directory
exists.

**CLI-only vs persistent:** Fully persistent. 18 agents write to dated
directory.

**Web dashboard relevance:** MEDIUM — The three action queues (immediate fixes,
archive queue, delete/merge queue) could surface as task lists. Broken link
counts and stale content counts are good health indicators. Less urgently
operational than security/code but valuable for a documentation health panel.

**Natural grouping affinity:** `audit-ai-optimization` (dead docs domain
overlaps), `audit-comprehensive` (Stage 2 domain).

---

### 7. audit-engineering-productivity

**What it measures:** Developer experience across 3 domains: (1) Golden Path/DX
— npm scripts, setup automation, onboarding; (2) Debugging ergonomics —
structured logging vs console.log ratio, correlation IDs, error boundaries,
Sentry; (3) Offline support — Firebase IndexedDB persistence, service workers,
offline write queues.

**Data produced:**

| File                                                                       | Format   | Contents                                                                                                                                                     |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/audits/single-session/engineering-productivity/audit-findings.jsonl` | JSONL    | Findings with `category: "engineering-productivity"`, per GoldenPath/Debugging/Offline category                                                              |
| `docs/audits/single-session/engineering-productivity/audit-report.md`      | Markdown | Baselines table (console.log count, logger count, structured logging ratio, service worker presence, Firebase persistence), findings by severity, quick wins |

**Note:** The skill uses a fixed filename (`audit-findings.jsonl`,
`audit-report.md`) rather than date-stamped paths. Each run overwrites the
previous unless the directory is date-stamped by convention.

**Confirmed on disk:** Directory
`docs/audits/single-session/engineering-productivity/` exists.

**CLI-only vs persistent:** Persistent. Both JSONL and Markdown written to disk.

**Web dashboard relevance:** MEDIUM-HIGH — The baselines table is uniquely
dashboard-friendly: console.log-to-logger ratio, service worker presence (Y/N),
and Firebase persistence (Y/N) are crisp binary/numeric indicators. Quick wins
list is actionable.

**Natural grouping affinity:** `audit-process` (CI/CD and DX overlap),
`audit-performance` (offline support overlap), `audit-code` (debugging
ergonomics overlaps code category 7).

---

### 8. audit-enhancements

**What it measures:** Improvement opportunities (not defects) across 8 domains:
app architecture, product/UX, content (microcopy), DevX/automation,
infrastructure/stack, testing strategy, documentation strategy, and
workflow/external services. Every finding is required to include a
`counter_argument` field. Produces a `Strengths` section identifying areas
working well.

**Data produced:**

| File                                                                                   | Format         | Contents                                                                                        |
| -------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `docs/audits/single-session/enhancements/audit-YYYY-MM-DD/stage-1-{domain}.jsonl`      | JSONL (x8)     | Preliminary findings per domain with `counter_argument`, `current_approach`, `proposed_outcome` |
| `docs/audits/single-session/enhancements/audit-YYYY-MM-DD/stage-2-{cluster}.jsonl`     | JSONL (opt-in) | Deep-dive findings with implementation notes and risk assessment                                |
| `docs/audits/single-session/enhancements/audit-YYYY-MM-DD/merged-all.jsonl`            | JSONL          | All findings merged, confidence-filtered (≥70%)                                                 |
| `docs/audits/single-session/enhancements/audit-YYYY-MM-DD/ENHANCEMENT_AUDIT_REPORT.md` | Markdown       | Summary with Strengths section, findings by impact tier (S0-S3), inconclusive items             |
| `docs/audits/single-session/enhancements/audit-YYYY-MM-DD/audit-state.json`            | JSON           | Resume state tracking current phase, agent completion, review progress                          |
| MASTER_DEBT.jsonl (updated)                                                            | JSONL          | Findings ingested as `category: "enhancements"`, `type: "enhancement"`                          |

**Confirmed on disk:**
`docs/audits/single-session/enhancements/audit-2026-02-09/` and
`audit-2026-02-11/` confirmed.

**CLI-only vs persistent:** Fully persistent. The `audit-state.json` enables
session-spanning resume. TDMS intake writes to `MASTER_DEBT.jsonl`.

**Web dashboard relevance:** MEDIUM — The Strengths section is unique among
audit skills and could power a "What's working well" dashboard panel. The
enhancement backlog (by impact tier) is a different flavor from defect tracking.
The counter_argument field makes findings more nuanced but harder to display
simply.

**Natural grouping affinity:** `audit-refactoring` (structural improvements),
`audit-ai-optimization` (DevX domain overlap), `audit-comprehensive` (Stage 2.5
domain).

---

### 9. audit-health

**What it measures:** Meta-check on the audit system itself — not a codebase
audit. Runs 5 diagnostic scripts to check: audit infrastructure health
(directories, scripts, templates), commit threshold exceedances (which audits
are overdue), template compliance scores, pre-audit prerequisites, and ecosystem
audit health (7 ecosystem-level audit skills). Recommends which audit to run
next.

**Data produced:**

| Output                    | Format | Contents                                                                                            |
| ------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| Console/session output    | Text   | Health report with PASS/FAIL table for all ecosystem audits, threshold exceedances, recommendations |
| No persistent file output | —      | All output is printed to the session; no JSONL or markdown written to disk                          |

**Script dependencies:** `scripts/audit/audit-health-check.js`,
`scripts/audit/count-commits-since.js`, `scripts/audit/validate-templates.js`,
`scripts/audit/pre-audit-check.js`

**CLI-only vs persistent:** CLI-ONLY for output. The scripts it invokes may
produce their own output, but `audit-health` itself writes nothing to disk. All
output is conversational/session-only.

**Web dashboard relevance:** LOW as currently implemented — because it produces
no persistent file output, a dashboard cannot read its results without running
the underlying scripts directly. However, the scripts it calls
(`count-commits-since.js`, `validate-templates.js`) could be invoked directly by
a dashboard backend to surface the same data. The underlying data (threshold
exceedances, template compliance %) is HIGH relevance if exposed.

**Natural grouping affinity:** All audit skills (meta-consumer),
`audit-comprehensive` (highest-level health consumer).

---

### 10. audit-performance

**What it measures:** Frontend and backend performance across 7 categories:
bundle size/loading (code splitting, large deps), rendering performance
(re-renders, memoization), data fetching/caching, memory management (effect
cleanup, subscription leaks), Core Web Vitals (LCP, INP, CLS), offline support,
and AI performance patterns (naive data fetching, missing pagination, unbounded
Firestore queries).

**Data produced:**

| File                                                            | Format   | Contents                                                                                                                                                                 |
| --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/audits/single-session/performance/audit-YYYY-MM-DD.jsonl` | JSONL    | Findings with `category: "performance"`, `performance_details: {affected_metric, current_metric, expected_improvement}`                                                  |
| `docs/audits/single-session/performance/audit-YYYY-MM-DD.md`    | Markdown | Baselines (build time, bundle size KB, client component count, useEffect count, real-time listener count), top 5 optimization opportunities with estimated % improvement |

**Confirmed on disk:** Directory `docs/audits/single-session/performance/`
exists.

**CLI-only vs persistent:** Fully persistent. Both files dated and written to
disk.

**Web dashboard relevance:** HIGH — The
`performance_details.expected_improvement` field (estimated % gain) is unique
and directly useful in a dashboard. The baseline metrics (bundle size, useEffect
count, listener count) are chartable over time. The 7-category breakdown maps
cleanly to dashboard widgets.

**Natural grouping affinity:** `audit-engineering-productivity` (offline support
overlap), `audit-refactoring` (complexity causes performance issues),
`audit-code` (AI performance patterns overlap), `audit-comprehensive` (Stage 1
domain).

---

### 11. audit-process

**What it measures:** The entire automation ecosystem across 16 automation types
(Claude hooks, skills, commands, npm scripts, standalone scripts, GitHub
Actions, Husky hooks, lint-staged, ESLint, Prettier, Firebase Functions,
Firebase scheduled jobs, Firebase rules, MCP servers, TypeScript configs)
evaluated against 12 audit categories (redundancy, dead code, effectiveness,
performance/bloat, error handling, dependency/call chain, consistency, coverage
gaps, maintainability, functionality, improvements, code quality). The most
structurally complex audit — 7 stages, 22 parallel agents.

**Data produced:**

| File                                                                              | Format        | Contents                                                                       |
| --------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-1-inventory.md`        | Markdown      | Full inventory of all 16 automation types with dependency map                  |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-1{a-f}-*.md`           | Markdown (x6) | Per-type inventory (hooks, scripts, skills/commands, CI/config, Firebase, MCP) |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-2-redundancy.jsonl`    | JSONL         | Orphaned, duplicated, never-triggered automation                               |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-3-effectiveness.jsonl` | JSONL         | Hook/CI/script functionality findings                                          |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-4-performance.jsonl`   | JSONL         | Hook/CI/script performance findings                                            |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-5-quality.jsonl`       | JSONL         | Error handling, code quality, consistency findings                             |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/stage-6-improvements.jsonl`  | JSONL         | Coverage gaps and improvement opportunities                                    |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/all-findings-raw.jsonl`      | JSONL         | Merged findings before dedup                                                   |
| `docs/audits/single-session/process/audit-YYYY-MM-DD/AUTOMATION_AUDIT_REPORT.md`  | Markdown      | Priority action plan (S0-S1 immediate, S2 short-term, S3 backlog)              |

**Confirmed on disk:** Directory `docs/audits/single-session/process/` exists.

**CLI-only vs persistent:** Fully persistent. All stages write to dated
directory. TDMS intake required before completion.

**Web dashboard relevance:** MEDIUM-HIGH — The automation inventory (count by
type) is a unique overview not produced by other skills. Coverage gap findings
reveal missing quality gates. The stage-1 inventory could power a "Automation
Coverage" panel showing how many of each type are active vs dead vs redundant.

**Natural grouping affinity:** `audit-ai-optimization` (hooks and scripts are
shared scope), `audit-engineering-productivity` (DX and CI overlap),
`audit-comprehensive` (Stage 2 domain).

---

### 12. audit-refactoring

**What it measures:** Structural code debt across 5 categories: god objects
(files >300 lines, >5 responsibilities), code duplication, cognitive complexity
(SonarCloud CRITICAL code smells), architecture violations (circular
dependencies, layer boundary crossings), and technical debt markers
(TODO/FIXME/HACK, unused exports, dead code). Cross-references SonarCloud data
when MCP is available.

**Data produced:**

| File                                                                     | Format   | Contents                                                                                                                                                |
| ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/audits/single-session/refactoring/audit-YYYY-MM-DD/findings.jsonl` | JSONL    | Findings with `category: "refactoring"`, `symbols`, optional `duplication_cluster`                                                                      |
| `docs/audits/single-session/refactoring/audit-YYYY-MM-DD/REPORT.md`      | Markdown | Baselines (SonarCloud CRITICAL count, circular deps, unused exports, files >300 lines, TODO count), top refactoring candidates, batch fix opportunities |

**Confirmed on disk:** Directory `docs/audits/single-session/refactoring/`
exists.

**CLI-only vs persistent:** Fully persistent. Both files written to dated
subdirectory.

**Web dashboard relevance:** HIGH — The baseline metrics are uniquely trackable
over time: SonarCloud CRITICAL count, circular dependency count, and
TODO/FIXME/HACK marker count are all numeric, chartable, and meaningful. "Batch
fix opportunities" (N instances of pattern X can be auto-fixed) is a high-value
dashboard widget.

**Natural grouping affinity:** `audit-code` (code quality shares scope),
`audit-performance` (complexity causes performance issues),
`audit-comprehensive` (Stage 1 domain).

---

### 13. audit-security

**What it measures:** Security across 13 categories:
authentication/authorization, input validation/injection prevention, data
protection (PII, encryption, secrets), Firebase/Firestore security (rules, rate
limiting, replay protection), dependency supply chain (npm audit, pinned
versions), OWASP Top 10, hosting/headers (CSP, HSTS, COOP/COEP),
Next.js-specific (server/client boundary leaks), file handling,
crypto/randomness, product/UX security risks, AI-generated code security, and AI
security patterns. Includes SonarCloud security hotspot integration when MCP is
available.

**Data produced:**

| File                                                         | Format   | Contents                                                                                                                                                           |
| ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/audits/single-session/security/audit-YYYY-MM-DD.jsonl` | JSONL    | Findings with `category: "security"`, `owasp_category`, `cvss_estimate` fields                                                                                     |
| `docs/audits/single-session/security/audit-YYYY-MM-DD.md`    | Markdown | Baselines (npm audit vulnerability counts by severity, pattern violations, security-sensitive file changes), findings by severity/OWASP category, remediation plan |

**Confirmed on disk:** Directory `docs/audits/single-session/security/` exists.

**CLI-only vs persistent:** Fully persistent. Both files dated and written to
disk.

**Web dashboard relevance:** HIGH — Security is the highest-urgency dashboard
category. The `owasp_category` field enables classification by OWASP Top 10
category. The `cvss_estimate` field provides a numeric risk score. npm
vulnerability counts (critical/high/medium/low) are directly chartable. S0
findings should trigger dashboard alerts.

**Natural grouping affinity:** `audit-code` (security surface category in code
audit), `audit-refactoring` (architecture violations affect security),
`audit-comprehensive` (Stage 1 domain, S0/S1 security escalation triggers before
Stage 2).

---

## Summary Table

| Skill                          | Primary Output Format          | Persistent?           | Key Dashboard Metric(s)                                         | Relevance   |
| ------------------------------ | ------------------------------ | --------------------- | --------------------------------------------------------------- | ----------- |
| audit-agent-quality            | JSONL + MD + history JSONL     | Yes (history appends) | Ecosystem grade A-F, mean score, trend                          | HIGH        |
| audit-aggregator               | JSONL + MD                     | Yes                   | Cross-domain top-20, severity counts, hotspot files             | HIGH        |
| audit-ai-optimization          | JSONL (x11) + MD               | Yes                   | Domain heatmap, quick wins count, 12-domain severity            | MEDIUM-HIGH |
| audit-code                     | JSONL + MD                     | Yes                   | Tests passing, lint errors, pattern violations, AICode findings | HIGH        |
| audit-comprehensive            | JSONL + MD (x10+)              | Yes                   | Last run date, total unique findings, S0/S1 count               | HIGH        |
| audit-documentation            | JSONL (x14) + MD               | Yes                   | Broken links, orphan count, stale docs, archive queue size      | MEDIUM      |
| audit-engineering-productivity | JSONL + MD                     | Yes                   | console.log ratio, service worker Y/N, Firebase persistence Y/N | MEDIUM-HIGH |
| audit-enhancements             | JSONL (x8+) + MD + JSON state  | Yes (resume-capable)  | Enhancement backlog by impact, Strengths identified             | MEDIUM      |
| audit-health                   | None (console output only)     | NO                    | N/A as-is (scripts callable directly)                           | LOW (as-is) |
| audit-performance              | JSONL + MD                     | Yes                   | Bundle size, expected_improvement %, listener count             | HIGH        |
| audit-process                  | JSONL (x6) + MD + inventory MD | Yes                   | Automation type counts, dead automation count, coverage gaps    | MEDIUM-HIGH |
| audit-refactoring              | JSONL + MD                     | Yes                   | SonarCloud CRITICAL count, circular deps, TODO count            | HIGH        |
| audit-security                 | JSONL + MD                     | Yes                   | npm audit vulns, OWASP category breakdown, S0 count, CVSS       | HIGH        |

---

## Shared TDMS Downstream

All 12 persistent-output skills (not `audit-health`) feed their JSONL findings
into the TDMS pipeline via `node scripts/debt/intake-audit.js`. This produces:

- `docs/technical-debt/MASTER_DEBT.jsonl` — 8,472 lines as of 2026-03-29;
  canonical debt store
- `docs/technical-debt/views/by-category.md`, `by-severity.md`, `by-status.md`,
  `unplaced-items.md`, `verification-queue.md` — pre-rendered views
- `docs/technical-debt/metrics.json` — aggregated debt metrics

**Dashboard implication:** `MASTER_DEBT.jsonl` and `metrics.json` are the single
richest persistent sources for a cross-audit dashboard. They aggregate all audit
findings across all runs and categories. Any dashboard should treat these as
primary data sources rather than reading individual audit JSONL files.

---

## Natural Grouping Clusters (for Dashboard Layout)

| Cluster              | Skills                                                        | Rationale                                               |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Code Health          | audit-code, audit-refactoring, audit-security                 | Direct source-code quality measures; SonarCloud overlap |
| Performance          | audit-performance, audit-engineering-productivity             | Bundle, runtime, offline, DX metrics                    |
| AI Infrastructure    | audit-agent-quality, audit-ai-optimization, audit-process     | All cover `.claude/` hooks, skills, agents              |
| Documentation        | audit-documentation, audit-enhancements (doc strategy domain) | Content quality and lifecycle                           |
| Comprehensive / Meta | audit-comprehensive, audit-aggregator, audit-health           | Orchestrators and health monitors                       |
| Enhancement Backlog  | audit-enhancements, TDMS views                                | Improvement tracking vs defect tracking                 |

---

## Gaps Identified

1. **audit-health produces no persistent output** — its health check data is
   only surfaced conversationally. The underlying scripts
   (`count-commits-since.js`, `validate-templates.js`) could be invoked directly
   by a dashboard backend.
2. **No cross-run trend files** — only `audit-agent-quality` writes a history
   JSONL (`.claude/state/audit-agent-quality-history.jsonl`). No other
   single-domain audit appends a per-run history record, making trend analysis
   across runs depend on scanning the dated directory structure.
3. **engineering-productivity uses non-date-stamped filenames** —
   `audit-findings.jsonl` and `audit-report.md` may be overwritten on subsequent
   runs if the calling convention doesn't add a date subdirectory.
4. **audit-health's "next audit" recommendation** is high-value dashboard data
   (which audit is overdue) but is only printed to session, not persisted.

---

## Confidence Assessment

- HIGH claims: 10 (all based on direct filesystem inspection + SKILL.md reading)
- MEDIUM claims: 3 (output format details inferred from SKILL.md where no live
  files were found)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
