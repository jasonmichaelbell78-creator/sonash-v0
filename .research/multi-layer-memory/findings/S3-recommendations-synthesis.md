# Recommendations Synthesis: Multi-Layer Memory System

**Synthesizer:** deep-research-synthesizer **Date:** 2026-03-31 **Source
files:** D8a, D8b-1, D8b-2, D9a, D9b, D10a, D10b **User context note:**
AutoDream is LIVE on this account (`tengu_onyx_plover` flag active, confirmed by
user). This overrides findings that describe it as server-gated.

---

## Section 1: Hybrid vs. Clean-Slate Verdict

**Verdict: Hybrid. No contest.**

D9a's serendipity finding resolves this before the debate begins:

> "The existing system is 70-80% of the way to the clean-slate ideal."

The three roles are already present: CLAUDE.md = GOVERN, MEMORY.md = KNOW, JSONL
state files = RECALL. The four layers are already implied. The gap between
current and ideal is: (a) no admission gate, (b) no decay, (c) no consolidation
beyond the PR learning system, and (d) canonical-memory divergence. These are
additions and configurations, not rewrites.

**The clean-slate architecture (D9a) is the design target.** The hybrid approach
(D8a) is how you get there without disrupting 250 sessions of accumulated
workflow. They are not competing answers to the same question. D9a is the map;
D8a is the route.

**Why clean-slate would be wrong:** The project has 14 persistence mechanisms,
25 hooks, 60+ skills, 27 agents, and 250 sessions of accumulated behavioral
corrections. Replacing this with a clean-slate system means migrating or
re-learning everything Anthropic will not migrate for you. D10b's abandonment
rate finding applies directly: 29% of current mechanisms have already drifted or
been abandoned. A total rebuild would face the same entropy on a larger surface.

**Key overlap finding:** The D8a hybrid approach and the D9a clean-slate
architecture converge on identical recommendations for Phases 0-3
(autoMemoryDirectory, MEMORY_FILE_PATH, episodic show permission, MCP
checkpoint). The only divergence is D9a's aspiration for a full L3 SQLite+vec
layer — which D8a appropriately defers to Tier 3.

---

## Section 2: Recommended Architecture

The recommended architecture is the three-role, four-layer model. What matters
is how the existing system maps to it.

### Three Roles (All Already Present)

| Role   | Purpose                                               | Current Implementation                                   | Status                                                                    |
| ------ | ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| GOVERN | Rules, constraints, security boundaries               | `CLAUDE.md` (v5.8, 258 lines)                            | Working. Target: trim to 150 lines.                                       |
| KNOW   | Standing facts, user profile, architectural decisions | Auto Memory (`MEMORY.md` + 39 topic files)               | Working but diverged from canonical-memory. Needs consolidation pipeline. |
| RECALL | Session events, tool outputs, operational logs        | `.claude/state/*.jsonl` (82 files), `SESSION_CONTEXT.md` | Working. Session-end discipline is the load-bearing ritual.               |

### Four Layers (Two Fully Working, Two Need Enhancement)

| Layer             | Role          | Backend                                                   | Startup tokens                    | Status                                                                                  |
| ----------------- | ------------- | --------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| L1: Always-On     | GOVERN        | `CLAUDE.md` (markdown)                                    | ~4,800 tokens                     | Working. Trim from 258 to 150 lines is recommended but not urgent.                      |
| L2: Session-Start | KNOW          | `.claude/canonical-memory/*.md` via `autoMemoryDirectory` | ~3,500-4,000 tokens               | NEEDS: autoMemoryDirectory config at both locales + reconciliation.                     |
| L3: On-Demand     | KNOW + RECALL | `mcp__memory` JSONL graph + episodic-memory plugin        | ~2,500 tokens (tool descriptions) | NEEDS: MEMORY_FILE_PATH to git-tracked path; episodic show permission; more active use. |
| L4: Archive       | RECALL        | `.claude/state/*.jsonl` append-only                       | Never auto-loaded                 | Working. SESSION_HISTORY.md, TDMS, commit-log — no changes needed.                      |

### The Session-End Pipeline (Load-Bearing Ritual)

The session-end pipeline is the delivery mechanism for all enhancements. It
already runs TDMS consolidation and SESSION_CONTEXT updates. The enhanced
version adds:

```
Phase 1: TDMS consolidation (unchanged)
Phase 2: SESSION_CONTEXT.md update (unchanged)
Phase 3: MCP checkpoint (NEW — guarded by session-significance detection)
Phase 4: Memory consolidation check (NEW — AutoDream is live, but dream-skill
          adds explicit control; run if MEMORY.md > 80 lines or 5+ sessions since last run)
Phase 5: git commit includes .claude/canonical-memory/ + .claude/memory.jsonl
```

**Note on AutoDream:** Since AutoDream is confirmed live on this account, Phase
4 has a different posture than the findings assumed. AutoDream may already be
running consolidation. The correct action is to: (1) observe its behavior for
3-5 sessions, (2) determine whether its output preserves the nuanced entries in
MEMORY.md, and (3) only then decide whether to add dream-skill as a supplement
or backup. Do not run both simultaneously without testing the interaction.

### The Three-Role Contract (Non-Negotiable Rules)

From D9a, these rules prevent role leakage — the source of most current
confusion:

1. CLAUDE.md never receives autonomous writes. Human must approve any addition.
2. Auto Memory never replaces SESSION_CONTEXT.md for session-specific notes.
3. mcp\__memory graph stores entity relationships, not behavioral corrections
   (those go to feedback_\*.md).
4. L3 (episodic/SQLite) never syncs across locales. Cross-locale knowledge
   travels via L2 (git).
5. Hooks guarantee capture; MCP tools guarantee retrieval. These are not
   alternatives.

---

## Section 3: Implementation Tiers

Tiers are sourced directly from D10b's evidence-based analysis, which explicitly
accounts for the 29% abandonment rate and the solo non-developer operator
profile.

