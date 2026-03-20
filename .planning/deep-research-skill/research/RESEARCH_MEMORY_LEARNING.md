# Research Memory & Learning Architecture

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH COMPLETE
**Author:** Claude (research agent, memory/learning task)
<!-- prettier-ignore-end -->

---

## Executive Summary

A deep-research skill that forgets everything between sessions wastes compute,
time, and user trust. If the system researched "React 19 server components" last
week, a new query about "React 19 data fetching patterns" should build on that
prior work rather than re-searching from scratch.

This document designs a **research memory layer** that enables:

1. **Persistence** -- research findings survive across sessions and compaction
2. **Overlap detection** -- new queries are checked against prior research
3. **Incremental building** -- new findings extend existing knowledge, not
   replace
4. **Staleness management** -- findings decay based on domain half-life
5. **Quality learning** -- the system tracks which sources/strategies work and
   which fail
6. **User control** -- clear scoping, privacy boundaries, and forget
   capabilities

The recommended architecture uses a **three-tier approach**: (1) structured
JSONL research index for fast lookup, (2) markdown finding files for
human-readable persistence, and (3) the existing MCP memory server for
cross-session entity graphs. This avoids introducing new infrastructure (no
vector databases, no external services) while providing the core value
proposition.

**Key design principle:** Research memory should be a _file-based knowledge
system_ that lives in the repository alongside other project artifacts, not a
cloud service or external dependency. This aligns with the codebase's existing
patterns (JSONL state files, markdown artifacts, MCP for lightweight entities).

---

## 1. Current Memory Infrastructure

### 1.1 What Exists Today

The codebase has a mature, multi-layered memory and state persistence system.
Understanding what exists is critical to avoid reinventing infrastructure.

#### Auto-Memory System (Claude Code native)

- **Location:** `~/.claude/projects/<project-hash>/memory/`
- **Structure:** `MEMORY.md` index file linking to individual topic files
- **Content types:** User preferences, feedback patterns, project state,
  reference information
- **26 memory files** currently tracked, organized into User, Feedback, Project,
  and Reference categories
- **Persistence:** Survives across sessions (loaded into every conversation via
  system-reminder)
- **Limitation:** Designed for behavioral/preference memory, not research
  findings. Files are small (400-1,100 bytes each). No structured data, no
  confidence levels, no source tracking.

#### MCP Memory Server

- **Configuration:** `.mcp.json` configures
  `@modelcontextprotocol/server-memory`
- **Capabilities:** Entity-relationship graph with JSON persistence. Supports
  `create_entities`, `create_relations`, `search_nodes`, `read_graph`
- **Current usage:** Checkpoint skill (`/checkpoint --mcp`) saves session
  context entities (type: `session_context`, `architectural_decision`,
  `bug_investigation`)
- **Limitation:** No research-specific entity types defined. No research index.
  The memory graph is general-purpose, not optimized for research retrieval.

#### Compaction-Resilient State Persistence (4 layers)

| Layer         | Mechanism                | Trigger              | Output             |
| ------------- | ------------------------ | -------------------- | ------------------ |
| A: Commit Log | `commit-tracker.js`      | PostToolUse: Bash    | `commit-log.jsonl` |
| C: PreCompact | `pre-compaction-save.js` | PreCompact event     | `handoff.json`     |
| Restore       | `compact-restore.js`     | SessionStart:compact | stdout injection   |
| D: Gap Detect | `check-session-gaps.js`  | Session begin        | Console warnings   |

These layers ensure _task state_ survives compaction but do not preserve
_research knowledge_.

#### File-Based State (`.claude/state/`)

- JSONL append-only logs: `reviews.jsonl`, `health-score-log.jsonl`,
  `forward-findings.jsonl`, `lifecycle-scores.jsonl`, etc.
- Task state files: `task-{name}.state.json` for multi-step operations
- Audit history: `*-ecosystem-audit-history.jsonl` files tracking audit results
  over time
- **Pattern:** The codebase uses JSONL extensively for append-only structured
  data that accumulates over time. This is the natural format for a research
  index.

#### Session Context (`SESSION_CONTEXT.md`)

- Updated by `/session-end`, consumed by `/session-begin`
- Contains: session summaries, status table, next goals
- **Limitation:** Captures _what was done_, not _what was learned_. Research
  findings are not reflected here.

#### Planning Artifacts (`.planning/`)

- Per-initiative directories with research outputs
- Example: `.planning/deep-research-skill/research/` contains 3 research files
  from the current initiative
- **This is where research outputs go** but there is no index, no
  cross-referencing, no staleness tracking, and no mechanism to discover prior
  research when starting a new query.

### 1.2 What Is Missing for Research Memory

| Capability                            | Exists?                 | Gap                                        |
| ------------------------------------- | ----------------------- | ------------------------------------------ |
| Store research findings as files      | Yes (`.planning/`)      | No standard format, no index               |
| Index research by topic for retrieval | No                      | Cannot answer "what do we know about X?"   |
| Detect overlap with prior research    | No                      | Every query starts from scratch            |
| Track finding staleness/decay         | No                      | No timestamps on individual findings       |
| Track source reliability              | No                      | No feedback loop on source quality         |
| Learn from research quality           | No                      | No "this research was good/bad" signal     |
| Cross-session research continuity     | Partial (files persist) | No mechanism to discover and build on them |
| User control over research memory     | No                      | No forget/scope/privacy controls           |

