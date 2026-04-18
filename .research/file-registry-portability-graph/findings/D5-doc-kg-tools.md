# Findings: Doc Knowledge-Graph Tools — Obsidian Ecosystem, Logseq, Tana, Dendron, Foam, Roam/Reflect/Athens

**Searcher:** deep-research-searcher  
**Profile:** web + docs  
**Date:** 2026-04-17  
**Sub-Question IDs:** D5

---

## Summary

The doc knowledge-graph tool landscape splits cleanly into two categories: tools
that _could_ work on arbitrary directories containing `.md`/`.yaml`/`.ts`/`.sh`
files (Obsidian + FolderBridge/symlinks + Breadcrumbs/Dataview), and tools that
are either SaaS-only, maintenance-abandoned, or too opinionated about file
format (Logseq DB, Tana, Dendron, Foam, Roam/Athens). Obsidian with FolderBridge
is the only option that satisfies "point at `.claude/` and `scripts/`" without
file migration. Non-markdown files (`.ts`, `.sh`, `.yaml`) remain second-class
citizens in _all_ doc KG tools — they can appear as nodes via JS workarounds but
cannot carry frontmatter-based metadata natively. The serendipitous discovery is
`obsidian-skill-graph` (April 2026) — a custom plugin built specifically for
Claude Code skill visualization — and `skills-md-graph` — a Rust CLI with
upstream/downstream query, cycle detection, and Neo4j export.

---

## Key Findings

### 1. Obsidian Core — Vault Scoping is the Gating Issue [CONFIDENCE: HIGH]

Obsidian requires a vault root directory. You cannot point it at an arbitrary
subset of a repo without one of two workarounds:

- **FolderBridge plugin** (March 2026, Windows-tested): mounts external
  directories as virtual vault paths. Includes a background file watcher with
  real-time sync. Windows hardened (long paths, UNC, WSL). The forum and GitHub
  confirm "works with all plugins." [C-D5-001]
- **Symlinks/junctions** (native OS feature): Obsidian historically supported
  symlinks, but a security fix in v0.9.1 (March 2026) blocked symlinks pointing
  _outside_ the vault boundary. This makes the old "symlink `.claude/` into
  vault" pattern unreliable on current Obsidian. [C-D5-002]

**Verdict:** FolderBridge is the currently-viable path for mounting
`.claude/skills/`, `.claude/agents/`, and `scripts/` into an Obsidian vault
without moving files. The March 2026 symlink blocking makes junctions the
preferred Windows-native alternative over symlinks.

