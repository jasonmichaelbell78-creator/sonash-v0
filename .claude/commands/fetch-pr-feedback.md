---
description: Fetch PR Feedback
---

# Fetch PR Feedback

## Instructions

Fetch all AI code review feedback (CodeRabbit, Qodo, SonarQube) from a GitHub PR
and prepare it for processing.

### Step 1: Determine PR Number

If a PR number was provided as argument `$ARGUMENTS`, use it. Otherwise, find
the PR for the current branch:

```bash
# Get current branch
BRANCH=$(git branch --show-current)

# Find PR for this branch
gh pr list --head "$BRANCH" --json number,title,state --limit 1
```

If no PR exists, inform the user and offer to create one.

### Step 2: Fetch PR Details

```bash
PR_NUMBER=<determined above>

# Get PR info
gh pr view $PR_NUMBER --json title,body,state,reviewDecision

# Get all comments (includes CodeRabbit summaries)
gh pr view $PR_NUMBER --comments

# Get review comments (inline code suggestions)
gh api repos/{owner}/{repo}/pulls/$PR_NUMBER/comments --paginate

# Get check runs status (SonarQube, CI)
gh pr checks $PR_NUMBER
```

### Step 2b: Fetch SonarCloud Details via MCP (if available)

If the `sonarcloud` MCP server is available, use it to get detailed SonarQube
analysis:

```
# Get quality gate status
mcp__sonarcloud__get_quality_gate(projectKey="owner_repo", pullRequest="PR_NUMBER")

# Get security hotspots with exact line numbers
mcp__sonarcloud__get_security_hotspots(projectKey="owner_repo", pullRequest="PR_NUMBER")

# Get code issues (bugs, vulnerabilities, code smells)
mcp__sonarcloud__get_issues(projectKey="owner_repo", pullRequest="PR_NUMBER")
```

**Project Key Format:** `{github-owner}_{repo-name}` (e.g.,
`jasonmichaelbell78-creator_sonash-v0`)

**MCP Benefits:**

- Exact file:line numbers for each issue
- Full rule descriptions and fix recommendations
- Structured JSON data (not scraped HTML)
- No authentication issues with dynamic JavaScript

**Fallback:** If MCP unavailable, ask user for SonarCloud URL or screenshot.

### Step 3: Parse and Categorize

Extract suggestions from each source:

**CodeRabbit indicators:**

- Comments from `coderabbitai[bot]`
- Look for "Actionable comments", "Suggestions", walkthrough sections

**Qodo indicators:**

- Comments from `qodo-merge-pro[bot]` or `codiumai-pr-agent[bot]`
- Look for "PR Analysis", "Code Suggestions", compliance checks

**SonarQube indicators (from MCP or checks):**

- Security hotspots with file:line from MCP
- Quality gate status (PASSED/FAILED)
- Issue counts by severity

### Step 4: Output Format

Present findings in this structure:

```markdown
## PR #N Feedback Summary

**PR:** <title> **Branch:** <branch> **State:** <open/merged>

### CodeRabbit Feedback

- [count] actionable comments
- [list each with file:line and summary]

### Qodo Feedback

- [count] suggestions
- [list each with file:line and summary]

### SonarQube Status

- Quality Gate: PASSED/FAILED
- [list any issues]

### CI Status

- [list failed checks if any]

---

Ready to process with /pr-review protocol.
```

### Step 5: Auto-Invoke PR Review Protocol

After presenting the summary, **automatically proceed** with the full
`/pr-review` protocol:

1. **Announce**: "Proceeding with PR review protocol for [N] suggestions..."
2. **Invoke**: Execute all steps from `/pr-review`:
   - Step 0: Context loading (tiered access)
   - Step 1: Multi-pass parsing with critical claims validation
   - Step 2: Categorization (CRITICAL/MAJOR/MINOR/TRIVIAL)
   - Step 3: TodoWrite with learning log entry FIRST
   - Step 4: Invoke specialized agents as needed
   - Step 5: Address issues in priority order
   - Step 6: Document deferred/rejected decisions
   - Step 7: Learning capture (MANDATORY)
   - Step 8: Final summary with verification status
   - Step 9: Commit

**Why auto-invoke?** The fetch command is typically used when there's feedback
to process. Skipping the protocol means:

- No learning capture (institutional knowledge lost)
- No categorization (priority unclear)
- No verification passes (quality risk)
- No consolidation tracking (pattern detection missed)

**Quick mode**: If only checking status (no fixes needed), state: "No actionable
items found. Skipping PR review protocol."

---

## ⚠️ Update Dependencies

When updating this command, also update:

| Document                           | What to Update                               | Why                            |
| ---------------------------------- | -------------------------------------------- | ------------------------------ |
| `docs/SLASH_COMMANDS.md`           | `/fetch-pr-feedback` section, workflow steps | Documentation of this command  |
| `.claude/commands/pr-review.md`    | Referenced steps (if protocol changes)       | This command invokes pr-review |
| `.mcp.json`                        | SonarCloud MCP server config                 | MCP integration for SonarQube  |
| `scripts/mcp/sonarcloud-server.js` | MCP tool implementations                     | SonarCloud API integration     |

**Why this matters:** This command auto-invokes `/pr-review`. Changes to
workflow or protocol must stay synchronized.

---

## MCP Server Setup

To enable SonarCloud MCP integration:

1. **Install dependencies:**

   ```bash
   cd scripts/mcp && npm install
   ```

2. **Set environment variable:**

   ```bash
   export SONAR_TOKEN="your-sonarcloud-token"
   ```

   Get token from: https://sonarcloud.io/account/security

3. **Verify MCP server:** The server is configured in `.mcp.json` and will be
   available as `mcp__sonarcloud__*` tools.
