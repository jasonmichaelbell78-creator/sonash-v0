# [Project Name] Multi-AI Engineering Productivity Audit Plan

**Document Version:** 1.0 **Created:** 2026-02-04 **Last Updated:** 2026-02-04
**Tier:** 3 (Planning) **Status:** PENDING | IN_PROGRESS | COMPLETE **Overall
Completion:** 0%

> **Multi-Agent Capability Note:** This template assumes orchestration by Claude
> Code which can spawn parallel agents via the Task tool. Other AI systems
> (ChatGPT, Gemini, etc.) cannot call multiple agents and should execute
> sections sequentially or use external orchestration.

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

## Purpose

This document serves as the **execution plan** for running a multi-AI
engineering productivity audit on [Project Name]. Use this template when:

- Developer experience (DX) friction is high
- Onboarding new developers takes too long
- Debugging issues is difficult or time-consuming
- Offline support gaps cause data loss or user frustration
- Build pipeline or CI/CD is slow or unreliable
- Test infrastructure needs improvement
- Quarterly engineering health check

**Review Scope (5 Categories):**

| #   | Domain                         | Location                               | Count |
| --- | ------------------------------ | -------------------------------------- | ----- |
| 1   | Golden Path & Onboarding       | `README.md`, `DEVELOPMENT.md`, scripts | [X]   |
| 2   | Debugging & Observability      | `lib/logger.*`, error handlers, hooks  | [X]   |
| 3   | Offline Support & Persistence  | `lib/offline/`, sync queue, storage    | [X]   |
| 4   | Build Pipeline & CI/CD         | `.github/workflows/`, `package.json`   | [X]   |
| 5   | Test Infrastructure & Coverage | `tests/`, `.husky/`, test configs      | [X]   |

**Expected Output:** Engineering productivity findings with improvement plan,
baseline metrics, and prioritized recommendations ingested to TDMS.

---

## Status Dashboard

| Step   | Description                                  | Status  | Completion |
| ------ | -------------------------------------------- | ------- | ---------- |
| Step 1 | Establish baseline metrics                   | PENDING | 0%         |
| Step 2 | Run multi-AI productivity audit (4-6 models) | PENDING | 0%         |
| Step 3 | Collect and validate outputs                 | PENDING | 0%         |
| Step 4 | Run aggregation                              | PENDING | 0%         |
| Step 5 | Create canonical findings doc                | PENDING | 0%         |
| Step 6 | Generate improvement plan                    | PENDING | 0%         |
| Step 7 | Ingest to TDMS                               | PENDING | 0%         |

**Overall Progress:** 0/7 steps complete

---

## Audit Context

### Repository Information

```
Repository URL: [GITHUB_REPO_URL]
Branch: [BRANCH_NAME or "main"]
Commit: [COMMIT_SHA or "latest"]
Last Engineering Productivity Audit: [YYYY-MM-DD or "Never"]
```

### Tech Stack Considerations

```
- Framework: [e.g., Next.js 16.1] - Build tooling, dev server
- Monorepo: [Yes/No] - Multiple packages, shared dependencies
- CI/CD: [e.g., GitHub Actions] - Workflow count, average runtime
- Testing: [e.g., Jest, Playwright] - Coverage, test count
- Logging: [e.g., Pino, Winston] - Structured vs console.log ratio
```

### Scope

```
Include:
- package.json scripts analysis
- scripts/ directory
- .husky/ hooks
- .github/workflows/
- lib/logger.ts, error handling
- Offline support infrastructure

Exclude:
- Third-party dependencies internals
- Legacy archive directories
```

---

## AI Models to Use

**Recommended configuration (4-6 models for consensus):**

| Model             | Capabilities                           | Productivity Strength                          |
| ----------------- | -------------------------------------- | ---------------------------------------------- |
| Claude Opus 4.6   | browse_files=yes, run_commands=yes     | Comprehensive DX analysis, pattern recognition |
| Claude Sonnet 4.5 | browse_files=yes, run_commands=yes     | Cost-effective workflow analysis               |
| GPT-5-Codex       | browse_files=yes, run_commands=yes     | Build system expertise, CI/CD optimization     |
| Gemini 3 Pro      | browse_files=yes, run_commands=yes     | Alternative perspective, fresh insights        |
| GitHub Copilot    | browse_files=yes, run_commands=limited | Quick pattern detection, script analysis       |
| ChatGPT-4o        | browse_files=no, run_commands=no       | DX best practices, broad ecosystem knowledge   |

**Selection criteria:**

- At least 2 models with `run_commands=yes` for verification
- At least 1 model with strong CI/CD expertise
- Total 4-6 models for good consensus

---

## Engineering Productivity Audit Prompt (Copy for Each AI Model)

