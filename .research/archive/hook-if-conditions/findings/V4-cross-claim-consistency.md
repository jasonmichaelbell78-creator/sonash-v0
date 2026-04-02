# Verification: Cross-Claim Consistency Across All Findings

**Verifier:** V4 (cross-claim consistency) **Date:** 2026-03-29 **Scope:** All
12 findings files (D1, D2, D3, D3-S, D4, D5, D5-S, D6, D7, D7-S, D8, D9) +
RESEARCH_OUTPUT.md **Status:** 5 inconsistencies found, 3 material

---

## Inconsistency 1: D3 vs D3-S -- Did D3 Dismiss Write/Edit Hooks BECAUSE of the Bash-Only Assumption?

### The Conflict

**D3-optimization.md** ruled out `if` conditions for all remaining hooks,
concluding "No other hooks in this project have the same 'subset of Bash
commands' pattern that makes `if` effective." D3's summary table shows every
non-Bash hook as SKIP with 0% viable savings.

**D3-S-tool-compatibility.md** proved that `if` works with Write, Edit, Read,
and all tool types. D3-S explicitly states: "If D3-optimization.md referenced
D7's Bash-only claim when assessing optimization opportunities for
Edit/Write/Read hooks, those assessments need re-evaluation."

### Analysis: Did D3 Rely on the Bash-Only Assumption?

**No -- D3 reached the correct conclusions for independent reasons, but its
framing is contaminated by the Bash-only assumption.**

Reading D3 carefully:

1. **post-write-validator.js (P9/P10/P11):** D3 ruled this out because the hook
   spans nearly all file types (`.ts`, `.tsx`, `.js`, `.md`, `.yaml`, `.jsonl`)
   and internal bail-outs are already more precise than glob patterns. The
   ruling sentence: "the `if` string matcher cannot express 'extension is .tsx
   AND path starts with app/ OR components/'" -- this is an INDEPENDENT reason
   about glob expressiveness, not about tool type restriction. D3 even describes
   what an `if` condition _would_ look like
   (`Write(*.ts)|Write(*.tsx)|Write(*.js)`) and dismisses it as still covering
   ~95% of writes. **This SKIP is correct regardless of the Bash-only
   question.**

2. **post-read-handler.js (P12):** D3 ruled this out because the hook's purpose
   is to track ALL reads (universal scope is intentional). The argument is
   functional, not architectural: "filtering would create coverage gaps." **This
   SKIP is correct regardless.**

3. **decision-save-prompt.js (P13):** D3 ruled this out because significance
   detection requires JSON parsing, not glob matching. **Correct regardless.**

4. **track-agent-invocation.js (P15):** D3 ruled this out because all agent
   invocations should be tracked. **Correct regardless.**

However, D3's concluding section contains the contaminated framing:

> "No other hooks in this project have the same 'subset of Bash commands'
> pattern that makes `if` effective."

This sentence implies D3 believed `if` only works with Bash commands. The
correct conclusion would have been: "No other hooks in this project have a
viable narrowing pattern, regardless of tool type." The reasoning that led to
each individual SKIP was sound, but the generalization at the end echoed D7's
error.

### Verdict

**D3's per-hook conclusions are correct. Its summary framing is wrong.** The
sentence quoted above should read: "No other hooks in this project have a
tool-call subset that can be expressed as a glob pattern with meaningful
narrowing." The correction is cosmetic -- it does not change any recommendation.

**Does the conclusion change now that we know Write/Edit `if` works?** No. D3
analyzed each Write/Edit/Read hook on its own merits and found independent
reasons for each SKIP. The functional analysis holds. The missed opportunity is
not in D3's scope but in the research's SCOPE -- see Inconsistency 5 below.

---

## Inconsistency 2: D6 Does Not Consider `if` for EXISTING Hooks' Spawn Reduction

### The Conflict

**D6-new-validation-config.md** recommends adding validators INSIDE the monolith
(`post-write-validator.js`) rather than creating new `if`-based hooks. This is
correct for new validators. But D6 also states:

> "The `if` approach is appropriate for hooks that do NEW, independent things --
> not for splitting something that was deliberately unified."

D6 correctly identifies that splitting the monolith would restore the ~800ms
spawn cost. But D6 **never considers the inverse question**: could the existing
monolith ITSELF use an `if` condition on its handlers to skip spawning on files
that no validator cares about?

### What D6 Missed

`post-write-validator.js` fires on ALL Write/Edit/MultiEdit calls. D3 found that
~20% of fires are on markdown/config/non-code files where most validators are
no-ops. D3 dismissed `if` because the hook covers "nearly all file types."

