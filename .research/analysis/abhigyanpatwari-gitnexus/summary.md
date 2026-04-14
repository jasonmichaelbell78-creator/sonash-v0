# Summary — abhigyanpatwari/GitNexus

**Slug:** `abhigyanpatwari-gitnexus` | **Analyzed:** 2026-04-13 (Session \#278)
| **Depth:** Standard | **Schema:** v3.0

## One-line

A 27K-star TypeScript monorepo that ships a zero-server, client-side code
intelligence tool with a graph-backed MCP server reaching five IDEs; the real
lesson for SoNash is not the product but the eval harness at its center, which
measures agent-capability gain per meta-tool.

## Metadata

| Field          | Value                                |
| -------------- | ------------------------------------ |
| Owner/Repo     | abhigyanpatwari/GitNexus             |
| Stars          | 27,137                               |
| Language       | TypeScript (primary) + Python (eval) |
| License        | NOASSERTION (non-standard)           |
| Size           | 21,178 KB                            |
| Pushed         | 2026-04-13 (today)                   |
| Default branch | main                                 |

## Scoring (dual-lens)

| Lens     | Band    | Score | Primary? |
| -------- | ------- | ----- | -------- |
| Creator  | Healthy | 82    | **Yes**  |
| Adoption | Healthy | 64    | No       |

**Use-as-is verdict:** **Trial** (install on a branch for one real task, gated
on license clarification). See `creator-view.md` Section 2b and `analysis.json`
`adoption_*` fields for blockers and recommended 3-step path.

**Classification:** `active-sprint` — methodologically dense, practically
relevant, directly informs Claude Code OS vision.

## Summary of dimensions

| Dimension      | Band      | Score |
| -------------- | --------- | ----- |
| Security       | Adequate  | 68    |
| Architecture   | Clean     | 87    |
| Documentation  | Excellent | 92    |
| Testing + Eval | Robust    | 85    |

## Headline findings

- **3 S0/S1-equivalent security concerns:** LLM prompt injection (user code fed
  unescaped), git subprocess env inheritance (GITHUB_TOKEN exposure risk), no CI
  dependency scanning.
- **Excellent methodological docs:** README 603L, ARCHITECTURE 181L, AGENTS
  205L, CLAUDE ~120L, GUARDRAILS 89L. Layered, contract-style.
- **Three-mode SWE-bench eval harness:** baseline / native / `native_augment`.
  Per-instance caching by `(repo, commit)`. This is the pattern SoNash most
  conspicuously lacks.
- **Ships as Claude Code marketplace plugin:** `.claude-plugin/marketplace.json`
  - versioned `plugin.json`. Reference implementation for Wave 5 rank 3
    opportunity (previously deprioritized).
- **Multi-IDE via one MCP server:** same 7 tools reach Claude Code, Cursor,
  Codex, Windsurf, OpenCode; Claude Code gets PreToolUse hook depth.

## The challenge

**Build an eval harness before building another skill.** SoNash has 450+
patterns, 77 skills, 38 agents, and a learning metric in dispute. GitNexus, at
1/10th the meta-tooling complexity, puts evaluation at the center of its
development loop. The shape (baseline vs. enriched on a fixed benchmark,
per-instance metrics, commit-hash cached) is the structural gap.

## Candidates

- **Patterns:** DAG phase orchestration, confidence-scored edges,
  `gitnexus:start` MCP contract block, PreToolUse ambient enrichment, Signs
  pattern, marketplace.json packaging.
- **Knowledge:** Eval harness 3-mode shape, multi-IDE MCP negotiation,
  precomputed relational intelligence, superpowers plan discipline.
- **Content:** 7 plugin skills, GUARDRAILS.md, eval/README.md,
  noodlbox-comparison format.
- **Anti-patterns:** MCP shadowing, aspirational docs outrunning impl,
  over-featuring before measurement, graph versioning without migration path.

Full catalog in `value-map.json`. Creator View in `creator-view.md`. Dimension
details in `dimensions/`.

## Absence patterns

- No incremental re-indexing (roadmapped, not shipped)
- No operational/multi-tenant docs
- No embedding-model drift management
- No schema migration path for graph
- No LLM input sanitization

## Cross-repo connections

- **karpathy/autoresearch** — (previously analyzed) — potential overlap on eval
  harness patterns for agent capability measurement
- **outline** — (previously analyzed) — different domain but both emit Claude
  Code integration via MCP
- **Noodlbox** (external, not analyzed) — explicit competitor; GitNexus drafts
  identify "Session Hooks" pattern as steal-worthy
