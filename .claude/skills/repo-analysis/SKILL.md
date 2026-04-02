---
name: repo-analysis
description: >-
  Analyze external GitHub repositories for health assessment (automated) and
  value extraction (conversation-primed). Three depth tiers: Quick Scan
  (API-only default), Standard (clone + static), Deep (12-month history +
  temporal). Outputs structured artifacts to .research/<repo-slug>/.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-02
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Analysis

Analyze external GitHub repositories across 45 dimensions for defensive health
assessment and proactive value extraction. Quick Scan (API-only, <30s) is the
default entry point. Standard and Deep modes are opt-in via interactive gate or
explicit flag.

## Critical Rules (MUST follow)

1. **Quick Scan is the default.** No clone, no tools, no disk writes beyond
   output artifacts. API-only, under 30 seconds. Do NOT clone unless the user
   explicitly requests Standard/Deep or accepts the interactive gate prompt.
2. **Write-to-disk-first.** Every agent writes its output file before returning.
   The orchestrator verifies file existence, not return values. This enables
   partial inspection, compaction survival, and resume.
3. **Bands over numbers.** Primary display is categorical bands (Critical/Needs
   Work/Healthy/Excellent) with numeric score in parentheses. Never present a
   bare numeric score as the headline. Numeric scores are retained for trend
   tracking only.
4. **Graceful degradation everywhere.** Missing tools, failed APIs, rate limits
   -- the skill always produces the best analysis it can with what is available,
   reporting what was skipped and why.
5. **Home repo guard.** If the target URL matches the home repo
   (`jasonmichaelbell78-creator/sonash-v0`), warn the user and offer to redirect
   to `/audit-comprehensive`. Do NOT analyze the home repo with this skill.
6. **Rate limit safety.** Check `gh api /rate_limit` before every API batch.
   Abort if `remaining < 200`. Never make unauthenticated API calls.
7. **State file on every phase transition.** Update the state file after
   completing each phase. Long analyses WILL hit compaction.
8. **No TDMS auto-pollution.** External repo findings are NOT automatically sent
   to the tech debt pipeline. TDMS intake is opt-in via the routing menu.

## When to Use

- User invokes `/repo-analysis` with a GitHub URL
- User asks to evaluate an external dependency for adoption
- User asks "is this repo healthy?" or "should we use this library?"
- User wants to extract patterns, conventions, or components from another repo
- User needs a structured health report for a dependency decision
- Triage of multiple candidate repos (run Quick Scan on each)

## When NOT to Use

- Analyzing the home repo -- use `/audit-comprehensive`
- Ongoing PR review of own repos -- use a commercial tool (CodeRabbit, Greptile)
- Semantic search across multiple repos -- use Sourcegraph
- General brainstorming about what to build -- use `/brainstorm`
- Planning implementation of findings -- use `/deep-plan` (available via routing
  menu)

## Routing Guide

| Situation                     | Use                      | Why                                   |
| ----------------------------- | ------------------------ | ------------------------------------- |
| Evaluate external dependency  | `/repo-analysis`         | Point-in-time health + value analysis |
| Audit own codebase            | `/audit-comprehensive`   | Home repo has richer internal context |
| Plan work based on findings   | `/deep-plan` via routing | Structured planning with decisions    |
| Extract specific pattern      | Routing menu "Extract"   | Loads Repomix + value-map context     |
| Track debt from external repo | Routing menu "TDMS"      | Opt-in intake with source attribution |

> See `.claude/skills/repo-analysis/REFERENCE.md` for dimension catalog, tool
> stack, output schemas, and guard rails.

## Input

**Argument:** GitHub repository URL, passed as `/repo-analysis <url>`. Works on
public and private repos (private repos require `gh auth` with appropriate
scopes).

**Example:** `/repo-analysis https://github.com/facebook/react`

**Flags:**

- `--depth=quick` (default) -- API-only Quick Scan
- `--depth=standard` -- Clone + static analysis
- `--depth=deep` -- 12-month history + temporal analysis

**Output location:** `.research/<repo-slug>/` (analysis.json, findings.jsonl,
value-map.json, trends.jsonl, summary.md). User MAY specify a different
location.

