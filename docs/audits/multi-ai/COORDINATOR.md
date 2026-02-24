# Multi-AI Review Coordinator

**Document Version:** 1.9 **Created:** 2026-01-01 **Last Updated:** 2026-02-23
**Document Tier:** Tier 2 (Foundation) **Purpose:** Master index and
coordination for multi-AI code review system

---

## Purpose & Scope

This document serves as the **central coordination hub** for all multi-AI review
activities. It provides:

1. **Review trigger detection** - When to run each type of review
2. **Template selection** - Which template for which situation
3. **Baseline metrics** - Current project state for comparison
4. **Audit history** - Record of past reviews and outcomes
5. **Documentation system health** - Meta-review of procedures themselves

**Primary Audience:** AI Assistants performing code reviews **Use this when:**
Starting any review process, checking if review is needed

---

## Quick Start

1. Select AI models for review
2. Execute parallel reviews
3. Aggregate findings using template

---

## Quick Reference

### Review Types and Templates

| Review Type                    | Template                                                                           | Use When                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Code Review                    | [CODE_REVIEW_AUDIT.md](./templates/CODE_REVIEW_AUDIT.md)                           | PRs, feature completion, tactical issues                                              |
| Security Audit                 | [SECURITY_AUDIT.md](./templates/SECURITY_AUDIT.md)                                 | Security concerns, auth changes, pre-release, dependency vulnerabilities              |
| Performance Audit              | [PERFORMANCE_AUDIT.md](./templates/PERFORMANCE_AUDIT.md)                           | Slow app, bundle growth, before traffic increase                                      |
| Refactoring Plan               | [REFACTORING_AUDIT.md](./templates/REFACTORING_AUDIT.md)                           | Tech debt, architecture consolidation, vibe coding cleanup, SonarCloud CRITICAL items |
| Documentation Audit            | [DOCUMENTATION_AUDIT.md](./templates/DOCUMENTATION_AUDIT.md)                       | Broken links, stale docs, coverage gaps, quarterly doc health check                   |
| Process Audit                  | [PROCESS_AUDIT.md](./templates/PROCESS_AUDIT.md)                                   | CI/CD reliability, hook effectiveness, automation health, quarterly process review    |
| Engineering Productivity Audit | [ENGINEERING_PRODUCTIVITY_AUDIT.md](./templates/ENGINEERING_PRODUCTIVITY_AUDIT.md) | DX friction, debugging difficulties, offline gaps, build/CI slowness, test issues     |
| Enhancement Audit              | [ENHANCEMENT_AUDIT.md](./templates/ENHANCEMENT_AUDIT.md)                           | Feature gaps, UX improvements, roadmap opportunities                                  |
| AI Optimization Audit          | [AI_OPTIMIZATION_AUDIT.md](./templates/AI_OPTIMIZATION_AUDIT.md)                   | Token waste, skill overlap, hook latency, AI workflow friction                        |

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
  ├─ Is there DX friction, debugging difficulty, or offline issues?
  │   └─ YES → Engineering Productivity Audit Template
  │
  ├─ Are there documentation or link problems?
  │   └─ YES → Documentation Audit Template
  │
  ├─ Are there CI/CD, hooks, or automation issues?
  │   └─ YES → Process Audit Template
  │
  ├─ Are there feature gaps or UX improvements needed?
  │   └─ YES → Enhancement Audit Template
  │
  ├─ Is there AI workflow friction, token waste, or skill overlap?
  │   └─ YES → AI Optimization Audit Template
  │
  └─ Otherwise → Code Review Template
```

---

## TDMS Integration

All multi-AI audit findings are tracked through the Technical Debt Management
System (TDMS). After completing any audit, findings must be ingested into TDMS.

### Post-Audit Workflow

1. **Complete audit** using appropriate template
2. **Aggregate findings** to produce final JSONL
3. **Ingest to TDMS:**

```bash
node scripts/debt/intake-audit.js \
  <findings-file>.jsonl \
  --source "multi-ai-<audit-type>" \
  --batch-id "<audit-type>-YYYYMMDD"
