# Findings: Failure Modes, Risks, and What Can Go Wrong

**Searcher:** deep-research-searcher (SQ10 agent 1 of 2) **Profile:**
web+codebase **Date:** 2026-03-31 **Sub-Question IDs:** SQ10

---

## Overview

This document is a deliberate pessimist's analysis. The goal is to enumerate
every plausible failure mode, assign likelihood and impact scores, and determine
whether each risk argues for or against adding complexity to a memory system
that already has 14 persistence mechanisms.

**Scoring convention:**

- Likelihood: 1 (rare) to 5 (near-certain)
- Impact: 1 (minor nuisance) to 5 (data loss, workflow destruction, or hours to
  debug)
- Risk score: likelihood × impact (max 25)
- Verdict: argues FOR simplicity (complexity = more surface area) or AGAINST
  simplicity (the pain from NOT having it outweighs the risk)

---

## Part 1: Failure Modes Already Observed (Evidence-Based)

These are confirmed failure modes, drawn directly from the 16 findings files.

---

### FM-01: Canonical Memory Diverged from Live Memory [CONFIDENCE: HIGH]

**Evidence:** D1 finding: `.claude/canonical-memory/` (git-tracked) diverged
from `~/.claude/projects/*/memory/` (locale-specific). The canonical copy is
missing ~7 of 18 feedback entries, describes user expertise incorrectly
("Node.js/scripting expert" vs "non-developer director"), and shows stale
project state. It appears to have been manually abandoned rather than retired by
policy.

**Root cause:** Two independent write paths, no automated sync, no divergence
alert. The canonical copy was written at one point in time and never updated
because the update cycle was manual and forgettable.

**Likelihood of recurrence:** 5/5 — the underlying cause (manual maintenance of
a second copy) has not been fixed. This will happen again to any second copy
created.

**Impact:** 3/5 — A new machine or session using the canonical copy gets
materially wrong guidance (wrong expertise model, missing 7 behavioral
corrections). The user is correcting Claude on things Claude "already knows."

**Risk score:** 15/25

**Mitigation:** Set `autoMemoryDirectory` to point at the git-tracked directory
so there is only one write path. Alternatively, delete the canonical-memory
directory and accept that cross-locale sync requires a different solution. The
two-copy approach is inherently fragile.

**Verdict for complexity debate:** Argues AGAINST adding more independent memory
stores. The existing divergence shows the system already has more stores than it
can maintain.

---

### FM-02: MCP Memory Startup Hang (5-6 Minutes) [CONFIDENCE: HIGH]

**Evidence:** D5b finding: GitHub issue #15140 (closed NOT_PLANNED, Feb 2026).
When Claude is instructed to "check memory at session start" and the MCP memory
server returns empty results, Opus 4.5 enters an extended thinking spiral and
hangs for 5-6 minutes at 0 tokens. The model attempts to reason through an empty
result set indefinitely.

**Root cause:** Structural mismatch between LLM reasoning behavior and a
degenerate input state (empty memory). The model was told to do something that
cannot succeed, and it cannot accept failure.

**Closed NOT_PLANNED** means Anthropic will not fix this. Any memory system that
tells Claude to check MCP memory at session start inherits this risk
permanently.

**Likelihood:** 4/5 — Any session that uses Opus on a new project or after
memory is reset will trigger this. High-frequency event.

**Impact:** 4/5 — 5-6 minutes of frozen session start is a severe workflow
disruption. It looks like a hang, there is no progress indicator, and the user
cannot distinguish this from a crash.

**Risk score:** 16/25

**Mitigation:** Never add "check MCP memory at session start" to CLAUDE.md or
any skill. Use hook-based injection instead of instructing Claude to pull from
MCP at startup. This mitigation works but requires everyone who touches
CLAUDE.md to know about the trap permanently.

**Verdict for complexity debate:** Argues AGAINST adding MCP-based retrieval as
a session-start mechanism. If adding a memory MCP, the session-start behavior
must be hooks-only injection.

---

### FM-03: Context Rot from Over-Injection [CONFIDENCE: HIGH]

**Evidence:** D3b-1 finding: The HN context engineering thread (915 pts) named
"context rot" — injecting irrelevant memory context degrades LLM output quality.
D5b finding: Token budget analysis found combined Auto Memory + CLAUDE.md + MCP
tools can consume 10,000-12,000 tokens before a single user message; a
heavily-configured setup hit 66,000+ tokens in overhead alone.

**Root cause:** Memory systems are optimized for recall completeness (inject
everything), not output quality (inject only what is relevant). There is no
feedback loop that penalizes irrelevant injection.

**Likelihood:** 3/5 — Only triggered when memory accumulates enough irrelevant
content AND the user is working on something sufficiently unrelated to past
work. 250+ sessions of accumulated content makes this increasingly likely.

**Impact:** 3/5 — Quality degrades subtly. Claude suggests stale patterns,
misapplies old context, or gives redundant advice. The user may not recognize
the symptom; they just notice Claude seems "off."

**Risk score:** 9/25

**Mitigation:** Hard caps on injection (25KB / 200 lines for Auto Memory,
already enforced). Curation over accumulation. TTL/decay on memory entries.
Progressive disclosure instead of full-context injection.

**Verdict for complexity debate:** Argues AGAINST adding more injection
mechanisms. Current system already at risk; adding semantic retrieval creates
new vectors for wrong-memory injection.

---

### FM-04: SQLite Corruption Over Cloud Filesystem [CONFIDENCE: HIGH]

**Evidence:** D7a finding: SQLite's official documentation
(`sqlite.org/useovernet.html`) explicitly states SQLite on network filesystems
is unsupported. OneDrive, Dropbox, and similar tools behave like network
filesystems at the locking level. A WAL-reset bug in SQLite versions
3.7.0-3.51.2 (fixed March 13, 2026 in 3.51.3) could cause corruption even on
local filesystems. D7a verdict: "Not recommended" for shared SQLite on cloud
sync.

**Root cause:** SQLite's file locking model assumes local POSIX filesystem
semantics. Cloud sync tools violate these assumptions.

**Likelihood:** 2/5 — For a solo user who never writes from two machines
simultaneously, the risk is low in practice but non-zero (sync events can race
with writes).

