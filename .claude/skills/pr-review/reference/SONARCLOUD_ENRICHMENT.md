<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# SonarCloud Enrichment (Step 1.5)

When SonarCloud issues are detected in pasted feedback, automatically fetch code
snippets via the SonarCloud MCP to get specific code context.

## Detection Triggers

Look for these patterns in pasted content:

- `javascript:S####` or `typescript:S####` rule IDs
- "Security Hotspot" / "Code Smell" / "Bug" labels
- SonarCloud file paths like `owner_repo:path/to/file.js`
- References to SonarCloud review priority (HIGH/MEDIUM/LOW)

## Auto-Enrichment Steps

When SonarCloud issues detected:

```bash
# Set project key from environment or use default
SONAR_PROJECT_KEY=${SONAR_PROJECT_KEY:-"jasonmichaelbell78-creator_sonash-v0"}

# 1. Fetch issue details with code snippets
curl -fsSL "https://sonarcloud.io/api/issues/search?componentKeys=${SONAR_PROJECT_KEY}&rules=<rule_id>&ps=100" | jq '.issues[] | {file: .component, line: .line, message: .message, rule: .rule}'

# 2. For security hotspots, fetch with status
curl -fsSL "https://sonarcloud.io/api/hotspots/search?projectKey=${SONAR_PROJECT_KEY}&status=TO_REVIEW&ps=100" | jq '.hotspots[] | {file: .component, line: .line, message: .message, rule: .securityCategory}'
```

**Or use MCP tools:**

```
mcp__sonarcloud__<tool>
```

## Why This Matters

Pasted SonarCloud feedback often lacks:

- Actual code snippets showing the issue
- Full context around the flagged line
- Related issues in the same file

Auto-enrichment ensures you see the EXACT code before fixing.
