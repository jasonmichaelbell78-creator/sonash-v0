# G2: Actual Memory System Usage Metrics

**Gap**: Research produced 128 claims but zero empirical data from the system it
proposes to improve.

**Method**: Direct filesystem reads on 2026-03-31. No files modified.

---

## 1. Token Cost of Current Memory Injection

Every session start injects three documents into the context window before any
user interaction occurs.

| Source                 | Characters | Approx Tokens (÷4) |
| ---------------------- | ---------: | ------------------: |
| CLAUDE.md              |     14,147 |               3,537 |
| MEMORY.md (index)      |      6,239 |               1,560 |
| 43 referenced .md files|     47,586 |              11,897 |
| SESSION_CONTEXT.md     |      8,988 |               2,247 |
| **Total**              | **76,960** |          **19,240** |

**Key finding**: The auto-memory subsystem alone (MEMORY.md + 43 child files)
accounts for 53,825 characters / ~13,456 tokens — 70% of the total injection
payload. CLAUDE.md and SESSION_CONTEXT.md together contribute only 23,135 chars /
~5,784 tokens (30%).

### Injection as Proportion of Context Window

| Model context  | Injection tokens | % consumed |
| -------------- | ---------------: | ---------: |
| 200K (default) |           19,240 |       9.6% |
| 1M (extended)  |           19,240 |       1.9% |

---

## 2. Memory File Inventory

### Totals

- **44 files** total (1 index MEMORY.md + 43 child files)
- **53,825 characters** across all files (including MEMORY.md)
- **1 non-MD file**: `.consolidate-lock` (4 bytes)
- **Orphaned files**: 0 (all 43 child files are referenced in MEMORY.md)
- **Missing references**: 0 (all MEMORY.md links resolve to actual files)

### Category Breakdown

| Category     | Files | Characters | % of total |
| ------------ | ----: | ---------: | ---------: |
| feedback_    |    23 |     23,587 |      43.8% |
| project_     |     9 |     14,992 |      27.8% |
| MEMORY.md    |     1 |      6,239 |      11.6% |
| reference_   |     5 |      4,122 |       7.7% |
| user_        |     4 |      2,559 |       4.8% |
| t3_          |     1 |      1,319 |       2.4% |
| sws_         |     1 |      1,007 |       1.9% |

**Key finding**: Feedback entries dominate — 23 files (52% of file count) and
43.8% of character volume. These are behavioral corrections the AI must
internalize to avoid repeating past mistakes.

### 5 Largest Files

| File                                | Characters |
| ----------------------------------- | ---------: |
| project_github_health_research.md   |      2,362 |
| project_hook_if_research.md         |      2,126 |
| project_active_initiatives.md       |      2,057 |
| project_cross_locale_config.md      |      1,921 |
| project_contrarian_agent_design.md  |      1,829 |

All 5 largest are `project_` files — status tracking for multi-session
initiatives.

### 5 Smallest Files

| File                              | Characters |
| --------------------------------- | ---------: |
| user_communication_preferences.md |        450 |
| user_decision_authority.md        |        471 |
| reference_tdms_systems.md         |        473 |
| reference_documentation_standards.md |     494 |
| reference_external_systems.md     |        520 |

### Files Not Modified in 30+ Days

**None**. The oldest modification date in the directory is 2026-03-17 (14 days
ago), when 15 files were last touched. The memory system was likely
consolidated/rebuilt around that date based on the cluster of 15 simultaneous
modifications.

### Modification Timeline

| Date       | Files Modified | Notes                             |
| ---------- | -------------: | --------------------------------- |
| 2026-03-17 |             15 | Bulk consolidation event           |
| 2026-03-19 |              1 |                                    |
| 2026-03-22 |              1 |                                    |
| 2026-03-23 |              2 |                                    |
| 2026-03-25 |              6 | Session batch                      |
| 2026-03-26 |              2 |                                    |
| 2026-03-29 |              7 | Session batch                      |
| 2026-03-30 |              2 |                                    |
| 2026-03-31 |              8 | Today (most recent)                |

---

## 3. Memory Growth Rate

### Git-Tracked Growth (limited data)

