# Audit Template & Schema Full Overhaul Plan

**Status:** SAVED — Ready for implementation **Created:** 2026-02-06
**Session:** maa-2026-02-06-b87316 (continuation) **Branch:**
claude/cherry-pick-commits-yLnZV (or create new branch)

## Context

After completing 6/7 categories of a live multi-AI audit (session
maa-2026-02-06-b87316), we've identified systemic issues across the audit
template infrastructure:

- **4 of 7 multi-AI templates** teach non-standard JSONL schemas that deviate
  from `JSONL_SCHEMA_STANDARD.md`
- **All 8 templates** reference outdated model names ("Claude Opus 4.5" → Opus
  4.6)
- **4 templates** reference an archived SonarQube manifest file
- **2 single-session skills** also reference the archived SonarQube file
- **~60-70% boilerplate duplication** across 7 category templates (~130KB
  wasted)
- **2 redundant refactoring templates** that overlap
- **Category naming confusion** — templates teach sub-categories but pipeline
  normalizes to domain-level
- **JSONL_SCHEMA_STANDARD.md** itself has inconsistencies with the pipeline's
  domain-level category approach
- **CLAUDE.md** has stale Firebase version (12.6.0 → should be 12.8.0)

This plan executes a full overhaul to align everything.

---

## Phase 1: Fix CLAUDE.md & Standards Documents (Foundation)

Fix the authoritative reference documents first so all downstream changes align.

### 1.1 CLAUDE.md — Firebase Version Fix

**File:** `CLAUDE.md`

- Line ~12: Change `Firebase | 12.6.0` → `Firebase | 12.8.0`

### 1.2 JSONL_SCHEMA_STANDARD.md — Schema Clarifications

**File:** `docs/templates/JSONL_SCHEMA_STANDARD.md`

**Changes:**

1. **Clarify category field** (Section 2): Add note that `category` MUST be the
   domain-level value (`code-quality`, `security`, `performance`, `refactoring`,
   `documentation`, `process`, `engineering-productivity`). Sub-categories go in
   `fingerprint` or `title` only.
2. **Flatten Security extensions** (Section ~lines 158-176): Change from
   teaching nested `vulnerability_details`/`remediation` objects to showing
   these as OPTIONAL supplements alongside the REQUIRED flat base schema. The
   base `why_it_matters` must contain the description, `suggested_fix` must
   contain remediation, `acceptance_tests` must contain verification steps.
3. **Flatten Performance extensions** (Section ~lines 188-203): Same —
   `performance_details`/`optimization` are optional supplements, not
   replacements for base fields.
4. **Add fingerprint convention** section: Standardize as
   `<domain>::<file_or_scope>::<issue_slug>` with examples per domain.
5. **Add explicit note**: "Templates that produce non-standard output will be
   normalized by `fix-schema.js`, but producing standard output is strongly
   preferred."
6. **Update "Categories for X" sections**: Remove sub-category lists from
   `category` field documentation. Instead, list valid domain-level values. Add
   a separate "Sub-Classification" note explaining sub-categories belong in
   fingerprint.
7. **Version bump** to 1.3, update date.

### 1.3 CANON_QUICK_REFERENCE.md — Align Category Values

**File:** `docs/templates/CANON_QUICK_REFERENCE.md`

**Changes:**

1. **Update "Category Values by Audit Type" table** (line 100-108): Change from
   sub-categories to domain-level categories. Add a note that sub-categories
   appear in `fingerprint` field.
2. **Version bump** to 1.1.

---

## Phase 2: Standardize Multi-AI Template Schemas (Core Fix)

Align all 7 category templates to teach the canonical base schema from
JSONL_SCHEMA_STANDARD.md. This is the highest-impact change.

### The Canonical Base Schema (what ALL templates must teach):

```json
{
  "category": "<domain>",
  "title": "short, specific description",
  "fingerprint": "<domain>::<file_or_scope>::<issue_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path/to/file.ts"],
  "why_it_matters": "1-3 sentence impact explanation",
  "suggested_fix": "concrete remediation direction",
  "acceptance_tests": ["verification step 1", "step 2"],
  "evidence": ["grep output", "code snippet"]
}
```

Domain-specific extensions (symbols, owasp_category, etc.) are OPTIONAL
supplements.

### 2.1 Templates Already Compliant (minor updates only)

These already use `why_it_matters`/`suggested_fix`/`acceptance_tests`:

- **CODE_REVIEW_PLAN.md** — Update `category` values in examples from
  sub-categories to `"code-quality"`. Add fingerprint convention. Domain
  extensions (symbols, duplication_cluster, pr_bucket_suggestion) stay as
  optional.
- **ENGINEERING_PRODUCTIVITY_AUDIT.md** — Update `category` examples to
  `"engineering-productivity"`. Add fingerprint convention.
- **REFACTOR_PLAN.md / REFACTOR_AUDIT_PROMPT.md** — Will be merged (see Phase
  3). Update category to `"refactoring"`.

### 2.2 SECURITY_AUDIT_PLAN.md — Major Schema Realignment

**File:** `docs/audits/multi-ai/templates/SECURITY_AUDIT_PLAN.md`

**Part 4 (Output Format) changes:**

- Replace the nested schema example. The PRIMARY schema must show flat
  `why_it_matters`/`suggested_fix`/`acceptance_tests`
- `vulnerability_details` and `remediation` become OPTIONAL supplementary
  objects
- Change `category` examples from "Rate Limiting"/"Input Validation" →
  `"security"`
- Add `fingerprint` convention: `security::<file>::<vulnerability_slug>`
- Remove or update the nested `remediation.verification` → replaced by
  `acceptance_tests`

**After (standardized):**

```json
{
  "category": "security",
  "title": "...",
  "fingerprint": "security::lib/auth.ts::missing-rate-limit",
  "severity": "S1",
  "effort": "E1",
  "confidence": 85,
  "files": ["lib/auth.ts:42"],
  "why_it_matters": "What's wrong and what damage could occur",
  "suggested_fix": "Add rate limiting middleware with X approach",
  "acceptance_tests": [
    "Rate limit returns 429 after N requests",
    "Existing auth still works"
  ],
  "evidence": ["grep showing no rate limit check"],
  "owasp_category": "A07",
  "cvss_estimate": "MEDIUM"
}
```

### 2.3 PERFORMANCE_AUDIT_PLAN.md — Major Schema Realignment

**File:** `docs/audits/multi-ai/templates/PERFORMANCE_AUDIT_PLAN.md`

**Part 4 (Output Format) changes:**

- Replace nested schema. PRIMARY must show flat base schema.
- `performance_details` and `optimization` become OPTIONAL supplements
- Change `category` from sub-categories → `"performance"`
- Add fingerprint convention: `performance::<file>::<issue_slug>`

**After (standardized):**

```json
{
  "category": "performance",
  "title": "...",
  "fingerprint": "performance::components/List.tsx::missing-virtualization",
  "severity": "S2",
  "effort": "E2",
  "confidence": 75,
  "files": ["components/List.tsx:45"],
  "why_it_matters": "List renders 500+ items without virtualization, causing 2.1s INP",
  "suggested_fix": "Add react-window virtualization for lists >50 items",
  "acceptance_tests": ["INP < 200ms on list page", "Scroll behavior preserved"],
  "evidence": ["Lighthouse INP: 2100ms"],
  "symbols": ["UserList"]
}
```

### 2.4 DOCUMENTATION_AUDIT.md — Major Schema Realignment

**File:** `docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md`

**Part 4 (Output Format) changes:**

- **CRITICAL**: Change `confidence: "HIGH|MEDIUM|LOW"` → `confidence: 0-100`
  (numeric)
- Change `description` → `why_it_matters`
- Change `recommendation` → `suggested_fix`
- Add `acceptance_tests` (currently missing)
- Remove `id`, `stage`, `agent`, `verified` from base schema (these are
  orchestration metadata, not finding fields)
- Change `category` from sub-categories → `"documentation"`
- Add fingerprint convention: `documentation::<file>::<issue_slug>`

### 2.5 PROCESS_AUDIT.md — Schema Realignment

**File:** `docs/audits/multi-ai/templates/PROCESS_AUDIT.md`

**Part 4 (Output Format) changes:**

- Change `description` → `why_it_matters`
- Change `recommendation` → `suggested_fix`
- Add `acceptance_tests` (currently missing from schema example)
- Remove `id`, `stage`, `automation_type`, `tdms_category` from base schema
  (orchestration metadata)
- Change `category` from sub-categories → `"process"`
- Add fingerprint convention: `process::<file_or_scope>::<issue_slug>`

---

## Phase 3: Merge Refactoring Templates + Fix Outdated Info

### 3.1 Merge Two Refactoring Templates

- **Source A:** `REFACTOR_AUDIT_PROMPT.md` (10.7 KB, lean prompt)
- **Source B:** `REFACTOR_PLAN.md` (21.9 KB, full structure)

