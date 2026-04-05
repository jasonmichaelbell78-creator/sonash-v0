# Findings: Phase 2 Scouting Governance

**Searcher:** deep-research-searcher **Profile:** web + academic (research
methodology, diminishing returns, adoption frameworks) **Date:**
2026-04-04T00:00:00Z **Sub-Question IDs:** SQ7

---

## 1. Sub-Question Restated

How do you GOVERN a scouting phase (where `/repo-analysis` and `/deep-research`
study external R&D pipeline approaches) to prevent analysis paralysis and scope
drift, while honoring the principle that no artificial time/count/session caps
should be imposed? Specifically:

- What qualitative signals indicate diminishing returns have been reached?
- What is the right "adopt vs adapt vs reject" framework for a solo dev
  examining patterns from other creators?
- How do you detect your own confirmation bias during unbounded research?
- What is the minimum scouting rigor that prevents cargo-cult adoption?
- What output artifacts signal "scouting done" without imposing hard deadlines?

---

## 2. Search Strategy

**Phase 1 — Landscape mapping (broad queries):**

- Theoretical saturation in grounded theory (when to stop collecting data)
- Diminishing returns signals in qualitative research methodology
- Rogers Diffusion of Innovations framework (adopt/adapt/reject criteria)

**Phase 2 — Focused deep-reads:**

- PMC article on saturation conceptualization (PMC5993836)
- PLOS ONE simple method for thematic saturation assessment (PMC7200005)
- Farnam Street: Chesterton's Fence
- Steve McConnell: Cargo Cult Software Engineering
- Stage-Gate model criteria
- Not-Invented-Here syndrome Wikipedia

**Phase 3 — Edge cases and anti-patterns:**

- Analysis paralysis signals and anti-patterns
- Confirmation bias detection in qualitative research
- "Just one more" infinite loop stopping heuristics
- ADR lifecycle as "decision made" artifact signal
- AAER (Adopt-Adapt-Expand-Respond) framework
- Satisficing (Herbert Simon) as governance philosophy
- Triangulation convergence as confidence signal
- Translation failure modes (cargo cult, NIH, abstraction loss)

**Query reformulations attempted:** 14 distinct queries across 3 phases.

---

## 3. Findings

### Finding 1: Theoretical Saturation is the Correct Conceptual Frame for Scouting Termination [CONFIDENCE: HIGH]

Grounded theory's concept of "theoretical saturation" — first articulated by
Glaser and Strauss — provides the strongest theoretical basis for knowing when
to stop scouting. The criterion is: "no additional data are being found whereby
the researcher can develop properties of the category." Saturation occurs when
new inputs stop generating new themes, patterns, or conceptual relationships.

Critically, the PMC paper on saturation [1] argues saturation is better
understood as **a matter of degree reflecting diminishing returns rather than a
discrete stopping event**. This framing is directly compatible with the "no
artificial caps" principle: you are not stopping because a counter hit a limit,
you are stopping because marginal insight per input has declined to negligible.

The signal is predictive: you stop when you can predict what the next source
will say before you read it, and that prediction is confirmed. Saturation is an
ongoing cumulative judgment, not a moment [4].

**Practical application:** After each scouting source, ask: "Did this change any
of my working hypotheses?" If the answer has been "no" for 2-3 consecutive
sources across different categories, saturation is likely reached.

**Sources:** [1], [4]

---

### Finding 2: The ≤5% New-Information Threshold Provides a Concrete Saturation Test [CONFIDENCE: HIGH]

Hennig et al.'s PLOS ONE paper [2] operationalizes saturation with a
three-component framework:

1. **Base Size:** The number of initial sources reviewed to establish the
   denominator (4-6 is sufficient).
2. **Run Length:** Consecutive new sources checked after the base (2-3 sources).
3. **New Information Threshold:** The proportion of new concepts appearing in
   the run divided by total concepts in the base.

**The signal:** When (new concepts in last N sources) / (total concepts found so
far) falls below 5%, saturation is reached. At 0% (two consecutive sources with
zero new concepts), it is definitively reached.

**Solo dev adaptation:** After building an initial concept map from the first
4-5 repos or sources studied, count concepts. For each subsequent source, tally:
"How many genuinely new concepts did this add?" When two consecutive sources add
zero, stop.

