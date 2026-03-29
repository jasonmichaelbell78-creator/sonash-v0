# Findings: `if` Field Tool Compatibility — Contradiction Resolution

**Searcher:** deep-research-searcher (contradiction resolver)
**Profile:** web + docs
**Date:** 2026-03-29
**Sub-Question IDs:** D1 vs D7 contradiction — `if` field tool type scope

---

## Summary

This document resolves a direct contradiction between two prior findings:

- **D1-spec.md** claims `if` works with ANY tool type (Bash, Edit, Write, Read, etc.) using permission rule syntax
- **D7-performance.md** claims `if` "only applies to PreToolUse/PostToolUse hooks with a Bash matcher" and "cannot filter on file paths or non-Bash tool arguments"

**Verdict: D1-spec.md is correct. D7-performance.md is wrong.** The error in D7 was an inductive fallacy — observing that all existing `if` conditions in this repo happen to use `Bash(...)` patterns, then inferring that Bash-only is the feature's scope.

---

## Key Findings

### 1. Official Docs Confirm `if` Works with Edit, Write, Read, and All Tool Types [CONFIDENCE: HIGH]

The official Claude Code hooks guide (code.claude.com/docs/en/hooks-guide) explicitly states, under the `if` field section:

> "The `if` field accepts the same patterns as permission rules: `"Bash(git *)"`, `"Edit(*.ts)"`, and so on."

This is a direct, unambiguous statement that `Edit(*.ts)` is a valid `if` pattern. The statement pairs `Edit(*.ts)` with `Bash(git *)` as equally valid examples.

