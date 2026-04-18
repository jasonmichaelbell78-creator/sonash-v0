# OTB Challenges — File Registry Portability Graph

_Written by orchestrator from otb-challenger agent's task-notification output
per Critical Rule #4._

**Agent:** otb-challenger **Date:** 2026-04-17 **Challenging:** Section 6,
Option B recommendation

---

## Summary: Strongest Competitors to Option B

Three alternatives have highest potential to change the Option B recommendation:

**Alternative 2 (JSONL + jq registry)** is the strongest overall. Builds on
infrastructure SoNash already runs at scale (extraction-journal.jsonl,
agent-invocations.jsonl), zero new dependencies, delivers tag-filter +
portability identification immediately. If the user never needs multi-hop graph
traversal, Option B is over-engineering.

**Alternative 1 (post-write hook as self-update trigger)** directly replaces the
@parcel/watcher component. SoNash already has `post-write-validator.js` firing
on every Claude write. Plugging registry-append into that hook eliminates the
watcher daemon for Claude-session-authored files.

**Alternative 3 (scope-tag-only YAGNI)** challenges whether the graph is needed
at all. Adding `scope: universal` frontmatter to 80 files today (the T0 action)
fully solves portability identification via ripgrep. The graph is only justified
if multi-hop traversal queries are demonstrated — no such queries appeared in
research.

---

## Alt 1: Claude PostToolUse Hook as Self-Update Trigger [HIGH]

**Type:** simpler

**What was not considered:** Research evaluated
chokidar/watchman/fs.watch/@parcel/watcher/git hooks but didn't consider the
existing PostToolUse hook infrastructure. SoNash's `post-write-validator.js`
already fires on every `Write`/`Edit`/`MultiEdit`. Appending registry records to
`~/.claude/file-registry.jsonl` from inside that hook = 20-line addition. Zero
new deps.

**Differs from D6 git-hook:** git hooks are post-commit + tracked files only.
PostToolUse fires on every Claude write, committed or not, tracked or not.
Covers `.research/`, `.claude/agents/`, `.claude/skills/`.

**Pros:**

- Synchronous per-write, zero polling/traversal
- No new npm deps (CJS hook already running)
- Coverage matches use case — portable files are nearly all Claude-authored
- Follows existing lockfile-hash pattern

**Cons:**

- Misses external-editor / git-checkout / npm-install changes → @parcel/watcher
  still needed for completeness
- Adds complexity to existing 800-line hook OR spawns new hook process per write
- No delete/rename detection

**Recommendation:** Complement not replacement. Hook = Claude-session writes;
@parcel/watcher = external changes at session-start. Together, no daemon
required during sessions.

---

## Alt 2: Append-Only file-registry.jsonl + jq [HIGH]

**Type:** simpler

**What was not considered:** SoNash already runs JSONL + jq at production scale
— `extraction-journal.jsonl` (370 entries, schema v2.0),
`agent-invocations.jsonl`, CAS rebuild-index / recall / generate-extractions-md.
This pattern wasn't seriously evaluated as the registry itself.

Proposal: `~/.claude/file-registry.jsonl` with:

```json
{
  "path": ".claude/skills/deep-research.md",
  "scope": "universal",
  "tags": ["research", "orchestration"],
  "upstream": [],
  "downstream": ["searcher-agent"],
  "updated": "2026-04-17",
  "project": "jason-os"
}
```

Queries: `jq 'select(.scope=="universal")' ...`. Self-update via Alt 1 hook.
Dedup via periodic `rebuild-registry.js` using existing CAS pattern.

**Architecturally identical to what CAS already does.** No graph engine, no MCP
thin layer, no @optave/codegraph.

**Pros:**

- Zero new infrastructure
- Cross-project by design (`~/.claude/` is user-level)
- User-defined schema, no migration
- Satisfies 29% abandonment constraint — hook writes automatically, no manual
  step
