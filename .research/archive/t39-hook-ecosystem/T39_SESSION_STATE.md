# T39 Session State — Compaction Checkpoint

**Created:** 2026-04-10 **Status:** Investigation paused at "dispatching 5-layer
discovery" phase **Purpose:** Survive context compaction. Everything found in
this session lives here. **DO NOT treat as final report** — the authoritative
output is `.research/T39_DRIFT_LOOP_DEEP_DIVE.md` (written after agents return).

---

## Why this investigation exists

T39 todo (P2, pending) — 3-part hook investigation:

1. `/hook-ecosystem-audit` structured diagnostic + `/brainstorm`
2. Pre-push hook failure patterns — scoring quirks vs real failures vs timing
   races
3. Hooks writing files during commits/pushes (5+ dirty state files per commit
   cycle)

User picked concern #2. After initial investigation mis-scoped, user corrected:

- Pre-push is **doubling push times** — the real pain
- Last merged PR (#505) had ~12 red-text failures before user used `--no-verify`
  to break out
- Cyclomatic-cc + cognitive-cc have a "disconnect" that slows things down
- Other hook issues (pr-creep, session-start, propagation-staged) are
  nice-to-have
- **Concerns #2 and #3 are the SAME problem** (my hypothesis, needs
  confirmation)

---

## Data sources used

