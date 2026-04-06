# Findings: Obsidian as an External Knowledge Store for Claude Code

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-05 **Sub-Question IDs:** SQ11a

---

## Key Findings

### 1. Multiple Mature MCP Servers Exist [CONFIDENCE: HIGH]

As of early 2026, at least four production-grade MCP servers connect Claude Code
to Obsidian vaults. They split into two architectural camps:

**Plugin-based (requires Obsidian running):**

- **obsidian-claude-code-mcp** (Ian Sinnott, v1.1.8, June 2025, 226 stars) — an
  Obsidian community plugin that runs a dual-transport MCP server (WebSocket for
  Claude Code auto-discovery on port 22360; HTTP/SSE for Claude Desktop).
  Exposes file read/write/create, vault exploration, workspace info, and
  IDE-specific tools (diff views, tab management). Requires Obsidian to be
  running. [1][8]

- **mcp-obsidian** (MarkusPfundstein, 3.2k stars, 380 forks) — wraps the
  `obsidian-local-rest-api` community plugin. Exposes: `list_files_in_vault`,
  `list_files_in_dir`, `get_file_contents`, full-text search, `append_content`,
  `patch_content` (relative to headings), `delete_file`. No tag tools. Requires
  both Obsidian running AND the Local REST API plugin active. Installable via
  `uvx mcp-obsidian`. [2]

**Filesystem-based (no Obsidian required):**

- **MCPVault** (@bitbonsai/mcpvault, v0.11.0, March 2026) — reads vault files
  directly from the filesystem. Exposes: note CRUD, BM25 search with filename
  matching, `list_all_tags` (frontmatter + inline hashtags), backlink tracking,
  vault statistics. Includes security hardening (symlink boundary validation,
  TOCTOU protections). Does NOT require Obsidian to be running. [3]

- **Obsidian Notes MCP** (marcelmarais, playbooks.com) — filesystem mode, no
  Obsidian dependency. Exposes read/write/list operations directly on `.md`
  files. [6]

**Recommendation for our use case:** MCPVault is the strongest match. It
operates without Obsidian running (critical for headless Claude Code sessions),
provides structured search, tag enumeration, and backlink tracking — all useful
for querying analysis artifacts.

---

### 2. Obsidian Vault Structure is Fully Markdown-Compatible [CONFIDENCE: HIGH]

An Obsidian vault is a plain directory of `.md` files. No proprietary format.
Any markdown file Claude already writes is immediately valid. The core
structural elements:

**YAML frontmatter** (fenced by `---`):

```yaml
---
title: "Website Analysis: example.com"
type: website-analysis
domain: ecommerce
tags: [website-analysis, ecommerce, competitor]
status: complete
date_analyzed: 2026-04-05
url: https://example.com
confidence: HIGH
---
```

Obsidian reads these fields for Dataview queries, search, and graph metadata.
All standard fields are optional — the format degrades gracefully. Our existing
`.research/` FINDINGS.md format is compatible; add a frontmatter block and it
works in Obsidian immediately. [4][5][9]

**Internal links** use `[[note-title]]` syntax. These create the graph
structure. AI-generated analysis notes can include `[[brand-voice]]`,
`[[pricing-strategy]]` etc. to connect across analyses. The backlink system
auto-tracks these.

**Folder structure** recommended for analysis artifacts:

```
vault/
  _templates/           # Analysis output templates (excluded from graph)
  _schema/              # CLAUDE.md or AGENTS.md schema guide for Claude
  00-inbox/             # Raw analysis dumps pending triage
  01-website-analyses/  # Structured website analysis notes
    example-com/
      index.md          # Summary with frontmatter
      ux-analysis.md    # Section-level artifacts
      tech-stack.md
  02-patterns/          # Cross-site patterns discovered
  03-resources/         # Reference material
```

Numbered prefixes enforce predictable ordering. Underscore prefixes
(`_templates`, `_schema`) visually separate infrastructure from content and can
be excluded from graph/search filters. [9][10]

---

### 3. Dataview Enables Structured Querying Over Analysis Artifacts [CONFIDENCE: HIGH]

Dataview (blacksmithgu/obsidian-dataview, widely installed) turns the vault into
a queryable database. It supports four output modes: LIST, TABLE, TASK,
CALENDAR.

**Example query over website analyses:**

