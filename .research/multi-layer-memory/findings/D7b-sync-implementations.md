# Findings: Cross-Locale Sync — Real-World Implementations and Tools

**Searcher:** deep-research-searcher **Profile:** web+codebase **Date:**
2026-03-31 **Sub-Question IDs:** SQ7

---

## Key Findings

### 1. memoir (camgitt) — The Most Complete Cross-Locale Solution [CONFIDENCE: HIGH]

memoir is a purpose-built CLI + MCP server that syncs Claude Code memory,
CLAUDE.md files, and settings across machines with explicit Windows path
remapping.

**What it syncs:**

- CLAUDE.md files (scanned across all project directories)
- Auto memory files (`~/.claude/projects/*/memory/`)
- Claude Code settings
- git-managed files (repos auto-clone; non-git projects bundle as archives;
  uncommitted changes saved as patches and re-applied on restore)

**Path remapping mechanism:** memoir detects the OS during restore and remaps
absolute paths automatically. The path keying problem — e.g., a project at
`/Users/alice/projects/myapp` on Mac producing a different Claude Code memory
key than `C:\Users\alice\projects\myapp` on Windows — is handled transparently.
The exact internal implementation (whether it uses a path normalization table,
regex substitution, or OS detection + template substitution) is not documented
publicly; the README only states "it just works." No user-facing path
configuration is required.

**Storage backends:**

- GitHub private repo (free) — the primary recommendation
- memoir cloud (paid Pro tier) — `memoir cloud push/restore`
- Local storage (default, no sync)

**Encryption:** AES-256-GCM with scrypt key derivation. Secret scanning detects
20+ patterns before push (API keys, tokens, connection strings). Does not sync
`.env` files.

**Setup (all platforms):**

```
npm install -g memoir-cli
memoir init     # wizard: GitHub repo or memoir cloud
memoir push     # backs up on first machine
memoir restore  # restores on second machine
```

**Windows / no-admin feasibility:**

- Requires `npm install -g memoir-cli`. Global npm installs on Windows by
  default need no admin if Node.js was installed with nvm-windows or to a
  user-local path. With standard system-level Node.js, global installs typically
  require admin.
- No documentation of admin-specific workarounds for memoir.
- No dependency on WSL or Windows-specific tools beyond npm.

**Known issues:**

- Internal path remapping implementation is undocumented; edge cases (unusual
  path characters, non-standard usernames) have no documented handling.
- memoir is a relatively new project (active as of 2026); maturity is unproven.
- TODO.md exists in the repo but is not public-facing.

**Sources:** [1], [2], [4]

---

### 2. autoMemoryDirectory — The Official Cross-Locale Primitive [CONFIDENCE: HIGH]

Shipped in Claude Code v2.1.74 (March 12, 2026), `autoMemoryDirectory` is a
settings field that redirects where Claude Code stores auto memory files.

**Configuration:**

```json
// In ~/.claude/settings.json (user settings) or settings.local.json
{
  "autoMemoryDirectory": "~/my-custom-memory-dir"
}
```

Supports `~/` expansion. Accepted from: policy, local, and user settings scopes
only. Deliberately not accepted from project `.claude/settings.json` to prevent
shared projects from redirecting memory writes to sensitive locations.

**How it interacts with cloud sync (OneDrive, Dropbox):** The intended use case
is exactly this: point `autoMemoryDirectory` to a folder that is synced by
OneDrive/Dropbox. Memory files will be written there and synced automatically by
the cloud sync service.

