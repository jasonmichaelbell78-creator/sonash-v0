<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Status:** DRAFT
<!-- prettier-ignore-end -->

# Implementation Plan: audit-enhancements Skill + Improvement Management System (IMS)

## Summary

Create a new `audit-enhancements` skill that performs a comprehensive,
multi-pass enhancement audit of the **entire** project - code, product, UX,
content, workflows, infrastructure, external services, and the meta-layer
(audit/skill system itself). Produces findings in a parallel Improvement
Management System (IMS) with its own JSONL schema, intake pipeline, and views.
Includes a multi-AI template for cross-model consensus audits.

---

## Decision Record (from Q&A)

| Decision                  | Choice                                                     |
| ------------------------- | ---------------------------------------------------------- |
| Name                      | `audit-enhancements`                                       |
| Tracking system           | Parallel IMS (MASTER_IMPROVEMENTS.jsonl)                   |
| Impact scale              | I0-I3 (mirrors S0-S3)                                      |
| Effort scale              | E0-E3 (same as existing)                                   |
| Honesty guards            | Mandatory counter-arguments + confidence threshold (70%+)  |
| Positive findings         | Report "Strengths" section only (not JSONL items)          |
| Comprehensive integration | Standalone only (not in audit-comprehensive)               |
| Trigger                   | Manual only                                                |
| Session scope             | Multi-session as needed (single audit, not single session) |
| State persistence         | File + MCP memory hybrid                                   |
| Recovery UX               | Flag sensitivity issues but don't deep-dive                |
| TDMS overlap              | Cross-reference actively                                   |
| Roadmap integration       | Interactive one-by-one walkthrough at end                  |
| Staleness                 | Re-evaluate on change                                      |
| Agent structure           | Multi-pass adaptive (broad scan → deep-dives)              |
| Content eval              | Full content review                                        |
| Testing eval              | Evaluate testing strategy                                  |
| Docs eval                 | Evaluate documentation strategy                            |
| Workflow eval             | Full dev lifecycle                                         |
| Meta-improvements         | Yes, can evaluate the audit system itself                  |
| Code examples             | Only when helpful for implementation                       |
| External services         | Include (Firebase, Sentry, etc.)                           |
| Benchmarking              | Competitor/peer review via web search                      |
| Consolidation bias        | Both directions (merit-based, no bias)                     |
| UX data                   | Heuristic analysis only                                    |
| Schema fields             | All fields that maximize implementation context            |
| Review format             | One-by-one walkthrough with pros/cons/counter-arguments    |
| Alternatives              | Concrete (name specific libraries, patterns)               |
| Multi-AI template         | Yes, include injectable prompt for other AI systems        |

---

## Files to Create/Modify

### New Files (12)

1. **`.claude/skills/audit-enhancements/SKILL.md`** - Main skill definition
2. **`docs/multi-ai-audit/templates/ENHANCEMENT_AUDIT.md`** - Multi-AI
   injectable template
3. **`scripts/improvements/intake-audit.js`** - Intake script (forked from
   `scripts/debt/intake-audit.js`)
4. **`scripts/improvements/generate-views.js`** - View generator (forked from
   `scripts/debt/generate-views.js`)
5. **`scripts/improvements/generate-metrics.js`** - Metrics for session-start
   hook
6. **`scripts/improvements/validate-schema.js`** - Schema validation
7. **`scripts/improvements/dedup-multi-pass.js`** - Multi-pass deduplication
8. **`scripts/improvements/resolve-item.js`** - Single item resolution
   (Accept/Decline/Defer)
9. **`scripts/config/improvement-schema.json`** - Schema definition
10. **`docs/templates/IMPROVEMENT_JSONL_SCHEMA.md`** - Schema documentation
11. **`docs/improvements/MASTER_IMPROVEMENTS.jsonl`** - Canonical improvement
    store (starts empty)
12. **`docs/improvements/metrics.json`** - Machine-readable metrics (generated)

### New Directories

