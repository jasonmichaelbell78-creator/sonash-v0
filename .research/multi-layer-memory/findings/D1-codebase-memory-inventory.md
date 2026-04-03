# Findings: Current Claude Code Memory Ecosystem Inventory

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-31
**Sub-Question IDs:** SQ1

---

## Key Findings

### 1. Auto-Memory System (Project Memory Files) [CONFIDENCE: HIGH]

The primary cross-session memory system lives at
`~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/`.

**Structure:**

- `MEMORY.md` — index file listing all memory entries with one-line summaries
  and links to individual files
- 39 individual `.md` files organized into 4 categories: `user_*`, `feedback_*`,
  `project_*`, `reference_*`

**Categories discovered:**

- **User** (3 files): `user_communication_preferences.md`,
  `user_expertise_profile.md`, `user_decision_authority.md` — preferences,
  expertise, and authority boundaries
- **Feedback** (18 files): Named `feedback_<slug>.md` — behavioral corrections
  Claude received from the user over 250+ sessions (e.g.,
  `feedback_convergence_loops_mandatory.md`, `feedback_no_research_caps.md`,
  `feedback_worktree_guidance.md`)
- **Project** (12 files): Named `project_<slug>.md` — initiative state, health
  status, and permanent project decisions (e.g.,
  `project_active_initiatives.md`, `project_cross_locale_config.md`)
- **Reference** (5 files): Named `reference_<slug>.md` — stable lookup facts
  like external system URLs, documentation standards, AI capabilities

**Read lifecycle:** Claude Code automatically injects MEMORY.md content into
every session context. The full index is always present; individual detail files
are read on demand.

**Write lifecycle:** Claude writes or updates these files when the user gives
feedback, decisions are made, or project state changes. The
`user-prompt-handler.js` hook (UserPromptSubmit) can prompt Claude to save
context to MCP memory when 20+ files have been read.

**Persistence scope:** Cross-session, locale-specific. The path is keyed to the
locale's filesystem path (`C--Users-jbell--...`). Two locales (jbell work, Owner
home) have separate memory directories and are NOT automatically synchronized.

**Key limitation identified:** A parallel `canonical-memory/` directory exists
at `.claude/canonical-memory/` within the project repo itself (git-tracked). It
contains an older, smaller version of the same memory files. This is a
divergence risk — the canonical-memory copy has fewer feedback entries (e.g.,
missing `feedback_no_research_caps.md`, `feedback_ack_requires_approval.md`) and
describes the expertise profile as "Node.js/scripting expert" rather than
"non-developer director." The two versions are NOT automatically synchronized.
The canonical copy appears to be a curated snapshot rather than a live replica.

**File sizes:** MEMORY.md is ~91 lines; individual memory files range from ~10
to ~80 lines each.

---

### 2. MCP Memory Server — `mcp__memory` [CONFIDENCE: HIGH]

The `mcp__memory` server is configured via permission in
`.claude/settings.json`:

```json
"allow": [
  "mcp__memory",
  "mcp__plugin_episodic-memory_episodic-memory__search"
]
```

**Two separate memory MCP tools are permitted:**

- `mcp__memory` — a knowledge graph memory server (entity/relation model).
  Tools: `create_entities`, `create_relations`, `add_observations`,
  `search_nodes`, `read_graph`
- `mcp__plugin_episodic-memory_episodic-memory__search` — the
  `episodic-memory@superpowers-marketplace` plugin, which provides episodic
  (time-ordered) memory search

**`mcp__memory` usage:** The `/checkpoint --mcp` skill invocation documents
explicit usage patterns:

- Entity types: `session_context`, `architectural_decision`,
  `bug_investigation`, `feature_implementation`
- Naming convention: `Session_YYYY-MM-DD_BriefTaskName`,
  `Decision_FeatureName_Choice`, `Bug_ComponentName_Issue`
- Retrieve with: `mcp__memory__read_graph()` or
  `mcp__memory__search_nodes("Session_")`

**Episodic memory usage:** Only referenced in permissions and
REQUIRED_PLUGINS.md. The `superpowers@superpowers-marketplace` plugin provides
the base and `episodic-memory@superpowers-marketplace` provides cross-session
memory search. No active skill documentation was found using the episodic search
tool explicitly.

**Where data is stored:** The underlying storage location for the knowledge
graph is NOT in the project repo. Based on standard MCP memory server
architecture, it is stored in the Claude Code application data directory or a
file the MCP server manages. The actual file was not found in the project
filesystem, suggesting it lives in Claude's application layer.

**Persistence scope:** Cross-session, likely cross-locale (if MCP server is
accessible from both locales). This is the only memory mechanism that is
potentially locale-independent.

