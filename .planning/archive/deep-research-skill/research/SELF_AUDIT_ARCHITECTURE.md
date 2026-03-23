# Self-Audit Architecture for Deep Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH COMPLETE
<!-- prettier-ignore-end -->

---

## Executive Summary

A deep-research system without self-audit is a hallucination factory with good
formatting. The gap between "research that sounds authoritative" and "research
that IS authoritative" is precisely what a self-audit phase closes. This
document designs the architecture for a mandatory self-audit phase that runs
after research synthesis and before user presentation.

**Core thesis:** Self-audit is not polish. It is the structural mechanism that
separates credible research from confident-sounding noise. LLMs are
systematically overconfident (calibration studies show HIGH-confidence claims
are wrong 15-30% of the time depending on domain). Multi-agent research
amplifies this risk because parallel agents can independently arrive at the same
wrong answer via shared training biases, creating false corroboration.

**Design principles:**

1. **The auditor must not be the author.** Self-critique by the same agent that
   produced findings is unreliable (self-preference bias, confirmation bias).
   Verification requires independent assessment.
2. **Audit dimensions must be explicit and measurable.** Vague "quality checks"
   produce vague results. Each dimension has specific metrics and pass/fail
   criteria.
3. **Cost must be proportional to stakes.** A 3-minute research query does not
   need a 5-agent audit. Tiered audit depth matches research complexity.
4. **Failure must have consequences.** An audit that always passes is theater.
   Specific quality gates trigger re-research, confidence downgrades, or user
   escalation.

---

## Audit Dimensions (Prioritized by Impact)

### Tier 1: Non-Negotiable (Run on every research invocation)

#### D1: Cross-Consistency

**What it checks:** Do findings from different research threads/agents agree?
Where do they contradict?

**Why it matters most:** Multi-agent research creates the illusion of
independent corroboration. If Agent A and Agent B both find "X is true" but both
sourced it from the same original article (or from their shared training data),
the apparent agreement is hollow. Conversely, genuine disagreements between
agents are the most valuable signal in the entire research output --- they
indicate where the truth is uncertain.

**Metrics:**

- Agreement ratio: % of claims supported by 2+ independent agent threads
- Contradiction count: number of claims where agents reached opposite
  conclusions
- Source independence: % of corroborating claims backed by truly independent
  sources (not the same article found by different agents)

**Pass criteria:** Zero unresolved contradictions. All contradictions either
reconciled with evidence or explicitly surfaced to user with both perspectives.

#### D2: Claim Verification

**What it checks:** Are the most impactful claims actually supported by cited
sources?

**Why it matters:** SOURCE_VERIFICATION.md documents that 40-56% of AI-generated
citations contain errors or are fabricated. A research output where half the
citations do not support the claims they are attached to is worse than no
research at all --- it creates false confidence.

**Metrics:**

- Citation accuracy rate: % of citations where the source actually supports the
  specific claim (not just topically related)
- Fabrication rate: % of citations that reference non-existent sources
- Support strength: % of claims where the cited source directly states vs.
  merely implies the claim

**Pass criteria:** Zero fabricated citations. Citation accuracy >= 90% for HIGH
confidence claims. Any claim with a citation that does not actually support it
must be downgraded to MEDIUM or LOW.

#### D3: Completeness

**What it checks:** Were all original research questions addressed?

**Why it matters:** Research that brilliantly answers 3 of 5 questions while
silently ignoring the other 2 is a common failure mode. The user assumes all
questions were covered unless told otherwise.

**Metrics:**

- Question coverage: % of original research questions with at least one finding
- Depth coverage: for each question, ratio of sub-topics addressed vs.
  sub-topics identified during decomposition
- Abstention tracking: questions explicitly marked as "could not find reliable
  information" (this is a feature, not a failure)

**Pass criteria:** 100% question coverage (every question either answered or
explicitly marked as unanswerable with explanation). Depth coverage >= 70% for
primary questions.

### Tier 2: Important (Run on standard and deep research)

#### D4: Source Diversity

**What it checks:** Are findings backed by diverse independent sources, or
echo-chambered?

**Why it matters:** Citation cascades are real. A single original error
propagated through secondary sources creates the appearance of consensus. Three
articles quoting the same press release are one source, not three.

**Metrics:**

- Unique source count per major claim
- Source type distribution: % primary vs. secondary vs. tertiary sources
- Source origin diversity: number of distinct organizations/authors represented
- Citation cascade detection: % of claims where all supporting sources trace to
  a common origin

**Pass criteria:** Major claims backed by >= 2 truly independent sources. Source
type distribution includes at least one primary source for claims rated HIGH
confidence. Citation cascade rate < 20%.

#### D5: Confidence Calibration

**What it checks:** Are confidence levels appropriate? Not overconfident on weak
evidence, not underconfident on strong evidence?

**Why it matters:** Research from the Confidence-Informed Self-Consistency
(CISC) paper (ACL 2025) shows that even high-performing LLMs show "minimal
variation in confidence between right and wrong answers." Confidence scores that
do not correlate with actual evidence quality are worse than no scores --- they
create false trust hierarchies.

**Metrics:**

- Evidence-confidence alignment: for each claim, does the evidence basis justify
  the assigned confidence level?
- Overconfidence rate: % of HIGH-confidence claims with < 3 corroborating
  sources
- Underconfidence rate: % of LOW-confidence claims with >= 3 corroborating,
  high-authority sources
- Confidence distribution: is the distribution reasonable? (All HIGH is a red
  flag; all LOW suggests insufficient research)

**Pass criteria:** Overconfidence rate < 10%. No HIGH-confidence claim with
fewer than 2 independent, authoritative sources. Confidence distribution has
claims in at least 2 levels.

#### D6: Internal Coherence

**What it checks:** Does the synthesis faithfully represent the underlying
findings?

**Why it matters:** The synthesizer agent reads multiple findings files and
produces a unified output. It can subtly distort findings through: selective
emphasis, omission of caveats, false generalizations from specific cases, or
conflation of different claims.

