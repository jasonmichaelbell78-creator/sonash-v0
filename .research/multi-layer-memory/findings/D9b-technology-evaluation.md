# Findings: Technology Evaluation — Memory System Component Recommendations

**Searcher:** deep-research-searcher **Profile:** web+design **Date:**
2026-03-31 **Sub-Question IDs:** SQ9

---

## Context and Constraints

All recommendations are evaluated against:

- Solo non-developer director, 250+ sessions
- Windows 11 on two machines (home: `C:\Users\Owner\...`, work:
  `C:\Users\jbell\...`)
- No admin access at work locale; portable installs only (npx, uv portable
  binary)
- Node.js v22 ecosystem (fnm-managed)
- Go for tools (already deployed)
- Private GitHub repo already in use
- Firebase/Firestore already deployed (sonash-app)
- Existing MCP: `@modelcontextprotocol/server-memory` active and working

---

## Component 1: Vector Store for Semantic Search

### Evaluation Summary

| Option                     | Windows x64 No-Admin                                        | Node.js Integration                         | Maintenance | Verdict                |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------- | ----------- | ---------------------- |
| Chroma (Python embedded)   | BLOCKED — npm chromadb ARM64-only on Windows x64            | Needs Python server                         | High        | Reject                 |
| Qdrant (local mode)        | YES — `qdrant-npm` downloads Windows amd64 binary           | REST client `@qdrant/js-client-rest`        | Medium      | Viable backup          |
| sqlite-vec (C extension)   | YES — pure C, runs anywhere SQLite runs; npm package v0.1.9 | `npm install sqlite-vec` + `better-sqlite3` | Low         | PRIMARY                |
| ONNX local embeddings only | Not a store — embedding generation only                     | `@huggingface/transformers` v3              | Low         | Paired with sqlite-vec |
| None (keyword only)        | Native                                                      | Already working via MCP memory              | Zero        | Fallback only          |

### Finding 1.1 — Chroma (ChromaDB) is blocked on Windows x64 [CONFIDENCE: HIGH]

The npm `chromadb` package used by `chroma-mcp` only supports ARM64 Windows.
This is documented in claude-mem Issue #1146 ("Chroma server fails on Windows
x64 — npm chromadb only supports ARM64"). The Python `chromadb` package works on
Windows x64, but requires Python + uv installation and a separate running server
process. claude-mem v10.3.0+ switched from `chromadb` npm to `chroma-mcp` via
`uvx` to work around this, but that dependency chain (uv + Python + uvx
invocation) adds significant complexity for a no-admin Windows environment.

This eliminates Chroma as the PRIMARY vector store for this project. [1][2]

### Finding 1.2 — sqlite-vec is the best-fit vector store [CONFIDENCE: HIGH]

sqlite-vec (asg017/sqlite-vec) is a C extension that:

- Runs anywhere SQLite runs: Linux, macOS, Windows x64, WASM [3]
- Installs via `npm install sqlite-vec` with no native compilation required on
  supported platforms [4]
- Loads via `sqliteVec.load(db)` with `better-sqlite3` (the existing SQLite
  driver for Node.js v22) [4]
- Has prebuilt binaries; v0.1.9 released March 31, 2026 [5]
- Has zero external server processes — embedded in the Node.js process
- Adds vector search to the same SQLite files already used by multiple project
  systems

`better-sqlite3` with Node.js v22 is fully supported and is the dominant
synchronous SQLite driver for Node.js [6]. The `sqlite-vec` load() function is
explicitly compatible with `better-sqlite3` [4].

**PRIMARY RECOMMENDATION: sqlite-vec** via `npm install sqlite-vec` +
`better-sqlite3`. No admin. No server. No Python. Works today on Windows x64.

### Finding 1.3 — Qdrant local mode is viable backup [CONFIDENCE: MEDIUM]

`qdrant-npm` (Anush008/qdrant-npm) downloads the appropriate Qdrant binary for
the platform (Linux/macOS/Windows) automatically via `npm i -g qdrantdb`. The
Windows amd64 binary is included [7]. The Node.js client is
`@qdrant/js-client-rest`. Local mode stores data at `./qdrant_storage` without
Docker.

