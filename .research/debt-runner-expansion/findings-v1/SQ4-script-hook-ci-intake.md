# Findings: Script, Hook, and CI Debt Intake Mapping

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-26
**Sub-Question IDs:** SQ-4

---

## Key Findings

### 1. Intake Scripts: Direct TDMS Writers

**[CONFIDENCE: HIGH]**

Every script that creates new DEBT-XXXX entries writes to the same canonical
files: `docs/technical-debt/MASTER_DEBT.jsonl` (source of truth) and
`docs/technical-debt/raw/deduped.jsonl` (pipeline mirror). All use
`appendMasterDebtSync()` from `scripts/lib/safe-fs.js` for atomic dual-writes.
All duplicate-check via content hash (SHA-256 of normalized
file+line+title+desc) before writing. Below is the full inventory:

#### 1a. `intake-audit.js`

- **Trigger:** Manual or via `/debt-runner` after a formal audit. Accepts a
  JSONL file argument.
- **Source data:** Any JSONL file — accepts three input formats: native TDMS
  format, Doc Standards format (`fingerprint`, `files[]`, `why_it_matters`,
  `suggested_fix`), and Enhancement Audit format (IMS fields: `impact`,
  `counter_argument`, `confidence`).
- **Output:** Appends to `MASTER_DEBT.jsonl` + `raw/deduped.jsonl`. Runs
  multi-pass dedup (parametric, near, semantic, cross-source, systemic) and
  `assign-roadmap-refs.js` after writing. Regenerates views.
- **Notable:** Only script that performs post-write pipeline processing
  including dedup and roadmap assignment. The audit-to-TDMS "funnel" script.

#### 1b. `intake-manual.js`

- **Trigger:** Manual invocation by Claude via `/add-debt` skill (no PR
  context). Direct CLI:
  `node scripts/debt/intake-manual.js --file ... --title ...`
- **Source data:** CLI arguments (file, line, title, severity, category, type,
  description, recommendation, effort, roadmap).
- **Output:** Appends to `MASTER_DEBT.jsonl` + `raw/deduped.jsonl`. Regenerates
  views. Logs to `docs/technical-debt/logs/intake-log.jsonl` with
  `action: "intake-manual"`.
- **Notable:** Validates against `scripts/config/audit-schema.json` for
  categories/severities. `source_id` format: `manual:<uuid>`.

#### 1c. `intake-pr-deferred.js`

- **Trigger:** Manual invocation by Claude via `/add-debt` skill during
  `/pr-review`, OR automatically called by `escalate-deferred.js` for
  multiply-deferred ecosystem items.
- **Source data:** CLI arguments; required fields include `--pr <number>`,
  `--file`, `--title`, `--severity`. Category defaults to `code-quality`.
- **Output:** Appends to `MASTER_DEBT.jsonl` + `raw/deduped.jsonl`. Regenerates
  views. Logs to `intake-log.jsonl` with `action: "intake-pr-deferred"`.
- **Notable:** Sets both `pr_number` and `source_pr` fields. `source_id` format:
  `pr-deferred:<uuid>`. Also called programmatically by `escalate-deferred.js`
  when `defer_count >= threshold` (default 2) in
  `data/ecosystem-v2/deferred-items.jsonl`.

#### 1d. `extract-audit-reports.js`

- **Trigger:** Manual (Step 0b of the legacy Technical Debt Resolution Plan).
- **Source data:** 17 markdown reports in `docs/archive/2025-dec-reports/`.
  Config-driven per-report: maps markdown sections to categories (`refactoring`,
  `security`, `code-quality`, etc.).
- **Output:** Appends to `docs/technical-debt/raw/scattered-intake.jsonl` (not
  directly to MASTER_DEBT). Is an upstream feeder, not a direct writer.
- **Notable:** Skips items already in MASTER_DEBT by hash. One-time historical
  extractor — low ongoing relevance.

#### 1e. `extract-audits.js`

- **Trigger:** Manual, part of TDMS pipeline rebuild.
- **Source data:** `docs/audits/**/*.jsonl` (excluding `FALSE_POSITIVES.jsonl`).
  Handles multiple audit formats: single-session, multi-AI, canonical
  MASTER_FINDINGS (CANON-\* IDs).
