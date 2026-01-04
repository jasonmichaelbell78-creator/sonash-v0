# Review Policy Quick Reference

**Last Updated:** 2026-01-04
**Purpose:** One-page cheat sheet for review tiers and workflows

---

## 30-Second Decision Guide

**Ask yourself: "What am I changing?"**

| If you're changing... | Tier | Review needed | Time to merge |
|----------------------|------|---------------|---------------|
| Typos, comments, logs | **T0** | None (auto-merge) | 4 hours |
| Docs, tests, UI copy | **T1** | AI only | 1-2 days |
| Features, bug fixes | **T2** | AI + 1 human | 2 days |
| Auth, payments, security | **T3** | AI + 2 humans + checklist | 3-5 days |
| Infrastructure, schema | **T4** | RFC + all owners | 1-2 weeks |

---

## File Path → Tier Lookup

```
Tier 0 (Auto-merge):
  ✅ Non-critical .md files
  ✅ .log files
  ✅ package-lock.json (when package.json unchanged)

Tier 1 (AI only):
  ✅ docs/**/*.md
  ✅ **/*.test.ts
  ✅ styles/**/*.css

Tier 2 (AI + human):
  ✅ app/**/*.tsx
  ✅ components/**/*.tsx
  ✅ lib/**/*.ts
  ✅ hooks/**/*.ts

Tier 3 (Heavy review):
  ⚠️ functions/src/auth/**
  ⚠️ firestore.rules
  ⚠️ middleware/**
  ⚠️ lib/rate-limiter.ts

Tier 4 (Critical):
  🚨 .github/workflows/**
  🚨 firebase.json
  🚨 package.json
  🚨 next.config.js
```

---

## Escalation Triggers

**Your PR will auto-escalate if it contains:**

| Pattern | Auto-escalate to | Why |
|---------|------------------|-----|
| `eval(` | Tier 4 | Code injection risk |
| `dangerouslySetInnerHTML` | Tier 3 | XSS risk |
| `firebase.auth()` changes | Tier 3 | Auth flow |
| `admin.firestore()` | Tier 3 | Direct DB access |
| `BREAKING CHANGE:` in commit | Tier 3 | API compatibility |
| Hardcoded API key pattern | ❌ BLOCKED | Security violation |

---

## Fast-Path Eligibility

**Your PR can auto-merge if:**
- ✅ Tier 0 or Tier 1
- ✅ All CI checks pass
- ✅ No AI warnings
- ✅ Matches fast-path patterns:
  - `docs: Fix typo in [non-critical]`
  - `chore: Remove console.log`
  - `style: Format * with Prettier`
  - `test: Add unit test for *`

**Auto-merge timeline:** 4 hours after CI passes

---

## Approval Matrix

| Tier | Who approves | Checklist required |
|------|--------------|-------------------|
| **T0** | CI only | None |
| **T1** | AI only (human optional) | None |
| **T2** | AI + 1 human | None |
| **T3** | AI + 2 humans (1 owner) | Security checklist |
| **T4** | AI + all owners (3+) | RFC + Security + Deploy plan |

---

## Common Scenarios

### "I'm fixing a typo in README.md"
```
Tier: 0 (if non-functional text)
Review: None
Action: Commit → Wait 4h → Auto-merge
```

### "I'm adding a new React component"
```
Tier: 2
Review: AI + 1 human
Action: Create PR → AI reviews → Address issues →
        Request review → Merge after approval
Timeline: 1-2 days
```

### "I'm changing how login works"
```
Tier: 3
Review: AI + 2 humans + security checklist
Action: Create PR → AI exhaustive review →
        Address all Critical/Major →
        Complete security checklist →
        Get 2 human approvals → Merge
Timeline: 3-5 days
```

### "I'm updating a GitHub Actions workflow"
```
Tier: 4
Review: RFC + Multi-AI + all owners
Action: Write RFC → Get RFC approval →
        Implement → Multi-AI review →
        All owners approve →
        Deploy to staging → Test → Deploy to prod
Timeline: 1-2 weeks
```

---

## Batch Review Tips

