---
name: sonarcloud
description: |
  Unified SonarCloud integration skill for fetching, syncing, reporting, and
  resolving code quality issues. This skill should be used when working with
  SonarCloud data: syncing new issues to TDMS, generating reports with code
  snippets, marking resolved items, running cleanup sprints, or checking
  quality gate status. Consolidates sonarcloud-sprint and sync-sonarcloud-debt
  into a single entry point.
metadata:
  short-description: Fetch, sync, report, and resolve SonarCloud issues
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# SonarCloud Integration

Unified orchestrator for all SonarCloud operations against the TDMS (Technical
Debt Management System).

## Modes

| Mode        | Flag        | Purpose                                                              |
| ----------- | ----------- | -------------------------------------------------------------------- |
| **sync**    | (default)   | Fetch issues from API, diff against MASTER_DEBT.jsonl, add new items |
| **resolve** | `--resolve` | Detect items no longer in SonarCloud, mark as RESOLVED               |
| **full**    | `--full`    | Sync new + resolve old in one pass                                   |
| **report**  | `--report`  | Generate detailed markdown report with code snippets                 |
| **status**  | `--status`  | Quick quality gate check and issue count summary                     |
| **sprint**  | `--sprint`  | Full cleanup workflow: sync + report + create cleanup branch         |

---

## Prerequisites

1. **SONAR_TOKEN** environment variable (decrypt if needed):
   ```bash
   node scripts/secrets/decrypt-secrets.js
   ```
2. **SONAR_ORG** environment variable (default: `jasonmichaelbell78`)
3. **sonar-project.properties** must exist with valid project key
4. **MASTER_DEBT.jsonl** must exist at `docs/technical-debt/MASTER_DEBT.jsonl`

To verify prerequisites:

```bash
cat sonar-project.properties | grep sonar.projectKey
echo "SONAR_TOKEN set: $([ -n "$SONAR_TOKEN" ] && echo YES || echo NO)"
echo "SONAR_ORG set: $([ -n "$SONAR_ORG" ] && echo YES || echo NO)"
```

---

## Mode: sync (default)

Fetch open issues from SonarCloud API, deduplicate against existing items,
append new items to MASTER_DEBT.jsonl, and regenerate views.

### Execution

```bash
# Preview what would be added (no changes written)
node scripts/debt/sync-sonarcloud.js --dry-run

# Sync all new issues (prompts for confirmation)
node scripts/debt/sync-sonarcloud.js

# Sync without confirmation prompt
node scripts/debt/sync-sonarcloud.js --force

# Filter by severity
node scripts/debt/sync-sonarcloud.js --severity BLOCKER,CRITICAL --force
```

### What Happens

1. Fetches open/confirmed/reopened issues from SonarCloud API (paginated, max
   10,000)
