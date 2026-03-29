# Findings: External Sources of Technical Debt and TDMS Integration Status

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ-5

---

## Key Findings

### 1. SonarCloud — Partial Automation (Manual Trigger Required) [CONFIDENCE: HIGH]

SonarCloud is the most mature external source integration. A full sync script
(`scripts/debt/sync-sonarcloud.js`) and a dedicated skill
(`.claude/skills/sonarcloud/SKILL.md`) exist.

**API endpoints used:**

- `https://sonarcloud.io/api/issues/search` — code issues (bugs,
  vulnerabilities, code smells)
- `https://sonarcloud.io/api/hotspots/search` — security hotspots (separate
  endpoint)
- `https://sonarcloud.io/api/qualitygates/project_status` — quality gate status
- `https://sonarcloud.io/api/measures/component` — project metrics

**Authentication:** HTTP Basic with `SONAR_TOKEN` env var as username, empty
password (`Authorization: Basic base64(token + ":")`). Token sourced exclusively
from `SONAR_TOKEN` env var or `.env.local`.

**What the CI workflow does:** `.github/workflows/sonarcloud.yml` runs
SonarCloud analysis on every push/PR to main and decorates PRs with results. It
does NOT write anything to TDMS — it only uploads findings to the SonarCloud
cloud dashboard.

**What gets synced vs missed:**

- Synced (on manual invocation): all open/confirmed/reopened issues matching
  severity/type filters, plus security hotspots (`TO_REVIEW` status)
- Missed automatically: CI runs analysis but does not trigger
  `sync-sonarcloud.js` at all. The bridge is entirely manual.
- Severity mapping: BLOCKER/CRITICAL → S0, MAJOR → S1, MINOR → S2, INFO → S3
- Special case: cognitive-complexity BLOCKER is downgraded to S1 (hard-coded
  post-intake correction)
- Pagination: fetches up to 10,000 issues (20 pages × 500 items); beyond that
  truncates with warning.

**Evidence of past usage:** MASTER_DEBT.jsonl contains 1,593 items with
`source_file: "sonarcloud-sync"` (from the automated script) and 286 items with
`source_file: "sonarcloud-dashboard-paste-2026-02-20"` (manual copy/paste),
confirming both pathways have been used. The paste path has no automation —
items were ingested by hand.

**MCP server available:** `scripts/mcp/sonarcloud-server.js` provides direct LLM
access via `mcp__sonarcloud__get_quality_gate` and `mcp__sonarcloud__get_issues`
tools, enabling AI-driven status checks without shell invocation.

**Gap for automation:** The sonarcloud.yml workflow does not invoke
sync-sonarcloud.js post-analysis. A full bridge would need a post-CI step that
calls the sync script with `--force` when new issues are detected.

---

### 2. CodeRabbit / Qodo / Gemini — No Automated Ingestion (Copy/Paste Only) [CONFIDENCE: HIGH]

These three AI code review tools run on PRs but produce zero automated TDMS
intake.

**CodeRabbit:** Referenced in the pr-review SKILL.md as a source to process
(`Process external PR code review feedback (CodeRabbit, Qodo, SonarCloud, Gemini)`).
A backup hook file `.claude/hooks/backup/coderabbit-review.js` exists but is in
the `backup/` directory (inactive). No live hook, no workflow integration, no
ingestion script. CodeRabbit findings only enter TDMS when the user manually
pastes them into the `/pr-review` skill flow and defers items via `/add-debt`.