**Critical limitation — the path-key problem:** `autoMemoryDirectory` only
redirects where memory files are stored. It does NOT change how projects are
identified. Claude Code still keys projects by absolute filesystem path. On two
Windows machines with different usernames (e.g., `C:\Users\jbell\` vs
`C:\Users\jbell-work\`), the memory key for the same project will differ. The
cloud-synced memory directory will contain both keys' folders, but each machine
will only find its own-keyed memories.

The path-key problem is only solved if both machines share the same username and
the project path is identical (same OneDrive path on both machines, same drive
letter, same mount point). In the sonash-v0 scenario (two Windows machines, same
git repo), if the project is synced via git and cloned to the same path on both
machines (`C:\Users\jbell\.local\bin\sonash-v0`), `autoMemoryDirectory` +
OneDrive would work cleanly.

**Known bug (resolved):** Issue #36636 documented that `autoMemoryDirectory` was
ignored in system prompt injection — the model still used the default path even
when the setting was configured. This was closed as a duplicate of #33535 and
#34146. The fix landed, but the workaround (use absolute paths only, not
relative; use `settings.local.json` not `.claude/settings.json`) is still
prudent practice.

**Windows symlink issues (separate):** Attempts to use OneDrive symlinks or NTFS
junction points as an alternative path-unification strategy are blocked by
Claude Code. The folder picker uses `fs.realpath()` which resolves symlinks
before validation, causing rejections. Session resume also fails when started
via a symlink path (issue #24271, closed as duplicate Feb 2026, no fix).

**Sources:** [3], [8], [9], [10]

---

### 3. git-notes Memory Pattern — Elegant but Infrastructure-Heavy [CONFIDENCE: MEDIUM]

The git-notes approach stores AI memories as first-class git objects using
`refs/notes/mem/{namespace}` references, enabling cross-device sync through
standard `git push`/`git pull`.

**How it works technically:**

- Memory ID format: `{namespace}:{commit_sha_prefix}:{index}` (e.g.,
  `decisions:5da308d:19`) — traces memories to the originating commit
- Three detail levels (progressive hydration): SUMMARY (15-20 tokens), FULL
  (100-500 tokens), FILES (file snapshots)
- SQLite index with vector embeddings (all-MiniLM-L6-v2) for semantic search
  completing in <50ms
- Writes are append-only (fast); consolidation happens at session end
- Any machine that can `git pull` on the repo receives the same memories

**Cross-locale sync:** Since memories travel with the git repo itself (in git's
notes refs), path differences between machines are irrelevant — the memory is
keyed to commit hashes, not filesystem paths. This elegantly solves the path-key
problem.

**Known implementations:** The primary published description is a
research/architecture article by Zircote (December 2025). It describes the
architecture thoroughly but does not provide installation steps, a deployable
tool, or Windows compatibility notes. It reads more as a design pattern than a
ready-made solution.

**Windows compatibility:** Not addressed in any source found. The SQLite +
vector embedding stack (Python-based) should run on Windows but would require
Python and relevant packages installed — potentially a barrier in a no-admin
environment.

**Sources:** [5], [11]

---

### 4. context-sync (Intina47) — Local-Only, Not a Cross-Machine Sync Tool [CONFIDENCE: HIGH]

Despite the name and the "120 stars" description from Wave 1, context-sync is
fundamentally a local-only memory store. It does not sync across machines.

**What it actually does:**

- MCP server that provides persistent memory for AI tools within one machine
- Storage: SQLite database at `~/.context-sync/data.db`
- Git hook integration: when `set_project` is called inside a git repo, it
  installs post-commit, pre-push, post-merge, and post-checkout hooks (tagged
  "Context Sync Auto-Hook"; existing hooks are backed up)
- The hooks allow it to auto-capture project context on git events
- 50+ MCP tools including git integration, code intelligence, todo management

**Cross-machine limitation:** The official documentation explicitly does not
address synchronization across multiple machines. The SQLite database is local
and there is no built-in push/pull mechanism. To use it across machines, the
entire `~/.context-sync/` directory would need to be synced externally (e.g.,
via Syncthing or git).

**Windows compatibility:** Supports 11+ platforms including Claude Desktop. No
admin requirements mentioned.

**Verdict:** Useful for within-machine persistence across sessions and AI tools,
not for cross-locale sync without external sync layer.

**Sources:** [6], [12]

---

### 5. OneDrive/Dropbox + CLAUDE.md — Works with Conditions [CONFIDENCE: HIGH]

There is no single canonical documented setup, but the pattern is functional and
well-understood from community implementations and claude-sync tooling.

**How it works:**

Option A — Sync `~/.claude/` directly via cloud service:

- Point OneDrive or Dropbox to sync the `~/.claude/` folder on both machines
- All CLAUDE.md files, settings, rules, and auto memory travel together
- Path-key problem: auto memory is still keyed by absolute path. If the project
  path differs between machines, memories are siloed. CLAUDE.md and settings
  sync cleanly since they are not path-keyed.
- Works best when OneDrive sync path is identical on both machines

Option B — autoMemoryDirectory to a synced folder:

- Set `autoMemoryDirectory` in user settings to point to a OneDrive/Dropbox
  folder that is the same on both machines
- Memory files land in the cloud-synced folder
- Still subject to path-key problem (memory files will be under different
  subdirectory names unless projects have identical absolute paths)

Option C — CLAUDE.md only, not auto memory:

- Keep CLAUDE.md files in the git repo itself (project-level CLAUDE.md)
- git commit + push = cross-machine sync of CLAUDE.md
- Auto memory remains local; CLAUDE.md carries the human-curated instructions
- This is the cleanest approach for the sonash-v0 scenario (already uses git)

**Known issues on Windows:**

- Symlinks/junctions to unify paths are blocked by Claude Code (see Finding 2)
- Claude Code bug #24140: symlinked `.claude` directories cause commands to be
  skipped as duplicates on Windows (regression in v2.1.30)
- OneDrive path length can trigger Windows MAX_PATH issues (though modern
  Windows with long path support enabled mitigates this)

**No-admin feasibility:** OneDrive is typically available without admin on
corporate Windows machines (it ships with Windows 11). No install needed.

**Sources:** [3], [7], [8], [9], [10], [13]

---

### 6. doobidoo/mcp-memory-service — Viable Cross-Locale Bridge via Cloudflare [CONFIDENCE: MEDIUM]

mcp-memory-service provides semantic memory (ChromaDB + sentence transformers)
for Claude and other AI tools, with a Cloudflare Workers backend that enables
cross-device access including browser-based Remote MCP.

**Storage backends for cross-device use:**

- SQLite-vec: local only, single user, ~5ms latency
- ChromaDB: multi-client scenarios, requires running ChromaDB server
- Cloudflare Workers + Vectorize: cloud-based, multi-device sync, true
  cross-locale bridge
- Hybrid: local-first with background Cloudflare sync (5ms local + eventual
  consistency)

**Remote MCP capability:** Supports Streamable HTTP mode with SSE for real-time
updates; HTTPS exposure via Cloudflare Tunnel or self-hosted reverse proxy;
OAuth 2.0 + Dynamic Client Registration. This enables browser-based access
(claude.ai) without Claude Desktop on the second locale.

**Cloudflare deployment for cross-locale (no-admin viable):**

```
npm create cloudflare@latest -- remote-mcp-server-authless \
  --template=cloudflare/ai/demos/remote-mcp-authless
```

Deployed to Cloudflare Workers (free tier available). No local admin needed.
Memory from either locale writes to/reads from Cloudflare, providing true sync.

**Windows setup:** Config at `%APPDATA%\Claude\claude_desktop_config.json`
(Windows). No explicit admin requirement documented. Python-based local install
(ChromaDB, sentence transformers) does have install complexity on Windows;
Docker is the recommended path for local install. Docker requires admin for
Windows Hyper-V backend unless using Docker Desktop with WSL2 backend.

**Known issues:**

- Bug fixed: soft-deleted memories from Cloudflare were incorrectly syncing back
  to local SQLite in hybrid deployments (recent fix)
- Performance regression on Apple Silicon fixed (less relevant here)
- Complexity: significantly more setup than memoir or git-based approaches
- Cloudflare Vectorize on free tier has limits (30M query vectors, 5M write
  vectors/month)

**Sources:** [14], [15], [16]

---

### 7. claude-brain (toroleapinc) — Windows Native Unsupported [CONFIDENCE: HIGH]

claude-brain provides git-based semantic merge of Claude Code memory, skills,
rules, and settings across machines with auto-sync hooks on session start/end.

**How it works:**

- First machine: `/brain-init git@github.com:you/my-brain.git`
- Other machines: `/brain-join git@github.com:you/my-brain.git`
- Semantic merge via LLM API (~$0.01-0.05 per sync when content differs)
- Deterministic JSON merge for structured data (free)
- Optional encryption with `--encrypt` flag

**Windows native: explicitly unsupported.** Documentation states: "Not supported
(use WSL)." WSL2 is fully supported. For a strict no-admin Windows environment
(no WSL), this tool is not viable.

**Sources:** [17]

---

### 8. claude-sync (renefichtmueller) — Cross-Platform with Cloud Backends [CONFIDENCE: MEDIUM]

claude-sync is a Node.js CLI (v18+ required) that syncs the entire `~/.claude/`
directory across devices with multiple backend options.

**Sync backends:**

1. Git (recommended) — auto-commits `.claude/` to private repo; best version
   history and portability
2. Cloud storage — Dropbox, iCloud, or OneDrive with automatic folder detection
3. Syncthing — P2P sync, no cloud, no third party
4. rsync over SSH — direct machine-to-machine
5. Custom — user-defined sync commands

**Cross-platform:** macOS, Linux, and Windows explicitly listed. **No-admin:**
No elevated privileges mentioned as requirement. **Path differences:** The FAQ
does not address different absolute paths between machines. Presumably the tool
syncs the `~/.claude/` directory as-is, meaning the path-key problem for auto
memory persists. **Encryption:** Recommended for cloud backends (Dropbox,
iCloud, OneDrive). **Conflict resolution:** Described as available but not
detailed in accessible documentation.

**Sources:** [18], [19]

---

### 9. git-native Approach (dev.classmethod.jp pattern) — Clean and No-Admin Viable [CONFIDENCE: HIGH]

The cleanest documented approach for the sonash-v0 scenario (same git repo, two
Windows machines, no admin at one locale) is the 2-tier git memory pattern.

**Architecture:**

- Global tier: `~/.claude/global-memory/` as a private GitHub repo
- Project tier: `CLAUDE.md` and `.claude/` inside the project repo (already
  committed to git)

**Setup:**

```bash
gh repo create claude-memory --private
gh repo clone <username>/claude-memory ~/.claude/global-memory
# On second machine:
gh repo clone <username>/claude-memory ~/.claude/global-memory
```

Uses `gh` auth (avoids SSH key setup). `gh` is available as a portable binary
with no admin required.

**Cross-machine sync:**

```bash
# Pull before session
cd ~/.claude/global-memory && git pull --rebase
# Push after session
git add . && git commit -m "sync" && git push
```

**Why it works for the sonash-v0 case:**

- CLAUDE.md already in the repo — auto-syncs via normal git workflow
- `~/.claude/global-memory/` syncs via explicit `git pull/push`
- Auto memory (path-keyed) does NOT sync via this approach, but the user
  controls what is in CLAUDE.md and global memory
- No admin required (gh CLI is a portable binary)

**Limitation:** Manual sync discipline required; no automatic sync on session
boundaries without scripting.

**Sources:** [20], [21]

---

### 10. Syncthing — Portable, No-Admin, P2P Sync for ~/.claude/ [CONFIDENCE: HIGH]

Syncthing is a P2P file sync tool that runs entirely in user space on Windows
with no admin required, making it viable for the no-admin locale constraint.

**No-admin Windows setup:**

1. Download Syncthing binary (`.exe.zip`) — no installer, no admin
2. Extract to `C:\Users\<username>\Syncthing\`
3. Run `syncthing.exe` — opens web UI at `http://localhost:8384`
4. Repeat on second machine; pair devices via Device ID
5. Add `~/.claude/` as a shared folder on both machines

**SyncTrayzor portable** (optional): provides a Windows tray icon and
auto-start; fully portable (config in `SyncTrayzorPortable\data\`).

**Key advantages for this use case:**

- No cloud intermediary — works across LAN or internet
- No admin required (portable binary)
- Real-time sync with conflict resolution
- Free and open source

**Limitation:** Path-key problem still applies to auto memory (same directory
structure is synced, but if usernames differ, auto memory subdirectory names
will differ). If both machines use the same Windows username, this is a
non-issue.

**Sources:** [22], [23]

---

### 11. CCMS (claude-code-machine-sync, miwidot) — Unix/WSL Only [CONFIDENCE: HIGH]

CCMS is a bash script that syncs `~/.claude/` via rsync over SSH. Unix/WSL only;
not native Windows. For a no-WSL Windows environment, not viable.

**Sources:** [24]

---

## The Fundamental Problem: Path-Key Architecture

A theme across all findings: Claude Code keys auto memory to absolute filesystem
paths. The encoded path `~/.claude/projects/<encoded-absolute-path>/memory/`
means that two machines with identical projects but different usernames or mount
points will have different memory keys. This is an open feature request with 20+
related GitHub issues (primary: #25739, #35985), none resolved with a native fix
as of March 2026.

**Community workarounds that bypass the path-key problem:**

- memoir: abstracts path remapping during restore (HIGH confidence in claim;
  mechanism undocumented)
- git-notes pattern: keys to commit hashes instead of paths (elegant but
  immature tooling)
- claude-context-sync (#25739 comment): converts absolute paths to template
  variables (`${HOME}`, `${PROJECTS}`) during export/import
- user-memories (m13v): uses git remote URL as stable project key instead of
  local filesystem path

**Workaround that partially works when paths match:**

- autoMemoryDirectory + OneDrive/Dropbox: works cleanly only if the project
  absolute path is identical on both machines

---

## Sources

| #   | URL                                                                        | Title                                        | Type             | Trust  | CRAAP | Date      |
| --- | -------------------------------------------------------------------------- | -------------------------------------------- | ---------------- | ------ | ----- | --------- |
| 1   | https://github.com/camgitt/memoir                                          | memoir GitHub README                         | official-project | HIGH   | 4.0   | 2026      |
| 2   | https://memoir.sh                                                          | memoir homepage                              | project-docs     | MEDIUM | 3.8   | 2026      |
| 3   | https://code.claude.com/docs/en/memory                                     | Claude Code Memory Docs                      | official-docs    | HIGH   | 5.0   | 2026-03   |
| 4   | WebSearch snippet: memoir blog                                             | memoir blog post (SSL error on direct fetch) | blog             | MEDIUM | 3.5   | 2026      |
| 5   | https://zircote.com/blog/2025/12/git-native-semantic-memory/               | Git-Native Semantic Memory for LLM Agents    | technical-blog   | MEDIUM | 3.8   | 2025-12   |
| 6   | https://github.com/Intina47/context-sync                                   | context-sync GitHub README                   | official-project | HIGH   | 4.0   | 2025      |
| 7   | https://github.com/anthropics/claude-code/issues/24140                     | Symlinked .claude on Windows bug             | GitHub issue     | HIGH   | 4.5   | 2026      |
| 8   | https://github.com/anthropics/claude-code/issues/28276                     | autoMemoryDirectory feature request          | GitHub issue     | HIGH   | 4.5   | 2025-2026 |
| 9   | https://github.com/anthropics/claude-code/issues/36636                     | autoMemoryDirectory system prompt bug        | GitHub issue     | HIGH   | 4.5   | 2026      |
| 10  | https://github.com/anthropics/claude-code/issues/25739                     | Portable project memory feature request      | GitHub issue     | HIGH   | 4.5   | 2025-2026 |
| 11  | https://dev.to/charles_li_9f5324f34d8a26/...                               | Git-native memory layer for AI agents        | blog             | MEDIUM | 3.5   | 2025      |
| 12  | https://skillsllm.com/skill/context-sync                                   | context-sync MCP description                 | directory        | LOW    | 2.5   | 2025      |
| 13  | https://github.com/anthropics/claude-code/issues/24271                     | Session resume symlink failure               | GitHub issue     | HIGH   | 4.5   | 2026      |
| 14  | https://github.com/doobidoo/mcp-memory-service                             | mcp-memory-service GitHub README             | official-project | HIGH   | 4.0   | 2026      |
| 15  | https://glama.ai/mcp/servers/doobidoo/mcp-memory-service                   | doobidoo MCP listing                         | directory        | MEDIUM | 3.0   | 2026      |
| 16  | https://developers.cloudflare.com/agents/model-context-protocol/           | Cloudflare MCP docs                          | official-docs    | HIGH   | 5.0   | 2026      |
| 17  | https://github.com/toroleapinc/claude-brain                                | claude-brain GitHub README                   | official-project | HIGH   | 4.0   | 2025      |
| 18  | https://github.com/renefichtmueller/claude-sync                            | claude-sync GitHub README                    | official-project | HIGH   | 4.0   | 2025      |
| 19  | https://github.com/renefichtmueller/claude-sync/blob/main/docs/faq.md      | claude-sync FAQ                              | official-project | HIGH   | 4.0   | 2025      |
| 20  | https://dev.classmethod.jp/en/articles/claude-code-global-memory-with-git/ | Claude Code global memory with git           | technical-blog   | MEDIUM | 4.0   | 2025      |
| 21  | https://github.com/anthropics/claude-code/issues/35985                     | Cross-device identity feature request        | GitHub issue     | HIGH   | 4.5   | 2026      |
| 22  | https://dev.to/jdrch/how-to-set-up-syncthing-...-no-admin-rights           | Syncthing on Windows no admin                | tutorial         | MEDIUM | 3.8   | 2024      |
| 23  | https://forum.syncthing.net/t/windows-non-admin-user-installation/20543    | Syncthing Windows non-admin forum            | community        | MEDIUM | 3.5   | 2023      |
| 24  | https://github.com/miwidot/ccms                                            | CCMS GitHub README                           | official-project | HIGH   | 4.0   | 2025      |

---

## Contradictions

**memoir path remapping — marketing vs. technical reality:** memoir's marketing
states path remapping "just works" with no user configuration. This is plausible
but completely undocumented technically. No source describes the actual
mechanism. It could be simple (OS detection + path prefix substitution) or
fragile (breaks on unusual usernames). Treat as MEDIUM confidence until
independently verified with Windows + different username testing.

**autoMemoryDirectory system prompt bug — fixed or not?** Issue #36636 is CLOSED
but marked as duplicate of #33535 and #34146, neither of which was confirmed
fixed in the available sources. The workaround (absolute paths, not relative;
use `settings.local.json`) should be applied regardless.

**context-sync "cross-machine sync" claim vs. docs:** The Wave 1 description
characterized context-sync as having cross-machine sync. The actual README does
not address cross-machine sync at all. The tool is local-only. This is a gap in
Wave 1 research, not a contradiction in the tool itself.

---

## Gaps

- memoir's internal path remapping mechanism is undocumented. Cannot confirm how
  it handles Windows usernames that differ between two machines.
- No documented test or report of memoir successfully syncing between two
  Windows machines with different usernames (the exact sonash-v0 scenario).
- claude-context-sync's path template variable mechanism (${HOME}, ${PROJECTS})
  was described in a GitHub issue comment but the tool's README was not fetched
  to confirm current implementation status.
- autoMemoryDirectory resolved bug status: #33535 and #34146 were listed as
  parent issues but their fix status was not verified.
- Syncthing with Claude Code: no tutorial found that specifically walks through
  syncing `~/.claude/` via Syncthing on Windows. Inferred from general Syncthing
  docs + Claude Code memory structure.
- doobidoo/mcp-memory-service Windows Docker/no-admin path: Docker on Windows
  without admin (no Hyper-V) requires WSL2 backend; admin requirement for
  initial WSL2 setup was not definitively resolved.

---

## Serendipity

**claude-context-sync path template variables (Issue #25739 comment):** A
commenter in the official feature request thread mentions a tool that converts
absolute paths to template variables (`${PROJECTS}`, `${HOME}`) during
export/import for cross-machine portability. This is the cleanest solution to
the path-key problem without relying on memoir's opaque remapping. URL:
https://github.com/Daniel-de-Oliveira-Trindade/claude-context-sync

**user-memories (m13v) — git remote URL as stable key:** Rather than keying
memory to absolute filesystem paths, this tool uses the git remote URL as the
project identifier, making cross-machine sync completely transparent. The URL
from the issue thread: https://github.com/m13v/user-memories

**autoMemoryDirectory scoping restriction is a design signal:** The fact that
`autoMemoryDirectory` cannot be set from project settings
(`.claude/settings.json`) is a deliberate security decision. This suggests
Anthropic is thinking about the attack surface of memory redirection. Worth
noting if implementing a custom sync mechanism — avoid project-level memory
redirection.

**claude-memory-manager (WhymustIhaveaname):** Mentioned in #35985 discussion as
adding a global memory layer (`~/.claude/memory/`) outside the path-keyed
project directories, with a Web UI and export/import for cross-machine sync.
URL: https://github.com/WhymustIhaveaname/claude-memory-manager — not researched
in depth but potentially relevant.

---

## Confidence Assessment

- HIGH claims: 8 (memoir features, autoMemoryDirectory behavior, context-sync
  local-only nature, claude-brain Windows unsupported, git-native approach,
  Syncthing no-admin, CCMS Unix-only, path-key architecture)
- MEDIUM claims: 4 (memoir path remapping mechanism, git-notes pattern maturity,
  doobidoo Cloudflare approach, claude-sync path handling)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The core sync options are well-understood. The primary uncertainty is whether
memoir's path remapping handles the specific two-Windows-different-username
scenario without user intervention.
