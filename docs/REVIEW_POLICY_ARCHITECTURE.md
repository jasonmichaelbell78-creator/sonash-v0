# Review Policy Architecture

**Document Type:** FOUNDATION (Tier 2) **Version:** 1.1 **Created:** 2026-01-04
**Status:** UNDER IMPLEMENTATION (Phase 1 in progress) **Authority:** MANDATORY
for all development activities after Phase 1 completion **Last Updated:**
2026-01-04

> **Implementation Note:** This document describes the target review policy
> architecture. Full enforcement begins after Phase 1 deliverables are complete
> (see Section 6.1). Currently, only blocking CI checks (ESLint, TypeScript,
> tests) are enforced.

---

## Purpose

This document defines a **lightweight, AI-first review policy architecture**
that balances thoroughness with developer productivity. It classifies all
project artifacts into review tiers and establishes clear automation vs. human
touchpoints.

**Design Philosophy:**

- **AI-first**: Leverage Claude Code as primary reviewer
- **Tier-based**: Match review rigor to artifact risk/impact
- **Fast-path defaults**: Routine changes flow quickly
- **Escalate intelligently**: Human review only when needed
- **Process audits**: Continuously improve the review system itself

**Scope:** This policy applies to ALL project artifacts:

- Code (TypeScript, JavaScript, React components)
- Documentation (Markdown files)
- Infrastructure (GitHub Actions, hooks, configs)
- Data (Firestore rules, schemas)
- Security (auth flows, API keys)

## Quick Start

1. Understand the policy structure and hierarchy
2. Identify which policies apply to your task
3. Follow the enforcement mechanisms specified

## AI Instructions

When implementing review policies:

- Understand the full architecture before making changes
- Ensure changes align with policy hierarchy
- Update related documents when modifying architecture

---

## Table of Contents

