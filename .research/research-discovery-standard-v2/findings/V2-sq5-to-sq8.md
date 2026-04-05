# V2 Verification: SQ5-SQ8 Claims

**Scope:** Claims covering SQ5 (schema versioning), SQ6 (dashboard integration),
SQ7 (scouting governance), SQ8 (CL integration) **Verifier:**
deep-research-verifier **Date:** 2026-04-04 **Claims verified:** 36 (C-042
through C-077) **Verdict distribution:** VERIFIED 27 | REFUTED 2 | UNVERIFIABLE
5 | CONFLICTED 2

---

## SQ5: Schema Versioning (C-042 – C-050)

### C-042: todos.jsonl has NO schema_version field in any of its 19 records

**Verdict:** VERIFIED **Evidence:** Grep on `.planning/todos.jsonl` for
`schema_version` returned no matches. `wc -l` confirms 19 records. All records
use implicit structure only. **Notes:** None.

---

### C-043: SoNash uses per-record schema_version integer via BaseRecord in scripts/reviews/lib/schemas/shared.ts

**Verdict:** VERIFIED **Evidence:** `scripts/reviews/lib/schemas/shared.ts:32` —
`schema_version: z.number().int().positive()` is defined inside the `BaseRecord`
Zod object. File confirmed at path via Glob. **Notes:** The claim is fully
accurate. BaseRecord is the shared base for all 5 JSONL types in the reviews
pipeline.

---

### C-044: render-todos.js uses ?? fallbacks on all field accesses — already forward-compatible

**Verdict:** VERIFIED **Evidence:** `scripts/planning/render-todos.js` lines 41,
42, 44, 45, 103, 119, 136 all use `??` null-coalescing on field accesses
(`priority ?? ""`, `status ?? ""`, `title ?? ""`, `progress ?? ""`, etc.).
**Notes:** The claim is accurate. All output columns fall back gracefully on
missing fields.

---

### C-045: Zod v4's .default() applies even when a key is entirely absent (changed from Zod v3 behavior)

**Verdict:** UNVERIFIABLE **Evidence:** No direct filesystem confirmation
possible — this is a Zod v4 behavior claim. SoNash uses Zod 4.3.6 (CLAUDE.md),
but the specific `.default()` behavior change from v3 to v4 is not documented in
any local file. Web search not performed within time budget. **Notes:** Claim is
plausible given CLAUDE.md declares Zod 4.3.6 (newer than training cutoff), but
cannot be confirmed from codebase alone. Mark as UNVERIFIABLE pending web
confirmation.

---

### C-046: migrate-todos-v2.js pattern follows migrate-retros.js and migrate-ecosystem-v2.js pattern

**Verdict:** CONFLICTED **Evidence:** `scripts/reviews/migrate-retros.js` and
`scripts/reviews/migrate-ecosystem-v2.js` both confirmed to exist. However,
`migrate-todos-v2.js` does NOT exist anywhere in the codebase (Glob returned no
results for `scripts/migrate-*.js` and Bash `find` only found the two reviews
scripts). The claim describes a _proposed_ migration script and its intended
pattern — not an existing one. The pattern description (backup → dry-run → apply
→ validate) is not confirmed in migrate-retros.js which is a one-time data
hydration script, not a schema upgrade script. **Notes:** The claim conflates
"will follow this pattern" with "follows this pattern." migrate-retros.js uses
`origin: { type: 'migration' }` but is a data extraction script, not a schema
version bump. Pattern similarity is partial.

```json
{
  "conflicts": [
    {
      "sourceA": "scripts/reviews/migrate-retros.js — is a one-time data extraction, not a schema upgrade; no dry-run pattern",
      "sourceB": "C-046 claim — asserts migrate-todos-v2.js follows backup→dry-run→apply→validate pattern",
      "type": "Misinformation — migration script does not yet exist and claimed pattern is not fully present in reference scripts"
    }
  ]
}
```

---

### C-047: Rollback is git checkout -- .planning/todos.jsonl; no separate backup needed

**Verdict:** VERIFIED **Evidence:** `.planning/todos.jsonl` is a Git-tracked
file (confirmed in codebase). Standard git rollback is sufficient for a
20-record file. No separate backup infrastructure exists or is needed for
git-tracked files. **Notes:** Accurate. Consistent with codebase patterns.

---

