# Findings: PreToolUse `if` Prevention Gates — Complete Design

**Searcher:** deep-research-searcher
**Profile:** codebase + docs
**Date:** 2026-03-29
**Sub-Question IDs:** G3 (contrarian-1 Challenge 1 response)
**Context:** Addresses the PostToolUse bias identified by Contrarian-1. PreToolUse with `if` can BLOCK before
an action occurs — fundamentally different from PostToolUse validation. This document designs each gate
from first principles against the actual project state.

---

## Background: Why PreToolUse + `if` Is Architecturally Distinct

PostToolUse fires AFTER the tool completes. The file is written. The damage is done. PostToolUse can only
report or attempt remediation after the fact.

PreToolUse with `if` fires BEFORE the tool runs. The `if` condition prevents the hook from even spawning
when the file path does not match — so the overhead is zero on non-matching writes. When it does match,
exit code 2 blocks the write entirely. This is the only place in the hook system where a targeted write
to a specific file can be intercepted before it happens.

The enabling condition: without `if`, a PreToolUse Write hook fires on every single write (~234ms overhead
per spawn on this machine per V3). With `if: "Write(firestore.rules)"`, the hook spawns only when that
exact file is targeted. This makes per-file prevention gates economically viable for the first time.

**Critical caveat (D9-risks):** `if` patterns on Write/Edit tools use file-path glob matching, which on
Windows normalizes to POSIX before matching. The pattern `Write(firestore.rules)` matches
`firestore.rules` relative to cwd. This is reliable for project-root files. Patterns with wildcard
directory traversal (`Write(**/.env*)`) carry higher Windows path-separator risk from GitHub #30736.

---

## Key Findings

### 1. Firestore Rules Write Gate [CONFIDENCE: HIGH]

**The highest-value PreToolUse gate in this project.**

The `firestore.rules` file contains the security boundary between client code and Firestore data. Five
protected collections (`journal`, `daily_logs`, `inventoryEntries`, `journalEntries`, plus admin-only
collections) use `allow create, update: if false` to force all writes through Cloud Functions. This is
CANON policy (referenced in CANON-0002, CANON-0034 per the file comments).

The current `firestoreWriteBlock` validator in `post-write-validator.js` (line 190) checks TypeScript/JS
source files for direct Firestore write API calls. It does NOT check `firestore.rules` itself. An AI
agent that writes `allow create, update: if isOwner(userId)` to the journal collection would silently
bypass the entire security architecture — and the existing PostToolUse monolith would not catch it because
the monolith bails early on non-JS/TS files (line 135: `isCodeFile` check is false for `.rules` files).

