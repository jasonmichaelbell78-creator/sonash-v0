# Documentation Inventory

**Document Version:** 1.8 **Created:** 2026-01-05 **Last Updated:** 2026-02-01
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

The project uses a **7-category, 2-tier aggregation framework** for multi-AI
code reviews and audits:

**7 Audit Categories:**

1. Code Review (general code quality, duplication, complexity)
2. Security Audit (including dependency security & supply chain)
3. Performance Audit (runtime performance, memory, load times)
4. Refactoring Audit (technical debt, SonarQube issues)
5. Documentation Audit (cross-references, staleness, coverage)
6. Process/Automation Audit (CI/CD, hooks, scripts, triggers)
7. Engineering-Productivity Audit (developer experience, tooling, offline
   support)

**2-Tier Aggregation:**

- **Tier-1**: Per-category aggregation (raw AI outputs → CANON-CATEGORY.jsonl)
- **Tier-2**: Cross-category unification (6 CANON files → unified findings + PR
  plan)

### Framework Documents

| Document                     | Purpose                                            | Location                                      |
| ---------------------------- | -------------------------------------------------- | --------------------------------------------- |
| **COORDINATOR.md**           | Central coordination hub, baselines, audit history | `docs/multi-ai-audit/COORDINATOR.md`          |
| **AGGREGATOR.md**            | 2-tier aggregation process, deduplication rules    | `docs/multi-ai-audit/templates/AGGREGATOR.md` |
| **JSONL_SCHEMA_STANDARD.md** | Canonical JSONL schema for all findings            | `docs/templates/JSONL_SCHEMA_STANDARD.md`     |

### Audit Templates

All templates now in `docs/multi-ai-audit/templates/`:

| Template                              | Category                 | Description                                              |
| ------------------------------------- | ------------------------ | -------------------------------------------------------- |
| **CODE_REVIEW_PLAN.md**               | Code Review              | General code quality, duplication, complexity            |
| **SECURITY_AUDIT_PLAN.md**            | Security                 | Auth, input validation, dependencies, supply chain       |
| **PERFORMANCE_AUDIT_PLAN.md**         | Performance              | Runtime perf, memory, bundle size, load times            |
| **REFACTORING_AUDIT.md**              | Refactoring              | Technical debt, SonarCloud issues, large-scale refactors |
| **DOCUMENTATION_AUDIT.md**            | Documentation            | Cross-refs, staleness, coverage, tier compliance         |
| **PROCESS_AUDIT.md**                  | Process/Automation       | CI/CD, hooks, scripts, triggers, guardrails              |
| **ENGINEERING_PRODUCTIVITY_AUDIT.md** | Engineering Productivity | DX friction, debugging, offline gaps                     |

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

| Document                                     | Purpose                                           | Location                                                      |
| -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| **SERVER_SIDE_SECURITY.md**                  | Cloud Functions security patterns                 | `docs/SERVER_SIDE_SECURITY.md`                                |
| **GLOBAL_SECURITY_STANDARDS.md**             | Mandatory security standards for all code         | `docs/GLOBAL_SECURITY_STANDARDS.md`                           |
| **FIREBASE_CHANGE_POLICY.md**                | Firebase security review requirements             | `docs/FIREBASE_CHANGE_POLICY.md`                              |
| **INCIDENT_RESPONSE.md**                     | Security incident response procedures             | `docs/INCIDENT_RESPONSE.md`                                   |
| **TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md** | Unified technical debt consolidation & management | `docs/plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md`         |
| **CI_GATES_BLOCKING_PLAN.md**                | Plan to convert CI gates to blocking              | `docs/plans/CI_GATES_BLOCKING_PLAN.md`                        |
| **TESTING_USER_MANUAL.md**                   | Complete UI testing reference with /test-suite    | `docs/plans/TESTING_USER_MANUAL.md`                           |
| **INTEGRATED_IMPROVEMENT_PLAN.md**           | Phased improvement plan (COMPLETE - archived)     | `docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md` |
| **AI_REVIEW_LEARNINGS_LOG.md**               | Historical log of AI review findings and patterns | `docs/AI_REVIEW_LEARNINGS_LOG.md`                             |

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

