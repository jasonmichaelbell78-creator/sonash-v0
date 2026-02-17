# Documentation Index

> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to
> regenerate.

**Generated:** 2026-02-17 **Active Documents:** 267 **Archived Documents:** 100

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
| Tier 2 | 12    | Foundation        |
| Tier 3 | 158   | Planning & Active |
| Tier 4 | 93    | Reference         |
| Tier 5 | 0     | Guides            |

### By Category

| Category                       | Count |
| ------------------------------ | ----- |
| Skills                         | 108   |
| Core Documentation             | 30    |
| .claude > agents               | 24    |
| analysis                       | 15    |
| .claude > agents > global      | 11    |
| Audit Templates                | 11    |
| Root Documents                 | 9     |
| Templates                      | 7     |
| .claude > plans                | 6     |
| Agent Documentation            | 6     |
| Audit Reports                  | 6     |
| .claude                        | 5     |
| Technical Debt Views           | 5     |
| AI Optimization Audit          | 4     |
| Technical Debt System          | 4     |
| .github                        | 3     |
| Plans                          | 3     |
| Multi-AI Audit System          | 2     |
| Decisions                      | 2     |
| .agent > workflows             | 1     |
| .agents > skills > find-skills | 1     |
| Slash Commands                 | 1     |
| consolidation-output           | 1     |
| Patterns                       | 1     |
| scripts                        | 1     |

---

## Documents by Category

### Root Documents (Tier 1)

_Essential project-level documentation_

| Document                                                | Description                                                      | References | Last Modified |
| ------------------------------------------------------- | ---------------------------------------------------------------- | ---------- | ------------- |
| [SoNash - Sober Nashville Recovery Notebook](README.md) | \_A privacy-first digital recovery journal for the recovery c... | ↓0 ↑15     | 2026-02-17    |
| [SoNash Future Roadmap](ROADMAP_FUTURE.md)              | Detailed specifications for future milestones (M2-M10). For      | ↓1 ↑4      | 2026-02-17    |
| [SoNash Product Roadmap](ROADMAP.md)                    | <!-- prettier-ignore-start -->                                   | ↓18 ↑18    | 2026-02-17    |
| [SoNash Roadmap Log](ROADMAP_LOG.md)                    | -                                                                | ↓4 ↑6      | 2026-02-17    |

### Core Documentation (Tier 2)

_Foundation technical reference_

| Document                                                                                          | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [App Check Setup Guide](docs/APPCHECK_SETUP.md)                                                   | This guide covers Firebase App Check configuration for the S... | ↓2 ↑1      | 2026-02-17    |
| [Firebase Change Policy](docs/FIREBASE_CHANGE_POLICY.md)                                          | This document defines the mandatory security review process ... | ↓2 ↑5      | 2026-02-17    |
| [Global Security Standards](docs/GLOBAL_SECURITY_STANDARDS.md)                                    | This document defines **mandatory security standards** that ... | ↓9 ↑0      | 2026-02-17    |
| [MCP Server Setup Guide](docs/MCP_SETUP.md)                                                       | This guide explains how to configure MCP (Model Context Prot... | ↓0 ↑0      | 2026-02-17    |
| [reCAPTCHA & App Check - Complete Removal and Fresh Setup Guide](docs/RECAPTCHA_REMOVAL_GUIDE.md) | Complete removal and fresh implementation guide for Firebase... | ↓1 ↑2      | 2026-02-17    |
| [Security & Privacy Guide](docs/SECURITY.md)                                                      | -                                                               | ↓12 ↑4     | 2026-02-17    |
| [Sentry Integration Guide for SoNash Admin Panel](docs/SENTRY_INTEGRATION_GUIDE.md)               | Step-by-step guide to integrate Sentry error tracking into t... | ↓1 ↑0      | 2026-02-17    |
| [Server-Side Security Implementation Guide](docs/SERVER_SIDE_SECURITY.md)                         | Verify requests come from your legitimate app, not bots or s... | ↓5 ↑2      | 2026-02-17    |
| [SonarCloud Cleanup Sprint Runbook](docs/SONARCLOUD_CLEANUP_RUNBOOK.md)                           | This runbook provides a repeatable process for SonarCloud an... | ↓1 ↑0      | 2026-02-17    |
| [SoNash Documentation Standards](docs/DOCUMENTATION_STANDARDS.md)                                 | -                                                               | ↓7 ↑4      | 2026-02-17    |

### Root Documents (Tier 2)

_Foundation_

| Document                                      | Description                                                  | References | Last Modified |
| --------------------------------------------- | ------------------------------------------------------------ | ---------- | ------------- |
| [Architecture Documentation](ARCHITECTURE.md) | -                                                            | ↓10 ↑6     | 2026-02-17    |
| [Development Guide](DEVELOPMENT.md)           | Unified dev dashboard for monitoring session activity, error | ↓11 ↑11    | 2026-02-17    |

### Agent Documentation (Tier 3)

_AI agent reference docs_

| Document                                                                            | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Agent Orchestration Reference](docs/agent_docs/AGENT_ORCHESTRATION.md)             | Detailed guidance for parallelizing agents, forming teams, a... | ↓1 ↑0      | 2026-02-17    |
| [Code Review Patterns Reference](docs/agent_docs/CODE_PATTERNS.md)                  | This document contains detailed code patterns and anti-patte... | ↓7 ↑2      | 2026-02-17    |
| [Context Preservation & Compaction Safety](docs/agent_docs/CONTEXT_PRESERVATION.md) | Detailed guidance for preventing loss of important decisions... | ↓1 ↑0      | 2026-02-17    |
| [Fix Templates for Qodo PR Review Findings](docs/agent_docs/FIX_TEMPLATES.md)       | Copy-paste fix templates for the top 30 most common Qodo PR ... | ↓1 ↑0      | 2026-02-17    |
| [Security Checklist for Scripts](docs/agent_docs/SECURITY_CHECKLIST.md)             | Use this checklist **BEFORE writing or reviewing** any scrip... | ↓1 ↑0      | 2026-02-17    |
| [Skill and Agent Usage Policy](docs/agent_docs/SKILL_AGENT_POLICY.md)               | This document defines the policy for creating, using, and ov... | ↓2 ↑3      | 2026-02-17    |

### AI Optimization Audit (Tier 3)

_AI token and workflow optimization_

| Document                                                                                                                                 | Description                                                     | References | Last Modified |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [AI Optimization Audit — Review Decisions](docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md)              | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md)                  | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md)                         | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [AI Optimization Audit Report (2026-02-14)](docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md) | Executive summary of the AI Optimization audit covering hook... | ↓0 ↑0      | 2026-02-17    |

### Audit Reports (Tier 3)

_Single-session and multi-AI audit outputs_

| Document                                                                                                               | Description                                                     | References | Last Modified |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Audit Ecosystem](docs/audits/README.md)                                                                               | <!-- prettier-ignore-start -->                                  | ↓1 ↑18     | 2026-02-17    |
| [Audit Results Index](docs/audits/RESULTS_INDEX.md)                                                                    | <!-- prettier-ignore-start -->                                  | ↓1 ↑0      | 2026-02-17    |
| [Audit Standards](docs/audits/AUDIT_STANDARDS.md)                                                                      | <What this audit checks and why>                                | ↓3 ↑2      | 2026-02-17    |
| [Audit Tracker](docs/audits/AUDIT_TRACKER.md)                                                                          | Track single-session and multi-AI audit completions for thre... | ↓3 ↑0      | 2026-02-17    |
| [Automation Audit Report — 2026-02-09](docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md) | - **Total findings:** 258                                       | ↓0 ↑0      | 2026-02-17    |
| [Implementation Plan: Audit Ecosystem Codification](docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md)                       | <!-- prettier-ignore-start -->                                  | ↓1 ↑2      | 2026-02-17    |

### Audit Templates (Tier 3)

_Multi-AI audit execution templates_

| Document                                                                                                                        | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [[Project Name] Multi-AI AI Optimization Audit Plan](docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md)                   | This document serves as the **execution plan** for running a... | ↓3 ↑1      | 2026-02-17    |
| [[Project Name] Multi-AI Code Review Plan](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)                                 | -                                                               | ↓6 ↑5      | 2026-02-17    |
| [[Project Name] Multi-AI Documentation Audit Plan](docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md)                       | This document serves as the **execution plan** for running a... | ↓4 ↑2      | 2026-02-17    |
| [[Project Name] Multi-AI Engineering Productivity Audit Plan](docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md) | This document serves as the **execution plan** for running a... | ↓4 ↑3      | 2026-02-17    |
| [[Project Name] Multi-AI Performance Audit Plan](docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md)                           | This document serves as the **execution plan** for running a... | ↓6 ↑4      | 2026-02-17    |
| [[Project Name] Multi-AI Process & Automation Audit Plan](docs/audits/multi-ai/templates/PROCESS_AUDIT.md)                      | -                                                               | ↓5 ↑2      | 2026-02-17    |
| [[Project Name] Multi-AI Refactoring Audit](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)                                | This document serves as the **execution plan** for running a... | ↓6 ↑5      | 2026-02-17    |
| [[Project Name] Multi-AI Security Audit Plan](docs/audits/multi-ai/templates/SECURITY_AUDIT.md)                                 | -                                                               | ↓5 ↑3      | 2026-02-17    |
| [Enhancement Audit Template (Multi-AI Injectable)](docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md)                         | -                                                               | ↓3 ↑8      | 2026-02-17    |
| [Multi-AI Audit Aggregator Template](docs/audits/multi-ai/templates/AGGREGATOR.md)                                              | Deduplicate and verify findings within ONE audit category be... | ↓5 ↑0      | 2026-02-17    |
| [Multi-AI Audit Shared Template Base](docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md)                                   | Shared boilerplate for                                          | ↓12 ↑2     | 2026-02-17    |

### Core Documentation (Tier 3)

_Planning & Active_

| Document                                                                                               | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------- | ------------- |
| [Admin Panel Security & Monitoring Requirements](docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md) | -                                                               | ↓3 ↑4      | 2026-02-17    |
| [Learning Effectiveness Metrics](docs/LEARNING_METRICS.md)                                             | This document tracks Claude's learning effectiveness - wheth... | ↓0 ↑0      | 2026-02-17    |
| [Lighthouse Integration Plan](docs/LIGHTHOUSE_INTEGRATION_PLAN.md)                                     | -                                                               | ↓2 ↑2      | 2026-02-17    |
| [Monetization Strategy Research Initiative](docs/MONETIZATION_RESEARCH.md)                             | -                                                               | ↓2 ↑1      | 2026-02-17    |
| [Operational Visibility Sprint](docs/OPERATIONAL_VISIBILITY_SPRINT.md)                                 | -                                                               | ↓2 ↑3      | 2026-02-17    |
| [Testing Plan](docs/TESTING_PLAN.md)                                                                   | Comprehensive testing guidance for the SoNash application, i... | ↓5 ↑1      | 2026-02-17    |

### Multi-AI Audit System (Tier 3)

_Multi-AI audit orchestration and coordination_

| Document                                                           | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------ | --------------------------------------------------------------- | ---------- | ------------- |
| [Multi-AI Audit System](docs/audits/multi-ai/README.md)            | Templates and processes for running audits across multiple A... | ↓2 ↑12     | 2026-02-17    |
| [Multi-AI Review Coordinator](docs/audits/multi-ai/COORDINATOR.md) | Master index and                                                | ↓12 ↑11    | 2026-02-17    |

### Plans (Tier 3)

_Active implementation plans_

| Document                                                                 | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------- | ------------- |
| [SoNash Testing User Manual](docs/plans/TESTING_USER_MANUAL.md)          | <!-- prettier-ignore-start -->                                  | ↓5 ↑0      | 2026-02-17    |
| [Testing Infrastructure Plan](docs/plans/TESTING_INFRASTRUCTURE_PLAN.md) | This document outlines a comprehensive testing infrastructur... | ↓1 ↑2      | 2026-02-17    |
| [Track A Admin Panel Testing Plan](docs/plans/TRACK_A_TESTING_PLAN.md)   | Comprehensive testing plan for Track A Admin Panel features ... | ↓1 ↑0      | 2026-02-17    |

### Skills (Tier 3)

_Claude Code skills_

