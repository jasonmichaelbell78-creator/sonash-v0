# Decision Record: Tooling & Infrastructure Audit

**Date:** 2026-03-12 **Questions Asked:** 30 **Decisions Captured:** 30

---

## Security & Branch Protection

| #   | Decision                         | Choice                                                                               | Rationale                                                                                       |
| --- | -------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | Branch protection on main        | Standard — require PR + CI status checks, no human review required                   | Solo dev with 5 review bots; human reviews would block; PR + CI ensures bots catch issues       |
| 2   | Dependabot vulnerability alerts  | Enable immediately                                                                   | Security baseline with zero maintenance cost; currently getting version bumps but no CVE alerts |
| 3   | 30 open code scanning alerts     | Defer to Plan 2 (code quality overhaul)                                              | Plan 2 covers propagation, fragility, complexity — findings belong there                        |
| 4   | tj-actions/changed-files pinning | SHA-pin all instances + establish policy: all third-party actions must be SHA-pinned | CVE-2025-30066 inconsistency; ci.yml pinned but 2 workflows use tag-only @v47                   |

## GitHub Workflows

| #   | Decision                       | Choice                                                                                                           | Rationale                                                     |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 5   | SonarCloud workflow vs App     | Keep BOTH — workflow disabled for on-demand full-repo analysis, App for PR analysis                              | Different purposes; user toggles workflow for full-repo scans |
| 6   | Semgrep action                 | Migrate returntocorp/semgrep-action → semgrep/semgrep-action                                                     | Current action deprecated                                     |
| 7   | Dead workflow cleanup          | Trim dead code in backlog-enforcement + deploy-firebase; delete validate-plan.yml entirely                       | Remove dead jobs, keep workflows with active jobs             |
| 15  | Workflow bug fixes             | Fix all: cleanup-branches counter bug, pattern-compliance string comparison, deploy service account key handling | Small targeted fixes; deploy is a security improvement        |
| 16  | Action version standardization | Pin all to latest stable (checkout v6, setup-node v6, github-script v8) with SHA hashes                          | Standardize on latest AND pin                                 |

## Plugins & MCP

| #   | Decision                 | Choice                                                                                                                    | Rationale                                                                           |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 8   | Plugin-vs-agent strategy | Case-by-case evaluation                                                                                                   | Some functions better as plugins, others as custom agents                           |
| 9   | CodeRabbit plugin        | Remove from user settings                                                                                                 | Not configured, not active on PRs, 5 bots already reviewing                         |
| 10  | Hookify plugin           | Remove config entry from user settings                                                                                    | Dead config — set to false, never used                                              |
| 18  | Memory systems           | Remove MCP memory server from .mcp.json, keep file-based + episodic-memory. Update checkpoint skill to remove --mcp flag. | MCP memory nearly unused (1 skill, optional); file-based + episodic cover all needs |
| 19  | Serena MCP               | Remove entirely — .serena/project.yml, stop-serena-dashboard.js hook, any config references                               | Token hog, already disabled                                                         |

## Review Bots

| #   | Decision                 | Choice                                                                                                                                                               | Rationale                                                                                                |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 11  | Review bot configuration | Keep all 5 bots, configure to reduce overlap: create .qodo.yaml with category suppressions, configure Gemini for architectural focus, update copilot-instructions.md | Each bot catches different things; overlap exists in code review suggestions between Qodo/Gemini/Copilot |

## Custom Agents

| #   | Decision    | Choice                                                               | Rationale                                                                                                                                                                  |
| --- | ----------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | Agent audit | KEEP 5 project + 11 GSD global = 16 total. REMOVE 19 project agents. | Wrong-stack (7), covered by plugins/skills (8), irrelevant domain (2), combination (2). security-auditor, code-reviewer, documentation-expert kept for CLAUDE.md triggers. |

**KEEP (5 project):** nextjs-architecture-expert,
react-performance-optimization, security-auditor, code-reviewer,
documentation-expert

