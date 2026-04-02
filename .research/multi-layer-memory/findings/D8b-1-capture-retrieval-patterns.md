# Findings: Extractable Pattern Adoption Guides for SoNash

**Searcher:** deep-research-synthesizer **Profile:** synthesis **Date:**
2026-03-31 **Sub-Question IDs:** SQ8-patterns

---

## Purpose

Six extractable patterns from the research corpus, synthesized as adoption
guides for SoNash. Each guide covers: what the pattern is, where it came from,
how it maps to SoNash's constraints (solo operator, Node.js, hooks-based,
Windows, no admin, two locales), an implementation sketch, effort estimate,
dependencies, and whether it requires new infrastructure.

SoNash constraints reminder:

- Solo non-developer; AI does all implementation
- Windows 11, two locales (jbell/Owner), no admin at work
- Hooks-based architecture (25 scripts, 14 persistence targets)
- No Docker in production; npx/uvx portable installs only
- Node.js ecosystem; bash scripts via Git Bash

---

## Pattern 1: Progressive Disclosure (from claude-mem)

### What It Is

A three-tier retrieval architecture where memory is delivered in layers based on
need, not dumped wholesale into context. Instead of injecting all memory on
every session start, the system:

- **Layer 1 (Index, ~50-100 tokens):** Metadata only — titles, dates, types,
  token counts. The agent reads this to orient itself.
- **Layer 2 (Timeline, ~200-500 tokens):** Chronological context around selected
  entries — surrounding events, temporal relationships.
- **Layer 3 (Full Detail, ~500-1000 tokens/entry):** Complete narrative and
  facts for specifically requested entries.

Claude decides how deep to go based on the task. A simple bug fix might need
only Layer 1. A refactor of a previously-worked system needs Layer 3 for
relevant entries.

claude-mem claims ~10x token savings vs. naive full-context injection (800
tokens for a Layer 1 index vs. 25,000 tokens for raw full context). [Source:
D2a]

### Where It Comes From

claude-mem (thedotmack/claude-mem), v10.6.3, ~38,400 stars. The ContextBuilder
component assembles the three-layer response. Layer 1 comes from SQL metadata
queries; Layers 2-3 are fetched on demand via separate API calls to the worker
service. [Source: D2a — HIGH confidence]

### How It Maps to SoNash

SoNash already has a two-tier system:

- MEMORY.md (91-line index) — acts as Layer 1 today
- 39 individual topic files (e.g., `feedback_convergence_loops.md`) — act as
  Layer 3

The missing piece is a structured index that includes token counts and type
tags, plus a convention that Claude should read the index first and only request
topic files when directly relevant to the task. Currently, Claude reads
MEMORY.md at session start and may or may not read topic files proactively.

The pattern is partially implemented. What's missing is the explicit discipline
and the Layer 2 (timeline) concept for session continuity.

### Implementation Sketch

**Step 1: Enhance MEMORY.md as a structured Layer 1 index**

Add token count estimates and type tags to each entry in MEMORY.md:

```markdown
## Memory Index

| File                                    | Type     | ~Tokens | Last Updated | Summary                                          |
| --------------------------------------- | -------- | ------- | ------------ | ------------------------------------------------ |
| feedback_convergence_loops_mandatory.md | feedback | 180     | 2026-03      | Every significant pass must loop until converged |
| project_debt_runner_expansion.md        | project  | 240     | 2026-03-29   | Hybrid CLI+web, 23-agent research complete       |
| user_expertise_profile.md               | user     | 120     | 2026-03      | Non-developer director, 250+ sessions            |
```

This turns MEMORY.md into a token-aware index. Claude can estimate the cost of
loading a topic file before requesting it.

**Step 2: Add a Layer 2 timeline section to SESSION_CONTEXT.md**

The "Quick Recovery" section in SESSION_CONTEXT.md already functions as Layer 2
for session continuity. Formalize it: the last 3-5 sessions' work summaries, in
chronological order. This gives temporal context without full detail.

**Step 3: Add explicit instruction to CLAUDE.md / session-begin skill**

Add to the session-begin SKILL.md Phase 1:

```
Read MEMORY.md index first. Only load topic files directly relevant to the
current task. Loading all 39 files consumes ~8,000 tokens unnecessarily.
```

This enforces the Layer 1 → Layer 3 discipline without new infrastructure.

**No Layer 2 retrieval API needed** — SESSION_CONTEXT.md Quick Recovery already
covers the timeline function. Use it explicitly rather than building a new
mechanism.

### Effort Estimate

Low. 2-3 hours total:

- 1 hour: Restructure MEMORY.md as a token-aware table
- 30 min: Add discipline note to session-begin skill
- 30 min: Standardize SESSION_CONTEXT.md Quick Recovery format as explicit Layer
  2
- No new infrastructure, no new scripts

### Dependencies

- None. Uses existing files and existing session-begin skill.
- The index format requires one-time restructuring of MEMORY.md.

### Infrastructure Assessment

No new infrastructure required. This is a convention and format change to
existing files, plus a discipline note in one skill.

---

## Pattern 2: Reasoning Trace Capture (from cipher)

### What It Is

Storing HOW Claude reasoned about a problem, not just what it did. cipher calls
this "System 2 memory" (Reflection Memory) — inspired by dual-process cognitive
theory. A standard memory entry records outcomes ("Fixed the auth bug by
changing line 47"). A reasoning trace records the reasoning path ("Tried
approach A with session cookies; it failed because CORS headers conflicted.
Tried approach B with httpOnly cookies; confirmed working. Key insight: Firebase
Auth tokens must not be intercepted by the service worker.").

cipher only stores reflections that score >= 0.4 on an internal quality
threshold. The reasoning trace is searchable separately from factual memory,
enabling queries like "what patterns did I use when solving auth problems?"
[Source: D2a — HIGH]

### Where It Comes From

cipher (campfirein/cipher) by Byterover, ~3,600 stars. System 2 captures via
`cipher_store_reasoning_memory` tool; searchable via
`cipher_search_reasoning_patterns`. Stored in a separate vector collection
namespace (ID range 666,667–999,999) from factual memory (1–333,333). [Source:
D2a — HIGH]

The academic basis is Reflexion (NeurIPS 2023, Shinn et al.): verbal
reinforcement learning where agents write structured failure analyses to disk.
HumanEval +11% over GPT-4 baseline by re-reading past reasoning traces. [Source:
D4a — HIGH]

### How It Maps to SoNash

SoNash already has partial reasoning trace capture:

- `docs/AI_REVIEW_LEARNINGS_LOG.md` — records review outcomes and patterns
- `feedback_*.md` files — record corrections (what went wrong, behavioral
  change)
- `SESSION_DECISIONS.md` — records architectural decisions

What's missing is the reasoning trace for how-we-got-here. When Claude solves a
hard problem mid-session, the approach tried and rejected does not get persisted
— only the final outcome does. When a pre-commit hook fails and Claude fixes it,
the diagnosis reasoning is lost.

Hooks already fire at the right moments (PostToolUse, session end). The gap is
that no hook writes the reasoning context.

### Implementation Sketch

**Approach: Post-hook reasoning capture via Stop hook**

Rather than building cipher's full System 2 infrastructure, implement a
lightweight convention using the existing Stop hook pattern.

**Step 1: Add a reasoning trace section to session-end skill**

In the session-end SKILL.md, add a Phase 2.5 (between context update and TDMS):

```
Phase 2.5: Reasoning Trace (when applicable)
If this session involved: a failed approach before a working one, a hook failure
diagnosis, an architecture decision reversal, or a corrected behavior — write a
reasoning trace entry.

Format: .claude/state/reasoning-traces.jsonl (append)
Schema: { date, sessionId, problem, approaches_tried, resolution, key_insight }
```

**Step 2: Create reasoning-traces.jsonl as a git-tracked state file**

Add `.claude/state/reasoning-traces.jsonl` to the git-tracked state files. Add
it to the session-end commit.

**Step 3: Add a hook trigger for reasoning capture**

In the Stop hook (or via a new session-end trigger):

```javascript
// session-end-reasoning.js (new, ~40 lines)
// Reads session context, checks for problem-solving markers
// Writes to reasoning-traces.jsonl if session had diagnostic/reversal events
// Uses same pattern as session-end.js but targets reasoning-traces.jsonl

const signaledTools = ["Bash", "Edit", "Write"];
const reasoningTriggers = [
  "error",
  "failed",
  "wrong approach",
  "reverted",
  "instead",
  "alternative",
];
// If 2+ signaled tool uses + reasoning trigger keywords in session transcript
// → prompt Claude to write a reasoning trace before session closes
```

**Step 4: Surface in MEMORY.md index**

Add a pointer in MEMORY.md to the reasoning-traces.jsonl:

```markdown
| reasoning-traces.jsonl (via state/) | reasoning | varies | live | Past
diagnostic paths and approach reversals |
```

**Quality gate (from cipher):** Only write reasoning traces when the session
contained a genuine problem-solving path (not just routine execution). The hook
trigger above uses keyword detection as the quality signal. This approximates
cipher's 0.4 quality threshold without requiring a scoring model.

### Effort Estimate

Medium. 4-6 hours:

- 1 hour: Create reasoning-traces.jsonl schema and add to git tracking
- 2 hours: Write session-end-reasoning.js trigger hook (~40 lines Node.js)
- 1 hour: Add Phase 2.5 to session-end SKILL.md
- 1 hour: Testing and tuning keyword triggers
- 30 min: MEMORY.md pointer and session-begin awareness

### Dependencies

- Existing Stop hook infrastructure (already in place)
- No new packages; pure Node.js
- session-end.js pattern as a template (existing)

### Infrastructure Assessment

No new infrastructure. One new ~40-line Node.js hook script. One new JSONL state
file. One skill modification. All within existing hook architecture.

---

## Pattern 3: Citation-Backed Validation (from GitHub Copilot)

### What It Is

Each memory entry stores citations — links to the specific code lines or files
that justified the memory when it was written. Before a memory entry is injected
into context, the citations are validated against the current codebase. If a
cited file or line no longer exists (or has changed substantially), the memory
entry is flagged as stale or discarded.

GitHub Copilot Memory uses this to prevent "memory rot": a memory that says "the
auth module uses JWT stored in localStorage" becomes invalid when the codebase
migrates to httpOnly cookies. Without citation validation, this stale memory
actively misleads Claude. With it, the system detects the change and either
prompts for re-validation or suppresses the entry. Copilot pairs this with a
28-day TTL that resets on reuse. [Source: D4b — HIGH]

### Where It Comes From

GitHub Copilot Memory (December 2025 early access, Pro/Pro+). Three tiers
(user/repo/session); all auto-captured insights include code location citations
validated before injection. [Source: D4b — HIGH]

### How It Maps to SoNash

SoNash memory entries in `project_*.md` and `reference_*.md` files frequently
reference specific files, hook names, or system behaviors that change over time.
Examples of currently stale-risk entries:

- "propagation enforcement — 3-layer system, PR #482 merged" (references a PR;
  correct)
- "Go statusline — DEPLOYED Session #240, 22 widgets" (references a file count)
- References to specific hook script names that may be renamed

When MEMORY.md entries reference implementation details, they become stale the
moment the implementation changes. There is currently no mechanism to detect
this.

The implementation does not need to be as sophisticated as Copilot's — it needs
to be a lightweight staleness check that runs at consolidation time.

### Implementation Sketch

**Approach: File-existence staleness check during dream-skill consolidation**

Not a real-time validation but a periodic staleness sweep integrated into the
memory consolidation pipeline (the dream-skill / Phase 4 from D8a).

**Step 1: Add citation frontmatter convention to project*\*.md and
reference*\*.md**

```markdown
---
citations:
  - path: tools/statusline/sonash-statusline-v2.exe
  - path: .claude/hooks/session-end.js
  - hook: post-read-handler.js
last_validated: 2026-03-31
---
```

This is a YAML frontmatter block added when a memory entry references specific
files. Only project and reference type files need this — user and feedback files
rarely reference specific code locations.

**Step 2: Write validate-memory-citations.js (~60 lines)**

```javascript
// validate-memory-citations.js
// Reads all memory files with citations: frontmatter
// Checks each cited path exists via fs.existsSync()
// Outputs: stale-citations.json { file, citations, missing }
// Run: node validate-memory-citations.js

const memoryDir = process.env.MEMORY_DIR || ".claude/canonical-memory";
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml"); // already in package.json or use built-in parser

// For each .md file in memoryDir:
//   Parse YAML frontmatter
//   For each citation.path: check fs.existsSync(path.join(repoRoot, citation.path))
//   Write failures to stale-citations.json
```

**Step 3: Integrate into dream-skill / consolidation pipeline**

Before consolidation rewrites MEMORY.md, run citation validation:

1. Run validate-memory-citations.js
2. Read stale-citations.json
3. For each stale entry: add `<!-- STALE: cited path not found: X -->` comment
4. During consolidation, stale-marked entries are reviewed and either removed,
   updated, or re-cited

**Step 4: Surface stale citations in session-begin**

Add to session-begin Phase 1 pre-flight:

```
If stale-citations.json exists and has entries: warn user
Format: "N memory entries have stale citations (run /consolidate-memory to review)"
```

This is the acknowledgment-required surfacing pattern from CLAUDE.md rule #6.

### Effort Estimate

Low-Medium. 3-4 hours:

- 30 min: Add citation frontmatter to 5-10 most risky memory files
  (project/reference)
- 1.5 hours: Write validate-memory-citations.js (~60 lines)
- 1 hour: Integration into consolidation pipeline and session-begin pre-flight
- 30 min: Testing against known-good and known-stale entries

### Dependencies

- `js-yaml` or native YAML parsing (js-yaml already available in Node.js
  projects)
- `fs` module (built-in Node.js)
- Dream-skill / consolidation pipeline (from D8a Phase 4) — can be built
  independently but most valuable when integrated with consolidation

### Infrastructure Assessment

No new infrastructure. One new ~60-line Node.js script. YAML frontmatter
convention in memory files. Optional integration with the consolidation
pipeline. Independently deployable (the script can be run manually without the
full consolidation pipeline).

---

## Pattern 4: Composite Retrieval Scoring (from OpenMemory / supermemory)

### What It Is

A four-factor weighted score for ranking which memories to retrieve, rather than
returning results sorted by semantic similarity alone. OpenMemory's formula:

```
score = (0.60 * semantic_similarity)
      + (0.20 * salience)
      + (0.10 * recency)
      + (0.10 * waypoint_weight)
```

Where:

- **Semantic similarity:** Cosine distance between query embedding and memory
  embedding (standard vector search)
- **Salience:** Importance score assigned at write time or boosted by re-access
  (Hebbian: memories used often become more available)
- **Recency:** Exponential decay from last access — recent memories rank higher
- **Waypoint weight:** Graph edge strength to related memories (associative
  recall)

The academic basis is Generative Agents (Stanford, UIST 2023): recency +
importance

- relevance as a weighted retrieval model. [Source: D4a — HIGH]

The practical result: a memory entry that is semantically distant but was
written recently about a currently-active initiative outranks an old,
deeply-relevant entry from a completed initiative. This prevents
completed-project memories from dominating retrieval. [Sources: D2c, D4a — HIGH]

### Where It Comes From

OpenMemory (CaviraOSS/OpenMemory) — exact formula documented in ARCHITECTURE.md.
The weights (60/20/10/10) are configurable. OpenMemory implements this at the
vector retrieval layer before returning results to the MCP client. [Source: D2c
— HIGH]

The supermemory platform independently uses a similar composite — relational
versioning (Updates/Extends/Derives relationships) combined with temporal
grounding and semantic search. [Source: D2c — HIGH]

### How It Maps to SoNash

The `mcp__memory` knowledge graph server (`@modelcontextprotocol/server-memory`)
uses keyword string matching for `search_nodes`. There is no semantic
similarity, no salience, no recency weighting. Results are unranked.

For the auto-memory (MEMORY.md topic files), retrieval is manual — Claude reads
the MEMORY.md index and decides what to load. No scoring.

Full composite scoring requires a vector database, which is not in SoNash's
current stack. However, the individual components can be approximated without
vectors:

- **Recency:** File modification timestamp (`mtime`) on topic files
- **Salience:** Explicit annotation in MEMORY.md index (manually set or
  hook-updated)
- **Waypoint weight:** Cross-references in frontmatter `related:` fields

The semantic similarity component requires embeddings. Without embeddings, use
keyword matching against topic names and file content as a proxy.

### Implementation Sketch

**Approach: Lightweight scoring without a vector database**

This is a degraded but practical approximation of the full pattern. It improves
on the current zero-scoring approach.

**Step 1: Add a salience field to MEMORY.md index**

Extend the Layer 1 index (from Pattern 1):

```markdown
| File                                    | Type     | ~Tokens | Last Updated | Salience | Summary                          |
| --------------------------------------- | -------- | ------- | ------------ | -------- | -------------------------------- |
| feedback_convergence_loops_mandatory.md | feedback | 180     | 2026-03      | HIGH     | Every pass loops until converged |
| project_statusline_research.md          | project  | 120     | 2026-03      | LOW      | COMPLETE - historical reference  |
```

Salience values: HIGH (actively referenced multiple times), MEDIUM (standard),
LOW (completed/historical). Updated manually during consolidation.

**Step 2: Use mtime as recency signal in session-begin**

In session-begin Phase 1, when listing topic files, sort by mtime descending and
note recently-modified files:

```
Recently modified memory files (last 7 days):
  project_debt_runner_expansion.md (2026-03-29)
  project_active_initiatives.md (2026-03-31)
```

Claude can use this to prioritize recent files when the task is ambiguous.

**Step 3: Add related: frontmatter to topic files**

```markdown
---
related:
  - project_active_initiatives.md
  - feedback_convergence_loops_mandatory.md
---
```

When Claude reads one file, it can follow related: links for associative
expansion. This approximates the waypoint graph traversal.

**Step 4 (Optional, higher effort): Integrate composite scoring via MCP memory
tool**

If OpenMemory's instability clears (it is in active rewrite as of March 2026),
replace the `@modelcontextprotocol/server-memory` JSONL backend with OpenMemory
as the MCP memory server. OpenMemory provides the full 60/20/10/10 scoring
natively via its MCP tools. This step should wait until OpenMemory reaches
stability.

**Immediate value (Steps 1-3 only):** Recency and salience signals in the index
improve Claude's loading decisions without any new infrastructure. Steps 1-3 are
purely format/convention changes.

### Effort Estimate

Steps 1-3 (immediate, no infrastructure):

- 1 hour: Add salience column to MEMORY.md index for all 39 files
- 30 min: Add mtime-based recency note to session-begin skill
- 1 hour: Add related: frontmatter to 10 most-referenced topic files
- Total: 2.5 hours

Step 4 (optional, future):

- Depends on OpenMemory stability timeline
- When stable: 2-3 hours to configure and test as MCP replacement

### Dependencies

- Steps 1-3: None. Pure convention changes to existing files.
- Step 4: OpenMemory stability (Apache 2.0, self-hosted; in active rewrite as of
  March 2026 — not recommended for immediate adoption)

### Infrastructure Assessment

Steps 1-3: No new infrastructure. Step 4: One new MCP server (OpenMemory,
SQLite-backed, no Docker required in local mode). Deferred until stability
confirmed.

---

## Pattern 5: Content-Type-Prior Filtering (from A-MAC)

### What It Is

A whitelist-based admission gate that decides whether a candidate memory entry
is worth writing before writing it. The A-MAC paper (March 2026) found that
"content type prior" — the category of information — was the single most
predictive factor in whether a memory entry would be useful later. More
predictive than semantic novelty, recency, or factual confidence.

The practical implication: define a whitelist of information categories worth
memorizing, and discard everything else before it reaches the memory store. This
prevents low-signal noise from accumulating and reduces memory rot.

A-MAC's five admission factors (in order of discriminative power):

1. Content type prior (strongest — is this category worth storing?)
2. Future utility (will this be needed again?)
3. Factual confidence (is this correct?)
4. Semantic novelty (is this already captured?)
5. Temporal recency (how fresh is this?)

[Source: D4a — HIGH]

### Where It Comes From

A-MAC: "Adaptive Memory Admission Control for LLM Agents" (Zhang et al., March
2026, arxiv:2603.04549). Improves F1 to 0.583 while reducing latency by 31% vs.
state-of-the-art. [Source: D4a — HIGH]

Also validated by Cursor's memory removal experience: Cursor shipped then
removed auto-memory in 2025 because undiscriminating capture created more
problems than it solved. Users migrated to Rules-based approaches
(`.cursorrules`) instead — which is architecturally equivalent to explicitly
curated categories. [Source: D4b — HIGH]

### How It Maps to SoNash

SoNash memory writes are currently undiscriminating with respect to category.
Claude writes to MEMORY.md (via auto-memory) based on judgment about what's
memorable — but there is no explicit whitelist of approved categories, and no
pre-write gate.

The feedback\_\*.md files are actually a natural implementation of this pattern:
only behavioral corrections get feedback files. This is an implicit content-type
prior. The gap is that it is not formal and does not cover all memory types.

SoNash already has implicit categories (feedback, project, user, reference). The
pattern asks: make this explicit and enforce it at write time.

### Implementation Sketch

**Approach: Explicit category whitelist in CLAUDE.md + pre-write check
convention**

**Step 1: Define the approved content-type whitelist in CLAUDE.md**

Add a new subsection to CLAUDE.md Section 3 (Architecture) or create a memory
policy document:

```markdown
## Memory Admission Policy

Write to auto-memory ONLY for these content types:

| Category               | File prefix | When to write                   | Examples                         |
| ---------------------- | ----------- | ------------------------------- | -------------------------------- |
| Behavioral correction  | feedback\_  | User corrects Claude's approach | "never X", "always Y"            |
| Architectural decision | project\_   | Irreversible structural choice  | Framework selection, data model  |
| Project status change  | project\_   | Initiative completes or pivots  | "propagation COMPLETE"           |
| Standing constraint    | reference\_ | Permanent project fact          | Rate limits, external URLs       |
| User preference        | user\_      | Stable user workflow preference | Push protocol, question batching |

DO NOT write to memory for:

- Session-specific task details (use SESSION_CONTEXT.md instead)
- Intermediate debugging steps (use reasoning-traces.jsonl instead)
- Anything tagged <!-- TTL: ephemeral --> (use session context only)
- Duplicate of existing entry (check MEMORY.md index first)
```

**Step 2: Add pre-write gate to memory write workflow**

This is a behavioral guardrail, not a technical gate. Add to the session-begin
skill or CLAUDE.md as an explicit check:

```
Before writing to auto-memory:
1. Check: does this belong to an approved content type? (see Memory Admission Policy)
2. Check: is it already captured in MEMORY.md index?
3. If YES to both: update existing entry; do not create duplicate
4. If category not in whitelist: write to SESSION_CONTEXT.md or reasoning-traces.jsonl instead
```

**Step 3: Add category validation to dream-skill consolidation**

During consolidation, flag entries that don't match the whitelist for review:

```
Phase 1 (Orient): scan for entries with uncategorized or mismatched file prefixes
Phase 2 (Gather): flag miscategorized entries as consolidation candidates
```

**Step 4 (Optional): Implement a hook-level pre-write gate**

If Claude's auto-memory writes are happening via tool calls that can be
intercepted, add a UserPromptSubmit or PostToolUse hook that checks the proposed
memory content type before allowing the write. This is technically complex
(requires intercepting the memory write MCP tool call) and is optional — the
behavioral guardrail in Step 2 is sufficient for a solo operator workflow where
Claude is following CLAUDE.md directives.

### Effort Estimate

Very Low (Steps 1-3). 1-2 hours:

- 45 min: Write the Memory Admission Policy section and add to CLAUDE.md
- 30 min: Add pre-write gate as behavioral check to session-begin skill
- 30 min: Add category validation to dream-skill consolidation (when built)

Step 4 (optional hook gate): Medium effort, 3-4 hours. Not recommended
immediately because the behavioral guardrail is adequate for a solo workflow
with Claude following CLAUDE.md rules.

### Dependencies

- None for Steps 1-3. Pure policy/convention.
- Step 4 depends on understanding which hook fires when memory writes occur.

### Infrastructure Assessment

No new infrastructure required. This is a policy document (in CLAUDE.md) and a
behavioral convention. The most important implementation is adding the whitelist
definition — everything else flows from having a clear category boundary.

---

## Pattern 6: Anti-Rot Validation

### What It Is

Checking memories against the current codebase state before injecting them, to
ensure they describe reality rather than a stale past state. Memory rot is the
gradual divergence between what memory says ("the auth module uses JWT in
localStorage") and what the codebase actually does.

This is a synthesis pattern, not from a single source. It combines:

- GitHub Copilot's citation validation approach (Pattern 3 above) — checking
  file citations exist
- The A-MAC "factual confidence" admission factor — is this still true?
- LightMem's stale memory detection — offline identification of outdated entries
- Context rot research: "distractors compound degradation non-linearly" — a
  single stale memory entry actively degrades output quality, not just wastes
  tokens

[Sources: D4a, D4b — HIGH]

### Where It Comes From

Composite pattern from:

1. GitHub Copilot Memory citation validation (D4b — HIGH): structural validation
2. A-MAC factual confidence factor (D4a — HIGH): accuracy admission gating
3. Chroma context rot research (D4a — HIGH): empirical evidence that stale
   context hurts, not just wastes
4. SoNash inventory finding (D1): "project_sonarcloud_disabled.md —
   investigating drop in PR review findings. Workflow disable was red herring" —
   an example of a stale memory entry that would have been caught by anti-rot
   validation

### How It Maps to SoNash

SoNash's memory contains several categories of entries that can become stale:

**High rot risk entries:**

- `project_*` files referencing specific initiative status ("in-progress" →
  "COMPLETE")
- `reference_*` files with URLs, file paths, or version numbers
- `project_active_initiatives.md` — this is the highest-rot-risk file; gets
  stale within days

**Low rot risk entries:**

- `feedback_*` files — behavioral patterns rarely go stale; they describe how
  Claude should behave, not what the codebase contains
- `user_*` files — user preferences are stable

The most practical anti-rot mechanism for SoNash is:

1. File-existence validation (Pattern 3, already sketched above)
2. Status marker validation — checking that "in-progress" entries in project
   files match current git/ROADMAP state
3. Active initiative freshness check — project_active_initiatives.md should be
   validated against recent commits (is this still active?)

### Implementation Sketch

**Component A: File-existence validation (already covered in Pattern 3)**

Run validate-memory-citations.js during consolidation. Stale file citations
surface as candidates for update or removal.

**Component B: Status freshness check**

During dream-skill consolidation (or as a standalone script), scan for status
markers in project\_\*.md files:

```javascript
// check-memory-freshness.js (~50 lines)
// Scans .claude/canonical-memory/project_*.md for status markers
// Compares against recent commit log and ROADMAP.md

const staleMarkers = [
  /in.?progress/i, // "in progress", "in-progress"
  /planned/i,
  /investigating/i,
  /\bNext\b.*\bsession\b/i, // "Next session: do X" — should never survive >3 sessions
];

// For each project_*.md:
//   Read content
//   Find stale markers
//   Check if the initiative appears in recent commits (last 14 days from commit-log.jsonl)
//   If marker found BUT no recent commits mention it: flag as potentially stale
// Output: freshness-report.json
```

**Component C: Active initiatives validation**

`project_active_initiatives.md` is the highest-rot-risk file. Add a specific
check:

In session-begin Phase 1 pre-flight:

```
Check: project_active_initiatives.md last modified date
If > 14 days old: surface warning "Active initiatives file may be stale (last updated N days ago)"
```

This is the simplest possible anti-rot check — just a file age warning on the
highest-risk file.

**Component D: Anti-rot consolidation sweep (integration target)**

Integrate Components A+B into the dream-skill consolidation as a pre-phase:

```
Phase 0 (Pre-flight): Run anti-rot validation
  - validate-memory-citations.js → stale-citations.json
  - check-memory-freshness.js → freshness-report.json

Phase 1 (Orient): Read MEMORY.md + stale/freshness reports together
  (Validation output informs what consolidation should fix)
```

**Component E: Behavioral guardrail for memory updates**

Add to CLAUDE.md behavioral rules:

```
When completing an initiative (PR merged, feature shipped):
IMMEDIATELY update the relevant project_*.md memory file to mark COMPLETE.
Do not defer memory maintenance to session-end. Stale status is worse than
no memory because it actively misleads future sessions.
```

This addresses the behavioral root cause: Claude often forgets to update memory
files when initiatives complete.

### Effort Estimate

- Component C (session-begin file age check): 30 minutes. No new scripts.
- Component E (CLAUDE.md behavioral rule): 15 minutes. One rule addition.
- Component A (Pattern 3 already): already scoped at 3-4 hours
- Component B (check-memory-freshness.js): 2 hours. New ~50-line Node.js script.
- Full integration (Component D): 1 hour. Integration into consolidation
  pipeline.

**Total (all components):** 6-8 hours, mostly shared with Pattern 3
implementation. **Minimum viable (C + E only):** 45 minutes. File age warning +
behavioral rule.

### Dependencies

- Component A: Requires Pattern 3 (validate-memory-citations.js)
- Component B: Requires Node.js fs module (built-in) + commit-log.jsonl (already
  exists)
- Component C: Requires session-begin skill modification
- Component D: Requires dream-skill / consolidation pipeline (D8a Phase 4)
- Component E: No dependencies

### Infrastructure Assessment

No new infrastructure. Two new ~50-60 line Node.js scripts
(validate-memory-citations.js from Pattern 3, check-memory-freshness.js). One
skill modification. One CLAUDE.md rule addition. All within existing hook/script
architecture.

---

## Implementation Priority Matrix

Ordered by value/effort for a solo non-developer workflow:

| Pattern                                    | Effort | Value       | Infrastructure Needed   | Recommended Phase            |
| ------------------------------------------ | ------ | ----------- | ----------------------- | ---------------------------- |
| P5: Content-type-prior filtering           | 1-2h   | HIGH        | None                    | Phase 1 (this week)          |
| P6: Anti-rot validation (C+E only)         | 45m    | HIGH        | None                    | Phase 1 (this week)          |
| P1: Progressive disclosure (Steps 1-3)     | 2-3h   | HIGH        | None                    | Phase 1 (this week)          |
| P3: Citation-backed validation             | 3-4h   | MEDIUM-HIGH | None                    | Phase 2 (next sprint)        |
| P6: Anti-rot validation (full)             | 3-4h   | HIGH        | None (2 scripts)        | Phase 2 (next sprint)        |
| P2: Reasoning trace capture                | 4-6h   | MEDIUM      | None (1 script)         | Phase 3                      |
| P4: Composite scoring (Steps 1-3)          | 2.5h   | MEDIUM      | None                    | Phase 2                      |
| P4: Composite scoring (Step 4, OpenMemory) | 2-3h   | HIGH        | 1 MCP server (deferred) | Phase 4 (wait for stability) |

**Recommended first action:** Implement P5 (content-type whitelist in CLAUDE.md)
— it costs 45 minutes and prevents all future memory pollution. It has the
highest return per hour of any pattern here.

---

## Synergies and Dependencies Between Patterns

The six patterns form a natural pipeline:

```
P5 (Content-type gate) → P2 (Reasoning traces)
   ↓ blocks low-signal writes          ↓ captures what passes the gate

P1 (Progressive disclosure) → P4 (Composite scoring)
   ↓ structured index enables              ↓ scoring ranks what the index contains

P3 (Citation validation) → P6 (Anti-rot validation)
   ↓ file existence checks                 ↓ broader staleness including status markers
```

P5 should be implemented before P2 (so the reasoning trace category is defined
in the whitelist before adding the hook). P1 should be implemented before P4 (so
the index format supports salience/recency columns). P3 can be implemented
standalone; P6 builds on it.

---

## Sources

| #   | Source                                                            | Title                                            | Type                         | Trust       | Date       |
| --- | ----------------------------------------------------------------- | ------------------------------------------------ | ---------------------------- | ----------- | ---------- |
| 1   | D2a-claude-mem-cipher.md                                          | claude-mem and cipher deep analysis              | findings                     | HIGH        | 2026-03-31 |
| 2   | D2c-supermemory-openmemory.md                                     | Supermemory and OpenMemory analysis              | findings                     | HIGH        | 2026-03-31 |
| 3   | D4a-academic-memory-patterns.md                                   | Academic memory architecture patterns            | findings                     | HIGH        | 2026-03-31 |
| 4   | D4b-industry-implementations.md                                   | Industry agent memory implementations            | findings                     | HIGH        | 2026-03-31 |
| 5   | D5a-mcp-memory-servers.md                                         | MCP memory servers survey                        | findings                     | HIGH        | 2026-03-31 |
| 6   | D6b-architecture-patterns.md                                      | Architecture pattern taxonomy                    | findings                     | HIGH        | 2026-03-31 |
| 7   | D8a-hybrid-enhanced-design.md                                     | Hybrid enhanced memory design                    | findings                     | HIGH        | 2026-03-31 |
| 8   | https://arxiv.org/abs/2603.04549                                  | A-MAC: Adaptive Memory Admission Control         | arxiv preprint               | MEDIUM-HIGH | Mar 2026   |
| 9   | https://arxiv.org/abs/2304.03442                                  | Generative Agents (Recency+Importance+Relevance) | peer-reviewed (UIST 2023)    | HIGH        | Apr 2023   |
| 10  | https://arxiv.org/abs/2303.11366                                  | Reflexion: Verbal Reinforcement Learning         | peer-reviewed (NeurIPS 2023) | HIGH        | Mar 2023   |
| 11  | https://docs.github.com/en/copilot/concepts/agents/copilot-memory | GitHub Copilot Memory docs                       | official-docs                | HIGH        | Dec 2025   |

---

## Gaps

1. **Composite scoring without embeddings is a significant degradation.** Steps
   1-3 of Pattern 4 are useful but cannot replicate the semantic similarity
   component of the 60/20/10/10 formula. The full pattern requires embeddings
   infrastructure. OpenMemory would provide this but is in active rewrite
   (unstable as of March 2026).

2. **Reasoning trace quality gating.** Pattern 2 uses keyword detection as a
   proxy for cipher's 0.4 quality score. The keyword approach will generate
   false positives (routine error messages) and false negatives (subtle approach
   reversals without explicit keywords). No better proxy was identified without
   an LLM scoring call.

3. **Anti-rot validation for semantic drift.** Patterns 3 and 6 check file
   existence and status markers, but not semantic drift: a memory about a module
   that still exists but has been completely rewritten. Detecting semantic drift
   requires either embedding comparison (infrastructure cost) or LLM review
   (latency cost). Not addressed in this sketch.

4. **dream-skill availability.** Patterns 3, 4, and 6 all reference the
   dream-skill / consolidation pipeline from D8a. That pipeline's availability
   depends on Phase 4 from D8a, which notes the dream-skill community plugin
   could not be confirmed. The integration targets in this document assume a
   custom consolidation script will be built if the community plugin is
   unavailable.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM-HIGH claims: 4
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All patterns are derived from HIGH-confidence findings in the research corpus.
The implementation sketches are original synthesis by this document. Effort
estimates are approximate; actual implementation time depends on Claude Code's
scaffolding speed and testing complexity.
