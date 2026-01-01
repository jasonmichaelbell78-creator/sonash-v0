# [Project Name] Multi-AI Code Review Plan

**Document Version:** 1.0
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Status:** PENDING | IN_PROGRESS | COMPLETE
**Overall Completion:** 0%

---

## 📋 Purpose

This document serves as the **execution plan** for running a multi-AI code quality review on [Project Name]. Use this template when:

- General code quality assessment is needed
- Technical debt has accumulated
- Before starting a major new initiative
- After completing 3+ features in the same area
- Progress-based triggers are reached (5,000+ lines, 50+ files modified)

**Review Focus Areas:**
1. Hygiene/Duplication
2. Types/Correctness
3. Next/React Boundaries (or framework-specific patterns)
4. Security
5. Testing

**Expected Output:** Ranked list of canonical findings with PR implementation plan.

---

## 📊 Status Dashboard

| Step | Description | Status | Completion |
|------|-------------|--------|------------|
| Step 1 | Prepare review context | PENDING | 0% |
| Step 2 | Run multi-AI review (4-6 models) | PENDING | 0% |
| Step 3 | Collect and validate outputs | PENDING | 0% |
| Step 4 | Run aggregation | PENDING | 0% |
| Step 5 | Create canonical findings doc | PENDING | 0% |
| Step 6 | Generate PR plan | PENDING | 0% |

**Overall Progress:** 0/6 steps complete

---

## 🎯 Review Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Review Date: [YYYY-MM-DD or "Never"]
```

### Tech Stack (Update for your project)

```
- [Framework]: [Version] (e.g., Next.js 16.1)
- [UI Library]: [Version] (e.g., React 19.2.3)
- [Language]: [Version] (e.g., TypeScript 5.x)
- [Styling]: [Version] (e.g., Tailwind CSS v4)
- [Backend]: [Services] (e.g., Firebase Auth, Firestore, Cloud Functions)
- [Security]: [Tools] (e.g., reCAPTCHA, App Check, Firestore Rules)
```

### Scope

```
Include: [directories to review, e.g., app/, components/, hooks/, lib/, functions/, tests/, types/]
Secondary: [optional directories, e.g., scripts/, styles/, data/]
Exclude: [directories to skip, e.g., docs/, public/, node_modules/]
```

### Recent Changes Summary

[Brief description of what has changed since last review. Include:
- Major features added
- Significant refactoring done
- New dependencies added
- Security changes made]

---

## 🔧 AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model | Capabilities | Primary Strength |
|-------|--------------|------------------|
| Claude Code (Opus/Sonnet) | browse_files=yes, run_commands=yes | Repo-wide audits, grep-based proof |
| GitHub Copilot | browse_files=yes, run_commands=limited | Local pattern spotting, confirmations |
| Codex | browse_files=yes, run_commands=yes | Refactor detection, TS ergonomics |
| Gemini (Jules) | browse_files=yes, run_commands=yes | Alternative refactor lens |
| ChatGPT-4o | browse_files=no, run_commands=no | Broad coverage, suspected findings |
| Kimi K2 | browse_files=limited | Extra triangulation |

**Selection criteria:**
- At least 2 models with `run_commands=yes` for tool evidence
- At least 1 model for each major capability type
- Total 4-6 models recommended for good consensus

---

## 📝 Review Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a senior TypeScript/[Framework] engineer performing a code quality audit on a repository. Your #1 priority is identifying cross-cutting issues that affect code quality, maintainability, and security.

REPO

[GITHUB_REPO_URL]

STACK / CONTEXT (treat as true)

- [Framework]: [Version]
- [UI Library]: [Version]
- [Language]: [Version]
- [Additional tech stack details...]
- Quality gates: npm run lint, npm test, npm run test:coverage

SCOPE

Include: [directories]
Secondary: [optional directories]
Exclude: [excluded directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:
- Run in "NO-REPO MODE": Cannot complete this review without repo access
- Stop immediately and report limitation
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:
- at least one concrete file path AND
- at least one primary symbol name (component/function/type) from those files

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these categories)

1) Hygiene/Duplication
2) Types/Correctness
3) Next/React Boundaries
4) Security
5) Testing
```