**Metrics:**

- Findings preservation: % of individual research findings that appear in the
  synthesis (possibly summarized but not omitted)
- Caveat preservation: % of qualifications/caveats from individual findings that
  survive into the synthesis
- Distortion check: any claims in the synthesis that are stronger than what the
  underlying findings support

**Pass criteria:** Zero distortions (synthesis claims must not exceed what
findings support). Caveat preservation >= 80%. No findings silently dropped
without explanation.

### Tier 3: Valuable (Run on deep or high-stakes research only)

#### D7: Gap Detection

**What it checks:** What sub-topics were NOT covered? What questions remain
unanswered?

**Why it matters:** Unknown unknowns are the most dangerous gap in research. The
system should actively search for what it missed, not just validate what it
found.

**Metrics:**

- Identified gaps: count of sub-topics the research recognized but could not
  address
- Adjacent topic scan: count of related topics that a domain expert would expect
  to see addressed but were not
- "Negative space" analysis: what did the research NOT look for that the
  original question implies?

**Pass criteria:** Gap report produced. At minimum, 2-3 identified gaps or
explicit statement that coverage is comprehensive with reasoning.

#### D8: Bias Detection

**What it checks:** Does the research favor one perspective, vendor, approach,
or ideology unfairly?

**Why it matters:** LLMs have well-documented biases including verbosity bias
(longer = better), recency bias (newer = better), popularity bias (well-known =
recommended), and self-preference bias. Research investigating "Which framework
should we use?" that consistently favors the most popular framework without
acknowledging tradeoffs is biased research. Research from COLING 2025 shows
disparities between LLM-detected bias and human-perceived bias.

**Metrics:**

- Perspective count: number of distinct viewpoints/approaches represented
- Balance ratio: distribution of positive vs. negative assessments across
  compared options
- Vendor neutrality: presence of disclosed conflicts or undisclosed favoritism
- Recency bias check: are older but still valid approaches dismissed without
  evidence?

**Pass criteria:** For comparison research: minimum 2 perspectives represented
per evaluated option. No option dismissed without cited evidence. Bias report
acknowledges potential LLM biases relevant to the topic.

#### D9: Recency

**What it checks:** Are sources current enough for the domain?

**Why it matters:** Information decay rates vary dramatically by domain.
Technology sources from 2 years ago may be completely obsolete. Historical
analysis sources from 20 years ago may be canonical. The audit must be
domain-aware.

**Metrics:**

- Source age distribution: median and range of publication dates
- Domain-appropriate recency: are sources within the expected freshness window
  for this domain?
- Temporal conflict detection: do newer sources contradict older sources, and is
  this acknowledged?

**Pass criteria:** Median source age appropriate for domain (technology: < 2
years, business: < 3 years, academic/scientific: < 5 years, historical: no hard
limit). Any temporal conflicts explicitly noted.

#### D10: Actionability

**What it checks:** Can a reader make decisions based on this research, or is it
just information?

**Why it matters:** Research that says "there are many options, each with
tradeoffs" without helping the reader choose is low-value. The research output
should enable decisions, not just inform.

**Metrics:**

- Recommendation presence: does the research include explicit recommendations?
- Decision-readiness: are tradeoffs concrete enough to evaluate?
- Next-steps clarity: does the reader know what to do with this information?

