# Fetch PR Feedback

description: Fetch AI code review feedback from GitHub PR

---

## Instructions

Fetch all AI code review feedback (CodeRabbit, Qodo, SonarQube) from a GitHub PR and prepare it for processing.

### Step 1: Determine PR Number

If a PR number was provided as argument `$ARGUMENTS`, use it.
Otherwise, find the PR for the current branch:

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

### Step 3: Parse and Categorize

Extract suggestions from each source:

**CodeRabbit indicators:**
- Comments from `coderabbitai[bot]`
- Look for "Actionable comments", "Suggestions", walkthrough sections

**Qodo indicators:**
- Comments from `qodo-merge-pro[bot]` or `codiumai-pr-agent[bot]`
- Look for "PR Analysis", "Code Suggestions", compliance checks

**SonarQube indicators:**
- Check runs with "sonarcloud" or "sonarqube" in name
- Quality gate status

### Step 4: Output Format

Present findings in this structure:

```markdown
## PR #N Feedback Summary

**PR:** <title>
**Branch:** <branch>
**State:** <open/merged>

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

### Step 5: Offer Next Steps

After presenting the summary, ask:
"Would you like me to process these suggestions now using the PR review protocol?"

If yes, proceed with the categorization and fix workflow from `/pr-review`.
