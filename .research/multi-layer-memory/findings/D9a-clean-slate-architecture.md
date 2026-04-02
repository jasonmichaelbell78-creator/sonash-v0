# Findings: Clean-Slate Memory System Architecture

**Searcher:** deep-research-searcher **Profile:** web+design **Date:**
2026-03-31 **Sub-Question IDs:** SQ9

**Source material:** All 16 prior findings files (D1 through D7b), covering:

- Codebase inventory of 14 existing persistence mechanisms (D1)
- Deep analysis of claude-mem, cipher, ECC, supermemory, OpenMemory (D2a-D2c)
- GitHub ecosystem discovery: 25+ memory repos (D3a-1, D3a-2, D3b-1, D3b-2a,
  D3b-2b, D3c)
- Academic foundations: MemGPT, Generative Agents, Reflexion, Voyager, MIRIX,
  A-MEM, LightMem, A-MAC, Context Rot, Anthropic memory tool (D4a)
- Industry implementations: Devin, SWE-Agent, OpenHands, Letta, GitHub Copilot,
  Augment (D4b)
- MCP memory servers (D5a, D5b)
- Comparison matrix across 25 systems (D6a)
- Architecture pattern taxonomy (D6b)
- Cross-locale sync analysis (D7a, D7b)

**Constraint context:** Solo non-developer director, 250+ sessions, two Windows
machines (Owner home / jbell work), no admin at work locale, private GitHub
repo, AutoDream is live (feature flag `tengu_onyx_plover`), portable binary
installs only.

---

## Purpose of This Document

This is the "north star" design: what would an ideal memory system look like if
built from scratch for this user, this workflow, and this codebase —
unconstrained by the existing 14 mechanisms?

Its role is comparative. The hybrid approach (D8a) will evaluate how close the
existing system already is to this ideal. This document should be read as a
design target, not an implementation prescription.

---

## Key Findings

### 1. Core Architecture: Three Roles, Four Layers, One Contract [CONFIDENCE: HIGH]

The clean-slate architecture has a name for every memory element based on its
role, persistence layer, and lifecycle. Every memory belongs to exactly one
role.

**Three roles** (drawn from the three-role model already latent in the existing
system):

| Role   | Purpose                                               | Changes how often          | Who writes it  |
| ------ | ----------------------------------------------------- | -------------------------- | -------------- |
| GOVERN | Rules, constraints, security boundaries               | Rarely (weeks-months)      | Human only     |
| KNOW   | Standing facts, user profile, architectural decisions | Occasionally (sessions)    | Human + Claude |
| RECALL | Episodic events, session observations, task state     | Frequently (every session) | Claude + hooks |

No memory element should straddle two roles. The existing CLAUDE.md = GOVERN.
The existing MEMORY.md = KNOW. The existing session JSONL files = RECALL. The
confusion in the current system comes from these roles leaking into each other.

**Four layers** (each layer has exactly one storage backend):

| Layer             | Role served   | Backend                          | Size budget                       | Loaded when                   |
| ----------------- | ------------- | -------------------------------- | --------------------------------- | ----------------------------- |
| L1: Always-On     | GOVERN        | Markdown file (project root)     | Hard cap 150 lines / 7KB          | Every session, every turn     |
| L2: Session-Start | KNOW          | Markdown directory (git-tracked) | 200 lines / 25KB across all files | Every session start           |
| L3: On-Demand     | KNOW + RECALL | SQLite + sqlite-vec (local)      | Unbounded                         | When agent queries            |
| L4: Archive       | RECALL        | Append-only JSONL (git-tracked)  | Unbounded                         | Never auto-loaded; audit only |

**The contract:** Every memory object is written to exactly one layer. Promotion
is explicit: a RECALL observation can be promoted to KNOW, but only through a
defined consolidation step. Nothing from L3 or L4 enters L1 or L2 without human
review or a named consolidation trigger.

---

### 2. Memory Taxonomy: Six Types Across Three Roles [CONFIDENCE: HIGH]

Drawing from MIRIX (6-component model), OpenMemory (5 cognitive sectors),
Generative Agents (recency + importance + relevance), and the cognitive science
literature:

| Type       | Role   | Layer | Decay Rate                                   | Example                                               |
| ---------- | ------ | ----- | -------------------------------------------- | ----------------------------------------------------- |
| Directive  | GOVERN | L1    | None (permanent unless human removes)        | "Never push to remote without approval"               |
| Fact       | KNOW   | L2    | Slow (30-day half-life; access resets clock) | "Firebase project ID is sonash-app"                   |
| Preference | KNOW   | L2    | Medium (14-day half-life)                    | "User prefers concise responses, batch 5-8 questions" |
| Pattern    | KNOW   | L2    | Slow (revoked only by contradiction)         | "PR review must use convergence loops"                |
| Episode    | RECALL | L3    | Fast (7-day half-life from last access)      | "Session 250: fixed hook test failures for 7 hooks"   |
| Artifact   | RECALL | L4    | Never (permanent archive)                    | Full compaction snapshot (handoff.json equivalent)    |