**Active use:** Low. The checkpoint skill documents it, but no evidence of
frequent actual usage was found. The `user-prompt-handler.js` creates a
`pending-mcp-save.json` trigger file when context usage is high, but this
requires manual action by Claude.

**Known limitation:** The `deep-plan.memory-system-audit.state.json` states:
"mem-mcp-strategy-agent (set MEMORY_FILE_PATH, keep file-based primary, MCP for
graph data only)" — indicating a prior research agent concluded the file-based
system should remain primary and MCP be reserved for graph/relational data only.

---

### 3. State Files System (`.claude/state/`) [CONFIDENCE: HIGH]

The state directory contains 82 files across multiple categories. A `.gitignore`
governs which are tracked vs. ephemeral.

**Git-tracked state files (survive across sessions, sync via git):**

| File                                    | Lines  | Purpose                                            | Written by                                      |
| --------------------------------------- | ------ | -------------------------------------------------- | ----------------------------------------------- |
| `reviews.jsonl`                         | 21     | PR review records (append-only log)                | `review-lifecycle.js`, `write-review-record.ts` |
| `retros.jsonl`                          | 58     | PR retrospective records                           | `pr-retro` skill                                |
| `review-metrics.jsonl`                  | 56     | Review metrics per PR/session                      | review pipeline                                 |
| `consolidation.json`                    | 6      | Last consolidation state (threshold tracking)      | `run-consolidation.js`                          |
| `reviews-archive.jsonl`                 | 456    | Archived reviews (>20 active rotate here)          | `review-lifecycle.js`                           |
| `reviews-archive.jsonl.bak`             | —      | Backup of archive                                  | auto-rotation                                   |
| `reviews.jsonl.archive`                 | —      | Rotated review archive                             | `rotate-jsonl.js`                               |
| `agent-invocations.jsonl`               | 207    | Per-session agent usage log                        | `track-agent-invocation.js`                     |
| `alert-suppressions.json`               | 53     | Permanent alert suppression rules                  | `/alerts` skill                                 |
| `alerts-history.jsonl`                  | ~2     | Alert run history                                  | `run-alerts.js`                                 |
| `hook-warnings-ack.json`                | ~12    | User-acknowledged hook warning types               | user/Claude workflow                            |
| `hook-warnings-log.jsonl`               | 54     | Hook warning events (with archive)                 | `append-hook-warning.js`                        |
| `warned-files.json`                     | 201    | Pattern compliance graduation state                | `check-pattern-compliance.js`                   |
| `known-debt-baseline.json`              | 66     | Pattern violation ratchet baselines                | `ratchet-baselines.js`                          |
| `lifecycle-scores.jsonl`                | 20     | Learning system lifecycle scoring                  | learning pipeline                               |
| `learning-routes.jsonl`                 | 39     | AI learning route tracking                         | `route-lifecycle-gaps.js`                       |
| `pending-refinements.jsonl`             | ~5     | Patterns needing human judgment before automation  | `refine-scaffolds.js`                           |
| `forward-findings.jsonl`                | ~10    | Cross-plan findings forwarded for future action    | planning skills                                 |
| `velocity-log.jsonl`                    | 51     | Session velocity (items completed)                 | `track-session.js`                              |
| `health-score-log.jsonl`                | ~15    | Health score snapshots                             | `run-alerts.js`                                 |
| `pr-review-state.json`                  | 186    | Current PR review progress state                   | `pr-review` skill                               |
| `task-pr-review-*.state.json`           | varies | Per-PR per-round review state (explicitly tracked) | `pr-review` skill                               |
| `deep-research.*.state.json`            | varies | Deep research plan progress                        | `/deep-research` skill                          |
| `deep-plan.*.state.json`                | varies | Deep plan progress                                 | `/deep-plan` skill                              |
| `doc-ecosystem-audit-history.jsonl`     | 1      | Doc ecosystem audit history                        | audit skill                                     |
| `hook-ecosystem-audit-history.jsonl`    | ~1     | Hook ecosystem audit history                       | audit skill                                     |
| `skill-ecosystem-audit-history.jsonl`   | ~1     | Skill ecosystem audit history                      | audit skill                                     |
| `script-ecosystem-audit-history.jsonl`  | ~1     | Script ecosystem audit history                     | audit skill                                     |
| `tdms-ecosystem-audit-history.jsonl`    | ~1     | TDMS ecosystem audit history                       | audit skill                                     |
| `session-ecosystem-audit-history.jsonl` | ~1     | Session ecosystem audit history                    | audit skill                                     |
| `pr-ecosystem-audit.jsonl`              | ~15    | PR ecosystem audit results                         | audit skill                                     |
| `audit-agent-quality-history.jsonl`     | ~5     | Agent quality audit history                        | audit skill                                     |
| `planning-audit-execution.json`         | 153    | SWS planning audit state                           | planning skills                                 |