**Sources:** [2]

---

### Finding 3: Triangulation Convergence — Multi-Source Agreement — is a High-Confidence Stop Signal [CONFIDENCE: HIGH]

Triangulation in qualitative research means using multiple independent methods
or source types to confirm findings [12]. When multiple independent sources
(from different categories: team tools, solo creator tools, OSS pipelines, etc.)
converge on the same pattern without being prompted, that convergence elevates
confidence and simultaneously reduces marginal value of further scouting.

Denzin (1978) identified four triangulation types: method, investigator, theory,
and data-source. For scouting, data-source triangulation is most relevant: when
you have observed a pattern in 3+ independent source categories (not 3 sources
of the same type), the pattern is well-established.

**Convergence as a stop signal:** Once the dominant patterns observed are
predicted by previously established themes — and sources in new categories
confirm rather than disrupt those themes — triangulation has been achieved. This
is a qualitative confidence elevation, not just a count.

**Sources:** [12]

---

### Finding 4: The Feynman Explainability Test is a Decision-Readiness Proxy [CONFIDENCE: MEDIUM-HIGH]

The Feynman Technique posits that the ability to explain something simply and
completely is the most reliable test of whether you understand it [9]. Applied
to scouting governance: if you cannot explain the pattern you observed, its
rationale, and its context constraints in plain terms, you do not yet understand
it well enough to make an adopt/adapt/reject decision.

**Decision-readiness signal:** "I could now write a summary of the dominant
patterns in this space that would be 90% accurate, and I can explain WHY each
pattern exists in the contexts where it appears." If this is true, scouting is
done enough to decide.

**Inverse signal:** If you still feel unable to articulate why the patterns
exist (only what they are), more scouting may be needed — specifically scouting
for context (why does this work there?) rather than additional examples.

**Limitation:** This is self-assessed and subject to the Dunning-Kruger effect.
The Feynman test catches what you know you don't know, but not unknown unknowns.
It should be combined with triangulation (Finding 3).

**Sources:** [9], [10]

---

### Finding 5: Chesterton's Fence is the Mandatory Pre-Adopt/Reject Gate [CONFIDENCE: HIGH]

Chesterton's Fence [5] establishes the rule: do not adopt OR reject a pattern
until you understand why it exists in its current form. "Do not remove a fence
until you know why it was put up in the first place."

Applied symmetrically to scouting:

- **Do not adopt** a pattern from another creator until you understand what
  problem it solves for them, in their context, at their scale.
- **Do not reject** a pattern from another creator until you understand whether
  the superficial differences that make it look wrong actually matter, or
  whether the abstract principle is sound and the implementation is the issue.

The test question: "Can I articulate the original problem this pattern solves,
and the constraints that shaped it?"

If NO: more context-scouting needed. If YES: proceed to adopt/adapt/reject
decision.

**This is the minimum rigor that prevents cargo-cult adoption.** Understanding
the "why" behind a pattern is not optional.

**Sources:** [5], [6]

---

### Finding 6: Cargo Cult Adoption is Identifiable by Specific Surface Signals [CONFIDENCE: HIGH]

McConnell's cargo cult software engineering [6] identifies specific signals that
a pattern is being adopted without understanding:

1. **Justification by tradition/authority:** "They do it this way" without a
   reason why it works.
2. **Ignoring tradeoffs:** Treating the pattern as universally good rather than
   conditionally appropriate.
3. **Resistance to inspection:** Inability to explain what problem it solves or
   what assumptions it requires.
4. **Mimicking artifacts, not causes:** Copying the visible output
   (documentation format, workflow structure) without copying the conditions
   that make it effective.

McConnell distinguishes two pathological variants: bureaucratic mimicry (copying
the artifacts of process-heavy orgs) and sweatshop mimicry (copying the visible
commitment patterns without the intrinsic motivation that drives them).

**Cargo cult detection question for scouting:** For each pattern under
consideration, ask: "Can I name: (a) the problem it solves, (b) the context
assumptions it requires, (c) what happens if I adopt it without those
assumptions?" If you cannot answer (b) and (c), the risk of cargo cult adoption
is high.

**Sources:** [5], [6]

---

### Finding 7: NIH Syndrome and Cargo Cult are the Two Failure Poles — Governance Must Avoid Both [CONFIDENCE: HIGH]

