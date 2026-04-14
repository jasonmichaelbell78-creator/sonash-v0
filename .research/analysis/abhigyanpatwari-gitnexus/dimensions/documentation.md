# Documentation & Methodology — GitNexus

**Band:** Excellent (92/100) — GitNexus documents methodology at an exceptional
level. Comprehensive phase/phase interdependencies, language-specific indexing
patterns, production-grade agent integration, and explicit meta-tooling for
Claude Code (PreToolUse hooks, MCP protocol, skill-driven workflows). Docs are
write-heavy (2,300+ lines across key files), contextually layered (AGENTS.md /
CLAUDE.md / GUARDRAILS.md / ARCHITECTURE.md form a coherent hierarchy), and
deeply practical (superpowers plans show TDD-first, task-level granularity).

---

## Documentation Inventory

**Root docs (essential):**

- `README.md` (603 lines) — product narrative, tools, multi-IDE setup, web UI,
  tech stack
- `ARCHITECTURE.md` (181 lines) — monorepo layout, ingestion DAG, phase
  orchestration, where-to-change map
- `AGENTS.md` (205 lines) — agent rules, impact analysis workflow, resources,
  CLI tool reference
- `CLAUDE.md` (~250 lines) — Claude Code hook integration, `gitnexus:start`
  block for MCP rules
- `GUARDRAILS.md` (89 lines) — non-negotiables, Signs (recurring failures),
  escalation protocol
- `CONTRIBUTING.md` (51 lines) — setup, conventional commits, PR checklist

**Superpowers / Plans:**

- `docs/superpowers/plans/2026-04-02-pr626-high-fixes.md` (725 lines) — 4
  HIGH-priority fixes with explicit TDD steps, checkbox tracking, commit
  templates

**Code-Indexing (domain-specific knowledge):**

- `docs/code-indexing/cobol/README.md` (~101 lines) — why regex-only COBOL
  (tree-sitter hangs), architecture flow, coverage comparison
- `docs/code-indexing/cobol/graph-model.md` (~194 lines) — COBOL-specific node
  types (Module, Record, Property, Const, CodeElement), edge types
  (RECORD_KEY_OF, FILE_STATUS_OF), deep data hierarchy
- `docs/code-indexing/cobol/deep-indexing.md` (60+ lines) — data item level
  handling, REDEFINES, OCCURS, stack-based hierarchy parsing

**Skills (`.claude/skills/gitnexus/`):**

- `gitnexus-exploring/SKILL.md` — workflow for architecture discovery (query →
  context → process trace)
- `gitnexus-cli/SKILL.md`, `gitnexus-debugging/SKILL.md`,
  `gitnexus-impact-analysis/SKILL.md`, `gitnexus-refactoring/SKILL.md` — 4 core
  skills shipped with CLI
- `gitnexus-pr-review/SKILL.md` — blast radius pre-merge

**Evaluation framework:**

- `eval/README.md` (214 lines) — SWE-bench harness, `native_augment` mode, grep
  enrichment, per-instance metrics

**.sisyphus/:**

- `gitnexus-brainstorming.md` — early process-map sketches (research-phase
  notes, not production)

---

## 8 Most Valuable Methodological Insights for SoNash

### 1. Precomputed Relational Intelligence over Raw Graph RAG

**Novelty: HIGH.** Traditional Graph RAG gives LLMs raw edges and hopes they
explore enough. GitNexus **precomputes structure at index time**: clustering
(Leiden), tracing (execution flows), confidence scoring (0.7–1.0). Tools return
complete context in one call (e.g., `impact(UserService)` returns 8 callers, 3
clusters, 90%+ confidence in a single response). This shifts cognitive load from
LLM to indexing pipeline.

**Source:** `README.md` lines 354-386, `ARCHITECTURE.md` lines 27-45

**For SoNash:** This pattern directly informs how to design portable
meta-tooling — precompute trust signals, cluster membership, and flow membership
so skills receive pre-scored context, not raw data.

### 2. MCP as Agent-Interface Contract (Multi-IDE reach)