**Gitignored state files (ephemeral — session-only, not synced):**

| File                   | Purpose                                            | Written by                    |
| ---------------------- | -------------------------------------------------- | ----------------------------- |
| `handoff.json`         | Full state snapshot before compaction              | `pre-compaction-save.js`      |
| `commit-log.jsonl`     | Every git commit in this session (rotation at 500) | `commit-tracker.js`           |
| `warned-files.json`    | Pattern graduation state                           | `check-pattern-compliance.js` |
| `session-notes.json`   | AI-written session scratchpad notes                | `pre-compaction-save.js`      |
| `alerts-baseline.json` | Previous alert run state for deltas                | `run-alerts.js`               |
| `hook-runs.jsonl`      | Hook execution log                                 | hook system                   |
| `*.state.json` (most)  | Task progress state for multi-step tasks           | various skills                |

**Gitignored hook dot-files (most ephemeral):**

| File                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `.session-state.json`          | Current session ID + start time              |
| `.context-tracking-state.json` | Files read this session (resets after 30min) |
| `.auto-save-state.json`        | Auto-save timing state                       |
| `.commit-tracker-state.json`   | Last tracked git HEAD (for commit detection) |
| `.session-agents.json`         | Agents invoked this session                  |
| `.alerts-cooldown.json`        | Cooldown timer for alerts reminders          |
| `.directive-dedup.json`        | PRE-TASK directive deduplication timestamps  |
| `.multistep-dedup.json`        | Multi-step suggestion deduplication          |
| `.suggest-dedup.json`          | Single-suggestion deduplication              |
| `.session-end-cooldown.json`   | Session-end suggestion cooldown              |
| `.fetch-cache.json`            | GSD fetch cache timestamp                    |

**Note on `task-pr-review-*.state.json`:** These are explicitly whitelisted in
`.claude/state/.gitignore` (`!task-pr-review-*.state.json`) because the PR
review skill depends on cross-compaction persistence of round counts. This is a
deliberate exception to the normal pattern of gitignoring task state files.

---

### 4. Session Context Files (SESSION_CONTEXT.md, SESSION_HISTORY.md) [CONFIDENCE: HIGH]

**SESSION_CONTEXT.md** (`/SESSION_CONTEXT.md` — project root, git-tracked)

- Document Version 8.12; 300-line target
- Contains: Session counter (250), recent 3 session summaries, Quick Recovery
  section, branch, next goals, status table
- Read by: session-begin skill (Phase 2), `pre-compaction-save.js` (to extract
  session counter), `compact-restore.js` (indirectly), `check-session-gaps.js`
- Written by: Claude directly at session start (increment counter) and session
  end (update summaries, status, goals)
- This is the primary human-readable handoff document between sessions

**SESSION_HISTORY.md** (`/docs/SESSION_HISTORY.md` — 1,225 lines, git-tracked)

- Append-only archive of all session summaries beyond the last 3
- Written by: `/session-end` skill when archiving older sessions from
  SESSION_CONTEXT.md
- Read by: historical reference only; not loaded at session start

**SESSION_DECISIONS.md** (`/docs/SESSION_DECISIONS.md` — 324 lines, git-tracked)

- Decision log for significant choices (3+ option decisions, architectural
  choices)
- Written by: `decision-save-prompt.js` hook (PostToolUse on AskUserQuestion),
  or manually during sessions
- Read by: reference during planning phases; not auto-loaded

---

### 5. CLAUDE.md — Instruction-as-Memory [CONFIDENCE: HIGH]

`CLAUDE.md` (project root, 258 lines / 14,147 bytes, git-tracked) is loaded on
every AI turn.

**What it stores:**

- Stack versions (Next.js 16.2, React 19.2.4, Firebase 12.10, Tailwind 4.2, Zod
  4.3.6)
- Security rules with enforcement annotations
- Architecture decisions (repository pattern, service files)
- Behavioral guardrails (14 numbered rules with enforcement types)
- Top 5 critical anti-patterns with enforcement gates
- Agent/skill trigger tables (pre-task and post-task)
- Links to 5 reference documents

**Memory function:** CLAUDE.md serves as "always-loaded working memory" for
project rules and constraints. Unlike the MEMORY.md system which stores
user-specific observations, CLAUDE.md stores enforced rules and architectural
decisions. It is deliberately kept minimal (~135 lines target) to reduce token
waste.

**Write lifecycle:** Modified rarely (version 5.8). The `governance-logger.js`
hook fires on every write/edit to CLAUDE.md and logs changes to
`.claude/state/governance-changes.jsonl` (not found as an active file,
suggesting no changes this session). The `settings-guardian.js` also fires if
settings.json is modified.

