---
name: repo-analysis
description: >-
  Dual-lens repo analysis: Creator View (knowledge, insights, home-repo
  comparison) + Engineer View (health, security, process). Three tiers
  (Quick/Standard/Deep). Link mining for curated lists. Fit separation via dual
  scoring lenses. Outputs to .research/repo-analysis/<repo-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 4.1
**Last Updated:** 2026-04-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Analysis

Dual-lens analysis of external GitHub repositories. **Creator View** surfaces
what the repo understands, how it compares to your work, and where you should be
challenged. **Engineer View** assesses health, security, process, and adoption
fitness. Both views are always produced; Creator View comes first.

## Critical Rules (MUST follow)

1. **Quick Scan is the default.** API-only, <30s. Do NOT clone unless user
   requests Standard/Deep or accepts the interactive gate.
2. **Write-to-disk-first.** Every step writes its output file before proceeding.
   Orchestrator verifies file existence, not return values.
3. **Bands over numbers.** Display categorical bands with score in parentheses.
4. **No silent skips.** After every SHOULD step, verify the expected output
   exists. If missing: retry once with mitigation, then report to user. Never
   silently continue past a failed step.
5. **Home repo guard.** If target matches
   `jasonmichaelbell78-creator/sonash-v0`, redirect to `/audit-comprehensive`.
6. **Rate limit safety.** Check `gh api rate_limit` before every API batch.
   Abort if `remaining < 200`.
7. **State file on every phase transition.** Long analyses WILL hit compaction.
8. **No TDMS auto-pollution.** TDMS intake is opt-in via routing menu only.
9. **Creator View is mandatory** for Standard/Deep. Quick Scan includes a
   lightweight creator lens from README/description. The creator lens captures
   what the repo KNOWS, not just its health.
10. **Conversational, not clinical.** Creator View MUST be written in
    conversational prose. Anti-goal: must NOT read like a technical manual.

## When to Use

- User invokes `/repo-analysis` with a GitHub URL
- User asks to evaluate an external repo for adoption, learning, or inspiration
- User wants to understand what a repo knows or teaches
- User needs a structured health report for a dependency decision
- Triage of multiple candidate repos (Quick Scan each)

**When NOT to Use:** Cross-repo synthesis -> `/repo-synthesis` | Home repo audit
-> `/audit-comprehensive` | Domain/technology research -> `/deep-research` |
Quick dependency check -> `gh api` directly.

> See [REFERENCE.md](./REFERENCE.md) for dimension catalog, tool stack, output
> schemas, absence patterns, Creator View specification, and guard rails.

## Input

**Argument:** `/repo-analysis <github-url>`

**Flags:** `--depth=quick` (default) | `--depth=standard` | `--depth=deep` |
`--lens=adoption|creator` (override auto-detected primary lens)

**Output:** `.research/repo-analysis/<repo-slug>/` — analysis.json,
findings.jsonl, value-map.json, trends.jsonl, summary.md, creator-view.md,
research-index.jsonl, mined-links.jsonl (curated-list only), repomix-output.txt
(gitignored).

---

## Process Overview

