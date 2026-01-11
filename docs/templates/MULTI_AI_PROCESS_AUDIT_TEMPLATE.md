# [Project Name] Multi-AI Process & Automation Audit Plan

**Document Version:** 1.3
**Created:** 2026-01-05
**Last Updated:** 2026-01-11
**Status:** PENDING | IN_PROGRESS | COMPLETE
**Overall Completion:** 0%

---

## Purpose

This document serves as the **execution plan** for running a multi-AI process and automation quality audit on [Project Name]. Use this template when:

- CI/CD pipelines need review for reliability
- Git hooks effectiveness needs assessment
- Automation scripts require maintainability review
- Quality gates may have gaps or false positives
- Workflow documentation accuracy questioned
- Quarterly process health check

**Review Focus Areas (6 Categories):**
1. CI/CD Pipeline Coverage & Reliability
2. Git Hooks Effectiveness
3. Script Maintainability & Test Coverage
4. Pattern Checker Completeness
5. Trigger Threshold Appropriateness
6. Workflow Documentation Accuracy

**Expected Output:** Process findings with automation improvements, reliability recommendations, and coverage gaps.

---

## Status Dashboard

| Step | Description | Status | Completion |
|------|-------------|--------|------------|
| Step 1 | Prepare audit context | PENDING | 0% |
| Step 2 | Run multi-AI process audit (3-4 models) | PENDING | 0% |
| Step 3 | Collect and validate outputs | PENDING | 0% |
| Step 4 | Run aggregation | PENDING | 0% |
| Step 5 | Create canonical findings doc | PENDING | 0% |
| Step 6 | Generate improvement plan | PENDING | 0% |

