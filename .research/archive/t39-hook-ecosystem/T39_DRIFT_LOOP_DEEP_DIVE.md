# T39 — Hook Drift Loop Deep Dive

**Created:** 2026-04-10 **Investigation method:** 5-layer parallel multi-agent
discovery per `feedback_deep_plan_hook_discovery_process.md` **Scope:** T39
concerns #2 (pre-push failures) and #3 (state file drift during hooks) —
**merged, because they are the same problem** **Data sources:**
`scripts/config/hook-checks.json`, `.claude/state/hook-runs.jsonl` (169 runs),
`.claude/state/hook-warnings-log.jsonl` (46 entries),
`.claude/hook-warnings.json`, `.husky/pre-push`, `.husky/pre-commit`,
`.husky/_shared.sh`, `scripts/check-cc.js`, `scripts/check-cyclomatic-cc.js`,
`scripts/log-override.js`, `scripts/append-hook-warning.js`,
`.claude/state/known-debt-baseline.json`,
`.planning/archive/hook-system-overhaul/DECISIONS.md`, git history on branch
`planning-4826`, and live ground-truth execution of 6 check scripts **Companion
file:** `.research/T39_SESSION_STATE.md` (compaction checkpoint) **Session state
before this investigation:** 10 tracked files dirty + 2 untracked (pre-existing
drift from session-start hooks firing before this session)

---

## 0. Executive summary

The user reported: "pre-push is doubling push times. the last PR that was merged
probably had a dozen failures (in red text) before I finally just went to
`--no-verify` to get through it. also, the disconnect between the cyclomatic and
cognitive checks slow things down as well."

After 5-layer discovery, the root causes are:

1. **The pre-push failure-path logger is broken.** `.husky/pre-push` installs
   two EXIT traps via `add_exit_trap` in the wrong order, and the compound
   effect makes failure logging to `hook-runs.jsonl` **structurally
   impossible**. Result: telemetry shows 0 failed pre-push runs across 49
   samples despite the user hitting 10+ failures in a single session. The system
   cannot self-diagnose its own pain.
2. **cognitive-cc is currently failing for a real reason.**
   `scripts/planning/render-todos.js:70` — `renderTodos` function — has
   cognitive complexity 22 vs threshold 15. This is NEW code added during T30
   work (`9aba28c7 feat(T30): todos-cli mutation helper`). Every push that
   includes this file fails cognitive-cc with exit 1. Live reproduction confirms
   this during the investigation.
