# Single-Session Audit Results

**Created:** 2026-01-08
**Purpose:** Store results from single-session (single-AI) audits

---

## Overview

This folder contains audit results from `/audit-*` slash commands. These are lightweight, single-session audits performed by Claude Code, designed to provide interim visibility between larger multi-AI audits.

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

| Command | Description | Focus Areas |
|---------|-------------|-------------|
| `/audit-code` | Code review audit | Hygiene, Types, Framework, Testing, Security |
| `/audit-security` | Security audit | Auth, Input Validation, Data, Firebase, Deps, OWASP |
| `/audit-performance` | Performance audit | Bundle, Rendering, Data Fetch, Memory, Web Vitals |
| `/audit-refactoring` | Refactoring audit | God Objects, Duplication, Complexity, Architecture, Tech Debt |
| `/audit-documentation` | Documentation audit | Links, Stale Content, Coverage, Tier, Frontmatter, Sync |
| `/audit-process` | Process/Automation audit | CI/CD, Git Hooks, Claude Hooks, Scripts, Triggers |

## Output Format

Each audit produces two files:
1. **Markdown Report**: `audit-YYYY-MM-DD.md` - Human-readable summary
2. **JSONL Findings**: `audit-YYYY-MM-DD.jsonl` - Machine-parseable findings

### JSONL Schema

```json
{
  "id": "XXX-001",
  "category": "Category name",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "file": "path/to/file.ts",
  "line": 123,
  "title": "Short description",
  "description": "Detailed issue",
  "recommendation": "How to fix",
  "evidence": ["code snippets or grep output"]
}
```

## Severity Scale

| Level | Meaning | Action |
|-------|---------|--------|
| S0 | Critical | Immediate fix required |
| S1 | High | Fix before next release |
| S2 | Medium | Fix when convenient |
| S3 | Low | Nice to have |

## Effort Scale

| Level | Meaning | Time Estimate |
|-------|---------|---------------|
| E0 | Trivial | Minutes |
| E1 | Small | Hours |
| E2 | Medium | Day(s) |
| E3 | Large | Week+ |

## Relationship to Multi-AI Audits

Single-session audits are **complementary** to multi-AI audits:

| Aspect | Single-Session | Multi-AI |
|--------|----------------|----------|
| Models | 1 (Claude Code) | 3-6 (various) |
| Consensus | No | Yes |
| Threshold Reset | No | Yes |
| Frequency | On-demand | Threshold-triggered |
| Output Location | `docs/audits/single-session/` | `docs/reviews/YYYY-QX/` |
| Logged in | `docs/AUDIT_TRACKER.md` | `AI_REVIEW_LEARNINGS_LOG.md` |

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
