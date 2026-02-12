---
name: audit-enhancements
description:
  Run a comprehensive enhancement audit across the entire project - code,
  product, UX, content, workflows, infrastructure, external services, and
  meta-tooling.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-02-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Enhancement Audit

## Overview

Performs a comprehensive, multi-pass enhancement audit of the **entire** project
— not just code, but also product/UX, content, workflows, infrastructure,
external services, and the audit system itself. Produces findings in the
Improvement Management System (IMS) with mandatory honesty guardrails.

**Key differentiator from other audits**: This audit looks for things that could
be **better**, not things that are **wrong**. Every finding includes a mandatory
counter-argument explaining why NOT to make the change.

---

## Architecture: 4-Phase Adaptive Model

```
Phase 1: Broad Scan (8 parallel agents, one per domain)
  → Each agent surveys its domain, produces preliminary findings
  → Output: stage-1-*.jsonl (preliminary findings per domain)

Phase 2: Deep Dive (OPT-IN — user decides after seeing Phase 1 results)
  → Agents spawned for top-opportunity areas identified in Phase 1
  → Includes competitor/peer benchmarking via web search
  → Output: stage-2-*.jsonl (deep findings with full schema)

Phase 3: Cross-Cutting Synthesis (1-2 sequential agents)
  → Cross-domain pattern detection, TDMS cross-referencing
  → Dedup, consolidation, Strengths section compilation
  → Output: all-findings-deduped.jsonl + ENHANCEMENT_AUDIT_REPORT.md

Phase 4: Interactive Review (conversational, spans sessions if needed)
  → One-by-one walkthrough of findings
  → User decides: ACCEPTED / DECLINED / DEFERRED
  → Output: Updated MASTER_IMPROVEMENTS.jsonl with decisions
```

---

## Pre-Audit Setup

**Step 0: Create Audit Directory**

```bash
AUDIT_DIR="docs/audits/single-session/enhancements/audit-$(date +%Y-%m-%d)"
mkdir -p "$AUDIT_DIR"
```

**CRITICAL**: Verify `AUDIT_DIR` exists before EVERY agent spawn.

**Step 1: Check State for Resume**

Check for existing audit state:

```bash
# Check MCP memory for prior state
mcp__memory__search_nodes({ query: "audit-enhancements" })

# Check file-based state
ls ${AUDIT_DIR}/audit-state.json 2>/dev/null
```

If prior state found, offer to resume from last checkpoint.

**Step 2: Gather Baselines**

```bash
npm test 2>&1 | grep -E "Tests:|passing|failed" | head -5
npm run lint 2>&1 | tail -10
npm run patterns:check 2>&1
grep -E '"(next|react|typescript)"' package.json | head -5
```

**Step 3: Load TDMS Cross-Reference Data**

```bash
# Load existing debt items for cross-referencing
wc -l docs/technical-debt/MASTER_DEBT.jsonl
```

---

## Phase 1: Broad Scan — 8 Parallel Agents

**CRITICAL: Agent Type Selection** — Use `subagent_type: "general-purpose"` (NOT
`Explore`). Explore agents are READ-ONLY and cannot write the required JSONL
output files. All Phase 1 agents must write findings to disk.

Invoke all 8 agents in a SINGLE Task message. Each agent writes findings to
`${AUDIT_DIR}/stage-1-{domain}.jsonl`.

### Agent 1: App Architecture Scanner

**Focus**: Component patterns, state management, data flow, code organization
**Files**: `app/`, `components/`, `lib/`, `hooks/`, `types/` **Categories**:
`app-architecture`

Look for:

- Consolidation opportunities (duplicate patterns, similar components)
- State management improvements (context vs. global store vs. URL state)
- Data flow simplification (prop drilling, unnecessary lifting)
- Code organization improvements (colocation, barrel exports, index files)
- Pattern consistency across the codebase

### Agent 2: Product & UX Scanner

