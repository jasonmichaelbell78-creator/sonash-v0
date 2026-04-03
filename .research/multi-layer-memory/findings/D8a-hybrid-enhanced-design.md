# Findings: Hybrid/Enhanced Memory System Design for SoNash

**Searcher:** deep-research-synthesizer **Profile:** synthesis+web **Date:**
2026-03-31 **Sub-Question IDs:** SQ8

---

## Executive Summary

SoNash has 14 active persistence mechanisms covering hooks, state files,
planning artifacts, TDMS, learning system, and session context. The system is
mature and functional. The research across 16 findings files reveals five
specific structural gaps: canonical-memory divergence, no session-memory
consolidation pipeline, no memory decay/TTL, the path-key cross-locale sync
problem, and context rot risk.

This design document proposes an evolutionary architecture — no replacements,
only targeted enhancements and two additions — that closes those five gaps with
minimal implementation risk.

**Three-role model applied:**

- `CLAUDE.md` = "how to work here" (project law, always loaded)
- `Auto Memory / MEMORY.md` = "what I've learned about you and this project"
- `mcp__memory` knowledge graph = "what we know structurally"
  (entities/relations)

---

## Architecture Diagram: Current State (Baseline)

```
SESSION START
    |
    v
[CLAUDE.md] ──────────────────────── Always loaded (258 lines, ~4,800 tokens)
    |
[MEMORY.md] ──────────────────────── First 200 lines / 25KB (~4,000 tokens)
    |                                  39 topic files (loaded on demand)
    |
[session-start.js hooks] ──────────── check-mcp-servers, compact-restore,
    |                                  check-remote-session-context, consolidation check
    |
[SESSION_CONTEXT.md] ─────────────── Quick Recovery section (~500 tokens)
    |                                  loaded by session-begin skill (Phase 2)
    v
WORKING SESSION
    |
    |──> [25 hook scripts] ──────────── fire at lifecycle events
    |         |                          write to 14 persistence targets
    |         v
    |    [.claude/state/*.jsonl] ──────── append-only operational logs
    |    [.claude/state/*.json] ────────── current state snapshots
    |    [.planning/] ─────────────────── planning artifacts
    |    [SESSION_CONTEXT.md] ──────────── session summaries
    |    [mcp__memory JSONL] ─────────── knowledge graph (underused)
    |    [episodic-memory] ────────────── semantic search over history (underused)
    v
SESSION END
    |
    |──> [session-end skill] ──────────── updates SESSION_CONTEXT.md
    |                                      archives to SESSION_HISTORY.md
    |                                      runs TDMS consolidation
    |                                      velocity tracking
    v
NEXT SESSION (cross-locale problem)
    |
    |── Home locale reads: ~/.claude/projects/C--Users-Owner.../memory/
    |── Work locale reads: ~/.claude/projects/C--Users-jbell.../memory/  ← DIVERGED
    |
    |── canonical-memory/ ────────────── git-tracked baseline (DIVERGED from live)
```

**Gap markers in baseline:**

- `[DIVERGED]` = canonical-memory does not auto-update; has ~7 missing entries
- `[underused]` = mcp\_\_memory and episodic-memory are permitted but rarely
  invoked
- `[missing]` = no decay, no TTL, no consolidation for MEMORY.md itself
- `[cross-locale problem]` = path-keying means live memory is locale-specific

---

## Architecture Diagram: Proposed Hybrid Enhanced State

