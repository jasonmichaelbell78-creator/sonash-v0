# Findings: Internal Pipeline Analysis — What Adversarial Agents Need

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ8 (Part B)

---

## Research Methodology

Primary sources read directly from filesystem (ground truth):

- `.claude/skills/deep-research/SKILL.md` (v1.8) — Phase overview, spawn rules
- `.claude/skills/deep-research/REFERENCE.md` (v1.5) — Sections 8, 9, 21, 22:
  all adversarial prompt templates
- `.claude/agents/global/deep-research-searcher.md` — Established custom agent
  pattern
- `.claude/agents/global/deep-research-synthesizer.md` — Established custom
  agent pattern
- `.claude/projects/.../memory/project_contrarian_agent_design.md` — Session
  #244 decision record
- `.research/custom-agents/findings/D7a-stub-elevation.md` — W1 findings (model
  selection)
- `.research/custom-agents/findings/D7b-redundancy-analysis.md` — W1 findings
  (consolidation)

---

## Key Findings

### 1. The 6 Roles Exist Across 5 Phases — But Only 2 Have Dedicated Templates [CONFIDENCE: HIGH]

The deep-research pipeline uses general-purpose agents with inline prompts for
all adversarial roles. The REFERENCE.md contains prompt templates for each role
but they are presented as text blocks to be copied into Task() calls, not as
agent definitions.

Phase-to-role mapping:

| Phase | Role                  | Template Location                | Current Mechanism                     |
| ----- | --------------------- | -------------------------------- | ------------------------------------- |
| 2.5   | claim-verifier        | SKILL.md inline description only | General-purpose + orchestrator prompt |
| 3     | contrarian            | REFERENCE.md Section 8           | General-purpose + inline template     |
| 3     | OTB (outside-the-box) | REFERENCE.md Section 9           | General-purpose + inline template     |
| 3.5   | dispute-resolver      | REFERENCE.md Section 21.1.1      | General-purpose + inline template     |
| 3.95  | gap-pursuer           | REFERENCE.md Section 22.3        | General-purpose + inline template     |
| 3.96  | gap-verifier          | REFERENCE.md Section 22.4        | General-purpose + inline template     |

Key observation: Phase 2.5 (claim-verifier) is the only role with NO dedicated
template in REFERENCE.md. The SKILL.md says "Spawn verification agents to test
claims against filesystem. Each writes V<N>-<scope>.md with per-claim verdict:
VERIFIED or REFUTED with evidence." — but no template exists. This is a gap.

---

### 2. Contrarian Template: Substantive but Missing Enforcement Mechanism [CONFIDENCE: HIGH]

**Full template (REFERENCE.md Section 8):**

```
You are a contrarian researcher. Your job is to challenge the findings in this
research report. For each key claim:

1. What evidence would DISPROVE this claim?
2. What alternative explanations exist?
3. What biases might have led to this conclusion?
4. What sources were NOT consulted that might disagree?
5. What would change if the claim's context were different?

Rules:
- Write specific challenges with evidence, not generic skepticism
- Use WebSearch to find disconfirming evidence where possible
- If a claim holds up under challenge, say so -- don't force disagreement
- Rate each claim: CONFIRMED (withstands challenge) | WEAKENED (valid concerns)
  | REFUTED (disconfirming evidence found)

Input: [RESEARCH_OUTPUT.md content]

Write your challenges to: .research/<topic>/challenges/CONTRARIAN.md
```

**Template size:** 17 lines of prompt text.

**What this template lacks:**

- No minimum challenge count enforcement (could produce 2 challenges for 15
  claims)
- No steel-manning requirement before challenging
- No methodology for rating calibration (what evidence threshold moves CONFIRMED
  to WEAKENED?)
- No cross-reference check with sources cited in original
- No return protocol — the orchestrator gets no structured signal about what
  changed
- No tool guidance — "Use WebSearch" appears but no profile for which tools,
  when
