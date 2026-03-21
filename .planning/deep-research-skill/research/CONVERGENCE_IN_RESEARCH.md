# Convergence Loops in Deep Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH
**Source:** Agent analysis of `/convergence-loop` skill applicability to deep-research
<!-- prettier-ignore-end -->

## Executive Summary

Convergence loops should serve as the backbone of research verification in the
deep-research skill. The existing `/convergence-loop` skill provides a
battle-tested framework (multi-pass verification, T20 tallies, composable
behaviors, graduated convergence) that maps directly onto research verification
needs. Rather than building a new verification system, deep-research should
invoke convergence loops at three distinct points: finding verification,
synthesis verification, and completeness verification. The key design challenge
is granularity and cost management -- full convergence on every finding is
prohibitively expensive, so a tiered approach is necessary where verification
depth scales with research depth and claim criticality.

---

## Current Convergence Loop Capabilities

The `/convergence-loop` skill (v1.1) provides the following capabilities that
are directly reusable for research:

### Core Mechanism

- **Multi-pass verification** with minimum 2 passes, hard cap of 5
  (configurable)
- **T20 tally** per pass: Confirmed / Corrected / Extended / New
- **Graduated convergence** -- individual claims graduate independently when
  they receive 2+ consecutive "Confirmed" results; unconverged claims continue