The same page provides a full worked example:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git *)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-git-policy.sh"
          }
        ]
      }
    ]
  }
}
```

While the worked example uses Bash (because that is the most common teaching example), the adjacent text explicitly names Edit as equally supported.

Sources: [1], [2]

---

### 2. Permission Rule Syntax Is the Foundation — It Applies to All Tool Types [CONFIDENCE: HIGH]

The `if` field uses "permission rule syntax," which is the same system that governs `permissions.allow` and `permissions.deny`. The permissions documentation (code.claude.com/docs/en/permissions) shows that this syntax supports all tool types with the same `Tool(specifier)` format:

| Rule | Effect |
|---|---|
| `Bash(npm run build)` | Exact Bash command |
| `Read(./.env)` | Read a specific file |
| `Edit(/src/**/*.ts)` | Edit TypeScript files under src/ |
| `Write(src/**)` | Write to any file under src/ |
| `WebFetch(domain:example.com)` | Fetch requests to a domain |
| `Agent(Explore)` | Explore subagent calls |

Since `if` uses this same syntax, it inherits support for all of these tool types. There is no mechanism by which `if` could support only a subset of what permission rules support — they use the same matching engine.

D1-spec.md's Finding 4 (Tool Argument Shapes per Tool Type) correctly documents the matched field for each tool:
- Bash: `command` field
- Edit: `file_path` field
- Write: `file_path` field
- Read: `file_path` field
- Glob: `pattern` field
- Grep: `pattern` field
- WebFetch: `url` field
- WebSearch: `query` field

Sources: [1], [3]

---

### 3. D7-performance.md's Error: Inductive Fallacy from Repo Observation [CONFIDENCE: HIGH]

D7's incorrect claim originated from observing the actual `settings.json` in this repository. The file was inspected and confirmed to contain the following `if` conditions:

```json
"if": "Bash(git push *)"           // block-push-to-main.js
"if": "Bash(git commit *)"         // pre-commit-agent-compliance.js
"if": "Bash(git commit *)|Bash(git cherry-pick *)|Bash(git merge *)|Bash(git revert *)"  // commit-tracker.js
```

All three existing `if` conditions in the repo use `Bash(...)` patterns. D7 observed this empirically, then committed a classic inductive fallacy: "all current examples use Bash, therefore only Bash is supported."

D7's Finding 7 stated explicitly:

> "The `if` condition feature in Claude Code settings.json only applies to PreToolUse and PostToolUse hooks with a Bash matcher, using the pattern Bash(command pattern). It cannot filter on file paths, content, or non-Bash tool arguments."

This statement has no citation from official documentation. It is presented as a factual conclusion derived from repo observation. D7 even acknowledged uncertainty in its own Gaps section:

> "The assumption that `if` conditions can ONLY filter Bash(pattern) for PreToolUse/PostToolUse is based on the existing hook config patterns observed in this repo and D1-spec findings."

This self-acknowledged gap was not enough to prevent D7 from asserting the Bash-only claim as fact in its summary table, where it appears without hedging.

Sources: [4] (settings.json direct inspection), D7-performance.md

---

### 4. The Practical Impact: Edit/Write/Read Hooks CAN Use `if` Conditions [CONFIDENCE: HIGH]

D7's summary table lists the PostToolUse Read, Write, and Edit hooks as having "NOT POSSIBLE" potential `if` savings. This conclusion is wrong on its premise. The correct assessment is:

**CAN use `if` for non-Bash tools — but may not need to for this specific repo**

The distinction matters:

- **D7's claim**: `if` conditions cannot filter by file path on Edit/Write/Read tools — technically wrong
- **Accurate claim**: The current Edit/Write/Read hooks in this repo run on ALL invocations and lack `if` conditions. This is a valid optimization opportunity that was incorrectly ruled out.

For example, `post-read-handler.js` fires on every Read call. If the hook's logic only applies to certain file types (e.g., `.md` files, or files under `.claude/`), an `if` condition like `"Read(/path/to/specific/**)"` or `"Read(*.md)"` could eliminate unnecessary spawns.

Whether this optimization is *worthwhile* for this specific repo's hooks requires analyzing what `post-read-handler.js` actually does — but it is not architecturally impossible as D7 claimed.

Sources: [1], [3], [4]

---

### 5. The One Limitation D7 Got Right: Non-Tool Events [CONFIDENCE: HIGH]

D7 is correct on one limitation, and it aligns with D1-spec.md's Finding 6:

`if` only works on the four tool events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, and `PermissionRequest`. On all other events (`UserPromptSubmit`, `SessionStart`, `Notification`, etc.), a hook with an `if` field never runs.

The official docs state:
> "`if` only works on tool events: PreToolUse, PostToolUse, PostToolUseFailure, and PermissionRequest. Adding it to any other event prevents the hook from running."

This means D7's statement that `user-prompt-handler.js` cannot benefit from `if` conditions is correct — but for the right reason (wrong event type, not wrong tool type). The `UserPromptSubmit` event is not a tool event, so `if` is unsupported regardless.

Sources: [1], [3]

---

## Which Agent Was Wrong and Why

**D7-performance.md is wrong** on the scope of the `if` field.

**Root cause of the error:** D7 was a codebase-profile agent focused on performance measurement. Its primary task was measuring spawn costs and assessing optimization opportunities. When it reached the `if` field analysis, it:

1. Inspected `settings.json` (correct approach for codebase research)
2. Observed all three existing `if` conditions use `Bash(...)` patterns (correct observation)
3. Concluded that Bash-only is the feature's scope (invalid inference — absence of non-Bash examples is not evidence of impossibility)
4. Stated this as fact in a summary table without citing any official documentation (epistemic failure)
5. Self-acknowledged the assumption in Gaps but did not retract the summary table claim (presentation inconsistency)

D7 should have either: (a) consulted official documentation before asserting a capability boundary, or (b) labeled the Bash-only claim as UNVERIFIED or LOW confidence given it was based solely on repo observation.

**D1-spec.md is correct.** It cited official documentation (code.claude.com/docs/en/hooks-guide and code.claude.com/docs/en/permissions) and explicitly enumerated the argument shapes for Edit, Write, Read, and other tools. Its HIGH confidence rating on this finding is warranted.

---

## Implications for the Research

### For hook optimization analysis
The optimization assessment in D7 needs revision. The conclusion that "PostToolUse Read/Write/Edit hooks cannot benefit from `if` conditions" is technically incorrect. Whether they *should* use `if` conditions depends on the hooks' internal logic — not on an architectural limitation.

### For the current repo's settings.json
The three existing `if` conditions (`Bash(git push *)`, `Bash(git commit *)`, etc.) are correctly configured. The absence of `if` conditions on Edit/Write/Read hooks is a design choice, not a constraint. If `post-read-handler.js`, `post-write-validator.js` perform filtering that could be done at the `if` level instead, `if` conditions could eliminate unnecessary spawns.

### For D3-optimization.md
If D3-optimization.md referenced D7's Bash-only claim when assessing optimization opportunities for Edit/Write/Read hooks, those assessments need re-evaluation.

### For future hook authoring
When creating PostToolUse hooks for Edit, Write, or Read events, `if` conditions like `"Edit(*.ts)"` or `"Write(src/**)"` are valid and reduce spawn overhead. The pattern `"matcher": "Edit"` + `"if": "Edit(*.ts)"` is a valid two-level filter that narrows to TypeScript edits only.

---

## Sources

| # | URL | Title | Type | Trust | CRAAP | Date |
|---|-----|-------|------|-------|-------|------|
| 1 | https://code.claude.com/docs/en/hooks-guide | Automate workflows with hooks — Official Claude Code Docs | Official docs | HIGH | 5.0 | March 2026 |
| 2 | https://code.claude.com/docs/en/hooks | Hooks reference — Official Claude Code Docs | Official docs | HIGH | 5.0 | March 2026 |
| 3 | https://code.claude.com/docs/en/permissions | Configure permissions — Official Claude Code Docs | Official docs | HIGH | 5.0 | March 2026 |
| 4 | `.claude/settings.json` (this repo) | Actual hook configuration | Filesystem ground truth | HIGH | 5.0 | 2026-03-29 |
| 5 | D1-spec.md (this research) | D1 spec findings | Prior research | MEDIUM | 4.0 | 2026-03-29 |
| 6 | D7-performance.md (this research) | D7 performance findings | Prior research | MEDIUM | 4.0 | 2026-03-29 |

---

## Contradictions

**None within this resolution document.** All three official sources (hooks-guide, hooks reference, permissions reference) agree that `if` uses permission rule syntax and that permission rule syntax supports Edit, Write, Read, and all other tool types. The contradiction being resolved (D1 vs D7) is settled in D1's favor.

---

## Gaps

1. **No official documentation showing `if: "Edit(*.ts)"` as a complete worked example.** The official docs state it is valid and list it as an example pattern, but the only full JSON example in the hooks-guide shows `Bash(git *)`. A direct working example with Edit/Write would provide additional confirmation, but the prose statement is clear.

2. **Whether `if` with a mismatched matcher is a silent no-op or an error.** D1-spec.md notes that `matcher: "Bash"` + `if: "Edit(*.ts)"` creates a logical contradiction (the Edit tool would already be filtered out by the matcher). Whether Claude Code raises a warning, silently never fires, or produces an error is not documented.

3. **`MultiEdit` `if` behavior.** Whether `if: "MultiEdit(*.ts)"` matches when ANY file in the multi-edit batch matches `*.ts`, or only when ALL do, is not specified.

---

## Serendipity

D7's measurement data on spawn costs (~234ms per invocation via ensure-fnm.sh) remains valid and is not affected by this contradiction resolution. The performance baseline findings in D7 are grounded in direct measurement, not the Bash-only inference error.

The logical error in D7 is localized to one summary table and its surrounding analysis. The rest of D7's findings (measured spawn times, hook frequency counts, pre-commit/pre-push durations) are independently grounded in filesystem measurements and are unaffected.

---

## Confidence Assessment

- HIGH claims: 5
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

The official hooks-guide explicitly names `Edit(*.ts)` as a valid `if` pattern in the same sentence as `Bash(git *)`. The permissions reference confirms that the underlying rule syntax supports Edit, Write, Read, and all other tool types. The contradiction is resolved definitively in D1's favor.
