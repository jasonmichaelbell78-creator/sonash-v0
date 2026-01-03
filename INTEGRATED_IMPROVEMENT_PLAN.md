# Integrated Improvement Plan

**Document Version:** 1.2
**Created:** 2026-01-03
**Last Updated:** 2026-01-03
**Status:** ACTIVE
**Overall Completion:** 0%

---

## Document Purpose

This is the **CANONICAL** roadmap for all improvement work from the current moment until feature roadmap resumption. This document consolidates and supersedes fragmented planning documents into a single linear execution path.

**This document integrates:**
- Documentation Standardization (Phase 5-6 remaining)
- Developer Tooling Setup (Prettier, madge, knip)
- Quick Wins (.txt conversion, ADR folder)
- Architecture Refactoring (validated via Delta Review)
- Security Hardening (App Check re-enablement)

**Upon completion of this plan:**
- All documentation follows established standards
- Developer tooling enforces code quality automatically
- Architecture refactoring is validated and tracked in ROADMAP.md
- Feature development can resume (M1.5, M1.6, M3+)

---

## Status Dashboard

| Step | Title | Status | Completion | Blocking |
|------|-------|--------|------------|----------|
| Step 1 | Quick Wins & Cleanup | **PENDING** | 0% | None |
| Step 2 | Documentation Standardization Completion | **PENDING** | 0% | Step 1 |
| Step 3 | Developer Tooling Setup | **PENDING** | 0% | Step 2 |
| Step 4 | Delta Review & Refactor Plan Refresh | **PENDING** | 0% | Step 3 |
| Step 5 | ROADMAP.md Integration & Doc Updates | **PENDING** | 0% | Step 4 |
| Step 6 | Verification & Feature Resumption | **PENDING** | 0% | Step 5 |

**Overall Progress:** 0/6 steps complete (0%)
**Estimated Total Effort:** 20-30 hours
**Target Completion:** TBD (no costly deadlines - solo project)

---

## Dependency Map

```
Step 1 (Quick Wins) ──> Step 2 (Doc Standardization) ──> Step 3 (Tooling)
                                                              │
                                                              v
Step 6 (Verification) <── Step 5 (Integration) <── Step 4 (Delta Review)
```

**Critical Path:** Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6

---

## Context & Background

### Why This Plan Exists

A comprehensive staff-engineer audit was conducted comparing:
1. Current DOCUMENTATION_STANDARDIZATION_PLAN approach (57% complete)
2. Current EIGHT_PHASE_REFACTOR_PLAN approach (0% of 8 phases complete)
3. Best practices from audit prompt recommendations

**Key decisions made:**
- **Adjust course**, not restart - existing work is valuable
- Complete documentation first (foundation for everything else)
- Add developer tooling that was missing (Prettier, madge, knip)
- Validate refactoring plans via Delta Review before execution
- Migrate valid refactor items to ROADMAP.md under M2
- Remove deprecated planning documents after migration

### What We Decided NOT To Do

| Recommendation | Decision | Reason |
|----------------|----------|--------|
| Numbered folder structure | NOT DOING | Current 5-tier hierarchy works |
| Immediate feature folder refactoring | DEFERRED | Validate via Delta Review first |
| Immediate god object splitting | DEFERRED | No friction yet; tracked in M2 |
| Aggressive doc consolidation (197→30) | NOT DOING | Too disruptive for solo project |
| Full planning restart | NOT DOING | 57% doc standardization complete |

### Items to Add to ROADMAP.md (Step 5)

These items need roadmap entries to ensure future completion:

1. **Import boundary enforcement via ESLint** (after feature folders exist)
2. **madge** - circular dependency detection (ongoing use)
3. **knip** - unused export detection (ongoing use)
4. **Prettier** - code formatting (ongoing use)
5. **Delta Review** - process for refreshing stale plans

---

## Step 1: Quick Wins & Cleanup

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 2-3 hours
**Dependencies:** None
**Risk Level:** Low

### Objectives

Address small, high-value items that unblock or simplify subsequent steps.

### Tasks

- [ ] **Task 1.1**: Convert .txt files to .md (0.5 hours)
  - Convert `docs/ChatGPT Multi_AI Refactoring Plan Chat.txt` → `.md`
  - Convert `docs/GitHub Code Analysis and Review Prompt.txt` → `.md`
  - Convert `docs/Refactoring PR Plan.txt` → `.md`
  - Add minimal frontmatter (title, date, purpose)
  - Move to appropriate location (likely `docs/archive/` as historical)