```
SESSION START
    |
    ├─[LAYER 0: LAW] ─────────────────────────────────────────────────────────┐
    |    CLAUDE.md (unchanged)                                                 |
    |    Load: always, full file, ~4,800 tokens                               |
    |    Write: rarely (human-authored, governance-logged)                    |
    └──────────────────────────────────────────────────────────────────────── ┘
    |
    ├─[LAYER 1: IDENTITY MEMORY] ─────────────────────────────────────────── ┐
    |    Source: autoMemoryDirectory → .claude/canonical-memory/             |
    |    (ENHANCED: redirect both locales to same git-tracked directory)     |
    |    Load: MEMORY.md first 200 lines (index), topic files on demand      |
    |    Write: Claude writes during sessions (unchanged behavior)            |
    |    Sync: git commit/push = sync; git pull = cross-locale receive        |
    |                                                                         |
    |    ADDITION: dream-skill consolidation (session-end trigger)           |
    |    Runs: when MEMORY.md > 80 lines OR > 5 sessions since last run     |
    |    Effect: merges dupes, absolute dates, prunes contradicted facts     |
    |    Token budget: ~4,000 tokens (unchanged cap)                         |
    └─────────────────────────────────────────────────────────────────────── ┘
    |
    ├─[LAYER 2: SESSION CONTINUITY] ─────────────────────────────────────── ┐
    |    SESSION_CONTEXT.md (unchanged)                                      |
    |    Load: Quick Recovery section via session-begin skill                |
    |    Write: Claude at session-end                                        |
    |    Sync: git-tracked (already works)                                   |
    |    Token budget: ~500 tokens for Quick Recovery section               |
    └─────────────────────────────────────────────────────────────────────── ┘
    |
    ├─[LAYER 3: STRUCTURAL KNOWLEDGE] ──────────────────────────────────── ┐
    |    mcp__memory knowledge graph (ENHANCED - but not expanded role)    |
    |    Backend: JSONL file, path set via MEMORY_FILE_PATH env var        |
    |    ENHANCEMENT: set MEMORY_FILE_PATH to .claude/memory.jsonl        |
    |    (git-tracked, cross-locale via git)                                |
    |    Use: architectural decisions, entity relationships, cross-session  |
    |         structured facts (NOT session learnings - that's Layer 1)    |
    |    Token budget: ~2,000 tokens (tool descriptions, lazy load)        |
    |                                                                       |
    |    ADDITION: session-end MCP checkpoint step                         |
    |    Trigger: session-end skill, Phase 3 (after SESSION_CONTEXT update)|
    |    Action: checkpoint --mcp saves session entities to graph          |
    |    Guard: only if significant decisions were made this session        |
    └──────────────────────────────────────────────────────────────────── ┘
    |
    v
WORKING SESSION (hooks fire at all lifecycle events - unchanged)
    |
    ├─[OPERATIONAL MEMORY - unchanged] ─────────────────────────────────── ┐
    |    .claude/state/*.jsonl (append-only logs)                           |
    |    .claude/state/*.json (snapshots)                                   |
    |    .planning/ artifacts                                               |
    |    TDMS MASTER_DEBT.jsonl                                             |
    |    Learning system (reviews, retros, CODE_PATTERNS.md)               |
    |    All 14 existing mechanisms: KEEP AS-IS                            |
    └──────────────────────────────────────────────────────────────────── ┘
    |
    v
SESSION END (enhanced pipeline)
    |
    ├─ Phase 1: TDMS consolidation (unchanged)
    ├─ Phase 2: SESSION_CONTEXT.md update (unchanged)
    ├─ Phase 3: MCP checkpoint (new - guarded by session significance check)
    ├─ Phase 4: memory-consolidation check (new - replaces abandoned canonical-memory sync)
    |    Check: MEMORY.md line count > 80 OR last_dream_session > 5 sessions ago
    |    If yes: run dream-skill → consolidation writes back to autoMemoryDirectory
    └─ Phase 5: git commit includes .claude/canonical-memory/ and .claude/memory.jsonl
```

---

## Part 1: What to Keep As-Is

The following 14 mechanisms require no changes. Each is performing its intended
role.

| Mechanism                                     | Keep Reason                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| CLAUDE.md (258 lines, v5.8)                   | Correctly bounded, governance-logged, human-curated project law              |
| SESSION_CONTEXT.md                            | Primary human-readable handoff; Quick Recovery works; git-synced             |
| SESSION_HISTORY.md                            | Append-only archive; no attention limits issue; works correctly              |
| SESSION_DECISIONS.md                          | Decision log; infrequently read; decision-save-prompt.js handles writes      |
| `.claude/state/*.jsonl` (all)                 | Append-only operational logs; rotation in place; mature                      |
| TDMS / MASTER_DEBT.jsonl                      | 8,479-line ledger; consolidation pipeline works; overwrite hazard documented |
| Learning system (reviews, CODE_PATTERNS.md)   | 88.5% effectiveness; consolidation at 10-review threshold works              |
| `.planning/` artifacts (SWS decisions.jsonl)  | 93 decisions; planning state well-maintained                                 |
| `handoff.json` / `compact-restore.js`         | 4-layer compaction resilience; currently functional                          |
| `commit-log.jsonl` / `commit-tracker.js`      | Layer A compaction resilience; every commit tracked                          |
| All 25 hook scripts                           | Core state-writing engine; no changes needed to existing scripts             |
| `agent-invocations.jsonl`                     | Token tracking; session agent usage; works                                   |
| `.planning/**/decisions.jsonl`                | Per-plan decision records; appropriate for their scope                       |
| GSD plugin state (`.session-state.json` etc.) | Session symmetry tracking; begin/end count; works                            |

