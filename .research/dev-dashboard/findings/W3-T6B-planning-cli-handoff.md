# Findings: Planning & Research Tab — CLI Handoff Design

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Scope:** Tab 6 (Planning & Research) — CLI command inventory, clipboard
format, context-aware commands, gap analysis, cross-tab links

---

## Key Findings

### 1. CLI Command Inventory — Research Commands [CONFIDENCE: HIGH]

Three primary research management commands are confirmed from SKILL.md and state
file inspection.

**`/deep-research` — Multi-agent research engine**

| Variant               | Clipboard String                   | Duration                                                | When to Surface                                         |
| --------------------- | ---------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Start new research    | `/deep-research "[topic]"`         | L1: 5–10 min, L2: 3–5 min, L3: 10–20 min, L4: 20–40 min | User clicks "New Research"                              |
| Recall prior research | `/deep-research --recall [topic]`  | <30s                                                    | User clicks topic in research-index list                |
| Re-run with diff      | `/deep-research --refresh [topic]` | Same as new                                             | User wants updated findings on existing topic           |
| Archive research      | `/deep-research --forget [topic]`  | <10s                                                    | User wants to remove topic from index                   |
| Skip plan approval    | `/deep-research "[topic]" --auto`  | Same as above                                           | Used when invoked from another skill (e.g., /deep-plan) |

Depth flags are available but rarely used from the dashboard — default L1 is the
right starting point:

| Flag               | Clipboard String                      | When to Use                   |
| ------------------ | ------------------------------------- | ----------------------------- |
| Standard (default) | `/deep-research "[topic]"`            | Always start here             |
| Deeper coverage    | `/deep-research "[topic]" --depth L2` | When L1 wasn't sufficient     |
| Comprehensive      | `/deep-research "[topic]" --depth L3` | Architecture-level decisions  |
| Exhaustive         | `/deep-research "[topic]" --depth L4` | Pre-roadmap decisions, audits |

Source: `.claude/skills/deep-research/SKILL.md` v1.5 (2026-03-23) and
`.research/research-index.jsonl` (4 entries confirmed).

Output path pattern: `.research/<topic-slug>/` with `RESEARCH_OUTPUT.md`,
`claims.jsonl`, `sources.jsonl`, `metadata.json` retained.

---

### 2. CLI Command Inventory — Planning Commands [CONFIDENCE: HIGH]

**`/deep-plan` — Discovery-first structured planning**

| Variant              | Clipboard String               | Duration                         | When to Surface                                |
| -------------------- | ------------------------------ | -------------------------------- | ---------------------------------------------- |
| Start new plan       | `/deep-plan [topic]`           | S: 20 min, M: 40 min, L: 60+ min | User clicks "New Plan"                         |
| Resume existing plan | `/deep-plan [same-topic-slug]` | Resumes from state file          | User clicks active plan with in-progress phase |

Key behaviors the dashboard should account for:

- Produces three artifacts: `DIAGNOSIS.md`, `DECISIONS.md`, `PLAN.md` at
  `.planning/<topic-slug>/`
- State file path: `.claude/state/deep-plan.<topic-slug>.state.json`
- Phase states visible from state files: `discovery`, `decision-record`,
  `approved`, `executing`, `complete`

Source: `.claude/skills/deep-plan/SKILL.md` v3.0 (2026-03-07). State file
schemas confirmed via `ls .claude/state/deep-plan*.state.json` (8 files active).

**`/task-next` — Dependency-aware task selector**

| Variant                           | Clipboard String       | Duration | When to Surface                  |
| --------------------------------- | ---------------------- | -------- | -------------------------------- |
| Show ready tasks                  | `/task-next`           | <5s      | Primary sprint board action      |
| Show all (ready + blocked + done) | `/task-next --all`     | <5s      | Full ROADMAP view                |
| Show only blocked tasks           | `/task-next --blocked` | <5s      | Debugging what's gating progress |

Underlying script: `node scripts/tasks/resolve-dependencies.js`. Confirmed
working — produces "81 Ready" tasks on current branch. Reads `ROADMAP.md`,
parses `[depends: X1, X2]` annotations, runs Kahn topological sort.

Source: `.claude/skills/task-next/SKILL.md` v1.0 (2026-02-25). Direct script
invocation confirmed via Bash.

---

### 3. CLI Command Inventory — Audit Commands (Planning-Adjacent) [CONFIDENCE: HIGH]

