# Findings: Cross-Locale Sync Patterns — Technical Analysis

**Searcher:** deep-research-searcher **Profile:** web+codebase **Date:**
2026-03-31 **Sub-Question IDs:** SQ7

---

## Context

The user operates from two Windows machines (different locales:
`C:\Users\jason\...` home/Owner and `C:\Users\jbell\...` work). Auto Memory is
locale-specific by design — it is keyed to the absolute filesystem path. The
work locale has no admin access but has npm/npx, portable binaries, and standard
CLI tools. Both locales use the same private GitHub repository. The project
already has an existing Firebase (sonash-app) and an active
`@modelcontextprotocol/server-memory` MCP server.

---

## Key Findings

### 1. Git-Tracked Memory (Commit Memory Files to Repo) [CONFIDENCE: HIGH]

**What it is:** Commit the `~/.claude/projects/*/memory/*.md` files (or a
canonical copy) to the project git repo. This is what the project's
`.claude/canonical-memory/` directory already does — a curated snapshot
committed to `.claude/canonical-memory/`.

**Mechanism:** Manual or scripted: copy live memory files to canonical-memory/,
commit, push. At work locale: pull, copy to locale-specific memory dir.

**Evaluation:**

| Dimension            | Score | Notes                                                           |
| -------------------- | ----- | --------------------------------------------------------------- |
| Setup complexity     | 1/5   | Already partially implemented via `.claude/canonical-memory/`   |
| Maintenance burden   | 3/5   | Requires remembering to commit + copy at each locale switch     |
| Conflict risk        | 2/5   | Low — plain markdown, human-readable diffs, no binary conflicts |
| Latency impact       | None  | Git pull is manual; no latency during sessions                  |
| Works without admin? | Yes   | Git is already functional at both locales                       |
| Privacy              | High  | Private repo already in use; no third parties                   |
| Cost                 | Free  | Zero additional cost                                            |

**Implementation evidence:** The `.claude/canonical-memory/` directory already
exists in the repo with 20 files. The D1 inventory found it is diverged from the
live memory (missing ~7 of 18 feedback entries; describes user expertise
incorrectly). This means git-tracked memory is already operational but abandoned
as a maintenance task.

**Critical limitation — path mismatch:** Auto Memory is keyed to the absolute
path (`C--Users-jason--...` vs `C--Users-jbell--...`). Even with synced files,
Claude at the work locale looks in `~/.claude/projects/C--Users-jbell--...`, not
the home-locale directory. The files must be copied to the correct path for each
locale.

**Merge conflict exposure:** Memory files are append-only markdown with loose
structure. Git line-level merge is adequate in most cases. True concurrent edits
from both locales in the same session would be rare for a solo operator.

**Tradeoff:** The project's session convention (never run both machines
simultaneously) means conflict risk is practically very low. The main burden is
manual upkeep — someone must run the copy/commit/pull cycle at locale switches.
The canonical-memory divergence shows this maintenance gets abandoned.

**Verdict:** Currently partially implemented, low friction, high privacy. The
divergence problem suggests it needs either (a) automated commit/copy hooks or
(b) `autoMemoryDirectory` redirect to the repo directory so commits happen
naturally.

---

### 2. `autoMemoryDirectory` → Cloud Folder (OneDrive/Dropbox) [CONFIDENCE: HIGH]

**What it is:** Set `autoMemoryDirectory` in `settings.local.json` at each
locale to point at a cloud-synced folder (e.g., OneDrive). Both locales read and
write the same physical files via the cloud provider's filesystem sync.

**Mechanism:** Claude Code v2.1.74+ supports this setting (added March 12,
2026). Configure `~/.claude/settings.local.json` (user or local scope — NOT
`.claude/settings.json` which is ignored for this setting). Path-keyed behavior
is bypassed; both locales point at the same folder.

```json
{
  "autoMemoryDirectory": "C:\\Users\\<user>\\OneDrive\\claude-memory"
}
```

**Critical constraint:** `autoMemoryDirectory` is NOT accepted from project
settings (`.claude/settings.json`) — only from local/user settings. Each locale
requires a separate manual configuration. This is a security restriction to
prevent projects from redirecting memory writes.