1. [Tier Classification System](#1-tier-classification-system)
2. [Automation vs Human Balance](#2-automation-vs-human-balance)
3. [Review Triggers](#3-review-triggers)
4. [Anti-Burden Principles](#4-anti-burden-principles)
5. [Process Audits](#5-process-audits)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## 1. Tier Classification System

### 1.1 Overview

All artifacts are classified into **5 review tiers** based on:

- **Risk**: Security, data loss, user impact
- **Scope**: Number of users/systems affected
- **Reversibility**: How easy to rollback
- **Frequency**: How often this artifact changes
- **Complexity**: Technical sophistication required

| Tier   | Name     | Review Depth | Automation          | Human Review       | Typical Artifacts           |
| ------ | -------- | ------------ | ------------------- | ------------------ | --------------------------- |
| **T0** | Exempt   | None         | ✅ Auto-merge       | ❌ Never           | Typos, comments, logs       |
| **T1** | Light    | Surface      | ✅ Automated checks | 🟡 Optional        | Docs, tests, UI copy        |
| **T2** | Standard | Moderate     | ✅ Full CI/CD       | 🟢 AI required     | Features, bug fixes         |
| **T3** | Heavy    | Deep         | ✅ Extended suite   | 🟢 AI + Human spot | Auth, payments, migrations  |
| **T4** | Critical | Exhaustive   | ✅ Maximum          | 🔴 Multi-human     | Security, data model, infra |

---

### 1.2 Tier 0: Exempt (No Review)

**Criteria:**

- Zero functional impact
- No user-facing changes
- Fully reversible
- Cannot introduce bugs or vulnerabilities

**Examples:**

- Typo fixes in comments
- Console.log removals
- Whitespace/formatting (Prettier already applied)
- Internal-only documentation updates (non-Tier 1 docs)
- Log message text changes
- Package-lock.json updates (when package.json unchanged)

**Review Process:**

```
Developer commits → Pre-commit hooks pass → Auto-merge to main
```

**Automation:**

- ✅ Pre-commit: Prettier, ESLint auto-fix
- ✅ CI: Quick smoke test (lint, build)
- ❌ Human review: None

**Fast-Path Allowance:** Commits matching these patterns auto-merge:

- `docs: Fix typo in [non-critical doc]`
- `chore: Remove console.log statements`
- `style: Format [file] with Prettier`

**Safety Net:**

- Post-merge CI still runs (catches regressions)
- Can revert instantly if issues found
- Weekly audit of auto-merged commits

---

### 1.3 Tier 1: Light (Surface Review)

**Criteria:**

- Low functional impact
- Isolated changes
- Well-tested artifact type
- Easy to verify correctness

**Examples:**

- Documentation updates (non-canonical)
- Unit test additions
- UI copy/text changes
- Component prop additions (backward compatible)
- CSS/styling changes
- Non-production scripts

**Review Process:**

```
Developer commits → Pre-commit hooks → CI checks → AI review → Merge
```

**Automation:**

- ✅ Pre-commit: Lint, type-check, test
- ✅ CI: Full test suite, build, pattern checks
- ✅ AI Review (CodeRabbit/Qodo): Surface scan
- 🟡 Human review: Optional (skip if AI passes)

**AI Review Focus:**

- Markdown lint issues
- Broken links
- Code style violations
- Missing test coverage
- Documentation completeness

**Human Review Triggers:**

- AI flags 3+ issues
- Security-sensitive paths touched
- Developer requests review

**Approval Authority:**

- AI approval: Sufficient for merge
- Auto-merge after 24 hours if no issues flagged

---

### 1.4 Tier 2: Standard (Moderate Review)

**Criteria:**

- Moderate functional impact
- Affects multiple components
- User-facing changes
- Standard feature work

**Examples:**

- New features (non-critical)
- Bug fixes (non-security)
- Component refactoring
- API endpoint changes (non-auth)
- Database query modifications
- Configuration changes

**Review Process:**

```
Developer commits → Pre-commit → CI → AI deep review → Human spot check → Merge
```

**Automation:**

- ✅ Pre-commit: Full lint-staged
- ✅ CI: Tests, build, security scan, pattern checks
- ✅ AI Review: Deep analysis
  - Logic verification
  - Edge case identification
  - Performance implications
  - Breaking change detection

**Human Review:**

- 🟢 **Required**: At least one human reviewer
- **Review focus:**
  - Verify AI didn't miss logic errors
  - Check user experience
  - Confirm alignment with roadmap
  - Spot-check test coverage

**Approval Authority:**

- AI + 1 human approval required
- Blockers:
  - Critical AI issues unresolved
  - Tests failing
  - Security scan failures

**SLA:**

- First review within 24 hours
- Merge within 48 hours (if approved)

---

### 1.5 Tier 3: Heavy (Deep Review)

**Criteria:**

- High functional impact
- Security-sensitive
- Affects critical user flows
- Complex technical changes
- Data integrity concerns

**Examples:**

- Authentication/authorization changes
- Payment processing
- Database migrations
- Security rule updates
- Rate limiting changes
- Email/notification systems
- Data export/import features

**Review Process:**

```
Developer commits → Pre-commit → CI → AI exhaustive review →
Multi-human review → Security checklist → Merge
```

**Automation:**

- ✅ Pre-commit: Full suite
- ✅ CI: Extended test suite, security scans, dependency review
- ✅ AI Review: Exhaustive analysis
  - Security audit
  - Data flow tracing
  - Error handling verification
  - Rollback planning
- ✅ Multi-AI review: CodeRabbit + Qodo + manual AI prompt

**Human Review:**

- 🔴 **Required**: Minimum 2 human reviewers
- **Review focus:**
  - Security implications (use GLOBAL_SECURITY_STANDARDS.md)
  - Data loss scenarios
  - Rollback procedures
  - User impact assessment
  - Compliance (OWASP, privacy)

**Required Checklists:**

- [ ] Security checklist completed (GLOBAL_SECURITY_STANDARDS.md)
- [ ] Rollback plan documented
- [ ] Data migration tested (if applicable)
- [ ] Error handling comprehensive
- [ ] Rate limiting verified
- [ ] Monitoring/logging added

**Approval Authority:**

- AI + 2 human approvals required
- One approver must be codebase owner
- All blocking issues resolved

**SLA:**

- First review within 12 hours
- Merge within 3-5 days (expedite if critical)

---

### 1.6 Tier 4: Critical (Exhaustive Review)

**Criteria:**

- Critical system impact
- Irreversible changes
- Affects all users
- Infrastructure-level changes
- Data model changes

**Examples:**

- Firestore security rules (production)
- Database schema changes
- Infrastructure as code (GitHub Actions changes)
- Third-party integration changes (Stripe, Firebase)
- Deployment pipeline modifications
- Global configuration changes
- Multi-tenant data model changes

**Review Process:**

```
Developer creates proposal → RFC review → Implementation →
Pre-commit → CI → Multi-AI exhaustive review →
Multi-human review → Staging deployment →
Production canary → Full rollout
```

**Automation:**

- ✅ Pre-commit: Full suite + custom validators
- ✅ CI: Maximum test coverage, security scans, integration tests
- ✅ AI Review: Multi-model exhaustive review
  - Claude Opus for architecture review
  - CodeRabbit for code patterns
  - Qodo for test coverage
  - Custom AI security audit
- ✅ Staging deployment: Automated smoke tests
- ✅ Canary deployment: Gradual rollout with monitoring

**Human Review:**

- 🔴 **Required**: All codebase owners (minimum 3 reviewers)
- **Review stages:**
  1. **RFC stage**: Design review before implementation
  2. **Implementation stage**: Code review
  3. **Pre-deploy stage**: Final verification
  4. **Post-deploy stage**: Monitoring review

**Required Artifacts:**

- [ ] RFC document (design, risks, rollback)
- [ ] Security audit report (AI-generated + human verified)
- [ ] Test plan with >90% coverage
- [ ] Rollback procedure (tested)
- [ ] Monitoring plan
- [ ] Incident response plan update (if needed)
- [ ] Documentation updates

**Approval Authority:**

- RFC approved by all owners
- Implementation approved by all owners
- Production deployment requires manual trigger
- Rollback authority: Any owner can trigger

**SLA:**

- RFC review: 2-3 days
- Implementation review: 3-5 days
- Deployment window: Planned maintenance window
- Post-deploy monitoring: 7 days

---

## 2. Automation vs Human Balance

### 2.1 Fully Automated (No Human Needed)

**When:**

- Changes match Tier 0 criteria
- All automated checks pass
- No AI warnings flagged
- Pattern matches known-safe changes

**What's Automated (Currently Implemented):** | Check | Tool | Blocks Merge |
Status | |-------|------|--------------|--------| | Linting | ESLint | ✅ Yes |
✅ Implemented | | Type checking | TypeScript | ✅ Yes | ✅ Implemented | | Unit
tests | Node test runner | ✅ Yes | ✅ Implemented | | Build | Next.js | ✅ Yes
| ✅ Implemented | | Security patterns | check-pattern-compliance.js | 🟡
Warning only | ✅ Implemented | | Dependency vulnerabilities | npm audit | 🟡
Warning only | ⏳ Planned | | Code security | CodeQL | 🟡 Advisory | ⏳ Planned
| | Documentation lint | docs:check | 🟡 continue-on-error | ✅ Implemented |

> **Note:** Full auto-merge is not yet implemented. The conditions below
> describe the target state after Phase 2 completion.

**Auto-Merge Conditions (Target State - Phase 2):**

```javascript
// These functions will be implemented in Phase 2
if (
  tier === 0 &&
  allChecksPass() &&
  noAIWarnings() && // Phase 2: AI review integration
  !touchesSecurityPaths() && // Phase 2: Security path detection
  !modifiesPublicAPI() // Phase 2: API change detection
) {
  autoMerge();
}
```

**Examples:**

- `docs: Fix typo in README.md`
- `chore: Remove unused imports`
- `style: Format components with Prettier`

---

### 2.2 AI-Assisted Review (AI Required, Human Optional)

**When:**

- Tier 1 or Tier 2 changes
- Standard feature work
- Bug fixes (non-critical)
- Documentation updates

**AI Responsibilities:** | Review Aspect | AI Tool | Output |
|---------------|---------|--------| | Code quality | CodeRabbit | Suggestions
(categorized) | | Test coverage | Qodo | Coverage gaps, test ideas | | Security
patterns | CodeQL + AI | Vulnerability scan | | Logic verification | Claude
analysis | Edge cases, bugs | | Documentation | AI lint + review | Completeness,
clarity |

**AI Review Categories:**

- **Critical**: Blocks merge (security, data loss, breaking changes)
- **Major**: Should address before merge (logic errors, missing validation)
- **Minor**: Address or defer (style, naming, optimization)
- **Trivial**: Optional (typos, comments)

**Human Involvement:**

- 🟢 **Tier 1**: Human review optional (only if AI flags 3+ Major issues)
- 🟢 **Tier 2**: Human spot-check required (verify AI assessment)

**Process:**

```
1. Developer submits PR
2. AI reviews within 5 minutes
3. Developer addresses Critical + Major issues
4. AI re-reviews changes
5. Human reviewer spot-checks (Tier 2) or skips (Tier 1)
6. Merge if all approvals
```

---

### 2.3 Human Sign-Off Required

**When:**

- Tier 3 or Tier 4 changes
- Security-sensitive changes
- Infrastructure changes
- Data model changes
- AI flags 5+ Major issues
- Complex business logic

**Human Review Focus:** | Area | Human Adds Value | |------|------------------|
| **Architecture** | System design coherence, future-proofing | | **Security** |
Threat modeling, attack vectors | | **User experience** | Usability,
accessibility, edge cases | | **Business logic** | Requirements alignment,
domain knowledge | | **Risk assessment** | Blast radius, rollback complexity | |
**Code quality** | Maintainability, technical debt |

**Human Review Checklist (Tier 3+):**

- [ ] Verified AI review is comprehensive
- [ ] Checked for security vulnerabilities (GLOBAL_SECURITY_STANDARDS.md)
- [ ] Confirmed test coverage is adequate
- [ ] Validated error handling and edge cases
- [ ] Verified backwards compatibility
- [ ] Checked for performance implications
- [ ] Confirmed monitoring/logging is sufficient
- [ ] Reviewed rollback procedure

**Approval Workflow:**

```
Tier 3: AI + 2 humans (1 must be codebase owner)
Tier 4: AI + all codebase owners (3+)
```

---

## 3. Review Triggers

### 3.1 File-Based Triggers (Path → Review Tier)

**Automatic tier assignment based on file paths:**

```yaml
# Tier 0 (Exempt)
tier_0:
  - "**/*.md" # Except Tier 1 docs
  - "**/*.log"
  - "**/package-lock.json" # When package.json unchanged
  - ".vscode/**"
  - ".github/PULL_REQUEST_TEMPLATE.md"
  - "docs/archive/**"

# Tier 1 (Light)
tier_1:
  - "docs/**/*.md" # Non-canonical docs
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "components/**/*.stories.tsx"
  - "public/locales/**/*.json"
  - "styles/**/*.css"

# Tier 2 (Standard)
tier_2:
  - "app/**/*.tsx"
  - "components/**/*.tsx"
  - "lib/**/*.ts"
  - "hooks/**/*.ts"
  - "context/**/*.tsx"
  - "functions/src/**/*.ts" # Except auth/security

# Tier 3 (Heavy)
tier_3:
  - "functions/src/auth/**"
  - "functions/src/security/**"
  - "lib/rate-limiter.ts"
  - "middleware/**/*.ts"
  - "firestore.rules"
  - "storage.rules"
  - ".env.example" # Env var changes

# Tier 4 (Critical)
tier_4:
  - ".github/workflows/**"
  - "firebase.json"
  - ".firebaserc"
  - "package.json" # Dependency changes
  - "tsconfig.json"
  - "next.config.js"
  - "firestore.indexes.json"
  - "lib/firebase-config.ts"
```

**Implementation:**

```javascript
// .github/workflows/assign-review-tier.yml
// Auto-labels PRs with review tier based on paths
```

---

### 3.2 Content-Based Triggers (Keywords → Review Escalation)

**Automatic escalation based on code content:**

| Trigger Pattern                 | Escalation      | Reason                    |
| ------------------------------- | --------------- | ------------------------- |
| `eval(`                         | Tier 3 → Tier 4 | Code injection risk       |
| `dangerouslySetInnerHTML`       | Tier 2 → Tier 3 | XSS risk                  |
| `process.env.NEXT_PUBLIC_`      | Review secret   | Potential secret exposure |
| `firebase.auth()`               | Tier 2 → Tier 3 | Auth flow change          |
| `admin.firestore()`             | Tier 2 → Tier 3 | Direct DB access          |
| `DROP TABLE`, `ALTER TABLE`     | Tier 3 → Tier 4 | Schema change             |
| `BREAKING CHANGE:` (commit msg) | Tier 2 → Tier 3 | API compatibility         |
| `TODO: SECURITY`                | Block merge     | Incomplete security work  |

**Forbidden Patterns (Block Merge):**

```javascript
// Auto-reject PRs containing:
- Hardcoded API keys: /sk_live_[A-Za-z0-9]+/
- Hardcoded passwords: /password\s*=\s*["'][^"']+["']/
- .env files (not .env.example)
- console.log in production code (except error logging)
- Commented-out code blocks > 10 lines
- @ts-ignore without explanation comment
```

**Implementation:** Uses existing `scripts/check-pattern-compliance.js` +
`check-review-escalation.js` (Phase 2 - planned)

---

### 3.3 Time-Based Triggers (Periodic Audits)

**Scheduled reviews independent of code changes:**

| Audit Type                | Frequency | Scope                     | Responsible            |
| ------------------------- | --------- | ------------------------- | ---------------------- |
| **Security Audit**        | Monthly   | All Tier 3+ files         | Multi-AI + Human       |
| **Dependency Audit**      | Weekly    | package.json, lockfiles   | Automated (Dependabot) |
| **Documentation Drift**   | Bi-weekly | Tier 1 docs vs code       | AI scan                |
| **Test Coverage**         | Monthly   | All untested code paths   | AI + Human             |
| **Performance Baseline**  | Quarterly | Core user flows           | Human + Tooling        |
| **Access Control Review** | Quarterly | Firestore rules, API auth | Human                  |

**Monthly Security Audit Process:**

```
1. AI generates security report (uses MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md)
2. Report highlights:
   - New Tier 3+ code added since last audit
   - Dependency vulnerabilities
   - Firestore rule changes
   - Auth flow modifications
3. Human reviews report
4. Issues triaged and tracked in ROADMAP.md
5. Critical issues get immediate PRs
```

**Documentation Drift Audit (Phase 3 - Planned):**

```bash
# Bi-weekly automated check (not yet implemented)
npm run audit:docs-drift  # Phase 3 deliverable
# Compares:
# - README.md feature list vs actual app features
# - API docs vs actual API endpoints
# - Firestore schema docs vs actual collections
# Outputs drift report to docs/audits/YYYY-MM-DD-drift-report.md
```

---

### 3.4 Event-Based Triggers (Milestone/Incident)

**Reviews triggered by project events:**

| Event                       | Trigger           | Review Type                               |
| --------------------------- | ----------------- | ----------------------------------------- |
| **Production Incident**     | Immediately after | Root cause analysis + related code review |
| **Milestone Completion**    | End of milestone  | Deliverable audit (MANDATORY)             |
| **Security Disclosure**     | Immediately       | Full security audit                       |
| **Major Dependency Update** | Before merge      | Tier 3 review                             |
| **New Team Member**         | Onboarding        | Codebase orientation review               |
| **Pre-Launch**              | Before release    | Full system audit                         |

**Milestone Completion Audit (Existing):** Already defined in
DOCUMENTATION_STANDARDS.md:

```
Before marking ANY phase/milestone complete:
1. Review original scope
2. Verify each deliverable
3. Check for gaps
4. Document findings
5. Address gaps
6. Then mark complete
```

**Incident-Triggered Review:**

```
When production incident occurs:
1. Immediate fix (Tier 3 fast-track review)
2. Post-mortem within 24 hours
3. Identify related code areas
4. Schedule deep review of related code (Tier 4)
5. Update INCIDENT_RESPONSE.md
6. Add to AI_REVIEW_LEARNINGS_LOG.md
```

**Security Disclosure Response:**

```
When external security issue reported:
1. Verify vulnerability (within 4 hours)
2. Assess severity and blast radius
3. Emergency Tier 4 review of affected code
4. Patch within 24 hours (if critical)
5. Full security audit within 1 week
6. Update SECURITY.md with learnings
```

---

## 4. Anti-Burden Principles

### 4.1 Fast-Path Exemptions for Routine Changes

**Philosophy:** Don't slow down low-risk work with excessive process.

**Fast-Path Criteria:**

- Change matches Tier 0 or Tier 1
- All automated checks pass
- No AI warnings
- Developer has 5+ merged PRs (trusted contributor)

**Fast-Path Benefits:** | Traditional Flow | Fast-Path Flow | Time Saved |
|------------------|----------------|------------| | Commit → CI → AI → Human →
Wait → Merge | Commit → CI → Auto-merge | ~4-24 hours | | All PRs wait for human
review | Tier 0/1 skip human review | ~2-8 hours/PR | | Manual docs:check run |
Automated in CI | ~5 min/commit |

**Exemption Patterns:**

```javascript
// Auto-fast-path these commit types:
const fastPathPatterns = [
  /^docs: Fix typo/,
  /^chore: Remove console\.log/,
  /^style: Format .* with Prettier$/,
  /^test: Add unit test for/,
  /^docs: Update.*\.md - .*$/,
];

// Auto-fast-path these file patterns (when changed alone):
const fastPathFiles = [
  /^docs\/archive\//,
  /\.test\.(ts|tsx)$/,
  // Markdown files, excluding protected docs (ROADMAP, README, DOCUMENTATION_STANDARDS)
  /^(?!.*(ROADMAP|README|DOCUMENTATION_STANDARDS)).*\.md$/,
];

// Note: The 5+ PRs threshold (Fast-Path) is cumulative with 20+ PRs (Good Faith).
// See section 4.3 for progressive trust levels.
```

**Safety Mechanisms:**

- Still runs full CI (catches regressions)
- AI still reviews (but doesn't block merge)
- Post-merge monitoring catches issues
- Weekly audit of fast-path merges

---

### 4.2 Batch Review Opportunities

**Problem:** Reviewing 10 small PRs separately = 10× overhead

**Solution:** Batch compatible changes for single review

**Batch Review Eligible:**

- Multiple docs updates (same category)
- Multiple test additions (same area)
- Multiple UI copy changes
- Multiple bug fixes (independent)

**Batching Process:**

```
1. Developer creates feature branch: `batch/docs-updates-2026-01-04`
2. Makes multiple related commits
3. Creates single PR with all changes
4. Review happens once for entire batch
5. Merge all changes together
```

**Batch Types:**

| Batch Type           | Criteria                            | Review Tier                 |
| -------------------- | ----------------------------------- | --------------------------- |
| **Docs Batch**       | 5+ doc updates, all Tier 1          | Tier 1 (single review)      |
| **Test Batch**       | 5+ test additions, no logic changes | Tier 1                      |
| **UI Copy Batch**    | 5+ text changes, no logic           | Tier 1                      |
| **Dependency Batch** | 5+ minor version bumps              | Tier 2 (AI detailed review) |

**Example:**

```bash
# Instead of 8 separate PRs:
git checkout -b batch/test-additions-jan
git commit -m "test: Add tests for UserProfile component"
git commit -m "test: Add tests for JournalEntry component"
git commit -m "test: Add tests for MoodTracker component"
# ... 5 more test commits
git push origin batch/test-additions-jan
# Create single PR → Single review → Merge all 8 changes
```

**Benefits:**

- 8 reviews → 1 review (saves ~7 hours)
- Context switching reduced
- Related changes reviewed together (better quality)

---

### 4.3 "Good Faith" Allowances

**Philosophy:** Trust > Surveillance for experienced contributors

**Good Faith Principles:**

1. **Trust Established Contributors**
   - After 20+ merged PRs: Reduce review friction
   - Tier 1 PRs: Can self-merge after AI approval
   - Tier 2 PRs: Can merge after 1 approval (instead of waiting for 2)

2. **Allow Judgment Calls**
   - Developer can override Tier 1 AI suggestions with explanation
   - Can mark AI issue as "Won't Fix" if documented
   - Can request fast-track for urgent fixes

3. **Progressive Trust**

   ```
   PRs 1-5:   All PRs get detailed review
   PRs 6-20:  Tier 1 fast-tracked, Tier 2 standard review
   PRs 21+:   Tier 1 self-merge, Tier 2 reduced review
   ```

4. **Self-Certification for Low-Risk Changes**
   - Developer certifies change is Tier 0/1
   - If accurate 10 times: Can self-certify going forward
   - If misclassified: Requires human tier assignment

**Example Good Faith Flow:**

```
Developer (20+ PRs):
1. Makes Tier 1 doc change
2. AI reviews (suggests 2 minor improvements)
3. Developer addresses 1, marks 1 as "Won't Fix - stylistic preference"
4. Self-merges after AI approval
5. Post-merge monitoring (no issues)
```

**Accountability:**

- Monthly audit of self-merged PRs
- If quality issues found: Revert to standard review for 10 PRs
- Good faith abuse: Escalate to team discussion

---

### 4.4 Escalation Only When Needed

**Philosophy:** Start light, escalate only when issues found

**Escalation Ladder:**

```
Tier 0 → Tier 1 → Tier 2 → Tier 3 → Tier 4
  ↓         ↓         ↓         ↓         ↓
Auto    AI only   AI+Human  Multi-Human  All-Hands
```

**Escalation Triggers:**

| From Tier | To Tier                   | Trigger                           | Example |
| --------- | ------------------------- | --------------------------------- | ------- |
| T0 → T1   | AI flags issue            | Typo fix touches security comment |
| T1 → T2   | AI flags 3+ Major issues  | Doc update reveals logic bug      |
| T2 → T3   | Security pattern detected | Feature touches auth code         |
| T3 → T4   | High blast radius         | Rate limiter affects all users    |
| Any → T4  | Manual escalation         | Developer uncertain about change  |

**Escalation Process:**

```
1. PR starts at automatic tier (file-based)
2. AI review runs
3. If escalation triggered:
   a. Add label: "escalated-to-tierN"
   b. Notify reviewers
   c. Block merge until tier requirements met
4. If safe to de-escalate:
   a. Reviewer can override tier down
   b. Must document reason
```

**De-Escalation:** Developer can request tier reduction:

```markdown
## Tier Reduction Request

**Current Tier:** 3 **Requested Tier:** 2 **Reason:** This only touches test
fixtures, not production auth code **Reviewer Approval:** @codeowner
```

**Example Escalation:**

```
PR: "docs: Update API documentation"
Initial Tier: 1 (docs change)
AI Review: "Found 5 endpoints in docs that don't exist in code"
Escalation: Tier 1 → Tier 2 (API drift issue, needs human review)
Result: Human reviewer discovers endpoints were removed without docs update
```

---

## 5. Process Audits

### 5.1 How to Audit the Review Process Itself

**Philosophy:** The review process needs review too.

**Audit Types:**

| Audit                    | Frequency | Purpose                          | Owner      |
| ------------------------ | --------- | -------------------------------- | ---------- |
| **Review Effectiveness** | Monthly   | Are reviews catching bugs?       | Human + AI |
| **Review Burden**        | Monthly   | Are reviews slowing development? | Human      |
| **Tier Accuracy**        | Bi-weekly | Are tiers correctly assigned?    | AI         |
| **Escalation Patterns**  | Monthly   | Are escalations appropriate?     | Human      |
| **False Positive Rate**  | Monthly   | AI flagging non-issues?          | Human      |

---

### 5.2 Metrics to Track

**Quality Metrics (Are reviews working?):**

| Metric                            | Target             | Data Source                              | Interpretation                                  |
| --------------------------------- | ------------------ | ---------------------------------------- | ----------------------------------------------- |
| **Bugs caught in review**         | >70% of total bugs | GitHub issues labeled "caught-in-review" | Higher = reviews working                        |
| **Bugs escaped to production**    | <5/month           | Production incidents                     | Lower = reviews working                         |
| **Security issues caught**        | 100%               | Security audit reports                   | Must be 100%                                    |
| **AI suggestion acceptance rate** | 60-80%             | AI review logs                           | Too low = noisy, too high = not thorough enough |
| **Review quality score**          | >4/5               | Developer survey (monthly)               | Subjective quality measure                      |

**Efficiency Metrics (Are reviews fast?):**

| Metric                     | Target                     | Data Source            | Interpretation               |
| -------------------------- | -------------------------- | ---------------------- | ---------------------------- |
| **Time to first review**   | <24h (T1-T2), <12h (T3-T4) | GitHub PR timestamps   | Lower = faster feedback      |
| **Time to merge**          | <48h (T1-T2), <5d (T3-T4)  | GitHub PR lifecycle    | Lower = less friction        |
| **Review iteration count** | <3 rounds                  | PR comment count       | Lower = clearer requirements |
| **Auto-merge rate**        | >40% of PRs                | GitHub auto-merge logs | Higher = less burden         |
| **Fast-path usage**        | >30% of PRs                | CI logs                | Higher = process efficiency  |

**Tier Accuracy Metrics (Are tiers right?):**

| Metric                  | Target      | Data Source            | Interpretation                 |
| ----------------------- | ----------- | ---------------------- | ------------------------------ |
| **Tier escalations**    | <10% of PRs | Escalation logs        | Lower = accurate initial tiers |
| **Tier de-escalations** | <5% of PRs  | De-escalation requests | Lower = not over-cautious      |
| **Misclassified PRs**   | <3%         | Post-merge audit       | Lower = tier system working    |

**Tracking Implementation (Phase 3 - Planned):**

```javascript
// scripts/collect-review-metrics.js (NOT YET IMPLEMENTED)
// Target: Runs monthly, outputs to docs/audits/YYYY-MM-review-metrics.md
// Planned data sources:
// - GitHub API (PR data, review times)
// - AI review logs (CodeRabbit, Qodo)
// - CI logs (check-pattern-compliance.js, build times)
// - Incident reports (INCIDENT_RESPONSE.md)

// Prerequisites:
// - docs/audits/ directory (create in Phase 3)
// - GitHub API token (for PR data)
// - "caught-in-review" label (must be created on GitHub)
```

---

### 5.3 Feedback Loops

**Monthly Review Retrospective:**

```markdown
# Review Process Retrospective - YYYY-MM

## Metrics Summary

- Bugs caught: X (target: >70%)
- Time to first review: Xh (target: <24h)
- Auto-merge rate: X% (target: >40%)

## What's Working

- Fast-path exemptions saved Y hours this month
- AI caught Z security issues before human review

## What's Not Working

- Tier 3 reviews taking too long (avg 6 days vs 5 day target)
- AI false positive rate too high for UI changes (15% vs 10% target)

## Action Items

- [ ] Refine AI review prompts to reduce UI false positives
- [ ] Add second Tier 3 reviewer to reduce review time
- [ ] Update tier assignment rules for component files

## Next Month Focus

- Monitor Tier 3 review time after adding reviewer
- Track AI false positive rate after prompt updates
```

**Continuous Improvement Process:**

```
Monthly Metrics → Retrospective → Action Items →
Implementation → Next Month Metrics → Verify Improvement
```

**Feedback Collection:**

| Source               | Method              | Frequency    |
| -------------------- | ------------------- | ------------ |
| **Developers**       | Anonymous survey    | Monthly      |
| **AI Review Logs**   | Automated analysis  | Weekly       |
| **PR Comments**      | Sentiment analysis  | Continuous   |
| **Incident Reports** | Root cause analysis | Per incident |

**Survey Questions:**

```
1. Review Quality (1-5): Are reviews thorough and helpful?
2. Review Speed (1-5): Are reviews timely?
3. Review Burden (1-5): Is the review process reasonable?
4. Tier Accuracy (1-5): Are PRs assigned to correct tiers?
5. AI Usefulness (1-5): Are AI suggestions valuable?
6. Open Feedback: What should we change?
```

**Process Evolution:**

```
If survey scores drop below 4/5 for 2 consecutive months:
→ Emergency retrospective
→ Identify root cause
→ Implement fixes within 1 sprint
→ Re-survey next month
```

---

## 6. Implementation Roadmap

### 6.1 Phase 1: Foundation (Week 1-2)

**Goal:** Establish tier classification and basic automation

**Tasks:**

1. **Create tier assignment script**

   ```bash
   # scripts/assign-review-tier.js
   # Reads file paths, assigns tier, outputs label
   ```

2. **Add GitHub Action: Auto-label PRs**

   ```yaml
   # .github/workflows/auto-label-tier.yml
   # On PR open: Run assign-review-tier.js → Add label
   ```

3. **Document tier exemptions**

   ```markdown
   # Add to PR_WORKFLOW_CHECKLIST.md:

   ## Review Tier Assignment

   - Check files changed
   - Verify tier label is correct
   - Request tier change if needed
   ```

4. **Set up metrics collection**
   ```bash
   # scripts/collect-review-metrics.js (skeleton)
   # Collect: PR count by tier, time to merge, review count
   ```

**Deliverables:**

- [ ] `scripts/assign-review-tier.js` (with tests)
- [ ] `.github/workflows/auto-label-tier.yml`
- [ ] `docs/PR_WORKFLOW_CHECKLIST.md` updated
- [ ] `scripts/collect-review-metrics.js` (v1)
- [ ] First metrics baseline report

**Success Criteria:**

- All new PRs auto-labeled with tier
- <5% tier misclassification
- Baseline metrics collected

---

### 6.2 Phase 2: Automation (Week 3-4)

**Goal:** Implement fast-path and batch review automation

**Tasks:**

1. **Create fast-path detector**

   ```javascript
   // scripts/check-fast-path-eligible.js
   // Checks: tier, patterns, AI warnings → Returns true/false
   ```

2. **Add auto-merge workflow**

   ```yaml
   # .github/workflows/auto-merge.yml
   # If fast-path eligible + all checks pass → Auto-merge after 4h
   ```

3. **Implement content-based escalation**

   ```javascript
   // scripts/check-review-escalation.js
   // Scans code for trigger patterns → Escalates tier if needed
   ```

4. **Create batch review guide**

   ```markdown
   # docs/BATCH_REVIEW_GUIDE.md

   # How to batch compatible changes

   # Examples and templates
   ```

**Deliverables:**

- [ ] `scripts/check-fast-path-eligible.js`
- [ ] `.github/workflows/auto-merge.yml`
- [ ] `scripts/check-review-escalation.js`
- [ ] `docs/BATCH_REVIEW_GUIDE.md`
- [ ] Updated metrics (auto-merge rate, escalation rate)

**Success Criteria:**

- > 30% of PRs auto-merge via fast-path
- <5% inappropriate auto-merges
- Escalation system catches all security patterns

---

### 6.3 Phase 3: Audits (Week 5-6)

**Goal:** Establish periodic audits and feedback loops

**Tasks:**

1. **Create monthly security audit workflow**

   ```bash
   # scripts/run-security-audit.js
   # Generates report using MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md
   ```

2. **Create documentation drift checker**

   ```bash
   # scripts/audit-docs-drift.js
   # Compares docs to actual code
   # Outputs drift report
   ```

3. **Set up monthly retrospective template**

   ```markdown
   # docs/templates/REVIEW_RETROSPECTIVE_TEMPLATE.md

   # Metrics, what's working, action items
   ```

4. **Create developer survey**
   ```
   # Google Form or GitHub Discussions poll
   # 6 questions on review quality/speed/burden
   ```

**Deliverables:**

- [ ] `scripts/run-security-audit.js`
- [ ] `scripts/audit-docs-drift.js`
- [ ] `docs/templates/REVIEW_RETROSPECTIVE_TEMPLATE.md`
- [ ] Developer survey (live)
- [ ] First retrospective report

**Success Criteria:**

- Monthly security audit runs automatically
- Docs drift audit runs bi-weekly
- > 80% developer survey response rate
- First retrospective completed with action items

---

### 6.4 Phase 4: Optimization (Week 7-8)

**Goal:** Refine based on data, reduce friction

**Tasks:**

1. **Analyze 1 month of metrics**

   ```bash
   # Review all metrics reports
   # Identify bottlenecks and inefficiencies
   ```

2. **Tune tier thresholds**

   ```javascript
   // Update assign-review-tier.js based on data
   // Adjust file paths, escalation triggers
   ```

3. **Refine AI review prompts**

   ```
   # If AI false positive rate >10%:
   # - Update CodeRabbit config
   # - Refine Qodo settings
   # - Adjust check-patterns.js
   ```

4. **Document lessons learned**

   ```markdown
   # Update AI_REVIEW_LEARNINGS_LOG.md

   # Add entry for review process learnings
   ```

**Deliverables:**

- [ ] Updated tier assignment rules
- [ ] Refined AI configurations
- [ ] Process optimization report
- [ ] Updated documentation

**Success Criteria:**

- Review time reduced by 20%
- AI false positive rate <10%
- Developer satisfaction score >4/5
- All Phase 1-3 metrics trending positively

---

## 7. Related Documents

### 7.1 Companion Documents

- **[REVIEW_POLICY_INDEX.md](./REVIEW_POLICY_INDEX.md)** - Central directory for
  all review policies
- **[REVIEW_POLICY_QUICK_REF.md](./REVIEW_POLICY_QUICK_REF.md)** - One-page
  quick reference
- **[REVIEW_POLICY_VISUAL_GUIDE.md](./REVIEW_POLICY_VISUAL_GUIDE.md)** - Visual
  diagrams and flowcharts

### 7.2 Existing Process Documents

- **AI_REVIEW_PROCESS.md** - AI code review workflow (CodeRabbit, Qodo)
- **AI_REVIEW_LEARNINGS_LOG.md** - Historical review learnings
- **GLOBAL_SECURITY_STANDARDS.md** - Security requirements (all tiers)
- **DOCUMENTATION_STANDARDS.md** - Documentation tier system
- **TRIGGERS.md** - Automation and enforcement reference (68+ triggers)
- **PR_WORKFLOW_CHECKLIST.md** - Pre-PR checklist

### 7.3 Integration Points

This policy integrates with:

- **GitHub Actions** - Automated tier assignment, auto-merge
- **AI Review Tools** - CodeRabbit, Qodo analysis
- **Pre-commit Hooks** - Tier 0 fast-path validation
- **Security Audits** - Multi-AI security reviews (Tier 3+)
- **Metrics Collection** - Monthly review effectiveness reports

---

## 8. AI Instructions

### For AI Assistants

**When reviewing code:**

1. **Determine PR tier** (check files changed + content)
2. **Apply tier-appropriate review depth**:
   - Tier 0: Quick smoke test only
   - Tier 1: Surface scan (formatting, links, style)
   - Tier 2: Deep analysis (logic, tests, security)
   - Tier 3: Exhaustive (security, data flow, error handling)
   - Tier 4: Multi-model review + RFC validation
3. **Categorize issues** (Critical, Major, Minor, Trivial)
4. **Check for escalation triggers** (security patterns, breaking changes)
5. **Log learnings** in AI_REVIEW_LEARNINGS_LOG.md

**When implementing review automation:**

1. Use existing scripts as reference (`scripts/check-patterns.js`)
2. Follow pattern: Read files → Analyze → Output JSON → Exit code
3. Add tests for all automation scripts
4. Document in TRIGGERS.md

**When conducting periodic audits:**

1. Use templates (MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md)
2. Generate detailed report with findings
3. Triage issues by severity
4. Create GitHub issues for action items
5. Update audit tracking in ROADMAP.md

---

## 9. Version History

| Version | Date       | Changes                                                                                                                                            | Author      |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1.0     | 2026-01-04 | Initial review policy architecture created with 5 tiers, automation strategy, triggers, anti-burden principles, and 4-phase implementation roadmap | Claude Code |

---

## Appendix A: Quick Reference

### Tier Decision Tree

```
Is this change?
├─ Just typos/comments/logs? → Tier 0 (Auto-merge)
├─ Docs/tests/UI text only? → Tier 1 (AI review)
├─ Feature/bug fix/refactor? → Tier 2 (AI + human)
├─ Auth/security/payments? → Tier 3 (Multi-human + checklist)
└─ Infra/schema/global config? → Tier 4 (RFC + all-hands)
```

### Review Time Targets

| Tier | First Review | Merge Target | Typical Changes |
| ---- | ------------ | ------------ | --------------- |
| T0   | Auto         | <4 hours     | Typos, logs     |
| T1   | <24h         | <48h         | Docs, tests     |
| T2   | <24h         | <48h         | Features, bugs  |
| T3   | <12h         | <5 days      | Auth, security  |
| T4   | <2 days      | <2 weeks     | Infrastructure  |

### Approval Requirements

| Tier | AI          | Human         | Checklists              |
| ---- | ----------- | ------------- | ----------------------- |
| T0   | ❌          | ❌            | None                    |
| T1   | ✅          | 🟡 Optional   | None                    |
| T2   | ✅          | 🟢 1 human    | None                    |
| T3   | ✅          | 🔴 2 humans   | Security checklist      |
| T4   | ✅ Multi-AI | 🔴 All owners | RFC + Security + Deploy |

---

**END OF REVIEW_POLICY_ARCHITECTURE.md**

This is a living document. Update it as the review process evolves.
