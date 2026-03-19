---
name: pr-retro
description: >-
  PR Review Retrospective -- actionable analysis of a PR's review cycle with
  convergence-loop deliverable verification, interactive findings walkthrough,
  and dashboard for missing retros
---

<!-- prettier-ignore-start -->
**Document Version:** 4.8
**Last Updated:** 2026-03-18
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# PR Review Retrospective

Analyze the review cycle for completed PRs via interactive finding-by-finding
walkthrough.

**Invocation:** `/pr-retro` (dashboard) | `/pr-retro <PR#>` (single) |
`/pr-retro <PR#> --resume` (resume from state)

**Routing:** "Review code" -- `/code-reviewer` | "Process feedback" --
`/pr-review` | "Process health" -- `/pr-ecosystem-audit` | "What went
well/wrong" -- `/pr-retro`

**When to use:** User invokes `/pr-retro` AND PR is merged. **When NOT:** Active
review -- `/pr-review` | Code quality -- `/code-reviewer` | Ecosystem audit --
`/pr-ecosystem-audit`

---

## CRITICAL RULES (MUST follow)

1. **MUST produce the FULL retro** -- every mandatory section, every round.
2. **MUST present findings interactively** -- one at a time with options.
3. **MUST save state after every finding decision** -- compaction resilience.
4. **MUST include a verify command** for every accepted action item.
5. **MUST run final verification** before saving -- verify commands, sections.
6. **MUST display closure summary** listing all artifacts produced.
7. Every observation MUST have a recommended action with estimated effort.
8. Cross-PR systemic analysis is MUST for every retro.
9. Follow CLAUDE.md Section 5 anti-patterns and Section 6 coding standards.
10. **MUST implement accepted action items** -- retro is blocked until every
    item is done or user explicitly says "defer" or "create DEBT". No implicit
    deferral.

---

## STEP 0: DETECT MODE

- No PR# -- **Dashboard Mode** (below). PR# -- **Step 1**. `--resume` -- read
  state file, skip to current finding.

**Done when:** Mode determined and routing complete.

---

## DASHBOARD MODE: Missing Retros

**D1.** Get merged PRs:

```bash
gh pr list --state merged --limit 100 --json number,title,mergedAt,author
```

**D2.** Search `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`,
`.claude/state/retros.jsonl` for existing retros. **D3.** Skip: PR# < 395, zero
review entries, bot PRs (`[bot]`, `chore(deps)`, `build(deps)`, `Bump `).
**D4.** Count review rounds per missing PR. **D5.** Display table: PR# | Title |
Merged | Author | Rounds. Include action item summary from retros.jsonl. **D6.**
"Which PRs to retro? [numbers / all / none]" If multiple, see REFERENCE.md:
Batch Retro Scope.

For each selected PR, proceed to Step 1 (deliverable verification), then Step 2.
**Dashboard ends here -- do NOT continue without selection.**

---

## STEP 1: DELIVERABLE VERIFICATION (MUST for PRs with 3+ commits or files)

> Before analyzing the review cycle, verifying that PR deliverables were
> actually completed. This catches "phantom completions."

**Skip:** <3 commits AND <3 files changed -- note skip, proceed to Step 2.
**Batch warning:** >3 PRs selected: warn about sequential CL cost. User decides:
[continue / skip verification / select fewer]. **Claim warning:** >10 claims:
warn about token cost. [all / trim to 10 / skip].

### 1.1 Extract Claims (MUST)

Pull intent from PR body, commits, referenced PLAN.md, SESSION_CONTEXT.md,
ROADMAP.md. Format: `"<deliverable> -- source: <where>"`. If <3 claims, skip to
Step 2. Then ask: "Are there deliverables the verification missed?"

> See REFERENCE.md Section: Claim Extraction Sources for full source list.

### 1.2 Run Convergence Loop (MUST)

Standard preset. Agent prompt: "Start from files changed in the PR, follow
references outward. Flag missing imports, dead code paths, untested functions,
unwired config, missing files."

### 1.3 Process Results (MUST)

Present before injecting into walkthrough: "CL generated N findings. Review
before walkthrough? [Y / accept all / modify]"

**Contradiction protocol:** CL says "unverified" but review data shows reviewed
-- present both sources, flag "Conflicting evidence," user decides severity.

```
PR #NNN Deliverable Verification:
  Claims: N | T20: Confirmed: A | Corrected: B | Extended: C | New: D
  CL confidence: HIGH/MEDIUM/LOW | Auto-findings: X (K CRIT, J HIGH)
Proceed to review data gathering? [Y/n]
```

> See REFERENCE.md Section: CL Result Processing for severity mapping.

Save state. Warn if unverified > 0.

