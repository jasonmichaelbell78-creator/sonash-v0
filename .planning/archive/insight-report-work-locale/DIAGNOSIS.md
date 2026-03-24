<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Diagnosis: Insight Report — Work Locale

**Date:** 2026-03-17 **Task:** Implement actionable items from the /insights
report for the work environment (restricted Windows, 26 sessions analyzed)

---

## ROADMAP Alignment

**Aligned (Operational Tooling).** This work improves development workflow
efficiency and Claude Code integration — consistent with the Operational
Visibility Sprint and tooling maturity goals. Not a feature or milestone item,
but directly supports developer productivity.

---

## Insights Report Summary (Work Locale)

**26 sessions, 41 hours, 89 commits, 1,237 Bash calls**

### Friction Points Identified

| #   | Friction                                                             | Severity | Already Addressed?                                                               |
| --- | -------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| F1  | Pre-commit hooks repeatedly blocking commits (retry spirals)         | HIGH     | PARTIAL — `/pre-commit-fixer` skill exists but not consistently used             |
| F2  | Claude loads wrong plan/context at session start                     | MEDIUM   | PARTIAL — `/session-begin` skill exists, `session-start.js` hook runs            |
| F3  | Claude pushes to remote without asking                               | HIGH     | PARTIAL — `block-push-to-main.js` hook exists, but no "ask before any push" rule |
| F4  | Wrong environment assumptions (bash on Windows, wrong build command) | MEDIUM   | NOT ADDRESSED — no Windows guidance in CLAUDE.md                                 |
| F5  | Question batching violations (15 questions dumped at once)           | LOW      | PARTIAL — deep-plan skill has 5-8 rule, but no CLAUDE.md global rule             |

### Suggested Additions

| #   | Suggestion                                                    | Type    | Already Exists?                                             |
| --- | ------------------------------------------------------------- | ------- | ----------------------------------------------------------- |
| S1  | CLAUDE.md: Git Operations section (never push without asking) | Config  | NO                                                          |
| S2  | CLAUDE.md: Windows environment guidance                       | Config  | NO                                                          |
| S3  | CLAUDE.md: Session start verification checklist               | Config  | PARTIAL — session-begin skill covers this, not in CLAUDE.md |
| S4  | CLAUDE.md: Question batching limit (max 6)                    | Config  | NO (deep-plan has 5-8, not global)                          |
| S5  | CLAUDE.md: Pre-PR file verification                           | Config  | NO                                                          |
| S6  | Claude Code hook: pre-commit dry-run before commit            | Hook    | NO                                                          |
| S7  | /safe-commit skill                                            | Skill   | NO (pre-commit-fixer exists but different scope)            |
| S8  | Headless mode for batch audit work                            | Feature | NOT TRIED                                                   |

---

## Relevant Existing Systems

| System                        | Relationship          | Current State                                                                                |
| ----------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| CLAUDE.md (Section 4)         | Behavioral guardrails | Has 6 guardrails, none address git/push/Windows                                              |
| `.claude/settings.json`       | Hooks config          | Extensive hooks already (SessionStart, PreToolUse, PostToolUse, etc.)                        |
| `.claude/settings.local.json` | Permissions           | **67 lines of accumulated one-off SKIP\_\* push permissions** — messy, many are stale        |
| `/pre-commit-fixer` skill     | Hook failure recovery | EXISTS — spawns subagents to fix ESLint, patterns, headers, cross-doc, index issues          |
| `/session-begin` skill        | Session startup       | EXISTS — loads context, runs health, surfaces warnings                                       |
| `block-push-to-main.js` hook  | Push protection       | EXISTS — blocks push to main/master, but doesn't block push to other branches without asking |
| `session-start.js` hook       | SessionStart          | EXISTS — runs on every session start                                                         |

---

## Reframe Check

The insights report suggests 5 CLAUDE.md additions, 3 features to try, and 3
usage pattern fixes. However, several of these are **already partially solved**
by existing systems (pre-commit-fixer, session-begin, block-push-to-main).

**The real gaps are:**

1. **CLAUDE.md lacks environment-specific guidance** — no git operations rules,
   no Windows awareness, no question batching cap
2. **settings.local.json is a mess** — 67 lines of accumulated one-off
   permissions, many stale
3. **No "ask before push" enforcement** — block-push-to-main prevents main
   pushes but doesn't prevent unwanted pushes to feature branches
4. **pre-commit-fixer exists but isn't part of the default workflow** — Claude
   doesn't automatically use it when hooks fail

**Recommendation:** Focus on CLAUDE.md additions + settings.local.json cleanup +
hook/workflow improvements. Skip creating new skills that duplicate existing
ones.

---

## Cross-Initiative Overlap Analysis

