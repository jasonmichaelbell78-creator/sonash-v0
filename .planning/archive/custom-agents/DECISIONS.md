# Decisions: Custom Agent Implementation

**Date:** 2026-03-31 **Decisions:** 30 **Source:** /deep-plan discovery (4
batches, 30 questions) **Research:** .research/custom-agents/ (111 claims, 58
sources, L4 depth)

---

## Decision Table

| #   | Area                 | Decision                                                                              | Rationale                                                                              |
| --- | -------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| D1  | Scope                | P0 + P1 + P2 only (no P3)                                                             | P3 requires documented failures + creation gate prerequisites                          |
| D2  | Execution            | One PR, structured commits per tier (P0/P1/P2)                                        | Simpler review, atomic rollback per tier                                               |
| D3  | sonash-context       | Create shared skill + pilot + inject into ALL agents                                  | Centralizes ~150 lines of project context, reduces per-agent duplication               |
| D4  | Success metrics      | All agents created/modified, tests pass                                               | Audit re-run is a follow-up session                                                    |
| D5  | Agent ceiling        | No hard ceiling                                                                       | User override of research's 30-agent recommendation                                    |
| D6  | Cross-ref audit      | Agent-based during execution (not grep)                                               | Structured analysis over pattern matching for reference discovery                      |
| D7  | Redirect stubs       | 60-day redirect stubs with removal date + alternative                                 | Prevents silent fallback on habitual invocations                                       |
| D8  | security-auditor     | Upgrade to model: opus                                                                | 1.67x cost (not 5x), GPQA Diamond +17.2pt, justified for deep security analysis        |
| D9  | Consolidation order  | Wave A: 5 clear removals. Wave B: 4 after cross-ref audit                             | Reduces risk — Wave A agents have no plausible live references                         |
| D10 | Stub elevations      | 3 agents elevated (debugger, performance-engineer, technical-writer)                  | 4+ skill invocations each; skills: [sonash-context] for shared context                 |
| D11 | General-purpose      | Override with ~100-180 lines, maxTurns: 30, model: inherit                            | Highest-leverage specificity action (13+ invocations lack context)                     |
| D12 | Pipeline sequence    | Verifier pilot → batch remaining 5                                                    | Validates approach before full investment                                              |
| D13 | Pipeline tools       | Per-agent grants, no Agent/Edit                                                       | Full research capability, minimized mutation risk                                      |
| D14 | Agent body structure | Searcher pattern: role → responsibilities → process → return → anti-patterns          | Proven reference-quality pattern (385 lines, 11 sections)                              |
| D15 | Plugin overrides     | 3 now (general-purpose, silent-failure-hunter, pr-test-analyzer), 2 deferred          | Keeps scope manageable; deferred agents work adequately                                |
| D16 | Zero-signal descs    | Fix all 3 (dependency-manager, deep-research-searcher, deep-research-synthesizer)     | No reason for 1-2 char descriptions; improves discoverability                          |
| D17 | Verifier dual-path   | Codebase claims via filesystem, external via web. Tag verification method.            | Filesystem is ground truth for codebase; optimizes cost                                |
| D18 | CONFLICTED verdict   | Verifier classifies conflict type (DRAGged 5-type taxonomy)                           | Pre-classification lets dispute-resolver focus on resolution                           |
| D19 | Adversarial inputs   | Full RESEARCH_OUTPUT + claims.jsonl + sources.jsonl                                   | Independent claim verification is highest-value adversarial behavior                   |
| D20 | Dispute resolution   | Evidence-weight hierarchy (T1>T2>T3>T4). Include dissent records.                     | Voting follows herd; evidence-weight + dissent is low-cost insurance                   |
| D21 | Gap pursuit depth    | No artificial limits. Diminishing-returns signal only.                                | User override: orchestrator decides continuation based on signal, not hard cap         |
| D22 | Final-synthesizer    | Phase-aware mode (post-verification / post-gap-pursuit / full-resynthesis)            | Prevents double-rewrite architectural hazard (Theme 5.4)                               |
| D23 | SKILL.md integration | Update SKILL.md + REFERENCE.md. Agents first, wiring last. Keep templates as fallback | Agents are useless without pipeline wiring; templates are safety net                   |
| D24 | Example blocks       | Add `<example>` blocks to ALL agents                                                  | Anthropic uses these in their own plugins; improves auto-delegation                    |
| D25 | Naming convention    | Mixed: reusable agents get generic names, pipeline-coupled get `deep-research-*`      | contrarian/otb/dispute-resolver may serve other contexts                               |
| D26 | File location        | Consolidate all pipeline agents in local .claude/agents/. Move searcher+synthesizer.  | Eliminates global sync gap; pipeline agents are skill-orchestrated, not auto-delegated |
| D27 | Hooks                | Defer PostToolUse Write + TeammateIdle. Document as follow-up.                        | Scope control — hook infrastructure is a separate initiative                           |
| D28 | sonash-context audit | Run /skill-audit on sonash-context after creation                                     | Validates skill quality before depending on it for all agents                          |
| D29 | CLAUDE.md updates    | Minimal: update agent count, model note. No new trigger rows for pipeline agents.     | Pipeline agents are skill-orchestrated, not user-triggered                             |
| D30 | Testing strategy     | Structural audit + pipeline smoke test + /skill-audit                                 | Formal test infrastructure is a separate initiative                                    |

