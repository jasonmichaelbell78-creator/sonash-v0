# Outside the Box: What 10 Research Agents Missed

<!-- prettier-ignore-start -->
| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Status       | COMPLETE                                                       |
| Last Updated | 2026-03-20                                                     |
| Dimension    | Blind spots, absent categories, lateral thinking, unique value |
<!-- prettier-ignore-end -->

## Executive Summary

The 10 completed research reports are thorough on the **AI engineering side** of
deep research: how agents orchestrate, how sources verify, how tokens cost, how
output formats work. They are collectively silent on the **human side**: what
happens in the researcher's head, what happens to research after delivery, and
what makes this system worth using over free alternatives.

**Top 5 blind spots, ranked by design impact:**

1. **The Human-in-the-Loop During Research** -- All reports treat the user as an
   input/output terminal (submit query, receive report). Nobody designed for
   mid-stream steering, knowledge injection, or collaborative sense-making
   during the research process itself.

2. **Research as Pedagogy** -- The system produces findings but never teaches.
   It tells you _what_ but not _how it knows_ or _how you should think about
   this domain_. Research that builds the user's understanding is fundamentally
   more valuable than research that just delivers facts.

3. **Serendipity and the Unexpected** -- Every proposed architecture is
   goal-directed (answer this question). None have a mechanism for surfacing
   unexpected, tangential, or counter-intuitive findings that might be more
   valuable than the answer to the original question.

4. **Research Afterlife: Living Documents and Decision Provenance** -- Research
   is treated as a one-shot deliverable. Nobody designed for updating stale
   findings, tracking which decisions were made based on which research, or
   detecting when the world has changed enough to invalidate prior conclusions.

5. **The Unique Value Proposition Question** -- The reports design a system that
   does what Perplexity/Gemini/OpenAI already do, just integrated into Claude
   Code. Integration alone is not a moat. What would make this system genuinely
   irreplaceable?

---

## Completely Absent Dimensions

### 1. Human-AI Collaborative Steering During Research

- **What it is:** The ability for the user to observe, redirect, inject domain
  knowledge, and co-steer research _while it is happening_ -- not just before
  (submit query) and after (read report). Think of a researcher watching a
  junior analyst work and saying "no, go deeper on that thread" or "you're
  missing the angle about X, try searching for Y."

- **Why it matters:** The 10 reports design a system where the user submits a
  query and waits 5-45 minutes for a report. This is the "fire and forget"
  pattern. But real research is iterative and conversational. The user often has
  domain knowledge the system lacks. Early findings frequently change what the
  user actually wants to know.

  OpenAI's Deep Research (2026 redesign) now allows mid-run redirection without
  restart or progress loss. Salesforce EDR calls this "steerable context
  engineering." The "Vibe Research" paradigm (coined by OpenAI's Jakub Pachocki
  and Mark Chen in 2026) defines co-research as humans setting direction and
  asking questions while AI handles execution. None of our 10 reports engage
  with this at design depth.

- **What to do about it:** Design explicit interaction hooks at phase
  transitions. After the initial breadth pass, show the user what was found and
  ask "which of these threads should I deepen?" After finding contradictions,
  ask "you may know things about this -- does your experience favor either
  side?" Allow the user to inject search terms, exclude irrelevant sources, or
  add their own findings mid-stream. The research plan should be a living
  document the user can edit at any point, not just approve at the start.

- **How critical:** Must-have. Without this, the system is a slower Perplexity
  that happens to run in the terminal.

### 2. Research as Pedagogy (Teaching, Not Just Telling)

- **What it is:** Research output that builds the user's mental model of a
  domain, not just reports facts. This means explaining _why_ things are the way
  they are, surfacing the conceptual structure of a domain, using analogies to
  connect new knowledge to existing knowledge, and identifying what the user
  would need to understand to evaluate the findings independently.

- **Why it matters:** A Harvard study (2025) found that AI usage is correlated
  with reduced critical thinking -- users accept answers without understanding
  them. A research system that only delivers conclusions without building
  comprehension creates learned helplessness. The user becomes dependent on the
  system rather than empowered by it.

  STORM (Stanford) is the closest existing system to this idea -- it simulates
  multi-perspective expert conversations that _explain_ while researching. But
  no report proposes incorporating this pedagogical dimension into our design.

  Consider: if the user researches "React Server Components vs Islands
  Architecture," the output should not just compare features -- it should teach
  the user enough about rendering paradigms that they could evaluate _future_
  architecture choices without another research query.

