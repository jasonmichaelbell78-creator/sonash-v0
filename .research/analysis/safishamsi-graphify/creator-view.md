# Creator View — safishamsi/graphify

## 1. What This Repo Understands (+ Blindspots)

graphify gets something right that most code comprehension tools miss: the
difference between what's _stated_ and what's _inferred_. Every edge in the
graph is tagged EXTRACTED, INFERRED, or AMBIGUOUS — you always know whether the
tool found a relationship or guessed it. That honesty is rare.

The architecture is disciplined:
`detect→extract→build→cluster→analyze→report→export`, each stage a single
function with no shared mutable state. Communication happens through plain
Python dicts and NetworkX graphs. This isn't accidental — the ARCHITECTURE.md
makes the design philosophy explicit, and the code follows it perfectly. 15
modules, 15 responsibilities, zero entanglement.

The dual-pass extraction model is the core insight. The first pass is
deterministic: tree-sitter parses ASTs for 20 languages, extracting classes,
functions, imports, and call graphs with zero LLM cost. The second pass uses
Claude subagents in parallel to extract semantic relationships from docs,
papers, and images. The results merge into one graph where EXTRACTED edges came
from ASTs and INFERRED edges came from LLMs. This means code-only corpuses are
_free_ — no tokens spent — while mixed corpuses (code + docs + papers) get the
best of both worlds.

The Leiden community detection (via graspologic, with Louvain fallback) is
genuinely topology-based — no embeddings, no vector database. Semantic
similarity edges from the LLM pass are already in the graph, so they influence
clustering directly. The graph structure _is_ the similarity signal. This is a
principled choice, not a shortcut.

**Blindspots:**

- **No incremental semantic extraction.** The `--update` flag only re-extracts
  _changed_ files, but the semantic pass re-dispatches all uncached non-code
  files. For large growing corpuses, this gets expensive. The cache helps, but
  there's no fine-grained "extract only the new paragraph" capability.
- **Single-contributor fragility.** 95.8% of commits from one person, zero
  merged PRs. The code quality is high, but there's no external review pressure
  shaping the design. The security model is thoughtful but untested by
  adversarial review.
- **No CI beyond basic tests.** CI runs pytest, but there's no linting, type
  checking, security scanning, or integration tests. For a tool that handles
  URLs, generates HTML, and runs git hooks, that's a gap.
- **Graph persistence is file-based only.** graph.json is the only persistence
  layer. No versioning, no migration path, no schema evolution strategy. If the
  graph format changes, old graphs break silently.

## 2. What's Relevant To Your Work

**Directly applicable:**

- **Skill orchestration pattern** (`skill.md`): The 10-step pipeline with
  parallel agent dispatch is the most mature example I've seen of a complex
  multi-step skill. Steps 1-2 (install + detect) run inline, Step 3 dispatches
  parallel subagents with explicit chunk sizing and cache checking, Steps 4-8
  run the pipeline, Step 9 presents results. This is more structured than any of
  our current skills. The Windows variant (`skill-windows.md`) shows how to
  handle platform-specific Python detection, path handling, and PowerShell
  compatibility — directly relevant since SoNash runs on Windows.

- **Threat model organization** (`SECURITY.md`): Their threat model is organized
  by attack vector, not by module. Each vector has a mitigation and a "what
  graphify does NOT do" section. Compare to our `SECURITY_CHECKLIST.md` which is
  organized by check category. Their format is more readable for a tool's
  security posture.

- **MCP server pattern** (`serve.py`): A 320-line MCP server that loads a graph
  once and exposes 7 tools. Clean, stateless, no network listener. This is
  simpler than our MCP memory server and could inform JASON-OS MCP design. The
  `_subgraph_to_text` function with token budget is a useful pattern for
  LLM-friendly graph output.

- **LanguageConfig dataclass** (`extract.py`): One config object per language
  with type-specific node resolution, call detection, and import handling. A
  generic walker uses the config to extract all 20 languages with zero code
  duplication. This pattern could apply to our analysis handler skills — one
  handler config per source type, one generic pipeline.

- **ARCHITECTURE.md format**: A single page covering pipeline, module table,
  extraction schema, confidence labels, how to add a language, security model,
  and test instructions. No bloat. Compare to our multi-document architecture
  split — their approach is more navigable.

**Complementary (different approach to same problem):**

