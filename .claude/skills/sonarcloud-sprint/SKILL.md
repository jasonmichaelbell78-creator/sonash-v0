---
name: sonarcloud-sprint
description:
  Run a SonarCloud cleanup sprint. Triggers re-analysis, queries current issues
  via MCP tools, generates a prioritized issue report, creates a cleanup branch,
  and tracks fixes with the TodoWrite tool. Use when starting a code quality
  cleanup sprint or when you need a current snapshot of SonarCloud issues.
metadata:
  short-description: SonarCloud cleanup sprint workflow
---

# SonarCloud Cleanup Sprint

## Overview

Automate the SonarCloud analysis and cleanup workflow:

1. Trigger a fresh analysis on the main branch
2. Query issues via MCP tools
3. Generate a prioritized report
4. Create a cleanup branch
5. Track fixes with TodoWrite

## Prerequisites

- GitHub CLI (`gh`) authenticated with repo access
- `SONAR_TOKEN` secret configured in GitHub repository
- SonarCloud project imported: `jasonmichaelbell78-creator_sonash-v0`
- **Automatic Analysis disabled** in SonarCloud (required for CI-based analysis)

## Usage

```
/sonarcloud-sprint           # Full sprint workflow
/sonarcloud-sprint --report  # Just generate current issue report
```

## Workflow

### Phase 0: Disable Automatic Analysis

Before triggering CI analysis, disable Automatic Analysis in SonarCloud:

1. Go to:
   https://sonarcloud.io/project/analysis_method?id=jasonmichaelbell78-creator_sonash-v0
2. Turn **OFF** "Automatic Analysis"
3. Re-enable after sprint if preferred for ongoing monitoring

### Phase 1: Trigger Analysis

```bash
# Trigger analysis on main
gh workflow run sonarcloud.yml --ref main

# Check status (poll until complete)
gh run list --workflow=sonarcloud.yml --limit 1
```

Wait for the workflow to complete before proceeding.

### Phase 2: Query Issues via MCP

Use the SonarCloud MCP tools to get structured data:

```
# Get quality gate status
mcp__sonarcloud__get_quality_gate(projectKey: "jasonmichaelbell78-creator_sonash-v0")

# Get issues by severity
mcp__sonarcloud__get_issues(projectKey: "jasonmichaelbell78-creator_sonash-v0", severities: "BLOCKER,CRITICAL")
mcp__sonarcloud__get_issues(projectKey: "jasonmichaelbell78-creator_sonash-v0", severities: "MAJOR")

# Get security hotspots
mcp__sonarcloud__get_security_hotspots(projectKey: "jasonmichaelbell78-creator_sonash-v0")
```

### Phase 3: Generate Report

Format issues by priority:

| Priority | Criteria                      | Action             |
| -------- | ----------------------------- | ------------------ |
| P0       | BLOCKER, CRITICAL security    | Fix immediately    |
| P1       | CRITICAL bugs, MAJOR security | Fix this sprint    |
| P2       | MAJOR bugs/smells             | Batch fix if quick |
| P3       | MINOR issues                  | Defer to backlog   |

Present summary to user before proceeding.

### Phase 4: Create Cleanup Branch

```bash
git checkout main
git pull origin main
git checkout -b cleanup/sonarcloud-$(date +%Y%m%d-%H%M%S)
```

### Phase 5: Track Fixes

Use TodoWrite to track issues being fixed:

1. Add each P0/P1 issue as a todo item
2. Mark in_progress when working on an issue
3. Mark completed after verification

### Phase 6: Commit and PR

```bash
# Commit fixes
git add -A
git commit -m "fix: SonarCloud cleanup sprint - resolve X issues"

# Create PR
gh pr create --title "fix: SonarCloud cleanup sprint $(date +%Y-%m-%d)" \
  --body "## Summary
- Fixed X security hotspots
- Resolved Y bugs
- Addressed Z code smells

## SonarCloud Analysis
See PR checks for New Code analysis."
```

## Report-Only Mode

When called with `--report`:

1. Skip triggering new analysis
2. Query current issues via MCP
3. Generate summary report
4. Do not create branch or track fixes

## Related Documents

- [SONARCLOUD_CLEANUP_RUNBOOK.md](docs/SONARCLOUD_CLEANUP_RUNBOOK.md) - Detailed
  runbook
- [SONARCLOUD_TRIAGE.md](docs/SONARCLOUD_TRIAGE.md) - Current issue triage
  decisions
- [sonar-project.properties](sonar-project.properties) - Scanner configuration

## Project Configuration

- **Project Key**: `jasonmichaelbell78-creator_sonash-v0`
- **Organization**: `jasonmichaelbell78-creator`
- **Dashboard**:
  https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0
