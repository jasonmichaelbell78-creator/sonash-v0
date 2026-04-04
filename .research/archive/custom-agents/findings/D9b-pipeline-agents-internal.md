# Findings: SQ9 (Part B) — Pipeline Role Analysis: What Custom Agents Does the Verification/Gap Pipeline Need?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ9-B

---

## Research Methodology

Primary sources read directly from filesystem (ground truth):

- `.claude/skills/deep-research/SKILL.md` (v1.8) — Phase overview, spawn rules,
  scaling tables
- `.claude/skills/deep-research/REFERENCE.md` (v1.5) — Sections 20, 21, 22: all
  pipeline prompt templates and algorithms
- `.claude/agents/global/deep-research-searcher.md` — Established custom agent
  pattern
- `.claude/agents/global/deep-research-synthesizer.md` — Established custom
  agent pattern
- `.research/custom-agents/findings/D8b-adversarial-internal.md` — Parallel
  findings from adversarial angle (cross-reference only)

**Scope boundary:** This analysis covers the NON-adversarial pipeline roles
(verification, dispute resolution, gap pursuit, gap verification, final
re-synthesis). The adversarial roles (contrarian, OTB) are covered by D8b. The
claim-verifier role is covered by BOTH because it is framed as adversarial in
D8b (checking claims against ground truth) but is a structural pipeline
requirement in this analysis.

---

## Key Findings

### Finding 1: Phase 2.5 Verification Agent — No Template Exists, Most Critical Gap [CONFIDENCE: HIGH]

The SKILL.md describes Phase 2.5 in one sentence:

> "Verification agents test claims against filesystem. Agent count: L1 (2), L2
> (2), L3 (3), L4 (4+). Split claims across agents to avoid context exhaustion.
> Each writes `findings/V<N>-<scope>.md` with per-claim verdict: VERIFIED or
> REFUTED with evidence."

Cross-checking all 22 sections of REFERENCE.md confirms: **there is no Phase 2.5
verification agent prompt template.** Section 20 (Phase Details) has a Phase 1
spawn prompt example, a Phase 3 verification sub-section (cross-model + CL), and
Phase 5 sub-steps — but no Phase 2.5 verification agent template. This is not an
omission by design; it is a genuine gap.

**What the verification agent receives (inferred from pipeline context):**

- `claims.jsonl` from Phase 2 synthesis — structured claims with IDs and
  evidence
- Source files referenced in those claims (for codebase-profile research topics)
- The findings directory path containing all D-agent findings
- The output path pattern `findings/V<N>-<scope>.md`
- Claim ID range to verify (split across N agents)

**What it must produce:**

- Per-claim verdict: `VERIFIED` or `REFUTED`
- For VERIFIED: cite the file, function, or source that confirms the claim
- For REFUTED: cite what is actually found vs what was claimed
- Scope: codebase claims get filesystem verification; external claims get source
  re-checking

**Tools required:**

- `Read`, `Grep`, `Glob` — for codebase claim verification (file:line evidence)
- `Bash` — for structural checks (`ls`, `git log`, file existence)
- `WebFetch`, `WebSearch` — for external claim re-verification
- No `Write` beyond its output file (should not modify research artifacts)

**Is the current inline approach sufficient?** No. The orchestrator currently
passes a few SKILL.md sentences as context to a general-purpose agent. Without a
custom definition, the verification agent:

1. Has no enforcement mechanism for file:line citation (the single most
   important requirement)
2. Does not know the difference between a codebase claim (needs filesystem) and
   an external claim (needs web)
3. Produces no structured return that tells the orchestrator how many claims
   were REFUTED — needed for the Phase 3.9 >20% trigger
4. Has no success criteria checklist preventing partial verification output

**SoNash-specific context needed:** Yes. A codebase-profile verification agent
for SoNash needs awareness of the patterns in CLAUDE.md Section 5 (anti-patterns
that would indicate a REFUTED claim if violated) and the repository layout to
efficiently locate files. This is best handled by passing project context at
spawn time rather than hardcoding into the agent definition.

---

### Finding 2: Phase 3.5 Dispute Resolution Agent — Schema-Driven but Workflow Integration Gaps [CONFIDENCE: HIGH]