- No failure protocol — what if no disconfirming evidence exists for any claim?

**What a dedicated agent definition would add:**

- `<role>` section locking in the adversarial identity and methodology
- `<enforcement_rules>` section specifying minimum challenge count per claim
  count
- `<rating_calibration>` with evidence thresholds for each verdict
- `<tool_strategy>` mapping to web profile (WebSearch + WebFetch, not Bash/Grep)
- `<structured_returns>` block so orchestrator knows exactly what to do with
  output
- `<success_criteria>` checklist preventing "I've noted the challenges" as
  completion

---

### 3. OTB Template: Direction-Setting but Fully Methodology-Free [CONFIDENCE: HIGH]

**Full template (REFERENCE.md Section 9):**

```
You are a lateral thinker. The structured research has answered the questions
it asked. Your job is to find what it DIDN'T ask:

1. What adjacent domains have relevant insights that weren't consulted?
2. What analogies from other fields illuminate this problem?
3. What second-order effects were not considered?
4. What would a complete non-expert notice that experts miss?
5. What emerging trends could change these conclusions in 6-12 months?

Rules:
- Write specific insights, not vague "think differently" suggestions
- Each insight should be actionable or decision-relevant
- Use WebSearch to explore adjacent domains
- Connect insights back to the original research question
- Rate each insight: HIGH (decision-changing) | MEDIUM (worth noting) |
  LOW (interesting but not actionable)

Input: [RESEARCH_OUTPUT.md content]

Write your insights to: .research/<topic>/challenges/OUTSIDE_THE_BOX.md
```

**Template size:** 16 lines of prompt text.

**What this template lacks (relative to the contrarian):**

- No minimum insight count — a general-purpose model can satisfy "lateral
  thinker" with 3 generic insights
- No discipline against obvious adjacencies (finding "what if the market
  changes" for every research topic satisfies the letter of the template without
  value)
- No domain awareness — OTB challenges should differ for a technology topic vs
  academic topic. No domain config is passed.
- Rating calibration is entirely absent: what makes an insight
  "decision-changing" vs "worth noting"? Without anchoring, HIGH is applied
  optimistically.
- No source requirement for adjacency claims — an OTB agent can assert a trend
  without citing anything
- No return protocol

**What a dedicated agent adds:**

- `<philosophy>` section establishing the difference between surface-level
  novelty (domain hopping without connection) and genuine lateral insight
- `<domain_awareness>` rules: OTB for a codebase question looks different from
  OTB for a technology landscape question
- `<minimum_insight_quality>` with explicit criteria distinguishing
  HIGH/MEDIUM/LOW
- `<source_requirement>` — each adjacency claim needs a citation

---

### 4. Dispute-Resolver Template: Most Complete of the Six [CONFIDENCE: HIGH]

**Full template (REFERENCE.md Section 21.1.1):**

```
You are a dispute resolution agent. Resolve conflicting claims with evidence.

## Disputes to resolve
[List each dispute with both sides -- the original claim + source, and the
challenging claim + source. Include claim IDs and file references.]

## For each dispute, produce:
- **RESOLUTION:** ORIGINAL UPHELD | CHALLENGER UPHELD | REVISED | INCONCLUSIVE
- **RATIONALE:** Why this resolution, citing specific evidence from both sides
- **IMPACT:** What changes in the research output (claim confidence, section
  rewrite, recommendation change)
- **CONFIDENCE:** HIGH | MEDIUM | LOW in the resolution itself

Write to: .research/<topic>/findings/dispute-resolutions.md
```

**Template size:** 15 lines of prompt text.

**Analysis:** This template is more structured than contrarian or OTB — it has
an explicit output schema (RESOLUTION/RATIONALE/IMPACT/CONFIDENCE per dispute).
The schema-driven nature means a general-purpose model has less room to
free-form.

**What is still missing:**

- No guidance on how to gather additional evidence when both sides cite sources
  (should the resolver search for a third source?)