**Hook config:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(?i)(write|edit|multiedit)$",
        "hooks": [
          {
            "type": "command",
            "if": "Write(firestore.rules)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-firestore-rules-guard.js",
            "statusMessage": "Validating firestore.rules change..."
          },
          {
            "type": "command",
            "if": "Edit(firestore.rules)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-firestore-rules-guard.js",
            "statusMessage": "Validating firestore.rules change..."
          }
        ]
      }
    ]
  }
}
```

Note: Two separate handlers required (one for Write, one for Edit) because `if` pipe syntax for combining
different tool names within a single `if` value is unconfirmed (D1-spec Finding 7, CONFIDENCE: MEDIUM).
MultiEdit is excluded because MultiEdit operates on already-existing content; the Edit handler covers it.

**Script behavior — `pre-write-firestore-rules-guard.js`:**

The script receives the full Write/Edit tool input on stdin as JSON:
```json
{
  "tool_name": "write",
  "tool_input": {
    "file_path": "firestore.rules",
    "content": "<full proposed content>"
  }
}
```

For Write operations, `content` is available directly in the payload. For Edit operations,
`tool_input` contains `old_string`/`new_string` fields — the script must reconstruct the resulting
content by reading the current file and applying the patch mentally, OR simply read the current file
for the before-state and trust that the Edit description describes what will change.

**Recommended approach for PreToolUse (simpler and more reliable):** Extract the proposed content
from `tool_input.content` (Write) or from `tool_input.new_string` (Edit). Scan for the protected
patterns. If a protected pattern has been removed or weakened, block.

**Patterns that MUST remain present in any valid `firestore.rules`:**
1. `allow create, update: if false` on `journal` collection — mandatory (Cloud Functions gate)
2. `allow create, update: if false` on `daily_logs` collection — mandatory (Cloud Functions gate)
3. `allow create, update: if false` on `inventoryEntries` collection — mandatory (Cloud Functions gate)
4. `allow create, update: if false` on `journalEntries` collection — mandatory (legacy locked)
5. `isSignedIn()` function definition — required by all ownership checks
6. `isOwner(userId)` function definition — required by user data access

**Exit code behavior:**
- Exit 2: BLOCK — fires when a protected `allow create, update: if false` pattern is absent in the
  proposed content, or when the file appears to remove core security functions
- Exit 0: ALLOW — all patterns present, or this is a cosmetic/additive change

**Fail-open protocol:** Any parse error, stdin error, or timeout MUST exit 0 (allow). Blocking legitimate
edits is worse than missing a bad edit. The pre-commit hook (`pre-commit-agent-compliance.js`) provides
the second gate: `firestore.rules` matches `SECURITY_PATTERNS` (line 27), so committing it requires
security-auditor to have been invoked.

**Value: 9/10**

This gate closes a real gap: the existing `firestoreWriteBlock` protects JS/TS files from calling
Firestore directly, but nothing currently protects the rules file itself from being weakened. An LLM
agent making "helpful" edits to enable a new feature could accidentally relax a `if false` constraint.

**Risk: LOW** — The pattern matching is conservative (checking for REMOVAL of known-required patterns,
not validating the entire rules syntax). False positives are possible only if a legitimate refactor
moves a collection rule to a different match path — but that would require deliberate restructuring that
a developer would review anyway.

**Estimated effort: 2-3 hours** — Similar structure to `block-push-to-main.js`. The hardest part is
handling both Write (has `content`) and Edit (has `old_string`/`new_string`) payload shapes cleanly.

---

### 2. Settings.json Self-Protection Gate [CONFIDENCE: HIGH]

**The single most dangerous file an agent could corrupt.**

`.claude/settings.json` controls ALL 17 hooks in this project. If an agent writes malformed JSON or
removes the `PreToolUse` section containing `block-push-to-main.js`, the safety infrastructure for
the entire session (and all future sessions) is silently broken. The current system has no protection
against self-modification.

This is exactly the circuit-breaker Contrarian-1 described: a PostToolUse alert fires AFTER the damage
is done. A PreToolUse gate intercepts BEFORE.

**Hook config:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(?i)(write|edit|multiedit)$",
        "hooks": [
          {
            "type": "command",
            "if": "Write(.claude/settings.json)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-settings-guard.js",
            "statusMessage": "Validating settings.json change..."
          },
          {
            "type": "command",
            "if": "Edit(.claude/settings.json)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-settings-guard.js",
            "statusMessage": "Validating settings.json change..."
          }
        ]
      }
    ]
  }
}
```

**Script behavior — `pre-write-settings-guard.js`:**

For Write: extract `tool_input.content`, attempt `JSON.parse()`. If parse fails → exit 2 with message
"Blocked: .claude/settings.json would be written with invalid JSON. This would break all hooks."

For Write/Edit: after parsing, validate that critical structure is present:
- `hooks.PreToolUse` array is non-empty
- `hooks.PreToolUse` contains at least one entry with a handler for `block-push-to-main.js`
- `hooks.PreToolUse` contains at least one entry for `pre-commit-agent-compliance.js`
- `permissions.deny` array is non-empty and contains at minimum the force-push denial

If any critical hook is missing → exit 2 with message listing what would be removed.

For Edit operations: the script cannot reconstruct the full resulting JSON without applying the edit.
Recommended approach: read the CURRENT `settings.json` from disk (ground truth), apply `old_string` →
`new_string` substitution manually, then validate the result. This adds ~1ms of file I/O but gives
exact validation.

**Value: 8/10**

The settings file is the keystone. If it is corrupted mid-session, the agent might not notice for
several turns. This gate is a true circuit-breaker.

**Risk: MEDIUM** — The guard itself is stored in `settings.json` and can be disabled by a sufficiently
malicious or confused edit. However, the `if` condition means the guard DOES fire on any Write/Edit
to that file — including an edit that tries to remove it. The guard would block that removal. This is
a self-enforcing protection.

