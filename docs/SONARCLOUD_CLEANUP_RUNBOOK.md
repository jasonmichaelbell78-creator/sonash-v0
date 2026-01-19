# SonarCloud Cleanup Sprint Runbook

**Created**: 2026-01-18 **Purpose**: Repeatable process for SonarCloud analysis
and cleanup sprints

---

## Quick Reference

```bash
# Trigger re-analysis
gh workflow run sonarcloud.yml --ref main

# Check status
gh run list --workflow=sonarcloud.yml --limit 1

# Open dashboard
open "https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0"
```

---

## Prerequisites

Before running a cleanup sprint:

1. **SonarCloud Account**: Sign in at https://sonarcloud.io with GitHub
2. **Project Imported**: Project `jasonmichaelbell78-creator_sonash-v0` exists
3. **SONAR_TOKEN Secret**: Configured in GitHub repo secrets
4. **Workflow Fixed**: `.github/workflows/sonarcloud.yml` has checkout step
5. **Automatic Analysis Disabled**: Must be OFF to use GitHub Actions analysis

---

## Phase 0: Disable Automatic Analysis

> **Important**: SonarCloud cannot run both Automatic Analysis and CI-based
> analysis simultaneously. You must disable Automatic Analysis before triggering
> the GitHub Actions workflow.

### 0.1 Disable Before Analysis

1. Go to:
   https://sonarcloud.io/project/analysis_method?id=jasonmichaelbell78-creator_sonash-v0
2. Under **Analysis Method**, turn **OFF** "Automatic Analysis"
3. Confirm the change is saved

### 0.2 Re-enable After Sprint (Optional)

If you prefer Automatic Analysis for ongoing monitoring:

1. After merging your cleanup PR, return to the Analysis Method page
2. Turn **ON** "Automatic Analysis"
3. Note: Future PRs will use Automatic Analysis instead of GitHub Actions

---

## Phase 1: Trigger Re-Analysis

### 1.1 Manual Trigger via CLI

```bash
# Trigger analysis on main branch
gh workflow run sonarcloud.yml --ref main

# Wait for completion (poll every 30s, check both status and conclusion)
# Uses gh's built-in --jq to avoid external jq dependency
while true; do
  STATUS="$(gh run list --workflow=sonarcloud.yml --limit 1 --json status --jq '.[0].status')"
  CONCLUSION="$(gh run list --workflow=sonarcloud.yml --limit 1 --json conclusion --jq '.[0].conclusion // ""')"

  case "$STATUS" in
    completed)
      case "$CONCLUSION" in
        success)
          echo "Analysis complete!"
          break
          ;;
        cancelled|failure|skipped|timed_out|action_required|stale)
          echo "Analysis finished with conclusion: $CONCLUSION"
          exit 1
          ;;
        *)
          echo "Analysis completed with unknown conclusion: ${CONCLUSION:-<none>}"
          exit 1
          ;;
      esac
      ;;
    *)
      echo "Waiting for analysis to complete... (current status: $STATUS)"
      sleep 30
      ;;
  esac
done
```

### 1.2 Verify in SonarCloud

Open:
https://sonarcloud.io/project/overview?id=jasonmichaelbell78-creator_sonash-v0

Check:

- [ ] Analysis date is current
- [ ] Quality gate status shows (pass/fail)
- [ ] Issue counts are populated

---

## Phase 2: Query Current Issues

### 2.1 Using MCP Tools (Preferred)

If Claude Code is available with SonarCloud MCP:

```
# Quality gate status
mcp__sonarcloud__get_quality_gate(projectKey: "jasonmichaelbell78-creator_sonash-v0")

# Critical issues
mcp__sonarcloud__get_issues(projectKey: "jasonmichaelbell78-creator_sonash-v0", severities: "BLOCKER,CRITICAL")

# Security hotspots
mcp__sonarcloud__get_security_hotspots(projectKey: "jasonmichaelbell78-creator_sonash-v0")
```

### 2.2 Manual API Queries

> **Security Note**: SonarCloud API uses Basic auth. Avoid using
> `curl -u "$TOKEN:"` as it can expose secrets in shell history or logs. Use the
> encoded header approach below instead.

```bash
# Export project key
PROJECT_KEY="jasonmichaelbell78-creator_sonash-v0"

# Get issues using Authorization header (Basic auth with token, safer than -u flag)
# Fail if SONAR_TOKEN not set, strip newlines from base64 output
: "${SONAR_TOKEN:?SONAR_TOKEN must be set}"
SONAR_BASIC_AUTH="$(printf "%s:" "$SONAR_TOKEN" | base64 | tr -d '\n')"
curl -s -H "Authorization: Basic $SONAR_BASIC_AUTH" \
  "https://sonarcloud.io/api/issues/search?projectKeys=$PROJECT_KEY&severities=BLOCKER,CRITICAL"
```

---

## Phase 3: Triage Issues

### 3.1 Priority Matrix

| Priority | Severity | Type      | Action           |
| -------- | -------- | --------- | ---------------- |
| P0       | BLOCKER  | Any       | Fix immediately  |
| P0       | CRITICAL | Security  | Fix immediately  |
| P1       | CRITICAL | Bug       | Fix this sprint  |
| P1       | MAJOR    | Security  | Fix this sprint  |
| P2       | MAJOR    | Bug/Smell | Batch fix        |
| P3       | MINOR    | Any       | Defer to backlog |

