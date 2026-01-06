# SoNash Multi-AI Refactoring Plan

**Document Version:** 1.1
**Created:** 2026-01-01
**Last Updated:** 2026-01-05
**Status:** PENDING
**Overall Completion:** 0/X phases complete (0%)

---

## Purpose

This document serves as the **execution plan** for running a multi-AI large-scale refactoring audit on SoNash. Use this template when:

- Significant technical debt has accumulated
- Architecture needs consolidation after rapid development
- Multiple AI agents have introduced inconsistent patterns ("vibe coding")
- Major refactoring initiative is planned
- Codebase needs systematic cleanup before scaling

**This is for LARGE-SCALE refactoring, not tactical bug fixes.** For smaller code quality issues, use MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md.

**Review Focus Areas (5 Categories):**
1. Hygiene/Duplication (cross-cutting patterns)
2. Types/Correctness (domain model unification)
3. Architecture/Boundaries (component organization)
4. Security Hardening (pattern consolidation)
5. Testing Infrastructure (coverage & organization)

**Expected Output:** Phased PR plan with canonical findings, similar to EIGHT_PHASE_REFACTOR_PLAN.md.

---

## Status Dashboard

| Phase | PR ID | Title | Status | Completion | Risk | Dependencies |
|-------|-------|-------|--------|------------|------|--------------|
| 1 | PR1 | [Title] | PENDING | 0% | [Risk] | None |
| 2 | PR2 | [Title] | PENDING | 0% | [Risk] | PR1 |
| ... | ... | ... | ... | ... | ... | ... |

**Overall Progress:** 0/X phases complete

---

## Refactoring Context

### Repository Information

```
Repository URL: https://github.com/jasonmichaelbell78-creator/sonash-v0
Branch: claude/new-session-sKhzO
Commit: e12f222f730bc84c0a48a4ccf7e308fa26767788
Last Refactoring Audit: 2026-01-05
```

### Tech Stack

```
- Framework: [e.g., Next.js 16.1 (App Router)]
- UI Library: [e.g., React 19.2.3]
- Language: [e.g., TypeScript 5.x]
- Styling: [e.g., Tailwind CSS v4]
- Backend: [e.g., Firebase Auth, Firestore, Cloud Functions]
- Testing: [e.g., Node test runner, c8 coverage]
```

### Scope

```
Include: [directories, e.g., app/, components/, hooks/, lib/, functions/, tests/, types/]
Secondary: [optional, e.g., scripts/, styles/]
Exclude: [directories, e.g., docs/, public/, node_modules/]
```

### Known Technical Debt

[Document known issues that prompted this refactoring:]
- [Issue 1]
- [Issue 2]
- [Issue 3]

### Refactoring Goals

[What should be true after refactoring is complete:]
- [ ] Single canonical pattern for [X]
- [ ] All [Y] consolidated into [Z]
- [ ] No duplication of [pattern]
- [ ] Clear boundaries between [A] and [B]

---

## AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model | Capabilities | Refactoring Strength |
|-------|--------------|---------------------|
| Claude Opus 4.5 | browse_files=yes, run_commands=yes | Comprehensive refactor analysis, cross-cutting patterns, grep verification |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes | Cost-effective pattern detection, duplication clusters |
| GPT-5-Codex | browse_files=yes, run_commands=yes | Duplication detection, TypeScript deep analysis |
| Gemini 3 Pro | browse_files=yes, run_commands=yes | Alternative refactor lens, fresh perspective |
| GitHub Copilot | browse_files=yes, run_commands=limited | Quick pattern confirmation |
| ChatGPT-4o | browse_files=no, run_commands=no | Broad coverage, suspected findings |

**Selection criteria:**
- At least 2 models with `run_commands=yes` for grep/lint evidence
- At least 1 model with strong TypeScript expertise
- Total 4-6 models for good consensus on duplication clusters

---

## Refactoring Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a senior TypeScript/Next.js engineer performing a REFACTORING audit on a repository. Your #1 priority is identifying cross-cutting duplication and inconsistency patterns that need consolidation.

This is NOT a bug-finding mission. Focus on:
- Duplicated code that should be unified
- Inconsistent patterns that should be standardized
- Architecture boundaries that are unclear
- Technical debt that compounds over time

REPO

https://github.com/jasonmichaelbell78-creator/sonash-v0

STACK / CONTEXT (treat as true)

- Next.js: 16.1.1
- React: 19.2.3
- TypeScript: 5.x
- Firebase: 12.6.0
- Quality gates: npm run lint, npm test, npm run test:coverage

PRE-REVIEW CONTEXT (REQUIRED READING)

Before beginning refactoring analysis, review these project-specific resources:

1. **AI Learnings** (claude.md Section 4): Critical anti-patterns and refactoring lessons from past reviews
2. **Pattern History** (../AI_REVIEW_LEARNINGS_LOG.md): Documented refactoring patterns from Reviews #1-60+
3. **Current Compliance** (npm run patterns:check output): Known anti-pattern violations baseline
4. **Dependency Health**:
   - Circular dependencies: npm run deps:circular (baseline: 0 expected)
   - Unused exports: npm run deps:unused (baseline documented in DEVELOPMENT.md)
5. **Static Analysis (PRIMARY INPUT)** (../analysis/sonarqube-manifest.md): Pre-identified refactoring targets
   - **NOTE:** Run fresh SonarQube scan or verify metrics are current before each audit—numbers become stale as issues are fixed.
   - CRITICAL cognitive complexity violations (functions exceeding 15-point threshold)
   - MAJOR code quality issues
   - Batch fix opportunities: ESLint auto-fixable, replaceAll() replacements, node: prefix imports
6. **Prior Refactoring Work** (../archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md): Previous CANON findings

**IMPORTANT**: If SonarQube analysis is available, the CRITICAL cognitive complexity violations are the PRIMARY targets for this audit. Focus on functions that need refactoring due to excessive complexity. If no SonarQube data exists, focus on manual complexity assessment of large functions (>50 lines) and high-cyclomatic-complexity patterns.

These resources provide essential context about what has been identified and what patterns to consolidate.

SCOPE

Include: [directories]
Secondary: [optional directories]
Exclude: [excluded directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:
- Run in "NO-REPO MODE": Cannot complete refactoring audit without repo access
- Stop immediately and report limitation
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:
- at least one concrete file path AND
- at least one primary symbol name (component/function/type) from those files

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

DUPLICATION CLUSTER RULE

When identifying duplicated patterns:
- List ALL instances you find (not just 2-3 examples)
- Each instance must have file path + symbol name
- Describe the common pattern being repeated
- Suggest the consolidation target

FOCUS AREAS (use ONLY these 5 categories)

1) Hygiene/Duplication
2) Types/Correctness
3) Architecture/Boundaries
4) Security Hardening
5) Testing Infrastructure
```

### Part 3: Refactoring Audit Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning any analysis, verify you can access the repository:
1. Explicitly state whether you can access the repository files
2. If you CAN access it, list 3-5 actual files you can see
3. If you CANNOT access it, stop immediately

PHASE 2: REPOSITORY MAPPING

Systematically map the repository structure:
- List all directories and their purposes
- Identify service/utility modules
- Map component organization
- Note configuration patterns
- Identify hook patterns
- Map type definitions
At the end: "Phase 2 complete - Repository mapped"

PHASE 3: CROSS-CUTTING PATTERN ANALYSIS

For each category, identify patterns that repeat across multiple files:

Category 1: Hygiene/Duplication
LOOK FOR:
- Duplicated code blocks (>10 lines similar)
- Repeated utility functions
- Firebase init patterns repeated
- Service wrappers duplicated
- Hook logic duplicated
- Type definitions duplicated
- Constants duplicated
- UI components with near-identical logic

For EACH duplication cluster:
- List ALL instances (file + symbol)
- Describe the repeated pattern
- Estimate consolidation effort
- Suggest canonical location

Category 2: Types/Correctness
LOOK FOR:
- Same domain entity defined multiple times differently
- any/unknown leakage
- Inconsistent nullability handling
- Type assertions that could be avoided
- Missing runtime validation for external data
- Timestamp handling inconsistencies

For EACH type issue:
- List affected files
- Describe the inconsistency
- Suggest unified approach

Category 3: Architecture/Boundaries
LOOK FOR:
- Server vs client component boundaries unclear
- State stored at wrong level
- Direct SDK usage that should go through services
- Circular dependencies
- Module boundaries that are too porous
- Feature code mixed into shared utilities

For EACH boundary issue:
- Map the current structure
- Describe the problem
- Suggest cleaner boundaries

Category 4: Security Hardening
LOOK FOR:
- Security patterns that need consolidation (not new vulnerabilities)
- Rate limiting applied inconsistently
- Validation logic duplicated
- Auth checks at multiple levels that could be unified
- Trust boundary patterns that vary

For EACH security consolidation:
- List current scattered implementations
- Suggest unified approach

Category 5: Testing Infrastructure
LOOK FOR:
- Test organization patterns
- Missing test coverage for critical paths
- Test utilities duplicated
- Mock patterns inconsistent
- Test data scattered

For EACH testing issue:
- Describe current state
- Suggest improvement

After each category: "Category X complete - Clusters found: [number]"

PHASE 4: DRAFT CANONICAL FINDINGS

For each finding, create detailed entry following schema.

IMPORTANT: For duplication clusters, list EVERY instance, not just examples.

Number findings sequentially.
At the end: "Phase 4 complete - Total findings: [count]"

PHASE 5: DEPENDENCY MAPPING

Map dependencies between findings:
- Which findings must be done before others?
- Which findings touch the same files?
- Which findings could be batched into one PR?

Create dependency graph.

PHASE 6: PR PLANNING

Group findings into coherent PRs:
- Each PR should touch <= 10 files
- Respect dependencies (prerequisite PRs first)
- Group by theme/bucket
- Front-load low-risk changes that enable later work

Suggest PR sequence.
At the end: "Phase 6 complete - Ready to output"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 3 sections in this exact order:

1) FINDINGS_JSONL
(one JSON object per line, each must be valid JSON)

Schema:
{
  "category": "Hygiene/Duplication|Types/Correctness|Architecture/Boundaries|Security Hardening|Testing Infrastructure",
  "title": "short, specific",
  "fingerprint": "<category>::<primary_file>::<primary_symbol>::<problem_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "path2", "..."],
  "symbols": ["SymbolA", "SymbolB", "..."],
  "duplication_cluster": {
    "is_cluster": true/false,
    "cluster_summary": "describe the repeated pattern",
    "instances": [
      {"file": "path/to/file1.ts", "symbol": "functionA"},
      {"file": "path/to/file2.ts", "symbol": "functionB"},
      ...
    ],
    "consolidation_target": "suggested canonical location"
  },
  "why_it_matters": "1-3 sentences on technical debt impact",
  "suggested_fix": "concrete refactor direction (extraction, unification, migration)",
  "acceptance_tests": ["what to run/verify after change"],
  "pr_bucket_suggestion": "firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",
  "dependencies": ["fingerprint of prerequisite finding", "..."],
  "evidence": ["grep output or code snippets"],
  "notes": "optional"
}

Severity guide (refactoring-specific):
- S0: Blocking future work, causing bugs in production
- S1: Significant maintainability drag, risky to modify
- S2: Moderate duplication, inconsistency causing friction
- S3: Minor cleanup, nice-to-have consolidation

Effort guide:
- E0: < 1 hour (simple extraction, rename)
- E1: 1-4 hours (moderate consolidation)
- E2: 4-8 hours (significant refactoring, multiple files)
- E3: Multi-day, may need staged PRs

2) SUSPECTED_FINDINGS_JSONL
(same schema, but confidence <= 40; evidence incomplete)

3) HUMAN_SUMMARY (markdown)
- Top duplication clusters (list all instances for top 5)
- Top 5 high-impact refactors
- Suggested PR sequence (8-12 PRs)
- "Do first" shortlist (low-risk enablers)
- Estimated total effort
```