**`/data-effectiveness-audit` — Lifecycle scoring across all data systems**

| Variant                | Clipboard String            | Duration  | When to Surface                                                                            |
| ---------------------- | --------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| Full interactive audit | `/data-effectiveness-audit` | 15–25 min | When lifecycle score drops, after adding JSONL files, or `/alerts` surfaces data staleness |

This command is on the Planning tab (not Health) because its output —
`lifecycle-scores.jsonl` — is shared with the Health tab's lifecycle score
matrix (Tab 1), and its remediation decisions feed into planning (TDMS entries,
enforcement gaps). The CHECKPOINT decisions explicitly list it under Tab 6 CLI.

Key scripts invoked internally (also available as direct script actions):

| Action                         | Command                                        | Purpose                                   |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------- |
| Regenerate lifecycle dashboard | `node scripts/generate-lifecycle-scores-md.js` | Refresh scores display without full audit |
| Route Action<2 gaps            | `node scripts/route-lifecycle-gaps.js`         | Feed enforcement gaps to pipeline         |
| Route enforcement gaps         | `node scripts/route-enforcement-gaps.js`       | Route CLAUDE.md enforcement gaps          |

Source: `.claude/skills/data-effectiveness-audit/SKILL.md` v1.0 (2026-03-13).

---

### 4. Clipboard Command Format — Exact Strings [CONFIDENCE: HIGH]

These are the exact clipboard strings for each Planning tab trigger:

**Research actions:**

```
Start research on [topic]        → /deep-research "[topic]"
Recall research on [topic]       → /deep-research --recall [topic]
Refresh research on [topic]      → /deep-research --refresh [topic]
Archive research on [topic]      → /deep-research --forget [topic]
```

**Planning actions:**

```
Plan [topic]                     → /deep-plan [topic]
Resume plan [topic]              → /deep-plan [topic]
Show next tasks                  → /task-next
Show all tasks                   → /task-next --all
Show blocked tasks               → /task-next --blocked
```

**Lifecycle / data audit:**

```
Run data effectiveness audit     → /data-effectiveness-audit
Regenerate lifecycle scores      → node scripts/generate-lifecycle-scores-md.js
```

**Research → Plan pipeline (combined prompt):**

```
Research then plan [topic]       → /deep-research "[topic]" (then select Option 2 from Phase 5 menu)
```

Note: The research Phase 5 menu already offers `/deep-plan` as option 2. The tab
should surface this as a two-step disclosure ("Research complete — start plan?")
rather than a combined single command.

---

### 5. Context-Aware Commands — Embed Current Topic/Plan Name [CONFIDENCE: HIGH]

When a user is viewing a specific research topic or active plan in the tab, the
dashboard should dynamically construct commands that embed the current slug
rather than showing generic placeholders.

**Research topic selected (from research-index.jsonl):**

- View/recall: `/deep-research --recall [topicSlug]`
- Refresh: `/deep-research --refresh [topicSlug]`
- Start plan from research: `/deep-plan [topicSlug]`
- Archive: `/deep-research --forget [topicSlug]`

The `topicSlug` field is available in `research-index.jsonl` — confirmed field
name from live data: `"topicSlug":"cli-tools"`,
`"topicSlug":"hook-if-conditions"`, etc.

**Active plan selected (from `.claude/state/deep-plan.*.state.json`):**

- Resume: `/deep-plan [topic_slug]` — the state file `topic` or `topic_slug`
  field is the argument
- The state file `phase` field determines label: show "Resume" if phase is not
  "complete" or "approved", show "Re-plan" if complete

The `state.json` file pattern for topic matching:
`deep-plan.<topic-slug>.state.json` — slug extracted from filename as the string
between `deep-plan.` and `.state.json`. Older files use hyphen-separated names
without a dot prefix: `deep-plan-ecosystem-expansion.state.json` vs
`deep-plan.custom-statusline.state.json` — the format diverged historically. The
dashboard parser needs to handle both patterns.

**ROADMAP task selected (from resolve-dependencies.js output):**

- "Work on [task-id]": this requires invoking the task in context of Claude — no
  clean single CLI command exists (see Gap Analysis below)

---

### 6. Active Plans Inventory — Current State [CONFIDENCE: HIGH]

Confirmed from `.claude/state/deep-plan.*.state.json` (8 files) and `.planning/`
directory scan:

| Plan Topic             | State File                                    | Phase/Status         | Plan File                                          |
| ---------------------- | --------------------------------------------- | -------------------- | -------------------------------------------------- |
| hook-if-implementation | `deep-plan.hook-if-implementation.state.json` | `0-complete` (DRAFT) | `.planning/hook-if-implementation/PLAN.md`         |
| repo-cleanup           | `deep-plan.repo-cleanup.state.json`           | `decision-record`    | `.planning/repo-cleanup/PLAN.md`                   |
| custom-statusline      | `deep-plan.custom-statusline.state.json`      | `discovery` (DONE)   | `.planning/custom-statusline/PLAN.md`              |
| memory-system-audit    | `deep-plan.memory-system-audit.state.json`    | `executing`          | —                                                  |
| ecosystem-expansion    | `deep-plan-ecosystem-expansion.state.json`    | `phase_4_approved`   | —                                                  |
| hook-overhaul          | `deep-plan-hook-overhaul.state.json`          | `approved`           | —                                                  |
| review-lifecycle       | `deep-plan-review-lifecycle.state.json`       | `complete`           | —                                                  |
| sws-reeval             | `deep-plan-sws-reeval.state.json`             | —                    | `.planning/system-wide-standardization/PLAN-v3.md` |

Note: The 12-file count from CHECKPOINT was based on a broader scan including
archived and SWS sub-plans. Current active state files = 8. Plans marked
DONE/COMPLETE in `.planning/*/PLAN.md` but still having state files:
`custom-statusline` (DONE), `passive-surfacing-remediation` (DONE),
`propagation-research` (DONE).

---

### 7. Research Index — Live Data [CONFIDENCE: HIGH]

The `research-index.jsonl` is at `.research/research-index.jsonl` (not
`.claude/state/` as listed in some earlier docs). Contains 4 complete entries:

| Topic Slug           | Topic                                | Status   | Claims | Confidence               |
| -------------------- | ------------------------------------ | -------- | ------ | ------------------------ |
| `cli-tools`          | CLI Tools for AI-Directed Workflow   | complete | 45     | HIGH: 41, MED: 2, LOW: 2 |
| `custom-statusline`  | Custom Statusline for Claude Code    | complete | 30     | HIGH: 22, MED: 8         |
| `plan-orchestration` | Optimal sequencing of 7 active plans | complete | 34     | HIGH: 25, MED: 9         |
| `hook-if-conditions` | Claude Code Hook if Conditions       | complete | 45     | HIGH: 34, MED: 11        |

The `research-index.jsonl` has these machine-parseable fields: `topicSlug`,
`topic`, `depth`, `domain`, `completedAt`, `claimCount`, `sourceCount`,
`confidenceDistribution`, `keywords`, `outputPath`, `status`. All four entries
use `"status":"complete"`.

---

### 8. Gap Analysis — Planning Actions With No CLI Command [CONFIDENCE: HIGH]

The following planning actions exist in the UI mental model but have no
corresponding CLI command in any skill:

| Action                                          | Gap Type   | Notes                                                                                                                                                                                                                        |
| ----------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Mark ROADMAP task as done" (`- [ ]` → `- [x]`) | No command | `/task-next` reads ROADMAP but does NOT write to it. The skill description says to check off items (Step 4), but this is executed inline by Claude, not via a command. Dashboard cannot trigger this without a conversation. |
| "Add `[depends: X1, X2]` annotation to a task"  | No command | Dependency annotations are edited manually in ROADMAP.md. No skill manages this.                                                                                                                                             |
| "Start working on task [ID]"                    | No command | `/task-next` shows what's ready, but there's no `/task-start [ID]` command. The transition from "ready" to "in-progress" is implicit in Claude's TodoWrite.                                                                  |
| "View plan details / read PLAN.md"              | No command | Plans live at `.planning/<slug>/PLAN.md`. No read-only viewer command exists. Dashboard should link to file path directly.                                                                                                   |
| "View research report"                          | No command | Reports at `.research/<slug>/RESEARCH_OUTPUT.md`. The Phase 5 menu offers option 7 "view report" but this is interactive, not a clipboard command.                                                                           |
| "Archive a completed plan"                      | No command | No `/deep-plan --archive [slug]` exists. Plan cleanup is manual (`rm .claude/state/deep-plan.<slug>.state.json`).                                                                                                            |
| "Export DECISIONS.md to TDMS"                   | No command | Planning decisions don't feed into TDMS automatically. This is a documented gap (Planning Data lifecycle score `action: 1`).                                                                                                 |
| "Update research-index.jsonl entry"             | No command | Index entries are written by Phase 5 of `/deep-research` automatically. No manual update command exists.                                                                                                                     |
| "Sync ROADMAP.md to JSON"                       | Partial    | CHECKPOINT notes `resolve-dependencies.js` needs a `--json` flag that doesn't yet exist. The text output works but machine-parseable JSON output is a pre-work item.                                                         |

