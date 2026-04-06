# AI Optimization Audit — Review Decisions

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Audit Date:** 2026-02-14 **Reviewer:** User (Jason) **Total Findings:** 83
(S1: 2, S2: 37, S3: 44)

---

## S1 Batch 1: Hook Performance (2 items)

| DEBT ID   | Title                                                     | Decision | Reason                                  |
| --------- | --------------------------------------------------------- | -------- | --------------------------------------- |
| DEBT-2841 | PostToolUse Write: 10 sequential hook processes per Write | ACCEPT   | Highest-impact optimization             |
| DEBT-2842 | PostToolUse Edit: 9 sequential hook processes per Edit    | ACCEPT   | Same fix as 2841, Edit most common tool |

## S2 Batch 1: Hook Efficiency (5 items) — AWAITING DECISION

| DEBT ID   | Title                                                     | Decision | Reason                         |
| --------- | --------------------------------------------------------- | -------- | ------------------------------ |
| DEBT-2843 | session-start.js 40+ decorative lines per session         | ACCEPT   | Compact summary saves tokens   |
| DEBT-2844 | Multi-line regex greedy [\s\S]\*? in auto-save-context.js | ACCEPT   | Two-strikes rule applies       |
| DEBT-2845 | Fragile markdown field parsing repeated 3+ scripts        | ACCEPT   | Extract shared helper          |
| DEBT-2848 | SessionStart spawns 6+ sequential execSync subprocesses   | ACCEPT   | Parallelize independent checks |
| DEBT-2849 | check-remote-session-context.js git fetch every start     | ACCEPT   | Cache with 5-min TTL           |

## S2 Batch 2: PostToolUse + UserPromptSubmit Consolidation (3 items)

| DEBT ID   | Title                                                   | Decision | Reason                              |
| --------- | ------------------------------------------------------- | -------- | ----------------------------------- |
| DEBT-2850 | PostToolUse Read: 3 hooks with redundant state reads    | ACCEPT   | Consolidate like Write/Edit         |
| DEBT-2852 | Duplicate file content reads across 7 PostToolUse hooks | ACCEPT   | Read file once, share across checks |
| DEBT-2853 | UserPromptSubmit: 4 hooks per user message              | ACCEPT   | Single process for all 4 checks     |

## S2 Batch 3: Skill Overlap + Instruction Bloat (3 items)

| DEBT ID   | Title                                                        | Decision | Reason                                                   |
| --------- | ------------------------------------------------------------ | -------- | -------------------------------------------------------- |
| DEBT-2854 | sonarcloud-sprint superseded by sonarcloud                   | ACCEPT   | Unified skill replaces it                                |
| DEBT-2855 | ui-design-system/ux-researcher/frontend-design 3-way overlap | DEFER    | Overlap is in docs not function; add decision tree later |
| DEBT-2846 | doc-optimizer duplicates CRITICAL RETURN PROTOCOL 13x        | ACCEPT   | 400 lines pure duplication                               |

## S2 Batch 4: Orphaned Skills (9 items)

| DEBT ID   | Title                                    | Decision | Reason                          |
| --------- | ---------------------------------------- | -------- | ------------------------------- |
| DEBT-2856 | find-skills not in SKILL_INDEX           | ACCEPT   | Complete skill, doc gap         |
| DEBT-2857 | pre-commit-fixer not in SKILL_INDEX      | ACCEPT   | Complete skill, doc gap         |
| DEBT-2858 | task-next not in SKILL_INDEX             | ACCEPT   | Complete skill, doc gap         |
| DEBT-2859 | multi-ai-audit not in SKILL_INDEX        | ACCEPT   | Complete skill, doc gap         |
| DEBT-2860 | add-debt not in SKILL_INDEX              | ACCEPT   | Complete skill, doc gap         |
| DEBT-2861 | verify-technical-debt not in SKILL_INDEX | ACCEPT   | Complete skill, doc gap         |
| DEBT-2862 | pr-retro not in SKILL_INDEX              | ACCEPT   | Complete skill, doc gap         |
| DEBT-2863 | sonarcloud not in SKILL_INDEX            | ACCEPT   | Replace sonarcloud-sprint entry |
| DEBT-2864 | test-suite not in SKILL_INDEX            | ACCEPT   | Complete skill, doc gap         |

## S2 Batch 5: Agent Prompt Quality (4 items)

| DEBT ID   | Title                                                   | Decision | Reason                      |
| --------- | ------------------------------------------------------- | -------- | --------------------------- |
| DEBT-2865 | audit-process lacks CRITICAL RETURN PROTOCOL            | ACCEPT   | Prevent context overflow    |
| DEBT-2866 | audit-documentation lacks JSONL format spec             | ACCEPT   | Standardize output format   |
| DEBT-2867 | audit-enhancements lacks explicit JSONL format          | ACCEPT   | Prevent format drift        |
| DEBT-2868 | FALSE_POSITIVES.jsonl not in audit-process/enhancements | ACCEPT   | Cheap insurance, 1-line fix |

