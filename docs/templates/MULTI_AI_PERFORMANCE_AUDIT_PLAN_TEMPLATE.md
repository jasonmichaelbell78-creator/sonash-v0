# [Project Name] Multi-AI Performance Audit Plan

**Document Version:** 1.0
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Status:** PENDING | IN_PROGRESS | COMPLETE
**Overall Completion:** 0%

---

## Purpose

This document serves as the **execution plan** for running a multi-AI performance-focused audit on [Project Name]. Use this template when:

- Application feels slow or unresponsive
- Core Web Vitals scores are poor
- Bundle size has grown significantly
- Before major traffic increase expected
- After adding significant new features
- Quarterly performance review

**Review Focus Areas (5 Categories):**
1. Bundle Size & Loading
2. Rendering Performance
3. Data Fetching & Caching
4. Memory Management
5. Core Web Vitals

**Expected Output:** Performance findings with optimization plan, baseline metrics, and improvement targets.

---

## Status Dashboard

| Step | Description | Status | Completion |
|------|-------------|--------|------------|
| Step 1 | Establish baseline metrics | PENDING | 0% |
| Step 2 | Run multi-AI performance audit (4-6 models) | PENDING | 0% |
| Step 3 | Collect and validate outputs | PENDING | 0% |
| Step 4 | Run aggregation | PENDING | 0% |
| Step 5 | Create canonical findings doc | PENDING | 0% |
| Step 6 | Generate optimization plan | PENDING | 0% |

**Overall Progress:** 0/6 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Performance Audit: [YYYY-MM-DD or "Never"]
```

### Tech Stack Performance Considerations

```
- Framework: [e.g., Next.js 16.1] - SSR/CSR/ISR strategies
- UI Library: [e.g., React 19.2.3] - Rendering patterns
- Styling: [e.g., Tailwind CSS v4] - CSS bundle size
- Animation: [e.g., Framer Motion 12] - Animation performance
- Backend: [e.g., Firestore] - Query optimization
- Bundler: [e.g., Turbopack/Webpack] - Build optimization
```

### Baseline Metrics (Fill Before Audit)

```
Bundle Size:
- Total JS: [X] KB (gzipped)
- Largest chunk: [X] KB
- CSS: [X] KB

Core Web Vitals (Lighthouse):
- LCP: [X] s (target: < 2.5s)
- INP: [X] ms (target: < 200ms)
- CLS: [X] (target: < 0.1)
- Performance Score: [X]/100

Build Times:
- Dev build: [X] s
- Production build: [X] s
```

### Scope

```
Performance-Critical Paths:
- Initial page load: [list routes]
- High-traffic pages: [list routes]
- Data-heavy components: [list components]
- Animation-heavy components: [list components]

