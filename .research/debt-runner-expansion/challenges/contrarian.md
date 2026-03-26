# Contrarian Challenge: debt-runner Expansion Research

**Written by:** Contrarian challenge agent
**Date:** 2026-03-26
**Source documents challenged:** RESEARCH_OUTPUT.md, claims.jsonl (70 claims)

---

## Challenge 1: Are the 26 Gaps Real?

### 1a. code-reviewer TDMS disconnection (C027, C055)

**Claim being challenged:** "code-reviewer is DISCONNECTED from TDMS — produces code review violations but has no /add-debt reference. It is the largest single coverage gap — triggered on every code change, produces 5-30 findings per PR, zero path to TDMS."

**Counter-argument:** This may be intentional design, not a gap. The research itself (C028) surfaces the pr-retro philosophy: "Filing into TDMS where it gets lost is NOT a default option." Code-reviewer findings are ephemeral per-PR diagnostics. If every code-reviewer finding auto-routed to TDMS, the system would generate 5-30 NEW items per PR — roughly 5-30 x (however many PRs per month) new debt items, most of which get fixed immediately or are stylistic. TDMS already has 7,281 open items. At 10 PRs/month with 10 findings each = 100 new TDMS items/month from code-reviewer alone, almost all noise.

The research labels this "CRITICAL" but provides no evidence that code-reviewer findings are systematically being lost and becoming real debt. The question to ask is: when a code-reviewer finding is NOT fixed in the PR, where does it go? Answer: the code lands, the code-reviewer finding is in the PR comments (permanent GitHub record), and if it becomes a real pattern it surfaces through SonarCloud, audits, or future reviews. The gap may be working as designed.

**What I'd need to verify:** Is there documented evidence that code-reviewer findings are slipping through without being addressed — i.e., known regressions traceable to missed code-reviewer items? If not, the "gap" is an absence of bureaucratic paperwork, not an absence of oversight.

**Verdict: WEAKENED.** The gap is real (there is no TDMS path), but framing it as "CRITICAL" and the "largest operational gap" is overstated. The design philosophy of pr-retro (C028) suggests intentional decoupling. Adding TDMS routing to code-reviewer without filtering would flood the system. The actual need is a selective "defer to TDMS" option for users who identify persistent findings, not automatic routing.

---

### 1b. npm audit vulnerabilities should go to TDMS (C040, GAP-09)

**Claim being challenged:** "npm audit runs in security.js health checker for aggregate counts only — no per-vulnerability TDMS tracking. Severity: HIGH."

**Counter-argument:** Dependabot already handles npm vulnerabilities via auto-generated PRs (C003 in the gap table itself says "LOW — routine updates not debt"). npm audit tracks the same CVEs Dependabot tracks. Creating TDMS items for npm vulnerabilities would create a dual-tracking problem: Dependabot creates a PR to fix CVE-2025-XXXX, the user merges it, and meanwhile TDMS has a DEBT-XXXX item for CVE-2025-XXXX sitting open until someone manually resolves it. The research mentions Dependabot under gap GAP-10 as "security-driven PRs not tracked as debt" and rates it LOW. But GAP-09 (npm audit) is rated HIGH while tracking the same underlying vulnerabilities. This is internally inconsistent.

The real question is: are there npm vulnerabilities that Dependabot does NOT handle? Yes — devDependency vulnerabilities, indirect dependencies where a fix is not yet available. But those aren't actionable as DEBT items either, because there's nothing to do until a patch exists.

**What I'd need to verify:** Whether there are persistent npm audit findings (not addressed by Dependabot PRs) that would constitute real trackable debt versus transient noise.

**Verdict: WEAKENED.** Assigning "HIGH" gap severity to npm audit while assigning "LOW" to Dependabot is inconsistent — they address largely the same vulnerability set. The gap exists but the severity rating is inflated.

---

### 1c. known-debt-baseline.json as "dark debt" (C033, C058, DARK-01)

