---
name: audit-refactoring
description: Run a single-session refactoring audit on the codebase
supports_parallel: true
fallback_available: true
estimated_time_parallel: 20 min
estimated_time_sequential: 60 min
---

# Single-Session Refactoring Audit

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
- When SonarCloud shows increasing CRITICAL cognitive complexity issues

**Scope:**

- Include: `app/`, `components/`, `lib/`, `hooks/`, `functions/`
- Exclude: `node_modules/`, `.next/`, `docs/`

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

- `app/**/*.tsx`, `components/**/*.tsx`
- `lib/**/*.ts`, `hooks/**/*.ts`
- Files flagged by `wc -l` analysis

**Targets:**

- Files > 300 lines (potential split candidates)
- Functions > 50 lines (complexity risk)
- Components with > 10 props (interface too large)
- Duplicate code patterns (>10 lines repeated)

### Agent 2: complexity-and-coupling

**Focus Areas:**

- Cognitive Complexity (SonarCloud CRITICAL targets)
- Architecture Violations (layer boundaries, import cycles)
- High coupling (files with > 5 imports from different domains)

**Files:**

- SonarCloud-flagged files (CRITICAL code smells)
- Files in circular dependency chains (from `deps:circular`)
- Cross-domain coupling patterns

**Targets:**

- SonarCloud CRITICAL cognitive complexity issues
- Circular dependencies (from `deps:circular`)
- Cross-layer imports violating architecture boundaries
- High fan-in/fan-out modules

### Agent 3: dead-code-and-markers

**Focus Areas:**

- Technical Debt Markers (TODOs, FIXMEs, HACKs)
- Unused exports (from `deps:unused`)
- Dead code patterns

**Files:**

- All source files with TODO/FIXME/HACK comments
- Files flagged by `deps:unused`
- Commented-out code blocks

**Targets:**

- TODO/FIXME/HACK markers requiring action
- Unused exports (from `deps:unused`)
- Commented-out code blocks
- Orphaned test files or utilities

### Parallel Execution Command

```markdown
Invoke all 3 agents in a SINGLE Task message:

Task 1: structure-and-duplication agent - audit god objects and code duplication
Task 2: complexity-and-coupling agent - audit cognitive complexity and
architecture violations Task 3: dead-code-and-markers agent - audit tech debt
markers and dead code
```

### Coordination Rules

1. Each agent writes findings to separate JSONL section
2. Dead code findings have lowest priority in conflicts
3. Complexity findings have highest priority
4. Architecture agent handles boundary overlap issues

---

## Section B: Sequential Fallback (Single Agent)

**When to use:** Task tool unavailable, context limits, or user preference

**Execution Order:**

1. Cognitive Complexity & SonarCloud Cross-Reference - 15 min
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

