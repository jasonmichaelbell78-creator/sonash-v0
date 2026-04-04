# Plan: /repo-analysis Skill Implementation

**Date:** 2026-04-01 **Decisions:** [DECISIONS.md](./DECISIONS.md) (24
decisions) **Research:** `.research/repo-analysis-skill/RESEARCH_OUTPUT.md`,
`.research/repo-analysis-value-extraction/RESEARCH_OUTPUT.md` **Effort:** L
(estimated 3-4 sessions)

---

## Overview

Build a `/repo-analysis` skill that analyzes external GitHub repositories for
health assessment (automated) and value extraction (conversation-primed). Three
depth tiers: Quick Scan (API-only default) → Standard (clone + static) → Deep
(12-month history + temporal). Outputs: analysis.json, findings.jsonl,
value-map.json, summary.md, trends.jsonl.

---

## Step 1: Skill Package Scaffold

Create the skill directory and core files.

**Files:**

- `.claude/skills/repo-analysis/SKILL.md` — skill definition with Critical
  Rules, When to Use/NOT, process overview, depth tiers, routing menu
- `.claude/skills/repo-analysis/REFERENCE.md` — detailed reference: dimension
  catalog (QS-01 through DP-12), tool stack (Tier 1/2/3), output schemas
  (analysis.json, findings.jsonl, value-map.json, trends.jsonl), absence pattern
  definitions, temporal fingerprint schema, scoring band definitions, guard
  rails (rate limits, large repo safety, monorepo handling, fork/home-repo
  guards)

**Pattern:** Mirror `deep-plan/` structure (SKILL.md + REFERENCE.md). Per D4.

**Done when:**

- SKILL.md has: versioned header, Critical Rules section, 3 depth tiers
  documented, routing menu (5 options per D24), Quick Scan as default behavior,
  interactive gate after Quick Scan (D8), state file resume protocol (D16)
- REFERENCE.md has: all 45 analysis dimensions from research (18 QS + 15 ST + 12
  DP), tool stack tables (Tier 1-3 + avoid list), all output schemas with field
  definitions, 7 absence pattern definitions with detection rules, 5-signal
  temporal fingerprint spec, scoring band table, guard rail rules

---

## Step 2: Tool Installation Script

**Files:**

- `scripts/repo-analysis/install-tools.sh` — installs Tier 1 tools (scc,
  semgrep, lizard, jscpd, gitleaks, git-quick-stats) + Repomix. Detects platform
  (Windows/Mac/Linux). Per D6.
- `scripts/repo-analysis/check-tools.js` — checks which Tier 1 + Tier 2 tools
  are available; returns JSON manifest of available/missing tools. Used by skill
  at runtime for graceful degradation (D6).

**Pattern:** Follow `scripts/install-cli-tools.sh` structure.

**Done when:**

- install-tools.sh successfully installs all Tier 1 tools on Windows (primary
  locale)
- check-tools.js returns accurate JSON manifest
  (`{ "scc": true, "semgrep": false, ... }`)
- Missing tools produce clear user-facing message, not silent failure

---

## Step 3: Quick Scan Implementation (Phase 0 — API-only)

The core of the skill. No clone, no disk writes, <30 seconds. Per D1, D8.

**Implementation in SKILL.md behavioral instructions:**

Quick Scan runs inline (no spawned agents, per D7). The skill orchestrator:

1. Parse GitHub URL → extract `owner/repo`
2. Validate: not archived, not home repo (D21), check fork status (D20)
3. Run 3 parallel API batches:
   - **GitHub REST batch:** repo metadata, community/profile, dependabot/alerts,
     code-scanning/alerts, secret-scanning/alerts, workflow runs (last 10),
     contributors (top 500), dependency-graph/sbom, branch protection (GraphQL)
   - **OpenSSF Scorecard:**
     `api.securityscorecards.dev/projects/github.com/{owner}/{repo}`
   - **deps.dev:** `api.deps.dev/v3alpha/systems/{ecosystem}/packages/{name}`
     for primary manifest dependencies
4. Rate limit check before batch (abort if `remaining < 200`, per research guard
   rails)
5. Error handling: retry once with backoff, then degrade gracefully (D22)
6. Compute QS dimensions (QS-01 through QS-18) from API responses
7. Score 6 dimensions using band thresholds
8. Run absence pattern classifier on API data (Ghost Ship, Security Facade,
   Borrowed Armor detectable from API alone)
