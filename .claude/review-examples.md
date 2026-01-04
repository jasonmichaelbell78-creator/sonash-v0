# AI Review Output Examples

Real-world examples of what each review type produces. Use these as reference for parsing automation or understanding expected output.

---

## Example 1: Documentation Review

**File:** `docs/firebase-setup.md`

### Review Output

```yaml
status: NEEDS_REVISION
critical_count: 1
warning_count: 2
suggestion_count: 3

findings:
  - severity: CRITICAL
    location: "Line 23"
    issue: "Firebase API key exposed in code example: AIzaSyB3xK..."
    recommendation: "Replace with placeholder: NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here"

  - severity: WARNING
    location: "Prerequisites section, Line 8"
    issue: "States 'Node.js 14+' but package.json requires Node 22+"
    recommendation: "Update to match package.json: 'Node.js 22 or higher'"

  - severity: WARNING
    location: "Line 45-52"
    issue: "Firestore rules example shows 'allow write: if true' which contradicts actual firestore.rules"
    recommendation: "Update example to match security model (Cloud Functions only writes)"

  - severity: SUGGESTION
    location: "Installation section"
    issue: "Missing step to copy .env.example to .env.local"
    recommendation: "Add: 'Copy .env.example to .env.local and fill in your Firebase credentials'"

  - severity: SUGGESTION
    location: "Line 67"
    issue: "Broken link to /docs/authentication.md (file doesn't exist)"
    recommendation: "Either create the authentication guide or remove the link"

  - severity: SUGGESTION
    location: "Overall structure"
    issue: "No troubleshooting section for common setup issues"
    recommendation: "Consider adding FAQ: common errors, CORS issues, emulator setup"

summary: |
  Critical security issue with exposed API key must be fixed immediately.
  Documentation has good structure but needs updates to match current codebase
  (Node version, security model). After fixing critical + warnings, this will
  be a solid setup guide.
```

---

## Example 2: Configuration Review

**File:** `package.json`

### Review Output

```json
{
  "status": "APPROVED",
  "config_type": "package.json",
  "security_score": "SECURE",
  "findings": [
    {
      "severity": "MEDIUM",
      "category": "BEST_PRACTICE",
      "field": "dependencies",
      "issue": "Mix of exact versions (19.2.3) and ranges (^10.4.20)",
      "recommendation": "Adopt consistent strategy: ranges with lockfile is recommended for libraries"
    },
    {
      "severity": "MEDIUM",
      "category": "COMPATIBILITY",
      "field": "dependencies.@types/react",
      "issue": "@types/react@^19 range may resolve to incompatible version",
      "recommendation": "Pin to specific version matching React 19.2.3"
    },
    {
      "severity": "LOW",
      "category": "STRUCTURE",
      "field": "scripts",
      "issue": "No 'pretest' script to ensure test:build runs before test",
      "recommendation": "Consider adding 'pretest': 'npm run test:build' for safety"
    },
    {
      "severity": "LOW",
      "category": "BEST_PRACTICE",
      "field": "scripts.prepare",
      "issue": "Husky setup with fallback is good, but silent failure may hide issues",
      "recommendation": "Consider logging when Husky setup is skipped"
    }
  ],
  "summary": "Configuration is secure and well-structured. No critical issues. Medium-priority items are recommendations for consistency and reliability. Approved for merge with optional improvements."
}
```

---

## Example 3: Security Policy Review

**File:** `firestore.rules`

### Review Output

