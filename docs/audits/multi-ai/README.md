# Multi-AI Audit Results

**Created:** 2026-01-08 **Updated:** 2026-01-13 **Purpose:** Store results from
multi-AI consensus audits

---

## Overview

This folder contains audit results from multi-AI consensus reviews. These are
comprehensive audits performed by 4-6 AI models working together, designed to
provide high-confidence findings through cross-validation and consensus scoring.

## Folder Structure

```
multi-ai/
├── code/           # Multi-AI code review results
├── security/       # Multi-AI security audit results
├── performance/    # Multi-AI performance audit results
├── refactoring/    # Multi-AI refactoring audit results
├── documentation/  # Multi-AI documentation audit results
├── process/        # Multi-AI process audit results
└── README.md       # This file
```

## Available Templates

| Template                                    | Description           | Focus Areas                                                                          |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| `MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md`     | Code review audit     | Hygiene, Types, Framework, Security, Testing, **AI-Code Failure Modes**              |
| `MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md`  | Security audit        | Auth, Injection, Secrets, Firebase, Deps, OWASP, **Headers, Framework, Crypto, Agent** |
| `MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md` | Performance audit   | Bundle, Rendering, Data Fetch, Memory, Web Vitals                                    |
| `MULTI_AI_REFACTOR_AUDIT_PROMPT.md`         | Refactoring audit     | God Objects, Duplication, Complexity, Architecture, Tech Debt                        |
| `MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md`  | Documentation audit   | Links, Stale Content, Coverage, Tier, Frontmatter, Sync                              |
| `MULTI_AI_PROCESS_AUDIT_TEMPLATE.md`        | Process audit         | CI/CD, Git Hooks, Claude Hooks, Scripts, Triggers                                    |

### Extended Coverage (2026-01-13)

Multi-AI templates now include additional categories for vibe-coded apps:

**Security Audit (12 categories):**
- Hosting Headers: CSP, HSTS, X-Frame-Options, COOP, COEP
- Framework-Specific: Next.js server/client boundary leaks, API route auth
- File Handling: Insecure uploads, path traversal
- Crypto: Weak randomness, broken hashing, homegrown crypto
- AI Agent Security: Prompt injection in configs, agent manipulation surfaces

**Code Review (6 categories):**
- AI-Generated Code Failure Modes: Happy-path only logic, trivial test assertions,
  hallucinated dependencies, copy/paste anti-patterns, inconsistent architecture

## Output Format

Each multi-AI audit produces multiple files:

1. **Plan Document**: `[AUDIT]_PLAN_[YYYY]_Q[X].md` - Execution plan and context
2. **Model Outputs**: `[model-name]_findings.jsonl` - Per-model findings
3. **Aggregated Findings**: `DEDUPED_FINDINGS.jsonl` - Deduplicated consensus
4. **Canonical Document**: `[AUDIT]_[YYYY]_Q[X].md` - Final human-readable report

### JSONL Schema (Aggregated)

```json
{
  "canonical_id": "CANON-0001",
  "category": "Category name",
  "title": "Short description",
  "severity": "S0|S1|S2|S3",
  "effort": "E0|E1|E2|E3",
  "status": "CONFIRMED|SUSPECTED",
  "final_confidence": 0-100,
  "consensus_score": 0-5,
  "sources": ["model1", "model2"],
  "confirmations": 3,
  "suspects": 1,
  "files": ["path/to/file.ts"],
  "symbols": ["FunctionName"],
  "why_it_matters": "Impact description",
  "suggested_fix": "Remediation direction",
  "acceptance_tests": ["how to verify"],
  "pr_bucket_suggestion": "grouping for PR",
  "dependencies": ["CANON-0003"],
  "evidence_summary": ["key evidence points"]
}
```

---

## Consensus Mechanism

Multi-AI audits use consensus scoring to validate findings:

### Consensus Score (0-5)

| Points | Criteria                                    |
| ------ | ------------------------------------------- |
| +2     | >=2 models confirmed the finding            |
| +1     | >=3 total models mentioned it               |
| +1     | Any model provided tool-confirmed evidence  |
| +1     | Evidence overlap between models             |

### Confidence Adjustments

- If only 1 source + no tool confirm: cap at 60
- If all suspected: cap at 40
- If >=2 confirmed + evidence overlap: floor at 70

### Deduplication Rules

1. **Primary merge**: Same fingerprint (exact match)
2. **Secondary merge**: Same category + shared file/symbol + similar fix
3. **Never merge**: Different vulnerability/issue types

---

## Severity Scale

| Level | Meaning  | Action                  |
| ----- | -------- | ----------------------- |
| S0    | Critical | Immediate fix required  |
| S1    | High     | Fix before next release |
| S2    | Medium   | Fix when convenient     |
| S3    | Low      | Nice to have            |

## Effort Scale

| Level | Meaning | Time Estimate |
| ----- | ------- | ------------- |
| E0    | Trivial | Minutes       |
| E1    | Small   | Hours         |
| E2    | Medium  | Day(s)        |
| E3    | Large   | Week+         |

---

## Relationship to Single-Session Audits

Multi-AI audits are **complementary** to single-session audits:

| Aspect          | Single-Session                | Multi-AI                     |
| --------------- | ----------------------------- | ---------------------------- |
| Models          | 1 (Claude Code)               | 4-6 (various)                |
| Consensus       | No                            | Yes                          |
| Threshold Reset | Category-specific             | All categories               |
| Frequency       | On-demand                     | Threshold-triggered          |
| Output Location | `docs/audits/single-session/` | `docs/audits/multi-ai/`      |
| Logged in       | `docs/AUDIT_TRACKER.md`       | `AI_REVIEW_LEARNINGS_LOG.md` |

## When to Use

- **Major releases** requiring comprehensive review
- **Quarterly assessments** for ongoing projects
- **After 3+ single-session audits** in the same category
- **Before production deployments** for security-critical changes
- **When high confidence** is required on findings

## Threshold Integration

Multi-AI audits **reset all category thresholds** in `docs/AUDIT_TRACKER.md`.
This is a complete reset, unlike single-session audits which only reset their
specific category.

**Trigger conditions (check MULTI_AI_REVIEW_COORDINATOR.md):**

- 50+ commits since last multi-AI audit, OR
- 5,000+ lines changed, OR
- 3+ single-session audits completed in same category

---

## Workflow

1. **Prepare**: Copy template to `docs/reviews/[AUDIT]_PLAN_[YYYY]_Q[X].md`
2. **Configure**: Fill in repository context and scope
3. **Execute**: Run audit prompt on 4-6 AI models
4. **Collect**: Save each model's JSONL output
5. **Aggregate**: Run aggregation prompt to deduplicate
6. **Document**: Create canonical findings document
7. **Track**: Update `MULTI_AI_REVIEW_COORDINATOR.md` and `AUDIT_TRACKER.md`

---

## Related Documents

- **[JSONL_SCHEMA_STANDARD.md](../../templates/JSONL_SCHEMA_STANDARD.md)** -
  Canonical JSONL schema
- **[MULTI_AI_REVIEW_COORDINATOR.md](../../templates/MULTI_AI_REVIEW_COORDINATOR.md)** -
  Master index and trigger tracking
- **[AUDIT_TRACKER.md](../../AUDIT_TRACKER.md)** - Threshold and audit history
- **[../single-session/README.md](../single-session/README.md)** - Single-session
  audit documentation
- **[AI_REVIEW_LEARNINGS_LOG.md](../../AI_REVIEW_LEARNINGS_LOG.md)** - Historical
  patterns and learnings