**Overall Progress:** 0/6 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Process Audit: [YYYY-MM-DD or "Never"]
```

### Process & Automation Inventory

```
CI/CD Pipelines:
- Workflow files: [e.g., .github/workflows/*.yml]
- Pipeline runners: [e.g., GitHub Actions, CircleCI]
- Deployment targets: [e.g., Firebase, Vercel]

Git Hooks:
- Pre-commit: [location, e.g., .git/hooks/pre-commit or package.json scripts]
- Pre-push: [location]
- Commit-msg: [location]
- Session hooks: [location, e.g., .claude/hooks/]

Automation Scripts:
- Location: [e.g., scripts/]
- Languages: [e.g., JavaScript, Bash, Python]
- Test coverage: [e.g., tests/scripts/]

Quality Gates:
- Linting: [e.g., ESLint, Prettier]
- Testing: [e.g., Node test runner, Jest]
- Type checking: [e.g., TypeScript]
- Pattern checking: [e.g., scripts/check-pattern-compliance.js]
- Dependency checking: [e.g., npm audit, madge, knip]
```

### Scope

```
Include: [e.g., .github/workflows/, scripts/, hooks/, package.json scripts, docs/workflows/]
Secondary: [optional, e.g., tool configurations]
Exclude: [e.g., node_modules/, archived workflows]
```

---

## AI Models to Use

**Recommended configuration (3-4 models for consensus):**

| Model | Capabilities | Process Analysis Strength |
|-------|--------------|-------------------------|
| Claude Opus 4.5 | browse_files=yes, run_commands=yes | Comprehensive process analysis, CI/CD expertise, automation patterns |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes | Cost-effective process review, script analysis |
| GPT-5-Codex | browse_files=yes, run_commands=yes | Script quality analysis, workflow optimization |
| Gemini 3 Pro | browse_files=yes, run_commands=yes | Alternative process perspective |

**Selection criteria:**
- At least 2 models with `run_commands=yes` for script execution testing
- At least 1 model with CI/CD pipeline expertise
- Total 3-4 models recommended for good consensus

---

## Process Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a DevOps and Process Engineer performing a comprehensive process and automation quality audit. Your goal is to assess CI/CD reliability, automation effectiveness, and quality gate coverage.

REPO

[GITHUB_REPO_URL]

PROCESS STACK

- CI/CD: [Platform, e.g., GitHub Actions]
- Testing: [Framework]
- Linting: [Tools]
- Deployment: [Platform]
- Automation: [Languages/tools]

PRE-REVIEW CONTEXT (REQUIRED READING)

Before beginning process analysis, review these project-specific resources:

1. **AI Learnings** (claude.md Section 4): Process patterns and lessons from past reviews
2. **Pattern History** (../AI_REVIEW_LEARNINGS_LOG.md): Documented process issues from Reviews #1-60+
3. **Current Compliance** (npm run patterns:check output): Known anti-pattern violations baseline
4. **Dependency Health**:
   - Circular dependencies: npm run deps:circular (baseline: 0 expected)
   - Unused exports: npm run deps:unused (baseline documented in DEVELOPMENT.md)
5. **Static Analysis** (../analysis/sonarqube-manifest.md): Pre-identified script quality issues
6. **Workflow Documentation** (if available): CI/CD process docs, hook documentation

These resources provide essential context about automation expectations and known issues.

SCOPE

Include: [directories and files]
Secondary: [optional]
Exclude: [excluded]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>, repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:
- Run in "LIMITED MODE": Provide general recommendations only
- Note: Script testing requires repo access
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A process finding is CONFIRMED only if it includes:
- at least one concrete file path OR workflow name AND
- at least one specific issue (missing check, false positive, coverage gap)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these 6 categories)

1) CI/CD Pipeline Coverage & Reliability
2) Git Hooks Effectiveness
3) Script Maintainability & Test Coverage
4) Pattern Checker Completeness
5) Trigger Threshold Appropriateness
6) Workflow Documentation Accuracy
```

### Part 3: Process Audit Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning, verify you can access the repository:
1. State whether you can access files
2. If YES, list 5-10 workflow/script files you can see
3. If NO, proceed with limited analysis

PHASE 2: PROCESS INVENTORY

Create a complete inventory:
- List all CI/CD workflow files
- List all git hooks (if visible)
- List all automation scripts in scripts/
- List all package.json scripts
- Identify quality gate entry points
- Map trigger conditions
At the end: "Phase 2 complete - Process inventory: [count] workflows, [count] scripts"

PHASE 3: CATEGORY-BY-CATEGORY ANALYSIS

For each of the 6 categories, perform systematic analysis:

Category 1: CI/CD Pipeline Coverage & Reliability
CHECKS:
[ ] All critical paths have CI checks
[ ] Tests run on every PR
[ ] Linting enforced in CI (not just pre-commit)
[ ] Type checking enforced in CI
[ ] Security scans present (dependency audit, etc.)
[ ] Build verification present
[ ] Deployment automation exists
[ ] Workflow permissions principle of least privilege
[ ] Secrets properly managed (not hardcoded)
[ ] Failure notifications configured
[ ] Retry logic for flaky steps
[ ] Timeout configurations appropriate

ANALYSIS:
- Review .github/workflows/*.yml (or equivalent)
- Check which quality gates run in CI vs only locally
- Identify missing CI checks
- Check for single points of failure
- Assess pipeline speed vs thoroughness

VERIFICATION COMMANDS (if available):
- cat .github/workflows/*.yml | grep -A 5 "on:"
- Check what runs on: [pull_request, push, schedule]
- Verify test/lint/build steps present

Mark each check: ISSUE | OK | N/A
List specific coverage gaps or reliability concerns.

Category 2: Git Hooks Effectiveness
CHECKS:
[ ] Pre-commit hook exists and runs
[ ] Pre-commit checks are fast (< 10 seconds ideal)
[ ] Pre-commit hook is not too strict (allows commits)
[ ] Pre-push hook exists for expensive checks
[ ] Pre-push hook validates critical requirements
[ ] Hooks are easy to bypass with documented reason (--no-verify)
[ ] Session hooks (if applicable) provide value
[ ] Hooks fail gracefully with clear messages
[ ] Hook scripts have execute permissions
[ ] Hooks are consistent with CI checks

ANALYSIS:
- Check .git/hooks/, .husky/, package.json scripts
- Test hook execution if possible
- Assess hook performance (speed)
- Check for hook bypass instructions
- Compare hook checks with CI checks (should align)

PATTERNS TO FIND:
- Overly strict hooks blocking workflow
- Missing critical checks in hooks
- Hooks that duplicate CI unnecessarily
- Slow hooks (> 30 seconds)

Mark each check: ISSUE | OK | N/A
List specific hook effectiveness problems.

Category 3: Script Maintainability & Test Coverage
CHECKS:
[ ] All scripts have clear purposes (documented)
[ ] Scripts follow consistent coding style
[ ] Scripts have error handling
[ ] Scripts have test coverage
[ ] Scripts are modular (not monolithic)
[ ] Scripts have usage documentation
[ ] Scripts validate inputs
[ ] Scripts provide helpful error messages
[ ] Scripts are idempotent (safe to re-run)
[ ] No hardcoded paths or assumptions

ANALYSIS:
- Review scripts/ directory
- Check for accompanying tests in tests/scripts/
- Assess code quality (complexity, error handling)
- Look for documentation (comments, README)
- Identify scripts without tests

VERIFICATION COMMANDS (if available):
- ls -la scripts/
- find tests/ -name "*script*.test.js" (or similar)
- npm test -- --grep "scripts"
- Check test coverage for scripts/

Mark each check: ISSUE | OK | N/A
List specific maintainability or testing gaps.

Category 3b: Script Trigger Coverage (NEW - Session #48)
CHECKS:
[ ] All scripts have npm run commands (discoverability)
[ ] Critical scripts have automatic triggers (session-start, pre-commit, CI)
[ ] Validation scripts run when relevant files change
[ ] Scripts that should run together are chained properly
[ ] Manual-only scripts are documented as intentionally manual
[ ] No orphan scripts (created but never integrated)

ANALYSIS:
- List all scripts in scripts/ directory
- Cross-reference with package.json scripts section
- Check session-start.sh for script invocations
- Check pre-commit/pre-push hooks for script invocations
- Check CI workflows for script invocations
- Identify scripts with NO automatic trigger

AUDIT COMMAND:
```bash
# List scripts without npm commands (use full path for reliable matching)
shopt -s nullglob 2>/dev/null  # Prevent literal glob if no matches
script_files=(scripts/*.js scripts/*.sh)
if [ ${#script_files[@]} -eq 0 ]; then
  echo "No scripts found under scripts/ (expected scripts/*.js or scripts/*.sh)"
else
  for f in "${script_files[@]}"; do
    grep -q "$f" package.json || echo "NO NPM: $f"
  done
fi

# Check session-start triggers
grep -E "node scripts/|npm run" .claude/hooks/session-start.sh

# Check CI triggers
grep -E "node scripts/|npm run" .github/workflows/*.yml
```

TRIGGER CATEGORIES:
- Session Start: Pattern checks, consolidation, lessons surfacing
- Pre-commit: Lint, format, patterns, tests
- Pre-push: Tests, deps check, type check
- CI: All of above + doc checks, CANON validation
- Manual: Archive, deploy, one-time operations

Mark each check: ISSUE | OK | N/A
List scripts without appropriate automatic triggers.

Category 4: Pattern Checker Completeness
CHECKS:
[ ] Pattern checker exists
[ ] Pattern definitions are up-to-date
[ ] All known anti-patterns have checks
[ ] Pattern checker runs in CI
[ ] Pattern checker provides clear guidance
[ ] False positives are minimized
[ ] Pattern checker is documented
[ ] Patterns reference documentation (AI_REVIEW_LEARNINGS_LOG.md)
[ ] Pattern checker catches violations before merge

ANALYSIS:
- Review scripts/check-pattern-compliance.js (or equivalent)
- Check patterns defined vs AI_REVIEW_LEARNINGS_LOG.md
- Test pattern checker against known violations
- Assess false positive rate
- Check integration with CI

VERIFICATION:
- npm run patterns:check (capture output)
- Compare patterns in checker with documented anti-patterns
- Check CI workflow includes pattern check

Mark each check: ISSUE | OK | N/A
List specific pattern coverage gaps.

Category 5: Trigger Threshold Appropriateness
CHECKS:
[ ] Review triggers are event-based (not time-based)
[ ] Thresholds are calibrated to project activity
[ ] Triggers fire when needed
[ ] Triggers don't fire too frequently (alert fatigue)
[ ] Trigger logic is documented
[ ] Trigger actions are clear
[ ] Trigger override mechanism exists
[ ] Triggers are testable

ANALYSIS:
- Review scripts/check-review-needed.js (or equivalent)
- Check trigger thresholds (commits, files, time)
- Assess if thresholds match project pace
- Look for trigger documentation
- Check override mechanisms

PATTERNS TO FIND:
- Time-based triggers (brittle)
- Thresholds that never trigger
- Thresholds that trigger too often
- Undocumented trigger logic

Mark each check: ISSUE | OK | N/A
List specific threshold calibration problems.

Category 6: Workflow Documentation Accuracy
CHECKS:
[ ] CI/CD workflows documented
[ ] Hook setup instructions present
[ ] Script usage documented
[ ] Troubleshooting guides exist
[ ] Process flowcharts/diagrams present
[ ] Documentation matches actual implementation
[ ] Onboarding covers automation setup
[ ] Known issues/workarounds documented

ANALYSIS:
- Review docs for workflow/process documentation
- Compare documented workflows with actual implementation
- Check for missing or stale process docs
- Verify setup instructions work

VERIFICATION:
- Find documentation about CI/CD, hooks, scripts
- Test documented commands
- Check for staleness (last updated dates)

Mark each check: ISSUE | OK | N/A
List specific documentation gaps or inaccuracies.

After each category: "Category X complete - Issues found: [number]"

PHASE 4: DRAFT PROCESS FINDINGS

For each issue, create detailed entry:
- Exact file path or workflow name
- Issue description
- Impact on development velocity or reliability
- Severity (S0/S1/S2/S3)
- Effort to fix (E0/E1/E2/E3)
- Recommended improvement
- Verification steps

Process Severity Guide:
- S0 (Critical): Pipeline broken, blocking deployments
- S1 (High): Major coverage gap, frequent failures, significant friction
- S2 (Medium): Minor coverage gap, occasional issues, moderate friction
- S3 (Low): Nice-to-have improvements, documentation gaps

Number findings sequentially.
At the end: "Phase 4 complete - Total process findings: [count]"

PHASE 5: AUTOMATION HEALTH METRICS

Calculate process health metrics:
- CI success rate: [X%]
- Hook bypass frequency: [estimated]
- Script test coverage: [X%]
- Pattern checker violations: [count]
- Documentation completeness: [X%]

PHASE 6: RECOMMENDATIONS SUMMARY

Prioritize by:
1. Impact on reliability (higher first)
2. Impact on developer velocity (higher first)
3. Effort to fix (lower first)

Identify:
- Critical fixes (blocking or high-friction)
- Important improvements (reliability or coverage)
- Nice-to-have enhancements (polish)

At the end: "Phase 6 complete - Ready to output"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order:

1) HEALTH_METRICS_JSON
{
  "audit_date": "YYYY-MM-DD",
  "ci_success_rate": "X%",
  "script_test_coverage": "X%",
  "pattern_violations_count": X,
  "hook_count": X,
  "workflow_count": X,
  "documentation_completeness": "X%"
}

2) FINDINGS_JSONL
(one JSON object per line, each must be valid JSON)

Schema:
{
  "category": "CI/CD|Hooks|Scripts|Pattern Checker|Triggers|Workflow Docs",
  "title": "short, specific issue",
  "fingerprint": "<category>::<file_or_workflow>::<issue_type>",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "confidence": 0-100,
  "files": ["path1", "workflow_name"],
  "issue_details": {
    "description": "what's wrong",
    "impact": "how it affects development",
    "examples": ["specific instances"]
  },
  "improvement": {
    "steps": ["step 1", "step 2"],
    "verification": ["how to verify improvement"]
  },
  "evidence": ["script output or workflow logs"],
  "notes": "optional"
}

3) SUSPECTED_FINDINGS_JSONL
(same schema, but confidence <= 40; needs testing to confirm)

4) HUMAN_SUMMARY (markdown)
- Process health overview
- Critical issues requiring immediate attention
- Top 5 automation improvements
- Coverage gaps to address
- Recommended improvement order
```

### Part 5: Process Verification Commands

```markdown
PROCESS VERIFICATION (run if run_commands=yes)

1) CI Workflow Analysis:
- ls -la .github/workflows/
- cat .github/workflows/*.yml | grep -E "on:|runs-on:|steps:" | head -50

2) Hook Detection:
- ls -la .git/hooks/ 2>/dev/null || echo "No .git/hooks"
- cat .husky/pre-commit 2>/dev/null | head -20
- grep "husky\|pre-commit\|pre-push" package.json

3) Script Inventory:
- ls -la scripts/
- find tests/ -name "*script*" 2>/dev/null

4) Pattern Checker:
- npm run patterns:check 2>&1 | head -50

5) Trigger Logic:
- npm run review:check 2>&1 | head -50

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

### Step 2: Run Process Aggregator

```markdown
ROLE

You are the Process Audit Aggregator. Merge multiple AI process audit outputs into one prioritized improvement plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent process issues not in auditor outputs
- Prioritize by impact on reliability and velocity

DEDUPLICATION RULES

1) Primary merge: same workflow/script + same issue type
2) Secondary merge: same improvement recommendation
3) Take most complete analysis when disagreement

SEVERITY HANDLING

If models disagree on severity:
- Take HIGHER severity if 2+ models agree
- For pipeline/hook issues: Consider impact on all developers

OUTPUT

1) CONSOLIDATED_METRICS_JSON
2) DEDUPED_FINDINGS_JSONL (with canonical_id)
3) IMPROVEMENT_PLAN_JSON (ordered by priority)
```json
{
  "improvements": [
    {
      "improvement_id": "IMP-001",
      "title": "...",
      "goal": "...",
      "priority": "high|medium|low",
      "included_canonical_ids": ["CANON-0001"],
      "estimated_effort": "E0|E1|E2|E3",
      "acceptance_tests": ["..."],
      "notes": "implementation guidance"
    }
  ],
  "execution_order": ["IMP-001", "IMP-002"]
}
```

4) HUMAN_SUMMARY
- Narrative summary of process health
- Top 3 process risks identified
- Quick wins (E0-E1 improvements)
- Recommended improvement sequence
```

### Step 3: Create Process Findings Document

Create `docs/reviews/PROCESS_AUDIT_[YYYY]_Q[X].md` with:
- Health metrics dashboard
- All findings with improvement steps
- Prioritized implementation order
- Estimated effort for full improvement

---

## Implementation Workflow

After aggregation, implement improvements using this workflow:

### Step 1: Process Improvement Implementer

```markdown
ROLE

You are a DevOps Engineer implementing improvements from a process audit.

HARD RULES
- Test all workflow/script changes before committing
- Ensure backwards compatibility
- Document all automation changes
- Verify CI still passes after changes

PROCESS
1) Implement improvement
2) Test locally (run script, trigger hook)
3) Test in CI (push to branch, check workflow)
4) Document changes (README, inline comments)
```

### Step 2-4: Same as Code Review Template

Use R1, R2, and Between-PR checklist from MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md.

---

## Audit History

| Date | Type | Trigger | Models Used | Findings | Health Score |
|------|------|---------|-------------|----------|--------------|
| [Date] | Process Audit | [Reason] | [Models] | [X findings] | [Before → After] |

---

## AI Instructions

When using this template:

1. **Copy this template** to `docs/reviews/PROCESS_AUDIT_PLAN_[YYYY]_Q[X].md`
2. **Fill in Audit Context** with project-specific details
3. **Run the process audit prompt** on each model
4. **Collect outputs** in specified formats
5. **Run aggregation** for consolidated findings
6. **Create canonical findings doc**
7. **Prioritize by impact/effort**
8. **Update MULTI_AI_REVIEW_COORDINATOR.md** with audit results

**Quality checks before finalizing:**
- [ ] All 6 categories covered
- [ ] CI/CD coverage validated
- [ ] Hook effectiveness assessed
- [ ] Script test coverage checked
- [ ] Improvement steps actionable

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](./JSONL_SCHEMA_STANDARD.md)** - Canonical JSONL schema for all review templates
- **MULTI_AI_REVIEW_COORDINATOR.md** - Master index and trigger tracking
- **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md** - General code review template
- **AI_WORKFLOW.md** - AI development workflow documentation
- **GitHub workflows** - CI/CD workflow files (`.github/workflows/`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.3 | 2026-01-11 | Session #48: Added Category 3b "Script Trigger Coverage" - checks for orphan scripts, missing npm commands, and automatic trigger gaps | Claude |
| 1.2 | 2026-01-06 | Review #68: Updated document header to 1.1; Added HUMAN_SUMMARY content description | Claude |
| 1.1 | 2026-01-06 | Review #67: Aligned category enum (Documentation → Workflow Docs) to match AGGREGATOR | Claude |
| 1.0 | 2026-01-05 | Initial template creation - Process & Automation audit category added to multi-AI review framework | Claude |

---

**END OF MULTI_AI_PROCESS_AUDIT_TEMPLATE.md**
