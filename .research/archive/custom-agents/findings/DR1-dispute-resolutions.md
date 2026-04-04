# Dispute Resolutions: Custom Agents Research

**Agent:** dispute-resolver **Method:** Evidence-weight resolution (not majority
vote) **Date:** 2026-03-29 **Input corpus:** RESEARCH_OUTPUT.md, V1, V2, CH1,
CH2, CH3, CH4, PR1, PR2

---

## Resolution Method Applied

For each dispute:

1. State both positions with their strongest evidence
2. Weigh evidence by source tier (filesystem ground truth > official docs >
   verified secondary research > assertion)
3. Pick the better-evidenced position
4. Where evidence is equal, pick the more conservative position
5. Document what changes in RESEARCH_OUTPUT.md

---

## D1: Agent Body + CLAUDE.md Inheritance

### Positions

**Original (RESEARCH_OUTPUT.md 1.1):** "Agent bodies replace (not supplement)
Claude's base system prompt, meaning agents without project context produce
violations at generation time." The Executive Summary (lines 18-19) states:
"agents without project context produce violations at generation time that gates
catch only afterward."

**V1 C-001 MODIFIED:** "CLAUDE.md IS inherited in standard subagents. The agent
body replaces the base system prompt, but CLAUDE.md files and git status still
load through the normal message flow." Source: D1b lines 52, 72, 77 — official
features-overview documentation.

**CH1 Challenge 7:** Explicitly calls this the "most structurally important
correction in this review." If CLAUDE.md loads automatically, the 13+
general-purpose invocations already have security boundaries via CLAUDE.md
inheritance. The override program's value drops from "installs absent security
boundaries" to "fills remaining context gaps."

### Evidence Weighting

| Evidence                                                                                                             | Source Tier                                                    | Direction              |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| D1b lines 52, 72, 77 — official docs: "CLAUDE.md and git status are inherited from parent per features-overview doc" | T1: Official docs via direct read                              | CLAUDE.md IS inherited |
| D6c override gap synthesis — explicitly confirmed the inheritance finding                                            | T1: Filesystem read                                            | CLAUDE.md IS inherited |
| Executive Summary framing: "agents without project context produce violations"                                       | T4: Research synthesis assertion, written before V1 correction | Original position      |
| CH1 Challenge 7: "This is the most structurally important correction in this review"                                 | T2: Verified by same T1 source                                 | CLAUDE.md IS inherited |

The T1 evidence is unambiguous: two independent filesystem reads (D1b and D6c)
from official documentation confirm CLAUDE.md loads automatically. The original
claim misrepresents its own cited sources.

### Resolution: V1 MODIFIED position wins

**CLAUDE.md IS inherited in standard subagents.** The agent body replaces the
_base_ system prompt (the generic Claude behavior), but project context —
CLAUDE.md rules, git status, project memory — loads through the normal message
flow and is present in all agent invocations.

The override program remains valuable, but the threat model is **context
incompleteness**, not **security boundary absence**. What general-purpose agents
lack is:

- Explicit stack version strings (React 19.2.4, Next.js 16.2.0, Firebase
  12.10.0)
- Pattern-specific examples (sanitize-error.js usage, httpsCallable convention)
- Structured return format expectations
- Model assignment

What they already have via CLAUDE.md inheritance:

- The three write-gate security rules (Section 2)
- The behavioral guardrails (Section 4)
- The anti-patterns list (Section 5)
- The architecture rules (Section 3)

### Impact on RESEARCH_OUTPUT.md

**Must change:**

- Executive Summary lines 18-19: Replace "agents without project context produce
  violations at generation time" with: "agents lack explicit stack-version and
  pattern specificity, but CLAUDE.md security rules ARE inherited — the risk is
  context incompleteness, not boundary absence."
- Theme 1.1: Add qualifier: "CLAUDE.md files and git status load through normal
  message flow and are present in all agent invocations; what the agent body
  must supply explicitly are stack versions, pattern examples, and structured
  return formats."
- Theme 4.3 "all currently run without SoNash security boundaries": Change to
  "all currently run without explicit stack version strings, pattern examples,
  or structured return formats. CLAUDE.md security rules ARE inherited."

**Confidence change:** The general-purpose override recommendation (R1) remains
P1 — it provides genuine value through specificity injection. But the urgency
framing shifts from "security gap" to "specificity gap." The override is still
the highest-leverage single action for output quality; it is not the
highest-leverage security remediation (hooks hold that role).

---

## D2: Custom Agents vs Prompt-Driven Roles (Archive Conflict)

### Positions

**Archive (CUSTOM_AGENT_DESIGN.md, SYNTHESIS.md):** "Prompt-driven roles for
verification and critique — these are lightweight convergence-loop passes, not
distinct agents." The archive explicitly recommended against building verifier,
critic, decomposer agents.

**New Research (RESEARCH_OUTPUT.md Themes 5.1-5.3, R4):** Six new custom agent
definitions are needed to close the pipeline. The archive's recommendation
produced an unverified gap — Phase 2.5 has no template at all.

**CH2 Challenge 1:** "The archive's position has not been falsified — it has
been overwritten." There is no single measured quality failure under the
prompt-driven approach. No A/B comparison. No invocation history showing
inconsistent output. The gap evidence is structural assumption, not observed
failure.

### Evidence Weighting

| Evidence                                                                                                            | Source Tier                                 | Direction            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------- |
| D9b filesystem read: Phase 2.5 has NO template in REFERENCE.md — confirmed by exhaustive grep                       | T1: Ground truth                            | Custom agents needed |
| REFERENCE.md SKILL.md: Phase 2.5 described in one sentence; no prompt template exists                               | T1: Ground truth                            | Custom agents needed |
| Archive recommendation: "prompt-driven roles sufficient"                                                            | T3: Design reasoning (pre-gap-verification) | Archive position     |
| PR2 3.1: "New research is correct. The archive was made without ground-truth verification of REFERENCE.md/SKILL.md" | T2: Verified secondary                      | Custom agents needed |
| CH2: "No single measured quality failure under the prompt-driven approach is cited"                                 | T3: Valid methodological challenge          | Archive position     |

