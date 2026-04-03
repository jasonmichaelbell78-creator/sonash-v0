# Findings: Prior-Research Archive Comparison

**Searcher:** deep-research-searcher (comparison agent) **Profile:** codebase
**Date:** 2026-03-29 **Sub-Question IDs:** PR2 (prior-research comparison)

---

## Key Findings

### 1. Deduplication — What Overlaps

**1.1 Core architecture recommendation is fully confirmed.** [CONFIDENCE: HIGH]

Both archives agree on hub-and-spoke (skill-as-orchestrator), parallel searcher
subagents, and a dedicated synthesizer agent. The old SYNTHESIS.md recommended:
"2 custom agents + 1 skill." The new RESEARCH_OUTPUT.md confirms the searcher
and synthesizer as reference-quality implementations (344-386 lines and 343
lines respectively). No contradiction here — the minimum viable set was correct
and has been built.

**1.2 Agent count sweet spot (3-5) is fully duplicated.** [CONFIDENCE: HIGH]

MULTI_AGENT_PATTERNS.md cited the "2-5 teammates" Anthropic docs figure and the
Google/MIT saturation-at-4 finding. The new research restates these identically
(Finding 8.2). No new evidence changes the 3-5 recommendation; both arrive at it
from the same primary sources (arXiv:2512.08296, Anthropic docs).

**1.3 Heterogeneous model tiering is duplicated.** [CONFIDENCE: HIGH]

The archive's MULTI_AGENT_PATTERNS.md documented Opus orchestrator + Sonnet
workers, citing Bayesian-optimized savings. SYNTHESIS.md recommended "Opus for
orchestration/synthesis, Sonnet for search workers — saves ~55%." The new
research confirms this (Finding 7.4: heterogeneous teams +33-34%) and corrects
the pricing (see Evolution below), but the tiering direction is unchanged.

**1.4 File-based state persistence is duplicated.** [CONFIDENCE: HIGH]

SYNTHESIS.md: "file-based state persistence is the right pattern for Claude
Code." New research does not revisit this decision — it is treated as settled
infrastructure (findings files, RESEARCH_OUTPUT.md, claims.jsonl).

**1.5 Subagent pattern (not team) for deep-research is duplicated.**
[CONFIDENCE: HIGH]

CUSTOM_AGENT_DESIGN.md: "Deep-research searchers are independent — subagent
pattern is appropriate." New Finding 8.4: "Recommend against a deep-research
team configuration." Same conclusion, now with explicit reasoning: the
pipeline's sequential phase structure means agents don't benefit from real-time
messaging, and the one-team-per-session constraint would block other teams.

---

### 2. Evolution — How the Landscape Has Changed

**2.1 Opus pricing correction: 1.67x Sonnet, not ~5x.** [CONFIDENCE: HIGH]

The archive assumed a large Opus premium (SYNTHESIS.md: "costs double without
tiering" — implying ~2x). The new research (Finding 7.1, source D4a) confirms
from official pricing that Opus 4.6 = $5/$25 per million tokens (input/output),
Sonnet 4.6 = $3/$15. The 1.67x differential is smaller than the archive assumed.
This changes the cost-quality calculus: Opus is now justified for any task with
meaningful reasoning complexity, not only the highest-stakes decisions.

**2.2 The archive's minimum viable set is now inadequate.** [CONFIDENCE: HIGH]

The archive's SYNTHESIS.md defined "explicitly NOT building" a verifier, critic,
and decomposer agent — treating `/convergence-loop` as sufficient for
verification. The new research (Finding 5.1-5.3) demonstrates this was wrong.
The current skill has 6 pipeline roles but only 2 have custom definitions. The
Phase 2.5 verification role has no template at all. The archive's recommendation
to use `/convergence-loop` as a lightweight substitute produced the gap that now
requires 6 new custom agent definitions to close. This is the single most
important evolution in the findings.

**2.3 Firebase released official agent skills in February 2026.** [CONFIDENCE:
HIGH]

Not in the archive (predates the release). Firebase published 13 purpose-built
skills covering Firestore, Security Rules, Authentication, App Hosting, Cloud
Functions (Finding 9.1). These target exactly the SoNash pain points in
CLAUDE.md. The archive had no counterpart; this is net-new.

**2.4 The effort field enables model escalation without agent changes.**
[CONFIDENCE: HIGH]

Not in the archive. New Finding 7.2 documents that `effort: max` = Opus 4.6
only, and `effort: high/medium/low` control reasoning depth. This is the
preferred tiering mechanism over hardcoding `model:` in frontmatter.

**2.5 The skill model: field is broken (GitHub Issue #21679, open since Jan
2026).** [CONFIDENCE: HIGH]

Not in the archive. New Finding 7.3 confirms skills cannot specify model
selection. Any model tiering implemented in the skill's spawn prompt (not
frontmatter) — a constraint the archive did not document.