- **User gate** before convergence declaration (per CLAUDE.md guardrail #2)
- **State persistence** to survive compaction (critical for long research tasks)
- **Contradictions are findings** -- disagreements surface with evidence from
  both sides rather than being silently resolved

### Six Composable Behaviors

| Behavior            | Research Applicability                                     |
| ------------------- | ---------------------------------------------------------- |
| `source-check`      | Direct fit: verify research findings against cited sources |
| `discovery`         | Direct fit: find gaps in research coverage                 |
| `verification`      | Direct fit: confirm/correct existing findings              |
| `fresh-eyes`        | Direct fit: independent verification with zero prior bias  |
| `write-then-verify` | Maps to synthesis: produce summary, then verify it         |
| `fix-and-re-verify` | Maps to correction: fix a finding, re-verify the fix       |

### Three Presets

| Preset     | Passes | Research Use Case                                 |
| ---------- | ------ | ------------------------------------------------- |
| `quick`    | 2      | Quick lookup verification, low-stakes findings    |
| `standard` | 3      | Normal research verification                      |
| `thorough` | 5      | Deep research on critical or controversial topics |

### Integration Points

The skill already supports **programmatic mode** -- callers implement the Setup
-> Loop -> Report sequence without invoking `/convergence-loop` directly. It
also supports a **prompt customization hook** where callers inject
domain-specific instructions into agent prompts. Both mechanisms are exactly
what deep-research needs.

---

## Research Verification Patterns

### Finding Verification

Individual research findings are claims about the world. They map directly to
the convergence loop's claim model: a testable assertion plus its source.

#### Cross-Source Verification

**Pattern:** Finding discovered in Source A is verified against Source B.

This maps to the `source-check` behavior with a twist: rather than checking
claims against their _cited_ source, the agent checks claims against
_independent_ sources. The prompt customization hook enables this:

```
custom_instructions: "For each finding, verify against at LEAST one source
that was NOT the original discovery source. If only one source exists,
flag as SINGLE-SOURCE with the finding's claim."
```

**Slicing strategy:** `findings-by-topic` -- group findings by sub-question so
each agent handles a coherent research area.

**Convergence criteria:** A finding is cross-source verified when 2+ independent
sources confirm it, or when it is explicitly flagged as single-source (which is
itself a valid research outcome -- some findings have limited sourcing).

#### Temporal Verification

**Pattern:** Claim was true at time T, verify it is still true at time T+N.

This is critical for research where sources may be outdated. The existing
`source-check` behavior can be extended via prompt customization:

```
custom_instructions: "For each finding, note the date of the source material.
If the source is older than [threshold], flag as TEMPORAL-RISK. If a more
recent source contradicts an older one, the more recent source takes precedence
unless the older source is more authoritative."
```

**Temporal threshold guidance:**

- Technical facts (API versions, library behavior): 6-12 months
- Statistical data: 1-2 years
- Conceptual/theoretical claims: 3-5 years
- Historical facts: no expiry (but historiography evolves)

#### Self-Consistency Verification

**Pattern:** Does finding X contradict finding Y?

This maps to the `fresh-eyes` behavior across the entire findings set. A
fresh-eyes agent with zero prior context reads all findings and flags
contradictions. The convergence loop's existing "contradictions are findings"
rule applies directly -- the contradiction itself becomes a research finding
that needs resolution.

**Implementation:** Run a dedicated self-consistency pass after all per-topic
verification is complete. One agent reads all findings holistically, looking
for:

- Direct contradictions (A says X, B says not-X)
- Tension (A implies X, B implies something that makes X unlikely)
- Missing connections (A and B both point to C, but C is never stated)

#### Expert/Authority Verification

**Pattern:** Does the finding align with authoritative sources on the topic?

This is a variation of cross-source verification where the sources are
specifically authoritative (official documentation, peer-reviewed papers,
canonical references). Prompt customization:

```
custom_instructions: "Prioritize authoritative sources: official documentation,
peer-reviewed publications, recognized industry standards. If a finding is
supported only by blog posts or forum discussions, flag as LOW-AUTHORITY.
If it contradicts an authoritative source, flag as AUTHORITY-CONFLICT."
```

### Synthesis Verification

After individual findings are verified, they are synthesized into a coherent
research output. Synthesis introduces new failure modes: misrepresentation,
omission, and unjustified conclusions.

#### Faithful Representation Check

**Pattern:** Does the synthesis accurately represent the underlying findings?

This maps directly to the `write-then-verify` behavior. Phase A produces the
synthesis; Phase B verifies it against the raw findings.

**Verification agent prompt:**

```
For each claim in the synthesis:
1. Identify the underlying finding(s) it represents
2. Verify the synthesis accurately reflects those findings
3. Flag any editorial additions not supported by findings (UNSUPPORTED)
4. Flag any hedging/strengthening of original claims (DISTORTED)
5. Report using T20 format: Confirmed/Corrected/Extended/New
```

#### Omission Check

**Pattern:** Were any important findings dropped during synthesis?

This is a `discovery`-type behavior run against the synthesis. The agent
receives both the raw findings and the synthesis, looking for what is missing:

```
custom_instructions: "Your PRIMARY goal is to find findings that were NOT
represented in the synthesis. For each omission, assess: was it reasonably
excluded (tangential, redundant) or improperly dropped (relevant, unique)?
Flag improper omissions as OMITTED-CRITICAL."
```

#### Traceability Check

**Pattern:** Can claims in the final output be traced to specific sources?

Every claim in the research output should be traceable to either: (1) a specific
verified finding with its source, or (2) an explicit inference drawn from
multiple findings (marked as such). The verification agent checks:

```
For each claim in the output:
- Can I trace this to a specific finding? -> TRACED
- Is this an inference from multiple findings? -> INFERRED (acceptable if marked)
- Is this unsupported? -> UNSUPPORTED (must fix or remove)
```

### Completeness Verification

#### Sub-Question Coverage

**Pattern:** Were all sub-questions addressed?

The deep-research skill decomposes a research question into sub-questions. After
research is complete, a `verification` pass checks each sub-question against the
findings:

```
For each sub-question in the research plan:
- Is it addressed by one or more findings? -> COVERED
- Is it partially addressed? -> PARTIAL (note what's missing)
- Is it unaddressed? -> GAP (critical finding)
```

This uses `claims-by-category` slicing where the "claims" are the sub-questions
themselves.

#### Gap Detection

**Pattern:** Are there obvious gaps in coverage?

This maps to the `discovery` behavior. An agent reads the research question, the
sub-questions, and the findings, then looks for:

- Questions that should have been asked but were not
- Perspectives that were not represented
- Adjacent topics that inform the main question but were not explored

**Cost note:** Gap detection is expensive (it is essentially "do more
research"). It should be used at `thorough` depth only, or when the user
explicitly requests completeness verification.

#### Perspective Diversity

**Pattern:** Were diverse perspectives included?

For research topics where perspectives matter (policy, design decisions,
controversial technical topics), a verification pass checks:

```
custom_instructions: "Assess whether the findings represent diverse
perspectives on the topic. Flag if all sources share the same viewpoint,
methodology, or affiliation. Note any known counter-arguments or alternative
approaches that are absent."
```

---

## Integration Architecture

### When Deep-Research Should Invoke Convergence Loops

The deep-research orchestrator invokes convergence loops at three points, with
depth scaled to the research mode:

```
RESEARCH PHASES:
  1. Question Decomposition  -- no convergence (planning, not claims)
  2. Source Discovery         -- no convergence (exploration, not claims)
  3. Finding Extraction       -- no convergence (raw data collection)
  4. Finding Verification     -- CONVERGENCE POINT 1
  5. Synthesis                -- no convergence (writing phase)
  6. Synthesis Verification   -- CONVERGENCE POINT 2
  7. Completeness Check       -- CONVERGENCE POINT 3
  8. Final Report             -- output
```

### Granularity Selection

The granularity of convergence loops depends on the research depth requested:

| Research Depth | Finding Verification | Synthesis Verification | Completeness Check |
| -------------- | -------------------- | ---------------------- | ------------------ |
| Quick Lookup   | None                 | None                   | None               |
| Standard       | quick (per-section)  | quick (whole report)   | None               |
| Deep           | standard (per-topic) | standard (whole)       | quick (sub-Qs)     |
| Exhaustive     | thorough (per-claim) | thorough (whole)       | standard (full)    |

**Per-section** means findings from a single sub-question are grouped and
verified together. **Per-topic** means related sub-questions are grouped.
**Per-claim** means each finding is individually verified (expensive).

### Invocation Pattern (Programmatic Mode)

Deep-research implements the convergence loop workflow inline, using the
programmatic mode described in the convergence-loop SKILL.md:

```
1. Read convergence-loop SKILL.md's Workflow section
2. Implement Setup -> Loop -> Report for each convergence point
3. Use T20 tally format
4. Use behavior definitions and slicing from REFERENCE.md
5. Return verified findings set + confidence score
```

The orchestrator should NOT invoke `/convergence-loop` as a slash command (that
would require user interaction at every gate). Instead, it implements the loop
programmatically with these modifications for research context:

- **User gate relaxation:** For intermediate convergence points (finding
  verification), the orchestrator can auto-continue if the tally shows clear
  convergence (0 corrections, 0 new). Only surface to user if there are
  disagreements, low confidence, or the hard cap is reached.
- **State file naming:**
  `.claude/state/convergence-loop-research-{topic}-{phase}.state.json` (separate
  state per convergence point to allow independent resume)

### Handling Convergence Failures

When a finding cannot be verified (agent timeout, no independent sources,
contradictory evidence):

| Failure Mode            | Action                                                  |
| ----------------------- | ------------------------------------------------------- |
| No independent source   | Flag as SINGLE-SOURCE; include in report with caveat    |
| Sources contradict      | Flag as DISPUTED; present both positions with evidence  |
| Agent timeout/degraded  | Re-dispatch once; if still fails, mark UNVERIFIABLE     |
| Hard cap reached        | Present partial results with unconverged claims flagged |
| Scope explosion (>100%) | Pause, ask user: absorb new findings or split scope?    |

All failure modes produce findings, not silences. "We could not verify X" is
itself a research finding. The report's confidence score reflects unresolved
items.

---

## Research-Specific Convergence Behaviors

These are new behaviors that extend the existing six, designed specifically for
research verification. They follow the same output format
(`[CLAIM_ID] [STATUS] [EVIDENCE]`) and are composable with existing behaviors.

### `verify-sources`

- **What it checks:** That cited URLs/references are accessible and actually
  support the claims attributed to them.
- **When to use:** After finding extraction, before synthesis. Critical for any
  research that cites external sources.
- **Cost:** Moderate (requires reading/accessing each source)
- **Agent instruction:**
  > You are a source verification agent. For each finding in your slice, verify
  > that the cited source: (1) exists and is accessible, (2) actually says what
  > the finding claims it says, (3) is not taken out of context. Report using
  > T20 format. If the source is inaccessible, report as UNVERIFIABLE with the
  > reason. If the source exists but does not support the claim, report as
  > CORRECTED with what the source actually says.

### `cross-reference`

- **What it checks:** That findings are supported by multiple independent
  sources, not just the discovery source.
- **When to use:** For standard and deep research depths. After initial
  `verify-sources` pass.
- **Cost:** Expensive (requires searching for corroborating sources)
- **Agent instruction:**
  > You are a cross-reference agent. For each finding in your slice, search for
  > at least one independent source that confirms or contradicts the finding.
  > Independent means: different author, different publication, different
  > methodology. Report using T20 format. If confirmed by independent source,
  > cite it. If contradicted, report as CORRECTED with both positions. If no
  > independent source found, report as SINGLE-SOURCE.

### `temporal-check`

- **What it checks:** That information is current and has not been superseded.
- **When to use:** For any research where source recency matters. Especially
  important for technical topics, statistics, and policy.
- **Cost:** Moderate (requires checking source dates and searching for updates)
- **Agent instruction:**
  > You are a temporal verification agent. For each finding in your slice,
  > check: (1) when was the source published/last updated? (2) has anything
  > changed since then that would invalidate the claim? (3) is there a more
  > recent authoritative source? Report using T20 format. Flag findings based on
  > stale sources as TEMPORAL-RISK. Flag findings contradicted by newer sources
  > as CORRECTED.

### `completeness-audit`

- **What it checks:** That all research questions were addressed and no obvious
  gaps exist.
- **When to use:** After synthesis, before final report. Used at deep and
  exhaustive research depths.
- **Cost:** Moderate (requires reading research questions + all findings)
- **Agent instruction:**
  > You are a completeness audit agent. You receive: (1) the original research
  > question, (2) the decomposed sub-questions, (3) the synthesized findings.
  > For each sub-question: is it addressed (COVERED), partially addressed
  > (PARTIAL -- note what's missing), or unaddressed (GAP)? Then look for
  > questions that SHOULD have been asked but were not (NEW). Report using T20
  > format.

### `bias-check`

- **What it checks:** That research did not over-represent one perspective,
  methodology, or source type.
- **When to use:** For topics where perspective diversity matters. Used at deep
  and exhaustive depths.
- **Cost:** Moderate (requires assessing the full findings set holistically)
- **Agent instruction:**
  > You are a bias detection agent. Assess the research findings holistically
  > for: (1) source concentration -- are most findings from the same source? (2)
  > perspective balance -- are counter-arguments represented? (3) recency bias
  > -- are older but valid sources underrepresented? (4) authority bias -- are
  > authoritative sources given appropriate weight but not uncritical deference?
  > Flag imbalances as NEW findings. If specific findings misrepresent their
  > source's nuance, flag as CORRECTED.

### `synthesis-fidelity`

- **What it checks:** That the synthesis faithfully represents the underlying
  findings without distortion, omission, or unsupported additions.
- **When to use:** After synthesis is produced, before it is finalized.
- **Cost:** Cheap to moderate (reads synthesis + findings, no external lookup)
- **Agent instruction:**
  > You are a synthesis fidelity agent. Compare the synthesis against the raw
  > findings. For each claim in the synthesis: (1) trace it to a specific
  > finding -- TRACED, (2) if it is an inference from multiple findings --
  > INFERRED (acceptable if marked), (3) if unsupported -- UNSUPPORTED (must
  > fix). Also check for findings that were improperly omitted from the
  > synthesis. Report omissions as NEW. Report distortions as CORRECTED.

---

## Adversarial Verification

### Red Team / Blue Team Pattern

The most directly applicable adversarial pattern for research is a structured
debate between agents with opposing mandates:

**Blue Team (Advocate):** Presents findings as trustworthy, argues for their
accuracy and completeness.

**Red Team (Challenger):** Actively tries to disprove findings, identify gaps,
find counter-evidence, and expose weaknesses in reasoning.

**Implementation within convergence loop:**

This maps to a custom behavior sequence:

```
Pass 1: source-check (neutral verification)
Pass 2: discovery (with adversarial prompt -- "find what's wrong")
Pass 3: verification (resolve red-team challenges)
Pass 4: fresh-eyes (independent final assessment)
```

The key insight is that the existing `discovery` behavior already looks for what
is _missing_. An adversarial version looks for what is _wrong_:

```
custom_instructions: "Your role is adversarial. Assume the findings are
WRONG until proven right. For each finding, look for: counter-evidence,
logical fallacies, overgeneralization, cherry-picked data, missing context,
alternative explanations. If you cannot find problems, report as Confirmed.
But TRY to find problems first."
```

### Devil's Advocate Pattern

A lighter version of red-team that does not require a full separate pass. One
agent within a verification pass is given a devil's advocate mandate:

```
Domain slicing: N-1 agents verify normally; 1 agent verifies adversarially
```

This is more cost-effective than a full red-team pass and catches the most
obvious weaknesses. Suitable for `standard` depth research.

### Steelman/Strawman Analysis

For research on topics with competing viewpoints:

**Steelman:** Present the strongest possible version of each position.
**Strawman detection:** Flag any findings that present a weakened version of a
position.

This is relevant when the research question involves comparing alternatives,
evaluating trade-offs, or assessing controversial topics. Implementation via
prompt customization:

```
custom_instructions: "For findings that present a position or recommendation,
verify that the position is presented at its STRONGEST (steelman). If the
finding presents a weakened version of a counter-argument (strawman), flag as
CORRECTED and provide the steelman version."
```

### Academic Peer Review Translation

Academic peer review has features that translate to agent-based research
verification:

| Academic Process           | Agent Translation                          |
| -------------------------- | ------------------------------------------ |
| Blind review               | `fresh-eyes` behavior (zero prior context) |
| Reviewer independence      | Separate agents with no shared state       |
| Methodological critique    | Check reasoning, not just conclusions      |
| Request for revisions      | `fix-and-re-verify` behavior               |
| Accept/reject with reasons | T20 tally with evidence citations          |
| Multiple reviewers         | Multiple agents per pass (domain slicing)  |
| Editor synthesis           | Orchestrator merges agent outputs          |
| Revision rounds            | Convergence loop passes                    |

The main difference: academic peer review is adversarial by default (reviewers
look for reasons to reject). Agent verification should be truth-seeking by
default (agents look for accuracy) with optional adversarial passes.

---

## Verification Thresholds

### When NOT to Verify

Verification has real costs: token consumption, time, and context window
pressure. Not every finding justifies full convergence.

#### Diminishing Returns Curve

```
Verification Investment vs. Trust Gain:

  Trust
  100% |                    .......................
       |               .....
   90% |          ....
       |       ...
   80% |     ..
       |   ..
   70% |  .
       | .
   60% |.
       +------------------------------------------
        0    1    2    3    4    5    Passes
```

The first pass (source-check) provides the largest trust gain. The second pass
(verification) provides substantial incremental value. After that, returns
diminish rapidly unless corrections are still being found.

#### Cost/Risk Matrix

| Research Depth | Finding Count | Verification Cost | Risk of Wrong Finding | Verify?  |
| -------------- | ------------- | ----------------- | --------------------- | -------- |
| Quick Lookup   | 1-3           | Low               | Low (user will check) | No       |
| Standard       | 5-15          | Moderate          | Medium                | Quick    |
| Deep           | 15-50         | High              | High (user relies on) | Standard |
| Exhaustive     | 50+           | Very High         | Very High             | Thorough |

#### "Good Enough" Thresholds by Research Depth

**Quick Lookup (no verification):**

- Single-source answers to factual questions
- User will independently verify before acting
- Cost of being wrong: minimal (user checks anyway)

**Standard (quick convergence -- 2 passes):**

- Multiple findings that will inform decisions
- Source-check + one verification pass
- Accept findings with single-source support
- Cost of being wrong: moderate (user may act on findings)

**Deep (standard convergence -- 3 passes):**

- Research that directly drives decisions or actions
- Source-check + cross-reference + fresh-eyes
- Require multi-source support for key claims
- Cost of being wrong: significant (decisions made on this basis)

**Exhaustive (thorough convergence -- 5 passes):**

- High-stakes research (security, architecture, public-facing content)
- Full adversarial verification with red-team
- Require authoritative-source confirmation for all key claims
- Cost of being wrong: severe (hard to reverse decisions)

#### Per-Finding Verification Triage

Not all findings within a single research task need the same verification depth.
Triage by impact:

| Finding Impact | Verification Level | Rationale                                 |
| -------------- | ------------------ | ----------------------------------------- |
| Core claim     | Full (per depth)   | Drives the research conclusion            |
| Supporting     | One pass less      | Reinforces but does not drive conclusions |
| Contextual     | Source-check only  | Provides background, low decision impact  |
| Tangential     | None               | Interesting but not actionable            |

This triage should be done automatically by the orchestrator after finding
extraction, based on how central each finding is to answering the research
question.

---

## Design Recommendations

### 1. Use Programmatic Mode, Not Slash Command

Deep-research should implement convergence loops inline using the programmatic
mode contract from the convergence-loop SKILL.md. This avoids user gates at
every intermediate convergence point while preserving the gate for the final
research output.

**Rationale:** Research involves multiple convergence points (findings,
synthesis, completeness). Requiring user approval at each one would make the
skill unusable. Auto-continue when convergence is clear; surface to user only
when there are unresolved issues.

### 2. Tiered Verification with Automatic Depth Selection

The research depth (quick/standard/deep/exhaustive) should automatically
determine which convergence points are active and which presets to use. The user
can override.

```
Research Depth -> Verification Map:
  quick:      [none, none, none]           -- no convergence
  standard:   [quick, quick, none]         -- findings + synthesis
  deep:       [standard, standard, quick]  -- all three points
  exhaustive: [thorough, thorough, standard] -- full verification
```

### 3. Research-Specific Behavior Presets

Define research-specific presets composed from both existing and new behaviors:

| Preset               | Sequence                                                                                   | Use Case                     |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| `research-standard`  | verify-sources -> cross-reference -> fresh-eyes                                            | Normal research verification |
| `research-thorough`  | verify-sources -> cross-reference -> temporal-check -> adversarial-discovery -> fresh-eyes | Deep research                |
| `synthesis-check`    | synthesis-fidelity -> completeness-audit                                                   | Synthesis verification       |
| `synthesis-thorough` | synthesis-fidelity -> completeness-audit -> bias-check -> fresh-eyes                       | Exhaustive synthesis         |

### 4. Separate State Files Per Convergence Point

Each convergence point should have its own state file:

```
.claude/state/convergence-loop-research-{topic}-findings.state.json
.claude/state/convergence-loop-research-{topic}-synthesis.state.json
.claude/state/convergence-loop-research-{topic}-completeness.state.json
```

This enables independent resume if the session is interrupted between
convergence points.

### 5. Confidence Score Propagation

The confidence scores from each convergence point should propagate to the final
research output:

```
Finding Confidence: HIGH (0 corrections in final 2 passes)
Synthesis Confidence: MEDIUM (1 omission corrected in final pass)
Completeness Confidence: HIGH (all sub-questions covered)

Overall Research Confidence: MEDIUM (weakest link)
```

The overall confidence is the minimum of the component confidences. This
prevents a well-verified but incomplete report from being rated HIGH.

### 6. Convergence Report as Research Appendix

The convergence reports from all verification points should be included as an
appendix in the final research output. This provides transparency about:

- What was verified and how
- What could not be verified (SINGLE-SOURCE, UNVERIFIABLE)
- What corrections were made during verification
- What the confidence basis is

This mirrors academic papers including their methodology section.

### 7. Adversarial Pass as Optional Upgrade

The adversarial (red-team) pass should be available as an opt-in upgrade at any
research depth, rather than only at exhaustive depth. Some standard-depth
research topics benefit from adversarial verification (e.g., comparing
alternatives, evaluating claims from biased sources).

```
/deep-research "topic" --depth=standard --adversarial
```

This adds one adversarial-discovery pass to whatever the base verification
sequence is.

### 8. Early Termination on High Confidence

If the first convergence pass achieves 100% confirmation with zero corrections,
extensions, or new findings, the orchestrator should recommend skipping
remaining passes (with notification to the user). This prevents wasting tokens
on verification of obviously correct findings.

**Guard rail:** This optimization should NEVER apply to `thorough` or
`exhaustive` depths, where the full pass count is the point.

### 9. Finding-Level Metadata for Traceability

Each verified finding should carry metadata through the entire pipeline:

```json
{
  "id": "F-001",
  "claim": "The assertion text",
  "source": "URL or reference",
  "source_date": "2025-11-15",
  "verification": {
    "status": "CONFIRMED",
    "passes": 2,
    "independent_sources": 1,
    "confidence": "HIGH",
    "temporal_risk": false
  },
  "sub_question": "SQ-003"
}
```

This metadata enables the synthesis phase to make informed decisions about which
findings to emphasize and how to caveat them, and enables the final report to
include proper sourcing.

### 10. Handle the "Unverifiable" Case Explicitly

Some findings genuinely cannot be verified through convergence loops:

- Novel insights synthesized from multiple sources (no single source confirms)
- Predictions or forward-looking claims
- Subjective assessments or expert opinions

These should be explicitly categorized as UNVERIFIABLE-BY-DESIGN (distinct from
UNVERIFIABLE due to failure) and included in the report with appropriate
caveats. The research skill should NOT drop findings just because they cannot be
mechanically verified.

---

## Appendix: Mapping Existing Behaviors to Research Phases

| Research Phase          | Primary Behavior    | Secondary Behavior     | Notes                             |
| ----------------------- | ------------------- | ---------------------- | --------------------------------- |
| Finding extraction      | --                  | --                     | No convergence (raw collection)   |
| Source verification     | `source-check`      | `verify-sources`\*     | Check sources say what we claim   |
| Cross-referencing       | `verification`      | `cross-reference`\*    | Independent source confirmation   |
| Temporal validation     | `verification`      | `temporal-check`\*     | Recency assessment                |
| Self-consistency        | `fresh-eyes`        | --                     | Zero-context contradiction scan   |
| Synthesis production    | `write-then-verify` | --                     | Write then verify in one pass     |
| Synthesis fidelity      | `verification`      | `synthesis-fidelity`\* | Synthesis matches findings?       |
| Completeness audit      | `discovery`         | `completeness-audit`\* | Gaps and missing questions        |
| Bias assessment         | `discovery`         | `bias-check`\*         | Perspective diversity             |
| Adversarial challenge   | `discovery`         | --                     | With adversarial prompt injection |
| Final independent check | `fresh-eyes`        | --                     | Zero-context final pass           |

\*Asterisk indicates new research-specific behaviors proposed in this document.

---

## Version History

| Version | Date       | Description               |
| ------- | ---------- | ------------------------- |
| 1.0     | 2026-03-20 | Initial research analysis |