## S2 Batch 6: MCP + Context Loading (5 items)

| DEBT ID   | Title                                                                | Decision | Reason                                                |
| --------- | -------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| DEBT-2869 | MCP memory server not enabled — 3 skills have dead code paths        | ACCEPT   | Remove dead code paths                                |
| DEBT-2870 | MCP filesystem server duplicates native Read/Write/Glob/Grep         | ACCEPT   | Redundant process slot                                |
| DEBT-2910 | session-begin reads ROADMAP.md (3164 lines) in full                  | ACCEPT   | Read Active Sprint only                               |
| DEBT-2912 | session-begin reads INDEX.md + DOCUMENT_DEPENDENCIES.md as mandatory | DEFER    | Lower priority, conditional reads need careful design |
| DEBT-2917 | alerts-reminder.js injects context every UserPromptSubmit            | ACCEPT   | Add 10-min cooldown                                   |

## S2 Batch 7: Skill Size + Architecture (3 items)

| DEBT ID   | Title                                                     | Decision | Reason                                                                                |
| --------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| DEBT-2860 | Audit skills share >50% boilerplate without shared base   | DEFER    | Needs loader mechanism that doesn't exist yet; lower priority than hook consolidation |
| DEBT-2914 | pr-review SKILL.md is 840 lines loaded entirely           | ACCEPT   | Split core protocol from reference sections                                           |
| DEBT-2915 | audit-comprehensive SKILL.md is 854 lines loaded entirely | ACCEPT   | Extract recovery/triage to on-demand reference                                        |

## S2 Batch 8: State Management (5 items)

| DEBT ID    | Title                                                       | Decision | Reason                                         |
| ---------- | ----------------------------------------------------------- | -------- | ---------------------------------------------- |
| DEBT-2868  | compaction-handoff.js uses execSync instead of execFileSync | ACCEPT   | E0 quick win, perf + security                  |
| DEBT-2921  | commit-log.jsonl no rotation/size-cap (39KB, append-only)   | ACCEPT   | Unbounded growth degrades compaction           |
| DEBT-2922  | handoff.json embeds full commitLog array (25KB)             | ACCEPT   | Limit to 15 entries, complement to 2921        |
| Finding-79 | velocity-log.jsonl has malformed sprint field data          | ACCEPT   | 100% confidence, broken data, simple regex fix |
| Finding-83 | session-state.json 166 begins vs 16 ends (10:1 ratio)       | ACCEPT   | Move critical cleanup to session-start         |

## S3 Batch 1: Dead Assets + Doc Cleanup (6 items)

| DEBT ID    | Title                                                | Decision | Reason                       |
| ---------- | ---------------------------------------------------- | -------- | ---------------------------- |
| DEBT-2841  | TDMS plan still in active plans/                     | ACCEPT   | 30-second file move          |
| DEBT-2842  | SESSION_HISTORY/DECISIONS not in DOCUMENTATION_INDEX | ACCEPT   | Auto-fix via docs:index      |
| Finding-5  | JSONL line counting pattern repeated 5x              | ACCEPT   | Extract shared helper        |
| Finding-6  | String path concatenation in archive-doc.js          | ACCEPT   | Use path.join                |
| Finding-23 | Orphaned check-edit/write-requirements.js hooks      | ACCEPT   | Dead code, delete            |
| Finding-80 | .claude/tmp-alerts.json persists across sessions     | ACCEPT   | Add cleanup to session-start |

## S3 Batch 2: MCP + Settings Cleanup (6 items)

| DEBT ID   | Title                                              | Decision | Reason                     |
| --------- | -------------------------------------------------- | -------- | -------------------------- |
| DEBT-2853 | MCP git server configured but unused               | ACCEPT   | Zero references            |
| DEBT-2856 | github in enabledMcpjsonServers but not configured | ACCEPT   | Zero references            |
| DEBT-2857 | 7 mcp**filesystem** stale permissions              | ACCEPT   | Dead permissions           |
| DEBT-2858 | 3 mcp**serena** permissions for disabled server    | ACCEPT   | Contradictory config       |
| DEBT-2859 | MCP global template has puppeteer not playwright   | ACCEPT   | Wrong tool listed          |
| DEBT-2909 | MCP firebase enabled but not configured            | ACCEPT   | Document plugin dependency |

## S3 Batch 3: Hook Optimization (8 items)

| DEBT ID    | Title                                                      | Decision | Reason                                    |
| ---------- | ---------------------------------------------------------- | -------- | ----------------------------------------- |
| Finding-8  | Decorative error output in hooks (5-12 line blocks)        | DEFER    | E2 effort, subsumed by hook consolidation |
| Finding-9  | Unused authorDate/author fields in commit-log.jsonl        | ACCEPT   | Simple field removal                      |
| Finding-15 | stop-serena-dashboard.js PowerShell overhead every session | ACCEPT   | Fast-path port check first                |
| Finding-20 | agent-trigger-enforcer loads config every invocation       | ACCEPT   | Cache at module level                     |
| Finding-22 | large-context-warning reads entire file for line count     | ACCEPT   | Use fs.statSync estimation                |
| Finding-25 | pre-compaction-save.js 7 sequential git calls              | ACCEPT   | Combine to ~3 calls                       |
| Finding-26 | commit-tracker.js 4 git subprocesses per commit            | ACCEPT   | Combine rev-parse into log format         |
| Finding-27 | pattern-check.js double realpathSync                       | ACCEPT   | Cache project dir at load                 |