**Claim being challenged:** "known-debt-baseline.json has 45+ file entries (29 CC + 16 cyclomatic) with no DEBT-XXXX IDs — a shadow debt store completely invisible to TDMS."

**Counter-argument:** known-debt-baseline.json serves a specific and distinct purpose: it is a pre-commit suppression baseline, not a debt tracking store. The CLAUDE.md guardrail #14 explicitly uses it as option (b) for deferred pre-commit failures. The research itself (C059) notes this distinction but then calls it "BROKEN as a TDMS path." But it was never designed to BE a TDMS path. The pre-commit hook uses this file to suppress known violations so the pre-commit does not block work on pre-existing issues. Requiring DEBT-XXXX IDs for every known-debt-baseline entry would create friction for every pre-commit deferral — the user would have to /add-debt before they can even commit.

The research labels DARK-01 as a gap because these items are "invisible to TDMS." But they are visible at commit time (the hook suppresses them explicitly). They are not invisible — they are deliberately scoped to the pre-commit level.

**What I'd need to verify:** Whether the CC/cyclomatic items in known-debt-baseline.json are also already tracked in MASTER_DEBT.jsonl (they may be, as MASTER_DEBT has 2,561 SonarCloud items which would include cognitive complexity violations). If there's significant overlap, the "dark debt" claim overstates the actual invisibility.

**Verdict: WEAKENED.** The known-debt-baseline.json items are not "dark" in the sense of unknown — they are explicitly acknowledged at commit time. The gap is that they have no DEBT-XXXX IDs for cross-referencing. But calling this a "shadow debt store" overstates the problem; it is a pre-commit suppression list that happens to contain the same issues as debt.

---

### 1d. Ecosystem audit "Fix Now" leaving no TDMS audit trail (C057, GAP-13)

**Claim being challenged:** "Ecosystem audit 'Fix Now' findings create no TDMS audit trail — fixed items are silently resolved with no MASTER_DEBT record that the issue existed or was fixed."

**Counter-argument:** This is the correct design. "Fix Now" items are items fixed immediately during the audit — they never became debt because they were resolved before being deferred. Creating a TDMS item just to immediately mark it RESOLVED adds administrative overhead with no benefit. The purpose of TDMS is to track items that could not be fixed immediately. If you fix it now, it is fixed. There is no "debt" to track.

The research doesn't explain what benefit a resolved TDMS record would provide over the git commit history, which already shows what was changed.

**Verdict: OVERTURNED.** This is working as designed, not a gap. A debt system should not require creating a record for every issue that was immediately fixed. The claim that it's a gap assumes that every finding should be tracked regardless of disposition, which would make TDMS a log of all findings ever encountered, not a debt tracker.

---

## Challenge 2: Are the Bugs Verified?

### 2a. BUG-01: debt-health.js lowercase status filter (C046)

**Claim being challenged:** "debt-health.js filters avg_age with lowercase 'resolved' and 'closed' strings but MASTER_DEBT.jsonl uses uppercase 'RESOLVED' and 'FALSE_POSITIVE' — the filter never matches, causing avg_age to include all 8,470 items including resolved ones."

**Source code verification (line 65 of debt-health.js):**
```javascript
const openDebt = allDebt.filter((d) => d.status !== "resolved" && d.status !== "closed");
```

MASTER_DEBT.jsonl uses uppercase statuses (`RESOLVED`, `FALSE_POSITIVE`). The comparison is case-sensitive in JavaScript. `"RESOLVED" !== "resolved"` is `true`, meaning the filter condition passes for resolved items, meaning resolved items are INCLUDED in the openDebt array. The claim is correct.

**Is there compensating logic?** No. The file was read in full (137 lines). There is no `.toLowerCase()` call, no case-insensitive comparison, and no secondary filter. The `generate-metrics.js` script uses correct uppercase comparisons, but `debt-health.js` does not.

