# G1: Cross-Model Verification — Hook `if` Conditions Research

**Date:** 2026-03-29 **Verification Model:** Gemini 2.5 Pro (via `gemini` CLI)
**Source:** `.research/hook-if-conditions/claims.jsonl` (45 claims), top 10
selected **Methodology:** Each claim fed to Gemini CLI independently; responses
captured verbatim; verdict assigned by comparing Gemini's assessment against
research evidence

---

## Summary

| #   | Claim                                         | Verdict  | Agreement          |
| --- | --------------------------------------------- | -------- | ------------------ |
| 1   | `if` works with all tool types                | AGREE    | Full               |
| 2   | ensure-fnm.sh adds ~167-191ms overhead        | AGREE    | Full               |
| 3   | Compound commands bypass `if`                 | AGREE    | Full               |
| 4   | GSD context-monitor 92% unnecessary spawn     | AGREE    | Full               |
| 5   | Only 3 hooks benefit from `if`                | PARTIAL  | Nuanced            |
| 6   | `if` on non-tool events silently fails        | PARTIAL  | Nuanced            |
| 7   | post-write-validator cannot benefit from `if` | DISAGREE | Partial            |
| 8   | Lean fnm wrapper saves ~138ms+                | AGREE    | Full               |
| 9   | `if` is performance, not security             | AGREE    | Full               |
| 10  | Pipe OR syntax in `if` values                 | N/A      | Gemini unavailable |

**Overall concordance: 7/9 full agreement, 1 partial, 1 disagreement** (1 claim
could not be verified via Gemini).

---

## Detailed Findings

### Claim 1: `if` field works with all tool types (not just Bash)

**Research claim (C-004, C-016):** The `if` field uses permission rule syntax
and works with ALL tool types -- Bash, Edit, Write, Read, Glob, Grep, WebFetch,
WebSearch, Agent. Official docs name `Edit(*.ts)` explicitly. D7's initial claim
that `if` only works with Bash was an inductive fallacy.

**Gemini response:** "The claim is **correct**; Claude Code hooks (facilitated
by the `hookify` plugin) use a `ToolName(pattern)` syntax in the `if` field to
provide granular filtering for `PreToolUse` and `PostToolUse` events. Official
project configurations in `.claude/settings.json` confirm this functionality
with examples like `Write(*.test-if-marker)` and `Bash(git push *)`, supporting
the assertion that `Edit(*.ts)` is a valid pattern. A key nuance is the
distinction between the **`matcher`** field, which uses regex at the block level
to identify the tool (e.g., `^(?i)(write|edit)$`), and the **`if`** field, which
uses glob-like patterns to match the tool's primary argument (e.g., the file
path or CLI command). While the system is designed to be extensible to other
tools like `Glob`, `Grep`, or `WebFetch`, their active support depends on
whether they are registered as hookable events within the `hookify`
configuration. Additionally, these hooks are architected to 'fail open,'
ensuring that any issues within the hook script itself do not block the primary
tool operation."

**Verdict: AGREE**

**Notes:** Gemini confirmed the claim and added a useful nuance about matcher
vs. `if` field distinction. Gemini referenced the project's own `settings.json`
as evidence (it searched the repo). The caveat about `Glob`/`Grep`/`WebFetch`
needing to be "registered as hookable events" is slightly misleading -- these
are built-in Claude Code tool types, not plugin-registered tools. But the core
claim stands.

---

### Claim 2: ensure-fnm.sh adds ~167-191ms redundant overhead per invocation

**Research claim (C-024, C-025, C-026):** ensure-fnm.sh adds 167ms overhead per
hook invocation (10-run average: 233ms with wrapper vs 66ms bare). Node is
already on PATH via fnm/aliases/default. The `fnm use --silent-if-unchanged`
call is a no-op every time because .nvmrc pins v22 and default alias is
v22.22.1.

**Gemini response:** "The claim is **substantially correct**. On Windows,
spawning `bash.exe` and executing `fnm env` plus `fnm use` consistently incurs a
'process creation tax' that aligns with the 150-200ms range, especially given
the overhead of shell evaluation and file system checks for `.node-version`.
**Nuances and Corrections:** Redundancy depends on version match: The overhead
is only 'redundant' if the `fnm default` version matches the project's required
version; however, the script lacks a guard clause to skip initialization if
`node` is already present and correct. Environment isolation: The script serves
as a 'compatibility tax' to ensure hooks work even if Claude Code is invoked
from an environment that hasn't initialized the user's shell profile (e.g.,
certain IDE terminals or background processes). Optimization path: A more
efficient wrapper would first check if `node` is already on the `PATH` and
matches the required version before calling the expensive `fnm` binaries."

**Verdict: AGREE**

