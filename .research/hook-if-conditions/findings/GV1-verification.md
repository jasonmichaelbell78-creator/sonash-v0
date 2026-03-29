# GV1: Cross-Findings Verification

**Verifier:** Verification agent (Opus 4.6)
**Date:** 2026-03-29
**Scope:** Verify specific claims from G1, G2, and G3 against ground truth

---

## Verification 1: G1 Disagreement on Claim 7 — post-write-validator splitting viability

**Claim:** Gemini argued that `post-write-validator.js` could benefit from `if`-based splitting
because some files trigger only 1-2 of 10 validators, making separate `if`-conditioned hooks
more efficient (skip spawn entirely for non-matching file types).

**Ground truth analysis of post-write-validator.js (1100 lines, 10 validators):**

Each validator's file-type gate was read directly from the source:

| # | Validator | Gate condition | Fires on |
|---|-----------|---------------|----------|
| 2 | auditS0S1 | `isWriteTool` + path includes `docs/audits` + `.jsonl` | `.jsonl` audit files only (Write tool only) |
| 3 | patternCheck | `isPatternCheckable` = `.js .ts .tsx .jsx .sh .yml .yaml` | JS/TS/shell/YAML |
| 4 | componentSizeCheck | `isTsxFile` + `app/` or `components/` prefix | `.tsx` in app/components only |
| 5 | firestoreWriteBlock | `isJsTsFile` = `.ts .tsx .js .jsx` | All JS/TS files |
| 6 | testMockingValidator | `isTestFile` = `.test.` or `.spec.` files | Test files only |
| 7 | appCheckValidator | `functions/src/*.ts` (currently suppressed) | Cloud Functions TS only |
| 8 | typescriptStrictCheck | `isTsFile` = `.ts .tsx` (excl `.d.ts`, tests, scripts) | TypeScript non-test files |
| 9 | repositoryPatternCheck | `isTsxFile` (excl lib/, admin/, functions/, scripts/) | `.tsx` component files |
| 10 | agentTriggerEnforcer | Pattern from config (code files broadly) | Most code files |
| 11 | testRegistryReminder | `isWriteTool` + `isTestFile` | New test files (Write only) |

**File type analysis — how many validators fire per type:**

| File type | Validators that run | Count |
|-----------|-------------------|-------|
| `.tsx` in `app/` or `components/` | 3, 4, 5, 8, 9, 10 | **6** |
| `.ts` (non-test, non-functions) | 3, 5, 8, 10 | **4** |
| `.ts` in `functions/src/` | 3, 5, 7, 8, 10 | **5** |
| `.test.tsx` | 3, 5, 6, 10 | **4** |
| `.jsx` / `.js` | 3, 5, 10 | **3** |
| `.sh` | 3 | **1** |
| `.yml` / `.yaml` | 3 | **1** |
| `.jsonl` (audit, Write tool) | 2 | **1** |
| `.md` | 10 (if matches agent trigger pattern) | **0-1** |
| `.json` / `.env` / config | (none — `isConfigFile` is defined but no validator uses it as a gate) | **0** |

**Verdict: VERIFIED — Gemini's architectural argument has merit for a subset of file types.**

For `.sh`, `.yml`, `.yaml`, `.jsonl`, `.md`, `.json`, and `.env` files, the monolith spawns a
Node.js process (~234ms on Windows) only to run 0-1 validators and bail. An `if`-conditioned
approach would skip the spawn entirely for these types.

However, the research's pragmatic conclusion is also correct: the **majority of writes in this
project are `.ts` and `.tsx` files** (the primary development languages), and these trigger 4-6
validators each. Splitting into 10 separate `if`-conditioned hooks would mean 4-6 spawns
(4 * 234ms = ~936ms) instead of 1 spawn (~234ms). The monolith wins decisively for the common
case.

**Bottom line:** Gemini is right that 1-validator file types waste the spawn. The research is
right that the monolith is the correct pragmatic choice for this project's file distribution.
A hybrid approach (monolith for JS/TS, `if`-gated skip for non-code files) would be optimal but
adds complexity for marginal gain.

---

## Verification 2: G2 Claim — Hooks are NOT hot-reloaded mid-session

**Claim:** Claude Code does not hot-reload hooks from settings.json mid-session. Hooks are loaded
at session start and remain fixed.

**Evidence from official Claude Code documentation (Context7, HIGH trust):**

1. **Hooks Guide (SKILL.md):** "Hooks are loaded when a Claude Code session starts, and changes to
   hook configuration require restarting Claude Code. Editing hooks.json, adding new hook scripts,
   or changing hook commands and prompts won't affect the current session."

2. **Plugin Settings (SKILL.md):** "hooks not being hot-swapped during a session" — explicit
   statement. Instructions say: "Save the file / Exit Claude Code / Restart: `claude` or `cc` /
   New settings will be loaded."

