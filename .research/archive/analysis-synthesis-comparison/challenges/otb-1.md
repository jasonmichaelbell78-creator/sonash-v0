# OTB Challenges: Analysis-Synthesis Comparison (First Half)

**OTB Agent:** 1 **Date:** 2026-04-06 **Scope:** Executive Summary through
Scoring & Evaluation (D01-D04 + D07-D08)

---

## Summary Table

| ID      | Alternative                                | Type                | Relevance | Feasibility | Recommendation                                            |
| ------- | ------------------------------------------ | ------------------- | --------- | ----------- | --------------------------------------------------------- |
| OTB-1-A | Unified analysis skill with domain plugins | unconsidered arch   | HIGH      | MEDIUM      | Future consideration; trigger = 5th target type           |
| OTB-1-B | Schema-as-code replaces schema-as-docs     | adjacent-domain     | HIGH      | HIGH        | Investigate now — Zod schemas for analysis/synthesis.json |
| OTB-1-C | Shared CONVENTIONS.md as convergence layer | hybrid              | HIGH      | HIGH        | Adopt for shared conventions layer                        |
| OTB-1-D | Synthesis as a phase, not separate skill   | reframing           | MEDIUM    | LOW         | Do not adopt; clean boundary is correct                   |
| OTB-1-E | Maintenance burden as the real problem     | missing stakeholder | HIGH      | HIGH        | Audit drift rate before executing convergence spec        |
| OTB-1-F | Depth flags as shared CLI contract         | adjacent-domain     | MEDIUM    | HIGH        | Future consideration; do simple fix now                   |
| OTB-1-G | IR-based convergence scoring for repos     | adjacent-domain     | MEDIUM    | MEDIUM      | Future; adopt simplified 3-tier manual system first       |

---

## OTB-1-A: Unified Analysis Skill with Domain Plugins

**Type:** unconsidered architecture | **Relevance:** HIGH | **Feasibility:**
MEDIUM

The research treats 4 separate skills as given and asks how to align them.
Adjacent systems (ESLint, SonarCloud, GitHub Actions) solve "same framework,
different targets" with a single core engine and target-specific plugins. A
unified `/analyze --type=website|repo` would eliminate structural drift by
construction.

The research found 3 perfectly unified conventions and 20+ convergence
recommendations. A large shared core with small domain deltas is exactly the
signal that a plugin architecture fits better than 4 sibling files.

**Risk:** Domain deltas are not trivial (Expedition mode, clone safety, TDMS,
Adoption Lens). Merging skills at different maturity levels (v4.2 vs v1.0) would
freeze the advanced one or rush the younger ones. Migration cost for 8 files and
130+ documented decisions is high.

**Recommendation:** Note as future consideration. Trigger: if a 5th target type
is added and the same drift recurs.

---

## OTB-1-B: Schema-as-Code Replaces Schema-as-Documentation

**Type:** adjacent-domain | **Relevance:** HIGH | **Feasibility:** HIGH

The research's most critical finding is schema drift — REFERENCE.md v2.0 schema
doesn't match v4.2 runtime. The recommended fix (update REFERENCE.md) is the
same fix that created the drift. Adjacent solution: Zod schemas or TypeScript
interfaces for analysis.json, synthesis.json, findings.jsonl. The prose
description becomes generated from the schema, not handwritten.

The project already uses Zod 4.3.6 and strict TypeScript. Infrastructure exists.
Schema drift becomes a type error caught at write time, not discovered months
later when repo-synthesis silently consumes mismatched artifacts.

**Limitation:** Skills are invoked by agents reading prose, not code imports.
Validation requires a separate script or hook.

**Recommendation:** Investigate now. Write Zod schemas for the two critical
artifacts. Add validate-artifact.ts script. HIGH-feasibility, directly
eliminates most critical gap.

---

## OTB-1-C: Shared CONVENTIONS.md as the Convergence Layer