**Known bug (March 2026):** GitHub Issue #36636 (closed COMPLETED March
25, 2026) confirmed a bug where the system prompt still referenced the default
path even when `autoMemoryDirectory` was set in project settings. For local/user
settings with absolute paths, absolute path values work correctly. Relative
paths had issues.

**OneDrive conflict behavior for non-Office files (markdown):** OneDrive does
NOT merge markdown files. When concurrent writes conflict, OneDrive creates a
duplicate file appended with the machine name (e.g., `MEMORY-DESKTOP-1.md`).
Since this is a solo developer who never runs both machines simultaneously,
concurrent write conflicts are extremely unlikely in practice.

**Evaluation:**

| Dimension            | Score      | Notes                                                                     |
| -------------------- | ---------- | ------------------------------------------------------------------------- |
| Setup complexity     | 2/5        | Set `autoMemoryDirectory` in local settings at each locale                |
| Maintenance burden   | 1/5        | Once configured, fully automatic                                          |
| Conflict risk        | 2/5        | Low for solo operator; OneDrive creates duplicates (no silent data loss)  |
| Latency impact       | Negligible | OneDrive syncs in background; reads are local filesystem                  |
| Works without admin? | Yes        | OneDrive is already present on Windows; settings.local.json is user-level |
| Privacy              | High       | OneDrive is already in use; contents are personal markdown files          |
| Cost                 | Free       | OneDrive is included with Office/M365; no additional cost                 |

**Path identity problem:** Both locales point at the same `autoMemoryDirectory`
path on OneDrive. This bypasses the path-keying problem entirely — Claude reads
MEMORY.md from the same physical location on both machines. This is the
strongest advantage of this approach.

**Verdict:** This is the simplest implementation for a solo operator with no
concurrent multi-machine use. The only required action per locale is setting
`autoMemoryDirectory` in `settings.local.json`. No scripts, no commit cycles, no
MCP servers.

---

### 3. Git Notes [CONFIDENCE: MEDIUM]

**What it is:** Store memory content as git notes (metadata attached to commits,
stored in `refs/notes/*`). Notes are not part of commits but can be
pushed/fetched separately.

**Mechanism:**

```bash
git notes add -m "session learning: X" HEAD
git push origin refs/notes/*
git fetch origin refs/notes/*:refs/notes/*
```

Or configure automatic fetch/push:

```bash
git config --add remote.origin.fetch '+refs/notes/*:refs/notes/*'
git config --add remote.origin.push 'refs/notes/*'
```

**Evaluation:**

| Dimension            | Score | Notes                                                                |
| -------------------- | ----- | -------------------------------------------------------------------- |
| Setup complexity     | 4/5   | Must configure git fetch/push for notes; not automatic               |
| Maintenance burden   | 4/5   | Notes not auto-synced; manual fetch/push required each locale switch |
| Conflict risk        | 3/5   | Notes can conflict if same commit annotated from both machines       |
| Latency impact       | None  | Read at session start from local git notes                           |
| Works without admin? | Yes   | Git notes are pure git operations                                    |
| Privacy              | High  | Private repo; notes not auto-shared with collaborators               |
| Cost                 | Free  | Zero cost                                                            |

**Fundamental limitation:** Git notes are not auto-synced on `git push` by
default. Every Claude Code session would need to begin with
`git fetch origin refs/notes/*` and end with `git push origin refs/notes/*`.
There is no hook-based automatic sync in Claude Code for git notes. This must be
scripted manually.

**Integration complexity:** Claude Code does not natively read git notes. Any
memory stored in git notes would need to be extracted by a hook script and
injected into context. This requires custom tooling.

**Community adoption:** A community project (`mourad-ghafiri/git-notes-memory`
on ClawHub) documents this pattern as a knowledge graph memory system for Claude
Code. However, the implementation requires significant custom scripting to
bridge git notes to Claude's context.

**Verdict:** High implementation and maintenance burden for this use case. The
benefit — co-location of notes with commits — is not relevant for this project's
memory type (user preferences and feedback). The path of least resistance is
git-tracked files, not git notes. Not recommended as primary sync mechanism.

