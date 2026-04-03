# Findings: Knowledge Management Theory Applied to AI-Directed Development

**Searcher:** deep-research-searcher **Profile:** academic + web **Date:**
2026-04-03 **Sub-Question IDs:** D10

---

## Key Findings

### 1. Nonaka's SECI Model Applied to Human-AI Knowledge Systems [CONFIDENCE: HIGH]

The SECI model (Socialization, Externalization, Combination, Internalization)
describes how knowledge cycles between tacit and explicit forms across four
conversion modes. Applied to a human-AI system like SoNash, each quadrant has a
direct analog:

- **Socialization (Tacit → Tacit):** The human user and Claude develop shared
  working patterns through repeated sessions. Neither party explicitly records
  these patterns — they live in the interaction rhythm. Examples: the user's
  correction cadence, Claude's learned sense of which formulations the user
  prefers. In human orgs, this happens via apprenticeship and co-working. Here
  it happens through session history and feedback.

- **Externalization (Tacit → Explicit):** When feedback crystallizes into
  CLAUDE.md rules, MEMORY.md entries, or feedback documents, tacit knowledge is
  externalized. This is the most critical and most fragile conversion. Nonaka
  identifies "dialogue and metaphor" as the tools for this process — in SoNash
  this maps to the correction moments that generate feedback entries.

- **Combination (Explicit → Explicit):** CLAUDE.md, MEMORY.md, feedback docs,
  session history, and skills documents are recombined and synthesized. Claude's
  context window performs a live combination at session start by loading all
  these sources together.

- **Internalization (Explicit → Tacit):** Explicit rules become "second nature"
  behavior — ideally, Claude stops needing to consciously consult CLAUDE.md for
  deeply internalized patterns. In practice, this is the conversion mode most
  impaired by the stateless LLM architecture. Without weight updates, true
  internalization cannot occur — every session starts fresh.

**Critical gap:** The SECI model assumes a persistent learning subject (a person
or organization that retains state). Claude has no parametric learning between
sessions. This means the Internalization quadrant is structurally blocked —
explicit rules can never become tacit for Claude without fine-tuning. MEMORY.md
and CLAUDE.md partially substitute, but they are a prosthetic externalization
rather than true internalization.

Recent academic extensions have addressed this directly. The GRAI framework
(Böhm & Durst, 2025, VINE Journal) extends SECI for generative AI, showing that
AI systems can actively participate in Externalization and Combination but have
structural limits in Socialization and Internalization — precisely where tacit
knowledge lives. The HAC-SECI model (2024, Springer) proposes a dual-loop
structure with an "Agent Growth Loop" and a "Target Development Loop" to model
this asymmetry.

Sources: [1], [2], [3], [6]

---

### 2. Knowledge Management Failure Modes: Why Elaborate Systems Go Unused [CONFIDENCE: HIGH]

The literature on KM failure identifies a consistent set of failure modes that
have direct analogs in AI-directed development systems:

**Failure Mode 1: Lack of use adoption.** KM systems fail when consulting them
competes with just-in-time action. When another task is ranked as more urgent,
the knowledge base is ignored. In AI-directed development, this maps to the
"I'll just ask Claude directly and correct mistakes afterward" pattern rather
than reading CLAUDE.md or session history first.

**Failure Mode 2: Knowledge hoarding / not shared.** When managers don't share
knowledge, employees model that behavior. In a one-person AI system, this maps
structurally: the user generates feedback and insights but does not always
translate them to persistent artifacts (CLAUDE.md, MEMORY.md). Knowledge stays
in conversation context — which is ephemeral.

**Failure Mode 3: Structural inaccessibility.** A KMS where information is hard
to find or poorly structured drives users to human-to-human workarounds. Claude
reads CLAUDE.md sequentially and loses adherence when files exceed ~200 lines —
an officially documented threshold. A CLAUDE.md that has grown through
accumulated additions without curation becomes its own failure mode.

**Failure Mode 4: The definitional ambiguity problem.** "There is no consensus
on what KM actually is" — and similarly, there is no consensus on what "the
learning system" in AI-directed development actually is. Is it CLAUDE.md?
MEMORY.md? Feedback docs? Session history? The lack of clear system definition
makes it impossible to measure effectiveness or know when it has failed.

