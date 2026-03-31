# Multi-Layer Memory System for Claude Code — Research Output

**Research type:** Technology / Architecture **Depth:** L1 (Exhaustive)
**Date:** 2026-03-31 **Agents deployed:** 28 (25 research + 3 synthesis)
**Findings files:** 25 research + 3 synthesis = 28 **Claims:** 128 (HIGH: 96,
MEDIUM: 30, LOW: 2) **Sources consulted:** ~300+ across codebase, GitHub repos,
academic papers, community forums, official docs

---

## Executive Summary

This research investigated memory architectures for Claude Code, comparing the
project's existing 14 persistence mechanisms against 40+ external systems,
academic research, and industry implementations. The core finding: **SoNash's
existing system is already 70-80% of the ideal clean-slate architecture.** The
gaps are structural (no admission gate, no decay, canonical-memory divergence)
rather than architectural.

### Three Key Decisions

1. **Hybrid evolution, not revolution.** The clean-slate design validates the
   existing architecture. No replacement needed — enhance what exists.

2. **Cross-locale sync is one config line away.** Set `autoMemoryDirectory` in
   `settings.local.json` at both locales pointing to the git-tracked
   `.claude/canonical-memory/` directory. This feature shipped March 12, 2026
   and the infrastructure already exists.

3. **AutoDream is live.** Anthropic's native memory consolidation is active on
   this account, changing the recommendation from "build custom consolidation"
   to "observe AutoDream for 3-5 sessions before supplementing."

### Top 3 Actions by ROI

| Action                                                     | Effort    | Impact                                             |
| ---------------------------------------------------------- | --------- | -------------------------------------------------- |
| Memory admission policy in CLAUDE.md                       | 45 min    | Immediate quality gate on every future session     |
| Reconcile canonical-memory + configure autoMemoryDirectory | 1 session | Solves cross-locale problem open for 250+ sessions |
| Add `episodic_memory_show` permission                      | 15 min    | Completes retrieval path for conversation history  |

---

## Part 1: Landscape

_Full details: [S1-landscape-synthesis.md](findings/S1-landscape-synthesis.md)_
_Claims: C-001 through C-038_

### Current State

SoNash has **14 distinct persistence mechanisms** across 5 tiers:

1. **Always-injected** — CLAUDE.md (~135 lines), Auto Memory/MEMORY.md (~200
   lines)
2. **Session-scoped** — SESSION_CONTEXT.md, 11 ephemeral hook dot-files
3. **Cross-session state** — 82 files in `.claude/state/`, reviews.jsonl,
   hook-runs.jsonl
4. **Structural knowledge** — MCP memory server (knowledge graph),
   episodic-memory (SQLite-vec)
5. **Archive** — SESSION_HISTORY.md, MASTER_DEBT.jsonl (8,473 items), GSD
   planning artifacts

**Health issues:** canonical-memory diverged from live memory, STATE_SCHEMA.md
8x stale (documents 10 files, reality is 82), MCP memory underutilized,
episodic-memory scoped too narrowly (search-only, show blocked).

### External Landscape

**40+ systems discovered** across categories:

- 6 reference repos deeply analyzed (claude-mem, cipher, ECC, interface-design,
  supermemory, OpenMemory)
- 23+ additional GitHub repos catalogued
- 50+ MCP memory servers identified across registries
- 10 industry implementations studied (Devin, SWE-Agent, Copilot, Letta, etc.)

### Emerging Consensus (cross-source patterns)

- **Three-role model:** CLAUDE.md = "how to work here", Auto Memory = "what I've
  learned", MCP Memory = "what we know"
- **Hooks capture, MCP retrieves:** Hooks are the only guaranteed capture
  mechanism; MCP tools are passive (Claude decides when to call them)
- **Markdown-first gets adoption:** Database tools get enthusiasm, but markdown
  gets real-world usage
- **Context rot is real:** Too much injected context degrades quality as much as
  too little
- **JSON > Markdown for structured state:** Anthropic empirical finding

### Anthropic Native Features

- **Auto Memory** — shipped v2.1.59, stores in `~/.claude/projects/*/memory/`
- **Auto Dream** — background consolidation, LIVE on this account
- **autoMemoryDirectory** — shipped v2.1.74, redirects memory storage location
- **AGENTS.md** — emerging cross-tool standard pressuring CLAUDE.md-only
  workflows

---

## Part 2: Analysis

_Full details: [S2-analysis-synthesis.md](findings/S2-analysis-synthesis.md)_
_Claims: C-100 through C-145_

### Architecture Patterns

26 distinct patterns identified across 5 categories:

- **5 Capture patterns** (hook-based, MCP, hybrid, manual, auto-consolidation)
- **5 Storage patterns** (flat markdown, JSONL, SQLite+vector, knowledge graph,
  hybrid)
- **6 Retrieval patterns** (always-inject, progressive disclosure, semantic,
  composite scoring, citation-validated, confidence-gated)
- **5 Lifecycle patterns** (promotion, confidence decay, consolidation,
  forgetting, anti-rot)
- **5 Sync patterns** (git-tracked, cloud folder, git-notes, cloud DB, no sync)

### Cross-Locale Sync Recommendation

**PRIMARY:** `autoMemoryDirectory` → `.claude/canonical-memory/` (git-tracked)

- Zero new infrastructure
- Uses existing git push/pull workflow
- Plain markdown survives merge conflicts
- Bypasses the path-key problem (Auto Memory keys by absolute path, which
  differs between machines)