```

4. **Verify intake** - Check `docs/technical-debt/INDEX.md` for new items
5. **Update Audit History** table with TDMS Items count

### TDMS Resources

| Resource                                                              | Purpose                             |
| --------------------------------------------------------------------- | ----------------------------------- |
| [docs/technical-debt/PROCEDURE.md](../../technical-debt/PROCEDURE.md) | Full intake/verification procedures |
| [docs/technical-debt/INDEX.md](../../technical-debt/INDEX.md)         | View all tracked technical debt     |
| [docs/technical-debt/views/](../../technical-debt/views/)             | Filtered views by severity/category |
| `scripts/debt/intake-audit.js`                                        | Audit intake script                 |
| `scripts/debt/generate-views.js`                                      | Regenerate MD views                 |

### Category Mapping

See
[PROCEDURE.md Section 11](../../technical-debt/PROCEDURE.md#11-category-field-normalization)
for complete mapping tables from audit categories to TDMS categories.

---

## Review Trigger Detection

### Automatic Trigger Checklist

Before starting any work session, check if any triggers are active:

```markdown
REVIEW TRIGGER CHECKLIST

Code Review Triggers: [ ] PR ready for review [ ] Feature implementation
complete (not yet merged) [ ] Major bug fix applied [ ] Significant refactoring
done

Security Audit Triggers: [ ] Auth system modified [ ] New API endpoints added [
] User data handling changed [ ] External service integrated [ ] Secrets or
environment variables added [ ] Permission or role system changed

Performance Audit Triggers: [ ] App feels noticeably slower [ ] Bundle size
increased >10% [ ] New heavy dependencies added [ ] Large data sets being
fetched [ ] Users reporting slow pages [ ] Before expected traffic increase

Refactoring Triggers: [ ] Multiple AIs have worked on codebase ("vibe coding") [
] Same pattern implemented differently in 3+ places [ ] Adding new feature
requires touching many files [ ] Test failures from pattern inconsistency [ ]
Architecture boundaries unclear
```

### Progress-Based Triggers

These triggers fire based on work volume, not calendar time:

| Trigger          | Threshold            | Action                                 |
| ---------------- | -------------------- | -------------------------------------- |
| Session Count    | Every 10 AI sessions | Review documentation system health     |
| Commit Volume    | Every 50 commits     | Consider lightweight code review       |
| Files Modified   | 25+ docs in scope    | Consider documentation review          |
| New Dependencies | 5+ new packages      | Consider security + performance review |

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

**Last Updated:** 2026-02-23

> **Note:** These baselines are from 2026-01-10 and are now stale. They will be
> updated on the next multi-AI audit run (scheduled when 100+ commits or 14+
> days threshold is reached).

```yaml
# Repository Stats
total_files: [Run: find . -type f -name "*.ts" -o -name "*.tsx" | wc -l]
total_lines: [Run: find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec cat {} + | wc -l]
test_count: 116
test_pass_rate: 99.1% (115/116 passing, 1 skipped)

# Bundle (Production Build)
total_bundle_kb: [Run: npm run build, check output]
largest_chunk_kb: [Fill after build]

# Security Posture
rate_limiting: IMPLEMENTED
input_validation: IMPLEMENTED
app_check: DISABLED
app_check_risk: "MEDIUM - Bot protection disabled; mitigated by rate limiting and Firestore rules"
app_check_release_gate: "P1 - Must be resolved before public launch"
app_check_owner: "Security Team"
app_check_target_date: "TBD - Dependent on Firebase 403 throttle resolution"
app_check_remediation: "See docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md CANON-0002 for re-enablement plan"
firestore_rules: IMPLEMENTED

