# Documentation Inventory

**Document Version:** 1.0 **Created:** 2026-01-05 **Last Updated:** 2026-01-27
**Status:** ACTIVE

---

## Status

This documentation inventory is actively maintained and reflects the current
project documentation structure.

---

## Purpose

This document provides a complete inventory of project documentation, organized
by tier and category. Use this index to locate specific documentation and
understand the documentation structure.

## Quick Start

1. Navigate to relevant document category
2. Check tier level for priority
3. Follow document-specific guidelines

## AI Instructions

When working with documentation:

- Check tier level before making changes
- Follow category-specific standards
- Update README when adding new documents

---

## Table of Contents

1. [Documentation Tiers](#documentation-tiers)
2. [Multi-AI Review Framework](#multi-ai-review-framework)
3. [Core Documentation](#core-documentation)
4. [Guides & Processes](#guides--processes)
5. [Templates](#templates)
6. [Archive](#archive)

---

## Documentation Tiers

Our documentation follows a 5-tier hierarchy (see
[DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)):

- **Tier 1**: Root-level essential docs (README.md, ROADMAP.md, etc.)
- **Tier 2**: Core architectural and development guides
- **Tier 3**: Specialized implementation guides
- **Tier 4**: Reference documents and workflows
- **Tier 5**: Archive (completed plans, historical docs)

---

## Multi-AI Review Framework

### Overview

The project uses a **6-category, 2-tier aggregation framework** for multi-AI
code reviews and audits:

**6 Audit Categories:**

1. Code Review (general code quality, duplication, complexity)
2. Security Audit (including dependency security & supply chain)
3. Performance Audit (runtime performance, memory, load times)
4. Refactoring Audit (technical debt, SonarQube issues)
5. Documentation Audit (cross-references, staleness, coverage)
6. Process/Automation Audit (CI/CD, hooks, scripts, triggers)

**2-Tier Aggregation:**

- **Tier-1**: Per-category aggregation (raw AI outputs → CANON-CATEGORY.jsonl)
- **Tier-2**: Cross-category unification (6 CANON files → unified findings + PR
  plan)

### Framework Documents

| Document                            | Purpose                                            | Location                                         |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| **MULTI_AI_REVIEW_COORDINATOR.md**  | Central coordination hub, baselines, audit history | `docs/MULTI_AI_REVIEW_COORDINATOR.md`            |
| **MULTI_AI_AGGREGATOR_TEMPLATE.md** | 2-tier aggregation process, deduplication rules    | `docs/templates/MULTI_AI_AGGREGATOR_TEMPLATE.md` |
| **JSONL_SCHEMA_STANDARD.md**        | Canonical JSONL schema for all findings            | `docs/templates/JSONL_SCHEMA_STANDARD.md`        |

### Audit Templates

| Template                                        | Category           | Description                                             | Location          |
| ----------------------------------------------- | ------------------ | ------------------------------------------------------- | ----------------- |
| **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md**       | Code Review        | General code quality, duplication, complexity           | `docs/templates/` |
| **MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md**    | Security           | Auth, input validation, dependencies, supply chain      | `docs/templates/` |
| **MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md** | Performance        | Runtime perf, memory, bundle size, load times           | `docs/templates/` |
| **MULTI_AI_REFACTOR_PLAN_TEMPLATE.md**          | Refactoring        | Technical debt, SonarQube issues, large-scale refactors | `docs/templates/` |
| **MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md**    | Documentation      | Cross-refs, staleness, coverage, tier compliance        | `docs/templates/` |
| **MULTI_AI_PROCESS_AUDIT_TEMPLATE.md**          | Process/Automation | CI/CD, hooks, scripts, triggers, guardrails             | `docs/templates/` |

---

## Core Documentation

### Tier 1: Essential (Root Level)

| Document           | Purpose                              | Location          |
| ------------------ | ------------------------------------ | ----------------- |
| **README.md**      | Project overview, quick start        | `/README.md`      |
| **ROADMAP.md**     | Product roadmap and timeline         | `/ROADMAP.md`     |
| **ROADMAP_LOG.md** | Historical record of roadmap changes | `/ROADMAP_LOG.md` |
| **CHANGELOG.md**   | Version history and release notes    | `/CHANGELOG.md`   |

### Tier 2: Core Guides

| Document                     | Purpose                                       | Location                        |
| ---------------------------- | --------------------------------------------- | ------------------------------- |
| **ARCHITECTURE.md**          | System architecture and design                | `/ARCHITECTURE.md`              |
| **DEVELOPMENT.md**           | Development setup and procedures              | `/DEVELOPMENT.md`               |
| **CONTRIBUTING.md**          | Contribution guidelines                       | `/CONTRIBUTING.md`              |
| **SECURITY.md**              | Security & privacy guide, key rotation policy | `docs/SECURITY.md`              |
| **FIREBASE_ARCHITECTURE.md** | Firebase data model and structure             | `docs/FIREBASE_ARCHITECTURE.md` |

### Tier 3: Specialized Guides

| Document                           | Purpose                                           | Location                                                      |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| **SERVER_SIDE_SECURITY.md**        | Cloud Functions security patterns                 | `docs/SERVER_SIDE_SECURITY.md`                                |
| **GLOBAL_SECURITY_STANDARDS.md**   | Mandatory security standards for all code         | `docs/GLOBAL_SECURITY_STANDARDS.md`                           |
| **FIREBASE_CHANGE_POLICY.md**      | Firebase security review requirements             | `docs/FIREBASE_CHANGE_POLICY.md`                              |
| **INCIDENT_RESPONSE.md**           | Security incident response procedures             | `docs/INCIDENT_RESPONSE.md`                                   |
| **INTEGRATED_IMPROVEMENT_PLAN.md** | Phased improvement plan (COMPLETE - archived)     | `docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md` |
| **AI_REVIEW_LEARNINGS_LOG.md**     | Historical log of AI review findings and patterns | `docs/AI_REVIEW_LEARNINGS_LOG.md`                             |

---

## Guides & Processes

### Tier 4: Reference Documents & Workflows

| Document                       | Purpose                                     | Location                          |
| ------------------------------ | ------------------------------------------- | --------------------------------- |
| **AI_WORKFLOW.md**             | AI-assisted development workflow            | `/AI_WORKFLOW.md`                 |
| **SESSION_CONTEXT.md**         | Session-to-session AI handoff context       | `docs/SESSION_CONTEXT.md`         |
| **PR_WORKFLOW_CHECKLIST.md**   | Complete PR workflow with checkboxes        | `docs/PR_WORKFLOW_CHECKLIST.md`   |
| **AI_REVIEW_PROCESS.md**       | CodeRabbit review processing workflow       | `docs/AI_REVIEW_PROCESS.md`       |
| **DOCUMENTATION_STANDARDS.md** | Documentation structure and standards       | `docs/DOCUMENTATION_STANDARDS.md` |
| **claude.md**                  | Claude-specific AI rules and stack versions | `/claude.md`                      |

### Code Quality & Analysis

| Document                  | Purpose                            | Location                                |
| ------------------------- | ---------------------------------- | --------------------------------------- |
| **CODE_PATTERNS.md**      | Anti-patterns and best practices   | `docs/agent_docs/CODE_PATTERNS.md`      |
| **SECURITY_CHECKLIST.md** | Pre-write security checklist       | `docs/agent_docs/SECURITY_CHECKLIST.md` |
| **sonarqube-manifest.md** | SonarQube static analysis baseline | `docs/analysis/sonarqube-manifest.md`   |

### Architecture Decision Records

| Document                       | Purpose                          | Location                                    |
| ------------------------------ | -------------------------------- | ------------------------------------------- |
| **0001-monorepo-structure.md** | Monorepo vs. multi-repo decision | `docs/decisions/0001-monorepo-structure.md` |
| **0002-state-management.md**   | State management approach        | `docs/decisions/0002-state-management.md`   |
| **README.md**                  | ADR index and format guide       | `docs/decisions/README.md`                  |

---

## Templates

### Multi-AI Review Templates

All templates located in `docs/templates/`:

| Template                                        | Version | Purpose                                              |
| ----------------------------------------------- | ------- | ---------------------------------------------------- |
| **MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md**       | v1.1    | Code review audit execution plan                     |
| **MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md**    | v1.1    | Security audit (7 categories including dependencies) |
| **MULTI_AI_PERFORMANCE_AUDIT_PLAN_TEMPLATE.md** | v1.1    | Performance audit execution plan                     |
| **MULTI_AI_REFACTOR_PLAN_TEMPLATE.md**          | v1.1    | Large-scale refactoring execution plan               |
| **MULTI_AI_DOCUMENTATION_AUDIT_TEMPLATE.md**    | v1.0    | Documentation quality audit (5 categories)           |
| **MULTI_AI_PROCESS_AUDIT_TEMPLATE.md**          | v1.0    | Process/automation audit (6 categories)              |
| **MULTI_AI_AGGREGATOR_TEMPLATE.md**             | v2.0    | 2-tier aggregation process                           |
| **JSONL_SCHEMA_STANDARD.md**                    | v1.0    | Canonical JSONL schema for findings                  |

### Other Templates

| Template                             | Purpose              | Location                           |
| ------------------------------------ | -------------------- | ---------------------------------- |
| **.github/pull_request_template.md** | Standard PR template | `.github/pull_request_template.md` |

---

## Archive

### Tier 5: Archived Documents

**Location:** `docs/archive/`

#### Completed Plans

| Document                                  | Completion Date | Location                                                             |
| ----------------------------------------- | --------------- | -------------------------------------------------------------------- |
| **EIGHT_PHASE_REFACTOR_PLAN.md**          | 2025-12-30      | `docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md`          |
| **DOCUMENTATION_STANDARDIZATION_PLAN.md** | 2026-01-02      | `docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md` |
| **IMPLEMENTATION_PROMPTS.md**             | 2026-01-05      | `docs/archive/IMPLEMENTATION_PROMPTS.md`                             |

#### Historical Reports

| Document                    | Date Range    | Location                                                |
| --------------------------- | ------------- | ------------------------------------------------------- |
| **2025-dec-reports/**       | December 2025 | `docs/archive/2025-dec-reports/`                        |
| **BILLING_ALERTS_SETUP.md** | 2025-12       | `docs/archive/2025-dec-reports/BILLING_ALERTS_SETUP.md` |
| **POST_PHASE_8_BACKLOG.md** | 2025-12       | `docs/POST_PHASE_8_BACKLOG.md`                          |

---

## Documentation Statistics

**Last Updated:** 2026-01-05

| Category                 | Count | Notes                                 |
| ------------------------ | ----- | ------------------------------------- |
| **Tier 1 (Essential)**   | 4     | Root-level docs                       |
| **Tier 2 (Core Guides)** | 5     | Architecture & development            |
| **Tier 3 (Specialized)** | 7     | Firebase, security, improvement plans |
| **Tier 4 (Reference)**   | 8     | Workflows, standards, patterns        |
| **Multi-AI Templates**   | 8     | 6 audit types + aggregator + schema   |
| **Archived Plans**       | 3     | Completed implementation plans        |
| **Total Active Docs**    | ~40+  | Includes subdirectories               |

---

## Quick Reference

### Finding Documentation

**I need to...**

- **Set up development environment** → [DEVELOPMENT.md](../DEVELOPMENT.md)
- **Understand system architecture** → [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Review security requirements** →
  [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md)
- **Make Firebase changes** →
  [FIREBASE_CHANGE_POLICY.md](./FIREBASE_CHANGE_POLICY.md)
- **Submit a PR** → [PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md)
- **Run a multi-AI audit** →
  [MULTI_AI_REVIEW_COORDINATOR.md](./MULTI_AI_REVIEW_COORDINATOR.md)
- **Fix anti-patterns** → [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)
- **Understand current session** → [SESSION_CONTEXT.md](../SESSION_CONTEXT.md)
- **See project roadmap** → [ROADMAP.md](../ROADMAP.md)

### Contributing to Documentation

See [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md) for:

- Required frontmatter format
- Structural guidelines
- Update triggers
- Version history format

---

## Maintenance

### Update Triggers

Update this inventory when:

- [ ] New documentation added
- [ ] Documentation archived
- [ ] Documentation reorganized (tier changes)
- [ ] New template created
- [ ] Major documentation milestone (quarterly)

### Ownership

**Maintained by:** AI assistants via SESSION_CONTEXT.md continuity **Review
frequency:** Quarterly or when >5 documents added/archived **Last inventory
review:** 2026-01-05 (Session #25)

---

## Related Documents

- [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md) - Documentation
  formatting and structure standards
- [AI_WORKFLOW.md](../AI_WORKFLOW.md) - How to use documentation in AI workflow
- [SESSION_CONTEXT.md](../SESSION_CONTEXT.md) - Current session state

---

## Version History

| Version | Date       | Changes                                                                                                             | Author               |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1.0     | 2026-01-05 | Initial documentation inventory creation - 6-category Multi-AI framework, 8 templates, tier structure (Task 4.1.12) | Claude (Session #25) |

---

**END OF DOCUMENTATION INVENTORY**