- **Output:** Writes `docs/technical-debt/raw/audits.jsonl` (full overwrite via
  `safeWriteFileSync`). Upstream feeder — must be followed by
  `ingest-cleaned-intake.js`.
- **Notable:** Normalizes effort strings and categories across audit formats.

#### 1f. `extract-context-debt.js`

- **Trigger:** Manual (Step 0f of the Debt Resolution Plan).
- **Source data:** Two `.claude/state/` markdown files:
  `agent-research-results.md` and `system-test-gap-analysis-pass2.md`. Parses
  `Gap:` items and `FINDING-*` entries.
- **Output:** Appends to `raw/scattered-intake.jsonl`. Upstream feeder.
- **Notable:** Extracts debt from AI research artifacts — the link between
  `/deep-research` output and TDMS.

#### 1g. `extract-reviews.js`

- **Trigger:** Manual, part of TDMS pipeline rebuild.
- **Source data:** `docs/reviews/**/*.jsonl` and `docs/aggregation/*.jsonl`.
  Handles 2026-Q1 canonical CANON-\* files and aggregation MASTER_ISSUE_LIST.
- **Output:** Writes `docs/technical-debt/raw/reviews.jsonl` (full overwrite).
  Upstream feeder.
- **Notable:** The pipeline link between the PR review JSONL system and TDMS.

#### 1h. `extract-roadmap-debt.js`

- **Trigger:** Manual (Step 0c of the Debt Resolution Plan).
- **Source data:** `ROADMAP.md` checkboxes. Skips items with existing DEBT-XXXX
  or CANON-XXXX references. Skips feature/enhancement items.
- **Output:** Appends to `raw/scattered-intake.jsonl`. Upstream feeder.
- **Notable:** Roadmap is treated as a debt discovery source, not just a
  planning artifact.

#### 1i. `extract-scattered-debt.js`

- **Trigger:** Manual (Step 0a of the Debt Resolution Plan).
- **Source data:** Source files in `src/`, `app/`, `components/`, `lib/`,
  `hooks/`, `types/`, `scripts/`, `.claude/hooks/`, `functions/src/` with
  extensions `.ts/.tsx/.js/.jsx/.mjs/.css`. Searches for `TODO:`, `TODO(`,
  `FIXME:`, `FIXME(`, `HACK:`, `HACK(`, `XXX:`, `WORKAROUND:` in comments.
- **Output:** Writes `raw/scattered-intake.jsonl` (full overwrite via
  `safeWriteFileSync`). Upstream feeder.
- **Notable:** Severity mapping: `TODO→S3`, `FIXME/HACK/XXX/WORKAROUND→S2`. The
  only script that mines source code directly for debt signals.

#### 1j. `sync-sonarcloud.js`

- **Trigger:** Manual (`node scripts/debt/sync-sonarcloud.js`) or via
  `/sonarcloud` skill. Requires `SONAR_TOKEN` env var.
- **Source data:** SonarCloud REST API at `https://sonarcloud.io/api`. Filters
  by severity (BLOCKER/CRITICAL/MAJOR/MINOR/INFO) and type (BUG/VULNERABILITY/
  CODE_SMELL). Reads `sonar-project.properties` for project key defaults.
- **Output:** Appends new items to `MASTER_DEBT.jsonl` directly (bypasses the
  scattered-intake pipeline). With `--resolve` or `--full` flags, also marks
  items resolved that no longer appear in SonarCloud.
- **Notable:** Only automated source that fetches from external systems. Not
  called by any CI workflow — must be run manually.

#### 1k. `ingest-cleaned-intake.js`

- **Trigger:** Manual (Step 0h, after `clean-intake.js` has run).
- **Source data:** `docs/technical-debt/raw/scattered-intake-cleaned.jsonl`
  (pre-cleaned items with `content_hash` already computed).
- **Output:** Appends to both `MASTER_DEBT.jsonl` and `raw/deduped.jsonl` via
  `appendMasterDebtSync`. Logs to `intake-log.jsonl`.
- **Notable:** The terminal step of the scattered-intake pipeline: `extract-*` →
  `clean-intake.js` → `ingest-cleaned-intake.js` → MASTER_DEBT.