**Effect:** avg_age_days in ecosystem-health's Technical Debt category score includes all 8,470 items (including 1,115 resolved and 74 false positives), making the average age appear older than the true open-items age.

**Verdict: UPHELD. Bug is confirmed by direct source code read.**

---

### 2b. BUG-02: dedup-multi-pass.js missing --dry-run flag (C048)

**Claim being challenged:** "dedup-multi-pass.js has no --dry-run or --force flags despite REFERENCE.md documenting them as valid invocations — the script always runs all 6 passes and writes all output files unconditionally."

**Source code verification:** The `main()` function (line 734) calls `readInputItems()`, runs all 6 passes, then calls `writeOutputFiles()` unconditionally. There is no `process.argv` parsing anywhere in the file. The `REFERENCE.md` documents:
```bash
node scripts/debt/dedup-multi-pass.js --dry-run
node scripts/debt/dedup-multi-pass.js --force
```

These flags do not exist in the script implementation.

**Is there compensating logic?** No. The script has zero argument parsing. However, there is a significant nuance the research did not fully explore: `dedup-multi-pass.js` writes to `raw/deduped.jsonl` and `raw/review-needed.jsonl` — staging files, NOT MASTER_DEBT.jsonl. Running it without `--dry-run` writes output to staging only. The damage of "running without preview" is limited to overwriting staging files, not the canonical store. The research treats this as more dangerous than it is because the entire REFERENCE.md step 3 calls `consolidate-all.js` as a separate step, and that step has the real MASTER_DEBT write gate (via `generate-views.js --ingest`).

**Revised effect:** The missing `--dry-run` flag means the user cannot preview which items would be merged before writing to staging. It is a usability gap more than a data-safety bug, since the output is staging not canonical. However, it is still a genuine code/documentation mismatch.

**Verdict: UPHELD but severity is WEAKENED.** Bug is confirmed — flags are documented but not implemented. However, the risk is lower than implied because the script writes to staging files, not MASTER_DEBT directly.

---

### 2c. BUG-03: resolve-bulk.js does not call sync-deduped.js (C047, C053)

**Claim being challenged:** "resolve-item.js calls sync-deduped.js --apply after every single-item resolution but resolve-bulk.js does NOT call sync-deduped.js after bulk resolution — every CI-triggered resolution leaves deduped.jsonl out of sync with MASTER_DEBT."

**Source code verification:**

`resolve-item.js` (lines 203-211, 237-245): Contains two `try/catch` blocks that each call `sync-deduped.js --apply` after write operations.

`resolve-bulk.js` (lines 416-478): Calls `generate-views.js` and `reconcile-roadmap.js --write` after write, but does NOT call `sync-deduped.js`. The full file was read — no `sync-deduped` reference exists anywhere in resolve-bulk.js.

**Is there compensating logic?** The research claims consolidate-all.js can overwrite CI resolutions if run before sync-deduped.js. This is confirmed by the consolidate-all.js source: its step 5 calls `dedup-multi-pass.js` (regenerates deduped.jsonl from scratch from normalized-all.jsonl), then step 6 calls `generate-views.js --ingest` (rewrites MASTER_DEBT from deduped.jsonl). If CI resolves items in MASTER_DEBT but does not update deduped.jsonl, then the next consolidate-all.js run will overwrite those resolutions.

**Verdict: UPHELD. Bug is confirmed. This is the highest-impact confirmed bug in the set.**

---

### 2d. BUG-04: TRIAGED in ELIGIBLE_STATUSES but not in validStatuses (C049)

**Claim being challenged:** "resolve-bulk.js defines ELIGIBLE_STATUSES = ['VERIFIED', 'IN_PROGRESS', 'TRIAGED'] but audit-schema.json validStatuses does not include TRIAGED."

**Source code verification:**

`resolve-bulk.js` line 34: `const ELIGIBLE_STATUSES = ["VERIFIED", "IN_PROGRESS", "TRIAGED"];`

