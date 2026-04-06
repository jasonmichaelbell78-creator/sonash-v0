# Findings: "Claude Writes, Later Claude Reads" — Integration Patterns

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05T20:30:00Z **Sub-Question IDs:** SQ11c

---

## Key Findings

### 1. Claude Code's Native Memory Architecture is Two-Track, Not One [CONFIDENCE: HIGH]

Claude Code's official memory system (confirmed via official docs) uses two
parallel tracks:

- **CLAUDE.md / rules files** — human-written, project-scoped, loaded into every
  session at startup (full file, regardless of length for CLAUDE.md; first 200
  lines / 25KB for MEMORY.md)
- **Auto memory** — Claude-written, per-repo, stored at
  `~/.claude/projects/<git-repo-hash>/memory/` with a `MEMORY.md` index + topic
  files (e.g., `debugging.md`, `api-conventions.md`)

The auto memory pattern is directly applicable to the `/website-analysis` use
case: Claude generates analysis artifacts, writes them to `.research/<slug>/`,
and the index file (`MEMORY.md` or `research-index.jsonl`) acts as the
lightweight entry point loaded at session start.

**Critical constraint:** Only the first 200 lines (or 25KB) of MEMORY.md are
auto-loaded. Topic files (detailed analyses) are loaded on demand when Claude
reads files in those directories. This implies a mandatory two-level hierarchy:
a concise index + full detail files. [1][2]

---

### 2. The Karpathy Wiki Pattern: Token-Budgeted Progressive Disclosure [CONFIDENCE: HIGH]

The canonical "Claude writes, later Claude reads" architecture is the LLM wiki
pattern, documented by Karpathy and independently implemented by multiple
engineers:

**Four-layer progressive disclosure:**

- L0 (~200 tokens): Project context, loaded every session
- L1 (~1-2K tokens): The index file, loaded at session start
- L2 (~2-5K tokens): Search results from querying the index
- L3 (5-20K tokens): Full article content, fetched on demand

**Two special files drive navigation:**

- `index.md` — catalog of all content: page links, one-line summaries, optional
  metadata (date, source count)
- `log.md` — append-only chronological record of ingests and queries

This maps directly to the `.research/` pattern: `research-index.jsonl` is the L1
index; individual FINDINGS.md files are L3 content. The gap is L2: no search
layer currently exists between the index and full files. [3]

---

### 3. YAML Frontmatter as the Structural Bridge [CONFIDENCE: HIGH]

YAML frontmatter is the dominant pattern for making markdown files both
human-readable and machine-parseable. Confirmed across multiple independent
sources:

**How Obsidian Dataview handles it:**

- All YAML frontmatter fields become automatically available as Dataview query
  fields
- Supports: text, dates (ISO 8601), numbers, nested objects (via dot notation),
  arrays
- Field names are sanitized: spaces → dashes, uppercase → lowercase
- Wikilinks in frontmatter must be quoted: `related: ["[[analysis/site-a]]"]`

**What makes frontmatter dual-compatible (Obsidian + Claude-parseable):**

- Standard YAML between `---` delimiters is natively parsed by any YAML library
- Claude can grep frontmatter fields:
  `grep -r "type: website-analysis" .research/`
- jq can query JSON-converted frontmatter via tools like `yq`
- The same file serves as Obsidian note AND Claude read-back artifact

**Confirmed Obsidian-compatible + grep-queryable fields:**

```yaml
---
title: "Analysis: example.com"
date: 2026-04-05
url: "https://example.com"
type: website-analysis
tags: [website-analysis, e-commerce, 2026-Q2]
confidence: HIGH
status: complete
related: ["[[analysis/similar-site]]"]
slug: example-com
depth: L1
source_count: 12
claim_count: 45
---
```

[4][5][6][7]

---

### 4. The Knowledge Graph MCP is the Missing Relationship Layer [CONFIDENCE: HIGH]

The `.research/` flat index (`research-index.jsonl`) captures per-analysis
metadata but cannot represent relationships between analyses. The knowledge
graph MCP fills this gap.

**MCP Knowledge Graph (Anthropic official + community forks) stores:**

- **Entities** — named nodes with types (e.g.,
  `{name: "example.com", entityType: "website"}`)
