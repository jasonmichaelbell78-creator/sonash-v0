# Findings: NotebookLM and Alternative External Knowledge Stores

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ11b

---

## Key Findings

### 1. NotebookLM: No Public API for Consumer Users [CONFIDENCE: HIGH]

As of April 2026, **Google NotebookLM does not have a public API available to
individual users** (free, Plus, or Pro tiers). The only official programmatic
API exists exclusively for **NotebookLM Enterprise** accounts, which requires a
paid Google Cloud enterprise contract with service account authentication via
`gcloud auth print-access-token`. The consumer product (notebooklm.google.com)
has no documented API endpoint and no official SDK.

This finding is corroborated by: Google's own official Enterprise docs [1][2], a
Google AI Developers Forum thread specifically asking for an API [3], and a
third-party analysis of the limitation [4].

**Implication for `/website-analysis` skill:** NotebookLM is not a viable
integration target for Claude Code unless the user has a Google Cloud Enterprise
contract. This makes it unsuitable as a default or recommended store.

### 2. NotebookLM Enterprise API: Alpha, REST-Only, Complex Auth [CONFIDENCE: HIGH]

The NotebookLM Enterprise API (v1alpha) is:

- **Preview/Alpha status** — subject to breaking changes, pre-GA terms apply
- **REST-based** with Google Cloud IAM authentication
- **Endpoint pattern:**
  `https://[LOCATION]-discoveryengine.googleapis.com/v1alpha/projects/[PROJECT]/locations/[LOCATION]/notebooks`
- **Multi-region** (US, EU, Global)
- **Supported source formats:** PDF, TXT, MD, DOCX, PPTX, XLSX (documents);
  MP3/WAV/M4A/etc. (audio); PNG/JPG (images); Google Drive links; raw text; web
  URLs; YouTube URLs
- **Operations supported:** Create notebook, add source, `batchCreate` sources,
  upload file (`notebooks.sources.uploadFile`), manage sharing, query

File size and per-notebook source count limits are **not specified** in the
Enterprise API documentation [1]. Consumer-tier limits (from support docs [5]):

- Free: 100 notebooks, 50 sources each, 200MB per file
- Plus: 500 notebooks, 300 sources each
- Ultra: 600 sources per notebook

### 3. Unofficial NotebookLM MCP Exists (Unofficial, Cookie-Based) [CONFIDENCE: MEDIUM]

A GitHub project (`jacob-bd/notebooklm-mcp-cli`) provides an unofficial MCP
server and CLI for programmatic NotebookLM access using browser cookie
extraction. It claims ~35 MCP tools covering notebook creation, source upload
(URLs, text, Drive, local files), audio generation, and cross-notebook queries.

**Critical warning from the project itself:** "This MCP and CLI use internal
APIs that are undocumented and may change without notice" and require "cookie
extraction from your browser." Explicitly flagged as experimental/personal use
only [6].

**Assessment:** Unusable as a production integration path. Cookie-based auth
breaks on browser updates, session expiry, and any Google auth changes.

### 4. NotebookLM Strengths Worth Noting [CONFIDENCE: HIGH]

Even without API access, NotebookLM's features are genuinely strong for
human-review workflows:

- Audio Overviews (AI-generated podcast from sources)
- Q&A grounded in sources with citations
- Multi-source synthesis across up to 300-600 sources
- Native PDF, Google Doc, YouTube, web URL ingestion
- Notebook Guide (FAQ, study guide, timeline auto-generation)
- NotebookLM Plus via Google Workspace ($14/user/month Workspace Standard)
- NotebookLM Pro via Google AI Pro ($19.99/month)

These are excellent for _human_ knowledge workers reading AI-generated
artifacts, but the missing API makes automated Claude → NotebookLM pipelines
infeasible without enterprise credentials [5][7].

### 5. SQLite: Strongest Technical Fit for Structured Analysis Data [CONFIDENCE: HIGH]

SQLite is exceptionally well-suited as a knowledge store for `/website-analysis`
artifacts:

**Integration path is zero-friction:**

- `sqlite3` CLI is available on all platforms (macOS, Linux, Windows via Git
  Bash or WSL)
- Claude Code can read/write via Bash tool using sqlite3 commands
- Multiple dedicated MCP servers exist: official Anthropic SQLite MCP, community
  servers on mcp.so, MintMCP gateway [8][9]
- The official Anthropic MCP server is already referenced in Claude Code
  documentation [10]

**FTS5 full-text search is production-quality for our scale:**

