# Deep Read: ArchiveBox/ArchiveBox

**Analyzed:** 2026-04-12 | **Depth:** Standard

## Internal Artifacts Found and Read

### Primary Developer Documentation

1. **CLAUDE.md** (498 lines) — THE key artifact. Comprehensive Claude Code
   development guide covering: dev environment (uv, non-root testing), code
   style (grep-friendly naming, minimize unique names), testing standards (NO
   MOCKS, NO SKIPS, strict assertions), database migration strategy (squashed vs
   individual), plugin system architecture (Chrome plugin dependency rules),
   code coverage methodology (passive + active tracking, JSON/HTML reports),
   debugging tips. This is one of the most thorough CLAUDE.md files seen in
   external repos.

2. **README.md** (99KB) — Comprehensive user documentation covering all
   installation methods (Docker, pip, apt, brew), use cases, integration points,
   and feature catalog.

3. **MCP Server README** (`archivebox/mcp/README.md`) — Documents their
   auto-discovery MCP server: zero manual schema definitions, ~200 lines,
   dynamically introspects Click CLI commands. Uses CliRunner for execution.
   Lightweight and elegant.

### Community & Process Documentation

4. **CONTRIBUTING.md** — Basic 39-line contribution process. Points to wiki for
   details.
5. **SECURITY.md** — Security reporting via GitHub Private Reporting.
6. **CODE_OF_CONDUCT.md** — Present (community health score 100%).
7. **PULL_REQUEST_TEMPLATE.md** — Present.

### Architecture & Planning Documents (old/)

8. **Architecture.md** — Legacy UI/app conceptual architecture (outdated but
   shows design thinking)
9. **12 TODO documents** in `old/` directory — Rich planning artifacts:
   - `TODO_hook_architecture.md` — Hook system design decisions
   - `TODO_hook_concurrency.md` — Background vs foreground hook execution
   - `TODO_hook_statemachine_cleanup.md` — State machine patterns
   - `TODO_chrome_plugin_cleanup.md` — Chrome plugin dependency cleanup
   - `TODO_fs_migrations.md` — Filesystem migration strategy
   - `TODO_archivebox_jsonl_cli.md` — JSONL output format for CLI
   - `TODO_cli_refactor.md` — CLI architecture redesign
   - `TODO_fix_migration_path.md` — Migration path fixes
   - `TODO_Process_cleanup_unification.md` — Process tracking unification
   - `TODO_process_tracking.md` — Worker process management
   - `TODO_rename_extractor_to_plugin.md` — Naming transition

### Hook System Documentation (hooks.py header)

10. **hooks.py** (43KB) — Extensive module docstring documenting hook contract:
    - Input: `--url=<url>` and key-value args
    - Output: JSONL records to stdout, files to $PWD
    - Naming:
      `on_{EventFamily}__{run_order}_{description}[.finite.bg|.daemon.bg].{ext}`
    - Execution: foreground sequential, background concurrent with SIGTERM
      finalization
    - Discovery: event-based naming + lexicographic sort

### Infrastructure Documentation

11. **etc/README.md** — Configuration directory documentation
12. **etc/** directory — Contains production deployment templates: nginx.conf,
    uwsgi.ini, sonic.cfg, systemd service, fly.toml
13. **bin/** directory — 24 shell scripts covering build, test, lint, release
    across Docker/pip/deb/brew/docs/git
14. **docker-compose.yml** — Full orchestration with sonic search server
    integration
15. **pyproject.toml** — Modern Python packaging with uv, comprehensive
    test/coverage/lint config

### CI/CD Documentation

16. **17 GitHub Actions workflows** including:
    - `test.yml` — Main test runner
    - `test-parallel.yml` — Parallel test matrix (dynamic test file discovery)
    - `lint.yml` — ruff + pyright + ty
    - `claude.yml` — Claude Code integration (interesting: they use Claude in
      CI)
    - `docker.yml`, `debian.yml`, `pip.yml` — Multi-format builds
    - `codeql.yml` — Security scanning
    - `release.yml` — Release automation

## Knowledge Not Visible From Code Alone

1. **NO MOCKS testing philosophy** — Explicitly documented in CLAUDE.md. Tests
   must exercise real code paths: real SQLite databases, actual subprocess
   calls, direct SQL verification. This is a deliberate architecture decision,
   not laziness.

2. **Grep-friendly naming convention** — Functions are named with consistent
   prefixes (`fs_migrate_*`, `log_*`) to enable grep-based discovery. A code
   navigation philosophy.

3. **Coverage as dead code detector** — They use coverage not just for test
   quality but as a dead code discovery tool. JSON output + jq pipeline for
   finding 0% coverage files.

4. **Hook execution model** — Foreground hooks run sequentially by 2-digit
   ordering prefix. Background hooks (`.bg` suffix) run concurrently and receive
   SIGTERM when foreground completes. This is a production-grade execution
   model.

5. **Plugin isolation principle** — Chrome plugins explicitly forbidden from
   importing ArchiveBox or Django. Only two shared files allowed. This enforces
   true plugin independence.

6. **Migration strategy** — Squashed migrations for clean installs, individual
   migrations recorded for dev branch upgrades. `replaces` attribute bridges
   both paths.

7. **Claude Code as CI actor** — They have a `claude.yml` workflow, using Claude
   Code in their CI pipeline. Forward-thinking AI integration.

## Referenced External Resources (for Phase 4b)

- MCP Specification (2025-11-25):
  https://modelcontextprotocol.io/specification/2025-11-25
- ArchiveBox Wiki (detailed setup, internals, DB schema)
- abx-plugins, abx-dl, abx-pkg packages (sibling repos)
- SingleFile project (archiving dependency)
- Chrome DevTools Protocol (CDP) for plugin system
