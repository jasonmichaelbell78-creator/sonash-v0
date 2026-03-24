<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Decision Record: Memory System Audit

**Date:** 2026-03-17 **Questions Asked:** 18 **Decisions Captured:** 18

---

## Cleanup & Corrections

| #   | Decision                                      | Choice                                                       | Rationale                                        |
| --- | --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| D1  | Stale: project_lsp_setup.md                   | Delete — obsolete, LSP set up, CLAUDE.md Section 6 covers it | F1: one-time task complete, memory rotted        |
| D2  | Redundant: feedback_lsp_not_grep.md           | Delete — duplicates CLAUDE.md Section 6                      | F1: memory rules say don't store what code shows |
| D3  | Overlap: feedback_explore_agents_readonly     | Merge into feedback_agent_teams_learnings.md                 | F2: point #1 already covered there               |
| D4  | Stale description: project_agent_env_analysis | Update description — Phase 3 is done, not "next"             | Research agent: description out of date          |

## New Memory Creation

| #   | Decision                                | Choice                                                                                                                                                                                                                                                                                                                                                                                                         | Rationale                                                        |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| D5  | User-type memories needed               | Yes — create user-type memories (specific files in D8)                                                                                                                                                                                                                                                                                                                                                         | F4: zero user memories after 225+ sessions                       |
| D6  | Reference-type memories needed          | Yes — create reference-type memories (specific files in D8)                                                                                                                                                                                                                                                                                                                                                    | F5: zero reference memories                                      |
| D7  | Plan vs execution split                 | Plan specifies which memories; execution writes them                                                                                                                                                                                                                                                                                                                                                           | Standard deep-plan separation                                    |
| D8  | Which new memories to create            | **11 new:** project_active_initiatives, project_cross_locale_config, reference_external_systems, user_communication_preferences, feedback_code_review_patterns, user_expertise_profile, user_decision_authority, reference_documentation_standards, reference_tdms_systems, reference_ai_capabilities, feedback_execution_failure_recovery. **Deferred 2:** user_session_patterns, reference_github_workflows. | User promoted 6 of 8 Mediums after reviewing explainers          |
| D9  | Content: user_communication_preferences | 5 items: concise responses (no trailing summaries), question batches 5-8, "your call" = delegation (decide + state why), never push without explicit instruction, two-locale awareness (work: jbell, home: jason)                                                                                                                                                                                              | 31 preferences researched, filtered to 5 not persisted elsewhere |

## Structure & Standards

| #   | Decision                       | Choice                                                                            | Rationale                             |
| --- | ------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------- |
| D10 | Reference memory structure     | One reference_external_systems.md — all URLs/pointers in one file                 | Easier to maintain, cheaper to load   |
| D11 | Project memory lifecycle       | status field in frontmatter: active / completed / stale — flag during session-end | Simple, machine-readable              |
| D12 | MEMORY.md description standard | 12-18 words with primary trigger keywords                                         | Optimal recall per optimization agent |
| D13 | Execution location             | Standard plan/execute pattern, commit to planning branch                          | Consistent with other plans           |

## Strategy & Process

| #   | Decision                   | Choice                                                                                                       | Rationale                                                                |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| D14 | MCP memory strategy        | Ignore — file-based is sufficient. Remove --mcp references.                                                  | MCP not auto-loaded, strictly worse for recall. Unused in 225+ sessions. |
| D15 | Cross-environment memory   | Accept the split. CLAUDE.md (git-tracked) is shared brain. Git commit is escape hatch.                       | Forcing sync adds complexity for marginal benefit                        |
| D16 | Frontmatter consistency    | Standardize all existing + new. Frontmatter: name, description, type, status. Body: type-specific structure. | Already touching every memory — zero marginal cost                       |
| D17 | Verbose memory compression | Compress all during rewrite, target max 12-15 lines per file                                                 | Every memory loads into context. Tighter is better.                      |
| D18 | Recall testing             | Add recall test step — 5-10 realistic prompts after rewrite                                                  | Cheap (15 min), validates description standard works                     |
