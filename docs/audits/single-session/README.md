# Single-Session Audit Results

**Created:** 2026-01-08 **Updated:** 2026-01-13

---

## Purpose

This document serves as the index and guide for single-session audit results
performed by Claude Code. It provides the folder structure, available commands,
output formats, and quality checks for lightweight interim audits between larger
multi-AI reviews.

---

## Overview

This folder contains audit results from `/audit-*` slash commands. These are
lightweight, single-session audits performed by Claude Code, designed to provide
interim visibility between larger multi-AI audits.

## Folder Structure

```
single-session/
├── code/           # /audit-code results
├── security/       # /audit-security results
├── performance/    # /audit-performance results
├── refactoring/    # /audit-refactoring results
├── documentation/  # /audit-documentation results
├── process/        # /audit-process results
└── README.md       # This file
```

## Available Commands

| Command                | Description              | Focus Areas                                                                                       |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `/audit-code`          | Code review audit        | Hygiene, Types, Framework, Testing, Security, **AI-Code Failure Modes**, **Debugging Ergonomics** |
| `/audit-security`      | Security audit           | Auth, Injection, Data, Firebase, Deps, OWASP, **Headers, Framework, Crypto, Agent Security**      |
| `/audit-performance`   | Performance audit        | Bundle, Rendering, Data Fetch, Memory, Web Vitals, **Offline Support**                            |
| `/audit-refactoring`   | Refactoring audit        | God Objects, Duplication, Complexity, Architecture, Tech Debt                                     |
| `/audit-documentation` | Documentation audit      | Links, Stale Content, Coverage, Tier, Frontmatter, Sync                                           |
| `/audit-process`       | Process/Automation audit | CI/CD, Git Hooks, Claude Hooks, Scripts, Triggers, **Golden Path & DX**                           |

### Engineering Productivity Audit Additions (2026-01-13)

Based on the Engineering Productivity audit analysis, three new categories were
added:

**Code Review (`/audit-code`) - Debugging Ergonomics:**

- Correlation IDs for request tracing
- Structured logging (not just console.log)
- Sentry integration completeness
- Error context and stack traces
- Repro path quality assessment

**Performance (`/audit-performance`) - Offline Support:**

- Offline state detection
- Sync queue implementation
- Pending/synced/failed UI indicators
- Conflict resolution strategy
- Failure mode documentation

**Process (`/audit-process`) - Golden Path & Developer Experience:**

- Single-command workflows (setup, dev, offline, test, deploy, verify, rollback)
- Doctor/diagnostic scripts
- DX friction assessment
- Onboarding friction evaluation

### Security Audit Extended Coverage (2026-01-13)

The security audit now includes additional categories for vibe-coded apps:

- **Hosting Headers**: CSP, HSTS, X-Frame-Options, COOP, COEP
- **Framework-Specific**: Next.js server/client boundary leaks, API route auth
- **File Handling**: Insecure uploads, path traversal
- **Crypto**: Weak randomness, broken hashing, homegrown crypto
- **Product/UX Risks**: Security UI without backend enforcement
- **AI Agent Security**: Prompt injection in configs, agent manipulation
  surfaces

## Output Format

Each audit produces two files:

1. **Markdown Report**: `audit-YYYY-MM-DD.md` - Human-readable summary
2. **JSONL Findings**: `audit-YYYY-MM-DD.jsonl` - Machine-parseable findings

### JSONL Schema (Enhanced)

```json
{
  "id": "XXX-001",
  "category": "Category name",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": "HIGH|MEDIUM|LOW",
  "verified": "DUAL_PASS_CONFIRMED|TOOL_VALIDATED|MANUAL_ONLY",
  "file": "path/to/file.ts",
  "line": 123,
  "title": "Short description",
  "description": "Detailed issue",
  "recommendation": "How to fix",
  "evidence": ["code snippets", "grep output", "tool output"],
  "cross_ref": "eslint|npm_audit|patterns_check|MANUAL_ONLY"
}
```

**New fields (2026-01-08):**

- `confidence`: Finding confidence level (HIGH 90%+, MEDIUM 70-89%, LOW <70%)
- `verified`: Verification method used (DUAL_PASS for S0/S1, TOOL_VALIDATED, or
  MANUAL_ONLY)
- `cross_ref`: Cross-reference source (external tool or manual-only)

---

## Quality Checks and Balances

Single-session audits include several mechanisms to reduce false positives and
improve accuracy:

### 1. Evidence Requirements

**All findings MUST include:**

- File:line reference (exact location)
- Code snippet (3-5 lines of context)
- Verification method (how it was confirmed)
- Standard reference (CWE, OWASP, ESLint rule, etc.)

### 2. Confidence Scoring