**Novelty: HIGH.** GitNexus ships identical MCP tools (query, context, impact,
rename, cypher, detect_changes) to Claude Code, Cursor, Codex, Windsurf,
OpenCode via one server. Claude Code gets **hooks** (PreToolUse + PostToolUse)
for automatic enrichment and re-indexing; others get base tools only. The
`gitnexus setup` command auto-detects editor and writes global MCP config once.

**Source:** `README.md` lines 115–122, `AGENTS.md` `gitnexus:start` block

**For SoNash:** This is the operating model for portable workflows — define
skills as MCP tools, register once, reach all IDEs. Claude Code's hook
integration is the "deepest" integration pattern to target.

### 3. Superpowers Plan as Executable Specification

**Novelty: MEDIUM.** The plan isn't prose — it's structured YAML-like with
explicit phases: write failing tests (TDD), run to verify failure, implement,
re-run to verify pass, commit with template. Each task is independent,
checkbox-tracked, links to spec file.

**Source:** `docs/superpowers/plans/2026-04-02-pr626-high-fixes.md`

**For SoNash:** This is how to codify skill workflows as repeatable playbooks.
The superpowers framework expects plans to be task-driven, test-first, and
CI-integrated. Skills should emit similar plans.

### 4. COBOL Deep Indexing — Language-Specific Graph Patterns

**Novelty: MEDIUM-HIGH.** COBOL isn't supported by tree-sitter production-grade,
so GitNexus uses **regex state machines** (not WASM, pure JavaScript). The graph
model is richer than typical: 8 node types (Module, Function, Namespace, Record,
Property, Const, CodeElement, Constructor) vs. tree-sitter's 4–6.
Domain-specific edges: `RECORD_KEY_OF`, `FILE_STATUS_OF`, `REDEFINES`,
`ACCESSES`, `CONTRACTS` (shared copybook detection). Data hierarchy uses a
**stack algorithm** for nested level numbers (01 > 05 > 10 > 88).

**Source:** `docs/code-indexing/cobol/graph-model.md`,
`docs/code-indexing/cobol/deep-indexing.md`

**For SoNash:** This teaches how to extend graph models for legacy languages —
don't try to force tree-sitter; create language-specific extraction pipelines
with rich domain semantics. The copybook-based contract detection is novel.

### 5. DAG-Based Pipeline Orchestration with Typed Phases

**Novelty: MEDIUM.** The ingestion pipeline is a DAG of 12 phases:
`scan → structure → [markdown, cobol] → parse → [routes, tools, orm] → crossFile → mro → communities → processes`.
Each phase is a `.ts` file with explicit `deps: string[]`, typed
`execute(ctx, deps)`, and typed `output`. The DAG runner validates cycles at
startup, executes in dependency order. Adding a phase: new file +
`buildPhaseList()` registration.

**Source:** `ARCHITECTURE.md` lines 61–111

**For SoNash:** This is how to architect extensible meta-tooling — each skill
could be a phase with dependencies on prior phases. The type-safety + DAG
validation prevents hidden coupling.

### 6. PreToolUse Hooks for Automatic Search Enrichment

**Novelty: HIGH.** Claude Code supports hooks that intercept tool calls **before
execution**. GitNexus uses PreToolUse to auto-enrich grep/find results with
graph context: when a user searches for `auth validate`, the hook appends
`[GitNexus] callers: loginHandler, apiMiddleware; processes: LoginFlow`. No
explicit tool call needed. PostToolUse re-indexes after commit.

**Source:** `AGENTS.md` `gitnexus:start`, `CLAUDE.md` line 40

**For SoNash:** This is the "deepest integration" pattern. Skills should emit
hook bundles (or hook templates) that can be installed into Claude Code's
settings.json. This is how portable workflows become ambient intelligence.

### 7. Eval Framework as Benchmark for Agent Capability

**Novelty: MEDIUM.** GitNexus evaluates agent performance on real GitHub issues
(SWE-bench) across 3 modes: baseline (no graph), native (explicit tools),
`native_augment` (tools + grep enrichment). Metrics: patch rate, resolve rate,
cost/instance, tool usage. Results cached per (repo, commit) hash. Templates
(Jinja) separate system prompt + instance prompt per mode.

**Source:** `eval/README.md`

