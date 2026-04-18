# Engineer View — getzep/graphiti

_Dual-lens health + fitness assessment. **Primary lens: creator** (home extracts
patterns, does not adopt)._

## Repo Snapshot

| Field            | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| URL              | https://github.com/getzep/graphiti                                       |
| Stars / Forks    | 25,065 / 2,491                                                           |
| Primary language | Python                                                                   |
| License          | Apache-2.0                                                               |
| Last pushed      | 2026-04-14 (3 days before analysis)                                      |
| Description      | Build Real-Time Knowledge Graphs for AI Agents                           |
| Topics           | agents, graph, llms, rag                                                 |
| Size             | 14 MB (clone: 29 MB with history)                                        |
| Classification   | framework                                                                |
| Archived         | No                                                                       |
| Fork             | No                                                                       |
| arXiv paper      | 2501.13956 (Zep: Temporal Knowledge Graph Architecture for Agent Memory) |

## Summary Bands

| Dimension       | Band   | Score  | Rationale                                                                                                                                                                                       |
| --------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | Solid  | 7.0/10 | Parameterized queries, non-root Docker, env-var credentials. But REST server has zero auth, verbose logging risks PII, dependency surface is wide.                                              |
| Reliability     | Solid  | 7.5/10 | Semaphore back-pressure, exponential backoff retries, provider-agnostic ABCs, health-checked integration tests. Gaps: no chaos/resilience tests, no SLO definitions, no multi-DB parity tests.  |
| Maintainability | Strong | 8.5/10 | Clean ABCs, namespace-pattern API, type-checked (ruff + pyright), line-length discipline, active RFC process. Mock file at 2053 LOC is a watchlist item.                                        |
| Documentation   | Strong | 8.5/10 | README is exceptional. MCP server README is production-grade (684 lines). cursor_rules.md is a reusable pattern. Gaps: no architecture overview doc, no migration guide, sparse API docstrings. |
| Process         | Strong | 8.0/10 | 13 CI workflows (lint, typecheck, codeql, 2x Claude review, 3x release, PR triage). RFC-required for new features. Apache CLA. AI moderator workflow.                                           |
| Velocity        | Strong | 9.0/10 | Pushed 3 days ago. 25K stars, 2491 forks. PR numbers in the #900s cited in AGENTS.md. Two model-catalog updates in last few months (Nov 2025 pin). Trending on Trendshift.                      |

## Absence Patterns (what's missing that should be there)

1. **No authentication on REST server.** `server/graph_service/routers/` exposes
   `POST /messages`, `POST /entity-node`, `POST /search`,
   `DELETE /group/{group_id}`, `POST /clear` with no auth middleware. Default
   stance: "wrap in your own gateway." Fine for a library, risky for the default
   deploy path.
2. **No REST server test suite.** `server/` has zero pytest files. FastAPI route
   logic is unverified by automated tests.
3. **No performance or benchmark tests.** Concurrency-tuning advice lives in the
   MCP README, but no tests enforce latency targets or throughput floors.
4. **No LLM response snapshot tests.** Non-deterministic LLM outputs are handled
   via mocks in unit tests, but there's no recorded-fixture regression layer for
   ingestion/dedupe/extraction prompts.
5. **No multi-DB parity tests.** `graph_driver` fixture parametrizes over
   Neo4j + FalkorDB, but no explicit test asserts behavioral equivalence across
   drivers.
6. **No architecture overview document.** `graphiti_core/` module map lives only
   in `CLAUDE.md`; no ARCHITECTURE.md, no episode-ingestion-pipeline
   walkthrough.
7. **No migration guide.** README describes `v0.17.0` as the release that
   changed driver constructors, but no MIGRATIONS.md; version bumps are
   readme-only.
8. **No coverage reporting.** No `pytest-cov` integration, no coverage badge, no
   minimum-coverage gate.
9. **No multi-Python-version CI matrix.** Python 3.10 only; no 3.11/3.12/3.13
   testing despite pyproject declaring `>=3.10`.

## Strengths (that balance the absences)

- **Provider abstractions done right.** `GraphDriver`, `LLMClient`,
  `EmbedderClient` ABCs are small, complete, and implementable without core
  changes. Four graph drivers + six LLM clients + four embedder clients, all
  behind the same interface.
- **Async-first, semaphore-bounded.** `helpers.semaphore_gather()` with
  `SEMAPHORE_LIMIT` env var is a clean back-pressure primitive. Default 10
  concurrent episodes in MCP server, 20 in core.