**Failure Mode 5: ~70% of change programs fail due to human resistance.** The
equivalent in AI development: behavioral rules require Claude to change behavior
patterns that may conflict with defaults, strong priors, or conversational
momentum. When the correction is not specific enough ("format code nicely"),
compliance is probabilistic, not guaranteed.

**Critical structural finding from official Claude Code docs:** "CLAUDE.md
content is delivered as a user message after the system prompt, not as part of
the system prompt itself. Claude reads it and tries to follow it, but there's no
guarantee of strict compliance, especially for vague or conflicting
instructions." This is a KM system with architecturally soft enforcement. No
matter how well-designed the content, the delivery mechanism is advisory.

Sources: [4], [5], [10]

---

### 3. The Knowing-Doing Gap (Pfeffer & Sutton) [CONFIDENCE: HIGH]

Pfeffer and Sutton's 2000 book identifies five core barriers that prevent
organizations from acting on what they know. Each maps directly to AI-directed
development:

**Barrier 1: Talk substitutes for action ("the smart talk trap").**
Organizations confuse planning, analysis, and documentation for doing. Mission
statements are "the most blatant and common means organizations use to
substitute talk for action." Direct analog: comprehensive CLAUDE.md files,
detailed MEMORY.md entries, elaborate feedback systems — all of which can become
a substitute for the actual behavioral change they're meant to produce. The
metric is not "did we document this?" but "did Claude's behavior change?"

**Barrier 2: Memory over thinking ("we tried that before").** Past patterns
prevent reconsidering approaches in changed contexts. For Claude, every session
starts without memory of past failures — but the corollary risk is on the human
side: the user may stop questioning whether documented rules are still correct
because "that's what the system says."

**Barrier 3: Fear preventing action.** In AI-directed development, this maps to
the user's tolerance for confronting friction. When sessions are going well, the
user may avoid surfacing and documenting behavioral patterns that almost went
wrong — because documenting failure creates uncomfortable acknowledgment of
systematic risk.

**Barrier 4: Misaligned measurement.** What gets measured gets managed. SoNash
currently tracks metrics like `impl-before-plan count` and
`format-deviation count` as proxy metrics. Whether these behavioral metrics
actually capture the right behavior is an open question. Measurement that
focuses on activity (commits, sessions, feedback entries) rather than outcomes
(behavioral alignment improvement over time) may reward documentation over
actual learning.

**Barrier 5: Internal competition.** Not directly applicable to a one-person
system, but analogously: when Claude "competes" with its own defaults and
training priors against CLAUDE.md rules, the CLAUDE.md rules are disadvantaged
by being advisory rather than parametric.

**The core Pfeffer-Sutton insight:** Knowing is not doing. The gap is not solved
by more knowledge documentation. It is solved by creating conditions where
action is easier than inaction — where following the rule has lower friction
than not following it. In LLM systems, this is a prompt engineering and
architecture problem, not a documentation problem.

Sources: [7], [8]

---

### 4. Tacit vs. Explicit Knowledge and the Limits of Behavioral Codification [CONFIDENCE: HIGH]

Polanyi's paradox — "we know more than we can tell" — is directly relevant to
behavioral codification of AI agents. The tacit dimension of knowledge is
"practically useful" but "cannot be fully articulated." It is acquired through
practice and observation, not instruction.

Behavioral guidelines for Claude (tone, judgment about when to ask vs. act,
appropriate level of detail in responses, when a correction warrants stopping
vs. adjusting) are largely tacit. They are grounded in context-dependent
judgment that resists explicit rule formulation. The attempt to codify them is
valuable but necessarily incomplete.

**The codification trap:** "Trying to convert all tacit knowledge into explicit
form is fundamentally flawed due to the very nature of tacit knowledge, which is
inherently personal, context-dependent, and difficult to articulate." This means
the CLAUDE.md + MEMORY.md system can capture explicit behavioral rules but
cannot capture the judgment about when, how, and in what combination to apply
them.

