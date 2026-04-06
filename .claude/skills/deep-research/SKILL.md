---
name: deep-research
description: >-
  Multi-agent research engine that decomposes questions, dispatches parallel
  searcher agents, synthesizes findings with citations and confidence levels,
  runs mandatory contrarian/OTB challenges, gap-pursuit verification, and
  cross-model verification via Gemini CLI, and produces structured output with
  downstream adapters, research index, and management commands.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-04-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Research

Multi-agent research engine that does what a single conversation cannot.
Decomposes questions, dispatches parallel searcher agents, synthesizes with
citations and confidence levels, runs mandatory contrarian/OTB challenges, and
produces structured output with downstream routing.

## Critical Rules (MUST follow)

1. **Always show research plan before executing** -- present decomposition,
   agent allocation, cost estimate. Wait for approval. `--auto` skips plan
   approval only (all other checkpoints still require interaction). Recommend
   `--auto` only when invoked by another skill or for topics with prior
   research.
2. **Contrarian + OTB mandatory at ALL levels** -- no exceptions.
3. **Floor depth is L1 (Exhaustive)** -- no shallow modes. If someone wants
   quick, they ask Claude directly.
4. **Write to disk first** -- findings must survive crashes. **Output capture
   fallback:** On Windows, agent output files may be 0 bytes
   (anthropics/claude-code#39791). After each background agent completes, check
   the output file size. If 0 bytes, capture the task-notification result text
   and write it to the expected output file using the Write tool. Empty results
   must never be silently accepted -- if no output is available via any channel,
   report the failure to the user.
5. **State file updated after every state-changing event** -- enables resume.
6. **Research writes ONLY to `.research/<topic-slug>/`** -- never to
   consumer-owned artifacts.
7. **Agent allocation: `D + 3 + floor(D/5)` is the FLOOR** -- D = sub-questions.
   Assess scope, present formula vs recommendation, user decides final count.
8. **Context exhaustion = immediate re-spawn.** If any agent fails to write
   complete findings, re-spawn across 2+ smaller agents splitting the scope.
   Never accept partial output.
9. **Gap pursuit is mandatory scan, conditional execution.** After challenges +
   disputes, scan all findings for gaps. Spawn gap agents only if actionable
   gaps exist. **One round only** — gap agents' own gaps do NOT trigger
   recursion.

## When to Use / When NOT to Use

**Use:** Explicit `/deep-research` invocation | Domain understanding before
planning | Conflicting sources need evaluation | `/deep-plan` needs domain
research | Skill creation via `/skill-creator` | GSD project research.

**Don't use:** Simple factual questions | Codebase-only (use `Explore`) | User
wants confirmation | Mid-implementation lookups | Must complete in <2 minutes |
Creative ideation without a research question (use `/brainstorm` first).

## Routing Guide

| Situation                            | Use                | Why                                   |
| ------------------------------------ | ------------------ | ------------------------------------- |
| Creative ideation, direction unclear | `/brainstorm`      | Explore directions before researching |
| Domain research before planning      | `/deep-research`   | Structured multi-agent investigation  |
| Quick factual lookup                 | Ask Claude         | Single-turn, no orchestration needed  |
| Codebase understanding               | `Explore` agent    | Codebase-specific tools               |
| Planning with known domain           | `/deep-plan`       | Discovery-first planning              |
| Multi-phase project setup            | `/gsd:new-project` | Project-level with built-in research  |

## Input

**Argument:** `/deep-research "<topic>"`. Validation: empty topic = prompt user;

> 200 chars = confirm or abbreviate.

**Flags:**

| Flag                | Default | Effect                                             |
| ------------------- | ------- | -------------------------------------------------- |
| `--depth`           | L1      | L1, L2, L3, L4 (see REFERENCE.md Section 2)        |
| `--domain`          | auto    | Override auto-detected domain                      |
| `--auto`            | off     | Skip plan approval (Critical Rule #1)              |
| `--audit-details`   | off     | Full self-audit report instead of summary          |
| `--recall <topic>`  | —       | Search index for prior research (REFERENCE.md S18) |
| `--forget <topic>`  | —       | Archive/remove prior research (REFERENCE.md S18)   |
| `--refresh <topic>` | —       | Re-run, preserve old for diff (REFERENCE.md S18)   |

**Output:** `.research/<topic-slug>/` -- slug: lowercase, hyphens for spaces and
special chars, max 50 chars, 4-char hash suffix on collision.

---

## Process Overview

```
PHASE 0: Interactive Decomposition (inline)
  0.0: Duplicate check -- offer resume/re-research/abort if exists
  0.1: Classify (8 types) + domain detection
  0.2: Load domain module (domains/<domain>.yaml), pass to searchers
  0.3: Select depth (default L1)
  0.4: Q&A (level B: 2-3 rounds; fast-path: 1 round for simple topics;
       escalate to C if multi-domain/8+ dimensions). Persist after each round.
  0.5: Generate MECE sub-questions + internal overlap/gap verification
  0.6: Apply allocation formula
  0.7: Present plan with "Estimated: ~N min" (L1~15-25, L2~10-15, L3~25-40, L4~40-60+)
  0.8: Approve / modify / abort (--auto skips)
  0.9: Create state file

PHASE 1: Parallel Research (searcher agents)
  Spawn with: sub-questions, profile, path, depth, domain config
  Wave progress: "Wave N/M complete. X answered, Y remaining."
  Timeout: 5 min/searcher. USER CHECKPOINT on failures.

PHASE 2: Synthesis (synthesizer agent)
  Writes: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json
  RESEARCH_OUTPUT.md MUST include header: date (YYYY-MM-DD), session number,
  topic, depth level, agent count. Undated research is untraceable.

PHASE 2.5: Verification (mandatory, scales with depth)
  Spawn verification agents to test claims against filesystem.
  L1: 2 agents, L2: 2, L3: 3, L4: 4+. Split claims across agents.
  Context exhaustion = re-spawn per Critical Rule 8.

PHASE 3: Challenges (contrarian + OTB in parallel)
  Cross-model (Gemini CLI) + CL verification. Re-synthesize if >20% changed.

PHASE 3.5: Dispute Resolution (mandatory when conflicts exist)
  Spawn resolution agents for conflicting claims from verification + challenges.
  1 agent per 5 disputes. Produces findings/dispute-resolutions.md.

PHASE 3.9: Post-Challenge Re-Synthesis (if >20% changed)
  Incorporate verification corrections, challenge adjustments, dispute
  resolutions into RESEARCH_OUTPUT.md. CL-standard on re-synthesized report.

PHASE 3.95: Gap Pursuit (mandatory scan, conditional execution)
  Scan ALL findings for gaps/serendipity. Spawn gap agents if actionable.
  One round only — no recursive gap chasing. Critical Rule 9.

PHASE 3.96: Gap Verification (mandatory if gap agents spawned)
  Verify gap-pursuit findings against filesystem. Min 2 agents.

PHASE 3.97: Final Re-Synthesis (mandatory if gap agents spawned)
  Single synthesizer edits RESEARCH_OUTPUT.md with gap findings.
  Updates claims.jsonl, sources.jsonl, metadata.json. Truly final output.

PHASE 4: Self-Audit (inline, tiered by depth)

PHASE 5: Presentation + Routing
  Terminal summary -> "What next?" menu -> post-menu artifacts
```

Phase markers: `========== PHASE N: [NAME] ==========`

After each phase, report: "Phase N complete (X of 12 phases). ~Y% of estimated
duration elapsed."

---

## Phase 0: Interactive Decomposition

**0.0 Duplicate Check.** Check `.research/<topic-slug>/` existence: offer
resume, re-research, or abort. Check `research-index.jsonl` for >50% keyword
overlap and surface existing research.

**0.1 Classify.** 8 types (REFERENCE.md Section 1).

**0.2 Domain + Module.** Auto-detect domain (ask if uncertain). Read
`domains/<domain>.yaml`, pass `source_authority` + `verification_rules` to
searchers.

**0.3 Depth.** Default L1. `--depth` overrides.

**0.4 Q&A.** Level B: 2-3 rounds (batched 5-8). Escalate to C if multi-domain,
user requests, or 8+ sub-dimensions. **Fast-path:** 1 round for simple
well-scoped topics. Persist Q&A state after each round (compaction resilience).

**0.5 MECE.** Generate sub-questions with search profiles (web/docs/codebase/
academic). MECE verification: check overlaps + gaps, fix before presenting. **CL
quick-pass (MUST):** After generating sub-questions, run convergence-loop quick
preset to verify coverage -- are there blind spots? overlaps? Missing angles?
Fix before presenting plan.

**0.6 Allocation.** Floor: `D + 3 + floor(D/5)`. Assess scope, present formula
vs recommendation, user approves. Formula underestimates for large codebases.

**0.7 Plan.** Include estimated duration (L1: ~15-25 min, L2: ~10-15, L3:
~25-40, L4: ~40-60+. Add ~10-15 min if gap pursuit activates). `--auto` skips
approval.

**0.8-0.9 State.** Create `.claude/state/deep-research.<slug>.state.json`
(schema: REFERENCE.md Section 19).

---

## Phase 1: Parallel Research

Spawn searcher agents. Each receives: sub-questions, search profile, output
path, depth, domain, **domain config** (source_authority + verification_rules
from domain module). See REFERENCE.md Section 20 for spawn prompt example.

Respect 4-agent concurrency. Wave progress after each wave. **Timeout:** 5 min
per searcher -- mark failed, inform user. **User checkpoint:** if any failed,
ask proceed or re-run. **L4:** TeamCreate for interdependent sub-questions.

Each agent returns: sub-questions addressed, source count, confidence
distribution summary, gaps identified count, findings file path.

**Post-completion check (MUST):** After each searcher agent completes, verify
`FINDINGS.md` is non-empty (`wc -c`). If 0 bytes, write the task-notification
`<result>` text to the file. This is the Windows agent output fallback --
findings must exist on disk before Phase 2 begins.

**Post-research summary:** Before synthesis, present: sub-questions answered,
source count, top themes. Proceed to synthesis?

---

## Phase 2: Synthesis

**Pre-synthesis validation:** Before spawning the synthesizer, verify all
expected FINDINGS.md files are non-empty. If any are still 0 bytes after
fallback capture, list the empty files to the user and ask whether to proceed
with partial data or re-run the failed searchers.

Spawn synthesizer (`subagent_type="deep-research-synthesizer"`) with
findings_dir, output_dir, topic, depth, sub_questions. Verify:
RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json.

---

## Phase 2.5: Verification (mandatory)

Spawn `Agent(subagent_type="deep-research-verifier")` to test claims against
filesystem and web sources. Agent count: L1 (2), L2 (2), L3 (3), L4 (4+). Split
claims across agents to avoid context exhaustion. Re-spawn per Critical Rule 8.
Each writes `findings/V<N>-<scope>.md` with per-claim verdict (4-type taxonomy:
VERIFIED, REFUTED, UNVERIFIABLE, CONFLICTED) with evidence.

**Metric substantiation rule:** Any percentage claim (e.g., "70-80% of ideal",
"+80% improvement") MUST cite its measurement methodology, benchmark, or source.
Unsubstantiated % claims are flagged as UNVERIFIABLE by verifiers.

---

## Phase 3: Mandatory Challenges

Spawn `Agent(subagent_type="contrarian-challenger")` and
`Agent(subagent_type="otb-challenger")` **in parallel**. Scale: L1-L2 (1+1), L3
(2+2), L4 (3+3 + red team + pre-mortem). Agent definitions contain full
methodology; REFERENCE.md Sections 8-9 provide supplementary templates.
Cross-model + CL verification: REFERENCE.md Sections 13-14. Re-synthesize if
more than 20% of claims changed. If `gemini` CLI unavailable or fails more than
50% of calls, proceed with independent assessment. Record "cross-model:
unavailable" in metadata.json.

---

## Phase 3.5: Dispute Resolution (mandatory when conflicts exist)

Spawn `Agent(subagent_type="dispute-resolver")` for conflicting claims. 1 agent
per 5 disputes. Details: REFERENCE.md Section 21.

---

## Phase 3.9: Post-Challenge Re-Synthesis

Re-synthesize if >20% of claims changed by verification + challenges + disputes.
Otherwise apply corrections inline. Details: REFERENCE.md Section 21.

**User checkpoint:** Post-challenge report ready. Scan for gaps? [Y / skip to
self-audit]

---

## Phase 3.95: Gap Pursuit (mandatory scan, conditional execution)

Scan ALL findings for gaps and actionable discoveries across 6 source types
(D-agent gaps, serendipity items, REFUTED claims, challenge misses,
LOW/UNVERIFIED claims, unresolved questions). Deduplicate by keyword overlap,
filter for actionability. Spawn
`Agent(subagent_type="deep-research-gap-pursuer")` with appropriate `gapType`
profile (web, codebase, or academic). Formula: `ceil(G/2)` gap agents, capped by
depth (L1: 4, L2: 4, L3: 6, L4: 10). **One round only** (Critical Rule 9) -- no
recursive gap chasing. Skip Phases 3.96-3.97 if 0 actionable gaps.

If 50%+ gap agents fail, present options: proceed with partial findings,
re-spawn failed agents, or skip to self-audit.

Details: REFERENCE.md Section 22 (source list, dedup/actionability rules).

---

## Phase 3.96: Gap Verification (mandatory if gap agents spawned)

Same pattern as Phase 2.5 — spawn
`Agent(subagent_type="deep-research-verifier")`. Agent count: L1 (2), L2 (2), L3
(3), L4 (4). Each writes `findings/GV<N>-<scope>.md`. Details: REFERENCE.md
Section 22.

---

## Phase 3.97: Final Re-Synthesis (mandatory if gap agents spawned)

Spawn `Agent(subagent_type="deep-research-final-synthesizer")` in
`post-gap-pursuit` mode. Single synthesizer **edits** RESEARCH_OUTPUT.md (not
rewrite) with all findings. Updates claims.jsonl (`C-G*` IDs), sources.jsonl,
metadata.json. CL-standard on final report. Details: REFERENCE.md Section 22.

---

## Phase 4: Self-Audit

Inline tiered checks. T1 (all): completeness, citations, confidence
distribution, source diversity, contradictions, challenges. T2 (L2+): source
span, calibration. T3 (L3+): temporal validity, bias, actionability. T4 (L4):
8-dimension + adversarial. Default: summary. `--audit-details`: full report.

If checks reveal issues: present findings, ask "Fix and re-audit? [Y / present
as-is]"

---

## Phase 5: Presentation + Downstream Routing

Terminal summary, then menu: (1) deepen, (2) /deep-plan, (3) /skill-creator, (4)
GSD, (5) /convergence-loop for LOW claims, (6) save to memory, (7) view report,
(8) done. If metadata.json `hasDebtCandidates: true`, present: "Research
identified N debt candidates. Route to `/add-debt`? [Y/review/skip]" Post-menu:
cleanup, index entry, strategy log, source reputation, MCP memory. Details:
REFERENCE.md Sections 16-17, 20.

---

## Output Structure

`.research/<topic-slug>/` with `findings/`, `challenges/` (gitignored
intermediates) and `RESEARCH_OUTPUT.md`, `claims.jsonl`, `sources.jsonl`,
`metadata.json` (retained). Schemas: REFERENCE.md Section 11.

**Naming:** D-agents `D<N>-<scope>.md`, V-agents `V<N>-<scope>.md`, G-agents
`G<N>-<scope>.md`, GV-agents `GV<N>-<scope>.md`.

**Claims:** `C-001` sequential. Gap claims: `C-G001` sequential.

---

## Guard Rails

Key limits: budget checkpoints (70/85/95/100% of allocated agents), scope
explosion (more than 15 sub-questions requires user re-approval), failure
cascade (50%+ agents fail = stop and present options), timeout (5 min/agent),
gap recursion (1 round only). Details: REFERENCE.md Section 21.

---

## Compaction Resilience

On resume: read state file, validate JSON, skip completed phases. If state file
missing or corrupted, check for disk artifacts (`findings/`,
`RESEARCH_OUTPUT.md`) to determine resumption point. State file validation:
try-catch parse, check required fields (`status`, `phase`, `topic`). Fall back
to artifact-based recovery on corruption. Schema: REFERENCE.md Section 19.

---

## Integration

- **Neighbors:** `/deep-plan`, `/convergence-loop`, `/skill-creator`,
  `/gsd:research-phase`, `/skill-audit`, `/superpowers`
- **Team config:** `.claude/teams/research-plan-team.md` — spawned via skill
  triggers when research complexity is L/XL, not invoked directly
- **References:** [REFERENCE.md](./REFERENCE.md) (templates, schemas, prompts,
  domains, management commands)
- **Consumers:** claims.jsonl + sources.jsonl + metadata.json via adapters
  (REFERENCE.md Section 15)

---

## Version History

| Version | Date       | Description                                                                                                     |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| 1.9     | 2026-04-03 | Added Windows agent output fallback (anthropics/claude-code#39791)                                              |
| 1.8     | 2026-03-29 | Skill-audit: 20 decisions — UX, guard rails, output, compaction, CL, TDMS, scalability, extraction              |
| 1.7     | 2026-03-29 | Add Phases 3.95-3.97: gap pursuit, gap verification, final re-synthesis. Rule 9. Extract detail to REFERENCE.md |
| 1.6     | 2026-03-27 | Add Rules 8-10: context exhaustion re-spawn, mandatory verification + dispute resolution phases                 |
| 1.5     | 2026-03-23 | Formula is now FLOOR: scope-aware allocation with user override                                                 |
| 1.4     | 2026-03-22 | Skill-audit: 25 decisions, SKILL.md rewrite (<300 lines)                                                        |
| 1.3     | 2026-03-22 | P3: management commands, strategy log, source reputation                                                        |
| 1.2     | 2026-03-22 | P2: downstream adapters, GSD/deep-plan/skill-creator routing                                                    |
| 1.1     | 2026-03-22 | P1: Gemini CLI, research index, CL preset, search profiles                                                      |
| 1.0     | 2026-03-22 | Initial implementation                                                                                          |