- **What to do about it:** Add a "mental model" section to deep research output.
  Include a "conceptual prerequisites" block that identifies what the user needs
  to understand first. Use analogies to connect unfamiliar concepts to familiar
  ones (the user's known stack is in the codebase, so the system can reference
  it). Optionally offer a "teach me" mode where the research output is
  structured as a learning progression rather than a reference document.

- **How critical:** Should-have. Differentiation opportunity and aligns with the
  project's stated vision of being "evidence-based."

### 3. Serendipity: Surfacing the Unexpected

- **What it is:** A mechanism for the research system to surface findings that
  are _outside the scope of the original question_ but potentially more valuable
  than the direct answer. The "I was looking for X and found Y" pattern.

- **Why it matters:** Some of the most valuable research discoveries are
  serendipitous. A 2025 paper (arxiv 2508.06569) introduces SciLink, a framework
  that operationalizes serendipity in materials research by creating automated
  links between experimental observations, novelty assessment, and theoretical
  simulations. The core insight: serendipity is not random -- it can be designed
  for.

  Goal-directed research has a structural blind spot: it only finds answers to
  questions it asks. If the deep-research skill decomposes "How should we handle
  auth?" into auth-related sub-questions, it will never discover that the auth
  library has a known supply-chain vulnerability -- that finding lives in a
  different question-space entirely.

  Every existing deep research system (Perplexity, Gemini, OpenAI, all
  open-source) is exclusively goal-directed. None have serendipity mechanisms.

- **What to do about it:** During the search phase, when an agent encounters
  information that is high-value but out-of-scope, it should flag it in a
  "serendipity register" rather than discarding it. The final report includes a
  "Unexpected Findings" section with items from the register. The threshold
  should be: "If I were the user and didn't know this, would I want to?" This is
  analogous to a doctor noticing an incidental finding on a scan -- the patient
  came in for one thing, but something else was found that matters.

- **How critical:** Should-have. Low implementation cost, high differentiation
  value. Nobody else does this.

### 4. Research Afterlife: Living Documents and Decision Provenance

- **What it is:** Two related concepts:

  **Living documents:** Research outputs that know they may become stale and can
  signal when they need updating. A medical living evidence synthesis project
  (JMIR, 2026) demonstrates this: continuously updated systematic reviews that
  incorporate new evidence as it appears, using AI tools for automated
  monitoring of new publications.

  **Decision provenance:** When a decision is made based on research, there
  should be a traceable chain: Decision -> Recommendation -> Finding -> Source.
  When the source changes, the entire chain can be re-evaluated.

- **Why it matters:** Research is treated as disposable in the current design.
  The reports describe producing a report and moving on. But research informs
  decisions that persist for months or years. If the research said "Firebase is
  more cost-effective than Supabase" and six months later Supabase changes
  pricing, the decision is now based on stale research -- but nobody knows.

  IBM identified "verifiable AI" as a top 2026 trend. The NIST Cyber AI Profile
  (December 2025) includes data provenance requirements. The trajectory is
  clear: traceability from decision back to evidence is becoming a regulatory
  expectation, not just a nice-to-have.

- **What to do about it:**
  - Tag each research finding with a "staleness date" based on domain
    (technology: 6 months, legal: 2 years, etc.).
  - Store a structured "decision log" linking decisions to the research findings
    that supported them.
  - Implement a lightweight monitor that can be run periodically (or as a
    `/stale-check` skill) to search for evidence that key findings have changed.
  - When research is consumed by a planning skill (deep-plan, gsd), the planning
    output should reference specific finding IDs, creating the provenance chain.

- **How critical:** Should-have for staleness detection, Nice-to-have for full
  decision provenance. But this is a genuine moat -- no existing tool does this.

### 5. Cognitive Load and Information Overwhelm

- **What it is:** Research can produce _too much_ information. The user needs
  not just a well-organized report but help _processing_ what they have
  received. This is the emotional and cognitive dimension of research.