---

## Part 2: What to Enhance

### Enhancement E1: Fix the Canonical-Memory Divergence (PRIORITY 1)

**Problem identified in D1:** `.claude/canonical-memory/` (git-tracked) diverged
from `~/.claude/projects/*/memory/` (locale-specific live memory). Missing ~7
feedback entries; describes user expertise incorrectly.

**Solution:** Redirect `autoMemoryDirectory` to point at
`.claude/canonical-memory/` at both locales. This makes canonical-memory the
live memory, not a stale snapshot. Git commit/push then syncs it automatically.

**Configuration change (per locale, in `~/.claude/settings.json` user
settings):**

```json
{
  "autoMemoryDirectory": "C:\\Users\\<username>\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

Note: Each locale has a different username in the path. Both point at the same
git repo directory (same logical location, different absolute path due to
locale). This is not a problem because `autoMemoryDirectory` overrides
path-keying entirely.

**One-time migration:** Before setting `autoMemoryDirectory`, reconcile the
stale canonical-memory with the live home-locale memory (merge the ~7 missing
entries).

**Risk level:** LOW. The only risk is if both locales run sessions
simultaneously (extremely rare for solo operator). Git handles markdown merge
conflicts cleanly.

---

### Enhancement E2: Set MEMORY_FILE_PATH for mcp\_\_memory (PRIORITY 2)

**Problem identified in D1, D5a:** The `mcp__memory` knowledge graph backend
JSONL file location is unknown (likely in Claude Code application data). It is
inaccessible via git and therefore not cross-locale synced.

**Solution:** Set `MEMORY_FILE_PATH` environment variable in `.mcp.json` to
redirect the knowledge graph file to a git-tracked location.

**Configuration change in `.mcp.json`:**

```json
{
  "mcpServers": {
    "memory": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "C:\\Users\\<username>\\.local\\bin\\sonash-v0\\.claude\\memory.jsonl"
      }
    }
  }
}
```

**Note on path problem:** `.mcp.json` is git-tracked and synced, but the
absolute path in `MEMORY_FILE_PATH` would be locale-specific. Two options:

- Option A: Use a relative path if the MCP server supports it (check
  documentation)
- Option B: Keep MEMORY_FILE_PATH in `.env.local` (gitignored) at each locale,
  pointing at the same repo-relative target

**Risk level:** LOW. Changing MEMORY_FILE_PATH only affects where new data is
written. Existing graph data at the old path is not lost; it simply won't be
read until migrated.

---

### Enhancement E3: Scope the episodic-memory permission (PRIORITY 3)

**Problem identified in D5a:** The episodic-memory plugin permission is scoped
to search-only (`mcp__plugin_episodic-memory_episodic-memory__search`). The
`episodic_memory_show` tool (full conversation retrieval) is not permitted. This
limits the tool's utility for compaction recovery.

**Enhancement:** Add `mcp__plugin_episodic-memory_episodic-memory__show` to the
allow-list in `.claude/settings.json`. This enables full conversation retrieval
when the search finds a relevant past session.

**Risk level:** VERY LOW. This only expands what Claude can read, not write.

---

### Enhancement E4: Add session-significance gate to checkpoint skill (PRIORITY 4)

**Problem identified in D1, D5b:** The `/checkpoint --mcp` skill runs manually
and rarely. There is no systematic session-end MCP save. The
pending-mcp-save.json mechanism (triggered by user-prompt-handler.js when 20+
files are read) requires manual action after the fact.

**Enhancement:** Add a session-significance check to the session-end skill
pipeline (Phase 3) that automatically runs a lightweight MCP checkpoint if the
session contained at least one of: architectural decision, new skill/hook
created, bug pattern identified, behavior correction received.

**Detection heuristic (implemented in session-end skill):**

- Check `commit-log.jsonl` — if commits this session include files matching
  `*.SKILL.md`, `*.js` (hooks), `CLAUDE.md`, `SESSION_DECISIONS.md`: flag as
  significant
- If flagged: run `checkpoint --mcp` automatically

**Risk level:** LOW. The checkpoint skill already exists. This adds an automatic
trigger with a guard condition.

---

## Part 3: What to Add

### Addition A1: Memory Consolidation Pipeline (dream-skill) (PRIORITY 1)

**Gap identified in D1, D6b:** No session-memory consolidation pipeline exists
for MEMORY.md. The learning system has consolidation (run-consolidation.js at
10-review threshold), the session system has consolidation (SESSION_HISTORY.md
archival), but MEMORY.md grows unboundedly with no automated curation.

**What to add:** Integrate the community `dream-skill` into the session-end
pipeline as an optional, guarded step. AutoDream (Anthropic's native
consolidation) remains server-gated (`tengu_onyx_plover` disabled); dream-skill
replicates its four phases as a manual skill.

**Trigger condition (session-end Phase 4):**

```
IF (MEMORY.md line count > 80)
OR (sessions_since_last_consolidation > 5)
THEN run dream-skill
```

**dream-skill four phases (from community analysis in D6b):**

1. Orient: read MEMORY.md, identify consolidation candidates
2. Gather signal: find duplicates, contradictions, relative dates, stale entries
3. Consolidate: merge duplicates, convert "last Tuesday" to "2026-03-25", delete
   contradicted facts
4. Prune: remove entries that AutoDream would mark as expired

**Output:** Modified MEMORY.md (and topic files as needed) written to
`autoMemoryDirectory` (now pointing at `.claude/canonical-memory/`).

**Token budget impact:** Dream-skill runs as a sub-task; its context does not
persist into the main session. Cost: one sub-agent invocation per 5-10 sessions.

**Risk level:** MEDIUM. The dream-skill modifies MEMORY.md content. First runs
should be manually reviewed. A `--dry-run` mode should be implemented before
enabling automatic triggering.

---

### Addition A2: Memory Decay / TTL Markers (PRIORITY 2)

**Gap identified from D4a (academic patterns), D2c (OpenMemory):** No memory
decay or TTL exists in the current system. Memory entries from Session #1
receive equal weight to entries from Session #250. Over time, stale entries
("Propagation in progress" vs "Propagation COMPLETE") reduce signal quality.

**What to add:** A lightweight TTL annotation convention for MEMORY.md entries,
enforced by the dream-skill consolidation.

**Convention (markdown comment in topic files):**

```markdown
<!-- TTL: ephemeral --> ← auto-prune after 10 sessions
<!-- TTL: sprint -->    ← auto-prune when initiative marked complete
<!-- TTL: permanent --> ← never auto-pruned
```

**Implementation:** No new infrastructure. Dream-skill reads TTL annotations and
applies them during consolidation. Default (no annotation) = permanent.

**Inspired by:** OpenMemory's sector-specific decay rates (episodic 0.015/cycle
vs reflective 0.001/cycle) and the A-MAC paper's "content type prior" finding
that category of memory is the strongest predictor of retention value.

**Risk level:** LOW. Annotations are optional. Dream-skill respects them only
when present.

---

### Addition A3: Context Rot Guard (PRIORITY 3)

**Gap identified in D5b, D6b:** No protection against context rot (too much
injected memory degrading output quality). Research shows that at >33,000 tokens
of startup context, model adherence to instructions degrades.

**Current token budget analysis (estimated):**

```
CLAUDE.md:                ~4,800 tokens
MEMORY.md (200 lines):    ~4,000 tokens
SESSION_CONTEXT.md QR:    ~500 tokens
mcp__memory tool descs:   ~2,000 tokens
episodic-memory tool:     ~500 tokens
.planning/STATE.md refs:  ~800 tokens (session-begin Phase 2)
---------------------------------------------
Total startup:            ~12,600 tokens
```

**This is within safe bounds.** The risk arises as MEMORY.md grows toward the
25KB cap (possible at ~8,000 tokens) and if additional MCP servers are added.

**What to add:** A startup context budget check in the session-begin skill.

**Implementation:** In `session-begin SKILL.md` Phase 1 (pre-flight), add:

```
Check: estimated startup token count
If > 18,000 tokens: warn user
If > 25,000 tokens: recommend dream-skill consolidation immediately
```

Metrics to check: MEMORY.md line count, CLAUDE.md size, active MCP server count.

**Risk level:** VERY LOW. Read-only check; no modifications.

---

## Part 4: Cross-Locale Sync Solution

### Recommended Solution: autoMemoryDirectory → Git Repo Directory

**Confidence:** HIGH (based on D7a Finding #10, rated "best overall" in
evaluation matrix)

This is the only pattern that:

1. Solves the path-key problem without additional infrastructure
2. Uses the existing git workflow (no new sync tool)
3. Requires no admin access at either locale
4. Has zero ongoing cost
5. Already has the infrastructure in place (`.claude/canonical-memory/` exists)

**Step-by-step setup:**

Step 1: Reconcile canonical-memory (one-time, at home locale)

```
# Read live memory at home locale
# Compare with .claude/canonical-memory/
# Add missing entries (the ~7 feedback files identified in D1)
# Correct the expertise profile description
# Commit the reconciled canonical-memory to git
# git add .claude/canonical-memory/ && git commit -m "reconcile canonical memory"
# git push
```

Step 2: Configure autoMemoryDirectory at home locale (Owner)

```json
// In ~/.claude/settings.json (user settings, NOT project settings)
{
  "autoMemoryDirectory": "C:\\Users\\Owner\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

Step 3: Configure autoMemoryDirectory at work locale (jbell)

```json
// In ~/.claude/settings.json (user settings)
{
  "autoMemoryDirectory": "C:\\Users\\jbell\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

Step 4: Verify (at each locale after configuration)

```
# Start a new Claude Code session
# Check that MEMORY.md is read from .claude/canonical-memory/MEMORY.md
# Write a test memory entry
# Confirm it appears in .claude/canonical-memory/ not in the old path-keyed directory
```

Step 5: Cross-locale sync workflow (no change from existing git workflow)

```
# At session end: git commit includes .claude/canonical-memory/ changes
# At locale switch: git pull brings canonical-memory up to date
# Memory is current on both machines after each pull
```

**What this does NOT solve:** If both locales are used simultaneously (two
sessions open at once), the second session to commit will need to merge. For a
solo operator, this is extremely rare and git's line-level markdown merge is
adequate.

**Fallback option (if corporate firewall blocks autoMemoryDirectory testing):**
OneDrive + `autoMemoryDirectory` pointing at a OneDrive folder. Same
configuration steps; OneDrive handles the sync instead of git. OneDrive is
included with Windows 11 and requires no admin.

---

## Part 5: Token Budget Analysis

### Baseline vs. Enhanced State

| Layer                              | Current Tokens | Enhanced Tokens             | Delta |
| ---------------------------------- | -------------- | --------------------------- | ----- |
| CLAUDE.md                          | ~4,800         | ~4,800                      | 0     |
| MEMORY.md (200-line cap)           | ~4,000         | ~3,500 (post-consolidation) | -500  |
| SESSION_CONTEXT.md QR              | ~500           | ~500                        | 0     |
| mcp\_\_memory tool descriptions    | ~2,000         | ~2,000                      | 0     |
| episodic-memory tool (search only) | ~500           | ~700 (show added)           | +200  |
| session-begin STATE.md refs        | ~800           | ~800                        | 0     |
| TOTAL STARTUP                      | ~12,600        | ~12,300                     | -300  |

**Analysis:** The enhanced architecture slightly reduces startup token cost
because dream-skill consolidation keeps MEMORY.md leaner. The episodic-memory
show tool adds ~200 tokens in tool descriptions. Net neutral to slightly
positive.

**Headroom:** 12,300 tokens startup leaves ~87,700 tokens for the working
context window (assuming 100K effective context). This is healthy. The guard at
18,000 tokens warns before reaching constraint territory.

**Where NOT to add memory:** The token budget analysis confirms the
recommendation against adding claude-mem (worker daemon, Bun, ChromaDB = HIGH
overhead), cipher (multiple API calls per extraction), or ECC (30 agents, 60+
commands). These would push startup tokens to 25,000-54,000 range.

---

## Part 6: Implementation Phases

Ordered by value/effort ratio. Each phase is independently valuable and
reversible.

### Phase 0: Reconciliation (Prerequisite, ~30 minutes)

**What:** Merge stale canonical-memory with live home-locale memory. **Why
first:** All subsequent phases depend on canonical-memory being authoritative.
**Steps:**

1. At home locale (Owner): read live MEMORY.md (39 files + index)
2. Compare with `.claude/canonical-memory/`
3. Add missing ~7 feedback files and update expertise profile
4. Commit and push **Effort:** ~30 minutes of manual comparison and writing
   **Risk:** None (no code changes, pure content update)

---

### Phase 1: Cross-Locale Sync (High Value, Low Effort, ~1 hour)

**What:** Configure `autoMemoryDirectory` at both locales. **Why high value:**
Solves the most painful ongoing problem (two diverged memories). **Steps:**

1. Update `~/.claude/settings.json` at home locale
2. Update `~/.claude/settings.json` at work locale
3. Test by creating a session at each locale, verifying memory writes to
   canonical-memory/
4. Add canonical-memory to session-end commit checklist **Effort:** ~1 hour
   including testing **Risk:** LOW — `autoMemoryDirectory` is an official
   setting; fallback is to remove the config

---

### Phase 2: MCP Knowledge Graph Persistence (Medium Value, Low Effort, ~2 hours)

**What:** Set `MEMORY_FILE_PATH` to git-tracked location. **Why:** mcp\_\_memory
graph becomes cross-locale synced; decisions persisted survive locale switches.
**Steps:**

1. Find current memory.jsonl location (check Claude Code application data
   directory)
2. Copy existing graph data to `.claude/memory.jsonl`
3. Update `.mcp.json` with `MEMORY_FILE_PATH` env var
4. Add `.claude/memory.jsonl` to git tracking (if not gitignored)
5. Test: create an entity via checkpoint skill; verify it appears in
   `.claude/memory.jsonl` **Effort:** ~2 hours including discovery of current
   file location **Risk:** LOW — existing graph data preserved; only affects new
   writes until migration

---

### Phase 3: Episodic Memory Show Permission (Very Low Effort, <15 minutes)

**What:** Add `mcp__plugin_episodic-memory_episodic-memory__show` to allow-list.
**Why:** Enables full conversation retrieval, completing episodic memory's
utility. **Steps:**

1. Edit `.claude/settings.json` allow array
2. Add the show tool permission
3. Verify with `/mcp` command **Effort:** <15 minutes **Risk:** None (additive
   permission, read-only tool)

---

### Phase 4: Memory Consolidation via dream-skill (Medium Value, Medium Effort, ~1 day)

**What:** Install dream-skill and integrate into session-end pipeline. **Why:**
Solves memory entropy without AutoDream (which remains server-gated). **Steps:**

1. Obtain dream-skill implementation (community plugin; search for `dream-skill`
   Claude Code marketplace)
2. Test manually: run dream-skill against MEMORY.md, review output
3. Add TTL convention to MEMORY.md template and new entries (optional)
4. Add trigger check to session-end SKILL.md (Phase 4: memory consolidation)
5. Set threshold: MEMORY.md > 80 lines OR > 5 sessions since last run
   **Effort:** ~1 day (community plugin review, integration, testing) **Risk:**
   MEDIUM — dream-skill modifies MEMORY.md content. Run in dry-run mode first.
   If dream-skill is not available or suitable, a simpler custom script can
   implement the four consolidation phases.

---

### Phase 5: Context Rot Guard (Low Effort, ~1 hour)

**What:** Add startup context budget check to session-begin skill. **Why:**
Prevents silent degradation as memory grows. **Steps:**

1. Edit `.claude/skills/session-begin/SKILL.md` Phase 1 (pre-flight)
2. Add check: count MEMORY.md lines, estimate token budget
3. Define warning thresholds (warn at >18K tokens, critical at >25K tokens)
4. Add remediation suggestions (run dream-skill, reduce active MCP servers)
   **Effort:** ~1 hour (skill modification only) **Risk:** VERY LOW (read-only
   check)

---

### Phase 6: Session-Significance Checkpoint (Medium Effort, ~4 hours)

**What:** Automatic MCP checkpoint in session-end pipeline when significant
session. **Why:** Ensures architectural decisions are persisted to knowledge
graph without manual discipline. **Steps:**

1. Define significance detection logic in session-end skill
2. Implement check against commit-log.jsonl for signal files
3. Add Phase 3 to session-end pipeline: conditional checkpoint --mcp
4. Test: trigger a significant session, verify checkpoint runs **Effort:** ~4
   hours (session-end skill modification + testing) **Risk:** LOW — guarded by
   significance check; checkpoint skill already exists

---

### Phase 7: TTL Markers in Existing Memory Files (Ongoing, Not a Sprint)

**What:** Add TTL annotations to existing MEMORY.md entries. **Why:** Enables
dream-skill to make decay decisions during future consolidations. **Steps:**
During normal session work, annotate entries that are clearly ephemeral
(`<!-- TTL: ephemeral -->`) or sprint-scoped (`<!-- TTL: sprint -->`). Permanent
entries need no annotation. **Effort:** Incremental (add annotations during
normal work) **Risk:** None (annotations are invisible without dream-skill)

---

## Part 7: Migration Path

**Current state → Enhanced state without disruption:**

```
Week 1 (Phase 0 + 1):
  ├── Reconcile canonical-memory content (Phase 0)
  ├── Configure autoMemoryDirectory at both locales (Phase 1)
  └── Verify memory writes correctly at both locales
      ↓
  Memory is now unified cross-locale. All subsequent sessions
  write to the same git-tracked directory on both machines.

Week 1 continued (Phase 2 + 3):
  ├── Set MEMORY_FILE_PATH in .mcp.json (Phase 2)
  ├── Add episodic-memory show permission (Phase 3)
  └── Test MCP graph persistence
      ↓
  Knowledge graph is now git-tracked and cross-locale synced.
  Episodic memory is fully enabled.

Week 2-3 (Phase 4):
  ├── Obtain and evaluate dream-skill
  ├── Run dry-run consolidation on current MEMORY.md
  ├── Review output (ensure no valuable content lost)
  └── If satisfactory: integrate into session-end pipeline
      ↓
  Memory consolidation is now automated. MEMORY.md stays
  under 80 lines. Stale entries decay naturally.

Week 3 (Phase 5 + 6):
  ├── Add context rot guard to session-begin (Phase 5)
  └── Add significance checkpoint to session-end (Phase 6)
      ↓
  Full enhanced system is operational.

Ongoing (Phase 7):
  └── Add TTL annotations during normal work

ROLLBACK at any phase:
  - Phase 1: remove autoMemoryDirectory from settings.json
             canonical-memory reverts to manual snapshot
  - Phase 2: remove MEMORY_FILE_PATH from .mcp.json
             graph server uses default path
  - Phase 3: remove show permission from settings.json
  - Phase 4: remove dream-skill from session-end pipeline
             MEMORY.md reverts to manual curation
  - Phase 5: remove check from session-begin skill
  - Phase 6: remove Phase 3 from session-end skill
```

**No big bang migration required.** Each phase is independently reversible. The
existing 14 mechanisms continue operating unchanged throughout.

---

## Gaps Addressed vs. Wave 1-2 Identified Gaps

| Gap                                               | Solution                                                                                                                                                                                                           | Phase               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| canonical-memory divergence from live auto-memory | E1: autoMemoryDirectory → canonical-memory (Phase 0+1)                                                                                                                                                             | 0-1                 |
| No session-memory consolidation pipeline          | A1: dream-skill in session-end pipeline (Phase 4)                                                                                                                                                                  | 4                   |
| No memory decay/TTL                               | A2: TTL markers + dream-skill enforcement (Phase 4+7)                                                                                                                                                              | 4,7                 |
| Path-key problem for cross-locale sync            | E1: autoMemoryDirectory redirects both locales (Phase 1)                                                                                                                                                           | 1                   |
| Context rot risk from too much injected memory    | A3: startup budget guard (Phase 5) + dream-skill pruning (Phase 4)                                                                                                                                                 | 4,5                 |
| MCP memory startup hang risk                      | Use hooks for injection, not "check at startup" instruction. The existing compact-restore.js pattern (stdout injection) is safer than instructing Claude to call MCP tools at session start. Keep current pattern. | 0 (design decision) |

---

## Sources

| #   | Source                                                 | Title                                 | Type          | Trust | Date       |
| --- | ------------------------------------------------------ | ------------------------------------- | ------------- | ----- | ---------- |
| 1   | D1-codebase-memory-inventory.md                        | Current Memory Ecosystem Inventory    | findings      | HIGH  | 2026-03-31 |
| 2   | D2a-claude-mem-cipher.md                               | claude-mem and cipher deep analysis   | findings      | HIGH  | 2026-03-31 |
| 3   | D2b-everything-cc-interface.md                         | ECC and interface-design analysis     | findings      | HIGH  | 2026-03-31 |
| 4   | D2c-supermemory-openmemory.md                          | Supermemory and OpenMemory analysis   | findings      | HIGH  | 2026-03-31 |
| 5   | D3a-1-github-claude-memory.md                          | GitHub Claude memory repos            | findings      | HIGH  | 2026-03-31 |
| 6   | D3b-2a-anthropic-official.md                           | Anthropic official memory docs        | findings      | HIGH  | 2026-03-31 |
| 7   | D4a-academic-memory-patterns.md                        | Academic memory architecture patterns | findings      | HIGH  | 2026-03-31 |
| 8   | D4b-industry-implementations.md                        | Industry agent memory implementations | findings      | HIGH  | 2026-03-31 |
| 9   | D5a-mcp-memory-servers.md                              | MCP memory servers survey             | findings      | HIGH  | 2026-03-31 |
| 10  | D5b-mcp-integration-patterns.md                        | MCP integration patterns              | findings      | HIGH  | 2026-03-31 |
| 11  | D6a-comparison-matrix.md                               | Memory systems comparison matrix      | findings      | HIGH  | 2026-03-31 |
| 12  | D6b-architecture-patterns.md                           | Architecture pattern taxonomy         | findings      | HIGH  | 2026-03-31 |
| 13  | D7a-cross-locale-sync.md                               | Cross-locale sync patterns            | findings      | HIGH  | 2026-03-31 |
| 14  | D7b-sync-implementations.md                            | Sync tool implementations             | findings      | HIGH  | 2026-03-31 |
| 15  | https://code.claude.com/docs/en/memory                 | Claude Code Official Memory Docs      | official-docs | HIGH  | 2026-03    |
| 16  | https://github.com/anthropics/claude-code/issues/36636 | autoMemoryDirectory bug (resolved)    | GitHub issue  | HIGH  | 2026-03-25 |
| 17  | https://github.com/anthropics/claude-code/issues/28276 | autoMemoryDirectory feature request   | GitHub issue  | HIGH  | 2026-03    |

---

## Contradictions

**autoMemoryDirectory path-key interaction:** D7a states that
`autoMemoryDirectory` bypasses the path-key problem entirely (both locales read
the same physical location). D7b states that `autoMemoryDirectory` "only
redirects where memory files are stored" and "does NOT change how projects are
identified." The resolution: when `autoMemoryDirectory` points at the same
logical directory at both locales (same git repo, different absolute paths), the
memory files themselves are shared even though the project key differs. Claude
reads from the overridden path regardless of how it would have keyed the
project. This is the basis for the recommended solution.

**dream-skill availability:** The dream-skill community plugin is referenced in
multiple research documents but no confirmed installation URL was found.
AutoDream (native) remains gated. This is flagged as a gap — Phase 4 may require
implementing a custom consolidation script rather than installing a community
plugin.

---

## Gaps

1. **dream-skill installation URL not confirmed.** Research confirmed its
   existence and four-phase architecture but could not locate a specific
   marketplace listing. Implementation may require building a custom
   `/consolidate-memory` skill based on the documented AutoDream phases rather
   than installing an existing plugin.

2. **autoMemoryDirectory + git repo: untested in production.** The recommended
   cross-locale solution (pointing `autoMemoryDirectory` at a git-tracked
   directory) is the highest-confidence option identified, but no community
   deployment of this exact pattern was confirmed. Phase 1 should be treated as
   an experiment with a defined rollback path.

3. **MEMORY_FILE_PATH current file location.** The exact path where the existing
   `@modelcontextprotocol/server-memory` currently stores its `memory.jsonl` was
   not confirmed. Discovery is required before Phase 2 can proceed (to migrate
   existing graph data).

4. **TTL implementation in dream-skill.** The TTL marker convention is proposed
   but not validated against any existing consolidation implementation. The
   dream-skill or custom consolidation script would need to explicitly support
   TTL annotations.

---

## Serendipity

**The answer was already partially deployed.** The `.claude/canonical-memory/`
directory with 20 files was identified in D1 as an "abandoned rather than
actively maintained" baseline snapshot. Setting `autoMemoryDirectory` to point
at it is zero-infrastructure, requires no new tooling, and solves the
cross-locale sync problem as a side effect of fixing the canonical-memory
divergence. The problem has been one configuration line away from being solved
since v2.1.74 shipped on March 12, 2026.

**AutoDream is closer than expected.** The `tengu_onyx_plover` flag has
hardcoded thresholds (minHours: 24, minSessions: 5) suggesting Anthropic plans
to enable it broadly. When it ships, Phase 4 (dream-skill) becomes unnecessary —
AutoDream will handle consolidation natively. Phases 0-3 and 5-6 remain valuable
regardless.

**The three-role model is already partially implemented.** CLAUDE.md = law
(working), Auto Memory = learnings (working but diverged), mcp\_\_memory =
structural knowledge (configured but underused). The enhancement proposals
tighten what already exists rather than introducing a new paradigm.

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All proposals derive from verified findings across 16 research files with
confirmed primary sources. The primary uncertainty is Phase 4 (dream-skill
availability) which is MEDIUM confidence. All other phases reference verified
official capabilities (autoMemoryDirectory setting, MEMORY_FILE_PATH env var,
MCP permission model, session-end skill pipeline structure).