### Part 1: Role and Context

```markdown
ROLE

You are a senior DevEx engineer performing a comprehensive engineering
productivity audit. Your goal is to identify friction points, automation gaps,
and opportunities to improve developer experience.

REPO

[GITHUB_REPO_URL]

STACK / CONTEXT

- Framework: [Framework] [Version]
- CI/CD: [Provider]
- Testing: [Framework]
- Logging: [Library]

PRE-REVIEW CONTEXT (REQUIRED READING)

Before beginning, review these project-specific resources:

1. **AI Learnings** (claude.md Section 4): Critical anti-patterns
2. **Development Guide** (DEVELOPMENT.md): Setup process, known friction
3. **npm scripts**: Run `npm run` to see available commands
4. **CI Workflows**: Check `.github/workflows/` for pipeline structure

SCOPE

Include: [directories] Exclude: [directories]

CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse_files=<yes/no>, run_commands=<yes/no>,
repo_checkout=<yes/no>, limitations="<one sentence>"

If browse_files=no OR repo_checkout=no:

- Run in "NO-REPO MODE": Cannot complete audit without repo access
- Stop immediately and report limitation
```

### Part 2: Anti-Hallucination Rules

```markdown
NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:

- at least one concrete file path AND
- at least one specific indicator (code snippet, metric value, missing file)

If you cannot provide both, put it in SUSPECTED_FINDINGS with confidence <= 40.

FOCUS AREAS (use ONLY these 5 categories)

1. Golden Path & Developer Onboarding
2. Debugging Ergonomics & Observability
3. Offline Support & Data Persistence
4. Build Pipeline & CI/CD Efficiency
5. Test Infrastructure & Coverage
```

### Part 3: Audit Phases

```markdown
PHASE 1: REPOSITORY ACCESS VALIDATION

Before beginning, verify you can access the repository:

1. State whether you can access files
2. If YES, list 3-5 productivity-relevant files you can see
3. If NO, stop immediately

PHASE 2: BASELINE METRICS COLLECTION

Collect these metrics before analysis:

DEVELOPER ONBOARDING: [ ] Time from clone to running tests (estimated) [ ] npm
scripts count [ ] Setup automation scripts present [ ] .env.example completeness
[ ] README setup instructions quality

DEBUGGING ERGONOMICS: [ ] Console.log vs logger ratio [ ] Correlation ID support
[ ] Error boundary coverage [ ] Sentry/monitoring integration [ ] Error message
quality

OFFLINE SUPPORT: [ ] Firebase persistence enabled [ ] Service worker present [ ]
Offline write queue exists [ ] Network status indicators [ ] LocalStorage vs
IndexedDB usage

BUILD & CI/CD: [ ] CI workflow count [ ] Average CI runtime (if visible) [ ]
Caching effectiveness [ ] Parallel job usage [ ] Failed build frequency

TESTING: [ ] Test file count [ ] Coverage percentage [ ] E2E test presence [ ]
Test isolation quality

At the end: "Phase 2 complete - Baselines collected"

PHASE 3: CATEGORY-BY-CATEGORY ANALYSIS

Category 1: Golden Path & Developer Onboarding REQUIRED CHECKS: [ ] npm run dev
starts cleanly [ ] Setup script exists and works [ ] .env.example documents all
required vars [ ] README has clear getting started [ ] Troubleshooting guide
exists [ ] Development workflow documented

VERIFICATION COMMANDS:

- cat package.json | grep -A 50 '"scripts"'
- ls scripts/
- cat .env.example 2>/dev/null || echo "No .env.example"
- head -100 README.md

Mark each check: PASS | FAIL | PARTIAL | N/A Quote specific evidence.

Category 2: Debugging Ergonomics & Observability REQUIRED CHECKS: [ ] Structured
logging (not console.log) [ ] Correlation IDs for request tracing [ ] Meaningful
error messages [ ] Error boundaries in React [ ] Sentry or equivalent monitoring
[ ] Source maps in production

VERIFICATION COMMANDS:

- grep -r "console.log" --include="\*.ts" --include="\*.tsx" app/ lib/
  components/ | wc -l
- grep -r "logger\." --include="\*.ts" --include="\*.tsx" app/ lib/ components/
  | wc -l
- grep -r "correlationId\|x-request-id" --include="\*.ts" .

Mark each check: PASS | FAIL | PARTIAL | N/A Quote specific evidence.

Category 3: Offline Support & Data Persistence REQUIRED CHECKS: [ ] Firebase
IndexedDB persistence enabled [ ] Service worker for offline shell [ ] Write
queue for offline mutations [ ] Sync indicators in UI [ ] Conflict resolution
strategy

VERIFICATION COMMANDS:

- grep -r "enableIndexedDbPersistence" lib/
- ls public/sw.js 2>/dev/null || echo "No service worker"
- grep -r "offline" --include="\*.tsx" components/

Mark each check: PASS | FAIL | PARTIAL | N/A Quote specific evidence.

Category 4: Build Pipeline & CI/CD Efficiency REQUIRED CHECKS: [ ] Dependency
caching in CI [ ] Parallel test execution [ ] Incremental builds where possible
[ ] Build time under 10 minutes [ ] Clear failure messages [ ] Auto-retry on
flaky failures

VERIFICATION COMMANDS:

- ls .github/workflows/
- cat .github/workflows/ci.yml 2>/dev/null | head -100
- grep -r "cache:" .github/workflows/

Mark each check: PASS | FAIL | PARTIAL | N/A Quote specific evidence.

Category 5: Test Infrastructure & Coverage REQUIRED CHECKS: [ ] Tests organized
by domain [ ] Mocking strategy documented [ ] E2E tests exist [ ] Coverage
reporting in CI [ ] Test isolation (no shared state) [ ] Fast test feedback
(<30s for unit tests)

VERIFICATION COMMANDS:

- ls tests/ 2>/dev/null || ls **tests**/ 2>/dev/null
- grep -r "describe\|test\|it(" tests/ | wc -l
- cat jest.config.\* 2>/dev/null | head -30

Mark each check: PASS | FAIL | PARTIAL | N/A Quote specific evidence.

After each category: "Category X complete - Issues found: [number]"

PHASE 4: DRAFT FINDINGS

For each issue, create detailed entry:

- Exact file path and line numbers
- Current state description
- Impact on developer productivity
- Severity (S0/S1/S2/S3)
- Effort to fix (E0/E1/E2/E3)
- Recommended fix
- Acceptance tests to verify fix

Severity Guide:

- S0 (Critical): Data loss, production breaking, major workflow blocked
- S1 (High): Significant daily friction, missing core infrastructure
- S2 (Medium): Maintainability drag, inconsistency, slow workflows
- S3 (Low): Polish, nice-to-have improvements

At the end: "Phase 4 complete - Total findings: [count]"

PHASE 5: QUICK WINS IDENTIFICATION

Identify "quick wins" (E0-E1 effort with high impact):

- Missing npm scripts that would save time
- Console.log → logger conversions
- Missing .env.example entries
- README clarifications
- CI cache additions

Rank by: Impact / Effort ratio

At the end: "Phase 5 complete - Quick wins identified: [count]"
```