- Portability identification solved in one line today

**Cons:**

- Multi-hop graph traversal painful in jq (no recursive graph operators) —
  primary capability gap vs @optave/codegraph
- Append-only grows unboundedly; dedup via `group_by(.path) | last` or rebuild
  pass
- No MCP tool surface by default; need a thin wrapper

**Recommendation:** **Adopt as minimum viable registry before committing to
Option B.** 1-day build. Run for 2-4 weeks. If multi-hop queries actually arise
→ Option B justified. If not → Option B is over-engineering. Research identified
traversal as a requirement but provided no concrete query demonstrating need.

---

## Alt 3: Scope-Tag-Only (YAGNI on the Graph) [HIGH]

**Type:** reframing

**What was not considered:** Every research agent accepted "graph with
upstream/downstream" as a given. No agent challenged whether the graph is
actually needed.

User's verbatim goal has two parts: (1) "identify portable files, (2) know when
they've been updated." Neither requires a graph. Part 1 = `scope: universal`
frontmatter + ripgrep. Part 2 = git log or post-write hook timestamp.

Graph is separately needed for "linking upstream and downstream dependencies."
But no concrete query requiring traversal was demonstrated.

Research itself says Section 5: "implement this [scope: field] regardless of
architectural path" and "classification is 'formalize what the file names
already say.'" T0 action — `scope:` on 80 files — fully solves portability
identification.

**Pros:**

- Immediate value, zero build cost today
- `scope:` travels with file across projects — self-describing
- Zero infrastructure to abandon
- Unblocks T0 action that's been deferred 18+ days

**Cons:**

- "Know when updated" needs git log per-project (no unified registry)
- Graph queries not solvable with ripgrep
- Starting point, not endpoint

**Recommendation:** **Adopt T0 action immediately, independently of Option B
decision.** Don't let Option B's timeline block the 30-minute frontmatter task.

---

## Alt 4: Git Notes as Cross-Project Portability Metadata [MEDIUM]

**Type:** adjacent-domain

**What:** `git notes add -m '{"scope":"universal"}' HEAD:path/to/file.md`
attaches JSON metadata to blobs without modifying files. Cross-project angle:
two repos sharing same blob SHA share the same file — git content-addressing
proves identity.

**Pros:** Retroactive (works on existing repos); version-controlled metadata;
SHA equality = mathematically precise proof of identity; zero new tooling.

**Cons:** Notes are non-standard, rarely used; no standard query tooling;
requires explicit `refs/notes/*` push; SHA equality breaks on any content
change; `scope:` frontmatter is more portable (works outside git).

**Recommendation:** Note as future consideration. Alt 8 (blob SHA script) is
simpler for the same sub-problem.

---

## Alt 5: DuckDB Over JSONL as Query Layer [MEDIUM]

**Type:** newer

**What:** DuckDB reads JSONL directly:
`SELECT * FROM read_json_auto('~/.claude/file-registry.jsonl')`.
`SELECT path, unnest(tags) as tag FROM read_json_auto('registry.jsonl') WHERE tag = 'research'`
handles tag arrays natively. `@duckdb/node-api` (2024) provides embeddable
Node.js API.

**Pros:** JSONL-native, no ETL; array/JSON first-class; analytical queries
dramatically simpler than SQLite; complements Alt 2.

**Cons:** Analytical-optimized, limited concurrent write (WAL-mode SQLite more
robust); Windows native compilation friction historically (WASM variant may
avoid); adds 2nd database tech.

**Recommendation:** Query-time complement to Alt 2. Write to JSONL (via hook),
query via DuckDB for analytical queries. Keep SQLite for T28.

---

## Alt 6: chezmoi as Portability Sync Layer [MEDIUM]

**Type:** reframing

**What:** chezmoi (D7 schema source) never evaluated as the sync mechanism.
`chezmoi managed` lists all portable files. `chezmoi diff` shows changes.
`chezmoi apply` propagates updates to all target projects.

