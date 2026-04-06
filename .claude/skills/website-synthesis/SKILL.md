---
name: website-synthesis
description: >-
  Cross-site synthesis across analyzed websites. Produces thematic patterns,
  signal maps, source-weighted evidence, and knowledge convergence from 3+
  website analyses. Companion to /website-analysis — consumes its output
  artifacts. Auto-offered when 3+ sites analyzed.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Website Synthesis

Cross-site intelligence from your analyzed websites. Where `/website-analysis`
examines one site at a time, `/website-synthesis` finds the emergent story
across all of them — converging claims, diverging perspectives, knowledge gaps,
and trends visible only at scale.

## Critical Rules (MUST follow)

1. **Minimum 3 sites.** Do NOT run with fewer than 3 analyzed sites. The value
   is in cross-cutting patterns — 2 sites is a comparison, not synthesis.
2. **Read, don't re-analyze.** Consume existing artifacts. Never re-fetch,
   re-extract, or regenerate website-analysis output. If artifacts are missing,
   report which site lacks what and suggest re-scanning.
3. **Parallel analysis before synthesis.** All sites must be analyzed
   independently BEFORE synthesis begins. Do not synthesize incrementally as
   sites are analyzed — this prevents anchoring bias.
4. **Conversational, not clinical.** Match the Creator View prose style —
   written as you'd explain insights to a colleague, not as a compliance report.
5. **Source weighting is mandatory.** Every claim must carry its source tier
   weight. T1 original research outweighs T4 secondary aggregation 6:1.
6. **State file on every phase.** Synthesis can be long. Compaction will happen.
7. **Write-to-disk-first.** Each output written before proceeding to the next.
8. **Thematic saturation stopping rule.** When 3 consecutive sites yield no new
   themes during thematic synthesis, synthesis is complete for that paradigm.

## When to Use

- User invokes `/website-synthesis` explicitly
- Auto-offered by `/website-analysis` routing menu when 3+ sites exist in
  `.research/website-analysis/`
- User wants cross-site insights, not per-site analysis
- After completing a batch of website analyses
- High-link-density trigger (>40 external links on a page suggests cross-site)

**When NOT to Use:** Single-site analysis -> `/website-analysis` | Fewer than 3
analyzed sites -> analyze more first | Cross-repo synthesis -> `/repo-synthesis`
| Domain research -> `/deep-research`

## Input

**Argument:** `/website-synthesis` (no arguments — reads all analyzed sites)

**Flags:**

- `--paradigm=thematic|narrative|matrix|meta-pattern` (default: thematic)
- `--min-sites=N` (override minimum, default 3)
- `--focus=themes|signals|map|portfolio` (produce only selected outputs)

**Input artifacts** (consumed from `.research/website-analysis/*/`):

| Artifact           | Required | Purpose                                    |
| ------------------ | -------- | ------------------------------------------ |
| `analysis.json`    | MUST     | Site type, metadata, dimensions, scores    |
| `value-map.json`   | MUST     | Candidates with scores, source tier        |
| `SITE-ANALYSIS.md` | MUST     | Creator View prose for thematic extraction |
| `links.json`       | SHOULD   | Link graph for cross-site relationship     |
| `meta.json`        | SHOULD   | Site metadata (OG, JSON-LD)                |
| `findings.jsonl`   | SHOULD   | Individual findings with source URLs       |

**Output:** `.research/website-analysis/synthesis/synthesis.md` (primary) +
`.research/website-analysis/synthesis/synthesis.json` (structured)

---

## Synthesis Paradigms

Select based on research goal. Thematic is the default for open-ended research.

### Thematic (default)

Find common themes across sites. Output: Theme -> evidence from N sites.

- Best for: open-ended exploration, discovering what sites collectively teach
- Optimal site count: 5-12
- Stopping rule: thematic saturation (3 consecutive sites, no new themes)
- Query fan-out: generate 8-12 thematic questions, score each site against each

### Narrative

Track evolution of an idea across sources. Output: timeline or progression.

- Best for: tracking how a concept has been understood over time
- Requires: sites with temporal signal (publication dates, version histories)
- Orders sites chronologically, traces how claims evolve

### Matrix

Structured comparison across identical dimensions. Output: sites x dimensions.

- Best for: feature comparison, technology evaluation, vendor assessment
- Requires: clear shared dimensions across sites
- Produces a comparison table with per-cell evidence

### Meta-pattern

Synthesize synthesis — find patterns in how sites organize knowledge. Output:
pattern taxonomy.

- Best for: understanding a field's knowledge structure
- Looks at how sites frame problems, not just what they claim
- Produces a taxonomy of approaches and framings

---

## Process Overview