### Part 4: Output Format

```markdown
OUTPUT FORMAT (STRICT)

Return 4 sections in this exact order:

1. BASELINE_METRICS_JSON { "audit_date": "YYYY-MM-DD", "npm_scripts_count": X,
   "console_log_count": X, "logger_count": X, "structured_logging_ratio": "X:Y",
   "service_worker": true/false, "firebase_persistence": true/false,
   "ci_workflow_count": X, "test_count": X }

2. FINDINGS_JSONL (one JSON object per line, each must be valid JSON)

**NOTE:** The `category` field MUST be `"engineering-productivity"`
(domain-level). Sub-categories (GoldenPath, Debugging, Offline, etc.) go in
fingerprint/title only.

Schema: { "category": "engineering-productivity", "title": "short, specific
issue", "fingerprint": "engineering-productivity::<primary_file>::<issue_type>",
"severity": "S0|S1|S2|S3", "effort": "E0|E1|E2|E3", "confidence": 0-100,
"files": ["path1", "path2"], "why_it_matters": "1-3 sentences explaining
developer impact", "suggested_fix": "Concrete remediation direction",
"acceptance_tests": ["Array of verification steps"], "evidence": ["grep output
or code snippet"], "line": 123 }

**REQUIRED FIELDS:** `files` (at least one path) and `line` (primary line
number, use 1 if file-wide) are REQUIRED for ROADMAP cross-reference.

3. SUSPECTED_FINDINGS_JSONL (same schema, but confidence <= 40; needs more
   investigation)

4. HUMAN_SUMMARY (markdown)

- Baseline metrics summary
- Top 5 friction points
- Quick wins (E0-E1)
- Prioritized improvement roadmap
- Estimated effort for full improvement
```

---

## Aggregation Process

### Step 1: Collect Outputs

For each AI model, save:

- `[model-name]_baseline.json`
- `[model-name]_findings.jsonl`
- `[model-name]_suspected.jsonl`
- `[model-name]_summary.md`

### Step 2: Run Aggregator

Use this aggregation prompt with a capable model:

```markdown
ROLE

You are the Engineering Productivity Audit Aggregator. Merge multiple AI audit
outputs into one deduplicated, prioritized improvement plan.

NON-NEGOTIABLE PRINCIPLES

- You are an AGGREGATOR, not a fresh auditor
- You MUST NOT invent issues not in auditor outputs
- Prioritize by impact on daily developer workflow

DEDUPLICATION RULES

1. Primary merge: same file + same issue type
2. Secondary merge: same category + same remediation
3. Never merge different issue types

SEVERITY ESCALATION

If models disagree on severity:

- Take the HIGHER severity if 2+ models agree
- Take the HIGHER severity if any model has evidence

OUTPUT

1. CONSOLIDATED_BASELINE_JSON
2. DEDUPED_FINDINGS_JSONL (with canonical_id)
3. IMPROVEMENT_PLAN_JSON (ordered by impact/effort ratio)
4. HUMAN_SUMMARY
```

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

## TDMS Integration

### Automatic Intake

After aggregation, ingest findings to TDMS:

```bash
node scripts/debt/intake-audit.js \
  docs/audits/single-session/engineering-productivity/AUDIT_YYYY_QX.jsonl \
  --source "multi-ai-engineering-productivity-audit" \
  --batch-id "eng-productivity-audit-YYYYMMDD"
```

### Required TDMS Fields

Ensure all findings include these fields for TDMS compatibility:

| Audit Field      | TDMS Field    | Notes                                  |
| ---------------- | ------------- | -------------------------------------- |
| `category`       | `category`    | Map to "process" (see mapping below)   |
| `severity`       | `severity`    | S0/S1/S2/S3 (unchanged)                |
| `files[0]`       | `file`        | Primary file path                      |
| `line`           | `line`        | Line number (use 1 if file-wide)       |
| `title`          | `title`       | Short description                      |
| `why_it_matters` | `description` | Full description with developer impact |

### Category Mapping (Engineering Productivity → TDMS)

| Audit Category | TDMS Category |
| -------------- | ------------- |
| GoldenPath     | process       |
| Debugging      | process       |
| Offline        | process       |
| CI_CD          | process       |
| Testing        | process       |
| Engineering    | process       |

---

## Audit History

| Date   | Type                     | Trigger  | Models Used | Findings     | TDMS Items   |
| ------ | ------------------------ | -------- | ----------- | ------------ | ------------ |
| [Date] | Engineering Productivity | [Reason] | [Models]    | [X findings] | [X ingested] |

---

> **Shared Boilerplate:** Common sections (AI Models, Severity/Effort scales,
> JSONL schema, TDMS integration, Aggregation process) are canonicalized in
> [SHARED_TEMPLATE_BASE.md](./SHARED_TEMPLATE_BASE.md). Domain-specific content
> below takes precedence.

## AI Instructions

When using this template:

1. **Copy this template** to
   `docs/reviews/ENGINEERING_PRODUCTIVITY_AUDIT_PLAN_[YYYY]_Q[X].md`
2. **Fill in Audit Context** with project-specific details
3. **Establish baseline metrics** first
4. **Run the audit prompt** on each model
5. **Collect outputs** in specified formats
6. **Run aggregation** for consolidated findings
7. **Create canonical findings doc**
8. **Ingest to TDMS** using `node scripts/debt/intake-audit.js`
9. **Prioritize and implement** based on impact/effort
10. **Update Audit History** in this file (include TDMS Items count)
11. **Update [COORDINATOR.md](../COORDINATOR.md)** with audit results

**Quality checks before finalizing:**

- [ ] All 5 categories assessed
- [ ] Baseline metrics captured
- [ ] Quick wins identified (E0-E1)
- [ ] Severity ratings justified
- [ ] Improvement steps actionable
- [ ] TDMS intake completed without errors
- [ ] DEBT-XXXX IDs assigned to all findings

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** -
  Canonical JSONL schema
- **[docs/technical-debt/PROCEDURE.md](../../technical-debt/PROCEDURE.md)** -
  TDMS intake and tracking
- **[COORDINATOR.md](../COORDINATOR.md)** - Master index and trigger tracking
- **[PROCESS_AUDIT.md](./PROCESS_AUDIT.md)** - Process/automation audit (related
  scope)
- **[DEVELOPMENT.md](../../../DEVELOPMENT.md)** - Development setup
  documentation

---

## Version History

| Version | Date       | Changes                                                                                                    | Author |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| 1.1     | 2026-02-16 | AUDIT_STANDARDS compliance: Converted Review Focus Areas to Review Scope table with Location/Count columns | Claude |
| 1.0     | 2026-02-04 | Initial template creation                                                                                  | Claude |

---

**END OF ENGINEERING_PRODUCTIVITY_AUDIT.md**
