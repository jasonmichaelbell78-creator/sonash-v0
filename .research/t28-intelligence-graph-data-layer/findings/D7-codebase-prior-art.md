# Findings: Codebase Prior Art

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-07
**Sub-Question:** D7

---

## Summary

168 extraction-journal entries (v2.0 schema), 27 analysis.json files (v4.3
schema), 5 website analyses. All map directly to graph nodes without
transformation. MCP memory server is `@modelcontextprotocol/server-memory`
(JSONL flat file — confirmed inadequate). Ingest/absorb decoupling does NOT
exist in codebase — identified as key gap from farzaa's gist.
Anti-cramming/thinning patterns also from farzaa, not native. EXTRACTIONS.md is
already the file-canonical/derived-view pattern. `extracted_to` is NULL on all
168 entries — no extraction ever completed.

---

## Key Findings

### 1. extraction-journal.jsonl [CONFIDENCE: HIGH]

168 entries, schema v2.0. 146 repo + 22 website. 18 unique sources.

**Schema:**

```json
{
  "schema_version": "2.0",
  "source_type": "repo|website",
  "source": "owner/name OR url",
  "candidate": "Display name",
  "type": "content|pattern|knowledge|anti-pattern|design-principle|workflow-pattern|architecture-pattern|tool",
  "decision": "defer|extract|skip|investigate",
  "decision_date": "YYYY-MM-DD",
  "extracted_to": null,
  "extracted_at": null,
  "notes": "Free-text",
  "novelty": "high|medium|low",
  "effort": "E0|E1|E2|E3",
  "relevance": "high|medium|low"
}
```

**Graph mapping:** Each entry → KnowledgeNode candidate. `source` → FK to
SourceNode. `type` → labels. `decision/decision_date` → status/ingested_at.
`novelty/effort/relevance` → attributes.

**Critical:** `extracted_to` is NULL on ALL 168 entries. No extraction has ever
been completed. Pipeline stops at decision.

### 2. analysis.json v4.3 [CONFIDENCE: HIGH]

27 active files. Canonical schema in
`.claude/skills/schemas/analysis-schema.ts`.

**Direct SourceNode mappings:**

- `repo` → name, `url` → url, `analyzedAt` → ingested_at
- `repoType/repoSubtype` → source_type/subtype
- `creatorLens` → summary
- `context.t28Relevance` → attributes.t28_relevance (T28-era passthrough
  extension)
- `context.cluster` → attributes.cluster (A-F)
- `metadata.*` → attributes (stars, language, license, etc.)
- `summaryBands.*` → attributes.quality_bands (security, reliability, etc. with
  A-F bands + 0-100 scores)

Quick-scan files omit dimensions, classification, candidate arrays.
Standard/deep include all.

**Schema version discrepancy:** Zod schema labeled "v4.2" but files use
`schemaVersion: "4.3"`. `.passthrough()` allows T28-era extensions.

### 3. EXTRACTIONS.md: Derived View Pattern [CONFIDENCE: HIGH]

Header: "Auto-generated from extraction-journal.jsonl. Do not edit directly."

No standalone generation script — rendered by `/repo-analysis` Phase 6. T28
needs standalone `render-extractions` command.

Pattern: JSONL (canonical) → EXTRACTIONS.md (human view) → graph nodes
(queryable index). Three representations of same data.

### 4. .research/ Directory Structure [CONFIDENCE: HIGH]

```
.research/
├── extraction-journal.jsonl    # Canonical cross-source registry
├── research-index.jsonl        # Deep-research session registry (15 entries)
├── EXTRACTIONS.md              # Derived view
├── repo-analysis/<slug>/       # Per-repo: analysis.json + findings.jsonl + value-map.json + summary.md
├── website-analysis/<slug>/    # Per-website: parallel structure
├── t28-intelligence-graph-data-layer/  # Active research
└── archive/                    # Completed research sessions
```

Gitignored: `**/source/` (cloned repos), `**/repomix-output.txt`. Everything
else committed (Decision 2026-04-02).

### 5. MCP Memory Server Configuration [CONFIDENCE: HIGH]

