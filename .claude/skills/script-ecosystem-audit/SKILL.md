---
name: script-ecosystem-audit
description: >-
  Comprehensive diagnostic of the script infrastructure — 18 categories across 5
  domains with composite health scoring, trend tracking, patch suggestions, and
  interactive finding-by-finding walkthrough. Covers all .js files under
  scripts/ and their npm registrations for module consistency, safety patterns,
  reachability, code quality, and testing.
---

<!-- prettier-ignore-start -->
**Document Version:** 2.0
**Last Updated:** 2026-03-08
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Script Ecosystem Audit

Deep diagnostic of `scripts/**/*.js` infrastructure — shared libraries, npm
script registrations, and cross-script dependencies. Produces per-category
scores, a composite health grade (A-F), trend tracking across runs, and an
interactive walkthrough with patch suggestions.

**Scope:** `scripts/**/*.js` only. Skill-local scripts
(`.claude/skills/*/scripts/`) are owned by `/skill-ecosystem-audit`.

**Invocation:** `/script-ecosystem-audit` or `/script-ecosystem-audit --summary`

## Routing Guide

| Task                                | Use                              |
| ----------------------------------- | -------------------------------- |
| Script infrastructure health        | `/script-ecosystem-audit`        |
| Hook internals                      | `/hook-ecosystem-audit`          |
| Skill quality & skill-local scripts | `/skill-ecosystem-audit`         |
| General code review                 | `/audit-code`                    |
| All ecosystem audits at once        | `/comprehensive-ecosystem-audit` |

## When to Use

- User explicitly invokes `/script-ecosystem-audit`
- Before a major script refactor or reorganization
- After adding 5+ new scripts to the `scripts/` directory
- As part of `/comprehensive-ecosystem-audit` (called automatically)

## When NOT to Use

- Auditing hook internals — use `/hook-ecosystem-audit`
- Auditing individual skill quality — use `/skill-audit`
- General code review — use `/audit-code`
- Quick structural check of skills — use `npm run skills:validate`

---

## CRITICAL RULES (MUST — Read First)

1. **CHECK for saved progress first** (MUST) — resume from
   `.claude/tmp/script-audit-progress.json` if it exists and is < 2 hours old.
   Never re-present findings that were already decided.
2. **ALWAYS run the script first** (MUST) — never generate findings without data
3. **ALWAYS display the dashboard** (MUST) before starting the walkthrough
4. **Present findings via conversational Q&A** (MUST) — collect decisions
   through normal conversation. NEVER use AskUserQuestion.
5. **SAVE progress after every decision** (MUST) — write updated state to
   progress file immediately
6. **Show patch suggestions inline** (SHOULD) with each patchable finding
7. **Include a recommendation with rationale** (MUST) per finding
8. **Create TDMS entries** (SHOULD) for deferred findings via `/add-debt`

---

## Arguments & Modes

| Flag              | Description                                           |
| ----------------- | ----------------------------------------------------- |
| _(none)_          | Full audit with JSON output + interactive walkthrough |
| `--summary`       | Compact score-only output, no walkthrough             |
| `--check`         | Quick pass/fail (exit code 0 if no errors, 1 if any)  |
| `--batch`         | Suppress state writes (for iterative fixing)          |
| `--save-baseline` | Save current scores as regression baseline            |

---

## Compaction Guard

Path: `.claude/tmp/script-audit-progress.json`

> Read `REFERENCE.md` for progress file schema.

### On Skill Start (MUST — Before Phase 1)

1. Check if progress file exists and is < 2 hours old
2. If yes: **resume** — display dashboard from saved data, show "Resuming from
   finding {n}/{total} ({n-1} reviewed)", continue walkthrough
3. If no (or stale): proceed to Phase 1

### After Each Decision (MUST — During Phase 3)

Update `currentFindingIndex`, append decision, write progress file immediately.

### On Completion

Delete progress file. Append results to history JSONL.

---

## Phase 1: Run & Parse

1. Run the audit script:
   ```bash
   node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js
   ```
2. **If script fails** (MUST handle): display error, suggest checking
   `node --version` and module dependencies. Do NOT proceed with empty data.
3. Parse v2 JSON output from stdout (progress goes to stderr)
4. Create session log:
   `.claude/tmp/script-audit-session-{YYYY-MM-DD-HHMM}.jsonl`
5. Save initial progress state with `currentFindingIndex: 0`

> Read `REFERENCE.md` for v2 JSON output schema and session log JSONL schema.

**Done when:** Progress file written with score, grade, and findings data.

---

## Phase 2: Dashboard Overview

**MUST display the dashboard before starting walkthrough.**

> Read `REFERENCE.md` for dashboard template.

Present compact header with composite grade, domain breakdown, category scores.

**If 0 findings** (MUST handle): display score, skip Phase 3, go directly to
Phase 4. "No findings — script infrastructure is clean."

After dashboard, show effort estimate: "Found N findings. Estimated review time:
~{N×0.3} min full, ~{top20×0.3} min top-20 only."

**If >50 findings** (MUST): "50+ findings detected. Review top 20 by impact,
then batch-decide the rest? [Y/review all]"

**Done when:** Dashboard displayed, user confirms walkthrough approach.

---

## Phase 3: Finding-by-Finding Walkthrough

**MUST use conversational Q&A — NOT AskUserQuestion.** **MUST save progress
after every decision.**

