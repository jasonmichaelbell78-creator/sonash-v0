# Findings: LadybugDB Deep Dive

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-07 **Sub-Question:** D1b-1

---

## Summary

LadybugDB is viable for T28 with one unresolved risk (bus factor). Fork
timeline: KuzuDB archived October 10, 2025; LadybugDB v0.12.0 released November
14, 2025. Current status: v0.15.3 (April 1, 2026), 896 stars, MIT license.
Technical fit is excellent — Cypher + FTS (BM25) + vector (HNSW) + ACID in one
embedded store. Windows CLI binary confirmed; Node.js native binding on Windows
documented but unconfirmed by independent user. WASM path (`lbug-wasm`) is a
safe Windows fallback. Bus factor is real — Arun Sharma (ex-Facebook/Google) is
sole named leader.

---

## Key Findings

### 1. Fork Timeline Pinned [CONFIDENCE: HIGH]

- KuzuDB archived October 10, 2025 (team acquired, likely by Apple)
- LadybugDB v0.12.0 released November 14, 2025
- Full Node.js support landed post-v0.12.1 (was "not working yet" in initial
  release)
- Prior research star count confirmed: 896 (prior said 894 — essentially
  unchanged)

### 2. Current Status [CONFIDENCE: HIGH]

- Latest version: v0.15.3 (April 1, 2026)
- Release cadence: approximately monthly
- GitHub: 896 stars, 67 contributors
- npm package: `@ladybugdb/core`
- Active Discord community
- MIT license

### 3. Technical Capabilities [CONFIDENCE: HIGH]

- **Query language:** openCypher (property graph queries)
- **ACID transactions:** Yes
- **FTS:** Built-in, BM25-scored
- **Vector search:** HNSW index, native
- **Larger-than-memory support:** Yes (disk-based with memory-mapped pages)
- **Single-writer limitation:** Present but irrelevant for T28's ~10/day write
  pattern

### 4. Windows Support [CONFIDENCE: MEDIUM]

- **CLI binary:** Confirmed (`lbug_cli-windows-x86_64.zip` in v0.15.3 release
  assets)
- **Node.js native binding:** Documented but no independent Windows user
  confirmation found
- **WASM fallback:** `lbug-wasm` runs in Node.js worker threads,
  platform-agnostic, officially supported
- **Recommendation:** Test `npm install @ladybugdb/core` on Windows 11 + Node.js
  v22 before committing (~5 min test)

### 5. Bus Factor Risk [CONFIDENCE: MEDIUM]

- Arun Sharma (ex-Facebook/Google) is sole named project leader
- 67 GitHub contributors but org membership is private
- No confirmed funding close (Sharma was "confident" in November 2025 but no
  announcement since)
- Strategic concentration risk is real
- **Mitigated by:** MIT license + SQLite as exit path (data can always be
  exported)

### 6. TypeScript Support [CONFIDENCE: MEDIUM]

- `.d.ts` files likely bundled in npm package but not verified from primary
  sources
- Check `node_modules/@ladybugdb/core` after install to confirm

### 7. Comparison with SQLite simple-graph [CONFIDENCE: MEDIUM]

| Dimension       | LadybugDB                      | SQLite + simple-graph            |
| --------------- | ------------------------------ | -------------------------------- |
| Query language  | Cypher (native graph)          | SQL + recursive CTEs             |
| FTS             | Built-in BM25                  | FTS5 extension                   |
| Vector          | Built-in HNSW                  | sqlite-vec extension             |
| Graph traversal | Native, optimized              | CTE-based, adequate at T28 scale |
| Maturity        | 6 months as fork               | 25+ years                        |
| Ecosystem       | Growing, smaller               | Massive                          |
| Windows         | CLI confirmed, NAPI needs test | Excellent (better-sqlite3)       |
| Risk            | Bus factor, fork age           | Near-zero                        |

**When to choose LadybugDB over SQLite:** When Cypher query expressiveness
matters more than ecosystem safety. For T28's first foray, SQLite is lower risk.
LadybugDB is the upgrade path if graph queries become complex enough to outgrow
recursive CTEs.

---

## Sources

| #   | Title                                       | Type             | Trust  |
| --- | ------------------------------------------- | ---------------- | ------ |
| 1   | LadybugDB GitHub repository                 | Official repo    | HIGH   |
| 2   | LadybugDB v0.15.3 release assets            | Official release | HIGH   |
| 3   | @ladybugdb/core npm package                 | Official package | HIGH   |
| 4   | KuzuDB archival announcement (October 2025) | News             | HIGH   |
| 5   | Arun Sharma interview/posts (November 2025) | Community        | MEDIUM |
| 6   | LadybugDB Discord community                 | Community        | MEDIUM |

---

## Gaps

1. **Windows + `npm install @ladybugdb/core` on Node.js 22** — needs a 5-minute
   local test to confirm native binding works
2. **TypeScript types bundle status** — check `node_modules/@ladybugdb/core`
   after install
3. **Funding status unknown** — Sharma was "confident" in November 2025 but no
   close announced
4. **No independent production user reports found** — all evidence is from the
   project itself

---

## Serendipity

- WASM path (`lbug-wasm`) as a platform-agnostic fallback is a significant
  safety net — if native bindings fail on any platform, WASM in worker threads
  provides identical functionality at some performance cost
