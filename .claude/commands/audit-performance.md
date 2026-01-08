---
description: Run a single-session performance audit on the codebase
---

# Single-Session Performance Audit

## Pre-Audit Validation

**Step 1: Check Thresholds**

Run `npm run review:check` and report results.
- If no thresholds triggered: "⚠️ No review thresholds triggered. Proceed anyway?"
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

**Step 3: Check Template Currency**

Read `docs/templates/MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md` and verify:
- [ ] Stack versions match package.json
- [ ] Bundle size baseline is recent
- [ ] Performance-critical paths are accurate

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (5 Categories):**
1. Bundle Size & Loading (large deps, code splitting, dynamic imports)
2. Rendering Performance (re-renders, memoization, virtualization)
3. Data Fetching & Caching (query optimization, caching strategy)
4. Memory Management (effect cleanup, subscription leaks)
5. Core Web Vitals (LCP, FID, CLS optimization)

**For each category:**
1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (>50% impact) | S1 (20-50%) | S2 (5-20%) | S3 (<5%)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)
5. Note affected metric (LCP, bundle, render, memory)

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
| Severity | Count | Affected Metric |
|----------|-------|-----------------|
| S0 | X | ... |
| S1 | X | ... |
| S2 | X | ... |
| S3 | X | ... |

### Top 5 Optimization Opportunities
1. [file:line] - Description (S1/E1) - Est. X% improvement
2. ...

### Quick Wins (E0-E1)
- ...

### Recommendations
- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/performance/audit-[YYYY-MM-DD].jsonl`

Each line:
```json
{"id":"PERF-001","category":"Bundle|Rendering|DataFetch|Memory|WebVitals","severity":"S0|S1|S2|S3","effort":"E0|E1|E2|E3","file":"path/to/file.ts","line":123,"title":"Short description","description":"Detailed issue","affected_metric":"LCP|FID|CLS|bundle|render|memory","estimated_improvement":"X%","recommendation":"How to fix","evidence":["code snippet"]}
```

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/performance/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and optimization plan.

---

## Post-Audit

1. Display summary to user
2. Confirm files saved to `docs/audits/single-session/performance/`
3. **Update AUDIT_TRACKER.md** - Add entry to "Performance Audits" table:
   - Date: Today's date
   - Session: Current session number from SESSION_CONTEXT.md
   - Commits Covered: Number of commits since last performance audit
   - Files Covered: Number of performance-critical files analyzed
   - Findings: Total count (e.g., "2 S1, 4 S2, 3 S3")
   - Reset Threshold: YES
4. Ask: "Would you like me to fix any of these issues now? (Quick wins recommended first)"

---

## Threshold System

### Category-Specific Thresholds

This audit resets ONLY the **Performance** category threshold in `docs/AUDIT_TRACKER.md`.

**Performance audit triggers (check AUDIT_TRACKER.md):**
- 30+ commits since last performance audit, OR
- Bundle size change detected, OR
- New heavy dependencies added

### Multi-AI Escalation

After 3 single-session performance audits, a full multi-AI Performance Audit is recommended.
Track this in AUDIT_TRACKER.md "Single audits completed" counter.