**Step 0: Episodic Memory Search (Session #128)**

Before running refactoring audit, search for context from past sessions:

```javascript
// Search for past refactoring audit findings
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["refactoring audit", "god object", "complexity"],
    limit: 5,
  });

// Search for specific tech debt discussions
mcp__plugin_episodic -
  memory_episodic -
  memory__search({
    query: ["cognitive complexity", "duplicate code", "circular"],
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

- If no thresholds triggered: "⚠️ No review thresholds triggered. Proceed
  anyway?"
- Continue with audit regardless (user invoked intentionally)

**Step 2: Gather Current Baselines**

Collect these metrics by running commands:

```bash
# SonarCloud issues (query via MCP or npm run sonar:report)
npm run sonar:report 2>/dev/null || echo "No SonarCloud data available"

# Circular dependencies
npm run deps:circular 2>&1

# Unused exports
npm run deps:unused 2>&1 | head -30

# Large files (potential god objects)
find app components lib -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | sort -n | tail -20

# Duplicate code patterns
grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l
```

**Step 2b: Query SonarCloud for Cognitive Complexity (if MCP available)**

If `mcp__sonarcloud__get_issues` is available:

- Query with `types: "CODE_SMELL"` and `severities: "CRITICAL"` to get cognitive
  complexity violations
- These are the primary refactoring targets (47 CRITICAL as of 2026-01-05
  baseline)
- Compare current count against baseline - significant changes indicate code
  quality trends
- Use issue file paths to prioritize audit focus areas

This provides real-time cognitive complexity data for targeted refactoring.

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
- Track trends (improving or degrading code health)

**Step 5: Verify Output Directory**

Ensure output directory exists:

```bash
mkdir -p docs/audits/single-session/refactoring/audit-2026-02-16
```

**Step 6: Check Template Currency**

Read `docs/audits/multi-ai/templates/REFACTORING_AUDIT.md` and verify:

- [ ] SonarCloud baseline is current (778 issues, 47 CRITICAL)
- [ ] Known god objects are listed
- [ ] Batch fix opportunities are documented

If outdated, note discrepancies but proceed with current values.

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
3. **Cognitive Complexity** - SonarCloud CRITICAL targets
   - Functions with high cyclomatic complexity
   - Deep nesting (>3 levels)
   - Functions > 50 lines
4. **Architecture Violations** - Layer boundaries and import cycles
   - Circular dependencies (from `deps:circular`)
   - Files with > 5 imports from different domains (coupling)
   - Cross-layer imports violating architecture boundaries
5. **Technical Debt Markers** - TODOs, FIXMEs, HACKs
   - TODO/FIXME/HACK markers requiring action
   - Unused exports (from `deps:unused`)
   - Commented-out code blocks

**For each category:**

1. Search relevant files using Grep/Glob
2. Identify specific issues with file:line references
3. Classify severity: S0 (blocking) | S1 (major friction) | S2 (annoying) | S3
   (nice-to-have)
4. Estimate effort: E0 (trivial) | E1 (hours) | E2 (day) | E3 (major)
5. **Assign confidence level** (see Evidence Requirements below)

---

## Evidence Requirements (MANDATORY)

**All findings MUST include:**

1. **File:Line Reference** - Exact location (e.g., `lib/utils.ts:45`)
2. **Code Snippet or Metrics** - The actual problematic code or measured metrics
   (lines, complexity)
3. **Verification Method** - How you confirmed this is an issue (wc -l,
   deps:circular, grep)
4. **Quantified Impact** - Lines of code, number of dependencies, complexity
   score

**Confidence Levels:**

- **HIGH (90%+)**: Confirmed by tool (SonarCloud, deps:circular, wc -l),
  verified file exists, metrics match
- **MEDIUM (70-89%)**: Found via pattern search, file verified, but metrics
  estimated
- **LOW (<70%)**: Pattern match only, needs manual verification

**S0/S1 findings require:**

- HIGH or MEDIUM confidence (LOW confidence S0/S1 must be escalated)
- Dual-pass verification (re-read the code after initial finding)
- Cross-reference with SonarCloud or dependency analysis output

---

## Cross-Reference Validation

Before finalizing findings, cross-reference with:

1. **SonarCloud issues** - Mark findings as "TOOL_VALIDATED" if SonarCloud
   flagged same issue
2. **deps:circular output** - Mark architecture findings as "TOOL_VALIDATED" if
   tool detected cycle
3. **deps:unused output** - Mark dead code findings as "TOOL_VALIDATED" if tool
   detected unused export
4. **Prior audits** - Check `docs/audits/single-session/refactoring/` for
   duplicate findings

Findings without tool validation should note: `"cross_ref": "MANUAL_ONLY"`

---

## Dual-Pass Verification (S0/S1 Only)

For all S0 (blocking) and S1 (major friction) findings:

1. **First Pass**: Identify the issue, note file:line and initial evidence
2. **Second Pass**: Re-read the actual code in context
   - Verify the complexity/coupling issue is real
   - Check for intentional design decisions (documented trade-offs)
   - Confirm file and line still exist
3. **Decision**: Mark as CONFIRMED or DOWNGRADE (with reason)

Document dual-pass result in finding: `"verified": "DUAL_PASS_CONFIRMED"` or
`"verified": "DOWNGRADED_TO_S2"`

---

## Output Format

**Category Field:** All findings MUST use `category: "refactoring"`

**Output Directory:** `docs/audits/single-session/refactoring/audit-YYYY-MM-DD/`

**1. Markdown Summary (display to user):**

```markdown
## Refactoring Audit - [DATE]

### Baselines

- SonarCloud CRITICAL: X issues
- Circular dependencies: X
- Unused exports: X
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

**CRITICAL - Use JSONL_SCHEMA_STANDARD.md format:**

Reference:
[JSONL_SCHEMA_STANDARD.md](../../../docs/templates/JSONL_SCHEMA_STANDARD.md)

```json
{
  "category": "refactoring",
  "title": "Short specific title",
  "fingerprint": "refactoring::path/to/file.ts::identifier",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 90,
  "files": ["path/to/file.ts:123"],
  "why_it_matters": "1-3 sentences explaining refactoring need",
  "suggested_fix": "Concrete refactoring direction",
  "acceptance_tests": ["Array of verification steps"],
  "evidence": ["code structure info", "wc -l output", "deps:circular output"],
  "symbols": ["ClassName", "functionName"],
  "duplication_cluster": {
    "is_cluster": true,
    "cluster_summary": "Pattern description",
    "instances": [{ "file": "path1.ts", "symbol": "name" }]
  }
}
```

**For S0/S1 findings, ALSO include verification_steps:**

```json
{
  "verification_steps": {
    "first_pass": {
      "method": "grep|tool_output|file_read|code_search",
      "evidence_collected": ["initial evidence"]
    },
    "second_pass": {
      "method": "contextual_review|exploitation_test|manual_verification",
      "confirmed": true,
      "notes": "Confirmation notes"
    },
    "tool_confirmation": {
      "tool": "sonarcloud|deps:circular|deps:unused|wc|NONE",
      "reference": "Tool output or NONE justification"
    }
  }
}
```

**⚠️ REQUIRED FIELDS (per JSONL_SCHEMA_STANDARD.md):**

- `category` - MUST be `refactoring` (normalized from
  GodObject/Duplication/etc.)
- `fingerprint` - Format: `<category>::<primary_file>::<identifier>`
- `files` - Array with file paths (include line as `file.ts:123`)
- `confidence` - Number 0-100 (not string)
- `acceptance_tests` - Non-empty array of verification steps

**3. Markdown Report (save to file):**

Create file:
`docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/REPORT.md`

Full markdown report with all findings, baselines, and refactoring plan.

---

## Context Recovery

If the session is interrupted (compaction, timeout, crash):

1. **Check for state file:** `.claude/state/audit-refactoring-<date>.state.json`
2. **If state file exists and is < 24 hours old:** Resume from last completed
   stage
3. **If state file is stale (> 24 hours):** Start fresh — findings may be
   outdated
4. **Always preserve:** Any partial findings already written to the output
   directory

### State File Format

```json
{
  "audit_type": "refactoring",
  "date": "YYYY-MM-DD",
  "stage_completed": "analysis|review|report",
  "partial_findings_path": "docs/audits/single-session/refactoring/audit-YYYY-MM-DD/",
  "last_updated": "ISO-8601"
}
```

---

## Post-Audit

**Step 1: Validate JSONL Schema**

Before finalizing the audit, run validation:

```bash
node scripts/validate-audit.js docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/findings.jsonl
```

**Validation Checks:**

- All findings have required fields
- No matches in FALSE_POSITIVES.jsonl (or documented override)
- No duplicate findings
- All S0/S1 have HIGH or MEDIUM confidence
- All S0/S1 have DUAL_PASS_CONFIRMED or TOOL_VALIDATED

**If validation fails:**

- Review flagged findings
- Fix or document exceptions
- Re-run validation

---

**Step 2: Interactive Review (MANDATORY — before TDMS intake)**

**Do NOT ingest findings into TDMS until the user has reviewed them.**

### Presentation Format

Present findings in **batches of 3-5 items**, grouped by severity (S0 first,
then S1, S2, S3). Within each severity, group by theme for coherence. Each item
shows:

```
### DEBT-XXXX: [Title]
**Severity:** S_ | **Effort:** E_ | **Confidence:** _%
**Current:** [What exists now]
**Suggested Fix:** [Concrete remediation]
**Acceptance Tests:** [How to verify]
**Counter-argument:** [Why NOT to do this]
**Recommendation:** ACCEPT/DECLINE/DEFER — [Reasoning]
```

Do NOT present all items at once — batches of 3-5 keep decisions manageable.
Wait for user decisions on each batch before presenting the next.

### Decision Tracking (Compaction-Safe)

Create
`docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/REVIEW_DECISIONS.md`
after the first batch to track all decisions. Update after each batch. This file
survives context compaction.

### Processing Decisions

After each batch:

- Record decisions in REVIEW_DECISIONS.md
- If DECLINED: remove from findings before TDMS intake
- If DEFERRED: keep in TDMS as NEW status for future planning
- If ACCEPTED: proceed to TDMS intake

### Post-Review Summary

After ALL findings reviewed, summarize:

- Total accepted / declined / deferred
- Proceed to TDMS Intake with accepted + deferred items only

---

**Step 3: TDMS Intake**

**TDMS Integration (MANDATORY)** - Ingest findings to canonical debt store:

```bash
node scripts/debt/intake-audit.js docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/findings.jsonl --source "audit-refactoring-[DATE]"
```

This assigns DEBT-XXXX IDs and adds to `docs/technical-debt/MASTER_DEBT.jsonl`.
See `docs/technical-debt/PROCEDURE.md` for the full TDMS workflow.

**Validation:**

- Verify DEBT IDs were assigned
- Check MASTER_DEBT.jsonl was updated
- Ensure status field is set correctly

---

**Step 4: Update AUDIT_TRACKER.md**

Add entry to "Refactoring Audits" table in `docs/audits/AUDIT_TRACKER.md`:

- **Date:** Today's date (2026-02-16)
- **Session:** Current session number from SESSION_CONTEXT.md
- **Commits Covered:** Number of commits since last refactoring audit
- **Files Covered:** Number of files analyzed for refactoring
- **Findings:** Total count (e.g., "1 S1, 3 S2, 5 S3")
- **Confidence:** Overall confidence (HIGH if majority HIGH, else MEDIUM)
- **Validation:** PASSED or PASSED_WITH_EXCEPTIONS
- **Reset Threshold:** YES (single-session audits reset that category's
  threshold)

**Run reset script:**

```bash
node scripts/reset-audit-triggers.js --type=single --category=refactoring --apply
```

---

**Step 5: Validate CANON Schema (if applicable)**

If audit updates CANON files:

```bash
npm run validate:canon
```

Ensure all CANON files pass validation before committing.

---

**Step 6: Commit Results**

Commit the audit results:

```bash
git add docs/audits/single-session/refactoring/audit-[YYYY-MM-DD]/
git add docs/technical-debt/MASTER_DEBT.jsonl
git add docs/audits/AUDIT_TRACKER.md
git commit -m "$(cat <<'EOF'
chore(audit): Complete refactoring audit [YYYY-MM-DD]

- Identified X findings (S0: Y, S1: Z, S2: A, S3: B)
- Baselines: SonarCloud CRITICAL: X, Circular deps: Y
- TDMS intake completed
- Threshold reset for refactoring category

https://claude.ai/code/session_XXXX
EOF
)"
```

---

**Step 7: Follow-up Prompt**

Ask: "Would you like me to tackle any of these refactoring tasks now? (Recommend
starting with batch fixes)"