### 3.2 Categories

For each issue, assign one category:

- **FIX-NOW**: Fix in this cleanup sprint
- **FALSE-POS**: Add exclusion in `sonar-project.properties`
- **ACCEPT-RISK**: Document in SONARCLOUD_TRIAGE.md with rationale
- **FIX-LATER**: Add to ROADMAP.md backlog

---

## Phase 4: Create Cleanup Branch

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create dated cleanup branch (includes time for uniqueness if run multiple times)
git checkout -b cleanup/sonarcloud-$(date +%Y%m%d-%H%M%S)

# Verify branch
git branch --show-current
```

---

## Phase 5: Fix Issues

### 5.1 Issue Categories

#### Security Hotspots

- Review each hotspot for actual risk
- Fix or document as ACCEPT-RISK with rationale
- Update `sonar-project.properties` for false positives

#### Bugs

- Fix all BLOCKER and CRITICAL bugs
- Review MAJOR bugs for quick wins
- Document deferred bugs in ROADMAP.md

#### Code Smells

- Batch fix by rule type (e.g., all S1481 unused vars)
- Use IDE refactoring tools for consistency
- Avoid mixing fixes with feature changes

### 5.2 Commit Strategy

```bash
# One commit per fix category
git add -A
git commit -m "fix(security): resolve S4721 command injection in scripts

- Sanitize inputs in ai-review.js
- Add input validation to check-pattern-compliance.js

Resolves 5 SonarCloud security hotspots."

# Push to trigger PR analysis (use current branch name)
git push -u origin HEAD
```

---

## Phase 6: Verify Improvements

### 6.1 Open PR

```bash
gh pr create \
  --title "fix: SonarCloud cleanup sprint $(date +%Y-%m-%d)" \
  --body "## Summary
- Fixed X security hotspots
- Resolved Y bugs
- Addressed Z code smells

## SonarCloud Analysis
See PR checks for New Code analysis.

## Related
- docs/SONARCLOUD_TRIAGE.md updated"
```

### 6.2 Check PR Analysis

1. Open the PR in GitHub
2. Wait for SonarCloud check to complete
3. Click "Details" on SonarCloud status check
4. Review "New Code" tab for improvements

### 6.3 Create Analysis Snapshot

Before starting fixes, create a snapshot for tracking progress:

```bash
# Create snapshot directory
mkdir -p docs/audits/sonarcloud-snapshots

# Create dated snapshot file
# Include: Quality Gate status, all issues by rule, all hotspots by category
# See existing snapshots for format: docs/audits/sonarcloud-snapshots/
```

Snapshot should include:

- Quality Gate status and metrics
- All CRITICAL/BLOCKER issues with file:line
- All Security Hotspots grouped by probability
- Issues checklist for tracking fixes
- Estimated effort per batch

### 6.4 Update Documentation

After merge:

```bash
# Update triage document with new baseline
# docs/SONARCLOUD_TRIAGE.md - update counts

# Create post-sprint snapshot for comparison
# Compare issue counts: before vs after
```

---

## Troubleshooting

### Workflow Fails

1. Check GitHub Actions log for specific error
2. Verify `SONAR_TOKEN` secret is set
3. Ensure `sonar-project.properties` has correct project key/org
4. Check SonarCloud project is imported

### No Analysis Data

1. Verify project is imported at https://sonarcloud.io/projects/create
2. Check analysis method is set to "GitHub Actions" (not automatic)
3. Re-trigger workflow manually

### "CI analysis while Automatic Analysis is enabled" Error

If you see this error in the workflow logs:

```
ERROR You are running CI analysis while Automatic Analysis is enabled.
Please consider disabling one or the other.
```

**Solution**: Disable Automatic Analysis in SonarCloud:

1. Go to:
   https://sonarcloud.io/project/analysis_method?id=jasonmichaelbell78-creator_sonash-v0
2. Turn **OFF** "Automatic Analysis"
3. Re-trigger the workflow: `gh workflow run sonarcloud.yml --ref main`

### MCP Tools Return Empty

1. Verify project key matches exactly: `jasonmichaelbell78-creator_sonash-v0`
2. Check SonarCloud has completed at least one analysis
3. Try web dashboard to confirm data exists

---

## Related Documents

- [SONARCLOUD_TRIAGE.md](./SONARCLOUD_TRIAGE.md) - Current issue triage
  decisions
- [sonar-project.properties](../sonar-project.properties) - Scanner
  configuration
- [.github/workflows/sonarcloud.yml](../.github/workflows/sonarcloud.yml) -
  GitHub Actions workflow

---

## Version History

| Version | Date       | Changes                                                         |
| ------- | ---------- | --------------------------------------------------------------- |
| 1.3     | 2026-01-19 | Add Phase 0: Automatic Analysis toggle instructions             |
| 1.2     | 2026-01-18 | Round 2: Basic auth fix, conclusion-aware polling               |
| 1.1     | 2026-01-18 | PR review fixes: polling robustness, token security, timestamps |
| 1.0     | 2026-01-18 | Initial runbook created                                         |