````markdown
```dataview
TABLE url, domain, confidence, date_analyzed
FROM "01-website-analyses"
WHERE status = "complete"
SORT date_analyzed DESC
```
````

**DataviewJS** provides full JavaScript API access for complex queries. DQL
covers ~90% of use cases. Key constraint: Dataview is read-only — it displays
and calculates but does not write back to notes. Only explicitly declared
frontmatter fields and inline `[key:: value]` annotations are indexed;
unstructured paragraph text is not.

For AI-generated analysis output to be Dataview-queryable, every artifact file
needs:

1. Consistent frontmatter keys across all analyses
2. Discrete field values (not prose) for filterable dimensions (confidence,
   domain, status)

This aligns well with the structured FINDINGS.md format already used in
`.research/`. [11][12]

---

### 4. Direct Filesystem Write is Feasible Without MCP [CONFIDENCE: HIGH]

Since Obsidian vaults are plain directories of markdown files, Claude Code can
write analysis artifacts directly to a vault directory with no MCP or Obsidian
process required:

```bash
# Claude Code writes directly, Obsidian picks up on next open
write_file("$OBSIDIAN_VAULT/01-website-analyses/example-com/index.md", content)
```

Obsidian auto-detects new files when its window is focused or the vault is
refreshed. There is no lock file, no write contention, no special API needed.

**Critical Windows/WSL caveat:** Obsidian for Windows cannot open vaults stored
in WSL filesystem paths (`\\wsl.localhost\...`). The solution is bind mounting:
use `/etc/fstab` to mount the Windows vault path into WSL. From Claude Code's
perspective it becomes a regular local directory. Symlinks fail; bind mounts
succeed. This is a confirmed working pattern documented by active users in
2025-2026. [13][14]

---

### 5. Obsidian Does Not Need to Be Running for Filesystem-Based Workflows [CONFIDENCE: HIGH]

For the "Claude writes, human later reads in Obsidian" integration pattern,
Obsidian never needs to be running during Claude's write phase. Claude writes
`.md` files to the vault directory. When the user opens Obsidian, it indexes the
new files, renders frontmatter, builds backlinks, and makes Dataview queries
live.

For MCP-based read-back (Claude queries the vault later), the filesystem-based
MCPVault server also requires no running Obsidian instance. Only plugin-based
servers (obsidian-claude-code-mcp, mcp-obsidian) require Obsidian to be open.

**Runtime requirements by approach:**

| Approach                 | Obsidian Running? | MCP? | Write | Read/Query      |
| ------------------------ | ----------------- | ---- | ----- | --------------- |
| Direct filesystem write  | Not required      | No   | Yes   | Via Obsidian UI |
| MCPVault                 | Not required      | Yes  | Yes   | Yes             |
| mcp-obsidian             | Required          | Yes  | Yes   | Yes             |
| obsidian-claude-code-mcp | Required          | Yes  | Yes   | Yes             |

---

### 6. Smart Connections Plugin Adds Semantic Search [CONFIDENCE: HIGH]

Smart Connections (brianpetro/obsidian-smart-connections, 786k downloads as of
Jan 2026, 4.4k GitHub stars) adds AI embedding-based semantic search to
Obsidian. Features:

- Local embeddings (on-device, zero API key needed, private)
- Semantic search sidebar that updates as user reads notes
- Drag-to-link suggestions for surfacing related analysis artifacts
- Works with Claude, Gemini, OpenAI, and 100+ other APIs for enhanced ranking
- Pro tier adds inline surfaces, mobile-friendly views, Bases integration

For the website-analysis use case: after Claude writes analysis notes, Smart
Connections can surface related past analyses when the user reads a new one.
This enables "what did we find about pricing patterns before?" style queries
without manual linking. [15]

---

### 7. Obsidian is Free for All Use Cases [CONFIDENCE: HIGH]

As of early 2025, Obsidian is free for all purposes including personal,
commercial, and non-profit use. The previous commercial license requirement (for
business use) was removed. No account required. Data stays local unless you opt
into paid Sync or Publish.

Optional paid tiers:

- **Catalyst license**: Individuals, early beta access, $25 one-time (optional
  support)
- **Obsidian Sync**: $4/month — encrypted cross-device sync
- **Obsidian Publish**: $8/month — public web hosting of vault content

For developer/AI tooling use cases: entirely free. [16]

---

### 8. Graph View Degrades at Scale, But is Not Critical [CONFIDENCE: MEDIUM]

