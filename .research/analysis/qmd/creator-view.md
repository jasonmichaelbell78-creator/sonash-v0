# Creator View: tobi/qmd

## 1. What This Repo Understands (+ Blindspots)

Tobi's qmd understands something that most "AI search" tools miss: that
privacy-first, local-first retrieval requires real engineering discipline, not
just wrapping Ollama in a CLI. It knows that a knowledge base search engine
needs BM25 AND vector search AND reranking — not one of them — because each
handles a different class of query. It knows that small fine-tuned models beat
general-purpose models on narrow tasks, and it's willing to do the ML work (LoRA
SFT on Qwen3-1.7B, rule-based reward function, HuggingFace Jobs for cheap cloud
training) to prove it.

The deeper understanding shows in the query DSL. `docs/SYNTAX.md` isn't a config
format — it's a formal EBNF grammar with typed sub-queries (`lex:`, `vec:`,
`hyde:`), an `intent:` disambiguation line, and parsing constraints.
"Performance" is ambiguous; `intent: web page load times and Core Web Vitals`
disambiguates it. This is someone who has thought carefully about what a search
query _is_ and decided it deserves a grammar, not just a string.

The position-aware blending algorithm is the clearest sign of sophistication.
Pure RRF can dilute exact matches when expanded queries don't match well; LLM
rerankers can destroy high-confidence retrieval results. So qmd blends them by
position: top 1-3 keep 75% of the RRF score, 4-10 split 60/40, 11+ trust the
reranker more (40/60). This is the kind of decision that only comes from
watching search results go wrong and debugging why.

The Claude Code plugin is where qmd reveals understanding of a newer ecosystem.
`.claude-plugin/marketplace.json` bundles MCP server + skills into a single
installable unit. The `qmd` skill uses `allowed-tools: Bash(qmd:*), mcp__qmd__*`
to gate which tools the skill can invoke. The `release` skill uses
`disable-model-invocation: true` to prevent accidental auto-triggers on risky
operations. Few repos have figured out this level of Claude Code plugin
discipline yet.

**Blindspots:**

- **Single runtime persistence.** The daemon mode (`qmd mcp --http --daemon`) is
  the only way to keep models loaded across MCP client reconnects. There's no
  IPC layer between CLI invocations and the daemon — they're separate concerns.
  Model reload on every fresh stdio MCP connection is expensive.
- **No retrieval feedback loop.** The eval harness measures static
  query-document matches, but there's no mechanism for "user clicked result X →
  boost similar results." For a personal knowledge base, this is a significant
  gap.
- **English-centric by default.** The default embedding model
  (embeddinggemma-300M) is English-only. Multilingual support exists via
  `QMD_EMBED_MODEL` but requires re-indexing. CJK users get a worse experience
  out of the box.
- **No observability for the reranker.** The LLM reranker is a black box that
  returns yes/no + logprobs. When results are surprising, there's no explanation
  trace beyond `--explain` showing the RRF scores. Debugging why the reranker
  downranked something requires reading source.
- **Single-user assumption.** No authentication on the MCP HTTP server.
  `Bind to localhost` is the only safety. For a home-lab or team use case, this
  is insufficient.

## 2. What's Relevant To Your Work

The highest-relevance items for SoNash and JASON-OS, informed by Deep Read and
Content Evaluation:

**Claude Code Plugin Architecture (`.claude-plugin/marketplace.json` +
`skills/` + MCP) -- HIGHEST.** This is the most directly useful artifact. qmd
packages an MCP server + two skills (qmd, release) + marketplace manifest into a
single installable plugin. The pattern:

```json
{
  "plugins": [
    {
      "source": "./",
      "skills": ["./skills/"],
      "mcpServers": { "qmd": { "command": "qmd", "args": ["mcp"] } }
    }
  ]
}
```

SoNash currently has 81 skills sitting in `.claude/skills/` with no packaging. A
marketplace.json manifest would let users install SoNash's skill ecosystem as a
Claude Code plugin. This is the cleanest reference I've seen for "how to ship a
Claude Code plugin." Directly relevant to JASON-OS portability.