# Code Quality
lint_errors: 0
lint_warnings: 224
lint_warnings_baseline_date: 2026-01-10
lint_warnings_note: "Increased from 181 (2026-01-04) by +43 warnings; all security/detect-non-literal-fs-filename (false positives)"
lint_warnings_policy: "Treat any increase as regression; long-term goal: <20 after remediation"
typescript_strict: true
pattern_violations: 0
pattern_violations_command: "npm run patterns:check"

# Dependencies
circular_dependencies: 0 (npm run deps:circular)
unused_exports: baseline documented in DEVELOPMENT.md (npm run deps:unused)
direct_deps: [Run: npm ls --depth=0 | wc -l]
dev_deps: [Run: npm ls --dev --depth=0 | wc -l]
known_vulnerabilities: [Run: npm audit --json | jq '.metadata.vulnerabilities']

# Static Analysis (SonarQube)
sonarqube_scan_date: "2026-01-11"
sonarqube_total_issues: 941
sonarqube_delta_from_jan5: "+163 (new audit scripts added)"
sonarqube_blocker: 1
sonarqube_blocker_note: "GitHub token in mcp.json (gitignored file, false positive)"
sonarqube_critical: 61
sonarqube_critical_note: "Cognitive complexity violations (>15 threshold)"
sonarqube_critical_risk: "LOW - Maintainability concern; not a runtime security issue"
sonarqube_critical_release_gate: "P2 - Should be addressed but not blocking launch"
sonarqube_critical_owner: "Engineering Team"
sonarqube_critical_remediation: "See docs/analysis/sonarqube-manifest.md for prioritized list (file was archived)"
sonarqube_major: 246
sonarqube_minor: 625
sonarqube_info: 8
batch_fix_opportunities:
  - eslint_auto_fixable: ~150+
  - replaceAll_replacements: ~100
  - node_prefix_imports: ~70
  - array_at_negative_index: ~84
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

| Review ID               | Type | Started | Status | Template Instance |
| ----------------------- | ---- | ------- | ------ | ----------------- |
| _None currently active_ |      |         |        |                   |

### Review Queue

| Priority             | Review Type | Trigger | Requested By | Notes |
| -------------------- | ----------- | ------- | ------------ | ----- |
| _No pending reviews_ |             |         |              |       |

---

## Audit History

### Completed Reviews

| Date       | Review ID | Type                | Models Used | Findings | Key Outcomes                       |
| ---------- | --------- | ------------------- | ----------- | -------- | ---------------------------------- |
| 2026-01-01 | —         | Documentation Setup | —           | —        | Multi-AI review system established |

### Review Outcome Tracking

Track effectiveness of reviews over time:

| Review ID                   | Findings | Addressed | Deferred | False Positives | Time Saved |
| --------------------------- | -------- | --------- | -------- | --------------- | ---------- |
| _Add entries after reviews_ |          |           |          |                 |            |

---

## Project Health Dashboard

### Purpose

This section tracks the health and effectiveness of ALL project systems - not
just documentation, but security, code quality, performance, and architecture.
This is the master health monitoring view.

---

### 1. Security Standards Compliance

**Standard:** [GLOBAL_SECURITY_STANDARDS.md](../../GLOBAL_SECURITY_STANDARDS.md)

| Standard           | Requirement               | Current Status | Last Verified |
| ------------------ | ------------------------- | -------------- | ------------- |
| Rate Limiting      | All endpoints have limits | ✅ IMPLEMENTED | 2026-01-01    |
| Input Validation   | All inputs validated      | ✅ IMPLEMENTED | 2026-01-01    |
| Secrets Management | No hardcoded keys         | ✅ COMPLIANT   | 2026-01-01    |
| OWASP Compliance   | Top 10 addressed          | ✅ COMPLIANT   | 2026-01-01    |

**Verification Commands:**

```bash
# Rate limiting check
grep -rn "RateLimiter\|rateLimit" --include="*.ts" | wc -l

# Input validation check
grep -rn "validateInput\|z\.object\|z\.string" --include="*.ts" | wc -l

# Secrets check (should find NONE)
grep -rn "apiKey.*=.*['\"]" --include="*.ts" --include="*.tsx" | grep -v ".env"
```

