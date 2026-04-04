# Implementation Plan: /github-health Skill

**Date:** 2026-04-03 **Decisions:** 28 (see DECISIONS.md) **Effort:** L
(multi-session) **Research:** `.research/github-health/` (39 claims, 27 sources,
11 capability agents)

---

## Step 1: Create Core Health Snapshot GraphQL Query

Design and test the single compound GraphQL query that powers both --quick and
--full modes. This is the foundation — everything else builds on it.

**Implementation:**

- Write the query in REFERENCE.md as a template
- Fields: `vulnerabilityAlerts(states:OPEN)`, `secretScanningAlerts`,
  `defaultBranchRef.target.checkSuites`, `refs(refPrefix:"refs/heads/")`,
  `issues(states:OPEN)`, `pullRequests(states:OPEN)`, `labels`, `milestones`,
  `deleteBranchOnMerge`, `description`, `topics`, `isPrivate`
- Test against the repo with `gh api graphql`
- Document exact fields and cost (expected ~3-5 points)
- Per Decision #13: this is THE query for --quick and the base for --full

**Done when:** GraphQL query tested live, returns all expected fields,
documented in REFERENCE.md with field descriptions.

---

## Step 2: Create scripts/run-github-health.js (--quick mode)

Build the Node.js script that session-begin calls. Must complete in <2 seconds.

**Implementation:**

- 4 calls: Core Health Snapshot (GraphQL), cache usage (REST), plus 2 from
  snapshot parsing (secret alerts, CI status, Dependabot count already in query)
- Actually: 2 calls total — 1 GraphQL (snapshot) + 1 REST (cache usage)
- Parse snapshot: extract P0 count, CI status, stale PR count, open Dependabot
  alert count, cache %
- Per Decision #20: single line when green, expand when yellow/red
- Per Decision #22: if any call fails, report which call failed and why
- Per Decision #9: read last entry from github-health-history.jsonl for dedup
  guard (<30min) and warm-up context
- Per Decision #25: run `gh auth status --json` first, check scopes, warn about
  missing capabilities
- Append run result to github-health-history.jsonl
- Output format:
  - GREEN: `GitHub: GREEN (0 P0, CI passing, 0 stale PRs, cache 46%)`
  - YELLOW/RED: multi-line with per-issue breakdown and "run /github-health" CTA

**Done when:** Script runs in <2 seconds, outputs correct status, handles API
failures gracefully (no silent failures), writes to history JSONL.

**Depends on:** Step 1 (GraphQL query).

---

## Step 3: Create SKILL.md — Process, Modes, Triage UX

Write the skill definition that orchestrates --full mode conversationally.

**Implementation:**

- Modes: `--full` (default), `--quick` (script), `--scope <phase>` (single
  phase)
- 7 phases: Security, Actions, Dependencies, Config, Release, Insights, PR
  Health
- Per Decision #16: per-finding triage with Fix/Defer/Skip/Suppress
- Per Decision #6: skill must be able to fix everything — no artificial scope
  cap
