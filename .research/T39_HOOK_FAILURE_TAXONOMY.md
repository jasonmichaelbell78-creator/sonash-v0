# T39 — Hook Failure Taxonomy (Concern #2)

**Status:** Investigation complete — awaiting fix authorization **Date:**
2026-04-10 **Scope:** Pre-commit + pre-push hook failures (the
"propagation-staged" example in T39 is actually pre-commit, so both phases are
in scope per user direction) **Source data:** `scripts/config/hook-checks.json`
(26 checks), `.claude/state/hook-warnings-log.jsonl` (46 entries),
`.claude/hook-warnings.json` (13 active), `.claude/state/hook-warnings-ack.json`

---

## 1. Inventory — 26 hook checks

### Pre-commit (14 checks)

| Wave | ID                     | Blocking | Skip flag                 | Warning type         | Category   |
| ---- | ---------------------- | -------- | ------------------------- | -------------------- | ---------- |
| 0    | secrets-scan           | block    | `gitleaks`                | —                    | security   |
| 1    | eslint                 | block    | —                         | —                    | quality    |
| 1    | tests                  | block    | `tests`                   | —                    | testing    |
| 2    | lint-staged            | block    | —                         | —                    | quality    |
| 3    | pattern-compliance     | block    | `patterns`                | —                    | compliance |
| 4    | audit-s0s1             | block    | `audit`                   | —                    | compliance |
| 6    | skill-validation       | warn     | —                         | `skill`              | quality    |
| 7    | cross-doc-deps         | block    | `cross-doc`               | —                    | docs       |
| 8    | doc-index              | auto-fix | `doc-index`               | —                    | docs       |
| 9    | doc-headers            | block    | `doc-header`              | —                    | docs       |
| 10   | agent-compliance       | warn     | —                         | `agent`              | compliance |
| 11   | debt-schema            | block    | `debt`                    | —                    | compliance |
| 12   | jsonl-md-sync          | warn     | `jsonl-sync`              | `jsonl-sync`         | docs       |
| 13   | **propagation-staged** | block    | `SKIP_PROPAGATION_STAGED` | `propagation-staged` | quality    |

Plus inline pre-commit checks not in the registry: **pr-creep guard** (warn at
10, strong warn at 20, block at 25), file-write-count guard, PR creep message
builder.

### Pre-push (12 checks)

| Wave | ID                      | Blocking | Skip flag          | Warning type  | Category   |
| ---- | ----------------------- | -------- | ------------------ | ------------- | ---------- |
| 0    | escalation-gate         | block    | `warnings`         | `escalation`  | compliance |
| 1    | circular-deps           | block    | —                  | —             | quality    |
| 2    | pattern-compliance-push | warn     | —                  | `patterns`    | compliance |
| 3    | code-reviewer-gate      | block    | `SKIP_REVIEWER`    | `reviewer`    | compliance |
| 4    | propagation             | block    | `SKIP_PROPAGATION` | `propagation` | quality    |
| 5    | hook-tests              | block    | —                  | `hook-tests`  | testing    |
| 6    | security-check          | block    | —                  | `security`    | security   |
| 7    | type-check              | block    | —                  | —             | quality    |
| 7    | cyclomatic-cc           | block    | `SKIP_CC`          | —             | quality    |
| 7    | cognitive-cc            | block    | `SKIP_COG_CC`      | —             | quality    |
| 8    | npm-audit               | warn     | —                  | `audit`       | security   |
| 9    | triggers                | block    | `SKIP_TRIGGERS`    | `trigger`     | compliance |

---

## 2. Failure history (46 log entries)

Aggregated by `(hook, type)`, sorted by frequency:

| Hook          | Type                | Entries | Severity | Max `occurrences` | Max `since_ack` | Resolved | Unique messages                    |
| ------------- | ------------------- | ------- | -------- | ----------------- | --------------- | -------- | ---------------------------------- |
| pre-commit    | **pr-creep**        | **11**  | warning  | 12                | 11              | 4        | **7** (one per commit count 10-16) |
| session-start | review-lifecycle    | 7       | warning  | —                 | —               | 0        | 1                                  |
| session-start | tdms-s0             | 7       | warning  | —                 | —               | 0        | 1                                  |
| session-start | session-end-missing | 6       | warning  | —                 | —               | 5        | 4 (one per "Xh ago")               |
| session-start | cli-tools-missing   | 5       | warning  | —                 | —               | 5        | 1                                  |
| pre-commit    | propagation-staged  | 3       | warning  | 4                 | 1               | 0        | 2 (WARN + BLOCK msgs)              |
| pre-push      | patterns            | 2       | warning  | 2                 | 2               | 0        | 2                                  |
| pre-push      | trigger             | 2       | warning  | 3                 | 1               | 0        | 1                                  |
| pre-push      | audit               | 1       | warning  | 1                 | 1               | 0        | 1                                  |
| pre-push      | reviewer            | 1       | warning  | 1                 | 1               | 0        | 1                                  |
| pre-push      | network-error       | 1       | info     | 1                 | 1               | 0        | 1                                  |

**Key observations:**

1. **pr-creep alone accounts for 24% of all log entries** and has **7 distinct
   "messages"** — one per commit count value. The active warnings file shows 7
   separate pr-creep entries (occ:11 each) because each commit-count value is
   treated as a new warning.
2. **session-start warnings have `occurrences: undefined` in the log** — they
   don't go through `append-hook-warning.js`, they're written by a parallel code
   path.
3. Pre-push failures are genuinely rare (only 7 entries across 6 types), which
   is good news — pre-push itself is mostly reliable.

---

## 3. Categorization

### 3.1 Scoring quirks (noise, not real failures)

| #   | Check                                                                                          | Root cause                                                                                                                                                                                                                                                                                                                                 | Evidence                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQ1 | **pr-creep**                                                                                   | Dedup key = `type+message`; message includes the commit count as a literal string (`"10 commits on branch"`). Every new commit produces a different message, so dedup never triggers.                                                                                                                                                      | Active `hook-warnings.json` has 7 pr-creep entries for counts 10-16. Cross-check: `.husky/pre-commit:82` builds the message with `$COMMIT_COUNT`.                                |
| SQ2 | **session-start warnings** (review-lifecycle, tdms-s0, session-end-missing, cli-tools-missing) | `session-start.js:1316-1365` writes to `hook-warnings-log.jsonl` directly via `fs.appendFileSync`, bypassing `append-hook-warning.js`'s dedup logic. No `occurrences` field, no `occurrences_since_ack`, no `lastCleared` check. Actually _inverts_ lastCleared semantics: sets timestamp to 1s _after_ lastCleared so warnings "survive". | All 7 `review-lifecycle` log entries have `occurrences: undefined` and `occurrences_since_ack: undefined`. Same for all tdms-s0, session-end-missing, cli-tools-missing entries. |
| SQ3 | **session-end-missing** (sub-case of SQ2)                                                      | Also has the pr-creep-style message quirk — includes "Xh ago" literal in the message, so 6 entries map to 4 distinct messages.                                                                                                                                                                                                             | 4 unique messages across 6 entries: 0h, 0h, 2h, 0h.                                                                                                                              |

### 3.2 Real failures (actionable now)

| #   | Check                  | Finding                                                                                                                                                                                                                                                             | Evidence                                                                                                                                                                        |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF1 | **propagation-staged** | Two recently-added files contain unbaselined `err.message` uses: <br/>• `scripts/lib/todos-mutations.js:171` — `throw new Error(\`parse error at line ${i + 1}: ${err.message}\`)`<br/>•`scripts/planning/todos-cli.js:132, 144, 255, 262`— 4 raw`err.message` uses | Reproduced with `node scripts/check-propagation-staged.js --json --staged-files="scripts/_t39_fake.js"` (fixture containing `sanitizeError(`). Output: 2 BLOCK-severity misses. |

### 3.3 Design flaws (check architecture, not any single firing)