- **Why it matters:** A 2026 Springer paper ("Overloaded minds and machines: a
  cognitive load framework for human-AI symbiosis") proposes a "bounded agent
  complementarity" model recognizing that both humans and AI have cognitive
  limits that must be managed jointly. A 2025 MDPI study found that high
  immersion in generative AI actually _intensifies_ cognitive strain rather than
  reducing it.

  The UX_OUTPUT_PATTERNS report covers progressive disclosure (three layers) but
  treats it as a formatting problem. The deeper issue is: how does the user
  process 30 pages of research findings, identify what matters for their
  decision, and not feel overwhelmed? Formatting alone does not solve this.

- **What to do about it:**
  - After delivering the report, offer a "walk me through it" mode where the
    system explains findings interactively, one section at a time.
  - Include a "decision-relevant summary" that explicitly says "if you need to
    decide X, the key trade-offs are A vs B."
  - For long reports, generate a "reading guide" that prioritizes sections by
    relevance to the user's likely next action.
  - Detect when a report is unusually long or complex and proactively offer to
    narrow the scope or produce a focused extract.

- **How critical:** Should-have. The difference between research that gets used
  and research that gets bookmarked and forgotten.

### 6. Research Ethics Beyond Privacy

- **What it is:** The SECURITY_PRIVACY report covers query leakage and data
  classification. But research ethics is a broader concern: citing sources
  fairly, not misrepresenting findings, handling controversial topics
  responsibly, avoiding amplification of misinformation, distinguishing between
  "no evidence" and "evidence of absence."

- **Why it matters:** An AI research system that confidently presents a
  one-sided view of a contested topic (climate policy, dietary science, software
  licensing debates) is not just inaccurate -- it is irresponsible. Legal AI
  research tools hallucinate 17-33% of the time (Wiley JELS, 2025). Stack
  Overflow's 2025 developer survey found 84% of developers use AI but 46% do not
  trust its output.

  The QUALITY_EVALUATION report covers objectivity as a dimension but focuses on
  source diversity metrics. Nobody addresses the deeper questions: Should the
  system refuse to produce a one-sided analysis? Should it flag when a topic is
  contested? Should it distinguish its own synthesis from verbatim source
  claims?

- **What to do about it:**
  - On contested topics, mandate a "perspectives" section presenting at least
    two viewpoints with their strongest arguments (steelman, not strawman -- the
    CONVERGENCE report mentions this but only for adversarial verification, not
    as a default output norm).
  - Clearly label AI-synthesized conclusions versus direct source claims.
  - When findings contradict the user's apparent expectations (detectable from
    the question framing), present the counter-intuitive finding with extra
    evidence and care -- do not suppress it.
  - Flag "absence of evidence" differently from "evidence of absence."

- **How critical:** Should-have. Trust depends on intellectual honesty.

### 7. Negative Research: What Doesn't Exist and What Failed

- **What it is:** Research that deliberately looks for what is _absent_: what
  has been tried and failed, what approaches nobody has taken, what gaps exist
  in the literature, what products used to exist but were discontinued.

- **Why it matters:** Goal-directed research finds what exists. But for
  decision-making, knowing what _doesn't_ exist is often more valuable. "No
  production-ready open-source alternative exists" is a critical finding. "Three
  startups tried this approach and all pivoted away" is a red flag. "This
  technique has no peer-reviewed validation" is decision-relevant.

  None of the 10 reports include negative research as a research strategy. The
  DOMAIN_AGNOSTIC_DESIGN report mentions "evidence of absence vs absence of
  evidence" once in the honest failure reporting section, but as an output
  format concern, not a research methodology.

- **What to do about it:** Add "negative questions" to the decomposition phase.
  For every "What is X?" sub-question, consider "What has been tried and failed
  for X?" and "What doesn't exist yet for X?" The STORM perspective-guided
  approach could incorporate a "skeptic perspective" that specifically looks for
  failure modes, abandoned approaches, and missing solutions.

- **How critical:** Should-have. This is how experienced researchers think and
  what distinguishes expert from novice research.

---

## Unconventional Approaches

### Socratic Research: Questions Over Answers

- **What it is:** Instead of finding answers, the system helps the user ask
  better _questions_. The output is not "here is what we found" but "here are
  the questions you should be asking, and here is why each matters."

- **How it differs from current thinking:** All 10 reports assume the user knows
  their question and the system finds the answer. But often the user does not
  know the right question. "Should we use Firebase?" is a surface question. The
  deeper questions are: "What are our scaling constraints?" "What compliance
  requirements apply?" "What is our team's operational capacity?" Socratic
  research uncovers these.

  A 2025 Frontiers study found that Socratic AI questioning enhances critical
  thinking comparably to human tutors. Georgia Tech's "Socratic Mind" platform
  (2026) is being piloted with 2,000 students. The approach is validated but
  nobody has applied it to research systems.

