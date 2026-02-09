# Document Dependencies

**Document Type:** REFERENCE (Tier 4) **Version:** 1.9 **Created:** 2026-01-08
**Status:** ACTIVE **Purpose:** Track template-instance relationships,
cross-document dependencies, and synchronization requirements **Last Updated:**
2026-02-07 (Session #141 - Remove deleted audit plan instances)

---

## Purpose

This document tracks all **derived document relationships** in the repository to
ensure:

1. Template changes propagate to all instances
2. Instance improvements feed back to templates
3. Structural consistency across related documents
4. Automated validation of sync status

**Critical Pattern**: When a template is updated with structural/formatting
improvements, ALL instances derived from that template MUST be updated to
maintain consistency.

**Related**: [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md) -
Quality protocols for documentation

## Quick Start

1. Check dependency matrix for your document
2. Verify all referenced documents exist
3. Update this file when adding new dependencies

## AI Instructions

When managing document dependencies:

- Track all template-instance relationships
- Update synchronization status after changes
- Verify cross-references remain valid

---

## Template → Instance Relationships

### 1. Multi-AI Audit Plan Templates

> **Note:** Q1 2026 audit plan instances were removed during the 412-artifact
> cleanup (Session #140). The multi-AI audit skill now handles audits directly
> via templates in `docs/templates/`. No active template-instance pairs remain.

**Sync Requirements:**

- **Structural changes** (sections, formatting, headers) → MUST sync to all
  instances
- **Content placeholders** → Instances replace with project-specific values
- **Instructions/workflow** → MUST sync to all instances
- **Examples** → May differ (template shows generic examples, instances show
  actual data)

### 2. Core Document Templates

| Template                       | Instances                                         | Location             | Last Synced | Sync Status    |
| ------------------------------ | ------------------------------------------------- | -------------------- | ----------- | -------------- |
| **CANONICAL_DOC_TEMPLATE.md**  | ROADMAP.md, INTEGRATED_IMPROVEMENT_PLAN.md        | Root, docs/          | N/A         | ⚠️ NOT TRACKED |
| **FOUNDATION_DOC_TEMPLATE.md** | ARCHITECTURE.md, DEVELOPMENT.md, docs/SECURITY.md | Root, docs/          | N/A         | ⚠️ NOT TRACKED |
| **PLANNING_DOC_TEMPLATE.md**   | Various planning docs                             | docs/, docs/archive/ | N/A         | ⚠️ NOT TRACKED |
| **REFERENCE_DOC_TEMPLATE.md**  | AI_WORKFLOW.md, AI_REVIEW_PROCESS.md              | docs/                | N/A         | ⚠️ NOT TRACKED |
| **GUIDE_DOC_TEMPLATE.md**      | (None currently)                                  | N/A                  | N/A         | N/A            |

**Why NOT TRACKED:** Core document templates define high-level structure
(metadata fields, section organization, quality protocols) but instances diverge
significantly in content and purpose. Unlike audit plan templates (which
maintain tight structural coupling), core templates have **looser coupling**
where:

- Instances inherit metadata structure but not specific content
- Section names vary based on document purpose
- Content evolution is independent after initial template instantiation

These templates are **structural guides**, not strict blueprints requiring
continuous synchronization. They are excluded from automated validation to avoid
false positives.

**Sync Requirements:**

- **Metadata standards** → MUST sync (version, created, last updated, status)
- **Section requirements** → MUST sync (required sections)
- **Quality protocols** → MUST sync (status tracking, dependencies)
- **Content** → Instances contain project-specific content

### 3. Schema Dependencies

| Schema Definition            | Consumers                | Location                        | Sync Status |
| ---------------------------- | ------------------------ | ------------------------------- | ----------- |
| **JSONL_SCHEMA_STANDARD.md** | All CANON-\*.jsonl files | docs/reviews/2026-Q1/canonical/ | ✅ SYNCED   |
| **JSONL_SCHEMA_STANDARD.md** | Aggregator templates     | docs/templates/                 | ✅ SYNCED   |

---

## Synchronization Protocols

### Protocol 1: Template → Instance Propagation

**When to Apply**: After ANY structural change to a template

**Steps**:

1. **Identify all instances** (use table above)
2. **Categorize change type**:
   - Structural (sections, formatting) → MUST propagate
   - Content (examples, placeholders) → MAY propagate
   - Instructions (workflow, requirements) → MUST propagate
3. **Update all instances** systematically
4. **Update "Last Synced" date** in this document
5. **Create learning entry** if issue discovered (Review #XX format)

**Example**: Review #89 - SCOPE formatting fix required template AND instance
updates

### Protocol 2: Instance → Template Feedback

**When to Apply**: After improving an instance with better structure/clarity

**Steps**:

1. **Evaluate if improvement is universal** (would benefit all future instances)
2. **Update template** with improvement
3. **Decide if existing instances need update**:
   - Critical improvements → Update all instances
   - Nice-to-have improvements → Update on next quarterly review
4. **Update "Last Synced" date** for affected instances
5. **Document in AI_REVIEW_LEARNINGS_LOG.md**

**Example**: Review #89 - Nested directory list format improved in
DOCUMENTATION_AUDIT_PLAN → fed back to template

### Protocol 3: New Instance Creation

**When to Apply**: Creating a new document from a template

**Steps**:

1. **Copy latest template version**
2. **Replace ALL placeholders** with project-specific values
3. **Verify no `[e.g., ...]` or `[X]` placeholders remain**
4. **Add instance to this document** in relevant table
5. **Set "Last Synced" date** to creation date
6. **Mark sync status** as ✅ SYNCED

**Validation Checklist**:

- [ ] All `[...]` placeholders replaced
- [ ] All `[e.g., ...]` examples replaced with actual data
- [ ] Section structure matches template exactly
- [ ] Metadata filled (version, dates, status)
- [ ] Instance added to DOCUMENT_DEPENDENCIES.md

---

## Automated Validation

### Validation Script

**Implementation**: `scripts/check-document-sync.js` (Session #35 - 2026-01-08)

**Goal**: Detect template-instance drift automatically

**Checks**:

1. **Placeholder detection** - Scans for `[e.g., ...]`, `[X]`, `[Project Name]`,
   etc. (7 patterns)
2. **Broken links** - Verifies all relative Markdown links point to existing
   files
3. **Last synced age** - Flags instances >90 days out of sync

**Integration**: Available via `npm run docs:sync-check`

**Exit Codes**:

- `0` - All documents synced
- `1` - Sync issues found
- `2` - Error during validation

**Usage**:

```bash
npm run docs:sync-check           # Standard check
npm run docs:sync-check -- --verbose  # Detailed line numbers
npm run docs:sync-check -- --json     # JSON output
```

### Manual Validation Procedure

**Frequency**: Quarterly (or when template updated)

**Steps**:

1. Run `git log docs/templates/` to find template changes
2. For each changed template:
   - Check "Last Synced" dates for instances
   - If > 90 days old, audit for drift
   - Update instances if needed
3. Update sync status in this document
4. Document any issues in AI_REVIEW_LEARNINGS_LOG.md

---

## Audit History

### Session #35 Full Audit (2026-01-08)

**Scope**: All 6 audit plan template-instance pairs

**Findings**:

1. ✅ **CODE_REVIEW_PLAN** - Clean (no issues found)
2. ❌ **SECURITY_AUDIT_PLAN** - Broken link `../../SECURITY.md` → Fixed to
   `../SECURITY.md`
3. ❌ **REFACTORING_AUDIT_PLAN** - Tech Stack section had `[e.g., ...]`
   placeholders → Replaced with actual SoNash stack
4. ❌ **PROCESS_AUDIT_PLAN** - SCOPE section had `[e.g., ...]` placeholders →
   Replaced with actual workflows/scripts

**Actions Taken**:

- Fixed broken SECURITY.md link in SECURITY_AUDIT_PLAN:713
- Replaced Tech Stack placeholders in REFACTORING_AUDIT_PLAN:60-65
- Replaced SCOPE placeholders in PROCESS_AUDIT_PLAN:90-106
- Updated all "Last Synced" dates to 2026-01-08
- All 6 audit plans now marked ✅ SYNCED

**Outcome**: All 6 audit plan instances are now fully synced with templates and
ready for Step 4.2 execution.

---

## Common Sync Issues

### Issue 1: Placeholder Content Not Replaced

**Symptom**: Instance contains `[e.g., Next.js 16.1]` instead of actual values

**Root Cause**: Template instantiation without validation step

**Fix**: Replace all placeholders with actual project data

**Prevention**: Add placeholder detection to DOCUMENTATION audit checklist

**Example**: Review #89 - PERFORMANCE_AUDIT_PLAN had example routes instead of
actual app routes

### Issue 2: Structural Improvements Not Propagated

**Symptom**: Template has bulleted lists, instance has plain text

**Root Cause**: Instance created before template improvement; template improved
but instance not updated

**Fix**: Apply structural improvements to all instances

**Prevention**: Use Protocol 1 (Template → Instance Propagation)

**Example**: Review #89 - SCOPE formatting improved in template but not yet
applied to instances

### Issue 3: Version Drift

**Symptom**: Instance references v1.0 of a doc that's now v1.2

**Root Cause**: Referenced document updated, instance not updated

**Fix**: Update all version references when docs change

**Prevention**: Add cross-reference validation to DOCUMENTATION audit

**Example**: Review #89 - DOCUMENTATION_STANDARDS v1.0 → v1.2 reference needed
updating

---

## Update Triggers

**This document MUST be updated when:**

1. ✅ **New template created** → Add to Template → Instance table
2. ✅ **New instance created** → Add to relevant table with "Last Synced" date
3. ✅ **Template structurally changed** → Update all instances, update "Last
   Synced" dates
4. ✅ **Instance improvement feeds back** → Update template, note in table
5. ✅ **Sync issue discovered** → Add to Common Sync Issues section
6. ✅ **Archive instance** → Move to "Archived Instances" section (below)

---

## Cross-Document Update Triggers

**Purpose:** When editing core documents, this table helps identify OTHER
documents that may need updating as a result.

**Gap This Addresses:** Template-instance sync (above) covers structural
inheritance. This section covers **content-level cascading updates** where
changes in one document affect the accuracy of another.

### Update Trigger Matrix

> **Note:** INTEGRATED_IMPROVEMENT_PLAN.md is now archived (2026-01-14) to
> `docs/archive/completed-plans/`. Related triggers removed (Review #144).

| When This Changes                  | Check These Documents                                                                | Reason                                                  | Enforced |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------- |
| `ROADMAP.md` milestones/priorities | `SESSION_CONTEXT.md` priorities section                                              | Session context reflects current roadmap focus          | ✅ BLOCK |
| `ROADMAP.md` milestone promoted    | `ROADMAP_FUTURE.md` (remove detailed section)                                        | Future details move with promotion                      | Manual   |
| `ROADMAP_FUTURE.md` task added     | `analysis/PARALLEL_EXECUTION_GUIDE.md` (if PG marker)                                | Parallel groups must stay synchronized                  | Manual   |
| Milestone promoted to active       | `ROADMAP.md`, `ROADMAP_FUTURE.md`                                                    | Move section from FUTURE to active roadmap              | Manual   |
| Audit findings resolved            | `docs/technical-debt/MASTER_DEBT.jsonl`                                              | Technical debt tracker must reflect resolved items      | Manual   |
| Comprehensive audit runs           | `docs/technical-debt/MASTER_DEBT.jsonl`, `ROADMAP.md`                                | New findings must be consolidated and prioritized       | Manual   |
| `TECHNICAL_DEBT_MASTER.md` changed | `ROADMAP.md` (Technical Debt Backlog section)                                        | Backlog section references tech debt master             | Manual   |
| New npm script added               | `DEVELOPMENT.md` (scripts section)                                                   | All scripts should be documented                        | ✅ BLOCK |
| New hook added                     | `DEVELOPMENT.md` (hooks section), `docs/TRIGGERS.md`, `.claude/COMMAND_REFERENCE.md` | Hook documentation must be complete                     | ✅ BLOCK |
| `app/admin/` files changed         | `ROADMAP_LOG.md` (Track A archived)                                                  | Admin Panel changes — Track A archived to ROADMAP_LOG   | Manual   |
| `functions/src/admin*` changed     | `ROADMAP_LOG.md` (Track A archived)                                                  | Admin backend changes — Track A archived to ROADMAP_LOG | Manual   |
| `app/(protected)/dashboard/`       | `ROADMAP.md` (sprint status)                                                         | Dashboard changes must update roadmap                   | ✅ BLOCK |
| Milestone/Feature completed        | `ROADMAP.md`, `ROADMAP_LOG.md`                                                       | Multiple docs track completion status                   | Manual   |
| New policy document created        | `claude.md` or relevant policy index                                                 | Policy references need updating                         | Manual   |
| PR review fixes applied            | `AI_REVIEW_LEARNINGS_LOG.md`                                                         | Lessons learned must be captured                        | Manual   |
| Deferred items → ROADMAP_FUTURE    | `AI_REVIEW_LEARNINGS_LOG.md` (change DEFERRED → TRIAGED)                             | Prevents duplicate alerts; keeps source updated         | Manual   |
| New skill/command added            | `.claude/settings.json`, `.claude/COMMAND_REFERENCE.md`                              | Skill registry and reference must be complete           |
| Security-related changes           | `docs/SECURITY.md`, `docs/GLOBAL_SECURITY_STANDARDS.md`                              | Security documentation must reflect current state       |
| Firebase config changes            | `docs/FIREBASE_CHANGE_POLICY.md`                                                     | Policy requires documenting all Firebase changes        |
| Test coverage changes              | `SESSION_CONTEXT.md` (Test Status line)                                              | Keep test counts current                                |
| Session summary archival           | `docs/SESSION_HISTORY.md`                                                            | Old session summaries archive here                      | Manual   |
| `SESSION_CONTEXT.md` 5+ sessions   | `docs/SESSION_HISTORY.md`, `SESSION_CONTEXT.md`                                      | Keep SESSION_CONTEXT.md < 200 lines                     | Manual   |
| `tests/e2e/` files changed         | `ROADMAP.md` (Track T status), `TESTING_PLAN.md`                                     | E2E test changes must update Track T status             | Manual   |
| Testing infrastructure changes     | `docs/plans/TESTING_INFRASTRUCTURE_PLAN.md`                                          | Track T spec must reflect implementation                | Manual   |
| Planning documents added/archived  | `docs/PLAN_MAP.md`                                                                   | Plan map shows documentation hierarchy                  | Manual   |
| `.claude/plans/` files changed     | `docs/PLAN_MAP.md`                                                                   | Keep plan map current with active plans                 | Manual   |
| **Docs added/removed/moved**       | `DOCUMENTATION_INDEX.md` (run `npm run docs:index`)                                  | Auto-generated index must reflect current state         | Manual   |
| `docs/plans/` files added/changed  | `docs/PLAN_MAP.md`, `docs/README.md`                                                 | Navigation docs must reference new plans                | ✅ BLOCK |
| `docs/technical-debt/` changed     | `SESSION_CONTEXT.md`                                                                 | Session context tracks tech debt status                 | ✅ BLOCK |
| `docs/technical-debt/` changed     | `docs/PLAN_MAP.md`                                                                   | TDMS status tracking                                    | ✅ BLOCK |
| DEBT-XXXX items resolved           | `docs/technical-debt/MASTER_DEBT.jsonl`, `ROADMAP.md`                                | Both canonical and roadmap must reflect resolution      | Manual   |
| New audit findings generated       | `docs/technical-debt/MASTER_DEBT.jsonl` (via intake scripts)                         | All findings flow to canonical location                 | Manual   |

### Usage

**During editing:** Before committing changes to any document in the left
column, check the corresponding documents in the right column.

**At session end:** Run through this table for any documents you modified during
the session.

**Integration:**

- Pre-commit hook automatically warns when dependencies are detected
  (non-blocking)
- `/session-end` command includes cross-doc check in its checklist

---

## Archived Instances

Instances that have been archived to `docs/archive/` and no longer require sync:

| Template                                    | Archived Instance                   | Archive Date | Archive Location                        |
| ------------------------------------------- | ----------------------------------- | ------------ | --------------------------------------- |
| MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md       | CODE_REVIEW_PLAN_2026_Q1.md         | 2026-02-07   | Deleted (artifact cleanup Session #140) |
| MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md    | SECURITY_AUDIT_PLAN_2026_Q1.md      | 2026-02-07   | Deleted (artifact cleanup Session #140) |
| MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md | PERFORMANCE_AUDIT_PLAN_2026_Q1.md   | 2026-02-07   | Deleted (artifact cleanup Session #140) |
| MULTI_AI_REFACTOR_AUDIT_PROMPT.md           | REFACTORING_AUDIT_PLAN_2026_Q1.md   | 2026-02-07   | Deleted (artifact cleanup Session #140) |
| MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md    | DOCUMENTATION_AUDIT_PLAN_2026_Q1.md | 2026-02-07   | Deleted (artifact cleanup Session #140) |
| MULTI_AI_PROCESS_AUDIT_TEMPLATE.md          | PROCESS_AUDIT_PLAN_2026_Q1.md       | 2026-02-07   | Deleted (artifact cleanup Session #140) |

---

## Integration with Other Processes

### DOCUMENTATION Audit Integration

The DOCUMENTATION_AUDIT_PLAN should include:

- [ ] Verify template-instance sync status (check this document)
- [ ] Detect placeholder content in instances (`[...]`, `[e.g., ...]`)
- [ ] Validate cross-document version references
- [ ] Check "Last Synced" dates for staleness (>90 days)

### Code Review Integration

When reviewing documentation PRs:

- [ ] If template changed, verify all instances updated
- [ ] If instance changed structurally, consider template update
- [ ] Update this document's sync status tables
- [ ] Add to AI_REVIEW_LEARNINGS_LOG.md if sync issue found

### Quality Gate

**Before marking Step 4.2 (Multi-AI Audit) complete:**

- [ ] All 6 audit plan instances verified synced with templates
- [ ] All sync status marked ✅ SYNCED in this document
- [ ] No placeholder content remaining in any instance
- [ ] DOCUMENT_DEPENDENCIES.md itself reviewed for completeness

---

## Version History

| Version | Date       | Changes                                                                                                                                          | Author      |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1.9     | 2026-02-07 | Removed 6 deleted Q1 audit plan instances (artifact cleanup Session #140); fixed stale TECHNICAL_DEBT_MASTER.md and docs/audits/canonical/ refs. | Claude Code |
| 1.8     | 2026-02-01 | TDMS ALL 17 PHASES COMPLETE - Updated to note docs/audits/canonical/ was archived to docs/archive/technical-debt-sources-2026-01/; Session #123. | Claude Code |
| 1.7     | 2026-01-30 | Added TDMS-related triggers: docs/plans/, docs/technical-debt/, docs/audits/canonical/, DEBT-XXXX resolution; Session #117.                      | Claude Code |
| 1.6     | 2026-01-29 | Added DEFERRED → TRIAGED trigger: when items move to ROADMAP_FUTURE.md, source entries must be updated; Session #115.                            | Claude Code |
| 1.5     | 2026-01-27 | Added Track T (Testing Infrastructure) triggers: tests/e2e/ and testing infrastructure changes; Session #103.                                    | Claude Code |
| 1.4     | 2026-01-27 | Added ROADMAP_FUTURE.md to dependency matrix; added milestone promotion and parallel group sync triggers; 3 new cross-document rules.            | Claude Code |
| 1.3     | 2026-01-17 | Added BLOCKING rules for feature file → ROADMAP.md: app/admin/, functions/src/admin\*, app/(protected)/dashboard/ now require ROADMAP.md update. | Claude Code |
| 1.2     | 2026-01-14 | Added pre-commit hook automation for cross-document dependency warnings.                                                                         | Claude Code |
| 1.1     | 2026-01-14 | Added "Cross-Document Update Triggers" section with 12-row trigger matrix for content-level cascading updates between core documents.            | Claude Code |
| 1.0     | 2026-01-08 | Initial creation. Documented 6 audit plan template-instance relationships, 5 core doc templates, sync protocols, common issues from Review #89.  | Claude Code |

---

**END OF DOCUMENT_DEPENDENCIES.md**
