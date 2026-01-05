# Slash Commands Reference

**Document Version:** 1.0
**Created:** 2026-01-05
**Last Updated:** 2026-01-05
**Status:** ACTIVE

---

## Document Purpose

This document serves as the comprehensive reference for all slash commands available in this project, including:
- **System commands** - Built-in Claude Code CLI commands
- **Custom commands** - Project-specific workflows in `.claude/commands/`
- **Proposed commands** - Planned implementations to close automation gaps

Each command includes description, use cases, implementation details, and compliance relevance.

---

## Table of Contents

1. [System Commands](#1-system-commands)
2. [Current Custom Commands](#2-current-custom-commands)
3. [Proposed Commands - Critical Priority](#3-proposed-commands---critical-priority)
4. [Proposed Commands - High Priority](#4-proposed-commands---high-priority)
5. [Proposed Commands - Medium Priority](#5-proposed-commands---medium-priority)
6. [Proposed Commands - Audit Workflow](#6-proposed-commands---audit-workflow)
7. [Implementation Guidelines](#7-implementation-guidelines)
8. [Gap Analysis](#8-gap-analysis)

---

## 1. System Commands

Built-in Claude Code CLI commands. These are available globally and do not require custom implementation.

### Navigation & Session

| Command | Description | Use Cases |
|---------|-------------|-----------|
| `/help` | Display available commands and usage | When unsure about capabilities |
| `/clear` | Clear conversation history | Start fresh context, reduce noise |
| `/compact` | Compress conversation for efficiency | Long sessions, context limits |
| `/resume` | Resume a previous session | Continue interrupted work |
| `/status` | Show current session status | Check state, active files |

### Configuration

| Command | Description | Use Cases |
|---------|-------------|-----------|
| `/config` | View/modify Claude Code settings | Change behavior, adjust limits |
| `/model` | Switch between Claude models | Use different model for task |
| `/permissions` | Manage tool permissions | Restrict/enable capabilities |
| `/init` | Initialize Claude Code in a project | New project setup |
| `/terminal-setup` | Configure terminal integration | Shell customization |
| `/vim` | Toggle vim keybindings | Editor preference |

### Authentication & Tools

| Command | Description | Use Cases |
|---------|-------------|-----------|
| `/login` | Authenticate with Anthropic | Initial setup, token refresh |
| `/logout` | End authentication session | Security, switch accounts |
| `/mcp` | Manage MCP server connections | Add/remove tool servers |
| `/doctor` | Diagnose configuration issues | Troubleshoot problems |

### Code & Repository

| Command | Description | Use Cases |
|---------|-------------|-----------|
| `/review` | Request code review | After writing significant code |
| `/pr-comments` | View PR comments from GitHub | Check feedback on PRs |
| `/add-dir` | Add directory to context | Include additional codebase areas |
| `/ide` | IDE integration commands | VS Code, cursor integration |
| `/cost` | Display token/cost usage | Monitor API consumption |
| `/memory` | Manage conversation memory | Context persistence |

---

## 2. Current Custom Commands

Project-specific commands located in `.claude/commands/`. These implement standardized workflows critical to project compliance.

---

### `/session-begin`

**File:** `.claude/commands/session-begin.md`
**Lines:** 89
**Created:** Session #20

#### Description
Pre-session verification checklist that ensures context is loaded, consolidation status is checked, and the AI is prepared to work effectively.

#### Use Cases
- Starting any new work session
- Resuming after context switch
- Beginning work after extended break

#### Workflow Steps
1. **Context Loading** - Read SESSION_CONTEXT.md, increment session counter, check ROADMAP.md
2. **Consolidation Status** - Check if pattern consolidation was missed (>=10 reviews)
3. **Documentation Awareness** - Check INTEGRATED_IMPROVEMENT_PLAN.md current step
4. **Skill Selection** - Decision tree for appropriate agent/skill usage
5. **Code Review Handling** - Procedures for processing review feedback
6. **Anti-Pattern Awareness** - Scan claude.md Section 4 before writing code
7. **Script Execution** - Run `npm run patterns:check`, `npm run review:check`, `npm run lessons:surface`
8. **Incident Documentation** - Reminder to document significant errors

#### Scripts Auto-Run
```bash
npm run patterns:check    # Surface known anti-patterns
npm run review:check      # Check if multi-AI review thresholds reached
npm run lessons:surface   # Surface past lessons relevant to current work
```

#### Compliance Relevance
- **Pattern Enforcement:** Loads claude.md Section 4 anti-patterns into context
- **Trigger Detection:** Identifies when multi-AI review is due
- **Knowledge Continuity:** Ensures patterns from previous sessions are applied

#### Gap Closed
- Previously: Context was loaded ad-hoc, patterns forgotten
- Now: Systematic verification ensures nothing missed

---

### `/session-end`

**File:** `.claude/commands/session-end.md`
**Lines:** 150
**Created:** Session #20

#### Description
Post-session verification and audit checklist that ensures all work is properly documented, validated, and ready for handoff.

#### Use Cases
- Completing any work session
- Before extended breaks
- Before context handoff to another session

#### Workflow Steps
1. **Work Verification** - All todos complete, commits pushed, tests pass
2. **CI Verification** - Check modified CI files still work
3. **Documentation Updates** - Update SESSION_CONTEXT.md, INTEGRATED_IMPROVEMENT_PLAN.md
4. **Learning Consolidation** - Check/perform pattern consolidation if due
5. **Code Review Audit** - Verify all review items addressed
6. **Agent/Skill/Hook Audit** - Comprehensive 6-section audit table
7. **Key Learnings** - Document DO/DON'T patterns from session
8. **Commit Summary** - List commits made this session

#### Audit Sections
| Section | Purpose |
|---------|---------|
| 6.1 Session Start Scripts | Verify patterns:check, review:check, lessons:surface ran |
| 6.2 Agent Usage | Track code-reviewer, security-auditor, debugger, Explore, Plan |
| 6.3 Skill Usage | Track systematic-debugging, frontend-design, code-reviewer |
| 6.4 MCP Servers | Document which MCP servers were used |
| 6.5 Hooks Executed | Verify SessionStart, UserPromptSubmit, pre-commit, pre-push |
| 6.6 Audit Result | PASS/FAIL with remediation notes |

#### Compliance Relevance
- **Skill Verification:** Ensures appropriate agents/skills were used
- **Pattern Consolidation:** Triggers consolidation when 10+ reviews accumulated
- **Knowledge Capture:** Documents learnings before context lost
- **Handoff Quality:** Next session has clear starting point

#### Gap Closed
- Previously: Sessions ended abruptly, knowledge lost
- Now: Systematic capture ensures continuity

---

### `/pr-review`

**File:** `.claude/commands/pr-review.md`
**Lines:** 300
**Created:** Session #22

#### Description
Comprehensive protocol for processing AI code review feedback from CodeRabbit, Qodo, or other tools. Ensures every suggestion is addressed, categorized, and documented.

#### Use Cases
- Receiving CodeRabbit PR comments
- Processing Qodo compliance feedback
- Handling any AI-generated code review

#### Workflow Steps
1. **Context Loading (Tiered)** - Read claude.md Section 4, learnings log quick index
2. **Initial Intake** - Identify source, extract ALL suggestions, announce count
3. **Categorization** - CRITICAL/MAJOR/MINOR/TRIVIAL with action requirements
4. **Create Todo List** - Track every item including learning log entry
5. **Invoke Agents** - security-auditor, test-engineer, etc. based on issue types
6. **Address Issues** - Fix in priority order, verify each fix
7. **Document Decisions** - Deferred/Rejected items with justification
8. **Learning Capture** - Add Review #N entry, update consolidation counter
9. **Final Summary** - Statistics, files modified, verification status
10. **Commit** - With proper prefix and CANON-ID references

#### Categorization Matrix
| Category | Criteria | Action |
|----------|----------|--------|
| CRITICAL | Security, data loss, breaking changes | Fix IMMEDIATELY |
| MAJOR | Bugs, performance, missing validation | Fix before proceeding |
| MINOR | Style, naming, tests, docs | Fix (don't defer) |
| TRIVIAL | Typos, whitespace, formatting | **FIX THESE TOO** |

#### Compliance Relevance
- **Complete Coverage:** No suggestions skipped
- **Pattern Learning:** Every review adds to AI_REVIEW_LEARNINGS_LOG.md
- **Agent Invocation:** Specialized agents used for appropriate issues
- **Documentation:** Full audit trail of decisions

#### Gap Closed
- Previously: Review items cherry-picked, some skipped
- Now: All items addressed or explicitly justified

---

## 3. Proposed Commands - Critical Priority

Commands that close major automation gaps and save significant time.

---

### `/consolidate-patterns`

**Priority:** CRITICAL
**Estimated Implementation:** 2-3 hours
**Gap Closed:** Pattern consolidation is manual 7-step process, often skipped

#### Description
Automates the pattern consolidation workflow that surfaces repeated patterns from AI_REVIEW_LEARNINGS_LOG.md into claude.md Section 4.

#### Use Cases
- When "Reviews since last consolidation" >= 10
- Before major audits (Step 4)
- End of sprint/milestone
- Force consolidation with `--force` flag

#### Problem Solved
Patterns identified in reviews don't reach claude.md context until manually consolidated. This means the AI doesn't "learn" from previous sessions until someone remembers to consolidate.

**Current Manual Process (30-45 min):**
1. Check consolidation counter in AI_REVIEW_LEARNINGS_LOG.md
2. If >= 10: manually review all reviews since last consolidation
3. Identify patterns with 3+ occurrences
4. Manually add to claude.md Section 4
5. Run `npm run patterns:suggest`
6. Manually add suggested patterns to check-pattern-compliance.js
7. Reset counter

#### Proposed Implementation

````markdown
---
description: Consolidate review patterns into claude.md (when 10+ reviews accumulated)
---

# Pattern Consolidation Workflow

## Step 1: Check Trigger
```bash
# Parse consolidation counter
counter=$(grep -oP 'Reviews since last consolidation:\s*\K\d+' docs/AI_REVIEW_LEARNINGS_LOG.md)
echo "Current count: $counter"
```

- If < 10: "Consolidation not due ($counter/10 reviews). Use --force to override."
- If >= 10: Proceed automatically

## Step 2: Identify Reviews to Process
- Find "Last consolidation:" marker in log
- List all Review #N entries since that marker
- Parse "Patterns Identified:" from each

## Step 3: Count Pattern Occurrences
| Pattern | Occurrences | Reviews |
|---------|-------------|---------|
| [Pattern A] | 4 | #41, #45, #48, #52 |
| [Pattern B] | 3 | #43, #47, #51 |
| [Pattern C] | 2 | #44, #50 |

**Consolidation Candidates (3+ occurrences):** 2 patterns

## Step 4: Check Existing Patterns
- Read claude.md Section 4 "Tribal Knowledge"
- Compare candidates against existing patterns
- Flag: NEW (add) vs DUPLICATE (skip) vs ENHANCE (update existing)

## Step 5: Run Automation Check
```bash
npm run patterns:suggest
```
- Parse output for automatable patterns
- Generate additions for check-pattern-compliance.js

## Step 6: Preview Changes
```diff
# claude.md Section 4
+ ### Pattern: [New Pattern Name]
+ - **Issue:** [What causes this]
+ - **Solution:** [How to fix]
+ - **Reviews:** #41, #45, #48, #52
```

**Confirm changes? (y/n)**

## Step 7: Apply and Finalize
- Update claude.md Section 4
- Update check-pattern-compliance.js (if applicable)
- Reset counter: "Reviews since last consolidation: 0"
- Add consolidation note to version history
- Commit: "docs: Consolidate Reviews #X-Y patterns into claude.md"
````

#### Compliance Relevance
- **Pattern Enforcement:** Ensures patterns reach AI context
- **Automation:** Reduces human error in pattern identification
- **Audit Trail:** Documents when and what was consolidated

#### Time Saved
30-45 min per consolidation (3-5 times/month = 2-4 hours/month)

---

### `/audit-step`

**Priority:** CRITICAL
**Estimated Implementation:** 2-3 hours
**Gap Closed:** Phase completion audits are manual checklists, often incomplete

#### Description
Automates the Step Completion Audit required before marking any INTEGRATED_IMPROVEMENT_PLAN.md step as COMPLETE.

#### Use Cases
- Completing any step in the improvement plan
- Verifying step deliverables before sign-off
- Generating audit documentation

#### Syntax
```
/audit-step 4      # Audit Step 4
/audit-step 4B     # Audit Step 4B
/audit-step --dry  # Show what would be checked without marking complete
```

#### Problem Solved
Step audits require manual verification of each deliverable, running validation scripts, and generating audit tables. This is error-prone and often skipped under time pressure.

#### Proposed Implementation

```markdown
---
description: Automate phase completion audit for INTEGRATED_IMPROVEMENT_PLAN.md
args: step_number - The step to audit (1-7, 4B)
---

# Step Completion Audit: Step $STEP_NUMBER

## Step 1: Parse Deliverables
- Read INTEGRATED_IMPROVEMENT_PLAN.md
- Extract tasks for Step $STEP_NUMBER
- Extract acceptance criteria

**Found:**
- Tasks: X total (Y completed, Z pending)
- Acceptance Criteria: N items

## Step 2: Run Validation Scripts

| Script | Command | Result |
|--------|---------|--------|
| Lint | `npm run lint` | [RUNNING...] |
| Tests | `npm test` | [RUNNING...] |
| Patterns | `npm run patterns:check` | [RUNNING...] |
| Docs | `npm run docs:check` | [RUNNING...] |
| Circular | `npm run deps:circular` | [RUNNING...] |

**Validation Result:** PASS / FAIL (X/Y passed)

## Step 3: Verify Deliverables

| Deliverable | Status | Evidence |
|-------------|--------|----------|
| [Task 4.1.1] | ✅ Verified | Commit abc123 |
| [Task 4.1.2] | ✅ Verified | File exists |
| [Task 4.1.3] | ❓ Manual | Requires human verification |

**Manual Verification Required:**
- "Did you verify [specific criterion]? (y/n/skip)"

## Step 4: Generate Audit Report

```markdown
### Step $STEP_NUMBER Completion Audit

**Audit performed by:** Claude
**Audit date:** YYYY-MM-DD

#### Deliverable Verification
| Deliverable | Status | Evidence |
|-------------|--------|----------|
...

#### Validation Results
- npm run lint: PASS
- npm test: X/Y passing
...

#### Deviations from Plan
| Planned | Actual | Rationale |
...

#### Sign-off
- [x] All deliverables verified
- [x] Validation scripts pass
- [x] Step marked COMPLETE
```

## Step 5: Update Plan (if --apply)
- Insert audit into INTEGRATED_IMPROVEMENT_PLAN.md
- Update status: PENDING → COMPLETE
- Update completion percentage
- Commit: "docs: Complete Step $STEP_NUMBER audit"
```

#### Compliance Relevance
- **Audit Trail:** Every step has documented verification
- **Validation:** Scripts run before marking complete
- **Consistency:** Same audit format every time

#### Time Saved
20-30 min per step completion

---

### `/security-check`

**Priority:** CRITICAL
**Estimated Implementation:** 2 hours
**Gap Closed:** No automated verification of 50+ security patterns in claude.md

#### Description
Comprehensive security compliance check that verifies pattern adherence, ESLint baseline, critical files, and claude.md patterns.

#### Use Cases
- Before any security-related changes
- After modifying firebase.ts, firestore.rules, etc.
- During Step 4.2.2 Security Audit
- Regular security hygiene check

#### Problem Solved
50+ security patterns documented in claude.md Section 4, but no automated verification. ESLint security baseline (181 warnings) can drift without detection.

#### Proposed Implementation

```markdown
---
description: Verify security pattern compliance and baseline status
---

# Security Compliance Check

## Step 1: Pattern Compliance
```bash
npm run patterns:check --json
```

| Category | Violations | Files |
|----------|------------|-------|
| path-traversal | 0 | - |
| insecure-startswith | 0 | - |
| symlink-escape | 0 | - |
| unsafe-error-message | 0 | - |

**Pattern Result:** PASS (0 security violations)

## Step 2: ESLint Security Baseline
```bash
npm run lint -- --format json 2>&1 | grep -c "eslint-plugin-security"
```

| Metric | Value |
|--------|-------|
| Current warnings | 181 |
| Baseline (2026-01-04) | 181 |
| Delta | 0 |

**Baseline Result:** PASS (no drift)

## Step 3: Critical File Checks

| File | Check | Status |
|------|-------|--------|
| `firebase-service-account.json` | Not in repo | ✅ |
| `.env*` | In .gitignore | ✅ |
| `lib/firebase.ts` | No hardcoded keys | ✅ |
| `firestore.rules` | Exists and validated | ✅ |
| `functions/` | No exposed secrets | ✅ |

## Step 4: Claude.md Pattern Scan
Scanning for violations of documented security patterns...

| Pattern | Status |
|---------|--------|
| No string concatenation in queries | ✅ |
| Use parameterized Firebase calls | ✅ |
| Validate all user input | ✅ |
| Check path.relative() returns | ✅ |

## Summary

```
SECURITY CHECK RESULTS
======================
Pattern Violations:  0
ESLint Baseline:     181 (no drift)
Critical Files:      5/5 passed
Claude.md Patterns:  4/4 compliant

OVERALL: ✅ PASS
```
```

#### Compliance Relevance
- **Pattern Enforcement:** Automated check of 50+ patterns
- **Baseline Monitoring:** Detects ESLint security drift
- **Critical Files:** Ensures secrets not committed

---

### `/review-status`

**Priority:** CRITICAL
**Estimated Implementation:** 1.5 hours
**Gap Closed:** Ambiguous "when should we run multi-AI review?" decisions

#### Description
Check all multi-AI review triggers and recommend action based on thresholds.

#### Use Cases
- Before starting new feature work
- At session start (via /session-begin)
- When considering multi-AI audit
- After significant refactoring

#### Problem Solved
Multiple trigger thresholds exist (50 commits, 10 reviews, 5 security files, 30 days) but no unified view. Decision to run review is subjective.

#### Proposed Implementation

```markdown
---
description: Check multi-AI review triggers and recommend action
---

# Multi-AI Review Status

## Trigger Analysis

| Trigger | Threshold | Current | Status |
|---------|-----------|---------|--------|
| Commits since last review | 50 | 133 | ⚠️ EXCEEDED |
| Security files changed | 5 | 6 | ⚠️ EXCEEDED |
| Reviews since consolidation | 10 | 3 | ✅ OK |
| Days since last review | 30 | 7 | ✅ OK |

**Active Triggers:** 2 of 4

## Changed Files Analysis

### Security-Sensitive (6 files)
- `lib/firebase.ts` - Last: 2026-01-03
- `firestore.rules` - Last: 2026-01-02
- `.github/workflows/deploy-firebase.yml` - Last: 2026-01-04
- `docs/SECURITY.md` - Last: 2026-01-03
- `docs/SERVER_SIDE_SECURITY.md` - Last: 2026-01-03
- `functions/src/index.ts` - Last: 2026-01-02

### High-Churn Files (top 5)
1. `scripts/check-pattern-compliance.js` - 12 changes
2. `docs/AI_REVIEW_LEARNINGS_LOG.md` - 10 changes
3. `.claude/commands/pr-review.md` - 8 changes

## Recommendation

**ACTION REQUIRED: Run Multi-AI Audit**

Based on triggers, recommended scope:
- [x] Security Audit (6 security files changed)
- [x] Code Review (133 commits backlog)
- [ ] Performance Audit (no triggers)
- [ ] Documentation Audit (no triggers)
- [ ] Process Audit (no triggers)

**Estimated Duration:** 4-6 hours
**Suggested Models:** Claude Opus 4.5, GPT-5.2-Codex, Gemini 3 Pro

Would you like to generate the audit prompts? (y/n)
```

#### Compliance Relevance
- **Trigger Enforcement:** Clear threshold-based decision making
- **Audit Scoping:** Recommends appropriate categories
- **Documentation:** Records when triggers were checked

---

### `/remediate`

**Priority:** CRITICAL
**Estimated Implementation:** 2-3 hours
**Gap Closed:** No workflow for executing CANON findings from Step 4

#### Description
Execute fixes from CANON findings or PR plan generated by Step 4.

#### Use Cases
- Step 4B Remediation Sprint
- Addressing specific CANON items
- Batch fixing PR groups

#### Syntax
```
/remediate CANON-0012        # Fix specific finding
/remediate PR1               # Fix all items in PR group 1
/remediate --all --severity S0,S1  # All critical/major items
```

#### Proposed Implementation

```markdown
---
description: Execute fixes from CANON findings or PR plan
args: target - CANON-ID, PR-ID, or --all
---

# Remediation Workflow: $TARGET

## Step 1: Load Finding(s)

**Source:** DEDUPED_FINDINGS_JSONL / PR_PLAN_JSON

| ID | Severity | Category | File | Description |
|----|----------|----------|------|-------------|
| CANON-0012 | S1 | Security | lib/firebase.ts | Missing input validation |
| CANON-0015 | S1 | Security | lib/firebase.ts | Unescaped user input |

**Items to fix:** 2

## Step 2: Create Work Plan

Using TodoWrite to track:
1. [ ] Read lib/firebase.ts
2. [ ] Fix CANON-0012: Add input validation
3. [ ] Fix CANON-0015: Escape user input
4. [ ] Run validation
5. [ ] Update CANON status

## Step 3: Execute Fixes

### CANON-0012: Missing input validation
**File:** lib/firebase.ts:45
**Suggested Fix:**
```typescript
// Before
const result = await db.collection(userInput).get();

// After
const sanitized = validateCollectionName(userInput);
const result = await db.collection(sanitized).get();
```

**Applying fix...**
✅ Fix applied

### CANON-0015: Unescaped user input
...

## Step 4: Validation

```bash
npm run lint        # ✅ PASS
npm test           # ✅ 115/116 passing
npm run patterns:check  # ✅ 0 violations
```

## Step 5: Update Status

- CANON-0012: DONE ✅
- CANON-0015: DONE ✅

**Commit:** "fix(security): CANON-0012, CANON-0015 - input validation in firebase.ts"

## Summary
- Fixed: 2 items
- Validation: PASS
- CANON backlog updated
```

#### Compliance Relevance
- **Execution Tracking:** Every CANON fix documented
- **Validation:** Tests run after each fix
- **Audit Trail:** Commits reference CANON-IDs

---

## 4. Proposed Commands - High Priority

Commands that prevent errors and improve workflow efficiency.

---

### `/verify-archival`

**Priority:** HIGH
**Estimated Implementation:** 1.5 hours
**Gap Closed:** Review #53 - CI broke when script referenced archived file

#### Description
Safe document archival with cross-reference checking.

#### Use Cases
- Before archiving any document
- Moving docs to archive folder
- Deprecating planning documents

#### Problem Solved
When DOCUMENTATION_STANDARDIZATION_PLAN.md was archived, validate-phase-completion.js still referenced it, causing CI failure. Manual grep for references is error-prone.

#### Proposed Implementation

```markdown
---
description: Verify document can be safely archived
args: file - Path to document to archive
---

# Pre-Archival Verification: $FILE

## Step 1: Find All References

Searching: scripts/, .github/, docs/, *.md, *.js, *.ts, *.yml

| File | Line | Reference Type |
|------|------|----------------|
| scripts/validate-phase-completion.js:12 | Direct import | BLOCKING |
| .github/workflows/validate-plan.yml:8 | Trigger path | BLOCKING |
| docs/INTEGRATED_IMPROVEMENT_PLAN.md:852 | Markdown link | UPDATE |
| SESSION_CONTEXT.md:45 | Mention | UPDATE |

**BLOCKING references:** 2
**References to update:** 2

## Step 2: Suggest Replacements

| Current | Suggested Replacement |
|---------|----------------------|
| `docs/DOCUMENTATION_STANDARDIZATION_PLAN.md` | `docs/archive/DOCUMENTATION_STANDARDIZATION_PLAN.md` |
| OR | `docs/INTEGRATED_IMPROVEMENT_PLAN.md` (if superseded) |

## Step 3: Preview Changes

Would update:
- scripts/validate-phase-completion.js (line 12)
- .github/workflows/validate-plan.yml (line 8)

**Proceed with archival? (y/n)**

## Step 4: Execute (if confirmed)
1. Update blocking references
2. Move file to archive with superseded_by header
3. Leave stub at original location
4. Run `npm run docs:check`
5. Commit changes
```

#### Compliance Relevance
- **CI Protection:** Prevents broken builds from archived refs
- **Link Integrity:** All cross-references updated
- **Audit Trail:** Documents what was moved and why

---

### `/surface-learnings`

**Priority:** HIGH
**Estimated Implementation:** 1.5 hours
**Gap Closed:** Session learnings not captured consistently

#### Description
Auto-document session patterns and add to AI_REVIEW_LEARNINGS_LOG.md.

#### Use Cases
- At session end
- After encountering significant issues
- When patterns emerge from debugging

#### Proposed Implementation

```markdown
---
description: Surface and document session learnings
---

# Session Learning Capture

## Step 1: Analyze Session Activity

**Issues Encountered:**
- Pattern compliance failure (path boundary anchoring)
- CI failure (archived file reference)

**Patterns Identified:**
1. "pathExclude without boundary anchors matches substrings"
2. "Scripts referencing docs must be updated when docs archived"

## Step 2: Cross-Reference with Log

Checking AI_REVIEW_LEARNINGS_LOG.md...

| Pattern | Already Documented? | Reviews |
|---------|---------------------|---------|
| Path boundary anchoring | ✅ Review #52 | 1 occurrence |
| Archive reference checking | ❌ NEW | - |

## Step 3: Generate Entry

```markdown
#### Review #54: Archive Reference Safety (2026-01-05)

**Source:** Session debugging
**Suggestions:** 2 (Critical: 1, Major: 1)

**Patterns Identified:**
1. [Archive Reference Breaking CI]: Scripts and workflows that reference docs must be updated when those docs are archived
   - Root cause: validate-phase-completion.js had hardcoded path
   - Prevention: Add /verify-archival command; always grep before archive

**Resolution:**
- Fixed: 2 items
- Deferred: 0
- Rejected: 0

**Key Learnings:**
- Always search for references before archiving ANY document
- Update CI workflow paths when referenced docs move
```

**Add to log? (y/n)**
```

---

### `/lint-baseline`

**Priority:** HIGH
**Estimated Implementation:** 1 hour
**Gap Closed:** ESLint 181 warning baseline can drift undetected

#### Description
Quarterly ESLint baseline audit and update.

#### Use Cases
- Quarterly maintenance
- After major refactoring
- When security warnings change

#### Proposed Implementation

```markdown
---
description: Audit ESLint baseline and detect drift
---

# ESLint Baseline Audit

## Current State
```bash
npm run lint 2>&1 | grep -c "warning"
```

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Total warnings | 181 | 183 | +2 |
| eslint-plugin-security | 181 | 183 | +2 |

## New Warnings

| File | Rule | Line |
|------|------|------|
| lib/newfile.ts:23 | security/detect-object-injection | NEW |
| lib/newfile.ts:45 | security/detect-non-literal-regexp | NEW |

## Recommendation

**Options:**
1. Fix new warnings (recommended if < 5)
2. Update baseline (if false positives)
3. Add to backlog (if complex fix)

**Update baseline?** (y/n)

If yes:
- Update DEVELOPMENT.md: "181 warnings" → "183 warnings"
- Update audit date: "2026-01-04" → "2026-01-05"
- Commit: "docs: Update ESLint baseline to 183 warnings"
```

---

### `/cross-ref-check`

**Priority:** HIGH
**Estimated Implementation:** 1 hour
**Gap Closed:** Broken links discovered late after doc moves

#### Description
Quick cross-reference validation for documentation.

#### Use Cases
- After moving/renaming documents
- Before major doc changes
- As part of /session-end

#### Proposed Implementation

```markdown
---
description: Check for broken cross-references in documentation
---

# Cross-Reference Check

## Running npm run docs:check...

**Results:**

| File | Issue | Line |
|------|-------|------|
| ROADMAP.md:45 | Broken link: ./old-file.md | ERROR |
| SESSION_CONTEXT.md:23 | Missing anchor: #section | WARNING |

**Errors:** 1
**Warnings:** 1

## Suggested Fixes

1. ROADMAP.md:45 - Update link to new location
2. SESSION_CONTEXT.md:23 - Add missing section anchor

**Apply fixes? (y/n)**
```

---

### `/trigger-check`

**Priority:** HIGH
**Estimated Implementation:** 1 hour
**Gap Closed:** Multiple trigger thresholds need unified view

#### Description
Unified view of all automation triggers and their status.

#### Use Cases
- Session start overview
- Before major changes
- Compliance dashboard

#### Proposed Implementation

```markdown
---
description: Check all automation trigger statuses
---

# Trigger Status Dashboard

## Review Triggers

| Trigger | Threshold | Current | Status |
|---------|-----------|---------|--------|
| Commits since review | 50 | 133 | ⚠️ |
| Security files changed | 5 | 6 | ⚠️ |
| Reviews pending consolidation | 10 | 3 | ✅ |
| Days since review | 30 | 7 | ✅ |

## Archival Triggers

| Trigger | Threshold | Current | Status |
|---------|-----------|---------|--------|
| AI_REVIEW_LEARNINGS_LOG lines | 1500 | 1234 | ✅ |
| Reviews in batch | 10 | 13 | ⚠️ |
| Patterns consolidated | Yes | Yes | ✅ |

## Baseline Triggers

| Trigger | Threshold | Current | Status |
|---------|-----------|---------|--------|
| ESLint warnings drift | 0 | 0 | ✅ |
| Test count change | ±5 | 0 | ✅ |
| Pattern violations | 0 | 0 | ✅ |

## Actions Required

1. ⚠️ Multi-AI review recommended (2 triggers active)
2. ⚠️ Consider archiving reviews (batch size reached)
```

---

## 5. Proposed Commands - Medium Priority

Commands that improve efficiency but aren't blocking.

---

### `/roadmap-update`

**Priority:** MEDIUM
**Estimated Implementation:** 1.5 hours

#### Description
Assist with ROADMAP.md updates and ensure consistency.

#### Use Cases
- After completing milestones
- When priorities change
- Updating blockers

---

### `/canon-status`

**Priority:** MEDIUM
**Estimated Implementation:** 1 hour

#### Description
Track CANON finding status across sessions.

#### Use Cases
- During Step 4B remediation
- Checking what's been fixed
- Planning remediation work

---

### `/ci-validate`

**Priority:** MEDIUM
**Estimated Implementation:** 1 hour

#### Description
Validate CI workflow changes before committing.

#### Use Cases
- After modifying .github/workflows/
- Before pushing CI changes
- Debugging workflow failures

---

### `/deps-audit`

**Priority:** MEDIUM
**Estimated Implementation:** 1.5 hours

#### Description
Unified dependency audit (npm audit, outdated, licenses).

#### Use Cases
- Security reviews
- Before major updates
- Compliance checks

---

### `/agent-recommend`

**Priority:** MEDIUM
**Estimated Implementation:** 0.5 hours

#### Description
Recommend appropriate agent/skill based on current task.

#### Use Cases
- When unsure which agent to use
- Starting new task type
- Training new workflows

---

## 6. Proposed Commands - Audit Workflow

Commands specific to Step 4 Multi-AI Audit execution.

---

### Audit Category Commands

Six commands, one per audit category:

| Command | Category | Template |
|---------|----------|----------|
| `/audit-code` | Code Review | MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md |
| `/audit-security` | Security + Deps | MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md |
| `/audit-perf` | Performance | MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md |
| `/audit-refactor` | Refactoring | MULTI_AI_REFACTORING_PLAN_TEMPLATE.md |
| `/audit-docs` | Documentation | MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md |
| `/audit-process` | Process/Automation | MULTI_AI_PROCESS_AUDIT_TEMPLATE.md |

Each command:
1. Loads the appropriate template
2. Gathers current context (test count, lint status, etc.)
3. Generates prompt for 3+ AI models
4. Captures FINDINGS_JSONL from each
5. Runs Tier-1 aggregation
6. Outputs CANON-CATEGORY.jsonl

---

### `/aggregate-tier2`

**Priority:** HIGH (for Step 4)
**Estimated Implementation:** 2 hours

#### Description
Execute Tier-2 cross-category aggregation.

#### Use Cases
- After all 6 categories complete in Step 4.2
- Input: 6 CANON-*.jsonl files
- Output: Unified DEDUPED_FINDINGS_JSONL + PR_PLAN_JSON

---

## 7. Implementation Guidelines

### Command File Structure

All custom commands go in `.claude/commands/`:

```
.claude/commands/
├── session-begin.md       # Session start
├── session-end.md         # Session end
├── pr-review.md           # Code review processing
├── consolidate-patterns.md # Pattern consolidation
├── audit-step.md          # Phase completion audit
├── security-check.md      # Security compliance
├── review-status.md       # Review trigger check
├── remediate.md           # CANON fix execution
└── ...
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

| Area | Hooks | Scripts | Commands | Gap |
|------|-------|---------|----------|-----|
| Session management | SessionStart | - | session-begin, session-end | ✅ Covered |
| Code review | UserPromptSubmit | - | pr-review | ✅ Covered |
| Pattern checking | pre-commit, pre-push | patterns:check | - | ⚠️ No command |
| Consolidation | - | lessons:surface, patterns:suggest | - | ❌ **CRITICAL GAP** |
| Security audit | - | - | - | ❌ **CRITICAL GAP** |
| Review triggers | - | review:check | - | ⚠️ Advisory only |
| Phase completion | - | phase-complete-check | - | ⚠️ Manual audit |
| Archival | - | archive-doc | - | ⚠️ No safety check |
| CANON remediation | - | - | - | ❌ **CRITICAL GAP** |

### Priority Implementation Order

1. **Phase 1 (Week 1):** `/consolidate-patterns`, `/audit-step`, `/security-check`
2. **Phase 2 (Week 2):** `/review-status`, `/remediate`, `/verify-archival`
3. **Phase 3 (Week 3):** 6 `/audit-*` commands, `/aggregate-tier2`
4. **Phase 4 (Ongoing):** Remaining medium-priority commands

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | Initial creation - comprehensive slash command reference |

---

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [.claude/commands/](../.claude/commands/) - Custom command files
- [INTEGRATED_IMPROVEMENT_PLAN.md](./INTEGRATED_IMPROVEMENT_PLAN.md) - Current improvement plan
- [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md) - Review patterns
- [claude.md](../claude.md) - Project configuration and patterns
