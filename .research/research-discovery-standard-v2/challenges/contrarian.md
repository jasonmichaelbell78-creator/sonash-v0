# Contrarian Challenges: Research-Discovery-Standard v2

**Agent:** contrarian-challenger **Date:** 2026-04-04 **Scope:** 77 claims, 8
sub-questions, RESEARCH_OUTPUT.md conclusions

---

## Challenge C1: The /todo Evolution Assumption May Be Backward

**Target:** D4-F6, C-038 — "/rnd should be a thin view-layer on the same
todos.jsonl"

**Steel-man:** The strongest version of this claim is that todos.jsonl already
contains 15 de facto R&D projects, the schema is well-understood,
render-todos.js uses defensive `??` fallbacks, and adding two fields to an
existing file costs far less than building parallel infrastructure. This is
architecturally sound at a solo-dev scale of 20 records.

**Challenge:** The thin-view model assumes that /todo and /rnd will remain
semantically compatible as the pipeline matures. They likely will not. /todo is
a capture-first GTD inbox with five status values and a free-text progress
field. /rnd is a stage-gated lifecycle manager with append-only audit trails, CL
obligations, artifact dependencies, cross-project refs, and blocking
relationships. These two systems have diverging mutation semantics: /todo
mutates freely (write the full file back); /rnd requires ordered, guarded
transitions with history. The moment the /rnd pipeline enforces transition
guards (only allowed transitions in the whitelist), the /todo interface — which
must accept any mutation — becomes a bypass route around those guards. Every
/todo update that touches stage or type fields is an unguarded transition. The
research does not address how the shared JSONL backend is protected from /todo's
unconstrained write path.

**Evidence:**

- D1-F4 specifies a "guarded whitelist table" where "unspecified transitions are
  forbidden." The guard mechanism is never specified for the /todo write path.
