# Dispute Resolutions: Research-Discovery-Standard v2

**Resolver:** dispute-resolver **Date:** 2026-04-04 **Disputes resolved:** 5 (2
verifier conflicts + 3 STRONG contrarian challenges)

---

## Resolution 1: C-046 — migrate-todos-v2.js "Follows Exact Pattern" of Reference Scripts

**Type:** Ground-truth

**Summary:** C-046 claims that the proposed `migrate-todos-v2.js` script follows
the exact backup → dry-run → apply → validate pattern of `migrate-retros.js` and
`migrate-ecosystem-v2.js`. The verifier found that (a) `migrate-todos-v2.js`
does not yet exist, and (b) `migrate-retros.js` is a one-time data extraction
script, not a schema version bump, and does not implement a dry-run pattern.

**Evidence for original (C-046):** The two reference scripts do exist.
`migrate-retros.js` uses `origin: { type: 'migration' }` convention and performs
a transformation pass. The pattern description is architecturally reasonable for
the kind of migration needed. The claim's intent is to establish a design
pattern for the forthcoming script.

**Evidence for challenge (verifier):** T1 filesystem ground truth —
`migrate-todos-v2.js` does not exist anywhere in the codebase.
`migrate-retros.js` is a data extraction script that hydrates records, not a
schema version bump with dry-run safeguards. The "exact pattern" assertion is
not confirmed by the reference scripts' actual implementations.

**Verdict:** REVISED

**Reasoning:** The claim conflates two things: the aspirational design pattern
for a not-yet-written script, and an assertion that existing scripts implement
that pattern. The verifier's T1 evidence (filesystem) is authoritative on both:
the script does not exist, and the reference scripts do not fully implement the
claimed four-step pattern. However, the core design intent — that the migration
should use a backup → dry-run → apply → validate approach — is architecturally
sound and should be preserved as a prescriptive design requirement rather than a
description of existing precedent. The claim must be revised to remove the
"follows exact pattern" and "follows migrate-retros.js" framing and replace it
with "migrate-todos-v2.js should be written following this pattern."

**Revised claim text:** "The `migrate-todos-v2.js` migration script does not yet
exist and must be written. The recommended pattern is: backup via `git commit` →
dry-run output only → apply full-file overwrite → validate with
`render-todos.js`. The `origin: { type: 'migration' }` field convention is
borrowed from `migrate-retros.js`. The script must be idempotent: skip records
where `schema_version >= 2`."

