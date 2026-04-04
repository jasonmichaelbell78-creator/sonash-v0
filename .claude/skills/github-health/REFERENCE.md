<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-04
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# GitHub Health Reference

API catalog, fix recipes, schemas, and grading thresholds for the
`/github-health` skill. This is the implementation handbook — SKILL.md defines
the process, this file defines the how.

**Decisions:** 28 (see `.planning/github-health-skill/DECISIONS.md`)
**Research:** `.research/github-health/RESEARCH_OUTPUT.md`

---

## Core Health Snapshot (GraphQL)

Single compound query powering both `--quick` and `--full` base. ~3-5 cost
points. (Decision #13)

```graphql
query CoreHealthSnapshot($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    vulnerabilityAlerts(states: OPEN, first: 100) {
      totalCount
      nodes {
        securityVulnerability {
          severity
          package {
            name
          }
          advisory {
            ghsaId
            summary
          }
        }
        state
        createdAt
      }
    }
    defaultBranchRef {
      name
      target {
        ... on Commit {
          oid
          statusCheckRollup {
            state
          }
          checkSuites(last: 10) {
            nodes {
              conclusion
              workflowRun {
                workflow {
                  name
                }
              }
            }
          }
        }
      }
    }
    refs(refPrefix: "refs/heads/", first: 100) {
      totalCount
      nodes {
        name
        target {
          ... on Commit {
            committedDate
          }
        }
      }
    }
    issues(states: OPEN) {
      totalCount
    }
    pullRequests(states: OPEN, first: 50) {
      totalCount
      nodes {
        number
        title
        createdAt
        updatedAt
        isDraft
        mergeable
        author {
          login
        }
        labels(first: 5) {
          nodes {
            name
          }
        }
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
              }
            }
          }
        }
      }
    }
    labels(first: 100) {
      totalCount
      nodes {
        name
        color
      }
    }
    milestones(first: 10) {
      totalCount
    }
    deleteBranchOnMerge
    description
    repositoryTopics(first: 10) {
      nodes {
        topic {
          name
        }
      }
    }
    isPrivate
    hasIssuesEnabled
  }
}
```

**Invocation via gh CLI:**

```bash
gh api graphql -f query='...' -f owner=OWNER -f repo=REPO
```

---

## Section 1: Security Phase API Endpoints

### Dependabot Alerts (from Core Snapshot GraphQL)

Already in the core query as `vulnerabilityAlerts`. For detailed view:

```bash
# REST: full alert details with fix info
gh api repos/{owner}/{repo}/dependabot/alerts?state=open --paginate
```

### Secret Scanning Alerts (REST only)

```bash
# List open alerts
gh api repos/{owner}/{repo}/secret-scanning/alerts?state=open

# Per-alert detail
gh api repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}

# Per-alert locations
gh api repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations
```

### Code Scanning Alerts (REST only)

```bash
# List open alerts
gh api repos/{owner}/{repo}/code-scanning/alerts?state=open --paginate

# Group by rule
gh api repos/{owner}/{repo}/code-scanning/alerts?state=open --jq \
  'group_by(.rule.id) | map({rule: .[0].rule.id, count: length})'
```

### Repository Security Settings

```bash
# Check security features (validity checks, push protection)
gh api repos/{owner}/{repo} --jq '.security_and_analysis'
```

### Commit Signing (GraphQL)

```graphql
# Check signature status of last 30 commits on main
{
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 30) {
            nodes {
              oid
              signature {
                isValid
                signer {
                  login
                }
              }
              author {
                user {
                  login
                }
              }
              committer {
                user {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Section 2: Actions Phase API Endpoints

### Workflow Runs

```bash
# List all workflows
gh api repos/{owner}/{repo}/actions/workflows --jq '.workflows[] | {name, state, path}'

# Recent failures on main
gh api "repos/{owner}/{repo}/actions/runs?branch=main&status=failure&per_page=10"

# Specific workflow runs
gh api "repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs?per_page=5"
```

### Workflow YAML Files

```bash
# Read workflow file content
gh api repos/{owner}/{repo}/contents/.github/workflows/{filename} \
  --jq '.content' | base64 -d
```

Checks to perform on YAML:

- `permissions:` block present? (TokenPermissions)
- Action versions pinned to SHA? (PinnedDependencies)
- Auto-merge has `gh pr review --approve` step?
- `dependency-review` workflow exists?

### Actions Cache Usage (REST)

```bash
# Total cache usage
gh api repos/{owner}/{repo}/actions/cache/usage

# List all caches (for staleness analysis)
gh api repos/{owner}/{repo}/actions/caches --paginate \
  --jq '.actions_caches[] | {id, key, created_at, last_accessed_at, size_in_bytes}'
```

### CI Duration Trending

```bash
# Get timing from recent successful runs of CI workflow
gh api "repos/{owner}/{repo}/actions/workflows/ci.yml/runs?status=success&per_page=10" \
  --jq '.workflow_runs[] | {created_at, updated_at}'
```

Compute wall-clock duration: `updated_at - created_at` for each run.

---

## Section 3: Dependencies Phase API Endpoints

### Dependabot Config

```bash
# Read dependabot.yml
gh api repos/{owner}/{repo}/contents/.github/dependabot.yml \
  --jq '.content' | base64 -d
```

### SBOM (REST)

```bash
# Fetch SBOM (CycloneDX format)
gh api repos/{owner}/{repo}/dependency-graph/sbom
```

Parse: `.sbom.packages[].licenseConcluded` for license distribution.

### Package.json Discovery

Check filesystem for package.json files:

- `/package.json` (root)
- `/functions/package.json`
- `/scripts/mcp/package.json`

Compare against dependabot.yml ecosystem entries to find coverage gaps.

---

## Section 4: Config Phase API Endpoints

### Rulesets

```bash
# List rulesets
gh api repos/{owner}/{repo}/rulesets

# Detailed ruleset
gh api repos/{owner}/{repo}/rulesets/{ruleset_id}
```

### Environments

```bash
# List environments
gh api repos/{owner}/{repo}/environments

# Environment protection rules
gh api repos/{owner}/{repo}/environments/{name}
```

### Community Profile

```bash
gh api repos/{owner}/{repo}/community/profile
```

### Webhooks

```bash
gh api repos/{owner}/{repo}/hooks
```

### Issues (from Core Snapshot or REST for detail)

```bash
# List open issues with labels and age
gh api "repos/{owner}/{repo}/issues?state=open&per_page=100" \
  --jq '.[] | {number, title, created_at, labels: [.labels[].name]}'
```

---

## Section 5: Release Phase API Endpoints

### Release Please Runs

```bash
# Latest Release Please workflow runs
gh api "repos/{owner}/{repo}/actions/workflows/release-please.yml/runs?per_page=5"
```

### Release Config Files

```bash
# Read release-please-config.json
gh api repos/{owner}/{repo}/contents/release-please-config.json \
  --jq '.content' | base64 -d

# Read .release-please-manifest.json
gh api repos/{owner}/{repo}/contents/.release-please-manifest.json \
  --jq '.content' | base64 -d
```

### Tags

```bash
gh api repos/{owner}/{repo}/tags --jq '.[].name'
```

---

## Section 6: Insights Phase API Endpoints

### Traffic

```bash
# Views (last 14 days)
gh api repos/{owner}/{repo}/traffic/views

# Clones (last 14 days)
gh api repos/{owner}/{repo}/traffic/clones

# Top referrers
gh api repos/{owner}/{repo}/traffic/popular/referrers
```

### Commit Activity

```bash
# Weekly commit activity (last 52 weeks)
gh api repos/{owner}/{repo}/stats/commit_activity
```

---

## Section 7: PR Health Phase API Endpoints

PR data comes from the Core Health Snapshot GraphQL query
(`pullRequests(states: OPEN, first: 50)`). For deeper analysis:

```bash
# Open PRs with CI status
gh pr list --state open --json number,title,createdAt,isDraft,author,labels,statusCheckRollup

# PR mergeable status (GraphQL field already in core query)
# mergeable: MERGEABLE | CONFLICTING | UNKNOWN
```

**Staleness thresholds:**

- Human PRs: >7 days = stale
- Dependabot PRs: >3 days = stale
- Draft PRs: >14 days = abandoned exploration
- CI-blocked: check status failing >24h

---

## Fix Recipes

### Recipe 1: Close False-Positive Secret Alert

```bash
gh api --method PATCH \
  repos/{owner}/{repo}/secret-scanning/alerts/{alert_number} \
  -f state=resolved \
  -f resolution=false_positive \
  -f resolution_comment="Firebase web API key - public by design, protected by Security Rules and App Check"
```

### Recipe 2: Add Repo Topics

```bash
gh api --method PUT repos/{owner}/{repo}/topics \
  -f "names[]=nextjs" -f "names[]=firebase" -f "names[]=typescript" \
  -f "names[]=personal-health" -f "names[]=solo-project"
```

### Recipe 3: Update dependabot.yml

Edit `.github/dependabot.yml` to add:

- Missing ecosystem paths (e.g., `scripts/mcp/` for npm)
- Security-update grouping (`applies-to: security-updates`)
- Cooldown configuration (`cooldown: {semver-major-days: 30}`)

Commit and push on fix branch.

### Recipe 4: Add Workflow Permissions Block

Edit workflow YAML to add top-level:

```yaml
permissions: read-all
```

Then override per-job with minimum necessary permissions.

### Recipe 5: Pin Workflow Action SHA

Replace `uses: actions/checkout@v4` with `uses: actions/checkout@<full-sha>`.

Lookup SHA: `gh api repos/actions/checkout/commits/v4 --jq '.sha'`

### Recipe 6: Add PR Approval Step to Auto-Merge

Edit `auto-merge-dependabot.yml` to add before merge step:

```yaml
- name: Approve PR
  run: gh pr review --approve "$PR_URL"
  env:
    PR_URL: ${{ github.event.pull_request.html_url }}
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Recipe 7: Add Issue Templates

Create files:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

With standard GitHub template structure.

### Recipe 8: Add/Delete Labels

```bash
# Create label
gh label create "tier-3" --color "0075ca" --description "Tier 3 priority"

# Delete label
gh label delete "old-label" --yes
```

### Recipe 9: Add Branch Deploy Policy

```bash
gh api --method PUT \
  repos/{owner}/{repo}/environments/Production/deployment-branch-policies \
  -f name=main -f type=branch
```

Note: Also requires `environment: Production` in deploy workflow YAML.

### Recipe 10: Create Tag Protection Ruleset

```bash
gh api --method POST repos/{owner}/{repo}/rulesets \
  --input - <<'EOF'
{
  "name": "tag-protection",
  "target": "tag",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~ALL"], "exclude": [] } },
  "rules": [
    { "type": "creation" },
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
EOF
```

### Recipe 11: Delete Stale Actions Caches

```bash
# Delete specific cache by ID
gh api --method DELETE repos/{owner}/{repo}/actions/caches/{cache_id}

# Delete caches by key prefix
gh api --method DELETE \
  "repos/{owner}/{repo}/actions/caches?key=prefix-"
```

### Recipe 12: Close Stale PRs

```bash
gh pr close {number} --comment "Closing: stale for [N] days. Reopen if needed."
```

### Recipe 13: Enable deleteBranchOnMerge

```bash
gh api --method PATCH repos/{owner}/{repo} \
  -f delete_branch_on_merge=true
```

### Recipe 14: UI-Only Fixes (Decision #23)

For fixes requiring GitHub Settings UI, present step-by-step instructions:

**Enable Secret Scanning Validity Checks:**

```
USER ACTION REQUIRED:
  1. Go to https://github.com/{owner}/{repo}/settings/security_analysis
  2. Under "Secret scanning", find "Validity checks"
  3. Click "Enable"
  Expected: Secret alerts will show "Active" / "Inactive" / "Unknown" status
```

**Verify PAT Revocation:**

```
USER ACTION REQUIRED:
  1. Go to https://github.com/settings/tokens
  2. Search for the token prefix shown in the alert
  3. If found and active: click "Delete" to revoke
  4. If not found: token is already revoked
  5. Return here and confirm status
```

---

## Schemas

### github-health-history.jsonl Record

```json
{
  "timestamp": "2026-04-04T12:00:00.000Z",
  "mode": "quick|full",
  "grade": "A|B|C|D|F",
  "color": "GREEN|YELLOW|RED",
  "issues": { "p0": 0, "p1": 0, "p2": 0, "p3": 0 },
  "totalIssues": 0,
  "cachePercent": 46,
  "openPRs": 0,
  "depAlerts": 0,
  "secretAlerts": 0,
  "branches": 2,
  "ciState": "SUCCESS|FAILURE|ERROR|PENDING|null",
  "phases": {
    "security": "A",
    "actions": "B",
    "deps": "A",
    "config": "C",
    "release": "F",
    "insights": "A",
    "prs": "A"
  },
  "errors": ["optional array of API errors"]
}
```

### github-health-suppressions.json

```json
{
  "version": 1,
  "suppressions": [
    {
      "id": "secret-alert-1",
      "category": "security",
      "reason": "Firebase web API key - public by design",
      "suppressedAt": "2026-04-04T12:00:00.000Z",
      "expiresAt": null
    }
  ],
  "categorySuppressions": [
    {
      "category": "insights",
      "reason": "Informational only, no action needed",
      "suppressedAt": "2026-04-04T12:00:00.000Z"
    }
  ]
}
```

### Grading Thresholds (Decision #10)

| Grade | Criteria         | Color  |
| ----- | ---------------- | ------ |
| A     | 0 issues         | GREEN  |
| B     | P3 only          | GREEN  |
| C     | 1-2 P2 issues    | YELLOW |
| D     | Any P1, or 3+ P2 | RED    |
| F     | Any P0           | RED    |

### License Flag Categories (Decision #12)

| Category | Licenses                                         | Action              |
| -------- | ------------------------------------------------ | ------------------- |
| WARNING  | GPL, AGPL, LGPL, MPL-2.0, unknown, null          | Flag in findings    |
| INFO     | FSL                                              | Note but don't flag |
| IGNORE   | MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC | Skip                |

### Trend Alert Thresholds (Decision #14)

| Trigger         | Threshold                          |
| --------------- | ---------------------------------- |
| Grade drop      | 2+ letters (e.g., B to D)          |
| Cache growth    | +20% since last run                |
| PR accumulation | +3 open PRs since last run         |
| New P0          | Any new P0 that wasn't in last run |
