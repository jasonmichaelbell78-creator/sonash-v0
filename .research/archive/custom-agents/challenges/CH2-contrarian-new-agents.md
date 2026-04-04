# Challenge Report: CH2 — Contrarian Attack on New Agent Recommendations

<!-- prettier-ignore-start -->
**Challenge Agent:** deep-research-contrarian (CONTRARIAN mode)
**Date:** 2026-03-29
**Scope:** RESEARCH_OUTPUT.md Sections 5-9 (new agents + deep-research pipeline)
**Prior Archive Reference:** `.planning/archive/deep-research-skill/research/CUSTOM_AGENT_DESIGN.md` lines 1-80
**Methodology:** Pre-mortem, steel-man, inversion, evidence-first
<!-- prettier-ignore-end -->

---

## Framing

The archive explicitly concluded: "prompt-driven roles for verification and
critique — these are lightweight convergence-loop passes, not distinct agents."
The new research reverses this for 4-6 pipeline roles. The burden of proof is on
the reversal. Each challenge below demands that the research's evidence actually
closes the gap the archive identified — not just names it.

---

## Challenge 1: The Archive Was Right — Adversarial Roles Are Convergence Passes, Not Agents

**Claim under attack:** "Six new custom agent definitions are needed to close
the pipeline (verifier, contrarian-challenger, otb-challenger, dispute-resolver,
gap-pursuer, final-synthesizer)." [RESEARCH_OUTPUT Section 5.3, R4, R9]

**Archive position (verbatim, line 29):** "Prompt-driven roles for verification
and critique — these are lightweight convergence-loop passes, not distinct
agents."

**Steel-man of archive position:**

The archive was written after a codebase audit of the GSD ecosystem, where 11
agents consume ~8,800 lines and the agent inventory already had redundancy
problems. The archive looked at Phase 2.5 and Phase 3 and said: these are passes
within a single session, not reusable standalone behaviors. A convergence loop
pass executes once, reads some files, writes a verdict. That is exactly what
`convergence-loop` already does. The archive's "minimum viable set" of 3 agents
(decomposer, searcher-analyzer, synthesizer) was deliberately scoped to
persistent behaviors with clean upstream/downstream contracts.

**What has to be true for the reversal to be justified:**

1. The adversarial roles must have failed in practice under prompt-driven
   execution to a degree that is measurable, not theoretical.
2. The failure mode must be structural (not solvable by better inline prompts).
3. The maintenance cost of 4-6 new agents (each 250-380 lines, own versioning,
   own compliance checks) must be outweighed by the quality gain.

**What the research actually provides:**

Finding 5.2 shows that Phase 2.5 has "no template at all" and Phase 3
adversarial roles use "17-line inline templates." But the archive's
recommendation was specifically that these roles should be handled by
prompt-driven passes — not templates, not agents. The research treats "no
template" as evidence of a gap, but the archive explicitly recommended no
template for these roles. The research does not provide a single measured
quality failure under the prompt-driven approach. There is no A/B comparison.
There is no invocation history showing inconsistent output from the 17-line
prompts. The claim that the 17-line templates "produce inconsistent outputs" is
asserted without a single example of what inconsistency occurred.

**Verdict: The gap evidence is structural assumption, not observed failure. The
archive's position has not been falsified — it has been overwritten.**

**Confidence in this challenge:** HIGH. The evidence gap is a direct textual
observation from the research output, not inference.

---

## Challenge 2: convergence-loop-verifier Is a Protocol Lock, Not an ROI Agent

**Claim under attack:** "convergence-loop-verifier is the highest-ROI net-new
agent (6+ caller skills)." [RESEARCH_OUTPUT Section 9.2, R2]

**Pre-mortem: This agent exists but never delivers its claimed ROI. Why?**

The ROI claim rests on two pillars: (a) 6+ callers exist, and (b) "protocol
calibration drifts, producing inconsistent output." Both need scrutiny.

**On the 6+ callers:**

The research lists: convergence-loop, deep-plan, skill-audit, pr-retro,
create-audit, audit-\* discovery phases. But the research does not show what
fraction of these invocations are in-scope for T20 tally protocol vs. callers
that use convergence-loop for different purposes. If 4 of 6 callers invoke
convergence-loop for non-T20 tasks, the shared custom agent will need to handle
multiple modes — which is exactly the complexity that the archive warned against
for verification roles.

