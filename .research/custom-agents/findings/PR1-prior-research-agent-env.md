# Findings: Prior Research Comparison — Agent Environment Analysis vs New Research

**Searcher:** deep-research-searcher (prior-research comparison agent)
**Profile:** codebase **Date:** 2026-03-29 **Sub-Question IDs:** PR1

---

## Overview

**Prior research:** `.planning/agent-environment-analysis/` (Sessions #225-236,
2026-03-17 to 2026-03-24) Files compared: PLAN.md, DIAGNOSIS.md, DECISIONS.md,
AGENT_INVENTORY.md, WORKFLOW_GAPS.md, RESEARCH_SYNTHESIS.md,
EXTERNAL_RESEARCH.md, AGENT_TEAMS_RESEARCH.md

**New research:** `.research/custom-agents/RESEARCH_OUTPUT.md` (2026-03-29,
29-agent L4 run)

---

## 1. Deduplication

**18 findings are substantively the same across both bodies of research.**

| #   | Finding                                                                                         | Prior Location                                                             | New Research Location                                                      |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| D1  | Stub agents dominate and are the core quality problem                                           | DIAGNOSIS.md §Key Findings #1, RESEARCH_SYNTHESIS.md Theme 1               | Theme 2.3 — 9 stubs identified                                             |
| D2  | 11 unused frontmatter fields (disallowedTools, maxTurns, memory, etc.)                          | EXTERNAL_RESEARCH.md Source 1 table, RESEARCH_SYNTHESIS.md Theme 2         | Theme 1.4 (17-field schema confirmed) — same 11 unused fields listed       |
| D3  | Invocation tracking is blind — tracks skills, not agents                                        | AGENT_INVENTORY.md §Invocation Tracking Gap, RESEARCH_SYNTHESIS.md Theme 3 | Theme 10.4 — audit TDMS gap; D12b confirms same tracking blindness         |
| D4  | Debugging cluster redundancy: debugger + error-detective + devops-troubleshooter = 80%+ overlap | AGENT_INVENTORY.md §Debugging Group, RESEARCH_SYNTHESIS.md Theme 4         | Theme 3.3 — confirmed, REMOVE error-detective and devops-troubleshooter    |
| D5  | Documentation cluster: technical-writer + documentation-expert = 95%+ overlap                   | AGENT_INVENTORY.md §Documentation Group, RESEARCH_SYNTHESIS.md Theme 4     | Theme 3.3 — both noted; technical-writer elevated (different disposition)  |
| D6  | dependency-manager and documentation-expert missing tools declarations                          | AGENT_INVENTORY.md Pass 2 Tally, RESEARCH_SYNTHESIS.md P0                  | Theme 2.3 (stub/quality issues list)                                       |
| D7  | gsd-nyquist-auditor tools declared as YAML list (non-standard)                                  | AGENT_INVENTORY.md Pass 2 Tally                                            | Not re-surfaced in new research (gap — see §5)                             |
| D8  | GSD ecosystem is coherent and well-designed; no redundancy                                      | AGENT_INVENTORY.md §GSD Ecosystem                                          | Theme 2.2 — explore, code-reviewer, security-auditor are Tier A references |
| D9  | model: unspecified on some agents                                                               | DIAGNOSIS.md §Current Ecosystem                                            | Theme 4.1 — global agents have no model field at runtime                   |
| D10 | Agent Teams enabled (settings.json) but never used in production                                | DIAGNOSIS.md §Key Findings #6, AGENT_TEAMS_RESEARCH.md                     | Theme 8.1 — teams architecturally sound but member definitions are ad-hoc  |
| D11 | External agent collections exist (VoltAgent 14.1k, wshobson 112+)                               | EXTERNAL_RESEARCH.md Source 2                                              | Theme 9 references community templates as foundation for new agents        |
| D12 | code-reviewer shows 0 invocations despite mandate                                               | WORKFLOW_GAPS.md Gap #1                                                    | Theme 10.4 (TDMS audit pipeline not confirmed as run)                      |
| D13 | Add maxTurns: 25 to code-reviewer and security-auditor                                          | DECISIONS.md Decision #23                                                  | Not re-recommended in new research (gap)                                   |
| D14 | Add disallowedTools: Agent to review agents                                                     | DECISIONS.md Decision #24                                                  | Not re-recommended (gap)                                                   |
| D15 | deep-plan underutilized (1/4 sessions)                                                          | WORKFLOW_GAPS.md Gap #2                                                    | Not addressed in new research scope                                        |
| D16 | 3-7x token cost for teams vs subagents                                                          | AGENT_TEAMS_RESEARCH.md §Token Cost Model                                  | Theme 8.2 — 3-5 agent ceiling quantified, scaling curve cited              |
| D17 | isolation: worktree not used for code-modifying agents                                          | RESEARCH_SYNTHESIS.md Theme 2                                              | Not re-surfaced in new research (gap)                                      |
| D18 | No haiku for agents — sonnet and opus only                                                      | DECISIONS.md Decision #18                                                  | This is a CONTRADICTION — see §3                                           |

