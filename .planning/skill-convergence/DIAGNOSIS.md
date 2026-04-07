# Diagnosis: Analysis/Synthesis Skill Convergence

**Date:** 2026-04-06 **Source:** `.research/analysis-synthesis-comparison/` (L1
depth, 21 agents, 60 claims, convergence-loop verified)

---

## ROADMAP Alignment

**Aligned (new direction).** No explicit ROADMAP item covers skill convergence.
However, the OS vision (MEMORY.md `user_os_vision.md`) makes skill portability a
primary goal. Skill convergence is a prerequisite for portable skills.

---

## Research Context

Full L1 research completed this session. Key verified findings:

### What's Unified (protect these)

- Phase transition markers (`========== PHASE N: [NAME] ==========`)
- Write-to-disk-first rule
- Conversational prose mandate
- 4-band scoring scale (Critical/Needs Work/Healthy/Excellent)
- Fit scoring thresholds (active-sprint/park-for-later/evergreen/not-relevant)

### Critical Gaps (fix immediately)

1. repo-analysis REFERENCE.md schema drift (v2.0 spec vs v4.2 runtime)
2. website-synthesis has no self-audit (weakest data integrity)
3. repo-synthesis has no convergence scoring formula

### Convergence-Loop Corrections (post-research)

- C-003: Per-dimension anchor (repo-analysis = runtime, website-analysis = docs)
- C-049: REFUTED — only analysis skills load all 5 home context sources
- C-052: REFUTED — session-begin does NOT read research-index.jsonl
- C-053: REFUTED — cross-type schema alignment is one-sided (website-synthesis
  only)
- C-040: VERIFIED — critical rules counts exact (10/8/5/8)
- C-058: VERIFIED — T1-T4 weighting confirmed in 5 locations

### OTB Alternatives Worth Pursuing

- **OTB-1-B: Schema-as-code** (Zod validation) — HIGH impact, HIGH feasibility
- **OTB-1-C / OTB-2-B: Shared conventions/behavior library** — prevents re-drift
- **OTB-2-E: OS portability audit** — tag items
  PORTABLE/CONFIGURABLE/SONASH-SPECIFIC
- **OTB-2-F: Runtime schema validation** — self-reporting errors

### Contrarian Corrections

- "Anchor" is per-dimension, not wholesale repo-analysis
- Schema drift may be runtime contract violation, not just docs
- Convergence formula cross-pollination needs repo-native adaptation
- "Paradox" framing incorrect — divergence is design-appropriate

---

## Reframe Check

The task IS what it appears: aligning 4 skills based on comprehensive research.
However, the OTB challenges raise a structural question: should this be a
**copy-based alignment** (cross-pollinate features between skills) or a
**structural convergence** (shared behavior library + schema-as-code)?

The copy-based approach is faster but creates re-drift. The structural approach
is more durable but requires new infrastructure.

This is the central design decision for Discovery.

---

## Scope Dimensions

| Dimension                             | Items        | Effort |
| ------------------------------------- | ------------ | ------ |
| Priority 1: Critical gaps             | 5 items      | M      |
| Priority 2: Structural alignment      | 5 items      | M      |
| Priority 3: Feature cross-pollination | 10 items     | L      |
| OTB structural alternatives           | 4 items      | M-L    |
| **Total**                             | **24 items** | **XL** |

The full scope is XL. The plan should identify which items to do now vs defer.