But D3-S proved `if` works with Write/Edit. Could the three handler entries for
the monolith (P9, P10, P11) each add an `if` condition like:

```
P9:  "if": "Write(*.ts)|Write(*.tsx)|Write(*.js)|Write(*.jsx)|Write(*.sh)|Write(*.yml)|Write(*.yaml)|Write(docs/audits/*.jsonl)"
P10: "if": "Edit(*.ts)|Edit(*.tsx)|Edit(*.js)|Edit(*.jsx)|Edit(*.sh)|Edit(*.yml)|Edit(*.yaml)|Edit(docs/audits/*.jsonl)"
P11: "if": "MultiEdit(*.ts)|MultiEdit(*.tsx)|MultiEdit(*.js)|MultiEdit(*.jsx)"
```

### Evaluation: Would This Be Worthwhile?

**No, and D3 was essentially right to skip this, but for a subtly wrong stated
reason.**

The practical problem is threefold:

1. **Windows path separator risk (D9, D8).** `Edit(*.ts)` patterns are
   documented as failing on Windows when Claude generates backslash paths.
   GitHub issue #30736 confirms this. The post-write-validator is the MOST
   IMPORTANT hook in the project -- adding `if` conditions that might silently
   prevent it from firing on Windows would be a net negative.

2. **Coverage is nearly universal.** The validators collectively cover `.ts`,
   `.tsx`, `.js`, `.jsx`, `.sh`, `.yml`, `.yaml`, `.md` (the dead
   `isMarkdownFile`), `.json` (the dead `isConfigFile`), and
   `docs/audits/*.jsonl`. The only genuinely excluded files are non-code assets
   (images, lockfiles, binaries). The `if` pattern would be very long and still
   cover ~95% of writes.

3. **The monolith's internal dispatch is already faster than `if` evaluation.**
   The monolith computes boolean flags (`isJsTsFile`, `isTsxFile`, etc.) in the
   first 10 lines, and each validator does a single boolean check to bail out.
   This runs in <1ms. The `if` field evaluation would need to do a glob match
   against the file path anyway, plus the pattern is much longer (8+
   alternatives). There is no evidence `if` evaluation is faster than JavaScript
   boolean dispatch for this complexity level.

**However, there IS one creative non-Bash `if` use D6 should have considered:**

If new validators are added for markdown and config files (filling the
`isMarkdownFile` and `isConfigFile` dead code), then the hook truly covers ALL
files and the question becomes moot. But if those validators are NOT added, then
writes to `.md` and `.json` files spawn a ~234ms process that does zero useful
work (every validator bails on file type). An `if` condition excluding those
specific extensions would save that spawn cost.

This is a narrow optimization that only matters if the dead code is never
activated. Since D6 recommends activating that dead code (D6-A JSON, D6-C
markdown), the optimization gap would be closed by following D6's own
recommendations.

### Verdict

**D6 is correct that the monolith pattern is the right approach for new
validators.** D6 did not explicitly consider `if` on the existing monolith
handlers, but this omission is not material because: (a) Windows path separator
risk makes it dangerous, (b) coverage is nearly universal, (c) D6's own
recommendations to activate `isMarkdownFile` and `isConfigFile` would close the
only remaining spawn-waste gap. **No correction needed.**

---

## Inconsistency 3: D4 vs D5-S -- GSD Monitor Scoping Approaches

### The Conflict

**D4-gsd.md** recommends:

1. Primary: `if` condition on context percentage using template syntax
   `"if": "{{ context_window.remaining_percentage }} < 40"`
2. Secondary: broad tool matcher as fallback

**D5-S-gsd-scoping.md** recommends:

1. Primary: broad tool matcher (Option A) --
   `^(Write|Edit|MultiEdit|Bash|Task|Agent|WebSearch|WebFetch)$`
2. Complementary: time-based internal debounce (Option C)
3. Unverified but potentially superior: D4's template syntax (if it works)

### Are These Compatible or Contradictory?

**Compatible, with D5-S correcting D4's confidence level.** D4 presented the
template syntax as its "Primary recommendation (highest impact, lowest risk)"
with the caveat "Requires verification that Claude Code supports `if`
expressions with `context_window` fields." D5-S investigated this and determined
the syntax is UNVERIFIED -- the `if` field uses `Tool(argument_pattern)` format,
not template expressions.

D5-S correctly reframes the priority:

- D4's template syntax = UNVERIFIED, test it first
- Option A (broad matcher) = CONFIRMED to work, implement immediately
- Option C (time debounce) = complementary, compounds with Option A