**Pass criteria:** At least one actionable recommendation per primary research
question. Tradeoffs stated in concrete, comparable terms (not vague "it
depends").

---

## Existing Patterns in This Codebase

The SoNash codebase has three mature self-assessment patterns that the
deep-research self-audit should build on. These are not theoretical --- they are
battle-tested across hundreds of invocations.

### Pattern 1: deep-plan Phase 3.5 (Plan Self-Audit)

**Location:** `.claude/skills/deep-plan/SKILL.md`, Phase 3.5

**What it does:**

1. Decision coverage check: every DECISIONS.md entry maps to a plan step
2. Quality checklist verification
3. Artifact consistency: DIAGNOSIS.md findings addressed by plan
4. Convergence-loop verification of plan assumptions (MUST for L/XL)
5. Signal: "Self-audit: N/N decisions covered, checklist PASS"

**What we can reuse:**

- The "every input maps to an output" coverage check pattern. For research:
  every original question maps to at least one finding.
- The convergence-loop integration for verifying claims about reality.
- The finding presentation format (description, why it matters, options,
  recommendation) for presenting audit issues.
- The user gate before proceeding --- audit findings require user
  acknowledgment.

**What we must extend:**

- deep-plan audits plan fidelity to decisions. Research audit must verify
  factual accuracy, not just structural completeness.
- deep-plan does not check for bias, source diversity, or confidence
  calibration.

### Pattern 2: Convergence Loop (Multi-Pass Verification)

**Location:** `.claude/skills/convergence-loop/SKILL.md` and `REFERENCE.md`

**What it does:**

1. Multi-pass verification with composable behaviors (source-check, discovery,
   verification, fresh-eyes)
2. T20 tally per pass: Confirmed / Corrected / Extended / New
3. Graduated convergence: per-claim, not all-or-nothing
4. Disagreement handling: surface both positions with evidence
5. Hard cap on iterations to prevent infinite loops

**What we can reuse directly:**

- The entire convergence-loop framework. Research self-audit IS a convergence
  loop application. The synthesis output contains claims that should be verified
  via source-check and fresh-eyes passes.
- The T20 tally format for tracking audit progress.
- Graduated convergence: individual claims can be "graduated" (verified) while
  others continue being checked.
- The behavior definitions, especially `source-check` (verify claims against
  cited sources) and `fresh-eyes` (independent verification with zero prior
  context).

**What we must extend:**

- Add a `research-claims` preset specifically designed for research audit (see
  Multi-Agent Audit Design section).
- Add research-specific behaviors: source-diversity-check, bias-scan,
  completeness-check.

### Pattern 3: skill-audit Phase 5 (Evidence-Based Self-Audit)

**Location:** `.claude/skills/skill-audit/SKILL.md`, Phase 5

**What it does:**

1. Re-read all modified files (do NOT rely on memory)
2. Three verification layers, ALL required:
   - Grep-based proof: for each decision, grep output for implementation
     evidence
   - Independent agent verification: dispatch code-reviewer to independently
     check
   - Diff-based mapping: map each decision to specific diff hunks
3. Process compliance verification
4. Self-audit report before completion summary

**What we can reuse:**

- The principle that "logging a decision as PASS does not mean it was
  implemented." Applied to research: "assigning HIGH confidence does not mean
  the claim is actually well-supported."
- Evidence-based verification: each audit claim must cite specific evidence, not
  just assert "looks good."
- Independent agent verification for high-decision-count audits (>15 decisions
  triggers agent verification; analogous threshold for research claims).
- The sequential report-then-summary pattern: audit report MUST precede the
  final research presentation.

### Pattern 4: code-reviewer Anti-Pattern Verification

**Location:** `.claude/skills/code-reviewer/SKILL.md`

**What it does:**

- Scans for known anti-patterns before detailed review
- Block immediately on violation (no warning mode)
- References specific positive patterns for fixes

**What we can reuse:**

- The "scan for known anti-patterns BEFORE detailed review" pattern. For
  research: scan for known research anti-patterns (all HIGH confidence, no
  citations, single-source claims) before detailed audit.
- The block-on-violation approach for critical audit failures.

---

## Multi-Agent Audit Design

### Architecture Decision: Convergence-Loop + 2 Custom Behaviors

Based on analysis of the existing codebase patterns (CUSTOM_AGENT_DESIGN.md
recommends against agent proliferation) and the cost-effectiveness research, the
self-audit should NOT create 5 separate audit agents. Instead, it should:

1. **Reuse the `/convergence-loop` framework** with a new `research-audit`
   preset
2. **Add 2 research-specific behaviors** to the convergence-loop behavior
   library
3. **Use the synthesizer + convergence-loop** rather than dedicated audit agents

This aligns with the CUSTOM_AGENT_DESIGN.md recommendation: "Verification in
this context... overlaps heavily with what a convergence-loop pass provides.
Research claim verification is better handled as a pass within the synthesizer
or as a convergence-loop invocation."

### Research-Audit Preset

```
Preset: research-audit
Sequence:
  Pass 1: research-source-check   (verify citations support claims)
  Pass 2: research-completeness   (coverage + gap detection)
  Pass 3: fresh-eyes              (independent verification, zero context)
Max passes: 4 (Pass 4 only if Pass 3 finds corrections)
Agents: 3-5 (scale to synthesis size)
Slicing: claims-by-theme (group findings by research question)
```

### Behavior: research-source-check (New)

**What it checks:** D1 (Cross-Consistency), D2 (Claim Verification), D4 (Source
Diversity), D5 (Confidence Calibration)

**Agent instruction:**

> You are a research audit agent. Your role is to verify the factual accuracy
> and source quality of a research synthesis. For each claim in your slice:
>
> 1. **Citation verification:** Does the cited source actually support this
>    specific claim? Not "is it topically related" but "does the source state or
>    directly imply what is claimed?" If the source was fetched during research,
>    re-read it. If not fetchable, note as UNVERIFIABLE.
> 2. **Cross-consistency:** Does this claim agree with or contradict claims in
>    other sections of the synthesis? Flag contradictions with evidence from
>    both sides.
> 3. **Source diversity:** How many truly independent sources support this
>    claim? (Sources citing the same original do not count as independent.)
> 4. **Confidence calibration:** Is the assigned confidence level justified by
>    the evidence basis? Flag overconfidence (HIGH with < 2 independent sources)
>    and underconfidence (LOW with 3+ corroborating sources).
>
> Report format: [CLAIM_ID] [STATUS] [EVIDENCE] Statuses: VERIFIED (source
> confirms), WEAKENED (source partially supports), UNSUPPORTED (source does not
> support claim), FABRICATED (source does not exist), OVERCONFIDENT (confidence
> too high for evidence), UNDERCONFIDENT (confidence too low for evidence),
> CONTRADICTION (conflicts with another claim).

**Input:** SYNTHESIS.md + original FINDINGS.md files + source URLs **Output:**
Source verification report with per-claim status **Estimated cost:** 30-50K
tokens per agent (reading synthesis + re-checking sources)

### Behavior: research-completeness (New)

**What it checks:** D3 (Completeness), D7 (Gap Detection), D8 (Bias Detection),
D10 (Actionability)

**Agent instruction:**

> You are a research completeness auditor. Your role is to identify what the
> research MISSED, not confirm what it found. You receive:
>
> - The original research question and sub-query decomposition
> - The final synthesis
>
> Check:
>
> 1. **Question coverage:** For each original question and sub-query, is there
>    at least one finding? List any unanswered questions.
> 2. **Gap detection:** What related sub-topics would a domain expert expect to
>    see addressed but are missing? What obvious follow-up questions does the
>    research raise but not answer?
> 3. **Bias scan:** Does the research favor one perspective, vendor, or approach
>    without justification? Are counterarguments to recommendations present? For
>    comparison research: are all options given fair treatment?
> 4. **Actionability:** Can a reader make a decision based on this? Are
>    recommendations concrete? Are tradeoffs specific enough to evaluate?
>
> Report format: [DIMENSION] [STATUS] [DETAILS] Statuses: COVERED, PARTIAL,
> MISSING, BIASED, ACTIONABLE, VAGUE

**Input:** Original research question + decomposition + SYNTHESIS.md **Output:**
Completeness and gap report **Estimated cost:** 15-25K tokens per agent (reading
synthesis + reasoning about gaps)

### Behavior: fresh-eyes (Existing --- reused from convergence-loop)

The existing `fresh-eyes` behavior from `/convergence-loop` is used as-is for
the final verification pass. The agent receives ONLY the synthesis and source
material --- no prior audit results --- and independently verifies claims.

### Agent Count and Slicing

| Synthesis Size        | Agents | Slicing Strategy                                                             |
| --------------------- | ------ | ---------------------------------------------------------------------------- |
| Small (< 20 claims)   | 3      | One per audit behavior (no parallelism within behavior)                      |
| Medium (20-50 claims) | 4      | 2 for research-source-check (split by theme), 1 completeness, 1 fresh-eyes   |
| Large (50+ claims)    | 5-6    | 3 for research-source-check (split by theme), 1-2 completeness, 1 fresh-eyes |

---

## Audit Output Format

The self-audit produces a structured report with five sections. This report is
presented to the user BEFORE the research synthesis, so the user has context on
quality before reading findings.

### Section 1: Quality Scorecard

```markdown
## Research Quality Scorecard

| Dimension              | Score   | Status | Notes                                       |
| ---------------------- | ------- | ------ | ------------------------------------------- |
| Cross-Consistency      | 94%     | PASS   | 2 minor contradictions resolved             |
| Claim Verification     | 88%     | PASS   | 3 claims downgraded from HIGH to MEDIUM     |
| Completeness           | 100%    | PASS   | All 5 questions addressed                   |
| Source Diversity       | 82%     | PASS   | 2 claims rely on single source              |
| Confidence Calibration | 91%     | PASS   | 1 overconfident claim corrected             |
| Internal Coherence     | 96%     | PASS   | 1 caveat restored to synthesis              |
| Gap Detection          | N/A     | INFO   | 3 gaps identified (see gap report)          |
| Bias Detection         | CLEAR   | PASS   | No systematic bias detected                 |
| Recency                | CURRENT | PASS   | Median source age: 1.2 years                |
| Actionability          | HIGH    | PASS   | 4/5 questions have concrete recommendations |

**Overall: PASS (quality threshold met)** **Confidence: HIGH (0 corrections in
final audit pass)**
```

### Section 2: Contradiction Report

```markdown
## Contradiction Report

### Resolved Contradictions

| #   | Claim A                  | Claim B                          | Resolution                              | Evidence     |
| --- | ------------------------ | -------------------------------- | --------------------------------------- | ------------ |
| 1   | "Framework X supports Y" | "Framework X deprecated Y in v3" | Claim B correct (v3 changelog confirms) | [source URL] |

### Unresolved Contradictions (if any)

| #   | Claim A (source) | Claim B (source) | User Decision Needed |
| --- | ---------------- | ---------------- | -------------------- |
```

### Section 3: Verification Report

```markdown
## Verification Report

### Verified Claims (summary)

- 18 claims VERIFIED (citations confirmed)
- 3 claims WEAKENED (citations partially support; confidence downgraded)

### Problem Claims

| #   | Claim                    | Original Confidence | Issue                                      | New Confidence | Action                 |
| --- | ------------------------ | ------------------- | ------------------------------------------ | -------------- | ---------------------- |
| 1   | "Library X is 3x faster" | HIGH                | Source shows 2.1x, not 3x                  | MEDIUM         | Corrected in synthesis |
| 2   | "Standard Y requires Z"  | HIGH                | Source discusses Z but does not require it | MEDIUM         | Qualified in synthesis |

### Fabrication Check

- Citations checked: 24
- Fabricated: 0
- Inaccessible (could not re-verify): 2 (noted in synthesis)
```

### Section 4: Gap Report

```markdown
## Gap Report

### Identified Gaps

1. **[Gap description]** --- why it matters, suggested follow-up query
2. **[Gap description]** --- why it matters, suggested follow-up query

### Coverage Assessment

- Questions fully covered: 4/5
- Questions partially covered: 1/5 (Q3: limited sources available)
- Questions unanswered: 0/5
```

### Section 5: Recommendations

```markdown
## Audit Recommendations

### Confidence Adjustments Applied

| Claim                        | Original | Adjusted | Reason                                           |
| ---------------------------- | -------- | -------- | ------------------------------------------------ |
| "X is the industry standard" | HIGH     | MEDIUM   | Only 1 independent source; popularity ≠ standard |

### Re-Research Recommendations (if quality insufficient)

- [ ] Q3 needs deeper investigation: only 2 sources found, both from same author
- [ ] Temporal gap: no sources newer than 2024 for rapidly evolving topic

### Quality Sufficient for Presentation: YES / NO
```

---

## Decision Gates

### Quality Thresholds

| Gate                      | Threshold                                 | Consequence of Failure                                                                                          |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Fabrication**           | Zero fabricated citations                 | HARD BLOCK: cannot present. Remove fabricated citations, re-verify, re-audit.                                   |
| **Claim verification**    | >= 80% of HIGH-confidence claims verified | SOFT BLOCK: downgrade unverified claims to MEDIUM/LOW, re-run synthesis with corrections, present with caveats. |
| **Completeness**          | 100% question coverage                    | SOFT BLOCK: explicitly note unanswered questions in output. User decides whether to accept or re-research.      |
| **Cross-consistency**     | Zero unresolved contradictions            | SOFT BLOCK: present contradictions explicitly to user with both perspectives. User decides.                     |
| **Source diversity**      | >= 2 independent sources per HIGH claim   | CONFIDENCE DOWNGRADE: downgrade to MEDIUM. Note in synthesis.                                                   |
| **Overall quality score** | >= 70% across Tier 1 dimensions           | HARD BLOCK: re-research areas with lowest scores.                                                               |

### Failure Handling Decision Tree

```
AUDIT COMPLETE
  |
  |-- Any fabricated citations?
  |     YES --> Remove. Re-verify remaining citations. Re-audit.
  |     NO  --> Continue
  |
  |-- Overall quality >= 70%?
  |     NO  --> Identify lowest-scoring dimensions.
  |     |       Can targeted re-research fix them? (< 3 areas)
  |     |         YES --> Re-research specific areas. Re-synthesize. Re-audit.
  |     |         NO  --> Present to user with quality warning.
  |     |                 "Research quality is below threshold. Options:
  |     |                  (A) Accept with caveats
  |     |                  (B) Re-research [specific areas]
  |     |                  (C) Narrow scope and re-research"
  |     YES --> Continue
  |
  |-- Any unresolved contradictions?
  |     YES --> Present both sides to user. User decides.
  |     NO  --> Continue
  |
  |-- Confidence adjustments needed?
  |     YES --> Apply adjustments. Note in audit report.
  |     NO  --> Continue
  |
  |-- PRESENT TO USER
        Include audit scorecard as preamble to synthesis.
```

### Iteration Limits

| Scenario                                 | Max Iterations | Rationale                                                                                          |
| ---------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| Audit -> fix -> re-audit                 | 2              | After 2 audit cycles, present with caveats. Infinite audit loops waste tokens without convergence. |
| Re-research -> re-synthesize -> re-audit | 1              | One re-research attempt. If still failing, escalate to user.                                       |
| Total audit passes (convergence-loop)    | 4              | Matches convergence-loop hard cap + 1.                                                             |

**Autonomous iteration rules:**

- The system CAN autonomously: apply confidence downgrades, remove fabricated
  citations, restore omitted caveats, correct numerical errors found during
  verification.
- The system MUST escalate to user: unresolved contradictions between
  high-authority sources, quality score below threshold after one re-research
  cycle, scope decisions (narrow vs. deepen).

---

## Academic and Industry Patterns

### Academic: Self-Refine (Madaan et al., 2023)

The Self-Refine architecture uses a GENERATE -> FEEDBACK -> REFINE loop where
the same LLM provides feedback on its own output and iterates. Key findings:

- Improves task performance by ~20% absolute on average
- Works without additional training (prompt-only)
- **Critical limitation for research:** "Errors in math can be nuanced... a
  consistent-looking reasoning chain can deceive LLMs into thinking everything
  looks good." This applies directly to research: a well-written synthesis can
  deceive the same model into thinking the research is thorough.

**Adaptation for our system:** Self-Refine validates the GENERATE -> FEEDBACK
loop but also demonstrates why the auditor should not be the author. The same
agent that produced research will be biased toward confirming its own output.
Our design uses independent agents (via convergence-loop) rather than
self-critique.

### Academic: Reflexion (Shinn et al., 2023)

Reflexion builds on Self-Refine by adding explicit memory of past failures. The
agent maintains a "reflection bank" of previous errors, which is retrieved
during future reasoning to avoid repeating mistakes.

**Adaptation for our system:** The research-audit should maintain a persistent
record of common audit failures (e.g., "overconfidence on single-source claims
about technology market share"). This feeds into the `research-claims` preset as
domain-specific instructions, improving audit quality over time. Store in
`.claude/state/research-audit-learnings.jsonl`.

### Academic: Multi-Agent Reflexion (MAR, 2025)

MAR uses intentionally diverse critic personas, inspired by the Society of Mind
framework. Different critics have systematically different reasoning tendencies,
so their disagreements surface genuine uncertainty.

**Adaptation for our system:** The convergence-loop `fresh-eyes` behavior
already implements a version of this (zero prior context = different reasoning
path). For high-stakes research, consider using 2 fresh-eyes agents with
different slicing strategies to increase perspective diversity.

### Academic: Constitutional AI (Anthropic, 2022)

Constitutional AI uses rule-based self-assessment: the model critiques its
output against a set of explicit principles (a "constitution"). This is faster
and more consistent than human feedback loops.

**Adaptation for our system:** The audit dimensions in this document ARE the
"constitution" for research quality. Each dimension (D1-D10) is an explicit
principle the audit checks against. The research-source-check and
research-completeness behaviors are the "critique" step. This is Constitutional
AI applied to research quality rather than harmlessness.

### Academic: CRITIC (Gou et al., 2024)

CRITIC allows LLMs to interact with external tools to verify specific aspects of
generated text. The model identifies claims that need verification, formulates
tool queries, and uses the results to correct its output.

**Adaptation for our system:** The research-source-check behavior should use
WebSearch to re-verify claims, not just re-read cached sources. A claim verified
against a fresh search is more trustworthy than one verified against the same
source the researcher already found.

### Academic: Confidence Calibration Research (ACL/ICLR 2025)

Key findings from recent calibration research:

- Confidence-Informed Self-Consistency (CISC) reduces required reasoning paths
  by 40% while improving accuracy
- Even high-performing models show "minimal variation in confidence between
  right and wrong answers"
- Sampling-based consistency (generate multiple responses, measure agreement) is
  the most practical calibration method for black-box APIs
- Flex-ECE metric accounts for partial correctness, relevant for research where
  claims can be "partially right"

**Adaptation for our system:** The confidence calibration audit dimension (D5)
implements sampling-based consistency. The convergence-loop's multi-pass
structure naturally generates multiple assessments of the same claims, enabling
consistency-based confidence calibration.

### Industry: Intelligence Community (ICD 203)

The US Intelligence Community's Analytic Tradecraft Standards (ICD 203,
revised 2015) require all analytic products to meet nine standards, several of
which map directly to our audit dimensions:

| ICD 203 Standard                                                     | Our Audit Dimension        |
| -------------------------------------------------------------------- | -------------------------- |
| Properly describe quality and credibility of underlying sources      | D4: Source Diversity       |
| Properly express and explain uncertainties                           | D5: Confidence Calibration |
| Distinguish between intelligence information and analyst assumptions | D6: Internal Coherence     |
| Incorporate analysis of alternatives                                 | D8: Bias Detection         |
| Use clear and logical argumentation                                  | D10: Actionability         |
| Note change or consistency of analytic judgments                     | D1: Cross-Consistency      |

**Key ICD 203 principle:** Analysts must "perform their functions with
objectivity and awareness of their own assumptions and reasoning, and must
employ reasoning techniques and practical mechanisms that reveal and mitigate
bias."

**Adaptation for our system:** The ICD 203 framework validates our dimension
prioritization. Source quality, uncertainty expression, and alternative analysis
are the same top-tier concerns across intelligence analysis and AI research. The
"awareness of own assumptions" requirement maps to our principle that "the
auditor must not be the author."

### Industry: Journalism Fact-Checking

The journalism fact-checking process uses three models:

1. **Magazine Model:** A dedicated fact-checker (separate from writer and
   editor) verifies every fact. The fact-checker re-interviews sources, checks
   claims line-by-line, and reports necessary changes with reasoning.
2. **Newspaper Model:** Journalists verify their own facts. Editors do spot
   checks.
3. **Hybrid Model:** Longer complex pieces get the magazine model; shorter
   pieces get the newspaper model.

**Adaptation for our system:** Our tiered audit depth mirrors the hybrid model.
Quick research gets a lightweight self-check (newspaper model). Deep research
gets full multi-agent verification (magazine model). The key journalism
principle --- the fact-checker is NOT the writer --- reinforces our design
principle that the auditor must be independent.

### Industry: Medical Systematic Reviews (PRISMA)

The PRISMA 2020 framework requires systematic reviews to report on 27 items
including:

- Search strategy (reproducibility)
- Study selection criteria (transparency)
- Risk of bias assessment (quality)
- Evidence synthesis methods (methodology)
- Certainty of evidence (confidence)

**Adaptation for our system:** PRISMA's emphasis on search strategy
reproducibility maps to our source registry design (SOURCE_REGISTRY_DESIGN.md).
The risk-of-bias assessment maps to D8. The certainty-of-evidence framework maps
to our confidence levels. PRISMA's flow diagram (articles found -> screened ->
included -> analyzed) could inspire a "research funnel" view showing how many
sources were found, evaluated, and ultimately cited.