**Action:**

1. Create `REFACTORING_AUDIT.md` (matching naming convention: `*_AUDIT.md`)
2. Use REFACTOR_PLAN.md as the base (has full structure)
3. Incorporate any unique content from REFACTOR_AUDIT_PROMPT.md
4. Fix hardcoded stack versions (Next.js 16.1, React 19.2.3, etc.) → convert to
   `[Framework]: [Version]` placeholders
5. Apply standardized schema from Phase 2
6. Delete both original files

### 3.2 Update Model Names (All 8 Multi-AI Templates + AGGREGATOR)

**All files in `docs/audits/multi-ai/templates/`:**

- `Claude Opus 4.5` → `Claude Opus 4.6`
- Verify GPT-5-Codex and Gemini 3 Pro are current
- AGGREGATOR.md line 28: Update "Current as of 2026-01-05" → "Current as of
  2026-02-07"

### 3.3 Fix SonarQube References

**Multi-AI templates** (4 files): CODE_REVIEW_PLAN.md, SECURITY_AUDIT_PLAN.md,
PERFORMANCE_AUDIT_PLAN.md, PROCESS_AUDIT.md

- Remove `../analysis/sonarqube-manifest.md` reference from PRE-REVIEW CONTEXT
- Replace with note: "SonarCloud integration available via
  `npm run sonar:report` (see SonarCloud dashboard)"

**Single-session skills** (2 files):

- `.claude/skills/audit-code/SKILL.md` line 178: Update reference from
  `docs/analysis/sonarqube-manifest.md` → current SonarCloud approach
- `.claude/skills/audit-refactoring/SKILL.md` lines 58-59, 101, 115, 158, 168,
  176, 214: Replace all SonarQube references with SonarCloud equivalents

### 3.4 Fix PRE-REVIEW CONTEXT Accessibility

**All templates with PRE-REVIEW CONTEXT:** Add capability-conditional note:

```
NOTE: The references below require repository access. If your AI model cannot
browse files or run commands, skip to the audit prompt section below.
```

---

## Phase 4: Reduce Boilerplate Duplication

### 4.1 Create SHARED_TEMPLATE_BASE.md

**New file:** `docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md`

Extract these sections from all 7 templates into one shared file:

- Multi-Agent Capability Note
- AI Models to Use table (with model names)
- Anti-Hallucination Rules structure
- Severity & Effort scale definitions
- Output sections order (FINDINGS_JSONL, SUSPECTED_FINDINGS_JSONL,
  HUMAN_SUMMARY)
- Aggregation Process (embedded aggregator prompt)
- TDMS Integration section
- AI Instructions
- Quality checks checklist
- Related Documents

### 4.2 Trim Each Template

Replace duplicated sections with cross-references:

```
> See [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md#ai-models) for model recommendations.
```

Each template retains:

1. **Header/metadata** (version, tier, purpose — unique per template)
2. **Status Dashboard** (unique per audit run)
3. **Audit Context** (unique per domain)
4. **The prompt section** (unique per domain — this is the core content)
5. **Version History** (unique per template)

**Estimated size reduction:** ~196 KB total → ~80-90 KB total (55% reduction)

### 4.3 Update AGGREGATOR.md

- Update model names (Phase 3.2)
- Update "Current as of" date
- Verify schema alignment with Phase 2 changes

---

## Phase 5: Update fix-schema.js Field Mapping

### 5.1 Verify fix-schema.js Handles Transition

**File:** `scripts/multi-ai/fix-schema.js`

After Phase 2, external AIs should produce standard output. But `fix-schema.js`
must still handle:

- Legacy `description` → `why_it_matters` mapping (for backward compatibility)
- Legacy `recommendation` → `suggested_fix` mapping
- Legacy `remediation.steps` → `suggested_fix` extraction
- Legacy `HIGH/MEDIUM/LOW` → 0-100 confidence conversion
- Legacy sub-category → domain-level category normalization

**Action:** Verify these mappings still work. No removal — keep as fallbacks for
AIs that don't follow instructions perfectly.

### 5.2 Update JSONL_SCHEMA_STANDARD.md Related Documents

Update the Related Documents section to reference the merged
`REFACTORING_AUDIT.md` and new `SHARED_TEMPLATE_BASE.md`.

---

## Phase 6: Single-Session Skill Audit

### 6.1 Verify Schema Compliance

**Files:** All `.claude/skills/audit-*/SKILL.md`

Single-session skills already use `why_it_matters`/`suggested_fix`. Verify:

- Category values are domain-level (not sub-categories)
- Fingerprint format documented consistently
- Confidence is numeric 0-100 (not string)

### 6.2 Fix SonarQube References (already in Phase 3.3)

### 6.3 Cross-Reference Updates

If any skills reference `REFACTOR_PLAN.md` or `REFACTOR_AUDIT_PROMPT.md`, update
to `REFACTORING_AUDIT.md`.

---

## Files to Modify (Complete List)

### Standards (3 files)

| File                                      | Changes                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `CLAUDE.md`                               | Firebase version 12.6.0 → 12.8.0                                                 |
| `docs/templates/JSONL_SCHEMA_STANDARD.md` | Category clarification, flatten extensions, fingerprint convention, version bump |
| `docs/templates/CANON_QUICK_REFERENCE.md` | Category values alignment, version bump                                          |

### Multi-AI Templates (9 → 8 files after merge)

| File                                | Changes                                                                              | Impact |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| `CODE_REVIEW_PLAN.md`               | Model names, sonar ref, category examples, boilerplate → shared                      | Minor  |
| `SECURITY_AUDIT_PLAN.md`            | **Major schema realignment**, model names, sonar ref, boilerplate → shared           | Major  |
| `PERFORMANCE_AUDIT_PLAN.md`         | **Major schema realignment**, model names, sonar ref, boilerplate → shared           | Major  |
| `DOCUMENTATION_AUDIT.md`            | **Major schema realignment** (confidence format!), model names, boilerplate → shared | Major  |
| `PROCESS_AUDIT.md`                  | **Schema field renames**, model names, sonar ref, boilerplate → shared               | Medium |
| `ENGINEERING_PRODUCTIVITY_AUDIT.md` | Model names, category examples, boilerplate → shared                                 | Minor  |
| `REFACTORING_AUDIT.md`              | **NEW** — merged from REFACTOR_PLAN.md + REFACTOR_AUDIT_PROMPT.md                    | Major  |
| `AGGREGATOR.md`                     | Model names, date, schema alignment                                                  | Minor  |
| `SHARED_TEMPLATE_BASE.md`           | **NEW** — shared boilerplate extracted                                               | New    |

### Files to Delete (2)

| File                       | Reason                           |
| -------------------------- | -------------------------------- |
| `REFACTOR_AUDIT_PROMPT.md` | Merged into REFACTORING_AUDIT.md |
| `REFACTOR_PLAN.md`         | Merged into REFACTORING_AUDIT.md |

### Single-Session Skills (2 files)

| File                                        | Changes                                           |
| ------------------------------------------- | ------------------------------------------------- |
| `.claude/skills/audit-code/SKILL.md`        | SonarQube → SonarCloud reference                  |
| `.claude/skills/audit-refactoring/SKILL.md` | SonarQube → SonarCloud references (8 occurrences) |

### Pipeline Scripts (0 changes — verify only)

| File                                     | Action                                     |
| ---------------------------------------- | ------------------------------------------ |
| `scripts/multi-ai/fix-schema.js`         | Verify backward-compat mappings still work |
| `scripts/multi-ai/aggregate-category.js` | Verify domain-level categories handled     |

---

## Verification

1. **Schema validation**: Run `npm run validate:canon` on existing CANON files
   to ensure no regression
2. **Template extraction**: Verify the multi-ai-audit skill still extracts
   prompts correctly — test with
   `## [Category] Audit Prompt (Copy for Each AI Model)` header pattern match
3. **fix-schema.js**: Run against existing `.fixed.jsonl` files to verify
   normalization still works
4. **Markdown lint**: Run `npm run docs:lint` to check formatting
5. **Pattern check**: Run `npm run patterns:check` to ensure no anti-patterns
   introduced
6. **Doc index**: Run `npm run docs:index` to regenerate DOCUMENTATION_INDEX.md
   (new/renamed files)
7. **Cross-doc deps**: Verify DOCUMENT_DEPENDENCIES.md is updated for
   renamed/deleted files
8. **Pre-commit hook**: Full commit to verify all hooks pass

## Execution Order

1. Phase 1 (foundations) — must be first, establishes the standard
2. Phase 2 (schema standardization) — depends on Phase 1
3. Phase 3 (merge + outdated fixes) — depends on Phase 1, parallel with Phase 2
4. Phase 4 (boilerplate reduction) — depends on Phases 2 and 3 (templates must
   be finalized first)
5. Phase 5 (pipeline verification) — depends on Phase 2
6. Phase 6 (single-session skills) — independent, can parallel with Phase 2-4