### Tier 1: Free Wins (Act Now — Hours, Not Days)

Each T1 item is reversible, requires no new infrastructure, and has near-zero
ongoing maintenance. Each solves a confirmed, current problem.

| Item | What                                                                                                     | Why Now                                                                      | Effort                      | Risk | Ongoing maintenance |
| ---- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------- | ---- | ------------------- |
| T1-A | Set `autoMemoryDirectory` in `settings.local.json` at work locale (jbell) to `.claude/canonical-memory/` | Solves cross-locale sync problem that has been open 250 sessions. Immediate. | 1 hour including test       | Low  | Zero                |
| T1-B | Observe AutoDream behavior (3-5 sessions) then decide on dream-skill supplement                          | AutoDream is live; understand what it does before adding more                | 0 effort (observation)      | None | None                |
| T1-C | Add `mcp__plugin_episodic-memory_episodic-memory__show` to allow-list                                    | One line in settings.json. Completes episodic retrieval path.                | 15 minutes                  | None | Zero                |
| T1-D | Fix `STATE_SCHEMA.md` — update from 10 documented files to actual 82                                     | Prevents wasted orientation time every session. Pure documentation.          | 1 session (20-30 min)       | None | Low                 |
| T1-E | Set `MEMORY_FILE_PATH` in `.mcp.json` → `.claude/memory.jsonl` (git-tracked)                             | Makes MCP knowledge graph cross-locale synced via git.                       | 2 hours including discovery | Low  | Zero                |

**Prerequisite before T1-A:** Reconcile live auto-memory with canonical-memory
(one session). Live copy has 39 files vs 20 in canonical-memory, missing 7
feedback entries, wrong expertise description. Merge first, then configure
autoMemoryDirectory.

### Tier 2: Worth the Investment (Plan in Next Sprint — Sessions, Not Days)

T2 items require 1-3 sessions each, create modest ongoing maintenance, and have
clear sustained ROI for continued 250+ session operation. These should go
through deep-plan.

| Item | What                                                                                           | Why                                                                                                                 | Effort            | New maintenance    |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------ |
| T2-A | Add canonical-memory to session-end auto-commit (20-30 lines Node.js extending existing hook)  | Without this, T1-A sync only works when user remembers to include canonical-memory in commits                       | 0.5-1 session     | Near-zero          |
| T2-B | Lightweight consolidation script `scripts/consolidate-memory.js` (Jaccard dedup, TTL archival) | Memory entropy is confirmed real at 250 sessions; supplement to AutoDream with explicit human control               | 1-2 sessions      | Low (periodic run) |
| T2-C | Install `codebase-memory-mcp` (Windows amd64 binary, auto-detect install)                      | Structural code intelligence is a different layer than session memory — no overlap, zero maintenance once installed | 0.5 session       | Near-zero          |
| T2-D | Complete cross-locale setup at home locale (Owner) — same autoMemoryDirectory config           | Requires physical access to home machine; completes the full push-pull cycle                                        | 1 focused session | Zero               |

**Signal that T2-B is needed:** MEMORY.md exceeds 200 lines, or you notice the
same lesson being re-discovered across sessions. At 250 sessions this is likely
already true.

### Tier 3: Defer (Only on Specific Confirmed Pain — 5+ Sessions Each)

These create significant new maintenance, have uncertain ROI at current scale,
or risk being obsoleted by Anthropic shipping native equivalents.

| Item | What                                                                    | Why Defer                                                                                    | Trigger to pursue                                                                                      |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| T3-A | Semantic/vector memory MCP server (`basic-memory` or custom sqlite-vec) | ROI uncertain; 39 well-named files are adequate for current scale; Anthropic may ship native | "I've rebuilt this context 5+ times and can't find the memory file" — recurring more than 3 times/week |
| T3-B | Cloud-hosted MCP memory server (Firebase-backed)                        | git-based sync solves the cross-locale problem for free; operational overhead not justified  | If T1-A + T2-A produce merge conflicts more than 3 times                                               |
| T3-C | Knowledge graph semantic layer (richer than mcp\_\_memory JSONL)        | Current JSONL graph adequate at 250 sessions; graph complexity only pays at 500+ sessions    | When architectural decisions number in the hundreds and dependency tracing takes meaningful time       |

### Do-NOT-Do List (From D10b — Evidence-Based Rejections)

These are confirmed as wrong for this specific profile. Confidence on all: HIGH.

