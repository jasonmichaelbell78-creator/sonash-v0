# [Project Name] Multi-AI Refactoring Audit

**Document Version:** 2.0 **Created:** YYYY-MM-DD **Last Updated:** 2026-02-07
**Tier:** 3 (Planning) **Status:** PENDING | IN_PROGRESS | COMPLETE **Overall
Completion:** 0/X phases complete (0%)

> **Multi-Agent Capability Note:** This template assumes orchestration by Claude
> Code which can spawn parallel agents via the Task tool. Other AI systems
> (ChatGPT, Gemini, etc.) cannot call multiple agents and should execute
> sections sequentially or use external orchestration.

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

## Quick Start

1. Copy the **Refactoring Audit Prompt** section (Parts 1-5) below
2. Paste into your AI assistant (Claude Code, Codex, Copilot, Gemini Jules,
   etc.)
3. For tool-capable agents, also include the **Tool Evidence Commands** (Part 5)
4. Collect FINDINGS_JSONL output for aggregation
5. Repeat for each AI model, then run the **Aggregation Process** below

---

## Purpose

This document serves as the **execution plan** for running a multi-AI
large-scale refactoring audit on [Project Name]. Use this template when:

- Significant technical debt has accumulated
- Architecture needs consolidation after rapid development
- Multiple AI agents have introduced inconsistent patterns ("vibe coding")
- Major refactoring initiative is planned
- Codebase needs systematic cleanup before scaling

**This is for LARGE-SCALE refactoring, not tactical bug fixes.** For smaller
code quality issues, use CODE_REVIEW_PLAN.md.

**Review Scope (5 Sub-Categories):**

| #   | Domain                  | Location                          | Count |
| --- | ----------------------- | --------------------------------- | ----- |
| 1   | Hygiene/Duplication     | `app/`, `components/`, `lib/`     | [X]   |
| 2   | Types/Correctness       | `types/`, `*.ts`, `*.tsx`         | [X]   |
| 3   | Architecture/Boundaries | `app/`, `lib/`, module boundaries | [X]   |
| 4   | Security Hardening      | `functions/`, `lib/`, auth flows  | [X]   |
| 5   | Testing Infrastructure  | `tests/`, test utilities, mocks   | [X]   |

All findings use category `"refactoring"` at the domain level. Sub-categories
are expressed in the fingerprint and title only.

**Expected Output:** Phased PR plan with canonical findings, similar to
EIGHT_PHASE_REFACTOR_PLAN.md.

---

## Status Dashboard

| Phase | PR ID | Title   | Status  | Completion | Risk   | Dependencies |
| ----- | ----- | ------- | ------- | ---------- | ------ | ------------ |
| 1     | PR1   | [Title] | PENDING | 0%         | [Risk] | None         |
| 2     | PR2   | [Title] | PENDING | 0%         | [Risk] | PR1          |
| ...   | ...   | ...     | ...     | ...        | ...    | ...          |

**Overall Progress:** 0/X phases complete

---

## Refactoring Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Refactoring Audit: [YYYY-MM-DD or "Never"]
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

| Model             | Capabilities                           | Refactoring Strength                                                       |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Claude Opus 4.6   | browse_files=yes, run_commands=yes     | Comprehensive refactor analysis, cross-cutting patterns, grep verification |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes     | Cost-effective pattern detection, duplication clusters                     |
| GPT-5-Codex       | browse_files=yes, run_commands=yes     | Duplication detection, TypeScript deep analysis                            |
| Gemini 3 Pro      | browse_files=yes, run_commands=yes     | Alternative refactor lens, fresh perspective                               |
| GitHub Copilot    | browse_files=yes, run_commands=limited | Quick pattern confirmation                                                 |
| ChatGPT-4o        | browse_files=no, run_commands=no       | Broad coverage, suspected findings                                         |

**Selection criteria:**

- At least 2 models with `run_commands=yes` for grep/lint evidence
- At least 1 model with strong TypeScript expertise
- Total 4-6 models for good consensus on duplication clusters

**Recommended run order for maximum signal:**