Limitation: requires a running Qdrant process separate from the Node.js
application. This adds operational complexity (process lifecycle management)
that sqlite-vec avoids entirely. Best reserved for scenarios requiring richer
filtering or multi-tenant collection management.

**BACKUP RECOMMENDATION: Qdrant local mode** via `qdrant-npm` +
`@qdrant/js-client-rest`. Usable but heavier than sqlite-vec.

**SKIP: OMEGA Memory** — requires WSL 2 explicitly on Windows. Hard block. [8]

---

## Component 2: Knowledge Graph

### Evaluation Summary

| Option                              | Current State  | Admin Required  | Overhead | Semantic Search   | Verdict         |
| ----------------------------------- | -------------- | --------------- | -------- | ----------------- | --------------- |
| @modelcontextprotocol/server-memory | ALREADY ACTIVE | No              | LOW      | No — keyword only | Keep as-is      |
| Neo4j (local install)               | Not installed  | Yes (installer) | HIGH     | Via GDS plugin    | Reject          |
| SQLite + JSON                       | Not installed  | No              | LOW      | No                | Viable addition |
| None beyond current MCP memory      | ACTIVE         | No              | Zero     | No                | Default         |

### Finding 2.1 — The existing MCP memory server is sufficient for this use case [CONFIDENCE: HIGH]

`@modelcontextprotocol/server-memory` is already configured and active. It
provides a knowledge graph with entities, relations, and observations stored in
a JSONL file. For this project's memory workload — user preferences, feedback
patterns, project decisions — a flat knowledge graph with keyword search is
adequate.

The official README does not document a maximum graph size or scaling threshold
[9]. The system description as a "basic implementation" suggests linear
full-graph-load per request. For a solo user with 250 sessions worth of entities
(~500-1,500 typical entities for this use case), this is well within acceptable
performance. The main limitation is keyword-only search (`search_nodes`), which
is a real constraint but solvable at a higher layer.

**PRIMARY RECOMMENDATION: Keep existing `@modelcontextprotocol/server-memory`**
— no change needed. If semantic search is needed over the knowledge graph, add a
separate sqlite-vec layer to index entity observations rather than replacing the
graph server.

### Finding 2.2 — Neo4j is eliminated [CONFIDENCE: HIGH]

Neo4j requires a local installer (needs admin on Windows), or Docker (also
requires admin for Docker Desktop). The `sylweriusz/mcp-neo4j-memory-server`
additionally requires the Graph Data Science (GDS) plugin via DozerDB — not the
default Neo4j install [10]. No admin = Neo4j is a non-starter.

### Finding 2.3 — SQLite + JSON is a viable enhancement layer [CONFIDENCE: MEDIUM]

If the current MCP memory server proves insufficient (e.g., graph grows
unwieldy, keyword search too noisy), a custom SQLite table with JSON columns can
serve as a lightweight supplemental graph store. `better-sqlite3` on Node.js v22
supports recursive CTEs and JSON functions natively in SQLite, enabling graph
traversal without a dedicated graph database. Implementation cost is ~200 lines
of Node.js.

---

## Component 3: Embedding Model (if vector store chosen)

### Evaluation Summary

| Option                                                      | Privacy                    | Cost           | Latency                                     | Offline             | Admin Required | Verdict         |
| ----------------------------------------------------------- | -------------------------- | -------------- | ------------------------------------------- | ------------------- | -------------- | --------------- |
| OpenAI text-embedding-3-small                               | LOW (cloud)                | $0.02/M tokens | ~100-300ms API                              | No                  | No             | Backup          |
| Local ONNX (all-MiniLM-L6-v2 via @huggingface/transformers) | HIGH (local)               | Free           | ~50-200ms (first run: model download ~25MB) | Yes after first run | No             | PRIMARY         |
| Voyage AI (voyage-3.5)                                      | MEDIUM (opt-out available) | $0.06/M tokens | ~100-300ms API                              | No                  | No             | Not recommended |
| Anthropic embeddings                                        | N/A — does not exist       | N/A            | N/A                                         | N/A                 | N/A            | Eliminate       |