All templates now located in `docs/multi-ai-audit/templates/`:

| Template                              | Purpose                                               |
| ------------------------------------- | ----------------------------------------------------- |
| **CODE_REVIEW_PLAN.md**               | Code review audit execution plan                      |
| **SECURITY_AUDIT_PLAN.md**            | Security audit (13 categories including dependencies) |
| **PERFORMANCE_AUDIT_PLAN.md**         | Performance audit execution plan                      |
| **REFACTORING_AUDIT.md**              | Large-scale refactoring execution plan                |
| **DOCUMENTATION_AUDIT.md**            | Documentation quality audit (6 categories)            |
| **PROCESS_AUDIT.md**                  | Process/automation audit (12 categories)              |
| **ENGINEERING_PRODUCTIVITY_AUDIT.md** | DX, debugging, offline gaps audit                     |
| **AGGREGATOR.md**                     | 2-tier aggregation process                            |
| **SHARED_TEMPLATE_BASE.md**           | Shared boilerplate for all audit templates            |

See [docs/multi-ai-audit/README.md](./multi-ai-audit/README.md) for full
navigation.

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

**Last Updated:** 2026-01-30

| Category                 | Count | Notes                                   |
| ------------------------ | ----- | --------------------------------------- |
| **Tier 1 (Essential)**   | 4     | Root-level docs                         |
| **Tier 2 (Core Guides)** | 5     | Architecture & development              |
| **Tier 3 (Specialized)** | 8     | Firebase, security, TDMS, plans         |
| **Tier 4 (Reference)**   | 8     | Workflows, standards, patterns          |
| **Multi-AI Templates**   | 10    | 6 audit types + aggregator + schema + 2 |
| **Archived Plans**       | 3     | Completed implementation plans          |
| **Analysis Docs**        | 16    | Multi-AI audit analysis outputs         |
| **Technical Debt**       | 25+   | TDMS ALL 17 PHASES COMPLETE (868 items) |
| **Audit Reports**        | 25+   | Single-session and comprehensive audits |
| **Total Active Docs**    | ~160+ | Includes subdirectories                 |

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
  [docs/multi-ai-audit/README.md](./multi-ai-audit/README.md)
- **Fix anti-patterns** → [CODE_PATTERNS.md](./agent_docs/CODE_PATTERNS.md)
- **Understand current session** → [SESSION_CONTEXT.md](../SESSION_CONTEXT.md)
- **See project roadmap** → [ROADMAP.md](../ROADMAP.md)
- **Manage technical debt** →
  [TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md](./plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md)

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
review:** 2026-01-27 (comprehensive compliance audit - 100 errors → 0 errors)

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
| 1.8     | 2026-02-01 | TDMS ALL 17 PHASES COMPLETE - System fully operational (868 items, metrics, verification)                           | Claude Code          |
| 1.7     | 2026-01-31 | TDMS Phases 6-8 complete, Phase 9b added (audit integration), deprecated commands deleted                           | Claude Code          |
| 1.6     | 2026-01-30 | TDMS Phase 4 complete, validation scripts built                                                                     | Claude Code          |
| 1.5     | 2026-01-30 | TDMS Phase 3 complete, intake scripts built                                                                         | Claude Code          |
| 1.4     | 2026-01-30 | TDMS Phase 2 complete, PROCEDURE.md created                                                                         | Claude Code          |
| 1.3     | 2026-01-30 | TDMS Phase 1 complete, added Technical Debt category (867 items consolidated)                                       | Claude Code          |
| 1.2     | 2026-01-30 | Added TDMS plan reference to Tier 3 and Quick Reference                                                             | Claude Code          |
| 1.1     | 2026-01-27 | Updated statistics after comprehensive compliance audit (153 files checked, 100 errors fixed)                       | Claude Code          |
| 1.0     | 2026-01-05 | Initial documentation inventory creation - 6-category Multi-AI framework, 8 templates, tier structure (Task 4.1.12) | Claude (Session #25) |

---

**END OF DOCUMENTATION INVENTORY**