| #   | Check                                          | Flaw                                                                                                                                                                                                                                                                                                                                      | Impact                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DF1 | **propagation-staged trigger scope**           | Triggers on the GOOD pattern (`\bsanitizeError\s*\(`) in any staged file, then scans ALL tracked files matching `searchGlob` for anti-patterns. Staging a completely innocuous file that uses `sanitizeError` causes a full-codebase scan. Pre-existing, unrelated violations then block commits to files that didn't touch the bad code. | Pre-commit should be fast and scoped to the staged diff. Scanning 106+ sibling files per commit is a scope mismatch — that work belongs in pre-push or CI.                                                                               |
| DF2 | **Two write paths to hook-warnings-log.jsonl** | `scripts/append-hook-warning.js` implements dedup, ack-state, occurrence tracking. `.claude/hooks/session-start.js:1316-1365` writes directly and bypasses all of it. This is the direct cause of SQ2 noise.                                                                                                                              | The log has two classes of entries: (a) rich entries from hooks with occurrences/sinceAck, (b) skeletal entries from session-start with only type/message/timestamp. Aggregators and alerts treat them uniformly, which inflates counts. |
| DF3 | **Stale baseline entries**                     | `scripts/config/known-propagation-baseline.json` contains `pattern:path-containment` (3 entries), but the registry (`propagation-patterns.json`) has `validate-path` — no entry with `path-containment` id exists. These entries suppress nothing.                                                                                        | 3 dead baseline entries. Not causing failures, but indicates the baseline hasn't been maintained since the 2026-03-30 registry refactor.                                                                                                 |

### 3.4 Timing races / cross-locale drift

**None observed in this data.** The user's concern #2 hypothesis about timing
races does not match the evidence — every recurring warning traces to a
scoring/dedup flaw or a real unbaselined violation. No check shows symptoms of
mid-write staleness, ordering dependency, or machine-specific behavior in the
available log.

---

## 4. Propagation-staged deep dive

### Trigger flow (from `scripts/check-propagation-staged.js`)

1. `getStagedFiles()` → `git diff --cached --name-only`
2. Filter to JS/TS files only
3. `getDiffAddedLines()` → added lines from `git diff --cached -U0`
4. `matchPatterns(diffLines, registry)` → returns pattern IDs where ANY added
   line matches the registry's `pattern` regex (the GOOD pattern)
5. For each triggered pattern:
   - `findFilesForGlobs(entry.searchGlob)` → ALL tracked files matching glob
     (e.g., `scripts/**/*.js`, `.claude/hooks/**/*.js`)
   - `findMisses(entry, scanFiles)` → scans each file content against
     `antiPattern` regex
   - Baselined entries suppressed via `known-propagation-baseline.json`
6. If any miss is `BLOCK`-severity → exit 2 (blocks commit)
7. Otherwise → exit 0 with WARN printed

### The false-positive mechanism