**On "protocol calibration drifts":**

This is asserted in Section 9.2 and R2 but never substantiated. The research
provides no JSONL comparison of convergence-loop output across callers showing
drift. No finding in Sections 5-9 includes a single concrete example of T20
output that was wrong due to per-call injection. "Produces inconsistent output"
is a plausibility argument, not evidence of a pattern.

**The inversion test:**

What would inline prompts need to do to make this agent unnecessary? The answer
is straightforward: extract the T20 tally protocol into a shared SKILL.md
template included by every caller skill via the `skills:` frontmatter field
(Finding 4.4 notes this field is currently unused). This is a 30-line SKILL.md
change that stabilizes all 6 callers simultaneously at near-zero maintenance
cost. A custom agent adds 200-350 lines of definition, its own compliance
checks, its own invocation tracking, and its own upgrade surface. The research
does not explain why the `skills:` field approach was considered and rejected.

**Verdict: The highest-ROI claim is unsubstantiated. A shared skill template
likely achieves the same stabilization at 10x lower maintenance cost. The agent
is a solution looking for a problem.**

**Confidence in this challenge:** MEDIUM-HIGH. The `skills:` field alternative
is directly named in Section 4.4 but never addressed as a substitute for the
verifier.

---

## Challenge 3: Session #244 Decided 3 Agents; Research Inflated to 4, Ecosystem Recommends 6 — Where Does Scope End?

**Claim under attack:** "Session #244 decision says 3 adversarial agents; D8b
analysis says 4. D8b's analysis is more detailed. 4 is correct."
[RESEARCH_OUTPUT Contradiction Table]

**Steel-man of the scope creep concern:**

Session #244 was a human decision made by the project owner. The research's
contradiction resolution simply asserts "D8b is more detailed, so D8b wins." But
"more detailed" is not a decision criterion — it is a description of how much
text the research agent produced. A more detailed analysis that was not
constrained by the original decision produces a naturally larger scope. This is
a research artifact, not a validated revision.

**The escalation pattern from the research itself:**

- Archive recommendation: 3 agents
- Session #244 decision: 3 agents
- D8b analysis: 4 agents
- Section 5.3 "ideal set": 6 agents
- Section 9.3 net-new top 5: adds 2 more (convergence-loop-verifier,
  firebase-specialist)
- R8-R12 P2 recommendations: adds dispute-resolver, gap-pursuer,
  final-synthesizer, react-specialist, refactoring-specialist,
  session-continuity-manager

Starting from 3 and following the research's own "more detailed" principle leads
to 12+ new agents. The research provides no principled stopping criterion. It
identifies each new role as having a genuine gap, then recommends creating an
agent for it. This is the same proliferation logic the archive explicitly
rejected.

**Cost of being wrong:**

Finding 1.5 establishes the 500-2000 token sweet spot. Each agent is 300-400
lines (~1,800-2,400 tokens), maintenance-required, compliance-checked,
versioned. The GSD ecosystem's 11 agents at 8,800 lines was already flagged as a
proliferation concern in the archive. Adding 6 pipeline agents, 1
convergence-loop-verifier, 1 firebase-specialist, 1 refactoring-specialist, and
1 session-continuity-manager puts the new total at 28+ local agents — more than
the current pre-consolidation count of 26.

**Verdict: The scope expansion from 3 to 4 to 6 to 12+ follows no principled
gate. The research needs an explicit maximum agent count commitment and a sunset
clause before any expansion beyond the Session #244 decision of 3.**

**Confidence in this challenge:** HIGH. The escalation pattern is directly
traceable in the research output text.

---

## Challenge 4: The 92% iMAD Cost Savings Will Not Transfer to This Implementation

**Claim under attack:** "iMAD selective triggering cuts adversarial agent cost
68-92%." [RESEARCH_OUTPUT Section 6.4, source [4] arXiv:2511.11306v1]

**What the paper actually describes:**

The iMAD paper builds a trained binary classifier that identifies "hesitation
cues" from a single-agent's output — linguistic markers that signal genuine
uncertainty. The classifier was trained on a labeled dataset. The 68-92% cost
savings are from this classifier routing low-uncertainty outputs to skip debate
entirely.

**The implementation gap:**

