# SonarCloud Cleanup Sprint Runbook

**Created**: 2026-01-18 **Last Updated**: 2026-01-19

---

## Purpose

This runbook provides a repeatable process for SonarCloud analysis and cleanup
sprints. It covers the end-to-end workflow from fetching issues to verifying
improvements, including detailed report generation with code snippets.

**Scope**: SonarCloud issue triage, cleanup branch management, PR-based
verification, and learnings extraction.

---

## Quick Reference

```bash
# Fetch fresh issues from public API
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=jasonmichaelbell78-creator_sonash-v0&ps=500&p=1" > /tmp/sonar_all_p1.json

# Generate detailed report with code snippets
node scripts/generate-detailed-sonar-report.js

# Verify phase completion before commit
node scripts/verify-sonar-phase.js --phase=1

# Extract learnings after completing phase
node scripts/verify-sonar-phase.js --phase=1 --extract-learnings
```

---

## Prerequisites

Before running a cleanup sprint:

1. **SonarCloud Account**: Sign in at https://sonarcloud.io with GitHub
2. **Project Imported**: Project `jasonmichaelbell78-creator_sonash-v0` exists
3. **Node.js**: For running report generation and verification scripts
4. **jq**: For JSON parsing in shell commands
5. **GitHub CLI (gh)**: For workflow triggers and PR creation

---

## Phase 0: Fetch Fresh Data

### 0.1 Query SonarCloud API (Public Access)

The SonarCloud API is publicly accessible for read operations:

```bash
# Set project key
PROJECT_KEY="jasonmichaelbell78-creator_sonash-v0"

# Fetch all issues (paginated, max 500 per page)
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&ps=500&p=1" > /tmp/sonar_all_p1.json
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&ps=500&p=2" > /tmp/sonar_all_p2.json
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&ps=500&p=3" > /tmp/sonar_all_p3.json
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=$PROJECT_KEY&ps=500&p=4" > /tmp/sonar_all_p4.json

# Fetch security hotspots
curl -s "https://sonarcloud.io/api/hotspots/search?projectKey=$PROJECT_KEY&status=TO_REVIEW&ps=500" > /tmp/sonar_hotspots.json

# Verify counts
echo "Total issues: $(jq '.total' /tmp/sonar_all_p1.json)"
echo "Total hotspots: $(jq '.paging.total' /tmp/sonar_hotspots.json)"
```

### 0.2 Generate Detailed Report with Code Snippets

```bash
# Generate comprehensive report
node scripts/generate-detailed-sonar-report.js
```

This creates `docs/audits/sonarcloud-issues-detailed.md` with:

- All 1,608 issues organized by file
- Code snippets with `>>>` markers at issue lines
- Priority section for BLOCKER/CRITICAL issues first
- Security hotspots section with probability ratings
- Rule reference table with counts

---

## Phase 1: Review the 5-PR Structure

The cleanup is organized into 5 PRs:

| PR  | Branch                            | Focus                       | Issues |
| --- | --------------------------------- | --------------------------- | ------ |
| 1   | `cleanup/phase-1-mechanical`      | Node imports, shell scripts | ~189   |
| 2   | `cleanup/phase-2-critical`        | BLOCKER/CRITICAL severity   | ~107   |
| 3   | `cleanup/phase-3-major-quality`   | Ternaries, React a11y       | ~220   |
| 4   | `cleanup/phase-4-medium-priority` | MINOR issues                | ~1,095 |
| 5   | `cleanup/phase-5-security`        | Security hotspots           | ~97    |

See full breakdown:
[sonarcloud-cleanup-sprint.md](../.claude/plans/sonarcloud-cleanup-sprint.md)

---

## Phase 2: Create Cleanup Branch

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create branch for target phase
git checkout -b cleanup/phase-1-mechanical
# Or: cleanup/phase-2-critical, cleanup/phase-3-major-quality, etc.
```

---

## Phase 3: Fix Issues Using the Report

### 3.1 Navigate the Detailed Report

Open `docs/audits/sonarcloud-issues-detailed.md` and find issues by:

1. **Priority Section**: Start with BLOCKER/CRITICAL issues
2. **File Section**: Work file-by-file for efficiency
3. **Rule Table**: Batch similar rules together

### 3.2 Issue Format in Report

````markdown
### 📁 `scripts/example.js` (15 issues)

#### 🟠 Line 45: Prefer `String#replaceAll()` over `String#replace()`

- **Rule**: `javascript:S7781`
- **Type**: CODE_SMELL
- **Severity**: CRITICAL
- **Effort**: 5min

```js
>>>   45 | const result = str.replace(/pattern/g, 'replacement');
```
````

````

### 3.3 Fix Patterns by Rule

| Rule | Fix Pattern |
|------|------------|
| S7772 | `require('fs')` → `require('node:fs')` |
| S7781 | `str.replace(/x/g, y)` → `str.replaceAll('x', y)` |
| S7688 | `[ condition ]` → `[[ condition ]]` |
| S3776 | Extract helper functions to reduce complexity |
| S3358 | Convert nested ternaries to if/else |

---

## Phase 4: Pre-Commit Verification

### 4.1 Run Verification Script

Before committing, verify all phase issues are addressed:

```bash
node scripts/verify-sonar-phase.js --phase=1
````

Output:

```
🔍 SonarCloud Phase 1 Verification
   Phase: Mechanical Fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Phase Statistics:
   Total issues in phase: 189
   Security hotspots: 0

📋 Verification Results:
   ✅ Fixed (code changed): 185
   📝 Dismissed (documented): 4
   ⏳ Pending (needs action): 0

✅ VERIFICATION PASSED
```

### 4.2 Handle Pending Issues

If verification fails with pending issues:

1. **Fix the code**: Make the required changes
2. **Document dismissal**: Add to `docs/audits/sonarcloud-dismissals.md`

Dismissal format:

```markdown
### [javascript:S7772] - scripts/legacy.js:42

**Reason**: By Design **Justification**: CommonJS require used intentionally for
dynamic loading. Node protocol not supported for dynamic requires. **Reviewed
by**: Developer Name / 2026-01-19
```

---

## Phase 5: Commit and Create PR

### 5.1 Commit with Descriptive Message

```bash
git add -A
git commit -m "fix(sonar): phase 1 mechanical fixes - node imports and shell scripts

- Convert 117 bare Node imports to node: protocol
- Fix 72 shell script syntax issues ([[ vs [)
- 4 issues dismissed with documented justification

See: docs/audits/sonarcloud-issues-detailed.md"
```

### 5.2 Create PR

```bash
gh pr create \
  --title "fix(sonar): Phase 1 - Mechanical Fixes (~189 issues)" \
  --body "## Summary
Resolves ~189 mechanical issues identified by SonarCloud.

### Changes
- Converted bare Node.js imports to \`node:\` protocol prefix (117)
- Fixed shell script conditional syntax (72)
- Documented 4 dismissals with justification

### Reference
- Detailed Report: docs/audits/sonarcloud-issues-detailed.md
- Dismissals: docs/audits/sonarcloud-dismissals.md

## Verification
- [x] \`node scripts/verify-sonar-phase.js --phase=1\` passes
- [x] All tests passing
- [x] Lint check passing

## Test Plan
- [ ] SonarCloud PR analysis shows issue reduction
- [ ] No new issues introduced"
```

---

## Phase 6: Post-PR Learnings Extraction

After completing each PR phase, extract learnings:

### 6.1 Generate Learnings

```bash
node scripts/verify-sonar-phase.js --phase=1 --extract-learnings
```

Output example:

```markdown
## SonarCloud Phase 1 Learnings (2026-01-19)

**Phase**: Mechanical Fixes **Description**: Node protocol imports and shell
script best practices

### Patterns Identified

#### javascript:S7772 (63 occurrences)

**Lesson**: Rule S7772 appeared 63 times. Consider adding a lint rule or code
review checklist item to catch this pattern earlier.

**Sample Files**:

- `scripts/check-pattern-compliance.js`
- `scripts/generate-documentation-index.js`
```

### 6.2 Add to AI Learnings Log

```bash
# Append learnings to the log
node scripts/verify-sonar-phase.js --phase=1 --extract-learnings >> docs/agent_docs/AI_LESSONS_LOG.md
```

### 6.3 Update Prevention Measures

Based on learnings:

- [ ] Add ESLint rules for common patterns
- [ ] Update CODE_PATTERNS.md with anti-patterns
- [ ] Add pre-commit hooks for repeated issues

---

## Troubleshooting

### API Returns Empty

1. Check project key is exact: `jasonmichaelbell78-creator_sonash-v0`
2. Verify SonarCloud has completed analysis
3. Try web dashboard to confirm data exists

### Verification Script Fails

1. Ensure detailed report exists: `docs/audits/sonarcloud-issues-detailed.md`
2. Run report generator: `node scripts/generate-detailed-sonar-report.js`
3. Check dismissals file format

### Large File in Report

If a file has 100+ issues, consider:

1. Refactoring the file first
2. Splitting into multiple files
3. Addressing in dedicated PR

---

## Related Documents

- [Detailed Report](audits/sonarcloud-issues-detailed.md) - Full issue list with
  code
- [Sprint Plan](../.claude/plans/sonarcloud-cleanup-sprint.md) - 5-PR structure
- [Dismissals](audits/sonarcloud-dismissals.md) - Documented dismissals
- [Triage Guide](SONARCLOUD_TRIAGE.md) - Triage decision framework
- [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0)

---

## Scripts Reference

| Script                                           | Purpose                            |
| ------------------------------------------------ | ---------------------------------- |
| `scripts/generate-detailed-sonar-report.js`      | Generate report with code snippets |
| `scripts/verify-sonar-phase.js`                  | Pre-commit verification            |
| `scripts/generate-sonar-report-with-snippets.js` | Alternative report generator       |

---

## Version History

| Version | Date       | Changes                                                           |
| ------- | ---------- | ----------------------------------------------------------------- |
| 2.0     | 2026-01-19 | Major rewrite: API-based workflow, detailed reports, verification |
| 1.4     | 2026-01-19 | Add Purpose section, Last Updated date (PR review fix)            |
| 1.3     | 2026-01-19 | Add Phase 0: Automatic Analysis toggle instructions               |
| 1.2     | 2026-01-18 | Round 2: Basic auth fix, conclusion-aware polling                 |
| 1.1     | 2026-01-18 | PR review fixes: polling robustness, token security, timestamps   |
| 1.0     | 2026-01-18 | Initial runbook created                                           |