| Source                    | Path                                                                                  | What it revealed                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Check registry            | `scripts/config/hook-checks.json`                                                     | 26 hook checks (14 pre-commit + 12 pre-push)                                                                     |
| Warning log (aggregate)   | `.claude/state/hook-warnings-log.jsonl`                                               | 46 entries — revealed pr-creep + session-start bypass noise, but NOT the drift loop                              |
| Active warnings           | `.claude/hook-warnings.json`                                                          | 13 active entries, 7 of them duplicate pr-creep (counts 10-16)                                                   |
| Ack state                 | `.claude/state/hook-warnings-ack.json`                                                | 13 ack'd types, lastCleared 2026-04-10T10:56                                                                     |
| **Run telemetry**         | `.claude/state/hook-runs.jsonl`                                                       | **169 runs (49 pre-push). Shows 0 `fail` outcomes — the logger misses blocking failures.**                       |
| Most recent hook output   | `.git/hook-output.log`                                                                | Only 61 lines — just the last successful pre-commit                                                              |
| Git commit archaeology    | commits `f293e4dd`, `c5fe1679`, `f30875f6`, `f20761d7`, `a16aa975` on `planning-4826` | **THE DRIFT LOOP FOSSILIZED** — commit subjects literally say "drift loop", "cycle", "--no-verify to break loop" |
| Propagation registry      | `scripts/config/propagation-patterns.json`                                            | 11 patterns                                                                                                      |
| Propagation baseline      | `scripts/config/known-propagation-baseline.json`                                      | 585 entries, **50 dead** (wrong type:key combos)                                                                 |
| Husky scripts             | `.husky/pre-commit` (760 lines), `.husky/pre-push` (655 lines)                        | 18 places call `log-override.js` which writes tracked files                                                      |
| Propagation-staged script | `scripts/check-propagation-staged.js` (646 lines)                                     | Scans 500+ sibling files on every good-pattern trigger                                                           |
| Append-hook-warning       | `scripts/append-hook-warning.js`                                                      | Dedup keyed on `type+message` — inclusion of counts in message defeats dedup                                     |
| Session-start hook        | `.claude/hooks/session-start.js:1316-1365`                                            | Writes directly to log, bypassing dedup — 19 of 46 log entries                                                   |
| Work-locale memory        | `C:\Users\jason\Downloads\memory\memory\`                                             | User-pointed folder — the missing context                                                                        |

---

## Work-locale memory insights (cite only — DO NOT persist to current-locale memory per user instruction)

Read 8 files. Key findings:

1. **`feedback_commit_hook_state_files.md`** — Hook state files
   (`.claude/override-log.jsonl`, `.claude/state/hook-warnings-log.jsonl`,
   `.claude/state/learning-routes.jsonl`, `.claude/state/review-metrics.jsonl`,
   `docs/AI_REVIEW_LEARNINGS_LOG.md`) accumulate unstaged diffs silently and get
   forgotten. **This is the T39 concern #3 file list AND the drift loop
   mechanism.**

2. **`project_propagation_fix.md`** — Propagation enforcement (3 layers,
   registry, pre-commit + pre-push hooks) was COMPLETE in Session #249 (PR
   #482). 465 pre-existing violations baselined at that time. Any file created
   AFTER 2026-03-30 was never baselined — explains why
   `scripts/lib/todos-mutations.js` + `scripts/planning/todos-cli.js` (recent
   T30 work) trip the check.

3. **`feedback_deep_plan_hook_discovery_process.md`** — 5-layer multi-agent
   discovery protocol for hook/infrastructure investigations. Layers: (1)
   per-subsystem explorers, (2) warning/logging infra, (3) skip reasons + prior
   decisions, (4) ground-truth verifier, (5) execution verifier. **I should have
   used this from the start.**

4. **`sws_session221_decisions.md`** — Q35 "No Silent Fails" and Q36 "No Orphan
   Processes/Files" apply here. `hook-runs.jsonl` showing 0 fails when fails
   exist = Q35 violation. 50 dead baseline entries = Q36 violation.

5. **`feedback_ack_requires_approval.md`** — Cannot auto-ack warnings or clear
   state without explicit user approval. Rules out "auto-ack stale warnings on
   commit" as a unilateral fix.

6. **`feedback_never_defer_without_approval.md`** — Complete every layer of the
   5-layer discovery. No skipping. No "deferred to next pass".

7. **`feedback_no_session_end_assumptions.md`** — Cannot propose "fold into
   session-end" as a drift cleanup destination. Only concrete options: commit
   now / leave dirty / discard.

8. **`feedback_pr_timing.md`** — Don't create PRs until ALL planned work is
   complete.

**Other files in the folder, NOT yet read** (defer unless discovery agents
surface a need): `feedback_agent_stalling_pattern.md`,
`feedback_agent_output_files_empty.md`, `feedback_extractions_are_canon.md`,
`feedback_no_auto_debt_routing.md`,
`feedback_skills_in_plans_are_tool_calls.md`,
`feedback_convergence_loops_mandatory.md`, `feedback_dont_over_surface.md`,
`feedback_never_bulk_accept.md`, `feedback_parallel_agents_for_impl.md`,
`feedback_worktree_guidance.md`, `feedback_permission_over_aliases.md`,
`feedback_agent_config_revert_hazard.md`, `feedback_agent_teams_learnings.md`,
`feedback_code_review_patterns.md`, `feedback_execution_failure_recovery.md`,
`feedback_no_preexisting_rejection.md`, `feedback_no_research_caps.md`,
`feedback_pr_review_state_files.md`, `feedback_stale_reviews_dist.md`,
`feedback_statusline_deployment.md`, `feedback_sws_is_meta_plan.md`,
`feedback_verify_not_grep.md`, `project_active_initiatives.md`,
`project_agent_env_analysis.md`, `project_codex_plugin_research.md`,
`project_debt_runner_expansion.md`, `project_learning_system_analysis.md`,
`project_os_vision.md`, `project_repo_analysis_research.md`,
`project_reviews_system_health.md`, `project_skill_audit_tracking_broken.md`,
`project_sonarcloud_disabled.md`, `project_statusline_research.md`,
`reference_*.md`, `t3_convergence_loops.md`, `user_*.md`.

---

## Hook check inventory (26 checks)

### Pre-commit (14)

| Wave | ID                 | Blocking         | Writes to                           |
| ---- | ------------------ | ---------------- | ----------------------------------- |
| 0    | secrets-scan       | block            | —                                   |
| 1    | eslint             | block            | —                                   |
| 1    | tests              | block            | —                                   |
| 2    | lint-staged        | block            | modifies staged files (auto-format) |
| 3    | pattern-compliance | block            | `.claude/state/warned-files.json`   |
| 4    | audit-s0s1         | block            | —                                   |
| 6    | skill-validation   | warn (esc block) | —                                   |
| 7    | cross-doc-deps     | block            | —                                   |
| 8    | doc-index          | auto-fix         | `DOCUMENTATION_INDEX.md`            |
| 9    | doc-headers        | block            | —                                   |
| 10   | agent-compliance   | warn (esc block) | —                                   |
| 11   | debt-schema        | block            | —                                   |
| 12   | jsonl-md-sync      | warn (esc block) | —                                   |
| 13   | propagation-staged | block            | —                                   |

Plus inline pre-commit: pr-creep guard (inline shell, lines 40-88 of
`.husky/pre-commit`).

### Pre-push (12)

| Wave | ID                      | Blocking         | Notes                                                         |
| ---- | ----------------------- | ---------------- | ------------------------------------------------------------- |
| 0    | escalation-gate         | block            | Blocks on unack'd error-level warnings                        |
| 1    | circular-deps           | block            | Skips 100% in current telemetry (49/49)                       |
| 2    | pattern-compliance-push | warn (esc block) | Conditional on .js/.mjs                                       |
| 3    | code-reviewer-gate      | block            | Conditional on scripts/.claude-hooks/.husky changes           |
| 4    | propagation             | block            | Function-level + pattern-level                                |
| 5    | hook-tests              | block            | Skips 100% in current telemetry                               |
| 6    | security-check          | block            | —                                                             |
| 7    | type-check (tsc)        | block            | Only runs 10/49 times; parallel group `type-cc-checks`        |
| 7    | cyclomatic-cc           | block            | Parallel group `type-cc-checks`                               |
| 7    | cognitive-cc            | block            | Parallel group `type-cc-checks` — **warns 30/49 times (61%)** |
| 8    | npm-audit               | warn (esc block) | Slowest average (1760ms)                                      |
| 9    | triggers                | block            | Warns 27/49 times                                             |

---

## Per-check pre-push telemetry (49 runs from hook-runs.jsonl)

| Check                   | N      | Pass | Warn   | Fail | Skip   | Avg ms | Max ms |
| ----------------------- | ------ | ---- | ------ | ---- | ------ | ------ | ------ |
| escalation-gate         | 49     | 47   | 2      | 0    | 0      | 113    | 352    |
| circular-deps           | 49     | 0    | 0      | 0    | **49** | 149    | 373    |
| pattern-compliance-push | 49     | 21   | 5      | 0    | 23     | 167    | 795    |
| code-reviewer-gate      | 49     | 23   | 5      | 0    | 21     | 156    | 636    |
| propagation             | 49     | 20   | 0      | 0    | 29     | 288    | 2455   |
| hook-tests              | 49     | 0    | 0      | 0    | **49** | 0      | 0      |
| security-check          | 49     | 26   | 0      | 0    | 23     | 191    | 723    |
| tsc (type-check)        | **10** | 10   | 0      | 0    | 0      | 6388   | 18272  |
| **cyclomatic-cc**       | 49     | 30   | 0      | 0    | 19     | 1319   | 18272  |
| **cognitive-cc**        | 49     | 16   | **30** | 0    | 3      | 1686   | 18272  |
| npm-audit               | 49     | 41   | 8      | 0    | 0      | 1760   | 4611   |
| triggers                | 49     | 22   | 27     | 0    | 0      | 202    | 623    |

**Critical anomalies:**

1. **0 fail outcomes across 49 pre-push runs.** Impossible given user's
   experience. **Logger is broken for blocking failure paths.** Q35 "No Silent
   Fails" violation.
2. **circular-deps and hook-tests skip 100%.** Either dead code or condition
   never hits. Q36 orphan territory.
3. **Shared 18272ms max across tsc/cyclomatic-cc/cognitive-cc.** They run in
   parallel group `type-cc-checks`; the logged duration reflects the parallel
   group duration, not per-check. Tsc is the actual slow one.
4. **cognitive-cc warns 61% of runs; cyclomatic-cc passes 100% when not
   skipped.** Despite both being "CC checks" they diverge sharply. This is the
   "disconnect" user mentioned.

---

## Taxonomy v1.0 findings (pre-commit + session-start)

Still valid but **NOT the main problem**. Preserved for the deep-dive report:

### SQ1 — pr-creep message quirk

`.husky/pre-commit:82` builds message as `"$COMMIT_COUNT commits on branch"`.
`append-hook-warning.js:246-269` dedups on `type+message`. Every new commit
count creates a new warning entry that can never dedupe. 7 active warnings in
`hook-warnings.json` (counts 10-16).

### SQ2 — session-start warnings bypass dedup

`.claude/hooks/session-start.js:1316-1365` writes directly to
`hook-warnings-log.jsonl` via `fs.appendFileSync`, bypassing
`append-hook-warning.js`. No `occurrences` field, no ack check. Every session
start re-appends the same warnings. 19 of 46 log entries (41%) are
bypass-originated duplicates. Types affected: review-lifecycle, tdms-s0,
session-end-missing, cli-tools-missing.

### RF1 — real propagation-staged violations

Reproduced. Staging any file using `sanitizeError(` triggers a scan of 500+
sibling files. Two unbaselined recent files fail:

- `scripts/lib/todos-mutations.js:171` — `throw new Error(\`parse error at line
  ${i + 1}: ${err.message}\`)`
- `scripts/planning/todos-cli.js:132, 144, 255, 262` — 4 raw `err.message` uses

These are real (match the regex) but pre-existing, not introduced by the
triggering diff. Created during T30 work (after the 2026-03-30 baseline
snapshot).

### DF1 — propagation-staged scope mismatch

Trigger pattern is the GOOD pattern. Any file using `sanitizeError(` scans 500+
siblings for `err.message` anti-pattern. Scan scope too broad for pre-commit.

### DF2 — two write paths to `hook-warnings-log.jsonl`

(a) `append-hook-warning.js` with dedup/ack/occurrences. (b)
`session-start.js:1316-1365` with none of those.

### DF3 — 50 dead baseline entries

`known-propagation-baseline.json` contains `pattern:path-containment` (3) and 47
`function:*` entries. Registry only has `validate-path` (not
`path-containment`). Need to verify `check-propagation.js` doesn't consume the
`function:*` entries before removing them.

---

## Drift loop hypothesis (the REAL problem)

**Evidence from git archaeology on `planning-4826`:**

```text
b364edcd  Merge remote-tracking branch 'origin/main' into planning-4826      (branch start)
f293e4dd  chore: post-push hook state drift (PR #505 R1 cycle)                (5 files, 18 lines)
c5fe1679  chore: capture override-log entry from prior push (drift loop)     (1 file, 1 line)
f30875f6  chore: final override-log drift capture (--no-verify to break loop) (1 file, 1 line)
9aba28c7  feat(T30): todos-cli mutation helper                                (T30 work resumes)
```

**Files in `f20761d7` (`PR #505 R1 sweep — session state drift`):** 23 files,
713 insertions. Includes:

- `.claude/hook-warnings.json` (+124)
- `.claude/override-log.jsonl` (+13)
- `.claude/state/agent-invocations.jsonl` (+1)
- `.claude/state/hook-warnings-log.jsonl` (+42)
- `.claude/state/hook-warnings-log.jsonl.archive` (+23)
- `.claude/state/learning-routes.jsonl` (+85)
- `.claude/state/pending-refinements.jsonl` (+85)
- `.claude/state/review-metrics.jsonl` (±10)
- `.claude/state/warned-files.json` (±8)
- `docs/LEARNING_METRICS.md` (±8)
- `docs/technical-debt/*` (multiple)

**Files in `f293e4dd` (drift cycle follow-up):** 5 files —
`.claude/hook-warnings.json`, `.claude/override-log.jsonl`,
`.claude/state/hook-warnings-log.jsonl`, `.claude/state/review-metrics.jsonl`,
`.claude/state/warned-files.json`.

**Smoking gun:** 18 call sites in `.husky/pre-commit` + `.husky/pre-push` invoke
`scripts/log-override.js` on skip triggers. Each call appends 1 line to
`.claude/override-log.jsonl` (tracked in git). Call sites:

- pre-push:92 (escalation-gate)
- pre-push:245 (reviewer)
- pre-push:295 (propagation)
- pre-push:425 (cc)
- pre-push:432 (cognitive-cc)
- pre-push:600 (triggers)
- pre-commit:102 (gitleaks)
- pre-commit:152 (eslint)
- pre-commit:175 (tests)
- pre-commit:285 (pattern-compliance)
- pre-commit:293 (audit-s0s1)
- pre-commit:436 (propagation-staged)
- pre-commit:537 (cross-doc-deps)
- pre-commit:544 (doc-header)
- pre-commit:625 (doc-index)
- pre-commit:692 (debt-schema)
- pre-commit:724 (jsonl-sync)

### The loop (step-by-step hypothesis, needs ground-truth verification in layer 4)

1. `git push` → pre-push runs
2. Check fails (likely cognitive-cc given the 61% warn rate + baseline drift)
3. User retries with `SKIP_CHECKS="cognitive-cc" SKIP_REASON="..." git push`
4. `.husky/pre-push:432` → `log-override.js` → appends 1 line to
   `.claude/override-log.jsonl`
5. Push succeeds. `git status` shows `.claude/override-log.jsonl` modified
6. Next `git commit` → pre-commit's `cross-doc-deps` / `jsonl-md-sync` / or
   another check sees dirty state files
7. User commits the drift (`f293e4dd`). That commit's pre-commit triggers
   `append-hook-warning` writes → more drift
8. `git push` again → new drift causes new failure
9. Repeat 10+ times
10. `--no-verify` bypasses ONE iteration but session-start/post-commit hooks
    still write state
11. `f30875f6 (--no-verify to break loop)` captures the last drift

### Why my original taxonomy missed this

Focused on `hook-warnings-log.jsonl` content (signal). The drift loop is
invisible in per-run warnings; only visible in cross-run git state diffs. Needed
`hook-runs.jsonl` + git log archaeology. Used both eventually, but only after
the user corrected me twice.

---

## Confirmed open questions (for the deep-dive report + any future session)

1. Which specific check actually fires the red text in PR #505 retries? (Layer 1
   to investigate)
2. Are `--no-verify` pushes still producing override-log drift, and if so what
   writes it? (Layer 2)
3. Why does `hook-runs.jsonl` show 0 fails in 49 pre-push runs? Where is the
   logger exit path missing? (Layer 5)
4. What is the actual cyclomatic-cc vs cognitive-cc divergence — code, baseline,
   or threshold? (Layer 3)
5. Is the cross-locale constraint material? (work locale can't install admin
   packages — not yet checked whether any fix path requires admin) (Layer 5)

---

## Agent dispatch plan (5-layer discovery per `feedback_deep_plan_hook_discovery_process.md`)

**Layer 1 — Pre-push subsystem explorer**

- Scope: `.husky/pre-push` (655 lines), `scripts/config/hook-checks.json`
  pre-push entries
- Task: Map every check. Exit path, skip flag, blocking status, what files they
  READ. Divergences between declared and actual. DO NOT execute checks — static
  analysis only.

**Layer 2 — State-file writer scanner**

- Scope: EVERY writer to `.claude/override-log.jsonl`, `.claude/state/*.jsonl`,
  `.claude/state/*.json`, `.claude/hook-warnings.json`,
  `docs/AI_REVIEW_LEARNINGS_LOG.md`
- Task: Enumerate writers, trace when they fire (pre-commit / pre-push /
  session-start / post-read / post-write / other), whether writes are atomic,
  whether writes can happen OUTSIDE a git hook context (e.g., from Claude Code
  itself).
- Critical question: during a pre-push run, which writes happen, and can they be
  made atomic with the push?

**Layer 3 — CC disconnect explorer**

- Scope: `scripts/check-cc.js`, `.husky/pre-push:400-500` (cyclomatic-cc +
  cognitive-cc sections), `.claude/state/known-debt-baseline.json`
- Task: Read side-by-side. Why does cyclomatic-cc pass 100% (when not skipped)
  and cognitive-cc warn 61%? Different baselines? Different thresholds?
  Duplicate work? Is one a superset of the other?

**Layer 4 — Ground-truth live verification**

- Task: Capture `git status --short` → run ONE clean pre-push (`.husky/pre-push`
  with no changes staged) → capture `git status --short` after → diff the two.
  Report EVERY file that changed during the run. This is the definitive
  drift-loop proof.
- Also run: `node scripts/check-cc.js --verbose 2>&1` — capture output. Same for
  `node scripts/check-propagation.js --verbose 2>&1`.
- Non-destructive: no commits, no pushes, just local runs.

**Layer 5 — Telemetry gap + prior decisions**

- Scope: `.husky/pre-push` exit paths, `.claude/state/hook-runs.jsonl` writer,
  `.planning/hook-system-overhaul/DECISIONS.md` (if exists), `docs/audits/` for
  any hook-related audit reports
- Task: Find the logger exit path gap. Where does pre-push fail to write to
  hook-runs.jsonl when a check blocks? Cross-reference decision D14
  (hook-checks.json canon). Any prior audit findings on this exact problem?

**Parallelism:** All 5 run concurrently. Each is independently scoped. None
write repo files except layer 4 (and layer 4 only runs read-only commands).

---

## Completion criteria for this T39 pass

1. Session state checkpoint written (this file) ✅
2. Five-layer discovery agents return with findings
3. `.research/T39_DRIFT_LOOP_DEEP_DIVE.md` synthesis written — includes
   pre-commit AND pre-push findings, drift loop root cause, fix options
4. Findings presented to user with fix choices
5. **NO code changes this pass.** Fix implementation is a separate decision
   after the deep dive is reviewed.

---

## Revision log

| Version | When       | Change                                   |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-04-10 | Initial checkpoint before agent dispatch |