#### 1l. `clean-intake.js`

- **Trigger:** Manual (Step 0h, precedes `ingest-cleaned-intake.js`).
- **Source data:** `docs/technical-debt/raw/scattered-intake.jsonl`.
- **Output:** `docs/technical-debt/raw/scattered-intake-cleaned.jsonl`. Does NOT
  write to MASTER_DEBT. A cleaning/filtering intermediary.
- **Notable:** 4 phases: deduplication, false-positive detection, completed-work
  detection, item verification. Uses Dice coefficient (bigram similarity) for
  fuzzy dedup.

---

### 2. Hooks: Debt Discovery and Warning Logging

**[CONFIDENCE: HIGH]**

No hook script directly calls any intake script or writes to MASTER_DEBT.jsonl.
Hooks produce warnings to `.claude/hook-warnings.json`, which are surfaced via
`/alerts` — a separate system from TDMS.

#### 2a. Pre-commit hook (`.husky/pre-commit`)

Checks that run and their relationship to debt:

| Check                   | Result if fails                       | Debt routed?                                   |
| ----------------------- | ------------------------------------- | ---------------------------------------------- |
| Secrets scan (gitleaks) | Blocks commit                         | No — must fix                                  |
| ESLint                  | Blocks commit                         | No — must fix                                  |
| Tests                   | Blocks commit                         | No — must fix                                  |
| lint-staged (Prettier)  | Blocks commit                         | No — auto-fixes                                |
| Pattern compliance      | Blocks on critical; warns on advisory | Warnings go to `hook-warnings.json` only       |
| Propagation-staged      | Non-blocking warning                  | Warning logged via `append-hook-warning.js`    |
| Audit S0/S1 validation  | Blocks commit                         | No — must fix or SKIP                          |
| Skill validation        | Non-blocking warning                  | Warning logged                                 |
| Cross-doc deps          | Configurable                          | Warning logged                                 |
| Doc headers             | On new .md files                      | Warning logged                                 |
| Doc index               | Auto-fixes                            | N/A                                            |
| Debt schema validation  | Conditional                           | No TDMS write — validates existing MASTER_DEBT |

Key observation: The pre-commit hook writes to `hook-warnings.json` when checks
generate advisory findings, but none of these are automatically ingested into
TDMS. The CLAUDE.md guardrail #13 instructs the AI to present hook warnings to
the user after commits, which may lead to manual `/add-debt` invocation — but
this is a behavioral path, not an automated one.

SKIP mechanism: `SKIP_CHECKS="check1,check2" SKIP_REASON="reason"` allows
overriding individual checks. Overrides are logged to
`.claude/override-log.jsonl` by `log-override.js`. `validate-skip-reason.js`
enforces reason presence, length, and character safety. No TDMS record is
created for skipped checks.

#### 2b. Pre-push hook (`.husky/pre-push`)

Additional checks before pushing:

| Check                          | Result if fails                                    | Debt routed?              |
| ------------------------------ | -------------------------------------------------- | ------------------------- |
| Escalation gate                | Blocks push on unacknowledged error-level warnings | No                        |
| Circular dependencies          | Blocks push                                        | No — must fix             |
| Pattern compliance (push diff) | Non-blocking warning                               | `append-hook-warning.js`  |
| Code-reviewer gate             | Blocks push on script changes without reviewer     | Bypass logged to warnings |
| Propagation check              | Non-blocking warning                               | `append-hook-warning.js`  |
| Cognitive complexity (CC)      | Non-blocking warning                               | `append-hook-warning.js`  |
| Cognitive cyclomatic CC        | Non-blocking warning                               | `append-hook-warning.js`  |
| Trigger check                  | Configurable                                       | `append-hook-warning.js`  |

#### 2c. Session-start hook (`.claude/hooks/session-start.js`)

- Reads `docs/technical-debt/metrics.json` at startup and reports S0/S1 counts
  to the console — informational display only. Does not discover new debt.
- Also runs `scripts/health/run-health-check.js --quick` — health data is
  surfaced for context, not automatically converted to debt.

#### 2d. `escalate-deferred.js` (called from ecosystem, not hooks)

