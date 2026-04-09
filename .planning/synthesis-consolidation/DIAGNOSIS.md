# Diagnosis: Synthesis Consolidation

**Date:** 2026-04-09 **Session:** #270 **Topic:** Merge repo-synthesis +
website-synthesis + cross-type synthesis into one unified skill

---

## ROADMAP Alignment

**ALIGNED.** T28 CAS brainstorm explicitly lists "Synthesis (within router) ->
Merge existing" as a component. Decision #18 specifies `/analyze --synthesize`
defaults all, `--type` narrows. This consolidation is the designed next step.

## Current State: Three Implementations

### 1. repo-synthesis (v1.3, mature)

- **6 outputs:** Emergent themes, ecosystem gaps, reading chains, mental model
  evolution, fit portfolio, cross-repo knowledge map
- **Output:** `.research/analysis/SYNTHESIS.md` + `synthesis.json`
- **State:** `.claude/state/repo-synthesis.state.json`
- **Features:** `--focus` flag (subset outputs), convergence confidence scoring,
  verification pass (T20 tally), self-audit, warm-up, resume/pause
- **REFERENCE.md:** 450+ lines with complete schemas and heuristics
- **Input:** Repos only (reads `analysis.json` with `source_type=repo`)

### 2. website-synthesis (v1.1, mature)

- **4 paradigms:** Thematic (default), narrative, matrix, meta-pattern
- **4 outputs per paradigm:** Themes, signals, map, portfolio
- **Output:** `.research/analysis/synthesis/synthesis.md` +
  `synthesis/synthesis.json` (DIFFERENT PATH)
- **State:** `.claude/state/website-synthesis.state.json`
- **Features:** `--paradigm` flag, source tier weighting (T1-T4, 3x->0.5x),
  thematic saturation stopping rule, `--focus` flag
- **Input:** Websites only

### 3. Cross-type synthesis (in analyze router, underdeveloped)

- **2 outputs:** Themes (agent), gaps (agent)
- **Output:** `.research/analysis/SYNTHESIS.md` (no JSON)
- **No state, no paradigms, no portfolio, no self-audit**
- **~20 lines** in analyze SKILL.md (spec only, never executed)

## Key Inconsistencies

1. **Output paths diverge:** `SYNTHESIS.md` (root) vs `synthesis/synthesis.md`
   (subdir)
2. **Output naming:** `SYNTHESIS.md` (uppercase) vs `synthesis.md` (lowercase)
3. **Paradigms:** repo has none (fixed 6), website has 4 selection paradigms
4. **Source weighting:** website applies T1-T4 tiers; repo treats all sources
   equally (repos are first-party, uniform trust)
5. **Unique capabilities not shared:** Reading chains, mental model evolution,
   ecosystem gaps, knowledge map (repo-only). Narrative/matrix/meta-pattern
   paradigms, saturation rule (website-only).
6. **Cross-type is a stub:** Never executed, no structured output, no
   verification

## Overlap Analysis (~70% shared logic)

Both mature skills share:

- Load artifacts -> build candidate pool -> find themes -> produce outputs
- Verification passes and self-audits
- Fit portfolio with home context loading (5 sources)
- Follow-up action menus
- State files with resume/pause
- Write-to-disk-first, no-silent-skips conventions

Differences are source-specific heuristics:

- Reading chains only make sense for repos (fork relationships, code references)
- Source tier weighting only applies to web content (varying editorial
  authority)
- Paradigms (narrative/matrix/meta-pattern) are genuinely useful for all types
- Saturation stopping rule is a good general-purpose optimization

## Prior Extraction Context

- **"Writer-not-filing-clerk identity framing"** (docling analysis): Synthesis
  should synthesize meaning, not file data. The unified skill should lean into
  interpretive outputs.
- **"Ingest-Query-Lint operational triad"** (Composio analysis): Synthesis is
  the Query layer. It should be the primary consumer of all analysis artifacts.
- **"15-entry checkpoint cycle pattern"** (Composio analysis): Batch synthesis
  benefits from periodic quality checkpoints during processing.

## Reframe Check

The task IS what it appears to be: three synthesis implementations need to
become one. The primary design challenge is reconciling repo-synthesis's 6 fixed
outputs with website-synthesis's 4 paradigm-based outputs. The secondary
challenge is making cross-type synthesis (spanning repos, websites, documents,
media) a first-class capability rather than an afterthought.
