# SoNash Multi-AI Documentation Audit Plan

**Document Version:** 1.5 **Created:** 2026-01-05 **Last Updated:** 2026-01-07
**Status:** PENDING **Overall Completion:** 0%

---

## Purpose

This document serves as the **execution plan** for running a multi-AI
documentation quality audit on SoNash. Use this template when:

- Documentation inconsistencies have accumulated
- Cross-references may be broken or stale
- Documentation coverage gaps suspected
- After major refactoring or restructuring
- Quarterly documentation health check
- Before major release or documentation publication

**Review Focus Areas (5 Categories):**

1. Cross-Reference Consistency (broken links, outdated references)
2. Documentation Staleness (outdated content, deprecated info)
3. Coverage Gaps (missing docs, undocumented features)
4. Tier Compliance (structure and organization)
5. Frontmatter & Metadata Consistency

**Expected Output:** Documentation findings with remediation plan, coverage
analysis, and quality metrics.

---

## Status Dashboard

| Step   | Description                                   | Status  | Completion |
| ------ | --------------------------------------------- | ------- | ---------- |
| Step 1 | Prepare audit context                         | PENDING | 0%         |
| Step 2 | Run multi-AI documentation audit (3-4 models) | PENDING | 0%         |
| Step 3 | Collect and validate outputs                  | PENDING | 0%         |
| Step 4 | Run aggregation                               | PENDING | 0%         |
| Step 5 | Create canonical findings doc                 | PENDING | 0%         |
| Step 6 | Generate remediation plan                     | PENDING | 0%         |

**Overall Progress:** 0/6 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: https://github.com/jasonmichaelbell78-creator/sonash-v0
Branch: claude/new-session-sKhzO
Commit: e12f222f730bc84c0a48a4ccf7e308fa26767788
Last Documentation Audit: 2026-01-05
```

### Documentation Structure

```
Documentation Tiers:
- Tier 1: Root-level docs (README.md, ROADMAP.md, ARCHITECTURE.md)
- Tier 2: Core standards (docs/SECURITY.md, docs/GLOBAL_SECURITY_STANDARDS.md, DEVELOPMENT.md, INTEGRATED_IMPROVEMENT_PLAN.md)
- Tier 3: Specialized docs (AI_REVIEW_LEARNINGS_LOG.md, AI_WORKFLOW.md, SESSION_CONTEXT.md)
- Tier 4: Reference docs (docs/templates/, docs/decisions/, docs/guides/)
- Tier 5: Archive (docs/archive/completed-plans/, docs/archive/old-reviews/)

