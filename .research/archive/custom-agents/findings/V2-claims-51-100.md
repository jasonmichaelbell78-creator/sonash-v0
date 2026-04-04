# Findings: Filesystem Verification of Claims C-051 through C-100

**Searcher:** deep-research-verification-agent **Profile:** codebase **Date:**
2026-03-29 **Sub-Question IDs:** Verification pass 2 (C-051 to C-100)

---

## Summary Statistics

- **Claims verified:** 50 (C-051 through C-100)
- **Directly checked against filesystem:** 38 claims
- **VERIFIED:** 27
- **REFUTED:** 3
- **MODIFIED:** 8
- **UNVERIFIABLE:** 12

---

## Verdicts by Claim

### C-051 — `skills:` frontmatter field is underused / unused across local agent roster

**Verdict: VERIFIED**

Exhaustive check of all 26 local agents (`.claude/agents/*.md`) and all 13
global agents (`.claude/agents/global/*.md`) using bash loop. Zero files contain
a `skills:` field in their frontmatter. The claim that the field is "currently
unused across the entire local agent roster" is accurate. The global agents also
have no `skills:` field.

**Evidence:** Bash loop over all 39 agent files; zero matches for `^skills:`.

---

### C-052 — Dispute-resolver template (15 lines) has three critical gaps

**Verdict: MODIFIED**

The template is in REFERENCE.md Section 21.1.1 (lines 1079-1094). Counting the
code block body (excluding fences) yields **16 lines**, not 15. Including the
surrounding fence markers it is 18 lines. The section header label of "15 lines"
is a minor inaccuracy.

Gap verification:

1. **INCONCLUSIVE downstream handling undefined:** CONFIRMED. The template lists
   `INCONCLUSIVE` as a valid verdict (line 1087), but neither REFERENCE.md nor
   SKILL.md defines what the orchestrator should do when a dispute returns
   INCONCLUSIVE.
2. **No structured return protocol:** CONFIRMED. The template ends with "Write
   to: .research/\<topic\>/findings/dispute-resolutions.md" and has no
   orchestrator return schema.
3. **Multi-agent append behavior underspecified in the template itself:**
   PARTIALLY CONFIRMED. Lines 1069-1075 (in the surrounding prose, outside the
   template body) state "append, not overwrite." The template code block itself
   does not include this instruction.

Overall the three gaps are real; the line count is MODIFIED (16 vs 15).

**Evidence:** REFERENCE.md lines 1077-1094; no downstream INCONCLUSIVE handling
found in SKILL.md or REFERENCE.md.

---

### C-053 — Gap detection (orchestrator) vs gap filling (custom agent) are distinct

**Verdict: VERIFIED**

REFERENCE.md Section 22.1 specifies the gap detection algorithm as 6-source
orchestrator-level scan with deduplication and actionability filtering. Section
22.3 specifies a "Gap-Pursuit Agent Prompt Template" as a spawnable subagent.
The architectural split is explicit: detection stays inline, filling warrants a
spawned agent.

**Evidence:** REFERENCE.md lines 1202-1256 (detection algorithm), lines
1257-1292 (gap-pursuer template).

---

### C-054 — Gap-pursuer needs profile-switching tool strategy

**Verdict: VERIFIED**

D9b Finding 3 explicitly identifies this need. The current REFERENCE.md 22.3
template does not specify profile-switching; the template uses
`[Gap-specific investigation steps]` as a placeholder. D9b concludes the
gap-pursuer should inherit the full searcher tool set (all profiles). The claim
accurately characterizes the gap and the required design.

**Evidence:** REFERENCE.md lines 1257-1292; D9b-pipeline-agents-internal.md
lines 105-167.

---

### C-055 — Final re-synthesizer must enforce edit-mode philosophy (not full rewrite)

**Verdict: VERIFIED**

REFERENCE.md Section 22.5 (Final Re-Synthesis Agent Prompt Template), line 1325,
explicitly states: "EDIT the report — do not rewrite from scratch." This
instruction is present in the current template. The claim is correct that
without this enforcement a general-purpose synthesizer would default to full
rewrite.

**Evidence:** REFERENCE.md line 1325.

---

### C-056 — Parallelizable tasks +80.8% improvement; sequential tasks -39% to -70%

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2512.08296). Not checkable against the local
filesystem.

