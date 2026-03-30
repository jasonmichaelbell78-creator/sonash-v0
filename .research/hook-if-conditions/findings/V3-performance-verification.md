# Verification: Performance Claims (D7, D7-S)

**Verifier:** verification-agent
**Date:** 2026-03-29
**Source findings:** D7-performance.md, D7-S-fnm-overhead.md
**Method:** Direct measurement on this machine + data analysis of state files

---

## Claim 1: ensure-fnm.sh adds ~167ms overhead per invocation

**PARTIALLY VERIFIED -- overhead confirmed, magnitude higher than claimed**

### Measurements (3 runs each, median selected)

| Scenario | Run 1 | Run 2 | Run 3 | Median |
|---|---|---|---|---|
| Bare `node -e "process.exit(0)"` | 78ms | 53ms | 62ms | **62ms** |
| `bash .claude/hooks/ensure-fnm.sh node -e "process.exit(0)"` | 253ms | 224ms | 256ms | **253ms** |

**Measured overhead: 253ms - 62ms = 191ms**

D7-S claimed ~167ms overhead (233ms total - 66ms bare node). My measurements show
**191ms overhead** (253ms total - 62ms bare node). The direction and order of
magnitude are correct. The difference (~24ms) is within normal variance for Windows
timing -- bash `time` granularity, background process noise, and cold/warm cache
effects can easily account for this.

D7-performance.md claimed ~161ms overhead (234ms - 73ms). Also within variance.

**Verdict: The overhead is real and significant. The 167ms figure is a reasonable
central estimate. My independent measurement of 191ms is slightly higher but
consistent with the claim's 10-run methodology vs my 3-run methodology.**

---

## Claim 2: Pre-commit average is 44.4 seconds (64 runs)

**VERIFIED -- exact match**

### Analysis of `.claude/state/hook-runs.jsonl`

Parsed all 108 records. Filtered for `hook === "pre-commit"`:

| Metric | Claimed (D7) | Measured |
|---|---|---|
| Count | 64 runs | **64 runs** |
| Average | 44,381ms (44.4s) | **44,381.4ms (44.4s)** |
| Minimum | 5,290ms | **5,290ms** |
| Maximum | 147,714ms | **147,714ms** |

All four statistics match exactly. The data source is the same file (hook-runs.jsonl),
so this is a reproducibility check confirming the computation was done correctly
rather than an independent measurement.

**Verdict: VERIFIED. Statistics are accurate.**

---

## Claim 3: 8.1 commits per session average

**VERIFIED -- within rounding tolerance**

### Analysis of `.claude/state/commit-log.jsonl`

| Metric | Claimed (D7) | Measured |
|---|---|---|
| Total commits | 639 | **639** |
| Sessions inferred (2hr gap) | 79 | **80** |
| Avg commits/session | 8.1 | **8.0** |
| Median commits/session | 5 | **4** |

The slight difference (79 vs 80 sessions, 8.1 vs 8.0 avg) is likely due to
session boundary detection: the 2-hour gap threshold can produce different counts
depending on how timestamps at exact boundaries are handled (inclusive vs exclusive,
or millisecond precision differences). The median difference (5 vs 4) suggests one
session boundary was classified differently.

**Verdict: VERIFIED. The 8.1 figure is reproducible within session-inference
tolerance. The claim is accurate.**

---

## Claim 4: fnm is redundant because node is already on PATH

**VERIFIED**

### Test: bare shell without rc files

```
$ bash --norc --noprofile -c 'which node && node --version'
/c/Users/jason/AppData/Roaming/fnm/aliases/default/node
v22.22.1
```

Node resolves in a completely bare bash subshell with no `.bashrc`, `.bash_profile`,
or any shell initialization. The path `/c/Users/jason/AppData/Roaming/fnm/aliases/default/node`
is present in the Windows User environment PATH registry, not injected by shell init.

D7-S's claim that `fnm/aliases/default` is in the Windows User PATH permanently is
confirmed. The `ensure-fnm.sh` wrapper's `fnm env --shell bash` and
`fnm use --silent-if-unchanged` calls are redundant on this machine -- they set up
an environment that is already configured.

**Verdict: VERIFIED. On this machine, the ensure-fnm.sh wrapper is doing redundant
work. The fnm env setup it performs is already baked into the Windows User PATH.
The D7-S caveat about other locales remains valid -- this cannot be verified here.**

---

## Claim 5: Lean wrapper (check node on PATH first, skip fnm) would reduce overhead to ~5ms

**REFUTED -- the ~5ms figure understates the actual overhead**

### What D7-S actually claimed

D7-S stated: "Estimated overhead on this machine: ~5ms (just the `command -v node`
check, no fnm spawns)."

### Measurements

| Scenario | Run 1 | Run 2 | Run 3 | Median |
|---|---|---|---|---|
| `bash -c 'echo ok'` (bare subshell baseline) | 38ms | 40ms | 52ms | **40ms** |
| `bash -c 'command -v node >/dev/null 2>&1'` (check only) | 40ms | 45ms | 50ms | **45ms** |
| `bash -c 'if command -v node ...; then node -e "process.exit(0)"; fi'` (full lean) | 121ms | 115ms | 113ms | **115ms** |