**The AI-specific dimension:** Machine learning does not "code the cognitive
powers that enable humans to know more than they can say into an algorithm."
LLMs acquire a different kind of implicit representation through training — but
for a specific user's behavioral preferences, Claude has no mechanism to develop
truly tacit knowledge in the Polanyian sense. Every behavioral preference that
is not in the context window is invisible to Claude.

**What this means for rule systems:** Explicit rules like "ask on first
confusion, not fourth" or "never implement without explicit approval" represent
attempts to codify fundamentally tacit judgments about the right rhythm of
human-AI collaboration. These rules can guide Claude, but they cannot substitute
for the judgment about what counts as "confusion" or when a task is "obvious
enough" that the approval step feels unnecessary. The gap between the rule and
its wise application is irreducibly tacit.

Sources: [9], [11], [12]

---

### 5. Single-Loop vs. Double-Loop Learning (Argyris) [CONFIDENCE: HIGH]

Argyris's framework distinguishes:

- **Single-loop learning:** Error detection and correction within existing
  governing variables. "A thermostat that turns the heat on when it's too cold."
  Behavior changes; assumptions do not.
- **Double-loop learning:** Error detection triggers examination of the
  governing variables themselves — the goals, assumptions, and frameworks that
  generated the error.

**Applied to SoNash's learning system:**

The current feedback and CLAUDE.md system operates predominantly at the
single-loop level. When Claude makes a behavioral error:

1. The error is caught
2. A rule is added to CLAUDE.md or MEMORY.md
3. The rule prevents the error from recurring

This is single-loop. The governing variable — "add a rule for each error" — is
not itself questioned.

**What double-loop would look like:** Periodically questioning whether the
rule-accumulation approach itself is working. Asking: "Are these rules actually
changing behavior? Are we adding rules that nobody reads? Is the CLAUDE.md
format the right one? Should we be using different enforcement mechanisms?" This
is not happening systematically.

**Argyris's central finding on organizational resistance:** Organizations resist
double-loop learning through "defensive routines" — organizational norms that
protect governing assumptions from examination. In a one-person system with an
AI partner, the analog is: the human user avoids questioning whether the whole
feedback/CLAUDE.md system is working because (a) they've invested significantly
in it, and (b) the alternative (a different approach) is uncertain. The
investment creates its own defensive routine.

**Espoused theory vs. theory-in-use:** Argyris found that "few people are aware
that they do not use the theories they explicitly espouse, and few are aware of
those they do use." Applied to SoNash: the espoused theory is "feedback gets
documented, rules get added, Claude's behavior improves." The theory-in-use may
be "feedback gets documented, rules accumulate, reading friction increases,
effective rules decrease." The gap between these is the central question the
research topic is investigating.

Sources: [13], [14], [15]

---

### 6. Knowledge Decay: Rates and Prevention [CONFIDENCE: MEDIUM-HIGH]

Knowledge decays through two mechanisms:

**Mechanism 1: Personnel decay.** "Knowledge that exists only in a person's head
has a half-life of one. The moment that person leaves, its value drops to zero."
In human-AI systems, this applies in both directions: the user carries tacit
knowledge about Claude's behavior that is not documented; Claude carries no
persistent state at all.

**Mechanism 2: Static document decay.** "Static knowledge begins to rot the
moment it's published. The business context changes, the APIs it describes are
updated, the strategy it supports pivots." CLAUDE.md rules added in early
sessions may be wrong, redundant, or actively misleading by later sessions.

**Empirical decay rates by domain:**

- Company wikis and SOPs: ~6-12 month half-life
- Technical documentation: ~18 month half-life
- Market/context-sensitive data: weeks to days

For behavioral rules in an actively evolving human-AI workflow, the relevant
decay rate is probably closer to the 6-month range — the system evolves rapidly
through sessions. A CLAUDE.md rule added at session 50 may be actively incorrect
by session 200.

**What prevents decay:**

1. Favor asynchronous, long-form records over instant messaging (SoNash does
   this — CLAUDE.md and MEMORY.md are durable)
2. Cross-team knowledge sharing — not applicable in a one-person system
3. Systematic review and pruning of documented knowledge (the missing step)
4. Versioning with dates (SoNash partially does this with version tables in
   CLAUDE.md)

