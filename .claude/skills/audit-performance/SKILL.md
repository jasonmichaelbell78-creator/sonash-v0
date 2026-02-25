---
name: audit-performance
description: Run a single-session performance audit on the codebase
supports_parallel: true
fallback_available: true
estimated_time_parallel: 20 min
estimated_time_sequential: 50 min
---

# Single-Session Performance Audit

## When to Use

- Tasks related to audit-performance
- User explicitly invokes `/audit-performance`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Execution Mode Selection

| Condition                                 | Mode       | Time    |
| ----------------------------------------- | ---------- | ------- |
| Task tool available + no context pressure | Parallel   | ~20 min |
| Task tool unavailable                     | Sequential | ~50 min |
| Context running low (<20% remaining)      | Sequential | ~50 min |
| User requests sequential                  | Sequential | ~50 min |

---

## Section A: Parallel Architecture (2 Agents)

**When to use:** Task tool available, sufficient context budget

### Agent 1: bundle-and-rendering

**Focus Areas:**

- Bundle Size & Loading (large deps, code splitting, dynamic imports)
- Rendering Performance (re-renders, memoization, virtualization)
- Core Web Vitals (LCP, INP, CLS optimization)

**Files:**

- `app/**/*.tsx` (pages, layouts)
- `components/**/*.tsx`
- `package.json` (dependencies)
- `next.config.mjs`

### Agent 2: data-and-memory

**Focus Areas:**

- Data Fetching & Caching (query optimization, caching strategy)
- Memory Management (effect cleanup, subscription leaks)
- Offline Support (offline state, sync strategy)

**Files:**

- `lib/**/*.ts` (services, utilities)
- `hooks/**/*.ts` (custom hooks)
- Components with `useEffect`, `onSnapshot`
- Service worker, cache configurations

### Parallel Execution Command

```markdown
Invoke both agents in a SINGLE Task message:

Task 1: bundle-and-rendering agent - audit bundle size, rendering, Core Web
Vitals Task 2: data-and-memory agent - audit data fetching, memory, offline
support

Each agent prompt MUST end with:

CRITICAL RETURN PROTOCOL:

- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: [agent-id] wrote N findings to [output-path]`
- Do NOT return full findings content — orchestrator checks completion via file
```

**Dependency constraints:** Both agents are independent -- no ordering required.
Each writes to a separate JSONL section. Results are merged after both complete.

### Coordination Rules

1. Each agent writes findings to separate JSONL section
2. Bundle findings include estimated KB savings
3. Memory findings include leak detection results
4. Both agents note cross-cutting concerns

---

## Pre-Audit: Episodic Memory Search (Session #128)

Before running performance audit, search for context from past sessions:

```javascript
// Search for past performance audit findings
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["performance audit", "bundle size", "rendering"],
    limit: 5,
  });

// Search for specific optimization work done before
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["Core Web Vitals", "LCP", "memory leak"],
    limit: 5,
  });
```

**Why this matters:**

- Compare against previous performance baselines
- Identify recurring bottlenecks (may need architectural fixes)
- Track optimization progress over time
- Prevent re-flagging already-addressed issues

---

## Section B: Sequential Fallback (Single Agent)

**When to use:** Task tool unavailable, context limits, or user preference

**Execution Order:**

1. AI Performance Patterns (high-impact AI-generated issues) - 10 min
2. Bundle & Loading - 15 min
3. Data Fetching - 10 min
4. Remaining categories - 15 min

**Total:** ~50 min (vs ~20 min parallel)

### Checkpoint Format

```json
{
  "started_at": "ISO timestamp",
  "categories_completed": ["Bundle", "Rendering"],
  "current_category": "DataFetch",
  "findings_count": 12,
  "last_file_written": "stage-2-findings.jsonl"
}
```

---

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results.

- If no thresholds triggered: "⚠️ No review thresholds triggered. Proceed
  anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Build output (bundle sizes)
npm run build 2>&1 | tail -30

# Count client vs server components
grep -rn "use client" app/ components/ --include="*.tsx" 2>/dev/null | wc -l
grep -rn "use server" app/ components/ --include="*.tsx" 2>/dev/null | wc -l

# Count useEffect hooks (potential performance issues)
grep -rn "useEffect" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l

# Count real-time listeners
grep -rn "onSnapshot" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l

# Image optimization check
grep -rn "<img" --include="*.tsx" 2>/dev/null | wc -l
grep -rn "next/image" --include="*.tsx" 2>/dev/null | wc -l
```