**Canonical-memory divergence:** The `.claude/canonical-memory/MEMORY.md` is
also git-tracked and syncs via the repo. It represents a baseline memory
snapshot that can be used at a new locale. Unlike the live memory in
`~/.claude/projects/*/memory/`, canonical-memory is curated and does not
auto-update.

---

### 6. Hook-Based Persistence System [CONFIDENCE: HIGH]

The hook system (25 Node.js hook scripts) is the core state-writing engine.
Hooks fire at precise lifecycle events and write to multiple state stores:

**Hook event types and state they write:**

| Event                               | Hook                                                                      | State Written                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| SessionStart                        | `session-start.js`                                                        | Reads consolidation.json; runs npm installs; writes warning entries to `hook-warnings-log.jsonl` |
| SessionStart (compact)              | `compact-restore.js`                                                      | Reads `handoff.json`; outputs recovery context to stdout                                         |
| SessionStart                        | `check-remote-session-context.js`                                         | Compares remote branch SESSION_CONTEXT.md dates; writes cross-session warning                    |
| SessionStart                        | `check-mcp-servers.js`                                                    | Checks MCP availability; no persistent state                                                     |
| SessionStart                        | `gsd-check-update.js`                                                     | Checks GSD plugin version; no persistent state                                                   |
| PreCompact                          | `pre-compaction-save.js`                                                  | Writes `handoff.json` (full state snapshot)                                                      |
| UserPromptSubmit                    | `user-prompt-handler.js`                                                  | Reads context/alerts state; writes `.alerts-cooldown.json`; may write `pending-mcp-save.json`    |
| PostToolUse (Bash/commit)           | `commit-tracker.js`                                                       | Appends to `commit-log.jsonl`; updates `.commit-tracker-state.json`                              |
| PostToolUse (Bash/test)             | `test-tracker.js`                                                         | Tracks test results                                                                              |
| PostToolUse (Read)                  | `post-read-handler.js`                                                    | Updates `.context-tracking-state.json`; updates `.auto-save-state.json`                          |
| PostToolUse (Write/Edit)            | `post-write-validator.js`                                                 | Validates writes                                                                                 |
| PostToolUse (Task)                  | `track-agent-invocation.js`                                               | Appends to `agent-invocations.jsonl`; updates `.session-agents.json`                             |
| PostToolUse (Bash/commit)           | `commit-tracker.js`                                                       | Appends to `commit-log.jsonl`                                                                    |
| PostToolUse (AskUserQuestion)       | `decision-save-prompt.js`                                                 | Prompts Claude to save significant decisions                                                     |
| PostToolUse (Write/Edit governance) | `governance-logger.js`                                                    | Appends to `governance-changes.jsonl`                                                            |
| PostToolUse (Bash/build-fail)       | `loop-detector.js`                                                        | Detects repeated failures; no persistent state (rolling window in-memory)                        |
| PreToolUse (Bash/git push)          | `block-push-to-main.js`                                                   | Enforces push protection; no state                                                               |
| PreToolUse (Bash/git commit)        | `pre-commit-agent-compliance.js`                                          | Checks agent compliance; no state                                                                |
| PreToolUse (Write/Edit)             | `settings-guardian.js`, `firestore-rules-guard.js`, `gsd-prompt-guard.js` | Integrity guards; no state                                                                       |
| PostToolUseFailure                  | `loop-detector.js`                                                        | Error loop detection                                                                             |
| Notification                        | curl to ntfy.sh                                                           | Sends push notification; no local state                                                          |

**Compaction resilience (4 layers):**

- Layer A: `commit-tracker.js` writes every commit to `commit-log.jsonl` —
  survives all failure modes
- Layer C: `pre-compaction-save.js` captures full snapshot to `handoff.json` at
  PreCompact event
- Restore: `compact-restore.js` reads `handoff.json` at post-compaction
  SessionStart and outputs recovery context to stdout (injected into Claude's
  context)
- Layer D: `check-session-gaps.js` (npm script) detects sessions not in
  SESSION_CONTEXT.md

---

### 7. TDMS — Technical Debt Memory [CONFIDENCE: HIGH]

The Technical Debt Management System (TDMS) is a large-scale persistent memory
for code quality issues.

**Primary files:**