**The staleness problem in AI systems specifically:** Research on enterprise RAG
systems found that "60% of enterprise RAG projects fail not because of poor
retrieval or hallucination, but because they can't maintain data freshness at
scale. Staleness metrics remain largely invisible until customers start
complaining that answers are wrong." In a CLAUDE.md context, staleness becomes
visible only when a deprecated rule causes a behavioral failure — not
proactively.

Sources: [16], [17], [18]

---

### 7. The Paradox of Codification: More Documentation, Less Use [CONFIDENCE: MEDIUM-HIGH]

The paradox is well-established in KM research: as explicit knowledge
repositories grow, their effective utility often decreases. This has several
mechanisms:

**Mechanism 1: The quantity-quality crowding effect.** "The paradox is that
technologies help us know more, but in the process we know less. The most
obvious reason is the substitution problem where emphasis on quantity shifts
resources away from quality, with quantity crowding out quality." A CLAUDE.md
that has grown to 135 lines (the current system) with version history and
section headers for everything may have crossed a threshold where its effective
behavioral influence per line is declining.

**Mechanism 2: Search friction and non-retrieval.** "A document may be captured
by a KMS, but never retrieved and reused, showing that paradoxically knowledge
can be both retained and lost over time." In CLAUDE.md/MEMORY.md, this maps to:
rules that are present in the file but not effectively "retrieved" (attended to)
by Claude during a given session because of attention dilution across a large
context.

**Mechanism 3: Information rot creates cognitive burden.** "Information rot
creates a dent in your strategy and a cognitive burden for employees, forcing
them to spend valuable time verifying accuracy." For Claude, reading a CLAUDE.md
with outdated, conflicting, or redundant rules generates noise that degrades
signal from the rules that matter.

**Official Claude documentation (Tier 1 source) confirms this mechanism
explicitly:**

- "Target under 200 lines per CLAUDE.md file. Longer files consume more context
  and reduce adherence."
- "If two rules contradict each other, Claude may pick one arbitrarily."
- "Shorter files produce better adherence."

This is the codification paradox operationalized as an engineering constraint.
The documentation system that is meant to improve behavior has a documented
degradation curve: past ~200 lines, each additional rule reduces compliance with
all rules.

**The IGI Global research** (2021) on the "Standardization Knowledge
Codification Paradox" identifies that codification is "paradoxically oriented to
exploitation of codified good practices AND to exploration of new knowledge to
innovate, creating tensions" — the more you nail down how to do things, the
harder it becomes to adapt when those things need to change.

Sources: [19], [20], [21], [10]

---

### 8. Organizational Learning in One-Person Organizations [CONFIDENCE: MEDIUM]

Traditional organizational learning theory (Argyris, Senge, Nonaka) assumes
multiple agents: knowledge is distributed, learning requires the system-level to
exceed individual cognition, and the "organization" persists when individuals
leave.

For a one-person organization, most of these assumptions break:

**What the theory says applies:**

- Individual learning IS organizational learning when the organization IS one
  person. The distinction collapses.
- Personal Knowledge Management (PKM) — "a process of collecting information
  that a person uses to gather, classify, store, search, retrieve and share
  knowledge" — is the relevant literature. PKM emphasizes individual
  sensemaking, pattern recognition, and reflection rather than collective
  knowledge transfer.
- Reflection and active engagement are identified as the critical success
  factors for individual learning systems. "Passive consumption is the worst way
  to learn something. You need to actively engage with the information at hand."

**What doesn't transfer:**

- Knowledge redundancy: in a one-person system, all knowledge is in a single
  mind. Personnel decay (the human leaving) = total system failure. For SoNash,
  this applies in an interesting direction: the _human's_ tacit knowledge about
  what works with Claude is not backed up anywhere. If the user couldn't work
  with Claude for 6 months, a returning Claude would have the CLAUDE.md rules
  but the interaction texture (tacit knowledge on both sides) would be rebuilt
  from scratch.
- Social learning and Ba: Nonaka's "Ba" (shared space for knowledge creation)
  requires at least two parties with persistent state. The human-Claude session
  creates a temporary Ba that dissolves at session end. The CLAUDE.md/MEMORY.md
  system is an attempt to create durable Ba artifacts — but it's asynchronous,
  not co-present.