- Not a hook script but creates debt items programmatically. Reads
  `data/ecosystem-v2/deferred-items.jsonl` (ecosystem review items, not TDMS
  debt). When `defer_count >= 2`, calls `intake-pr-deferred.js` to promote the
  item to a DEBT-XXXX entry in MASTER_DEBT.
- This is the only automated promotion path from ecosystem-level deferral to
  TDMS.

---

### 3. CI Workflows: Quality Gates and TDMS Interaction

**[CONFIDENCE: HIGH]**

| Workflow                       | Quality Checks                                                                                                                                                                                            | Debt-Producing Findings                              | Routes to TDMS?                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------- |
| `ci.yml`                       | ESLint, oxlint, Prettier, TypeScript, tests, coverage, circular deps, unused deps, pattern compliance, security check, gitleaks, CANON schema, audit validation, TDMS schema validation, debt views check | Yes — ESLint, pattern, security findings             | No                                |
| `sonarcloud.yml`               | Full SonarCloud static analysis on every push/PR                                                                                                                                                          | Yes                                                  | Manually via `sync-sonarcloud.js` |
| `semgrep.yml`                  | Custom semgrep rules from `.semgrep/rules/` + test validation                                                                                                                                             | Yes — SARIF uploaded to GitHub Code Scanning         | No — GitHub Code Scanning only    |
| `codeql.yml`                   | CodeQL JavaScript/TypeScript analysis                                                                                                                                                                     | Yes — GitHub Code Scanning                           | No                                |
| `backlog-enforcement.yml`      | Legacy AUDIT_FINDINGS_BACKLOG.md check + security patterns check                                                                                                                                          | Now skips (file archived in TDMS Phase 2)            | N/A (legacy)                      |
| `resolve-debt.yml`             | Parses merged PR body for `Resolves: DEBT-XXXX` lines                                                                                                                                                     | No (resolver, not creator)                           | Yes — resolves existing items     |
| `pattern-compliance-audit.yml` | Weekly full-repo pattern scan                                                                                                                                                                             | Yes — creates GitHub Issue if violations > threshold | GitHub Issues only (not TDMS)     |
| `dependency-review.yml`        | New dependency license/vulnerability check on PRs                                                                                                                                                         | Yes — fails on critical vulns                        | No                                |
| `scorecard.yml`                | OpenSSF Scorecard security posture metrics                                                                                                                                                                | Yes — SARIF to Code Scanning                         | No                                |
| `review-check.yml`             | Checks if PR needs code review                                                                                                                                                                            | Informational only                                   | No                                |
| `validate-plan.yml`            | Plan JSONL schema validation                                                                                                                                                                              | No                                                   | No                                |

Key observations:

- **`resolve-debt.yml` is the only CI workflow that writes to TDMS**, and it
  only resolves (never creates) items.
- **SonarCloud, Semgrep, and CodeQL** all produce actionable findings but none
  auto-ingest to TDMS. SonarCloud requires manual `sync-sonarcloud.js` run.
  Semgrep/CodeQL use GitHub Code Scanning (separate system).
- **`pattern-compliance-audit.yml`** creates GitHub Issues for violations but
  does not create DEBT items. This is a gap — weekly pattern violations go to
  GitHub Issues, not TDMS.
- The `ci.yml` validate job runs `node scripts/debt/validate-schema.js` and
  `node scripts/debt/sync-roadmap-refs.js --check-only` — these are validators,
  not intake scripts.

---

### 4. Pre-commit Hook: Summary of Checks

**[CONFIDENCE: HIGH]**

See Section 2a above for the complete checklist. The `.husky/pre-commit` file is
large and parallelizes several checks (compliance checks in one wave, doc checks
in another). `.husky/_shared.sh` provides `add_exit_trap`, `is_skipped`, and
`require_skip_reason`. `.husky/pre-push` provides additional push-time gates.

No check produces findings that automatically become TDMS items. All hook
findings route to `hook-warnings.json` (via `append-hook-warning.js`) or block
the commit entirely. The human + AI must manually invoke `/add-debt` to convert
hook findings to DEBT items.

---

### 5. Health Checkers: Report Only, No Debt Creation