### Industry: Academic Peer Review

The peer review process maps to our multi-pass audit:

| Peer Review Stage                   | Our Equivalent                                      |
| ----------------------------------- | --------------------------------------------------- |
| Author submission                   | Research synthesis complete                         |
| Editor assessment (scope, merit)    | Tier 1 automated checks (fabrication, completeness) |
| Reviewer 1 deep review              | research-source-check pass                          |
| Reviewer 2 independent review       | fresh-eyes pass                                     |
| Editor decision with reviewer input | Quality gate decision tree                          |
| Revision and re-review              | Re-research and re-audit cycle                      |

**Key principle from peer review:** Reviewers check that "the study design and
methodology are appropriate and described so that others could replicate what
has been done." For AI research: the audit should verify that the research
methodology (search queries used, sources consulted, synthesis approach) is
transparent enough for a human to trace and verify.

### Industry: Consulting (MBB Problem-Solving)

McKinsey/BCG/Bain use the Pyramid Principle for synthesis quality: every
synthesis communicates one main idea (the "governing thought") with supporting
ideas organized logically. Quality assurance involves:

- Hypothesis-driven structure (not data dumps)
- "So what?" test on every finding (= our D10 Actionability)
- Red team review (= our fresh-eyes pass)

**Adaptation for our system:** The "so what?" test should be part of the
actionability audit. Every finding should answer: "What should the reader DO
differently because of this information?"

