---
name: deep-research
description: >-
  Multi-agent research engine that decomposes questions, dispatches parallel
  searcher agents, synthesizes findings with citations and confidence levels,
  runs mandatory contrarian/OTB challenges and cross-model verification via
  Gemini CLI, and produces structured output with downstream adapters, research
  index, and management commands.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.5
**Last Updated:** 2026-03-23
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
4. **Write to disk first** -- findings must survive crashes.
5. **State file updated after every state-changing event** -- enables resume.
6. **Research writes ONLY to `.research/<topic-slug>/`** -- never to
   consumer-owned artifacts.
7. **Agent allocation: `D + 3 + floor(D/5)` is the FLOOR, not the answer** -- D
   = sub-questions. Always assess scope size (file count, plan count, lines to
   read) and present: "Formula suggests N. Scope has X. I recommend Y.
   Override?" User decides final count.
8. **Context exhaustion = immediate re-spawn.** If any agent completes without
   writing its findings file (or writes only a header), it ran out of context.
   Never accept partial output. Immediately re-spawn the work across 2+ smaller
   agents that split the original scope. Each replacement agent must produce a
   complete findings file. If the scope cannot be split, re-spawn with a more
   focused prompt that reads fewer files.

## When to Use / When NOT to Use

**Use:** Explicit `/deep-research` invocation | Domain understanding before
planning | Conflicting sources need evaluation | `/deep-plan` needs domain
research | Skill creation via `/skill-creator` | GSD project research.

**Don't use:** Simple factual questions | Codebase-only (use `Explore`) | User
wants confirmation | Mid-implementation lookups | Must complete in <2 minutes.

## Routing Guide

| Situation                       | Use                | Why                                  |
| ------------------------------- | ------------------ | ------------------------------------ |
| Domain research before planning | `/deep-research`   | Structured multi-agent investigation |
| Quick factual lookup            | Ask Claude         | Single-turn, no orchestration needed |
| Codebase understanding          | `Explore` agent    | Codebase-specific tools              |
| Planning with known domain      | `/deep-plan`       | Discovery-first planning             |
| Multi-phase project setup       | `/gsd:new-project` | Project-level with built-in research |

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
  0.7: Present plan with "Estimated: ~N min" (L1~5-10, L2~3-5, L3~10-20, L4~20-40)
  0.8: Approve / modify / abort (--auto skips)
  0.9: Create state file

PHASE 1: Parallel Research (searcher agents)
  Spawn with: sub-questions, profile, path, depth, domain config
  Wave progress: "Wave N/M complete. X answered, Y remaining."
  Timeout: 5 min/searcher. USER CHECKPOINT on failures.

PHASE 2: Synthesis (synthesizer agent)
  Writes: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json

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

PHASE 4: Self-Audit (inline, tiered by depth)

PHASE 5: Presentation + Routing
  Terminal summary -> "What next?" menu -> post-menu artifacts
