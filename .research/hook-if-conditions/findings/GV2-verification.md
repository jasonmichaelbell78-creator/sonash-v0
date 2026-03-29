# GV2: Ground-Truth Verification of G4, G5, and G6 Findings

**Verifier:** Verification agent (Opus 4.6)
**Date:** 2026-03-29
**Inputs:** G4-otb-triage.md, G5-template-syntax.md, G6-compound-bypass.md
**Method:** Cross-reference against settings.json, block-push-to-main.js, Claude
Code official docs (via context7), and D1-spec research findings

---

## Verification 1: G4 Tier 1 Items Feasibility

### G4 Claim: Three items implementable in < 2 hours total

#### T1-1: Settings.json Guardian Hook (30-45 min)

**VERIFIED** -- Feasible as described.

Evidence:
- `settings.json` exists at `.claude/settings.json` (confirmed by reading it)
- The proposed `if: "Write(.claude/settings.json)|Edit(.claude/settings.json)"`
  uses PostToolUse on Write/Edit tools. Both are valid tool events for `if`
  (D1-spec Section 6 confirms PostToolUse supports `if`).
- No conflicting hooks exist. The existing Write/Edit hooks fire
  `post-write-validator.js` under separate matcher groups. G4 correctly proposes
  a new matcher group, not a sibling handler.
- The proposed `continueOnError: true` is correct for a meta-safety hook.
- Effort estimate of 30-45 min is reasonable for a PostToolUse validation script
  that reads from disk and performs JSON schema checks.

#### T1-2: Governance Change Logger (20-30 min)

**VERIFIED** -- Feasible as described.

Evidence:
- `.claude/state/` directory exists with established JSONL append patterns
  (confirmed by settings.json containing hooks that reference state files).
- The proposed `if` pattern covers CLAUDE.md and settings.json edits -- both
  are root-level files with stable paths.
- `git show HEAD:<file>` works in Git Bash on Windows (G4 correctly notes this).
- 20-30 min is reasonable for a diff-and-append script using existing lib/
  utilities.

#### T1-3: Groundhog Day Loop Detector (45-60 min)

**VERIFIED with caveat** -- Feasible, but the PostToolUseFailure event type
claim requires qualification.

Evidence:
- `PostToolUseFailure` IS a supported hook event in Claude Code. Official docs
  (via context7) confirm it: "Runs when a tool execution fails. Used to log
  errors, send alerts, or provide corrective feedback to Claude."
- `PostToolUseFailure` IS one of the four events that support the `if` field.
  D1-spec Section 6 explicitly lists it: PreToolUse, PostToolUse,
  **PostToolUseFailure**, PermissionRequest. Official docs confirm: "Adding it
  to any other event prevents the hook from running."
- The proposed `if` pattern uses Bash command matching, which is the documented
  pattern for PostToolUseFailure (the event receives `tool_name` and `error`
  fields per the official API doc).
- **Caveat:** G4 states "D1-spec confirms" that `if` works on
  PostToolUseFailure. This is accurate -- D1-spec does list it. However, there
  are **zero existing PostToolUseFailure hooks in this project** (confirmed by
  reading settings.json -- no PostToolUseFailure event key exists). This would
  be the first, so there is no empirical production evidence it works. The
  official docs are clear, but the "no examples in this project yet" note in G4
  is an honest disclosure.