---

## Cost-Effective Audit Strategies

### Tiered Audit Depth

| Research Type                                     | Audit Tier                          | Estimated Token Cost | Time Added    |
| ------------------------------------------------- | ----------------------------------- | -------------------- | ------------- |
| **Quick** (single question, < 5 min research)     | Tier 1 only, inline                 | 5-10K tokens         | 30-60 seconds |
| **Standard** (multi-question, 10-20 min research) | Tier 1 + Tier 2, 2-pass convergence | 40-80K tokens        | 3-5 minutes   |
| **Deep** (complex, 30+ min research)              | All tiers, 3-pass convergence       | 100-200K tokens      | 8-15 minutes  |

### Automated vs. Agent-Based Checks

Some audit dimensions can be checked algorithmically without spawning agents:

| Check                    | Method                                             | Cost                          |
| ------------------------ | -------------------------------------------------- | ----------------------------- |
| Citation count per claim | Parse synthesis, count `[n]` references            | ~0 (string parsing)           |
| Source recency           | Extract dates from source registry, compute median | ~0 (data processing)          |
| Confidence distribution  | Count HIGH/MEDIUM/LOW/UNVERIFIED labels            | ~0 (string parsing)           |
| Question coverage        | Compare original questions to synthesis headings   | 1-2K tokens (light LLM check) |
| Citation existence       | Re-fetch URLs, check for 404s                      | ~0 (HTTP requests)            |
| Source independence      | Check for shared domains/authors across citations  | 1-2K tokens (light analysis)  |