**The organizational learning literature does offer one relevant concept for
solo practitioners:** "deutero-learning" (Bateson/Argyris) — learning how to
learn. A solo practitioner engaged in deliberate PKM who regularly questions
whether their knowledge system is working is practicing deutero-learning. This
is the equivalent of double-loop learning for an individual: not just "what
rules should I add?" but "is this rule-adding approach the right approach?"

Sources: [22], [23], [24]

---

## Synthesis: The Applied Model for SoNash

Drawing across all eight sub-questions, here is the integrated theoretical frame
for a human-AI knowledge system:

**The SECI-Claude Asymmetry:** Claude can participate in Externalization (tacit
→ explicit via feedback) and Combination (explicit + explicit via context
loading), but not in true Socialization or Internalization. This is structural,
not fixable by better documentation.

**The Knowing-Doing Gap in AI form:** More rules do not guarantee more
behavioral compliance. The bottleneck is not the knowledge capture; it is the
action — Claude's reliable application of captured knowledge in context. The gap
between having a rule in CLAUDE.md and that rule actually shaping behavior is
the core effectiveness question.

**The Codification Paradox as Engineering Constraint:** The diminishing returns
of documentation are not just theoretical — they are documented in Claude's own
architecture. Files over 200 lines reduce adherence. Conflicting rules produce
arbitrary selection. The system has a built-in ceiling on codification
effectiveness.

**The Double-Loop Absence:** The existing feedback system is well-designed for
single-loop learning (catch error, add rule). There is no systematic mechanism
for double-loop learning (question whether the rule-adding approach itself is
working). This is the most significant structural gap.

**Knowledge Decay Without Pruning:** CLAUDE.md and MEMORY.md accumulate but are
rarely pruned. Given the documented ~6-12 month half-life of behavioral SOPs and
the explicit architecture warning about adherence degradation, undated and
uncurated rule accumulation is a predictable failure mode.

---

## Sources