- [ ] **Task 1.2**: Create ADR folder structure (0.5 hours)
  - Create `/docs/decisions/` folder
  - Create `README.md` explaining ADR format
  - Create `TEMPLATE.md` for new ADRs
  - Document first ADR: "ADR-001: Integrated Improvement Plan Approach"

- [ ] **Task 1.3**: Audit and fix broken links in active docs (1 hour)
  - Audit ROADMAP.md and SESSION_CONTEXT.md for broken/outdated links
  - Fix any broken links found during review
  - Note: EIGHT_PHASE_REFACTOR_PLAN.md migration deferred to Step 5 (after Delta Review validates items)

- [ ] **Task 1.4**: Log this process pivot in AI_REVIEW_LEARNINGS_LOG.md (0.5 hours)
  - Add entry documenting the staff-engineer audit
  - Document decision to integrate vs restart
  - Note key learnings for future planning efforts

### Acceptance Criteria

- [ ] All 3 .txt files converted to .md with frontmatter
- [ ] ADR folder exists with README and template
- [ ] ADR-001 documents this plan's approach
- [ ] Broken links fixed in active docs
- [ ] AI_REVIEW_LEARNINGS_LOG.md updated

---

## Step 2: Documentation Standardization Completion

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 8-12 hours
**Dependencies:** Step 1
**Risk Level:** Medium

### Objectives

Complete the remaining phases (5-6) of DOCUMENTATION_STANDARDIZATION_PLAN.md.

### Reference

Full task details are in [DOCUMENTATION_STANDARDIZATION_PLAN.md](./DOCUMENTATION_STANDARDIZATION_PLAN.md):
- **Phase 5**: Migrate Tier 5 Docs (6 tasks, ~5 hours)
- **Phase 6**: Archive & Cleanup (9 tasks, ~5 hours)

### Tasks (Summary)

**Phase 5 - Tier 5 Doc Migration:**
- [ ] Task 5.1: Merge APPCHECK_FRESH_SETUP.md into APPCHECK_SETUP.md
- [ ] Task 5.2: Migrate SENTRY_INTEGRATION_GUIDE.md
- [ ] Task 5.3: Migrate INCIDENT_RESPONSE.md
- [ ] Task 5.4: Migrate recaptcha_removal_guide.md
- [ ] Task 5.5: Migrate ANTIGRAVITY_GUIDE.md
- [ ] Task 5.6: Merge TESTING_CHECKLIST.md into TESTING_PLAN.md

**Phase 6 - Archive & Cleanup:**
- [ ] Task 6.1: Archive duplicate documents
- [ ] Task 6.2: Archive outdated documents
- [ ] Task 6.3: AI_HANDOFF.md (already done)
- [ ] Task 6.4: Verify no broken cross-references
- [ ] Task 6.5: Update README.md with doc inventory
- [ ] Task 6.6: Final validation
- [ ] Task 6.7: Template schema consolidation
- [ ] Task 6.8: Full deliverable audit automation
- [ ] Task 6.9: Lessons learned automation

### Acceptance Criteria

- [ ] Phase 5 marked COMPLETE in DOCUMENTATION_STANDARDIZATION_PLAN.md
- [ ] Phase 6 marked COMPLETE in DOCUMENTATION_STANDARDIZATION_PLAN.md
- [ ] All docs pass `npm run docs:check`
- [ ] DOCUMENTATION_STANDARDIZATION_PLAN.md marked 100% complete

---

## Step 3: Developer Tooling Setup

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 3-4 hours
**Dependencies:** Step 2
**Risk Level:** Low

### Objectives

Install and configure developer tooling that was identified as missing during the audit.

### Tasks

- [ ] **Task 3.1**: Install and configure Prettier (1 hour)
  - `npm install --save-dev prettier`
  - Create `.prettierrc` with project config
  - Create `.prettierignore` for exclusions
  - Add `npm run format` script to package.json
  - Add `npm run format:check` for CI
  - Run initial format on codebase
  - Commit formatted changes