**Done when:** Summary presented, state saved, user confirms proceed.

--- Deliverable verification complete. Proceeding to review data gathering. ---

---

## STEP 2: GATHER REVIEW DATA (MUST)

**2.1** Search `docs/AI_REVIEW_LEARNINGS_LOG.md`, `docs/archive/REVIEWS_*.md`,
`.claude/state/reviews.jsonl`. Read EVERY entry. Check CLAUDE.md Section 5+6.

**2.2** Per round: number, date, source, items by severity, fixed/deferred/
rejected, pattern categories, files modified, new issues from prior fixes.

**2.3** (SHOULD) Git history + TDMS:

```bash
git log --oneline --grep="PR #${PR_NUM}" --grep="R[0-9]" --all-match
grep "pr-review" docs/technical-debt/MASTER_DEBT.jsonl | grep "${PR_NUM}"
```

**2.4** (SHOULD) Enrich with review-metrics and hook-health data (see
REFERENCE.md Section: Data Enrichment).

**2.5** (MUST) Previous retros + pattern recurrence map from `retros.jsonl`:

- Run stored `verify_cmd` on last 3-5 retros' action items. Flag unimplemented.
- If `retros.jsonl` doesn't exist, skip and note "No prior retro data."
- Build recurrence map from ALL retros. Recurrence >= 3: run quick CL (2-pass)
  to verify pattern still exists, then auto-tag CRITICAL.
- Verify commands MUST be real shell commands, not keyword greps.

**2.6** "Data gathered: N rounds from M sources. X total items found."

**Done when:** All data collected and intermediate summary presented.

---

## STEP 3: ANALYZE CHURN + WARM-UP (MUST)

1. **Ping-pong** -- same file in consecutive rounds? Fix-creates-issue chains.
2. **Scope creep** -- items in non-PR files?
3. **Recurring patterns** -- 3+ rounds = automation candidate. Use recurrence
   map from Step 2.5. Count >= 3 = CRITICAL this session.
4. **Rejection analysis** -- group by reason, false-positive rate by source.
5. **Hook health** -- correlate failures/overrides with round counts.

Run quick CL (2-pass) to verify top findings before walkthrough.

```
PR #NNN Retro: Ready
Rounds: N | Items: N | Patterns: N
Prior action items: N checked (M verified, K failed)
Estimated findings: ~N | Scope: [short/medium/long]
Proceed? [Y/n]
```

Save state. User declines -- exit gracefully.

**Done when:** Analysis complete, warm-up presented, user confirms.

---

## STEP 4: INTERACTIVE FINDINGS WALKTHROUGH (MUST)

