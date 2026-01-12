# AI Review Prompts - Quick Reference

Quick lookup for specialized review prompts. See full details in
`review-prompts.md`.

---

## 1. Documentation Review

**When to use:** `.md`, `.mdx` files

**Key Focus:**

- Security leaks (API keys, credentials)
- Broken links and references
- Accuracy vs codebase
- Missing sections

**Auto-block on:**

- Exposed secrets
- Broken critical links
- Contradictions with code

**Output:** YAML with severity levels

---

## 2. Configuration Review

**When to use:** `package.json`, `.env`, `firebase.json`, `tsconfig.json`

**Key Focus:**

- Hardcoded secrets
- Insecure defaults
- Missing env vars
- Version conflicts

**Auto-block on:**

- API keys in config
- CORS wildcards (`*`)
- Disabled security features

**Output:** JSON with security score

---

## 3. Security Policy Review

**When to use:** `firestore.rules`, `storage.rules`, auth policies

**Key Focus:**

- Unauthorized access paths
- Missing auth checks
- Privilege escalation
- Public data exposure

**Auto-block on:**

- `allow read: if true` on user data
- Missing auth validation
- Admin bypass vulnerabilities

**Output:** YAML with risk level

---

## 4. Process Change Review

**When to use:** Git hooks, GitHub Actions, npm scripts, automation

**Key Focus:**

- Destructive operations
- Missing error handling
- Security in automation
- Idempotency

**Auto-block on:**

- Unguarded `rm -rf`
- Force operations without confirm
- Missing fail-safes

**Output:** YAML with risk assessment

---

## 5. Dependency Review

**When to use:** `package.json` changes

**Key Focus:**

- Known CVEs
- Breaking changes
- Version conflicts
- Supply chain risks

**Auto-block on:**

- Packages with critical CVEs
- Unmaintained dependencies
- Typosquatting risks

**Output:** JSON with required actions

---

## Quick Integration

### Pre-commit Hook

```bash
# In .claude/hooks/pre-commit.sh
if git diff --cached --name-only | grep -qE '\.md$'; then
  node scripts/ai-review.js --type=documentation --staged
fi
```

### NPM Script

```json
{
  "scripts": {
    "review:docs": "node scripts/ai-review.js --type=documentation --staged",
    "review:deps": "node scripts/ai-review.js --type=dependencies --file=package.json"
  }
}
```

### Claude CLI

```bash
# Review specific file
node scripts/ai-review.js --type=security-policy --file=firestore.rules | claude chat

# Review all staged markdown files
node scripts/ai-review.js --type=documentation --staged | claude chat
```

---

## Severity Levels

| Level        | Meaning                                  | Action         |
| ------------ | ---------------------------------------- | -------------- |
| **CRITICAL** | Security vulnerability or data loss risk | Block merge    |
| **HIGH**     | Breaking change or significant issue     | Require review |
| **MEDIUM**   | Best practice violation                  | Advisory       |
| **LOW**      | Style/optimization suggestion            | Optional       |

---

## Common Patterns

### Documentation

- ❌ Hardcoded API keys in examples
- ❌ Links to localhost or internal URLs
- ❌ Outdated version numbers
- ✅ Environment variable placeholders
- ✅ Current dependency versions
- ✅ Valid cross-references

### Configuration

- ❌ Secrets in plain text
- ❌ Debug mode in production
- ❌ CORS `"*"` for APIs
- ✅ Environment variables
- ✅ Secure defaults
- ✅ Version pinning strategy

### Security Rules

- ❌ `allow read: if true` on user data
- ❌ Missing `isSignedIn()` checks
- ❌ String comparison for user IDs
- ✅ `isOwner(userId)` validation
- ✅ Least privilege rules
- ✅ Cloud Function only paths

### Process Automation

- ❌ Destructive commands without guards
- ❌ Missing error handling
- ❌ No skip mechanism
- ✅ Input validation
- ✅ Fail-safe defaults
- ✅ Emergency bypass option

### Dependencies

- ❌ Packages with known CVEs
- ❌ Unmaintained (2+ years old)
- ❌ Major version jumps untested
- ✅ Security audit passing
- ✅ Active maintenance
- ✅ Compatible peer deps

---

## Review Checklist

Before merging changes reviewed by AI:

- [ ] All CRITICAL findings addressed
- [ ] HIGH severity issues reviewed by human
- [ ] Breaking changes tested
- [ ] Security implications understood
- [ ] Documentation updated if needed
- [ ] Tests pass (if applicable)

---

## Customization

Edit `.claude/review-prompts.md` to:

1. **Adjust severity thresholds** - What's CRITICAL vs HIGH for your project
2. **Add project-specific rules** - Your coding standards, naming conventions
3. **Modify output format** - Match your CI/CD requirements
4. **Include context** - Prepend project background to prompts

---

## Troubleshooting

**No files detected:**

- Check file extensions match review type
- Verify files are staged with `git diff --cached --name-only`

**Prompt not found:**

- Ensure `.claude/review-prompts.md` exists
- Check section headers match exactly

**False positives:**

- Document in review-prompts.md
- Adjust prompt to exclude known patterns
- Use inline comments to suppress (e.g., `<!-- ai-review: ignore -->`)

---

## Examples

### Review firestore.rules before commit

```bash
node scripts/ai-review.js --type=security-policy --file=firestore.rules
```

### Review all staged documentation

```bash
node scripts/ai-review.js --type=documentation --staged
```

### Check package.json changes

```bash
git diff package.json | node scripts/ai-review.js --type=dependencies --file=package.json
```

### Automated in pre-commit hook

```bash
#!/bin/bash
# .claude/hooks/pre-commit.sh

# Security rules review
if git diff --cached --name-only | grep -qE 'firestore\.rules'; then
  echo "🔒 Reviewing security rules..."
  node scripts/ai-review.js --type=security-policy --staged
  if [ $? -ne 0 ]; then
    echo "❌ Security review failed"
    exit 1
  fi
fi

# Documentation review
if git diff --cached --name-only | grep -qE '\.md$'; then
  echo "📝 Reviewing documentation..."
  node scripts/ai-review.js --type=documentation --staged
fi
```

---

## Performance Tips

1. **Cache prompts** - Load review-prompts.md once, reuse for multiple files
2. **Batch files** - Review related files together for context
3. **Parallel reviews** - Different artifact types can run concurrently
4. **Smart triggering** - Only review changed sections, not entire files
5. **Result caching** - Skip re-review if file unchanged since last review

---

For detailed prompts, implementation notes, and examples, see:

- **Full Guide:** `.claude/review-prompts.md`
- **Implementation:** `scripts/ai-review.js`