One edge case: if an agent issues a full Write that replaces settings.json entirely, the guard fires,
validates the proposed content, and blocks if it's missing critical hooks. This is robust. If an agent
uses Bash to `echo '{}' > .claude/settings.json`, the guard does NOT fire (it only covers Write/Edit
tools, not Bash). The existing `deny: ["Bash(rm -rf *)"]` doesn't cover this. This is an acknowledged
gap but out of scope for this gate.

**Estimated effort: 2-3 hours** — JSON validation is straightforward. The Edit payload reconstruction
is the only nuanced part. Well-precedented in the existing hook patterns.

---

### 3. Package.json Dependency Gate [CONFIDENCE: MEDIUM]

**A lockfile-drift warning, not a security block.**

Contrarian-1's framing is correct: a PostToolUse warning about lockfile drift fires after the agent has
already made 5 consecutive package.json edits. A PreToolUse warning fires BEFORE each edit, creating a
behavioral interrupt: "You are about to edit package.json. After this edit, run `npm install` to sync
the lockfile."

This does not need to BLOCK. The value is behavioral: forcing the agent to process the lockfile reminder
before making the edit, rather than receiving it as a post-hoc wall of warnings it has already learned
to ignore.

**Hook config:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(?i)(write|edit|multiedit)$",
        "hooks": [
          {
            "type": "command",
            "if": "Edit(package.json)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-edit-package-json-warn.js",
            "statusMessage": "Checking lockfile sync status...",
            "continueOnError": true
          }
        ]
      }
    ]
  }
}
```

Note: Only `Edit(package.json)` is included. A full `Write(package.json)` (replacing the file) is
rare in practice (usually the agent uses Edit to modify deps), and Write with a valid package.json
replacement is a legitimate operation. The `if` for Write could be added as a second handler if
warranted.

**Script behavior — `pre-edit-package-json-warn.js`:**

1. Read stdin to get `tool_input.old_string` and `tool_input.new_string` (Edit payload)
2. Compare the `dependencies`, `devDependencies`, `peerDependencies` sections between old and new
3. Detect added/removed/version-changed packages
4. If any dep changes detected, write to stderr:
   ```
   [package.json] Dependency change detected: +react@19.3.0, -some-old-pkg
   After this edit, run: npm install
   Lockfile will be out of sync until you do.
   ```
5. Exit 0 always (continueOnError: true handles script errors anyway)

Optional enhancement: check if `package-lock.json` was modified more recently than `package.json`
to detect whether a previous npm install has already caught up. If lock is fresh, skip the warning.

**Value: 5/10**

Moderate value. The warning is useful but not critical — experienced developers know to run npm install.
The main beneficiary is the AI agent, which sometimes makes multiple dep edits before running install.
The value increases if the agent is doing multi-session package.json work.

**Risk: LOW** — This hook only warns, never blocks. `continueOnError: true` makes it fail-safe.
The only risk is noise: if the warning fires on every package.json edit including cosmetic ones
(formatting, adding scripts), it becomes wallpaper. The script MUST check specifically for
`dependencies`/`devDependencies` changes, not any change.

**Estimated effort: 1-2 hours** — Simple JSON diffing. No file system reads required for the basic
implementation (payload contains old and new string for Edit).

---

### 4. Environment File Protection Gate [CONFIDENCE: HIGH]

**Prevent accidental exposure of secrets through Write operations.**

The project has multiple env files with varying sensitivity:
- `.env.local` — Contains `GITHUB_TOKEN`, `SONAR_TOKEN`, `CONTEXT7_API_KEY` (4 lines, currently
  minimal but designed for real secrets per `.env.local.example`)
- `.env.production` — Contains live Firebase API key, App Check reCAPTCHA key, Sentry DSN, App ID
  (these are all `NEXT_PUBLIC_` so technically client-side, but committing them accidentally is still
  problematic)
- `.env.local.encrypted` — Encrypted secrets file, MUST NOT be overwritten
- `functions/.env` — Firebase Functions environment (not examined but assumed to contain server-side
  secrets per Firebase conventions)

The risk this gate addresses is not the agent reading env files (that's read access) but the agent
WRITING to them — particularly:
1. Accidentally overwriting `.env.local` with reduced content (removing tokens that were there)
2. Writing a new `.env.local` that inadvertently contains a hardcoded secret from context
3. Writing to `.env.local.encrypted` which could corrupt the encrypted store

**Hook config:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(?i)(write|edit|multiedit)$",
        "hooks": [
          {
            "type": "command",
            "if": "Write(.env.local)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-env-guard.js",
            "statusMessage": "Checking env file write...",
            "continueOnError": true
          },
          {
            "type": "command",
            "if": "Write(.env.local.encrypted)",
            "command": "bash -c 'echo \"[env-guard] BLOCKED: .env.local.encrypted must not be overwritten by AI agents. Edit manually.\" >&2; exit 2'",
            "statusMessage": "Blocking env encrypted write..."
          }
        ]
      }
    ]
  }
}
```