Documentation Directories:
- docs/: Core project documentation and standards
- docs/guides/: How-to guides and tutorials
- docs/templates/: Reusable document templates for audits and reviews
- docs/decisions/: Architecture decision records (ADRs)
- docs/archive/: Completed plans and historical documents
- docs/reviews/: Multi-AI audit plans and results
```

### Scope

```
Include: [directories, e.g., docs/, README.md, ARCHITECTURE.md, *.md in root]
Secondary: [optional, e.g., inline code comments, JSDoc]
Exclude: [directories, e.g., node_modules/, build artifacts]
```

### Known Documentation Issues

Known issues prompting this audit:

- 4 broken links identified in SECURITY_AUDIT_PLAN_2026_Q1.md (Documentation
  Lint)
- Multiple placeholder tokens remaining in 2026-Q1 audit plans
- Missing quick start sections in some audit plans
- Inconsistent relative path usage across plan files

---

## AI Models to Use

**Recommended configuration (3-4 models for consensus):**

| Model                                                    | Capabilities                       | Documentation Strength                                            |
| -------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Claude Opus (verify exact version at runtime)            | browse_files=yes, run_commands=yes | Comprehensive doc analysis, link validation, consistency checking |
| Claude Sonnet (verify exact version at runtime)          | browse_files=yes, run_commands=yes | Cost-effective doc review, pattern detection                      |
| OpenAI Codex-class model (verify exact name at runtime)  | browse_files=yes, run_commands=yes | Coverage analysis, structure validation                           |
| Google Gemini-class model (verify exact name at runtime) | browse_files=yes, run_commands=yes | Alternative perspective, freshness assessment                     |

**Selection criteria:**

- At least 2 models with `run_commands=yes` for link validation
- At least 1 model with strong technical writing assessment
- Total 3-4 models recommended for good consensus

---

## Documentation Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

````markdown
ROLE

You are a technical documentation specialist performing a comprehensive
documentation quality audit. Your goal is to assess documentation completeness,
accuracy, consistency, and usability.

REPO

https://github.com/jasonmichaelbell78-creator/sonash-v0

DOCUMENTATION STRUCTURE

- Tier system: 5-tier hierarchy (Tier 1-2: Root-level, Tier 3-5: docs/
  subdirectories)
- Main directories:
  - docs/
  - docs/templates/
  - docs/reviews/
  - docs/archive/
  - docs/agent_docs/
- Documentation standards: docs/DOCUMENTATION_STANDARDS.md (v1.2)

PRE-REVIEW CONTEXT (CAPABILITY-TIERED)

**IF browse_files=yes:** Read these files BEFORE starting analysis:

1. docs/AI_REVIEW_LEARNINGS_LOG.md (documented documentation issues from Reviews
   #1-80+)
2. docs/DOCUMENTATION_STANDARDS.md (if exists - documentation requirements)
3. SESSION_CONTEXT.md (example of required structure)

**IF browse_files=no:** Use this inline context instead:

<inline-context id="documentation-structure">
## Documentation Tier System

**Tier 1 (Root-level, user-facing):**

- README.md - Project overview, quick start
- ROADMAP.md - Current sprint, priorities
- ARCHITECTURE.md - System design

**Tier 2 (Core standards, developer-facing):**

- docs/SECURITY.md - Security policies
- docs/GLOBAL_SECURITY_STANDARDS.md - Mandatory security requirements
- DEVELOPMENT.md - Development setup, workflows
- INTEGRATED_IMPROVEMENT_PLAN.md - Multi-phase improvement tracking

**Tier 3 (Specialized, AI/automation):**

- docs/AI_REVIEW_LEARNINGS_LOG.md - Pattern history from 80+ reviews
- docs/AI_WORKFLOW.md - AI session workflow
- SESSION_CONTEXT.md - Quick session context (root level)

**Known Documentation Issues:**

- Cross-references may be stale (file moves, renames)
- Version history sections may be incomplete
- Some template placeholders remain unfilled
- Audit plans reference docs without inline summaries </inline-context>

**Additional context (for models with run_commands=yes):**

- Run: find docs -name "\*.md" | wc -l (count total docs)
- Run: grep -rn "TODO\|FIXME\|TBD" docs/ (find incomplete sections)
- Run: git log --oneline docs/ | head -20 (recent doc changes)

SCOPE

Include: [directories] Secondary: [optional directories] Exclude: [excluded
directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>,
repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:

- Run in "NO-REPO MODE": Cannot complete full audit without repo access
- **Required NO-REPO MODE Output**:
  1. CAPABILITIES header with limitation clearly noted
  2. QUALITY_METRICS_JSON with null values:
     ```json
     {
       "doc_count": null,
       "broken_link_count": null,
       "missing_required_sections_count": null,
       "stale_reference_count": null,
       "gap_reason": "Unable to assess without repository access"
     }
     ```
  3. Empty FINDINGS_JSONL section (print header `FINDINGS_JSONL` and output zero
     lines)
  4. Empty SUSPECTED_FINDINGS_JSONL section (print header
     `SUSPECTED_FINDINGS_JSONL` and output zero lines)
  5. HUMAN_SUMMARY explaining limitation and how to proceed
- Do NOT attempt link validation or invent documentation issues

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A documentation finding is CONFIRMED only if it includes:

- at least one concrete file path AND
- at least one specific issue (broken link, missing section, outdated info)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these 5 categories)

1. Cross-Reference Consistency
2. Documentation Staleness
3. Coverage Gaps
4. Tier Compliance
5. Frontmatter & Metadata
```
````

### Part 3: Documentation Audit Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning, verify you can access the repository:

1. State whether you can access files
2. If YES, list 5-10 documentation files you can see
3. If NO, proceed with limited analysis

PHASE 2: DOCUMENTATION INVENTORY

Create a complete inventory:

- List all markdown files in scope
- Note file sizes and last modified dates
- Identify documentation clusters (related docs)
- Map cross-reference patterns
- Identify orphaned documents (no incoming links) At the end: "Phase 2
  complete - Documentation inventory: [count] files"

PHASE 3: CATEGORY-BY-CATEGORY ANALYSIS

For each of the 5 categories, perform systematic analysis:

Category 1: Cross-Reference Consistency CHECKS: [ ] All internal links work (no
404s) [ ] All cross-references use correct paths [ ] No references to
moved/deleted files [ ] Anchor links are valid [ ] No circular reference chains
[ ] References to archived docs use proper notation