---

### 4. Cloud-Hosted MCP Server [CONFIDENCE: HIGH]

**What it is:** Deploy a memory MCP server (e.g., `doobidoo/mcp-memory-service`,
`basic-memory`, or custom Firebase-backed) to a cloud host. Both locales
configure the same HTTPS endpoint in `.mcp.json` (which is git-tracked and syncs
automatically).

**Mechanism:** The `.mcp.json` file is committed to the repo. When updated at
one locale, a `git pull` at the other locale picks up the new endpoint. Both
machines connect to the same remote MCP server.

**Implementation path for this project:** Railway or Vercel deployment:

- Railway: $5/month free credit; persistent database connections; zero cold
  starts
- Vercel Edge Functions: free tier viable; stateless (requires external DB for
  state)
- Self-hosted VPS: full control; ~$5-10/month on DigitalOcean/Linode

**Evaluation:**

| Dimension            | Score       | Notes                                                       |
| -------------------- | ----------- | ----------------------------------------------------------- |
| Setup complexity     | 4/5         | Must deploy and configure a server; MCP config changes      |
| Maintenance burden   | 3/5         | Server uptime, updates, credentials management              |
| Conflict risk        | 1/5         | Server is the single source of truth; no conflict possible  |
| Latency impact       | Moderate    | HTTP MCP transport: 100-500ms per tool call; non-blocking   |
| Works without admin? | Yes         | Client configuration only; no local installation            |
| Privacy              | Medium      | Memory travels to cloud server; depends on hosting provider |
| Cost                 | $0-10/month | Vercel free tier viable; Railway $5 credit; VPS $5-10/month |

**Practical constraint:** The existing `@modelcontextprotocol/server-memory`
runs locally via `npx`. Making it cross-locale requires either (a) running it as
a remote HTTP server or (b) replacing it with a cloud-hosted variant. Both
options require `MEMORY_FILE_PATH` to point at a shared location.

