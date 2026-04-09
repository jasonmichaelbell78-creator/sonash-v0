# Deep Read — safishamsi/graphify

**Date:** 2026-04-09 | **Phase:** 2b | **Files read:** 25

## Internal Artifacts Found

### Architecture & Design Docs

| File              | Knowledge                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ARCHITECTURE.md` | Pipeline: detect→extract→build→cluster→analyze→report→export. Each stage is a single function in its own module. Communication via plain dicts and NetworkX graphs — no shared state.             |
| `SECURITY.md`     | Full threat model: SSRF, XSS, path traversal, prompt injection, symlink traversal, encoding crashes. "Does NOT do" list: no network listener, no eval/exec, no shell=True, no credential storage. |
| `CHANGELOG.md`    | 20 releases in 6 days. Rapid iteration on: XSS fixes, multi-platform hooks, tree-sitter version pinning, NetworkX compatibility shims, PowerShell scroll buffer corruption fix.                   |

### Skill Files (7 — one per platform)

| File                | Key Difference                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skill.md`          | Claude Code primary. PreToolUse hook + CLAUDE.md integration. Full 10-step pipeline with parallel agent dispatch.                                         |
| `skill-windows.md`  | Windows-specific: PowerShell/cmd path handling, `python` vs `python3`, no `head -1` shebang detection.                                                    |
| `skill-codex.md`    | Codex: `$graphify` prefix (not `/`), `multi_agent = true` config, PreToolUse hook in `.codex/hooks.json`, `systemMessage` instead of `additionalContext`. |
| `skill-opencode.md` | OpenCode: `tool.execute.before` plugin in `.opencode/plugins/graphify.js`.                                                                                |
| `skill-claw.md`     | OpenClaw: sequential extraction (no parallel agent support yet). AGENTS.md is the always-on mechanism.                                                    |
| `skill-droid.md`    | Factory Droid: `Task` tool for parallel dispatch instead of `Agent` tool.                                                                                 |
| `skill-trae.md`     | Trae: `Agent` tool for dispatch. No PreToolUse hooks — AGENTS.md only. Trae CN variant.                                                                   |

### Worked Examples

| Dir               | Purpose                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `worked/example/` | Reproducible 7-file example (5 Python + 2 MD). Clean call graph demonstration.                                                                                                                   |
| `worked/httpx/`   | Real-world example: httpx library graphified. 144 nodes, 330 edges, 6 communities. GRAPH_REPORT.md shows god nodes (Client, AsyncClient, Response), surprising connections, suggested questions. |

### Source Modules (15 + 2 test fixtures)

All 15 modules follow the same pattern: single-responsibility function, plain
inputs/outputs, no side effects outside `graphify-out/`. Notable:

- **extract.py** (32K tokens): Generic tree-sitter extraction with
  LanguageConfig dataclass pattern. 20 languages. Call-graph second pass for
  INFERRED edges.
- **serve.py**: Full MCP server with 7 tools: query_graph, get_node,
  get_neighbors, get_community, god_nodes, graph_stats, shortest_path.
- **security.py**: SSRF protection (DNS resolution + private IP check), redirect
  re-validation, streaming size cap, label sanitization.
- **hooks.py**: Git hook integration with marker-based install/uninstall.
  Shebang injection prevention.
- **watch.py**: watchdog-based file watcher. Code changes → instant rebuild (no
  LLM). Doc/image changes → flag + notification.
- **ingest.py**: URL fetch with type detection (tweet, arxiv, pdf, webpage,
  image, github, youtube). YAML frontmatter injection prevention.
- **cluster.py**: Leiden (graspologic) → Louvain (networkx) fallback. Oversized
  community splitting. Cohesion scoring.

### Test Suite (21 files)

1:1 module-to-test mapping. Pure unit tests — no network, no filesystem side
effects. Fixtures directory for sample files.

## Referenced External Resources (cataloged for Phase 4b)

1. **Karpathy /raw folder workflow** — Referenced as the core use case
   inspiration
2. **graspologic** — Microsoft Research library for Leiden community detection
3. **tree-sitter** — Parser generator for 20 languages
4. **NetworkX** — Graph library backbone
5. **pyvis** — Interactive HTML graph visualization
6. **MCP protocol** — Model Context Protocol for agent access
7. **neo4j** — Optional graph database export
8. **Obsidian** — Optional vault export
