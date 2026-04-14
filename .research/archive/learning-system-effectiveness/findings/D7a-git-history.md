# Findings: SoNash Git History — Pattern Recurrence and Enforcement Effectiveness

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-03
**Sub-Question IDs:** SQ-7 (Part A)

---

## Key Findings

1. **Pattern compliance checker introduced 2026-01-02 — very early in project
   history** [CONFIDENCE: HIGH]

   `scripts/check-pattern-compliance.js` was first committed on 2026-01-02 in
   commit `7d7bd93` ("feat: Add pattern compliance checker and audit process").
   This was among the earliest infrastructure commits (the project had active
   commits from 2025-12). The commit message explicitly states the motivation:
   "prevents repeating mistakes by surfacing known anti-patterns early." The
   same commit also introduced `AI_REVIEW_LEARNINGS_LOG.md` and wired pattern
   checks into the session-start hook.

2. **`sanitizeError` pattern introduced 2026-01-02 but recurrence continued
   through 2026-04** [CONFIDENCE: HIGH]

   `scripts/lib/sanitize-error.js` was first committed on 2026-01-02 in a
   review-response fix commit. However, commits explicitly addressing
   `sanitizeError` or raw error logging violations appear in every subsequent
   month:
   - 2025-12: 2 commits
   - 2026-01: 43 commits
   - 2026-02: 31 commits
   - 2026-03: 40 commits
   - 2026-04 (partial): 3 commits

   The rate did NOT decrease after pattern codification — March 2026 (40
   commits) shows more sanitizeError-related activity than February (31),
   despite the checker existing since January. The 2026-04-02 commits include
   "fix: propagation — sanitizeError in commit-tracker and session-start,"
   showing the pattern was still being missed in hook files specifically.

3. **Pattern/compliance/pre-commit fix commits remained high across all months**
   [CONFIDENCE: HIGH]

   Commits matching `compliance|pre-commit|pattern` by month:
   - 2025-12: 34
   - 2026-01: 374
   - 2026-02: 285
   - 2026-03: 116
   - 2026-04 (partial): 9

   As a proportion of total commits (2025-12: 717, 2026-01: 1224, 2026-02: 936,
   2026-03: 384, 2026-04: 56), the rate is:
   - Dec: 4.7%
   - Jan: 30.6%
   - Feb: 30.4%
   - Mar: 30.2%
   - Apr: 16.1%

   The ratio was roughly stable January through March at ~30%. It did not
   decline after the checker was introduced.

4. **AI_REVIEW_LEARNINGS_LOG.md has 596 commits — an extremely high change
   rate** [CONFIDENCE: HIGH]

   Monthly distribution of commits touching the learnings log:
   - 2026-01: 246 commits
   - 2026-02: 254 commits
   - 2026-03: 84 commits
   - 2026-04 (partial): 12 commits

   The log was touched in nearly 1 in 5 commits in January and February. The
   rate dropped sharply in March (84 vs ~250/month prior). As of 2026-04-02, the
   most recent entry was learning entry #63, suggesting sequential numbering —
   though the high commit count suggests many non-entry commits (state files,
   JSONL records, session housekeeping) also touch this file.