### Part 3: Review Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning any analysis, verify you can access and read the repository:
1. Explicitly state whether you can access the repository files
2. If you CAN access it, list 3-5 actual files you can see
3. If you CANNOT access it, stop immediately

PHASE 2: REPOSITORY OVERVIEW

Systematically review the repository:
- List key files in each included directory
- Note what each major file does
- Identify configuration files, contexts, services
- At the end, write: "Phase 2 complete - Total files reviewed: [count]"

PHASE 3: SYSTEMATIC CATEGORY REVIEW

For each of the 5 categories, examine the codebase:

Category 1: Hygiene/Duplication
- Duplicated code blocks, repeated logic patterns
- Firebase init/service wrappers duplicated
- UI primitives duplicated outside components/ui
- Repeated hook patterns, types, constants
For each cluster: produce ONE finding listing all instances

Category 2: Types/Correctness
- any/unknown leakage, inconsistent domain types
- Nullable handling, unsafe casts
- Runtime validation vs TS types mismatch

Category 3: Next/React Boundaries
- Server vs client component issues
- Data fetching patterns, state placement
- "use client" where not needed or missing

Category 4: Security
- Trust boundaries, rules alignment
- Secrets/config exposure
- Auth/authorization gaps
- App Check usage issues

Category 5: Testing
- Missing tests for critical paths
- Weak test coverage areas
- Security-critical code without tests

As you work:
- Quote specific code snippets with file paths
- Maintain running count of issues per category
- After each category: "Category X complete - Issues found: [number]"

PHASE 4: DRAFT FINDINGS

For each issue, create a detailed entry:
- Exact file path and line numbers
- Quoted code snippet
- Description of the problem
- Severity (S0/S1/S2/S3)
- Effort estimate (E0/E1/E2/E3)
- Recommended fix direction
- Acceptance tests to verify fix

Number findings sequentially.
At the end: "Phase 4 complete - Total draft findings: [count]"

PHASE 5: PATTERN IDENTIFICATION

Review findings and identify patterns:
- Recurring issues across multiple files
- Architectural concerns
- Systemic problems
Number each pattern explicitly.
At the end: "Phase 5 complete - Total patterns: [count]"

PHASE 6: SUMMARY PREPARATION

Count findings by severity:
- S0 (Critical): [list finding numbers]
- S1 (High): [list finding numbers]
- S2 (Medium): [list finding numbers]
- S3 (Low): [list finding numbers]

Draft executive summary.
Identify top 5 priority recommendations.
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
  "category": "Hygiene/Duplication|Types/Correctness|Next/React Boundaries|Security|Testing",
  "title": "short, specific",
  "fingerprint": "<category>::<primary_file>::<primary_symbol>::<problem_slug>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "path2"],
  "symbols": ["SymbolA", "SymbolB"],
  "duplication_cluster": {
    "is_cluster": true/false,
    "cluster_summary": "if true, describe the repeated pattern",
    "instances": [{"file":"...","symbol":"..."}, ...]
  },
  "why_it_matters": "1-3 sentences",
  "suggested_fix": "concrete refactor direction (no rewrite)",
  "acceptance_tests": ["what to run/verify after change"],
  "pr_bucket_suggestion": "firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",
  "dependencies": ["fingerprint it depends on", "..."],
  "evidence": ["optional: short grep output or tool output summary"],
  "notes": "optional"
}

Severity guide:
- S0: high-risk security/data loss/major bug
- S1: likely bug/perf/security footgun
- S2: maintainability drag/inconsistency/duplication
- S3: cosmetic cleanup

Effort guide:
- E0: minutes
- E1: hours
- E2: 1-3 days or staged PR
- E3: multi-PR/multi-week