Three active/recent initiatives have potential overlap with insights findings:

### 1. Pre-Commit/Pre-Push Overhaul (Session #224 — COMPLETE)

**44 decisions, 10 waves, 14 SWS tenets addressed.**

| Insight Finding               | Overlap                                                                                                                                                                 | Status         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| F1 (pre-commit retry spirals) | **DIRECTLY ADDRESSED** — W2 eliminated 10 silent failure paths, W3 added end-of-hook summary with per-check timing, W6 parallelized pre-commit checks for ~3-4s savings | COMPLETE       |
| S6 (hook: pre-commit dry-run) | **PARTIALLY ADDRESSED** — hooks now surface clear errors instead of failing silently, but no Claude Code hook that dry-runs before `git commit`                         | GAP REMAINS    |
| S7 (/safe-commit skill)       | **PARTIALLY ADDRESSED** — `/pre-commit-fixer` skill exists and is better scoped. What's missing is Claude automatically invoking it on hook failure.                    | BEHAVIORAL GAP |

**Net:** The hook infrastructure is solid now. The remaining gap is **Claude's
behavior** — it doesn't automatically use the existing recovery tools.

### 2. Agent Environment Analysis (Session #223-225 — IN PROGRESS)

**22 decisions, Phases 1-2 complete, Phases 3-5 pending.**

| Insight Finding                          | Overlap                                                                                                                                     | Status              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| F2 (wrong plan/context at session start) | **INDIRECTLY ADDRESSED** — D12 (workflow gap analysis) may surface this as a gap. Agent improvements could include smarter context loading. | PENDING (Phase 3-5) |
| S8 (headless mode for batch audits)      | **ALIGNED** — D14 (Agent Teams integration targets) includes audits. Parallel agent execution is a primary goal.                            | PENDING (Phase 4)   |

**Net:** Agent overhaul may naturally solve some context-loading issues, but
won't directly add CLAUDE.md behavioral rules.

### 3. GitHub Optimization Plan (Session #225 — PLANNED, not started)

**30 decisions, 5 waves planned.**

| Insight Finding               | Overlap                                                                                    | Status     |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ---------- |
| F3 (push without asking)      | **NOT ADDRESSED** — GitHub plan focuses on remote GitHub config, not local Claude behavior | NO OVERLAP |
| F4 (Windows environment)      | **NOT ADDRESSED** — GitHub plan is platform-agnostic                                       | NO OVERLAP |
| S1 (CLAUDE.md Git Operations) | **NOT ADDRESSED** — GitHub plan doesn't touch CLAUDE.md behavioral rules                   | NO OVERLAP |
| settings.local.json cleanup   | **NOT ADDRESSED** — GitHub plan works on `.github/` files, not Claude settings             | NO OVERLAP |

**Net:** Zero overlap. GitHub optimization is about remote GitHub
infrastructure. This plan is about local Claude Code behavior.

---

## Locale-Specific vs Universal Classification

For the merge step with the home-locale plan:

| Item                             | Classification       | Why                                                     |
| -------------------------------- | -------------------- | ------------------------------------------------------- |
| CLAUDE.md Git Operations section | **UNIVERSAL**        | Push behavior should be consistent everywhere           |
| CLAUDE.md question batching rule | **UNIVERSAL**        | Applies regardless of environment                       |
| CLAUDE.md pre-PR verification    | **UNIVERSAL**        | Same workflow everywhere                                |
| CLAUDE.md Windows guidance       | **WORK-LOCALE ONLY** | Home is likely Linux/Mac or less restricted Windows     |
| settings.local.json cleanup      | **WORK-LOCALE ONLY** | Each locale has its own settings.local.json             |
| Push enforcement hook            | **UNIVERSAL**        | Goes in settings.json (shared), not settings.local.json |
| Pre-commit-fixer auto-trigger    | **UNIVERSAL**        | Same hook infrastructure everywhere                     |
| Session context verification     | **UNIVERSAL**        | Context amnesia happens in both environments            |

---

## Updated Reframe

After cross-referencing all three initiatives:

1. **Pre-commit hook friction (F1)** is largely SOLVED by Session #224. The
   remaining gap is behavioral — making Claude use the tools that exist.
2. **Context amnesia (F2)** may be addressed by the Agent Environment overhaul
   but isn't guaranteed. A CLAUDE.md rule is cheap insurance.
3. **Push without asking (F3)** is NOT addressed anywhere. Pure gap.
4. **Windows guidance (F4)** is NOT addressed anywhere. Work-locale-specific.
5. **settings.local.json mess** is NOT addressed anywhere. Work-locale-specific.

**Scope after dedup: 5 items are genuinely new work. 3 are universal, 2 are
work-locale-specific.**
