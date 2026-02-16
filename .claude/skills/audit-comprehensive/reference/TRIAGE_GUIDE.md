<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Comprehensive Audit Triage Guide

Complete guide for triaging findings from the 9-domain comprehensive audit
system. This document covers prioritization strategies, cross-domain pattern
identification, TDMS integration, and decision frameworks.

---

## Table of Contents

- [Overview](#overview)
- [Triage Workflow](#triage-workflow)
- [Severity-Based Triage](#severity-based-triage)
- [Cross-Domain Pattern Identification](#cross-domain-pattern-identification)
- [Priority Scoring System](#priority-scoring-system)
- [TDMS Integration Steps](#tdms-integration-steps)
- [Decision Framework](#decision-framework)
- [Track Assignment](#track-assignment)
- [Roadmap Integration](#roadmap-integration)
- [Common Patterns](#common-patterns)
- [Triage Checklists](#triage-checklists)

---

## Overview

After a comprehensive audit completes, you'll have findings from 9 domains that
need to be:

1. **Prioritized** - Not all findings are equally urgent
2. **Deduplicated** - Same issue found by multiple audits
3. **Contextualized** - Understanding cross-domain impacts
4. **Tracked** - Integrated into TDMS for resolution
5. **Scheduled** - Assigned to roadmap tracks and milestones

**Key principle:** Severity alone doesn't determine priority. Consider effort,
cross-domain impact, dependencies, and business value.

---

## Triage Workflow

```
┌──────────────────────────────┐
│ 1. Review Executive Summary  │
│    - Total findings count    │
│    - Severity breakdown      │
│    - Cross-domain insights   │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│ 2. Severity-Based Batching   │
│    - S0 Critical (immediate) │
│    - S1 High (this sprint)   │
│    - S2 Medium (next sprint) │
│    - S3 Low (backlog)        │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│ 3. Cross-Domain Analysis     │
│    - Files with 4+ findings  │
│    - Security+Perf overlaps  │
│    - Doc gaps in complex code│
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│ 4. Priority Scoring          │
│    - Apply scoring formula   │
│    - Identify quick wins     │
│    - Find blocking items     │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│ 5. Interactive Review        │
│    - Present in batches      │
│    - Collect decisions       │
│    - Track ACCEPT/DEFER/DROP │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│ 6. TDMS Integration          │
│    - Append to MASTER_DEBT   │
│    - Update views            │
│    - Verify references       │
└──────────────┬───────────────┘
               │
┌──────────────┴───────────────┐
│ 7. Roadmap Assignment        │
│    - Assign to tracks        │
│    - Add to ROADMAP.md       │
│    - Set target milestones   │
└──────────────────────────────┘
```

---

## Severity-Based Triage

### S0: Critical (Immediate Action)

**Criteria:**

- Security vulnerabilities with active exploit potential
- Data loss or corruption risks
- Complete feature breakage
- Compliance violations (SOC2, GDPR, HIPAA)

**Triage process:**

1. **Immediate escalation** - Alert during Stage 1 checkpoint
2. **Block audit progression?** - User decides if critical enough to stop
3. **Create emergency fix** - Don't wait for full audit completion
4. **Track as DEBT-XXXX** - Still needs formal tracking

**Example S0 findings:**

- Hardcoded API keys in source code
- SQL injection vulnerability in user input
- Missing authentication on admin endpoints
- Unencrypted PII in logs

### S1: High (This Sprint)

**Criteria:**

- Security issues with no active exploit but high risk
- Performance problems affecting >50% of users
- Critical documentation gaps blocking new developers
- Major refactoring blockers (e.g., circular dependencies)

**Triage process:**

1. **Review after audit completes** - Don't block other audits
2. **Prioritize by impact** - Use priority scoring
3. **Schedule within 1-2 weeks** - Current or next sprint
4. **Assign to appropriate track** - Based on domain

**Example S1 findings:**

- Missing input validation on sensitive fields
- N+1 query problems in main user flows
- Outdated architecture docs (>6 months old)
- Complex functions (cyclomatic complexity >15)

### S2: Medium (Next Sprint)

**Criteria:**

- Technical debt that increases maintenance burden
- Performance issues affecting <50% of users
- Documentation that could be improved
- Moderate refactoring opportunities

**Triage process:**

1. **Batch review** - Group similar issues together
2. **Look for patterns** - Files with multiple S2 findings
3. **Schedule within 1-2 months** - Upcoming sprints
4. **Consider quick wins** - E0/E1 items for spare capacity

**Example S2 findings:**

- Missing TypeScript types in utility functions
- Slow API responses (>2s but <5s)
- Missing inline documentation for complex logic
- Duplicated code blocks (DRY violations)

### S3: Low (Backlog)

**Criteria:**

- Nice-to-have improvements
- Style and consistency issues
- Minor documentation updates
- Speculative optimizations

**Triage process:**

1. **Bulk assignment** - Don't individually review all
2. **Track for trends** - Are S3 issues accumulating?
3. **Opportunistic fixes** - Fix when touching related code
4. **Defer or drop** - Some S3s may never be worth fixing

**Example S3 findings:**

- Inconsistent variable naming
- Commented-out code blocks
- Missing newlines at EOF
- Over-optimized code (premature optimization)

---

## Cross-Domain Pattern Identification

### Hotspot Files (4+ Domain Findings)

**What to look for:** Files that appear in findings from 4 or more audit
domains.

**Why it matters:** These files likely need comprehensive refactoring, not
piecemeal fixes.

**Triage approach:**

1. **Extract hotspot list** from comprehensive report "Cross-Domain Insights"
2. **Create refactoring epic** - Group all findings for this file
3. **Assign to M2.3-REF track** - Dedicated refactoring milestone
4. **Estimate effort** - Sum of all individual fixes + refactor overhead
5. **Block piecemeal fixes** - Defer individual findings until refactor complete

**Example hotspot:**

```
auth/middleware.ts - Found in 6 audits
├── Security: Missing rate limiting (S1, E2)
├── Performance: Blocking DB call on every request (S1, E2)
├── Code Quality: Cyclomatic complexity 18 (S2, E1)
├── Refactoring: 250 line function (S2, E3)
├── Documentation: No inline comments (S2, E1)
└── Engineering Productivity: Hard to debug errors (S2, E2)

Triage Decision: Create DEBT-XXXX for comprehensive refactor (E3)
  - Break into smaller middleware functions
  - Add caching layer for DB call
  - Add rate limiting
  - Add comprehensive documentation
  - Target effort: E3 (16-32 hours)
```

### Security + Performance Overlaps

**What to look for:** Findings that appear in both security and performance
audits.

**Why it matters:** Often indicate architectural issues (e.g., inefficient auth
checks, slow crypto operations).

**Triage approach:**

1. **Identify overlap** - Same file:line or same root cause
2. **Prioritize higher** - Security + Perf = higher business impact
3. **Look for systemic patterns** - Is this repeated across codebase?
4. **Consider architectural fix** - Don't just patch symptoms

**Example overlap:**

```
Synchronous bcrypt password hashing
├── Security: Using default rounds (too low) - S1
└── Performance: Blocking event loop - S1

Triage Decision: Merge into single DEBT-XXXX
  - Upgrade to bcrypt.hashAsync
  - Increase rounds to 12
  - Add worker pool for hash operations
  - Priority score: HIGH (security + perf)
```

### Documentation Gaps + Complexity Hotspots

**What to look for:** Complex code (high cyclomatic complexity, long functions)
that also lacks documentation.

**Why it matters:** Undocumented complexity is a maintenance time bomb.

**Triage approach:**

1. **Prioritize documentation** - Quick win (E0/E1)
2. **Schedule refactoring** - Longer term (E2/E3)
3. **Block new features** - Until complexity addressed
4. **Pair programming** - For knowledge transfer

**Example gap:**

```
lib/parser/advanced.ts
├── Refactoring: 450 line function, complexity 25 (S1, E3)
└── Documentation: No docstrings, no inline comments (S2, E1)

Triage Decision: Two-phase approach
  Phase 1 (sprint 1): Add comprehensive docs (DEBT-XXXX-A, E1)
  Phase 2 (sprint 3): Refactor into smaller functions (DEBT-XXXX-B, E3)
```

---

## Priority Scoring System

### Scoring Formula

```
Priority Score = (Severity × 0.4) + (CrossDomain × 0.2) + (EffortInverse × 0.2) + (Dependency × 0.1) + (Hotspot × 0.1)
```

### Component Scores

**Severity (40% weight)**

- S0 Critical: 100 points
- S1 High: 50 points
- S2 Medium: 20 points
- S3 Low: 5 points

**CrossDomain (20% weight)**

- 1 domain: 1.0x multiplier
- 2 domains: 1.3x multiplier
- 3 domains: 1.5x multiplier
- 4+ domains: 2.0x multiplier

**EffortInverse (20% weight)** - Favor quick wins

- E0 (1-2h): 4.0x multiplier
- E1 (2-8h): 2.0x multiplier
- E2 (8-16h): 1.0x multiplier
- E3 (16-32h): 0.5x multiplier

**Dependency (10% weight)** - Blockers get boost

- Blocks 0 items: 1.0x
- Blocks 1-2 items: 1.25x
- Blocks 3+ items: 1.5x

**Hotspot (10% weight)** - Files with many findings

- <3 findings in file: 1.0x
- 3-4 findings: 1.2x
- 5+ findings: 1.5x

### Example Calculation

```
Finding: Missing auth check in admin API
  Severity: S1 (50 points)
  CrossDomain: Found in security + code quality (1.3x)
  Effort: E1 (2.0x)
  Dependency: Blocks 3 other security fixes (1.5x)
  Hotspot: File has 5 findings (1.5x)

Score = (50 × 0.4) + (1.3 × 0.2) + (2.0 × 0.2) + (1.5 × 0.1) + (1.5 × 0.1)
      = 20 + 0.26 + 0.4 + 0.15 + 0.15
      = 20.96

High priority - schedule for current sprint
```

### Automatic Prioritization

After scoring, findings are automatically ranked:

- **Score > 30**: Critical - immediate action
- **Score 20-30**: High - current sprint
- **Score 10-20**: Medium - next sprint
- **Score < 10**: Low - backlog

---

## TDMS Integration Steps

### Step 1: Prepare Findings

```bash
# Navigate to audit directory
cd docs/audits/comprehensive/audit-2026-02-16

# Review comprehensive report
cat COMPREHENSIVE_AUDIT_REPORT.md

# Check for false positives to exclude
cat ../../../technical-debt/FALSE_POSITIVES.jsonl
```

### Step 2: Generate DEBT IDs

```bash
# Get next available DEBT ID
LAST_ID=$(tail -1 docs/technical-debt/MASTER_DEBT.jsonl | jq -r .id)
NEXT_NUM=$((${LAST_ID#DEBT-} + 1))
NEXT_ID=$(printf "DEBT-%04d" $NEXT_NUM)

echo "Next ID: ${NEXT_ID}"
```

### Step 3: Convert Findings to JSONL

For each finding accepted during interactive review:

```json
{
  "id": "DEBT-0875",
  "title": "Missing rate limiting on auth endpoints",
  "category": "security",
  "severity": "S1",
  "effort": "E2",
  "status": "NEW",
  "created": "2026-02-16",
  "file": "auth/routes.ts",
  "line": 45,
  "description": "Auth endpoints lack rate limiting, vulnerable to brute force",
  "acceptance_tests": [
    "429 returned after 10 failed attempts within 1 minute",
    "Rate limit resets after timeout period",
    "Rate limit tracked per IP address"
  ],
  "source_audits": ["security", "engineering-productivity"],
  "cross_domain_count": 2,
  "priority_score": 28.5,
  "roadmap_track": "Track-S"
}
```

### Step 4: Append to MASTER_DEBT.jsonl

```bash
# Append new findings (one per line)
cat new-findings.jsonl >> docs/technical-debt/MASTER_DEBT.jsonl

# Verify format
tail -5 docs/technical-debt/MASTER_DEBT.jsonl | jq .
```

### Step 5: Update Views

```bash
# Regenerate view files
node scripts/debt/generate-views.js

# Check unplaced items
cat docs/technical-debt/views/unplaced-items.md
```

### Step 6: Verify Consistency

```bash
# Run consistency checks
node scripts/debt/sync-roadmap-refs.js --check-only

# Expected output:
# ✓ All MASTER_DEBT entries have valid IDs
# ✓ All roadmap refs exist in MASTER_DEBT
# ✓ No orphaned references found
# ✓ Status consistency verified
```

---

## Decision Framework

### ACCEPT vs DEFER vs DECLINE

**ACCEPT** - Add to TDMS and schedule

Criteria:

- Finding is accurate and actionable
- Fix aligns with project goals
- Effort is reasonable relative to impact
- No major architectural blockers

Action:

- Append to MASTER_DEBT.jsonl
- Assign to roadmap track
- Schedule for sprint/milestone

**DEFER** - Track but don't schedule yet

Criteria:

- Finding is valid but lower priority
- Depends on other work being completed first
- Waiting for architectural decisions
- Resource constraints (no capacity now)

Action:

- Append to MASTER_DEBT.jsonl with status NEW
- Add to backlog (not assigned to sprint)
- Review in next triage session

**DECLINE** - Do not track

Criteria:

- False positive (not actually an issue)
- Won't fix (by design or policy)
- Out of scope for this project
- Duplicate of existing tracked item

Action:

- Add to FALSE_POSITIVES.jsonl (if false positive)
- Document reason in REVIEW_DECISIONS.md
- Do not append to MASTER_DEBT.jsonl

### Decision Examples

```markdown
## DEBT-XXXX: Use TypeScript strict mode

Severity: S2 | Effort: E3 | Confidence: 85%

Current: tsconfig.json has "strict": false Suggested Fix: Enable strict mode,
fix ~200 type errors Acceptance Tests: npm run typecheck passes with strict:
true

Counter-argument:

- Large effort (E3) for moderate benefit (S2)
- Would block feature work for 2-3 sprints
- Types are already mostly accurate

Recommendation: DEFER

- Valid finding but wrong timing
- Schedule for post-MVP cleanup (M3)
- Track as technical debt for transparency
```

```markdown
## DEBT-YYYY: Rename confusing variable names

Severity: S3 | Effort: E1 | Confidence: 60%

Current: Variables named x, y, tmp Suggested Fix: Rename to descriptive names
Acceptance Tests: No single-letter variables in production code

Counter-argument:

- Variables are in small, obvious contexts
- Renaming might introduce bugs
- Low ROI for the effort

Recommendation: DECLINE

- This is subjective code style
- Variables are clear in context
- Would prefer linter rule if enforced
```

---

## Track Assignment

### Automatic Assignment Rules

Based on category and file patterns:

| Category                 | File Pattern                | Track    | Milestone |
| ------------------------ | --------------------------- | -------- | --------- |
| security                 | any                         | Track-S  | M1.5      |
| performance              | any                         | Track-P  | M2.1      |
| process                  | any                         | Track-D  | M2.2      |
| refactoring              | any                         | M2.3-REF | M2.3      |
| documentation            | any                         | M1.5     | M1.5      |
| engineering-productivity | any                         | Track-E  | M2.1      |
| code-quality             | scripts/, .claude/          | Track-E  | M2.1      |
| code-quality             | .github/                    | Track-D  | M2.2      |
| code-quality             | tests/                      | Track-T  | M2.1      |
| code-quality             | functions/, firebase/       | M2.2     | M2.2      |
| code-quality             | components/, lib/, app/     | M2.1     | M2.1      |
| enhancements             | any                         | M3       | M3        |
| ai-optimization          | .claude/skills/, .claude/\* | Track-E  | M2.3      |

### Manual Track Assignment

For complex or cross-cutting findings:

1. **Review dependencies** - Which other items does this block/depend on?
2. **Check milestone schedule** - When is the target track scheduled?
3. **Consider team capacity** - Is the assigned track over-allocated?
4. **Look for alternatives** - Could this fit in a different track?

Example:

```
Finding: Improve error handling across API routes
  Category: code-quality
  Files: functions/api/*.ts (13 files)
  Auto-assignment: M2.2 (Firebase Functions milestone)

Manual override: Track-D (Developer Experience track)
Reason: This is a systemic process improvement, not function-specific
Impact: Affects all future API development
```

---

## Roadmap Integration

### Adding to ROADMAP.md

**For S0/S1 Critical Items:**

```markdown
## Track-S: Security Technical Debt

### Current Sprint (2026-02-16 to 2026-03-01)

- [ ] DEBT-0875: Add rate limiting to auth endpoints (S1, E2)
- [ ] DEBT-0876: Implement App Check validation (S1, E1)
- [ ] DEBT-0877: Remove hardcoded API keys (S0, E1) **CRITICAL**
```

**For Bulk S2/S3 Items:**

```markdown
## M2.1: Core Infrastructure

### Technical Debt Cleanup

- [ ] DEBT-0869 through DEBT-0880: Code quality improvements (S2, bulk)
  - TypeScript strict mode violations
  - Missing error handling
  - Inconsistent naming conventions
```

### Cross-Referencing

Always include:

- Severity in parentheses
- Effort estimate
- Link to MASTER_DEBT.jsonl entry (for details)

```markdown
- [ ] DEBT-0875: Rate limiting (S1, E2) -
      [details](../technical-debt/MASTER_DEBT.jsonl#DEBT-0875)
```

---

## Common Patterns

### Pattern: The Security Cascade

**Symptom:** Multiple security findings that share a root cause.

**Example:**

- Missing input validation (S1)
- No rate limiting (S1)
- Verbose error messages (S2)
- No request logging (S2)

**Triage approach:**

1. **Identify root cause** - Lack of security middleware
2. **Create epic** - "Security middleware framework" (DEBT-XXXX)
3. **Link individual findings** - As child items
4. **Prioritize by severity** - S1 items first, S2 later

### Pattern: The Performance Spiral

**Symptom:** Performance issues that compound each other.

**Example:**

- N+1 queries (S1)
- Missing database indexes (S1)
- No caching layer (S2)
- Synchronous operations (S2)

**Triage approach:**

1. **Measure impact** - Profile actual performance
2. **Find bottleneck** - Which is the primary cause?
3. **Prioritize bottleneck** - Fix the 80/20 issue first
4. **Defer optimizations** - Don't prematurely optimize

### Pattern: The Documentation Debt

**Symptom:** Widespread documentation gaps across the codebase.

**Example:**

- No README in 5 directories (S2)
- Missing API docs (S1)
- Outdated architecture diagrams (S2)
- No inline comments in complex code (S2)

**Triage approach:**

1. **Prioritize by impact** - What blocks new developers most?
2. **Create templates** - Make docs easy to add
3. **Assign to M1.5** - Documentation milestone
4. **Set coverage goals** - Target 80% coverage for critical paths

---

## Triage Checklists

### Pre-Triage Checklist

- [ ] Read comprehensive audit report
- [ ] Review executive summary and cross-domain insights
- [ ] Load FALSE_POSITIVES.jsonl to identify known issues
- [ ] Check current ROADMAP.md for capacity
- [ ] Identify upcoming milestones and deadlines
- [ ] Review previous audit trends (if available)

### During Triage Checklist

- [ ] Present findings in batches (S0 first, then S1, S2, S3)
- [ ] Apply priority scoring to each finding
- [ ] Check for cross-domain patterns and hotspots
- [ ] Make ACCEPT/DEFER/DECLINE decisions
- [ ] Document decisions in REVIEW_DECISIONS.md
- [ ] Track rationale for declined findings

### Post-Triage Checklist

- [ ] Convert accepted findings to JSONL format
- [ ] Append to MASTER_DEBT.jsonl
- [ ] Generate updated views
- [ ] Run consistency checks
- [ ] Assign findings to tracks
- [ ] Update ROADMAP.md with new items
- [ ] Update AUDIT_TRACKER.md
- [ ] Reset audit triggers
- [ ] Communicate triage results to team

---

## Notes

- **Batch processing** - Don't individually review every S3 finding
- **Pattern recognition** - Look for systemic issues, not just individual bugs
- **Quick wins** - Prioritize E0/E1 items for morale and momentum
- **Blocking items** - Address dependencies before dependent items
- **Hotspot files** - Comprehensive refactor beats piecemeal fixes
- **Track capacity** - Don't overload any single track or milestone

---

**End of Triage Guide**
