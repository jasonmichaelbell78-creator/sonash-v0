# Multi-AI Audit System

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Created:** 2026-02-04
**Last Updated:** 2026-02-04
**Document Tier:** 2 (Foundation)
<!-- prettier-ignore-end -->

---

## Purpose

Templates and processes for running audits across multiple AI systems. This
directory consolidates all multi-AI audit resources for easy navigation and
maintenance.

---

## Two Audit Approaches

| Approach               | Tool                   | AI Systems                         | Speed          | Consensus             |
| ---------------------- | ---------------------- | ---------------------------------- | -------------- | --------------------- |
| **Single-AI Parallel** | `/audit-comprehensive` | Claude Code only (parallel agents) | Fast (~50 min) | Same model family     |
| **Multi-AI Consensus** | These templates        | Claude, GPT, Gemini, etc.          | Slow (manual)  | Diverse architectures |

### When to Use Multi-AI Consensus

- Critical decisions needing diverse perspectives
- Security audits benefiting from different model viewpoints
- When one AI might have blind spots
- Major architecture reviews

### When Single-AI is Fine

- Regular code reviews
- Quick checks before merging
- Internal refactoring audits

---

## Multi-AI Workflow (Step by Step)

### Step 1: CHOOSE

Use the [COORDINATOR.md](./COORDINATOR.md) to:

- Review decision tree to pick audit type
- Check baseline metrics for context
- See audit history for past results

### Step 2: EXECUTE

1. Copy the prompt section from selected template
2. Paste into 4-6 different AI systems (Claude, GPT, Gemini, etc.)
3. Have each AI output JSONL format per template spec

### Step 3: AGGREGATE

1. Place outputs in `docs/audits/single-session/<category>/`
2. Run: `npm run aggregate:audit-findings`
3. Or invoke: `/audit-aggregator` skill

See [AGGREGATOR.md](./templates/AGGREGATOR.md) for the 2-tier consensus process.

### Step 4: INTEGRATE

1. Run: `node scripts/debt/intake-audit.js <deduped-file>.jsonl`
2. Verify: `npm run tdms:views`
3. Update coordinator with audit results

---

## Templates

| Audit Type               | Template                                                                           | Focus Areas                                    |
| ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| Code Review              | [CODE_REVIEW_PLAN.md](./templates/CODE_REVIEW_PLAN.md)                             | Hygiene, types, patterns, testing, AI failures |
| Security                 | [SECURITY_AUDIT_PLAN.md](./templates/SECURITY_AUDIT_PLAN.md)                       | Auth, validation, OWASP, secrets, AI security  |
| Performance              | [PERFORMANCE_AUDIT_PLAN.md](./templates/PERFORMANCE_AUDIT_PLAN.md)                 | Bundle, rendering, caching, vitals, offline    |
| Refactoring              | [REFACTORING_AUDIT.md](./templates/REFACTORING_AUDIT.md)                           | Tech debt, architecture, DRY, god objects      |
| Documentation            | [DOCUMENTATION_AUDIT.md](./templates/DOCUMENTATION_AUDIT.md)                       | Links, coverage, staleness, tier compliance    |
| Process/Automation       | [PROCESS_AUDIT.md](./templates/PROCESS_AUDIT.md)                                   | CI/CD, hooks, automation, golden path          |
| Engineering Productivity | [ENGINEERING_PRODUCTIVITY_AUDIT.md](./templates/ENGINEERING_PRODUCTIVITY_AUDIT.md) | DX friction, debugging, offline gaps           |

---

## Supporting Files

| File                                                                     | Purpose                                  |
| ------------------------------------------------------------------------ | ---------------------------------------- |
| [COORDINATOR.md](./COORDINATOR.md)                                       | Decision trees, baselines, audit history |
| [templates/AGGREGATOR.md](./templates/AGGREGATOR.md)                     | 2-tier aggregation process               |
| [templates/SHARED_TEMPLATE_BASE.md](./templates/SHARED_TEMPLATE_BASE.md) | Shared boilerplate for all templates     |

---

## Automation & Scripts

| Command                                | Purpose                                |
| -------------------------------------- | -------------------------------------- |
| `npm run aggregate:audit-findings`     | Run 2-tier aggregation on raw findings |
| `npm run tdms:views`                   | Regenerate TDMS dashboard views        |
| `node scripts/debt/intake-audit.js`    | Ingest audit findings into TDMS        |
| `node scripts/debt/validate-schema.js` | Validate JSONL files against schema    |

---

## Quick Start

**For a quick internal audit (Claude only):**

```bash
# Use the comprehensive audit skill
/audit-comprehensive
```

**For multi-AI consensus audit:**

1. Read [COORDINATOR.md](./COORDINATOR.md) decision tree
2. Select template from table above
3. Copy prompt to 4-6 AI systems
4. Collect JSONL outputs
5. Run `npm run aggregate:audit-findings`
6. Ingest to TDMS

---

## Related Documents

- [AI_WORKFLOW.md](../../AI_WORKFLOW.md) - Session workflow (references
  coordinator)
- [docs/technical-debt/PROCEDURE.md](../technical-debt/PROCEDURE.md) - TDMS
  procedures
- [docs/templates/JSONL_SCHEMA_STANDARD.md](../templates/JSONL_SCHEMA_STANDARD.md) -
  Canonical schema

---

## Version History

| Version | Date       | Changes                                              | Author |
| ------- | ---------- | ---------------------------------------------------- | ------ |
| 1.0     | 2026-02-04 | Initial creation during multi-ai-audit consolidation | Claude |

---

**END OF README.md**
