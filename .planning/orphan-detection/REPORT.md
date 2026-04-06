# Orphan Detection Report

**Generated:** 2026-04-06 **Total findings:** 350

## Summary

| Category    | Count   | HIGH  | MEDIUM  | LOW    |
| ----------- | ------- | ----- | ------- | ------ |
| scripts     | 52      | 7     | 45      | 0      |
| state-files | 9       | 0     | 9       | 0      |
| agents      | 31      | 0     | 31      | 0      |
| skills      | 31      | 0     | 31      | 0      |
| docs        | 213     | 0     | 213     | 0      |
| planning    | 5       | 0     | 1       | 4      |
| research    | 9       | 0     | 2       | 7      |
| **Total**   | **350** | **7** | **332** | **11** |

## Changes Since Last Run

- **New:** 35
- **Resolved:** 0
- **Unchanged:** 315

## Scripts

| File                                            | Confidence | Action | Reason                                                       | Last Modified |
| ----------------------------------------------- | ---------- | ------ | ------------------------------------------------------------ | ------------- |
| scripts/audit/transform-jsonl-schema.js         | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/audit/validate-audit-integration.js     | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/check-cyclomatic-cc.js                  | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 0d ago        |
| scripts/check-propagation-staged.js             | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 0d ago        |
| scripts/debt/check-phase-status.js              | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 55d ago       |
| scripts/debt/clean-intake.js                    | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/debt/dedup-multi-pass.js                | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 4d ago        |
| scripts/debt/escalate-deferred.js               | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 34d ago       |
| scripts/debt/extract-audit-reports.js           | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/debt/extract-audits.js                  | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/debt/extract-context-debt.js            | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/debt/extract-reviews.js                 | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/debt/extract-roadmap-debt.js            | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/debt/extract-scattered-debt.js          | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/debt/ingest-cleaned-intake.js           | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 37d ago       |
| scripts/debt/intake-manual.js                   | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 18d ago       |
| scripts/debt/intake-pr-deferred.js              | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 18d ago       |
| scripts/debt/normalize-all.js                   | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 4d ago        |
| scripts/debt/process-review-needed.js           | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/debt/reconcile-roadmap.js               | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/debt/resolve-item.js                    | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/debt/sync-sonarcloud.js                 | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 16d ago       |
| scripts/generate-claude-antipatterns.js         | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 35d ago       |
| scripts/generate-fix-template-stubs.js          | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 35d ago       |
| scripts/health/lib/health-log.js                | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 34d ago       |
| scripts/health/lib/mid-session-alerts.js        | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 10d ago       |
| scripts/hook-report.js                          | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 0d ago        |
| scripts/lib/ai-pattern-checks.js                | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 54d ago       |
| scripts/lib/confidence-classifier.js            | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 22d ago       |
| scripts/lib/learning-router.js                  | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 22d ago       |
| scripts/metrics/dedup-review-metrics.js         | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 6d ago        |
| scripts/multi-ai/extract-agent-findings.js      | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/planning/backfill-tenet-evidence.js     | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 10d ago       |
| scripts/planning/generate-decisions.js          | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 32d ago       |
| scripts/planning/generate-discovery-record.js   | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 32d ago       |
| scripts/ratchet-baselines.js                    | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 22d ago       |
| scripts/refine-scaffolds.js                     | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 22d ago       |
| scripts/resolve-hook-warnings.js                | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 3d ago        |
| scripts/reviews/compute-changelog-metrics.js    | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 10d ago       |
| scripts/reviews/validate-jsonl-schemas.js       | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 18d ago       |
| scripts/rotate-jsonl.js                         | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 22d ago       |
| scripts/run-github-health.js                    | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 0d ago        |
| scripts/secrets/decrypt-secrets.js              | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/secrets/encrypt-secrets.js              | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 38d ago       |
| scripts/tasks/resolve-dependencies.js           | MEDIUM     | review | No incoming references from other scripts, package.json, ... | 24d ago       |
| scripts/archive/audit-s0-promotions.js **NEW**  | HIGH       | delete | In archive/ with no references                               | n/a           |
| scripts/archive/backfill-hashes.js **NEW**      | HIGH       | delete | In archive/ with no references                               | n/a           |
| scripts/archive/decompose-state.js **NEW**      | HIGH       | delete | In archive/ with no references                               | n/a           |
| scripts/archive/migrate-ecosystem-v2.js **NEW** | HIGH       | delete | In archive/ with no references                               | n/a           |
| scripts/archive/migrate-retros.js **NEW**       | HIGH       | delete | In archive/ with no references                               | n/a           |
| scripts/archive/repair-archives.js **NEW**      | HIGH       | delete | In archive/ with no references                               | n/a           |
| scripts/archive/reverify-resolved.js **NEW**    | HIGH       | delete | In archive/ with no references                               | n/a           |