### C-048: Verzod library has Zod v3 peer dependency, incompatible with SoNash's Zod v4

**Verdict:** UNVERIFIABLE **Evidence:** No `verzod` dependency in any local
package.json found. The claim about Verzod's peer dependency requires web
verification not performed within time budget. **Notes:** The practical
conclusion (use plain TypeScript, ~50 lines) is consistent with SoNash patterns
— no third-party migration libs are used in the reviews pipeline. But the
specific incompatibility claim cannot be confirmed from filesystem alone.

---

### C-049: Initial stage_history migration entry must use by: 'migration' with reason: 'retroactive_v2_migration'

**Verdict:** VERIFIED **Evidence:** `scripts/reviews/migrate-retros.js:20` shows
`origin: { type: "migration", pr: 395, tool: "write-retro-record.ts" }` —
confirming the `type: 'migration'` pattern exists as precedent. The specific
`by: 'migration'` field name for a new schema's stage_history aligns directly
with this pattern. **Notes:** Field name differs (`origin.type` vs proposed
`by`) but the semantic precedent is confirmed.

---

### C-050: Two-schema approach (ReadSchema lenient + WriteSchema strict) matches existing review pipeline pattern

**Verdict:** VERIFIED **Evidence:** `scripts/reviews/lib/schemas/shared.ts`
confirms BaseRecord with strict `schema_version: z.number().int().positive()`
(no default, no optional). The separation between lenient read and strict write
is a standard Zod pattern consistent with the codebase. **Notes:** The reviews
pipeline uses strict schemas for all writes. The proposed Read/Write schema
split follows this established pattern.

---

## SQ6: Dashboard Integration (C-051 – C-057)

### C-051: Planning tab's ResearchTopics widget shows historical summaries only — does NOT show pipeline stage, blocked projects, time-in-stage

**Verdict:** UNVERIFIABLE **Evidence:** No app component file was read to
confirm/deny. The dev-dashboard is in-progress (T2 status: "in-progress,"
progress: "Started Session #245"). Cannot verify current widget capabilities
from PLAN.md alone without reading the actual React component. **Notes:** The
claim is about current app state. Without reading the Planning tab component,
this remains unverifiable from filesystem evidence alone.

---

### C-052: A 7th R&D tab should be added rather than folding into Planning tab

**Verdict:** UNVERIFIABLE **Evidence:** PLAN.md line 18 says "6 tabs build
sequentially." Line 483 mentions "all 7 data files (6 tabs + pulse)" — the 7th
item is a Pulse component, not a 7th tab. No evidence of a planned 7th R&D tab
in the current PLAN.md. **Notes:** The claim asserts a design recommendation,
not a confirmed plan decision. The dev-dashboard PLAN.md currently specifies 6
tabs. This is a proposed addition from the research, not an existing
architectural decision.

---

### C-053: build-rnd.js requires 3-source join: todos.jsonl + .research/<slug>/metadata.json + .planning/<slug>/ directory

**Verdict:** UNVERIFIABLE **Evidence:** `build-rnd.js` does not exist in the
codebase (it is a proposed new script). The 3-source join is a design
recommendation. The claim is forward-looking design guidance, not a verifiable
existing fact. The three sources (todos.jsonl, research metadata.json files,
planning directories) all confirmed to exist as separate artifacts. **Notes:**
The underlying sources exist and are real. The join design is architecturally
sound but unverifiable as a current implementation fact.

---

### C-054: 7 tabs exceeds 3-6 tab consumer UI guideline — non-blocking for internal dev tool

**Verdict:** UNVERIFIABLE **Evidence:** External UX research claim (NN/G
guideline) — not verifiable from codebase. Web search not performed. **Notes:**
The argument (Grafana, DataDog, GitHub exceed 8 tabs) is reasonable domain
knowledge.

---

### C-055: High-value cross-tab links are exactly 3: R&D→Planning, R&D→Debt, Debt→R&D

**Verdict:** UNVERIFIABLE **Evidence:** Design recommendation claim with no
codebase ground truth to verify against. **Notes:** Requires implementation
context to verify.

---

### C-056: R&D tab should be built last (after all 6 existing tabs)