**Dedup count: 17 confirmed duplicates (D1-D17). D18 is a contradiction.**

---

## 2. Deltas — What Has Changed Since the Prior Research

| #    | Item                          | Prior State (Mar 17)                           | Current State (Mar 29)                                                                                     | Confidence                                                                                       |
| ---- | ----------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| DT1  | Agent count                   | 36 agents                                      | 39 agents (26 local + 13 global tracked)                                                                   | HIGH — new research D3a counts 26 local; prior counted 36 total including 13 GSD                 |
| DT2  | Audit execution               | Not run (Phase 2-3 planned)                    | Run — 36 agents audited, 6 improved, 18 skipped without scoring                                            | HIGH — D12b JSONL confirms                                                                       |
| DT3  | New agents added              | 36 agents total                                | 3 net-new agents added post-audit (not scored)                                                             | HIGH — new research §2.1 states "three new agents added post-audit"                              |
| DT4  | model field on global agents  | Missing / unspecified                          | Fixed post-March-17 audit — .claude/agents/global/ now has model: sonnet                                   | HIGH — Theme 4.1 states "project-tracked agents have model: sonnet (fixed post-March-17)"        |
| DT5  | code-reviewer quality         | Stub (37 lines) flagged for upgrade            | Listed as Tier A (score ≥5/5 composite)                                                                    | HIGH — Theme 2.2 calls code-reviewer reference quality; AGENT_INVENTORY still shows 37-line stub |
| DT6  | security-auditor quality      | Stub (40 lines) flagged for upgrade            | Listed as Tier A reference quality                                                                         | HIGH — same source conflict as DT5                                                               |
| DT7  | Two team configs implemented  | 0 teams (planned in Phase 4.2)                 | 2 teams: audit-review-team and research-plan-team                                                          | HIGH — Theme 8.1 confirms                                                                        |
| DT8  | frontmatter schema fields     | 13 fields listed in EXTERNAL_RESEARCH.md       | 17 fields confirmed (added: initialPrompt, color, effort, background, isolation)                           | HIGH — D1/D1b new research confirmation                                                          |
| DT9  | Model pricing ratio           | "No haiku, lean opus, cost premium assumed 5x" | Opus 4.6 costs 1.67x Sonnet 4.6 ($5/$25 vs $3/$15) — not 5x                                                | HIGH — D4a official pricing page confirmation                                                    |
| DT10 | effort: field existence       | Not in prior frontmatter field list            | effort: field confirmed functional (max = Opus 4.6 only)                                                   | HIGH — D4b docs confirmation                                                                     |
| DT11 | Skills field usage            | "NOT USED" per EXTERNAL_RESEARCH.md            | Still unused across local roster, but identified as high-value for agents invoking skill-defined workflows | HIGH — Theme 4.4                                                                                 |
| DT12 | TDMS pipeline post-audit      | Assumed run                                    | May NOT have run — 59 structural findings from March audit may be absent from MASTER_DEBT                  | MEDIUM — Theme 10.4 states "no evidence confirms the pipeline ran"                               |
| DT13 | Global agent runtime sync     | Not analyzed                                   | Critical infrastructure gap: ~/.claude/agents/ may be stale vs .claude/agents/global/                      | HIGH — Theme 4.1, unresolved question #1                                                         |
| DT14 | compliance test accuracy      | Assumed correct                                | check-agent-compliance.test.ts tests wrong implementation — false confidence                               | HIGH — Theme 2.5, D12b ground-truth comparison                                                   |
| DT15 | deep-research pipeline agents | Not analyzed                                   | Only 2 of 6 pipeline roles have custom definitions; 4 roles are template-only or absent                    | HIGH — Theme 5                                                                                   |