**Impact:** 5/5 — Silent data corruption in a memory store is catastrophic. The
memory still appears to work, but it serves incorrect or partial data with no
error indicator. Debugging requires reconstructing the database from scratch.

**Risk score:** 10/25

**Mitigation:** Never put SQLite memory stores on OneDrive/Dropbox paths. Use
markdown files (safe for cloud sync) or a cloud-native backend (HTTP MCP server,
Firestore).

**Verdict for complexity debate:** Argues AGAINST any plan to sync SQLite-backed
memory tools (claude-mem, OMEGA, episodic-memory) via cloud filesystem sync.
Enforces the markdown-files or cloud-backend dichotomy.

---

### FM-05: Cursor Shipped Then Removed Auto-Memory [CONFIDENCE: HIGH]

**Evidence:** D4b finding: Cursor shipped a "Memories" feature in mid-2025 and
removed it in v2.1.x. No post-mortem was published. The community moved to
Rules-based approaches (`.cursorrules`) instead. D3c finding: Confirmed. This is
the only major coding tool that tried and abandoned auto-memory at the IDE
level.

**Root cause:** Unknown (no post-mortem). Most likely: automatic extraction
created more noise than signal; quality control was insufficient; or user trust
in auto-generated memory was low enough to cause confusion.

**Lessons:** (1) Automatic memory extraction at the IDE layer is harder than it
looks. (2) The absence of a post-mortem is itself a warning — the team could not
say what went wrong clearly enough to explain it. (3) The community's response
(rules-based manual instructions) aligns with the finding that markdown files
are the community's dominant pattern.

**Likelihood for SoNash:** N/A (this is an industry signal, not a
SoNash-specific failure). But it is a strong prior against adding
auto-extraction mechanisms without quality gates.

**Risk score:** N/A (contextual signal)

**Verdict for complexity debate:** Argues AGAINST auto-extraction mechanisms
without human-in-the-loop validation (the Augment Code model of human approval
before storage is the correct mitigation pattern).

---

### FM-06: STATE_SCHEMA.md is Significantly Stale [CONFIDENCE: HIGH]

**Evidence:** D1 finding: STATE_SCHEMA.md documents only 10 persistent state
files and several deprecated patterns. The actual state directory has 82 files.
Any architectural decisions based on STATE_SCHEMA.md alone would rest on stale
information.

**Root cause:** Documentation written at one point in time, state files
accumulated organically, documentation was not updated.

**Likelihood of recurrence:** 5/5 — This is entropy. Any documentation of a
living system will drift without automated sync. The 82-file state directory vs.
10-file schema is an 8x drift.

**Impact:** 2/5 — Primarily an orientation problem: new sessions or agents
consulting documentation get wrong picture of system state. Low immediate impact
but high risk if someone makes architectural decisions from stale docs.

**Risk score:** 10/25

**Verdict for complexity debate:** Argues AGAINST adding new mechanisms without
updating documentation immediately. The system already has more undocumented
behavior than documented behavior.

---

### FM-07: Hook Breakage — PostToolUse Broke for 2+ Months [CONFIDENCE: HIGH]

**Evidence:** D2a finding: claude-mem's PostToolUse hooks broke for 2+ months
(November 10, 2025 – approximately January 2026) when Claude Code changed its
runtime. During this period, no new observations were recorded. Workaround:
upgrade to v8.5.2+.

**Root cause:** Third-party hooks depend on Claude Code's runtime contract. When
Claude Code changed internal runtime behavior, hooks that assumed a specific
execution model silently stopped firing. There was no error — just silence.

**Likelihood for SoNash:** 3/5 — SoNash has 25 hook scripts. Claude Code is
under active development. A runtime change that breaks hook contract semantics
is plausible in any quarter.

**Impact:** 4/5 — Silent. The hooks don't throw errors; they simply don't fire.
State files stop accumulating. The learning system stops recording. Memory
doesn't update. The user notices weeks or sessions later when something seems
wrong.

**Risk score:** 12/25

**Mitigation:** Session-start hook validation that checks recent hook execution
timestamps. Already partially present in SoNash's session-start system but could
be made more robust.

**Verdict for complexity debate:** Argues AGAINST adding more hook dependencies.
Each new hook is another failure surface that can silently break.

---

### FM-08: MASTER_DEBT.jsonl Overwrite Hazard [CONFIDENCE: HIGH]

**Evidence:** D1 finding: MASTER_DEBT.jsonl (8,479 lines) has a known overwrite
risk. Multiple ingestion scripts can regenerate it from scratch, potentially
losing deferred/resolved status if run incorrectly. Documented in
`reference_tdms_systems.md`.

**Root cause:** Regenerative scripts don't distinguish between "initial seed"
and "update" operations. Running the wrong script with the wrong arguments
destroys work-in-progress state.

**Likelihood:** 2/5 — Requires explicit script execution, not an automatic
process. But the hazard is severe enough to be documented in memory.

**Impact:** 5/5 — Loss of 8,479 resolved/deferred debt classifications means
re-triaging thousands of issues.

**Risk score:** 10/25

**Verdict for complexity debate:** This is an existing fragility. Adding more
systems that have regenerative scripts (vector indices, embedding stores)
multiplies this hazard class.

---

## Part 2: New Risks from Proposed Enhancements

These are forward-looking risks for mechanisms not yet in place.

---

### NR-01: Vector Search — Embedding Model Dependency and Version Drift [CONFIDENCE: HIGH]

**What triggers it:** Adding semantic retrieval via any embedding model (Qdrant,
ChromaDB, sqlite-vec, etc.).

**Failure modes:**

- The embedding model used to index memory differs from the model used to query
  memory after a version upgrade. Result: embeddings are computed in different
  vector spaces; semantic similarity breaks silently. Queries return garbage.
- Local ONNX models (sqlite-vec, MiniLM-L6-v2) are pinned versions. Upstream
  updates may introduce model changes that invalidate the existing vector index.
- If the embedding model becomes unavailable (discontinued, API outage, npm/pip
  package removal), semantic search degrades to nothing with no fallback if the
  system was designed for semantic-only retrieval.

**Likelihood:** 3/5 — Model version drift is common over a 250+ session project
lifespan. Vector database tools are young and change APIs frequently.