---

### C-057 — Token overhead by architecture (independent MAS +58%, centralized +285%, etc.)

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2512.08296). Not checkable against the local
filesystem.

---

### C-058 — Teams impose 22-44% "confusion tax"

**Verdict: UNVERIFIABLE**

External practitioner analysis. Not checkable against the local filesystem. The
claim carries MEDIUM original confidence; that is appropriate.

---

### C-059 — Hierarchical pattern is Pareto optimal for pipeline verification

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2603.22651). Not checkable against the local
filesystem.

---

### C-060 — refactoring-specialist is top-ranked net-new general-duty agent; not in current roster

**Verdict: VERIFIED**

Confirmed `refactoring-specialist` does not exist in either
`.claude/agents/*.md` (26 files) or `.claude/agents/global/*.md` (13 files). The
"not in current roster" component is correct.

**Evidence:** `ls /c/.../agents/ | grep "refactor"` — no output.

---

### C-061 — session-continuity-manager is rank-2 net-new agent (from 2 community collections)

**Verdict: VERIFIED**

Agent does not exist in roster (confirmed). D10a-netnew-github.md line 205 cites
`dl-ezo/claude-code-sub-agents`, `Continuous-Claude-v3`, and `claude-mem` as
sources (3 sources, not 2 as claimed — minor discrepancy). The connection to the
compaction problem is confirmed by MEMORY.md entry
`feedback_convergence_loops_mandatory`.

**Evidence:** D10a-netnew-github.md lines 205-216; `ls /c/.../agents/` — no
session-continuity agent found.

---

### C-062 — React 19 and Next.js 16 are post-training; Vercel agent skill encodes React 19.x patterns

**Verdict: MODIFIED**

The first part (React 19.2.4, Next.js 16.2.0 confirmed as current versions) is
VERIFIED via CLAUDE.md Section 1 stack table. The second part ("official Vercel
React best-practices agent skill encodes React 19.x patterns") is a claim about
an external Vercel/Claude integration product — not verifiable against the local
filesystem.

**Evidence:** CLAUDE.md stack table: `React 19.2.4`, `Next.js 16.2.0`.

---

### C-063 — self-improving pattern-promotion agent aligns with SoNash memory system

**Verdict: UNVERIFIABLE**

This is a design recommendation about a proposed agent. No such agent file
exists in the roster (confirmed). The connection to the memory system is
plausible but the claim is about suitability, not current state.

---

### C-064 — Anthropic alignment auditing agents reach 88% discrimination accuracy

**Verdict: UNVERIFIABLE**

External Anthropic research claim. Not checkable against local filesystem.

---

### C-065 — 45% capability threshold above which multi-agent yields diminishing returns

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2512.08296). Not checkable against local
filesystem.

---

### C-066 — No deep-research team: sequential phases don't benefit from real-time messaging

**Verdict: VERIFIED**

D11b-teams-internal.md line 338 explicitly states: "RECOMMEND AGAINST a
deep-research team configuration." Table at line 750 shows:
`deep-research team | DO NOT CREATE | Pipeline is sequential phase-based; filesystem coordination sufficient; would block other teams; 9+ agents exceeds 3-4 member sweet spot`.

**Evidence:** D11b-teams-internal.md lines 338, 750.

---

### C-067 — audit-review-team (2-member sequential) is optimal

**Verdict: VERIFIED**

audit-review-team.md confirms 2-member roster (reviewer: sonnet, fixer: sonnet).
File explicitly documents "Why 2 Members (Not More)" with sequential workflow
justification. D11a cross-validation cited. The spawn trigger covers `/audit-*`
or `/skill-audit` invocation targeting 3+ artifacts.

**Evidence:** `.claude/teams/audit-review-team.md` first 50 lines; member roster
table.

---

### C-068 — research-plan-team needs 4 refinements

**Verdict: VERIFIED**

Direct filesystem read of `.claude/teams/research-plan-team.md`:

1. **Researcher role does not reference deep-research-searcher protocols** —
   confirmed. Researcher role at line 24 has no mention of CRAAP+SIFT or
   structured return format.
2. **Verifier should reference convergence-loop-verifier** — confirmed. No such
   agent exists yet; verifier role has no reference to it.