The dispute-resolution template exists at REFERENCE.md Section 21.1.1 (15
lines). It defines a clear per-dispute output schema:

```
RESOLUTION: ORIGINAL UPHELD | CHALLENGER UPHELD | REVISED | INCONCLUSIVE
RATIONALE: [citing specific evidence from both sides]
IMPACT: [confidence change, section rewrite, recommendation affected]
CONFIDENCE: HIGH | MEDIUM | LOW in the resolution itself
```

**What conflicts it resolves:** Per REFERENCE.md 21.1: "V-agent marks a claim
REFUTED while the original D-agent and synthesizer treated it as HIGH
confidence" AND "contrarian and OTB agents disagree." These are two distinct
conflict types:

| Conflict Type         | Parties                                | Nature                                         |
| --------------------- | -------------------------------------- | ---------------------------------------------- |
| Verification conflict | V-agent REFUTED vs D-agent HIGH        | Factual: filesystem contradicts claim          |
| Challenge conflict    | Contrarian WEAKENED vs OTB CONFIRMED   | Evaluative: interpretation of evidence differs |
| Cross-agent conflict  | V-agent VERIFIED vs Contrarian REFUTED | Mixed: timing or scope mismatch                |

**Evidence weighing:** The template says "citing specific evidence from both
sides" but does not specify whether the resolver should gather NEW evidence
(third-source verification) or only reason from existing evidence. This is the
key missing piece — without guidance, a general-purpose model defaults to
reasoning from what it has, which may be insufficient for REFUTED vs HIGH
confidence disputes.

**Tools required:**

- `Read` — to access dispute sources (findings files, challenge files,
  claims.jsonl)
- `WebSearch`, `WebFetch` — for third-source verification when existing evidence
  is ambiguous
- `Bash` — potentially for filesystem re-verification
- `Write` — to produce `dispute-resolutions.md`

**Workflow integration gaps:**