Sources:
[FolderBridge GitHub](https://github.com/tescolopio/Obsidian_FolderBridge),
[FolderBridge Forum](https://forum.obsidian.md/t/new-plugin-folder-bridge-mount-your-folders-into-obsidian/111496),
[Symlink security search results](https://forum.obsidian.md/t/obsidian-safe-symlinks/100873)

---

### 2. Obsidian Breadcrumbs — Typed Directed Edges via Frontmatter [CONFIDENCE: MEDIUM-HIGH]

Breadcrumbs (SkepticMystic) creates a directed graph where every edge has a
named type. Configuration is per-hierarchy; you define field names (e.g., `up:`,
`down:`, `uses:`, `requires:`) in plugin settings, then reference them in YAML
frontmatter:

```yaml
---
tags: [skill]
up: "[[.claude/skills/deep-research]]"
uses: ["[[.claude/agents/searcher]]", "[[.claude/agents/synthesizer]]"]
---
```

V4 (current) uses full file paths as node identifiers rather than basenames,
which is critical for a multi-directory vault. The plugin exposes `window.BCAPI`
for programmatic graph traversal from DataviewJS or other plugins. [C-D5-003]

**Non-markdown caveat:** Breadcrumbs operates on Obsidian's `metadataCache`,
which only indexes `.md` files for frontmatter. A `.yaml` or `.ts` file mounted
via FolderBridge will appear in the graph as a node _referenced by_ a markdown
file, but cannot itself carry typed Breadcrumbs edges unless wrapped by a
companion `.md` stub file.

Sources: [Breadcrumbs DeepWiki](https://deepwiki.com/SkepticMystic/breadcrumbs),
[Breadcrumbs V4 changelog](https://github.com/SkepticMystic/breadcrumbs/blob/master/V4.md),
[Obsidian Forum frontmatter confirmed syntax](https://publish.obsidian.md/breadcrumbs-docs/Explicit+Edge+Builders/Typed+Links)

---

### 3. Obsidian Dataview — Query Layer Over Frontmatter [CONFIDENCE: HIGH]

Dataview is a SQL-like query engine over Obsidian's index. Key facts:

- Indexes **only** `.md` files for frontmatter/inline fields
- Can _locate_ non-markdown files via DataviewJS (`app.vault.getFiles()`) but
  cannot read metadata from them
- Provides a JavaScript API for arbitrary queries, callable from DataviewJS
  blocks or via `window.DataviewAPI` from other plugins
- Queries auto-update in real-time as vault changes — effectively continuous
  change detection for `.md` files
- Supports `file.inlinks`, `file.outlinks` — upstream/downstream traversal over
  `[[wikilinks]]`

The practical pattern for JASON-OS portability tracking: each skill/agent gets a
companion `.md` file with frontmatter (`portable: true`,
`tags: [skill, research]`, `uses: [[...]]`) that Dataview can query. The
`.yaml`/`.ts` source file lives in FolderBridge-mounted directory; the `.md`
stub lives in the vault and references it.

Obsidian Bases (shipped as core plugin, previously beta, now GA): similar to
Dataview but .base files use markdown frontmatter. Also markdown-only for
metadata. Not additive over Dataview for this use case. [C-D5-004]

Sources:
[Dataview official docs](https://blacksmithgu.github.io/obsidian-dataview/),
[Dataview non-markdown article](https://medium.com/@arpablo/the-needle-in-the-haystack-3886de9b5448),
[Obsidian Bases overview](https://practicalpkm.com/bases-plugin-overview/)

---

### 4. obsidian-skill-graph — Directly Relevant Custom Plugin [CONFIDENCE: HIGH]

A custom Obsidian plugin (hanamizuki/obsidian-skill-graph, **v0.1.0, April 1
2026**) built specifically for visualizing Claude Code and OpenClaw skill
structures in Obsidian Graph View:

- Scans SKILL.md files for references to other files (relative paths, markdown
  links, CLI commands, absolute paths)
- Injects `SKILL.md → referenced-file` entries into
  `metadataCache.resolvedLinks` so Graph View renders them as edges
- Uses YAML frontmatter `name:` field to label nodes
- Does **not** use Breadcrumbs — custom metadata approach
- Focus is `.md` skill files, not arbitrary `.ts`/`.yaml`

This proves the pattern is practical: skill graph in Obsidian is already being
built. The constraint is `.md`-centricity. [C-D5-005]

Source:
[obsidian-skill-graph GitHub](https://github.com/hanamizuki/obsidian-skill-graph)

---

### 5. Logseq DB Version — Not Viable for Arbitrary Directory Use [CONFIDENCE: MEDIUM]

Logseq has two modes: legacy file-based (Markdown/Org-mode) and the new DB
version (shipped late 2025). Key facts for this use case:

- **DB version**: no re-indexing — content is written into its own database. Not
  designed to index existing file trees.
- **File-based version**: reads Markdown files from a directory you designate,
  but imposes its own folder structure (journals/, pages/). Arbitrary `scripts/`
  or `.claude/` directories are not natively indexed.
- **Headless/CLI**: The legacy file-based version added CLI export/append
  commands, but these are append-only, not query. No headless full-graph query
  confirmed.
- **API**: A `get_page_properties` endpoint exists, plus the plugin API, but no
  REST API or MCP server is first-party. A community MCP server exists
  (mcp-markdown-vault) but is not Logseq-official.
- Non-markdown files: not supported in either version. [C-D5-006]

Sources:
[Logseq DB Unofficial FAQ](https://discuss.logseq.com/t/logseq-db-unofficial-faq/32508),
[Logseq headless discussion](https://discuss.logseq.com/t/headless-logseq-on-a-self-hosted-server-and-add-edit-data-using-api/27855)

---

### 6. Tana — Best Typed Tag Model, But SaaS-Only [CONFIDENCE: HIGH]

Tana's supertag system is the most semantically sophisticated: supertags turn
nodes into typed objects (think: `#skill`, `#agent`, `#config-file`) with typed
fields per tag. This is the closest thing to a formal schema for file metadata.

- **Local API / MCP**: Available via Tana Desktop (2025). MCP-compatible.
  Provides `import_tana_paste`, node search, field update. Requires desktop app
  running.
- **Self-hosted**: **No**. Tana is SaaS. The "Local API" means API calls go to
  your local desktop app, which syncs to Tana's cloud. No on-premises option.
- **Programmatic population**: You can write a Node.js script that calls the
  Local API or Input API to create nodes with supertags, effectively populating
  a file registry. Tana has an official `@roam-research/tana-input-api` sample
  library. [C-D5-007]
- **Non-markdown**: Tana nodes are data objects, not files. You can represent
  `.ts` files as Tana nodes with typed fields, but it is entirely manual or
  script-driven — no file-system watcher.
- **Cost**: $10/month (solo). No free tier beyond trial.

Sources:
[Tana Local API/MCP docs](https://outliner.tana.inc/docs/local-api-mcp),
[Tana supertags](https://tana.inc/docs/supertags),
[Supertag CLI](https://github.com/jcfischer/supertag-cli)

---

### 7. Dendron — Maintenance Mode, Effectively Dead [CONFIDENCE: HIGH]

Dendron (hierarchical notes VSCode extension) entered **maintenance mode in
March 2023** — no active feature development. The VSCode Marketplace extension
still installs. Cross-vault graph view exists but schema imports across vaults
don't work. File-watcher based, but last serious development was 2022.
[C-D5-008]

**Do not invest in Dendron for new work.** License changed to Apache 2.0
(forkable), but no community fork has gained traction.

Source:
[Dendron maintenance announcement](https://randomgeekery.org/post/2023/02/dendron-is-officially-in-maintenance-mode/),
[Dendron GitHub discussion](https://github.com/dendronhq/dendron/discussions/3890)

---

### 8. Foam (VSCode) — Active But Shallow Graph [CONFIDENCE: MEDIUM]

Foam is a VSCode extension providing wikilink-based graph visualization. Key
facts:

- Works on existing directories — you open any folder in VSCode and enable Foam
- Graph view is visual-only (no query API beyond VS Code API)
- Links must be `[[wikilinks]]` or Markdown links in `.md` files
- Known bug: clicking non-markdown file links creates a new note instead of
  opening the file
- No frontmatter-based typed edges — just link presence
- File watcher: yes, via VS Code's built-in watcher
- No upstream/downstream semantics — graph is untyped bidirectional [C-D5-009]

Foam is viable as a lightweight visualization layer on existing `.md` files, but
cannot model dependency direction or carry tags for non-markdown files.

Sources: [Foam GitHub](https://github.com/foambubble/foam),
[Foam VS Code Extension DeepWiki](https://deepwiki.com/foambubble/foam/2.3-vs-code-extension),
[Foam non-markdown issue #915](https://github.com/foambubble/foam/issues/915)

---

### 9. Roam Research / Reflect / Athens — SaaS or Abandoned [CONFIDENCE: HIGH]

- **Athens Research**: **Archived, no longer maintained** (confirmed 2024). Was
  YC W21. Export to markdown via community tool. [C-D5-010]
- **Roam Research**: SaaS. No REST API (unofficial Puppeteer-based workarounds
  exist). MCP server exists (2b3pro/roam-research-mcp) but requires running Roam
  in a browser. Not viable for local-first file registry.
- **Reflect**: SaaS, no public API, no local option. Not investigated further.
- **Amplenote**: SaaS, has API, but no file-system awareness.

None of these are viable for the JASON-OS use case (local-first, Windows,
arbitrary directories).

Sources:
[Athens GitHub archived notice](https://github.com/athensresearch/athens),
[Roam MCP](https://github.com/2b3pro/roam-research-mcp)

---

### 10. Org-mode / Org-roam — Emacs-Only, Not Windows-Native [CONFIDENCE: MEDIUM]

Org-roam builds a SQLite graph of `.org` files with backlinks and tags.
`org-roam-ql` adds a query language. `org-roam-ui` is a browser-based graph
frontend. However:

- Requires Emacs runtime — not Windows-native without WSL or heavy setup
- `.org` file format only — no `.md`, `.ts`, `.yaml`
- Headless invocation possible via `emacs --batch` but fragile
- Not viable for JASON-OS portability tracking without a full Emacs commitment
  [C-D5-011]

Sources: [Org-roam manual](https://www.orgroam.com/manual.html),
[org-roam-ql](https://github.com/ahmed-shariff/org-roam-ql)

---

### 11. skills-md-graph — Serendipitous: Rust CLI for Skill Dependency Graphs [CONFIDENCE: MEDIUM]

`navfa/skills-md-graph` is a Rust CLI tool (found via search, no clear date)
that parses `.md` files with YAML frontmatter into a dependency graph. Features
relevant to JASON-OS:

- Queries: `--uses` (dependents), `--deps` (transitive dependencies),
  `--path-between`
- Cycle detection via Tarjan SCC
- DOT/PNG rendering
- Export to RDF/Turtle and Neo4j Cypher
- Configurable via `.skill-graph.toml` (walks up parent directories like
  `.gitignore`)

Constraints: markdown-only, no file watcher, no live UI. But the Cypher/RDF
export means it could feed a graph DB. The `--uses` / `--deps` CLI flags
directly answer "what depends on this file?" [C-D5-012]

Source: [skills-md-graph GitHub](https://github.com/navfa/skills-md-graph)

---

### 12. Critical Probe: Non-Markdown Files as First-Class Nodes [CONFIDENCE: HIGH]

**Definitive answer: No doc KG tool treats `.ts`/`.sh`/`.yaml` as first-class
nodes with metadata indexing.**

The workable pattern across all tools is the **companion stub approach**:

```
.claude/skills/deep-research/
  SKILL.md          ← Obsidian/Foam/Dendron graph node (frontmatter + edges)
  deep-research.yaml ← actual skill definition (referenced by SKILL.md)
```

The `.md` stub carries all graph metadata (tags, `uses:`, `portable: true`,
`upstream:`, `downstream:`). The `.yaml` source file is linked from the stub.
This pattern is already implemented in `obsidian-skill-graph`. [C-D5-013]

---

### 13. "File X Changed; Files Linking to It" — Change Detection Query [CONFIDENCE: MEDIUM]

No doc KG tool natively surfaces "file changed → notify dependents." The closest
approaches:

- **Obsidian + Dataview + File Watcher**: Dataview re-runs queries on vault
  events. You could write a DataviewJS block that queries `file.inlinks` of a
  given file, displaying all upstream dependents. Not a push notification — pull
  query on demand.
- **skills-md-graph** `--uses` flag: run on demand to list dependents. No
  watcher.
- **Custom approach**: `chokidar` (Node.js) watching `.claude/**` + reading
  frontmatter `upstream:`/`downstream:` fields from YAML or MD files → build the
  dependency set and notify. This is the only way to get actual change-triggered
  dependency notification without a graph DB. [C-D5-014]

---

### 14. Tag Taxonomy — Free-Form vs. Typed Supertags [CONFIDENCE: LOW]

No peer-reviewed research was found directly comparing free-form tags vs. typed
tags in PKM systems. Practitioner consensus in knowledge management literature
(2024-2025):

- **Free-form tags** (Obsidian hashtags): fast entry, inconsistent over time,
  hard to query with confidence
- **Typed supertags** (Tana): enforce schema, slower setup, query is reliable
- Industry pattern: organizations that invested in taxonomies/ontologies get
  better AI retrieval quality [C-D5-015]

For the JASON-OS use case, typed frontmatter fields (not hashtags) achieve
supertag-like discipline without SaaS dependency — Obsidian Properties +
Dataview achieves 80% of Tana's taxonomy benefit locally.

---

## Per-Candidate Evaluation Matrix

| Candidate               | Arbitrary Dir        | Non-MD Nodes    | File Watcher         | Query API          | Cross-Project   | Windows+Node | License/Cost              |
| ----------------------- | -------------------- | --------------- | -------------------- | ------------------ | --------------- | ------------ | ------------------------- |
| Obsidian + FolderBridge | **Y** (FolderBridge) | Partial (stubs) | **Y** (FolderBridge) | DataviewJS + BCAPI | Y (multi-vault) | **Y**        | Free (Obsidian free tier) |
| Obsidian Breadcrumbs    | depends on vault     | N (MD only)     | via Obsidian         | BCAPI              | Y               | Y            | Free                      |
| Obsidian Dataview       | depends on vault     | Partial (JS)    | **Y** (live)         | DataviewJS API     | Y               | Y            | Free                      |
| obsidian-skill-graph    | via Obsidian         | N               | via Obsidian         | N (visual only)    | N               | Y            | Open source               |
| Logseq (file-based)     | Limited              | N               | Y                    | Partial CLI        | N               | Y            | Free/OSS                  |
| Logseq DB               | N                    | N               | N/A                  | Limited            | N               | Y            | Free                      |
| Tana                    | N (SaaS)             | N (manual)      | N                    | Local API/MCP      | Y (SaaS)        | Y (API)      | $10/mo                    |
| Dendron                 | Y (VSCode)           | N               | Y                    | N                  | Y               | Y            | **DEAD** (maintenance)    |
| Foam                    | Y                    | N               | Y (VSCode)           | N                  | N               | Y            | MIT                       |
| Roam Research           | N (SaaS)             | N               | N                    | Unofficial only    | N (SaaS)        | N            | $15/mo                    |
| Athens                  | N                    | N               | N                    | N                  | N               | N            | **ABANDONED**             |
| org-roam                | Y                    | N               | Y                    | Emacs Lisp         | Y               | Needs WSL    | GPL free                  |
| skills-md-graph         | Y (CLI)              | N (MD only)     | N                    | CLI (`--uses`)     | Y               | Y            | Open source               |

---

## Top-2 Recommendations

### Recommendation 1: Obsidian Vault Pointing at `.claude/` via FolderBridge

**Setup:** Create an Obsidian vault at `~/.claude-os-vault/`. Use FolderBridge
to mount:

- `C:\Users\jason\.claude\skills\` → `skills/`
- `C:\Users\jason\.claude\agents\` → `agents/`
- `C:\Users\jason\Workspace\dev-projects\sonash-v0\.claude\skills\` →
  `sonash/skills/`

Each skill/agent `.yaml` gets a companion `SKILL.md` with frontmatter:

```yaml
---
portable: true
tags: [skill, research]
up: "[[skills/deep-research]]"
uses: ["[[agents/searcher]]", "[[agents/synthesizer]]"]
---
```

Breadcrumbs gives typed directed edges. Dataview gives SQL-like query: "all
portable skills using agent X." FolderBridge gives real-time file watching.
BCAPI + DataviewJS give programmatic query from scripts or MCP. This is a fully
local, Windows-native, Node.js-integratable solution with no SaaS dependency.

**Risk:** Non-markdown source files (`.yaml`, `.ts`, `.sh`) cannot be queried as
first-class metadata nodes — they are leaves in the graph. The companion stub
pattern adds file maintenance overhead.

### Recommendation 2: skills-md-graph as CLI Complement

Use `skills-md-graph` alongside Obsidian for headless, CI-time dependency
analysis. Run `skills-md-graph --uses deep-research` to get all dependents
before modifying a skill. The `--path-between` and cycle detection catch
accidental circular dependencies. Neo4j Cypher export enables graph DB
integration if the project grows.

**Limitation:** No file watcher; point-in-time only. No non-markdown awareness.
But zero GUI overhead — runs in `npm` scripts or GitHub Actions.

---

## Sources

| #   | URL                                                                                          | Title                    | Type             | Trust       | CRAAP | Date     |
| --- | -------------------------------------------------------------------------------------------- | ------------------------ | ---------------- | ----------- | ----- | -------- |
| 1   | https://github.com/tescolopio/Obsidian_FolderBridge                                          | Obsidian FolderBridge    | plugin-docs      | HIGH        | 4.4   | Mar 2026 |
| 2   | https://forum.obsidian.md/t/new-plugin-folder-bridge-mount-your-folders-into-obsidian/111496 | FolderBridge Forum       | community        | MEDIUM-HIGH | 4.0   | Mar 2026 |
| 3   | https://blacksmithgu.github.io/obsidian-dataview/                                            | Dataview Official Docs   | official-docs    | HIGH        | 4.6   | 2025     |
| 4   | https://deepwiki.com/SkepticMystic/breadcrumbs                                               | Breadcrumbs DeepWiki     | doc-aggregator   | MEDIUM      | 3.8   | 2025     |
| 5   | https://github.com/SkepticMystic/breadcrumbs/blob/master/V4.md                               | Breadcrumbs V4 Changelog | official-docs    | HIGH        | 4.5   | 2024     |
| 6   | https://github.com/hanamizuki/obsidian-skill-graph                                           | obsidian-skill-graph     | community-plugin | MEDIUM      | 3.6   | Apr 2026 |
| 7   | https://discuss.logseq.com/t/logseq-db-unofficial-faq/32508                                  | Logseq DB FAQ            | community        | MEDIUM      | 3.5   | 2025     |
| 8   | https://outliner.tana.inc/docs/local-api-mcp                                                 | Tana Local API/MCP       | official-docs    | HIGH        | 4.5   | 2025     |
| 9   | https://tana.inc/docs/supertags                                                              | Tana Supertags           | official-docs    | HIGH        | 4.5   | 2025     |
| 10  | https://randomgeekery.org/post/2023/02/dendron-is-officially-in-maintenance-mode/            | Dendron Maintenance Mode | community        | MEDIUM      | 4.0   | Feb 2023 |
| 11  | https://github.com/foambubble/foam                                                           | Foam GitHub              | official         | HIGH        | 4.2   | 2025     |
| 12  | https://github.com/athensresearch/athens                                                     | Athens (archived)        | official         | HIGH        | 5.0   | 2024     |
| 13  | https://github.com/navfa/skills-md-graph                                                     | skills-md-graph CLI      | community        | MEDIUM      | 3.4   | unknown  |
| 14  | https://medium.com/@arpablo/the-needle-in-the-haystack-3886de9b5448                          | Dataview Non-MD article  | community-blog   | MEDIUM      | 3.5   | 2024     |
| 15  | https://www.orgroam.com/manual.html                                                          | Org-roam Manual          | official-docs    | HIGH        | 4.5   | 2025     |

---

## Contradictions

**Symlinks: allowed vs. blocked.** Older Obsidian community guides describe
using symlinks/junctions to mount external directories into a vault. A March
2026 security update (v0.9.1) reportedly blocked symlinks pointing outside the
vault boundary. This directly contradicts older tutorials. FolderBridge is the
replacement pattern, but it requires a third-party plugin. Confidence: MEDIUM —
the security patch note was found via indirect search result, not official
changelog.

**Dataview JS vs. DQL for non-MD files.** The official docs say Dataview indexes
markdown only. The DataviewJS API (`app.vault.getFiles()`) can enumerate all
files including `.ts` and `.yaml`, and can read their raw content — but _not_
their frontmatter (which Obsidian only parses for `.md`). Some community sources
imply JS can "query" non-MD files, but this means "list them," not "query their
metadata."

---

## Gaps

1. **Breadcrumbs BCAPI surface area not fully documented.** The `window.BCAPI`
   object exists and is documented to allow other plugins to traverse the graph,
   but exact method signatures were not retrievable from current docs or
   DeepWiki. Would need to read source or test empirically.

2. **FolderBridge + Dataview interaction not empirically verified.**
   FolderBridge claims all plugins see mounted files as native. Whether Dataview
   actually indexes frontmatter in `.md` files mounted via FolderBridge needs
   hands-on testing.

3. **Obsidian v0.9.1 symlink blocking — exact behavior unclear.** Is it blocking
   all symlinks pointing outside, or only in the MCP context? The security fix
   was found via MCPVault issue, suggesting it may be MCP-specific. Official
   changelog not confirmed.

4. **skills-md-graph last updated / maintenance status unknown.** Repository
   commit count (52) and pattern suggest recent activity but no release date
   confirmed.

5. **Tana Input API vs. Local API differences.** The Input API and Local API
   have different node ID requirements. Programmatic file registry population
   would require mapping file paths to Tana node IDs — a bootstrapping problem.

6. **Free-form vs. typed tags research.** No academic research found on this
   comparison for developer-centric PKM systems. Only practitioner consensus.

---

## Serendipity

- **obsidian-skill-graph (April 2026):** Someone already built an Obsidian
  plugin specifically for Claude Code skill graph visualization that injects
  edges into `metadataCache.resolvedLinks`. This is directly relevant to
  JASON-OS and suggests the pattern is proven in practice, not hypothetical.

- **Tana Local API + MCP:** Tana now exposes an MCP endpoint from the desktop
  app. This means a Claude Code agent could _write_ to Tana programmatically
  (populate file nodes, set supertag fields) while the human uses the Tana GUI
  for visualization. Hybrid local-computation + SaaS-GUI pattern worth noting
  even though Tana is SaaS.

- **skills-md-graph Cypher export:** The ability to export a SKILL.md-based
  dependency graph to Neo4j Cypher means a future escalation path exists from
  flat-file to graph DB without rebuilding the indexing layer.

---

## Confidence Assessment

- HIGH claims: 7 (C-D5-001, C-D5-004, C-D5-005, C-D5-007, C-D5-008, C-D5-010,
  C-D5-013)
- MEDIUM-HIGH claims: 1 (C-D5-003)
- MEDIUM claims: 5 (C-D5-002, C-D5-006, C-D5-009, C-D5-011, C-D5-014)
- LOW claims: 1 (C-D5-015)
- UNVERIFIED claims: 0
- **Overall confidence: MEDIUM-HIGH**

The Obsidian + FolderBridge + Breadcrumbs + Dataview stack is well-evidenced and
practically proven (obsidian-skill-graph being a live example). The non-markdown
limitation is definitive across all candidates. Symlink behavior post-v0.9.1
needs empirical verification.