**Skill Frontmatter Patterns (`allowed-tools` + `disable-model-invocation`) --
HIGH.** Two patterns SoNash's 81 skills don't use:

- `allowed-tools: Bash(qmd:*), mcp__qmd__*` — restricts which tools the skill
  can call. Tighter security, explicit capability declaration.
- `disable-model-invocation: true` — skill only runs on explicit user command,
  never auto-invoked by Claude. Critical for release/deploy/destructive
  workflows.

SoNash's session-end, session-begin, and release-related skills would all
benefit from `disable-model-invocation: true`. The behavioral guardrails in
CLAUDE.md try to enforce this via prose; qmd does it via frontmatter
declaration. Compare `feedback_no_premature_next_steps` memory — that corrective
feedback would be less necessary if skills had frontmatter-level invocation
gates.

**MCP Server as a CLI Tool (`src/mcp/server.ts`, 3 transports) -- HIGH.** qmd
ships its MCP server as a CLI subcommand (`qmd mcp`). This is the pattern SoNash
could adopt if it ever exposes an MCP surface. Three transports shown:

- Stdio (default, per-client subprocess)
- HTTP foreground
- HTTP daemon with PID file management

The daemon pattern is the interesting one — it keeps ~3GB of models loaded
across client connections, idle-disposing contexts after 5 min. For SoNash,
which has no models but has persistent Firebase context, the daemon pattern
might not apply — but the 3-transport architecture is a reference.

**Query DSL for Knowledge Bases (`docs/SYNTAX.md`) -- HIGH.** SoNash's `recall`
skill queries extraction-journal.jsonl (currently 277 candidates across 30
sources) with ad-hoc filters. qmd's formal EBNF grammar with typed sub-queries
would let SoNash express queries like:

```
type: pattern
source: outline/outline
relevance: high
intent: MCP integration
```

This is more expressive than the current `--tag`, `--type`, `--source` flags on
recall. The intent line is especially useful for disambiguation — "performance"
vs "performance in an ML sense." Directly portable pattern.

**Smart Markdown Chunking (scored break points) -- HIGH.** SoNash's content
analysis skills (repo-analysis, document-analysis, media-analysis) chunk content
for storage. Current approach is naive character-based. qmd's scored algorithm
(H1=100, H2=90, code fence=80, paragraph=20, line=1, with squared distance
decay) respects document structure. Porting to SoNash's analysis pipeline would
produce better extraction candidates — fewer chunks split mid-heading or
mid-code-fence.