| Order | AI Tool                    | Strengths                                         |
| ----- | -------------------------- | ------------------------------------------------- |
| 1     | Claude Code (tool-capable) | Repo-wide audits, grep-based proof                |
| 2     | Codex (tool-capable)       | Refactor detection, TS ergonomics                 |
| 3     | Copilot (IDE)              | Local pattern spotting, quick confirmations       |
| 4     | Gemini Jules               | Second opinion, alternative refactor lens         |
| 5     | Kimi K2                    | Extra coverage (may have more suspected findings) |

---

## Refactoring Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a senior TypeScript/[Framework] engineer performing a REFACTORING audit
on a repository. Your #1 priority is identifying cross-cutting duplication and
inconsistency patterns that need consolidation.

This is NOT a bug-finding mission. Focus on:

- Duplicated code that should be unified
- Inconsistent patterns that should be standardized
- Architecture boundaries that are unclear
- Technical debt that compounds over time

REPO

[GITHUB_REPO_URL]

STACK / CONTEXT (treat as true)

- [Framework]: [Version]
- [UI Library]: [Version]
- [Language]: [Version]
- Quality gates: npm run lint, npm test, npm run test:coverage

PRE-REVIEW CONTEXT (REQUIRED READING)

> NOTE: The references below require repository access. If your AI model cannot
> browse files or run commands, skip to the CAPABILITIES section below.

Before beginning refactoring analysis, review these project-specific resources:

1. **AI Learnings** (claude.md Section 4): Critical anti-patterns and
   refactoring lessons from past reviews
2. **Pattern History** (../AI_REVIEW_LEARNINGS_LOG.md): Documented refactoring
   patterns from Reviews #1-60+
3. **Current Compliance** (npm run patterns:check output): Known anti-pattern
   violations baseline
4. **Dependency Health**:
   - Circular dependencies: npm run deps:circular (baseline: 0 expected)
   - Unused exports: npm run deps:unused (baseline documented in DEVELOPMENT.md)
5. **Static Analysis (PRIMARY INPUT)**: SonarCloud integration available via
   `npm run sonar:report` (see SonarCloud dashboard)
   - **NOTE:** Run fresh SonarCloud scan or verify metrics are current before
     each audit—numbers become stale as issues are fixed.
   - CRITICAL cognitive complexity violations (functions exceeding 15-point
     threshold)
   - MAJOR code quality issues
   - Batch fix opportunities: ESLint auto-fixable, replaceAll() replacements,
     node: prefix imports
6. **Prior Refactoring Work**
   (../archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md): Previous CANON
   findings

**IMPORTANT**: If SonarCloud analysis is available, the CRITICAL cognitive
complexity violations are the PRIMARY targets for this audit. Focus on functions
that need refactoring due to excessive complexity. If no SonarCloud data exists,
focus on manual complexity assessment of large functions (>50 lines) and
high-cyclomatic-complexity patterns.

These resources provide essential context about what has been identified and
what patterns to consolidate.

SCOPE

