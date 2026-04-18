# D6: Change-Detection Infrastructure — Findings

_Captured from task-notification result per Critical Rule #4 (Windows agent
output fallback). Agent completed research but did not write the file itself._

**Searcher:** deep-research-searcher **Profile:** web + codebase **Date:**
2026-04-17 **Sub-question:** Change-detection infrastructure — chokidar,
watchman, fsnotify, MCP filesystem servers, git-hooks-based approaches. What's
reusable for cross-project graph re-index?

---

## Summary

The SoNash codebase has **no real-time file watcher** in place. Change detection
is entirely on-demand (session-start hook + manual npm scripts). The CAS index
rebuilds on explicit CLI invocation only. The strongest cross-platform option
for a self-updating registry is **`@parcel/watcher`** (native, daemon-optional,
snapshot API). **Chokidar v5** is the lowest-friction install. The official MCP
filesystem server has zero watching capability; the only viable MCP watcher is a
community server with low adoption. Git hooks provide a reliable but
latency-bound complement for tracked files.

---

## Home Codebase Probe (SoNash)

**C-D6-HOME-1 — No chokidar dependency anywhere** [HIGH]
`grep -ril chokidar package.json .claude/ scripts/` returned no matches.

**C-D6-HOME-2 — No fs.watch / fs.watchFile usage in scripts/** [HIGH]
`grep -rn "chokidar\|fs\.watch\|watchFile" scripts/` returned zero. No real-time
watchers.

**C-D6-HOME-3 — CAS index is on-demand only; no watch trigger exists** [HIGH]
`scripts/cas/rebuild-index.js` is idempotent full rebuild from `.research/`
files. `scripts/cas/update-index.js` is per-slug incremental sync. No
scheduling, watch, cron, or event-trigger logic.

**C-D6-HOME-4 — session-start.js uses content-hash change detection for
package-lock.json** [HIGH] `.claude/hooks/session-start.js` lines 277-392
computes SHA hashes of `package-lock.json` and `functions/package-lock.json`,
stores them in `.claude/.lockfile-hash` and `.claude/.functions-lockfile-hash`.
On next start, re-computes and skips npm install if unchanged. Only
content-hash-based change detection in the project — scoped to lockfiles.

**C-D6-HOME-5 — No hooks fire on file-change events; all hooks fire on tool-use
events** [HIGH] 20+ hooks; all are Claude tool-use hooks (`PostToolUse`,
`PreToolUse`, `UserPromptSubmit`). `post-write-validator.js` validates files
after Claude writes them but triggers from the tool call, not OS filesystem
events.

**C-D6-HOME-6 — No watch-mode npm script** [HIGH] 110 scripts reviewed; zero
`watch`, `dev:watch`, `cas:watch` equivalents. Only watch-adjacent concept is
Next.js dev server (implicit).

---

## Per-Candidate Analysis

### 1. Chokidar v5 (paulmillr/chokidar)

**C-D6-001 — Chokidar v5 is ESM-only, Node 20+ required** [HIGH] v5 (Nov 2025)
dropped CJS. v4 (Sept 2024) supports both ESM + CJS, Node 14+. For SoNash (mixed
CJS scripts), v4 is safer unless registry daemon is isolated as ESM. Source:
[GitHub README](https://github.com/paulmillr/chokidar/blob/main/README.md),
[DEV.to migration guide](https://dev.to/43081j/migrating-from-chokidar-3x-to-4x-5ab5)

**C-D6-002 — Chokidar uses fs.watch internally; Windows works but spurious
events documented** [MEDIUM] Node.js
[issue #6771](https://github.com/nodejs/node/issues/6771): fs.watch fires false
change events on Windows. v4 changelog adds no Windows-specific dedup. For
idempotent reindex use case, spurious events cause unnecessary rebuilds but no
corruption.

**C-D6-003 — Multi-root watching: yes, pass array of paths** [HIGH]
`chokidar.watch(['/proj-a', '/proj-b', '/proj-c'])`. Single process watches
arbitrary paths on disparate drives. Process-scoped — daemon must stay running.

**C-D6-004 — v4 removes glob support; v5 adds no glob back** [HIGH] Watch
targets must be explicit paths. For known project roots, not a limitation.
Source: [npm page](https://www.npmjs.com/package/chokidar)

| Criterion                  | Chokidar                                             |
| -------------------------- | ---------------------------------------------------- |
| Windows support            | Yes, via fs.watch — spurious events possible         |
| Node.js integration        | Native npm, no native binaries                       |
| Cross-project / multi-root | Yes — pass array of paths                            |
| Performance at 1000+ files | EMFILE risk; no per-process inotify limit on Windows |
| SQLite-MCP integration     | Manual: on event → run `update-index.js`             |
| Solo-dev op cost           | No daemon required; dies with terminal session       |

### 2. Watchman (facebook/watchman)

**C-D6-005 — Windows support official but via named pipes** [HIGH] Installable
via Chocolatey (`watchman-v2025.02.24.00-windows.zip`). Uses named pipes on
Windows (not unix sockets). `fb-watchman` npm package provides Node.js client.
Source:
[Chocolatey package](https://community.chocolatey.org/packages/watchman),
[Windows support wiki](https://github.com/facebook/watchman/wiki/Changes-required-for-Windows-support)

**C-D6-006 — Requires persistent system daemon; significant operational
overhead** [HIGH] Background service. On Windows, not a Windows Service by
default — auto-starts on first use. For solo dev: must be running before queries
work, survives reboots only with manual service registration, needs
`watchman watch-del-all` for cleanup. For JASON-OS portability goal, requiring
Watchman on every machine adds friction.

**C-D6-007 — Highest-performance backend for large trees** [MEDIUM] Subscription
model avoids filesystem traversal entirely for trees of 10,000+ files.

| Criterion                  | Watchman                                           |
| -------------------------- | -------------------------------------------------- |
| Windows support            | Yes — named pipes, Chocolatey install              |
| Node.js integration        | Via `fb-watchman` npm client                       |
| Cross-project / multi-root | Yes — `watchman watch` any path                    |
| Performance at 1000+ files | Best-in-class, daemon caches all events            |
| SQLite-MCP integration     | Query via fb-watchman client → run update-index.js |
| Solo-dev op cost           | HIGH — daemon install + service management         |

### 3. Node.js Built-in fs.watch / fs.watchFile (Node 22)

**C-D6-008 — Node 22 stabilized `--watch` mode (process restart), not fs.watch
API** [HIGH] `fs.watch()` reliability on Windows unchanged — spurious events,
inconsistent event types (`rename` vs `change`), fires on read-only access.
`fs.watchFile()` uses polling (default 5007ms), cross-platform reliable but
CPU-expensive at scale. Source:
[AppSignal Node.js 22 blog](https://blog.appsignal.com/2024/05/07/whats-new-in-nodejs-22.html),
[Node.js fs docs](https://nodejs.org/docs/latest/api/fs.html)

**C-D6-009 — fs.watch not recommended for production registry use on Windows**
[MEDIUM] mtime/mtimeMs "not completely reliable" cross-platform
(cross-platform-node-guide). `fs.watch` fires multiple events per write.

| Criterion                  | fs.watch/watchFile             |
| -------------------------- | ------------------------------ |
| Windows support            | Unreliable (spurious events)   |
| Node.js integration        | Built-in, zero deps            |
| Performance at 1000+ files | watchFile polling is expensive |
| Verdict                    | Prototype/fallback only        |

### 4. @parcel/watcher

**C-D6-010 — Strongest balanced choice: native, daemon-optional, snapshot API**
[HIGH] Uses `ReadDirectoryChangesW` on Windows (native OS API, not fs.watch).
Subscribe mode for real-time events; `getEventsSince(snapshotPath)` mode for
offline change detection (reads diff since last snapshot even when process was
not running). Snapshot mode directly solves cross-locale/session-start problem:
write snapshot at session-end, read diff at session-start. Source:
[parcel-bundler/watcher GitHub](https://github.com/parcel-bundler/watcher),
[npm](https://www.npmjs.com/package/@parcel/watcher)

**C-D6-011 — Windows `getEventsSince` without Watchman backend = brute-force
traversal** [HIGH] O(n) FindFirstFile traversal. 1000 files: <1s on SSD. 50,000+
files: install Watchman as backend.

**C-D6-012 — v2.5.1 Jan 2025; actively maintained; prebuilts for all Windows
archs** [HIGH] win32-x64, win32-arm64, win32-ia32. No compile step needed on
Windows.

| Criterion                  | @parcel/watcher                                                                |
| -------------------------- | ------------------------------------------------------------------------------ |
| Windows support            | Excellent — ReadDirectoryChangesW native                                       |
| Node.js integration        | Native bindings, prebuilt for win32-x64                                        |
| Cross-project / multi-root | Yes — multiple `subscribe()` calls                                             |
| Performance at 1000+ files | Good (subscribe), OK (getEventsSince without Watchman)                         |
| SQLite-MCP integration     | Snapshot at session-end → getEventsSince at session-start → batch update-index |
| Solo-dev op cost           | LOW — no daemon needed for basic use                                           |

### 5. MCP Filesystem Servers — Change Event Capability

**C-D6-013 — Official @modelcontextprotocol/server-filesystem has NO file
watching** [HIGH] 15 tools (read, write, search, metadata). Stateless. No
subscribe, no watch, no change notification. Source:
[Official MCP filesystem README](https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md)

**C-D6-014 — bsmi021/mcp-file-operations-server has watch + getChanges, low
adoption** [MEDIUM] `start_watching`, `stop_watching`, `get_changes` tools +
`file:///recent-changes` resource. v1.5 adds HTTP transport with SSE. But: 21
stars, 6 forks, 15 commits. Not production-ready for portability-critical
registry. `get_changes` requires Claude session to poll — no push from MCP
server during inactive session. Source:
[bsmi021/mcp-file-operations-server](https://github.com/bsmi021/mcp-file-operations-server)

**C-D6-015 — MCP protocol limitation: change events cannot push to Claude
between turns** [MEDIUM] MCP servers respond to client requests — not event
emitters that interrupt a Claude session. Practical pattern: external watcher
daemon writes to SQLite → Claude queries SQLite via MCP. Watcher and MCP are
separate layers.

### 6. Git Hooks Approach

**C-D6-016 — post-commit hook reliable for committed changes; misses untracked
files** [HIGH] `post-commit` runs after every commit. Hook can invoke
`node scripts/cas/update-index.js --slug=...`. SoNash already has
`commit-tracker.js` hook. But: (a) only sees files staged in that repo, (b)
untracked directories (e.g., `.research/` analysis files mid-session) missed
until committed, (c) cross-project: each project needs its own hook installed.

**C-D6-017 — SoNash session-start hook is closest to "on-change trigger"**
[HIGH] `session-start.js` runs at Claude Code session open: checks lockfile
hashes, runs npm install if changed, builds functions, checks patterns. Does NOT
scan for changed research files or trigger CAS reindex. CAS rebuild must be
triggered manually.

### 7. Content-Hash vs mtime vs Filesystem-Event

**C-D6-018 — Content-hash is most reliable cross-locale change detection**
[MEDIUM] mtime unreliable on Windows (changes on read, NFS mounts, git checkout
resets it). Filesystem events require running process. Content hash (SHA-256 or
xxHash) = ground truth. SoNash session-start already uses this for lockfiles.
Cost: O(n) read. 1000 files × ~1KB: ~50ms on SSD. Acceptable for session-start
gating.

### 8. Cross-Project Architecture Patterns

**C-D6-019 — Three viable patterns for cross-project registry watching**
[MEDIUM]

1. **Per-project daemon + shared SQLite**: each project root runs its own
   `@parcel/watcher` subscriber writing to shared SQLite DB at
   `~/jason-os/registry.db`. Simple, no IPC. Race risk on simultaneous writes —
   mitigate with WAL mode (intended pattern).

2. **Session-start snapshot scan** (**recommended**): at each session-open, run
   `@parcel/watcher.getEventsSince(lastSnapshot)` per configured project root.
   Write snapshot at session-end. No daemon. Matches existing session-start.js
   pattern. Works even if machine was offline for days.

3. **Git-hook push to shared registry**: `post-commit` in each project writes
   JSONL entry to `~/jason-os/change-log.jsonl`. Session-start script reads log
   and triggers re-index for affected projects. Committed changes only; misses
   mid-session file writes.

---

## Contradictions

- Watchman faster than @parcel/watcher on Windows for large trees, but
  @parcel/watcher's `getEventsSince` (without Watchman backend) is "brute
  force." However, @parcel/watcher can optionally use Watchman as backend if
  installed — not mutually exclusive.
- Chokidar v5 "ESM-only" stated by multiple sources but v4 npm page shows broad
  compatibility. For new code on Node 22, both v4 (dual) and v5 (ESM-only) work.

## Gaps

- No benchmarks for chokidar-cli or @parcel/watcher on NTFS vs WSL2 paths (two
  different Windows filesystem performance profiles relevant for JASON-OS).
- No community MCP watcher server with meaningful adoption found.
  `cyanheads/filesystem-mcp-server` identified in search but not evaluated.
- SoNash does not expose a `cas:watch` or continuous-monitoring mode; no design
  doc for adding one in `.planning/`.
- `scripts/cas/update-index.js` trigger path from post-commit hook not verified
  in `commit-tracker.js`.

## Serendipity

- SoNash's `session-start.js` lockfile hash pattern is directly reusable as a
  template for a zero-dependency "did any file change since last session" check
  — no additional library needed for coarse-grained session-start scan.
- `@parcel/watcher-wasm` exists for environments without native binaries —
  relevant if JASON-OS ever runs in sandboxed/containerized context.

---

## Top-2 Recommendations

**Recommendation 1 (lowest friction): `@parcel/watcher` + session-start snapshot
pattern** Install `@parcel/watcher` as dev dep. On session-start, call
`getEventsSince(snapshotPath)` for each configured project root. Feed changed
paths to `update-index.js`. Write new snapshot at session-end. Zero daemon
required. Works across locales (snapshot file travels with git if tracked).
Windows native backend (`ReadDirectoryChangesW`) more reliable than chokidar's
fs.watch. Integrates with existing `session-start.js` pattern.

**Recommendation 2 (highest reliability for active development): `chokidar v4`
subscriber daemon** For long-running dev session with continuous changes,
background Node script using chokidar v4 (CJS-compatible, one dep) watches all
configured project roots and calls `update-index.js --slug` on each event. No
service install. Killed with terminal. Acceptable for solo-dev terminal-scoped
sessions. Lower op cost than Watchman; acceptable false-positive rate for
idempotent reindex.

## Confidence

- HIGH claims: 13
- MEDIUM claims: 6
- LOW claims: 0
- Overall: HIGH for codebase probe; MEDIUM-HIGH for external tool comparison.