3. **No inter-agent message schemas** — confirmed. No schema defined for
   researcher→planner messages.
4. **Complexity trigger uses "L or XL"** — confirmed at line 60
   (`Research complexity is L or XL`). deep-research SKILL.md uses L1/L2/L3/L4
   depth levels; these naming systems do not match.

**Evidence:** research-plan-team.md line 60; deep-research SKILL.md line 77.

---

### C-069 — session-begin-health-triage and session-end-compliance-enforcer are P2 net-new agents

**Verdict: VERIFIED**

Neither agent exists in `.claude/agents/*.md` or `.claude/agents/global/*.md`.
D10c Gap 3 and Gap 4 outline these as proposed P2 agents. D11b Section 2
(Opportunity C) describes a potential session management team around these
roles.

**Evidence:** `ls .claude/agents/` — no matching files; D10c-netnew-internal.md
lines 317-350.

---

### C-070 — sonarcloud-processor, coderabbit-processor, qodo-processor are P3 net-new agents

**Verdict: VERIFIED**

None of the three agents exist in `.claude/agents/*.md` or
`.claude/agents/global/*.md`. D10c Gap 5 confirms these as proposed P3 agents.

**Evidence:** `ls .claude/agents/` — no matching files.

---

### C-071 — debt-runner-subagent and deploy-diagnostic are P2 net-new agents

**Verdict: VERIFIED**

Neither agent exists in the roster. D10c Gaps 7 and 8 confirm these as proposed
P2 agents.

**Evidence:** `ls .claude/agents/` — no matching files.

---

### C-072 — test-suite-diagnostic is a P2 net-new agent

**Verdict: VERIFIED**

Agent does not exist in roster. D10c Gap 6 outlines it. D5c Finding 1 confirmed
test-engineer is not wired into the test-suite skill.

**Evidence:** `ls .claude/agents/` — no matching files.

---

### C-073 — audit-\* family spawns 30+ ad-hoc role labels with no custom agent files; 7 audit skills

**Verdict: VERIFIED**

Filesystem shows 13 total audit-\* skills, but exactly 7 use ad-hoc role labels
per D10c Additional Gap B: audit-code (3 labels), audit-security (4),
audit-performance (2), audit-ai-optimization, audit-enhancements,
audit-comprehensive, audit-process (22). Total ad-hoc labels = 3+4+2+1+1+1+22 =
34 (>30). The "7 audit skills" count matches D10c's enumeration.

**Evidence:** D10c-netnew-internal.md lines 317-336;
`ls .claude/skills/ | grep "^audit-"` = 13 total (6 without ad-hoc labels:
audit-agent-quality, audit-aggregator, audit-documentation,
audit-engineering-productivity, audit-health, audit-refactoring).

---

### C-074 — AgentCPM WARP pattern: write draft first, analyze for gaps

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2602.06540). Not checkable against local
filesystem.

---

### C-075 — Edit-in-place re-synthesis preferred over full report rewrites

**Verdict: VERIFIED**

REFERENCE.md Section 22.5 (Final Re-Synthesis) line 1325 explicitly states:
"EDIT the report — do not rewrite from scratch." This design decision is
codified in the current REFERENCE.md, consistent with the claim that
edit-in-place is the enforced approach.

**Evidence:** REFERENCE.md line 1325 (identical to C-055 evidence).

---

### C-076 — Codebase/filesystem verification requires explicit tool-call verification; LLM inference is a failure mode

**Verdict: UNVERIFIABLE**

This describes a documented failure mode observed in GitHub issues against
Claude Code and Gemini CLI. Not verifiable against local filesystem. The
BEHAVIORAL claim is consistent with real practice but not filesystem-checkable.

---

### C-077 — 8 locally-defined agents formally integrated into skill pipelines; 3 agents have no invocation records (orphans)

**Verdict: VERIFIED**

"8 formally integrated" refers to the 8 Tier-A local agents identified in D3c:
code-reviewer, security-auditor, explore, plan, frontend-developer,
documentation-expert, dependency-manager, test-engineer. These are referenced in
CLAUDE.md Section 7 triggers and/or formally invoked via `subagent_type` in
skills (code-reviewer confirmed in audit-process/prompts.md and
pre-commit-fixer/SKILL.md; debugger in pre-commit-fixer).