- **Potential value:** For the "clarification" phase (OpenAI's approach),
  instead of asking "do you want to narrow the scope?" the system could ask
  Socratic questions: "What decision will this research inform? What would
  change your mind? What do you already believe about this?"

### Research by Analogy

- **What it is:** Understanding a new domain by systematically mapping it to a
  domain the user already knows. If the user is a Firebase expert researching
  Supabase, the output is structured as: "X in Firebase maps to Y in Supabase.
  The key difference is Z."

- **How it differs from current thinking:** All reports produce domain-native
  output. They explain things in the domain's own terms. But humans learn by
  connecting new information to existing knowledge. The codebase's stack is
  known (Next.js, Firebase, Tailwind). Research about alternative technologies
  should be _explained in terms of_ the known stack, not in the abstract.

- **Potential value:** Dramatically faster comprehension for the user. Instead
  of learning a new domain from scratch, they map it onto their existing mental
  model. Implementation: the orchestrator checks the codebase/context for known
  technologies and instructs the synthesis agent to use analogies from those
  technologies.

### Stakeholder-Perspective Research

- **What it is:** Researching the same topic from multiple stakeholder
  viewpoints. "Should we adopt microservices?" looks very different to a
  developer (complexity), an ops engineer (deployment), a product manager
  (velocity), and a CFO (cost).

- **How it differs from current thinking:** STORM's perspective-guided
  decomposition is the closest existing approach, but it generates perspectives
  from _literature_, not from _stakeholder roles_. The literature perspective
  and the CTO perspective on the same topic can be radically different.

- **Potential value:** For decision-support research, automatically generating a
  section for each relevant stakeholder perspective prevents the "we only
  considered the engineering angle" blind spot. The system could infer relevant
  stakeholders from the question type and domain.

### Time-Travel Research: The Evolution of Understanding

- **What it is:** Researching how understanding of a topic has _changed_ over
  time. What did we believe 5 years ago that turned out to be wrong? What is the
  trajectory of thinking?

- **How it differs from current thinking:** The QUALITY*EVALUATION report covers
  recency as a quality dimension, but treats it as "newer is better."
  Time-travel research treats the \_evolution* of understanding as itself
  informative. Knowing that "the consensus on serverless cost has shifted three
  times in five years" is more useful than knowing the current consensus alone,
  because it tells you the current view may also shift.

  Consensus (the academic tool) has a "Results Timeline" showing how evidence
  evolved over time. No report proposes adapting this pattern.

- **Potential value:** For rapidly evolving domains (AI, cloud infrastructure),
  understanding the trajectory of opinion helps calibrate confidence in current
  findings. If everyone agreed 2 years ago and still agrees now, confidence is
  high. If the consensus flipped twice, confidence should be lower regardless of
  current source agreement.

### Research Through Building

- **What it is:** Sometimes the best way to understand something is to prototype
  it, not read about it. A research system integrated into a development
  environment (which Claude Code _is_) could answer "is this library suitable?"
  by actually installing it, running benchmarks, and testing edge cases -- not
  just reading blog posts about it.

- **How it differs from current thinking:** All 10 reports treat research as
  information retrieval and synthesis. But Claude Code can _execute code_.
  DeerFlow has a Docker sandbox for this purpose. OpenAI Deep Research includes
  a Python code interpreter. The INDUSTRY_LANDSCAPE report notes these features
  but no report proposes leveraging Claude Code's native execution capability
  for empirical research.

- **Potential value:** For technical research questions ("Is this library fast
  enough? Does this API behave as documented? Is there a memory leak?"),
  empirical testing produces higher-confidence findings than reading about other
  people's tests. The system already has Bash, file system access, and code
  execution. This is a unique advantage over Perplexity/Gemini that the design
  should exploit.

### Community Research: Tapping Expert Networks

- **What it is:** Researching not just published content but community
  knowledge: Stack Overflow answers with high vote counts, GitHub issue
  discussions, Discord/Slack community channels (via search), Reddit threads
  where practitioners share real-world experience.

- **How it differs from current thinking:** The DOMAIN_AGNOSTIC_DESIGN report's
  source authority maps rank community sources as Tier 4 (supplementary). But
  for practical technology questions, a highly-upvoted Stack Overflow answer
  from last month is often more valuable than an official doc page that was last
  updated two years ago. Community knowledge fills the gap between official
  documentation and real-world experience.

- **Potential value:** For the technology domain specifically, community sources
  capture battle-tested knowledge that no other source type does. The system
  should not just tolerate community sources but actively seek them for
  practical "how-to" and "gotcha" research.

---

## Borrowed Methodologies from Unexplored Fields

### Archaeology: Reconstruction from Fragments

- **Methodology:** Archaeologists reconstruct understanding from incomplete,
  damaged, decontextualized fragments. They never have the complete picture.
  Their core techniques: stratigraphic analysis (understanding layers of
  context), typological classification (categorizing fragments by type to infer
  patterns), and probabilistic reconstruction (generating multiple hypotheses
  about how fragments fit together).

  A 2025 paper proposes the "Digital Stratigraphy Framework" applying
  archaeological methodology to digital forensics, achieving 92.6% accuracy in
  evidence reconstruction.

- **Application to deep research:** When research sources are fragmentary
  (paywalled papers where only the abstract is visible, outdated docs, blog
  posts that reference but don't reproduce primary sources), the system should
  apply fragment-reconstruction methodology: infer the complete picture from
  available fragments, explicitly note where inference filled gaps, and generate
  multiple possible reconstructions when fragments are ambiguous.

### Detective Work / Forensics: Following Evidence Chains

- **Methodology:** Forensic investigation follows evidence chains: each piece of
  evidence suggests the next place to look. The investigation is adaptive and
  evidence-driven, not plan-driven. Detectives also practice "crime scene
  reconstruction" -- working backward from observed effects to infer causes.

- **Application to deep research:** For investigative research questions ("Why
  did X happen?" "What caused this regression?"), adopt an evidence-chain
  approach rather than the standard decompose-and-search pattern. Start with the
  observed effect, search for proximate causes, follow each cause upstream. The
  research plan emerges from the evidence, not from a priori decomposition. This
  is more effective than MECE decomposition for causal/diagnostic questions.

### Philosophy of Science: How Knowledge Is Constructed

- **Methodology:** Kuhn's paradigm shifts, Popper's falsificationism, Lakatos's
  research programs. The philosophy of science studies _how_ we know things, not
  just _what_ we know. Key concepts: paradigms shape what questions are askable,
  falsification is more informative than confirmation, and "normal science"
  fills in details while "revolutionary science" changes the framework.

- **Application to deep research:** When the research discovers conflicting
  information, consider whether the conflict represents normal scientific
  disagreement (same framework, different data) or a paradigm conflict
  (fundamentally different frameworks that define the question differently). The
  former can be resolved with more data. The latter requires presenting both
  frameworks and letting the user choose.

  Popper's falsificationism maps to the ACH approach already mentioned in the
  DOMAIN*AGNOSTIC_DESIGN report, but goes deeper: the system should actively
  seek \_disconfirming* evidence for its preliminary findings, not just
  confirming evidence from additional sources.

### Futures Studies / Strategic Foresight: Researching What Doesn't Exist Yet

- **Methodology:** Foresight practitioners use scenario planning, horizon
  scanning, and weak signal detection to research _possible futures_ rather than
  _current facts_. A 2025 OECD/WEF survey found 67% of foresight practitioners
  already use AI. Key technique: rather than asking "what is true?", ask "what
  could become true, and under what conditions?"

- **Application to deep research:** For predictive research questions ("What
  will happen if we choose X?"), the standard search-and-synthesize pattern is
  insufficient because the answer does not exist in any source. The system needs
  scenario generation: identify key uncertainties, construct 2-4 plausible
  scenarios for how those uncertainties resolve, and present each scenario with
  its evidence base and probability assessment. The AI:FAR (AI Futures and
  Responsibilities) initiative provides a framework for this.

### Patent Research: Systematic Prior Art Discovery

- **Methodology:** Patent researchers systematically search for _everything that
  has been done before_ in a given solution space. They use structured
  classification systems (IPC/CPC codes), citation chain analysis, and
  negative-space mapping (identifying what has NOT been patented, which
  indicates either that it is obvious or that nobody has tried it).

- **Application to deep research:** For technology evaluation research, adopt
  the patent researcher's exhaustiveness: not just "what solutions exist?" but
  "what has been attempted, filed, abandoned, or avoided?" This connects to the
  negative research approach described above. Patent databases (Google Patents,
  USPTO) are rarely included in deep research source strategies but contain
  signals about technology direction that no other source type captures (what
  companies are investing in, what approaches are being patented defensively).

### Design Thinking: Research as Part of the Design Process

- **Methodology:** In design thinking, research is not a phase that precedes
  design -- it is woven throughout. The key research methods are empathy mapping
  (understanding the user's perspective), "How Might We" framing (turning
  problems into research questions), and rapid prototyping as research (building
  to learn, not building to ship).

- **Application to deep research:** The "How Might We" reframing technique could
  transform research questions from closed ("What is the best auth library?") to
  generative ("How might we handle auth in a way that scales with our user base
  and doesn't require a dedicated security team?"). This reframing would produce
  more actionable research by widening the solution space.

---

## The "What If" List

Ten questions that challenge fundamental assumptions in the current design:

1. **What if the user is wrong about what they need to research?** The system
   accepts the query as given. What if the first step should be questioning
   whether the query addresses the user's actual problem?

2. **What if less research is better?** Every report assumes more sources, more
   verification, more depth = better. What if the highest-value output is a
   confident 3-sentence answer with one authoritative source? Is there a
   "minimum viable research" mode that knows when to stop immediately?

3. **What if the research should change the user's mind?** All reports treat the
   user's framing as the ground truth. What if the research discovers that the
   user's premise is wrong? How should the system present "your question is
   based on a misconception" without being dismissed?

4. **What if the system researched its own past failures?** After completing
   research, the system could check whether similar queries in the past produced
   findings that later turned out to be wrong. A meta-learning loop that
   improves research quality over time, not just per-session.

5. **What if research quality was measured by decisions made, not report
   quality?** The QUALITY_EVALUATION report proposes eight dimensions of
   quality. But the ultimate metric is: did the user make a better decision
   because of this research? All other metrics are proxies.

6. **What if multiple users could contribute to the same research?** The current
   design assumes a solo researcher. What if two developers are researching the
   same architecture question from different angles? Shared research workspaces
   with merged findings.

7. **What if the system admitted what it cannot research?** Not "honest failure"
   (the system tries and reports failure) but "upfront honesty" (the system
   recognizes before starting that a topic is outside its capability -- e.g.,
   proprietary pricing, NDA-protected information, topics requiring physical
   experimentation).

8. **What if the report format was wrong for the content?** The current design
   picks a format based on domain/depth. What if the system detected
   mid-research that the findings do not fit the planned format? "I planned a
   comparison table but the options are so different that a narrative comparison
   would be clearer."

9. **What if the greatest value was not the report but the bibliography?** For
   some research tasks, the curated list of high-quality sources is more
   valuable than the AI's synthesis of them. The user may want to read the
   sources themselves. A "curated bibliography with reading order" output mode.

10. **What if research created obligations?** If the system discovers a security
    vulnerability during research, does it have an obligation to flag it even if
    it is not what the user asked about? If it discovers that a dependency is
    deprecated, should it file a tech debt item? The research system intersects
    with the project's existing tech debt management system (TDMS) -- this
    integration is unexplored.

---

## The Unique Value Proposition Question

The 10 reports collectively design a system that replicates what Perplexity,
Gemini, and OpenAI already offer: decompose, search, verify, synthesize, cite.
The integration into Claude Code is convenient but not a moat. What would make
this system genuinely valuable beyond "it's integrated"?

### What Perplexity/Gemini/OpenAI Cannot Do

These services have no access to:

1. **The user's codebase.** They cannot research "should we refactor our auth
   module?" because they cannot read the auth module. Our system can research
   with full project context -- cross-referencing findings against the actual
   code, configuration, and architecture.

2. **The user's decision history.** Our system has access to SESSION_CONTEXT,
   ROADMAP, tech debt tracking, and prior research. It can say "you researched
   this 3 months ago and decided X -- here's what has changed since then."

3. **The user's project constraints.** Our system knows the stack versions, the
   security rules, the behavioral guardrails, the architecture patterns.
   Research is not generic -- it is filtered through "does this apply to _us_?"

4. **Code execution in the user's environment.** Perplexity cannot `npm install`
   a library and run benchmarks. Our system can. Empirical research in the
   user's actual environment produces higher-confidence findings than any amount
   of web research.

5. **Persistent project memory.** Perplexity forgets everything between
   sessions. Our system has cross-session memory, state files, and a knowledge
   graph. Research compounds over time.

6. **Downstream action.** Perplexity produces a report. Our system can produce a
   report AND create a plan AND implement the recommendation AND file tech debt
   items. Research-to-action in one flow.

### The Moat

The unique value proposition is not "deep research" -- it is **contextual
research that leads to action**. The system knows who you are, what you're
building, what you've decided before, and what you're constrained by. It can
research, recommend, and implement. No external tool can do this.

The design should lean heavily into this context advantage:

- Research prompts should include project context (stack, constraints, prior
  decisions) automatically.
- Findings should be evaluated against project-specific criteria ("does this
  library work with Next.js 16.2 and Firebase 12.10?").
- Recommendations should be actionable within the project ("to adopt X, you
  would need to change files Y and Z").
- Research should feed directly into the planning and implementation pipeline.

---

## Recommendations

Based on the above analysis, these additions to the deep-research skill design
would address the blind spots and create genuine differentiation:

### Must-Have (Address Before Design Finalization)

1. **Mid-stream steering hooks.** Design explicit user interaction points
   between research phases. The user can redirect, inject knowledge, narrow
   scope, or approve-and-continue. This is not optional -- without it, the
   system is a dumber, slower Perplexity.

2. **Project context injection.** Automatically include relevant project context
   (stack versions, architecture decisions, known constraints) in research
   prompts. This is the #1 differentiation lever.

3. **Code execution for empirical research.** For technology evaluation
   questions, allow the research system to install, benchmark, and test
   libraries in the user's actual environment. This produces findings no
   external tool can match.

### Should-Have (High Differentiation Value)

4. **Serendipity register.** Out-of-scope but high-value findings get flagged,
   not discarded. "Unexpected Findings" section in every report.

5. **Negative research in decomposition.** For every "What is X?" question,
   automatically generate "What has failed for X?" and "What doesn't exist for
   X?"

6. **Pedagogical output mode.** Option to structure research output as a
   learning progression rather than a reference document. Include mental models,
   analogies to known stack, and conceptual prerequisites.

7. **Research staleness detection.** Tag findings with domain-appropriate expiry
   dates. Provide a `/stale-check` mechanism to detect when prior research may
   need updating.

8. **Decision provenance.** When research feeds into planning, link decisions to
   specific findings. When findings change, flag affected decisions.

9. **Counter-intuitive finding presentation.** When findings contradict the
   question's implied expectations, present with extra evidence and explicit
   acknowledgment of the surprise.

### Nice-to-Have (Future Enhancement)

10. **Socratic pre-research questioning.** Before researching, help the user
    refine their question through Socratic dialogue.

11. **Stakeholder-perspective sections.** For decision-support research,
    auto-generate viewpoints from relevant stakeholder perspectives.

12. **Time-evolution analysis.** For rapidly-evolving topics, include a "how has
    thinking changed?" section.

13. **Research-to-TDMS integration.** When research discovers tech debt items
    (deprecated dependencies, security issues), automatically create DEBT
    entries.

14. **Curated bibliography mode.** Output focused on high-quality source
    curation with reading order rather than AI synthesis.

15. **Collaborative research.** Multiple sessions contributing to the same
    research topic with merged findings.

---

## Sources

### Human-AI Collaborative Research

- [Vibe Research 2026: The New Paradigm](https://www.notezapp.com/blog/vibe-research-2026)
- [Microsoft Research: Agentic AI Human-Agent Collaboration](https://www.microsoft.com/en-us/research/articles/agentic-ai-reimagining-future-human-agent-communication-and-collaboration/)
- [HHAI 2026: Hybrid Human-Artificial Intelligence Conference](https://hhai-conference.org/2026/)
- [Survey on Human-AI Collaboration with Large Foundation Models (arXiv)](https://arxiv.org/html/2403.04931v3)

### Socratic Method and AI

- [Resurrecting Socrates in the Age of AI (arXiv)](https://arxiv.org/pdf/2504.06294)
- [Socratic Wisdom vs ChatGPT in Critical Thinking (Frontiers)](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1528603/full)
- [Socratic Method-Enhanced ChatGPT for Blended Learning (SAGE)](https://journals.sagepub.com/doi/10.1177/07356331261429306)
- [Georgia Tech Socratic Mind AI Assessment Tool](https://lifetimelearning.gatech.edu/node/25)

### Serendipity in AI Research

- [Operationalizing Serendipity: SciLink Framework (arXiv 2508.06569)](https://arxiv.org/abs/2508.06569)
- [AI and Serendipity: When Machines Help Discover the Unexpected](https://aiworldjournal.com/ai-and-serendipity-when-machines-help-us-discover-the-unexpected/)
- [UNC Charlotte: Generative AI for Serendipity Recommendations](https://graduateschool.charlotte.edu/generative-ai-serendipity-recommendations/)

### Living Evidence and Research Decay

- [Living Evidence Synthesis Using AI (JMIR 2026)](https://www.jmir.org/2026/1/e76130)
- [IBM: AI Tech Trends 2026 (Verifiable AI)](https://www.ibm.com/think/news/ai-tech-trends-predictions-2026)

### Research Provenance and Traceability

- [Provenance and Traceability in AI (Techstrong.ai)](https://techstrong.ai/articles/provenance-and-traceability-in-ai-ensuring-accountability-and-trust/)
- [Data Provenance in AI (Data Foundation)](https://datafoundation.org/news/reports/697/697-Data-Provenance-in-AI)

### Cognitive Load and Information Overload

- [Overloaded Minds and Machines: Cognitive Load Framework (Springer 2026)](https://link.springer.com/article/10.1007/s10462-026-11510-z)
- [Cognitive Paradox of AI in Education (Frontiers 2025)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1550621/full)
- [Mitigating Societal Cognitive Overload in the Age of AI (arXiv)](https://arxiv.org/html/2504.19990v1)
- [AI Fatigue and Decision Offloading 2025 Data (Human Clarity Institute)](https://humanclarityinstitute.com/data/ai-fatigue-decision-2025/)

### Counter-Intuitive Findings and AI Trust

- [KPMG Global AI Trust Study 2025](https://kpmg.com/xx/en/our-insights/ai-and-technology/trust-attitudes-and-use-of-ai.html)
- [Stack Overflow 2025: 84% Use AI, 46% Don't Trust It](https://shiftmag.dev/stack-overflow-survey-2025-ai-5653/)
- [Harvard: Is AI Dulling Our Minds?](https://news.harvard.edu/gazette/story/2025/11/is-ai-dulling-our-minds/)
- [Dangers of Deferring to AI (Harvard Business)](https://www.library.hbs.edu/working-knowledge/dangers-of-deferring-to-ai)

### Archaeological and Forensic Methodology

- [Digital Stratigraphy Framework for Forensics (MDPI 2025)](https://www.mdpi.com/2673-6756/5/4/48)
- [AI Reconstruction of Archaeological Vessels from Fragments (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S1296207424002024)

### Futures Studies and Foresight

- [WEF: How to Responsibly Integrate AI into Strategic Foresight](https://www.weforum.org/stories/2025/12/ai-strategic-foresight-future-thinking/)
- [AI Futures and Responsibilities (AI:FAR)](https://www.ai-far.org/futures-and-foresight)
- [AI Futures Model: Dec 2025 Update](https://blog.ai-futures.org/p/ai-futures-model-dec-2025-update)

### Cross-Domain Methodology Transfer

- [Microsoft: Learning from Other Domains to Advance AI Evaluation (2025)](https://www.microsoft.com/en-us/research/wp-content/uploads/2025/08/Learning-from-other-Domains-to-Advance-AI-Evaluation-and-Testing_-v3-1.pdf)
- [Hallucination-Free? Reliability of AI Legal Research Tools (JELS)](https://onlinelibrary.wiley.com/doi/full/10.1111/jels.12413)

### Competitive Landscape and Differentiation

- [Best AI Research Tools 2026: Perplexity vs Consensus vs Elicit](https://aiproductivity.ai/blog/best-ai-research-tools-2026/)
- [8 Top Research-Focused Perplexity Alternatives (DigitalOcean)](https://www.digitalocean.com/resources/articles/perplexity-alternatives)
- [DRACO Benchmark: Evaluating Deep Research (Perplexity Research)](https://research.perplexity.ai/articles/evaluating-deep-research-performance-in-the-wild-with-the-draco-benchmark)

---

## Version History

| Version | Date       | Description              |
| ------- | ---------- | ------------------------ |
| 1.0     | 2026-03-20 | Initial lateral analysis |