- **Relations** — active-voice connections (e.g., "example.com links-to
  shop.example.com")
- **Observations** — facts appended to entities (e.g., "uses Shopify as
  e-commerce platform")
- **Storage format** — JSONL on disk at `.aim/memory.jsonl` or configurable path

**Available MCP tools:**

- `aim_memory_store` — create entities/observations from analysis
- `aim_memory_search` — keyword query across all entities
- `aim_memory_get` — retrieve specific entity by exact name
- `aim_memory_add_facts` — append new observations to existing entities
- `aim_memory_link` — connect two entities with a relation
- `aim_memory_list_stores` — discover named databases

**Recommended integration:** After each website analysis, Claude writes a
lightweight entity to the knowledge graph MCP with key facts (site type, tech
stack, score, path to full analysis). Future sessions can then search "what
e-commerce sites have I analyzed?" without loading any full FINDINGS.md files.
[8][9]

---

### 5. research-index.jsonl is Sufficient for Discovery, Insufficient for Retrieval [CONFIDENCE: MEDIUM-HIGH]

Examining the existing `research-index.jsonl` in this project (10 entries
reviewed), the format is:

```json
{
  "topicSlug": "github-health",
  "topic": "GitHub Health Skill...",
  "depth": "L1",
  "domain": "technology",
  "completedAt": "2026-03-29T16:15:00Z",
  "claimCount": 100,
  "sourceCount": 103,
  "confidenceDistribution": {"HIGH": 85, "MEDIUM": 13, "LOW": 2},
  "keywords": ["github", "health", "api", ...],
  "outputPath": ".research/github-health/",
  "status": "complete"
}
```

**What it does well:**

- Enables discovery of past analyses by topic/domain
- Queryable with `jq` for filtering by status, date, domain
- Append-on-each-analysis is simple to implement
- Keywords array enables rudimentary grep-based search

**What it lacks:**

- No URL-based lookup (essential for website analysis: "have I analyzed this URL
  before?")
- No graph relationships between analyses
- No cross-reference between analyses that share themes/tech stacks
- No semantic similarity query (TF-IDF or vector)
- No temporal staleness tracking (was this site re-analyzed?)

**For website-analysis specifically, add these fields:**

```json
{
  "url": "https://example.com",
  "domain": "example.com",
  "siteType": "e-commerce",
  "techStack": ["Shopify", "React"],
  "analysisScore": 72,
  "analysisDate": "2026-04-05",
  "previousAnalysisSlug": null,
  "findingsPath": ".research/website-analysis/example-com/FINDINGS.md"
}
```

[10]

---

### 6. Export Adapter Pattern: Local-First, N-Store Optional [CONFIDENCE: MEDIUM-HIGH]

Multiple projects implement a "write once locally, export to N stores" pattern.
The recommended architecture follows:

**Core principle:** Markdown + YAML frontmatter is the canonical source of
truth. All exports are derived transforms.

**Adapter interface (minimal viable):**

```
interface ExportAdapter {
  name: string;                          // "obsidian" | "notebooklm" | "sqlite"
  export(artifact: AnalysisArtifact): Promise<void>;
  supports: ExportCapability[];          // ["wikilinks", "frontmatter", "upload"]
}
```

**What each store needs:**

| Store       | Input Format                 | What to Transform                         | Mechanism                       |
| ----------- | ---------------------------- | ----------------------------------------- | ------------------------------- |
| Obsidian    | Markdown + YAML frontmatter  | Add wikilinks, ensure vault path          | Copy/symlink to vault directory |
| NotebookLM  | Single file or folder upload | Merge related files, strip code blocks    | Manual upload (no API)          |
| SQLite      | INSERT rows                  | Parse frontmatter fields → columns        | `yq`/`js-yaml` → better-sqlite3 |
| Memory MCP  | Entity JSON                  | Extract key facts → entity + observations | MCP tool calls post-analysis    |
| Auto memory | MEMORY.md entry              | Write 1-line index entry to MEMORY.md     | Append to file                  |

**Recommended day-1 scope:** Local only (markdown + JSONL index). Obsidian
adapter is trivial (copy to vault). NotebookLM has no programmatic API — remains
manual. SQLite adapter adds richest query capability but highest complexity.

**Anti-pattern to avoid:** Do NOT build all adapters simultaneously. The local
format must stabilize before adapters are added. Design the frontmatter schema
as the stable interface; adapters read from it. [11][12][13][14]

---

### 7. Hybrid Search is the Right Long-Term Retrieval Strategy [CONFIDENCE: MEDIUM]

The AI agent memory ecosystem in 2026 has converged on **hybrid search (BM25 +
vector)** as the retrieval standard. Multiple independent implementations
confirm this:

**QMD (Query Markdown Documents) MCP server:**

- Indexes markdown files into SQLite (FTS5 for BM25 + vector embeddings)
- Exposes `qmd_search`, `qmd_vector_search`, `qmd_deep_search` as MCP tools
- Claude Code can call these during sessions to find relevant prior analyses
- Index stored at `~/.cache/qmd/index.sqlite`

**sqlite-memory:**

- Combines cosine similarity (vector) + FTS5 keyword search
- Configurable weights: `vector_weight` + `text_weight`
- Content-hash change detection: unchanged files are never re-indexed
- One portable `.db` file contains the entire knowledge base

**For the `/website-analysis` skill, recommended retrieval stack:**

1. **Phase 1 (day 1):** grep over `research-index.jsonl` with `jq` — sufficient
   for small index (<100 analyses)
2. **Phase 2 (at ~50+ analyses):** Add QMD MCP server pointing at `.research/`
   directory — instant BM25 + vector search across all FINDINGS.md files
3. **Phase 3 (optional):** Memory MCP knowledge graph for entity-relationship
   queries

**Keyword grep is sufficient for known-URL lookup** (exact string match).
Semantic search adds value only for "find analyses similar to X" queries.
[15][16][17]

---

### 8. Windsurf and Cursor Use RAG + Manual Curation, Not Flat Files [CONFIDENCE: MEDIUM]

For context on how other AI coding tools handle persistent knowledge:

**Windsurf (Cascade):**

- Automatic RAG-based codebase indexing (no tagging required)
- "Memories" feature: learns architecture patterns over ~48 hours of use
- ~200K token effective context via automatic RAG snippet retrieval
- Cross-session: persistent until invalidated, no explicit file format

**Cursor:**

- Developer-driven context via `@` symbols to reference files/folders
- Semantic similarity pulls from current file and similar patterns
- Practical context: 10K-50K tokens due to manual curation overhead
- No explicit cross-session analysis persistence documented

**Key difference from Claude Code:** Both Cursor and Windsurf embed their memory
in proprietary vector stores. Claude Code's CLAUDE.md/MEMORY.md approach is
file-system-native and human-inspectable. The `.research/` pattern fits Claude
Code's philosophy: files on disk, inspectable with standard tools. [18]

---

### 9. Actor-Aware Memory: Agents Should Tag Artifacts They Write [CONFIDENCE: MEDIUM]

From the Mem0 State of AI Agent Memory 2026 report: in multi-agent systems,
memories should be tagged by the source agent to prevent one agent's inferences
from being treated as ground truth.

**Applied to `/website-analysis`:** Each analysis artifact should include:

```yaml
generated_by: website-analysis-skill
agent_version: "1.0"
human_verified: false
```

This prevents future Claude sessions from treating AI-generated analysis as
authoritative without verification. Especially important for confidence-scored
claims (e.g., "this site uses React" — a Claude inference, not a confirmed
fact). [19]

---

### 10. The TF-IDF Transcript Search Pattern is Available Today [CONFIDENCE: MEDIUM]

The memsearch / agent-knowledge pattern builds a TF-IDF index over session
transcripts stored as JSONL files in `~/.claude/`:

- Parses Claude Code JSONL session logs
- Builds TF-IDF index (60-second cache, modification-time-based file cache)
- Exposes 12 MCP tools including scoped filters: errors, plans, configs, tools,
  files, decisions
- Git-synced: every read triggers `git pull`, every write triggers
  `git add/commit/push`

This means **Claude's own session history is already an implicit knowledge
store** — prior website analyses run in Claude Code sessions are partially
recoverable from session logs via this pattern. [20]

---

## Recommended Architecture for `/website-analysis`

### Canonical File Structure Per Analysis

```
.research/website-analysis/<slug>/
├── FINDINGS.md          # Full analysis with YAML frontmatter (L3, on-demand)
├── raw-extraction.json  # Raw crawler output (L3, tool-only)
└── summary.md           # 200-line executive summary (L2, search result)
```

### Frontmatter Schema (Proposal)

```yaml
---
title: "Website Analysis: example.com"
date: 2026-04-05
url: "https://example.com"
domain: "example.com"
type: website-analysis
site_type: e-commerce # e-commerce | blog | saas | portfolio | docs | unknown
tech_stack: [Shopify, React]
tags: [website-analysis, e-commerce, 2026-Q2]
confidence: HIGH # HIGH | MEDIUM | LOW
status: complete # complete | partial | stale
generated_by: website-analysis-skill
human_verified: false
analysis_score: 72 # 0-100 composite score (if applicable)
related:
  - "[[website-analysis/similar-site]]" # Obsidian wikilink
slug: example-com
depth: L1
source_count: 12
claim_count: 45
previous_analysis: null # slug of prior analysis for same URL
---
```

**Obsidian compatibility:** All fields are valid YAML, wikilinks are quoted
strings, tags array is Dataview-queryable.

**Claude grep-queryable:**
`grep -r "site_type: e-commerce" .research/website-analysis/`

**jq-queryable (after yq conversion):**
`yq .url .research/website-analysis/*/FINDINGS.md`

### Index Design: Enhanced research-index.jsonl

Extend the existing flat JSONL format with website-analysis-specific fields:

```json
{
  "slug": "example-com",
  "topic": "Website Analysis: example.com",
  "url": "https://example.com",
  "domain": "example.com",
  "siteType": "e-commerce",
  "techStack": ["Shopify", "React"],
  "analysisScore": 72,
  "depth": "L1",
  "completedAt": "2026-04-05T20:00:00Z",
  "status": "complete",
  "claimCount": 45,
  "sourceCount": 12,
  "confidenceDistribution": { "HIGH": 40, "MEDIUM": 5, "LOW": 0 },
  "tags": ["website-analysis", "e-commerce"],
  "findingsPath": ".research/website-analysis/example-com/FINDINGS.md",
  "summaryPath": ".research/website-analysis/example-com/summary.md",
  "generatedBy": "website-analysis-skill",
  "previousAnalysis": null
}
```

**Discovery queries Claude can run:**

- `jq 'select(.url == "https://example.com")' research-index.jsonl` — URL lookup
- `jq 'select(.siteType == "e-commerce")' research-index.jsonl` — type filter
- `jq 'select(.status == "complete") | .slug' research-index.jsonl` — all
  complete analyses
- `jq 'select(.completedAt > "2026-01-01")' research-index.jsonl` — recency
  filter

### Export Adapter Pattern: Phased

**Phase 1 (day 1 — ship this):**

- Write FINDINGS.md with frontmatter to `.research/website-analysis/<slug>/`
- Append entry to `research-index.jsonl`
- Optionally write 1-line entry to `MEMORY.md` (auto memory pointer)

**Phase 2 (add when >20 analyses exist):**

- Obsidian adapter:
  `cp .research/website-analysis/<slug>/FINDINGS.md ~/vault/analyses/`
- Memory MCP entity: create entity for analyzed site + key observations
- Add QMD MCP server pointing at `.research/` for hybrid search

**Phase 3 (optional, complex):**

- SQLite adapter: parse frontmatter → INSERT into `analyses` table
- NotebookLM: manual export of merged markdown to upload

**Routing menu option:** "Export to..." should appear post-analysis with
options:

- [x] Save locally (always on — default)
- [ ] Copy to Obsidian vault (if vault path configured)
- [ ] Add to Memory MCP graph
- [ ] Export to SQLite

### Cross-Session Knowledge Retrieval Flow

```
New session → User asks "have I analyzed example.com before?"

1. Claude reads research-index.jsonl (jq: url == target URL)
2. If found: reads summary.md (L2, ~200 lines) for quick context
3. If deep context needed: reads FINDINGS.md (L3, full analysis)
4. If QMD MCP available: qmd_search("example.com e-commerce analysis")
5. If Memory MCP available: aim_memory_get("example.com")
```

---

## Sources

| #   | URL                                                                                                           | Title                                                        | Type                | Trust  | CRAAP           | Date    |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------- | ------ | --------------- | ------- |
| 1   | https://code.claude.com/docs/en/memory                                                                        | How Claude remembers your project                            | official-docs       | HIGH   | 5/5/5/5/5 = 5.0 | 2026    |
| 2   | https://medium.com/data-science-collective/claude-code-memory-management-the-complete-guide-2026-b0df6300c4e8 | Claude Code Memory Management: The Complete Guide (2026)     | community-blog      | MEDIUM | 4/4/3/3/4 = 3.6 | 2026-03 |
| 3   | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f                                             | llm-wiki (Karpathy)                                          | community-reference | HIGH   | 4/5/5/4/4 = 4.4 | 2025    |
| 4   | https://blacksmithgu.github.io/obsidian-dataview/annotation/add-metadata/                                     | Adding Metadata - Dataview                                   | official-docs       | HIGH   | 4/5/4/4/5 = 4.4 | 2024    |
| 5   | https://www.jamescroft.co.uk/designing-a-machine-readable-knowledge-base-with-obsidian/                       | Designing a Machine-Readable Knowledge Base with Obsidian    | community-blog      | MEDIUM | 3/5/3/3/4 = 3.6 | 2024    |
| 6   | https://forum.obsidian.md/t/schema-org-in-obsidian-using-yaml-ld-frontmatter-for-linked-data/109969           | Schema.Org in Obsidian: YAML-LD Frontmatter                  | community-forum     | MEDIUM | 3/4/3/3/4 = 3.4 | 2025    |
| 7   | https://forum.obsidian.md/t/wikilinks-in-yaml-front-matter/10052                                              | Wikilinks in YAML front matter                               | community-forum     | MEDIUM | 3/4/3/3/4 = 3.4 | 2023    |
| 8   | https://github.com/shaneholloman/mcp-knowledge-graph                                                          | MCP Knowledge Graph (shaneholloman fork)                     | open-source         | HIGH   | 4/5/4/4/4 = 4.2 | 2025    |
| 9   | https://playbooks.com/mcp/modelcontextprotocol-knowledge-graph-memory                                         | Knowledge Graph Memory MCP server                            | reference           | MEDIUM | 3/4/3/3/4 = 3.4 | 2025    |
| 10  | project `research-index.jsonl`                                                                                | Existing JSONL index in this repo                            | filesystem          | HIGH   | 5/5/5/5/5 = 5.0 | 2026    |
| 11  | https://medium.com/@markgrabe/upload-obsidian-folders-to-notebooklm-bd9aa0bc8ea7                              | Upload Obsidian Folders to NotebookLM                        | community-blog      | MEDIUM | 3/4/3/3/4 = 3.4 | 2024    |
| 12  | https://www.xda-developers.com/notebooklm-to-obsidian-markdown/                                               | NotebookLM to Obsidian Markdown                              | tech-media          | MEDIUM | 3/4/3/3/3 = 3.2 | 2024    |
| 13  | https://forum.obsidian.md/t/sync-metadata-properties-with-external-sql-or-nosql-database/102419               | Sync metadata Properties with external SQL or NoSQL database | community-forum     | MEDIUM | 3/4/3/3/4 = 3.4 | 2024    |
| 14  | https://github.com/windily-cloud/obsidian-sqlite3                                                             | obsidian-sqlite3 plugin                                      | open-source         | MEDIUM | 3/4/3/3/4 = 3.4 | 2024    |
| 15  | https://github.com/ehc-io/qmd                                                                                 | QMD: Query Markdown MCP Server                               | open-source         | HIGH   | 4/5/4/4/4 = 4.2 | 2026    |
| 16  | https://github.com/sqliteai/sqlite-memory                                                                     | sqlite-memory: markdown AI agent memory                      | open-source         | HIGH   | 4/5/4/4/4 = 4.2 | 2025    |
| 17  | https://www.clawsetup.co.uk/articles/hybrid-local-memory-openclaw-bm25-vectors-sqlite-vec-local-embeddings/   | Hybrid Local Memory in OpenClaw                              | community-blog      | MEDIUM | 3/4/3/3/4 = 3.4 | 2025    |
| 18  | https://dextralabs.com/blog/claude-code-vs-cursor-vs-windsurf/                                                | Claude Code vs Cursor vs Windsurf: 2026 Comparison           | community-blog      | MEDIUM | 4/4/3/3/4 = 3.6 | 2026    |
| 19  | https://mem0.ai/blog/state-of-ai-agent-memory-2026                                                            | State of AI Agent Memory 2026                                | vendor-blog         | MEDIUM | 3/4/3/3/3 = 3.2 | 2026    |
| 20  | https://dev.to/keshrath/how-i-gave-my-ai-agents-a-permanent-memory-that-syncs-across-machines-4755            | Permanent Memory That Syncs Across Machines                  | community-blog      | MEDIUM | 3/4/3/3/4 = 3.4 | 2025    |

---

## Contradictions

**Contradiction 1: Flat index vs. graph index**

- The Karpathy wiki pattern and the existing `research-index.jsonl` both use
  flat file indexes (JSONL/markdown), arguing simplicity beats graph complexity
  for small-to-medium knowledge bases
- The knowledge graph MCP ecosystem (graphiti, neo4j-labs, mcp-knowledge-graph)
  argues that relationships between entities are first-class and cannot be
  adequately represented in flat files
- Resolution: Both are right for different scales. Flat JSONL is sufficient for
  <100 analyses and is the correct day-1 choice. Knowledge graph MCP becomes
  valuable when relationship queries emerge (e.g., "which sites link to each
  other?", "which sites share a tech stack?")

**Contradiction 2: Frontmatter as authoritative source vs. index as
authoritative source**

- Karpathy pattern: index.md is authoritative; files are leaf nodes
- Obsidian pattern: frontmatter in each file is authoritative; index is derived
- Resolution: For `/website-analysis`, frontmatter is more resilient (survives
  index corruption, travels with the file). The JSONL index should be derivable
  from frontmatter (`yq` sweep). Write to frontmatter first; update index
  second.

**Contradiction 3: Vector search vs. grep for retrieval**

- Multiple sources argue vector/semantic search is necessary for meaningful
  retrieval at scale
- The markdown-as-task-format article and Claude Code's own tooling demonstrate
  that grep + jq is sufficient and has zero infrastructure overhead
- Resolution: Start with grep. The URL deduplication query (the most important
  one for website analysis) is an exact match — grep is optimal. Add vector
  search when "find similar sites" queries emerge.

---

## Gaps

1. **NotebookLM has no programmatic API.** Export to NotebookLM requires manual
   file upload. There is no adapter pattern possible — only "package files for
   manual upload" guidance. This is a hard constraint.

2. **QMD's YAML frontmatter handling is undocumented.** It indexes markdown
   content but whether frontmatter fields become structured filter parameters in
   MCP queries is unclear. Would need to test or read source code.

3. **Auto memory subagent support for analysis skills is undocumented.** The
   official Claude Code docs mention subagents can maintain their own auto
   memory, but the exact mechanism for skills (vs. subagents) writing to the
   project's memory directory is unclear.

4. **Staleness detection is an open problem.** When is a website analysis
   "stale"? There is no established pattern for invalidating cached analyses
   when the source website changes. The mem0 report identifies this as an "open
   research problem" in the broader AI memory field.

5. **Cross-locale artifact visibility.** The MEMORY.md notes in this project
   indicate that branch-specific artifacts aren't visible cross-locale. The
   `research-index.jsonl` is git-tracked — but `.research/` artifacts that
   aren't committed won't be discoverable on other machines.

---

## Serendipity

**Session log as implicit knowledge base:** Claude Code stores JSONL session
transcripts in `~/.claude/projects/<hash>/`. The TF-IDF memsearch pattern can
index these to recover analysis context from prior sessions — even without
explicit artifact persistence. For early skill development, this means "free"
cross-session recall without building any new infrastructure.

**The `.claude/skills/` pattern already implements YAML frontmatter scan:** The
Claude Code skills system already performs exactly the "scan directory → parse
YAML frontmatter → build lightweight registry" pattern described in the export
adapter research. The skills system (`name`, `description` frontmatter fields)
is the canonical precedent for the proposed analysis index pattern.

**QMD MCP server could serve as instant search over all `.research/` content:**
Pointing QMD at the `.research/` directory would immediately give Claude Code
hybrid BM25+vector search over every FINDINGS.md file ever written, with zero
additional code. This is a 5-minute integration (add MCP server, point at
`.research/`).

**`research-index.jsonl` is directly parseable by jq today:** The existing index
already has `keywords`, `domain`, `status`, `outputPath` fields. Claude can
query it right now with
`jq 'select(.domain == "technology" and .status == "complete")'` — no new
infrastructure needed.

---

## Confidence Assessment

- HIGH claims: 5
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The core architectural recommendations (frontmatter schema, two-level index
hierarchy, phased export adapters, jq-first retrieval) are well-supported by
multiple independent sources including official Claude Code documentation. The
export adapter specifics (especially NotebookLM) and long-term semantic search
recommendations are based on observed ecosystem patterns rather than
authoritative specifications.
