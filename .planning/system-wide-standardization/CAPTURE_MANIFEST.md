# Capture Manifest: Folded Planning Documents

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-11
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Purpose:** Ensures system-wide standardization steps consume all items from
folded/archived planning documents. Each entry maps a source document to its
target standardization step with specific items that step's deep-plan MUST
address.

---

## How to Use This Manifest

When beginning the deep-plan for a standardization step listed below:

1. Check this manifest for mapped source documents
2. Read the archived source document (paths below)
3. Incorporate ALL listed items into the step's deep-plan
4. Mark the entry as "consumed" with the session number

---

## Entry 1: Audit Ecosystem Health Plan → Step 11

**Source:** `.claude/plans/archive/AUDIT_ECOSYSTEM_HEALTH_PLAN.md` **Target
Step:** Step 11 (Audit Ecosystem) **Status:** PENDING **Consumed By:** (session
number when deep-plan incorporates this)

### Items to Capture (41 issues)

**Dimension 1: Skill Health (17 issues)**

- audit-performance (95%): Minor output path inconsistency
- audit-process (95%): Minor output path inconsistency
- audit-ai-optimization (95%): Minor output path inconsistency
- audit-engineering-productivity (80%): Output path writes to comprehensive/
  instead of single-session/
- audit-enhancements (70%): Uses I0-I3 severity instead of S0-S3; non-standard
  structure
- audit-comprehensive (65%): 3 broken cross-refs to non-existent docs; missing
  Stage 2.5
- audit-refactoring (57%): Missing Purpose, Exec Mode, Agent Architecture
  sections
- audit-documentation (50%): v2.0 rewrite broke AUDIT_STANDARDS compliance;
  Post-Audit incomplete
- multi-ai-audit (35%): No frontmatter; structural non-compliance
- audit-aggregator (25%): No frontmatter; minimal structure

**Dimension 2: TDMS Pipeline (8 issues)** — Also relevant to Steps 8/16/21

- CRITICAL: `audit-schema.json` missing ai-optimization category
- CRITICAL: `state-manager.js` VALID_CATEGORIES missing 2 categories
- HIGH: `intake-audit.js` loses confidence field
- HIGH: `intake-audit.js` no verification_steps enforcement
- HIGH: `validate-schema.js` type validation = warning not error
- MEDIUM: `validate-schema.js` no source_id format validation
- MEDIUM: `validate-schema.js` no verification_steps enforcement
- CRITICAL: `generate-metrics.js` age calc bug: `created_at` vs `created`

**Dimension 3: Process & Tracking (8 issues)**

- HIGH: AUDIT_TRACKER.md missing ai-optimization row
- HIGH: COORDINATOR.md stale (missing 2 newest categories)
- MEDIUM: COORDINATOR.md baselines from 2026-01-11
- MEDIUM: No threshold enforcement hooks
- MEDIUM: AI_WORKFLOW.md audit references outdated
- LOW: Codification doc status still PLANNED
- HIGH: Audit docs scattered across 4 locations
- MEDIUM: Missing directory scaffold (6 of 9 dirs)

**Dimension 4: Multi-AI Templates (8 issues)**

- MEDIUM: Template naming inconsistency (\_PLAN.md vs \_AUDIT.md)
- HIGH: SHARED_TEMPLATE_BASE incomplete
- HIGH: 7 of 9 templates missing quality guardrails
- MEDIUM: No template compliance validation
- CRITICAL: 3 referenced docs in comprehensive don't exist
- CRITICAL: audit-comprehensive only covers 7 domains (needs 9)
- CRITICAL: audit-aggregator expects 7 reports (needs 9)
- HIGH: Output path inconsistencies across skills

### Decisions to Preserve (27 decisions)

- D1-D11: Structure, location, consolidation decisions
- D12-D18: Category alignment, skill compliance, severity scale standardization
- D19-D27: Improvements (post-audit automation, commit counter, pre-audit check,
  trend tracking, context recovery, /audit-health skill, resolution feedback,
  template validator, multi-AI category scoping)

### Execution Structure to Reuse

- 8-wave remediation pattern with clear dependency ordering
- 39 concrete steps — can be adapted into Step 11's plan structure

---

## Entry 2: Ecosystem Audit Expansion → Step 11

**Source:** `.claude/plans/archive/ecosystem-audit-expansion.md` **Target
Step:** Step 11 (Audit Ecosystem) **Status:** PENDING **Consumed By:** (session
number when deep-plan incorporates this)