- No protocol for INCONCLUSIVE disputes — when is INCONCLUSIVE appropriate vs
  REVISED? What does the orchestrator do with an INCONCLUSIVE resolution?
- No scaling awareness — a single agent resolving 10+ disputes risks context
  exhaustion and the truncation issue
- No return protocol — orchestrator cannot programmatically detect dispute count
  or whether all assigned disputes were resolved

**Custom agent justification:** MEDIUM. The template's schema-driven nature
means less methodology is lost to general-purpose execution. However, the lack
of evidence-gathering protocol and INCONCLUSIVE handling are real gaps. A custom
agent is justified but is a lower priority than contrarian or OTB.

---

### 5. Gap-Pursuer Template: Structured Input, Underspecified Output [CONFIDENCE: HIGH]

**Full template (REFERENCE.md Section 22.3):**

```
You are a gap-pursuit agent. Your task is to investigate gaps identified during
the main research phase.

## Gap(s) to investigate
[List of assigned gaps with source references]

## Context
Read .research/<topic>/RESEARCH_OUTPUT.md for the current state of findings.
Read the specific findings files referenced in each gap.

## Required research
[Gap-specific investigation steps -- e.g., "Search for evidence on X",
"Read files Y and Z to verify claim W", "Find community discussion on topic T"]

## Output
Write to: .research/<topic>/findings/G<N>-<scope>.md
Format:
  ## Summary
  [Brief summary of what was investigated and found]

  ## Detailed Findings
  [Findings with citations, organized by gap]

  ## Gaps
  [Your own gaps -- these will NOT trigger another cycle per Critical Rule 9]

  ## Serendipity
  [Unexpected discoveries worth noting]

Repo at [project root]
```

**Template size:** 29 lines of prompt text.

**Analysis:** The gap-pursuer template specifies its output format (matching the
searcher pattern). However, the "Required research" section is entirely
orchestrator- authored at runtime — it is gap-specific. This means the
methodology for HOW to investigate a gap is not locked in by the template; it
depends on what the orchestrator writes.

**What is missing:**

- No tool strategy — the gap-pursuer could be investigating a codebase gap
  (needs Grep/Read) or a web knowledge gap (needs WebSearch). No
  profile-switching guidance.
- No confidence calibration — should gap findings inherit the confidence level
  of the original gap source, or start fresh?
- No cross-reference requirement — gap findings should explicitly note whether
  they upgrade or downgrade the confidence of claims they address. The template
  does not require this.
- The "Gaps" section in output explicitly says "these will NOT trigger another
  cycle" but there is no guidance on what to do when a gap-pursuer discovers
  that a gap is LARGER than expected (a scope escalation risk)

**Relationship to deep-research-searcher:** The gap-pursuer is essentially a
specialized searcher with a narrowed scope (specific gaps, not broad
sub-questions) and an explicit non-recursion rule. The deep-research-searcher
agent definition has the tool strategy, confidence calibration, CRAAP+SIFT
evaluation, and return protocol that the gap-pursuer template lacks. A
gap-pursuer custom agent should inherit these elements.

---

### 6. Gap-Verifier Template: Minimal — Needs Full Expansion [CONFIDENCE: HIGH]

**Full template (REFERENCE.md Section 22.4):**

```
You are a gap-verification agent. Check gap-pursuit findings against ground
truth.

## Scope: [codebase claims | cross-claim consistency]
Read .research/<topic>/findings/G<N>-*.md files.

For each claim:
  VERIFIED (with file:line evidence) or REFUTED (with what's actually there).

Cross-check gap findings against original findings for consistency. Flag any
contradictions between gap-pursuit findings and the original research.

Write to: .research/<topic>/findings/GV<N>-<scope>.md
```

**Template size:** 11 lines of prompt text.