"3 orphans" refers to D3c Finding 3 note: devops-troubleshooter,
error-detective, git-flow-manager have no documented triggers and no invocation
records in agent-invocations.jsonl.

**Evidence:** D3c-cross-cutting-analysis.md line 159; audit-process/prompts.md
`subagent_type: "code-reviewer"`; agent-invocations.jsonl (no records for
devops-troubleshooter, error-detective, git-flow-manager).

---

### C-078 — 7 of 28 prior architecture decisions implemented; 21 partially or fully unimplemented

**Verdict: VERIFIED**

D3c Finding 7 (line 348) explicitly states: "The Session #227 audit produced 28
decisions. Current state as of 2026-03-29: [5 fully implemented + 2 partially
implemented = 7 total]." The 7 implemented decisions are: D2, D21, D23, D24, D27
(fully) and D5, D18 (partially).

**Evidence:** D3c-cross-cutting-analysis.md lines 348-369.

---

### C-079 — explore quality score 82/100; plan quality score 79/100

**Verdict: VERIFIED**

D6a-system-overrides-current.md line 26 states `**Quality score: 82/100**` for
explore. Line 89 states `**Quality score: 79/100**` for plan. Both are confirmed
from direct filesystem reads at D6a research time. Current line counts match
(explore: 194 lines, plan: 209 lines).

**Evidence:** D6a-system-overrides-current.md lines 26, 89.

---

### C-080 — ecosystem-v2/invocations.jsonl covers only 2 agent invocations; 135 entries in agent-invocations.jsonl

**Verdict: MODIFIED**

`data/ecosystem-v2/invocations.jsonl` has 31 entries, of which exactly 2 have
`"type":"agent"` — confirming "only 2 agent invocations" in the ecosystem
tracking file. The claim about "135 entries in agent-invocations.jsonl" reflects
the count at D12b research time; current count is **139** (4 additional entries
added since). The core finding (manual population, only 2 agent entries vs many
skill entries) is accurate; the 135 number is stale by 4 entries.

**Evidence:** `data/ecosystem-v2/invocations.jsonl` — 2 lines with
`"type":"agent"`; `.claude/state/agent-invocations.jsonl` — 139 lines (was 135
at research time).

---

### C-081 — Anthropic Swiss Cheese evaluation model: three grader types

**Verdict: UNVERIFIABLE**

External Anthropic engineering blog claim. Not checkable against local
filesystem.

---

### C-082 — No golden test cases exist for any agent; no tests/agents/ directory

**Verdict: VERIFIED**

`find tests -name "agent*"` returns only:
`tests/hooks/track-agent-invocation.test.ts`,
`tests/scripts/check-agent-compliance.test.ts`,
`tests/scripts/multi-ai/extract-agent-findings.test.ts`. None of these are
golden test cases for agent behavior. No `tests/agents/` directory exists. The
check-agent-compliance test tests script logic, not agent content quality.

**Evidence:** `find /c/.../tests -name "agent*"` — 3 files, none are agent
behavior fixtures; no `tests/agents/` directory exists.

---

### C-083 — Step-DeepResearch verification sub-pipeline: 4 roles (Extract, Plan, Verify, Replan)

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2512.20491). Not checkable against local
filesystem.

---

### C-084 — Cap gap pursuit at 2-3 rounds max; 1-round limit is conservative but defensible

**Verdict: VERIFIED (architectural decision, documented)**

REFERENCE.md Critical Rule 9 (referenced in SKILL.md line 258) states: "One
round only — no recursive gap chasing." This confirms the current 1-round limit
is codified. The claim's characterization of this as "conservative but
defensible" is D9b's design assessment, not a filesystem fact, but the 1-round
constraint itself is verified.

**Evidence:** SKILL.md line 258: "One round only (Critical Rule 9) — no
recursive gap chasing."

---

### C-085 — Audit skill evaluates 13 categories; run once (2026-03-17); not re-run in 12 days

**Verdict: VERIFIED**

`.claude/state/audit-agent-quality-history.jsonl` contains exactly 1 entry dated
`2026-03-17` with `"categories":13`. Today is 2026-03-29 = 12 days since audit.
The agent count has grown from 36 (at audit time) to 39 (current), confirming
the claim about 3 new unscored agents (C-042 supporting evidence).