The CH2 challenge is methodologically sound — absence of a measured failure is a
real weakness in the gap evidence. However, the critical counterpoint is that
Phase 2.5 genuinely has _no template at all_ (T1 filesystem evidence). The
question is not whether the prompt-driven approach _failed_ — it is whether the
pipeline has a structural gap. A phase with zero enforcement mechanism is a gap
regardless of whether measured failures have accumulated. The deep-research
skill describes Phase 2.5 in one sentence in SKILL.md and provides zero prompt
guidance. Under the current architecture, verifiers are spawned with no
specification. That is not a failure of the prompt-driven approach; it is the
absence of any approach.

The archive's "convergence-loop as substitute" assumption also fails the
filesystem test (PR2 3.1): the 4-verdict taxonomy
(VERIFIED/REFUTED/UNVERIFIABLE/CONFLICTED) and the >20% claim-change trigger
calculation require structured returns that convergence-loop cannot provide.
These are structural requirements, not quality preferences.

### Resolution: New research position wins with one modification

**Custom agent definitions ARE needed for pipeline roles that require structured
returns or multi-verdict taxonomies.** The archive was reasoning from design
principles; the new research verified from disk. Filesystem evidence supersedes
design reasoning.

**The one modification:** CH2 Challenge 1's core demand — "a single measured
failure" — is partially satisfied by this exact research session. V1 C-001
MODIFIED, V2 C-086 REFUTED, and the entire CH1-CH4 challenge process reveal that
the Phase 3 adversarial phases produce outputs that require correction and
dispute resolution. The research itself IS the evidence that more than inline
prompts are needed for phases that must produce filesystem artifacts consumed by
downstream agents.

**However, scope discipline applies (see D5).** Not all pipeline roles require
equal treatment. The archive was right that lightweight phases should stay
inline. The resolution is role-by-role:

- Phase 2.5 verifier: custom agent required (no template exists; structured
  return mandatory)
- Phase 3 contrarian + OTB: custom agents justified (produce
  `.research/challenges/` files consumed by dispute-resolver; inline prompts
  have no artifact discipline)
- Phase 3.5 dispute-resolver: custom agent justified (evidence-weight
  arbitration requires structured protocol that inline prompts cannot enforce)
- Phase 3.95 gap-pursuer + 3.97 final-synthesizer: custom agents justified
  (gap-pursuer needs profile-switching tool strategy; final-synthesizer must not
  full-rewrite)

**What the archive got right that must be preserved:** The DEFER criterion.
Create a custom agent only when the gap has a structural enforcement requirement
(structured return, artifact discipline, multi-tool strategy) that inline
prompts cannot provide. Resist creating agents for roles where a well-crafted
inline prompt suffices.

### Impact on RESEARCH_OUTPUT.md

- Finding 5.2 stands as written. No change needed.
- Add a note in R4 rationale: "Custom definitions are justified not because
  inline prompts failed observably, but because each of these roles has a
  structural enforcement requirement (structured return format, artifact
  discipline, profile-switching tool strategy) that inline REFERENCE.md
  templates cannot provide."

---

## D3: Skills Injection Alternative (CH3 Alt 1+2)

### Positions

**Research:** Create 7-14 new agents with full definitions, each embedding
SoNash context (stack versions, security rules, patterns) in their body.

**CH3 Alt 1:** Create a `sonash-context` shared skill via the `skills:`
frontmatter field. Every new agent body becomes 100-200 lines of specialization
instead of 300-400 lines of repeated context. Verified: `skills:` field is in
the official schema AND is currently unused across all 39 agents (T1
filesystem).

**CH3 Alt 4 (Maintenance):** At 42+ agents with hardcoded version strings, every
package version bump requires touching 20+ agent files. Centralizing via
`skills:` means one update propagates to all agents.

### Evidence Weighting

| Evidence                                                                                                           | Source Tier                | Direction                            |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------ |
| C-051 VERIFIED: `skills:` field unused across all 39 agents — confirmed by exhaustive bash loop                    | T1: Ground truth           | Skills injection is unexplored       |
| D1b table line 31: `skills:` is in the official 17-field schema                                                    | T1: Official docs          | Skills injection is viable           |
| CH3 Alt 1: Tier A agents embed 50-80 lines of SoNash context each; shared skill would de-duplicate this            | T1: Filesystem observation | Skills injection reduces duplication |
| D1b: `skills:` field functionality note — "loads SKILL.md files at invocation time"                                | T1: Official docs          | Confirmed mechanism                  |
| CH3 Alt 1 Caveat: Unverified whether `skills:` content is injected into system prompt vs. appended as user message | T3: Unverified concern     | Injection position unknown           |
| CH3 Alt 4: CLAUDE.md declares 5 package versions; 20+ agents embed them; every bump requires 20+ edits             | T1: Count verified         | Maintenance burden is real           |

The `skills:` field approach has strong T1 evidence for viability (schema
presence, confirmed unused, verified mechanism description). The caveat about
injection position (system prompt vs user message) is the critical unknown.

### Resolution: Skills injection IS viable as a complement to agent creation, not a replacement

**Adopt CH3 Alt 1 partially:** Create `sonash-context` as a shared skill BEFORE
creating new agents. Every new agent definition should list
`skills: [sonash-context]` for shared context injection. This achieves:

1. Reduced per-agent token count (staying squarely in the 500-2000 token sweet
   spot)
2. Single-point version string maintenance
3. Inheritance of CLAUDE.md stack section without per-agent copy-paste

**The replacement question:** Skills injection cannot replace custom agent
creation for pipeline roles with structural enforcement requirements (see D2).
It CAN replace the context-embedding portion of each agent body, which is a
significant maintenance win.

**The caveat must be resolved first:** The injection position (system prompt vs
user message) must be verified in practice before `sonash-context` is relied
upon for security context. If skills inject as user messages, security rules
embedded in the skill may be deprioritized relative to the agent body. If they
inject into the system prompt, they are authoritative. A 30-minute verification
experiment closes this.

**Impact on new agent count:** Skills injection does NOT change the count of
agents that should be created. It changes the token size and maintenance model
of each new definition. The pipeline roles still require custom agents (see D2);
those agents will be smaller and more maintainable with `skills:` injection.

### Impact on RESEARCH_OUTPUT.md

- Add to Theme 4.4 (skills: field): "Recommended action: create `sonash-context`
  as a shared skill BEFORE implementing new agents. All new agent definitions
  should use `skills: [sonash-context]` to inject stack versions and common
  patterns. Verify injection position (system prompt vs user message) in a
  30-minute pilot before relying on this for security context."