---

## 2. Knowledge Persistence Design

### 2.1 What to Persist from a Research Session

Not everything from a research session should be persisted. Raw search results
are ephemeral; synthesized knowledge is valuable. The persistence layer should
capture:

**Always persist (HIGH value):**

| Artifact                           | Why                                  | Format                      |
| ---------------------------------- | ------------------------------------ | --------------------------- |
| Synthesized findings               | Core research output                 | Markdown (existing pattern) |
| Source list with metadata          | Enables verification and re-research | JSONL entries               |
| Confidence assessments             | Enables staleness detection          | Embedded in findings        |
| Topic tags / domain classification | Enables overlap detection            | Index entries               |
| Research date                      | Enables staleness calculation        | ISO timestamp               |
| Research query / question          | Enables overlap matching             | Index entries               |

**Persist selectively (MEDIUM value):**

| Artifact               | Why                                        | When                        |
| ---------------------- | ------------------------------------------ | --------------------------- |
| Contradictions found   | Valuable for future research on same topic | When sources conflict       |
| Gaps identified        | Guides future research                     | When explicitly noted       |
| Search strategies used | Enables learning what works                | When novel strategies tried |

**Do not persist (LOW value):**

| Artifact                    | Why Not                                |
| --------------------------- | -------------------------------------- |
| Raw search results          | Ephemeral, noisy, large                |
| Intermediate analysis notes | Superseded by synthesis                |
| Failed search queries       | Negative signal has limited shelf life |
| Full source text            | Copyright concerns, storage bloat      |

### 2.2 Storage Architecture: Three Tiers

```
Tier 1: Research Index (JSONL)
  .claude/state/research-index.jsonl
  - One entry per research topic/session
  - Fields: id, query, topics, date, confidence, staleness_domain,
    finding_paths, source_count, gaps, superseded_by
  - Purpose: Fast lookup, overlap detection, staleness queries

Tier 2: Research Findings (Markdown)
  .planning/<initiative>/research/<topic>-FINDINGS.md
  - Full synthesized research output
  - Structured sections: findings, sources, confidence, gaps, methodology
  - Human-readable, git-trackable, diffable
  - Follows existing .planning/ convention

Tier 3: Research Entities (MCP Memory)
  Entity type: research_knowledge
  - Lightweight topic-to-finding links
  - Cross-session discovery via mcp__memory__search_nodes()
  - Supplements file-based storage for quick retrieval
```

**Why three tiers:**

- **Tier 1 (JSONL)** is cheap to scan, append-only, and follows the codebase's
  established pattern (`reviews.jsonl`, `health-score-log.jsonl`, etc.). It
  answers "what have we researched?" without reading full files.
- **Tier 2 (Markdown)** is the actual knowledge. Human-readable, version
  controlled, and reviewable. Users can browse, edit, or delete findings
  directly.
- **Tier 3 (MCP)** enables cross-session discovery when the JSONL file is not in
  the current context window. The MCP memory server persists across sessions and
  is searchable.

### 2.3 Research Index Schema

```jsonl
{
  "id": "research-2026-03-20-react-server-components",
  "query": "React 19 server components architecture and best practices",
  "topics": [
    "react",
    "server-components",
    "react-19",
    "app-router"
  ],
  "domain": "frontend-framework",
  "date": "2026-03-20T14:30:00Z",
  "confidence": "HIGH",
  "staleness_class": "fast-decay",
  "half_life_months": 12,
  "finding_paths": [
    ".planning/react-migration/research/SERVER_COMPONENTS.md"
  ],
  "source_count": 8,
  "key_findings_summary": "RSC eliminates client-server waterfalls; use 'use client' boundary strategically; data fetching moves to server layer",
  "gaps": [
    "Performance benchmarks for large component trees"
  ],
  "superseded_by": null,
  "user_rating": null,
  "related_research": [
    "research-2026-03-15-nextjs-app-router"
  ]
}
```

### 2.4 Staleness Classification

Research findings decay at different rates depending on their domain. Drawing
from the half-life of knowledge concept (Arbesman 2012, Fritz Machlup 1962):

| Staleness Class | Half-Life    | Domains                                                             | Example                             |
| --------------- | ------------ | ------------------------------------------------------------------- | ----------------------------------- |
| `fast-decay`    | 3-6 months   | API versions, framework features, pricing, security vulnerabilities | "Next.js 16 App Router API surface" |
| `medium-decay`  | 6-18 months  | Best practices, library comparisons, architecture patterns          | "React state management approaches" |
| `slow-decay`    | 18-36 months | Design principles, algorithms, protocols                            | "OAuth 2.0 flow design"             |
| `stable`        | 36+ months   | Fundamentals, mathematics, core CS concepts                         | "B-tree indexing characteristics"   |