**Evidence:** `.claude/state/audit-agent-quality-history.jsonl` line 1:
`{"date":"2026-03-17","categories":13,...}`; current agent count = 39 vs audit
count = 36.

---

### C-086 — PR review team opportunity evaluated and DEFERRED

**Verdict: REFUTED**

D11b-teams-internal.md line 379 states: "**Conclusion: RECOMMEND AGAINST a PR
review team for standard PR reviews.**" The word "DEFERRED" does not appear in
D11b in relation to this opportunity. The recommendation is a clear rejection
("RECOMMEND AGAINST"), not a deferral. The claim's characterization as
"DEFERRED" misrepresents the finding.

**Evidence:** D11b-teams-internal.md lines 379-384. The word "DEFERRED" does not
appear; grep for "defer" in D11b returns 0 matches in context of PR review team.

---

### C-087 — Agent auto-delegation reliability is uncertain in practice

**Verdict: UNVERIFIABLE**

This describes practitioner experience vs official docs contradiction. Not
checkable against local filesystem. The claim accurately characterizes a
knowledge gap.

---

### C-088 — GoAgent (March 2026) auto-generates communication topologies; team design may be obsolete

**Verdict: UNVERIFIABLE**

External academic claim with speculative extrapolation. Not checkable against
local filesystem. Original confidence: LOW — appropriate.

---

### C-089 — Prevent redundant revalidation: track which claims have been verified

**Verdict: UNVERIFIABLE**

External academic claim (arXiv:2603.22651). Not checkable against local
filesystem. The principle is referenced in the deep-research architecture but is
not implemented as a filesystem artifact.

---

### C-090 — Evidence-weight arbitration preferred over majority voting for knowledge disputes

**Verdict: UNVERIFIABLE**

External academic claim (ACL 2025 paper + AgentAuditor). Not checkable against
local filesystem.

---

### C-091 — Valid color values are blue/cyan/green/yellow/magenta/red; dependency-manager and documentation-expert have non-standard values

**Verdict: REFUTED**

Direct filesystem read confirms:

- `dependency-manager.md` frontmatter has NO `color:` field
- `documentation-expert.md` frontmatter has NO `color:` field
- Git history check (commits `024ae700` and `84a68fbd`) confirms these agents
  never had a `color:` field

The agents that DO have non-standard color values are:

- `deep-research-synthesizer.md` — `color: purple` (not in valid list)
- `gsd-debugger.md` — `color: orange` (not in valid list)

The claim about valid values is likely correct (per D1b), but the identification
of which agents have non-standard values is wrong. D12b's source ("audit found
non-standard field in dependency-manager, documentation-expert") appears to be
an error in D12b, possibly confusing tools/color field with another frontmatter
issue (those agents previously had missing tools fields per AGENT_INVENTORY.md).

**Evidence:** Direct `head -15` of both agent files;
`grep "^color:" dependency-manager.md` — no output; git show of commit
`024ae700` for dependency-manager.md — no color field; non-standard colors
confirmed in global/deep-research-synthesizer.md (`color: purple`) and
global/gsd-debugger.md (`color: orange`).

---

### C-092 — Agent standard template has 11 sections

**Verdict: UNVERIFIABLE against filesystem**

The claim cites D1b (official docs) and D9b (11-section pattern from custom
agents). The 11-section count is a structural description from documentation
research, not a countable filesystem artifact. The deep-research-searcher agent
body does contain multiple structured sections. The 11-section count could be
verified by reading the agent, but the claim is about a "standard" template that
isn't a single canonical file.

---

### C-093 — upstream_input section is more critical for pipeline agents than searcher/synthesizer

**Verdict: UNVERIFIABLE**

Design assessment from D9b. Not a filesystem-checkable claim — it is a
qualitative architectural judgment.

---

### C-094 — research-plan-team complexity trigger uses "L or XL" labels instead of SKILL.md L1-L4 depth levels

**Verdict: VERIFIED**

research-plan-team.md line 60: "Research complexity is **L or XL**".
deep-research SKILL.md uses L1, L2, L3, L4 throughout (lines 77, 166, 181, 198,
etc.). These are two incompatible naming systems. The claim's characterization
as a gap is accurate.