| Level  | Threshold | Meaning                                                 |
| ------ | --------- | ------------------------------------------------------- |
| HIGH   | 90%+      | Confirmed by external tool, file verified, code matches |
| MEDIUM | 70-89%    | Pattern search, file verified, no tool confirmation     |
| LOW    | <70%      | Pattern match only, needs manual verification           |

**S0/S1 findings require HIGH or MEDIUM confidence.**

### 3. False Positives Database

Known false positives are stored in `docs/audits/FALSE_POSITIVES.jsonl` and
automatically filtered during audits.

**View the database:**

```bash
node scripts/add-false-positive.js --list
```

**Add a new false positive:**

```bash
node scripts/add-false-positive.js \
  --pattern "regex-pattern" \
  --category "security|code|documentation|performance|refactoring|process" \
  --reason "Explanation of why this is a false positive" \
  --source "AI_REVIEW_LEARNINGS_LOG.md#review-XXX"
```

### 4. Cross-Reference Validation

Findings are cross-referenced against external tools:

- **Security**: npm audit, ESLint security rules, patterns:check
- **Code**: ESLint, TypeScript errors, test failures
- **Performance**: Build output, Lighthouse, profiler
- **Documentation**: docs:check, docs:sync-check, git log
- **Refactoring**: SonarQube, deps:circular, deps:unused
- **Process**: CI logs, script execution, hook tests

### 5. Dual-Pass Verification (S0/S1 Only)

For Critical (S0) and High (S1) severity findings:

1. **First Pass**: Identify issue, note file:line and evidence
2. **Second Pass**: Re-read code in context, verify exploitability/impact
3. **Decision**: CONFIRMED or DOWNGRADE (with reason)

### 6. Post-Audit Validation

All audits run through validation before finalizing:

```bash
node scripts/validate-audit.js docs/audits/single-session/<category>/audit-YYYY-MM-DD.jsonl
```

**Validation checks:**

- Required fields present
- No matches in false positives database
- No duplicate findings
- S0/S1 have HIGH/MEDIUM confidence
- S0/S1 have proper verification

---

## Severity Scale

| Level | Meaning  | Action                  |
| ----- | -------- | ----------------------- |
| S0    | Critical | Immediate fix required  |
| S1    | High     | Fix before next release |
| S2    | Medium   | Fix when convenient     |
| S3    | Low      | Nice to have            |

## Effort Scale

| Level | Meaning | Time Estimate |
| ----- | ------- | ------------- |
| E0    | Trivial | Minutes       |
| E1    | Small   | Hours         |
| E2    | Medium  | Day(s)        |
| E3    | Large   | Week+         |

## Relationship to Multi-AI Audits

Single-session audits are **complementary** to multi-AI audits:

| Aspect          | Single-Session                | Multi-AI                     |
| --------------- | ----------------------------- | ---------------------------- |
| Models          | 1 (Claude Code)               | 3-6 (various)                |
| Consensus       | No                            | Yes                          |
| Threshold Reset | No                            | Yes                          |
| Frequency       | On-demand                     | Threshold-triggered          |
| Output Location | `docs/audits/single-session/` | `docs/reviews/YYYY-QX/`      |
| Logged in       | `docs/AUDIT_TRACKER.md`       | `AI_REVIEW_LEARNINGS_LOG.md` |

## When to Use

- **Between multi-AI audits** for interim visibility
- **Before major features** for quick sanity check
- **After significant changes** to specific areas
- **On-demand** when you want a quick review

## Threshold Integration

These audits check thresholds via `npm run review:check` but:

- **Warn** if thresholds not met
- **Proceed anyway** (user invoked intentionally)
- **Do NOT reset** thresholds (that's for multi-AI audits only)

---

## Scripts

| Script                          | Purpose                         |
| ------------------------------- | ------------------------------- |
| `scripts/validate-audit.js`     | Validate JSONL audit findings   |
| `scripts/add-false-positive.js` | Manage false positives database |

### validate-audit.js Usage

```bash
# Validate a specific audit
node scripts/validate-audit.js docs/audits/single-session/security/audit-2026-01-08.jsonl

# Validate all audits
node scripts/validate-audit.js --all

# Validate 5 most recent audits
node scripts/validate-audit.js --recent 5
```

### add-false-positive.js Usage

```bash
# List all false positives
node scripts/add-false-positive.js --list

# List by category
node scripts/add-false-positive.js --list --category security

# Add new false positive (command line)
node scripts/add-false-positive.js \
  --pattern "detect-object-injection" \
  --category "security" \
  --reason "Safe iteration patterns, audited in Review #98"

# Add new false positive (interactive)
node scripts/add-false-positive.js --interactive
```

---

## Version History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| 1.1     | 2026-01-13 | Added engineering productivity audit categories      |
| 1.0     | 2026-01-08 | Initial single-session audit documentation           |