**Recommendation:** Run all automated checks FIRST as a pre-screen. If the
pre-screen finds zero issues, the agent-based audit can be lighter (skip to
fresh-eyes only). If the pre-screen finds issues, run the full convergence-loop
audit.

### Model Tier Selection

| Audit Task                                    | Model Tier              | Rationale                                                                                 |
| --------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| Automated pre-screen checks                   | No LLM needed           | Pure string/data processing                                                               |
| research-source-check (citation verification) | Opus-class              | Requires nuanced understanding of whether a source "supports" vs. "is related to" a claim |
| research-completeness (gap/bias detection)    | Opus-class              | Requires domain reasoning and counterfactual thinking                                     |
| fresh-eyes verification                       | Sonnet-class acceptable | Independent verification is less nuanced than initial audit                               |
| Confidence calibration adjustments            | Opus-class              | Calibration requires meta-reasoning about evidence quality                                |

### Cost Optimization Strategies

1. **Pre-screen to skip:** If automated checks find zero issues AND the research
   is Quick tier, skip agent-based audit entirely. Present with a note:
   "Automated quality checks passed. Full audit not performed (quick research
   tier)."

2. **Graduated agent count:** Start with 2 agents for Tier 1. Only spawn
   additional agents if Pass 1 finds issues requiring deeper investigation.