ANALYSIS:

- Extract all markdown links using `[text]` + `(path)` syntax
- Verify each target file exists
- Check relative vs absolute path correctness
- Identify broken links
- Identify stale references to renamed files

VERIFICATION COMMANDS (if available):

- grep -Er '\[[^]]+\]\([^)]+\)' --include="\*.md" (extract markdown links;
  avoids over-matching)
- For each link, check if target file exists
- npm run docs:check (if validation script exists)

Mark each check: ISSUE | OK | N/A List specific broken links with source and
target.

Category 2: Documentation Staleness CHECKS: [ ] No references to deprecated
features [ ] Version numbers are current [ ] Screenshots/examples are up-to-date
[ ] API references match current implementation [ ] Dependencies mentioned are
current versions [ ] "TODO" or "WIP" sections addressed or noted [ ]
Last-updated dates are recent (if used)

ANALYSIS:

- Check for version mismatches
- Look for "deprecated", "old", "legacy" mentions
- Verify code examples still work
- Check if major features lack documentation updates
- Identify docs not updated in 6+ months for active features

PATTERNS TO FIND:

- "TODO:", "FIXME:", "WIP:"
- Version references (e.g., "v1.0", "Node 14")
- Date references that are old
- References to removed packages/features

Mark each check: ISSUE | OK | N/A List specific stale content with file paths.

Category 3: Coverage Gaps CHECKS: [ ] All major features documented [ ]
Setup/installation instructions present [ ] Configuration options documented [ ]
API endpoints documented [ ] Error handling documented [ ] Security
considerations documented [ ] Testing procedures documented [ ] Deployment
process documented

ANALYSIS:

- Compare code features to documentation
- Identify undocumented public APIs
- Check for missing "How To" guides
- Identify missing troubleshooting sections
- Check for missing architecture diagrams

VERIFICATION COMMANDS (if available):

- Compare feature list in code vs docs
- grep for public functions/APIs without docs
- Check for common sections (Setup, Usage, Troubleshooting)

Mark each check: GAP | COVERED | N/A List specific missing documentation areas.

Category 4: Tier Compliance (if tier system exists)

**Note:** This category is OPTIONAL. Skip and mark all checks as N/A if the
project doesn't use a documentation tier system.

CHECKS: [ ] Docs are in correct tier folders [ ] Tier 1 docs are root-level
essentials only [ ] Tier 2 docs are core guides [ ] Tier 3 docs are specialized
content [ ] Tier 4 docs are reference materials [ ] Tier 5 (archive) contains
only historical docs [ ] No active docs in archive folder

ANALYSIS:

- Review file locations vs tier definitions
- Identify misplaced documents
- Check if archived docs are properly marked
- Verify tier structure makes sense

VERIFICATION:

- List files in each tier
- Verify against tier definitions
- Check for violations

Mark each check: ISSUE | OK | N/A List specific tier violations with
recommendations.

Category 5: Frontmatter & Metadata CHECKS: [ ] All docs have required
frontmatter (if standard exists) [ ] Document versions are tracked [ ] Authors
are listed (if required) [ ] Creation/update dates present (if required) [ ]
Status indicators used correctly [ ] Tags/categories consistent [ ] Required
fields populated

ANALYSIS:

- Check first 10 lines of each doc for frontmatter
- Verify consistency across documents
- Identify missing required fields
- Check for metadata format consistency

VERIFICATION COMMANDS (if available):

- grep -A 10 "^---$" --include="\*.md" (extract frontmatter)
- Check frontmatter schema compliance

Mark each check: ISSUE | OK | N/A List specific frontmatter issues.

After each category: "Category X complete - Issues found: [number]"

---

Category 6: Template-Instance Synchronization

**Note:** This category validates that documents derived from templates are
properly synced. Check DOCUMENT_DEPENDENCIES.md for template-instance
relationships.

CHECKS: [ ] All template-derived instances are listed in
DOCUMENT_DEPENDENCIES.md [ ] No `[e.g., ...]` or `[X]` placeholders remaining in
instances [ ] Instances follow template section structure [ ] "Last Synced"
dates in DOCUMENT_DEPENDENCIES.md are recent (<90 days) [ ] Broken links to
moved files (e.g., ../../SECURITY.md should be ../SECURITY.md)

ANALYSIS:

- Read DOCUMENT_DEPENDENCIES.md to identify template-instance pairs
- For each instance, grep for `[e.g.,` and `[X]` patterns
- Verify instances have same section structure as templates
- Check if any templates were updated but instances weren't
- Identify any broken relative links