Note: `.env.production` is intentionally excluded from blocking — it contains only `NEXT_PUBLIC_`
values that are already public (baked into the build). Warnings on that file would be noise.
The pattern `Write(.env*)` using a wildcard is possible but carries Windows path-separator risk
per D9-risks; separate explicit handlers are safer.

**Script behavior — `pre-write-env-guard.js`:**

For `.env.local` Write:
1. Read proposed content from `tool_input.content`
2. Scan for any line that looks like `KEY=<actual-value>` where the value is NOT a placeholder
   (e.g., not `your_token_here`, `YOUR_VALUE`, empty)
3. If real-looking values (long random strings, begins with `ghp_`, `sk-`, `AIza`) are present
   in non-`NEXT_PUBLIC_` keys → warn to stderr (do NOT block, since the agent may legitimately
   be setting up the file per user instruction)
4. Check if proposed content would REMOVE existing non-empty lines vs current file content
   (read disk). If yes → warn: "This write would remove existing env values."
5. Exit 0 (warning only, continueOnError)

The `.env.local.encrypted` handler uses an inline bash one-liner to block directly — no Node spawn
needed for a simple unconditional block. This saves the ~234ms spawn overhead entirely.

**Value: 6/10**

The encrypted file gate is high-value (prevents an irreversible operation). The `.env.local` warning
gate is moderate-value: it addresses scenarios where an agent "helpfully" re-creates the env file
during setup, potentially overwriting real secrets with placeholders from the example file.

**Risk: LOW-MEDIUM** — The `.env.local.encrypted` block is absolute and correct. The `.env.local`
warning is advisory. Main risk: if the user explicitly asks Claude to update `.env.local`, the warning
fires every time and becomes noise. Consider a SKIP mechanism (environment variable or flag) for
user-directed env file updates.

**Estimated effort: 1-2 hours** — The encrypted file is a one-liner. The env.local guard needs
careful threshold tuning to avoid false positives on placeholder values.

---

### 5. Large File Context Consumption Gate [CONFIDENCE: MEDIUM]

**Prevent context window exhaustion from reading large log/data files.**

The project contains multiple large files that could consume significant context window tokens if
read in full:
- `*.jsonl` files (hook-runs.jsonl, hook-warnings-log.jsonl, agent-invocations.jsonl, etc.)
- `*.log` files (firebase debug logs, build logs)
- `*.csv` files (any data exports)

A PreToolUse Read gate can check file size BEFORE the Read tool loads the content into context.
If the file exceeds a threshold, it can warn or suggest using `offset`/`limit` parameters instead.