3. **G2's empirical test confirmed this:** A new hook added to settings.json mid-session was
   ignored, while existing hooks (loaded at session start) continued firing normally.

**Sub-question: Does `/exit` and restart count as a new session?**

Yes. The docs say "Exit Claude Code / Restart: claude or cc / New settings will be loaded." Each
invocation of the `claude` CLI begins a new session with fresh hook loading. `/exit` terminates
the current session; the subsequent `claude` command starts a new one that loads the current
settings.json.

**Verdict: VERIFIED — with official documentation confirmation.**

This is not just empirically observed but explicitly documented by Anthropic. The reload boundary
is the session lifecycle, not file-change detection.

---

## Verification 3: G2 Claim — Paths are POSIX-normalized before matching

**Claim:** Windows paths are POSIX-normalized before `if` pattern matching, so
`C:\Users\alice` becomes `/c/Users/alice`.

**Evidence from official Claude Code permissions documentation (code.claude.com, HIGH trust):**

Direct quote from the official permissions page (retrieved via Context7):

> "On Windows, paths are normalized to POSIX form before matching. `C:\Users\alice` becomes
> `/c/Users/alice`, so use `//c/**/.env` to match `.env` files anywhere on that drive. To match
> across all drives, use `//**/.env`."

This is from `https://code.claude.com/docs/en/permissions` — the authoritative source for
permission rule syntax, which is the same syntax used by the `if` field (confirmed by D1-spec
Finding 2).