| Document                                                                                                                            | Description                                                       | References | Last Modified |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------- |
| [/test-suite — Unified Testing Suite](.claude/skills/test-suite/SKILL.md)                                                           | Multi-phase UI testing orchestration for SoNash. Runs smoke ...   | ↓0 ↑0      | 2026-02-17    |
| [Academic Test: Systematic Debugging Skill](.claude/skills/systematic-debugging/test-academic.md)                                   | You have access to the systematic debugging skill at              | ↓0 ↑0      | 2026-02-17    |
| [Add Technical Debt](.claude/skills/add-debt/SKILL.md)                                                                              | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-17    |
| [Alerts — Intelligent Health Dashboard](.claude/skills/alerts/SKILL.md)                                                             | This skill provides an intelligent health dashboard that goe...   | ↓0 ↑0      | 2026-02-17    |
| [Api Design Patterns](.claude/skills/senior-backend/references/api_design_patterns.md)                                              | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Architecture Patterns](.claude/skills/senior-architect/references/architecture_patterns.md)                                        | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Architecture Patterns](.claude/skills/senior-fullstack/references/architecture_patterns.md)                                        | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Artifacts Builder](.claude/skills/artifacts-builder/SKILL.md)                                                                      | To build powerful frontend claude.ai artifacts, follow these...   | ↓0 ↑0      | 2026-02-17    |
| [Audit Aggregator Agent](.claude/skills/audit-aggregator/SKILL.md)                                                                  | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Audit System Health Check](.claude/skills/audit-health/SKILL.md)                                                                   | Quick meta-check that verifies the audit ecosystem is health...   | ↓0 ↑0      | 2026-02-17    |
| [Backend Security Practices](.claude/skills/senior-backend/references/backend_security_practices.md)                                | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Cicd Pipeline Guide](.claude/skills/senior-devops/references/cicd_pipeline_guide.md)                                               | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Code Review Checklist](.claude/skills/code-reviewer/references/code_review_checklist.md)                                           | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Code Reviewer](.claude/skills/code-reviewer/SKILL.md)                                                                              | Code review toolkit tailored for the SoNash codebase.             | ↓0 ↑0      | 2026-02-17    |
| [Coding Standards](.claude/skills/code-reviewer/references/coding_standards.md)                                                     | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Common Antipatterns](.claude/skills/code-reviewer/references/common_antipatterns.md)                                               | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Comprehensive Audit Recovery Procedures](.claude/skills/audit-comprehensive/reference/RECOVERY_PROCEDURES.md)                      | Persist critical environment variables across context compac...   | ↓2 ↑0      | 2026-02-17    |
| [Comprehensive Audit Triage Guide](.claude/skills/audit-comprehensive/reference/TRIAGE_GUIDE.md)                                    | Complete guide for triaging findings from the 9-domain compr...   | ↓1 ↑0      | 2026-02-17    |
| [Comprehensive Audit Wave Details](.claude/skills/audit-comprehensive/reference/WAVE_DETAILS.md)                                    | Core technical audits that form the foundation for all subse...   | ↓1 ↑1      | 2026-02-17    |
| [Comprehensive Automation Audit](.claude/skills/audit-process/SKILL.md)                                                             | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Comprehensive Multi-Domain Audit Orchestrator](.claude/skills/audit-comprehensive/SKILL.md)                                        | -                                                                 | ↓0 ↑6      | 2026-02-17    |
| [Condition-Based Waiting](.claude/skills/systematic-debugging/condition-based-waiting.md)                                           | Flaky tests often guess at timing with arbitrary delays. Thi...   | ↓0 ↑0      | 2026-02-17    |
| [Content Research Writer](.claude/skills/content-research-writer/SKILL.md)                                                          | This skill acts as your writing partner, helping you researc...   | ↓0 ↑0      | 2026-02-17    |
| [Create Audit Wizard](.claude/skills/create-audit/SKILL.md)                                                                         | <Description of when to use this template>                        | ↓0 ↑0      | 2026-02-17    |
| [Creation Log: Systematic Debugging Skill](.claude/skills/systematic-debugging/CREATION-LOG.md)                                     | Reference example of extracting, structuring, and bulletproo...   | ↓0 ↑0      | 2026-02-17    |
| [Data Analysis Patterns for Market Research](.claude/skills/market-research-reports/references/data_analysis_patterns.md)           | Templates and frameworks for conducting rigorous market anal...   | ↓0 ↑0      | 2026-02-17    |
| [Database Optimization Guide](.claude/skills/senior-backend/references/database_optimization_guide.md)                              | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Decrypt Secrets](.claude/skills/decrypt-secrets/SKILL.md)                                                                          | Decrypt your encrypted MCP tokens at the start of a remote s...   | ↓0 ↑0      | 2026-02-17    |
| [Deep Plan](.claude/skills/deep-plan/SKILL.md)                                                                                      | Eliminate assumptions before writing a single line of plan. ...   | ↓0 ↑0      | 2026-02-17    |
| [Defense-in-Depth Validation](.claude/skills/systematic-debugging/defense-in-depth.md)                                              | Reject obviously invalid input at API boundary                    | ↓0 ↑0      | 2026-02-17    |
| [Deployment Strategies](.claude/skills/senior-devops/references/deployment_strategies.md)                                           | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Developer Growth Analysis](.claude/skills/developer-growth-analysis/SKILL.md)                                                      | This skill provides personalized feedback on your recent cod...   | ↓0 ↑0      | 2026-02-17    |
| [Development Workflows](.claude/skills/senior-fullstack/references/development_workflows.md)                                        | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Documentation Maintenance](.claude/skills/docs-maintain/SKILL.md)                                                                  | Unified skill for checking doc sync and updating doc artifac...   | ↓0 ↑0      | 2026-02-17    |
| [Documentation Optimizer](.claude/skills/doc-optimizer/SKILL.md)                                                                    | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Enhancement Audit](.claude/skills/audit-enhancements/SKILL.md)                                                                     | Performs a comprehensive, multi-pass enhancement audit of th...   | ↓0 ↑0      | 2026-02-17    |
| [Excel Analysis](.claude/skills/excel-analysis/SKILL.md)                                                                            | Read Excel files with pandas:                                     | ↓0 ↑0      | 2026-02-17    |
| [File Format Support](.claude/skills/markitdown/references/file_formats.md)                                                         | This document provides detailed information about each file ...   | ↓0 ↑0      | 2026-02-17    |
| [Find Skills](.claude/skills/find-skills/SKILL.md)                                                                                  | This skill helps you discover and install skills and plugins...   | ↓0 ↑0      | 2026-02-17    |
| [Frontend Best Practices](.claude/skills/senior-frontend/references/frontend_best_practices.md)                                     | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Gh Pr Checks Plan Fix](.claude/skills/gh-fix-ci/SKILL.md)                                                                          | Use gh to locate failing PR checks, fetch GitHub Actions log...   | ↓0 ↑0      | 2026-02-17    |
| [Infrastructure As Code](.claude/skills/senior-devops/references/infrastructure_as_code.md)                                         | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Learning Capture (Step 7)](.claude/skills/pr-review/reference/LEARNING_CAPTURE.md)                                                 | Mandatory learning documentation after every PR review proce...   | ↓1 ↑0      | 2026-02-17    |
| [Market Research Report Formatting Guide](.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md)                        | Quick reference for using the `market_research.sty` style pa...   | ↓0 ↑0      | 2026-02-17    |
| [Market Research Report Structure Guide](.claude/skills/market-research-reports/references/report_structure_guide.md)               | Create a strong first impression and communicate report scop...   | ↓0 ↑0      | 2026-02-17    |
| [Market Research Reports](.claude/skills/market-research-reports/SKILL.md)                                                          | Market research reports are comprehensive strategic document...   | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown - File to Markdown Conversion](.claude/skills/markitdown/SKILL.md)                                                      | MarkItDown is a Python tool developed by Microsoft for conve...   | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown API Reference](.claude/skills/markitdown/references/api_reference.md)                                                   | The main class for converting files to Markdown.                  | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown Example Usage](.claude/skills/markitdown/assets/example_usage.md)                                                       | This document provides practical examples of using MarkItDow...   | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown Installation Guide](.claude/skills/markitdown/INSTALLATION_GUIDE.md)                                                    | - Python 3.10 or higher                                           | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown Quick Reference](.claude/skills/markitdown/QUICK_REFERENCE.md)                                                          | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown Skill](.claude/skills/markitdown/README.md)                                                                             | This skill provides comprehensive support for converting var...   | ↓0 ↑0      | 2026-02-17    |
| [MarkItDown Skill - Creation Summary](.claude/skills/markitdown/SKILL_SUMMARY.md)                                                   | A comprehensive skill for using Microsoft's MarkItDown tool ...   | ↓0 ↑0      | 2026-02-17    |
| [MCP Server Development Best Practices and Guidelines](.claude/skills/mcp-builder/reference/mcp_best_practices.md)                  | This document compiles essential best practices and guidelin...   | ↓1 ↑0      | 2026-02-17    |
| [MCP Server Development Guide](.claude/skills/mcp-builder/SKILL.md)                                                                 | To create high-quality MCP (Model Context Protocol) servers ...   | ↓0 ↑4      | 2026-02-17    |
| [MCP Server Evaluation Guide](.claude/skills/mcp-builder/reference/evaluation.md)                                                   | This document provides guidance on creating comprehensive ev...   | ↓1 ↑0      | 2026-02-17    |
| [Multi-AI Audit Orchestrator](.claude/skills/multi-ai-audit/SKILL.md)                                                               | Single-entry-point skill that orchestrates the entire multi-...   | ↓0 ↑2      | 2026-02-17    |
| [Nextjs Optimization Guide](.claude/skills/senior-frontend/references/nextjs_optimization_guide.md)                                 | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Node/TypeScript MCP Server Implementation Guide](.claude/skills/mcp-builder/reference/node_mcp_server.md)                          | This document provides Node/TypeScript-specific best practic...   | ↓1 ↑0      | 2026-02-17    |
| [OpenRouter Integration for MarkItDown](.claude/skills/markitdown/OPENROUTER_INTEGRATION.md)                                        | This MarkItDown skill has been configured to use \*\*OpenRoute... | ↓0 ↑0      | 2026-02-17    |
| [Parallel Agent Strategy (Steps 4.3-4.5)](.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md)                            | Detailed guidance for parallel agent execution when processi...   | ↓1 ↑0      | 2026-02-17    |
| [PR Code Review Processor](.claude/skills/pr-review/SKILL.md)                                                                       | You are about to process AI code review feedback. This is a ...   | ↓0 ↑4      | 2026-02-17    |
| [PR Review Retrospective](.claude/skills/pr-retro/SKILL.md)                                                                         | Analyze the review cycle for a completed (or ending) PR and ...   | ↓0 ↑0      | 2026-02-17    |
| [Pre-Commit Fixer](.claude/skills/pre-commit-fixer/SKILL.md)                                                                        | Eliminate the context-heavy fix-commit-retry loop that happe...   | ↓0 ↑0      | 2026-02-17    |
| [Pressure Test 1: Emergency Production Fix](.claude/skills/systematic-debugging/test-pressure-1.md)                                 | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Pressure Test 2: Sunk Cost + Exhaustion](.claude/skills/systematic-debugging/test-pressure-2.md)                                   | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Pressure Test 3: Authority + Social Pressure](.claude/skills/systematic-debugging/test-pressure-3.md)                              | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Python MCP Server Implementation Guide](.claude/skills/mcp-builder/reference/python_mcp_server.md)                                 | This document provides Python-specific best practices and ex...   | ↓1 ↑0      | 2026-02-17    |
| [Qa Best Practices](.claude/skills/senior-qa/references/qa_best_practices.md)                                                       | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [quick-fix Skill](.claude/skills/quick-fix/SKILL.md)                                                                                | Auto-suggest fixes for common pre-commit and pattern complia...   | ↓0 ↑0      | 2026-02-17    |
| [React Patterns](.claude/skills/senior-frontend/references/react_patterns.md)                                                       | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Root Cause Tracing](.claude/skills/systematic-debugging/root-cause-tracing.md)                                                     | Bugs often manifest deep in the call stack (git init in wron...   | ↓0 ↑0      | 2026-02-17    |
| [Senior Architect](.claude/skills/senior-architect/SKILL.md)                                                                        | Complete toolkit for senior architect with modern tools and ...   | ↓0 ↑0      | 2026-02-17    |
| [Senior Backend](.claude/skills/senior-backend/SKILL.md)                                                                            | Complete toolkit for senior backend with modern tools and be...   | ↓0 ↑0      | 2026-02-17    |
| [Senior Devops](.claude/skills/senior-devops/SKILL.md)                                                                              | Complete toolkit for senior devops with modern tools and bes...   | ↓0 ↑0      | 2026-02-17    |
| [Senior Frontend](.claude/skills/senior-frontend/SKILL.md)                                                                          | Complete toolkit for senior frontend with modern tools and b...   | ↓0 ↑0      | 2026-02-17    |
| [Senior Fullstack](.claude/skills/senior-fullstack/SKILL.md)                                                                        | Complete toolkit for senior fullstack with modern tools and ...   | ↓0 ↑0      | 2026-02-17    |
| [Senior Qa](.claude/skills/senior-qa/SKILL.md)                                                                                      | Complete toolkit for senior qa with modern tools and best pr...   | ↓0 ↑0      | 2026-02-17    |
| [Session Begin Checklist](.claude/skills/session-begin/SKILL.md)                                                                    | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Session Checkpoint](.claude/skills/checkpoint/SKILL.md)                                                                            | Save current state so you can recover after compaction or se...   | ↓0 ↑0      | 2026-02-17    |
| [Session End Checklist](.claude/skills/session-end/SKILL.md)                                                                        | Before ending the session, complete these steps:                  | ↓0 ↑0      | 2026-02-17    |
| [Single-Session AI Optimization Audit](.claude/skills/audit-ai-optimization/SKILL.md)                                               | <!-- prettier-ignore-start -->                                    | ↓0 ↑0      | 2026-02-17    |
| [Single-Session Code Review Audit](.claude/skills/audit-code/SKILL.md)                                                              | \| Condition \| Mode \| T...                                      | ↓0 ↑0      | 2026-02-17    |
| [Single-Session Documentation Audit](.claude/skills/audit-documentation/SKILL.md)                                                   | \| Condition \| Mode \| T...                                      | ↓0 ↑0      | 2026-02-17    |
| [Single-Session Engineering Productivity Audit](.claude/skills/audit-engineering-productivity/SKILL.md)                             | Evaluates developer experience (DX), debugging capabilities,...   | ↓0 ↑0      | 2026-02-17    |
| [Single-Session Performance Audit](.claude/skills/audit-performance/SKILL.md)                                                       | \| Condition \| Mode \| T...                                      | ↓0 ↑0      | 2026-02-17    |
| [Single-Session Refactoring Audit](.claude/skills/audit-refactoring/SKILL.md)                                                       | This audit identifies technical debt related to code structu...   | ↓0 ↑6      | 2026-02-17    |
| [Single-Session Security Audit](.claude/skills/audit-security/SKILL.md)                                                             | \| Condition \| Mode \| T...                                      | ↓0 ↑0      | 2026-02-17    |
| [SKILL](.claude/skills/frontend-design/SKILL.md)                                                                                    | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Skill Creator](.claude/skills/skill-creator/SKILL.md)                                                                              | This skill provides guidance for creating effective skills.       | ↓0 ↑1      | 2026-02-17    |
| [Skill Index](.claude/skills/SKILL_INDEX.md)                                                                                        | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [SonarCloud Enrichment (Step 1.5)](.claude/skills/pr-review/reference/SONARCLOUD_ENRICHMENT.md)                                     | When SonarCloud issues are detected in pasted feedback, auto...   | ↓1 ↑0      | 2026-02-17    |
| [SonarCloud Integration](.claude/skills/sonarcloud/SKILL.md)                                                                        | Unified orchestrator for all SonarCloud operations against t...   | ↓0 ↑2      | 2026-02-17    |
| [System Design Workflows](.claude/skills/senior-architect/references/system_design_workflows.md)                                    | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Systematic Debugging](.claude/skills/systematic-debugging/SKILL.md)                                                                | Random fixes waste time and create new bugs. Quick patches m...   | ↓0 ↑0      | 2026-02-17    |
| [Task Next - Dependency-Aware Task Selection](.claude/skills/task-next/SKILL.md)                                                    | Shows which tasks are ready to work on based on dependency r...   | ↓0 ↑0      | 2026-02-17    |
| [TDMS Integration (Step 6.5)](.claude/skills/pr-review/reference/TDMS_INTEGRATION.md)                                               | When items are deferred during PR review, they MUST be inges...   | ↓1 ↑0      | 2026-02-17    |
| [Tech Decision Guide](.claude/skills/senior-architect/references/tech_decision_guide.md)                                            | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Tech Stack Guide](.claude/skills/senior-fullstack/references/tech_stack_guide.md)                                                  | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Test Automation Patterns](.claude/skills/senior-qa/references/test_automation_patterns.md)                                         | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [Testing Strategies](.claude/skills/senior-qa/references/testing_strategies.md)                                                     | This reference guide provides comprehensive information for ...   | ↓0 ↑0      | 2026-02-17    |
| [UI Design System](.claude/skills/ui-design-system/SKILL.md)                                                                        | Professional toolkit for creating and maintaining scalable d...   | ↓0 ↑0      | 2026-02-17    |
| [Using Skills](.claude/skills/using-superpowers/SKILL.md)                                                                           | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [UX Researcher & Designer](.claude/skills/ux-researcher-designer/SKILL.md)                                                          | Comprehensive toolkit for user-centered research and experie...   | ↓0 ↑0      | 2026-02-17    |
| [Validate Claude Folder](.claude/skills/validate-claude-folder/SKILL.md)                                                            | Check the `.claude` folder for configuration consistency, do...   | ↓0 ↑2      | 2026-02-17    |
| [Verify & Triage Technical Debt](.claude/skills/verify-technical-debt/SKILL.md)                                                     | -                                                                 | ↓0 ↑0      | 2026-02-17    |
| [Visual Generation Guide for Market Research Reports](.claude/skills/market-research-reports/references/visual_generation_guide.md) | Foundation visual showing historical and projected market si...   | ↓0 ↑0      | 2026-02-17    |
| [Web Application Testing](.claude/skills/webapp-testing/SKILL.md)                                                                   | To test local web applications, write native Python Playwrig...   | ↓0 ↑0      | 2026-02-17    |

### Slash Commands (Tier 3)

_Claude Code custom commands_

| Document                                                   | Description | References | Last Modified |
| ---------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Commands Folder - DEPRECATED](.claude/commands/README.md) | -           | ↓0 ↑0      | 2026-02-17    |

### Technical Debt System (Tier 3)

_TDMS tracking and management_

| Document                                                                               | Description                                                     | References | Last Modified |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [TDMS Final System Audit](docs/technical-debt/FINAL_SYSTEM_AUDIT.md)                   | <!-- prettier-ignore-start -->                                  | ↓1 ↑2      | 2026-02-17    |
| [Technical Debt Index](docs/technical-debt/INDEX.md)                                   | <!-- prettier-ignore-start -->                                  | ↓2 ↑4      | 2026-02-17    |
| [Technical Debt Management System - Procedure Guide](docs/technical-debt/PROCEDURE.md) | This document provides step-by-step procedures for managing ... | ↓7 ↑1      | 2026-02-17    |
| [Technical Debt Metrics](docs/technical-debt/METRICS.md)                               | This document provides a real-time dashboard of technical de... | ↓1 ↑0      | 2026-02-17    |

### Templates (Tier 3)

_Document and audit templates_

| Document                                                                         | Description                                                     | References | Last Modified |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [[Document Title]](docs/templates/CANONICAL_DOC_TEMPLATE.md)                     | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [[Document Title]](docs/templates/FOUNDATION_DOC_TEMPLATE.md)                    | -                                                               | ↓0 ↑4      | 2026-02-17    |
| [[Feature/Initiative Name] Plan](docs/templates/PLANNING_DOC_TEMPLATE.md)        | -                                                               | ↓0 ↑4      | 2026-02-17    |
| [[Workflow/Reference Name]](docs/templates/REFERENCE_DOC_TEMPLATE.md)            | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [CANON Quick Reference Card](docs/templates/CANON_QUICK_REFERENCE.md)            | One-page quick reference for Multi-AI audits. Distilled from... | ↓0 ↑0      | 2026-02-17    |
| [How to [Accomplish Task]](docs/templates/GUIDE_DOC_TEMPLATE.md)                 | -                                                               | ↓0 ↑2      | 2026-02-17    |
| [Multi-AI Review JSONL Schema Standard](docs/templates/JSONL_SCHEMA_STANDARD.md) | Standardized JSONL output schema for all multi-AI review tem... | ↓7 ↑2      | 2026-02-17    |

### .agent > workflows (Tier 4)

_Uncategorized_

| Document                                                | Description                                                     | References | Last Modified |
| ------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Deploy to Production](.agent/workflows/deploy-prod.md) | This workflow automates the deployment process for the Sonas... | ↓0 ↑0      | 2026-02-17    |

### .agents > skills > find-skills (Tier 4)

_Uncategorized_

| Document                                           | Description                                                     | References | Last Modified |
| -------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Find Skills](.agents/skills/find-skills/SKILL.md) | This skill helps you discover and install skills and plugins... | ↓0 ↑0      | 2026-02-17    |

### .claude (Tier 4)

_Uncategorized_

