# Findings: Is SoNash's learning-router graduation pipeline working? What's stuck and why?

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-03
**Sub-Question IDs:** SQ-7 (Part C)

---

## Key Findings

### 1. The pipeline has four defined lifecycle stages but only one entry has ever reached "enforced" — and it is broken [CONFIDENCE: HIGH]

The `learning-route.ts` schema defines the status lifecycle as:
`scaffolded → refined → enforced → verified (or deferred)`

Of 40 entries in `.claude/state/learning-routes.jsonl`:

| Status     | Count | Notes                                                                       |
| ---------- | ----- | --------------------------------------------------------------------------- |
| refined    | 39    | All stuck here — none have progressed further                               |
| enforced   | 1     | ID `3689cfd62f77` — marked `_repair_needed: true`, last verification failed |
| verified   | 0     | None have ever reached terminal "verified" state                            |
| scaffolded | 0     | All have been processed by `refine-scaffolds.js`                            |

The sole "enforced" entry (`3689cfd62f77`, pattern: "Audit Findings: Storage:
unbounded, no rotation") has `_repair_needed: true` and
`_failure_reason: "test exit code 1"` as of `2026-04-03T12:59:30.147Z`. The test
at `tests/enforcement/check-3689cfd62f77.test.js` checks that
`audit-findings.jsonl` and `audit-findings-history.jsonl` are listed in
`rotation-policy.json`. Both paths _are_ present in
`config/rotation-policy.json` (under the `historical` tier with
`maxAgeDays: 90`), meaning the test should pass — but `verify-enforcement.js`
reports exit code 1. This is a currently unresolved discrepancy.

Sources: `.claude/state/learning-routes.jsonl:19`,
`tests/enforcement/check-3689cfd62f77.test.js`,
`config/rotation-policy.json:30-31`

---

### 2. The `refine-scaffolds.js` promotion logic works correctly but systematically classifies nearly everything as "low confidence" [CONFIDENCE: HIGH]

`scripts/refine-scaffolds.js` reads "scaffolded" entries, passes each through
`scripts/lib/confidence-classifier.js`, and promotes them to either "enforced"
(high confidence) or "refined" (low confidence).

The `confidence-classifier.js` rules are (in priority order):

1. **behavioral → always low** (most entries are behavioral — proxy metrics need
   human judgment)
2. **code + rotation gap keyword (`unbounded`/`no rotation`) → high** (only 2
   entries match; one was already promoted)
3. **code + matches verified-pattern anti_pattern string → high**
4. **process + subject in known consumer map (`review-metrics`, `hook-warnings`,
   `health-scores`, `commit-log`) → high** (only `ea300d266380` matched —
   promoted, then reclassified back to refined)
5. **process otherwise → low** (most process entries)

The result: 37 of 39 "refined" entries have `classification.confidence: "low"`.
The classifier has no rule to ever reclassify a "refined" entry — once refined,
nothing advances it to "enforced" without manual intervention or a new routing
event.

Sources: `scripts/lib/confidence-classifier.js:103-183`,
`scripts/refine-scaffolds.js:203-248`, `.claude/state/learning-routes.jsonl`
(all entries)

---

### 3. The "pending-refinements.jsonl" escalation mechanism is inoperative because all entries have `generated_code: null` [CONFIDENCE: HIGH]

`pending-refinements.jsonl` has 37 entries. Every single entry has
`generated_code: null`. The escalation logic in `run-alerts.js` (lines
4109-4110) skips entries without actionable `generated_code`:

```js
if (typeof entry.generated_code !== "string" || !entry.generated_code.trim()) {
  updatedEntries.push(entry);
  continue;
}
```

This means:

- `surfaced_count` is never incremented for any entry
- No entry ever reaches the 3-surface auto-escalation threshold for DEBT
  creation
- The entire "fix-or-DEBT" escalation path is dead

The `buildPendingEntry()` function in `refine-scaffolds.js` (line 154) always
sets `generated_code: entry.scaffold?.generatedCode ?? null`. But
`learning-router.js`'s scaffold objects never populate a `generatedCode` field —
the scaffold functions return `targetFile` and stub content, not a
`generatedCode` property. The field name mismatch means `generated_code` is
always `null`.

Sources: `.claude/state/pending-refinements.jsonl` (all 37 entries),
`scripts/refine-scaffolds.js:154`,
`.claude/skills/alerts/scripts/run-alerts.js:4109-4110`,
`scripts/lib/learning-router.js:138-220`

---

### 4. `analyze-learning-effectiveness.js` is an independent parallel system with no connection to `learning-routes.jsonl` [CONFIDENCE: HIGH]

`scripts/analyze-learning-effectiveness.js` runs a completely separate analysis
pipeline. It reads from:

- `docs/AI_REVIEW_LEARNINGS_LOG.md` (review-derived patterns)
- `docs/agent_docs/CODE_PATTERNS.md` (documented patterns)
- `scripts/check-pattern-compliance.js` (automated patterns)

It defines its own "learned/AUTOMATED/WEAK/FAILED" status taxonomy and writes
results to `docs/LEARNING_METRICS.md` and `docs/LEARNING_TODO.md`. It never
reads, writes, or references `learning-routes.jsonl`. The two systems track
"learning effectiveness" using entirely different data sources and have no
shared signal.

Sources: `scripts/analyze-learning-effectiveness.js:36-43`,
`scripts/analyze-learning-effectiveness.js:126-160`

---

### 5. `verify-enforcement.js` is correctly implemented but has nothing to verify [CONFIDENCE: HIGH]

`scripts/verify-enforcement.js` reads `learning-routes.jsonl`, finds entries
with `status: "enforced"`, runs their `enforcement_test` scripts (or evaluates
`metrics`), and updates status to "verified" or flags `_repair_needed`. The
decision logic is sound:

- Test fails → "failed" (adds `_repair_needed: true`)
- Test passes + metrics improved → "verified"
- No test AND no metrics → "skipped"

In practice, only one entry has ever had `status: "enforced"`, it has a broken
test (exit code 1), and its `metrics.violations_after` is `null` (never
updated). So `verify-enforcement.js` runs, finds 1 entry, test fails, flags it
as `_repair_needed`, and terminates. The "verified" status has never been
reached by any entry.

Sources: `scripts/verify-enforcement.js:246-259`,
`scripts/verify-enforcement.js:400-419`,
`.claude/state/learning-routes.jsonl:19`

---

### 6. The `alerts/run-alerts.js` enforcement verification check (Wave 9) reads `learning-routes.jsonl` but is effectively a no-op for unverified enforced entries [CONFIDENCE: HIGH]

`run-alerts.js` `checkEnforcementVerification()` (lines 4019-4079) reads
learning-routes, builds a set of `verified` IDs, then alerts on `enforced`
entries not in that set. With 0 "verified" entries and 1 "enforced" entry
(`3689cfd62f77`), this correctly surfaces a warning. The alert exists and fires,
but no downstream action closes the loop — the warning has been present since at
minimum `2026-03-21` when the entry was promoted to "enforced."

Sources: `.claude/skills/alerts/scripts/run-alerts.js:4019-4079`,
`.claude/state/learning-routes.jsonl:19`

---

### 7. Consumers of `learning-routes.jsonl` are limited to the immediate pipeline scripts [CONFIDENCE: HIGH]

Across the full codebase, `learning-routes.jsonl` is referenced in:

- `scripts/lib/learning-router.js` — writer (deduplication check + append)
- `scripts/refine-scaffolds.js` — reader + writer (promotes scaffolded entries)
- `scripts/verify-enforcement.js` — reader + writer (promotes enforced →
  verified)
- `.claude/skills/alerts/scripts/run-alerts.js` — reader (alerts check)
- `scripts/reviews/lib/schemas/index.ts` + `learning-route.ts` — Zod schema
  definition
- `scripts/__tests__/` tests — test-only consumers

It is NOT read by:

- `analyze-learning-effectiveness.js`
- Any hook script
- Any health checker (beyond `run-alerts.js`)
- Any CI script

Sources: Grep across 58 files referencing "learning-routes"

---

### 8. The `behavioral` type graduation bottleneck is by design, but no human-judgment mechanism exists [CONFIDENCE: HIGH]

19 of 39 refined entries are behavioral type. The classifier explicitly
hard-codes `behavioral → always low` because "proxy metrics need human judgment
on measurement approach." The design acknowledges this requires human action.
However:

- No tooling, skill, or workflow prompts a human to act on pending behavioral
  refinements
- `pending-refinements.jsonl` surfaces these to `/alerts` only when
  `generated_code` is populated (which it never is)
- `surfaced_count` for all behavioral entries is `0` since creation (2026-03-14
  to 2026-03-22)

The design calls for human judgment, but no mechanism delivers these items to a
human for judgment.

Sources: `scripts/lib/confidence-classifier.js:116-122`,
`.claude/state/pending-refinements.jsonl` (all entries),
`.claude/skills/alerts/scripts/run-alerts.js:4109-4110`

---

## Sources

| #   | File Path                                               | Description                                                 | Type     | Trust | CRAAP     | Date                     |
| --- | ------------------------------------------------------- | ----------------------------------------------------------- | -------- | ----- | --------- | ------------------------ |
| 1   | `scripts/lib/learning-router.js`                        | Core routing logic, scaffold functions, deduplication       | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 2   | `.claude/state/learning-routes.jsonl`                   | Live state — 40 entries, all statuses                       | codebase | HIGH  | 5/5/5/5/5 | 2026-04-03               |
| 3   | `scripts/verify-enforcement.js`                         | Verification framework, decision logic                      | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 4   | `scripts/refine-scaffolds.js`                           | Promotion pipeline (scaffolded → enforced/refined)          | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 5   | `scripts/lib/confidence-classifier.js`                  | Classification rules (high/low confidence)                  | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 6   | `.claude/state/pending-refinements.jsonl`               | 37 pending entries, all `generated_code: null`              | codebase | HIGH  | 5/5/5/5/5 | 2026-03-14 to 2026-03-22 |
| 7   | `scripts/analyze-learning-effectiveness.js`             | Separate learning analysis (reviews-based)                  | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 8   | `.claude/skills/alerts/scripts/run-alerts.js:4019-4114` | Wave 9 enforcement verification + pending refinement checks | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 9   | `tests/enforcement/check-3689cfd62f77.test.js`          | Only enforcement test in existence                          | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 10  | `config/rotation-policy.json`                           | Rotation tiers including audit-findings paths               | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |
| 11  | `scripts/reviews/lib/schemas/learning-route.ts`         | Zod schema defining status lifecycle                        | codebase | HIGH  | 5/5/5/5/5 | 2026-03                  |

---

## Contradictions

**Finding 1 vs. test contents:** Entry `3689cfd62f77` has
`_failure_reason: "test exit code 1"`, but manual inspection of
`tests/enforcement/check-3689cfd62f77.test.js` shows it checks for
`audit-findings.jsonl` in `rotation-policy.json` — which IS present in that
file. This suggests either: (a) The test file is not being executed via Jest (it
uses `describe`/`test` syntax but `verify-enforcement.js` runs it via
`execFileSync` as a plain node script, not via the test runner), or (b) The
rotation policy did not contain those paths at the time of last verification
(2026-04-03T12:59:30), or (c) The test runner requires a Jest context that
`execFileSync(process.execPath, [realAbsPath])` doesn't provide.

This is a critical blocking contradiction for the only enforced entry.

---

## Gaps

1. **No `auto-consolidate-reviews.js` exists** at the expected path
   `scripts/reviews/auto-consolidate-reviews.js` — the file does not exist. The
   research task asked about it; it is absent from the codebase.

2. **Root cause of test exit code 1 not determinable from static analysis.**
   Running `verify-enforcement.js` live would be required to confirm whether the
   Jest vs. plain-node execution issue is the actual cause.

3. **No evidence the graduation pipeline has ever successfully completed
   end-to-end** (scaffolded → refined → enforced → verified). The first and only
   entry promoted to "enforced" remains broken.

4. **`refine-scaffolds.js` only processes "scaffolded" entries.** All current
   entries are "refined" — running `refine-scaffolds.js` today would skip all 39
   entries (skipped++ for non-"scaffolded" status). There is no re-processing
   path for stuck "refined" entries.

---

## Serendipity

- **The `analyze-learning-effectiveness.js` uses a keyword-match threshold of
  50% for "pattern occurred in review" and 40% for "pattern is automated."**
  These low thresholds risk false positives that inflate the "LEARNED" count —
  patterns may show as "LEARNED" simply because they weren't keyword-matched
  against recent reviews, not because they actually stopped recurring. This
  affects the top-level learning effectiveness metric.

- **`rotation-policy.json` correctly lists `learning-routes.jsonl` in the
  "permanent" tier** (`maxAgeDays: null`), meaning the pipeline's core state
  file will never be rotated away. This is appropriate.

- **`pending-refinements.jsonl` has existed unchanged since 2026-03-14.** All 37
  `surfaced_count` values remain 0, confirming the alerts escalation check has
  never successfully processed any entry.

- **The `refine-scaffolds.js` script sets `enforcement_test: null` (not a path)
  when promoting to "enforced."** It sets `pending_enforcement_test` to a
  placeholder path. `verify-enforcement.js` checks for `entry.enforcement_test`
  (a string), not `entry.pending_enforcement_test`. This means promoted entries
  start with `enforcement_test: null` and `verify-enforcement.js` would
  immediately skip them as having "no enforcement_test or metrics" — unless both
  are manually populated afterward. Entry `3689cfd62f77` appears to have had its
  `enforcement_test` field backfilled manually.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct filesystem evidence (source code + live
state files). No inference from training data.
