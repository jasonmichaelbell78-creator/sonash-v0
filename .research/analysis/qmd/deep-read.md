# Deep Read: tobi/qmd

## Artifact Discovery Summary

| Category                   | Count | Key Finds                                                                      |
| -------------------------- | ----- | ------------------------------------------------------------------------------ |
| Architecture docs          | 1     | README.md (945 lines, with ASCII architecture diagram, scoring formulas)       |
| AI workflow docs           | 2     | CLAUDE.md (167 lines), finetune/CLAUDE.md                                      |
| Query syntax specification | 1     | docs/SYNTAX.md (EBNF grammar for query DSL)                                    |
| Claude Code skills         | 2     | skills/qmd/SKILL.md, skills/release/SKILL.md                                   |
| Claude Code plugin         | 1     | .claude-plugin/marketplace.json                                                |
| ML fine-tuning pipeline    | 1     | finetune/ — full SFT training, GRPO experimental, HuggingFace Jobs integration |
| CI workflows               | 3     | ci.yml (matrix: ubuntu/macos × node22/23 + bun), nix.yml, publish.yml          |
| Test files                 | 21    | 1:1 test-to-source ratio (~12K/~13K lines)                                     |
| Eval harness               | 2     | test/eval-harness.ts (easy/medium/hard queries), test/eval-deep-research.ts    |
| Changelog                  | 1     | CHANGELOG.md following Keep a Changelog, version 2.1.0                         |
| Nix reproducible build     | 1     | flake.nix with homeModules for NixOS integration                               |
| Benchmarking               | 1     | src/bench/ — precision@k, recall, MRR, F1 across 4 backends                    |

## Key Knowledge Not Visible From Code Alone

### 1. Full Hybrid Search Pipeline Architecture (HIGHEST relevance)

QMD implements an end-to-end hybrid search pipeline that combines:

- **BM25 full-text search** (SQLite FTS5)
- **Vector search** (sqlite-vec with embeddinggemma-300M)
- **LLM re-ranking** (qwen3-reranker-0.6b with `createRankingContext()` +
  `rankAndSort()`)
- **Query expansion** via fine-tuned Qwen3-1.7B

The fusion strategy is Reciprocal Rank Fusion (RRF, k=60) with:

- Original query weighted 2x in fusion
- Top-rank bonus (+0.05 for #1, +0.02 for #2-3)
- **Position-aware blending** after rerank: 75/60/40% RRF weight for ranks
  1-3/4-10/11+

This is published SOTA for local RAG retrieval in a complete implementation.

### 2. Query Syntax as a DSL (HIGH relevance)

`docs/SYNTAX.md` defines a formal EBNF grammar for QMD queries:

```ebnf
query = expand_query | query_document ;
typed_line = type ":" text newline ;
type = "lex" | "vec" | "hyde" ;
```

The DSL supports three typed sub-queries (lex/vec/hyde), an optional `intent:`
line for disambiguation, and an implicit auto-expand mode. This is NOT just a
config format — it's a genuine query language with parsing, validation, and
expansion rules.

### 3. ML Fine-Tuning Pipeline (HIGH relevance)

The `finetune/` directory contains a production-grade ML training pipeline:

- **SFT (Supervised Fine-Tuning)** on Qwen3-1.7B with LoRA (rank 16, alpha 32,
  all projection layers)
- **GRPO** (Group Relative Policy Optimization) as experimental path
- **HuggingFace Jobs** integration — `hf jobs uv run --flavor a10g-large ...`
  runs cloud training for ~$1.50
- **GGUF conversion** for local Ollama deployment
- **Rule-based reward function** (5 dimensions, max 140 points): Format,
  Diversity, HyDE, Quality, Entity preservation, Think bonus
- Final results: 92.0% avg score, 97.4% token accuracy

This is a complete reference for "take a small base model and fine-tune it for a
domain-specific task cheaply."

### 4. Claude Code Plugin + Skill (HIGHEST relevance)

`.claude-plugin/marketplace.json` makes QMD installable via:

```bash
claude plugin marketplace add tobi/qmd
claude plugin install qmd@qmd
```

The plugin ships:

- MCP server configuration (stdio or HTTP)
- Two skills (qmd, release) with `allowed-tools: Bash(qmd:*), mcp__qmd__*`
- The qmd skill uses frontmatter-gated tool access — the
  `disable-model-invocation: true` flag on the release skill prevents
  auto-invocation

This is a reference implementation of "ship a tool as a Claude Code plugin with
MCP + skill + marketplace entry."

### 5. AST-Aware Chunking (HIGH relevance)

`src/ast.ts` implements AST-aware chunking via `web-tree-sitter` for code files:

- Class/interface/struct/impl/trait: score 100
- Function/method: score 90
- Type alias/enum: score 80
- Import/use declaration: score 60

Scores are merged with regex-based markdown break points (headings 50-100, code
fences 80, paragraphs 20). The squared distance decay formula
`score × (1 - (distance/window)² × 0.7)` means a distant H1 can still beat a
nearby line break.

### 6. Evaluation Harness (HIGH relevance)

`test/eval-harness.ts` and `test/eval-deep-research.ts` implement rigorous
search quality evaluation:

- Queries categorized by difficulty: easy (exact keyword), medium
  (semantic/conceptual), hard
- Expected document targets per query
- Precision@k, recall, MRR, F1 metrics computed across 4 backends
  (bm25/vector/hybrid/full)
- Fixture file format for reproducible benchmarks
- `qmd bench <fixture.json>` CLI command

### 7. Release Skill Pattern (MEDIUM-HIGH relevance)

`skills/release/SKILL.md` is an exceptional example of a disciplined release
workflow:

- `disable-model-invocation: true` — only triggered explicitly
- Gathers context via `release-context.sh` script
- Validates changelog `[Unreleased]` section
- Commits outstanding work
- Cuts release via `release.sh` (renames section, bumps version, tags)
- Watches CI via background dispatch
- Pins all dependencies to exact versions (no `^` or `~`)

### 8. Nix Flake with Home Manager Module (MEDIUM relevance)

`flake.nix` provides a NixOS home-manager module:

```nix
options.programs.qmd = {
  enable = mkEnableOption "QMD - on-device search engine for markdown notes";
  package = mkOption { ... };
};
```

Enables `programs.qmd.enable = true;` in home-manager configs for reproducible
installation.

### 9. Three MCP Transports (MEDIUM relevance)

The MCP server supports:

- **Stdio** (default, process-per-client)
- **HTTP** foreground (long-lived, `qmd mcp --http`)
- **HTTP daemon** (background, `qmd mcp --http --daemon`, PID file at
  `~/.cache/qmd/mcp.pid`)

The daemon mode avoids repeated model loading (~3GB) across client connections.

## External Resources Cataloged for Phase 4b

- HyDE paper: https://arxiv.org/abs/2212.10496
- HuggingFace Jobs (cloud training)
- tobil/qmd-query-expansion-1.7B (HuggingFace model, fine-tuned)
- ggml-org/embeddinggemma-300M-GGUF (embedding model)
- ggml-org/Qwen3-Reranker-0.6B-Q8_0-GGUF (reranker)
- tree-sitter (AST parsing)
- sqlite-vec (vector extension)
- node-llama-cpp (local inference)
- Keep a Changelog standard
- OpenClaw (third-party MCP client, referenced in skill setup docs)