| Document                                                            | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Claude Code Command Reference](.claude/COMMAND_REFERENCE.md)       | Comprehensive                                                   | ↓3 ↑0      | 2026-02-17    |
| [Claude Hooks Documentation](.claude/HOOKS.md)                      | Prepare development environment for new session                 | ↓2 ↑5      | 2026-02-17    |
| [Cross-Platform Claude Code Setup](.claude/CROSS_PLATFORM_SETUP.md) | This guide explains how to set up Claude Code consistently a... | ↓3 ↑0      | 2026-02-17    |
| [Hook & Session State Files Schema](.claude/STATE_SCHEMA.md)        | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [Required Plugins for Claude Code](.claude/REQUIRED_PLUGINS.md)     | This document lists all plugins required for full functional... | ↓2 ↑0      | 2026-02-17    |

### .claude > agents (Tier 4)

_Uncategorized_

| Document                                                                                 | Description                                     | References | Last Modified |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------- | ------------- |
| [.github/workflows/test-automation.yml](.claude/agents/test-engineer.md)                 | -                                               | ↓0 ↑0      | 2026-02-17    |
| [backend architect](.claude/agents/backend-architect.md)                                 | -                                               | ↓0 ↑0      | 2026-02-17    |
| [code reviewer](.claude/agents/code-reviewer.md)                                         | -                                               | ↓0 ↑0      | 2026-02-17    |
| [Create the MCP file](.claude/agents/mcp-expert.md)                                      | -                                               | ↓0 ↑0      | 2026-02-17    |
| [debugger](.claude/agents/debugger.md)                                                   | -                                               | ↓0 ↑0      | 2026-02-17    |
| [dependency manager](.claude/agents/dependency-manager.md)                               | -                                               | ↓0 ↑0      | 2026-02-17    |
| [deployment engineer](.claude/agents/deployment-engineer.md)                             | -                                               | ↓0 ↑0      | 2026-02-17    |
| [devops troubleshooter](.claude/agents/devops-troubleshooter.md)                         | -                                               | ↓0 ↑0      | 2026-02-17    |
| [documentation expert](.claude/agents/documentation-expert.md)                           | -                                               | ↓0 ↑0      | 2026-02-17    |
| [error detective](.claude/agents/error-detective.md)                                     | -                                               | ↓0 ↑0      | 2026-02-17    |
| [Example: Event-driven microservices architecture](.claude/agents/database-architect.md) | async def create_customer(self, customer_data): | ↓0 ↑0      | 2026-02-17    |
| [frontend developer](.claude/agents/frontend-developer.md)                               | -                                               | ↓0 ↑0      | 2026-02-17    |
| [fullstack developer](.claude/agents/fullstack-developer.md)                             | -                                               | ↓0 ↑0      | 2026-02-17    |
| [markdown syntax formatter](.claude/agents/markdown-syntax-formatter.md)                 | -                                               | ↓0 ↑0      | 2026-02-17    |
| [nextjs architecture expert](.claude/agents/nextjs-architecture-expert.md)               | -                                               | ↓0 ↑0      | 2026-02-17    |
| [penetration tester](.claude/agents/penetration-tester.md)                               | -                                               | ↓0 ↑0      | 2026-02-17    |
| [performance engineer](.claude/agents/performance-engineer.md)                           | -                                               | ↓0 ↑0      | 2026-02-17    |
| [prompt engineer](.claude/agents/prompt-engineer.md)                                     | -                                               | ↓0 ↑0      | 2026-02-17    |
| [react performance optimization](.claude/agents/react-performance-optimization.md)       | -                                               | ↓0 ↑0      | 2026-02-17    |
| [security auditor](.claude/agents/security-auditor.md)                                   | -                                               | ↓0 ↑0      | 2026-02-17    |
| [security/infrastructure/security-baseline.tf](.claude/agents/security-engineer.md)      | terraform {                                     | ↓0 ↑0      | 2026-02-17    |
| [Start feature](.claude/agents/git-flow-manager.md)                                      | -                                               | ↓0 ↑0      | 2026-02-17    |
| [technical writer](.claude/agents/technical-writer.md)                                   | -                                               | ↓0 ↑0      | 2026-02-17    |
| [ui ux designer](.claude/agents/ui-ux-designer.md)                                       | -                                               | ↓0 ↑0      | 2026-02-17    |

### .claude > agents > global (Tier 4)

_Uncategorized_

| Document                                                                            | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Git checks out middle commit](.claude/agents/global/gsd-debugger.md)               | 100 commits between working and broken: ~7 tests to find exa... | ↓0 ↑0      | 2026-02-17    |
| [gsd executor](.claude/agents/global/gsd-executor.md)                               | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [gsd research synthesizer](.claude/agents/global/gsd-research-synthesizer.md)       | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [gsd roadmapper](.claude/agents/global/gsd-roadmapper.md)                           | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [Key exports from each phase](.claude/agents/global/gsd-integration-checker.md)     | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [Normalize phase and find directory](.claude/agents/global/gsd-plan-checker.md)     | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [Package manifests](.claude/agents/global/gsd-codebase-mapper.md)                   | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [Phase [X]: [Name] - Research](.claude/agents/global/gsd-phase-researcher.md)       | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [Phase directory (provided in prompt)](.claude/agents/global/gsd-verifier.md)       | Extract phase goal from ROADMAP.md. This is the outcome to v... | ↓0 ↑0      | 2026-02-17    |
| [Plan 01 frontmatter](.claude/agents/global/gsd-planner.md)                         | No overlap -> can run parallel.                                 | ↓0 ↑0      | 2026-02-17    |
| [Research Summary: [Project Name]](.claude/agents/global/gsd-project-researcher.md) | -                                                               | ↓0 ↑0      | 2026-02-17    |

### .claude > plans (Tier 4)

_Uncategorized_

| Document                                                                                                  | Description                                                     | References | Last Modified |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [AI Optimization Audit Plan](.claude/plans/ai-optimization-audit.md)                                      | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [Audit Ecosystem Full Health Remediation Plan](.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md)              | <!-- prettier-ignore-start -->                                  | ↓0 ↑0      | 2026-02-17    |
| [Audit Template & Schema Full Overhaul Plan](.claude/plans/audit-template-schema-overhaul.md)             | -                                                               | ↓0 ↑0      | 2026-02-17    |
| [Implementation Plan: AI Review Learnings System Overhaul](.claude/plans/review-learnings-overhaul.md)    | Move oldest N reviews from the active log to a new archive f... | ↓0 ↑0      | 2026-02-17    |
| [Learning Effectiveness Analyzer - Implementation Plan](.claude/plans/learning-effectiveness-analyzer.md) | Create a comprehensive tool that:                               | ↓0 ↑0      | 2026-02-17    |
| [Plan: Manifest JSON Refactors](.claude/plans/manifest-json-refactors.md)                                 | -                                                               | ↓0 ↑0      | 2026-02-17    |

### .github (Tier 4)

_Uncategorized_

| Document                                                                           | Description | References | Last Modified |
| ---------------------------------------------------------------------------------- | ----------- | ---------- | ------------- |
| [Copilot Instructions - SoNash Recovery Notebook](.github/copilot-instructions.md) | -           | ↓0 ↑0      | 2026-02-17    |
| [ISSUE TEMPLATE APP CHECK REENABLE](.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md)  | -           | ↓0 ↑0      | 2026-02-17    |
| [pull request template](.github/pull_request_template.md)                          | -           | ↓0 ↑0      | 2026-02-17    |

### analysis (Tier 4)

_Uncategorized_

| Document                                                                                          | Description                                                     | References | Last Modified |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Full Categorization Analysis](analysis/full_categorization.md)                                   | This document provides a comprehensive categorization analys... | ↓0 ↑0      | 2026-02-17    |
| [Full Dependency Analysis](analysis/full_dependencies.md)                                         | This document provides comprehensive item-level dependency a... | ↓0 ↑0      | 2026-02-17    |
| [Parallel Execution Guide](analysis/PARALLEL_EXECUTION_GUIDE.md)                                  | This guide documents parallelization opportunities identifie... | ↓2 ↑0      | 2026-02-17    |
| [Pass 1: Structural Inventory & Baseline](analysis/pass1_inventory.md)                            | This document provides a comprehensive structural inventory ... | ↓0 ↑0      | 2026-02-17    |
| [Pass 2 Deduplication - Executive Summary](analysis/pass2_summary.md)                             | This document provides an executive summary of the Pass 2 de... | ↓0 ↑0      | 2026-02-17    |
| [Pass 4: Categorization & Feature Group Alignment](analysis/pass4_categorization.md)              | This document reconciles the 18 new feature groups from the ... | ↓0 ↑0      | 2026-02-17    |
| [Pass 5: Effort Estimation Alignment](analysis/pass5_effort.md)                                   | This document provides effort estimates for all 85 staged ex... | ↓0 ↑0      | 2026-02-17    |
| [ROADMAP Analysis](analysis/README.md)                                                            | This folder contains comprehensive analysis documents genera... | ↓0 ↑2      | 2026-02-17    |
| [ROADMAP Deep Analysis - Integration Summary](analysis/INTEGRATION_SUMMARY.md)                    | This document serves as the final integration summary of the... | ↓0 ↑0      | 2026-02-17    |
| [ROADMAP Deep Analysis - Pass 2: Deduplication Analysis](analysis/pass2_deduplication.md)         | This document provides a comprehensive deduplication analysi... | ↓0 ↑0      | 2026-02-17    |
| [ROADMAP Deep Analysis - Pass 3: Dependency Graph Reconciliation](analysis/pass3_dependencies.md) | This document validates the dependency graph structure after... | ↓0 ↑0      | 2026-02-17    |
| [ROADMAP Effort Estimates - Missing Items](analysis/effort_estimates.md)                          | This document provides effort estimates for 96 ROADMAP items... | ↓0 ↑0      | 2026-02-17    |
| [ROADMAP Full Analysis Summary](analysis/FULL_ANALYSIS_SUMMARY.md)                                | This document provides a comprehensive summary of the 6-pass... | ↓0 ↑0      | 2026-02-17    |
| [SoNash ROADMAP Deduplication Analysis](analysis/full_deduplication.md)                           | This document identifies duplicate, overlapping, and conflic... | ↓0 ↑0      | 2026-02-17    |
| [SoNash ROADMAP.md Full Inventory](analysis/full_inventory.md)                                    | This document provides a complete inventory of all 396 items... | ↓0 ↑0      | 2026-02-17    |

### consolidation-output (Tier 4)

_Uncategorized_

| Document                                                                      | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Suggested Compliance Checker Rules](consolidation-output/suggested-rules.md) | Candidate compliance checker rules extracted from consolidat... | ↓0 ↑0      | 2026-02-17    |

### Core Documentation (Tier 4)

_Reference_

| Document                                                                          | Description                                                       | References | Last Modified |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ------------- |
| [🤖 AI Code Review Process](docs/AI_REVIEW_PROCESS.md)                            | Each AI review is an opportunity to improve future work. Sys...   | ↓8 ↑2      | 2026-02-17    |
| [AI Review Learnings Log](docs/AI_REVIEW_LEARNINGS_LOG.md)                        | This document is the **audit trail** of all AI code review l...   | ↓3 ↑3      | 2026-02-17    |
| [Document Dependencies](docs/DOCUMENT_DEPENDENCIES.md)                            | Track template-instance relationships,                            | ↓2 ↑1      | 2026-02-17    |
| [Documentation Inventory](docs/README.md)                                         | This document provides a complete inventory of project docum...   | ↓0 ↑10     | 2026-02-17    |
| [Incident Response Runbook](docs/INCIDENT_RESPONSE.md)                            | Documented procedures for responding to security incidents, ...   | ↓7 ↑0      | 2026-02-17    |
| [PR Workflow Checklist - MANDATORY FOR ALL PHASES](docs/PR_WORKFLOW_CHECKLIST.md) | -                                                                 | ↓4 ↑3      | 2026-02-17    |
| [Review Policy Architecture](docs/REVIEW_POLICY_ARCHITECTURE.md)                  | This document defines a \*\*lightweight, AI-first review polic... | ↓3 ↑3      | 2026-02-17    |
| [Review Policy Index](docs/REVIEW_POLICY_INDEX.md)                                | Central directory for all review policy                           | ↓1 ↑9      | 2026-02-17    |
| [Review Policy Quick Reference](docs/REVIEW_POLICY_QUICK_REF.md)                  | This is a **one-page quick reference** for the SoNash review...   | ↓3 ↑4      | 2026-02-17    |
| [Review Policy Visual Guide](docs/REVIEW_POLICY_VISUAL_GUIDE.md)                  | This document provides **visual diagrams and flowcharts** fo...   | ↓2 ↑3      | 2026-02-17    |
| [Session Decision Log](docs/SESSION_DECISIONS.md)                                 | This document captures important decisions, options presente...   | ↓1 ↑0      | 2026-02-17    |
| [Session History Log](docs/SESSION_HISTORY.md)                                    | -                                                                 | ↓1 ↑1      | 2026-02-17    |
| [Slash Commands Reference](docs/SLASH_COMMANDS_REFERENCE.md)                      | -                                                                 | ↓1 ↑2      | 2026-02-17    |
| [TRIGGERS.md - Automation & Enforcement Reference](docs/TRIGGERS.md)              | -                                                                 | ↓2 ↑1      | 2026-02-17    |

### Decisions (Tier 4)

_Architecture decision records_