**Impact on RESEARCH_OUTPUT.md:** Section D5 (Schema Migration), the summary
paragraph in the Executive Summary ("A `migrate-todos-v2.js` script follows the
exact pattern of `migrate-retros.js`"), and the Design Decisions table row for
"Migration script" must all be updated to use prescriptive ("must be written
following this pattern") rather than descriptive ("follows") language.

---

## Resolution 2: C-069 — "Decision D5 Independence" Wrong Decision Number

**Type:** Ground-truth (misinformation — citation error)

**Summary:** C-069 asserts that CL-PROTOCOL and /convergence-loop independence
is governed by "Decision D5." The verifier found that the independence decision
is D3 in the prior research output (`RESEARCH_OUTPUT.md:363`), not D5. The
substantive claim — that independence must be respected — is correct.

**Evidence for original (C-069):** The substance is correct: the prior research
explicitly decided to keep CL-PROTOCOL and /convergence-loop separate. Multiple
sources confirm the split between policy (CL-PROTOCOL) and execution
(/convergence-loop).

**Evidence for challenge (verifier):** T1 ground truth —
`.research/research-discovery-standard/RESEARCH_OUTPUT.md:363` explicitly names
the decision as D3 ("CL-PROTOCOL stays independent from convergence-loop"). D5
is not the independence decision. This is a precise, verifiable citation error
in the claims file.

**Verdict:** REVISED

**Reasoning:** The decision number is a factual citation that fails T1
verification. A wrong decision number in research output will cause downstream
confusion when anyone follows the cross-reference. The substance of the claim
survives intact; only the citation must be corrected. The verifier's T1 evidence
is definitive.

**Revised claim text:** "CL-PROTOCOL (policy: which checks to run, when, which
agents) and /convergence-loop (execution: T20 tally machinery) are intentionally
separate and must remain so. Decision **D3** independence must be respected per
`.research/research-discovery-standard/RESEARCH_OUTPUT.md:363`."

**Impact on RESEARCH_OUTPUT.md:** Section D8 (Convergence-Loop Integration),
wherever D5 is cited in connection with CL-PROTOCOL independence, must be
changed to D3. The Executive Summary reference to "CL-PROTOCOL and
/convergence-loop remain independent per D5" must be corrected to D3.

---

## Resolution 3: Contrarian C1 — /todo Shared-Backend Write-Guard Gap

**Type:** Guarantee (different reliability requirements)

**Summary:** The research positions `/rnd` as a thin view-layer on `todos.jsonl`
(C-038, D4-F6), with stage transitions guarded by a whitelist in
`rnd-config.json`. The contrarian challenge argues this is security theater: the
`/todo` interface mutates `todos.jsonl` without consulting `rnd-config.json`,
meaning any `/todo` write that modifies `stage` or `type` bypasses the whitelist
entirely.

**Evidence for original (C-038/D4-F6):** The thin view-layer model has genuine
advantages at 20-record solo-dev scale: no sync state, no duplication, and
`render-todos.js`'s `??` fallbacks make it forward-compatible. The architecture
is internally consistent when only `/rnd` is used to modify stage fields.

**Evidence for challenge (C1):** D1-F4 specifies unspecified transitions are
"forbidden." D1-F11 stores the whitelist in `rnd-config.json`. The `/todo`
SKILL.md mutation model is "read full file, apply changes in memory, write back"
— it does not reference `rnd-config.json` and never will unless explicitly
modified. The PARKED state's re-entry paths make blind overwrites especially
hazardous. C-038 is rated MEDIUM confidence — the researchers themselves were
less certain here. The contrarian's argument is grounded in a direct
architectural gap: the guard lives in one path but bypass lives in another.

**Verdict:** REVISED

**Reasoning:** This is a genuine architectural gap, not a different-scope
reading of the same problem. The whitelist is only protective if all write paths
consult it. Currently only one of two write paths (/rnd) would consult the
whitelist; the other (/todo) would not. For a formal guard claim to hold, the
guard must be in a shared layer beneath both interfaces, not in one interface's
logic. The contrarian's mitigation is precise and correct: a pre-write validator
that intercepts `stage` and `type` field mutations before any write to
`todos.jsonl` regardless of which skill initiated it. This is a required
addition, not an optional enhancement.

The thin view-layer architecture (both interfaces reading the same JSONL)
survives and remains the correct model. What changes is that a shared
write-guard layer must exist beneath both interfaces.

**Revised position:** "/rnd is a thin view-layer on todos.jsonl — this is
correct. However, the transition whitelist guard must be enforced at the write
layer (pre-write validator), not at the /rnd skill layer. Any write to
todos.jsonl that modifies `stage` or `type` fields — regardless of which skill
initiates it — must pass through a shared validator that consults
`rnd-config.json`. The /todo interface requires a pre-write hook or wrapper for
stage/type mutations."

**Impact on RESEARCH_OUTPUT.md:** Section D1 (State Machine), specifically
D1-F11 (declarative whitelist), must add an explicit statement that the guard
must be enforced at the write layer, not the view layer. Section D4 (PROJECT vs
TASK UX) must note that the /todo mutation path requires a write-guard
integration for stage/type fields. The Executive Summary statement about "/rnd
is a thin view-layer" must add a qualifier about the shared write-guard
requirement.

---

## Resolution 4: Contrarian C2 — FileChanged Hook Reliability Unverified on Windows

**Type:** Ground-truth (unverified feasibility claim presented as confirmed)

**Summary:** The research designates Claude Code's FileChanged hook as the
secondary real-time auto-advance path (D2-F1, C-013, C-015). The contrarian
challenge identifies three specific gaps: (1) Open Question 6 explicitly
acknowledges that whether `watchPaths` accepts directories vs. explicit file
paths is unconfirmed, making the 80-path feasibility unknown; (2) the Windows
fix evidence cited pertains to pre/post-commit hooks, not FileChanged hooks; (3)
the D2-F4 confidence is MEDIUM-HIGH rather than HIGH, while the synthesis treats
both paths as equally confident.

**Evidence for original:** FileChanged is a native Claude Code primitive (no
external dependencies). The lazy scan is the primary path — FileChanged is
explicitly secondary, with the dual-path architecture providing graceful
degradation if hooks fail. Windows path normalization patterns already exist in
`post-write-validator.js:117`. The session-start hook already reads
`todos.jsonl`, making `watchPaths` registration incremental.

**Evidence for challenge (C2):** Open Question 6 in RESEARCH_OUTPUT.md itself
acknowledges the watchPaths uncertainty — this is T1 (the research's own
admitted gap). With 20 active slugs x 4 artifact paths = 80 potential entries,
the feasibility limit is a real unknown. The Windows fix evidence is cited for a
different hook type (pre/post-commit). D2-F4 has explicitly downgraded
confidence. These are not theoretical risks; the research team identified them
and left them open.

**Verdict:** REVISED

**Reasoning:** The contrarian does not overturn FileChanged as the right
primitive — the steel-man is correct that it remains the lowest-overhead
real-time option. What the challenge correctly identifies is that the research
presents FileChanged as a co-equal secondary path without resolving the
feasibility question that could invalidate it at 80 paths. The research's own
Open Question 6 is a self-admission that a critical assumption is unverified.

The resolution is not to abandon FileChanged but to correctly characterize it:
FileChanged is a candidate for the secondary path pending a one-time feasibility
verification (watchPaths capacity test, directory vs. file-path confirmation).
Until that verification runs, it must not be implemented as a co-equal path — it
is a provisional design pending confirmation. The lazy scan remains
unambiguously primary.

**Revised position:** "FileChanged hook is the preferred secondary real-time
path if feasibility is confirmed. Before implementation: (1) verify whether
`watchPaths` accepts directories (preferred for scalability) or requires
explicit paths; (2) if explicit paths are required, verify the platform limit
exceeds 80 entries; (3) confirm FileChanged hook behavior on Windows
specifically (not inferred from pre/post-commit hook fixes). Until these three
checks pass, treat FileChanged as provisional. The lazy scan is the reliable
primary path in all cases."

**Impact on RESEARCH_OUTPUT.md:** Section D2 (Auto-Advance Architecture), the
Design Decisions table, and the Executive Summary must all downgrade FileChanged
from "confirmed secondary path" to "provisional secondary path pending
feasibility verification." Open Question 6 must be elevated from an open
question to a blocking prerequisite for the FileChanged implementation step.

---

## Resolution 5: Contrarian C3 — Skill-Completed Stages Pre-Verified Heuristic Has False-Positive Failure Modes

**Type:** Guarantee (reliability of the detection heuristic)

**Summary:** C-071 and C-072 claim that skill-completed stages are pre-verified,
using `claims.jsonl + at least one V*.md verifier file` as the detection
heuristic. The contrarian identifies three failure modes the heuristic does not
catch: (1) user ran deep-research through Phase 2 but aborted before Phase 3 CL
— V\*.md files exist, CL was not completed; (2) user ran deep-research at L0
depth with the expectation that /rnd's CL gate would catch what the quick pass
missed — the heuristic silently removes that gate; (3) `claims.jsonl` was
written by a pre-CL-integration version of the skill — heuristic fires on stale
artifacts.

**Evidence for original (C-071/C-072):** The three confirmed skills
(deep-research, deep-plan, brainstorm) do embed CL internally per their SKILL.md
files. For a complete, full-depth deep-research run, adding a pipeline-level CL
gate is genuinely redundant and adds ceremony. The V\*.md check improves on
claims.jsonl-only detection by requiring verifier output.

**Evidence for challenge (C3):** The research's own Contradictions table (D8-C2)
acknowledged the abort-before-Phase-2.5 failure mode — but then resolved it with
the V\*.md check, which the contrarian demonstrates is insufficient for cases 2
and 3. Case 2 (intentionally shallow L0 run) is particularly important: there is
a valid use case where the user wants the pipeline CL gate precisely because
they chose a shallow research depth. The current heuristic makes this impossible
without manual override. Case 3 (stale pre-integration artifacts) is a real risk
in a codebase that has been evolving the deep-research skill. Both cases are
grounded in real codebase behaviors (L0 depth option is confirmed in skill
files; research-index.jsonl inconsistency is confirmed in C-022/D2-F13).

**Verdict:** REVISED

**Reasoning:** C-071's core principle — that fully-executed skill-completed
stages should not receive redundant CL gates — is correct and survives. What
fails is C-072's specific detection heuristic. The V\*.md check is a necessary
condition for pre-verification but is not sufficient. The contrarian correctly
identifies that file existence does not prove completion quality.

The resolution requires a two-part fix. First, the heuristic needs a stronger
signal: the presence of a convergence-loop state file (the CL's own output
artifact) is a better proxy for CL completion than a verifier file produced
before CL runs. Second, a user-accessible override must exist: if the user
explicitly ran a shallow (L0) research pass and wants the pipeline CL gate to
apply, the heuristic must not prevent this. The design should be: default to
pre-verified when convergence-loop state artifact is present; default to
requires-CL-gate when it is absent; allow explicit user override in both
directions.

**Revised position:** "Skill-completed stages are pre-verified only when the
convergence-loop state file (not just any V*.md verifier file) is present in the
research findings directory. If only claims.jsonl and/or V*.md files are present
without a CL state artifact, treat the stage as manually-created and apply the
appropriate CL obligation. Users may explicitly mark a stage as pre-verified or
force-CL-gate via the /rnd interface regardless of artifact state."

**Impact on RESEARCH_OUTPUT.md:** Section D8 (CL Integration), Theme 3
("skill-completed stages are already pre-verified"), and C-072's detection
heuristic description must all be updated to require the CL state file as the
detection signal rather than V\*.md files. The Contradictions table entry for
D8-C2 must be updated to reflect that the resolution has been revised. The CL
obligation table (D8 Stage-by-Stage) must note that the pre-verified status is
conditional on the CL state artifact being present.

---

## Summary

**Disputes resolved:** 5 **Verdict distribution:**

- UPHELD: 0
- REVISED: 5
- OVERTURNED: 0
- BOTH-VALID: 0

**Sections of RESEARCH_OUTPUT.md requiring updates during Phase 3.9
re-synthesis:**

| Section                           | Required Change                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Executive Summary (D5 paragraph)  | "follows exact pattern" → "must be written following this pattern"                                    |
| Executive Summary (D8 paragraph)  | "per D5" → "per D3"                                                                                   |
| D1 (State Machine) — D1-F11       | Add: guard must be enforced at the write layer, not view layer                                        |
| D4 (PROJECT vs TASK UX)           | Add: /todo mutation path requires write-guard integration for stage/type fields                       |
| D5 (Schema Migration)             | Reframe migrate-todos-v2.js as prescriptive design, not existing precedent                            |
| D2 (Auto-Advance Architecture)    | Downgrade FileChanged from confirmed to provisional; elevate Open Question 6 to blocking prerequisite |
| D8 (CL Integration) — Theme 3     | Pre-verified detection requires CL state artifact, not V\*.md file                                    |
| D8 — C-072                        | Update detection heuristic to require convergence-loop state file                                     |
| D8 — Contradictions table (D8-C2) | Update resolution to reflect revised heuristic                                                        |
| D8 — CL obligation table          | Add conditional note: pre-verified status requires CL state artifact present                          |
