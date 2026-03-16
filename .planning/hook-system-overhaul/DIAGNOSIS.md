# DIAGNOSIS: Pre-Commit/Pre-Push Hook System Overhaul

**Date:** 2026-03-16
**Discovery Method:** 7-agent parallel convergence loop (5 code explorers + ground-truth verifier + execution verifier)
**Prior Work:** Mini-audit PR #427 (35 decisions, 8 waves), SWS D36 (Hooks L3→L4)

---

## ROADMAP Alignment

**Status: ALIGNED** — Hooks ecosystem (D36) is Phase 3 Wave 2 in SWS PLAN-v3.md. This deep-plan is **scoped to pre-commit/pre-push git hooks only** — learnings, surfacing, silent failures, and improvements. It feeds INTO the D36 child plan but is not the full D36 scope (which also covers Claude Code hooks, CI/CD, hook test infra, and the hook-ecosystem-audit skill). D36 child plan will be adjusted after this work to reflect what was covered here.

---

## System Overview

The hook system has **two layers**:
1. **Git hooks** (Husky v9): `.husky/pre-commit` (13 checks, waves 0-12), `.husky/pre-push` (7 checks + 3 parallel jobs)
2. **Claude Code hooks** (`.claude/hooks/`): SessionStart, PreToolUse, PostToolUse, PreCompact — 10+ hook scripts

**Data stores:** 4 JSONL/JSON files capturing warnings, overrides, agent invocations, and commit logs.
**Consumers:** 5 scripts read these stores (session-start, run-alerts, hook-analytics, hook-pipeline health checker, append-hook-warning for occurrence counting).

**Execution verification:** All 17 scripts run successfully (exit 0). All file writes verified correct. Husky wired via `core.hooksPath`. Gitleaks installed.

---

## Findings by SWS Tenet

**Source:** `.planning/system-wide-standardization/tenets.jsonl` (19 tenets)
**Relevant to hooks:** 14 of 19 tenets have violations or applicability

### User Tenet (not numbered in SWS): Warnings Are a Call to Action, Not Informational
*Maps to T8 (Automation over discipline) + T11 (Fail loud, fail early)*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **Warnings don't block pushes** — hook-warnings.json has entries at severity "error" (auto-escalated from 15+ occurrences) but pre-push doesn't check this file | HIGH | warning-infra-explorer: "propagation" at severity "error", push succeeds |
| **4 non-blocking checks in pre-commit** (skills, agent compliance, JSONL-MD sync, doc index fail) produce warnings with no required action | MEDIUM | pre-commit waves 6, 10, 12, and wave 8 failure path |
| **Severity escalation is cosmetic** — escalating from "info" to "warning" to "error" changes the label but not the behavior | HIGH | append-hook-warning.js: escalation at lines 195-199 changes field, nothing reads it to block |

### T2 (SWS): Source of Truth, Generated Views
*"Every system has ONE authoritative source. Everything else is derived/generated."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **hook-warnings.json (JSON) vs hook-warnings-log.jsonl (JSONL)** — two files store overlapping warning data with separate occurrence counts. Neither is clearly the "source" | MEDIUM | append-hook-warning.js writes both; session-start reads JSON, occurrence counting reads JSONL |
| **override-log.jsonl has no generated view** — raw JSONL only, analytics requires manual `npm run hooks:analytics` | LOW | No MD or dashboard generated from this data |

### T4 (SWS): JSONL-First
*"JSONL is the canonical storage format. MD is generated for human consumption."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **hook-warnings.json is JSON, not JSONL** — the primary user-facing warnings file violates JSONL-first | MEDIUM | hook-warnings.json: single JSON object with warnings array |
| **warned-files.json is JSON** — same violation (though file is dead/empty) | LOW | .claude/state/warned-files.json |