VERIFICATION COMMANDS (if available):

- `grep -r "\[e\.g\.," docs/reviews/2026-Q1/*.md | wc -l` (should be 0)
- `grep -r "\[X\]" docs/reviews/2026-Q1/*.md | wc -l` (should be 0)
- Check DOCUMENT_DEPENDENCIES.md "Last Synced" dates
- Verify all sync statuses are ✅ SYNCED

Mark each check: ISSUE | OK | N/A List specific template-instance sync issues.

After each category: "Category X complete - Issues found: [number]"

---

PHASE 4: DRAFT DOCUMENTATION FINDINGS

For each issue, create detailed entry:

- Exact file path
- Issue description
- Impact on documentation usability
- Severity (S0/S1/S2/S3)
- Effort to fix (E0/E1/E2/E3)
- Recommended fix
- Verification steps

Documentation Severity Guide:

- S0 (Critical): Broken core documentation, major feature undocumented
- S1 (High): Multiple broken links, significant coverage gaps
- S2 (Medium): Minor broken links, inconsistency, staleness
- S3 (Low): Formatting issues, minor improvements

Number findings sequentially. At the end: "Phase 4 complete - Total
documentation findings: [count]"

PHASE 5: QUALITY METRICS

Calculate documentation quality metrics:

- Total documentation files: [count]
- Broken links count: [count]
- Orphaned documents: [count]
- Stale documents (>6 months, active features): [count]
- Coverage score (estimated): [X%]
- Tier compliance score: [X%]

PHASE 6: RECOMMENDATIONS SUMMARY

Prioritize by:

1. Impact on usability (higher first)
2. Effort to fix (lower first)
3. Number of affected files

Identify:

- Critical fixes (must do immediately)
- Important improvements (should do soon)
- Nice-to-have enhancements

At the end: "Phase 6 complete - Ready to output"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order:

1. QUALITY_METRICS_JSON { "audit_date": "2026-01-06", "total_docs": X,
   "broken_links_count": X, "orphaned_docs_count": X, "stale_docs_count": X,
   "coverage_score": "X%", "tier_compliance_score": "X%" }

2. FINDINGS_JSONL (one JSON object per line, each must be valid JSON)