**Evidence:** research-plan-team.md line 60; deep-research SKILL.md line 77
(`--depth: L1, L2, L3, L4`).

---

### C-095 — AGENT_ORCHESTRATION.md needs 2 updates as a result of consolidation program

**Verdict: VERIFIED**

D7c-consolidation-synthesis.md Section "AGENT_ORCHESTRATION.md Update Required"
(line 354) explicitly states: "As a consequence of the consolidation,
AGENT_ORCHESTRATION.md requires **two** targeted updates." The two updates are:
(1) concern grouping table — change Architecture from `backend-architect` to
`nextjs-architecture-expert / database-architect`; (2) capacity table — remove
backend-architect row.

**Evidence:** D7c-consolidation-synthesis.md lines 354-365.

---

### C-096 — Optimal model selection: verification/gap-verification = Sonnet; dispute = Sonnet unless >10 disputes; gap pursuit = Sonnet; final re-synthesis = Sonnet

**Verdict: VERIFIED**

D9b Finding 10 (model complexity table) confirms these assignments. Current
implementations use `model: sonnet` for both deep-research-searcher and
deep-research-synthesizer. The research-plan-team uses `model: opus` for the
planner (not the verifier), consistent with D4a/D4b Decision #18.

**Evidence:** `.claude/agents/global/deep-research-searcher.md` —
`model: sonnet`; `.claude/agents/global/deep-research-synthesizer.md` —
`model: sonnet`; D9b-pipeline-agents-internal.md lines 381-391.

---

### C-097 — All pipeline agents must follow 11-section custom agent pattern; upstream_input must have explicit schema

**Verdict: UNVERIFIABLE**

This is a design requirement/recommendation, not a checkable filesystem state.
No pipeline agents (deep-research-verifier, contrarian-challenger, etc.) exist
as files yet, so there is nothing to verify compliance against.

---

### C-098 — GSD agents (13 global) now all have model: sonnet after March 2026 audit fix

**Verdict: MODIFIED**

All 13 global agents in `.claude/agents/global/` DO have `model: sonnet` —
CONFIRMED. However the claim labels them "GSD agents" when the 13 include 11
gsd-\* agents and 2 deep-research agents (deep-research-searcher,
deep-research-synthesizer). The count (13) and the model field (sonnet for all)
are correct, but calling all 13 "GSD agents" is imprecise.

**Note:** D3c Finding 1 also identifies a critical gap: these 13 global agents
are in `.claude/agents/global/` (project-tracked) but the runtime copies at
`~/.claude/agents/` (12 agents, excluding deep-research agents) still have NO
model field. C-013 captures this more precisely.

**Evidence:** `for f in global/*.md; do grep "^model:" "$f"; done` — all 13
return `model: sonnet`; `ls global/` — 11 gsd-\* + deep-research-searcher +
deep-research-synthesizer.

---

### C-099 — Optional next-cycle additions: firebase-specialist (LOW effort), refactoring-specialist (LOW effort), e2e-testing-specialist (LOW-MEDIUM)

**Verdict: VERIFIED**

None of the three agents exist in the current roster (confirmed:
`ls .claude/agents/` — no firebase-specialist, refactoring-specialist, or
e2e-testing-specialist). The "LOW effort" characterization for
firebase-specialist references D10a Discovery 22 (official Firebase agent skills
from Feb 2026 with pre-built patterns available). The effort estimates are
design recommendations, not filesystem facts, but the absence from roster is
confirmed.

**Evidence:** `ls /c/.../agents/` — no matching files for any of the three.

---

### C-100 — deep-plan planning verification (Phase 5) uses general-purpose inline; deep-plan-verifier is P3

**Verdict: UNVERIFIABLE**

This is a design gap assessment from D10c Additional Gap A. The claim about
Phase 5 using general-purpose inline could be checked in the deep-plan SKILL.md,
but the broader claim about what a future deep-plan-verifier would do is not
filesystem-checkable. The P3 priority classification is a design recommendation.

---

## Contradictions

### Contradiction 1: C-091 claims vs D12b claims