- **Second caveat:** The `if` pattern proposed is
  `Bash(npm run build *)|Bash(npm test *)|...`. PostToolUseFailure receives
  `tool_name` (e.g., "Bash") and `error` (the failure description). The docs
  show the stdin format includes `tool_name` and `error`, but it is not 100%
  clear that the `if` matcher receives the original `command` argument for Bash
  tools on failure events. G4 assumes it does ("PostToolUseFailure provides the
  same stdin format as PostToolUse") -- this is a reasonable but unverified
  assumption.
- 45-60 min is reasonable for a rolling-window tracker with error hashing.

**Overall T1 verdict: VERIFIED.** All three are feasible within the stated time
estimates. The only uncertainty is whether PostToolUseFailure's `if` field
receives the original Bash command string for matching, which is reasonable to
assume but not empirically proven in this project.

---

## Verification 2: G4 Claim -- Lean fnm Wrapper is Critical Enabler for Tier 3

**VERIFIED** -- The blockers are genuinely about spawn cost, not other issues.

Evidence from G4 Tier 3 items:

| T3 Item | Stated Blocker | Is it spawn cost? |
|---------|---------------|-------------------|
| T3-1: Micro-Hook Architecture | "The math does not work until `ensure-fnm.sh` is replaced with a lean wrapper. At 167ms per spawn, 10 micro-hooks = 835ms. The monolith at 167ms once is 5x cheaper." | **YES** -- pure spawn cost math |
| T3-2: Skill Definition Validator | "HIGH RISK on Windows per D9. Windows path normalization." | **NO** -- this is a Windows path issue, not spawn cost |
| T3-3: Agent Definition Auto-Tester | "Same Windows path issue as T3-2. Additionally, YAML parser dependency." | **NO** -- Windows path + dependency issue |
| T3-4: Hook Composition Pipelines | "introduces implicit coupling... project currently does not have deploy workflows" | **NO** -- architectural and workflow blocker |
| T3-5: Hook Testing Framework | "reimplementation risk" of the pattern matcher | **NO** -- correctness risk |
| T3-6: Context Budget Fence | "`Read(node_modules/*)` pattern matching is uncertain on Windows" | **NO** -- Windows path issue |
| T3-7: Domain Routing Layer | "documentation convention, not a runtime feature" | **NO** -- no blocker at all |
| T3-8: Dynamic if Generation | "automated linter solves a problem that won't recur" | **NO** -- ROI concern |

**Verdict: PARTIALLY REFUTED.** The lean fnm wrapper is the critical enabler
for **T3-1 only** (Micro-Hook Architecture), not "Tier 3" broadly. Of 8 Tier 3
items, only T3-1 is blocked by spawn cost. T3-2, T3-3, and T3-6 are blocked by
Windows path issues. T3-4 and T3-5 have architectural blockers. T3-7 and T3-8
have ROI concerns. G4 does correctly identify the lean fnm wrapper as "the
single highest-leverage infrastructure improvement" in the Key Dependencies
section, but the claim that it is "the critical enabler for Tier 3" overstates
its scope -- it unblocks 1 of 8 items.

However, G4's Key Dependencies section also notes that the fnm wrapper "reduces
cost of all Tier 1/2 hooks from 167ms to ~5ms" and "unblocks T4-1/2/3
(high-frequency hooks)," which is accurate. The Tier 4 items (T4-1 Read
Frequency Tracker, T4-2 Hot-File Index Builder) are explicitly blocked by spawn
cost. So the wrapper is critical for Tier 4 promotion, even if Tier 3 has
diverse blockers.

---

## Verification 3: G5 Claim -- Template Syntax NOT Supported in `if` Fields

**VERIFIED** -- Template syntax is definitively not supported.

Evidence:
1. **Official docs (context7):** The hooks reference describes `if` as using
   "permission rule syntax." The PreToolUse, PostToolUse, and
   PostToolUseFailure API docs show only `matcher` and `hooks` array fields --
   no template variables, no `{{ }}` syntax, no expression evaluation.
2. **D1-spec finding:** "The `if` field uses the same pattern system as Claude
   Code permission rules (not a separate glob or regex engine)." The pattern
   syntax supports only `ToolName(argument_pattern)` with `*` wildcards.
3. **Interpolation inventory from G5:** G5 correctly identifies exactly three
   interpolation types in Claude Code hooks: (a) environment variables in
   `command` fields, (b) HTTP header interpolation in `headers` fields, (c)
   `$ARGUMENTS` in prompt hooks. None apply to `if`.
4. **No context7 results** for template variables, `{{ }}`, or dynamic
   conditions in hook `if` fields. The docs retrieved focus entirely on
   permission rule syntax.
5. **G5's open GitHub issues** (#34340, #27969, #34879) requesting context
   window exposure to hooks confirm the gap exists -- if template syntax
   worked, these issues would not be open.

G5's conclusion that `{{ context_window.remaining_percentage }} < 40` would
silently never match (treated as a literal permission rule pattern) is correct
and well-reasoned.

---

## Verification 4: G5 Claim -- `PreCompact` Hook Fires When Context is Full

**VERIFIED** -- PreCompact fires before compaction, which happens when context
is nearly full (or manually triggered).

Evidence from official Claude Code docs (context7, code.claude.com/docs/en/hooks):

> "Runs before a compact operation. Can be triggered manually via /compact or
> automatically when the context window is full."

And from the hooks reference:

> "The PreCompact hook executes immediately before Claude Code performs a
> compaction operation. The operation can be triggered either manually via the
> /compact command or automatically when the context window reaches its
> capacity."

The hook receives `trigger: "manual"` or `trigger: "auto"` to distinguish the
two cases. G5's description is accurate -- PreCompact fires when context IS
full (automatic) or when the user manually triggers /compact. It does not fire
at a configurable threshold, which G5 correctly notes as a limitation
("fires when context IS full, not at a configurable threshold").

The project already has a PreCompact hook in settings.json:
```json
"PreCompact": [{
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-compaction-save.js $ARGUMENTS",
    "statusMessage": "Saving state before compaction..."
  }]
}]
```

This confirms PreCompact is a real, supported event that is already in
production use in this project.

---

## Verification 5: G6 Claim -- Permission Engine is Compound-Aware (Post-Fix)

**VERIFIED** -- The exact quote exists in official docs.

G6 states: "The official docs state 'Claude Code is aware of shell operators
like `&&`'."

Context7 query against code.claude.com/docs/en/permissions returned this exact
text:

> "Claude Code is aware of shell operators like `&&`. A prefix match rule such
> as `Bash(safe-cmd *)` will not grant permission to execute a compound command
> like `safe-cmd && other-cmd`."

And additionally:

> "When a compound command is approved with a 'don't ask again' confirmation,
> Claude Code creates individual rules for each subcommand that requires
> approval. For example, approving `git status && npm test` results in a saved
> rule for `npm test`, allowing future `npm test` invocations regardless of
> preceding commands."

Both quotes match G6's citations verbatim. The permission engine IS
compound-aware as G6 claims. The remaining ambiguity (whether the `if` field
uses the same compound-aware engine or a simpler matcher) is correctly
identified by G6 as undocumented.

---

## Verification 6: G6 Claim -- block-push-to-main.js Has 3-Layer Defense

**VERIFIED** -- All three layers confirmed by reading the source code.

### Layer (a): Internal regex checks for git+push anywhere in string

Lines 34-36 of `block-push-to-main.js`:
```javascript
// Fast bail: only inspect commands that look like git push
if (!/\bgit\b/i.test(command) || !/\bpush\b/i.test(command)) {
  process.exit(0);
}
```

These use `\b` word boundary assertions and match `git` and `push` **anywhere
in the command string**, not just at the start. A compound command like
`git status && git push origin main` would pass both tests because `git` and
`push` appear as whole words in the string. **VERIFIED.**

### Layer (b): Accounts for shell operators

Lines 53-54 show the regex patterns:
```javascript
const directPattern = new RegExp(
  `\\bgit\\s+push\\b[^|;&]*(?:\\s|^)(?:refs/heads/)?${escaped}(?=\\s|$)`
);
```

The `[^|;&]*` character class explicitly **excludes** pipe (`|`), semicolon
(`;`), and ampersand (`&`) characters from the match scope. This means the
regex will match `git push` within its own command segment (between shell
operators), not across segments. For example, in `git status && git push origin
main`, the regex matches the `git push origin main` segment independently.
**VERIFIED.**

### Layer (c): The `if` condition AND permissions.deny both exist

From settings.json:

**`if` condition** (PreToolUse, line 74):
```json
"if": "Bash(git push *)"
```

**permissions.deny** (line 20):
```json
"Bash(git push origin main)"
```

Both exist. G6 correctly identifies that even if layer 1 (`if` condition) fails
to fire for a compound command, layer 3 (permissions.deny) uses the
compound-aware permission engine and would still catch `git push origin main`
within a compound command. **VERIFIED.**

**Important note from G6 that bears repeating:** If the `if` condition does NOT
fire (Scenario B -- prefix-only matching), then the hook script (layer 2) never
executes because the process is never spawned. The actual fallback is layer 3
(permissions.deny), not layer 2. G6 correctly identifies this in the
"Implications" section: "if layer 1 fails, layer 2 never runs (the script is
not spawned). So the actual fallback is layer 3 (permission deny rule)."

---

## Summary Table

| # | Claim | Verdict | Notes |
|---|-------|---------|-------|
| 1a | T1-1 Settings Guardian feasible (30-45 min) | **VERIFIED** | PostToolUse Write/Edit with `if` is valid |
| 1b | T1-2 Governance Logger feasible (20-30 min) | **VERIFIED** | Straightforward JSONL append pattern |
| 1c | T1-3 Loop Detector feasible (45-60 min, PostToolUseFailure) | **VERIFIED** | PostToolUseFailure is a real event that supports `if`; no production examples in this project yet |
| 2 | Lean fnm wrapper is critical enabler for Tier 3 | **PARTIALLY REFUTED** | Critical for T3-1 only (1 of 8 items); Tier 3 has diverse blockers (Windows paths, architecture, ROI) |
| 3 | Template syntax NOT supported in `if` fields | **VERIFIED** | Official docs, open GitHub issues, and interpolation inventory all confirm |
| 4 | PreCompact fires when context is full | **VERIFIED** | Official docs: "automatically when the context window is full"; already in production in this project |
| 5 | Permission engine is compound-aware (post-fix) | **VERIFIED** | Exact quote confirmed in official docs via context7 |
| 6 | block-push-to-main.js has 3-layer defense | **VERIFIED** | (a) `\b` regex matches anywhere, (b) `[^|;&]*` excludes shell operators, (c) both `if` and `permissions.deny` exist |

---

## Sources

| # | Source | Type |
|---|--------|------|
| 1 | `.claude/settings.json` (filesystem read) | Ground truth |
| 2 | `.claude/hooks/block-push-to-main.js` (filesystem read) | Ground truth |
| 3 | code.claude.com/docs/en/hooks (via context7) | Official docs |
| 4 | code.claude.com/docs/en/permissions (via context7) | Official docs |
| 5 | D1-spec.md (prior research finding) | Research artifact |
| 6 | G4-otb-triage.md (finding under test) | Finding under test |
| 7 | G5-template-syntax.md (finding under test) | Finding under test |
| 8 | G6-compound-bypass.md (finding under test) | Finding under test |