Include: [directories] Secondary: [optional directories] Exclude: [excluded
directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>,
repo_checkout=<yes/no>, limitations="<one sentence>"

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

WHAT TO FIND (PRIORITY ORDER)

PASS 1 — Cross-cutting duplication/inconsistency (highest priority)

Identify duplicated or inconsistent implementations across multiple areas,
especially:

- Firebase init/service wrappers, auth guards, Firestore read/write helpers,
  path validation, rate-limiting, logging/audit, analytics
- UI primitives duplicated outside components/ui
  (buttons/cards/modals/toasts/spinners/loading states)
- Repeated hook patterns (state sync, localStorage, keyboard shortcuts,
  scrolling, prompts, networking/offline)
- Repeated types/enums/constants (entry types, statuses, feature flags, routes,
  Firestore paths)

For each duplication cluster: produce ONE consolidated finding with a list of
the duplicated files/symbols.

PASS 2 — Types/Correctness

- any/unknown leakage, inconsistent domain types, nullable handling, unsafe
  casts
- places where runtime validation should match TS types (esp. data in/out of
  Firestore)

PASS 3 — Architecture/Boundaries + Security + Tests (only after pass 1 is done)

- Server vs client component boundary issues, data fetching patterns, state
  placement
- Trust boundaries: where client code assumes privileges; rules alignment;
  secrets/config; App Check usage assumptions
- Missing or weak tests around shared helpers and security-critical code paths
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
- Map type definitions At the end: "Phase 2 complete - Repository mapped"

PHASE 3: CROSS-CUTTING PATTERN ANALYSIS

For each sub-category, identify patterns that repeat across multiple files:

Sub-category 1: Hygiene/Duplication LOOK FOR:

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

Sub-category 2: Types/Correctness LOOK FOR:

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

Sub-category 3: Architecture/Boundaries LOOK FOR:

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

Sub-category 4: Security Hardening LOOK FOR:

- Security patterns that need consolidation (not new vulnerabilities)
- Rate limiting applied inconsistently
- Validation logic duplicated
- Auth checks at multiple levels that could be unified
- Trust boundary patterns that vary

For EACH security consolidation:

- List current scattered implementations
- Suggest unified approach

Sub-category 5: Testing Infrastructure LOOK FOR:

- Test organization patterns
- Missing test coverage for critical paths
- Test utilities duplicated
- Mock patterns inconsistent
- Test data scattered

For EACH testing issue:

- Describe current state
- Suggest improvement

After each sub-category: "Sub-category X complete - Clusters found: [number]"

PHASE 4: DRAFT CANONICAL FINDINGS

For each finding, create detailed entry following schema.

IMPORTANT: For duplication clusters, list EVERY instance, not just examples.

Number findings sequentially. At the end: "Phase 4 complete - Total findings:
[count]"

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

Suggest PR sequence. At the end: "Phase 6 complete - Ready to output"
```

### Part 4: Output Format

````markdown
OUTPUT FORMAT (STRICT)

Return 3 sections in this exact order.

NO CODE FENCES: Output raw JSONL lines directly — do NOT wrap FINDINGS_JSONL,
SUSPECTED_FINDINGS_JSONL, or HUMAN_SUMMARY in Markdown fenced code blocks
(including ```json blocks). The schema example below is for reference only.

1. FINDINGS_JSONL (one JSON object per line, each must be valid JSON)

Schema: { "category": "refactoring", "title": "short, specific", "fingerprint":
"refactoring::<primary_file>::<issue_slug>", "severity": "S0|S1|S2|S3",
"effort": "E0|E1|E2|E3", "confidence": 0-100, "files": ["path1", "path2",
"..."], "line": 123, "symbols": ["SymbolA", "SymbolB", "..."],
"duplication_cluster": { ... }, "why_it_matters": "1-3 sentences on technical
debt impact", "suggested_fix": "concrete refactor direction (extraction,
unification, migration)", "acceptance_tests": ["what to run/verify after
change"], "pr_bucket_suggestion":
"firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",
"dependencies": ["fingerprint of prerequisite finding", "..."], "evidence":
["grep output or code snippets"], "notes": "optional" }

NOTE: The category is always "refactoring" at the domain level. Use the title
and fingerprint to express the sub-category (e.g.,
"refactoring::lib/firebase.ts::duplicated-init-pattern").