## State-files

| File                                                               | Confidence | Action | Reason                                                   | Last Modified |
| ------------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------- | ------------- |
| .claude/state/agent-token-usage.jsonl                              | MEDIUM     | review | State file not referenced by any script, hook, or skill  | 12d ago       |
| .claude/state/brainstorm-t5-research.md                            | MEDIUM     | review | State file not referenced by any script, hook, or skill  | 3d ago        |
| .claude/state/deep-plan.orphan-detection.state.json                | MEDIUM     | delete | Session state file not referenced by any script or skill | n/a           |
| .claude/state/deep-research.debt-runner-expansion.state.json       | MEDIUM     | delete | Session state file not referenced by any script or skill | 8d ago        |
| .claude/state/deep-research.multi-layer-memory.state.json          | MEDIUM     | delete | Session state file not referenced by any script or skill | 5d ago        |
| .claude/state/deep-research.research-discovery-standard.state.json | MEDIUM     | delete | Session state file not referenced by any script or skill | n/a           |
| .claude/state/hook-warnings-log.jsonl.archive                      | MEDIUM     | review | State file not referenced by any script, hook, or skill  | 0d ago        |
| .claude/state/work-locale-sync-plan.md                             | MEDIUM     | review | State file not referenced by any script, hook, or skill  | 14d ago       |
| .claude/state/worktree-planning.state.json                         | MEDIUM     | review | State file not referenced by any script, hook, or skill  | n/a           |

## Agents

| File                                              | Confidence | Action | Reason                                                       | Last Modified |
| ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------ | ------------- |
| .claude/agents/backend-architect.md               | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/database-architect.md              | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/dependency-manager.md              | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/deployment-engineer.md             | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/devops-troubleshooter.md           | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/error-detective.md                 | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/explore.md                         | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/fullstack-developer.md             | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/git-flow-manager.md                | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/markdown-syntax-formatter.md       | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/mcp-expert.md                      | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/nextjs-architecture-expert.md      | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/penetration-tester.md              | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/pr-test-analyzer.md                | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/prompt-engineer.md                 | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/react-performance-optimization.md  | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/security-engineer.md               | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/silent-failure-hunter.md           | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/technical-writer.md                | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/ui-ux-designer.md                  | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 4d ago        |
| .claude/agents/global/gsd-codebase-mapper.md      | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-debugger.md             | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-executor.md             | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-integration-checker.md  | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-phase-researcher.md     | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-plan-checker.md         | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-planner.md              | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-project-researcher.md   | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-research-synthesizer.md | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-roadmapper.md           | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |
| .claude/agents/global/gsd-verifier.md             | MEDIUM     | review | Agent not referenced by any skill, other agent, or CLAUDE.md | 12d ago       |

## Skills