`audit-schema.json` line 23: `"validStatuses": ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"]`

TRIAGED is in ELIGIBLE_STATUSES but not in validStatuses. Confirmed.

**Is there compensating logic?** The contradiction is real but the research overstates the practical impact. For TRIAGED to cause a problem: (1) a user would have to manually set an item's status to TRIAGED via direct JSONL edit (no script sets this status), and (2) validate-schema.js would then flag it as invalid, but (3) resolve-bulk.js --eligible-only would accept it for CI resolution. The contradiction exists, but TRIAGED items would first be blocked by schema validation before they could be processed by resolve-bulk.js in normal workflows. The issue is theoretical drift, not a live operational hazard.

**Verdict: UPHELD but practical severity is LOW.** The code/schema contradiction is confirmed. Impact is minimal because no script creates TRIAGED items, so the scenario requires manual JSONL editing to trigger.

---

### 2e. BUG-05: consolidate-all.js can overwrite CI resolutions (C013)

**Claim being challenged:** "generate-views.js --ingest triggers a full MASTER_DEBT.jsonl overwrite from deduped.jsonl — any direct edits to MASTER_DEBT made after the last dedup run but before --ingest will be silently lost."

**Source code verification:** consolidate-all.js step sequence confirmed: extract → normalize → `dedup-multi-pass.js` (overwrites deduped.jsonl from scratch) → `generate-views.js --ingest` (overwrites MASTER_DEBT from deduped.jsonl). This is not just a theoretical hazard — the canonical memory file (reference_tdms_systems.md) explicitly documents: "MASTER_DEBT overwrite hazard." The session-end skill runs consolidate-all.js on every session end.

**Is there compensating logic?** Yes, partially. `resolve-item.js` calls `sync-deduped.js --apply` after each resolution, which propagates MASTER_DEBT changes back to deduped.jsonl. So the hazard is specifically: CI runs `resolve-bulk.js` (no sync-deduped call) → user ends session → session-end runs `consolidate-all.js` → CI resolutions are overwritten. The compensating path exists for `resolve-item.js` but not for `resolve-bulk.js` (per BUG-03 above).

**Verdict: UPHELD.** BUG-05 is real and is directly caused by BUG-03. They are the same root cause.

---

### 2f. BUG-06 / C006: resolve-bulk.js plan-scan as "undocumented side effect"

**Claim being challenged (C006):** "resolve-bulk.js automatically calls generate-views.js and reconcile-roadmap.js --write after every bulk resolution, and scans .claude/plans/*.md for references to resolved DEBT IDs — a side effect not documented in debt-runner SKILL.md."

**Source code verification:** The resolve-bulk.js plan-scan code (lines 441-478) is confirmed. SKILL.md has no mention of this behavior.

**Counter-argument on severity:** The claim frames this as a gap ("not documented"), but it is actually a POSITIVE finding — the script is doing MORE than documented, not less. The behavior is beneficial (notifying user that resolved items are still referenced in plan files). The "undocumented" aspect is a documentation gap, not a behavioral bug. Framing this as a category:bug (C006) is a classification error.

**Verdict: WEAKENED.** The undocumented behavior is confirmed but it should be classified as a documentation gap, not a bug. It is a beneficial side effect.

---

## Challenge 3: Is the Scale Right?

### 3a. Does this need to be a massive expansion?

**Claim being challenged:** The research recommends 6 new modes (intake, sources, roadmap, triage, review-needed, dark-debt), 5+ sub-menus per new mode, new scripts (sync-npm-audit.js, sync-baseline-debt.js, sync-code-scanning.js, sync-github-issues.js), and a Go statusline widget. Total scope: approximately 13 modes + sub-menus, multiple new scripts.

