# OTB Challenge 1: Unconsidered Approaches

**Challenger:** OTB-1 (missed tools/framings) **Date:** 2026-04-07 **Research
challenged:** T28 Intelligence Graph Data Layer (Session #267)

---

## Summary

8 unconsidered alternatives evaluated. Only **Alternative 1 materially changes
the recommendation**: LadybugDB risk should be upgraded to HIGH (Apple acquired
Kuzu, upstream archived), making DuckDB+sqlite_scanner the stronger v2
analytical path. Other alternatives noted as future considerations.

---

## Alternatives

### Alt 1: LadybugDB Upstream Archived (Apple Acquisition) [CHANGES REC: YES]

Kuzu Inc. acquired by Apple Oct 2025, repo archived. LadybugDB fork is built on
frozen upstream. 3 competing forks (LadybugDB, Vela-Engineering, Bighorn).
**Upgrade risk from MEDIUM-HIGH to HIGH.** Prefer DuckDB+sqlite_scanner as v2
analytical path. Only revisit LadybugDB if fork reaches v1.0 with Windows NAPI
confirmed.

### Alt 2: LanceDB as sqlite-vec Contingency [CHANGES REC: MINOR]

Embedded TypeScript-native vector DB. Pure TS+Rust WASM, no SQLite extension.
Eliminates sqlite-vec Windows DLL risk. **Contingency for v2** if sqlite-vec
Windows binding fails. Downside: two separate databases (SQLite + LanceDB).

### Alt 3: JSONL-Only Epoch Before SQLite [CHANGES REC: MINOR]

Existing JSONL files (extraction-journal, findings, claims) could serve as graph
at 167-node scale with in-memory JavaScript parsing. Zero new infrastructure.
**Note as optional:** v1 migration is not blocking if user prefers JSONL queries
first.

### Alt 4: Oxigraph (WASM RDF/SPARQL Store) [CHANGES REC: NO]

In-process SPARQL endpoint replacing both graphology analytics and CTE queries.
RDF-star supports edge metadata natively. Too complex for solo-dev context — RDF
adds 5+ concepts to complexity budget.

### Alt 5: Prolog/Datalog Rules Layer [CHANGES REC: MINOR]

Trealla Prolog WASM in Node.js. Rules-based reasoning for contradiction
detection and confidence propagation. **Flag OQ-11 (contradiction detection in
absorb)** as trigger to revisit — if implementation needs >3-4 SQL queries with
edge cases, Datalog rules may pay off.

### Alt 6: Zettelkasten Folgezettel as Edge Alternative [CHANGES REC: MINOR]

Sequential note IDs encode hierarchy without explicit edges. Eliminates edge
management for LINKS_TO type. Can't express CITES/MENTIONS/SUPERSEDES. Worth
exploring for KnowledgeNode-to-KnowledgeNode relationships specifically.

### Alt 7: DuckDB as Primary Store [CHANGES REC: NO]

Inverted framing: DuckDB handles all storage + analytics. Write penalty (22-50x
vs SQLite) is the correct blocker. Research decision is correct. Keep as
analytical overlay only.

### Alt 8: No-Graph Flat Embedding Approach [CHANGES REC: MINOR]

FTS5 + embeddings + k-means clustering, no explicit edges. Dramatically simpler
maintenance. Can't replace provenance (EXTRACTED_FROM is categorical, not
semantic). Validates v1 FTS5-only minimal scope decision.

---

## Net Impact

| Alt                        | Type      | Changes Rec?                   |
| -------------------------- | --------- | ------------------------------ |
| 1 LadybugDB archived       | reframing | **YES** — upgrade risk to HIGH |
| 2 LanceDB contingency      | newer     | MINOR — v2 contingency         |
| 3 JSONL-only epoch         | inverted  | MINOR — optional               |
| 4 Oxigraph/RDF             | adjacent  | NO                             |
| 5 Datalog rules            | adjacent  | MINOR — OQ-11 trigger          |
| 6 Zettelkasten folgezettel | reframing | MINOR                          |
| 7 DuckDB primary           | inverted  | NO                             |
| 8 No-graph flat            | reframing | MINOR — validates v1           |