**Qodo:** Configured in `.qodo/pr-agent.toml` with extensive false-positive
suppression instructions (21 suppression rules accumulated from PRs #369–#470).
The TOML config only tells Qodo what NOT to flag — it does not create any data
bridge to TDMS. All Qodo items enter TDMS exclusively through manual
`/pr-review` + `/add-debt` processing.

**Gemini Code Assist:** Configured in `.gemini/config.yaml` and
`.gemini/styleguide.md`. The config sets severity thresholds (`MEDIUM`) and
ignore patterns for generated data files. No data bridge to TDMS. All Gemini
findings enter TDMS through manual processing.

**The pr-review skill design is explicitly manual:** The skill's Integration
section states: "**Upstream:** Manual invocation only (user pastes feedback)."
The 8-step protocol processes feedback and defers items via `/add-debt`, writing
them to MASTER_DEBT.jsonl as `source_id: "PR-{number}-{seq}"`. This is the only
bridge path.

**Data format from these tools:** Markdown-formatted PR comments in GitHub. No
machine- readable API for bulk intake exists via this pathway.

---

### 3. npm audit / Dependabot — No TDMS Integration [CONFIDENCE: HIGH]

**npm audit:**

- Used in `scripts/health/checkers/security.js` to populate health score metrics
  (tracks `critical_vulns`, `high_vulns`, `audit_status`). This is a diagnostic
  read — it does NOT write to TDMS.
- Used in `scripts/validate-audit.js` to cross-reference dependency findings in
  audit results. Again, read-only: findings are matched for validation, not
  ingested.
- `package.json` contains no `npm audit` script entry. No TDMS intake script
  calls npm audit to pump findings.
- MASTER_DEBT.jsonl contains a DEBT item (`DEBT-0058`, `DEBT-0126`) noting
  "Missing npm audit in CI" — ironically, these were written by hand via the
  review pipeline before npm audit and Dependabot were even enabled.

**Dependabot:**

- `.github/dependabot.yml` is configured with weekly npm updates for root and
  `functions/` packages, plus monthly GitHub Actions updates. Minor/patch
  updates are grouped and auto- merged via `auto-merge-dependabot.yml` when CI
  passes.
- Dependabot creates PRs, not TDMS items. When Dependabot PRs merge,
  `resolve-debt.yml` runs, but it only resolves items listed in
  `Resolves: DEBT-XXXX` lines in the PR body — and Dependabot PRs do not include
  such lines.
- No vulnerability findings from Dependabot's dependency graph are synced to
  TDMS.
- The `dependency-review.yml` workflow runs
  `actions/dependency-review-action@v4.9.0` on PRs and will fail CI if
  `critical` severity vulnerabilities are introduced, but this failure surfaces
  only as a CI block, not a TDMS entry.

**What would be needed:** A script that calls `npm audit --json`, filters by
severity, deduplicates against existing MASTER_DEBT items (by package+advisory
ID), and calls `appendMasterDebtSync`. The sync-sonarcloud.js pattern is the
template.

---

### 4. ESLint / TypeScript Compiler — Violations Not Tracked in TDMS [CONFIDENCE: HIGH]

**ESLint:**

- `eslint.config.mjs` is a complex multi-section configuration with 30+ rules
  including custom `sonash/*` rules (migrated from regex-based pattern
  compliance), react-hooks, security plugin, and typescript-eslint.
- CI runs `npm run lint` and `npm run lint:fast` (oxlint) as blocking checks.
  Violations that pass lint (i.e., warnings, or violations in scripts/hooks
  which have rules turned OFF via zero-warning overrides) are not surfaced
  anywhere.
- Critical architectural rule: scripts/ and .claude/hooks/ have ALL warn-level
  rules suppressed via `linterOptions.reportUnusedDisableDirectives: "off"` so
  that `--max-warnings 0` passes on production code. This means a large category
  of ESLint violations in tooling code are deliberately invisible to CI.
- `known-debt-baseline.json` (at `.claude/state/known-debt-baseline.json`)
  tracks cognitive-complexity and cyclomatic-complexity thresholds per file —
  30+ files with known exceedances. This is the shadow store for complexity
  violations. It is NOT linked to TDMS in any way.
- The baseline file has its own schema (`schema_version: 1`), ratchet history,
  and per- file thresholds. There is no sync script that reads it and creates
  TDMS items for exceedances.

**TypeScript strict mode:**

- CI runs `npx tsc --noEmit` as a blocking check. Violations fail the build —
  there is no mechanism to track "near-miss" TypeScript violations (e.g.,
  explicit `any` which is a "warn" in ESLint but allowed by the zero-warning
  override in scripts/).
- No TypeScript violation is ever written to TDMS automatically.

**Pattern compliance (check-pattern-compliance.js):**

- The `pattern-compliance-audit.yml` workflow runs a weekly full-repo scan. If
  blocking violations exceed 0 OR warnings exceed 75, it creates (or comments
  on) a GitHub Issue with label `pattern-compliance` and `tech-debt`. This is
  the ONLY automated pathway from a CI tool to GitHub Issues.
- Critically: this GitHub Issue is NOT bridged to TDMS. The pattern compliance
  violation stays as a GitHub Issue only.

---

### 5. GitHub Code Scanning (Semgrep / CodeQL) — GitHub Security Tab Only, No TDMS Bridge [CONFIDENCE: HIGH]

**Semgrep:**

- `.github/workflows/semgrep.yml` runs on push/PR to main and on a weekly
  Wednesday schedule. Runs local custom rules from `.semgrep/rules/` and uploads
  SARIF output via `github/codeql-action/upload-sarif`. Results appear in the
  GitHub Security tab under "Code scanning alerts."
- No `--error` flag: findings are informational (the workflow uses `|| true` on
  the semgrep run). SARIF upload is the only output destination.
- No script reads the SARIF output or the GitHub Security API to create TDMS
  items.

**CodeQL:**

- `.github/workflows/codeql.yml` runs on push/PR to main and weekly Monday
  schedule. Analyzes JavaScript/TypeScript. Results published to GitHub Security
  tab.
- Uses `github/codeql-action/analyze` which writes directly to GitHub's code
  scanning database. No SARIF file is saved to the repository. No TDMS bridge.

**Shared gap:** Both tools publish to GitHub Security (`security-events: write`
permission). The GitHub Security API
(`/repos/{owner}/{repo}/code-scanning/alerts`) could be polled to extract
findings, but no such script exists. All Semgrep/CodeQL findings are invisible
to TDMS unless manually copy-pasted.

---

### 6. GitHub Issues — No TDMS Sync in Either Direction [CONFIDENCE: HIGH]

**From TDMS to GitHub Issues:**

- The `pattern-compliance-audit.yml` workflow creates GitHub Issues when
  violations exceed thresholds. This is the only automated flow from a
  compliance tool to GitHub Issues — but it does not go through TDMS at all
  (compliance violations are not TDMS items first).
- No script reads MASTER_DEBT.jsonl and creates GitHub Issues.

**From GitHub Issues to TDMS:**

- No script syncs GitHub Issues into TDMS. The `source_id` patterns visible in
  MASTER_DEBT.jsonl include `sonarcloud:`, `review:`, `audit:`, `manual:`, and
  `PR-{number}-{seq}` — but no `github-issue:` prefix exists anywhere.
- The `resolve-debt.yml` workflow acts in the reverse direction: when a PR
  merges with `Resolves: DEBT-XXXX` in its body, it marks TDMS items as
  RESOLVED. But there is no equivalent workflow for GitHub Issues closing.
- The ISSUE_TEMPLATE directory exists in `.github/` but its templates are for
  user-facing issues, not debt tracking.

**Conclusion:** GitHub Issues and TDMS are parallel, unconnected systems. The
only connection is the `pattern-compliance` GitHub Issue which mentions
TDMS-style problems but is not itself a TDMS item.

---

### 7. known-debt-baseline.json — Shadow Debt Store, Not Reconciled with TDMS [CONFIDENCE: HIGH]

**Location:** `.claude/state/known-debt-baseline.json`

**Contents:** Two categories of pre-approved exceedances:

- `raw-error-message`: currently at baseline 0 (was reduced from 5 → 3 → 0 via
  ratchet)
- `cognitive-complexity`: 29 files with known exceedances, ranging from 16
  (compact-restore.js) to 189 (check-review-archive.js)
- `cyclomatic-complexity`: 16 files with known exceedances, ranging from 16 to
  102

**How it's used:** The pre-commit hook reads this file to determine whether a
committed file is exempt from the cognitive-complexity and cyclomatic-complexity
checks. If a file's CC exceeds 15 but its current threshold is in this baseline,
the hook allows the commit. It is a gate bypass mechanism.

**Ratchet mechanism:** The file tracks `ratchet_history` showing the historical
reduction of baseline counts. It records reduction events (`from: 5, to: 3`
etc.) as an audit trail.

**Is it a shadow TDMS?** Partially. It tracks the same _category_ of technical
debt (complexity violations) that SonarCloud and `check-cyclomatic-cc.js`
detect. However:

1. Items in the baseline have no DEBT-XXXX IDs
2. Items have no severity, category, roadmap_ref, or status fields
3. No script reads the baseline and creates corresponding TDMS items
4. The file uses a completely different schema (filename → threshold, not the
   TDMS JSONL schema)

**Reconciliation gap:** MASTER_DEBT.jsonl contains some complexity-related items
sourced from SonarCloud (cognitive complexity BLOCKER/MAJOR issues), but the
known-debt-baseline.json tracks 30+ different files with complexity violations
that are NOT in TDMS. These exist only in the baseline and would need manual or
scripted reconciliation to appear in TDMS.

---

## Summary Table: Integration Status Per Source

| Source                   | CI Detection            | Auto-Ingestion to TDMS             | Manual Path                 | API Available               | Gap Severity                                    |
| ------------------------ | ----------------------- | ---------------------------------- | --------------------------- | --------------------------- | ----------------------------------------------- |
| SonarCloud               | Yes (sonarcloud.yml)    | No — manual script invocation only | sync-sonarcloud.js (robust) | Yes (REST + MCP)            | Medium — script exists, just not auto-triggered |
| CodeRabbit               | Yes (PR comments)       | No                                 | /pr-review + /add-debt      | No (markdown comments only) | High — fully manual copy/paste                  |
| Qodo                     | Yes (PR comments)       | No                                 | /pr-review + /add-debt      | No (markdown comments only) | High — fully manual copy/paste                  |
| Gemini Code Assist       | Yes (PR comments)       | No                                 | /pr-review + /add-debt      | No (markdown comments only) | High — fully manual copy/paste                  |
| npm audit                | No (not in CI)          | No                                 | None documented             | Yes (npm audit --json)      | High — not even in CI                           |
| Dependabot               | Yes (PRs)               | No                                 | None                        | Yes (GitHub API)            | High — no vulnerability tracking                |
| ESLint                   | Yes (blocks CI)         | No                                 | None                        | Yes (--format json)         | Medium — warn-level suppressions invisible      |
| TypeScript               | Yes (blocks CI)         | No                                 | None                        | Yes (--noEmit reports)      | Low — blocking failures prevent merge           |
| Semgrep                  | Yes (SARIF to GitHub)   | No                                 | None                        | Yes (GitHub Security API)   | High — findings invisible to TDMS               |
| CodeQL                   | Yes (SARIF to GitHub)   | No                                 | None                        | Yes (GitHub Security API)   | High — findings invisible to TDMS               |
| GitHub Issues            | Pattern compliance only | No                                 | None                        | Yes (GitHub REST API)       | High — no bidirectional sync                    |
| known-debt-baseline.json | Yes (pre-commit)        | No                                 | None                        | N/A (local file)            | Medium — shadow store, unreconciled             |

---

## Sources

All findings derived from direct filesystem inspection of the codebase. No
external sources were consulted.

| #   | Path                                             | Type           | Trust | Notes                                                                   |
| --- | ------------------------------------------------ | -------------- | ----- | ----------------------------------------------------------------------- |
| 1   | `scripts/debt/sync-sonarcloud.js`                | Implementation | HIGH  | Primary SonarCloud integration — 923 lines, well-documented             |
| 2   | `.claude/skills/sonarcloud/SKILL.md`             | Skill doc      | HIGH  | Authoritative operation guide, v1.0 2026-02-05                          |
| 3   | `.claude/skills/pr-review/SKILL.md`              | Skill doc      | HIGH  | Defines CodeRabbit/Qodo/Gemini as manual-paste sources, v4.6 2026-03-18 |
| 4   | `.github/workflows/sonarcloud.yml`               | CI config      | HIGH  | No TDMS trigger step present                                            |
| 5   | `.github/workflows/codeql.yml`                   | CI config      | HIGH  | SARIF upload only, no TDMS bridge                                       |
| 6   | `.github/workflows/semgrep.yml`                  | CI config      | HIGH  | SARIF upload only, no TDMS bridge                                       |
| 7   | `.github/dependabot.yml`                         | CI config      | HIGH  | PR-based updates, no TDMS integration                                   |
| 8   | `.github/workflows/dependency-review.yml`        | CI config      | HIGH  | CI block only, no TDMS                                                  |
| 9   | `.github/workflows/auto-merge-dependabot.yml`    | CI config      | HIGH  | Auto-merge minor/patch, no debt tracking                                |
| 10  | `.github/workflows/pattern-compliance-audit.yml` | CI config      | HIGH  | Creates GitHub Issues (not TDMS items) on violations                    |
| 11  | `.github/workflows/resolve-debt.yml`             | CI config      | HIGH  | One-way: PR merge → TDMS resolution (via Resolves: lines)               |
| 12  | `.github/workflows/ci.yml`                       | CI config      | HIGH  | ESLint/TypeScript run but findings not captured to TDMS                 |
| 13  | `.claude/state/known-debt-baseline.json`         | State file     | HIGH  | 29+16 file exemptions, no TDMS IDs, last updated 2026-03-19             |
| 14  | `.qodo/pr-agent.toml`                            | Config         | HIGH  | 21 suppression rules, no data bridge                                    |
| 15  | `.gemini/config.yaml` + `styleguide.md`          | Config         | HIGH  | Ignore patterns and review config only                                  |
| 16  | `eslint.config.mjs`                              | Implementation | HIGH  | Zero-warning overrides for scripts/hooks suppress visibility            |
| 17  | `scripts/health/checkers/security.js`            | Implementation | HIGH  | npm audit as health metric only, no TDMS write                          |
| 18  | `docs/technical-debt/MASTER_DEBT.jsonl`          | Data           | HIGH  | Source_file distribution shows actual intake pathways                   |
| 19  | `.claude/skills/add-debt/SKILL.md`               | Skill doc      | HIGH  | Defines manual intake workflow, v2.0 2026-03-20                         |

---

## Contradictions

**SonarCloud "sync" vs. CI trigger:** The sonarcloud.yml workflow name implies
automation, and the sync-sonarcloud.js script is robust. But the CI workflow
never calls the sync script. The gap between "we have a sync script" and "CI
does not run it" is the central contradiction in the SonarCloud story.

**Pattern compliance GitHub Issues vs. TDMS:** The
`pattern-compliance-audit.yml` workflow creates GitHub Issues labeled
`tech-debt` but does not create TDMS items. This creates a parallel debt
tracking channel that the TDMS system is unaware of.

---

## Gaps

1. **No GitHub Security API integration:** There is no script that reads Semgrep
   or CodeQL alerts from the GitHub Security API (`/code-scanning/alerts`).
   Whether alerts accumulate there unremediated is unknown without API access.

2. **npm audit current status:** Whether npm audit currently reports any
   vulnerabilities was not verified (would require running `npm audit --json`
   live).

3. **Dependabot PR count:** How many Dependabot PRs are currently open and
   whether any represent security vulnerabilities (vs. just version updates) was
   not verified.

4. **CodeRabbit live status:** Whether CodeRabbit is still an active reviewer on
   this repo (vs. only Qodo and Gemini) was not confirmed. The backup hook file
   suggests it was used but may be deprecated.

5. **sonarcloud-paste data quality:** The 286 items with
   `source_file: "sonarcloud-dashboard-paste-2026-02-20"` entered through manual
   copy/paste. Their mapping fidelity (compared to API-synced items) was not
   examined.

---

## Serendipity

**resolve-debt.yml is the only automated TDMS write from CI.** This workflow
runs on PR merge and resolves DEBT-XXXX items when `Resolves: DEBT-XXXX` lines
appear in the PR body. This is a meaningful existing hook — it demonstrates the
CI pipeline CAN write to TDMS, and the pattern could be extended (e.g.,
auto-create items from Dependabot advisories).

**The zero-warning ESLint override for scripts/ is a deliberate debt
accumulator.** By turning off all warn-level rules for `scripts/**` and
`.claude/hooks/**`, the project accepts that these files will accumulate
technical debt invisibly. The known-debt-baseline.json is the only governance
mechanism for this zone, and it has no TDMS integration.

**`sonarcloud-dashboard-paste` source_file reveals a pre-API workflow.** Before
sync-sonarcloud.js existed (or when SONAR_TOKEN wasn't available), items were
manually copied from the SonarCloud dashboard and pasted in. 286 items entered
this way. This historical data quality discrepancy (paste items have less
structured metadata than API-synced items) may affect deduplication when
sync-sonarcloud.js runs for similar issues.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