**Hook config:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(?i)read$",
        "hooks": [
          {
            "type": "command",
            "if": "Read(*.jsonl)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-read-size-guard.js",
            "statusMessage": "Checking file size...",
            "continueOnError": true
          },
          {
            "type": "command",
            "if": "Read(*.log)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-read-size-guard.js",
            "statusMessage": "Checking file size...",
            "continueOnError": true
          }
        ]
      }
    ]
  }
}
```

**Important caveat on `if: "Read(*.jsonl)"`:** The Read `if` pattern matches the `file_path`
argument. For files in subdirectories (e.g., `.claude/state/hook-runs.jsonl`), the pattern
`Read(*.jsonl)` matches only `.jsonl` files in cwd, NOT in subdirectories. Would need
`Read(**/*.jsonl)` for recursive matching. Windows path separator risk applies here per D9-risks.

Alternative approach that avoids Windows path risk: use NO `if` condition and instead put the
file-extension check INSIDE the script. Since the Read matcher already scopes to Read events,
the `if` is a performance optimization (skip spawn for non-matching reads), not a correctness
requirement. Given that Read events are already spawning `post-read-handler.js` for ALL reads,
this PreToolUse gate would fire IN ADDITION to that existing PostToolUse hook — doubling the
overhead. Consider whether the pre-read warning value justifies two spawns per read.

**Script behavior — `pre-read-size-guard.js`:**

1. Parse stdin: `tool_input.file_path`
2. Resolve path against project root
3. Try `fs.statSync(resolvedPath)` to get file size
4. If size > 500KB → stderr warning: "Large file detected: X MB. Consider using `offset` and
   `limit` parameters to read a specific portion, or run `wc -l` first to understand structure."
5. If size > 5MB → exit 2 to BLOCK: "BLOCKED: File is X MB. Reading this file would likely
   exhaust context. Use Bash with head/tail/grep instead."
6. Exit 0 for all other cases

**Value: 4/10**

Useful but the Claude Code Read tool itself reportedly handles large files with warnings. The value
is higher during research-heavy sessions (this research session read `.research/` files). The
hard-block threshold at 5MB is a safeguard for extreme cases (accidentally reading a large
compiled bundle or a full JSONL audit log).

**Risk: LOW** — `continueOnError: true` on the warning path. Hard block at 5MB is genuinely
needed for any file that large. The main risk is the Windows `*.jsonl` pattern not matching
subdirectory files (as noted above). Mitigate by putting extension checks inside the script body
instead of relying on `if` patterns.

**Estimated effort: 1 hour** — Very simple. The main complexity is Windows path resolution and
deciding on the right size thresholds.

---

### 6. Firebase Security Headers Integrity Gate [CONFIDENCE: MEDIUM]

**Protect the COOP/COEP/CSP headers in firebase.json.**

The `firebase.json` file contains security headers that are critical for Google OAuth to work
(COOP: `same-origin-allow-popups` per CLAUDE.md Section 5). If an agent edits firebase.json to
"simplify" the hosting config, it could inadvertently remove these headers, breaking OAuth silently
in production (the error only surfaces on auth attempts, not at build time).

**Hook config:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(?i)(write|edit|multiedit)$",
        "hooks": [
          {
            "type": "command",
            "if": "Write(firebase.json)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-firebase-json-guard.js",
            "statusMessage": "Validating firebase.json change..."
          },
          {
            "type": "command",
            "if": "Edit(firebase.json)",
            "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-firebase-json-guard.js",
            "statusMessage": "Validating firebase.json change..."
          }
        ]
      }
    ]
  }
}
```

**Script behavior — `pre-write-firebase-json-guard.js`:**

For Write: parse `tool_input.content` as JSON. Check for:
1. `hosting.headers` array is present and non-empty
2. At least one header entry contains `Cross-Origin-Opener-Policy: same-origin-allow-popups`
3. `X-Frame-Options: DENY` is present
4. `Strict-Transport-Security` is present

If any required header is absent → exit 2 with message:
"BLOCKED: Proposed firebase.json is missing required security header [name].
This would break Google OAuth / expose the app to clickjacking.
CLAUDE.md Section 5: 'Google OAuth requires COOP/COEP headers in firebase.json'"

For Edit: read current file from disk, apply `old_string`/`new_string`, validate resulting JSON.
If parse fails after applying edit → exit 2 with "Blocked: firebase.json would be invalid JSON."

**Value: 7/10**

The COOP/COEP headers are specifically called out in CLAUDE.md Section 5 as a known footgun. An
agent working on hosting configuration is the most likely agent to accidentally remove these while
"cleaning up" the headers section. This gate prevents silent production breakage that would only
surface during OAuth testing.

**Risk: LOW** — The check is conservative (verifying PRESENCE of specific header values, not
validating the full hosting config schema). False positives occur only if a legitimate restructuring
moves headers to a different section, which would be unusual.

**Estimated effort: 2 hours** — JSON parsing and key-path traversal. The Edit payload reconstruction
is the same pattern as the settings.json guard.

---

### 7. Agent/Task Constraint Injection Gate (Speculative) [CONFIDENCE: LOW]

**Inject read-only guardrails before Explore agents spawn.**

CLAUDE.md Section 7 and the memory file (`feedback_agent_teams_learnings.md`) document that Explore
agents MUST be read-only. The pre-commit-agent-compliance.js hook already checks that agents were
invoked; but nothing prevents an Explore agent from making writes.

A `PreToolUse` hook with `if: "Agent(Explore)"` could fire before the Explore subagent spawns and
inject an additional system-level reminder that the agent must not write.

**Hook config (speculative):**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^(task|Task|TASK|agent|Agent|AGENT)$",
        "hooks": [
          {
            "type": "command",
            "if": "Agent(Explore)",
            "command": "bash -c 'echo \"[agent-guard] Explore agent spawning. Constraint: READ-ONLY. Do not use Write, Edit, or Bash tools.\" >&2; exit 0'",
            "continueOnError": true
          }
        ]
      }
    ]
  }
}
```

**Confidence note:** The `if: "Agent(Explore)"` pattern matches on the agent PROMPT, not on an
"agent type" field. The D1-spec documents `Agent(Explore)` as matching the prompt containing
"Explore". This is an inference from permission rule syntax, not verified behavior for the
`if` field specifically (V1 flags Agent/Task patterns as extrapolated, CONFIDENCE: MEDIUM).

**Value: 3/10 for this implementation** — The banner message in stderr is likely to be invisible
to a subagent that doesn't read its spawner's stderr. The more architecturally correct approach
is enforcing read-only through the subagent's own system prompt or CLAUDE.md. This gate is a
belt-and-suspenders addition, not a primary mechanism.

Higher value would be: a PreToolUse gate that fires when an Explore agent spawns and pre-populates
context (branch diff, PR comments) to save the agent's first 10-30 seconds of context gathering.
But that requires stdout injection which is not how hooks work — hooks can only block (exit 2) or
emit to stderr.

**Risk: LOW** — `continueOnError: true`. If Agent pattern matching behaves differently than
documented, the hook is a no-op.

**Estimated effort: 30 minutes** — Inline bash, no Node script needed for the basic version.

---

### 8. Storage Rules Companion Gate [CONFIDENCE: MEDIUM]

**A natural companion to Gate 1 that protects storage.rules.**

The project has `storage.rules` referenced in `firebase.json`. While not as security-critical as
`firestore.rules` (Firebase Storage rules typically allow authenticated user uploads rather than
blocking all client writes), a weakened storage rules file could allow public uploads or cross-user
data access.

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [
    {
      "type": "command",
      "if": "Write(storage.rules)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-storage-rules-guard.js",
      "statusMessage": "Validating storage.rules change..."
    },
    {
      "type": "command",
      "if": "Edit(storage.rules)",
      "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/pre-write-storage-rules-guard.js",
      "statusMessage": "Validating storage.rules change..."
    }
  ]
}
```

**Script behavior:** Similar to firestore rules guard. Check that:
1. `isSignedIn()` or equivalent auth check is present
2. No `allow read, write: if true` (public access to all paths) is present
3. File is valid Firebase rules syntax (basic structural check)

**Value: 5/10** — Lower priority than firestore.rules because storage rules don't gate the
core data security model. Include as part of the same script refactor as Gate 1 (share the
rules-syntax validation logic).

**Estimated effort: 1 hour** — Can reuse the firestore rules guard script with different
required-pattern lists. Minimal marginal effort once Gate 1 is built.

---

## Priority Matrix

| Gate | Hook | Value | Risk | Effort | Priority |
|------|------|-------|------|--------|----------|
| 1. Firestore rules write gate | PreToolUse Write+Edit(firestore.rules) | 9/10 | LOW | 2-3 hrs | P1 |
| 2. Settings.json self-protection | PreToolUse Write+Edit(.claude/settings.json) | 8/10 | MEDIUM | 2-3 hrs | P1 |
| 6. Firebase.json headers gate | PreToolUse Write+Edit(firebase.json) | 7/10 | LOW | 2 hrs | P2 |
| 4. Env file protection | PreToolUse Write(.env.local + .env.local.encrypted) | 6/10 | LOW-MED | 1-2 hrs | P2 |
| 3. Package.json dep gate | PreToolUse Edit(package.json) | 5/10 | LOW | 1-2 hrs | P3 |
| 8. Storage rules gate | PreToolUse Write+Edit(storage.rules) | 5/10 | LOW | 1 hr | P3 |
| 5. Large file read gate | PreToolUse Read(*.jsonl, *.log) | 4/10 | LOW | 1 hr | P4 |
| 7. Explore agent constraint | PreToolUse Agent(Explore) | 3/10 | LOW | 30 min | Research |

---

## Architecture Decisions

### Decision A: PreToolUse Write payload access

For PreToolUse hooks on Write events, `tool_input.content` contains the FULL proposed file content.
This means the guard script can validate the new content BEFORE the write occurs — a significant
advantage over PostToolUse, which would need to read the file from disk (and only after it was
already written).

For Edit events, the payload contains `tool_input.old_string`, `tool_input.new_string`, and
`tool_input.file_path`. The guard must either:
(a) Apply the substitution manually to reconstruct the result (simple string replace), or
(b) Read the current file from disk and trust the Edit description.

Option (a) is more reliable since it doesn't require disk I/O and handles cases where the file
hasn't been created yet.

### Decision B: Two handlers vs. one combined handler

The `if` pipe syntax `"Write(firestore.rules)|Edit(firestore.rules)"` is UNCONFIRMED (D1-spec
Finding 7, CONFIDENCE: MEDIUM). The safe implementation uses separate handler objects:
```json
{ "if": "Write(firestore.rules)", "command": "..." },
{ "if": "Edit(firestore.rules)", "command": "..." }
```

Both handlers invoke the SAME script. The script reads `tool_name` from stdin to determine which
payload shape to expect. This adds one process spawn when BOTH a Write and Edit fire on the same
file in the same batch, but that scenario is rare for critical security files.

### Decision C: Where these gates fit relative to the existing PostToolUse monolith

These gates do NOT replace or overlap with `post-write-validator.js`. They are complementary:
- PreToolUse gates: targeted prevention for a small set of critical files
- PostToolUse monolith: broad validation across all JS/TS writes

The separation is architecturally correct. The monolith was consolidated to save ~800ms Windows
spawn cost across 10 separate hooks. Adding these critical-file gates as PreToolUse (not PostToolUse)
avoids the monolith's spawn-cost argument entirely — they only fire on specific file paths.

### Decision D: Fail-open vs. fail-closed

All guards except `.env.local.encrypted` should fail-open (exit 0 on error). Rationale:
- These gates are second-line defenses
- The pre-commit `pre-commit-agent-compliance.js` provides a third gate requiring security-auditor
  invocation before any `firestore.rules` commit
- Blocking legitimate work due to a hook error is worse than missing a bad edit

The `.env.local.encrypted` gate can fail-closed (exit 2) because there is NO legitimate reason
for an AI agent to overwrite an encrypted secrets file.

---

## Sources

| # | Source | Title | Type | Trust | Date |
|---|--------|--------|------|-------|------|
| 1 | Codebase: firestore.rules | Actual security rules (ground truth) | filesystem | HIGH | 2026-03-29 |
| 2 | Codebase: .claude/settings.json | Actual hook configuration (ground truth) | filesystem | HIGH | 2026-03-29 |
| 3 | Codebase: .claude/hooks/block-push-to-main.js | PreToolUse hook structural pattern | filesystem | HIGH | 2026-03-29 |
| 4 | Codebase: .claude/hooks/post-write-validator.js | Monolith validator architecture | filesystem | HIGH | 2026-03-29 |
| 5 | Codebase: .claude/hooks/pre-commit-agent-compliance.js | PreToolUse stdin payload pattern | filesystem | HIGH | 2026-03-29 |
| 6 | findings/D1-spec.md | If field specification (Write/Edit payload shapes, OR syntax) | research | HIGH | 2026-03-29 |
| 7 | findings/D9-risks.md | Windows path separator risk, compound command bypass | research | HIGH | 2026-03-29 |
| 8 | challenges/contrarian-1.md | Challenge 1: PreToolUse underexplored (design requirements) | research | HIGH | 2026-03-29 |
| 9 | CLAUDE.md Section 5 | Firebase COOP/COEP header requirement documented | project-docs | HIGH | 2026-03-24 |
| 10 | firebase.json | Actual security headers in production hosting config | filesystem | HIGH | 2026-03-29 |

---

## Contradictions

**C1: Write payload vs. Edit payload shape for PreToolUse**

The D1-spec documents that Write provides `file_path + content` in `tool_input`, while Edit provides
`file_path + old_string + new_string`. For gate scripts that validate the resulting file content
(firestore.rules, settings.json), this means TWO code paths are required. The Write path is
straightforward (content is directly available). The Edit path requires string substitution to
reconstruct the result. There is no documented guarantee that `old_string` appears exactly once
in the current file — if an agent uses a non-unique `old_string`, the substitution is ambiguous.

This is a solvable engineering problem but should be noted: for single-match guarantees, the Edit
guards should use `new_string` content only for critical-pattern presence checks (rather than full
file reconstruction), accepting that they may fail to detect pattern REMOVAL by an Edit.

**C2: `if` pipe syntax confirmation status**

D1-spec Finding 7 says pipe syntax within a single `if` value is UNCONFIRMED. However, the existing
project already uses pipe syntax in PostToolUse:
```json
"if": "Bash(git commit *)|Bash(git cherry-pick *)|Bash(git merge *)|Bash(git revert *)"
```
(settings.json line 154-157). This was added and is presumably working. For Bash patterns, pipe
syntax appears to be working in practice. For Write/Edit patterns, it remains unconfirmed. The
conservative approach (separate handlers) is still recommended for critical-path gates.

---

## Gaps

**G1: PreToolUse Write payload for MultiEdit**

MultiEdit (`tool_input`) payload shape for PreToolUse is not documented in the research findings.
The MultiEdit tool applies multiple edits atomically. The guard scripts would need to handle
a different payload shape. Given that MultiEdit on `firestore.rules` is rare (typically one edit
at a time on security files), this is lower priority — but should be verified before deploying
Gate 1 with a MultiEdit handler.

**G2: `if` pattern behavior for files with no extension**

`.env.local` has no traditional file extension. The pattern `Write(.env.local)` should match
exactly the filename `.env.local` in the project root. The D1-spec documents that bare filename
patterns match relative to cwd. However, `.env*` as a wildcard on Windows may behave
differently than on POSIX. The safest approach is explicit filenames (`Write(.env.local)`,
`Write(.env.production)`) rather than wildcards for env file gates.

**G3: PreToolUse block does not prevent clipboard/manual edits**

If the user manually edits `firestore.rules` outside of Claude Code, the PreToolUse gate does not
fire. These gates protect against AI-agent writes, not human writes. This is the expected scope.

**G4: No mechanism to inject "pre-flight context" into agent from PreToolUse hook**

Contrarian-1 proposed that a PreToolUse gate on `Task(code-reviewer)` could pre-populate the
agent with branch diff context. However, PreToolUse hooks communicate back to Claude Code only via
exit codes (0/2) and stderr messages — they cannot inject content into the spawned agent's context.
This capability does not exist in the current hook system.

---

## Serendipity

**S1: The `.env.local.encrypted` unconditional block is the easiest high-value gate to ship**

The `.env.local.encrypted` block requires zero Node.js script — it's a single inline bash one-liner.
It fires only when an AI agent explicitly tries to Write to the encrypted secrets file (which should
never happen legitimately). This can be shipped in under 5 minutes and closes a genuinely dangerous
edge case. It should be the first gate deployed as a proof-of-concept for the PreToolUse Write
pattern.

**S2: Settings.json self-protection creates a bootstrap paradox with a good resolution**

The settings.json guard is stored in settings.json. If the guard is added by an AI Write to
settings.json, it fires on that Write and validates the proposed content — which INCLUDES the guard
itself, so it passes. The guard is self-bootstrapping: once it exists, any subsequent Write that
tries to remove it will fail its own validation. This is an elegant self-enforcing protection.

**S3: PreToolUse gates enable a new security audit category**

The project tracks hook invocations in `.claude/state/` files. Adding PreToolUse BLOCK events to
the hook run log (recording what was blocked and why) would create an audit trail of prevented
security regressions. This is more actionable than the current PostToolUse monolith logs, which
record what was warned about after-the-fact.

---

## Confidence Assessment

- HIGH claims: 6 (gate 1, gate 2, gate 4-partial, gate 6, architecture decisions A-D, payload shapes)
- MEDIUM claims: 4 (gate 3, gate 5, gate 8, pipe syntax contradiction)
- LOW claims: 1 (gate 7 — Agent pattern matching unconfirmed for `if`)
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** for gates 1, 2, 6; **MEDIUM** for gates 3-5, 8; **LOW** for gate 7