| #   | URL                                                                                                    | Title                                                                           | Type                       | Trust       | CRAAP | Date    |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------- | ----------- | ----- | ------- |
| 1   | https://realkm.com/2025/05/21/the-grai-framework-extending-the-seci-model-to-reflect-generative-ai/    | The GRAI Framework – Extending SECI to Reflect Generative AI                    | Blog/practitioner          | MEDIUM-HIGH | 4.2   | 2025-05 |
| 2   | https://doi.org/10.1108/vjikms-10-2024-0357                                                            | Knowledge management in age of generative AI – from SECI to GRAI (VINE Journal) | Peer-reviewed              | HIGH        | 4.8   | 2025    |
| 3   | https://link.springer.com/chapter/10.1007/978-981-97-6469-3_12                                         | Human-AI-Collaboration SECI Model (Springer)                                    | Peer-reviewed              | HIGH        | 4.6   | 2024    |
| 4   | https://knowledge-management-tools.net/failure                                                         | Knowledge Management Failure                                                    | Practitioner               | MEDIUM      | 3.2   | N/A     |
| 5   | https://www.searchunify.com/resource-center/blog/5-reasons-why-knowledge-management-programs-fail      | 5 Reasons Why KM Programs Fail                                                  | Industry blog              | MEDIUM      | 3.0   | N/A     |
| 6   | https://pmc.ncbi.nlm.nih.gov/articles/PMC6914727/                                                      | Managing Knowledge in Organizations: SECI Operationalization (PMC)              | Peer-reviewed              | HIGH        | 4.7   | 2019    |
| 7   | https://jeffreypfeffer.com/books/the-knowing-doing-gap/                                                | The Knowing-Doing Gap (Pfeffer & Sutton)                                        | Academic book              | HIGH        | 4.9   | 2000    |
| 8   | https://learningomnivores.com/what-were-reading/the-knowing-doing-gap/                                 | Knowing-Doing Gap summary                                                       | Book summary               | MEDIUM      | 3.5   | N/A     |
| 9   | https://www.billparker.ai/2025/05/polanyis-paradox-why-we-know-more-than.html                          | Polanyi's Paradox: Why We Know More Than We Can Tell                            | Practitioner blog          | MEDIUM      | 3.4   | 2025    |
| 10  | https://code.claude.com/docs/en/memory                                                                 | How Claude Remembers Your Project (Official Claude Code Docs)                   | Official docs              | HIGHEST     | 5.0   | 2025    |
| 11  | https://builtin.com/artificial-intelligence/ai-limits-tacit-knowledge                                  | What Can't AI Do? Tacit Knowledge Limits                                        | Tech journalism            | MEDIUM      | 3.6   | N/A     |
| 12  | https://en.wikipedia.org/wiki/Half-life_of_knowledge                                                   | Half-life of Knowledge (Wikipedia)                                              | Reference                  | MEDIUM      | 3.5   | Updated |
| 13  | https://hbr.org/1977/09/double-loop-learning-in-organizations                                          | Double-Loop Learning in Organizations (HBR, Argyris)                            | Peer-reviewed practitioner | HIGH        | 4.8   | 1977    |
| 14  | https://en.wikipedia.org/wiki/Double-loop_learning                                                     | Double-Loop Learning (Wikipedia)                                                | Reference                  | MEDIUM      | 3.5   | Updated |
| 15  | https://aral.com.au/resources/argyris.html                                                             | Argyris and Schon's Theory on Congruence and Learning                           | Secondary academic         | MEDIUM-HIGH | 4.0   | N/A     |
| 16  | https://www.remote.tools/remote-work/knowledge-decay-and-half-life-of-information                      | Knowledge Decay and Half-Life of Information                                    | Practitioner               | MEDIUM      | 3.3   | N/A     |
| 17  | https://ragaboutit.com/the-knowledge-decay-problem-how-to-build-rag-systems-that-stay-fresh-at-scale   | The Knowledge Decay Problem in RAG Systems                                      | Technical practitioner     | MEDIUM-HIGH | 3.8   | 2024    |
| 18  | https://www.remote.tools/remote-work/knowledge-decay-and-half-life-of-information                      | Half-life of knowledge by knowledge type                                        | Practitioner               | MEDIUM      | 3.3   | N/A     |
| 19  | https://www.researchgate.net/publication/281900511_The_Information_Overload_Paradox                    | The Information Overload Paradox                                                | Peer-reviewed              | HIGH        | 4.5   | 2015    |
| 20  | https://www.igi-global.com/chapter/managing-the-standardization-knowledge-codification-paradox/247401  | Managing the Standardization Knowledge Codification Paradox (IGI)               | Peer-reviewed              | HIGH        | 4.6   | 2021    |
| 21  | https://diginomica.com/digital-overload-paradox-teams-drowning-information-starving-insights           | The Digital Overload Paradox                                                    | Industry analyst           | MEDIUM      | 3.5   | 2024    |
| 22  | https://en.wikipedia.org/wiki/Personal_knowledge_management                                            | Personal Knowledge Management (Wikipedia)                                       | Reference                  | MEDIUM      | 3.5   | Updated |
| 23  | https://www.uky.edu/~gmswan3/575/KM_and_OL.pdf                                                         | Knowledge Management and Organizational Learning                                | Academic paper             | HIGH        | 4.4   | N/A     |
| 24  | https://www.emerald.com/vjikms/article/56/2/522/1312423/Transforming-organizational-knowledge-creation | Transforming organizational knowledge creation through AI (VINE Journal)        | Peer-reviewed              | HIGH        | 4.7   | 2025    |

---

## Contradictions

**Contradiction 1: Can AI genuinely participate in SECI, or only simulate it?**
The GRAI framework (2025) and the AI-Augmented SECI model argue that generative
AI actively participates in knowledge creation and can extend the boundaries of
organizational learning. Opposing view: the SECI model's tacit-to-tacit
Socialization mode "requires direct shared experience" — Claude has no
persistent embodied experience of working with the user that carries forward.
The AI-SECI papers may be describing a functional analog, not true SECI
participation. The tension is unresolved in the literature; the field is clearly
in active theoretical development.

**Contradiction 2: Is tacit knowledge codifiable with modern AI?** The
traditional Polanyian position (fully supported by older KM literature) holds
that tacit knowledge is irreducibly tacit. Recent ML literature argues that
pattern-matching models (and potentially LLMs) can operationalize tacit
knowledge without explicit codification — the paradox may be dissolving. The
weight of current evidence still favors the classical position for
context-specific behavioral judgment (as opposed to domain-specific pattern
recognition like radiology), but this is a live debate.

