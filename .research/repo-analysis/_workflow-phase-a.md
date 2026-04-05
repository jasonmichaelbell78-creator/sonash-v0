# Phase A Workflow State — repo-analysis Creator View Gap Fixes

**Created:** 2026-04-05 (session #263) **Status:** ACTIVE **Owner:** Jason +
Claude **Purpose:** Compaction-resilient meta-plan coordinating skill updates to
`.claude/skills/repo-analysis/`. Survives session resets, context clears, and
cross-locale switches.

## Background

During a batch of `/repo-analysis` scans (notebooklm-py Standard, public-apis
Quick), Jason identified a blind spot: the Creator View doesn't analyze **links
inside a repo** (API entries in awesome-lists, tutorial links in learning-path
repos, registry entries in plugin marketplaces). For curated-list-type repos,
the links ARE the content — skipping them is like reviewing a library catalog
without opening any books.

Discussion expanded the gap list to 10 structural gaps across three tiers. Jason
approved 8 of 10 (Tier 1 + Tier 2 + G4 from Tier 3). Scope split into two phases
based on whether the gap can be addressed inline (Phase A) or requires
post-batch synthesis data (Phase B).

## The 8 Approved Gaps

### Phase A — Inline-compatible, blocks batch resume

Applied retroactively to previously analyzed repos after the skill update lands.

- **G1 — Link/reference recursion for curated-list and registry repos.** Add
  routing option "Mine links" + new absence pattern `CURATED_LIST` that triggers
  link recursion with home-repo relevance filtering. For public-apis, this means
  analyzing the ~850 API entries against SoNash and JASON-OS fit. For
  build-your-own-x, this means analyzing the ~500 tutorial entries.
- **G8 — Personal-fit vs objective-fit separation.** Current relevance ratings
  conflate "objectively brilliant" with "matches Jason's active projects." Split
  into two axes so brilliant-but-off-sprint ideas get flagged as "park for
  later" instead of downranked as "low relevance."
- **G9 — Anti-ideas / cautionary learnings section.** New Creator View section
  capturing what's worth AVOIDING from the repo, not just learning from. The
  public-apis CELEBRITY_STAGNATION finding is a prototype — it had no structural
  home in the current 5-section Creator View.
- **G10 — Long-tail repo bias fix.** Current health scoring penalizes
  solo-maintained, low-star, low-velocity repos (SOLO_MAINTAINER absence
  pattern + Needs Work Velocity bands). But those repos often contain the most
  novel thinking. Add a "creator-mode" scoring lens that doesn't punish
  long-tail repos the way the adoption-decision lens does.

### Phase B — Requires post-batch synthesis data

Deferred until the batch is complete and there's enough data to design against.

- **G2 — Cross-repo synthesis.** `EXTRACTIONS.md` aggregates candidates but
  doesn't synthesize. No "what's the emergent story across all analyzed repos?"
  artifact.
- **G4 — Knowledge-gap / negative-space detection.** Current Creator View asks
  "what did they figure out that you haven't?" (Behind section). The inverse —
  "what problems did they NOT solve that they should have?" — isn't asked. Their
  blindspots are creator opportunities.
- **G5 — Ecosystem meta-patterns.** After analyzing N skill repos, the skill
  should notice "all of them use YAML frontmatter but none have versioning —
  there's a gap in the ecosystem." Not surfaced anywhere today.
- **G7 — Reading chain / next-repo recommendations.** Repo A surfaces leads
  toward repo B. Skill captures these inline but doesn't build a reading chain.

## Gaps NOT in scope (deferred to "someday, maybe")

- **G3** — Recency weighting on home context
- **G6** — Creator mental-model-shift tracking

## Execution Flow (Authoritative Sequence)

The general pattern is `/deep-plan` → `skill-creator`, in that order. Earlier
working assumption that skill-creator's embedded deep-plan-style discovery was
sufficient for Phase A was wrong — Phase A has cross-cutting structural
decisions (value-map.json schema, data-structure for link mining, migration of
existing scanned repos) that skill-creator's skill-internal discovery would
underweight. Corrected below.

```
[CURRENT] Task #1: Prep + commit current session state
           └─ BLOCKED: pre-existing test failures (not caused by this session)
              ├─ Filed as TDMS debt items (2 items: ecosystem-v2 cluster + warning-lifecycle)
              └─ SKIP_CHECKS=tests + user-authored SKIP_REASON to unblock this commit

  ↓

Task #2: Phase A design via /deep-plan
  │  Input: this document + the 4 Phase A gaps
  │  Discovery must produce decisions on:
  │    - value-map.json schema changes for G8 fit separation
  │    - data structure for G1 link mining output (new file? candidate type?)
  │    - migration strategy for 6 already-scanned repos under new G10 scoring
  │    - structural placement of G9 anti-ideas in the 5-section Creator View
  │    - CURATED_LIST detection heuristic for G1
  │    - rollout order across the 4 gaps
  │  Output: decision record + step-by-step plan for skill-creator
  │
  ↓

Task #3: Phase A execution via skill-creator (BLOCKED BY Task #2)
  │  Input: decisions from Task #2
  │  Applies updates to:
  │    .claude/skills/repo-analysis/SKILL.md
  │    .claude/skills/repo-analysis/REFERENCE.md
  │    any new template/schema files
  │  Runs skill-creator's convergence-loop verification on the skill package
  │
  ↓

Task #4: Re-scan 6 previously analyzed repos under new Creator View lens
  │  Targets (existing entries in .research/repo-analysis/ and EXTRACTIONS.md):
  │    - teng-lin/notebooklm-py (Standard, session #263)
  │    - public-apis/public-apis (Quick → upgrade to Standard with link mining, session #263)
  │    - HKUDS/CLI-Anything
  │    - ViktorAxelsen/MemSkill
  │    - karpathy/autoresearch
  │    - codecrafters-io/build-your-own-x
  │  For each:
  │    - Apply link mining where CURATED_LIST pattern matches (public-apis, build-your-own-x likely)
  │    - Regenerate fit-separated rankings (G8)
  │    - Add anti-ideas section if applicable (G9)
  │    - Re-score under long-tail-friendly weights (G10)
  │  Output: updated per-repo artifacts + updated EXTRACTIONS.md + updated extraction-journal.jsonl
  │
  ↓

Task #5: Resume repo batch with new targets
  │  User queues next repos one at a time. Each benefits from Phase A improvements.
  │
  ↓

Task #6: Phase B via /deep-plan (after batch is complete)
  │  Critical architectural decision to resolve first:
  │    "extend repo-analysis to do cross-repo synthesis
  │     OR create /repo-synthesis as a companion skill
  │     that reads .research/repo-analysis/ outputs?"
  │  That decision shapes everything downstream.
  │  Then skill-creator for whichever skill (existing or new).
```

## Compaction Resilience Anchors

If this session is interrupted (compaction, context reset, locale switch), pick
up here:

1. **Read this file first.** It's the authoritative flow.
2. **Check task list** via `TaskList` tool — current task status persists.
3. **Check git log** for commits tagged `session #263` to see completed work.
4. **Check `.research/repo-analysis/EXTRACTIONS.md`** for which repos are
   tracked and their verdicts.
5. **Check `.claude/state/repo-analysis.*.state.json`** for per-repo scan state.

## Key Decisions Locked In (do not re-litigate)

- `/deep-plan` comes before `skill-creator` for Phase A (decision made
  2026-04-05 after initial skill-creator-only proposal was caught as
  insufficient).
- Phase A includes G1, G8, G9, G10. Phase B includes G2, G4, G5, G7.
- G3 and G6 deferred to someday-maybe.
- The 6 already-scanned repos will be re-processed under the new skill, not left
  on v1 schema.
- Test failures in the current session (12 files under
  dist-tests/tests/scripts/ecosystem-v2/ +
  scripts/health/lib/warning-lifecycle.test.js) are pre-existing, verified
  against main, filed as TDMS debt items, skipped for the session #263 state
  commit via user-authored SKIP_REASON.

## Context References

- Creator View spec: `.claude/skills/repo-analysis/SKILL.md` Phase 4
- Creator View example output:
  `.research/repo-analysis/teng-lin_notebooklm-py/creator-view.md` (first
  real-world exercise of the v3.0 spec)
- Cross-repo extraction tracker: `.research/repo-analysis/EXTRACTIONS.md`
- Extraction journal: `.research/repo-analysis/extraction-journal.jsonl`
- Full gap discussion: session #263 transcript (this conversation)

## Status Log

| Date       | Event                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- |
| 2026-04-05 | Document created. Task #1 in progress — resolving pre-commit block for session state commit. |