- **Opt-in OpenTelemetry with zero-overhead default.** `NoOpTracer` fallback;
  opt-in via constructor kwarg; span prefix configurable.
- **Transparent telemetry.** Anonymous PostHog UUID + config choices only;
  explicit exclusions; pytest auto-disable; points at source file.
- **Separation of core / server / MCP.** Three distinct packages, each with its
  own `pyproject.toml`, own tests, own entry point. Core library doesn't import
  from server or MCP.
- **Structured-output-native LLM clients.** OpenAI JSON schema mode, Anthropic
  Pydantic response_model, Gemini JSON mode — per-provider use of native
  structured output, not string-parsing.
- **Integration tests use real databases.** `docker-compose.test.yml` spins up
  Neo4j 5.26-community + FalkorDB. Health checks with retries.
- **RFC before PR for new integrations.** New drivers / LLM clients / embedders
  require a GitHub issue RFC. Bug fixes don't, and are prioritized.
- **Apache CLA + CodeQL + PR triage in CI.** Governance and supply-chain posture
  is above average for an open-source project of this size.

## Dual-Lens Scoring

| Lens                  | Band           | Score  | Rationale                                                                                                                                                                                                                                         |
| --------------------- | -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creator (primary)** | Extract-only   | 8.0/10 | High conceptual value for CC-OS work. Specific patterns (cursor_rules, model catalog, telemetry framing, SEMAPHORE guidance, structured-output floor) directly liftable. Conceptual value (bi-temporal model) challenges home memory assumptions. |
| Adoption (secondary)  | Avoid-for-home | 2.0/10 | Stack mismatch (Python vs TS). Requires graph DB infrastructure home doesn't have. No home use case justifies operational load. Apache-2.0 license is permissive but irrelevant when the tech doesn't fit.                                        |

For its intended user (Python developer building an agent that needs long-term
memory), adoption scoring flips: **Trial 7.5/10 → Adopt 8.0/10 if scale requires
it**. Trial first because the operational cost (Neo4j/FalkorDB + OpenAI spend)
is nontrivial and the "build your own dashboards" stance means the OSS doesn't
come with the Zep platform's tools.

## Adoption Verdict (home context)

**Extract-only.**

**Adoption blockers:**

1. Language mismatch (Python 3.10+ vs home Next.js/TypeScript/Firebase).
2. Infrastructure requirement (external graph DB: Neo4j, FalkorDB, Kuzu, or
   Neptune).
3. LLM API spend (OpenAI required by default; structured-output-native LLM for
   reliable operation).
4. No home use case justifying the load — current memory needs are covered by
   memory MCP + episodic-memory skill.

**Recommendation:**

- Lift `cursor_rules.md` pattern into `.claude/skills/episodic-memory/` as an
  operating protocol for AI memory clients.
- Add a versioned LLM model catalog block to home `CLAUDE.md` §1.
- Adopt the "Structured Output is a hard floor" framing in any future home skill
  that dispatches multiple LLM providers.
- Port telemetry transparency template if/when a home tool ships phone-home
  behavior.
- Optionally: run `mcp_server/` standalone against Claude Desktop as a
  personal-memory experiment, outside SoNash, to feel the bi-temporal model
  firsthand.

## Findings Count

| Severity | Count | Source                                                                                                     |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| High     | 1     | Security (unauthenticated REST endpoints)                                                                  |
| Medium   | 4     | Security (compose plaintext creds, verbose logging, HTTP-only, wide deps)                                  |
| Low      | 2     | Security (example default passwords, basic type-check mode)                                                |
| Info     | 2     | Security (MCP config leak surfaces, no input-length validation)                                            |
| Absence  | 9     | Engineer View (auth, server tests, perf, snapshot, parity, arch doc, migration guide, coverage, Py matrix) |

## Cross-Repo Links

`related_repos[]`:

- Zep SDK (managed platform) — commercial counterpart, referenced in README
- LangGraph (langchain-ai/langgraph) — integration example in
  `examples/langgraph-agent/`
- FastMCP — MCP server framework used in `mcp_server/`
- Neo4j / FalkorDB / Kuzu / Neptune — graph DB backends

`cross_repo_connections[]`:

- None in home `.research/EXTRACTIONS.md` yet; this is the first analyzed repo
  in the "agent memory" cluster.