**Analysis:** This is the skinniest template in the pipeline. It shares the same
structural need as the Phase 2.5 claim-verifier but is even more stripped-down.
A general-purpose model given this prompt will apply inconsistent verification
methodology (some agents do line-by-line checking, others do broad pattern
matching).

**What is missing:**

- No distinction between the two scope modes (codebase vs cross-claim) — these
  are fundamentally different tasks that need different tools
- No file:line citation requirement enforced — the template says "VERIFIED (with
  file:line evidence)" but does not make this a checklist item or failure
  condition
- No handling for claims that reference external sources (can only verify
  codebase claims with filesystem; external claims need a different protocol)
- No output schema for the findings file — unlike the synthesizer or searcher,
  the gap-verifier's output format is entirely ad-hoc
- No return protocol

**Key insight:** The gap-verifier and claim-verifier (Phase 2.5) are the same
fundamental role with different inputs. A single `deep-research-verifier` agent
definition could serve both Phase 2.5 and Phase 3.96 with scoping passed at
spawn time (original D-agent claims vs G-agent claims).

---

### 7. The Established Agent Pattern (Searcher + Synthesizer) [CONFIDENCE: HIGH]

Reading both existing custom agents reveals a consistent structure:

**Frontmatter:**

- `name`: lowercase kebab-case
- `model`: explicit (sonnet for bounded execution, opus not used)
- `description`: 2-3 sentences covering role, spawner, primary output
- `tools`: explicit list (no catch-all)
- `color`: distinct per agent

**Body sections (in order):**

1. `<role>` — identity, spawner, job, core responsibilities (5-8 bullet points)
2. `<philosophy>` — 3-4 named principles with explanatory paragraphs
3. `<upstream_input>` — what the orchestrator passes at spawn time
4. `<downstream_consumer>` — who reads the output and what they use
5. `<tool_strategy>` — profile-specific tool guidance
   (web/docs/codebase/academic)
6. `<source_hierarchy>` — tier table + confidence assignment rules (searcher
   only)
7. `<verification_protocol>` — per-finding verification steps + CRAAP+SIFT
   (searcher only)
8. `<output_format>` — exact template with section headers
9. `<execution_flow>` — numbered step-by-step procedure
10. `<structured_returns>` — exact return format (success + blocked variants)
11. `<success_criteria>` — checkbox list + quality indicators

**Size profile:**

- deep-research-searcher: 386 lines
- deep-research-synthesizer: 344 lines
- Both are in the 300-400 line range

**Key pattern elements that embed methodology:**

- `<philosophy>` section converts behavioral principles from implicit to
  explicit — a model given the searcher agent has "Leave No Stone Unturned" and
  "Research is Investigation, Not Confirmation" baked in, not dependent on
  orchestrator prompting
- `<success_criteria>` checklist acts as a convergence loop — the agent cannot
  claim completion without each checkbox being true
- `<structured_returns>` means the orchestrator can parse the return
  programmatically; without this, the orchestrator must interpret free-form
  completion signals

---

### 8. What Is Lost by Using General-Purpose [CONFIDENCE: HIGH]

By running adversarial roles through general-purpose agents with inline prompts,
the pipeline loses:

| Loss Category                | Impact | Example                                                                                                                                                 |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Methodology consistency      | HIGH   | Two contrarian runs produce different rating calibrations, making challenge integration non-deterministic                                               |
| Minimum behavior enforcement | HIGH   | No minimum challenge count means a general-purpose model can satisfy the prompt with 3 surface challenges for 15 claims                                 |
| Tool strategy                | MEDIUM | General-purpose defaults to whatever tools are available; contrarian should use web search but may default to training-data-only                        |
| Return protocol              | HIGH   | Orchestrator cannot programmatically determine if >20% claims changed; must parse free-form output                                                      |
| Reproducibility              | MEDIUM | Same research topic re-run produces structurally different challenge output depending on which general-purpose model instance is used                   |
| Philosophy lock-in           | HIGH   | "Not confirming what's already known" and "challenging even high-confidence claims" require explicit philosophy encoding; absent from current templates |