**Decay formula:**

```
effective_confidence = original_confidence * e^(-0.693 * age_months / half_life_months)
```

When `effective_confidence` drops below a threshold (e.g., MEDIUM -> LOW after
one half-life), the system flags the finding as potentially stale and suggests
re-research.

**Domain assignment:** The research skill assigns `staleness_class` during
synthesis based on the topic domain. The synthesizer agent should encode this as
part of its output contract.

---

## 3. Cross-Session Research Continuity

### 3.1 Overlap Detection

When a new research query arrives, the system must determine whether prior
research exists that covers some or all of the query.

**Detection algorithm (executed during Phase 0: Decomposition):**

```
1. EXACT MATCH: Scan research-index.jsonl for entries where
   query similarity > 0.9 (normalized keyword overlap)

2. TOPIC MATCH: Scan for entries sharing 2+ topics with the new query

3. DOMAIN MATCH: Scan for entries in the same domain with overlapping
   key terms

4. MCP SEARCH: Query mcp__memory__search_nodes() with the research
   topic for any entities not yet in the JSONL index

5. CLASSIFY: For each match, determine:
   - Coverage: full | partial | tangential
   - Freshness: fresh | aging | stale (using staleness formula)
   - Confidence: HIGH | MEDIUM | LOW
```

**Practical implementation:** Since we cannot use vector embeddings (no vector
database), overlap detection uses a combination of:

- **Topic tag intersection:** Each research entry has `topics[]`. Matching 2+ of
  the same topics indicates overlap.
- **Keyword extraction from query:** Extract key noun phrases, match against
  `key_findings_summary` and `query` fields.
- **Domain matching:** Same `domain` field suggests the new query may build on
  prior work.

This is less precise than semantic similarity but requires zero additional
infrastructure. If overlap detection produces too many false negatives, a future
enhancement could add embedding-based matching via a local model.

### 3.2 "Build On" vs. "Start Fresh" Decision Logic

When overlap is detected, the system must decide how to proceed:

```
IF prior_research.coverage == "full" AND prior_research.freshness == "fresh":
  → REUSE: Present existing findings. Ask user if they want deeper research
    on specific aspects or if the existing findings are sufficient.

IF prior_research.coverage == "full" AND prior_research.freshness == "stale":
  → RE-RESEARCH with prior context: Use existing findings as a starting
    baseline. Research what has changed since the prior findings. Produce
    an updated synthesis that notes what changed.

IF prior_research.coverage == "partial":
  → BUILD ON: Identify which sub-queries are already covered (reuse those
    findings) and which are new (research those). Produce a combined
    synthesis that credits prior research for covered areas.

IF prior_research.coverage == "tangential":
  → REFERENCE: Note the related research in the new findings as "see also"
    but conduct full independent research.

IF no_overlap_detected:
  → FRESH START: Standard research workflow.
```

**User override:** The user can always force a fresh start by specifying
`/deep-research --fresh <topic>`. This is important when the user knows prior
findings were wrong or the landscape has fundamentally changed.

### 3.3 Incremental Research

When building on prior research, the system should:

1. **Load prior findings** into the synthesizer's context
2. **Mark prior findings with their age and original confidence**
3. **Research only the gaps and new sub-queries**
4. **During synthesis, explicitly note:**
   - Which findings are carried forward from prior research (with date)
   - Which findings are new
   - Which prior findings were contradicted by new research
   - Which prior findings were confirmed by new research
5. **Update the research index** with the new entry, linking to the prior entry
   via `related_research` and optionally setting `superseded_by` on the old
   entry

### 3.4 Version Control for Research

Research findings naturally version through git. Each update to a findings file
is a new commit. The research index tracks this through:

- **`superseded_by`**: When a full re-research replaces an older finding, the
  old entry points to the new one
- **`related_research`**: Bidirectional links between research entries on the
  same or related topics
- **Git history**: `git log -- <finding-path>` shows the evolution of any
  research file

No additional versioning mechanism is needed. Git provides diff, blame, and
history for free.

---

## 4. Learning from Research Quality

### 4.1 User Feedback Loop

The simplest and most reliable quality signal is user feedback. After presenting
research findings, the system should capture:

```
Rating: useful | partially_useful | missed_the_mark | wrong
Feedback: [optional free-text from user]
```

This rating is stored in the research index (`user_rating` field) and used to:

1. **Weight future overlap decisions** -- research rated "useful" gets higher
   reuse priority; "missed_the_mark" gets lower priority
2. **Identify patterns in research quality** -- if research in a specific domain
   consistently rates poorly, the search strategy for that domain needs revision
3. **Source reliability correlation** -- when research is rated "wrong," the
   sources used can be flagged for reduced confidence in future research

**Implementation:** After the user acknowledges the research output (Phase 4 of
the deep-research skill), offer the rating prompt. Store the response. This is a
single additional field in the JSONL index -- minimal overhead.

### 4.2 Source Reliability Scoring

Over time, the system can track which sources produce accurate findings and
which produce errors.