3. **Claim sampling for large syntheses:** For syntheses with 50+ claims, audit
   a stratified sample: all HIGH-confidence claims + random 30% of MEDIUM +
   random 10% of LOW. If sample audit passes, extrapolate. If it fails, expand
   to full audit.

4. **Cache verification results:** If the same source was already verified
   during the research phase (by the searcher agent), the audit agent can
   reference that verification rather than re-fetching. Only re-verify if the
   synthesis makes a STRONGER claim than the original finding.

5. **Amortize learning:** Store audit patterns in
   `.claude/state/research-audit-learnings.jsonl`. Over time, the system learns
   which types of claims are most likely to fail audit (e.g., "technology market
   share claims are overconfident 40% of the time") and can prioritize
   verification accordingly.

---

## Design Recommendations

### Recommendation 1: Integrate via Convergence-Loop, Not Separate Agents

**Do:** Add a `research-audit` preset to `/convergence-loop` with the two new
behaviors (`research-source-check`, `research-completeness`) plus existing
`fresh-eyes`.

**Do not:** Create 5 separate audit agents (cross-reference agent, gap-finder
agent, claim-verifier agent, bias auditor agent, quality scorer agent). This
would add ~3,000-4,000 lines of agent definitions for what the convergence-loop
framework already handles.

**Rationale:** The convergence-loop already provides: multi-pass iteration, T20
tallies, graduated convergence, disagreement handling, state persistence, and
hard caps on iterations. Building a parallel system for research audit would
violate DRY and fragment the verification infrastructure.

### Recommendation 2: Mandatory Automated Pre-Screen

Before any agent-based audit, run automated checks:

```
PRE-SCREEN CHECKS (no agents needed):
  [x] Citation count: every claim has >= 1 citation
  [x] Citation URLs: no 404s (HTTP check)
  [x] Confidence distribution: not all HIGH
  [x] Question coverage: all original questions appear in synthesis
  [x] Source recency: median age within domain threshold
  [x] Source independence: no single domain > 40% of citations

PRE-SCREEN RESULT: 0 issues found -> lightweight audit
                    1+ issues found -> full convergence-loop audit
```

### Recommendation 3: Audit Report Before Synthesis

Present the quality scorecard BEFORE the research synthesis, not after. The user
should know the quality level of what they are about to read. This follows the
ICD 203 pattern where confidence assessments appear at the top of analytic
products, not buried in footnotes.

**Format:**

```markdown
## Research Quality Assessment

[Scorecard table] [Any caveats or confidence adjustments]

---

## Research Findings

[Synthesis content]
```

### Recommendation 4: Persistent Audit Learning

Maintain a learning log at `.claude/state/research-audit-learnings.jsonl`:

```jsonl
{
  "timestamp": "2026-03-20T10:00:00Z",
  "topic": "framework-comparison",
  "dimension": "confidence",
  "finding": "market share claims overconfident",
  "correction": "3 HIGH -> MEDIUM",
  "pattern": "single-source-market-data"
}
```

Over time, this enables:

- Domain-specific audit focus (technology claims need more verification than
  historical claims)
- Pattern-based pre-screening (known failure patterns flagged before full audit)
- Audit quality improvement (track false positive rate of audit itself)

### Recommendation 5: User-Facing Transparency

The audit should be visible, not hidden. Users should see:

1. **That an audit happened:** "Research audited: 3-pass verification, 24 claims
   checked"
2. **What was found:** Scorecard with pass/fail per dimension
3. **What was changed:** Any confidence downgrades, citation corrections, or
   caveat additions applied during audit
4. **What remains uncertain:** Gaps, contradictions, and limitations explicitly
   stated

This follows CLAUDE.md guardrail #6: "All passive surfacing must force
acknowledgment." The audit results require user acknowledgment before
proceeding.

### Recommendation 6: Tiered Depth Based on Research Mode

| Mode                         | Audit Depth                                                                               | Rationale                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Quick query                  | Automated pre-screen only                                                                 | Cost proportionality                              |
| Standard research            | Pre-screen + 2-pass convergence (source-check + fresh-eyes)                               | Balance of quality and cost                       |
| Deep research                | Pre-screen + 3-pass convergence (source-check + completeness + fresh-eyes)                | Full rigor for high-stakes                        |
| High-stakes (user-specified) | Pre-screen + 4-pass convergence (source-check + completeness + fresh-eyes + fresh-eyes-2) | Maximum verification with dual independent checks |

### Recommendation 7: Maximum Audit Loop Bounds

To prevent infinite audit-fix-reaudit loops:

- **Audit passes:** Max 4 (from convergence-loop hard cap)
- **Fix-and-reaudit cycles:** Max 2
- **Re-research cycles:** Max 1
- **Total ceiling:** If after 2 fix-reaudit cycles AND 1 re-research cycle the
  quality threshold is still not met, present to user with quality warning and
  let user decide next steps

This mirrors convergence-loop's existing guard rail: "Warn at pass 3 without
convergence trend."

---

## Appendix A: Mapping to Existing Codebase Artifacts

| Self-Audit Component     | Existing Artifact                          | Integration Type                                              |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| Convergence framework    | `/convergence-loop` SKILL.md               | Add `research-audit` preset                                   |
| Audit behaviors          | `/convergence-loop` REFERENCE.md Section 1 | Add 2 new behavior definitions                                |
| Quality scorecard format | `/skill-audit` Phase 5 report              | Adapt template for research context                           |
| Finding presentation     | `/deep-plan` Phase 3.5 format              | Reuse description/impact/options/recommendation format        |
| Decision gate tree       | `/deep-plan` Phase 4 approval              | Adapt for quality threshold decisions                         |
| State persistence        | `.claude/state/` convention                | Follow existing `convergence-loop-{topic}.state.json` pattern |
| Anti-pattern pre-screen  | `/code-reviewer` anti-pattern check        | Adapt "scan before review" pattern for research anti-patterns |
| Learning persistence     | `.claude/state/` JSONL convention          | New: `research-audit-learnings.jsonl`                         |

## Appendix B: Research Anti-Patterns (Pre-Screen Checks)

| Anti-Pattern                                  | Detection Method                            | Severity                                   |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| All claims rated HIGH confidence              | Count confidence labels                     | BLOCK (likely uncalibrated)                |
| Zero citations                                | Count `[n]` markers                         | BLOCK (unverifiable)                       |
| Single source for all claims                  | Unique source count                         | WARNING (echo chamber)                     |
| No contradictions mentioned                   | Search for conflict language                | WARNING (may indicate suppression)         |
| All sources from same year                    | Date extraction                             | WARNING (possible recency bias)            |
| Recommendations without evidence              | Check recommendation sections for citations | WARNING (opinion masquerading as research) |
| Claims stronger than sources                  | Compare synthesis claims to findings files  | BLOCK (distortion)                         |
| Missing questions from original decomposition | Compare question list to synthesis sections | BLOCK (incomplete)                         |

## Appendix C: Token Cost Estimates

| Audit Configuration              | Input Tokens | Output Tokens | Total | USD (Opus) |
| -------------------------------- | ------------ | ------------- | ----- | ---------- |
| Pre-screen only                  | 0            | 0             | 0     | $0.00      |
| Quick (pre-screen + light check) | 10K          | 3K            | 13K   | ~$0.25     |
| Standard (2-pass, 3 agents)      | 80K          | 20K           | 100K  | ~$2.00     |
| Deep (3-pass, 5 agents)          | 200K         | 50K           | 250K  | ~$5.00     |
| High-stakes (4-pass, 6 agents)   | 350K         | 80K           | 430K  | ~$8.50     |

These estimates assume average synthesis size of ~5,000 tokens and agent
definitions of ~500 tokens each.

---

## Sources

### Academic Research

- [Self-Refine: Iterative Refinement with Self-Feedback (Madaan et al., 2023)](https://arxiv.org/abs/2303.17651)
- [Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al., 2023)](https://arxiv.org/abs/2303.11366)
- [Multi-Agent Reflexion (MAR) for Reasoning (2025)](https://arxiv.org/html/2512.20845)
- [Constitutional AI: Harmlessness from AI Feedback (Anthropic, 2022)](https://arxiv.org/abs/2212.08073)
- [CRITIC: LLMs Can Self-Correct with Tool-Interactive Critiquing](https://openreview.net/forum?id=Sx038qxjek)
- [Confidence Improves Self-Consistency in LLMs (ACL 2025)](https://aclanthology.org/2025.findings-acl.1030/)
- [Self-Reflection Enhances LLMs Towards Substantial Academic Response (Nature, 2025)](https://www.nature.com/articles/s44387-025-00045-3)
- [Investigating Bias in LLM-Based Bias Detection (COLING 2025)](https://aclanthology.org/2025.coling-main.709/)
- [Know When You're Wrong: Aligning Confidence with Correctness (2026)](https://arxiv.org/html/2603.06604)
- [Uncertainty Quantification and Confidence Calibration in LLMs: A Survey (KDD 2025)](https://arxiv.org/abs/2503.15850)
- [Tool-MAD: Multi-Agent Debate Framework for Fact Verification](https://arxiv.org/abs/2601.04742)
- [FACT-AUDIT: Adaptive Multi-Agent Framework (ACL 2025)](https://aclanthology.org/2025.acl-long.17.pdf)
- [LMT Consistency Framework: Early Contradiction Detection (PhilArchive)](https://philarchive.org/rec/YOSLCF)
- [HumbleBench: Measuring Epistemic Humility in Multimodal LLMs](https://arxiv.org/pdf/2509.09658)
- [Towards AI Accountability Infrastructure: AI Audit Tooling (CHI 2025)](https://dl.acm.org/doi/10.1145/3706598.3713301)

### Industry Standards

- [ODNI ICD 203: Analytic Standards (Intelligence Community Directive)](https://www.dni.gov/files/documents/ICD/ICD-203.pdf)
- [PRISMA 2020 Statement: Systematic Review Reporting Guidelines](https://www.prisma-statement.org/prisma-2020-checklist)
- [KSJ Handbook: The Fact-Checking Process (Journalism)](https://ksjhandbook.org/fact-checking-science-journalism-how-to-make-sure-your-stories-are-true/the-fact-checking-process/)
- [Truth in Journalism Fact-Checking Guide: Editorial Process](https://thetijproject.ca/guide/the-editorial-process/)

### Agent Architecture Patterns

- [Reflection Agents (LangChain)](https://blog.langchain.com/reflection-agents/)
- [The Reflection Pattern: Why Self-Reviewing AI Improves Quality](https://qat.com/reflection-pattern-ai/)
- [Agentic AI Reflection Pattern (Analytics Vidhya)](https://www.analyticsvidhya.com/blog/2024/10/agentic-ai-reflection-pattern/)
- [Reflection Agent Pattern Documentation](https://agent-patterns.readthedocs.io/en/stable/patterns/reflection.html)

### Codebase References

- `.claude/skills/deep-plan/SKILL.md` --- Phase 3.5 Plan Self-Audit
- `.claude/skills/convergence-loop/SKILL.md` --- Multi-pass verification
  framework
- `.claude/skills/convergence-loop/REFERENCE.md` --- Behavior definitions,
  presets, state schema
- `.claude/skills/skill-audit/SKILL.md` --- Phase 5 Evidence-Based Self-Audit
- `.claude/skills/code-reviewer/SKILL.md` --- Anti-pattern pre-screening
- `.planning/deep-research-skill/research/SOURCE_VERIFICATION.md` --- Companion
  research on verification
- `.planning/deep-research-skill/research/CUSTOM_AGENT_DESIGN.md` --- Agent
  architecture decisions
- `.planning/deep-research-skill/research/GAP_ANALYSIS.md` --- Research
  capability gaps