**Impact:** 4/5 — Silent corruption of search results. Wrong memories surface
with apparent confidence. Hallucination amplification risk.

**Risk score:** 12/25

**Mitigation:** Use hybrid search (keyword + vector) so keyword fallback
preserves function when vector search degrades. Version-pin embedding models.
Run a re-indexing job when the model changes. Document the model version
alongside the index.

**Verdict for complexity debate:** Argues for caution. If adding vector search,
it must be a supplement to keyword/file-based retrieval, never a replacement.

---

### NR-02: Semantic Retrieval — Wrong Memories Surfaced, Hallucination Amplification [CONFIDENCE: HIGH]

**What triggers it:** A semantic retrieval system that injects "relevant"
memories based on cosine similarity to the current query.

**Failure modes:**

- High-similarity but contextually wrong memory injected. Example: past session
  on Firebase auth is semantically similar to current session on Firebase
  Firestore operations. The memory about auth patterns gets injected, Claude
  conflates them.
- Stale memories (patterns that were true 200 sessions ago, corrected since) are
  retrieved because they are still semantically similar to current work. The
  correction was stored but the retrieval scoring favors recency-neutral
  similarity.
- Hallucination amplification: if Claude already has a wrong belief AND the
  semantic retrieval surfaces a memory that confirms the wrong belief, the
  confidence of the wrong belief increases. Memory systems can make
  hallucinations harder to correct.

**Evidence from research:** D4a academic finding: LongMemEval benchmark shows
~30% accuracy drop on memorizing information across sustained interactions even
for commercial assistants. Commercial systems are not reliably accurate at
memory retrieval under sustained use.

**Likelihood:** 3/5 — Semantic retrieval is probabilistic. Mismatches are
inevitable at scale; the question is frequency.

**Impact:** 4/5 — Wrong memory injection is worse than no memory injection. A
correct answer with no memory is better than a plausible wrong answer anchored
to incorrect retrieved context.

**Risk score:** 12/25