- Add to R4 rationale: "All new pipeline agent definitions should use
  `skills: [sonash-context]` to centralize version strings and reduce
  per-definition token count."

---

## D4: Implementation Sequencing (CH4 BS2)

### Positions

**Research priority order:** P1: Create agents (general-purpose override,
pipeline agents, system overrides). P3: Add tests (golden fixtures, audit
cadence).

**CH4 BS2:** Sequencing creates new specification failures (MAST FC1: 41.8%)
before building validation infrastructure. The mitigation: R7 (automated
frontmatter validation) BEFORE creating any new agents. Then one pilot agent,
measured, then remaining agents.

**CH1 Challenge 4:** The "0 of 17 fields validated" framing overstates urgency.
The pre-commit gate fires on 0.1% of commits (agent file changes only). A 30-day
audit cadence is higher-ROI than per-commit validation.

### Evidence Weighting

| Evidence                                                                                                                                           | Source Tier                                   | Direction                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------- |
| MAST taxonomy (arXiv:2503.13657): 41.8% of multi-agent failures are FC1 design-time specification failures                                         | T3: Academic, UNVERIFIABLE against filesystem | Infrastructure-first          |
| C-082 VERIFIED: No `tests/agents/` directory exists; zero golden tests at any layer                                                                | T1: Ground truth                              | Infrastructure gap is real    |
| C-043 VERIFIED: TDMS integration may not have run post-March-17 audit                                                                              | T1: Ground truth                              | Measurement gap is real       |
| CH1 Challenge 4: "the highest-leverage quality intervention is fixing the 9 stub agents and 4 override gaps. Those are known, catalogued failures" | T2: Reasoning from verified data              | Known fixes first             |
| V1 C-010 VERIFIED: check-agent-compliance.test.ts tests wrong implementation (false confidence confirmed)                                          | T1: Ground truth                              | Infrastructure already broken |

CH4 BS2 has the MAST taxonomy as its strongest evidence, but that is an
UNVERIFIABLE external claim. The ground-truth support is real but different: the
compliance test is already broken (T1), and there are zero existing tests (T1).
These facts do support "fix infrastructure before adding agents."

CH1 Challenge 4's counter-argument is also grounded in T1 evidence: the 59
structural findings from the March 17 audit are already catalogued. Adding a
pre-commit gate doesn't find new problems; it catches future regressions in
agents not yet created.

**The sequencing tension resolves differently for different agent categories:**

- **General-purpose override (R1):** Does NOT require new test infrastructure.
  It is a single file that overrides existing behavior. The risk of a bad
  override is contained (only general-purpose invocations affected, CLAUDE.md
  rules still present). Create first.
- **Consolidation (26→17):** DOES require a cross-reference audit first (CH4
  BS5). Cannot delete 9 agents before checking all references in CLAUDE.md,
  skills, teams, AGENT_ORCHESTRATION.md. The blast-radius audit IS the
  prerequisite infrastructure.
- **New pipeline agents:** Should follow a pilot-first pattern. Create ONE
  (verifier), run one deep-research session, measure output quality against the
  specification, then proceed with remaining 5. This is the CH4 BS2 mitigation
  applied conservatively.
- **R7 frontmatter validation:** CH1 Challenge 4 is correct that per-commit
  validation has low ROI. The higher-ROI alternative is 30-day audit cadence
  (R15). However, the compliance test must be fixed first (it currently tests
  the wrong behavior), which is a one-session fix.

### Resolution: Resequenced P1 with two infrastructure prerequisites, not wholesale reversal

The research's P1/P2/P3 ordering does not require wholesale reversal. Two
infrastructure steps should be inserted BEFORE agent creation begins:

1. **Pre-step 1 (30 min):** Fix check-agent-compliance.test.ts to test actual
   check-agent-compliance.js behavior (V1 C-010 ground-truth finding). This
   prevents false confidence before creating new agents.
2. **Pre-step 2 (2-4 hrs):** Cross-reference audit of the 9 agents targeted for
   removal — grep across CLAUDE.md, all skills/_.md, all teams/_.md,
   AGENT_ORCHESTRATION.md. CH4 BS5 is correct that deletion without this
   produces silent fallbacks.

After these two pre-steps, P1 agent creation proceeds as ordered, with one
modification: create verifier first, pilot it in one research session, then
create remaining pipeline agents.

**R7 (frontmatter validation hook) moves to P2, not P1.** The compliance test
fix (above) is P0-infrastructure. A full pre-commit gate is a P2 enhancement
after the known quality problems are addressed manually.

### Impact on RESEARCH_OUTPUT.md

- Add "P0-Infrastructure (before P1 begins): (a) Fix compliance test; (b) Run
  cross-reference audit of 9 removal candidates" at the top of the
  recommendations section.
- Move R7 (frontmatter validation hook) from P1 to P2.
- Add pilot note to R4: "Create deep-research-verifier first. Run one complete
  deep-research session. Measure verifier output quality against its
  specification. Proceed with contrarian-challenger and remaining pipeline
  agents only after pilot confirms the definition produces correct outputs."

---

## D5: Scope Creep (CH2 Challenge 3)

### Positions

**Session #244 decision:** 3 adversarial agents (contrarian, OTB, verifier).

**Research escalation path:**

- D8b analysis: 4 (adds dispute-resolver)
- Section 5.3 "ideal set": 6
- Section 9.2-9.5 net-new: convergence-loop-verifier, firebase-specialist
- R8-R12 P2: dispute-resolver, gap-pursuer, final-synthesizer, react-specialist,
  refactoring-specialist, session-continuity-manager

**CH2 Challenge 3:** "The research provides no principled stopping criterion.
Starting from 3 and following 'more detailed' leads to 12+ new agents. Where
does scope stop?"

**CH2 CH3 BS-A:** 12 of 15 recommendations are creation actions. Zero are
"improve orchestration of existing agents." Zero are "extend hook coverage."

### Evidence Weighting

| Evidence                                                                                                              | Source Tier                  | Direction                           |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------- |
| Session #244 decision: 3 agents — explicitly a human scope decision by project owner                                  | T1: Canon                    | Hard starting ceiling               |
| D8b analysis "4 is more detailed": no principled criterion, just analysis depth                                       | T3: Research agent assertion | Does not override owner decision    |
| CH2: Escalation from 3→4→6→12+ is traceable directly in research text                                                 | T1: Textual verification     | Scope creep concern is real         |
| BS3 CH4: Solo developer operating 37-44 agents is unsustainable per prior archive and MEMORY.md context               | T1: Project context          | Solo overhead is real               |
| Archive CUSTOM_AGENT_DESIGN.md: GSD ecosystem's 11 agents at 8,800 lines was already flagged as proliferation concern | T1: Prior research           | Agent count ceiling matters         |
| Consolidation goal: 26→17 (35% reduction) frees maintenance capacity                                                  | T1: Research consensus       | Capacity for some new agents exists |

