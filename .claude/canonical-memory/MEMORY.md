# Auto Memory - sonash-v0

## User

- [Communication preferences](user_communication_preferences.md) — Concise responses, batch questions 5-8, delegation pattern, push protocol, two-locale awareness
- [Expertise profile](user_expertise_profile.md) — Node.js/scripting expert, Firebase comfortable, frontend needs guidance, solo developer
- [Decision authority](user_decision_authority.md) — What Claude decides (naming, implementation) vs what user retains (architecture, security, scope)

## Feedback

- [Convergence loops mandatory](feedback_convergence_loops_mandatory.md) — Every significant pass must loop internally until converged. Corrected 4+ times. Shortcuts cascade.
- [No pre-existing rejection](feedback_no_preexisting_rejection.md) — Never dismiss PR review items as pre-existing. Always present fix-or-DEBT options.
- [SWS is a meta-plan](feedback_sws_is_meta_plan.md) — SWS coordinates child plans and gates. Does NOT absorb child plan content.
- [PR review state files](feedback_pr_review_state_files.md) — pr-review must persist per-round counts in state files to survive compaction/clear.
- [Deep-plan hook discovery](feedback_deep_plan_hook_discovery_process.md) — 5-layer multi-agent discovery for hook/infrastructure audits with ground-truth and execution verification.
- [Code review patterns](feedback_code_review_patterns.md) — PR description quality, rejection policy, review bot sequencing, create PR after session-end.
- [Execution failure recovery](feedback_execution_failure_recovery.md) — Stop-diagnose-confirm before retrying. No blind retries or destructive shortcuts.
- [Agent teams learnings](feedback_agent_teams_learnings.md) — Explore agents are read-only, role separation, return protocol. *(unverified — verify at work locale)*
- [Stale reviews dist](feedback_stale_reviews_dist.md) — SCHEMA_MAP test failures mean scripts/reviews/dist is stale. Fix: `npm run reviews:generate`. *(unverified)*

## Project

- [Active initiatives](project_active_initiatives.md) — SWS re-evaluation active, hook overhaul complete, memory audit active, what blocks what.
- [Cross-locale config](project_cross_locale_config.md) — Shared via git (CLAUDE.md, .planning/) vs locale-specific (memory). Sync via repo commit.
- [Hook contract CANON](project_hook_contract_canon.md) — hook-checks.json schema is CANON artifact. Register in SWS Phase 1 or Phase 3.
- [SWS Session #221 decisions](sws_session221_decisions.md) — 5 cross-cutting decisions: canon enforcement, no silent fails, no orphans, skill pipeline, decision recall.
- [T3 convergence loops](t3_convergence_loops.md) — Dual-form: CANON tenet (when/why) + /convergence-loop skill (how). Must exist before CANON phase.
- [Agent env analysis](project_agent_env_analysis.md) — Deep-plan complete, Phase 1 execution next. Capability mapping for agents. *(unverified)*

## Reference

- [External systems](reference_external_systems.md) — GitHub repo, Firebase project (sonash-app), SonarCloud dashboard URLs for quick lookup.
- [Documentation standards](reference_documentation_standards.md) — Doc headers, prettier-ignore blocks, version tables, docs:index generation, eval template regex.
- [TDMS systems](reference_tdms_systems.md) — Tech debt pipeline: intake → dedup → views. MASTER_DEBT overwrite hazard. DEBT-XXXXX ID format.
- [AI capabilities](reference_ai_capabilities.md) — MCP servers (memory, sonarcloud), agent constraints, compaction resilience, context overflow prevention.