```text
User stages a new file that uses sanitizeError()
  ↓
Pattern "sanitize-error" triggers (matched by `\bsanitizeError\s*\(`)
  ↓
Scan all scripts/**/*.js and .claude/hooks/**/*.js (~500+ files)
  ↓
Apply baseline suppression (106 entries)
  ↓
2 recently-added files (todos-mutations.js, todos-cli.js)
NOT in baseline, NOT in the staged diff, but contain err.message
  ↓
BLOCK-severity miss → commit blocked
```

The check is semantically correct — those ARE real unsanitized error uses. But
the **triggering model is too wide**: a file that doesn't touch error handling
can block commits because another file, unrelated to the change, has
pre-existing violations that weren't baselined when they were introduced.

### Why it hits at commit rather than push

Per `hook-checks.json`, `propagation-staged` is at wave 13 in pre-commit
(blocking). There's also a separate `propagation` check at wave 4 in pre-push
that checks function-level propagation. The pre-commit flavor exists to catch
violations earlier, but the trade-off is that the broad scan scope creates
noise.

### Baseline coverage analysis

```
Total baseline entries: 585
  pattern:refuse-symlink:     237
  pattern:sanitize-error:     106
  pattern:validate-path:       91
  pattern:lstat-symlink:       30
  pattern:safe-to-write:       28
  pattern:safe-write-file:     28
  function:issues:             23   ← stale (function-level, used by check-propagation.js)
  pattern:number-nan:           9
  function:loadBaseline:        7   ← stale
  pattern:path-traversal:       5
  function:ageDays:             5   ← stale
  function:nextLine:            4   ← stale
  pattern:exec-path:            3
  pattern:path-containment:     3   ← stale (registry has validate-path, not path-containment)
  function:printResult:         2   ← stale
  function:elapsed:             2   ← stale
  function:findPatternMatches:  1   ← stale
  function:loadRegistry:        1   ← stale
```

Legitimate: 535 entries (pattern:_, matching registry IDs). Dead: 50 entries
(function:_ entries unused by propagation-staged, plus path-containment which
has no matching pattern ID).

---

## 5. pr-creep deep dive

### Source

`.husky/pre-commit:40-88`. Inline shell that runs
`git rev-list --count $(git merge-base origin/main HEAD)..HEAD`, compares
against thresholds 10/20/25, and calls `append-hook-warning.js` with:

```bash
node scripts/append-hook-warning.js --hook=pre-commit --type=pr-creep --severity=info \
  --message="$COMMIT_COUNT commits on branch" \
  --action="Create PR: gh pr create"
```

### Dedup failure mode

`scripts/append-hook-warning.js:246-269` → `isDuplicateWarning` matches on
`hook + type + message`. Since `$COMMIT_COUNT` changes each commit, the message
is always new. Neither fast-path (1h cache) nor cross-session (lastCleared)
dedup catches it.

### Active warnings file state

```text
pr-creep (16 commits on branch) — occ:11 sinceAck:11
pr-creep (15 commits on branch) — occ:11 sinceAck:11
pr-creep (14 commits on branch) — occ:11 sinceAck:11
pr-creep (13 commits on branch) — occ:11 sinceAck:11
pr-creep (12 commits on branch) — occ:11 sinceAck:11
pr-creep (11 commits on branch) — occ:11 sinceAck:11
pr-creep (10 commits on branch) — occ:11 sinceAck:11
```

7 active warnings. Each one has `occurrences:11` because
`countRecentOccurrences` matches by type alone (not by message), so the counter
keeps climbing — but the dedup gate happens _before_ the counter is consulted,
and it's the dedup key (including message) that lets each new count through.

---

## 6. Recommended fixes

### FIX-1 — pr-creep: use stable message (SQ1)

**File:** `.husky/pre-commit:76-85` **Change:** Replace
`"$COMMIT_COUNT commits on branch"` with a stable string like
`"Branch has >=10 commits on main"` and move the count into a new `--pattern` or
`--count` field. **Effort:** Small (shell + maybe 1 line in
`append-hook-warning.js` to accept --count and serialize it). **Impact:**
Eliminates 7+ duplicate active pr-creep entries per branch, reduces log growth.
**Risk:** Downstream consumers (`/alerts`, `/pr-retro`) may expect the count in
the message. Needs verification.

### FIX-2 — session-start: route through append-hook-warning.js (SQ2, DF2)

**Files:** `.claude/hooks/session-start.js:1316-1365` **Change:** Replace the
direct `fs.appendFileSync` block with calls to `scripts/append-hook-warning.js`
for each entry in `warningEntries`. That automatically gets dedup, ack-state,
occurrences tracking. **Effort:** Medium — need to invoke append-hook-warning.js
per-entry (or extend it to accept batch input), handle the "survive concurrent
lastCleared" edge case differently. **Impact:** Eliminates duplicate
review-lifecycle/tdms-s0/cli-tools-missing log entries (currently 19 of 46 log
entries = 41%). **Risk:** The "warnings survive concurrent clear" hack exists
for a reason — need to confirm there's no race that this fix breaks. Possible
mitigation: make `append-hook-warning.js` itself handle the "lastCleared just
happened" case atomically.

### FIX-3 — session-end-missing: stable message (SQ3)

**File:** `.claude/hooks/session-start.js:168-172` **Change:** Drop "Xh ago"
from message, put it in a separate field. Only needed if FIX-2 isn't applied,
because FIX-2 fixes this as a side effect. **Effort:** Trivial. **Impact:**
Redundant with FIX-2. Skip if FIX-2 lands.

### FIX-4 — propagation-staged: fix the 2 real violations (RF1)

**Files:** `scripts/lib/todos-mutations.js:171`,
`scripts/planning/todos-cli.js:132, 144, 255, 262` **Change:** Wrap
`err.message` with `sanitizeError(err)` using `scripts/lib/sanitize-error.cjs`.
**Effort:** Trivial — 5 line edits. **Impact:** Clears the current
BLOCK-severity propagation-staged warning. Clears the "every commit" loop for
anyone staging files that use sanitizeError. **Risk:** Very low. These are
user-facing error messages; `sanitizeError` returns a safe string
representation.

### FIX-5 — propagation-staged: scope the scan to staged files in pre-commit (DF1)

**File:** `scripts/check-propagation-staged.js:282-304` (`findFilesForGlobs`)
**Change:** Two options:

- **(A) Narrow scope:** In pre-commit mode, scan only staged files. The broader
  sibling scan moves to pre-push (or already exists as `check-propagation.js`).
- **(B) Incremental baseline:** Auto-baseline any violation that existed before
  the current diff — only fail on NEW violations introduced in the staged diff.
  Requires `git diff HEAD` against baseline state.
- **(C) Change trigger model:** Trigger not on good-pattern presence but on
  anti-pattern presence. Only scan when the staged diff ADDS an anti-pattern
  line. Simpler and more accurate.

**Effort:** Medium — (A) is smallest, (C) is cleanest conceptually but changes
semantics. **Impact:** Eliminates the false-positive category entirely.
Pre-commit becomes fast again. **Risk:** (A) weakens the safety net for
unrelated propagation misses. But `check-propagation.js` (pre-push) already
exists as the broad sweep, so this is acceptable. **Recommendation:** Option (C)
— trigger on anti-pattern only. It's the most conservative change and matches
the intent (catch new bad code, not pre-existing bad code).

### FIX-6 — baseline cleanup (DF3)

**File:** `scripts/config/known-propagation-baseline.json` **Change:** Remove 50
dead entries (all `function:*` entries if they're not used by
propagation-staged, plus `pattern:path-containment`). **Effort:** Small — need
to first verify `function:*` entries are actually unused (check
`check-propagation.js`). **Impact:** -50 lines of dead config, clearer ownership
of which check owns which entries. **Risk:** If `check-propagation.js` reads the
same baseline file and uses `function:*` entries, removing them breaks pre-push
propagation checks. **Must verify first.**

### FIX-7 — restore propagation-staged to working state now (workaround)

If FIX-4 or FIX-5 can't be applied immediately, the current BLOCK-severity
failure can be cleared by adding `scripts/lib/todos-mutations.js` and
`scripts/planning/todos-cli.js` entries to `known-propagation-baseline.json`
under `pattern:sanitize-error`. This is a band-aid — prefer FIX-4.

---

## 7. Priority ordering (for discussion)

| Rank | Fix       | Rationale                                                                                | Reversibility                                                 |
| ---- | --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | **FIX-4** | Unblocks current pre-commit state. Smallest change. Addresses a real code-quality issue. | Fully reversible (git revert)                                 |
| 2    | **FIX-2** | Eliminates 41% of hook-warnings-log growth. Large noise reduction.                       | Reversible; requires testing the "concurrent clear" edge case |
| 3    | **FIX-1** | Eliminates pr-creep flood. Second-largest noise source.                                  | Fully reversible                                              |
| 4    | **FIX-5** | Permanent fix for DF1. Changes semantics — needs discussion.                             | Reversible but larger change                                  |
| 5    | **FIX-6** | Cleanup. Low value but low effort once verified.                                         | Trivial to revert                                             |
| —    | FIX-3     | Redundant if FIX-2 lands.                                                                | —                                                             |
| —    | FIX-7     | Band-aid, skip unless FIX-4 is blocked.                                                  | —                                                             |

---

## 8. What's NOT in this report (deferred to other T39 concerns)

- **Concern #1** — `/hook-ecosystem-audit` full 20-category diagnostic and
  `/brainstorm` improvement ideas. Not in scope for this pass.
- **Concern #3** — Hooks writing files during commits/pushes (state file churn).
  Not in scope; would require its own investigation of queue/flush strategies.
- **Cross-locale verification** — User said current locale data is sufficient.
  If the home locale shows different patterns, re-run this taxonomy there.

---

## 9. Open questions for user

Before implementing any fix:

1. **FIX-4 (real violations):** Fix in place, or baseline? Fix is cleaner but
   these are user-facing error messages where `err.message` is arguably correct
   (user wants to see what went wrong). Need your call.
2. **FIX-5 (scope change):** Prefer option (A) narrow to staged only, (B)
   incremental baseline, or (C) trigger on anti-pattern? I recommend (C).
3. **FIX-2 (session-start routing):** The "warnings survive concurrent clear"
   comment suggests a known race. Do you remember what the race was, or should I
   investigate further before touching it?
4. **FIX-6 (baseline cleanup):** OK to investigate whether
   `check-propagation.js` uses `function:*` entries before deleting them, or
   leave for a future pass?
5. **Order:** Apply fixes in the ranked order above, or do you want a different
   sequence?
6. **Batch or one-at-a-time:** Apply all approved fixes in one session with a
   single commit, or separate commits per fix?