9. Write: `analysis.json`, `findings.jsonl`, `summary.md` to
   `.research/<repo-slug>/` (D5)
10. Append to `trends.jsonl` (D5)
11. Present summary inline (D23)
12. Interactive gate: "Run Standard analysis? [y/N]" (D8)

**State file:** `.claude/state/repo-analysis.<repo-slug>.state.json` with resume
protocol (D16).

**Done when:**

- Given a public GitHub URL, Quick Scan completes in <30s
- All 18 QS dimensions computed (or marked unavailable with reason)
- 6 dimension bands displayed with absence patterns
- analysis.json, findings.jsonl, summary.md written to output dir
- Interactive gate presented after summary
- State file created/updated
- Private repos work transparently with valid gh auth (D19)

---

## Step 4: Standard Mode Implementation (Clone + Static Analysis)

Activated by `--depth=standard` or user accepting Quick Scan gate. Per D7, D9,
D15.

**Implementation:**

1. Clone: `git clone --filter=blob:none --depth=1 <url>` to
   `/tmp/repo-analysis-<slug>/` (D9)
   - LFS check: `GIT_LFS_SKIP_SMUDGE=1` if `.gitattributes` detected
   - Monorepo detection (turbo.json, nx.json, pnpm-workspace.yaml, etc.)
2. Run `check-tools.js` for tool availability manifest
3. Spawn dimension agents (D15 — dynamic allocation, 4 concurrent max):
   - **Always:** gsd-codebase-mapper (tech, arch, quality, concerns axes)
   - **Always:** security-auditor (semgrep SAST + gitleaks secrets)
   - **If tests detected:** test-engineer (test framework analysis)
   - **If CI detected:** deployment-engineer (CI/CD quality analysis)
   - **Language-conditional tools:** knip/vulture (dead code),
     dependency-cruiser (JS/TS), lizard (complexity), jscpd (duplication), scc
     (LOC/cost)
4. Each agent writes `dimensions/<dim>-findings.json` before returning
5. Orchestrator verifies file existence (write-to-disk-first rule)
6. Run absence pattern classifier on full data (all 7 patterns)
7. Aggregation: merge Quick Scan + Standard dimensions, recompute bands
8. Run Repomix: `repomix --compress` on clone → save to
   `.research/<slug>/repomix-output.txt` (D18)
9. Generate value-map.json with top 5-10 extraction candidates (D12, D13):
   - Pattern Novelty (High/Med/Low)
   - Code Portability (0-15 rubric)
   - Adoption Readiness (High/Med/Low)
   - Quality Signal (High/Med/Low)
   - Extraction Effort (E0-E3)
10. Update analysis.json, findings.jsonl, summary.md (add value extraction
    section), trends.jsonl
11. Cleanup clone from `/tmp/` (D9)
12. Present updated summary inline (D23)
13. Routing menu (D24): Extract value | Send to TDMS | Deep-plan this | Save to
    memory | Done

**Done when:**

- Standard analysis runs on a medium repo in <15 minutes
- Dynamic agent allocation works (conditional spawning based on detection)
- Graceful degradation when tools missing (D6)
- Value-map.json produced with ranked extraction candidates
- Repomix compressed output saved
- All artifacts updated
- Routing menu functional with all 5 options

**Depends on:** Step 3 (Quick Scan artifacts extended, not replaced)

---

## Step 5: Deep Mode Implementation (History + Temporal)

Activated by `--depth=deep` or when Standard flags temporal signals worth
investigating. Per D7.

**Implementation:**

1. Deepen clone: `git fetch --filter=blob:none --shallow-since="1 year ago"`
2. Spawn temporal agents (up to 3 concurrent):
   - Temporal Fingerprint agent (5 signals: commit velocity, contributor churn,
     test ratio trajectory, dependency freshness, churn vs growth)
   - Churn agent: `git log --numstat` per file (12 months), hotspot detection
     with bot-commit filtering (research: 73.9% of hotspot commits are bots)
   - Contributor health agent: `git shortlog` monthly analysis, bus factor trend
3. Each agent writes `dimensions/<dim>-findings.json`
4. Compute Deep dimensions (DP-01 through DP-12)
5. Enhanced value map: temporal coupling data, hotspot-based extraction
   candidates, dependency biography
6. Update all artifacts with Deep data
7. Present + routing menu

**Done when:**

- Deep analysis runs on a medium repo in <25 minutes
- Temporal fingerprint computed with sparklines
- Hotspots correctly filter bot commits
- Trend alert thresholds applied (contributor cliff, dependency spike, etc.)

