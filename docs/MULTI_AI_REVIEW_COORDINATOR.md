# Multi-AI Review Coordinator

**Document Version:** 1.0
**Created:** 2026-01-01
**Last Updated:** 2026-01-01
**Document Tier:** Tier 2 (Foundation)
**Purpose:** Master index and coordination for multi-AI code review system

---

## Purpose & Scope

This document serves as the **central coordination hub** for all multi-AI review activities. It provides:

1. **Review trigger detection** - When to run each type of review
2. **Template selection** - Which template for which situation
3. **Baseline metrics** - Current project state for comparison
4. **Audit history** - Record of past reviews and outcomes
5. **Documentation system health** - Meta-review of procedures themselves

**Primary Audience:** AI Assistants performing code reviews
**Use this when:** Starting any review process, checking if review is needed

---

## Quick Reference

### Review Types and Templates

| Review Type | Template | Use When |
|-------------|----------|----------|
| Code Review | [MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](./templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md) | PRs, feature completion, tactical issues |
| Security Audit | [MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md](./templates/MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md) | Security concerns, auth changes, pre-release |
| Performance Audit | [MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md](./templates/MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md) | Slow app, bundle growth, before traffic increase |
| Refactoring Plan | [MULTI_AI_REFACTOR_PLAN_TEMPLATE.md](./templates/MULTI_AI_REFACTOR_PLAN_TEMPLATE.md) | Tech debt, architecture consolidation, vibe coding cleanup |

### Template Selection Decision Tree

```
START
  │
  ├─ Is this a security concern or auth-related change?
  │   └─ YES → Security Audit Template
  │
  ├─ Is the app slow or bundle large?
  │   └─ YES → Performance Audit Template
  │
  ├─ Is there significant tech debt or inconsistent patterns?
  │   └─ YES → Refactoring Plan Template
  │
  └─ Otherwise → Code Review Template
```

---

## Review Trigger Detection

### Automatic Trigger Checklist

Before starting any work session, check if any triggers are active:

```markdown
REVIEW TRIGGER CHECKLIST

Code Review Triggers:
[ ] PR ready for review
[ ] Feature implementation complete (not yet merged)
[ ] Major bug fix applied
[ ] Significant refactoring done

Security Audit Triggers:
[ ] Auth system modified
[ ] New API endpoints added
[ ] User data handling changed
[ ] External service integrated
[ ] Secrets or environment variables added
[ ] Permission or role system changed

Performance Audit Triggers:
[ ] App feels noticeably slower
[ ] Bundle size increased >10%
[ ] New heavy dependencies added
[ ] Large data sets being fetched
[ ] Users reporting slow pages
[ ] Before expected traffic increase

Refactoring Triggers:
[ ] Multiple AIs have worked on codebase ("vibe coding")
[ ] Same pattern implemented differently in 3+ places
[ ] Adding new feature requires touching many files
[ ] Test failures from pattern inconsistency
[ ] Architecture boundaries unclear
```

### Progress-Based Triggers

These triggers fire based on work volume, not calendar time:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Session Count | Every 10 AI sessions | Review documentation system health |
| Commit Volume | Every 50 commits | Consider lightweight code review |
| Files Modified | 25+ docs in scope | Consider documentation review |
| New Dependencies | 5+ new packages | Consider security + performance review |

### Trigger Detection Script

Run this script to check for triggers:

```bash
#!/bin/bash
# scripts/check-review-triggers.sh

echo "=== Multi-AI Review Trigger Check ==="
echo ""

# Code changes since last review
COMMITS_SINCE=$(git rev-list --count HEAD ^$(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~50))
echo "Commits since last tag: $COMMITS_SINCE"

# Bundle size check (if available)
if [ -f ".next/BUILD_ID" ]; then
  BUNDLE_SIZE=$(du -sh .next/static/chunks 2>/dev/null | cut -f1)
  echo "Bundle size (chunks): $BUNDLE_SIZE"
fi

# Security-sensitive file changes
echo ""
echo "Security-sensitive changes (last 10 commits):"
git diff --name-only HEAD~10 | grep -E "(auth|security|firebase|api|secrets|env)" | head -5

# Pattern duplication check
echo ""
echo "Potential duplication (Firebase patterns):"
grep -rn "collection(db" --include="*.ts" 2>/dev/null | wc -l | xargs echo "  collection(db occurrences:"
grep -rn "onSnapshot" --include="*.ts" 2>/dev/null | wc -l | xargs echo "  onSnapshot occurrences:"

echo ""
echo "=== Check triggers against thresholds above ==="
```

---

## Baseline Metrics

### Current Project Baseline

**Last Updated:** 2026-01-01

```yaml
# Repository Stats
total_files: [Run: find . -type f -name "*.ts" -o -name "*.tsx" | wc -l]
total_lines: [Run: find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec cat {} + | wc -l]
test_count: 91
test_pass_rate: 97.8%

# Bundle (Production Build)
total_bundle_kb: [Run: npm run build, check output]
largest_chunk_kb: [Fill after build]

# Security Posture
rate_limiting: IMPLEMENTED
input_validation: IMPLEMENTED
app_check: IMPLEMENTED
firestore_rules: IMPLEMENTED

# Code Quality
lint_errors: [Run: npm run lint 2>&1 | grep -c "error"]
lint_warnings: [Run: npm run lint 2>&1 | grep -c "warning"]
typescript_strict: true

# Dependencies
direct_deps: [Run: npm ls --depth=0 | wc -l]
dev_deps: [Run: npm ls --dev --depth=0 | wc -l]
known_vulnerabilities: [Run: npm audit --json | jq '.metadata.vulnerabilities']
```