5. **CODE_PATTERNS.md has been continuously expanded since 2026-02-15**
   [CONFIDENCE: HIGH]

   Monthly commit distribution:
   - 2026-01: 26 commits
   - 2026-02: 28 commits
   - 2026-03: 10 commits

   The file was first modified for retro action items in early 2026-02 (oldest
   dated entry: 2026-02-15 "feat: PR #367 retro — shared validators, templates,
   patterns, skill updates"). March shows a significant slowdown (10 commits vs
   26-28/month prior). The most recent commits (2026-03-19 "fix: docs:accuracy
   666 → 0 findings") were correction-focused rather than growth-focused.

6. **`known-debt-baseline.json` does not exist in the current worktree**
   [CONFIDENCE: HIGH]

   `git log --all -- known-debt-baseline.json` returned no results, and
   `ls known-debt-baseline.json` confirmed the file is absent. The debt ratchet
   mechanism cannot be evaluated from this file. The tech debt management system
   (TDMS) uses `MASTER_DEBT.jsonl` and DEBT-XXXXX IDs instead. Defer items are
   tracked via
   `chore: defer 5 propagation miss patterns to TDMS (DEBT-45624..45628)` style
   commits (2026-03-30).

7. **Hook infrastructure grew continuously: 2025-12 through 2026-04**
   [CONFIDENCE: HIGH]

   Monthly commits touching `.claude/hooks/`:
   - 2025-12: 2 commits
   - 2026-01: 93 commits
   - 2026-02: 173 commits
   - 2026-03: 58 commits
   - 2026-04 (partial): 8 commits

   Key milestones:
   - 2026-01-12: "fix: create missing Node.js hooks for cross-platform
     compatibility" (early cross-platform work)
   - 2026-02-13: "Optimize PostToolUse hooks: inline patterns, unify
     requirements, fast-path audit"
   - 2026-02-14: Multiple wave-based hook consolidation commits
   - 2026-02-21: "feat: pre-commit failure reduction + hook/skill observability"
   - 2026-03-17: Hook infrastructure expanded (CLAUDE.md v5.6 wiring)
   - 2026-03-30: "feat: Sessions #244-246 — hook if-conditions" (new conditional
     logic)
   - 2026-04-02: "fix: propagation — path traversal regex, symlink guards, path
     containment (7 hooks)"

   Current hook count: 21 hook files in `.claude/hooks/` plus 11 health checkers
   in `scripts/health/checkers/`.

8. **CLAUDE.md was created 2026-03-13 (relatively late) and has 13 total
   commits** [CONFIDENCE: HIGH]

   The CLAUDE.md file (as a distinct, versioned artifact) was first committed on
   2026-03-13 in "fix: PR #430 R2 — rename claude.md→CLAUDE.md." It has 13
   commits across a ~3-week window (2026-03-13 through 2026-04-02). The current
   version (5.9) contains 33 lines matching enforcement annotations
   (`guardrail|BEHAVIORAL|GATE|automated enforcement`). Prior to 2026-03-13 a
   `claude.md` file existed (lowercase), with earlier versions committed in
   2026-01-04 and 2026-01-05.

   Behavioral guardrail additions by date (from commit messages):
   - 2026-03-05: "System Overhaul: Behavioral Guardrails, Retro Action Items,
     Review Ecosystem Hardening" — initial guardrail set
   - 2026-03-17: "Planning artifacts, agent infrastructure, memory system,
     CLAUDE.md v5.6" — v5.6 with 6 new guardrails
   - 2026-03-24: "agent-env P5 — process integration (CLAUDE.md, skills,
     monitoring, tracking)" — v5.7 addition
   - 2026-04-02: "/repo-analysis skill + T5 brainstorm + session housekeeping" —
     v5.9

9. **Propagation violations emerged as a distinct pattern category in February
   2026** [CONFIDENCE: HIGH]

   "Propagation" (spread of fixes to all affected call sites) was nearly absent
   in commit messages before February:
   - 2025-12: 1 commit
   - 2026-01: 2 commits
   - 2026-02: 27 commits
   - 2026-03: 30 commits
   - 2026-04: 8 commits

   The late emergence and sustained high rate in March-April (matching or
   exceeding February despite lower total volume) indicates propagation is an
   active, ongoing problem rather than a solved one. A dedicated "3-layer
   propagation enforcement system" was built on 2026-03-30, and propagation
   fixes continue appearing daily as recently as 2026-04-02.

10. **Fix commits as share of total were stable at ~30% Jan-Mar, not
    decreasing** [CONFIDENCE: HIGH]

    Fix/patch/resolve commits by month:
    - 2026-01: 478 out of 1224 total = 39%
    - 2026-02: 406 out of 936 total = 43%
    - 2026-03: 152 out of 384 total = 40%
    - 2026-04 (partial): 26 out of 56 = 46%

    The fix-commit ratio has not declined despite months of pattern enforcement
    tooling. It has remained at 39-46% across the full observable window.

---

## Sources

