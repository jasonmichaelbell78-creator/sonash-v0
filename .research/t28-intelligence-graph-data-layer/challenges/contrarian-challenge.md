# Contrarian Challenge: T28 Intelligence Graph Data Layer

**Challenger:** Contrarian (pre-mortem framing) **Date:** 2026-04-07 **Research
challenged:** Session #267, 32 searchers + 4 synthesizers

---

## Summary

7 MAJOR challenges. Core direction (SQLite + custom MCP + files canonical +
FTS5-first) is almost certainly correct. Specific cracks in evidence base will
surface as implementation surprises. Most dangerous: LadybugDB package name
wrong in both directions, uncitable 2.1M node benchmark, A-MEM attribution error
propagating into schema, and unaudited Neuromcp counter-candidate.

---

## Challenges

### 1. LadybugDB Package Name Wrong in Both Directions [SEVERITY: MAJOR]

Research says `@ladybug/core` correcting `@ladybugdb/core`. Both wrong — actual
package is `lbug`. Three contradictory installation instructions across
LadybugDB's own docs. A project with three contradictory install instructions
has a documentation culture problem predicting instability. **Downgrade v2
LadybugDB path from MEDIUM to LOW confidence.**

### 2. Primary Scale Justification Has No Citable Source [SEVERITY: MAJOR]

"2.1M nodes / 4.9M edges" headline scale evidence — V1a marked UNVERIFIABLE. No
primary source found. Write latency figures (18us, 53K ops/s) also uncitable.
**Replace with verified figure: codebase-memory-mcp at 49K nodes (sub-1ms
queries).** Conclusion (SQLite adequate) survives but evidence footnote needs
correction.

### 3. "Files Canonical" Wrong for Agent-Written Knowledge [SEVERITY: MAJOR]

7 systems confirming files-canonical are ALL human-facing tools. None have agent
generating bidirectional edges. SUPERSEDES/RELATED_TO edges between
KnowledgeNodes have no parent file — violates the "no graph-only data" rule
(C-017). D8 recommended hybrid model (files for human layer, graph for agent
layer) but synthesis dropped this nuance. **Acknowledge hybrid boundary
explicitly: files canonical for SourceNodes, graph canonical for agent-inferred
edges. Define what rebuild-graph does with non-file-backed edges.**

### 4. "Build Custom MCP" Ignored Neuromcp [SEVERITY: MAJOR]

V1b found Neuromcp (glama.ai) has trust levels (confidence proxy), contradiction
detection, and tag support — potentially all 3 of T28's requirements. Never
investigated by any searcher. "No existing server provides all three" claim left
UNVERIFIABLE. **Add 30-minute Neuromcp capability audit to open questions.
Downgrade "build custom" from HIGH to MEDIUM-HIGH confidence pending audit.**

### 5. graphology Dependents Claim 20x Wrong [SEVERITY: MAJOR]

"4,900+ dependents" — actual: ~246 (npmjs.com). 20x overstatement used as
ecosystem health signal. Likely counted graphology's own 30+ sub-packages as
external dependents. **Correct to ~246. Reassess risk from LOW to LOW-MEDIUM.
Justify on technical fit (correct algorithms, zero native deps), not ecosystem
size.**

### 6. FTS5-Only v1 Creates Schema Lock-In [SEVERITY: MAJOR]

Section 4 schema includes 384d embedding column. Section 11 v1 says FTS5-only.
Tension unresolved: does v1 schema include embedding column (populated NULL) or
omit it? If omitted, v2 requires ALTER TABLE (limited in SQLite). **Explicitly
resolve: include column with NULLs in v1 schema, populate in v2. Document ALTER
TABLE plan if omitted.**

### 7. A-MEM Attribution Error Propagates Into Schema [SEVERITY: MAJOR]

C-019 REFUTED: `valid_at`/`invalid_at` are Graphiti edge fields, not A-MEM.
A-MEM's actual 7th field is `L_i` (linked_memories) — dropped from T28 schema
entirely. The dropped L_i is exactly the graph link list T28 needs for LINKS_TO
edges. **Correct attribution. Evaluate whether L_i should be a first-class
KnowledgeNode column rather than an `evolution_history` blob.**

### 8. Dedup Threshold 0.78 Unvalidated for T28's Domain [SEVERITY: MAJOR]

iText2KG's 0.6/0.4 weighting was designed for general NLP, not sobriety/recovery
research notes. False non-merges ("craving management" vs "urge surfing" never
merged) will fragment the graph silently. **Add v1 mandatory calibration: after
167-node migration, manually review top-20 near-threshold pairs (0.72-0.84 band)
before locking threshold.**

---

## Priority Order (by downstream impact)

1. **C-019 A-MEM attribution** — affects schema design directly
2. **Files-canonical hybrid boundary** — affects architectural invariant
3. **Neuromcp audit** — could flip build-vs-adopt decision
4. **2.1M scale figure** — affects evidence credibility
5. **LadybugDB package name** — affects v2 planning
6. **graphology dependents** — affects risk assessment
7. **Schema embedding column tension** — affects v1 implementation
8. **Dedup threshold calibration** — affects v1 operational quality