**Source reliability index** (`.claude/state/research-sources.jsonl`):

```jsonl
{
  "source_domain": "react.dev",
  "source_type": "official_docs",
  "times_cited": 15,
  "times_in_useful_research": 12,
  "times_in_wrong_research": 0,
  "reliability_score": 0.95,
  "last_cited": "2026-03-20T14:30:00Z",
  "notes": "Primary source for React API documentation"
}
```

**Scoring formula:**

```
reliability = (times_in_useful + 0.5 * times_in_partial) /
              (times_in_useful + times_in_partial + 2 * times_in_wrong + 1)
```

The `+1` in the denominator is a Laplace smoothing term to prevent new sources
from starting at 1.0. Sources start at ~0.5 (uncertain) and converge toward
their true reliability as data accumulates.

**How it is used:**

- During source hierarchy evaluation, sources with `reliability_score > 0.8` get
  a confidence boost
- Sources with `reliability_score < 0.3` trigger a warning in the verification
  step
- This data feeds into the confidence propagation rules from
  `SOURCE_VERIFICATION.md` (Section 2.2)

**Bootstrapping:** Initially, no source data exists. The system uses the default
source hierarchy from the GSD research agents (Context7 > Official Docs >
WebSearch) until enough data accumulates to produce meaningful reliability
scores. After ~20 research sessions with user ratings, the source reliability
index becomes statistically useful.

### 4.3 Search Strategy Learning

Different search strategies work better for different domains. The system should
track:

```jsonl
{
  "domain": "frontend-framework",
  "strategy": "context7-first-then-official-docs",
  "times_used": 8,
  "avg_confidence": "HIGH",
  "avg_user_rating": "useful",
  "notes": "Context7 resolves library versions accurately for React/Next.js"
}
```

```jsonl
{
  "domain": "academic-research",
  "strategy": "websearch-scholar-then-fetch-abstracts",
  "times_used": 3,
  "avg_confidence": "MEDIUM",
  "avg_user_rating": "partially_useful",
  "notes": "Scholar results are good but full-text access is limited"
}
```

Over time, the skill's Phase 0 (decomposition) can consult this data to select
the optimal search strategy for each sub-query's domain, rather than always
using the default strategy.

### 4.4 Post-Incident Learning

When research is later found to be wrong (user explicitly reports an error, or
subsequent research contradicts prior findings), the system should:

1. **Flag the original finding** with `user_rating: "wrong"` and a note
   explaining what was wrong
2. **Identify the failure mode:** Was it a source reliability issue? A
   verification failure? A staleness issue? A synthesis error?
3. **Update source reliability scores** for all sources cited in the wrong
   finding
4. **Log the lesson** to `.claude/state/research-learnings.jsonl`:

```jsonl
{
  "date": "2026-03-25",
  "research_id": "research-2026-03-20-react-server-components",
  "failure_mode": "stale_information",
  "lesson": "React 19.2 changed the server component rendering pipeline; findings from pre-19.2 sources were inaccurate",
  "prevention": "For React findings, check version-specific changelogs before reusing prior research"
}
```

This learnings log is consumed at session start (similar to how `/session-end`'s
learning loop works) to inform future research behavior.

---

## 5. Knowledge Index Architecture

### 5.1 Topic Index

The research index (`research-index.jsonl`) is the primary mechanism for
answering "what do we already know about X?" But scanning JSONL for every query
is linear. For fast lookup, maintain a lightweight topic-to-research mapping:

**Topic index file** (`.claude/state/research-topics.json`):

```json
{
  "react": [
    "research-2026-03-20-react-server-components",
    "research-2026-03-15-react-state-management"
  ],
  "firebase": ["research-2026-03-10-firebase-auth-patterns"],
  "server-components": ["research-2026-03-20-react-server-components"],
  "authentication": [
    "research-2026-03-10-firebase-auth-patterns",
    "research-2026-02-28-oauth-provider-comparison"
  ],
  "_meta": {
    "last_rebuilt": "2026-03-20T14:30:00Z",
    "total_entries": 5,
    "total_topics": 4
  }
}
```

**Maintenance:** Rebuilt automatically whenever a new research entry is added to
the index. This is a derived artifact (can be regenerated from the JSONL at any
time) so there is no data loss risk.

### 5.2 Enabling "What Do We Know About X?" Queries

When the user asks "what do we know about X?" (or equivalently, when the
deep-research skill needs to check prior knowledge), the lookup flow is:

```
1. Extract topic keywords from X
2. Look up keywords in research-topics.json → get research IDs
3. For each matching ID, read the index entry from research-index.jsonl
4. Calculate effective_confidence using staleness formula
5. Present results grouped by confidence:
   - FRESH & HIGH: "We researched this on [date]. Key findings: [summary]"
   - AGING & MEDIUM: "We researched this [N months ago]. Findings may need refresh."
   - STALE & LOW: "We researched this [N months ago]. Recommend re-research."
6. For each result, provide the path to the full findings file
```

This enables a `/research-recall <topic>` command that surfaces prior knowledge
without conducting new research.