3. **cognitive-cc and cyclomatic-cc have systemic disconnects beyond
   render-todos.** They use separate sub-keys of the same baseline file with
   disjoint file lists, have different file exclusions (cognitive-cc scans test
   files, cyclomatic-cc doesn't), and handle exit code 2 differently
   (cognitive-cc's exit 2 is non-blocking warn, cyclomatic-cc's exit 2 blocks
   push). cognitive-cc is also missing the DEBT-45639 `sync()` buffer-flush fix
   that cyclomatic-cc has — meaning cognitive-cc can intermittently report stale
   `.rc` file state on Windows.
4. **The state-file drift loop exists but not where I first thought.** Check
   scripts are PURE READERS (L4 proved it — running them produces zero drift).
   Drift comes from (a) the _logger scripts_ that the hook wrappers invoke —
   `log-override.js`, `append-hook-warning.js`, `hook-report.js`,
   `write_hook_runs_jsonl` — and (b) _background hooks_ firing outside push
   context — `session-start.js`, `track-agent-invocation.js`,
   `governance-logger.js`, `post-write-validator.js`, `commit-tracker.js`. The
   loop: these writes produce dirty tracked files, the next push sees them as
   "drift caused by my hooks" (incorrectly), the user commits them, those
   commits trigger MORE writes, cycle continues.
5. **18 skip sites in husky call `log-override.js`** which appends to
   `.claude/override-log.jsonl` — a git-tracked file. Every
   `SKIP_CHECKS="..." git push` adds a line of drift. Even `--no-verify` cannot
   fully break the loop because session hooks and other non-husky hooks continue
   to write state files.

Secondary findings that survived from taxonomy v1.0 (still real but lower
priority):

6. `pr-creep` message includes the commit count (`"10 commits on branch"`),
   defeating dedup on `type+message`. 7 duplicate active warnings.
7. `session-start.js:1316-1365` writes to `hook-warnings-log.jsonl` directly,
   bypassing `append-hook-warning.js` dedup. 19 of 46 log entries (41%) are
   bypass duplicates.
8. `propagation-staged` triggers on any use of good patterns like
   `sanitizeError(`, then scans 500+ sibling files. Two real unbaselined
   violations live in `scripts/lib/todos-mutations.js:171` and
   `scripts/planning/todos-cli.js:132, 144, 255, 262`.
9. `known-propagation-baseline.json` contains 50 dead entries (all `function:*`
   entries with no matching registry pattern IDs).

**Fix direction has changed significantly from my first pass.** My initial
taxonomy recommended fixing pr-creep, session-start, and propagation-staged.
Those are still real but they're noise in the log, not the pain the user feels
at push time. The REAL user pain is: cognitive-cc failing repeatedly on
render-todos.js, with a broken telemetry system hiding the frequency, compounded
by drift accumulation from logger scripts that makes each retry produce new
dirty files.

---

## 1. What my first pass got wrong

Brief accounting, because the user explicitly corrected me and I want this in
the record:

1. **Data source mistake.** I read `.claude/state/hook-warnings-log.jsonl`
   (append-only warning events) as the primary signal and missed
   `.claude/state/hook-runs.jsonl` (per-invocation telemetry with check-level
   outcomes). The warnings log only captures things that call
   `append-hook-warning.js`; it doesn't capture blocking check failures at all.
   I concluded "pre-push is fine" when in fact I was looking at the wrong log.

2. **Memory search skipped.** I didn't run episodic memory search at the start.
   `episodic-memory:search-conversations` exists for exactly this situation —
   the user hinted that there was prior context I should have. I found some of
   it eventually via the work-locale memory folder the user pointed me to.

3. **Scope mislabel.** I labeled `propagation-staged` as a "pre-push offender"
   when it's actually pre-commit. The user caught this in one turn.

4. **Process miss.** I used a single-threaded investigation pass when
   `feedback_deep_plan_hook_discovery_process.md` specifies a 5-layer
   multi-agent protocol for exactly this kind of infrastructure investigation. I
   should have spawned agents from the start instead of reading files
   sequentially myself.

5. **Merged the wrong concerns.** T39 listed concerns #2 (pre-push failures) and
   #3 (state file drift) as separate. They are the same problem, as confirmed by
   L4's ground-truth test. The drift IS the failure mechanism.

These mistakes are preserved in `.research/T39_SESSION_STATE.md` as a record.
The taxonomy v1.0 report (`T39_HOOK_FAILURE_TAXONOMY.md`) is no longer the
primary deliverable — this file replaces it.

---

## 2. Root cause #1 — pre-push failure-path trap is broken

### Evidence

`.husky/_shared.sh:7-10`:

```bash
add_exit_trap() {
  EXIT_TRAP_CHAIN="${EXIT_TRAP_CHAIN:+$EXIT_TRAP_CHAIN; }$1"
  trap "$EXIT_TRAP_CHAIN" EXIT
}
```

`.husky/pre-push:10-14`:

```bash
CHECKS_TMPFILE=$(mktemp)
add_exit_trap "rm -f '$CHECKS_TMPFILE'"                                           # call 1

# Record failure in hook-runs.jsonl if script crashes before normal recording
add_exit_trap 'HOOK_EXIT=$?; if [ "$HOOK_EXIT" -ne 0 ]; then write_hook_runs_jsonl "pre-push" "$CHECKS_TMPFILE" "0"; fi'   # call 2
```

After both calls, `EXIT_TRAP_CHAIN` contains:

```
rm -f '$CHECKS_TMPFILE'; HOOK_EXIT=$?; if [ "$HOOK_EXIT" -ne 0 ]; then write_hook_runs_jsonl "pre-push" "$CHECKS_TMPFILE" "0"; fi
```

### Failure mechanism (two compound bugs)

When any pre-push check calls `exit 1`, the EXIT trap fires and executes the
chain:

1. `rm -f '$CHECKS_TMPFILE'` — deletes the tmpfile. `rm -f` returns exit 0 on
   success.
2. `HOOK_EXIT=$?` — captures `rm`'s exit status, which is **0**, NOT the
   original script's failing exit. The original `exit 1` status is already lost
   at this point because `$?` has been overwritten by `rm`.
3. `if [ "$HOOK_EXIT" -ne 0 ]` — **always false**. Branch never executes.
4. `write_hook_runs_jsonl` — never called via the failure path.
5. **Independent bug**: even if the writer were called, `$CHECKS_TMPFILE` was
   already deleted in step 1. The writer would have nothing to read.

Both bugs must be fixed together. Fixing the order alone still leaves the
tmpfile-deletion race. Fixing the tmpfile alone still leaves `HOOK_EXIT`
capturing the wrong status.

### Impact

- **Telemetry gap confirmed.** `hook-runs.jsonl` shows 49 pre-push runs with
  outcomes `{warn: 41, pass: 8, fail: 0}`. Zero failures. This is not because
  pre-push passes reliably — it's because the failure logger can't fire. Every
  `exit 1` from a failing check is invisible to telemetry.
- **`/alerts` and `/pr-retro` cannot see pre-push pain.** Any tooling that reads
  `hook-runs.jsonl` to spot failure trends will incorrectly report pre-push as
  healthy.
- **User cannot demonstrate the problem with data.** When the user says
  "pre-push failed 10 times in a row," there is no on-disk evidence. That's
  exactly why this investigation took extra turns — the primary telemetry didn't
  match reality.
- **Success-path logger at line 652
  (`write_hook_runs_jsonl "pre-push" "$CHECKS_TMPFILE" "$TOTAL_MS"`) IS being
  called on successful runs.** That's why there are 49 entries — they're the
  runs that didn't hit `exit 1`. Failing runs just silently vanish.

### Fix shape (not implementation — user approval required)

Option A — Rewrite the failure trap to capture exit status first:

```bash
add_exit_trap 'HOOK_EXIT=$?; _cfile="$CHECKS_TMPFILE"; if [ "$HOOK_EXIT" -ne 0 ] && [ -s "$_cfile" ]; then write_hook_runs_jsonl "pre-push" "$_cfile" "0"; fi; rm -f "$_cfile"'
```

Install this as the ONLY trap. Capture `HOOK_EXIT=$?` as the very first
statement (before anything overwrites `$?`), then attempt the write if the
tmpfile still has content, then delete.

Option B — Add inline `write_hook_runs_jsonl` calls at every `exit 1` site in
pre-push (11+ sites). Defensive but verbose and error-prone.

Option C — Make `write_hook_runs_jsonl` self-cleanup: take a snapshot of tmpfile
content into a second file at step 1, then have the trap read the snapshot. More
files to manage.

**Recommended:** Option A. Single change, preserves existing call sites,
restores the intended semantics.

**Cross-locale compatible:** Yes. POSIX shell, no new tools.

**Reversibility:** Trivial. Single trap reinstallation can be reverted in
seconds.

**Risk:** Low. The change only affects the failure path, which currently does
nothing. Success path unchanged.

---

## 3. Root cause #2 — cognitive-cc has a real unfixed violation

### Evidence

Live run during investigation:

```
$ node scripts/check-cc.js
[check-cc] Cognitive complexity check (threshold: 15)
[check-cc] Checking 3 file(s)...
[check-cc] 1 function(s) exceed CC threshold of 15:
  FAIL  scripts/planning/render-todos.js:70  renderTodos  CC=22  (threshold: 15)
[check-cc] Summary: 3 files, 54 functions, 1 violations.
```

Exit code: **1** (block).

`scripts/planning/render-todos.js` was added during recent T30 work. Commit
trail:

- `9aba28c7 feat(T30): todos-cli mutation helper + regression-guarded JSONL writes`
- `62011639 fix(T30): pattern-compliance cleanup on todos-mutations.js`
- `93dc64af feat(T30): wire /todo skill to todos-cli for all JSONL mutations`

The file didn't exist at the 2026-03-30 baseline snapshot. It was never
baselined. Its `renderTodos` function is a rendering dispatcher with CC 22 —
just above the threshold.

### Impact

**Every push attempt that includes a .js file in cognitive-cc's scan scope hits
this.** cognitive-cc scans changed .js/.mjs files (staged in push diff). Any
push that touches any JS file runs the scan, which reads `render-todos.js`
(because it's changed recently in the push range), which fires on `renderTodos`,
which exits 1, which blocks push.

This explains the "10 failures in a row" pattern. It's not a flake. It's the
same check hitting the same violation on every retry, because the violation is
persistent.

User's options to unblock are:

- Refactor `renderTodos` to reduce CC ≤ 15
- Baseline `render-todos.js` in `cognitive-complexity` sub-key of
  `known-debt-baseline.json`
- Use `SKIP_COG_CC="..."` on every push (which writes to `override-log.jsonl`
  and starts the drift loop)

### Fix shape

**Immediate:** Either refactor `renderTodos` OR baseline it. Both are
reversible. Refactor is the principled fix; baseline is the pragmatic one.

Refactor path — look at lines near `scripts/planning/render-todos.js:70`,
identify the nesting + branching that drives CC 22, extract helper functions.
Target CC ≤ 15. Likely a 20-50 line change to one file.

Baseline path — `node scripts/check-cc.js --update-baseline` (if that flag
exists per L3's analysis) or manually add
`"scripts/planning/render-todos.js": 22` under
`baselines["cognitive-complexity"]` in `.claude/state/known-debt-baseline.json`.

**Cross-locale compatible:** Yes for both. **Reversibility:** Both reversible.
**Risk:** Low. Refactor could introduce bugs; baseline defers the debt.

**Recommendation:** Refactor. It's the last T30 loose end and the file is new
enough that rewriting a single function is cheap. Baselining new code is a
smell.

---

## 4. Root cause #3 — cognitive-cc vs cyclomatic-cc systemic disconnect

Even after fixing render-todos, the two checks will continue to diverge.
Evidence from L3:

### Different baselines with disjoint files

Both checks read `.claude/state/known-debt-baseline.json`, but from different
sub-keys:

- `baselines["cyclomatic-complexity"]` — 3 entries:
  `scripts/cas/migrate-schemas.js` (36), `scripts/cas/migrate-v3.js` (47),
  `scripts/cas/self-audit.js` (16)
- `baselines["cognitive-complexity"]` — 4 entries:
  `.claude/hooks/session-start.js` (21), `scripts/check-pattern-compliance.js`
  (36), `scripts/check-triggers.js` (34),
  `scripts/generate-documentation-index.mjs` (22)

The sets are **completely disjoint**. No file appears in both. That's not
necessarily wrong — different metrics naturally flag different files — but it
means fixes to one baseline don't help the other.

### Different file exclusions

`scripts/check-cyclomatic-cc.js:172-193` excludes 11 patterns including
`.test.`, `.spec.`, `tests/`, `.planning/`, `eslint-plugin-sonash/`,
`scripts/reviews/dist/`, etc.

`scripts/check-cc.js:546-554` excludes only 5 directory patterns:
`node_modules`, `.next/`, `dist/`, `dist-tests/`, `consolidation-output/`.

**cognitive-cc scans test files that cyclomatic-cc skips.** Test files often
have high cognitive complexity (lots of `describe`/`it` blocks, nested
setup/teardown) without being "real" violations.

### Different exit-code handling

`.husky/pre-push:506-551` handles parallel group results:

- cyclomatic-cc exit 0 → pass; exit 1 → block; exit 2 → **block (treated as
  fatal error)**
- cognitive-cc exit 0 → pass; exit 1 → block; exit 2 → **warn only, continue**

The asymmetry is deliberate — cognitive-cc is the newer check and the team
wanted it non-fatal on errors — but it means cognitive-cc can silently degrade
to "warning" mode when the script has internal errors, while cyclomatic-cc
hard-blocks.

### cognitive-cc is missing the DEBT-45639 sync() fix

`scripts/check-cyclomatic-cc.js` has a `sync()` call after writing `.rc` files
to flush the Windows OS buffer (added for DEBT-45639 — intermittent empty `.rc`
files on MSYS/Windows).

`scripts/check-cc.js` does NOT have this fix. It writes `.rc` files the same way
but without the flush. **cognitive-cc can intermittently report stale `.rc`
state on the home locale (Windows).** This may contribute to the "sometimes
cognitive-cc warns, sometimes it doesn't" pattern.

### check-cc.js has a diagnostic capture for a known flake

`scripts/check-cc.js:689-726` writes uncaught exception context to
`.claude/state/cc-check-last-error.json`. Comment at line 690 says "DEBT-45635
reports intermittent exit 2 from pre-push cognitive-cc checks with no
reproducer." The check is known to be flaky and the diagnostic infrastructure
was added to troubleshoot.

### Impact

- **User-visible:** Fixing one CC check doesn't visibly fix the other. If user
  refactors a function to improve cyclomatic CC, cognitive CC may still flag it
  (different metric).
- **Baseline maintenance is doubled.** Two sub-keys to keep in sync.
- **cognitive-cc has an active race condition on Windows.** Could cause spurious
  failures.

### Fix shape

Four concrete actions, compounding:

1. **Port DEBT-45639 sync() fix to check-cc.js.** One-line addition after the
   `.rc` file write. Eliminates the Windows buffer race.
2. **Align file exclusions.** Copy cyclomatic-cc's 11 exclusion patterns into
   check-cc.js. Reduces false positives in test code.
3. **Harmonize exit code 2 handling.** Pick one semantic — either both block on
   exit 2 (safer) or both warn (more permissive). Probably block, since "the
   check errored" is a real problem worth surfacing.
4. **Document the metric difference in one place.** Short doc explaining
   "cyclomatic measures branch count, cognitive measures branch count + nesting
   multiplier + comprehension difficulty. Fixing one doesn't fix the other."
   Prevents future confusion.

**Cross-locale compatible:** Yes. All are code-only changes to existing scripts.
**Reversibility:** Trivial. All are small, atomic changes. **Risk:** Low.

---

## 5. Root cause #4 — state file drift from logger scripts + background hooks

### What L4 proved

L4 ran 6 check scripts in isolation and captured `git status --porcelain`
before/after each. **Result: zero drift.** Every diff was empty.

Scripts verified clean:

- `scripts/check-propagation-staged.js`
- `scripts/check-propagation.js`
- `scripts/check-cc.js`
- `scripts/check-cross-doc-deps.js`
- `scripts/check-pattern-compliance.js`
- `scripts/check-doc-headers.js`

**My initial hypothesis ("checks mutate state files during their run") is
falsified.** Check scripts are pure readers.

L4 also confirmed: the 10 tracked files dirty at the start of this session were
already dirty before L4 began. They came from earlier hook runs — not from
anything L4 or the checks did.

### Where drift actually comes from (L2 + L4)

**Category A — Logger scripts invoked by hook wrappers during
pre-commit/pre-push:**

| Script                              | Writes to                                                                                     | Called from                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `scripts/log-override.js`           | `.claude/override-log.jsonl` (append)                                                         | 18 skip sites in pre-commit + pre-push                                                            |
| `scripts/append-hook-warning.js`    | `.claude/hook-warnings.json` (atomic write), `.claude/state/hook-warnings-log.jsonl` (append) | 9 sites in pre-push (warn/fail paths) + 14+ sites in pre-commit                                   |
| `scripts/hook-report.js`            | `.git/hook-output.log` (append)                                                               | `.husky/pre-push:649` (end of hook)                                                               |
| `_shared.sh::write_hook_runs_jsonl` | `.claude/state/hook-runs.jsonl` (append)                                                      | `.husky/pre-push:652`, `.husky/pre-commit:757` (end of hook); also failure trap (broken — see R1) |

These are ALL invoked DURING hook execution. So when a user runs `git push`:

1. Pre-push wrapper fires
2. Checks run (pure readers — no drift)
3. Checks write check-status lines to `$CHECKS_TMPFILE` (local tmpfile, cleaned
   up by trap — no drift)
4. On the success path: `generate_hook_summary` + `hook-report.js` +
   `write_hook_runs_jsonl` run → **writes to `.git/hook-output.log` +
   `.claude/state/hook-runs.jsonl`** → `.claude/state/hook-runs.jsonl` is
   tracked in git → **drift**
5. If any check WARN'd: `append-hook-warning.js` was called inline → **writes to
   `.claude/hook-warnings.json` + `.claude/state/hook-warnings-log.jsonl`** →
   both tracked → **drift**
6. If any check was skipped via SKIP_CHECKS: `log-override.js` was called →
   **writes to `.claude/override-log.jsonl`** → tracked → **drift**

Every successful pre-push run generates 1-3 dirty tracked files. Every warning
run generates more. Every skip generates more.

**Category B — Background hooks (non-husky) firing outside push context:**

| Hook                                      | Fires when                                    | Writes to (tracked)                                                                                                                                                                                                                                                 |
| ----------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/hooks/session-start.js`          | Start of every Claude session                 | `.claude/hook-warnings.json`, `.claude/state/hook-warnings-log.jsonl`, `.claude/state/consolidation.json`, possibly `.claude/state/learning-routes.jsonl`, `.claude/state/pending-refinements.jsonl`, `docs/LEARNING_METRICS.md`, `docs/AI_REVIEW_LEARNINGS_LOG.md` |
| `.claude/hooks/commit-tracker.js`         | PostToolUse after every commit                | `.claude/state/agent-invocations.jsonl`                                                                                                                                                                                                                             |
| `.claude/hooks/track-agent-invocation.js` | PostToolUse after every Agent tool invocation | `.claude/state/agent-invocations.jsonl`                                                                                                                                                                                                                             |
| `.claude/hooks/governance-logger.js`      | Various PreToolUse/PostToolUse                | Governance state files                                                                                                                                                                                                                                              |
| `.claude/hooks/post-write-validator.js`   | PostToolUse after every Write/Edit            | Validation state files                                                                                                                                                                                                                                              |

These hooks fire during normal Claude operation. A user who opens a session, has
Claude do 20 things (writes, commits, agent dispatches), will accumulate drift
across 5+ files BEFORE ever running `git push`.

**When the user eventually pushes, pre-push sees a dirty working tree. Pre-push
checks that diff against HEAD (like `pattern-compliance-push`, `propagation`,
`code-reviewer-gate`) see these drifted files as part of the push diff and run
checks against them.** The user didn't intend to push
`.claude/state/hook-warnings-log.jsonl` — it just happens to be dirty.

### The drift loop, refined

1. Claude session starts. `session-start.js` writes to 5+ tracked state files.
   Drift accumulates silently.
2. User does work, triggers commit-tracker, track-agent-invocation,
   governance-logger, post-write-validator. More drift.
3. User runs `git push`.
4. Pre-push wrapper fires. Checks run against working-tree diff, which includes
   all the drifted state files.
5. Some check fails — likely `cognitive-cc` (root cause #2 above, hitting
   `render-todos.js`).
6. Because the failure-path trap is broken (root cause #1), the failure is
   invisible to telemetry.
7. User retries with `SKIP_COG_CC=1 SKIP_REASON="..." git push`.
8. `.husky/pre-push:432` catches the skip → `log-override.js` appends a line to
   `.claude/override-log.jsonl`. More drift.
9. Other checks run. Some produce warnings. `append-hook-warning.js` writes to
   `.claude/hook-warnings.json` + `hook-warnings-log.jsonl`. More drift.
10. Success-path logger at line 652 writes `hook-runs.jsonl`. More drift.
11. Push succeeds.
12. `git status` now shows 5-8 dirty files. User can't leave them dirty because
    other work will commit them accidentally.
13. User commits the drift explicitly:
    `f293e4dd chore: post-push hook state drift (PR #505 R1 cycle)`.
14. That commit's pre-commit hook runs. More writes to `append-hook-warning.js`
    and `hook-warnings-log.jsonl`. More drift.
15. User's next push fails again (same `render-todos.js` violation, or a new
    warning from the drift itself).
16. Repeat. 10+ cycles.
17. `--no-verify` bypasses one iteration of pre-push/pre-commit, but session
    hooks and post-tool-use hooks still write state files outside the git hook
    chain.
    `f30875f6 chore: final override-log drift capture (--no-verify to break loop)`
    — one line added to override-log.jsonl even after --no-verify.

### The `--no-verify` puzzle

L2's trace revealed: `--no-verify` skips pre-commit and pre-push
(husky-installed hooks), but does NOT skip:

- Claude Code's own hooks (`session-start.js`, `commit-tracker.js`,
  `post-write-validator.js`, etc.)
- Manual script invocations

The `override-log.jsonl` drift even during `--no-verify` was most likely written
by either (a) Claude's PostToolUse hook firing when the commit tool was used,
(b) a manual invocation the user ran, or (c) an older script that appended the
entry before the --no-verify push.

This means **there is no single "off switch" for drift.** Skipping git hooks
doesn't stop state accumulation. Only disabling Claude's own hooks or changing
the files to be untracked does.

### Fix shape

Several options, NOT mutually exclusive:

**F1 — Move state files to `.gitignore` and rebuild consumers to not expect them
tracked.** Highest leverage, most disruptive. Would eliminate the drift loop
entirely because the writes wouldn't produce git status changes. Requires:

- Add `.claude/state/*.jsonl`, `.claude/state/*.json`,
  `.claude/override-log.jsonl`, `.claude/hook-warnings.json` to `.gitignore`
- `git rm --cached` each of those files
- Update any script that expects the file to be tracked (e.g., `/alerts` reading
  them from `git show HEAD:...`)
- Update `hook-checks.json` `writes_to` annotations
- Document the change in CLAUDE.md

Cross-locale concern: if files are untracked, they don't sync across locales via
git. User's `project_cross_locale_config.md` memory says "Shared via git:
CLAUDE.md, codebase, .claude/state/, .planning/, .research/". **This is a
DECISION that state files SHOULD sync.** So F1 conflicts with an explicit
cross-locale design choice. User must confirm before this option is viable.

**F2 — Auto-stage drift files at the end of every successful pre-push.** Medium
leverage. Requires the hook to `git add` the files it just wrote. Must be atomic
to avoid tripping fresh checks. Risk: hooks modifying the index during a push is
a subtle operation — may affect downstream hooks or other git commands. Also,
`git add` during pre-push ADDS to the push diff, which the PUSH has already
computed — the newly-added content won't actually get pushed.

**F3 — Queue state writes and flush only at session-end.** Low-risk but requires
per-hook opt-in. Each writer buffers to an in-memory queue or tmpfile, and a
single flush at session-end commits them. Changes semantics of the writers (no
more "live" state during a session).

**F4 — Keep state tracked but stop writing during hook runs.** Hook runs should
NOT be the main writers. Session-start can continue writing at session start
(one big write). Pre-push should not write to tracked state at all. This
requires moving `log-override.js` writes to a separate flush step, moving
`append-hook-warning.js` writes to a pending queue, etc. Large surface area but
preserves the cross-locale sync design.

**F5 — Hybrid: move only override-log.jsonl and hook-runs.jsonl to untracked,
keep the rest tracked.** These two are the highest-churn writes during hook
runs. Everything else mostly fires at session boundaries. Smaller change than
F1. Still needs `/alerts` / `/pr-retro` updates.

**Recommended priority order for discussion:**

1. **Do F5 first** — move the 2 highest-churn files to untracked, keep the
   audit-trail files (`learning-routes`, `review-metrics`, `agent-invocations`)
   tracked. Smallest change, biggest immediate relief.
2. **Then F4 piecemeal** — move the remaining mid-frequency writers to
   batched/flushed writes.
3. **Reserve F1 as nuclear option** — only if F5+F4 don't reduce drift enough.

All options are **cross-locale compatible** (they change what's tracked, not
what tools are required).

All are **reversible in principle** (git revert the .gitignore addition,
re-track files). Practically, F1 is harder to revert because once files have
been untracked, their history is gone until they're re-committed.

---

## 6. Secondary findings (preserved from taxonomy v1.0, still real)

These are the pre-commit and session-start issues from my first pass. They're
real but not the source of the user's pre-push pain. Including for completeness.

### S1 — pr-creep message includes commit count

`.husky/pre-commit:82`:

```bash
node scripts/append-hook-warning.js --hook=pre-commit --type=pr-creep --severity=info \
  --message="$COMMIT_COUNT commits on branch" \
  --action="Create PR: gh pr create"
```

Dedup in `append-hook-warning.js` keys on `type+message`. Message includes
`$COMMIT_COUNT` literal, so every commit count creates a new warning entry. 7
duplicate active pr-creep warnings in `hook-warnings.json` (counts 10 through
16).

**Fix:** Stable message (`"Branch has >=10 commits (create PR soon)"`), put
count in a `--pattern` or new `--count` field. `.husky/pre-commit` + minor
change to `append-hook-warning.js`.

### S2 — session-start.js bypasses append-hook-warning.js dedup

`.claude/hooks/session-start.js:1316-1365` writes directly to
`hook-warnings-log.jsonl` via `fs.appendFileSync`. No `occurrences` counter, no
ack check, no dedup. 19 of 46 log entries (41%) are bypass-originated
duplicates.

Affected types: `review-lifecycle`, `tdms-s0`, `session-end-missing`,
`cli-tools-missing`.

**Fix:** Route session-start warnings through `append-hook-warning.js`. Large
code change in one file (replace ~50 lines with loop calling
append-hook-warning.js). Edge case: the original code sets timestamps 1s AFTER
`lastCleared` to "survive" concurrent clears. Fix must preserve that semantic
(or prove it's unnecessary).

### S3 — propagation-staged scans 500+ files on GOOD pattern trigger

`scripts/check-propagation-staged.js` triggers on the positive pattern (e.g.,
`sanitizeError(`) and scans all 500+ tracked `scripts/**/*.js` files for
anti-patterns. Pre-existing unbaselined violations block commits to files that
didn't touch the bad code.

**Reproduced** during investigation: staging `scripts/_t39_fake.js` with
`sanitizeError(` → triggers → finds 2 real unbaselined violations:

- `scripts/lib/todos-mutations.js:171` — `throw new Error(\`parse error at line
  ${i + 1}: ${err.message}\`)`
- `scripts/planning/todos-cli.js:132, 144, 255, 262` — 4 raw `err.message` uses

These files were added during T30 work (post-2026-03-30 baseline snapshot),
never baselined.

**Fix options:**

- **S3a** — Fix the 5 real violations. Wrap with `sanitizeError(err)`. Trivial
  edits.
- **S3b** — Baseline the 5 violations. Add to
  `scripts/config/known-propagation-baseline.json`.
- **S3c** — Change propagation-staged trigger to fire on the ANTI-pattern in
  added diff lines (not the good pattern). Eliminates the scope mismatch
  entirely. Larger change.

S3a is recommended. S3c is a follow-up for later.

### S4 — 50 dead entries in known-propagation-baseline.json

Baseline contains `function:*` entries (23 `function:issues`, 7
`function:loadBaseline`, etc.) that aren't consumed by the current registry. 3
`pattern:path-containment` entries with a key that doesn't match any registry
pattern ID. These suppress nothing.

**Fix:** Audit `scripts/check-propagation.js` (pre-push) to verify it doesn't
consume `function:*` entries. If it doesn't, delete them. If it does, either
migrate them into the registry or document the dual-use.

### S5 — `.claude/state/warned-files.json` is an orphan

L2 found: the file is git-tracked (has diffs in commit `f20761d7`), but NO
script writes to it anywhere in the current codebase. It's a zombie file from an
old implementation.

**Fix:** Either find a writer (maybe in an archived script), remove the file, or
document why it's tracked. Small cleanup.

---

## 7. Constraints from prior hook-system decisions

From `.planning/archive/hook-system-overhaul/DECISIONS.md` (44 decisions,
2026-03-16), the ones that directly constrain fix options:

| Decision | Text                                                                                                                                    | Constraint                                                                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D4**   | Error-severity warnings in hook-warnings.json block push at escalation gate. Gate reads hook-warnings.json, exits 1 if unack'd entries. | Cannot remove escalation gate. Must keep it functional.                                                                                                                                        |
| **D6**   | `.claude/state/hook-runs.jsonl` — one line per hook invocation with check names, exit codes, commit hash.                               | Must continue to write this file. Broken failure-path trap (root cause #1) VIOLATES this decision — the trap was installed per D6 intent but is non-functional. Fix is required to fulfill D6. |
| **D7**   | Per-check timing via `date +%s%N`.                                                                                                      | Pre-push uses parallel-group timing, so individual checks inside `type-cc-checks` aren't individually timed. This is acceptable per D7's intent (per-check where practical).                   |
| **D9**   | `hook-warnings.json` is JSON (state/config), not data. JSONL audit trail is canonical per T2.                                           | hook-warnings.json is a cache view. Writes to it are OK as long as they can be regenerated from hook-warnings-log.jsonl.                                                                       |
| **D14**  | Full v1 manifest at `scripts/config/hook-checks.json`. CANON artifact.                                                                  | Cannot change hook-checks.json schema without SWS plan update. New check fixes can update `writes_to`/`reads_from`/`actions` fields but not structural schema.                                 |
| **D16**  | session-start regenerates hook-warnings.json FROM hook-warnings-log.jsonl. JSONL is canonical.                                          | session-start.js:1316-1365 bypass (S2) is a D16 violation — the bypass writes directly to the JSONL canonical source without going through the dedup wrapper. Fix preserves D16.               |
| **D19**  | Three paths to unblock escalation: (1) fix issue, (2) session-begin conversation ack, (3) SKIP_WARNINGS bypass. No manual CLI command.  | Cannot add a new "ack this warning" CLI. Must work within the 3 paths.                                                                                                                         |
| **D20**  | hook-runs.jsonl schema: hook, timestamp, branch, checks array, total_duration, outcome, commit, skipped, warnings, errors.              | Schema is locked. Cannot drop fields. Can add fields.                                                                                                                                          |
| **D21**  | Entry-based rotation: 200 entries, keep 100 (matches override-log pattern).                                                             | Current hook-runs.jsonl is at 169 entries. Will rotate at 200. Don't fight this.                                                                                                               |
| **D25**  | Wire hook-runs.jsonl into /alerts. Hook completeness dimension.                                                                         | /alerts may be reading hook-runs.jsonl. Cannot break data format or remove entries suddenly.                                                                                                   |
| **D30**  | Separate `.claude/state/hook-warnings-ack.json` for ack state.                                                                          | Keep ack state separate from warnings state.                                                                                                                                                   |

**Key implication for root cause #1 fix:** The failure-path trap repair is not
just a bug fix — it's required to fulfill D6 (per-invocation logging) and D25
(/alerts integration). Currently, D6 and D25 are functionally broken because
pre-push failures don't reach hook-runs.jsonl. Fixing R1 brings the system into
compliance with existing decisions.

**Key implication for root cause #4 fix:** Any option that changes
`.claude/state/*` tracking has to preserve D6/D9/D20 semantics. F5 (untrack
override-log and hook-runs.jsonl) requires checking whether /alerts (D25)
depends on those specific files being in git history. Likely not — /alerts reads
the current file state — but verification is needed.

---

## 8. Cross-locale verification

User has two locales: `C:\Users\jason\...` (home, unrestricted) and
`C:\Users\jbell\...` (work, corporate IT restrictions — no admin, no global
installs, no PATH mods). From `project_cross_locale_config.md`: any fix path
requiring admin or global installs is DOA at the work locale.

L5 verified all pre-push dependencies:

- `fnm` — optional, falls back to system Node. Work-locale friendly.
- `Node.js` — required. System Node works.
- `npm` — required. Bundled with Node.
- `git` — required. System git assumed.
- `gitleaks` — optional (pre-commit skips if missing). Work-locale friendly.
- `madge` — local npm dev dependency (`npx madge`). Work-locale friendly.
- `eslint`, `lint-staged`, `prettier` — local npm dev deps. Work-locale
  friendly.

**No global installs required for any fix option in this report.** All fixes are
code-level changes to existing scripts or config. Cross-locale compatible.

**One caveat:** The "DEBT-45639 sync() fix" for check-cc.js (root cause #3) is a
Windows-specific fix. Won't break non-Windows but has no effect there. Safe
everywhere.

---

## 9. What this investigation did NOT verify

Honest list of remaining unknowns, so the next session doesn't have to
re-discover them:

1. **Exact line numbers in session-start.js for every tracked-state write.** L2
   found the writers categorically but I did not do a line-by-line audit of
   session-start.js (47KB file). An audit would identify every exact write point
   and help scope F4 (move writes out of hook runs).

2. **Whether `/alerts` and `/pr-retro` actually read `hook-runs.jsonl` via git
   history or just current file state.** D25 wired hook-runs.jsonl into /alerts
   but the implementation details weren't verified. Matters for F5 (untracking
   hook-runs.jsonl) — if /alerts relies on git history, untracking breaks it.

3. **Whether there's a post-commit or post-push husky hook.** L1's scan only
   found `pre-commit` and `pre-push` in `.husky/`. Assumed no post-commit hook.
   Worth verifying by `ls .husky/` — actually that was checked, only pre-commit*
   and pre-push* exist as executable files. Confirmed: no post-commit or
   post-push husky hooks. All post-commit work happens via Claude hooks in
   `.claude/hooks/`.

4. **Whether `.claude/state/warned-files.json` is truly an orphan or has a
   writer in archived scripts.** L2 couldn't find a writer. Worth a deeper
   search including `docs/archive/` and `.planning/archive/` scripts.

5. **Whether the drift loop reproduction needs a live multi-push attempt.** L4
   ran checks in isolation (innocent). L4 did NOT run a real `git push` loop to
   reproduce the drift → check → fail → skip → drift cycle. A full end-to-end
   reproduction would provide the definitive evidence trail but requires user
   permission to push (and undo).

6. **Whether cognitive-cc on render-todos.js is the ACTUAL check that failed 10+
   times in PR #505.** I'm inferring from the current state of check-cc.js and
   the current state of render-todos.js. PR #505's merge happened before
   render-todos.js was created — the file's earliest commit (`9aba28c7`) is
   AFTER the PR #505 merge (`1399890e`). So PR #505's failures were NOT about
   render-todos.js. They were about something else. **User memory required to
   identify.** Likely candidates: propagation-staged on a different unbaselined
   file, the old cognitive-cc flake (DEBT-45635), a pattern-compliance violation
   from a recent security fix. Worth asking before fixing.

7. **Whether the work locale has `.claude/` or `.claude/state/` as symlinks.**
   L5 noted the symlink guard in `append-hook-warning.js` can silently abort
   writes if it detects a symlink. If the work locale symlinks any path
   component (corporate IT sometimes does this for home-directory redirection),
   all state writes would silently fail at work. Not verified.

8. **Exact list of background hooks that write tracked state.** L2 named the
   main suspects (`session-start.js`, `commit-tracker.js`,
   `track-agent-invocation.js`, `governance-logger.js`,
   `post-write-validator.js`) but did not audit every hook in `.claude/hooks/`
   for writes. ~20 hook files exist total.

---

## 10. Fix catalog — consolidated priority list

All fixes listed with: priority rank, affected files, effort, risk,
reversibility, cross-locale status, constraint compliance. **No fix is
authorized yet.** This is a menu for user decision.

| #         | Fix                                                  | Root cause | Files                                                             | Effort                     | Risk                        | Reversibility                       | Cross-locale            | D-constraints                 |
| --------- | ---------------------------------------------------- | ---------- | ----------------------------------------------------------------- | -------------------------- | --------------------------- | ----------------------------------- | ----------------------- | ----------------------------- |
| **R1**    | **Rewrite pre-push failure trap**                    | #1         | `.husky/pre-push:10-14` (+ maybe `_shared.sh`)                    | Small                      | Low                         | Trivial                             | ✓                       | Fulfills D6, D25              |
| **R2a**   | **Refactor `renderTodos` to CC≤15**                  | #2         | `scripts/planning/render-todos.js:~70` (likely 20-50 lines)       | Medium                     | Low                         | Trivial (revert one file)           | ✓                       | None                          |
| **R2b**   | Baseline render-todos.js in cognitive-cc baseline    | #2         | `.claude/state/known-debt-baseline.json` (1 entry)                | Trivial                    | Low                         | Trivial                             | ✓                       | None                          |
| **R3a**   | Port DEBT-45639 sync() to check-cc.js                | #3         | `scripts/check-cc.js` (1 line)                                    | Trivial                    | Low                         | Trivial                             | ✓                       | None                          |
| **R3b**   | Align file exclusions (cyclomatic-cc → cognitive-cc) | #3         | `scripts/check-cc.js:546-554`                                     | Small                      | Low                         | Trivial                             | ✓                       | None                          |
| **R3c**   | Harmonize exit code 2 handling                       | #3         | `.husky/pre-push:532-551`                                         | Small                      | Low-Med                     | Easy                                | ✓                       | D6 (both should log)          |
| **R4-F5** | **Untrack override-log.jsonl + hook-runs.jsonl**     | #4         | `.gitignore`, maybe `/alerts` reader, maybe docs                  | Medium                     | Med-High                    | Medium (must re-commit to re-track) | ✓                       | Must verify D25 compatibility |
| **R4-F4** | Move hook-run writes out of husky (piecemeal)        | #4         | Multiple scripts + hooks                                          | Large                      | Med                         | Per-change reversible               | ✓                       | D9, D16 preserved             |
| **R4-F1** | Untrack ALL .claude/state                            | #4         | `.gitignore`, many consumers                                      | Large                      | High                        | Hard                                | Risks cross-locale sync | Possible D25 break            |
| **S1**    | Stable pr-creep message                              | Secondary  | `.husky/pre-commit:82` + maybe `append-hook-warning.js`           | Small                      | Low                         | Trivial                             | ✓                       | None                          |
| **S2**    | Route session-start through append-hook-warning      | Secondary  | `.claude/hooks/session-start.js:1316-1365`                        | Medium                     | Med (concurrent-clear race) | Reversible                          | ✓                       | D16 preserved                 |
| **S3a**   | Fix 5 real err.message violations                    | Secondary  | `scripts/lib/todos-mutations.js`, `scripts/planning/todos-cli.js` | Trivial                    | Low                         | Trivial                             | ✓                       | None                          |
| **S3c**   | Change propagation-staged trigger to anti-pattern    | Secondary  | `scripts/check-propagation-staged.js`                             | Medium                     | Med                         | Reversible                          | ✓                       | D14 field update only         |
| **S4**    | Remove 50 dead baseline entries                      | Secondary  | `scripts/config/known-propagation-baseline.json`                  | Small (after verification) | Low                         | Trivial                             | ✓                       | None                          |
| **S5**    | Investigate `.claude/state/warned-files.json` orphan | Secondary  | Search + delete or document                                       | Small                      | Low                         | Trivial                             | ✓                       | None                          |

### Recommended sequence (for discussion)

If I were recommending an order without any user input:

1. **R1** — rewrite failure trap. Unblocks telemetry. Required for all
   downstream diagnostics.
2. **R2a** — refactor renderTodos. Removes the active pre-push block. Immediate
   user relief.
3. **R3a** — port sync() fix. Removes the cognitive-cc Windows race.
4. **R3c** — harmonize exit code 2 handling. Consistent error behavior across CC
   checks.
5. **S1** — pr-creep stable message. Reduces noise.
6. **S3a** — fix 5 err.message violations. Unblocks propagation-staged for files
   using sanitizeError.
7. **R4-F5** — untrack override-log.jsonl + hook-runs.jsonl. Major drift
   reduction. Requires user buy-in.
8. **S2** — session-start dedup routing. Medium complexity, medium relief.
9. **R3b** — cognitive-cc baseline align. Cleanup.
10. **S4, S5** — cleanup items.
11. **R4-F4 / R4-F1** — larger drift fixes. Only after the first 10 items are
    done and impact is measured.

---

## 11. Open questions for user

Before any fix lands:

1. **PR #505 ground truth.** Do you remember which exact check kept failing in
   the PR #505 retry loop? Was it `cognitive-cc`, `propagation-staged`,
   `cross-doc-deps`, `pattern-compliance-push`, something else? Knowing this
   validates (or adjusts) the priority. My inference points at cognitive-cc +
   drift-loop but the render-todos.js violation is too new to have been the PR
   #505 trigger.

2. **Cross-locale `.claude/state/` sync.** `project_cross_locale_config.md` says
   state files are shared via git. Is that still the design, or has it drifted?
   If still the design, F5 and F1 need careful rethinking — maybe the write
   queue has to persist across sessions via some OTHER sync mechanism.

3. **D25 `/alerts` reliance on hook-runs.jsonl being tracked.** Do you know, or
   should I investigate? If /alerts just reads the current file, F5 is safe. If
   it does git-log queries, F5 breaks it.

4. **R2 fix mode:** refactor or baseline?
   - Refactor is the right long-term answer
   - Baseline is faster and lets you come back later
   - I recommend refactor since render-todos.js is brand-new code and baselining
     it is a code smell
   - But if your attention is elsewhere, baseline is fine

5. **Priority override.** The recommended sequence above starts with R1 (failure
   trap) → R2a (refactor) → R3a (sync fix). If you'd rather tackle the drift
   loop directly (R4-F5), that's fine — it's more disruptive but more impactful.
   Your call.

6. **Single commit or per-fix commits?** Per-fix is cleaner for code review and
   bisect. Bundled is faster. Your preference.

7. **One session or split?** R1 + R2a + R3a + R3c + S1 could fit in one session
   (~5 small changes). R4-F5 deserves its own session because of the `/alerts`
   verification work. S2 session-start routing needs its own session because of
   the concurrent-clear race edge case.

8. **Should I read the remaining 27 unread work-locale memory files** before
   finalizing the fix sequence? I have `feedback_commit_hook_state_files.md`,
   `project_propagation_fix.md`, `feedback_pr_timing.md`,
   `feedback_deep_plan_hook_discovery_process.md`,
   `project_hook_contract_canon.md`, `project_cross_locale_config.md`,
   `feedback_ack_requires_approval.md`,
   `feedback_never_defer_without_approval.md`, `sws_session221_decisions.md`,
   `feedback_no_session_end_assumptions.md`,
   `project_work_locale_constraints.md`. The remaining 27 files might surface
   more constraints.

---

## 12. Completion criteria for T39 concern #2+#3

The investigation phase is complete when:

- [x] Session state checkpointed (`.research/T39_SESSION_STATE.md`)
- [x] 5-layer discovery run (all 5 layers returned findings)
- [x] Critical finding (R1 failure trap) verified by direct file read, not just
      agent claim
- [x] Deep-dive report written (this file)
- [ ] User acknowledges findings and picks a fix priority
- [ ] User approves sequence + commit mode

The T39 concern #2+#3 is NOT closed by this report. The report is the "research
phase" deliverable. Fix implementation is a separate, user-approved phase.

T39 concern #1 (full `/hook-ecosystem-audit` diagnostic) is a SEPARATE pass and
can run independently. Some overlap with R1/R3/R4 above, but the audit has
broader scope.

---

## 13. Revision log

| Version | When       | Change                                                            |
| ------- | ---------- | ----------------------------------------------------------------- |
| 1.0     | 2026-04-10 | Initial synthesis after 5-layer discovery                         |
| 1.1     | 2026-04-10 | Post-implementation corrections discovered during fix application |

## 14. Corrections surfaced during implementation (v1.1)

1. **R3a (sync() fix) — already present.** Line 480 of `.husky/pre-push` already
   has the `sync` buffer-flush call in cognitive-cc's background job — same
   shape as cyclomatic-cc line 475 and tsc line 469. L3's finding was about
   script internals vs shell level — the shell-level orchestration already has
   the flush. No fix needed.

2. **S4 (dead baseline entries) — smaller than reported.** Only 3
   `pattern:path-containment` entries are dead. The 47 `function:*` entries are
   LIVE — consumed by `scripts/check-propagation.js:608, 623` via
   `isBaselined(baselineEntries, "function", m.funcName, loc.file)`. Verified by
   reading the script directly. Removing function:\* entries would have broken
   pre-push propagation checks.

3. **S5 (warned-files.json) — NOT an orphan.**
   `scripts/check-pattern-compliance.js` is both the writer (lines 91-139, via
   the `WARNED_FILES_PATH` constant) and the reader (line 2602). It is the
   "graduation system" state file — tracks which files have been warned for
   which patterns under the warn-once-block-on-repeat policy. L2's writer search
   grepped for the literal filename and missed the constant-referenced writes.
   File is legitimately tracked and has a purpose.

4. **FIX 4 direction inverted from original plan.** Original recommendation was
   to make cognitive-cc block on exit 2 (match cyclomatic-cc). User chose the
   opposite: make cyclomatic-cc warn on exit 2 (match cognitive-cc). Rationale:
   "we can fix on review if necessary" — exit 2 is a script error, not a
   violation, so blocking push on it is overkill. Both checks now warn+continue
   on exit 2.

5. **pre-push propagation check shows pre-existing T30-era function-propagation
   warnings** (nextId, serializeJsonl, parseArgs) at exit 0. These are warnings
   only, not blockers. Not addressed in this T39 commit — they're T30 follow-up
   items and a separate todo.