---

## 3. Contradictions — Where New Research DISAGREES With Prior

### C1: Decision #18 "No Haiku for Agents" vs Built-in Agent Models

**Prior (DECISIONS.md Decision #18):**

> "Sonnet and opus only, heavy lean toward opus. No haiku for agents; opus
> justifies cost with quality."

**New Research (Theme 7.5):**

> "Built-in agents have assigned models: Explore = Haiku, Guide = Haiku,
> statusline = Sonnet."

**New Research (DECISIONS.md Decision #26, added during Phase 3-4):**

> "Override Explore with `model: 'sonnet'` when analysis quality matters more
> than speed" — explicitly acknowledges Explore defaults to Haiku.

**Analysis:** The "no haiku" rule was a project design decision for custom
agents. The new research reveals that Anthropic's own built-in agents (Explore,
Guide) use Haiku by default. These are not contradictory if scoped correctly:
Decision #18 applies to custom agents (.claude/agents/\*.md), not to built-in
Anthropic agents. However, Decision #18's phrasing ("no haiku for agents"
without qualification) is ambiguous and created a blind spot — the team
discovered Explore uses Haiku only during Phase 3 execution (Decision #26).

**Resolution recommendation:** Amend Decision #18 to explicitly scope to custom
agents. Add: "Built-in agents (Explore, Guide) use Haiku by default; override to
sonnet when analysis quality is required."

**Confidence:** HIGH

---

### C2: Agent Quality Assessment — Stub vs Tier A

**Prior (AGENT_INVENTORY.md §Development & Architecture):**

> code-reviewer: 37 lines, stub tier, "⚠️ Stub" security-auditor: 40 lines, stub
> tier, "⚠️ Stub"

**New Research (Theme 2.2):**

> "Five agents score at Tier A (score ≥5/5 composite): code-reviewer, explore,
> frontend-developer, plan, security-auditor."

**Analysis:** These are not the same time point. The prior inventory was Phase 1
pre-audit (March 17). The new research reflects post-Phase 4 improvements.
code-reviewer and security-auditor were stub-tier during the inventory; they
were upgraded during Phase 4. The conflict is temporal, not factual — but the
new research does not explicitly note "these were stubs before improvement." The
RESEARCH_OUTPUT.md reads as if they were always Tier A, which is misleading.

**Resolution recommendation:** Note in any planning documents that Tier A status
for code-reviewer and security-auditor reflects post-Phase 4 improvement, not
the pre-audit baseline.

**Confidence:** HIGH

---

### C3: Opus Cost Premium — 5x Assumption vs 1.67x Reality

**Prior (DECISIONS.md Decision #18 rationale):**

> "Opus justifies cost with quality" — implies significant cost premium; no
> specific ratio stated, but community assumption at the time was ~5x.

**New Research (Theme 7.1):**

> "Opus 4.6 costs 1.67x Sonnet 4.6, not 5x. The practical implication: Opus is
> justified for any task with meaningful reasoning complexity."

**Analysis:** The prior research didn't cite a specific ratio, but was written
during an era when Opus 3 cost ~5x Sonnet 3. Opus 4.6 pricing ($5/$25 per M
tokens) vs Sonnet 4.6 ($3/$15) is genuinely 1.67x input and 1.67x output. This
changes the cost threshold for opus justification dramatically — the bar should
be lower, not higher.

**Resolution recommendation:** Update model selection guidance to reflect 1.67x
differential. The prior "heavy lean toward opus" guidance was correct
directionally but underutilized opus due to overstated cost concern.

**Confidence:** HIGH — official pricing confirmed by D4a

---

### C4: Team Composition Quality — Validated vs Approximation

**Prior (RESEARCH_SYNTHESIS.md Theme 5, AGENT_TEAMS_RESEARCH.md):**

> The research-team and audit-team ran successfully during Phase 1 and Phase 3.
> Teams were described as working well, with 4-member convergence and no
> contradictions.

**New Research (Theme 8.5):**

> "research-plan-team researcher role is an ad-hoc approximation. The team's
> researcher does not inherit deep-research-searcher's CRAAP+SIFT evaluation,
> confidence calibration, or structured return format. Research quality from the
> team is lower than from a full /deep-research invocation."

**Analysis:** The prior research evaluated team architecture and found it sound.
The new research accepts the architecture but identifies a quality gap in the
researcher role's definition specifically. The prior was measuring "did the team
function?" The new research is measuring "does the researcher role produce
deep-research-quality outputs?" These are different questions with different
answers.

**Resolution recommendation:** Both are correct for their scope. The action is
to elevate the researcher role definition without changing the team
architecture.

**Confidence:** HIGH

---

### C5: Ecosystem Mean Score

**Prior (DIAGNOSIS.md §By the Numbers):**

> "36 agents total. 12 stub, 5 light, 3 medium, 16 heavy." (quality tier counts
> differ slightly from AGENT_INVENTORY.md which shows 11 stub, 17 heavy)

**New Research (Theme 2.1):**

> "The ecosystem mean score is 54/100 (F grade). 36 agents were audited; 6 were
> improved; post-improvement mean is 54. 18 agents were skipped without
> scoring."

**Analysis:** "Post-improvement mean is 54" means the 54/100 score represents
only agents that were scored, after improvements. The prior had no composite
score. The new research's 54/100 is partially misleading because 18 of 36 agents
were skipped — the scoring is incomplete, so 54/100 may not represent the true
mean.

**Resolution recommendation:** Treat 54/100 as a lower-bound indicator for
scored agents, not the full ecosystem mean. The actual full-ecosystem mean is
unknown until all agents are scored.

**Confidence:** MEDIUM

---

## 4. New Discoveries — What New Research Found That Prior Did NOT Cover

These findings have no counterpart in any prior research file.

| #   | Discovery                                                                                               | Theme                             | Significance                                                                                                                                                              | Confidence |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| N1  | Agent body REPLACES (not supplements) CLAUDE.md system prompt                                           | Theme 1.1                         | Critical architecture fact — all security/behavioral rules in CLAUDE.md are invisible to any invoked agent unless explicitly re-stated in the agent definition            | HIGH       |
| N2  | description field + `<example>` blocks are the primary auto-delegation routing signal                   | Theme 1.2                         | Adds `<example>` blocks as the highest-leverage single improvement for routing; prior research noted "Use proactively" but not XML example blocks                         | HIGH       |
| N3  | Agent names are case-insensitive                                                                        | Theme 1.3                         | Operational clarification — `Explore` and `explore` are identical; prior was silent on this                                                                               | HIGH       |
| N4  | Five system/plugin agents need project-level overrides                                                  | Theme 4.2, 4.3                    | Entirely new category: general-purpose, silent-failure-hunter, pr-test-analyzer, code-simplifier, type-design-analyzer. Prior research only analyzed custom agents        | HIGH       |
| N5  | general-purpose override is the highest-leverage single action (13+ invocations, zero SoNash context)   | Theme 4.3                         | Prior never identified general-purpose as an override target; it was invisible as a "built-in"                                                                            | HIGH       |
| N6  | silent-failure-hunter references wrong logger; pr-test-analyzer uses wrong test runner (Jest vs Vitest) | Theme 4.2                         | Active incorrect behavior in production — prior did not audit system agents at all                                                                                        | HIGH       |
| N7  | skills: field is underused optimization — loads SKILL.md at invocation time                             | Theme 4.4                         | Prior listed `skills` as unused frontmatter but didn't articulate the specific value proposition of injecting skill methodology at invocation                             | MEDIUM     |
| N8  | Deep-research pipeline: 6 roles, only 2 have custom definitions                                         | Theme 5                           | Entirely new analysis scope — prior research did not examine deep-research pipeline agents                                                                                | HIGH       |
| N9  | Phase 2.5 verification has NO template at all                                                           | Theme 5.1                         | Most critical single gap in the pipeline — prior never identified this                                                                                                    | HIGH       |
| N10 | Phase 3.9 + 3.97 double-rewrite architectural hazard                                                    | Theme 5.4, Unexpected Findings #2 | Unrecognized hazard: second synthesizer invocation may silently undo Phase 3.9 corrections                                                                                | HIGH       |
| N11 | Four-verdict taxonomy: VERIFIED, REFUTED, UNVERIFIABLE, CONFLICTED (vs current binary)                  | Theme 5.5                         | CONFLICTED verdict enabling dispute resolution handoff is the key addition — prior never analyzed verification protocol design                                            | HIGH       |
| N12 | FIRE architecture: check model confidence before invoking tools (7.6-16.5x cost reduction)              | Theme 5.6, Unexpected Findings #3 | Novel external pattern — not in prior research at all                                                                                                                     | HIGH       |
| N13 | Steel-man before attack as foundational adversarial pattern                                             | Theme 6.1                         | Prior research noted adversarial patterns at conceptual level; new research provides specific implementation protocol                                                     | MEDIUM     |
| N14 | Pre-mortem framing ("assume wrong in 6 months — why?") for contrarian-challenger                        | Theme 6.2                         | Specific prompting technique not in prior                                                                                                                                 | MEDIUM     |
| N15 | Free-MAD: consensus-free debate produces 13-16% quality improvement                                     | Theme 6.3                         | Academic source (iMAD arXiv) not referenced in prior research                                                                                                             | HIGH       |
| N16 | iMAD selective triggering cuts adversarial cost 68-92%                                                  | Theme 6.4                         | High-value cost optimization for adversarial agents — entirely new finding                                                                                                | HIGH       |
| N17 | DRAGged five-type conflict taxonomy (+24 points resolution quality)                                     | Theme 6.5                         | Academic source not in prior; provides concrete dispute resolution protocol                                                                                               | HIGH       |
| N18 | effort: field for model escalation without agent-level changes                                          | Theme 7.2                         | effort: max = Opus 4.6 only. This is a new frontmatter field not in prior's 11-field list (prior listed 13 used + 11 unused = 24; new research says 17 total; see §3 DT8) | HIGH       |
| N19 | skill model: field is broken (GitHub Issue #21679, open since Jan 2026)                                 | Theme 7.3                         | Active bug in Claude Code — model tiering for skill-invoked agents must use spawn prompt, not skill frontmatter                                                           | HIGH       |
| N20 | Heterogeneous model teams outperform homogeneous by +33-34%                                             | Theme 7.4                         | Empirical academic validation for planner-Opus + researcher-Sonnet split                                                                                                  | HIGH       |
| N21 | MAST taxonomy: 41.8% of multi-agent failures are design-time preventable                                | Theme 8.3                         | Quantifies the value of stub elevation and override creation — prior didn't cite this academic validation                                                                 | HIGH       |
| N22 | Recommend AGAINST deep-research team configuration (one-team-per-session constraint)                    | Theme 8.4                         | Explicit architectural recommendation — prior research identified deep-research as a team candidate; new research recommends subagent orchestration instead               | HIGH       |
| N23 | Firebase released official agent skills (Feb 2026) — 13 purpose-built skills                            | Theme 9.1, Unexpected Findings #4 | Entirely new official resource post-training-cutoff — prior external research predates this release                                                                       | HIGH       |
| N24 | convergence-loop-verifier as highest-ROI net-new agent (6+ caller skills)                               | Theme 9.2                         | New agent category entirely absent from prior; prior identified convergence-loop as a team opportunity but not a verifier agent opportunity                               | HIGH       |
| N25 | check-agent-compliance.test.ts tests wrong implementation — false confidence                            | Theme 2.5, Unexpected Findings #1 | Serendipitous discovery; prior compliance analysis assumed test correctness                                                                                               | HIGH       |
| N26 | Three-layer testing standard (unit/integration/behavioral) — no SoNash agent has any golden test        | Theme 10.1                        | Prior had no quality testing analysis; this is an entirely new gap category                                                                                               | HIGH       |
| N27 | Agent-Pex methodology: extract checkable rules from agent's own role/instruction blocks                 | Theme 10.2                        | Microsoft Research methodology for specification-driven testing — not in prior                                                                                            | HIGH       |
| N28 | 10-step pipeline at 99% per-step = 90.4% end-to-end; at 95%, 5-agent pipeline = 77%                     | Theme 10.3                        | Quantifies why early-stage agent quality matters disproportionately                                                                                                       | HIGH       |
| N29 | GoAgent topology auto-generation may render manual team design obsolete in 1-2 years                    | Unexpected Findings #5            | Strategic horizon signal — not urgent but relevant to long-term team design investment                                                                                    | MEDIUM     |
| N30 | track-agent-invocation.js records "general-purpose" for unnamed Task tool invocations                   | Unexpected Findings #7            | Quality signal gap in compliance system — prior knew tracking was blind but didn't identify this specific false-name problem                                              | MEDIUM     |

**New discovery count: 30**

---

## 5. Stale Information — What in Prior Research Is Now Outdated

| #   | Prior Claim                                                                                          | Stale Because                                                                                                  | What Replaced It                                                                                      | Confidence |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| S1  | "36 agents total in .claude/agents/" (DIAGNOSIS.md)                                                  | 3 new agents added post-Phase 4; global agents now tracked separately                                          | 39 agents (26 local + 13 global) — use new research counts                                            | HIGH       |
| S2  | code-reviewer and security-auditor are "stub" tier (AGENT_INVENTORY.md)                              | Phase 4 improvements upgraded them; both now Tier A per new audit                                              | New research Theme 2.2 supersedes this                                                                | HIGH       |
| S3  | "Agent Teams enabled but never invoked" (DIAGNOSIS.md #6)                                            | Two team configurations now exist and are documented in CLAUDE.md                                              | New research Theme 8.1; AGENT_TEAMS_RESEARCH.md itself is now partially superseded                    | HIGH       |
| S4  | frontmatter has 13 fields (EXTERNAL_RESEARCH.md Source 1)                                            | New official schema has 17 fields (effort, background, initialPrompt, color added)                             | New research Theme 1.4                                                                                | HIGH       |
| S5  | "0 invocations" for teams (WORKFLOW_GAPS.md)                                                         | Teams have been used in production — research-team (Phase 1), audit-team (Phase 3), improvement-team (Phase 4) | AGENT_TEAMS_RESEARCH.md first-hand observations                                                       | HIGH       |
| S6  | Recommended upgrading security-auditor from stub to heavy as P1 action (RESEARCH_SYNTHESIS.md P1 #5) | Already done during Phase 4                                                                                    | Now Tier A; focus shifts to maintaining quality and adding maxTurns/disallowedTools                   | HIGH       |
| S7  | "No external benchmarking" — agents created ad-hoc (DIAGNOSIS.md #2)                                 | Phase 1.3 external research was conducted; VoltAgent, wshobson, Superpowers researched                         | EXTERNAL_RESEARCH.md documents the benchmarking that now exists                                       | HIGH       |
| S8  | "No agent audit capability" (DIAGNOSIS.md #3)                                                        | audit-agent-quality skill created in Phase 2                                                                   | Phase 2 delivered the skill; the new research audited it for gaps                                     | HIGH       |
| S9  | model: on global agents unspecified (AGENT_INVENTORY.md §Pass 2 Tally)                               | Fixed post-March-17 — model: sonnet added to .claude/agents/global/                                            | New research Theme 4.1                                                                                | HIGH       |
| S10 | Decision #26 (Explore model override) was a new discovery                                            | Anthropic's design intent (Explore = Haiku) is now documented as known fact                                    | New research Theme 7.5                                                                                | MEDIUM     |
| S11 | RESEARCH_SYNTHESIS.md P4 strategic addition: "Compliance auditor"                                    | Identified as a nice-to-have; no SoNash-specific analysis                                                      | New research did not elevate this; prior recommendation stands but without new urgency signal         | LOW        |
| S12 | Gap #3 (team orchestration) estimated 60-120 min/month savings with formal teams                     | Teams now exist and are used; the "gap" is partially closed; remaining gap is member definition quality        | New research Theme 8.5                                                                                | MEDIUM     |
| S13 | RESEARCH_SYNTHESIS.md recommendation: "Import Trail of Bits methodology into security-auditor"       | security-auditor is now Tier A post-Phase 4; unclear if Trail of Bits was incorporated                         | Trail of Bits reference may be irrelevant if Phase 4 improvement already covered security methodology | MEDIUM     |

**Stale count: 13 items**

---

## Key Findings

1. **Temporal Coherence — Prior and New Research Are Consistent** [CONFIDENCE:
   HIGH]

   The two bodies of research are largely complementary, not contradictory. The
   prior research diagnosed problems and produced a 5-phase plan. New research
   was conducted after that plan was executed — it confirms what was fixed
   (teams, model fields, some agent upgrades) and identifies what remained
   unaddressed (pipeline agents, system overrides, compliance test accuracy).
   The 17 confirmed duplicates represent the problems that were correctly
   identified but not yet resolved.

2. **Systemic Overrides Are a Blind Spot in Prior Research** [CONFIDENCE: HIGH]

   The prior research analyzed only .claude/agents/\*.md custom agents. It never
   examined system/built-in agents (general-purpose, Explore, Guide,
   silent-failure-hunter, pr-test-analyzer) as override targets. The new
   research identifies 5 agents needing project-level overrides, with
   general-purpose being the highest-leverage action (13+ invocations, zero
   SoNash context inherited). This entire category is net-new.

3. **Deep-Research Pipeline Gap Is Entirely New Analysis** [CONFIDENCE: HIGH]

   The prior research plan covered 5 phases of agent ecosystem improvement but
   never analyzed the deep-research skill's own sub-agent pipeline (Phases 1-5
   of /deep-research). The new research identified that only 2 of 6 pipeline
   roles have custom definitions, Phase 2.5 has no template at all, and there is
   an architectural double-rewrite hazard in Phases 3.9 and 3.97. This is the
   highest-impact net-new finding in the new research.

4. **Decision #18 "No Haiku" Needs Scoping Correction** [CONFIDENCE: HIGH]

   The prior Decision #18 was correct for custom agents but was written before
   the team knew Anthropic's own built-in agents use Haiku. The decision needs
   an explicit scope qualifier ("for custom .claude/agents/ files") and a note
   that built-in agents may use Haiku by design. The subsequent Decision #26
   already implements the practical workaround but does not amend #18.

5. **Model Pricing Shift Changes the Cost-Quality Calculus** [CONFIDENCE: HIGH]

   The prior research's "heavy lean toward opus" guidance was written assuming a
   ~5x cost premium. The confirmed 1.67x differential (Opus 4.6: $5/$25 vs
   Sonnet 4.6: $3/$15) means opus is justified for any task with meaningful
   reasoning complexity — a much lower threshold than prior assumed. The prior's
   directional guidance was correct; the implicit threshold was too
   conservative.

6. **Quality Infrastructure Has Critical Gaps Not in Prior** [CONFIDENCE: HIGH]

   The prior identified invocation tracking blindness (skills vs agents). The
   new research found two additional infrastructure gaps not in prior: (a)
   check-agent-compliance.test.ts tests a different implementation than
   check-agent-compliance.js, providing false confidence; (b) no automated
   frontmatter validation in pre-commit means quality regressions from
   consolidation/elevation are not caught. Both are serendipitous discoveries
   with immediate remediation paths.

---

## Sources

| #   | Source                                                         | Type                              | Trust | CRAAP | Date       |
| --- | -------------------------------------------------------------- | --------------------------------- | ----- | ----- | ---------- |
| 1   | `.planning/agent-environment-analysis/DIAGNOSIS.md`            | Project artifact                  | HIGH  | 4.8   | 2026-03-16 |
| 2   | `.planning/agent-environment-analysis/DECISIONS.md`            | Project artifact                  | HIGH  | 4.8   | 2026-03-17 |
| 3   | `.planning/agent-environment-analysis/AGENT_INVENTORY.md`      | Project artifact (3-pass CL)      | HIGH  | 4.9   | 2026-03-17 |
| 4   | `.planning/agent-environment-analysis/WORKFLOW_GAPS.md`        | Project artifact (multi-pass CL)  | HIGH  | 4.8   | 2026-03-17 |
| 5   | `.planning/agent-environment-analysis/RESEARCH_SYNTHESIS.md`   | Project artifact (synthesis)      | HIGH  | 4.8   | 2026-03-17 |
| 6   | `.planning/agent-environment-analysis/EXTERNAL_RESEARCH.md`    | Project artifact (5-pass CL)      | HIGH  | 4.7   | 2026-03-17 |
| 7   | `.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md` | Project artifact                  | HIGH  | 4.7   | 2026-03-17 |
| 8   | `.planning/agent-environment-analysis/PLAN.md`                 | Project artifact                  | HIGH  | 4.9   | 2026-03-24 |
| 9   | `.research/custom-agents/RESEARCH_OUTPUT.md`                   | L4 research synthesis (29 agents) | HIGH  | 4.9   | 2026-03-29 |

---

## Contradictions

| Finding                                        | Prior Position                                                             | New Position                                                                                 | Resolution                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| C1: "No haiku for agents"                      | Decision #18: no haiku for custom agents                                   | Theme 7.5: Explore and Guide are Haiku by Anthropic design; Decision #26 added as workaround | Not truly contradictory — scope was custom agents. Amend Decision #18 with explicit scope qualifier. |
| C2: code-reviewer and security-auditor quality | Stub tier, flagged for upgrade (Phase 1)                                   | Tier A reference quality (Phase 4 post-audit)                                                | Temporal — both correct for their time point. No real contradiction.                                 |
| C3: Opus cost premium                          | Implicit ~5x premium (community assumption in March 2026 pre-v4.6 pricing) | 1.67x confirmed for Opus 4.6 vs Sonnet 4.6                                                   | Factual update — prior was using stale pricing mental model. New research supersedes.                |
| C4: Team quality                               | Teams functioned well in Phase 1 research-team execution                   | researcher role is ad-hoc approximation lacking CRAAP+SIFT                                   | Different evaluation scope. Both correct. Action: elevate researcher role.                           |
| C5: Ecosystem mean score                       | No prior composite score                                                   | 54/100 F grade — but 18/36 agents unscored                                                   | Partial data warning — treat 54/100 as lower bound for scored agents only.                           |

---

## Gaps

1. **gsd-nyquist-auditor YAML list format** — identified in prior
   (AGENT_INVENTORY.md Pass 2), not addressed in new research. Status unknown.
2. **maxTurns: 25 on code-reviewer/security-auditor** — Decision #23 from prior
   research; not mentioned in new research. Implementation status unknown.
3. **disallowedTools: Agent on review agents** — Decision #24 from prior
   research; not surfaced in new research. Status unknown.
4. **isolation: worktree for code-modifying agents** — prior recommendation, not
   addressed in new research.
5. **memory: project for code-reviewer, debugger, security-auditor** — prior
   recommendation, not surfaced in new research.
6. **test-engineer evaluation gap** — D7c explicitly excluded test-engineer from
   consolidation analysis. No prior or new research fully covers this agent.
7. **audit-agent-quality TDMS pipeline confirmation** — new research flags "no
   evidence confirms pipeline ran after March 2026 audit." 59 structural
   findings may be absent from MASTER_DEBT. Needs verification.
8. **Gap #5 (Convergence-Loop Audit-Skill Routing)** from WORKFLOW_GAPS.md — not
   addressed in new research.

---

## Serendipity

The most serendipitous cross-research finding: **the prior research's Phase 1
research-team execution (4 members, 10 minutes, no contradictions) was itself a
proof-of-concept for the team architecture it was designed to study.** Yet the
new research (Theme 8.5) retrospectively identifies that the researcher role in
the research-plan-team lacks CRAAP+SIFT calibration — meaning the prior research
team may have produced lower-quality research than a full /deep-research
invocation would have. The prior research may have under-discovered by using the
very tool that needed improvement.

---

## Confidence Assessment

- HIGH claims: 28
- MEDIUM claims: 8
- LOW claims: 1
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The comparison is grounded in direct filesystem reads of both corpora.
Confidence is high throughout because both bodies of research are internal
project artifacts with known provenance, not external sources requiring
credibility assessment.