The approaches are not contradictory -- they are a maturation from "D4's best
guess" to "D5-S's verified ranking." D5-S does not reject D4's template idea; it
downgrades it from "recommended" to "test first."

### One Missing Integration

Neither D4 nor D5-S explicitly considers using `if` with non-Bash patterns for
the GSD monitor. Since D3-S proved `if` works with all tool types, could the GSD
hook use something like `if: "Write(*)|Edit(*)|Bash(*)"` instead of a
matcher-based approach?

The answer is no -- but for a reason neither agent states. The GSD context
monitor has NO matcher currently, meaning it fires on all PostToolUse events.
Adding a matcher narrows which tool types trigger it. Adding an `if` condition
narrows which specific arguments (file paths, command strings) trigger it. For a
tool-agnostic hook that only cares about "how often" (not "what tool"), `if`
conditions on arguments add no value -- the hook does not care WHAT file was
edited or WHAT command was run. A matcher is the correct layer for this scoping.

### Verdict

**Compatible, not contradictory. D5-S is the authoritative recommendation.**
D4's template syntax should be tested but not relied upon. The matcher approach
is the correct mechanism for a tool-agnostic hook. No correction needed beyond
what D5-S already provides.

---

## Inconsistency 4: D9 Compound Command Bypass vs D1 Permission Rule Security

### The Conflict

**D9-risks.md** (Finding 2) documents compound command bypass:
`Bash(git push *)` does NOT fire when the actual command is
`git status && git push origin main`. D9 cites GitHub issue #4956 (97.9-100%
bypass rate) and states the bypass applies because `if` uses the same permission
rule syntax.

**D1-spec.md** (Finding 3) states: "Shell operator awareness: Claude Code is
aware of shell operators (`&&`, `;`, `|`). A prefix match like
`Bash(safe-cmd *)` will NOT give permission for `safe-cmd && other-cmd`."

### Analysis: These Directly Contradict Each Other

D1 says the permission system IS aware of shell operators and prevents bypass.
D9 says bypass works at a 97.9-100% rate and cites a reproduced GitHub issue.

D9 addresses this contradiction in its own text:

> "Issue was closed as COMPLETED (fixed), but the permission documentation still
> contains contradictions about shell operator awareness."

And further:

> "The security research gist (Source 7) documents bypasses in 2026, post-fix."

### Resolution

**D9 is correct that the risk exists. D1 is correct about the documentation
claim. The documentation is aspirational, not factual.**

The timeline:

1. GitHub issue #4956 (Aug 2025) documented 97.9% bypass rate
2. Issue was closed as COMPLETED -- suggesting a fix was applied
3. Official docs were updated to claim shell operator awareness
4. Security research in 2026 (post-fix) still found 84% bypass rate against hook
   guardrails

The most likely explanation: the fix improved handling of SOME compound command
patterns (perhaps `&&` and `;` for simple cases) but did not cover all bypass
vectors (subshells, variable expansion, `eval`, etc.). The documentation claim
("Claude Code is aware of shell operators") is technically true for simple cases
but practically false for adversarial scenarios.

### Impact on the Research

**This affects ALL permission rules, not just `if` conditions.** D9 correctly
identifies this but does not explicitly state the scope: if the compound command
bypass works against `if`, it works against `permissions.allow` and
`permissions.deny` too, since all three use the same matching engine. This
means:

- `permissions.allow: ["Bash(git commit *)"]` can be bypassed with
  `echo x && git commit -m "foo"`
- `permissions.deny: ["Bash(rm -rf *)"]` can be bypassed with `echo x; rm -rf /`

The RESEARCH_OUTPUT.md correctly characterizes `if` as "a performance
optimization, not a security boundary" (Section 8.1). But it does not explicitly
call out that the same vulnerability applies to the permission system itself,
which IS documented as a security boundary. This is a finding that extends
beyond the research's stated scope.

### Verdict

**Both agents cite correct sources, but the real picture is: the documentation
overclaims, and the vulnerability is broader than the research scope.** The
corrected claim for the research: "Compound command bypass is a known issue in
the permission rule matching engine used by `if`, `allow`, and `deny`.
Documentation claims shell operator awareness, but empirical testing shows this
is incomplete. For security enforcement, always validate inside the hook script
body using `grep -qE` on the full command string."

---

## Inconsistency 5: Unexplored Non-Bash `if` Uses (NEW INVESTIGATION)

### The Gap

D3-S-tool-compatibility.md proved `if` works with Write, Edit, Read, and all
tool types. But no agent systematically explored what this means for the
project's hooks. Every agent analyzed through the lens of the pre-existing
Bash-only assumption EXCEPT D3-S, which resolved the contradiction but deferred
the implications to "D3-optimization.md needs re-evaluation."

