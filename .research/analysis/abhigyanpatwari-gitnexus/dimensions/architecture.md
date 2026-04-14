# GitNexus Architecture Analysis

**Status:** CLEAN | **Score:** 87/100 | **Summary:** Well-designed monorepo with
clear separation of CLI, web UI, and plugin layers; sophisticated pipeline DAG
and hybrid retrieval; some coupling in shared types.

## 1. Summary Band & Justification

**Band: CLEAN (87/100)**

GitNexus exhibits excellent architecture discipline. Strengths: explicit
pipeline DAG, zero-server WASM, LangChain agent, MCP integration. Weaknesses:
type coupling, tool duplication, no incremental indexing.

## 2. Multi-Module Structure

npm workspaces (implicit, no pnpm-workspace.yaml):

- gitnexus/ - CLI + MCP (published to npm v1.6.1)
- gitnexus-web/ - React UI + LangChain (Vercel)
- gitnexus-shared/ - Types (private)
- gitnexus-claude-plugin/, gitnexus-cursor-integration/ - Config
- .claude/skills/gitnexus/ - 7 agent workflows
- eval/ - Python evaluation

## 3. Client-Side: Zero-Server WASM

- Parsing: tree-sitter WASM in browser (native bindings in CLI)
- Graph: LadybugDB WASM in-memory (persistent in CLI)
- Pipeline: Full DAG runs client-side
- Bridge: Optional gitnexus serve on :3741
- LLM: User-provided API keys (OpenAI, Gemini, Claude, Ollama)

## 4. Knowledge Graph

Database: LadybugDB + Graphology Nodes: File, Folder, Function, Class, Method,
Community, Process Edges: CONTAINS, DEFINES, IMPORTS, CALLS, EXTENDS,
IMPLEMENTS, MEMBER_OF, STEP_IN_PROCESS Extraction: tree-sitter (20+ languages),
custom phases (routes, tools, orm, markdown)

## 5. Graph RAG Agent

Web UI: LangChain ReAct with 7 tools (search, cypher, grep, read, overview,
explore, impact) MCP: Same tools via Model Context Protocol Retrieval: Hybrid
BM25 + semantic via RRF, graph context, process ranking, LRU cache

## 6. IDE Integrations

Skills: exploring, debugging, refactoring, impact-analysis, pr-review, cli,
guide Hooks: Pre/post-tool-use automation Pattern: Self-contained workflows,
agent discovery

## 7. Build System

CLI: npm run build -> tsc + bundling Web: npm run build -> tsc + Vite Tests:
Vitest + Playwright

## 8. Pipeline DAG

scan -> structure -> parse -> [routes, tools, orm] -> crossFile -> mro ->
communities -> processes

Features: Topological validation, typed phases, dependency injection, progress
reporting

## 9. Key Decisions

1. Explicit typed DAG (cycles prevented, parallelism enabled)
2. WASM for zero-server (privacy, offline)
3. Hybrid search RRF (no tuning)
4. MCP standard interface
5. Shared types (single source)
6. Communities first-class (Leiden clustering)
7. Process heuristics (static analysis)

## 10. Concerns

Coupling: Search+embeddings, tool duplication, type deps Performance: No
incremental indexing, 10-15 min for large repos Clarity: Phase ownership,
cluster usage, process heuristics

## 11. Novel Patterns

1. Typed Phase DAG (for pipelines)
2. Hybrid Search RRF (no tuning)
3. Backend-Agnostic Tools (one definition, multiple transports)
4. Skill-Based Workflows (encode decision trees)
5. Staleness Detection
6. System Prompt Injection

## 12. Tech Stack

TypeScript, npm workspaces, LadybugDB, Graphology, tree-sitter WASM, Vite+React,
LangChain+LangGraph, MCP SDK, Express, BM25+vector RRF, Vitest, GitHub Actions

## 13. For SoNash

Three patterns worth adopting:

1. Typed Phase DAG for code gen
2. Backend-agnostic tools
3. Skill-based workflows

GitNexus is production-ready and exemplary for code-intelligence systems.

**Quality Score:** 87/100 (CLEAN) **Analysis Date:** 2026-04-13 **Scope:** Full
monorepo