**REMOVE (19 project):** database-architect, fullstack-developer,
security-engineer, deployment-engineer, devops-troubleshooter, mcp-expert,
backend-architect, debugger, error-detective, frontend-developer,
penetration-tester, technical-writer, ui-ux-designer, dependency-manager,
markdown-syntax-formatter, test-engineer, performance-engineer, prompt-engineer,
git-flow-manager

**KEEP (11 global GSD):** All — coherent interconnected system

## Skills

| #   | Decision            | Choice                                                                                   | Rationale                                                                     |
| --- | ------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 13  | Skill consolidation | Flag obvious bloat/orphans only — defer deep consolidation to standardization initiative | Full audit would be enormous; standardization initiative is the right vehicle |

## Marketplaces

| #   | Decision            | Choice                                                                                                                               | Rationale                                                                                          |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 14  | Marketplace sources | Keep all 5 (claude-plugins-official, superpowers-marketplace, anthropic-agent-skills, claude-code-plugins, claude-code-plugins-plus) | All provide some value; claude-code-plugins-plus is quantity-over-quality but useful for discovery |

## npm Scripts & Hooks

| #   | Decision             | Choice                                                                                                                     | Rationale                              |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 17  | npm scripts cleanup  | Full audit of all ~140 scripts — test every script, remove dead, consolidate overlapping                                   | User wants comprehensive cleanup       |
| 20  | GSD hook duplication | Remove project-level gsd-check-update.js from settings.json — user-level hook handles it globally                          | Runs twice on every session start      |
| 29  | Husky pre-commit     | Add timing output, investigate oxlint double-run (lint-staged runs oxlint + ESLint Wave 1 also runs), keep everything else | Well-engineered, providing clear value |

## ESLint Plugin Sonash

| #   | Decision             | Choice                                                                                                                                                                                                                                                                          | Rationale                                                                                                                         |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 28  | eslint-plugin-sonash | Enable 4 Phase 3 rules: no-effect-missing-cleanup, no-async-component, no-missing-error-boundary, no-callback-in-effect-dep. Merge no-unguarded-loadconfig into no-unguarded-file-read. Remove no-unsafe-innerhtml + no-sql-injection. Skip enabling no-state-update-in-render. | Plugin provides substantial unique value (24/31 rules unique); optimize by enabling high-value rules and removing irrelevant ones |

## New Tooling Additions

| #   | Decision                 | Choice                                                                                                                                                                                      | Rationale                                                               |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 26  | New devDeps + GH Actions | Add: @next/bundle-analyzer, commitlint, @commitlint/config-conventional, typedoc. Add GH Action: compressed-size-action. Evaluate: unit-test-generator plugin. NO lighthouse-ci-action yet. | Best additions are npm packages and GH Actions, not Claude Code plugins |
| 25  | oxlint + ESLint          | Keep both — revisit during Plan 2 ESLint v10 migration                                                                                                                                      | Valid dual-linter pattern                                               |

## GitHub Config & Docs

| #   | Decision                 | Choice                                                                                                              | Rationale                                                                                  |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 21  | copilot-instructions.md  | Update to current state                                                                                             | Stale (Dec 2025); Copilot review bot is active on PRs                                      |
| 22  | ISSUE_TEMPLATE_APP_CHECK | Delete entirely — one-time procedure already executed, git history preserves content                                | One-time procedure, flat file GitHub won't surface                                         |
| 23  | Repo discoverability     | Skip — not a priority                                                                                               | Working project, not showcase                                                              |
| 24  | GitHub Discussions       | Skip                                                                                                                | Enough decision-tracking systems                                                           |
| 27  | release.yml              | Keep for future use                                                                                                 | Zero maintenance cost                                                                      |
| 30  | Documentation update     | Dedicated plan step for comprehensive update: CLAUDE.md, SKILL_INDEX.md, copilot-instructions.md, all affected docs | 20 agent removals, plugin changes, workflow changes, new devDeps — significant doc surface |