**Supermemory cloud plugin:** The Supermemory plugin ($19/month Pro) is the
easiest cloud memory path — hook-based capture, HTTPS delivery, both locales
share same API key. But the Windows stdin bug (Issue #25) and the cost make it
less attractive than free alternatives.

**Verdict:** Viable, but adds operational complexity. More appropriate if the
user wants semantic search or cross-project memory, not just cross-locale sync.

---

### 5. Shared SQLite via Cloud Sync [CONFIDENCE: HIGH]

**What it is:** Store a SQLite DB (used by tools like `claude-mem`, the MCP
memory server, or `basic-memory`) in a OneDrive/Dropbox folder. Both locales
read/write the same DB file.

**Evaluation:**

| Dimension            | Score                         | Notes                                                              |
| -------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Setup complexity     | 2/5                           | Configure tool to use cloud-synced path                            |
| Maintenance burden   | 1/5                           | Transparent once configured                                        |
| Conflict risk        | 5/5                           | HIGH — SQLite on cloud sync is officially unsupported and corrupts |
| Latency impact       | None (reads local after sync) | Cloud sync runs in background                                      |
| Works without admin? | Yes                           | File path configuration only                                       |
| Privacy              | High                          | Stays within OneDrive/Dropbox                                      |
| Cost                 | Free (OneDrive)               | No additional cost                                                 |

**Critical finding — SQLite official position:** SQLite's official documentation
(`sqlite.org/useovernet.html`) explicitly states that SQLite on network
filesystems is unsupported. The core issue: network filesystems use unreliable
file locking. WAL mode makes this worse — the `-shm` file uses shared memory
mappings that do not work over network paths. A WAL-reset bug in SQLite versions
3.7.0 through 3.51.2 (fixed March 13, 2026 in 3.51.3) could cause corruption
even on local filesystems.

OneDrive and Dropbox use SMB or their proprietary sync protocols, which behave
like network filesystems at the locking level. For a solo user who never writes
to the DB from two machines simultaneously, corruption is unlikely but possible
if a sync event occurs during a write.

**Verdict:** Acceptable only if (a) never running sessions on both machines
simultaneously and (b) using a plain rollback (non-WAL) SQLite mode. Even then,
this violates SQLite's own recommendations. For memory files where
loss/corruption would be painful, this is not recommended. Git-tracked markdown
files or the `autoMemoryDirectory` approach are safer alternatives.

---

### 6. Firebase/Firestore as Memory Backend [CONFIDENCE: MEDIUM]

**What it is:** Use the project's existing Firebase (`sonash-app`) as the
persistent backend for Claude Code memory. Build or configure an MCP server that
reads/writes to Firestore. Both locales connect via the same project
credentials.

**Mechanism options:**

- **Firebase MCP server** (official, `gannonh/firebase-mcp`): Provides tools for
  Firestore CRUD. Could be used to store/retrieve memory documents.
- **Custom MCP server**: A Node.js MCP server using Firebase Admin SDK or client
  SDK, reading/writing a `claude-memory` collection in Firestore.
- **Cloud Function**: An `httpsCallable` Cloud Function serving MCP endpoints
  (aligns with the project's security rule requiring Cloud Functions for
  writes).

**Evaluation:**

| Dimension            | Score        | Notes                                                                         |
| -------------------- | ------------ | ----------------------------------------------------------------------------- |
| Setup complexity     | 4/5          | Must build custom MCP server or adapt Firebase MCP; write security rules      |
| Maintenance burden   | 3/5          | Firebase project overhead; potential costs at scale                           |
| Conflict risk        | 1/5          | Firestore handles concurrent writes natively (atomic operations)              |
| Latency impact       | Low-Moderate | Firestore latency ~50-200ms; acceptable for MCP tool calls                    |
| Works without admin? | Yes          | Firebase credentials are portable via env vars                                |
| Privacy              | Medium       | Data in Google's cloud; same risk as current app data                         |
| Cost                 | Low-Free     | Firestore free tier: 50K reads/day, 20K writes/day — well within memory usage |

**The "existing infrastructure" advantage:** The project already has Firebase
configured, authenticated, and working. Firestore already stores sensitive app
data. Adding a `claude-memory` collection requires no new infrastructure or
credentials.

**The security constraint:** The project's CLAUDE.md Security Rules state: "NO
DIRECT WRITES to Firestore — use Cloud Functions (`httpsCallable`)." This
constraint applies to the app, not necessarily to a Claude Code memory backend
that uses Admin SDK. However, consistency suggests using Cloud Functions here
too.

**The missing piece:** There is no pre-built Claude Code memory MCP server
backed by Firebase. This would require custom development. The
`gannonh/firebase-mcp` server provides Firestore tools but is not purpose-built
for Claude Code memory semantics (MEMORY.md structure, topic files, etc.).

**Verdict:** Technically clean and operationally safe, but requires meaningful
development effort. Best reserved as a Phase 2 option after simpler sync
patterns are validated. The strong point is using existing infrastructure; the
weak point is build cost.

---

### 7. GitHub Gists or GitHub API [CONFIDENCE: MEDIUM]

**What it is:** Store memory as GitHub Gist files or repo files accessed via the
GitHub API. Both locales read/write via authenticated API calls.

**Community implementation:** The `m13v/user-memories` project (referenced in
GitHub Issue #25739) uses git remote URL as a stable identifier and syncs via
git/ Dropbox/rsync. The `user-memories` library uses SQLite + embeddings with
semantic search.

**Evaluation:**

| Dimension            | Score    | Notes                                                             |
| -------------------- | -------- | ----------------------------------------------------------------- |
| Setup complexity     | 3/5      | GitHub token setup; script or MCP server for API calls            |
| Maintenance burden   | 2/5      | Gists are stable; minimal maintenance once configured             |
| Conflict risk        | 2/5      | API writes are serialized; no concurrent write conflicts          |
| Latency impact       | Moderate | GitHub API: 100-500ms per call; not suitable for hot path         |
| Works without admin? | Yes      | `gh` CLI works at work locale; API tokens are portable            |
| Privacy              | Medium   | GitHub private gist/repo; data stored at GitHub                   |
| Cost                 | Free     | GitHub API free tier: 5,000 requests/hour for authenticated users |

**Path identity solved:** Using a Gist or GitHub repo as memory storage bypasses
the path-keying problem. Both locales can read the same Gist/repo files
regardless of filesystem location.

**Tooling exists:** `gh` CLI is already functional at the work locale (no admin
needed). A simple hook script could do `gh gist edit <id> --add-file MEMORY.md`
at session end and `gh gist view <id>` at session start.

**Rate limit is not a practical concern:** Memory updates happen ~1-5 times per
session. At 5,000 requests/hour, this is far below any limit.

**Verdict:** A reasonable low-infrastructure option for syncing plain markdown
memory. Simpler than deploying an MCP server, no SQLite corruption risk, private
by default. Main downside: GitHub API latency means this cannot be synchronous
in the session hot path. Must be async (hook-based) rather than inline MCP tool
calls.

---

### 8. Dedicated Sync Tools (claude-sync, renefichtmueller/claude-sync) [CONFIDENCE: MEDIUM]

**What it is:** Third-party CLI tools purpose-built for syncing Claude Code
sessions across devices.

**tawanorg/claude-sync:**

- Syncs `~/.claude/` via Cloudflare R2, AWS S3, or Google Cloud Storage
- End-to-end encrypted (age encryption)
- Install: `npm install -g @tawandotorg/claude-sync`
- Critical limitation: syncs `~/.claude/projects/` but does NOT remap paths.
  Home locale (`C--Users-jason--...`) and work locale (`C--Users-jbell--...`)
  are treated as different projects. Memory does not merge across locales.
- Windows binary not documented; npx install works but platform support unclear.

**renefichtmueller/claude-sync:**

- Syncs `.claude/` directory with five backends: Git (recommended), Cloud
  Storage (OneDrive/Dropbox auto-detected), Syncthing, rsync/SSH, Custom
- "Smart conflict resolution": memory files merged+deduplicated, settings use
  "latest wins," logs merge chronologically
- Pull-before-push workflow; optional file watching (2000ms debounce)
- Windows compatibility not explicitly documented; Node.js ≥18 required
- Same path-keying problem as above — does not address locale path differences

**Neither tool solves the locale path mismatch** unless paths are normalized.
The `autoMemoryDirectory` approach is simpler and native.

---

### 9. Syncthing (Peer-to-Peer File Sync) [CONFIDENCE: MEDIUM]

**What it is:** Open-source P2P file sync daemon. Monitors directories and
continuously syncs changes between machines.

**Portability:** Syncthing is a single binary (`syncthing.exe` on Windows). No
installer required. No admin access needed. Can be placed in PATH and run as a
user-mode process. Confirmed: Syncthing community forum documents non-admin,
no-install use on Windows via the plain binary.

**For memory files:** Configure a shared folder pointing at the
`autoMemoryDirectory` location. Changes at home locale sync to work locale
within seconds when both machines are online.

**Evaluation:**

| Dimension            | Score      | Notes                                                                                |
| -------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Setup complexity     | 3/5        | Syncthing config on both machines; shared folder setup                               |
| Maintenance burden   | 2/5        | Syncthing runs as background process; self-maintaining                               |
| Conflict risk        | 2/5        | Syncthing has conflict detection; creates `.sync-conflict` files on concurrent edits |
| Latency impact       | Negligible | Changes sync in background; reads are local                                          |
| Works without admin? | Yes        | Single binary, user-mode operation confirmed                                         |
| Privacy              | Very High  | P2P direct transfer; no cloud intermediary                                           |
| Cost                 | Free       | Open source, no accounts, no subscriptions                                           |

**Syncthing conflict model:** Unlike OneDrive, Syncthing creates
`.sync-conflict-DATE-NODEID.md` files when conflicts occur. For markdown, this
is detectable and recoverable. For a solo user with no concurrent sessions,
conflicts should be extremely rare.

**Paired with autoMemoryDirectory:** Set `autoMemoryDirectory` to the
Syncthing-managed folder at both locales. Claude writes to local path; Syncthing
handles replication. This combines the simplicity of the `autoMemoryDirectory`
approach with full cross-locale sync without any cloud dependency.

**Work locale concern:** Syncthing requires both machines to be reachable (LAN
or internet). The work machine (jbell) has no admin access but can run the
Syncthing binary as a user. However, corporate firewalls may block the Syncthing
relay servers. OneDrive (already present on work machines) is less likely to be
blocked.

---

### 10. The Native Solution: `autoMemoryDirectory` Pointing at Git Repo [CONFIDENCE: HIGH]

**This is the highest-signal finding from the analysis.** All other patterns are
workarounds for a problem that can be solved natively:

**Pattern:** Set `autoMemoryDirectory` in `settings.local.json` at both locales
to point at `.claude/canonical-memory/` (or a similar directory) within the git
repo. This means:

1. Auto Memory writes directly to a git-tracked path
2. Normal `git commit` + `git push` propagates memory to the remote
3. Normal `git pull` at the other locale brings memory down
4. No separate sync infrastructure needed
5. Merge conflicts handled by git (plain markdown — very rare, easily resolved)
6. The project's existing commit/push workflow doubles as memory sync

**Configuration (at each locale, in `settings.local.json`):**

```json
{
  "autoMemoryDirectory": "C:\\Users\\<user>\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

**Why this works:** The git path is the same logical directory on both machines
(same repo, same relative path). The absolute path differs by locale username
but points at the same git repo contents after a `git pull`. The only identity
issue is if Claude looks up memory by path — but `autoMemoryDirectory` overrides
the path, so the locale-specific path lookup doesn't apply.

**Risk:** If Claude is actively running at both locales simultaneously (very
rare for a solo operator), there's a potential for concurrent writes followed by
a merge conflict on the next push. For plain markdown files, git's line-level
merge handles this well.

**Caveat:** The existing `.claude/canonical-memory/` was a manually curated
snapshot that has diverged. Re-activating it as the live `autoMemoryDirectory`
target will immediately solve the sync problem going forward, but the stale
content should be reconciled with the current live memory first.

---

## Evaluation Matrix (All Patterns)

| Pattern                                 | Setup | Maint | Conflict | Admin-free | Privacy   | Cost      | Recommended          |
| --------------------------------------- | ----- | ----- | -------- | ---------- | --------- | --------- | -------------------- |
| Git-tracked markdown (canonical-memory) | 1     | 3     | 2        | Yes        | Very High | Free      | Yes (existing)       |
| `autoMemoryDirectory` → OneDrive        | 2     | 1     | 2        | Yes        | High      | Free      | Yes (simplest)       |
| `autoMemoryDirectory` → Git repo dir    | 2     | 1     | 1        | Yes        | Very High | Free      | Yes (best overall)   |
| Git notes                               | 4     | 4     | 3        | Yes        | Very High | Free      | No                   |
| Cloud MCP server (Railway/Vercel)       | 4     | 3     | 1        | Yes        | Medium    | $0-10/mo  | Phase 2              |
| Shared SQLite via cloud sync            | 2     | 1     | 5        | Yes        | High      | Free      | No (corruption risk) |
| Firebase/Firestore backend              | 4     | 3     | 1        | Yes        | Medium    | Free tier | Phase 2              |
| GitHub Gists / API                      | 3     | 2     | 2        | Yes        | Medium    | Free      | Phase 2              |
| Syncthing + autoMemoryDirectory         | 3     | 2     | 2        | Yes        | Very High | Free      | Optional             |
| claude-sync tools                       | 3     | 2     | 3        | Unclear    | Medium    | Free      | No (path mismatch)   |

Score key: 1 = best, 5 = worst (for Setup, Maint, Conflict columns)

---

## Sources

| #   | URL/Path                                                                                                         | Title                                   | Type           | Trust  | CRAAP     | Date       |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------- | ------ | --------- | ---------- |
| 1   | `C:/Users/jbell/.local/bin/sonash-v0/.claude/canonical-memory/`                                                  | Canonical memory directory (20 files)   | filesystem     | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 2   | `C:/Users/jbell/.local/bin/sonash-v0/.claude/state/work-locale-sync-plan.md`                                     | Work locale sync plan (Session #232)    | filesystem     | HIGH   | 5/5/5/5/5 | 2026-03-23 |
| 3   | `C:/Users/jbell/.local/bin/sonash-v0/.research/multi-layer-memory/findings/D1-codebase-memory-inventory.md`      | Codebase memory inventory               | findings       | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 4   | `C:/Users/jbell/.local/bin/sonash-v0/.research/multi-layer-memory/findings/D5b-mcp-integration-patterns.md`      | MCP integration patterns                | findings       | HIGH   | 5/5/5/5/5 | 2026-03-31 |
| 5   | https://code.claude.com/docs/en/memory                                                                           | Claude Code Official Memory Docs        | official-docs  | HIGH   | 5/5/5/5/5 | 2026-03    |
| 6   | https://github.com/anthropics/claude-code/issues/36636                                                           | autoMemoryDirectory bug + fix           | official issue | HIGH   | 5/5/5/5/5 | 2026-03-25 |
| 7   | https://github.com/anthropics/claude-code/issues/35985                                                           | Cross-device identity feature request   | official issue | HIGH   | 5/5/5/5/5 | 2026-03-18 |
| 8   | https://github.com/anthropics/claude-code/issues/25739                                                           | Portable project memory across machines | official issue | HIGH   | 5/5/5/5/5 | 2026       |
| 9   | https://github.com/tawanorg/claude-sync                                                                          | claude-sync (tawanorg) README           | community repo | MEDIUM | 4/5/3/4/4 | 2026       |
| 10  | https://github.com/renefichtmueller/claude-sync                                                                  | claude-sync (renefichtmueller) README   | community repo | MEDIUM | 4/5/3/4/4 | 2026       |
| 11  | https://sqlite.org/useovernet.html                                                                               | SQLite Over a Network (Official)        | official-docs  | HIGH   | 5/5/5/5/5 | 2025       |
| 12  | https://github.com/anomalyco/opencode/issues/14970                                                               | SQLite corruption on NFS                | issue tracker  | HIGH   | 5/4/4/5/5 | 2025       |
| 13  | https://dev.classmethod.jp/en/articles/claude-code-global-memory-with-git/                                       | Claude Code global memory with git      | community blog | MEDIUM | 4/5/3/4/4 | 2026       |
| 14  | https://sharepointmaven.com/how-onedrive-sync-resolves-sync-conflicts/                                           | OneDrive conflict resolution behavior   | community-docs | MEDIUM | 4/4/3/4/4 | 2025       |
| 15  | https://firebase.google.com/docs/ai-assistance/mcp-server                                                        | Firebase MCP server (official)          | official-docs  | HIGH   | 5/5/5/5/5 | 2025       |
| 16  | https://github.com/gannonh/firebase-mcp                                                                          | firebase-mcp GitHub                     | community repo | MEDIUM | 4/5/3/4/4 | 2025       |
| 17  | https://mcpplaygroundonline.com/blog/free-mcp-server-hosting-cloudflare-vercel-guide                             | Free MCP server hosting guide           | community      | MEDIUM | 3/4/3/4/4 | 2026       |
| 18  | https://dev.to/jdrch/how-to-set-up-syncthing-with-a-tray-icon-on-a-windows-pc-you-dont-have-admin-rights-to-4ih8 | Syncthing non-admin Windows setup       | community      | MEDIUM | 4/4/3/4/4 | 2025       |
| 19  | https://alchemists.io/articles/git_notes                                                                         | Git Notes technical reference           | community      | MEDIUM | 4/4/3/4/4 | 2025       |
| 20  | https://www.codestudy.net/blog/git-how-to-push-messages-added-by-git-notes-to-the-central-git-server/            | Git notes push to remote                | community      | MEDIUM | 4/3/3/4/4 | 2025       |

---

## Contradictions

**`autoMemoryDirectory` in project settings (resolved):** The setting cannot be
placed in `.claude/settings.json` (project settings, which IS git-tracked). Only
in `settings.local.json` (per-machine). This means the setting itself cannot be
git-tracked and auto-applied. Each locale requires manual configuration. The bug
in Issue #36636 was about project settings being ignored — fixed March 25, 2026.
The security restriction on project settings is intentional and permanent.

**"Plain markdown files don't conflict" vs "OneDrive creates duplicates":** For
practical purposes, a solo developer never running both machines simultaneously
means conflicts are hypothetical, not real. But the technical risk exists and
the behavior differs: git creates a merge conflict (visible, recoverable),
OneDrive creates a renamed duplicate (visible, but requires manual merge),
Syncthing creates a `.sync-conflict` file (visible, recoverable). Only
shared-SQLite via cloud sync risks invisible data corruption.

**claude-sync tools claim "memory sync" but don't solve path remapping:** Both
claude-sync tools sync `~/.claude/projects/` but treat the path-keyed
directories as opaque. They do not map `C--Users-jason--...` to
`C--Users-jbell--...`. For this specific two-locale setup (different usernames,
same repo), these tools do not solve the actual problem.

---

## Gaps

1. **`autoMemoryDirectory` → Git repo dir: untested in production.** The pattern
   of pointing `autoMemoryDirectory` at a git-tracked directory is the clearest
   win identified, but no community implementations of this exact pattern were
   found. The closest evidence is the existing `.claude/canonical-memory/` which
   is git-tracked but not set as `autoMemoryDirectory`.

2. **Work locale OneDrive availability not confirmed.** The work locale (jbell)
   has corporate IT restrictions. OneDrive may or may not be installed/allowed.
   The memory file notes "no admin access" but does not specify OneDrive status.

3. **Syncthing at work locale: corporate firewall risk.** Syncthing uses relay
   servers when direct connection fails. Corporate firewalls may block
   Syncthing's relay infrastructure. LAN sync (when on same network) works
   without relays, but home-to-work sync requires internet traversal.

4. **Firebase MCP for memory: no reference implementation.** No production
   Claude Code memory system backed by Firebase/Firestore was found. The
   Firebase MCP server exists but is purpose-built for app development, not
   Claude Code memory management.

5. **Concurrent edit scenario not fully modeled.** If the user opens a session
   at work, leaves it open, then opens a session at home, and both write to
   memory simultaneously — the behavior of each sync pattern under this scenario
   is not fully documented. For `autoMemoryDirectory` → git repo: both sessions
   would write to their local copy of the git repo; whichever commits second
   would need to merge.

---

## Serendipity

1. **The canonical-memory directory is already the answer, just abandoned.** The
   project has `.claude/canonical-memory/` git-tracked, with 20 files, right
   now. The only gap is: it's not set as `autoMemoryDirectory`, so Claude still
   writes to the locale-specific path. Setting `autoMemoryDirectory` in
   `settings.local.json` at both locales to point at this directory would
   immediately solve the sync problem with no new infrastructure.

2. **`autoMemoryDirectory` was added specifically for this use case.** The
   GitHub Issues show that #28276 ("Configurable auto-memory storage location")
   was filed as a feature request and shipped in v2.1.74 (March 12, 2026). The
   feature was designed exactly to enable OneDrive/Dropbox/git-repo memory
   paths.

3. **The work-locale-sync-plan.md already handles state files.** The
   `work-locale-sync-plan.md` (Session #232) shows a mature approach to merging
   `.claude/state/` JSONL files across locales. This same pattern (git pull +
   manual merge for append-only logs) could be extended to memory files if not
   using `autoMemoryDirectory`.

4. **`user-memories` project solves path identity by hashing git remote URL.**
   The `m13v/user-memories` project uses `git remote URL` as the memory key
   instead of local filesystem path. This is a lightweight fix that makes memory
   locale-independent without any sync infrastructure. Anthropic could ship this
   as a native fix per Issue #25739 — but it hasn't been confirmed as shipped.

5. **Supermemory plugin: most automatic but highest ongoing cost.** For users
   who want zero-friction cloud sync without any configuration, the Supermemory
   plugin ($19/month) captures everything via hooks and makes it available at
   any machine with the same API key. The Windows stdin bug remains open, which
   is a concrete risk for this specific environment.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 6
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **MEDIUM-HIGH**

The core platform behavior (autoMemoryDirectory, path-keying, SQLite corruption
risk, git notes mechanics) is HIGH confidence from official sources. The
evaluation of third-party sync tools is MEDIUM confidence — behavior claimed in
READMEs but not independently verified for this specific two-locale Windows
setup.
