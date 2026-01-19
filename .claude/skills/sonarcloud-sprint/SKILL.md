---
name: sonarcloud-sprint
description:
  Run a SonarCloud cleanup sprint. Fetches fresh issues via public API,
  generates a detailed report with code snippets, creates a cleanup branch, and
  tracks fixes with the TodoWrite tool. Use when starting a code quality cleanup
  sprint or when you need a current snapshot of SonarCloud issues.
metadata:
  short-description: SonarCloud cleanup sprint workflow
---

# SonarCloud Cleanup Sprint

## Overview

Automate the SonarCloud analysis and cleanup workflow:

1. Fetch fresh issues via SonarCloud public API (no token needed for read)
2. Generate detailed report with code snippets
3. Create cleanup branches following 5-PR structure
4. Track fixes with TodoWrite

## Prerequisites

- GitHub CLI (`gh`) authenticated with repo access
- SonarCloud project: `jasonmichaelbell78-creator_sonash-v0`
- Node.js for report generation script

## Usage

```
/sonarcloud-sprint           # Full sprint workflow
/sonarcloud-sprint --report  # Just generate current issue report
```

## Workflow

### Phase 1: Fetch Fresh Data from API

The SonarCloud API is publicly accessible. Fetch all issues:

```bash
# Fetch all issues (paginated, 500 per page)
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=jasonmichaelbell78-creator_sonash-v0&ps=500&p=1" > /tmp/sonar_all_p1.json
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=jasonmichaelbell78-creator_sonash-v0&ps=500&p=2" > /tmp/sonar_all_p2.json
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=jasonmichaelbell78-creator_sonash-v0&ps=500&p=3" > /tmp/sonar_all_p3.json
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=jasonmichaelbell78-creator_sonash-v0&ps=500&p=4" > /tmp/sonar_all_p4.json

# Fetch security hotspots
curl -s "https://sonarcloud.io/api/hotspots/search?projectKey=jasonmichaelbell78-creator_sonash-v0&status=TO_REVIEW&ps=500" > /tmp/sonar_hotspots.json

# Check counts
echo "Issues: $(jq '.total' /tmp/sonar_all_p1.json)"
echo "Hotspots: $(jq '.paging.total' /tmp/sonar_hotspots.json)"
```

### Phase 2: Generate Detailed Report

Run the report generator script:

```bash
node scripts/generate-detailed-sonar-report.js
```

This creates `docs/audits/sonarcloud-issues-detailed.md` with:

- All issues organized by file
- Code snippets with `>>>` markers at issue lines
- Priority section for BLOCKER/CRITICAL issues
- Security hotspots section
- Rule reference table

### Phase 3: Review Report Structure

The detailed report is organized for the 5-PR cleanup structure:

| PR   | Focus               | Target Issues                      |
| ---- | ------------------- | ---------------------------------- |
| PR 1 | Mechanical Fixes    | ~190 (node imports, shell scripts) |
| PR 2 | Critical Complexity | ~107 (BLOCKER + CRITICAL)          |
| PR 3 | Major Code Quality  | ~220 (ternaries, React issues)     |
| PR 4 | Medium/Minor Issues | ~1,000+ (remaining MINOR/INFO)     |
| PR 5 | Security Hotspots   | ~97 (all hotspots)                 |

### Phase 4: Create Cleanup Branches

```bash
git checkout main
git pull origin main

# Create branch for current PR phase
git checkout -b cleanup/phase-1-mechanical
# or: cleanup/phase-2-complexity
# or: cleanup/phase-3-major-quality
# or: cleanup/phase-4-medium-priority
# or: cleanup/phase-5-security
```

### Phase 5: Fix Issues Using the Report

For each file in the detailed report:

1. Navigate to the file section in `docs/audits/sonarcloud-issues-detailed.md`
2. Review each issue with its code snippet
3. Apply the fix based on the rule description
4. Mark progress with TodoWrite

Example workflow for a file:

```
📁 `scripts/generate-documentation-index.js` (213 issues)

>>> Line 45: Prefer `String#replaceAll()` over `String#replace()`
```

Fix: Change `str.replace(/pattern/g, 'replacement')` to
`str.replaceAll('pattern', 'replacement')`

### Phase 6: Verify and Create PR

```bash
# Run tests
npm run lint && npm run type-check && npm test

# Commit with descriptive message
git add -A
git commit -m "fix(sonar): phase 1 mechanical fixes - node imports and shell scripts

- Convert bare Node imports to node: protocol
- Fix shell script conditional syntax
- Resolves ~190 SonarCloud issues"

# Create PR
gh pr create --title "fix(sonar): Phase 1 - Mechanical Fixes" \
  --body "## Summary
Resolves ~190 mechanical issues identified by SonarCloud.

### Changes
- Converted bare Node.js imports to \`node:\` protocol prefix
- Fixed shell script \`[[\` vs \`[\` syntax
- Applied other shell script best practices

### Reference
See: docs/audits/sonarcloud-issues-detailed.md

## Test Plan
- [ ] All tests passing
- [ ] Lint check passing
- [ ] Type check passing
- [ ] SonarCloud PR analysis shows improvement"
```

## Report-Only Mode

When called with `--report`:

1. Fetch fresh data from SonarCloud API
2. Generate detailed report with code snippets
3. Do not create branch or track fixes

## API Endpoints Reference

| Endpoint                           | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| `/api/issues/search`               | Get all code issues                  |
| `/api/hotspots/search`             | Get security hotspots                |
| `/api/sources/issue_snippets`      | Get code context (requires issueKey) |
| `/api/qualitygates/project_status` | Check quality gate status            |

## Related Documents

- [Detailed Report](docs/audits/sonarcloud-issues-detailed.md) - Current issues
  with code snippets
- [Cleanup Sprint Plan](.claude/plans/sonarcloud-cleanup-sprint.md) - 5-PR
  structure
- [Cleanup Runbook](docs/SONARCLOUD_CLEANUP_RUNBOOK.md) - Detailed procedures
- [Triage Decisions](docs/SONARCLOUD_TRIAGE.md) - Issue triage guidelines
- [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0)

## Project Configuration

- **Project Key**: `jasonmichaelbell78-creator_sonash-v0`
- **Organization**: `jasonmichaelbell78-creator`
- **API Base**: `https://sonarcloud.io`
- **Report Script**: `scripts/generate-detailed-sonar-report.js`
