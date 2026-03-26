# Findings: Comprehensive Intake Gap Matrix — All Disconnected and Partial Paths

**Searcher:** deep-research-searcher
**Profile:** codebase
**Date:** 2026-03-26T17:13:50Z
**Sub-Question IDs:** SQ-8a

---

## Overview

This document synthesizes findings from SQ1 through SQ7 to produce a complete
gap matrix. Every source of technical debt findings in the sonash-v0 codebase was
catalogued across prior waves. This document maps each non-integrated path to:
what findings it produces, where they currently land, what integration would look
like, effort level, and dashboard priority.

**Scale context from live data (2026-03-26):**
- MASTER_DEBT.jsonl: 8,470 items total (7,281 open, 13% resolution rate)
- S0 open alerts: 11 | S1 open alerts: 1,259
- Verification queue (NEW status): 2,125 items
- Resolution log: only 14 entries (severely under-logged)

---

## Part 1: Fully Disconnected Paths

These sources produce findings that NEVER reach TDMS under any current path.

---

### GAP-01: code-reviewer Agent

**What findings are produced:**
- Code review violations, anti-pattern detections, pre-existing architectural
  issues identified during PR review
- Format: inline review checklist text in the agent response, no JSONL output
- Volume estimate: 5-30 findings per PR; reviewer is triggered on every code
  change (per CLAUDE.md Section 7 POST-TASK triggers)

**Where findings currently land:**
- In the Claude conversation context only — no file is written
- If the reviewer blocks (e.g., on a critical pattern), the commit is blocked
  but no debt record is created
- Findings that "can't be fixed inline" are explicitly noted as the caller's
  responsibility to route — but no caller infrastructure exists to do that

**What integration would look like:**
- Option A (minimal): Add a TDMS routing step to code-reviewer SKILL.md — after
  completing review, present unfixable/deferred items to user with "defer to
  TDMS?" choice, invoke `/add-debt` for each accepted item
- Option B (structured): Have code-reviewer write a structured JSONL findings
  file to `docs/reviews/code-reviewer/YYYY-MM-DD-PR-N.jsonl` in the same format
  as existing review JSONLs, then `extract-reviews.js` picks it up automatically
  on next consolidation
- Recommended: Option B — aligns with existing extract-reviews.js infrastructure
  which already scans `docs/reviews/**/*.jsonl`

**Effort:** Moderate — SKILL.md update + JSONL output format definition (can
reuse `docs/templates/JSONL_SCHEMA_STANDARD.md`). No new scripts needed.

**Priority:** MUST-HAVE. The code-reviewer is triggered on every code change and
produces the highest-volume operational finding stream. Its complete disconnection
from TDMS is the largest single coverage gap in the system.

---

### GAP-02: gh-fix-ci Skill — Systemic CI Failures

**What findings are produced:**
- Root cause analysis of CI failures (TypeScript errors, ESLint failures, test
  failures, hook failures)
- Specifically: the difference between "fix the symptom" and "record the systemic
  debt that caused it"
- Format: plan in Claude context, changes applied to files directly
- Volume estimate: low frequency (CI failures), but each event often reveals
  pre-existing debt that was merely hidden

**Where findings currently land:**
- Fix is applied; the underlying debt cause is lost
- No `/add-debt` reference anywhere in gh-fix-ci SKILL.md
- There is no "systemic issue" classification step in the skill

**What integration would look like:**
- Add a post-fix classification step: "Was this CI failure caused by a pre-existing
  pattern? [A] One-time error, no debt [B] Systemic issue — create DEBT entry"
- Option B invokes `/add-debt` with the root cause as the finding
- Alternatively: add a "Systemic failures" section at skill closure that mirrors
  the pattern from pre-commit-fixer's Step 7 closure

**Effort:** Trivial — SKILL.md change only, no new scripts

**Priority:** Nice-to-have. Low event frequency. The "fix it and move on" pattern
is appropriate for most CI failures. Only systemic patterns benefit from TDMS
tracking. Pre-commit-fixer already handles similar pre-existing errors more
comprehensively.

---

### GAP-03: convergence-loop Skill — Verification Results Not Tracked

**What findings are produced:**
- Verified claims: Confirmed / Corrected / Extended / New (T20 tally per pass)
- Specifically: "New" findings discovered during verification that weren't in
  the original scope — these are net-new debt discovered during CL execution
- Format: structured pass reports in the convergence state; T20 tally counts
- Volume estimate: 0-10 net-new findings per CL session (the "New" category)

**Where findings currently land:**
- CL output is consumed by the calling skill (e.g., debt-runner verify mode)
- "New" findings flow into staging files for the calling skill
- No direct TDMS path for CL-discovered items that are outside the caller's scope

**What integration would look like:**
- CL itself does not need TDMS integration — that responsibility belongs to its
  callers (debt-runner, etc.)
- The gap is in callers that use CL but don't have a TDMS routing step for
  "New" findings surfaced during verification