### T5 (SWS): Contract Over Implementation
*"CANON defines the contract. How each ecosystem implements it is their business."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **No formal hook contract** — no specification for what a hook check must output (exit codes, file writes, warning format, required metadata) | HIGH | Each check implements its own output format ad-hoc |
| **No hook registry** — no declarative list of "these are all the checks, their expected behavior, and their data contracts" | MEDIUM | Checks discovered by reading shell scripts, not from a manifest |

### T7 (SWS): Platform Agnostic by Default
*"All artifacts MUST work identically on Claude Code Desktop (Linux sandbox) and Windows CLI."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **`.husky/pre-commit` and `pre-push` are bash scripts** — work on Git Bash but not native PowerShell | MEDIUM | Already noted in T7 tenet as known constraint |
| **`_shared.sh` uses bash-specific constructs** — POSIX-compatible but still shell, not Node.js | LOW | T7 prescribes "Node.js over bash" |

### T8 (SWS): Automation Over Discipline
*"If a process relies on human memory, it WILL fail. Automate enforcement or accept non-compliance."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **Hook analytics requires manual invocation** — `npm run hooks:analytics` not automated | MEDIUM | No programmatic consumers |
| **Skip reason review is manual** — no automated detection of problematic patterns | MEDIUM | 50.7% "pre-existing" discovered only by manual analysis |
| **No automated hook performance tracking** — no timing data captured | LOW | No check captures duration |

### T9 (SWS): Crash-Proof State
*"State survives compaction, session boundaries, crashes, and network failures."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **`.session-agents.json` is session-scoped, lost on crash** — no persistent backup | LOW | Created on-demand, not persisted across crashes |
| **hook-warnings.json can be corrupted by crash mid-write** — atomic write uses temp+rename but no fsync | LOW | append-hook-warning.js: rename is atomic on same filesystem but not crash-safe |

### T11 (SWS): Fail Loud, Fail Early
*"When something is wrong, it screams immediately. Errors block, they don't whisper."*

### User Tenet: No Passive Surfacing — Needs Action

| Finding | Severity | Evidence |
|---------|----------|----------|
| **Session-start warning gate exists but is opt-in** — user can acknowledge all warnings in bulk without reviewing | MEDIUM | session-begin skill Phase 4: "Acknowledge all [Y]" path |
| **Hook analytics is pull-only** — `npm run hooks:analytics` must be manually invoked, no automatic surfacing of override trends | MEDIUM | hook-analytics.js: CLI-only, no programmatic consumers |
| **Override-to-DEBT auto-generation is silent** — creates S1 DEBT entry at 15+ bypasses but never notifies the user | MEDIUM | log-override.js lines 210-267: try/catch swallows all output |

### T12 (SWS): Idempotent Operations
*"Every script produces the same result whether run once or five times."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **Auto-DEBT generation deduplicates by source_id** — idempotent ✓ | OK | log-override.js lines 226-230 |
| **append-hook-warning deduplicates within 1 hour** — mostly idempotent but occurrence counts increment | LOW | Re-running within 1h = skipped; after 1h = new entry with incremented count |
| **Log rotation is NOT idempotent** — running rotation twice could archive different amounts | LOW | Size-based rotation depends on current file size |

### T14 (SWS): Capture Everything, Surface What Matters
*"Ideas, findings, tangential thoughts MUST be recorded. Then surface what's actionable."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **Hook successes not captured** — only failures/warnings logged. Can't calculate pass rates | MEDIUM | No "check X passed" entries in any log |
| **Hook timing not captured** — can't identify slow checks degrading DX | MEDIUM | No duration data anywhere |
| **Cross-hook correlation missing** — same file triggering warnings in both pre-commit and pre-push appears as unrelated entries | LOW | No "repeat offender" view |

### T16 (SWS): Single Ownership, Many Consumers
*"Every component has exactly one owner. Others consume, never supersede."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **hook-warnings.json has 2 writers** — append-hook-warning.js writes entries, session-start clears | LOW | Acceptable if clear ownership: append owns writes, session-start owns lifecycle |
| **override-log.jsonl has 2 writers** — log-override.js main path + check-triggers.js fallback direct write | MEDIUM | check-triggers.js lines 361-382 bypass log-override.js entirely |

