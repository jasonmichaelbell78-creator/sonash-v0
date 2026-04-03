# G5: AutoDream Observable Evidence + G4: autoMemoryDirectory Behavior

**Investigator:** gap-pursuit agent (Session #252) **Date:** 2026-03-31
**Status:** COMPLETE

---

## G4: autoMemoryDirectory Behavior

### 4.1 Current Configuration

**`autoMemoryDirectory` is NOT configured anywhere.**

| Location                                | Setting Present? | Evidence                                                  |
| --------------------------------------- | ---------------- | --------------------------------------------------------- |
| `~/.claude/settings.json` (user-level)  | NO               | Grep returns no matches. Full file read confirms absence. |
| `.claude/settings.json` (project-level) | NO               | Grep returns no matches. Full file read confirms absence. |

The live auto-memory directory remains at the default:
`~/.claude/projects/C--Users-jason-Workspace-dev-projects-sonash-v0/memory/`

### 4.2 Live Auto-Memory Inventory

**44 files** (43 `.md` + 1 `.consolidate-lock`):

- MEMORY.md (index file)
- 22 `feedback_*.md` files
- 11 `project_*.md` files
- 5 `reference_*.md` files
- 3 `user_*.md` files
- 2 other (`sws_session221_decisions.md`, `t3_convergence_loops.md`)
- 1 `.consolidate-lock` (4 bytes, contains PID "7036")

### 4.3 Canonical-Memory Divergence (Exact Quantification)

**`.claude/canonical-memory/` exists in the repo with 25 files.** Last updated
via commits on 2026-03-17 and 2026-03-18. Not touched since.

| Metric                                      | Count                 |
| ------------------------------------------- | --------------------- |
| Files only in live (added since snapshot)   | **21**                |
| Files only in canonical (deleted from live) | **2**                 |
| Files in both (shared)                      | **23**                |
| Total divergence                            | **23 files affected** |

**The research's "~7 divergence" was significantly wrong. Actual divergence is
23 files affected (21 additions, 2 deletions, plus content changes in shared
files).**

#### Files added to live (not in canonical):

```
feedback_agent_stalling_pattern.md
feedback_deep_plan_research_check.md
feedback_deep_research_formula.md
feedback_deep_research_phases_mandatory.md
feedback_grep_vs_understanding.md
feedback_learnings_must_complete.md
feedback_no_agent_budgets.md
feedback_no_autonomous_deferrals.md
feedback_no_broken_widgets.md
feedback_no_premature_next_steps.md
feedback_permissions_cleanup.md
feedback_precommit_fixer_report.md
feedback_statusline_rebuild_safety.md
feedback_user_action_steps.md
project_contrarian_agent_design.md
project_github_health_research.md
project_hook_if_research.md
project_multi_layer_memory.md
project_repo_analysis_skill.md
reference_statusline_architecture.md
user_os_vision.md
```

#### Files removed from live (only in canonical):

```
feedback_parallel_agents_for_impl.md  (content partially absorbed into other files)
feedback_verify_not_grep.md           (superseded by feedback_grep_vs_understanding.md)
```

#### Content changes in shared files:

- **MEMORY.md**: Canonical has 72 lines (with line-wrapping), live has 56 lines
  (single-line entries, different structure). Live version has 21 new entries
  and 2 removed entries. Descriptions updated for multiple existing entries.
- **reference_ai_capabilities.md**: Live version has 8 additional lines
  (Context7, GSD, agent stalling, AutoDream entries).
- **feedback_convergence_loops_mandatory.md**: Content identical, only
  formatting changed (line-wrapping removed in live).
- Multiple other shared files have formatting normalization (line-wrap removal)
  and description updates.

### 4.4 autoMemoryDirectory Impact Analysis

**What would happen if `autoMemoryDirectory` pointed to
`.claude/canonical-memory/`:**

1. **Auto Memory WOULD write there during sessions.** Claude Code writes memory
   files to the configured `autoMemoryDirectory`. Every time the AI creates or
   updates a memory entry, it writes to that path. This is confirmed by the
   observed write patterns: memory files are written during active sessions
   (batches of 6-8 files at session-end, taking 1-2 minutes).

2. **It WOULD dirty the git working tree constantly.** Every session that
   updates memory (which is most sessions) would create unstaged changes in the
   git-tracked directory. Based on observed patterns:
   - March 31: 8 files modified in one session
   - March 29: 5 files modified in one session
   - March 25: 6 files modified in one session
   - This means roughly every session would leave dirty memory files.

3. **Git merge handling of memory conflicts:**
   - MEMORY.md (the index) would conflict frequently since both locales would
     add entries.
   - Individual memory files would rarely conflict (most sessions add NEW files,
     not edit existing ones -- only 2 of 44 files were deleted over 14 days).
   - Content files that ARE shared would produce trivial conflicts (formatting
     changes, description updates).
   - **Realistic merge burden: ~1 MEMORY.md conflict per cross-locale sync,
     occasional individual file conflicts.**

4. **The `.consolidate-lock` file** (PID-based lock) would also appear in git,
   creating noise. This should be added to `.gitignore` if autoMemoryDirectory
   is used.

5. **Recommended mitigations if pursuing this approach:**
   - Add `.consolidate-lock` to `.gitignore`
   - Use session-end as the sync point (commit memory changes as part of
     session-end)
   - Accept that MEMORY.md will need occasional manual merge resolution
   - Consider using `settings.local.json` (not tracked) at each locale for the
     setting itself

---

## G5: AutoDream Observable Evidence

### 5.1 Configuration State

**`autoDreamEnabled: true` IS present in `~/.claude/settings.json`
(user-level).**

This is the only dream-related setting. There are:

- Zero dream-related files in `~/.claude/` (no `*dream*`, `*Dream*` directories
  or files)
- Zero dream-related directories or state files anywhere in the Claude config
  tree
- One `.consolidate-lock` file (PID "7036", born 2026-03-25, modified 2026-03-31
  19:03:56)

### 5.2 Evidence FOR AutoDream Being Active

| Evidence                                                          | Assessment                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoDreamEnabled: true` in settings                              | Config is present, but config != behavior                                                                                                                                                                                                     |
| `.consolidate-lock` file exists                                   | Created 2026-03-25, contains PID 7036. HOWEVER, PID 7036 matches an active session (session 7036 started 2026-03-31 19:02:42). This is session-correlated, not background-correlated.                                                         |
| Two memory files were deleted from live that existed in canonical | `feedback_parallel_agents_for_impl.md` and `feedback_verify_not_grep.md` were removed. This COULD be consolidation (content merged into successor files). But it could equally be Claude deciding during a session that they were superseded. |
| MEMORY.md is shorter in live than canonical (56 vs 72 lines)      | Line count decrease is due to formatting change (removed line-wrapping), not content consolidation. Live actually has MORE entries.                                                                                                           |

### 5.3 Evidence AGAINST AutoDream Being Active

| Evidence                                                | Assessment                                                                                                                                                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zero off-hours file modifications**                   | All 44 memory files were modified during active user hours (11am-9pm CDT). Zero writes at 2am/3am/4am. A background dream process should produce at least some off-hours writes.                                                                                    |
| **All write timestamps correlate with active sessions** | Mar 31 writes (19:08-19:10) happened during session 7036 (started 19:02). Mar 25 writes (16:48-16:49) during a session. Mar 17 writes (18:28-18:29) during a session. No orphan writes.                                                                             |
| **No dream-specific state files**                       | No `*dream*` files, directories, logs, or metadata anywhere in `~/.claude/`. If AutoDream ran, it left zero artifacts beyond the memory files themselves.                                                                                                           |
| **No consolidation metadata**                           | No timestamps, confidence scores, merge records, or provenance tracking in any memory file. Files that show "consolidation" patterns (content from deleted files appearing in new files) are indistinguishable from Claude updating memory during a session.        |
| **`.consolidate-lock` contains a session PID**          | The lock file contains "7036" which is the PID of an active session, not a background process PID. This looks like session-level lock management, not dream-level.                                                                                                  |
| **Research claims conflict**                            | The claims.jsonl itself is contradictory: C-013 says "feature flag tengu_onyx_plover, enabled:false" (not GA), C-123 says "not GA as of March 2026", but C-204 says "confirmed LIVE on this account." The "confirmation" was user assertion, not observed behavior. |
| **Write patterns are session-shaped**                   | Writes come in batches of 6-8 files over 1-2 minutes, with MEMORY.md always written last. This is exactly the pattern of Claude updating memory at session-end, not a background consolidation process.                                                             |

### 5.4 The Deleted Files Test

The strongest potential AutoDream evidence is the 2 files deleted from live that
exist in canonical:

1. **`feedback_verify_not_grep.md`** -- Content about "grep confirms strings
   exist, not features work" is thematically absorbed into
   `feedback_grep_vs_understanding.md` (which covers "grep lacks intelligence").
   But `feedback_grep_vs_understanding.md` does NOT contain the specific "retro
   verification" advice from the deleted file. This looks like a Claude session
   creating a new, broader file and the old one being removed -- not a careful
   merge.

2. **`feedback_parallel_agents_for_impl.md`** -- Content about "use parallel
   agents for implementation" is NOT absorbed into
   `feedback_agent_teams_learnings.md`. The live version of that file focuses on
   operational learnings (read-only constraints, return protocol), not
   implementation strategy. The parallel agents content was simply dropped.

**Assessment: These deletions look like session-driven cleanup (Claude decided
the file was no longer relevant), not algorithmic consolidation (a process that
merges content carefully).**

### 5.5 Verdict

**AutoDream shows no observable evidence of activity on this account despite
`autoDreamEnabled: true` being configured.**

The most likely explanations:

1. **Feature flag is server-gated** -- the client setting enables it, but the
   server hasn't activated it for this account (consistent with claim
   C-013/C-123 about `tengu_onyx_plover` being `enabled:false`).
2. **Feature exists but hasn't fired yet** -- it may require more sessions,
   specific conditions, or a minimum idle period that hasn't been met.
3. **Feature fired but is indistinguishable from normal session behavior** -- if
   AutoDream simply does what Claude does at session-end (update files, update
   index), there would be no observable difference. But in that case, it should
   produce off-hours writes, which we see zero of.

**Confidence: HIGH that AutoDream has NOT performed any observable consolidation
on this account.**

The research claim "AutoDream is live" (C-204) was based on user confirmation,
not observed behavior. The user may have enabled the setting and assumed it was
active. The gap between "setting enabled" and "feature active" is real and
significant.

---

## Recommendations

### For autoMemoryDirectory:

1. **Reconciliation is prerequisite.** The 23-file divergence must be resolved
   before pointing autoMemoryDirectory at canonical-memory. Live has 21 files
   canonical lacks, canonical has 2 files live dropped, and content differs in
   most shared files.
2. **Dirty-tree noise is manageable** if memory commits are batched into
   session-end. Accept ~1 merge conflict per cross-locale sync in MEMORY.md.
3. **Add to `.gitignore`:** `.consolidate-lock` to prevent lock file noise.

### For AutoDream:

1. **Do not depend on it.** Zero evidence of activity. The research
   recommendation to "observe 3-5 sessions" is valid but should have a concrete
   test: create a memory file with known content, wait 5 sessions, check if it
   was consolidated.
2. **Build the consolidation pipeline anyway.** The existing
   `run-consolidation.js` + `consolidation.json` pattern for PR reviews already
   works. Generalizing it to memory files is the right move regardless of
   AutoDream status.
3. **Keep the setting enabled** -- it costs nothing and may activate in a future
   Claude Code update.

### Divergence Summary Table

| Metric                         | Research Claimed | Actual                                    |
| ------------------------------ | ---------------- | ----------------------------------------- |
| Divergence                     | "~7 files"       | 23 files affected (21 added, 2 deleted)   |
| AutoDream status               | "LIVE"           | Setting enabled, zero observable activity |
| autoMemoryDirectory configured | Implied ready    | Not configured anywhere                   |