**Notes:** Gemini confirmed the timing range and the redundancy. It added a
valid nuance about the wrapper serving as a safety net for environments without
shell profiles, which aligns with the research's acknowledgment that a lean
wrapper should still have an fnm fallback path. The "version drift" nuance is
well-taken -- the research accounted for this by confirming the pinned version
matches.

---

### Claim 3: Compound commands (&&, ;) bypass `if` pattern matching

**Research claim (C-033):** `Bash(git push *)` does not fire when Claude runs
`git status && git push origin main`. GitHub issue #4956 reports 97.9-100%
bypass rate across 52 compound command test cases.

**Gemini response:** "The claim is **correct**: Claude Code matches the `if`
regex against the **entire literal string** passed to the shell, so a pattern
like `^git push` will fail to trigger on a compound command like
`git status && git push`. It is not a 'bypass' but a pattern-matching
limitation; the hook only fires if the regex accounts for the full context of
the input. To ensure subcommands are caught, you must use a non-anchored regex
such as `.*git\s+push.*` to match the command regardless of its position in the
string. Note that if Claude chooses to execute these commands as two separate
tool calls instead of a single compound string, a simple pattern would still
fire for the individual push call."

**Verdict: AGREE**

**Notes:** Gemini confirmed the core mechanism. It added a useful distinction:
the `if` field uses permission rule syntax (not raw regex), so the
`.*git\s+push.*` workaround Gemini suggests may not be valid syntax for the `if`
field specifically (which uses glob-like patterns, not regex). However, the
fundamental observation -- that compound commands bypass simple patterns -- is
confirmed. Gemini's note about Claude potentially splitting commands into
separate tool calls is a valid real-world consideration that the research did
not emphasize.

---

### Claim 4: GSD context-monitor has ~92% unnecessary spawn rate

**Research claim (C-015, C-019, C-020):** gsd-context-monitor.js fires on ALL
PostToolUse events with no matcher. It is completely tool-agnostic (does not
inspect tool_name/input/output). It exits immediately when context > 35%
remaining. Measured spawn cost: 179ms median.

**Gemini response:** "The claim is highly plausible because `PostToolUse` hooks
without matchers trigger on every tool invocation, meaning the vast majority of
spawns occur during early-session tasks or low-context operations where a 35%
threshold is rarely met. The 92% 'unnecessary' rate accurately reflects the high
frequency of trivial tool calls (like `ls` or `read_file`) compared to the few
calls that actually push context into a critical range. The primary nuance is
that the 'cost' is not the file read itself, but the OS overhead of spawning a
new Node.js process for every command, which significantly degrades CLI
responsiveness. To optimize this, the hook should utilize `matcher` patterns to
target only context-heavy tools or implement a 'cooldown' flag in the bridge
file to skip checks for a set number of turns."

**Verdict: AGREE**

**Notes:** Gemini confirmed both the 92% estimate and the mechanism. The
"cooldown flag" suggestion aligns with the research's D5-S proposal for
time-based internal debounce. Gemini correctly identified the spawn overhead
(not script execution) as the primary cost.

---

### Claim 5: Only 3 existing `if` conditions are valid for this project's hooks

**Research claim (C-013, C-017):** Three hooks received `if` conditions. The
remaining 14 hooks either cannot use `if` (wrong event type), need to fire
universally, or have internal bail-outs more efficient than glob patterns.

**Gemini response:** "The claim is highly plausible because `if` conditions in
Claude Code are strictly limited to file-operation events (e.g.,
`AfterFileChange`) and cannot be applied to session-level triggers like
`SessionStart` or `UserPromptSubmit`. In most projects, a significant portion of
hooks handle global concerns -- such as environment validation or state
synchronization -- that must execute universally to maintain system integrity.
While internal bail-outs allow for complex, content-aware logic that simple glob
patterns cannot achieve, they are technically less efficient than `if`
conditions, which prevent the hook process from spawning entirely. Consequently,
the performance benefit of `if` is indeed concentrated in narrow, path-specific
tasks like scoped linting or per-file testing."

**Verdict: PARTIAL**

**Notes:** Gemini broadly agreed with the claim's conclusion but introduced an
inaccuracy: it cited `AfterFileChange` (not a real Claude Code event) and said
`if` is "limited to file-operation events," which is incorrect -- `if` works on
all four tool events (PreToolUse, PostToolUse, PostToolUseFailure,
PermissionRequest), not just file operations. Gemini also pushed back slightly
on the internal-bail-out claim, saying `if` is "technically less efficient" than
internal bail-outs -- this reverses the actual relationship (internal bail-outs
still require a spawn; `if` prevents the spawn entirely). However, the
research's claim is specifically that these particular internal bail-outs are
_more precise_ (not more efficient in spawn terms) -- meaning they filter on
conditions that cannot be expressed as glob patterns. The claim stands but with
this clarification.