Include: [directories, e.g., app/, components/, hooks/, lib/]
Exclude: [directories, e.g., docs/, tests/]
```

---

## AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model | Capabilities | Performance Strength |
|-------|--------------|---------------------|
| Claude Opus 4.5 | browse_files=yes, run_commands=yes | Comprehensive performance analysis, bundle optimization, React patterns |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes | Cost-effective performance audits, pattern detection |
| GPT-5-Codex | browse_files=yes, run_commands=yes | Comprehensive code analysis, optimization strategies |
| Gemini 3 Pro | browse_files=yes, run_commands=yes | Alternative optimization perspective |
| GitHub Copilot | browse_files=yes, run_commands=limited | Quick pattern detection |
| ChatGPT-4o | browse_files=no, run_commands=no | Broad performance knowledge |

**Selection criteria:**
- At least 2 models with `run_commands=yes` for build/bundle analysis
- At least 1 model with strong React/Next.js expertise
- Total 4-6 models for good consensus

---

## Performance Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a senior performance engineer performing a comprehensive performance audit on a Next.js/React application. Your goal is to identify optimization opportunities and performance bottlenecks.

REPO

[GITHUB_REPO_URL]

STACK / CONTEXT

- Framework: [e.g., Next.js 16.1 (App Router)]
- UI Library: [e.g., React 19.2.3]
- Styling: [e.g., Tailwind CSS v4]
- Animation: [e.g., Framer Motion 12]
- Backend: [e.g., Firebase/Firestore]

PRE-REVIEW CONTEXT (REQUIRED READING)

**Note:** Adjust file paths below to match your project structure. Verify each file exists before proceeding. If unavailable, skip and note the limitation.

Before beginning performance analysis, review these project-specific resources:

1. **AI Learnings** (claude.md Section 4): Critical anti-patterns and performance lessons from past reviews
2. **Pattern History** (../AI_REVIEW_LEARNINGS_LOG.md): Documented performance patterns from Reviews #1-60+
3. **Current Compliance** (npm run patterns:check output): Known anti-pattern violations baseline
4. **Dependency Health**:
   - Circular dependencies: npm run deps:circular (baseline: 0 expected)
   - Unused exports: npm run deps:unused (baseline documented in DEVELOPMENT.md)
5. **Static Analysis** (../analysis/sonarqube-manifest.md): Pre-identified issues including performance concerns
   - 47 CRITICAL cognitive complexity violations (refactoring targets)
   - Performance-impacting patterns already identified
6. **Bundle Analysis** (if available): Previous build output for comparison

These resources provide essential context about known performance issues and optimization opportunities.

BASELINE METRICS

- Bundle size: [X] KB
- LCP: [X] s
- Performance score: [X]/100

SCOPE

**Performance-Critical Pages:**
- [e.g., app/page.tsx (landing page)]
- [e.g., app/dashboard/page.tsx (main dashboard)]
- [e.g., app/analytics/page.tsx (data-heavy page)]

**High-Traffic Routes:**
- [e.g., / (landing)]
- [e.g., /dashboard (main dashboard)]
- [e.g., /analytics (data visualization)]

**Data-Heavy Components:**
- [e.g., data-table.tsx (large dataset rendering)]
- [e.g., chart-panel.tsx (visualization components)]
- [e.g., infinite-scroll-list.tsx (paginated data)]

**Animation-Heavy Components:**
- [e.g., hero-animation.tsx (landing page animations)]
- [e.g., transition-wrapper.tsx (page transitions)]
- [e.g., modal-overlay.tsx (modal animations)]

**Include:**
- app/ (Next.js routes and layouts)
- components/ (React components)
- hooks/ (custom React hooks)
- lib/ (utility libraries)
- types/ (TypeScript type definitions)

**Exclude:**
- tests/ (test files - not runtime code)
- docs/ (documentation)
- public/ (static assets)
- node_modules/ (dependencies)
- .next/ (build artifacts)

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:
- Run in "NO-REPO MODE": Limited analysis without code access
- Provide general recommendations only
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A performance finding is CONFIRMED only if it includes:
- at least one concrete file path AND
- at least one specific performance indicator (component name, bundle size, render count)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these 5 categories)

1) Bundle Size & Loading
2) Rendering Performance
3) Data Fetching & Caching
4) Memory Management
5) Core Web Vitals
```

### Part 3: Performance Audit Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning, verify you can access the repository:
1. State whether you can access files
2. If YES, list 3-5 performance-relevant files (components, hooks, configs)
3. If NO, proceed with limited analysis

PHASE 2: PERFORMANCE SURFACE MAPPING

Map the performance-critical areas:
- List all page routes (app/ directory structure)
- Identify "use client" vs server components
- List components with animations
- List components with data fetching
- Identify heavy dependencies
At the end: "Phase 2 complete - Performance surface mapped"

PHASE 3: CATEGORY-BY-CATEGORY ANALYSIS

For each of the 5 categories, perform systematic analysis:

Category 1: Bundle Size & Loading
CHECKS:
[ ] Large dependencies identified
[ ] Tree-shaking effectiveness
[ ] Code splitting implemented correctly
[ ] Dynamic imports used for heavy components
[ ] Unused exports detected
[ ] Duplicate dependencies
[ ] Image optimization (next/image usage)
[ ] Font optimization (next/font usage)

ANALYSIS:
- Check package.json for heavy dependencies
- Look for barrel exports that prevent tree-shaking
- Identify components that should be dynamically imported
- Check for duplicate utility libraries

VERIFICATION COMMANDS (if available):
- npm run build (check output sizes)
- npx @next/bundle-analyzer (if available)

Mark each check: ISSUE | OK | N/A
Quote specific evidence.

Category 2: Rendering Performance
CHECKS:
[ ] Unnecessary re-renders identified
[ ] React.memo used where appropriate
[ ] useMemo/useCallback for expensive operations
[ ] Keys properly set on lists
[ ] Large lists virtualized
[ ] Server components used where possible
[ ] "use client" only where needed
[ ] Expensive computations memoized

ANALYSIS:
- Look for components that re-render on parent changes
- Check for inline function/object creation in renders
- Identify missing memoization
- Check client/server component boundaries

PATTERNS TO FIND:
- Inline arrow functions in JSX props
- Object literals in JSX props
- Missing dependency arrays in hooks
- State stored too high in tree