**D8-locale's contradicting claim is REFUTED by official docs.** D8 warned that "Claude generates
Windows-style backslash paths, but the glob matcher treats `\` as escape characters." This
concern was based on inference from the codebase-profile agent, not official documentation. The
official docs explicitly state normalization occurs before matching.

**Important nuance:** The normalization applies to the `if` pattern matching engine (permission
rule system). It does NOT apply to the `$ARGUMENTS` / stdin passed to the hook command itself.
G2's finding that `post-write-validator.js` needs `filePath.replace(/\\/g, "/")` on line 108
proves that hook scripts still receive Windows-native paths. These are two separate systems:
- **`if` field evaluation:** POSIX-normalized (by Claude Code's internal engine)
- **Hook command stdin/args:** Raw Windows paths (passed through to the subprocess)

**Verdict: VERIFIED — with explicit official documentation statement.**

The D1-spec Finding 5 accurately quoted the official docs. D8-locale's warning about path
separator failures in `Edit(...)` patterns is refuted for the `if` field specifically, though
it remains valid for hook script internals that process `$ARGUMENTS`.

---

## Verification 4: G3 Claim — Settings.json self-protection gate is self-bootstrapping

**Claim:** If a PreToolUse hook guards `.claude/settings.json` by checking that security hooks
aren't removed, and the guard itself IS in settings.json, then editing settings.json to remove
the hook would trigger the hook which would block the removal. This creates a self-enforcing
protection.

**Logic analysis:**

The proposed flow:
1. Guard hook exists in settings.json with `if: "Write(.claude/settings.json)"`
2. Agent attempts to Write/Edit `.claude/settings.json`
3. PreToolUse fires, `if` matches, hook spawns
4. Hook reads proposed content, detects that critical hooks (including itself) are missing
5. Hook exits with code 2 (BLOCK)
6. Claude Code prevents the Write/Edit from executing
7. Settings.json remains intact with the guard still present

This logic IS sound for the Write/Edit tool path. The self-bootstrapping property holds:
once the guard is added, it protects its own continued existence.

**Edge cases analyzed:**

**Edge case A: File deleted entirely (not edited)**
- If an agent uses `Bash(rm .claude/settings.json)` — the PreToolUse Write/Edit guard does NOT
  fire because `rm` is a Bash command, not a Write/Edit tool invocation. The guard only covers
  Write and Edit tools.
- **Mitigation:** The existing `deny: ["Bash(rm -rf *)"]` partially covers this, but
  `Bash(rm .claude/settings.json)` is not denied by that pattern. G3 acknowledges this gap
  explicitly (Gate 2, Risk section): "If an agent uses Bash to `echo '{}' > .claude/settings.json`,
  the guard does NOT fire."

**Edge case B: Agent writes via Bash redirect**
- `echo '{}' > .claude/settings.json` or `cat > .claude/settings.json` bypass the guard entirely.
  These are Bash tool invocations, not Write/Edit.
- **Mitigation:** Would require a separate `Bash(*settings.json*)` PreToolUse hook, which has its
  own compound-command bypass risks (Claim 3, G1).

**Edge case C: First installation of the guard**
- When the guard is first added to settings.json (via a Write/Edit), it cannot protect itself
  because it does not yet exist in the loaded hooks (hooks load at session start per Verification 2).
  The guard only becomes active in the NEXT session.
- **Mitigation:** G3 acknowledges this implicitly. The guard must be added in one session and
  takes effect in subsequent sessions.

**Edge case D: Malformed JSON that passes JSON.parse but removes hooks structurally**
- If the proposed content is valid JSON but reorganizes the structure (e.g., nests `hooks` under
  a new key), the guard's structural checks might not catch it depending on implementation.
- **Mitigation:** The proposed script checks specific key paths (`hooks.PreToolUse` array
  non-empty, contains `block-push-to-main.js`). This is robust against restructuring.

**Verdict: VERIFIED with known edge cases.**

The self-bootstrapping logic is sound for the Write/Edit tool path. G3 correctly identified the
Bash bypass as an acknowledged gap. The additional edge cases (first-install session lag, Bash
redirect bypass) do not invalidate the claim but bound its effectiveness to Write/Edit tool
operations only. The protection is a defense-in-depth layer, not an absolute guarantee —
which is consistent with G3's framing.

---

## Verification 5: G3 Claim — `.env.local.encrypted` block is a 5-minute inline bash ship

**Claim:** The `.env.local.encrypted` unconditional block can be implemented as an inline bash
one-liner (`bash -c 'echo "BLOCKED" && exit 1'`) requiring no Node script, deployable in under
5 minutes.

**Sub-question A: Is inline bash valid for PreToolUse hooks?**

Yes. The hook configuration accepts any `"type": "command"` with a `"command"` string. The
command can be:
- A path to a script (`node .claude/hooks/some-script.js`)
- An inline bash command (`bash -c '...'`)
- Any executable command

The existing project already uses `bash .claude/hooks/ensure-fnm.sh ...` as the command format.
An inline `bash -c '...'` is structurally equivalent. The hook system does not require an
external script file.

**Sub-question B: What does Claude Code do when a PreToolUse hook returns non-zero?**

From the official Claude Code docs (Context7, Hook Development SKILL.md):

> "An exit code of `0` signifies success, and its standard output is included in the transcript.
> An exit code of `2` indicates a blocking error, causing the hook's standard error output to be
> fed back to Claude, effectively stopping further processing in many cases. Any other exit code
> is considered a non-blocking error, allowing the system to continue operation while still
> indicating an issue."

Exit code semantics:
- **Exit 0:** Allow (success)
- **Exit 2:** BLOCK — stderr fed back to Claude, tool invocation prevented
- **Any other non-zero (1, 3, etc.):** Non-blocking error — operation continues

**Critical bug in G3's proposed command:** The G3 document proposes:
```json
"command": "bash -c 'echo \"[env-guard] BLOCKED: .env.local.encrypted must not be overwritten by AI agents. Edit manually.\" >&2; exit 2'"
```

This is CORRECT. The command:
1. Writes the block message to stderr (`>&2`) — which is what Claude Code reads for exit-2 blocks
2. Exits with code 2 — which triggers the BLOCK behavior

However, the G3 text body mentions `exit 1` in the section header claim ("bash -c 'echo
"BLOCKED" && exit 1'"). Exit 1 would be a **non-blocking error**, NOT a block. The actual
proposed JSON config in G3 correctly uses `exit 2`. This is a minor inconsistency in the
narrative text vs. the actual config — the config is correct.

**Sub-question C: Is this truly a 5-minute deployment?**

The proposed hook config is 5 lines of JSON added to the existing `PreToolUse` section in
settings.json. No external script file needed. No dependencies. The only steps are:
1. Add the JSON block to settings.json
2. Restart the session (hooks load at session start)

This is conservatively a 5-minute task, likely less.

**Verdict: VERIFIED — with one correction.**

The inline bash approach is valid for PreToolUse hooks. Exit code 2 correctly blocks the
operation. The proposed config in G3 is correct (`exit 2`, stderr output). The narrative
mention of `exit 1` is a typo/inconsistency that does not appear in the actual proposed config.
The 5-minute deployment estimate is accurate.

---

## Summary

| # | Claim | Verdict | Key Evidence |
|---|-------|---------|-------------|
| 1 | Gemini right on validator splitting viability | **VERIFIED** | `.sh`/`.yml`/`.jsonl`/`.md` trigger 0-1 validators; monolith still wins for `.ts`/`.tsx` majority |
| 2 | Hooks NOT hot-reloaded mid-session | **VERIFIED** | Official docs: "changes to hook configuration require restarting Claude Code" |
| 3 | Paths POSIX-normalized before `if` matching | **VERIFIED** | Official permissions docs: "`C:\Users\alice` becomes `/c/Users/alice`" |
| 4 | Settings.json self-protection is self-bootstrapping | **VERIFIED with edge cases** | Logic sound for Write/Edit path; Bash bypass is acknowledged gap |
| 5 | `.env.local.encrypted` inline bash block is viable | **VERIFIED with correction** | Exit 2 = BLOCK per official docs; G3 config correct; narrative text had `exit 1` typo |
