# PLAN: Creator View Comprehensive Upgrade

**Date:** 2026-04-05 **Session:** #263 **Decisions:**
[DECISIONS.md](./DECISIONS.md) (30 decisions) **Effort estimate:** XL — Two
skill-creator sessions + re-scan batch **Implementation:** skill-creator Task A
(repo-analysis, Steps 1-8) then Task B (repo-synthesis, Step 9). Review
checkpoint between.

---

## Task A: repo-analysis Skill Update (Steps 1-8)

### Step 1: Schema Foundations (Phase A1)

**Files:** `REFERENCE.md` Section 3 (output schemas)

Add `schema_version: "2.0"` to all output file schemas:

- `analysis.json` — add fields:
  ```json
  {
    "schema_version": "2.0",
    "repo_type": "library|application|curated-list|registry|documentation-hub|monorepo",
    "repo_type_secondary": "string|null",
    "ecosystem_tags": ["string"]
  }
  ```
- `value-map.json` — add fields per candidate:
  ```json
  {
    "schema_version": "2.0",
    "extraction_candidates": [{
      "...existing fields...",
      "objective_score": 0-100,
      "personal_fit_score": 0-100,
      "fit_class": "active-sprint|park-for-later|evergreen|not-relevant"
    }],
    "related_repos": [
      {
        "url": "string",
        "relationship": "inspired-by|uses|similar-to|contrast|extends|referenced-in",
        "discovery_context": "string"
      }
    ]
  }
  ```
- `extraction-journal.jsonl` — add `schema_version` field
- `findings.jsonl` — add `"cautionary"` to valid category values

Define new file schemas:

- `mined-links.jsonl` (per Decision #10):
  ```json
  {
    "title": "string",
    "url": "string",
    "category": "string",
    "source_line": "string",
    "description": "string",
    "objective_score": 0-100,
    "personal_fit_score": 0-100,
    "personal_fit_projects": ["string"],
    "confidence": "low|high",
    "depth": 0|1|2,
    "fetch_status": "not_fetched|success|failed|rate_limited",
    "tags": ["string"],
    "notes": "string"
  }
  ```
- `reading-chain.jsonl` (cross-repo, lives at
  `.research/repo-analysis/reading-chain.jsonl`):
  ```json
  {
    "from_repo": "owner/repo",
    "to_repo": "owner/repo",
    "relationship": "inspired-by|uses|similar-to|contrast|extends|referenced-in",
    "discovery_context": "string",
    "discovered_during": "owner/repo scan",
    "date": "ISO8601"
  }
  ```

**Done when:** All schemas documented in REFERENCE.md Section 3 with v2.0
markers. New file schemas (mined-links.jsonl, reading-chain.jsonl) have their
own subsections. Existing schemas show both new and existing fields clearly
distinguished.

---

### Step 2: Creator View Structure (Phase A2)

**Files:** `SKILL.md` Phase 4, `REFERENCE.md` Section 14

Update Creator View specification from 5 sections to 6:

**Section 1: What This Repo Understands (+ Blindspots)** Per Decision #11 —
extend existing section. After the "what they know" analysis, add a natural
complement: "...and what they don't." Blindspots = problems they didn't solve,
domains they didn't enter, failure modes they didn't anticipate. Per Decision
#11 rationale: contrast strengthens both halves.

Add to REFERENCE.md Section 14.3 prompts:

- What problems does this repo NOT solve that it arguably should?
- What failure modes or edge cases has this repo not anticipated?
- What domains adjacent to their core work have they not entered?

**Section 6: What's Worth Avoiding (NEW)** Per Decision #5 — new section after
Knowledge Candidates. Cautionary learnings and anti-ideas. Not "what's wrong
with this repo" (that's the Engineer View) — "what patterns, approaches, or
decisions from this repo should you consciously NOT replicate?"

Add to REFERENCE.md new Section 14.8:

- Anti-patterns embedded in the codebase or process
- Cultural or organizational decisions that led to negative outcomes
- Approaches that worked for them but would fail in your context
- Cautionary case studies (like CELEBRITY_STAGNATION from public-apis)
- Each anti-idea should cite specific evidence from the repo

**Home context loading order:** Per Decision #15 — formalize in REFERENCE.md
Section 14.2:

1. `SESSION_CONTEXT.md` (primary — current sprint, active work)
2. `ROADMAP.md` (secondary — project direction)
3. `CLAUDE.md` (constraints, stack)
4. `.claude/skills/` listing (skills inventory)
5. Active project memories from MEMORY.md

**Done when:** SKILL.md Phase 4 lists 6 sections. REFERENCE.md Section 14 has
subsections 14.1-14.8 (14.8 = What's Worth Avoiding spec). Section 14.2 loading
order is explicit with priority ranking. Section 14.3 has blindspot prompts.

---

### Step 3: Scoring Overhaul (Phase A3)

**Files:** `REFERENCE.md` Sections 4, 13

**Dual lens system:** Per Decisions #4, #19, #20 — add to REFERENCE.md:

New Section 4.2: Creator Lens Scoring

| Dimension       | Creator Weight | Coverage                                   |
| --------------- | -------------- | ------------------------------------------ |
| Security        | 5%             | Irrelevant for learning                    |
| Reliability     | 10%            | Nice-to-have                               |
| Maintainability | 15%            | Clean code easier to learn from            |
| Documentation   | 25%            | How you learn from a repo                  |
| Process         | 5%             | CI/CD irrelevant for learning              |
| Velocity        | 5%             | Active dev nice-to-have                    |
| Knowledge       | 35%            | KN-01 through KN-05 composite (Section 13) |

Rename existing Section 4 weight table to "Section 4.1: Adoption Lens Scoring"
(unchanged weights).

**Lens selection logic:** Per Decision #4 — both lenses always computed. Primary
lens inferred from `repo_type` (Decision #3):

- `library`, `application`, `monorepo` → adoption lens primary
- `curated-list`, `registry`, `documentation-hub` → creator lens primary
- User can override at scan time: `--lens=adoption|creator`

**Creator lens verdicts:** Per Decision #20 — add to REFERENCE.md:

| Score | Adoption Verdict | Creator Verdict |
| ----- | ---------------- | --------------- |
| 80+   | Adopt            | Study           |
| 60-79 | Trial            | Explore         |
| 40-59 | Extract          | Extract         |
| 0-39  | Avoid            | Note            |

**Display format:**

```
Adoption Lens: Trial (62) — viable dependency with caveats
Creator Lens:  Study (85) — deep engagement recommended [PRIMARY]
```

Primary lens marked with `[PRIMARY]`. Both always shown.

**Done when:** REFERENCE.md has Sections 4.1 (adoption, unchanged) and 4.2
(creator, new). Lens selection logic documented. Creator verdicts table present.
Display format specified. SKILL.md Phase 5 references both lenses.

---

### Step 4: Display & UX (Phase A4)

**Files:** `REFERENCE.md` Section 3.3, `SKILL.md` routing section

**EXTRACTIONS.md template update:** Per Decision #18 — update the cross-repo
summary table template:

Summary table adds a Fit column with classification badge:

```markdown
| Candidate     | Novelty | Effort | Fit    | Notes                            |
| ------------- | ------- | ------ | ------ | -------------------------------- |
| Skill Install | High    | E2     | [PARK] | Brilliant but not current sprint |
```

Per-repo detail tables add both scores:

```markdown
| Candidate     | Novelty | Effort | Obj | Fit | Notes |
| ------------- | ------- | ------ | --- | --- | ----- |
| Skill Install | High    | E2     | 88  | 25  | ...   |
```

**Fit badge derivation:** Per Decision #22:

- `personal_fit_score >= 60` → `[ACTIVE-SPRINT]`
- `personal_fit_score < 60 AND objective_score >= 60` → `[PARK]`
- `objective_score >= 40 AND personal_fit_score >= 40` → `[EVERGREEN]`
- Otherwise → no badge (low value)

**Knowledge Candidates prose callout:** Per Decision #22 — add to REFERENCE.md
Section 14.7: "After tiered listing, include a dedicated paragraph identifying
'brilliant but off-sprint' candidates (high objective, low personal fit). Frame
as 'worth parking, not discarding' with specific reasoning for why each is
high-objective."

**Quick Scan enriched gate:** Per Decision #21 — update SKILL.md Quick Scan gate
message for curated-list repos:

Current: `"Quick Scan complete. [bands]. Run Standard/Deep? [y/N]"`

New (when `repo_type = curated-list`):
`"Quick Scan complete. [bands]. Detected curated-list repo ([N] links found in README). Run Standard with link mining? Link mining extracts and scores each entry against your active projects. [y/N]"`

**Synthesis auto-offer:** Per Decision #13 — add to SKILL.md routing section:
after Standard/Deep completion, if
`ls .research/repo-analysis/*/analysis.json | wc -l >= 3`, offer:
`"You've analyzed [N] repos. Run /repo-synthesis for cross-repo insights? [y/N]"`

**Done when:** EXTRACTIONS.md template in REFERENCE.md updated with Fit column
and badge derivation rules. Section 14.7 has prose callout spec. SKILL.md Quick
Scan section has enriched gate for curated-list. SKILL.md routing section has
synthesis auto-offer.

---

### Step 5: Repo Type Detection (Phase A5 prerequisite)

**Files:** `REFERENCE.md` new Section 5b, `SKILL.md` Phase 0 + Phase 2

**Repo type classification system:** Per Decisions #3, #7, #28 — add
REFERENCE.md Section 5b: Repo Type Classification.

**Detection signals (Quick Scan — API data only):**

| Signal                                                             | Source                    | Strong/Moderate |
| ------------------------------------------------------------------ | ------------------------- | --------------- |
| README size > 50KB                                                 | Contents API `size` field | Strong          |
| Code-to-markdown ratio < 0.2                                       | Tree API file extensions  | Strong          |
| Topics include "awesome"/"list"/"resources"/"curated"/"collection" | REST metadata `topics`    | Strong          |
| < 20 code files outside docs/scripts/                              | Tree API                  | Moderate        |
| External link density > 5 per KB in README                         | Contents API + parse      | Strong          |
| Single top-level README + category dirs                            | Tree API                  | Moderate        |

**Classification thresholds:**

- 3+ strong signals → `curated-list`
- 2 strong + 1 moderate → `curated-list`
- turbo.json / nx.json / pnpm-workspace.yaml / lerna.json / rush.json →
  `monorepo`
- Structured data files (JSON/YAML) with URL fields + web frontend → `registry`
- Code-to-docs ratio > 0.3 but < 0.7, README > 10KB → `documentation-hub`
- Primary language present, code-to-markdown > 0.7 → `library` or `application`
  (distinguish by: CLI entry point or bin field → `application`, otherwise
  `library`)
- Default fallback: `library`

**Secondary type:** Per Decision #28 — if secondary signals are strong but don't
win primary, set `repo_type_secondary`. Example: build-your-own-x primary =
`curated-list`, secondary = `documentation-hub`.

**Standard mode refinement:** After clone (Phase 1), re-evaluate type with full
file access. Override Quick Scan classification if clone data contradicts. Log
classification change in state file.

**Done when:** REFERENCE.md Section 5b exists with full signal matrix,
thresholds, secondary type logic, and Standard mode refinement spec. SKILL.md
Phase 0 references repo type classification. SKILL.md Phase 2 references
refinement step.

---

### Step 6: Link Mining Pipeline (Phase A5)

**Files:** `SKILL.md` new Phase 4b, `REFERENCE.md` new Section 16

**New Phase 4b: Link Mining (conditional — curated-list and registry types)**

Per Decisions #2, #8, #9, #10, #29 — add after Phase 4 (Creator View), before
Phase 5 (Engineer View). Only runs when `repo_type` is `curated-list` or
`registry`.

**Phase 4b process:**

```
4b.1  Parse markdown structure → extract all links with context
4b.2  Categorize links using source repo's own category structure
4b.3  Score at Depth 0 (category match + keyword overlap with home context)
4b.4  Write mined-links.jsonl with confidence: "low"
4b.5  Interactive gate: "[N] links extracted. Fetch and verify? ~[M] min. [y/N]"
4b.6  If yes → Depth 1: HEAD-first (5 req/sec), selective full fetch (1 req/sec)
4b.7  Update mined-links.jsonl: confidence → "high", fetch_status updated
4b.8  Present top-N by personal_fit_score with [ACTIVE-SPRINT]/[PARK] badges
4b.9  Interactive gate: "Targeted deep-dive on specific links? [select/N]"
4b.10 If yes → Depth 2: full fetch + analysis on selected links only
```

**Markdown parsing rules:**

- Detect list format: `- [Title](URL) - Description` (most common in
  awesome-lists)
- Detect table format: `| Name | URL | Description |`
- Detect heading-based categories: `## Category Name` followed by list items
- Preserve source repo's category taxonomy in `category` field

**Depth 1 — HEAD-first strategy:** Per Decision #29:

1. Group links by domain
2. HEAD request at 5 req/sec, max 5 concurrent per domain
3. Record: HTTP status, Content-Type, Content-Length, title from headers
4. Filter: only full-fetch links where Depth 0 `personal_fit_score >= 40` OR
   `objective_score >= 70`
5. Full fetch filtered links at 1 req/sec
6. Extract: page title, meta description, Open Graph tags, first 500 chars of
   body text
7. Re-score with enriched data, update `confidence: "high"`

**Depth 2 — targeted deep-dive:** Per Decision #8: user selects specific links
from Depth 1 results. Full page analysis + follow internal links one level.
Write enriched findings to mined-links.jsonl with `depth: 2`.

**Home context for link scoring:** Per Decision #15: same loading as Creator
View (SESSION_CONTEXT.md primary, ROADMAP.md secondary).
`personal_fit_projects[]` populated from active sprint items.

**Done when:** SKILL.md has Phase 4b between Phase 4 and Phase 5 with
conditional trigger on repo_type. REFERENCE.md Section 16 has full link mining
spec: markdown parsing rules, depth levels, HEAD-first strategy, scoring logic,
interactive gates. mined-links.jsonl schema cross-references Section 3.

---

### Step 7: Cross-Repo Awareness (Phase A6)

**Files:** `SKILL.md` Phase 4 + Phase 6, `REFERENCE.md` new Section 17

**Lightweight cross-references during analysis:** Per Decisions #13, #14 — add
to Phase 4 (Creator View) and Phase 6 (Value Map):

During Creator View writing (Phase 4):

1. Check `.research/repo-analysis/*/value-map.json` for existing analyses
2. If matches found (similar ecosystem_tags, overlapping candidates), add
   cross-reference notes in Creator View Section 2 (What's Relevant)
3. Populate `related_repos[]` in value-map.json (Decision #14)

During Value Map generation (Phase 6):

1. Append to `.research/repo-analysis/reading-chain.jsonl` for any repo
   relationships discovered during analysis
2. Check reading-chain.jsonl for existing chains that this repo extends

**Synthesis auto-offer:** Per Decision #13 — after routing menu, if 3+ repos
analyzed:

```
"You've analyzed [N] repos. Cross-repo synthesis available via /repo-synthesis.
Run now? [y/N]"
```

**Done when:** SKILL.md Phase 4 has cross-reference check step. SKILL.md Phase 6
has reading-chain append step. REFERENCE.md Section 17 has cross-reference
matching logic and reading-chain.jsonl update rules. Synthesis auto-offer in
SKILL.md routing section.

---

### Step 8: Comprehensive Audit

**This is NOT a grep-and-check audit.** Per user instruction: overly
comprehensive, context-dependency following.

**8a. Decision-to-spec traceability:** For each of the 30 decisions, trace
forward through SKILL.md and REFERENCE.md:

- Decision referenced in spec? Where?
- Spec language consistent with decision choice?
- No contradictions between decision and spec text?
- No orphaned references to old behavior that decisions superseded?

**8b. Schema consistency:** For every field added to any schema (analysis.json,
value-map.json, mined-links.jsonl, reading-chain.jsonl, findings.jsonl,
extraction-journal.jsonl, EXTRACTIONS.md):

- Field documented in REFERENCE.md Section 3?
- Field type consistent across all references?
- Field consumed by at least one downstream process?
- No schema references to fields that don't exist?

**8c. Cross-section coherence:**

- Section 4.1 (adoption weights) + Section 4.2 (creator weights) sum to 100%?
- Creator lens includes Knowledge dimension; adoption lens does not?
- Verdict tables match band thresholds in Section 4?
- Repo type enum values consistent between Section 5b (detection) and Section 3
  (schema)?
- `cautionary` category in findings.jsonl referenced in Section 14.8?

**8d. Process flow integrity:** Walk through the complete analysis lifecycle for
each repo type:

- Library: Validate → Quick Scan (repo type = library) → Gate → Clone →
  Dimensions → Creator View (6 sections) → Engineer View (adoption primary,
  creator secondary) → Value Map (dual scores) → Routing
- Curated-list: Same but + Phase 4b (link mining) after Creator View, enriched
  Quick Scan gate, creator lens primary
- Verify no phase references a field not yet produced by a prior phase
- Verify conditional phases (4b) only trigger for correct repo types

**8e. Output contract verification for synthesis skill:** Decision #23 defines
the synthesis skill's input contract. Verify each input artifact is actually
produced by the updated repo-analysis spec:

- `value-map.json` with `objective_score`, `personal_fit_score`,
  `related_repos[]`
- `mined-links.jsonl` (conditional)
- `analysis.json` with `repo_type`, `ecosystem_tags`, `schema_version`
- `reading-chain.jsonl` (cross-repo)
- `EXTRACTIONS.md` with fit badges
- `extraction-journal.jsonl` with `schema_version`
- Creator View prose files

**8f. Backward compatibility:**

- v1 files (without `schema_version`) handled gracefully by any spec language
  that reads output files?
- Re-scan flow explicitly produces v2 and archives v1?
- No spec language assumes v2 fields exist in v1 files?

**Done when:** Audit report produced with pass/fail per check. All failures
fixed in SKILL.md/REFERENCE.md before proceeding. Audit report saved to
`.planning/creator-view-upgrade/AUDIT.md`.

**Depends on:** Steps 1-7 all complete.

---

### Step 8b: Skill Audit

**Tool:** `/skill-audit` on `.claude/skills/repo-analysis/`

Run the full interactive behavioral quality audit on the updated repo-analysis
skill. The skill-audit evaluates against 12 quality categories that the manual
audit (Step 8) doesn't cover:

- Attention management (does the skill guide AI focus correctly?)
- Completion verification (are "Done when" criteria testable?)
- T25 convergence loop (do verification steps actually converge?)
- State management (compaction resilience, resume correctness)
- Error handling (failure paths, no silent skips)
- Guard rails (scope creep prevention, home repo guard)
- Output quality (conversational prose, not clinical)
- Phase gating (proper gates between phases)
- Agent orchestration (dimension wave, link mining agents)
- Integration (cross-references to REFERENCE.md, synthesis skill contract)
- Behavioral consistency (new sections follow same style as existing)
- Complexity tier (Standard or Complex — determines self-audit depth)

**Fix any findings before proceeding.** The skill-audit produces actionable
decisions per finding; apply fixes to SKILL.md/REFERENCE.md directly.

**Done when:** `/skill-audit` produces a passing report with no unresolved
HIGH/CRITICAL findings. All fixes applied and re-verified.

**Depends on:** Steps 1-8 all complete.

---

## CHECKPOINT: Review repo-analysis update before starting Task B

Verify:

1. SKILL.md under 300 lines (per SKILL_STANDARDS.md)
2. REFERENCE.md internally consistent
3. All 30 decisions traceable to spec text
4. Output contracts match synthesis skill input requirements
5. `/skill-audit` passed (Step 8b)
6. User approves before proceeding to Task B

---

## Task B: /repo-synthesis Skill Creation (Step 9)

### Step 9: Companion Synthesis Skill

**Files:** NEW — `.claude/skills/repo-synthesis/SKILL.md`,
`.claude/skills/repo-synthesis/REFERENCE.md`

**Skill-creator invocation with this context:**

Per Decisions #13, #16, #23, #26, #27 — create a new skill:

**Skill identity:**

- Name: `/repo-synthesis`
- Location: `.claude/skills/repo-synthesis/`
- Purpose: Cross-repo synthesis across analyzed repositories. Produces emergent
  themes, ecosystem gaps, reading chains, mental model evolution, fit portfolio
  views, and cross-repo knowledge maps.

**Invocation:**

- Explicit: `/repo-synthesis`
- Auto-offered: by repo-analysis when 3+ repos in `.research/repo-analysis/`
- Input: all artifacts in `.research/repo-analysis/*/`

**6 outputs (per Decision #23):**

1. **Emergent Themes Report** (G2)
   - Read all Creator View prose files
   - Identify recurring themes, dominant patterns, contrarian signals
   - Output: conversational synthesis, not tables

2. **Ecosystem Gap Analysis** (G5)
   - Read `ecosystem_tags[]` from all `analysis.json` files
   - Group repos by tag, detect patterns within groups
   - Identify gaps: "all N repos do X but none do Y"
   - Output: gap list with evidence + opportunity assessment

3. **Reading Chain** (G7)
   - Read `reading-chain.jsonl`
   - Produce ordered sequence of repos to study
   - Label relationships between adjacent repos in chain
   - Output: visual chain + rationale for ordering

4. **Mental Model Evolution** (G6)
   - Read Creator Views chronologically (by scan date)
   - Identify shifts in what the user found interesting, challenging, relevant
   - Output: narrative of how perspective has evolved

5. **Fit Portfolio View**
   - Read all `value-map.json` files
   - Aggregate ALL candidates across repos
   - Sort by `objective_score` (the "what's brilliant regardless of sprint"
     view)
   - Apply current-fit overlay per Decision #24 (re-score against current
     SESSION_CONTEXT.md)
   - Output: ranked portfolio with current-fit badges

6. **Cross-Repo Knowledge Map**
   - Read all `analysis.json` ecosystem tags + Creator View Section 1
   - Map what domains are well-covered vs have gaps
   - Output: domain coverage matrix + gap recommendations

**Synthesis skill process:**

```
VALIDATE  Check .research/repo-analysis/ has 3+ repos
PHASE 1   Load all artifacts (value-maps, analysis.json, creator-views,
          reading-chain.jsonl, mined-links.jsonl where present)
PHASE 2   Produce 6 outputs
PHASE 3   Write synthesis report to .research/repo-analysis/SYNTHESIS.md
PHASE 4   Present inline + offer follow-up actions
```

**Done when:** `.claude/skills/repo-synthesis/SKILL.md` exists, under 300 lines.
`REFERENCE.md` exists with output schemas, input contract cross-references to
repo-analysis output schemas. Skill-creator's convergence-loop verification
passes.

---

## Summary

| Step | Phase  | What                                               | Depends on          |
| ---- | ------ | -------------------------------------------------- | ------------------- |
| 1    | A1     | Schema foundations                                 | —                   |
| 2    | A2     | Creator View structure (6 sections)                | —                   |
| 3    | A3     | Scoring overhaul (dual lens)                       | Step 1              |
| 4    | A4     | Display & UX (badges, gates, auto-offer)           | Steps 1, 3          |
| 5    | A5-pre | Repo type detection system                         | Step 1              |
| 6    | A5     | Link mining pipeline                               | Steps 1, 2, 5       |
| 7    | A6     | Cross-repo awareness                               | Steps 1, 2          |
| 8    | Audit  | Comprehensive audit (context-dependency following) | Steps 1-7           |
| 8b   | Audit  | `/skill-audit` behavioral quality audit            | Step 8              |
| —    | —      | **CHECKPOINT: user review**                        | Step 8b             |
| 9    | A7     | Companion /repo-synthesis skill                    | Steps 1-8b approved |

**Parallelizable:** Steps 1+2 can run in parallel (no dependencies). Steps 3+5
can run in parallel after Step 1. Steps 6+7 can run in parallel after Steps
1+2+5.

**Effort:** Task A (Steps 1-8) = L. Task B (Step 9) = M. Total = XL.