**Most critical loss:** The return protocol. SKILL.md Phase 3.9 says
"Re-synthesize if >20% of claims changed." Without a structured return from the
contrarian/OTB agents specifying exactly which claims changed and to what
verdict, the orchestrator must use heuristics or ask the user. The current
templates produce markdown documents but no machine-parseable signal.

---

### 9. Session #244 Decision Evaluation: Are Contrarian, OTB, Claim-Verifier Still Right 3? [CONFIDENCE: HIGH]

**Recorded decision (project_contrarian_agent_design.md):**

> "contrarian-challenger.md, otb-challenger.md, and claim-verifier.md — Update
> /deep-research REFERENCE.md to reference these agents instead of
> general-purpose. Decided 2026-03-29 (Session #244)."

**Evaluation against this analysis:**

The Session #244 decision identified 3 agents. This analysis reveals 6 roles.
The question is which of the remaining 3 (dispute-resolver, gap-pursuer,
gap-verifier) also justify custom agent status.

**Dispute-resolver:** The template is the most schema-driven of the six. A
general-purpose model given the dispute-resolver prompt will produce
structurally consistent output more often than the contrarian or OTB templates.
The gaps (INCONCLUSIVE handling, evidence gathering, return protocol) are real
but less severe. VERDICT: JUSTIFIED as custom agent but lower priority than the
Session #244 three.

**Gap-pursuer:** The gap-pursuer is a specialized variant of the
deep-research-searcher. The current template lacks tool strategy, confidence
calibration, and return protocol — exactly what the searcher agent definition
provides. However, the gap-pursuer's unique constraints (non-recursion rule,
gap-scoped investigation, inheriting context from prior findings) make it
different enough from the searcher to warrant its own definition rather than
re-using the searcher. VERDICT: JUSTIFIED.

**Gap-verifier:** The gap-verifier template is the most skeletal in the pipeline
(11 lines) and shares its fundamental role with the Phase 2.5 claim-verifier.
Observation: rather than two separate agent definitions (claim-verifier for
Phase 2.5, gap-verifier for Phase 3.96), a single `deep-research-verifier` agent
scoped by spawn-time parameters could serve both phases. This avoids definition
duplication while providing the methodology consistency benefit. VERDICT:
JUSTIFIED but should be unified with claim-verifier rather than separate.

---

### 10. Per-Role Analysis Table [CONFIDENCE: HIGH]

