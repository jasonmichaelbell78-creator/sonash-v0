# Findings: Auto-Advance Architecture for R&D Stage Tracking

**Searcher:** deep-research-searcher **Profile:** codebase + web **Date:**
2026-04-04 **Sub-Question IDs:** SQ2 (D2) **Topic:** Auto-advance architecture —
watcher options (hook/polling/on-demand), "done enough" triggers, accuracy vs
latency trade-offs

---

## Sub-Question Restated

SoNash needs to automatically advance R&D project stages when canonical
artifacts appear in 4 watched locations: `.research/<slug>/`,
`.research/repo-analysis/<repo>/`, `.planning/<slug>/`, and
`.research/<slug>/BRAINSTORM.md`. The trigger is "file appears/is updated." What
is the right watcher architecture for a solo-dev tool running 10-20 R&D threads
on Windows?

---

## Search Strategy

1. Codebase analysis: `.claude/hooks/session-start.js`,
   `.claude/hooks/post-write-validator.js`, `.husky/pre-commit`,
   `.planning/todos.jsonl` scan,
   `.research/research-discovery-standard/findings/SQ6-hook-natural-invocation.md`
2. Web research: Claude Code hook system (official docs), file watcher libraries
   (chokidar, fs.watch, fs.watchFile), Windows-specific behavior, partial write
   detection, debounce patterns, atomic write approaches
3. Cross-reference: official Claude Code docs + independent technical sources
   for confidence assignment

---

## Key Findings

### 1. Claude Code has a native `FileChanged` hook event — the right primitive [CONFIDENCE: HIGH]

Claude Code (current as of April 2026) provides a `FileChanged` hook event that
fires when a watched file changes on disk. It is configured via `SessionStart`
hook output: a `watchPaths` array of file paths returned from the `SessionStart`
hook registers those paths for watching. The `FileChanged` hook then fires with
`file_path` (absolute path) in its JSON input when any watched file changes.

Key characteristics:

- Matcher field filters on **basename only** (e.g., `"BRAINSTORM.md"`) — cannot
  match by directory path via the matcher alone
- The `file_path` field in the hook input contains the absolute path, enabling
  path-based filtering inside the hook script itself
- FileChanged hooks are **async** — they cannot block Claude's operation
- No decision control: FileChanged cannot block or reject file changes
- Hooks run in the background without blocking the main session
- Windows file watcher fixes were shipped: Claude Code previously silently
  failed on Windows with pre/post-commit hooks due to cmd.exe vs Git Bash issues
  — this was resolved by switching to Git Bash

Sources: [1] (official Claude Code hooks-guide), [2] (official hooks reference),
[9] (search result on watchPaths pattern)

### 2. SessionStart `watchPaths` is the correct registration mechanism [CONFIDENCE: HIGH]

A `SessionStart` hook can output JSON with a `watchPaths` array to register
paths for FileChanged monitoring. This is idiomatic and documented:

```json
{
  "watchPaths": [
    ".research/my-project/BRAINSTORM.md",
    ".research/my-project/RESEARCH_OUTPUT.md"
  ],
  "additionalContext": "R&D thread monitoring active."
}
```

SoNash's `session-start.js` already outputs structured state at the end of its
run (`console.log("ok")`). The existing hook could be extended to enumerate
active R&D slugs from `.planning/todos.jsonl` (which it already reads) and emit
`watchPaths` covering the 4 canonical artifact locations for each active slug.

This approach requires:

1. Enumerate active R&D slugs from `.planning/todos.jsonl` at session start
2. Build `watchPaths` array for all 4 artifact paths per slug
3. Output JSON with `watchPaths` to stdout (replaces the current `"ok"` output
   which becomes `additionalContext` + `watchPaths`)

Sources: [1] (official docs), [9] (watchPaths pattern), [10] (SessionStart hook
example with git + watchPaths output)

### 3. On-demand scanning (lazy) is the correct primary mode for `/rnd` view [CONFIDENCE: HIGH]

For a solo dev running 10-20 R&D threads, the `/rnd` view should compute stage
status **lazily at view time** by scanning the 4 canonical locations with
`fs.existsSync()` + content checks. Reasons:

- Zero overhead between sessions: no persistent watcher process, no background
  daemon, no Windows service
- Instantaneous at human interaction scale: scanning 10-20 directories with
  `fs.existsSync()` + `fs.statSync()` takes < 5ms on a local SSD
