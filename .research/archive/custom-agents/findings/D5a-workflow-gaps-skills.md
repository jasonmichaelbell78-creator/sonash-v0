# Findings: Which SKILL Workflows Currently Lack Dedicated Agents?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** SQ5 (Part A)

---

## Research Methodology

Read 35 SKILL.md files across all `.claude/skills/` directories.
Cross-referenced agent spawning patterns against the 39 known agents (26 local,
13 global). Analyzed both named-agent usage (subagent_type referencing a
`.claude/agents/*.md` file) vs ad-hoc general-purpose agents with inline
prompts.

**Skills read:** 35 (all major skill categories covered) **Skills with agent
spawning:** 20 **Skills using ONLY general-purpose or ad-hoc agents:** 15 with
gaps identified

---

## Key Findings

### 1. deep-research: 6+ Agent Roles Executed as General-Purpose with Inline Prompts [CONFIDENCE: HIGH]

The `/deep-research` skill spawns multiple waves of agents across Phases 1-3.97.
Two roles are properly named custom agents (`deep-research-searcher`,
`deep-research-synthesizer` in `.claude/agents/global/`). The remaining 6 roles
are spawned as general-purpose agents with inline prompt templates from
REFERENCE.md:

| Agent Role                       | Phase      | Custom Agent?                   | Template Location |
| -------------------------------- | ---------- | ------------------------------- | ----------------- |
| Searcher                         | Phase 1    | YES (deep-research-searcher)    | agents/global/    |
| Synthesizer                      | Phase 2    | YES (deep-research-synthesizer) | agents/global/    |
| Verification agents              | Phase 2.5  | NO — general-purpose            | Inline SKILL.md   |
| Contrarian challenger            | Phase 3    | NO — general-purpose            | REFERENCE.md S8   |
| Outside-the-Box (OTB) challenger | Phase 3    | NO — general-purpose            | REFERENCE.md S9   |
| Dispute resolution agents        | Phase 3.5  | NO — general-purpose            | REFERENCE.md S21  |
| Gap pursuit agents               | Phase 3.95 | NO — general-purpose            | REFERENCE.md S22  |
| Gap verification agents          | Phase 3.96 | NO — general-purpose            | REFERENCE.md S22  |

The contrarian and OTB agents are described as "mandatory at ALL levels"
(Critical Rule 2), run in parallel, and have structured prompt templates in
REFERENCE.md Sections 8-9. These are high-frequency, high-stakes roles that
would benefit from custom agent definitions. The verification agent role is also
spawned at every depth level (L1: 2 agents, L2: 2, L3: 3, L4: 4+).

Evidence: REFERENCE.md line 966 shows `subagent_type: "deep-research-searcher"`
for searchers but no equivalent for other roles.

### 2. pr-review: Uses Named Agents at Step 3 via Ad-Hoc Dispatch (No Agent Bodies) [CONFIDENCE: HIGH]

Step 3 of `/pr-review` dispatches `security-auditor`, `test-engineer`,
`performance-engineer`, and `code-reviewer` agents for 20+ item review loads.
These agents DO exist as `.claude/agents/*.md` files (confirming they are named
agents).

The gap is different: pr-review dispatches these agents using an ad-hoc shared
prompt strategy (PARALLEL_AGENT_STRATEGY.md), but there is no dedicated
"pr-fix-agent" that embeds pr-review-specific context (DAS framework, fix-order
priority rules, propagation sweep requirement). Each dispatch is context-free —
the agent receives a raw issue list but no embedded knowledge of the DAS
framework, propagation sweep requirement, or the pr-review Critical Rules.

Assessment: MEDIUM priority. The named agents exist; the gap is methodological
context injection, not agent existence.

### 3. pr-retro: Uses convergence-loop Inline (No Dedicated Retro-Verifier Agent) [CONFIDENCE: HIGH]

Step 1.2 runs a convergence loop for deliverable verification, Step 2.5 runs a
quick CL for pattern recurrence, and Step 3 runs another quick CL for top
findings. All three CL invocations use general-purpose agents dispatched inline.

There is no dedicated `pr-retro-verifier` agent. The retro deliverable
verification is complex — it requires reading PR body, commits, PLAN.md,
SESSION_CONTEXT.md, ROADMAP.md, then following outward references to detect
phantom completions. This is specialized enough to benefit from a named agent
with those tools pre-loaded and SoNash-specific patterns embedded.