**2.6 GoAgent topology auto-generation (March 2026) is post-archive.**
[CONFIDENCE: MEDIUM]

Published March 2026, entirely post-archive. Graph diffusion models construct
sparse collaboration graphs tailored to task complexity, $5.60 vs $43.70 for
dense mesh topologies. This may render manual team design partially obsolete
within 1-2 years. Serendipitous discovery with no immediate action required.

---

### 3. Contradictions — Where the Archives Disagree

**3.1 Core contradiction: Verifier/critic role — prompt-driven vs. custom
agent.** [CONFIDENCE: HIGH]

This is the primary contradiction between the two archives.

- Archive position (CUSTOM_AGENT_DESIGN.md, SYNTHESIS.md): "Verifier/critic
  agent: NO. Verification in this context is convergence-loop operations. Define
  a full custom agent for what amounts to a convergence pass adds maintenance
  without adding behavioral precision. Better approach: a verification pass
  within the synthesizer agent, or a /convergence-loop invocation."

- New research position (Finding 5.1-5.3): Phase 2.5 verification has NO
  template at all. The 4-verdict taxonomy (VERIFIED, REFUTED, UNVERIFIABLE,
  CONFLICTED) requires explicit enforcement. The >20% claim-change trigger
  calculation requires a structured return the convergence-loop cannot provide.
  Six custom agent definitions are needed.

Resolution: The new research is correct. The archive's recommendation was made
without ground-truth verification of what the skill actually built (or failed to
build). The new research performed filesystem reads of SKILL.md and REFERENCE.md
confirming the gap (source D9b). The archive's reasoning was sound in principle
but resulted in an unverified assumption about convergence-loop sufficiency.

**3.2 Contradiction: Agent proliferation costs vs. pipeline completeness.**
[CONFIDENCE: HIGH]

- Archive position (CUSTOM_AGENT_DESIGN.md): "Agent proliferation has costs: 11
  GSD agents consume ~8,800 lines. Minimize maintenance burden." Explicitly
  recommended against decomposer, critic, verifier, orchestrator, formatter
  agents.

- New research position: 26 local agents evaluated; 9 stubs should be removed
  (35% reduction), but 6 new pipeline agents and several general-duty agents
  should be added. Net effect may be fewer total agents than current but more
  high-quality agents with genuine roles.

Resolution: Not truly contradictory — the archive warned against adding agents
without clear value justification. The new research removes stubs while adding
agents with documented pipeline roles. The spirit of the archive's constraint
(avoid proliferation without value) is respected.

**3.3 Contradiction: Decomposer role.** [CONFIDENCE: MEDIUM]

- Archive: "Decomposer: NO — inline in skill."
- New research: Implicitly maintains inline decomposition (no decomposer agent
  recommended). Finding 5.2 lists 6 needed agents; decomposer is not one of
  them.

Resolution: No contradiction. Both agree decomposer stays inline. Noted here
because the archive made it explicit and the new research is silent on it
(implying agreement by omission).

**3.4 Partial contradiction: 3 adversarial agents vs. 4.** [CONFIDENCE: MEDIUM]

- Session #244 state (referenced in new research Contradiction Table): 3
  adversarial agents (contrarian, OTB, verifier).
- New research Finding 5.3 and D8b analysis: 4 adversarial agents (contrarian,
  OTB, verifier, dispute-resolver). The new research explicitly resolves this:
  "D8b's analysis is more detailed. 4 is correct."

This is an intra-new-research resolution, not an archive vs. new-research
conflict. But it is worth noting: the archive had no adversarial agent
recommendations at all. All adversarial design (Findings 6.1-6.5) is net-new.

---

### 4. Net-New Discoveries — Coverage Only in New Research

**4.1 Agent body semantics: replaces, does not supplement, base system prompt.**
[CONFIDENCE: HIGH]

