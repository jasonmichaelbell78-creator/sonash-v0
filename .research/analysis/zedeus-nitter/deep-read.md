# Deep Read: zedeus/nitter

**Analyzed:** 2026-04-12 | **Depth:** Standard

## Internal Artifacts Found and Read

### Primary Documentation

1. **README.md** (199 lines) -- Installation (manual + Docker), config, systemd
   service, wiki references.
2. **nitter.example.conf** (59 lines) -- Heavily commented config template:
   server, cache (Redis), proxy, user preferences.
3. **No CONTRIBUTING.md, no SECURITY.md, no CODE_OF_CONDUCT.md** -- 42%
   community health.

### Build & Deployment

4. **Dockerfile** (26 lines) -- Multi-stage: nim base -> alpine runtime.
   Non-root user (uid 998), read-only filesystem, CAP_DROP ALL. Excellent
   container hardening.
5. **Dockerfile.arm64** (26 lines) -- Native ARM64 compilation (not
   cross-compile).
6. **docker-compose.yml** (49 lines) -- nitter + Redis. Read-only root,
   capability drops, health checks.
7. **nitter.nimble** (35 lines) -- 11 dependencies pinned to git commit hashes
   (not semver).
8. **config.nims** (14 lines) -- Compiler flags: SSL, threading, warnings.

### Architecture (from code)

9. **Layered architecture:** Core (types, config, utils) -> API/Scraping (api,
   apiutils, auth, parser) -> Data (redis_cache, http_pool) -> Routes -> Views.
10. **Dual session system:** OAuth (legacy) and Cookie (modern ct0 CSRF).
    Session pool manages multiple Twitter accounts for rate limit distribution.
11. **Parser versioning:** experimental/parser/ allows new Twitter API parsers
    alongside old ones. Graceful API evolution.
12. **Cache-aware serialization:** flatty (binary) + snappy (compression) for
    Redis. Avoids JSON bloat.
13. **Karax DSL:** Compile-time HTML generation. React-like virtual DOM in Nim.

### Tools

14. **tools/get_session.py** -- Twitter OAuth session token extraction.
15. **tools/create_session_browser.py** -- Browser-based session creation.
16. **tools/gencss.nim, rendermd.nim** -- SCSS and Markdown build tasks.

### Tests

17. **9 integration test files** (746 LOC) -- SeleniumBase framework, Redis
    integration, pytest with 3 workers + 5 reruns.

## Knowledge Not Visible From Code Alone

1. **Adversarial scraping architecture** -- No official API. Uses real user
   sessions to spoof browser requests to Twitter GraphQL endpoints. Session pool
   rotates on rate limits. Per-session, per-endpoint rate tracking.
2. **Docker container hardening** -- Read-only filesystem + CAP_DROP ALL +
   non-root user + health checks. This is one of the most hardened Docker setups
   in the T29 corpus.
3. **Parser versioning for API evolution** -- experimental/ module allows
   developing new parsers without breaking existing code. Twitter changes API
   responses frequently; this isolates the impact.
4. **Binary+compression cache strategy** -- flatty serialization + snappy
   compression for Redis. More efficient than JSON serialization for cache.
5. **TID generation** -- Transaction ID generation for fingerprinting resistance
   when making requests to Twitter.
6. **XSS vulnerability** -- Security agent found unescaped HTML output via Karax
   verbatim keyword. Tweet content rendered as raw HTML without escaping.

## Referenced External Resources

- GitHub Wiki: session tokens, instances list, browser extensions, Nginx/Apache
  setup
- Twitter GraphQL API (unofficial, reverse-engineered)
- Docker Hub: zedeus/nitter (multi-arch)