| File                                           | Confidence | Action | Reason                                                     | Last Modified |
| ---------------------------------------------- | ---------- | ------ | ---------------------------------------------------------- | ------------- |
| .claude/skills/artifacts-builder/              | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 16d ago       |
| .claude/skills/audit-agent-quality/            | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 19d ago       |
| .claude/skills/audit-aggregator/               | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/audit-ai-optimization/          | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/audit-engineering-productivity/ | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/audit-enhancements/             | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 14d ago       |
| .claude/skills/audit-health/                   | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/comprehensive-ecosystem-audit/  | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 17d ago       |
| .claude/skills/content-research-writer/        | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/data-effectiveness-audit/       | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 21d ago       |
| .claude/skills/debt-runner/                    | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 21d ago       |
| .claude/skills/decrypt-secrets/                | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/developer-growth-analysis/      | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/doc-ecosystem-audit/            | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 10d ago       |
| .claude/skills/excel-analysis/                 | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/gh-fix-ci/                      | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/health-ecosystem-audit/         | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 12d ago       |
| .claude/skills/hook-ecosystem-audit/           | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 12d ago       |
| .claude/skills/market-research-reports/        | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/mcp-builder/                    | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 17d ago       |
| .claude/skills/pr-ecosystem-audit/             | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 10d ago       |
| .claude/skills/script-ecosystem-audit/         | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 17d ago       |
| .claude/skills/session-ecosystem-audit/        | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 10d ago       |
| .claude/skills/skill-ecosystem-audit/          | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 10d ago       |
| .claude/skills/sonash-context/                 | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 4d ago        |
| .claude/skills/tdms-ecosystem-audit/           | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 10d ago       |
| .claude/skills/ui-design-system/               | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/using-superpowers/              | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/ux-researcher-designer/         | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/validate-claude-folder/         | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |
| .claude/skills/webapp-testing/                 | MEDIUM     | review | Skill not referenced by other skills, agents, or CLAUDE.md | 39d ago       |

## Docs