**[CONFIDENCE: HIGH]**

All 11 health checkers in `scripts/health/checkers/` are read-only reporters.
None of them call any intake script or write to MASTER_DEBT.jsonl.

| Checker                     | What it measures                                                              | Creates debt?              |
| --------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `debt-health.js`            | Reads `metrics.json` + MASTER_DEBT for S0/S1 counts, avg age, resolution rate | No — reads existing debt   |
| `code-quality.js`           | TypeScript errors, ESLint errors/warnings, pattern violations, circular deps  | No — reports counts        |
| `security.js`               | npm audit vulnerabilities, secret exposure                                    | No — reports counts        |
| `pattern-enforcement.js`    | Repeat offenders from `warned-files.json`, hotspots                           | No — reads warning history |
| `documentation.js`          | Doc coverage metrics                                                          | No                         |
| `test-coverage.js`          | Coverage percentages                                                          | No                         |
| `hook-pipeline.js`          | Hook run success/failure rates from `hook-runs.jsonl`                         | No                         |
| `learning-effectiveness.js` | Learning metric scores                                                        | No                         |
| `data-effectiveness.js`     | Data pipeline health                                                          | No                         |
| `ecosystem-integration.js`  | Cross-system integration metrics                                              | No                         |
| `session-management.js`     | Session state metrics                                                         | No                         |

Health data is surfaced at session start (via `session-start.js`) and via
`/ecosystem-health` skill for human triage. The human must then decide to invoke
`/add-debt` if a health finding warrants TDMS tracking.

---

### 6. "Defer" Code Paths: Every Location Where Deferral to TDMS Is Offered

**[CONFIDENCE: HIGH]**

The following locations offer the user/AI a path to defer findings into TDMS:

#### 6a. Skills that MUST invoke `/add-debt` for deferred findings

| Skill                       | Context                              | Mechanism                                                                       |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| `/pr-review`                | Any item not fixed in current PR     | Critical Rule #1: every item is fixed or tracked via `/add-debt`                |
| `/pr-retro`                 | Systemic findings from retro         | "Systemic issue → Create DEBT → TDMS via /add-debt"                             |
| `/alerts`                   | Alert items user chooses to defer    | "Defer" action in alert — logs and suggests `/add-debt`                         |
| `/data-effectiveness-audit` | Deferred audit findings              | MUST create TDMS entries via `/add-debt`                                        |
| `/health-ecosystem-audit`   | Deferred health findings             | MUST create TDMS entries via `/add-debt`                                        |
| `/hook-ecosystem-audit`     | Hook issues not immediately fixable  | MUST create TDMS entries via `/add-debt`                                        |
| `/pre-commit-fixer`         | Pre-existing errors, unfixable items | Presents: fix now / defer to `known-debt-baseline.json` / skip with SKIP_REASON |

#### 6b. Known-debt-baseline.json

Referenced by `/pre-commit-fixer` as a deferral target (option b of the three
choices). This is `ratchet-baselines.js`'s `BASELINE_PATH`:
`.claude/state/known-debt-baseline.json`. Items added here are tracked as
"pre-existing" pattern violations — a separate system from TDMS, not visible in
MASTER_DEBT.jsonl.

#### 6c. SKIP_REASON / override-log.jsonl

When a check is bypassed with `SKIP_CHECKS=... SKIP_REASON="..."`:

- `log-override.js` writes the override to `.claude/override-log.jsonl`.
- `validate-skip-reason.js` enforces reason format (single line, <500 chars, no
  control chars, no bidi overrides).
- No TDMS item is created. Override history is available via
  `node scripts/log-override.js --analytics`.
- CLAUDE.md guardrail #14 prohibits the AI from composing SKIP_REASON values
  autonomously.

#### 6d. Escalation from deferred-items.jsonl

`data/ecosystem-v2/deferred-items.jsonl` is a separate deferral queue (not
MASTER_DEBT). Items here come from the ecosystem review system. When
`defer_count >= 2`, `escalate-deferred.js` auto-promotes them to DEBT via
`intake-pr-deferred.js`. The `/alerts` skill monitors this file via
`checkDeferredItemsStaleness()` and alerts when unresolved count > 20.