```
VALIDATE   Guards         -> Home repo? Archived? Rate limits? Fork?
PHASE 0    Quick Scan     -> API-only, <30s, 18 dimensions + lightweight creator lens
GATE       Interactive    -> "Run Standard/Deep? [y/N]"
PHASE 1    Clone+Repomix  -> Blobless clone, generate repomix IMMEDIATELY, verify
PHASE 2    Dimension Wave -> Inline (<20 files) or agents (large repos)
PHASE 3    History Wave   -> 12-month temporal analysis (Deep only)
PHASE 4    Creator View   -> Load home context, compare, challenge, knowledge map
PHASE 4b   Link Mining    -> Parse, score, fetch links (curated-list/registry only)
PHASE 5    Engineer View  -> Merge dimensions, compute bands, dual-lens scoring
PHASE 6    Value Map      -> Pattern + knowledge candidates ranked
ROUTING    Menu           -> Extract | TDMS | Deep-plan | Memory | Adopt | Done
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Quick Scan (Phase 0)

API-only, under 30 seconds. 18 dimensions (QS-01 through QS-18). See
REFERENCE.md Section 1.1 for full dimension catalog and API batch structure.

**Process:** Validate → 3 parallel API batches → classify repo type (Section 5b)
→ compute dimensions → score 6 summary bands → absence pattern classifier →
write artifacts → present inline.

**Lightweight creator lens (MUST):** After computing health dimensions, read the
repo description and README (via Contents API, first 200 lines). Write 2-3
sentences: "This repo appears to understand/demonstrate/teach X." This is a
teaser, not the full Creator View — enough to judge whether Standard/Deep is
worth the time.

**Interactive gate:** "Quick Scan complete. [health bands]. Run Standard/Deep
for full Creator + Engineer analysis? (Standard ~5-10 min, Deep ~15-20 min)
[y/N]" For `curated-list` repos: enriched gate showing link count and link
mining option. See REFERENCE.md Section 16. If `--depth=standard|deep` specified
at invocation, skip this gate.

---

## Clone + Repomix (Phase 1)

1. Clone: `git clone --filter=blob:none --depth=1 <url>` to `/tmp/`
2. **Generate repomix IMMEDIATELY after clone (MUST).** Run
   `npx repomix@latest --compress` and save to output directory. Verify file
   exists before proceeding. If repomix fails: retry once, then report failure
   to user. Do NOT silently skip — repomix is required for Extract routing.
3. For Deep: `git fetch --unshallow` or `--shallow-since="1 year ago"`
4. Update state file.

> See REFERENCE.md for LFS check, monorepo detection, tool availability. Tool
> availability: `node scripts/repo-analysis/check-tools.js`

---

## Dimension Wave (Phase 2)

**Small repos (<20 files):** Analyze inline. Read files directly via Bash.
Subagents cannot access temp directories — do not spawn agents for small repos.

**Large repos (20+ files):** Copy clone to project workspace
(`.research/repo-analysis/<slug>/source/`), then spawn up to 4 concurrent
agents. Verify each agent's output file exists after completion. If empty or
missing: capture task-notification result text and write it to the dimension
file. If agent failed entirely: report failure, continue with available data.

**Dimensions:** Security audit, architecture analysis, documentation quality,
test infrastructure. See REFERENCE.md Section 1.2 for full catalog.

---

## History Wave (Phase 3 — Deep only)

12-month temporal analysis: commit velocity, contributor health, churn hotspots.
See REFERENCE.md Sections 1.4 and 7 for temporal fingerprint specification.

---

## Creator View (Phase 4 — MUST for Standard/Deep)

The primary analytical output. Written in conversational prose, not tables.

**Home repo context loading (MUST):**

Load before writing Creator View — these enable direct comparison:

- `SESSION_CONTEXT.md` (primary — current sprint)
- `ROADMAP.md` (project direction, planned features)
- `CLAUDE.md` (conventions, stack, architecture)
- `.claude/skills/` directory listing (active skills)
- Active project memories from MEMORY.md
- MEMORY.md entries about the target repo or its domain (SHOULD)

MAY load additional context when comparison requires deeper understanding.

**Creator View sections (MUST produce all 6):**

1. **What This Repo Understands (+ Blindspots)** — Knowledge, methodology,
   insights. What it KNOWS, not what it does. Include blindspot analysis.
2. **What's Relevant To Your Work** — Direct home-repo comparison with file
   refs.
3. **Where Your Approach Differs** — Classify as
   **Ahead**/**Different**/**Behind**.
4. **The Challenge** — THE thing you should seriously consider. Say so if
   nothing.
5. **Knowledge Candidates** — Tiered (T1 active, T2 systems, T3 lower). Added to
   `value-map.json`.
6. **What's Worth Avoiding** — Anti-ideas with evidence. See REFERENCE.md 14.8.

Write output to `creator-view.md`. **Self-verify (SHOULD):** Re-read generated
Creator View; verify each home repo claim (file paths, skill names, projects)
references something that exists.

(SHOULD) Check existing analyses in `.research/repo-analysis/` for cross-refs.

---

## Link Mining (Phase 4b — curated-list/registry only)

Conditional on `repo_type` being `curated-list` or `registry`. Progressive
depth: Depth 0 (parse markdown, score against home context), Depth 1 (HEAD-first
fetch, interactive gate), Depth 2 (targeted deep-dive on selected links). Output
to `mined-links.jsonl`. See REFERENCE.md Section 16 for full spec: markdown
parsing rules, rate limiting (HEAD at 5 req/sec, full fetch at 1 req/sec),
scoring logic, and interactive gates. If Depth 1 fetch fails for >50% of links,
abort Depth 1 and present Depth 0 results.

---

## Engineer View (Phase 5)

Current behavior — health tables, scoring bands, absence patterns, adoption
assessment. See REFERENCE.md for dimension details, band thresholds, and absence
pattern definitions.

6 summary dimensions: Security, Reliability, Maintainability, Documentation,
Process, Velocity. Adoption assessment: Adopt/Trial/Extract/Avoid.

Two scoring lenses always computed: adoption (default for library/application)
and creator (default for curated-list/documentation-hub). Both shown, primary
marked. Override with `--lens`. See REFERENCE.md Section 4.

---

## Value Map (Phase 6)

Generate `value-map.json` with two candidate types:

- **Pattern candidates:** Code, architecture, tooling to extract (existing)
- **Knowledge candidates:** Understanding, methodology, insights to learn (new)

Both use the same ranking fields (novelty, effort, relevance). Knowledge
candidates use extraction effort E0-E1 (reading/studying, not porting code).

Append discovered repo relationships to
`.research/repo-analysis/reading-chain.jsonl`. Populate `related_repos[]` in
value-map.json for any repos referenced during analysis.

## Artifact Verification (before routing)

Verify all expected artifacts exist based on scan depth and repo type.
Checklist: analysis.json, findings.jsonl, value-map.json, creator-view.md,
summary.md, mined-links.jsonl (curated-list only). Flag missing artifacts before
presenting routing menu.

---

## Routing Menu

Presented after Standard or Deep. 8 options:

| Option                      | Action                                           |
| --------------------------- | ------------------------------------------------ |
| **1. Extract value**        | Load repomix + value-map. Present candidates.    |
| **2. Send to TDMS**         | Transform findings to TDMS format. Opt-in only.  |
| **3. Deep-plan this**       | Inject analysis as research context.             |
| **4. Save to memory**       | Persist key findings as project memory.          |
| **5. Adoption verdict**     | Full WR-01 through WR-06 assessment.             |
| **6. Explore insights**     | Deeper conversation about Creator View findings. |
| **7. Done**                 | Cleanup, confirm artifacts, exit.                |
| **8. Cross-repo synthesis** | If 3+ repos analyzed, offer /repo-synthesis.     |

---

## State File & Resume

State file: `.claude/state/repo-analysis.<repo-slug>.state.json`

Update after every phase. On re-invocation: offer Resume/Re-run/Compare. See
REFERENCE.md Section 8 for schema.

## Compaction Resilience

Artifacts as checkpoints: analysis.json, findings.jsonl, summary.md,
value-map.json, dimension files all persist independently. State file enables
phase-level resume.

## Integration

- **Upstream:** `/deep-research`, `/brainstorm`
- **Downstream:** `/deep-plan`, `/repo-synthesis`, TDMS, project memory
- **Neighbors:** `/audit-comprehensive` (home repo), dimension agents
- **References:** [REFERENCE.md](./REFERENCE.md),
  [BRAINSTORM.md](../../.research/archive/repo-analysis-knowledge/BRAINSTORM.md)

## Guard Rails

See REFERENCE.md Section 9. Summary: rate limit safety, home repo redirect, fork
flagging, large repo handling, monorepo detection, no silent skips.

## Retro

After routing: "Any observations about the analysis quality or process?"

---

_v4.1 | 2026-04-05 | Apply 17 skill-audit decisions: gate skip, effort
estimates, artifact verification, When NOT to Use, creator-view.md output,
self-verify, link mining failure guard, /repo-synthesis downstream. See
REFERENCE.md v4.0._
