---
name: eval-sonarcloud
description: |
  Evaluation wrapper for the /sonarcloud skill that validates the end-to-end
  pipeline: API fetch, deduplication, resolve logic, view regeneration, report
  generation, and schema integrity. Runs the REAL sonarcloud skill (not dry-run),
  instruments each stage, and produces a graded evaluation report with
  remediation guidance. No manual steps required.
metadata:
  short-description:
    Evaluate sonarcloud skill with real execution and graded report
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# SonarCloud Skill Evaluation

Automated evaluation wrapper that instruments a **real** `/sonarcloud` execution
and validates every stage of the pipeline.

## Purpose

This skill exists to validate that the `/sonarcloud` skill works as designed:

1. API Fetch - Connectivity, pagination, error handling
2. Deduplication - No duplicate items, correct hash logic
3. Resolve Logic - Stale items correctly identified and marked
4. View Regeneration - All view files updated after changes
5. Report Generation - Detailed report created with code snippets
6. Schema Integrity - All items have required fields, valid values

## Prerequisites

1. **SONAR_TOKEN** must be decrypted:

   ```bash
   node scripts/secrets/decrypt-secrets.js
   ```

2. **MASTER_DEBT.jsonl** must exist

3. **sonar-project.properties** must have valid project key

---

## Execution Flow (Fully Automated)

When you invoke `/eval-sonarcloud`, follow these steps IN ORDER:

### Phase 1: Setup Session

```bash
# Create session directory with timestamp
SESSION_PATH="docs/audits/eval-sonarcloud-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SESSION_PATH/eval"
```

### Phase 2: Pre-Snapshot

Capture baseline state BEFORE running sonarcloud:

```bash
node scripts/eval/eval-sonarcloud-snapshot.js pre "$SESSION_PATH"
```

This captures:

- MASTER_DEBT.jsonl item count, severity breakdown, sonar items
- Log file line counts (intake-log, resolution-log)
- View file timestamps and hashes
- Report file state

### Phase 3: Decrypt Secrets

Ensure SONAR_TOKEN is available:

```bash
node scripts/secrets/decrypt-secrets.js
```

Verify token is set:

```bash
[ -n "$SONAR_TOKEN" ] && echo "Token ready" || echo "ERROR: SONAR_TOKEN not set"
```

### Phase 4: Run Real SonarCloud Sync + Resolve

Execute the REAL sonarcloud skill (full mode = sync new + resolve stale):

```bash
node scripts/debt/sync-sonarcloud.js --full --force
```

This runs the actual sync and resolve operations against the SonarCloud API.

### Phase 5: Generate Detailed Report

```bash
node scripts/generate-detailed-sonar-report.js
```

### Phase 6: Validate All Stages

Run all stage validations:

```bash
node scripts/eval/eval-sonarcloud-stage.js "$SESSION_PATH" all
```

This validates:

| Stage | Name              | What It Checks                                       |
| ----- | ----------------- | ---------------------------------------------------- |
| E1    | API Fetch         | Intake log entry, items fetched > 0, no API errors   |
| E2    | Deduplication     | No duplicate content hashes, no duplicate sonar_keys |
| E3    | Resolve Logic     | Resolution log entry, stale items marked RESOLVED    |
| E4    | View Regeneration | All 4 view files updated, valid markdown             |
| E5    | Report Generation | Report file exists, has expected sections            |
| E6    | Schema Integrity  | All items have required fields, valid values         |

### Phase 7: Post-Snapshot

Capture final state:

```bash
node scripts/eval/eval-sonarcloud-snapshot.js post "$SESSION_PATH"
```

### Phase 8: Generate Evaluation Report

```bash
node scripts/eval/eval-sonarcloud-report.js "$SESSION_PATH"
```

Output: `$SESSION_PATH/eval/EVALUATION-REPORT.md`

---

## Output

The evaluation produces:

1. **Pre/Post Snapshots**: `$SESSION_PATH/eval/{pre,post}-snapshot.json`
2. **Stage Results**: `$SESSION_PATH/eval/stage-results.jsonl`
3. **Evaluation Report**: `$SESSION_PATH/eval/EVALUATION-REPORT.md`

The report includes:

- Overall score (0-100) and grade (A+ to F)
- Stage scorecard with pass/fail per stage
- Detailed metrics for each stage
- Issues found with specific remediation steps
- Pre/post comparison showing what changed
- Consolidated recommendations by category

---

## Scoring

| Stage                 | Weight | Rationale                                        |
| --------------------- | ------ | ------------------------------------------------ |
| E1: API Fetch         | 1.5x   | Core functionality - no data without API         |
| E2: Deduplication     | 1.5x   | Core integrity - duplicates corrupt the system   |
| E3: Resolve Logic     | 1.5x   | Core functionality - prevents stale accumulation |
| E4: View Regeneration | 1x     | Secondary - views are derived                    |
| E5: Report Generation | 1x     | Optional feature                                 |
| E6: Schema Integrity  | 1x     | Data quality validation                          |

**Pass Criteria**: All stages ≥ 70 AND overall weighted score ≥ 75

---

## Quick Reference

```bash
# Full automated evaluation
SESSION="docs/audits/eval-sonarcloud-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SESSION/eval"
node scripts/eval/eval-sonarcloud-snapshot.js pre "$SESSION"
node scripts/secrets/decrypt-secrets.js
node scripts/debt/sync-sonarcloud.js --full --force
node scripts/generate-detailed-sonar-report.js
node scripts/eval/eval-sonarcloud-stage.js "$SESSION" all
node scripts/eval/eval-sonarcloud-snapshot.js post "$SESSION"
node scripts/eval/eval-sonarcloud-report.js "$SESSION"

# View results
cat "$SESSION/eval/EVALUATION-REPORT.md"
```

---

## Troubleshooting

### E1 Fails: API Fetch

- Check SONAR_TOKEN: `echo $SONAR_TOKEN | head -c 10`
- Verify project key: `grep projectKey sonar-project.properties`
- Test API (token from env var, safer than command-line arg):
  `curl -s -H "Authorization: Bearer $SONAR_TOKEN" "https://sonarcloud.io/api/projects/search" | jq .`

### E2 Fails: Deduplication

- Check for duplicates:
  `grep -o '"content_hash":"[^"]*"' docs/technical-debt/MASTER_DEBT.jsonl | sort | uniq -d`
- Review sync-sonarcloud.js dedup logic

### E3 Fails: Resolve Logic

- Check if resolve ran: `tail -5 docs/technical-debt/logs/resolution-log.jsonl`
- Verify --full or --resolve flag was used

### E4 Fails: View Regeneration

- Check views directory: `ls -la docs/technical-debt/views/`
- Regenerate manually: `node scripts/debt/generate-views.js`

### E5 Fails: Report Generation

- Check report exists: `ls -la docs/audits/sonarcloud-issues-detailed.md`
- Regenerate: `node scripts/generate-detailed-sonar-report.js`

### E6 Fails: Schema Integrity

- Validate: `node scripts/debt/validate-schema.js`
- Check for malformed JSON:
  `head -20 docs/technical-debt/MASTER_DEBT.jsonl | jq .`

---

## Related Skills

- `/sonarcloud` - The skill being evaluated
- `/sonarcloud-sprint` - DEPRECATED, use `/sonarcloud --sprint`
- `/sync-sonarcloud-debt` - DEPRECATED, use `/sonarcloud`

---

## Scripts Reference

| Script                                     | Purpose                    |
| ------------------------------------------ | -------------------------- |
| `scripts/eval/eval-sonarcloud-snapshot.js` | Capture pre/post state     |
| `scripts/eval/eval-sonarcloud-stage.js`    | Validate individual stages |
| `scripts/eval/eval-sonarcloud-report.js`   | Generate graded report     |