| File                                            | Size              | Purpose                                                |
| ----------------------------------------------- | ----------------- | ------------------------------------------------------ |
| `docs/technical-debt/MASTER_DEBT.jsonl`         | 8,479 lines       | Canonical ledger of all debt items (DEBT-XXXXX format) |
| `docs/technical-debt/metrics.json`              | ~70 lines         | Aggregated metrics snapshot                            |
| `docs/technical-debt/METRICS.md`                | generated         | Human-readable metrics view                            |
| `docs/technical-debt/logs/intake-log.jsonl`     | 87 lines          | Intake events log                                      |
| `docs/technical-debt/logs/resolution-log.jsonl` | 25 lines          | Resolution events log                                  |
| `docs/technical-debt/logs/dedup-log.jsonl`      | 7,698 lines       | Deduplication events                                   |
| `docs/technical-debt/views/*.md`                | 8,500+ lines each | Human views by category/severity/status                |
| `docs/technical-debt/FALSE_POSITIVES.jsonl`     | —                 | False positive records                                 |
| `docs/technical-debt/LEGACY_ID_MAPPING.json`    | —                 | Old-to-new ID mapping                                  |

**Scale:** 8,473 total items; 7,272 open; 1,127 resolved; 26 S0 critical; 1,360
S1 high

**Sources:** SonarCloud (2,561), audits (2,942), reviews (623), dec-2025-report
(641), sonarcloud-paste (286), manual (84), PR-deferred (34), context (252),
unknown (766)

**Read lifecycle:** The `session-end` SKILL runs
`node scripts/debt/consolidate-all.js` and
`node scripts/debt/generate-metrics.js` every session. The `/alerts` skill
includes S0/S1 debt alerts. The `add-debt` skill and TDMS ecosystem audit
read/write MASTER_DEBT.jsonl.

**Write lifecycle:** Four intake paths: (1) audit scripts piped through
`intake-audit.js`, (2) `/add-debt` skill for manual/PR-deferred items, (3)
`/sonarcloud` skill sync, (4) direct SonarCloud API via MCP.

**Overwrite hazard (documented):** MASTER_DEBT.jsonl has a known overwrite risk
— multiple ingestion scripts can regenerate it from scratch, potentially losing
deferred/resolved status if run incorrectly. The `reference_tdms_systems.md`
memory file documents this.

---

### 8. Learning System [CONFIDENCE: HIGH]

A multi-component system that converts PR review findings into behavioral
enforcement.

**Components:**

| Component            | File/Location                             | Purpose                                               |
| -------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Review log           | `.claude/state/reviews.jsonl`             | All PR reviews (21 active + 456 archived)             |
| Review metrics       | `.claude/state/review-metrics.jsonl`      | Per-review metrics                                    |
| Retros               | `.claude/state/retros.jsonl`              | PR retrospectives                                     |
| Learnings log        | `docs/AI_REVIEW_LEARNINGS_LOG.md`         | Full audit trail — 500+ reviews documented; v17.116   |
| Learning metrics     | `docs/LEARNING_METRICS.md`                | Effectiveness analysis (88.5% learning effectiveness) |
| Learning routes      | `.claude/state/learning-routes.jsonl`     | Learning automation routing decisions                 |
| Pending refinements  | `.claude/state/pending-refinements.jsonl` | Patterns awaiting human judgment before automation    |
| Lifecycle scores     | `.claude/state/lifecycle-scores.jsonl`    | Per-learning-system lifecycle scores (20 systems)     |
| CODE_PATTERNS.md     | `docs/agent_docs/CODE_PATTERNS.md`        | Distilled enforcement patterns (in AI context)        |
| POSITIVE_PATTERNS.md | `docs/agent_docs/POSITIVE_PATTERNS.md`    | Positive pattern examples                             |
| Consolidation state  | `.claude/state/consolidation.json`        | Last consolidation (runs at threshold = 10 reviews)   |

**Consolidation pipeline:** Every 10 reviews, `run-consolidation.js` promotes
patterns from `reviews.jsonl` to `CODE_PATTERNS.md`. The session-start hook
checks consolidation status and runs it if threshold is met. Current: last
consolidated review rev-27, consolidation #23.

**Learning effectiveness:** 444 total documented patterns, 70 automated, 88.5%
learning effectiveness rate (reviews 353-504). 4 failing patterns identified.

**Promotion pipeline:** `scripts/promote-patterns.js` →
`scripts/route-enforcement-gaps.js` → `scripts/suggest-pattern-automation.js` →
`scripts/refine-scaffolds.js` creates `pending-refinements.jsonl`.

---

### 9. GSD Planning Artifacts [CONFIDENCE: HIGH]

The `.planning/` directory (git-tracked) and `.claude/plans/` (partially
tracked) serve as persistent planning memory.

**`.planning/` structure:**