---

### 9. Cross-Tab Links — When Planning Should Link to Other Tabs [CONFIDENCE: MEDIUM]

Based on data overlap and workflow patterns observed from CHECKPOINT decisions
and lifecycle scores:

**Planning → Debt (Tab 2):**

- When a plan phase identifies a blocking debt item (e.g., plan-orchestration
  Wave 2-3 blocked by debt-runner-expansion), the sprint board should surface a
  "Blocked by DEBT-XXXXX" link that navigates to Tab 2 with that item filtered.
- When a planning decision is deferred to TDMS, show a "1 item deferred to Debt"
  badge that links to Tab 2.
- The lifecycle score for "Planning Data" has `action: 1` — the gap is that
  deferred items don't automatically become TDMS entries. Until this is fixed,
  the cross-tab link may need to be triggered manually by the user.

**Planning → Health (Tab 1):**

- `lifecycle-scores.jsonl` is shared between Tab 1 (lifecycle score matrix) and
  Tab 6 (lifecycle score drill-down per CHECKPOINT). When a data effectiveness
  audit improves a score, both tabs should refresh.
- After a major plan phase completes (e.g., Wave 1b in plan-orchestration), the
  user may want to re-run `/ecosystem-health` to confirm the health score
  reflects the changes. The Planning tab should surface "Plan phase complete —
  run health check?" prompt.
- The `data-effectiveness` health dimension (15% weight in the health checker)
  is directly driven by `lifecycle-scores.jsonl`. Low lifecycle scores surface
  on the Health tab as a failing dimension.

**Planning → Build Pipeline / Process Compliance (Tab 4):**

- Agent invocations from planning sessions appear in `agent-invocations.jsonl`
  (Tab 4 data source). When a `/deep-research` or `/deep-plan` session runs,
  agent count spikes are visible on Tab 4.
- No active bidirectional link is needed here — Tab 4 consumes planning session
  data passively.

**Planning → Governance & Audits (Tab 5):**

- No direct link needed. Tab 5 audits the skills themselves (including
  `/deep-research` and `/deep-plan`), but this is a meta-relationship, not a
  workflow trigger from within the tab.

---

## Sources

| #   | Path                                                           | Type             | Trust | Notes                                                  |
| --- | -------------------------------------------------------------- | ---------------- | ----- | ------------------------------------------------------ |
| 1   | `.claude/skills/deep-research/SKILL.md` v1.5                   | Skill definition | HIGH  | Canonical — flags, output paths, phase structure       |
| 2   | `.claude/skills/deep-plan/SKILL.md` v3.0                       | Skill definition | HIGH  | Canonical — phases, state file schema, handoff routing |
| 3   | `.claude/skills/task-next/SKILL.md` v1.0                       | Skill definition | HIGH  | Canonical — flags, script invocation                   |
| 4   | `.claude/skills/data-effectiveness-audit/SKILL.md` v1.0        | Skill definition | HIGH  | Canonical — phases, scripts, lifecycle scoring         |
| 5   | `.research/dev-dashboard/findings/CHECKPOINT-tab-decisions.md` | Prior findings   | HIGH  | Tab 6 scope confirmed; CLI list confirmed              |
| 6   | `.research/research-index.jsonl`                               | Live data        | HIGH  | 4 entries, field schema verified                       |
| 7   | `.claude/state/deep-plan.*.state.json` (8 files)               | Live data        | HIGH  | Active plan states, phase values                       |
| 8   | `.planning/*/PLAN.md` (status headers)                         | Live data        | HIGH  | EXECUTING, DONE, DRAFT statuses confirmed              |
| 9   | `node scripts/tasks/resolve-dependencies.js`                   | Script execution | HIGH  | 81 ready tasks output confirmed live                   |
| 10  | `.claude/state/lifecycle-scores.jsonl`                         | Live data        | HIGH  | Planning Data entry: ls-017, action:1 gap confirmed    |