**Project `.mcp.json`:** `@modelcontextprotocol/server-memory` via
`cmd /c npx -y`.

**Also configured:** sonarcloud, context7, episodic-memory (plugin,
search-only), sequential-thinking, playwright, chrome-devtools.

**Confirmed inadequate for T28** — JSONL flat file, degrades at ~80K tokens /
50-80 entities.

### 6. Ingest/Absorb Pattern: Does NOT Exist [CONFIDENCE: HIGH]

Current skills = ingest only (metadata + structured output to disk). No absorb
(cross-source entity/relation extraction into unified store), no breakdown
(entity mining from artifacts), no reorganize (structural reorganization).

Gap identified from farzaa's gist analysis
(`.research/website-analysis/farzaa-gist-c35ac0cf/SITE-ANALYSIS.md`): "No direct
equivalent — Key gap — you ingest but don't absorb into a unified wiki."

### 7. Anti-Cramming/Thinning: From Farzaa, Not Native [CONFIDENCE: HIGH]

Originate from farzaa's gist, extracted during T28 research. NOT present in
SoNash codebase.

**15-entry checkpoint cycle:** After every 15 absorbs: entity dedup → cramming
check (>3 edge clusters OR >8 observations → split) → thinning check (<4
observations AND >3 refs → enrich) → rebuild indexes → log.

EXTRACTIONS.md already exhibits the problem: 168 entries, some sources with 17+
entries, flat structure. When does a source deserve its own sub-index? = the
anti-cramming question.

---

## Sources

| #     | Path                                                                         | Type            | Trust |
| ----- | ---------------------------------------------------------------------------- | --------------- | ----- |
| 1     | .research/extraction-journal.jsonl                                           | Codebase        | HIGH  |
| 2     | .research/EXTRACTIONS.md                                                     | Codebase        | HIGH  |
| 3-5   | .research/repo-analysis/\*/analysis.json (3 examples)                        | Codebase        | HIGH  |
| 6-7   | .research/repo-analysis/karpathy-autoresearch/value-map.json, findings.jsonl | Codebase        | HIGH  |
| 8     | .claude/skills/schemas/analysis-schema.ts                                    | Codebase schema | HIGH  |
| 9     | .claude/skills/repo-analysis/SKILL.md                                        | Codebase skill  | HIGH  |
| 10-12 | .mcp.json, user mcp.json, settings.json                                      | Config          | HIGH  |
| 13    | .research/website-analysis/farzaa-gist-c35ac0cf/SITE-ANALYSIS.md             | Research        | HIGH  |
| 14-15 | v1-synthesis RESEARCH_OUTPUT.md, v1-prior-art D7                             | Research        | HIGH  |

---

## Contradictions

1. **Schema version:** Zod says "v4.2", files say "4.3". Passthrough hides
   mismatch.
2. **Field naming:** Zod `date` vs files `analyzedAt`. Migration tooling must
   account for this.
3. **findings.jsonl prevalence:** SKILL.md says MUST artifact, but only ~9 of 27
   repos have it (Quick-scan skips).

---

## Gaps

1. No standalone EXTRACTIONS.md generation script — skill-mediated only
2. `extracted_to` always null — no extraction ever completed
3. No findings.jsonl for Quick-scan repos
4. Website analysis.json schema not directly verified (may differ from repo
   v4.3)
5. research-index.jsonl has two schema formats (repo vs deep-research)
6. Episodic memory and sequential thinking MCP usage patterns undocumented

---

## Serendipity

1. **T28-enriched analysis.json files** — `context.t28Relevance`,
   `context.cluster`, `context.notablePatterns` already added to Quick-scan
   files during T28 campaign. Migration bootstrap simpler than expected.
2. **farzaa gap analysis is a requirements spec** — three gaps (absorb,
   breakdown, reorganize) are exactly what T28 builds.
3. **150 findings.jsonl entries** across ~9 repos — structured (id, severity,
   category, title, description, recommendation), already graph-ready with IDs.
4. **All 168 extraction entries have decision but no completion** — T28's graph
   layer is where extraction decisions finally get executed.
