<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Implementation Plan: Memory System Audit

## Summary

Audit, clean up, standardize, and expand the file-based auto-memory system
across both locales (home: `jason`, work: `jbell`). Produce a canonical set at
the home locale, commit to git for cross-locale sync. Deletes 5 stale files,
compresses 4, creates 11 new memories, standardizes all frontmatter, rewrites
MEMORY.md index, and validates with recall testing.

**Decisions:** See DECISIONS.md (18 decisions)
**Effort Estimate:** M (40-60 min)

---

## Files to Create/Modify

### New Files (11)

1. **`memory/user_communication_preferences.md`** — Per D9: 5 interaction
   preferences
2. **`memory/user_expertise_profile.md`** — Per D8: technical background +
   domain comfort levels
3. **`memory/user_decision_authority.md`** — Per D8: delegate vs retain patterns
4. **`memory/project_active_initiatives.md`** — Per D8: what blocks what, active
   work
5. **`memory/project_cross_locale_config.md`** — Per D8: what's shared (git) vs
   locale-specific (memory)
6. **`memory/reference_external_systems.md`** — Per D8/D10: all external URLs
   and system pointers in one file
7. **`memory/reference_documentation_standards.md`** — Per D8: doc format
   conventions
8. **`memory/reference_tdms_systems.md`** — Per D8: TDMS pipeline reference
   (absorbs relevant pipeline-notes.md content)
9. **`memory/reference_ai_capabilities.md`** — Per D8: Claude Code
   capabilities/limitations in this environment (absorbs relevant
   pipeline-notes.md content)
10. **`memory/feedback_code_review_patterns.md`** — Per D8: recurring code
    review corrections
11. **`memory/feedback_execution_failure_recovery.md`** — Per D8: recovery
    patterns when execution goes wrong

### Modified Files (8)

1. **`memory/MEMORY.md`** — Full rewrite: 12-18 word descriptions (D12),
   organized by type, all files indexed
2. **`memory/feedback_convergence_loops_mandatory.md`** — Compress 23→~15 lines,
   add status field
3. **`memory/feedback_deep_plan_hook_discovery_process.md`** — Compress 20→~15
   lines, add status field
4. **`memory/sws_session221_decisions.md`** — Compress 20→~15 lines, add status
   field
5. **`memory/t3_convergence_loops.md`** — Heavy compress 160→~15 lines, add
   status field
6. **`memory/feedback_no_preexisting_rejection.md`** — Add status field only
7. **`memory/feedback_pr_review_state_files.md`** — Add status field only
8. **`memory/feedback_sws_is_meta_plan.md`** — Add status field only
9. **`memory/project_hook_contract_canon.md`** — Light compress 17→15 lines, add
   status field

### Deleted Files (5)