```yaml
status: BLOCKED
risk_level: CRITICAL
rules_type: firestore

findings:
  - severity: CRITICAL
    rule_path: "/users/{userId}/paymentInfo/{docId}"
    line: 142
    issue: "No authentication check - allows public read access to payment information"
    attack_scenario: |
      Any user (even unauthenticated) can read payment information for any user by:
      1. Guessing or enumerating userId values
      2. Reading /users/{userId}/paymentInfo/{docId} without auth
      This violates PCI compliance and exposes sensitive financial data
    fix: |
      match /users/{userId}/paymentInfo/{docId} {
        allow read: if isOwner(userId);
        allow write: if false; // Cloud Functions only
      }

  - severity: HIGH
    rule_path: "/adminSettings/{settingId}"
    line: 178
    issue: "Admin check validates resource.data.isAdmin instead of custom claims"
    attack_scenario: |
      User could create/update adminSettings document with isAdmin: true field,
      bypassing admin restrictions. Always use request.auth.token.admin
    fix: |
      function isAdmin() {
        return isSignedIn() && request.auth.token.admin == true;
      }

  - severity: MEDIUM
    rule_path: "/users/{userId}/journal/{entryId}"
    line: 34
    issue: "Good: writes blocked for Cloud Function enforcement. Consider App Check"
    recommendation: |
      Add App Check validation to ensure only your Cloud Functions can write:
      function isCloudFunction() {
        return request.auth.token.firebase.sign_in_provider == 'custom' &&
               request.app.id == '<your-app-id>';
      }
      Then: allow create, update: if false; // Already good
      But in Cloud Function, verify App Check token

  - severity: ADVISORY
    rule_path: "Global structure"
    issue: "No rate limiting enforcement in rules"
    recommendation: |
      Firestore rules can't enforce rate limits directly, but document that
      Cloud Functions handle this. Consider adding comment:
      // Rate limiting enforced by Cloud Functions via /rate_limits collection

summary: |
  BLOCKED - Critical vulnerability exposing payment information to public access.
  High severity admin bypass must also be fixed. Do NOT deploy to production.

  Required immediate actions:
  1. Add authentication check to paymentInfo collection
  2. Fix admin validation to use custom claims
  3. Test all rules with emulator before deploying
  4. Consider adding App Check for Cloud Function validation

  After fixes, run: firebase emulators:start and test each rule path.
```

---

## Example 4: Process Change Review

**File:** `.claude/hooks/pre-push.sh`

### Review Output

```yaml
status: NEEDS_TESTING
automation_type: git-hook
risk_assessment: MODERATE_RISK

findings:
  - severity: HIGH
    location: "Lines 15-18"
    issue: "Force push allowed without confirmation or branch check"
    failure_scenario: |
      Developer accidentally runs 'git push --force' on main/production branch,
      overwriting team's commits and losing work
    fix: |
      # Check if force push and prompt
      if git push --dry-run 2>&1 | grep -q 'rejected.*non-fast-forward'; then
        BRANCH=$(git rev-parse --abbrev-ref HEAD)
        if [[ "$BRANCH" =~ ^(main|master|production|staging)$ ]]; then
          echo "ERROR: Force push to protected branch $BRANCH is not allowed"
          exit 1
        fi
        read -p "Force push detected on $BRANCH. Continue? (yes/no): " confirm
        [ "$confirm" != "yes" ] && exit 1
      fi

  - severity: MEDIUM
    location: "Lines 25-30"
    issue: "npm test runs without timeout - could hang indefinitely"
    failure_scenario: |
      Test suite hangs (network issue, infinite loop), developer stuck unable
      to push. No Ctrl+C handling, process blocks terminal
    fix: |
      # Add timeout and proper error handling
      timeout 300 npm test || {
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
          echo "ERROR: Tests timed out after 5 minutes"
        else
          echo "ERROR: Tests failed with exit code $EXIT_CODE"
        fi
        exit 1
      }

  - severity: MEDIUM
    location: "Overall script"
    issue: "No emergency skip mechanism"
    failure_scenario: |
      Production is down, developer needs to push hotfix, but hook is failing
      due to transient issue. No way to bypass temporarily
    fix: |
      # Add at top of script
      if [ -n "$SKIP_HOOKS" ] || [ -n "$NO_VERIFY" ]; then
        echo "⚠️  Pre-push hooks skipped"
        exit 0
      fi
      # Then: SKIP_HOOKS=1 git push (for emergencies)

  - severity: LOW
    location: "Line 8"
    issue: "Assumes 'main' as default branch, doesn't check git config"
    recommendation: |
      Get default branch dynamically:
      DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')

  - severity: LOW
    location: "Error messages"
    issue: "No colored output or emojis for visibility"
    recommendation: |
      Add color codes for errors/warnings:
      RED='\033[0;31m'
      YELLOW='\033[1;33m'
      NC='\033[0m' # No Color
      echo -e "${RED}ERROR:${NC} Tests failed"

summary: |
  Hook provides valuable pre-push validation but needs safety improvements.
  Force push protection is critical for team workflow. Timeout handling and
  skip mechanism important for reliability. Recommend testing these scenarios:

  Test cases needed:
  - Force push to protected branch (should block)
  - Force push to feature branch (should prompt)
  - Hung test suite (should timeout)
  - Network failure during checks (should fail gracefully)
  - Emergency hotfix scenario (should be skippable)

  After implementing fixes, test thoroughly before enabling for team.

testing_recommendations:
  - "Create test branch and attempt force push to main"
  - "Simulate timeout with sleep command in test"
  - "Test SKIP_HOOKS=1 bypass mechanism"
  - "Verify script fails gracefully with network down"
  - "Check behavior with different default branches"
```