```

Phase markers: `========== PHASE N: [NAME] ==========`

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
academic). MECE verification: check overlaps + gaps, fix before presenting.

**0.6 Allocation.** Compute floor: `D + 3 + floor(D/5)`. Then assess scope size
(files, plans, lines to read). Present both: "Formula floor: N. Scope: X
files/plans. Recommended: Y agents." User approves final count. The formula
underestimates for large codebase tasks where agents need to read contextually
(not just grep).

**0.7 Plan.** Include estimated duration. `--auto` skips approval.

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

---

## Phase 2: Synthesis

Spawn synthesizer with findings_dir, output_dir, topic, depth, sub_questions.
Verify: RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json.

---

## Phase 2.5: Verification (mandatory)

Spawn dedicated verification agents that test claims against the actual
filesystem. These agents read the synthesized report, extract testable claims,
and verify each by reading the referenced files.

**Agent count scales with depth:** L1 (2 agents), L2 (2), L3 (3), L4 (4+).
**Split claims across agents** to avoid context exhaustion (e.g., V1 checks
codebase claims, V2 checks data claims, V3 checks cross-claim consistency).
**Context exhaustion = re-spawn** per Critical Rule 8 — split further if needed.

Each verification agent writes to `findings/V<N>-<scope>.md` with per-claim
verdict: VERIFIED (with file:line evidence) or REFUTED (with what's actually
there).

---

## Phase 3: Mandatory Challenges

Contrarian and OTB agents **run in parallel**. Scale: L1-L2 (1+1), L3 (2+2), L4
(3+3 + red team + pre-mortem). Templates: REFERENCE.md Sections 8-9.
Cross-model + CL verification: REFERENCE.md Sections 13-14. Re-synthesize if

> 20% claims changed.

---

## Phase 3.5: Dispute Resolution (mandatory when conflicts exist)

When verification agents or challenge agents surface conflicting claims, spawn
resolution agents to produce definitive answers with evidence.

**Scale:** 1 agent for ≤5 disputes, 2 agents for 6-10, 3 for 11+. Each dispute
gets: RESOLUTION, RATIONALE, IMPACT (what changes in the report), CONFIDENCE.

Resolution agents write to `findings/dispute-resolutions.md`. If multiple
agents, split into `dispute-resolutions-1.md`, `dispute-resolutions-2.md`.

**Context exhaustion = re-spawn** per Critical Rule 8.

---

## Phase 3.9: Post-Challenge Re-Synthesis

If verification corrections + challenge adjustments + dispute resolutions change
more than 20% of claims, spawn a re-synthesis agent to rewrite
RESEARCH_OUTPUT.md incorporating all corrections. Apply CL-standard to the
re-synthesized report.

If ≤20% changed, apply corrections inline (no re-synthesis agent needed).

---

## Phase 4: Self-Audit

Inline tiered checks. T1 (all): completeness, citations, confidence
distribution, source diversity, contradictions, challenges. T2 (L2+): source
span, calibration. T3 (L3+): temporal validity, bias, actionability. T4 (L4):
8-dimension + adversarial. Default: summary. `--audit-details`: full report.

---

## Phase 5: Presentation + Downstream Routing

Terminal summary, then menu: (1) deepen, (2) /deep-plan, (3) /skill-creator, (4)
GSD, (5) /convergence-loop for LOW claims, (6) save to memory, (7) view report,
(8) done. Post-menu: cleanup, index entry, strategy log, source reputation, MCP
memory. Details: REFERENCE.md Sections 16-17, 20.

---

## Output Structure

```
.research/<topic-slug>/
  findings/              # gitignored -- intermediate
  challenges/            # gitignored -- intermediate
  RESEARCH_OUTPUT.md     # retained -- report
  claims.jsonl           # retained -- machine-parseable
  sources.jsonl          # retained -- source registry
  metadata.json          # retained -- metadata + consumer hints
```

**Gitignore rationale:** Intermediate artifacts (findings/, challenges/) are
gitignored. Conclusion artifacts retained for decision provenance and
cross-session recall. Schemas: REFERENCE.md Section 11.

---

## Guard Rails

- **Budget:** Design targets, not hard limits. Use agent/round count as proxies
  if token tracking unavailable. Warn 70/85/95%. At 100%: force synthesis.
- **Scope explosion:** >15 sub-questions = pause, offer continue/reduce/split.
- **Failure cascade:** 50%+ agents fail = stop, present options.
- **Timeout:** 5 min/searcher. Mark failed, present to user.
- **Disengagement:** Save state, present completed vs remaining.

---

## Compaction Resilience

State file updated after every event. Resume: read state, skip completed. Disk
artifacts persist as checkpoints. Phase 0 Q&A persisted incrementally. Schema:
REFERENCE.md Section 19.

---

## Integration

- **Neighbors:** `/deep-plan`, `/convergence-loop`, `/skill-creator`,
  `/gsd:research-phase`, `/skill-audit`, `/superpowers`
- **Team config:** `.claude/teams/research-plan-team.md` — when `/deep-research`
  is followed by `/deep-plan` on the same topic, the research-plan-team can
  coordinate the handoff (researcher → planner → verifier pipeline)
- **References:** [REFERENCE.md](./REFERENCE.md) (templates, schemas, prompts,
  domains, management commands)
- **Consumers:** claims.jsonl + sources.jsonl + metadata.json via adapters
  (REFERENCE.md Section 15)

---

## Version History

| Version | Date       | Description                                                                                     |
| ------- | ---------- | ----------------------------------------------------------------------------------------------- |
| 1.6     | 2026-03-27 | Add Rules 8-10: context exhaustion re-spawn, mandatory verification + dispute resolution phases |
| 1.5     | 2026-03-23 | Formula is now FLOOR: scope-aware allocation with user override                                 |
| 1.4     | 2026-03-22 | Skill-audit: 25 decisions, SKILL.md rewrite (<300 lines)                                        |
| 1.3     | 2026-03-22 | P3: management commands, strategy log, source reputation                                        |
| 1.2     | 2026-03-22 | P2: downstream adapters, GSD/deep-plan/skill-creator routing                                    |
| 1.1     | 2026-03-22 | P1: Gemini CLI, research index, CL preset, search profiles                                      |
| 1.0     | 2026-03-22 | Initial implementation                                                                          |