D3 was re-evaluated above (Inconsistency 1) and its per-hook conclusions hold.
But the research as a whole did not explore three specific creative non-Bash
`if` uses:

### 5a. Could post-write-validator use `if` to skip non-code writes?

**Analysis:** As evaluated in Inconsistency 2 above, the theoretical answer is
yes -- `Write(*.ts)|Write(*.tsx)|Write(*.js)` etc. would skip
markdown/config/image writes that all validators bail on anyway.

**Practical answer: NO, and it should NOT be done.** Three blocking reasons:

1. **Windows path separator failure (D9 Finding 6, GitHub #30736).** This is the
   single most important hook in the project. Adding an `if` that might silently
   prevent it from firing on Windows is an unacceptable risk. The internal
   bail-out costs ~1ms; the risk of silent failure costs the entire security
   validation layer.

2. **The hook is about to gain markdown and config validators (D6-A, D6-C).**
   Once `isMarkdownFile` and `isConfigFile` are activated, the hook legitimately
   needs to fire on ALL writes. An `if` excluding `.md` and `.json` would
   conflict with these additions.

3. **Pipe OR in `if` is unconfirmed (D1 Finding 7).** The pattern would require
   8+ alternatives. If pipe OR does not work in `if`, this would need 8+
   separate handler entries for the same script -- configuration explosion with
   no benefit over the internal dispatch.

### 5b. Could post-read-handler use `if` to only track important files?

**Analysis:** `if: "Read(*.ts)|Read(*.tsx)|Read(*.js)|Read(*.md)"` would limit
context tracking to code and documentation files, skipping reads of state files,
config files, and binary assets.

**Practical answer: NO.** D3's reasoning is correct and independent:

1. **The hook's purpose IS universal tracking.** Phase 1 (`runContextTracking`)
   counts ALL files read to warn when the session read count hits 15+ and when
   individual files exceed 5000 lines. Excluding state file reads would
   undercount the read budget, creating false confidence about context
   consumption.

2. **State file reads ARE important to track.** When Claude reads
   `.context-tracking-state.json` 15 times in a session, that IS a signal the
   hook should surface. Excluding it defeats the warning purpose.

3. **Same Windows path separator risk** applies. Read patterns on Windows may
   silently fail.

### 5c. Creative non-Bash `if` uses that NO agent considered

Three genuine opportunities that the research overlooked:

**Opportunity 1: `if` on HOOK-D5-C (Firestore rules guard) with `Write`
pattern.**

D5's proposed firestore rules guard already uses:

```
"if": "Write(firestore.rules)|Edit(firestore.rules)|Write(storage.rules)|Edit(storage.rules)"
```

This IS a non-Bash `if` condition and is correctly proposed. But no agent noted
that this is the FIRST proposed non-Bash `if` condition in the project. The
Windows path separator risk (D9 Finding 6) applies here. Since `firestore.rules`
and `storage.rules` are at the project root (no directory separators in the
path), the backslash issue may not apply -- the pattern `Write(firestore.rules)`
matches a filename, not a path with separators. However, whether the `if` engine
receives the full absolute path (`C:\Users\jason\...\firestore.rules`) or just
the filename is undocumented. **This needs testing before deployment.**

**Opportunity 2: `if` on the notification hook to scope by tool type.**

P17 (Notification hook: `curl -s -d ... ntfy.sh/sonash-claude`) fires on all
Notification events. It cannot use `if` because Notification is not a tool
event. No missed opportunity here.

**Opportunity 3: `if` for the proposed D6-D .claude/ config alert.**

D6 recommends adding the config alert INSIDE the monolith. But if it were a
separate hook, it could use:

```
"if": "Write(.claude/*)|Edit(.claude/*)"
```

to only fire when `.claude/` files are modified. This would be a clean non-Bash
`if` condition. However, D6 correctly argues the monolith approach is superior
(zero additional spawn cost). The separate hook would add ~234ms per `.claude/`
write, which is rare but unnecessary when the monolith dispatch is free.

**Opportunity 4: `if` for security rules specifically in the monolith
handlers.**

This is the most interesting missed connection. Currently P9/P10/P11 fire the
monolith on ALL Write/Edit/MultiEdit calls. The monolith has no validator for
security rules files. D5 proposes HOOK-D5-C as a SEPARATE hook for
firestore/storage rules.

Could HOOK-D5-C's logic be added to the monolith (like D6 recommends for other
validators), eliminating the need for a separate hook AND its `if` condition?