**Mitigation:** TTL/decay so stale memories are de-ranked. Human-in-the-loop
validation before memory is stored (Augment Code model). Memory citation so
Claude can surface which memories it relied on. Quality gates before storage
(Cipher's ≥0.4 threshold model).

**Verdict for complexity debate:** Argues for conservative retrieval design.
Prefer conservative (fewer, higher-confidence memories) over aggressive (more
memories, higher coverage). The risk of injection is not linear with count.

---

### NR-03: Consolidation — Loss of Nuance During Compression [CONFIDENCE: HIGH]

**What triggers it:** Adding automated consolidation (Auto Dream pattern,
periodic LLM-based memory compression, merging related entries).

**Failure modes:**

- LLM compression converts nuanced entries like "user prefers X but only in
  context Y" into flat rules like "user always prefers X." The conditional is
  lost.
- Contradictions that exist because BOTH are true in different contexts get
  resolved into a single "winner," discarding the context-dependency.
- Consolidation introduces artifacts: the consolidating model may generate
  plausible-sounding but invented connections between memories that are only
  superficially related.
- The Auto Dream system runs "in a fresh conversation with no access to prior
  conversation history" (per GitHub issue #38426). This means the consolidating
  agent cannot verify its inferences against the actual session context.

**Evidence:** D3b-2a finding: Auto Dream is server-side gated (not GA)
specifically because it runs in a context-free mode. The Anthropic team has not
shipped it broadly, which is itself a signal that they are cautious about
quality.

**Likelihood:** 3/5 — Any LLM-based consolidation will occasionally compress
nuance.

**Impact:** 3/5 — Individual nuanced rules become blunt rules. The user notices
when Claude applies a rule incorrectly in the excluded context and must
recorrect.

**Risk score:** 9/25

**Mitigation:** Keep originals in an archive layer, consolidate only into a
summary index. Never delete source memories during consolidation — only suppress
them from hot-path injection. Make consolidation output human-reviewable before
it becomes canonical.

**Verdict for complexity debate:** Argues for incremental adoption of
consolidation with mandatory human review step. The Auto Dream "runs without
session context" limitation makes fully automated consolidation particularly
risky.

---

### NR-04: Cross-Locale Sync — Merge Conflicts, Split-Brain, Stale Memory Injection [CONFIDENCE: HIGH]

**What triggers it:** Any mechanism that syncs memory across the two Windows
locales (jbell work, Owner home).

**Failure modes:**

**Merge conflicts:** If both locales write to the same memory files during the
same or adjacent sessions, git merge conflicts produce standard conflict markers
inside MEMORY.md. Claude reads these literally as memory content, including the
`<<<<<<`, `=======`, and `>>>>>>>` markers. This is not a silent failure but it
is a confusing one.

**Split-brain:** If locale A has a correction ("user is a non-developer
director") and locale B has the old state ("user is a Node.js expert"), and the
sync mechanism uses "latest wins," the older stale memory at locale B could
overwrite the newer correction at locale A if locale B's sync runs after locale
A's correction.

**Stale memory injection:** After a long period at one locale, the other locale
pulls a memory state that is months old. All the corrections and new learnings
accumulated at the active locale are not present. The session starts with stale
context, and corrections that were already incorporated get reinvented.

**autoMemoryDirectory bug (evidence):** D7a finding: GitHub Issue #36636 showed
that even after `autoMemoryDirectory` was configured, the system prompt still
referenced the default path. Fixed March 25, 2026, but this shows the feature is
new and has had implementation bugs.

**Likelihood:** 3/5 — Path-keying differences between locales are a documented
structural issue. Without careful setup, each locale operates on an independent
memory store.

**Impact:** 3/5 — Stale memory injection causes repeated corrections.
Split-brain loses corrections. Both are recoverable but annoying.

**Risk score:** 9/25

**Mitigation:** `autoMemoryDirectory` pointing at the git repo canonical-memory
directory is the lowest-risk approach. Solo operator who never runs both
machines simultaneously keeps conflict probability very low. But it requires
manual configuration at each locale (cannot be committed to the repo for
security reasons).

**Verdict for complexity debate:** Argues for the simplest possible sync
mechanism (git-tracked markdown, single write path) over complex sync
infrastructure.

---

### NR-05: Confidence Decay — Premature Forgetting of Still-Valid Patterns [CONFIDENCE: HIGH]

**What triggers it:** Adding temporal decay scoring (patterns lose weight over
time and eventually expire/are deleted).

**Failure modes:**

- A behavioral correction the user provided 100 sessions ago is still valid. The
  decay function marks it as "stale" and suppresses it. Claude re-makes the
  mistake. The user corrects again. The decay-based forgetting creates a
  treadmill where the user re-teaches the same lessons.
- A pattern is valid in a different seasonal context (e.g., a quarterly planning
  pattern that only fires every 3 months). The decay function interprets "not
  used in 30 days" as "no longer valid" and expires it. The quarterly planning
  session finds the pattern gone.
- The decay function parameters (half-life values) are wrong for the memory
  types. D3b-2b finding (Yuval's architecture): 7-day half-life for progress,
  30-day for context, permanent for architecture/decisions. These are guesses,
  not empirically validated values.

**Evidence:** D6a finding: OpenMemory/Mem0 uses differential decay rates
(episodic 0.015, semantic 0.005, procedural 0.008, emotional 0.020, reflective
0.001). The variation shows there is no universally correct decay rate — it is
type-dependent and context-dependent.

**Likelihood of harmful forgetting:** 3/5 — Behavioral corrections and rare but
important patterns are exactly the content that decay would incorrectly expire.

**Impact:** 3/5 — Re-teaching corrected behaviors wastes session time and
degrades trust in the memory system.

**Risk score:** 9/25

**Mitigation:** Only apply decay to time-sensitive memory types (progress,
session notes). Apply no decay to behavioral corrections and architectural
decisions. Implement decay as de-ranking (reduced injection probability), never
as deletion. Require explicit human confirmation before any permanent deletion.

**Verdict for complexity debate:** Argues for extreme caution. If adding decay,
it must be narrowly scoped to session/progress notes only. Never apply to
feedback and user correction entries.

---

### NR-06: Adding More Hooks — Performance Impact on Every Claude Code Interaction [CONFIDENCE: HIGH]

**What triggers it:** Adding new PostToolUse, SessionStart, or other lifecycle
hooks.

**Failure modes:**

- Each hook adds latency to Claude Code operations. PostToolUse hooks fire after
  every tool call (Bash, Write, Edit, Read). SoNash already has 25 hooks. A hook
  that takes 500ms per call on a session with 200 tool calls adds 100 seconds of
  overhead.
- Hooks that fail (throw unhandled exceptions) can abort the tool operation or
  print error text into Claude's context. This is particularly dangerous for
  PostToolUse hooks on Bash commands where the output context is already noisy.
- Multiple hooks firing for the same event can interact. Hook A writes a file
  that Hook B reads; if B fires before A finishes writing, B reads stale data.
- The Claude Code 30-second hook timeout is unforgiving. A hook that makes a
  network call (embedding API, MCP server call) risks triggering the timeout.

**Evidence:** D2a finding: claude-mem's fire-and-forget queue architecture was
specifically designed to return immediately from PostToolUse and process
asynchronously, because the 30-second timeout is a hard constraint.

**Likelihood:** 3/5 — Probability that a new hook will have unexpected
interactions with 25 existing hooks is non-trivial.

**Impact:** 3/5 — Performance degradation is visible (Claude feels slow). Hook
errors in context pollute Claude's reasoning about what just happened.

**Risk score:** 9/25

**Mitigation:** Any new hook that does non-trivial processing must use
fire-and-forget (queue + async processing). Add hook execution timing to the
session-start health check. Maintain a hook performance budget.

**Verdict for complexity debate:** Argues for reviewing existing 25 hooks for
consolidation before adding new ones.

---

## Part 3: Complexity Risks

---

### CR-01: 14 Mechanisms Already — Cognitive Load for Solo Non-Developer [CONFIDENCE: HIGH]

**Evidence:** D1 finding: 14 persistence mechanisms identified (Auto Memory
MEMORY.md, CLAUDE.md, MCP memory server, episodic-memory plugin, state files
system, SESSION_CONTEXT.md, SESSION_HISTORY.md, SESSION_DECISIONS.md, TDMS,
learning system, GSD planning artifacts, override/governance logs, canonical
memory, GSD plugin state). D6b finding: The project's constraints explicitly
include "14 existing persistence mechanisms already active."

**The cognitive load problem:** Each persistence mechanism has:

- A different storage format (markdown, JSONL, JSON, SQLite)
- A different write trigger (hook, manual, Claude, scheduled)
- A different read trigger (session start, on-demand, skill invocation)
- A different failure mode
- Different documentation (often stale)

For a solo non-developer, the maintenance surface is already beyond comfortable
monitoring. When something goes wrong (FM-06: STATE_SCHEMA.md is 8x stale), the
user cannot easily audit which mechanism is misbehaving.

**Likelihood of confusion-driven errors:** 4/5 — 250 sessions of accumulated
mechanisms without a reduction pass.

**Impact:** 3/5 — Wrong behavior due to stale memory in the wrong layer.
Debugging time when something breaks.

**Risk score:** 12/25

**Verdict for complexity debate:** Strong argument for simplification before
addition. The marginal value of mechanism #15 is lower than mechanisms 1-14
because the cognitive overhead of monitoring it competes with the overhead of
mechanisms 1-14. A reduction-first principle applies.

---

### CR-02: Interaction Effects Between Mechanisms [CONFIDENCE: HIGH]

**Evidence from research:**

**Auto Memory vs. MCP Memory (D5b):** Both can capture session learnings. If
both are active and accumulate similar content, injection at session start
includes duplicate content from both systems, burning token budget twice.

**CLAUDE.md vs. Auto Memory (D3b-2a, D3b-2b):** If CLAUDE.md contains a rule
that conflicts with an Auto Memory entry, the precedence is unclear. CLAUDE.md
is injected as instructions; Auto Memory is injected as context. The model may
resolve the conflict differently in different sessions.

**Compaction and memory state files (D1):** `handoff.json` captures a snapshot
of all task state files at PreCompact. If a memory-related state file is in an
inconsistent state at the moment PreCompact fires (mid-write), the snapshot
captures corrupted state that `compact-restore.js` then injects at session
start.

**Learning system + Auto Memory (D1):** The learning system writes to
`CODE_PATTERNS.md` and CLAUDE.md. Auto Memory writes to MEMORY.md and topic
files. Neither system is aware of the other's writes. Redundant content
accumulates in both.

**Episodic memory plugin + Auto Memory (D5a):** Episodic memory indexes
conversation JSONL files from `~/.claude/projects`. Auto Memory writes to a
separate directory. Episodic memory cannot search Auto Memory content because
they are different stores. A user asking "what did I work on last week" gets
episodic memory results; the Auto Memory learnings from that week are invisible
to episodic search.

**Likelihood of harmful interactions:** 3/5 — Interactions are subtle and
session-dependent. They manifest as inconsistency rather than hard failures.

**Impact:** 3/5 — Inconsistent behavior across sessions. Duplicate token
consumption. Cognitive cost of keeping mental model of which system "wins" in
conflict.

**Risk score:** 9/25

**Mitigation:** Define clear ownership boundaries for each memory type. Assign
one mechanism per memory category. Retire redundant mechanisms rather than
accumulating them.

---

### CR-03: Debugging Becomes Harder as Layers Increase [CONFIDENCE: HIGH]

**Evidence:** The current 14-mechanism system already has documented orphaned
artifacts (D1: `agent-research-results.md` described as "Orphaned artifact" in
its own content), stale schemas (STATE_SCHEMA.md 8x stale), and undocumented
behavior (governance-changes.jsonl not found despite hook documentation saying
it writes there).

**The debugging problem pattern:** When Claude behaves unexpectedly, the root
cause could be in any of: CLAUDE.md, MEMORY.md, a state file, a hook script, a
skill doc, an MCP memory entry, a canonical-memory entry, a session-start
injection, or the SESSION_CONTEXT.md. Each layer must be checked before the
cause can be isolated.

Adding vector search adds: the embedding index, the ChromaDB/sqlite-vec data
files, the embedding model version, and the query scoring weights. Each is a new
variable to rule out during debugging.

For a non-developer solo operator, debugging becomes "I'm going to restart from
scratch" rather than "I'm going to trace the cause." This means hard work gets
lost.

**Likelihood:** 4/5 — Debugging is already the hardest part of memory system
maintenance. More layers = more debugging overhead.

**Impact:** 4/5 — If the user cannot debug a broken memory system, they either
abandon it or wipe it. Either outcome loses accumulated value.

**Risk score:** 16/25

**Mitigation:** Observability first. Before adding any new mechanism, add a
diagnostic tool that audits all 14 existing mechanisms and reports health.
Consider this a prerequisite rather than a nice-to-have.

**Verdict for complexity debate:** This is the strongest single argument against
adding complexity. The failure mode is: the system becomes too complex to debug
for a solo non-developer, and when something breaks, the user's choices are
"guess" or "wipe."

---

## Part 4: Anthropic Platform Risks

---

### PR-01: Auto Dream Could Ship and Conflict with Custom Memory Work [CONFIDENCE: MEDIUM]

**Evidence:** D3b-2a finding: Auto Dream is feature-flagged
(`tengu_onyx_plover`, `enabled: false`). Server-side trigger thresholds:
`minHours: 24`, `minSessions: 5`. Running `/dream` manually returns
`Unknown skill: dream`. Anthropic published zero official documentation.

**Failure mode:** Auto Dream ships, fires automatically after 24 hours or 5
sessions, and:

- Consolidates or prunes Auto Memory content that SoNash's custom consolidation
  had already curated
- Conflicts with `autoMemoryDirectory` settings (D3b-2a: currently "has no
  effect on external MCP memory servers")
- Re-writes MEMORY.md entries that were carefully structured for SoNash's
  session-start injection pattern

Auto Dream explicitly "runs in a fresh conversation with no access to prior
conversation history." It may consolidate context it cannot correctly evaluate.

**Likelihood:** 3/5 — The feature is built, visible in the UI, and has a known
flag. It will ship. When it ships, the behavior in the presence of a customized
memory system is unknown.

**Impact:** 3/5 — If Auto Dream rewrites curated memory, the session-start
context changes unexpectedly. The user may not notice immediately.

**Risk score:** 9/25

**Mitigation:** Monitor the Claude Code changelog for Auto Dream GA. When it
ships, test its behavior with `autoMemoryDirectory` and custom memory structures
before relying on curated memory. Consider using `autoDreamEnabled: false` in
settings as a precaution.

---

### PR-02: Auto Memory Behavior Could Change [CONFIDENCE: HIGH]

**Evidence:** D3b-2a changelog: Auto Memory changed behavior multiple times
within weeks of introduction. v2.1.74: added `autoMemoryDirectory`. v2.1.83:
added 25KB cap alongside the 200-line cap. v2.1.86: UI changes. v2.1.81:
`--bare` flag fully disables auto memory. The feature is evolving rapidly.

**Failure modes:**

- A future version changes the MEMORY.md format, invalidating existing entries
- The 200-line / 25KB cap changes, truncating carefully structured injection
- The path-keying mechanism changes, breaking cross-locale sync setups
- `autoMemoryDirectory` behavior changes (it was buggy at first: issue #36636)

**Likelihood:** 4/5 — The changelog shows rapid iteration. Any version in the
next 6 months could change behavior.

**Impact:** 2/5 — Auto Memory changes would require manual adjustment of
MEMORY.md structure or settings, not catastrophic data loss.

**Risk score:** 8/25

**Mitigation:** Pin Claude Code version when a stable memory configuration is
achieved. Subscribe to claude-code CHANGELOG.md. Structure MEMORY.md to be
robust to format changes (avoid relying on specific line counts).

---

### PR-03: MCP Protocol Evolution Could Break Memory Servers [CONFIDENCE: MEDIUM]

**Evidence:** D5b finding: "OAuth 2.1 for HTTP transports (2026 MCP standard)."
The MCP protocol is evolving. D5a finding: The current project MCP memory server
uses `cmd /c npx -y @modelcontextprotocol/server-memory`, which is a
Windows-specific workaround that assumes a specific invocation mechanism.

**Failure modes:**

- A new Claude Code version requires MCP transport migration (stdio →
  Streamable-HTTP), breaking local stdio-based servers
- Tool schema changes require updating tool descriptions, breaking existing
  prompts that reference specific tool names
- Authentication requirements change (OAuth 2.1 becomes mandatory), requiring
  credentials setup for previously-unauthenticated local servers

**Likelihood:** 2/5 — Protocol changes are gradual and typically maintain
backward compatibility. But the Claude Code team has made breaking changes
before (PostToolUse breakage, Nov 2025).

**Impact:** 3/5 — MCP server failure at session start breaks any memory
retrieval the workflow depends on.

**Risk score:** 6/25

**Mitigation:** Use only officially maintained MCP servers
(`@modelcontextprotocol/` namespace). Monitor the MCP specification changelog.
The official knowledge graph server is safest because Anthropic maintains both
the client and server.

---

### PR-04: Context Window Changes Could Invalidate Token Budgets [CONFIDENCE: MEDIUM]

**Evidence:** D5b finding: Token budget analysis found current combined context
overhead of 10,000-12,000 tokens before any user input on a typical setup. The
current context window is 200K tokens for Claude Sonnet/Opus. If Claude Code
moves to a smaller model (cost optimization) or if tool description formats
become more verbose, the budget math changes.

Conversely: if context windows grow, the 200-line / 25KB cap on Auto Memory
becomes the bottleneck, not the window.

**Likelihood:** 2/5 — Context window sizes are fairly stable; model changes in
Claude Code are announced.

**Impact:** 2/5 — Budget recalibration needed, not data loss.

**Risk score:** 4/25

**Mitigation:** Keep an eye on which model Claude Code uses by default. Budget
analysis is worth re-running after any Claude Code major version.

---

### PR-05: Native Features Shipping Could Obsolete Custom Work [CONFIDENCE: HIGH]

**Evidence:**

- D3b-1 finding: Community noted "Anthropic is actively developing native
  solutions, making third-party tools potentially short-lived."
- D3b-2a: Auto Dream is built and waiting.
- D4b: GitHub Copilot shipped citation-validated memory (December 2025); VS Code
  shipped two-tier native memory (January 2026).
- D3c: Claude Code shipped Auto Memory (February 2026), and the `/memory`
  command with Auto Dream toggle (March 2026).

**The pattern:** Anthropic ships native features that absorb the use cases of
third-party tools. Each native feature makes third-party tools that do the same
thing either redundant or risky (they may conflict with the native
implementation).

**Specific risk for SoNash:** If Anthropic ships:

- Native cross-device memory sync (requested in issue #35985) — the custom sync
  infrastructure becomes redundant
- Auto Dream GA — the custom consolidation logic conflicts
- Improved session-start injection — the canonical-memory workaround becomes
  unnecessary but possibly conflicting

**Likelihood:** 4/5 — Native features are shipping every few weeks. Memory is
the most-requested feature category in Claude Code issues.

**Impact:** 2/5 — Redundancy, not breakage. Custom work does not break; it
becomes unnecessary. The risk is wasted investment in custom mechanisms that a
native feature supersedes.

**Risk score:** 8/25

**Mitigation:** Adopt a "minimum viable custom" principle: build the simplest
possible custom enhancement, not the most sophisticated. Reserve complexity for
what Anthropic demonstrably will not ship (SoNash-specific behavioral
corrections, project-specific rules).

**Verdict for complexity debate:** Strong argument for deferring complex custom
memory work. The native platform is advancing quickly. The window for custom
work is narrowing.

---

## Part 5: Solo Developer Feasibility

---

### SF-01: Maintenance Burden Per Mechanism [CONFIDENCE: HIGH]

Drawing from D1 and D6b findings, estimated per-mechanism maintenance burden:

| Mechanism              | Estimated Maintenance                   | Failure Signals        |
| ---------------------- | --------------------------------------- | ---------------------- |
| CLAUDE.md (manual)     | 30 min / month (version reviews)        | Behavioral drift       |
| Auto Memory MEMORY.md  | 15 min / month (pruning)                | Context bloat          |
| MCP knowledge graph    | 5 min / month (entries grow)            | Slow search at scale   |
| Episodic memory plugin | 10 min / month (version updates)        | Search failures        |
| State files (82 files) | 30 min / month (cleanup, review)        | Stale schema drift     |
| SESSION_CONTEXT.md     | 10 min / session                        | Stale goals            |
| TDMS (8,479 items)     | 60 min / week (triage, resolution)      | Overwrite hazard       |
| Learning system        | 20 min / session (review promotions)    | Consolidation lag      |
| Canonical memory       | 60 min / month (manual sync)            | Divergence accumulates |
| 25 hook scripts        | 60 min / quarter (version compat check) | Silent breakage        |

**Total baseline:** Roughly 3-4 hours per month plus 30-45 minutes per session
for memory/context maintenance, not counting active development work.

**Each new mechanism adds approximately:**

- 15-30 min/month for monitoring and pruning
- 30-60 min for setup and initial configuration
- Unknown debugging time when it interacts unexpectedly with existing mechanisms

**Likelihood that maintenance gets abandoned:** 4/5 — Evidence: canonical-memory
was abandoned (FM-01). STATE_SCHEMA.md was not updated for 8x growth (FM-06).
Governance changes log was never found despite hook documentation (D1 gap #3).

**Verdict for complexity debate:** The abandonment evidence is the strongest
signal. Systems that require manual maintenance will be abandoned. Only add
mechanisms that are self-maintaining or have automated health checks.

---

### SF-02: What Happens When Something Breaks and the User Cannot Debug It [CONFIDENCE: HIGH]

**The non-developer debugger problem:** A professional developer would trace a
failure through logs, read source code, and isolate the cause. A solo
non-developer director's options are:

1. Ask Claude to debug it — but Claude's information comes from the same broken
   context
2. Restart from scratch — losing accumulated state
3. Accept the broken behavior — compounding the problem

**Evidence from observed behavior patterns:**

- The canonical-memory divergence (FM-01) was not actively debugged; it was
  discovered incidentally during this research
- The STATE_SCHEMA.md drift (FM-06) was not noticed until a systematic audit
- Governance changes JSONL was referenced in documentation but not found — never
  investigated

**Pattern:** The user discovers failures through external audits (this research)
rather than active monitoring. This is not a criticism — it is a structural
property of a solo non-developer maintaining a complex system.

**The asymmetry of failure:** A simple mechanism that breaks is recoverable. A
complex mechanism with multiple interacting layers that breaks may be impossible
to diagnose, and the only exit is destroying the accumulated state.

**Verdict for complexity debate:** The single most important feasibility
constraint. Every proposed enhancement should be evaluated against: "What
happens when this breaks at 2am on a deadline, and the user is alone?" If the
answer is "cannot easily recover without deep technical knowledge," do not add
it.

---

### SF-03: Minimum Viable Enhancement vs. Maximum Useful Enhancement [CONFIDENCE: HIGH]

**The minimum viable enhancement for each proposed area:**

| Enhancement Area   | Minimum Viable                                                                     | Maximum Useful                                     | Recommend                  |
| ------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------- |
| Cross-locale sync  | `autoMemoryDirectory` → git repo dir, configured once at each locale               | Full Syncthing + memoir + Firebase backend         | Minimum viable             |
| Semantic retrieval | Keyword + filename-based retrieval (already present)                               | Vector DB + hybrid search + progressive disclosure | Keyword only, no new infra |
| Consolidation      | Human-reviewed session-end summarization (already partial in SESSION_CONTEXT.md)   | Auto Dream + LLM consolidation + decay scoring     | Manual only                |
| Canonical memory   | Reconcile and retire one copy (merge canonical into live, set autoMemoryDirectory) | Full automated bidirectional sync                  | Reconcile and retire       |
| Learning system    | Keep existing (review-lifecycle → CODE_PATTERNS.md)                                | Add vector search over 500 reviews                 | Keep existing              |
| Debugging          | Add diagnostic command that audits all 14 mechanisms                               | Full observability pipeline with alerts            | Add diagnostic first       |

**The maximum useful enhancement is rarely the recommended one.** For a solo
non-developer, the minimum viable enhancement that solves the immediate pain is
better than the maximum useful enhancement that creates new maintenance burden.

---

## Summary: The Risk Matrix

| Risk                                  | Likelihood | Impact | Score  | Verdict                         |
| ------------------------------------- | ---------- | ------ | ------ | ------------------------------- |
| FM-01: Canonical memory divergence    | 5          | 3      | 15     | Against complexity              |
| FM-02: MCP startup hang (5-6 min)     | 4          | 4      | 16     | Against MCP-at-start            |
| FM-03: Context rot                    | 3          | 3      | 9      | Against more injection          |
| FM-04: SQLite on cloud filesystem     | 2          | 5      | 10     | Against SQLite sync             |
| FM-05: Cursor removed auto-memory     | N/A        | N/A    | signal | Against auto-extraction         |
| FM-06: STATE_SCHEMA.md stale          | 5          | 2      | 10     | Against undocumented growth     |
| FM-07: Hook breakage silent           | 3          | 4      | 12     | Against more hooks              |
| FM-08: MASTER_DEBT overwrite          | 2          | 5      | 10     | Against regenerative scripts    |
| NR-01: Embedding model drift          | 3          | 4      | 12     | Against vector-only retrieval   |
| NR-02: Wrong memories surfaced        | 3          | 4      | 12     | Against aggressive retrieval    |
| NR-03: Consolidation loss             | 3          | 3      | 9      | Against auto-consolidation      |
| NR-04: Cross-locale split-brain       | 3          | 3      | 9      | For simple sync                 |
| NR-05: Premature forgetting           | 3          | 3      | 9      | Against broad decay             |
| NR-06: Hook performance               | 3          | 3      | 9      | Against more hooks              |
| CR-01: Cognitive overload (14+ mechs) | 4          | 3      | 12     | Reduce before adding            |
| CR-02: Mechanism interaction effects  | 3          | 3      | 9      | Define ownership boundaries     |
| CR-03: Debugging becomes impossible   | 4          | 4      | 16     | Observability before complexity |
| PR-01: Auto Dream conflict            | 3          | 3      | 9      | Monitor, defer                  |
| PR-02: Auto Memory behavior changes   | 4          | 2      | 8      | Monitor changelog               |
| PR-03: MCP protocol evolution         | 2          | 3      | 6      | Use official servers            |
| PR-04: Context window changes         | 2          | 2      | 4      | Low priority                    |
| PR-05: Native features obsolete work  | 4          | 2      | 8      | Minimum viable only             |
| SF-01: Maintenance burden             | 4          | 3      | 12     | Reduce before adding            |
| SF-02: Solo debugger limits           | 4          | 4      | 16     | Highest priority concern        |
| SF-03: MV vs. MAX enhancement         | —          | —      | —      | Minimum viable principle        |

---

## Overall Conclusions

**The three highest-risk scenarios (score 16/25):**

1. **MCP startup hang** (FM-02) — Permanently unfixed by Anthropic,
   reproducible, severe
2. **Debugging becomes impossible** (CR-03) — Structural vulnerability of
   complex systems for solo non-developer
3. **Solo debugger limits** (SF-02) — The asymmetric consequences of
   undebuggable failures

**The three most consistent failure signals:**

1. **Manual maintenance gets abandoned.** Three confirmed examples in the
   existing system (canonical-memory, STATE_SCHEMA.md,
   governance-changes.jsonl). Any mechanism requiring manual maintenance will
   eventually diverge.
2. **Silent failures are the worst failures.** Hook breakage, canonical-memory
   divergence, and context rot all share one property: they do not announce
   themselves. The user discovers them through audits, not alerts.
3. **More mechanisms = more interaction surface = harder debugging.** The system
   is already at the edge of debuggable complexity for a solo non-developer.

**The two arguments for proceeding with enhancements:**

1. Cross-locale sync is a genuine pain that `autoMemoryDirectory` → git repo
   partially solves with low risk. This is the one enhancement with a clear
   minimum-viable path that adds minimal maintenance burden.
2. An observability diagnostic (audit command) would reduce risk across all 14
   existing mechanisms and is a prerequisite to safely adding any new ones. This
   is investment that reduces overall system risk.

**The default recommendation this analysis supports:** Solve the
canonical-memory divergence (consolidate to one copy, configure
`autoMemoryDirectory`). Add an observability diagnostic. Do not add vector
search, semantic retrieval, auto-consolidation, or additional hooks until the
existing 14 mechanisms are documented, health-checked, and stable.

---

## Sources

| #   | Path / URL                                             | Title                                     | Type           | Trust | Date       |
| --- | ------------------------------------------------------ | ----------------------------------------- | -------------- | ----- | ---------- |
| 1   | D1-codebase-memory-inventory.md                        | Codebase memory inventory (14 mechanisms) | findings       | HIGH  | 2026-03-31 |
| 2   | D2a-claude-mem-cipher.md                               | claude-mem and cipher analysis            | findings       | HIGH  | 2026-03-31 |
| 3   | D2b-everything-cc-interface.md                         | ECC and interface-design analysis         | findings       | HIGH  | 2026-03-31 |
| 4   | D3b-1-reddit-hn.md                                     | Reddit and HN community patterns          | findings       | HIGH  | 2026-03-31 |
| 5   | D3b-2a-anthropic-official.md                           | Anthropic official documentation          | findings       | HIGH  | 2026-03-31 |
| 6   | D3b-2b-dev-blogs.md                                    | Developer blog community patterns         | findings       | HIGH  | 2026-03-31 |
| 7   | D3c-marketplace-plugins.md                             | Marketplace plugin ecosystem              | findings       | HIGH  | 2026-03-31 |
| 8   | D4a-academic-memory-patterns.md                        | Academic LLM memory architecture          | findings       | HIGH  | 2026-03-31 |
| 9   | D4b-industry-implementations.md                        | Industry implementations analysis         | findings       | HIGH  | 2026-03-31 |
| 10  | D5a-mcp-memory-servers.md                              | MCP memory server catalog                 | findings       | HIGH  | 2026-03-31 |
| 11  | D5b-mcp-integration-patterns.md                        | MCP integration patterns                  | findings       | HIGH  | 2026-03-31 |
| 12  | D6a-comparison-matrix.md                               | Comparison matrix (all systems)           | findings       | HIGH  | 2026-03-31 |
| 13  | D6b-architecture-patterns.md                           | Architecture pattern mapping              | findings       | HIGH  | 2026-03-31 |
| 14  | D7a-cross-locale-sync.md                               | Cross-locale sync patterns                | findings       | HIGH  | 2026-03-31 |
| 15  | D7b-sync-implementations.md                            | Sync implementation tools                 | findings       | HIGH  | 2026-03-31 |
| 16  | D3a-1-github-claude-memory.md                          | GitHub Claude Code memory repos           | findings       | HIGH  | 2026-03-31 |
| 17  | https://github.com/anthropics/claude-code/issues/15140 | 5-6min MCP hang (closed NOT_PLANNED)      | official issue | HIGH  | 2026-02    |
| 18  | https://github.com/anthropics/claude-code/issues/38426 | Auto Dream unknown skill bug              | official issue | HIGH  | 2026-03    |
| 19  | https://sqlite.org/useovernet.html                     | SQLite over network (official)            | official docs  | HIGH  | 2025       |
| 20  | https://arxiv.org/abs/2410.10813                       | LongMemEval (ICLR 2025)                   | academic       | HIGH  | 2025       |

---

## Contradictions

**"Manual maintenance is adequate" vs. evidence of abandonment:** The existing
system was designed with manual maintenance steps (canonical-memory,
STATE_SCHEMA.md, governance log). All three show evidence of abandonment. The
claim that manual maintenance is adequate is refuted by the system's own
history.

**"Semantic retrieval improves accuracy" vs. LongMemEval results:** Vendor
claims (Mem0: 26% improvement, OMEGA: 95.4% LongMemEval) contrast with the
academic benchmark showing ~30% accuracy drop on commercial systems under
sustained multi-session use. These are not directly comparable but they are in
tension. Independent validation of vendor claims was not found.

**"More memory = better context" vs. "context rot" evidence:** The naive
assumption underlying most memory system designs. Contradicted by the HN context
engineering thread (915 pts), academic literature on attention degradation
beyond 10K tokens, and the practical recommendation to cap injection at 10-20
entries max.

---

## Gaps

1. **No benchmark data for SoNash's specific workload.** Latency, token
   overhead, and accuracy claims are from systems under different conditions.
   How any of these numbers apply to a 250-session single-developer workflow
   with 14 existing mechanisms is unknown.

2. **Auto Dream behavior in the presence of customized memory is unknown.** When
   (not if) Auto Dream ships, how it interacts with `autoMemoryDirectory`,
   custom canonical-memory structure, and existing MEMORY.md format is
   undocumented.

3. **Interaction effect measurement between existing 14 mechanisms.** The system
   has never been profiled for cross-mechanism interference. Token overlap,
   content duplication, and conflicting injections are identified as risks but
   not quantified.

4. **Failure recovery time estimates absent.** How long does it take to recover
   from each failure mode if the user cannot debug the root cause? This is the
   most important practical number and it was not found in any source.

---

## Serendipity

**The abandonment pattern is the most important finding.** Three independent
examples of maintenance abandonment in the existing system (canonical-memory,
STATE_SCHEMA.md, governance-changes.jsonl) form a pattern that was not the
research question but is the most actionable finding. Any memory system design
for this user must account for the fact that manual maintenance steps will
eventually be skipped.

**The MCP startup hang (FM-02) is permanently unfixed.** Closed NOT_PLANNED.
This is a trap that will keep recurring for anyone who adds "check memory at
session start" to their CLAUDE.md. It warrants a standing warning in the
project's own documentation.

**Cursor removing auto-memory is a meaningful industry signal.** No explanation
was published. The community's observed transition to rules-based approaches
(`.cursorrules`) suggests the failure was: auto-generated memory accumulated
noise faster than signal, and users could not easily curate it. This is the same
risk profile as SoNash adding auto-extraction without human-in-the-loop gates.

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All failure modes are evidenced from observed behavior in the existing codebase
or from confirmed external sources. Risk scores are subjective (likelihood and
impact are estimates), but the evidence base for each failure mode is solid.
Probability estimates represent calibrated guesses, not statistical
measurements.