- [ ] **Task 3.2**: Install and configure madge (0.5 hours)
  - `npm install --save-dev madge`
  - Add `npm run deps:circular` script
  - Run initial check, document any existing circular deps
  - Add to CI pipeline (warn, don't block initially)

- [ ] **Task 3.3**: Install and configure knip (0.5 hours)
  - `npm install --save-dev knip`
  - Create `knip.json` config
  - Add `npm run deps:unused` script
  - Run initial check, document findings
  - Add to CI pipeline (warn, don't block initially)

- [ ] **Task 3.4**: Document tooling in DEVELOPMENT.md (1 hour)
  - Add "Code Quality Tools" section
  - Document Prettier usage and configuration
  - Document madge usage for circular dep detection
  - Document knip usage for unused export detection
  - Add to "Definition of Done" checklist

- [ ] **Task 3.5**: Update CI/CD pipeline (0.5 hours)
  - Add Prettier check to GitHub Actions
  - Add madge check (warning only)
  - Add knip check (warning only)

### Acceptance Criteria

- [ ] Prettier installed and configured
- [ ] `npm run format` works
- [ ] madge installed with `npm run deps:circular`
- [ ] knip installed with `npm run deps:unused`
- [ ] DEVELOPMENT.md documents all tools
- [ ] CI pipeline updated

---

## Step 4: Delta Review & Refactor Plan Refresh

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 4-6 hours
**Dependencies:** Step 3
**Risk Level:** Medium

### Objectives

Re-evaluate the EIGHT_PHASE_REFACTOR_PLAN.md to determine which items are still valid, which are stale, and which have been completed by other work.

### Background

The EIGHT_PHASE_REFACTOR_PLAN.md was created 2025-12-30 based on a 6-AI code review. Since then:
- Documentation standardization progressed significantly
- Pattern automation scripts added
- Security fixes applied (Qodo reviews #24-27)
- App Check remains disabled (deferred)

A Delta Review will refresh this plan with current context.

### Tasks

- [ ] **Task 4.1**: Extract current CANON findings from EIGHT_PHASE_REFACTOR_PLAN.md (1 hour)
  - List all 45 CANON items with current status
  - Categorize: DONE, STILL_VALID, STALE, SUPERSEDED

- [ ] **Task 4.2**: Run fresh analysis on high-priority items (2 hours)
  - Focus on S0/S1 severity items
  - Verify file paths still exist
  - Check if issues were fixed by recent work
  - Document findings

- [ ] **Task 4.3**: Create refreshed refactor backlog (1 hour)
  - List validated items that still need work
  - Prioritize by severity and effort
  - Group by category (security, architecture, testing)
  - Format for ROADMAP.md integration

- [ ] **Task 4.4**: Document App Check re-enablement plan (1 hour)
  - Current status: DISABLED
  - Prerequisite: Throttle clearance (was Dec 31, verify status)
  - Steps to re-enable
  - Testing requirements
  - Add to Step 5 ROADMAP integration

- [ ] **Task 4.5**: Archive EIGHT_PHASE_REFACTOR_PLAN.md (0.5 hours)
  - Move full content to `docs/archive/EIGHT_PHASE_REFACTOR_PLAN.md` with superseded_by note
  - Leave stub file at original `docs/EIGHT_PHASE_REFACTOR_PLAN.md` explaining archived status and linking to ROADMAP.md M2 (prevents broken external links)
  - Update internal cross-references to point to ROADMAP.md
  - No new planning document (avoid fragmentation)

### Acceptance Criteria

- [ ] All 45 CANON items categorized
- [ ] Stale items documented and discarded
- [ ] Valid items ready for ROADMAP.md integration
- [ ] App Check plan documented
- [ ] EIGHT_PHASE_REFACTOR_PLAN.md properly archived/superseded

---

## Step 5: ROADMAP.md Integration & Doc Updates

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 2-3 hours
**Dependencies:** Step 4
**Risk Level:** Low

### Objectives

Integrate validated refactor items into ROADMAP.md and update all documentation to reflect the new unified approach.

### Tasks

- [ ] **Task 5.1**: Add "Developer Tooling" section to ROADMAP.md M2 (0.5 hours)
  - Add Prettier (ongoing enforcement)
  - Add madge (circular dependency detection)
  - Add knip (unused export detection)
  - Add ESLint import boundary rules (future, after feature folders)
  - Add Delta Review process documentation

- [ ] **Task 5.2**: Migrate valid refactor items to ROADMAP.md M2 (1 hour)
  - Add items from Step 4 Task 4.3
  - Preserve severity and effort estimates
  - Group appropriately
  - Add dependencies where applicable

- [ ] **Task 5.3**: Add App Check re-enablement to ROADMAP.md (0.5 hours)
  - Add App Check re-enablement as M2 item (from Step 4 Task 4.4)
  - Include prerequisites and testing requirements
  - Link to detailed plan in docs/

- [ ] **Task 5.4**: Update ROADMAP.md references (0.5 hours)
  - Search and update all references to EIGHT_PHASE_REFACTOR_PLAN.md
  - Point to ROADMAP.md M2 for refactor items
  - Update Doc Standardization blocker status

- [ ] **Task 5.5**: Update SESSION_CONTEXT.md (0.5 hours)
  - Reflect completion of this improvement plan
  - Update current priorities
  - Set next session focus to feature work

- [ ] **Task 5.6**: Final cross-reference audit (0.5 hours)
  - Run `npm run docs:check`
  - Fix any broken links
  - Verify all archived docs properly referenced

### Acceptance Criteria

- [ ] ROADMAP.md M2 contains all tooling items
- [ ] ROADMAP.md M2 contains validated refactor items
- [ ] ROADMAP.md M2 contains App Check re-enablement item
- [ ] No dangling references to EIGHT_PHASE_REFACTOR_PLAN.md
- [ ] SESSION_CONTEXT.md updated
- [ ] All cross-references valid

---

## Step 6: Verification & Feature Resumption

**Status:** PENDING
**Completion:** 0%
**Estimated Effort:** 1-2 hours
**Dependencies:** Step 5
**Risk Level:** Low

### Objectives

Final verification that all improvement work is complete and feature development can resume.

### Tasks

- [ ] **Task 6.1**: Run all validation scripts (0.5 hours)
  - `npm run docs:check` - all docs pass
  - `npm run format:check` - code formatted
  - `npm run deps:circular` - no new circular deps
  - `npm run deps:unused` - baseline documented
  - `npm run lint` - no lint errors
  - `npm run build` - builds successfully

- [ ] **Task 6.2**: Verify documentation completeness (0.5 hours)
  - DOCUMENTATION_STANDARDIZATION_PLAN.md at 100%
  - This document (INTEGRATED_IMPROVEMENT_PLAN.md) at 100%
  - All templates in place
  - AI_WORKFLOW.md current

- [ ] **Task 6.3**: Update ROADMAP.md blocker status (0.5 hours)
  - Remove "Doc Standardization" blocker
  - Update M1.5, M1.6 status to "Ready"
  - Update overall progress percentage

- [ ] **Task 6.4**: Mark this plan COMPLETE (0.5 hours)
  - Update status dashboard above
  - Set completion to 100%
  - Add completion date
  - Commit final state

### Acceptance Criteria

- [ ] All validation scripts pass
- [ ] DOCUMENTATION_STANDARDIZATION_PLAN.md 100% complete
- [ ] INTEGRATED_IMPROVEMENT_PLAN.md 100% complete
- [ ] ROADMAP.md blocker removed
- [ ] Feature work can resume

### Definition of Done

When this step completes:
- **Documentation** is standardized and maintained
- **Developer tooling** enforces code quality
- **Architecture backlog** is validated and tracked
- **Cross-references** are all valid
- **Feature development** (M1.5, M1.6, M3+) can resume

---

## AI Instructions

When implementing this plan:

1. **Work sequentially** - Complete each step before starting the next
2. **Update status** - Mark tasks complete as you finish them
3. **Commit frequently** - One logical change per commit
4. **Run validations** - Use `npm run docs:check` after doc changes
5. **Update this document** - Keep status dashboard current
6. **Reference source docs** - DOCUMENTATION_STANDARDIZATION_PLAN.md has detailed task specs

### Session Handoff

After each work session:
1. Update this document's status dashboard
2. Update SESSION_CONTEXT.md with progress
3. Commit changes with descriptive message
4. Note any blockers or decisions made

---

## Update Triggers

**Update this document when:**
- Step status changes (PENDING → IN_PROGRESS → COMPLETE)
- Tasks completed within a step
- Blockers encountered or resolved
- Decisions made that affect the plan
- New items discovered that need tracking

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-01-03 | Added stub file strategy for archival; clarified Task 1.3 (defer migration to Step 5); improved acceptance criteria |
| 1.1 | 2026-01-03 | Added Task 5.3 for App Check tracking; fixed CANON count (45); removed ARCHITECTURE_REFACTOR_BACKLOG.md option; removed brittle line-number references |
| 1.0 | 2026-01-03 | Initial creation - consolidated improvement roadmap |

---

## References

### Source Documents
- [DOCUMENTATION_STANDARDIZATION_PLAN.md](./DOCUMENTATION_STANDARDIZATION_PLAN.md) - Detailed Phase 5-6 tasks
- [EIGHT_PHASE_REFACTOR_PLAN.md](./docs/EIGHT_PHASE_REFACTOR_PLAN.md) - Original refactor plan (pending Delta Review)
- [ROADMAP.md](./ROADMAP.md) - Product roadmap (target for integration)
- [SESSION_CONTEXT.md](./SESSION_CONTEXT.md) - Session handoff document

### Related Documents
- [AI_WORKFLOW.md](./AI_WORKFLOW.md) - AI navigation guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Developer setup (tooling target)
- [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md) - Review learnings