- The debt-runner's convergence loop integration correctly routes these through
  staging files — the gap is in non-debt-runner CL callers (e.g., skills that
  use CL for their own verification but don't process the "New" bucket)

**Effort:** Low — documentation and convention, not a new script

**Priority:** Low. CL is primarily used by debt-runner which does handle this.
The gap is theoretical for non-debt-runner callers.

---

### GAP-04: quick-fix Skill

**What findings are produced:**
- Pre-commit pattern compliance violations and suggestions
- Format: text recommendations; may apply auto-fixes
- Volume estimate: low-medium (triggered by hooks when failures occur)

**Where findings currently land:**
- Fixes applied or dismissed; no TDMS record
- quick-fix (v1.0, 2026-02-25, no updates) appears to predate the TDMS system's
  current design

**What integration would look like:**
- quick-fix overlaps significantly with pre-commit-fixer, which already has TDMS
  routing
- Preferred path: deprecate quick-fix in favor of pre-commit-fixer, which has
  the full defer-to-TDMS menu already built in

**Effort:** Trivial (if deprecating) or Moderate (if adding TDMS routing to
quick-fix independently)

**Priority:** Low. Deprecation is the correct path; users should use
pre-commit-fixer instead.

---

### GAP-05: SonarCloud CI Workflow (sonarcloud.yml)

**What findings are produced:**
- Full SonarCloud static analysis on every push/PR to main
- All issues types: BUG, VULNERABILITY, CODE_SMELL
- All severities: BLOCKER/CRITICAL (S0), MAJOR (S1), MINOR/INFO (S2/S3)
- Volume estimate: hundreds to thousands of findings per analysis run

**Where findings currently land:**
- SonarCloud cloud dashboard only — findings accumulate there but are never
  automatically synced to TDMS
- The gap: `sonarcloud.yml` does not invoke `sync-sonarcloud.js` after analysis
- Manual path exists: `sync-sonarcloud.js` script is robust and works, but
  requires deliberate invocation by the user

**What integration would look like:**
- Add a post-analysis step to `sonarcloud.yml`:
  ```yaml
  - name: Sync new findings to TDMS
    run: node scripts/debt/sync-sonarcloud.js --force --severity BLOCKER,CRITICAL,MAJOR
    env:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  ```
- Run only on main branch push (not PR, to avoid duplicate runs)
- Use `--severity BLOCKER,CRITICAL` for auto-intake; MAJOR and below as optional
- The `sync-sonarcloud.js --resolve` or `--full` flag can also close items that
  disappeared from SonarCloud
- An MCP server (`scripts/mcp/sonarcloud-server.js`) already exists for
  AI-driven status checks

**Effort:** Trivial — single CI step addition. The script is fully implemented.

**Priority:** MUST-HAVE. SonarCloud is a tier-1 external source (currently 2,561
items in MASTER_DEBT already). The fact that the CI analysis runs but doesn't
sync to TDMS is the most impactful automated integration gap.

---

### GAP-06: Pattern Compliance CI (pattern-compliance-audit.yml)

**What findings are produced:**
- Weekly full-repo pattern compliance scan results
- Creates GitHub Issues with label `pattern-compliance` / `tech-debt` when:
  blocking violations > 0 OR warning threshold > 75
- Format: GitHub Issues (not JSONL, not TDMS)

**Where findings currently land:**
- GitHub Issues only — these are completely invisible to TDMS
- `source_id` patterns in MASTER_DEBT show no `github-issue:` prefix
- TDMS has no GitHub Issues sync in either direction

**What integration would look like:**
- Option A: Change `pattern-compliance-audit.yml` to call `intake-manual.js`
  instead of creating a GitHub Issue. Script can use the JSON output of
  `check-pattern-compliance.js` to produce structured items
- Option B: Add a GitHub Issues → TDMS sync script (more complex, general-purpose)
- Option C: Keep GitHub Issues creation but also call intake-manual.js for each
  violation batch
- Recommended: Option A — change the terminal output of the workflow to call
  `intake-manual.js` or a new `intake-pattern-violations.js` script

**Effort:** Moderate — requires adapting `pattern-compliance-audit.yml` to call
intake scripts and writing a thin shim that maps pattern violation output to
TDMS JSONL format

**Priority:** Must-have for dashboard completeness. Pattern violations currently
in a parallel tracking system with no TDMS visibility. The `tech-debt` label on
GitHub Issues suggests this was intended to be part of the debt tracking system.

---

### GAP-07: Semgrep Findings (GitHub Code Scanning)

**What findings are produced:**
- Custom rule violations from `.semgrep/rules/`
- Runs on push/PR to main + weekly schedule
- SARIF format uploaded to GitHub Security tab
- Volume estimate: unknown (requires GitHub API to query)

**Where findings currently land:**
- GitHub Security tab (`/security/code-scanning`) only
- No SARIF file saved to the repo; no local artifact produced
- The workflow uses `|| true`, making all findings informational (non-blocking)
- Completely invisible to TDMS

**What integration would look like:**
- Use the GitHub Code Scanning REST API:
  `GET /repos/{owner}/{repo}/code-scanning/alerts?tool_name=Semgrep&state=open`
- A new script `scripts/debt/sync-code-scanning.js` could be built on the same
  pattern as `sync-sonarcloud.js`:
  fetch alerts → deduplicate by alert number/rule → assign DEBT IDs → append via
  `appendMasterDebtSync`
- Severity mapping: critical → S0, high → S1, medium → S2, low → S3
- Run on schedule (weekly, same as semgrep.yml) via new CI workflow step or
  manual invocation

**Effort:** Significant — requires new script (GitHub Security API vs. SonarCloud
API, different auth model using `GITHUB_TOKEN`), new severity mapping, new
source_id prefix convention (`semgrep:alert-{number}`)

**Priority:** Nice-to-have. The custom `.semgrep/rules/` are specifically for
this project's patterns. Low priority until the higher-impact gaps (SonarCloud
auto-sync, code-reviewer) are addressed.

---

### GAP-08: CodeQL Findings (GitHub Code Scanning)

**What findings are produced:**
- JavaScript/TypeScript security and quality analysis
- Runs on push/PR to main + weekly Monday schedule
- SARIF uploaded to GitHub Security tab
- Volume estimate: unknown (requires API)

**Where findings currently land:**
- GitHub Security tab only (same as Semgrep)
- No SARIF file saved to repo; no local artifact
- Completely invisible to TDMS