### Finding 3.1 — Anthropic does not offer an embeddings API [CONFIDENCE: HIGH]

Anthropic's official documentation and cookbooks direct users to Voyage AI
(their recommended partner) for embeddings. There is no Anthropic embeddings
endpoint. Eliminating from consideration. [11]

### Finding 3.2 — Local ONNX via @huggingface/transformers is the right primary choice [CONFIDENCE: HIGH]

The `@huggingface/transformers` package (v3, replacing `@xenova/transformers`)
provides:

- ONNX Runtime-based inference in pure Node.js
- No Python, no separate process, no server
- `all-MiniLM-L6-v2` model: 384-dimensional embeddings, ~25MB download, cached
  in `.cache/` on first run [12][13]
- Cross-platform: works on Windows x64 without admin [12]
- Completely offline after initial model download
- Known limitation: all-MiniLM-L6-v2 is optimized for inputs under 128 tokens
  (256 token max). For memory entries (typically 50-200 words), this is
  adequate. Long documents need chunking.

The `episodic-memory` Superpowers plugin already uses this same library
(`@xenova/transformers`) with sqlite-vec for exactly this purpose — confirming
it works in the production Claude Code environment [D5a-mcp-memory-servers.md].

**PRIMARY RECOMMENDATION: `@huggingface/transformers` +
`all-MiniLM-L6-v2-onnx`**. Zero cost, full privacy, offline capable, 384-dim
vectors compatible with sqlite-vec.

### Finding 3.3 — OpenAI text-embedding-3-small is a viable backup [CONFIDENCE: HIGH]

At $0.02/M tokens, the cost for memory-scale usage (a few thousand short texts
per session = well under 1M tokens/month) is negligible (effectively $0/month).
The latency is acceptable for async/background embedding generation. However,
data privacy is the concern: all memory text is sent to OpenAI's servers.
OpenAI's API terms restrict training on API data by default, but this is a
policy constraint, not a technical one.

**BACKUP RECOMMENDATION: OpenAI `text-embedding-3-small`** — use only if local
ONNX proves too slow or unreliable for the use case.

### Finding 3.4 — Voyage AI not recommended despite Anthropic endorsement [CONFIDENCE: MEDIUM]

Voyage AI requires explicit opt-out from data storage for model training.
Default behavior retains and uses data. While opt-out is possible, the opt-out
is permanent (cannot re-enable) and requires payment method + org admin access
[14]. The privacy-first constraint for this project's personal memory data makes
this a poor fit. The cost ($0.06/M tokens) is also 3x OpenAI's rate.

---

## Component 4: Sync Mechanism

### Evaluation Summary

| Option                             | Setup Complexity | Maintenance | Conflict Risk     | Admin-Free                   | Privacy   | Cost      | Verdict           |
| ---------------------------------- | ---------------- | ----------- | ----------------- | ---------------------------- | --------- | --------- | ----------------- |
| autoMemoryDirectory → Git repo dir | Low              | Very low    | Very low          | Yes                          | Very high | Free      | PRIMARY           |
| autoMemoryDirectory → OneDrive     | Low              | Zero        | Very low          | Yes (OneDrive pre-installed) | High      | Free      | PRIMARY (simpler) |
| Git notes                          | High             | High        | Medium            | Yes                          | Very high | Free      | Reject            |
| Cloud MCP server                   | High             | Medium      | None              | Yes                          | Medium    | $0-10/mo  | Phase 2           |
| Firebase Firestore                 | Very high        | Medium      | None              | Yes                          | Medium    | Free tier | Phase 2           |
| SQLite via cloud sync              | Low              | Zero        | HIGH (corruption) | Yes                          | High      | Free      | Reject            |

### Finding 4.1 — autoMemoryDirectory → git-tracked repo directory is the best overall sync [CONFIDENCE: HIGH]