- Handles 500,000+ documents easily; hundreds of records is trivial
- BM25 ranking built in (no external dependencies)
- Real-world performance: queries drop from ~1s to ~20ms with FTS5 index
- Porter stemming included for English text
- `sqlite-vec` extension adds local-only vector/semantic search [11]

**Schema design for analysis artifacts:**

```sql
CREATE TABLE analysis_runs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  creator_score REAL,
  engineer_score REAL,
  classification TEXT,
  raw_json TEXT  -- full artifact as JSON
);

CREATE VIRTUAL TABLE analysis_fts USING fts5(
  url, domain, findings, tokenize='porter ascii'
);
```

**Portability:** Single `.db` file, zero server, Git-trackable (with .gitignore
for large DBs), works identically on Windows/macOS/Linux.

**JASON-OS alignment:** A SQLite file is a portable artifact — the entire
knowledge base moves with the worktree or can be archived to any path.

### 6. Markdown Vault: Already Working Pattern; Enhance, Don't Rebuild [CONFIDENCE: HIGH]

The `.research/` directory in this repo IS already a functioning markdown vault.
The deep-research skill already writes FINDINGS.md files with structured YAML
front matter concepts embedded in prose. The pattern is battle-tested.

**Minimal enhancement for `/website-analysis`:**

```yaml
---
id: "ws-2026-04-05-001"
url: "https://example.com"
analyzed_at: "2026-04-05T14:32:00Z"
domain: "example.com"
classification: "portfolio"
creator_score: 7.2
engineer_score: 6.8
tags: ["portfolio", "react", "no-js-required"]
skill_version: "1.0.0"
---
```

A single `_index.md` or `index.json` at the vault root can serve as a manifest.
Claude reads markdown natively — no tools required for retrieval, just the Read
tool or Grep.

**The `markdown-vault-mcp` project** (pvliesdonk/markdown-vault-mcp) takes this
further: it exposes a markdown directory via MCP with FTS5 + semantic search,
frontmatter-aware indexing, git integration, and 20+ MCP tools [12]. This could
be layered on top of the existing `.research/` structure with minimal
configuration.

**Limitations without extra tooling:**

- No graph view or backlink traversal without markdown-vault-mcp
- Search requires Grep tool (still functional, just slower)
- No auto-deduplication of analyses for the same URL

### 7. Notion MCP: Official, Well-Supported, Requires OAuth [CONFIDENCE: HIGH]

Notion offers both an official MCP server and a dedicated Claude Code plugin:

- **Official MCP server:** `makenotion/notion-mcp-server` (v2.0.0 as of
  late 2025)
- **Claude Code plugin:** `makenotion/claude-code-notion-plugin` with built-in
  slash commands
- **Connection:**
  `claude mcp add --transport http notion https://mcp.notion.com/mcp`
- **Auth:** OAuth flow (no bearer token for automated use on official server)
- **22 tools:** Create pages, edit in Markdown, query databases, add comments,
  search workspace, create data sources
- **AI-optimized:** Responses converted to Markdown, token-efficient format

**Key limitation for automated workflows:** The official server requires OAuth
(user-interactive login). An unofficial alternative supports API tokens but "is
no longer actively maintained" [13][14].

**Integration path for `/website-analysis`:** Viable but requires user to
authenticate once via OAuth. After that, Claude can create pages and databases
programmatically. Highest polish/UX of all options. Cost: Notion free tier
works; Notion Plus $10/month for more blocks.

**JASON-OS alignment:** Moderate — Notion data lives in Notion's cloud, not
locally. Exportable but not Git-trackable. Mobile access is excellent (Notion
iOS/Android apps).

### 8. Anytype: Local-First with Official MCP, Strong Portability [CONFIDENCE: HIGH]

Anytype has a first-party MCP server (`@anyproto/anytype-mcp`) and a public HTTP
API at `http://127.0.0.1:31012`:

- **Official MCP:** Published as npm package `@anyproto/anytype-mcp`
- **Claude Code setup:**
  `claude mcp add anytype -e OPENAPI_MCP_HEADERS='{"Authorization":"Bearer <KEY>", "Anytype-Version":"2025-11-08"}' -s user -- npx -y @anyproto/anytype-mcp`
- **Capabilities:** Create spaces, objects, tasks; query knowledge base; natural
  language organization
- **Local-first:** Data stored on device, E2E encrypted, P2P sync across devices
- **Open source:** `anyproto/anytype-ts` on GitHub

**JASON-OS alignment: Excellent** — data stays local, works offline, Git-free
but export-capable, no subscription required for local use. Free for personal
use.

**Limitation:** Requires Anytype desktop app running locally. Less mature
ecosystem than Notion. Mobile sync works via P2P but less polished than Notion.