### 5.3 Zettelkasten-Inspired Linking

The Zettelkasten method's core insight is that knowledge value comes from
_connections between notes_, not just the notes themselves. Applied to research
memory:

- **Each research finding is an atomic unit** (one topic, one synthesis)
- **Links between findings are explicit** via `related_research[]` in the index
- **Links are bidirectional** -- when research A links to research B, B should
  also link back to A
- **Link types matter:**
  - `builds_on`: New research that extends prior research
  - `contradicts`: New findings that conflict with prior findings
  - `related_to`: Topically related but independent research
  - `supersedes`: Complete replacement of prior findings

**Discovery through links:** When the user researches topic A and the system
finds it links to topic B, it can proactively surface: "Related prior research
on B found -- do you want to incorporate those findings?"

### 5.4 Knowledge Graph via MCP

The MCP memory server provides a complementary discovery mechanism. Research
entities are stored as:

```javascript
{
  name: "Research_React19_ServerComponents_2026-03-20",
  entityType: "research_knowledge",
  observations: [
    "Topic: React 19 server components",
    "Confidence: HIGH",
    "Key finding: RSC eliminates client-server waterfalls",
    "Key finding: Use 'use client' boundary strategically",
    "Gaps: Performance benchmarks for large component trees",
    "Finding path: .planning/react-migration/research/SERVER_COMPONENTS.md"
  ]
}
```

Relations:

```javascript
{
  from: "Research_React19_ServerComponents_2026-03-20",
  relationType: "builds_on",
  to: "Research_NextJS_AppRouter_2026-03-15"
}
```

MCP entities are searchable via
`mcp__memory__search_nodes("React server components")` and provide a graph that
can be traversed to discover related research that the keyword-based topic index
might miss.

---

## 6. Industry Approaches

### 6.1 NotebookLM (Google)

NotebookLM confines memory to individual notebooks. Each notebook is an isolated
container storing user-uploaded sources and AI-generated analysis. Memory does
not cross notebook boundaries.

**Relevant to our design:**

- **Isolation model** -- each notebook is self-contained, analogous to our
  per-initiative research directories
- **Source-grounded** -- all analysis is grounded in uploaded sources, never in
  model parametric memory
- **Context window** -- uses a 1M token context window, allowing large document
  collections without external retrieval
- **Limitation:** No cross-notebook knowledge. Cannot answer "what have I
  researched across all my notebooks?" Our system specifically needs this
  cross-cutting capability.

### 6.2 Mem0 (Memory-as-a-Service)

Mem0 provides a dedicated memory layer that extracts memories from interactions,
stores them via vector similarity, and retrieves them for future use. It is
framework-agnostic (works with LangChain, CrewAI, AutoGen, custom loops).

**Relevant to our design:**

- **Automatic extraction** -- memories are extracted from conversations without
  explicit save commands
- **Graph-based variants** -- enhanced Mem0 uses knowledge graphs to capture
  relational structures
- **API-based** -- clean boundary between memory service and agent framework
- **Limitation:** Cloud-first, API-based model with memories stored on Mem0's
  servers. Does not align with our file-based, git-tracked, privacy-first
  approach.

### 6.3 Letta (MemGPT)

Letta treats memory as a first-class component of agent state with an
LLM-as-an-Operating-System paradigm. Three memory tiers:

| Tier            | Analogy      | Purpose                                                    | Access             |
| --------------- | ------------ | ---------------------------------------------------------- | ------------------ |
| Core Memory     | RAM          | Small block in context window, agent reads/writes directly | Always in context  |
| Recall Memory   | Disk cache   | Searchable conversation history outside context            | Query-based        |
| Archival Memory | Cold storage | Long-term storage queried via tool calls                   | Explicit retrieval |

**Relevant to our design:**

- **Tiered architecture** -- our three-tier design (JSONL index, Markdown
  findings, MCP entities) mirrors this pattern
- **Agent-controlled memory** -- the agent decides what to store and when to
  update, rather than automatic extraction
- **Self-editing** -- the agent uses reasoning to curate memory, not just append
- **Limitation:** Full runtime lock-in. Letta agents run inside the Letta
  platform. We need memory that works within the existing Claude Code + MCP
  architecture.

### 6.4 Cognee (Knowledge Engine)

Cognee is an open-source graph-vector hybrid that runs a six-stage pipeline:
classify, check permissions, chunk, extract entities/relationships, summarize,
then embed into vector store and commit edges to graph.

**Relevant to our design:**

- **Self-improving memory** -- prunes stale nodes, strengthens frequent
  connections, reweights edges based on usage signals
- **Interaction traces** -- captures which parts of the knowledge graph the
  agent actually used during a session
- **Graph + vector hybrid** -- vectorizes entries for semantic retrieval while
  maintaining relational structure
- **Most applicable pattern:** Cognee's approach to evolving memory based on
  usage signals is directly applicable to our source reliability scoring and
  search strategy learning.

### 6.5 RAG Evolution (2025-2026)

RAG is evolving from static retrieval to dynamic knowledge runtime:

- **GraphRAG** organizes content into knowledge graphs for richer context
- **LiveVectorLake** provides real-time versioned knowledge with temporal
  retrieval and ACID transactions
- **Enterprise RAG** is trending toward treating RAG as "knowledge runtime" --
  an orchestration layer managing retrieval, verification, reasoning, and audit
- **Key insight:** The distinction between RAG (retrieve from a corpus) and
  agent memory (learn from interactions) is collapsing. Modern systems combine
  both.

### 6.6 Memory Benchmarking Results

Letta's benchmarking research found that for certain memory tasks, a filesystem
approach (reading/writing structured files) performs comparably to specialized
memory frameworks. This validates our file-based approach: markdown findings +
JSONL index can achieve effective memory without introducing vector databases or
external services.

---

## 7. Privacy and Scope

### 7.1 Project-Scoped vs. Global Research Memory

**Recommendation: Project-scoped by default, with explicit opt-in for global.**

| Scope          | What It Means                                                                         | When to Use                                                      |
| -------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Project-scoped | Research index and findings live in the project repo (`.planning/`, `.claude/state/`) | Default. Most research is project-relevant.                      |
| Global         | Research entities in MCP memory, accessible across projects                           | When research applies broadly (e.g., "OAuth 2.0 best practices") |

**Rationale:**

- The SoNash codebase already uses project-scoped memory (auto-memory is per
  project hash, `.planning/` is per repo)
- Research about "React 19 server components" is relevant to SoNash but not to
  an unrelated project
- Global knowledge (fundamental patterns, general technology assessments) can be
  stored in MCP memory entities which persist at the user level

**Implementation:**

- Tier 1 (JSONL index) and Tier 2 (Markdown findings): always project-scoped
- Tier 3 (MCP entities): project-scoped by default, but the user can tag
  entities as `scope: global` to make them available across projects

### 7.2 Privacy Considerations

Research memory can contain sensitive information:

| Risk                                     | Mitigation                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Proprietary research about competitors   | Project-scoped by default; never leaks to other projects                |
| Confidential business strategy research  | Findings files in `.planning/` can be gitignored if needed              |
| Personal health/medical research         | User must explicitly opt in to persisting sensitive topics              |
| Source URLs revealing research interests | JSONL files are local; MCP memory is local (server-memory runs locally) |

**GDPR / Right to Forget:**

- All research memory is stored in local files and local MCP memory
- No cloud services, no external APIs for memory storage
- User can delete any research entry by removing the JSONL line and the findings
  file
- A `/research-forget <topic>` command should be provided to cleanly remove all
  traces of a research topic from the index, findings, MCP entities, and source
  reliability data

**Explicit consent model:**

- Research findings are persisted only when the deep-research skill runs (not
  from casual conversation)
- User acknowledges the persistence at skill completion: "Research findings
  saved to .planning/... Index updated."
- No implicit memory collection from non-research conversations

### 7.3 User Control Interface

Users should have clear control over research memory:

| Command                          | Action                                                     |
| -------------------------------- | ---------------------------------------------------------- |
| `/research-recall <topic>`       | Show what we know about a topic                            |
| `/research-forget <topic>`       | Delete all research memory for a topic                     |
| `/research-index`                | Show full research index with staleness status             |
| `/research-refresh <topic>`      | Re-research a topic, keeping prior findings for comparison |
| `/deep-research --fresh <topic>` | Research from scratch, ignoring prior findings             |
| `/deep-research --build-on <id>` | Explicitly build on a specific prior research entry        |

---

## 8. Design Recommendations

### R1: Three-Tier Research Memory (Priority: P0)

Implement the three-tier storage architecture:

1. **JSONL research index** (`.claude/state/research-index.jsonl`) -- the source
   of truth for what has been researched, with topic tags, confidence, staleness
   class, and links
2. **Markdown findings** (`.planning/<initiative>/research/`) -- the actual
   research content, following the existing convention
3. **MCP research entities** -- lightweight discovery layer for cross-session
   lookup

**Integration point:** The deep-research synthesizer agent writes the findings
(Tier 2), then the orchestrating skill updates the index (Tier 1) and creates
MCP entities (Tier 3).

### R2: Overlap Detection in Phase 0 (Priority: P0)

Before spawning researcher agents, the skill's decomposition phase must:

1. Scan the research index for overlapping topics
2. Present prior findings to the user with freshness assessment
3. Ask: "Build on prior research, start fresh, or proceed as-is?"
4. If building on, load prior findings into researcher agent context

**Cost justification:** A typical research session involves 4-8 WebSearch calls,
2-4 WebFetch calls, and 15-30 minutes of agent compute. Reusing prior research
when it is still fresh saves all of that.

### R3: Staleness Management (Priority: P1)

Implement domain-based staleness classification with the half-life decay
formula. Each research finding gets a `staleness_class` and `half_life_months`
value. The topic index lookup calculates effective confidence on the fly.