- Per Decision #19: delegation to other skills with user confirmation
- Warm-up section (Decision #15): read history JSONL, show last grades + trends
- Token scope check section (Decision #25): proactive at start
- Error handling (Decision #22): per-phase try/catch, NO SILENT FAILURES
- Dedup guard (Decision #9): <30min check
- Suppression handling (Decision #11): check suppressions.json, skip suppressed
- Phase execution: run each phase, collect findings, grade each phase (Decision
  #10)
- Triage loop: present findings by severity (P0 first), per-item
  Fix/Defer/Skip/Suppress
- Fix execution: per Decision #24, create `github-health-fixes` branch, atomic
  commits per fix, one PR at end
- Defer collection: per Decision #17, batch deferred items, route to /add-debt
  at end
- Post-triage: update history JSONL, present summary

**Done when:** SKILL.md defines the complete orchestration flow, all 28
decisions reflected, modes documented. **Does not include API details or fix
recipes** — those go in REFERENCE.md.

---

## Step 4: Create REFERENCE.md — API Catalog, Fix Recipes, Schemas

The implementation handbook. Everything the skill needs to execute.

**Implementation:**

### API Endpoints Section

- Core Health Snapshot GraphQL query (from Step 1)
- Per-phase REST endpoints (from research Section 4.2 + agent findings):
  - Phase 1 (Security): secret-scanning/alerts, code-scanning/alerts,
    dependabot/alerts, commit verification (GraphQL signature)
  - Phase 2 (Actions): actions/workflows, actions/runs, actions/cache/usage,
    actions/caches, workflow YAML reads
  - Phase 3 (Deps): dependency-graph/sbom, dependabot.yml read, package.json
    reads
  - Phase 4 (Config): rulesets, environments, labels, community/profile,
    branches (GraphQL refs), hooks, issues (GraphQL)
  - Phase 5 (Release): release-please run status, config reads
  - Phase 6 (Insights): traffic, commit activity
  - Phase 7 (PR Health): pullRequests (GraphQL), pr list

### Fix Recipes Section

Per fix class (from research Section 4.4 + agent findings):

- Close false-positive secret alerts (`gh api --method PATCH`)
- Add repo topics (`gh api --method PATCH`)
- Update dependabot.yml (file edit, commit)
- Add workflow permissions block (YAML edit, commit)
- Pin workflow action SHA (YAML edit, commit)
- Add PR approval step to auto-merge (YAML edit, commit)
- Add issue templates (file create, commit)
- Add/delete labels (`gh label create/delete`)
- Add branch deploy policy (`gh api --method PUT`)
- Create tag protection ruleset (`gh api --method POST /rulesets`)
- Delete stale Actions caches (`gh api --method DELETE /actions/caches`)
- Close stale PRs (`gh pr close`)
- Enable `deleteBranchOnMerge` (`gh api --method PATCH`)
- Per Decision #23: UI-only fixes get step-by-step layman instructions with URLs

### Schemas Section

- github-health-history.jsonl record schema
- github-health-suppressions.json schema
- Grading thresholds (Decision #10)
- License flag categories (Decision #12)
- Trend alert thresholds (Decision #14)

**Done when:** REFERENCE.md contains all API endpoints, fix recipes, and schemas
needed for implementation. No ambiguity left for the executor.

**Depends on:** Step 1 (query), Step 3 (SKILL.md for cross-reference).

---

## Step 5: Integrate --quick into Session-Begin

Wire the script into the session-begin health check pipeline.

**Implementation:**

- Per Decision #5: add to session-begin's health scripts section
- Add `node scripts/run-github-health.js --quick` call
- Position after `/alerts --limited`, before the health gate
- Handle: script not found (skip gracefully), script timeout (2s max), script
  error (report, don't gate)
- The session-begin skill SKILL.md needs a small edit to include the new check

**Done when:** Session-begin runs github-health --quick, output appears in
session-begin health section, failures don't block session start.

**Depends on:** Step 2 (script exists).

---

## Step 6: Implement Phase 1 — Security Assessment

The highest-priority assessment phase. Covers security alerts + commit signing.

**Implementation:**

- Fetch: open secret scanning alerts (classify real vs false positive)
- Fetch: open code scanning alerts (group by category)
- Fetch: open Dependabot alerts (count by severity)
- Check: secret scanning validity checks enabled?
- Check: push protection enabled?
- Check: commit signing rate (last 30 commits, distinguish dev vs web-flow) Per
  agent finding: 0% dev-signed currently. Low priority signal.
- Grade phase per Decision #10
- Present findings with fix options per Decision #16
- Fixes: close false-positive alerts, enable validity checks (if API supports)
- UI-only: PAT revocation verification (Decision #23 — layman instructions)

**Done when:** Phase 1 runs end-to-end, grades correctly, presents findings, can
execute fixes.

**Depends on:** Steps 3-4 (SKILL.md + REFERENCE.md exist).

---

## Step 7: Implement Phase 2 — Actions Assessment

CI/CD health + cache utilization + CI performance.

**Implementation:**

- Fetch: all workflow runs, identify failing on main
- Read: workflow YAML files, check TokenPermissions, PinnedDependencies
- Check: auto-merge workflow has approval step?
- Check: dependency-review workflow exists?
- Fetch: cache usage (REST) — total size, per-type breakdown, staleness
- Compute: CI duration trending from last N runs (wall-clock via job timestamps)
- Per agent finding: 4.58 GB / 10 GB cache, 13 CodeQL caches accumulating
- Grade phase, present findings
- Fixes: add permissions blocks, pin action SHAs, delete stale caches, add
  approval step to auto-merge
- Delegation: failing workflows → offer `/gh-fix-ci` (Decision #19)

**Done when:** Phase 2 runs end-to-end including cache analysis and CI trending.

**Depends on:** Steps 3-4.

---

## Step 8: Implement Phase 3 — Dependencies Assessment

Dependabot coverage + SBOM analysis.

**Implementation:**

- Read: dependabot.yml, compare against discovered package.json files
- Check: all ecosystem paths covered? (agents found PyPI gap)
- Check: overrides documented?
- Check: cooldown configured?
- Check: security-update grouping?
- Fetch: SBOM (REST) — parse license distribution, flag per Decision #12
- Per agent finding: 2,030 packages, 22 unknown licenses, 14 MPL-2.0, 9 FSL
- Compute: ecosystem coverage gap (compare manifest list vs dependabot.yml)
- Store: dependency count in history JSONL for trending
- Grade phase, present findings
- Fixes: update dependabot.yml (add paths, grouping, cooldown)

**Done when:** Phase 3 runs end-to-end including SBOM license scan.

**Depends on:** Steps 3-4.

---

## Step 9: Implement Phase 4 — Config Assessment

Repository configuration hygiene. Expanded significantly by agent research.

**Implementation:**

- Fetch: rulesets — check duplicates, consolidation opportunities
- Check: tag protection rulesets exist? (agent: none, gap S15)
- Fetch: environments — check protection rules
- Fetch: labels — check tier schema completeness (missing tier-3)
- Fetch: community profile — identify missing components (issue templates)
- Check: topics configured?
- Check: `deleteBranchOnMerge` setting (agent: currently false)
- Fetch: branches — staleness analysis (agent: 2 remote, clean)
- Fetch: issues — open count, age, label coverage (agent: #151 stale 95 days)
- Fetch: webhooks — count, health if any exist (agent: 0 hooks)
- Grade phase, present findings
- Fixes: add topics, add labels, create issue templates, enable
  deleteBranchOnMerge, create tag protection ruleset, consolidate rulesets
  (present plan first)

**Done when:** Phase 4 runs end-to-end with all agent-researched additions.

**Depends on:** Steps 3-4.

---

## Step 10: Implement Phase 5 — Release Assessment

Release Please health and release pipeline.

**Implementation:**

- Fetch: latest Release Please run — parse failure reason
- Read: release-please-config.json — validate structure
- Read: .release-please-manifest.json — check versions match reality
- Check: tags exist? (agent: only v1.0)
- Grade phase, present findings
- Delegation: Release Please diagnosis → offer `/gh-fix-ci` (Decision #19)

**Done when:** Phase 5 runs end-to-end.

**Depends on:** Steps 3-4.

---

## Step 11: Implement Phase 6 — Insights Assessment

Informational only — no fixes.

**Implementation:**

- Fetch: traffic (views, clones, referrers)
- Fetch: commit activity
- Present: activity summary
- Grade: always A (informational, no issues to find)
- No triage — display only

**Done when:** Phase 6 runs and displays insights data.

**Depends on:** Steps 3-4.

---

## Step 12: Implement Phase 7 — PR Health Assessment

New phase from agent research. Stale PR analysis.

**Implementation:**

- Fetch: open PRs with full metadata (GraphQL — age, CI status, merge status,
  draft, labels, author)
- Classify: Dependabot PRs vs human PRs (different staleness thresholds)
- Detect: stale PRs (>7d human, >3d Dependabot)
- Detect: CI-blocked PRs (check status failing >24h)
- Detect: merge-conflict PRs (mergeable == CONFLICTING)
- Detect: draft PRs >14d (abandoned exploration)
- Detect: auto-merge stalls (enabled but not merging)
- Per agent finding: currently 0 open PRs, 459 merged. Preventive value.
- Grade phase, present findings
- Fixes: close stale PRs, delegate CI failures to /gh-fix-ci
- No --quick addition beyond count (already in Core Health Snapshot)

**Done when:** Phase 7 runs end-to-end with all stale PR classifications.

**Depends on:** Steps 3-4.

---

## Step 13: Implement Triage Loop & Fix Execution Pipeline

The interactive triage that ties all phases together.

**Implementation:**

- Collect findings from all phases (or selected --scope)
- Sort by severity: P0 first, then P1, P2, P3
- Per-finding presentation: description, severity, phase, fix available,
  recommendation
- Per-finding options: [F]ix / [D]efer / [S]kip / [Su]ppress
- Fix execution per Decision #24:
  - Create `github-health-fixes` branch at start of first fix
  - Each fix: execute (gh command, file edit, etc.), atomic commit
  - After all fixes: push branch, create PR with summary
- Defer collection per Decision #17: batch all deferred items
- After triage: route deferred items to /add-debt
- Suppression writes: update github-health-suppressions.json
- Post-triage summary: X fixed, Y deferred, Z skipped, W suppressed

**Done when:** Full triage loop works — fixes commit atomically, PR created,
deferred items routed, suppressions saved.

**Depends on:** Steps 6-12 (phases produce findings to triage).

---

## Step 14: Implement History Tracking & Trend Detection

Wire up the JSONL history and trend alerting.

**Implementation:**

- Per Decision #9: append to github-health-history.jsonl after every run
- Record: timestamp, mode, per-phase grades, issue counts by severity, cache %,
  branch count, open PR count, dependency count
- Per Decision #14: compare against last entry for trend alerts
- Per Decision #15: read last entry at warm-up for context display
- Dedup guard: skip if last run <30 minutes ago (warn, offer override)

**Done when:** History appends correctly, trend alerts fire when thresholds are
crossed, warm-up displays last run context.

**Depends on:** Steps 2-3 (script and SKILL.md reference the history).

---

## Step 15: Audit Checkpoint

Run code-reviewer on all new/modified files. Verify:

- All 28 decisions from DECISIONS.md are reflected in the implementation
- SKILL.md process matches the plan
- REFERENCE.md contains all API endpoints and fix recipes
- scripts/run-github-health.js handles all error cases (no silent failures)
- Session-begin integration works
- Grading thresholds match Decision #10
- Suppression model matches Decision #11
- License flags match Decision #12
- All agent research findings incorporated into the correct phases

**Done when:** Code review passes, all decisions verified in implementation.

**Depends on:** Steps 1-14.

---

## Parallelization Notes

- **Steps 1-2** are sequential (script depends on query)
- **Steps 3-4** can run in parallel (SKILL.md and REFERENCE.md are independent)
- **Step 5** depends on Step 2
- **Steps 6-12** (phases) can run in parallel after Steps 3-4
- **Step 13** depends on Steps 6-12
- **Step 14** can start after Step 2
- **Step 15** depends on all prior steps

**Suggested execution waves:**

1. Steps 1-2 (foundation)
2. Steps 3-4 in parallel (documentation)
3. Step 5 + Steps 6-12 in parallel (integration + phases)
4. Steps 13-14 (triage + history)
5. Step 15 (audit)