The research states that for deep-research, adversarial agents are "always
spawned per Critical Rule 2 — but within their execution, they can apply
FIRE-style confidence gating to selectively search for disconfirming evidence."
This is a fundamentally different application. The iMAD paper measures
team-level skip rates (don't spawn the agent at all). The research reinterprets
iMAD as within-agent evidence selectivity. These are not the same mechanism and
do not share cost properties.

**What a heuristic approximation achieves:**

Without the trained classifier, any implementation must use rule-based proxies:
word count of the finding, number of HIGH-confidence claims, explicit UNVERIFIED
flags. These proxies are not validated against the iMAD training corpus and have
unknown skip rates for deep-research outputs. The 68-92% figure is from a
trained system evaluated on its own test distribution. An untrained heuristic
implementation could achieve 20% or 60% — the paper provides no guidance for
out-of-distribution deployment.

**The cost of overclaiming:**

If the 92% savings are cited as justification for creating the adversarial
agents ("we can afford them because iMAD makes them cheap"), but the actual
heuristic implementation achieves 30%, the cost calculus reverses. The
adversarial agents become expensive standard pipeline stages rather than cheaply
selectable enhancements.

**Verdict: The 92% figure should not be used as justification. It is from a
trained classifier under controlled conditions, not from heuristic deployment.
The correct confidence for this claim in this context is LOW. Any adversarial
agent design must be costed assuming uniform execution, not iMAD-selective
execution.**

**Confidence in this challenge:** HIGH. The paper's methodology is unambiguous
about requiring a trained classifier; the research's reinterpretation is
documented in Section 6.4.

---

## Challenge 5: FIRE Confidence Gating Does Not Apply to Codebase Verification Claims

**Claim under attack:** "FIRE architecture reduces verification cost 7.6-16.5x.
For codebase verification: obvious claims (well-known stdlib, top-level files)
can be assessed without filesystem reads." [RESEARCH_OUTPUT Section 5.6, source
[28] arXiv:2411.00784]

**What FIRE actually covers:**

