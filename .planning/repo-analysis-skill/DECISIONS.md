# Decisions: Repo Analysis Skill

**Date:** 2026-04-01 **Task:** Unified `/repo-analysis` skill (defensive health
assessment + conversational value extraction) **Sessions:** #250 (initial), #255
(resumed + completed)

## Decision Table

| #   | Decision                    | Choice                                                                                                 | Rationale                                                                                                                   |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| D1  | Skill name                  | `/repo-analysis`                                                                                       | Matches research artifacts, descriptive, extends naturally to subcommands                                                   |
| D2  | Mode scope                  | Automated Assess + conversational Extract                                                              | Context quality > model capability. Repomix compressed context + value map primes extraction conversation at 20% build cost |
| D3  | Implementation phasing      | Single phase ship as one unit                                                                          | User preference for unified delivery                                                                                        |
| D4  | Skill file structure        | SKILL.md + REFERENCE.md                                                                                | Mirrors deep-plan pattern; agent orchestration details in REFERENCE.md                                                      |
| D5  | Output directory            | `.research/<repo-slug>/`                                                                               | Existing convention; research-index.jsonl tracks runs                                                                       |
| D6  | Tool installation           | Graceful degradation + optional install script                                                         | Never blocks analysis; skipped dimensions reported; install script for setup convenience                                    |
| D7  | Agent orchestration         | Inline Quick Scan + spawned agents for deeper modes                                                    | Hybrid pattern; overhead acceptable when genuine benefit exists                                                             |
| D8  | Quick Scan interaction      | Interactive gate — present findings, offer "Run Standard? [y/N]"                                       | Mirrors ecosystem-health triage; avoids unnecessary clone operations                                                        |
| D9  | Clone location              | `/tmp/repo-analysis-<slug>/`, auto-cleanup after analysis                                              | Clones cheap to recreate; state file tracks commit SHA for reproducibility                                                  |
| D10 | TDMS integration            | Opt-in via routing menu                                                                                | External repo findings shouldn't auto-pollute our TDMS                                                                      |
| D11 | Comparison mode             | Single-repo only in v1                                                                                 | Comparison adds normalization/segmentation complexity for a secondary use case                                              |
| D12 | Value map format            | Both JSON (`value-map.json`) + Markdown section in `summary.md`                                        | JSON enables future automation; Markdown primes immediate extraction conversation                                           |
| D13 | Value extraction scoring    | Hybrid — numeric where validated (portability 0-15), qualitative elsewhere (High/Med/Low)              | Portability rubric has empirical backing; novelty/quality signal don't warrant false-precision                              |
| D14 | Absence pattern display     | Both — in-dimension AND standalone summary list                                                        | Cross-cutting signals deserve standalone visibility and in-context relevance                                                |
| D15 | Agent allocation (Standard) | Dynamic — always codebase-mapper, conditionally add security/test/deploy agents by detection           | Stack-conditional agents produce better signal; 4-concurrent cap is practical orchestration quality limit                   |
| D16 | State file resume           | Always offer: "Previous analysis found (N days ago). Resume, re-run, or compare?"                      | Most informative; trends.jsonl makes comparison cheap                                                                       |
| D17 | Cross-references            | deep-plan (injectable), deep-research (domain), audit-comprehensive (home guard), TDMS, research-index | Complete integration surface for v1                                                                                         |
| D18 | Repomix integration         | Run `repomix --compress` on clone, save to `.research/<slug>/repomix-output.txt`                       | Purpose-built for conversation-ready compressed context; ~70% token reduction                                               |
| D19 | Private repo support        | Transparent — works if `gh` token has access, no extra flag                                            | gh auth handles this already; no artificial restriction                                                                     |
| D20 | Fork detection              | Analyze the fork, flag prominently with upstream reference                                             | User chose this repo for a reason; inform, don't redirect                                                                   |
| D21 | Home repo guard             | Exact match on GitHub repo URL; warn + offer redirect to `/audit-comprehensive`                        | Simple exact match; warning is sufficient                                                                                   |
| D22 | Error handling (API)        | Retry once with backoff, then graceful degradation                                                     | One retry catches transient failures; never blocks entire analysis                                                          |
| D23 | Output presentation         | Write all files to disk first, then display `summary.md` inline                                        | Write-to-disk-first pattern validated by research; progressive display adds complexity for minimal UX gain                  |
| D24 | Routing menu                | 5 options: Extract value / Send to TDMS / Deep-plan this / Save to memory / Done                       | Covers all integration paths; Extract loads Repomix + value-map for conversation                                            |

## Key Design Principles

1. **Quick Scan is the default.** No clone, no tools, no disk writes. API-only,
   <30s. Answers 70-80% of dependency evaluation questions.

2. **Automated Assess, conversational Extract.** The defensive lens (health
   assessment) is fully automated with agent orchestration. The offensive lens
   (value extraction) produces structured context (Repomix + value-map) and
   primes a conversation rather than running a rigid agent pipeline.

3. **Graceful degradation everywhere.** Missing tools, failed APIs, rate limits
   — the skill always produces the best analysis it can with what's available,
   reporting what was skipped.

4. **Write-to-disk-first.** Every agent writes output files before returning.
   Orchestrator verifies file existence, not return values. Enables partial
   inspection, compaction survival, and resume.

5. **Categorical bands over numeric composites.** Primary display is
   Critical/Needs Work/Healthy/Excellent. Numeric scores retained internally for
   trend tracking only. False precision is dishonest.

## Scoring Dimensions

### Defensive (6 dimensions, band-scored)

| Dimension       | Coverage                                            |
| --------------- | --------------------------------------------------- |
| Security        | SAST, supply chain, secrets, OpenSSF score          |
| Reliability     | Error handling, test coverage, type safety          |
| Maintainability | Complexity, duplication, dead code, naming          |
| Documentation   | README, CONTRIBUTING, API docs, inline comments     |
| Process         | CI/CD, branch protection, merge hygiene             |
| Velocity        | Commit frequency, PR turnaround, contributor health |

### Offensive (5 signals per candidate, hybrid-scored)

| Signal             | Scoring      | Coverage                                  |
| ------------------ | ------------ | ----------------------------------------- |
| Pattern Novelty    | High/Med/Low | Does this repo do something we don't?     |
| Code Portability   | 0-15 numeric | 5-dimension rubric (empirically backed)   |
| Adoption Readiness | High/Med/Low | License, deps overlap, stack match        |
| Quality Signal     | High/Med/Low | Is this pattern better than what we have? |
| Extraction Effort  | E0-E3        | Effort to transplant                      |