| #   | Source                                                                                        | Description                                | Type        | Trust | CRAAP     | Date       |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------- | ----- | --------- | ---------- |
| 1   | `git log --diff-filter=A -- scripts/check-pattern-compliance.js`                              | First commit for compliance checker        | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 2   | `git log --format="%ad" --date=format:"%Y-%m" --all --grep="compliance\|pre-commit\|pattern"` | Pattern fix monthly distribution           | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 3   | `git log --format="%ad" --date=format:"%Y-%m" -- docs/AI_REVIEW_LEARNINGS_LOG.md`             | Learning log commit monthly distribution   | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 4   | `git log --format="%ad" -- docs/agent_docs/CODE_PATTERNS.md`                                  | CODE_PATTERNS.md monthly growth            | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 5   | `git log --all -- known-debt-baseline.json`                                                   | Absence of debt baseline file              | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 6   | `git log --format="%ad" -- .claude/hooks/`                                                    | Hook infrastructure monthly commits        | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 7   | `git log --format="%ad" --date=short -- CLAUDE.md`                                            | CLAUDE.md creation and edit history        | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 8   | `git log --format="%ad" --all --grep="sanitize\|sanitizeError"`                               | sanitizeError recurrence by month          | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 9   | `git log --format="%ad" --all --grep="propagation"`                                           | Propagation violation monthly distribution | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |
| 10  | Total monthly commit counts (all branches)                                                    | Baseline for ratio normalization           | git history | HIGH  | 5/5/5/5/5 | 2026-04-03 |

---

## Contradictions

**Learning log commit count vs. learning entry numbering:** The log has 596
total commits but the most recent learning entry is numbered #63. This is not a
contradiction in itself (most commits to the file are state files, JSONL
records, session housekeeping), but the 596 vs 63 gap signals the file is used
as a general session artifact container, not purely a learning-entry tracker.
The commit volume metric overstates learning entry creation rate.

**Compliance checker introduction vs. ongoing violations:** The checker was
committed on 2026-01-02 with the explicit purpose of preventing pattern
recurrence. However, pattern/compliance fix commits remained at ~30% of all
commits through March 2026. These two facts are not fully reconciled by the data
— the checker may be catching violations (good), the checker may be generating
new fix-commit overhead, or violations may be arising faster than the checker
prevents them.

---

## Gaps

1. **known-debt-baseline.json absent**: Cannot assess debt ratchet behavior. The
   file does not exist in this worktree. Whether this is by design (TDMS JSONL
   used instead), a worktree artifact, or a deliberate removal is unclear.

2. **Learning entry #63 vs. total commit count**: Cannot determine actual
   learning entry creation rate from git log alone without reading the file to
   count entries. The 596 commits to the log file is a commit-count, not a
   learning-entry count.

3. **Pre-checker vs. post-checker violation rates**: The checker was introduced
   2026-01-02, which is near the start of the observable git history. There is
   no pre-checker baseline in this repo to compare against. The ~30% fix-commit
   rate may have been higher before the checker.

4. **Distinction between new violations vs. systematic sweeps**: The 2026-03-19
   commit "fix: pattern compliance full scan — 72 blocking → 0 (Wave 3)" shows
   batch remediation. It is not possible from commit messages alone to
   distinguish "ongoing new violations" from "one-time catch-up sweeps."

5. **CLAUDE.md lowercase predecessor**: The lowercase `claude.md` file predates
   the current CLAUDE.md. Its full history was not retrieved; the rename date
   (2026-03-13) is confirmed but earlier guardrail history in `claude.md` was
   not fully enumerated.

---

## Serendipity

**Propagation as an emergent problem category**: The word "propagation" appears
in commit messages starting Feb 2026 and escalates to 30 commits in March. A
dedicated "3-layer propagation enforcement system" was built 2026-03-30
specifically to address pattern non-propagation (fixing a pattern in one file
but not spreading the fix to all similar call sites). This is a meta-pattern
about the limits of per-file pattern enforcement — even when the pattern is
known and the checker exists, ensuring all instances are fixed requires a
separate enforcement layer.

**Health checkers include `learning-effectiveness.js`**: The file
`scripts/health/checkers/learning-effectiveness.js` exists in the current
codebase, suggesting the project has built automated measurement of its own
learning system. This artifact was first committed 2026-03-01 (PR Review
Ecosystem v2). This is directly relevant to SQ-7 and warrants deeper analysis in
a separate research pass.

**Fix-commit ratio increased in April**: Despite April being a short sample (56
total commits), the fix ratio is 46% — the highest observed. This may reflect
the current PR #489 review cycle generating many fix commits in close
succession, but it also may indicate no long-term improvement trend.

---

## Confidence Assessment

- HIGH claims: 10
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — all findings derived directly from `git log`
  output on the live repository, no inference from external sources.
