# S2: Analysis Synthesis — Comparison, Patterns, and Sync

**Synthesizer:** deep-research-synthesizer **Date:** 2026-03-31 **Sources:**
D6a-comparison-matrix.md, D6b-architecture-patterns.md,
D7a-cross-locale-sync.md, D7b-sync-implementations.md **Claims:** C-100 through
C-145

---

## 1. Comparison Summary — Top Systems Ranked by SoNash Fit

The comparison matrix (D6a) scored 25 systems across storage, capture,
retrieval, Windows compatibility, cross-locale sync, token overhead, and
solo-dev suitability. The rating scale is 1–5 where 5 is maximum fit.

### Tier 1: Adopt Now (Score 4–5, zero or near-zero friction)

| Rank | System                         | Score | Key Reason                                                                                                                                                 | Status                            |
| ---- | ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1    | **Claude Code Auto Memory**    | 5     | Already active; zero friction; auto-capture; native                                                                                                        | Active                            |
| 2    | **Claude Code CLAUDE.md**      | 5     | Already active; git-synced; human-curated control                                                                                                          | Active                            |
| 3    | **codebase-memory-mcp**        | 5     | Fills the structural code-index gap that NO session memory tool addresses; Windows amd64 binary; zero dependencies; 66 languages; auto-detects Claude Code | Not installed                     |
| 4    | **Auto Dream**                 | 5     | When GA, zero-friction consolidation of Auto Memory; community dream-skill plugin available now                                                            | Gated (flag: `tengu_onyx_plover`) |
| 5    | **Claude Code MCP Memory**     | 4     | Already configured; knowledge graph model; keyword-only search is a limitation but zero new setup                                                          | Active                            |
| 6    | **Engram**                     | 4     | Single Go binary; MIT; confirmed Claude Code plugin marketplace; SQLite+FTS5; zero infrastructure                                                          | Not installed                     |
| 7    | **cursor-memory-bank pattern** | 4     | Directly portable 4-file structure; phase-based rule loading (70% token reduction); pure markdown; 3,000+ star validation                                  | Pattern only                      |
| 8    | **mcp-memory-keeper**          | 4     | Confirmed Windows + npx; 38 tools; git branch topic channels for isolation                                                                                 | Not installed                     |
| 9    | **basic-memory**               | 4     | Human-readable markdown + SQLite + hybrid FTS/semantic search; Obsidian-compatible; uv works without admin                                                 | Not installed                     |
| 10   | **claude-diary**               | 4     | Dead-simple proven episodic pattern; PreCompact hook; zero infrastructure beyond 2 files                                                                   | Not installed                     |

### Tier 2: Adopt for Specific Needs (Score 3)

| System                        | Score | When Appropriate                                                                                  |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| memoir                        | 3     | Only tool with explicit Windows path remapping for cross-locale; high adoption risk (27 days old) |
| Episodic Memory (superpowers) | 3     | Already permitted; useful for "what did I do last time?"; Windows issue risk                      |
| homunculus                    | 3     | Behavioral instinct learning is unique; Windows unconfirmed; ECC dependency                       |
| claude-diary                  | 4     | Simplest episodic capture; Bash dependency for PreCompact hook                                    |
| Memori                        | 3     | Strong LoCoMo benchmarks; less Claude Code-specific documentation                                 |
| mcp-memory-service            | 3     | Cloudflare remote MCP unique; Python dependency chain adds friction                               |

### Tier 3: Not Recommended for This Project