---

## Threshold System

### Category-Specific Thresholds

This audit **resets the refactoring category threshold** in
`docs/audits/AUDIT_TRACKER.md` (single-session audits reset their own category;
multi-AI audits reset all thresholds). Reset means the commit counter for this
category starts counting from zero after this audit.

**Refactoring audit triggers (check AUDIT_TRACKER.md):**

- 40+ commits since last refactoring audit, OR
- 3+ new complexity warnings, OR
- Circular dependency detected

### Multi-AI Escalation

Multi-AI audits are triggered by total commits or time elapsed (not single audit
counts). Check `npm run review:check` for current multi-AI trigger status.

---

## Adding New False Positives

If you encounter a pattern that should be excluded from future audits:

```bash
node scripts/add-false-positive.js \
  --pattern "regex-pattern" \
  --category "refactoring" \
  --reason "Explanation of why this is intentional complexity" \
  --source "AI_REVIEW_LEARNINGS_LOG.md#review-XXX"
```

---

## Documentation References

Before running this audit, review:

### TDMS Integration (Required)

- [PROCEDURE.md](../../../docs/technical-debt/PROCEDURE.md) - Full TDMS workflow
- [MASTER_DEBT.jsonl](../../../docs/technical-debt/MASTER_DEBT.jsonl) -
  Canonical debt store
- Intake command:
  `node scripts/debt/intake-audit.js <output.jsonl> --source "audit-refactoring-<date>"`

### Documentation Standards (Required)

- [JSONL_SCHEMA_STANDARD.md](../../../docs/templates/JSONL_SCHEMA_STANDARD.md) -
  Output format requirements and TDMS field mapping
- [DOCUMENTATION_STANDARDS.md](../../../docs/DOCUMENTATION_STANDARDS.md) -
  5-tier doc hierarchy
- [CODE_PATTERNS.md](../../../docs/agent_docs/CODE_PATTERNS.md) - Anti-patterns
  to check

### Audit Standards (Required)

- [AUDIT_STANDARDS.md](../../../docs/audits/AUDIT_STANDARDS.md) - Section 5
  structure standard
- [FALSE_POSITIVES.jsonl](../../../docs/technical-debt/FALSE_POSITIVES.jsonl) -
  Exclusion patterns
- [AUDIT_TRACKER.md](../../../docs/audits/AUDIT_TRACKER.md) - Threshold tracking