### Items to Capture

**New Audit Skills Designed (3):**

- skill-ecosystem-audit: 5 domains, 21 categories (structural compliance,
  cross-ref integrity, coverage/consistency, staleness/drift, agent
  orchestration health)
- doc-ecosystem-audit: 5 domains, 16 categories (index health, link integrity,
  content quality, generation pipeline, coverage)
- script-ecosystem-audit: 5 domains, 18 categories (module consistency,
  safety/error handling, registration/reachability, code quality,
  testing/reliability)

**Extensions Designed (2):**

- hook-ecosystem-audit CI extension: 3 new categories (workflow-script
  alignment, bot config freshness, CI cache effectiveness)
- audit-health extension: 3 new checks (ecosystem audit directories, state
  files, lib consistency)

**Infrastructure Designed:**

- comprehensive-ecosystem-audit orchestrator: 3-stage wave architecture
  (foundation → extended → aggregation)
- Compaction resilience hardening: progress.json guard, pre-compaction hook,
  domain chunking, CRTP

**Execution Order:** A→H with clear dependency graph **File Estimates:** ~42 new
files, ~10 modified files

### Decisions to Preserve (17 decisions)

- Category count driven by necessity, not matching other audits
- All 61+ skills in scope (no filtering)
- Full cross-reference validation (file + section + content similarity)
- Bidirectional registry sync
- Standalone audits for docs and scripts (not folded into existing)
- CI/CD audit folded into hook-ecosystem-audit
- Agent orchestration audit folded into skill-ecosystem-audit
- State file health distributed across existing audits
- Layered compaction resilience

---

## Entry 3: System Test Plan → Step 16

**Source:** `.claude/plans/archive/system-test-plan.md` **Target Step:** Step 16
(TDMS/Roadmap comprehensive test phase) **Status:** PENDING **Consumed By:**
(session number when deep-plan incorporates this)

### Items to Capture

**20-Domain Test Structure:**

1. Prerequisites (~8 files)
2. Build & Compilation (~180 files)
3. Existing Test Suite (~50 files)
4. Static Analysis (~300+ files)
5. Dependency Health (~6 files)
6. Application Code Review (~172 files)
7. Cloud Functions Review (~12 files)
8. Security Audit (~15 files)
9. Automation Scripts (~90 files)
10. AI Tooling — Hooks (~30 files)
11. AI Tooling — Skills (~100+ files)
12. AI Tooling — Agents (~25 files)
13. CI/CD Workflows (~13 files)
14. Documentation Audit (~150+ files)
15. Configuration Audit (~30 files)
16. TDMS Reconciliation (~20 files)
17. Roadmap Reconciliation (~5 files)
18. Cross-System Integration (cross-cutting)
19. Custom ESLint Plugin (~4 files)
20. Final Report Compilation

**Finding Format Standard:**

```
### [DOMAIN-NNN] Title
- Severity: S0|S1|S2|S3
- File(s): /path/to/file
- Description: What is wrong
- Evidence: Command output or code snippet
- Remediation: Specific fix
- TDMS: DEBT-XXXX (existing) | NEW
```

**Execution Model:** 5-session plan with checkpoint-based resume **Known
Pre-Identified Issues:** 8 items (Node engine mismatch, failing tests, missing
CSP header, App Check disabled, etc.)

### Decisions to Preserve (17 decisions)

- Report first, then fix in severity-based PRs
- Static + logical + runtime analysis
- AI tooling gets equal rigor as application code
- Full doc audit (cross-refs, accuracy, freshness, formatting, completeness)
- Hybrid approach: run existing tools first, add targeted new checks
- Dry-run only (no real external service writes)
- Full reconciliation of all MASTER_DEBT items with new findings
- Report everything, no thresholds

---

## Cross-Step Dependencies

| Source Item                              | Primary Step                  | Also Relevant To          |
| ---------------------------------------- | ----------------------------- | ------------------------- |
| TDMS pipeline bugs (8 issues)            | Step 11                       | Steps 8, 16, 21           |
| Category alignment (9-category taxonomy) | Step 11                       | Step 8 (TDMS scripts)     |
| Script safety patterns                   | Step 11 (script audit design) | Step 9 (CI/CD)            |
| Compaction resilience                    | Step 11                       | Step 5 (Sessions)         |
| 20-domain test structure                 | Step 16                       | All steps (cross-cutting) |
