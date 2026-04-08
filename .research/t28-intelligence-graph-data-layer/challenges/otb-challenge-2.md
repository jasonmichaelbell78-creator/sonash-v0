# OTB Challenge 2: Process and Assumption Challenges

**Challenger:** OTB-2 (process/assumption blind spots) **Date:** 2026-04-07
**Research challenged:** T28 Intelligence Graph Data Layer (Session #267)

---

## Summary

8 process challenges. Core recommendation survives all. Two CRITICAL findings:
(1) Schema designed without query pattern audit — 30-session audit could
simplify or validate. (2) "FTS5 proves insufficient" trigger is undefined and
failure mode is asymmetric — Claude may adapt away from low-quality graph
silently.

---

## Challenges

### Alt 1: Prototype-First Discovery [SEVERITY: HIGH]

Backend selected before prototype validated graph adds value. A 2-week JSONL
prototype could surface whether 90% of queries are simple lookups that don't
need a graph. The 167-node migration makes full-architecture path reasonable,
but for future schema extensions, enforce 30-day prototype rule.

### Alt 2: Query Pattern Audit Before Schema [SEVERITY: CRITICAL]

Schema designed (28-type discriminator, 4 edge types, M2M tags, bi-temporal,
node_metadata) without examining actual Claude query patterns. If 80% of real
queries are "FTS5 keyword search, return top-10 summaries," bi-temporal model
and junction tables are over-engineering. **Action: Audit last 30 sessions for
actual query patterns before finalizing schema.**

### Alt 3: Graph-First Canonical (Inverted Assumption) [SEVERITY: HIGH]

"Files canonical" consensus drawn entirely from developer tools. Graph-canonical
systems (Notion, Roam, Tana) not examined. For Claude-native workflows,
graph-canonical may be more natural — Claude generates structured knowledge, not
prose. **Not appropriate for v1** (git-tracked .research/ corpus), but worth
revisiting if write-to-files-first creates friction.

### Alt 4: FTS5-Only as Permanent Decision [SEVERITY: HIGH]

"FTS5 proves insufficient" trigger undefined. If T28's actual queries are
technical keyword lookups (specific tools, patterns, authors), BM25 handles them
correctly and vectors add no value. **Action: Log 5 sessions of actual queries,
classify as keyword vs semantic. If semantic < 20%, FTS5-only is permanent.**

### Alt 5: Complexity Budget is Unvalidated [SEVERITY: MEDIUM]

"4-5 new concepts" cites htmx blog essay, not calibrated to this developer
profile (who built 38 agents, TDMS pipeline, Go statusline binary). May
underestimate actual complexity tolerance. Conclusion (incremental shipping) is
sound regardless.

### Alt 6: Custom MCP Server Maintenance [SEVERITY: HIGH]

Custom MCP server creates: MCP SDK version coupling (pre-1.0, breaking changes),
Node.js upgrade friction (better-sqlite3 native module), new CI component.
**Action: Pin MCP SDK version, add renovate rule, document Node.js upgrade
procedure before v1 ships.**

### Alt 7: Query Expressiveness vs Operational Overhead [SEVERITY: MEDIUM]

Research optimizes for "lowest operational overhead." But recursive CTEs for
complex graph queries (15-20 lines for a 3-hop traversal with filters) may cost
more developer time than Docker overhead. Cypher equivalent is 1 line. **Action:
Test `npm install lbug` on Windows before v1, not before v3.**

### Alt 8: Trust Collapse Feedback Loop [SEVERITY: HIGH]

FTS5-only returns low-quality results -> Claude stops trusting graph -> defaults
to reading raw files -> graph never gets positive feedback -> appears to fail ->
gets deprecated. Asymmetric failure: once Claude adapts away, graph layer never
recovers. **Action: Before committing FTS5-only, run 10 real queries against
extraction journal with BM25 only. If any return noticeably wrong top results,
wire vectors in v1.**

---

## Actionable Items

1. **CRITICAL:** 30-session query pattern audit before schema finalization
   (2-hour exercise)
2. **HIGH:** Run 10 real BM25-only queries to assess FTS5-only trust risk
3. **HIGH:** Test `npm install lbug` on Windows 11 + Node.js v22 before v1 ships
4. **HIGH:** Pin MCP SDK version + document Node.js upgrade procedure
5. **MEDIUM:** Recalibrate complexity budget after v1 retrospective