**Key behavior:** When a user invokes `/deep-research` on a topic with stale
prior research, the system should say: "Prior research on this topic is N months
old (staleness class: fast-decay). Effective confidence has decayed from HIGH to
LOW. Recommend re-research. Proceed?" rather than silently reusing stale data.

### R4: User Feedback Capture (Priority: P1)

After presenting research, capture a rating. This is the foundation for all
learning features (source reliability, strategy learning, quality improvement).
Without user feedback, the system cannot learn.

**Minimum viable implementation:** A single prompt after Phase 4 presentation:
"Rate this research: useful / partially useful / missed the mark / wrong"

### R5: Source Reliability Tracking (Priority: P2)

Build the source reliability index from user feedback data. Requires ~20
research sessions with ratings before the data is statistically meaningful.
Start collecting data in P1 (feedback capture); use it in P2.

### R6: Search Strategy Learning (Priority: P2)

Track which search strategies (Context7-first, WebSearch-first, academic-focus,
etc.) produce the best results for each domain. Requires domain classification
from R3 and feedback data from R4.

### R7: Research Recall Command (Priority: P1)

Implement `/research-recall <topic>` as a lightweight skill that scans the index
and presents prior findings with staleness assessment. This is the most
immediately useful feature for users who want to know "what do we already know?"

### R8: Research Forget Command (Priority: P2)

Implement `/research-forget <topic>` for privacy control. Must cleanly remove:
index entries, finding files, MCP entities, source reliability data referencing
the topic, and any strategy learning data specific to that topic.

### R9: Session-End Integration (Priority: P1)

Add a step to the `/session-end` pipeline that checks for research artifacts
produced during the session and ensures they are indexed. This prevents research
from being conducted but not persisted to the index.

**Proposed session-end addition (after Step 7e):**

```
Step 7h. Research Index Sync (SHOULD — if research was conducted)
  Scan .planning/*/research/ for findings files not in research-index.jsonl
  If found: generate index entries and append to research-index.jsonl
  Format: "Research indexed: N new findings added to research-index.jsonl"
  If none found: Skip silently.
```

### R10: Integration with Existing Research Agents (Priority: P2)

The deep-research skill's searcher and synthesizer agents should be aware of the
research memory layer:

- **Searcher agent:** Receives prior findings (if building on) as part of its
  input context. Uses source reliability data to weight sources.
- **Synthesizer agent:** Receives prior findings, explicitly notes what is new
  vs. carried forward, and outputs the research index metadata alongside the
  synthesis.

---

## Implementation Roadmap

| Phase   | Components                                                    | Depends On                    | Effort |
| ------- | ------------------------------------------------------------- | ----------------------------- | ------ |
| Phase 1 | JSONL index schema, overlap detection, basic recall           | Deep-research skill SKILL.md  | S      |
| Phase 2 | Staleness management, user feedback capture, session-end sync | Phase 1                       | S      |
| Phase 3 | MCP entity creation, cross-session discovery                  | Phase 1 + MCP memory server   | M      |
| Phase 4 | Source reliability tracking, search strategy learning         | Phase 2 (needs feedback data) | M      |
| Phase 5 | Research-forget, research-index commands, privacy controls    | Phase 1                       | S      |

**Total estimated effort:** M-L (spread across the deep-research skill
development lifecycle)

**Dependencies:** This design assumes the deep-research skill (SKILL.md +
searcher agent + synthesizer agent from CUSTOM_AGENT_DESIGN.md) is built first.
The memory layer wraps around the skill, not the other way around.

---

## Sources

### AI Agent Memory Frameworks