Mark each check: ISSUE | OK | N/A
Quote specific evidence.

Category 3: Data Fetching & Caching
CHECKS:
[ ] Firebase queries optimized (indexed, limited)
[ ] Caching strategy implemented
[ ] Stale-while-revalidate patterns
[ ] N+1 query patterns avoided
[ ] Unnecessary real-time listeners
[ ] Query results cached
[ ] Pagination implemented for large datasets
[ ] Parallel fetching where possible

ANALYSIS:
- Check for queries without limits
- Look for multiple sequential queries that could be batched
- Identify listeners that could be one-time fetches
- Check for missing caching

VERIFICATION:
- grep for .get() vs .onSnapshot()
- Check for limit() usage in queries
- Look for query caching implementation

Mark each check: ISSUE | OK | N/A
Quote specific evidence.

Category 4: Memory Management
CHECKS:
[ ] Effect cleanup implemented
[ ] Subscription cleanup on unmount
[ ] Event listeners removed
[ ] Timers cleared
[ ] Large state properly managed
[ ] Closure memory leaks
[ ] Refs cleaned up

ANALYSIS:
- Check useEffect return functions
- Look for addEventListener without removeEventListener
- Check for setInterval/setTimeout cleanup
- Identify components holding large state

PATTERNS TO FIND:
- useEffect without cleanup function
- onSnapshot without unsubscribe
- Global event listeners
- Large arrays stored in state

Mark each check: ISSUE | OK | N/A
Quote specific evidence.

Category 5: Core Web Vitals
CHECKS:
[ ] LCP: Largest content loads fast
[ ] INP: Interactions responsive
[ ] CLS: No layout shifts
[ ] Images use next/image with sizes
[ ] Fonts use next/font
[ ] Critical CSS inlined
[ ] Non-critical JS deferred
[ ] Suspense boundaries for loading states

ANALYSIS:
- Check for blocking resources
- Look for layout shifts from images/fonts
- Identify heavy initial JS
- Check loading state implementations

VERIFICATION COMMANDS (if available):
- npx lighthouse [url] --output=json
- npm run build && npm run start (test production)

Mark each check: ISSUE | OK | N/A
Quote specific evidence.

After each category: "Category X complete - Issues found: [number]"

PHASE 4: DRAFT PERFORMANCE FINDINGS

For each issue, create detailed entry:
- Exact file path and line numbers
- Performance problem description
- Measured or estimated impact
- Optimization recommendation
- Expected improvement
- Implementation effort

Performance Impact Levels:
- S0 (Critical): >50% impact on key metric, blocking issue
- S1 (High): 20-50% impact, noticeable to users
- S2 (Medium): 5-20% impact, measurable improvement
- S3 (Low): <5% impact, nice-to-have optimization

Number findings sequentially.
At the end: "Phase 4 complete - Total performance findings: [count]"

PHASE 5: OPTIMIZATION OPPORTUNITIES

Identify quick wins vs. major refactors:
- Quick wins (E0-E1): Can be done in hours
- Medium effort (E2): Requires a day or more
- Major refactor (E3): Significant architecture change

Prioritize by: Impact / Effort ratio

PHASE 6: RECOMMENDATIONS SUMMARY

Rank findings by:
1. Impact (higher first)
2. Effort (lower first)
3. Risk (lower first)

Identify:
- Must-do optimizations (blocking)
- Should-do (significant improvement)
- Nice-to-have (polish)

At the end: "Phase 6 complete - Ready to output"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order:

1) METRICS_BASELINE_JSON
{
  "audit_date": "YYYY-MM-DD",
  "bundle_size_kb": X,
  "lcp_seconds": X,
  "fid_ms": X,
  "cls": X,
  "performance_score": X,
  "build_time_seconds": X
}

2) FINDINGS_JSONL
(one JSON object per line, each must be valid JSON)

Schema:
{
  "category": "Bundle Size|Rendering|Data Fetching|Memory|Core Web Vitals",
  "title": "short, specific issue",
  "fingerprint": "<category>::<primary_file>::<issue_type>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "path2"],
  "symbols": ["ComponentA", "hookB"],
  "performance_details": {
    "current_metric": "what it is now",
    "expected_improvement": "estimated improvement",
    "affected_metric": "LCP|INP|CLS|bundle|render|memory"
  },
  "optimization": {
    "description": "what to do",
    "code_example": "optional: show pattern",
    "verification": ["how to verify improvement"]
  },
  "evidence": ["measurements or code snippets"],
  "notes": "optional"
}