## S3 Batch 4: Skill Overlap + Quality (10 items)

| DEBT ID    | Title                                             | Decision | Reason                                              |
| ---------- | ------------------------------------------------- | -------- | --------------------------------------------------- |
| Finding-28 | alerts-reminder reads 4 files every prompt        | ACCEPT   | Fast-path when no alerts                            |
| Finding-30 | code-reviewer duplicate listing in SKILL_INDEX    | ACCEPT   | Single-line fix                                     |
| Finding-31 | senior-fullstack duplicate listing in SKILL_INDEX | ACCEPT   | Single-line fix                                     |
| Finding-32 | frontend-design vs senior-frontend overlap        | DEFER    | Functional overlap minimal; add decision tree later |
| Finding-34 | senior-qa vs webapp-testing vs test-suite overlap | DEFER    | Merge requires careful testing; dedicated session   |
| Finding-35 | checkpoint vs save-context overlap                | ACCEPT   | Merge into /checkpoint --mcp                        |
| Finding-36 | docs-sync vs docs-update overlap                  | ACCEPT   | Merge into /docs-maintain                           |
| Finding-46 | SKILL_INDEX claims 55 skills, count wrong         | ACCEPT   | Fixed when orphans/dupes addressed                  |
| Finding-48 | audit-process Stage 1 markdown not JSONL          | DEFER    | Inventory stage intentionally human-readable        |
| Finding-52 | pre-commit-fixer unstructured agent prompts       | ACCEPT   | Improves agent output quality                       |

## S3 Batch 5: Context + State + Misc (14 items)

| DEBT ID    | Title                                                 | Decision | Reason                                            |
| ---------- | ----------------------------------------------------- | -------- | ------------------------------------------------- |
| Finding-62 | CODE_PATTERNS.md 600-line read at startup             | ACCEPT   | Read lines 1-60 only                              |
| Finding-64 | compact-restore.js injects stale handoff              | ACCEPT   | Add 60-min staleness threshold                    |
| Finding-67 | Edit/MultiEdit hook lists duplicate Write             | DEFER    | Subsumed by S1 hook consolidation                 |
| Finding-69 | analyze-user-request.js reinjects directives          | ACCEPT   | Session-level dedup                               |
| Finding-70 | session-begin 361 lines with redundant sections 0b/1b | ACCEPT   | Remove 60 lines of automated hook docs            |
| Finding-71 | code-reviewer generic boilerplate (Python/Docker/K8s) | ACCEPT   | Remove irrelevant tech references                 |
| Finding-74 | reviews.jsonl no rotation (30+ entries)               | ACCEPT   | Rotate at 50 entries                              |
| Finding-75 | warned-files.json no expiry (48 entries)              | ACCEPT   | 30-day expiry + delete-file prune                 |
| Finding-76 | task-audit-template-overhaul.state.json stale         | ACCEPT   | Delete dead state file                            |
| Finding-77 | override-log.jsonl no rotation                        | ACCEPT   | Rotate at 100 entries                             |
| Finding-78 | agent-invocations.jsonl no rotation                   | ACCEPT   | Cap at 200, truncate to 100                       |
| Finding-81 | session-end missing ephemeral cleanup                 | ACCEPT   | Add rm -f for 2 state files                       |
| Finding-82 | MEMORY.md stale entries                               | ACCEPT   | Remove COMPLETE sections                          |
| Finding-12 | pattern-check.js inline patterns (520 lines)          | DEFER    | Structural preference; tackle after consolidation |

---

## Review Complete — Summary

**Total Findings:** 83 **ACCEPTED:** 71 **DEFERRED:** 10 **DECLINED:** 0

### Deferred Items

1. DEBT-2855: ui-design-system/ux-researcher/frontend-design 3-way overlap
2. DEBT-2860: Audit skills shared boilerplate base
3. DEBT-2912: session-begin mandatory reads (INDEX.md +
   DOCUMENT_DEPENDENCIES.md)
4. Finding-8: Decorative error output in hooks
5. Finding-32: frontend-design vs senior-frontend overlap
6. Finding-34: senior-qa vs webapp-testing vs test-suite overlap
7. Finding-48: audit-process Stage 1 markdown not JSONL
8. Finding-67: Edit/MultiEdit hook lists duplicate Write
9. Finding-12: pattern-check.js inline patterns
10. (none declined)

_All deferred items remain in TDMS as NEW status for future sprint planning._

---

_Review completed 2026-02-14. This file is the authoritative record of all
decisions._

---

_This file is updated after each batch decision to survive context compaction._
