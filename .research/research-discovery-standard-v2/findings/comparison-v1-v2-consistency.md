# Consistency Check: v1 vs v2

**Agent:** deep-research-searcher (consistency mode) **Date:** 2026-04-04
**Purpose:** Identify contradictions, tensions, and inconsistencies between v1
(2026-03-24 R&D Standard) and v2 (2026-04-04 Supplemental Gaps)

---

## Scope Clarification (Read First)

Before comparing claims, it is essential to understand what these two documents
cover — because their scopes differ substantially.

**v1** (`research-discovery-standard/RESEARCH_OUTPUT.md`) answers: "What should
a Research & Discovery Standard look like for SoNash?" It produces 10 design
decisions (D1-D10) about the standard's architecture: tier model, confidence
labels, CL-PROTOCOL independence, team spawning policy, parallelization caps,
multi-agent thresholds, CANON placement, enforcement sequence, model routing,
and verification granularity.

**v2** (`research-discovery-standard-v2/RESEARCH_OUTPUT.md`) answers: "How do we
implement the /rnd pipeline mechanics that were chosen in Direction E from the
brainstorm?" It produces its own 8 design decisions (labeled D1-D8 in v2,
covering state machine, auto-advance, cross-project findings flow, /todo UX
split, schema versioning, dashboard integration, scouting governance, and CL
integration). These D1-D8 are about pipeline implementation, not the R&D
standard architecture.