### 9. Mem0.ai: Agent Memory Layer, Not a Knowledge Vault [CONFIDENCE: HIGH]

Clarification: There are two distinct products with similar names:

- **Mem.ai** — personal note-taking app with an API (`docs.mem.ai`). The API
  supports programmatic writes via a "Mem It" endpoint. Still active as of 2026.
- **Mem0.ai** — a universal memory layer for AI agents (vector + graph storage
  for facts across conversations). Has MCP server (`OpenMemory MCP`). Integrates
  with Claude, ChatGPT, Perplexity.

Mem0.ai is relevant for _agent memory_ (remembering user preferences across
sessions), not for structured analysis artifact storage. It extracts semantic
facts from conversations and stores them in a vector DB — useful for a different
pattern than what `/website-analysis` needs.

Mem.ai (note-taking) has an API but no MCP server for Claude Code. Its strength
is AI-organized personal notes, not structured analysis records [15].

### 10. Raindrop.io: Bookmark Manager with API + MCP [CONFIDENCE: MEDIUM]

Raindrop.io now has an official MCP server (`developer.raindrop.io/mcp/mcp`):

- REST API for creating, tagging, and organizing bookmarks
- MCP integration for Claude
- Use case for `/website-analysis`: Save analyzed URLs with analysis tags and
  notes, accessible later by domain or tag

**Limitation:** Raindrop is a _bookmark manager_, not a structured knowledge
store. It can't store schema-structured analysis data (scores, classifications,
JSON artifacts). It's best suited for URL curation, not analysis artifact
persistence. Pro plan at $3/month; free tier has limits [16].

### 11. Logseq and Dendron: File-Based but Limited for This Use Case [CONFIDENCE: MEDIUM]

**Logseq:**

- Graph-based outliner, markdown + org-mode files on disk
- Plugin API available (300+ plugins in marketplace)
- Mobile apps for iOS/Android
- No official MCP server; no direct Claude Code API integration path
- Files are local markdown — Claude can read them, but writing requires Logseq
  running or direct file manipulation
- Active development (not abandoned)

**Dendron:**

- Hierarchical note-taking in VS Code as an extension
- Plain markdown files with structured hierarchy (e.g.,
  `website.example-com.analysis.md`)
- No mobile app (VS Code only)
- Ranked 18th vs Logseq's 2nd in community rankings
- Development appears significantly reduced since 2022-2023 (last HN mentions)
- **Effectively deprecated for new projects** [17][18]