Schema: { "category": "Cross-Reference|Staleness|Coverage Gaps|Tier
Compliance|Frontmatter", "title": "short, specific issue", "fingerprint":
"<category>::<primary_file>::<issue_type>", "severity": "S0|S1|S2|S3", "effort":
"E0|E1|E2|E3", "confidence": 0-100, "files": ["path1", "path2"],
"issue_details": { "description": "what's wrong", "impact": "how it affects
users", "examples": ["specific instances"] }, "remediation": { "steps": ["step
1", "step 2"], "verification": ["how to verify fix"] }, "evidence": ["grep
output or link checks"], "notes": "optional" }

3. SUSPECTED_FINDINGS_JSONL (same schema, but confidence <= 40; needs manual
   verification)

4. HUMAN_SUMMARY (markdown)

- Documentation quality overview
- Critical issues requiring immediate attention
- Top 5 documentation improvements
- Coverage gaps to address
- Recommended fix order
```

### Part 5: Documentation Verification Commands

```markdown
DOCUMENTATION VERIFICATION (run if run_commands=yes)

1. Link Extraction (internal links only):

- grep -rn -E "\[._?\]\(._?\)" --include="_.md" | grep -v "http://" | grep -v
  "https://" | head -50 (Filters out external URLs, showing only
  internal/relative links. Uses non-greedy ._? to avoid over-matching)

2. Broken Link Detection:

- For each extracted internal link, check: test -f [target_path]
- Strip anchor fragments (#section) before checking file existence:
  path="${link%#\*}"
- External links (http/https) should be verified separately if needed

3. Stale Content Detection:

- grep -rn "TODO:\|FIXME:\|WIP:" --include="\*.md"
- git log --since="6 months ago" --name-only -- "\*.md" | sort -u

4. Frontmatter Check:

- grep -A 10 "^---$" --include="\*.md" docs/ | head -100

5. Documentation Stats:

- find docs/ -name "\*.md" | wc -l
- find docs/ -name "\*.md" -exec wc -l {} + | sort -n | tail -20

Paste only minimal excerpts as evidence.
```

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:

- `[model-name]_metrics.json`
- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Documentation Aggregator

```markdown
ROLE

You are the Documentation Audit Aggregator. Merge multiple AI documentation
audit outputs into one prioritized remediation plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent documentation issues not in auditor outputs
- Prioritize by impact on documentation usability

DEDUPLICATION RULES

1. Primary merge: same file + same issue type
2. Secondary merge: same broken link reported by multiple models
3. Take union of all broken links found
4. Take most complete coverage gap analysis

SEVERITY HANDLING

If models disagree on severity:

- Take HIGHER severity if 2+ models agree
- For broken links: Always S1 minimum if confirmed

OUTPUT

1. CONSOLIDATED_METRICS_JSON
2. DEDUPED_FINDINGS_JSONL (with canonical_id)
3. REMEDIATION_PLAN_JSON (ordered by priority)
4. HUMAN_SUMMARY
```

### Step 3: Create Documentation Findings Document

Create `docs/reviews/DOCUMENTATION_AUDIT_[YYYY]_Q[X].md` with:

- Quality metrics dashboard
- All findings with remediation steps
- Prioritized fix order
- Estimated effort for full remediation

---

## Implementation Workflow

After aggregation, remediate findings using this workflow:

### Step 1: Documentation Fix Implementer

```markdown
ROLE

You are a Technical Writer implementing fixes from a documentation audit.

HARD RULES

- Fix documentation issues ONLY - no code changes unless updating examples
- Verify all link fixes work
- Maintain consistent voice and style
- Follow project documentation standards

PROCESS

1. Implement fix
2. Verify links with docs:check or manual testing
3. Check for related documentation that needs updates
4. Update last-modified dates if required
```

### Step 2-4: Same as Code Review Template

Use R1, R2, and Between-PR checklist from MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md.

---

## Audit History

| Date       | Type                | Trigger                 | Models Used       | Findings    | Quality Score |
| ---------- | ------------------- | ----------------------- | ----------------- | ----------- | ------------- |
| 2026-01-06 | Documentation Audit | Step 4.2 Multi-AI Audit | Pending execution | Not yet run | N/A           |

---

## AI Instructions

When using this template:

1. **Copy this template** to
   `docs/reviews/DOCUMENTATION_AUDIT_PLAN_[YYYY]_Q[X].md`
2. **Fill in Audit Context** with project-specific details
3. **Run the documentation audit prompt** on each model
4. **Collect outputs** in specified formats
5. **Run aggregation** for consolidated findings
6. **Create canonical findings doc**
7. **Prioritize by impact/effort**
8. **Update MULTI_AI_REVIEW_COORDINATOR.md** with audit results

**Quality checks before finalizing:**

- [ ] All 5 categories covered
- [ ] Broken links verified manually
- [ ] Coverage gaps validated against code
- [ ] Tier compliance checked
- [ ] Remediation steps actionable

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** -
  Canonical JSONL schema for all review templates
- **[MULTI_AI_REVIEW_COORDINATOR.md](../../MULTI_AI_REVIEW_COORDINATOR.md)** -
  Master index and trigger tracking
- **[CODE_REVIEW_PLAN_2026_Q1.md](./CODE_REVIEW_PLAN_2026_Q1.md)** - General
  code review template
- **[DOCUMENTATION_STANDARDS.md](../../DOCUMENTATION_STANDARDS.md)** -
  Documentation standards (if exists)
- **[docs/README.md](../../README.md)** - Documentation inventory

---

## Version History

| Version | Date       | Changes                                                                                                                                                | Author |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1.5     | 2026-01-07 | Review #87: Added QUALITY_METRICS_JSON null schema; removed stray code fence in NO-REPO section                                                        | Claude |
| 1.4     | 2026-01-07 | Review #82: Made NO-REPO headers explicit (FINDINGS_JSONL, SUSPECTED_FINDINGS_JSONL); added docs/ prefix to Tier 3 paths                               | Claude |
| 1.3     | 2026-01-07 | Review #81: Standardized "LIMITED MODE" → "NO-REPO MODE"; added 5-point NO-REPO MODE output contract                                                   | Claude |
| 1.2     | 2026-01-07 | Added capability-tiered PRE-REVIEW CONTEXT: browse_files=yes models read files, browse_files=no models get inline summary of documentation tier system | Claude |
| 1.1     | 2026-01-06 | Review #68: Fixed link extraction regex to use grep -E for extended regex; Escaped brackets in pattern                                                 | Claude |
| 1.0     | 2026-01-05 | Initial template creation - Documentation audit category added to multi-AI review framework                                                            | Claude |

---

**END OF MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md**