| Reject                                                                     | Why                                                                                                                                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-mem` (thedotmack)                                                  | 5 documented Windows x64 failures; AbortSignal crash, pipe mode empty output, PowerShell dependency, CLAUDE.md subdirectory pollution bug (closed NOT_PLANNED), AGPL-3.0 license |
| Any Docker-based tool (Hindsight, OpenMemory, Qdrant standalone, Weaviate) | Docker requires Hyper-V or WSL2; no admin at work locale; hard block                                                                                                             |
| `everything-claude-code` (ECC) as a platform                               | SessionStart injection bug cross-contaminating context; 60+ commands for a system already replaced by 250 sessions of custom workflow                                            |
| `Supermemory` cloud plugin ($19/month)                                     | Windows stdin hang open since Feb 2026; full session transcripts to third-party cloud = PII risk                                                                                 |
| WSL2-dependent tools (OMEGA Memory, claude-brain)                          | No admin at work locale; WSL2 setup requires admin; hard block                                                                                                                   |
| Vector store from scratch (ChromaDB, Qdrant, Milvus)                       | Chroma npm is ARM64-only on Windows x64; non-developer operator cannot debug when these break; A-MAC finding: better curation beats better retrieval at this scale               |
| Replacing hooks with MCP-tool-only capture                                 | MCP tools are passive; hooks are active. 25 existing hooks guarantee 100% capture of critical state. MCP capture has non-zero miss rate.                                         |
| `memoir` (if T1-A is implemented)                                          | Redundant if autoMemoryDirectory → git repo is working; path remapping internals undocumented                                                                                    |

---

## Section 4: Technology Picks

Primary and backup for each component. All selections are constrained by:
Windows x64, no admin at work locale, no Docker, no WSL2, portable installs
only, Node.js ecosystem.

### T4.1 Vector Store

|         | Option                                                       | Notes                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRIMARY | `sqlite-vec` via `npm install sqlite-vec` + `better-sqlite3` | Zero external server, embedded, C extension, works wherever SQLite runs, v0.1.9 confirmed released 2026-03-31. The episodic-memory Superpowers plugin already uses sqlite-vec on Windows — confirming it works in the production Claude Code environment. **Critical gap:** npm package on Windows x64 without admin has not been independently verified. Test before committing. |
| BACKUP  | `Qdrant local mode` via `qdrant-npm`                         | Downloads Windows amd64 binary automatically; requires running process (unlike embedded sqlite-vec); REST client `@qdrant/js-client-rest`                                                                                                                                                                                                                                         |
| REJECT  | Chroma (npm `chromadb`)                                      | ARM64-only on Windows x64 — Issue #1146, confirmed and documented                                                                                                                                                                                                                                                                                                                 |
| DEFER   | Full vector layer                                            | Only add when FTS5 keyword search in mcp\_\_memory or episodic-memory proves insufficient                                                                                                                                                                                                                                                                                         |

### T4.2 Knowledge Graph

|             | Option                                              | Notes                                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRIMARY     | Keep existing `@modelcontextprotocol/server-memory` | Already active. Adequate for current scale (~500-1,500 typical entities). Enhancement: set MEMORY_FILE_PATH to git-tracked path (T1-E).                                                                                                      |
| ENHANCEMENT | Engram (Go binary, FTS5, MCP stdio)                 | Windows amd64 prebuilt binary; aligns with existing Go tool pattern (statusline already deployed); "Bare MCP" mode avoids Windows shell dependencies; export/import for cross-machine sync. Use alongside mcp\_\_memory, not as replacement. |
| REJECT      | Neo4j                                               | Requires admin (installer) or Docker; hard block                                                                                                                                                                                             |
| REJECT      | Graph DBs requiring Docker                          | Same admin/Docker constraint                                                                                                                                                                                                                 |

### T4.3 Embedding Model (When Needed — Tier 3)

|         | Option                                                   | Notes                                                                                                                                                                                                                                                                  |
| ------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRIMARY | `@huggingface/transformers` v3 + `all-MiniLM-L6-v2-onnx` | Pure Node.js ONNX runtime, ~25MB model, offline after first download, zero cost, full privacy. **Gap:** Node.js v22 compatibility not independently verified. Test before committing. The older `@xenova/transformers` is confirmed working in episodic-memory plugin. |
| BACKUP  | OpenAI `text-embedding-3-small`                          | $0.02/M tokens ≈ effectively $0/month at memory scale; latency acceptable for async use; privacy concern (data leaves system)                                                                                                                                          |
| REJECT  | Anthropic embeddings                                     | Does not exist. Anthropic cookbooks direct to Voyage AI.                                                                                                                                                                                                               |
| REJECT  | Voyage AI                                                | Default retains data for training; opt-out requires admin dashboard; 3x more expensive than OpenAI backup                                                                                                                                                              |

### T4.4 Sync Mechanism

|                   | Option                                                            | Notes                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PRIMARY           | `autoMemoryDirectory` → `.claude/canonical-memory/` (git-tracked) | Already configured. Zero new infrastructure. Solo operator: conflicts extremely rare. Git line-level markdown merge is safe.                                             |
| ALTERNATE PRIMARY | `autoMemoryDirectory` → OneDrive folder                           | Simpler (no git push discipline required). Use if OneDrive is confirmed available at work locale.                                                                        |
| REJECT            | SQLite on any cloud sync (OneDrive, Dropbox)                      | SQLite documentation explicitly states network filesystem use is unsupported. WAL-reset bug confirmed in SQLite 3.7.0-3.51.2 (fixed 2026-03-13). Silent corruption risk. |
| REJECT            | Git notes                                                         | High setup complexity, high ongoing maintenance                                                                                                                          |
| DEFER             | Firebase Firestore-backed custom MCP                              | Sound technically; development cost exceeds benefit when T1-A solves the problem for free                                                                                |

### T4.5 Admission/Retrieval Framework

|         | Option                                                                                              | Notes                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| PRIMARY | Mix-and-match: existing hooks + SESSION_CONTEXT.md + Engram (T2 add) + codebase-memory-mcp (T2 add) | Avoids adopting any full framework whose Windows compatibility is fragile or who owns your CLAUDE.md. Maximally maintainable.       |
| REJECT  | claude-mem as primary framework                                                                     | 5 documented Windows-specific failures; PostToolUse broke for 2+ months with no warning; CLAUDE.md subdirectory pollution; AGPL-3.0 |
| REJECT  | OMEGA Memory                                                                                        | WSL2 required on Windows; hard block regardless of quality (95.4% LongMemEval)                                                      |
| SKIP    | memoir                                                                                              | Redundant if autoMemoryDirectory → git repo is implemented                                                                          |

### Summary Table

| Component           | PRIMARY                                    | BACKUP                                  |
| ------------------- | ------------------------------------------ | --------------------------------------- |
| Vector store        | sqlite-vec (npm)                           | Qdrant local (qdrant-npm)               |
| Knowledge graph     | Keep mcp\_\_memory + add Engram            | SQLite + JSON custom layer              |
| Embedding model     | @huggingface/transformers + MiniLM-L6-v2   | OpenAI text-embedding-3-small           |
| Sync                | autoMemoryDirectory → git canonical-memory | autoMemoryDirectory → OneDrive          |
| Admission/retrieval | Hooks + Engram + codebase-memory-mcp       | Custom scripts only (no external tools) |

---

## Section 5: Extractable Patterns — Ranked by ROI

From D8b-1 (capture/retrieval patterns) and D8b-2 (lifecycle/workflow patterns).
Each pattern rated by value/effort ratio for a solo non-developer on Windows.

### Tier A: Implement This Session (Hours, No Infrastructure)

**P5 — Content-Type-Prior Filtering** (ROI: Highest per hour of any pattern)

- What: Define a whitelist of approved memory categories in CLAUDE.md. "Write to
  auto-memory ONLY for: behavioral corrections, architectural decisions, project
  status changes, standing constraints, user preferences. Never write for:
  session-specific task details, intermediate debugging steps."
- Why first: The A-MAC academic paper identifies content-type-prior as the
  single strongest predictor of useful memory. It eliminates ~70% of low-signal
  write candidates before any other filtering. Costs 45 minutes, zero
  infrastructure.
- Implementation: Add a "Memory Admission Policy" section to CLAUDE.md. Add a
  pre-write gate as a behavioral check in session-begin skill.
- Effort: 1-2 hours. No new infrastructure.
- Sources: D4a (A-MAC paper), D8b-1 (Pattern 5)

**P6-Minimum — Anti-Rot Behavioral Rule** (ROI: High, 15 minutes)

- What: Add one rule to CLAUDE.md: "When completing an initiative (PR merged,
  feature shipped): immediately update the relevant project\_\*.md memory file
  to mark COMPLETE. Do not defer memory maintenance to session-end. Stale status
  is worse than no memory."
- Why: The serendipity finding in D8b-1 uses `project_sonarcloud_disabled.md` as
  a live example of a stale memory entry that would be caught by this rule.
- Effort: 15 minutes. One CLAUDE.md rule.
- Sources: D8b-1 (Pattern 6), D4b (Copilot citation-backed validation)

**P1-Basic — Progressive Disclosure Discipline** (ROI: High, 2-3 hours)

- What: Restructure MEMORY.md as a token-aware index table (adding ~tokens,
  type, and last-updated columns). Add a note to session-begin SKILL.md: "Read
  MEMORY.md index first. Only load topic files directly relevant to the current
  task."
- Why: Prevents the hidden token waste of loading all 39 topic files when only 3
  are relevant to the current work.
- Effort: 2-3 hours. No new infrastructure.
- Sources: D8b-1 (Pattern 1), D2a (claude-mem progressive disclosure)

### Tier B: Next Sprint (Days, Minimal Infrastructure)

**P2 — Reasoning Trace Capture** (ROI: Medium)

- What: Create `.claude/state/reasoning-traces.jsonl`. Add Phase 2.5 to
  session-end SKILL.md: when the session contained a failed-then-fixed approach,
  a diagnosis, or a behavioral correction, write a reasoning trace entry
  `{ date, problem, approaches_tried, resolution, key_insight }`.
- Why: When Claude solves a hard problem, the rejected approaches are lost. The
  reasoning trace captures "what we tried and why it failed" — cipher's System 2
  memory. Improves debugging of recurrent problems.
- Effort: 4-6 hours (one new ~40-line Node.js hook, one skill modification).
- Sources: D8b-1 (Pattern 2), D4a (Reflexion NeurIPS 2023)

**D8b-2 P1 — Instinct Confidence Scoring** (ROI: Medium)

- What: Add YAML frontmatter to MEMORY.md topic files:
  `confidence: 0.7 | domain: behavioral-correction | sessions_seen: 3`. Add
  confidence to MEMORY.md index. Low-confidence + stale + rarely-accessed
  entries become consolidation candidates.
- Why: Allows expressing "I learned this tentatively" vs. "confirmed across 50
  sessions." Behavioral corrections from Session #10 vs Session #250 are
  currently indistinguishable.
- Effort: 4-6 hours. No new infrastructure.
- Sources: D8b-2 (Pattern 1), D2b (ECC instincts — take the concept, not the
  machinery)

**D8b-2 P2 — TTL/Confidence Decay** (ROI: Medium, share implementation with P1)

- What: Add TTL frontmatter to memory files:
  `ttl: ephemeral | sprint | permanent`. Default: permanent. The consolidation
  script archives ephemeral entries after 10 sessions, sprint entries after
  initiative completes.
- Critical constraint from D10a NR-05: NEVER apply decay to behavioral
  corrections (`feedback_*.md`) or architectural decisions. Only apply to
  progress/status notes. The failure mode — re-teaching already-corrected
  behaviors because they were "decayed" — is worse than the problem decay was
  meant to solve.
- Effort: 4-5 hours shared with confidence frontmatter implementation.
- Sources: D8b-2 (Pattern 2), D10a (NR-05 warning), D3b-2b (Yuval 7/30/permanent
  rates)

**D8b-2 P4 — Phase-Based Rule Loading** (ROI: Medium)

- What: Extract the 3-4 most token-heavy, phase-specific sections of CLAUDE.md
  into `.claude/rules/` files with glob-scoped frontmatter
  (pr-review-context.md, pre-commit-context.md, planning-context.md). Reduces
  CLAUDE.md from ~4,800 to ~3,500 tokens for sessions where that content is
  irrelevant.
- Source note: cursor-memory-bank's full 70% claim is unlikely to apply to
  SoNash given CLAUDE.md's different structure, but 1,000-1,500 token savings on
  60-70% of sessions is realistic.
- Effort: 3-4 hours. No new infrastructure (`.claude/rules/` already exists).
- Sources: D8b-2 (Pattern 4), D3a-2 (cursor-memory-bank)

### Tier C: Only If Needed (Infrastructure Required)

**P3 — Citation-Backed Validation** (ROI: Medium, requires
dream-skill/consolidation first)

- What: Add YAML frontmatter `citations: [path: ...]` to project*\*.md and
  reference*\*.md files referencing specific code locations. Write
  `validate-memory-citations.js` (~60 lines) to check cited paths still exist.
  Surface stale citations in session-begin pre-flight.
- Why defer: Depends on the consolidation pipeline (T2-B or AutoDream
  integration) to act on stale citations. Without that pipeline, citation
  checking surfaces warnings nobody can act on.
- Effort: 3-4 hours when consolidation pipeline is in place.
- Sources: D8b-1 (Pattern 3), D4b (GitHub Copilot citation model)

**P4-Basic — Lightweight Retrieval Scoring** (ROI: Medium without embeddings)

- What: Add a `salience: HIGH | MEDIUM | LOW` column to the MEMORY.md index. Add
  mtime-based recency note in session-begin. Add `related:` frontmatter to 10
  most-referenced topic files. This is a degraded but practical approximation of
  composite retrieval scoring without vector infrastructure.
- Note: Full composite scoring (60/20/10/10 from OpenMemory) requires
  embeddings, which is Tier 3. This is the no-infrastructure subset.
- Effort: 2.5 hours. No new infrastructure.
- Sources: D8b-1 (Pattern 4), D2c (OpenMemory), D4a (Generative Agents)

---

## Section 6: Risk Summary

### Top Risks (Ordered by Risk Score from D10a)

| Risk                                                       | Score | Likelihood | Impact | Current Status                                                 | Mitigation                                                                                                                                               |
| ---------------------------------------------------------- | ----- | ---------- | ------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CR-03: Debugging becomes impossible as layers increase     | 16/25 | 4          | 4      | Existing 14 mechanisms already strain debuggability            | Before adding any new mechanism: add a diagnostic command that audits all 14 mechanisms and reports health. This is a prerequisite.                      |
| FM-02: MCP memory startup hang (5-6 min)                   | 16/25 | 4          | 4      | Confirmed, closed NOT_PLANNED by Anthropic                     | NEVER add "check MCP memory at session start" to CLAUDE.md or any skill. Hooks-only injection. Mitigation is permanent — must stay in CLAUDE.md.         |
| FM-01: Canonical memory divergence                         | 15/25 | 5          | 3      | Active (7 missing entries, wrong expertise description)        | T1-A: autoMemoryDirectory to canonical-memory + one-time reconciliation. Resolves completely.                                                            |
| CR-01: 14 mechanisms already at max capacity               | 12/25 | 4          | 3      | 29% abandonment rate confirmed                                 | Only add zero-maintenance mechanisms. Each new mechanism must justify its existence against the 29% base rate.                                           |
| NR-01: Embedding model version drift                       | 12/25 | 3          | 4      | Future risk (if vector layer is added)                         | Use hybrid search (keyword + vector) so keyword fallback preserves function. Version-pin embedding models.                                               |
| FM-07: Hook breakage — silent, no error                    | 12/25 | 3          | 4      | Confirmed risk (PostToolUse broke 2+ months)                   | Session-start hook validation checking recent execution timestamps. Already partially present; strengthen it.                                            |
| NR-02: Semantic retrieval surfacing wrong memories         | 12/25 | 3          | 4      | Future risk (if vector layer is added)                         | Conservative retrieval: fewer, higher-confidence memories over more coverage. TTL/decay to de-rank stale entries.                                        |
| FM-04: SQLite corruption on cloud sync                     | 10/25 | 2          | 5      | Architecture risk if vector layer synced via OneDrive          | Never put SQLite on OneDrive/Dropbox paths. Keep L3 locale-local.                                                                                        |
| NR-03: Consolidation loses nuance                          | 9/25  | 3          | 3      | Future risk (if AutoDream or dream-skill used aggressively)    | Archive originals; never delete. Human review consolidation output before it becomes canonical.                                                          |
| NR-05: Decay expiring still-valid patterns                 | 9/25  | 3          | 3      | Future risk (if TTL implemented)                               | Only apply decay to time-sensitive types (progress, session notes). Never to feedback\_\*.md or architectural decisions.                                 |
| PR-01: AutoDream shipping and conflicting with custom work | 9/25  | 3          | 3      | AutoDream is live — conflict risk is CURRENT, not future       | Observe 3-5 sessions to understand behavior. Configure `autoDreamEnabled: false` if it over-prunes curated entries.                                      |
| PR-05: Native features obsoleting custom work              | 8/25  | 4          | 2      | Active trend — Anthropic ships memory features every few weeks | "Minimum viable custom" principle: build simplest enhancement, not most sophisticated. Reserve complexity for what Anthropic demonstrably will not ship. |

### Risk Posture: Simplification Before Addition

D10a's CR-03 finding is the most important single risk: the system is already at
the edge of debuggability for a solo non-developer. Adding complexity without a
diagnostic audit capability is building on an unstable foundation.

**The right order is:**

1. Fix what is broken (canonical-memory divergence, STATE_SCHEMA.md stale)
2. Enhance what already works (autoMemoryDirectory, episodic show permission)
3. Add what is confirmed necessary (consolidation when AutoDream behavior is
   understood)
4. Defer what is aspirational (vector search, Tier 3)

---

## Section 7: Solo Dev Reality Check

### The 29% Abandonment Rate

D10b's most important finding: 4 of 14 current mechanisms have already drifted
from their intended function.

| Abandoned/Diverged Mechanism | Evidence                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `canonical-memory/`          | Missing 7 entries, wrong expertise description, manually abandoned           |
| `STATE_SCHEMA.md`            | Documents 10 files; actual count 82. 8x drift.                               |
| `mcp__memory` active use     | Configured and permitted but rarely invoked; graph sparse after 250 sessions |
| `agent-token-usage.jsonl`    | Exists with 1 line; token tracking built but never operationalized           |

This is not a criticism. It is a measured base rate: anything new added to this
system has a ~30% probability of being abandoned within 20 sessions unless it is
genuinely zero-maintenance.

**The implication for each Tier:** Every new mechanism must be evaluated against
this base rate. "High value" is not sufficient — it must also be
zero-maintenance-or-automated, or it will join the abandoned list.

### The Session-End Discipline Problem

The session-end pipeline is load-bearing: if `/session-end` is skipped,
SESSION_CONTEXT, TDMS consolidation, learning system updates, and (with the
proposed enhancements) memory consolidation and MCP checkpoint all fail. D10b
confirms: "Session-end discipline is the load-bearing ritual."

**What must be automated (cannot rely on human discipline):**

- canonical-memory staging/commit (T2-A hook — add to session-end auto-commit)
- Memory consolidation trigger check (add condition to session-end skill — not a
  new discipline)
- MCP checkpoint for significant sessions (add condition to session-end skill —
  guarded)

**What can remain human-triggered:**

- dream-skill consolidation (periodic; monthly or when MEMORY.md feels noisy)
- STATE_SCHEMA.md updates (when state directory structure changes)
- Memory file TTL annotation (incremental, during normal work)
- Tier 2/3 items (planned via deep-plan, not ad-hoc)

### Maintenance Capacity Assessment

| Tier             | Items | Ongoing maintenance per item         | Total new maintenance                |
| ---------------- | ----- | ------------------------------------ | ------------------------------------ |
| T1 (all 5 items) | 5     | Zero to near-zero each               | Negligible                           |
| T2 (all 4 items) | 4     | Low each; T2-B requires periodic run | Low — ~10-15 min/month               |
| T3 (any)         | 0-1   | Medium to high                       | Do not pursue until specific trigger |

**Current sustainable capacity:** T1 + T2 is within capacity. T3 should not be
added while any T1/T2 items are incomplete. Tier 3 before Tier 1 is the route to
reaching the 29% abandonment rate faster.

### Anthropic Platform Risk: Build Minimum Viable Custom

AutoDream is confirmed live. The memory stack is receiving updates every few
weeks (v2.1.74 shipped autoMemoryDirectory; v2.1.83 added 25KB cap; v2.1.86 UI
changes — all within weeks). The "minimum viable custom" principle from D10a
PR-05 applies directly:

- Build only what Anthropic demonstrably will not ship: SoNash-specific
  behavioral corrections, custom hook logic, project-specific consolidation
  rules.
- Do not build what Anthropic has already built or is building: consolidated
  memory (AutoDream), cross-device sync (announced in roadmap), semantic search
  (potential future native feature).

---

## Section 8: Key Claims

Claims are numbered C-200 through C-243. Format: claim | confidence | sources.

```
C-200: The existing system is 70-80% of the way to the clean-slate architecture ideal, with the three roles (GOVERN/KNOW/RECALL) already implemented as CLAUDE.md/MEMORY.md/JSONL state files. | Confidence: HIGH | Sources: D9a, D8a
```

```
C-201: The hybrid approach (D8a) and clean-slate design (D9a) are not competing answers — D9a is the design target and D8a is the incremental route to reach it. | Confidence: HIGH | Sources: D8a, D9a
```

```
C-202: Setting autoMemoryDirectory to point at .claude/canonical-memory/ (git-tracked) is the highest-signal single action for cross-locale sync, requiring zero new infrastructure. | Confidence: HIGH | Sources: D8a, D9b, D10b
```

```
C-203: The canonical-memory directory is currently diverged: missing approximately 7 feedback entries and incorrectly describing user expertise as "Node.js expert" rather than "non-developer director." Reconciliation is required before autoMemoryDirectory is configured. | Confidence: HIGH | Sources: D10a, D10b, D8a
```

```
C-204: AutoDream is confirmed LIVE on this account (tengu_onyx_plover flag). Research findings that describe it as server-gated are superseded by user confirmation. Testing its behavior before adding dream-skill is required. | Confidence: HIGH | Sources: user confirmation, D10a
```

```
C-205: 4 of 14 current mechanisms have drifted from their intended function, giving a ~29% base-rate probability that any new mechanism will be abandoned within 20 sessions unless it is zero-maintenance or fully automated. | Confidence: HIGH | Sources: D10b
```

```
C-206: The session-end pipeline is the load-bearing ritual: if it is skipped, SESSION_CONTEXT, TDMS consolidation, learning system updates, and proposed enhancements all fail. It must not be lengthened beyond what can be executed in 2-3 minutes. | Confidence: HIGH | Sources: D10b
```

```
C-207: The MCP memory startup hang risk (5-6 minutes, closed NOT_PLANNED by Anthropic) is permanent. The mitigation — never add "check MCP memory at session start" to CLAUDE.md or any skill — must remain in place indefinitely. | Confidence: HIGH | Sources: D10a
```

```
C-208: Chroma (npm chromadb) is ARM64-only on Windows x64. It cannot be used as a vector store in this environment. This is documented in claude-mem Issue #1146 and applies to any tool using the npm chromadb package. | Confidence: HIGH | Sources: D9b
```

```
C-209: sqlite-vec is the best-fit vector store for this environment — embedded, no server process, works wherever SQLite runs, installs via npm, v0.1.9 confirmed released 2026-03-31. Critical gap: npm package behavior on Windows x64 without admin has not been independently verified in this specific environment. | Confidence: MEDIUM | Sources: D9b
```

```
C-210: The existing mcp__memory knowledge graph (@modelcontextprotocol/server-memory) is adequate for current scale (~500-1,500 entities). Enhancement: set MEMORY_FILE_PATH to a git-tracked path so the graph syncs cross-locale. | Confidence: HIGH | Sources: D9b, D8a
```

```
C-211: Neo4j is eliminated as a knowledge graph option — requires admin (Windows installer) or Docker (also admin). Hard block for this environment. | Confidence: HIGH | Sources: D9b
```

```
C-212: Local ONNX embeddings via @huggingface/transformers + all-MiniLM-L6-v2 are the correct primary embedding choice: zero cost, full privacy, offline, no admin. Known gap: Node.js v22 compatibility not independently verified. | Confidence: MEDIUM | Sources: D9b
```

```
C-213: Voyage AI is rejected despite Anthropic's endorsement: default retains training data, opt-out requires admin dashboard access, and cost is 3x OpenAI's backup option. | Confidence: HIGH | Sources: D9b
```

```
C-214: SQLite via cloud sync (OneDrive, Dropbox) carries silent corruption risk. SQLite official docs explicitly state network filesystem use is unsupported. Keep SQLite stores (L3 episodic layer) locale-local only. | Confidence: HIGH | Sources: D10a, D9a, D9b
```

```
C-215: The content-type-prior filter (A-MAC paper) eliminates approximately 70% of low-signal memory write candidates and is the single highest-leverage memory quality improvement available at near-zero cost. | Confidence: HIGH | Sources: D8b-1, D4a (academic)
```

```
C-216: Adding a Memory Admission Policy whitelist to CLAUDE.md (defining which categories are worth writing to auto-memory) is the highest ROI per hour of any pattern in the research — 45 minutes, zero infrastructure, immediate quality improvement. | Confidence: HIGH | Sources: D8b-1, D10b
```

```
C-217: The existing feedback_*.md file convention is already an implicit content-type-prior implementation. Making it explicit and extending it to all memory categories is the formalization, not a new invention. | Confidence: HIGH | Sources: D8b-1, D9a
```

```
C-218: Confidence decay (TTL) must NEVER be applied to behavioral corrections (feedback_*.md) or architectural decisions. The failure mode — re-teaching corrected behaviors because they were decayed — is worse than the memory entropy the decay was meant to solve. | Confidence: HIGH | Sources: D10a, D8b-2
```

```
C-219: MEMORY.md progressive disclosure (structured index with token counts, type tags, salience) reduces unnecessary topic file loading and improves session startup efficiency. The current system is partially implemented; formalization takes 2-3 hours. | Confidence: HIGH | Sources: D8b-1, D8a
```

```
C-220: Adding the episodic_memory_show permission to the allow-list is a 15-minute, zero-risk enhancement that completes the episodic retrieval path from search-only to search+retrieve. | Confidence: HIGH | Sources: D8a, D10b
```

```
C-221: codebase-memory-mcp fills a structural code intelligence gap that none of the session memory tools address. Windows amd64 binary, auto-detect install, zero ongoing maintenance. The D3a-2 serendipity finding explicitly identifies session memory and structural code intelligence as complementary, non-competing layers. | Confidence: HIGH | Sources: D10b, D9b
```

```
C-222: Engram (Go binary, FTS5, MCP stdio, Bare MCP mode) is the best standalone memory framework for the existing stack — aligns with the Go tool pattern already deployed (statusline), no shell dependencies in Bare MCP mode, export/import for cross-machine sync. | Confidence: HIGH | Sources: D9b
```

```
C-223: claude-mem must not be installed as a primary framework: 5 documented Windows-specific failures, CLAUDE.md subdirectory pollution bug closed NOT_PLANNED, AGPL-3.0 license, Bun + ChromaDB + PowerShell dependency chain that the no-admin work locale cannot satisfy. | Confidence: HIGH | Sources: D10b, D9b
```

```
C-224: The autoMemoryDirectory setting was shipped in Claude Code v2.1.74 (March 12, 2026) specifically to support redirecting memory writes to git-tracked or cloud-synced paths. It is the official mechanism for cross-locale memory sync. | Confidence: HIGH | Sources: D8a, D9b, D7a
```

```
C-225: autoMemoryDirectory cannot be set in project settings (.claude/settings.json, git-tracked). It must be set in settings.local.json at each locale. This is a security restriction, not a bug. | Confidence: HIGH | Sources: D9b, D8a
```

```
C-226: The Supermemory cloud plugin ($19/month) carries a Windows stdin hang (Issue #25, open since Feb 2026) and transmits full session transcripts to a third party. Both are disqualifying for this environment. | Confidence: HIGH | Sources: D10b
```

```
C-227: OMEGA Memory's 95.4% LongMemEval performance is irrelevant because it requires WSL2, which requires admin access that is unavailable at the work locale. | Confidence: HIGH | Sources: D10b, D5a
```

```
C-228: The existing .claude/state/consolidation.json + run-consolidation.js pattern is exactly the infrastructure needed for a memory consolidation pipeline. The implementation gap is not "build a new system" but "generalize the existing pattern from PR reviews to all memory types." | Confidence: HIGH | Sources: D9a, D8a
```

```
C-229: The existing MEMORY.md taxonomy (user_*, feedback_*, project_*, reference_*) maps directly to the A-MAC content-type-prior categories. The admission filter is already implicitly implemented; it needs to be made explicit and enforced. | Confidence: HIGH | Sources: D9a, D8b-1
```

```
C-230: Context rot risk (degraded output from injecting too many irrelevant memories) is a confirmed research finding. Distractors compound non-linearly: a single stale memory entry actively degrades output quality, not just wastes tokens. | Confidence: HIGH | Sources: D10a, D4a (academic)
```

```
C-231: Current startup token budget (~12,300-12,600 tokens estimated) is within safe bounds. Risk emerges if MEMORY.md approaches the 25KB cap AND additional MCP servers are added. A startup budget guard in session-begin should warn at >18,000 tokens. | Confidence: HIGH | Sources: D8a
```

```
C-232: The LongMemEval benchmark shows approximately 30% accuracy drop on memorizing information across sustained interactions even for commercial assistants. Memory systems are not reliably accurate at retrieval under sustained use — conservative retrieval design is warranted. | Confidence: HIGH | Sources: D10a, D4a (academic)
```

```
C-233: Consolidation that runs in a context-free mode (AutoDream's documented architecture: "fresh conversation with no access to prior conversation history") risks compressing nuanced conditional rules into flat rules. Archive originals; never delete source memories during consolidation. | Confidence: HIGH | Sources: D10a, D3b-2a
```

```
C-234: The "minimum viable custom" principle applies to this project: build only what Anthropic demonstrably will not ship. AutoDream is live, native cross-device sync is in the roadmap. Building infrastructure that Anthropic ships in 6 months is wasted effort. | Confidence: HIGH | Sources: D10a, D10b
```

```
C-235: Each new hook adds latency to every tool call in Claude Code. With 25 hooks already running, a performance budget for new hooks is required. Any PostToolUse hook doing non-trivial work must use fire-and-forget queue architecture (30-second timeout is a hard constraint). | Confidence: HIGH | Sources: D10a, D8a
```

```
C-236: The clean-slate architecture's primary gaps (relative to current system) are: (a) no admission gate at write time, (b) no decay/TTL enforcement, (c) consolidation not generalized beyond PR reviews, (d) canonical-memory divergence. All four are addressable without replacing any existing mechanism. | Confidence: HIGH | Sources: D9a, D8a
```

```
C-237: Reasoning trace capture (storing how Claude reasoned, not just what it decided) is supported by Reflexion (NeurIPS 2023): +11% HumanEval improvement by re-reading past reasoning traces. For SoNash, a lightweight .claude/state/reasoning-traces.jsonl achieves this without cipher's full infrastructure. | Confidence: MEDIUM | Sources: D8b-1, D4a (academic)
```

```
C-238: Memory promotion rules (project-scoped knowledge elevating to global scope only after 3+ session recurrences) would prevent project-specific noise from polluting global memory. The existing MEMORY.md taxonomy already has the scope structure; the promotion rule formalizes it. | Confidence: MEDIUM | Sources: D8b-2
```

```
C-239: Phase-based rule loading via .claude/rules/ glob-scoped files can reduce CLAUDE.md effective tokens from ~4,800 to ~3,500 for sessions where phase-specific sections are irrelevant. The .claude/rules/ directory already supports this mechanism. | Confidence: MEDIUM | Sources: D8b-2
```

```
C-240: T2-D (completing autoMemoryDirectory at the home locale) requires physical access to the home machine and cannot be done remotely. It should be scheduled as a dedicated session at that locale, not attempted ad-hoc. | Confidence: HIGH | Sources: D10b
```

```
C-241: The autoMemoryDirectory + git-tracked directory pattern appears to be novel — the research found no reference implementations of this specific combination. The closest precedent is the existing .claude/canonical-memory/ which was manually maintained but never set as autoMemoryDirectory. Treat Phase 1 as an experiment with a defined rollback path. | Confidence: MEDIUM | Sources: D9a
```

```
C-242: The STATE_SCHEMA.md documents 10 state files while the actual state directory has 82 files — an 8x drift. Fixing this is a T1 free win: one session, 20-30 minutes, prevents wasted orientation time in every future session. | Confidence: HIGH | Sources: D10a, D10b
```

```
C-243: Docker-based memory tools (Hindsight, OpenMemory/Mem0, Qdrant standalone, Weaviate) are eliminated for this environment regardless of quality. Docker requires Hyper-V or WSL2; no admin at work locale is a hard block. This includes systems rated highly on quality benchmarks. | Confidence: HIGH | Sources: D10b, D9b
```

---

## Quick-Reference Decision Map

```
TODAY (hours):
  1. One-time: Reconcile live auto-memory with canonical-memory (merge 7 missing entries, fix expertise description)
  2. T1-A: Set autoMemoryDirectory in settings.local.json at work locale
  3. T1-C: Add episodic_memory_show to allow-list (15 minutes)
  4. T1-D: Update STATE_SCHEMA.md (one session, 20-30 min)
  5. P5: Add Memory Admission Policy to CLAUDE.md (45 min)
  6. P6-min: Add "update memory when initiative completes" rule to CLAUDE.md (15 min)
  7. Observe AutoDream behavior for 3-5 sessions before doing anything else with memory consolidation

NEXT SPRINT (plan via deep-plan):
  8. T1-E: Set MEMORY_FILE_PATH in .mcp.json
  9. T2-A: Add canonical-memory to session-end auto-commit hook
  10. T2-B: Build scripts/consolidate-memory.js (after AutoDream observation period)
  11. T2-C: Install codebase-memory-mcp binary
  12. P1: Restructure MEMORY.md as token-aware index
  13. D8b-2 P1+P2: Confidence frontmatter + TTL annotations (combined session)

HOME LOCALE (requires physical access):
  14. T2-D: Configure autoMemoryDirectory at home (Owner) locale

DEFER INDEFINITELY:
  15. T3-A: Semantic vector layer (only if confirmed pain, 3+ times/week)
  16. T3-B: Cloud MCP server (only if git sync fails 3+ times)
  17. T3-C: Knowledge graph semantic layer (only at 500+ sessions scale)
```

---

## Sources Cross-Reference

| ID    | File                                 | Role in synthesis                                                                                                                   |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| D8a   | D8a-hybrid-enhanced-design.md        | Primary architecture proposal, token budget, phases, enhancement details                                                            |
| D8b-1 | D8b-1-capture-retrieval-patterns.md  | Pattern catalog: progressive disclosure, reasoning traces, citation validation, composite scoring, content-type filtering, anti-rot |
| D8b-2 | D8b-2-lifecycle-workflow-patterns.md | Pattern catalog: confidence scoring, decay, promotion rules, phase-based loading                                                    |
| D9a   | D9a-clean-slate-architecture.md      | Design target, 70-80% overlap finding, 9 design principles, non-goals                                                               |
| D9b   | D9b-technology-evaluation.md         | Technology picks, Windows compatibility matrix, all rejections                                                                      |
| D10a  | D10a-failure-modes-risks.md          | All 12 failure mode/risk entries, risk scoring, platform risks                                                                      |
| D10b  | D10b-solo-dev-feasibility.md         | Tier structure, 29% abandonment rate, maintenance capacity, Do-NOT-Do list                                                          |