**For SoNash:** This is a repeatable pattern for evaluating whether meta-tooling
improves agent outcomes. Design skills with testable hypotheses (e.g., "impact
analysis reduces breaking changes by X%").

### 8. Confidence Scoring on Every Edge

**Novelty: MEDIUM.** Every relation in the graph carries a confidence score: 1.0
(exact match), 0.9 (high heuristic), 0.8 (fallback), 0.7 (lenient). Example:
`METHOD_IMPLEMENTS` edges tier by match quality (parameter types exact → 1.0,
arity only → 1.0, variadic vs fixed → 0.7, insufficient info → 0.7). Tools
expose `minConfidence` filters.

**Source:** `ARCHITECTURE.md` lines 164–173, COBOL graph-model.md

**For SoNash:** Always provide confidence on relations. Let skills decide when
to ask for clarification vs. proceed with 0.8+ confidence. This is how to keep
smaller models reliable.

---

## Specific Knowledge Candidates for Extraction

| Title                                  | File Path                                                       | Why for SoNash                                                                                                  | Effort |
| -------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| Multi-repo MCP Registry Pattern        | `README.md` lines 273–318                                       | How to coordinate multiple indexed repos in one MCP server; global `~/.gitnexus/registry.json` + lazy pool mgmt | E1     |
| Leiden Community Detection             | `ARCHITECTURE.md`, `gitnexus/src/core/ingestion/communities.ts` | Core algorithm for clustering code into functional areas; feeds repo-specific skills                            | E2     |
| Tree-Sitter Type Resolution Chain      | `ARCHITECTURE.md` phase: `crossFile → mro`                      | How to resolve types across files (import tracking, constructor inference, `self`/`this` mapping) for 14 langs  | E2     |
| COBOL Regex State Machine              | `docs/code-indexing/cobol/regex-extraction.md`                  | How to build production-grade extraction pipelines for non-tree-sitter languages                                | E2     |
| Signs Pattern (Recurring Failures)     | `GUARDRAILS.md`                                                 | How to codify "this mistake happened twice" into an instruction. Examples: stale graph, embeddings vanished     | E0     |
| Hook Bundles (Claude Code Integration) | `.claude/skills/gitnexus/*.SKILL.md` + `AGENTS.md`              | How skills are packaged for Claude Code (skills as resources, MCP tool registration, hook templates)            | E1     |
| Superpowers Plan Format                | `docs/superpowers/plans/2026-04-02-pr626-high-fixes.md`         | TDD-first plan structure: failing test → implement → commit template. Checkbox tracking, spec reference.        | E0     |
| COBOL Copybook Contract Detection      | `docs/code-indexing/cobol/graph-model.md` (CONTRACTS edge)      | Novel: shared copybooks between programs create trust signals for cross-program refactoring                     | E2     |

---

## Blindspots

1. **Deployment & SaaS operations** — enterprise/self-hosted docs are sparse
   (referenced only in README as akonlabs.com). No runbooks for multi-tenant
   isolation, audit logging, secret management.
2. **Incremental indexing** — ROADMAP lists "incremental re-index (only changed
   files)" as "actively building" but no detailed design. Existing analysis
   assumes full re-index each run.
3. **Vector embedding specifics** — eval uses embeddings for hybrid search
   (BM25 + semantic + RRF), but embedding model choice, retraining, drift
   management are undocumented.
4. **Graph versioning** — no docs on backward compatibility when graph schema
   changes (e.g., adding new node types). Migration path unclear.
5. **Streaming / real-time indexing** — all examples assume batch analyze →
   static index. No mention of live log streaming or continuous indexing.
6. **Vulnerability research / threat modeling** — GUARDRAILS focuses on
   operational safety (path traversal, double-close), not security analysis
   (e.g., "detect privilege escalation patterns in RBAC code").

---

## Recovery-Community / Sobriety Relevance

**None.** GitNexus is a code intelligence tool for developers. No references to
recovery workflows, 12-step integration, or sobriety tracking. The project is
entirely technical (indexing, graph, agents). The "Signs" pattern (recurring
failures) is operationally useful but not recovery-specific.

---

## Dimension Agent Notes

- Written by orchestrator from Explore-agent return (agent ran in read-only
  mode; file synthesized post-hoc). Content source: agent-returned report
  2026-04-13.
