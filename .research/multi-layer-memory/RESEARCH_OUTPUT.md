# Multi-Layer Memory System for Claude Code — Research Output

**Research type:** Technology / Architecture **Depth:** L1 (Exhaustive)
**Date:** 2026-03-31 (original); 2026-03-31 (post-challenge re-synthesis)
**Agents deployed:** 41 (25 research + 3 synthesis + 2 challenge + 3 gap + 4
verification + 1 A-MAC paper + 3 re-spawns on API 500s) **Claims:** 128 total
**Sources consulted:** ~300+ across codebase, GitHub repos, academic papers,
community forums, official docs

**Post-challenge status:** 12 contrarian challenges, 8 OTB angles, 5 gap
investigations, 4 verification agents (128 claims checked). ~35% of original
claims materially affected.

**Verification results:** 41 VERIFIED (32%), 37 PARTIALLY VERIFIED (29%), 7
REFUTED (5%), 43 UNVERIFIABLE (34% — external tools not installed locally).

---

## Executive Summary

This research investigated memory architectures for Claude Code, comparing the
project's existing 14 persistence mechanisms against 40+ external systems,
academic research, and industry implementations.

### CORRECTED: Three Key Decisions

1. **Measure before building.** The original research had 128 claims but zero
   empirical data from the actual system. Gap pursuit measured: **~19,240 tokens
   across all 44 memory files** — but NOT all injected simultaneously. MEMORY.md
   index (~500 tokens) is always loaded; individual files loaded on-demand by
   relevance. Always-injected cost: ~4,000 tokens (CLAUDE.md + MEMORY.md index).
   Total potential cost if all files loaded: ~19,240. 97 state files, growing
   without bounds.

2. **Hybrid evolution, not revolution — but with a higher bar.** The existing
   architecture is directionally similar to the clean-slate ideal (original
   claim: "70-80%" — downgraded: no scoring methodology exists for that figure).
   The 29% mechanism abandonment rate is the primary design constraint: any new
   mechanism must be fully automated or it will be abandoned within 50 sessions.

3. **Cross-locale sync is experimental, not "one config line away."**
   `autoMemoryDirectory` is not configured on this machine. The actual
   canonical-memory divergence is **23 files** (not ~7). Pointing
   autoMemoryDirectory at a git-tracked directory would dirty the working tree
   on every session (5-8 file changes observed per session). This needs testing
   at one locale before recommending.

### AutoDream Status

**VERIFIED (user-confirmed).** `autoDreamEnabled: true` is configured and
AutoDream is actively modifying memory files during sessions. The gap agent's
methodology (looking for off-hours writes) was flawed — AutoDream operates
in-session, not as a background daemon. User directly observes it working
throughout the day. Original recommendation stands: observe AutoDream's
consolidation patterns over 5 sessions before supplementing with custom
consolidation.

### CORRECTED: Top Actions by ROI

