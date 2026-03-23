<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Diagnosis: Memory System Audit

**Date:** 2026-03-17 **Task:** Audit the auto-memory system for correctness,
deprecation, optimizations, and other improvements

---

## ROADMAP Alignment

**Aligned (Operational Tooling).** Memory is a core Claude Code feature used
every session. Keeping it accurate directly improves session efficiency.

---

## Current State

### File-Based Memory (Active)

**Location:** `~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/`
**Files:** 6 memories + MEMORY.md index

| File                                  | Type     | Age    | Status                                                                         |
| ------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------ |
| `project_lsp_setup.md`                | project  | 4 days | LIKELY STALE — LSP was set up in Session #218, CLAUDE.md already has Section 6 |
| `feedback_lsp_not_grep.md`            | feedback | 4 days | LIKELY REDUNDANT — duplicates CLAUDE.md Section 6                              |
| `feedback_agent_teams_learnings.md`   | feedback | <1 day | CURRENT — Session #225 learnings, still valuable                               |
| `feedback_stale_reviews_dist.md`      | feedback | recent | CURRENT — still applicable (session-start doesn't build reviews/dist)          |
| `feedback_explore_agents_readonly.md` | feedback | <1 day | CURRENT — but partially overlaps agent_teams_learnings (point #1)              |
| `project_agent_env_analysis.md`       | project  | <1 day | CURRENT — recently updated with Phase 3 completion                             |

### MCP Memory (Empty)

**Status:** MCP memory server is configured and connected, but the knowledge
graph is completely empty (`{"entities":[],"relations":[]}`). Not being used at
all despite being available.

---

## Findings

### F1: Stale/Redundant Memories (2 of 6)

- `project_lsp_setup.md` — Says "after PR #429 closes" and "first task of next
  session." PR #429 closed in Session #218. LSP is already set up. CLAUDE.md
  Section 6 already documents the LSP preference. This memory is **done** —
  should be removed.
- `feedback_lsp_not_grep.md` — Says "use LSP not Grep for symbols." CLAUDE.md
  Section 6 now says exactly this. The memory **duplicates** what's in
  CLAUDE.md. Per the memory rules: "Code patterns, conventions, architecture —
  these can be derived by reading the current project state" should NOT be
  saved.

### F2: Partial Overlap

- `feedback_explore_agents_readonly.md` — Point about Explore agents being
  read-only is already covered as point #1 in
  `feedback_agent_teams_learnings.md`. Two memories for the same insight.

### F3: MCP Memory Not Utilized

- The MCP memory server (`mcp__memory__*`) is configured and functional but has
  zero entities. The `/checkpoint --mcp` option exists but appears never used.
  This is either: (a) intentionally not used, (b) forgotten about, or (c) the
  file-based system is sufficient.

### F4: No User-Type Memories

- All 6 memories are `feedback` (4) or `project` (2). Zero `user` type memories
  exist. The system prompt describes `user` memories as capturing "role, goals,
  responsibilities, knowledge" to tailor behavior. After 225+ sessions, there's
  no user profile stored.

### F5: No Reference-Type Memories

- Zero `reference` type memories exist. No pointers to external systems
  (SonarCloud dashboard, Firebase console, Linear, etc.) are stored.

### F6: MEMORY.md Index Accuracy

- Index shows 5 entries but there are 6 memory files (missing
  `feedback_explore_agents_readonly.md` — wait, actually it IS listed on line 6
  of current MEMORY.md). Index appears current.

### F7: No Lifecycle/Expiry Mechanism

- Project-type memories have no natural expiry. `project_lsp_setup.md` was a
  one-time task that's been done for days but persists. No mechanism to mark
  memories as "completed" or set review dates.

### F8: Cross-Environment Memory

- Memory files are per-project-path, meaning each locale (work vs home) has its
  own memory directory keyed to the project path. If the paths differ, memories
  are NOT shared between locales.

---

### F9: LLM Optimization Issues

- `feedback_agent_teams_learnings.md` is 28 lines — verbose for a memory file.
  Could compress to 8 key bullets without information loss.
- MEMORY.md descriptions vary in specificity — some are precise ("SCHEMA_MAP
  test failures mean scripts/reviews/dist is stale"), others are broad ("Agent
  Teams operational learnings").
- No memory leads with its rule — all embed the rule in narrative context.

### F10: Consistency Issues

- `project_lsp_setup.md` has no `**Why:**` or `**How to apply:**` lines (system
  prompt prescribes these for project types).
- `feedback_lsp_not_grep.md` has no `**Why:**` or `**How to apply:**` lines
  (system prompt prescribes these for feedback types).
- `feedback_agent_teams_learnings.md` DOES have them — inconsistent with above.
- Frontmatter fields vary: some have `name` + `description` + `type`, all should
  but format quality differs.

### F11: Coverage Gaps

- Two-locale workflow (work vs home) is re-established each session but never
  memorized. User's working pattern is rediscovered each time.
- Communication preferences (e.g., "stop summarizing", question batching) are in
  the insights report but not in memory.
- Worktree patterns and git workflow preferences are discussed frequently but
  not persisted.

### F12: Recall Testing Unknown

- No evidence that recall paths have been tested. Would the right memory load
  for "tests are broken after adding a new schema"? Probably — but untested.
- Description quality directly affects recall: broad descriptions like "Agent
  Teams operational learnings" may not trigger for narrow queries like "can
  Explore agents write files?"

### F13: MCP Strategy Undefined

- File-based memory loads automatically (MEMORY.md in every context).
- MCP memory requires explicit tool calls to read/write.
- No defined strategy for when to use which. The `/checkpoint --mcp` option
  exists but no guidance on what goes in MCP vs files.
- MCP graph relationships could express things flat files can't (e.g., "project
  A depends on project B", "user prefers X because of Y").

---

## Audit Categories (9)

| #   | Category          | What It Checks                                       | Findings |
| --- | ----------------- | ---------------------------------------------------- | -------- |
| 1   | Correctness       | Stale, outdated, factually wrong memories            | F1, F2   |
| 2   | Completeness      | Missing memory types, gaps in coverage               | F4, F5   |
| 3   | Process           | Lifecycle, expiry, cleanup mechanisms                | F7       |
| 4   | Cross-environment | Locale behavior, shared vs separate                  | F8       |
| 5   | LLM optimization  | Token cost, description quality, compression         | F9       |
| 6   | Consistency       | Schema adherence, structure uniformity               | F10      |
| 7   | Coverage gaps     | Recurring re-discovery, missing persistent knowledge | F11      |
| 8   | Recall testing    | Can right memory be found from realistic prompts?    | F12      |
| 9   | MCP strategy      | File-based vs MCP graph, division of labor           | F3, F13  |

---

## Reframe Check

This is a small system (6 files) but the 9 audit categories reveal systemic
issues with how memory is managed. The files themselves are easy to fix. The
bigger value is establishing **process and standards** so memory stays healthy
as it grows — and deciding the MCP memory strategy.

**Recommendation:** Proceed with all 9 categories. Fix current memories AND
establish forward-looking guidelines.