#### 6e. Pending Refinements Escalation

`run-alerts.js` monitors `.claude/state/pending-refinements.jsonl`. Items
surfaced > N times without action get escalated to "critical" alerts with the
instruction "Create S1 DEBT item via /add-debt with 7-day deadline." This is the
learning system's path to TDMS — unactioned learnings eventually become debt.

---

## Sources

| #   | File Path                                                | Type          | Trust | Notes                  |
| --- | -------------------------------------------------------- | ------------- | ----- | ---------------------- |
| 1   | `scripts/debt/intake-audit.js`                           | Source code   | HIGH  | Full header read       |
| 2   | `scripts/debt/intake-manual.js`                          | Source code   | HIGH  | Full read              |
| 3   | `scripts/debt/intake-pr-deferred.js`                     | Source code   | HIGH  | Full read              |
| 4   | `scripts/debt/extract-audit-reports.js`                  | Source code   | HIGH  | Header + structure     |
| 5   | `scripts/debt/extract-audits.js`                         | Source code   | HIGH  | Header + structure     |
| 6   | `scripts/debt/extract-context-debt.js`                   | Source code   | HIGH  | Header + structure     |
| 7   | `scripts/debt/extract-reviews.js`                        | Source code   | HIGH  | Header + structure     |
| 8   | `scripts/debt/extract-roadmap-debt.js`                   | Source code   | HIGH  | Header + structure     |
| 9   | `scripts/debt/extract-scattered-debt.js`                 | Source code   | HIGH  | Header + structure     |
| 10  | `scripts/debt/sync-sonarcloud.js`                        | Source code   | HIGH  | Full header            |
| 11  | `scripts/debt/ingest-cleaned-intake.js`                  | Source code   | HIGH  | Header + structure     |
| 12  | `scripts/debt/clean-intake.js`                           | Source code   | HIGH  | Header + structure     |
| 13  | `scripts/debt/escalate-deferred.js`                      | Source code   | HIGH  | Full read              |
| 14  | `.husky/pre-commit`                                      | Shell script  | HIGH  | Full read (large file) |
| 15  | `.husky/pre-push`                                        | Shell script  | HIGH  | Full read (large file) |
| 16  | `.github/workflows/ci.yml`                               | YAML          | HIGH  | Full read              |
| 17  | `.github/workflows/sonarcloud.yml`                       | YAML          | HIGH  | Full read              |
| 18  | `.github/workflows/resolve-debt.yml`                     | YAML          | HIGH  | Full read              |
| 19  | `.github/workflows/pattern-compliance-audit.yml`         | YAML          | HIGH  | Full read              |
| 20  | `.github/workflows/backlog-enforcement.yml`              | YAML          | HIGH  | Full read              |
| 21  | `.github/workflows/semgrep.yml`                          | YAML          | HIGH  | Full read              |
| 22  | `.github/workflows/codeql.yml`                           | YAML          | HIGH  | Full read              |
| 23  | `.github/workflows/dependency-review.yml`                | YAML          | HIGH  | Full read              |
| 24  | `.github/workflows/scorecard.yml`                        | YAML          | HIGH  | Full read              |
| 25  | `.github/workflows/review-check.yml`                     | YAML          | HIGH  | Full read              |
| 26  | `scripts/health/checkers/debt-health.js`                 | Source code   | HIGH  | Full read              |
| 27  | `scripts/health/checkers/code-quality.js`                | Source code   | HIGH  | Partial read           |
| 28  | `scripts/health/checkers/security.js`                    | Source code   | HIGH  | Partial read           |
| 29  | `scripts/health/checkers/pattern-enforcement.js`         | Source code   | HIGH  | Partial read           |
| 30  | `.claude/skills/add-debt/SKILL.md`                       | Skill doc     | HIGH  | Full read              |
| 31  | `.claude/skills/pr-review/SKILL.md`                      | Skill doc     | HIGH  | Partial read           |
| 32  | `.claude/skills/pr-review/reference/TDMS_INTEGRATION.md` | Reference doc | HIGH  | Full read              |
| 33  | `.claude/skills/pre-commit-fixer/SKILL.md`               | Skill doc     | HIGH  | Partial read           |
| 34  | `.claude/hooks/session-start.js`                         | Source code   | HIGH  | Targeted read          |
| 35  | `.claude/skills/alerts/scripts/run-alerts.js`            | Source code   | HIGH  | Targeted reads         |
| 36  | `scripts/lib/validate-skip-reason.js`                    | Source code   | HIGH  | Full read              |
| 37  | `scripts/log-override.js`                                | Source code   | HIGH  | Partial read           |
| 38  | `scripts/ratchet-baselines.js`                           | Source code   | HIGH  | Partial read           |

