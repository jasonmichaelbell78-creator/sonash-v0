# DIAGNOSIS: /github-health Skill

**Deep-plan topic:** Build /github-health skill from completed research
**Date:** 2026-04-02

---

## ROADMAP Alignment

**Status: NEW DIRECTION — not in ROADMAP, but aligns with Tooling &
Infrastructure (Meta P0)**

The /github-health skill is not explicitly listed in ROADMAP.md milestones.
However, it directly supports the "Tooling & Infrastructure" meta-milestone
(ACTIVE, P0) and the "Operational Visibility" milestone (BLOCKED, P0). The
skill's --quick mode for session-begin integration gives every session GitHub
health awareness — a clear operational visibility win.

**Todo T12** tracks this work as P2. No conflict.

---

## Research Context

**Source:** `.research/github-health/RESEARCH_OUTPUT.md` (2026-03-29)

32-agent research completed (Session #246, PR #480): 21 discovery agents, 3
verification, 2 challenge, 1 dispute, 3 gap pursuit. 100 claims, 103 sources
across 6 domains. Architecture design in Section 4.

**Note:** The `metadata.json` and RESEARCH_OUTPUT.md Section 7.1 claim only 3 of
21 discovery agents produced findings files. This is **stale/inaccurate** — the
PR description confirms 32 agents ran with 100 claims and 103 sources, and the
report itself contains detailed findings across all 6 domains (claims C-001
through C-039, sources S-001 through S-026). The metadata was likely written
before the full pipeline completed. The skill design should treat the full
research output as the authoritative source.

**Key research findings that shape planning:**

1. **6 assessment domains identified:** security, actions, deps, config,
   release, insights
2. **Architecture:** resolution-first (not dashboard-first), interactive
   per-item triage, Fix/Defer/Skip
3. **Modes:** --quick (3 API calls, <2s for session-begin), --full (all 6
   phases), --scope (single phase)
4. **API strategy:** GraphQL-first for reads, REST for writes
5. **Fix capabilities:** 10 fix classes identified (close alerts, update
   dependabot.yml, add labels, etc.)
6. **Guardrail #2 compliance:** batch auto-fix explicitly prohibited; per-item
   user confirmation required
7. **13 prioritized issues found** across P0-P3, plus 7 quick wins

---

## Relevant Existing Systems

### 1. /alerts skill (closest UX pattern)

- Interactive alert-by-alert walkthrough with decision cards
- Decisions: Fix now / Defer / Ignore / Suppress / Acknowledge
- State: alerts-history.jsonl, alert-suppressions.json, alerts-baseline.json
- Compaction: tmp/alerts-progress-{date}.json (<2h resume)
- Scoring: 100 - (30/error + 10/warning), A-F grades

### 2. /ecosystem-health skill (closest architecture pattern)

- 8-category weighted composite scoring, A-F grades
- Per-dimension Q&A triage with options + recommendation
- --quick mode (4 checkers, ~1min), full mode (~10-15min)
- State: task-ecosystem-health-triage.state.json
- Data: ecosystem-health-log.jsonl for historical tracking

### 3. /sonarcloud skill (closest API integration pattern)

- Multiple modes: sync, resolve, report, sprint, status
- gh CLI for GitHub API calls
- Integration with TDMS for deferred items

### 4. /gh-fix-ci skill (CI failure diagnosis)

- Research suggests github-health --scope actions should delegate to gh-fix-ci
  for deep CI analysis
- Currently PR-scoped, not repo-level

### 5. Session-begin integration

- Phase 4: health checks with anomaly gates
- No GitHub health integration yet — this is a new integration point
- Pattern: quick check → surface anomaly → recommend full skill run

---

## Reframe Check

**The task is what it appears to be** — building a new skill from completed
research. No reframe needed. The research is thorough and provides an
architecture sketch (Section 4) that serves as a strong starting point for
discovery questions.

**One nuance:** The research metadata and Section 7.1 claim 18 of 21 agents
didn't produce findings, but PR #480 confirms 32 agents completed with 100
claims. The metadata is stale — the full research output is the authoritative
source for skill design.

---

## Key Questions for Discovery

The research provides a detailed architecture but leaves significant
implementation decisions open:

- Skill file structure (single SKILL.md vs SKILL.md + REFERENCE.md + scripts)
- Scoring methodology (research explicitly declined to create one)
- How --quick integrates with session-begin hook vs skill invocation
- GraphQL query design specifics
- Fix implementation approach (inline vs PR-based vs gh CLI commands)
- State file schema and history JSONL format
- Error handling for API rate limits and permission issues
- Relationship to /alerts (overlap? federation? separate?)