2. Loads existing MASTER_DEBT.jsonl
3. Deduplicates by sonar_key and content_hash
4. Assigns next DEBT-XXXX IDs to new items
5. Appends to both `raw/deduped.jsonl` and MASTER_DEBT.jsonl
6. Logs to `docs/technical-debt/logs/intake-log.jsonl`
7. Regenerates views via `generate-views.js`
8. **Placement phase** (see [Post-Sync: Placement](#post-sync-placement) below)

### Output Fields (TDMS Schema)

Each synced item includes:

- `id`: `DEBT-XXXX`
- `source_id`: `sonarcloud:{issue-key}`
- `source_file`: `sonarcloud-sync`
- `category`: code-quality | security | performance | documentation
- `severity`: S0 (BLOCKER/CRITICAL) | S1 (MAJOR) | S2 (MINOR) | S3 (INFO)
- `sonar_key`: SonarCloud issue key for tracking

---

## Mode: resolve

Detect SonarCloud-sourced items in MASTER_DEBT.jsonl whose sonar_key no longer
appears in the SonarCloud API (issue was fixed externally). Mark those as
RESOLVED.

### Execution

```bash
# Preview resolutions (no changes)
node scripts/debt/sync-sonarcloud.js --resolve --dry-run

# Resolve missing items
node scripts/debt/sync-sonarcloud.js --resolve --force

# Full pass: sync new + resolve old
node scripts/debt/sync-sonarcloud.js --full --force
```

### What Happens

1. Fetches all open issues from SonarCloud API
2. Builds set of active sonar_keys
3. Scans MASTER_DEBT.jsonl for items with `source_file: "sonarcloud-sync"` and
   `status: "NEW"`
4. Any item whose `sonar_key` is NOT in active set gets marked RESOLVED
5. Updates resolution fields: `status`, `resolution`, `resolved_date`
6. Logs to `docs/technical-debt/logs/resolution-log.jsonl`
7. Regenerates views

---

## Mode: report

Generate a detailed markdown report with code snippets, severity breakdowns, and
rule references. Requires fetching data from the SonarCloud API first.

### Execution

```bash
# Step 1: Fetch data from SonarCloud API using the sync script
# (Avoids exposing SONAR_TOKEN on the command line)
node scripts/debt/sync-sonarcloud.js --dry-run

# Step 2: Generate detailed report with code snippets
node scripts/generate-detailed-sonar-report.js
```

> **Security Note:** Never use inline `curl -u "$SONAR_TOKEN:"` commands, as
> tokens may appear in shell history and process listings. The sync script reads
> the token from environment variables internally.

### Output

Report written to: `docs/audits/sonarcloud-issues-detailed.md`

Contents include:

- Executive summary (severity/type distribution)
- Top 20 files with most issues
- Rule reference table
- BLOCKER/CRITICAL issues with code snippets
- Security hotspots with vulnerability probability
- All issues organized by file

---

## Post-Sync: Placement

**REQUIRED** after any sync or full mode that adds new items. Present the user
with a rich placement analysis before auto-assigning roadmap references.

### Step 1: Run Assignment (Dry-Run)

```bash
node scripts/debt/assign-roadmap-refs.js --dry-run --report
```

### Step 2: Present Severity-Weighted Placement Summary

Compute and display inline (severity weights: S0=10, S1=5, S2=2, S3=1):

```
| Track           | Total |  S0 |  S1 |  S2 |  S3 | Weight |
|-----------------|-------|-----|-----|-----|-----|--------|
| Track-E         |   870 | ... | ... | ... | ... |  2,965 |
| M2.1            |   663 | ... | ... | ... | ... |  1,589 |
| ...             |       |     |     |     |     |        |
| TOTAL           | 1,850 | 141 | 336 |1064 | 309 |  5,527 |
```

### Step 3: Must-Fix-Now Analysis

Highlight S0 vulnerabilities and bugs separately from S0 code-smells:

- **S0 Vulnerabilities/Bugs**: List each with ID, track, and title — these are
  genuine critical items
- **S0 Code-Smells**: Show count per track — these are complexity/style issues
  that may warrant severity downgrade

### Step 4: Concentration Risk Analysis

For any track carrying >40% of total weight:

- Show file-pattern breakdown of S0/S1 items in that track
- **Pros** of keeping current assignment
- **Cons** of keeping current assignment
- **Suggestion**: Downgrade, split sub-track, or keep as-is

### Step 5: Present Options to User

Use `AskUserQuestion` to offer:

1. **Approve as-is** — accept auto-assignments
2. **Downgrade S0 code-smells** — reclassify non-vulnerability S0s to S1 in
   heavy tracks (canonical rule: script cognitive-complexity S0 → S1)
3. **Custom adjustment** — user specifies track reassignments

### Step 6: Apply and Sync

After user approval:

```bash
node scripts/debt/assign-roadmap-refs.js --report
```

Then sync `raw/deduped.jsonl` from MASTER_DEBT.jsonl and regenerate:

```bash
cp docs/technical-debt/MASTER_DEBT.jsonl docs/technical-debt/raw/deduped.jsonl
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

### Canonical Severity Rules

These severity adjustments are standing policy (apply automatically):

| Condition                      | Action          | Rationale                                    |
| ------------------------------ | --------------- | -------------------------------------------- |
| Track-E + S0 + type=code-smell | Downgrade to S1 | Script complexity is not production-critical |

Additional rules may be added here as the team establishes more patterns.

---

## Mode: status

Quick quality gate status and issue count check via the MCP server.

### Execution

Use the SonarCloud MCP tools directly:

```
mcp__sonarcloud__get_quality_gate(projectKey: "jasonmichaelbell78_sonash-v0")
mcp__sonarcloud__get_issues(projectKey: "jasonmichaelbell78_sonash-v0", severities: "BLOCKER,CRITICAL")
```

Or via curl:

```bash
curl -s -u "$SONAR_TOKEN:" \
  "https://sonarcloud.io/api/qualitygates/project_status?projectKey=jasonmichaelbell78_sonash-v0" \
  | jq '.projectStatus.status'
```

---

## Mode: sprint

Full cleanup workflow: sync + report + create cleanup branch + track fixes.

### Execution

1. Run sync to get latest state:

   ```bash
   node scripts/debt/sync-sonarcloud.js --force
   ```

2. Generate detailed report:

   ```bash
   # Fetch + generate (see report mode above)
   ```

3. Create cleanup branch:

   ```bash
   git checkout -b cleanup/sonarcloud-$(date +%Y%m%d)
   ```

4. Fix issues using the report as guide. Track progress with TodoWrite.

5. Create PR:
   ```bash
   gh pr create --title "fix: SonarCloud cleanup sprint $(date +%Y-%m-%d)" \
     --body "Fixes SonarCloud issues identified in sonarcloud-issues-detailed.md"
   ```

### 5-PR Structure (for large cleanups)

| PR  | Focus                                | Typical Count |
| --- | ------------------------------------ | ------------- |
| 1   | Mechanical fixes (imports, require)  | ~189          |
| 2   | Critical severity (BLOCKER/CRITICAL) | ~107          |
| 3   | Major code quality                   | ~220          |
| 4   | Medium/minor issues                  | ~1,095        |
| 5   | Security hotspots                    | ~97           |

---

## Project Configuration

| Setting      | Value                              |
| ------------ | ---------------------------------- |
| Project Key  | `jasonmichaelbell78_sonash-v0`     |
| Organization | `jasonmichaelbell78`               |
| Config File  | `sonar-project.properties`         |
| CI Workflow  | `.github/workflows/sonarcloud.yml` |
| MCP Server   | `scripts/mcp/sonarcloud-server.js` |

---

## API Endpoints Reference

| Endpoint                           | Purpose                                           |
| ---------------------------------- | ------------------------------------------------- |
| `/api/issues/search`               | Fetch code issues (bugs, smells, vulnerabilities) |
| `/api/hotspots/search`             | Fetch security hotspots                           |
| `/api/qualitygates/project_status` | Quality gate pass/fail                            |
| `/api/measures/component`          | Project metrics (coverage, duplication)           |

---

## Scripts Reference

| Script                                      | Purpose                          | Status  |
| ------------------------------------------- | -------------------------------- | ------- |
| `scripts/debt/sync-sonarcloud.js`           | Fetch + sync + resolve           | ACTIVE  |
| `scripts/generate-detailed-sonar-report.js` | Detailed report with snippets    | ACTIVE  |
| ~~`scripts/debt/verify-sonar-phase.js`~~    | ~~Verify cleanup phase results~~ | REMOVED |
| `scripts/mcp/sonarcloud-server.js`          | MCP server for direct LLM access | ACTIVE  |

---

## Related

- `verify-technical-debt` - Verify items in verification queue
- `add-debt` - Add items to TDMS (manual or PR-deferred)
- [SONARCLOUD_CLEANUP_RUNBOOK.md](../../../docs/SONARCLOUD_CLEANUP_RUNBOOK.md) -
  Operational runbook
- [PROCEDURE.md](../../../docs/technical-debt/PROCEDURE.md) - TDMS operating
  procedures
