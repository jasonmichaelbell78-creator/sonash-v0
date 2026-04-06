# Deep Read: HKUDS/CLI-Anything

**Date:** 2026-04-06 | **Skill Version:** 4.2

## Artifact Discovery

831 files total. Key internal artifacts beyond code:

| Artifact                                         | Count   | Read?                                                   | Knowledge Beyond Code                                             |
| ------------------------------------------------ | ------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| HARNESS.md (canonical)                           | 1       | Yes (v4.1)                                              | 7-phase SOP for agent-native CLI wrapping. The intellectual core. |
| Per-harness SOP docs (BLENDER.md, GIMP.md, etc.) | ~30     | Sampled 2                                               | Architecture decisions per application. Vary in quality.          |
| SKILL.md files                                   | 37      | Sampled 3 (mermaid, drawio, cli-hub-meta-skill)         | Flat command catalogs. Consistent format from skill_generator.py. |
| guides/ directory                                | 6 files | Read 3 (mcp-backend, skill-generation, session-locking) | Deep technical patterns. MCP backend wrapper is novel.            |
| commands/ directory                              | 5 files | Not read                                                | Plugin slash command definitions.                                 |
| QUICKSTART.md                                    | 1       | Not read                                                | Getting started guide.                                            |
| PUBLISHING.md                                    | 1       | Not read                                                | PyPI publishing workflow.                                         |
| CONTRIBUTING.md                                  | 1       | Yes (v4.1)                                              | Contribution requirements, registry format.                       |
| SECURITY.md                                      | 1       | Yes (v4.1)                                              | Threat model for agent→software bridge.                           |
| .claude-plugin/marketplace.json                  | 1       | Yes (v4.1)                                              | Plugin format reference.                                          |
| registry.json                                    | 1       | Parsed (v4.1)                                           | 35 CLI entries with metadata.                                     |

## Key Findings From Deep Read

1. **guides/mcp-backend.md** — Pattern for wrapping MCP servers as CLI backends.
   Uses `mcp.ClientSession` + `stdio_client` to call MCP tools from sync CLI
   commands. Directly applicable if JASON-OS wraps MCP-based services.

2. **guides/skill-generation.md** — Documents how `skill_generator.py` auto-
   generates SKILL.md from Click CLI introspection. Extracts command groups,
   parameters, and help text via Jinja2 templates. The auto-generation approach
   contrasts with your hand-written SKILL.md files.

3. **guides/session-locking.md** — `_locked_save_json` pattern: open "r+" (no
   truncation), fcntl.flock exclusive, then truncate+write inside lock. Solves
   concurrent write corruption on session JSON. Portable pattern (degrades
   gracefully on Windows).

4. **SKILL.md format comparison** — Their SKILL.md (e.g., mermaid, drawio) is:
   YAML frontmatter (name + description) + Installation + Basic Commands +
   Command Groups + Examples. Flat command reference. Your SKILL.md is: YAML
   frontmatter + Critical Rules + When to Use + Process Overview + Phase
   definitions + Guard Rails. Workflow definition vs command catalog.

5. **Mermaid harness** — No external software required (uses mermaid.ink cloud
   renderer). This is the lightest-weight harness: pure API, no local binary.
   Good example of the simplest possible CLI-Anything implementation.

6. **Draw.io harness** — Requires local drawio binary. Good example of the
   typical binary-backend pattern. 213-line SKILL.md.

## External References Cataloged for Phase 4b

- CLI-Hub website: https://hkuds.github.io/CLI-Anything/
- CLI-Hub catalog: https://hkuds.github.io/CLI-Anything/SKILL.txt
- MCP protocol reference (used in mcp-backend guide)
- DOMShell MCP server (@apireno/domshell)