FIRE (Fact-checking with Iterative Retrieval, NAACL 2025) was evaluated on web
fact-checking tasks: claims about public knowledge, historical facts,
widely-documented events. The 7.6-16.5x savings come from skipping retrieval for
claims the model can assess from training data (e.g., "Paris is the capital of
France" needs no web search). The paper's test distribution is entirely
external-knowledge claims.

**Why codebase verification is different:**

The research proposes applying FIRE to claims like: "Phase 2.5 verification has
no template." "The compliance test tests the wrong implementation."
"check-agent-compliance.js behavior differs from its test file." These are
codebase-specific claims that cannot be assessed from model training data. The
model has no knowledge of this project's filesystem. Every claim of this type
requires a Read or Grep tool call. There is no "internal-knowledge-first"
shortcut because there is no relevant internal knowledge.

**The minority of claims where FIRE applies:**

The only codebase claims that could potentially skip tool calls are: (a) Claims
about general stdlib behavior (e.g., "Node.js fs.existsSync is synchronous").
(b) Claims about language semantics (e.g., "TypeScript strict mode prohibits
any").

These constitute a small fraction of a deep-research codebase verification pass.
The research does not estimate what fraction of claims in a typical verification
batch are FIRE-skippable in a codebase context. The 7.6-16.5x figure is almost
certainly not transferable to filesystem verification tasks.

**Verdict: FIRE's savings estimate is domain-mismatched. It should not be cited
as justification for the deep-research-verifier's design. The verifier's actual
savings in codebase mode are likely less than 2x, not 7-16x.**

**Confidence in this challenge:** HIGH. The FIRE paper's test distribution is
explicitly web fact-checking; codebase claims are a structurally different
category.

---

## Challenge 6: The Salvagente Rule Defeats the Purpose of the Adversarial Agent

**Claim under attack:** "Salvagente Rule (serendipity seeds from rejected
findings)" as a design principle for contrarian-challenger and otb-challenger.
[RESEARCH_OUTPUT R4, D8b]

**Steel-man of the Salvagente Rule:**

The rule has a legitimate motivation. A finding that is REFUTED as a primary
claim may still contain a useful signal — a tangential insight, a caveat worth
preserving. The Salvagente Rule prevents total discard of challenged material.
This is a reasonable anti-waste mechanism.

**The adversarial purpose failure:**

The adversarial agent's job is to identify claims that should NOT appear in the
final research output. Its success metric is the rate at which its challenges
cause claims to be downgraded or removed. If every rejected claim is
automatically converted to a "serendipity seed" that gets documented somewhere,
the adversarial agent never actually kills anything — it reclassifies
everything.

**The implementation gap:**

What does a serendipity seed actually produce? The research does not define: (a)
who reads serendipity seeds, (b) what format they take, (c) whether the
synthesizer is obligated to include them in the final output, (d) whether they
can propagate back into the main findings in a future cycle. Without a defined
lifecycle, serendipity seeds are a way for the adversarial agent to perform its
challenge theater while ensuring nothing it flags is ever truly removed.

**The convergence-loop problem:**

The project already has a finding that "convergence loops must loop internally
until converged" (MEMORY.md). The Salvagente Rule creates a pressure valve that
prevents true convergence — the adversarial agent converges to "everything I
challenged became a seed" instead of "N claims were eliminated." This inverts
the adversarial purpose.

**Verdict: The Salvagente Rule needs a hard threshold — e.g., "no more than 30%
of challenged claims may become serendipity seeds; the remainder must be
eliminated or accepted as CONFLICTED for dispute resolution." Without a ceiling,
the adversarial agent becomes a repackaging agent, not a challenge agent.**

**Confidence in this challenge:** MEDIUM-HIGH. The lifecycle of serendipity
seeds is genuinely undefined in the research, and the convergence risk is real.
Partial confidence reduction because the rule might have a legitimate
implementation with proper ceilings.

---

## Challenge 7: Firebase Official Skills Are Feb 2026 — No Validation That They Are Actually Good

**Claim under attack:** "Firebase released official agent skills in February
2026 — directly applicable. 13 purpose-built Firebase skills... 99/100
evaluation scores." [RESEARCH_OUTPUT Section 9.1, sources [21][22]]

**The 99/100 claim requires scrutiny:**

Who assigned the 99/100 evaluation score? Finding 9.1 cites "D10a Discovery 22,
D10b Finding 1" for the Firebase skills, with source [21] being
firebase.google.com/docs/ ai-assistance/agent-skills. The evaluation score
methodology is not described in the research output. The only CRAAP scores in
the source table are assigned by the research agents themselves — they are not
third-party evaluations. If Google assigned its own skills a 99/100, this is
marketing, not evaluation.

**What "official" means for agent skills:**

Firebase official agent skills are prompt templates published by Google. They
encode Firebase best practices as of the publication date. They do not know
about SoNash's specific constraints: the App Check enforcement requirement, the
3-collection write gate (journal, daily_logs, inventoryEntries), the
httpsCallable-only pattern, the Firebase 12.10.0 version context. The research's
proposed wrap-with-SoNash-constraints approach is sound in principle, but the
quality of the underlying skills is unvalidated.

**The Feb 2026 staleness problem:**

The research was conducted on 2026-03-29. The Firebase skills are from Feb 2026
— 6 weeks old. Firebase 12.10.0 is listed in CLAUDE.md as the current version.
If the official skills were written for Firebase 11.x or earlier, they may
encode deprecated patterns. The research provides no verification that the
skills target Firebase 12.x.

**The precedent problem:**

If official skills automatically justify creating a wrapper agent, the same
logic applies to every framework with official skills: Vercel has React best
practices agents (Finding 9.4), Google has ADK agents, Microsoft has ADO agents.
This creates an unbounded expansion criterion: "official skills exist, therefore
create a wrapper agent." The research does not explain why Firebase is uniquely
justified over Vercel/React, which is actually a higher-frequency development
surface for SoNash.

**Verdict: The firebase-specialist recommendation rests on an unvalidated 99/100
score and an assumption that official = compatible with SoNash constraints.
Requires a manual quality check of at least 3 Firebase skills against
SoNash-specific scenarios before committing to agent creation.**

**Confidence in this challenge:** MEDIUM. The unvalidated score and
version-targeting concerns are real, but the agent concept itself is sound; the
quality concern is addressable with a one-session validation pass.

---

## Challenge 8: development-team Was Deliberately Not Created — Silence Is Evidence

**Claim under attack:** "CLAUDE.md references 'Development team' (Section 7
agent triggers table: 'Multi-file feature (3+ files) → Development team → Team')
but the team does not exist. This is a gap that should be created." [Implied
from RESEARCH_OUTPUT Section 8 + CLAUDE.md reference]