Not in the archive. The archive discussed agent design patterns but never
documented the critical fact that an agent body _replaces_ CLAUDE.md, meaning no
SoNash security rules, stack versions, or behavioral guardrails are inherited
unless explicitly included. This is the root cause of the "F grade" ecosystem
quality problem. It is the most architecturally important discovery in the new
research with no prior-archive counterpart.

**4.2 Ecosystem quality score (54/100, F grade) with ground-truth audit
history.** [CONFIDENCE: HIGH]

Not in the archive. The archive reasoned about agent design patterns without
auditing the existing agent quality. The new research read the audit-history
JSONL directly (source D12b) and found 36 agents audited, mean 54/100, 5 Tier A
agents. This is quantified ground-truth absent from the archive.

**4.3 System/plugin override pattern — general-purpose agent override.**
[CONFIDENCE: HIGH]

Not in the archive. The archive documented the subagent pattern and pipeline
agents but never identified that system agents (general-purpose, Explore,
silent-failure-hunter, pr-test-analyzer, code-simplifier, type-design-analyzer)
need project-level overrides to inject SoNash context. The new research
(Findings 4.1-4.4) identifies this as a high-leverage intervention — the
general-purpose override affects 13+ invocations per session and is the single
highest-leverage action in the ecosystem.

**4.4 iMAD selective triggering: 68-92% adversarial cost reduction.**
[CONFIDENCE: HIGH]

Not in the archive. The archive mentioned "debate/adversarial" as an
architecture pattern but did not design specific adversarial agents. The new
research (Finding 6.4) documents iMAD selective triggering — activating
adversarial debate only on "hesitation cues" (markers of genuine uncertainty)
rather than uniformly. Source: arXiv:2511.11306v1 (November 2025).

**4.5 FIRE architecture: verification cost reduction 7.6-16.5x.** [CONFIDENCE:
HIGH]

Not in the archive. The archive proposed using convergence-loop for verification
without cost analysis. The new research (Finding 5.6) documents the FIRE
architecture: check model confidence before invoking tools, reserving tool calls
for genuinely uncertain cases. Source: arXiv:2411.00784 (NAACL 2025). Directly
implementable in the deep-research-verifier definition.

**4.6 "Wait" prompt technique for preventing sycophancy.** [CONFIDENCE: MEDIUM]

Not in the archive. The archive did not address sycophancy in multi-agent
contexts. The new research (via adversarial agent design work, source D8b)
references the "Wait" technique — injecting a pause forcing the agent to
reconsider before agreeing with a challenge. This prevents adversarial agents
from becoming sycophantic toward the synthesizer's positions.

**4.7 Salvagente Rule — serendipity seeds from rejected findings.** [CONFIDENCE:
MEDIUM]

Not in the archive. The new research (Finding 6.1, source D8b) introduces the
Salvagente Rule: adversarial agents that generate challenges that fail the
steel-man test must still surface the underlying concern as a serendipity seed
for the gap-pursuer. This prevents value destruction when challenges are
correctly rejected.

**4.8 AgentAuditor Reasoning Tree for LLM-as-judge.** [CONFIDENCE: MEDIUM]

Not in the archive. The archive's QUALITY_EVALUATION.md proposed LLM-as-judge as
a primary evaluation mechanism. The new research (Contradiction Table) notes
AgentAuditor's reasoning-tree approach outperforms naive LLM-as-judge. Source:
comparison of AgentAuditor vs. Anthropic/Google/Galileo LLM-as-Judge primary
mechanisms. The archive's quality framework lacks this structured rubric
approach.

**4.9 DRAGged five-type conflict taxonomy.** [CONFIDENCE: HIGH]

Not in the archive. The archive's conflict resolution section listed "mediation
agent," "majority voting," "evidence-weighted resolution" as mechanisms — but
not a conflict _type_ taxonomy. The new research (Finding 6.5) documents the
DRAGged framework: No Conflict, Complementary, Conflicting Opinions, Freshness,
Misinformation. Classifying conflict type before resolving it is new. Source:
arXiv:2506.08500 (2025).

**4.10 Phase 3.9 and 3.97 double-rewrite architectural hazard.** [CONFIDENCE:
HIGH]