| Role             | Phase | Template Size          | Gap Severity                                                                   | Agent Justification                                                       | Spec Outline                                                                                                                                                                          | Priority     |
| ---------------- | ----- | ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| contrarian       | 3     | 17 lines               | HIGH — missing enforcement, return protocol                                    | JUSTIFIED (Session #244)                                                  | contrarian-challenger.md: philosophy (steel-manning), minimum challenge rules, rating calibration, web tool strategy, CONFIRMED/WEAKENED/REFUTED schema, structured return            | P1           |
| OTB              | 3     | 16 lines               | HIGH — missing domain awareness, citation requirement, return protocol         | JUSTIFIED (Session #244)                                                  | otb-challenger.md: lateral thinking philosophy, domain-aware OTB approach, insight quality criteria, source requirements, HIGH/MEDIUM/LOW rating anchors, structured return           | P1           |
| claim-verifier   | 2.5   | 0 lines (no template!) | CRITICAL — no template at all                                                  | JUSTIFIED (Session #244)                                                  | claim-verifier.md (or deep-research-verifier): VERIFIED/REFUTED per claim, file:line citation requirement, two-scope modes (codebase vs cross-claim), return with changed claim count | P1           |
| dispute-resolver | 3.5   | 15 lines               | MEDIUM — schema-driven, but gaps in evidence-gathering + INCONCLUSIVE handling | JUSTIFIED, lower priority                                                 | dispute-resolver.md: evidence-seeking protocol, INCONCLUSIVE criteria, structured return with count of each resolution type                                                           | P2           |
| gap-pursuer      | 3.95  | 29 lines               | MEDIUM — output format exists, tool strategy missing                           | JUSTIFIED                                                                 | deep-research-gap-pursuer.md: inherits searcher philosophy, tool strategy by gap type, non-recursion enforcement, confidence calibration, structured return                           | P2           |
| gap-verifier     | 3.96  | 11 lines               | HIGH — skeletal                                                                | UNIFIED with claim-verifier (deep-research-verifier scoped at spawn time) | See claim-verifier spec — add gap-scope mode as parameter                                                                                                                             | P1 (unified) |

---

### 11. Agent Count Recommendation [CONFIDENCE: HIGH]

**Session #244 said 3. The correct answer is 4 dedicated definitions.**

Rationale:

1. **contrarian-challenger** — P1, unique methodology, high
   methodology-loss-from-general-purpose
2. **otb-challenger** — P1, unique methodology, laterality requires philosophy
   encoding
3. **deep-research-verifier** — P1, unifies claim-verifier (Phase 2.5) +
   gap-verifier (Phase 3.96) into a single definition that covers both
   verification roles via spawn- time scoping. This covers 2 of the 6 roles in 1
   definition.
4. **dispute-resolver** — P2, schema-driven but important enough to codify
   evidence- gathering protocol and INCONCLUSIVE handling

**Gap-pursuer recommendation:** DEFER to a separate decision. The gap-pursuer is
essentially the deep-research-searcher with narrowed scope and non-recursion
enforcement. The better implementation path may be to extend the deep-research-
searcher agent definition with a `<gap_pursuit_mode>` section that activates via
spawn-time flag, rather than a separate definition. This avoids maintaining two
parallel tool strategy sections that must stay in sync.

**Final count: 4 definitions (contrarian-challenger, otb-challenger,
deep-research-verifier, dispute-resolver) covering all 6 roles.**

---

### 12. Estimated Agent Definition Sizes [CONFIDENCE: MEDIUM]

Based on searcher (386 lines) and synthesizer (344 lines) as benchmarks:

| Agent                  | Role Complexity | Estimate      | Rationale                                                                                                                                          |
| ---------------------- | --------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| contrarian-challenger  | Medium          | 250-320 lines | Philosophy + rating calibration + tool strategy + structured return. Simpler than searcher (no CRAAP table, no domain config).                     |
| otb-challenger         | Medium          | 230-300 lines | Similar to contrarian but different philosophy section and no rating schema.                                                                       |
| deep-research-verifier | Medium-High     | 300-380 lines | Two scope modes (Phase 2.5 + Phase 3.96), file:line citation requirements, handling for external vs codebase claims. Close to searcher complexity. |
| dispute-resolver       | Medium-Low      | 180-240 lines | Simpler scope than verifier. Schema is tight. Key additions: evidence-seeking protocol, INCONCLUSIVE criteria, return protocol.                    |

---

## Sources

| #   | Path                                                             | Type           | Trust | CRAAP | Date       |
| --- | ---------------------------------------------------------------- | -------------- | ----- | ----- | ---------- |
| 1   | `.claude/skills/deep-research/SKILL.md`                          | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 2   | `.claude/skills/deep-research/REFERENCE.md` Section 8            | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 3   | `.claude/skills/deep-research/REFERENCE.md` Section 9            | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 4   | `.claude/skills/deep-research/REFERENCE.md` Section 21.1.1       | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 5   | `.claude/skills/deep-research/REFERENCE.md` Section 22.3         | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 6   | `.claude/skills/deep-research/REFERENCE.md` Section 22.4         | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 7   | `.claude/agents/global/deep-research-searcher.md`                | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 8   | `.claude/agents/global/deep-research-synthesizer.md`             | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 9   | `.claude/projects/.../memory/project_contrarian_agent_design.md` | filesystem     | HIGH  | 5/5   | 2026-03-29 |
| 10  | `.research/custom-agents/findings/D7a-stub-elevation.md`         | prior research | HIGH  | 5/5   | 2026-03-29 |
| 11  | `.research/custom-agents/findings/D7b-redundancy-analysis.md`    | prior research | HIGH  | 5/5   | 2026-03-29 |

---

## Contradictions

**None found.** The pipeline description in SKILL.md, the templates in
REFERENCE.md, and the existing agent patterns in the two custom agent
definitions are consistent.

One tension worth surfacing: The Session #244 decision says "3 agents"
(contrarian-challenger, otb-challenger, claim-verifier). This analysis concludes
4 definitions are needed (adding dispute-resolver). The tension is not a factual
contradiction — Session #244 was a planning decision made before the full
pipeline analysis. The analysis here is additive, not contradicting.

A second tension: the gap-pursuer could be implemented as a separate agent OR as
an extension of the deep-research-searcher. Both are valid; the recommendation
to defer reflects that this is an unresolved design decision, not a clear
answer.

---

## Gaps

1. **Phase 2.5 claim-verifier has no template.** SKILL.md says verification
   agents produce "VERIFIED or REFUTED with evidence" but there is no
   REFERENCE.md template section for Phase 2.5. When the deep-research-verifier
   agent is authored, the author will need to derive the template from the
   SKILL.md description plus the gap-verifier template (Section 22.4) as a
   pattern reference.

2. **Return protocol for Phase 3.9 trigger is unspecified.** SKILL.md says "re-
   synthesize if >20% of claims changed." The 20% calculation requires
   structured returns from contrarian + OTB agents. The exact schema for this
   return is not documented anywhere — it would need to be designed when
   creating the custom agents.

3. **Model selection for adversarial roles not documented.** W1 findings (D4a,
   D4b) concluded Opus for complex reasoning and Sonnet for bounded execution.
   The adversarial roles are mixed: contrarian requires creative hypothesis
   generation (Opus-leaning) but runs on a bounded template (Sonnet-leaning).
   This decision was not researched in the W1 findings for adversarial roles
   specifically.

4. **Gap-pursuer design decision deferred.** Whether it is a separate definition
   or an extension of deep-research-searcher requires a design decision that is
   outside the scope of this analysis.

---

## Serendipity

**The claim-verifier is the highest-priority unresolved gap, not contrarian or
OTB.** Session #244 identified contrarian/OTB as the primary motivation for
custom agents. But this analysis reveals that Phase 2.5 has no template at all —
the claim-verifier is running entirely on the general-purpose model's
interpretation of a few SKILL.md sentences. This is a more severe
methodology-loss than contrarian (which has a 17-line template). The
deep-research-verifier should be built first, not third.

**A single verifier definition (deep-research-verifier) eliminates 2 of the 6
roles.** The claim-verifier (Phase 2.5) and gap-verifier (Phase 3.96) have
identical methodology — check claims against ground truth, output
VERIFIED/REFUTED with file:line evidence. Unifying them into one definition with
spawn-time scoping is architecturally cleaner than two separate definitions and
reduces maintenance surface.

**The dispute-resolver template's INCONCLUSIVE verdict has no downstream
handling.** SKILL.md Phase 3.9 trigger is ">20% of claims changed." INCONCLUSIVE
resolutions do not change claims — they leave them in limbo. There is no
guidance on what the orchestrator does with INCONCLUSIVE disputes when deciding
the 20% threshold. This is a pipeline logic gap that the dispute-resolver custom
agent definition will need to address by either (a) recommending INCONCLUSIVE be
treated as no-change or (b) establishing when INCONCLUSIVE warrants escalation
to user.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct filesystem reads of the pipeline source
files. No training-data assertions made about what custom agents should contain
— all recommendations are derived from comparison between existing custom agent
patterns (searcher, synthesizer) and the current general-purpose templates.