### Part 5: Tool Evidence Commands

```markdown
TOOL EVIDENCE (ONLY IF run_commands=yes AND repo_checkout=yes)

Run these to find duplication patterns:

1) Firebase/Firestore patterns:
- grep -rn "collection(db" --include="*.ts" | head -30
- grep -rn "onSnapshot" --include="*.ts" | head -20
- grep -rn "httpsCallable" --include="*.ts" | head -20

2) Hook patterns:
- grep -rn "^export function use" --include="*.ts" --include="*.tsx" | head -30
- grep -rn "useEffect" --include="*.tsx" | wc -l

3) Type patterns:
- grep -rn "interface.*Entry" --include="*.ts" | head -20
- grep -rn "type.*Props" --include="*.tsx" | head -20

4) Service patterns:
- grep -rn "export const.*Service" --include="*.ts" | head -20
- grep -rn "export class" --include="*.ts" | head -20

5) Quality gates:
- npm run lint 2>&1 | tail -30
- npm test 2>&1 | tail -30

Paste only minimal excerpts (file paths + 1-3 lines per match).
```

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:
- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Refactoring Aggregator

Use the aggregation prompt from MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md with these modifications:

```markdown
REFACTORING-SPECIFIC AGGREGATION RULES

1) DUPLICATION CLUSTER MERGING
- Merge clusters that describe the same pattern
- Union ALL instances from all models
- Take the most complete cluster_summary
- Verify instance count matches expectations

2) DEPENDENCY VALIDATION
- Check that dependency chains are consistent
- Flag circular dependencies
- Ensure prerequisite PRs come first

3) PR PLANNING
- Group by pr_bucket_suggestion
- Ensure each PR is coherent (related changes)
- Front-load enablers (shared utilities, types)
- Back-load consumers (components using new patterns)
```

### Step 3: Create Canonical Findings Document