- D1-F11 says the whitelist is stored in `rnd-config.json` — but /todo's
  mutation rule (SKILL.md: "Read the full file, apply changes in memory, write
  back") does not reference rnd-config.json at any point.
- The PARKED state (D1-F11) has "outgoing transitions back to any prior stage
  via history state" — this is fine for /rnd but means /todo could blindly
  overwrite `stage: "PARKED"` with `stage: "IMPLEMENT"` without firing the
  guard.
- C-038 is rated MEDIUM confidence (not HIGH) — the researcher themselves had
  lower confidence in this design choice.

**Strength:** STRONG

**Recommended response:** MITIGATE

**Mitigation:** Add a write-guard layer: a pre-write validator that checks stage
transition legality before any todos.jsonl write that modifies stage or type
fields, regardless of which skill initiates the write. Without this, the
whitelist-based transition model is security theater — the protection lives in
/rnd but the bypass lives in /todo.

---

## Challenge C2: FileChanged Hook Reliability Is Unverified on This Codebase's Windows Setup

**Target:** D2-F1, C-013, C-015 — "Claude Code's native FileChanged hook is the
right primitive"

**Steel-man:** The strongest version is that FileChanged is a native Claude Code
primitive requiring zero external dependencies, the session-start hook already
reads todos.jsonl so extending it to emit watchPaths is incremental, and the
lazy scan serves as a reliable fallback for anything the hook misses. The
dual-path architecture means hook failures degrade gracefully to on-demand
scanning.

**Challenge:** The research claims FileChanged hook works on Windows but relies
on a single parenthetical assertion — "Windows file watcher fixes were shipped:
Claude Code previously silently failed on Windows with pre/post-commit hooks due
to cmd.exe vs Git Bash issues — this was resolved by switching to Git Bash."
This is evidence about pre/post-commit hooks, not FileChanged hooks. The failure
modes are documented at length (D2-F5: duplicate events, null filenames, memory
leaks, junction inconsistency) but the claim that Claude Code's abstraction
fully insulates the hook consumer is stated without codebase verification. The
watchPaths feasibility question (Open Question 6: "Whether Claude Code's
watchPaths accepts directories or requires explicit file paths is not confirmed.
With 20 active slugs x 4 artifact paths = 80 entries, feasibility limit is
unknown") is left open — this is the single most load-bearing unverified claim
in SQ2.

**Evidence:**

- RESEARCH_OUTPUT.md Open Question 6 explicitly acknowledges: "Whether Claude
  Code's watchPaths accepts directories or requires explicit file paths is not
  confirmed." This is the hook architecture's critical sizing assumption.
- D2-F4 confidence is "MEDIUM-HIGH" (the only non-HIGH confidence in SQ2) on the
  FileChanged secondary path — the researcher downgraded confidence but the
  synthesis presents both paths as equally confident.
- "New R&D slug created mid-session won't be watched until next session start"
  (D2-auto-advance.md Finding 4 failure modes) — this is a real gap in the
  real-time feedback story. Any research/plan phase started within the session
  that created the slug produces no FileChanged advance.
- The research notes C-022: research-index.jsonl has inconsistent status fields.
  If the index used for slug enumeration is inconsistent, watchPaths
  registration will silently miss active slugs.

**Strength:** STRONG

**Recommended response:** MITIGATE

**Mitigation:** Before implementation, verify watchPaths capacity and directory
vs file-path support with a minimal test. If the 80-path limit is real, redesign
to directory-level watching with slug-based filtering inside the hook. The lazy
scan is reliable; treat FileChanged as a progressive enhancement only after
feasibility is confirmed, not as a co-equal primary path.

---

## Challenge C3: "Skill-Completed Stages Are Pre-Verified" Has a Dangerous False-Positive Failure Mode

**Target:** D8-F8, RESEARCH_OUTPUT.md Theme 3 — "skill-completed stages are
already pre-verified"

**Steel-man:** The strongest version is that deep-research runs Phase 2.5 +
Phase 3 CL internally (documented in SKILL.md), deep-plan runs DIAGNOSIS CL
(documented), and brainstorm runs Phase 0 + Phase 4 CL (documented). If these
skills were used AND completed through their CL phases, the /rnd pipeline's
RESEARCH→PLAN and PLAN→IMPLEMENT transition gates are genuinely redundant and
adding them creates ceremony without verification value.

**Challenge:** The detection heuristic is
`claims.jsonl + at least one V*.md verifier file = deep-research CL was run`.
This is a file-existence check, not a completion-quality check. Three failure
modes the heuristic does not catch:

1. The user ran deep-research through Phase 2 (produces claims.jsonl and V1.md)
   but aborted before Phase 3 (the actual convergence-loop phase). The verifier
   file exists. The CL was not run to completion. The /rnd pipeline declares
   RESEARCH stage pre-verified.

2. The user ran deep-research at depth L0 (quick pass, minimal sources). Claims
   exist. A verifier file exists. But the research was intentionally shallow and
   the user expected the /rnd CL gate to catch what the quick pass missed. The
   pre-verified heuristic silently removes that gate.

3. claims.jsonl was written by an older version of the deep-research skill that
   did not integrate CL (pre-integration). The file exists from a prior session.
   No verification was ever run. The heuristic fires anyway.

The research itself acknowledges this in Contradictions table: "user may have
aborted deep-research before Phase 2.5" — and resolves it with the V\*.md check
— but the resolution only addresses case 1 partially (abort before any verifier
files are written). Cases 2 and 3 remain unaddressed.

**Evidence:**

- D8-C2 (Contradictions table): the research team identified this exact failure
  mode but the stated resolution (V\*.md check) is incomplete.
- D2-F13 / C-022: research-index.jsonl has inconsistent status fields. The same
  inconsistency problem likely affects whether CL was run to completion.
- The cross-cutting theme statement ("The skills do their own CL; the pipeline
  should not duplicate it") is stated as the "most important finding from SQ8"
  but rests on file-existence evidence, not behavioral evidence.

**Strength:** STRONG

**Recommended response:** MITIGATE

**Mitigation:** Add a CL-run quality marker to the pre-verified detection.
Either: (a) require that research-index.jsonl has `status: "complete"` for the
slug (requires enforcing D17 first), or (b) require the presence of the Phase 3
CL output artifact specifically (the convergence-loop state file), not just any
verifier file. The current heuristic is too permissive.

---

## Challenge C4: Additive-Only Schema Will Not Hold Through Iteration

**Target:** D5-F3, C-041 (implicit) — "All new fields are additive and optional;
no existing fields are removed or renamed"

**Steel-man:** The strongest version is that the proposed migration only adds
six optional fields (stage, type, artifacts, findings_refs, blocks, blocked_by)
to 20 records. Existing consumers use `??` fallbacks. The Zod
ReadSchema/WriteSchema split handles lenient reads. This is correct for the
v1→v2 migration.

**Challenge:** The additive-only guarantee applies to the current migration. It
does not hold as a forward contract for the lifetime of the pipeline. The
research presents additive-only as a design principle and then draws the
inference that schema_version field alone is sufficient versioning
infrastructure. But the progression from v2 onward will encounter at least two
non-additive pressures:

1. The stage enum will need to change. The whitelist in D1-F4 has 7 stages plus
   PARKED. Within 6 months of use, new stages will be proposed (e.g., SPIKE,
   PROTOTYPE, VALIDATE). Adding to the stage enum is additive. Removing a stage
   that was used in production stage_history entries is not — those records now
   reference a stage value that is no longer in the whitelist. The schema
   versioning plan has no mechanism for enum value deprecation.

2. The findings_refs relationship types (informedBy/constrainedBy/contradicts)
   will need expansion. Open Question 7 in the research explicitly asks whether
   to add "relatesTo" as a fourth type. If relatesTo is added in v3, existing
   refs that were force-categorized into informedBy (because there was no
   neutral type) become semantically incorrect. There is no migration path for
   reclassifying existing refs — the data is frozen by the additive-only
   contract.

**Evidence:**

- RESEARCH_OUTPUT.md Open Question 7: "Add relatesTo as fourth relationship
  type?" — the research team already anticipates needing to extend the
  relationship enum, undermining the additive-only forward guarantee.
- D1-F4 allows backtracking transitions including PLAN→BRAINSTORM. If BRAINSTORM
  is later deprecated (e.g., merged into RESEARCH), stage_history entries with
  `stage: "BRAINSTORM"` become orphaned values with no valid whitelist entry.
- The additive-only claim is grounded in the v1→v2 migration only. The research
  does not evaluate v2→v3 or beyond, despite the schema being described as a
  long-lived foundation.

**Strength:** MODERATE

**Recommended response:** MITIGATE

**Mitigation:** Document explicitly that additive-only is the v1→v2 contract,
not a perpetual forward guarantee. Add to the migration script a stage_history
value audit that validates all historical stage values against the current
whitelist. For the findings_refs relationship type enum, define the extension
policy now (additive to the enum is always safe; no retroactive reclassification
obligation) rather than leaving it implicit.

---

## Challenge C5: findings_refs Requires More Discipline Than the Research Assumes

**Target:** D3-F14, C-031 — "Manual registration with required note field is the
correct pattern"

**Steel-man:** The strongest version is that auto-population via embedding
similarity creates false positives and notification fatigue, manual registration
forces articulation of the connection at the moment of insight, and the required
note field creates discipline that prevents low-quality refs. This is the right
tradeoff at 800-claim scale.

**Challenge:** Manual registration is not a feature — it is a bet that the user
will populate refs consistently over many sessions. The research provides no
evidence this bet pays off. In practice, the moment of insight (when connection
becomes obvious) is during active research, not during /todo bookkeeping. The
research session where custom-agents#C-042 would be registered as relevant to
JASON-OS is the research session itself — but /rnd's findings_refs are a
todos.jsonl field, and the researcher is not in /todo during research. The
connection is recognized and then forgotten by the time /todo is opened.

The session-begin digest (the pull mechanism) surfaces refs that have already
been registered, but does nothing to prompt registration of connections that
were never registered. If the user never registers a ref, the system provides
exactly zero cross-project value — indistinguishable from not building the
feature at all. The research acknowledges this in the Challenges Section ("If
the user never populates refs, the system provides zero cross-project value")
but treats it as a caveat rather than a design risk.

**Evidence:**

- RESEARCH_OUTPUT.md Challenges Section: "The findings_refs manual registration
  model requires discipline to populate. If the user never populates refs, the
  system provides zero cross-project value." The research team identified this
  failure mode but did not address it.
- The only graceful degradation path mentioned is posed as an open challenge,
  not resolved: "is there a graceful degradation path that provides partial
  value even without explicit refs?"
- C-029 (pull mechanism surfacing) is rated MEDIUM confidence — the researcher
  had less certainty here than on structural findings.
- D3-F7 (REFUTED claims must propagate) requires refs to exist to propagate
  anything. With zero registered refs, the broken-ref protection also provides
  zero value.

**Strength:** MODERATE

**Recommended response:** MITIGATE

**Mitigation:** Add a lightweight prompt-to-register mechanism: when
deep-research completes and writes claims.jsonl for a topic, the post-research
summary should scan active PROJECT todos for keyword overlap and prompt: "3
active projects may be relevant to these findings — register a findings_ref
now?" This is advisory (the user can decline), does not auto-populate
(preventing false positives), but catches the moment of insight before it is
forgotten. Without this, the feature relies entirely on user discipline in a
context where that discipline is unlikely.

---

## Challenge C6: The 7th Tab Violates the Spirit of the "No Broken Widgets" Guardrail

**Target:** D6-F4, D6-F5 — "Add a 7th R&D tab; do not fold into Planning tab"

**Steel-man:** The strongest version is that the Planning tab and the R&D
pipeline have genuinely distinct user intents ("what should I work on now" vs
"where are my projects in their lifecycle"), the data sources are a different
join graph (3-directory join vs single research-index.jsonl), and the "developer
tools routinely use 8+ tabs" argument correctly contextualizes the 3-6
consumer-UI guideline. The 7th tab is architecturally cleaner because R&D tab
data consumers are available after the schema extensions exist.

**Challenge:** The CLAUDE.md guardrail "No broken widgets" states: "Dashboard
tabs ship complete or not at all. Fix data gaps before building, not after." The
R&D tab has three data dependencies that are themselves being designed in this
same research:

1. The type/stage schema extension on todos.jsonl (not yet implemented).
2. The slug field on todos (Open Question 3: "Should slug be an explicit field
   in the V2 schema?" — unresolved).
3. The findings_refs data (Open Question above — may never be populated).

The 7th tab is described as the "last tab built" (D6-F11 timing advantage), but
the build-rnd.js builder performs a 3-source join that requires the slug
derivation heuristic to work correctly for all 20 active projects. The slug
derivation is currently described as inferring from context.files paths, which
"covers observed todos but may fail for edge cases." Building a tab on an
inference heuristic that "may fail for edge cases" is the definition of the
broken-widgets anti-pattern.

**Evidence:**

- RESEARCH_OUTPUT.md Open Question 3: "Should slug be an explicit field in the
  V2 schema?" is unresolved. The build-rnd.js 3-source join requires reliable
  slug matching. An unresolved slug derivation = a tab that renders partially or
  incorrectly for some projects.
- The cross-tab links require R&D ↔ Debt bidirectional linking (D6-F8). The Debt
  tab's slug/project association is not mentioned as verified compatible.
- D6-F7 ("Builder architecture is trivially extensible") is asserted without
  verifying that the existing per-tab builder pipeline accepts a new builder
  with a 3-directory join pattern. The current builders read single files;
  build-rnd.js requires directory enumeration across variable path structures.
- CLAUDE.md guardrail "no broken widgets" explicitly states fix data gaps before
  building.

**Strength:** MODERATE

**Recommended response:** MITIGATE

**Mitigation:** Resolve Open Question 3 (explicit slug field) as a prerequisite
to specifying the R&D tab builder. The slug field must be explicit in
todos.jsonl V2 schema, not derived. This removes the inference gap before the
tab is built, satisfying the "fix data gaps before building" guardrail.

---

## Challenge C7: Scouting Governance Qualitative Gates Are Solo-Illegible

**Target:** D7-F1 through D7-F14 — theoretical saturation + Feynman test +
Rogers' Five Factors as scouting termination criteria

**Steel-man:** The strongest version is that the ≤5% new-information threshold
(Hennig et al., PLOS ONE 2020) makes an otherwise subjective saturation judgment
auditable, Chesterton's Gate prevents the two known failure poles (cargo cult
and NIH), and the SCOUT-DECISION document requirement provides a concrete exit
artifact that prevents infinite scouting loops. These are rigorous frameworks
from peer-reviewed research and established software engineering practice.

**Challenge:** All four termination mechanisms require the solo developer to
accurately self-assess their own cognitive state. The ≤5% threshold requires
counting "genuinely new concepts" — but concept novelty is subjective. A solo
dev who wants to keep scouting will find new concepts; one who wants to stop
will not. The Feynman test ("I could deliver a 5-minute summary without notes")
is self-administered and fails exactly when the researcher is deepest in
confirmation bias (they think they understand it because they have spent weeks
on it). Rogers' Five Factors require predicting "relative advantage" for a
context they are still learning. The disconfirmation pass requires seeking
contradicting sources, but confirmation bias is precisely the tendency to not
seek them.

The research provides frameworks for stopping correctly but no mechanism for
detecting when the researcher is applying them incorrectly. For team research,
peer review catches this. For solo research, no such check exists.

**Evidence:**

- D7-F4 (Feynman test) is rated MEDIUM-HIGH confidence — the researcher
  explicitly downgraded confidence on this specific tool, suggesting awareness
  of its limitations.
- The CATEGORY OPEN conditions (D7 Section) include "Cannot articulate WHY the
  dominant pattern exists (Chesterton fails)" — but who determines if Chesterton
  passes? The solo researcher.
- The ≤5% threshold was developed for qualitative healthcare research with
  multiple coders and interrater reliability checks (PMC7200005). Adapting it to
  solo concept-counting drops the reliability mechanism that makes the threshold
  meaningful.
- D7-F11 (analysis paralysis signs) and D7-F12 (confirmation bias detection) are
  listed as findings but no specific detection mechanism is proposed beyond "ask
  external party" — which contradicts the solo-dev operating context.

**Strength:** MODERATE

**Recommended response:** MITIGATE

**Mitigation:** Add a concrete external check to the Phase-Level DONE criteria.
The Feynman test should require producing the 5-minute summary as a written
artifact (SCOUT-SUMMARY.md), not just an internal assessment. The written
artifact can be reviewed by an agent (e.g., a challenge agent, a skeptic agent)
rather than self-certifying. This introduces the equivalent of peer review
without requiring a human colleague.

---

## Challenge C8: Phase E Sequence Delays Value — Research-First May Be Wrong Order

**Target:** RESEARCH_OUTPUT.md Executive Summary — the entire Phase E sequence
(IDEA → BRAINSTORM → RESEARCH → PLAN → IMPLEMENT → TEST → COMPLETE)

**Steel-man:** The strongest version is that the Phase E sequence mirrors
well-established staged-commitment models (Stage-Gate, dual-track agile, lean
discovery) where investment escalates only after earlier phases de-risk the
decision. This prevents expensive IMPLEMENT work based on unvalidated
assumptions and is particularly important when implementation has irreversible
costs.

**Challenge:** The Phase E sequence is correct for novel technology decisions
but may be the wrong default for SoNash's actual project mix. Looking at the 15
de facto R&D projects in todos.jsonl, many have already completed informal
research and brainstorm phases in prior sessions. Forcing them through the
formal BRAINSTORM → RESEARCH gates adds ceremony without adding discovery value.
More critically, for projects where the creator builds for joy (MEMORY.md:
"Creates for joy, not shipping. Don't frame as MVP/delivery — frame as
craft/exploration"), a research-first gate may kill the project entirely. The
optimal R&D pipeline for a craft/exploration-oriented developer is IDEA →
IMPLEMENT → (retroactive RESEARCH if something doesn't work), not IDEA →
BRAINSTORM → RESEARCH → PLAN → IMPLEMENT.

The whitelist table (D1-F4) nominally allows IDEA→IMPLEMENT direct transition.
But the CL obligation table (D8 Stage-by-Stage) marks PLAN→IMPLEMENT as MUST
(for manually-created artifacts). If the user skips to IMPLEMENT, they skip the
PLAN stage CL gate that is explicitly MUST-level. The pipeline's "flexible"
whitelist and its CL obligation table are in tension: the whitelist says you can
skip; the CL protocol says you must not.

**Evidence:**

- MEMORY.md user_creation_mindset.md: "Creates for joy, not shipping. Don't
  frame as MVP/delivery — frame as craft/exploration." A mandatory RESEARCH gate
  before IMPLEMENT directly conflicts with this stated user preference.
- D1-F4 whitelist: IDEA→IMPLEMENT is listed as an allowed direct transition. D8
  CL obligation table: PLAN→IMPLEMENT is MUST. These produce a contradiction
  when IDEA→IMPLEMENT is taken: the transition bypasses PLAN, skipping a MUST
  gate, which the whitelist permits but the CL protocol prohibits.
- The research explicitly defers the tier assignment question (Open Question 5:
  "How is tier set on a PROJECT-type todo?"). CL obligation scales with tier, so
  a project with no tier assignment defaults to an unknown obligation level. The
  "MUST" marking in the CL table is meaningless until tier is resolved.
- D7-F10 (satisficing) argues for "stop when the aspiration level is met" — but
  the aspiration level for a joy-driven creator experimenting with JASON-OS is
  "interesting prototype" not "verified plan." The research framework does not
  acknowledge this mismatch.

**Strength:** MODERATE

**Recommended response:** MITIGATE

**Mitigation:** Reconcile the whitelist's skip-to-IMPLEMENT allowance with the
CL obligation table. Either: (a) mark IDEA→IMPLEMENT as "CL obligation: NONE,
acknowledged skip" (the deliberate shortcut path, no CL required), or (b)
require that any direct skip to IMPLEMENT still triggers a SHOULD-level CL at
the moment of skip (lighter than the MUST on PLAN→IMPLEMENT). Make the
creator-mode / craft- mode path first-class rather than an unacknowledged edge
case in the whitelist.

---

## Summary

|                           |                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Challenge count**       | 8                                                                                                                                                                                                                                                                                                                                                                                |
| **Strength distribution** | STRONG: 3 (C1, C2, C3) / MODERATE: 5 (C4, C5, C6, C7, C8) / WEAK: 0                                                                                                                                                                                                                                                                                                              |
| **Recommendations**       | ACCEPT: 0 / MITIGATE: 8 / REJECT: 0                                                                                                                                                                                                                                                                                                                                              |
| **Major issues**          | Two STRONG issues that could compromise implementation if unaddressed: (C1) the /todo shared-backend write-guard gap, and (C3) the false-positive pre-verified heuristic for CL obligation. A third STRONG issue (C2) concerns an explicitly open question in the research that should be verified before any implementation commits to the dual-path auto-advance architecture. |