**The research does not actually make this recommendation directly**, but
Section 8.4 recommends against a deep-research team and Section 8.1 validates
the two existing teams. The omission of development-team from the recommendation
set deserves its own challenge because it represents a pattern: CLAUDE.md
references a team that does not exist and the research implicitly treats it as a
gap rather than a deliberate decision.

**Steel-man for deliberate omission:**

The two existing teams (audit-review-team and research-plan-team) were created
with explicit justification. The agent inventory audit (Session #236, PR #465)
reviewed all agents and teams and did not create development-team. The project
owner runs as a solo developer. A development-team for "multi-file feature (3+
files)" would add 3-7x token overhead for every feature that touches more than 2
files — which is most features.

**What "teams cost 3-7x tokens" means in practice:**

Finding 8.2 shows efficiency drops from 67.7 to 13.6 successes per 1K tokens
from single-agent to 5-agent team. For routine multi-file feature work — the
most common development task — a persistent team configuration would impose this
tax on every implementation cycle. The solo developer context makes this
particularly harmful: there is no human team context to preserve between
sessions that would justify the overhead.

**The CLAUDE.md reference may be aspirational, not prescriptive:**

CLAUDE.md Section 7 states "Development team — Team." This may have been written
as a forward-looking reference during a planning phase, not as a trigger that
requires the team to exist. The fact that 3+ file features have been shipped
without a development-team since CLAUDE.md was written (versions 5.1-5.8 span
Feb 10 to Mar 24 2026) suggests the team is not needed for the project's current
scale.

**Verdict: The absence of development-team is more likely a deliberate decision
than a gap. Creating it would add per-feature overhead that conflicts with the
solo developer workflow. The CLAUDE.md reference should be removed or clarified
as aspirational, not filled with a team definition.**

**Confidence in this challenge:** MEDIUM. The evidence is circumstantial
(absence of creation over 6+ weeks of active development), not a confirmed
decision record.

---

## Challenge 9: Self-Improving Pattern-Promotion Agent Automates Human Judgment on What Matters

**Claim under attack:** "self-improving pattern-promotion agent aligns directly
with SoNash's memory system. The pattern-promotion agent (MEMORY.md → CLAUDE.md
rule graduation) would automate what currently requires manual session-end
documentation." [RESEARCH_OUTPUT Section 9.5, R12]

**What MEMORY.md → CLAUDE.md graduation currently requires:**

A human decision: this observation from a single session is now a behavioral
rule that governs ALL future sessions. The graduation threshold is not defined
anywhere in MEMORY.md or CLAUDE.md, and deliberately so — it requires the
project owner to judge whether a pattern is persistent enough, impactful enough,
and scoped correctly to belong in the always-loaded CLAUDE.md. CLAUDE.md is kept
to ~135 lines to reduce token waste (Section 1 header). The constraint is
deliberate.

**The automation failure mode:**

A pattern-promotion agent would need to decide: (a) when a pattern has been
observed enough times to graduate, (b) whether the pattern is general
(CLAUDE.md) or project-specific (MEMORY.md), (c) how to phrase the rule to be
non-redundant with existing entries, (d) which section it belongs in. Each of
these decisions currently involves the project owner looking at the full
CLAUDE.md context and applying editorial judgment. The community template cited
(alirezarezvani/claude-skills) is a generic self-improving pack with no
validation history in this project's context.

**The bad-pattern promotion risk:**

MEMORY.md contains feedback entries that describe failure modes, not rules:
e.g., "Deep-plan hook discovery — 5-layer multi-agent discovery for
hook/infrastructure audits." This is a description of what happened, not a
standing rule. An automated promoter must distinguish observation from rule.
Getting this wrong promotes operational noise into the always-loaded context,
degrading every future session's performance. There is no recovery mechanism —
once in CLAUDE.md, a bad rule persists until manually caught.

**The human-judgment point is the point:**

MEMORY.md Section 1 lists the feedback entries with their context. The value is
not in automating their promotion — it is in the human reading them at
session-start and deciding whether the pattern is still relevant. This is the
weekly-review function. Automating it removes the friction that prevents
low-quality patterns from polluting the always-loaded context.

**Verdict: Pattern-promotion automation optimizes the wrong thing. The friction
of manual graduation is a feature, not a bug. The self-improving agent should be
rejected, not built.**

**Confidence in this challenge:** HIGH. The constraint on CLAUDE.md length
(Section 1, ~135 lines) and the deliberate absence of promotion automation
across 5.1-5.8 version history suggests this is a design decision, not a gap.