The Session #244 decision is the human project owner's explicit scope
commitment. The research's rationale for overriding it — "D8b's analysis is more
detailed, so D8b wins" — is not a valid decision criterion. Research depth does
not override project owner scope decisions.

However, the context for Session #244 did not include the full pipeline gap
analysis (PR2 2.2 confirms the prior archive explicitly said NO verifier/critic,
which turned out to be wrong). The scope decision was made without filesystem
verification of what the pipeline actually had. That changed the information
basis.

### Resolution: 6 pipeline agents (the closed set), hard ceiling on general-duty expansion

**The pipeline agents are justified as a closed set of 6:** The deep-research
pipeline has exactly 6 roles. All 6 have structural enforcement requirements
(see D2). These 6 agents close the pipeline completely. No further pipeline
agents are needed. This is the ceiling: verifier, contrarian-challenger,
otb-challenger, dispute-resolver, gap-pursuer, final-synthesizer.

**General-duty net-new agents require a creation gate before any additional
agents beyond the pipeline set:**

A new general-duty agent may only be created if ALL of the following are true:

1. The agent covers a capability with no current coverage (not redundant with
   existing agents)
2. The agent has 2+ invocations per week from skills OR is referenced in
   CLAUDE.md triggers
3. Inline prompts in the invoking skill have demonstrably failed in a documented
   session
4. The new agent count remains at or below: (17 post-consolidation local + 6
   pipeline global = 23) + (current 13 global = 36 total)

Under this gate:

- **convergence-loop-verifier:** Fails criterion 3 (no documented failure). Move
  to P3 with prerequisite: "first demonstrate T20 protocol inconsistency in 2
  sessions."
- **refactoring-specialist:** Passes criteria 1 and 2 (not in roster; code
  refactoring is frequent). Create if post-consolidation capacity allows.
- **firebase-specialist:** Requires quality validation of the Firebase skills
  first (CH2 Challenge 7). Move to P3 pending manual validation of 3 Firebase
  skills against SoNash-specific test scenarios.
- **self-improving pattern-promotion agent:** REJECT unconditionally (CH2
  Challenge 9 is HIGH confidence: human judgment on CLAUDE.md content is a
  deliberate architecture decision; CLAUDE.md length constraint is explicit in
  Section 1).

### Impact on RESEARCH_OUTPUT.md

- Section 9.2 (convergence-loop-verifier "highest-ROI"): Downgrade to P3. Change
  rationale to: "Defer until T20 protocol inconsistency is documented in
  practice. Skills injection via `skills:` frontmatter (see Theme 4.4) may
  provide equivalent stabilization."
- Section 9.5 (pattern-promotion agent): Change recommendation from R12 to
  REJECT. Add explicit note: "Human judgment on CLAUDE.md content is a
  deliberate architecture decision (CLAUDE.md Section 1: ~135 line constraint).
  Automation removes the friction that prevents low-quality patterns from
  polluting the always-loaded context."
- Add a "Creation Gate" section to Recommendations: list the 4 criteria any new
  general-duty agent must meet before creation is authorized.

---

## D6: Consolidation Safety (CH1 Challenge 1 + CH4 BS5)

### Positions

**Research:** Delete 9 agents immediately (P1 action, D7c consolidation action
table).

**CH1:** Add 90-day redirect stubs. Invocation tracking under-records actual use
(general-purpose appears for unnamed Task invocations). Zero recorded
invocations ≠ zero actual invocations.

**CH4 BS5:** Cross-reference audit required first. The agents are referenced in
CLAUDE.md Section 7, AGENT_ORCHESTRATION.md, potentially skills and teams.
Deletion without reference updates produces silent fallbacks to general-purpose.

### Evidence Weighting

| Evidence                                                                                                      | Source Tier                          | Direction                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------- |
| CH4 BS5: CLAUDE.md Section 7 has agent trigger table that must be updated                                     | T1: Filesystem ground truth          | Cross-reference audit required  |
| CH4 BS5: Grep for agent names across CLAUDE.md, skills/, teams/, AGENT_ORCHESTRATION.md is required           | T1: Standard refactoring hygiene     | Audit before delete             |
| CH1: Serendipity Finding 7 (research body) confirms tracker records "general-purpose" for unnamed invocations | T1: Verified finding in the research | Under-recording is confirmed    |
| V1 C-011 VERIFIED: The 9 stubs have boilerplate content with no SoNash applicability                          | T1: Ground truth                     | Deletion is the right direction |
| CH1 Challenge 1: 90-day stub cost is "near-zero"                                                              | T3: Effort estimate                  | Low-cost safety margin          |

Both CH1 and CH4 BS5 have T1 evidence supporting their positions. The deletion
direction is correct (stubs are boilerplate), but the process is incomplete
without two steps: a cross-reference audit and a redirect mechanism.

### Resolution: Delete WITH prerequisites and redirect stubs

**Process:**