| Priority | Action                                                            | Effort | Impact                                                   |
| -------- | ----------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| **T0**   | Build memory telemetry hook (which files read, token cost, churn) | 1 hr   | Replaces speculation with data for all other decisions   |
| **T0**   | Classify 44 memory files: user-portable vs project-scoped         | 30 min | Required for OS vision (project #2 portability)          |
| T1       | Memory admission policy in CLAUDE.md                              | 45 min | Quality gate — validated by Cursor's failure without one |
| T1       | Add `episodic_memory_show` permission                             | 15 min | Completes retrieval path                                 |
| T1       | Test autoMemoryDirectory at ONE locale with rollback plan         | 1 hr   | Validates or kills the cross-locale approach             |

---

## Part 1: Landscape

_Claims: C-001 through C-038_

### Current State (CORRECTED with empirical data)

SoNash has **14 distinct persistence mechanisms** across 5 tiers.

**Always injected:** ~4,000 tokens (CLAUDE.md ~3,537 + MEMORY.md index ~500).
**On-demand (loaded by relevance):** up to ~15,200 additional tokens from 44
individual memory files. **If all loaded:** ~19,240 total.

| Component          | Characters | ~Tokens | Injection |
| ------------------ | ---------- | ------- | --------- |
| CLAUDE.md          | 14,147     | 3,537   | Always    |
| MEMORY.md index    | ~2,000     | ~500    | Always    |
| 43 memory files    | 51,825     | 12,956  | On-demand |
| SESSION_CONTEXT.md | 8,988      | 2,247   | When read |

**Memory composition:** 23 feedback files (52%), 8 project files (18%), 5 user
files (11%), 5 reference files (11%), 3 other (7%).

**Health issues (CORRECTED):**

- Canonical-memory diverged by **23 files** (21 in live but not canonical, 2
  dropped from live)
- STATE_SCHEMA.md 8x stale (documents 10 files, reality is 97)
- AutoDream: enabled in settings but **no observable activity**
- 95% of hook warnings are 4 repeating entries (wallpaper)
- State directory growing without bounds (97 files, 1.9 MB)

### External Landscape

**40+ systems discovered.** The most significant external signal:

**Cursor killed its Memories feature** (Nov 2025, after 5 months). Reasons:
privacy/enterprise incompatibility, feature overlap with Rules files, poor
auto-generation quality (users rejected "almost all" auto-memories), persistent
stability bugs. **Key lesson:** auto-generated memory without quality gates
creates noise, not signal. Local-first, version-controlled persistence is the
industry convergence. This validates admission gates but challenges the value of
adding more memory layers.

### Emerging Consensus (cross-source patterns)

- **Three-role model:** CLAUDE.md = "how to work here", Auto Memory = "what I've
  learned", MCP Memory = "what we know"
- **Hooks capture, MCP retrieves:** Hooks are the only guaranteed capture
  mechanism; MCP tools are passive
- **Markdown-first gets adoption** (pragmatic choice given current tooling, not
  architecturally validated — circular reasoning per contrarian challenge #11)
- **Context rot is real:** 19,240 tokens before user speaks. Each new mechanism
  increases this.
- **Cursor's retreat is stronger evidence than GitHub repos advancing**

---

## Part 2: Analysis

_Claims: C-100 through C-145_

### Cross-Locale Sync (CORRECTED)

**Status: EXPERIMENTAL.** Not configured. Divergence is 23 files (not ~7).

`autoMemoryDirectory` → git-tracked directory is theoretically sound but:

- Would dirty git working tree every session (5-8 file changes)
- No community implementations found (novel approach)
- Merge conflict behavior with memory files is unknown
- Requires testing at one locale with defined rollback before recommending

### Tool Recommendations (CORRECTED with negative evidence)

| Tool                | Original Score | Revised | Issues Found                                                                                                                                    |
| ------------------- | -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| codebase-memory-mcp | 5/5            | 3/5     | 5 weeks old, Windows PATH bugs, crash on oversized cells, layout timeouts on large projects. Wait for v0.6+                                     |
| Engram              | 4/5            | 2/5     | 6 weeks old, Windows Defender false positives, SQLITE_BUSY under concurrent sessions, silent data loss from empty writes. Wait for WAL mode fix |
| Native Auto Memory  | 5/5            | 4/5     | Working well. AutoDream portion unverifiable.                                                                                                   |

---

## Part 3: Recommendations (POST-CHALLENGE)

### The "Do Nothing" Case

The original research never articulated a concrete session failure caused by the
current memory system. 252 productive sessions completed without cross-locale
sync. The 29% abandonment rate applies equally to proposed additions.

**"Do nothing for 5 sessions" is a legitimate option** — the only action being
measurement (T0 telemetry hook). This was the strongest OTB challenge.

### REVISED Implementation Tiers

**Tier 0 — Measure First (before ANY other action):**

1. Memory telemetry hook — track which files are read, token cost, churn (1 hr)
2. Classify 44 files: user-portable vs project-scoped (30 min, required for OS
   vision)
3. Memory staleness check — flag files unmodified in 30+ days (30 min)

**Tier 1 — Free Wins (AFTER T0 data collected over 5-10 sessions):**

1. Memory admission policy in CLAUDE.md — validated by Cursor's failure (45 min)
2. Add `episodic_memory_show` permission (15 min)
3. Test autoMemoryDirectory at ONE locale with rollback plan (1 hr)
4. Create AGENTS.md for cross-tool portability (30 min)

**Tier 2 — Only If T0 Data Shows Need (1-3 sessions each):**

1. Session-end memory commit hook (if cross-locale sync validated)
2. Memory deletion schedule — files unread for 50+ sessions get archived (if T0
   shows growth is a problem)
3. Token budget guardrail in session-begin (if 19,240 grows significantly)

**Tier 3 — Deferred with "Check if Anthropic shipped this" gates:**

1. codebase-memory-mcp (after v0.6+, Windows bugs resolved)
2. Engram (after WAL mode + mem_save fix)
3. Lightweight consolidation script (only if AutoDream is confirmed inactive
   after T0 measurement period)
4. Vector store + semantic search (only if file count exceeds ~100)

**Re-evaluate date: 2026-06-30** — check Claude Code feature set before
executing Tier 2-3.

**Do NOT Do (EXPANDED to 10 items):**

- claude-mem (Windows fragility, AGPL, CLAUDE.md pollution)
- Replace hooks with MCP-only capture
- Docker-based infrastructure (admin required)
- ECC as platform (complexity mismatch)
- Supermemory cloud ($19/mo, PII risk)
- Vector store before fixing capture/curation
- WSL2-dependent tools at work locale
- Semantic search before content-type-prior filtering
- **NEW:** codebase-memory-mcp or Engram at current versions (pre-stable)
- **NEW:** Build custom consolidation before observing AutoDream for 5 sessions

### Risk Summary (CORRECTED)

| Risk                                            | Score     | Mitigation                                                       |
| ----------------------------------------------- | --------- | ---------------------------------------------------------------- |
| 29% mechanism abandonment rate                  | **20/25** | PRIMARY CONSTRAINT. Every new mechanism must be fully automated. |
| Context rot from over-injection (19,240 tokens) | 15/25     | T0 telemetry, then token budget guardrail                        |
| Debugging impossible as layers increase         | 16/25     | Build diagnostic tool before adding mechanisms                   |
| AutoDream consolidation quality unknown         | 8/25      | Observe patterns over 5 sessions before supplementing            |
| Canonical-memory divergence (23 files)          | 10/25     | Test autoMemoryDirectory, don't assume it works                  |
| Anthropic ships competing features in 6 months  | 8/25      | Re-evaluate gate at 2026-06-30                                   |

### Solo Dev Reality Check (STRENGTHENED)

- **29% abandonment rate is the #1 design constraint**, not a secondary risk
- **19,240 tokens already injected** — each new mechanism increases this
- **Cursor killed memories** after 5 months — auto-generation without quality
  gates failed at scale
- **AutoDream is active** (user-confirmed in-session) — observe quality before
  supplementing
- **No empirical data existed** before gap pursuit — T0 telemetry is mandatory
- **OS vision requires memory portability** — classify user vs project scope
  before building

---

## Appendix: Research Artifacts

| File                                          | Purpose                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `challenges/contrarian-1.md`                  | 12 challenges (6 HIGH)                         |
| `challenges/otb-1.md`                         | 8 OTB angles (5 HIGH)                          |
| `findings/G1-cursor-memory-removal.md`        | Cursor memory removal investigation            |
| `findings/G1-cursor-and-tool-negatives.md`    | Cursor + tool negative evidence                |
| `findings/G2-actual-usage-metrics.md`         | Empirical memory system measurements           |
| `findings/G5-autodream-and-autoMemDir.md`     | AutoDream + autoMemoryDirectory investigation  |
| `claims.jsonl`                                | 128 original claims                            |
| `claims-landscape.jsonl`                      | Claims C-001 to C-038                          |
| `claims-analysis.jsonl`                       | Claims C-100 to C-145                          |
| `claims-recommendations.jsonl`                | Claims C-200 to C-243                          |
| `findings/V1-landscape-verification.md`       | Landscape claims verification (38 claims)      |
| `findings/V2-analysis-verification.md`        | Analysis claims verification (46 claims)       |
| `findings/V3-recommendations-verification.md` | Recommendation claims verification (44 claims) |
| `findings/V4-amac-paper-verification.md`      | A-MAC paper verification (arxiv:2603.04549)    |

## Appendix: Verification Summary

| Agent                  | VERIFIED     | PARTIAL      | REFUTED    | UNVERIFIABLE |
| ---------------------- | ------------ | ------------ | ---------- | ------------ |
| V1 (landscape)         | 14           | 12           | 3          | 9            |
| V2 (analysis)          | 10           | 7            | 1          | 28           |
| V3 (recommendations)   | 17           | 18           | 3          | 6            |
| **Total (128 claims)** | **41 (32%)** | **37 (29%)** | **7 (5%)** | **43 (34%)** |

V4 (A-MAC paper): Paper is real (arxiv:2603.04549). Core finding accurate. "70%
elimination" figure is fabricated (agent-invented, not from paper). V5
(adversarial): Skipped — 2x API 500 errors. Covered by contrarian + OTB.

## Appendix: Claim Corrections

| Claim | Original                        | Correction                                                                     | Source                  |
| ----- | ------------------------------- | ------------------------------------------------------------------------------ | ----------------------- |
| C-200 | "70-80% of ideal" HIGH          | Downgraded to MEDIUM — no scoring methodology                                  | Contrarian #1           |
| C-204 | "AutoDream is LIVE" HIGH        | **VERIFIED** — user confirms in-session activity; gap agent methodology flawed | User correction         |
| C-202 | "One config line" HIGH          | Downgraded to MEDIUM — untested, 23-file divergence                            | Contrarian #7, Gap G4   |
| C-205 | 29% abandonment (no score)      | Elevated to 20/25, primary constraint                                          | Contrarian #5, OTB #2   |
| C-031 | Reflexion "validates" learnings | Downgraded — loosely analogous, not validated                                  | Contrarian #9           |
| C-215 | "70% elimination" HIGH          | Downgraded to MEDIUM — agent estimate, not paper finding                       | Contrarian #8           |
| C-112 | codebase-memory-mcp 5/5         | Downgraded to 3/5 — pre-stable, Windows bugs                                   | Gap G1/G7               |
| C-141 | Engram 4/5                      | Downgraded to 2/5 — pre-stable, silent data loss                               | Gap G1/G7               |
| C-215 | "70% elimination" from A-MAC    | **Fabricated** — figure does not appear in paper (arxiv:2603.04549)            | V4                      |
| NEW   | Token injection ~10-12K         | **Measured: ~19,240 total** but only ~4K always-injected; rest on-demand       | Gap G2, User correction |
| NEW   | Divergence "~7 files"           | **Measured: 23 files**                                                         | Gap G4                  |
