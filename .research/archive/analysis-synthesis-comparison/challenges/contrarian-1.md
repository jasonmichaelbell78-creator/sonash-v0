# Contrarian Challenges: Claims C-001 through C-030

**Agent:** Contrarian-1 **Date:** 2026-04-06 **Scope:** Claims C-001 to C-030
**Methodology:** Pre-mortem framing + steel-man critique **Total challenges:** 9

---

## Summary

| Severity | Count |
| -------- | ----- |
| Critical | 4     |
| Major    | 5     |

---

## CH-01-001 | CRITICAL | C-003

**Target:** "repo-analysis is the structural anchor of the family"

**Counter-argument:** Size and age are poor proxies for design quality. The
evidence actually argues website-analysis is the documentation quality
reference:

- website-analysis has the highest SKILL:REFERENCE ratio (1:8.15) — most
  thorough specification
- Only skill with a Decision Coverage Map (36 decisions mapped)
- Formal 9-dimension MUST self-audit vs repo-analysis artifact checklist
  (weakest)
- repo-analysis has internal version drift (REFERENCE.md v4.0 vs SKILL.md v4.2)

**Recommendation:** Modify claim. repo-analysis is the de-facto runtime
precedent. website-analysis is the documentation quality reference. Convergence
direction should be per-dimension, not wholesale.

---

## CH-01-002 | MAJOR | C-004

**Target:** "SKILL:REFERENCE ratio difference is a philosophy difference"

**Counter-argument:** The synthesis skills are newer (v1.0-v1.2) and less
documented. The ratio difference may reflect document maturity, not deliberate
philosophy. As synthesis skills mature and add specification sections, their
ratios will converge toward analysis-skill levels.

**Recommendation:** Modify claim — add maturity caveat. Track ratio evolution
across versions.

---

## CH-01-003 | MAJOR | C-009

**Target:** "repo-synthesis Phase 2.5 Verification Pass has no equivalent"

**Counter-argument:** website-analysis has a 9-dimension MUST Self-Audit at a
different phase position that serves the same verification function with greater
rigor. The T20 tally is actually weaker (4 categories) than website-analysis's
9-dimension audit (orphan detection, schema integrity, regression comparison).
"No equivalent" is technically true for the specific format but functionally
misleading.

**Recommendation:** Modify — change "has no equivalent" to "has no mid-synthesis
equivalent." Compare T20 tally vs 9-dimension audit as two competing patterns.

---

## CH-01-004 | CRITICAL | C-012

**Target:** "Clean architectural boundary — synthesis skills read, don't
re-analyze"

**Counter-argument:** This boundary will erode when synthesis skills encounter
thin analysis artifacts (e.g., Quick Scan depth repos in a 6-repo synthesis).
The "correct" behavior would be to deepen analysis first — violating the
no-agents boundary. repo-synthesis's Warm-Up already estimates "effort" based on
artifact quality, which is one step from conditional re-analysis.

**Recommendation:** Modify — reframe as "design guideline with known pressure
points" not "permanent architectural boundary." Add 6-month re-evaluation
trigger.

---

## CH-01-005 | CRITICAL | C-017

**Target:** "agent_budget.allocated field in tension with no-budget-tracking
rule"

**Counter-argument:** The research assumes the state schema field should be
removed. But it may be the reverse: if runtime state files actually write
`allocated` on every run, the behavioral rule is already being violated. The
correct fix depends on whether the runtime or the spec is stale — and D05
already confirmed multiple cases of REFERENCE.md diverging from runtime.

**Recommendation:** Investigate further. Verify actual runtime state files
before choosing remediation direction. Downgrade confidence to MEDIUM.

---

## CH-01-006 | MAJOR | C-022

**Target:** "website-synthesis has convergence formula; repo-synthesis has none"

**Counter-argument:** T1-T4 source tier weighting was designed for epistemically
variable web content. Repos are first-party artifacts — the code IS the truth,
not a claim about the truth. Applying source tier weighting to repos requires
defining "T1 repo" vs "T4 repo" — a concept that doesn't cleanly map.
Over-engineering convergence for repos may add complexity without signal.

**Recommendation:** Modify claim — cross-pollination requires designing a
repo-native trust hierarchy first. Adding website-synthesis's formula without
adaptation would force an inapplicable model.

---

## CH-01-007 | CRITICAL | C-024

**Target:** "repo-analysis REFERENCE.md schema doesn't match v4.2 runtime"

**Counter-argument:** The research assumes runtime is authoritative and docs
need updating. But two other interpretations exist:

1. Runtime drifted incorrectly from an approved spec — the fix is to update
   runtime back toward spec
2. The v4.2 schema is a breaking change that was never formally approved — if
   repo-synthesis reads the old `extraction_candidates[]` field, its consumption
   logic is silently broken NOW

The research's own summary says "repo-synthesis consumes these artifacts and
will fail silently on schema mismatches." This is potentially a runtime contract
violation, not documentation debt.

**Recommendation:** Modify claim — verify repo-synthesis Phase 1 consumption
code against actual file schemas BEFORE updating any docs. Different diagnosis
leads to different fix.

---

## CH-01-008 | MAJOR | C-026

**Target:** "extraction-journal.jsonl has incompatible paths"

**Counter-argument:** website-analysis's root placement (`.research/`) is
documented as intentional design (Decision #8 in Decision Coverage Map) — these
are cross-type shared artifacts. repo-analysis's subdirectory placement is
undocumented. The conflict resolution is not symmetric — documented decisions
should be treated as more intentional than undocumented ones. Canonical location
should be root.

**Recommendation:** Modify — adopt website-analysis root placement as canonical,
update repo-analysis to align.

---

## CH-01-009 | MAJOR | C-030

**Target:** "Paradox: companion has more analytical rigor"

**Counter-argument:** Web content is epistemically weaker than code repos. A
GitHub repo IS the source of truth for its code. A website is ABOUT a topic —
quality depends on provenance, citations, independence. T1-T4 scoring,
convergence formula, and independence verification exist precisely because web
sources need more skepticism. The "paradox" vanishes when framed as
design-appropriate rigor for the source material type.

**Recommendation:** Remove "paradox" framing. Restate as: "divergence by
design-appropriate priority." Cross-pollination should validate whether the
problem each feature solves exists in the target domain before recommending
adoption.

---

## Overall Assessment

The research is directionally sound. Highest-risk failure modes:

1. **"repo-analysis as anchor" narrative** may drive convergence in the wrong
   direction — website-analysis is the documentation quality reference
2. **C-024 schema drift** is treated as documentation debt but may be a runtime
   contract violation requiring code fixes in repo-synthesis Phase 1 aggregation
   logic