The `command -v node` check itself adds only ~5ms over a bare bash subshell
(45ms - 40ms = 5ms). This is what D7-S meant by "~5ms overhead."

However, this is misleading in context. The relevant comparison is **total
invocation time** for running a hook:

| Approach | Total time | Overhead vs bare node (62ms) |
|---|---|---|
| Current (ensure-fnm.sh) | 253ms | **191ms** |
| Lean wrapper | 115ms | **53ms** |
| Bare node (no wrapper) | 62ms | **0ms** |

The lean wrapper reduces overhead from ~191ms to ~53ms -- a 72% reduction, which is
significant. But calling this "~5ms overhead" is technically only correct if you
define "overhead" as the marginal cost of the `command -v` check alone, ignoring the
bash subshell spawn cost that is inherent in any wrapper approach.

**Per-session impact recalculated:**
- At 50 invocations: current = 9.6s overhead, lean = 2.7s overhead (saves 6.9s)
- At 336 invocations: current = 64.2s overhead, lean = 17.8s overhead (saves 46.4s)

**Verdict: REFUTED as stated. The ~5ms figure is misleading. The lean wrapper's
true overhead vs bare node is ~53ms per invocation, not ~5ms. The ~5ms refers only
to the `command -v` check, not the total wrapper cost. The lean wrapper is still a
major improvement (72% overhead reduction), but the claimed figure is wrong in the
context where it matters (total hook invocation cost).**

---

## Claim 6: D7 wrongly stated `if` only works on Bash

**VERIFIED -- the incorrect statement exists**

### Location

D7-performance.md, lines 236-238:

> **The `if` condition feature in Claude Code settings.json only applies to**
> **`PreToolUse` and `PostToolUse` hooks with a Bash matcher,** using the pattern
> `Bash(command pattern)`. It cannot filter on file paths, content, or non-Bash
> tool arguments.

Additionally, line 205:

> No `if` condition is possible for `UserPromptSubmit` events based on the Claude
> Code `if` pattern (which only applies to `PreToolUse` and `PostToolUse` Bash
> calls).

And the summary table (lines 228-234) marked PostToolUse Read/Write/Edit `if`
conditions as "NOT POSSIBLE."

### Correction

The RESEARCH_OUTPUT.md (Section 8 - Contradictions, Contradiction 1) already
identified and resolved this:

> D3-S-tool-compatibility.md verdict: **D7 is wrong.** This was an inductive
> fallacy -- observing all three existing `if` conditions in the repo use
> `Bash(...)` patterns, then concluding Bash-only is the feature's scope.

The `if` field works with all tool types: `Bash(git *)`, `Edit(*.ts)`, `Read(.env)`,
`Write(src/**)`, `Glob(*.ts)`, `Grep(TODO)`, `WebFetch(domain:example.com)`,
`WebSearch(*)`, `Agent(Explore)`.

The part about `UserPromptSubmit` not supporting `if` IS correct -- `if` only works
on PreToolUse, PostToolUse, PostToolUseFailure, and PermissionRequest events.

**Verdict: VERIFIED. The incorrect statements exist at the cited locations. D7
incorrectly narrowed `if` to Bash-only patterns. The research already self-corrected
this via D3-S. The event-type limitation (no `if` on UserPromptSubmit/SessionStart)
is correctly stated.**

---

## Summary

| # | Claim | Verdict | Notes |
|---|---|---|---|
| 1 | ensure-fnm.sh adds ~167ms overhead | **PARTIALLY VERIFIED** | Measured 191ms; within variance of 167ms claim |
| 2 | Pre-commit average 44.4s (64 runs) | **VERIFIED** | Exact match on all statistics |
| 3 | 8.1 commits per session average | **VERIFIED** | 8.0 measured; within session-inference tolerance |
| 4 | fnm redundant (node on PATH) | **VERIFIED** | Confirmed in bare `bash --norc --noprofile` subshell |
| 5 | Lean wrapper reduces to ~5ms overhead | **REFUTED** | True overhead is ~53ms vs bare node, not ~5ms. The 5ms is only the `command -v` check cost |
| 6 | D7 wrongly stated `if` is Bash-only | **VERIFIED** | Incorrect statements found at lines 205, 236-238. Already self-corrected by D3-S |

### Measurement Methodology

- All timing via bash `time` builtin on Windows 11 (Git Bash)
- 3 runs per scenario, median selected
- Data analysis via Node.js scripts parsing JSONL state files
- No external tools or cached results; all measurements fresh

### Key Takeaway

The performance research is solid. The core measurements (spawn costs, pre-commit
durations, commit frequency) are accurate and reproducible. The only material
inaccuracy is the ~5ms lean wrapper claim, which understates the real overhead by
~10x. The Bash-only `if` claim was already caught and corrected within the research
itself. The fnm wrapper redundancy finding is confirmed and represents a genuine
optimization opportunity.