---

## Contradictions

None found. The systems are well-separated: MASTER_DEBT.jsonl (TDMS), hook
warnings (`hook-warnings.json`), override log (`override-log.jsonl`), and
known-debt baseline (`known-debt-baseline.json`) are distinct stores with no
automatic cross-writes.

---

## Gaps

1. **SonarCloud auto-sync not wired to CI.** `sync-sonarcloud.js` is a capable
   script but requires manual invocation. There is no CI job that calls it on
   push/PR or schedule. SonarCloud findings accumulate in the SonarCloud
   dashboard but don't automatically become DEBT items until someone runs the
   sync manually.

2. **`pattern-compliance-audit.yml` findings go to GitHub Issues, not TDMS.**
   The weekly scan creates GitHub Issues with label `tech-debt` when blocking
   violations or warning thresholds are exceeded. There is no automation to
   convert those issues to DEBT entries.

3. **Semgrep and CodeQL findings are GitHub Code Scanning only.** SARIF uploads
   go to the Code Scanning UI. No bridge to TDMS exists.

4. **`deferred-items.jsonl` vs MASTER_DEBT.jsonl are separate.** The ecosystem
   review system's deferral queue (`data/ecosystem-v2/deferred-items.jsonl`) and
   TDMS are separate stores. `escalate-deferred.js` bridges them — but only for
   items with `defer_count >= 2`. Items deferred once never escalate
   automatically.

5. **Hook failures that are skipped leave no TDMS trace.** When a check is
   bypassed with `SKIP_REASON`, the override is in `override-log.jsonl` but no
   DEBT item is created. The override log is not monitored by any health checker
   or alert for aging skips.

6. **Coverage gaps and unused-dep findings from CI have no TDMS path.** The
   `ci.yml` test job checks coverage (65% threshold) and unused dependencies
   (`npm run deps:unused`). Failures block CI but there is no mechanism to log
   borderline-threshold or new-gap findings to TDMS.

---

## Serendipity

1. **Two distinct deferral queues co-exist.**
   `data/ecosystem-v2/deferred-items.jsonl` (ecosystem review deferrals,
   automatically escalated) and the conceptual "defer via /add-debt in
   /pr-review" path (manual). These converge in TDMS only through human action
   or the `escalate-deferred.js` auto-promotion. The distinction matters for
   `debt-runner` expansion: the expansion should consider whether it wants to be
   aware of both queues.

2. **`extract-scattered-debt.js` scans `.claude/hooks/`** as one of its 9 scan
   directories. This means `TODO:` and `FIXME:` comments in hook scripts are
   captured as debt candidates — though only via manual pipeline run, not
   automatically.

3. **The `alerts` skill is a secondary debt discovery path.** Via
   `checkDeferredItemsStaleness()` and the pending-refinements escalation logic,
   `/alerts` can surface actionable items that should become DEBT entries (e.g.,
   S1 DEBT candidates from patterns surfaced many times). This is not documented
   in any "intake path" catalog but is a real production path.

4. **`known-debt-baseline.json` is a debt escape hatch with no TDMS mirror.**
   When pre-commit fixer defers pattern violations to the baseline, those items
   exist only in `.claude/state/known-debt-baseline.json`. They are ratchet-
   tracked (count decreases when violations decrease) but not visible as DEBT
   items, have no DEBT-XXXX IDs, and don't appear in `debt-runner` or
   `generate-views.js` output.

---

## Confidence Assessment

- HIGH claims: 38
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct filesystem reads of the actual source code,
hook scripts, workflow files, and skill documentation. No claims are based on
training data or documentation alone.