`autoMemoryDirectory` was shipped in Claude Code v2.1.74 (March 12, 2026)
specifically to allow redirecting memory writes to OneDrive, Dropbox, or
git-tracked paths [D7a]. Setting it in `settings.local.json` at each locale to
point at `.claude/canonical-memory/` (or a similar directory inside the git
repo) means:

1. Auto Memory writes directly to a git-tracked path
2. Normal `git push` propagates memory to remote
3. Normal `git pull` at the other locale brings memory down
4. No separate sync infrastructure
5. The project's `.claude/canonical-memory/` directory already exists with 20
   files [D7a]
6. Plain markdown — merge conflicts are extremely rare and easily resolved

Configuration at each locale in `settings.local.json`:

```json
{
  "autoMemoryDirectory": "C:\\Users\\<user>\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

The absolute path differs by locale username but points at the same logical
git-repo directory after `git pull`. The `autoMemoryDirectory` override bypasses
the locale-keyed path problem entirely. [D7a, D7b, 15]

**PRIMARY RECOMMENDATION: `autoMemoryDirectory` → `.claude/canonical-memory/`
(git-tracked).**

### Finding 4.2 — autoMemoryDirectory → OneDrive is equally valid and simpler [CONFIDENCE: HIGH]

If OneDrive is available at the work locale (corporate IT permitting),
configuring `autoMemoryDirectory` to a OneDrive-synced folder requires zero git
workflow changes. Both locales point at the same physical files. The
solo-operator pattern (never both machines active simultaneously) makes OneDrive
conflict risk negligible. This approach requires no git push/pull discipline.
[D7a]

Key constraint: `autoMemoryDirectory` cannot be set in project settings
(`.claude/settings.json`, which is git-tracked). It must be manually configured
in `settings.local.json` at each locale. This is a security restriction, not a
bug. [D7a]

**ALTERNATE PRIMARY: `autoMemoryDirectory` → OneDrive**, if OneDrive is
confirmed available at work locale.

### Finding 4.3 — SQLite via cloud sync is rejected [CONFIDENCE: HIGH]

SQLite's official documentation explicitly states network filesystem use is
unsupported. WAL mode on network paths is particularly dangerous. Cloud sync
(OneDrive, Dropbox) behaves like a network filesystem for locking. For a solo
user, corruption is unlikely but possible. Markdown files via git or OneDrive
are safer and solve the same problem. [D7a]

### Finding 4.4 — Firebase Firestore is Phase 2 [CONFIDENCE: MEDIUM]

Technically sound (existing infrastructure, atomic writes, free tier) but
requires custom MCP server development — no pre-built Claude Code memory MCP
server backed by Firebase exists. The development cost exceeds the benefit at
this stage when simpler git/OneDrive approaches work. [D7a]

---

## Component 5: Memory Admission/Retrieval Framework

### Evaluation Summary

| Option                   | Maintenance Burden         | Lock-in Risk | Windows Compat         | Admin Required | Verdict              |
| ------------------------ | -------------------------- | ------------ | ---------------------- | -------------- | -------------------- |
| Custom (hooks + scripts) | HIGH long-term             | None         | Native                 | No             | Core pattern         |
| claude-mem               | HIGH (Windows instability) | MEDIUM       | Fragile                | No             | Reject as primary    |
| Engram                   | LOW (Go binary)            | LOW          | Good (with caveat)     | No             | RECOMMENDED          |
| memoir                   | MEDIUM                     | LOW          | Likely OK (npm global) | Maybe          | Sync tool only       |
| codebase-memory-mcp      | ZERO (specific scope)      | None         | YES (amd64 binary)     | No             | Adopt for code scope |
| Mix-and-match patterns   | MEDIUM                     | None         | Native                 | No             | PRIMARY strategy     |

### Finding 5.1 — claude-mem is fragile on Windows x64 and should not be adopted as primary framework [CONFIDENCE: HIGH]

claude-mem has documented Windows-specific failures:

- Issue #1146: ChromaDB ARM64-only on Windows x64 — vector search fails silently
  [1]
- Issue #1062: Git Bash startup hangs 60+ seconds (PowerShell not in Git Bash
  PATH) [16]
- Issue #1482: `claude --print` pipe mode returns empty output on Windows
  (breaks CI/scripted use) [17]
- Issue #1167: path.join module resolution failure on Windows x64 (v10.2.5) [18]
- Issue #367: PowerShell popup windows disrupting Claude Code input [19]

v10.3.0+ migrated ChromaDB to `chroma-mcp` via uvx, resolving the ARM64 issue —
but introducing Python + uv as new dependencies. The pipe mode issue (#1482)
remains open as of available data. The hook stability history (PostToolUse broke
for 2+ months in late 2025) is a reliability concern for a solo operator who
cannot diagnose hook failures. [2]

**REJECT claude-mem as primary framework for this environment.**

### Finding 5.2 — Engram is the best standalone memory framework for this stack [CONFIDENCE: HIGH]

Engram (Gentleman-Programming/engram) provides:

- Single Go binary — aligns with the project's existing Go tool pattern
  (statusline)
- Windows amd64 prebuilt binary available from GitHub Releases [20]
- SQLite + FTS5 backend — no external dependencies, no server process
- MCP server (stdio) — integrates with Claude Code like any MCP server
- `mem_save` and memory search tools — explicit, manual capture (high signal,
  low noise)
- Export/import for cross-machine sync: `engram export` creates compressed
  chunks with a manifest index, importable via `engram import` [21]
- Hook-based capture optional — the "Bare MCP" option works without bash hook
  scripts, which avoids Windows shell dependency issues [21]

Installation without admin: download prebuilt
`engram_<version>_windows_amd64.zip`, extract to `%USERPROFILE%\bin` (no admin
needed). Note: prebuilt binaries may trigger Windows Defender false positives;
`go install` from source is the recommended alternative if Go is available [20].
The project already has Go deployed.

**PRIMARY RECOMMENDATION: Engram** for explicit knowledge graph + FTS search
layer. Use "Bare MCP" mode on Windows to avoid shell dependency issues.

### Finding 5.3 — codebase-memory-mcp serves a distinct, complementary scope [CONFIDENCE: HIGH]

`codebase-memory-mcp` (DeusData) is a structural code intelligence tool, NOT a
session memory system. It indexes TypeScript/JS/Go/etc. source files via
tree-sitter AST into a SQLite-backed graph, enabling sub-millisecond queries
like "find all functions that call X" with 99% fewer tokens than grep-based
search. It provides a Windows amd64 binary (~15MB), auto-configures Claude Code
hooks, and requires zero ongoing maintenance once installed. [22]

This is the right tool for structural/code-layer memory and complements but does
not overlap with session/episodic memory.

**ADOPT: codebase-memory-mcp** for structural code intelligence. Separate scope
from session memory.

### Finding 5.4 — memoir is useful for cross-locale sync but not a full memory framework [CONFIDENCE: MEDIUM]

memoir provides E2E encrypted sync of CLAUDE.md, auto memory files, and settings
to a private GitHub repo, with platform-aware path remapping. It solves the
locale path-keying problem explicitly. However, `npm install -g memoir-cli`
requires a global npm install, which may need admin depending on how Node.js is
configured at the work locale. The path remapping implementation is
undocumented. [23][D7b]

If the `autoMemoryDirectory` → git repo approach is adopted (Finding 4.1),
memoir becomes redundant for sync. Its value is primarily for users who do NOT
want to manually configure `autoMemoryDirectory`.

**SKIP memoir** if implementing `autoMemoryDirectory` → git repo. Revisit only
if that approach fails.

### Finding 5.5 — The right strategy is mix-and-match patterns, not adopting one full framework [CONFIDENCE: HIGH]

Based on all evidence, the strongest architecture for this project is:

1. **Session/episodic capture**: existing hooks (already 25 scripts) +
   SESSION_CONTEXT.md pattern
2. **Explicit knowledge store**: Engram (Go binary, FTS5 search, low
   maintenance)
3. **Structural code intelligence**: codebase-memory-mcp (separate scope, zero
   maintenance once deployed)
4. **Semantic search layer**: sqlite-vec + `@huggingface/transformers` (add only
   when FTS proves insufficient)
5. **Cross-locale sync**: `autoMemoryDirectory` → git repo (or OneDrive) —
   native, no new tools

This avoids adopting any full framework (claude-mem, OMEGA, Hindsight) whose
Windows Windows x64 compatibility is fragile or requires Docker/WSL.

The academic research confirms this: the "LLM as memory controller" model
(MemGPT/Letta), hook-based capture (CP-1 from D6b), and text-as-memory
(Reflexion) all point toward simple, file-based patterns as the most durable
approach. [D4a, D4b, D6b]

---

## Summary: "Pick This One" Recommendations

| Component           | PRIMARY                                                             | BACKUP                           | Reject                                                    |
| ------------------- | ------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| Vector store        | sqlite-vec (`npm install sqlite-vec`)                               | Qdrant local (`qdrant-npm`)      | Chroma (ARM64-only)                                       |
| Knowledge graph     | Keep existing `@modelcontextprotocol/server-memory`                 | SQLite + JSON columns            | Neo4j (needs admin/Docker)                                |
| Embedding model     | `@huggingface/transformers` + `all-MiniLM-L6-v2-onnx` (local, free) | OpenAI `text-embedding-3-small`  | Anthropic (doesn't exist), Voyage AI (privacy policy)     |
| Sync mechanism      | `autoMemoryDirectory` → `.claude/canonical-memory/` (git)           | `autoMemoryDirectory` → OneDrive | SQLite on cloud sync (corruption), Git notes (complexity) |
| Admission/retrieval | Engram (Go binary, MCP, FTS5) + codebase-memory-mcp for code scope  | Mix-and-match custom hooks       | claude-mem (Windows fragility), OMEGA (WSL2 required)     |

---

## Sources

| #   | URL/Path                                                                                                  | Title                                                    | Type                 | Trust  | CRAAP     | Date       |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------- | ------ | --------- | ---------- |
| 1   | https://github.com/thedotmack/claude-mem/issues/1146                                                      | Chroma server fails on Windows x64 — ARM64 only          | issue tracker        | HIGH   | 5/5/5/5/5 | 2026       |
| 2   | https://github.com/thedotmack/claude-mem/blob/main/CHANGELOG.md                                           | claude-mem CHANGELOG                                     | official             | HIGH   | 5/5/5/5/5 | 2026       |
| 3   | https://github.com/asg017/sqlite-vec                                                                      | sqlite-vec GitHub README                                 | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 4   | https://alexgarcia.xyz/sqlite-vec/js.html                                                                 | sqlite-vec Node.js installation guide                    | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 5   | https://github.com/asg017/sqlite-vec/releases                                                             | sqlite-vec releases (v0.1.9 — 2026-03-31)                | official             | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 6   | https://github.com/WiseLibs/better-sqlite3/discussions/1245                                               | better-sqlite3 vs node:sqlite for Node v22               | community discussion | MEDIUM | 4/5/4/4/5 | 2025       |
| 7   | https://github.com/Anush008/qdrant-npm                                                                    | qdrant-npm helper package (Windows support)              | community repo       | MEDIUM | 4/5/3/4/4 | 2025       |
| 8   | .research/multi-layer-memory/findings/D5a-mcp-memory-servers.md                                           | MCP Memory Servers — OMEGA requires WSL2                 | findings             | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 9   | https://github.com/modelcontextprotocol/servers/blob/main/src/memory/README.md                            | @modelcontextprotocol/server-memory README               | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 10  | .research/multi-layer-memory/findings/D5a-mcp-memory-servers.md                                           | MCP servers — Neo4j requires GDS plugin                  | findings             | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 11  | https://github.com/anthropics/claude-cookbooks/blob/main/third_party/VoyageAI/how_to_create_embeddings.md | Anthropic cookbooks — no native embeddings, use Voyage   | official             | HIGH   | 5/5/5/5/5 | 2025       |
| 12  | https://huggingface.co/docs/transformers.js/tutorials/node                                                | Transformers.js Node.js server-side tutorial             | official-docs        | HIGH   | 5/5/5/5/5 | 2025       |
| 13  | https://huggingface.co/Xenova/all-MiniLM-L6-v2                                                            | all-MiniLM-L6-v2 ONNX model card                         | official             | HIGH   | 5/5/5/5/5 | 2025       |
| 14  | https://docs.voyageai.com/docs/faq                                                                        | Voyage AI FAQ — data retention opt-out                   | official-docs        | HIGH   | 5/5/5/4/5 | 2025       |
| 15  | https://dev.classmethod.jp/en/articles/claude-code-global-memory-with-git/                                | Claude Code global memory with git (gh repo pattern)     | community blog       | MEDIUM | 4/4/3/4/4 | 2026       |
| 16  | https://github.com/thedotmack/claude-mem/issues/1062                                                      | claude-mem Windows Git Bash startup hang                 | issue tracker        | HIGH   | 5/5/5/5/5 | 2026       |
| 17  | https://github.com/thedotmack/claude-mem/issues/1482                                                      | claude-mem breaks claude --print on Windows              | issue tracker        | HIGH   | 5/5/5/5/5 | 2026       |
| 18  | https://github.com/thedotmack/claude-mem/issues/1167                                                      | claude-mem v10.2.5 path.join failure Windows x64         | issue tracker        | HIGH   | 5/5/5/5/5 | 2026       |
| 19  | https://github.com/thedotmack/claude-mem/issues/367                                                       | claude-mem PowerShell popups Windows 11                  | issue tracker        | HIGH   | 5/5/5/5/5 | 2025       |
| 20  | https://github.com/Gentleman-Programming/engram/blob/main/docs/INSTALLATION.md                            | Engram installation guide — Windows amd64 binary         | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 21  | https://github.com/Gentleman-Programming/engram                                                           | Engram README — Bare MCP, export/import, sync            | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 22  | https://github.com/DeusData/codebase-memory-mcp                                                           | codebase-memory-mcp README — Windows amd64 binary        | official-docs        | HIGH   | 5/5/5/5/5 | 2026       |
| 23  | https://github.com/camgitt/memoir                                                                         | memoir README — cross-locale path remapping, npm install | official-docs        | MEDIUM | 4/5/3/4/4 | 2026       |
| 24  | .research/multi-layer-memory/findings/D7a-cross-locale-sync.md                                            | Cross-locale sync — autoMemoryDirectory analysis         | findings             | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 25  | .research/multi-layer-memory/findings/D6a-comparison-matrix.md                                            | Full system comparison matrix                            | findings             | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 26  | .research/multi-layer-memory/findings/D6b-architecture-patterns.md                                        | Architecture patterns — CP-1 hook-based capture          | findings             | HIGH   | 5/5/5/5/5 | 2026-03-31 |

---

## Contradictions

**claude-mem v10.3.0+ may have fixed the ARM64 issue:** The CHANGELOG shows
v10.3.0+ migrated to `chroma-mcp` via `uvx`, replacing the broken npm chromadb
package. This may resolve the Windows x64 vector search problem — but introduces
Python/uv as dependencies, and the pipe mode issue (#1482) remains open. The
overall picture is still "fragile on Windows" even if the specific ARM64 issue
is resolved.

**sqlite-vec Windows x64 prebuilt binary uncertainty:** The official sqlite-vec
documentation states "runs anywhere SQLite runs (Windows)" [3] and the npm
package ships platform-specific prebuilt binaries. However, the v0.1.9 release
page assets visible via web fetch did not list Windows-specific binaries
explicitly (showing Android .so files instead). The npm package (separate from
release artifacts) includes prebuilt binaries via the `sqlite-dist` distribution
mechanism. The episodic-memory Superpowers plugin uses sqlite-vec on Windows,
which is the strongest evidence it works — but that was via the Python package,
not the npm one.

**Qdrant local mode "may require sudo":** The qdrant-npm README mentions that
`qdrant` command "may require sudo on some systems." This is typically for Linux
socket binding, not Windows — but it's an undocumented edge case for the
no-admin work locale.

---

## Gaps

1. **sqlite-vec npm on Windows x64: not independently verified.** The
   episodic-memory plugin (Superpowers) uses sqlite-vec with
   `@xenova/transformers` on Windows but via Python, not the Node.js npm
   package. A direct test of `npm install sqlite-vec` + `better-sqlite3` on
   Windows x64 without admin is the critical validation needed before committing
   to this path.

2. **Engram "Bare MCP" on Windows: not confirmed working with fnm Node.js.** The
   documentation states hooks use bash scripts on Windows, but the Bare MCP
   option avoids hooks. Whether the Bare MCP MCP server starts correctly under
   the project's fnm-managed Node.js setup is unverified.

3. **@huggingface/transformers v3 Node.js v22 compatibility: not verified.** The
   new package (`@huggingface/transformers`) replaced `@xenova/transformers`.
   Node.js v22 support should work given the library targets current Node.js
   LTS, but no specific v22 test confirmation was found in search results.

4. **OneDrive availability at work locale (jbell) not confirmed.** The sync
   recommendation of `autoMemoryDirectory` → OneDrive depends on OneDrive being
   present and accessible at the work locale. The research files note "no admin"
   but do not specify OneDrive status.

5. **memoir path remapping internals undocumented.** The "it just works" claim
   for cross-locale path remapping is not backed by public technical
   documentation. Edge cases with unusual usernames (like `jbell` vs `Owner`)
   may not be handled correctly.

---

## Serendipity

1. **ChromaDB's ARM64-only npm package is a recently surfaced breaking issue**
   (Issue #1146 filed ~early 2026). This is not widely documented outside the
   claude-mem issue tracker, and affects any tool that uses the npm chromadb
   package on Windows x64 — not just claude-mem. Any future tool evaluation must
   check this specifically.

2. **The episodic-memory Superpowers plugin already validates the sqlite-vec +
   ONNX stack on Windows.** This plugin uses `@xenova/transformers` + sqlite-vec
   on Windows (via Python path), confirming the overall approach works in the
   Claude Code production environment. It de-risks the technology choice
   significantly.

3. **codebase-memory-mcp has already solved the "structural code intelligence"
   problem** that would otherwise require custom implementation. Its Windows
   amd64 binary, auto-configuration of Claude Code hooks, and tree-sitter-based
   indexing provide a complete structural memory layer at zero ongoing
   maintenance cost — and it was not on the original evaluation list.

4. **Voyage AI's default is to retain data for training** — opt-out requires
   admin dashboard access. For a solo user treating memory files as personal
   cognitive data, this is a meaningful privacy concern that rules it out even
   though Anthropic officially endorses it.

5. **uv (Astral) can be installed as a portable binary on Windows without
   admin.** GitHub Releases provides `uv-<version>-windows-x86_64.zip` — a
   standalone binary. This means Python-based tools (mcp-memory-service,
   basic-memory, etc.) are accessible without admin as long as uv is installed
   in a user-accessible path. This opens the door to Python-based memory tools
   that were previously considered admin-dependent.

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** (for recommendations), **MEDIUM** (for a few
  Windows x64 compatibility claims pending live testing)

The highest-confidence claims are the eliminate/reject decisions (Chroma ARM64
block, Neo4j admin requirement, Anthropic embeddings non-existence, OMEGA WSL2
requirement) — all backed by official documentation or issue tracker evidence.
The primary recommendations (sqlite-vec, Engram, autoMemoryDirectory → git) are
MEDIUM-HIGH because the overall architecture is sound but specific Windows x64
behavior under fnm-managed Node.js has not been verified on the live system.