Sort findings by `impactScore` descending. Present each with a context card:

> Read `REFERENCE.md` for finding card template.

Each finding MUST include a **recommended action** with brief rationale.

### Decision Options

**ERROR findings:** Fix Now | Defer (→ DEBT entry) **WARNING findings:** Fix Now
| Defer | Skip **INFO findings:** Acknowledge | Defer

### Decision Handling

- **Fix Now:** Apply patch if available, provide guidance if not
- **Defer:** Create DEBT entry via `/add-debt` (S1 for errors, S2 for warnings)
- **Skip/Acknowledge:** Log to session file

### After Each Decision

Show running tally: "Progress: {n}/{total} | Fixed: {f} | Deferred: {d} |
Skipped: {s}"

### Delegation Protocol (MUST support)

- "you decide" → accept all recommendations
- "skip remaining INFO" → batch-skip all remaining INFO findings
- "fix all patchable" → apply all remaining patches without individual review
- "defer the rest" → defer all remaining findings as DEBT entries

### Batch Management (MUST for >20 findings after top-20)

After reviewing top 20, present remaining by severity: "N remaining: {e} errors,
{w} warnings, {i} info. Review all / Warnings+ only / Skip to summary?"

**Done when:** All findings decided or batch-resolved.

---

## Phase 4: Summary, Trend & Actions

Present unified summary with trend data (if previous runs exist):

> Read `REFERENCE.md` for summary template.

Include:

- Decision breakdown (fixed/deferred/skipped counts)
- Patches applied count
- Top 3 impact areas
- **Trend data** (SHOULD) — if history JSONL has entries, show direction + delta
  per category. Flag categories poor across 2+ consecutive runs: "{category} has
  been {rating} for {N} consecutive runs."
- **Artifact list** (MUST): session log path, DEBT entries created, files
  patched, history updated

**Done when:** Summary presented to user.

---

## Phase 5: Self-Audit Verification

Run `__tests__/` suite to confirm audit integrity:

```bash
node --test .claude/skills/script-ecosystem-audit/scripts/__tests__/*.test.js
```

Re-run the audit script and compare:

```bash
node .claude/skills/script-ecosystem-audit/scripts/run-script-ecosystem-audit.js
```

> Read `REFERENCE.md` for self-audit template.

Present before/after comparison. If score didn't improve, investigate why.

**Done when:** Before/after comparison presented.

---

## Phase 6: Learning Loop & Closure (MUST)

1. **Auto-learnings** (MUST): Generate 2-3 data-driven insights from audit
   results. E.g., "Top regressing category: X. Most-fixed category: Y. Recurring
   issue: Z poor for N consecutive runs." Save to history JSONL `learnings`
   field.
2. **Optional user feedback** (SHOULD): "Any additional observations or patterns
   the checkers should learn?" Accept empty / "none" to proceed. If provided,
   save to history JSONL `feedback` field.
3. **Invocation tracking** (MUST):
   ```bash
   cd scripts/reviews && node dist/write-invocation.js --data '{"skill":"script-ecosystem-audit","type":"ecosystem-audit","success":true,"context":{}}'
   ```
4. Delete progress file (audit complete)

**On next startup** (MUST): If history JSONL has entries, surface previous
auto-learnings and user feedback: "Previous run noted: [learnings]. User
feedback: [if any]."

**Done when:** Learnings generated, invocation logged, progress file deleted.

---

## Guard Rails

- **Script failure:** Display error + diagnostics, do not proceed with empty
  data
- **Empty results:** Skip walkthrough, show clean score
- **Pause/resume:** User says "pause" → save state, print progress, exit.
  Resume: `/script-ecosystem-audit` reads progress file and continues.
- **Circuit breaker:** >50 findings → offer top-20 review + batch
- **Session log retention:** Ephemeral in `.claude/tmp/`, not archived by
  `/session-end`. Retained for current session only.

---

## Integration

**Neighbors:** `/hook-ecosystem-audit` (hooks), `/comprehensive-ecosystem-audit`
(orchestrator), `/skill-ecosystem-audit` (skill scripts), `/add-debt` (TDMS)

**Comprehensive audit integration:** When called by
`/comprehensive-ecosystem-audit`, the script runs with `--batch --summary` flags
and returns JSON to stdout. The orchestrator expects:
`{ grade, score, errors, warnings, info, patches, domains }`.

**Artifact Contracts:**

| Artifact      | Producer                   | Consumer             | Lifetime                          |
| ------------- | -------------------------- | -------------------- | --------------------------------- |
| Progress file | This skill                 | This skill (resume)  | Ephemeral — deleted on completion |
| Session log   | This skill                 | Current session only | Ephemeral                         |
| History JSONL | Audit script               | This skill (trends)  | Persistent — append-only          |
| DEBT entries  | This skill via `/add-debt` | TDMS pipeline        | Persistent                        |

**Category checks enforce patterns from CLAUDE.md Section 5** (Critical
Anti-Patterns). See CLAUDE.md for canonical definitions.

---

## Version History

| Version | Date       | Description                                                   |
| ------- | ---------- | ------------------------------------------------------------- |
| 2.0     | 2026-03-08 | Skill audit v2: 39 decisions, REFERENCE.md extraction, UX fix |
| 1.0     | 2026-02-24 | Initial implementation                                        |