| File                                                                                                        | Confidence | Action | Reason                                    | Last Modified |
| ----------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------- | ------------- |
| docs/ADMIN_PANEL_SECURITY_MONITORING_REQUIREMENTS.md                                                        | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/agent_docs/AGENT_ORCHESTRATION.md                                                                      | MEDIUM     | review | Document not referenced by any other file | 12d ago       |
| docs/agent_docs/CONTEXT_PRESERVATION.md                                                                     | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/agent_docs/FIX_TEMPLATES.md                                                                            | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/agent_docs/POSITIVE_PATTERNS.md                                                                        | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/agent_docs/PRE_GENERATION_CHECKLIST.md                                                                 | MEDIUM     | review | Document not referenced by any other file | 22d ago       |
| docs/agent_docs/SECURITY_CHECKLIST.md                                                                       | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/agent_docs/SKILL_AGENT_POLICY.md                                                                       | MEDIUM     | review | Document not referenced by any other file | 39d ago       |
| docs/agent_docs/SKILL_ECOSYSTEM_AUDIT_IDEAS.md                                                              | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/agent_docs/TESTING_SYSTEM.md                                                                           | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/agent_docs/TOKEN_MONITORING.md                                                                         | MEDIUM     | review | Document not referenced by any other file | 12d ago       |
| docs/AI_REVIEW_LEARNINGS_LOG.md                                                                             | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/AI_REVIEW_PROCESS.md                                                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/APPCHECK_SETUP.md                                                                                      | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/archive/2025-dec-reports/AGGREGATED_6MODEL_REPORT.md                                                   | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/APP_CHECK_DIAGNOSIS.md                                                        | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/ARCHITECTURAL_REFACTOR.md                                                     | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/ARCHITECTURE_IMPROVEMENT_PLAN.md                                              | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/BILLING_ALERTS_SETUP.md                                                       | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/CODE_ANALYSIS_REPORT.md                                                       | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/CONSOLIDATED_CODE_ANALYSIS.md                                                 | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/DEPENDENCY_ANALYSIS.md                                                        | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/ESLINT_WARNINGS_PLAN.md                                                       | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/JOURNAL_SYSTEM_UPDATE.md                                                      | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/LIBRARY_ANALYSIS.md                                                           | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/REFACTORING_ACTION_PLAN.md                                                    | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/REFACTOR_SUMMARY.md                                                           | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/ROADMAP_COMPARISON_ANALYSIS.md                                                | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/ROADMAP_INTEGRATION_SUMMARY.md                                                | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/ULTRA_THINKING_REVIEW.md                                                      | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2025-dec-reports/XSS_PROTECTION_VERIFICATION.md                                                | MEDIUM     | review | Document not referenced by any other file | 43d ago       |
| docs/archive/2026-02-21-sprint-workflow-skill-design.md                                                     | MEDIUM     | review | Document not referenced by any other file | 24d ago       |
| docs/archive/2026-jan-deprecated/ANTIGRAVITY_GUIDE.md                                                       | MEDIUM     | review | Document not referenced by any other file | 82d ago       |
| docs/archive/2026-jan-deprecated/ARCHIVE_NOTE.md                                                            | MEDIUM     | review | Document not referenced by any other file | 82d ago       |
| docs/archive/2026-jan-deprecated/brainstorm/PR_REVIEW_IMPROVEMENT_OPTIONS.md                                | MEDIUM     | review | Document not referenced by any other file | 82d ago       |
| docs/archive/2026-jan-deprecated/brainstorm/REVIEW_POLICY_EXPANSION_DRAFT.md                                | MEDIUM     | review | Document not referenced by any other file | 82d ago       |
| docs/archive/2026-jan-deprecated/CUSTOM_SLASH_COMMANDS_GUIDE.md                                             | MEDIUM     | review | Document not referenced by any other file | 80d ago       |
| docs/archive/2026-jan-deprecated/PR_REVIEW_PROMPT_TEMPLATE.md                                               | MEDIUM     | review | Document not referenced by any other file | 82d ago       |
| docs/archive/2026-jan-deprecated/ROADMAP_INTEGRATION.md                                                     | MEDIUM     | review | Document not referenced by any other file | 71d ago       |
| docs/archive/2026-jan-deprecated/SLASH_COMMANDS.md                                                          | MEDIUM     | review | Document not referenced by any other file | 80d ago       |
| docs/archive/aggregation/MASTER_ISSUE_LIST.md **NEW**                                                       | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/aggregation/mining-agent1-data-quality.md **NEW**                                              | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/aggregation/mining-agent2-pipeline-flow.md **NEW**                                             | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/aggregation/mining-agent3-retro-actions.md **NEW**                                             | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/aggregation/mining-agent4-integration.md **NEW**                                               | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/aggregation/PR_ECOSYSTEM_DIAGNOSIS.md **NEW**                                                  | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/AI_HANDOFF-2026-01-02.md                                                                       | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/AI_STANDARDIZED_REPORT.md                                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/APPCHECK_FRESH_SETUP.md                                                                        | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_ANALYSIS.md                                     | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/architecture-reviews-dec-2025/AI_FEATURE_IDEAS_REFERENCE.md                                    | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/ARCHIVE_INDEX.md                                                                               | MEDIUM     | review | Document not referenced by any other file | 59d ago       |
| docs/archive/audits/comprehensive/audit-2026-02-22/ai-optimization-audit.md **NEW**                         | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/code-audit.md **NEW**                                    | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/COMPREHENSIVE_AUDIT_REPORT.md **NEW**                    | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/DEDUP_VS_MASTER_DEBT.md **NEW**                          | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/documentation-audit.md **NEW**                           | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/engineering-productivity-audit.md **NEW**                | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/enhancements-audit.md **NEW**                            | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/MASTER_DEBT_DEDUP_REPORT.md **NEW**                      | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/performance-audit.md **NEW**                             | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/process-audit.md **NEW**                                 | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/refactoring-audit.md **NEW**                             | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/REVIEW_DECISIONS.md **NEW**                              | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/comprehensive/audit-2026-02-22/security-audit.md **NEW**                                | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/multi-ai/maa-2026-02-17-182d43/final/SUMMARY.md **NEW**                                 | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/single-session/agent-quality/audit-2026-03-17/AGENT_QUALITY_REPORT.md **NEW**           | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/single-session/ai-optimization/audit-2026-02-12-legacy/SUMMARY.md **NEW**               | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/single-session/ai-optimization/audit-2026-02-13/SUMMARY.md **NEW**                      | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/single-session/ai-optimization/audit-2026-02-14/AI_OPTIMIZATION_AUDIT_REPORT.md **NEW** | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/single-session/ai-optimization/audit-2026-02-14/REVIEW_DECISIONS.md **NEW**             | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md **NEW**              | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/system-test/audit-2026-02-19/PLAN_INDEX.md **NEW**                                      | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/audits/system-test/audit-2026-02-19/REVIEW_DECISIONS.md **NEW**                                | MEDIUM     | review | Document not referenced by any other file | n/a           |
| docs/archive/ChatGPT_Multi_AI_Refactoring_Plan_Chat.md                                                      | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/archive/completed-decisions/ADR-001-integrated-improvement-plan-approach.md                            | MEDIUM     | review | Document not referenced by any other file | 75d ago       |
| docs/archive/completed-plans/DOCUMENTATION_STANDARDIZATION_PLAN.md                                          | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/completed-plans/EIGHT_PHASE_REFACTOR_PLAN.md                                                   | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/completed-plans/INTEGRATED_IMPROVEMENT_PLAN.md                                                 | MEDIUM     | review | Document not referenced by any other file | 81d ago       |
| docs/archive/completed-plans/sonarcloud-cleanup-sprint.md                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/archive/completed-plans/TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md                                       | MEDIUM     | review | Document not referenced by any other file | 48d ago       |
| docs/archive/completed-plans/TRACK_A_TESTING_CHECKLIST.md                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/archive/consolidated-2025-12-19/AI_HANDOFF.md                                                          | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/AI_HANDOFF_2024-12-19.md                                               | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/ARCHIVE_INDEX.md                                                       | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/FEATURE_DECISIONS.md                                                   | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/JOURNAL_SYSTEM_PROPOSAL.md                                             | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/PROJECT_STATUS.md                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/ROADMAP_V3.md                                                          | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/UNIFIED_JOURNAL_ARCHITECTURE.md                                        | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/consolidated-2025-12-19/WEB_ENHANCEMENTS_ROADMAP.md                                            | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/expansion-ideation/README.md                                                                   | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 1 - Step Work Depth.md                            | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 10 – Safety & Harm Reduction.md                   | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 11 – Visionary - Dream Big Bets.md                | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 2 – Sponsor Tooling & Connection.md               | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 3 – Nashville Advantage (Local Utility).md        | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 4 – Offline, Privacy & Trust.md                   | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 5 – Journaling & Insights.md                      | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 6 – Recovery Knowledge Base.md                    | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 7 – Exports & Reports.md                          | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 8 – Personalization.md                            | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Module 9 – Daily Engagement & Habits.md                  | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Modules 12-14 The Final Gaps.md                          | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion - Technical Modules.md                                     | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/expansion-ideation/SoNash Expansion Full Ideation All Modules 1.20.26.md                       | MEDIUM     | review | Document not referenced by any other file | 67d ago       |
| docs/archive/EXPANSION_EVALUATION_TRACKER.md                                                                | MEDIUM     | review | Document not referenced by any other file | 50d ago       |
| docs/archive/firestore-rules.md                                                                             | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/GitHub_Code_Analysis_and_Review_Prompt.md                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-16.md                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/handoffs-2025-12/AI_HANDOFF-2025-12-17.md                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/handoffs-2025-12/AI_HANDOFF_2025_12_15.md                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/handoffs-2025-12/HANDOFF-2025-12-17.md                                                         | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/HOOKIFY_STRATEGY.md                                                                            | MEDIUM     | review | Document not referenced by any other file | 51d ago       |
| docs/archive/IMPLEMENTATION_PROMPTS.md                                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/legacy_task_list_2025_12_12.md                                                                 | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/local-resources-review.md                                                                      | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/MCP_SERVER_AUDIT.md                                                                            | MEDIUM     | review | Document not referenced by any other file | 51d ago       |
| docs/archive/Monetization_Research_Phase1_Results.md                                                        | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/PLAN_MAP.md                                                                                    | MEDIUM     | review | Document not referenced by any other file | 51d ago       |
| docs/archive/RECAPTCHA_PROBLEM_SUMMARY.md                                                                   | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/Refactoring_PR_Plan.md                                                                         | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/RETROS_378-416.md                                                                              | MEDIUM     | review | Document not referenced by any other file | 30d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_1-40.md                                                        | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_139-195.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_196-259.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_260-299.md                                                     | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_300-341.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_342-383.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_384-423.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_390-476.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_42-138.md                                                      | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/reviews-markdown-legacy/REVIEWS_424-457.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/archive/SoNash_Code_Review_Consolidated**v1_0**2025-12-23.md                                           | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SoNash_Technical_Ideation_Multi_AI 1.20.26.md                                                  | MEDIUM     | review | Document not referenced by any other file | 51d ago       |
| docs/archive/SoNash**AdminPanelEnhancement**v1_0\_\_2024-12-22.md                                           | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SoNash**AdminPanelEnhancement**v1_1\_\_2025-12-22.md                                           | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SoNash**AdminPanelEnhancement**v1_2\_\_2025-12-22.md                                           | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SoNash**Phase1_ClaudeCode_Prompt**2025-12-22.md                                                | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SoNash**Phase1_ClaudeCode_Prompt**v1_2\_\_2025-12-22.md                                        | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SoNash**Phase1_ClaudeCode_Prompt**v1_3\_\_2025-12-22.md                                        | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/SUPABASE_MIGRATION_ANALYSIS.md                                                                 | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/archive/superseded-plans/LOCAL_RESOURCES_IMPLEMENTATION_PLAN.md                                        | MEDIUM     | review | Document not referenced by any other file | 75d ago       |
| docs/archive/superseded-plans/M1.6_SUPPORT_TAB_PLAN.md                                                      | MEDIUM     | review | Document not referenced by any other file | 75d ago       |
| docs/archive/TESTING_CHECKLIST.md                                                                           | MEDIUM     | review | Document not referenced by any other file | 83d ago       |
| docs/audits/AUDIT_ECOSYSTEM_CODIFICATION.md                                                                 | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/AUDIT_STANDARDS.md                                                                              | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/AUDIT_TRACKER.md                                                                                | MEDIUM     | review | Document not referenced by any other file | 19d ago       |
| docs/audits/multi-ai/COORDINATOR.md                                                                         | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/README.md                                                                              | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/audits/multi-ai/templates/AGGREGATOR.md                                                                | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/AI_OPTIMIZATION_AUDIT.md                                                     | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/CODE_REVIEW_AUDIT.md                                                         | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/DOCUMENTATION_AUDIT.md                                                       | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/ENGINEERING_PRODUCTIVITY_AUDIT.md                                            | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/ENHANCEMENT_AUDIT.md                                                         | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/PERFORMANCE_AUDIT.md                                                         | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/PROCESS_AUDIT.md                                                             | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/REFACTORING_AUDIT.md                                                         | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/SECURITY_AUDIT.md                                                            | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/multi-ai/templates/SHARED_TEMPLATE_BASE.md                                                      | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/README.md                                                                                       | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/audits/RESULTS_INDEX.md                                                                                | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/CLI_USER_GUIDE.md                                                                                      | MEDIUM     | review | Document not referenced by any other file | 8d ago        |
| docs/decisions/README.md                                                                                    | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/DOCUMENT_DEPENDENCIES.md                                                                               | MEDIUM     | review | Document not referenced by any other file | 24d ago       |
| docs/FIREBASE_CHANGE_POLICY.md                                                                              | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/GITHUB_GUIDE.md                                                                                        | MEDIUM     | review | Document not referenced by any other file | 18d ago       |
| docs/GLOBAL_SECURITY_STANDARDS.md                                                                           | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/INCIDENT_RESPONSE.md                                                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/LEARNING_METRICS.md                                                                                    | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/MCP_SETUP.md                                                                                           | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/OPERATIONAL_VISIBILITY_SPRINT.md                                                                       | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/patterns/context-preservation-pattern.md                                                               | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/plans/IMPLEMENTATION_PLAN.md                                                                           | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/plans/LIGHTHOUSE_INTEGRATION_PLAN.md                                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/plans/TESTING_INFRASTRUCTURE_CHECKLIST.md                                                              | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/plans/TESTING_USER_MANUAL.md                                                                           | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/plans/TRACK_A_TESTING_CHECKLIST.md                                                                     | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/PR_ECOSYSTEM_V2_CHANGELOG.md                                                                           | MEDIUM     | review | Document not referenced by any other file | 29d ago       |
| docs/PR_WORKFLOW_CHECKLIST.md                                                                               | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/README.md                                                                                              | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/RECAPTCHA_REMOVAL_GUIDE.md                                                                             | MEDIUM     | review | Document not referenced by any other file | 50d ago       |
| docs/REVIEW_POLICY_ARCHITECTURE.md                                                                          | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/REVIEW_POLICY_INDEX.md                                                                                 | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/REVIEW_POLICY_QUICK_REF.md                                                                             | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/REVIEW_POLICY_VISUAL_GUIDE.md                                                                          | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/SENTRY_INTEGRATION_GUIDE.md                                                                            | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/SERVER_SIDE_SECURITY.md                                                                                | MEDIUM     | review | Document not referenced by any other file | 80d ago       |
| docs/SESSION_DECISIONS.md                                                                                   | MEDIUM     | review | Document not referenced by any other file | 71d ago       |
| docs/SESSION_HISTORY.md                                                                                     | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/SLASH_COMMANDS_REFERENCE.md                                                                            | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/SONARCLOUD_CLEANUP_RUNBOOK.md                                                                          | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/superpowers/plans/2026-03-14-automation-gap-closure.md                                                 | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/superpowers/specs/2026-03-14-automation-gap-closure-design.md                                          | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/superpowers/specs/sws reevaluation conversation.md                                                     | MEDIUM     | review | Document not referenced by any other file | 21d ago       |
| docs/technical-debt/FINAL_SYSTEM_AUDIT.md                                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/technical-debt/INDEX.md                                                                                | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/technical-debt/METRICS.md                                                                              | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/technical-debt/views/by-category.md                                                                    | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/technical-debt/views/by-severity.md                                                                    | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/technical-debt/views/by-status.md                                                                      | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/technical-debt/views/unplaced-items.md                                                                 | MEDIUM     | review | Document not referenced by any other file | 62d ago       |
| docs/technical-debt/views/verification-queue.md                                                             | MEDIUM     | review | Document not referenced by any other file | 0d ago        |
| docs/templates/CANONICAL_DOC_TEMPLATE.md                                                                    | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/templates/CANON_QUICK_REFERENCE.md                                                                     | MEDIUM     | review | Document not referenced by any other file | 41d ago       |
| docs/templates/FOUNDATION_DOC_TEMPLATE.md                                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/templates/GUIDE_DOC_TEMPLATE.md                                                                        | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/templates/PLANNING_DOC_TEMPLATE.md                                                                     | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/templates/REFERENCE_DOC_TEMPLATE.md                                                                    | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/templates/TEMPLATE.md                                                                                  | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/TESTING_CHECKLIST.md                                                                                   | MEDIUM     | review | Document not referenced by any other file | 17d ago       |
| docs/TRIGGERS.md                                                                                            | MEDIUM     | review | Document not referenced by any other file | 6d ago        |