**Lifecycle for each type:**

- Directive: Human writes to L1 → reviewed at major version increments → human
  removes or promotes
- Fact: Claude or hook writes to L2 → A-MAC admission filter (content-type-prior
  check) → decay timer starts → promoted to L1 only if it becomes rule-like →
  expires if not accessed in N days
- Preference: Extracted from corrections and feedback → stored in L2 → decays if
  not reinforced
- Pattern: Accumulated from multiple episodes (requires 2+ occurrences per
  claude-diary pattern) → graduates to L2 → becomes Directive if enforced in
  every session
- Episode: Hook writes to L3 → consolidated to Pattern after 2+ occurrences →
  archived to L4 after 7 days
- Artifact: Hook writes to L4 → never promoted → used only for audit and
  post-hoc recovery

This taxonomy is directly inspired by:

- The five-factor A-MAC admission policy (D4a): content-type-prior is the
  strongest predictor
- OpenMemory's differential decay rates (D2c): episodic decays at 0.015,
  semantic at 0.005
- GitHub Copilot's 28-day TTL with access-refresh (D4b)
- Generative Agents' recency + importance + relevance scoring (D4a)

---

### 3. Capture Pipeline: How Memories Enter the System [CONFIDENCE: HIGH]

The capture pipeline has two channels. Both converge at the same admission gate.

**Channel A: Hook-Guaranteed Capture (for Episodes and Artifacts)**

Hooks fire at fixed lifecycle events, regardless of Claude's behavior. This is
the supermemory lesson (D5b): hooks are the only mechanism that guarantees
capture.

```
SessionStart hook    → Read L2 (inject known facts/patterns into context)
                     → Check consolidation queue (are any episodes ready to promote?)
PostToolUse hook     → Write Episode to L3 queue (async, fire-and-forget)
PreCompact hook      → Write Artifact to L4 (full snapshot before memory loss)
Stop hook            → Trigger short-term consolidation (group episodes by topic)
                     → Run admission gate on new L2 candidates
SessionEnd           → Write session summary Episode to L3
                     → Promote any patterns (2+ occurrences) to L2
                     → Archive decayed L3 entries to L4
```

Key design decisions:

- PostToolUse writes to a **queue** (local JSON file), not directly to SQLite.
  Queue processing happens async (not blocking the 30s hook timeout). This is
  the claude-mem fire-and-forget architecture (D2a).
- PreCompact is the safety net: even if all other capture fails, the full
  context snapshot goes to L4 before compaction fires. This is the existing
  Layer C in the current system and must be preserved.
- Stop hook is "sleep-time consolidation" (LightMem, D4a): the end of a session
  is when raw episodes get grouped, deduplicated, and evaluated for promotion.

**Channel B: Admission Gate (for Facts, Preferences, Patterns)**

Not everything that hooks capture should become a standing memory. The A-MAC
paper (D4a) found that "content type prior" is the strongest signal for what to
store.

The admission gate applies five filters in order (cheapest first):

1. **Content-type-prior filter**: Does this match a known storable type?
   Storable types: architectural decision, user correction, behavioral feedback,
   discovered constraint, system fact, tool preference. Non-storable types:
   intermediate reasoning, routine file reads, build output. This filter alone
   eliminates ~70% of candidates.

2. **Semantic novelty filter**: Is this already captured? Jaccard similarity
   (60% threshold) against existing L2 entries for the same type. Low-cost:
   string-based, no embedding API needed.

3. **Temporal recency filter**: If this contradicts an existing entry, is it
   newer? If yes: update the existing entry (Supermemory's relational versioning
   — Updates/ Extends/Derives, D2c). If no: discard.

4. **Confidence threshold**: Does the episode have high enough signal strength?
   Single occurrence: store as Pattern candidate (pending 2nd occurrence). Two+
   occurrences: promote to Pattern in L2. User-confirmed: store immediately
   regardless of occurrence count.

5. **Budget check**: Does adding this exceed the L2 size budget (200 lines /
   25KB)? If yes: demote the lowest-confidence existing entry to L3 before
   adding the new one. This enforces a bounded L2 — entries compete for limited
   space.

---

### 4. Retrieval Pipeline: How Memories Are Surfaced [CONFIDENCE: HIGH]

The retrieval pipeline implements progressive disclosure (claude-mem, D2a): the
cheapest retrieval runs first, with deeper retrieval only on demand.

**Always-Inject (Layer 1 and 2 — at every SessionStart):**

The L1 GOVERN file is injected in full. This is the current CLAUDE.md. Hard cap:
150 lines. Above 150 lines, model adherence degrades measurably.