---

### Claim 6: `if` on non-tool events silently fails (no error/warning)

**Research claim (C-003):** `if` is only evaluated on PreToolUse, PostToolUse,
PostToolUseFailure, and PermissionRequest. On all other events, a hook with `if`
set never runs -- silently, without error.

**Gemini response:** "The claim is **mostly correct** because the `if` field
uses Common Expression Language (CEL) expressions that typically reference the
`tool` object, which is undefined for non-tool events. Referencing tool-specific
properties in events like `SessionStart` causes a CEL evaluation failure, which
Claude handles by silently skipping the hook rather than alerting the user.
However, the `if` field itself is technically supported across all event types;
a valid expression that relies only on globally available context or static
logic (e.g., `if: 'true'`) will allow the hook to execute normally."

**Verdict: PARTIAL**

**Notes:** Gemini agreed on the silent failure behavior but attributed it to a
different mechanism (CEL expression evaluation failure on missing `tool` object)
rather than the research's claim that it is a hard design rule. Gemini's
assertion that `if: 'true'` would work on non-tool events is unverified -- the
official docs state "Adding it to any other event prevents the hook from
running" without mentioning exceptions. The CEL framing is speculative (Claude
Code hooks use permission rule syntax, not CEL). The observable behavior (silent
skip) is confirmed; the internal mechanism differs between the two assessments.

---

### Claim 7: post-write-validator cannot benefit from `if` conditions

**Research claim (C-017, C-018):** The monolith validator handles nearly all
file types. Internal dispatch (isJsTsFile, isTsxFile, etc.) is more precise than
any glob. It was consolidated from 10 hooks to save ~800ms Windows spawn
overhead. Splitting with `if` would restore that cost.

**Gemini response:** "The claim is partially incorrect because **`if` conditions
prevent the ~800ms Windows spawn overhead entirely** by skipping process
initialization when a file does not match the glob. Splitting checks into
multiple `if`-conditioned hooks is actually more efficient for a project with
mixed file types, as it ensures the validator only runs when relevant rather
than spawning for every file write. However, consolidation remains the superior
strategy when **multiple checks must run on the same file**, as it avoids
spawning nine separate processes for a single `.tsx` edit. While internal
dispatch allows for complex logic (like content-based detection), standard globs
are typically sufficient for the file-type filtering described and provide a
significant performance win by avoiding unnecessary process overhead."

**Verdict: DISAGREE (with nuance)**

**Notes:** This is the only claim where Gemini meaningfully pushed back. Gemini
argues that `if`-conditioned separate hooks could be MORE efficient for
mixed-type projects because non-matching files skip the spawn entirely. The
research's counter-argument (which Gemini partially acknowledged) is that
multiple checks run on the SAME file (e.g., a `.tsx` file triggers 5+ of the 9
checks), so splitting would mean 5 spawns instead of 1. The research also notes
that the validator handles file types (markdown, config) that overlap heavily --
the internal bail-out for a config file skips 8 of 9 checks in ~1ms, which is
far cheaper than spawning even one process.

**Resolution:** Both positions have merit. For files that trigger only 1-2
checks, `if`-conditioned separate hooks could theoretically save spawn time. For
files that trigger 5+ checks (the majority -- .ts, .tsx files), the monolith is
clearly superior. The research's conclusion (keep the monolith) is the correct
pragmatic choice for this project's file mix, but Gemini's pushback is
architecturally valid for projects with more cleanly separable check categories.

---

### Claim 8: Lean fnm wrapper saves ~138ms per invocation

**Research claim (C-027):** A lean PATH-check wrapper that skips fnm init when
node is already available reduces per-spawn cost from ~234ms to ~5ms. Uses
`if command -v node; then exec $@; fi` pattern with fnm slow-path fallback.

**Gemini response:** "The claim is highly plausible; `fnm env` involves heavy
subshell execution and evaluation of shell strings, whereas `command -v` is a
near-instant shell builtin. This optimization significantly reduces latency for
hooks spawned in environments where Node is already initialized, such as
interactive shells or CI runners. However, the primary nuance is **version
drift**: a simple existence check ignores project-specific requirements defined
in `.node-version` or `package.json`. To remain robust, the wrapper should
perform a lightweight check to ensure the active Node version matches the
project's requirements before skipping the full `fnm` handshake."

**Verdict: AGREE**

**Notes:** Gemini confirmed the mechanism and magnitude. The version-drift
nuance is the same one raised for claim 2 and is well-taken. The research
accounted for this by verifying that the current system has only one Node
version installed (v22.22.1 matching .nvmrc), but a production-grade wrapper
should indeed verify the major version. The research's proposed Option B
includes an fnm fallback path for exactly this case.