**Triggers for Security Review:**

- [ ] Any of the 4 standards becomes non-compliant
- [ ] New external service integrated
- [ ] Auth system modified
- [ ] 5+ new Cloud Functions added

---

### 2. Code Quality Health

| Metric            | Target | Current             | Status     | Last Checked |
| ----------------- | ------ | ------------------- | ---------- | ------------ |
| Test Pass Rate    | ≥95%   | 99.1%               | ✅ Healthy | 2026-01-05   |
| Test Coverage     | ≥80%   | [Run test:coverage] | ⏳ Check   | —            |
| Lint Errors       | 0      | [Run npm run lint]  | ⏳ Check   | —            |
| Lint Warnings     | <20    | [Run npm run lint]  | ⏳ Check   | —            |
| TypeScript Strict | true   | ✅ Enabled          | ✅ Healthy | 2026-01-01   |

**Verification Commands:**

```bash
# Test health
npm test 2>&1 | tail -5

# Coverage
npm run test:coverage 2>&1 | grep "All files"

# Lint
npm run lint 2>&1 | tail -10
```

**Triggers for Code Quality Review:**

- [ ] Test pass rate drops below 95%
- [ ] Coverage drops below 80%
- [ ] Lint errors > 0
- [ ] Lint warnings increase by 20+

---

### 3. Performance Health

| Metric            | Target       | Current     | Status   | Last Checked |
| ----------------- | ------------ | ----------- | -------- | ------------ |
| Bundle Size (JS)  | <500 KB gzip | [Run build] | ⏳ Check | —            |
| Largest Chunk     | <200 KB      | [Run build] | ⏳ Check | —            |
| Build Time (dev)  | <30s         | [Time it]   | ⏳ Check | —            |
| Build Time (prod) | <120s        | [Time it]   | ⏳ Check | —            |

**Verification Commands:**

```bash
# Bundle size after build
npm run build 2>&1 | grep -E "First Load|Route"

# Build time
time npm run build

# Chunk analysis
du -sh .next/static/chunks/*.js | sort -h | tail -5
```

**Triggers for Performance Review:**

- [ ] Bundle size increases >10%
- [ ] Build time increases >30%
- [ ] Users report slow pages
- [ ] New heavy dependencies added

---

### 4. Architecture Health

| Aspect                | Target                    | Current         | Status   | Last Checked |
| --------------------- | ------------------------- | --------------- | -------- | ------------ |
| Pattern Consistency   | Single canonical patterns | [Review needed] | ⏳ Check | —            |
| Component Boundaries  | Clear server/client split | [Review needed] | ⏳ Check | —            |
| Service Consolidation | No duplicate services     | [Review needed] | ⏳ Check | —            |
| Hook Organization     | Consistent hook patterns  | [Review needed] | ⏳ Check | —            |

**Verification Commands:**

```bash
# Firebase access patterns (should be consolidated)
grep -rn "collection(db" --include="*.ts" | wc -l

# Hook patterns
grep -rn "^export function use" --include="*.ts" --include="*.tsx" | wc -l

# "use client" directives
grep -rn "\"use client\"" --include="*.tsx" | wc -l
```

**Triggers for Architecture Review:**

- [ ] Multiple AIs have worked on codebase
- [ ] Same pattern in 3+ places
- [ ] Adding feature requires touching 10+ files
- [ ] Circular dependency detected

---

### 5. Documentation Compliance

| Procedure         | Requirement                                        | Compliance Rate    | Status     |
| ----------------- | -------------------------------------------------- | ------------------ | ---------- |
| Security Read     | Read GLOBAL_SECURITY_STANDARDS.md at session start | 100%               | ✅ Healthy |
| Workflow Follow   | Follow AI_WORKFLOW.md procedures                   | 100%               | ✅ Healthy |
| Doc Updates       | Update docs after significant changes              | 100%               | ✅ Healthy |
| Exception Process | Document any exceptions                            | N/A (0 exceptions) | ✅ Healthy |