**Step 1 (required before any deletion):** Cross-reference audit. For each of
the 9 agents, grep across: CLAUDE.md, AGENT*ORCHESTRATION.md, all skills/*.md
(including SKILL.md and prompts.md in each skill directory), all teams/\_.md,
.claude/state/agent-invocations.jsonl. Produce a reference map:
`agent-name -> [files that reference it]`. This is the CH4 BS5 mitigation.

**Step 2 (concurrent with deletion):** For any agent with confirmed zero
references (including zero invocation records AND zero skill/doc references),
delete the file. For agents with references (even documentation references),
replace with a redirect stub:

```markdown
---
name: error-detective
description:
  DEPRECATED. This agent has been consolidated into debugger. Invoke debugger
  instead.
---

This agent has been removed. Use `debugger` for systematic debugging tasks.
```

**Step 3 (after deletion):** Update every document that contained a reference:

- CLAUDE.md Section 7 trigger table: remove or redirect deleted agent entries
- AGENT_ORCHESTRATION.md: update capability map
- Skills that invoke by name: update to use the replacement agent

**Redirect stub duration:** 60 days (not 90 — 90 is conservative; 60 aligns with
typical session cadence for a solo developer and limits maintenance surface).

**Confidence change for the deletion action:** Move from "delete immediately" to
"delete after cross-reference audit confirms zero live references." The D7c
action table REMOVE decisions remain correct; only the process adds steps.

### Impact on RESEARCH_OUTPUT.md

- R6 (P1, Remove 9 stub agents): Add prerequisite: "Before deletion, run
  cross-reference audit (grep for each agent name across all CLAUDE.md, skills/,
  teams/, state files). Replace agents with redirect stubs for 60 days if any
  references are found."
- The action table dispositions (REMOVE 9, ELEVATE 3, etc.) are unchanged.

---

## D7: Solo Developer Feasibility (CH4 BS3)

### Positions

**Research:** Recommends 37-44 agent ecosystem after all P1/P2/P3 work.

**CH4 BS3:** Current agent management system is already too complex for a solo
developer to operate reliably (evidence: audit ran once, TDMS may not have run,
compliance test tests wrong behavior). Adding more complexity to a system with
unexecuted steps compounds the problem.

**PR2 secondary contradiction:** Archive CONTRARIAN_ANALYSIS.md: "The system is
over-engineered for a solo developer's CLI tool." New research did not address
this.

### Evidence Weighting

| Evidence                                                                                          | Source Tier         | Direction                                   |
| ------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------- |
| MEMORY.md: "solo developer" (project context)                                                     | T1: Canon           | Solo constraint is real                     |
| C-043 VERIFIED: TDMS integration may not have run post-March-17 audit                             | T1: Ground truth    | Current system already has unexecuted steps |
| V1 C-010 VERIFIED: compliance test tests wrong implementation                                     | T1: Ground truth    | Existing infrastructure is broken           |
| C-085 VERIFIED: audit skill has run exactly once in 12 days                                       | T1: Ground truth    | Operational cadence is low                  |
| Archive CONTRARIAN_ANALYSIS.md: "over-engineered for solo developer" (same concern, earlier date) | T1: Project archive | Persistent concern, not addressed           |
| CH4 BS3 calculation: 11 x 300 lines = 3,300 lines of new agent specs to write and maintain        | T3: Estimate        | Effort is substantial but speculative       |
| Consolidation goal: 26→17 reduces maintenance burden BEFORE expansion                             | T1: Research plan   | Consolidation creates capacity              |

The solo developer constraint is documented as T1 (MEMORY.md) and reinforced by
multiple ground-truth findings showing the current management system is already
underperforming at its current scale. The archive raised the same concern in
March 2026 and it was not addressed.

However, the research's recommendations are not ALL complexity-additive.
Consolidation (26→17) REDUCES maintenance surface. The `skills:` injection
approach (D3) REDUCES per-definition maintenance. The two pre-steps from D4 FIX
broken infrastructure.

The question is: what is the sustainable agent count for this project?

### Resolution: Hard ceiling of 30 total agents; apply solo-developer filter to P2/P3

**Rationale:** Current state is 39. Consolidation removes 9: 30 local/global.
The 6 new pipeline agents are in global (deep-research), so local stays at 17
after consolidation. Total: 17 local + 13 global (with 6 pipeline agents
replacing or adding to existing 13) = ~30. This is the ceiling.

**Filter applied to recommendations:**

- Any recommendation that adds agents BEYOND the pipeline set (6) requires
  removing one existing agent first ("one in, one out" rule at the ceiling).
- General-duty agents (refactoring-specialist, firebase-specialist, etc.) may be
  created only if one stub or redundant agent is simultaneously removed.
- Tracking and measurement overhead should be reduced before adding agents. R15
  (wire audit history into /alerts) replaces manual audit cadence reminders and
  is the highest-ROI quality infrastructure investment for a solo developer.

**Revised sustainable recommendation:**

- P1: Fix 2 infrastructure items + general-purpose override + consolidation
  cross-reference audit + 9 agent deletions/redirects
- P2: Create 6 pipeline agents (one at a time, pilot each) + 3 stub elevations +
  mcp-expert replacement + system overrides (5)
- P3: R15 (audit alerts), fix compliance test, refactoring-specialist IF
  capacity exists
- Defer: golden tests (R14) until P3 audit cadence is established (CH1 Challenge
  8 is correct)

**The "F to B in two cycles" claim should be restated.** It is an aspirational
headline without defined measurement. Change to: "Addressing P1+P2
recommendations, re-running audit-agent-quality with all agents scored, and
achieving a mean score ≥75/100 within 2 implementation cycles (estimated: 2
focused sessions)."

### Impact on RESEARCH_OUTPUT.md

- Executive Summary: Replace "F to B within two implementation cycles" with the
  defined measurement version above.
- Add "Solo Developer Constraint" section to Recommendations: state the 30-agent
  ceiling, one-in-one-out rule, and solo-developer filter for P2/P3 items.
- R14 (golden tests): Move to "if and only if R15 (audit cadence) established
  first."

---

## D8: Security-Auditor Model (CH1 Challenge 6)

### Positions

**Research:** security-auditor is one of 5 Tier A reference agents; the Finding
7.1 corrects the Opus cost to 1.67x (not 5x); the implied position is Opus
continues to be justified.

**CH1 Challenge 6:** "Consider `effort: max` on Sonnet as an alternative to
hardcoded `model: opus`, with a comparison audit after 30 days." Evidence: D4a's
"500+ vulnerability discovery" data is from an Anthropic multi-agent system, not
security-auditor specifically. The 1.67x cost multiplier compounds with
invocation frequency.

**CH4 BS8:** The `model: opus` in security-auditor.md is a bet that current
agent semantics persist. If Anthropic ships "inherit from CLAUDE.md by default,"
the override may become stale.

**CH2 D4b context:** "High-effort Sonnet ≠ Opus (different capabilities, not
just reasoning depth)." `effort: max` escalates reasoning depth on Sonnet; it
does not provide Opus's distinct capability profile.

### Evidence Weighting

| Evidence                                                                                           | Source Tier                                      | Direction                             |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| C-049: `effort: max = Opus 4.6 only` per D1b line 31 — UNVERIFIABLE (behavioral claim)             | T3: Official docs claim, not filesystem-verified | `effort: max` = Opus per docs         |
| CH1 Challenge 6: "effort: max enables Opus-level reasoning on Sonnet" — directly contradicts C-049 | T3: Research assertion                           | Contradicts UNVERIFIABLE official doc |
| D4b official Claude docs: model: and effort: are distinct frontmatter fields with distinct effects | T1: Official documentation                       | Model and effort are not equivalent   |
| D1b line 31: "max (Opus 4.6 only)" under effort field                                              | T1: Official docs verbatim                       | effort:max = Opus 4.6                 |
| D4a: 1.67x cost is confirmed from official pricing                                                 | T1: Official pricing page                        | Cost differential is modest           |
| CH1: "The research does not surface security-auditor invocation frequency"                         | T2: Gap identification                           | Cost impact is unknown                |

The critical factual question is: does `effort: max` run the model on Sonnet or
upgrade to Opus? D1b line 31 from official documentation states: "max (Opus 4.6
only)" — meaning `effort: max` selects Opus 4.6. If this is correct,
`effort: max` and `model: opus` are functionally equivalent paths to Opus 4.6.

If that is true, the D8 dispute simplifies: the question is not "Opus vs
Sonnet-with-effort" but "hardcoded `model: opus` vs `effort: max`." The
`effort: max` approach is preferable because:

1. It is the officially recommended pattern for task-adaptive model selection
   (Finding 7.2)
2. It degrades gracefully if Anthropic changes how effort maps to models
3. CH4 BS8's "treat overrides as temporary" principle applies: if Anthropic
   changes Opus semantics, `effort: max` adapts; `model: opus` does not

### Resolution: Switch security-auditor from `model: opus` to `effort: max`

**Rationale:** If `effort: max` selects Opus 4.6 (per D1b), this is a
no-quality-cost switch that:

- Achieves the same model assignment
- Uses the recommended frontmatter pattern over a hardcoded model string
- Reduces the versioning risk (if model IDs change, `effort: max` stays correct)

**The comparison-audit contingency:** Given that the `effort: max = Opus 4.6`
claim is from D1b (official docs via WebFetch, UNVERIFIABLE against the
filesystem), there is a small residual uncertainty. The resolution is:

- Make the switch in the next session when security-auditor.md is being updated
  anyway
- If behavioral differences are observed (which would imply `effort: max` ≠
  Opus), revert to `model: opus` with a documented rationale

**Defer decision:** Do NOT switch now if it creates a separate work item. Bundle
with the security-auditor correction work already needed (C-046: Python logging
anti-patterns, zero SoNash stack applicability). The security-auditor needs
substantial rewriting; update the model mechanism as part of that rewrite.

### Impact on RESEARCH_OUTPUT.md

- Finding 7.2: Add: "For existing agents using `model: opus` (currently only
  security-auditor), migration to `effort: max` is recommended when the agent is
  next substantively updated. `effort: max` selects Opus 4.6 per official
  documentation and is the preferred task-adaptive mechanism."
- Confidence change: The original "Opus stays" implicit recommendation becomes
  "migrate to effort: max at next substantive update" — same quality outcome,
  better long-term maintainability.

---

## D9: "F Grade" Significance (CH1 Challenge 10)

### Positions

**Research:** 54/100 F grade used as a foundational urgency signal throughout.
Executive Summary: "would transform the ecosystem from an F to a B."

**CH1 Challenge 10:** Single data point. No trend. Post-improvement score was 54
(pre was 51 — 6 agents improved in the audit session itself). 12 days of
unreflected improvements since the audit.

**V1 C-007 MODIFIED:** "decisions.skip=18 refers to 18 improvement ACTIONS being
deferred/skipped, not 18 unscored agents. agents_audited=36 confirms ALL 36
agents were scored." The "18 agents were skipped without scoring" in
RESEARCH_OUTPUT.md 2.1 is a misread of the JSONL schema.

### Evidence Weighting

| Evidence                                                                                  | Source Tier                  | Direction                      |
| ----------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| audit-agent-quality-history.jsonl: one entry, dated 2026-03-17, mean=51 pre, mean=54 post | T1: Ground truth             | Single data point confirmed    |
| agents_audited=36, categories=13: all agents were scored                                  | T1: Ground truth             | "18 unscored" claim is wrong   |
| C-085 VERIFIED: audit has not re-run in 12 days                                           | T1: Ground truth             | Baseline may be stale          |
| REFERENCE.md v1.7+v1.8 updates on 2026-03-29: significant template improvements           | T1: Git log confirmed        | Ecosystem improving post-audit |
| 3 new agents added post-audit with no scores                                              | T1: Ground truth             | Some degradation possible      |
| CH1 Challenge 10: "improvement happened within the audit session itself"                  | T2: Correct reading of JSONL | Self-correcting signal         |

V1 C-007 MODIFIED is T1 ground truth: the "18 unscored" claim in
RESEARCH*OUTPUT.md 2.1 is factually incorrect. All 36 agents were scored; 18
improvement \_actions* were deferred. This correction reduces the urgency signal
from "half the ecosystem is unscored" to "the mean score reflects all scored
agents, post in-session improvements."

CH1 Challenge 10's reframing is correct and better-evidenced: the audit shows a
system that self-corrected within one session (51→54). The "F grade" is real but
is a snapshot, not a trend. The urgency framing of the Executive Summary
overclaims.

### Resolution: Reframe from crisis to calibration signal

**The correct characterization (combining V1 correction + CH1 reframing):**

"The most recent quality audit (March 17, 2026) scored all 36 existing agents at
that time. Initial mean: 51/100. Post-session improvement (6 agents actively
improved): 54/100. The ecosystem demonstrated self-correction within the audit
session. Three new agents added post-audit are unscored. The F-grade designation
reflects a one-time measurement of the full roster before recent improvements;
it is not a static crisis but a diagnostic baseline showing the gap between the
current average and the Tier A reference standard (code-reviewer, explore,
frontend-developer, plan, security-auditor)."

**The urgency level is MEDIUM, not CRITICAL.** The recommendations are still
correct and valuable. The "F to B" framing should change to a defined
measurement target (see D7).

**The "18 skipped without scoring" error in RESEARCH_OUTPUT.md 2.1 must be
corrected.** This is a factual error (V1 C-007 MODIFIED with T1 evidence). The
correct reading: 18 improvement ACTIONS were deferred; ALL agents were scored.

### Impact on RESEARCH_OUTPUT.md

- Theme 2.1: Change "18 agents were skipped without scoring" to "18 improvement
  actions were deferred (all 36 agents were scored)."
- Executive Summary: Replace crisis framing with: "The most recent audit
  (March 17) scored all 36 agents at 54/100 post-session improvements. The F
  grade is a diagnostic baseline, not a static crisis — the ecosystem
  demonstrated self-correction within the audit session. Three post-audit agents
  are unscored."
- Confidence change for Finding 2.1: The core score data (54/100, one run)
  remains MEDIUM confidence. The "18 unscored" component changes from MEDIUM to
  REFUTED.

---

## D10: Hooks + Skills vs Agents Sequencing (CH3 Cross-Cutting)

### Positions

**Research:** Agents first. P1 is create general-purpose override and pipeline
agents. Hooks are existing infrastructure (mentioned but not prioritized as
alternatives).

**CH3 Alt 3 + Cross-Cutting Blind Spot A:** "Hooks + skills injection first,
then targeted agents only where those fail." 12 of 15 recommendations are
creation actions. Zero are "improve orchestration" or "extend hook coverage."
Hooks enforce structural constraints without consuming context window and cover
ALL agents (not just overridden ones).

**CH4 BS2 Mitigation:** Infrastructure (validation, cross-reference audit)
before agents.

### Evidence Weighting

| Evidence                                                                                                                                                            | Source Tier                                      | Direction                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| firestore-rules-guard.js: confirmed existing PreToolUse hook blocking direct Firestore writes                                                                       | T1: Ground truth                                 | Hooks already work for structural constraints                        |
| .claude/settings.json: PreToolUse/PostToolUse hooks confirmed configured                                                                                            | T1: Ground truth                                 | Hook infrastructure is live                                          |
| CH3: hook fires for all 39 agents + general-purpose; override only covers one agent at a time                                                                       | T1: Architectural observation                    | Hooks have broader coverage                                          |
| CH3 Alt 3: A PostToolUse Write hook scanning for forbidden import patterns would catch violations "across all agents without requiring any agent definition update" | T1: Feasibility confirmed from hook architecture | Hooks extend coverage cheaply                                        |
| CH3 Alt 3: "hooks enforce constraints without consuming context window. An agent override uses 100-180 lines of system prompt to verbally instruct the model."      | T2: Correct architectural distinction            | Hooks are more efficient for structural enforcement                  |
| D1 finding: CLAUDE.md IS inherited (D1 resolution)                                                                                                                  | T1: Ground truth                                 | Agent overrides address specificity gaps, not structural enforcement |

The D1 resolution (CLAUDE.md IS inherited) changes the cost-benefit of the
general-purpose override. If CLAUDE.md security rules are already present in all
invocations, the override provides specificity (stack versions, examples,
structured returns) rather than security enforcement. Hooks already handle the
structural enforcement layer (firestore writes, deploy safeguards). The override
and hooks are therefore complementary, not competing.

CH3 Alt 3's recommendation to "extend hook coverage to structural constraints"
is sound and backed by T1 evidence (existing hooks work exactly this way). The
specific hook suggested — a PostToolUse Write hook scanning for forbidden import
patterns — is the natural extension of the existing firestore-rules-guard.js
pattern.

### Resolution: Complementary layers with explicit role separation

**The correct implementation order:**

1. **Hooks (P1, before agents):** Extend hook coverage for structural constraint
   enforcement. The PostToolUse Write hook for direct Firestore import detection
   is the highest-ROI single addition (covers all 39 agents + general-purpose,
   zero context window cost, one implementation). This closes the actual
   security gap that D1 resolution revealed was NOT covered by agent overrides
   (since CLAUDE.md handles the rules verbally, but hooks handle them
   mechanically).

2. **Skills injection (P1, concurrent):** Create `sonash-context` shared skill.
   Verify injection position. This enables smaller, maintainable agent
   definitions.

3. **Agent overrides (P1, after hooks are verified):** The general-purpose
   override provides specificity injection (stack versions, patterns, structured
   returns) and remains P1 — but its urgency is moderate not critical, since
   hooks cover the structural enforcement gap and CLAUDE.md covers the rule
   inheritance gap.

4. **New pipeline agents (P2, after infrastructure):** Per D4, pilot one agent
   first.

**The role separation is:**

- Hooks: enforce structural constraints (imports, write targets, deployment
  gates) — model-independent, zero context cost
- Skills injection: share context (versions, patterns) across agents — one
  maintenance point
- Agent overrides: inject specificity (examples, structured returns, explicit
  patterns) — covers gaps that hooks and CLAUDE.md inheritance don't reach

### Impact on RESEARCH_OUTPUT.md

- R1 (general-purpose override) remains P1 but add: "Note: hooks handle
  structural constraint enforcement (import patterns, write gates); the override
  handles specificity injection (stack versions, examples, structured returns).
  These are complementary."
- Add R0 (pre-R1): "Extend PostToolUse Write hook to detect forbidden direct
  Firestore import patterns in new .ts/.tsx files. This provides structural
  constraint enforcement across all 39 agents simultaneously, without context
  window cost." Place at P1, before R1.
- Downgrade R1 urgency description from "highest-leverage single action" to
  "highest-leverage specificity injection action" — acknowledging the hook
  extension is the highest-leverage security enforcement action.

---

## Impact on RESEARCH_OUTPUT.md — Consolidated Change List

### Claims that change (MODIFIED or REFUTED)

| Claim                                                   | Original                                                       | Resolved Position                                                                         | Dispute      |
| ------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| Executive Summary: security boundary absence            | "agents without project context produce violations"            | Change to "context incompleteness" — CLAUDE.md IS inherited                               | D1           |
| Theme 1.1: CLAUDE.md inheritance                        | "No CLAUDE.md context is inherited unless explicitly included" | CLAUDE.md loads automatically; agent body replaces base prompt only                       | D1           |
| Theme 2.1: "18 agents skipped without scoring"          | 18 unscored                                                    | All 36 scored; 18 improvement actions deferred (JSONL misread)                            | D9, V1 C-007 |
| Theme 2.1: F grade framing                              | Crisis signal                                                  | Calibration signal; self-correcting evidence visible                                      | D9           |
| Theme 4.3: "all run without SoNash security boundaries" | No boundaries                                                  | Boundaries via CLAUDE.md; lacks specificity and structure                                 | D1           |
| R1 (general-purpose override) urgency                   | "Highest-leverage single action"                               | "Highest-leverage specificity injection; hooks are highest-leverage security enforcement" | D1, D10      |
| R6 (Remove 9 agents) process                            | "Delete immediately"                                           | Delete after cross-reference audit; add redirect stubs                                    | D6           |
| Section 9.2 (convergence-loop-verifier ROI)             | "Highest-ROI net-new agent"                                    | Move to P3; skills injection may achieve equivalent stabilization                         | D5           |
| Section 9.5 (pattern-promotion agent)                   | R12 (P3)                                                       | REJECT unconditionally                                                                    | D5           |
| R7 (frontmatter validation hook)                        | P1                                                             | P2 (after known quality problems addressed manually)                                      | D4           |
| security-auditor `model: opus`                          | Keep as-is (implicit)                                          | Migrate to `effort: max` at next substantive update                                       | D8           |
| "F to B in two cycles"                                  | Aspirational headline                                          | Defined target: mean ≥75/100 in next full audit, all agents scored                        | D7, D9       |

### Claims that survive unchanged

| Claim                                                                                                  | Basis                                                                             |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Consolidation action table: REMOVE 9, ELEVATE 3, REPLACE 1, MODIFY 1, KEEP 8, DEFER 2                  | D7c ground truth, unaffected by disputes                                          |
| 6 pipeline agents needed (verifier, contrarian, OTB, dispute-resolver, gap-pursuer, final-synthesizer) | D2: structural requirements confirmed                                             |
| Deep-research pipeline gap (Phase 2.5 has no template)                                                 | C-016 VERIFIED: T1 ground truth                                                   |
| Compliance test tests wrong implementation                                                             | C-010 VERIFIED: T1 ground truth                                                   |
| Global agent runtime sync gap                                                                          | C-013 VERIFIED: T1 ground truth                                                   |
| 1.67x Opus/Sonnet cost differential                                                                    | D4a official pricing: T1                                                          |
| Tier A agents (code-reviewer, explore, frontend-developer, plan, security-auditor)                     | C-008 VERIFIED: T1                                                                |
| research-plan-team needs 4 refinements                                                                 | C-068 VERIFIED: T1                                                                |
| mcp-expert references nonexistent paths                                                                | C-044 VERIFIED: T1                                                                |
| security-engineer Python logging anti-patterns                                                         | C-046 VERIFIED: T1                                                                |
| Archive position on FIRE (domain-mismatch for codebase verification)                                   | CH2 Challenge 5 HIGH confidence: FIRE savings don't transfer to filesystem claims |
| iMAD 92% savings not deployable as heuristic                                                           | CH2 Challenge 4 HIGH confidence                                                   |

---

## Net Impact Summary

### Claims changed by disputes

- **RESEARCH_OUTPUT.md claims changed:** 11 (see table above)
- **Claims REFUTED:** 2 (CLAUDE.md not inherited → inherited; "18 unscored" →
  all scored)
- **Claims MODIFIED:** 7 (framing/urgency changes, priority changes, process
  additions)
- **Claims REJECTED (new agents):** 2 (pattern-promotion agent rejected;
  convergence-loop-verifier deferred)
- **Claims ADDED (new recommendations):** 3 (R0 hook extension;
  P0-Infrastructure prerequisites; Creation Gate for new agents)

### Confidence distribution after disputes

| Category                                                      | Count | Change from Original                                       |
| ------------------------------------------------------------- | ----- | ---------------------------------------------------------- |
| HIGH confidence (T1 verified, undisputed)                     | 42    | Unchanged                                                  |
| MEDIUM confidence (disputed, recalibrated, or external-only)  | 38    | +6 (upgraded) / +4 (downgraded)                            |
| LOW confidence (external academic, domain-mismatch confirmed) | 12    | +3 (FIRE, iMAD, DRAGged codebase applicability downgraded) |
| UNVERIFIED (external behavioral)                              | 8     | Unchanged                                                  |
| REFUTED by disputes                                           | 2     | New category                                               |

### Overall confidence: MEDIUM-HIGH

The core research corpus is well-grounded in T1 filesystem evidence. The
disputes primarily affected framing (urgency, threat model), sequencing
(priority order), and scope (agent count ceiling). No disputes invalidated the
primary technical findings (consolidation table, pipeline gap, compliance test
failure, global sync gap, Tier A agents, 1.67x pricing).

The research direction is sound. The implementation is more conservative, more
sequenced, and more maintenance-aware after dispute resolution than before.

---

## Sources Consulted

| #   | Source                                                               | Type                       | Trust | Date       |
| --- | -------------------------------------------------------------------- | -------------------------- | ----- | ---------- |
| 1   | `.research/custom-agents/RESEARCH_OUTPUT.md`                         | L4 synthesis               | HIGH  | 2026-03-29 |
| 2   | `.research/custom-agents/findings/V1-claims-1-50.md`                 | Verification pass 1        | HIGH  | 2026-03-29 |
| 3   | `.research/custom-agents/findings/V2-claims-51-100.md`               | Verification pass 2        | HIGH  | 2026-03-29 |
| 4   | `.research/custom-agents/challenges/CH1-contrarian-consolidation.md` | Contrarian challenge       | HIGH  | 2026-03-29 |
| 5   | `.research/custom-agents/challenges/CH2-contrarian-new-agents.md`    | Contrarian challenge       | HIGH  | 2026-03-29 |
| 6   | `.research/custom-agents/challenges/CH3-otb-alternatives.md`         | OTB challenge              | HIGH  | 2026-03-29 |
| 7   | `.research/custom-agents/challenges/CH4-otb-blindspots.md`           | OTB meta-challenge         | HIGH  | 2026-03-29 |
| 8   | `.research/custom-agents/findings/PR1-prior-research-agent-env.md`   | Prior research comparison  | HIGH  | 2026-03-29 |
| 9   | `.research/custom-agents/findings/PR2-prior-research-archive.md`     | Archive comparison         | HIGH  | 2026-03-29 |
| 10  | `.research/custom-agents/findings/D1b-agent-format-docs.md`          | Official frontmatter docs  | HIGH  | 2026-03-29 |
| 11  | `.research/custom-agents/findings/D7c-consolidation-synthesis.md`    | Consolidation ground truth | HIGH  | 2026-03-29 |
| 12  | `.claude/state/audit-agent-quality-history.jsonl`                    | Audit JSONL (single entry) | HIGH  | 2026-03-17 |