Not-Invented-Here (NIH) syndrome [11] is the mirror failure to cargo cult:
rejecting external patterns based on their external origin rather than their
merit. NIH correlates with declining project performance and insularity (Katz &
Allen, 1982 — cited in Wikipedia article: groups become increasingly insular
after ~5 years of internal focus).

**The governance challenge:** Scouting governance must simultaneously:

- Prevent cargo cult adoption (adopting without understanding context)
- Prevent NIH rejection (rejecting because "we can do it better ourselves" or
  "our context is different")

**Balance heuristic:** The bias-neutral evaluation question is: "Does this
pattern solve a real problem we have, and does it solve it in a way that fits
our constraints?" This is neither "we should adopt it because others do" (cargo
cult) nor "we shouldn't adopt it because we didn't invent it" (NIH).

**Sources:** [11]

---

### Finding 8: Rogers' Five Factors Form the Adopt/Adapt/Reject Decision Backbone [CONFIDENCE: HIGH]

Rogers' Diffusion of Innovations [7] provides the most academically robust
framework for evaluating whether to adopt an innovation. The five factors:

1. **Relative Advantage:** Is this better than what we have/could build?
2. **Compatibility:** Does it align with existing values, practices, and
   constraints?
3. **Complexity:** Is it understandable and usable given our skill set and
   toolchain?
4. **Trialability:** Can we test it on a small scale before full commitment?
5. **Observability:** Can we see whether it's working?

**For solo dev scouting:** These five factors map naturally to an
adopt/adapt/reject decision:

- **ADOPT** when: Relative advantage is clear, compatibility is high, complexity
  is manageable, trialability is possible, observability is good.
- **ADAPT** when: Relative advantage is clear but compatibility is medium (the
  principle is right but the implementation clashes with your toolchain/scale).
- **REJECT** when: Relative advantage is unclear, complexity is
  disproportionate, or the pattern's assumptions do not hold at your scale.
  (Reject on merit, not origin.)

**Sources:** [7]

---

### Finding 9: Stage-Gate "Go/Kill/Hold/Recycle" Provides a Governance Vocabulary Without Imposing Time Constraints [CONFIDENCE: MEDIUM-HIGH]

The Stage-Gate model [8] uses four gate decisions: Go, Kill, Hold, Recycle. For
scouting governance, these translate:

- **Go:** Sufficient patterns identified; proceed to synthesis and decision.
- **Kill:** A scouting sub-topic has reached saturation with negative results
  (the patterns in this category are not applicable); stop this thread.
- **Hold:** A promising pattern found but insufficient context to evaluate it;
  flag for deeper single-source investigation, not continued broad scouting.
- **Recycle:** Found something that changes the scope of what we're scouting;
  return to an earlier scouting phase with the new frame.

**Critical Stage-Gate insight for scouting:** Gates are "tough decision
meetings," not status updates. The gate is where you ask: "Do we have enough to
decide, or does continuing to scout produce more value than the cost of not
starting?"

**Sources:** [8]

---

### Finding 10: Satisficing (Simon) is the Philosophical Foundation for "No Caps but Not Infinite" [CONFIDENCE: HIGH]

Herbert Simon's bounded rationality / satisficing framework [13] directly
addresses the governance paradox: "no artificial caps" vs "not infinite."
Satisficing means stopping when you have found a solution that meets or exceeds
a predefined threshold (the "aspiration level"), rather than continuing to
search for an optimal solution.

For scouting governance, the aspiration level is qualitative: "I have enough
context to make an adopt/adapt/reject recommendation for each category I
identified at the start of scouting." Scouting stops not when a counter expires
but when the aspiration level is met.

**Key Simon insight:** Continuing to search after the aspiration level is met is
not rational — the cost of additional search exceeds the expected improvement in
decision quality. This is the theoretical grounding for stopping without an
artificial cap.

**Sources:** [13]

---

### Finding 11: "Tangible Output Test" and the Rabbit Hole Detection Heuristics [CONFIDENCE: MEDIUM]

Multiple sources on research rabbit holes [14, 15] converge on similar
anti-pattern detection signals:

**Signals you are in a rabbit hole:**