---

## Example 5: Dependency Review

**File:** `package.json` (adding new dependency)

### Review Output

```json
{
  "status": "REVIEW_REQUIRED",
  "change_summary": {
    "added": [
      "axios@1.6.2",
      "@stripe/stripe-js@2.3.0"
    ],
    "removed": [],
    "updated": [
      "next: 16.0.0 -> 16.1.1",
      "@sentry/nextjs: 10.25.0 -> 10.30.0"
    ]
  },
  "security_audit_required": true,
  "findings": [
    {
      "severity": "HIGH",
      "package": "axios@1.6.2",
      "category": "SECURITY",
      "issue": "axios 1.6.2 has known SSRF vulnerability (CVE-2024-28849)",
      "recommendation": "Update to axios@1.6.5 or later which patches the vulnerability"
    },
    {
      "severity": "MEDIUM",
      "package": "axios@1.6.2",
      "category": "COMPATIBILITY",
      "issue": "Project already uses native fetch in Next.js - adding axios creates duplication",
      "recommendation": "Consider using Next.js built-in fetch() instead of adding axios dependency"
    },
    {
      "severity": "MEDIUM",
      "package": "@stripe/stripe-js@2.3.0",
      "category": "NEW_DEPENDENCY",
      "issue": "New payment provider integration requires security review",
      "recommendation": "Ensure: (1) Keys stored in env vars, (2) Server-side validation, (3) PCI compliance review"
    },
    {
      "severity": "LOW",
      "package": "next@16.1.1",
      "category": "PATCH_UPDATE",
      "issue": "Minor update 16.0.0 -> 16.1.1 includes bug fixes",
      "recommendation": "Good maintenance update. Review changelog for relevant fixes: https://github.com/vercel/next.js/releases"
    },
    {
      "severity": "LOW",
      "package": "@sentry/nextjs@10.30.0",
      "category": "PATCH_UPDATE",
      "issue": "Sentry SDK update includes performance improvements",
      "recommendation": "Approved. Test error tracking still works in dev environment"
    }
  ],
  "required_actions": [
    "CRITICAL: Update axios to 1.6.5+ to patch CVE-2024-28849",
    "Run: npm audit (verify no other vulnerabilities)",
    "Consider: Remove axios if native fetch is sufficient",
    "Manual: Review Stripe integration security (env vars, validation)",
    "Manual: Test Sentry error tracking after update",
    "Run: npm run build (ensure Next.js 16.1.1 builds successfully)"
  ],
  "summary": "REVIEW REQUIRED due to axios security vulnerability. Update to patched version before merge. Stripe integration needs security review to ensure PCI compliance and proper key management. Next.js and Sentry updates are low-risk maintenance updates. Consider whether axios is needed given Next.js has native fetch support."
}
```

---

## Integration Examples

### 1. GitHub Actions Workflow

```yaml
name: AI Review
on: [pull_request]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Review Documentation
        run: |
          node scripts/ai-review.js --type=documentation --staged --output=json > review-docs.json

      - name: Check for Critical Issues
        run: |
          CRITICAL=$(jq '.critical_count' review-docs.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Critical documentation issues found"
            exit 1
          fi

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const review = require('./review-docs.json');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📝 AI Documentation Review\n\nStatus: ${review.status}\n...`
            });
```

### 2. Pre-commit Hook Integration

```bash
#!/bin/bash
# .claude/hooks/pre-commit.sh

set -e

BLOCKED=0

# Review documentation
DOC_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.md$' || true)
if [ -n "$DOC_FILES" ]; then
  echo "📝 Reviewing documentation..."
  RESULT=$(node scripts/ai-review.js --type=documentation --staged --output=json)
  CRITICAL=$(echo "$RESULT" | jq -r '.critical_count // 0')

  if [ "$CRITICAL" -gt 0 ]; then
    echo "❌ Documentation has $CRITICAL critical issues"
    echo "$RESULT" | jq -r '.findings[] | select(.severity=="CRITICAL") | "  - \(.issue)"'
    BLOCKED=1
  fi
