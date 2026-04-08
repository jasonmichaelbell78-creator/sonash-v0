# V1a Backend Verification - Claims C-001 to C-012

**Phase:** 2.5 Post-Search Verification  
**Verifier:** V1a  
**Date:** 2026-04-07  
**Scope:** C-001 through C-012 (backend/data-layer claims)  
**Critical prior finding applied:** LadybugDB npm package is `lbug` (not
`@ladybugdb/core` or `@ladybug/core`)

---

## Verdict Table

| Claim ID | Claim Summary                                                                         | Verdict      | Confidence | Method |
| -------- | ------------------------------------------------------------------------------------- | ------------ | ---------- | ------ |
| C-001    | SQLite + better-sqlite3 v12.8.0 as primary store; five findings converge              | VERIFIED     | HIGH       | web    |
| C-002    | better-sqlite3 v12.8.0 bundles SQLite 3.51.3; closes WAL corruption in 3.51.0-3.51.2  | VERIFIED     | HIGH       | web    |
| C-003    | SQLite validated in production at 2.1M nodes / 4.9M edges                             | UNVERIFIABLE | LOW        | web    |
| C-004    | better-sqlite3 ~18us (53,000 ops/s); node:sqlite ~24us (41,000 ops/s)                 | UNVERIFIABLE | LOW        | web    |
| C-005    | DuckDB has 400-900us per-row write penalty vs SQLite                                  | CONFLICTED   | MEDIUM     | web    |
| C-006    | LibSQL/Turso has known Windows errors (issue #1797)                                   | VERIFIED     | HIGH       | web    |
| C-007    | LadybugDB v0.15.3 = community fork of Kuzu, archived Oct 2025 after Apple acquisition | CONFLICTED   | MEDIUM     | web    |
| C-008    | Correct LadybugDB npm package is @ladybug/core NOT @ladybugdb/core                    | REFUTED      | HIGH       | web    |
| C-009    | LadybugDB Windows NAPI not verified on Windows 11 + Node.js v22; WASM fallback exists | UNVERIFIABLE | LOW        | web    |
| C-010    | CozoDB stalled since December 2023; HIGH risk as primary backend                      | VERIFIED     | HIGH       | web    |
| C-011    | @modelcontextprotocol/server-memory: GitHub #2577 corruption, no tags, O(N) search    | VERIFIED     | MEDIUM     | web    |
| C-012    | n-r-w/knowledgegraph-mcp: maintainer disillusionment; last committed December 2024    | CONFLICTED   | MEDIUM     | web    |

---

## Per-Claim Evidence

### C-001 - VERIFIED (HIGH)

**Claim:** SQLite with better-sqlite3 v12.8.0 is the correct primary store for
T28 v1. Five independent findings files converge on this choice without
contradiction.

**Evidence:** GitHub release page for better-sqlite3 v12.8.0 confirms the
package exists and was recently published. The five-findings convergence is
internal research consistency, not independently verifiable -- but package
currency and existence are confirmed. The recommendation is consistent with
general industry guidance for embedded OLTP workloads.

**Sources:**

- https://github.com/WiseLibs/better-sqlite3/releases
- https://www.npmjs.com/package/better-sqlite3

---

### C-002 - VERIFIED (HIGH)

**Claim:** better-sqlite3 v12.8.0 bundles SQLite 3.51.3, which closes a critical
WAL corruption bug present in 3.51.0-3.51.2.

**Evidence:** GitHub release page for better-sqlite3 v12.8.0 explicitly states
Update SQLite to version 3.51.3 (PR #1460). SQLite.org release notes confirm the
WAL-reset database corruption bug was fixed in 3.51.3 (released 2026-03-13), and
that the bug was present in all versions from 3.7.0 through 3.51.2. Both facts
confirmed by official sources.

**Sources:**

- https://github.com/WiseLibs/better-sqlite3/releases/tag/v12.8.0
- https://sqlite.org/releaselog/3_51_3.html

---

### C-003 - UNVERIFIABLE (LOW)

**Claim:** SQLite has been validated in production at 2.1 million nodes and 4.9
million edges.

**Evidence:** No primary source found for these specific figures. Web search
across SQLite graph database benchmarks returned no results matching these exact
counts. The claim may originate from an internal research note or non-indexed
case study. General SQLite performance at millions of records is
well-documented, but the exact 2.1M nodes / 4.9M edges cannot be traced to a
citable source.

**Sources:** None confirming the specific figures.

---

### C-004 - UNVERIFIABLE (LOW)

**Claim:** Write latency for better-sqlite3 is approximately 18us (53,000
ops/s). node:sqlite is approximately 24us (41,000 ops/s).

**Evidence:** No primary source found with these exact latency figures. Web
search returned general performance claims but no source citing ~18us write
latency or 53,000 write ops/s specifically. These figures may originate from a
benchmark run during research not published to a citable URL. The directional
ordering (better-sqlite3 outperforming node:sqlite) is consistent with published
information.

**Sources:** None confirming the specific microsecond figures.

---

### C-005 - CONFLICTED (MEDIUM)

**Claim:** DuckDB has a structural 400-900us per-row write penalty versus SQLite
and should be used as an analytical overlay only, never as primary store.

**Evidence:** Multiple independent sources confirm DuckDB is dramatically slower
than SQLite for per-row writes. Benchmarks show DuckDB at ~4k naive inserts/sec
vs SQLite 30k-40k, with write transactions favoring SQLite by 10x-500x. The
analytical overlay recommendation is fully corroborated. However, the specific
400-900us per-row range is not confirmed by any source -- that precision
requires a controlled benchmark.

**Conflict type:** Complementary -- sources confirm direction and magnitude but
not the specific us range.

**Conflicts:**

- Source A (research claim): States 400-900us per-row penalty (no primary
  citation found)
- Source B (marending.dev / DataCamp): DuckDB inserts ~10x-500x slower than
  SQLite; consistent with hundreds of us but specific range not stated

**Sources:**

- https://marending.dev/notes/sqlite-vs-duckdb/
- https://www.datacamp.com/blog/duckdb-vs-sqlite-complete-database-comparison
- https://github.com/duckdb/duckdb/discussions/13371

---

### C-006 - VERIFIED (HIGH)

**Claim:** LibSQL/Turso has known Windows errors (issue #1797) and is not
recommended for T28.

**Evidence:** GitHub issue #1797 in tursodatabase/libsql confirmed open and
reproducible. Error: missing compiled binaries for @libsql/win32-x64-msvc on
Windows 11 (Node.js v20.17.0). Reproduces on Windows; Linux/WSL is unaffected.
Directly validates the Windows incompatibility claim.

**Sources:**

- https://github.com/tursodatabase/libsql/issues/1797

---

### C-007 - CONFLICTED (MEDIUM)

**Claim:** LadybugDB v0.15.3 is the community fork of Kuzu (archived October
2025 after Apple acquisition) and is the correct v2 upgrade path for T28, but
not recommended for v1.

**Evidence:** Apple acquisition of Kuzu confirmed by multiple independent
sources (MacRumors, MacDailyNews, 9to5Mac, BetaKit -- all February 2026). Kuzu
GitHub was archived post-acquisition. However, one source states archive date as
October 10, 2025 while acquisition news only broke publicly in February 2026 --
a timing inconsistency. The specific LadybugDB version v0.15.3 could not be
confirmed from accessible release pages.

**Conflict type:** Freshness -- archive date (Oct 2025) vs acquisition
announcement date (Feb 2026) inconsistency; v0.15.3 version unverifiable.

**Conflicts:**

- Source A: One source states Kuzu GitHub archived October 10, 2025
- Source B: Apple acquisition news broke February 2026 (MacRumors 2026-02-11) --
  pre-announcement archive date inconsistent

**Sources:**

- https://macrumors.com/2026/02/11/apple-acquires-new-database-app/
- https://macdailynews.com/2026/02/12/apple-acquires-graph-database-maker-kuzu/
- https://github.com/LadybugDB/ladybug/releases

---

### C-008 - REFUTED (HIGH)

**Claim:** The correct LadybugDB npm package name is @ladybug/core, NOT
@ladybugdb/core. Verify on npmjs.com before installing.

**Critical prior finding applied:** The actual LadybugDB npm package is `lbug`.

**Evidence:** Three different package names surfaced during verification:

1. LadybugDB GitHub README install table: `npm install @ladybug/core`
2. LadybugDB docs installation page: `npm install @ladybugdb/core`
3. LadybugDB get-started page code example: `const lbug = require("lbug")` --
   matching the critical prior finding

Claim C-008 asserts @ladybug/core is correct over @ladybugdb/core. Both are
wrong per the prior finding and the get-started code example. The actual npm
package is `lbug`. The claim is REFUTED because it confidently presents one
wrong package name as the correction to another wrong package name.

**Note to downstream:** LadybugDB has inconsistent documentation across three
pages. The `require("lbug")` usage in get-started is the strongest signal.
Verify on npmjs.com before any installation.

**Sources:**

- https://docs.ladybugdb.com/installation/ (shows @ladybugdb/core)
- https://github.com/LadybugDB/ladybug README (shows @ladybug/core)
- https://docs.ladybugdb.com/get-started/ (code shows require("lbug"))

---

### C-009 - UNVERIFIABLE (LOW)

**Claim:** LadybugDB Windows NAPI binding has not been verified on Windows 11 +
Node.js v22. The WASM fallback (lbug-wasm) exists but adds worker-thread
overhead.

**Evidence:** No primary source confirms or denies Windows 11 + Node.js v22
compatibility for LadybugDB NAPI. The WASM fallback is confirmed (GitHub repo
LadybugDB/ladybug-wasm exists; docs reference @lbug/lbug-wasm). The unverified
status is a negative claim that cannot be confirmed without a filed issue or
test run -- neither was found.

**Sources:**

- https://github.com/LadybugDB/ladybug-wasm
- https://docs.ladybugdb.com/client-apis/wasm/

---

### C-010 - VERIFIED (HIGH)

**Claim:** CozoDB is stalled since December 2023 and is HIGH risk as a primary
backend for T28.

**Evidence:** GitHub releases page for cozodb/cozo confirms most recent release
is v0.7.6, dated December 11, 2023. No releases published since. As of April
2026, the project has had no releases for over 28 months. The stalled since
December 2023 characterization is factually accurate.

**Sources:**

- https://github.com/cozodb/cozo/releases (last release v0.7.6 confirmed)

---

### C-011 - VERIFIED (MEDIUM)

**Claim:** The official @modelcontextprotocol/server-memory should not be used
for T28. It has confirmed data corruption on concurrent sessions (GitHub #2577),
no tag support, O(N) search, and degrades unusably beyond 2,000-3,000 entities
in Node.js.

**Evidence:** GitHub issue #2577 exists and confirms data corruption via race
condition in file-writing logic. Issue #1819 (Memory server race condition
causes corrupted JSON) corroborates concurrent session corruption independently.
Sub-claims about no tag support and O(N) search are consistent with the flat
JSON file knowledge graph architecture but no source names these as explicit
limitations. The 2,000-3,000 entity degradation threshold has no primary
citation. Core corruption claim is solid; performance thresholds are plausible
but uncited.

**Sources:**

- https://github.com/modelcontextprotocol/servers/issues/2577
- https://github.com/modelcontextprotocol/servers/issues/1819
- https://github.com/modelcontextprotocol/servers/tree/main/src/memory

---

### C-012 - CONFLICTED (MEDIUM)

**Claim:** n-r-w/knowledgegraph-mcp should not be used as a live dependency. The
maintainer has publicly stated disillusionment and last committed December 2024.
It can be used as a reference for API design patterns only.

**Evidence:** Maintainer disillusionment CONFIRMED -- README opens with: I have
become disillusioned with automated context management tools like this, as it is
nearly impossible to control. However, last committed December 2024 is REFUTED.
Actual last commit: November 10, 2025 (Add warning about context management
tools). Prior commits: August 7, 2025 (PR merge), June 17, 2025 (version bump
v1.7.4). The repo had 117 commits with activity through late 2025 -- nearly a
year more recent than claimed.

**Conflict type:** Complementary + Freshness -- disillusionment is real; date is
off by ~11 months.

**Conflicts:**

- Source A (research claim): States last commit December 2024
- Source B (GitHub commit history): Last commit November 10, 2025 -- 11 months
  later than claimed

**Sources:**

- https://github.com/n-r-w/knowledgegraph-mcp (commit history, last commit Nov
  10 2025)

---

## Summary Statistics

| Verdict      | Count  | Claim IDs                         |
| ------------ | ------ | --------------------------------- |
| VERIFIED     | 5      | C-001, C-002, C-006, C-010, C-011 |
| REFUTED      | 1      | C-008                             |
| UNVERIFIABLE | 3      | C-003, C-004, C-009               |
| CONFLICTED   | 3      | C-005, C-007, C-012               |
| **Total**    | **12** |                                   |

---

## Key Findings for Downstream Synthesis

1. **C-002 fully confirmed:** better-sqlite3 v12.8.0 + SQLite 3.51.3 is a
   genuine WAL safety improvement. The WAL-reset bug affected all versions from
   3.7.0 through 3.51.2; 3.51.3 (2026-03-13) is the authoritative fix.

2. **C-008 REFUTED:** Neither @ladybug/core nor @ladybugdb/core is the correct
   npm package. The actual package is `lbug` per `require("lbug")` in official
   get-started docs. LadybugDB has inconsistent docs across three pages. Verify
   on npmjs.com before any installation.

3. **C-010 confirmed stalled:** CozoDB last released December 2023, over 28
   months with no release as of April 2026. HIGH risk classification is fully
   justified.

4. **C-012 date is wrong:** knowledgegraph-mcp last committed November 10, 2025,
   not December 2024. Disillusionment is confirmed in README but the repo is 11
   months more recently maintained than claimed. The December 2024 date claim
   must not be cited.

5. **C-003 and C-004 lack primary citations:** The 2.1M nodes production
   validation and the exact 18us/24us latency figures are unverified estimates.
   Identify a primary benchmark source before using these specific numbers in
   architecture decisions.