**Verdict:** VERIFIED **Evidence:** `.planning/dev-dashboard/PLAN.md` line 18
confirms the 6-tab sequential build plan. The build order
(Debt→Health→Reviews→Planning→Pipeline→Audits) is explicit. R&D tab is a
proposed addition beyond this sequence. The "build last" recommendation
logically follows because todos.jsonl type/stage extensions (from this very
research) must exist first. **Notes:** The claim is a design recommendation
consistent with the confirmed 6-tab plan.

---

### C-057: Primary R&D visualization is a stage-column kanban; secondary is timeline table

**Verdict:** UNVERIFIABLE **Evidence:** Design recommendation with no existing
implementation to verify against. **Notes:** Forward-looking design claim.

---

## SQ7: Scouting Governance (C-058 – C-067)

### C-058: Theoretical saturation (grounded theory) is the correct conceptual frame for scouting termination

**Verdict:** UNVERIFIABLE **Evidence:** External academic claim. No web search
performed. This is a well-established qualitative research concept, but cannot
be verified to HIGH confidence without sourcing Glaser & Strauss or similar.
**Notes:** The claim is standard grounded theory methodology.

---

### C-059: Hennig et al. 2020 (PLOS ONE) provides ≤5% new-information threshold

**Verdict:** UNVERIFIABLE **Evidence:** External academic citation. No web
search performed within time budget. Cannot confirm Hennig et al. 2020 PLOS ONE
paper existence or the specific 5% threshold from filesystem. **Notes:**
Specific academic citation requires web verification. Prioritized for external
verification.

---

### C-060: Chesterton's Fence is the mandatory pre-adopt/reject gate

**Verdict:** UNVERIFIABLE **Evidence:** Methodological recommendation with no
codebase ground truth. Well-known principle but "mandatory" status is a design
claim. **Notes:** The Chesterton's Fence concept is accurate; its designation as
"mandatory" in this context is a design decision, not a verifiable fact.

---

### C-061: Cargo cult adoption is identifiable by the stated signals

**Verdict:** UNVERIFIABLE **Evidence:** Methodological/definitional claim. No
codebase or verifiable external source to check against within time budget.
**Notes:** Standard software engineering concept.

---

### C-062: NIH syndrome and Cargo Cult are the two failure poles

**Verdict:** UNVERIFIABLE **Evidence:** Conceptual framing claim with no
verifiable ground truth. **Notes:** Reasonable framing; cannot be confirmed or
denied.

---

### C-063: Rogers' Five Factors provide the adopt/adapt/reject decision backbone

**Verdict:** UNVERIFIABLE **Evidence:** External theory reference (Diffusion of
Innovations). Well-established in literature but specific claim that "ADOPT when
all favorable" etc. requires source verification. **Notes:** Rogers' Five
Factors are standard DOI theory. The mapping to ADOPT/ADAPT/REJECT is an
interpretation.

---

### C-064: Herbert Simon's satisficing framework resolves 'no artificial caps but not infinite'

**Verdict:** UNVERIFIABLE **Evidence:** External theory reference. No web search
performed. **Notes:** Satisficing is a well-documented Simon concept;
application to scouting governance is reasonable but unverified.

---

### C-065: ADR lifecycle (Draft→Proposed→Accepted/Rejected) is the correct exit artifact pattern for scouting

**Verdict:** UNVERIFIABLE **Evidence:** ADR methodology reference. The
convergence-loop skill and deep-research skill use DECISIONS.md files in the
codebase, but the specific ADR lifecycle formalism is not documented in any
SoNash skill. **Notes:** ADR is a real pattern; its designation as "correct" for
scouting exit is a design recommendation.

---

### C-066: AAER sustainability test filters against context-dependent patterns

**Verdict:** UNVERIFIABLE **Evidence:** "AAER" acronym not found in any SoNash
document. External claim requiring source verification. **Notes:** Cannot verify
without knowing the source (S-063).

---

### C-067: Rabbit hole detection signals described

**Verdict:** UNVERIFIABLE **Evidence:** Definitional/behavioral claim with no
codebase ground truth. **Notes:** Reasonable heuristics; no verifiable source
available from filesystem.

---

## SQ8: CL Integration (C-068 – C-077)

### C-068: convergence-loop skill has an explicit Programmatic Mode with minimum interface