1. **INCONCLUSIVE downstream handling is undefined.** SKILL.md Phase 3.9 says
   "re-synthesize if >20% of claims changed." INCONCLUSIVE disputes do not
   change claims. There is no guidance on whether INCONCLUSIVE counts toward the
   20% threshold (it shouldn't), or whether INCONCLUSIVE disputes should be
   escalated to the user. This pipeline gap will persist until the
   dispute-resolver has a defined handling protocol.

2. **No return protocol.** The orchestrator cannot parse how many disputes were
   resolved with each verdict type. The >20% trigger in Phase 3.9 requires a
   count of REFUTED + confidence-changed claims — the dispute-resolver must
   contribute to this count via structured return.

3. **Multi-agent append behavior is underspecified.** REFERENCE.md 21.1 says
   "each replacement writes to the same `findings/dispute-resolutions.md` file
   (append, not overwrite)." But there is no file lock, no section header
   separator schema, and no deduplication rule for when the same dispute is
   assigned to two agents.

**Custom agent justification:** MEDIUM-HIGH. The schema-driven nature reduces
free-form execution risk, but the evidence-gathering protocol gap, INCONCLUSIVE
handling gap, and return protocol gap are all real enough to justify a custom
definition. The dispute-resolver is also reusable outside deep-research
(wherever conflicting agent outputs need arbitration).

---

### Finding 3: Phase 3.95 Gap Pursuit Agent — Gap Detection and Gap Filling Are Distinct Tasks [CONFIDENCE: HIGH]

The SKILL.md Phase 3.95 description and REFERENCE.md Section 22 define two
sequential activities that are currently conflated:

**Activity A: Gap Detection (orchestrator responsibility)** REFERENCE.md Section
22.1 defines the 6-source scan algorithm for detecting actionable gaps:

1. Findings `## Gaps identified:` sections
2. Actionable serendipity items
3. V-agent REFUTED claims needing follow-up
4. Challenge "what the research missed" items
5. LOW/UNVERIFIED claims in claims.jsonl
6. RESEARCH_OUTPUT.md unresolved questions

This is an orchestrator activity — the orchestrator reads all findings and
produces a list of actionable gaps. **No agent is spawned for detection.**

**Activity B: Gap Filling (gap agent responsibility)** Once gaps are identified
and deduplicated, the orchestrator spawns `ceil(G/2)` gap-pursuit agents, each
assigned a cluster of related gaps to investigate.

**Are these separate agents?** Currently: NO. Detection happens inline
(orchestrator), filling happens via spawned agents. Should they be separate?
**Detection: no. Filling: custom agent, yes.**

The detection activity is algorithmic (scan 6 sources, apply deduplication,
apply actionability filter) and can remain inline. The gap-filling activity has
exactly the same structural need as the searcher: tool strategy, confidence
calibration, CRAAP evaluation, and return protocol.

**What the gap agent receives:**

- List of assigned gaps with source references (which D-agent or V-agent flagged
  them)
- Path to `RESEARCH_OUTPUT.md` (context for current state)
- Paths to referenced findings files
- Output path `findings/G<N>-<scope>.md`
- **Critical constraint:** non-recursion rule (its own gaps do NOT trigger
  another cycle)

**What it produces:**

- `findings/G<N>-<scope>.md` with Summary, Detailed Findings, Gaps
  (non-recursive), Serendipity sections
- Per-gap finding with citations organized by gap item
- Confidence levels for each new claim

**Tools required:**

- Profile-dependent: gap type determines tools
  - Codebase gap (a REFUTED claim about a file): `Read`, `Grep`, `Glob`, `Bash`
  - External knowledge gap (a missing web source): `WebSearch`, `WebFetch`
  - Documentation gap: `mcp__context7__query-docs`
- The gap-pursuer is fundamentally a multi-profile searcher with a narrowed
  scope

**Gap type → tool strategy mapping (missing from current template):**

| Gap Source               | Likely Gap Type              | Tool Profile                    |
| ------------------------ | ---------------------------- | ------------------------------- |
| V-agent REFUTED          | Codebase claim contradiction | Codebase (Grep/Read/Bash)       |
| LOW/UNVERIFIED claims    | Insufficient web sources     | Web (WebSearch/WebFetch)        |
| Challenge "missed items" | Angle not explored           | Web or docs (profile-dependent) |
| Serendipity items        | Adjacent domain              | Web (WebSearch)                 |
| Unresolved questions     | Complex multi-domain         | Mixed                           |

**Relationship to deep-research-searcher:** The gap-pursuer and searcher share:
tool strategy, confidence calibration, CRAAP+SIFT evaluation, structured return.
They differ in: scope (narrowed to gaps vs broad sub-questions), recursion
enforcement (non-recursion rule), and input format (gap list vs sub-question
list). The implementation options are:

| Option                                                | Pros                                               | Cons                                           |
| ----------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Separate `deep-research-gap-pursuer` agent            | Clean non-recursion enforcement, distinct identity | Duplicates tool strategy section with searcher |
| `deep-research-searcher` with `gap_pursuit_mode` flag | No duplication, inherits all methodology           | Flag-based switching adds complexity           |
| Gap-pursuer inherits from searcher via reference      | Clean separation                                   | Agent system does not support inheritance      |

**Recommendation:** Separate definition (`deep-research-gap-pursuer`). The
non-recursion rule and the gap-specific output format (Gap section explicitly
noting "these will NOT trigger another cycle") are different enough in
philosophy to warrant a distinct identity. The tool strategy can be copied from
the searcher; duplication is acceptable given the distinct operational
constraints.

---

### Finding 4: Phase 3.96 Gap Verification Agent — Same Pattern as Phase 2.5, Different Input [CONFIDENCE: HIGH]

The gap-verification template (REFERENCE.md Section 22.4) is 11 lines:

```
You are a gap-verification agent. Check gap-pursuit findings against ground truth.

## Scope: [codebase claims | cross-claim consistency]
Read .research/<topic>/findings/G<N>-*.md files.

For each claim:
  VERIFIED (with file:line evidence) or REFUTED (with what's actually there).

Cross-check gap findings against original findings for consistency. Flag any
contradictions between gap-pursuit findings and the original research.

Write to: .research/<topic>/findings/GV<N>-<scope>.md
```

Comparing this to Phase 2.5: the structural role is identical (read claims,
produce VERIFIED/REFUTED with evidence). The only difference is the input files:

- Phase 2.5: reads `claims.jsonl` claims from D-agent findings
- Phase 3.96: reads `G<N>-*.md` gap-pursuit findings

Additionally, Phase 3.96 has a second scope that Phase 2.5 does not:
**cross-claim consistency** (checking whether gap findings contradict original
findings). This is a consistency check, not a filesystem verification check.

**Minimum 2 agents defined by REFERENCE.md Section 22.4:**

- GV1: codebase claims from gap-pursuit against filesystem
- GV2: cross-claim consistency between gap findings and original research

GV2 is a new type of verification not present in Phase 2.5. It requires reading
both the original RESEARCH_OUTPUT.md AND the gap findings, then identifying
contradictions. This is closer to the synthesizer's contradiction-surfacing role
than the verifier's VERIFIED/REFUTED role.

**Should gap-verifier be unified with Phase 2.5 verifier?**

D8b recommended a single `deep-research-verifier` agent with spawn-time scoping.
This analysis refines that recommendation:

| Scope Mode             | Inputs                          | Tools          | Output                             |
| ---------------------- | ------------------------------- | -------------- | ---------------------------------- |
| Phase 2.5 codebase     | claims.jsonl D-agent claims     | Grep/Read/Bash | V<N>.md: VERIFIED/REFUTED          |
| Phase 3.96 codebase    | G<N>-\*.md gap-pursuit claims   | Grep/Read/Bash | GV<N>.md: VERIFIED/REFUTED         |
| Phase 3.96 consistency | G<N>-\*.md + RESEARCH_OUTPUT.md | Read           | GV<N>.md: CONTRADICTION/CONSISTENT |

The first two modes are structurally identical — the same agent definition with
different input path parameters handles both. The third mode (consistency check)
has different logic (no file:line verification needed, reasoning over claim
text). A unified `deep-research-verifier` can handle all three modes by treating
them as sub-modes with different execution paths.

**Unified verifier specification outline:**

```
upstream_input: {
  claims_source: "claims.jsonl" | "G-agent findings",
  scope: "codebase" | "consistency",
  output_prefix: "V" | "GV",
  output_dir: ".research/<topic>/findings/"
}
```

The `scope: "consistency"` mode is the key addition over D8b's recommendation —
it requires different instructions than the `codebase` mode.

---

### Finding 5: Phase 3.97 Final Re-Synthesizer — Distinct Enough to Justify Separate Agent [CONFIDENCE: HIGH]

The final re-synthesizer template (REFERENCE.md Section 22.5) defines a role
that is explicitly different from the Phase 2 synthesizer:

**Phase 2 synthesizer (`deep-research-synthesizer`):**

- Input: all D-agent `findings/*.md` files
- Task: CREATE unified research output from scratch
- Output: RESEARCH_OUTPUT.md (new), claims.jsonl (new), sources.jsonl (new),
  metadata.json (new)
- Philosophy: synthesis from multiple fragmented sources

**Phase 3.97 final re-synthesizer:**

- Input: current `RESEARCH_OUTPUT.md` + all intermediate files (D + V +
  challenges + disputes + G + GV)
- Task: EDIT existing report (not rewrite from scratch)
- Output: updated RESEARCH_OUTPUT.md (edited), updated claims.jsonl, updated
  sources.jsonl, updated metadata.json
- Philosophy: selective incorporation, not full re-synthesis

The REFERENCE.md Section 22.5 template makes this explicit: "EDIT the report --
do not rewrite from scratch." This is a fundamentally different cognitive task.

**Specific distinctions:**

| Dimension              | Phase 2 Synthesizer               | Phase 3.97 Final Re-Synthesizer                                                              |
| ---------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Starting state         | Empty RESEARCH_OUTPUT             | Existing report with established structure                                                   |
| Claim ID scheme        | C-001 sequential                  | C-G001 for new gap claims; original IDs preserved for edits                                  |
| Task mode              | Create                            | Edit/append                                                                                  |
| Contradiction handling | Surface to Contradictions section | Incorporate gap-verification corrections inline                                              |
| Scope                  | All D-agent findings              | Only gap-pursuit delta                                                                       |
| Confidence changes     | Initial assignment                | Upgrade/downgrade based on new evidence                                                      |
| CL-standard            | Not specified                     | Required (Section 22.8)                                                                      |
| metadata.json          | Creates from scratch              | Updates 4 specific fields (gapFillRounds, gapAgentCount, gapClaimsAdded, totalClaimsPostGap) |

**Is the Phase 2 synthesizer reusable here?** Not without modification. If the
Phase 2 synthesizer is spawned for Phase 3.97, it will:

1. Attempt to create a NEW RESEARCH_OUTPUT.md (its core execution flow Step 6)
2. Re-assign C-001 IDs to all claims (Step 7), losing the original claim ID
   history
3. Lose the established structural sections (not preserve Challenges section
   added by contrarian/OTB)
4. Not apply the CL-standard post-synthesis

The Phase 3.97 re-synthesizer needs an explicit "edit mode" with different
execution flow.

**Custom agent vs inline:** The current REFERENCE.md template (29 lines) is more
complete than most pipeline templates — it specifies exactly which files to
read, what to edit, what claim IDs to use, and what metadata to update. However,
it lacks:

- The "do not rewrite from scratch" enforcement as a `<philosophy>` section
  (prevents mode collapse to full-rewrite)
- CL-standard definition reference (the synthesizer doesn't know to invoke
  convergence-loop verification)
- Structured return protocol (orchestrator cannot programmatically detect how
  many gap claims were added)
- Success criteria checklist (no completion enforcement)

**Recommendation:** A separate `deep-research-final-synthesizer` agent
definition is justified. The edit-vs-create distinction is philosophically
important enough to require its own identity section. A general-purpose model
with the current 29-line template has a high probability of defaulting to
full-rewrite behavior, losing all intermediate verification and challenge work.

**Alternatively:** The existing `deep-research-synthesizer` could be extended
with a `<mode>` parameter (create | edit). The edit mode would override the
execution flow. This is architecturally cleaner but requires modifying a
working, tested definition. Given the risks of mode-switching logic, a separate
definition is lower risk.

---

### Finding 6: Phase 3.9 Post-Challenge Re-Synthesizer — Inline or Agent? [CONFIDENCE: MEDIUM]

Phase 3.9 is triggered when >20% of claims change after verification +
challenges + disputes. It uses the synthesizer to produce an updated
RESEARCH_OUTPUT.md. The REFERENCE.md Section 21.2 says:

> "Full re-synthesis using CL-standard. The synthesizer reads ALL findings,
> verification results, challenge outputs, and dispute resolutions."

This is also an "edit mode" task — but it is triggered more frequently than
Phase 3.97 (anytime >20% change, even when no gap pursuit happens). The question
is whether this needs a separate agent from Phase 3.97.

**Key differences from Phase 3.97:**

- Phase 3.9: triggered by >20% change from verification/challenges, before gap
  pursuit
- Phase 3.97: triggered always (if gap agents spawned), after all phases

The re-synthesis task is similar enough that a single "edit mode" synthesizer
could handle both Phase 3.9 and Phase 3.97. The differences are in what inputs
are available (Phase 3.9 has no G-agent files; Phase 3.97 has all files). A
single `deep-research-final-synthesizer` agent receiving different input file
sets at spawn time would cover both phases.

**Unresolved question:** Does Phase 3.97 always run even if Phase 3.9 already
ran? SKILL.md implies yes — they are separate triggers. Phase 3.9 incorporates
verification/challenge changes; Phase 3.97 incorporates gap-pursuit changes.
They are not redundant.

---

### Finding 7: Tool Set Analysis — Which Pipeline Agents Need Non-Standard Tools [CONFIDENCE: HIGH]

Mapping each pipeline role to required tools:

| Role                      | Read | Write | Grep | Glob | Bash | WebSearch | WebFetch | Context7 |
| ------------------------- | ---- | ----- | ---- | ---- | ---- | --------- | -------- | -------- |
| Verification (2.5)        | Y    | Y     | Y    | Y    | Y    | Y         | Y        | N        |
| Dispute Resolution (3.5)  | Y    | Y     | N    | N    | N    | Y         | Y        | N        |
| Gap Pursuit (3.95)        | Y    | Y     | Y    | Y    | Y    | Y         | Y        | Y        |
| Gap Verification (3.96)   | Y    | Y     | Y    | Y    | Y    | N         | N        | N        |
| Final Re-Synthesis (3.97) | Y    | Y     | N    | N    | Y    | N         | N        | N        |

Key observations:

- Verification and gap-verification: **codebase-heavy** (Grep, Glob, Bash) —
  similar to the searcher's codebase profile
- Dispute resolution: **read-heavy + external validation** (Read +
  WebSearch/WebFetch for third-source verification)
- Gap pursuit: **full tool set** — same as the deep-research-searcher (inherits
  all profiles)
- Final re-synthesis: **filesystem read + write only** — similar to the
  synthesizer (no search needed)

The verifier and gap-verifier share a tool set. The dispute-resolver is a
minimal tool set (reads + external search). The gap-pursuer needs the full
searcher tool set. The final re-synthesizer needs only the synthesizer tool set.

---

### Finding 8: Agent Count Recommendation — Minimum vs Ideal Set [CONFIDENCE: HIGH]

**D8b recommendation (from adversarial angle):**

- 4 definitions: contrarian-challenger, otb-challenger, deep-research-verifier,
  dispute-resolver
- Gap-pursuer: DEFER (extend searcher or separate definition TBD)
- Final re-synthesizer: NOT COVERED by D8b

**This analysis adds (pipeline workflow angle):**

- Phase 3.97 final re-synthesizer justifies a separate definition
- Gap-pursuer: separate definition recommended (non-recursion philosophy is
  distinct enough)
- Unified verifier confirmed: one definition covers Phase 2.5 + Phase 3.96 (both
  modes)
- Phase 3.9 re-synthesizer: can share with Phase 3.97 final re-synthesizer via
  different input set

**Complete pipeline agent recommendation:**

| Agent Name                        | Phases Covered | Priority | Notes                                                                               |
| --------------------------------- | -------------- | -------- | ----------------------------------------------------------------------------------- |
| `deep-research-verifier`          | 2.5, 3.96      | P1       | Unified: codebase mode + consistency mode at spawn time                             |
| `dispute-resolver`                | 3.5            | P2       | Schema-driven template exists; gaps in evidence-gathering and INCONCLUSIVE handling |
| `deep-research-gap-pursuer`       | 3.95           | P2       | Separate from searcher; non-recursion enforcement distinct                          |
| `deep-research-final-synthesizer` | 3.9, 3.97      | P2       | Edit mode vs create mode; covers both post-challenge and gap-fill synthesis         |

Combined with D8b's adversarial analysis:

**Minimum viable set (4 agents):**

1. `deep-research-verifier` — covers 2 phases (P1)
2. `contrarian-challenger` — adversarial (P1)
3. `otb-challenger` — adversarial (P1)
4. `deep-research-final-synthesizer` — covers 2 phases (P2, but no current
   custom definition exists)

**Ideal set (6 agents):** All 4 above, plus: 5. `dispute-resolver` — schema
exists but workflow gaps warrant custom definition (P2) 6.
`deep-research-gap-pursuer` — searcher variant with non-recursion enforcement
(P2)

**Shared agent opportunities:**

- `deep-research-verifier` unifies Phase 2.5 and Phase 3.96 (2 roles, 1
  definition)
- `deep-research-final-synthesizer` unifies Phase 3.9 and Phase 3.97
  re-synthesis (2 triggers, 1 definition)
- `deep-research-gap-pursuer` could theoretically share code with
  `deep-research-searcher` but a separate definition reduces maintenance risk

**Total new definitions needed: 4 non-adversarial + 2 adversarial (from D8b) = 6
total new agent definitions**

---

### Finding 9: Established Pattern Compliance — What New Agents Must Match [CONFIDENCE: HIGH]

Both existing custom agents follow an 11-section structure (see D8b Finding 7
for full listing). New pipeline agents must match this pattern. Key structural
requirements:

1. **Frontmatter:** `name`, `model`, `description` (2-3 sentences), `tools`
   (explicit list), `color`
2. **`<role>`** section: identity, spawner, job, core responsibilities
3. **`<upstream_input>`** section: what spawn prompt must contain — critical for
   pipeline agents that receive structured data (claim IDs, file paths, scope
   parameters)
4. **`<structured_returns>`** section: both success and blocked variants —
   critical for the orchestrator's >20% trigger calculation
5. **`<success_criteria>`** checklist: prevents partial completion

**Critical for pipeline agents specifically:** The `<upstream_input>` section is
more important for pipeline agents than for searcher/synthesizer because
pipeline agents receive structured orchestrator-assembled payloads (claim
batches, dispute lists, gap clusters) rather than natural-language
sub-questions. The input schema must be explicit to prevent orchestrators from
assembling malformed payloads.

---

### Finding 10: Interaction Complexity — Which Roles Are Opus-Worthy [CONFIDENCE: MEDIUM]

The existing searcher and synthesizer both use `model: sonnet`. D4a/D4b research
(W1 findings) concluded Sonnet for bounded execution, Opus for complex
reasoning.

Pipeline role complexity assessment:

| Role                                | Reasoning Type                                          | Complexity  | Model Recommendation                    |
| ----------------------------------- | ------------------------------------------------------- | ----------- | --------------------------------------- |
| Verification (2.5)                  | Deductive (does file:line evidence match claim?)        | Bounded     | Sonnet                                  |
| Dispute resolution (3.5)            | Evaluative (weigh conflicting evidence, reach verdict)  | Medium      | Sonnet preferred; Opus for 10+ disputes |
| Gap pursuit (3.95)                  | Exploratory (same as searcher)                          | Medium-High | Sonnet (matches searcher)               |
| Gap verification (3.96) codebase    | Deductive                                               | Bounded     | Sonnet                                  |
| Gap verification (3.96) consistency | Analytical (cross-claim consistency across large files) | Medium      | Sonnet                                  |
| Final re-synthesis (3.97)           | Selective integration (edit, not rewrite)               | Medium      | Sonnet                                  |

No pipeline role clearly requires Opus by default. However, the dispute-resolver
handling 10+ disputes with conflicting evidence from multiple sources could
benefit from Opus — this is a candidate for a `model: opus` frontmatter with a
note that it scales to Opus at high dispute count.

---

## Sources

| #   | Path                                                           | Type           | Trust | CRAAP | Date       |
| --- | -------------------------------------------------------------- | -------------- | ----- | ----- | ---------- |
| 1   | `.claude/skills/deep-research/SKILL.md` (v1.8)                 | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 2   | `.claude/skills/deep-research/REFERENCE.md` S20                | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 3   | `.claude/skills/deep-research/REFERENCE.md` S21                | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 4   | `.claude/skills/deep-research/REFERENCE.md` S22                | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 5   | `.claude/agents/global/deep-research-searcher.md`              | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 6   | `.claude/agents/global/deep-research-synthesizer.md`           | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 7   | `.research/custom-agents/findings/D8b-adversarial-internal.md` | prior research | HIGH  | 5/5   | 2026-03-29 |

---

## Contradictions

**Tension with D8b on gap-pursuer design:** D8b recommended deferring the
gap-pursuer decision (extend searcher vs separate definition). This analysis
recommends a separate definition. The difference is not a factual contradiction
— D8b was uncertain; this analysis resolves the uncertainty toward separate
definition based on the non-recursion philosophy encoding argument.

**Tension on Phase 3.9 vs 3.97 re-synthesis:** SKILL.md implies Phase 3.9 and
Phase 3.97 are both re-synthesis steps that produce an updated
RESEARCH_OUTPUT.md. This analysis recommends a single
`deep-research-final-synthesizer` handling both. However, Phase 3.9 runs BEFORE
gap pursuit and Phase 3.97 runs AFTER — they have different available input
files. If both are served by the same agent, the spawn prompt must clearly
distinguish which input files are available at each phase. This is an unresolved
design question.

**D8b did not cover the final re-synthesizer (Phase 3.97).** This analysis fills
that gap. No contradiction exists, but the two findings documents should be read
together for a complete pipeline picture.

---

## Gaps

1. **Phase 3.9 vs Phase 3.97 split:** The exact file input contract for a
   unified `deep-research-final-synthesizer` serving both phases has not been
   fully specified. The agent definition will need to handle the case where gap
   files (G*.md, GV*.md) do not yet exist when Phase 3.9 runs.

2. **Return protocol schema for >20% trigger:** SKILL.md requires re-synthesis
   when >20% of claims change. No schema exists for how the orchestrator counts
   changes across Phase 2.5 + Phase 3 + Phase 3.5 returns. Designing the
   structured returns for verification/challenge/dispute agents will require
   agreeing on a consistent change-count schema.

3. **Consistency-scope verification (GV2) output format:** The cross-claim
   consistency mode for Phase 3.96 produces CONTRADICTION/CONSISTENT verdicts,
   not VERIFIED/REFUTED. The output file format for this mode is not defined
   anywhere. The agent definition will need to invent this schema.

4. **Gap detection algorithmic correctness:** The 60% keyword overlap
   deduplication rule in REFERENCE.md Section 22.1 is asserted without
   rationale. It is possible this threshold produces too many or too few unique
   gaps. No empirical evidence exists in the codebase for this number.

---

## Serendipity

**The Phase 3.9 and 3.97 re-synthesis steps are architectural duplicates that
could cause a "double rewrite" problem.** If Phase 3.9 triggers (>20% changed)
AND gap pursuit activates (gaps found), the synthesizer is invoked twice in
sequence. Each invocation reads the current RESEARCH_OUTPUT.md and produces an
updated version. If these are separate invocations with the current synthesizer,
the second one does not know what the first one changed — it may undo Phase 3.9
corrections. The unified `deep-research-final-synthesizer` with phase-awareness
is architecturally necessary to prevent this.

**The verifier's two modes (codebase + consistency) could inform a
general-purpose "research claim auditor" agent pattern** useful beyond
deep-research — anywhere multiple agents produce overlapping claims about a
codebase or document set, a consistency-check verification pass would catch
contradictions before they reach synthesis.

**Dispute resolution handles claims from Phase 2.5 (V-agent REFUTED) AND from
Phase 3 (contrarian WEAKENED).** This means the dispute-resolver must read two
different file types with two different verdict schemas (VERIFIED/REFUTED from
V-agents vs CONFIRMED/WEAKENED/REFUTED from contrarian/OTB). The
dispute-resolver agent definition needs to translate between these schemas,
which is not mentioned in any current template.

---

## Per-Role Analysis Table

| Role               | Phase | Template                                       | Input                                                  | Output                                                | Tools                   | Agent Needed                            | Priority     | Shared With                     |
| ------------------ | ----- | ---------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- | ----------------------- | --------------------------------------- | ------------ | ------------------------------- |
| Verification       | 2.5   | None                                           | claims.jsonl + filesystem                              | V<N>.md VERIFIED/REFUTED                              | Read/Grep/Glob/Bash/Web | YES — `deep-research-verifier`          | P1           | Phase 3.96 (codebase mode)      |
| Dispute resolution | 3.5   | 15 lines (schema-driven)                       | disputes list + findings files                         | dispute-resolutions.md                                | Read/Write/WebSearch    | YES — `dispute-resolver`                | P2           | —                               |
| Gap pursuit        | 3.95  | 29 lines (detection inline, filling via agent) | gap list + RESEARCH_OUTPUT.md                          | G<N>.md                                               | All (profile-dependent) | YES — `deep-research-gap-pursuer`       | P2           | —                               |
| Gap verification   | 3.96  | 11 lines (skeletal)                            | G-agent findings + (original findings for consistency) | GV<N>.md                                              | Read/Grep/Glob/Bash     | YES — unified with verifier             | P1 (unified) | Phase 2.5 (codebase mode)       |
| Final re-synthesis | 3.97  | 29 lines                                       | All findings + current RESEARCH_OUTPUT                 | Updated RESEARCH_OUTPUT + claims + sources + metadata | Read/Write/Bash         | YES — `deep-research-final-synthesizer` | P2           | Phase 3.9 (same edit-mode task) |

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings derived from direct filesystem reads of the pipeline source files.
No training-data assertions. Recommendations are derived from comparison between
the established custom agent patterns (searcher, synthesizer at 344-386 lines)
and the current general-purpose templates (11-29 lines).