### T17 (SWS): Declarative Over Imperative
*"Declare WHAT should be, let tools enforce HOW."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **No declarative hook manifest** — which checks run, their severity, their data contracts are all embedded in imperative shell scripts | HIGH | .husky/pre-commit is 400+ lines of imperative bash |
| **No declarative check config** — adding/removing a check requires editing shell scripts | MEDIUM | No JSON/JSONL config file listing checks |

### T18 (SWS): Changelog-Driven Traceability
*"Every ecosystem change that affects another system MUST be logged in a standardized changelog."*

| Finding | Severity | Evidence |
|---------|----------|----------|
| **No hook-ecosystem changelog** — changes to hooks not tracked in any JSONL changelog | MEDIUM | No .planning/changelogs/ entry for hooks |
| **Cross-ecosystem impact untracked** — when a hook change affects sessions or skills, no trace | MEDIUM | No cross-ecosystem logging |

### User Tenet: AUTOMATION ALWAYS (overlaps T8)

| Finding | Severity | Evidence |
|---------|----------|----------|
| **Hook analytics requires manual invocation** — no automated trend analysis or alerting | LOW | Only triggered by `npm run hooks:analytics` |
| **Skip reason review is manual** — no automated detection of problematic skip patterns (same check skipped 5+ times with similar reasons) | MEDIUM | override-log.jsonl: 50.7% "pre-existing" entries, discovered only by manual analysis |
| **No automated hook performance tracking** — no timing data captured for any check | LOW | No check captures duration |

### T4: No Silent Failures

| Finding | Severity | Details |
|---------|----------|---------|
| **gitleaks not installed** → warns to stdout, continues, NOT logged to hook-warnings | HIGH | pre-commit wave 0: `command -v gitleaks` fails silently |
| **lint-staged not installed** → warns, continues, NOT logged | MEDIUM | pre-commit wave 1b: same pattern |
| **npm audit network error** → skips entirely, no warning logged | MEDIUM | pre-push check 6: network failure = silent skip |
| **5x `\|\| true` on append-hook-warning calls** in pre-push → warning writes silently swallowed | HIGH | pre-push lines 51, 90, 119, 194, 281 |
| **Log file > 2MB** → write skipped silently (no notification) | LOW | append-hook-warning.js line 76 |
| **Symlink detected on log file** → returns early, no error | LOW | Multiple scripts: isSafeToWrite() returns false silently |
| **Log rotation fails** → non-fatal, no notification | LOW | log-override.js line 126, 139 |
| **fnm unavailable** → falls back silently | LOW | _shared.sh: _shared_init_fnm() swallows errors |
| **Auto-DEBT creation fails** → try/catch swallows all errors | MEDIUM | log-override.js line 265 |
| **check-propagation.js silent on pass** → no output at all, can't distinguish "ran and passed" from "didn't run" | LOW | Execution verifier: empty stdout on exit 0 |

### T5: No Orphaned Processes/Files Unless by Design

| Finding | Severity | Evidence |
|---------|----------|----------|
| **`warned-files.json` is empty/unused** — file exists, referenced in code, but never populated | MEDIUM | Ground-truth verifier: `{}` (0 keys); warning-infra-explorer: dead code |
| **`commit-failures.jsonl` doesn't exist** — referenced in hook-analytics.js but never written | MEDIUM | hook-analytics.js line 215: reads file that doesn't exist, returns [] |
| **`agent-invocations.jsonl` has NO rotation** — unbounded growth (~3KB/day, ~900KB/year) | LOW | warning-infra-explorer: no rotation function found |
| **`.session-agents.json` missing** — expected per schema, created on-demand but not present | LOW | ground-truth-verifier: not found |

---

## Skip Reason Analysis (146 entries, 2026-03-07 to 2026-03-15)