2) SUSPECTED_FINDINGS_JSONL
(same schema, but confidence <= 40; evidence missing file+symbol OR claim is broad)

3) HUMAN_SUMMARY (markdown)
- Top duplication clusters (5-10 bullets)
- Top 5 high-risk items (S0/S1)
- "Do next" shortlist (<= 10 items) emphasizing small, reviewable PRs
```

### Part 5: Tool Evidence Addendum (For Tool-Capable Models Only)

```markdown
OPTIONAL: TOOL EVIDENCE (ONLY IF run_commands=yes AND repo_checkout=yes)

If you can run commands, prioritize PASS 1 duplication with these checks:

1) Quality gates (capture only failures + file paths):
- npm run lint
- npm test
- npm run test:coverage

2) Cross-cutting duplication triangulation (pick 2-4 available):
- ripgrep searches for repeated patterns
- ts/prune-style check for unused exports
- circular dependency check
- duplication scan

In evidence, paste only minimal excerpt needed (file paths + 1-3 matching lines).
If a command is not available, write "SKIPPED: <reason>" and continue.
```

---

## 📊 Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:
- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Aggregator

Use the aggregation prompt below with a capable model (Claude Opus, GPT-4, Codex):

```markdown
ROLE

You are the Code Review Aggregator. Your job is to merge multiple AI audit outputs into one deduplicated, ranked backlog with a staged PR plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent files, symbols, or claims not in auditor outputs
- You MAY expand a duplication cluster if verification finds more instances

NORMALIZATION

Categories: Hygiene/Duplication | Types/Correctness | Next/React Boundaries | Security | Testing
Severity: S0-S3
Effort: E0-E3

DEDUPLICATION RULES

1) Primary merge: fingerprint (exact match)
2) Secondary merge if ALL true:
   - same category
   - >=1 shared file OR >=1 shared symbol
   - titles + suggested_fix describe same refactor
3) Duplication clusters: merge by union of instances
4) Never merge "similar vibes" without evidence overlap

CONSENSUS SCORING (per canonical finding)

- sources: contributing model names
- confirmations: count in FINDINGS_JSONL
- suspects: count in SUSPECTED_FINDINGS_JSONL
- consensus_score (0-5):
  +2 if >=2 confirmed sources
  +1 if >=3 total sources mention
  +1 if any tool-confirmed source
  +1 if shared evidence overlap
- final_confidence:
  Start with max(confidence), then adjust:
  - if only 1 source + no tool confirm: cap at 60
  - if all suspected: cap at 40
  - if >=2 confirmed + evidence overlap: floor at 70
- cross_cutting_bonus: +1 if instances >= 3

RANKING

1) severity (S0 highest)
2) consensus_score (higher first)
3) final_confidence (higher first)
4) effort (lower first if ties)
5) cross_cutting_bonus (higher first)

OUTPUT

1) PARSE_ERRORS_JSON
{
  "parse_errors": [{"model":"...","line":"...","reason":"..."}],
  "dropped_count": <int>
}

2) DEDUPED_FINDINGS_JSONL
{
  "canonical_id": "CANON-0001",
  "category": "...",
  "title": "...",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "status": "CONFIRMED|SUSPECTED",
  "final_confidence": 0-100,
  "consensus_score": 0-5,
  "sources": ["..."],
  "confirmations": <int>,
  "suspects": <int>,
  "files": ["..."],
  "symbols": ["..."],
  "duplication_cluster": {...},
  "why_it_matters": "...",
  "suggested_fix": "...",
  "acceptance_tests": ["..."],
  "pr_bucket_suggestion": "...",
  "dependencies": ["CANON-0003", "..."],
  "evidence_summary": ["short bullets only"]
}

3) PR_PLAN_JSON
{
  "prs": [
    {
      "pr_id": "PR1",
      "title": "...",
      "goal": "...",
      "bucket": "...",
      "included_canonical_ids": ["CANON-0007","CANON-0012"],
      "staging": ["PR1a","PR1b"],
      "risk_level": "low|medium|high",
      "estimated_effort": "E0|E1|E2|E3",
      "acceptance_tests": ["npm run lint", "npm run typecheck", "npm test"],
      "notes": "review guidance + pitfalls"
    }
  ]
}

