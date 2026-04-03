# Findings: Solo Developer Feasibility and Maintenance Cost Analysis

**Searcher:** deep-research-synthesizer **Profile:** web+codebase **Date:**
2026-03-31 **Sub-Question IDs:** SQ10 (agent 2 of 2) **Sources:** All 16 prior
findings files (D1 through D7b), plus codebase inventory

---

## User Profile Summary (for this analysis)

- Solo director-level operator, non-developer, uses Claude as primary
  development partner
- 250+ sessions of accumulated workflow; session counter at ~250
- Windows 11, two locales (jbell work, Owner home); no admin access at work
  locale
- Portable installs only: npx, fnm, uv, portable binaries — no Docker, no WSL
- 14 existing persistence mechanisms already active
- 25 hook scripts covering every lifecycle event
- 60+ skills, 27 agents — mature orchestration harness
- Cross-locale sync is an open problem; git is the primary sync channel today
- The project is a Next.js/Firebase app, not a pure tooling project

---

## Part 1: Current Maintenance Load Assessment

### 1A. The 14 Mechanisms — Maintenance Profile

Below is every persistence mechanism from D1, assessed for maintenance burden.

| #   | Mechanism                                                             | Maintenance Type          | Burden                        | Notes                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------- | ------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CLAUDE.md`                                                           | Manual, human-authored    | Low-Medium                    | Version 5.8 — updated rarely (6 times in 6 weeks shown in history). High value per token. Target: ~135 lines.                                                                                                                                                                                                               |
| 2   | Auto Memory (`MEMORY.md` + 39 files)                                  | Semi-auto, Claude-written | Low                           | Claude writes during sessions. Human must occasionally review and curate. The live copy grows without pruning — memory entropy accumulates.                                                                                                                                                                                 |
| 3   | `mcp__memory` knowledge graph                                         | Manual, Claude-invoked    | Very Low (nearly zero)        | Configured but rarely used. No hook to trigger writes. Low active usage confirmed in D1.                                                                                                                                                                                                                                    |
| 4   | Episodic memory plugin                                                | Passive auto              | Zero                          | Indexes existing session `.jsonl` files. No writes required. Only `search` permission granted.                                                                                                                                                                                                                              |
| 5   | State files (`.claude/state/`, 82 files)                              | Auto via hooks            | Zero for core                 | Hooks write automatically. Human touches these only for debt, planning, and review workflows. The `.gitignore` rules require correct categorization — this has a small maintenance surface (5 misclassified files found).                                                                                                   |
| 6   | `SESSION_CONTEXT.md`                                                  | Semi-auto, Claude-updated | Medium                        | Must be updated at every session-end. 300-line cap requires periodic archiving to `SESSION_HISTORY.md`. Depends on `/session-end` skill running reliably. If skipped (tired, rushed), the next session loses full context.                                                                                                  |
| 7   | `SESSION_HISTORY.md`                                                  | Auto via `/session-end`   | Zero                          | Append-only archive. No maintenance once `/session-end` runs.                                                                                                                                                                                                                                                               |
| 8   | `SESSION_DECISIONS.md`                                                | Hook + manual             | Low                           | `decision-save-prompt.js` fires on `AskUserQuestion` events. Depends on user following through when prompted.                                                                                                                                                                                                               |
| 9   | TDMS / `MASTER_DEBT.jsonl`                                            | Auto + periodic manual    | Medium-High                   | 8,479 lines. Four intake paths, known overwrite hazard. Consolidation runs every session-end. SonarCloud sync requires separate workflow. Multiple S0/S1 items requiring human decision. This is the highest-maintenance mechanism by volume.                                                                               |
| 10  | Learning system (`reviews.jsonl`, `AI_REVIEW_LEARNINGS_LOG.md`, etc.) | Auto + periodic           | Medium                        | Consolidation triggers every 10 PR reviews. Pattern promotion pipeline (`promote-patterns.js` → `route-enforcement-gaps.js` → `suggest-pattern-automation.js` → `pending-refinements.jsonl`) produces items needing human judgment. 4 failing patterns identified. Requires periodic review of `pending-refinements.jsonl`. |
| 11  | GSD planning artifacts (`.planning/`, `decisions.jsonl`)              | Auto + active             | Medium                        | 5 active plans. New decisions written per planning session. Periodic `/skill-audit` and `/pr-retro` produce new planning artifacts. The SWS plan has 93 decisions — reviewing these has a cost.                                                                                                                             |
| 12  | Hook state dot-files (`.session-state.json`, etc.)                    | Auto                      | Zero                          | Written and consumed by hooks. No human interaction needed.                                                                                                                                                                                                                                                                 |
| 13  | `canonical-memory/` (git-tracked baseline)                            | Manual, periodic          | Low — but currently abandoned | 20 files. Last update was ~Session 220s. Has diverged: missing 7 feedback entries, outdated expertise description. The intent was good but the maintenance discipline was abandoned.                                                                                                                                        |
| 14  | `agent-invocations.jsonl` + ecosystem audit files                     | Auto via hooks/audits     | Zero                          | Append-only. Read by `/alerts` and `/pr-retro`. No human input required.                                                                                                                                                                                                                                                    |

### 1B. Zero-Maintenance Mechanisms (fire and forget)

These require no human action after initial setup:

1. **Episodic memory plugin** — passively indexes session JSONL files
2. **Hook state dot-files** — written and expired automatically
3. **`SESSION_HISTORY.md`** — auto-appended by `/session-end`
4. **`agent-invocations.jsonl`** + ecosystem audit files — auto-appended by
   hooks
5. **State JSONL files** (commit-log, hook-warnings, etc.) — auto via hooks;
   rotation built-in