### Baseline Update Process

Update baselines after major reviews or milestones:

1. Run measurement commands above
2. Update values in this section
3. Update "Last Updated" date
4. Commit: `git commit -m "docs: Update baseline metrics in coordinator"`

---

## Active Review Status

### Currently Active Reviews

| Review ID | Type | Started | Status | Template Instance |
|-----------|------|---------|--------|-------------------|
| *None currently active* | | | | |

### Review Queue

| Priority | Review Type | Trigger | Requested By | Notes |
|----------|-------------|---------|--------------|-------|
| *No pending reviews* | | | | |

---

## Audit History

### Completed Reviews

| Date | Review ID | Type | Models Used | Findings | Key Outcomes |
|------|-----------|------|-------------|----------|--------------|
| 2026-01-01 | — | Documentation Setup | — | — | Multi-AI review system established |

### Review Outcome Tracking

Track effectiveness of reviews over time:

| Review ID | Findings | Addressed | Deferred | False Positives | Time Saved |
|-----------|----------|-----------|----------|-----------------|------------|
| *Add entries after reviews* | | | | | |

---

## Documentation System Health

### Purpose

This section tracks the health and effectiveness of the documentation system itself - a meta-review to ensure procedures are being followed and are worth the effort.

### Compliance Log

Track procedure adherence in each session:

| Date | Session | Security Read? | Workflow Followed? | Docs Updated? | Exceptions? |
|------|---------|----------------|-------------------|---------------|-------------|
| 2026-01-01 | Initial setup | ✅ | ✅ | ✅ | None |

**Compliance Rate:** 100% (1/1 sessions)

### Health Triggers (Non-Time-Based)

Documentation system health review is triggered when ANY of these occur:

| Trigger | Threshold | Current | Status |
|---------|-----------|---------|--------|
| Session Count | Every 10 sessions | 1 | ⏳ Pending |
| Exception Used | Any exception invoked | 0 | ✅ Clear |
| Compliance Rate | Drops below 80% | 100% | ✅ Healthy |
| New Mandatory Procedure | Any added to AI_WORKFLOW.md | 1 (security read) | 📋 Review at next trigger |

### Health Review Template

When a health trigger fires, answer these questions:

```markdown
## Documentation System Health Review

**Trigger:** [What triggered this review]
**Date:** YYYY-MM-DD
**Sessions Since Last Review:** X

### Compliance Assessment

1. **Are procedures being followed?**
   - Compliance rate: X%
   - Common skips: [list]
   - Reasons for skips: [list]

2. **Are procedures effective?**
   - Did following procedures prevent issues? Y/N, examples:
   - Did procedures catch problems early? Y/N, examples:
   - Were any procedures unnecessary? Y/N, which:

3. **Is the burden appropriate?**
   - Average startup time: X minutes
   - Procedures that slow work: [list]
   - Procedures that could be automated: [list]

4. **Recommendations:**
   - Procedures to keep: [list]
   - Procedures to modify: [list]
   - Procedures to remove: [list]
   - Procedures to add: [list]

### Actions Taken

- [ ] Updated AI_WORKFLOW.md with changes
- [ ] Updated this coordinator with findings
- [ ] Reset session counter
```

### Burden Assessment

Track if documentation overhead is worthwhile:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Session startup time | < 10 min | 5-10 min | ✅ On target |
| Procedures skipped | < 20% | 0% | ✅ Healthy |
| False positive triggers | < 10% | N/A | ⏳ Insufficient data |
| Issues prevented | Track over time | N/A | ⏳ Insufficient data |

---

## AI Instructions

### At Session Start

1. Check if any review triggers are active (see checklist above)
2. If triggers active, note in session plan
3. Check compliance log - add entry at session end

### When Starting a Review

1. Select appropriate template using decision tree
2. Copy template to `docs/reviews/[TYPE]_[YYYY-MM-DD].md`
3. Add entry to "Currently Active Reviews" table above
4. Follow template instructions

### When Completing a Review

1. Move from "Active" to "Completed" in Audit History
2. Add outcome metrics to tracking table
3. Update baseline metrics if significant changes
4. Update MULTI_AI_REVIEW_COORDINATOR.md

### When Health Trigger Fires

1. Note which trigger fired
2. Complete Health Review Template
3. Update compliance log
4. Implement recommendations
5. Reset relevant counters

---

## Session Counter

**Current Session Count:** 1

Increment this counter at the start of each AI work session:

| Session # | Date | AI Model | Notes |
|-----------|------|----------|-------|
| 1 | 2026-01-01 | Claude (Opus 4.5) | Initial documentation setup |

**Next Health Review:** At session 10

---

## Related Documents

- **[AI_WORKFLOW.md](../AI_WORKFLOW.md)** - Master workflow guide (references this coordinator)
- **[GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md)** - Mandatory security standards
- **[DOCUMENTATION_STANDARDS.md](../DOCUMENTATION_STANDARDS.md)** - Document formatting standards
- **Templates:**
  - [MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md](./templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md)
  - [MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md](./templates/MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md)
  - [MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md](./templates/MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md)
  - [MULTI_AI_REFACTOR_PLAN_TEMPLATE.md](./templates/MULTI_AI_REFACTOR_PLAN_TEMPLATE.md)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-01 | Initial coordinator creation with non-time-based triggers | Claude |

---

**END OF MULTI_AI_REVIEW_COORDINATOR.md**