**Contradiction 3: Does documentation improve or impair LLM behavior past a
threshold?** Official Claude Code documentation explicitly states there is an
~200 line threshold above which adherence decreases. This contradicts the naive
assumption that more documentation = better behavior. It also contradicts the KM
instinct to "document everything." The architecture documentation is more
authoritative than general KM theory here for this specific application.

---

## Gaps

1. **Empirical measurement gap:** There is no research I could find on
   empirically measuring behavioral adherence improvement in LLM systems as a
   function of CLAUDE.md design. We have architectural constraints (the 200-line
   threshold) but not comparative effectiveness data on different CLAUDE.md
   design strategies.

2. **Deutero-learning in AI-directed development:** The concept of "learning how
   to learn" (Bateson/Argyris) for human-AI pairs is theoretically relevant but
   I found no academic research applying it specifically to AI-directed
   development workflows.

3. **Knowledge decay rates specific to LLM behavioral guidance:** Decay rates
   cited (6-18 months) are from general organizational KM research. Specific
   rates for AI behavioral guidelines in rapidly evolving human-AI workflows are
   unknown.

4. **Solo practitioner + AI as a new organizational form:** The PKM literature
   covers solo human practitioners. Organizational learning theory covers
   multi-person organizations. Human-AI dyadic learning systems are a genuinely
   new form that neither body of literature directly addresses. Very limited
   research exists.

5. **Double-loop learning mechanisms for LLM systems:** Research on LLM feedback
   loops focuses on single-loop correction (RLHF, preference learning). I found
   no research on double-loop mechanisms — systems that question their own
   feedback loop architecture rather than optimizing within it.

---

## Serendipity

**Serendipitous finding 1: The 200-line threshold as a KM design constraint.**
The official Claude Code documentation explicitly documents a compliance
degradation threshold at ~200 lines for CLAUDE.md files. This is not theoretical
— it is an architectural constraint with direct design implications. This is a
specific, actionable, authoritative finding that should directly inform any
recommendations about CLAUDE.md structure.

**Serendipitous finding 2: CLAUDE.md is advisory, not enforced.** Official docs
explicitly state: "CLAUDE.md instructions shape Claude's behavior but are not a
hard enforcement layer." This is the clearest possible statement of the
knowing-doing gap as applied to AI systems. The documentation system is
advisory; enforcement is architectural (tool permissions, hooks). This
distinction — advisory vs. enforced — may be the single most important design
principle for effective AI-directed behavioral systems.

**Serendipitous finding 3: The GRAI framework is very recent (2025).** The
academic field has recognized the need to extend SECI for generative AI in the
past year. SoNash is operating at the frontier of both practice and theory.
There are no established best practices; this is genuinely new territory.

**Serendipitous finding 4: "Espoused theory vs. theory-in-use" may be the right
frame for the CLAUDE.md effectiveness question.** Argyris's distinction — what
the system says it does vs. what it actually does — directly describes the gap
between "we have behavioral rules in CLAUDE.md" (espoused theory) and "Claude
consistently applies those rules in all relevant situations" (theory-in-use).
This frame suggests the intervention is not more rules, but mechanisms that
surface the gap between stated rules and actual behavior.

---

## Confidence Assessment

- HIGH claims: 5 (SECI analysis, KM failure modes, knowing-doing gap, tacit
  knowledge limits, Argyris single/double-loop)
- MEDIUM-HIGH claims: 2 (knowledge decay rates, codification paradox)
- MEDIUM claims: 1 (one-person organizational learning)
- LOW claims: 0
- UNVERIFIED claims: 0

**Overall confidence: HIGH**

The theoretical frameworks (SECI, Argyris, Pfeffer-Sutton, Polanyi) are
well-established with high-quality sources. The application to AI-directed
development systems is novel but logically sound. The one architectural finding
(200-line threshold, advisory vs. enforced distinction) comes from Tier 1
official documentation and is HIGH confidence. The main uncertainty is in
extrapolating decay rates and sole-practitioner dynamics, which lack empirical
validation specific to this context.