In JASON-OS terms: universal-scoped skills become chezmoi-managed files.
`chezmoi apply` propagates updates to all registered project roots. 3 shell
commands replace a custom registry + watcher + sync daemon.

**Pros:** Production-proven, Windows support, active maintenance;
`chezmoi diff/managed/apply` directly maps to the use cases; zero custom build.

**Cons:** Doesn't model dependency edges; two-master problem with git; oriented
around dotfiles — treating `.claude/skills/*.md` as dotfiles is a conceptual
stretch.

**Recommendation:** Complement for propagation sub-problem. Combined with Alt 2
(JSONL registry) + Alt 3 (scope tags) may be complete solution without
@optave/codegraph.

---

## Alt 7: Extend T28 SQLite Store Directly (not Option A as described) [HIGH feasibility, MEDIUM relevance]

**Type:** hybrid

**What was not considered:** Option A = "extend T28 with file-graph tables."
Option B = "@optave/codegraph + portability sidecar." Not considered: use T28's
existing node schema directly for file-level portability metadata. T28 has
`SourceNode.file_path` already + M2M junction tags + confidence table. Adding
`scope`, `tags[]`, `portability` to SourceNode + new FileNode type = existing
MCP surface queryable without @optave/codegraph.

**Differs from Option A:** not "add code-graph tables" but "use T28's existing
node schema to track file-level portability."

**Pros:**

- T28 SQLite validated, production-ready, MCP already exists
- Avoids @optave/codegraph adoption risk (March 2026, unverified Windows, MEDIUM
  confidence per V2)
- Single MCP for all JASON-OS queries

**Cons:**

- T28's purpose is research knowledge management, not file registry; conflating
  risks pollution
- T28 has no file-watching
- T28's 7 edge types designed for research provenance, not file-dependency edges
  — retrofit is schema design challenge

**Recommendation:** Lower-risk path than Option B. Builds on T28 (actively
maintained). Portability metadata is natural T28 extension. Dependency edges can
be added incrementally.

---

## Alt 8: Git Blob SHA Equality for Retroactive Copy Detection [MEDIUM]

**Type:** inverted

**What:** Research Gap 2: "no tool tracks copies between projects." Research
framed as forward-registration problem. Inversion: detect copies retroactively
via `git ls-files -s` across all JASON-OS repos, build SHA-to-[project,path]
inverted index.

SHA divergence between instances = "this portable skill was updated in one
project but not others."

**Pros:**

- Retroactive — works on existing repos today
- SHA equality proves identity, divergence proves drift
- Node.js can spawn `git ls-files -s` via child_process
- 50-line script, 1-day build

**Cons:**

- Only git-tracked files
- Any content change breaks SHA link (no fuzzy matching)
- No upstream/downstream edges — only same/diverged relationships
- Requires simultaneous access to all project git repos

**Recommendation:** Build `scripts/cas/detect-portable-copies.js` as standalone
diagnostic. Directly solves Gap 2 without new infrastructure. Complementary to
whatever Option chosen. Store blob SHA at classification time to enable future
divergence detection.

---

## Net Assessment Against Option B

- **Alt 2 + Alt 1 + Alt 3 together are a complete alternative to Option B** for
  the tag-filter + portability identification use cases — zero new
  infrastructure.
- **Alt 7 is a lower-risk architectural path** than Option B if the graph is
  actually needed.
- **Alt 8 directly solves Gap 2** (cross-project copy detection) without any new
  infrastructure dependency.
- **Alt 6** (chezmoi for propagation) fills a gap Option B doesn't address:
  "push universal skill updates to all projects."

If the research team adopted Alts 2+1+3+8 immediately and deferred the graph
decision for 2-4 weeks pending demonstrated need, Option B's complexity and
@optave/codegraph risk would be avoided entirely — while delivering most of the
value.
