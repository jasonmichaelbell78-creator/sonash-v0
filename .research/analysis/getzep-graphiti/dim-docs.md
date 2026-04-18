# Documentation Quality - getzep/graphiti

## Summary

Graphiti has Strong foundational documentation. README is exceptional and
comprehensive. AGENTS.md and CLAUDE.md are reusable patterns for AI-assisted
development. Example coverage is broad (9+ scenarios), MCP server documentation
is production-ready. Weakness: API reference docstrings are minimal, no
architecture overview or performance tuning guide, external docs mentioned but
not replicated.

## Inventory

| Document                           | Purpose                               | Quality   | Notes                                                                                          |
| ---------------------------------- | ------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| README.md                          | Core onboarding, feature overview     | Excellent | 676 lines; context graph definition; visuals; 4 backend variants; Zep vs Graphiti; why-section |
| CONTRIBUTING.md                    | Contribution workflow, code style     | Excellent | Code/examples/Discord pathways; RFC requirement >500 LOC; driver guide; TYPE_CHECKING pattern  |
| AGENTS.md                          | Repository guidelines, structure      | Solid     | Module org; make targets; testing with \_int; async config; commit convention                  |
| CLAUDE.md                          | AI assistant onboarding, dev commands | Solid     | Command structure; code org; env vars; model support GPT-5, Claude 4.5, Gemini 2.5             |
| CODE_OF_CONDUCT.md                 | Community standards                   | Standard  | Contributor Covenant v2.0                                                                      |
| SECURITY.md                        | Vulnerability reporting               | Minimal   | 16 lines; GitHub private reporting                                                             |
| OTEL_TRACING.md                    | OpenTelemetry guide                   | Solid     | Basic usage + Kuzu example                                                                     |
| server/README.md                   | FastAPI server deployment             | Solid     | Docker Hub pipeline; docker-compose; Swagger docs                                              |
| mcp_server/README.md               | MCP server deployment                 | Excellent | 684 lines; feature list; config.yaml; entity types; concurrency tuning; client integration     |
| examples/                          | Working scenarios                     | Good      | 9 directories; each has README; gliner2 experimental                                           |
| spec/driver-operations-redesign.md | Internal architecture                 | Minimal   | Not user-facing                                                                                |

## Onboarding Path

Critical path: README → Quickstart Example → Core Code

1. README establishes what (context graph = entities + facts + episodes + custom
   types)
2. Distinguishes Zep (managed) vs Graphiti (open-source)
3. Installation offers Neo4j Desktop or FalkorDB Docker (low friction)
4. Default OpenAI; optional providers (Anthropic, Groq, Gemini, Azure, Ollama)
5. Quickstart section links to examples/quickstart/README.md
6. Quickstart provides setup then python quickstart_neo4j.py
7. Code demonstrates add_episode → hybrid search → graph-distance reranking

Friction points:

- Missing time-to-first-working-example (no "5 minutes" claim)
- No Hello World in README (only configuration blocks)
- Concept density (jumps context graphs → bi-temporal → episodes without
  progressive scaffolding)

Result: Solid but could be smoother. Estimated time-to-first-working: 15-30
minutes (database pre-running).

## AGENTS.md and CLAUDE.md Deep-Dive

AGENTS.md (Repository Guidelines):

- Project Structure: graphiti_core split into nodes.py, edges.py, driver/,
  cross_encoder/, telemetry/, search/
- Build/Test: make install/format/lint/test; integration tests marked \_int;
  docker-compose.test.yml
- Coding Style: 4-space indent, 100-char, single quotes, Ruff+Pyright,
  PascalCase for Pydantic
- Testing: test\_<feature>.py naming; asyncio_mode=auto; integration tests
  excluded by default
- Commits: Imperative present-tense (add async cache invalidation), optional
  (#927) PR number

CLAUDE.md (Guidance to Claude Code):

- Project overview: Bi-temporal data model, hybrid retrieval, custom entity
  definitions
- Dev Commands: Root vs server/ vs mcp_server/ scopes with
  install/format/lint/test
- Architecture: graphiti.py entry point; driver/llm_client/embedder; search;
  prompts; utils
- Config: Neo4j defaults to neo4j, FalkorDB to default_db, both overridable
- LLM Models (Nov 2025): GPT-5 (reasoning), GPT-4.1, Claude 4.5/3.7/3.5, Gemini
  2.5/2.0/1.5
- MCP pattern: cursor_rules.md for search-before-adding-memory

Evaluation as reusable pattern: Strengths: Separation of concerns (AGENTS
generic, CLAUDE AI-specific); actionability (copy-paste ready commands);
forward-dated model list; completeness Weaknesses: Not template-friendly
(graphiti-specific); no pyproject.toml coverage; no troubleshooting FAQ; OTEL
not referenced Reusability: Adaptable for Python graph libraries but requires
fork-and-modify.

## Examples Inventory

| Directory        | Topic                  | Runnable | Notes                             |
| ---------------- | ---------------------- | -------- | --------------------------------- |
| quickstart/      | Core API               | Yes      | Neo4j, FalkorDB, Neptune variants |
| azure-openai/    | Azure OpenAI + Neo4j   | Yes      | .env.example provided             |
| gliner2/         | GLiNER2 hybrid NER+LLM | Yes      | Auto-downloads model              |
| opentelemetry/   | OTEL tracing           | Yes      | ConsoleSpanExporter demo          |
| ecommerce/       | E-commerce scenario    | Likely   | README not sampled                |
| langgraph-agent/ | LangChain LangGraph    | Likely   | README not sampled                |
| podcast/         | Podcast ingestion      | Likely   | README not sampled                |
| wizard_of_oz/    | User study scenario    | Likely   | README not sampled                |

Quality: Coverage excellent (providers, backends, patterns); outdatedness risk
low; runability barrier medium (database assumed); clarity high; breadth
excellent.

## Gaps

1. Architecture overview document (episode pipeline, graph schema, communities,
   sagas)
2. API reference (return types, custom types, search config recipes
   underdocumented)
3. Performance tuning guide (SEMAPHORE_LIMIT only in MCP docs, no graph-size
   recommendations)
4. Migration guide (v0.17→v0.22, backup/restore, database switching)
5. Troubleshooting FAQ (deduplication issues, extraction debugging, structured
   output failures)
6. Custom entity type cookbook (Pydantic definition, querying, versioning)

## Band

Strong

Graphiti has excellent foundational documentation: README is a masterclass in
positioning and clarity; AGENTS.md and CLAUDE.md form reusable AI-assisted
development pattern; MCP server README is production-grade. Examples span 9
scenarios with clear code. Main gaps are architecture overview, sparse API
docstrings, and missing performance/migration guides. Solidly above industry
median for open-source 25K-star temporal KG library.
