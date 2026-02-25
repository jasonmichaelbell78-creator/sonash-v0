---
name: audit-code
description: Run a single-session code review audit on the codebase
supports_parallel: true
fallback_available: true
estimated_time_parallel: 15 min
estimated_time_sequential: 50 min
---

# Single-Session Code Review Audit

## When to Use

- Tasks related to audit-code
- User explicitly invokes `/audit-code`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Execution Mode Selection

| Condition                                 | Mode       | Time    |
| ----------------------------------------- | ---------- | ------- |
| Task tool available + no context pressure | Parallel   | ~15 min |
| Task tool unavailable                     | Sequential | ~50 min |
| Context running low (<20% remaining)      | Sequential | ~50 min |
| User requests sequential                  | Sequential | ~50 min |

---

## Section A: Parallel Architecture (3 Agents)

**When to use:** Task tool available, sufficient context budget

### Agent 1: hygiene-and-types

**Focus Areas:**

- Code Hygiene (unused imports, dead code, console.logs)
- Types & Correctness (any types, type safety, null checks)

**Files:**

- `app/**/*.tsx`, `components/**/*.tsx`
- `lib/**/*.ts`, `hooks/**/*.ts`
- `types/**/*.ts`

### Agent 2: framework-and-testing

**Focus Areas:**

- Framework Best Practices (React patterns, Next.js conventions)
- Testing Coverage (untested functions, missing edge cases)

**Files:**

- `app/**/*.tsx` (routing, layouts)
- `components/**/*.tsx` (component patterns)
- `tests/**/*.test.ts`

### Agent 3: security-and-debugging

**Focus Areas:**

- Security Surface (input validation, auth checks)
- AI-Generated Code Failure Modes
- Debugging Ergonomics

**Files:**

- `lib/auth*.ts`, `middleware.ts`
- `functions/src/**/*.ts`
- Error handling code, logging patterns

### Parallel Execution Command

```markdown
Invoke all 3 agents in a SINGLE Task message:

Task 1: hygiene-and-types agent - audit code hygiene and TypeScript patterns
Task 2: framework-and-testing agent - audit React/Next.js patterns and test
coverage Task 3: security-and-debugging agent - audit security, AI patterns,
debugging

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
2. Hygiene findings have lowest priority in conflicts
3. Security findings have highest priority
4. Framework agent handles boundary issues

---

## Section B: Sequential Fallback (Single Agent)

**When to use:** Task tool unavailable, context limits, or user preference

**Execution Order:**

1. AICode Patterns (catches hallucinations early) - 15 min
2. Types & Correctness - 10 min
3. Testing Coverage - 10 min
4. Remaining categories - 15 min

**Total:** ~50 min (vs ~15 min parallel)

### Checkpoint Format

```json
{
  "started_at": "ISO timestamp",
  "categories_completed": ["Hygiene", "Types"],
  "current_category": "Framework",
  "findings_count": 18,
  "last_file_written": "stage-2-findings.jsonl"
}
```

---

## Pre-Audit Validation

**Step 0: Episodic Memory Search (Session #128)**

Before running code audit, search for context from past code review sessions:

```javascript
// Search for past code audit findings
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["code audit", "patterns", "quality"],
    limit: 5,
  });

// Search for AI-generated code issues addressed before
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["AICode", "hallucinated", "dead code"],
    limit: 5,
  });
```

**Why this matters:**

- Compare against previous code quality findings
- Identify recurring anti-patterns (may indicate architectural debt)
- Track which issues were resolved vs regressed
- Prevent re-flagging known patterns

---

**Step 1: Check Thresholds**

Run `npm run review:check` and report results. If no thresholds are triggered:

- Display: "⚠️ No review thresholds triggered. Proceed anyway? (This is a
  lightweight single-session audit)"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# Test count
npm test 2>&1 | grep -E "Tests:|passing|failed" | head -5

# Lint status
npm run lint 2>&1 | tail -10

# Pattern compliance
npm run patterns:check 2>&1

# Stack versions
grep -E '"(next|react|typescript)"' package.json | head -5
```

**Step 2b: Query SonarCloud (if MCP available)**

If `mcp__sonarcloud__get_issues` is available, fetch current issue counts:

- Query with `types: "CODE_SMELL,BUG"` and `severities: "CRITICAL,MAJOR"`
- Compare against baseline from previous SonarCloud sync (778 issues as of
  2026-01-05)
- Note any significant changes (>10% increase/decrease)

This provides real-time issue data to cross-reference with audit findings.

**Step 3: Load False Positives Database**

Read `docs/technical-debt/FALSE_POSITIVES.jsonl` and filter findings matching:

- Category: `code`
- Expired entries (skip if `expires` date passed)

Note patterns to exclude from final findings.

**Step 4: Check Template Currency**

Read `docs/audits/multi-ai/templates/CODE_REVIEW_PLAN.md` and verify:

- [ ] Stack versions match package.json
- [ ] Test count baseline is accurate
- [ ] File paths in scope still exist
- [ ] Review range in AI_REVIEW_LEARNINGS_LOG.md is current

If outdated, note discrepancies but proceed with current values.

---

## Audit Execution

**Focus Areas (7 Categories):**

1. Code Hygiene (unused imports, dead code, console.logs)
2. Types & Correctness (any types, type safety, null checks)
3. Framework Best Practices (React patterns, Next.js conventions)
4. Testing Coverage (untested functions, missing edge cases)
5. Security Surface (input validation, auth checks)
6. AICode (AI-Generated Code Failure Modes):
   - "Happy-path only" logic, missing edge cases and error handling (S1)
   - Tests that exist but don't assert meaningful behavior (S1)
   - Hallucinated dependencies/APIs that don't exist (S1)
   - Copy/paste anti-patterns (similar code blocks that should be abstracted)
     (S2)
   - Inconsistent architecture patterns across files (S2)
   - Overly complex functions (deep nesting, >50 lines) (S2)
   - Session Boundary Inconsistencies: Conflicting patterns from different AI
     sessions (S2)
   - Dead Code from Iterations: Commented code, unused variables from AI
     iterations (S3)
   - AI TODO Markers: "TODO: AI should fix this", "FIXME: Claude" patterns (S3)
   - Over-Engineering: Unnecessary abstractions, premature optimization (S2)
7. Debugging (Debugging Ergonomics) (NEW - 2026-01-13):
   - Correlation IDs / request tracing (frontend to backend)
   - Structured logging with context (not just console.log)
   - Sentry/error tracking integration completeness
   - Error messages include actionable fix hints
   - Offline/network status captured in error context

**For each category:**

1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (Critical) | S1 (High) | S2 (Medium) | S3 (Low)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)
5. **Assign confidence level** (see Evidence Requirements below)

**Category Token Requirement (MANDATORY):**

- In JSONL output, `category` MUST be one of:
  `Hygiene|Types|Framework|Testing|Security|AICode|Debugging`
- Do NOT include spaces, parentheses, or descriptive suffixes (e.g., output
  `AICode`, not `AICode (AI-Generated Code Failure Modes)`)

**AI-Code Specific Checks:**

- Functions with only happy-path logic (no try/catch, no null checks)
- Test files with `expect(true).toBe(true)` or trivial assertions
- Import statements for packages not in package.json
- Multiple similar code blocks (>10 lines duplicated)
- Functions with >3 levels of nesting

**Scope:**

- Include: `app/`, `components/`, `lib/`, `hooks/`, `types/`
- Exclude: `node_modules/`, `.next/`, `docs/`
- Conditional: `tests/` excluded for code hygiene, but included when analyzing
  Testing Coverage (category 4) and AI-Generated Code (category 6)

---

## Output Requirements

**1. Markdown Summary (display to user):**

```markdown
## Code Review Audit - [DATE]

### Baselines

- Tests: X passing, Y failing
- Lint: X errors, Y warnings
- Patterns: X violations

### Findings Summary

| Severity | Count | Top Issues | Confidence  |
| -------- | ----- | ---------- | ----------- |
| S0       | X     | ...        | HIGH/MEDIUM |
| S1       | X     | ...        | HIGH/MEDIUM |
| S2       | X     | ...        | ...         |
| S3       | X     | ...        | ...         |

### Top 5 Issues

1. [file:line] - Description (S1/E1) - DUAL_PASS_CONFIRMED
2. ...

### False Positives Filtered

- X findings excluded (matched FALSE_POSITIVES.jsonl patterns)

### Quick Wins (E0-E1)

- ...

### Recommendations

- ...
```

**2. JSONL Findings (save to file):**

Create file: `docs/audits/single-session/code/audit-[YYYY-MM-DD].jsonl`

**Category field:** `category` MUST be `code-quality`

**3. Markdown Report (save to file):**

Create file: `docs/audits/single-session/code/audit-[YYYY-MM-DD].md`

Full markdown report with all findings, baselines, and recommendations.

---

## Standard Audit Procedures

> Read `.claude/skills/_shared/AUDIT_TEMPLATE.md` for: Evidence Requirements,
> Dual-Pass Verification, Cross-Reference Validation, JSONL Output Format,
> Context Recovery, Post-Audit Validation, MASTER_DEBT Cross-Reference,
> Interactive Review, TDMS Intake & Commit, Documentation References, Agent
> Return Protocol, and Honesty Guardrails.

**Skill-specific TDMS intake:**

```bash
node scripts/debt/intake-audit.js <output.jsonl> --source "audit-code-<date>"
```

**Code audit triggers (check AUDIT_TRACKER.md):**

- 25+ commits since last code audit, OR
- 15+ code files modified since last code audit

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