Severity guide (performance-specific):
- S0: >50% impact on key metric, page unusable
- S1: 20-50% impact, noticeable degradation
- S2: 5-20% impact, measurable improvement
- S3: <5% impact, polish optimization

3) SUSPECTED_FINDINGS_JSONL
(same schema, but confidence <= 40; needs profiling to confirm)

4) HUMAN_SUMMARY (markdown)
- Current performance status
- Top 5 optimization opportunities (by impact/effort)
- Quick wins list (E0-E1)
- Estimated total improvement if all addressed
- Recommended optimization order
```

### Part 5: Performance Verification Commands

```markdown
PERFORMANCE VERIFICATION (run if run_commands=yes)

1) Bundle Analysis:
- npm run build 2>&1 | tail -50
- du -sh .next/static/chunks/*.js | sort -h | tail -20

2) Dependency Size:
- npx depcheck (unused dependencies)
- npm ls --depth=0 (direct dependencies)

3) Build Performance:
- time npm run build

4) Code Patterns:
- grep -rn "use client" app/ --include="*.tsx" | wc -l
- grep -rn "useEffect" --include="*.tsx" | wc -l
- grep -rn "onSnapshot" --include="*.ts" | wc -l

5) Image Optimization:
- grep -rn "<img" --include="*.tsx" (should use next/image)
- grep -rn "next/image" --include="*.tsx" | wc -l

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

### Step 2: Run Performance Aggregator

```markdown
ROLE

You are the Performance Audit Aggregator. Merge multiple AI performance audit outputs into one prioritized optimization plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent issues not in auditor outputs
- Prioritize by impact/effort ratio

DEDUPLICATION RULES

1) Primary merge: same file + same issue type
2) Secondary merge: same optimization recommendation
3) Take highest impact estimate when disagreement

SEVERITY HANDLING

If models disagree on severity/impact:
- Take HIGHER severity if 2+ models agree
- Average impact estimates

OUTPUT

1) CONSOLIDATED_METRICS_JSON
2) DEDUPED_FINDINGS_JSONL (with canonical_id)
3) OPTIMIZATION_PLAN_JSON (ordered by impact/effort)
4) HUMAN_SUMMARY
```

### Step 3: Create Performance Findings Document

Create `docs/reviews/PERFORMANCE_AUDIT_[YYYY]_Q[X].md` with:
- Baseline metrics
- Target metrics
- All findings with optimization steps
- Prioritized implementation order
- Estimated total improvement

---

## Implementation Workflow

After aggregation, implement optimizations using the same 4-step workflow from MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md:

1. Master PR Implementer (performance focus)
2. Self-Review (R1)
3. Hallucination Check (R2)
4. Between-PR Checklist

**Performance-specific verification:**
- Run `npm run build` before and after
- Compare bundle sizes
- Run Lighthouse if possible
- Document metric improvements in PR

---

## Audit History

| Date | Type | Trigger | Models Used | Findings | Performance Score |
|------|------|---------|-------------|----------|-------------------|
| [Date] | Performance Audit | [Reason] | [Models] | [X findings] | [Before → After] |

---

## AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/PERFORMANCE_AUDIT_PLAN_[YYYY]_Q[X].md`
2. **Establish baseline metrics** before running audit
3. **Run the performance audit prompt** on each model
4. **Collect outputs** in specified formats
5. **Run aggregation** for consolidated findings
6. **Create canonical findings doc**
7. **Prioritize by impact/effort**
8. **Update MULTI_AI_REVIEW_COORDINATOR.md** with audit results

**Quality checks before finalizing:**
- [ ] Baseline metrics recorded
- [ ] All 5 categories covered
- [ ] Impact estimates justified
- [ ] Optimization steps actionable
- [ ] Verification methods specified

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](./JSONL_SCHEMA_STANDARD.md)** - Canonical JSONL schema for all review templates
- **MULTI_AI_REVIEW_COORDINATOR.md** - Master index and trigger tracking
- **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md** - General code review template
- **MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md** - Security-focused reviews
- **[ARCHITECTURE.md](../../ARCHITECTURE.md)** - System architecture

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2026-01-05 | Added PRE-REVIEW CONTEXT section with tooling references (claude.md, AI_REVIEW_LEARNINGS_LOG.md, patterns:check, deps tools, SonarQube manifest); Updated AI models to current versions (Opus 4.5, Sonnet 4.5, GPT-5-Codex, Gemini 3 Pro); Added path adaptation notes | Claude |
| 1.0 | YYYY-MM-DD | Initial template creation | [Author] |

---

**END OF MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md**