**What integration would look like:**
- Same `sync-code-scanning.js` script as GAP-07 can handle both Semgrep and
  CodeQL by filtering by `tool_name`
- CodeQL findings tend to be higher precision (fewer but more reliable) than
  Semgrep; the same script architecture applies

**Effort:** Bundled with GAP-07 (same script handles both tools)

**Priority:** Nice-to-have (but higher precision than Semgrep). Bundle with
GAP-07.

---

### GAP-09: npm audit Vulnerabilities

**What findings are produced:**
- Dependency vulnerability findings from the npm advisory database
- Severity levels: critical, high, moderate, low, info
- Format: `npm audit --json` produces structured JSON
- Current status: npm audit runs in health checker (`security.js`) as a metric
  only, not in CI as a blocking check (confirmed gap from SQ5)
- Volume estimate: currently unknown (requires live run)

**Where findings currently land:**
- In `security.js` health checker as aggregate counts (critical_vulns, high_vulns)
  for the composite health score only — no per-vulnerability records
- Not a blocking CI check (omitted from `ci.yml`)
- No TDMS path exists

**What integration would look like:**
- New script `scripts/debt/sync-npm-audit.js`:
  - Runs `npm audit --json`
  - Maps each advisory to a TDMS item: `source_id: "npm-audit:{advisory-id}"`,
    `severity`: critical → S0, high → S1, moderate → S2, low → S3
  - Deduplicates by advisory ID against existing MASTER_DEBT items
  - Appends via `appendMasterDebtSync`
- Invocable via a new npm script or weekly CI cron
- The `sync-sonarcloud.js` is the architectural template

**Effort:** Moderate — new script needed, but the pattern is well-established

**Priority:** Must-have. npm audit is the most direct source of security
vulnerability debt. The fact that `security.js` already runs npm audit (for
counts) but discards the per-vulnerability data is a clear gap.

---

### GAP-10: Dependabot Vulnerabilities

**What findings are produced:**
- Security vulnerability PRs (when Dependabot detects advisories requiring
  version bumps above configured minor/patch ranges)
- Dependabot creates PRs, not TDMS items

**Where findings currently land:**
- GitHub PRs — auto-merged when CI passes (for minor/patch via `auto-merge-
  dependabot.yml`), or left open for major version bumps