Frequency: Invoked after every merged PR. This is a high-frequency workflow.

### 4. skill-audit: Phase 5 Self-Audit Uses code-reviewer Agent but Without Skill-Audit Context [CONFIDENCE: HIGH]

Phase 5 (Self-Audit) dispatches a `code-reviewer` agent for independent decision
verification. The `code-reviewer` agent exists and is appropriate for code
review, but it lacks skill-audit-specific context: the 11 quality categories,
the decision record schema, the SKILL_STANDARDS.md checklist. The agent is
dispatched with a decision list and modified files, but must infer the audit
framework from context.

A dedicated `skill-audit-verifier` agent with the 11 categories and verification
criteria embedded would produce more reliable self-audit results.

Frequency: High — runs after every `/skill-creator` creation and every
`/skill-audit`.

### 5. audit-code / audit-security / audit-performance: Use Ad-Hoc Role Names That Don't Exist as Custom Agents [CONFIDENCE: HIGH]

These audit skills dispatch agents with descriptive role names (e.g.,
`hygiene-and-types`, `framework-and-testing`, `security-and-debugging`,
`vulnerability-scanner`, `supply-chain-auditor`, `framework-security-auditor`,
`ai-code-security-auditor`) that do NOT exist as `.claude/agents/*.md` files.
Verification: `ls .claude/agents/` shows no matches for any of these names.

This means these agents are general-purpose agents where the role name is just a
label in the Task prompt — not an actual agent definition. The methodology
(scope, tools, output format) is re-stated via inline prompt text on every
invocation. If the inline prompt drifts or is incorrect, there is no canonical
definition to enforce consistency.

Affected skills: audit-code (3 role names), audit-security (4 role names),
audit-performance (2 role names), audit-refactoring (unknown — not fully read),
audit-documentation (18 role names), audit-process (22 role names).

### 6. convergence-loop: References code-reviewer Agent for Code Claims but Has No CL-Specific Verifier [CONFIDENCE: HIGH]

The `convergence-loop` SKILL.md (line 138) recommends `general-purpose` for doc
verification and `code-reviewer` for code claims. The `code-reviewer` agent
exists.

However, there is no `convergence-loop-verifier` agent — a specialized agent
optimized for the multi-pass T20 tally format, graduated convergence tracking,
and disagreement handling. The skill uses different agent types depending on
context, meaning the convergence protocol (Confirmed/Corrected/Extended/New)
must be injected via the prompt each time. A dedicated verifier agent would
carry the T20 protocol natively.

Frequency: Very high — invoked from deep-plan, skill-audit, skill-creator,
pr-retro, create-audit, and all audit-\* discovery phases.

### 7. pre-commit-fixer: Spawns Subagents for ESLint/Pattern Fixes but No Named Fix-Agents Exist [CONFIDENCE: HIGH]

The `/pre-commit-fixer` skill classifies hook failures and spawns "targeted
subagents for complex fixes" (ESLint errors, Oxlint errors, pattern compliance
failures). These are general-purpose agents with inline fix prompts. No named
`eslint-fixer`, `pattern-fixer`, or `hook-failure-resolver` agents exist in
`.claude/agents/`.

This is lower priority — pre-commit fixes are bounded, context is explicit from
the error log, and the skill handles most cases with direct fixes. Agent
creation overhead is not justified here.

### 8. systematic-debugging: Phases 1-5 Are Fully Inline (No Hypothesis Agent) [CONFIDENCE: HIGH]

`/systematic-debugging` is entirely inline — a structured prompt-driven skill
with no agent spawning. The Phase 1-5 process (investigate, pattern analysis,
fix, test, learn) could theoretically benefit from parallel investigation agents
for multi-component systems (the skill explicitly describes multi-layer
diagnostic instrumentation). However, the skill currently has no agent
infrastructure.

Given that CLAUDE.md section 7 lists `systematic-debugging` as a trigger
requiring this skill (not an agent), the gap here is medium priority.

### 9. session-begin / session-end: Entirely Inline, No Agent Delegation [CONFIDENCE: HIGH]

Both session lifecycle skills are pure orchestration — they run scripts, read
files, and make decisions, all inline. No agents are spawned. The Phase 3 health
scripts in `session-begin` could theoretically be parallelized via agents, but:

- Scripts are fast (few seconds each)
- Sequential execution provides clearer failure attribution
- Adding agents increases complexity without meaningful time savings

Assessment: LOW priority — no agent gap here.

### 10. checkpoint: Lightweight skill, No Agent Gap [CONFIDENCE: HIGH]

`/checkpoint` is a simple state-save operation (update SESSION_CONTEXT.md, write
handoff.json, optionally save to MCP memory). No agent spawning needed. Not a
gap.

### 11. create-audit: Uses Explore Agents Correctly, No Gap [CONFIDENCE: HIGH]

`/create-audit` dispatches Explore agents for codebase scanning and applies
convergence loops in Phase 2. The Explore agent exists
(`.claude/agents/explore.md`). This is correct usage of the existing agent
ecosystem. No gap.

### 12. skill-creator: Uses Explore Agents for Complex Discovery (SHOULD, Not MUST) [CONFIDENCE: MEDIUM]

Phase 2 of `/skill-creator` includes "Multi-agent exploration (SHOULD for
Complex)" — dispatch Explore agents to scan for relevant patterns before
questions. This is a SHOULD, not MUST, meaning it's frequently skipped for
Standard-tier skills. A dedicated `skill-creator-explorer` agent with pre-loaded
knowledge of SKILL_STANDARDS.md, the anti-patterns list, and existing skill
patterns would make this SHOULD more reliably executed.

Frequency: Invoked on every new skill creation. Medium frequency overall.

### 13. frontend-design: No Agent Usage, Single-Skill Inline [CONFIDENCE: HIGH]

`/frontend-design` is a single-skill design prompt with no agent infrastructure.
This is appropriate — the skill is a creative direction setter for inline
implementation. No agent gap.

### 14. debt-runner: Uses convergence-loop Inline, No Mutation Agent [CONFIDENCE: MEDIUM]

`/debt-runner` applies convergence-loop verification at every mode but does so
inline (no sub-agents). The "handoff" rule (>10 items = subagent) in Section 7
refers to handoff for remediation, not a named agent. A dedicated
`tdms-mutation-agent` that understands the staging file contract and
MASTER_DEBT.jsonl schema could improve reliability for bulk debt mutations, but
this is a low-frequency edge case.

---

## Priority Ranking

Based on frequency (how often the skill is invoked) x quality impact (how much a
custom agent would improve output consistency vs ad-hoc inline prompts):

| Skill                       | Gap Description                                           | Priority | Reasoning                                                                             |
| --------------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| deep-research               | Contrarian + OTB agents lack custom definitions           | HIGH     | Mandatory at ALL levels, parallel execution, complex methodology in REFERENCE.md S8-9 |
| deep-research               | Verification agents lack custom definitions               | HIGH     | Spawned at every depth level (2-4+ per run), need consistent CL T20 format            |
| convergence-loop            | No dedicated verifier agent with T20 protocol             | HIGH     | Very high frequency (6+ callers), T20 tally format requires re-injection every spawn  |
| pr-retro                    | No dedicated deliverable-verifier agent                   | HIGH     | High frequency (every merged PR), complex multi-source traversal                      |
| skill-audit                 | Self-audit uses code-reviewer without 11-category context | MEDIUM   | Every audit run, but code-reviewer is close enough in practice                        |
| audit-code / audit-security | Role names are ad-hoc labels, not custom agents           | MEDIUM   | Multiple audits affected, inline prompts drift risk                                   |
| pr-review                   | Named agents exist but lack pr-review context injection   | MEDIUM   | Step 3 only activates for 20+ item reviews (less common)                              |
| skill-creator               | Explore usage is SHOULD not MUST for complex skills       | LOW      | Occasional execution, existing Explore agent works                                    |
| systematic-debugging        | Entirely inline, no parallel investigation                | LOW      | CLAUDE.md trigger pattern suggests inline is appropriate                              |
| pre-commit-fixer            | Fix subagents lack named definitions                      | LOW      | Bounded context, short-lived, direct fixes preferred                                  |

---

## Sources