---

## Process Overview

```
VALIDATE:  Guards         -> Home repo? Archived? Rate limits? Fork flag
PHASE 0:   Quick Scan     -> API-only, <30s, 18 dimensions, present findings
GATE:      Interactive     -> "Run Standard analysis? [y/N]"
PHASE 1:   Clone          -> Blobless partial clone to /tmp/
PHASE 2:   Dimension Wave -> Up to 4 concurrent agents, static analysis
PHASE 3:   History Wave   -> Conditional: 12-month temporal analysis
PHASE 4:   Aggregation    -> Merge all dimensions, compute bands
PHASE 5:   Value Map      -> Extraction candidates ranked by portability
ROUTING:   Menu           -> 5 options: Extract | TDMS | Deep-plan | Memory | Done
```

Use phase transition markers: `========== PHASE N: [NAME] ==========`

---

## Depth Tiers

### Tier 1: Quick Scan (default)

**Time budget:** Under 30 seconds. **Disk writes:** Output artifacts only (no
clone). **Dimensions:** QS-01 through QS-18 (18 dimensions, all API-sourced).
**Value:** 40-55% of full analysis signal. Answers 70-80% of dependency
evaluation questions.

**Delegation:** If user says "you decide" at the interactive gate, default to N
(Quick Scan is sufficient for most uses). At the routing menu, default to
"Done." At the resume prompt, default to "Resume."

**Process:**

1. Present warm-up: "Running Quick Scan on `<owner/repo>` -- API-only, <30
   seconds."
