# Slash Commands Reference

**Document Version:** 2.0 **Created:** 2026-01-05 **Last Updated:** 2026-01-15
**Status:** ACTIVE

---

## Document Purpose

This document serves as the comprehensive reference for all slash commands
available in this project, including:

- **System commands** - Built-in Claude Code CLI commands
- **Custom commands** - Project-specific workflows in `.claude/commands/`
- **Proposed commands** - Planned implementations to close automation gaps

Each command includes description, use cases, implementation details, and
compliance relevance.

## Quick Start

1. Use `/help` to see all available commands
2. Check [Current Custom Commands](#2-current-custom-commands) for project workflows
3. Run `/session-begin` at the start of each session

## AI Instructions

When implementing or using slash commands:
- Always check if a command exists before implementing new functionality
- Follow the naming convention: `verb-noun` (e.g., `session-begin`, `code-review`)
- Document new commands in this reference file

---

## Table of Contents

1. [System Commands](#1-system-commands)
2. [Current Custom Commands](#2-current-custom-commands)
3. [Proposed Commands - Critical Priority](#3-proposed-commands---critical-priority)
4. [Proposed Commands - High Priority](#4-proposed-commands---high-priority)
5. [Proposed Commands - Medium Priority](#5-proposed-commands---medium-priority)
6. [Proposed Commands - By Category](#6-proposed-commands---by-category)
7. [Implementation Guidelines](#7-implementation-guidelines)
8. [Gap Analysis](#8-gap-analysis)

---

## 1. System Commands

Built-in Claude Code CLI commands. These are available globally and do not
require custom implementation.

### Navigation & Session

| Command    | Description                          | Use Cases                         |
| ---------- | ------------------------------------ | --------------------------------- |
| `/help`    | Display available commands and usage | When unsure about capabilities    |
| `/clear`   | Clear conversation history           | Start fresh context, reduce noise |
| `/compact` | Compress conversation for efficiency | Long sessions, context limits     |
| `/resume`  | Resume a previous session            | Continue interrupted work         |
| `/status`  | Show current session status          | Check state, active files         |

### Configuration

| Command           | Description                         | Use Cases                      |
| ----------------- | ----------------------------------- | ------------------------------ |
| `/config`         | View/modify Claude Code settings    | Change behavior, adjust limits |
| `/model`          | Switch between Claude models        | Use different model for task   |
| `/permissions`    | Manage tool permissions             | Restrict/enable capabilities   |
| `/init`           | Initialize Claude Code in a project | New project setup              |
| `/terminal-setup` | Configure terminal integration      | Shell customization            |
| `/vim`            | Toggle vim keybindings              | Editor preference              |

### Authentication & Tools

| Command   | Description                   | Use Cases                    |
| --------- | ----------------------------- | ---------------------------- |
| `/login`  | Authenticate with Anthropic   | Initial setup, token refresh |
| `/logout` | End authentication session    | Security, switch accounts    |
| `/mcp`    | Manage MCP server connections | Add/remove tool servers      |
| `/doctor` | Diagnose configuration issues | Troubleshoot problems        |

### Code & Repository

| Command        | Description                  | Use Cases                         |
| -------------- | ---------------------------- | --------------------------------- |
| `/review`      | Request code review          | After writing significant code    |
| `/pr-comments` | View PR comments from GitHub | Check feedback on PRs             |
| `/add-dir`     | Add directory to context     | Include additional codebase areas |
| `/ide`         | IDE integration commands     | VS Code, cursor integration       |
| `/cost`        | Display token/cost usage     | Monitor API consumption           |
| `/memory`      | Manage conversation memory   | Context persistence               |

---

## 2. Current Custom Commands

Project-specific commands located in `.claude/commands/`. These implement
standardized workflows critical to project compliance.

**Currently Implemented (12 commands):**

| Command                | File                   | Purpose                  |
| ---------------------- | ---------------------- | ------------------------ |
| `/session-begin`       | session-begin.md       | Pre-session verification |
| `/session-end`         | session-end.md         | Post-session audit       |
| `/pr-review`           | pr-review.md           | Code review processing   |
| `/fetch-pr-feedback`   | fetch-pr-feedback.md   | Fetch AI review feedback |
| `/docs-sync`           | docs-sync.md           | Document synchronization |
| `/checkpoint`          | checkpoint.md          | Session state save       |
| `/audit-code`          | audit-code.md          | Code review audit        |
| `/audit-security`      | audit-security.md      | Security audit           |
| `/audit-performance`   | audit-performance.md   | Performance audit        |
| `/audit-refactoring`   | audit-refactoring.md   | Refactoring audit        |
| `/audit-documentation` | audit-documentation.md | Documentation audit      |
| `/audit-process`       | audit-process.md       | Process/automation audit |

---

### `/session-begin`

**File:** `.claude/commands/session-begin.md` **Created:** Session #20

#### Description

Pre-session verification checklist that ensures context is loaded, consolidation
status is checked, and the AI is prepared to work effectively.

#### Use Cases

- Starting any new work session
- Resuming after context switch
- Beginning work after extended break

#### Workflow Steps

1. **Context Loading** - Read SESSION_CONTEXT.md, increment session counter,
   check ROADMAP.md
2. **Consolidation Status** - Check if pattern consolidation was missed (>=10
   reviews)
3. **Documentation Awareness** - Check INTEGRATED_IMPROVEMENT_PLAN.md current
   step
4. **Skill Selection** - Decision tree for appropriate agent/skill usage
5. **Code Review Handling** - Procedures for processing review feedback
6. **Anti-Pattern Awareness** - Scan claude.md Section 4 + CODE_PATTERNS.md
   before writing code
7. **Script Execution** - Run `npm run patterns:check`, `npm run review:check`,
   `npm run lessons:surface`
8. **Incident Documentation** - Reminder to document significant errors

#### Scripts Auto-Run

```bash
npm run patterns:check    # Surface known anti-patterns
npm run review:check      # Check if multi-AI review thresholds reached
npm run lessons:surface   # Surface past lessons relevant to current work
```

#### Compliance Relevance

- **Pattern Enforcement:** Loads claude.md Section 4 + CODE_PATTERNS.md
  anti-patterns into context
- **Trigger Detection:** Identifies when multi-AI review is due
- **Knowledge Continuity:** Ensures patterns from previous sessions are applied

---

### `/session-end`

**File:** `.claude/commands/session-end.md` **Created:** Session #20

#### Description

Post-session verification and audit checklist that ensures all work is properly
documented, validated, and ready for handoff.

#### Use Cases

- Completing any work session
- Before extended breaks
- Before context handoff to another session

#### Workflow Steps

1. **Work Verification** - All todos complete, commits pushed, tests pass
2. **CI Verification** - Check modified CI files still work
3. **Documentation Updates** - Update SESSION_CONTEXT.md,
   INTEGRATED_IMPROVEMENT_PLAN.md
4. **Learning Consolidation** - Check/perform pattern consolidation if due
5. **Code Review Audit** - Verify all review items addressed
6. **Agent/Skill/Hook Audit** - Comprehensive 6-section audit table
7. **Key Learnings** - Document DO/DON'T patterns from session
8. **Commit Summary** - List commits made this session

#### Audit Sections

| Section                   | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| 6.1 Session Start Scripts | Verify patterns:check, review:check, lessons:surface ran       |
| 6.2 Agent Usage           | Track code-reviewer, security-auditor, debugger, Explore, Plan |
| 6.3 Skill Usage           | Track systematic-debugging, frontend-design, code-reviewer     |
| 6.4 MCP Servers           | Document which MCP servers were used                           |
| 6.5 Hooks Executed        | Verify SessionStart, UserPromptSubmit, pre-commit, pre-push    |
| 6.6 Audit Result          | PASS/FAIL with remediation notes                               |

---

### `/pr-review`

**File:** `.claude/commands/pr-review.md` **Created:** Session #22

#### Description

Comprehensive protocol for processing AI code review feedback from CodeRabbit,
Qodo, or other tools. Ensures every suggestion is addressed, categorized, and
documented.

#### Use Cases

- Receiving CodeRabbit PR comments
- Processing Qodo compliance feedback
- Handling any AI-generated code review

#### Workflow Steps

1. **Context Loading (Tiered)** - Read claude.md Section 4 + CODE_PATTERNS.md,
   learnings log quick index
2. **Initial Intake** - Identify source, extract ALL suggestions, announce count
3. **Categorization** - CRITICAL/MAJOR/MINOR/TRIVIAL with action requirements
4. **Create Todo List** - Track every item including learning log entry
5. **Invoke Agents** - security-auditor, test-engineer, etc. based on issue
   types
6. **Address Issues** - Fix in priority order, verify each fix
7. **Document Decisions** - Deferred/Rejected items with justification
8. **Learning Capture** - Add Review #N entry, update consolidation counter
9. **Final Summary** - Statistics, files modified, verification status
10. **Commit** - With proper prefix and CANON-ID references

#### Categorization Matrix

| Category | Criteria                              | Action                |
| -------- | ------------------------------------- | --------------------- |
| CRITICAL | Security, data loss, breaking changes | Fix IMMEDIATELY       |
| MAJOR    | Bugs, performance, missing validation | Fix before proceeding |
| MINOR    | Style, naming, tests, docs            | Fix (don't defer)     |
| TRIVIAL  | Typos, whitespace, formatting         | **FIX THESE TOO**     |

---

### `/fetch-pr-feedback`

**File:** `.claude/commands/fetch-pr-feedback.md` **Created:** Session #38

#### Description

Fetch AI code review feedback (CodeRabbit, Qodo, SonarQube) from a GitHub PR and
prepare it for processing with `/pr-review`.

#### Syntax

```
/fetch-pr-feedback [PR_NUMBER]
```

If no PR number provided, automatically finds the PR for the current branch.

#### Use Cases

- When CodeRabbit/Qodo comments arrive on a PR
- Before processing PR review feedback
- Gathering all AI feedback from multiple sources

#### Workflow Steps

1. **Determine PR** - Use provided number or find PR for current branch via
   `gh pr list`
2. **Fetch Details** - Get PR info, comments, review comments, and check runs
3. **Parse Sources** - Categorize by source (CodeRabbit, Qodo, SonarQube)
4. **Output Summary** - Present structured summary with counts per source
5. **Auto-Invoke `/pr-review`** - Automatically proceeds with full PR review
   protocol

---

### `/docs-sync`

**File:** `.claude/commands/docs-sync.md` **Created:** Session #35

#### Description

Synchronize documentation and check for consistency issues.

#### Use Cases

- After moving/renaming documents
- Ensuring cross-references are valid
- Syncing related documents

---

### `/checkpoint`

**File:** `.claude/commands/checkpoint.md`

#### Description

Quick save of current session state for recovery after failures.

#### Use Cases

- Before risky operations
- Periodic state saves during long sessions
- Before context-heavy operations

---

### `/audit-code`

**File:** `.claude/commands/audit-code.md` **Created:** Session #37 (2026-01-08)

#### Description

Single-session code review audit. Checks code hygiene, types, framework
patterns, testing, and security surface.

#### Features

1. Checks category-specific thresholds (25 commits OR 15 files)
2. Gathers current baselines (test counts, lint status, versions)
3. Performs focused audit with file:line evidence
4. Outputs markdown summary + JSONL findings
5. Saves to `docs/audits/single-session/code/`
6. Updates AUDIT_TRACKER.md to reset category threshold

#### Focus Areas

- Code Hygiene (unused imports, dead code, console.logs)
- Types & Correctness (any types, type safety, null checks)
- Framework Best Practices (React patterns, Next.js conventions)
- Testing Coverage (untested functions, missing edge cases)
- Security Surface (input validation, auth checks)

---

### `/audit-security`

**File:** `.claude/commands/audit-security.md` **Created:** Session #37

#### Description

Single-session security audit. Checks authentication, input validation, data
protection, Firebase security, dependencies, and OWASP coverage.

#### Focus Areas

- Authentication & Authorization
- Input Validation
- Data Protection
- Firebase/Firestore Security
- Dependency Security
- OWASP Top 10 Coverage

---

### `/audit-performance`

**File:** `.claude/commands/audit-performance.md` **Created:** Session #37

#### Description

Single-session performance audit. Checks bundle size, rendering performance,
data fetching, memory management, and Core Web Vitals optimization.

#### Focus Areas

- Bundle Size & Loading
- Rendering Performance
- Data Fetching & Caching
- Memory Management
- Core Web Vitals

---

### `/audit-refactoring`

**File:** `.claude/commands/audit-refactoring.md` **Created:** Session #37

#### Description

Single-session refactoring audit. Identifies god objects, code duplication,
cognitive complexity, architecture violations, and technical debt markers.

#### Focus Areas

- God Objects
- Code Duplication
- Cognitive Complexity
- Architecture Violations
- Technical Debt Markers

---

### `/audit-documentation`

**File:** `.claude/commands/audit-documentation.md` **Created:** Session #37

#### Description

Single-session documentation audit. Checks broken links, stale content, coverage
gaps, tier compliance, frontmatter consistency, and template-instance sync.

#### Focus Areas

- Broken Links
- Stale Content
- Coverage Gaps
- Tier Compliance
- Frontmatter Consistency
- Template-Instance Sync

---

### `/audit-process`

**File:** `.claude/commands/audit-process.md` **Created:** Session #37

#### Description

Single-session process/automation audit. Checks CI/CD pipelines, git hooks,
Claude hooks, scripts, triggers, and process documentation.

#### Focus Areas

- CI/CD Pipeline
- Git Hooks
- Claude Hooks
- Script Health
- Trigger Thresholds
- Process Documentation

---

## 3. Proposed Commands - Critical Priority

Commands that close major automation gaps and save significant time.

---

### `/consolidate-patterns`

**Priority:** CRITICAL **Gap Closed:** Pattern consolidation is manual 7-step
process, often skipped

#### Description

Automates the pattern consolidation workflow that surfaces repeated patterns
from AI_REVIEW_LEARNINGS_LOG.md into claude.md Section 4 + CODE_PATTERNS.md.

#### Use Cases

- When "Reviews since last consolidation" >= 10
- Before major audits (Step 4)
- End of sprint/milestone
- Force consolidation with `--force` flag

#### Problem Solved

Patterns identified in reviews don't reach claude.md context until manually
consolidated. This means the AI doesn't "learn" from previous sessions until
someone remembers to consolidate.

---

### `/security-check`

**Priority:** CRITICAL **Gap Closed:** No automated verification of 50+ security
patterns in claude.md

#### Description

Comprehensive security compliance check that verifies pattern adherence, ESLint
baseline, critical files, and claude.md patterns.

#### Use Cases

- Before any security-related changes
- After modifying firebase.ts, firestore.rules, etc.
- During Step 4.2.2 Security Audit
- Regular security hygiene check

---

### `/review-status`

**Priority:** CRITICAL **Gap Closed:** Ambiguous "when should we run multi-AI
review?" decisions

#### Description

Check all multi-AI review triggers and recommend action based on thresholds.

#### Use Cases

- Before starting new feature work
- At session start (via /session-begin)
- When considering multi-AI audit
- After significant refactoring

---

### `/remediate`

**Priority:** CRITICAL **Gap Closed:** No workflow for executing CANON findings
from Step 4

#### Description

Execute fixes from CANON findings or PR plan generated by Step 4.

#### Syntax

```
/remediate CANON-0012        # Fix specific finding
/remediate PR1               # Fix all items in PR group 1
/remediate --all --severity S0,S1  # All critical/major items
```

---

## 4. Proposed Commands - High Priority

Commands that prevent errors and improve workflow efficiency.

---

### `/verify-archival`

**Priority:** HIGH **Gap Closed:** Review #53 - CI broke when script referenced
archived file

#### Description

Safe document archival with cross-reference checking.

#### Use Cases

- Before archiving any document
- Moving docs to archive folder
- Deprecating planning documents

---

### `/surface-learnings`

**Priority:** HIGH **Gap Closed:** Session learnings not captured consistently

#### Description

Auto-document session patterns and add to AI_REVIEW_LEARNINGS_LOG.md.

#### Use Cases

- At session end
- After encountering significant issues
- When patterns emerge from debugging

---

### `/lint-baseline`

**Priority:** HIGH **Gap Closed:** ESLint warning baseline can drift undetected

#### Description

Quarterly ESLint baseline audit and update.

#### Use Cases

- Quarterly maintenance
- After major refactoring
- When security warnings change

---

### `/cross-ref-check`

**Priority:** HIGH **Gap Closed:** Broken links discovered late after doc moves

#### Description

Quick cross-reference validation for documentation.

---

### `/trigger-check`

**Priority:** HIGH **Gap Closed:** Multiple trigger thresholds need unified view

#### Description

Unified view of all automation triggers and their status.

---

## 5. Proposed Commands - Medium Priority

Commands that improve efficiency but aren't blocking.

---

### `/roadmap-update`

**Priority:** MEDIUM

#### Description

Assist with ROADMAP.md updates and ensure consistency.

---

### `/canon-status`

**Priority:** MEDIUM

#### Description

Track CANON finding status across sessions.

---

### `/ci-validate`

**Priority:** MEDIUM

#### Description

Validate CI workflow changes before committing.

---

### `/deps-audit`

**Priority:** MEDIUM

#### Description

Unified dependency audit (npm audit, outdated, licenses).

---

### `/agent-recommend`

**Priority:** MEDIUM

#### Description

Recommend appropriate agent/skill based on current task.

---

## 6. Proposed Commands - By Category

Additional proposed commands organized by functional area.

### Firebase & Cloud Functions

| Command                  | Description                                 | Priority |
| ------------------------ | ------------------------------------------- | -------- |
| `/firebase-deploy-check` | Pre-deployment validation for Firebase      | HIGH     |
| `/function-scaffold`     | Generate Cloud Function with best practices | MEDIUM   |
| `/test-cloud-function`   | Test specific Cloud Function with mock data | MEDIUM   |
| `/firestore-rules-test`  | Run comprehensive Firestore rules tests     | MEDIUM   |
| `/firebase-emulator`     | Start Firebase emulators with config        | LOW      |

### Testing & Quality

| Command                      | Description                              | Priority |
| ---------------------------- | ---------------------------------------- | -------- |
| `/test-suite-run`            | Run test suite with comprehensive report | HIGH     |
| `/coverage-improve`          | Identify untested code paths             | MEDIUM   |
| `/pattern-violation-fix`     | Auto-fix code pattern violations         | MEDIUM   |
| `/integration-test-generate` | Generate integration tests for a feature | MEDIUM   |

### Documentation

| Command             | Description                                | Priority |
| ------------------- | ------------------------------------------ | -------- |
| `/doc-update`       | Intelligent documentation update assistant | MEDIUM   |
| `/doc-template`     | Create document from template              | LOW      |
| `/learning-extract` | Extract learnings from recent AI reviews   | MEDIUM   |
| `/adr-create`       | Create Architecture Decision Record        | LOW      |

### Security & Compliance

| Command              | Description                      | Priority |
| -------------------- | -------------------------------- | -------- |
| `/security-scan`     | Comprehensive security audit     | HIGH     |
| `/appcheck-validate` | Validate App Check configuration | MEDIUM   |
| `/secrets-audit`     | Audit for hardcoded secrets      | HIGH     |
| `/compliance-check`  | Verify compliance with standards | MEDIUM   |

### Development Assistance

| Command               | Description                                  | Priority |
| --------------------- | -------------------------------------------- | -------- |
| `/component-scaffold` | Generate React component with best practices | MEDIUM   |
| `/hook-create`        | Generate custom React hook with testing      | LOW      |
| `/schema-generate`    | Generate Zod schema from TypeScript type     | LOW      |
| `/refactor-suggest`   | AI-powered refactoring suggestions           | MEDIUM   |

### Monitoring & Observability

| Command               | Description                            | Priority |
| --------------------- | -------------------------------------- | -------- |
| `/error-dashboard`    | Generate error report from Sentry/logs | HIGH     |
| `/performance-report` | Comprehensive performance analysis     | MEDIUM   |
| `/lighthouse-compare` | Compare Lighthouse scores over time    | MEDIUM   |
| `/sentry-triage`      | Triage and categorize Sentry errors    | MEDIUM   |

### CI/CD & Deployment

| Command            | Description                     | Priority |
| ------------------ | ------------------------------- | -------- |
| `/deploy-preview`  | Preview deployment changes      | HIGH     |
| `/deploy-rollback` | Rollback to previous deployment | HIGH     |
| `/build-analyze`   | Analyze Next.js build output    | MEDIUM   |
| `/ci-debug`        | Debug CI/CD pipeline failures   | MEDIUM   |
| `/release-prepare` | Prepare for production release  | MEDIUM   |

### Data Management

| Command            | Description                               | Priority |
| ------------------ | ----------------------------------------- | -------- |
| `/schema-validate` | Validate Firestore data against schemas   | MEDIUM   |
| `/data-migration`  | Plan and execute Firestore data migration | MEDIUM   |
| `/backup-create`   | Create Firestore backup with validation   | LOW      |
| `/data-audit`      | Audit Firestore data for inconsistencies  | LOW      |

---

## 7. Implementation Guidelines

### Command File Structure

All custom commands go in `.claude/commands/`:

```
.claude/commands/
├── session-begin.md       # Session start
├── session-end.md         # Session end
├── pr-review.md           # Code review processing
├── fetch-pr-feedback.md   # Fetch PR feedback
├── docs-sync.md           # Document sync
├── checkpoint.md          # State checkpoint
├── audit-code.md          # Code audit
├── audit-security.md      # Security audit
├── audit-performance.md   # Performance audit
├── audit-refactoring.md   # Refactoring audit
├── audit-documentation.md # Documentation audit
├── audit-process.md       # Process audit
└── [proposed commands]    # Future implementations
```

### Command Template

```markdown
---
description: Brief description for /help output
args: arg1 - Description of argument
---

# Command Title

## Step 1: [First Step]

...

## Step 2: [Second Step]

...

## Summary

...
```

### Best Practices

1. **Auto-run scripts** - Commands should execute relevant npm scripts
2. **Clear decision points** - Don't hide complexity; guide through it
3. **Preview changes** - Always show diff before modifying files
4. **Structured output** - Use tables and code blocks consistently
5. **Error handling** - Fail clearly with actionable messages
6. **Compliance logging** - Add entries to relevant logs

---

## 8. Gap Analysis

### Current Automation Coverage

| Area               | Hooks                | Scripts                           | Commands                     | Gap              |
| ------------------ | -------------------- | --------------------------------- | ---------------------------- | ---------------- |
| Session management | SessionStart         | -                                 | session-begin, session-end   | Covered          |
| Code review        | UserPromptSubmit     | -                                 | pr-review, fetch-pr-feedback | Covered          |
| Pattern checking   | pre-commit, pre-push | patterns:check                    | -                            | No command       |
| Consolidation      | -                    | lessons:surface, patterns:suggest | -                            | **CRITICAL GAP** |
| Security audit     | -                    | -                                 | audit-security               | Covered          |
| Review triggers    | -                    | review:check                      | -                            | Advisory only    |
| Phase completion   | -                    | phase-complete-check              | -                            | Manual audit     |
| Archival           | -                    | archive-doc                       | -                            | No safety check  |
| CANON remediation  | -                    | -                                 | -                            | **CRITICAL GAP** |

### Priority Implementation Order

1. **Phase 1:** `/consolidate-patterns`, `/security-check`, `/remediate`
2. **Phase 2:** `/review-status`, `/verify-archival`, `/lint-baseline`
3. **Phase 3:** Firebase commands, testing commands
4. **Phase 4:** Remaining medium-priority commands

---

## Version History

| Version | Date       | Changes                                                                 |
| ------- | ---------- | ----------------------------------------------------------------------- |
| 2.0     | 2026-01-15 | Combined SLASH_COMMANDS.md and CUSTOM_SLASH_COMMANDS_GUIDE.md           |
| 1.2     | 2026-01-09 | Added /fetch-pr-feedback command documentation                          |
| 1.1     | 2026-01-08 | Added 6 single-session audit commands with AUDIT_TRACKER.md integration |
| 1.0     | 2026-01-05 | Initial creation - comprehensive slash command reference                |

---

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [.claude/commands/](../.claude/commands/) - Custom command files
- [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md) - Review patterns
- [claude.md](../claude.md) - Project configuration and patterns