**Counter-argument: 80/20 analysis.** The research confirms 6 verified bugs (BUG-01 through BUG-06). Fixing those bugs alone addresses the most pressing correctness issues. The research's own priority ranking separates 8 "MUST-HAVE" gaps from 7 "NICE-TO-HAVE" and 3 "LOW/POLICY-REQUIRED." Of the 8 MUST-HAVE gaps:

- GAP-05 (SonarCloud CI auto-sync) is described as "trivial" — one CI step added to sonarcloud.yml
- GAP-15 (/alerts defer enforcement) is "trivial"
- GAP-14 (/pr-retro TDMS surfacing at closure) is "trivial"
- GAP-01 (code-reviewer) is challenged above as potentially by-design

That leaves GAP-06, GAP-09, GAP-17, GAP-18, and GAP-13 as the substantive gaps. Of these, GAP-13 (Fix Now audit trail) is challenged above as by-design. GAP-09 (npm audit) is challenged as having lower severity than rated.

A minimal debt-runner improvement could be: fix 5 confirmed bugs + add a single "refresh" command that runs sync-sonarcloud.js and shows staleness status + add a --dry-run flag to dedup-multi-pass.js. This would address 80% of the actual correctness and operational issues without building 13 modes.

**What would the complex expansion actually provide over the minimal approach?** The 6 new modes address real visibility gaps (sources, roadmap, triage, review-needed). But each represents significant design and maintenance work. The research does not quantify how often these workflows are actually needed vs. how often users interact with the current 7 modes. If the user runs health every session and verify/sync monthly, does a roadmap mode get used even quarterly?

**Verdict: WEAKENED.** The expansion scope is justified by the gap analysis, but the research does not distinguish between "gap exists" and "gap is blocking users today." A phased approach (bugs first, high-signal modes second, full dashboard later) would be more defensible than the all-at-once expansion implied by the recommendations.

---

### 3b. Would 8,470+ items overwhelm an interactive system?

**Claim being challenged:** The proposed triage mode would process the "2,125-item verification queue interactively: NEW → VERIFIED / FALSE_POSITIVE / IN_PROGRESS."

**Counter-argument:** 2,125 items in an interactive per-item flow is not interactive — it is a batch job. Even at 10 seconds per decision, 2,125 items = 354 minutes of continuous interaction. The research acknowledges the "you decide / severity filter / batch review" delegation pattern from the existing debt-runner, and the principle that S0/S1 items must be shown to the user while S2/S3 can be delegated. But even restricting to S1 items in the NEW queue: 1,259 S1 items at 10 seconds = 3.5 hours.

The research does not address this workload problem. It proposes a "quick triage" option using verify-resolutions.js (file existence check), but then immediately notes in C051 that this check is shallow — it does not verify the issue still exists in the file.

The proposed review-needed.jsonl processing mode has the same problem. The research claims dedup creates uncertain pairs for human review, but does not say how many are currently in review-needed.jsonl.

**What I'd need to verify:** The actual size of review-needed.jsonl and how many NEW items are S2/S3 (safely delegatable) vs. S0/S1 (requiring user review).

**Verdict: The research identifies the right problem (triage queue has no interactive mode) but does not propose a workload-appropriate solution. This is a gap in the recommendations, not the findings.**

---

### 3c. Deeply nested menu system concerns

**Claim being challenged:** The research proposes sub-menus within new modes (intake sub-menu with 6 options, sources sub-menu with 5 options, roadmap sub-menu with 5 options, triage sub-menu with 4 options). Maximum depth would be 3 levels (top menu → mode → sub-option).

**Counter-argument:** The research correctly identifies that existing skills max at 3 levels (C062) and that the existing flat-menu + stats header pattern is the right foundation (C063). The proposed sub-menus ARE at level 2, not level 3, so the depth constraint is technically respected. However, the sub-menus create navigational complexity: a user would need to remember "6: dark-debt → 2: baseline-debt" to get to a specific function. The current 7-mode menu is memorizable. A 13-mode menu with sub-menus per mode is not.