| Check | Count | % | Signal |
|-------|-------|---|--------|
| propagation | 44 | 30.1% | Endemic — 100+ files across codebase |
| cc | 43 | 29.5% | Baseline debt — CC violations heavily pre-existing |
| reviewer | 11 | 7.5% | Mixed legitimate/questionable |
| triggers | 9 | 6.2% | Mostly legitimate (hook internals changed) |
| cross-doc-deps | 8 | 5.5% | Legitimate scope isolation |
| cognitive-cc | 5 | 3.4% | Same as CC — baseline issue |
| doc-index | 4 | 2.7% | Automated session-end commits |
| doc-header | 4 | 2.7% | Automated session-end commits |
| pattern-compliance | 2 | 1.4% | Rare |
| debt-schema | 1 | 0.7% | Rare |

**Critical:** 50.7% of all skips cite "pre-existing" — the ban from mini-audit C4-G1 should be catching these. Either (a) the ban wasn't enforced during the period these entries were logged, or (b) the entries predate the ban implementation. Need to verify.

**Adjustment candidates:**
- **propagation + cc (59.6%)**: Baseline mode should eliminate these — verify regression-only gating is active
- **reviewer (7.5%)**: 4-hour window gate implemented in PR #427 — verify it's active

---

## Prior Decisions Still in Force

**Mini-audit (PR #427):** 35 decisions across 10 categories, all 8 waves complete.
**Deferred:** C3-G4 (closed-loop verification — learning_addressed tracking), C8-G2 (null/undefined safety gate)
**SWS cross-cutting (Q34-Q38):** Progressive enforcement, no silent fails, no orphans, skill-audit pipeline, decision recall
**SWS D36:** Hooks L3→L4, Phase 3 Wave 2, Medium effort

---

## Reframe Check

**Is this task what it appears to be?** Partially. The user asked about learnings, surfacing, gaps, and silent failures — but the discovery reveals this is fundamentally about **SWS tenet alignment**. The hook system was built with a "best-effort, never block" philosophy. The 19 SWS tenets demand the opposite across multiple dimensions:

- **T11 (Fail loud)** + **T8 (Automation)**: Every failure visible, every warning actionable
- **T2 (Source of truth)** + **T4 (JSONL-first)**: Single canonical store, JSONL format
- **T5 (Contract)** + **T17 (Declarative)**: Formal hook contracts, declarative config
- **T7 (Platform agnostic)**: Node.js over bash
- **T14 (Capture everything)**: Success + timing + correlation data
- **T18 (Changelog traceability)**: Cross-ecosystem impact tracking

**14 of 19 SWS tenets** have findings against the hook system. This is a systemic alignment task, not a gap-fill.

**Recommended framing:** Pre-Commit/Pre-Push SWS Tenet Alignment — aligning git hook infrastructure with SWS tenets. Feeds into D36 (Hooks L3→L4) but scoped to pre-commit/pre-push only. D36 child plan adjusted after completion.

---

## Verified Claims

| Claim | Verification | Status |
|-------|-------------|--------|
| All 17 scripts exit 0 | Execution verifier ran each script | CONFIRMED |
| Husky wired via core.hooksPath | `git config core.hooksPath` = `run/_` | CONFIRMED |
| Gitleaks installed | `which gitleaks` found at WinGet path | CONFIRMED |
| hook-warnings.json has 50 entries | Ground-truth + execution verifier | CONFIRMED (49 after cleanup) |
| override-log.jsonl has 146 entries | Skip-reason explorer + execution verifier | CONFIRMED |
| warned-files.json is empty | Ground-truth verifier | CONFIRMED |
| commit-failures.jsonl doesn't exist | Ground-truth verifier | CONFIRMED |
| append-hook-warning writes to both files | Execution verifier: test write + read-back | CONFIRMED |
| log-override writes to override-log.jsonl | Execution verifier: test write + read-back | CONFIRMED |
| "pre-existing" ban in require_skip_reason() | Code explorer: _shared.sh function | CONFIRMED in code, enforcement timing vs log dates UNVERIFIED |
