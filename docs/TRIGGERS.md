# TRIGGERS.md - Automation & Enforcement Reference

**Project**: SoNash Recovery Notebook **Document Version**: 1.7 **Created**:
2026-01-02 **Status**: ACTIVE **Last Updated**: 2026-01-27

---

## 🎯 DOCUMENT PURPOSE

This is the **CANONICAL** reference for all automation triggers, enforcement
measures, conditional directives, and compliance mechanisms in the SoNash
repository. This document serves as:

1. **Inventory** - Complete list of all triggers and enforcement mechanisms
2. **Reference** - How each mechanism works and when it fires
3. **Verification Guide** - How to check if triggers are working correctly
4. **Compliance Tracker** - Ensuring all mechanisms are followed

**⚠️ CRITICAL**: This document covers automated (CI/CD, hooks) AND manual
(documentation directives) triggers. Both require compliance.

---

## Quick Start

1. Check trigger inventory for your automation
2. Verify trigger conditions and actions
3. Test trigger behavior before deployment

---

## 📋 HOW TO USE THIS DOCUMENT

### For Developers

1. **Before committing**: Review [Pre-Commit Hooks](#1-pre-commit-hooks) to
   understand what runs
2. **Before pushing**: Review [CI/CD Workflows](#2-github-actions-cicd) to
   anticipate checks
3. **When adding features**: Check
   [Documentation Directives](#5-documentation-based-directives) for update
   requirements

### For AI Assistants

1. **Read [Documentation Directives](#5-documentation-based-directives)** -
   Critical workflow rules
2. **Follow process maps** - Each trigger section includes step-by-step flows
3. **Update documentation** when triggers indicate updates are needed

### For Compliance Verification

1. Use [Quick Verification Suite](#quick-verification-suite) section for each
   trigger type
2. Check [Current Gaps](#current-gaps) for known issues
3. Review [Recommended Additions](#recommended-additions) for improvement areas

---

## 📊 TRIGGERS OVERVIEW

| Category                 | Count | Automated | Manual | Status |
| ------------------------ | ----- | --------- | ------ | ------ |
| GitHub Actions (CI/CD)   | 5     | ✅        | -      | Active |
| Pre-Commit Hooks         | 1     | ✅        | -      | Active |
| Session Hooks            | 13    | ✅        | -      | Active |
| npm Scripts              | 8     | Semi      | ✅     | Active |
| Automation Scripts       | 6     | -         | ✅     | Active |
| Documentation Directives | 12+   | -         | ✅     | Active |
| Anti-Pattern Checks      | 35+   | ✅        | -      | Active |

**Total Enforcement Points**: 79+

---

# 1. PRE-COMMIT HOOKS

## 1.1 Husky Pre-Commit Hook

| Attribute     | Value                                |
| ------------- | ------------------------------------ |
| **Name**      | Husky Pre-Commit                     |
| **Location**  | `.husky/pre-commit`                  |
| **Trigger**   | Every `git commit` command           |
| **Execution** | Automatic (blocks commit on failure) |

### Description

Comprehensive pre-commit validation that runs multiple checks before allowing
commits. Blocks on critical failures, warns on advisory issues.

### Checks Performed

| #   | Check                  | Blocking | Purpose                                               |
| --- | ---------------------- | -------- | ----------------------------------------------------- |
| 1   | ESLint                 | ✅ Yes   | Code quality and errors                               |
| 1b  | CC Gate (staged JS)    | ✅ Yes   | Blocks CC >15 in staged .js files (PR #371 retro)     |
| 2   | lint-staged (Prettier) | ✅ Yes   | Auto-formats staged files (Session #70)               |
| 3   | Pattern Compliance     | ✅ Yes   | Anti-pattern detection                                |
| 4   | Tests                  | ✅ Yes   | Unit test validation                                  |
| 5   | CANON Schema           | ⚠️ No    | Audit file validation (when JSONL staged)             |
| 6   | Skill Validation       | ⚠️ No    | Command/skill structure (when skill files staged)     |
| 7   | Cross-Doc Dependencies | ✅ Yes   | Blocks if dependent docs not staged (Session #69)     |
| 8   | Doc Index Staleness    | ✅ Yes   | Blocks if new .md added but index not updated (#103)  |
| 8.5 | Doc Header Validation  | ✅ Yes   | Blocks if new .md lacks required headers (#115)       |
| 9   | Learning Reminder      | ⚠️ No    | Reminds to log PR feedback                            |
| 10  | Audit S0/S1 Validation | ✅ Yes   | Blocks S0/S1 without verification_steps (Session #98) |
| 11  | Agent Compliance       | ⚠️ No    | Warns if code written without agent review (#101)     |

### Function

```text
TRIGGER: git commit
  → CHECK 1: npm run lint (BLOCKING)
  → CHECK 1b: CC gate on staged .js (BLOCKING - PR #371 retro)
  → CHECK 2: npx --no-install lint-staged (BLOCKING - auto-formats staged files)
  → CHECK 3: npm run patterns:check (BLOCKING)
  → CHECK 4: npm test (BLOCKING)
  → CHECK 5: npm run validate:canon (if JSONL staged)
  → CHECK 6: npm run skills:validate (if skill files staged)
  → CHECK 7: npm run crossdoc:check (BLOCKING - Session #69)
  → CHECK 8: Doc Index check (if new .md files added) (BLOCKING - Session #103)
  → CHECK 8.5: Doc Header validation (if new .md files) (BLOCKING - Session #115)
  → CHECK 9: Learning entry reminder (if many files changed)
  → CHECK 10: Audit S0/S1 validation (if audit JSONL staged) (BLOCKING - Session #98)
  → CHECK 11: Agent compliance check (non-blocking warning)
  → IF all blocking checks pass: Allow commit
  → IF any blocking check fails: Block commit with error
```

### Cross-Document Dependencies (Check 7) - BLOCKING

**Changed to blocking in Session #69.** Prevents commit if dependent documents
are not staged together. Override with `SKIP_CROSS_DOC_CHECK=1 git commit ...`

Blocks when you modify documents that have known dependencies:

| Modified File                              | Check These                      |
| ------------------------------------------ | -------------------------------- |
| ROADMAP.md                                 | SESSION_CONTEXT.md               |
| package.json (scripts section changed)     | DEVELOPMENT.md                   |
| `.husky/*` or `.claude/hooks/*`            | docs/TRIGGERS.md, DEVELOPMENT.md |
| `.claude/commands/*` or `.claude/skills/*` | COMMAND_REFERENCE.md             |

> **Note:** SESSION_CONTEXT ↔ INTEGRATED_IMPROVEMENT_PLAN checks removed (plan
> archived 2026-01-14). See Review #144.

See:
[DOCUMENT_DEPENDENCIES.md](./DOCUMENT_DEPENDENCIES.md#cross-document-update-triggers)

### Documentation Index Staleness (Check 8) - AUTO-FIX

**Added in Session #103. Updated Session #150:** Now auto-regenerates AND
formats DOCUMENTATION_INDEX.md when .md files are staged. The hook runs
`npm run docs:index` followed by `npx prettier --write` to ensure CI Prettier
checks pass. Override with `SKIP_DOC_INDEX_CHECK=1 git commit ...`

| When Triggered                        | Resolution                                   |
| ------------------------------------- | -------------------------------------------- |
| .md file staged (git diff-filter=ADM) | Auto-runs `docs:index` + Prettier, re-stages |
| DOCUMENTATION_INDEX.md already staged | Check passes                                 |

> **Why auto-fix:** DOCUMENTATION_INDEX.md is the canonical auto-generated index
> of all documentation. The pre-commit hook auto-regenerates and formats it to
> prevent CI Prettier failures (fixed in Session #150 after 3 consecutive CI
> failures).

### Document Header Validation (Check 8.5) - BLOCKING for new docs

**Added in Session #115.** Ensures new markdown documents have required headers
per documentation standards. Override with
`SKIP_DOC_HEADER_CHECK=1 git commit ...`

| When Triggered                         | Resolution                           |
| -------------------------------------- | ------------------------------------ |
| New .md file added (git diff-filter=A) | Add required headers to new document |
| Headers already present                | Check passes                         |

**Required Headers:**

```markdown
<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** YYYY-MM-DD
**Status:** DRAFT | ACTIVE | DEPRECATED
<!-- prettier-ignore-end -->
```

**Exempt files:** README.md, CHANGELOG.md, LICENSE.md, archive/,
DOCUMENTATION_INDEX.md

> **Why blocking:** Consistent document headers enable automated tooling,
> version tracking, and status visibility across all documentation.

### Verification

```bash
# Check hook is installed
cat .husky/pre-commit

# Verify husky is set up
npm run prepare

# Run individual checks manually
npm run lint
npm run patterns:check
npm test
```

### Compliance Status

- ✅ **Automated**: Cannot be bypassed without `--no-verify`
- ⚠️ **Weakness**: Developers can use `git commit --no-verify`

---

# 2. GITHUB ACTIONS (CI/CD)

## 2.1 CI Workflow

| Attribute     | Value                                   |
| ------------- | --------------------------------------- |
| **Name**      | CI (Continuous Integration)             |
| **Location**  | `.github/workflows/ci.yml`              |
| **Trigger**   | Push to `main`, Pull Requests to `main` |
| **Execution** | Automatic                               |

### Description

Primary CI pipeline that runs on all PRs and main branch pushes. Validates code
quality, runs tests, builds the project.

### Function

```text
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

```text
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

| Attribute     | Value                                                    |
| ------------- | -------------------------------------------------------- |
| **Name**      | CodeQL Security Analysis                                 |
| **Location**  | `.github/workflows/codeql.yml`                           |
| **Trigger**   | Push to `main`, PRs to `main`, Weekly schedule (Mondays) |
| **Execution** | Automatic                                                |

### Description

Static security analysis scanning for vulnerabilities, code quality issues, and
security anti-patterns in JavaScript/TypeScript.

### Function

```text
TRIGGER: push to main OR PR to main OR schedule (Monday 0:00 UTC)
  → CHECKOUT: Repository
  → INITIALIZE: CodeQL with javascript/typescript
  → BUILD: Autobuild
  → ANALYZE: Security scan
  → REPORT: Upload to GitHub Security tab
  → IF critical vulnerabilities: Create security alert
```

### Process Map

```text
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

| Attribute     | Value                                     |
| ------------- | ----------------------------------------- |
| **Name**      | Dependency Review                         |
| **Location**  | `.github/workflows/dependency-review.yml` |
| **Trigger**   | Pull Requests only                        |
| **Execution** | Automatic                                 |

### Description

Scans dependency changes in PRs for known vulnerabilities. Blocks PRs that
introduce vulnerable dependencies.

### Function

```text
TRIGGER: pull_request
  → CHECKOUT: Repository
  → SCAN: Compare dependency changes
  → CHECK: Against vulnerability databases
  → IF vulnerable deps found: Fail check, block PR
  → IF clean: Pass
```

### Process Map

```text
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

| Attribute     | Value                                   |
| ------------- | --------------------------------------- |
| **Name**      | Firebase Deploy                         |
| **Location**  | `.github/workflows/deploy-firebase.yml` |
| **Trigger**   | Push to `main` (after CI passes)        |
| **Execution** | Automatic                               |

### Description

Deploys application to Firebase Hosting after successful CI on main branch.

### Function

```text
TRIGGER: push to main (needs: ci to pass)
  → CHECKOUT: Repository
  → SETUP: Node.js
  → INSTALL: Dependencies
  → BUILD: Production build
  → DEPLOY: Firebase Hosting
  → IF deploy fails: Notify (Slack/email if configured)
```

### Process Map

```text
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

| Attribute     | Value                                    |
| ------------- | ---------------------------------------- |
| **Name**      | Stale Issue Handler                      |
| **Location**  | [archived] `.github/workflows/stale.yml` |
| **Trigger**   | Daily schedule                           |
| **Execution** | Automatic                                |

### Description

Automatically labels and closes stale issues/PRs that have had no activity.

### Function

```text
TRIGGER: schedule (daily)
  → SCAN: All open issues and PRs
  → IF no activity for 60 days: Label as "stale"
  → IF stale + no activity for 7 more days: Close
  → EXEMPT: Issues with "pinned" or "security" labels
```

---

# 3. SESSION HOOKS

## 3.1 Claude Session Start Hook

| Attribute     | Value                            |
| ------------- | -------------------------------- |
| **Name**      | Claude Session Start             |
| **Location**  | `.claude/hooks/session-start.js` |
| **Trigger**   | Every new Claude Code session    |
| **Execution** | Automatic                        |

### Description

Ensures development environment is ready when AI assistant starts a session.
Installs dependencies, builds functions, runs tests.

### Function

```text
TRIGGER: Claude Code session starts
  → CHECK: If node_modules exists
    → IF missing: npm ci --legacy-peer-deps
  → CHECK: If functions/lib exists
    → IF missing: cd functions && npm run build
  → RUN: npm test (verify tests pass)
  → REPORT: Environment status to AI
```

### Process Map

```text
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
node .claude/hooks/session-start.js

# Check hook configuration
cat .claude/settings.json
```

### Compliance Status

- ✅ **Automated**: Runs automatically on session start
- ✅ **Non-blocking**: Session continues even if tests fail (reports status)

---

## 3.1.2 Remote Session Context Check (Session #101)

| Attribute     | Value                                           |
| ------------- | ----------------------------------------------- |
| **Name**      | Remote Session Context Check                    |
| **Location**  | `.claude/hooks/check-remote-session-context.js` |
| **Trigger**   | Every new Claude Code session (SessionStart)    |
| **Execution** | Automatic                                       |

### Description

Checks remote branches for more recent SESSION_CONTEXT.md updates. Solves the
problem where session-end commits sit in unmerged feature branches and the next
session starting from main doesn't see them.

### Function

```text
TRIGGER: Claude Code session starts
  → FETCH: git fetch --quiet origin
  → LIST: Remote claude/* branches from last 7 days
  → COMPARE: SESSION_CONTEXT.md session counter
    → IF remote newer: WARN user to check/merge branch
    → IF local newer: Continue silently
```

### Compliance Status

- ✅ **Automated**: Runs automatically on session start
- ✅ **Non-blocking**: Warns but doesn't block session
- ✅ **Network-dependent**: Requires git fetch (continues on error)

---

## 3.2 PostToolUse Hooks (Session #90)

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Location**  | `.claude/hooks/*.js`                  |
| **Trigger**   | After Write/Edit/Read/AskUserQuestion |
| **Execution** | Automatic                             |

### Description

PostToolUse hooks run after Claude uses specific tools. They provide real-time
feedback on code quality, security, and best practices.

### Hooks Implemented

| Hook                      | Trigger              | Action  | Purpose                                         |
| ------------------------- | -------------------- | ------- | ----------------------------------------------- |
| session-start.js          | SessionStart         | Setup   | Deps, builds, patterns, TDMS check              |
| compact-restore.js        | SessionStart:compact | Restore | Output recovery context after compaction (#138) |
| pre-compaction-save.js    | PreCompact           | Save    | Full state snapshot before compaction (#138)    |
| post-write-validator.js   | Write/Edit           | Warn    | Schema, lint, pattern validation                |
| post-read-handler.js      | Read                 | Track   | Context tracking, auto-save, handoff            |
| commit-tracker.js         | Bash                 | Track   | Log git commits to JSONL (#138)                 |
| track-agent-invocation.js | Task                 | Track   | Record agent invocations for compliance (#101)  |
| decision-save-prompt.js   | AskQuestion          | Prompt  | Remind to document decisions                    |
| user-prompt-handler.js    | UserPromptSubmit     | Process | Process user prompts                            |

### Verification

```bash
# Test a specific hook
node .claude/hooks/firestore-write-block.js '{"file_path": "test.ts", "content": "..."}'

# Check hook configuration
cat .claude/settings.json | jq '.hooks.PostToolUse'
```

### Compliance Status

- ✅ **Automated**: Runs automatically after tool use
- ⚠️ **Blocking hooks**: firestore-write-block.js, test-mocking-validator.js
- ✅ **Warning hooks**: All others (inform but don't block)

---

## 3.3 UserPromptSubmit Hooks (Session #90)

| Attribute     | Value                      |
| ------------- | -------------------------- |
| **Location**  | `.claude/hooks/*.js`       |
| **Trigger**   | When user submits a prompt |
| **Execution** | Automatic                  |

### Hooks Implemented

| Hook                    | Purpose                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| analyze-user-request.js | Check PRE-TASK triggers for agent usage (v2.0: tightened compound matching, low-confidence hints via stderr) |
| session-end-reminder.js | Detect session ending phrases                                                                                |
| plan-mode-suggestion.js | Suggest Plan mode or /deep-plan for complex tasks                                                            |

### Compliance Status

- ✅ **Automated**: Runs automatically on user prompts
- ✅ **Non-blocking**: Provides guidance but doesn't block

---

## 3.4 Hook Health Infrastructure (Session #91)

| Attribute     | Value                                                   |
| ------------- | ------------------------------------------------------- |
| **Location**  | `scripts/test-hooks.js`, `scripts/check-hook-health.js` |
| **Trigger**   | Manual via npm scripts                                  |
| **Execution** | On-demand                                               |

### Scripts Available

| Command                | Purpose                                |
| ---------------------- | -------------------------------------- |
| `npm run hooks:test`   | Run test suite on all hooks (47 tests) |
| `npm run hooks:health` | Check hook syntax and session state    |

### Features

- **Cross-session validation**: Detects if previous session didn't run
  `/session-end`
- **Syntax validation**: Verifies all hooks parse correctly
- **Session state tracking**: Tracks begin/end counts in
  `.claude/hooks/.session-state.json`

---

## 3.5 Serena Dashboard Termination Hook (Session #90)

| Attribute     | Value                                               |
| ------------- | --------------------------------------------------- |
| **Name**      | Serena Dashboard Safe Termination                   |
| **Location**  | [archived] `.claude/hooks/stop-serena-dashboard.js` |
| **Trigger**   | Every new Claude Code session (SessionStart)        |
| **Execution** | Automatic (async, non-blocking)                     |

### Description

Safely terminates the Serena MCP dashboard process that listens on port 24282
when Claude Code starts. Implements defense-in-depth security controls to
prevent accidental termination of unrelated processes.

### Function

```text
TRIGGER: Claude Code session starts
  → FIND: Process listening on port 24282
    → IF none found: Exit (nothing to do)
  → VALIDATE: PID is valid integer
  → GET: Process info (name, command line)
  → CHECK: Process allowlist
    → Allowed: node/node.exe/serena/claude with dashboard/serena/24282 in cmdline
    → Block: Generic node processes without dashboard-related cmdline
  → TERMINATE:
    → Windows: taskkill (graceful) → taskkill /F (force if needed)
    → Unix: SIGTERM → poll 5s (250ms intervals) → SIGKILL if needed
  → LOG: All actions to .serena-termination.log (secure permissions 0o600)
```

### Security Controls (24 fixes across 3 rounds - Review #198)

**Defense-in-Depth Layers:**

1. **Process Identification**
   - Only targets LISTENING processes (not client connections)
   - Port-specific targeting (24282 only)
   - Cross-platform detection (PowerShell/lsof)

2. **Validation & Authorization**
   - Process allowlist with strict matching
   - PID validation (must be positive integer)
   - Generic node processes require dashboard-related command line

3. **Attack Prevention**
   - TOCTOU-safe symlink protection (O_NOFOLLOW on Unix)
   - Command line redaction in logs (prevent token exposure)
   - No external binary dependencies (Atomics.wait vs sleep)

4. **Graceful Shutdown**
   - SIGTERM before SIGKILL (5-second grace period)
   - Adaptive polling (250ms intervals, not fixed delays)
   - Native process.kill() instead of shell commands

5. **Audit & Compliance**
   - Comprehensive logging with user/session context
   - Secure log file permissions (0o600)
   - Error logging for all failure modes
   - Windows PowerShell fallback for deprecated wmic

### Process Map

```text
SessionStart
     ↓
[Find listener on 24282]
     ↓
  ┌──┴──┐
  ↓     ↓
None  Found (PID)
  ↓     ↓
Exit  [Get process info]
       ↓
    ┌──┴──┐
    ↓     ↓
  Fail  Success
    ↓     ↓
  Block [Check allowlist]
         ↓
      ┌──┴──┐
      ↓     ↓
  Blocked  Allowed
      ↓     ↓
    Exit  [Graceful shutdown]
           ↓
        ┌──┴──┐
        ↓     ↓
     Success  Timeout
        ↓     ↓
      Done  [Force kill]
             ↓
           Done
```

### Verification

```bash
# Check hook is configured
cat .claude/settings.json | grep stop-serena-dashboard

# Run hook manually
node .claude/hooks/stop-serena-dashboard.js

# View audit log
cat .claude/hooks/.serena-termination.log

# Test specific scenarios
# (Start Serena dashboard, then run hook to test termination)
```

### Compliance Status

- ✅ **Automated**: Runs automatically on session start
- ✅ **Non-blocking**: Async with continueOnError (doesn't block session)
- ✅ **Security-hardened**: 24 fixes across 3 review rounds
- ✅ **Auditable**: Comprehensive logging with user/session context
- ✅ **Cross-platform**: Windows (PowerShell/taskkill), Unix (lsof/kill)

### Security Patterns Documented (Review #198)

- Pattern 11: TOCTOU-safe file operations (O_NOFOLLOW)
- Pattern 12: Redact command lines in security logs
- Pattern 13: Native process signaling (process.kill vs execSync)
- Pattern 14: Graceful shutdown polling
- Pattern 15: Error message instanceof check

---

# 4. NPM SCRIPTS (MANUAL TRIGGERS)

## 4.1 Pattern Compliance Check

| Attribute    | Value                                 |
| ------------ | ------------------------------------- |
| **Name**     | Pattern Compliance Check              |
| **Command**  | `npm run patterns:check`              |
| **Location** | `scripts/check-pattern-compliance.js` |
| **Trigger**  | Manual (should run before commits)    |

### Description

Scans codebase for 35+ anti-patterns including security issues, code smells, and
violations of project standards.

### Function

```text
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

| Category           | Patterns                                           |
| ------------------ | -------------------------------------------------- |
| **Debug/Console**  | console.log, console.error, console.warn, debugger |
| **Security**       | eval(), innerHTML, hardcoded secrets, API keys     |
| **Type Safety**    | any type, @ts-ignore, @ts-nocheck                  |
| **Code Quality**   | TODO, FIXME, XXX, HACK comments                    |
| **Error Handling** | Empty catch blocks, unhandled rejections           |
| **React**          | Disabled exhaustive-deps, missing keys             |
| **Testing**        | .only(), .skip() in tests                          |
| **Performance**    | Sync fs operations, blocking calls                 |

### Verification

```bash
# Run the check
npm run patterns:check

# Check specific pattern
grep -r "console\.log" --include="*.ts" --include="*.tsx"
```

---

## 4.2 Documentation Status Update

| Attribute    | Value                             |
| ------------ | --------------------------------- |
| **Name**     | README Status Update              |
| **Command**  | `npm run docs:update-readme`      |
| **Location** | `scripts/update-readme-status.js` |
| **Trigger**  | Manual (after ROADMAP.md changes) |

### Description

Syncs project status from ROADMAP.md to README.md, ensuring status dashboard
stays current.

### Function

```text
TRIGGER: npm run docs:update-readme
  → READ: ROADMAP.md milestone data
  → PARSE: Status, progress percentages
  → UPDATE: README.md status section
  → UPDATE: "Last Updated" timestamp
  → REPORT: Changes made
```

### Process Map

```text
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

| Command                 | Function               | Trigger   |
| ----------------------- | ---------------------- | --------- |
| `npm test`              | Run all unit tests     | Manual/CI |
| `npm run test:coverage` | Tests with c8 coverage | Manual    |

---

## 4.4 Build Commands

| Command              | Function                 | Trigger   |
| -------------------- | ------------------------ | --------- |
| `npm run build`      | Production Next.js build | Manual/CI |
| `npm run dev`        | Development server       | Manual    |
| `npm run lint`       | ESLint check             | Manual/CI |
| `npm run type-check` | TypeScript validation    | Manual/CI |

---

# 5. DOCUMENTATION-BASED DIRECTIVES

These are conditional rules written in documentation that require **manual
compliance** by developers and AI assistants.

## 5.1 AI Workflow Directives

| Attribute    | Value                             |
| ------------ | --------------------------------- |
| **Name**     | AI Workflow Protocol              |
| **Location** | `AI_WORKFLOW.md`                  |
| **Trigger**  | AI session start, task completion |

### Directives

| Directive            | Trigger Condition        | Required Action                      |
| -------------------- | ------------------------ | ------------------------------------ |
| Read claude.md first | New session starts       | Read critical patterns before coding |
| Check ROADMAP.md     | Before any feature work  | Verify alignment with priorities     |
| Update docs          | After completing feature | Update relevant documentation        |
| Run patterns:check   | Before committing        | Verify no anti-patterns introduced   |

### Process Map

```text
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

| Attribute    | Value                             |
| ------------ | --------------------------------- |
| **Name**     | Documentation Standards           |
| **Location** | `docs/DOCUMENTATION_STANDARDS.md` |
| **Trigger**  | Creating/updating documentation   |

### Directives

| Directive                 | Trigger Condition | Required Action                            |
| ------------------------- | ----------------- | ------------------------------------------ |
| Use correct tier template | Creating new doc  | Select Tier 1-5 template                   |
| Include required sections | All docs          | Must have Purpose, Status, AI Instructions |
| Follow naming conventions | New files         | Use SCREAMING_SNAKE_CASE.md                |
| Add to index              | New docs          | Update README.md Documentation Index       |
| Include version history   | All docs          | Track version changes                      |

---

## 5.3 Security Directives

| Attribute    | Value                               |
| ------------ | ----------------------------------- |
| **Name**     | Global Security Standards           |
| **Location** | `docs/GLOBAL_SECURITY_STANDARDS.md` |
| **Trigger**  | Any code changes                    |

### Directives

| Directive            | Trigger Condition | Required Action            |
| -------------------- | ----------------- | -------------------------- |
| Rate limiting        | New endpoints     | Add IP + user-based limits |
| Input validation     | User input        | Validate with schemas      |
| No hardcoded secrets | Any code          | Use environment variables  |
| Error sanitization   | Error responses   | Never expose stack traces  |
| Path traversal check | File operations   | Validate paths             |

---

## 5.4 README Update Triggers

| Attribute    | Value                   |
| ------------ | ----------------------- |
| **Name**     | README Update Triggers  |
| **Location** | `README.md` (bottom)    |
| **Trigger**  | Various project changes |

### Directives

| Trigger Condition               | Required Action            |
| ------------------------------- | -------------------------- |
| Milestone progress changes      | Update status dashboard    |
| New major features added        | Add to Current Features    |
| Tech stack changes              | Update Tech Stack section  |
| Documentation structure changes | Update Documentation Index |
| Project structure changes       | Update Project Structure   |

---

## 5.5 Review Process Directives

| Attribute    | Value                        |
| ------------ | ---------------------------- |
| **Name**     | AI Review Process            |
| **Location** | `AI_REVIEW_PROCESS.md`       |
| **Trigger**  | Code reviews, PR submissions |

### Directives

| Directive        | Trigger Condition          | Required Action                   |
| ---------------- | -------------------------- | --------------------------------- |
| Log learnings    | After code review          | Update AI_REVIEW_LEARNINGS_LOG.md |
| Follow checklist | PR review                  | Use review checklist              |
| Security review  | Security-sensitive changes | Extra security scrutiny           |

---

## 5.6 Phase Completion Audit

| Attribute    | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| **Name**     | Phase Completion Audits                                              |
| **Location** | `docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md` |
| **Trigger**  | Completing any phase                                                 |

### Directives

| Directive           | Trigger Condition       | Required Action               |
| ------------------- | ----------------------- | ----------------------------- |
| Run audit template  | Phase complete          | Complete all audit sections   |
| Verify all tasks    | Before marking complete | Check each deliverable        |
| Document deviations | Any changes from plan   | Record in audit               |
| Update plan         | After audit             | Mark phase complete, update % |

---

# 6. AUTOMATION SCRIPTS

## 6.1 Check Patterns Script

| Attribute    | Value                                 |
| ------------ | ------------------------------------- |
| **Name**     | check-pattern-compliance.js           |
| **Location** | `scripts/check-pattern-compliance.js` |
| **Run via**  | `npm run patterns:check`              |

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

| Attribute    | Value                             |
| ------------ | --------------------------------- |
| **Name**     | update-readme-status.js           |
| **Location** | `scripts/update-readme-status.js` |
| **Run via**  | `npm run docs:update-readme`      |

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
node .claude/hooks/session-start.js
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

| Trigger           | Type      | Enforcement | Bypass Method    | Risk if Bypassed |
| ----------------- | --------- | ----------- | ---------------- | ---------------- |
| Pre-commit hook   | Automated | Strong      | `--no-verify`    | Medium           |
| CI workflow       | Automated | Strong      | None (blocks PR) | N/A              |
| CodeQL            | Automated | Advisory    | Dismiss alert    | High             |
| Dependency review | Automated | Strong      | None (blocks PR) | N/A              |
| Pattern check     | Manual    | Weak        | Don't run it     | Medium           |
| Doc directives    | Manual    | Weak        | Ignore them      | Low-Medium       |
| Session hook      | Automated | Advisory    | Skip output      | Low              |

---

# 9. COMPLIANCE GAPS & RECOMMENDATIONS

## Resolved Gaps ✅

### Gap 1: Pattern Check Not in CI - RESOLVED

**Resolved**: 2026-01-02 **Solution**: Added `npm run patterns:check` to CI
workflow (`.github/workflows/ci.yml`) **Commit**: ci: Add pattern compliance
check to CI workflow

### Gap 2: Documentation Directives Not Enforced - RESOLVED

**Resolved**: 2026-01-02 **Solution**:

- Added `--strict` flag to `scripts/check-docs-light.js` (treats warnings as
  errors)
- Added `npm run docs:check -- --strict` to CI workflow
- Warnings now block PRs (exit code 1) **Commit**: ci: Add docs:check --strict
  to CI workflow (Gap 2 fix)

### Gap 3: Pre-commit Hook Bypass - MITIGATED

**Resolved**: 2026-01-02 **Solution**:

- Added pre-push hook (`.husky/pre-push`) with tests, pattern check, type check
- Added team policy in DEVELOPMENT.md prohibiting `--no-verify`
- CI catches any issues that slip through (defense in depth) **Commit**: feat:
  Add pre-push hook and git hooks policy (Gap 3 fix)
- Session #151: Added code-reviewer gate (blocks push if scripts changed but
  code-reviewer not invoked), security pattern check, event triggers check

### Gap 4: Security Directives Not Automated - RESOLVED

**Resolved**: 2026-01-02 **Solution**:

- Installed `eslint-plugin-security` (detects eval, timing attacks, regex DoS,
  object injection)
- Added 6 security patterns to `check-pattern-compliance.js`:
  - Hardcoded API keys/secrets
  - innerHTML XSS risks
  - eval() usage
  - SQL injection patterns
  - Unsanitized error responses
  - Rate limiting reminders for endpoints **Commit**: feat: Add security linting
    and patterns (Gap 4 fix)

**Future Improvements** (documented for later):

- Option B: Custom ESLint rules for project-specific security patterns
- Option D: Semgrep rules for advanced security scanning

---

## Current Gaps

_All identified gaps have been resolved!_

---

## Recommended Additions

### ~~1. Add Pattern Check to CI~~ ✅ DONE

_Implemented via Gap 1 resolution above_

### ~~2. Add Documentation Drift Check~~ SKIPPED

_Deferred - docs:check already covers link validation, section requirements, and
date checks. Revisit if drift becomes a real problem._

### ~~3. Add Pre-push Hook~~ ✅ DONE

_Implemented via Gap 3 resolution above_

### ~~4. Automate Doc Update Reminders~~ SKIPPED

_Deferred - CodeRabbit reviews + docs:check + PR template checkbox provide
sufficient coverage. Revisit if doc drift becomes a problem._

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

| Version | Date       | Changes                                               | Author |
| ------- | ---------- | ----------------------------------------------------- | ------ |
| 1.7     | 2026-01-27 | Add DOCUMENTATION_INDEX.md staleness check (BLOCKING) | Claude |
| 1.6     | 2026-01-26 | Add Agent compliance check (non-blocking)             | Claude |
| 1.5     | 2026-01-24 | Add Audit S0/S1 validation check (BLOCKING)           | Claude |
| 1.4     | 2026-01-16 | Cross-doc dependency check now BLOCKING (Session #69) | Claude |
| 1.3     | 2026-01-02 | Resolved Gap 4, added security linting                | Claude |
| 1.2     | 2026-01-02 | Resolved Gap 3, added pre-push hook and team policy   | Claude |
| 1.1     | 2026-01-02 | Resolved Gap 1 & 2, added to CI workflow              | Claude |
| 1.0     | 2026-01-02 | Initial document created                              | Claude |

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
