# Security Audit — getzep/graphiti

## Summary

Graphiti demonstrates a **solid security posture** with proper use of
parameterized queries, environment-based credential management, and
containerization best practices. The codebase uses typed Python with linting
enforcement, and authentication patterns are appropriate for a library-focused
project. Primary concerns include unauthenticated REST API endpoints, verbose
default logging with potential PII exposure, dependency breadth increasing
supply chain risk, and lack of HTTPS enforcement in default configurations. The
project addresses credential handling correctly but lacks defense-in-depth
controls around sensitive data in logs and error messages.

---

## Findings

### High: Unauthenticated REST API Endpoints

**Location:** server/graph_service/routers/ingest.py,
server/graph_service/routers/retrieve.py  
**Finding:** All FastAPI endpoints (POST /messages, POST /entity-node, DELETE
endpoints, POST /search, POST /get-memory) lack authentication or authorization
checks. The server exposes dangerous operations like `/clear` (clears entire
graph) and `/delete/group/{group_id}` without credentials.  
**Impact:** Any network-reachable caller can read all graph data, inject false
information, or destroy data. In multi-tenant scenarios (implied by group_id
parameter), one tenant could access/modify another's data.  
**Evidence:** @router.delete('/group/{group_id}', ...) async def
delete_group(group_id: str, graphiti: ZepGraphitiDep): awaits
graphiti.delete_group(group_id) with no auth check

### Medium: Environment Variables Stored in Docker Compose Plaintext

**Location:** docker-compose.yml:22-26, docker-compose.test.yml:20-25  
**Finding:** Database passwords (NEO4J_PASSWORD) and API keys (OPENAI_API_KEY)
are passed directly as environment variables without secrets management. Default
password "password" used in examples.  
**Impact:** Credentials leak in docker-compose logs, process listings, and
container inspect output. Accidental commits of docker-compose files expose
secrets.

### Medium: Verbose Logging with Potential PII Exposure

**Location:** server/graph_service/routers/ingest.py:21,
graphiti_core/driver/neo4j/operations/\*  
**Finding:** Unfiltered logging of graph content with logger.debug() and print()
statements that include episode UUIDs and semantic content. No data sanitization
before logging.  
**Impact:** Episode bodies (raw user conversations/messages) may be logged,
exposing PII to log aggregation systems and files.

### Medium: Exposed HTTP Port in Default Compose (No TLS)

**Location:** docker-compose.yml:7, docker-compose.yml:43-44  
**Finding:** FastAPI server exposed on port 8000 (HTTP only) and Neo4j on
7474/7687 with no TLS enforcement. Health check uses unencrypted HTTP.  
**Impact:** Credentials transmitted in plaintext over network. Man-in-the-middle
attacks intercept API keys in Authorization headers or request bodies.

### Medium: Wide Dependency Surface with No Lock File Pinning

**Location:** pyproject.toml  
**Finding:** While uv.lock exists, core dependencies lack tight version
constraints (e.g., openai>=1.91.0, neo4j>=5.26.0 allow arbitrary patch
upgrades). Dependencies span 20+ packages with optional extras creating large
attack surface.  
**Impact:** Vulnerable transitive dependencies can be installed. Supply chain
attacks through compromised packages (tenacity, pydantic, neo4j, openai) affect
all instances.

### Low: Hardcoded Default Passwords in Examples

**Location:** examples/ecommerce/runner.py:36,
examples/azure-openai/azure_openai_neo4j.py:54  
**Finding:** Example code uses default fallback:
os.environ.get('NEO4J_PASSWORD', 'password').  
**Impact:** If examples are used as templates in production, weak defaults may
persist.

### Low: Type Checking Not Enforced at Strict Level

**Location:** pyproject.toml:101-104  
**Finding:** Main project uses typeCheckingMode = "basic" instead of "strict".  
**Impact:** Type confusion in prompt construction could lead to injection
vulnerabilities.

### Info: MCP Server Configuration Accepts Inline Secrets

**Location:** mcp_server/src/config/schema.py:87-132  
**Finding:** Configuration supports API keys in config.yaml and environment
substitution syntax, but lacks secrets masking in error messages.  
**Impact:** Configuration errors may print full config with embedded
credentials.

### Info: No Input Validation on REST API Parameters

**Location:** server/graph_service/routers/retrieve.py:37, ingest.py:73-89  
**Finding:** Path parameters (group_id, uuid) accepted without format/length
constraints beyond Pydantic.  
**Impact:** Potential for resource exhaustion or edge cases if business logic
doesn't validate.

---

## Strengths

- **Proper Parameterized Queries**: All Cypher queries use parameter binding
  ($param syntax) preventing Cypher injection attacks.
- **Environment Variable Configuration**: Credentials loaded from environment
  via pydantic-settings and .env files, not hardcoded.
- **Non-Root Docker User**: Dockerfile creates unprivileged app user and
  switches to it before running, reducing container escape impact.
- **Type Safety**: Pydantic models enforce strict validation on all input DTOs,
  preventing many injection vectors.
- **Semantic Versioning & Release Process**: GitHub Actions workflows enforce
  versioning validation and require explicit tags. Supply chain signed with
  depots.
- **Graceful Error Handling**: Custom exception classes avoid leaking stack
  traces in HTTP responses.
- **SECURITY.md Present**: Project includes responsible disclosure guidance.

---

## Band

**Solid** — The library correctly implements core security controls
(parameterized queries, environment-based secrets, non-root containers)
appropriate for a Python knowledge graph library. However, the accompanying REST
API lacks authentication/authorization, logging is overly verbose with PII
risks, and deployment guidance doesn't emphasize TLS/secrets management.
Production deployments require additional security layers (API gateway, log
filtering, network segmentation). The security posture is sufficient for
research/internal use but insufficient for public-facing or multi-tenant systems
without hardening.