REQUIRED FIELDS (for deduplication/cross-reference - Session #116):

- files - REQUIRED: Array with at least one file path from repo root
- line - REQUIRED: Primary line number where issue occurs (use 1 if file-wide)
- These fields enable the aggregator to match findings against existing ROADMAP
  items and prevent duplicates across audits

duplication_cluster format:

When the finding IS a duplication cluster: "duplication_cluster": {
"is_cluster": true, "cluster_summary": "describe the repeated pattern",
"instances": [{"file": "path1.ts", "symbol": "funcA"}, {"file": "path2.ts",
"symbol": "funcB"}] }

When the finding is NOT a duplication cluster: "duplication_cluster": {
"is_cluster": false, "cluster_summary": "", "instances": [] }

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

2. SUSPECTED_FINDINGS_JSONL (same schema, but confidence <= 40; evidence
   incomplete)

3. HUMAN_SUMMARY (markdown)

- Top duplication clusters (list all instances for top 5)
- Top 5 high-impact refactors
- Suggested PR sequence (8-12 PRs)
- "Do first" shortlist (low-risk enablers)
- Estimated total effort
````

### Part 5: Tool Evidence Commands

```markdown
TOOL EVIDENCE (ONLY IF run_commands=yes AND repo_checkout=yes)

Run these to find duplication patterns:

1. Firebase/Firestore patterns:

- grep -rn "collection(db" --include="\*.ts" | head -30
- grep -rn "onSnapshot" --include="\*.ts" | head -20
- grep -rn "httpsCallable" --include="\*.ts" | head -20

2. Hook patterns:

- grep -rn "^export function use" --include="_.ts" --include="_.tsx" | head -30
- grep -rn "useEffect" --include="\*.tsx" | wc -l

3. Type patterns:

- grep -rn "interface._Entry" --include="_.ts" | head -20
- grep -rn "type._Props" --include="_.tsx" | head -20

4. Service patterns:

- grep -rn "export const._Service" --include="_.ts" | head -20
- grep -rn "export class" --include="\*.ts" | head -20

5. Quality gates:

- npm run lint 2>&1 | tail -30
- npm test 2>&1 | tail -30

Paste only minimal excerpts (file paths + 1-3 lines per match).
```

---

## Tool Checklist Addendum

Use this as a second message only to tool-capable agents (Claude Code, Codex,
Copilot-in-IDE, Jules), after the main prompt:

```
If (run_commands=yes AND repo_checkout=yes), prioritize PASS 1 duplication with these checks (do not install heavy tooling unless already present):

1) Quality gates (capture only failures + file paths):
- npm run lint
- npm test
- npm run test:coverage

2) Cross-cutting duplication triangulation (pick 2-4 that are available):
- ripgrep searches for repeated patterns (firebase init, getFirestore(), collection paths, auth guards, "use client", localStorage keys, feature flags)
- ts/prune-style check for unused exports (if available)
- circular dependency check (if available)
- duplication scan (if available)

In evidence, paste only the minimal excerpt needed to support the finding (e.g., file paths + 1-3 matching lines).
If a command is not available, write "SKIPPED: <reason>" and continue.
```

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:

- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Refactoring Aggregator

Use the aggregation prompt from CODE_REVIEW_PLAN.md with these modifications:

```markdown
REFACTORING-SPECIFIC AGGREGATION RULES

1. DUPLICATION CLUSTER MERGING

- Merge clusters that describe the same pattern
- Union ALL instances from all models
- Take the most complete cluster_summary
- Verify instance count matches expectations

2. DEPENDENCY VALIDATION

- Check that dependency chains are consistent
- Flag circular dependencies
- Ensure prerequisite PRs come first

3. PR PLANNING

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
1. IMPLEMENTATION -> 2. REVIEW R1 -> 3. REVIEW R2 -> 4. BETWEEN-PR CHECKLIST
```

See CODE_REVIEW_PLAN.md for detailed prompts.

### Refactoring-Specific Implementation Rules

```markdown
REFACTORING IMPLEMENTATION RULES

1. NO BEHAVIOR CHANGES (unless fixing a bug)

- Refactoring should not change what the code does
- Only change HOW it's organized

2. PRESERVE TESTS

- All existing tests must pass
- Add tests for new shared utilities
- Don't remove test coverage

3. INCREMENTAL MIGRATION

- When consolidating duplicates:
  - First: Create the canonical implementation
  - Then: Migrate one call site at a time
  - Finally: Remove the old implementations
- Never do big-bang replacements

4. LOCK PATTERNS IMMEDIATELY

- After creating canonical utility, document it
- Add grep guardrails to prevent drift
- Update relevant docs (ARCHITECTURE.md, etc.)
```

### Between-Phase Checklist

After completing each refactoring phase:

```markdown
1. VERIFY NO REGRESSIONS

- All tests pass: npm test
- Build succeeds: npm run build
- Lint clean: npm run lint

2. LOCK THE CANONICAL PATTERN Document in docs/refactor-log.md:

- What became canonical
- What is now forbidden
- Grep patterns to detect drift

3. UPDATE TRACKING DOC

- Mark phase COMPLETE
- Fill in "What Was Accomplished"
- Note any deviations from plan
- Update gap analysis

4. GREP GUARDRAILS Run searches to ensure old patterns are gone:

- [pattern-specific greps]

5. PREPARE FOR NEXT PHASE

- Review dependencies for next phase
- Ensure prerequisites are satisfied
```

---

## Refactoring Log

Track what becomes canonical after each PR:

| PR  | What Became Canonical | What's Now Forbidden | Grep Guardrail          |
| --- | --------------------- | -------------------- | ----------------------- |
| PR1 | [New pattern]         | [Old pattern]        | `grep -r "old_pattern"` |
| PR2 | ...                   | ...                  | ...                     |

---

## Audit History

| Date   | Type              | Trigger  | Models Used | Findings        | Phases Planned |
| ------ | ----------------- | -------- | ----------- | --------------- | -------------- |
| [Date] | Refactoring Audit | [Reason] | [Models]    | [X CANON items] | [X phases]     |

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

## AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/REFACTOR_PLAN_[YYYY]_Q[X].md`
2. **Fill in Refactoring Context** with project-specific details
3. **Document known technical debt** before running audit
4. **Run the refactoring audit prompt** on each model
5. **Collect outputs** in JSONL format
6. **Run aggregation** with duplication cluster merging
7. **Create phased implementation plan** following EIGHT_PHASE_REFACTOR_PLAN.md
   structure
8. **Execute phases** using 4-step workflow
9. **Track progress** in this document
10. **Update [COORDINATOR.md](../COORDINATOR.md)** with audit results

**Quality checks before finalizing:**

- [ ] All duplication clusters have complete instance lists
- [ ] Dependencies are consistent (no cycles)
- [ ] PR plan is executable in order
- [ ] Each PR is coherent and <= 10 files
- [ ] Acceptance tests are specific and runnable

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** -
  Canonical JSONL schema for all review templates
- **[COORDINATOR.md](../COORDINATOR.md)** - Master index and trigger tracking
- **[REFACTORING_AUDIT.md](./REFACTORING_AUDIT.md)** - This document
- **[CODE_REVIEW_PLAN.md](./CODE_REVIEW_PLAN.md)** - Tactical code review
  (smaller issues)
- **[SECURITY_AUDIT_PLAN.md](./SECURITY_AUDIT_PLAN.md)** - Security-focused
  reviews
- **[PERFORMANCE_AUDIT_PLAN.md](./PERFORMANCE_AUDIT_PLAN.md)** -
  Performance-focused reviews
- **EIGHT_PHASE_REFACTOR_PLAN.md** - Example of this template in action
- **[GLOBAL_SECURITY_STANDARDS.md](../../GLOBAL_SECURITY_STANDARDS.md)** -
  Security standards to maintain during refactoring

---

## TDMS Integration

### Automatic Intake

After aggregation, ingest findings to TDMS:

```bash
node scripts/debt/intake-audit.js \
  docs/audits/single-session/refactoring/refactoring-findings-YYYY-MM-DD.jsonl \
  --source "refactoring-audit-v2" \
  --batch-id "refactor-audit-YYYYMMDD"
```

### Required TDMS Fields

Ensure all findings include:

- `category`: Always `"refactoring"`
- `title`: Short description
- `fingerprint`: `refactoring::<file_or_scope>::<issue_slug>`
- `severity`: S0|S1|S2|S3
- `effort`: E0|E1|E2|E3
- `confidence`: 0-100
- `files`: Array of file paths (with optional `:line` suffix)
- `why_it_matters`: Why this issue is important
- `suggested_fix`: How to fix
- `acceptance_tests`: Array of verification criteria
- `evidence`: Array of supporting evidence

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                                     | Author |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1     | 2026-02-16 | AUDIT_STANDARDS compliance: Added Review Scope table, TDMS Integration section                                                                                                                                                                              | Claude |
| 2.0     | 2026-02-07 | Merged REFACTOR_PLAN.md + REFACTOR_AUDIT_PROMPT.md; standardized to domain-level category; updated model names; replaced SonarQube with SonarCloud                                                                                                          | Claude |
| 1.2     | 2026-02-04 | Added Tier 3 designation and multi-agent capability caveat for non-Claude systems; Fixed YYYY-MM-DD placeholder in header                                                                                                                                   | Claude |
| 1.1     | 2026-01-05 | Added PRE-REVIEW CONTEXT with SonarQube CRITICAL focus; Added batch fix opportunities; Referenced archived EIGHT_PHASE_REFACTOR_PLAN.md; Updated AI models (Opus 4.5, Sonnet 4.5, GPT-5-Codex, Gemini 3 Pro); Added staleness warning for SonarQube metrics | Claude |
| 1.0     | 2026-01-01 | Initial template creation                                                                                                                                                                                                                                   | Claude |

---

**END OF REFACTORING_AUDIT.md**