2. Parse GitHub URL, extract `owner/repo` (MUST)
3. Validate: not archived, not home repo (Critical Rule #5), check fork status
   (MUST)
4. Check rate limits (Critical Rule #6) (MUST)
5. Run 3 parallel API batches (MUST):
   - **GitHub REST/GraphQL:** repo metadata, community/profile,
     dependabot/alerts, code-scanning/alerts, secret-scanning/alerts, workflow
     runs (last 10), contributors (top 500), dependency-graph/sbom, branch
     protection rules
   - **OpenSSF Scorecard:**
     `api.securityscorecards.dev/projects/github.com/{owner}/{repo}`
   - **deps.dev:** `api.deps.dev/v3alpha/systems/{ecosystem}/packages/{name}`
     for primary manifest dependencies
6. Compute QS dimensions (QS-01 through QS-18) (MUST)
7. Score 6 summary dimensions using band thresholds (MUST)
8. Run absence pattern classifier on API data (Ghost Ship, Security Facade,
   Borrowed Armor detectable from API alone) (MUST)
9. If `trends.jsonl` contains a previous run for this repo, proactively surface
   the delta before presenting new results (SHOULD)
10. Write artifacts: `analysis.json`, `findings.jsonl`, `summary.md` to
    `.research/<repo-slug>/` (MUST)
11. Append to `trends.jsonl` (MUST)
12. Update state file (MUST)
13. Present `summary.md` inline (MUST)
14. **Interactive gate:** "Quick Scan complete. Run Standard analysis for deeper
    inspection? (~5-15 min, requires clone) [y/N]"

**Fork handling:** If the repo is a fork, flag prominently with upstream
reference. Analyze the fork -- the user chose it for a reason. Inform, do not
redirect.

### Tier 2: Standard (clone + static analysis)

**Time budget:** 5-15 minutes. **Dimensions:** QS-01 through QS-18 + ST-01
through ST-15 (33 dimensions). **Value:** ~80% of full analysis signal.

**Activation:** `--depth=standard` or user accepts Quick Scan gate.

**Process:**

1. Clone: `git clone --filter=blob:none --depth=1 <url>` to
   `/tmp/repo-analysis-<slug>/`
   - LFS check: `GIT_LFS_SKIP_SMUDGE=1` if `.gitattributes` detected
   - Monorepo detection (turbo.json, nx.json, pnpm-workspace.yaml, etc.)
2. Run `check-tools.js` for tool availability manifest
3. Spawn dimension agents (dynamic allocation, 4 concurrent max). After each
   agent returns, report: "Dimension N of M complete (agent-name)." Spawned
   agents use the Agent tool's default timeout. If an agent exceeds 5 minutes,
   proceed with available dimension files.
   - **Always (MUST):** `gsd-codebase-mapper` (tech, arch, quality, concerns)
   - **Always (MUST):** `security-auditor` (semgrep SAST + gitleaks secrets)
   - **If tests detected:** `test-engineer` (test framework analysis)
   - **If CI detected:** `deployment-engineer` (CI/CD quality analysis)
   - **Language-conditional tools:** knip/vulture (dead code),
     dependency-cruiser (JS/TS), lizard (complexity), jscpd (duplication), scc
     (LOC/cost)
4. Each agent writes `dimensions/<dim>-findings.json` before returning
5. Orchestrator verifies file existence (write-to-disk-first rule)
6. Run absence pattern classifier on full data (all 7 patterns)
7. Aggregation: merge Quick Scan + Standard dimensions, recompute bands
8. Run Repomix: `repomix --compress` on clone, save to
   `.research/<slug>/repomix-output.txt` (SHOULD — graceful degradation if
   unavailable)
9. Generate `value-map.json` with top 5-10 extraction candidates:
   - Pattern Novelty (High/Med/Low)
   - Code Portability (0-15 rubric)
   - Adoption Readiness (High/Med/Low)
   - Quality Signal (High/Med/Low)
   - Extraction Effort (E0-E3)
10. Update all artifacts (analysis.json, findings.jsonl, summary.md,
    trends.jsonl)
11. Cleanup clone from `/tmp/`
12. Update state file
13. Present updated `summary.md` inline
14. **Routing menu** (see below)

### Tier 3: Deep (12-month history + temporal)

**Time budget:** 15-25 minutes. **Dimensions:** All 45 (QS + ST + DP-01 through
DP-12). **Value:** Full analysis signal including behavioral trends.

**Activation:** `--depth=deep` or Standard flags temporal signals worth
investigating (contributor cliff, high churn).

**Process:**

1. Deepen clone: `git fetch --filter=blob:none --shallow-since="1 year ago"`
2. Spawn temporal agents (up to 3 concurrent):
   - **Temporal Fingerprint agent** (5 signals: commit velocity, contributor
     churn, test ratio trajectory, dependency freshness, churn vs growth)
   - **Churn agent:** `git log --numstat` per file (12 months), hotspot
     detection with bot-commit filtering
   - **Contributor health agent:** `git shortlog` monthly analysis, bus factor
     trend
3. Each agent writes `dimensions/<dim>-findings.json`
4. Compute Deep dimensions (DP-01 through DP-12)
5. Enhanced value map: temporal coupling data, hotspot-based extraction
   candidates, dependency biography
6. Update all artifacts with Deep data
7. Update state file
8. Present updated `summary.md` inline
9. **Routing menu** (see below)

---

## Interactive Gate (after Quick Scan)

After presenting Quick Scan results, always offer the upgrade prompt:

```
Quick Scan complete.
  Security: Needs Work (52)  |  Reliability: Healthy (78)
  Maintainability: Excellent (81)  |  Documentation: Healthy (66)
  Process: Excellent (88)  |  Velocity: Healthy (71)
  Absence patterns: SECURITY_FACADE

Run Standard analysis for deeper inspection? [y/N]
```

The gate is mandatory. Do NOT auto-proceed to Standard. Quick Scan answers most
dependency evaluation questions without a clone.

---

## Routing Menu

Presented after Standard or Deep analysis completes. Offers 5 options:

| Option                | Action                                                           |
| --------------------- | ---------------------------------------------------------------- |
| **1. Extract value**  | Load `.research/<slug>/repomix-output.txt` + value-map context   |
|                       | into conversation. Present: "Value extraction context loaded.    |
|                       | Which candidates interest you?" User drives the conversation.    |
| **2. Send to TDMS**   | Run TDMS intake on `findings.jsonl`. Source field set to         |
|                       | `repo-analysis-<repo-slug>-<date>`. Opt-in only.                 |
| **3. Deep-plan this** | Inject `analysis.json` summary as `## Research Context` in a new |
|                       | `/deep-plan` session.                                            |
| **4. Save to memory** | Persist key findings as project memory (reference type --        |
|                       | "Analyzed <repo>, key finding: <one-liner>").                    |
| **5. Done**           | Cleanup temp files, confirm artifacts saved, exit.               |

Present the menu and wait for selection. Multiple selections are allowed
sequentially (e.g., user can Extract, then Save to memory, then Done).

---

## State File & Resume Protocol

**State file:** `.claude/state/repo-analysis.<repo-slug>.state.json`

Update after every phase transition. Schema defined in REFERENCE.md.

**Resume behavior:** On re-invocation with the same repo:

1. Check for existing state file by `<repo-slug>`
2. If found with `status: in-progress`, offer: "Previous analysis found (N days
   ago, commit `<sha>`). Resume, re-run, or compare?"
3. **Resume:** Skip completed phases, continue from last checkpoint
4. **Re-run:** Fresh analysis, archive previous state
5. **Compare:** Diff current vs previous via `trends.jsonl`, show delta

If no state file exists but `output_dir` has artifacts, scan for existing
dimension files and infer resumption point.

---

## Compaction Resilience

- **State file:** `.claude/state/repo-analysis.<repo-slug>.state.json` --
  updated after every phase. Each analysis gets its own state file keyed by repo
  slug.
- **Recovery:** On resume, read the repo-specific state file, skip completed
  phases.
- **Slug matching:** State file name derived from the repo URL (lowercase,
  hyphens for special chars). Example: `repo-analysis.facebook-react.state.json`
- **Artifacts as checkpoints:** analysis.json, findings.jsonl, summary.md,
  value-map.json persist even if state file is lost. Dimension files
  (`dimensions/<dim>-findings.json`) enable fine-grained resume.
- **Cleanup:** `rm .claude/state/repo-analysis.<repo-slug>.state.json`
- **List active analyses:** `ls .claude/state/repo-analysis.*.state.json`

---

## Integration

- **Upstream:** `/deep-research` (domain research before analysis),
  `/brainstorm` (exploring what repos to analyze)
- **Downstream:** `/deep-plan` (plan work based on findings, via routing menu
  option 3), TDMS (debt intake from findings, via routing menu option 2),
  project memory (save key findings, via routing menu option 4)
- **Neighbors:** `/audit-comprehensive` (home repo analysis -- repo-analysis
  redirects to this for the home repo), `gsd-codebase-mapper` (reused as
  Standard mode dimension agent), `security-auditor` (reused as Standard mode
  SAST agent)
- **References:** [REFERENCE.md](./REFERENCE.md) (dimension catalog, tool stack,
  output schemas, absence patterns, temporal fingerprint, guard rails)
- **Artifact consumers:** `analysis.json` consumed by `/deep-plan` as research
  context. `findings.jsonl` consumed by TDMS intake. `value-map.json` consumed
  by Extract routing option. `trends.jsonl` consumed by Compare resume option.
  `repomix-output.txt` consumed by Extract routing option for conversation
  context.
- **Research index:** Every analysis run appends to `research-index.jsonl` for
  cross-skill discoverability.

---

## Guard Rails

See REFERENCE.md for detailed guard rail rules. Summary: rate limit safety
(abort if <200 remaining), home repo redirect, fork flagging, large repo
handling (>=10,000 commits), monorepo detection, retry-once with backoff,
disengagement with state save.

## Retro

After routing menu completion: "Any observations about the analysis quality or
process?" Save response to state file `process_feedback` field. Accept empty /
"none" to proceed.

## Session Lifecycle

Session-begin SHOULD surface active repo-analysis state files via
`ls .claude/state/repo-analysis.*.state.json`. This is a documentation contract
for future session-begin enhancement — no code change needed now.

---

## Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.1     | 2026-04-02 | Skill-audit: 16 decisions — UX, guard rails, labels |
| 1.0     | 2026-04-02 | Initial implementation: 3 tiers, 45 dimensions,     |
|         |            | routing menu, state file resume, value extraction   |
