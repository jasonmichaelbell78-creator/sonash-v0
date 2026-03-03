---
name: audit-refactoring
description: Run a single-session refactoring audit on the codebase
supports_parallel: true
fallback_available: true
estimated_time_parallel: 20 min
estimated_time_sequential: 60 min
---

# Single-Session Refactoring Audit

## When to Use

- Tasks related to audit-refactoring
- User explicitly invokes `/audit-refactoring`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Purpose

This audit identifies technical debt related to code structure, duplication, and
complexity that requires refactoring. It focuses on five key areas:

1. **God Objects** - Large files with too many responsibilities
2. **Code Duplication** - Repeated patterns and copy-paste code
3. **Cognitive Complexity** - Functions/methods exceeding complexity thresholds
4. **Architecture Violations** - Layer boundary violations and import cycles
5. **Technical Debt Markers** - TODOs, FIXMEs, and HACKs requiring cleanup

**When to use this audit:**

- Triggered by refactoring-specific thresholds (40+ commits, 3+ complexity
  warnings, circular dependencies detected)
- Before major refactoring initiatives to establish baselines
- After rapid feature development to identify accumulated structural debt

**Scope:**

- Include: `src/`, `components/`, `lib/`, `hooks/`
- Exclude: `node_modules/`, `dist/`, `build/`, `docs/`

---

## Execution Mode Selection

| Condition                                 | Mode       | Time    |
| ----------------------------------------- | ---------- | ------- |
| Task tool available + no context pressure | Parallel   | ~20 min |
| Task tool unavailable                     | Sequential | ~60 min |
| Context running low (<20% remaining)      | Sequential | ~60 min |
| User requests sequential                  | Sequential | ~60 min |

---

## Section A: Parallel Architecture (3 Agents)

**When to use:** Task tool available, sufficient context budget

### Agent 1: structure-and-duplication

**Focus Areas:**

- God Objects (files > 300 lines, excessive responsibilities)
- Code Duplication (repeated patterns, copy-paste code)
- Large functions (> 50 lines, complexity risk)

**Files:**

- `src/**/*.tsx`, `components/**/*.tsx`
- `lib/**/*.ts`, `hooks/**/*.ts`
- Files flagged by `wc -l` analysis

**Targets:**

- Files > 300 lines (potential split candidates)
- Functions > 50 lines (complexity risk)
- Components with > 10 props (interface too large)
- Duplicate code patterns (>10 lines repeated)

### Agent 2: complexity-and-coupling

**Focus Areas:**

- Cognitive Complexity (CRITICAL targets)
- Architecture Violations (layer boundaries, import cycles)
- High coupling (files with > 5 imports from different domains)

**Files:**

- Files with high complexity (from static analysis tools)
- Files in circular dependency chains
- Cross-domain coupling patterns

**Targets:**

- CRITICAL cognitive complexity issues
- Circular dependencies
- Cross-layer imports violating architecture boundaries
- High fan-in/fan-out modules

### Agent 3: dead-code-and-markers

**Focus Areas:**

- Technical Debt Markers (TODOs, FIXMEs, HACKs)
- Unused exports
- Dead code patterns

**Files:**

- All source files with TODO/FIXME/HACK comments
- Commented-out code blocks

**Targets:**

- TODO/FIXME/HACK markers requiring action
- Commented-out code blocks
- Orphaned test files or utilities

### Parallel Execution Command

```markdown
Invoke all 3 agents in a SINGLE Task message:

Task 1: structure-and-duplication agent - audit god objects and code duplication
Task 2: complexity-and-coupling agent - audit cognitive complexity and
architecture violations Task 3: dead-code-and-markers agent - audit tech debt
markers and dead code

Each agent prompt MUST end with:

CRITICAL RETURN PROTOCOL:

- Write findings to the specified output file using Write tool or Bash
- Return ONLY: `COMPLETE: [agent-id] wrote N findings to [output-path]`
- Do NOT return full findings content — orchestrator checks completion via file
```

**Dependency constraints:** All 3 agents are independent -- no ordering
required. Each writes to a separate JSONL section. Results are merged after all
agents complete.

### Coordination Rules

1. Each agent writes findings to separate JSONL section
2. Dead code findings have lowest priority in conflicts
3. Complexity findings have highest priority
4. Architecture agent handles boundary overlap issues

---

## Section B: Sequential Fallback (Single Agent)

**When to use:** Task tool unavailable, context limits, or user preference

**Execution Order:**

1. Cognitive Complexity Analysis - 15 min
2. God Objects & Duplication - 15 min
3. Architecture Violations - 15 min
4. Tech Debt Markers & Dead Code - 15 min

**Total:** ~60 min (vs ~20 min parallel)

### Checkpoint Format

```json
{
  "started_at": "ISO timestamp",
  "categories_completed": ["Complexity", "GodObjects"],
  "current_category": "Architecture",
  "findings_count": 12,
  "last_file_written": "stage-2-findings.jsonl"
}
```