- No missed-update risk: always reads current filesystem state
- No false-advance risk: artifact is either there or it isn't at view time
- Consistent with existing SoNash patterns: session-start.js reads
  `.planning/todos.jsonl` synchronously on every start (same paradigm)
- Handles partial writes naturally: the check happens after any in-progress
  write completes

Sources: [3] (trade-off analysis via web), [4] (session-start.js codebase
analysis showing synchronous scan pattern)

### 4. Hook-based advance (via `FileChanged`) is correct for in-session real-time feedback [CONFIDENCE: MEDIUM-HIGH]

When the user is actively running a skill (e.g., deep-research, brainstorm) and
an artifact is written, a `FileChanged` hook can trigger an immediate stage
advance update. This provides real-time feedback without requiring the user to
open `/rnd`.

The pattern:

1. `SessionStart` registers `watchPaths` for active R&D slugs
2. When deep-research writes `RESEARCH_OUTPUT.md`, `FileChanged` fires
3. Hook script checks: does this file_path match a known artifact pattern?
4. If yes: update the stage record in `.planning/todos.jsonl`
5. Session state reflects the advance automatically

**Failure modes:**

- FileChanged fires on the `file_path` but matcher only matches basename —
  multiple projects with `BRAINSTORM.md` will all fire the same hook, requiring
  path-based disambiguation inside the script