fi

# Review security rules
if git diff --cached --name-only | grep -qE 'firestore\.rules'; then
  echo "🔒 Reviewing security rules..."
  RESULT=$(node scripts/ai-review.js --type=security-policy --file=firestore.rules --output=json)
  RISK=$(echo "$RESULT" | jq -r '.risk_level')

  if [ "$RISK" = "CRITICAL" ]; then
    echo "❌ CRITICAL security vulnerabilities detected"
    echo "$RESULT" | jq -r '.findings[] | select(.severity=="CRITICAL") | "  - \(.issue)"'
    BLOCKED=1
  fi
fi

# Review package.json
if git diff --cached --name-only | grep -qE 'package\.json$'; then
  echo "📦 Reviewing dependencies..."
  RESULT=$(node scripts/ai-review.js --type=dependencies --file=package.json --output=json)

  # Check for high security issues (count critical/high security findings)
  HIGH_SECURITY=$(echo "$RESULT" | jq -r '[.findings[]? | select((.severity=="CRITICAL" or .severity=="HIGH") and .category=="SECURITY")] | length')

  if [ "$HIGH_SECURITY" -gt 0 ]; then
    echo "⚠️  Security vulnerabilities in dependencies ($HIGH_SECURITY)"
    echo "$RESULT" | jq -r '.findings[]? | select(.category=="SECURITY") | "  - \(.package): \(.issue)"'
    BLOCKED=1
  fi
fi

if [ $BLOCKED -eq 1 ]; then
  echo ""
  echo "❌ Commit blocked due to critical issues"
  echo "Fix the issues above or use: git commit --no-verify (not recommended)"
  exit 1
fi

echo "✅ All AI reviews passed"
exit 0
```

### 3. NPM Script for Manual Review

```json
{
  "scripts": {
    "review:all": "npm run review:docs && npm run review:config && npm run review:security",
    "review:docs": "node scripts/ai-review.js --type=documentation --staged",
    "review:config": "node scripts/ai-review.js --type=configuration --file=package.json",
    "review:security": "node scripts/ai-review.js --type=security-policy --file=firestore.rules",
    "review:pre-merge": "git diff main --name-only | xargs -I {} node scripts/ai-review.js --type=documentation --file={}"
  }
}
```

---

## Parsing Review Output

### Extract Critical Issues (Bash)

```bash
# For YAML output
CRITICAL_COUNT=$(grep "critical_count:" review.yaml | awk '{print $2}')

# For JSON output
CRITICAL_COUNT=$(jq '.critical_count // 0' review.json)
```

### Parse for CI/CD (Node.js)

```javascript
const review = JSON.parse(fs.readFileSync('review.json', 'utf-8'));

const hasCritical = review.critical_count > 0;
const hasHigh = review.findings.some(f => f.severity === 'HIGH');

if (hasCritical) {
  console.error('BLOCKED: Critical issues found');
  process.exit(1);
}

if (hasHigh) {
  console.warn('WARNING: High severity issues found');
  // Continue but notify
}
```

### Generate PR Comment

```javascript
function formatReviewForPR(review) {
  let comment = `## 🤖 AI Review: ${review.type}\n\n`;
  comment += `**Status:** ${review.status}\n\n`;

  if (review.findings.length > 0) {
    comment += `### Findings\n\n`;

    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
      const findings = review.findings.filter(f => f.severity === severity);
      if (findings.length > 0) {
        comment += `#### ${severity}\n\n`;
        findings.forEach(f => {
          comment += `- **${f.location}**: ${f.issue}\n`;
          comment += `  - ${f.recommendation}\n\n`;
        });
      }
    });
  }

  return comment;
}
```

---

## Tips for Using Review Output

1. **Parse consistently** - Use jq for JSON, yq for YAML
2. **Set CI thresholds** - Block on CRITICAL, warn on HIGH
3. **Archive reviews** - Save output for compliance auditing
4. **Track metrics** - Count issues by type/severity over time
5. **Customize formatting** - Adjust for your team's needs

---

See full prompts in `.claude/review-prompts.md`