---

### 6. Engineering Productivity

| Metric               | Target          | Current                       | Status        | Last Checked |
| -------------------- | --------------- | ----------------------------- | ------------- | ------------ |
| Build Time (dev)     | <30s            | [Run: time npm run dev]       | ⏳ Check      | —            |
| Test Run Time        | <60s            | [Run: time npm test]          | ⏳ Check      | —            |
| CI Pipeline Duration | <5 min          | [Check GitHub Actions]        | ⏳ Check      | —            |
| Offline Capability   | Core flows      | Partial (auth blocks offline) | 🟡 Needs Work | 2026-02-04   |
| Debug Tooling        | Correlation IDs | [Check error logs]            | ⏳ Check      | —            |

**Verification Commands:**

```bash
# Dev server startup time
time npm run dev & sleep 30; pkill -f "next dev"

# Test execution time
time npm test

# Check for debug utilities
grep -rn "correlationId\|requestId" --include="*.ts" | wc -l
```

**Triggers for Engineering Productivity Review:**

- [ ] Build time increases >50%
- [ ] Test run time exceeds 2 minutes
- [ ] CI pipeline exceeds 10 minutes
- [ ] Developer reports friction debugging
- [ ] Offline workflow gaps reported

**Compliance Log:**

| Date       | Session       | Security Read? | Workflow? | Docs Updated? | Exceptions? |
| ---------- | ------------- | -------------- | --------- | ------------- | ----------- |
| 2026-01-01 | Initial setup | ✅             | ✅        | ✅            | None        |

**Overall Compliance Rate:** 100% (1/1 sessions)

---

### Health Triggers (Non-Time-Based)

Project health review is triggered when ANY of these occur:

| Trigger                  | Threshold             | Current | Status     |
| ------------------------ | --------------------- | ------- | ---------- |
| Session Count            | Every 10 sessions     | 1       | ⏳ Pending |
| Security Non-Compliance  | Any standard fails    | 0       | ✅ Clear   |
| Test Pass Rate           | Drops below 95%       | 99.1%   | ✅ Healthy |
| Exception Used           | Any exception invoked | 0       | ✅ Clear   |
| Documentation Compliance | Drops below 80%       | 100%    | ✅ Healthy |
| Performance Regression   | Any metric >20% worse | 0       | ✅ Clear   |

---

### Health Review Template

When any health trigger fires, complete this review:

```markdown
## Project Health Review

**Trigger:** [What triggered this review] **Date:** YYYY-MM-DD **Sessions Since
Last Review:** X

### 1. Security Standards Assessment

- Rate Limiting: PASS/FAIL
- Input Validation: PASS/FAIL
- Secrets Management: PASS/FAIL
- OWASP Compliance: PASS/FAIL
- Issues found: [list]

### 2. Code Quality Assessment

- Test pass rate: X%
- Test coverage: X%
- Lint errors: X
- Lint warnings: X
- Issues found: [list]

### 3. Performance Assessment

- Bundle size: X KB (target: <500 KB)
- Build time: Xs (target: <120s)
- Regressions: [list any]
- Issues found: [list]

### 4. Architecture Assessment

- Pattern consistency: GOOD/NEEDS_ATTENTION
- Duplication clusters found: X
- Boundary violations: X
- Issues found: [list]

### 5. Documentation Compliance Assessment

- Procedure compliance rate: X%
- Exceptions used: X
- Burden assessment: ACCEPTABLE/TOO_HIGH
- Issues found: [list]

### 6. Engineering Productivity Assessment

- Build time: Xs (target: <30s)
- Test run time: Xs (target: <60s)
- CI pipeline: Xm (target: <5m)
- Offline capability: GOOD/NEEDS_ATTENTION
- Debug tooling: GOOD/NEEDS_ATTENTION
- Issues found: [list]

### Overall Health Score

| Area                     | Score | Status   |
| ------------------------ | ----- | -------- |
| Security                 | X/100 | 🟢/🟡/🔴 |
| Code Quality             | X/100 | 🟢/🟡/🔴 |
| Performance              | X/100 | 🟢/🟡/🔴 |
| Architecture             | X/100 | 🟢/🟡/🔴 |
| Documentation            | X/100 | 🟢/🟡/🔴 |
| Engineering Productivity | X/100 | 🟢/🟡/🔴 |
| **OVERALL**              | X/100 | 🟢/🟡/🔴 |

### Actions Required

- [ ] [Action 1]
- [ ] [Action 2]
- [ ] Update this coordinator
- [ ] Reset session counter if applicable
```