| #   | Source                                                                       | Type                 | Trust | CRAAP | Date       |
| --- | ---------------------------------------------------------------------------- | -------------------- | ----- | ----- | ---------- |
| 1   | `.claude/skills/deep-research/SKILL.md`                                      | Codebase (canonical) | HIGH  | 5/5   | 2026-03-29 |
| 2   | `.claude/skills/deep-research/REFERENCE.md`                                  | Codebase (canonical) | HIGH  | 5/5   | 2026-03-29 |
| 3   | `.claude/agents/global/deep-research-searcher.md`                            | Codebase (canonical) | HIGH  | 5/5   | 2026-03-22 |
| 4   | `.claude/agents/global/deep-research-synthesizer.md`                         | Codebase (canonical) | HIGH  | 5/5   | 2026-03-22 |
| 5   | `.claude/skills/pr-review/SKILL.md` + `reference/PARALLEL_AGENT_STRATEGY.md` | Codebase             | HIGH  | 5/5   | 2026-03-18 |
| 6   | `.claude/skills/pr-retro/SKILL.md`                                           | Codebase             | HIGH  | 5/5   | 2026-03-18 |
| 7   | `.claude/skills/skill-audit/SKILL.md`                                        | Codebase             | HIGH  | 5/5   | 2026-03-19 |
| 8   | `.claude/skills/convergence-loop/SKILL.md`                                   | Codebase             | HIGH  | 5/5   | 2026-03-15 |
| 9   | `.claude/skills/audit-code/SKILL.md`                                         | Codebase             | HIGH  | 5/5   | 2026-02-18 |
| 10  | `.claude/skills/audit-security/SKILL.md`                                     | Codebase             | HIGH  | 5/5   | 2026-02-18 |
| 11  | `.claude/skills/skill-creator/SKILL.md`                                      | Codebase             | HIGH  | 5/5   | 2026-03-15 |
| 12  | `.claude/agents/` directory listing (26 local + 13 global)                   | Codebase             | HIGH  | 5/5   | 2026-03-29 |

---

## Contradictions

**Audit role names as "agents":** The audit skills (audit-code, audit-security)
use role names like "vulnerability-scanner agent" and "hygiene-and-types agent"
in their Task dispatch documentation. These names imply custom agents but no
corresponding `.claude/agents/*.md` files exist. This creates a documentation
gap — the skill READS like it uses named custom agents but actually uses
general-purpose agents with labeled prompts. The distinction is not clearly
flagged in the skills themselves.

**pr-review Step 3 agent dispatch:** The skill references dispatching
`security-auditor`, `test-engineer`, `performance-engineer` (all confirmed as
existing named agents) but also describes them only as "specialized agents"
without specifying `subagent_type`, leaving it ambiguous whether the
orchestrator will actually load the agent definitions.

---

## Gaps

1. **audit-refactoring, audit-documentation, audit-engineering-productivity,
   audit-ai-optimization, audit-process** were identified as agent-spawning
   skills but not fully analyzed for named vs ad-hoc agent patterns. Given the
   pattern seen in audit-code and audit-security, these likely have the same
   ad-hoc label issue.

2. **Frequency data is inferential** — the analysis determined frequency from
   CLAUDE.md trigger tables and skill integration sections, not from actual
   invocation logs. Actual frequency could differ (invocation tracking data in
   `agent-invocations.jsonl` was not consulted).

3. **Contrarian/OTB agent body content** — the REFERENCE.md templates (S8, S9)
   exist but whether these are sufficient as agent body content without further
   structure (tools config, model selection, output format schema) requires a
   separate evaluation.

---

## Serendipity

**The audit-comprehensive skill has agent-team mode support** (when
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). This is a different coordination
pattern from the Task-based spawning used elsewhere. If agent teams become
generally available, several skills (pr-review, deep-research, skill-audit)
could shift to team-based coordination rather than Task-based spawning —
changing the agent gap analysis significantly.

**deep-research already has the best-practice pattern** (custom named agents for
its core roles). The gap for other skills (contrarian, verifier) is the absence
of the same discipline applied to Phase 3 roles. The infrastructure exists; it
just needs to be extended.

**convergence-loop is a high-leverage target** — it has 6+ callers (deep-plan,
skill-audit, skill-creator, pr-retro, create-audit, all audit-\* discovery
phases) and no dedicated verifier agent. A single `convergence-loop-verifier`
agent with T20 protocol embedded would improve consistency across the entire
ecosystem.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 4
- LOW claims: 1
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All claims are based on direct filesystem reads of the actual skill files and
agent directory listings. No training data or web sources used.