6. **`mcp__memory` knowledge graph** — technically zero-maintenance because it
   is barely used

**Total zero-maintenance: 6 of 14** (43%)

### 1C. Low/Periodic Attention Mechanisms

These mostly self-manage but require human attention at bounded intervals:

7. **`CLAUDE.md`** — update maybe once per 1-2 weeks when new guardrails or
   patterns are established
8. **Auto Memory** — periodic review and pruning recommended (but not happening)
   — without AutoDream, entropy accumulates silently
9. **`SESSION_DECISIONS.md`** — depends on following up when
   `decision-save-prompt.js` fires

**Total periodic: 3 of 14** (21%)

### 1D. Mechanisms Requiring Regular Active Maintenance

These require non-trivial effort per session or per cycle:

10. **`SESSION_CONTEXT.md`** — must run `/session-end` at every session to stay
    current
11. **Learning system** — `pending-refinements.jsonl` accumulates items; 4
    failing patterns unresolved
12. **GSD planning artifacts** — 5 active plans generating decisions and
    directives
13. **TDMS** — S0/S1 debt items require human resolution; overwrite hazard
    requires caution

**Total active: 4 of 14** (29%)

### 1E. Broken or Diverged Mechanisms

These are mechanisms that exist but have drifted from their intended function:

- **`canonical-memory/`** — abandoned as active sync target; now 7 entries
  behind live memory, with incorrect expertise description. It exists but
  provides false confidence of cross-locale sync coverage.
- **`STATE_SCHEMA.md`** — documents 10 state files; actual count is 82. Fully
  stale. Provides no accurate orientation for new sessions.
- **`mcp__memory` knowledge graph** — configured and permitted but rarely used.
  No hook to trigger writes. Low active usage means the graph is sparse relative
  to what has been learned in 250 sessions.
- **`agent-token-usage.jsonl`** — exists (1 line) but effectively empty. Token
  tracking was built but never operationalized.

**Total broken/diverged: 4 of 14** (29%)

### 1F. Overall Maintenance Load Verdict

**Verdict: The current system is at or near maximum sustainable maintenance
capacity for one non-developer operator.** [CONFIDENCE: HIGH]

The evidence:

- 4 mechanisms have already drifted and been abandoned (canonical-memory,
  STATE_SCHEMA.md, mcp\_\_memory active use, token tracking)
- The TDMS at 8,479 lines is not a system a non-developer can meaningfully
  navigate without tooling assistance
- Learning system has 4 failing patterns and accumulating
  `pending-refinements.jsonl` items that nobody is resolving
- Session-end discipline is the load-bearing ritual: if `/session-end` gets
  skipped, SESSION_CONTEXT.md, TDMS consolidation, and learning system updates
  all miss
- Cross-locale sync is unresolved after 250 sessions — not for lack of
  opportunity, but because the lift of maintaining another mechanism was too
  high

The base rate of abandoned mechanisms (4 of 14 = 29%) is a signal: anything new
added to this system has roughly a 30% chance of being abandoned within 20
sessions unless it is genuinely zero-maintenance.

---

## Part 2: Enhancement Tiers

### TIER 1 — "Free Wins" (near-zero new maintenance)

These leverage existing infrastructure with config changes or minor hook
modifications. Each is reversible with minimal effort. Estimated effort: hours,
not days.

---

#### T1-A: Fix `canonical-memory` divergence via `autoMemoryDirectory` [CONFIDENCE: HIGH]

**What:** Set `autoMemoryDirectory` in `settings.local.json` at both locales to
point at `.claude/canonical-memory/` in the git repo. This makes Claude's live
auto-memory writes go directly to the git-tracked directory. Normal
`git commit + push + pull` becomes the sync mechanism.

**Why it's free:** `autoMemoryDirectory` was shipped in Claude Code v2.1.74
(March 12, 2026) for exactly this purpose. No new scripts, no MCP servers, no
external services. The git workflow already runs every session. The
`canonical-memory/` directory already exists with 20 files.

**What to do first:** Reconcile the live
`~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/` with
`.claude/canonical-memory/` before redirecting. The live copy has 39 files vs 20
in canonical; 7 missing feedback entries; wrong expertise description. Merge
takes one session.

**Configuration:**