**Batch these together:**
- Multiple doc updates → Single PR labeled "batch/docs-YYYY-MM-DD"
- Multiple test additions → Single PR labeled "batch/tests-YYYY-MM-DD"
- Multiple UI text changes → Single PR labeled "batch/copy-YYYY-MM-DD"

**Saves:** 7+ hours of review overhead

---

## When to Escalate Manually

**You should request tier escalation if:**
- You're uncertain about security implications
- Change affects more systems than you initially thought
- You discovered edge cases during implementation
- Change touches critical user data

**How to escalate:**
Add comment to PR: `@codeowner - Requesting tier escalation to T3 because [reason]`

---

## When to De-Escalate

**You can request tier reduction if:**
- Change only touches test fixtures (not production code)
- Automated tier assignment is overly cautious
- Files changed are in Tier X path but change is actually lower risk

**How to de-escalate:**
Add comment to PR:
```markdown
## Tier Reduction Request
**Current Tier:** 3
**Requested Tier:** 2
**Reason:** Only touches test mocks, not actual auth code
```

---

## Red Flags (Auto-Block Merge)

**These patterns will block your PR:**
- ❌ Hardcoded API keys: `sk_live_*`, `api_key = "..."`
- ❌ Hardcoded passwords: `password = "..."`
- ❌ .env files committed (except .env.example)
- ❌ TODO: SECURITY (incomplete security work)
- ❌ @ts-ignore without explanation comment

**Fix before merge can proceed**

---

## Review Time SLAs

| Tier | First review by | Merge target | Urgent bypass |
|------|----------------|--------------|---------------|
| T0 | Auto | 4 hours | N/A |
| T1 | 24 hours | 48 hours | Request fast-track |
| T2 | 24 hours | 48 hours | Request fast-track |
| T3 | 12 hours | 5 days | Production incident only |
| T4 | 48 hours | 14 days | Critical security fix |

---

## FAQ

**Q: My Tier 1 PR has been waiting 3 days. What do I do?**
A: Ping the PR. If no response in 24h, it can self-merge after AI approval (good faith allowance).

**Q: Can I use `git commit --no-verify` to bypass pre-commit hooks?**
A: No. Team policy prohibits this (see DEVELOPMENT.md). CI will catch issues anyway.

**Q: AI is flagging 10 minor style issues. Do I need to fix all of them?**
A: No. Address Critical + Major. Minor = fix if quick (<15 min) or defer with reason.

**Q: How do I know if my change needs a security checklist?**
A: If it's Tier 3+ OR touches files in `functions/src/auth/`, `firestore.rules`, or middleware.

**Q: Can I batch a Tier 2 change with Tier 1 docs?**
A: Yes, but the batch inherits the highest tier (Tier 2 in this case).

**Q: What if I disagree with AI's suggestion?**
A: You can mark as "Won't Fix" with explanation. For Tier 2+, human reviewer will adjudicate.

---

## Checklists

### Pre-PR Checklist (All Tiers)
- [ ] All tests pass locally
- [ ] No console.log statements (except intentional logging)
- [ ] No hardcoded secrets
- [ ] Code formatted with Prettier
- [ ] TypeScript checks pass

### Tier 3+ Additional Checklist
- [ ] Security checklist completed (GLOBAL_SECURITY_STANDARDS.md)
- [ ] Rollback plan documented in PR description
- [ ] Error handling comprehensive
- [ ] Rate limiting verified (if endpoint change)
- [ ] Monitoring/logging added

### Tier 4 Additional Checklist
- [ ] RFC written and approved
- [ ] Staging deployment tested
- [ ] Canary deployment plan documented
- [ ] Incident response plan updated (if needed)
- [ ] All documentation updated

---

## Related Documents

- **Full Policy:** [REVIEW_POLICY_ARCHITECTURE.md](./REVIEW_POLICY_ARCHITECTURE.md)
- **Security Standards:** [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md)
- **AI Review Process:** [AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md)
- **PR Workflow:** [PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md)

---

**Pro Tip:** Bookmark this page. Reference before every PR.