**Yes, and this is the better approach.** D5 did not consider this because D5's
scope was "new hooks using `if`" -- not "additions to the monolith." D6's scope
was "validation, config, and branch behavior" -- not security rules specifically
(that was D5's domain). The scoping boundary between D5 and D6 caused a gap
where the optimal approach (monolith addition) was not evaluated for
security-file guards.

The corrected recommendation: **HOOK-D5-C's Firestore rules integrity check
should be implemented INSIDE post-write-validator.js**, not as a separate hook
with `if`. The rationale is identical to D6's argument for JSON and markdown
validators: the monolith dispatch costs ~0ms, a separate hook costs ~234ms per
fire. The `if` pattern `Write(firestore.rules)` has unverified Windows behavior.
The monolith already receives the file path and can add a simple
`path.endsWith('firestore.rules')` check.

The ONLY argument for a separate hook is that HOOK-D5-C uses exit code 2
(blocking), while the monolith currently only uses exit 0 (advisory). Adding
blocking behavior to the monolith would block ALL writes when ANY validator
returns a blocking status. This requires careful architectural consideration --
the monolith would need per-validator exit code handling. If this is too
complex, a separate `if`-conditioned hook is the correct fallback.

---

## Inconsistency Summary Table

| #   | Finding                                                | Severity          | Who Is Right                                                  | Corrected Claim                                                                                                                                                  |
| --- | ------------------------------------------------------ | ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | D3 framing vs D3-S                                     | Low (cosmetic)    | D3 per-hook conclusions correct; framing echoes D7's error    | D3's "Bash commands pattern" language should be "narrowable tool-call subset" -- no recommendation changes                                                       |
| 2   | D6 did not evaluate `if` on existing monolith handlers | Low (theoretical) | D6 correct in practice                                        | Windows risk + near-universal coverage + D6's own dead-code activation plans close the gap                                                                       |
| 3   | D4 vs D5-S GSD scoping                                 | None (compatible) | D5-S corrects D4's confidence level                           | Not contradictory -- D5-S is the authoritative source, D4's template syntax is demoted to "test first"                                                           |
| 4   | D9 compound bypass vs D1 shell awareness               | Material          | D9 correct (bypass exists); D1 correct (docs claim awareness) | Docs overclaim. Bypass affects ALL permission rules, not just `if`. This extends beyond research scope.                                                          |
| 5   | Unexplored non-Bash `if` uses                          | Material          | Research gap -- no agent systematically explored              | See 5a-5c above. Key finding: HOOK-D5-C should be in the monolith, not a separate hook. Separate hook is fallback only if blocking exit codes require isolation. |

---

## Material Corrections to RESEARCH_OUTPUT.md

### Correction 1: Section 8.1 Should Note Broader Permission System Vulnerability

The compound command bypass documented in D9 and acknowledged in Section 8.1
affects the entire permission rule matching engine, not just `if` conditions.
The `permissions.allow` and `permissions.deny` systems use the same engine. The
documentation claim of "shell operator awareness" is aspirational based on a
partial fix, not a complete defense. The research correctly states "`if` is a
performance optimization, not a security boundary" -- but should add that the
permission system itself shares this weakness against compound commands, which
has implications beyond hook scoping.

### Correction 2: HOOK-D5-C Should Default to Monolith Implementation

Section 6.3 recommends HOOK-D5-C as a separate hook with
`if: "Write(firestore.rules)|..."`. The recommended implementation should be:
add inside `post-write-validator.js` first (matching D6's pattern), with the
separate hook as fallback only if blocking exit code isolation is required.
Reasons: zero additional spawn cost, avoids unverified Windows `if` path
matching, uses the existing `filePath` variable already parsed by the monolith.

### Correction 3: Priority Matrix P3 (HOOK-D5-C) Should Note Implementation Choice

Priority P3 lists HOOK-D5-C as "New hook (security)" with effort "1-2 hrs." This
should note: "Prefer monolith addition (lower risk, lower effort, no spawn cost)
unless blocking exit code requires handler isolation from other validators."

---

## Confidence Assessment

- Material inconsistencies found: 2 (D9 vs D1 permission scope; D5-C
  implementation path)
- Cosmetic inconsistencies found: 1 (D3 framing)
- Compatible-not-contradictory: 2 (D4 vs D5-S; D6 monolith scope)
- Overall research integrity: HIGH -- no agent reached a wrong recommendation;
  the inconsistencies are at the framing/scope boundary level, not at the core
  conclusion level
- The Bash-only assumption DID NOT materially corrupt the optimization analysis,
  because D3 analyzed each hook independently and reached correct conclusions
  for independent functional reasons