- `scripts/improvements/`
- `docs/improvements/`
- `docs/improvements/views/`
- `docs/improvements/logs/`
- `docs/improvements/raw/`
- `docs/audits/single-session/enhancements/`
- `.claude/skills/audit-enhancements/`

### Modified Files (2)

1. **`scripts/config/audit-schema.json`** - Add `"enhancements"` to valid
   categories
2. **`.claude/skills/SKILL_INDEX.md`** - Add audit-enhancements entry

---

## Step 1: Create Directory Structure

```
mkdir -p scripts/improvements
mkdir -p docs/improvements/views
mkdir -p docs/improvements/logs
mkdir -p docs/improvements/raw
mkdir -p docs/audits/single-session/enhancements
mkdir -p .claude/skills/audit-enhancements
```

Initialize `docs/improvements/MASTER_IMPROVEMENTS.jsonl` as empty file.

---

## Step 2: Define Improvement JSONL Schema (`scripts/config/improvement-schema.json`)

```json
{
  "validCategories": [
    "app-architecture",
    "product-ux",
    "content",
    "devx-automation",
    "infrastructure",
    "testing-strategy",
    "documentation-strategy",
    "workflow-lifecycle",
    "external-services",
    "meta-tooling"
  ],
  "validImpacts": ["I0", "I1", "I2", "I3"],
  "validEfforts": ["E0", "E1", "E2", "E3"],
  "validStatuses": [
    "PROPOSED",
    "ACCEPTED",
    "DECLINED",
    "DEFERRED",
    "IMPLEMENTED",
    "STALE"
  ],
  "confidenceThreshold": 70,
  "idPrefix": "ENH",
  "idPattern": "^ENH-\\d{4,}$"
}
```

### Improvement JSONL Item Schema

```json
{
  "id": "ENH-0001",
  "category": "app-architecture",
  "title": "Short, specific description",
  "fingerprint": "category::file_or_scope::improvement-slug",
  "impact": "I0|I1|I2|I3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "status": "PROPOSED",
  "files": ["path/to/file.ts:line"],

  "current_approach": "What exists now and why it was done this way",
  "proposed_outcome": "What the improved version looks like - direction, patterns, or code",
  "counter_argument": "Why NOT to make this change. Honest assessment of risks/costs",
  "why_it_matters": "The potential benefit - what improves if this is implemented",
  "suggested_fix": "Concrete implementation direction",
  "concrete_alternatives": ["Library X", "Pattern Y", "Approach Z"],

  "implementation_notes": "Specific guidance for Claude Code on how to implement",
  "affected_workflows": ["dev lifecycle step", "user-facing flow"],
  "dependencies": ["ENH-XXXX", "DEBT-XXXX", "other prerequisite"],
  "risk_assessment": "What could go wrong during or after implementation",
  "tdms_crossref": ["DEBT-0123", "DEBT-0456"],

  "acceptance_tests": ["Verification step 1", "Verification step 2"],
  "evidence": ["grep output", "benchmark", "code snippet"],
  "benchmarks": {"competitor": "How competitor X handles this"},

  "content_hash": "sha256-for-dedup",
  "source_audit": "audit-enhancements-2026-02-11",
  "created": "2026-02-11",
  "decided_date": null,
  "decision_notes": null
}
```

### Impact Scale Definitions

| Level | Name           | Definition                                                                       | Examples                                                             |
| ----- | -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| I0    | Transformative | Changes how things fundamentally work. Significant user or dev experience shift. | New architecture pattern, major UX overhaul, workflow transformation |
| I1    | Significant    | Meaningful, measurable improvement to quality, speed, or experience.             | Component consolidation, testing strategy change, content rewrite    |
| I2    | Moderate       | Nice-to-have improvement. Incremental benefit.                                   | Config optimization, better error messages, minor UX tweak           |
| I3    | Minor          | Polish. Small quality-of-life improvement.                                       | Naming consistency, slightly better logging, micro-optimization      |

---

## Step 3: Create the Skill (`SKILL.md`)

### Structure Overview