**Focus**: User journeys, accessibility, interaction patterns, responsive design
**Files**: `app/`, `components/`, `styles/`, `public/` **Categories**:
`product-ux` **Method**: Heuristic analysis

Look for:

- Accessibility gaps (ARIA labels, keyboard navigation, focus management)
- User journey friction points (extra clicks, unclear CTAs, dead ends)
- Responsive design issues (mobile breakpoints, touch targets)
- Loading state improvements (skeleton screens, optimistic updates)
- Error recovery UX (what happens when things fail)
- **Recovery-domain sensitivity**: Flag any findings that touch sensitive
  content areas but do NOT deep-dive into the therapeutic content itself

### Agent 3: Content Scanner

**Focus**: Microcopy, button labels, error messages, onboarding text, help text
**Files**: `app/`, `components/` (string literals, i18n files) **Categories**:
`content`

Look for:

- Unclear or generic button labels ("Submit" → more specific)
- Error messages that don't help the user fix the problem
- Missing or unhelpful empty states
- Onboarding flow copy improvements
- Consistency in terminology
- Recovery-domain terminology appropriateness (flag but don't rewrite)

### Agent 4: DevX & Automation Scanner

**Focus**: Scripts, hooks, skills, commands, CI/CD, pre-commit pipeline
**Files**: `scripts/`, `.claude/`, `.github/`, `.husky/`, `package.json`
**Categories**: `devx-automation`

Look for:

- Script consolidation opportunities
- Pre-commit pipeline optimization (parallel execution, caching)
- Missing automation (manual steps that could be scripted)
- Skill gaps (common workflows without skill support)
- CI/CD improvements

### Agent 5: Infrastructure & Stack Scanner

**Focus**: Firebase config, build config, dependency choices, deployment
**Files**: `firebase.json`, `next.config.*`, `package.json`, `functions/`
**Categories**: `infrastructure`

Look for:

- Dependency update opportunities (major version bumps with benefits)
- Build optimization (bundle size, tree shaking, code splitting)
- Firebase configuration improvements (security rules, indexes)
- Next.js config optimization (image optimization, caching headers)

### Agent 6: Testing Strategy Scanner

**Focus**: Test patterns, coverage approach, maintenance burden, ROI **Files**:
`tests/`, `__tests__/`, `*.test.*`, test configs **Categories**:
`testing-strategy`

Look for:

- Missing test categories (integration, e2e, visual regression)
- Test maintenance burden (brittle tests, over-mocking)
- Coverage gaps in critical paths
- Test performance improvements
- Testing strategy alignment with architecture

### Agent 7: Documentation Strategy Scanner

**Focus**: Doc organization, freshness, usefulness, AI-workflow effectiveness
**Files**: `docs/`, `*.md`, `CLAUDE.md`, `AI_WORKFLOW.md` **Categories**:
`documentation-strategy`

Look for:

- Documentation that is read but rarely useful
- Missing documentation for common workflows
- Stale docs that cause confusion
- AI-workflow doc effectiveness (do the AI instructions actually help?)
- Documentation organization improvements

### Agent 8: Workflow & External Scanner

**Focus**: Full dev lifecycle, session patterns, external service config
**Files**: Session hooks, external configs, deployment scripts **Categories**:
`workflow-lifecycle`, `external-services`

Look for:

- Friction points in: session start → coding → testing → commit → deploy
- External service optimization (Firebase, Sentry, analytics)
- Session workflow improvements
- Deployment pipeline enhancements

### Phase 1 Agent Prompt Template

Each agent receives this base prompt (with domain-specific additions):

```
You are an Enhancement Auditor for the {DOMAIN} domain.

YOUR ROLE: Find things that could be BETTER, not things that are WRONG.
If an area is working well, say so explicitly — this becomes the Strengths section.

HONESTY REQUIREMENT: For every finding, you MUST include a counter_argument
explaining why NOT to make this change. If you can't think of one, the finding
is suspect — reconsider it.

CONFIDENCE REQUIREMENT: Only include findings where your confidence is 70% or above.
Below 70%, add to inconclusive section instead.

EVIDENCE REQUIREMENT: Every finding needs a concrete file path and specific indicator.

FILE PATH REQUIREMENT: The "files" array MUST contain real file paths from the codebase
(e.g., "components/ui/dialog.tsx:45"). NEVER use placeholders like "multiple", "various",
"1", or numeric values. If a finding affects multiple files, list ALL affected files
explicitly (up to 5). If there are more than 5, list the top 5 most relevant.
The TDMS intake pipeline will REJECT items with invalid file paths.

OUTPUT FORMAT: Write findings to ${AUDIT_DIR}/stage-1-{domain}.jsonl
One JSON object per line, with these fields:
- category, title, fingerprint, impact (I0-I3, see calibration below), effort (E0-E3), confidence (0-100)
- files (array of actual file:line refs — NO placeholders, NO numbers-only, NO "multiple")
- current_approach (what exists now and why)
- proposed_outcome (what the improved version looks like)
- counter_argument (REQUIRED: why NOT to do this)
- why_it_matters (the benefit)
- evidence (what you found)

ALSO OUTPUT: A "strengths" section at the end of your findings:
{"type": "strength", "domain": "{DOMAIN}", "description": "What's working well", "evidence": ["..."]}

WRITE ALL OUTPUT TO FILES. Never rely on conversation context.
```

### Impact Scale Calibration

Use these codebase-specific examples to calibrate impact ratings. Agents tend to
over-rate impact — use these as anchors:

| Impact | Definition                  | Example in This Codebase                                    |
| ------ | --------------------------- | ----------------------------------------------------------- |
| I0     | Transformative / structural | Migrate from Firebase to Supabase; rewrite auth system      |
| I1     | Significant improvement     | Add ARIA labels to nav tabs; consolidate security docs      |
| I2     | Moderate quality-of-life    | Standardize date formats; replace generic button labels     |
| I3     | Minor polish                | Consistent loading text; keyboard shortcuts for power users |

**Rule of thumb**: If the change affects a single file or a small utility, it's
I2 or I3. I0 is reserved for changes that would require a new milestone or
architectural rethink. Most findings should be I1 or I2.

### Phase 1 Verification

After all 8 agents complete:

```bash
# Verify all output files exist and are non-empty
for domain in architecture ux content devx infrastructure testing docs workflow; do
  file="${AUDIT_DIR}/stage-1-${domain}.jsonl"
  if [ ! -s "$file" ]; then
    echo "MISSING OR EMPTY: $file — re-run agent"
  fi
done
```

Re-run any failed agents before proceeding.

---

## Phase 2: Deep Dive — Adaptive Agents (Opt-In)

**This phase is opt-in.** After Phase 1 completes, present results to the user
before spawning any deep-dive agents:

1. **Summarize Phase 1 results**: Show finding count by domain and impact tier
2. **Identify clusters**: Group findings into 5-8 opportunity clusters
3. **Ask the user**: "Phase 1 found N findings across M domains. Would you like
   to run Phase 2 deep-dive agents on the top clusters, or skip to Phase 3
   synthesis and go straight to review?"
4. **If user opts in**: Spawn deep-dive agents per cluster
5. **If user skips**: Proceed directly to Phase 3 with Phase 1 findings only

Deep-dive agents produce full-schema findings with:

- `current_approach` (what exists now, with code examples if helpful)
- `proposed_outcome` (concrete description of the improved version)
- `counter_argument` (genuine reasons NOT to do this)
- `concrete_alternatives` (specific tools, patterns, libraries by name)
- `implementation_notes` (guidance for Claude Code on how to implement)
- `acceptance_tests` (how to verify the improvement worked)
- `risk_assessment` (what could go wrong)
- Web search for competitor benchmarking where relevant

**Meta-improvements**: At least one deep-dive agent evaluates the audit/skill
system itself (meta-tooling category).

Output: `${AUDIT_DIR}/stage-2-{cluster-name}.jsonl`

---

## Phase 3: Synthesis

Sequential process (1-2 agents):

1. **Merge**: Combine all stage-1 and stage-2 JSONL files
2. **Ingest**: Run
   `node scripts/improvements/intake-audit.js ${AUDIT_DIR}/merged-all.jsonl --source "audit-enhancements-YYYY-MM-DD"`
   - This automatically runs dedup and generates views
3. **Cross-reference**: Load MASTER_DEBT.jsonl, note overlaps in `tdms_crossref`
   field
4. **Confidence filter**: Findings below 70% → "Inconclusive" section
5. **Honesty check**: Verify all findings have non-empty `counter_argument`
6. **Strengths compilation**: Gather all `type: "strength"` entries from Phase 1

7. **Generate Report**: Write `${AUDIT_DIR}/ENHANCEMENT_AUDIT_REPORT.md`:

```markdown
# Enhancement Audit Report — YYYY-MM-DD

## Executive Summary

- X findings across Y categories
- Z strengths identified (areas working well)
- Top 3 highest-impact opportunities

## Strengths (What's Working Well)

[Areas evaluated and found adequate, organized by domain]

## Findings by Impact

### I0 — Transformative (N findings)

[Full finding details]

### I1 — Significant (N findings)

[...]

### I2 — Moderate (N findings)

[...]

### I3 — Minor (N findings)

[...]

## Inconclusive (Confidence < 70%)

[Findings that need more investigation]

## TDMS Cross-References

[Improvements that relate to existing debt items]

## Meta-Improvements

[Findings about the audit/skill system itself]
```

---

## Phase 4: Interactive Review

### Presentation Format

Present findings in **batches of 3-5 items**, grouped by impact tier (I0 first,
then I1, I2, I3). Within each tier, group by category for coherence. Each batch
shows full detail for every item:

```markdown
## I1 Batch 1: [Category Group] (N items)

### ENH-XXXX: [Title]

**Impact:** I1 | **Effort:** E2 | **Confidence:** 85% **Category:**
app-architecture

**Current Approach:** [What exists now and why] **Proposed Improvement:** [What
it would look like] **Why It Matters:** [The benefit] **Counter-Argument:** [Why
NOT to do this]

---

### ENH-YYYY: [Title]

[... same format ...]

---

**Decisions for this batch:** ACCEPT / DECLINE / DEFER each item
```

Do NOT present all items in a tier at once — batches of 3-5 keep decisions
manageable. Wait for the user's decisions on each batch before presenting the
next.

### Processing Decisions

After each batch of decisions:

- Run `resolve-item.js` for each item:
  `node scripts/improvements/resolve-item.js ENH-XXXX --action {accept|decline|defer} --reason "{user's reason}"`
- If DECLINED: record reason
- If DEFERRED: mark for re-evaluation
- Save state to MCP memory after each batch

### Post-Review: Roadmap Placement

After ALL findings have been reviewed (not per-item), present accepted items as
a batch for roadmap placement:

1. List all ACCEPTED items with their impact/effort ratings
2. Propose placement in ROADMAP.md sections based on effort and category:
   - E0 items → current Quick Wins milestone
   - E1 items → current or next milestone
   - E2+ items → appropriate future milestone
3. Get user confirmation on all placements at once
4. Apply roadmap edits in a single pass
5. Check for duplicate findings among accepted items and offer to merge

---

## State Persistence

### File-Based (Source of Truth)

`${AUDIT_DIR}/audit-state.json`:

```json
{
  "audit_id": "audit-enhancements-YYYY-MM-DD",
  "current_phase": 1,
  "phase1_completed_agents": ["architecture", "ux"],
  "phase1_pending_agents": [
    "content",
    "devx",
    "infrastructure",
    "testing",
    "docs",
    "workflow"
  ],
  "phase2_clusters": [],
  "phase3_complete": false,
  "phase4_review_progress": { "current": 0, "total": 0 },
  "phase4_decisions": [],
  "last_updated": "ISO timestamp"
}
```

### MCP Memory (Quick-Access Cache)

Save to memory after each phase:

```javascript
mcp__memory__create_entities({
  entities: [
    {
      name: "audit-enhancements-YYYY-MM-DD",
      entityType: "audit-session",
      observations: [
        "Phase X complete",
        "Y findings so far",
        "Review progress: X of Y",
      ],
    },
  ],
});
```

---

## Honesty Guardrails

1. **Mandatory counter-argument**: Every finding MUST include
   `counter_argument`. If the agent cannot articulate a genuine reason not to
   make the change, the finding is suspect and should be reconsidered.

2. **Confidence threshold**: Findings with `confidence < 70` go to
   "Inconclusive" section, not main findings. Prevents suggestion inflation.

3. **Evidence requirement**: Concrete file path + specific indicator required.
   No vague "the codebase could benefit from..." findings.

4. **No-change validation**: Phase 1 agents MUST explicitly list areas they
   evaluated and found adequate. These become the "Strengths" section. An audit
   that finds only problems is suspicious.

5. **Consolidation bias guard**: Both over-consolidation ("merge everything")
   and under-consolidation ("keep everything separate") are evaluated on merit.
   No default direction.

6. **Semantic dedup on proposed_outcome**: During Phase 3 synthesis, check for
   findings with different `fingerprint` values but semantically similar
   `proposed_outcome` text. Two findings that propose the same fix (e.g.,
   "remove duplicate pattern check from pre-push") should be merged even if
   discovered by different domain agents with different titles.

---

## Persistence Rules

- EVERY agent MUST write outputs to files, NEVER rely on conversation context
- After each parallel stage, verify all output files exist and are non-empty
- If any file missing, re-run the failed agent before proceeding
- AUDIT_DIR variable must be verified before each agent spawn
- Save audit-state.json after every phase transition

---

## Post-Audit

1. Verify all findings ingested via
   `node scripts/improvements/validate-schema.js`
2. Generate metrics: `node scripts/improvements/generate-metrics.js`
3. Generate views: `node scripts/improvements/generate-views.js`
4. Save final state to MCP memory
5. Display summary to user with link to ENHANCEMENT_AUDIT_REPORT.md

### Pre-Commit Compatibility

Enhancement audit JSONL files (stage-1-\*.jsonl, merged-all.jsonl) use a
different schema than strict audit JSONL files (MASTER_DEBT.jsonl). The S0/S1
audit validation hook will flag these as missing required fields.

**When committing audit artifacts**, use:

```bash
SKIP_AUDIT_VALIDATION=1 git commit -m "audit(enhancements): ..."
```

This is expected and safe — enhancement findings are ingested into
MASTER_IMPROVEMENTS.jsonl (which has its own schema validation), not
MASTER_DEBT.jsonl.

---

## IMS Integration

**Canonical store**: `docs/improvements/MASTER_IMPROVEMENTS.jsonl` **Schema**:
`scripts/config/improvement-schema.json` **Schema docs**:
`docs/templates/IMPROVEMENT_JSONL_SCHEMA.md`

**Scripts**:

```bash
node scripts/improvements/intake-audit.js <findings.jsonl> --source "audit-enhancements-YYYY-MM-DD"
node scripts/improvements/validate-schema.js
node scripts/improvements/generate-views.js
node scripts/improvements/generate-metrics.js
node scripts/improvements/resolve-item.js ENH-XXXX --action accept --reason "..."
node scripts/improvements/dedup-multi-pass.js
```

**npm shortcuts**:

```bash
npm run ims:intake -- <findings.jsonl>
npm run ims:validate
npm run ims:views
npm run ims:metrics
```

---

## Multi-AI Template

For cross-model consensus audits, see:
`docs/multi-ai-audit/templates/ENHANCEMENT_AUDIT.md`

This template can be injected into any AI system (Claude, GPT, Gemini, Copilot)
with the repo context for independent enhancement discovery.