**The naming collision is the most important structural finding of this check.**
v1 D1-D10 and v2 D1-D8 use the same labels (D1, D2...) for completely different
decisions. This is terminology drift, not contradiction. Anyone reading v2 must
know that "D3" in v2 refers to the cross-project findings flow design, not to
CL-PROTOCOL independence (which is v1 D3). v2 acknowledges this and uses an
explicit citation correction ("D3 per dispute-resolutions.md Resolution 2 — the
independence decision is D3 in the original RESEARCH_OUTPUT.md") at lines 335
and 439.

---

## Direct Contradictions

### None found.

No direct claim in v2 asserts the negation of a claim in v1. This is true even
where v2 extends or adds nuance to v1 findings. The absence of contradictions is
genuine — not a failure to look. Specific searches conducted:

- CL-PROTOCOL independence: v1 D3 = "keep independent." v2 SQ8 = "D3
  independence decision must be respected" (line 335). No contradiction.
- Confidence labels: v1 D2 = "unified labels, per-system assignment." v2 makes
  no claim about confidence labels (outside v2's own internal confidence ratings
  for its findings). No contradiction.
- Four tiers: v1 D1 = "4 tiers with soft boundaries." v2 references "T0-T3" tier
  obligation levels in SQ8 (line 349) and does not propose a different tier
  count. No contradiction.
- Max 4 parallel agents: v1 D5. v2 does not discuss parallelization caps at all.
  No contradiction.
- Sonnet floor: v1 D9. v2 does not discuss model routing. No contradiction.

---

## Decision Honoring (v1 D1-D10 vs v2)

| v1 Decision                                                           | v2 Treatment                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Consistent?                                    | Evidence                                                                                                                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1: Four tiers with soft boundaries (T0-T3)**                       | v2 uses T0-T3 vocabulary in SQ8's CL obligation table (line 349: "D11 mandates verifications at ALL tiers (T0-T3)"). The tier model is assumed, not redesigned.                                                                                                                                                                                                                                                                                                  | YES                                            | v2 SQ8 line 349, stage-by-stage CL table uses tier labels                                                                                                        |
| **D2: Unified confidence LABELS, per-system assignment**              | v2 does not revisit or alter the confidence label system. v2's own findings use HIGH/MEDIUM/LOW/UNVERIFIED in the same pattern.                                                                                                                                                                                                                                                                                                                                  | YES (implicit)                                 | v2 methodology section: "Confidence: Overall HIGH. The vast majority of findings are grounded in direct codebase inspection or 2+ independent external sources." |
| **D3: CL-PROTOCOL stays independent from convergence-loop**           | v2 SQ8 explicitly names this as "D3 independence decision must be respected" and "CL-PROTOCOL = policy; /convergence-loop = execution" (line 335). The decision is the backbone of SQ8's architectural framing. Also explicitly confirmed in v2 Cross-References section (line 439).                                                                                                                                                                             | YES — actively honored and cited               | v2 lines 335, 370, 439                                                                                                                                           |
| **D4: Teams opt-in with controlled experiments, NOT opt-out**         | v2 does not address team spawning at all. Out of scope.                                                                                                                                                                                                                                                                                                                                                                                                          | N/A                                            | v2 scope is /rnd pipeline mechanics, not team defaults                                                                                                           |
| **D5: Max 4 parallel agents per wave**                                | v2 does not discuss agent parallelization. Out of scope for the 8 implementation sub-questions.                                                                                                                                                                                                                                                                                                                                                                  | N/A                                            | v2 methodology: "8 parallel searcher agents, one per sub-question" — this is a process description, not a decision about the R&D standard                        |
| **D6: Raise multi-agent threshold for T2 (4+ sub-questions)**         | v2 does not address sub-question thresholds for multi-agent spawning. Out of scope.                                                                                                                                                                                                                                                                                                                                                                              | N/A                                            | —                                                                                                                                                                |
| **D7: R&D as standalone CANON ecosystem**                             | v2 does not discuss CANON registration or the SWS D67 amendment. Out of scope. However, v2 does design the /rnd pipeline in a way compatible with future CANON registration (uses JSONL-first, declarative configs, health-checker-friendly schema). No conflict with CANON placement.                                                                                                                                                                           | N/A (compatible)                               | —                                                                                                                                                                |
| **D8: Behavioral enforcement first, automated enforcement last**      | v2's auto-advance architecture (SQ2) recommends a lazy scan + FileChanged hook — this is automated enforcement. However, it is architectural infrastructure for the /rnd pipeline itself, not the enforcement sequence for the R&D standard. These are different domains: D8 governs how the R&D standard rolls out (behavioral before hooks); v2 SQ2 governs how the /rnd pipeline detects stage completions. No contradiction in domain.                       | YES (different domain, no conflict)            | v2 SQ2 auto-advance is pipeline plumbing; v1 D8 is standard rollout sequencing                                                                                   |
| **D9: Model routing uses Sonnet as floor**                            | v2 does not discuss model routing at all.                                                                                                                                                                                                                                                                                                                                                                                                                        | N/A                                            | —                                                                                                                                                                |
| **D10: Verification is per-finding adaptive, not blanket tier-level** | v2 SQ8's CL integration uses tier-scaled obligation (MUST/SHOULD/MAY per stage transition) — this is coarser than per-finding adaptive verification but operates at a different layer (pipeline transition gates, not individual research findings). The two are compatible: per-finding adaptive verification governs how individual claims are verified within a research run; tier-scaled CL obligation governs which transitions require a convergence loop. | YES (different granularity levels, compatible) | v2 SQ8 stage-by-stage table at line 354                                                                                                                          |

**Summary: 3 decisions actively honored (D1, D2, D3), 5 out of scope for v2 (D4,
D5, D6, D7, D9), 2 operating at a different layer but compatible (D8, D10).**

---

## Terminology Drift

### Issue 1: "D" numbering collision (HIGH priority for documentation consumers)

v1 uses D1-D10 for 10 decisions about the R&D Standard architecture. v2 uses
D1-D8 for 8 decisions about the /rnd pipeline implementation.

These are entirely different decision sets that happen to share labels. v2 is
aware of this and handles it via explicit citation strings ("the independence
decision is D3 in the original RESEARCH_OUTPUT.md:363") rather than assuming
local D3 = v1 D3. However, any reader of v2 who hasn't read this note will
assume "D3" refers to v2's cross-project findings flow decision. The
DECISIONS.md or synthesis document that consumes both will need to rename these
to avoid collision. Suggested convention: v1 decisions → RDS-D1 through RDS-D10;
v2 decisions → RND-D1 through RND-D8.

### Issue 2: "stage" used in two contexts

v1 uses "tier" (T0-T3) as the primary concept for research complexity levels. v2
uses "stage" (IDEA/BRAINSTORM/RESEARCH/PLAN/IMPLEMENT/TEST/COMPLETE) for
pipeline lifecycle position.

These are not in conflict — they refer to different things (research depth vs
project lifecycle position). But v2 SQ8's table (line 354) uses both "stage" and
tier-level obligation in the same table, which could be momentarily confusing.
The distinction is clear in context.

### Issue 3: "pre-verified" meaning

v1 D10 uses "per-finding adaptive" to mean each research finding gets
verification checks applied incrementally. v2 SQ8 uses "pre-verified" to mean a
skill-completed stage already ran CL internally, so the pipeline should not add
a redundant CL gate.

These are different senses of "verified" operating at different scopes
(individual claim vs stage transition). Not contradictory, but documentation
should clarify which sense is intended in mixed contexts.

### Issue 4: "Phase" numbering

v1 implementation strategy uses "Phase 0" (MVS), "Phase 1" (Foundation), "Phase
2" (Verification & Tools), "Phase 3" (CANON Registration). v2 references "Phase
2 scouting" as a phase of the /rnd pipeline (SQ7 Scouting Governance).

These "Phase 2"s are completely different things. v1's Phase 2 = second rollout
phase of the R&D standard. v2's Phase 2 = scouting phase within the /rnd
pipeline. No content conflict, but the shared label is a documentation
maintenance risk.

---

## Confidence Mismatches

No direct confidence mismatches on shared claims were found. The two documents
make claims at different levels of specificity:

- v1 makes claims about the R&D Standard architecture at HIGH confidence (based
  on 18-agent, 5-wave investigation).
- v2 makes claims about /rnd pipeline implementation at HIGH confidence (based
  on 8-agent codebase-primary investigation).

The one overlap worth noting: v1 states CL-PROTOCOL independence is justified at
HIGH confidence (W5a-C5, Risk profile "LOW likelihood / HIGH impact"). v2
confirms D3 independence with no confidence downgrade. Consistent.

---

## Temporal Tensions (v1 predates v2 capabilities)

### Tension 1: v1 did not know about the /rnd pipeline as a concrete design direction

v1 was written when the "Direction E (Phased Hybrid)" brainstorm choice had not
yet been made concrete. v1 treats the R&D standard as a behavioral + skill +
hook system (CLAUDE.md guardrail, hooks, RDS-PROTOCOL.md). v2 assumes Direction
E is chosen and specs the /rnd pipeline.

This creates an apparent asymmetry: v1 spends significant effort on hook-based
research detection (Section 7) and behavioral guardrails; v2 designs a
stage-tracking system that integrates with `/todo`. These are not contradictory
— they operate at different levels — but the two documents, taken together,
imply a richer system than either describes alone. v1's hook detection layer
(Priority 5.5 in user-prompt-handler.js) is the "research invocation" layer;
v2's /rnd pipeline is the "research lifecycle tracking" layer.

**Resolution needed:** A synthesis document should explicitly describe how these
two layers interact. When a /rnd project is in RESEARCH stage, does the hook
detection layer still operate? Presumably yes, since hooks detect individual
prompt context while /rnd tracks overall project position.

### Tension 2: v1's Phase 0 MVS vs v2's full implementation spec

v1 explicitly recommends "launch as minimal behavioral protocol first, expand
only after measured value." The Phase 0 MVS is 1-2 sessions of behavioral work
(guardrail #15, CLAUDE.md update, hook hints, CL-PROTOCOL persistence).

v2 describes a full implementation spec for a multi-field JSONL schema
migration, FileChanged hook, build-rnd.js builder, 7th dashboard tab, and /rnd
view layer. This is Phase 1-3 territory in v1's implementation sequence.

This is a temporal tension, not a contradiction. v2 was written after the
brainstorm chose Direction E and committed to the /rnd pipeline. v2 is speccing
the "what to build" — which v1's Phase 0-3 structure was always intended to
gate. The two are compatible as long as the implementation sequence respects
v1's Phase 0 validation gate before building v2's components.

**Potential issue:** v2 does not reference v1's Phase 0 validation gate. If a
deep-plan is built from v2 alone, the implementation team might skip the Phase 0
behavioral validation step and jump straight to schema migrations and dashboard
builders. A synthesis should explicitly carry forward v1's "Phase 0 first"
constraint.

### Tension 3: v1's "7 detection gaps" and v2's auto-advance

v1 Section 2.5 identifies "G1: AI enters unfamiliar codebase area" and "G5:
multi-session project starting" as HIGH-impact gaps where research should happen
but does not. v2's /rnd pipeline addresses G5 (multi-session project tracking
via stage lifecycle) but not G1 directly. This is not a contradiction — v2's
scope was the pipeline mechanics, not hook detection — but the gap remains open
for the /rnd system: the pipeline tracks where a project IS, but does not yet
detect WHEN the AI should do research within it.

---

## Summary

| Category                                   | Count | Notes                                                                                              |
| ------------------------------------------ | ----- | -------------------------------------------------------------------------------------------------- |
| Direct contradictions                      | 0     | None found after systematic cross-referencing                                                      |
| Terminology drift issues                   | 4     | D-numbering collision (HIGH priority), stage/tier context, pre-verified sense, Phase numbering     |
| Decision contradictions                    | 0     | All v1 D1-D10 either honored, out of scope, or operating at a compatible layer                     |
| Confidence mismatches                      | 0     | No shared claims with differing confidence levels                                                  |
| Temporal tensions                          | 3     | Direction E scoping, Phase 0 validation gate at risk of being skipped, detection-gap G1 still open |
| v1 decisions actively honored              | 3     | D1 (four tiers), D2 (unified labels), D3 (CL independence)                                         |
| v1 decisions out of scope for v2           | 5     | D4, D5, D6, D7, D9                                                                                 |
| v1 decisions compatible at different layer | 2     | D8 (enforcement sequence), D10 (adaptive verification)                                             |

**Total contradictions: 0** **Total tensions: 3** **Total confident
consistencies: 10 of 10 v1 decisions checked**

---

## Recommended Resolutions

**R1 (HIGH priority — naming collision):** Before any synthesis or deep-plan
document is written, rename v1 decisions to RDS-D1 through RDS-D10 and v2
decisions to RND-D1 through RND-D8 throughout all research outputs. This
prevents the most likely downstream confusion.

**R2 (HIGH priority — Phase 0 gate carryforward):** The synthesis or deep-plan
must explicitly carry forward v1's Phase 0 validation gate. v2 specs components
that belong in v1 Phases 1-3. Any implementation plan built from v2 alone risks
skipping the "behavioral protocol first" constraint that the contrarian and OTB
agents in v1 specifically insisted on.

**R3 (MEDIUM priority — hook/pipeline interaction):** Document how v1's
hook-based research detection layer (Priority 5.5 in user-prompt-handler.js)
interacts with v2's /rnd lifecycle stage tracking. These are complementary, not
competing, but neither document describes their interaction.

**R4 (LOW priority — G1 gap):** v1 identified "AI enters unfamiliar codebase
area" as a HIGH-impact detection gap. v2 solves the project lifecycle tracking
problem but not the real-time detection gap. Flag this as an open item that
neither v1 nor v2 fully closes.

**R5 (LOW priority — Phase numbering):** Wherever "Phase 2" appears in combined
documents, annotate whether it refers to the R&D standard rollout phase (v1) or
the /rnd pipeline scouting phase (v2).