The auto-memory directory lives at `~/.claude/projects/...` — it is NOT inside
the git repository. Only 2 memory files appear in git history (committed to the
repo's `.claude/projects/` path):

- 2026-03-18: `feedback_learnings_must_complete.md` added
- 2026-03-24: `feedback_no_autonomous_deferrals.md` added

This means **git cannot reliably track memory growth**. The memory system is
outside version control by design (Claude Code manages it internally).

### Inferred Growth from Filesystem Timestamps

All 44 files have modification dates between 2026-03-17 and 2026-03-31 (14-day
window). The 15-file cluster on March 17 suggests a consolidation or migration
event created the current structure.

**Growth since March 17**: 29 files modified after the initial 15, meaning
either 29 new files were created or existing files were updated. Given 44 total
files, at least 29 files have been touched in the last 14 days — **~2 file
modifications per day**.

### SESSION_CONTEXT.md Update Frequency

SESSION_CONTEXT.md is committed to git. It has **384 commits since 2026-01-01**
(~90 days), averaging **4.3 commits per day**. This makes it the highest-churn
file in the memory system.

### CLAUDE.md Update Frequency

CLAUDE.md has **9 commits** visible in recent history, with the most recent on
2026-03-13 (v5.5). Update frequency: approximately once per week.

---

## 4. Hook/State Firing Frequency

### hook-warnings-log.jsonl

- **Active entries**: 39 (10,128 bytes)
- **Archived entries**: 338 (90,148 bytes)
- **Total lifetime entries**: 377
- **Date range (active)**: 2026-03-30 to 2026-03-31 (2 days)
- **Rotation**: Archive exists, active file is post-rotation

#### Warning Type Breakdown (active file)

| Hook / Type                       | Count |
| --------------------------------- | ----: |
| session-start / tdms-s0           |    10 |
| session-start / session-end-missing |   9 |
| session-start / review-lifecycle  |     9 |
| session-start / cli-tools-missing |     8 |
| session-start / pipeline-ratchet  |     1 |
| pre-commit / pr-creep             |     1 |
| pre-push / trigger                |     1 |

**Key finding**: 95% of warnings are session-start warnings (37 of 39). The same
4 warning types repeat every session start — this is wallpaper, not actionable
signal. `tdms-s0` ("26 critical debt items") has fired 10 times in 2 days with
no action taken.

### override-log.jsonl

- **Total entries**: 40 (8,863 bytes) — note: 41 lines including trailing
  content
- **Date range**: 2026-03-21 to 2026-03-30 (10 days)

#### Override Type Breakdown

| Check       | Count | % of total |
| ----------- | ----: | ---------: |
| reviewer    |    18 |      45.0% |
| doc-header  |    12 |      30.0% |
| triggers    |     5 |      12.5% |
| propagation |     2 |       5.0% |
| cross-doc-deps |  2 |       5.0% |
| tests       |     1 |       2.5% |

**Key finding**: Reviewer overrides dominate (45%). These are cases where the
pre-commit/pre-push hook required a code-reviewer agent to have run, but the
user authorized skipping it. 12 doc-header overrides suggest research/planning
files frequently lack standard headers.

### agent-invocations.jsonl

- **Total entries**: 155 (25,059 bytes)
- **Unique sessions**: 10
- **Date range**: 2026-03-29 to 2026-03-31 (3 days)

#### Agent Type Breakdown

| Agent                     | Count | % of total |
| ------------------------- | ----: | ---------: |
| deep-research-searcher    |   115 |      74.2% |
| fullstack-developer       |    11 |       7.1% |
| explore                   |    11 |       7.1% |
| deep-research-synthesizer |     9 |       5.8% |
| Explore                   |     4 |       2.6% |
| claude-code-guide         |     3 |       1.9% |
| code-reviewer             |     2 |       1.3% |

**Key finding**: deep-research agents account for 80% of all recorded
invocations (124 of 155). This file only covers 3 days and 10 sessions.

### hook-runs.jsonl

- **Total entries**: 149 (155,600 bytes)
- Tracks every pre-commit and pre-push hook execution with full output.

### commit-log.jsonl

- **Total entries**: 498 (173,680 bytes)
- Tracks every git commit made through Claude Code.

### .claude/state/ Directory Summary

- **97 files** total
- **1.9 MB** total size (1,737,766 bytes)
- **Top consumers**: reviews archives (591 KB), commit-log (174 KB),
  hook-runs (156 KB), hook-warnings archive (90 KB)

---

## 5. State File Accumulation (Unbounded Growth Risk)

Several JSONL files grow without bound:

| File                        | Entries | Bytes   | Growth driver                |
| --------------------------- | ------: | ------: | ---------------------------- |
| commit-log.jsonl            |     498 | 173,680 | Every commit                 |
| hook-runs.jsonl             |     149 | 155,600 | Every hook execution          |
| hook-warnings-log (archive) |     338 |  90,148 | Every warning (rotated)       |
| reviews.jsonl.archive       |       — | 302,387 | Archived PR reviews           |
| reviews-archive.jsonl       |       — | 289,187 | Duplicate archive?            |
| agent-invocations.jsonl     |     155 |  25,059 | Every agent spawn             |
| review-metrics.jsonl        |      56 |  12,668 | Every PR review round         |

Two review archives (`reviews.jsonl.archive` and `reviews-archive.jsonl`)
together consume 591 KB — the largest storage consumers in the state directory.

---

## 6. Cross-System Summary

| Metric                          | Value         |
| ------------------------------- | ------------- |
| Session-start token cost        | ~19,240       |
| Memory files                    | 44            |
| Memory total chars              | 53,825        |
| Memory system age               | 14 days       |
| Feedback entries (behavioral)   | 23 (52%)      |
| Files never stale (all <30d)    | 44 (100%)     |
| SESSION_CONTEXT commits/day     | 4.3           |
| Hook warnings (lifetime)        | 377           |
| Hook warnings (repeating/stale) | 95%           |
| Override log entries             | 40            |
| Agent invocations (3 days)      | 155           |
| State directory files           | 97            |
| State directory size            | 1.9 MB        |
| Commit log entries              | 498           |
| Hook run entries                | 149           |

---

## 7. Implications for Multi-Layer Memory Design

1. **Current injection cost is manageable** (~19K tokens, under 10% of 200K
   context). The research's urgency around token pressure is not empirically
   supported at current scale.

2. **Growth trajectory is the real concern**: 44 files in 14 days, with ~2
   modifications/day. At this rate, the memory system will double in 14 days.
   The research correctly identifies unbounded growth as the core problem.

3. **Feedback files are the dominant category** (52% of files, 44% of chars).
   Any tiering strategy should consider whether all 23 feedback entries need
   injection every session, or whether some have been internalized and can be
   demoted.

4. **Wallpaper warnings are real**: 95% of hook warnings are the same 4 types
   repeating every session start. The research claim about "unacknowledged
   warnings becoming wallpaper" is confirmed by the data.

5. **State files are a hidden cost**: The 97 state files consuming 1.9 MB are
   not part of the context injection, but they represent a parallel unbounded
   growth problem that the research does not address.

6. **No staleness problem yet**: All memory files were modified within 14 days.
   But this is because the system is only 14 days old. Staleness detection
   becomes relevant as the system matures.