```json
// At each locale in ~/.claude/settings.local.json:
{
  "autoMemoryDirectory": "C:\\Users\\<user>\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

**Ongoing maintenance:** Zero. Once set, Claude writes here automatically. Git
commits carry it to the other locale.

**Risk:** Low. The only risk is a merge conflict if both locales write in the
same day (very rare for a solo operator). Plain markdown — git handles
line-level merges cleanly.

**Cross-locale benefit:** Immediately solves the cross-locale memory sync
problem that has been open for 250 sessions without any new infrastructure.

**Evidence base:** D3b-2a (official `autoMemoryDirectory` docs), D7a Finding #10
(identified as highest-signal pattern), D7b Finding #2 (mechanism confirmed).

---

#### T1-B: Activate `dream-skill` community plugin for Auto Memory consolidation [CONFIDENCE: MEDIUM]

**What:** Install the `grandamenium/dream-skill` community plugin. This
replicates Anthropic's unreleased AutoDream feature: a 4-phase consolidation of
MEMORY.md that merges duplicates, converts relative dates to absolute, deletes
contradicted facts, and keeps the index under 200 lines.

**Why it's free:** The dream-skill installs via the plugin marketplace (one
command). It is a skill definition — no new MCP server, no background daemon, no
database. It fires when you run the consolidation command. Anthropic's own
AutoDream (feature-flagged as `tengu_onyx_plover`) will eventually ship and
supersede it.

**What it solves:** Auto Memory accumulates without pruning. Over 250 sessions,
MEMORY.md becomes stale, redundant, and bloated. Without pruning, the
200-line/25KB cap becomes a constraint, not a feature. The dream-skill runs a
consolidation pass and restores signal density.

**Estimated frequency:** Run it once per month or whenever MEMORY.md starts
feeling noisy. This is a human judgment call — not automated.

**Risk:** Low. The skill operates only on memory files you control. Worst case:
it over-prunes something useful, which you restore from git history.

**Ongoing maintenance:** Near-zero. Run it periodically. When Anthropic ships
AutoDream natively, uninstall this plugin and the feature becomes
zero-maintenance.

**Evidence base:** D3c Finding 9 (dream-skill exists, works now), D3b-2a Finding
4 (AutoDream server-gated, 4-phase cycle documented), D6b Pattern CP-5
(auto-consolidation pattern).

---

#### T1-C: Add `episodic_memory_show` to MCP permissions [CONFIDENCE: HIGH]

**What:** The episodic memory plugin is already installed and permitted for
`episodic-memory__search`. The `episodic_memory_show` tool (retrieve full
conversation text by ID) is NOT permitted. Adding it to the allowlist unlocks
full conversation retrieval — "show me the full session where we solved the auth
bug."

**Why it's free:** One line change in `.claude/settings.json` permissions. No
new dependencies, no new infrastructure.

**What it unlocks:** Currently Claude can search past sessions but cannot
retrieve the full text of a match. This means it can find a session relevant to
the current task but cannot actually read what was decided or done. Unlocking
`show` completes the retrieval path.

**Configuration:**

```json
// In .claude/settings.json allow list, add:
"mcp__plugin_episodic-memory_episodic-memory__show"
```

**Ongoing maintenance:** Zero. The plugin handles its own data.

**Risk:** Marginal. Full conversation retrieval could surface more context than
needed, marginally increasing token usage when the tool is called. The tool is
called on-demand by Claude, not injected at session start.

**Evidence base:** D5a Finding 1 (current permissions scope documented), D5a
Serendipity ("episodic-memory tool permission is scoped: only search, not
show").

---

#### T1-D: Fix `STATE_SCHEMA.md` stale documentation [CONFIDENCE: HIGH]

**What:** Update `STATE_SCHEMA.md` to reflect the actual 82-file state directory
(currently documents 10 files). This is not a memory enhancement — it is fixing
a broken navigational aid. A stale schema causes wasted sessions when Claude
tries to orient itself from bad documentation.

**Why it's free:** A documentation update. No scripts, no hooks, no MCP. One
bounded session to re-survey the state directory and update the schema.

**What it solves:** D1 Contradiction: "STATE_SCHEMA.md vs. actual files — schema
doc is stale." Claude reading STATE_SCHEMA.md gets wrong information about what
state is available. This creates subtle navigation errors.

**Ongoing maintenance:** Low. STATE_SCHEMA.md needs updating only when the state
directory structure changes meaningfully, which happens infrequently.

**Evidence base:** D1 Contradictions section, D1 Finding 3 (82 files vs 10
documented).

---

#### T1-E: Enable `MEMORY_FILE_PATH` for `mcp__memory` and establish write pattern [CONFIDENCE: MEDIUM]

**What:** Configure `MEMORY_FILE_PATH` env var in `.mcp.json` to point the
knowledge graph to a committed location (e.g., `.claude/memory-graph.jsonl`).
Add a hook or skill that invokes `mcp__memory__create_entities` for
architectural decisions and cross-project patterns — content that Auto Memory
doesn't capture well because it's graph-relational (A depends on B, A was
replaced by C).

**Why it's free:** The MCP server is already running. Setting a file path and
adding a minimal skill trigger is hours of work. The knowledge graph MCP is the
right tool for relational facts ("the Firebase MCP uses httpsCallable for
security reason X" — where the relation between the two systems matters).

**What it solves:** The `mcp__memory` server is configured but barely used (D1
Finding 2: "Active use: Low"). The graph is sparse. Its unique value — storing
entity relationships — is not duplicated by Auto Memory. Giving it a defined
write pattern turns it from a dormant capability into active infrastructure.

**Scope constraint:** Keep the knowledge graph narrow. Only use it for: (a)
cross-project architectural decisions, (b) technology relationships (version
dependencies, Firebase/Next.js compatibility constraints), (c) recurring error →
solution patterns. Do NOT use it to replicate what Auto Memory already captures
(session learnings, behavioral corrections).

**Ongoing maintenance:** Low. Entity writes happen on explicit decisions, not
every session.

**Risk:** Low. The file is JSONL (git-tracked). If it grows stale, it can be
reset. The tool only writes when explicitly invoked.

**Evidence base:** D5a Finding 1 (mcp\_\_memory architecture), D5b Finding 3
(three-role model: CLAUDE.md = "how to work here", Auto Memory = "what I've
learned", MCP Memory = "what we know").

---

### TIER 2 — "Worth the Investment" (moderate new maintenance)

These require building one or two new scripts/hooks but use existing patterns.
Each has clear, sustained ROI for continued 250+ sessions. Estimated effort: 1-3
sessions each.

---

#### T2-A: `autoMemoryDirectory` + session-end memory commit hook [CONFIDENCE: HIGH]

**What:** Extend T1-A by adding a PostToolUse or session-end hook that
automatically stages and commits `.claude/canonical-memory/` changes when they
exist. Currently, git commits happen manually or via session-end. Memory writes
to the canonical-memory directory would need to be included in commits for the
sync to work.

**Why it's worth the investment:** Without automatic inclusion, the memory
improvements from T1-A only propagate when the user remembers to commit the
canonical-memory directory alongside code changes. A hook that auto-stages
memory changes when a session ends makes the sync truly zero-friction.

**Implementation pattern:** Extend `session-start.js` to stage canonical-memory
changes at session start (ensures the other locale's changes are visible) and
extend `/session-end` to include canonical-memory in the commit. This is 20-30
lines of Node.js following the existing hook pattern.

**Existing pattern to copy:** `commit-tracker.js` and the session-end pipeline
are already well-structured. This is additive to existing patterns, not a new
architecture.

**Ongoing maintenance:** Near-zero once built. The hook runs on every
session-end. The only maintenance risk is if the canonical-memory path changes.

**Evidence base:** D7a Finding 10, D6b Pattern CP-1 (hook-based capture
guaranteed), D1 Finding 6 (25 hooks already running — adding one more is low
friction).

---

#### T2-B: Structured memory consolidation at session-end (poor-man's AutoDream) [CONFIDENCE: MEDIUM]

**What:** Add a step to the `/session-end` skill pipeline that runs a structured
consolidation pass on MEMORY.md. Not a full AutoDream (which requires
server-side features), but a simpler version: count entries, flag duplicates by
keyword similarity (Jaccard 60% threshold — already used in
yuvalsuede/memory-mcp), archive entries older than N sessions without access,
and output a summary of what was merged or archived.

**Why it's worth the investment:** The memory entropy problem (D6b Pattern CP-5)
is confirmed to be real. Without consolidation, MEMORY.md becomes a growing
append-only log. At 250 sessions, the live MEMORY.md likely has near-duplicate
entries from different sessions where the same lesson was re-learned. The
pruning makes remaining entries more salient (academic finding from A-MAC:
"content type prior is the strongest admission signal").

**Implementation pattern:** A lightweight Node.js script
`scripts/consolidate-memory.js` following the same pattern as
`run-consolidation.js` (which already does this for the learning system). The
Jaccard deduplication approach is documented in the yuvalsuede/memory-mcp
codebase and is ~30-50 lines to implement.

**What it does NOT do:** This is not semantic search. It is simple
keyword-similarity deduplication within the markdown files. Full semantic
consolidation would require embeddings infrastructure — that is Tier 3.

**When to run:** Once per week or once per 10 sessions, via the `/session-end`
pipeline at user discretion. Not every session — that would add latency without
proportional benefit.

**Ongoing maintenance:** Low. The consolidation script runs on demand. If it
misbehaves (over-prunes), the git history preserves all pre-consolidation state.

**Evidence base:** D3b-2a (yuvalsuede two-tier architecture with Jaccard dedup),
D6b Pattern CP-5 (consolidation lifecycle), D4a Finding 15 (A-MAC five-factor
admission policy), D4b Finding 11 (what works: "human-in-the-loop validation
prevents memory rot").

---

#### T2-C: `codebase-memory-mcp` for structural code intelligence [CONFIDENCE: HIGH]

**What:** Install `DeusData/codebase-memory-mcp` — a pre-built Windows amd64
binary that auto-detects Claude Code, indexes the codebase using tree-sitter AST
parsing, and exposes structural queries (what functions exist, what files import
what, what changed). It is a zero-dependency single binary.

**Why it's worth the investment:** This fills a gap that none of the session
memory tools address. Session memory answers "what did we decide?". Structural
code intelligence answers "what does this codebase do?" — an entirely different
question. At 250+ sessions, the Next.js/Firebase codebase has grown
substantially. Claude spending tokens re-discovering file structure every
session is a hidden tax. A persistent structural index eliminates that tax.

**This is NOT duplicating session memory.** D3a-2 Serendipity explicitly
identifies these as complementary layers: "codebase-memory-mcp vs session memory
are complementary, not competing."

**Installation:** Single binary download + auto-detect install
(`codebase-memory-mcp setup` auto-configures MCP entries + instruction files +
pre-tool hooks). Windows amd64 binary confirmed. Zero external dependencies.
SQLite at `~/.cache/codebase-memory-mcp/`.

**Ongoing maintenance:** Near-zero. The tool indexes incrementally on file
changes. The binary self-updates or can be updated manually.

**Evidence base:** D3a-2 Finding 8b (1,100 stars, 2,586 tests, auto-detect
install, Windows binary), D3c Finding 7 (explicitly listed as high-value for
solo developer), D6a Table 1D (Solo Dev Suitability: 5/5).

---

#### T2-D: `autoMemoryDirectory` → shared git-tracked path at BOTH locales (complete cross-locale memory) [CONFIDENCE: HIGH]

**What:** Complete the cross-locale memory implementation by: (a) reconciling
live memory with canonical-memory (one session), (b) setting
`autoMemoryDirectory` in `settings.local.json` at the home (Owner) locale to
match the git repo path there, (c) verifying both locales write to the same
canonical-memory directory via git.

**Why this is Tier 2 not Tier 1:** T1-A covers the jbell (work) locale. Tier 2
requires travelling to the home locale (Owner), making the same
settings.local.json change, reconciling any memory divergence, and testing the
full push-pull cycle. This requires physical access to the home machine and one
focused session.

**ROI calculation:** Cross-locale memory loss has been a recurring friction
point across 250 sessions. The canonical-memory directory was created
specifically to solve this problem but was abandoned. Completing this properly
eliminates ~2-5 minutes of context re-establishment at every locale-switch
session. At even 2 locale switches per week, that is 4-10 hours recovered over
the next year.

**Evidence base:** D7a Finding 10, D7b Finding 2, D1 Finding 11 (cross-locale
sync architecture), D1 Serendipity 1 ("canonical-memory directory is already the
answer, just abandoned").

---

### TIER 3 — "Only if needed" (significant new maintenance)

These require new infrastructure, have uncertain ROI, or could be made obsolete
by Anthropic shipping the capability natively. Estimated effort: 5+ sessions.

---

#### T3-A: Semantic/vector memory layer (MCP server with embeddings) [CONFIDENCE: MEDIUM]

**What:** Deploy a full semantic memory MCP server — something like
`mcp-memory-service` (doobidoo), `basic-memory`, or a Firebase-backed custom
server — that stores indexed memories with embedding-based semantic search.

**Why the ROI is uncertain:** The current system's retrieval is filename-based
(Auto Memory) and keyword-based (mcp\_\_memory). For 250+ sessions with 39
memory files, this works adequately because the files are well-named and the
content is well-curated. Semantic search only provides meaningfully better
recall when: (a) you cannot remember which memory file contains something, or
(b) you need to find implicit connections across files.

**The real question:** Is context re-establishment slow enough, or memory misses
frequent enough, to justify the infrastructure? The research (D3b-1) shows
15-25% of interaction time is spent re-establishing context. But much of that is
not addressable by better search — it is the inherent cost of the
session-boundary model.

**What Anthropic may ship:** AutoDream (when it ships natively) will add
reflection and consolidation. Improved Auto Memory may add fuzzy search in a
future Claude Code version. Building a custom semantic search layer now risks
being rendered redundant.

**When to pursue:** Only when you have a specific, reproducible problem that
cannot be solved by Tier 1/2 improvements. Signs: "I know we solved this before
but I can't find the memory file" recurring more than 3 times per week.

**If pursued, best candidate:** `basic-memory` (2,700 stars, MIT,
markdown-as-source-of-truth, SQLite index + FastEmbed, `uv tool install` without
admin, Obsidian-compatible). Uses markdown files (same format as existing
memory) with a queryable SQLite index overlaid. Upgrading from existing
MEMORY.md to basic-memory is incremental, not a rewrite.

**Do not pursue:** Docker-based solutions (Hindsight, OpenMemory/Mem0 with
Docker, Qdrant standalone), cloud SaaS memory ($19/month Supermemory), or
WSL2-required tools (OMEGA Memory, claude-brain).

**Evidence base:** D5a Finding 6 (basic-memory architecture), D5b Finding 4 (MCP
performance — latency acceptable), D3b-1 Finding 8 ("code quality as memory
substitute" counter-argument), D4a Finding 9 (context rot — adding irrelevant
memory makes things worse).

---

#### T3-B: Cloud-hosted MCP memory server for cross-locale with semantic search [CONFIDENCE: MEDIUM]

**What:** Deploy an MCP memory server to a cloud host (Railway, Vercel, or
self-hosted VPS). Both locales configure the same HTTPS endpoint. Solves
cross-locale sync AND adds structured/semantic retrieval in one step.

**Why Tier 3:** Adds ongoing operational responsibility — server uptime,
credentials management, cost monitoring, dependency on a cloud provider. For a
solo non-developer operator, a failed memory server at session-start is a
debugging task, not a trivial config fix.

**When justified:** If and only if T1-A + T2-A (git-based sync via
canonical-memory) proves insufficient due to merge conflicts or path-key issues
in practice. Given this is a solo operator who never runs both machines
simultaneously, this is unlikely to be needed.

**If pursued, lowest-maintenance option:** Firebase/Firestore-backed custom MCP
server using the project's existing sonash-app credentials. The project already
has Firebase authenticated, HTTPS endpoints, and a Node.js Cloud Functions
infrastructure. A `claude-memory` Firestore collection requires zero new
infrastructure. The security model (httpsCallable Cloud Functions) already
exists. Build cost: 1 focused session. Ongoing cost: essentially zero within
Firebase free tier limits (50K reads/day, 20K writes/day — far above memory
usage needs).

**Evidence base:** D7a Finding 6 (Firebase evaluation), D5b Finding 5 (cloud MCP
for cross-locale), D1 Finding 11 (cross-locale architecture).

---

#### T3-C: Knowledge graph semantic memory for architectural decisions [CONFIDENCE: LOW]

**What:** Replace or augment the existing `mcp__memory` JSONL knowledge graph
with a more capable graph engine — Neo4j, or a structured SQLite graph with
Cypher-style queries — that enables complex relationship queries ("what
decisions constrain the debt-runner architecture?", "which patterns depend on
Firebase v12?").

**Why Tier 3:** The current knowledge graph (mcp\_\_memory) uses keyword-only
search. Graph-aware query requires either Neo4j (heavyweight, needs running
instance) or building a custom graph traversal layer on top of SQLite. Neither
is justifiable for a 250-session project that has functioned adequately without
it.

**When this matters:** It does not matter at 250 sessions. It starts to matter
around 500-1,000 sessions when the codebase has hundreds of architectural
decisions that depend on each other and you need to understand the impact of
changing one. For now, the 93 SWS decisions in `decisions.jsonl` are sufficient
and auditable.

**Better alternative:** Rather than graph infrastructure, improve the metadata
in existing JSONL files. Add `related_decisions` arrays to `decisions.jsonl`
entries. Add `blocks` and `blocked_by` fields. This gives graph-like
navigability in a flat file, readable by the existing planning system.

**Evidence base:** D4a Finding 7 (MIRIX six-component memory), D6a Table 1D
(Neo4j options rated 2/5 for solo dev suitability), D5a Finding 5 (knowledge
graph MCP servers require running external instances).

---

## Part 3: "Do NOT Do" List

The following patterns appear promising in the research but are wrong for this
specific user profile. These are not ranked — all carry equal do-not-pursue
status.

---

### DO NOT: Install `claude-mem` (thedotmack) [CONFIDENCE: HIGH]

**Why it looks appealing:** 38,000+ stars, most sophisticated memory
architecture found, progressive disclosure, 10x token efficiency claim, active
maintainer.

**Why it is wrong here:**

1. Windows fragility is documented and not fixed: AbortSignal crash, pipe mode
   breakage (returns empty silently), PowerShell dependency for Git Bash
   startup. This user's session will break.
2. The `CLAUDE.md` subdirectory pollution bug (Issue #941) is closed as "not
   planned." The existing carefully-maintained `CLAUDE.md` in a repo with nested
   git-tracked directories will be polluted.
3. AGPL-3.0 license — embedding in commercial products requires legal review.
4. Requires Bun + ChromaDB + PowerShell — dependency chain the no-admin work
   locale cannot satisfy.
5. The architecture (SQLite + ChromaDB dual-write + Express HTTP worker on
   port 37777) is fundamentally more complex than anything this harness needs.
   When it breaks, diagnosing it requires developer skills this operator does
   not have.

**Evidence base:** D2a Findings 9 and 10, D6a Table 1C (claude-mem Windows:
"Fragile — documented crashes").

---

### DO NOT: Replace existing hooks with MCP-tool-only capture [CONFIDENCE: HIGH]

**Why it looks appealing:** MCP tools are simpler to configure than hook
scripts. Several newer memory systems (cipher, basic-memory, mcp-memory-keeper)
are hook-free.

**Why it is wrong here:**

1. The fundamental finding (D5b Finding 1, confirmed from supermemory source
   code): "MCP tools are passive; hooks are active." Capture that depends on
   Claude's judgment has a non-zero miss rate.
2. The existing 25-hook system achieves 100% capture of critical state (commits,
   sessions, compaction events). Replacing any of these with MCP-tool calls
   would introduce a capture gap.
3. The right model: **hooks for capture, MCP tools for retrieval**. These are
   complementary, not alternatives.

**Evidence base:** D5b Finding 1, D6b Pattern CP-2 (MCP tool-based capture
limitations).

---

### DO NOT: Deploy Docker-based memory infrastructure [CONFIDENCE: HIGH]

**Why it looks appealing:** Hindsight (6,700 stars, MIT, Virginia Tech
independent verification), OpenMemory/Mem0 (self-hosted, full control), Qdrant
or Weaviate for vector search — all use Docker and promise excellent recall.

**Why it is wrong here:**

1. Docker on Windows requires either admin access (Hyper-V) or WSL2 (no admin
   but requires initial WSL2 setup). The work locale has no admin access and no
   documented WSL2.
2. Docker introduces ongoing operational overhead: container updates, volume
   management, port conflicts. For a solo non-developer, a Docker failure at
   session-start is a showstopper.
3. The memory quality improvement over T1/T2 improvements does not justify this
   operational burden for a project at 250-session scale.

**Evidence base:** D5a Finding 8 (Windows compatibility matrix — Docker needed),
D6a Table 1D (Docker-dependent systems rated 2/5 for solo dev).

---

### DO NOT: Adopt `everything-claude-code` (ECC) as a platform [CONFIDENCE: HIGH]

**Why it looks appealing:** 124,000 stars, 5-layer memory system, 30 agents, 60+
commands, proven in production across many users.

**Why it is wrong here:**

1. ECC is a from-scratch harness. This project already has a more specialized
   harness (60+ skills, 27 agents, 25 hooks, deep TDMS, PR review pipeline,
   learning system). Adopting ECC means replacing or reconciling with 250
   sessions of accumulated workflow — a migration cost that is not justified.
2. Active SessionStart injection bug (#1053) cross-contaminates context across
   projects. This is not fixed.
3. The instincts architecture (homunculus) requires understanding multiple
   concepts before being useful. This is complexity this operator doesn't need.
4. Selective adoption of ECC's patterns (the "what did NOT work" session memory
   section, the instinct confidence scoring) is worth doing. Adopting ECC itself
   is not.

**Evidence base:** D2b Findings 9 and 10, D6a Table 1D (ECC rated 2/5 for solo
dev suitability).

---

### DO NOT: Use Supermemory cloud plugin ($19/month) [CONFIDENCE: HIGH]

**Why it looks appealing:** Cross-device sync out of the box, hook-based
guaranteed capture, benchmark-leading retrieval (81.6% LongMemEval).

**Why it is wrong here:**

1. Windows stdin bug (Issue #25) remains open as of February 2026. On Windows,
   `readStdin()` hangs indefinitely. This will silently break session-end
   capture.
2. Full session transcripts — including all tool outputs, code, and bash command
   results — are transmitted to a third-party cloud. The project builds a
   Firebase app with user data. Those transcripts contain PII risk.
3. $19/month is not a large cost, but it adds an external dependency for a
   capability that can be achieved for free via T1-A.
4. Pro plan required — the Claude Code plugin is not available on the free tier.

**Evidence base:** D2c Finding 1.11, D6a Table 1C (claude-supermemory Windows:
"Poor — stdin bug open").

---

### DO NOT: Implement vector store infrastructure from scratch [CONFIDENCE: HIGH]

**Why it looks appealing:** Semantic search, 95% recall, progressive disclosure
— the academic research shows these systems significantly outperform keyword
search.

**Why it is wrong here:**

1. The user is a non-developer director. Setting up ChromaDB, Qdrant, Milvus, or
   pgvector — and then maintaining them — requires developer skills this
   operator doesn't have. When these systems break, there is no fallback.
2. Context rot (D4a Finding 9) is a documented risk: adding more context via
   semantic retrieval can degrade output quality if the retrieved memories are
   not highly relevant. More recall is not always better.
3. The academic finding (D4a Finding 15, A-MAC) that "content type prior is the
   strongest admission signal" means the highest-leverage improvement is
   curating what gets stored, not improving how it is retrieved. Better curation
   at lower complexity beats better retrieval at higher complexity.
4. Anthropic is actively working on this problem (AutoDream, improved Auto
   Memory). Building vector infrastructure now has a non-trivial chance of being
   rendered obsolete within 6-12 months.

**Evidence base:** D4a Findings 9 and 15, D5b Finding 4 (performance data),
D3b-1 Finding 5 ("1000 similar projects exist" ecosystem fatigue).

---

### DO NOT: Use WSL2-dependent tools at the work locale [CONFIDENCE: HIGH]

**Why it matters:** Several high-quality tools (OMEGA Memory, claude-brain,
CCMS) require WSL2. Initial WSL2 setup requires admin access on Windows. The
work locale has no admin access. This is a hard blocker, not a workaround
situation.

Tools explicitly eliminated by this constraint: OMEGA Memory (95.4% LongMemEval
but WSL2-required), claude-brain (explicit "not supported on Windows native"),
CCMS (bash/rsync Unix only).

**Evidence base:** D5a Finding 7 (OMEGA Windows: "Poor — WSL2 required"), D7b
Finding 7 (claude-brain "Windows native: explicitly unsupported"), D1 memory
file `project_work_locale_constraints.md`.

---

## Part 4: Decision Framework

### 4A. How to decide which tier to pursue

**Start with Tier 1.** Every Tier 1 item is reversible, costs hours not days,
and leverages infrastructure already in place. The baseline question for each T1
item: "does this solve a problem I actually experience, or does it solve a
problem I think I should have?"

- T1-A (autoMemoryDirectory → canonical-memory): Do this if you switch between
  locales at least once per month and the lack of memory sync causes even one
  re-establishment session. It almost certainly does.
- T1-B (dream-skill): Do this if MEMORY.md feels noisy or you notice the same
  lessons being re-discovered across sessions. At 250 sessions, this is likely
  true.
- T1-C (episodic_memory_show permission): Do this if you have ever asked "what
  did we decide in that session about X?" and been frustrated you could only
  find which session it was, not what was in it.
- T1-D (STATE_SCHEMA.md update): Do this in the next session-end. It costs 20
  minutes and prevents wasted orientation time in future sessions.
- T1-E (mcp\_\_memory write pattern): Do this if you find yourself rebuilding
  the same architectural context across sessions. If Claude already navigates
  architecture confidently, defer.

**Pursue Tier 2 after 20+ sessions of running Tier 1**, once you have a clear
picture of what the T1 improvements did and did not solve. Tier 2 items each
require 1-3 sessions of focused implementation; they should be planned via
deep-plan, not ad-hoc.

**Pursue Tier 3 only in response to a specific, confirmed pain point** that Tier
1/2 did not solve. "It would be nice to have semantic search" is not a
justification. "I have spent 15 minutes per session re-establishing context for
3 consecutive weeks" is a justification.

---

### 4B. Signals that indicate Tier 2 is needed

The following are actionable triggers, not hypotheticals:

1. **Cross-locale memory divergence continues after T1-A.** If the
   `autoMemoryDirectory` approach produces merge conflicts or path-key problems
   in practice, escalate to T2-D (complete both locales in one focused session)
   and T2-A (automatic commit hook).

2. **Session startup takes more than 5 minutes of context re-establishment.** If
   Claude routinely spends the first 5 messages re-reading files and
   re-discovering what the project is doing, the structural code intelligence
   layer (T2-C) is justified.

3. **MEMORY.md exceeds 200 lines without pruning.** If T1-B (dream-skill
   consolidation) is not keeping MEMORY.md under the cap, the semi-manual
   consolidation script (T2-B) is needed.

4. **`/session-end` is being skipped more than once per week.** Session-end
   skips compound: missed SESSION_CONTEXT updates, missed TDMS consolidations,
   missed learning promotions. If this is happening, it is a signal that the
   session-end pipeline is too long. Consider whether T2-B can absorb some of
   the consolidation work that currently happens implicitly.

---

### 4C. Signals that indicate Tier 3 is needed

These are higher-bar, because Tier 3 items require sustained effort and create
ongoing maintenance obligations:

1. **"I've rebuilt this context 5+ times and still can't find the right memory
   file."** If semantic search misses are clearly costing more time than the
   infrastructure would cost, pursue T3-A.

2. **Cross-locale memory sync fails more than 3 times with the T1/T2 approach.**
   If git merge conflicts or path-key problems persist despite T2-D, the
   cloud-hosted MCP server (T3-B using Firebase) becomes justified. Not before.

3. **The project scales to a second developer.** All memory and learning systems
   in this harness are designed for one operator. If a second person joins,
   team-aware memory becomes necessary — that is a different design problem not
   currently in scope.

---

### 4D. Cost of waiting vs. acting now

**For Tier 1:** The cost of waiting is ongoing and linear. Every session at the
work locale that cannot access home-locale memory learnings costs 2-5 minutes of
re-establishment. Every session that runs MEMORY.md without consolidation
degrades future retrieval marginally. The cumulative cost of waiting 10 more
sessions is ~30-50 minutes of lost time plus memory entropy that becomes harder
to reverse.

**For Tier 2:** The cost of waiting is lower — these are optimizations, not
fixes. The cross-locale complete implementation (T2-D) has a one-time unlock:
once done, it runs automatically. Waiting another 20 sessions costs 20 more
locale-switch friction points.

**For Tier 3:** The cost of waiting is arguably zero or negative. Anthropic is
actively developing the memory stack (AutoDream nearing GA, improved Auto
Memory, potential native cross-device sync). Building infrastructure that
Anthropic ships in 6 months is wasted effort. Waiting for the ecosystem to
stabilize before investing in Tier 3 is the correct default posture.

**Overall assessment:** Act on Tier 1 now (hours). Plan Tier 2 for the next
planning session. Defer Tier 3 indefinitely pending specific triggers or
Anthropic shipping native equivalents.

---

## Sources

| #   | Document                        | Type                  | Trust       |
| --- | ------------------------------- | --------------------- | ----------- |
| 1   | D1-codebase-memory-inventory.md | codebase survey       | HIGH        |
| 2   | D2a-claude-mem-cipher.md        | repo analysis         | HIGH        |
| 3   | D2b-everything-cc-interface.md  | repo analysis         | HIGH        |
| 4   | D2c-supermemory-openmemory.md   | repo analysis         | HIGH        |
| 5   | D3a-1-github-claude-memory.md   | web discovery         | MEDIUM-HIGH |
| 6   | D3a-2-github-agent-memory.md    | web discovery         | MEDIUM-HIGH |
| 7   | D3b-1-reddit-hn.md              | community patterns    | MEDIUM-HIGH |
| 8   | D3b-2a-anthropic-official.md    | official docs         | HIGH        |
| 9   | D3b-2b-dev-blogs.md             | community + official  | MEDIUM-HIGH |
| 10  | D3c-marketplace-plugins.md      | marketplace survey    | HIGH        |
| 11  | D4a-academic-memory-patterns.md | academic research     | HIGH        |
| 12  | D4b-industry-implementations.md | industry analysis     | HIGH        |
| 13  | D5a-mcp-memory-servers.md       | technical survey      | HIGH        |
| 14  | D5b-mcp-integration-patterns.md | technical analysis    | MEDIUM-HIGH |
| 15  | D6a-comparison-matrix.md        | synthesis             | HIGH        |
| 16  | D6b-architecture-patterns.md    | pattern taxonomy      | HIGH        |
| 17  | D7a-cross-locale-sync.md        | technical analysis    | MEDIUM-HIGH |
| 18  | D7b-sync-implementations.md     | implementation survey | MEDIUM-HIGH |

---

## Contradictions

**Tier 1 vs Tier 2 on autoMemoryDirectory:** T1-A recommends setting
`autoMemoryDirectory` immediately (hours). T2-D recommends completing the home
locale setup (1-3 sessions). These are sequential, not contradictory: T1-A does
the work locale; T2-D completes the home locale. They are the same solution at
different scope.

**dream-skill maturity:** The dream-skill community plugin is documented to
exist (D3c), but its star count, maturity, and Windows compatibility were not
independently verified. Recommending it as Tier 1 ("free win") carries the
implicit assumption that it installs and runs cleanly via the plugin
marketplace. If it does not, it remains a Tier 2 item (build a custom
consolidation script following its pattern).

**codebase-memory-mcp as Tier 2 vs free win:** The single-binary nature and
zero-dependency profile of `codebase-memory-mcp` argue for making it a Tier 1
item. It was placed in Tier 2 because it requires one focused session to
install, configure, and validate the auto-detection with this specific codebase
— more than a config change but less than a full build.

---

## Gaps

1. **dream-skill Windows compatibility not confirmed.** The community plugin is
   documented to exist and replicate AutoDream. Whether it installs cleanly via
   the plugin marketplace on Windows with fnm was not tested. Treat as MEDIUM
   confidence until tested.

2. **`autoMemoryDirectory` → canonical-memory path interaction with existing
   canonical-memory content.** Pointing `autoMemoryDirectory` at a directory
   with 20 existing files (some with outdated content) may cause Claude to
   inherit that content on next session. Reconciliation should happen before
   enabling this setting.

3. **Ongoing `pending-refinements.jsonl` management.** The learning system's
   pending refinements accumulate without resolution. This findings document
   does not include a Tier 1/2 recommendation for resolving this specific
   backlog — it is a human judgment task, not a tooling problem.

4. **Token budget impact of T1-E (enabling `mcp__memory` write pattern):**
   Adding an active knowledge graph write pattern adds token overhead (tool
   descriptions + graph contents injected at session start). The exact impact
   depends on graph size, which is currently small but would grow. This was not
   quantified.

---

## Serendipity

**The canonical-memory directory is architecturally the right answer and has
been since it was created.** The research across all 16 files converges on one
finding: the project's existing `.claude/canonical-memory/` directory, combined
with `autoMemoryDirectory`, is the lowest-complexity, highest-value improvement
available. It was built, populated with 20 files, git-tracked — and then
abandoned as a maintenance task. T1-A is not a new idea. It is completing
something that was already almost done.

**The academic research validates the existing architecture, not a
replacement.** Reflexion (procedural memory as text), MemGPT (virtual context),
Anthropic's own memory tool recommendation (file-based `/memories` directory) —
all of these converge on exactly what this project already does. The
serendipitous finding is that there is no architectural revolution needed. The
right direction is refinement, not replacement.

**AutoDream's arrival is the key external event to watch.** When AutoDream ships
natively (currently server-gated as `tengu_onyx_plover`), it provides automatic
memory consolidation for zero maintenance cost. Every Tier 2 item related to
memory consolidation (T2-B) may become redundant within 6-12 months. Build the
simplest version now; expect to retire it when Anthropic ships the real thing.

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 8
- LOW claims: 1 (T3-C knowledge graph — low ROI confidence)
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The maintenance burden assessment is based on direct codebase inventory (D1) and
is HIGH confidence. The tier recommendations draw on cross-referenced findings
across all 16 prior research files. The "Do NOT Do" list items are HIGH
confidence based on documented failures and constraints specific to this user
profile. The only genuine uncertainty is around third-party tool maturity
(dream-skill, codebase-memory-mcp Windows behavior) where production testing is
needed to confirm.
