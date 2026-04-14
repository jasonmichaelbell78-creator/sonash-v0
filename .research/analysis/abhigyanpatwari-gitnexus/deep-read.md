# Deep Read — abhigyanpatwari/GitNexus

**Purpose:** Inventory internal artifacts beyond source code. Feeds Phase 4b
Content Evaluation and Phase 4 Creator View.

---

## Artifacts Discovered

### Root-level markdown (READ in full)

- `README.md` (603 lines) — product narrative, multi-IDE setup, zero-server
  architecture, MCP tools catalog
- `ARCHITECTURE.md` (181 lines) — DAG pipeline, phase orchestration
- `AGENTS.md` (205 lines) — agent rules, `gitnexus:start`/`gitnexus:end` MCP
  contract block, canonical rules
- `CLAUDE.md` (~120 lines) — Claude Code-specific deltas + `gitnexus:start`
  block (mandatory impact-before-edit rules, full MCP tool catalog with d=1/2/3
  risk levels)
- `GUARDRAILS.md` (89 lines) — non-negotiables, **Signs pattern** (recurring
  failures codified as rules)
- `CONTRIBUTING.md` (51 lines) — conventional commits, PR checklist
- `CHANGELOG.md` — version history
- `MIGRATION.md` — version-to-version migration notes
- `RUNBOOK.md` — operational runbook
- `TESTING.md` — testing conventions
- `compound-engineering.local.md` — personal/local work notes (not shipped)
- `swift-ingestion-gaps.md`, `type-resolution-roadmap.md`,
  `type-resolution-system.md` — domain roadmaps

### `.claude-plugin/` (READ)

- `marketplace.json` — **ships as Claude Code marketplace plugin**
  (`gitnexus-marketplace`, owner `nico@gitnexus.dev`, plugin version 1.3.3)

### `gitnexus-claude-plugin/` (READ plugin.json, SAMPLED skills)

- `.claude-plugin/plugin.json` — v1.3.6, keywords:
  code-intelligence/knowledge-graph/mcp/static-analysis
- `skills/gitnexus-cli/`, `gitnexus-debugging/`, `gitnexus-exploring/`,
  `gitnexus-guide/`, `gitnexus-impact-analysis/`, `gitnexus-pr-review/`,
  `gitnexus-refactoring/` — 7 packaged skills shipped as plugin

### `gitnexus/skills/*.md` (READ 2 in depth, LISTED rest)

- `gitnexus-exploring.md` — architecture discovery workflow (query → context →
  process trace)
- `gitnexus-pr-review.md` (READ in full) — workflow: `gh pr diff` →
  `detect_changes` → per-symbol `impact` → context → process → summarize.
  Mandatory checklist format.
- `gitnexus-cli.md`, `gitnexus-debugging.md`, `gitnexus-guide.md`,
  `gitnexus-impact-analysis.md`, `gitnexus-refactoring.md` — 5 more skills

### `docs/superpowers/plans/` (CATALOGED, SAMPLED 1)

- `2026-04-02-pr626-high-fixes.md` (725 lines) — TDD-first executable plan:
  write failing tests → verify failure → implement → verify pass → commit with
  template. Checkbox tracking, spec ref. **Same superpowers pattern SoNash
  uses.**

### `docs/code-indexing/cobol/` (READ by documentation agent)

- `README.md`, `graph-model.md`, `deep-indexing.md` — why COBOL uses regex not
  tree-sitter, 8 node types, domain edges (`RECORD_KEY_OF`, `CONTRACTS` via
  copybook), stack-based level-number hierarchy

### `docs/plans/`

- `2026-03-26-feat-cobol-full-language-coverage-plan.md` — feature plan

### `eval/` (READ README, CATALOGED structure)

- `README.md` (214 lines) — SWE-bench harness, 3 modes (baseline / native /
  native_augment), grep enrichment, per-instance metrics. Python project
  (`pyproject.toml`, `uv.lock`).
- `agents/`, `analysis/`, `bridge/`, `configs/`, `environments/`, `prompts/`,
  `tests/`, `tool_registry.py`, `run_eval.py`

### `.sisyphus/drafts/` (READ 1 in full)

- `gitnexus-brainstorming.md` — early process-map sketches
- `noodlbox-comparison.md` (READ) — **explicit strategic analysis of
  competitor.** Identifies "Session Hooks" as steal-worthy. Notes MCP shadowing
  as unsafe. Confirms GitNexus's directional bet on "Knowledge Graph + MCP"
  validated by Noodlbox.

### `.github/` (CATALOGED)

- Workflows (assessed in testing.md dimension file)
- `PULL_REQUEST_TEMPLATE.md`

---

## Referenced External Resources (for Phase 4b Content Eval)

- **SWE-bench** — eval/README.md references as benchmark source. No arXiv/paper
  cited directly in readme but implicit.
- **Leiden community detection algorithm** — referenced in ARCHITECTURE.md phase
  description. Academic origin (Traag et al. 2019).
- **Reciprocal Rank Fusion (RRF)** — referenced for BM25+semantic hybrid search.
  Academic origin (Cormack et al. 2009).
- **Tree-sitter** — 14 languages supported, vendor directory in
  `gitnexus/vendor/`.
- **Cypher query language** — `gitnexus_cypher` MCP tool exposes graph queries
  in Cypher (Neo4j-style, via KuzuDB).
- **KuzuDB / LadybugDB** — embedded graph database (WASM-compatible).
- **Competitor: Noodlbox** — referenced by name in `.sisyphus/drafts/`. URL not
  provided in public docs; user-held knowledge.

---

## Feed-Forward to Creator View

- **Pattern candidates:** DAG phase orchestration, confidence-scored edges,
  `gitnexus:start` MCP instruction block, PreToolUse hooks for automatic
  enrichment, Signs pattern (GUARDRAILS recurring failures), marketplace.json
  packaging format.
- **Knowledge candidates:** Multi-IDE MCP integration strategy, superpowers plan
  structure, eval harness 3-mode design, COBOL regex state machine, precomputed
  relational intelligence (shift load from LLM to index).
- **Content candidates:** Specific skill files (gitnexus-pr-review.md is a
  particularly clean template), GUARDRAILS.md, eval/README.md.
- **Anti-patterns:** `.sisyphus/drafts/noodlbox-comparison.md` notes "MCP
  Shadowing" (defining tools with conflicting names) as unsafe — cautionary.

---

## What Was NOT Read (defer to Coverage Audit)

- `gitnexus/src/` core source (assessed via architecture dimension summary, not
  deep-read)
- Individual `.github/workflows/*.yml` (summarized in testing dimension)
- `eval/tests/` individual tests
- Swift / Python / TS individual indexers (tree-sitter integration)
- `gitnexus/vendor/` tree-sitter WASM files
- Most `gitnexus/skills/*.md` files not sampled (5 of 7 only read by
  title/purpose)
- Full CHANGELOG, MIGRATION, RUNBOOK, TESTING root docs
