# Research & Discovery Standard — DIAGNOSIS

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
**Plan:** research-discovery-standard
**Session:** #238
<!-- prettier-ignore-end -->

---

## ROADMAP Alignment

**Status: ALIGNED (new direction within existing track)**

R&D Standard is not an explicit ROADMAP item but fits within Track-CANON via SWS
Phase 3 (Ecosystem Standardization). The SWS meta-plan (PLAN-v3.md) defines 18
ecosystems in a locked D67 sequence — R&D would be inserted as Step 3 (between
Skills and Hooks) per user decision, requiring a D67 amendment.

**User-approved pre-decisions:**

1. Insert as Step 3 in D67 sequence (earliest non-disruptive placement)
2. Expand T19 (`extensive_discovery_first`) to include tiered structure
3. Model routing: Sonnet default, Opus situational, Haiku out entirely
4. Full CANON-level governance — no cost concerns on quality

---

## Research Context

**Source:** `.research/research-discovery-standard/RESEARCH_OUTPUT.md`
**Depth:** L1 (Comprehensive) | **Agents:** 18 | **Findings:** 14 |
**Challenges:** 4 **Overall Confidence:** HIGH (internal), MEDIUM-HIGH
(external), MEDIUM (synthesis)

Key conclusions from research (verified — this is the same session's research):

1. SoNash already implements 12/12 external best practices at MODERATE-to-STRONG
   alignment. Gaps are in natural invocation and process unification, not
   fundamental capability.
2. Research invocation is entirely behavioral — zero hook enforcement (SQ6).
3. Confidence scales are incompatible across all 4 core systems (SQ1).
4. CL-PROTOCOL writes nothing to disk — no artifact persistence (SQ1).
   **[VERIFY: `ls .planning/*/cl-*.json 2>/dev/null | head -5`]**
5. 7 categories of research-worthy situations go undetected by hooks (SQ6).
6. `development-team.md` does not exist — compliance gap with CLAUDE.md
   Section 7. **[VERIFIED: Glob found 0 files matching
   `.claude/teams/development*`]**
7. Context7 MCP is only in 1 agent (`deep-research-searcher`), not the
   claimed 4. **[VERIFIED: Grep found only
   `.claude/agents/global/deep-research-searcher.md`]**
8. 2 formalized teams exist (audit-review-team, research-plan-team) with zero
   invocations in formalized form. **[VERIFIED: files exist at
   `.claude/teams/`]**

---

## Current State Assessment

### What Exists Today

**4 core R&D systems:**

| System           | Location                                      | Confidence Scale           | Artifact Persistence | Quality Gates |
| ---------------- | --------------------------------------------- | -------------------------- | -------------------- | ------------- |
| deep-research    | `.claude/skills/deep-research/`               | HIGH/MEDIUM/LOW            | `.research/<slug>/`  | 14            |
| deep-plan        | `.claude/skills/deep-plan/`                   | Not formalized             | `.planning/<slug>/`  | 7             |
| CL-PROTOCOL      | `.planning/plan-orchestration/CL-PROTOCOL.md` | HIGH/MEDIUM/LOW            | None to disk         | 12            |
| convergence-loop | `.claude/skills/convergence-loop/`            | Confidence score (numeric) | None to disk         | Per-caller    |

**Supporting infrastructure:**

- `user-prompt-handler.js`: 7 priority tiers (Security, Bug, DB, UI, Planning,
  Exploration, Testing). **No research detection at all.** Research would slot
  as Priority 5.5 between Planning and Exploration.
- `.research/` directory: 4 completed campaigns with `research-index.jsonl`.
  Structure is organic (per-topic folders with RESEARCH_OUTPUT.md +
  metadata.json).
- 26 project agents + global agents. 41 total.
- 2 team definitions. 0 formalized invocations.
- research-plan-team exists but has never been spawned.

### What Is Broken or Missing

1. **No shared vocabulary** — each system uses its own confidence labels and
   terminology. CL-PROTOCOL uses CONFIRMED/WEAKENED/FALSE-POSITIVE for findings
   but HIGH/MEDIUM/LOW for discovery confidence. convergence-loop uses a numeric
   score. deep-plan has no formalized scale.

2. **No research tier model** — the AI has no structured way to decide "this
   needs a quick lookup" vs "this needs a full campaign." CLAUDE.md Section 7
   lists triggers but doesn't classify by research depth.

3. **No hook-based research detection** — 7 categories of research-worthy
   situations go undetected. The word "research" appears nowhere in any hook.

4. **CL-PROTOCOL has no skill file** — it's a protocol document embedded in
   `.planning/plan-orchestration/`. Not a standalone skill, not discoverable via
   skill patterns, not auditable by skill-audit.

5. **No artifact persistence for CL-PROTOCOL or convergence-loop** — findings
   are produced but not written to disk in a structured format.

6. **Context7 is severely underdeployed** — only 1 agent has it. Should be in
   every agent that does research or lookup work.

7. **development-team.md doesn't exist** — CLAUDE.md Section 7 references
   "Development team" as a PRE-TASK trigger but there's no definition file.

8. **No R&D ecosystem in CANON** — not registered, no health checker, no
   enforcement manifest, no maturity assessment.

### What Works Well (Do Not Break)

1. deep-research's 5-phase pipeline with contrarian/OTB challenges
2. deep-plan's exhaustive discovery-first approach
3. CL-PROTOCOL's mandatory opus + contrarian verification
4. convergence-loop's composable multi-pass design
5. `.research/` directory convention with research-index.jsonl
6. The CLAUDE.md Section 7 trigger table (behavioral, but functional)
7. research-plan-team's 3-member coordination model (untested but well-designed)

---

## Reframe Check

**Is this task what it appears to be?**

Yes — but with an important nuance. The research recommended a "Phase 0 MVS"
approach (minimal behavioral protocol first). The user explicitly rejected that
framing: they want full CANON-level governance, above-and-beyond quality, and no
cost concerns. This means the implementation scope is closer to the research's
"Option C: Full ecosystem" than the recommended "Option A: Minimal behavioral."

The task is: design and plan a CANON-governed R&D ecosystem that standardizes
how research is triggered, classified, executed, verified, and persisted across
all skills, agents, and hooks in SoNash.

---

## Key Dependencies

| Dependency                 | Status      | Impact on R&D Plan                           |
| -------------------------- | ----------- | -------------------------------------------- |
| SWS Phase 0 completion     | IN_PROGRESS | R&D is Phase 3 Step 3; Phase 0-2 must finish |
| CANON Foundation (Phase 1) | NOT_STARTED | R&D needs `.canon/ecosystems.jsonl` to exist |
| Skills ecosystem (#2)      | NOT_STARTED | R&D depends on skill conventions from #2     |
| D67 amendment              | NEEDED      | Must formally insert Step 3 before execution |
| T19 expansion              | NEEDED      | Tenet wording change needed before/during    |

**Implication:** This deep-plan produces the design and implementation plan now.
Execution is gated on SWS Phases 0-2 completing and Steps 1-2 (CANON, Skills)
standardizing first. The plan can be ready to execute when its turn arrives.
