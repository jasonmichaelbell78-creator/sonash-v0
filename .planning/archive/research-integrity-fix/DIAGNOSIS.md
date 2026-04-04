# DIAGNOSIS: Research Integrity Fix

**Deep-plan topic:** Fix deep-research pipeline integrity + commit all research
artifacts + remediate existing outputs **Date:** 2026-04-02

---

## ROADMAP Alignment

**Status: ALIGNS with Tooling & Infrastructure (Meta P0)**

This is a data integrity fix for the research pipeline. It directly supports the
"Tooling & Infrastructure" meta-milestone. The deep-research skill is a core
capability used by 9+ downstream consumers. Broken metadata undermines trust in
the entire research-to-plan pipeline.

**Todo T18** tracks this as P0 (the only P0 on the board).

---

## Problem Statement

The deep-research pipeline has systemic data integrity issues discovered during
a content-level audit of all 9 research outputs. Three root causes:

### Root Cause 1: Metadata written early, never reconciled

The Phase 2 synthesizer writes metadata.json with agent counts, claim counts,
source counts, and confidence distributions. Phases 2.5-3.97 (verification,
challenges, dispute resolution, gap pursuit, final re-synthesis) add agents,
claims, and corrections — but the final synthesizer only updates synthesis-
specific fields, NOT the core counts. Result: metadata is stale for 7 of 9
research outputs.

### Root Cause 2: Research artifacts gitignored

`.gitignore` lines 155-158 exclude `findings/` and `challenges/` directories.
172 files exist on the local machine but are not committed. Any git operation
(worktree, clone, pull) loses these files. The pipeline is one-way: once
findings are lost, the only record is what made it into RESEARCH_OUTPUT.md.

### Root Cause 3: No self-audit cross-checks

The pipeline has no automated verification that metadata counts match JSONL line
counts match report content. Source ID schemes are inconsistent across research
outputs (D-codes vs S-codes). Claims added by post-pipeline phases aren't
appended to claims.jsonl.

---

## Audit Results (completed this session)

| Research               | Status      | Critical Issues                                                    |
| ---------------------- | ----------- | ------------------------------------------------------------------ |
| github-health          | STALE       | metadata says 3/21 agents, 38 claims; actual 32 agents, 100 claims |
| custom-agents          | CRITICAL    | 22 orphaned sources (38%), 3-way agent count conflict              |
| repo-analysis-skill    | CRITICAL    | 146/147 sources orphaned, D-code/S-code mismatch                   |
| repo-analysis-value    | CRITICAL    | broken source traceability, 3 conflicting confidence counts        |
| debt-runner            | CRITICAL    | 9 sources missing from JSONL (46 vs 55 claimed)                    |
| multi-layer-memory     | CRITICAL    | no sources.jsonl, 25+ findings on disk but not in git              |
| dev-dashboard          | GOOD        | agent count mismatch (36 vs 42), otherwise aligned                 |
| plan-orchestration     | CLEAN       | minor agent count + confidence off-by-1                            |
| research-discovery-std | VERSION GAP | pre-standard pipeline, no JSONL files at all                       |

### Artifact inventory

- 270 research files on disk
- 98 tracked by git
- 172 gitignored (findings/ and challenges/ directories)
- ~3.8MB total for all gitignored content

---

## Dependency Map (completed this session)

### Upstream writers (9)

- `/deep-research` skill + 6 pipeline agents + `/repo-analysis` skill

### Downstream consumers (9+)

- `/deep-plan` (research context injection — reads RESEARCH_OUTPUT.md only)
- `/brainstorm` (scans for related research)
- `/skill-creator` (domain context)
- `/repo-analysis` (value extraction)
- Final-synthesizer (reads its own artifacts)
- 6+ planning documents, 5 state files, 3 GSD workflows
- `doc-header-config.json` (exempts .research/ from checks)
- `research-index.jsonl` (global index)

### Key finding

Plans only reference RESEARCH_OUTPUT.md, not JSONL files. So existing plans are
NOT broken by the JSONL integrity issues. But any future automated consumers
(dashboards, validators) would be affected.

---

## Reframe Check

**No reframe needed.** The task is clear: fix the pipeline, commit the
artifacts, remediate existing outputs.

**Scope note:** The research-discovery-standard output uses a pre-standard
schema (no JSONL files). Retroactively generating JSONL for it may not be worth
the effort since the content exists in markdown.
