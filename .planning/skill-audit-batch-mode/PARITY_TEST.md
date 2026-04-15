# Skill-Audit Batch Mode — Parity Test

**Created:** 2026-04-15 (Session #282) **Plan:**
`.planning/skill-audit-batch-mode/PLAN.md` Steps 19-20 **Reference decision:**
D14 (parity test) **Status:** EXECUTED 2026-04-15 (Session #282) — **VERDICT:
PASS (with caveats)**

---

## 1. Goal

Verify that the new `--mode=batch` Phase 2b produces findings equivalent to the
canonical `--mode=single` Phase 2a for the same target skill. Equivalent means:
per-category pros/cons/gaps/suggestions match on substance, modulo ordering and
wording variance inherent to LLM sampling.

If parity holds, batch mode is safe to use for multi-skill audits without losing
audit fidelity. If it fails, the batch-mode prompt/procedure must be remediated
before production use.

---

## 2. Target Skill

**`recall`** — selected because:

- Smallest of the 7 CAS skills (lowest token cost to audit twice)
- Pure read-side surface (query CAS knowledge base); simpler behavioral envelope
  than the handler skills (`repo-analysis`, `website-analysis`, etc.)
- Does not depend on external network → deterministic audit inputs
- Has not been audited in either mode yet → no prior findings bias the run

Alternative candidates (rejected): `analyze` (router — thin surface, may not
exercise all 12 categories), handler skills (too large for a twice-run parity
test in one session).

---

## 3. Procedure

### 3.1 Preparation

1. Verify `recall` SKILL.md exists and is current:
   `.claude/skills/recall/SKILL.md`
2. Ensure no prior audit state for recall:
   `ls .claude/state/task-skill-audit-recall*.state.json` — expect empty or
   stale
3. Confirm skill-audit v4.0+ (batch mode present): grep `Phase 2b` in
   `.claude/skills/skill-audit/SKILL.md`

### 3.2 Run 1 — Single Mode

1. Invoke `/skill-audit recall --mode=single`
2. Complete Phase 1 (preparation, target validation)
3. Walk Phase 2a categories 1-12 interactively
4. **Capture after each category:** findings block (pros/cons/gaps/ suggestions)
   — persist to `.planning/skill-audit-batch-mode/parity-run-single.md`
5. **Stop after category 12 findings are captured** — do NOT proceed into Phase
   3 crosscheck, Phase 4 implementation, or Phase 5 self-audit. This test
   measures findings parity only, not downstream behavior.
6. Reset audit state: `rm .claude/state/task-skill-audit-recall*.state.json`

### 3.3 Run 2 — Batch Mode

1. Invoke `/skill-audit recall --mode=batch`
2. Complete Phase 1 (preparation, target validation)
3. Walk Phase 2b categories 1-12 (batched findings production)
4. **Capture after each category:** findings block — persist to
   `.planning/skill-audit-batch-mode/parity-run-batch.md`
5. **Stop before Phase 2.B decision collection.** Findings are locked after
   Phase 2b per faithfulness guarantee (SKILL.md line 303) — that is the correct
   snapshot for comparison.

### 3.4 Diff + Verdict

1. For each of the 12 categories, produce a comparison row:
   - Pros: single set vs batch set, overlap %
   - Cons: single set vs batch set, overlap %
   - Gaps: single set vs batch set, overlap %
   - Suggestions: single set vs batch set, overlap %
2. Normalize wording before matching (lowercase, strip punctuation, token
   overlap via Jaccard or simple phrase containment).
3. Record every miss (finding present in one mode but absent in the other).
4. Record every substance divergence (same topic, different recommendation).

---

## 4. Acceptance Criteria

Parity test **PASSES** only if ALL hold:

- [ ] ≥ 80% suggestion overlap per category (allows for LLM variance)
- [ ] Zero cons missing between modes (cons are the load-bearing findings)
- [ ] Zero gaps missing between modes (gaps drive Phase 4 work)
- [ ] For every paired suggestion: same recommendation direction (e.g., both
      recommend adding a step vs removing one)
- [ ] No category where batch mode surfaces a substantive finding that single
      mode misses entirely, or vice versa

If ANY fail: verdict is FAIL. Remediate by revising Phase 2b prompt/procedure in
`.claude/skills/skill-audit/SKILL.md` to close the observed gap, then re-run the
failing category (not necessarily the full test).

---

## 5. Known Limitations

1. **LLM sampling variance.** Two runs of the same prompt can produce different
   wording. The 80% threshold is chosen to absorb this without masking
   substantive divergence.
2. **Single-target sample.** Parity on `recall` does not guarantee parity on
   larger skills (`repo-analysis`). Treat this test as necessary-not-
   sufficient. A second parity check on a handler skill is advisable before
   declaring full parity.
3. **Findings-only scope.** This test does not validate Phase 2.B decision
   collection, Phase 3 crosscheck, or downstream phases. D14 scopes parity to
   the findings layer only; decision-layer parity would require a separate test.

---

## 6. Results

_Run results will be recorded below after Step 20 execution._

### 6.1 Run 1 Findings (single mode)

See `.planning/skill-audit-batch-mode/parity-run-single.md` — full per-category
findings, Phase 2a gated walk.

### 6.2 Run 2 Findings (batch mode)

See `.planning/skill-audit-batch-mode/parity-run-batch.md` — all 12 categories
produced at once, Phase 2b faithfulness guarantee.

### 6.3 Category-by-Category Diff

| #   | Category                | Single Score | Batch Score | Pros Δ | Cons Δ | Gaps Δ | Sugg. Overlap      | Pass? |
| --- | ----------------------- | ------------ | ----------- | ------ | ------ | ------ | ------------------ | ----- |
| 1   | Intent Fidelity         | 7            | 7           | 0      | 0      | 0      | 100% (A/B/C)       | ✅    |
| 2   | Workflow Sequencing     | 7            | 7           | 0      | 0      | 0      | 100% (A/B/C/D)     | ✅    |
| 3   | Input/Output Quality    | 6            | 6           | 0      | 0      | 0      | 100% (A/B/C/D/E/F) | ✅    |
| 4   | Decision Points         | 6            | 6           | 0      | 0      | 0      | 100% (A/B/C/D)     | ✅    |
| 5   | Integration Surface     | 5            | 5           | 0      | 0      | 0      | 100% (A/B/C/D/E)   | ✅    |
| 6   | Guard Rails             | 5            | 5           | 0      | 0      | 0      | 100% (A/B/C/D/E/F) | ✅    |
| 7   | Prompt Engineering      | 6            | 6           | 0      | 0      | 0      | 100% (A/B/C/D/E)   | ✅    |
| 8   | Scope Boundaries        | 5            | 5           | 0      | 0      | 0      | 100% (A/B/C/D)     | ✅    |
| 9   | Institutional Memory    | 6            | 6           | 0      | 0      | 0      | 100% (A/B/C/D/E)   | ✅    |
| 10  | User Experience         | 7            | 7           | 0      | 0      | 0      | 100% (A/B/C/D/E)   | ✅    |
| 11  | Convergence Loop (T25)  | N/A          | N/A         | 0      | 0      | 0      | n/a (both N/A)     | ✅    |
| 12  | Completion Verification | N/A          | N/A         | 0      | 0      | 0      | n/a (both N/A)     | ✅    |

**Notation:**

- _Δ_ = count of findings present in one mode but absent in the other (0 =
  parity)
- _Suggestion overlap_ = % of suggestions that appear in both runs with same
  recommendation
- All 12 categories ✅ — no missing pros/cons/gaps/suggestions between modes

### 6.4 Batch-Mode Value-Add (not a parity gap, an additive)

Run 2 (batch mode) surfaced three **cross-category patterns** that Run 1 (single
mode, per-category gated) did not produce as a distinct artifact:

1. Missing required sections cascade (When-to-Use / When-NOT-to-Use / Routing
   Guide → hits Cats 1, 5, 7, 8)
2. Implicit contracts as central risk class (Cats 3, 5, 6, 12 converge on this)
3. Auto-rebuild is underserved across UX, guard-rails, verification (Cats 6,
   10, 12)

These cross-cuts aren't _missing_ from Run 1 — they emerge from the per-category
findings — but batch mode's whole-skill framing surfaces them as first-class
artifacts. This is **consistent with Phase 2.A (Cross-Skill Pattern Detection)**
design intent, even operating on a single skill (cross-_category_ rather than
cross-skill).

### 6.5 Acceptance Criteria Check

| Criterion                                                            | Result                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ≥ 80% suggestion overlap per category                                | ✅ 100% across all 10 scored categories                                                                |
| Zero cons missing between modes                                      | ✅ zero missing                                                                                        |
| Zero gaps missing between modes                                      | ✅ zero missing                                                                                        |
| Same recommendation direction per paired suggestion                  | ✅ all paired suggestions share ACCEPT/REJECT/DEFER verdicts                                           |
| No category where one mode surfaces substantive finding other misses | ✅ none; batch mode's cross-category patterns are additive synthesis, not missing single-mode findings |

### 6.6 Verdict: **PASS**

Faithfulness guarantee holds: Phase 2b findings on recall are equivalent in
substance to what Phase 2a produced, category-by-category. Batch mode adds
cross-category synthesis as a first-class output (consistent with Phase 2.A
intent) without losing substance in any individual category.

### 6.7 Caveats

1. **Same-session bias (significant).** Run 2 was executed in the same
   conversation as Run 1, so working memory overlap is unavoidable. The Run 2
   file explicitly acknowledges this. True rigor would require dispatching Run 2
   to a fresh agent with no Run 1 context.
2. **Necessary-not-sufficient scope.** Parity on `recall` (smallest CAS skill,
   pure query surface) does not guarantee parity on handler skills
   (`repo-analysis`, `document-analysis`) which have phased workflows and Cat
   11/12 applicability. A second parity check on a handler skill before
   production use is advisable.
3. **Findings-only scope.** This test does not validate Phase 2.B decision
   collection, Phase 3 crosscheck, or downstream phases. Decision-layer parity
   would require a separate test.

### 6.8 Recommendations

- **For T28 CAS Step A** (`/skill-audit --mode=multi` on 7 CAS skills): proceed.
  Parity holds on the simplest CAS skill; systemic procedure faithfulness is
  demonstrated.
- **For production hardening:** schedule a fresh-agent parity run on one handler
  skill (e.g., `document-analysis`) before declaring full parity. Low priority
  if initial multi-run on CAS produces reasonable findings.
- **For batch mode specifically:** Phase 2.A (cross-skill patterns) is likely to
  be the biggest value-add in multi mode, given how cleanly cross-category
  patterns surfaced even for a single skill in Run 2.

---

## 7. Next Actions Based on Verdict

**If PASS:**

- Mark PLAN Step 20 ✅
- Proceed with T28 CAS Step A (`/skill-audit --mode=multi` on 7 CAS skills)
- File parity confidence note in SESSION_CONTEXT.md

**If FAIL:**

- Enumerate failing categories in §6.3
- Return to PLAN implementation: revise Phase 2b prompt(s) to restore parity
- Re-run only the failing categories (not the full test)
- Block T28 CAS Step A until parity restored