The skill follows the established audit pattern but with a **4-phase multi-pass
adaptive architecture**:

```
Phase 1: Broad Scan (8 parallel agents, one per domain)
  → Each agent surveys its domain, produces preliminary findings
  → Output: stage-1-*.jsonl (preliminary findings per domain)

Phase 2: Deep Dive (N targeted agents based on Phase 1 results)
  → Agents spawned for top-opportunity areas identified in Phase 1
  → Includes competitor/peer benchmarking via web search
  → Output: stage-2-*.jsonl (deep findings with full schema)

Phase 3: Cross-Cutting Synthesis (1-2 sequential agents)
  → Cross-domain pattern detection
  → TDMS cross-referencing
  → Dedup and consolidation
  → Strengths section compilation
  → Output: all-findings-deduped.jsonl + ENHANCEMENT_AUDIT_REPORT.md

Phase 4: Interactive Review (conversational, spans sessions if needed)
  → One-by-one walkthrough of findings
  → For each: present description, use case, pros, cons, counter-argument, alternatives
  → User decides: ACCEPTED / DECLINED / DEFERRED
  → Accepted items optionally tagged with roadmap milestone
  → Output: Updated MASTER_IMPROVEMENTS.jsonl with decisions
```

### Phase 1: Broad Scan - 8 Parallel Agents

**Agent 1: App Architecture Scanner**

- Component patterns, state management, data flow, code organization
- Files: `app/`, `components/`, `lib/`, `hooks/`, `types/`

**Agent 2: Product & UX Scanner**

- User journeys, accessibility, interaction patterns, responsive design
- Files: `app/`, `components/`, `styles/`, `public/`
- Method: Heuristic analysis, recovery-context sensitivity flags

**Agent 3: Content Scanner**

- Microcopy, button labels, error messages, onboarding text, help text
- Recovery-domain terminology appropriateness
- Files: `app/`, `components/` (string literals, i18n files)

**Agent 4: DevX & Automation Scanner**

- Scripts, hooks, skills, commands, CI/CD, pre-commit pipeline
- Files: `scripts/`, `.claude/`, `.github/`, `.husky/`, `package.json`

**Agent 5: Infrastructure & Stack Scanner**

- Firebase config, build config, dependency choices, deployment
- Files: `firebase.json`, `next.config.*`, `package.json`, `functions/`

**Agent 6: Testing Strategy Scanner**

- Test patterns, coverage approach, maintenance burden, ROI of test suite
- Files: `tests/`, `__tests__/`, `*.test.*`, test configs

**Agent 7: Documentation Strategy Scanner**

- Doc organization, freshness, usefulness, AI-workflow doc effectiveness
- Files: `docs/`, `*.md`, `CLAUDE.md`, `AI_WORKFLOW.md`

**Agent 8: Workflow & External Scanner**

- Full dev lifecycle mapping, session patterns, external service config
- Friction points in: session start → coding → testing → commit → deploy
- External: Firebase project, Sentry, analytics, hosting

### Phase 2: Deep Dive - Adaptive Agents

After Phase 1 completes:

1. Rank all preliminary findings by impact potential
2. Identify top 5-8 opportunity clusters
3. Spawn targeted deep-dive agents for each cluster
4. Deep-dive agents produce full-schema findings with:
   - `current_approach` (what exists now)
   - `proposed_outcome` (what it would look like)
   - `counter_argument` (why NOT to do this)
   - `concrete_alternatives` (specific tools/patterns/libraries)
   - `implementation_notes` (for Claude Code)
   - Web search for competitor benchmarking where relevant
5. Include meta-improvements (evaluate the audit/skill system itself)

### Phase 3: Synthesis

1. Merge all stage-1 and stage-2 JSONL files
2. Deduplicate by fingerprint (primary) and evidence overlap (secondary)
3. Cross-reference against MASTER_DEBT.jsonl - link related items via
   `tdms_crossref`