**Step 3: Load False Positives Database**

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and filter findings matching:

- Category: `performance`
- Expired entries (skip if `expires` date passed)

Note patterns to exclude from final findings. If file doesn't exist, proceed
with no exclusions.

**Step 4: Check Template Currency**

Read `docs/audits/multi-ai/templates/PERFORMANCE_AUDIT_PLAN.md` and verify:

- [ ] Stack versions match package.json
- [ ] Bundle size baseline is recent
- [ ] Performance-critical paths are accurate

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (6 Categories):**

1. Bundle Size & Loading (large deps, code splitting, dynamic imports)
2. Rendering Performance (re-renders, memoization, virtualization)
3. Data Fetching & Caching (query optimization, caching strategy)
4. Memory Management (effect cleanup, subscription leaks)
5. Core Web Vitals (LCP, INP, CLS optimization)
6. Offline Support (NEW - 2026-01-17):
   - Offline state storage (localStorage, IndexedDB, cache API)
   - Sync strategy (optimistic updates, conflict resolution)
   - Failure mode handling (network errors, retry logic)
   - Offline-first data patterns (queue writes, batch sync)
   - Service worker caching strategy
   - Offline testability (can app function without network?)

7. AI Performance Patterns (AI-Codebase Specific - NEW 2026-02-02):
   - Naive Data Fetching: AI defaults to fetch-all then filter client-side (S1)
   - Missing Pagination: AI often forgets pagination for lists (S2)
   - Redundant Re-Renders: AI-generated components without memo/useMemo (S2)
   - Duplicate API Calls: Same data fetched in multiple places (S2)
   - Sync Where Async Needed: AI sometimes uses sync file ops in Node.js (S2)
   - Over-Fetching: Fetching entire documents when only fields needed (S2)
   - Missing Loading States: No suspense boundaries or loading indicators (S2)
   - Unbounded Queries: Firestore queries without limit() (S1)

**For each category:**

1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (>50% impact) | S1 (20-50%) | S2 (5-20%) | S3 (<5%)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)
5. Note affected metric (LCP, bundle, render, memory)
6. **Assign confidence level** (see Evidence Requirements below)

**Performance Patterns to Find:**

- Inline arrow functions in JSX props
- Object literals in JSX props
- Missing React.memo on frequently re-rendered components
- useEffect without cleanup
- Large components without code splitting
- Queries without limits
- onSnapshot where one-time fetch would suffice

**Scope:**

- Include: `app/`, `components/`, `lib/`, `hooks/`
- Exclude: `node_modules/`, `.next/`, `docs/`, `tests/`

---

## Output Requirements

**1. Markdown Summary (display to user):**

```markdown
## Performance Audit - [DATE]

### Baselines

- Build time: Xs
- Bundle size: X KB (gzipped)
- Client components: X
- useEffect hooks: X
- Real-time listeners: X

### Findings Summary

| Severity | Count | Affected Metric | Confidence  |
| -------- | ----- | --------------- | ----------- |
| S0       | X     | ...             | HIGH/MEDIUM |
| S1       | X     | ...             | HIGH/MEDIUM |
| S2       | X     | ...             | ...         |
| S3       | X     | ...             | ...         |

### Top 5 Optimization Opportunities

1. [file:line] - Description (S1/E1) - Est. X% improvement - DUAL_PASS_CONFIRMED
2. ...

### False Positives Filtered

- X findings excluded (matched FALSE_POSITIVES.jsonl patterns)

### Quick Wins (E0-E1)

- ...

### Recommendations

- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/performance/audit-[YYYY-MM-DD].jsonl`

**Category field:** `category` MUST be `performance`. Also include
`performance_details` with `affected_metric`, `current_metric`, and
`expected_improvement`.

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/performance/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and optimization plan.

---

## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements,
> Dual-Pass Verification, Cross-Reference Validation, JSONL Output Format,
> Context Recovery, Post-Audit Validation, MASTER_DEBT Cross-Reference,
> Interactive Review, TDMS Intake & Commit, Documentation References, Agent
> Return Protocol, and Honesty Guardrails.

**Skill-specific TDMS intake:**

```bash
node scripts/debt/intake-audit.js <output.jsonl> --source "audit-performance-<date>"
```

**Performance audit triggers (check AUDIT_TRACKER.md):**

- 30+ commits since last performance audit, OR
- Bundle size change detected, OR
- New heavy dependencies added

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