**Type:** hybrid | **Relevance:** HIGH | **Feasibility:** HIGH

The research recommends copying patterns from better skills to weaker ones.
Every copy creates a new divergence point. Alternative:
`.claude/skills/shared/CONVENTIONS.md` as single canonical source for shared
conventions. All 4 SKILL.md files reference it explicitly.

Content: (1) phase marker format, (2) write-to-disk-first rule, (3)
conversational prose mandate, (4) 4-band scoring scale + bands-over-numbers, (5)
fit scoring thresholds, (6) SKILL.md/REFERENCE.md split principle.

Each skill gets one header line: "Shared conventions: see
`.claude/skills/shared/CONVENTIONS.md`." Low effort, high leverage on drift
prevention.

**Recommendation:** Adopt for the shared conventions layer. This is a concrete,
low-effort action that prevents re-divergence of the 3 perfectly unified
conventions.

---

## OTB-1-D: Synthesis as a Phase, Not Separate Skill

**Type:** reframing | **Relevance:** MEDIUM | **Feasibility:** LOW

On 3rd invocation of `/repo-analysis`, detect prior artifacts and offer
"Synthesize across all?" as integrated option. Eliminates context switch between
analysis and synthesis.

**Critical flaw:** Synthesis skills aggregate across multiple prior sessions,
not just current session. Cross-session aggregation is the core value.
Collapsing loses that. Additionally, a future cross-type synthesizer cannot
exist if synthesis is embedded in each analysis skill.

**Recommendation:** Do not adopt. The auto-offer trigger could be enhanced
(offer synthesis after 3rd analysis) without collapsing the architecture.

---

## OTB-1-E: The 4-Skill Maintenance Burden as the Real Problem

**Type:** missing stakeholder perspective | **Relevance:** HIGH |
**Feasibility:** HIGH

The research compares skills against each other from design quality. It does not
ask: what does it cost to maintain 4 separate files over time? The 20+
cross-pollination recommendations imply maintenance is already failing —
patterns evolved in one skill don't propagate to siblings. This is not a
one-time alignment problem. It is a structural maintenance tax that recurs with
every new pattern.

If repo-analysis went from v1.0 to v4.2 in one year, how many of the 20+
alignment recommendations will diverge again in the next 12 months?

**Recommendation:** Before executing the full convergence spec, quantify the
drift rate: how many of the 20+ recommendations are re-divergences of previously
aligned patterns vs genuinely new gaps? If >50% are re-divergences, the
copy-based model is already failing and structural solutions (OTB-1-C, OTB-1-B)
should be prioritized.

---

## OTB-1-F: Depth Flags as Shared CLI Contract

**Type:** adjacent-domain | **Relevance:** MEDIUM | **Feasibility:** HIGH

The flag inconsistency (`--standard` vs `--depth=standard`) is one symptom.
Adjacent solution: a CLI contract schema per skill (JSON or front matter)
declaring supported flags, required arguments, output paths, schema version.
Inconsistency becomes detectable via tooling rather than manual audit.

**Recommendation:** Future consideration. The simpler fix (update
website-analysis flags) should be done now. Contract schema worth considering
when a 5th skill is added.

---

## OTB-1-G: IR-Based Convergence Scoring for Repos

**Type:** adjacent-domain | **Relevance:** MEDIUM | **Feasibility:** MEDIUM

The research recommends adapting T1-T4 tiers to repos. Information retrieval
literature has solved weighted evidence aggregation with approaches that derive
source authority from data (stars, forks, commit frequency, contributor count)
rather than requiring pre-assigned tiers.

**Limitation:** Repo metadata signals are noisy (stars correlate with hype, not
quality). Adding algorithmic scoring to a prose-driven skill is complex.

**Recommendation:** Future consideration. Adopt simplified 3-tier manual system
(research/primary, curated-list, unknown) for repo-synthesis in the near term.
