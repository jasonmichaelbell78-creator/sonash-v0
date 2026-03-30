<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-29
**Status:** DRAFT
<!-- prettier-ignore-end -->

# DIAGNOSIS: Hook If-Conditions Implementation

## Research Context

Injected from `.research/hook-if-conditions/` (33 agents, 60 claims, L1 depth).
Research completed 2026-03-29 (Session #244). Cross-model verified via Gemini
CLI. 5 contradictions resolved, 4 open.

## ROADMAP Alignment

**ALIGNED.** This work falls under "🔧 1. Tooling & Infrastructure" (ACTIVE,
P0). Hook infrastructure improvements directly serve the tooling milestone.

## Existing State

### Already Done (This Session)

- 3 `if` conditions applied: block-push-to-main (`Bash(git push *)`),
  pre-commit-agent-compliance (`Bash(git commit *)`), commit-tracker
  (multi-pattern)
- 9 grep→git pathspec replacements in hooks
- Pattern compliance + triggers consumers switched to `--json` + `jq`
- Trigger warning logging fix (individual triggers, not header)

### Current Hook Infrastructure

- **21 hooks total**: 17 project (.claude/settings.json), 4 user-level
  (~/.claude/settings.json)
- **ensure-fnm.sh wrapper**: adds ~191ms per invocation (167ms fnm overhead +
  24ms bash) when node is already on PATH. 16 of 17 project hooks use this
  wrapper.
- **GSD context-monitor**: fires on ALL PostToolUse with no matcher. ~92%
  bail-out rate.
- **Duplicate**: P4 + U1 both run GSD update checks to same cache file.
- **Dead code**: `isMarkdownFile`, `isConfigFile` in post-write-validator.js
  (defined, never referenced)

### Key Research Findings

1. **`if` works with ALL tools** — Write, Edit, Read, Bash, etc. (D3-S, GV1)
2. **Template syntax NOT supported** — `{{ variable }}` doesn't work in `if`
   (G5)
3. **Windows paths POSIX-normalized** before `if` matching (GV1)
4. **Hooks NOT hot-reloaded** — require session restart (G2, GV1)
5. **Exit code 2 = BLOCK** for PreToolUse hooks (GV1)
6. **Compound bypass risk LOW** — permission engine is compound-aware, 3-layer
   defense exists (G6)
7. **PostToolUseFailure supports `if`** — confirmed by D1-spec and GV2

## Implementation Targets (from Research)

### Infrastructure Fixes (highest ROI)

- I1: Lean ensure-fnm.sh wrapper (~138ms savings × 50+ calls/session)
- I2: GSD context-monitor broad matcher (~48% spawn reduction)
- I3: Remove duplicate GSD update check

### PreToolUse Prevention Gates (new capability)

- Gate 3: .env.local.encrypted block (5-min inline ship)
- Gate 1: Settings.json self-protection (self-bootstrapping)
- Gate 2: Firestore rules guard
- Gate 5-8: Package.json, large file, firebase.json, storage rules

### OTB Tier 1 (new hooks)

- T1-1: Settings.json guardian (PostToolUse validation)
- T1-2: Governance change logger (PostToolUse JSONL)
- T1-3: Groundhog Day loop detector (PostToolUseFailure — first in project)

### Tier 2 (deferred)

- Deploy safeguard, test tracker, large file warning, branch context

## Reframe Check

The task is what it appears to be — implementation of verified research
findings. No reframe needed. The research already did extensive feasibility
triage.

## Key Constraints

- Hooks require session restart to take effect
- WORK locale PATH must be verified before ensure-fnm.sh changes
- PreToolUse gates only cover Write/Edit tool paths (not Bash rm/echo)
- PostToolUseFailure is untested in this project (T1-3 is first use)
