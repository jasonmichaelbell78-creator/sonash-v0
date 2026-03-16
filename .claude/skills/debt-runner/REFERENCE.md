# Debt Runner Reference

**Document Version:** 1.0 **Last Updated:** 2026-03-15 **Status:** ACTIVE

Companion file for debt-runner SKILL.md. Contains per-mode script sequences, CL
domain slicing templates, staging/plan schemas, and state file schema.

---

## Per-Mode Script Sequences

### Verify

```bash
# 1. Load and filter
node scripts/debt/generate-metrics.js          # Get current counts
# 2. CL verification (standard preset, agents check codebase)
# 3. Apply corrections
node scripts/debt/resolve-bulk.js --file staging/verify-corrections.jsonl --dry-run
node scripts/debt/resolve-bulk.js --file staging/verify-corrections.jsonl
# 4. Sync check
node scripts/debt/sync-deduped.js
```

### Sync

```bash
# 1. Preview
node scripts/debt/sync-sonarcloud.js --dry-run
# 2. Execute
node scripts/debt/sync-sonarcloud.js --force
# 3. CL verification (standard preset)
# 4. Apply corrections from staging
# 5. Sync check
node scripts/debt/sync-deduped.js
```

### Plan

```bash
# 1. Filter MASTER_DEBT by severity (read and filter JSONL)
# 2. Generate resolution order (AI analysis)
# 3. Write plan artifacts
#    docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl
#    docs/technical-debt/plans/resolution-YYYY-MM-DD.md
# 4. CL verification (standard preset on plan claims)
```

### Health

```bash
node scripts/debt/generate-metrics.js
node scripts/health/checkers/debt-health.js
# CL quick on metrics accuracy
```

### Dedup

```bash
# 1. Preview
node scripts/debt/dedup-multi-pass.js --dry-run
# 2. CL verification on merge candidates
# 3. Execute
node scripts/debt/dedup-multi-pass.js --force
node scripts/debt/consolidate-all.js
# 4. Sync check
node scripts/debt/sync-deduped.js
```

### Validate

```bash
node scripts/debt/validate-schema.js
node scripts/debt/verify-resolutions.js
# CL standard on findings
# Apply fixes from staging
node scripts/debt/sync-deduped.js
```

### Cleanup

```bash
# 1. Identify targets (resolved >30d, confirmed FPs)
# 2. CL verification on targets
# 3. Apply (resolve-bulk for archival, manual for FP clearing)
node scripts/debt/sync-deduped.js
node scripts/debt/generate-views.js
node scripts/debt/generate-metrics.js
```

---

## CL Domain Slicing Templates

### By Severity (verify mode)

```
Slice 1: S0 items (typically <50) — thorough preset
  Agent prompt: "Verify each S0 item. Check: file exists, issue present,
  not already fixed. These are critical — false positives waste emergency
  response effort."

Slice 2: S1 items (typically ~1300) — standard preset
  Agent prompt: "Verify S1 items in your assigned category. Check file
  existence and issue presence. Report confirmed/corrected/extended/new."

Slice 3: S2 items — standard preset, split by category
Slice 4: S3 items — standard preset, split by category
```

### By Source (sync mode)

```
Slice 1: SonarCloud BLOCKER/CRITICAL → verify S0 classification
Slice 2: SonarCloud MAJOR → verify S1 classification
Slice 3: SonarCloud MINOR/INFO → verify S2/S3 classification
Slice 4: Cross-check all new items against existing MASTER_DEBT for missed dupes
```

### By Merge Cluster (dedup mode)

```
Each cluster = items with content_hash similarity >80%
Slice per cluster: verify items are truly duplicate, not just similar
Agent checks: same file? same issue? different manifestation?
```

---

## Staging File Schemas

### staging/verify-corrections.jsonl

```json
{"id": "DEBT-0042", "action": "resolve", "reason": "Issue fixed in commit abc123", "verified_by": "convergence-loop"}
{"id": "DEBT-0099", "action": "update_severity", "old": "S1", "new": "S2", "reason": "Impact reassessed — not production-critical"}
{"id": "DEBT-0150", "action": "update_file", "old": "src/old.ts", "new": "src/renamed.ts", "reason": "File renamed"}
```

### staging/sync-corrections.jsonl

```json
{"id": "DEBT-1234", "action": "reclassify", "field": "severity", "old": "S0", "new": "S1", "reason": "Code smell, not security vulnerability"}
{"id": "DEBT-1235", "action": "mark_duplicate", "duplicate_of": "DEBT-0500", "reason": "Same issue, different SonarCloud rule"}
```

### staging/dedup-merges.jsonl

```json
{
  "target": "DEBT-0042",
  "merge_from": ["DEBT-0500", "DEBT-0501"],
  "reason": "Same TODO in same file, different extraction sources"
}
```

### staging/validate-fixes.jsonl

```json
{"id": "DEBT-0042", "action": "fix_schema", "field": "severity", "old": "HIGH", "new": "S1", "reason": "Non-standard severity value"}
{"id": "DEBT-0099", "action": "mark_stale", "days_inactive": 120, "reason": "No status change since 2025-11-15"}
```

---

## Remediation Plan JSONL Schema

Path: `docs/technical-debt/plans/resolution-YYYY-MM-DD.jsonl`

```json
{
  "plan_id": "PLAN-2026-03-15",
  "created": "2026-03-15",
  "severity_filter": ["S0", "S1"],
  "total_items": 42,
  "estimated_effort": "E2",
  "status": "draft"
}
{"order": 1, "id": "DEBT-0042", "severity": "S0", "effort": "E0", "file": "src/auth.ts", "title": "SQL injection in query builder", "depends_on": [], "cluster": "auth-module", "fix_guidance": "Use parameterized queries"}
{"order": 2, "id": "DEBT-0043", "severity": "S0", "effort": "E1", "file": "src/auth.ts", "title": "Missing input sanitization", "depends_on": ["DEBT-0042"], "cluster": "auth-module", "fix_guidance": "Add Zod validation at API boundary"}
```

First line = plan metadata. Subsequent lines = ordered items with fix guidance.

---

## State File Schema

Path: `.claude/state/debt-runner.state.json`

```json
{
  "task": "Debt Runner",
  "status": "running_mode | between_modes | complete",
  "current_mode": "verify",
  "completed_modes": ["health"],
  "severity_filter": ["S0", "S1"],
  "current_step": 3,
  "cl_passes": [
    {
      "pass": 1,
      "behavior": "source-check",
      "confirmed": 28,
      "corrected": 3,
      "extended": 1,
      "new": 0
    }
  ],
  "staging_files": ["docs/technical-debt/staging/verify-corrections.jsonl"],
  "plan_path": null,
  "mutations_pending": 4,
  "last_sync_check": "2026-03-15T14:00:00Z",
  "updated": "2026-03-15T14:30:00Z"
}
```

---

## Menu Stats Source

```bash
# Item counts by severity
node -e "
const fs = require('fs');
let counts = {S0:0,S1:0,S2:0,S3:0, total: 0};
try {
  const lines = fs.readFileSync('docs/technical-debt/MASTER_DEBT.jsonl','utf8').trim().split('\n');
  counts.total = lines.length;
  lines.forEach(l => { try { const d=JSON.parse(l); if(d.severity) counts[d.severity]=(counts[d.severity]||0)+1; } catch(e){} });
} catch (e) { /* file not found is not an error for this stats script */ }
console.log(JSON.stringify(counts));
"

# Pending staging files
ls docs/technical-debt/staging/ 2>/dev/null | wc -l

# Last sync date (from state file or MASTER_DEBT timestamps)
```