### Burden Assessment

Track if overhead is worthwhile:

| Metric                  | Target          | Current  | Status               |
| ----------------------- | --------------- | -------- | -------------------- |
| Session startup time    | < 10 min        | 5-10 min | ✅ On target         |
| Procedures skipped      | < 20%           | 0%       | ✅ Healthy           |
| False positive triggers | < 10%           | N/A      | ⏳ Insufficient data |
| Issues prevented        | Track over time | N/A      | ⏳ Insufficient data |

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
4. Update this coordinator file (COORDINATOR.md)

### When Health Trigger Fires

1. Note which trigger fired
2. Complete Health Review Template
3. Update compliance log
4. Implement recommendations
5. Reset relevant counters

---

## Automation & Scripts

### Audit-Related Commands

| Command                                    | Purpose                                |
| ------------------------------------------ | -------------------------------------- |
| `npm run aggregate:audit-findings`         | Run 2-tier aggregation on raw findings |
| `npm run tdms:views`                       | Regenerate TDMS dashboard views        |
| `node scripts/debt/intake-audit.js <file>` | Ingest audit findings into TDMS        |
| `node scripts/debt/validate-schema.js`     | Validate JSONL files against schema    |
| `npm run review:check`                     | Check if any audit triggers are active |

### TDMS Integration

After completing any multi-AI audit:

1. **Aggregate** raw findings:

   ```bash
   npm run aggregate:audit-findings
   ```

2. **Ingest** to TDMS:

   ```bash
   node scripts/debt/intake-audit.js <findings>.jsonl \
     --source "multi-ai-<type>" \
     --batch-id "<type>-YYYYMMDD"
   ```

3. **Regenerate** views:

   ```bash
   npm run tdms:views
   ```

4. **Verify** at [docs/technical-debt/views/](../../technical-debt/views/)

---

## Scope Clarification

> **NOTE**: This document is for **repo-wide multi-AI code reviews**
> (comprehensive audits involving multiple AI models).
>
> **Session tracking** has been moved to
> [SESSION_CONTEXT.md](../../../SESSION_CONTEXT.md) where it belongs.
>
> **PR/commit reviews** are tracked in
> [AI_REVIEW_LEARNINGS_LOG.md](../../AI_REVIEW_LEARNINGS_LOG.md).

This coordinator should be used when:

- Planning a full-repo security audit
- Coordinating multi-AI refactoring effort
- Running comprehensive performance review
- Architecture consolidation review

It should NOT be used for:

- Daily session tracking (use SESSION_CONTEXT.md)
- Individual PR reviews (use AI_REVIEW_PROCESS.md)
- Commit-level code review (use CodeRabbit/Qodo)

---

## Related Documents

- **[AI_WORKFLOW.md](../../../AI_WORKFLOW.md)** - Master workflow guide
  (references this coordinator)
- **[docs/technical-debt/PROCEDURE.md](../../technical-debt/PROCEDURE.md)** -
  TDMS intake and tracking procedures
- **[docs/technical-debt/views/](../../technical-debt/views/)** - TDMS dashboard
  views (by-severity, by-category, by-status, verification-queue)