**Depends on:** Step 4 (extends Standard with history data)

---

## Step 6: Routing Menu Integration

Implement the 5 routing options from D24.

**Implementation:**

1. **Extract value:** Load `.research/<slug>/repomix-output.txt` + value-map
   context into conversation. Present: "Value extraction context loaded. Which
   candidates interest you?" User drives the extraction conversation.
2. **Send to TDMS:** Run `intake-audit.js` equivalent on findings.jsonl.
   Requires source field set to `repo-analysis-<repo-slug>-<date>` (D10).
3. **Deep-plan this:** Inject analysis.json summary as `## Research Context` in
   a new `/deep-plan` session (uses existing deep-plan adapter).
4. **Save to memory:** Persist key findings as project memory (reference type —
   "Analyzed <repo>, key finding: <one-liner>").
5. **Done:** Cleanup temp files, confirm artifacts saved, exit.

**Done when:**

- Each routing option functional end-to-end
- Extract value loads context without exceeding token budget
- TDMS intake produces valid debt items with correct source attribution
- Deep-plan injection follows existing adapter contract

**Depends on:** Steps 3-5 (all analysis modes produce the artifacts routing
consumes)

---

## Step 7: State File & Resume Protocol

Implement compaction-resilient state management. Per D16.

**Implementation:**

- State file: `.claude/state/repo-analysis.<repo-slug>.state.json`
- Schema from research (Section 11.3): skill, version, slug, target_repo,
  target_commit, status, phase, depth, dimensions_completed/failed, clone_dir,
  output_dir, agent_budget, timestamps
- Resume: on re-invocation with same repo, check state file. Offer: "Previous
  analysis found (N days ago, commit <sha>). Resume, re-run, or compare?"
- Compare option: diff current vs previous via trends.jsonl

**Done when:**

- State file created on start, updated after each phase
- Resume correctly skips completed phases
- Re-run produces fresh analysis
- Compare shows delta from previous run

---

## Step 8: Cross-Reference Integration

Wire up the integration points from D17.

**Files to update:**

- `.claude/skills/deep-plan/REFERENCE.md` — add repo-analysis as injectable
  research source
- `.claude/skills/audit-comprehensive/SKILL.md` — add note about home-repo guard
  redirecting from repo-analysis
- `research-index.jsonl` — ensure repo-analysis runs are tracked

**Done when:**

- deep-plan can consume repo-analysis output as research context
- audit-comprehensive references the redirect relationship
- research-index.jsonl updated on each analysis run

**Depends on:** Step 1 (skill exists to reference)

---

## Step 9: Audit Checkpoint

Run code-reviewer on all new/modified files. Verify:

- [ ] SKILL.md follows project skill conventions (versioned header, Critical
      Rules, When to Use/NOT)
- [ ] REFERENCE.md dimensions match research (no drift from source)
- [ ] Output schemas match TDMS conventions (findings.jsonl compatible)
- [ ] State file schema follows project state file conventions
- [ ] Scripts follow CODE_PATTERNS.md (error sanitization, path traversal, file
      read try/catch, etc.)
- [ ] No security checklist violations in scripts
- [ ] install-tools.sh works on Windows (primary locale)
- [ ] Quick Scan completes <30s on a real public repo
- [ ] All 5 routing menu options functional

**Done when:** Code review passes with no S0/S1 findings.

---

## Parallelization Notes

- **Steps 1-2 can run in parallel** (skill scaffold + tool scripts are
  independent)
- **Steps 3-5 are sequential** (each extends the previous mode)
- **Step 6 depends on Steps 3-5** (routing consumes analysis artifacts)
- **Step 7 can overlap with Steps 3-5** (state management built alongside
  analysis modes)
- **Step 8 can run after Step 1** (cross-references only need skill to exist)

---

## Risk Register

| Risk                                         | Mitigation                                       |
| -------------------------------------------- | ------------------------------------------------ |
| Tool installation fails on Windows           | Graceful degradation (D6); never blocks analysis |
| GitHub API rate limits hit during Quick Scan | Pre-check `/rate_limit`; abort if <200 remaining |
| Large repos exceed clone timeout             | Blobless partial clone; size heuristic from API  |
| Repomix unavailable or fails on some repos   | Graceful degradation; value map still produced   |
| Agent orchestration overwhelms context       | 4-concurrent cap; write-to-disk-first rule       |
| Value extraction candidates are low quality  | Hybrid scoring (D13); "requires review" labels   |