The L2 KNOW directory injects the first 200 lines of the index file. Individual
L2 files are referenced by name in the index but loaded on demand. This is the
existing MEMORY.md pattern — it already implements this correctly.

**On-Demand (Layer 3 — when Claude queries or context requires):**

Three-layer progressive disclosure (from claude-mem, D2a):

- **Index layer** (~50-100 tokens): Returns metadata only — titles, dates,
  types, token counts. Claude decides whether to fetch full content.
- **Timeline layer** (~200-500 tokens): Chronological context around selected
  episodes. Useful for "what happened in the last 3 sessions around topic X?"
- **Detail layer** (~500-1,000 tokens per entry): Full narrative and facts for
  specific selected IDs only.

Retrieval scoring (from OpenMemory composite, Generative Agents, D2c, D4a):

```
retrieval_score = (0.5 * semantic_similarity)
                + (0.2 * salience_score)
                + (0.2 * recency_score)
                + (0.1 * access_frequency)
```

Where:

- semantic_similarity: cosine similarity between query embedding and entry
  embedding
- salience_score: human-assigned (1-5) or auto-assigned based on type
  (Directive=5, Fact=3, Episode=2)
- recency_score: exponential decay from last access (half-life configurable per
  type)
- access_frequency: normalized count of how often this entry has been retrieved

**Semantic Retrieval Backend:**

SQLite + sqlite-vec extension. Local ONNX embeddings (bge-small-en-v1.5 or
MiniLM-L6-v2 — both ~23MB, no API key, no internet required). This is the exact
backend used by the episodic-memory plugin already configured in this project
(D5a).

Key constraint: embeddings must run locally. No API calls for retrieval. Both
Qdrant (local path mode, uvx) and sqlite-vec (embedded) meet this constraint.
sqlite-vec is preferred because it's a single SQLite extension — zero additional
process, no Docker, no admin.

**Content-Type-Prior Filtering at Retrieval:**

Before semantic search, filter the candidate pool by memory type. If Claude is
debugging, search Episodes first. If Claude is writing new code, search Patterns
and Facts. This is the A-MAC insight applied to retrieval, not just admission.

---

### 5. Consolidation Pipeline: How Memories Evolve Over Time [CONFIDENCE: HIGH]

The consolidation pipeline runs at two timescales: within-session (fast) and
between-sessions (slow). This is the LightMem three-stage model (D4a).

**Stage 1: Within-Session Fast Consolidation (Stop hook)**

At session end:

1. Group all new Episodes from the L3 queue by topic (keyword clustering, no LLM
   needed)
2. Deduplicate within each topic group (Jaccard similarity, 60% threshold)
3. For each group: if 2+ Episodes share the same pattern, create a Pattern
   candidate
4. Write Pattern candidates to L2 with status: `pending_confirmation`
5. Write deduplicated Episodes to L3 SQLite

**Stage 2: Cross-Session Slow Consolidation (AutoDream-equivalent)**

Triggered at: 5 sessions elapsed OR 24 hours since last consolidation, whichever
comes first. This matches AutoDream's trigger conditions
(`minSessions: 5, minHours: 24`).