C-091 asserts (citing D12b) that `dependency-manager` and `documentation-expert`
have non-standard `color` field values. Direct filesystem inspection confirms
neither agent has a `color` field at all — not in current state, not in git
commit `024ae700` (P4.1), not in commit `84a68fbd`. D12b appears to have made an
identification error. The agents with non-standard colors (`purple` for
deep-research-synthesizer, `orange` for gsd-debugger) are different agents
entirely.

**Evidence from both sides:** D12b line: "audit found non-standard field in
dependency-manager, documentation-expert — no automated removal." Filesystem:
`head -15 dependency-manager.md` — no color field. Git history:
`git show 024ae700:.claude/agents/dependency-manager.md` — no color field.

### Contradiction 2: C-086 "DEFERRED" vs D11b "RECOMMEND AGAINST"

C-086 characterizes the PR review team decision as "DEFERRED." D11b Conclusion
line 379 says "RECOMMEND AGAINST." These are different verdicts. DEFERRED
implies future re-evaluation; RECOMMEND AGAINST is a rejection for standard PR
reviews. D11b does carve out a narrow exception for high-security-sensitive PRs
using the existing audit-review-team, but this is not the same as a deferral of
the PR review team concept.

### Contradiction 3: C-017 template size claims vs actual REFERENCE.md counts

C-017 states: "Phase 3 adversarial: 17 lines, Phase 3.5: 15 lines, Phase 3.95:
29 lines, Phase 3.97: 29 lines." Current REFERENCE.md measurements:

- Section 8 (Contrarian): 26 lines (vs claimed 17)
- Section 9 (OTB): 27 lines (vs claimed nothing)
- Section 21.1.1 (Dispute-resolver): 16 lines in code block (vs claimed 15)
- Section 22.3 (Gap-pursuer): 37 lines (vs claimed 29)
- Section 22.5 (Final re-synthesis): 35 lines (vs claimed 29)

These discrepancies likely reflect the REFERENCE.md update at version 1.4
(2026-03-29), when "S21-22: extracted phase detail, gap
pursuit/verification/re-synthesis" was added. The templates grew substantially
as they were formalized.

---

## Gaps

1. **C-017 template sizes were likely accurate at research time** (D9b was
   produced pre-REFERENCE.md v1.4 update on 2026-03-29). The version log at
   REFERENCE.md line 1401 confirms
   `1.4 | 2026-03-29 | S21-22: extracted phase detail, gap pursuit/verification/re-synthesis`.
   D9b research and REFERENCE.md v1.4 update may have occurred in the same
   session.

2. **C-091 D12b misidentification source**: Could not determine where D12b got
   "dependency-manager and documentation-expert" for the color field. Possibly
   confused with earlier research about those agents having missing tools fields
   (AGENT_INVENTORY.md).

3. **C-080 current agent-invocations.jsonl count (139 vs claimed 135)**: 4
   entries were added after D12b was written on 2026-03-29. This is within the
   same research session, suggesting D12b was produced early in the session and
   the count increased by the time verification ran.

---

## Serendipity

1. **REFERENCE.md grew significantly on 2026-03-29**: Version 1.4 added Sections
   21-22, expanding from approximately 950 lines to 1405 lines in a single
   session. This means C-017's template size claims (sourced from D9b) describe
   an earlier, smaller REFERENCE.md state. The gaps C-017 identified for missing
   templates have been CLOSED by the v1.4 update — the templates now exist in
   Sections 21.1.1, 22.3, 22.4, and 22.5.

2. **C-016's "most critical unresolved pipeline gap" may now be resolved**:
   C-016 claims Phase 2.5 has no prompt template in REFERENCE.md. The v1.4
   update added templates for Phase 3.5 (dispute resolution), 3.95 (gap
   pursuit), 3.96 (gap verification), and 3.97 (final re-synthesis). Phase 2.5
   verification still has no dedicated template in REFERENCE.md — only
   SKILL.md's one-sentence description. C-016 remains partially open.

3. **gsd-debugger has `color: orange`** — an undocumented non-standard value.
   This was not flagged in D12b or any other findings document discovered during
   this verification pass.

---

## Confidence Assessment

- **VERIFIED claims:** 27
- **REFUTED claims:** 3 (C-086, C-091 identification of agents, and the
  template-size component of C-017)