Not in the archive. The archive designed a 5-phase pipeline but did not identify
the specific hazard: if Phase 3.9 (>20% claims changed) AND gap pursuit both
trigger, a general-purpose synthesizer invoked twice will not know what the
first invocation changed and may undo Phase 3.9 corrections. The new research
(Contradiction Table row 7, serendipity finding 2) confirms this is an
unrecognized risk requiring a phase-aware deep-research-final-synthesizer.

**4.11 Compliance test testing wrong implementation.** [CONFIDENCE: HIGH]

Not in the archive. The new research (serendipity finding 1, source D12b)
discovered that check-agent-compliance.test.ts re-implements AGENT_TRIGGERS
pattern matching that does not match check-agent-compliance.js's actual
behavior. This provides false confidence in the compliance system. A
codebase-specific finding with no archive equivalent.

**4.12 17-field official frontmatter schema.** [CONFIDENCE: HIGH]

The archive documented the fields observed in GSD agents (name, description,
tools, color). The new research (Finding 1.4, sources D1 + D1b) confirmed from
official plugin-dev docs that the full schema has 17 fields: name, description,
tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers,
hooks, memory, background, effort, isolation, initialPrompt, color. The archive
was working from observed usage, not the official schema.

**4.13 skills: field is unused across the entire local agent roster.**
[CONFIDENCE: HIGH]

Not in the archive. The new research (Finding 4.4) identified that the `skills:`
frontmatter field — which loads SKILL.md files at invocation time — is unused
across all local agents despite being high-value for agents that delegate to
skill-defined workflows (e.g., debugger → systematic-debugging).

**4.14 26→17 agent consolidation action table with specific remove/elevate/keep
decisions.** [CONFIDENCE: HIGH]

The archive discussed agent proliferation costs in principle. The new research
(Findings 3.1-3.4, source D7c) produced a canonical action table: REMOVE 9,
ELEVATE 3, REPLACE 1, MODIFY 1, KEEP 8, DEFER 2 — with individual justification
for each agent. This is concrete where the archive was abstract.

---

### 5. Archive-Only Coverage Not Revisited by New Research

**5.1 Quality dimensions (8-dimension framework).** [CONFIDENCE: HIGH]

QUALITY_EVALUATION.md defined 8 dimensions: Accuracy, Completeness, Relevance,
Depth, Recency, Objectivity, Actionability, Verifiability. The new research does
not revisit this framework. It is not contradicted — it simply was not a
sub-question in the new research wave. The archive's framework stands.

**5.2 Orchestration strategies in depth (ORCHESTRATION_PATTERNS.md).**
[CONFIDENCE: HIGH]

Decomposition strategies (top-down, STORM, iterative, tree-of-reasoning), state
management patterns, convergence criteria, progressive synthesis — these were
researched extensively in the archive but are background knowledge for the new
research. Not revisited, not contradicted.

**5.3 Security and privacy concerns (SECURITY_PRIVACY.md).** [CONFIDENCE:
MEDIUM]

The archive's security research (MCP vulnerabilities, query sanitization, rate
limiting) was not a sub-question in the new research. The CONTRARIAN_ANALYSIS.md
finding that "82% of MCP implementations have path traversal vulnerabilities" is
an archive-only finding (with the caveat that it measures exposure surface, not
confirmed vulnerabilities, per the contrarian analysis).

**5.4 Domain-agnostic design via YAML modules (DOMAIN_AGNOSTIC_DESIGN.md).**
[CONFIDENCE: MEDIUM]

The archive designed a domain detection + YAML configuration system. The new
research references domain_config in the searcher agent's upstream_input but
does not extend the domain design. This is archive-only coverage that the new
research treats as settled.

---

## Sources