Create a document following EIGHT_PHASE_REFACTOR_PLAN.md structure:
- Phase-by-phase breakdown
- CANON findings for each phase
- Acceptance criteria
- Gap analysis template (for tracking what's done vs. planned)

---

## Implementation Workflow

### Per-Phase Workflow

For each refactoring phase, follow the 4-step workflow:

```
1️⃣  IMPLEMENTATION → 2️⃣  REVIEW R1 → 3️⃣  REVIEW R2 → 4️⃣  BETWEEN-PR CHECKLIST
```

See MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md for detailed prompts.

### Refactoring-Specific Implementation Rules

```markdown
REFACTORING IMPLEMENTATION RULES

1) NO BEHAVIOR CHANGES (unless fixing a bug)
- Refactoring should not change what the code does
- Only change HOW it's organized

2) PRESERVE TESTS
- All existing tests must pass
- Add tests for new shared utilities
- Don't remove test coverage

3) INCREMENTAL MIGRATION
- When consolidating duplicates:
  - First: Create the canonical implementation
  - Then: Migrate one call site at a time
  - Finally: Remove the old implementations
- Never do big-bang replacements

4) LOCK PATTERNS IMMEDIATELY
- After creating canonical utility, document it
- Add grep guardrails to prevent drift
- Update relevant docs (ARCHITECTURE.md, etc.)
```

### Between-Phase Checklist

After completing each refactoring phase:

```markdown
1) VERIFY NO REGRESSIONS
- All tests pass: npm test
- Build succeeds: npm run build
- Lint clean: npm run lint

2) LOCK THE CANONICAL PATTERN
Document in docs/refactor-log.md:
- What became canonical
- What is now forbidden
- Grep patterns to detect drift

3) UPDATE TRACKING DOC
- Mark phase COMPLETE
- Fill in "What Was Accomplished"
- Note any deviations from plan
- Update gap analysis

4) GREP GUARDRAILS
Run searches to ensure old patterns are gone:
- [pattern-specific greps]

5) PREPARE FOR NEXT PHASE
- Review dependencies for next phase
- Ensure prerequisites are satisfied
```

---

## Refactoring Log

Track what becomes canonical after each PR:

| PR | What Became Canonical | What's Now Forbidden | Grep Guardrail |
|----|----------------------|---------------------|----------------|
| PR1 | [New pattern] | [Old pattern] | `grep -r "old_pattern"` |
| PR2 | ... | ... | ... |

---

## Audit History

| Date | Type | Trigger | Models Used | Findings | Phases Planned |
|------|------|---------|-------------|----------|----------------|
| 2026-01-06 | Refactoring Audit | [Reason] | [Models] | [X CANON items] | [X phases] |

---

## AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/REFACTOR_PLAN_[YYYY]_Q[X].md`
2. **Fill in Refactoring Context** with project-specific details
3. **Document known technical debt** before running audit
4. **Run the refactoring audit prompt** on each model
5. **Collect outputs** in JSONL format
6. **Run aggregation** with duplication cluster merging
7. **Create phased implementation plan** following EIGHT_PHASE_REFACTOR_PLAN.md structure
8. **Execute phases** using 4-step workflow
9. **Track progress** in this document
10. **Update MULTI_AI_REVIEW_COORDINATOR.md** with audit results

**Quality checks before finalizing:**
- [ ] All duplication clusters have complete instance lists
- [ ] Dependencies are consistent (no cycles)
- [ ] PR plan is executable in order
- [ ] Each PR is coherent and <= 10 files
- [ ] Acceptance tests are specific and runnable

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** - Canonical JSONL schema for all review templates
- **MULTI_AI_REVIEW_COORDINATOR.md** - Master index and trigger tracking
- **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md** - Tactical code review (smaller issues)
- **MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md** - Security-focused reviews
- **MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md** - Performance-focused reviews
- **[EIGHT_PHASE_REFACTOR_PLAN.md](../../archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md)** - Example of this template in action
- **[GLOBAL_SECURITY_STANDARDS.md](../../GLOBAL_SECURITY_STANDARDS.md)** - Security standards to maintain during refactoring

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.1 | 2026-01-05 | Added PRE-REVIEW CONTEXT with SonarQube CRITICAL focus; Added batch fix opportunities; Referenced archived EIGHT_PHASE_REFACTOR_PLAN.md; Updated AI models (Opus 4.5, Sonnet 4.5, GPT-5-Codex, Gemini 3 Pro); Added staleness warning for SonarQube metrics | Claude |
| 1.0 | 2026-01-01 | Initial template creation | Claude |

---

**END OF MULTI_AI_REFACTOR_PLAN_TEMPLATE.md**