> MUST present every finding (Critical Rule #2). See REFERENCE.md: Finding
> Presentation Template.

**Per finding:** Present one at a time. Mark evidence `[Observed]`/`[Inferred]`.
Include verify command + `Integration:` field. Collect decision. Show progress
`[N/M | K items]`. **Save state after each** -- non-negotiable.

**Batching (>15):** Group Low into summary batch. High/Medium: individual.

**Delegation:** User says "you decide on Low" -- accept all Low, present Medium+
individually. Record as `delegated-accept`.

**After all:** "Anything the analysis didn't surface?" Add user findings.

**Done when:** All findings walked, user additions collected, state saved.

---

## STEP 5: VALIDATE COMPLETENESS (MUST)

Compile full retro markdown, display for review. Verify all 10 mandatory
sections: Review Cycle Summary, Per-Round Breakdown, Ping-Pong Chains, Rejection
Analysis, Recurring Patterns, Previous Retro Audit, Cross-PR Systemic Analysis,
Skills/Templates to Update, Process Improvements, Verdict. Flag gaps, generate
stubs.

**Done when:** All sections covered or gaps resolved.

---

## STEP 6: ACTION ITEM IMPLEMENTATION (MUST -- BLOCKING)

> MUST implement -- no implicit deferral (Critical Rule #10). Hard gate.

**6.1 Approval Gate:** Present batch table (# | Action | Severity | Category |
Effort | Verify Command). User: accept all, modify, reject individual.

**6.2 Implement:** Every approved item this session. After each, run verify:
`[DONE]` or `[BLOCKED]` (explain, ask user).

**Verify command quality (MUST):** Verify commands MUST be functional tests that
run the feature and confirm output, not grep-based string checks. A verify
command that only checks if a string exists in a file is NOT sufficient -- it
must execute the feature and validate behavior. Good verify commands exit 0 on
success and exit 1 on failure.

**Examples -- good vs bad verify commands:**

```
BAD:  grep -c "source_pr" scripts/debt/intake-pr-deferred.js
      (only proves a string exists, not that the feature works)

GOOD: node scripts/debt/intake-pr-deferred.js --pr 999 --file test.js \
        --title "test" --severity S2 --dry-run 2>&1 | grep -q "source_pr"
      (runs the actual feature and validates output)

BAD:  grep -c "watchlist" .claude/config/high-churn-watchlist.json
      (only proves the file contains a word)

GOOD: node -e "const w=JSON.parse(require('fs').readFileSync(
        '.claude/config/high-churn-watchlist.json','utf8'));
        process.exit(w.files.length>=3 && w.refactor_candidates.length>=3?0:1)"
      (parses the JSON, validates structure, exits with meaningful code)
```

> See REFERENCE.md Section: Implementation Detail for DEBT/TDMS rules, repeat
> offender protocol, state tracking, checklist template.

**Gate check:** ANY item not `[DONE]` or resolved -- do NOT proceed.

**Done when:** All items resolved, checklist presented.

---

## STEP 7: FINAL VERIFICATION (MUST)

> See REFERENCE.md Section: Verification Stage Criteria.

1. **Process compliance** -- interactive presentation, state logging, real
   verify commands?
2. **Section completeness** -- all 9 mandatory sections?
3. **Action items** -- run verify commands. `[NOT IMPLEMENTED]` -- return
   Step 6.
4. **Data integrity** -- JSONL parseable, markdown appended, sync OK?
5. **Cross-PR** (batch) -- individual records, no duplicates?

Present report. Resolve failures interactively.

**Done when:** PASS or all failures resolved.

---

## STEP 8: SAVE TO LOG (MUST)

**8.1** Build: `cd scripts/reviews && npx tsc 2>&1 | tail -5` (fail -- manual
JSONL fallback). **8.2** Write JSONL (source of truth). See REFERENCE.md: JSONL
Record Schemas. Include `process_feedback` from Step 9. **8.3** Append markdown
to `docs/AI_REVIEW_LEARNINGS_LOG.md`. **8.4** Sync:

```bash
npm run reviews:sync -- --apply
node dist/write-invocation.js --data '...'
```

**Done when:** JSONL written, markdown appended, sync succeeded.

---

## STEP 9: SUPPRESSIONS + LEARNING + CLOSURE (MUST)

**Suppressions** (SHOULD): Items rejected 2+ times -- add to
`.gemini/styleguide.md` "Do NOT Flag" + mirror `.qodo/pr-agent.toml`. Skip if no
rejections.

**Learning:** Auto-generate 2-3 insights, save to `learnings` JSONL. Ask "Any
observations?" Save to `process_feedback`. On next startup: surface prior
learnings.

**Cross-skill:** If action items modified pre-push checks: update `/pr-review`.
If hook abuse found: run `/alerts`. See REFERENCE.md: Cross-Skill Integration.

```
PR #NNN Retro Complete
Findings: N | Action items: M (K implemented, J deferred)
Artifacts: retros.jsonl, learnings log, suppressions
Verification: M stored | K passed | J flagged
Next: /pr-retro for more missing retros
```

**Done when:** Closure summary displayed.

---

## COMPACTION RESILIENCE

> See REFERENCE.md for state file schema.

- **State file:** `.claude/state/task-pr-retro.state.json`
- **Update:** After PR selection, each finding decision, action item approval
- **Resume:** `--resume` reads state, skips completed findings
- **Pause:** "pause" at any prompt -- saves state, prints progress, exits

## GUARD RAILS

- **No data:** Zero rounds after Step 2 -- "Skip? [Y/n]"
- **Conflicts:** Markdown vs JSONL disagree -- flag both, user picks
- **Large retros:** >15 findings -- Low batched (Step 4)
- **Save-and-resume:** "pause" at any prompt saves and exits

---

## Version History

| Version | Date       | Description                                                                                        |
| ------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 4.8     | 2026-03-18 | Step 6: Require functional verify commands, not grep-based string checks. Good/bad examples added. |
| 4.7     | 2026-03-18 | Audit v2: 33 decisions. Renumber, reorder save-after-impl, extract to REF.                         |
| 4.6     | 2026-03-18 | Deliverable verification via convergence-loop.                                                     |
| 4.5     | 2026-03-18 | Hook health enrichment.                                                                            |
| 4.4     | 2026-03-13 | Review-metrics enrichment.                                                                         |
| 4.3     | 2026-03-13 | Pattern recurrence auto-escalation.                                                                |
| 4.2     | 2026-03-11 | Implementation hard gate.                                                                          |
| 4.0     | 2026-03-06 | Major rewrite: interactive walkthrough, batch, verification.                                       |

> Older history in [ARCHIVE.md](ARCHIVE.md).