4) HUMAN_SUMMARY (markdown)
- Top 10 quick wins (with CANON ids)
- Top 5 high-risk/high-payoff refactors
- Key duplication clusters to consolidate
- Items demoted as hallucinations
- Recommended implementation order
```

### Step 3: Create Canonical Findings Document

Create `docs/reviews/CODE_REVIEW_[YYYY]_Q[X].md` following CANONICAL_DOC_TEMPLATE.md with:
- All DEDUPED_FINDINGS_JSONL converted to readable format
- PR_PLAN_JSON as implementation roadmap
- Link back to this plan document

---

## 🔧 Implementation Workflow

After aggregation, implement findings using this 4-step workflow per PR:

### Step 1: Master PR Implementer Prompt

Use this prompt with a capable coding agent (Claude Code, Codex, Copilot):

```markdown
ROLE

You are the Implementation Engineer for a single PR in a [Framework] repo. You are executing one PR from a deduped refactor plan.

INPUTS (I WILL PROVIDE)
1) PR_OBJECT (JSON)
2) CANON_FINDINGS_JSONL (one JSON object per line)

HARD RULES
- Do NOT re-audit the whole repo. Implement ONLY what's required.
- Do NOT expand scope. List extra refactors under FOLLOWUPS and stop.
- Keep PR small: target <= 10 files changed. Split if larger.
- Evidence discipline: Every claim must cite file path + symbol name.
- No rewrites. Prefer extraction + mechanical migration.

REQUIRED FIRST LINE
Print exactly:
IMPL_CAPABILITIES: repo_checkout=<yes/no>, run_commands=<yes/no>, package_manager="<npm|pnpm|yarn|unknown>", limitations="<one sentence>"

IF repo_checkout=no OR run_commands=no
Return only: BLOCKERS (bullets) and STOP.

PROCESS (STRICT)
1) PARSE INPUTS
- Restate PR title + goal (1-2 sentences)
- List CANON IDs you will satisfy
- List expected files to touch

2) BASELINE
Run: npm run lint, npm run test
Record any pre-existing failures under BASELINE_FAILURES.

3) IMPLEMENTATION LOOP
For each CANON finding (in dependency order):
- Implement the smallest coherent change
- After each chunk, run targeted checks
- Fix failures immediately before moving on

4) FINAL VERIFICATION
Run: npm run lint, npm run test, npm run typecheck (if available)

5) OUTPUT FORMAT
Return exactly these sections:

PR_HEADER
PR_ID: <pr_id> | TITLE: <title> | BUCKET: <bucket>

FILES_CHANGED
- <file>: <why>

CANONICAL_FINDINGS_SATISFIED
For each CANON-XXXX:
- What changed (file + symbol)
- Behavior change: yes/no
- How to verify (1-2 bullets)

COMMANDS_RUN
- Baseline: (short status)
- After changes: (short status)

NOTES_FOR_REVIEWERS
- Risks + mitigations
- Followups (out of scope items discovered)

DIFF_SUMMARY
- 5-12 bullets, no giant diffs/logs
```

### Step 2: Self-Review (Prompt R1)

After implementation, run this review:

```markdown
ROLE
You are a senior reviewer. Your job is to catch regressions, scope creep, and hidden duplication.

INPUTS
- PR diff summary (or changed file list)
- Key code snippets
- Command outputs

CHECKS (in order)
1) Does the PR actually satisfy the PR_OBJECT goal and included CANON IDs?
2) Did it accidentally create new duplication or "second patterns"?
3) Any Next.js boundary issues introduced (server/client, SSR hazards)?
4) Security regressions (App Check assumptions, rules alignment, client trust)?
5) Tests: do they cover the risky path or just happy path?

