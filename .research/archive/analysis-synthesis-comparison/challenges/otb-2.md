# OTB Challenge 2: Alternative Framings for the Analysis-Synthesis Skill Family

**Challenger:** OTB Agent 2 **Date:** 2026-04-06 **Focus:** Synthesis design,
Integration, Decision Matrix, Convergence Design Spec

---

## Summary Table

| ID      | Alternative                             | Type            | Relevance | Feasibility | Recommendation                                    |
| ------- | --------------------------------------- | --------------- | --------- | ----------- | ------------------------------------------------- |
| OTB-2-A | Cross-type synthesis as design driver   | reframing       | HIGH      | MEDIUM      | Investigate before finalizing convergence roadmap |
| OTB-2-B | Shared skill behavior library           | inverted        | HIGH      | MEDIUM      | Pilot with convergence scoring + self-audit       |
| OTB-2-C | User-context-driven feature activation  | adjacent-domain | MEDIUM    | MEDIUM      | Note as future; preserve home context loading     |
| OTB-2-D | Collapse to 2 domain skills             | simpler         | MEDIUM    | LOW         | Do not pursue; document cross-session rationale   |
| OTB-2-E | OS portability inverts convergence goal | reframing       | HIGH      | HIGH        | Portability audit before finalizing spec          |
| OTB-2-F | Runtime schema validation as primitive  | newer           | HIGH      | MEDIUM      | Pilot scoped to repo-synthesis VALIDATE phase     |

---

## OTB-2-A: Cross-type synthesis as the primary design driver

**Type:** reframing | **Relevance:** HIGH | **Feasibility:** MEDIUM

The research treats `/cross-synthesis` (repos + websites together) as a "planned
future feature." The alternative: treat it as the _design anchor_. If the four
skills must eventually feed a single cross-type synthesizer, the question shifts
from "how do we align these skills internally?" to "what does a cross-type
synthesizer need, and do the four skills produce that?"

This reframing immediately elevates the artifact path conflict from cleanup to
blocking prerequisite. It forces a unified source quality model before other
alignment work. It also reveals that the research never answered: what would
cross-type synthesis produce that neither individual synthesizer can?

**Risk if wrong:** Cross-type synthesis may not be meaningful — websites and
repos serve different analytical purposes. A combined synthesis might dissolve
both into lowest-common-denominator output.

**Recommendation:** Draft what cross-type synthesis output would contain. If no
compelling answer, descope from design-driver position. If compelling,
reprioritize Convergence Design Spec around it.

---

## OTB-2-B: Shared skill behavior library — composition over convention alignment

**Type:** inverted | **Relevance:** HIGH | **Feasibility:** MEDIUM

The Convergence Design Spec copies 10+ behaviors across skills (warm-up, T20
tally, convergence scoring, retro persistence, etc.). Each creates two copies
that will diverge again over time. The alternative: extract into a shared
`.claude/skill-behaviors/` library that skills reference, not duplicate.

Components: `convergence-scoring.md`, `self-audit-phase.md`, `retro-loop.md`,
`artifact-guard.md`, `fit-classification.md`. Each skill declares:
`Uses: convergence-scoring, self-audit-phase, retro-loop`.

This addresses the root cause of inconsistency (independent evolution) and is an
OS-portable primitive transferable to any repository. The limitation is that
skills are Markdown docs, not code — there is no import mechanism. The
composition model works as convention only.

**Recommendation:** Pilot with convergence scoring + self-audit before executing
all 10 cross-pollination items.

---

## OTB-2-C: User-context-driven feature activation

**Type:** adjacent-domain | **Relevance:** MEDIUM | **Feasibility:** MEDIUM

Instead of always-on feature parity, phases activate based on user context. All
four skills already load 5 home context sources before Creator View — this is
the seed. Extension: SESSION_CONTEXT.md content drives which phases run and at
what depth.

Examples: active sprint focused on specific tech -> Adoption Lens more
prominent; 3+ prior syntheses -> warm-up includes cross-run retrospective; repo
analyzed 6 weeks ago -> drift-detection instead of fresh analysis.

**Risk:** Context signals may be unreliable (SESSION_CONTEXT.md is manual).
Silent phase skipping reduces auditability.

**Recommendation:** Note as future consideration. Preserve home context loading
as foundation.

---

## OTB-2-D: Collapse to 2 domain skills (analysis + synthesis per domain)

**Type:** simpler | **Relevance:** MEDIUM | **Feasibility:** LOW

One skill per domain with synthesis as a conditional phase. This is how
`/deep-research` works — one skill with convergence phase, not two separate
skills. Would eliminate the context switch between analysis and synthesis
routing.

**Critical flaw:** Synthesis skills aggregate across multiple prior analysis
runs, not just the current session. Cross-session aggregation is the primary
value of synthesis skills — eliminating it to simplify architecture is the wrong
trade.

**Recommendation:** Do not pursue. Document cross-session aggregation as the
canonical rationale for the four-skill split.

---

## OTB-2-E: OS portability inverts the convergence goal

**Type:** reframing | **Relevance:** HIGH | **Feasibility:** HIGH

The user's primary goal is a project-agnostic "Claude Code OS." Under the OS
lens, the convergence question shifts: not "align these skills with each other"
but "which features are portable, which need configuration, which are
SoNash-specific?"

Portability classification for each Decision Matrix item:

- Retro persistence: PORTABLE — high convergence value for OS
- TDMS integration to website-analysis: SONASH-SPECIFIC — needs portability
  wrapper
- research-index.jsonl session-begin: CONFIGURABLE — needs project-agnostic
  paths
- T1-T4 convergence scoring: PORTABLE — evidence quality weighting is
  domain-agnostic

The three unified conventions (phase markers, write-to-disk-first,
conversational prose) may already be the sufficient portable core.
Domain-specific features are intentional divergences, not gaps.

**Recommendation:** Run portability audit on Decision Matrix before finalizing
spec. Tag each item PORTABLE / CONFIGURABLE / SONASH-SPECIFIC. Single-session
exercise with high signal value.

---

## OTB-2-F: Runtime schema validation as a design primitive

**Type:** newer | **Relevance:** HIGH | **Feasibility:** MEDIUM

Schema drift is treated as a documentation problem — update REFERENCE.md to
match runtime. The alternative: make the error class self-reporting via runtime
validation. A lightweight script at
`.claude/skill-schemas/validate-artifacts.js` checks field presence, field
names, and schema version in consumed artifacts before the skill proceeds.

repo-synthesis already partially does this: checks `skillVersion` in
analysis.json. The gap is checking schema structure, not just version. A full
check would catch: `description` vs `detail`, `schema_version` vs `version`,
4-typed-array vs deprecated `extraction_candidates[]`.

Zod is already in the SoNash stack (v4.3.6). A lightweight field-presence check
via Node.js JSON parsing is feasible without full Zod import.

**Recommendation:** Pilot scoped to repo-synthesis VALIDATE phase for the
critical schema drift gap. If it works, extend to website-synthesis input
validation.