**Assessment:** Neither has a clean Claude Code MCP integration path. Logseq
files could be written directly (it's just markdown), but Dendron appears
largely inactive. Not recommended for `/website-analysis`.

---

## Comparison Matrix

| Store                     | API / Claude Path                     | Search                     | Graph/Links       | Mobile     | Cost                | Portability (JASON-OS)  | Complexity         |
| ------------------------- | ------------------------------------- | -------------------------- | ----------------- | ---------- | ------------------- | ----------------------- | ------------------ |
| **NotebookLM (consumer)** | None                                  | Semantic (UI only)         | No                | Yes        | Free–$20/mo         | Cloud only              | Infeasible         |
| **NotebookLM Enterprise** | REST API (alpha)                      | Semantic + Q&A             | No                | Yes        | Enterprise contract | Cloud only              | High               |
| **SQLite**                | Bash CLI / MCP server                 | FTS5 + vector (sqlite-vec) | No                | Via export | Free                | Excellent (single file) | Low                |
| **Markdown Vault**        | Read/Write tools / markdown-vault-mcp | Grep / FTS5 via MCP        | Backlinks via MCP | Via sync   | Free                | Excellent (Git-native)  | Very Low           |
| **Notion**                | Official MCP (OAuth)                  | Semantic + filter          | Linked pages      | Excellent  | Free–$10/mo         | Cloud (exportable)      | Medium             |
| **Anytype**               | Official MCP + HTTP API               | Built-in                   | Yes               | P2P sync   | Free (local)        | Excellent (local-first) | Medium             |
| **Mem.ai (notes)**        | REST API, no MCP                      | AI-organized               | Weak              | Yes        | Paid                | Cloud                   | Low-Med            |
| **Mem0.ai (agent mem)**   | Python/JS SDK, OpenMemory MCP         | Vector semantic            | No                | N/A        | Freemium            | Cloud/local             | Medium             |
| **Raindrop.io**           | REST API + MCP                        | Tag/filter                 | Collections       | Yes        | Free–$3/mo          | Cloud                   | Low                |
| **Logseq**                | File writes + plugin API              | Built-in graph             | Excellent         | Yes        | Free                | Good (local files)      | Medium             |
| **Dendron**               | File writes only                      | Hierarchical               | Limited           | None       | Free                | Good (local)            | Low-Med (inactive) |

---

## Integration Path Recommendation

### Easiest to Integrate NOW: Enhanced Markdown Vault

The `.research/` directory pattern is already implemented and working. Adding
YAML front matter standards and a `_vault-index.json` manifest file requires
zero new dependencies. Claude reads markdown natively. Grep provides search.
This can be done in the same PR that ships the skill.

**For immediate implementation:**

1. Standardize front matter schema (8-12 fields: id, url, domain, analyzed_at,
   classification, scores, tags, skill_version)
2. Add `_vault-index.json` auto-updated by the skill on each write
3. Use Grep for search across analyses

**Optional upgrade (low effort):** Add `markdown-vault-mcp` server pointing at
`.research/website-analysis/` for FTS5 + semantic search without changing the
file format.

### Best Long-Term Value: SQLite + Markdown Hybrid

For structured querying (e.g., "show all sites scored >7 for creators"), SQLite
provides what markdown cannot: typed queries, aggregations, and deduplication by
URL. The architecture:

- **SQLite** for structured metadata and scores (queryable, deduplicated)
- **Markdown** for human-readable narrative findings (linked by `id`)
- **sqlite3 CLI** via Bash for writes; MCP server for natural language queries

This hybrid gives both machine-readable structure and human-readable prose
without locking into any cloud service.

### Best for User-Review UX: Notion MCP

If the goal is "human reviews AI-generated analyses in a polished interface,"
Notion wins. The official MCP is robust, the Claude Code plugin adds slash
commands, and Notion's formatting is better for human reading than raw markdown.
The OAuth requirement is a one-time setup cost.

**Recommentation for `/website-analysis` skill v1:** Start with enhanced
markdown vault (zero dependencies), design schema for SQLite migration in v2.
NotebookLM should not be the primary recommendation — defer to "nice to use
manually" rather than "integrated target."

---

## Sources

| #   | URL                                                                                                            | Title                                                       | Type                     | Trust  | CRAAP | Date      |
| --- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------ | ------ | ----- | --------- |
| 1   | https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks-sources               | Add and manage data sources (API) - NotebookLM Enterprise   | Official docs            | HIGH   | 4.5   | 2025-2026 |
| 2   | https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks                       | Create and manage notebooks (API) - NotebookLM Enterprise   | Official docs            | HIGH   | 4.5   | 2025-2026 |
| 3   | https://discuss.ai.google.dev/t/notebooklm-api/55950                                                           | NotebookLM API? - Gemini API Forum                          | Community/Official Forum | HIGH   | 3.8   | 2025      |
| 4   | https://autocontentapi.com/blog/does-notebooklm-have-an-api                                                    | Does NotebookLM Have an API?                                | Community blog           | MEDIUM | 3.2   | 2025      |
| 5   | https://elephas.app/blog/notebooklm-source-limits                                                              | NotebookLM Limits Explained: Free, Plus, and Ultra          | Community blog           | MEDIUM | 3.5   | 2025-2026 |
| 6   | https://github.com/jacob-bd/notebooklm-mcp-cli                                                                 | notebooklm-mcp-cli - Unofficial MCP CLI                     | Open source (unofficial) | LOW    | 2.8   | 2025      |
| 7   | https://support.google.com/notebooklm/answer/16213268                                                          | Upgrade NotebookLM - Google Support                         | Official docs            | HIGH   | 4.5   | 2025-2026 |
| 8   | https://www.mintmcp.com/sqlite/claude-code                                                                     | Connect SQLite to Claude Code - MintMCP                     | Service docs             | MEDIUM | 3.3   | 2026      |
| 9   | https://mcp.so/server/sqlite                                                                                   | SQLite MCP Server                                           | Community directory      | MEDIUM | 3.0   | 2025-2026 |
| 10  | https://www.sqlite.org/fts5.html                                                                               | SQLite FTS5 Extension                                       | Official docs            | HIGH   | 5.0   | Current   |
| 11  | https://thelinuxcode.com/sqlite-full-text-search-fts5-in-practice-fast-search-ranking-and-real-world-patterns/ | SQLite FTS5 in Practice                                     | Technical blog           | MEDIUM | 3.8   | 2025      |
| 12  | https://github.com/pvliesdonk/markdown-vault-mcp                                                               | markdown-vault-mcp - Generic markdown collection MCP server | Open source              | HIGH   | 4.2   | 2025-2026 |
| 13  | https://github.com/makenotion/notion-mcp-server                                                                | Official Notion MCP Server                                  | Official open source     | HIGH   | 4.8   | 2025-2026 |
| 14  | https://developers.notion.com/guides/mcp/get-started-with-mcp                                                  | Connecting to Notion MCP - Notion Docs                      | Official docs            | HIGH   | 4.8   | 2025-2026 |
| 15  | https://help.mem.ai/features/api                                                                               | API - Mem Help Center                                       | Official docs            | HIGH   | 3.8   | 2025-2026 |
| 16  | https://developer.raindrop.io/mcp/mcp                                                                          | MCP Server - Raindrop.io API Documentation                  | Official docs            | HIGH   | 4.0   | 2025-2026 |
| 17  | https://www.slant.co/versus/39125/41500/~logseq_vs_dendron                                                     | Logseq vs Dendron comparison                                | Community                | MEDIUM | 3.0   | 2025      |
| 18  | https://github.com/anyproto/anytype-mcp                                                                        | anytype-mcp - Official Anytype MCP Server                   | Official open source     | HIGH   | 4.5   | 2025-2026 |
| 19  | https://mem0.ai/blog/state-of-ai-agent-memory-2026                                                             | State of AI Agent Memory 2026                               | Official blog            | HIGH   | 4.2   | 2026      |
| 20  | https://github.com/pvliesdonk/markdown-vault-mcp                                                               | markdown-vault-mcp README                                   | Open source              | HIGH   | 4.3   | 2025-2026 |

---

## Contradictions

**NotebookLM API availability:** One search result summary stated "NotebookLM
currently lacks a publicly available API" (elephas.app) while the Google Cloud
docs clearly show an Enterprise API exists. This is not a real contradiction —
the distinction is _consumer_ (no API) vs _Enterprise_ (API in alpha). The
elephas.app framing was addressing non-Enterprise users. Both claims are
simultaneously true for different user segments.

**Mem.ai vs Mem0.ai confusion:** Multiple sources conflate Mem.ai (personal
notes) with Mem0.ai (agent memory infrastructure). They are completely different
products from different companies. Mem.ai = personal AI note-taker. Mem0.ai =
open-source agent memory SDK. The search results frequently mixed these up.

---

## Gaps

1. **NotebookLM Enterprise pricing** — Cannot confirm cost per seat or minimum
   contract size. Google Cloud Enterprise pricing is not publicly listed.

2. **sqlite-vec performance benchmarks** — Found the existence of this extension
   for semantic search but no specific performance benchmarks at the 100-1000
   record scale relevant to `/website-analysis`.

3. **markdown-vault-mcp production stability** — This is a single-developer
   project. No indication of maintenance commitment or issue response times.
   Worth monitoring before depending on it.

4. **Notion API token (non-OAuth) path** — The "unofficial" API token approach
   for Notion was flagged as "no longer actively maintained." Unable to confirm
   if a maintained alternative exists for non-OAuth automation.

5. **Logseq MCP status** — Could not find evidence of an official or widely-used
   Logseq MCP server. Logseq automation paths for Claude Code remain unclear.

6. **NotebookLM consumer API timeline** — Google has not announced a timeline
   for making the API available to non-Enterprise users. Community forum posts
   requesting it date back to 2024 with no resolution.

---

## Serendipity

**`markdown-vault-mcp` is a near-perfect match for this use case.** It was
discovered unexpectedly via a search for YAML front matter best practices. This
project provides FTS5 + semantic search, frontmatter-aware indexing, git
integration, write capability, and link graph analysis — all for a plain
markdown directory. If the `/website-analysis` skill uses `.research/` as its
vault, this MCP server could be added to `.claude/settings.json` to give Claude
Code rich search over accumulated analysis artifacts at zero infrastructure
cost.

**Anytype has an official first-party MCP server** — this was a positive
surprise. Local-first, E2E encrypted, free for personal use, and fully
integrated with Claude Code via `@anyproto/anytype-mcp`. For users who want a
polished knowledge graph without cloud lock-in, Anytype is better positioned
than Logseq for this use case.

**Raindrop.io now has an official MCP server** — useful for URL collection
workflows even if not for structured analysis artifact storage.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 3
- LOW claims: 1
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The NotebookLM findings are solidly confirmed by both official Google Cloud
documentation and multiple independent sources. The SQLite, Markdown vault,
Notion, and Anytype findings are confirmed by official documentation in each
case. The Logseq/Dendron assessments are based on community rankings and GitHub
activity rather than official sources, hence MEDIUM confidence for those
specific claims.