1. **`memory/pattern-compliance-improvements.md`** — Stale (Session #181),
   superseded by hook audit PR #427
2. **`memory/pr407-review-state.md`** — Ephemeral PR state, 16 days old,
   completed
3. **`memory/worktree_planning.md`** — References deleted `planning` branch
4. **`memory/pipeline-notes.md`** — Content redistributed to
   reference_tdms_systems + reference_ai_capabilities
5. **Duplicate directory cleanup** — Remove lowercase-c duplicate memory
   directory

---

## Step 1: Delete Stale Files

Delete the 3 stale memory files and remove the duplicate directory.

**Files to delete:**

- `pattern-compliance-improvements.md` — 77 lines, Session #181, no frontmatter,
  root cause + 9 fixes from before the hook system overhaul. Implemented fixes
  are in the code; unimplemented ones are tracked in TDMS.
- `pr407-review-state.md` — 18 lines, PR #407 review snapshot from Session #198.
  Ephemeral task state, not a memory.
- `worktree_planning.md` — 15 lines, references `planning` branch (deleted) and
  `testing-31126` branch (likely gone).

**Duplicate directory:** Two memory directories exist on home locale:

- `C--Users-jason-Workspace-dev-projects-sonash-v0/memory/` (capital C)
- `c--Users-jason-Workspace-dev-projects-sonash-v0/memory/` (lowercase c)

Identical content. Determine which Claude Code actually reads (check recent
modification times), keep that one, delete the other.

**Done when:** 3 files deleted, duplicate directory resolved, 10 files remain.
**Depends on:** None

---

## Step 2: Compress and Standardize Surviving Files

Apply D16 (frontmatter standard) and D17 (12-15 line target) to all 10
surviving files.

### Frontmatter Standard (D16)

Every memory file must have:

```yaml
---
name: <concise name>
description: <12-18 words with trigger keywords, per D12>
type: <user | feedback | project | reference>
status: <active | completed | stale>
---
```

### Files to Compress

| File | Current | Target | Action |
|------|---------|--------|--------|
| `t3_convergence_loops.md` | 160 | ~15 | Heavy compress. Keep: dual-form decision, tenet wording summary, pointer to /convergence-loop skill. Drop: integration targets table, advanced patterns, session evidence (all belong in the skill). |
| `feedback_convergence_loops_mandatory.md` | 23 | ~15 | Compress the 5-point failure cascade to 2 key bullets. Keep: rule, why, how to apply. |
| `feedback_deep_plan_hook_discovery_process.md` | 20 | ~15 | Compress 5-layer list. Keep: pattern name, 5 layers as single-line each, when to apply. |
| `sws_session221_decisions.md` | 20 | ~15 | Compress Q34-Q38 to single-line summaries. Keep: decision labels, key constraint per decision. |
| `project_hook_contract_canon.md` | 17 | ~15 | Trim 2 lines. Tighten "How to apply" list. |

### Files — Status Field Only

| File | Action |
|------|--------|
| `feedback_no_preexisting_rejection.md` | Add `status: active` to frontmatter |
| `feedback_pr_review_state_files.md` | Add `status: active` to frontmatter |
| `feedback_sws_is_meta_plan.md` | Add `status: active` to frontmatter |

**Done when:** All 10 files have standard frontmatter with status field, all
compressed files are ≤15 lines.
**Depends on:** Step 1

---

## Step 3: Redistribute pipeline-notes.md

Extract valuable content from `pipeline-notes.md` (40 lines) into the new
reference files created in Step 4, then delete.

**Content mapping:**

| pipeline-notes.md Section | Destination |
|--------------------------|-------------|
| Multi-AI Audit Pipeline (JSONL processing, ESM/CJS split, intermediate files) | `reference_ai_capabilities.md` |
| Compaction-Resilient State Persistence (7-layer system) | `reference_ai_capabilities.md` |
| Pre-commit Hook Chain (multi-stage order, skip vars) | Stays in `project_hook_contract_canon.md` as a pointer |
| Agent Context Overflow Prevention (return protocol, wave chunking) | `reference_ai_capabilities.md` |
| Eval Template Regex | `reference_documentation_standards.md` |

**Done when:** All pipeline-notes.md content accounted for in destination files,
original file deleted. 9 files remain.
**Depends on:** Step 1

---

## Step 4: Create 11 New Memory Files

Create all 11 new memories per D8. Each follows D16 frontmatter standard and D17
size target (≤15 lines).

### 4a: User Memories (3 files)

**`user_communication_preferences.md`** — Per D9:

```yaml
---
name: Communication preferences
description: Response style, question batching, delegation, push confirmation, two-locale workflow awareness
type: user
status: active
---
```

Body (5 items): concise responses (no trailing summaries), question batches 5-8,
"your call" = delegation (decide + state why), never push without explicit
instruction, two-locale awareness (work: jbell/restricted, home:
jason/unrestricted).

**`user_expertise_profile.md`**:

```yaml
---
name: Technical expertise profile
description: Deep Node.js/scripting expertise, Firebase comfortable, frontend less familiar, solo developer
type: user
status: active
---
```

Body: Research user's demonstrated expertise across sessions — scripting depth,
Firebase comfort, frontend experience level, tooling preferences. Keep factual,
avoid judgment.

**`user_decision_authority.md`**:

```yaml
---
name: Decision delegation patterns
description: What decisions user delegates vs retains — naming delegate, architecture retain, security retain
type: user
status: active
---
```

Body: Catalog from session patterns — naming (delegate), file locations
(delegate), implementation details (delegate), architecture (retain), security
(retain), scope decisions (retain), what goes in CLAUDE.md (retain).

### 4b: Reference Memories (4 files)

**`reference_external_systems.md`** — Per D10 (one file):

```yaml
---
name: External system URLs and pointers
description: GitHub, SonarCloud, Firebase console, deployment URLs, dashboard locations for quick lookup
type: reference
status: active
---
```

Body: Lookup table of external system URLs — GitHub repo, SonarCloud project,
Firebase console, Vercel/hosting dashboard, any other external URLs discovered
during execution research.

**`reference_documentation_standards.md`**:

```yaml
---
name: Documentation format standards
description: Doc headers, prettier-ignore blocks, version history tables, DOCUMENTATION_INDEX auto-generation
type: reference
status: active
---
```

Body: Header format (prettier-ignore + version/date/status), version history
table format, DOCUMENTATION_INDEX.md generation via `npm run docs:index`, eval
template regex (`/## .*Prompt/`).

**`reference_tdms_systems.md`**:

```yaml
---
name: TDMS pipeline reference
description: MASTER_DEBT.jsonl location, intake/resolve/dedup chain, DEBT-XXXXX ID format, generate-views overwrite risk
type: reference
status: active
---
```

Body: Pipeline chain (intake → dedup → assign-roadmap-refs → generate-views),
critical bug (generate-views OVERWRITES — per existing MEMORY.md entry), JSONL
format, ID format, key scripts.

**`reference_ai_capabilities.md`**:

```yaml
---
name: Claude Code capabilities and limitations
description: MCP servers available, agent constraints, worktree behavior, compaction resilience layers, context overflow prevention
type: reference
status: active
---
```

Body: Absorbs pipeline-notes.md content (compaction layers, agent overflow
prevention, multi-AI pipeline). Add: MCP servers (memory, sonarcloud), Explore
agents are read-only, agent return protocol, worktree behavior.

### 4c: Feedback Memories (2 files)

**`feedback_code_review_patterns.md`**:

```yaml
---
name: Recurring code review corrections
description: Patterns that recur in PR reviews — fix-or-DEBT always, description quality, review bot sequencing
type: feedback
status: active
---
```

Body: Research recurring corrections from PR review history — patterns that get
flagged repeatedly. Include: no pre-existing rejection (pointer to existing
memory), PR description quality, review bot awareness.

**`feedback_execution_failure_recovery.md`**:

```yaml
---
name: Execution failure recovery patterns
description: Stop-and-ask on failure, no blind retries, verify diagnosis before acting, no brute-force
type: feedback
status: active
---
```

Body: Don't retry failed approaches blindly, stop and ask when blocked, verify
diagnosis before acting (per convergence loops), don't use --no-verify or
destructive shortcuts.

### 4d: Project Memories (2 files)

**`project_active_initiatives.md`**:

```yaml
---
name: Active initiatives and dependencies
description: SWS re-evaluation active, hook overhaul active, planning audit Wave 5 pending, what blocks what
type: project
status: active
---
```

Body: Current active initiatives with dependencies. Research from ROADMAP.md,
SESSION_CONTEXT.md, and .planning/ directories during execution.

**`project_cross_locale_config.md`**:

```yaml
---
name: Cross-locale configuration
description: Work (jbell) vs home (jason) locale differences — shared via git, memory locale-specific, canonical set committed
type: project
status: active
---
```

Body: What's shared (CLAUDE.md, codebase, .claude/state/ via git) vs
locale-specific (memory directory, .claude/settings.json). Canonical memory set
committed to repo for sync (per D15 amendment).

**Done when:** 11 new files created, all with standard frontmatter, all ≤15
lines.
**Depends on:** Steps 1-3 (pipeline-notes.md redistribution must happen first
for reference_tdms_systems and reference_ai_capabilities content)

---

## Step 5: Fold Work-Locale-Only Memories

Three work-locale files have value but can't be read from home:

| Work-Locale File | Action |
|-----------------|--------|
| `feedback_agent_teams_learnings.md` (28 lines) | Merge D3 content (explore-agents-readonly) + compress to ≤15 lines. Recreate in canonical set based on DIAGNOSIS description + D3 merge. **Verify content at work locale.** |
| `feedback_stale_reviews_dist.md` | Include in canonical set. Content: "SCHEMA_MAP test failures mean scripts/reviews/dist is stale — rebuild with npm run reviews:generate." **Verify at work locale.** |
| `project_agent_env_analysis.md` | Include in canonical set with updated description (D4: Phase 3 done). **Verify at work locale.** |

**Approach:** Create best-effort canonical versions from DIAGNOSIS descriptions.
Mark with `status: unverified` in frontmatter. When at work locale, read the
actual files, correct content if needed, flip status to `active`.

**Done when:** 3 work-locale files created in canonical set with `status:
unverified`.
**Depends on:** Step 4

---

## Step 6: Rewrite MEMORY.md Index

Full rewrite per D12 (12-18 word descriptions with trigger keywords).

**Structure:** Organize by type, not by initiative. Each entry is a link +
description.

```markdown
# Auto Memory - sonash-v0

## User
- [Communication preferences](user_communication_preferences.md) — ...
- [Expertise profile](user_expertise_profile.md) — ...
- [Decision authority](user_decision_authority.md) — ...

## Feedback
- [Convergence loops mandatory](feedback_convergence_loops_mandatory.md) — ...
- [No pre-existing rejection](feedback_no_preexisting_rejection.md) — ...
- ...

## Project
- [Active initiatives](project_active_initiatives.md) — ...
- ...

## Reference
- [External systems](reference_external_systems.md) — ...
- ...
```

Migrate the inline MEMORY.md content (User Preferences, Skill Execution
Discipline, Critical Bug, etc.) into the appropriate memory files. MEMORY.md
becomes an INDEX ONLY — no memory content directly in the index.

**Done when:** MEMORY.md is index-only, every memory file has an entry with
12-18 word description, organized by type. No inline content remains.
**Depends on:** Steps 4-5 (all files must exist first)

---

## Step 7: Commit Draft Canonical Set to Git

Per D15 amendment: commit the draft canonical set to the repo so the work locale
can access it for comparison.

1. Copy the entire memory directory to a git-tracked location (e.g.,
   `.claude/canonical-memory/`)
2. Commit to `plan-implementation` branch with message indicating DRAFT status
3. Push to remote

**Done when:** Draft canonical set committed and pushed.
**Depends on:** Step 6

---

## Step 8: Work-Locale Verification & Final Canonical Set

**Execute at work locale (next day).** This is where the final memory system
takes shape.

### 8a: Compare Locales

1. Pull `plan-implementation` to get the draft canonical set
2. Read ALL work-locale memory files (the `jbell` directory)
3. Diff against the draft canonical set — file by file:
   - Files only in work locale → triage: fold into canonical or discard
   - Files only in canonical → confirm they don't duplicate work-locale content
   - Files in both → compare content, keep the richer version

### 8b: Verify Work-Locale-Only Files

Three files were created from DIAGNOSIS descriptions (Step 5) with `status:
unverified`:

| File | Verification |
|------|-------------|
| `feedback_agent_teams_learnings.md` | Read actual work-locale file. Compare with canonical draft. Correct content, incorporate D3 merge (explore-agents-readonly folded in). |
| `feedback_stale_reviews_dist.md` | Read actual work-locale file. Confirm still applicable (session-start still doesn't build reviews/dist). |
| `project_agent_env_analysis.md` | Read actual work-locale file. Apply D4 update (Phase 3 done). Verify current project status. |

### 8c: Handle Work-Locale Stale Files

Per DIAGNOSIS, the work locale has files to clean up:

| File | Action |
|------|--------|
| `project_lsp_setup.md` | Delete (D1) — obsolete |
| `feedback_lsp_not_grep.md` | Delete (D2) — redundant with CLAUDE.md |
| `feedback_explore_agents_readonly.md` | Delete (D3) — merged into agent_teams_learnings |

### 8d: Produce Final Canonical Set

1. Merge verified work-locale content into the canonical set
2. Flip all `status: unverified` to `status: active`
3. Run recall testing (Step 9) against the final set
4. Copy final canonical set to BOTH locale memory directories
5. Commit final version to git (replaces draft)
6. Delete any leftover work-locale-only files that weren't folded in

**Done when:** Both locales have identical, verified memory sets. All files have
`status: active`. Git has the final canonical version.
**Depends on:** Step 7 + physical access to work locale

---

## Step 9: Recall Testing (D18)

Test 5-10 realistic prompts against MEMORY.md descriptions to verify the right
memory would be found. Run AFTER Step 8 (final canonical set) so testing covers
the verified, complete set.

**Test prompts (draft):**

1. "Tests are failing after adding a new schema" → should trigger
   reference_tdms_systems (MASTER_DEBT overwrite risk)
2. "Can Explore agents write files?" → should trigger reference_ai_capabilities
3. "How do I push this branch?" → should trigger user_communication_preferences
   (never push without explicit instruction)
4. "Let me just retry this approach" → should trigger
   feedback_execution_failure_recovery
5. "I'm planning the next SWS phase" → should trigger sws_session221_decisions +
   project_active_initiatives
6. "The PR review bot flagged this as pre-existing" → should trigger
   feedback_no_preexisting_rejection
7. "What's the TDMS pipeline order?" → should trigger reference_tdms_systems
8. "How should I format this doc header?" → should trigger
   reference_documentation_standards
9. "Should I use MCP memory for this?" → should NOT trigger any memory (D14:
   MCP ignored)
10. "What external dashboards should I check?" → should trigger
    reference_external_systems

**Scoring:** Pass = correct memory's description contains matching trigger
keywords. Fail = description doesn't match → revise description.

**Done when:** ≥8/10 prompts pass. Any failures have descriptions revised.
**Depends on:** Step 8

---

## Step 10: Audit Checkpoint

Run code-reviewer agent on all new/modified memory files. Check:

- All files have valid frontmatter (name, description, type, status)
- All descriptions are 12-18 words with trigger keywords
- All files are ≤15 lines (body, excluding frontmatter)
- MEMORY.md is index-only with no inline content
- No orphaned files (every file in directory has MEMORY.md entry)
- No orphaned entries (every MEMORY.md entry points to existing file)
- Both locales have identical file sets

**Done when:** All checks pass.
**Depends on:** Steps 8-9

---

## Execution Summary

### Tonight (home locale — Steps 1-7): Draft Canonical Set

1. **Steps 1-3** sequential: delete stale → compress/standardize → redistribute
2. **Step 4** parallel: create 11 new files (4 subagent groups by type)
3. **Step 5** sequential: create 3 work-locale placeholder files
4. **Step 6** sequential: rewrite MEMORY.md index
5. **Step 7** sequential: commit + push draft to git

### Tomorrow (work locale — Steps 8-10): Final Canonical Set

1. **Step 8** sequential: compare locales → verify → merge → finalize
2. **Step 9** sequential: recall testing on final set
3. **Step 10** sequential: audit checkpoint
