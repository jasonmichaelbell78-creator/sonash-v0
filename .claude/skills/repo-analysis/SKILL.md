---
name: repo-analysis
description: >-
  Analyze external GitHub repositories through dual lenses: Creator View
  (knowledge, insights, comparisons to your work) and Engineer View (health,
  security, process). Three depth tiers: Quick Scan (API-only default), Standard
  (clone + static), Deep (12-month history + temporal). Outputs to
  .research/repo-analysis/<repo-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 3.0
**Last Updated:** 2026-04-03
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

> See [REFERENCE.md](./REFERENCE.md) for dimension catalog, tool stack, output
> schemas, absence patterns, Creator View specification, and guard rails.

## Input

**Argument:** `/repo-analysis <github-url>`

**Flags:** `--depth=quick` (default) | `--depth=standard` | `--depth=deep`

**Output:** `.research/repo-analysis/<repo-slug>/` — analysis.json,
findings.jsonl, value-map.json, trends.jsonl, summary.md, repomix-output.txt
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
PHASE 5    Engineer View  -> Merge dimensions, compute bands, adoption assessment
PHASE 6    Value Map      -> Pattern + knowledge candidates ranked
ROUTING    Menu           -> Extract | TDMS | Deep-plan | Memory | Adopt | Done
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Quick Scan (Phase 0)

API-only, under 30 seconds. 18 dimensions (QS-01 through QS-18). See
REFERENCE.md Section 1.1 for full dimension catalog and API batch structure.

**Process:** Validate → 3 parallel API batches → compute dimensions → score 6
summary bands → absence pattern classifier → write artifacts → present inline.

**Lightweight creator lens (MUST):** After computing health dimensions, read the
repo description and README (via Contents API, first 200 lines). Write 2-3
sentences: "This repo appears to understand/demonstrate/teach X." This is a
teaser, not the full Creator View — enough to judge whether Standard/Deep is
worth the time.

**Interactive gate:** "Quick Scan complete. [health bands]. Run Standard/Deep
for full Creator + Engineer analysis? [y/N]"

---

## Clone + Repomix (Phase 1)

1. Clone: `git clone --filter=blob:none --depth=1 <url>` to `/tmp/`
2. **Generate repomix IMMEDIATELY after clone (MUST).** Run
   `npx repomix@latest --compress` and save to output directory. Verify file
   exists before proceeding. If repomix fails: retry once, then report failure
   to user. Do NOT silently skip — repomix is required for Extract routing.
3. For Deep: `git fetch --unshallow` or `--shallow-since="1 year ago"`
4. Update state file.

> See REFERENCE.md for LFS check, monorepo detection, tool availability.

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

- `CLAUDE.md` (conventions, stack, architecture)
- `ROADMAP.md` (project direction, planned features)
- `SESSION_CONTEXT.md` (current sprint, active work)
- `.claude/skills/` directory listing (active skills)
- Active project memories from MEMORY.md

MAY load additional context when comparison requires deeper understanding.

**Creator View sections (MUST produce all 5):**

### 1. What This Repo Understands

Deep, conversational analysis of the repo's knowledge, methodology, and
insights. Not what it DOES (that's the Engineer View) — what it KNOWS. What
mental models, techniques, or philosophies are embedded in the code and docs?

### 2. What's Relevant To Your Work

Direct comparison to home repo. "They do X, you do Y." Reference specific files,
skills, or approaches in your codebase. Connect to active projects (JASON-OS,
current sprint work).

### 3. Where Your Approach Differs

Classify each meaningful difference as:

- **Ahead:** You've already solved this better than they have.
- **Different:** Valid alternative approach — neither is wrong.
- **Behind:** They've figured out something you haven't.

### 4. The Challenge

Opinionated. "THE thing from this repo you should seriously consider." Not
neutral observations — a specific recommendation with reasoning. Only when
warranted. If nothing genuinely challenges your approach, say so: "No
significant challenges to current approach identified."

### 5. Knowledge Candidates

What could you LEARN from deeper engagement with this repo? Not code to extract
— understanding to gain. Tiered by relevance:

- **Tier 1:** Directly relevant to active projects
- **Tier 2:** Deepens systems understanding
- **Tier 3:** Interesting but lower priority

These are added to `value-map.json` alongside pattern candidates.

---

## Engineer View (Phase 5)

Current behavior — health tables, scoring bands, absence patterns, adoption
assessment. See REFERENCE.md for dimension details, band thresholds, and absence
pattern definitions.

6 summary dimensions: Security, Reliability, Maintainability, Documentation,
Process, Velocity. Adoption assessment: Adopt/Trial/Extract/Avoid.

---

## Value Map (Phase 6)

Generate `value-map.json` with two candidate types:

- **Pattern candidates:** Code, architecture, tooling to extract (existing)
- **Knowledge candidates:** Understanding, methodology, insights to learn (new)

Both use the same ranking fields (novelty, effort, relevance). Knowledge
candidates use extraction effort E0-E1 (reading/studying, not porting code).

---

## Routing Menu

Presented after Standard or Deep. 7 options:

| Option                  | Action                                           |
| ----------------------- | ------------------------------------------------ |
| **1. Extract value**    | Load repomix + value-map. Present candidates.    |
| **2. Send to TDMS**     | Transform findings to TDMS format. Opt-in only.  |
| **3. Deep-plan this**   | Inject analysis as research context.             |
| **4. Save to memory**   | Persist key findings as project memory.          |
| **5. Adoption verdict** | Full WR-01 through WR-06 assessment.             |
| **6. Explore insights** | Deeper conversation about Creator View findings. |
| **7. Done**             | Cleanup, confirm artifacts, exit.                |

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
- **Downstream:** `/deep-plan`, TDMS, project memory
- **Neighbors:** `/audit-comprehensive` (home repo), dimension agents
- **References:** [REFERENCE.md](./REFERENCE.md),
  [BRAINSTORM.md](../../.planning/repo-analysis-knowledge/BRAINSTORM.md)

## Guard Rails

See REFERENCE.md Section 9. Summary: rate limit safety, home repo redirect, fork
flagging, large repo handling, monorepo detection, no silent skips.

## Retro

After routing: "Any observations about the analysis quality or process?"

---

_Version history moved to REFERENCE.md Section 10._