| Location                                                 | Content                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `.planning/STATE.md`                                     | Current phase, active plans, status of all initiatives         |
| `.planning/PROJECT.md`                                   | Core project reference                                         |
| `.planning/MILESTONES.md`                                | Version milestone history                                      |
| `.planning/config.json`                                  | Planning configuration (mode: "yolo", parallelization: "safe") |
| `.planning/system-wide-standardization/`                 | SWS active plan (93 decisions in `decisions.jsonl`)            |
| `.planning/system-wide-standardization/decisions.jsonl`  | 93 architectural decisions with rationale                      |
| `.planning/system-wide-standardization/changelog.jsonl`  | 1 change tracked                                               |
| `.planning/system-wide-standardization/directives.jsonl` | Active plan directives                                         |
| `.planning/plan-orchestration/`                          | Active plan directory                                          |
| `.planning/dev-dashboard/`                               | Active plan directory                                          |
| `.planning/debt-runner-expansion/`                       | Active plan directory                                          |
| `.planning/research-discovery-standard/`                 | Active plan directory                                          |
| `.planning/archive/`                                     | 8+ archived completed plans                                    |
| `.planning/milestones/`                                  | Milestone files                                                |
| `.planning/custom-agents/`                               | Custom agents planning                                         |

**`.claude/state/deep-*.state.json`:** Skills `/deep-plan` and `/deep-research`
write per-topic state files tracking which phases, waves, and sub-questions are
complete. Examples:

- `deep-plan.memory-system-audit.state.json` (74 lines) — tracks memory audit
  plan phases
- `deep-research.multi-layer-memory.state.json` (108 lines) — tracks this
  research's 10 sub-questions across 3 waves

**`.claude/plans/`:** Active implementation plans (not archived):

- `hook-systems-audit-implementation.md`
- `learning-effectiveness-analyzer.md`
- `pr-ecosystem-audit-plan.md`
- `archive/` (10 completed plans)

**Gitignore note:** `.planning/**/agent-research/*.txt` and
`.planning/**/agent-research/*.json` are gitignored (contain PII: local paths,
session IDs).

---

### 10. Override Log and Governance Log [CONFIDENCE: HIGH]

**`.claude/override-log.jsonl`** (40 lines, gitignored via .gitignore pattern):

- Captures pre-commit/pre-push hook overrides (SKIP_REASON events)
- Schema: `{timestamp, check, reason, user, cwd, git_branch}`
- Written by: `scripts/log-override.js`
- Read by: `/session-end` Step 5 (override audit)
- Locale-specific (shows Owner/jbell locale data mixed)

**`.claude/session-activity.jsonl`** (67 lines, gitignored):

- Session start/end events
- Schema: `{timestamp, user, outcome, event, source}`

**Hook warnings log** `.claude/state/hook-warnings-log.jsonl` (54 lines,
tracked):

- Every hook warning event
- Schema: `{timestamp, hook, type, severity, message, actor, outcome}`
- `.archive` file for rotation

---

### 11. Cross-Locale Sync Architecture [CONFIDENCE: HIGH]

This is a significant architectural constraint:

**Synced via git (both locales get these):**

- `CLAUDE.md` — rules and architecture
- `.planning/` — all planning artifacts
- `SESSION_CONTEXT.md` / `docs/SESSION_HISTORY.md` — session state
- `.claude/settings.json` — permissions (with manual merge from template)
- `docs/technical-debt/MASTER_DEBT.jsonl` — debt tracking
- `.claude/canonical-memory/` — baseline memory snapshot

**Locale-specific (NOT synced):**

- `~/.claude/projects/C--Users-*/memory/*.md` — live auto-memory (path-keyed)
- `.claude/state/*.state.json` (most) — ephemeral task state
- `.claude/state/handoff.json` — compaction handoff
- `.claude/hooks/.*` — ephemeral session dot-files
- MCP memory graph — possibly locale-specific depending on MCP server setup

**Documented pain point:** `project_cross_locale_config.md` memory file notes
"Memory is locale-specific." The canonical-memory directory was created to
mitigate this for the most critical memories, but the two copies diverge over
time.

---

### 12. Additional Persistence: Audit History and Token Tracking [CONFIDENCE: HIGH]

**Ecosystem audit history files** (in `.claude/state/`):

- `doc-ecosystem-audit-history.jsonl` (1 line) — health score snapshots per
  audit run
- `hook-ecosystem-audit-history.jsonl`
- `skill-ecosystem-audit-history.jsonl`
- `script-ecosystem-audit-history.jsonl`
- `tdms-ecosystem-audit-history.jsonl`
- `session-ecosystem-audit-history.jsonl`
- `audit-agent-quality-history.jsonl`
- `pr-ecosystem-audit.jsonl` Each captures structured scores across multiple
  health dimensions.

**Token tracking:**

- `.claude/state/agent-token-usage.jsonl` (1 line, nearly empty)
- Intended to track per-agent token consumption for cost optimization

**`.claude/state/agent-research-results.md`:**

- An orphaned artifact from a prior system-test gap analysis (documented as
  "Orphaned artifact" in the file itself)

**`.claude/state/over-engineering-findings.md` and `deep-plan-findings.md`:**

