# Findings: Anthropic Official Documentation on Claude Code Memory

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D3b-2a

---

## Key Findings

1. **Official Memory Doc: Two-System Architecture (CLAUDE.md + Auto Memory)**
   [CONFIDENCE: HIGH]

   Anthropic's current canonical doc at `https://code.claude.com/docs/en/memory`
   (redirected from `docs.anthropic.com/en/docs/claude-code/memory`) defines two
   complementary memory systems:
   - **CLAUDE.md files**: human-authored, project/user/org scoped, loaded every
     session in full
   - **Auto memory**: Claude-authored, per-working-tree scope, loaded first 200
     lines / 25KB of `MEMORY.md` per session

   Both are treated as context, not enforced configuration. The doc explicitly
   states: "Claude treats them as context, not enforced configuration."

   Storage layout for auto memory:

   ```
   ~/.claude/projects/<project>/memory/
   ├── MEMORY.md          # index, loaded at session start (200 lines / 25KB cap)
   ├── debugging.md       # topic files, loaded on demand
   └── ...
   ```

   The `<project>` path derives from the git repository root, so all worktrees
   and subdirectories share one memory directory. Outside a git repo, the
   project root is used. [Source 1]

2. **Auto Memory Config: `autoMemoryEnabled` and `autoMemoryDirectory`**
   [CONFIDENCE: HIGH]

   Official doc documents two key config settings:
   - `autoMemoryEnabled` (boolean): toggles auto memory on/off; on by default;
     can also be set via env var `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`
   - `autoMemoryDirectory` (string path): redirects all auto memory writes to a
     custom directory

   Security constraint explicitly documented: `autoMemoryDirectory` is NOT
   accepted from project settings (`.claude/settings.json`) to prevent a shared
   project from redirecting auto memory writes to sensitive locations. It IS
   accepted from policy, local (`settings.local.json`), and user
   (`~/.claude/settings.json`) settings. [Sources 1, 2]

   Version requirement: **Claude Code v2.1.59 or later** required for auto
   memory.

3. **Changelog: Auto Memory Feature Evolution by Version** [CONFIDENCE: HIGH]

   From the official GitHub CHANGELOG at
   `github.com/anthropics/claude-code/blob/main/CHANGELOG.md`:

   | Version | Memory-Related Change                                                                                                |
   | ------- | -------------------------------------------------------------------------------------------------------------------- |
   | v2.1.74 | Added `autoMemoryDirectory` setting for custom storage location; fixed memory leak in streaming API response buffers |
   | v2.1.83 | `MEMORY.md` index now truncates at 25KB as well as 200 lines (dual cap)                                              |
   | v2.1.86 | Memory filenames in "Saved N memories" notice now highlight on hover and open on click                               |
   | v2.1.81 | `--bare` flag added; auto-memory **fully disabled** in bare mode                                                     |

   No Auto Dream entries appear in the CHANGELOG, confirming it has not been
   officially released. [Sources 3, 4]

4. **Auto Dream: Present in UI / Not in Official Docs, Server-Side Gated**
   [CONFIDENCE: MEDIUM]

   Auto Dream (`/dream` command) is visible in the `/memory` UI menu in recent
   Claude Code versions, but:
   - Anthropic has published **zero official documentation** about it
   - It is controlled by a server-side feature flag named `tengu_onyx_plover`
     with `enabled: false`
   - The trigger thresholds hardcoded in the flag: `minHours: 24`,
     `minSessions: 5`
   - Running `/dream` manually returns `Unknown skill: dream` (GitHub issue
     #38426, closed as duplicate of #33914)
   - The system prompt for a dream run reads: "You are performing a dream — a
     reflective pass over your memory files"

   Four-phase cycle from community source code analysis: orient → gather signal
   → consolidate → prune. Operations include: merging duplicate facts,
   converting relative dates to absolute dates, deleting contradicted facts,
   keeping `MEMORY.md` under 200 lines.

   Key technical detail from issue #38426: "A custom skill can't replicate this
   because it runs in a fresh conversation with no access to prior conversation
   history. The value of dreaming is extracting implicit knowledge from past
   conversations into explicit memory." [Sources 5, 6, 7]

5. **Subagent Memory: Official Support for Per-Agent Auto Memory** [CONFIDENCE:
   HIGH]

   The official memory doc explicitly states: "Subagents can also maintain their
   own auto memory." It links to `/en/sub-agents#enable-persistent-memory` for
   configuration. This is a officially supported and documented capability —
   agents can be configured to accumulate their own memory independently of the
   parent session. [Source 1]

6. **GitHub Issues Reveal Unmet Demand and Edge Cases** [CONFIDENCE: MEDIUM]

   Community demand for memory features currently not in official docs:
   - Issue #28276: Request for configurable `autoMemoryDirectory` (shipped in
     v2.1.74 as result)
   - Issue #23750: Request for option to disable auto-memory (shipped as
     `autoMemoryEnabled: false`)
   - Issue #35985: Request for cross-device identity / account-bound memory
     across machines (not implemented; memory remains machine-local per docs)
   - Issue #28960: Request for time-based reminders in MEMORY.md

   These issues confirm the official doc's statement that memory is
   "machine-local" and "not shared across machines or cloud environments" is a
   known limitation with active user demand for a fix. [Source 2]