OUTPUT FORMAT
- MUST_FIX (bullets: file+symbol)
- SHOULD_FIX (bullets)
- NICE_TO_HAVE (bullets)
- MERGE_DECISION (MERGE / DO_NOT_MERGE + 1 sentence)
```

### Step 3: Hallucination Check (Prompt R2)

Verify claims are grounded:

```markdown
ROLE
You are an adversarial verifier. Assume prior claims may be wrong.

INPUTS
- PR_OBJECT, CANON items referenced, changed files

TASK
For each claimed improvement, validate it by pointing to:
- Concrete file path(s) AND
- Symbol(s) that changed
- What behavior changed (1 sentence)

If you cannot ground it, label it "UNPROVEN".

OUTPUT FORMAT
- PROVEN (bullets with file+symbol)
- UNPROVEN (bullets with what evidence is missing)
- RISKY_SIDE_EFFECTS (bullets)
```

### Step 4: Between-PR Checklist

Do this after every PR merge:

```markdown
1) REBASE + SANITY BUILD
- Pull main, rebase/merge your branch
- Run: npm run lint && npm run test && npm run build
- Catches "PR compiles but breaks app router build" issues

2) LOCK THE CANONICAL SURFACE
Document in docs/refactor-log.md (or PR comment):
- What became canonical (e.g., "All slogan reads go through SlogansService")
- What is now forbidden (e.g., "No direct collection(db, 'slogans') in components")
Prevents next AI PR from reintroducing old patterns.

3) GREP GUARDRAILS
Run 2-3 searches to ensure old pattern is gone:
- Old Firestore paths: `grep -r "users/\${" --include="*.ts"`
- Direct callables: `grep -r "httpsCallable(" --include="*.ts"`
- Auth listeners: `grep -r "onAuthStateChanged(" --include="*.ts"`

4) UPDATE AGGREGATOR STATE
Feed the aggregator:
- PR diff summary + changed files
- New helper APIs introduced
- Followups intentionally deferred
Do NOT re-aggregate the whole repo.

5) TARGETED SMOKE TEST (2-3 minutes)
Pick scenario tied to PR:
- Journal writes: create/edit entry, verify persists
- Auth changes: sign in/out, refresh, no flicker
- Growth cards: submit entry, verify toasts and data
```

---

## 📋 Review History

| Date | Type | Trigger | Models Used | Findings | Plan Created |
|------|------|---------|-------------|----------|--------------|
| [Date] | Code Quality | [Trigger reason] | [Model list] | [X CANON items] | [Link to doc] |

---

## 🤖 AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/CODE_REVIEW_PLAN_[YYYY]_Q[X].md`
2. **Fill in Review Context** section with project-specific details
3. **Select AI models** based on availability and capabilities
4. **Run the review prompt** on each selected model
5. **Collect outputs** in JSONL format
6. **Run aggregation** using aggregator prompt
7. **Create canonical findings doc** from aggregated output
8. **Update Review History** in this file
9. **Update MULTI_AI_REVIEW_COORDINATOR.md** with review date and trigger reset

**Quality checks before finalizing:**
- [ ] All JSONL outputs are valid JSON
- [ ] At least 2 models provided tool evidence
- [ ] Aggregation completed without errors
- [ ] PR plan is actionable with clear acceptance tests
- [ ] Canonical findings doc follows template

---

## 🔗 Related Documents

- **MULTI_AI_REVIEW_COORDINATOR.md** - Master index and trigger tracking
- **MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md** - Security-focused reviews
- **MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md** - Performance-focused reviews
- **MULTI_AI_REFACTOR_PLAN_TEMPLATE.md** - Large-scale refactoring plans
- **AI_REVIEW_PROCESS.md** - Process for individual PR reviews (CodeRabbit, Qodo)
- **EIGHT_PHASE_REFACTOR_PLAN.md** - Example of review output in action

---

## 📝 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | YYYY-MM-DD | Initial template creation | [Author] |

---

**END OF MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md**