---

## Pre-Audit Validation

**Step 0: Episodic Memory Search**

Before running refactoring audit, search for context from past sessions:

```javascript
mcp__plugin_episodic_memory_episodic_memory__search({
  query: ['refactoring audit', 'god object', 'complexity'],
  limit: 5,
});

mcp__plugin_episodic_memory_episodic_memory__search({
  query: ['cognitive complexity', 'duplicate code', 'circular'],
  limit: 5,
});
```

**Why this matters:**

- Compare against previous refactoring targets
- Identify recurring complexity hotspots (may need architectural fix)
- Track which files were flagged before and why
- Prevent re-flagging intentional design decisions

---

**Step 1: Check Thresholds**

Run `npm run review:check` and report results.

- If no thresholds triggered: "No review thresholds triggered. Proceed anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Circular dependencies (if tool available)
npm run deps:circular 2>&1 || echo "No circular dep tool configured"

# Large files (potential god objects)
find src components lib -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | sort -n | tail -20

# Duplicate code patterns
grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l
```

**Step 3: Load False Positives Database**

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and filter findings matching:

- Category: `refactoring`
- Expired entries (skip if `expires` date passed)

Note patterns to exclude from final findings.

**Step 4: Check Prior Audit Results**

Check `docs/audits/single-session/refactoring/` for previous audit results:

- Compare baselines (file counts, complexity scores, circular deps)
- Identify regressed issues (previously fixed, now reappeared)
- Note resolved findings to avoid duplicate work

---

## Audit Execution

**Focus Areas (5 Categories):**

1. **God Objects** - Large files with too many responsibilities
   - Files > 300 lines (potential split candidates)
   - Classes/modules with > 5 distinct responsibilities
   - Components with > 10 props (interface too large)
2. **Code Duplication** - Repeated patterns and copy-paste code
   - Multiple similar code blocks (>10 lines duplicated)
   - Repeated business logic across components
   - Pattern opportunities for extraction
3. **Cognitive Complexity** - CRITICAL targets
   - Functions with high cyclomatic complexity
   - Deep nesting (>3 levels)
   - Functions > 50 lines
4. **Architecture Violations** - Layer boundaries and import cycles
   - Circular dependencies
   - Files with > 5 imports from different domains (coupling)
   - Cross-layer imports violating architecture boundaries
5. **Technical Debt Markers** - TODOs, FIXMEs, HACKs
   - TODO/FIXME/HACK markers requiring action
   - Commented-out code blocks

**For each category:**

1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (blocking) | S1 (major friction) | S2 (annoying) | S3
   (nice-to-have)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)
5. **Assign confidence level** (see Evidence Requirements below)

---

## Output Format

**Category Field:** All findings MUST use `category: "refactoring"`

**Output Directory:** `docs/audits/single-session/refactoring/audit-YYYY-MM-DD/`

**1. Markdown Summary (display to user):**

```markdown
## Refactoring Audit - [DATE]

### Baselines

- Circular dependencies: X
- Files > 300 lines: X
- TODO/FIXME/HACK markers: X

### Findings Summary

| Severity | Count | Category | Confidence  |
| -------- | ----- | -------- | ----------- |
| S0       | X     | ...      | HIGH/MEDIUM |
| S1       | X     | ...      | HIGH/MEDIUM |
| S2       | X     | ...      | ...         |
| S3       | X     | ...      | ...         |

### Top Refactoring Candidates

1. [file] - X lines, Y responsibilities (S1/E2) - DUAL_PASS_CONFIRMED
2. ...

### False Positives Filtered

- X findings excluded (matched FALSE_POSITIVES.jsonl patterns)

### Quick Wins (E0-E1)

- ...

### Batch Fix Opportunities

- X instances of [pattern] can be auto-fixed
- ...

### Recommendations

- ...
```

**2. JSONL Findings (save to file):**

Create file:
`docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/findings.jsonl`

**Category field:** `category` MUST be `refactoring`. Also include `symbols` and
optionally `duplication_cluster` for duplication findings.

**3. Markdown Report (save to file):**

Create file:
`docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/REPORT.md`

Full markdown report with all findings, baselines, and refactoring plan.

---

## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements,
> Dual-Pass Verification, Cross-Reference Validation, JSONL Output Format,
> Context Recovery, Post-Audit Validation, MASTER_DEBT Cross-Reference,
> Interactive Review, TDMS Intake & Commit, Documentation References, Agent
> Return Protocol, and Honesty Guardrails.

**Skill-specific TDMS intake:**

```bash
node scripts/debt/intake-audit.js <output.jsonl> --source "audit-refactoring-<date>"
```

**Refactoring audit triggers (check AUDIT_TRACKER.md):**

- 40+ commits since last refactoring audit, OR
- 3+ new complexity warnings, OR
- Circular dependency detected

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