- **Confidence tagging** — We don't tag the confidence of our analysis findings.
  graphify's EXTRACTED/INFERRED/AMBIGUOUS taxonomy could apply to repo-analysis
  findings, extraction candidates, and `/recall` query results.

- **Graph-based code navigation** — Our repo-analysis uses dimensional scoring
  (18 QS dimensions, 6 bands). graphify uses graph topology (god nodes,
  community detection, surprising connections). These are complementary: our
  approach gives a health assessment, theirs gives a structural map.

## 3. Where Your Approach Differs

| Area               | graphify                             | SoNash                                     | Assessment                                          |
| ------------------ | ------------------------------------ | ------------------------------------------ | --------------------------------------------------- |
| Code comprehension | Graph topology + community detection | Dimensional scoring + health bands         | **Different** — complementary approaches            |
| Skill architecture | 10-step pipeline, platform variants  | SKILL.md + REFERENCE.md per skill          | **Behind** — their orchestration is more structured |
| Multi-platform     | 7 platform-specific skill files      | Windows + Linux                            | **Behind** — they support 6 AI platforms            |
| Security model     | Threat-vector-organized, concise     | Checklist-based, comprehensive but verbose | **Different** — both valid, theirs more readable    |
| MCP integration    | stdio server, 7 graph tools          | memory server, entity/relation CRUD        | **Different** — both valid, different data models   |
| Test architecture  | 1:1 module-to-test, pure unit        | node:test, functional + integration        | **Ahead** — our test coverage is broader            |
| Community/process  | Solo contributor, no review pipeline | 500+ reviews, multi-AI review pipeline     | **Ahead** — we have mature process                  |
| Documentation      | 1 ARCHITECTURE.md, 1 SECURITY.md     | 50+ doc files, doc ecosystem audits        | **Ahead** — we have more, theirs is more concise    |

## 4. The Challenge

Consider adopting confidence tagging for your analysis pipeline. Right now, when
repo-analysis or website-analysis produces a finding, there's no indication of
whether it was directly observed or inferred. When `/recall` returns results,
the user can't tell if the result was a hard fact or a soft inference.
graphify's EXTRACTED/INFERRED/AMBIGUOUS taxonomy is simple to implement and
would make the Content Analysis System more honest about its own certainty.

## 5. Knowledge Candidates

### T1 — Active (directly actionable)

| Candidate                                                   | Type      | Novelty | Effort | Relevance |
| ----------------------------------------------------------- | --------- | ------- | ------ | --------- |
| Skill orchestration pipeline (10-step, parallel agents)     | knowledge | high    | E1     | high      |
| Confidence tagging taxonomy (EXTRACTED/INFERRED/AMBIGUOUS)  | knowledge | high    | E1     | high      |
| MCP server pattern (stateless, token-budgeted)              | pattern   | medium  | E1     | high      |
| LanguageConfig dataclass (generic walker + per-type config) | pattern   | medium  | E1     | medium    |
| Threat-vector security model format                         | knowledge | medium  | E0     | high      |

### T2 — Systems (requires deeper integration)

| Candidate                                                  | Type    | Novelty | Effort | Relevance |
| ---------------------------------------------------------- | ------- | ------- | ------ | --------- |
| Platform-specific skill variants                           | pattern | high    | E2     | medium    |
| Git hook marker-based install/uninstall                    | pattern | low     | E1     | low       |
| Watched file auto-rebuild (code-only instant, docs-notify) | pattern | medium  | E2     | low       |

### T3 — Lower priority

| Candidate                         | Type    | Novelty | Effort | Relevance |
| --------------------------------- | ------- | ------- | ------ | --------- |
| Graph diff for version comparison | pattern | medium  | E2     | low       |
| Obsidian vault export             | pattern | low     | E2     | low       |

## 6. What's Worth Avoiding

- **Graph-only persistence without schema versioning.** graphify stores
  everything in `graph.json` with no migration path. If the format changes, old
  graphs break. Our analysis.json has `schema_version` — don't lose that.

- **Single-contributor velocity over review pressure.** 20 releases in 6 days is
  impressive but fragile. No external review means security mitigations are
  self-assessed. We should not emulate the "ship fast, skip review" pattern even
  when quality appears high.

- **Oversized skill files.** `skill.md` is 15K+ tokens. The skill files
  duplicate significant content across 7 platform variants. Our skills are
  already approaching this problem — don't let it get worse.