- **[GLOBAL_SECURITY_STANDARDS.md](../../GLOBAL_SECURITY_STANDARDS.md)** -
  Mandatory security standards
- **[DOCUMENTATION_STANDARDS.md](../../DOCUMENTATION_STANDARDS.md)** - Document
  formatting standards
- **Audit Templates:**
  - [CODE_REVIEW_AUDIT.md](./templates/CODE_REVIEW_AUDIT.md)
  - [SECURITY_AUDIT.md](./templates/SECURITY_AUDIT.md)
  - [PERFORMANCE_AUDIT.md](./templates/PERFORMANCE_AUDIT.md)
  - [REFACTORING_AUDIT.md](./templates/REFACTORING_AUDIT.md)
  - [DOCUMENTATION_AUDIT.md](./templates/DOCUMENTATION_AUDIT.md)
  - [PROCESS_AUDIT.md](./templates/PROCESS_AUDIT.md)
  - [ENGINEERING_PRODUCTIVITY_AUDIT.md](./templates/ENGINEERING_PRODUCTIVITY_AUDIT.md)
- **Aggregation:**
  - [AGGREGATOR.md](./templates/AGGREGATOR.md) - 2-tier aggregation
    (per-category → cross-category)
- **Navigation:**
  - [README.md](./README.md) - Multi-AI audit system overview

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                                                   | Author |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.9     | 2026-02-04 | **Directory Consolidation**: Moved from docs/MULTI_AI_REVIEW_COORDINATOR.md to docs/audits/multi-ai/COORDINATOR.md; Added Engineering Productivity to Health Dashboard (6th area); Added Automation & Scripts section; Added TDMS views links; Updated all internal paths | Claude |
| 1.8     | 2026-02-04 | Added Engineering Productivity Audit as 7th review type with template link; Updated decision tree to include DX, debugging, offline, docs, and process branches                                                                                                           | Claude |
| 1.7     | 2026-02-01 | **TDMS Integration (Phase 9b)**: Added TDMS Integration section with post-audit workflow, resources table, and category mapping reference. Added PROCEDURE.md to Related Documents.                                                                                       | Claude |
| 1.6     | 2026-01-11 | Updated SonarQube baseline (778→941 issues, 47→61 CRITICAL); delta due to new audit scripts; updated batch fix estimates                                                                                                                                                  | Claude |
| 1.5     | 2026-01-10 | Updated baseline metrics (lint warnings 181→224, baseline date to 2026-01-10); added note about +43 false positive warnings                                                                                                                                               | Claude |
| 1.4     | 2026-01-06 | Review #68: Added structured remediation fields (risk, release_gate, owner, target_date) for App Check and SonarQube CRITICAL; Fixed EIGHT_PHASE path to archive location; Fixed stale test pass rate                                                                     | Claude |
| 1.3     | 2026-01-06 | Review #67: Added remediation tracking for App Check and SonarQube CRITICAL; Improved YAML parseability                                                                                                                                                                   | Claude |
| 1.2b    | 2026-01-05 | Added SonarQube baseline (778 issues, 47 CRITICAL); Added Documentation Audit and Process Audit templates; Referenced 2-tier Aggregator                                                                                                                                   | Claude |
| 1.2a    | 2026-01-05 | Updated baselines (116 tests, 0 lint errors, 181 warnings); Added App Check status (DISABLED); Added pattern/dependency health metrics                                                                                                                                    | Claude |
| 1.1     | 2026-01-02 | Clarified scope: repo-wide reviews only; moved session tracking to SESSION_CONTEXT.md                                                                                                                                                                                     | Claude |
| 1.0     | 2026-01-01 | Expanded to full Project Health Dashboard covering 5 areas (Security, Code Quality, Performance, Architecture, Documentation) with comprehensive health review template; Initial coordinator creation with non-time-based triggers                                        | Claude |

---

**END OF COORDINATOR.md**