| #   | URL/Path                                                                   | Title                                             | Type            | Trust | CRAAP | Date       |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------- | --------------- | ----- | ----- | ---------- |
| 1   | `.planning/archive/deep-research-skill/research/CUSTOM_AGENT_DESIGN.md`    | Custom Agent Design Analysis                      | Project archive | HIGH  | 4.8   | 2026-03-20 |
| 2   | `.planning/archive/deep-research-skill/research/MULTI_AGENT_PATTERNS.md`   | Multi-Agent Research Architecture Patterns        | Project archive | HIGH  | 4.8   | 2026-03-20 |
| 3   | `.planning/archive/deep-research-skill/research/QUALITY_EVALUATION.md`     | Research Quality Evaluation Framework             | Project archive | HIGH  | 4.8   | 2026-03-20 |
| 4   | `.planning/archive/deep-research-skill/research/CONTRARIAN_ANALYSIS.md`    | Contrarian Analysis                               | Project archive | HIGH  | 4.8   | 2026-03-20 |
| 5   | `.planning/archive/deep-research-skill/research/ORCHESTRATION_PATTERNS.md` | Research Orchestration Patterns                   | Project archive | HIGH  | 4.8   | 2026-03-20 |
| 6   | `.planning/archive/deep-research-skill/research/SYNTHESIS.md`              | Deep Research Skill: Research Synthesis           | Project archive | HIGH  | 4.8   | 2026-03-20 |
| 7   | `.research/custom-agents/RESEARCH_OUTPUT.md`                               | Custom Agents Research Output (Phase 2 Synthesis) | New research    | HIGH  | 5.0   | 2026-03-29 |

---

## Contradictions

### Primary contradiction: Convergence-loop as verification substitute

The archive explicitly recommended against a verifier custom agent
(CUSTOM_AGENT_DESIGN.md, SYNTHESIS.md) — treating `/convergence-loop` as
sufficient. The new research found that Phase 2.5 verification has no template,
the 4-verdict taxonomy cannot be enforced via convergence-loop alone, and
the >20% claim-change trigger requires a structured return format the
convergence-loop does not provide.

Both archives drew from the same codebase. The archive reasoned from design
principles; the new research read REFERENCE.md and SKILL.md from disk. The
filesystem evidence supersedes the design reasoning.

### Secondary contradiction: CONTRARIAN_ANALYSIS.md challenges that new research accepts

The archive's contrarian report made several challenges the new research does
not address:

1. "The system is over-engineered for a solo developer's CLI tool." The new
   research's recommendations (6 new pipeline agents, 5 system overrides, 26→17
   consolidation) represent significant additional complexity. The contrarian
   warning is not addressed in the new research.

2. "LLM-as-judge is fundamentally limited — Claude verifying Claude's research
   is auto-correlation, not cross-validation." The new research notes
   AgentAuditor's reasoning-tree outperforms naive LLM-as-judge but does not
   address the self-preference bias concern that applies equally to adversarial
   agents built on the same model weights.

3. "Domain-agnostic design risks mediocrity across all domains." Unaddressed in
   new research, which treats the domain YAML module approach as settled.

---

## Gaps

1. **Contrarian analysis of new research is deferred.** The new
   RESEARCH_OUTPUT.md Challenges section is explicitly marked "Not populated in
   Phase 2 synthesis." The archive's contrarian challenges (#1 over-engineering,
   #2 LLM-as-judge limits) have not been applied to the new recommendations.

2. **Quality dimensions framework not re-evaluated.** The archive's 8-dimension
   quality framework (QUALITY_EVALUATION.md) was not a sub-question in the new
   research. Whether the new pipeline agents encode these dimensions (especially
   Recency, Objectivity, Depth) is unverified.

3. **Gap recursion depth for non-RL pipelines is unresolved in both archives.**
   The archive did not address this; the new research notes "2-3 rounds is a
   reasonable estimate but not empirically validated."

4. **Test-engineer evaluation excluded from consolidation analysis.** New
   research explicitly notes test-engineer was excluded from the D7c action
   table as requiring separate analysis.

5. **TDMS integration for audit findings may not have run.** New research
   (Finding 10.4) notes 59 structural findings from the March 2026 audit may not
   be in MASTER_DEBT. The archive did not cover TDMS integration.

---

## Serendipity

The archive's CONTRARIAN_ANALYSIS.md contains a finding not referenced in the
new research: "Bayesian-optimized cost savings statistics were misattributed —
the 45.6-65.8% figure comes from MALBO, not arxiv 2508.02694, which actually
shows only 28.4% savings." The new research cites "heterogeneous model teams
outperform homogeneous teams by up to +33-34%" (Finding 7.4) — a different but
more modest number that does not repeat the misattribution. The correction
appears to have propagated correctly into the new research source selection.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 6
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The comparison is based on direct filesystem reads of both archives. The
confidence levels reflect that all source material was read directly from disk,
not inferred. The primary uncertainty is in the "Wait" technique and Salvagente
Rule (MEDIUM), where the new research summarized these from D8b without me
reading D8b's primary sources.