**The path-key problem:** Auto Memory stores files keyed by the project's
absolute filesystem path. Different machines have different paths, so memory
doesn't sync. `autoMemoryDirectory` overrides this by pointing both machines at
the same git-tracked directory.

### Top Systems by SoNash Fit

| Rank | System                     | Score | Why                                                                                    |
| ---- | -------------------------- | ----- | -------------------------------------------------------------------------------------- |
| 1    | codebase-memory-mcp        | 5/5   | Structural code intelligence, zero-dep Windows binary, complementary to session memory |
| 2    | Engram                     | 4/5   | Go binary, SQLite+FTS5, MCP stdio, zero server process                                 |
| 3    | memoir                     | 4/5   | Windows path remapping for cross-locale (unverified)                                   |
| 4    | Native Auto Memory + Dream | 5/5   | Already active, zero maintenance, Anthropic-supported                                  |

---

## Part 3: Recommendations

_Full details:
[S3-recommendations-synthesis.md](findings/S3-recommendations-synthesis.md)_
_Claims: C-200 through C-243_

### Hybrid vs Clean-Slate Verdict

**Hybrid wins.** The 70-80% overlap finding makes this a non-debate. The
clean-slate architecture is the target; the hybrid approach is the route.

### Implementation Tiers

**Tier 1 — Free Wins (hours, zero new infrastructure):**

1. Memory admission policy in CLAUDE.md (45 min)
2. Reconcile canonical-memory + configure autoMemoryDirectory (1 session)
3. Add `episodic_memory_show` permission (15 min)
4. Fix STATE_SCHEMA.md (20 min)
5. Establish `mcp__memory` write patterns (30 min)

**Tier 2 — Worth the Investment (1-3 sessions each):**

1. Session-end memory commit hook (auto-sync canonical-memory)
2. Lightweight consolidation script (poor-man's AutoDream supplement)
3. codebase-memory-mcp single binary for structural code intelligence
4. Complete cross-locale memory at home locale

**Tier 3 — Only If Needed (5+ sessions, defer):**

1. Vector store + semantic search (sqlite-vec + HuggingFace ONNX)
2. Engram as full admission/retrieval framework
3. Custom consolidation pipeline beyond AutoDream

**Do NOT Do (8 items):**

- claude-mem (Windows fragility, AGPL, CLAUDE.md pollution bug)
- Replace hooks with MCP-only capture
- Docker-based infrastructure (admin required)
- ECC as platform (complexity mismatch)
- Supermemory cloud ($19/mo, PII risk)
- Vector store from scratch before fixing capture/curation
- WSL2-dependent tools at work locale
- Semantic search before content-type-prior filtering

### Technology Picks

| Component           | Primary                                   | Backup                                |
| ------------------- | ----------------------------------------- | ------------------------------------- |
| Vector store        | sqlite-vec (npm, zero admin)              | Qdrant local                          |
| Knowledge graph     | Keep existing MCP memory server           | —                                     |
| Embeddings          | HuggingFace ONNX local (all-MiniLM-L6-v2) | OpenAI text-embedding-3-small         |
| Sync                | autoMemoryDirectory → git-tracked dir     | autoMemoryDirectory → OneDrive        |
| Admission/retrieval | Engram (Go binary)                        | codebase-memory-mcp (structural only) |

### Risk Summary

| Risk                                            | Score | Mitigation                                                |
| ----------------------------------------------- | ----- | --------------------------------------------------------- |
| Debugging impossible as layers increase         | 16/25 | Build diagnostic tool before adding mechanisms            |
| AutoDream could change/break (undocumented)     | 12/25 | Don't depend on it; keep manual consolidation as fallback |
| Context rot from over-injection                 | 12/25 | Token budget guard in session-begin                       |
| Canonical-memory divergence (already happening) | 10/25 | Reconcile now, automate sync via hook                     |
| 29% mechanism abandonment rate                  | —     | Any enhancement must be automated or it will fail         |

### Solo Dev Reality Check

- **29% of existing mechanisms have been abandoned** (canonical-memory,
  STATE_SCHEMA.md, governance-changes.jsonl, mcp\_\_memory active use)
- **Manual maintenance steps will be skipped** — proven by three independent
  examples
- **Any new mechanism must be automated** — if it requires periodic human
  attention, it will rot
- **Before adding complexity, build a diagnostic tool** for the existing 14
  mechanisms
- **The academic research validates the existing file-based architecture** — not
  recommending replacement

---

## Appendix: Research Artifacts

| File                                      | Purpose                                       |
| ----------------------------------------- | --------------------------------------------- |
| `findings/D1-*` through `findings/D10b-*` | 25 research agent findings                    |
| `findings/S1-*` through `findings/S3-*`   | 3 synthesis documents                         |
| `claims.jsonl`                            | 128 numbered claims with confidence + sources |
| `claims-landscape.jsonl`                  | Claims C-001 to C-038                         |
| `claims-analysis.jsonl`                   | Claims C-100 to C-145                         |
| `claims-recommendations.jsonl`            | Claims C-200 to C-243                         |

## Appendix: Contradictions Identified

11 contradictions surfaced across synthesis (5 in S1, 6 in S2). All documented
in appendices of their respective synthesis files. Key contradictions:

- AutoDream status (resolved: confirmed live by user)
- Markdown vs database (resolved: markdown for adoption, database for scale)
- Star counts inconsistent across sources (noted, not material)