## Planning

| File                                   | Confidence | Action  | Reason                                                       | Last Modified |
| -------------------------------------- | ---------- | ------- | ------------------------------------------------------------ | ------------- |
| .planning/github-health-skill/         | MEDIUM     | archive | Planning directory for completed todo, no active references  | 1d ago        |
| .planning/jason-os/                    | LOW        | review  | Planning directory with no matching todo and no active re... | 1d ago        |
| .planning/orphan-detection/            | LOW        | review  | Planning directory with no matching todo and no active re... | n/a           |
| .planning/research-discovery-standard/ | LOW        | review  | Planning directory with no matching todo and no active re... | 11d ago       |
| .planning/system-wide-standardization/ | LOW        | review  | Planning directory with no matching todo and no active re... | 11d ago       |

## Research

| File                                      | Confidence | Action  | Reason                                                       | Last Modified |
| ----------------------------------------- | ---------- | ------- | ------------------------------------------------------------ | ------------- |
| .research/github-health/                  | MEDIUM     | archive | Research directory for completed initiative, no active re... | 3d ago        |
| .research/repo-analysis/                  | MEDIUM     | archive | Research directory for completed initiative, no active re... | 2d ago        |
| .research/debt-runner-expansion/          | LOW        | review  | Research directory with no matching todo and no active re... | 3d ago        |
| .research/jason-os/                       | LOW        | review  | Research directory with no matching todo and no active re... | 1d ago        |
| .research/learning-analysis/              | LOW        | review  | Research directory with no matching todo and no active re... | 1d ago        |
| .research/learning-system-effectiveness/  | LOW        | review  | Research directory with no matching todo and no active re... | 2d ago        |
| .research/multi-layer-memory/             | LOW        | review  | Research directory with no matching todo and no active re... | 3d ago        |
| .research/research-discovery-standard/    | LOW        | review  | Research directory with no matching todo and no active re... | 1d ago        |
| .research/research-discovery-standard-v2/ | LOW        | review  | Research directory with no matching todo and no active re... | 0d ago        |