| System                       | Solo Dev Score | Blocking Reason                                                                                         |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| OMEGA Memory                 | 1              | WSL2 required — hard blocker at no-admin work locale                                                    |
| claude-mem                   | 2              | Windows fragility (AbortSignal crash, PowerShell dep, pipe breakage); AGPL-3.0; CLAUDE.md pollution     |
| claude-supermemory           | 2              | $19/month Pro; Windows stdin bug open (Issue #25); privacy risk (full transcripts to cloud)             |
| cipher                       | 2              | Default in-memory data loss; Elastic License 2.0; not auto-capture despite marketing claims             |
| ECC (everything-claude-code) | 2              | 30 agents + 60+ commands for solo dev; active session injection bug (#1053) cross-contaminates projects |
| Hindsight                    | 2              | Docker + PostgreSQL for solo dev is overkill; best-in-class benchmarks don't justify operational cost   |
| mem0                         | 2              | Requires OpenAI API key by default; 51,600 stars doesn't offset heavyweight infrastructure              |
| OpenMemory                   | 2              | Active rewrite warning; Docker dependency; no auto-capture hooks; complex setup                         |

### Key Deduplication Note (D6a vs. D6b)

D6a and D6b are complementary, not contradictory. D6a scores systems; D6b
extracts patterns that can be adopted independently of adopting a full system.
The two claims that appear in both files and require reconciliation:

- **autoMemoryDirectory + OneDrive** appears in D6a as the "best practical
  option" and in D6b as SY-2 with the same conclusion. Confidence: HIGH from
  both independent analyses.
- **canonical-memory divergence** is identified in D6a (3.4) and D6b (LP-5,
  Gap 2) as the same unresolved problem. Both analyses reach the same fix:
  either automate sync or run a manual reconciliation pass.

---

## 2. Architecture Patterns — 26 Patterns Organized by Category

D6b documented 26 distinct architectural patterns across 5 categories. Each
pattern is rated for SoNash applicability using a 3-tier scale: **Active**
(already in use), **Gap** (not implemented but applicable), or **Low** (low
relevance or deliberately excluded).

### Category A: Capture Patterns (CP)

| Pattern                      | What It Is                                                                                     | SoNash Status                                                               | Applicability                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **CP-1: Hook-Based Capture** | Lifecycle hooks write deterministically at fixed runtime points regardless of Claude's actions | Active — 25 hooks, 14+ persistence mechanisms                               | Mature. Coverage is comprehensive. No new hooks needed.                                                                          |
| **CP-2: MCP Tool Capture**   | Claude calls store tools when it decides something matters                                     | Active (mcp\_\_memory) but underused                                        | Present. The structural limitation is that Claude must decide to call the tool — low capture reliability without a hook trigger. |
| **CP-3: Hybrid Capture**     | Hooks write; MCP tools expose the stored data as a queryable interface                         | Partial — hooks write state files; MCP graph is a separate layer            | Gap: the MCP retrieval layer is not connected to hook-captured data. This is the highest-value architectural investment.         |
| **CP-4: Manual Capture**     | User explicitly writes memory                                                                  | Active — CLAUDE.md, MEMORY.md, SESSION_CONTEXT.md                           | Mature and appropriate. The 135-line CLAUDE.md discipline is correct.                                                            |
| **CP-5: Auto Consolidation** | Background agent reorganizes, merges, and prunes accumulated memory                            | Active for learning system (10-review threshold); absent for session memory | Gap: MEMORY.md entries have no consolidation pass despite 250+ accumulated sessions.                                             |

**Key insight from synthesis:** The supermemory project rebuilt its entire
architecture away from MCP tools to hooks because "we cannot control when Claude
Code chooses to run the tools." Hooks are the only mechanism that guarantees
capture. SoNash already operates on this principle — the gap is that captured
data is not sufficiently queryable.

### Category B: Storage Patterns (SP)

| Pattern                         | What It Is                                                              | SoNash Status                                           | Applicability                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SP-1: Flat Markdown**         | Memory as .md files; human-readable, git-trackable, zero infrastructure | Active — 39 memory files + CLAUDE.md + SESSION docs     | Mature. The 4-file community standard (activeContext, productContext, progress, decisionLog) is directly portable.                                         |
| **SP-2: Structured JSONL**      | Append-only logs; each line is a JSON object                            | Active — 14+ JSONL state files                          | Mature. Rotation logic in place. No change needed.                                                                                                         |
| **SP-3: SQLite + Vector Store** | SQLite as source of truth + vector DB for semantic search               | Present (episodic-memory plugin, low use)               | Gap: episodic-memory is configured and Windows-compatible via fnm but the `show` tool is not in the allow-list. Validate before adding new infrastructure. |
| **SP-4: Knowledge Graph**       | Entities + typed relations + observations                               | Active (mcp\_\_memory, low use)                         | Present. The `/checkpoint --mcp` skill documents intended use; discipline is the gap, not infrastructure.                                                  |
| **SP-5: Hybrid Multi-Layer**    | 3–4 coordinated storage tiers with explicit promotion rules             | Active implicitly (CLAUDE.md → MEMORY.md → JSONL → MCP) | Present. No explicit tier boundaries or promotion rules. Formalizing the tiers is an architectural investment, not a new system.                           |

**Key insight from synthesis:** The community de facto standard is the 4-file
markdown pattern (activeContext, productContext, progress, decisionLog) —
converged independently across Roo-Code, Cline, and cursor-memory-bank. SoNash's
SESSION_CONTEXT.md partially covers this pattern but doesn't have the explicit
phase-based loading that achieves 70% token reduction.

### Category C: Retrieval Patterns (RP)

| Pattern                          | What It Is                                                                           | SoNash Status                                                                     | Applicability                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RP-1: Always-Inject**          | Content injected unconditionally every turn                                          | Active — CLAUDE.md (258 lines) + MEMORY.md index (91 lines)                       | Mature. Well-calibrated. Risk: gradual growth crossing effectiveness threshold without detection.                                                                                                            |
| **RP-2: Progressive Disclosure** | 3-tier: summary → detail → full. Claude controls depth.                              | Partial — MEMORY.md index → individual files; individual files not auto-triggered | Gap: closing this requires only adding an explicit instruction in MEMORY.md for Claude to request specific topic files. No infrastructure.                                                                   |
| **RP-3: Semantic Search**        | Query embedding → cosine similarity retrieval                                        | Present (episodic-memory plugin) but passive                                      | Gap: low active use; `show` tool not in allow-list. Validate existing tool before adding new infrastructure.                                                                                                 |
| **RP-4: Composite Scoring**      | Weighted formula: similarity + salience + recency + weight                           | Not implemented                                                                   | Gap. The A-MAC finding is actionable: content type prior is the strongest signal. A whitelist of category types (user-corrections, architecture-decisions, hook-patterns) is simpler than a scoring formula. |
| **RP-5: Citation-Validated**     | Memory entries store file:line references; validated against current code before use | Not implemented                                                                   | Low priority. Pattern is compelling for code-specific memories. The known-debt-baseline.json implicitly implements this in the build system.                                                                 |
| **RP-6: Confidence-Gated**       | Memory entries carry confidence scores; low-confidence entries suppressed            | Partial — pending-refinements.jsonl is human-gated (confidence = 1.0 required)    | Gap: no automated confidence scoring. Applying occurrence-count-based confidence to MEMORY.md entries is directly adoptable.                                                                                 |

**Key insight from synthesis:** The practical implementation of RP-4 does not
require a scoring formula. The A-MAC "content type prior" finding means the most
effective gate is a whitelist: only categories worth persisting get written to
MEMORY.md at all. This aligns with the existing signal keyword extraction
pattern (write only when turn contains: "decision", "bug", "architecture",
"correction", "never again").

### Category D: Lifecycle Patterns (LP)

| Pattern                    | What It Is                                                                                                     | SoNash Status                                                                  | Applicability                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LP-1: Memory Promotion** | Facts promote from project scope to global scope only after appearing in 2+ projects                           | Partial — User/Project/Reference categories exist implicitly                   | Gap: no explicit promotion rules or automated checks prevent project-specific observations from staying project-scoped.                                           |
| **LP-2: Confidence Decay** | Different content types decay at different rates (progress: 7 days; session: 30 days; architecture: permanent) | Not implemented for MEMORY.md                                                  | Gap. The type-to-decay mapping is directly applicable: adding `last_reviewed` + `type` + `expires` headers to 39 memory files enables a lightweight check script. |
| **LP-3: Consolidation**    | Episodic records processed into semantic facts; deduplication + merging + pruning                              | Active for learning system and session-end archival; absent for session memory | Gap: MEMORY.md entries are never consolidated. dream-skill community plugin provides AutoDream pattern now.                                                       |
| **LP-4: Forgetting**       | Explicit deletion, archival, or weight reduction of stale memory                                               | Active for reviews (rotation) and TDMS (status tracking); absent for MEMORY.md | Gap: 39 memory files include completed-initiative descriptions framed as current. A manual review pass is the immediate fix.                                      |
| **LP-5: Anti-Rot**         | Active detection of memory inconsistency with current reality                                                  | Partial — session gap detection, remote-session staleness check                | Gap: canonical-memory divergence is an unresolved rot failure (7+ missing feedback entries, incorrect expertise description).                                     |

### Category E: Sync Patterns (SY)

| Pattern                   | What It Is                                               | SoNash Status                                                      | Applicability                                                                                               |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **SY-1: Git-Tracked**     | Memory committed to repo; synced via push/pull           | Active — CLAUDE.md, SESSION_CONTEXT.md, planning, canonical-memory | Mature for curated memory. The gap is canonical-memory divergence.                                          |
| **SY-2: Cloud Folder**    | autoMemoryDirectory redirected to OneDrive/Dropbox       | Not implemented                                                    | Gap. Available since v2.1.74. Solo operator constraint satisfies concurrent-session risk.                   |
| **SY-3: Git-Notes**       | Memory stored as git notes metadata                      | Not implemented                                                    | Low relevance for general session memory. Complex fetch semantics; no mature tooling.                       |
| **SY-4: Cloud DB**        | Hosted MCP server; both locales connect to same endpoint | Not implemented                                                    | Medium relevance. Phase 2 option if SY-2 proves insufficient. Supermemory Windows stdin bug is active risk. |
| **SY-5: Locale-Specific** | Memory is explicitly machine-local                       | Active — live auto-memory is path-keyed by design                  | Accepted for ephemeral session state. canonical-memory is the mitigation for longer-lived knowledge.        |

---

## 3. Cross-Locale Sync — Definitive Analysis

### The Problem Statement

Claude Code keys auto memory to absolute filesystem paths:
`~/.claude/projects/<encoded-absolute-path>/memory/`

SoNash has two Windows locales with different usernames:

- Home locale: `C:\Users\Owner\...` → encoded as `C--Users-Owner--...`
- Work locale: `C:\Users\jbell\...` → encoded as `C--Users-jbell--...`

These are treated as entirely different projects. Memory does not flow between
them without explicit intervention. This is documented in GitHub Issues #25739
and #35985 (20+ related issues; no native fix as of March 2026).

### Ranked Sync Options

| Rank   | Option                                                             | Confidence | Setup Cost                                   | Ongoing Cost                          | Conflict Risk                 | Recommendation                                     |
| ------ | ------------------------------------------------------------------ | ---------- | -------------------------------------------- | ------------------------------------- | ----------------------------- | -------------------------------------------------- |
| **1**  | `autoMemoryDirectory` → git repo dir (`.claude/canonical-memory/`) | HIGH       | Low (2 config lines at each locale)          | None — normal git workflow            | Very low for solo operator    | **Recommended primary**                            |
| **2**  | `autoMemoryDirectory` → OneDrive folder                            | HIGH       | Low (1 config line at each locale)           | None                                  | Very low for solo operator    | **Recommended alternative**                        |
| **3**  | memoir (camgitt)                                                   | MEDIUM     | Medium (npm global + wizard)                 | Low                                   | Very low                      | Viable but risky (5 stars, 27 days old)            |
| **4**  | Git-tracked canonical-memory (existing)                            | HIGH       | Zero (already in place)                      | Low (manual commit cycle)             | Very low                      | **Immediate fallback**                             |
| **5**  | Syncthing + autoMemoryDirectory                                    | MEDIUM     | Medium (binary on both machines)             | Low (background daemon)               | Very low                      | Good if OneDrive unavailable at work               |
| **6**  | Cloud MCP server (Railway/Vercel)                                  | MEDIUM     | High (server deployment)                     | $0–10/month                           | None (single source of truth) | Phase 2 only                                       |
| **7**  | Firebase/Firestore backend                                         | MEDIUM     | High (custom MCP server)                     | Free tier                             | None                          | Phase 2 only                                       |
| **8**  | GitHub Gists / API                                                 | MEDIUM     | Medium (hook scripts)                        | Free                                  | Very low                      | Phase 2 option                                     |
| **9**  | Git notes                                                          | MEDIUM     | High (complex fetch config + custom tooling) | High (manual fetch/push each session) | Medium                        | Not recommended                                    |
| **10** | Shared SQLite via cloud sync                                       | HIGH       | Low                                          | None                                  | HIGH (corruption risk)        | Do not use                                         |
| **11** | claude-sync tools (tawanorg, renefichtmueller)                     | MEDIUM     | Medium                                       | Low                                   | Medium                        | Not recommended — neither solves the path mismatch |
| **12** | claude-brain                                                       | HIGH       | Not applicable                               | N/A                                   | N/A                           | Not viable — Windows native explicitly unsupported |
| **13** | CCMS (miwidot)                                                     | HIGH       | Not applicable                               | N/A                                   | N/A                           | Not viable — Unix/WSL only                         |

### The Recommended Implementation (Option 1)

D7a's serendipity finding and D7b's git-native analysis converge on the same
pattern:

**Set `autoMemoryDirectory` in `settings.local.json` at both locales to point at
`.claude/canonical-memory/` within the git repo.**

```json
{
  "autoMemoryDirectory": "C:\\Users\\<username>\\.local\\bin\\sonash-v0\\.claude\\canonical-memory"
}
```

This means:

1. Claude writes auto memory directly to a git-tracked directory
2. Normal `git commit` + `git push` propagates memory automatically
3. Normal `git pull` at the other locale delivers it
4. No separate sync infrastructure, cloud services, or scripts needed
5. The project's existing commit workflow doubles as memory sync
6. Conflicts on plain markdown are handled by git's line-level merge

**Pre-condition:** The existing `.claude/canonical-memory/` is diverged (stale
content). Before activating this, reconcile the canonical-memory with live
memory (one session of manual review). The 7+ missing feedback entries and
incorrect expertise description must be fixed first.

**Security constraint (confirmed from both D7a and D7b):** `autoMemoryDirectory`
cannot be set in `.claude/settings.json` (project settings). It must be in
`~/.claude/settings.local.json` or user settings. This is a deliberate security
restriction — not a bug. Each locale requires manual configuration; it cannot be
propagated via git. This is the only ongoing friction.

### Contradictions in Sync Findings (Surfaced, Not Silently Resolved)

**Contradiction 1: autoMemoryDirectory bug status.** D7a cites GitHub Issue
#36636 as closed COMPLETED (March 25, 2026). D7b notes it was closed as a
duplicate of #33535 and #34146, whose fix status was not independently verified.
**Resolution:** Apply the confirmed workaround regardless of fix status: use
absolute paths (not relative), use `settings.local.json` (not
`.claude/settings.json`). Both files agree on this workaround. Confidence: HIGH
for the workaround; MEDIUM for whether the underlying bug is fully resolved.

**Contradiction 2: memoir path remapping — "just works" vs. undocumented.** D7b
finding #1 says memoir "handles path remapping transparently." D7b's
Contradictions section immediately qualifies this: "marketing vs. technical
reality — completely undocumented technically." No source confirms the mechanism
or tests it with different Windows usernames. **Resolution:** memoir's path
remapping claim is UNVERIFIED for the specific two-Windows- different-username
scenario. Treat memoir as a backup option, not primary recommendation.

**Contradiction 3: claude-sync tools claim "memory sync" but don't solve path
remapping.** D7a confirms this. D7b confirms this independently. Both reached
the same conclusion without coordination. **Resolution:** claude-sync tools
(both variants) do not solve the locale path mismatch. Confidence: HIGH.

---

## 4. The Path-Key Problem — What It Is, Why It Matters, Solutions Ranked

### What It Is

Claude Code identifies each project by its absolute filesystem path. The path is
encoded and used as a directory name under `~/.claude/projects/`. Memory,
session state, and settings are stored under this path-derived key.

```
~/.claude/projects/C--Users-Owner--local-bin-sonash-v0/memory/MEMORY.md  (home locale)
~/.claude/projects/C--Users-jbell--local-bin-sonash-v0/memory/MEMORY.md  (work locale)
```

These are treated as entirely different projects, even though they represent the
same git repository on different machines.

### Why It Matters for SoNash

1. **Memory does not flow between locales.** Feedback learned at work (jbell) is
   not present when Claude starts at home (Owner). Every locale starts with
   whatever was in canonical-memory at the time the repo was cloned.

2. **The canonical-memory divergence is a consequence.** The
   `.claude/canonical-memory/` directory was created specifically to mitigate
   path-keying. Its divergence from live memory (7+ missing entries, stale
   project state) means the mitigation has failed silently.

3. **All sync tools that sync `~/.claude/projects/` as-is do not solve the
   problem.** They replicate the path-keyed directories intact. The home
   locale's memory directory remains inaccessible to the work locale.

### Solutions Ranked by Effectiveness

| Rank | Solution                                        | How It Bypasses the Problem                                                | Confidence | Complexity                         |
| ---- | ----------------------------------------------- | -------------------------------------------------------------------------- | ---------- | ---------------------------------- |
| 1    | **`autoMemoryDirectory` → shared location**     | Redirects writes to a non-path-keyed path; both locales read the same file | HIGH       | Low                                |
| 2    | **memoir (camgitt)**                            | Internal path remapping during restore (mechanism undocumented)            | MEDIUM     | Medium                             |
| 3    | **git-notes pattern**                           | Keys memory to commit hashes instead of filesystem paths                   | MEDIUM     | High                               |
| 4    | **claude-context-sync path template variables** | Converts absolute paths to `${HOME}`, `${PROJECTS}` during export/import   | MEDIUM     | Medium (tool not fully researched) |
| 5    | **user-memories (m13v)**                        | Uses git remote URL as stable project key                                  | MEDIUM     | Medium                             |
| 6    | **Manual canonical-memory sync**                | Human copies live memory to canonical-memory; git tracks it                | HIGH       | Very low (manual)                  |

**Why Option 1 is ranked first:** It does not require trusting an undocumented
mechanism (memoir), building custom tooling (git-notes, path template
variables), or maintaining discipline across every locale switch (manual sync).
It leverages an official Claude Code feature specifically designed for this use
case.

**Why the native fix has not shipped:** GitHub Issue #35985 is still open as of
March 2026. The feature request (use git remote URL as project key) is filed and
acknowledged but not confirmed for inclusion. The `autoMemoryDirectory`
workaround was designed as a bridge solution while the native fix is developed.

### SQLite Corruption Risk (Do Not Use)

The SQL corruption finding from D7a is the strongest negative finding in the
sync research. Sharing a SQLite database file via OneDrive, Dropbox, or any
cloud sync service is explicitly unsupported by SQLite's own documentation
(`sqlite.org/useovernet.html`). WAL mode makes this worse. A recently patched
bug (SQLite 3.51.3, March 13, 2026) affected WAL-reset behavior even on local
filesystems — cloud sync surfaces this risk in every session. For any memory
system using SQLite (mcp-memory-service, context-sync, Engram) that you want to
sync: the database file cannot be cloud-synced. The workaround is to use a cloud
MCP server (where SQLite stays on the server) or to convert to a markdown-backed
system.

---

## 5. Key Claims

Claims are numbered C-100 through C-145 to follow the analysis range. Each claim
states the assertion, confidence, and which source documents support it.

---

**C-100:** `autoMemoryDirectory` pointed at the git repo's
`.claude/canonical-memory/` directory is the lowest-friction cross-locale sync
solution for SoNash's two-Windows- different-username scenario. Confidence: HIGH
| Sources: D7a, D7b, D6a, D6b

**C-101:** `autoMemoryDirectory` can only be set in `settings.local.json` or
user-level settings, not in `.claude/settings.json`. This is a deliberate
security restriction, not a bug, and requires per-locale manual configuration.
Confidence: HIGH | Sources: D7a, D7b

**C-102:** The `.claude/canonical-memory/` directory is git-tracked and contains
20 files but is diverged from live auto-memory by at least 7 feedback entries
and contains an incorrect user expertise description. Confidence: HIGH |
Sources: D7a, D6b (LP-5)

**C-103:** Claude Code keys auto memory to absolute filesystem paths. Two
machines with different usernames but the same git repo have different memory
keys and cannot access each other's auto memory without explicit intervention.
Confidence: HIGH | Sources: D7a, D7b, D6a (3.4)

**C-104:** Sharing a SQLite database file via OneDrive, Dropbox, or any cloud
sync service risks data corruption. SQLite explicitly documents this as
unsupported. WAL mode makes the risk worse, not better. Confidence: HIGH |
Sources: D7a (SQLite official docs)

**C-105:** Both claude-sync tools (tawanorg and renefichtmueller) sync
`~/.claude/projects/` as-is and do not remap locale-specific path keys. They do
not solve the path-key problem for different-username locales. Confidence: HIGH
| Sources: D7a, D7b (independently confirmed)

**C-106:** memoir (camgitt) claims Windows path remapping "just works" during
restore, but the mechanism is entirely undocumented. No source confirms it
handles the specific scenario of two Windows machines with different usernames.
Treat as UNVERIFIED for this use case. Confidence: MEDIUM (feature claim) /
UNVERIFIED (two-different-username Windows scenario) | Sources: D7b

**C-107:** claude-brain explicitly does not support Windows native; it requires
WSL. Confidence: HIGH | Sources: D7b

**C-108:** CCMS (miwidot) is a bash script requiring Unix or WSL. It is not
viable on a no-admin Windows environment without WSL. Confidence: HIGH |
Sources: D7b

**C-109:** `autoMemoryDirectory` was added to Claude Code in v2.1.74 (March
12, 2026) specifically to support the use case of pointing memory to
OneDrive/Dropbox/git-repo paths. Confidence: HIGH | Sources: D7a (GitHub Issues
#28276), D7b

**C-110:** The git-notes pattern solves the path-key problem by keying memory to
commit hashes instead of filesystem paths, but tooling is immature (no
deployable tool or Windows compatibility notes found) and requires Python +
vector embedding stack. Confidence: MEDIUM | Sources: D7a, D7b

**C-111:** Syncthing runs as a single portable binary on Windows with no admin
required. It can serve as a cross-locale sync layer for any filesystem-backed
memory directory. However, corporate firewalls at the work locale may block
Syncthing relay servers. Confidence: MEDIUM (Syncthing portability: HIGH;
corporate firewall risk: unconfirmed) | Sources: D7a

**C-112:** codebase-memory-mcp fills a gap that no session memory system
addresses: a structural AST-based code index. It is not a substitute for session
memory; it is a complement. Pre-built Windows amd64 binary; zero dependencies;
66 languages. Confidence: HIGH | Sources: D6a

**C-113:** The cursor-memory-bank 4-file pattern (activeContext, productContext,
progress, decisionLog) converged independently across Roo-Code, Cline, and
cursor-memory-bank. It represents a de facto community standard for
project-scoped markdown memory. Confidence: HIGH | Sources: D6b (SP-1)

**C-114:** Hook-based capture (CP-1) is the only mechanism that guarantees
memory writes without requiring Claude to decide to call a store tool.
Supermemory explicitly rebuilt its architecture away from MCP tools to hooks for
this reason. Confidence: HIGH | Sources: D6b (CP-1, CP-2)

**C-115:** SoNash's existing 25-hook, 14-mechanism architecture already
implements CP-1 comprehensively. The architectural gap is not coverage but
queryability: the captured data is not well-exposed through a retrieval layer
(CP-3). Confidence: HIGH | Sources: D6b (6.1)

**C-116:** The mcp\_\_memory knowledge graph server is configured and permitted
but underused. The `/checkpoint --mcp` skill documents its intended use. The gap
is discipline, not infrastructure. Confidence: HIGH | Sources: D6b (SP-4, 6.1),
D6a

**C-117:** OMEGA Memory requires WSL2 on Windows and has no confirmed native
Windows path. This is a hard blocker at the no-admin work locale. Confidence:
HIGH | Sources: D6a, D6b

**C-118:** claude-mem has multiple documented Windows-specific failures:
AbortSignal crash, pipe mode breakage, PowerShell dependency. It is rated
FRAGILE on Windows. Confidence: HIGH | Sources: D6a

**C-119:** CLAUDE.md adherence degrades when the file exceeds 200 lines. The
135-line target established in SoNash's CLAUDE.md is well-reasoned and should
not be allowed to grow. Confidence: HIGH | Sources: D6b (RP-1), D6a

**C-120:** The A-MAC academic research finding on "content type prior" means the
most effective memory admission gate is a whitelist of category types, not a
scoring formula. Categories worth persisting: user-corrections,
architecture-decisions, hook-patterns, recurring-errors. Confidence: MEDIUM
(academic paper finding applied to production context) | Sources: D6b (RP-4)

**C-121:** Episodic memory (semantic search over past conversations) is the
weakest layer in SoNash's current architecture. The mcp\_\_memory server stores
entities/relations but not timestamped events. MEMORY.md mixes episodic and
semantic content with no temporal binding. Confidence: HIGH | Sources: D6a (3.2)

**C-122:** The MEMORY.md index → individual files pattern already partially
implements progressive disclosure (RP-2). Completing it requires only an
instruction in MEMORY.md directing Claude to request specific topic files when
tasks touch those domains. No infrastructure change needed. Confidence: HIGH |
Sources: D6b (RP-2)

**C-123:** Auto Dream is server-gated (feature flag: `tengu_onyx_plover`,
`enabled: false`) and not available for general use as of March 2026. The
community dream-skill plugin replicates the 4-phase cycle (orient → gather
signal → consolidate → prune) and is available now. Confidence: HIGH | Sources:
D6a, D6b (CP-5, LP-3)

**C-124:** OMEGA Memory and Hindsight both claim top LongMemEval rankings
simultaneously. These cannot both be current. LongMemEval leaderboards shift;
benchmark claims from these systems should be treated as indicative, not
authoritative. Confidence: HIGH (for the contradiction itself) | Sources: D6a
(Contradictions)

**C-125:** The episodic-memory (superpowers) plugin is already configured and is
Windows-compatible via fnm. The `show` tool is not in the allow-list, which
limits its retrieval capability. This should be validated before adding any new
vector search infrastructure. Confidence: HIGH | Sources: D6a, D6b (SP-3, 6.3)

**C-126:** The type-to-decay mapping from yuvalsuede and OpenMemory research
provides a directly applicable framework for SoNash's 39 memory files:
in-progress work: 7-day expiry; session observations: 30-day; bug resolutions:
90-day; architecture decisions, user corrections, project constraints:
permanent. Confidence: MEDIUM (adaptation of third-party decay rates to SoNash
context) | Sources: D6b (LP-2)

**C-127:** Adding metadata headers (`last_reviewed`, `type`, `expires`) to the
39 individual memory files would enable a decay-checking script without any new
infrastructure investment. This is the lowest-cost implementation of LP-2.
Confidence: HIGH | Sources: D6b (LP-2, Gap 3)

**C-128:** The learning system already implements automatic consolidation (every
10 PR reviews → CODE_PATTERNS.md). Session memory does not have an equivalent
pipeline. This is the highest- priority lifecycle gap. Confidence: HIGH |
Sources: D6b (CP-5, LP-3, 6.2 Gap 1)

**C-129:** signal keyword extraction — writing to MEMORY.md only on turns
containing "decision", "bug", "architecture", "correction", "never again" — is
an extractable pattern from claude-supermemory that can be adopted without
adopting that system. Confidence: MEDIUM | Sources: D6a (Part 4 Patterns Worth
Adopting)

**C-130:** The "2+ projects before promotion" rule from lin-yuchen is directly
applicable as a governance principle for SoNash's project vs. user memory
distinction. Currently there are no explicit rules preventing project-specific
observations from staying project-scoped. Confidence: MEDIUM | Sources: D6b
(LP-1)

**C-131:** phase-based rule loading (loading different CLAUDE.md sections based
on task phase) achieves ~70% token reduction according to the cursor-memory-bank
implementation. This is adoptable without installing cursor-memory-bank.
Confidence: MEDIUM (self-reported token reduction figure) | Sources: D6a (Part
4), D6b (RP-2)

**C-132:** SoNash already implicitly operates as a multi-layer memory system
(SP-5): CLAUDE.md (always-inject) → MEMORY.md index (session-start inject) →
JSONL state files (audit trail) → mcp\_\_memory graph (on-demand retrieval). The
layers exist; explicit tier boundaries and promotion rules do not. Confidence:
HIGH | Sources: D6b (SP-5, 6.1)

**C-133:** context-sync (Intina47), despite being described in early research as
having cross-machine sync, is actually local-only. Its SQLite database has no
built-in push/pull mechanism. This was a gap in Wave 1 research confirmed in
D7b. Confidence: HIGH | Sources: D7b

**C-134:** OneDrive does not merge plain markdown files on concurrent writes. It
creates a duplicate file with a machine name suffix (e.g., MEMORY-DESKTOP-1.md).
For a solo operator who never runs both machines simultaneously, this behavior
is detectable and recoverable — not silent data corruption. Confidence: HIGH |
Sources: D7a

**C-135:** The pattern of pointing `autoMemoryDirectory` at a git-tracked
directory has no publicly documented community implementation. It is the
highest-signal finding from the sync analysis but is untested in production. The
closest evidence is the existing canonical-memory directory which is git-tracked
but NOT currently set as autoMemoryDirectory. Confidence: MEDIUM (reasoning:
HIGH; production validation: not found) | Sources: D7a (Serendipity, Gap 1)

**C-136:** doobidoo/mcp-memory-service has a Cloudflare Workers backend that
enables true cross-locale sync via remote MCP. This is an architecturally clean
Phase 2 option if file-based sync proves insufficient. Docker is required for
local install on Windows without admin (blocking for work locale). Confidence:
MEDIUM | Sources: D7b

**C-137:** memoir requires `npm install -g memoir-cli`. Global npm installs on
Windows need no admin if Node.js was installed with nvm-windows or to a
user-local path, but require admin with a system-level Node.js install. The work
locale's Node.js install method is not confirmed. Confidence: MEDIUM | Sources:
D7b

**C-138:** The three highest-priority architectural gaps in SoNash's memory
system, ranked: (1) canonical-memory divergence resolution + autoMemoryDirectory
activation (LP-5/SY-2); (2) session memory consolidation pipeline (LP-3/CP-5);
(3) memory decay metadata for the 39 individual files (LP-2/LP-4). All three can
be addressed without new infrastructure or third-party dependencies. Confidence:
HIGH | Sources: D6b (6.2)

**C-139:** Confidence decay rates differ across cognitive memory types. The
synthesis from OpenMemory and yuvalsuede research: most volatile is
emotional/progress context; least volatile is reflective/architectural. This
ordering is consistent across both independent implementations. Confidence:
MEDIUM | Sources: D6b (LP-2)

**C-140:** The supermemory cloud plugin ($19/month Pro) is the most automatic
cross-locale solution but has an active Windows stdin bug (GitHub Issue #25,
open as of February 2026). It is not recommended for this environment until the
bug is confirmed fixed. Confidence: HIGH | Sources: D6a, D7a

**C-141:** Engram is a single Go binary with MIT license, explicit Claude Code
plugin marketplace support, and SQLite+FTS5 backend. It has no Windows
compatibility issues documented and requires no admin or Docker. It fills the
"persistent semantic store with keyword search" use case with minimal friction.
Confidence: HIGH | Sources: D6a

**C-142:** The community `dream-skill` plugin replicates AutoDream's 4-phase
consolidation cycle as a manually-triggered skill. It is available today. It is
the most accessible way to implement session memory consolidation (LP-3) without
waiting for AutoDream to GA. Confidence: HIGH | Sources: D6a (Auto Dream entry),
D6b (CP-5, LP-3)

**C-143:** claude-mem's PostToolUse hooks broke for 2+ months (November 2025 –
January 2026) when Claude Code changed its runtime internals. This is a concrete
example of the hook maintenance burden (CP-1 Con) and a risk for any third-party
hook-dependent system. Confidence: HIGH | Sources: D6b (CP-1)

**C-144:** At the work locale (jbell), OneDrive availability is unconfirmed. The
memory system notes "no admin access" but does not specify whether OneDrive is
installed or permitted by corporate IT. If OneDrive is unavailable, the
recommended sync alternative is git-only (canonical-memory +
autoMemoryDirectory) or Syncthing portable binary. Confidence: MEDIUM (OneDrive
status unknown) | Sources: D7a (Gap 2)

**C-145:** mcp-memory-keeper (mkreyman) is confirmed Windows-compatible via npx
with no admin required. Its git branch-derived topic channels provide a form of
project isolation that aligns with SoNash's existing multi-branch workflow. 38
tools is high; using the minimal profile reduces overhead. Confidence: HIGH |
Sources: D6a

---

## Appendix A: Contradictions Summary

| #   | Contradiction                                                                                 | Resolution                                                                                | Confidence                  |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------- |
| 1   | autoMemoryDirectory bug (#36636): closed COMPLETED vs. closed as duplicate with uncertain fix | Apply workaround regardless: absolute paths, settings.local.json. Workaround is reliable. | HIGH for workaround         |
| 2   | memoir path remapping: "just works" (README) vs. mechanism undocumented                       | Treat as UNVERIFIED for two-Windows-different-username scenario                           | MEDIUM                      |
| 3   | context-sync described as cross-machine (Wave 1) vs. local-only (D7b actual docs)             | D7b is correct; Wave 1 was in error                                                       | HIGH                        |
| 4   | OMEGA Memory vs. Hindsight: both claim top LongMemEval                                        | Cannot both be current; treat both as indicative                                          | HIGH (contradiction itself) |
| 5   | Auto Dream GA status: some community sources say live vs. feature flag shows disabled         | Not GA; `tengu_onyx_plover` flag is in codebase with enabled: false                       | HIGH                        |
| 6   | claude-mem stars: 24,000 / 38,400 / 43,900 across sources                                     | Best corroborated: ~38,400 (ClaudePluginHub, March 2026)                                  | MEDIUM                      |

---

## Appendix B: Patterns Worth Adopting Without Adopting a Full System

These patterns are extractable from D6a's Part 4 and can be applied to SoNash's
existing architecture:

| Pattern                                   | Source System        | Adoption Path                                                                                         | Effort          |
| ----------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- | --------------- |
| Progressive disclosure (3-tier retrieval) | claude-mem           | Add instruction in MEMORY.md index to request specific topic files                                    | 1 line          |
| "What Did NOT Work" session section       | ECC                  | Add explicit Failed Approaches section to SESSION_CONTEXT.md updates                                  | 1 section       |
| Signal keyword extraction                 | claude-supermemory   | Only write MEMORY.md entries when turns contain: decision, bug, architecture, correction, never again | 1 instruction   |
| Sector-specific memory files              | OpenMemory, academic | Split MEMORY.md into episodic.md, semantic.md, procedural.md subdirectories                           | 1 refactor      |
| valid_from / valid_to on facts            | OpenMemory           | Add date range to MEMORY.md entries                                                                   | Metadata        |
| Content type prior admission gate         | A-MAC academic       | Whitelist categories: user-corrections, architecture-decisions, hook-patterns                         | 1 rule          |
| Phase-based rule loading                  | cursor-memory-bank   | CLAUDE.md @import sections that load different rule files by task phase                               | Medium          |
| Confidence decay by type                  | yuvalsuede           | Add last_reviewed + type + expires headers to 39 memory files                                         | Metadata        |
| Sleep-time consolidation                  | LightMem, AutoDream  | Use dream-skill plugin at /session-end                                                                | 1 skill install |