The research also notes the _shared/ecosystem-audit library (C064) as the reference pattern for per-item triage. But that library was designed for sequential domain review (you go through all domains, not pick one). Applying it to a menu system changes the interaction model.

**Verdict: WEAKENED.** The sub-menu structure is technically sound but the usability concerns are not addressed in the research. The recommendation to "anchor to _shared/ecosystem-audit for per-item triage flows" conflates two different UX patterns (sequential review vs. menu navigation).

---

## Challenge 4: Missing Risks

### 4a. Full debt refresh — what could go wrong?

**Claim being challenged (Section 7.5):** The proposed "full refresh" mode orchestrates the complete intake-to-report pipeline, with "user confirmation gate before step 4 (destructive: rewrites MASTER_DEBT via --ingest)."

**Risks not addressed in the research:**

1. **Duplicate explosion from re-extraction.** `extract-audits.js` and `extract-reviews.js` extract from existing JSONL audit reports. If audit reports accumulate over time (they do — audit-agent-quality creates new ones each session), re-running extract-audits.js will find items that were already in MASTER_DEBT from a previous run. The dedup step is supposed to handle this, but dedup relies on `content_hash` matching. If hashes drift (different normalization, schema changes), re-extraction creates duplicates. The research's own data shows 2,942 audit-sourced items and 623 review-sourced items — these were already deduplicated once. A "full refresh" re-runs extraction from scratch.

2. **O(n²) dedup performance at 8,470+ items.** The research mentions this as a ROADMAP concern (DEBT-7593 SQLite migration) but does not flag it as a risk for the proposed full refresh. dedup-multi-pass.js runs pairwise comparison passes (O(n²)). At 8,470+ items, each O(n²) pass could be expensive. The research does not provide actual runtime data.

3. **What if sync-sonarcloud.js returns 0 items?** The script paginates up to 10,000 items (C037). If the SonarCloud project has more than 10,000 issues, the refresh silently truncates. This is acknowledged in C037 but not flagged as a risk in the full refresh proposal.

4. **Session-end already runs consolidate-all.js.** If the user does a full refresh mid-session and then session-end also runs consolidate-all.js, that is two full pipeline runs per session. Combined with the sync-deduped.js gap (BUG-03), each pipeline run is a potential overwrite hazard.

**Verdict: The research is incomplete here. The full refresh proposal needs these risk mitigations documented before implementation.**

---

### 4b. Performance with 8,470+ items in JSONL

**Claim being challenged:** The research identifies DEBT-7593 (SQLite migration) in the ROADMAP but does not recommend it as a prerequisite for the expansion.

**Counter-argument:** Adding more intake sources (npm audit, GitHub Code Scanning, known-debt-baseline.json items) would grow MASTER_DEBT beyond 8,470 items. The research estimates no additional item count, but if SonarCloud auto-sync runs on every push and GitHub Code Scanning items are synced, the item count could grow significantly. The research's own note on dedup complexity (O(n²)) is in a limitations section, not a risks section.

The ROADMAP says SQLite migration is "S1, P0" research-priority, meaning it is flagged as high-value pending investigation. The research recommends expanding TDMS's intake surface without noting that doing so before the SQLite migration would make the eventual migration harder (more items, more scripts to migrate, more data to preserve).

**What I'd need to verify:** Current runtime of dedup-multi-pass.js on 8,470 items. If it takes 30+ seconds, the full refresh is impractical. If it takes under 5 seconds, it is not a blocking concern.

**Verdict: WEAKENED.** The research does not address the SQLite-before-expansion question. This is a real architectural risk: expanding intake before solving the storage architecture creates technical debt about the technical debt system.

---

## Challenge 5: Contradictions in the Findings

### 5a. Contradiction 1: sync-deduped.js asymmetry

**Research's claimed contradiction:** "resolve-item.js calls sync-deduped.js but resolve-bulk.js does not — asymmetric behavior for same logical operation."

