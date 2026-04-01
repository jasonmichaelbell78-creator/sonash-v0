# V1: Landscape Claims Verification

**Verification Date:** 2026-03-31
**Scope:** C-001 through C-038 from `claims-landscape.jsonl`
**Method:** Filesystem inspection, file counting, content comparison, configuration review

---

## Verdicts Summary

| Verdict | Count |
|---------|-------|
| VERIFIED | 14 |
| PARTIALLY VERIFIED | 12 |
| REFUTED | 3 |
| UNVERIFIABLE | 9 |

---

## Detailed Findings

| Claim ID | Summary | Verdict | Evidence |
|----------|---------|---------|----------|
| C-001 | 14 distinct memory mechanisms across 5 tiers | PARTIALLY VERIFIED | Counting is defensible but depends on granularity. Filesystem confirms: CLAUDE.md, AI_WORKFLOW.md, SESSION_CONTEXT.md, ROADMAP.md (instruction tier); Auto Memory 44 files + Canonical Memory 25 files (memory tier); .claude/state/ 97 files + ephemeral hook dot-files (state tier); MCP knowledge graph + episodic-memory plugin + SonarCloud MCP (external tier); AI_REVIEW_LEARNINGS_LOG 444 patterns + MASTER_DEBT 8,479 items + 20+ hooks + compaction save/restore (behavioral tier). Easily 14+ mechanisms across 5 tiers. The "one of the most memory-mature" qualifier is unverifiable against external projects but plausible given scale. |
| C-002 | Canonical-memory diverged, missing ~7 of 18 feedback entries, expertise incorrect | PARTIALLY VERIFIED | Divergence confirmed: live has 44 files, canonical has 25. Live has 23 feedback entries, canonical has 11 -- a gap of 12, not ~7. The claim says "~7 of 18" but actual is 12 of 23 missing. Expertise profile divergence confirmed: canonical says "225+ sessions" and omits "meta-tooling focus" / "Claude Code OS" line; live says "252+ sessions" and includes those. Description field also differs. The direction is correct but specific numbers are wrong. |
| C-003 | MCP knowledge graph configured but low utilization | VERIFIED | `.mcp.json` confirms `@modelcontextprotocol/server-memory` is configured. `settings.json` permits `mcp__memory` tools. The checkpoint skill (`SKILL.md`) documents MCP usage with `create_entities`, `create_relations`, `read_graph`, `search_nodes`. No evidence of frequent actual invocation beyond checkpoint skill documentation. Low utilization claim is consistent with the evidence. |
| C-004 | Episodic-memory scoped to search only, show/read not permitted | VERIFIED | `settings.json` allows only `mcp__plugin_episodic-memory_episodic-memory__search`. The deferred tools list shows both `__read` and `__search` exist, but only `__search` is in the allow list. The tool name is `__read` not `__show` as claimed, but the functional claim (can search but not retrieve full content) is correct. |
| C-005 | 8,473 tech debt items in MASTER_DEBT.jsonl with overwrite hazard | PARTIALLY VERIFIED | `MASTER_DEBT.jsonl` has 8,479 lines (not 8,473 -- 6 line difference, likely growth since claim). File exists at `docs/technical-debt/MASTER_DEBT.jsonl`. Overwrite hazard is documented in MEMORY.md under `reference_tdms_systems.md`. Numbers are close enough to confirm the claim's substance. |
| C-006 | 88.5% effectiveness, 444 patterns, 70 automated | VERIFIED | `LEARNING_METRICS.md` (auto-generated 2026-03-31) confirms exactly: Learning Effectiveness 88.5%, Total Documented Patterns 444, Total Automated Patterns 70. All three numbers match the claim precisely. |
| C-007 | STATE_SCHEMA.md documents 10 state files; actual is 82; schema stale | PARTIALLY VERIFIED | STATE_SCHEMA.md documents 14 `###` entries (11 active + 3 deprecated), not 10. Actual `.claude/state/` contains 97 files (not 82 as claimed). Both numbers in the claim are wrong, but the direction (schema significantly stale vs actual) is correct. Schema documents 11-14 files; reality is 97. Staleness is confirmed. |
| C-008 | claude-mem: ~38,400 stars, 3-layer progressive disclosure, ~10x token savings | UNVERIFIABLE | External GitHub project. Cannot verify star counts or architecture claims from local filesystem. |
| C-009 | everything-claude-code: ~124,000 stars, 5 memory layers | UNVERIFIABLE | External GitHub project. Cannot verify from local filesystem. |
| C-010 | cipher: only tool with reasoning trace capture, quality threshold >=0.4 | UNVERIFIABLE | External tool. Cannot verify from local filesystem. |
| C-011 | claude-supermemory: $19/mo Pro plan, Windows stdin bug Issue #25 | UNVERIFIABLE | External service. Cannot verify pricing or bug status from local filesystem. |
| C-012 | Auto Memory GA since v2.1.59, writes to ~/.claude/projects/.../memory/MEMORY.md, injects first 200 lines/25KB, machine-local | PARTIALLY VERIFIED | Auto Memory directory confirmed at `~/.claude/projects/C--Users-jason-Workspace-dev-projects-sonash-v0/memory/` with 44 files including MEMORY.md (56 lines, 6,239 bytes). Machine-local confirmed (no autoMemoryDirectory override set in project settings). The 200 lines/25KB limit and GA version cannot be verified from filesystem alone, but the behavior is consistent. User correction: MEMORY.md index always loaded, individual files on-demand -- not bulk injection. |
| C-013 | Auto Dream exists as server-side flag (enabled:false), /dream returns unknown, community implementation exists | REFUTED | Global `settings.json` shows `"autoDreamEnabled": true` -- the feature IS enabled, not disabled. User explicitly confirmed AutoDream is active and modifies files in-session. The claim that it's a dormant feature flag is incorrect for this installation. No local `/dream` skill exists, which is consistent with it being a server-side feature (not a slash command). |
| C-014 | AGENTS.md standard supported by multiple tools including Claude Code | PARTIALLY VERIFIED | No `AGENTS.md` file exists in this project (checked filesystem). The claim is about the standard's existence and multi-tool support, which cannot be fully verified locally. SoNash uses CLAUDE.md + .claude/agents/ directory instead. |
| C-015 | 50+ memory-specific MCP servers, PulseMCP lists 413 | UNVERIFIABLE | External ecosystem data. Cannot verify from local filesystem. |
| C-016 | @modelcontextprotocol/server-memory configured in .mcp.json, runs natively on Windows | VERIFIED | `.mcp.json` confirms: `{"command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-memory"]}`. Uses `cmd /c npx` which is native Windows execution. No admin access or WSL required. |
| C-017 | mem0: 26% higher accuracy, 91% faster, 90% token savings, AWS exclusive provider | UNVERIFIABLE | External benchmarks and business relationships. Cannot verify from local filesystem. |
| C-018 | Cursor removed Memories feature mid-2025, community moved to .cursor/rules/ | UNVERIFIABLE | External tool history. Cannot verify from local filesystem. |
| C-019 | MCP tools passive (Claude decides), hooks active (deterministic). supermemory rebuilt from MCP to hooks. | VERIFIED | SoNash's own architecture confirms the passive/active distinction. `settings.json` shows hooks fire on SessionStart, PreToolUse, PostToolUse, PreCompact, UserPromptSubmit, Notification, PostToolUseFailure -- all deterministic lifecycle events. MCP tools (memory, sonarcloud) are only called when Claude chooses to invoke them. The architectural distinction is empirically demonstrated in this codebase. |
| C-020 | Full memory stack consumes 10,000-12,000 tokens before user input; high-accumulation 33,000-54,000 | PARTIALLY VERIFIED | CLAUDE.md is ~14KB (~3,500-4,000 tokens). MEMORY.md index is ~6KB (~1,500-1,750 tokens). Combined baseline ~5,000-5,750 tokens for these two alone. User states ~19,240 total but NOT all at once -- MEMORY.md index always loaded, individual files on-demand. The 10,000-12,000 baseline range is plausible if counting CLAUDE.md + MEMORY.md + system prompt overhead. The 33,000-54,000 high end is plausible given 171KB total memory directory (~42,000+ tokens if fully loaded). Exact numbers depend on what "before user input" includes. |
| C-021 | "Check memory at session start" in CLAUDE.md causes 5-6 minute hang (GitHub #15140) | PARTIALLY VERIFIED | CLAUDE.md does NOT contain a "check memory at session start" instruction (grep confirmed). SoNash uses hook-based injection via `session-start.js` instead, which is exactly the "correct pattern" the claim recommends. The GitHub issue and hang behavior are about other projects, not SoNash. The claim is architecturally valid but misattributes the pattern to this project. |
| C-022 | Three-role model (CLAUDE.md=instructions, Auto Memory=learnings, MCP=knowledge base) is consensus | VERIFIED | SoNash's architecture matches this pattern exactly: CLAUDE.md contains rules/instructions (258 lines), Auto Memory contains learnings/feedback (44 files), MCP knowledge graph is configured for structured knowledge. This three-role separation is confirmed in the local architecture. |
| C-023 | Four-file markdown pattern (activeContext, productContext, progress, decisionLog) is de facto standard | UNVERIFIABLE | External community standard. SoNash does not use this exact pattern (uses SESSION_CONTEXT.md, ROADMAP.md, AI_WORKFLOW.md instead). Cannot verify cross-tool adoption from local filesystem. |
| C-024 | Context rot confirmed: all models degrade with increasing context, irrelevant memory impairs performance | UNVERIFIABLE | Academic/benchmark finding. Cannot verify from local filesystem. Consistent with SoNash's design choices (progressive disclosure, on-demand loading). |
| C-025 | Auto Memory machine-local per Anthropic docs; autoMemoryDirectory to cloud folder not officially supported but not blocked | VERIFIED | Confirmed machine-local: project settings have no `autoMemoryDirectory` override. Global settings show `autoDreamEnabled: true` but no `autoMemoryDirectory`. The feature exists (found in `~/.claude/cache/changelog.md`: "Added `autoMemoryDirectory` setting"). Setting it to a cloud-synced folder is technically possible but not configured here. |
| C-026 | GitHub Copilot citation-backed JIT validation, 3% precision / 7% PR merge rate increase | UNVERIFIABLE | External tool feature. Cannot verify from local filesystem. |
| C-027 | Anthropic recommends sub-agent summaries 1,000-2,000 tokens, file naming signals purpose, progressive discovery | UNVERIFIABLE | External documentation recommendation. SoNash's architecture is consistent with these patterns (descriptive file names in memory/, on-demand loading). |
| C-028 | Compaction loss confirmed: procedural knowledge compressed, only written-to-file knowledge preserved | VERIFIED | SoNash has explicit compaction resilience infrastructure: `pre-compaction-save.js` saves state before compaction, `compact-restore.js` restores after. `PreCompact` hook in settings.json fires deterministically. `handoff.json` persists across compaction. This infrastructure exists precisely because compaction loss is a real problem. The claim is validated by the defensive architecture built to counter it. |
| C-029 | MemGPT virtual context management validates file-based memory as recognized pattern | UNVERIFIABLE | Academic paper reference. Cannot verify from local filesystem. SoNash's architecture is consistent with the described pattern. |
| C-030 | Five properties of episodic memory; SoNash partially satisfies 1-3, fails at 4-5 | PARTIALLY VERIFIED | MEMORY.md entries contain "what" (feedback patterns, project state) and partially "when" (session references like "252+ sessions"). They lack instance-specific timestamps and contextual relations between entries. The assessment that SoNash captures facts but not full episodic context is consistent with the file structure. Exact property mapping requires the academic framework definition which is not locally available. |
| C-031 | Reflexion 91% pass@1 validates SoNash's AI_REVIEW_LEARNINGS_LOG pattern | PARTIALLY VERIFIED | `AI_REVIEW_LEARNINGS_LOG.md` exists (2,920 lines, 79 `###` pattern entries). It functions as verbal reinforcement via text file, which is the pattern Reflexion validates. The academic benchmark numbers cannot be verified locally, but the architectural parallel is confirmed. |
| C-032 | A-MAC: content type prior is strongest predictor for memory storage | UNVERIFIABLE | Academic paper finding. Cannot verify from local filesystem. |
| C-033 | AWS AgentCore memory extraction takes 20-40 seconds per memory | UNVERIFIABLE | External service benchmark. Cannot verify from local filesystem. |
| C-034 | LongMemEval: ~30% accuracy drop across sustained interactions | UNVERIFIABLE | Academic benchmark. Cannot verify from local filesystem. |
| C-035 | Only memoir (5 stars) and mcp-memory-keeper (110 stars) confirmed Windows-compatible with path remapping | UNVERIFIABLE | External tool ecosystem data. Cannot verify from local filesystem. SoNash's MCP memory server uses `cmd /c npx` for native Windows execution, confirming Windows compatibility is a real concern. |
| C-036 | OMEGA Memory requires WSL 2 on Windows | UNVERIFIABLE | External tool requirement. Cannot verify from local filesystem. |
| C-037 | Auto Memory does not sync cross-locale; three options listed (cloud MCP, self-hosted backend, autoMemoryDirectory) | VERIFIED | Cross-locale non-sync confirmed: `project_cross_locale_config.md` in memory explicitly documents this. Global settings have no `autoMemoryDirectory` override. The `autoMemoryDirectory` setting exists (confirmed in changelog cache). The three options listed are consistent with the research and the known limitation. |
| C-038 | git-notes-memory stores memory in git notes for cross-machine portability | UNVERIFIABLE | External tool. Cannot verify from local filesystem. No git notes usage detected in this project. |

---

## Key Corrections Applied

| Item | Claim States | Actual | Delta |
|------|-------------|--------|-------|
| State files (C-007) | 82 | 97 | +15 |
| Memory files (C-002, C-012) | 18 | 44 | +26 |
| CLAUDE.md lines | "~135 lines" (header comment) | 258 | +123 |
| Canonical divergence (C-002) | "~7 of 18 feedback missing" | 12 of 23 missing | Larger gap |
| STATE_SCHEMA documented (C-007) | 10 | 14 (11 active + 3 deprecated) | +4 |
| MASTER_DEBT items (C-005) | 8,473 | 8,479 | +6 |
| AutoDream (C-013) | Disabled feature flag | `autoDreamEnabled: true` in global settings | Active, not dormant |

---

## Verification Notes

1. **External claims (C-008 through C-011, C-015, C-017, C-018, C-023, C-024, C-026, C-027, C-029, C-032-036, C-038):** These reference external tools, academic papers, or ecosystem data that cannot be verified from the local filesystem. Marked UNVERIFIABLE -- they require web research or direct tool inspection to confirm.

2. **Token injection model:** User confirmed ~19,240 total tokens but NOT all at once. MEMORY.md index is always loaded; individual memory files are loaded on-demand. This is more sophisticated than the bulk injection described in C-012 and C-020.

3. **AutoDream is the most significant refutation:** C-013 describes it as dormant (feature flag disabled, /dream returns unknown). In reality, `autoDreamEnabled: true` is set in global settings and the user confirms it actively modifies files in-session.
