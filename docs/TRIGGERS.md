# TRIGGERS.md - Automation & Enforcement Reference

**Project**: SoNash Recovery Notebook
**Document Version**: 1.1
**Created**: 2026-01-02
**Last Updated**: 2026-01-02
**Status**: ACTIVE

---

## 🎯 DOCUMENT PURPOSE

This is the **CANONICAL** reference for all automation triggers, enforcement measures, conditional directives, and compliance mechanisms in the SoNash repository. This document serves as:

1. **Inventory** - Complete list of all triggers and enforcement mechanisms
2. **Reference** - How each mechanism works and when it fires
3. **Verification Guide** - How to check if triggers are working correctly
4. **Compliance Tracker** - Ensuring all mechanisms are followed

**⚠️ CRITICAL**: This document covers automated (CI/CD, hooks) AND manual (documentation directives) triggers. Both require compliance.

---

## 📋 HOW TO USE THIS DOCUMENT

### For Developers
1. **Before committing**: Review [Pre-Commit Hooks](#1-pre-commit-hooks) to understand what runs
2. **Before pushing**: Review [CI/CD Workflows](#2-github-actions-cicd) to anticipate checks
3. **When adding features**: Check [Documentation Directives](#5-documentation-based-directives) for update requirements

### For AI Assistants
1. **Read [Documentation Directives](#5-documentation-based-directives)** - Critical workflow rules
2. **Follow process maps** - Each trigger section includes step-by-step flows
3. **Update documentation** when triggers indicate updates are needed

### For Compliance Verification
1. Use [Verification Commands](#verification-commands) section for each trigger type
2. Check [Compliance Gaps](#compliance-gaps--recommendations) for known issues
3. Review [Compliance Matrix](#compliance-matrix) for overall status

---

## 📊 TRIGGERS OVERVIEW

| Category | Count | Automated | Manual | Status |
|----------|-------|-----------|--------|--------|
| GitHub Actions (CI/CD) | 5 | ✅ | - | Active |
| Pre-Commit Hooks | 1 | ✅ | - | Active |
| Session Hooks | 1 | ✅ | - | Active |
| npm Scripts | 8 | Semi | ✅ | Active |
| Automation Scripts | 6 | - | ✅ | Active |
| Documentation Directives | 12+ | - | ✅ | Active |
| Anti-Pattern Checks | 35+ | ✅ | - | Active |

**Total Enforcement Points**: 68+

---

# 1. PRE-COMMIT HOOKS

## 1.1 Husky Pre-Commit Hook

| Attribute | Value |
|-----------|-------|
| **Name** | Husky Pre-Commit |
| **Location** | `.husky/pre-commit` |
| **Trigger** | Every `git commit` command |
| **Execution** | Automatic (blocks commit on failure) |

### Description
Runs lint-staged to check only staged files before allowing commits. Prevents committing code that fails linting or type-checking.

### Function
```
TRIGGER: git commit
  → EXECUTE: npx lint-staged
    → RUN: ESLint on staged .ts/.tsx/.js/.jsx files
    → RUN: Prettier check on staged files
  → IF pass: Allow commit
  → IF fail: Block commit with error message
```

### Process Map
```
Developer runs `git commit`
        ↓
    [Husky intercepts]
        ↓
    [lint-staged runs]
        ↓
   ┌────┴────┐
   ↓         ↓
 PASS      FAIL
   ↓         ↓
Commit    Show errors
proceeds  Block commit
```

### Verification
```bash
# Test the hook manually
npx lint-staged

# Check hook is installed
cat .husky/pre-commit

# Verify husky is set up
npm run prepare
```

### Compliance Status
- ✅ **Automated**: Cannot be bypassed without `--no-verify`
- ⚠️ **Weakness**: Developers can use `git commit --no-verify`

---

# 2. GITHUB ACTIONS (CI/CD)

## 2.1 CI Workflow

| Attribute | Value |
|-----------|-------|
| **Name** | CI (Continuous Integration) |
| **Location** | `.github/workflows/ci.yml` |
| **Trigger** | Push to `main`, Pull Requests to `main` |
| **Execution** | Automatic |

### Description
Primary CI pipeline that runs on all PRs and main branch pushes. Validates code quality, runs tests, builds the project.

### Function
```
TRIGGER: push to main OR pull_request to main
  → CHECKOUT: Repository code
  → SETUP: Node.js 20.x
  → INSTALL: npm ci (clean install)
  → RUN: npm run lint
  → RUN: npm run type-check
  → RUN: npm test
  → RUN: npm run build
  → IF all pass: ✅ Green check
  → IF any fail: ❌ Block merge (if PR)
```

### Process Map
```
Push/PR to main
      ↓
[GitHub Actions triggers]
      ↓
┌─────┼─────┬─────┬─────┐
↓     ↓     ↓     ↓     ↓
Lint  Type  Test  Build Check
      Check
      ↓
[All must pass]
      ↓
   ┌──┴──┐
   ↓     ↓
  PASS  FAIL
   ↓     ↓
Green  Red X
check  (blocks PR)
```

### Verification
```bash
# Run same checks locally
npm run lint && npm run type-check && npm test && npm run build

# View workflow runs
gh run list --workflow=ci.yml
```

---

## 2.2 CodeQL Analysis

| Attribute | Value |
|-----------|-------|
| **Name** | CodeQL Security Analysis |
| **Location** | `.github/workflows/codeql.yml` |
| **Trigger** | Push to `main`, PRs to `main`, Weekly schedule (Mondays) |
| **Execution** | Automatic |

### Description
Static security analysis scanning for vulnerabilities, code quality issues, and security anti-patterns in JavaScript/TypeScript.

### Function
```
TRIGGER: push to main OR PR to main OR schedule (Monday 0:00 UTC)
  → CHECKOUT: Repository
  → INITIALIZE: CodeQL with javascript/typescript
  → BUILD: Autobuild
  → ANALYZE: Security scan
  → REPORT: Upload to GitHub Security tab
  → IF critical vulnerabilities: Create security alert
```

### Process Map
```
Trigger (push/PR/schedule)
         ↓
   [CodeQL initializes]
         ↓
   [Autobuild project]
         ↓
   [Security analysis]
         ↓
    ┌────┴────┐
    ↓         ↓
No issues   Issues found
    ↓         ↓
  Pass    Security Alert
          in GitHub UI
```

### Verification
```bash
# View security alerts
gh api repos/:owner/:repo/code-scanning/alerts

# Check workflow status
gh run list --workflow=codeql.yml
```

---

## 2.3 Dependency Review

| Attribute | Value |
|-----------|-------|
| **Name** | Dependency Review |
| **Location** | `.github/workflows/dependency-review.yml` |
| **Trigger** | Pull Requests only |
| **Execution** | Automatic |

### Description
Scans dependency changes in PRs for known vulnerabilities. Blocks PRs that introduce vulnerable dependencies.

### Function
```
TRIGGER: pull_request
  → CHECKOUT: Repository
  → SCAN: Compare dependency changes
  → CHECK: Against vulnerability databases
  → IF vulnerable deps found: Fail check, block PR
  → IF clean: Pass
```

### Process Map
```
PR opened/updated
       ↓
[Checkout code]
       ↓
[Scan package.json changes]
       ↓
[Check vulnerability DBs]
       ↓
   ┌───┴───┐
   ↓       ↓
 Clean  Vulnerable
   ↓       ↓
 Pass    Fail
         (block PR)
```

### Verification
```bash
# Check for vulnerabilities locally
npm audit

# View dependency review results
gh pr checks <PR_NUMBER>
```

---

## 2.4 Firebase Deploy

| Attribute | Value |
|-----------|-------|
| **Name** | Firebase Deploy |
| **Location** | `.github/workflows/firebase-deploy.yml` |
| **Trigger** | Push to `main` (after CI passes) |
| **Execution** | Automatic |

### Description
Deploys application to Firebase Hosting after successful CI on main branch.

### Function
```
TRIGGER: push to main (needs: ci to pass)
  → CHECKOUT: Repository
  → SETUP: Node.js
  → INSTALL: Dependencies
  → BUILD: Production build
  → DEPLOY: Firebase Hosting
  → IF deploy fails: Notify (Slack/email if configured)
```

### Process Map
```
Push to main
     ↓
[CI workflow runs]
     ↓
  ┌──┴──┐
  ↓     ↓
PASS   FAIL
  ↓     ↓
Deploy  Stop
  ↓
[Build production]
  ↓
[Deploy to Firebase]
  ↓
Live on firebase URL
```

### Verification
```bash
# Check deployment status
firebase hosting:channel:list

# View workflow runs
gh run list --workflow=firebase-deploy.yml
```

---

## 2.5 Stale Issues/PRs

| Attribute | Value |
|-----------|-------|
| **Name** | Stale Issue Handler |
| **Location** | `.github/workflows/stale.yml` |
| **Trigger** | Daily schedule |
| **Execution** | Automatic |

### Description
Automatically labels and closes stale issues/PRs that have had no activity.

### Function
```
TRIGGER: schedule (daily)
  → SCAN: All open issues and PRs
  → IF no activity for 60 days: Label as "stale"
  → IF stale + no activity for 7 more days: Close
  → EXEMPT: Issues with "pinned" or "security" labels
```

---

# 3. SESSION HOOKS

## 3.1 Claude Session Start Hook

| Attribute | Value |
|-----------|-------|
| **Name** | Claude Session Start |
| **Location** | `.claude/hooks/session-start.sh` |
| **Trigger** | Every new Claude Code session |
| **Execution** | Automatic |

### Description
Ensures development environment is ready when AI assistant starts a session. Installs dependencies, builds functions, runs tests.

### Function
```
TRIGGER: Claude Code session starts
  → CHECK: If node_modules exists
    → IF missing: npm ci --legacy-peer-deps
  → CHECK: If functions/lib exists
    → IF missing: cd functions && npm run build
  → RUN: npm test (verify tests pass)
  → REPORT: Environment status to AI
```

### Process Map
```
Claude session starts
        ↓
[Check node_modules]
   ┌────┴────┐
   ↓         ↓
Exists    Missing
   ↓         ↓
Skip     npm ci
   ↓         ↓
   └────┬────┘
        ↓
[Check functions/lib]
   ┌────┴────┐
   ↓         ↓
Exists    Missing
   ↓         ↓
Skip     npm run build
   ↓         ↓
   └────┬────┘
        ↓
   [Run tests]
        ↓
[Report to Claude]
```

### Verification
```bash
# Run hook manually
bash .claude/hooks/session-start.sh

# Check hook configuration
cat .claude/settings.json
```

### Compliance Status
- ✅ **Automated**: Runs automatically on session start
- ✅ **Non-blocking**: Session continues even if tests fail (reports status)

---

# 4. NPM SCRIPTS (MANUAL TRIGGERS)

## 4.1 Pattern Compliance Check

| Attribute | Value |
|-----------|-------|
| **Name** | Pattern Compliance Check |
| **Command** | `npm run patterns:check` |
| **Location** | `scripts/check-patterns.js` |
| **Trigger** | Manual (should run before commits) |

### Description
Scans codebase for 35+ anti-patterns including security issues, code smells, and violations of project standards.

### Function
```
TRIGGER: npm run patterns:check
  → SCAN: All .ts, .tsx, .js files
  → CHECK: 35+ anti-patterns:
    - console.log statements
    - Hardcoded secrets
    - TODO/FIXME comments
    - any type usage
    - Disabled ESLint rules
    - Alert() calls
    - eval() usage
    - dangerouslySetInnerHTML
    - Unhandled promise rejections
    - ... 26 more patterns
  → REPORT: Violations by category
  → EXIT: 0 if clean, 1 if violations
```

### Anti-Patterns Checked (35+)

| Category | Patterns |
|----------|----------|
| **Debug/Console** | console.log, console.error, console.warn, debugger |
| **Security** | eval(), innerHTML, hardcoded secrets, API keys |
| **Type Safety** | any type, @ts-ignore, @ts-nocheck |
| **Code Quality** | TODO, FIXME, XXX, HACK comments |
| **Error Handling** | Empty catch blocks, unhandled rejections |
| **React** | Disabled exhaustive-deps, missing keys |
| **Testing** | .only(), .skip() in tests |
| **Performance** | Sync fs operations, blocking calls |

### Verification
```bash
# Run the check
npm run patterns:check

# Check specific pattern
grep -r "console\.log" --include="*.ts" --include="*.tsx"
```

---

## 4.2 Documentation Status Update

| Attribute | Value |
|-----------|-------|
| **Name** | README Status Update |
| **Command** | `npm run docs:update-readme` |
| **Location** | `scripts/update-readme-status.js` |
| **Trigger** | Manual (after ROADMAP.md changes) |

### Description
Syncs project status from ROADMAP.md to README.md, ensuring status dashboard stays current.

### Function
```
TRIGGER: npm run docs:update-readme
  → READ: ROADMAP.md milestone data
  → PARSE: Status, progress percentages
  → UPDATE: README.md status section
  → UPDATE: "Last Updated" timestamp
  → REPORT: Changes made
```

### Process Map
```
Developer updates ROADMAP.md
          ↓
[Run npm run docs:update-readme]
          ↓
[Parse ROADMAP.md]
          ↓
[Update README.md status section]
          ↓
[Update timestamp]
          ↓
README.md reflects current status
```

---

## 4.3 Test Commands

| Command | Function | Trigger |
|---------|----------|---------|
| `npm test` | Run all unit tests | Manual/CI |
| `npm run test:coverage` | Tests with c8 coverage | Manual |
| `npm run test:watch` | Watch mode for TDD | Manual |

---

## 4.4 Build Commands

| Command | Function | Trigger |
|---------|----------|---------|
| `npm run build` | Production Next.js build | Manual/CI |
| `npm run dev` | Development server | Manual |
| `npm run lint` | ESLint check | Manual/CI |
| `npm run type-check` | TypeScript validation | Manual/CI |

---

# 5. DOCUMENTATION-BASED DIRECTIVES

These are conditional rules written in documentation that require **manual compliance** by developers and AI assistants.

## 5.1 AI Workflow Directives

| Attribute | Value |
|-----------|-------|
| **Name** | AI Workflow Protocol |
| **Location** | `AI_WORKFLOW.md` |
| **Trigger** | AI session start, task completion |

### Directives

| Directive | Trigger Condition | Required Action |
|-----------|-------------------|-----------------|
| Read claude.md first | New session starts | Read tribal knowledge before coding |
| Check ROADMAP.md | Before any feature work | Verify alignment with priorities |
| Update docs | After completing feature | Update relevant documentation |
| Run patterns:check | Before committing | Verify no anti-patterns introduced |

### Process Map
```
AI Session Starts
       ↓
[Read AI_WORKFLOW.md]
       ↓
[Read claude.md for context]
       ↓
[Check ROADMAP.md for priorities]
       ↓
[Do requested work]
       ↓
[Update relevant docs]
       ↓
[Run patterns:check]
       ↓
[Commit changes]
```

---

## 5.2 Documentation Standards Directives

| Attribute | Value |
|-----------|-------|
| **Name** | Documentation Standards |
| **Location** | `docs/DOCUMENTATION_STANDARDS.md` |
| **Trigger** | Creating/updating documentation |

### Directives

| Directive | Trigger Condition | Required Action |
|-----------|-------------------|-----------------|
| Use correct tier template | Creating new doc | Select Tier 1-5 template |
| Include required sections | All docs | Must have Purpose, Status, AI Instructions |
| Follow naming conventions | New files | Use SCREAMING_SNAKE_CASE.md |
| Add to index | New docs | Update README.md Documentation Index |
| Include version history | All docs | Track version changes |

---

## 5.3 Security Directives

| Attribute | Value |
|-----------|-------|
| **Name** | Global Security Standards |
| **Location** | `docs/GLOBAL_SECURITY_STANDARDS.md` |
| **Trigger** | Any code changes |

### Directives

| Directive | Trigger Condition | Required Action |
|-----------|-------------------|-----------------|
| Rate limiting | New endpoints | Add IP + user-based limits |
| Input validation | User input | Validate with schemas |
| No hardcoded secrets | Any code | Use environment variables |
| Error sanitization | Error responses | Never expose stack traces |
| Path traversal check | File operations | Validate paths |

---

## 5.4 README Update Triggers

| Attribute | Value |
|-----------|-------|
| **Name** | README Update Triggers |
| **Location** | `README.md` (bottom) |
| **Trigger** | Various project changes |

### Directives

| Trigger Condition | Required Action |
|-------------------|-----------------|
| Milestone progress changes | Update status dashboard |
| New major features added | Add to Current Features |
| Tech stack changes | Update Tech Stack section |
| Documentation structure changes | Update Documentation Index |
| Project structure changes | Update Project Structure |

---

## 5.5 Review Process Directives

| Attribute | Value |
|-----------|-------|
| **Name** | AI Review Process |
| **Location** | `AI_REVIEW_PROCESS.md` |
| **Trigger** | Code reviews, PR submissions |

### Directives

| Directive | Trigger Condition | Required Action |
|-----------|-------------------|-----------------|
| Log learnings | After code review | Update AI_REVIEW_LEARNINGS_LOG.md |
| Follow checklist | PR review | Use review checklist |
| Security review | Security-sensitive changes | Extra security scrutiny |

---

## 5.6 Phase Completion Audit

| Attribute | Value |
|-----------|-------|
| **Name** | Phase Completion Audits |
| **Location** | `docs/DOCUMENTATION_STANDARDIZATION_PLAN.md` |
| **Trigger** | Completing any phase |

### Directives

| Directive | Trigger Condition | Required Action |
|-----------|-------------------|-----------------|
| Run audit template | Phase complete | Complete all audit sections |
| Verify all tasks | Before marking complete | Check each deliverable |
| Document deviations | Any changes from plan | Record in audit |
| Update plan | After audit | Mark phase complete, update % |

---

# 6. AUTOMATION SCRIPTS

## 6.1 Check Patterns Script

| Attribute | Value |
|-----------|-------|
| **Name** | check-patterns.js |
| **Location** | `scripts/check-patterns.js` |
| **Run via** | `npm run patterns:check` |

### Conditional Logic
```javascript
// For each file scanned:
IF file matches *.ts OR *.tsx OR *.js:
  FOR each anti-pattern in PATTERNS:
    IF pattern.regex.test(fileContent):
      ADD to violations

IF violations.length > 0:
  EXIT 1 (failure)
ELSE:
  EXIT 0 (success)
```

---

## 6.2 Update README Status Script

| Attribute | Value |
|-----------|-------|
| **Name** | update-readme-status.js |
| **Location** | `scripts/update-readme-status.js` |
| **Run via** | `npm run docs:update-readme` |

### Conditional Logic
```javascript
// Parse ROADMAP.md:
FOR each milestone:
  EXTRACT status, progress, completion

// Update README.md:
FIND status dashboard section
REPLACE with current data
UPDATE "Last Updated" date

IF changes made:
  WRITE README.md
  LOG changes
```

---

# 7. VERIFICATION COMMANDS

## Quick Verification Suite

Run these to verify all automated triggers are working:

```bash
# 1. Pre-commit hook
npx lint-staged
echo "✅ Lint-staged working"

# 2. Pattern compliance
npm run patterns:check
echo "✅ Pattern check working"

# 3. Tests
npm test
echo "✅ Tests working"

# 4. Type checking
npm run type-check
echo "✅ Type checking working"

# 5. Linting
npm run lint
echo "✅ Linting working"

# 6. Build
npm run build
echo "✅ Build working"

# 7. Session hook
bash .claude/hooks/session-start.sh
echo "✅ Session hook working"
```

## GitHub Actions Verification

```bash
# Check recent workflow runs
gh run list --limit 10

# Check specific workflow
gh workflow view ci.yml

# View workflow run details
gh run view <RUN_ID>
```

---

# 8. COMPLIANCE MATRIX

| Trigger | Type | Enforcement | Bypass Method | Risk if Bypassed |
|---------|------|-------------|---------------|------------------|
| Pre-commit hook | Automated | Strong | `--no-verify` | Medium |
| CI workflow | Automated | Strong | None (blocks PR) | N/A |
| CodeQL | Automated | Advisory | Dismiss alert | High |
| Dependency review | Automated | Strong | None (blocks PR) | N/A |
| Pattern check | Manual | Weak | Don't run it | Medium |
| Doc directives | Manual | Weak | Ignore them | Low-Medium |
| Session hook | Automated | Advisory | Skip output | Low |

---

# 9. COMPLIANCE GAPS & RECOMMENDATIONS

## Resolved Gaps ✅

### Gap 1: Pattern Check Not in CI - RESOLVED
**Resolved**: 2026-01-02
**Solution**: Added `npm run patterns:check` to CI workflow (`.github/workflows/ci.yml`)
**Commit**: ci: Add pattern compliance check to CI workflow

### Gap 2: Documentation Directives Not Enforced - RESOLVED
**Resolved**: 2026-01-02
**Solution**:
- Added `--strict` flag to `scripts/check-docs-light.js` (treats warnings as errors)
- Added `npm run docs:check -- --strict` to CI workflow
- Warnings now block PRs (exit code 1)
**Commit**: ci: Add docs:check --strict to CI workflow (Gap 2 fix)

---

## Current Gaps

### Gap 3: Pre-commit Hook Bypass
**Issue**: `git commit --no-verify` bypasses all hooks
**Risk**: Bad code can be committed
**Recommendation**:
- CI catches this, but consider server-side hooks
- Team policy against `--no-verify`

### Gap 4: Security Directives Not Automated
**Issue**: Security standards in docs aren't code-enforced
**Risk**: Security violations in new code
**Recommendation**:
- Add ESLint security plugin
- Custom rules for project-specific patterns

---

## Recommended Additions

### ~~1. Add Pattern Check to CI~~ ✅ DONE
*Implemented via Gap 1 resolution above*

### 2. Add Documentation Drift Check
Create `scripts/check-doc-drift.js`:
- Verify README status matches ROADMAP
- Check all doc links are valid
- Verify version history is current

### 3. Add Pre-push Hook
```bash
# .husky/pre-push
npm test
npm run patterns:check
```

### 4. Automate Doc Update Reminders
- GitHub Action to comment on PRs that touch code without updating docs

---

## 📝 UPDATE TRIGGERS

**Update this document when:**
- ✅ New automation or enforcement added
- ✅ Existing trigger behavior changes
- ✅ New GitHub Actions workflows added
- ✅ New npm scripts with validation added
- ✅ Documentation directives change
- ✅ Compliance gaps are addressed

---

## 🗓️ VERSION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2026-01-02 | Resolved Gap 1 & 2, added to CI workflow | Claude |
| 1.0 | 2026-01-02 | Initial document created | Claude |

---

## 🤖 AI INSTRUCTIONS

When working with triggers in this project:

1. **Check this document** before adding new automation
2. **Follow all documentation directives** - they're as important as code
3. **Run `npm run patterns:check`** before every commit
4. **Update this document** when adding new triggers
5. **Verify compliance** using the verification commands section
6. **Log gaps** when you find enforcement weaknesses

---

**END OF DOCUMENT**
