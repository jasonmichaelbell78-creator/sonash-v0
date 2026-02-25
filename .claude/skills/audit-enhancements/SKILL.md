---
name: audit-enhancements
description:
  Run a comprehensive enhancement audit across the entire project - code,
  product, UX, content, workflows, infrastructure, external services, and
  meta-tooling.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-02-23
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Enhancement Audit

## When to Use

- Tasks related to audit-enhancements
- User explicitly invokes `/audit-enhancements`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Overview

Performs a comprehensive, multi-pass enhancement audit of the **entire** project
— not just code, but also product/UX, content, workflows, infrastructure,
external services, and the audit system itself. Produces findings in the
Technical Debt Management System (TDMS) with `category: "enhancements"` and
`type: "enhancement"`, including mandatory honesty guardrails.

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
  → Output: Updated MASTER_DEBT.jsonl with decisions (category: enhancements)
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
# Check file-based state (source of truth)
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

**Step 3: Load False Positives**

```bash
# Read false positives to avoid re-flagging known issues
cat docs/technical-debt/FALSE_POSITIVES.jsonl 2>/dev/null
```

**Step 4: Load TDMS Cross-Reference Data**

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
- category, title, fingerprint, severity (S0-S3, see calibration below), effort (E0-E3), confidence (0-100)
- files (array of actual file:line refs — NO placeholders, NO numbers-only, NO "multiple")
- current_approach (what exists now and why)
- proposed_outcome (what the improved version looks like)
- counter_argument (REQUIRED: why NOT to do this)
- why_it_matters (the benefit)
- evidence (what you found)

ALSO OUTPUT: A "strengths" section at the end of your findings:
{"type": "strength", "domain": "{DOMAIN}", "description": "What's working well", "evidence": ["..."]}

WRITE ALL OUTPUT TO FILES. Never rely on conversation context.

**CRITICAL RETURN PROTOCOL:**
- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: [agent-id] wrote N findings to [path]`
- Do NOT return findings content in your response
```

### Severity Scale Calibration

Use these codebase-specific examples to calibrate severity ratings. Agents tend
to over-rate severity — use these as anchors:

| Severity | Definition                  | Example in This Codebase                                    |
| -------- | --------------------------- | ----------------------------------------------------------- |
| S0       | Transformative / structural | Migrate from Firebase to Supabase; rewrite auth system      |
| S1       | Significant improvement     | Add ARIA labels to nav tabs; consolidate security docs      |
| S2       | Moderate quality-of-life    | Standardize date formats; replace generic button labels     |
| S3       | Minor polish                | Consistent loading text; keyboard shortcuts for power users |

**Rule of thumb**: If the change affects a single file or a small utility, it's
S2 or S3. S0 is reserved for changes that would require a new milestone or
architectural rethink. Most findings should be S1 or S2.

**Legacy mapping**: Previous versions used I0-I3 (Impact scale). If processing
older enhancement findings: I0→S0, I1→S1, I2→S2, I3→S3.

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
   `node scripts/debt/intake-audit.js ${AUDIT_DIR}/merged-all.jsonl --source "audit-enhancements-YYYY-MM-DD"`
   - This automatically detects enhancement format, maps fields, runs dedup and
     generates views
   - Items ingested as `category: "enhancements"`, `type: "enhancement"` in TDMS
3. **Cross-reference**: Intake script automatically handles TDMS dedup
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

### S0 — Critical / Transformative (N findings)

[Full finding details]

### S1 — High / Significant (N findings)

[...]

### S2 — Medium / Moderate (N findings)

[...]

### S3 — Low / Minor (N findings)

[...]

## Inconclusive (Confidence < 70%)

[Findings that need more investigation]

## TDMS Cross-References

[Improvements that relate to existing debt items]

## Meta-Improvements

[Findings about the audit/skill system itself]
```

---

## Phase 4: Interactive Review & TDMS Intake

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: MASTER_DEBT
> Cross-Reference, Interactive Review, and TDMS Intake procedures.

**Enhancement-specific additions to interactive review:**

- Use `resolve-item.js` for each decision:
  `node scripts/debt/resolve-item.js DEBT-XXXX --action {accept|decline|defer} --reason "{user's reason}"`
- Save state to `${AUDIT_DIR}/audit-state.json` after each batch

### Post-Review: Roadmap Placement

After ALL findings have been reviewed (not per-item), present accepted items as
a batch for roadmap placement:

1. List all ACCEPTED items with their impact/effort ratings
2. Propose placement in ROADMAP.md sections based on effort and category:
   - E0 items --> current Quick Wins milestone
   - E1 items --> current or next milestone
   - E2+ items --> appropriate future milestone
3. Get user confirmation on all placements at once
4. Apply roadmap edits in a single pass
5. Check for duplicate findings among accepted items and offer to merge

---

## State Persistence

Source of truth: `${AUDIT_DIR}/audit-state.json` — tracks `current_phase`,
completed/pending agents per phase, review progress, and decisions. Update after
every phase transition.

---

## Enhancement-Specific Guardrails

In addition to the shared Honesty Guardrails (see AUDIT_TEMPLATE.md):

- **No-change validation**: Phase 1 agents MUST explicitly list areas they
  evaluated and found adequate. These become the "Strengths" section.
- **Consolidation bias guard**: Evaluate over/under-consolidation on merit.
- **Semantic dedup**: Merge findings with different fingerprints but similar
  proposed fixes.

---

## Post-Audit

1. Save final state to `${AUDIT_DIR}/audit-state.json`
2. Display summary to user with link to ENHANCEMENT_AUDIT_REPORT.md

### Pre-Commit Compatibility

Enhancement audit JSONL files use a different schema than strict audit JSONL
files. **When committing audit artifacts**, use:

```bash
SKIP_AUDIT_VALIDATION=1 git commit -m "audit(enhancements): ..."
```

---

## TDMS Integration

**Skill-specific TDMS intake:**

```bash
node scripts/debt/intake-audit.js <findings.jsonl> --source "audit-enhancements-YYYY-MM-DD"
```

Items ingested as `category: "enhancements"`, `type: "enhancement"` in TDMS.

---

## Multi-AI Template

For cross-model consensus audits, see:
`docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md`

This template can be injected into any AI system (Claude, GPT, Gemini, Copilot)
with the repo context for independent enhancement discovery.

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
