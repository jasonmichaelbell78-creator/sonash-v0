# Test Infrastructure — getzep/graphiti

## Summary

Graphiti demonstrates a **solid testing posture** with comprehensive unit and
integration test coverage, well-structured CI/CD, and clear separation between
fast unit tests and slow integration tests. The test architecture effectively
handles multiple database drivers (Neo4j, FalkorDB) and LLM providers through
fixtures and markers. Key strengths include explicit integration markers for
database tests and separate test suites for core, server, and MCP server
components. Gaps include absence of performance/benchmark tests, load testing,
LLM response validation strategies, and server REST API test coverage.

## Inventory

| Category                              | Count            | Location                                                  | Notes                                                                                      |
| ------------------------------------- | ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Unit test files (core)                | 29               | tests/                                                    | Includes llm_client, embedder, utils modules                                               |
| Integration test files (marked \_int) | 4                | tests/ (root)                                             | test_graphiti_int.py, test_edge_int.py, test_node_int.py, test_entity_exclusion_int.py     |
| Database integration tests            | 5                | tests/driver/, tests/cross_encoder/                       | FalkorDB driver, BGE reranker integration tests                                            |
| MCP server tests                      | 11               | mcp_server/tests/                                         | Async ops, comprehensive integration, configuration, fixtures, MCP transports, stress/load |
| Server REST API tests                 | 0                | server/                                                   | No dedicated test suite found                                                              |
| Core conftest fixtures                | 2                | conftest.py                                               | graph_driver (parametrized for Neo4j/FalkorDB), mock_embedder                              |
| MCP conftest                          | 1                | mcp_server/tests/conftest.py                              | Minimal fixture setup; config()                                                            |
| Pytest config files                   | 3                | pytest.ini, mcp_server/pytest.ini, tests/evals/pytest.ini | Integration markers, asyncio_mode=auto, separate MCP config                                |
| CI workflows                          | 2 (test-focused) | .github/workflows/unit_tests.yml, docker-compose.test.yml | Separate unit and DB integration jobs                                                      |
| Evaluation scripts (e2e)              | 2                | tests/evals/                                              | eval_e2e_graph_building.py, eval_cli.py (not pytest tests)                                 |
| Docker compose (integration)          | 1                | docker-compose.test.yml                                   | Spins up Neo4j 5.26-community + FalkorDB services                                          |
| Makefile test targets                 | 1                | Makefile                                                  | test target with DISABLE\_\* env vars to run unit only                                     |

## Test Strategy

**Unit vs. Integration Ratio**: ~88% unit (29/33 core tests run via CI
unit-tests job); ~12% integration (4 root-level marked tests). Database tests
run separately in dedicated CI job.

**Fixture Design**:

- **graph_driver** (helpers_test.py): Parametrized fixture across GraphProvider
  enum (NEO4J, FALKORDB) with environment-based feature disabling. Driver
  URLs/credentials from env vars with sensible defaults (Neo4j:
  bolt://localhost:7687, FalkorDB: localhost:6379).
- **mock_embedder**: Lightweight mock for LLM-less unit testing; avoids external
  API calls in fast tests.
- **Integration markers**: @pytest.mark.integration explicitly tags slow tests;
  CI runs with -m "not integration" to exclude them from unit test job.

**Mocking Patterns**:

- LLM clients tested with mocks (test_anthropic_client.py, test_gemini_client.py
  mock API responses).
- Embedding clients similarly mocked to avoid API costs (test_openai.py,
  test_voyage.py fixtures).
- Cross-encoder (BGE reranker) has both mocked unit tests and a real integration
  test.

**Test Organization**:

- Core library tests grouped by module: llm_client/, embedder/, driver/,
  cross_encoder/, utils/ (maintenance, search).
- MCP server isolation: separate conftest prevents pytest from collecting main
  project's fixtures; MCP has its own asyncio + config setup.
- Naming convention: test*\*\_int.py for integration tests, test*\*.py for unit
  tests.

## Integration & E2E

**Real Databases**: Yes. docker-compose.test.yml spins up real Neo4j
5.26-community and FalkorDB services. CI job database-integration-tests waits
for health checks before running driver tests.

**Real LLMs**: No in CI. Anthropic integration test is skipped in CI unless
ANTHROPIC_API_KEY provided; marked @pytest.mark.integration and pytestmark =
pytest.mark.skipif(...). No real OpenAI/Gemini calls in CI (mocks used).

**Skip Markers**:

- pytestmark = pytest.mark.integration used in test_graphiti_int.py,
  test_entity_exclusion_int.py.
- pytestmark = pytest.mark.skipif(ANTHROPIC_API_KEY not set, ...) in
  test_anthropic_client_int.py.
- CI explicitly ignores via --ignore flags for \_int tests in unit job, runs
  them separately.

**Flakiness Mitigation**:

- Health checks with retries in docker-compose (Neo4j: 10 retries, 10s interval;
  FalkorDB: 5 retries, 10s interval).
- Explicit wait loops in CI before tests run.
- No retry mechanisms in pytest itself visible (no pytest-rerunfailures).

**E2E Coverage**: MCP server has comprehensive integration tests
(test_comprehensive_integration.py, test_mcp_integration.py); eval scripts exist
but are manual scripts, not pytest-automated.

## CI Configuration

**Workflows**:

- unit_tests.yml: Two jobs—(1) unit-tests on Python 3.10 with unit tests only,
  (2) database-integration-tests with Neo4j + FalkorDB services.
- lint.yml: Ruff linting on Python 3.10.
- typecheck.yml: Likely Pyright type checking (referenced in Makefile).

**Python Matrix**: Single version (3.10); no multi-version testing.

**OS Matrix**: Both jobs run on depot-ubuntu-22.04.

**Dependencies**:

- All extras installed in both jobs: uv sync --all-extras (includes all optional
  LLM/embedding providers).
- Environment isolation: DISABLE_NEPTUNE=1, DISABLE_NEO4J=1, DISABLE_FALKORDB=1,
  DISABLE_KUZU=1 in unit test job.

**Caching**: No explicit caching visible; relies on Depot's speed.

**Test Reporting**: No explicit test result publishing. Workflow likely fails if
tests fail.

**Gating**: Tests gate on PR merge (workflow runs on pull_request to main).

## Gaps

1. **No Performance / Benchmark Tests**: No benchmark/ or perf\_ tests; no
   pytest-benchmark integration. No load testing for large graphs.
2. **No REST API Server Tests**: server/ directory has no test suite. FastAPI
   service logic untested.
3. **No LLM Response Snapshot Testing**: LLM-dependent extraction/summarization
   logic lacks recorded fixtures or snapshot tests.
4. **No Chaos / Resilience Tests**: No tests for DB connection failures, timeout
   handling, retry logic under stress.
5. **No Coverage Reporting**: No pytest-cov integration, no coverage badge/gate.
6. **No Mutation Testing**: No pytest-mutagen or equivalent.
7. **Limited Async Testing Rigor**: MCP tests use @pytest.mark.asyncio but no
   explicit timeout specs.
8. **No End-to-End User Workflows**: Evals exist but are manual scripts; no
   automated E2E test of common user journeys.
9. **No Graphiti Core Tests in graphiti_core/ Subdir**: All tests in top-level
   tests/ directory.
10. **No Multi-DB Parity Tests**: While fixtures parametrize over
    Neo4j/FalkorDB, no explicit test that behavior is identical.

## Band

**Test Infrastructure Band: Solid**

**Rationale**: Graphiti has a well-structured, mature test suite with clear
separation of unit and integration concerns, explicit CI gating on multiple test
jobs, and good use of fixtures to handle provider variability. Database
integration is real (not mocked) with health checks and separate CI scheduling.
The main gaps—missing server REST tests, no performance benchmarks, and lack of
LLM response validation—are notable but not critical for a library focused on
graph core functionality. The MCP server has its own isolated test suite with
stress/load tests, showing thoughtful test architecture. Coverage could be
improved with snapshot testing for LLM outputs and E2E workflow tests, but
overall testing is methodical and prevents regressions effectively.