Four-phase cycle (identical to AutoDream's documented architecture, D6b):

1. **Orient**: Read all L2 entries; identify entries with `pending_confirmation`
   status; identify entries not accessed in >14 days (Fact) or >7 days (Episode)
2. **Gather signal**: Check if pending-confirmation Patterns have been
   reinforced (accessed or triggered) in recent sessions
3. **Consolidate**: Merge duplicates; promote confirmed Patterns; convert
   relative dates to absolute; resolve contradictions by keeping newer entry
4. **Prune**: Archive stale entries to L4 (do not delete — always archive); keep
   L2 under 200 lines

The consolidation agent writes a one-line summary to a `consolidation.json`
state file (same as the existing `.claude/state/consolidation.json` pattern).

**Stage 3: Episodic-to-Semantic Promotion**

This is the hardest transition: converting instance-specific Episodes into
general-purpose Patterns. The system uses the Reflexion pattern (D4a): verbal
reinforcement. When Claude makes an error that contradicts an existing Pattern,
it writes a "correction episode" to L3. The consolidation pipeline detects
correction episodes and either:

- Strengthens the Pattern (if the correction confirms it)
- Demotes the Pattern to L2 with `disputed` status (if the correction
  contradicts it)
- Archives the Pattern to L4 (if 3+ corrections show it is wrong)

This is how the existing learning system works for PR reviews
(`run-consolidation.js`, `CODE_PATTERNS.md`). The clean-slate system generalizes
this pipeline to all memory types.

**Decay Formula (ACT-R inspired, D4a):**

```
salience(t) = salience_initial * exp(-decay_rate * days_since_last_access)
```

Decay rates by type (matching OpenMemory's sector rates, adapted):

- Directive: 0 (no decay; permanent until human removes)
- Fact: 0.005/day (~200-day half-life)
- Preference: 0.023/day (~30-day half-life)
- Pattern: 0.005/day (~200-day half-life)
- Episode: 0.099/day (~7-day half-life)

Entries with salience below 0.1 are archived to L4 on next consolidation cycle.
Access resets the salience clock (reinforcement on retrieval — Hebbian learning
analog).

---

### 6. Sync Architecture: Cross-Locale Operation [CONFIDENCE: HIGH]

The clean-slate sync design solves the path-keying problem permanently.

**The root problem:** Claude Code's Auto Memory keys the memory directory to the
absolute filesystem path (`C--Users-jbell--...` vs `C--Users-jason--...`). Two
machines = two separate memory directories with no auto-sync.

**The clean-slate solution: `autoMemoryDirectory` → Git-tracked path**

```json
// In settings.local.json at EACH locale (not settings.json — security restriction)
{
  "autoMemoryDirectory": "C:\\Users\\<user>\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

Both locales point at the same logical directory (`.claude/canonical-memory/`)
within the git repo. Normal `git pull` / `git push` propagates memory. No new
infrastructure. No third-party cloud. No sync tool needed.

This resolves the canonical-memory divergence identified in D1 and is the
"highest- signal finding" from D7a.

**What syncs via git (L1 and L2 — always):**

| File/Directory                     | What it is        | Sync mechanism              |
| ---------------------------------- | ----------------- | --------------------------- |
| `CLAUDE.md`                        | L1 GOVERN         | git (always has been)       |
| `.claude/canonical-memory/*.md`    | L2 KNOW           | git via autoMemoryDirectory |
| `.claude/state/*.jsonl` (selected) | L4 RECALL archive | git (already tracked)       |
| `.mcp.json`                        | MCP server config | git (already tracked)       |

**What stays local (L3 — never syncs):**

| Item                                            | Why not synced                                  |
| ----------------------------------------------- | ----------------------------------------------- |
| SQLite memory DB (`~/.claude-memory/memory.db`) | SQLite on network paths = corruption risk (D7a) |
| L3 episode queue (local JSON file)              | Session-transient; ephemeral by design          |
| Hook dot-files (`.session-state.json`, etc.)    | Session-transient; ephemeral by design          |
| Compaction handoff (`handoff.json`)             | Session-transient; rebuilt next session         |

**Conflict resolution for L2 (plain markdown):**

Git merge handles plain markdown well. For a solo operator who never runs both
locales simultaneously, conflicts are hypothetical. The merge strategy is:

- Line-level git merge (default) handles non-overlapping additions
- Manual resolve for true conflicts (same line edited from both sides)
- The consolidation pipeline runs at next session start to clean up any merge
  noise

**L3 on a new locale:**

When opening the second locale after a gap, L3 (local SQLite) will be empty or
stale. The SessionStart hook handles this gracefully: L2 provides the standing
knowledge; L3 starts fresh and rebuilds from new Episodes during the session. L3
is session-scoped, not cross-locale-scoped by design. This is acceptable because
the high-value knowledge is in L2 (git-synced) not L3.

---

### 7. Token Budget: Staying Within Context Limits [CONFIDENCE: HIGH]

Based on the token analysis from D5b (community-measured overhead), and Context
Rot research (D4a: every model degrades with more context, distractors compound
non-linearly):

**Budget allocation at session start:**

| Component                            | Token ceiling                               | Current system                                        |
| ------------------------------------ | ------------------------------------------- | ----------------------------------------------------- |
| L1 GOVERN (CLAUDE.md)                | 7,000 tokens (150 lines)                    | ~7,000 tokens (258 lines — over budget)               |
| L2 KNOW (MEMORY.md + topic files)    | 6,000 tokens (200 lines / 25KB)             | ~6,000 tokens (91-line index, files loaded on demand) |
| MCP tool descriptions                | 2,000 tokens                                | ~2,000 tokens                                         |
| Session context (SESSION_CONTEXT.md) | 3,000 tokens (current session summary only) | ~4,500 tokens (300-line target)                       |
| Reserve (conversation + work)        | 82,000+ tokens                              | Variable                                              |
| **Total always-on budget**           | **~18,000 tokens**                          | **~19,500 tokens**                                    |

The clean-slate design enforces hard caps:

- L1 hard cap: 150 lines (CLAUDE.md target already defined; currently at 258
  lines — needs trim)
- L2 hard cap: 200 lines across the index file (current system already enforces
  this via AutoDream)
- SESSION_CONTEXT.md hard cap: 200 lines (reduce from 300 target)

These caps enforce Anthropic's principle: "the smallest set of high-signal
tokens that maximize the likelihood of your desired outcome" (D4a, Anthropic
context engineering blog).

**Progressive disclosure for L3 retrieval:**

L3 retrieval never auto-injects. It is always on-demand. When Claude retrieves
from L3, it first gets only the index (~50-100 tokens per entry in the result
set). Full detail retrieval is a second explicit call. This prevents L3 from
inflating the context budget accidentally.

**Budget enforcement mechanism:**

The admission gate (Channel B, Finding 3) enforces L2 budget by requiring
demotion of the lowest-confidence existing entry before any new entry can enter.
This creates competitive selection among L2 entries — important content stays;
stale content gets archived. This is the Yuval two-tier architecture's budget
allocation approach (D3b-2b).

---

### 8. Technology Choices: Specific Tools and Rationale [CONFIDENCE: HIGH]

All choices are constrained by: Windows-native, no admin, portable installs, no
Docker, no third-party cloud for memory data.

**L1 — GOVERN store:**

- Technology: Plain Markdown file (`CLAUDE.md`)
- Rationale: Already working perfectly. Zero infrastructure. Survives all tool
  changes. Human-readable. Git-tracked. The only required change is trimming
  from 258 to 150 lines.

**L2 — KNOW store:**

- Technology: Markdown directory (`.claude/canonical-memory/`) via
  `autoMemoryDirectory`
- Rationale: Already partially implemented. Zero new infrastructure.
  Git-tracked. Survives cross-locale moves. The `autoMemoryDirectory` setting
  (v2.1.74+) is the official Claude Code mechanism for this exact use case.
  Setting it at both locales is the only required configuration change.
- Alternative considered: `basic-memory` MCP server (Markdown + SQLite +
  FastEmbed). Rejected for L2 because it adds infrastructure for a problem
  markdown + git already solves. Relevant for L3 only.

**L3 — On-Demand RECALL store:**

- Technology: SQLite + sqlite-vec (embedded, no separate server process)
- Embeddings: ONNX MiniLM-L6-v2 or bge-small-en-v1.5 via `@xenova/transformers`
  (Node.js) or `fastembed` (Python via uvx). Both are ~23MB, offline, no API
  key.
- MCP interface: Expose via the existing `@modelcontextprotocol/server-memory`
  OR a lightweight custom MCP wrapper reading the SQLite DB.
- Rationale: The episodic-memory plugin (D5a) already uses this exact stack
  (SQLite-vec, 384-dim local embeddings, Superpowers plugin). The existing
  `mcp__memory` knowledge graph (JSONL-backed) covers the graph-structured
  subset. No new technology required; the question is whether to merge these or
  keep them separate.
- Recommended: Keep the JSONL knowledge graph (`mcp__memory`) for architectural
  decisions (entities + relations, rarely queried by semantic similarity). Use
  sqlite-vec for high-volume Episodes (semantic similarity is the right
  retrieval method for "what did I work on last Tuesday?").

**L4 — Archive store:**

- Technology: Append-only JSONL files (`.claude/state/*.jsonl`, git-tracked)
- Rationale: Already the dominant pattern for all operational logs in the
  system. Proven, rotation logic exists (`rotate-jsonl.js`), git-diffable. No
  change needed.

**Capture pipeline backend:**

- Technology: Node.js hook scripts (already the dominant implementation
  language)
- Queue backend: Local JSON file (`.claude/hooks/.memory-queue.json`)
- Rationale: Consistent with existing 25 hook scripts. No new language required.
  The fire-and-forget queue pattern prevents 30s timeout violations.

**Consolidation pipeline:**

- Technology: Node.js script (`run-consolidation.js` pattern, already exists) or
  the `dream-skill` community plugin (replicates AutoDream's 4-phase cycle).
- Rationale: The existing `run-consolidation.js` already implements
  consolidation for the PR review learning system. The clean-slate architecture
  generalizes this to all memory types using the same trigger mechanism
  (threshold-based or time-based, configurable via `consolidation.json`).

**Sync:**

- Technology: `autoMemoryDirectory` → `.claude/canonical-memory/` + git
- No new technology. Zero new infrastructure. Uses tools already operational.

---

### 9. What This System Would NOT Do [CONFIDENCE: HIGH]

Explicit non-goals are as important as goals. Systems that violate these
boundaries create the problems documented in D3b-1 (community failures) and D4b
(Cursor dropped auto-memory, OpenHands has no cross-session memory, Bolt/v0
context drift).

**1. No cloud memory storage.** All memory stays local or in the private git
repo. The Supermemory plugin ($19/month) and similar cloud approaches are
excluded on privacy and cost grounds. Cloud memory violates the "data
sovereignty" requirement documented across community discussions (D3b-1: "I'd
prefer not to send proprietary code to third-party servers").

**2. No automatic capture without a quality gate.** The system does NOT capture
everything. The A-MAC admission gate filters every capture candidate. "Automatic
capture" tools that record every tool call (claude-mem's default mode) create
context rot without curation. The capture rule: observe everything, store only
what passes the content-type-prior filter.

**3. No semantic search for L1 and L2.** CLAUDE.md and MEMORY.md are small
enough (150 lines, 200 lines) that they inject in full at session start. Adding
semantic search to find content in a 150-line file is engineering theater — it
adds infrastructure to solve a non-problem. Semantic search is reserved for L3
(high-volume episodic store).

**4. No automatic writes to CLAUDE.md.** L1 (GOVERN) is human-controlled.
AutoDream's documented behavior confirms this: it modifies MEMORY.md files but
does not autonomously rewrite CLAUDE.md. Automated writes to CLAUDE.md are a
guardrail violation (analogous to "never set SKIP_REASON autonomously"). Claude
may propose additions to CLAUDE.md; the human must approve before any write.

**5. No team memory.** The workspace memory features of cipher (D2a) and
claude-supermemory (D2c) are explicitly excluded. This is a solo system.
Multi-user memory isolation complexity (OpenMemory Issue #122, D2c) is
irrelevant here and adding it would create unnecessary complexity.

**6. No always-on SQLite sync between locales.** SQLite on cloud sync is
explicitly unsafe (SQLite official docs, D7a). The L3 store is intentionally
locale-local. Cross-locale knowledge travels via L2 (git-tracked markdown), not
L3 (local SQLite).

**7. No vector embeddings for L1 or L2 retrieval.** Embedding-based retrieval is
powerful but has cost: API calls, latency, or local inference overhead. For
150-350 lines of markdown, the cost is not justified. Vector embeddings are
reserved for L3 where the corpus is large enough (100+ episodes) for semantic
search to provide real value over keyword matching.

**8. No external MCP servers requiring Docker or admin.** OMEGA Memory (D5a)
requires WSL2. Weaviate requires Docker. Neo4j requires either Docker or an
installed service. All require admin or elevated access at some point. The
clean-slate system runs entirely on: `npx` (no admin), `uvx` (no admin, Python
portable via uv), and built-in Claude Code hooks. Zero Docker dependency.

**9. No separate knowledge graph database.** Neo4j, Memgraph, and similar graph
databases are excluded. The existing JSONL-backed
`@modelcontextprotocol/server-memory` provides knowledge graph capabilities for
architectural decisions without any database infrastructure. For richer graph
needs, the A-MEM Zettelkasten approach (wiki-style `[[links]]` in markdown)
covers most use cases without a graph database.

**10. No LLM API calls during session hooks.** Hook scripts must return within
30 seconds. LLM API calls during hooks (as cipher's extract-and-operate does)
risk timeout failures. The clean-slate system defers all LLM-assisted processing
(consolidation, pattern extraction) to the Stop hook and session-end
consolidation pipeline, where timeouts are not a constraint.

---

## Architecture Diagram (Conceptual)

```
CAPTURE PIPELINE
================
PostToolUse hook ──────────────────────────────→ Queue (local JSON)
                                                         │
                                         Async: every N minutes
                                                         ↓
                                          Admission Gate (5 filters)
                                                    │         │
                                              PASS  │         │ FAIL
                                                    ↓         ↓
Stop hook / SessionEnd ──────────────────→ L3 SQLite+vec   Discard
                                            (Episodes)
                                                    │
                                     Consolidation (Stop hook)
                                                    │
                                     Pattern found (2+ episodes)?
                                                    ↓
                                             L2 Markdown
                                          (Pattern candidate)
                                                    │
                                  AutoDream / Consolidation pipeline
                                       (5 sessions / 24 hours)
                                                    │
                                     Confirmed pattern / Fact?
                                                    ↓
                                             L2 Markdown
                                          (standing KNOW entry)
                                                    │
                                         Becomes rule-like?
                                                    ↓
                                   → Human review → L1 CLAUDE.md

PreCompact hook ─────────────────────────────────→ L4 JSONL archive

RETRIEVAL PIPELINE
==================
SessionStart ──────────────────────→ Inject L1 (full, always)
                                   → Inject L2 index (200 lines, always)
                                   → Consolidation check (run if due)

During session (Claude queries) ──→ L3 Progressive Disclosure:
                                      Step 1: Index (~50-100 tokens)
                                      Step 2: Timeline (on request)
                                      Step 3: Full detail (on request)

During session (Claude needs graph) → L4 JSONL knowledge graph
                                       (mcp__memory entities/relations)

SYNC PIPELINE
=============
L1 (CLAUDE.md) ────────────────────→ git commit + push (already working)
L2 (.claude/canonical-memory/) ────→ git commit + push (via autoMemoryDirectory)
L3 (SQLite) ───────────────────────→ No sync (locale-local by design)
L4 (JSONL archives) ───────────────→ git commit + push (selected files, already working)
```

---

## Design Principles Distilled

Nine principles that distinguish this architecture from the existing system:

1. **Role separation is enforced, not implied.** Every memory object has exactly
   one role (GOVERN / KNOW / RECALL). Nothing spans roles. The confusion between
   CLAUDE.md-as-rules and MEMORY.md-as-facts is structural, not incidental.

2. **Hooks guarantee capture; MCP tools guarantee retrieval.** The supermemory
   lesson. Never rely on Claude to voluntarily capture important context. Never
   load all context passively when on-demand retrieval is cheaper.

3. **Admission gates are cheaper than cleanup.** Filtering at write-time (5
   admission filters) prevents the context rot that accumulates when everything
   is stored. The A-MAC content-type-prior filter eliminates ~70% of candidates
   before any semantic processing.

4. **Budget is a hard constraint, not a soft guideline.** L1 = 150 lines. L2 =
   200 lines. These are ceilings, not targets. When budget is full, old entries
   compete with new entries — this is feature, not bug. It forces curation.

5. **Decay is the default; permanence is the exception.** Everything in L2 and
   L3 has a decay timer. Only L1 (GOVERN) and L4 (Archive) are permanent. This
   prevents the unbounded growth problem that plagued the OpenHands event stream
   and SoNash's canonical-memory divergence.

6. **Sleep-time consolidation, not hot-path consolidation.** No LLM calls during
   session hooks. Consolidation happens at session end (Stop hook) and between
   sessions (AutoDream cycle). This matches LightMem's three-stage architecture
   and keeps hook latency predictable.

7. **Sync is a L2 property, not a system property.** Only L2 (and L1, L4) syncs
   across locales via git. L3 (episodic store) is intentionally locale-local.
   This avoids the SQLite-on-network-path corruption risk and the complexity of
   distributed consistency. The high-value knowledge is in L2; L3 is a
   session-scoped index.

8. **Progressive disclosure is the retrieval contract.** Context is never fully
   dumped. The three-layer index → timeline → detail pattern (claude-mem)
   applies to all on-demand retrieval. Token efficiency is built into the
   retrieval protocol.

9. **Human controls L1; automation controls L3; L2 is negotiated.** Directives
   never enter L1 autonomously. Episodes are fully automated in L3. L2 (standing
   facts and patterns) is where the collaboration happens: automation proposes,
   human confirms. This matches the Augment "Memory Review" model (D4b) and the
   CLAUDE.md behavioral guardrail: "Never implement without explicit approval."

---

## Gaps (What This Design Does Not Resolve)

1. **Consolidation LLM cost at scale.** The Stop hook consolidation pipeline
   groups episodes by topic using keyword clustering (no LLM needed), but the
   "is this a new Pattern?" decision benefits from LLM assistance. At low
   session frequency (1-2 sessions/week), the cost is negligible (Haiku,
   ~$0.001/session). At high frequency, it could accumulate. This is not a
   current concern but should be monitored.

2. **L3 re-bootstrapping at new locale.** When switching to a locale that hasn't
   had a session in weeks, L3 is empty. The system falls back to L2
   (git-synced), which is correct. But the episodic context for "what happened
   in the last 5 sessions at the other locale" is unavailable. This is an
   explicit architectural tradeoff (L3 is locale-local) and is acceptable for
   this use case.

3. **The existing 14 mechanisms need migration, not just clean-slate design.**
   This document describes the ideal. The hybrid approach (D8a) must address how
   the existing canonical-memory divergence, stale STATE_SCHEMA.md, and
   underused mcp\_\_memory are reconciled. That is explicitly out of scope here.

4. **AutoDream gate status.** AutoDream (feature flag `tengu_onyx_plover`) is
   live for this user (confirmed in MEMORY.md). Its exact behavior on this
   account has not been tested. The clean-slate consolidation pipeline should
   complement, not conflict with, AutoDream's 4-phase cycle. Testing interaction
   behavior is a pre-implementation requirement.

5. **sqlite-vec installation on Windows without admin.** The sqlite-vec
   extension requires loading a native library into SQLite. On Windows, this is
   done via the `.load` command in SQLite or via a binding in Node.js/Python.
   The episodic-memory plugin (Superpowers) handles this via its own bundled
   binary. A standalone sqlite-vec deployment would need to be tested on both
   locales.

---

## Serendipity

1. **The existing system is 70-80% of the way to the clean-slate ideal.** The
   three roles (GOVERN/KNOW/RECALL) are already present as CLAUDE.md / MEMORY.md
   / JSONL state files. The four layers are already implied. The gap is: no
   admission gate, no decay, no consolidation beyond the PR learning system, and
   canonical-memory divergence. The delta between "current" and "ideal" is
   smaller than expected.

2. **autoMemoryDirectory + git repo is not used anywhere as a documented
   pattern.** The research found no reference implementations of
   `autoMemoryDirectory` pointing at a git-tracked directory (as opposed to
   OneDrive or a standalone folder). This is the cleanest solution discovered
   and it appears to be novel. The closest precedent is the existing
   `.claude/canonical-memory/` which was manually maintained but not set as
   `autoMemoryDirectory`.

3. **The consolidation trigger is already instrumented.** The existing
   `consolidation.json` + `run-consolidation.js` pattern is precisely the right
   infrastructure for the clean-slate consolidation pipeline. The implementation
   gap is not "build a new system" but "generalize the existing pattern from PR
   reviews to all memory types."

4. **Content-type-prior as the admission filter maps directly to the existing
   MEMORY.md taxonomy.** The existing memory files already use category prefixes
   (`user_*`, `feedback_*`, `project_*`, `reference_*`). These ARE the
   content-type- prior categories. The admission filter is already implicitly
   implemented; it just needs to be made explicit and enforced programmatically.

5. **The "north star" is closer than expected.** The clean-slate architecture
   requires fewer new components than anticipated. The primary gaps are: (a)
   autoMemoryDirectory configuration (1 setting per locale), (b) decay logic in
   the consolidation pipeline (add to existing consolidation script), (c) the
   admission gate (add to the Stop hook), and (d) sqlite-vec retrieval for L3
   (the episodic-memory plugin already provides this). The hybrid approach (D8a)
   should find this gap addressable incrementally, not requiring a rewrite.

---

## Sources

All findings in this document are synthesized from the 16 prior findings files.
No new primary research was conducted. Source trust inherits from the underlying
files.

| #   | Path                            | Contributes to                                                                             | Trust |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------ | ----- |
| 1   | D1-codebase-memory-inventory.md | Existing 14 mechanisms, hook architecture, token counts                                    | HIGH  |
| 2   | D2a-claude-mem-cipher.md        | Progressive disclosure, fire-and-forget queue, dual session IDs                            | HIGH  |
| 3   | D2c-supermemory-openmemory.md   | Admission gate scoring, composite retrieval, differential decay                            | HIGH  |
| 4   | D3b-2b-dev-blogs.md             | Budget allocation, confidence decay by type, Yuval two-tier                                | HIGH  |
| 5   | D4a-academic-memory-patterns.md | A-MAC 5-factor admission, Generative Agents retrieval, LightMem consolidation, Context Rot | HIGH  |
| 6   | D4b-industry-implementations.md | GitHub Copilot TTL, Augment human-in-the-loop, Devin trigger-based retrieval               | HIGH  |
| 7   | D5a-mcp-memory-servers.md       | sqlite-vec Windows compatibility, existing mcp\_\_memory architecture                      | HIGH  |
| 8   | D5b-mcp-integration-patterns.md | MCP passive vs hooks active, token budget analysis, Auto Memory coexistence                | HIGH  |
| 9   | D6a-comparison-matrix.md        | System-by-system dimensions, Windows compatibility, token overhead categories              | HIGH  |
| 10  | D6b-architecture-patterns.md    | Pattern taxonomy (CP-1 through SP-4), AutoDream 4-phase cycle                              | HIGH  |
| 11  | D7a-cross-locale-sync.md        | autoMemoryDirectory mechanism, SQLite on cloud sync risk, git-tracked canonical-memory     | HIGH  |
| 12  | D7b-sync-implementations.md     | memoir path remapping, autoMemoryDirectory v2.1.74 details                                 | HIGH  |

---

## Contradictions

**AutoDream behavior and custom consolidation:** AutoDream (live on this
account) runs a 4-phase consolidation cycle autonomously. The clean-slate
consolidation pipeline proposes a similar cycle. These could conflict: both may
attempt to consolidate the same L2 entries at the same time. Until AutoDream's
exact behavior on this account is tested, the relationship is unclear. The
safest approach: treat AutoDream as the L2 consolidation mechanism and build the
clean-slate Stop hook consolidation only for L3 Episode grouping, delegating L2
promotion to AutoDream.

**sqlite-vec vs. episodic-memory plugin overlap:** The clean-slate L3 store
(sqlite-vec + local embeddings) is architecturally identical to the
episodic-memory plugin already configured. There is a risk of building redundant
infrastructure. The recommended resolution: adopt the episodic-memory plugin as
the L3 implementation, rather than building from scratch.

**150-line CLAUDE.md cap vs. current 258 lines:** The clean-slate design
enforces a hard 150-line cap on L1. The current CLAUDE.md is 258 lines — 70%
above budget. This is not a new finding (the document states its own "~135 lines
target") but the cap has never been enforced. The clean-slate system requires
trimming CLAUDE.md, which means deciding what moves to L2. This is a design
decision, not a technical one.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All architecture decisions are directly derived from findings in prior research
files, each backed by official documentation, academic papers, or production
implementations. No speculative claims made. Gaps are explicitly documented as
design choices, not omissions.