| Document                                                         | Description                                                     | References | Last Modified |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [ADR-NNN: [Short Title]](docs/decisions/TEMPLATE.md)             | [Briefly describe the purpose of this ADR - what decision do... | ↓1 ↑0      | 2026-02-17    |
| [Architecture Decision Records (ADRs)](docs/decisions/README.md) | This directory contains Architecture Decision Records (ADRs)... | ↓1 ↑1      | 2026-02-17    |

### Patterns (Tier 4)

_Documented design patterns_

| Document                                                                      | Description                                                     | References | Last Modified |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------- | ------------- |
| [Context Preservation Pattern](docs/patterns/context-preservation-pattern.md) | This document describes the Context Preservation Pattern for... | ↓0 ↑0      | 2026-02-17    |

### Root Documents (Tier 4)

_Reference_

| Document                                   | Description                                                       | References | Last Modified |
| ------------------------------------------ | ----------------------------------------------------------------- | ---------- | ------------- |
| [AI Context & Rules for SoNash](claude.md) | Core rules and constraints loaded on every AI turn. Kept min...   | ↓5 ↑7      | 2026-02-17    |
| [AI Workflow Guide](AI_WORKFLOW.md)        | \*\*Every phase, section, or milestone completion MUST include... | ↓9 ↑16     | 2026-02-17    |
| [Session Context](SESSION_CONTEXT.md)      | -                                                                 | ↓5 ↑8      | 2026-02-17    |

### scripts (Tier 4)

_Uncategorized_

| Document                               | Description                                                 | References | Last Modified |
| -------------------------------------- | ----------------------------------------------------------- | ---------- | ------------- |
| [Scripts Reference](scripts/README.md) | Syncs the README.md "Project Status" section with data from | ↓0 ↑0      | 2026-02-17    |

### Technical Debt Views (Tier 4)

_Auto-generated debt dashboards_

| Document                                                                     | Description                    | References | Last Modified |
| ---------------------------------------------------------------------------- | ------------------------------ | ---------- | ------------- |
| [Technical Debt by Category](docs/technical-debt/views/by-category.md)       | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-17    |
| [Technical Debt by Severity](docs/technical-debt/views/by-severity.md)       | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-17    |
| [Technical Debt by Status](docs/technical-debt/views/by-status.md)           | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-17    |
| [Unplaced Technical Debt Items](docs/technical-debt/views/unplaced-items.md) | <!-- prettier-ignore-start --> | ↓0 ↑1      | 2026-02-17    |
| [Verification Queue](docs/technical-debt/views/verification-queue.md)        | <!-- prettier-ignore-start --> | ↓1 ↑0      | 2026-02-17    |

---

## Reference Graph

### Most Referenced Documents (Inbound Links)

Documents that are linked to most frequently:

| Document                                                                                                | Inbound Links | Referenced By                                       |
| ------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| [SoNash Product Roadmap](ROADMAP.md)                                                                    | 18            | AI_WORKFLOW, ARCHITECTURE, DEVELOPMENT +15 more     |
| [Security &amp; Privacy Guide](docs/SECURITY.md)                                                        | 12            | AI_WORKFLOW, ARCHITECTURE, DEVELOPMENT +9 more      |
| [Multi-AI Review Coordinator](docs/audits/multi-ai/COORDINATOR.md)                                      | 12            | AI_WORKFLOW, README, README +9 more                 |
| [Multi-AI Audit Shared Template Base](docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md)           | 12            | AUDIT_STANDARDS, README, README +9 more             |
| [Development Guide](DEVELOPMENT.md)                                                                     | 11            | HOOKS, AI_WORKFLOW, ARCHITECTURE +8 more            |
| [Architecture Documentation](ARCHITECTURE.md)                                                           | 10            | AI_WORKFLOW, DEVELOPMENT, README +7 more            |
| [AI Workflow Guide](AI_WORKFLOW.md)                                                                     | 9             | HOOKS, README, SESSION_CONTEXT +6 more              |
| [Global Security Standards](docs/GLOBAL_SECURITY_STANDARDS.md)                                          | 9             | AI_WORKFLOW, README, FIREBASE_CHANGE_POLICY +6 more |
| [🤖 AI Code Review Process](docs/AI_REVIEW_PROCESS.md)                                                  | 8             | AI_WORKFLOW, README, SESSION_CONTEXT +5 more        |
| [SoNash Documentation Standards](docs/DOCUMENTATION_STANDARDS.md)                                       | 7             | SKILL, SKILL, AI_WORKFLOW +4 more                   |
| [Incident Response Runbook](docs/INCIDENT_RESPONSE.md)                                                  | 7             | ARCHITECTURE, DEVELOPMENT, README +4 more           |
| [Code Review Patterns Reference](docs/agent_docs/CODE_PATTERNS.md)                                      | 7             | SKILL, README, claude +4 more                       |
| [Technical Debt Management System - Procedure Guide](docs/technical-debt/PROCEDURE.md)                  | 7             | SKILL, SKILL, SKILL +4 more                         |
| [Multi-AI Review JSONL Schema Standard](docs/templates/JSONL_SCHEMA_STANDARD.md)                        | 7             | SKILL, SKILL, SKILL +4 more                         |
| [\[Project Name\] Multi-AI Code Review Plan](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)       | 6             | README, COORDINATOR, README +3 more                 |
| [\[Project Name\] Multi-AI Performance Audit Plan](docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md) | 6             | README, COORDINATOR, README +3 more                 |
| [\[Project Name\] Multi-AI Refactoring Audit](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)      | 6             | README, COORDINATOR, README +3 more                 |
| [Session Context](SESSION_CONTEXT.md)                                                                   | 5             | AI_WORKFLOW, ROADMAP, claude +2 more                |
| [AI Context &amp; Rules for SoNash](claude.md)                                                          | 5             | README, ROADMAP, AI_REVIEW_LEARNINGS_LOG +2 more    |
| [Server-Side Security Implementation Guide](docs/SERVER_SIDE_SECURITY.md)                               | 5             | README, ROADMAP, ROADMAP_LOG +2 more                |

### Most Linking Documents (Outbound Links)

Documents that link to other documents most frequently:

| Document                                                                                                  | Outbound Links |
| --------------------------------------------------------------------------------------------------------- | -------------- |
| [SoNash Product Roadmap](ROADMAP.md)                                                                      | 18             |
| [Audit Ecosystem](docs/audits/README.md)                                                                  | 18             |
| [AI Workflow Guide](AI_WORKFLOW.md)                                                                       | 16             |
| [SoNash - Sober Nashville Recovery Notebook](README.md)                                                   | 15             |
| [Multi-AI Audit System](docs/audits/multi-ai/README.md)                                                   | 12             |
| [Development Guide](DEVELOPMENT.md)                                                                       | 11             |
| [Multi-AI Review Coordinator](docs/audits/multi-ai/COORDINATOR.md)                                        | 11             |
| [Documentation Inventory](docs/README.md)                                                                 | 10             |
| [Review Policy Index](docs/REVIEW_POLICY_INDEX.md)                                                        | 9              |
| [Session Context](SESSION_CONTEXT.md)                                                                     | 8              |
| [Enhancement Audit Template \(Multi-AI Injectable\)](docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md) | 8              |
| [AI Context &amp; Rules for SoNash](claude.md)                                                            | 7              |
| [Comprehensive Multi-Domain Audit Orchestrator](.claude/skills/audit-comprehensive/SKILL.md)              | 6              |
| [Single-Session Refactoring Audit](.claude/skills/audit-refactoring/SKILL.md)                             | 6              |
| [Architecture Documentation](ARCHITECTURE.md)                                                             | 6              |
| [SoNash Roadmap Log](ROADMAP_LOG.md)                                                                      | 6              |
| [Claude Hooks Documentation](.claude/HOOKS.md)                                                            | 5              |
| [Firebase Change Policy](docs/FIREBASE_CHANGE_POLICY.md)                                                  | 5              |
| [\[Project Name\] Multi-AI Code Review Plan](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)         | 5              |
| [\[Project Name\] Multi-AI Refactoring Audit](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)        | 5              |

---

## Orphaned Documents

Documents with no inbound links (not referenced by any other document):

**178 orphaned documents:**

- [Deploy to Production](.agent/workflows/deploy-prod.md)
- [Find Skills](.agents/skills/find-skills/SKILL.md)
- [Hook &amp; Session State Files Schema](.claude/STATE_SCHEMA.md)
- [backend architect](.claude/agents/backend-architect.md)
- [code reviewer](.claude/agents/code-reviewer.md)
- [Example: Event-driven microservices architecture](.claude/agents/database-architect.md)
- [debugger](.claude/agents/debugger.md)
- [dependency manager](.claude/agents/dependency-manager.md)
- [deployment engineer](.claude/agents/deployment-engineer.md)
- [devops troubleshooter](.claude/agents/devops-troubleshooter.md)
- [documentation expert](.claude/agents/documentation-expert.md)
- [error detective](.claude/agents/error-detective.md)
- [frontend developer](.claude/agents/frontend-developer.md)
- [fullstack developer](.claude/agents/fullstack-developer.md)
- [Start feature](.claude/agents/git-flow-manager.md)
- [Package manifests](.claude/agents/global/gsd-codebase-mapper.md)
- [Git checks out middle commit](.claude/agents/global/gsd-debugger.md)
- [gsd executor](.claude/agents/global/gsd-executor.md)
- [Key exports from each phase](.claude/agents/global/gsd-integration-checker.md)
- [Phase \[X\]: \[Name\] - Research](.claude/agents/global/gsd-phase-researcher.md)
- [Normalize phase and find directory](.claude/agents/global/gsd-plan-checker.md)
- [Plan 01 frontmatter](.claude/agents/global/gsd-planner.md)
- [Research Summary: \[Project Name\]](.claude/agents/global/gsd-project-researcher.md)
- [gsd research synthesizer](.claude/agents/global/gsd-research-synthesizer.md)
- [gsd roadmapper](.claude/agents/global/gsd-roadmapper.md)
- [Phase directory \(provided in prompt\)](.claude/agents/global/gsd-verifier.md)
- [markdown syntax formatter](.claude/agents/markdown-syntax-formatter.md)
- [Create the MCP file](.claude/agents/mcp-expert.md)
- [nextjs architecture expert](.claude/agents/nextjs-architecture-expert.md)
- [penetration tester](.claude/agents/penetration-tester.md)
- [performance engineer](.claude/agents/performance-engineer.md)
- [prompt engineer](.claude/agents/prompt-engineer.md)
- [react performance optimization](.claude/agents/react-performance-optimization.md)
- [security auditor](.claude/agents/security-auditor.md)
- [security/infrastructure/security-baseline.tf](.claude/agents/security-engineer.md)
- [technical writer](.claude/agents/technical-writer.md)
- [.github/workflows/test-automation.yml](.claude/agents/test-engineer.md)
- [ui ux designer](.claude/agents/ui-ux-designer.md)
- [Commands Folder - DEPRECATED](.claude/commands/README.md)
- [Audit Ecosystem Full Health Remediation Plan](.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md)
- [AI Optimization Audit Plan](.claude/plans/ai-optimization-audit.md)
- [Audit Template &amp; Schema Full Overhaul Plan](.claude/plans/audit-template-schema-overhaul.md)
- [Learning Effectiveness Analyzer - Implementation Plan](.claude/plans/learning-effectiveness-analyzer.md)
- [Plan: Manifest JSON Refactors](.claude/plans/manifest-json-refactors.md)
- [Implementation Plan: AI Review Learnings System Overhaul](.claude/plans/review-learnings-overhaul.md)
- [Skill Index](.claude/skills/SKILL_INDEX.md)
- [Add Technical Debt](.claude/skills/add-debt/SKILL.md)
- [Alerts — Intelligent Health Dashboard](.claude/skills/alerts/SKILL.md)
- [Artifacts Builder](.claude/skills/artifacts-builder/SKILL.md)
- [Audit Aggregator Agent](.claude/skills/audit-aggregator/SKILL.md)
- [Single-Session AI Optimization Audit](.claude/skills/audit-ai-optimization/SKILL.md)
- [Single-Session Code Review Audit](.claude/skills/audit-code/SKILL.md)
- [Comprehensive Multi-Domain Audit Orchestrator](.claude/skills/audit-comprehensive/SKILL.md)
- [Single-Session Documentation Audit](.claude/skills/audit-documentation/SKILL.md)
- [Single-Session Engineering Productivity Audit](.claude/skills/audit-engineering-productivity/SKILL.md)
- [Enhancement Audit](.claude/skills/audit-enhancements/SKILL.md)
- [Audit System Health Check](.claude/skills/audit-health/SKILL.md)
- [Single-Session Performance Audit](.claude/skills/audit-performance/SKILL.md)
- [Comprehensive Automation Audit](.claude/skills/audit-process/SKILL.md)
- [Single-Session Refactoring Audit](.claude/skills/audit-refactoring/SKILL.md)
- [Single-Session Security Audit](.claude/skills/audit-security/SKILL.md)
- [Session Checkpoint](.claude/skills/checkpoint/SKILL.md)
- [Code Reviewer](.claude/skills/code-reviewer/SKILL.md)
- [Code Review Checklist](.claude/skills/code-reviewer/references/code_review_checklist.md)
- [Coding Standards](.claude/skills/code-reviewer/references/coding_standards.md)
- [Common Antipatterns](.claude/skills/code-reviewer/references/common_antipatterns.md)
- [Content Research Writer](.claude/skills/content-research-writer/SKILL.md)
- [Create Audit Wizard](.claude/skills/create-audit/SKILL.md)
- [Decrypt Secrets](.claude/skills/decrypt-secrets/SKILL.md)
- [Deep Plan](.claude/skills/deep-plan/SKILL.md)
- [Developer Growth Analysis](.claude/skills/developer-growth-analysis/SKILL.md)
- [Documentation Optimizer](.claude/skills/doc-optimizer/SKILL.md)
- [Documentation Maintenance](.claude/skills/docs-maintain/SKILL.md)
- [Excel Analysis](.claude/skills/excel-analysis/SKILL.md)
- [Find Skills](.claude/skills/find-skills/SKILL.md)
- [SKILL](.claude/skills/frontend-design/SKILL.md)
- [Gh Pr Checks Plan Fix](.claude/skills/gh-fix-ci/SKILL.md)
- [Market Research Reports](.claude/skills/market-research-reports/SKILL.md)
- [Market Research Report Formatting Guide](.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md)
- [Data Analysis Patterns for Market Research](.claude/skills/market-research-reports/references/data_analysis_patterns.md)
- [Market Research Report Structure Guide](.claude/skills/market-research-reports/references/report_structure_guide.md)
- [Visual Generation Guide for Market Research Reports](.claude/skills/market-research-reports/references/visual_generation_guide.md)
- [MarkItDown Installation Guide](.claude/skills/markitdown/INSTALLATION_GUIDE.md)
- [OpenRouter Integration for MarkItDown](.claude/skills/markitdown/OPENROUTER_INTEGRATION.md)
- [MarkItDown Quick Reference](.claude/skills/markitdown/QUICK_REFERENCE.md)
- [MarkItDown Skill](.claude/skills/markitdown/README.md)
- [MarkItDown - File to Markdown Conversion](.claude/skills/markitdown/SKILL.md)
- [MarkItDown Skill - Creation Summary](.claude/skills/markitdown/SKILL_SUMMARY.md)
- [MarkItDown Example Usage](.claude/skills/markitdown/assets/example_usage.md)
- [MarkItDown API Reference](.claude/skills/markitdown/references/api_reference.md)
- [File Format Support](.claude/skills/markitdown/references/file_formats.md)
- [MCP Server Development Guide](.claude/skills/mcp-builder/SKILL.md)
- [Multi-AI Audit Orchestrator](.claude/skills/multi-ai-audit/SKILL.md)
- [PR Review Retrospective](.claude/skills/pr-retro/SKILL.md)
- [PR Code Review Processor](.claude/skills/pr-review/SKILL.md)
- [Pre-Commit Fixer](.claude/skills/pre-commit-fixer/SKILL.md)
- [quick-fix Skill](.claude/skills/quick-fix/SKILL.md)
- [Senior Architect](.claude/skills/senior-architect/SKILL.md)
- [Architecture Patterns](.claude/skills/senior-architect/references/architecture_patterns.md)
- [System Design Workflows](.claude/skills/senior-architect/references/system_design_workflows.md)
- [Tech Decision Guide](.claude/skills/senior-architect/references/tech_decision_guide.md)
- [Senior Backend](.claude/skills/senior-backend/SKILL.md)
- [Api Design Patterns](.claude/skills/senior-backend/references/api_design_patterns.md)
- [Backend Security Practices](.claude/skills/senior-backend/references/backend_security_practices.md)
- [Database Optimization Guide](.claude/skills/senior-backend/references/database_optimization_guide.md)
- [Senior Devops](.claude/skills/senior-devops/SKILL.md)
- [Cicd Pipeline Guide](.claude/skills/senior-devops/references/cicd_pipeline_guide.md)
- [Deployment Strategies](.claude/skills/senior-devops/references/deployment_strategies.md)
- [Infrastructure As Code](.claude/skills/senior-devops/references/infrastructure_as_code.md)
- [Senior Frontend](.claude/skills/senior-frontend/SKILL.md)
- [Frontend Best Practices](.claude/skills/senior-frontend/references/frontend_best_practices.md)
- [Nextjs Optimization Guide](.claude/skills/senior-frontend/references/nextjs_optimization_guide.md)
- [React Patterns](.claude/skills/senior-frontend/references/react_patterns.md)
- [Senior Fullstack](.claude/skills/senior-fullstack/SKILL.md)
- [Architecture Patterns](.claude/skills/senior-fullstack/references/architecture_patterns.md)
- [Development Workflows](.claude/skills/senior-fullstack/references/development_workflows.md)
- [Tech Stack Guide](.claude/skills/senior-fullstack/references/tech_stack_guide.md)
- [Senior Qa](.claude/skills/senior-qa/SKILL.md)
- [Qa Best Practices](.claude/skills/senior-qa/references/qa_best_practices.md)
- [Test Automation Patterns](.claude/skills/senior-qa/references/test_automation_patterns.md)
- [Testing Strategies](.claude/skills/senior-qa/references/testing_strategies.md)
- [Session Begin Checklist](.claude/skills/session-begin/SKILL.md)
- [Session End Checklist](.claude/skills/session-end/SKILL.md)
- [Skill Creator](.claude/skills/skill-creator/SKILL.md)
- [SonarCloud Integration](.claude/skills/sonarcloud/SKILL.md)
- [Creation Log: Systematic Debugging Skill](.claude/skills/systematic-debugging/CREATION-LOG.md)
- [Systematic Debugging](.claude/skills/systematic-debugging/SKILL.md)
- [Condition-Based Waiting](.claude/skills/systematic-debugging/condition-based-waiting.md)
- [Defense-in-Depth Validation](.claude/skills/systematic-debugging/defense-in-depth.md)
- [Root Cause Tracing](.claude/skills/systematic-debugging/root-cause-tracing.md)
- [Academic Test: Systematic Debugging Skill](.claude/skills/systematic-debugging/test-academic.md)
- [Pressure Test 1: Emergency Production Fix](.claude/skills/systematic-debugging/test-pressure-1.md)
- [Pressure Test 2: Sunk Cost + Exhaustion](.claude/skills/systematic-debugging/test-pressure-2.md)
- [Pressure Test 3: Authority + Social Pressure](.claude/skills/systematic-debugging/test-pressure-3.md)
- [Task Next - Dependency-Aware Task Selection](.claude/skills/task-next/SKILL.md)
- [/test-suite — Unified Testing Suite](.claude/skills/test-suite/SKILL.md)
- [UI Design System](.claude/skills/ui-design-system/SKILL.md)
- [Using Skills](.claude/skills/using-superpowers/SKILL.md)
- [UX Researcher &amp; Designer](.claude/skills/ux-researcher-designer/SKILL.md)
- [Validate Claude Folder](.claude/skills/validate-claude-folder/SKILL.md)
- [Verify &amp; Triage Technical Debt](.claude/skills/verify-technical-debt/SKILL.md)
- [Web Application Testing](.claude/skills/webapp-testing/SKILL.md)
- [ISSUE TEMPLATE APP CHECK REENABLE](.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md)
- [Copilot Instructions - SoNash Recovery Notebook](.github/copilot-instructions.md)
- [pull request template](.github/pull_request_template.md)
- [SoNash - Sober Nashville Recovery Notebook](README.md)
- [ROADMAP Full Analysis Summary](analysis/FULL_ANALYSIS_SUMMARY.md)
- [ROADMAP Deep Analysis - Integration Summary](analysis/INTEGRATION_SUMMARY.md)
- [ROADMAP Analysis](analysis/README.md)
- [ROADMAP Effort Estimates - Missing Items](analysis/effort_estimates.md)
- [Full Categorization Analysis](analysis/full_categorization.md)
- [SoNash ROADMAP Deduplication Analysis](analysis/full_deduplication.md)
- [Full Dependency Analysis](analysis/full_dependencies.md)
- [SoNash ROADMAP.md Full Inventory](analysis/full_inventory.md)
- [Pass 1: Structural Inventory &amp; Baseline](analysis/pass1_inventory.md)
- [ROADMAP Deep Analysis - Pass 2: Deduplication Analysis](analysis/pass2_deduplication.md)
- [Pass 2 Deduplication - Executive Summary](analysis/pass2_summary.md)
- [ROADMAP Deep Analysis - Pass 3: Dependency Graph Reconciliation](analysis/pass3_dependencies.md)
- [Pass 4: Categorization &amp; Feature Group Alignment](analysis/pass4_categorization.md)
- [Pass 5: Effort Estimation Alignment](analysis/pass5_effort.md)
- [Suggested Compliance Checker Rules](consolidation-output/suggested-rules.md)
- [Learning Effectiveness Metrics](docs/LEARNING_METRICS.md)
- [MCP Server Setup Guide](docs/MCP_SETUP.md)
- [Documentation Inventory](docs/README.md)
- [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md)
- [AI Optimization Audit — Summary Report](docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md)
- [AI Optimization Audit Report \(2026-02-14\)](docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md)
- [AI Optimization Audit — Review Decisions](docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md)
- [Automation Audit Report — 2026-02-09](docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md)
- [Context Preservation Pattern](docs/patterns/context-preservation-pattern.md)
- [Unplaced Technical Debt Items](docs/technical-debt/views/unplaced-items.md)
- [\[Document Title\]](docs/templates/CANONICAL_DOC_TEMPLATE.md)
- [CANON Quick Reference Card](docs/templates/CANON_QUICK_REFERENCE.md)
- [\[Document Title\]](docs/templates/FOUNDATION_DOC_TEMPLATE.md)
- [How to \[Accomplish Task\]](docs/templates/GUIDE_DOC_TEMPLATE.md)
- [\[Feature/Initiative Name\] Plan](docs/templates/PLANNING_DOC_TEMPLATE.md)
- [\[Workflow/Reference Name\]](docs/templates/REFERENCE_DOC_TEMPLATE.md)
- [Scripts Reference](scripts/README.md)

---

## Full Document List

<details>
<summary>Click to expand full list of all documents</summary>

| #   | Path                                                                                                                                                                                       | Title                                                              | Tier | Status                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ---- | ------------------------------------------------------------------------------- |
| 1   | [.agent/workflows/deploy-prod.md](.agent/workflows/deploy-prod.md)                                                                                                                         | Deploy to Production                                               | 4    | -                                                                               |
| 2   | [.agents/skills/find-skills/SKILL.md](.agents/skills/find-skills/SKILL.md)                                                                                                                 | Find Skills                                                        | 4    | -                                                                               |
| 3   | [.claude/agents/backend-architect.md](.claude/agents/backend-architect.md)                                                                                                                 | backend architect                                                  | 4    | -                                                                               |
| 4   | [.claude/agents/code-reviewer.md](.claude/agents/code-reviewer.md)                                                                                                                         | code reviewer                                                      | 4    | -                                                                               |
| 5   | [.claude/agents/database-architect.md](.claude/agents/database-architect.md)                                                                                                               | Example: Event-driven microservices architecture                   | 4    | -                                                                               |
| 6   | [.claude/agents/debugger.md](.claude/agents/debugger.md)                                                                                                                                   | debugger                                                           | 4    | -                                                                               |
| 7   | [.claude/agents/dependency-manager.md](.claude/agents/dependency-manager.md)                                                                                                               | dependency manager                                                 | 4    | -                                                                               |
| 8   | [.claude/agents/deployment-engineer.md](.claude/agents/deployment-engineer.md)                                                                                                             | deployment engineer                                                | 4    | -                                                                               |
| 9   | [.claude/agents/devops-troubleshooter.md](.claude/agents/devops-troubleshooter.md)                                                                                                         | devops troubleshooter                                              | 4    | -                                                                               |
| 10  | [.claude/agents/documentation-expert.md](.claude/agents/documentation-expert.md)                                                                                                           | documentation expert                                               | 4    | -                                                                               |
| 11  | [.claude/agents/error-detective.md](.claude/agents/error-detective.md)                                                                                                                     | error detective                                                    | 4    | -                                                                               |
| 12  | [.claude/agents/frontend-developer.md](.claude/agents/frontend-developer.md)                                                                                                               | frontend developer                                                 | 4    | -                                                                               |
| 13  | [.claude/agents/fullstack-developer.md](.claude/agents/fullstack-developer.md)                                                                                                             | fullstack developer                                                | 4    | -                                                                               |
| 14  | [.claude/agents/git-flow-manager.md](.claude/agents/git-flow-manager.md)                                                                                                                   | Start feature                                                      | 4    | -                                                                               |
| 15  | [.claude/agents/global/gsd-codebase-mapper.md](.claude/agents/global/gsd-codebase-mapper.md)                                                                                               | Package manifests                                                  | 4    | -                                                                               |
| 16  | [.claude/agents/global/gsd-debugger.md](.claude/agents/global/gsd-debugger.md)                                                                                                             | Git checks out middle commit                                       | 4    | -                                                                               |
| 17  | [.claude/agents/global/gsd-executor.md](.claude/agents/global/gsd-executor.md)                                                                                                             | gsd executor                                                       | 4    | -                                                                               |
| 18  | [.claude/agents/global/gsd-integration-checker.md](.claude/agents/global/gsd-integration-checker.md)                                                                                       | Key exports from each phase                                        | 4    | -                                                                               |
| 19  | [.claude/agents/global/gsd-phase-researcher.md](.claude/agents/global/gsd-phase-researcher.md)                                                                                             | Phase \[X\]: \[Name\] - Research                                   | 4    | -                                                                               |
| 20  | [.claude/agents/global/gsd-plan-checker.md](.claude/agents/global/gsd-plan-checker.md)                                                                                                     | Normalize phase and find directory                                 | 4    | -                                                                               |
| 21  | [.claude/agents/global/gsd-planner.md](.claude/agents/global/gsd-planner.md)                                                                                                               | Plan 01 frontmatter                                                | 4    | -                                                                               |
| 22  | [.claude/agents/global/gsd-project-researcher.md](.claude/agents/global/gsd-project-researcher.md)                                                                                         | Research Summary: \[Project Name\]                                 | 4    | -                                                                               |
| 23  | [.claude/agents/global/gsd-research-synthesizer.md](.claude/agents/global/gsd-research-synthesizer.md)                                                                                     | gsd research synthesizer                                           | 4    | -                                                                               |
| 24  | [.claude/agents/global/gsd-roadmapper.md](.claude/agents/global/gsd-roadmapper.md)                                                                                                         | gsd roadmapper                                                     | 4    | -                                                                               |
| 25  | [.claude/agents/global/gsd-verifier.md](.claude/agents/global/gsd-verifier.md)                                                                                                             | Phase directory \(provided in prompt\)                             | 4    | -                                                                               |
| 26  | [.claude/agents/markdown-syntax-formatter.md](.claude/agents/markdown-syntax-formatter.md)                                                                                                 | markdown syntax formatter                                          | 4    | -                                                                               |
| 27  | [.claude/agents/mcp-expert.md](.claude/agents/mcp-expert.md)                                                                                                                               | Create the MCP file                                                | 4    | -                                                                               |
| 28  | [.claude/agents/nextjs-architecture-expert.md](.claude/agents/nextjs-architecture-expert.md)                                                                                               | nextjs architecture expert                                         | 4    | -                                                                               |
| 29  | [.claude/agents/penetration-tester.md](.claude/agents/penetration-tester.md)                                                                                                               | penetration tester                                                 | 4    | -                                                                               |
| 30  | [.claude/agents/performance-engineer.md](.claude/agents/performance-engineer.md)                                                                                                           | performance engineer                                               | 4    | -                                                                               |
| 31  | [.claude/agents/prompt-engineer.md](.claude/agents/prompt-engineer.md)                                                                                                                     | prompt engineer                                                    | 4    | -                                                                               |
| 32  | [.claude/agents/react-performance-optimization.md](.claude/agents/react-performance-optimization.md)                                                                                       | react performance optimization                                     | 4    | -                                                                               |
| 33  | [.claude/agents/security-auditor.md](.claude/agents/security-auditor.md)                                                                                                                   | security auditor                                                   | 4    | -                                                                               |
| 34  | [.claude/agents/security-engineer.md](.claude/agents/security-engineer.md)                                                                                                                 | security/infrastructure/security-baseline.tf                       | 4    | -                                                                               |
| 35  | [.claude/agents/technical-writer.md](.claude/agents/technical-writer.md)                                                                                                                   | technical writer                                                   | 4    | -                                                                               |
| 36  | [.claude/agents/test-engineer.md](.claude/agents/test-engineer.md)                                                                                                                         | .github/workflows/test-automation.yml                              | 4    | -                                                                               |
| 37  | [.claude/agents/ui-ux-designer.md](.claude/agents/ui-ux-designer.md)                                                                                                                       | ui ux designer                                                     | 4    | -                                                                               |
| 38  | [.claude/COMMAND_REFERENCE.md](.claude/COMMAND_REFERENCE.md)                                                                                                                               | Claude Code Command Reference                                      | 4    | -                                                                               |
| 39  | [.claude/commands/README.md](.claude/commands/README.md)                                                                                                                                   | Commands Folder - DEPRECATED                                       | 3    | -                                                                               |
| 40  | [.claude/CROSS_PLATFORM_SETUP.md](.claude/CROSS_PLATFORM_SETUP.md)                                                                                                                         | Cross-Platform Claude Code Setup                                   | 4    | -                                                                               |
| 41  | [.claude/HOOKS.md](.claude/HOOKS.md)                                                                                                                                                       | Claude Hooks Documentation                                         | 4    | -                                                                               |
| 42  | [.claude/plans/ai-optimization-audit.md](.claude/plans/ai-optimization-audit.md)                                                                                                           | AI Optimization Audit Plan                                         | 4    | DRAFT                                                                           |
| 43  | [.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md](.claude/plans/AUDIT_ECOSYSTEM_HEALTH_PLAN.md)                                                                                               | Audit Ecosystem Full Health Remediation Plan                       | 4    | APPROVED                                                                        |
| 44  | [.claude/plans/audit-template-schema-overhaul.md](.claude/plans/audit-template-schema-overhaul.md)                                                                                         | Audit Template &amp; Schema Full Overhaul Plan                     | 4    | SAVED — Ready for implementation **Created:** 2026-02-06                        |
| 45  | [.claude/plans/learning-effectiveness-analyzer.md](.claude/plans/learning-effectiveness-analyzer.md)                                                                                       | Learning Effectiveness Analyzer - Implementation Plan              | 4    | Planned - Implement after next PR review                                        |
| 46  | [.claude/plans/manifest-json-refactors.md](.claude/plans/manifest-json-refactors.md)                                                                                                       | Plan: Manifest JSON Refactors                                      | 4    | COMPLETE **Priority:** P3 \(improvement, not blocking\) **Scope:** 4            |
| 47  | [.claude/plans/review-learnings-overhaul.md](.claude/plans/review-learnings-overhaul.md)                                                                                                   | Implementation Plan: AI Review Learnings System Overhaul           | 4    | ACTIVE                                                                          |
| 48  | [.claude/REQUIRED_PLUGINS.md](.claude/REQUIRED_PLUGINS.md)                                                                                                                                 | Required Plugins for Claude Code                                   | 4    | -                                                                               |
| 49  | [.claude/skills/add-debt/SKILL.md](.claude/skills/add-debt/SKILL.md)                                                                                                                       | Add Technical Debt                                                 | 3    | -                                                                               |
| 50  | [.claude/skills/alerts/SKILL.md](.claude/skills/alerts/SKILL.md)                                                                                                                           | Alerts — Intelligent Health Dashboard                              | 3    | -                                                                               |
| 51  | [.claude/skills/artifacts-builder/SKILL.md](.claude/skills/artifacts-builder/SKILL.md)                                                                                                     | Artifacts Builder                                                  | 3    | -                                                                               |
| 52  | [.claude/skills/audit-aggregator/SKILL.md](.claude/skills/audit-aggregator/SKILL.md)                                                                                                       | Audit Aggregator Agent                                             | 3    | -                                                                               |
| 53  | [.claude/skills/audit-ai-optimization/SKILL.md](.claude/skills/audit-ai-optimization/SKILL.md)                                                                                             | Single-Session AI Optimization Audit                               | 3    | -                                                                               |
| 54  | [.claude/skills/audit-code/SKILL.md](.claude/skills/audit-code/SKILL.md)                                                                                                                   | Single-Session Code Review Audit                                   | 3    | -                                                                               |
| 55  | [.claude/skills/audit-comprehensive/reference/RECOVERY_PROCEDURES.md](.claude/skills/audit-comprehensive/reference/RECOVERY_PROCEDURES.md)                                                 | Comprehensive Audit Recovery Procedures                            | 3    | ACTIVE                                                                          |
| 56  | [.claude/skills/audit-comprehensive/reference/TRIAGE_GUIDE.md](.claude/skills/audit-comprehensive/reference/TRIAGE_GUIDE.md)                                                               | Comprehensive Audit Triage Guide                                   | 3    | ACTIVE                                                                          |
| 57  | [.claude/skills/audit-comprehensive/reference/WAVE_DETAILS.md](.claude/skills/audit-comprehensive/reference/WAVE_DETAILS.md)                                                               | Comprehensive Audit Wave Details                                   | 3    | ACTIVE                                                                          |
| 58  | [.claude/skills/audit-comprehensive/SKILL.md](.claude/skills/audit-comprehensive/SKILL.md)                                                                                                 | Comprehensive Multi-Domain Audit Orchestrator                      | 3    | -                                                                               |
| 59  | [.claude/skills/audit-documentation/SKILL.md](.claude/skills/audit-documentation/SKILL.md)                                                                                                 | Single-Session Documentation Audit                                 | 3    | -                                                                               |
| 60  | [.claude/skills/audit-engineering-productivity/SKILL.md](.claude/skills/audit-engineering-productivity/SKILL.md)                                                                           | Single-Session Engineering Productivity Audit                      | 3    | -                                                                               |
| 61  | [.claude/skills/audit-enhancements/SKILL.md](.claude/skills/audit-enhancements/SKILL.md)                                                                                                   | Enhancement Audit                                                  | 3    | -                                                                               |
| 62  | [.claude/skills/audit-health/SKILL.md](.claude/skills/audit-health/SKILL.md)                                                                                                               | Audit System Health Check                                          | 3    | -                                                                               |
| 63  | [.claude/skills/audit-performance/SKILL.md](.claude/skills/audit-performance/SKILL.md)                                                                                                     | Single-Session Performance Audit                                   | 3    | -                                                                               |
| 64  | [.claude/skills/audit-process/SKILL.md](.claude/skills/audit-process/SKILL.md)                                                                                                             | Comprehensive Automation Audit                                     | 3    | -                                                                               |
| 65  | [.claude/skills/audit-refactoring/SKILL.md](.claude/skills/audit-refactoring/SKILL.md)                                                                                                     | Single-Session Refactoring Audit                                   | 3    | -                                                                               |
| 66  | [.claude/skills/audit-security/SKILL.md](.claude/skills/audit-security/SKILL.md)                                                                                                           | Single-Session Security Audit                                      | 3    | -                                                                               |
| 67  | [.claude/skills/checkpoint/SKILL.md](.claude/skills/checkpoint/SKILL.md)                                                                                                                   | Session Checkpoint                                                 | 3    | -                                                                               |
| 68  | [.claude/skills/code-reviewer/references/code_review_checklist.md](.claude/skills/code-reviewer/references/code_review_checklist.md)                                                       | Code Review Checklist                                              | 3    | -                                                                               |
| 69  | [.claude/skills/code-reviewer/references/coding_standards.md](.claude/skills/code-reviewer/references/coding_standards.md)                                                                 | Coding Standards                                                   | 3    | -                                                                               |
| 70  | [.claude/skills/code-reviewer/references/common_antipatterns.md](.claude/skills/code-reviewer/references/common_antipatterns.md)                                                           | Common Antipatterns                                                | 3    | -                                                                               |
| 71  | [.claude/skills/code-reviewer/SKILL.md](.claude/skills/code-reviewer/SKILL.md)                                                                                                             | Code Reviewer                                                      | 3    | -                                                                               |
| 72  | [.claude/skills/content-research-writer/SKILL.md](.claude/skills/content-research-writer/SKILL.md)                                                                                         | Content Research Writer                                            | 3    | -                                                                               |
| 73  | [.claude/skills/create-audit/SKILL.md](.claude/skills/create-audit/SKILL.md)                                                                                                               | Create Audit Wizard                                                | 3    | -                                                                               |
| 74  | [.claude/skills/decrypt-secrets/SKILL.md](.claude/skills/decrypt-secrets/SKILL.md)                                                                                                         | Decrypt Secrets                                                    | 3    | -                                                                               |
| 75  | [.claude/skills/deep-plan/SKILL.md](.claude/skills/deep-plan/SKILL.md)                                                                                                                     | Deep Plan                                                          | 3    | -                                                                               |
| 76  | [.claude/skills/developer-growth-analysis/SKILL.md](.claude/skills/developer-growth-analysis/SKILL.md)                                                                                     | Developer Growth Analysis                                          | 3    | -                                                                               |
| 77  | [.claude/skills/doc-optimizer/SKILL.md](.claude/skills/doc-optimizer/SKILL.md)                                                                                                             | Documentation Optimizer                                            | 3    | -                                                                               |
| 78  | [.claude/skills/docs-maintain/SKILL.md](.claude/skills/docs-maintain/SKILL.md)                                                                                                             | Documentation Maintenance                                          | 3    | -                                                                               |
| 79  | [.claude/skills/excel-analysis/SKILL.md](.claude/skills/excel-analysis/SKILL.md)                                                                                                           | Excel Analysis                                                     | 3    | -                                                                               |
| 80  | [.claude/skills/find-skills/SKILL.md](.claude/skills/find-skills/SKILL.md)                                                                                                                 | Find Skills                                                        | 3    | -                                                                               |
| 81  | [.claude/skills/frontend-design/SKILL.md](.claude/skills/frontend-design/SKILL.md)                                                                                                         | SKILL                                                              | 3    | -                                                                               |
| 82  | [.claude/skills/gh-fix-ci/SKILL.md](.claude/skills/gh-fix-ci/SKILL.md)                                                                                                                     | Gh Pr Checks Plan Fix                                              | 3    | -                                                                               |
| 83  | [.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md](.claude/skills/market-research-reports/assets/FORMATTING_GUIDE.md)                                                     | Market Research Report Formatting Guide                            | 3    | -                                                                               |
| 84  | [.claude/skills/market-research-reports/references/data_analysis_patterns.md](.claude/skills/market-research-reports/references/data_analysis_patterns.md)                                 | Data Analysis Patterns for Market Research                         | 3    | -                                                                               |
| 85  | [.claude/skills/market-research-reports/references/report_structure_guide.md](.claude/skills/market-research-reports/references/report_structure_guide.md)                                 | Market Research Report Structure Guide                             | 3    | -                                                                               |
| 86  | [.claude/skills/market-research-reports/references/visual_generation_guide.md](.claude/skills/market-research-reports/references/visual_generation_guide.md)                               | Visual Generation Guide for Market Research Reports                | 3    | -                                                                               |
| 87  | [.claude/skills/market-research-reports/SKILL.md](.claude/skills/market-research-reports/SKILL.md)                                                                                         | Market Research Reports                                            | 3    | -                                                                               |
| 88  | [.claude/skills/markitdown/assets/example_usage.md](.claude/skills/markitdown/assets/example_usage.md)                                                                                     | MarkItDown Example Usage                                           | 3    | -                                                                               |
| 89  | [.claude/skills/markitdown/INSTALLATION_GUIDE.md](.claude/skills/markitdown/INSTALLATION_GUIDE.md)                                                                                         | MarkItDown Installation Guide                                      | 3    | -                                                                               |
| 90  | [.claude/skills/markitdown/OPENROUTER_INTEGRATION.md](.claude/skills/markitdown/OPENROUTER_INTEGRATION.md)                                                                                 | OpenRouter Integration for MarkItDown                              | 3    | -                                                                               |
| 91  | [.claude/skills/markitdown/QUICK_REFERENCE.md](.claude/skills/markitdown/QUICK_REFERENCE.md)                                                                                               | MarkItDown Quick Reference                                         | 3    | -                                                                               |
| 92  | [.claude/skills/markitdown/README.md](.claude/skills/markitdown/README.md)                                                                                                                 | MarkItDown Skill                                                   | 3    | -                                                                               |
| 93  | [.claude/skills/markitdown/references/api_reference.md](.claude/skills/markitdown/references/api_reference.md)                                                                             | MarkItDown API Reference                                           | 3    | -                                                                               |
| 94  | [.claude/skills/markitdown/references/file_formats.md](.claude/skills/markitdown/references/file_formats.md)                                                                               | File Format Support                                                | 3    | -                                                                               |
| 95  | [.claude/skills/markitdown/SKILL_SUMMARY.md](.claude/skills/markitdown/SKILL_SUMMARY.md)                                                                                                   | MarkItDown Skill - Creation Summary                                | 3    | -                                                                               |
| 96  | [.claude/skills/markitdown/SKILL.md](.claude/skills/markitdown/SKILL.md)                                                                                                                   | MarkItDown - File to Markdown Conversion                           | 3    | -                                                                               |
| 97  | [.claude/skills/mcp-builder/reference/evaluation.md](.claude/skills/mcp-builder/reference/evaluation.md)                                                                                   | MCP Server Evaluation Guide                                        | 3    | -                                                                               |
| 98  | [.claude/skills/mcp-builder/reference/mcp_best_practices.md](.claude/skills/mcp-builder/reference/mcp_best_practices.md)                                                                   | MCP Server Development Best Practices and Guidelines               | 3    | -                                                                               |
| 99  | [.claude/skills/mcp-builder/reference/node_mcp_server.md](.claude/skills/mcp-builder/reference/node_mcp_server.md)                                                                         | Node/TypeScript MCP Server Implementation Guide                    | 3    | -                                                                               |
| 100 | [.claude/skills/mcp-builder/reference/python_mcp_server.md](.claude/skills/mcp-builder/reference/python_mcp_server.md)                                                                     | Python MCP Server Implementation Guide                             | 3    | -                                                                               |
| 101 | [.claude/skills/mcp-builder/SKILL.md](.claude/skills/mcp-builder/SKILL.md)                                                                                                                 | MCP Server Development Guide                                       | 3    | -                                                                               |
| 102 | [.claude/skills/multi-ai-audit/SKILL.md](.claude/skills/multi-ai-audit/SKILL.md)                                                                                                           | Multi-AI Audit Orchestrator                                        | 3    | -                                                                               |
| 103 | [.claude/skills/pr-retro/SKILL.md](.claude/skills/pr-retro/SKILL.md)                                                                                                                       | PR Review Retrospective                                            | 3    | -                                                                               |
| 104 | [.claude/skills/pr-review/reference/LEARNING_CAPTURE.md](.claude/skills/pr-review/reference/LEARNING_CAPTURE.md)                                                                           | Learning Capture \(Step 7\)                                        | 3    | ACTIVE                                                                          |
| 105 | [.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md](.claude/skills/pr-review/reference/PARALLEL_AGENT_STRATEGY.md)                                                             | Parallel Agent Strategy \(Steps 4.3-4.5\)                          | 3    | ACTIVE                                                                          |
| 106 | [.claude/skills/pr-review/reference/SONARCLOUD_ENRICHMENT.md](.claude/skills/pr-review/reference/SONARCLOUD_ENRICHMENT.md)                                                                 | SonarCloud Enrichment \(Step 1.5\)                                 | 3    | ACTIVE                                                                          |
| 107 | [.claude/skills/pr-review/reference/TDMS_INTEGRATION.md](.claude/skills/pr-review/reference/TDMS_INTEGRATION.md)                                                                           | TDMS Integration \(Step 6.5\)                                      | 3    | ACTIVE                                                                          |
| 108 | [.claude/skills/pr-review/SKILL.md](.claude/skills/pr-review/SKILL.md)                                                                                                                     | PR Code Review Processor                                           | 3    | -                                                                               |
| 109 | [.claude/skills/pre-commit-fixer/SKILL.md](.claude/skills/pre-commit-fixer/SKILL.md)                                                                                                       | Pre-Commit Fixer                                                   | 3    | -                                                                               |
| 110 | [.claude/skills/quick-fix/SKILL.md](.claude/skills/quick-fix/SKILL.md)                                                                                                                     | quick-fix Skill                                                    | 3    | -                                                                               |
| 111 | [.claude/skills/senior-architect/references/architecture_patterns.md](.claude/skills/senior-architect/references/architecture_patterns.md)                                                 | Architecture Patterns                                              | 3    | -                                                                               |
| 112 | [.claude/skills/senior-architect/references/system_design_workflows.md](.claude/skills/senior-architect/references/system_design_workflows.md)                                             | System Design Workflows                                            | 3    | -                                                                               |
| 113 | [.claude/skills/senior-architect/references/tech_decision_guide.md](.claude/skills/senior-architect/references/tech_decision_guide.md)                                                     | Tech Decision Guide                                                | 3    | -                                                                               |
| 114 | [.claude/skills/senior-architect/SKILL.md](.claude/skills/senior-architect/SKILL.md)                                                                                                       | Senior Architect                                                   | 3    | -                                                                               |
| 115 | [.claude/skills/senior-backend/references/api_design_patterns.md](.claude/skills/senior-backend/references/api_design_patterns.md)                                                         | Api Design Patterns                                                | 3    | -                                                                               |
| 116 | [.claude/skills/senior-backend/references/backend_security_practices.md](.claude/skills/senior-backend/references/backend_security_practices.md)                                           | Backend Security Practices                                         | 3    | -                                                                               |
| 117 | [.claude/skills/senior-backend/references/database_optimization_guide.md](.claude/skills/senior-backend/references/database_optimization_guide.md)                                         | Database Optimization Guide                                        | 3    | -                                                                               |
| 118 | [.claude/skills/senior-backend/SKILL.md](.claude/skills/senior-backend/SKILL.md)                                                                                                           | Senior Backend                                                     | 3    | -                                                                               |
| 119 | [.claude/skills/senior-devops/references/cicd_pipeline_guide.md](.claude/skills/senior-devops/references/cicd_pipeline_guide.md)                                                           | Cicd Pipeline Guide                                                | 3    | -                                                                               |
| 120 | [.claude/skills/senior-devops/references/deployment_strategies.md](.claude/skills/senior-devops/references/deployment_strategies.md)                                                       | Deployment Strategies                                              | 3    | -                                                                               |
| 121 | [.claude/skills/senior-devops/references/infrastructure_as_code.md](.claude/skills/senior-devops/references/infrastructure_as_code.md)                                                     | Infrastructure As Code                                             | 3    | -                                                                               |
| 122 | [.claude/skills/senior-devops/SKILL.md](.claude/skills/senior-devops/SKILL.md)                                                                                                             | Senior Devops                                                      | 3    | -                                                                               |
| 123 | [.claude/skills/senior-frontend/references/frontend_best_practices.md](.claude/skills/senior-frontend/references/frontend_best_practices.md)                                               | Frontend Best Practices                                            | 3    | -                                                                               |
| 124 | [.claude/skills/senior-frontend/references/nextjs_optimization_guide.md](.claude/skills/senior-frontend/references/nextjs_optimization_guide.md)                                           | Nextjs Optimization Guide                                          | 3    | -                                                                               |
| 125 | [.claude/skills/senior-frontend/references/react_patterns.md](.claude/skills/senior-frontend/references/react_patterns.md)                                                                 | React Patterns                                                     | 3    | -                                                                               |
| 126 | [.claude/skills/senior-frontend/SKILL.md](.claude/skills/senior-frontend/SKILL.md)                                                                                                         | Senior Frontend                                                    | 3    | -                                                                               |
| 127 | [.claude/skills/senior-fullstack/references/architecture_patterns.md](.claude/skills/senior-fullstack/references/architecture_patterns.md)                                                 | Architecture Patterns                                              | 3    | -                                                                               |
| 128 | [.claude/skills/senior-fullstack/references/development_workflows.md](.claude/skills/senior-fullstack/references/development_workflows.md)                                                 | Development Workflows                                              | 3    | -                                                                               |
| 129 | [.claude/skills/senior-fullstack/references/tech_stack_guide.md](.claude/skills/senior-fullstack/references/tech_stack_guide.md)                                                           | Tech Stack Guide                                                   | 3    | -                                                                               |
| 130 | [.claude/skills/senior-fullstack/SKILL.md](.claude/skills/senior-fullstack/SKILL.md)                                                                                                       | Senior Fullstack                                                   | 3    | -                                                                               |
| 131 | [.claude/skills/senior-qa/references/qa_best_practices.md](.claude/skills/senior-qa/references/qa_best_practices.md)                                                                       | Qa Best Practices                                                  | 3    | -                                                                               |
| 132 | [.claude/skills/senior-qa/references/test_automation_patterns.md](.claude/skills/senior-qa/references/test_automation_patterns.md)                                                         | Test Automation Patterns                                           | 3    | -                                                                               |
| 133 | [.claude/skills/senior-qa/references/testing_strategies.md](.claude/skills/senior-qa/references/testing_strategies.md)                                                                     | Testing Strategies                                                 | 3    | -                                                                               |
| 134 | [.claude/skills/senior-qa/SKILL.md](.claude/skills/senior-qa/SKILL.md)                                                                                                                     | Senior Qa                                                          | 3    | -                                                                               |
| 135 | [.claude/skills/session-begin/SKILL.md](.claude/skills/session-begin/SKILL.md)                                                                                                             | Session Begin Checklist                                            | 3    | -                                                                               |
| 136 | [.claude/skills/session-end/SKILL.md](.claude/skills/session-end/SKILL.md)                                                                                                                 | Session End Checklist                                              | 3    | -                                                                               |
| 137 | [.claude/skills/SKILL_INDEX.md](.claude/skills/SKILL_INDEX.md)                                                                                                                             | Skill Index                                                        | 3    | -                                                                               |
| 138 | [.claude/skills/skill-creator/SKILL.md](.claude/skills/skill-creator/SKILL.md)                                                                                                             | Skill Creator                                                      | 3    | -                                                                               |
| 139 | [.claude/skills/sonarcloud/SKILL.md](.claude/skills/sonarcloud/SKILL.md)                                                                                                                   | SonarCloud Integration                                             | 3    | -                                                                               |
| 140 | [.claude/skills/systematic-debugging/condition-based-waiting.md](.claude/skills/systematic-debugging/condition-based-waiting.md)                                                           | Condition-Based Waiting                                            | 3    | -                                                                               |
| 141 | [.claude/skills/systematic-debugging/CREATION-LOG.md](.claude/skills/systematic-debugging/CREATION-LOG.md)                                                                                 | Creation Log: Systematic Debugging Skill                           | 3    | -                                                                               |
| 142 | [.claude/skills/systematic-debugging/defense-in-depth.md](.claude/skills/systematic-debugging/defense-in-depth.md)                                                                         | Defense-in-Depth Validation                                        | 3    | -                                                                               |
| 143 | [.claude/skills/systematic-debugging/root-cause-tracing.md](.claude/skills/systematic-debugging/root-cause-tracing.md)                                                                     | Root Cause Tracing                                                 | 3    | -                                                                               |
| 144 | [.claude/skills/systematic-debugging/SKILL.md](.claude/skills/systematic-debugging/SKILL.md)                                                                                               | Systematic Debugging                                               | 3    | -                                                                               |
| 145 | [.claude/skills/systematic-debugging/test-academic.md](.claude/skills/systematic-debugging/test-academic.md)                                                                               | Academic Test: Systematic Debugging Skill                          | 3    | -                                                                               |
| 146 | [.claude/skills/systematic-debugging/test-pressure-1.md](.claude/skills/systematic-debugging/test-pressure-1.md)                                                                           | Pressure Test 1: Emergency Production Fix                          | 3    | -                                                                               |
| 147 | [.claude/skills/systematic-debugging/test-pressure-2.md](.claude/skills/systematic-debugging/test-pressure-2.md)                                                                           | Pressure Test 2: Sunk Cost + Exhaustion                            | 3    | -                                                                               |
| 148 | [.claude/skills/systematic-debugging/test-pressure-3.md](.claude/skills/systematic-debugging/test-pressure-3.md)                                                                           | Pressure Test 3: Authority + Social Pressure                       | 3    | -                                                                               |
| 149 | [.claude/skills/task-next/SKILL.md](.claude/skills/task-next/SKILL.md)                                                                                                                     | Task Next - Dependency-Aware Task Selection                        | 3    | -                                                                               |
| 150 | [.claude/skills/test-suite/SKILL.md](.claude/skills/test-suite/SKILL.md)                                                                                                                   | /test-suite — Unified Testing Suite                                | 3    | -                                                                               |
| 151 | [.claude/skills/ui-design-system/SKILL.md](.claude/skills/ui-design-system/SKILL.md)                                                                                                       | UI Design System                                                   | 3    | -                                                                               |
| 152 | [.claude/skills/using-superpowers/SKILL.md](.claude/skills/using-superpowers/SKILL.md)                                                                                                     | Using Skills                                                       | 3    | -                                                                               |
| 153 | [.claude/skills/ux-researcher-designer/SKILL.md](.claude/skills/ux-researcher-designer/SKILL.md)                                                                                           | UX Researcher &amp; Designer                                       | 3    | -                                                                               |
| 154 | [.claude/skills/validate-claude-folder/SKILL.md](.claude/skills/validate-claude-folder/SKILL.md)                                                                                           | Validate Claude Folder                                             | 3    | -                                                                               |
| 155 | [.claude/skills/verify-technical-debt/SKILL.md](.claude/skills/verify-technical-debt/SKILL.md)                                                                                             | Verify &amp; Triage Technical Debt                                 | 3    | -                                                                               |
| 156 | [.claude/skills/webapp-testing/SKILL.md](.claude/skills/webapp-testing/SKILL.md)                                                                                                           | Web Application Testing                                            | 3    | -                                                                               |
| 157 | [.claude/STATE_SCHEMA.md](.claude/STATE_SCHEMA.md)                                                                                                                                         | Hook &amp; Session State Files Schema                              | 4    | ACTIVE                                                                          |
| 158 | [.github/copilot-instructions.md](.github/copilot-instructions.md)                                                                                                                         | Copilot Instructions - SoNash Recovery Notebook                    | 4    | -                                                                               |
| 159 | [.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md](.github/ISSUE_TEMPLATE_APP_CHECK_REENABLE.md)                                                                                               | ISSUE TEMPLATE APP CHECK REENABLE                                  | 4    | -                                                                               |
| 160 | [.github/pull_request_template.md](.github/pull_request_template.md)                                                                                                                       | pull request template                                              | 4    | -                                                                               |
| 161 | [AI_WORKFLOW.md](AI_WORKFLOW.md)                                                                                                                                                           | AI Workflow Guide                                                  | 4    | -                                                                               |
| 162 | [analysis/effort_estimates.md](analysis/effort_estimates.md)                                                                                                                               | ROADMAP Effort Estimates - Missing Items                           | 4    | -                                                                               |
| 163 | [analysis/FULL_ANALYSIS_SUMMARY.md](analysis/FULL_ANALYSIS_SUMMARY.md)                                                                                                                     | ROADMAP Full Analysis Summary                                      | 4    | -                                                                               |
| 164 | [analysis/full_categorization.md](analysis/full_categorization.md)                                                                                                                         | Full Categorization Analysis                                       | 4    | -                                                                               |
| 165 | [analysis/full_deduplication.md](analysis/full_deduplication.md)                                                                                                                           | SoNash ROADMAP Deduplication Analysis                              | 4    | -                                                                               |
| 166 | [analysis/full_dependencies.md](analysis/full_dependencies.md)                                                                                                                             | Full Dependency Analysis                                           | 4    | -                                                                               |
| 167 | [analysis/full_inventory.md](analysis/full_inventory.md)                                                                                                                                   | SoNash ROADMAP.md Full Inventory                                   | 4    | -                                                                               |
| 168 | [analysis/INTEGRATION_SUMMARY.md](analysis/INTEGRATION_SUMMARY.md)                                                                                                                         | ROADMAP Deep Analysis - Integration Summary                        | 4    | COMPLETE                                                                        |
| 169 | [analysis/PARALLEL_EXECUTION_GUIDE.md](analysis/PARALLEL_EXECUTION_GUIDE.md)                                                                                                               | Parallel Execution Guide                                           | 4    | -                                                                               |
| 170 | [analysis/pass1_inventory.md](analysis/pass1_inventory.md)                                                                                                                                 | Pass 1: Structural Inventory &amp; Baseline                        | 4    | -                                                                               |
| 171 | [analysis/pass2_deduplication.md](analysis/pass2_deduplication.md)                                                                                                                         | ROADMAP Deep Analysis - Pass 2: Deduplication Analysis             | 4    | -                                                                               |
| 172 | [analysis/pass2_summary.md](analysis/pass2_summary.md)                                                                                                                                     | Pass 2 Deduplication - Executive Summary                           | 4    | -                                                                               |
| 173 | [analysis/pass3_dependencies.md](analysis/pass3_dependencies.md)                                                                                                                           | ROADMAP Deep Analysis - Pass 3: Dependency Graph Reconciliation    | 4    | 📋 Planned **Priority:** P0 \(Critical prerequisite for M5\)                    |
| 174 | [analysis/pass4_categorization.md](analysis/pass4_categorization.md)                                                                                                                       | Pass 4: Categorization &amp; Feature Group Alignment               | 4    | COMPLETE \| **Last Updated:** 2026-01-27                                        |
| 175 | [analysis/pass5_effort.md](analysis/pass5_effort.md)                                                                                                                                       | Pass 5: Effort Estimation Alignment                                | 4    | COMPLETE \| **Last Updated:** 2026-01-27                                        |
| 176 | [analysis/README.md](analysis/README.md)                                                                                                                                                   | ROADMAP Analysis                                                   | 4    | -                                                                               |
| 177 | [ARCHITECTURE.md](ARCHITECTURE.md)                                                                                                                                                         | Architecture Documentation                                         | 2    | ACTIVE **Last Updated:** 2026-01-02                                             |
| 178 | [claude.md](claude.md)                                                                                                                                                                     | AI Context &amp; Rules for SoNash                                  | 4    | ACTIVE                                                                          |
| 179 | [consolidation-output/suggested-rules.md](consolidation-output/suggested-rules.md)                                                                                                         | Suggested Compliance Checker Rules                                 | 4    | Pending review - add to                                                         |
| 180 | [DEVELOPMENT.md](DEVELOPMENT.md)                                                                                                                                                           | Development Guide                                                  | 2    | Active                                                                          |
| 181 | [docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md](docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md)                                                                               | Admin Panel Security &amp; Monitoring Requirements                 | 3    | -                                                                               |
| 182 | [docs/agent_docs/AGENT_ORCHESTRATION.md](docs/agent_docs/AGENT_ORCHESTRATION.md)                                                                                                           | Agent Orchestration Reference                                      | 3    | ACTIVE                                                                          |
| 183 | [docs/agent_docs/CODE_PATTERNS.md](docs/agent_docs/CODE_PATTERNS.md)                                                                                                                       | Code Review Patterns Reference                                     | 3    | -                                                                               |
| 184 | [docs/agent_docs/CONTEXT_PRESERVATION.md](docs/agent_docs/CONTEXT_PRESERVATION.md)                                                                                                         | Context Preservation &amp; Compaction Safety                       | 3    | ACTIVE                                                                          |
| 185 | [docs/agent_docs/FIX_TEMPLATES.md](docs/agent_docs/FIX_TEMPLATES.md)                                                                                                                       | Fix Templates for Qodo PR Review Findings                          | 3    | ACTIVE                                                                          |
| 186 | [docs/agent_docs/SECURITY_CHECKLIST.md](docs/agent_docs/SECURITY_CHECKLIST.md)                                                                                                             | Security Checklist for Scripts                                     | 3    | Active                                                                          |
| 187 | [docs/agent_docs/SKILL_AGENT_POLICY.md](docs/agent_docs/SKILL_AGENT_POLICY.md)                                                                                                             | Skill and Agent Usage Policy                                       | 3    | Active **Last Updated:** 2026-01-15                                             |
| 188 | [docs/AI_REVIEW_LEARNINGS_LOG.md](docs/AI_REVIEW_LEARNINGS_LOG.md)                                                                                                                         | AI Review Learnings Log                                            | 4    | Fully consolidated into claude.md v2.7                                          |
| 189 | [docs/AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md)                                                                                                                                     | 🤖 AI Code Review Process                                          | 4    | Active                                                                          |
| 190 | [docs/APPCHECK_SETUP.md](docs/APPCHECK_SETUP.md)                                                                                                                                           | App Check Setup Guide                                              | 2    | Active **Last Updated:** 2026-01-03                                             |
| 191 | [docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md](docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md)                                                                                                 | Implementation Plan: Audit Ecosystem Codification                  | 3    | COMPLETED/REFERENCE                                                             |
| 192 | [docs/audits/AUDIT_STANDARDS.md](docs/audits/AUDIT_STANDARDS.md)                                                                                                                           | Audit Standards                                                    | 3    | ACTIVE                                                                          |
| 193 | [docs/audits/AUDIT_TRACKER.md](docs/audits/AUDIT_TRACKER.md)                                                                                                                               | Audit Tracker                                                      | 3    | -                                                                               |
| 194 | [docs/audits/multi-ai/COORDINATOR.md](docs/audits/multi-ai/COORDINATOR.md)                                                                                                                 | Multi-AI Review Coordinator                                        | 3    | -                                                                               |
| 195 | [docs/audits/multi-ai/README.md](docs/audits/multi-ai/README.md)                                                                                                                           | Multi-AI Audit System                                              | 3    | -                                                                               |
| 196 | [docs/audits/multi-ai/templates/AGGREGATOR.md](docs/audits/multi-ai/templates/AGGREGATOR.md)                                                                                               | Multi-AI Audit Aggregator Template                                 | 3    | -                                                                               |
| 197 | [docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md](docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md)                                                                         | \[Project Name\] Multi-AI AI Optimization Audit Plan               | 3    | PENDING                                                                         |
| 198 | [docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md](docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md)                                                                                 | \[Project Name\] Multi-AI Code Review Plan                         | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 199 | [docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md](docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md)                                                                             | \[Project Name\] Multi-AI Documentation Audit Plan                 | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 200 | [docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md](docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md)                                                       | \[Project Name\] Multi-AI Engineering Productivity Audit Plan      | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 201 | [docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md](docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md)                                                                                 | Enhancement Audit Template \(Multi-AI Injectable\)                 | 3    | DRAFT                                                                           |
| 202 | [docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md](docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md)                                                                                 | \[Project Name\] Multi-AI Performance Audit Plan                   | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 203 | [docs/audits/multi-ai/templates/PROCESS_AUDIT.md](docs/audits/multi-ai/templates/PROCESS_AUDIT.md)                                                                                         | \[Project Name\] Multi-AI Process &amp; Automation Audit Plan      | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 204 | [docs/audits/multi-ai/templates/REFACTORING_AUDIT.md](docs/audits/multi-ai/templates/REFACTORING_AUDIT.md)                                                                                 | \[Project Name\] Multi-AI Refactoring Audit                        | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 205 | [docs/audits/multi-ai/templates/SECURITY_AUDIT.md](docs/audits/multi-ai/templates/SECURITY_AUDIT.md)                                                                                       | \[Project Name\] Multi-AI Security Audit Plan                      | 3    | PENDING \| IN_PROGRESS \| COMPLETE \*\*Overall                                  |
| 206 | [docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md](docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md)                                                                           | Multi-AI Audit Shared Template Base                                | 3    | ACTIVE **Tier:** 4 \(Reference\) **Purpose:** Shared boilerplate for            |
| 207 | [docs/audits/README.md](docs/audits/README.md)                                                                                                                                             | Audit Ecosystem                                                    | 3    | ACTIVE                                                                          |
| 208 | [docs/audits/RESULTS_INDEX.md](docs/audits/RESULTS_INDEX.md)                                                                                                                               | Audit Results Index                                                | 3    | ACTIVE                                                                          |
| 209 | [docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md](docs/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md)                             | AI Optimization Audit — Summary Report                             | 3    | DRAFT                                                                           |
| 210 | [docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md](docs/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md)                                           | AI Optimization Audit — Summary Report                             | 3    | DRAFT                                                                           |
| 211 | [docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md](docs/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md) | AI Optimization Audit Report \(2026-02-14\)                        | 3    | ACTIVE                                                                          |
| 212 | [docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md](docs/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md)                         | AI Optimization Audit — Review Decisions                           | 3    | ACTIVE                                                                          |
| 213 | [docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md](docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md)                           | Automation Audit Report — 2026-02-09                               | 3    | ACTIVE                                                                          |
| 214 | [docs/decisions/README.md](docs/decisions/README.md)                                                                                                                                       | Architecture Decision Records \(ADRs\)                             | 4    | -                                                                               |
| 215 | [docs/decisions/TEMPLATE.md](docs/decisions/TEMPLATE.md)                                                                                                                                   | ADR-NNN: \[Short Title\]                                           | 4    | Proposed \| Accepted \| Deprecated \| Superseded                                |
| 216 | [docs/DOCUMENT_DEPENDENCIES.md](docs/DOCUMENT_DEPENDENCIES.md)                                                                                                                             | Document Dependencies                                              | 4    | ACTIVE **Purpose:** Track template-instance relationships,                      |
| 217 | [docs/DOCUMENTATION_STANDARDS.md](docs/DOCUMENTATION_STANDARDS.md)                                                                                                                         | SoNash Documentation Standards                                     | 2    | -                                                                               |
| 218 | [docs/FIREBASE_CHANGE_POLICY.md](docs/FIREBASE_CHANGE_POLICY.md)                                                                                                                           | Firebase Change Policy                                             | 2    | ACTIVE                                                                          |
| 219 | [docs/GLOBAL_SECURITY_STANDARDS.md](docs/GLOBAL_SECURITY_STANDARDS.md)                                                                                                                     | Global Security Standards                                          | 2    | ACTIVE **Authority:** MANDATORY for all code changes \*\*Last                   |
| 220 | [docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md)                                                                                                                                     | Incident Response Runbook                                          | 4    | Active **Last Updated:** 2026-01-03                                             |
| 221 | [docs/LEARNING_METRICS.md](docs/LEARNING_METRICS.md)                                                                                                                                       | Learning Effectiveness Metrics                                     | 3    | -                                                                               |
| 222 | [docs/LIGHTHOUSE_INTEGRATION_PLAN.md](docs/LIGHTHOUSE_INTEGRATION_PLAN.md)                                                                                                                 | Lighthouse Integration Plan                                        | 3    | ACTIVE \(Part of Operational Visibility Sprint\) **Priority:** P0               |
| 223 | [docs/MCP_SETUP.md](docs/MCP_SETUP.md)                                                                                                                                                     | MCP Server Setup Guide                                             | 2    | Active                                                                          |
| 224 | [docs/MONETIZATION_RESEARCH.md](docs/MONETIZATION_RESEARCH.md)                                                                                                                             | Monetization Strategy Research Initiative                          | 3    | -                                                                               |
| 225 | [docs/OPERATIONAL_VISIBILITY_SPRINT.md](docs/OPERATIONAL_VISIBILITY_SPRINT.md)                                                                                                             | Operational Visibility Sprint                                      | 3    | ACTIVE                                                                          |
| 226 | [docs/patterns/context-preservation-pattern.md](docs/patterns/context-preservation-pattern.md)                                                                                             | Context Preservation Pattern                                       | 4    | -                                                                               |
| 227 | [docs/plans/TESTING_INFRASTRUCTURE_PLAN.md](docs/plans/TESTING_INFRASTRUCTURE_PLAN.md)                                                                                                     | Testing Infrastructure Plan                                        | 3    | ACTIVE **Priority:** P1 **Related:** \[TESTING_PLAN.md\]\(../TESTING_PLAN.md\), |
| 228 | [docs/plans/TESTING_USER_MANUAL.md](docs/plans/TESTING_USER_MANUAL.md)                                                                                                                     | SoNash Testing User Manual                                         | 3    | ACTIVE                                                                          |
| 229 | [docs/plans/TRACK_A_TESTING_PLAN.md](docs/plans/TRACK_A_TESTING_PLAN.md)                                                                                                                   | Track A Admin Panel Testing Plan                                   | 3    | Active                                                                          |
| 230 | [docs/PR_WORKFLOW_CHECKLIST.md](docs/PR_WORKFLOW_CHECKLIST.md)                                                                                                                             | PR Workflow Checklist - MANDATORY FOR ALL PHASES                   | 4    | -                                                                               |
| 231 | [docs/README.md](docs/README.md)                                                                                                                                                           | Documentation Inventory                                            | 4    | ACTIVE                                                                          |
| 232 | [docs/RECAPTCHA_REMOVAL_GUIDE.md](docs/RECAPTCHA_REMOVAL_GUIDE.md)                                                                                                                         | reCAPTCHA &amp; App Check - Complete Removal and Fresh Setup Guide | 2    | Deferred - App Check blocking critical functionality **Target:** Future         |
| 233 | [docs/REVIEW_POLICY_ARCHITECTURE.md](docs/REVIEW_POLICY_ARCHITECTURE.md)                                                                                                                   | Review Policy Architecture                                         | 4    | UNDER IMPLEMENTATION \(Phase 1 in progress\) **Authority:** MANDATORY           |
| 234 | [docs/REVIEW_POLICY_INDEX.md](docs/REVIEW_POLICY_INDEX.md)                                                                                                                                 | Review Policy Index                                                | 4    | Active **Purpose:** Central directory for all review policy                     |
| 235 | [docs/REVIEW_POLICY_QUICK_REF.md](docs/REVIEW_POLICY_QUICK_REF.md)                                                                                                                         | Review Policy Quick Reference                                      | 4    | -                                                                               |
| 236 | [docs/REVIEW_POLICY_VISUAL_GUIDE.md](docs/REVIEW_POLICY_VISUAL_GUIDE.md)                                                                                                                   | Review Policy Visual Guide                                         | 4    | -                                                                               |
| 237 | [docs/SECURITY.md](docs/SECURITY.md)                                                                                                                                                       | Security &amp; Privacy Guide                                       | 2    | ACTIVE **Last Updated:** 2026-01-05                                             |
| 238 | [docs/SENTRY_INTEGRATION_GUIDE.md](docs/SENTRY_INTEGRATION_GUIDE.md)                                                                                                                       | Sentry Integration Guide for SoNash Admin Panel                    | 2    | Active **Last Updated:**                                                        |
| 239 | [docs/SERVER_SIDE_SECURITY.md](docs/SERVER_SIDE_SECURITY.md)                                                                                                                               | Server-Side Security Implementation Guide                          | 2    | 🟡 RECOMMENDED BEFORE PUBLIC                                                    |
| 240 | [docs/SESSION_DECISIONS.md](docs/SESSION_DECISIONS.md)                                                                                                                                     | Session Decision Log                                               | 4    | -                                                                               |
| 241 | [docs/SESSION_HISTORY.md](docs/SESSION_HISTORY.md)                                                                                                                                         | Session History Log                                                | 4    | -                                                                               |
| 242 | [docs/SLASH_COMMANDS_REFERENCE.md](docs/SLASH_COMMANDS_REFERENCE.md)                                                                                                                       | Slash Commands Reference                                           | 4    | ACTIVE                                                                          |
| 243 | [docs/SONARCLOUD_CLEANUP_RUNBOOK.md](docs/SONARCLOUD_CLEANUP_RUNBOOK.md)                                                                                                                   | SonarCloud Cleanup Sprint Runbook                                  | 2    | -                                                                               |
| 244 | [docs/technical-debt/FINAL_SYSTEM_AUDIT.md](docs/technical-debt/FINAL_SYSTEM_AUDIT.md)                                                                                                     | TDMS Final System Audit                                            | 3    | ACTIVE                                                                          |
| 245 | [docs/technical-debt/INDEX.md](docs/technical-debt/INDEX.md)                                                                                                                               | Technical Debt Index                                               | 3    | ACTIVE                                                                          |
| 246 | [docs/technical-debt/METRICS.md](docs/technical-debt/METRICS.md)                                                                                                                           | Technical Debt Metrics                                             | 3    | ACTIVE                                                                          |
| 247 | [docs/technical-debt/PROCEDURE.md](docs/technical-debt/PROCEDURE.md)                                                                                                                       | Technical Debt Management System - Procedure Guide                 | 3    | ACTIVE                                                                          |
| 248 | [docs/technical-debt/views/by-category.md](docs/technical-debt/views/by-category.md)                                                                                                       | Technical Debt by Category                                         | 4    | ACTIVE                                                                          |
| 249 | [docs/technical-debt/views/by-severity.md](docs/technical-debt/views/by-severity.md)                                                                                                       | Technical Debt by Severity                                         | 4    | ACTIVE                                                                          |
| 250 | [docs/technical-debt/views/by-status.md](docs/technical-debt/views/by-status.md)                                                                                                           | Technical Debt by Status                                           | 4    | ACTIVE                                                                          |
| 251 | [docs/technical-debt/views/unplaced-items.md](docs/technical-debt/views/unplaced-items.md)                                                                                                 | Unplaced Technical Debt Items                                      | 4    | ACTIVE                                                                          |
| 252 | [docs/technical-debt/views/verification-queue.md](docs/technical-debt/views/verification-queue.md)                                                                                         | Verification Queue                                                 | 4    | ACTIVE                                                                          |
| 253 | [docs/templates/CANON_QUICK_REFERENCE.md](docs/templates/CANON_QUICK_REFERENCE.md)                                                                                                         | CANON Quick Reference Card                                         | 3    | -                                                                               |
| 254 | [docs/templates/CANONICAL_DOC_TEMPLATE.md](docs/templates/CANONICAL_DOC_TEMPLATE.md)                                                                                                       | \[Document Title\]                                                 | 3    | -                                                                               |
| 255 | [docs/templates/FOUNDATION_DOC_TEMPLATE.md](docs/templates/FOUNDATION_DOC_TEMPLATE.md)                                                                                                     | \[Document Title\]                                                 | 3    | -                                                                               |
| 256 | [docs/templates/GUIDE_DOC_TEMPLATE.md](docs/templates/GUIDE_DOC_TEMPLATE.md)                                                                                                               | How to \[Accomplish Task\]                                         | 3    | -                                                                               |
| 257 | [docs/templates/JSONL_SCHEMA_STANDARD.md](docs/templates/JSONL_SCHEMA_STANDARD.md)                                                                                                         | Multi-AI Review JSONL Schema Standard                              | 3    | -                                                                               |
| 258 | [docs/templates/PLANNING_DOC_TEMPLATE.md](docs/templates/PLANNING_DOC_TEMPLATE.md)                                                                                                         | \[Feature/Initiative Name\] Plan                                   | 3    | -                                                                               |
| 259 | [docs/templates/REFERENCE_DOC_TEMPLATE.md](docs/templates/REFERENCE_DOC_TEMPLATE.md)                                                                                                       | \[Workflow/Reference Name\]                                        | 3    | -                                                                               |
| 260 | [docs/TESTING_PLAN.md](docs/TESTING_PLAN.md)                                                                                                                                               | Testing Plan                                                       | 3    | Active **Last Updated:** 2026-01-20                                             |
| 261 | [docs/TRIGGERS.md](docs/TRIGGERS.md)                                                                                                                                                       | TRIGGERS.md - Automation &amp; Enforcement Reference               | 4    | DRAFT \| ACTIVE \| DEPRECATED                                                   |
| 262 | [README.md](README.md)                                                                                                                                                                     | SoNash - Sober Nashville Recovery Notebook                         | 1    | ACTIVE **Last Updated:** 2026-01-03                                             |
| 263 | [ROADMAP_FUTURE.md](ROADMAP_FUTURE.md)                                                                                                                                                     | SoNash Future Roadmap                                              | 1    | ACTIVE                                                                          |
| 264 | [ROADMAP_LOG.md](ROADMAP_LOG.md)                                                                                                                                                           | SoNash Roadmap Log                                                 | 1    | ACTIVE \(append-only archive\) \*\*Last                                         |
| 265 | [ROADMAP.md](ROADMAP.md)                                                                                                                                                                   | SoNash Product Roadmap                                             | 1    | ACTIVE                                                                          |
| 266 | [scripts/README.md](scripts/README.md)                                                                                                                                                     | Scripts Reference                                                  | 4    | -                                                                               |
| 267 | [SESSION_CONTEXT.md](SESSION_CONTEXT.md)                                                                                                                                                   | Session Context                                                    | 4    | -                                                                               |

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
| 46  | [docs/archive/REVIEWS_42-60.md](docs/archive/REVIEWS_42-60.md)                                                                                                                                                                               |
| 47  | [docs/archive/REVIEWS_61-100.md](docs/archive/REVIEWS_61-100.md)                                                                                                                                                                             |
| 48  | [docs/archive/Refactoring_PR_Plan.md](docs/archive/Refactoring_PR_Plan.md)                                                                                                                                                                   |
| 49  | [docs/archive/SUPABASE_MIGRATION_ANALYSIS.md](docs/archive/SUPABASE_MIGRATION_ANALYSIS.md)                                                                                                                                                   |
| 50  | [docs/archive/SoNash_Code_Review_Consolidated**v1_0**2025-12-23.md](docs/archive/SoNash_Code_Review_Consolidated__v1_0__2025-12-23.md)                                                                                                       |
| 51  | [docs/archive/SoNash_Technical_Ideation_Multi_AI 1.20.26.md](docs/archive/SoNash_Technical_Ideation_Multi_AI%201.20.26.md)                                                                                                                   |
| 52  | [docs/archive/SoNash**AdminPanelEnhancement**v1_0\_\_2024-12-22.md](docs/archive/SoNash__AdminPanelEnhancement__v1_0__2024-12-22.md)                                                                                                         |
| 53  | [docs/archive/SoNash**AdminPanelEnhancement**v1_1\_\_2025-12-22.md](docs/archive/SoNash__AdminPanelEnhancement__v1_1__2025-12-22.md)                                                                                                         |
| 54  | [docs/archive/SoNash**AdminPanelEnhancement**v1_2\_\_2025-12-22.md](docs/archive/SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)                                                                                                         |
| 55  | [docs/archive/SoNash**Phase1_ClaudeCode_Prompt**2025-12-22.md](docs/archive/SoNash__Phase1_ClaudeCode_Prompt__2025-12-22.md)                                                                                                                 |
| 56  | [docs/archive/SoNash**Phase1_ClaudeCode_Prompt**v1_2\_\_2025-12-22.md](docs/archive/SoNash__Phase1_ClaudeCode_Prompt__v1_2__2025-12-22.md)                                                                                                   |
| 57  | [docs/archive/SoNash**Phase1_ClaudeCode_Prompt**v1_3\_\_2025-12-22.md](docs/archive/SoNash__Phase1_ClaudeCode_Prompt__v1_3__2025-12-22.md)                                                                                                   |
| 58  | [docs/archive/TESTING_CHECKLIST.md](docs/archive/TESTING_CHECKLIST.md)                                                                                                                                                                       |
| 59  | [docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_ANALYSIS.md](docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_ANALYSIS.md)                                                                                           |
| 60  | [docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_REFERENCE.md](docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_REFERENCE.md)                                                                                         |
| 61  | [docs/archive/completed-decisions/ADR-001-integrated-improvement-plan-approach.md](docs/archive/completed-decisions/ADR-001-integrated-improvement-plan-approach.md)                                                                         |
| 62  | [docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md](docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md)                                                                                                     |
| 63  | [docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md](docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md)                                                                                                                       |
| 64  | [docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md](docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md)                                                                                                                   |
| 65  | [docs/archive/completed-plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md](docs/archive/completed-plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md)                                                                                               |
| 66  | [docs/archive/completed-plans/TRACK_A_TESTING_CHECKLIST.md](docs/archive/completed-plans/TRACK_A_TESTING_CHECKLIST.md)                                                                                                                       |
| 67  | [docs/archive/completed-plans/sonarcloud-cleanup-sprint.md](docs/archive/completed-plans/sonarcloud-cleanup-sprint.md)                                                                                                                       |
| 68  | [docs/archive/consolidated-2025-12-19/AI_HANDOFF.md](docs/archive/consolidated-2025-12-19/AI_HANDOFF.md)                                                                                                                                     |
| 69  | [docs/archive/consolidated-2025-12-19/AI_HANDOFF_2024-12-19.md](docs/archive/consolidated-2025-12-19/AI_HANDOFF_2024-12-19.md)                                                                                                               |
| 70  | [docs/archive/consolidated-2025-12-19/ARCHIVE_INDEX.md](docs/archive/consolidated-2025-12-19/ARCHIVE_INDEX.md)                                                                                                                               |
| 71  | [docs/archive/consolidated-2025-12-19/FEATURE_DECISIONS.md](docs/archive/consolidated-2025-12-19/FEATURE_DECISIONS.md)                                                                                                                       |
| 72  | [docs/archive/consolidated-2025-12-19/JOURNAL_SYSTEM_PROPOSAL.md](docs/archive/consolidated-2025-12-19/JOURNAL_SYSTEM_PROPOSAL.md)                                                                                                           |
| 73  | [docs/archive/consolidated-2025-12-19/PROJECT_STATUS.md](docs/archive/consolidated-2025-12-19/PROJECT_STATUS.md)                                                                                                                             |
| 74  | [docs/archive/consolidated-2025-12-19/ROADMAP_V3.md](docs/archive/consolidated-2025-12-19/ROADMAP_V3.md)                                                                                                                                     |
| 75  | [docs/archive/consolidated-2025-12-19/UNIFIED_JOURNAL_ARCHITECTURE.md](docs/archive/consolidated-2025-12-19/UNIFIED_JOURNAL_ARCHITECTURE.md)                                                                                                 |
| 76  | [docs/archive/consolidated-2025-12-19/WEB_ENHANCEMENTS_ROADMAP.md](docs/archive/consolidated-2025-12-19/WEB_ENHANCEMENTS_ROADMAP.md)                                                                                                         |
| 77  | [docs/archive/expansion-ideation/README.md](docs/archive/expansion-ideation/README.md)                                                                                                                                                       |
| 78  | [docs/archive/expansion-ideation/SoNash Expansion - Module 1 - Step Work Depth.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%201%20-%20Step%20Work%20Depth.md)                                                         |
| 79  | [docs/archive/expansion-ideation/SoNash Expansion - Module 10 – Safety &amp; Harm Reduction.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%2010%20%E2%80%93%20Safety%20&%20Harm%20Reduction.md)                         |
| 80  | [docs/archive/expansion-ideation/SoNash Expansion - Module 11 – Visionary - Dream Big Bets.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%2011%20%E2%80%93%20Visionary%20-%20Dream%20Big%20Bets.md)                     |
| 81  | [docs/archive/expansion-ideation/SoNash Expansion - Module 2 – Sponsor Tooling &amp; Connection.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%202%20%E2%80%93%20Sponsor%20Tooling%20&%20Connection.md)                 |
| 82  | [docs/archive/expansion-ideation/SoNash Expansion - Module 3 – Nashville Advantage \(Local Utility\).md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%203%20%E2%80%93%20Nashville%20Advantage%20%28Local%20Utility%29.md) |
| 83  | [docs/archive/expansion-ideation/SoNash Expansion - Module 4 – Offline, Privacy &amp; Trust.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%204%20%E2%80%93%20Offline,%20Privacy%20&%20Trust.md)                         |
| 84  | [docs/archive/expansion-ideation/SoNash Expansion - Module 5 – Journaling &amp; Insights.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%205%20%E2%80%93%20Journaling%20&%20Insights.md)                                 |
| 85  | [docs/archive/expansion-ideation/SoNash Expansion - Module 6 – Recovery Knowledge Base.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%206%20%E2%80%93%20Recovery%20Knowledge%20Base.md)                                 |
| 86  | [docs/archive/expansion-ideation/SoNash Expansion - Module 7 – Exports &amp; Reports.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%207%20%E2%80%93%20Exports%20&%20Reports.md)                                         |
| 87  | [docs/archive/expansion-ideation/SoNash Expansion - Module 8 – Personalization.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%208%20%E2%80%93%20Personalization.md)                                                     |
| 88  | [docs/archive/expansion-ideation/SoNash Expansion - Module 9 – Daily Engagement &amp; Habits.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Module%209%20%E2%80%93%20Daily%20Engagement%20&%20Habits.md)                       |
| 89  | [docs/archive/expansion-ideation/SoNash Expansion - Modules 12-14 The Final Gaps.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Modules%2012-14%20The%20Final%20Gaps.md)                                                       |
| 90  | [docs/archive/expansion-ideation/SoNash Expansion - Technical Modules.md](docs/archive/expansion-ideation/SoNash%20Expansion%20-%20Technical%20Modules.md)                                                                                   |
| 91  | [docs/archive/expansion-ideation/SoNash Expansion Full Ideation All Modules 1.20.26.md](docs/archive/expansion-ideation/SoNash%20Expansion%20Full%20Ideation%20All%20Modules%201.20.26.md)                                                   |
| 92  | [docs/archive/firestore-rules.md](docs/archive/firestore-rules.md)                                                                                                                                                                           |
| 93  | [docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-16.md](docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-16.md)                                                                                                                             |
| 94  | [docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-17.md](docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-17.md)                                                                                                                             |
| 95  | [docs/archive/handoffs-2025-12/AI_HANDOFF_2025_12_15.md](docs/archive/handoffs-2025-12/AI_HANDOFF_2025_12_15.md)                                                                                                                             |
| 96  | [docs/archive/handoffs-2025-12/HANDOFF-2025-12-17.md](docs/archive/handoffs-2025-12/HANDOFF-2025-12-17.md)                                                                                                                                   |
| 97  | [docs/archive/legacy_task_list_2025_12_12.md](docs/archive/legacy_task_list_2025_12_12.md)                                                                                                                                                   |
| 98  | [docs/archive/local-resources-review.md](docs/archive/local-resources-review.md)                                                                                                                                                             |
| 99  | [docs/archive/superseded-plans/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md](docs/archive/superseded-plans/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md)                                                                                                 |
| 100 | [docs/archive/superseded-plans/M1.6_SUPPORT_TAB_PLAN.md](docs/archive/superseded-plans/M1.6_SUPPORT_TAB_PLAN.md)                                                                                                                             |

</details>

---

## Version History

| Version | Date       | Changes                           |
| ------- | ---------- | --------------------------------- |
| Auto    | 2026-02-17 | Auto-generated from codebase scan |

---

_Generated by `scripts/generate-documentation-index.js`_