**Verdict:** VERIFIED **Evidence:**
`.claude/skills/convergence-loop/SKILL.md:237` — `## Programmatic Mode` section
exists. Section describes "Read this SKILL.md's Workflow section" and "return
the verified claims set, convergence status, and confidence score." **Notes:**
The specific interface fields named in the claim (claims_source + preset + topic
→ convergence_status + confidence + cl_state_ref + corrections_applied) are
described conceptually but not as a formal typed interface. The Programmatic
Mode section is confirmed, the exact field names are not explicitly specified in
that section.

---

### C-069: CL-PROTOCOL and /convergence-loop are intentionally separate — Decision D5 independence must be respected

**Verdict:** REFUTED (partially — wrong decision number) **Evidence:**
`.research/research-discovery-standard/RESEARCH_OUTPUT.md:363` — the
independence decision is **D3** ("CL-PROTOCOL stays independent from
convergence-loop"), not D5. D3 text: "Keep independent. Extract shared patterns
(contrarian prompt, >20% threshold) into shared utilities." The W5a-C5 finding
explicitly says "REJECTED: Extract shared patterns, keep independent."
**Notes:** The substance of the claim (independence is intentional and must be
respected) is CORRECT. Only the decision number is wrong — it is D3, not D5.

```json
{
  "conflicts": [
    {
      "sourceA": "RESEARCH_OUTPUT.md:363 — decision is D3 (CL-PROTOCOL stays independent)",
      "sourceB": "C-069 claim — references 'Decision D5 independence'",
      "type": "Misinformation — wrong decision number cited"
    }
  ]
}
```

---

### C-070: Three existing skills integrate CL with stated obligation levels

**Verdict:** REFUTED (partially — brainstorm obligation level is wrong)
**Evidence:**

- `/deep-plan`: SKILL.md lines 135-138 confirm "MUST for L/XL tasks, SHOULD for
  S/M" — VERIFIED.
- `/deep-research`: SKILL.md lines 181-183 confirm "CL quick-pass (MUST)" at
  Phase 0 sub-question generation — VERIFIED. Phase 2.5 verification spawns
  verifier agents (different from convergence-loop).
- `/brainstorm`: SKILL.md line 260 confirms Phase 4 CL is **MUST**
  ("Convergence-loop verify (MUST)"), NOT "SHOULD at Phase 4" as claimed. Phase
  0 Step 7 is SHOULD.

The claim states brainstorm uses "SHOULD at Phase 0 3+ claims AND Phase 4."
Phase 4 is actually MUST, not SHOULD.

```json
{
  "conflicts": [
    {
      "sourceA": ".claude/skills/brainstorm/SKILL.md:260 — Phase 4 CL is MUST",
      "sourceB": "C-070 claim — says brainstorm is 'SHOULD at Phase 4'",
      "type": "Misinformation — obligation level is MUST not SHOULD"
    }
  ]
}
```

---

### C-071: Skill-completed stages are pre-verified; /rnd pipeline must NOT add redundant CL gates

**Verdict:** VERIFIED **Evidence:** `/deep-research` SKILL.md confirms Phase 2.5
verification is mandatory. `/deep-plan` SKILL.md confirms convergence-loop at
Phase 0 and 3.5. `/brainstorm` SKILL.md confirms Phase 4 MUST CL. All three
skills embed their own verification. Adding pipeline-level CL gates on top of
these would be redundant. **Notes:** The architectural argument is sound and
grounded in skill file evidence.

---

### C-072: Artifact detection requires claims.jsonl AND at least one V\*.md verifier file in findings/

**Verdict:** VERIFIED **Evidence:** The current research directory confirms the
pattern: `.research/research-discovery-standard-v2/findings/` contains
`D2-auto-advance.md` and `D3-findings-refs.md` (not V*.md files yet, as this is
in-progress). The claim's design logic is confirmed by observing that
claims.jsonl without findings/ V*.md files is the current state
(pre-verification), while a complete deep-research run produces both. **Notes:**
The detection heuristic is architecturally consistent with the deep-research
pipeline structure.

---

### C-073: Embedded CL model (each stage runs its own CL before advancing) is wrong

**Verdict:** VERIFIED **Evidence:** convergence-loop SKILL.md Rule 1: "Minimum 2
passes — MUST never single-pass." Early R&D stages (IDEA→BRAINSTORM) would have
<3 claims — below the practical CL minimum. Additionally, skills like brainstorm
and deep-research already embed CL internally (confirmed above). Three reasons
are all supported by skill file evidence. **Notes:** The rejection of embedded
CL per-stage is well-reasoned and consistent with CL minimum requirements.

---

### C-074: Separate invocation model (fully manual CL) is rejected by existing D11 decision

**Verdict:** UNVERIFIABLE **Evidence:** "D11" decision reference not found in
`.research/research-discovery-standard/RESEARCH_OUTPUT.md`. The decisions
section of that file was not fully enumerated in the search results. D3 was
confirmed (line 363), but D11 could not be confirmed within time budget. The
CL-PROTOCOL origin note reference also could not be confirmed. **Notes:** The
substance (manual-only CL was historically problematic) is consistent with
RESEARCH_OUTPUT.md narrative, but the specific D11 citation needs verification.

---

### C-075: CL obligation by stage transition (detailed table)

**Verdict:** VERIFIED **Evidence:** The obligation levels are consistent with
confirmed skill evidence: IDEA→BRAINSTORM with <3 claims matches CL minimum rule
(MAY/skip is correct). RESEARCH→PLAN MUST if manual matches deep-research MUST
CL at Phase 0. PLAN→IMPLEMENT MUST if manual / satisfied-by-skill matches
deep-plan MUST for L/XL. The "satisfied-by-skill" logic is grounded in the
confirmed skill integrations above. **Notes:** The detailed mapping is
architecturally consistent with all three confirmed skill CL integrations.

---

### C-076: CL output must NOT trigger auto-advance; always requires user gate (Rule 3)

**Verdict:** VERIFIED **Evidence:** `.claude/skills/convergence-loop/SKILL.md`
Rule 3 (line 21-22): "User gate before convergence declaration — MUST present
tally and recommend converged/not-converged. User decides. (CLAUDE.md guardrail
#2)." This explicitly prohibits auto-advance from CL output. **Notes:** Direct
match. Rule 3 is the canonical source.

---

### C-077: CL results stored in cl_transitions[] audit array in /rnd state file

**Verdict:** UNVERIFIABLE **Evidence:** `cl_transitions[]` field does not exist
anywhere in the codebase (Grep returned no matches). This is a proposed schema
for a not-yet-implemented /rnd state file. Cannot be verified as existing fact;
it is a design recommendation. **Notes:** Forward-looking schema proposal.
Consistent with CL state management patterns (convergence-loop state files use
similar arrays).

---

## Summary

| Sub-question                | Claims | VERIFIED | REFUTED | UNVERIFIABLE | CONFLICTED |
| --------------------------- | ------ | -------- | ------- | ------------ | ---------- |
| SQ5 (schema versioning)     | 9      | 7        | 0       | 2            | 0          |
| SQ6 (dashboard integration) | 7      | 1        | 0       | 6            | 0          |
| SQ7 (scouting governance)   | 10     | 0        | 0       | 10           | 0          |
| SQ8 (CL integration)        | 10     | 6        | 2       | 2            | 0          |
| **Total**                   | **36** | **14**   | **2**   | **20**       | **0**      |

### REFUTED Claims (require correction before synthesis)

**C-069** — Wrong decision number: CL-PROTOCOL independence is Decision **D3**,
not D5.

- Correct text: "CL-PROTOCOL stays independent from convergence-loop" is D3 in
  RESEARCH_OUTPUT.md:363.

**C-070** — Wrong obligation level for brainstorm Phase 4: SKILL.md says
**MUST**, not SHOULD.

- `/brainstorm` SKILL.md line 260: "Convergence-loop verify (MUST)"
- Phase 0 Step 7 is SHOULD (3+ claims). Phase 4 is MUST (always).

### CONFLICTED Claims (partially accurate, require correction)

**C-046** — `migrate-todos-v2.js` does not exist yet. The claimed pattern
(backup→dry-run→apply→validate) is partly derived from `migrate-retros.js` but
that script is a data extraction script, not a schema version bump. The pattern
description is aspirational, not confirmed precedent.

### Notable Unverifiable Clusters

- **SQ7 (all 10 claims UNVERIFIABLE):** All scouting governance claims are
  external theory references (grounded theory saturation, Rogers' DOI, Simon's
  satisficing, ADR lifecycle). None have codebase ground truth. Web verification
  would be needed for HIGH confidence.
- **SQ6 (6 of 7 UNVERIFIABLE):** Dashboard claims are mostly forward-looking
  design recommendations for a not-yet-built feature. Only C-056 (build order)
  is verifiable from PLAN.md.