- [The 6 Best AI Agent Memory Frameworks (2026)](https://machinelearningmastery.com/the-6-best-ai-agent-memory-frameworks-you-should-try-in-2026/)
- [AI-Native Memory and Context-Aware Agents](https://ajithp.com/2025/06/30/ai-native-memory-persistent-agents-second-me/)
- [Memory Consistency in AI Agents (2025)](https://sparkco.ai/blog/mastering-memory-consistency-in-ai-agents-2025-insights)
- [Context-Aware Memory Systems (Tribe AI)](https://www.tribe.ai/applied-ai/beyond-the-bubble-how-context-aware-memory-systems-are-changing-the-game-in-2025)
- [Memory in the Age of AI Agents (arxiv 2512.13564)](https://arxiv.org/abs/2512.13564)
- [Top 10 AI Memory Products 2026](https://medium.com/@bumurzaqov2/top-10-ai-memory-products-2026-09d7900b5ab1)

### MCP Memory Servers

- [Memory MCP Server (mcpgee.com)](https://www.mcpgee.com/servers/memory)
- [Knowledge Graph Memory MCP Server (Anthropic)](https://www.pulsemcp.com/servers/modelcontextprotocol-knowledge-graph-memory)
- [Knowledge & Memory MCP Servers (Glama)](https://glama.ai/mcp/servers/categories/knowledge-and-memory)
- [Memories with Lessons MCP Server](https://skywork.ai/skypage/en/memories-lessons-ai-memory-learning/1978313950823313408)
- [AI Agents and Memory: Privacy in the MCP Era](https://www.newamerica.org/oti/briefs/ai-agents-and-memory/)

### Mem0 and Letta Comparisons

- [Mem0 vs Letta: AI Agent Memory Compared (2026)](https://vectorize.io/articles/mem0-vs-letta)
- [5 AI Agent Memory Systems Compared (2026 Benchmark)](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3)
- [Benchmarking AI Agent Memory (Letta)](https://www.letta.com/blog/benchmarking-ai-agent-memory)
- [Mem0: Production-Ready Scalable Long-Term Memory (arxiv)](https://arxiv.org/abs/2504.19413)
- [Stateful AI Agents: Letta Memory Models](https://medium.com/@piyush.jhamb4u/stateful-ai-agents-a-deep-dive-into-letta-memgpt-memory-models-a2ffc01a7ea1)

### Cognee and Knowledge Graphs

- [Cognee: Knowledge Engine for AI Agent Memory](https://github.com/topoteretes/cognee)
- [How Cognee Builds AI Memory for Agents](https://www.cognee.ai/blog/fundamentals/how-cognee-builds-ai-memory)
- [From RAG to Graphs: Cognee Self-Improving AI Memory](https://memgraph.com/blog/from-rag-to-graphs-cognee-ai-memory)

### RAG and Knowledge Base Evolution

- [From RAG to Context: 2025 Year-End Review](https://ragflow.io/blog/rag-review-2025-from-rag-to-context)
- [Next Frontier of RAG: Enterprise Knowledge Systems 2026-2030](https://nstarxinc.com/blog/the-next-frontier-of-rag-how-enterprise-knowledge-systems-will-evolve-2026-2030/)
- [LiveVectorLake: Versioned Knowledge Base Architecture](https://www.researchgate.net/publication/399666409_LiveVectorLake_A_Real-Time_Versioned_Knowledge_Base_Architecture_for_Streaming_Vector_Updates_and_Temporal_Retrieval)

### Knowledge Staleness and Decay

- [Half-Life of Knowledge Framework (Uplatz)](https://uplatz.com/blog/the-half-life-of-knowledge-a-framework-for-measuring-obsolescence-and-architecting-temporally-aware-information-systems/)
- [Half Life: The Decay of Knowledge (Farnam Street)](https://fs.blog/half-life/)
- [HALO: Half Life-Based Outdated Fact Filtering](https://arxiv.org/html/2505.07509)
- [Half-life of Knowledge (Wikipedia)](https://en.wikipedia.org/wiki/Half-life_of_knowledge)

### NotebookLM

- [NotebookLM Memory Capabilities](https://medium.com/@kombib/5-notebooklm-hacks-new-memory-capabilities-74c1222d129e)
- [NotebookLM Evolution 2023-2026](https://medium.com/@jimmisound/the-cognitive-engine-a-comprehensive-analysis-of-notebooklms-evolution-2023-2026-90b7a7c2df36)
- [Google NotebookLM](https://notebooklm.google/)

### PKM and Zettelkasten

- [Build a PKM System with AI (2025)](https://buildin.ai/blog/personal-knowledge-management-system-with-ai)
- [Tana: PKM on a Knowledge Graph](https://outliner.tana.inc/pkm)
- [Obsidian vs Logseq vs Notion: PKM Compared (2026)](https://dasroot.net/posts/2026/03/obsidian-logseq-notion-pkm-systems-compared-2026/)

### Privacy and Memory Governance

- [Memory Governance for AI Security (Acuvity)](https://acuvity.ai/what-is-memory-governance-why-important-for-ai-security/)
- [GDPR Blind Spot: AI Models That Remember](https://medium.com/@aiunlearning/the-gdpr-blind-spot-no-one-talks-about-ai-models-that-remember-fc52e4c6b91a)
- [Right to Delete vs AI Memory (CCPA/GDPR)](https://www.gdpr-ccpa.org/ai-related-index/the-right-to-delete-vs-ai-memory-a-ccpa-conundrum)
- [AI and Privacy (DigitalOcean)](https://www.digitalocean.com/resources/articles/ai-and-privacy)

### Vector Databases

- [Vector Database Comparison 2025 (LiquidMetal)](https://liquidmetal.ai/casesAndBlogs/vector-comparison/)
- [Best Vector Databases for RAG (2025)](https://latenode.com/blog/ai-frameworks-technical-infrastructure/vector-databases-embeddings/best-vector-databases-for-rag-complete-2025-comparison-guide)

### AI Agent Evaluation and Feedback

- [Towards a Science of AI Agent Reliability (arxiv)](https://arxiv.org/abs/2602.16666)
- [Evaluating AI Agents: Lessons from Amazon](https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/)
- [Agent Memory: Why Your AI Has Amnesia (Oracle)](https://blogs.oracle.com/developers/agent-memory-why-your-ai-has-amnesia-and-how-to-fix-it)

### Semantic Deduplication

- [SemHash: Semantic Deduplication](https://github.com/MinishLab/semhash)
- [Semantic Deduplication (SemDedup)](https://www.emergentmind.com/topics/semantic-deduplication-semdedup)