1. You feel busy but cannot name a concrete deliverable you are moving toward.
2. You feel excitement but are not finishing anything.
3. The scope of what you are scouting keeps expanding.
4. You are avoiding synthesis / writing up findings.
5. You keep switching approaches without clear justification.
6. Three or more of the above apply simultaneously.

**The tangible output test:** Before each scouting session, ask: "What artifact
will this produce?" If the answer is "more knowledge" rather than a specific
decision, finding, or synthesis document, the session may be drift.

**Sources:** [14, 15]

---

### Finding 12: Confirmation Bias During Scouting — Detection and Prevention [CONFIDENCE: MEDIUM]

Research on confirmation bias in qualitative data collection [3] identifies that
researchers tend to favor sources that confirm pre-existing hypotheses.
Detection strategies:

1. **Negative case analysis:** Actively seek sources that contradict your
   emerging patterns before declaring saturation. "What would falsify this?" is
   the bias-detection question.
2. **Diverse sampling:** Deliberately study sources from different categories,
   different scales, and different philosophies — not just the ones that look
   like you.
3. **Predict then check:** Before reading each new source, write down what you
   expect to find. If you are consistently correct, either you have reached
   saturation OR you have confirmation bias. Distinguish by checking: are the
   new sources genuinely from new categories?
4. **Audit trail:** Document why each source was selected. If all selections
   share a common "confirms my view" property, bias is operating.

**Solo dev shortcut:** Intentionally include 1-2 sources that appear to
contradict your emerging view before declaring scouting done. If examination
shows they actually confirm the abstracted principle while contradicting the
surface implementation, that is a saturation signal (not a contradiction). If
they genuinely contradict the principle, update the model.

**Sources:** [3]

---

### Finding 13: Translation Failure Modes — Three Canonical Errors When Applying External Patterns [CONFIDENCE: HIGH]

Three distinct translation failure modes were synthesized from multiple sources:

**Failure Mode 1: Context Stripping (Cargo Cult)** Adopting the visible
artifacts of a pattern without the context that makes it effective. Example:
adopting a "weekly sprint review" from a 12-person team without having the
coordination needs that make reviews valuable. The plane form without the flight
infrastructure. Detection: you cannot name the original problem the pattern
solved.

**Failure Mode 2: Essence Loss During Adaptation** Adapting a pattern but
modifying the very element that makes it effective. Example: "adapting" TDD by
writing tests after the code — this preserves the form (tests exist) while
losing the value (tests as design tool). The signal: the adapted version
preserves the ceremony but removes the mechanism that produces the claimed
benefit. Detection: ask "what is this pattern FOR?" then check whether your
adaptation preserves the answer.

**Failure Mode 3: Principle Rejection via Surface Rejection (NIH)** Rejecting a
pattern because the implementation looks wrong, without extracting the abstract
principle. Example: rejecting "design docs" because "enterprise teams write
30-page specs and we're solo" — missing that the principle (articulate decisions
before coding) is scale-independent. Detection: ask "what is the minimum essence
of this pattern?" before rejecting it. If the minimum essence is valuable at
your scale, adapt rather than reject.

**Sources:** [5], [6], [7], [11]

---

### Finding 14: ADR (Architecture Decision Record) Lifecycle is the Correct "Scouting Done" Artifact Pattern [CONFIDENCE: MEDIUM-HIGH]

ADR lifecycle [16] — Draft → Proposed → Accepted / Rejected — provides a proven
artifact-based governance model for research-to-decision transitions. The
"Accepted" or "Rejected" status on a scouting output functions as an explicit
"decision made" marker that closes the loop.

For scouting governance:

- Scouting is "done" when a SCOUT-DECISION artifact exists for each category
  scouted, with status: Adopted / Adapted (with specifics) / Rejected (with
  reasoning).
- The artifact requirement creates a natural stopping signal: if you cannot
  write the decision document, you have not finished scouting that category. If
  you can write it, you are done.
- Alternatives explored but not adopted should be documented inline (as ADR
  templates explicitly recommend for "alternatives considered").

This approach does not impose time or count caps — it imposes an output
requirement: a decision with reasoning.

**Sources:** [16]

---

### Finding 15: AAER Framework (Adopt-Adapt-Expand-Respond) Adds Sustainability Test [CONFIDENCE: MEDIUM]