---

## Contradictions

**State file count discrepancy:** CHECKPOINT-tab-decisions.md states "12 files"
for deep-plan state files. Actual `ls .claude/state/deep-plan*.state.json` shows
8 files. The 12-file count likely included archived state files or a different
scan scope. The dashboard should read live filesystem count, not rely on the
checkpoint figure.

**Planning Data path discrepancy:** `lifecycle-scores.jsonl` entry `ls-017`
lists Planning Data files as
`.planning/system-wide-standardization/decisions.jsonl` and `changelog.jsonl`.
These are SWS-specific files, not a general-purpose planning data store. The
score (6/12, C-grade) reflects only SWS planning data, not all plans. The
lifecycle score for general planning data (`.planning/*/PLAN.md`, state files)
is unscored.

**research-index.jsonl path:** Some documentation references
`.claude/state/research-index.jsonl` but the file actually lives at
`.research/research-index.jsonl`. The dashboard must use the correct path.

---

## Gaps

**ROADMAP task marking has no CLI command.** The `/task-next` skill reads
ROADMAP.md but does not write to it programmatically from a single command. The
step "After completing a task: check off the item in ROADMAP.md" is an
interactive Claude instruction, not a script. If the dashboard needs a "Mark
done" button, a new script (`scripts/tasks/mark-done.js [taskId]`) would need to
be created.

**No `--json` flag on resolve-dependencies.js.** CHECKPOINT notes this as a
pre-work item. Until added, the sprint board either (a) parses the text output
of `resolve-dependencies.js` or (b) reads ROADMAP.md directly and re-implements
the DAG logic client-side. The tab cannot display a clean sprint board without
this.

**Plan phase progress is not standardized.** The `phase` field in deep-plan
state files uses inconsistent values: `"discovery"`, `"0-complete"`,
`"phase_4_approved"`, `"approved"`, `"complete"`, `"decision-record"`. There is
no single enum. The dashboard needs to map these to display states (e.g., In
Progress / Approved / Complete).

**No plan-level "status" field in PLAN.md.** Plan status is embedded in the
`**Status:**` header of PLAN.md in a human-readable string (e.g., "EXECUTING
(both locales complete, Step 25 pending merge)"). There is no machine-parseable
status field — the dashboard must parse this freeform text or fall back to the
state file `phase`.

**`/deep-research --recall` invocation format ambiguity.** The SKILL.md states
`--recall <topic>` searches the index for prior research. It's unclear whether
the argument is the raw topic text or the topic slug. From the
research-index.jsonl, the slug is `hook-if-conditions` and the topic is
`"Claude Code Hook if Conditions — Comprehensive Analysis"`. The clipboard
format should use the slug (shorter, no special chars) but this needs
verification against the actual SKILL.md lookup implementation.

---

## Serendipity

**Research-plan pipeline team exists.** `.claude/teams/research-plan-team.md` is
documented in both SKILL.md files as a mechanism for coordinating
`/deep-research` → `/deep-plan` on the same topic. When the research Phase 5
menu offers `/deep-plan` as option 2, the team can be spawned instead of
sequential solo execution. The dashboard could surface "Research complete —
start coordinated research-plan pipeline?" when a research topic has a matching
plan topic slug.

**`/deep-research --auto` is designed for skill-to-skill invocation.** The flag
skips plan approval but all other checkpoints remain. This is the right mode
when a planning session triggers research internally. The dashboard likely
should NOT surface this flag to the user directly — it's an internal
coordination flag.

**Plan phase self-audit creates invocation tracking.** Both `/deep-plan` and
`/data-effectiveness-audit` call `scripts/reviews/write-invocation.ts` on
completion. This feeds `agent-invocations.jsonl` (Tab 4 data source). The
Planning tab triggering these skills will appear on Tab 4's agent invocations
timeline, creating an implicit cross-tab data flow even without an explicit
link.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All major command strings, flag inventories, file paths, and data schemas were
verified against live filesystem state or confirmed SKILL.md definitions. The
single MEDIUM claim (cross-tab links) is MEDIUM because cross-tab navigation
patterns are design decisions, not discoverable facts — the data relationships
are HIGH confidence but the UX routing decisions are inferred.