---

## Agent Roster (Post-Implementation)

### Removals (9 agents → redirect stubs)

| Agent                          | Wave | Alternative         |
| ------------------------------ | ---- | ------------------- |
| error-detective                | A    | debugger            |
| devops-troubleshooter          | A    | debugger            |
| deployment-engineer            | A    | fullstack-developer |
| penetration-tester             | A    | security-auditor    |
| security-engineer              | A    | security-auditor    |
| mcp-expert                     | B    | Replace, not remove |
| markdown-syntax-formatter      | B    | Audit determines    |
| react-performance-optimization | B    | frontend-developer  |
| prompt-engineer                | B    | Audit determines    |

### New Pipeline Agents (6)

| Agent                           | Phase    | Tools                                              |
| ------------------------------- | -------- | -------------------------------------------------- |
| deep-research-verifier          | 2.5, 3.9 | Read, Bash, Grep, Glob, WebSearch, WebFetch        |
| contrarian-challenger           | 3        | Read, Grep, Glob, WebSearch                        |
| otb-challenger                  | 3        | Read, Grep, Glob, WebSearch                        |
| dispute-resolver                | 3.5      | Read, Grep, Glob                                   |
| deep-research-gap-pursuer       | 3.95     | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch |
| deep-research-final-synthesizer | 3.97     | Read, Write, Bash, Grep, Glob                      |

### Elevations (3 stubs → full definitions)

| Agent                | Priority | Key additions                            |
| -------------------- | -------- | ---------------------------------------- |
| debugger             | P1       | SoNash error patterns, structured return |
| performance-engineer | P1       | Firestore/React/Firebase perf context    |
| technical-writer     | P2       | SoNash doc standards, solo-dev workflow  |

### Modifications (existing agents)

| Agent            | Change                            | Priority |
| ---------------- | --------------------------------- | -------- |
| security-auditor | model: opus, content improvements | P1       |
| general-purpose  | Project override (new file)       | P1       |
| ALL local agents | Add skills: [sonash-context]      | P1       |
| ALL agents       | Add `<example>` blocks            | P2       |
| 3 plugin agents  | Project overrides                 | P1-P2    |
| searcher+synth   | Move from global/ to local        | P0       |

### Infrastructure

| Item                | Description                             | Priority |
| ------------------- | --------------------------------------- | -------- |
| sonash-context      | Shared skill (~150-200 lines)           | P0       |
| SKILL.md updates    | Wire pipeline agents into phases        | P2       |
| REFERENCE.md        | Pipeline agent roster, deprecate inline | P2       |
| CLAUDE.md Section 7 | Update agent count, model note          | P2       |

---

## Deferred Items (Out of Scope)

| Item                          | Reason                                           |
| ----------------------------- | ------------------------------------------------ |
| P3 net-new agents             | Requires documented failures + creation gate     |
| PostToolUse Write hook        | Separate hook infrastructure initiative          |
| TeammateIdle hook             | Separate hook infrastructure initiative          |
| code-simplifier override      | Lower urgency, works adequately                  |
| type-design-analyzer override | Lower urgency, rarely invoked                    |
| Golden test cases             | Formal test infrastructure is separate           |
| App Check MASTER_DEBT entry   | Discovered in research, separate from agent work |