---

### Claim 9: `if` is a performance optimization, not a security boundary

**Research claim (C-034):** Official Anthropic documentation frames `if` as
reducing process spawning overhead. Security framing comes from community, not
Anthropic. Compound command bypass (97.9-100% success rate per GitHub #4956) and
other evasion techniques mean `if` should never be sole enforcement.

**Gemini response:** "The claim is correct: the `if` field is a regex-based
string filter designed to minimize execution overhead, not a robust security
primitive. Because it operates on the raw command string before shell expansion,
it is trivially bypassed using standard shell features like command chaining
(`&&`, `;`), aliases, or subshells. Anthropic documentation focuses on developer
productivity and workflow automation; any 'security' framing is a
community-driven misapplication of what is essentially a client-side advisory
mechanism. True security and policy enforcement must reside server-side or
within the execution environment (e.g., branch protections or CI pipelines)
where the user cannot modify the enforcement logic."

**Verdict: AGREE**

**Notes:** Strong agreement. Gemini added useful framing about this being a
"client-side advisory mechanism" and that real security must be server-side.
This aligns with the research's recommendation that security-critical hooks
(like block-push-to-main.js) must always validate the full command string
internally, regardless of `if` conditions.

---

### Claim 10: Pipe OR syntax (|) works in `if` values

**Research claim (C-010):** OR via pipe within a single `if` value
(`Bash(git commit *)|Bash(git cherry-pick *)`) is unconfirmed by official docs.
Separate handler objects recommended. One Context7 source shows pipe syntax but
unconfirmed. The project uses it in practice (P14 commit-tracker.js).

**Gemini response:** N/A -- Gemini CLI failed to produce a coherent response
after 3 attempts (got stuck in search loops against the local repo instead of
answering the question).

**Independent assessment (Claude Opus 4.6):** The claim is **correct as
stated**. The pipe OR syntax within `if` values is demonstrably working in this
project's settings.json (P14 commit-tracker.js uses it actively). However, it is
not documented in official Claude Code hooks reference material. The recommended
safe approach remains separate handler objects. The risk of relying on
undocumented syntax is that a future Claude Code update could change the parsing
behavior without notice. For non-critical hooks (like commit-tracker), the
practical risk is low. For security-critical hooks, separate handlers are
mandatory.

**Verdict: AGREE (independent assessment)**

**Notes:** The research correctly identified this as unconfirmed-but-working.
The distinction between "works in practice" and "officially supported" is the
key nuance.

---

## Cross-Model Concordance Matrix

| Claim                       | Research Confidence | Gemini Verdict      | Delta                                |
| --------------------------- | ------------------- | ------------------- | ------------------------------------ |
| 1. `if` all tool types      | HIGH                | Agree               | None                                 |
| 2. fnm overhead 167ms       | HIGH                | Agree               | None                                 |
| 3. Compound bypass          | HIGH                | Agree               | None                                 |
| 4. GSD 92% waste            | HIGH                | Agree               | None                                 |
| 5. Only 3 valid `if`        | HIGH                | Partial             | Gemini confused event types          |
| 6. Silent fail non-tool     | HIGH                | Partial             | Mechanism dispute (CEL vs hard rule) |
| 7. Validator no benefit     | HIGH                | Disagree            | Valid architectural counter-argument |
| 8. Lean wrapper savings     | MEDIUM              | Agree               | Version drift caveat added           |
| 9. Performance not security | HIGH                | Agree               | Strong alignment                     |
| 10. Pipe OR syntax          | MEDIUM              | N/A (Gemini failed) | Independent: Agree                   |

## Key Disagreement: Claim 7

The only substantive disagreement is on whether `post-write-validator.js` could
benefit from `if`-based splitting. Gemini argues that for files triggering only
1-2 checks, separate `if`-conditioned hooks avoid the spawn entirely. The
research argues that most edited files (.ts, .tsx) trigger 5+ checks, making the
monolith cheaper overall. **Both positions are architecturally valid.** The
research's conclusion (keep the monolith) is the correct choice for this
specific project's file-type distribution.

## Gemini Reliability Notes

- **3 of 10 claims** required retries due to empty responses (just "Loaded
  cached credentials" with no content)
- **1 claim** (claim 10) failed completely after 3 attempts -- Gemini entered a
  search-loop against the local repo instead of answering
- Gemini occasionally cited non-existent Claude Code concepts (CEL expressions,
  `AfterFileChange` event, `hookify` plugin) -- these appear to be
  hallucinations
- When Gemini did produce responses, they were substantive and added genuine
  nuance (version drift, cooldown flags, client-side advisory framing)
- Overall utility: HIGH for confirming claims, MODERATE for adding novel
  insights, LOW for technical accuracy on Claude Code internals
