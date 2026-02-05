---
name: eval-sonarcloud-improvements
description: |
  Evaluation wrapper that instruments a live multi-AI audit run and scores each
  pipeline stage. Temporary skill for validating the multi-ai-audit system.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** ACTIVE (TEMPORARY)
<!-- prettier-ignore-end -->

# SonarCloud Improvements Evaluation

Validation wrapper for PR #337 / Review #250 security fixes, error handling
improvements, and infrastructure changes. Tests all components end-to-end.

**Invocation:** `/eval-sonarcloud-improvements [mode]`

**Type:** Temporary (remove after PR #337 validation complete)

---

## Modes

| Mode            | Argument      | Description                                     |
| --------------- | ------------- | ----------------------------------------------- |
| **automated**   | (default)     | Run all 10 automated test stages (T1-T10)       |
| **stage**       | `T1`..`T10`   | Run a single test stage                         |
| **interactive** | `interactive` | Run agent-orchestrated tests (T11-T13)          |
| **full-run**    | `full-run`    | Automated tests + live SonarCloud sync + report |

---

## Automated Tests (T1-T10)

Run via script — no manual intervention needed.

```bash
# Run all automated tests
node scripts/eval/eval-sonarcloud-improvements.js all

# Run single stage
node scripts/eval/eval-sonarcloud-improvements.js T2

# Results written to
cat /tmp/eval-sonarcloud-results.jsonl
```

### Stage Reference

| Stage | Component                         | What's Validated                                       |
| ----- | --------------------------------- | ------------------------------------------------------ |
| T1    | Sonarcloud SKILL.md               | Structure, frontmatter, all 6 modes, no curl tokens    |
| T2    | state-utils.js path traversal     | 9 malicious inputs rejected, 4 valid accepted          |
| T3    | state-utils.js steps concat       | Steps append (not overwrite), context merge preserved  |
| T4    | sync-sonarcloud.js error handling | try/catch, instanceof Error, title guard, atomic write |
| T5    | Pattern compliance                | Zero violations on all project files                   |
| T6    | ESLint archive exclusion          | docs/archive/ excluded from lint                       |
| T7    | Archive reference hygiene         | No stale extract-sonarcloud refs, no duplicate entries |
| T8    | Atomic write patterns             | tmp+rename in sync-sonarcloud and state-utils          |
| T9    | agent-trigger-enforcer            | Path normalization, forward slashes, dedup             |
| T10   | COMMAND_REFERENCE.md              | No duplicate skills, version >= 3.2                    |

---

## Interactive Tests (T11-T13)

These require agent orchestration — run after automated tests pass.

### T11: Pre-Commit Hook Validation

```
1. Create a trivial change (e.g., add a comment to a test file)
2. Stage and commit with: git commit -m "test: verify pre-commit hooks pass"
3. Verify ALL checks pass:
   - ESLint ✅
   - Lint-staged ✅
   - Pattern compliance ✅
   - Tests ✅
   - Skill validation ✅
   - Cross-document dependencies ✅
4. Reset the test commit: git reset --soft HEAD~1 && git checkout -- .
```

**Pass criteria:** Commit succeeds with all green checks.

### T12: Compaction Handoff Verification

```
1. Check if .claude/state/handoff.json exists:
   cat .claude/state/handoff.json 2>/dev/null || echo "Not found"

2. If running in a session with 25+ file reads, verify the compaction-handoff
   hook has created/updated the file.

3. Verify structure has required fields:
   - timestamp, git.branch, git.lastCommit
```

**Pass criteria:** File exists with valid JSON structure.

### T13: Agent Trigger Enforcer Review Queue

```
1. Check if .claude/state/pending-reviews.json exists:
   cat .claude/state/pending-reviews.json 2>/dev/null || echo "Not found"

2. If 5+ code files were modified in this session, verify the file was created
   with normalized file paths (forward slashes, relative).

3. Verify no duplicate entries in the files array.
```

**Pass criteria:** File contains deduplicated, normalized paths.

---

## Full-Run Mode

Runs automated tests, then a live SonarCloud sync cycle.

### Execution Steps

```
Step 1: Run automated tests
  node scripts/eval/eval-sonarcloud-improvements.js all

Step 2: Decrypt secrets (if needed)
  node scripts/secrets/decrypt-secrets.js

Step 3: Verify prerequisites
  echo "SONAR_TOKEN set: $([ -n "$SONAR_TOKEN" ] && echo YES || echo NO)"
  cat sonar-project.properties | grep sonar.projectKey

Step 4: Run SonarCloud sync (dry-run first)
  node scripts/debt/sync-sonarcloud.js --dry-run

Step 5: Run SonarCloud resolve (dry-run)
  node scripts/debt/sync-sonarcloud.js --resolve --dry-run

Step 6: Verify error handling
  # Test with intentionally bad token (should fail gracefully)
  SONAR_TOKEN=invalid-token node scripts/debt/sync-sonarcloud.js --dry-run 2>&1 | head -5
  # Should show error message, not crash with unhandled exception

Step 7: Generate detailed report (if sync produced data)
  node scripts/generate-detailed-sonar-report.js

Step 8: Validate TDMS schema
  node scripts/debt/validate-schema.js
```

### Full-Run Pass Criteria

| Check                      | Requirement                      |
| -------------------------- | -------------------------------- |
| Automated tests (T1-T10)   | All pass                         |
| SonarCloud dry-run         | Exits cleanly with issue count   |
| SonarCloud resolve dry-run | Exits cleanly with stale count   |
| Bad token error handling   | Graceful error message, no crash |
| TDMS schema validation     | Exit code 0                      |

---

## Results Interpretation

Results are written to `/tmp/eval-sonarcloud-results.jsonl` as JSONL entries:

```jsonl
{"stage":"T2.1","name":"Rejects parent directory traversal","pass":true,"timestamp":"..."}
{"stage":"T2.1","name":"Rejects double parent traversal","pass":true,"timestamp":"..."}
{"type":"summary","total":42,"passed":42,"failed":0,"timestamp":"..."}
```

### Grading

| Result   | Meaning                            |
| -------- | ---------------------------------- |
| All pass | PR #337 improvements validated     |
| 1-3 fail | Minor gaps — investigate and fix   |
| 4+ fail  | Regression detected — do not merge |

---

## Cleanup

After validation is complete, remove these temporary files:

```bash
# Remove eval skill
rm -rf .claude/skills/eval-sonarcloud-improvements/

# Remove eval script
rm scripts/eval/eval-sonarcloud-improvements.js

# Remove results
rm -f /tmp/eval-sonarcloud-results.jsonl

# Remove empty eval directory if no other eval scripts
rmdir scripts/eval/ 2>/dev/null || true
```