**Is this a real contradiction?** Yes. Both scripts are confirmed in source. This is a genuine inconsistency. The comment in resolve-item.js even references the Session #179 overwrite regression as the reason for the sync call: "Sync deduped.jsonl to prevent generate-views.js overwrite regression (Session #179)." resolve-bulk.js was apparently updated for other reasons (it calls generate-views.js and reconcile-roadmap.js) but the sync-deduped.js call was not added. This is a genuine bug that the research correctly identifies.

**Verdict: REAL CONTRADICTION, correctly identified.**

---

### 5b. Contradiction 2: pr-retro anti-TDMS vs. other skills pro-TDMS

**Research's claimed contradiction:** "/pr-retro actively discourages TDMS routing while ecosystem audits mandate it — same user action word 'defer,' radically different enforcement levels."

**Is this a real contradiction?** The pr-retro philosophy is explicitly documented (C028): "DEBT is NOT an option unless the user explicitly requests it." The ecosystem-audit CRITICAL_RULES mandate MUST via /add-debt. These are genuinely different policies for the same user intent ("I'm not fixing this now").

**Counter-argument on framing:** This is not a contradiction — it is a deliberate domain distinction. pr-retro is specifically designed to avoid TDMS noise from retro sessions ("systemic findings only, when user explicitly says defer"). Ecosystem audits are specifically designed to route findings to TDMS because that's their whole purpose. The same word "defer" in different skill contexts should carry different behavior. The research frames this as a contradiction when it is actually specialization.

**However:** The research's specific claim in C061 is narrower — that the word "defer" means different things in different contexts without explanation to the user. This is a UX inconsistency even if the underlying design intent is sound.

**Verdict: REAL but OVERSTATED as a contradiction. The policies are different by design but the user-facing language is inconsistent.**

---

### 5c. Contradiction 3: benchmark calibration vs. project scale

**Research's claimed gap (C044):** "debt-health.js benchmarks are wildly miscalibrated (good=10 open items when project has 7,281)."

**Counter-argument:** This is not a contradiction — it is a design choice about what the benchmarks represent. The benchmarks could be aspirational targets ("what would good look like?") rather than empirical norms for this project. A project with 7,281 open items should score poorly on "total_open" — that is a real signal. The question is whether the score should be 0/100 (as it currently is with 7,281 vs. benchmark of 10) or whether it should be normalized to the project's historical trajectory.

The research does not distinguish between "the benchmark is wrong" and "the benchmark is right and we're just very far from it." The 21/100 F-grade is accurate if the benchmark reflects what a healthy project looks like. If the benchmark is calibrated to much smaller projects, it gives a misleading severity signal.

**Verdict: REAL gap, but the framing "wildly miscalibrated" is an interpretation that needs verification. The fix might be adding context normalization rather than changing the benchmarks.**

---

### 5d. Contradiction 4: resolution log (14 entries vs. 1,115 resolved)

**Research's claimed gap (C054):** "Resolution log has only 14 entries despite 1,115 resolved items — most resolutions bypass the log entirely."