4. Apply confidence threshold: findings below 70% go to "inconclusive" section
5. Validate all findings have `counter_argument` (honesty guard)
6. Compile "Strengths" section (areas evaluated and found good-as-is)
7. Generate ENHANCEMENT_AUDIT_REPORT.md with:
   - Executive summary
   - Strengths section (what's working well)
   - Findings by impact level (I0 → I3)
   - Inconclusive section (confidence < 70%)
   - TDMS cross-references
   - Meta-improvement findings (separate section)

### Phase 4: Interactive Review

Present each finding one-by-one:

```
## Finding ENH-XXXX: [Title]
**Impact:** I1 | **Effort:** E2 | **Confidence:** 85%
**Category:** app-architecture

### Current Approach
[What exists now and why]

### Proposed Improvement
[What it would look like]

### Why It Matters
[The benefit]

### Counter-Argument
[Why NOT to do this]

### Concrete Alternatives
- [Alternative 1 with brief description]
- [Alternative 2 with brief description]

### Related TDMS Items
- DEBT-0123: [Title]

### Risk Assessment
[What could go wrong]

---
**Decision:** ACCEPT / DECLINE / DEFER / DISCUSS
```

After each decision:

- Write decision to the finding's `status`, `decided_date`, `decision_notes`
- If ACCEPTED: ask about roadmap placement
- If DECLINED: record reason in `decision_notes`
- If DEFERRED: mark for re-evaluation
- Save state to MCP memory for session continuity

### State Persistence

**File-based (source of truth):**

- `${AUDIT_DIR}/audit-state.json` tracks:
  - Current phase (1-4)
  - Completed agents
  - Review progress (finding X of Y)
  - Decisions made so far

**MCP memory (quick-access cache):**

- Save audit state to memory after each phase
- Save review progress after each decision batch
- Enables resuming after session boundary or context compaction

### Honesty Guardrails

1. **Mandatory counter-argument**: Every finding MUST include `counter_argument`
   field. If agent cannot articulate a genuine reason not to make the change,
   the finding is suspect.

2. **Confidence threshold**: Findings with `confidence < 70` go to
   "Inconclusive" section, not main findings. Prevents suggestion inflation.

3. **Evidence requirement**: Same as other audits - concrete file path +
   specific indicator required for CONFIRMED status. Otherwise → inconclusive.

4. **No-change validation**: Phase 1 agents must explicitly list areas they
   evaluated and found adequate. These become the "Strengths" section.

### Persistence Rules (same as audit-process)

- EVERY agent MUST write outputs to files, NEVER rely on conversation context
- After each parallel stage, verify all output files exist and are non-empty
- If any file missing, re-run the failed agent before proceeding
- AUDIT_DIR variable must be verified before each agent spawn

---

## Step 4: Create IMS Scripts (forked from TDMS)

### `scripts/improvements/intake-audit.js` (~400 lines)

Fork from `scripts/debt/intake-audit.js` with changes:

- ID prefix: `ENH-` instead of `DEBT-`
- Schema: improvement fields instead of debt fields
- Target: `docs/improvements/MASTER_IMPROVEMENTS.jsonl`
- Field mapping: `impact` instead of `severity`, improvement-specific categories
- Status default: `PROPOSED` instead of `NEW`
- Cross-reference: check MASTER_DEBT.jsonl for `tdms_crossref` matches

### `scripts/improvements/generate-views.js` (~300 lines)

Fork from `scripts/debt/generate-views.js` with changes:

- Views: `by-impact.md`, `by-category.md`, `by-status.md`, `review-queue.md`
- ID preservation using `ENH-` prefix
- Status preservation from existing MASTER_IMPROVEMENTS.jsonl

### `scripts/improvements/generate-metrics.js` (~150 lines)

Fork from `scripts/debt/generate-metrics.js` with changes:

- Counts by impact (I0-I3) instead of severity (S0-S3)
- Status breakdown: PROPOSED/ACCEPTED/DECLINED/DEFERRED/IMPLEMENTED/STALE
- Output: `docs/improvements/metrics.json`

### `scripts/improvements/validate-schema.js` (~200 lines)

Fork from `scripts/debt/validate-schema.js` with changes:

- Validate improvement-specific required fields
- Validate `ENH-` ID format
- Validate impact levels (I0-I3)
- Validate improvement categories
- Check counter_argument is non-empty

### `scripts/improvements/dedup-multi-pass.js` (~250 lines)

Fork from `scripts/debt/dedup-multi-pass.js` with changes:

- Adapted for improvement fingerprints
- Cross-system dedup against MASTER_DEBT.jsonl (flag overlaps, don't merge)

### `scripts/improvements/resolve-item.js` (~100 lines)

Fork from `scripts/debt/resolve-item.js` with changes:

- Status transitions: PROPOSED → ACCEPTED/DECLINED/DEFERRED
- ACCEPTED → IMPLEMENTED (when done)
- PROPOSED → STALE (re-evaluation needed)
- Record `decided_date` and `decision_notes`

### npm scripts to add to package.json:

```json
{
  "ims:intake": "node scripts/improvements/intake-audit.js",
  "ims:views": "node scripts/improvements/generate-views.js",
  "ims:metrics": "node scripts/improvements/generate-metrics.js",
  "ims:validate": "node scripts/improvements/validate-schema.js"
}
```

---

## Step 5: Create Multi-AI Enhancement Audit Template

**File:** `docs/multi-ai-audit/templates/ENHANCEMENT_AUDIT.md`

Structure follows existing template pattern (SHARED_TEMPLATE_BASE.md):

- Part 1: Role and Context (enhancement-focused role, not debt-focused)
- Part 2: Anti-Hallucination Rules (same base + counter-argument requirement)
- Part 3: Review Phases (adapted for improvement discovery)
- Part 4: Output Format (FINDINGS_JSONL with improvement schema)
- Part 5: Tool Evidence (web search for benchmarking)

Key differences from other templates:

- Role emphasizes "improvement advisor" not "bug finder"
- Explicitly instructs: "If an area is working well, say so"
- Requires counter_argument in every finding
- Includes competitor/peer benchmarking instructions
- Uses impact (I0-I3) instead of severity (S0-S3)
- Categories are improvement-specific (10 domains)
- Includes Strengths section in output format

The template is designed to be **injectable** - copy the prompt section into any
AI system (Claude, GPT, Gemini, Copilot, etc.) with the repo URL.

---

## Step 6: Create Schema Documentation

**File:** `docs/templates/IMPROVEMENT_JSONL_SCHEMA.md`

Documents:

- Full schema with field descriptions
- Impact scale definitions with examples
- Category descriptions
- Status lifecycle diagram
- Relationship to TDMS schema
- Cross-referencing protocol
- Example findings

---

## Step 7: Update Existing Config

### `scripts/config/audit-schema.json`

Add `"enhancements"` to `validCategories` array.

### `.claude/skills/SKILL_INDEX.md`

Add entry for audit-enhancements.

---

## Step 8: Test & Validate

1. Run `node scripts/improvements/validate-schema.js` on empty
   MASTER_IMPROVEMENTS.jsonl (should pass)
2. Create a test finding manually, validate it passes schema check
3. Verify intake script can process a sample finding
4. Verify view generation works with sample data
5. Dry-run Phase 1 of the audit to confirm agent prompts are correct

---

## Step 9: Commit & Push

Single commit with all new files to `claude/new-session-NgVGX`.

---

## Implementation Order

1. Directory structure + empty MASTER_IMPROVEMENTS.jsonl
2. `improvement-schema.json` (schema definition)
3. `IMPROVEMENT_JSONL_SCHEMA.md` (schema documentation)
4. SKILL.md (the main skill)
5. IMS scripts (intake, views, metrics, validate, dedup, resolve)
6. Multi-AI template (ENHANCEMENT_AUDIT.md)
7. Config updates (audit-schema.json, SKILL_INDEX.md, package.json)
8. Test validation
9. Commit + push

---

## Estimated File Count: 14 new files, 3 modified files

## Estimated Total Lines: ~4,000-5,000 lines of new content