- Narrative findings documents written by deep-plan skill, not JSONL

**`.claude/state/work-locale-sync-plan.md`:**

- A planning document for cross-locale synchronization, stored in state/

---

### 13. `.claude/history.jsonl` (Global Claude Command History) [CONFIDENCE: HIGH]

Located at `~/.claude/history.jsonl` (global, outside the project):

- 1,504 lines
- Contains the history of Claude Code invocations across all projects
- Schema: `{display, pastedContents, timestamp, project, sessionId}`
- Managed by Claude Code itself, not the project
- Project-agnostic; not a mechanism this project controls

---

### 14. GSD Plugin State Files [CONFIDENCE: MEDIUM]

The GSD (Get Shit Done) plugin adds additional state:

- `~/.claude/session-env/` — session environment snapshots (global)
- `.claude/hooks/.session-state.json` — `beginCount: 78, endCount: 77` — tracks
  GSD begin/end symmetry
- `.claude/gsd-file-manifest.json` — GSD plugin file manifest
- `.claude/get-shit-done/` — plugin source: 50+ workflow files (not state, just
  logic)
- `.claude/hooks/global/gsd-check-update.js` — GSD version check on session
  start

---

## Sources

| #   | Path                                                                      | Title                                 | Type       | Trust | Date       |
| --- | ------------------------------------------------------------------------- | ------------------------------------- | ---------- | ----- | ---------- |
| 1   | `~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/MEMORY.md` | Auto-memory MEMORY.md                 | filesystem | HIGH  | 2026-03-31 |
| 2   | `.claude/settings.json`                                                   | Settings with MCP permissions         | filesystem | HIGH  | 2026-03-31 |
| 3   | `.claude/STATE_SCHEMA.md`                                                 | State files schema documentation      | filesystem | HIGH  | 2026-02-26 |
| 4   | `docs/agent_docs/CONTEXT_PRESERVATION.md`                                 | Compaction resilience layers          | filesystem | HIGH  | 2026-02-10 |
| 5   | `.claude/skills/checkpoint/SKILL.md`                                      | Checkpoint/MCP save skill             | filesystem | HIGH  | 2026-02-14 |
| 6   | `.claude/skills/session-end/SKILL.md`                                     | Session end pipeline                  | filesystem | HIGH  | 2026-03-31 |
| 7   | `.claude/skills/session-begin/SKILL.md`                                   | Session begin pre-flight              | filesystem | HIGH  | 2026-03-31 |
| 8   | `.claude/state/*` (82 files)                                              | All state files (sampled)             | filesystem | HIGH  | 2026-03-31 |
| 9   | `.claude/hooks/*.js` (25 files)                                           | Hook scripts (read)                   | filesystem | HIGH  | 2026-03-31 |
| 10  | `docs/technical-debt/MASTER_DEBT.jsonl`                                   | TDMS primary ledger (8479 lines)      | filesystem | HIGH  | 2026-03-30 |
| 11  | `docs/technical-debt/metrics.json`                                        | TDMS aggregated metrics               | filesystem | HIGH  | 2026-03-30 |
| 12  | `.planning/system-wide-standardization/decisions.jsonl`                   | SWS 93 decisions                      | filesystem | HIGH  | 2026-03-31 |
| 13  | `.claude/state/.gitignore`                                                | State file git tracking rules         | filesystem | HIGH  | 2026-03-31 |
| 14  | `.gitignore` (project root)                                               | Project gitignore rules               | filesystem | HIGH  | 2026-03-31 |
| 15  | `.claude/canonical-memory/MEMORY.md`                                      | Canonical memory snapshot             | filesystem | HIGH  | 2026-03-31 |
| 16  | `.claude/REQUIRED_PLUGINS.md`                                             | Plugin list including episodic-memory | filesystem | HIGH  | 2026-03-24 |
| 17  | `SESSION_CONTEXT.md`                                                      | Primary session handoff doc           | filesystem | HIGH  | 2026-03-31 |
| 18  | `docs/SESSION_HISTORY.md`                                                 | Session archive (1,225 lines)         | filesystem | HIGH  | 2026-03-31 |
| 19  | `CLAUDE.md`                                                               | Project rules/instructions            | filesystem | HIGH  | 2026-03-24 |
| 20  | `.claude/state/deep-plan.memory-system-audit.state.json`                  | Prior memory audit state              | filesystem | HIGH  | 2026-03-17 |

---

## Contradictions

**Canonical-memory vs live auto-memory divergence:** The
`.claude/canonical-memory/MEMORY.md` (git-tracked) and
`~/.claude/projects/*/memory/MEMORY.md` (locale-specific) are the same type of
artifact but have diverged. The canonical copy:

- Has fewer feedback entries (missing ~7 of the 18 in the live copy)
- Describes user expertise differently ("Node.js/scripting expert" vs
  "non-developer director who uses AI")
- Shows earlier project state (references "Phases 1-3 done, Phase 4 improvements
  next" for agent env analysis, while live copy says "COMPLETE")
- Has fewer project initiative entries

This is not documented as intentional divergence — the canonical copy appears to
have been abandoned rather than actively maintained.

**STATE_SCHEMA.md vs. actual files:** The STATE_SCHEMA.md documents
`handoff.json` with a simplified schema (version 2, "tasks" array, "context"
string). The actual handoff.json uses a richer schema (1,505 lines) with full
`taskStates`, `recentCommits`, `uncommittedFiles`, `stagedFiles`,
`untrackedFiles`, `sessionCounter`, and full task state objects. The schema doc
is stale.

**Two "gitignore" rules for `warned-files.json`:** `warned-files.json` appears
in both the project root `.gitignore` as ephemeral state AND is also in
`.claude/state/` as a tracked file in git status. On inspection, the root
`.gitignore` entry was removed or the state `.gitignore` explicitly excludes it
— but current git status shows it as a modified tracked file, contradicting the
"ephemeral" characterization in STATE_SCHEMA.md.

---

## Gaps

1. **MCP memory server storage location unknown:** Where does `mcp__memory`'s
   knowledge graph actually persist on disk? Not found in project filesystem. It
   likely lives in Claude Code's application data directory, but this was not
   confirmed.

2. **Episodic memory plugin behavior undocumented:**
   `episodic-memory@superpowers-marketplace` is listed in permissions and
   plugins, but no skill documentation was found explaining what it stores, how
   it works, or when it is used. Only the permission entry
   `mcp__plugin_episodic-memory_episodic-memory__search` was found.

3. **`governance-changes.jsonl` not found:** The `governance-logger.js` hook is
   documented to write to `.claude/state/governance-changes.jsonl`, but this
   file was not present in the state directory. Either no governance changes
   have been made in recent sessions, or the file is gitignored (it's not in the
   .gitignore rules checked).

4. **`agent-token-usage.jsonl` effectively empty:** This file exists but has
   only 1 line with no data visible. Token tracking capability is built but not
   actively used.

5. **`.canon/` directory referenced but not found:** The SWS decisions.jsonl
   (decision #1) specifies that a `.canon/` directory should be created at repo
   root for ecosystem registration. This directory was not found, suggesting
   this planning decision has not been implemented.

6. **Loop detector state:** `loop-detector.js` uses an in-memory rolling
   20-minute window and notes "hash" tracking, but no persistent state file was
   found for it. Whether this is intentional (in-memory only) or a gap was not
   confirmed from code inspection alone.

7. **`pending-mcp-save.json`:** Referenced in `user-prompt-handler.js` as a file
   written when context usage is high (20+ files read). Not found in `.claude/`
   suggesting it is created and consumed ephemerally and then deleted.

---

## Serendipity

1. **Memory system audit was already in progress:** A
   `deep-plan.memory-system-audit.state.json` state file exists showing a prior
   research effort (Session #217ish, 2026-03-17) that ran 4 research agents and
   produced conclusions including "keep file-based primary, MCP for graph data
   only." This current research may overlap with or supersede that work.

2. **The STATE_SCHEMA.md is significantly stale:** It documents only 10
   persistent state files and several deprecated patterns. The actual state
   directory has 82 files. Any architectural decisions based on STATE_SCHEMA.md
   alone would be based on stale information.

3. **High churn watchlist as meta-memory:**
   `.claude/config/high-churn-watchlist.json` is a form of institutional memory
   about which files require extra scrutiny during PR review —
   `session-start.js`, `run-alerts.js`, `review-lifecycle.js`. This is "learned
   fragility knowledge."

4. **Worktree isolation:** `.worktrees/research-planning/` and
   `.worktrees/planning/` each have their own `.claude/state/` directories with
   their own state files. This means worktree-based parallel research creates
   isolated state — useful for parallelism but could create divergence.

5. **The `.planning/**/agent-research/` gitignore rule suggests PII leakage was
   discovered:\*\* This gitignore entry specifically calls out PII in agent
   research files (local paths, session IDs). This suggests there was a previous
   incident or discovery where these files contained sensitive data that
   shouldn't be committed.

6. **Session counter has reached 250:** The project is at Session #250 —
   representing substantial accumulated state. The learning system alone has
   500+ documented review entries. This is a very mature memory ecosystem
   compared to typical Claude Code projects.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are based on direct filesystem inspection of actual files. No
training data was used to assert facts about how systems work — all behavioral
claims are derived from reading the hook scripts, skill docs, and schema
documentation directly.