**Reciprocal Rank Fusion + Position-Aware Blending -- HIGH.** SoNash's
`synthesize` skill combines candidates across sources but uses no formal fusion
algorithm. qmd's RRF + position-aware blend is the standard approach for this
problem. For cross-repo candidate ranking (e.g., "which patterns appear in
multiple repos?"), this would give defensible, reproducible rankings.

**Evaluation Framework (`test/eval-harness.ts`, `src/bench/`) -- HIGH.** SoNash
has no formal skill evaluation framework. Skills regress silently — the memory
entry `feedback_learnings_must_complete` exists because tracking failures
manually doesn't scale. qmd's fixture-based eval with easy/medium/hard
categorization, precision@k, recall, MRR, F1 is a reference for what "skill
evals" could look like. You could write fixtures like:

```json
{
  "query": "find repos with MCP patterns",
  "expected": ["outline/outline", "tobi/qmd"]
}
```

And score `recall` against extraction-journal.jsonl lookups.

**Release Skill Pattern (`skills/release/SKILL.md`) -- MEDIUM-HIGH.** The
disciplined release workflow: gather context → commit outstanding → write
changelog → cut release → watch CI → push on confirmation. SoNash has ad-hoc
release flows (versioning is manual, changelog is inconsistent across docs). The
`[Unreleased]` → `[X.Y.Z] - date` rename pattern from Keep a Changelog is clean.
The dependency-update-before-release step catches the exact class of bugs that
SoNash's `dependency-manager` agent is supposed to catch.

**Fine-Tuning Pipeline (`finetune/`) -- MEDIUM.** SoNash doesn't fine-tune
models currently. Future relevance: if SoNash ever needs a small specialized
model (extraction classifier, skill router, intent classifier for the analyze
skill), this is a complete blueprint — LoRA SFT, HuggingFace Jobs at $1.50/run,
GGUF for local deploy, rule-based reward function. The rule-based reward (no LLM
judge) is deterministic and fast — important for RL signals.

## 3. Where Your Approach Differs

| Area                   | qmd                                                                 | SoNash                           | Classification                                                                     |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| Search architecture    | BM25 + vector + LLM rerank + query expansion                        | jq queries against JSONL         | **Ahead** — qmd has a full retrieval pipeline; SoNash uses grep-equivalent tooling |
| Query expression       | Formal EBNF DSL with typed sub-queries                              | Flag-based (`--tag`, `--type`)   | **Ahead** — DSL is more expressive                                                 |
| Chunking               | Scored break points + AST for code                                  | Naive character-based in repomix | **Ahead** — qmd respects structure                                                 |
| Claude Code packaging  | marketplace.json plugin with skills + MCP                           | Unpackaged skills directory      | **Ahead** — qmd ships a real plugin                                                |
| Skill invocation gates | `allowed-tools` + `disable-model-invocation` frontmatter            | CLAUDE.md prose guardrails       | **Ahead** — enforcement vs convention                                              |
| Evaluation             | Formal harness with difficulty tiers + metrics                      | Informal testing                 | **Ahead** — qmd has quality gates                                                  |
| Local AI inference     | node-llama-cpp with GGUF models                                     | None                             | **Different** — SoNash uses Firebase/cloud                                         |
| Fine-tuning            | SFT pipeline with HF Jobs + GGUF                                    | None                             | **N/A** — not a SoNash need yet                                                    |
| Knowledge-base focus   | On-device search for personal docs                                  | Recovery notebook + meta-tooling | **Different** — different products                                                 |
| Plugin/skill count     | 2 skills, 1 plugin                                                  | 81 skills, no plugin             | **Behind on quantity, Ahead on packaging**                                         |
| Documentation quality  | 945-line README with diagrams, EBNF syntax spec, detailed CHANGELOG | Fragmented across 20+ docs       | **Different** — SoNash spreads, qmd consolidates                                   |
| Dependency discipline  | Exact pins, release skill enforces                                  | Caret ranges                     | **Ahead** — reproducibility                                                        |

**Summary:** qmd is meaningfully ahead on 7 of 12 dimensions. SoNash has more
skill quantity but no packaging/enforcement. For JASON-OS, which is meta-tooling
focused, qmd is a near-ideal reference for how Claude Code plugins should be
built.

## 4. The Challenge

Here's the thing worth sitting with: **Tobi Lütke — CEO of Shopify — personally
built this as a tool to search his own notes. He shipped it with a Claude Code
plugin, an MCP server, and a fine-tuned 1.7B model. Then he open-sourced it.
21,000 stars in four months.**

The challenge isn't "build something like qmd." The challenge is: **Why doesn't
SoNash have this yet?**

SoNash has 277 extraction candidates across 30 sources sitting in a JSONL file.
Every time you want to find something, you run `recall` with flag-based
filtering. There's no BM25, no vector search, no reranking. If you ask "what
patterns from crawl4ai are similar to what nitter does?" — there's no way to
answer that question with current tooling. SoNash built the extraction layer but
skipped the retrieval layer.

The opportunity is pointed: SoNash could adopt qmd as the search layer over
extraction-journal.jsonl. Not copy qmd — actually use it.
`qmd collection add .research --name extractions` and your knowledge base
becomes searchable with hybrid retrieval. The data is already there. The tool
exists. The integration is one CLI command.

The deeper challenge: qmd ships as a Claude Code plugin with bundled skills +
MCP + marketplace. SoNash has 81 skills and no plugin. The gap between "skills
sitting in a directory" and "a real plugin that others can install" is not
technical — it's a packaging decision you haven't made yet. qmd made it.

## 5. Knowledge Candidates

### T1 -- Active Extraction Candidates

| Candidate                                                       | Type    | Novelty | Effort | Relevance |
| --------------------------------------------------------------- | ------- | ------- | ------ | --------- |
| Claude Code plugin manifest pattern (marketplace.json)          | pattern | high    | E1     | high      |
| Skill frontmatter: `allowed-tools` + `disable-model-invocation` | pattern | high    | E0     | high      |
| MCP server as CLI subcommand (3 transports)                     | pattern | high    | E2     | high      |
| Query DSL with typed sub-queries (EBNF grammar)                 | pattern | high    | E2     | high      |

### T2 -- Systems Understanding

| Candidate                                        | Type      | Novelty | Effort | Relevance |
| ------------------------------------------------ | --------- | ------- | ------ | --------- |
| Scored markdown chunking algorithm               | pattern   | medium  | E1     | high      |
| RRF + position-aware blending                    | knowledge | medium  | E1     | high      |
| Fixture-based eval harness with difficulty tiers | pattern   | medium  | E1     | high      |
| Release skill with disabled auto-invocation      | pattern   | medium  | E1     | medium    |
| node-llama-cpp for privacy-first local inference | knowledge | high    | E0     | high      |

### T3 -- Lower Priority

| Candidate                                 | Type      | Novelty | Effort | Relevance |
| ----------------------------------------- | --------- | ------- | ------ | --------- |
| AST-aware code chunking via tree-sitter   | pattern   | medium  | E1     | medium    |
| Daemon mode with PID file management      | pattern   | low     | E1     | medium    |
| LoRA SFT on small LLMs for domain tasks   | knowledge | high    | E0     | low       |
| HuggingFace Jobs for cheap cloud training | knowledge | medium  | E0     | low       |
| Nix flake with home-manager module        | pattern   | low     | E2     | low       |
| Rule-based reward function for RL         | knowledge | medium  | E0     | low       |

## 6. What's Worth Avoiding

**Shipping a skill without `disable-model-invocation` on destructive
operations.** qmd's release skill uses `disable-model-invocation: true`. SoNash
has release/deploy skills that Claude can auto-invoke. That's how you get
`feedback_no_premature_next_steps` and `feedback_session_end_assumptions`
corrections — skills firing when they shouldn't. The fix is frontmatter
declaration, not prose guardrails.

**Caret ranges in packages meant to be reproducible.** qmd pins every dependency
to exact versions and enforces it in the release skill. Caret ranges seem
harmless until a patch release breaks a transitive dependency. For tools that
ship platform-specific binaries (sqlite-vec darwin-arm64, linux-x64, etc.),
exact pinning is non-negotiable. SoNash uses carets; worth reconsidering for the
publishable packages.

**Fine-tuning as default instead of prompting.** qmd fine-tunes a 1.7B model for
query expansion. The pattern is correct for their use case (needs a DSL output
format, runs locally). The anti-pattern to avoid is reaching for fine-tuning
before exhausting prompt engineering. qmd tried prompting first
(`best_prompt_glm.txt` in `experiments/gepa/` shows GEPA optimization of prompts
before SFT). SoNash doesn't need fine-tuning for any current use case.

**Single-runtime CI when cross-runtime support is claimed.** qmd claims Node +
Bun support and tests both. If you claim cross-runtime compatibility and only
test one, you're shipping bugs. SoNash currently Node-only; don't claim Bun
compatibility without matrix testing it.

**Documentation by external delegation (the Outline pattern).** qmd ships all
docs in-repo — README (945 lines), SYNTAX.md, CHANGELOG, finetune/README, skill
SKILL.md files. Contrast with Outline's "see docs.getoutline.com" approach.
qmd's approach is better for contributors; the total doc count is lower but each
file is focused.
