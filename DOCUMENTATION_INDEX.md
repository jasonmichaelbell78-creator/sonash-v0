# Documentation Index

> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to
> regenerate.

**Generated:** 2026-02-28 **Active Documents:** 315 **Archived Documents:** 105

---

## Purpose

This auto-generated index provides a comprehensive catalog of all documentation
in the SoNash project. It includes summary statistics, categorization by tier
and type, reference graphs showing document relationships, and identification of
orphaned documents.

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [Documents by Category](#documents-by-category)
3. [Reference Graph](#reference-graph)
4. [Orphaned Documents](#orphaned-documents)
5. [Full Document List](#full-document-list)
6. [Archived Documents](#archived-documents)

---

## Summary Statistics

### By Tier

| Tier   | Count | Description       |
| ------ | ----- | ----------------- |
| Tier 1 | 4     | Canonical Living  |
| Tier 2 | 19    | Foundation        |
| Tier 3 | 170   | Planning & Active |
| Tier 4 | 122   | Reference         |
| Tier 5 | 0     | Guides            |

### By Category

| Category                                   | Count |
| ------------------------------------------ | ----- |
| Skills                                     | 101   |
| Core Documentation                         | 37    |
| .claude > agents                           | 24    |
| Audit Reports                              | 21    |
| analysis                                   | 15    |
| .claude > plans                            | 12    |
| .claude > agents > global                  | 11    |
| Audit Templates                            | 11    |
| Root Documents                             | 9     |
| .planning > phases > 01-storage-foundation | 8     |
| Agent Documentation                        | 7     |
| Templates                                  | 7     |
| .claude                                    | 5     |
| Technical Debt System                      | 5     |
| Technical Debt Views                       | 5     |
| .planning                                  | 4     |
| AI Optimization Audit                      | 4     |
| Plans                                      | 4     |
| .claude > state                            | 3     |
| .github                                    | 3     |
| Multi-AI Audit System                      | 3     |
| .planning > ecosystem-v2                   | 2     |
| Decisions                                  | 2     |
| src > dataconnect-generated > .guides      | 2     |
| .agent > workflows                         | 1     |
| .agents > skills > find-skills             | 1     |
| Slash Commands                             | 1     |
| .claude > test-results                     | 1     |
| .gemini                                    | 1     |
| consolidation-output                       | 1     |
| Patterns                                   | 1     |
| scripts                                    | 1     |
| src > dataconnect-generated                | 1     |
| src > dataconnect-generated > react        | 1     |

---

## Documents by Category

### Root Documents (Tier 1)

_Essential project-level documentation_

| Document                                                | Description                                                      | References | Last Modified |
| ------------------------------------------------------- | ---------------------------------------------------------------- | ---------- | ------------- |
| [SoNash - Sober Nashville Recovery Notebook](README.md) | \_A privacy-first digital recovery journal for the recovery c... | ↓0 ↑15     | 2026-02-27    |
| [SoNash Future Roadmap](ROADMAP_FUTURE.md)              | Detailed specifications for future milestones (M2-M10). For      | ↓1 ↑4      | 2026-02-05    |
| [SoNash Product Roadmap](ROADMAP.md)                    | <!-- prettier-ignore-start -->                                   | ↓18 ↑19    | 2026-02-26    |
| [SoNash Roadmap Log](ROADMAP_LOG.md)                    | -                                                                | ↓4 ↑6      | 2026-02-20    |

### Core Documentation (Tier 2)

_Foundation technical reference_

| Document                                                                                              | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [App Check Setup Guide](docs/APPCHECK_SETUP.md)                                                       | This guide covers Firebase App Check configuration for the S... | ↓2 ↑1      | 2026-02-13    |
| [Firebase Change Policy](docs/FIREBASE_CHANGE_POLICY.md)                                              | This document defines the mandatory security review process ... | ↓2 ↑6      | 2026-02-23    |
| [Global Security Standards](docs/GLOBAL_SECURITY_STANDARDS.md)                                        | This document defines **mandatory security standards** that ... | ↓10 ↑0     | 2026-02-23    |
| [Implementation Plan](docs/aggregation/IMPLEMENTATION_PLAN.md)                                        | -                                                               | ↓0 ↑0      | 2026-02-27    |
| [Master Issue List](docs/aggregation/MASTER_ISSUE_LIST.md)                                            | -                                                               | ↓0 ↑0      | 2026-02-27    |
| [MCP Server Setup Guide](docs/MCP_SETUP.md)                                                           | This guide explains how to configure MCP (Model Context Prot... | ↓0 ↑0      | 2026-02-23    |
| [Mining Agent 2: Pipeline Flow & Promotion Analysis](docs/aggregation/mining-agent2-pipeline-flow.md) | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-27    |
| [Mining Agent 3: Retro & Action Item Analysis](docs/aggregation/mining-agent3-retro-actions.md)       | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-27    |
| [Mining Agent 4: Integration & Automation](docs/aggregation/mining-agent4-integration.md)             | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-27    |
| [Mining Report: Review Data Quality](docs/aggregation/mining-agent1-data-quality.md)                  | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-27    |
| [PR Review Ecosystem Diagnosis](docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md)                           | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-27    |
| [reCAPTCHA & App Check - Complete Removal and Fresh Setup Guide](docs/RECAPTCHA_REMOVAL_GUIDE.md)     | Complete removal and fresh implementation guide for Firebase... | ↓1 ↑2      | 2026-02-14    |
| [Security & Privacy Guide](docs/SECURITY.md)                                                          | -                                                               | ↓12 ↑4     | 2026-01-15    |
| [Sentry Integration Guide for SoNash Admin Panel](docs/SENTRY_INTEGRATION_GUIDE.md)                   | Step-by-step guide to integrate Sentry error tracking into t... | ↓1 ↑0      | 2026-02-23    |
| [Server-Side Security Implementation Guide](docs/SERVER_SIDE_SECURITY.md)                             | Verify requests come from your legitimate app, not bots or s... | ↓5 ↑2      | 2026-01-15    |
| [SonarCloud Cleanup Sprint Runbook](docs/SONARCLOUD_CLEANUP_RUNBOOK.md)                               | This runbook provides a repeatable process for SonarCloud an... | ↓1 ↑0      | 2026-02-23    |
| [SoNash Documentation Standards](docs/DOCUMENTATION_STANDARDS.md)                                     | -                                                               | ↓7 ↑4      | 2026-02-11    |

### Root Documents (Tier 2)

_Foundation_

| Document                                      | Description                                                  | References | Last Modified |
| --------------------------------------------- | ------------------------------------------------------------ | ---------- | ------------- |
| [Architecture Documentation](ARCHITECTURE.md) | -                                                            | ↓10 ↑6     | 2026-02-11    |
| [Development Guide](DEVELOPMENT.md)           | Unified dev dashboard for monitoring session activity, error | ↓10 ↑11    | 2026-02-17    |

### Agent Documentation (Tier 3)

_AI agent reference docs_

| Document                                                                                     | Description                                                     | References | Last Modified |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Agent Orchestration Reference](docs/agent_docs/AGENT_ORCHESTRATION.md)                      | Detailed guidance for parallelizing agents, forming teams, a... | ↓1 ↑0      | 2026-02-23    |
| [Code Review Patterns Reference](docs/agent_docs/CODE_PATTERNS.md)                           | This document contains detailed code patterns and anti-patte... | ↓6 ↑2      | 2026-02-27    |
| [Context Preservation & Compaction Safety](docs/agent_docs/CONTEXT_PRESERVATION.md)          | Detailed guidance for preventing loss of important decisions... | ↓2 ↑0      | 2026-02-23    |
| [Fix Templates for Qodo PR Review Findings](docs/agent_docs/FIX_TEMPLATES.md)                | Copy-paste fix templates for the top 30 most common Qodo PR ... | ↓1 ↑0      | 2026-02-26    |
| [Security Checklist for Scripts](docs/agent_docs/SECURITY_CHECKLIST.md)                      | Use this checklist **BEFORE writing or reviewing** any scrip... | ↓1 ↑0      | 2026-02-23    |
| [Skill and Agent Usage Policy](docs/agent_docs/SKILL_AGENT_POLICY.md)                        | This document defines the policy for creating, using, and ov... | ↓2 ↑4      | 2026-02-24    |
| [Skill Ecosystem Audit — Conversation Notes](docs/agent_docs/SKILL_ECOSYSTEM_AUDIT_IDEAS.md) | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-25    |

### AI Optimization Audit (Tier 3)

_AI token and workflow optimization_

| Document                                                                                                                                 | Description                                                     | References | Last Modified |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [AI Optimization Audit — Review Decisions](docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md)              | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-14    |
| [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md)                  | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-16    |
| [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md)                         | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-16    |
| [AI Optimization Audit Report (2026-02-14)](docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md) | Executive summary of the AI Optimization audit covering hook... | ↓0 ↑0      | 2026-02-14    |

### Audit Reports (Tier 3)

_Single-session and multi-AI audit outputs_

| Document                                                                                                               | Description                                                     | References | Last Modified |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [AI Optimization Audit — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/ai-optimization-audit.md)               | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-22    |
| [Audit Ecosystem](docs/audits/README.md)                                                                               | <!-- prettier-ignore-start -->                                  | ↓1 ↑18     | 2026-02-16    |
| [Audit Results Index](docs/audits/RESULTS_INDEX.md)                                                                    | Provides a comprehensive index of all audit results in this ... | ↓1 ↑0      | 2026-02-23    |
| [Audit Review Decisions — 2026-02-22](docs/audits/comprehensive/audit-2026-02-22/REVIEW_DECISIONS.md)                  | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-22    |
| [Audit Standards](docs/audits/AUDIT_STANDARDS.md)                                                                      | <When to use this template>                                     | ↓2 ↑4      | 2026-02-24    |
| [Audit Tracker](docs/audits/AUDIT_TRACKER.md)                                                                          | Track single-session and multi-AI audit completions for thre... | ↓3 ↑3      | 2026-02-23    |
| [Audit vs MASTER_DEBT Deduplication Report](docs/audits/comprehensive/audit-2026-02-22/DEDUP_VS_MASTER_DEBT.md)        | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-22    |
| [Automation Audit Report — 2026-02-09](docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md) | - **Total findings:** 258                                       | ↓1 ↑0      | 2026-02-09    |
| [Code Quality Audit Report — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/code-audit.md)                      | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [Comprehensive Audit Report — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/COMPREHENSIVE_AUDIT_REPORT.md)     | <!-- prettier-ignore-start -->                                  | ↓1 ↑0      | 2026-02-22    |
| [Documentation Audit Report — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/documentation-audit.md)            | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [Engineering Productivity Audit](docs/audits/comprehensive/audit-2026-02-22/engineering-productivity-audit.md)         | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-22    |
| [Implementation Plan: Audit Ecosystem Codification](docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md)                       | Captures the original design decisions and implementation pl... | ↓1 ↑3      | 2026-02-23    |
| [MASTER_DEBT Internal Deduplication Report](docs/audits/comprehensive/audit-2026-02-22/MASTER_DEBT_DEDUP_REPORT.md)    | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [Performance Audit — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/performance-audit.md)                       | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-22    |
| [Process & Automation Audit — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/process-audit.md)                  | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [Refactoring Audit — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/refactoring-audit.md)                       | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [Review Decisions — System Test 2026-02-19](docs/audits/system-test/audit-2026-02-19/REVIEW_DECISIONS.md)              | Decision log for each finding from the 2026-02-19 system tes... | ↓0 ↑0      | 2026-02-21    |
| [Security Audit Report — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/security-audit.md)                      | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [SoNash Enhancements Audit](docs/audits/comprehensive/audit-2026-02-22/enhancements-audit.md)                          | -                                                               | ↓0 ↑0      | 2026-02-22    |
| [System Test Plan Index — audit-2026-02-19](docs/audits/system-test/audit-2026-02-19/PLAN_INDEX.md)                    | Index of all domains, sessions, and findings for the 2026-02... | ↓0 ↑0      | 2026-02-21    |

### Audit Templates (Tier 3)

_Multi-AI audit execution templates_

| Document                                                                                                                        | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [[Project Name] Multi-AI AI Optimization Audit Plan](docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md)                   | This document serves as the **execution plan** for running a... | ↓3 ↑1      | 2026-02-16    |
| [[Project Name] Multi-AI Code Review Plan](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)                                 | -                                                               | ↓7 ↑5      | 2026-02-16    |
| [[Project Name] Multi-AI Documentation Audit Plan](docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md)                       | This document serves as the **execution plan** for running a... | ↓4 ↑2      | 2026-02-16    |
| [[Project Name] Multi-AI Engineering Productivity Audit Plan](docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md) | This document serves as the **execution plan** for running a... | ↓4 ↑3      | 2026-02-16    |
| [[Project Name] Multi-AI Performance Audit Plan](docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md)                           | This document serves as the **execution plan** for running a... | ↓7 ↑4      | 2026-02-16    |
| [[Project Name] Multi-AI Process & Automation Audit Plan](docs/audits/multi-ai/templates/PROCESS_AUDIT.md)                      | -                                                               | ↓5 ↑2      | 2026-02-16    |
| [[Project Name] Multi-AI Refactoring Audit](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)                                | This document serves as the **execution plan** for running a... | ↓7 ↑5      | 2026-02-16    |
| [[Project Name] Multi-AI Security Audit Plan](docs/audits/multi-ai/templates/SECURITY_AUDIT.md)                                 | -                                                               | ↓7 ↑3      | 2026-02-16    |
| [Enhancement Audit Template (Multi-AI Injectable)](docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md)                         | -                                                               | ↓3 ↑8      | 2026-02-16    |
| [Multi-AI Audit Aggregator Template](docs/audits/multi-ai/templates/AGGREGATOR.md)                                              | Deduplicate and verify findings within ONE audit category be... | ↓5 ↑0      | 2026-02-16    |
| [Multi-AI Audit Shared Template Base](docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md)                                   | Shared boilerplate for                                          | ↓13 ↑2     | 2026-02-16    |

### Core Documentation (Tier 3)

_Planning & Active_

| Document                                                                                               | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------- | ------------- |
| [Admin Panel Security & Monitoring Requirements](docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md) | -                                                               | ↓3 ↑4      | 2026-02-08    |
| [Learning Effectiveness Metrics](docs/LEARNING_METRICS.md)                                             | This document tracks Claude's learning effectiveness - wheth... | ↓0 ↑0      | 2026-02-28    |
| [Lighthouse Integration Plan](docs/LIGHTHOUSE_INTEGRATION_PLAN.md)                                     | -                                                               | ↓2 ↑2      | 2026-02-23    |
| [Monetization Strategy Research Initiative](docs/MONETIZATION_RESEARCH.md)                             | -                                                               | ↓2 ↑1      | 2026-02-23    |
| [Operational Visibility Sprint](docs/OPERATIONAL_VISIBILITY_SPRINT.md)                                 | -                                                               | ↓2 ↑3      | 2026-02-23    |
| [Testing Plan](docs/TESTING_PLAN.md)                                                                   | Comprehensive testing guidance for the SoNash application, i... | ↓5 ↑1      | 2026-02-14    |

### Multi-AI Audit System (Tier 3)

_Multi-AI audit orchestration and coordination_

| Document                                                                              | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Multi-AI Audit Summary](docs/audits/multi-ai/maa-2026-02-17-182d43/final/SUMMARY.md) | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [Multi-AI Audit System](docs/audits/multi-ai/README.md)                               | Templates and processes for running audits across multiple A... | ↓3 ↑15     | 2026-02-23    |
| [Multi-AI Review Coordinator](docs/audits/multi-ai/COORDINATOR.md)                    | Master index and                                                | ↓13 ↑18    | 2026-02-23    |

### Plans (Tier 3)

_Active implementation plans_

| Document                                                                              | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [SoNash Testing User Manual](docs/plans/TESTING_USER_MANUAL.md)                       | <!-- prettier-ignore-start -->                                  | ↓5 ↑0      | 2026-02-07    |
| [Sprint Workflow Skill Design](docs/plans/2026-02-21-sprint-workflow-skill-design.md) | Build a `/sprint` skill that automates the GRAND PLAN techni... | ↓0 ↑0      | 2026-02-23    |
| [Testing Infrastructure Plan](docs/plans/TESTING_INFRASTRUCTURE_PLAN.md)              | This document outlines a comprehensive testing infrastructur... | ↓1 ↑2      | 2026-02-23    |
| [Track A Admin Panel Testing Plan](docs/plans/TRACK_A_TESTING_PLAN.md)                | Comprehensive testing plan for Track A Admin Panel features ... | ↓1 ↑0      | 2026-02-04    |

### Skills (Tier 3)

_Claude Code skills_

| Document                                                                                                                            | Description                                                       | References | Last Modified |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------- |
| [Academic Test: Systematic Debugging Skill](.claude/skills/systematic-debugging/test-academic.md)                                   | You have access to the systematic debugging skill at              | ↓0 ↑0      | 2026-01-12    |
| [add-debt](.claude/skills/add-debt/SKILL.md)                                                                                        | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [alerts](.claude/skills/alerts/SKILL.md)                                                                                            | - User explicitly invokes `/alerts`                               | ↓0 ↑0      | 2026-02-28    |
| [artifacts-builder](.claude/skills/artifacts-builder/SKILL.md)                                                                      | To build powerful frontend claude.ai artifacts, follow these...   | ↓0 ↑0      | 2026-02-24    |
| [Audit Aggregator — Extended Examples](.claude/skills/audit-aggregator/examples.md)                                                 | <!-- prettier-ignore-start -->                                    | ↓1 ↑0      | 2026-02-24    |
| [audit-aggregator](.claude/skills/audit-aggregator/SKILL.md)                                                                        | -                                                                 | ↓0 ↑1      | 2026-02-24    |
| [audit-ai-optimization](.claude/skills/audit-ai-optimization/SKILL.md)                                                              | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [audit-code](.claude/skills/audit-code/SKILL.md)                                                                                    | - Tasks related to audit-code                                     | ↓0 ↑0      | 2026-02-24    |
| [audit-comprehensive](.claude/skills/audit-comprehensive/SKILL.md)                                                                  | -                                                                 | ↓0 ↑6      | 2026-02-24    |
| [audit-documentation](.claude/skills/audit-documentation/SKILL.md)                                                                  | - User explicitly invokes `/audit-documentation`                  | ↓0 ↑1      | 2026-02-24    |
| [audit-engineering-productivity](.claude/skills/audit-engineering-productivity/SKILL.md)                                            | Evaluates developer experience (DX), debugging capabilities,...   | ↓0 ↑0      | 2026-02-24    |
| [audit-enhancements](.claude/skills/audit-enhancements/SKILL.md)                                                                    | - Tasks related to audit-enhancements                             | ↓0 ↑0      | 2026-02-24    |
| [audit-health](.claude/skills/audit-health/SKILL.md)                                                                                | Quick meta-check that verifies the audit ecosystem is health...   | ↓0 ↑0      | 2026-02-24    |
| [audit-performance](.claude/skills/audit-performance/SKILL.md)                                                                      | - Tasks related to audit-performance                              | ↓0 ↑0      | 2026-02-24    |
| [audit-process](.claude/skills/audit-process/SKILL.md)                                                                              | -                                                                 | ↓0 ↑0      | 2026-02-24    |
| [Audit-Process Agent Prompts](.claude/skills/audit-process/prompts.md)                                                              | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [audit-refactoring](.claude/skills/audit-refactoring/SKILL.md)                                                                      | This audit identifies technical debt related to code structu...   | ↓0 ↑0      | 2026-02-24    |
| [audit-security](.claude/skills/audit-security/SKILL.md)                                                                            | - Tasks related to audit-security                                 | ↓0 ↑0      | 2026-02-24    |
| [checkpoint](.claude/skills/checkpoint/SKILL.md)                                                                                    | Save current state so you can recover after compaction or se...   | ↓0 ↑0      | 2026-02-24    |
| [Code Review Checklist](.claude/skills/code-reviewer/references/code_review_checklist.md)                                           | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-01-12    |
| [code-reviewer](.claude/skills/code-reviewer/SKILL.md)                                                                              | Code review toolkit tailored for the SoNash codebase.             | ↓0 ↑0      | 2026-02-24    |
| [Coding Standards](.claude/skills/code-reviewer/references/coding_standards.md)                                                     | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-01-12    |
| [Common Antipatterns](.claude/skills/code-reviewer/references/common_antipatterns.md)                                               | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-01-12    |
| [Comprehensive Audit Recovery Procedures](.claude/skills/audit-comprehensive/reference/RECOVERY_PROCEDURES.md)                      | Persist critical environment variables across context compac...   | ↓2 ↑0      | 2026-02-16    |
| [Comprehensive Audit Triage Guide](.claude/skills/audit-comprehensive/reference/TRIAGE_GUIDE.md)                                    | Complete guide for triaging findings from the 9-domain compr...   | ↓1 ↑0      | 2026-02-16    |
| [Comprehensive Audit Wave Details](.claude/skills/audit-comprehensive/reference/WAVE_DETAILS.md)                                    | Core technical audits that form the foundation for all subse...   | ↓1 ↑1      | 2026-02-16    |
| [Comprehensive Ecosystem Audit Aggregation Guide](.claude/skills/comprehensive-ecosystem-audit/reference/AGGREGATION_GUIDE.md)      | How to compute the overall ecosystem health grade, domain he...   | ↓1 ↑0      | 2026-02-24    |
| [Comprehensive Ecosystem Audit Recovery Procedures](.claude/skills/comprehensive-ecosystem-audit/reference/RECOVERY_PROCEDURES.md)  | How to recover from interruptions during a comprehensive eco...   | ↓1 ↑0      | 2026-02-24    |
| [Comprehensive Ecosystem Audit Wave Details](.claude/skills/comprehensive-ecosystem-audit/reference/WAVE_DETAILS.md)                | Complete reference for staged execution of the 7-audit ecosy...   | ↓1 ↑1      | 2026-02-24    |
| [comprehensive-ecosystem-audit](.claude/skills/comprehensive-ecosystem-audit/SKILL.md)                                              | Orchestrates all 7 ecosystem audits (hook, session, TDMS, PR...   | ↓0 ↑2      | 2026-02-24    |
| [Condition-Based Waiting](.claude/skills/systematic-debugging/condition-based-waiting.md)                                           | Flaky tests often guess at timing with arbitrary delays. Thi...   | ↓0 ↑0      | 2026-01-12    |
| [Content Research Writer -- Examples & Templates](.claude/skills/content-research-writer/examples.md)                               | <!-- prettier-ignore-start -->                                    | ↓1 ↑0      | 2026-02-24    |
| [content-research-writer](.claude/skills/content-research-writer/SKILL.md)                                                          | This skill acts as your writing partner, helping you researc...   | ↓0 ↑1      | 2026-02-24    |
| [create-audit](.claude/skills/create-audit/SKILL.md)                                                                                | <Description of when to use this template>                        | ↓0 ↑0      | 2026-02-24    |
| [Creation Log: Systematic Debugging Skill](.claude/skills/systematic-debugging/CREATION-LOG.md)                                     | Reference example of extracting, structuring, and bulletproo...   | ↓0 ↑0      | 2026-01-12    |
| [Data Analysis Patterns for Market Research](.claude/skills/market-research-reports/references/data_analysis_patterns.md)           | Templates and frameworks for conducting rigorous market anal...   | ↓0 ↑0      | 2026-01-12    |
| [decrypt-secrets](.claude/skills/decrypt-secrets/SKILL.md)                                                                          | Decrypt your encrypted MCP tokens at the start of a remote s...   | ↓0 ↑0      | 2026-02-24    |
| [deep-plan](.claude/skills/deep-plan/SKILL.md)                                                                                      | Eliminate assumptions before writing a single line of plan. ...   | ↓0 ↑0      | 2026-02-25    |
| [Defense-in-Depth Validation](.claude/skills/systematic-debugging/defense-in-depth.md)                                              | Reject obviously invalid input at API boundary                    | ↓0 ↑0      | 2026-01-12    |
| [developer-growth-analysis](.claude/skills/developer-growth-analysis/SKILL.md)                                                      | This skill provides personalized feedback on your recent cod...   | ↓0 ↑0      | 2026-02-24    |
| [doc-ecosystem-audit](.claude/skills/doc-ecosystem-audit/SKILL.md)                                                                  | Deep diagnostic of the entire documentation ecosystem — docu...   | ↓0 ↑0      | 2026-02-24    |
| [doc-optimizer](.claude/skills/doc-optimizer/SKILL.md)                                                                              | -                                                                 | ↓0 ↑0      | 2026-02-24    |
| [Doc-Optimizer Agent Prompts](.claude/skills/doc-optimizer/prompts.md)                                                              | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [docs-maintain](.claude/skills/docs-maintain/SKILL.md)                                                                              | Unified skill for checking doc sync and updating doc artifac...   | ↓0 ↑0      | 2026-02-24    |
| [Documentation Audit — Agent Prompts & Templates](.claude/skills/audit-documentation/prompts.md)                                    | <!-- prettier-ignore-start -->                                    | ↓1 ↑0      | 2026-02-24    |
| [Excel Analysis](.claude/skills/excel-analysis/SKILL.md)                                                                            | - Analyze Excel spreadsheets, create pivot tables, generate ...   | ↓0 ↑0      | 2026-02-24    |
| [find-skills](.claude/skills/find-skills/SKILL.md)                                                                                  | This skill helps you discover and install skills and plugins...   | ↓0 ↑0      | 2026-02-24    |
| [frontend-design](.claude/skills/frontend-design/SKILL.md)                                                                          | -                                                                 | ↓0 ↑0      | 2026-02-24    |
| [gh-fix-ci](.claude/skills/gh-fix-ci/SKILL.md)                                                                                      | - Inspect GitHub PR checks with gh, pull failing GitHub Acti...   | ↓0 ↑0      | 2026-02-24    |
| [hook-ecosystem-audit](.claude/skills/hook-ecosystem-audit/SKILL.md)                                                                | Deep diagnostic of the entire hook ecosystem — Claude Code h...   | ↓0 ↑0      | 2026-02-24    |
| [Learning Capture (Step 7)](.claude/skills/pr-review/reference/LEARNING_CAPTURE.md)                                                 | Mandatory learning documentation after every PR review proce...   | ↓1 ↑0      | 2026-02-17    |
| [Market Research Report Formatting Guide](.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md)                        | Quick reference for using the `market_research.sty` style pa...   | ↓0 ↑0      | 2026-01-12    |
| [Market Research Report Structure Guide](.claude/skills/market-research-reports/references/report_structure_guide.md)               | Create a strong first impression and communicate report scop...   | ↓0 ↑0      | 2026-01-12    |
| [Market Research Reports — Section Templates & Structure Guide](.claude/skills/market-research-reports/structure.md)                | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [market-research-reports](.claude/skills/market-research-reports/SKILL.md)                                                          | - "Generate comprehensive market research reports (50+ pages...   | ↓0 ↑0      | 2026-02-24    |
| [MCP Server Development Best Practices and Guidelines](.claude/skills/mcp-builder/reference/mcp_best_practices.md)                  | This document compiles essential best practices and guidelin...   | ↓1 ↑0      | 2026-01-12    |
| [MCP Server Evaluation Guide](.claude/skills/mcp-builder/reference/evaluation.md)                                                   | This document provides guidance on creating comprehensive ev...   | ↓1 ↑0      | 2026-01-12    |
| [mcp-builder](.claude/skills/mcp-builder/SKILL.md)                                                                                  | - Guide for creating high-quality MCP (Model Context Protoco...   | ↓0 ↑4      | 2026-02-24    |
| [Multi-AI Audit — Templates, Examples & Detailed Phase Instructions](.claude/skills/multi-ai-audit/templates.md)                    | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [multi-ai-audit](.claude/skills/multi-ai-audit/SKILL.md)                                                                            | Single-entry-point skill that orchestrates the entire multi-...   | ↓0 ↑2      | 2026-02-24    |
| [Node/TypeScript MCP Server Implementation Guide](.claude/skills/mcp-builder/reference/node_mcp_server.md)                          | This document provides Node/TypeScript-specific best practic...   | ↓1 ↑0      | 2026-01-12    |
| [Parallel Agent Strategy (Steps 4.3-4.5)](.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md)                            | Detailed guidance for parallel agent execution when processi...   | ↓1 ↑0      | 2026-02-14    |
| [PR Retro Skill -- Archive](.claude/skills/pr-retro/ARCHIVE.md)                                                                     | <!-- prettier-ignore-start -->                                    | ↓1 ↑0      | 2026-02-24    |
| [PR Review Skill — Archive](.claude/skills/pr-review/ARCHIVE.md)                                                                    | <!-- prettier-ignore-start -->                                    | ↓1 ↑0      | 2026-02-24    |
| [pr-ecosystem-audit](.claude/skills/pr-ecosystem-audit/SKILL.md)                                                                    | Deep diagnostic of the entire PR review ecosystem — from ski...   | ↓0 ↑0      | 2026-02-24    |
| [pr-retro](.claude/skills/pr-retro/SKILL.md)                                                                                        | Analyze the review cycle for a completed PR and produce a \*\*... | ↓0 ↑1      | 2026-02-27    |
| [pr-review](.claude/skills/pr-review/SKILL.md)                                                                                      | You are about to process AI code review feedback. This is a ...   | ↓0 ↑5      | 2026-02-27    |
| [pre-commit-fixer](.claude/skills/pre-commit-fixer/SKILL.md)                                                                        | Eliminate the context-heavy fix-commit-retry loop that happe...   | ↓0 ↑0      | 2026-02-24    |
| [Pressure Test 1: Emergency Production Fix](.claude/skills/systematic-debugging/test-pressure-1.md)                                 | -                                                                 | ↓0 ↑0      | 2026-01-12    |
| [Pressure Test 2: Sunk Cost + Exhaustion](.claude/skills/systematic-debugging/test-pressure-2.md)                                   | -                                                                 | ↓0 ↑0      | 2026-01-12    |
| [Pressure Test 3: Authority + Social Pressure](.claude/skills/systematic-debugging/test-pressure-3.md)                              | -                                                                 | ↓0 ↑0      | 2026-01-12    |
| [Python MCP Server Implementation Guide](.claude/skills/mcp-builder/reference/python_mcp_server.md)                                 | This document provides Python-specific best practices and ex...   | ↓1 ↑0      | 2026-01-12    |
| [quick-fix](.claude/skills/quick-fix/SKILL.md)                                                                                      | Auto-suggest fixes for common pre-commit and pattern complia...   | ↓0 ↑0      | 2026-02-24    |
| [Root Cause Tracing](.claude/skills/systematic-debugging/root-cause-tracing.md)                                                     | Bugs often manifest deep in the call stack (git init in wron...   | ↓0 ↑0      | 2026-01-12    |
| [script-ecosystem-audit](.claude/skills/script-ecosystem-audit/SKILL.md)                                                            | Deep diagnostic of the entire script infrastructure — `scrip...   | ↓0 ↑0      | 2026-02-24    |
| [session-begin](.claude/skills/session-begin/SKILL.md)                                                                              | -                                                                 | ↓0 ↑0      | 2026-02-24    |
| [session-ecosystem-audit](.claude/skills/session-ecosystem-audit/SKILL.md)                                                          | Deep diagnostic of the entire Session Ecosystem — lifecycle ...   | ↓0 ↑0      | 2026-02-24    |
| [session-end](.claude/skills/session-end/SKILL.md)                                                                                  | Before ending the session, complete these steps:                  | ↓0 ↑0      | 2026-02-24    |
| [Shared Audit Template](.claude/skills/_shared/AUDIT_TEMPLATE.md)                                                                   | <!-- prettier-ignore-start -->                                    | ↓1 ↑0      | 2026-02-24    |
| [Skill Index](.claude/skills/SKILL_INDEX.md)                                                                                        | -                                                                 | ↓0 ↑0      | 2026-02-24    |
| [Skill Standards](.claude/skills/_shared/SKILL_STANDARDS.md)                                                                        | <!-- prettier-ignore-start -->                                    | ↓3 ↑0      | 2026-02-24    |
| [skill-creator](.claude/skills/skill-creator/SKILL.md)                                                                              | This skill provides guidance for creating effective skills.       | ↓0 ↑2      | 2026-02-24    |
| [skill-ecosystem-audit](.claude/skills/skill-ecosystem-audit/SKILL.md)                                                              | Deep diagnostic of the entire skill ecosystem — SKILL.md fil...   | ↓0 ↑0      | 2026-02-24    |
| [sonarcloud](.claude/skills/sonarcloud/SKILL.md)                                                                                    | Unified orchestrator for all SonarCloud operations against t...   | ↓0 ↑2      | 2026-02-24    |
| [SonarCloud Enrichment (Step 1.5)](.claude/skills/pr-review/reference/SONARCLOUD_ENRICHMENT.md)                                     | When SonarCloud issues are detected in pasted feedback, auto...   | ↓1 ↑0      | 2026-02-14    |
| [sprint](.claude/skills/sprint/SKILL.md)                                                                                            | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [System Test — 23-Domain Test Plan](.claude/skills/system-test/domains.md)                                                          | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-24    |
| [System Test — Complete Interactive Workflow](.claude/skills/system-test/reference/WORKFLOW.md)                                     | Full reference for the 23-domain interactive system test ski...   | ↓1 ↑0      | 2026-02-19    |
| [system-test](.claude/skills/system-test/SKILL.md)                                                                                  | -                                                                 | ↓0 ↑1      | 2026-02-24    |
| [systematic-debugging](.claude/skills/systematic-debugging/SKILL.md)                                                                | - When the task doesn't match this skill's scope -- check re...   | ↓0 ↑0      | 2026-02-24    |
| [task-next](.claude/skills/task-next/SKILL.md)                                                                                      | Shows which tasks are ready to work on based on dependency r...   | ↓0 ↑0      | 2026-02-24    |
| [TDMS Integration (Step 6.5)](.claude/skills/pr-review/reference/TDMS_INTEGRATION.md)                                               | When items are deferred during PR review, they MUST be inges...   | ↓1 ↑0      | 2026-02-14    |
| [tdms-ecosystem-audit](.claude/skills/tdms-ecosystem-audit/SKILL.md)                                                                | Deep diagnostic of the entire Technical Debt Management Syst...   | ↓0 ↑0      | 2026-02-24    |
| [test-suite](.claude/skills/test-suite/SKILL.md)                                                                                    | Multi-phase UI testing orchestration for SoNash. Runs smoke ...   | ↓0 ↑0      | 2026-02-24    |
| [ui-design-system](.claude/skills/ui-design-system/SKILL.md)                                                                        | Professional toolkit for creating and maintaining scalable d...   | ↓0 ↑0      | 2026-02-24    |
| [using-superpowers](.claude/skills/using-superpowers/SKILL.md)                                                                      | - Use when starting any conversation - establishes how to fi...   | ↓0 ↑0      | 2026-02-24    |
| [ux-researcher-designer](.claude/skills/ux-researcher-designer/SKILL.md)                                                            | Comprehensive toolkit for user-centered research and experie...   | ↓0 ↑0      | 2026-02-24    |
| [validate-claude-folder](.claude/skills/validate-claude-folder/SKILL.md)                                                            | Check the `.claude` folder for configuration consistency, do...   | ↓0 ↑2      | 2026-02-24    |
| [verify-technical-debt](.claude/skills/verify-technical-debt/SKILL.md)                                                              | -                                                                 | ↓0 ↑0      | 2026-02-24    |
| [Visual Generation Guide for Market Research Reports](.claude/skills/market-research-reports/references/visual_generation_guide.md) | Foundation visual showing historical and projected market si...   | ↓0 ↑0      | 2026-01-12    |
| [webapp-testing](.claude/skills/webapp-testing/SKILL.md)                                                                            | To test local web applications, write native Python Playwrig...   | ↓0 ↑0      | 2026-02-24    |

### Slash Commands (Tier 3)

_Claude Code custom commands_

| Document                                                   | Description | References | Last Modified |
| ---------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Commands Folder - DEPRECATED](.claude/commands/README.md) | -           | ↓0 ↑0      | 2026-02-23    |

### Technical Debt System (Tier 3)

_TDMS tracking and management_

| Document                                                                               | Description                                                     | References | Last Modified |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Grand Plan V2: Technical Debt Elimination](docs/technical-debt/GRAND_PLAN_V2.md)      | This document is the authoritative plan for eliminating tech... | ↓1 ↑0      | 2026-02-22    |
| [TDMS Final System Audit](docs/technical-debt/FINAL_SYSTEM_AUDIT.md)                   | <!-- prettier-ignore-start -->                                  | ↓1 ↑2      | 2026-02-23    |
| [Technical Debt Index](docs/technical-debt/INDEX.md)                                   | <!-- prettier-ignore-start -->                                  | ↓4 ↑4      | 2026-02-27    |
| [Technical Debt Management System - Procedure Guide](docs/technical-debt/PROCEDURE.md) | This document provides step-by-step procedures for managing ... | ↓8 ↑1      | 2026-02-23    |
| [Technical Debt Metrics](docs/technical-debt/METRICS.md)                               | This document provides a real-time dashboard of technical de... | ↓1 ↑0      | 2026-02-27    |

### Templates (Tier 3)

_Document and audit templates_

| Document                                                                         | Description                                                     | References | Last Modified |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [[Document Title]](docs/templates/CANONICAL_DOC_TEMPLATE.md)                     | -                                                               | ↓0 ↑0      | 2026-02-03    |
| [[Document Title]](docs/templates/FOUNDATION_DOC_TEMPLATE.md)                    | -                                                               | ↓0 ↑4      | 2026-02-23    |
| [[Feature/Initiative Name] Plan](docs/templates/PLANNING_DOC_TEMPLATE.md)        | -                                                               | ↓0 ↑4      | 2026-02-03    |
| [[Workflow/Reference Name]](docs/templates/REFERENCE_DOC_TEMPLATE.md)            | -                                                               | ↓0 ↑0      | 2026-01-15    |
| [CANON Quick Reference Card](docs/templates/CANON_QUICK_REFERENCE.md)            | One-page quick reference for Multi-AI audits. Distilled from... | ↓0 ↑0      | 2026-02-23    |
| [How to [Accomplish Task]](docs/templates/GUIDE_DOC_TEMPLATE.md)                 | -                                                               | ↓0 ↑2      | 2026-01-15    |
| [Multi-AI Review JSONL Schema Standard](docs/templates/JSONL_SCHEMA_STANDARD.md) | Standardized JSONL output schema for all multi-AI review tem... | ↓7 ↑8      | 2026-02-23    |

### .agent > workflows (Tier 4)

_Uncategorized_

| Document                                                | Description                                                     | References | Last Modified |
| ------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Deploy to Production](.agent/workflows/deploy-prod.md) | This workflow automates the deployment process for the Sonas... | ↓0 ↑0      | 2026-01-12    |

### .agents > skills > find-skills (Tier 4)

_Uncategorized_

| Document                                           | Description                                                     | References | Last Modified |
| -------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [find-skills](.agents/skills/find-skills/SKILL.md) | This skill helps you discover and install skills and plugins... | ↓0 ↑0      | 2026-02-08    |

### .claude (Tier 4)

_Uncategorized_

| Document                                                              | Description                                                     | References | Last Modified |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Claude Code Command Reference (Index)](.claude/COMMAND_REFERENCE.md) | <!-- prettier-ignore-start -->                                  | ↓3 ↑0      | 2026-02-26    |
| [Claude Hooks Documentation](.claude/HOOKS.md)                        | Documents all Claude Code hooks configured in `.claude/setti... | ↓2 ↑4      | 2026-02-25    |
| [Cross-Platform Claude Code Setup](.claude/CROSS_PLATFORM_SETUP.md)   | > **DEPRECATION NOTICE (2026-02-23):** The `scripts/sync-cla... | ↓3 ↑0      | 2026-02-25    |
| [Hook & Session State Files Schema](.claude/STATE_SCHEMA.md)          | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-25    |
| [Required Plugins for Claude Code](.claude/REQUIRED_PLUGINS.md)       | This document lists all plugins required for full functional... | ↓1 ↑0      | 2026-02-23    |

### .claude > agents (Tier 4)

_Uncategorized_

| Document                                                                           | Description                                     | References | Last Modified |
| ---------------------------------------------------------------------------------- | ----------------------------------------------- | ---------- | ------------- |
| [backend-architect](.claude/agents/backend-architect.md)                           | -                                               | ↓0 ↑0      | 2026-01-12    |
| [code-reviewer](.claude/agents/code-reviewer.md)                                   | -                                               | ↓0 ↑0      | 2026-01-12    |
| [database-architect](.claude/agents/database-architect.md)                         | async def create_customer(self, customer_data): | ↓0 ↑0      | 2026-01-12    |
| [debugger](.claude/agents/debugger.md)                                             | -                                               | ↓0 ↑0      | 2026-01-12    |
| [dependency-manager](.claude/agents/dependency-manager.md)                         | -                                               | ↓0 ↑0      | 2026-01-17    |
| [deployment-engineer](.claude/agents/deployment-engineer.md)                       | -                                               | ↓0 ↑0      | 2026-01-12    |
| [devops-troubleshooter](.claude/agents/devops-troubleshooter.md)                   | -                                               | ↓0 ↑0      | 2026-01-12    |
| [documentation-expert](.claude/agents/documentation-expert.md)                     | -                                               | ↓0 ↑0      | 2026-01-17    |
| [error-detective](.claude/agents/error-detective.md)                               | -                                               | ↓0 ↑0      | 2026-01-12    |
| [frontend-developer](.claude/agents/frontend-developer.md)                         | -                                               | ↓0 ↑0      | 2026-01-12    |
| [fullstack-developer](.claude/agents/fullstack-developer.md)                       | -                                               | ↓0 ↑0      | 2026-01-12    |
| [git-flow-manager](.claude/agents/git-flow-manager.md)                             | -                                               | ↓0 ↑0      | 2026-01-12    |
| [markdown-syntax-formatter](.claude/agents/markdown-syntax-formatter.md)           | -                                               | ↓0 ↑0      | 2026-01-12    |
| [mcp-expert](.claude/agents/mcp-expert.md)                                         | -                                               | ↓0 ↑0      | 2026-01-12    |
| [nextjs-architecture-expert](.claude/agents/nextjs-architecture-expert.md)         | -                                               | ↓0 ↑0      | 2026-01-12    |
| [penetration-tester](.claude/agents/penetration-tester.md)                         | -                                               | ↓0 ↑0      | 2026-01-12    |
| [performance-engineer](.claude/agents/performance-engineer.md)                     | -                                               | ↓0 ↑0      | 2026-01-12    |
| [prompt-engineer](.claude/agents/prompt-engineer.md)                               | -                                               | ↓0 ↑0      | 2026-01-12    |
| [react-performance-optimization](.claude/agents/react-performance-optimization.md) | -                                               | ↓0 ↑0      | 2026-01-12    |
| [security-auditor](.claude/agents/security-auditor.md)                             | -                                               | ↓0 ↑0      | 2026-01-12    |
| [security-engineer](.claude/agents/security-engineer.md)                           | terraform {                                     | ↓0 ↑0      | 2026-01-12    |
| [technical-writer](.claude/agents/technical-writer.md)                             | -                                               | ↓0 ↑0      | 2026-01-12    |
| [test-engineer](.claude/agents/test-engineer.md)                                   | -                                               | ↓0 ↑0      | 2026-01-12    |
| [ui-ux-designer](.claude/agents/ui-ux-designer.md)                                 | -                                               | ↓0 ↑0      | 2026-01-12    |

### .claude > agents > global (Tier 4)

_Uncategorized_

| Document                                                                      | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [gsd-codebase-mapper](.claude/agents/global/gsd-codebase-mapper.md)           | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-debugger](.claude/agents/global/gsd-debugger.md)                         | 100 commits between working and broken: ~7 tests to find exa... | ↓0 ↑0      | 2026-02-02    |
| [gsd-executor](.claude/agents/global/gsd-executor.md)                         | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-integration-checker](.claude/agents/global/gsd-integration-checker.md)   | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-phase-researcher](.claude/agents/global/gsd-phase-researcher.md)         | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-plan-checker](.claude/agents/global/gsd-plan-checker.md)                 | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-planner](.claude/agents/global/gsd-planner.md)                           | No overlap -> can run parallel.                                 | ↓0 ↑0      | 2026-02-02    |
| [gsd-project-researcher](.claude/agents/global/gsd-project-researcher.md)     | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-research-synthesizer](.claude/agents/global/gsd-research-synthesizer.md) | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-roadmapper](.claude/agents/global/gsd-roadmapper.md)                     | -                                                               | ↓0 ↑0      | 2026-02-02    |
| [gsd-verifier](.claude/agents/global/gsd-verifier.md)                         | Extract phase goal from ROADMAP.md. This is the outcome to v... | ↓0 ↑0      | 2026-02-02    |

### .claude > plans (Tier 4)

_Uncategorized_

| Document                                                                                                          | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [AI Optimization Audit Plan](.claude/plans/ai-optimization-audit.md)                                              | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-16    |
| [Audit Ecosystem Full Health Remediation Plan](.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md)                      | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-23    |
| [Audit Template & Schema Full Overhaul Plan](.claude/plans/audit-template-schema-overhaul.md)                     | -                                                               | ↓0 ↑0      | 2026-02-23    |
| [Comprehensive System/Repo Test Plan](.claude/plans/system-test-plan.md)                                          | The user wants a complete system/repository test that touche... | ↓0 ↑0      | 2026-02-23    |
| [Deep Plan: Automation & File Overwrite Fixes](.claude/plans/deep-plan-automation-overwrite-fixes.md)             | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-27    |
| [ESLint + Pattern Compliance Fix Plan — PR #394 Unblock](.claude/plans/ESLINT_AND_COMPLIANCE_FIX_PLAN.md)         | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-26    |
| [Implementation Plan: AI Review Learnings System Overhaul](.claude/plans/review-learnings-overhaul.md)            | Move oldest N reviews from the active log to a new archive f... | ↓0 ↑0      | 2026-02-23    |
| [Implementation Plan: Ecosystem Audit Expansion](.claude/plans/ecosystem-audit-expansion.md)                      | Build 3 new ecosystem audits (skill, doc, script), extend 2 ... | ↓0 ↑0      | 2026-02-24    |
| [Implementation Plan: PR Ecosystem Audit Skill](.claude/plans/pr-ecosystem-audit-plan.md)                         | Build a comprehensive, reusable `/pr-ecosystem-audit` skill ... | ↓0 ↑0      | 2026-02-23    |
| [Implementation Plan: Technical Debt Resolution & Grand Plan V2](.claude/plans/technical-debt-resolution-plan.md) | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-20    |
| [Learning Effectiveness Analyzer - Implementation Plan](.claude/plans/learning-effectiveness-analyzer.md)         | Create a comprehensive tool that:                               |
| ↓0 ↑0                                                                                                             | 2026-01-24                                                      |
| [Plan: Manifest JSON Refactors](.claude/plans/manifest-json-refactors.md)                                         | -                                                               | ↓0 ↑0      | 2026-02-23    |

### .claude > state (Tier 4)

_Uncategorized_

| Document                                                                         | Description                    | References | Last Modified |
| -------------------------------------------------------------------------------- | ------------------------------ | ---------- | ------------- |
| [agent research results](.claude/state/agent-research-results.md)                | -                              | ↓0 ↑0      | 2026-02-23    |
| [Deep Plan — Full Findings Report](.claude/state/deep-plan-findings.md)          | <!-- prettier-ignore-start --> | ↓0 ↑0      | 2026-02-27    |
| [Over-Engineering Research Findings](.claude/state/over-engineering-findings.md) | <!-- prettier-ignore-start --> | ↓0 ↑0      | 2026-02-26    |

### .claude > test-results (Tier 4)

_Uncategorized_

| Document                                                                                        | Description | References | Last Modified |
| ----------------------------------------------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Test Suite Report — 2026-02-07 (smoke scope)](.claude/test-results/2026-02-07-smoke-report.md) | -           | ↓0 ↑0      | 2026-02-08    |

### .gemini (Tier 4)

_Uncategorized_

| Document                                                | Description                                                     | References | Last Modified |
| ------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [SoNash Code Review Style Guide](.gemini/styleguide.md) | This guide defines coding standards and review expectations ... | ↓0 ↑0      | 2026-02-27    |

### .github (Tier 4)

_Uncategorized_

| Document                                                                           | Description | References | Last Modified |
| ---------------------------------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Copilot Instructions - SoNash Recovery Notebook](.github/copilot-instructions.md) | -           | ↓0 ↑0      | 2026-01-12    |
| [ISSUE TEMPLATE APP CHECK REENABLE](.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md)  | -           | ↓0 ↑0      | 2026-01-12    |
| [pull request template](.github/pull_request_template.md)                          | -           | ↓0 ↑0      | 2026-02-02    |

### .planning (Tier 4)

_Uncategorized_

| Document                                                          | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [PR Review Ecosystem v2](.planning/PROJECT.md)                    | A full v2 rebuild of the PR Review Ecosystem for SoNash — th... | ↓0 ↑0      | 2026-02-28    |
| [Project State](.planning/STATE.md)                               | See: .planning/PROJECT.md (updated 2026-02-28)                  | ↓0 ↑0      | 2026-02-28    |
| [Requirements: PR Review Ecosystem v2](.planning/REQUIREMENTS.md) | -                                                               | ↓0 ↑0      | 2026-02-28    |
| [Roadmap: PR Review Ecosystem v2](.planning/ROADMAP.md)           | Rebuild the PR review ecosystem from D+ to B+ by replacing t... | ↓0 ↑0      | 2026-02-28    |

### .planning > ecosystem-v2 (Tier 4)

_Uncategorized_

| Document                                                                             | Description         | References | Last Modified |
| ------------------------------------------------------------------------------------ | ------------------- | ---------- | ------------- |
| [Ecosystem v2 — Discovery Q&A Record](.planning/ecosystem-v2/DISCOVERY_QA.md)        | -                   | ↓0 ↑0      | 2026-02-28    |
| [GSD Project Context: PR Review Ecosystem v2](.planning/ecosystem-v2/GSD_CONTEXT.md) | Context package for | ↓0 ↑0      | 2026-02-28    |

### .planning > phases > 01-storage-foundation (Tier 4)

_Uncategorized_

| Document                                                                                                     | Description            | References | Last Modified |
| ------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------- | ------------- |
| [01 01 PLAN](.planning/phases/01-storage-foundation/01-01-PLAN.md)                                           | -                      | ↓0 ↑0      | 2026-02-28    |
| [01 02 PLAN](.planning/phases/01-storage-foundation/01-02-PLAN.md)                                           | -                      | ↓0 ↑0      | 2026-02-28    |
| [01 03 PLAN](.planning/phases/01-storage-foundation/01-03-PLAN.md)                                           | -                      | ↓0 ↑0      | 2026-02-28    |
| [Dependency graph](.planning/phases/01-storage-foundation/01-01-SUMMARY.md)                                  | requires: [] provides: | ↓0 ↑0      | 2026-02-28    |
| [Dependency graph](.planning/phases/01-storage-foundation/01-02-SUMMARY.md)                                  | -                      | ↓0 ↑0      | 2026-02-28    |
| [Dependency graph](.planning/phases/01-storage-foundation/01-03-SUMMARY.md)                                  | -                      | ↓0 ↑0      | 2026-02-28    |
| [Phase 1: Storage Foundation - Research](.planning/phases/01-storage-foundation/01-RESEARCH.md)              | -                      | ↓0 ↑0      | 2026-02-28    |
| [Phase 1: Storage Foundation Verification Report](.planning/phases/01-storage-foundation/01-VERIFICATION.md) | -                      | ↓0 ↑0      | 2026-02-28    |

### analysis (Tier 4)

_Uncategorized_

| Document                                                                                          | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Full Categorization Analysis](analysis/full_categorization.md)                                   | This document provides a comprehensive categorization analys... | ↓0 ↑0      | 2026-01-27    |
| [Full Dependency Analysis](analysis/full_dependencies.md)                                         | This document provides comprehensive item-level dependency a... | ↓0 ↑0      | 2026-01-27    |
| [Parallel Execution Guide](analysis/PARALLEL_EXECUTION_GUIDE.md)                                  | This guide documents parallelization opportunities identifie... | ↓2 ↑0      | 2026-01-27    |
| [Pass 1: Structural Inventory & Baseline](analysis/pass1_inventory.md)                            | This document provides a comprehensive structural inventory ... | ↓0 ↑0      | 2026-01-27    |
| [Pass 2 Deduplication - Executive Summary](analysis/pass2_summary.md)                             | This document provides an executive summary of the Pass 2 de... | ↓0 ↑0      | 2026-01-27    |
| [Pass 4: Categorization & Feature Group Alignment](analysis/pass4_categorization.md)              | This document reconciles the 18 new feature groups from the ... | ↓0 ↑0      | 2026-01-27    |
| [Pass 5: Effort Estimation Alignment](analysis/pass5_effort.md)                                   | This document provides effort estimates for all 85 staged ex... | ↓0 ↑0      | 2026-01-27    |
| [ROADMAP Analysis](analysis/README.md)                                                            | This folder contains comprehensive analysis documents genera... | ↓0 ↑2      | 2026-02-14    |
| [ROADMAP Deep Analysis - Integration Summary](analysis/INTEGRATION_SUMMARY.md)                    | This document serves as the final integration summary of the... | ↓0 ↑0      | 2026-01-27    |
| [ROADMAP Deep Analysis - Pass 2: Deduplication Analysis](analysis/pass2_deduplication.md)         | This document provides a comprehensive deduplication analysi... | ↓0 ↑0      | 2026-01-27    |
| [ROADMAP Deep Analysis - Pass 3: Dependency Graph Reconciliation](analysis/pass3_dependencies.md) | This document validates the dependency graph structure after... | ↓0 ↑0      | 2026-01-27    |
| [ROADMAP Effort Estimates - Missing Items](analysis/effort_estimates.md)                          | This document provides effort estimates for 96 ROADMAP items... | ↓0 ↑0      | 2026-01-27    |
| [ROADMAP Full Analysis Summary](analysis/FULL_ANALYSIS_SUMMARY.md)                                | This document provides a comprehensive summary of the 6-pass... | ↓0 ↑0      | 2026-01-27    |
| [SoNash ROADMAP Deduplication Analysis](analysis/full_deduplication.md)                           | This document identifies duplicate, overlapping, and conflic... | ↓0 ↑0      | 2026-01-27    |
| [SoNash ROADMAP.md Full Inventory](analysis/full_inventory.md)                                    | This document provides a complete inventory of all 396 items... | ↓0 ↑0      | 2026-01-27    |

### consolidation-output (Tier 4)

_Uncategorized_

| Document                                                                      | Description | References | Last Modified |
| ----------------------------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Suggested Compliance Checker Rules](consolidation-output/suggested-rules.md) | -           | ↓0 ↑0      | 2026-02-27    |

### Core Documentation (Tier 4)

_Reference_

| Document                                                                          | Description                                                       | References | Last Modified |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------- |
| [🤖 AI Code Review Process](docs/AI_REVIEW_PROCESS.md)                            | Each AI review is an opportunity to improve future work. Sys...   | ↓8 ↑2      | 2026-02-23    |
| [AI Review Learnings Log](docs/AI_REVIEW_LEARNINGS_LOG.md)                        | This document is the **audit trail** of all AI code review l...   | ↓3 ↑3      | 2026-02-27    |
| [Document Dependencies](docs/DOCUMENT_DEPENDENCIES.md)                            | Track template-instance relationships,                            | ↓2 ↑1      | 2026-02-24    |
| [Documentation Inventory](docs/README.md)                                         | This document provides a complete inventory of project docum...   | ↓0 ↑11     | 2026-02-23    |
| [Incident Response Runbook](docs/INCIDENT_RESPONSE.md)                            | Documented procedures for responding to security incidents, ...   | ↓7 ↑0      | 2026-02-07    |
| [PR Workflow Checklist - MANDATORY FOR ALL PHASES](docs/PR_WORKFLOW_CHECKLIST.md) | -                                                                 | ↓4 ↑3      | 2026-02-23    |
| [Review Policy Architecture](docs/REVIEW_POLICY_ARCHITECTURE.md)                  | This document defines a \*\*lightweight, AI-first review polic... | ↓3 ↑3      | 2026-02-23    |
| [Review Policy Index](docs/REVIEW_POLICY_INDEX.md)                                | Central directory for all review policy documentation \*\*Last... | ↓1 ↑9      | 2026-02-23    |
| [Review Policy Quick Reference](docs/REVIEW_POLICY_QUICK_REF.md)                  | This is a **one-page quick reference** for the SoNash review...   | ↓3 ↑4      | 2026-01-15    |
| [Review Policy Visual Guide](docs/REVIEW_POLICY_VISUAL_GUIDE.md)                  | This document provides **visual diagrams and flowcharts** fo...   | ↓2 ↑3      | 2026-01-15    |
| [Session Decision Log](docs/SESSION_DECISIONS.md)                                 | This document captures important decisions, options presente...   | ↓1 ↑0      | 2026-01-24    |
| [Session History Log](docs/SESSION_HISTORY.md)                                    | Append-only archive of session summaries from SESSION_CONTEX...   | ↓2 ↑1      | 2026-02-27    |
| [Slash Commands & Skills Reference](docs/SLASH_COMMANDS_REFERENCE.md)             | Comprehensive reference for all slash commands and skills av...   | ↓1 ↑0      | 2026-02-24    |
| [TRIGGERS.md - Automation & Enforcement Reference](docs/TRIGGERS.md)              | -                                                                 | ↓2 ↑1      | 2026-02-17    |

### Decisions (Tier 4)

_Architecture decision records_

| Document                                                         | Description                                                     | References | Last Modified |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [ADR-NNN: [Short Title]](docs/decisions/TEMPLATE.md)             | [Briefly describe the purpose of this ADR - what decision do... | ↓1 ↑0      | 2026-02-21    |
| [Architecture Decision Records (ADRs)](docs/decisions/README.md) | This directory contains Architecture Decision Records (ADRs)... | ↓1 ↑1      | 2026-02-23    |

### Patterns (Tier 4)

_Documented design patterns_

| Document                                                                      | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Context Preservation Pattern](docs/patterns/context-preservation-pattern.md) | This document describes the Context Preservation Pattern for... | ↓0 ↑0      | 2026-02-23    |

### Root Documents (Tier 4)

_Reference_

| Document                                   | Description                                                       | References | Last Modified |
| ------------------------------------------ | ----------------------------------------------------------------- | ---------- | ------------- |
| [AI Context & Rules for SoNash](claude.md) | Core rules and constraints loaded on every AI turn. Kept min...   | ↓4 ↑8      | 2026-02-25    |
| [AI Workflow Guide](AI_WORKFLOW.md)        | \*\*Every phase, section, or milestone completion MUST include... | ↓11 ↑16    | 2026-02-23    |
| [Session Context](SESSION_CONTEXT.md)      | Quick session-to-session handoff context for AI coding sessi...   | ↓6 ↑8      | 2026-02-28    |

### scripts (Tier 4)

_Uncategorized_

| Document                               | Description                                                 | References | Last Modified |
| -------------------------------------- | ----------------------------------------------------------- | ---------- | ------------- |
| [Scripts Reference](scripts/README.md) | Syncs the README.md "Project Status" section with data from | ↓0 ↑0      | 2026-02-16    |

### src > dataconnect-generated (Tier 4)

_Uncategorized_

| Document                                                           | Description | References | Last Modified |
| ------------------------------------------------------------------ | ----------- | ---------- | ------------- |
| [Generated TypeScript README](src/dataconnect-generated/README.md) | -           | ↓1 ↑1      | 2026-02-28    |

### src > dataconnect-generated > .guides (Tier 4)

_Uncategorized_

| Document                                                  | Description                                                     | References | Last Modified |
| --------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Basic Usage](src/dataconnect-generated/.guides/usage.md) | Always prioritize using a supported framework over using the... | ↓0 ↑0      | 2026-02-28    |
| [Setup](src/dataconnect-generated/.guides/setup.md)       | If the user hasn't already installed the SDK, always run the... | ↓0 ↑0      | 2026-02-28    |

### src > dataconnect-generated > react (Tier 4)

_Uncategorized_

| Document                                                            | Description | References | Last Modified |
| ------------------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Generated React README](src/dataconnect-generated/react/README.md) | -           | ↓1 ↑1      | 2026-02-28    |

### Technical Debt Views (Tier 4)

_Auto-generated debt dashboards_

| Document                                                                     | Description                    | References | Last Modified |
| ---------------------------------------------------------------------------- | ------------------------------ | ---------- | ------------- |
| [Technical Debt by Category](docs/technical-debt/views/by-category.md)       | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-27    |
| [Technical Debt by Severity](docs/technical-debt/views/by-severity.md)       | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-27    |
| [Technical Debt by Status](docs/technical-debt/views/by-status.md)           | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-27    |
| [Unplaced Technical Debt Items](docs/technical-debt/views/unplaced-items.md) | <!-- prettier-ignore-start --> | ↓0 ↑1      | 2026-02-02    |
| [Verification Queue](docs/technical-debt/views/verification-queue.md)        | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-27    |

---

## Reference Graph

### Most Referenced Documents (Inbound Links)

Documents that are linked to most frequently:

| Document                                                                                                | Inbound Links | Referenced By                                       |
| ------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| [SoNash Product Roadmap](ROADMAP.md)                                                                    | 18            | AI_WORKFLOW, ARCHITECTURE, DEVELOPMENT +15 more     |
| [Multi-AI Review Coordinator](docs/audits/multi-ai/COORDINATOR.md)                                      | 13            | AI_WORKFLOW, README, README +10 more                |
| [Multi-AI Audit Shared Template Base](docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md)           | 13            | AUDIT_STANDARDS, README, README +10 more            |
| [Security &amp; Privacy Guide](docs/SECURITY.md)                                                        | 12            | AI_WORKFLOW, ARCHITECTURE, DEVELOPMENT +9 more      |
| [AI Workflow Guide](AI_WORKFLOW.md)                                                                     | 11            | HOOKS, README, SESSION_CONTEXT +8 more              |
| [Architecture Documentation](ARCHITECTURE.md)                                                           | 10            | AI_WORKFLOW, DEVELOPMENT, README +7 more            |
| [Development Guide](DEVELOPMENT.md)                                                                     | 10            | AI_WORKFLOW, ARCHITECTURE, README +7 more           |
| [Global Security Standards](docs/GLOBAL_SECURITY_STANDARDS.md)                                          | 10            | AI_WORKFLOW, README, FIREBASE_CHANGE_POLICY +7 more |
| [🤖 AI Code Review Process](docs/AI_REVIEW_PROCESS.md)                                                  | 8             | AI_WORKFLOW, README, SESSION_CONTEXT +5 more        |
| [Technical Debt Management System - Procedure Guide](docs/technical-debt/PROCEDURE.md)                  | 8             | SKILL, SKILL, SKILL +5 more                         |
| [SoNash Documentation Standards](docs/DOCUMENTATION_STANDARDS.md)                                       | 7             | SKILL, AI_WORKFLOW, DOCUMENT_DEPENDENCIES +4 more   |
| [Incident Response Runbook](docs/INCIDENT_RESPONSE.md)                                                  | 7             | ARCHITECTURE, DEVELOPMENT, README +4 more           |
| [\[Project Name\] Multi-AI Code Review Plan](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)       | 7             | README, COORDINATOR, README +4 more                 |
| [\[Project Name\] Multi-AI Performance Audit Plan](docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md) | 7             | README, COORDINATOR, README +4 more                 |
| [\[Project Name\] Multi-AI Refactoring Audit](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)      | 7             | README, COORDINATOR, README +4 more                 |
| [\[Project Name\] Multi-AI Security Audit Plan](docs/audits/multi-ai/templates/SECURITY_AUDIT.md)       | 7             | FIREBASE_CHANGE_POLICY, README, COORDINATOR +4 more |
| [Multi-AI Review JSONL Schema Standard](docs/templates/JSONL_SCHEMA_STANDARD.md)                        | 7             | SKILL, SKILL, DOCUMENTATION_STANDARDS +4 more       |
| [Session Context](SESSION_CONTEXT.md)                                                                   | 6             | AI_WORKFLOW, ROADMAP, claude +3 more                |
| [Code Review Patterns Reference](docs/agent_docs/CODE_PATTERNS.md)                                      | 6             | README, claude, AI_REVIEW_LEARNINGS_LOG +3 more     |
| [Server-Side Security Implementation Guide](docs/SERVER_SIDE_SECURITY.md)                               | 5             | README, ROADMAP, ROADMAP_LOG +2 more                |

### Most Linking Documents (Outbound Links)

Documents that link to other documents most frequently:

| Document                                                                                                  | Outbound Links |
| --------------------------------------------------------------------------------------------------------- | -------------- |
| [SoNash Product Roadmap](ROADMAP.md)                                                                      | 19             |
| [Audit Ecosystem](docs/audits/README.md)                                                                  | 18             |
| [Multi-AI Review Coordinator](docs/audits/multi-ai/COORDINATOR.md)                                        | 18             |
| [AI Workflow Guide](AI_WORKFLOW.md)                                                                       | 16             |
| [SoNash - Sober Nashville Recovery Notebook](README.md)                                                   | 15             |
| [Multi-AI Audit System](docs/audits/multi-ai/README.md)                                                   | 15             |
| [Development Guide](DEVELOPMENT.md)                                                                       | 11             |
| [Documentation Inventory](docs/README.md)                                                                 | 11             |
| [Review Policy Index](docs/REVIEW_POLICY_INDEX.md)                                                        | 9              |
| [Session Context](SESSION_CONTEXT.md)                                                                     | 8              |
| [AI Context &amp; Rules for SoNash](claude.md)                                                            | 8              |
| [Enhancement Audit Template \(Multi-AI Injectable\)](docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md) | 8              |
| [Multi-AI Review JSONL Schema Standard](docs/templates/JSONL_SCHEMA_STANDARD.md)                          | 8              |
| [audit-comprehensive](.claude/skills/audit-comprehensive/SKILL.md)                                        | 6              |
| [Architecture Documentation](ARCHITECTURE.md)                                                             | 6              |
| [SoNash Roadmap Log](ROADMAP_LOG.md)                                                                      | 6              |
| [Firebase Change Policy](docs/FIREBASE_CHANGE_POLICY.md)                                                  | 6              |
| [pr-review](.claude/skills/pr-review/SKILL.md)                                                            | 5              |
| [\[Project Name\] Multi-AI Code Review Plan](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)         | 5              |
| [\[Project Name\] Multi-AI Refactoring Audit](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)        | 5              |

---

## Orphaned Documents

Documents with no inbound links (not referenced by any other document):

**210 orphaned documents:**

- [Deploy to Production](.agent/workflows/deploy-prod.md)
- [find-skills](.agents/skills/find-skills/SKILL.md)
- [Hook & Session State Files Schema](.claude/STATE_SCHEMA.md)
- [backend-architect](.claude/agents/backend-architect.md)
- [code-reviewer](.claude/agents/code-reviewer.md)
- [database-architect](.claude/agents/database-architect.md)
- [debugger](.claude/agents/debugger.md)
- [dependency-manager](.claude/agents/dependency-manager.md)
- [deployment-engineer](.claude/agents/deployment-engineer.md)
- [devops-troubleshooter](.claude/agents/devops-troubleshooter.md)
- [documentation-expert](.claude/agents/documentation-expert.md)
- [error-detective](.claude/agents/error-detective.md)
- [frontend-developer](.claude/agents/frontend-developer.md)
- [fullstack-developer](.claude/agents/fullstack-developer.md)
- [git-flow-manager](.claude/agents/git-flow-manager.md)
- [gsd-codebase-mapper](.claude/agents/global/gsd-codebase-mapper.md)
- [gsd-debugger](.claude/agents/global/gsd-debugger.md)
- [gsd-executor](.claude/agents/global/gsd-executor.md)
- [gsd-integration-checker](.claude/agents/global/gsd-integration-checker.md)
- [gsd-phase-researcher](.claude/agents/global/gsd-phase-researcher.md)
- [gsd-plan-checker](.claude/agents/global/gsd-plan-checker.md)
- [gsd-planner](.claude/agents/global/gsd-planner.md)
- [gsd-project-researcher](.claude/agents/global/gsd-project-researcher.md)
- [gsd-research-synthesizer](.claude/agents/global/gsd-research-synthesizer.md)
- [gsd-roadmapper](.claude/agents/global/gsd-roadmapper.md)
- [gsd-verifier](.claude/agents/global/gsd-verifier.md)
- [markdown-syntax-formatter](.claude/agents/markdown-syntax-formatter.md)
- [mcp-expert](.claude/agents/mcp-expert.md)
- [nextjs-architecture-expert](.claude/agents/nextjs-architecture-expert.md)
- [penetration-tester](.claude/agents/penetration-tester.md)
- [performance-engineer](.claude/agents/performance-engineer.md)
- [prompt-engineer](.claude/agents/prompt-engineer.md)
- [react-performance-optimization](.claude/agents/react-performance-optimization.md)
- [security-auditor](.claude/agents/security-auditor.md)
- [security-engineer](.claude/agents/security-engineer.md)
- [technical-writer](.claude/agents/technical-writer.md)
- [test-engineer](.claude/agents/test-engineer.md)
- [ui-ux-designer](.claude/agents/ui-ux-designer.md)
- [Commands Folder - DEPRECATED](.claude/commands/README.md)
- [Audit Ecosystem Full Health Remediation Plan](.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md)
- [ESLint + Pattern Compliance Fix Plan — PR #394 Unblock](.claude/plans/ESLINT_AND_COMPLIANCE_FIX_PLAN.md)
- [AI Optimization Audit Plan](.claude/plans/ai-optimization-audit.md)
- [Audit Template & Schema Full Overhaul Plan](.claude/plans/audit-template-schema-overhaul.md)
- [Deep Plan: Automation & File Overwrite Fixes](.claude/plans/deep-plan-automation-overwrite-fixes.md)
- [Implementation Plan: Ecosystem Audit Expansion](.claude/plans/ecosystem-audit-expansion.md)
- [Learning Effectiveness Analyzer - Implementation Plan](.claude/plans/learning-effectiveness-analyzer.md)
- [Plan: Manifest JSON Refactors](.claude/plans/manifest-json-refactors.md)
- [Implementation Plan: PR Ecosystem Audit Skill](.claude/plans/pr-ecosystem-audit-plan.md)
- [Implementation Plan: AI Review Learnings System Overhaul](.claude/plans/review-learnings-overhaul.md)
- [Comprehensive System/Repo Test Plan](.claude/plans/system-test-plan.md)
- [Implementation Plan: Technical Debt Resolution & Grand Plan V2](.claude/plans/technical-debt-resolution-plan.md)
- [Skill Index](.claude/skills/SKILL_INDEX.md)
- [add-debt](.claude/skills/add-debt/SKILL.md)
- [alerts](.claude/skills/alerts/SKILL.md)
- [artifacts-builder](.claude/skills/artifacts-builder/SKILL.md)
- [audit-aggregator](.claude/skills/audit-aggregator/SKILL.md)
- [audit-ai-optimization](.claude/skills/audit-ai-optimization/SKILL.md)
- [audit-code](.claude/skills/audit-code/SKILL.md)
- [audit-comprehensive](.claude/skills/audit-comprehensive/SKILL.md)
- [audit-documentation](.claude/skills/audit-documentation/SKILL.md)
- [audit-engineering-productivity](.claude/skills/audit-engineering-productivity/SKILL.md)
- [audit-enhancements](.claude/skills/audit-enhancements/SKILL.md)
- [audit-health](.claude/skills/audit-health/SKILL.md)
- [audit-performance](.claude/skills/audit-performance/SKILL.md)
- [audit-process](.claude/skills/audit-process/SKILL.md)
- [Audit-Process Agent Prompts](.claude/skills/audit-process/prompts.md)
- [audit-refactoring](.claude/skills/audit-refactoring/SKILL.md)
- [audit-security](.claude/skills/audit-security/SKILL.md)
- [checkpoint](.claude/skills/checkpoint/SKILL.md)
- [code-reviewer](.claude/skills/code-reviewer/SKILL.md)
- [Code Review Checklist](.claude/skills/code-reviewer/references/code_review_checklist.md)
- [Coding Standards](.claude/skills/code-reviewer/references/coding_standards.md)
- [Common Antipatterns](.claude/skills/code-reviewer/references/common_antipatterns.md)
- [comprehensive-ecosystem-audit](.claude/skills/comprehensive-ecosystem-audit/SKILL.md)
- [content-research-writer](.claude/skills/content-research-writer/SKILL.md)
- [create-audit](.claude/skills/create-audit/SKILL.md)
- [decrypt-secrets](.claude/skills/decrypt-secrets/SKILL.md)
- [deep-plan](.claude/skills/deep-plan/SKILL.md)
- [developer-growth-analysis](.claude/skills/developer-growth-analysis/SKILL.md)
- [doc-ecosystem-audit](.claude/skills/doc-ecosystem-audit/SKILL.md)
- [doc-optimizer](.claude/skills/doc-optimizer/SKILL.md)
- [Doc-Optimizer Agent Prompts](.claude/skills/doc-optimizer/prompts.md)
- [docs-maintain](.claude/skills/docs-maintain/SKILL.md)
- [Excel Analysis](.claude/skills/excel-analysis/SKILL.md)
- [find-skills](.claude/skills/find-skills/SKILL.md)
- [frontend-design](.claude/skills/frontend-design/SKILL.md)
- [gh-fix-ci](.claude/skills/gh-fix-ci/SKILL.md)
- [hook-ecosystem-audit](.claude/skills/hook-ecosystem-audit/SKILL.md)
- [market-research-reports](.claude/skills/market-research-reports/SKILL.md)
- [Market Research Report Formatting Guide](.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md)
- [Data Analysis Patterns for Market Research](.claude/skills/market-research-reports/references/data_analysis_patterns.md)
- [Market Research Report Structure Guide](.claude/skills/market-research-reports/references/report_structure_guide.md)
- [Visual Generation Guide for Market Research Reports](.claude/skills/market-research-reports/references/visual_generation_guide.md)
- [Market Research Reports — Section Templates & Structure Guide](.claude/skills/market-research-reports/structure.md)
- [mcp-builder](.claude/skills/mcp-builder/SKILL.md)
- [multi-ai-audit](.claude/skills/multi-ai-audit/SKILL.md)
- [Multi-AI Audit — Templates, Examples & Detailed Phase Instructions](.claude/skills/multi-ai-audit/templates.md)
- [pr-ecosystem-audit](.claude/skills/pr-ecosystem-audit/SKILL.md)
- [pr-retro](.claude/skills/pr-retro/SKILL.md)
- [pr-review](.claude/skills/pr-review/SKILL.md)
- [pre-commit-fixer](.claude/skills/pre-commit-fixer/SKILL.md)
- [quick-fix](.claude/skills/quick-fix/SKILL.md)
- [script-ecosystem-audit](.claude/skills/script-ecosystem-audit/SKILL.md)
- [session-begin](.claude/skills/session-begin/SKILL.md)
- [session-ecosystem-audit](.claude/skills/session-ecosystem-audit/SKILL.md)
- [session-end](.claude/skills/session-end/SKILL.md)
- [skill-creator](.claude/skills/skill-creator/SKILL.md)
- [skill-ecosystem-audit](.claude/skills/skill-ecosystem-audit/SKILL.md)
- [sonarcloud](.claude/skills/sonarcloud/SKILL.md)
- [sprint](.claude/skills/sprint/SKILL.md)
- [system-test](.claude/skills/system-test/SKILL.md)
- [System Test — 23-Domain Test Plan](.claude/skills/system-test/domains.md)
- [Creation Log: Systematic Debugging Skill](.claude/skills/systematic-debugging/CREATION-LOG.md)
- [systematic-debugging](.claude/skills/systematic-debugging/SKILL.md)
- [Condition-Based Waiting](.claude/skills/systematic-debugging/condition-based-waiting.md)
- [Defense-in-Depth Validation](.claude/skills/systematic-debugging/defense-in-depth.md)
- [Root Cause Tracing](.claude/skills/systematic-debugging/root-cause-tracing.md)
- [Academic Test: Systematic Debugging Skill](.claude/skills/systematic-debugging/test-academic.md)
- [Pressure Test 1: Emergency Production Fix](.claude/skills/systematic-debugging/test-pressure-1.md)
- [Pressure Test 2: Sunk Cost + Exhaustion](.claude/skills/systematic-debugging/test-pressure-2.md)
- [Pressure Test 3: Authority + Social Pressure](.claude/skills/systematic-debugging/test-pressure-3.md)
- [task-next](.claude/skills/task-next/SKILL.md)
- [tdms-ecosystem-audit](.claude/skills/tdms-ecosystem-audit/SKILL.md)
- [test-suite](.claude/skills/test-suite/SKILL.md)
- [ui-design-system](.claude/skills/ui-design-system/SKILL.md)
- [using-superpowers](.claude/skills/using-superpowers/SKILL.md)
- [ux-researcher-designer](.claude/skills/ux-researcher-designer/SKILL.md)
- [validate-claude-folder](.claude/skills/validate-claude-folder/SKILL.md)
- [verify-technical-debt](.claude/skills/verify-technical-debt/SKILL.md)
- [webapp-testing](.claude/skills/webapp-testing/SKILL.md)
- [agent research results](.claude/state/agent-research-results.md)
- [Deep Plan — Full Findings Report](.claude/state/deep-plan-findings.md)
- [Over-Engineering Research Findings](.claude/state/over-engineering-findings.md)
- [Test Suite Report — 2026-02-07 (smoke scope)](.claude/test-results/2026-02-07-smoke-report.md)
- [SoNash Code Review Style Guide](.gemini/styleguide.md)
- [ISSUE TEMPLATE APP CHECK REENABLE](.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md)
- [Copilot Instructions - SoNash Recovery Notebook](.github/copilot-instructions.md)
- [pull request template](.github/pull_request_template.md)
- [PR Review Ecosystem v2](.planning/PROJECT.md)
- [Requirements: PR Review Ecosystem v2](.planning/REQUIREMENTS.md)
- [Roadmap: PR Review Ecosystem v2](.planning/ROADMAP.md)
- [Project State](.planning/STATE.md)
- [Ecosystem v2 — Discovery Q&A Record](.planning/ecosystem-v2/DISCOVERY_QA.md)
- [GSD Project Context: PR Review Ecosystem v2](.planning/ecosystem-v2/GSD_CONTEXT.md)
- [01 01 PLAN](.planning/phases/01-storage-foundation/01-01-PLAN.md)
- [Dependency graph](.planning/phases/01-storage-foundation/01-01-SUMMARY.md)
- [01 02 PLAN](.planning/phases/01-storage-foundation/01-02-PLAN.md)
- [Dependency graph](.planning/phases/01-storage-foundation/01-02-SUMMARY.md)
- [01 03 PLAN](.planning/phases/01-storage-foundation/01-03-PLAN.md)
- [Dependency graph](.planning/phases/01-storage-foundation/01-03-SUMMARY.md)
- [Phase 1: Storage Foundation - Research](.planning/phases/01-storage-foundation/01-RESEARCH.md)
- [Phase 1: Storage Foundation Verification Report](.planning/phases/01-storage-foundation/01-VERIFICATION.md)
- [SoNash - Sober Nashville Recovery Notebook](README.md)
- [ROADMAP Full Analysis Summary](analysis/FULL_ANALYSIS_SUMMARY.md)
- [ROADMAP Deep Analysis - Integration Summary](analysis/INTEGRATION_SUMMARY.md)
- [ROADMAP Analysis](analysis/README.md)
- [ROADMAP Effort Estimates - Missing Items](analysis/effort_estimates.md)
- [Full Categorization Analysis](analysis/full_categorization.md)
- [SoNash ROADMAP Deduplication Analysis](analysis/full_deduplication.md)
- [Full Dependency Analysis](analysis/full_dependencies.md)
- [SoNash ROADMAP.md Full Inventory](analysis/full_inventory.md)
- [Pass 1: Structural Inventory & Baseline](analysis/pass1_inventory.md)
- [ROADMAP Deep Analysis - Pass 2: Deduplication Analysis](analysis/pass2_deduplication.md)
- [Pass 2 Deduplication - Executive Summary](analysis/pass2_summary.md)
- [ROADMAP Deep Analysis - Pass 3: Dependency Graph Reconciliation](analysis/pass3_dependencies.md)
- [Pass 4: Categorization & Feature Group Alignment](analysis/pass4_categorization.md)
- [Pass 5: Effort Estimation Alignment](analysis/pass5_effort.md)
- [Suggested Compliance Checker Rules](consolidation-output/suggested-rules.md)
- [Learning Effectiveness Metrics](docs/LEARNING_METRICS.md)
- [MCP Server Setup Guide](docs/MCP_SETUP.md)
- [Documentation Inventory](docs/README.md)
- [Skill Ecosystem Audit — Conversation Notes](docs/agent_docs/SKILL_ECOSYSTEM_AUDIT_IDEAS.md)
- [Implementation Plan](docs/aggregation/IMPLEMENTATION_PLAN.md)
- [Master Issue List](docs/aggregation/MASTER_ISSUE_LIST.md)
- [PR Review Ecosystem Diagnosis](docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md)
- [Mining Report: Review Data Quality](docs/aggregation/mining-agent1-data-quality.md)
- [Mining Agent 2: Pipeline Flow & Promotion Analysis](docs/aggregation/mining-agent2-pipeline-flow.md)
- [Mining Agent 3: Retro & Action Item Analysis](docs/aggregation/mining-agent3-retro-actions.md)
- [Mining Agent 4: Integration & Automation](docs/aggregation/mining-agent4-integration.md)
- [Audit vs MASTER_DEBT Deduplication Report](docs/audits/comprehensive/audit-2026-02-22/DEDUP_VS_MASTER_DEBT.md)
- [MASTER_DEBT Internal Deduplication Report](docs/audits/comprehensive/audit-2026-02-22/MASTER_DEBT_DEDUP_REPORT.md)
- [Audit Review Decisions — 2026-02-22](docs/audits/comprehensive/audit-2026-02-22/REVIEW_DECISIONS.md)
- [AI Optimization Audit — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/ai-optimization-audit.md)
- [Code Quality Audit Report — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/code-audit.md)
- [Documentation Audit Report — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/documentation-audit.md)
- [Engineering Productivity Audit](docs/audits/comprehensive/audit-2026-02-22/engineering-productivity-audit.md)
- [SoNash Enhancements Audit](docs/audits/comprehensive/audit-2026-02-22/enhancements-audit.md)
- [Performance Audit — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/performance-audit.md)
- [Process & Automation Audit — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/process-audit.md)
- [Refactoring Audit — sonash-v0](docs/audits/comprehensive/audit-2026-02-22/refactoring-audit.md)
- [Security Audit Report — SoNash v0](docs/audits/comprehensive/audit-2026-02-22/security-audit.md)
- [Multi-AI Audit Summary](docs/audits/multi-ai/maa-2026-02-17-182d43/final/SUMMARY.md)
- [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md)
- [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md)
- [AI Optimization Audit Report (2026-02-14)](docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md)
- [AI Optimization Audit — Review Decisions](docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md)
- [System Test Plan Index — audit-2026-02-19](docs/audits/system-test/audit-2026-02-19/PLAN_INDEX.md)
- [Review Decisions — System Test 2026-02-19](docs/audits/system-test/audit-2026-02-19/REVIEW_DECISIONS.md)
- [Context Preservation Pattern](docs/patterns/context-preservation-pattern.md)
- [Sprint Workflow Skill Design](docs/plans/2026-02-21-sprint-workflow-skill-design.md)
- [Unplaced Technical Debt Items](docs/technical-debt/views/unplaced-items.md)
- [\[Document Title\]](docs/templates/CANONICAL_DOC_TEMPLATE.md)
- [CANON Quick Reference Card](docs/templates/CANON_QUICK_REFERENCE.md)
- [\[Document Title\]](docs/templates/FOUNDATION_DOC_TEMPLATE.md)
- [How to \[Accomplish Task\]](docs/templates/GUIDE_DOC_TEMPLATE.md)
- [\[Feature/Initiative Name\] Plan](docs/templates/PLANNING_DOC_TEMPLATE.md)
- [\[Workflow/Reference Name\]](docs/templates/REFERENCE_DOC_TEMPLATE.md)
- [Scripts Reference](scripts/README.md)
- [Setup](src/dataconnect-generated/.guides/setup.md)
- [Basic Usage](src/dataconnect-generated/.guides/usage.md)

---

## Full Document List

<details>
<summary>Click to expand full list of all documents</summary>

| #   | Path                                                                                                                                                                                       | Title                                                                  | Tier | Status                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------- |
| 1   | [.agent/workflows/deploy-prod.md](.agent/workflows/deploy-prod.md)                                                                                                                         | Deploy to Production                                                   | 4    | -                                                                       |
| 2   | [.agents/skills/find-skills/SKILL.md](.agents/skills/find-skills/SKILL.md)                                                                                                                 | find-skills                                                            | 4    | -                                                                       |
| 3   | [.claude/agents/backend-architect.md](.claude/agents/backend-architect.md)                                                                                                                 | backend-architect                                                      | 4    | -                                                                       |
| 4   | [.claude/agents/code-reviewer.md](.claude/agents/code-reviewer.md)                                                                                                                         | code-reviewer                                                          | 4    | -                                                                       |
| 5   | [.claude/agents/database-architect.md](.claude/agents/database-architect.md)                                                                                                               | database-architect                                                     | 4    | -                                                                       |
| 6   | [.claude/agents/debugger.md](.claude/agents/debugger.md)                                                                                                                                   | debugger                                                               | 4    | -                                                                       |
| 7   | [.claude/agents/dependency-manager.md](.claude/agents/dependency-manager.md)                                                                                                               | dependency-manager                                                     | 4    | -                                                                       |
| 8   | [.claude/agents/deployment-engineer.md](.claude/agents/deployment-engineer.md)                                                                                                             | deployment-engineer                                                    | 4    | -                                                                       |
| 9   | [.claude/agents/devops-troubleshooter.md](.claude/agents/devops-troubleshooter.md)                                                                                                         | devops-troubleshooter                                                  | 4    | -                                                                       |
| 10  | [.claude/agents/documentation-expert.md](.claude/agents/documentation-expert.md)                                                                                                           | documentation-expert                                                   | 4    | -                                                                       |
| 11  | [.claude/agents/error-detective.md](.claude/agents/error-detective.md)                                                                                                                     | error-detective                                                        | 4    | -                                                                       |
| 12  | [.claude/agents/frontend-developer.md](.claude/agents/frontend-developer.md)                                                                                                               | frontend-developer                                                     | 4    | -                                                                       |
| 13  | [.claude/agents/fullstack-developer.md](.claude/agents/fullstack-developer.md)                                                                                                             | fullstack-developer                                                    | 4    | -                                                                       |
| 14  | [.claude/agents/git-flow-manager.md](.claude/agents/git-flow-manager.md)                                                                                                                   | git-flow-manager                                                       | 4    | -                                                                       |
| 15  | [.claude/agents/global/gsd-codebase-mapper.md](.claude/agents/global/gsd-codebase-mapper.md)                                                                                               | gsd-codebase-mapper                                                    | 4    | -                                                                       |
| 16  | [.claude/agents/global/gsd-debugger.md](.claude/agents/global/gsd-debugger.md)                                                                                                             | gsd-debugger                                                           | 4    | -                                                                       |
| 17  | [.claude/agents/global/gsd-executor.md](.claude/agents/global/gsd-executor.md)                                                                                                             | gsd-executor                                                           | 4    | -                                                                       |
| 18  | [.claude/agents/global/gsd-integration-checker.md](.claude/agents/global/gsd-integration-checker.md)                                                                                       | gsd-integration-checker                                                | 4    | -                                                                       |
| 19  | [.claude/agents/global/gsd-phase-researcher.md](.claude/agents/global/gsd-phase-researcher.md)                                                                                             | gsd-phase-researcher                                                   | 4    | -                                                                       |
| 20  | [.claude/agents/global/gsd-plan-checker.md](.claude/agents/global/gsd-plan-checker.md)                                                                                                     | gsd-plan-checker                                                       | 4    | -                                                                       |
| 21  | [.claude/agents/global/gsd-planner.md](.claude/agents/global/gsd-planner.md)                                                                                                               | gsd-planner                                                            | 4    | -                                                                       |
| 22  | [.claude/agents/global/gsd-project-researcher.md](.claude/agents/global/gsd-project-researcher.md)                                                                                         | gsd-project-researcher                                                 | 4    | -                                                                       |
| 23  | [.claude/agents/global/gsd-research-synthesizer.md](.claude/agents/global/gsd-research-synthesizer.md)                                                                                     | gsd-research-synthesizer                                               | 4    | -                                                                       |
| 24  | [.claude/agents/global/gsd-roadmapper.md](.claude/agents/global/gsd-roadmapper.md)                                                                                                         | gsd-roadmapper                                                         | 4    | -                                                                       |
| 25  | [.claude/agents/global/gsd-verifier.md](.claude/agents/global/gsd-verifier.md)                                                                                                             | gsd-verifier                                                           | 4    | -                                                                       |
| 26  | [.claude/agents/markdown-syntax-formatter.md](.claude/agents/markdown-syntax-formatter.md)                                                                                                 | markdown-syntax-formatter                                              | 4    | -                                                                       |
| 27  | [.claude/agents/mcp-expert.md](.claude/agents/mcp-expert.md)                                                                                                                               | mcp-expert                                                             | 4    | -                                                                       |
| 28  | [.claude/agents/nextjs-architecture-expert.md](.claude/agents/nextjs-architecture-expert.md)                                                                                               | nextjs-architecture-expert                                             | 4    | -                                                                       |
| 29  | [.claude/agents/penetration-tester.md](.claude/agents/penetration-tester.md)                                                                                                               | penetration-tester                                                     | 4    | -                                                                       |
| 30  | [.claude/agents/performance-engineer.md](.claude/agents/performance-engineer.md)                                                                                                           | performance-engineer                                                   | 4    | -                                                                       |
| 31  | [.claude/agents/prompt-engineer.md](.claude/agents/prompt-engineer.md)                                                                                                                     | prompt-engineer                                                        | 4    | -                                                                       |
| 32  | [.claude/agents/react-performance-optimization.md](.claude/agents/react-performance-optimization.md)                                                                                       | react-performance-optimization                                         | 4    | -                                                                       |
| 33  | [.claude/agents/security-auditor.md](.claude/agents/security-auditor.md)                                                                                                                   | security-auditor                                                       | 4    | -                                                                       |
| 34  | [.claude/agents/security-engineer.md](.claude/agents/security-engineer.md)                                                                                                                 | security-engineer                                                      | 4    | -                                                                       |
| 35  | [.claude/agents/technical-writer.md](.claude/agents/technical-writer.md)                                                                                                                   | technical-writer                                                       | 4    | -                                                                       |
| 36  | [.claude/agents/test-engineer.md](.claude/agents/test-engineer.md)                                                                                                                         | test-engineer                                                          | 4    | -                                                                       |
| 37  | [.claude/agents/ui-ux-designer.md](.claude/agents/ui-ux-designer.md)                                                                                                                       | ui-ux-designer                                                         | 4    | -                                                                       |
| 38  | [.claude/COMMAND_REFERENCE.md](.claude/COMMAND_REFERENCE.md)                                                                                                                               | Claude Code Command Reference \(Index\)                                | 4    | ACTIVE                                                                  |
| 39  | [.claude/commands/README.md](.claude/commands/README.md)                                                                                                                                   | Commands Folder - DEPRECATED                                           | 3    | -                                                                       |
| 40  | [.claude/CROSS_PLATFORM_SETUP.md](.claude/CROSS_PLATFORM_SETUP.md)                                                                                                                         | Cross-Platform Claude Code Setup                                       | 4    | -                                                                       |
| 41  | [.claude/HOOKS.md](.claude/HOOKS.md)                                                                                                                                                       | Claude Hooks Documentation                                             | 4    | ACTIVE                                                                  |
| 42  | [.claude/plans/ai-optimization-audit.md](.claude/plans/ai-optimization-audit.md)                                                                                                           | AI Optimization Audit Plan                                             | 4    | DRAFT                                                                   |
| 43  | [.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md](.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md)                                                                                               | Audit Ecosystem Full Health Remediation Plan                           | 4    | APPROVED                                                                |
| 44  | [.claude/plans/audit-template-schema-overhaul.md](.claude/plans/audit-template-schema-overhaul.md)                                                                                         | Audit Template &amp; Schema Full Overhaul Plan                         | 4    | COMPLETE **Created:** 2026-02-06 **Session:** maa-2026-02-06-b87316     |
| 45  | [.claude/plans/deep-plan-automation-overwrite-fixes.md](.claude/plans/deep-plan-automation-overwrite-fixes.md)                                                                             | Deep Plan: Automation &amp; File Overwrite Fixes                       | 4    | DRAFT — Awaiting Approval                                               |
| 46  | [.claude/plans/ecosystem-audit-expansion.md](.claude/plans/ecosystem-audit-expansion.md)                                                                                                   | Implementation Plan: Ecosystem Audit Expansion                         | 4    | ACTIVE                                                                  |
| 47  | [.claude/plans/ESLINT_AND_COMPLIANCE_FIX_PLAN.md](.claude/plans/ESLINT_AND_COMPLIANCE_FIX_PLAN.md)                                                                                         | ESLint + Pattern Compliance Fix Plan — PR #394 Unblock                 | 4    | COMPLETE \(all 27 items done — Session #192\)                           |
| 48  | [.claude/plans/learning-effectiveness-analyzer.md](.claude/plans/learning-effectiveness-analyzer.md)                                                                                       | Learning Effectiveness Analyzer - Implementation Plan                  | 4    | Planned - Implement after next PR review                                |
| 49  | [.claude/plans/manifest-json-refactors.md](.claude/plans/manifest-json-refactors.md)                                                                                                       | Plan: Manifest JSON Refactors                                          | 4    | COMPLETE \(Completed Session #142, 2026-02-08 — consider archiving\)    |
| 50  | [.claude/plans/pr-ecosystem-audit-plan.md](.claude/plans/pr-ecosystem-audit-plan.md)                                                                                                       | Implementation Plan: PR Ecosystem Audit Skill                          | 4    | COMPLETE                                                                |
| 51  | [.claude/plans/review-learnings-overhaul.md](.claude/plans/review-learnings-overhaul.md)                                                                                                   | Implementation Plan: AI Review Learnings System Overhaul               | 4    | COMPLETE                                                                |
| 52  | [.claude/plans/system-test-plan.md](.claude/plans/system-test-plan.md)                                                                                                                     | Comprehensive System/Repo Test Plan                                    | 4    | DRAFT                                                                   |
| 53  | [.claude/plans/technical-debt-resolution-plan.md](.claude/plans/technical-debt-resolution-plan.md)                                                                                         | Implementation Plan: Technical Debt Resolution &amp; Grand Plan V2     | 4    | DRAFT                                                                   |
| 54  | [.claude/REQUIRED_PLUGINS.md](.claude/REQUIRED_PLUGINS.md)                                                                                                                                 | Required Plugins for Claude Code                                       | 4    | -                                                                       |
| 55  | [.claude/skills/\_shared/AUDIT_TEMPLATE.md](.claude/skills/_shared/AUDIT_TEMPLATE.md)                                                                                                      | Shared Audit Template                                                  | 3    | ACTIVE                                                                  |
| 56  | [.claude/skills/\_shared/SKILL_STANDARDS.md](.claude/skills/_shared/SKILL_STANDARDS.md)                                                                                                    | Skill Standards                                                        | 3    | ACTIVE                                                                  |
| 57  | [.claude/skills/add-debt/SKILL.md](.claude/skills/add-debt/SKILL.md)                                                                                                                       | add-debt                                                               | 3    | -                                                                       |
| 58  | [.claude/skills/alerts/SKILL.md](.claude/skills/alerts/SKILL.md)                                                                                                                           | alerts                                                                 | 3    | -                                                                       |
| 59  | [.claude/skills/artifacts-builder/SKILL.md](.claude/skills/artifacts-builder/SKILL.md)                                                                                                     | artifacts-builder                                                      | 3    | -                                                                       |
| 60  | [.claude/skills/audit-aggregator/examples.md](.claude/skills/audit-aggregator/examples.md)                                                                                                 | Audit Aggregator — Extended Examples                                   | 3    | ACTIVE                                                                  |
| 61  | [.claude/skills/audit-aggregator/SKILL.md](.claude/skills/audit-aggregator/SKILL.md)                                                                                                       | audit-aggregator                                                       | 3    | -                                                                       |
| 62  | [.claude/skills/audit-ai-optimization/SKILL.md](.claude/skills/audit-ai-optimization/SKILL.md)                                                                                             | audit-ai-optimization                                                  | 3    | -                                                                       |
| 63  | [.claude/skills/audit-code/SKILL.md](.claude/skills/audit-code/SKILL.md)                                                                                                                   | audit-code                                                             | 3    | -                                                                       |
| 64  | [.claude/skills/audit-comprehensive/reference/RECOVERY_PROCEDURES.md](.claude/skills/audit-comprehensive/reference/RECOVERY_PROCEDURES.md)                                                 | Comprehensive Audit Recovery Procedures                                | 3    | ACTIVE                                                                  |
| 65  | [.claude/skills/audit-comprehensive/reference/TRIAGE_GUIDE.md](.claude/skills/audit-comprehensive/reference/TRIAGE_GUIDE.md)                                                               | Comprehensive Audit Triage Guide                                       | 3    | ACTIVE                                                                  |
| 66  | [.claude/skills/audit-comprehensive/reference/WAVE_DETAILS.md](.claude/skills/audit-comprehensive/reference/WAVE_DETAILS.md)                                                               | Comprehensive Audit Wave Details                                       | 3    | ACTIVE                                                                  |
| 67  | [.claude/skills/audit-comprehensive/SKILL.md](.claude/skills/audit-comprehensive/SKILL.md)                                                                                                 | audit-comprehensive                                                    | 3    | -                                                                       |
| 68  | [.claude/skills/audit-documentation/prompts.md](.claude/skills/audit-documentation/prompts.md)                                                                                             | Documentation Audit — Agent Prompts &amp; Templates                    | 3    | ACTIVE                                                                  |
| 69  | [.claude/skills/audit-documentation/SKILL.md](.claude/skills/audit-documentation/SKILL.md)                                                                                                 | audit-documentation                                                    | 3    | -                                                                       |
| 70  | [.claude/skills/audit-engineering-productivity/SKILL.md](.claude/skills/audit-engineering-productivity/SKILL.md)                                                                           | audit-engineering-productivity                                         | 3    | -                                                                       |
| 71  | [.claude/skills/audit-enhancements/SKILL.md](.claude/skills/audit-enhancements/SKILL.md)                                                                                                   | audit-enhancements                                                     | 3    | -                                                                       |
| 72  | [.claude/skills/audit-health/SKILL.md](.claude/skills/audit-health/SKILL.md)                                                                                                               | audit-health                                                           | 3    | -                                                                       |
| 73  | [.claude/skills/audit-performance/SKILL.md](.claude/skills/audit-performance/SKILL.md)                                                                                                     | audit-performance                                                      | 3    | -                                                                       |
| 74  | [.claude/skills/audit-process/prompts.md](.claude/skills/audit-process/prompts.md)                                                                                                         | Audit-Process Agent Prompts                                            | 3    | ACTIVE                                                                  |
| 75  | [.claude/skills/audit-process/SKILL.md](.claude/skills/audit-process/SKILL.md)                                                                                                             | audit-process                                                          | 3    | -                                                                       |
| 76  | [.claude/skills/audit-refactoring/SKILL.md](.claude/skills/audit-refactoring/SKILL.md)                                                                                                     | audit-refactoring                                                      | 3    | -                                                                       |
| 77  | [.claude/skills/audit-security/SKILL.md](.claude/skills/audit-security/SKILL.md)                                                                                                           | audit-security                                                         | 3    | -                                                                       |
| 78  | [.claude/skills/checkpoint/SKILL.md](.claude/skills/checkpoint/SKILL.md)                                                                                                                   | checkpoint                                                             | 3    | -                                                                       |
| 79  | [.claude/skills/code-reviewer/references/code_review_checklist.md](.claude/skills/code-reviewer/references/code_review_checklist.md)                                                       | Code Review Checklist                                                  | 3    | -                                                                       |
| 80  | [.claude/skills/code-reviewer/references/coding_standards.md](.claude/skills/code-reviewer/references/coding_standards.md)                                                                 | Coding Standards                                                       | 3    | -                                                                       |
| 81  | [.claude/skills/code-reviewer/references/common_antipatterns.md](.claude/skills/code-reviewer/references/common_antipatterns.md)                                                           | Common Antipatterns                                                    | 3    | -                                                                       |
| 82  | [.claude/skills/code-reviewer/SKILL.md](.claude/skills/code-reviewer/SKILL.md)                                                                                                             | code-reviewer                                                          | 3    | -                                                                       |
| 83  | [.claude/skills/comprehensive-ecosystem-audit/reference/AGGREGATION_GUIDE.md](.claude/skills/comprehensive-ecosystem-audit/reference/AGGREGATION_GUIDE.md)                                 | Comprehensive Ecosystem Audit Aggregation Guide                        | 3    | ACTIVE                                                                  |
| 84  | [.claude/skills/comprehensive-ecosystem-audit/reference/RECOVERY_PROCEDURES.md](.claude/skills/comprehensive-ecosystem-audit/reference/RECOVERY_PROCEDURES.md)                             | Comprehensive Ecosystem Audit Recovery Procedures                      | 3    | ACTIVE                                                                  |
| 85  | [.claude/skills/comprehensive-ecosystem-audit/reference/WAVE_DETAILS.md](.claude/skills/comprehensive-ecosystem-audit/reference/WAVE_DETAILS.md)                                           | Comprehensive Ecosystem Audit Wave Details                             | 3    | ACTIVE                                                                  |
| 86  | [.claude/skills/comprehensive-ecosystem-audit/SKILL.md](.claude/skills/comprehensive-ecosystem-audit/SKILL.md)                                                                             | comprehensive-ecosystem-audit                                          | 3    | -                                                                       |
| 87  | [.claude/skills/content-research-writer/examples.md](.claude/skills/content-research-writer/examples.md)                                                                                   | Content Research Writer -- Examples &amp; Templates                    | 3    | ACTIVE                                                                  |
| 88  | [.claude/skills/content-research-writer/SKILL.md](.claude/skills/content-research-writer/SKILL.md)                                                                                         | content-research-writer                                                | 3    | -                                                                       |
| 89  | [.claude/skills/create-audit/SKILL.md](.claude/skills/create-audit/SKILL.md)                                                                                                               | create-audit                                                           | 3    | -                                                                       |
| 90  | [.claude/skills/decrypt-secrets/SKILL.md](.claude/skills/decrypt-secrets/SKILL.md)                                                                                                         | decrypt-secrets                                                        | 3    | -                                                                       |
| 91  | [.claude/skills/deep-plan/SKILL.md](.claude/skills/deep-plan/SKILL.md)                                                                                                                     | deep-plan                                                              | 3    | -                                                                       |
| 92  | [.claude/skills/developer-growth-analysis/SKILL.md](.claude/skills/developer-growth-analysis/SKILL.md)                                                                                     | developer-growth-analysis                                              | 3    | -                                                                       |
| 93  | [.claude/skills/doc-ecosystem-audit/SKILL.md](.claude/skills/doc-ecosystem-audit/SKILL.md)                                                                                                 | doc-ecosystem-audit                                                    | 3    | -                                                                       |
| 94  | [.claude/skills/doc-optimizer/prompts.md](.claude/skills/doc-optimizer/prompts.md)                                                                                                         | Doc-Optimizer Agent Prompts                                            | 3    | ACTIVE                                                                  |
| 95  | [.claude/skills/doc-optimizer/SKILL.md](.claude/skills/doc-optimizer/SKILL.md)                                                                                                             | doc-optimizer                                                          | 3    | -                                                                       |
| 96  | [.claude/skills/docs-maintain/SKILL.md](.claude/skills/docs-maintain/SKILL.md)                                                                                                             | docs-maintain                                                          | 3    | -                                                                       |
| 97  | [.claude/skills/excel-analysis/SKILL.md](.claude/skills/excel-analysis/SKILL.md)                                                                                                           | Excel Analysis                                                         | 3    | -                                                                       |
| 98  | [.claude/skills/find-skills/SKILL.md](.claude/skills/find-skills/SKILL.md)                                                                                                                 | find-skills                                                            | 3    | -                                                                       |
| 99  | [.claude/skills/frontend-design/SKILL.md](.claude/skills/frontend-design/SKILL.md)                                                                                                         | frontend-design                                                        | 3    | -                                                                       |
| 100 | [.claude/skills/gh-fix-ci/SKILL.md](.claude/skills/gh-fix-ci/SKILL.md)                                                                                                                     | gh-fix-ci                                                              | 3    | -                                                                       |
| 101 | [.claude/skills/hook-ecosystem-audit/SKILL.md](.claude/skills/hook-ecosystem-audit/SKILL.md)                                                                                               | hook-ecosystem-audit                                                   | 3    | -                                                                       |
| 102 | [.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md](.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md)                                                     | Market Research Report Formatting Guide                                | 3    | -                                                                       |
| 103 | [.claude/skills/market-research-reports/references/data_analysis_patterns.md](.claude/skills/market-research-reports/references/data_analysis_patterns.md)                                 | Data Analysis Patterns for Market Research                             | 3    | -                                                                       |
| 104 | [.claude/skills/market-research-reports/references/report_structure_guide.md](.claude/skills/market-research-reports/references/report_structure_guide.md)                                 | Market Research Report Structure Guide                                 | 3    | -                                                                       |
| 105 | [.claude/skills/market-research-reports/references/visual_generation_guide.md](.claude/skills/market-research-reports/references/visual_generation_guide.md)                               | Visual Generation Guide for Market Research Reports                    | 3    | -                                                                       |
| 106 | [.claude/skills/market-research-reports/SKILL.md](.claude/skills/market-research-reports/SKILL.md)                                                                                         | market-research-reports                                                | 3    | -                                                                       |
| 107 | [.claude/skills/market-research-reports/structure.md](.claude/skills/market-research-reports/structure.md)                                                                                 | Market Research Reports — Section Templates &amp; Structure Guide      | 3    | ACTIVE                                                                  |
| 108 | [.claude/skills/mcp-builder/reference/evaluation.md](.claude/skills/mcp-builder/reference/evaluation.md)                                                                                   | MCP Server Evaluation Guide                                            | 3    | -                                                                       |
| 109 | [.claude/skills/mcp-builder/reference/mcp_best_practices.md](.claude/skills/mcp-builder/reference/mcp_best_practices.md)                                                                   | MCP Server Development Best Practices and Guidelines                   | 3    | -                                                                       |
| 110 | [.claude/skills/mcp-builder/reference/node_mcp_server.md](.claude/skills/mcp-builder/reference/node_mcp_server.md)                                                                         | Node/TypeScript MCP Server Implementation Guide                        | 3    | -                                                                       |
| 111 | [.claude/skills/mcp-builder/reference/python_mcp_server.md](.claude/skills/mcp-builder/reference/python_mcp_server.md)                                                                     | Python MCP Server Implementation Guide                                 | 3    | -                                                                       |
| 112 | [.claude/skills/mcp-builder/SKILL.md](.claude/skills/mcp-builder/SKILL.md)                                                                                                                 | mcp-builder                                                            | 3    | -                                                                       |
| 113 | [.claude/skills/multi-ai-audit/SKILL.md](.claude/skills/multi-ai-audit/SKILL.md)                                                                                                           | multi-ai-audit                                                         | 3    | -                                                                       |
| 114 | [.claude/skills/multi-ai-audit/templates.md](.claude/skills/multi-ai-audit/templates.md)                                                                                                   | Multi-AI Audit — Templates, Examples &amp; Detailed Phase Instructions | 3    | ACTIVE                                                                  |
| 115 | [.claude/skills/pr-ecosystem-audit/SKILL.md](.claude/skills/pr-ecosystem-audit/SKILL.md)                                                                                                   | pr-ecosystem-audit                                                     | 3    | -                                                                       |
| 116 | [.claude/skills/pr-retro/ARCHIVE.md](.claude/skills/pr-retro/ARCHIVE.md)                                                                                                                   | PR Retro Skill -- Archive                                              | 3    | ACTIVE                                                                  |
| 117 | [.claude/skills/pr-retro/SKILL.md](.claude/skills/pr-retro/SKILL.md)                                                                                                                       | pr-retro                                                               | 3    | -                                                                       |
| 118 | [.claude/skills/pr-review/ARCHIVE.md](.claude/skills/pr-review/ARCHIVE.md)                                                                                                                 | PR Review Skill — Archive                                              | 3    | ACTIVE                                                                  |
| 119 | [.claude/skills/pr-review/reference/LEARNING_CAPTURE.md](.claude/skills/pr-review/reference/LEARNING_CAPTURE.md)                                                                           | Learning Capture \(Step 7\)                                            | 3    | ACTIVE                                                                  |
| 120 | [.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md](.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md)                                                             | Parallel Agent Strategy \(Steps 4.3-4.5\)                              | 3    | ACTIVE                                                                  |
| 121 | [.claude/skills/pr-review/reference/SONARCLOUD_ENRICHMENT.md](.claude/skills/pr-review/reference/SONARCLOUD_ENRICHMENT.md)                                                                 | SonarCloud Enrichment \(Step 1.5\)                                     | 3    | ACTIVE                                                                  |
| 122 | [.claude/skills/pr-review/reference/TDMS_INTEGRATION.md](.claude/skills/pr-review/reference/TDMS_INTEGRATION.md)                                                                           | TDMS Integration \(Step 6.5\)                                          | 3    | ACTIVE                                                                  |
| 123 | [.claude/skills/pr-review/SKILL.md](.claude/skills/pr-review/SKILL.md)                                                                                                                     | pr-review                                                              | 3    | -                                                                       |
| 124 | [.claude/skills/pre-commit-fixer/SKILL.md](.claude/skills/pre-commit-fixer/SKILL.md)                                                                                                       | pre-commit-fixer                                                       | 3    | -                                                                       |
| 125 | [.claude/skills/quick-fix/SKILL.md](.claude/skills/quick-fix/SKILL.md)                                                                                                                     | quick-fix                                                              | 3    | -                                                                       |
| 126 | [.claude/skills/script-ecosystem-audit/SKILL.md](.claude/skills/script-ecosystem-audit/SKILL.md)                                                                                           | script-ecosystem-audit                                                 | 3    | -                                                                       |
| 127 | [.claude/skills/session-begin/SKILL.md](.claude/skills/session-begin/SKILL.md)                                                                                                             | session-begin                                                          | 3    | -                                                                       |
| 128 | [.claude/skills/session-ecosystem-audit/SKILL.md](.claude/skills/session-ecosystem-audit/SKILL.md)                                                                                         | session-ecosystem-audit                                                | 3    | -                                                                       |
| 129 | [.claude/skills/session-end/SKILL.md](.claude/skills/session-end/SKILL.md)                                                                                                                 | session-end                                                            | 3    | -                                                                       |
| 130 | [.claude/skills/SKILL_INDEX.md](.claude/skills/SKILL_INDEX.md)                                                                                                                             | Skill Index                                                            | 3    | -                                                                       |
| 131 | [.claude/skills/skill-creator/SKILL.md](.claude/skills/skill-creator/SKILL.md)                                                                                                             | skill-creator                                                          | 3    | -                                                                       |
| 132 | [.claude/skills/skill-ecosystem-audit/SKILL.md](.claude/skills/skill-ecosystem-audit/SKILL.md)                                                                                             | skill-ecosystem-audit                                                  | 3    | -                                                                       |
| 133 | [.claude/skills/sonarcloud/SKILL.md](.claude/skills/sonarcloud/SKILL.md)                                                                                                                   | sonarcloud                                                             | 3    | -                                                                       |
| 134 | [.claude/skills/sprint/SKILL.md](.claude/skills/sprint/SKILL.md)                                                                                                                           | sprint                                                                 | 3    | -                                                                       |
| 135 | [.claude/skills/system-test/domains.md](.claude/skills/system-test/domains.md)                                                                                                             | System Test — 23-Domain Test Plan                                      | 3    | ACTIVE                                                                  |
| 136 | [.claude/skills/system-test/reference/WORKFLOW.md](.claude/skills/system-test/reference/WORKFLOW.md)                                                                                       | System Test — Complete Interactive Workflow                            | 3    | ACTIVE                                                                  |
| 137 | [.claude/skills/system-test/SKILL.md](.claude/skills/system-test/SKILL.md)                                                                                                                 | system-test                                                            | 3    | -                                                                       |
| 138 | [.claude/skills/systematic-debugging/condition-based-waiting.md](.claude/skills/systematic-debugging/condition-based-waiting.md)                                                           | Condition-Based Waiting                                                | 3    | -                                                                       |
| 139 | [.claude/skills/systematic-debugging/CREATION-LOG.md](.claude/skills/systematic-debugging/CREATION-LOG.md)                                                                                 | Creation Log: Systematic Debugging Skill                               | 3    | -                                                                       |
| 140 | [.claude/skills/systematic-debugging/defense-in-depth.md](.claude/skills/systematic-debugging/defense-in-depth.md)                                                                         | Defense-in-Depth Validation                                            | 3    | -                                                                       |
| 141 | [.claude/skills/systematic-debugging/root-cause-tracing.md](.claude/skills/systematic-debugging/root-cause-tracing.md)                                                                     | Root Cause Tracing                                                     | 3    | -                                                                       |
| 142 | [.claude/skills/systematic-debugging/SKILL.md](.claude/skills/systematic-debugging/SKILL.md)                                                                                               | systematic-debugging                                                   | 3    | -                                                                       |
| 143 | [.claude/skills/systematic-debugging/test-academic.md](.claude/skills/systematic-debugging/test-academic.md)                                                                               | Academic Test: Systematic Debugging Skill                              | 3    | -                                                                       |
| 144 | [.claude/skills/systematic-debugging/test-pressure-1.md](.claude/skills/systematic-debugging/test-pressure-1.md)                                                                           | Pressure Test 1: Emergency Production Fix                              | 3    | -                                                                       |
| 145 | [.claude/skills/systematic-debugging/test-pressure-2.md](.claude/skills/systematic-debugging/test-pressure-2.md)                                                                           | Pressure Test 2: Sunk Cost + Exhaustion                                | 3    | -                                                                       |
| 146 | [.claude/skills/systematic-debugging/test-pressure-3.md](.claude/skills/systematic-debugging/test-pressure-3.md)                                                                           | Pressure Test 3: Authority + Social Pressure                           | 3    | -                                                                       |
| 147 | [.claude/skills/task-next/SKILL.md](.claude/skills/task-next/SKILL.md)                                                                                                                     | task-next                                                              | 3    | -                                                                       |
| 148 | [.claude/skills/tdms-ecosystem-audit/SKILL.md](.claude/skills/tdms-ecosystem-audit/SKILL.md)                                                                                               | tdms-ecosystem-audit                                                   | 3    | -                                                                       |
| 149 | [.claude/skills/test-suite/SKILL.md](.claude/skills/test-suite/SKILL.md)                                                                                                                   | test-suite                                                             | 3    | -                                                                       |
| 150 | [.claude/skills/ui-design-system/SKILL.md](.claude/skills/ui-design-system/SKILL.md)                                                                                                       | ui-design-system                                                       | 3    | -                                                                       |
| 151 | [.claude/skills/using-superpowers/SKILL.md](.claude/skills/using-superpowers/SKILL.md)                                                                                                     | using-superpowers                                                      | 3    | -                                                                       |
| 152 | [.claude/skills/ux-researcher-designer/SKILL.md](.claude/skills/ux-researcher-designer/SKILL.md)                                                                                           | ux-researcher-designer                                                 | 3    | -                                                                       |
| 153 | [.claude/skills/validate-claude-folder/SKILL.md](.claude/skills/validate-claude-folder/SKILL.md)                                                                                           | validate-claude-folder                                                 | 3    | -                                                                       |
| 154 | [.claude/skills/verify-technical-debt/SKILL.md](.claude/skills/verify-technical-debt/SKILL.md)                                                                                             | verify-technical-debt                                                  | 3    | -                                                                       |
| 155 | [.claude/skills/webapp-testing/SKILL.md](.claude/skills/webapp-testing/SKILL.md)                                                                                                           | webapp-testing                                                         | 3    | -                                                                       |
| 156 | [.claude/STATE_SCHEMA.md](.claude/STATE_SCHEMA.md)                                                                                                                                         | Hook &amp; Session State Files Schema                                  | 4    | ACTIVE                                                                  |
| 157 | [.claude/state/agent-research-results.md](.claude/state/agent-research-results.md)                                                                                                         | agent research results                                                 | 4    | -                                                                       |
| 158 | [.claude/state/deep-plan-findings.md](.claude/state/deep-plan-findings.md)                                                                                                                 | Deep Plan — Full Findings Report                                       | 4    | ACTIVE                                                                  |
| 159 | [.claude/state/over-engineering-findings.md](.claude/state/over-engineering-findings.md)                                                                                                   | Over-Engineering Research Findings                                     | 4    | ACTIVE                                                                  |
| 160 | [.claude/test-results/2026-02-07-smoke-report.md](.claude/test-results/2026-02-07-smoke-report.md)                                                                                         | Test Suite Report — 2026-02-07 \(smoke scope\)                         | 4    | -                                                                       |
| 161 | [.gemini/styleguide.md](.gemini/styleguide.md)                                                                                                                                             | SoNash Code Review Style Guide                                         | 4    | ACTIVE                                                                  |
| 162 | [.github/copilot-instructions.md](.github/copilot-instructions.md)                                                                                                                         | Copilot Instructions - SoNash Recovery Notebook                        | 4    | -                                                                       |
| 163 | [.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md](.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md)                                                                                               | ISSUE TEMPLATE APP CHECK REENABLE                                      | 4    | -                                                                       |
| 164 | [.github/pull_request_template.md](.github/pull_request_template.md)                                                                                                                       | pull request template                                                  | 4    | -                                                                       |
| 165 | [.planning/ecosystem-v2/DISCOVERY_QA.md](.planning/ecosystem-v2/DISCOVERY_QA.md)                                                                                                           | Ecosystem v2 — Discovery Q&amp;A Record                                | 4    | ACTIVE                                                                  |
| 166 | [.planning/ecosystem-v2/GSD_CONTEXT.md](.planning/ecosystem-v2/GSD_CONTEXT.md)                                                                                                             | GSD Project Context: PR Review Ecosystem v2                            | 4    | ACTIVE                                                                  |
| 167 | [.planning/phases/01-storage-foundation/01-01-PLAN.md](.planning/phases/01-storage-foundation/01-01-PLAN.md)                                                                               | 01 01 PLAN                                                             | 4    | ACTIVE                                                                  |
| 168 | [.planning/phases/01-storage-foundation/01-01-SUMMARY.md](.planning/phases/01-storage-foundation/01-01-SUMMARY.md)                                                                         | Dependency graph                                                       | 4    | ACTIVE                                                                  |
| 169 | [.planning/phases/01-storage-foundation/01-02-PLAN.md](.planning/phases/01-storage-foundation/01-02-PLAN.md)                                                                               | 01 02 PLAN                                                             | 4    | ACTIVE                                                                  |
| 170 | [.planning/phases/01-storage-foundation/01-02-SUMMARY.md](.planning/phases/01-storage-foundation/01-02-SUMMARY.md)                                                                         | Dependency graph                                                       | 4    | ACTIVE                                                                  |
| 171 | [.planning/phases/01-storage-foundation/01-03-PLAN.md](.planning/phases/01-storage-foundation/01-03-PLAN.md)                                                                               | 01 03 PLAN                                                             | 4    | ACTIVE                                                                  |
| 172 | [.planning/phases/01-storage-foundation/01-03-SUMMARY.md](.planning/phases/01-storage-foundation/01-03-SUMMARY.md)                                                                         | Dependency graph                                                       | 4    | ACTIVE                                                                  |
| 173 | [.planning/phases/01-storage-foundation/01-RESEARCH.md](.planning/phases/01-storage-foundation/01-RESEARCH.md)                                                                             | Phase 1: Storage Foundation - Research                                 | 4    | ACTIVE                                                                  |
| 174 | [.planning/phases/01-storage-foundation/01-VERIFICATION.md](.planning/phases/01-storage-foundation/01-VERIFICATION.md)                                                                     | Phase 1: Storage Foundation Verification Report                        | 4    | ACTIVE                                                                  |
| 175 | [.planning/PROJECT.md](.planning/PROJECT.md)                                                                                                                                               | PR Review Ecosystem v2                                                 | 4    | ACTIVE                                                                  |
| 176 | [.planning/REQUIREMENTS.md](.planning/REQUIREMENTS.md)                                                                                                                                     | Requirements: PR Review Ecosystem v2                                   | 4    | ACTIVE                                                                  |
| 177 | [.planning/ROADMAP.md](.planning/ROADMAP.md)                                                                                                                                               | Roadmap: PR Review Ecosystem v2                                        | 4    | ACTIVE                                                                  |
| 178 | [.planning/STATE.md](.planning/STATE.md)                                                                                                                                                   | Project State                                                          | 4    | ACTIVE                                                                  |
| 179 | [AI_WORKFLOW.md](AI_WORKFLOW.md)                                                                                                                                                           | AI Workflow Guide                                                      | 4    | -                                                                       |
| 180 | [analysis/effort_estimates.md](analysis/effort_estimates.md)                                                                                                                               | ROADMAP Effort Estimates - Missing Items                               | 4    | -                                                                       |
| 181 | [analysis/FULL_ANALYSIS_SUMMARY.md](analysis/FULL_ANALYSIS_SUMMARY.md)                                                                                                                     | ROADMAP Full Analysis Summary                                          | 4    | -                                                                       |
| 182 | [analysis/full_categorization.md](analysis/full_categorization.md)                                                                                                                         | Full Categorization Analysis                                           | 4    | -                                                                       |
| 183 | [analysis/full_deduplication.md](analysis/full_deduplication.md)                                                                                                                           | SoNash ROADMAP Deduplication Analysis                                  | 4    | -                                                                       |
| 184 | [analysis/full_dependencies.md](analysis/full_dependencies.md)                                                                                                                             | Full Dependency Analysis                                               | 4    | -                                                                       |
| 185 | [analysis/full_inventory.md](analysis/full_inventory.md)                                                                                                                                   | SoNash ROADMAP.md Full Inventory                                       | 4    | -                                                                       |
| 186 | [analysis/INTEGRATION_SUMMARY.md](analysis/INTEGRATION_SUMMARY.md)                                                                                                                         | ROADMAP Deep Analysis - Integration Summary                            | 4    | COMPLETE                                                                |
| 187 | [analysis/PARALLEL_EXECUTION_GUIDE.md](analysis/PARALLEL_EXECUTION_GUIDE.md)                                                                                                               | Parallel Execution Guide                                               | 4    | -                                                                       |
| 188 | [analysis/pass1_inventory.md](analysis/pass1_inventory.md)                                                                                                                                 | Pass 1: Structural Inventory &amp; Baseline                            | 4    | -                                                                       |
| 189 | [analysis/pass2_deduplication.md](analysis/pass2_deduplication.md)                                                                                                                         | ROADMAP Deep Analysis - Pass 2: Deduplication Analysis                 | 4    | -                                                                       |
| 190 | [analysis/pass2_summary.md](analysis/pass2_summary.md)                                                                                                                                     | Pass 2 Deduplication - Executive Summary                               | 4    | -                                                                       |
| 191 | [analysis/pass3_dependencies.md](analysis/pass3_dependencies.md)                                                                                                                           | ROADMAP Deep Analysis - Pass 3: Dependency Graph Reconciliation        | 4    | 📋 Planned **Priority:** P0 \(Critical prerequisite for M5\)            |
| 192 | [analysis/pass4_categorization.md](analysis/pass4_categorization.md)                                                                                                                       | Pass 4: Categorization &amp; Feature Group Alignment                   | 4    | COMPLETE \| **Last Updated:** 2026-01-27                                |
| 193 | [analysis/pass5_effort.md](analysis/pass5_effort.md)                                                                                                                                       | Pass 5: Effort Estimation Alignment                                    | 4    | COMPLETE \| **Last Updated:** 2026-01-27                                |
| 194 | [analysis/README.md](analysis/README.md)                                                                                                                                                   | ROADMAP Analysis                                                       | 4    | -                                                                       |
| 195 | [ARCHITECTURE.md](ARCHITECTURE.md)                                                                                                                                                         | Architecture Documentation                                             | 2    | ACTIVE **Last Updated:** 2026-01-02                                     |
| 196 | [claude.md](claude.md)                                                                                                                                                                     | AI Context &amp; Rules for SoNash                                      | 4    | ACTIVE                                                                  |
| 197 | [consolidation-output/suggested-rules.md](consolidation-output/suggested-rules.md)                                                                                                         | Suggested Compliance Checker Rules                                     | 4    | Pending review - add to check-pattern-compliance.js as appropriate      |
| 198 | [DEVELOPMENT.md](DEVELOPMENT.md)                                                                                                                                                           | Development Guide                                                      | 2    | Active                                                                  |
| 199 | [docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md](docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md)                                                                               | Admin Panel Security &amp; Monitoring Requirements                     | 3    | -                                                                       |
| 200 | [docs/agent_docs/AGENT_ORCHESTRATION.md](docs/agent_docs/AGENT_ORCHESTRATION.md)                                                                                                           | Agent Orchestration Reference                                          | 3    | ACTIVE                                                                  |
| 201 | [docs/agent_docs/CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md)                                                                                                                       | Code Review Patterns Reference                                         | 3    | -                                                                       |
| 202 | [docs/agent_docs/CONTEXT_PRESERVATION.md](docs/agent_docs/CONTEXT_PRESERVATION.md)                                                                                                         | Context Preservation &amp; Compaction Safety                           | 3    | ACTIVE                                                                  |
| 203 | [docs/agent_docs/FIX_TEMPLATES.md](docs/agent_docs/FIX_TEMPLATES.md)                                                                                                                       | Fix Templates for Qodo PR Review Findings                              | 3    | ACTIVE                                                                  |
| 204 | [docs/agent_docs/SECURITY_CHECKLIST.md](docs/agent_docs/SECURITY_CHECKLIST.md)                                                                                                             | Security Checklist for Scripts                                         | 3    | Active                                                                  |
| 205 | [docs/agent_docs/SKILL_AGENT_POLICY.md](docs/agent_docs/SKILL_AGENT_POLICY.md)                                                                                                             | Skill and Agent Usage Policy                                           | 3    | Active **Last Updated:** 2026-02-23                                     |
| 206 | [docs/agent_docs/SKILL_ECOSYSTEM_AUDIT_IDEAS.md](docs/agent_docs/SKILL_ECOSYSTEM_AUDIT_IDEAS.md)                                                                                           | Skill Ecosystem Audit — Conversation Notes                             | 3    | DRAFT                                                                   |
| 207 | [docs/aggregation/IMPLEMENTATION_PLAN.md](docs/aggregation/IMPLEMENTATION_PLAN.md)                                                                                                         | Implementation Plan                                                    | 2    | DRAFT                                                                   |
| 208 | [docs/aggregation/MASTER_ISSUE_LIST.md](docs/aggregation/MASTER_ISSUE_LIST.md)                                                                                                             | Master Issue List                                                      | 2    | DRAFT                                                                   |
| 209 | [docs/aggregation/mining-agent1-data-quality.md](docs/aggregation/mining-agent1-data-quality.md)                                                                                           | Mining Report: Review Data Quality                                     | 2    | ACTIVE                                                                  |
| 210 | [docs/aggregation/mining-agent2-pipeline-flow.md](docs/aggregation/mining-agent2-pipeline-flow.md)                                                                                         | Mining Agent 2: Pipeline Flow &amp; Promotion Analysis                 | 2    | ACTIVE                                                                  |
| 211 | [docs/aggregation/mining-agent3-retro-actions.md](docs/aggregation/mining-agent3-retro-actions.md)                                                                                         | Mining Agent 3: Retro &amp; Action Item Analysis                       | 2    | ACTIVE                                                                  |
| 212 | [docs/aggregation/mining-agent4-integration.md](docs/aggregation/mining-agent4-integration.md)                                                                                             | Mining Agent 4: Integration &amp; Automation                           | 2    | ACTIVE                                                                  |
| 213 | [docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md](docs/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md)                                                                                                   | PR Review Ecosystem Diagnosis                                          | 2    | ACTIVE                                                                  |
| 214 | [docs/AI_REVIEW_LEARNINGS_LOG.md](docs/AI_REVIEW_LEARNINGS_LOG.md)                                                                                                                         | AI Review Learnings Log                                                | 4    | Fully consolidated into claude.md v2.7                                  |
| 215 | [docs/AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md)                                                                                                                                     | 🤖 AI Code Review Process                                              | 4    | Active                                                                  |
| 216 | [docs/APPCHECK_SETUP.md](docs/APPCHECK_SETUP.md)                                                                                                                                           | App Check Setup Guide                                                  | 2    | Active **Last Updated:** 2026-01-03                                     |
| 217 | [docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md](docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md)                                                                                                 | Implementation Plan: Audit Ecosystem Codification                      | 3    | COMPLETED/REFERENCE                                                     |
| 218 | [docs/audits/AUDIT_STANDARDS.md](docs/audits/AUDIT_STANDARDS.md)                                                                                                                           | Audit Standards                                                        | 3    | ACTIVE                                                                  |
| 219 | [docs/audits/AUDIT_TRACKER.md](docs/audits/AUDIT_TRACKER.md)                                                                                                                               | Audit Tracker                                                          | 3    | -                                                                       |
| 220 | [docs/audits/comprehensive/audit-2026-02-22/ai-optimization-audit.md](docs/audits/comprehensive/audit-2026-02-22/ai-optimization-audit.md)                                                 | AI Optimization Audit — sonash-v0                                      | 3    | ACTIVE                                                                  |
| 221 | [docs/audits/comprehensive/audit-2026-02-22/code-audit.md](docs/audits/comprehensive/audit-2026-02-22/code-audit.md)                                                                       | Code Quality Audit Report — sonash-v0                                  | 3    | ACTIVE                                                                  |
| 222 | [docs/audits/comprehensive/audit-2026-02-22/COMPREHENSIVE_AUDIT_REPORT.md](docs/audits/comprehensive/audit-2026-02-22/COMPREHENSIVE_AUDIT_REPORT.md)                                       | Comprehensive Audit Report — SoNash v0                                 | 3    | ACTIVE                                                                  |
| 223 | [docs/audits/comprehensive/audit-2026-02-22/DEDUP_VS_MASTER_DEBT.md](docs/audits/comprehensive/audit-2026-02-22/DEDUP_VS_MASTER_DEBT.md)                                                   | Audit vs MASTER_DEBT Deduplication Report                              | 3    | ACTIVE                                                                  |
| 224 | [docs/audits/comprehensive/audit-2026-02-22/documentation-audit.md](docs/audits/comprehensive/audit-2026-02-22/documentation-audit.md)                                                     | Documentation Audit Report — SoNash v0                                 | 3    | ACTIVE                                                                  |
| 225 | [docs/audits/comprehensive/audit-2026-02-22/engineering-productivity-audit.md](docs/audits/comprehensive/audit-2026-02-22/engineering-productivity-audit.md)                               | Engineering Productivity Audit                                         | 3    | ACTIVE                                                                  |
| 226 | [docs/audits/comprehensive/audit-2026-02-22/enhancements-audit.md](docs/audits/comprehensive/audit-2026-02-22/enhancements-audit.md)                                                       | SoNash Enhancements Audit                                              | 3    | ACTIVE                                                                  |
| 227 | [docs/audits/comprehensive/audit-2026-02-22/MASTER_DEBT_DEDUP_REPORT.md](docs/audits/comprehensive/audit-2026-02-22/MASTER_DEBT_DEDUP_REPORT.md)                                           | MASTER_DEBT Internal Deduplication Report                              | 3    | ACTIVE                                                                  |
| 228 | [docs/audits/comprehensive/audit-2026-02-22/performance-audit.md](docs/audits/comprehensive/audit-2026-02-22/performance-audit.md)                                                         | Performance Audit — SoNash v0                                          | 3    | ACTIVE                                                                  |
| 229 | [docs/audits/comprehensive/audit-2026-02-22/process-audit.md](docs/audits/comprehensive/audit-2026-02-22/process-audit.md)                                                                 | Process &amp; Automation Audit — sonash-v0                             | 3    | ACTIVE                                                                  |
| 230 | [docs/audits/comprehensive/audit-2026-02-22/refactoring-audit.md](docs/audits/comprehensive/audit-2026-02-22/refactoring-audit.md)                                                         | Refactoring Audit — sonash-v0                                          | 3    | ACTIVE                                                                  |
| 231 | [docs/audits/comprehensive/audit-2026-02-22/REVIEW_DECISIONS.md](docs/audits/comprehensive/audit-2026-02-22/REVIEW_DECISIONS.md)                                                           | Audit Review Decisions — 2026-02-22                                    | 3    | ACTIVE                                                                  |
| 232 | [docs/audits/comprehensive/audit-2026-02-22/security-audit.md](docs/audits/comprehensive/audit-2026-02-22/security-audit.md)                                                               | Security Audit Report — SoNash v0                                      | 3    | ACTIVE                                                                  |
| 233 | [docs/audits/multi-ai/COORDINATOR.md](docs/audits/multi-ai/COORDINATOR.md)                                                                                                                 | Multi-AI Review Coordinator                                            | 3    | -                                                                       |
| 234 | [docs/audits/multi-ai/maa-2026-02-17-182d43/final/SUMMARY.md](docs/audits/multi-ai/maa-2026-02-17-182d43/final/SUMMARY.md)                                                                 | Multi-AI Audit Summary                                                 | 3    | -                                                                       |
| 235 | [docs/audits/multi-ai/README.md](docs/audits/multi-ai/README.md)                                                                                                                           | Multi-AI Audit System                                                  | 3    | -                                                                       |
| 236 | [docs/audits/multi-ai/templates/AGGREGATOR.md](docs/audits/multi-ai/templates/AGGREGATOR.md)                                                                                               | Multi-AI Audit Aggregator Template                                     | 3    | -                                                                       |
| 237 | [docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md](docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md)                                                                         | \[Project Name\] Multi-AI AI Optimization Audit Plan                   | 3    | PENDING                                                                 |
| 238 | [docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)                                                                                 | \[Project Name\] Multi-AI Code Review Plan                             | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 239 | [docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md](docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md)                                                                             | \[Project Name\] Multi-AI Documentation Audit Plan                     | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 240 | [docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md](docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md)                                                       | \[Project Name\] Multi-AI Engineering Productivity Audit Plan          | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 241 | [docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md](docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md)                                                                                 | Enhancement Audit Template \(Multi-AI Injectable\)                     | 3    | DRAFT                                                                   |
| 242 | [docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md](docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md)                                                                                 | \[Project Name\] Multi-AI Performance Audit Plan                       | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 243 | [docs/audits/multi-ai/templates/PROCESS_AUDIT.md](docs/audits/multi-ai/templates/PROCESS_AUDIT.md)                                                                                         | \[Project Name\] Multi-AI Process &amp; Automation Audit Plan          | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 244 | [docs/audits/multi-ai/templates/REFACTORING_AUDIT.md](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)                                                                                 | \[Project Name\] Multi-AI Refactoring Audit                            | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 245 | [docs/audits/multi-ai/templates/SECURITY_AUDIT.md](docs/audits/multi-ai/templates/SECURITY_AUDIT.md)                                                                                       | \[Project Name\] Multi-AI Security Audit Plan                          | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                          |
| 246 | [docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md](docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md)                                                                           | Multi-AI Audit Shared Template Base                                    | 3    | ACTIVE **Tier:** 4 \(Reference\) **Purpose:** Shared boilerplate for    |
| 247 | [docs/audits/README.md](docs/audits/README.md)                                                                                                                                             | Audit Ecosystem                                                        | 3    | ACTIVE                                                                  |
| 248 | [docs/audits/RESULTS_INDEX.md](docs/audits/RESULTS_INDEX.md)                                                                                                                               | Audit Results Index                                                    | 3    | ACTIVE                                                                  |
| 249 | [docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md](docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md)                             | AI Optimization Audit — Summary Report                                 | 3    | DRAFT                                                                   |
| 250 | [docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md](docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md)                                           | AI Optimization Audit — Summary Report                                 | 3    | DRAFT                                                                   |
| 251 | [docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md](docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md) | AI Optimization Audit Report \(2026-02-14\)                            | 3    | ACTIVE                                                                  |
| 252 | [docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md](docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md)                         | AI Optimization Audit — Review Decisions                               | 3    | ACTIVE                                                                  |
| 253 | [docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md](docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md)                           | Automation Audit Report — 2026-02-09                                   | 3    | ACTIVE                                                                  |
| 254 | [docs/audits/system-test/audit-2026-02-19/PLAN_INDEX.md](docs/audits/system-test/audit-2026-02-19/PLAN_INDEX.md)                                                                           | System Test Plan Index — audit-2026-02-19                              | 3    | ACTIVE                                                                  |
| 255 | [docs/audits/system-test/audit-2026-02-19/REVIEW_DECISIONS.md](docs/audits/system-test/audit-2026-02-19/REVIEW_DECISIONS.md)                                                               | Review Decisions — System Test 2026-02-19                              | 3    | COMPLETE                                                                |
| 256 | [docs/decisions/README.md](docs/decisions/README.md)                                                                                                                                       | Architecture Decision Records \(ADRs\)                                 | 4    | -                                                                       |
| 257 | [docs/decisions/TEMPLATE.md](docs/decisions/TEMPLATE.md)                                                                                                                                   | ADR-NNN: \[Short Title\]                                               | 4    | Proposed \| Accepted \| Deprecated \| Superseded by \[ADR-XXX\]         |
| 258 | [docs/DOCUMENT_DEPENDENCIES.md](docs/DOCUMENT_DEPENDENCIES.md)                                                                                                                             | Document Dependencies                                                  | 4    | ACTIVE **Purpose:** Track template-instance relationships,              |
| 259 | [docs/DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md)                                                                                                                         | SoNash Documentation Standards                                         | 2    | -                                                                       |
| 260 | [docs/FIREBASE_CHANGE_POLICY.md](docs/FIREBASE_CHANGE_POLICY.md)                                                                                                                           | Firebase Change Policy                                                 | 2    | ACTIVE                                                                  |
| 261 | [docs/GLOBAL_SECURITY_STANDARDS.md](docs/GLOBAL_SECURITY_STANDARDS.md)                                                                                                                     | Global Security Standards                                              | 2    | ACTIVE **Authority:** MANDATORY for all code changes \*\*Last           |
| 262 | [docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md)                                                                                                                                     | Incident Response Runbook                                              | 4    | Active **Last Updated:** 2026-01-03                                     |
| 263 | [docs/LEARNING_METRICS.md](docs/LEARNING_METRICS.md)                                                                                                                                       | Learning Effectiveness Metrics                                         | 3    | -                                                                       |
| 264 | [docs/LIGHTHOUSE_INTEGRATION_PLAN.md](docs/LIGHTHOUSE_INTEGRATION_PLAN.md)                                                                                                                 | Lighthouse Integration Plan                                            | 3    | ACTIVE \(Part of Operational Visibility Sprint\) **Priority:** P0       |
| 265 | [docs/MCP_SETUP.md](docs/MCP_SETUP.md)                                                                                                                                                     | MCP Server Setup Guide                                                 | 2    | ACTIVE                                                                  |
| 266 | [docs/MONETIZATION_RESEARCH.md](docs/MONETIZATION_RESEARCH.md)                                                                                                                             | Monetization Strategy Research Initiative                              | 3    | -                                                                       |
| 267 | [docs/OPERATIONAL_VISIBILITY_SPRINT.md](docs/OPERATIONAL_VISIBILITY_SPRINT.md)                                                                                                             | Operational Visibility Sprint                                          | 3    | ACTIVE                                                                  |
| 268 | [docs/patterns/context-preservation-pattern.md](docs/patterns/context-preservation-pattern.md)                                                                                             | Context Preservation Pattern                                           | 4    | -                                                                       |
| 269 | [docs/plans/2026-02-21-sprint-workflow-skill-design.md](docs/plans/2026-02-21-sprint-workflow-skill-design.md)                                                                             | Sprint Workflow Skill Design                                           | 3    | APPROVED                                                                |
| 270 | [docs/plans/TESTING_INFRASTRUCTURE_PLAN.md](docs/plans/TESTING_INFRASTRUCTURE_PLAN.md)                                                                                                     | Testing Infrastructure Plan                                            | 3    | ACTIVE **Priority:** P1 **Related:**                                    |
| 271 | [docs/plans/TESTING_USER_MANUAL.md](docs/plans/TESTING_USER_MANUAL.md)                                                                                                                     | SoNash Testing User Manual                                             | 3    | ACTIVE                                                                  |
| 272 | [docs/plans/TRACK_A_TESTING_PLAN.md](docs/plans/TRACK_A_TESTING_PLAN.md)                                                                                                                   | Track A Admin Panel Testing Plan                                       | 3    | Active                                                                  |
| 273 | [docs/PR_WORKFLOW_CHECKLIST.md](docs/PR_WORKFLOW_CHECKLIST.md)                                                                                                                             | PR Workflow Checklist - MANDATORY FOR ALL PHASES                       | 4    | -                                                                       |
| 274 | [docs/README.md](docs/README.md)                                                                                                                                                           | Documentation Inventory                                                | 4    | ACTIVE                                                                  |
| 275 | [docs/RECAPTCHA_REMOVAL_GUIDE.md](docs/RECAPTCHA_REMOVAL_GUIDE.md)                                                                                                                         | reCAPTCHA &amp; App Check - Complete Removal and Fresh Setup Guide     | 2    | Deferred - App Check blocking critical functionality **Target:** Future |
| 276 | [docs/REVIEW_POLICY_ARCHITECTURE.md](docs/REVIEW_POLICY_ARCHITECTURE.md)                                                                                                                   | Review Policy Architecture                                             | 4    | PARTIALLY IMPLEMENTED **Authority:** MANDATORY for all development      |
| 277 | [docs/REVIEW_POLICY_INDEX.md](docs/REVIEW_POLICY_INDEX.md)                                                                                                                                 | Review Policy Index                                                    | 4    | Active **Implementation Status:** Partially implemented **Purpose:**    |
| 278 | [docs/REVIEW_POLICY_QUICK_REF.md](docs/REVIEW_POLICY_QUICK_REF.md)                                                                                                                         | Review Policy Quick Reference                                          | 4    | -                                                                       |
| 279 | [docs/REVIEW_POLICY_VISUAL_GUIDE.md](docs/REVIEW_POLICY_VISUAL_GUIDE.md)                                                                                                                   | Review Policy Visual Guide                                             | 4    | -                                                                       |
| 280 | [docs/SECURITY.md](docs/SECURITY.md)                                                                                                                                                       | Security &amp; Privacy Guide                                           | 2    | ACTIVE **Last Updated:** 2026-01-05                                     |
| 281 | [docs/SENTRY_INTEGRATION_GUIDE.md](docs/SENTRY_INTEGRATION_GUIDE.md)                                                                                                                       | Sentry Integration Guide for SoNash Admin Panel                        | 2    | Active **Last Updated:**                                                |
| 282 | [docs/SERVER_SIDE_SECURITY.md](docs/SERVER_SIDE_SECURITY.md)                                                                                                                               | Server-Side Security Implementation Guide                              | 2    | 🟡 RECOMMENDED BEFORE PUBLIC                                            |
| 283 | [docs/SESSION_DECISIONS.md](docs/SESSION_DECISIONS.md)                                                                                                                                     | Session Decision Log                                                   | 4    | -                                                                       |
| 284 | [docs/SESSION_HISTORY.md](docs/SESSION_HISTORY.md)                                                                                                                                         | Session History Log                                                    | 4    | ACTIVE                                                                  |
| 285 | [docs/SLASH_COMMANDS_REFERENCE.md](docs/SLASH_COMMANDS_REFERENCE.md)                                                                                                                       | Slash Commands &amp; Skills Reference                                  | 4    | ACTIVE                                                                  |
| 286 | [docs/SONARCLOUD_CLEANUP_RUNBOOK.md](docs/SONARCLOUD_CLEANUP_RUNBOOK.md)                                                                                                                   | SonarCloud Cleanup Sprint Runbook                                      | 2    | -                                                                       |
| 287 | [docs/technical-debt/FINAL_SYSTEM_AUDIT.md](docs/technical-debt/FINAL_SYSTEM_AUDIT.md)                                                                                                     | TDMS Final System Audit                                                | 3    | ACTIVE                                                                  |
| 288 | [docs/technical-debt/GRAND_PLAN_V2.md](docs/technical-debt/GRAND_PLAN_V2.md)                                                                                                               | Grand Plan V2: Technical Debt Elimination                              | 3    | ACTIVE                                                                  |
| 289 | [docs/technical-debt/INDEX.md](docs/technical-debt/INDEX.md)                                                                                                                               | Technical Debt Index                                                   | 3    | ACTIVE                                                                  |
| 290 | [docs/technical-debt/METRICS.md](docs/technical-debt/METRICS.md)                                                                                                                           | Technical Debt Metrics                                                 | 3    | ACTIVE                                                                  |
| 291 | [docs/technical-debt/PROCEDURE.md](docs/technical-debt/PROCEDURE.md)                                                                                                                       | Technical Debt Management System - Procedure Guide                     | 3    | ACTIVE                                                                  |
| 292 | [docs/technical-debt/views/by-category.md](docs/technical-debt/views/by-category.md)                                                                                                       | Technical Debt by Category                                             | 4    | ACTIVE                                                                  |
| 293 | [docs/technical-debt/views/by-severity.md](docs/technical-debt/views/by-severity.md)                                                                                                       | Technical Debt by Severity                                             | 4    | ACTIVE                                                                  |
| 294 | [docs/technical-debt/views/by-status.md](docs/technical-debt/views/by-status.md)                                                                                                           | Technical Debt by Status                                               | 4    | ACTIVE                                                                  |
| 295 | [docs/technical-debt/views/unplaced-items.md](docs/technical-debt/views/unplaced-items.md)                                                                                                 | Unplaced Technical Debt Items                                          | 4    | ACTIVE                                                                  |
| 296 | [docs/technical-debt/views/verification-queue.md](docs/technical-debt/views/verification-queue.md)                                                                                         | Verification Queue                                                     | 4    | ACTIVE                                                                  |
| 297 | [docs/templates/CANON_QUICK_REFERENCE.md](docs/templates/CANON_QUICK_REFERENCE.md)                                                                                                         | CANON Quick Reference Card                                             | 3    | -                                                                       |
| 298 | [docs/templates/CANONICAL_DOC_TEMPLATE.md](docs/templates/CANONICAL_DOC_TEMPLATE.md)                                                                                                       | \[Document Title\]                                                     | 3    | -                                                                       |
| 299 | [docs/templates/FOUNDATION_DOC_TEMPLATE.md](docs/templates/FOUNDATION_DOC_TEMPLATE.md)                                                                                                     | \[Document Title\]                                                     | 3    | -                                                                       |
| 300 | [docs/templates/GUIDE_DOC_TEMPLATE.md](docs/templates/GUIDE_DOC_TEMPLATE.md)                                                                                                               | How to \[Accomplish Task\]                                             | 3    | -                                                                       |
| 301 | [docs/templates/JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md)                                                                                                         | Multi-AI Review JSONL Schema Standard                                  | 3    | -                                                                       |
| 302 | [docs/templates/PLANNING_DOC_TEMPLATE.md](docs/templates/PLANNING_DOC_TEMPLATE.md)                                                                                                         | \[Feature/Initiative Name\] Plan                                       | 3    | -                                                                       |
| 303 | [docs/templates/REFERENCE_DOC_TEMPLATE.md](docs/templates/REFERENCE_DOC_TEMPLATE.md)                                                                                                       | \[Workflow/Reference Name\]                                            | 3    | -                                                                       |
| 304 | [docs/TESTING_PLAN.md](docs/TESTING_PLAN.md)                                                                                                                                               | Testing Plan                                                           | 3    | Active **Last Updated:** 2026-01-20                                     |
| 305 | [docs/TRIGGERS.md](docs/TRIGGERS.md)                                                                                                                                                       | TRIGGERS.md - Automation &amp; Enforcement Reference                   | 4    | DRAFT \| ACTIVE \| DEPRECATED                                           |
| 306 | [README.md](README.md)                                                                                                                                                                     | SoNash - Sober Nashville Recovery Notebook                             | 1    | ACTIVE **Last Updated:** 2026-02-23                                     |
| 307 | [ROADMAP_FUTURE.md](ROADMAP_FUTURE.md)                                                                                                                                                     | SoNash Future Roadmap                                                  | 1    | ACTIVE                                                                  |
| 308 | [ROADMAP_LOG.md](ROADMAP_LOG.md)                                                                                                                                                           | SoNash Roadmap Log                                                     | 1    | ACTIVE \(append-only archive\) \*\*Last                                 |
| 309 | [ROADMAP.md](ROADMAP.md)                                                                                                                                                                   | SoNash Product Roadmap                                                 | 1    | ACTIVE                                                                  |
| 310 | [scripts/README.md](scripts/README.md)                                                                                                                                                     | Scripts Reference                                                      | 4    | -                                                                       |
| 311 | [SESSION_CONTEXT.md](SESSION_CONTEXT.md)                                                                                                                                                   | Session Context                                                        | 4    | -                                                                       |
| 312 | [src/dataconnect-generated/.guides/setup.md](src/dataconnect-generated/.guides/setup.md)                                                                                                   | Setup                                                                  | 4    | -                                                                       |
| 313 | [src/dataconnect-generated/.guides/usage.md](src/dataconnect-generated/.guides/usage.md)                                                                                                   | Basic Usage                                                            | 4    | -                                                                       |
| 314 | [src/dataconnect-generated/react/README.md](src/dataconnect-generated/react/README.md)                                                                                                     | Generated React README                                                 | 4    | -                                                                       |
| 315 | [src/dataconnect-generated/README.md](src/dataconnect-generated/README.md)                                                                                                                 | Generated TypeScript README                                            | 4    | -                                                                       |

</details>

---

## Archived Documents

_Historical and completed documentation. These documents are preserved for
reference but not actively tracked in the reference graph._

<details>
<summary>Click to expand archived documents list</summary>

| #   | Path                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [docs/archive/2025-dec-reports/AGGREGATED_6MODEL_REPORT.md](docs/archive/2025-dec-reports/AGGREGATED_6MODEL_REPORT.md)                                                                                                                       |
| 2   | [docs/archive/2025-dec-reports/APP_CHECK_DIAGNOSIS.md](docs/archive/2025-dec-reports/APP_CHECK_DIAGNOSIS.md)                                                                                                                                 |
| 3   | [docs/archive/2025-dec-reports/ARCHITECTURAL_REFACTOR.md](docs/archive/2025-dec-reports/ARCHITECTURAL_REFACTOR.md)                                                                                                                           |
| 4   | [docs/archive/2025-dec-reports/ARCHITECTURE_IMPROVEMENT_PLAN.md](docs/archive/2025-dec-reports/ARCHITECTURE_IMPROVEMENT_PLAN.md)                                                                                                             |
| 5   | [docs/archive/2025-dec-reports/BILLING_ALERTS_SETUP.md](docs/archive/2025-dec-reports/BILLING_ALERTS_SETUP.md)                                                                                                                               |
| 6   | [docs/archive/2025-dec-reports/CODE_ANALYSIS_REPORT.md](docs/archive/2025-dec-reports/CODE_ANALYSIS_REPORT.md)                                                                                                                               |
| 7   | [docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md](docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md)                                                                                                                   |
| 8   | [docs/archive/2025-dec-reports/DEPENDENCY_ANALYSIS.md](docs/archive/2025-dec-reports/DEPENDENCY_ANALYSIS.md)                                                                                                                                 |
| 9   | [docs/archive/2025-dec-reports/ESLINT_WARNINGS_PLAN.md](docs/archive/2025-dec-reports/ESLINT_WARNINGS_PLAN.md)                                                                                                                               |
| 10  | [docs/archive/2025-dec-reports/JOURNAL_SYSTEM_UPDATE.md](docs/archive/2025-dec-reports/JOURNAL_SYSTEM_UPDATE.md)                                                                                                                             |
| 11  | [docs/archive/2025-dec-reports/LIBRARY_ANALYSIS.md](docs/archive/2025-dec-reports/LIBRARY_ANALYSIS.md)                                                                                                                                       |
| 12  | [docs/archive/2025-dec-reports/REFACTORING_ACTION_PLAN.md](docs/archive/2025-dec-reports/REFACTORING_ACTION_PLAN.md)                                                                                                                         |
| 13  | [docs/archive/2025-dec-reports/REFACTOR_SUMMARY.md](docs/archive/2025-dec-reports/REFACTOR_SUMMARY.md)                                                                                                                                       |
| 14  | [docs/archive/2025-dec-reports/ROADMAP_COMPARISON_ANALYSIS.md](docs/archive/2025-dec-reports/ROADMAP_COMPARISON_ANALYSIS.md)                                                                                                                 |
| 15  | [docs/archive/2025-dec-reports/ROADMAP_INTEGRATION_SUMMARY.md](docs/archive/2025-dec-reports/ROADMAP_INTEGRATION_SUMMARY.md)                                                                                                                 |
| 16  | [docs/archive/2025-dec-reports/ULTRA_THINKING_REVIEW.md](docs/archive/2025-dec-reports/ULTRA_THINKING_REVIEW.md)                                                                                                                             |
| 17  | [docs/archive/2025-dec-reports/XSS_PROTECTION_VERIFICATION.md](docs/archive/2025-dec-reports/XSS_PROTECTION_VERIFICATION.md)                                                                                                                 |
| 18  | [docs/archive/2026-jan-deprecated/ANTIGRAVITY_GUIDE.md](docs/archive/2026-jan-deprecated/ANTIGRAVITY_GUIDE.md)                                                                                                                               |
| 19  | [docs/archive/2026-jan-deprecated/ARCHIVE_NOTE.md](docs/archive/2026-jan-deprecated/ARCHIVE_NOTE.md)                                                                                                                                         |
| 20  | [docs/archive/2026-jan-deprecated/CUSTOM_SLASH_COMMANDS_GUIDE.md](docs/archive/2026-jan-deprecated/CUSTOM_SLASH_COMMANDS_GUIDE.md)                                                                                                           |
| 21  | [docs/archive/2026-jan-deprecated/PR_REVIEW_PROMPT_TEMPLATE.md](docs/archive/2026-jan-deprecated/PR_REVIEW_PROMPT_TEMPLATE.md)                                                                                                               |
| 22  | [docs/archive/2026-jan-deprecated/ROADMAP_INTEGRATION.md](docs/archive/2026-jan-deprecated/ROADMAP_INTEGRATION.md)                                                                                                                           |
| 23  | [docs/archive/2026-jan-deprecated/SLASH_COMMANDS.md](docs/archive/2026-jan-deprecated/SLASH_COMMANDS.md)                                                                                                                                     |
| 24  | [docs/archive/2026-jan-deprecated/brainstorm/PR_REVIEW_IMPROVEMENT_OPTIONS.md](docs/archive/2026-jan-deprecated/brainstorm/PR_REVIEW_IMPROVEMENT_OPTIONS.md)                                                                                 |
| 25  | [docs/archive/2026-jan-deprecated/brainstorm/REVIEW_POLICY_EXPANSION_DRAFT.md](docs/archive/2026-jan-deprecated/brainstorm/REVIEW_POLICY_EXPANSION_DRAFT.md)                                                                                 |
| 26  | [docs/archive/AI_HANDOFF-2026-01-02.md](docs/archive/AI_HANDOFF-2026-01-02.md)                                                                                                                                                               |
| 27  | [docs/archive/AI_STANDARDIZED_REPORT.md](docs/archive/AI_STANDARDIZED_REPORT.md)                                                                                                                                                             |
| 28  | [docs/archive/APPCHECK_FRESH_SETUP.md](docs/archive/APPCHECK_FRESH_SETUP.md)                                                                                                                                                                 |
| 29  | [docs/archive/ARCHIVE_INDEX.md](docs/archive/ARCHIVE_INDEX.md)                                                                                                                                                                               |
| 30  | [docs/archive/ChatGPT_Multi_AI_Refactoring_Plan_Chat.md](docs/archive/ChatGPT_Multi_AI_Refactoring_Plan_Chat.md)                                                                                                                             |
| 31  | [docs/archive/EXPANSION_EVALUATION_TRACKER.md](docs/archive/EXPANSION_EVALUATION_TRACKER.md)                                                                                                                                                 |
| 32  | [docs/archive/FEATURE_DECISIONS_ANSWERS.MD](docs/archive/FEATURE_DECISIONS_ANSWERS.MD)                                                                                                                                                       |
| 33  | [docs/archive/GitHub_Code_Analysis_and_Review_Prompt.md](docs/archive/GitHub_Code_Analysis_and_Review_Prompt.md)                                                                                                                             |
| 34  | [docs/archive/HOOKIFY_STRATEGY.md](docs/archive/HOOKIFY_STRATEGY.md)                                                                                                                                                                         |
| 35  | [docs/archive/IMPLEMENTATION_PROMPTS.md](docs/archive/IMPLEMENTATION_PROMPTS.md)                                                                                                                                                             |
| 36  | [docs/archive/MCP_SERVER_AUDIT.md](docs/archive/MCP_SERVER_AUDIT.md)                                                                                                                                                                         |
| 37  | [docs/archive/Monetization_Research_Phase1_Results.md](docs/archive/Monetization_Research_Phase1_Results.md)                                                                                                                                 |
| 38  | [docs/archive/PLAN_MAP.md](docs/archive/PLAN_MAP.md)                                                                                                                                                                                         |
| 39  | [docs/archive/RECAPTCHA_PROBLEM_SUMMARY.md](docs/archive/RECAPTCHA_PROBLEM_SUMMARY.md)                                                                                                                                                       |
| 40  | [docs/archive/REVIEWS_1-40.md](docs/archive/REVIEWS_1-40.md)                                                                                                                                                                                 |
| 41  | [docs/archive/REVIEWS_101-136.md](docs/archive/REVIEWS_101-136.md)                                                                                                                                                                           |
| 42  | [docs/archive/REVIEWS_137-179.md](docs/archive/REVIEWS_137-179.md)                                                                                                                                                                           |
| 43  | [docs/archive/REVIEWS_180-201.md](docs/archive/REVIEWS_180-201.md)                                                                                                                                                                           |
| 44  | [docs/archive/REVIEWS_202-212.md](docs/archive/REVIEWS_202-212.md)                                                                                                                                                                           |
| 45  | [docs/archive/REVIEWS_213-284.md](docs/archive/REVIEWS_213-284.md)                                                                                                                                                                           |
| 46  | [docs/archive/REVIEWS_285-346.md](docs/archive/REVIEWS_285-346.md)                                                                                                                                                                           |
| 47  | [docs/archive/REVIEWS_347-369.md](docs/archive/REVIEWS_347-369.md)                                                                                                                                                                           |
| 48  | [docs/archive/REVIEWS_354-357.md](docs/archive/REVIEWS_354-357.md)                                                                                                                                                                           |
| 49  | [docs/archive/REVIEWS_358-388.md](docs/archive/REVIEWS_358-388.md)                                                                                                                                                                           |
| 50  | [docs/archive/REVIEWS_385-393.md](docs/archive/REVIEWS_385-393.md)                                                                                                                                                                           |
| 51  | [docs/archive/REVIEWS_42-60.md](docs/archive/REVIEWS_42-60.md)                                                                                                                                                                               |
| 52  | [docs/archive/REVIEWS_61-100.md](docs/archive/REVIEWS_61-100.md)                                                                                                                                                                             |
| 53  | [docs/archive/Refactoring_PR_Plan.md](docs/archive/Refactoring_PR_Plan.md)                                                                                                                                                                   |
| 54  | [docs/archive/SUPABASE_MIGRATION_ANALYSIS.md](docs/archive/SUPABASE_MIGRATION_ANALYSIS.md)                                                                                                                                                   |
| 55  | [docs/archive/SoNash_Code_Review_Consolidated**v1_0**2025-12-23.md](docs/archive/SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md)                                                                                                       |
| 56  | [docs/archive/SoNash_Technical_Ideation_Multi_AI 1.20.26.md](docs/archive/SoNash_Technical_Ideation_Multi_AI%201.20.26.md)                                                                                                                   |
| 57  | [docs/archive/SoNash**AdminPanelEnhancement**v1_0\_\_2024-12-22.md](docs/archive/SoNash__AdminPanelEnhancement__v1_0__2024-12-22.md)                                                                                                         |
| 58  | [docs/archive/SoNash**AdminPanelEnhancement**v1_1\_\_2025-12-22.md](docs/archive/SoNash__AdminPanelEnhancement__v1_1__2025-12-22.md)                                                                                                         |
| 59  | [docs/archive/SoNash**AdminPanelEnhancement**v1_2\_\_2025-12-22.md](docs/archive/SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)                                                                                                         |
| 60  | [docs/archive/SoNash**Phase1_ClaudeCode_Prompt**2025-12-22.md](docs/archive/SoNash__Phase1_ClaudeCode_Prompt__2025-12-22.md)                                                                                                                 |
| 61  | [docs/archive/SoNash**Phase1_ClaudeCode_Prompt**v1_2\_\_2025-12-22.md](docs/archive/SoNash__Phase1_ClaudeCode_Prompt__v1_2__2025-12-22.md)                                                                                                   |
| 62  | [docs/archive/SoNash**Phase1_ClaudeCode_Prompt**v1_3\_\_2025-12-22.md](docs/archive/SoNash__Phase1_ClaudeCode_Prompt__v1_3__2025-12-22.md)                                                                                                   |
| 63  | [docs/archive/TESTING_CHECKLIST.md](docs/archive/TESTING_CHECKLIST.md)                                                                                                                                                                       |
| 64  | [docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_ANALYSIS.md](docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_ANALYSIS.md)                                                                                           |
| 65  | [docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_REFERENCE.md](docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_REFERENCE.md)                                                                                         |
| 66  | [docs/archive/completed-decisions/ADR-001-integrated-improvement-plan-approach.md](docs/archive/completed-decisions/ADR-001-integrated-improvement-plan-approach.md)                                                                         |
| 67  | [docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md](docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md)                                                                                                     |
| 68  | [docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md](docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md)                                                                                                                       |
| 69  | [docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md](docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md)                                                                                                                   |
| 70  | [docs/archive/completed-plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md](docs/archive/completed-plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md)                                                                                               |
| 71  | [docs/archive/completed-plans/TRACK_A_TESTING_CHECKLIST.md](docs/archive/completed-plans/TRACK_A_TESTING_CHECKLIST.md)                                                                                                                       |
| 72  | [docs/archive/completed-plans/sonarcloud-cleanup-sprint.md](docs/archive/completed-plans/sonarcloud-cleanup-sprint.md)                                                                                                                       |
| 73  | [docs/archive/consolidated-2025-12-19/AI_HANDOFF.md](docs/archive/consolidated-2025-12-19/AI_HANDOFF.md)                                                                                                                                     |
| 74  | [docs/archive/consolidated-2025-12-19/AI_HANDOFF_2024-12-19.md](docs/archive/consolidated-2025-12-19/AI_HANDOFF_2024-12-19.md)                                                                                                               |
| 75  | [docs/archive/consolidated-2025-12-19/ARCHIVE_INDEX.md](docs/archive/consolidated-2025-12-19/ARCHIVE_INDEX.md)                                                                                                                               |
| 76  | [docs/archive/consolidated-2025-12-19/FEATURE_DECISIONS.md](docs/archive/consolidated-2025-12-19/FEATURE_DECISIONS.md)                                                                                                                       |
| 77  | [docs/archive/consolidated-2025-12-19/JOURNAL_SYSTEM_PROPOSAL.md](docs/archive/consolidated-2025-12-19/JOURNAL_SYSTEM_PROPOSAL.md)                                                                                                           |
| 78  | [docs/archive/consolidated-2025-12-19/PROJECT_STATUS.md](docs/archive/consolidated-2025-12-19/PROJECT_STATUS.md)                                                                                                                             |
| 79  | [docs/archive/consolidated-2025-12-19/ROADMAP_V3.md](docs/archive/consolidated-2025-12-19/ROADMAP_V3.md)                                                                                                                                     |
| 80  | [docs/archive/consolidated-2025-12-19/UNIFIED_JOURNAL_ARCHITECTURE.md](docs/archive/consolidated-2025-12-19/UNIFIED_JOURNAL_ARCHITECTURE.md)                                                                                                 |
| 81  | [docs/archive/consolidated-2025-12-19/WEB_ENHANCEMENTS_ROADMAP.md](docs/archive/consolidated-2025-12-19/WEB_ENHANCEMENTS_ROADMAP.md)                                                                                                         |
| 82  | [docs/archive/expansion-ideation/README.md](docs/archive/expansion-ideation/README.md)                                                                                                                                                       |
| 83  | [docs/archive/expansion-ideation/SoNash Expansion - Module 1 - Step Work Depth.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%201%20-%20Step%20Work%20Depth.md)                                                         |
| 84  | [docs/archive/expansion-ideation/SoNash Expansion - Module 10 – Safety &amp; Harm Reduction.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%2010%20%E2%80%93%20Safety%20&%20Harm%20Reduction.md)                         |
| 85  | [docs/archive/expansion-ideation/SoNash Expansion - Module 11 – Visionary - Dream Big Bets.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%2011%20%E2%80%93%20Visionary%20-%20Dream%20Big%20Bets.md)                     |
| 86  | [docs/archive/expansion-ideation/SoNash Expansion - Module 2 – Sponsor Tooling &amp; Connection.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%202%20%E2%80%93%20Sponsor%20Tooling%20&%20Connection.md)                 |
| 87  | [docs/archive/expansion-ideation/SoNash Expansion - Module 3 – Nashville Advantage \(Local Utility\).md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%203%20%E2%80%93%20Nashville%20Advantage%20%28Local%20Utility%29.md) |
| 88  | [docs/archive/expansion-ideation/SoNash Expansion - Module 4 – Offline, Privacy &amp; Trust.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%204%20%E2%80%93%20Offline,%20Privacy%20&%20Trust.md)                         |
| 89  | [docs/archive/expansion-ideation/SoNash Expansion - Module 5 – Journaling &amp; Insights.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%205%20%E2%80%93%20Journaling%20&%20Insights.md)                                 |
| 90  | [docs/archive/expansion-ideation/SoNash Expansion - Module 6 – Recovery Knowledge Base.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%206%20%E2%80%93%20Recovery%20Knowledge%20Base.md)                                 |
| 91  | [docs/archive/expansion-ideation/SoNash Expansion - Module 7 – Exports &amp; Reports.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%207%20%E2%80%93%20Exports%20&%20Reports.md)                                         |
| 92  | [docs/archive/expansion-ideation/SoNash Expansion - Module 8 – Personalization.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%208%20%E2%80%93%20Personalization.md)                                                     |
| 93  | [docs/archive/expansion-ideation/SoNash Expansion - Module 9 – Daily Engagement &amp; Habits.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%209%20%E2%80%93%20Daily%20Engagement%20&%20Habits.md)                       |
| 94  | [docs/archive/expansion-ideation/SoNash Expansion - Modules 12-14 The Final Gaps.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Modules%2012-14%20The%20Final%20Gaps.md)                                                       |
| 95  | [docs/archive/expansion-ideation/SoNash Expansion - Technical Modules.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Technical%20Modules.md)                                                                                   |
| 96  | [docs/archive/expansion-ideation/SoNash Expansion Full Ideation All Modules 1.20.26.md](docs/archive/expansion-ideation/SoNash%20Expansion%20Full%20Ideation%20All%20Modules%201.20.26.md)                                                   |
| 97  | [docs/archive/firestore-rules.md](docs/archive/firestore-rules.md)                                                                                                                                                                           |
| 98  | [docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-16.md](docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-16.md)                                                                                                                             |
| 99  | [docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-17.md](docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-17.md)                                                                                                                             |
| 100 | [docs/archive/handoffs-2025-12/AI_HANDOFF_2025_12_15.md](docs/archive/handoffs-2025-12/AI_HANDOFF_2025_12_15.md)                                                                                                                             |
| 101 | [docs/archive/handoffs-2025-12/HANDOFF-2025-12-17.md](docs/archive/handoffs-2025-12/HANDOFF-2025-12-17.md)                                                                                                                                   |
| 102 | [docs/archive/legacy_task_list_2025_12_12.md](docs/archive/legacy_task_list_2025_12_12.md)                                                                                                                                                   |
| 103 | [docs/archive/local-resources-review.md](docs/archive/local-resources-review.md)                                                                                                                                                             |
| 104 | [docs/archive/superseded-plans/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md](docs/archive/superseded-plans/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md)                                                                                                 |
| 105 | [docs/archive/superseded-plans/M1.6_SUPPORT_TAB_PLAN.md](docs/archive/superseded-plans/M1.6_SUPPORT_TAB_PLAN.md)                                                                                                                             |

</details>

---

## Version History

| Version | Date       | Changes                           |
| ------- | ---------- | --------------------------------- |
| Auto    | 2026-02-28 | Auto-generated from codebase scan |

---

_Generated by `scripts/generate-documentation-index.js`_