- No TDMS visibility into what vulnerabilities Dependabot is tracking
- When a Dependabot PR merges, `resolve-debt.yml` runs but finds no
  `Resolves: DEBT-XXXX` lines in the PR body (Dependabot doesn't add these)

**What integration would look like:**
- Option A: Add a workflow step to `auto-merge-dependabot.yml` that, for
  security-type Dependabot PRs (not just routine version bumps), calls
  `intake-manual.js` with the advisory details before auto-merging and then
  calls `resolve-item.js` after successful merge
- Option B: Use the GitHub Dependabot API to periodically sync open security
  alerts into TDMS

**Effort:** Moderate (Option A) / Significant (Option B)

**Priority:** Low-to-nice-to-have. Routine version bumps are not debt; only
security-driven Dependabot PRs merit TDMS tracking. The auto-merge path already
keeps dependencies current, which limits risk accumulation.

---

### GAP-11: ESLint Warn-Level Violations in scripts/ and .claude/hooks/

**What findings are produced:**
- All warn-level ESLint rules in `scripts/**` and `.claude/hooks/**` are
  suppressed via zero-warning overrides (`reportUnusedDisableDirectives: "off"`)
- The `--max-warnings 0` CI check passes despite any number of warn-level
  violations in these directories
- Volume estimate: unknown (suppressed, invisible by design)

**Where findings currently land:**
- Nowhere — completely suppressed
- The `known-debt-baseline.json` tracks complexity violations (a subset) but not
  the broader warn-level ESLint category

**What integration would look like:**
- Option A: Run ESLint separately on scripts/ and .claude/hooks/ with warnings
  NOT suppressed, capture the output, ingest via `intake-manual.js` batch calls
- Option B: Restore warn-level visibility in these directories (removing the
  override) and track violations in TDMS via extract-scattered-debt.js patterns
- The core issue is that the override was intentional — to allow the production
  CI `--max-warnings 0` check to pass despite known issues in tooling code

**Effort:** Significant (if addressing the underlying design decision) / Moderate
(if building a parallel ESLint-for-tooling-code scan job)

**Priority:** Low. The suppression is a deliberate architectural choice.
Restoring visibility requires policy change, not just tooling.

---

### GAP-12: CodeRabbit, Qodo, Gemini PR Comments

**What findings are produced:**
- AI code review comments on every PR: CodeRabbit, Qodo, and Gemini Code Assist
- Format: GitHub PR comments in markdown (not machine-readable JSONL)
- Volume estimate: 5-40 comment threads per PR across all three tools

**Where findings currently land:**
- GitHub PR comments only
- They enter TDMS ONLY when a user manually invokes `/pr-review`, pastes in the
  AI review feedback, and then defers specific items via `/add-debt`
- The `.claude/hooks/backup/coderabbit-review.js` hook is inactive (in backup/)
- Qodo has 21 false-positive suppression rules in `.qodo/pr-agent.toml` —
  accumulated learning that the AI tools flag issues that aren't real

**What integration would look like:**
- These tools produce markdown-formatted text comments — there is no structured
  API for bulk intake
- The pr-review skill is the correct integration point: it is already designed to
  process CodeRabbit/Qodo/Gemini output when the user pastes it in
- A more automated path would require scraping GitHub PR comments via the GitHub
  API and parsing markdown — fragile and low-value
- **The current design (manual paste into /pr-review) is appropriate** given the
  false-positive suppression rules already accumulated

**Effort:** Significant (if building API integration) / Low (if formalizing the
existing /pr-review paste workflow)

**Priority:** Low for automation. The manual /pr-review path is intentional and
appropriate. The gap here is volume: low-priority findings from these tools that
don't make it through the manual review process are lost, which is acceptable.

---

## Part 2: Partially Connected Paths (Leaky Pipes)

These sources have SOME path to TDMS but findings regularly fall through gaps.

---

### GAP-13: Ecosystem Audits — "Fix Now" Findings Invisible to TDMS

**What findings are produced:**
- All 8 ecosystem audits + data-effectiveness-audit present findings in
  interactive walkthrough mode
- Three dispositions exist: Fix Now, Defer, Skip
- Only "Defer" creates a TDMS entry (via `/add-debt`)
- "Fix Now" findings are silently resolved with no TDMS audit trail

**Where findings currently land:**
- Fixed findings: the fix was applied but there is no MASTER_DEBT record
  that (a) the issue existed, (b) it was fixed, and (c) when
- The category `engineering-productivity` is hardcoded for ALL deferred items
  regardless of finding domain — hook latency findings, JSONL sync issues,
  and dead skills all land in the same category, distorting TDMS category
  distribution

**What integration would look like:**
- Option A (minimal): After "Fix Now", still create a TDMS entry with
  `status: RESOLVED` and `resolution.type: "immediate-fix"` so fixed items
  have an audit trail
- Option B: Allow ecosystem audits to write JSONL output files (like single-
  session audits) so `extract-reviews.js` can pick them up during consolidation
- The FINDING_WALKTHROUGH.md shared template could be updated to add a
  post-walkthrough step that writes all findings (not just deferred) to a
  JSONL file
- Also: the hardcoded `engineering-productivity` category assignment should
  be made dynamic — hook audits should map to `process`, JSONL sync issues to
  `code-quality`, etc.

**Effort:** Moderate — shared FINDING_WALKTHROUGH.md template update +
JSONL output format addition

**Priority:** Must-have for audit trail completeness. The 13% resolution rate
data is misleading if a large portion of fixes are "Fix Now" choices that never
appear as resolved items in TDMS.

---

### GAP-14: pr-retro Skill — Actively Discourages TDMS Routing

**What findings are produced:**
- Retrospective insights from PR review patterns: what went wrong, what can be
  improved
- Two types: immediate implementation items (most common) and systemic issues
  (less common)
- The REFERENCE.md explicitly states: "DEBT is NOT an option unless the user
  explicitly requests it. Do not offer 'defer to DEBT' as a choice."

**Where findings currently land:**
- Immediate items → SESSION_CONTEXT.md or ROADMAP.md (not TDMS)
- Systemic items → TDMS only if user explicitly says "defer", "create DEBT",
  or "add to TDMS"
- The anti-TDMS stance is a deliberate design choice, not an oversight

**What integration would look like:**
- The design intent is correct for immediate action items
- The gap is "systemic issues" that never get flagged as debt because the user
  doesn't know to explicitly request it
- A targeted fix: add a step at pr-retro closure that presents a summary of
  any findings classified as "Systemic" and asks "Should any of these become
  DEBT items?" — without making it the default path
- This preserves the "implementation over filing" philosophy while closing the
  systemic-gap

**Effort:** Trivial — SKILL.md addition of a single optional step at closure

**Priority:** Nice-to-have. The design philosophy is reasonable. The risk is
that systemic process problems never accumulate to visibility in TDMS, but
pr-retro's intent is to prevent TDMS from becoming a graveyard for action items
that could be fixed immediately.

---

### GAP-15: alerts Skill — "Defer" Is Suggestion, Not Enforcement

**What findings are produced:**
- Debt-related alerts from three checkers: debt-metrics, debt-intake,
  debt-resolution
- Plus pending-refinements checker (items surfaced 3+ times auto-escalate to
  "S1 DEBT candidate")
- Format: alert objects with severity, message, context
- When a user chooses "Defer" for an alert, the REFERENCE.md says
  "Log, suggest /add-debt" — but this is SUGGESTED, not enforced

**Where findings currently land:**
- Deferred alerts: session carry-forward notes only; `/add-debt` is suggested
  but not invoked
- The pending-refinements path is the strongest: items surfaced 3+ times get
  an explicit "Create S1 DEBT item via /add-debt" instruction — but still
  requires user action

**What integration would look like:**
- Change "suggest /add-debt" to "invoke /add-debt" for the Defer path in
  Phase 5 of the alerts skill
- For pending-refinements items that have already been surfaced 3+ times and
  hit the escalation threshold, make the TDMS creation mandatory (not optional)
- The MUST language from ecosystem audit CRITICAL_RULES.md Rule 7 should be
  adapted here: "For items escalated to S1 DEBT candidate status, create TDMS
  entry via /add-debt (MUST)"

**Effort:** Trivial — SKILL.md + REFERENCE.md update only

**Priority:** Must-have for the debt-runner expansion dashboard. The pending-
refinements escalation path is particularly important — items that recur across
sessions without resolution are definitionally systemic debt.

---

### GAP-16: session-end Skill — Consolidation Without New Intake

**What findings are produced:**
- session-end runs `consolidate-all.js` (step 7d) and `generate-metrics.js`
  (step 7e) on every session end
- `consolidate-all.js` processes existing JSONL files (audits, reviews) — it
  is a maintenance step, not a new-finding intake step
- Any findings discovered DURING the session (in Claude context) that were
  not written to a JSONL file or routed through `/add-debt` before session-end
  are silently lost

**Where findings currently land:**
- "Work done this session" context notes: SESSION_CONTEXT.md
- In-session code issues that weren't formally tracked: lost

**What integration would look like:**
- Option A: Add a "Debt discovered this session?" step to session-end that
  offers the user a structured intake path — similar to audit-process's per-
  stage intake
- Option B: session-end already runs `consolidate-all.js` — if code-reviewer
  is updated to write JSONL files (GAP-01, Option B), those files would be
  automatically picked up here
- The minimal fix is Option A: a single "Any debt to log before we end the
  session?" prompt with `/add-debt` as the path

**Effort:** Trivial — SKILL.md addition only

**Priority:** Nice-to-have. The /add-debt skill is available throughout the
session; the gap is behavioral (reminder), not technical.

---

### GAP-17: pre-commit-fixer — Defer to known-debt-baseline.json vs TDMS

**What findings are produced:**
- Pre-existing pattern violations, complexity violations
- The skill offers three explicit choices:
  (a) Fix now
  (b) Defer to `known-debt-baseline.json` (shadow store)
  (c) Skip with SKIP_REASON (override log)

**Where findings currently land:**
- Option b: `known-debt-baseline.json` — a shadow store with no DEBT-XXXX IDs,
  no severity, no roadmap_ref, no status. Items tracked here are COMPLETELY
  INVISIBLE to TDMS even though they represent acknowledged technical debt
- Option c: `override-log.jsonl` — also invisible to TDMS
- Option a (fix now): properly resolved, no TDMS record needed

**What integration would look like:**
- The `known-debt-baseline.json` file has a clear schema: filename → threshold
  (for complexity violations). A new script `scripts/debt/sync-baseline-debt.js`
  could:
  1. Read `known-debt-baseline.json`
  2. Cross-reference each file with MASTER_DEBT to find matching complexity items
  3. For items without a matching MASTER_DEBT entry, create a DEBT item via
     `intake-manual.js`
- The pre-commit-fixer SKILL.md "defer to baseline" option could be changed to:
  "defer to baseline AND create DEBT entry" in a single operation

**Effort:** Moderate — new sync script + SKILL.md update

**Priority:** Must-have. The `known-debt-baseline.json` is a shadow TDMS with
45+ file entries that are completely invisible to the dashboard. This represents
confirmed, acknowledged debt that should appear in MASTER_DEBT. The baseline
currently has 29 cognitive-complexity violations (ranging up to 189) and 16
cyclomatic-complexity violations that have no DEBT-XXXX IDs.

---

### GAP-18: Hook Warnings — hook-warnings.json Not Monitored for TDMS Escalation

**What findings are produced:**
- Pre-commit and pre-push hooks log advisory warnings to
  `.claude/hooks/hook-warnings.json` via `append-hook-warning.js`
- Categories: pattern compliance (advisory), propagation warnings, skill
  validation warnings, cross-doc deps warnings, doc headers, cognitive
  complexity (CC), cyclomatic CC, trigger checks
- Volume estimate: multiple warnings per commit session
- CLAUDE.md guardrail #13 instructs the AI to present hook warnings after
  each commit, but this is behavioral (not automated)

**Where findings currently land:**
- `hook-warnings.json` — ephemeral per-session log
- `hook-warnings-log.jsonl` (persistent, append-only)
- The `/alerts` skill's D5 statusline widget shows unacked warning COUNT but
  not warning content
- No automated TDMS intake from either file

**What integration would look like:**
- Option A: Add a hook warning → TDMS escalation rule to `/alerts`:
  "Warnings that recur >= 3 sessions without acknowledgment are S2 DEBT
  candidates; create DEBT item via /add-debt"
- Option B: `run-alerts.js` already has a `checkDeferredItemsStaleness()`
  function — add a parallel `checkHookWarningRecurrence()` that reads
  `hook-warnings-log.jsonl` and flags recurrent warnings for TDMS intake
- The pattern already exists in pending-refinements escalation (surfaced 3+
  times → S1 DEBT candidate)

**Effort:** Moderate — new checker function in `run-alerts.js` + SKILL.md update

**Priority:** Must-have. Hook warnings that recur across sessions are
definitionally systemic debt. The infrastructure to detect recurrence (the
log file) already exists; only the intake trigger is missing.

---

### GAP-19: system-test Skill — "Skip Sync" Option Loses Findings

**What findings are produced:**
- 23-domain interactive system test produces JSONL findings files per domain
- Domain 20 has a dedicated TDMS Sync phase: Preview count → deduplicate →
  user chooses Sync all / Preview diff / S0+S1 only / Skip sync

**Where findings currently land:**
- When user chooses "Skip sync": ALL findings remain in per-domain JSONL files
  only, never reaching MASTER_DEBT
- The "Preview diff first" and "S0+S1 only" options are partial — some findings
  reach TDMS, others don't

**What integration would look like:**
- The skip option is intentional and should remain (some test runs are
  exploratory; not every finding warrants TDMS)
- The gap is the lack of a default: findings from a completed system-test
  should have a "default sync after 48h unless explicitly dismissed" mechanism
- Alternatively: change the "Skip sync" framing to "Remind me next session"
  and store skipped findings in a session-carry-forward file for the next
  session's `/alerts` to surface

**Effort:** Moderate — workflow change + carry-forward file mechanism

**Priority:** Nice-to-have. The skip option has legitimate uses. The risk is
low-frequency (system-test is not run every session).

---

## Part 3: Dark Debt — Findings Completely Invisible to TDMS

These are debt stores that exist somewhere in the codebase but have no
connection to MASTER_DEBT whatsoever.

---

### DARK-01: known-debt-baseline.json (Shadow Debt Store)

**Location:** `.claude/state/known-debt-baseline.json`
**Volume:** 29 cognitive-complexity violations + 16 cyclomatic-complexity
violations = 45+ file-level entries (ranges: CC from 16 to 189, cyc from 16 to 102)

**Why it's dark:** Items in the baseline have:
- No DEBT-XXXX IDs
- No severity, category, or roadmap_ref fields
- No status lifecycle (no NEW/VERIFIED/RESOLVED)
- No connection to `generate-views.js`, `generate-metrics.js`, or any reporting

**Remediation path:** See GAP-17. A `sync-baseline-debt.js` script would bridge
this shadow store to TDMS. This is the highest-value single "dark debt" target
because the data structure is machine-readable and the items are confirmed
pre-existing issues.

---

### DARK-02: override-log.jsonl (Skipped Check History)

**Location:** `.claude/override-log.jsonl`
**Volume:** Unknown (not inspected in prior waves)

**Why it's dark:** Every `SKIP_CHECKS=... SKIP_REASON="..."` override is logged
here. These represent acknowledged failures — the AI and user explicitly agreed
that a check was pre-existing and could be skipped. But these are not debt items:
they are skip acknowledgments. The risk is:
- Skips that were meant to be temporary (one-time workarounds) accumulate
  silently with no aging, no review, and no TDMS escalation
- The `validate-skip-reason.js` enforces reason format but not reason validity
  over time

**Remediation path:** Add an `/alerts` checker for override-log.jsonl: skips
older than 30 days that haven't been revisited should surface as S2 DEBT
candidates (similar to the pending-refinements escalation pattern).

---

### DARK-03: data/ecosystem-v2/deferred-items.jsonl (Ecosystem Deferral Queue)

**Location:** `data/ecosystem-v2/deferred-items.jsonl`
**Volume:** Monitored by alerts (`checkDeferredItemsStaleness()` triggers when
unresolved count > 20)

**Why it's partially dark:** Items here are deferred ecosystem review findings.
They become TDMS items ONLY when `escalate-deferred.js` runs (manual) AND only
after `defer_count >= 2`. A finding deferred once never automatically escalates.
The first deferral is invisible to TDMS.

**Remediation path:** Lower the escalation threshold to 1 deferral for S0/S1
findings. Add a periodic CI step or `/session-begin` check that invokes
`escalate-deferred.js --dry-run` and reports pending escalations.

---

### DARK-04: ESLint JSON Output for scripts/ and .claude/hooks/

**Location:** Not written to any file — suppressed at CI configuration level
**Volume:** Unknown (suppressed, zero current visibility)

**Why it's dark:** The zero-warning override in `eslint.config.mjs` means no
warn-level violation in scripts/ or .claude/hooks/ is ever reported. Unlike the
other dark debt stores which have a file that can be read, this dark debt doesn't
exist as data anywhere — it's pre-suppressed.

**Remediation path:** See GAP-11. This requires a policy decision to remove the
override, not just a script addition.

---

### DARK-05: GitHub Code Scanning Alerts (Semgrep + CodeQL)

**Location:** GitHub Security tab — not locally accessible without API
**Volume:** Unknown (requires API call to enumerate)

**Why it's dark:** SARIF uploads go directly to GitHub's database. No local
artifact. No script reads the GitHub Code Scanning API. These findings are
invisible to every local reporting and tracking mechanism.

**Remediation path:** See GAP-07 and GAP-08. A `sync-code-scanning.js` script
would bridge this.

---

### DARK-06: FALSE_POSITIVES.jsonl — Under-Populated (Invisible True FPs)

**Location:** `docs/technical-debt/FALSE_POSITIVES.jsonl`
**Volume:** Only 6 entries, but estimated true FP rate is ~52% based on
`reverify-resolved.js` data (32 false alarms out of 62 audited "possibly
unresolved" items)

**Why it's dark:** The system has ~2,125 NEW items in the verification queue.
Many are likely false positives (items pointing to files/lines that have been
refactored away). These never get classified as FP because:
- No automated FP detection process runs
- The keyword-proximity method in `verify-resolutions.js` has a 52% false
  positive rate on its own FP detection
- `validate-schema.js` does not run against `FALSE_POSITIVES.jsonl` by default
- The 6-item file represents manual FP classifications only

**This creates dark debt in reverse:** False positives incorrectly counted as
open S0/S1 items inflate the health metrics. The real S0 and S1 counts are
unknown.

**Remediation path:** A dedicated FP triage mode in debt-runner, or a
`detect-false-positives.js` script that runs `verify-resolutions.js --write`
periodically and routes `possibly_misclassified` items through an interactive
review loop.

---

## Part 4: Gap Matrix Summary Table

| Gap ID | Path | Type | What Findings | Current Landing | Integration Script | Effort | Priority |
|--------|------|------|---------------|-----------------|-------------------|--------|---------|
| GAP-01 | code-reviewer agent | DISCONNECTED | Code review violations, arch issues | Nowhere | Write JSONL to docs/reviews/ → extract-reviews.js | Moderate | MUST-HAVE |
| GAP-02 | gh-fix-ci | DISCONNECTED | Systemic CI failure root causes | Nowhere | SKILL.md classification step + /add-debt | Trivial | Nice-to-have |
| GAP-03 | convergence-loop | DISCONNECTED | Net-new findings during verification | CL state only | Caller responsibility (not CL itself) | Low | Low |
| GAP-04 | quick-fix | DISCONNECTED | Pattern violations | Nowhere | Deprecate; use pre-commit-fixer instead | Trivial | Low |
| GAP-05 | sonarcloud.yml CI | DISCONNECTED | Full SonarCloud analysis (all severities) | SonarCloud dashboard | Add sync-sonarcloud.js step to sonarcloud.yml | Trivial | MUST-HAVE |
| GAP-06 | pattern-compliance-audit.yml | DISCONNECTED | Pattern violations (weekly) | GitHub Issues only | Add intake-manual.js calls to workflow | Moderate | Must-have |
| GAP-07 | Semgrep (Code Scanning) | DISCONNECTED | Custom rule violations | GitHub Security tab | New sync-code-scanning.js | Significant | Nice-to-have |
| GAP-08 | CodeQL (Code Scanning) | DISCONNECTED | JS/TS security analysis | GitHub Security tab | Bundle with GAP-07 | Bundled | Nice-to-have |
| GAP-09 | npm audit | DISCONNECTED | Dependency vulnerabilities | Health metric only | New sync-npm-audit.js | Moderate | Must-have |
| GAP-10 | Dependabot | DISCONNECTED | Security update PRs | GitHub PRs only | Workflow step + intake | Moderate | Low-nice-to-have |
| GAP-11 | ESLint warn-level (scripts/) | DISCONNECTED | Warn-level violations in tooling code | Suppressed entirely | Policy decision + new CI job | Significant | Low |
| GAP-12 | CodeRabbit/Qodo/Gemini | DISCONNECTED | AI PR review comments | GitHub PR comments | Manual paste to /pr-review is correct | Trivial | Low |
| GAP-13 | Ecosystem audit "Fix Now" | PARTIAL (leaky) | Fixed issues with no audit trail | Nowhere | FINDING_WALKTHROUGH.md update; write RESOLVED items | Moderate | Must-have |
| GAP-14 | pr-retro systemic findings | PARTIAL (leaky) | Process systemic issues | SESSION_CONTEXT only | Add optional closure step to SKILL.md | Trivial | Nice-to-have |
| GAP-15 | alerts "Defer" suggestion | PARTIAL (leaky) | Alert items user defers | Suggestion only | Change suggest→enforce for escalated items | Trivial | Must-have |
| GAP-16 | session-end context findings | PARTIAL (leaky) | In-session discoveries | Lost | Add "any debt?" step to session-end | Trivial | Nice-to-have |
| GAP-17 | known-debt-baseline.json | PARTIAL (leaky) | Complexity violations (45+ entries) | Shadow store | New sync-baseline-debt.js | Moderate | Must-have |
| GAP-18 | Hook warnings recurrence | PARTIAL (leaky) | Recurring hook warnings | hook-warnings-log.jsonl | New checkHookWarningRecurrence() in run-alerts.js | Moderate | Must-have |
| GAP-19 | system-test "Skip sync" | PARTIAL (leaky) | Domain JSONL findings when skipped | Per-domain JSONL only | Carry-forward mechanism | Moderate | Nice-to-have |
| DARK-01 | known-debt-baseline.json | DARK DEBT | 45+ acknowledged complexity violations | Shadow store | sync-baseline-debt.js (see GAP-17) | Moderate | Must-have |
| DARK-02 | override-log.jsonl | DARK DEBT | Skipped checks (aging) | Override log only | /alerts aging checker | Moderate | Nice-to-have |
| DARK-03 | deferred-items.jsonl | DARK DEBT | Single-deferred ecosystem findings | Ecosystem queue | Lower escalation threshold; periodic auto-run | Trivial | Must-have |
| DARK-04 | ESLint suppressed (scripts/) | DARK DEBT | Warn-level tooling violations | Nowhere | Policy decision required | Significant | Low |
| DARK-05 | GitHub Code Scanning | DARK DEBT | Semgrep + CodeQL alerts | GitHub Security tab | sync-code-scanning.js | Significant | Nice-to-have |
| DARK-06 | FALSE_POSITIVES.jsonl | DARK DEBT | Incorrectly counted FPs | Inflated open counts | FP triage mode in debt-runner | Moderate | Must-have |

---

## Part 5: Integration Priority Tiers

### Tier 1 — MUST-HAVE for Dashboard Accuracy (High Impact, Low/Moderate Effort)

These gaps produce the most significant distortion in the current dashboard.
Fixing them changes what the dashboard shows, not just what it covers.

| Gap | Why critical |
|-----|-------------|
| GAP-05: SonarCloud CI auto-sync | Single line of CI config captures hundreds of findings automatically; script already written |
| GAP-01: code-reviewer JSONL output | Highest-volume operational source; completely invisible today |
| GAP-17 + DARK-01: known-debt-baseline.json | 45+ confirmed, acknowledged debt items with zero TDMS visibility |
| DARK-06: FALSE_POSITIVES under-populated | True S0/S1 count is unknown; dashboard inflated by FPs |
| GAP-13: Ecosystem audit "Fix Now" trail | Fixed items have no resolved audit trail; resolution rate is understated |
| GAP-15: alerts Defer enforcement | The pending-refinements escalation path is the intended behavioral circuit-breaker; it must enforce, not suggest |
| DARK-03: deferred-items.jsonl threshold | First-time deferrals are dark debt; threshold-1 escalation is trivial |

### Tier 2 — Must-have for Completeness (Moderate Effort, Significant Coverage)

| Gap | Why important |
|-----|--------------|
| GAP-09: npm audit | Security vulnerabilities are the highest-severity debt category; completely untracked |
| GAP-06: Pattern compliance → TDMS | Weekly CI already runs the scan; the GitHub Issues destination is wrong |
| GAP-18: Hook warning recurrence | Recurring warnings are systemic debt by definition; the log file already exists |

### Tier 3 — Nice-to-have (Lower ROI or Intentional Design Decisions)

| Gap | Note |
|-----|------|
| GAP-07 + GAP-08: Code Scanning sync | Significant effort; lower precision than SonarCloud |
| GAP-10: Dependabot | Routine bumps are not debt; security-only path is edge case |
| GAP-14: pr-retro systemic findings | Design philosophy is reasonable; only add optional step |
| GAP-16: session-end context | Behavioral reminder, not a technical gap |
| GAP-19: system-test skip | Low frequency; skip is intentional |
| DARK-02: override-log aging | Useful hygiene but low urgency |
| GAP-02: gh-fix-ci | Low event frequency; pre-commit-fixer covers most cases |
| GAP-12: AI PR review tools | Manual paste to /pr-review is correct by design |
| GAP-04: quick-fix deprecation | Maintenance task |
| GAP-11: ESLint warn suppression | Policy decision; not a script gap |

---

## Part 6: New Scripts Required

Scripts that would need to be created (not just SKILL.md changes):

| Script | Calls | Template | Effort |
|--------|-------|----------|--------|
| `scripts/debt/sync-baseline-debt.js` | known-debt-baseline.json → intake-manual.js | sync-sonarcloud.js pattern | Moderate |
| `scripts/debt/sync-npm-audit.js` | `npm audit --json` → appendMasterDebtSync | sync-sonarcloud.js pattern | Moderate |
| `scripts/debt/sync-code-scanning.js` | GitHub Security API → appendMasterDebtSync | sync-sonarcloud.js pattern | Significant |
| `scripts/debt/intake-pattern-violations.js` | pattern-compliance JSON → intake-manual.js | intake-audit.js pattern | Moderate |

Scripts that need modification (not new):

| Script | Change | Effort |
|--------|--------|--------|
| `.claude/skills/alerts/scripts/run-alerts.js` | Add checkHookWarningRecurrence() | Moderate |
| `.github/workflows/sonarcloud.yml` | Add sync-sonarcloud.js step | Trivial |
| `.github/workflows/pattern-compliance-audit.yml` | Replace GitHub Issues with intake-pattern-violations.js | Moderate |

---

## Contradictions

**SonarCloud CI story:** `sonarcloud.yml` runs analysis on every push but does
not call `sync-sonarcloud.js`. The gap between "we have a sync script" and "CI
does not run it" is described as needing investigation (SQ5), but the fix is
trivially a single CI step addition.

**pr-retro vs. pr-review TDMS philosophy:** pr-review treats TDMS as MUST for
all deferred items; pr-retro says TDMS is NOT an option unless explicitly
requested. These are not contradictions per se — they serve different purposes —
but they create an inconsistent user experience across the review lifecycle.

**ESLint zero-warning design:** The suppression of warn-level rules in
scripts/ is deliberate to allow `--max-warnings 0` to pass on production code.
The effect is that tooling code (which often contains the highest-complexity,
highest-CC files) has zero linting visibility. This is a tradeoff, not a bug.

---

## Gaps in This Research

1. **override-log.jsonl volume unknown:** The count of entries in
   `.claude/override-log.jsonl` was not checked in prior waves. The actual
   volume of aging skips is unknown.

2. **GitHub Code Scanning alert count unknown:** The number of open Semgrep
   and CodeQL alerts in the GitHub Security tab requires API access to enumerate.

3. **npm audit current vulnerability count:** Not run live in prior research
   waves. Current vulnerability count is unknown.

4. **Qodo/Gemini/CodeRabbit PR comment volume:** The number of unprocessed AI
   review comments that never made it through /pr-review is unknown (and
   unknowable without manual audit of PR history).

5. **hook-warnings-log.jsonl recurrence analysis:** The actual recurrence
   frequency of specific warning types was not analyzed. GAP-18 remediation
   effort is estimated as Moderate but depends on how much recurrence data
   is already in the log.

---

## Serendipity

**The escalate-deferred.js threshold is the model for systemic escalation:**
This script already implements the pattern that every "dark debt" needs —
count occurrences, escalate when threshold exceeded, invoke intake script.
The same pattern should be applied to hook-warning-log.jsonl, pending-
refinements.jsonl, and override-log.jsonl. One common escalation library
could serve all three.

**resolve-debt.yml proves CI CAN write to TDMS:** This workflow already
demonstrates that a GitHub Actions workflow can successfully call
`resolve-bulk.js` and commit changes to `docs/technical-debt/`. The same
pattern (install Node, run script, commit) applies to all the CI gaps
identified above (SonarCloud sync, npm audit sync). The architectural path
is proven.

**The pr-retro anti-TDMS stance reveals a real tension:** The skill's note
that "filing into TDMS where it gets lost is NOT a default option" is an
honest statement about the current TDMS health (13% resolution rate, F-grade
health, 7,281 open items). Until TDMS is a system where items actually get
resolved, forcing more intake may worsen the signal-to-noise ratio. The
debt-runner expansion should prioritize resolution rate improvement alongside
intake improvement — not just add more items.

**The statusline has zero debt widgets:** The Go statusline has 22 widgets
but none show S0 count, total open, or resolution rate. This is the most
visible dashboard gap — an always-on indicator that S0 items exist would be
the highest-impact UX change. A single `D6: S0 count` widget reading
`metrics.json` would take trivial effort and provide persistent visibility.

---

## Confidence Assessment

- HIGH claims: 24 (all derived from direct synthesis of SQ1-SQ7 filesystem reads)
- MEDIUM claims: 0
- LOW claims: 2 (volume estimates for GAP-07, GAP-08, GAP-10 where API access
  was not performed in prior waves)
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are derived from direct codebase inspection across SQ1-SQ7.
No training data was used. Every gap claim is anchored to specific files and
line-level evidence from prior research waves.