The AAER framework from Practical Action [17] adds a dimension missing from
Rogers and Stage-Gate: sustainability. Its unifying question is: "If you left
now, would the change continue?"

For solo dev scouting, this translates to: "If I adopted this pattern without
the external scaffolding of the team/tool/ecosystem it was designed for, would
it still deliver value?"

- **Adopt** when the pattern delivers value through your own agency, without
  requiring the original context.
- **Adapt** when the pattern's value mechanism requires modification to work
  without the original context.
- Do not adopt patterns whose value is context-dependent in ways you cannot
  replicate.

This test filters against a category of adoption failure: patterns that only
work because of surrounding organizational infrastructure (standing meetings,
code review culture, pair programming norms) that solo devs lack.

**Sources:** [17]

---

## 4. Synthesis

### The Governance Architecture for Unbounded Scouting

The research converges on a coherent governance architecture that avoids both
artificial caps and infinite drift. The architecture has three layers:

**Layer 1: Scope Anchoring (entry governance)** Before scouting begins, define
the categories you intend to scout (e.g., "research pipelines," "decision-making
artifacts," "synthesis workflows"). This is not a cap — it is a compass. You do
not stop when you've studied N examples per category; you stop when new examples
in a category produce no new conceptual material.

**Layer 2: Saturation Monitoring (during governance)** After each source, ask:
"Did this add new concepts to any category?" Track concepts per category (not
source count). When consecutive sources in a category produce nothing new, that
category is saturated. Apply the ≤5% threshold as a concrete test if needed.

**Layer 3: Decision Artifact Requirement (exit governance)** Scouting is
complete when you can produce a SCOUT-DECISION document for each category with:
(a) the pattern identified, (b) its context requirements (Chesterton's Fence),
(c) an adopt/adapt/reject recommendation using Rogers' five factors, and (d) the
translation adjustment needed (scale, toolchain, workflow). The document
requirement is the gate — not the passage of time.

### Why "No Artificial Caps" and "Governance" Are Compatible

Simon's satisficing framework resolves the apparent contradiction. "No
artificial caps" means: do not stop because a counter expired. "Governance"
means: stop when the aspiration level — enough to decide — is met. These are not
in tension; they are complementary. The aspiration level is qualitative and
researcher-defined, not externally imposed.

---

## 5. Recommendations Specific to SoNash Phase 2 Scouting Governance

1. **Define scouting categories before starting, not sources.** Identify 3-5
   categories of R&D pipeline patterns to investigate (e.g.,
   "research-to-decision artifacts," "saturation heuristics," "synthesis
   formats"). These are the scope anchors, not the stopping criteria.

2. **Maintain a running concept map per category.** As you scout, log new
   concepts. The visual density of new additions per source is your saturation
   indicator. When entries become confirmation-only, the category is saturated.

3. **Require the Chesterton Gate before any adoption decision.** For each
   pattern under consideration, write down: "Why does this exist? What problem
   does it solve in its original context?" If you cannot answer this, do not
   decide yet — but also do not keep scouting broadly. Scout specifically for
   context on that pattern.

4. **Apply Rogers' five factors as the adopt/adapt/reject decision tool.** Score
   each pattern: relative advantage (vs. current approach), compatibility (with
   TypeScript/Node/solo workflow), complexity, trialability (can we run a
   one-sprint experiment?), observability (can we see whether it's working?).
   ADOPT if all five are favorable. ADAPT if advantage and observability are
   strong but compatibility or complexity requires modification. REJECT if
   advantage is unclear or context requirements cannot be met.

5. **Use the AAER sustainability test as an adaptation filter.** Before adopting
   any pattern: "If I removed the organizational scaffolding this pattern was
   designed for, would it still deliver its core value?" If no, the pattern
   needs deep adaptation, not surface adoption.

6. **Produce a SCOUT-DECISION.md per category as the exit artifact.** This
   document is the gate. When you can write it clearly, you are done scouting
   that category. When all categories have a SCOUT-DECISION, Phase 2 is
   complete.

7. **Run a deliberate disconfirmation pass before closing.** Before finalizing
   each SCOUT-DECISION, spend one scouting session looking for sources that
   contradict your emerging recommendation. Document what you found. This
   catches confirmation bias and validates triangulation.

---

## 6. Concrete Gate Criteria Proposal

The following qualitative signals — not timelines, not source counts — govern
Phase 2 scouting:

### Category-Level Saturation Gate

**OPEN:** Continue scouting this category when any of these hold:

- Last source introduced at least 1 new concept
- You cannot yet explain WHY the dominant pattern in this category works
  (Chesterton test fails)
- Fewer than 3 independent source categories have been sampled for this theme
  (triangulation not met)

**CLOSE:** Stop scouting this category when ALL of these hold:

- Two or more consecutive sources from different sub-categories produced zero
  new concepts (≤5% / 0% threshold met)
- You can articulate the original problem the dominant pattern solves, its
  context requirements, and its constraints
- Sources from at least 3 independent categories (e.g., OSS projects, enterprise
  tools, solo creator workflows) converge on the same pattern
- You can predict with high accuracy what the next source will say before
  reading it

### Phase-Level Completion Gate

**DONE:** Phase 2 scouting is complete when ALL of these hold:

- Every category defined in the Phase 2 scope anchor has reached the
  Category-Level Saturation Gate
- A SCOUT-DECISION document exists for every category with: pattern description,
  context requirements, adopt/adapt/reject recommendation, and translation
  adjustments
- A deliberate disconfirmation pass has been completed (at least 1 contradicting
  source examined per category)
- You can deliver a 5-minute verbal summary of Phase 2 findings without notes
  (Feynman readiness test)

### Anti-Pattern Intervention Triggers

Pause and reassess scouting immediately if:

- You have not added a new concept to any SCOUT-DECISION in 3+ consecutive
  scouting sessions
- You are selecting sources because they confirm your current view, not because
  they represent uncovered categories
- You feel unable to write a SCOUT-DECISION despite feeling "there's more to
  learn" — this indicates rabbit-hole drift
- Scope has expanded beyond the original category list without an explicit
  scope-change decision

---

## 7. Adopt/Adapt/Reject Framework for Solo Creator Lens

### The Framework

For each external pattern identified during scouting, evaluate against five
axes:

| Axis               | ADOPT Signal                                           | ADAPT Signal                                                    | REJECT Signal                                                      |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Scale**          | Pattern works at 1-person scale                        | Pattern works at 1-person scale with modification               | Pattern requires N>1 people to function                            |
| **Toolchain**      | Pattern is tool-agnostic or TypeScript/Node compatible | Pattern principle is sound but implementation needs translation | Pattern is deeply tied to incompatible tooling (e.g., Python-only) |
| **Workflow**       | Pattern fits terminal/Claude Code workflow             | Pattern fits with workflow modification                         | Pattern requires workflow infrastructure not worth building        |
| **Context**        | Pattern's original problem matches your problem        | Pattern's original problem partially matches                    | Pattern solves a problem you do not have                           |
| **Sustainability** | Pattern delivers value without original scaffolding    | Pattern delivers value with modified scaffolding                | Pattern's value is entirely scaffolding-dependent                  |

### Decision Rules

- **ADOPT** when: 4-5 axes show "ADOPT" signal. Adopt with documentation
  (SCOUT-DECISION status: Adopted).
- **ADAPT** when: Relative advantage is confirmed AND at least one axis shows
  "ADAPT" and none show "REJECT." Specify the adaptation explicitly in
  SCOUT-DECISION.
- **REJECT** when: Any of: (a) context axis is REJECT (you don't have the
  problem), (b) scale axis is REJECT and adaptation would remove the mechanism,
  (c) you cannot pass the Chesterton Gate (cannot explain why it works). REJECT
  with reasoning documented to prevent re-evaluation.

### Translation Heuristics by Type

**Scale translation (enterprise → solo):**

- Strip coordination overhead: patterns that exist to synchronize multiple
  contributors are not needed at 1 person
- Retain insight mechanisms: patterns that force clarity of thinking remain
  valuable at any scale
- "If they do X for a 10-person team, the 1-person version is [the core insight
  without the synchronization ceremony]"

**Toolchain translation (Python/VSCode → TypeScript/Claude Code):**

- Ask: is the value in the specific tool or in the behavior the tool enforces?
- If value is in behavior: find the TypeScript/Claude Code equivalent that
  enforces the same behavior
- If value is in the tool: assess complexity cost honestly; do not adopt the
  tool for the principle

**Workflow translation (CI/CD pipelines → local dev workflow):**

- Identify the decision point the workflow serves (e.g., "ship safely")
- Find the minimal analog at your scale (e.g., pre-commit hook instead of full
  CI)
- Preserve the decision point, not the implementation complexity

**Domain translation (research lab → product development):**

- Research patterns optimize for rigor and replicability; product patterns
  optimize for speed and iteration
- Solo creator sits in between: borrow the rigor heuristics, not the publication
  timelines
- Ask: "Does this pattern optimize for something I need to optimize for?"

---

## 8. Gaps Identified

1. **No direct research on solo creator scouting phase governance.** The
   literature on research governance is predominantly academic (IRB, grounded
   theory) or enterprise (Stage-Gate). The solo creator domain has minimal
   formal treatment. The recommendations here extrapolate from first principles
   rather than domain-specific evidence.

2. **Confirmation bias detection is self-assessed.** No external mechanism was
   found for a solo researcher to detect their own confirmation bias during
   scouting. The "disconfirmation pass" recommendation is a mitigation, not a
   solution. This gap remains.

3. **Translation failure Mode 2 (essence loss during adaptation) lacks a
   concrete detection test.** The literature identifies this failure mode but
   offers no crisp heuristic for catching it during adaptation. The best
   available proxy is: "ask what the pattern is FOR before modifying it."

4. **The AAER sustainability test is from development economics context.** Its
   applicability to individual developer workflow adoption is inferred, not
   empirically studied. The "if you left now" framing requires minor cognitive
   translation for the solo context.

5. **Feynman Test is vulnerable to Dunning-Kruger effect.** A researcher with
   high unconscious incompetence may pass the Feynman test falsely. No
   cross-validation mechanism was found for solo researchers. The triangulation
   requirement partially addresses this but does not eliminate the risk.

6. **Convergence threshold for triangulation is not precisely defined.** The
   literature says 3+ independent sources, but "independent" is qualitative. Two
   sources from the same ecosystem (e.g., two Y Combinator founders) may not
   constitute true independence. This requires contextual judgment.

---

## 9. Source List with Trust Tiers

| #   | URL                                                                                             | Title                                                                                       | Type                       | Trust       | CRAAP Score | Date             |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------- | ----------- | ----------- | ---------------- |
| 1   | https://pmc.ncbi.nlm.nih.gov/articles/PMC5993836/                                               | Saturation in qualitative research: exploring its conceptualization and operationalization  | Peer-reviewed academic     | HIGH        | 4.4         | 2018             |
| 2   | https://pmc.ncbi.nlm.nih.gov/articles/PMC7200005/                                               | A simple method to assess and report thematic saturation in qualitative research (PLOS ONE) | Peer-reviewed academic     | HIGH        | 4.6         | 2020             |
| 3   | https://atlasti.com/research-hub/confirmation-bias                                              | Confirmation Bias in Research — ATLAS.ti                                                    | Official docs/education    | MEDIUM-HIGH | 4.0         | 2024             |
| 4   | https://link.springer.com/article/10.1007/s11135-017-0574-8                                     | Saturation in qualitative research — Springer                                               | Peer-reviewed academic     | HIGH        | 4.5         | 2018             |
| 5   | https://fs.blog/chestertons-fence/                                                              | Chesterton's Fence: A Lesson in Thinking — Farnam Street                                    | Education/community        | MEDIUM-HIGH | 4.2         | 2020             |
| 6   | https://stevemcconnell.com/articles/cargo-cult-software-engineering/                            | Cargo Cult Software Engineering — Steve McConnell                                           | Expert practitioner        | MEDIUM-HIGH | 4.1         | 1999 (evergreen) |
| 7   | https://en.wikipedia.org/wiki/Diffusion_of_innovations                                          | Diffusion of Innovations — Wikipedia                                                        | Secondary reference        | MEDIUM      | 3.8         | 2024             |
| 8   | https://www.stage-gate.com/blog/the-stage-gate-model-an-overview/                               | The Stage-Gate Model — Stage-Gate International                                             | Official practitioner docs | MEDIUM-HIGH | 4.0         | 2024             |
| 9   | https://fs.blog/feynman-technique/                                                              | The Feynman Technique — Farnam Street                                                       | Education/community        | MEDIUM-HIGH | 4.1         | 2023             |
| 10  | https://e-student.org/feynman-technique/                                                        | Feynman Technique: A Complete Beginner's Guide                                              | Community/education        | MEDIUM      | 3.6         | 2024             |
| 11  | https://en.wikipedia.org/wiki/Not_invented_here                                                 | Not Invented Here — Wikipedia                                                               | Secondary reference        | MEDIUM      | 3.7         | 2024             |
| 12  | https://www.simplypsychology.org/what-is-triangulation-in-qualitative-research.html             | What Is Triangulation In Qualitative Research — Simply Psychology                           | Education/community        | MEDIUM      | 3.8         | 2024             |
| 13  | https://en.wikipedia.org/wiki/Satisficing                                                       | Satisficing — Wikipedia                                                                     | Secondary reference        | MEDIUM      | 3.7         | 2024             |
| 14  | https://shavinpeiries.com/how-to-break-free-from-the-infinite-research-loop/                    | How to break free from the infinite research loop                                           | Community/practitioner     | LOW-MEDIUM  | 3.2         | 2024             |
| 15  | https://medium.com/@Elmahedi.mahalal/how-to-avoid-the-rabbit-hole-trap-in-research-47360e3e8616 | How to Avoid the Rabbit Hole Trap in Research — Medium                                      | Community/practitioner     | LOW-MEDIUM  | 3.1         | 2026             |
| 16  | https://adr.github.io/                                                                          | Architecture Decision Records (ADRs)                                                        | Official project docs      | HIGH        | 4.3         | 2024             |
| 17  | https://practicalaction.org/learning/pmsd-toolkit/tools/aaer/                                   | AAER Framework — Practical Action                                                           | NGO practitioner docs      | MEDIUM      | 3.6         | 2022             |

---

## Contradictions

**Contradiction 1: Hard stopping vs. qualitative stopping** Some sources
(analysis paralysis literature) recommend time-boxing as the primary stopping
tool. The theoretical saturation literature explicitly rejects quantitative
stopping criteria as theoretically unsound. For SoNash's "no artificial caps"
principle, the saturation-based approach is correct — but this creates a risk
that without external accountability, the qualitative criteria can be
indefinitely deferred. The SCOUT-DECISION artifact requirement mitigates this by
making the stopping signal concrete (can you write the document or not?), not
merely self-assessed.

**Contradiction 2: Satisficing vs. thorough investigation** Simon's satisficing
says stop when the aspiration level is met. The cargo cult / Chesterton
literature says you must thoroughly understand context before deciding. These
can conflict: the satisficing threshold may be met before Chesterton's Gate is
passed. Resolution: the aspiration level for scouting must explicitly include
"can explain context requirements" as a component, not just "have observed N
patterns."

---

## Serendipity

1. **ADR "Accepted/Rejected" lifecycle as a scouting completion artifact** was
   not anticipated as a research target but emerged as one of the strongest
   governance mechanisms found. The requirement to produce a structured decision
   document with explicit status is both a stopping signal and an anti-drift
   mechanism.

2. **The AAER sustainability test** ("if you left now, would the change
   continue?") provides a novel translation filter specifically suited to solo
   devs inheriting patterns from team contexts. This was not in the original
   research frame but directly answers the scale-translation problem.

3. **The ≤5% new-information threshold from Hennig et al.** (PLOS ONE 2020)
   provides the most concrete, actionable saturation metric found. It transforms
   a subjective ("I feel saturated") into an auditable calculation. The formula
   (new concepts in run / base concepts) is directly applicable to concept map
   tracking during scouting.

---

## Confidence Assessment

- HIGH claims: 8 (Findings 1, 2, 3, 5, 6, 7, 8, 10, 13)
- MEDIUM-HIGH claims: 4 (Findings 4, 9, 14)
- MEDIUM claims: 3 (Findings 11, 12, 15)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

The core governance architecture (saturation monitoring + Chesterton Gate + ADR
artifact requirement + Rogers evaluation) is supported by HIGH-confidence
findings from multiple independent academic and practitioner sources. The solo
creator translation layer is MEDIUM-HIGH due to limited domain-specific
literature.