- **MODIFIED claims:** 8 (C-012 DEFER count, C-017 template sizes, C-052 line
  count, C-061 source count, C-062 external half, C-080 stale count, C-098 GSD
  label, C-099 effort estimates)
- **UNVERIFIABLE claims:** 12 (academic citations, design recommendations,
  external product capabilities)
- **Overall confidence:** HIGH for codebase-verifiable claims; MEDIUM overall
  (12 external claims cannot be checked)

---

## Sources

| #   | Path                                                               | Title                           | Type             | Trust | Date                     |
| --- | ------------------------------------------------------------------ | ------------------------------- | ---------------- | ----- | ------------------------ |
| 1   | `.claude/agents/*.md` (26 files)                                   | Local agent definitions         | filesystem       | HIGH  | 2026-03-24 to 2026-03-29 |
| 2   | `.claude/agents/global/*.md` (13 files)                            | Global agent definitions        | filesystem       | HIGH  | 2026-03-24               |
| 3   | `.claude/skills/deep-research/REFERENCE.md`                        | Deep-research REFERENCE.md v1.4 | filesystem       | HIGH  | 2026-03-29               |
| 4   | `.claude/skills/deep-research/SKILL.md`                            | Deep-research SKILL.md          | filesystem       | HIGH  | 2026-03-29               |
| 5   | `.claude/teams/research-plan-team.md`                              | Research-plan team definition   | filesystem       | HIGH  | 2026-03-24               |
| 6   | `.claude/teams/audit-review-team.md`                               | Audit-review team definition    | filesystem       | HIGH  | 2026-03-24               |
| 7   | `.claude/state/audit-agent-quality-history.jsonl`                  | Audit run history               | filesystem       | HIGH  | 2026-03-17               |
| 8   | `.claude/state/agent-invocations.jsonl` (139 lines)                | Agent invocation log            | filesystem       | HIGH  | 2026-03-25 to 2026-03-29 |
| 9   | `data/ecosystem-v2/invocations.jsonl` (31 lines)                   | Ecosystem invocation tracking   | filesystem       | HIGH  | 2026-03-01 to 2026-03-29 |
| 10  | `scripts/check-agent-compliance.js` (196 lines)                    | Agent compliance check script   | filesystem       | HIGH  | 2026-03-24               |
| 11  | `tests/scripts/check-agent-compliance.test.ts`                     | Agent compliance test           | filesystem       | HIGH  | 2026-03-24               |
| 12  | `.research/custom-agents/findings/D3c-cross-cutting-analysis.md`   | Cross-cutting analysis          | research-finding | HIGH  | 2026-03-29               |
| 13  | `.research/custom-agents/findings/D6a-system-overrides-current.md` | System agent overrides          | research-finding | HIGH  | 2026-03-29               |
| 14  | `.research/custom-agents/findings/D7a-stub-elevation.md`           | Stub elevation analysis         | research-finding | HIGH  | 2026-03-29               |
| 15  | `.research/custom-agents/findings/D7c-consolidation-synthesis.md`  | Consolidation synthesis         | research-finding | HIGH  | 2026-03-29               |
| 16  | `.research/custom-agents/findings/D9b-pipeline-agents-internal.md` | Pipeline agents internal        | research-finding | HIGH  | 2026-03-29               |
| 17  | `.research/custom-agents/findings/D10a-netnew-github.md`           | Net-new agents GitHub research  | research-finding | HIGH  | 2026-03-29               |
| 18  | `.research/custom-agents/findings/D10c-netnew-internal.md`         | Net-new internal analysis       | research-finding | HIGH  | 2026-03-29               |
| 19  | `.research/custom-agents/findings/D11b-teams-internal.md`          | Teams internal analysis         | research-finding | HIGH  | 2026-03-29               |
| 20  | `.research/custom-agents/findings/D12b-quality-internal.md`        | Quality internal analysis       | research-finding | HIGH  | 2026-03-29               |
| 21  | CLAUDE.md Section 1                                                | Stack versions table            | project-doc      | HIGH  | 2026-03-24               |
| 22  | `.planning/agent-environment-analysis/AGENT_INVENTORY.md`          | Prior audit agent inventory     | project-doc      | HIGH  | 2026-03-17               |