---

## Summary Table

| #   | Claim                                        | Challenge Type                                | Verdict      | Confidence  |
| --- | -------------------------------------------- | --------------------------------------------- | ------------ | ----------- |
| 1   | 4-6 adversarial pipeline agents needed       | Archive reversal not justified by evidence    | Unproven gap | HIGH        |
| 2   | convergence-loop-verifier highest ROI        | Skills: field alternative never considered    | Premature    | MEDIUM-HIGH |
| 3   | 3→4→6→12 agent scope expansion               | No principled stopping criterion              | Scope creep  | HIGH        |
| 4   | 92% iMAD cost savings                        | Trained classifier, not heuristic-deployable  | Overclaim    | HIGH        |
| 5   | FIRE 7.6-16.5x codebase verification savings | Domain mismatch (web facts vs filesystem)     | Overclaim    | HIGH        |
| 6   | Salvagente Rule preserves challenged claims  | Defeats adversarial purpose without ceiling   | Design flaw  | MEDIUM-HIGH |
| 7   | Firebase skills 99/100, directly applicable  | Unvalidated score, version-targeting unknown  | Premature    | MEDIUM      |
| 8   | development-team is a gap to fill            | Likely deliberate omission, solo dev overhead | Misdirected  | MEDIUM      |
| 9   | Pattern-promotion agent automates graduation | Human judgment is the point; bad-pattern risk | Reject       | HIGH        |

---

## What Would Close These Challenges

For a synthesizer deciding which challenges to accept vs. reject, the following
evidence would close each challenge:

1. **Challenge 1:** A single concrete example of Phase 3 adversarial output
   failure under the current 17-line inline template. Even one real case
   validates the structural gap.

2. **Challenge 2:** An explicit analysis of why the `skills:` frontmatter field
   cannot provide T20 protocol stability across callers. If the field has a
   technical limitation (e.g., no variable injection, no conditional loading),
   the agent is justified.

3. **Challenge 3:** An explicit maximum agent count from the project owner,
   confirmed before any new agents are created. "We will create N agents and no
   more this cycle" closes the scope creep concern.

4. **Challenge 4:** Replace the 92% claim with an honest range: "heuristic-based
   implementation: estimated 20-50% savings." Design the adversarial agents
   assuming uniform execution.

5. **Challenge 5:** A per-claim-type analysis showing what percentage of
   deep-research codebase verification claims are FIRE-skippable. If <10%,
   remove the FIRE citation from the verifier design entirely.

6. **Challenge 6:** Add a numerical ceiling to the Salvagente Rule: "maximum 30%
   of challenged claims may be reclassified as serendipity seeds; the remainder
   must be eliminated or passed to dispute resolution."

7. **Challenge 7:** Manual validation of 3 Firebase skills against
   SoNash-specific test scenarios (App Check enforcement, 3-collection write
   gate, Firebase 12.10.0 syntax) before creation decision.

8. **Challenge 8:** A decision record from the project owner: "create
   development-team" or "remove the CLAUDE.md reference." Either closes the
   ambiguity.

9. **Challenge 9:** No closure path. The pattern-promotion agent should be
   rejected unconditionally. Human judgment on CLAUDE.md content is a deliberate
   architecture decision.

---

## Serendipity Seeds

These are findings that emerged from the challenge process and are worth
preserving even though they are outside the challenge scope:

1. **The `skills:` field (Finding 4.4) is underused as a shared-protocol
   mechanism.** If it supports variable injection, it may be a superior
   alternative to custom agents for lightweight protocol stabilization across
   callers. This deserves its own analysis before convergence-loop-verifier is
   created.

2. **The escalation from 3 to 12+ agents follows a predictable pattern.** Each
   research wave identifies a new role with a genuine gap, then recommends an
   agent. A standing decision gate — "create agent only if 2+ invocations per
   week AND inline prompts have failed in a documented session" — would prevent
   future proliferation without blocking genuinely justified creation.

3. **The Salvagente Rule conflict reveals an unresolved design question about
   adversarial pipelines:** what does "winning" a challenge mean, and how is it
   measured? If there is no success metric for the adversarial agent, it cannot
   be improved across sessions. A concrete metric (e.g., "% of challenged
   findings that are modified or removed in final output") would make the
   adversarial agents self-evaluating.