**Counter-argument:** The research asserts this as a gap but does not verify WHEN `resolution-log.jsonl` was introduced relative to when the 1,115 resolutions happened. If the resolution log was added recently (e.g., Session #179 based on the comments in resolve-item.js referencing that session), then the 14 entries represent only resolutions since the log was added — not a bypass, just a historical gap before the log existed.

`resolve-bulk.js` does call `logResolution()` (lines 392-397), so new bulk resolutions are being logged. The 14 entries may be an accurate count of resolutions since the log was implemented.

**What I'd need to verify:** The creation date of resolution-log.jsonl and the first entry's timestamp, compared to the timestamps on RESOLVED items in MASTER_DEBT.

**Verdict: WEAKENED. The claim that "most resolutions bypass the log" may be historically accurate but operationally misleading if the log is new. The actual gap (if any) may be that the log wasn't introduced earlier, not that current resolutions are being lost.**

---

## Summary: Verdict Table

| Challenge | Claim | Verdict | Key Finding |
|-----------|-------|---------|-------------|
| 1a | code-reviewer "CRITICAL" gap | WEAKENED | May be intentional design; TDMS auto-routing would create noise |
| 1b | npm audit gap rated HIGH | WEAKENED | Inconsistent with Dependabot rated LOW; same vulnerability set |
| 1c | known-debt-baseline.json as "dark debt" | WEAKENED | It's a pre-commit suppression list, not a hidden debt store |
| 1d | Fix Now findings need TDMS record | OVERTURNED | Immediately fixed issues should not create TDMS entries |
| 2a | BUG-01: lowercase status filter | UPHELD | Confirmed in source; genuine bug |
| 2b | BUG-02: missing --dry-run flag | UPHELD, severity WEAKENED | Confirmed; but writes to staging, not MASTER_DEBT |
| 2c | BUG-03: resolve-bulk.js missing sync-deduped | UPHELD | Confirmed; highest-impact bug |
| 2d | BUG-04: TRIAGED schema contradiction | UPHELD, severity LOW | Confirmed; theoretical hazard only |
| 2e | BUG-05: consolidate-all.js overwrite | UPHELD | Confirmed; same root cause as BUG-03 |
| 2f | C006: plan-scan "bug" | WEAKENED | Should be classified documentation gap, not bug |
| 3a | Expansion needs 13 modes + new scripts | WEAKENED | Bugs + 2-3 new modes achieves 80% of value |
| 3b | Interactive triage of 2,125 items | NOT ADDRESSED in research | Workload math is missing from recommendations |
| 3c | Sub-menu navigation complexity | WEAKENED | Usability concerns not addressed in research |
| 4a | Full refresh risks (duplicates, O(n²), truncation) | MISSING from research | Real risks not documented |
| 4b | SQLite migration before expansion | WEAKENED | Research does not address architectural sequencing |
| 5a | sync-deduped asymmetry | REAL | Genuine bug correctly identified |
| 5b | pr-retro vs. ecosystem audit defer enforcement | REAL but OVERSTATED | Design distinction, not contradiction; UX inconsistency is real |
| 5c | Benchmark miscalibration | REAL, interpretation uncertain | Gap exists; "wildly miscalibrated" is an overreach |
| 5d | Resolution log bypass | WEAKENED | Log may be newly introduced; historical gap not operational gap |

---

## Overall Assessment

**The research is high-quality and well-grounded** — all major claims are based on direct source reads, not inference. The confirmed bugs (BUG-01, BUG-03, BUG-04, and the related BUG-05) are real and should be fixed regardless of expansion decisions.

**Where the research is weakest:**
1. It does not distinguish between "gap exists" and "gap is causing active harm." Most gaps are structural absences, not operational failures.
2. The recommended scale of expansion (13 modes, multiple new scripts) is not proportionate to the confirmed harm. The bugs are the real problem; the expansion is speculative benefit.
3. The 2,125-item triage queue problem has no workload-appropriate solution proposed.
4. The SQLite migration (DEBT-7593) is flagged as S1/P0 in the ROADMAP but not addressed as a prerequisite question for expansion. Building more intake pipelines before solving the storage architecture is the wrong sequencing.

**Recommended minimum viable response to this research:**
1. Fix BUG-01 (one-line case fix in debt-health.js)
2. Fix BUG-03 (add sync-deduped.js call to resolve-bulk.js)
3. Fix BUG-04 (remove TRIAGED from ELIGIBLE_STATUSES or add to schema)
4. Add --dry-run flag to dedup-multi-pass.js (BUG-02)
5. Add one-line note to unplaced-items.md or remove it (BUG-05 / C042)
6. Add SonarCloud CI auto-sync step (GAP-05, trivial)

The remaining 20 gaps are real but not urgent. They should be addressed in a roadmap discussion, not a single expansion sprint.