```
VALIDATE   Check       -> 3+ sites? Artifacts present? Rate missing data
PHASE 1    Load        -> Read all artifacts, build internal graph
PHASE 2    Synthesize  -> Produce outputs per paradigm (or --focus subset)
PHASE 3    Signals     -> Detect convergence, divergence, gaps, trends
PHASE 4    Present     -> Write synthesis.md + synthesis.json, present, actions
VERIFY     Artifacts   -> Check all outputs produced
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Validate

Check `.research/website-analysis/*/analysis.json` — count sites with complete
artifacts. If fewer than 3: report count and exit. List sites being synthesized
with their source tiers.

**Missing artifact handling (MUST):** For each site, verify MUST artifacts
exist. If `SITE-ANALYSIS.md` or `value-map.json` missing: exclude site from
synthesis with warning, don't silently degrade. If <3 remain after exclusions:
abort.

---

## Phase 1: Load All Artifacts (MUST)

Read all artifacts from each site directory. Build internal structures:

- **Candidate pool:** All candidates from all value-map.json files, tagged by
  source site and source tier weight.
- **Prose corpus:** All SITE-ANALYSIS.md files for thematic analysis.
- **Link pool:** All links.json entries for cross-site relationship mapping.
- **Metadata index:** All meta.json files for site classification.

Assign source tier to each site:

- **T1 Original (3x):** Site contains primary data, original research, datasets
- **T2 Expert (2x):** Domain expert analysis, peer-reviewed synthesis
- **T3 Aggregation (1x):** Curated collections, awesome lists, directories
- **T4 Secondary (0.5x):** Blogs summarizing other blogs, news aggregation

Update state file.

---

## Phase 2: Synthesize (MUST)

Produce outputs based on the selected paradigm. See REFERENCE.md for paradigm
templates and output specifications.

**For Thematic (default):** Identify themes across 3+ sites, detect dominant
patterns, surface contrarian signals, discover surprising connections between
unlinked sites.

**For Narrative:** Order sites chronologically, trace claim evolution, identify
inflection points.

**For Matrix:** Build sites x dimensions table, populate with evidence and
scores, highlight outliers.

**For Meta-pattern:** Classify how each site frames the problem space, build
pattern taxonomy, identify approach clusters.

Update state file after each output section.

---

## Phase 3: Signal Detection (MUST)

Apply signal detection across all sites regardless of paradigm:

| Signal      | Detection Rule                      | Action              |
| ----------- | ----------------------------------- | ------------------- |
| Convergence | Same claim in 3+ independent sites  | 3x confidence boost |
| Divergence  | Contradicting claims across sites   | Flag for resolution |
| Gap         | Topic in 1 site, absent from others | Highlight as opp    |
| Trend       | Pattern visible only across sites   | Best-of-breed note  |

Weight all evidence by source tier. A T1 convergence outweighs a T4 convergence
significantly. See REFERENCE.md for the signal detection rubric.

---

## Phase 4: Present + Follow-up (MUST)

1. Write `synthesis.md` to output directory (MUST)
2. Write `synthesis.json` for structured consumption (MUST)
3. Present synthesis inline — full narrative (MUST)
4. Offer follow-up actions:

| Action                     | Description                                     |
| -------------------------- | ----------------------------------------------- |
| **Explore a theme**        | Deep-dive into a specific emergent theme        |
| **Fill a gap**             | Queue a `/website-analysis` scan for gap domain |
| **Extract top candidates** | Start extraction workflow for highest-ranked    |
| **Compare paradigms**      | Re-run with a different synthesis paradigm      |
| **Save to memory**         | Persist key synthesis findings                  |
| **Done**                   | Cleanup, exit                                   |

---

## Artifact Verification (before presenting)

Verify all expected outputs exist based on `--focus` or full run:

- `synthesis.md` — always
- `synthesis.json` — always
- Paradigm-specific sections present in synthesis.md (or subset per `--focus`)
- Signal detection section present

Flag missing outputs before presenting follow-up actions.

---

## State File & Resume

**Path:** `.claude/state/website-synthesis.state.json`

Update after every phase. On re-invocation: offer Resume/Re-run. Resume skips
completed outputs. Schema in REFERENCE.md.

## Compaction Resilience

Each output section writes to synthesis.md incrementally. State file tracks
which sections are complete. On resume, skip completed sections.

## Invocation Tracking (MUST)

```bash
cd scripts/reviews && npx tsx write-invocation.ts --data \
  '{"skill":"website-synthesis","type":"skill","success":true,"context":{"paradigm":"thematic|narrative|matrix|meta-pattern","site_count":N}}'
```

## Integration

- **Upstream:** `/website-analysis` (sole producer of input artifacts)
- **Downstream:** `/deep-plan` (inject as research), project memory, extraction
- **Sibling:** `/repo-synthesis` (same pattern for code repos)
- **Future:** Cross-type synthesis (repos + websites together — planned, not
  implemented)
- **References:** [REFERENCE.md](./REFERENCE.md),
  [website-analysis REFERENCE.md](../website-analysis/REFERENCE.md) (input
  schemas)

## Guard Rails

- **<3 sites:** Abort with clear message, suggest more scans
- **Anchoring prevention:** All sites analyzed independently before synthesis
- **Source weighting:** Never treat T4 and T1 as equal evidence
- **Missing artifacts:** Exclude site with warning, don't silently degrade
- **Scope:** This skill synthesizes. It does NOT re-analyze, re-fetch, or modify
  per-site artifacts.

## Retro

After follow-up: "Any observations about the synthesis quality or process?"

---

## Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0     | 2026-04-06 | Initial creation. Companion to website-analysis v1.0.   |
|         |            | 4 paradigms, source weighting, signal detection.        |
|         |            | Source: DECISIONS.md #19/#20, RESEARCH_OUTPUT.md Sec 9. |