Obsidian's Graph View visualizes note connections as an interactive diagram.
Performance profile:

- **Under ~5,000 notes**: Functional, useful for exploration
- **5,000-10,000 notes**: Noticeably slower, stabilization takes time
- **10,000+ notes**: Global graph view may freeze or become unusable
- **Local graph view** (one note's connections): Works at any scale

For website-analysis use cases generating hundreds of analysis artifacts over
months, global graph view will degrade. However, the graph is supplementary —
Dataview queries and Smart Connections semantic search are the primary retrieval
mechanisms. The graph provides "discovery browsing" value, not core query
functionality.

Mitigation: Dataview filters, folder scoping, and tag-based grouping in graph
view maintain usability even at moderate scale. [17][18]

---

### 9. Sync and Mobile Access Are Available But Add Complexity [CONFIDENCE: MEDIUM]

**Sync options (ranked by simplicity):**

1. **Obsidian Sync** ($4/month) — End-to-end encrypted, works on all platforms,
   iOS
   - Android native support. Simplest path to mobile access.
2. **iCloud Drive** — Free, iOS-native. No Android. Officially supported by
   Obsidian.
3. **Git-based sync** — obsidian-git plugin (Vinzent03, actively
   maintained 2025) auto-commits and pushes on schedule. Free. No mobile without
   Working Copy (iOS) or MGit (Android). Developer-friendly — vault becomes a
   git repo with full history.
4. **Syncthing** — Free, self-hosted P2P. Cross-platform including Android. iOS
   support is unofficial/fragile.

For Claude Code's primary write use case (local machine): no sync needed. Sync
only matters if the user wants mobile read access or cross-machine availability.
The git-based sync aligns well with the existing git-native `.research/`
workflow in this project. [19][20]

---

### 10. The .research/ to Obsidian Vault Mapping is Straightforward [CONFIDENCE: HIGH]

Current `.research/<topic>/findings/` FINDINGS.md files map directly to
Obsidian:

| Current                                       | Obsidian equivalent                       |
| --------------------------------------------- | ----------------------------------------- |
| `.research/<topic>/findings/D11a-obsidian.md` | `01-analyses/<topic>/D11a-obsidian.md`    |
| `.research/<topic>/RESEARCH_OUTPUT.md`        | `01-analyses/<topic>/index.md`            |
| `.research/<topic>/claims.jsonl`              | Not mappable (Dataview can't query JSONL) |

The FINDINGS.md format needs one addition — a YAML frontmatter block at the top
— and it becomes a first-class Obsidian note with full Dataview/graph/search
support. The claims.jsonl and sources.jsonl files are structured data that don't
fit Obsidian's markdown model; they can live alongside as attachments but are
not queryable by Dataview (which reads only frontmatter and inline fields from
`.md` files).

**Schema contract file:** A `_schema/CLAUDE.md` or `_schema/AGENTS.md` file in
the vault root serves as an instructions document telling future Claude sessions
how the vault is organized, what frontmatter fields to use, and where to write
different artifact types. This pattern is documented as a best practice for
AI-managed vaults. [9][10]

---

### 11. Plugin Dependency Risk is Real But Manageable [CONFIDENCE: MEDIUM]

Core analysis artifacts are plain markdown files — they survive any plugin
failure. Plugin dependency is layered:

**Zero plugins (always works):** Read/write markdown, frontmatter, internal
links **Dataview (stable, widely used):** Structured queries over frontmatter
metadata **Smart Connections (mature, 786k downloads):** Semantic search and
suggestions **MCPVault (newer, v0.11.0):** MCP-based programmatic access from
Claude Code

Dataview is the most critical dependency for structured queries. It is among
Obsidian's most-downloaded plugins (~4M downloads historically) and has been
actively maintained since 2020. Risk of abandonment is low; risk of breaking
changes is low in the short term but non-zero (the plugin ecosystem is
community-maintained).

Mitigation: Design the frontmatter schema so notes are useful without Dataview
(human-readable). Dataview adds query power but shouldn't be the only way to
find information. [11]

---

## Sources

| #   | URL                                                                                                              | Title                                                | Type              | Trust       | CRAAP | Date      |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------- | ----------- | ----- | --------- |
| 1   | https://github.com/iansinnott/obsidian-claude-code-mcp                                                           | obsidian-claude-code-mcp                             | official repo     | HIGH        | 4.2   | Jun 2025  |
| 2   | https://github.com/MarkusPfundstein/mcp-obsidian                                                                 | mcp-obsidian                                         | official repo     | HIGH        | 4.0   | 2024-2025 |
| 3   | https://mcp-obsidian.org/                                                                                        | MCPVault v0.11.0                                     | official docs     | HIGH        | 4.3   | Mar 2026  |
| 4   | https://ithy.com/article/frontmatter-in-obsidian-qxhwc37n                                                        | Unlocking Frontmatter in Obsidian                    | community article | MEDIUM      | 3.5   | 2025      |
| 5   | https://notes.nicolevanderhoeven.com/obsidian-playbook/Using+Obsidian/03+Linking+and+organizing/YAML+Frontmatter | YAML Frontmatter - Fork My Brain                     | community expert  | MEDIUM-HIGH | 3.8   | 2024-2025 |
| 6   | https://playbooks.com/mcp/marcelmarais-obsidian-notes                                                            | Obsidian Notes MCP Server                            | official docs     | HIGH        | 4.0   | 2025      |
| 7   | https://forum.obsidian.md/t/i-built-an-mcp-server-that-connects-claude-ai-directly-to-your-obsidian-vault/112454 | Obsidian Forum MCP Thread                            | community forum   | MEDIUM      | 3.5   | 2025      |
| 8   | https://deepwiki.com/iansinnott/obsidian-claude-code-mcp/1.1-getting-started                                     | Getting Started - obsidian-claude-code-mcp DeepWiki  | docs              | HIGH        | 4.2   | 2025      |
| 9   | https://www.jamescroft.co.uk/designing-a-machine-readable-knowledge-base-with-obsidian/                          | Designing a Machine-Readable KB with Obsidian        | expert blog       | MEDIUM-HIGH | 4.0   | 2024-2025 |
| 10  | https://blakecrosley.com/guides/obsidian                                                                         | Obsidian as AI Infrastructure - Definitive Reference | expert blog (CTO) | MEDIUM-HIGH | 4.3   | 2025-2026 |
| 11  | https://blacksmithgu.github.io/obsidian-dataview/                                                                | Dataview Official Documentation                      | official docs     | HIGH        | 5.0   | 2025      |
| 12  | https://www.wundertech.net/dataview-obsidian/                                                                    | How to Use Dataview in 2026                          | community guide   | MEDIUM      | 3.5   | 2026      |
| 13  | https://dev.to/tommy_worklab/claude-code-obsidian-turn-ai-conversations-into-a-persistent-knowledge-base-4l29    | Claude Code + Obsidian: Persistent Knowledge Base    | practitioner blog | MEDIUM      | 3.8   | 2025-2026 |
| 14  | https://forum.obsidian.md/t/support-for-vaults-in-windows-subsystem-for-linux-wsl/8580                           | WSL Vault Support Forum Thread                       | community forum   | MEDIUM      | 3.5   | 2023-2025 |
| 15  | https://github.com/brianpetro/obsidian-smart-connections                                                         | Smart Connections GitHub                             | official repo     | HIGH        | 4.5   | 2026      |
| 16  | https://obsidian.md/license                                                                                      | Obsidian License                                     | official          | HIGH        | 5.0   | 2025      |
| 17  | https://forum.obsidian.md/t/obsidian-graph-view-doesnt-work-for-a-large-vault/106287                             | Graph View Large Vault Issues                        | community forum   | MEDIUM      | 3.2   | 2024-2025 |
| 18  | https://medium.com/@theo-james/10-problems-with-obsidian-youll-realize-when-it-s-too-late-17e903886847           | 10 Problems with Obsidian                            | community blog    | MEDIUM      | 3.0   | 2024-2025 |
| 19  | https://github.com/Vinzent03/obsidian-git                                                                        | obsidian-git plugin                                  | official repo     | HIGH        | 4.5   | 2025      |
| 20  | https://dev.to/carmoruda/how-i-sync-my-vault-across-devices-43gn                                                 | Syncing Obsidian Across Devices                      | practitioner blog | MEDIUM      | 3.3   | 2024-2025 |

---

## Contradictions

**MCP server "requires Obsidian running" vs not:** Plugin-based MCP servers
(obsidian-claude-code-mcp, mcp-obsidian) require Obsidian running because they
implement the MCP server inside Obsidian's plugin runtime. Filesystem-based
servers (MCPVault, marcelmarais) do NOT require Obsidian running. These are
different products with different architectures, not a contradiction — but the
distinction is critical for selecting the right approach. Multiple sources
conflate the two approaches.

**Smart Connections "local-first" vs API-using:** Smart Connections markets
itself as "local-first with on-device embeddings" (no API key required), but
also supports 100+ cloud APIs including Claude. The local default is zero-cost
and private; cloud APIs improve ranking quality at the cost of sending note text
to external services. Sources vary on which mode they emphasize.

---

## Gaps

1. **MCPVault write reliability under concurrent access** — not found. If Claude
   is writing to the vault while Obsidian is open, are there write conflicts?
   Obsidian does not lock files, but behavior under concurrent writes is
   undocumented.

2. **Dataview performance with AI-generated content at scale** — at 1,000+ notes
   with complex frontmatter, Dataview query performance is not benchmarked in
   public sources. Anecdotally "acceptable" up to tens of thousands but
   specifics are missing.

3. **MCP tool for searching by frontmatter field value** — MCPVault's v0.11.0
   search is BM25 text search + filename search. Whether it supports structured
   queries like `WHERE type = "website-analysis" AND domain = "ecommerce"`
   (Dataview-style) is unclear from available docs. If not, structured lookup
   requires Obsidian running to execute Dataview.

4. **obsidian-claude-code-mcp write-back to non-open notes** — the plugin's
   write tools are described but the exact behavior when writing to a file not
   currently open in Obsidian is unconfirmed.

5. **Windows path resolution for MCPVault** — MCPVault is documented for Unix
   paths. Windows path handling (backslash vs forward slash, drive letters) on
   native Windows (not WSL) is not confirmed in available docs.

---

## Serendipity

**Schema contract file pattern (`_schema/CLAUDE.md`):** Multiple expert sources
independently recommend placing a `CLAUDE.md` or `AGENTS.md` file in the vault
as an instruction document for AI sessions. This mirrors what SoNash already
uses in the codebase CLAUDE.md. A vault-level schema file could define
frontmatter conventions, folder purposes, and link conventions — making the
vault self-describing for future Claude Code sessions without re-reading
documentation.

**Karpathy's three-folder model** (raw/ wiki/ outputs/) for AI knowledge bases
surfaced in search. The pattern: AI reads raw inputs, rewrites them as
structured wiki entries, stores outputs separately. This maps cleanly onto the
`/website-analysis` skill's artifact flow: raw crawl data → structured analysis
→ output artifacts.

**Smart Connections has its own MCP server** (listed on mcpmarket.com) — meaning
semantic search over the vault could be invoked directly from Claude Code via
MCP without Obsidian running. This was not in the original search scope but
could be a high-value finding for the retrieval phase of the website-analysis
skill.

---

## Integration Feasibility Assessment

**For the `/website-analysis` skill's "Claude writes, later Claude reads back"
pattern:**

The integration is highly feasible. The simplest path:

1. Claude Code writes analysis `.md` files directly to a designated Obsidian
   vault folder (no MCP, no Obsidian running, no special tooling)
2. Each file includes consistent YAML frontmatter (`type`, `domain`, `tags`,
   `status`, `url`, `date_analyzed`, `confidence`)
3. User reads analysis in Obsidian — Dataview queries surface cross-site
   comparisons, Smart Connections surfaces related past analyses
4. For Claude to read back: MCPVault provides filesystem-based read/search
   without Obsidian running (or write directly to `.research/` as today and use
   Obsidian as a view layer)

**The "no MCP needed" baseline** (just write markdown files to a vault
directory) works immediately on Windows without WSL concerns. MCP adds
programmatic read-back from Claude Code; without MCP, the user reads artifacts
in Obsidian while Claude can still re-read the `.md` files directly from disk.

**Windows/WSL risk:** The main friction point. If Claude Code runs in WSL and
the Obsidian vault is on Windows, bind mounting is required. This is a one-time
10-minute setup but requires user action (the `/website-analysis` skill should
document this explicitly and prompt the user, per CLAUDE.md guardrail #14).

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The subject matter is well-documented across official repositories, active forum
discussions, and practitioner guides from 2025-2026. All major claims are
corroborated by 2+ independent sources. The gaps identified are real unknowns,
not absence of research effort.