---

## Sources

| #   | URL                                                                                                | Title                                                                 | Type             | Trust       | CRAAP (avg) | Date           |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------- | ----------- | ----------- | -------------- |
| 1   | https://code.claude.com/docs/en/memory                                                             | How Claude remembers your project - Claude Code Docs                  | official-docs    | HIGH        | 4.8         | Current (2026) |
| 2   | https://github.com/anthropics/claude-code/issues/28276                                             | [FEATURE] Configurable auto-memory storage location                   | github-issue     | MEDIUM-HIGH | 4.0         | 2026           |
| 3   | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md                                   | claude-code CHANGELOG.md                                              | official-source  | HIGH        | 4.8         | Current        |
| 4   | https://github.com/anthropics/claude-code/releases/tag/v2.1.74                                     | Release v2.1.74                                                       | official-release | HIGH        | 4.8         | 2026-03        |
| 5   | https://github.com/anthropics/claude-code/issues/38426                                             | [BUG] /memory references /dream command that doesn't exist            | github-issue     | MEDIUM-HIGH | 4.0         | 2026-03        |
| 6   | https://dev.to/akari_iku/does-claude-code-need-sleep-inside-the-unreleased-auto-dream-feature-2n7m | Does Claude Code Need Sleep? Inside the Unreleased Auto-dream Feature | community-blog   | MEDIUM      | 3.2         | 2026-03        |
| 7   | https://github.com/anthropics/claude-code/issues/38461                                             | AutoDream: /dream returns 'Unknown skill'                             | github-issue     | MEDIUM-HIGH | 4.0         | 2026-03        |

---

## Contradictions

**Auto Dream UI vs. Docs**: The `/memory` command UI in Claude Code presents an
Auto Dream toggle and references a `/dream` command, but Anthropic has published
no official documentation about it, and the `/dream` command returns
`Unknown skill: dream`. The feature exists in the codebase and runs
automatically (server-gated), but the UI-suggested manual invocation path does
not work. This is an inconsistency between UI copy and implemented
functionality, confirmed by multiple GitHub issues.

**"autoMemoryDirectory" scope restriction**: The official doc says the setting
"is not accepted from project settings" (security restriction). GitHub issue
#36636 reports a bug where even when set in allowed locations, the setting "does
not update the memory path in system prompt," suggesting the setting may not
function fully as documented. MEDIUM confidence on actual behavior vs.
documented behavior.

---

## Gaps

- No official Anthropic blog post about Auto Memory or Auto Dream was found at
  `anthropic.com/blog`. All coverage is community-sourced.
- No official roadmap entry for memory features was found. Anthropic does not
  publish a public roadmap for Claude Code.
- The exact version in which Auto Memory was introduced (v2.1.59 mentioned as
  minimum requirement) has no corresponding changelog entry in the fetched
  results — the changelog entries retrieved begin at v2.1.77+. Earlier entries
  were not accessible.
- The `autoDreamEnabled` settings key is referenced in community sources (users
  reporting it in their `settings.json`) but does not appear in the official
  docs. Its exact behavior and whether it has any effect given the server-side
  gate is unclear.
- Official docs do not describe what happens to auto memory data if
  `autoMemoryDirectory` is changed after memory has already accumulated in the
  default location.

---

## Serendipity

**`--bare` mode fully disables auto memory**: The v2.1.81 `--bare` flag (for
scripted `-p` calls) fully disables auto memory. This is relevant if the
research context involves scripted or CI use of Claude Code — bare mode sessions
will not accumulate or read memory at all.

**InstructionsLoaded hook**: The official docs mention an `InstructionsLoaded`
hook that logs exactly which instruction files are loaded, when they load, and
why. This is relevant for building tooling around the memory system — a
hook-based approach to memory observability is officially supported.

**`CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` env var**: Loading CLAUDE.md
from `--add-dir` directories is opt-in via this environment variable, not
automatic. Relevant if the research involves multi-repo or monorepo memory
architectures.

---

## Confidence Assessment

- HIGH claims: 3 (official docs content, changelog entries, subagent memory
  support)
- MEDIUM claims: 2 (Auto Dream behavior, community-confirmed GitHub issues)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** for core Auto Memory system; **MEDIUM** for Auto
  Dream / unreleased features