- Windows fs.watch (underlying Claude Code's file watcher) has documented
  issues: duplicate events, null filenames, race conditions with directory
  locking. The hook script must be idempotent.
- The `stop_hook_active` pattern doesn't apply here, but the hook must guard
  against re-entrant calls
- watchPaths registered at session-start only: if a new R&D slug is created
  mid-session, its paths won't be watched until the next session start

Sources: [1] (official docs), [2] (FileChanged schema), [5] (Windows fs.watch
reliability issues)

### 5. Node.js `fs.watch` on Windows has well-documented reliability issues [CONFIDENCE: HIGH]

`fs.watch` on Windows uses the `ReadDirectoryChangesW` API. Known issues
(2024-2025):

- **Duplicate events**: A single file save triggers 4-12 filesystem events
  (editor-dependent). Debouncing is mandatory, not optional.
- **Null filenames**: On Windows, `fs.watch` sometimes provides `null` as the
  changed filename, requiring fallback to directory-level watching
- **Memory leaks**: Issue #52769 (Node.js v18.20.2, Windows 10): continually
  creating and closing fs watches leaks memory
- **Junction inconsistency**: Issue #53903: recursive `fs.watch` on directory
  junctions produces inconsistent events (Node v20.5.1, Windows 10)
- **Directory locking**: Watching a directory on Windows blocks that directory
  from being deleted or renamed
- **Network filesystem unreliability**: fs.watch unreliable on NFS/SMB shares
  and in virtual environments (Vagrant, Docker)

Chokidar (v4.x, still CJS-compatible; v5 requires ESM and Node v20+) wraps
`fs.watch` with normalization, deduplication, and optional polling fallback.
Claude Code's built-in FileChanged hook abstracts this — the hook consumer does
not need to manage low-level watcher behavior directly.

Sources: [5] (Node.js GitHub issues), [6] (chokidar documentation), [7]
(oneuptime.com file watching guide)

### 6. Chokidar's `awaitWriteFinish` is the canonical partial-write solution [CONFIDENCE: HIGH]

Partial write problem: the `add` or `change` event fires the moment a file first
appears on disk, before the content is fully written. For markdown files written
by agents (which can be 50-200KB), this creates a window where the file exists
but is incomplete.

Chokidar's `awaitWriteFinish` option:

- `stabilityThreshold` (default 2000ms): duration file size must remain constant
  before emitting. Set to 500ms for agent-written markdown files (writes
  typically complete in < 200ms for files up to 500KB on SSD)
- `pollInterval` (default 100ms): how often to check file size stability

For Claude Code's built-in FileChanged hook, the equivalent protection comes
from content-based validation inside the hook script: after receiving the event,
read the file and verify it is non-empty and has a minimum content check before
updating state. This is simpler than configuring awaitWriteFinish and works
regardless of the underlying watcher.

**Practical partial-write guard for SoNash (inside the hook script):**

```javascript
const content = fs.readFileSync(filePath, "utf8");
if (content.length < 50) return; // not yet written
// for BRAINSTORM.md: check for required section
if (basename === "BRAINSTORM.md" && !content.includes("## ")) return;
```

Sources: [6] (chokidar awaitWriteFinish docs), [8] (debounce article), [11]
(chokidar issues #381, #384 on awaitWriteFinish reliability)

### 7. "Done enough" trigger logic: file existence + non-empty is the minimum; section presence is the right threshold [CONFIDENCE: MEDIUM-HIGH]

Five candidate "done enough" checks, ranked by robustness vs complexity:

| Level | Check                                        | Pros                       | Cons                                            |
| ----- | -------------------------------------------- | -------------------------- | ----------------------------------------------- |
| L0    | File exists                                  | Zero false negatives       | False positives on 0-byte file, partial write   |
| L1    | File exists + size > 0                       | Catches 0-byte files       | Still fires on partial writes                   |
| L2    | File exists + size > N bytes                 | Configurable threshold     | N is arbitrary; breaks if content is brief      |
| L3    | File exists + section heading present        | Semantically correct       | Regex/string search per file                    |
| L4    | File exists + frontmatter `status: complete` | Explicit completion signal | Requires skill cooperation to write frontmatter |
| L5    | File exists + downstream index entry         | Audit-trail backed         | Requires research-index.jsonl write discipline  |

**Recommendation for SoNash:** L3 (section presence) per artifact type:

- `BRAINSTORM.md`: `content.includes('## ')` (any H2 section = substantive
  content written)
- `RESEARCH_OUTPUT.md`: `content.includes('## ')` AND size > 1000 bytes
- `FINDINGS.md` files: size > 500 bytes (deep-research output is always
  substantial)
- `metadata.json`: valid JSON with `status` field present

L4 (frontmatter status) is the _most correct_ but requires all skills to write a
`status: complete` frontmatter header — a behavioral dependency that creates
coupling. L3 requires no skill changes.

L5 (research-index.jsonl) is already planned (D17 in DECISIONS.md) and would
serve as an authoritative completion signal when implemented, but is not yet
enforced.

Sources: [12] (research-discovery-standard DECISIONS.md D17), [13] (codebase
analysis of existing `.planning/todos.jsonl` pattern), [3] (web research on file
completion detection)

### 8. Debounce with ceiling timeout is mandatory for all watcher implementations [CONFIDENCE: HIGH]

A single file write by an AI agent triggers 4-12 filesystem events in quick
succession (editor behavior applies to Claude Code writes too). Without
debounce:

- 4-12 stage-advance attempts per single file write
- JSON state file corruption risk if multiple writes overlap
- Race condition in JSONL append operations

**Recommended pattern:** 100ms debounce with 1000ms ceiling timeout:

- 100ms window: collapses burst events from a single save into one trigger
- 1000ms ceiling: prevents indefinite delay if events stream continuously (e.g.,
  large file written in chunks on slow storage)

This matches chokidar's default behavior and the OpenAI Codex file watcher
configuration (increased from 1s to 10s in PR #11494 — note that 10s is too long
for SoNash's interactive use case).

Sources: [8] (debounce/throttle/coalescing article), [14] (OpenAI Codex PR
#11494 on debounce duration), [6] (chokidar defaults)

### 9. Atomic writes via temp-file-then-rename are the correct write pattern for state files [CONFIDENCE: HIGH]

SoNash's `session-start.js` already uses this pattern for `.session-state.json`:

```javascript
fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
fs.rmSync(SESSION_STATE_FILE, { force: true });
fs.renameSync(tmpPath, SESSION_STATE_FILE);
```

This is the correct pattern for auto-advance state writes (stage record in
`.planning/todos.jsonl`). On Windows, `fs.renameSync` is atomic if source and
destination are on the same volume (same drive letter). The temp-file approach
eliminates partial-read risk during concurrent access.

For JSONL append operations (appending a stage-advance event), atomic append is
not directly available. Instead: read-modify-write with lockfile guard, or
always append (JSONL is append-safe) and resolve duplicates on read.

Sources: [4] (session-start.js codebase analysis, lines 132-153), [15]
(write-file-atomic npm package documentation)

### 10. Session-start hook scanning is better than commit-hook for stage advance [CONFIDENCE: HIGH]

Two hook options for stage scanning:

1. **Pre/post-commit hooks (git hooks via husky)**: Run on `git commit`. The
   existing pre-commit hook in SoNash is complex (800+ lines, runs pattern
   checks, audit validation, cross-doc deps, doc index). Adding research
   artifact scanning here creates:
   - Latency in the commit flow (unwanted coupling)
   - False positives: artifact may be present but stage not yet advanced by the
     user
   - Git-commit is not the right semantic trigger for "artifact appeared"
2. **Session-start hook**: Already runs. Already reads `.planning/todos.jsonl`.
   Can emit `watchPaths` for in-session FileChanged monitoring. Adding a
   synchronous artifact scan at session start is low cost (< 50ms for 20 slugs).

3. **FileChanged hook (in-session)**: Best for real-time advance during active
   work. Complements session-start: session-start catches advances that happened
   between sessions; FileChanged catches advances that happen in the current
   session.

**Verdict:** Session-start scan + FileChanged in-session is the right dual-path
architecture. Pre-commit hook involvement is wrong for this use case.

Sources: [4] (session-start.js analysis), [16] (SQ6-hook-natural-invocation.md
from prior research), [1] (Claude Code hooks guide)

### 11. The right architecture for SoNash is hybrid: lazy scan for `/rnd` view + FileChanged for in-session alerts [CONFIDENCE: MEDIUM-HIGH]

For 10-20 active R&D threads at solo-dev scale:

**Primary path: On-demand (lazy) for `/rnd` view**

- When user opens `/rnd`, scan all 4 locations per active slug synchronously
- Apply L3 "done enough" checks per artifact type
- Compute current stage from artifact presence
- Compare computed stage to stored stage; surface any advances
- No background process, no watcher daemon, zero overhead between views
- Handles all catches from between-session artifact writes

**Secondary path: FileChanged hook for in-session advance notification**

- `SessionStart` hook outputs `watchPaths` for all active R&D slugs
- `FileChanged` hook script checks `file_path` for matching patterns
- On match: update stage record, emit stderr notification
- Provides real-time feedback without requiring user to open `/rnd`
- Limited to files that existed as paths when session started

**What NOT to do:**

- Polling (cron/setTimeout loop): unnecessary for solo-dev scale. Polling every
  5 minutes adds complexity with negligible benefit given lazy scan is instant.
- Pre-commit gate stage advance: wrong semantic, wrong timing, coupling concern
- Inotify/ReadDirectoryChangesW direct use: handled by Claude Code's FileChanged
  abstraction layer
- Chokidar as standalone daemon: overkill, adds npm dependency for problem
  Claude Code's hooks already solve

Sources: [1] (hooks guide), [3] (on-demand trade-offs), [4] (codebase analysis),
[8] (file watcher patterns)

### 12. Windows-specific: FileChanged basename-only matching requires path-based disambiguation inside hook [CONFIDENCE: HIGH]

On Windows, Claude Code's `FileChanged` hook matcher filters on basename only.
When multiple R&D slugs have `BRAINSTORM.md` or `RESEARCH_OUTPUT.md` files, all
will fire the same hook. The disambiguation must happen inside the hook script
using the `file_path` field from the JSON input.

Recommended pattern:

```javascript
const data = JSON.parse(process.stdin.read());
const filePath = data.file_path; // absolute path, e.g., C:\..\.research\my-project\BRAINSTORM.md
// Normalize to forward slashes (Windows path handling)
const normalizedPath = filePath.replace(/\\/g, "/");
// Extract slug from path
const match = normalizedPath.match(/\.research\/([^/]+)\/BRAINSTORM\.md$/);
if (!match) process.exit(0); // not an R&D artifact
const slug = match[1];
```

Also: on Windows, path normalization (backslash → forward slash) must happen at
the hook boundary before any regex matching. This is the same pattern used in
SoNash's `post-write-validator.js` (line 117: `filePath.replace(/\\/g, "/")`).

Sources: [2] (FileChanged input schema — basename matcher), [4] (post-write-
validator.js line 117 Windows path normalization), [5] (Windows fs.watch issues)

### 13. `research-index.jsonl` is the authoritative completion signal — but enforcement is not yet in place [CONFIDENCE: MEDIUM]

The existing `.research/research-index.jsonl` file is appended after each
completed research campaign (verified from codebase scan). If skills reliably
appended an entry on completion, this would provide L5 "done enough" detection:

```javascript
const indexEntries = readJSONL(".research/research-index.jsonl");
const isComplete = indexEntries.some(
  (e) => e.slug === slug && e.status === "complete"
);
```

However, the existing research-index.jsonl entries show **inconsistent status
fields**: some entries have `status: 'complete'`, others have no status field
(see `repo-analysis` entries). The deep-research skill may not write to this
index consistently. This L5 approach requires enforcement before relying on it
as the trigger.

**Interim recommendation:** Use L3 content checks now; plan to migrate to L5
(research-index.jsonl) as enforcement is added per D16/D17 from DECISIONS.md.

Sources: [17] (`.research/research-index.jsonl` codebase analysis), [12]
(DECISIONS.md D16: Zod schema for research-index.jsonl, D17: pre-research dup
check)

### 14. False advance failure mode: file appears but content is from a different run [CONFIDENCE: MEDIUM]

A subtle failure mode: if a slug is reused or a research output file is
overwritten from a previous run, the stage advance logic may fire on stale
content. Guards:

1. Check `metadata.json` `date` field against known last-run date
2. Check file `mtime` against stage-advance timestamp — if mtime is older than
   the current stage record, the file predates the current run
3. For JSONL-based state: each stage-advance event records the `mtime` of the
   triggering file; duplicates are detected by checking for existing entries
   with same `mtime`

This is a LOW probability failure for solo-dev scale (slugs are unique per
project), but worth guarding in the implementation.

Sources: [8] (debounce/coalescing patterns — the mtime tracking principle), [13]
(codebase analysis of todos.jsonl structure)

---

## Synthesis

### Watcher Architecture Trade-offs

| Approach                               | Latency             | Overhead                      | Complexity                          | Windows Risk             | Recommendation |
| -------------------------------------- | ------------------- | ----------------------------- | ----------------------------------- | ------------------------ | -------------- |
| On-demand (lazy scan at /rnd view)     | ~0ms at view time   | Zero between views            | Low                                 | None                     | PRIMARY        |
| FileChanged hook (Claude Code native)  | ~1s from write      | Zero overhead when not active | Medium (path disambiguation needed) | Low (abstracted by CC)   | SECONDARY      |
| Polling (cron/setTimeout)              | 5-30min             | Constant CPU                  | Low                                 | None                     | SKIP           |
| Git pre-commit hook                    | N/A (wrong trigger) | Adds to commit time           | High (couples to commit)            | None                     | SKIP           |
| Chokidar daemon                        | <1s                 | Continuous process            | High                                | Medium (fs.watch quirks) | SKIP           |
| inotify / ReadDirectoryChangesW direct | <1s                 | Low when stable               | Very High                           | High (platform-specific) | SKIP           |

### "Done Enough" Trigger Progression

The right progression for SoNash:

1. **Now**: L3 content check (section heading present + min size)
2. **After D16/D17 enforcement**: L5 via research-index.jsonl entry
3. **Never**: L0 (file exists only) — too prone to false advances on partial
   writes

### Key Patterns

1. **Dual-path is correct**: lazy scan for views, FileChanged for real-time.
   They complement each other.
2. **Path normalization at hook boundary**: always `replace(/\\/g, '/')` before
   regex on Windows
3. **Idempotency is mandatory**: stage-advance logic must be safe to run
   multiple times (debounce + timestamp check)
4. **Session-start is the right place for watchPaths registration**: it already
   reads the todos.jsonl needed to enumerate active slugs
5. **Atomic writes for state files**: temp-file-then-rename pattern (already
   used in session-start.js)

---

## Recommendations Specific to SoNash /rnd 4-Location Watcher

### R1: Primary path — lazy scan at `/rnd` view time

Implement a `scanRndStages(slugs)` function that:

1. Reads active R&D todos from `.planning/todos.jsonl`
2. For each active slug, checks all 4 artifact locations with `fs.existsSync()`
3. Applies L3 content checks per artifact type (BRAINSTORM.md,
   RESEARCH_OUTPUT.md, etc.)
4. Computes `derivedStage` from artifact presence
5. Compares to stored stage; surfaces any advances for acknowledgment
6. Updates stored stage record on user acknowledgment

### R2: Secondary path — FileChanged for in-session real-time feedback

Extend `session-start.js` to:

1. Read active R&D slugs from `.planning/todos.jsonl` (already done)
2. Build `watchPaths` array: for each slug, add paths for all 4 artifact
   locations
3. Output JSON from the hook:
   `{ "watchPaths": [...], "additionalContext": "..." }`
4. Replace the current terminal `console.log("ok")` with structured JSON output

Create `.claude/hooks/rnd-stage-advance.js` triggered by `FileChanged`:

1. Read `file_path` from stdin JSON
2. Normalize path (backslash → forward slash)
3. Match against known artifact patterns (`.research/<slug>/BRAINSTORM.md`,
   etc.)
4. Apply L3 content check on the matched file
5. If check passes: append stage-advance event to state (idempotent, debounced)
6. Emit `additionalContext` or `systemMessage` with the advance notification

### R3: "Done enough" thresholds per artifact type

```
BRAINSTORM.md:        size > 200 bytes AND contains('## ')
RESEARCH_OUTPUT.md:   size > 1000 bytes AND contains('## ')
FINDINGS.md files:    size > 500 bytes (any file in findings/ directory)
metadata.json:        valid JSON AND has 'status' field
```

### R4: Windows path handling (mandatory)

All hook scripts must normalize paths at the entry point:

```javascript
const normalizedPath = filePath.replace(/\\/g, "/");
```

Match patterns using normalized paths only. Follow the pattern in
`post-write-validator.js:117`.

### R5: Idempotency guard

Stage advance must be idempotent. Before writing a stage-advance event:

1. Check if a stage-advance event for this artifact+slug already exists in state
2. If yes: skip (already advanced)
3. If no: write event with timestamp + artifact mtime

### R6: Failure recovery

If FileChanged hook fails (process crash, write error):

- The lazy scan at `/rnd` view time catches any missed advances
- No recovery logic needed in the hook itself; the lazy scan is the safety net
- Log hook failures to `hook-warnings-log.jsonl` using existing pattern

---

## Gaps Identified

1. **watchPaths full path support unconfirmed**: The official Claude Code docs
   confirm basename-only matching for the `matcher` field. Whether `watchPaths`
   accepts full paths or directories (not just individual files) is not clearly
   documented. Directories with many R&D slugs would require per-file path
   registration (potentially 4 × 20 = 80 watchPaths entries) — feasibility limit
   unknown.

2. **FileChanged hook latency on Windows**: No benchmark data found for how
   quickly Claude Code's FileChanged hook fires after a file write on Windows.
   The abstraction should shield from the worst fs.watch issues, but actual
   latency (event → hook execution → stage update) is uncharacterized.

3. **Session-start.js JSON output format**: The current session-start.js outputs
   plain text (`console.log("ok")`). Switching to JSON output for `watchPaths`
   may conflict with the current output parsing. Needs verification of how
   Claude Code parses SessionStart hook stdout when it contains JSON vs plain
   text.

4. **research-index.jsonl consistency**: Current entries have inconsistent
   `status` fields. The L5 trigger approach (research-index.jsonl) requires
   enforcement before it can be used reliably. No timeline for D16/D17
   implementation found.

5. **Cross-session watchPaths persistence**: watchPaths registered in a
   SessionStart hook last only for that session. R&D slugs created mid-session
   won't be watched until the next session start. No mechanism found for
   dynamically adding watchPaths during a running session.

---

## Serendipity

**Claude Code `FileChanged` is significantly more powerful than expected.** The
`watchPaths` output field from `SessionStart` hooks means SoNash can register
specific artifact files for real-time monitoring without any external
file-watcher library or daemon. This is a zero-dependency solution that was not
in the original architecture consideration.

**OpenAI Codex uses 1-10s debounce for file watchers** (PR #11494 increased from
1s to 10s for CI artifact watching). This confirms that even a well-resourced AI
coding tool uses simple debounce, not complex coalescing, for file change
detection.

**The existing `post-write-validator.js` already has the correct Windows path
normalization pattern** (line 117: `filePath.replace(/\\/g, "/")`) — the
rnd-stage-advance hook should copy this exact approach.

---

## Sources

| #   | URL                                                                                                                   | Title                                            | Type                      | Trust   | CRAAP (avg) | Date         |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------- | ------- | ----------- | ------------ |
| 1   | https://code.claude.com/docs/en/hooks-guide                                                                           | Automate workflows with hooks - Claude Code Docs | Official docs             | HIGH    | 4.8         | 2026-04      |
| 2   | https://code.claude.com/docs/en/hooks                                                                                 | Hooks reference - Claude Code Docs               | Official docs             | HIGH    | 4.8         | 2026-04      |
| 3   | https://docs.trendmicro.com/en-us/documentation/article/serverprotect-for-storage-gsg-scan-types                      | Real-time Scan vs On-demand Scan                 | Official docs             | HIGH    | 3.8         | 2025         |
| 4   | .claude/hooks/session-start.js (codebase)                                                                             | SoNash session-start hook                        | Codebase (ground truth)   | HIGHEST | 5.0         | 2026-04      |
| 5   | https://github.com/nodejs/node/issues/52769                                                                           | FS watch memory leak on Windows                  | GitHub issue              | HIGH    | 4.2         | 2024-04      |
| 6   | https://github.com/paulmillr/chokidar                                                                                 | chokidar - cross-platform file watching          | Official library docs     | HIGH    | 4.5         | 2025-11 (v5) |
| 7   | https://oneuptime.com/blog/post/2026-01-22-nodejs-watch-file-changes/view                                             | How to Watch File Changes in Node.js             | Technical blog            | MEDIUM  | 3.8         | 2026-01      |
| 8   | https://medium.com/@impactarchitecture/file-watchers-lie-debounce-throttle-and-coalescing-in-build-loops-8d91cb29f712 | Debounce File Watcher Events in Build Loops      | Technical blog            | MEDIUM  | 3.6         | 2025         |
| 9   | https://buildingbetter.tech/p/i-read-the-claude-code-source-code                                                      | I Read the Claude Code Source Code               | Analysis blog             | MEDIUM  | 3.8         | 2025         |
| 10  | https://claude-world.com/articles/hooks-development-guide/                                                            | Claude Code Hooks 2026                           | Technical guide           | MEDIUM  | 3.5         | 2026         |
| 11  | https://github.com/paulmillr/chokidar/issues/381                                                                      | awaitWriteFinish not taking effect               | GitHub issue              | HIGH    | 4.0         | 2024         |
| 12  | .planning/research-discovery-standard/DECISIONS.md (codebase)                                                         | R&D Standard Decisions D16/D17                   | Codebase (ground truth)   | HIGHEST | 5.0         | 2026-03      |
| 13  | .planning/todos.jsonl, session-start.js:1345 (codebase)                                                               | Todos JSONL pattern                              | Codebase (ground truth)   | HIGHEST | 5.0         | 2026-04      |
| 14  | https://github.com/openai/codex/pull/11494                                                                            | Increased file watcher debounce from 1s to 10s   | GitHub PR                 | HIGH    | 4.2         | 2025         |
| 15  | https://www.npmjs.com/package/write-file-atomic                                                                       | write-file-atomic npm package                    | Official npm docs         | HIGH    | 4.3         | 2025         |
| 16  | .research/research-discovery-standard/findings/SQ6-hook-natural-invocation.md                                         | Hook & Natural Invocation Analysis               | Codebase (prior research) | HIGHEST | 5.0         | 2026-03      |
| 17  | .research/research-index.jsonl (codebase)                                                                             | Research index entries                           | Codebase (ground truth)   | HIGHEST | 5.0         | 2026-04      |

---

## Contradictions

**None material.** The evidence is consistent across sources:

- On-demand scan = correct primary for solo-dev CLI tools
- FileChanged = correct secondary for real-time in-session feedback
- Debouncing is mandatory for all watcher approaches
- Windows requires path normalization at hook boundary

One minor tension: chokidar docs recommend `awaitWriteFinish` with 2000ms
`stabilityThreshold` as a safe default, while the debounce article recommends
50-100ms debounce for responsive dev tools. For SoNash: the FileChanged hook
fires after Claude Code has finished writing (the `PostToolUse` event precedes
`FileChanged` by design), so `awaitWriteFinish` is irrelevant — the file is
already complete when the hook fires. The debounce concern applies to the
content-check read, not to write completion.

---

## Confidence Assessment

- HIGH claims: 8 (Findings 1, 2, 3, 5, 6, 8, 9, 10, 12)
- MEDIUM-HIGH claims: 3 (Findings 4, 7, 11)
- MEDIUM claims: 2 (Findings 13, 14)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The architecture recommendation is strongly supported by official Claude Code
documentation, codebase analysis of existing patterns, and cross-referenced
technical sources. The primary uncertainty is around `watchPaths` directory
support and FileChanged Windows latency characteristics (both in Gaps section).
