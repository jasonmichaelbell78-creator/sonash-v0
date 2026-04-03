# Findings: ensure-fnm.sh Wrapper Overhead Analysis

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-29
**Sub-Question IDs:** D7-S (supplemental to D7 performance, D8 locale)

---

## Key Findings

### 1. ensure-fnm.sh does four expensive things per invocation [CONFIDENCE: HIGH]

Full script at `.claude/hooks/ensure-fnm.sh` (38 lines). Every invocation:

1. `command -v fnm` — PATH search for fnm binary
2. `fnm env --shell bash` — spawns fnm process, outputs shell env vars (~80ms)
3. `eval "$FNM_ENV"` — injects PATH/env into subshell
4. `fnm use --silent-if-unchanged` — second fnm process spawn, reads `.nvmrc`
   (~70ms)
5. `command -v node` — PATH search confirming node is now available
6. `exec "$@"` — finally executes the real command

The script also contains injection-safety checks on fnm env output (the `case`
pattern check), which is correct security practice but adds no measurable
overhead.

### 2. Measured wrapper overhead: 167ms per invocation [CONFIDENCE: HIGH]

All measurements taken on this machine (Windows 11, Git Bash), 10-run averages:

| Scenario                              | Avg (10 runs) | Notes                   |
| ------------------------------------- | ------------- | ----------------------- |
| Bare bash subshell (`bash -c 'echo'`) | 59ms          | Subshell spawn baseline |
| Bare `node --version`                 | 66ms          | Node spawn baseline     |
| `ensure-fnm.sh echo test`             | ~220ms        | Wrapper only, no node   |
| `ensure-fnm.sh node --version`        | **233ms**     | Full chain              |
| **fnm wrapper overhead**              | **167ms**     | 233ms − 66ms            |

Breakdown of the 167ms wrapper overhead:

- `fnm env --shell bash`: ~80ms (median across 5 runs: 77–81ms)
- `fnm use --silent-if-unchanged`: ~70ms (median: 63–76ms)
- Shell startup + checks: ~17ms remaining

### 3. 16 hooks use ensure-fnm.sh; distribution makes PostToolUse the dominant cost [CONFIDENCE: HIGH]

From `.claude/settings.json` (verified via JSON parse):

| Event            | fnm-wrapped hooks | Typical fires/session           |
| ---------------- | ----------------- | ------------------------------- |
| SessionStart     | 5                 | 1 (fires once)                  |
| PreToolUse       | 2                 | ~10–20 (git/bash only)          |
| PostToolUse      | 7                 | ~40–100+ (write/edit/read/bash) |
| PreCompact       | 1                 | 0–2                             |
| UserPromptSubmit | 1                 | ~20–40                          |
| **Total hooks**  | **16**            | —                               |

Estimated per-session fnm overhead at conservative (50 invocations) to typical
(336):

- **Conservative minimum:** 50 × 167ms = **8.4 seconds**
- **Typical session:** 336 × 167ms = **56 seconds**

The D7 finding of "fnm adding ~161ms overhead" per invocation is confirmed and
refined (167ms measured here).

### 4. node IS on PATH without ensure-fnm.sh — right now [CONFIDENCE: HIGH]

Current PATH includes:

```
/c/Users/jason/AppData/Roaming/fnm/aliases/default
```

This path is present in the **Windows User environment registry** (confirmed via
PowerShell `[Environment]::GetEnvironmentVariable('PATH', 'User')`). It is NOT
inherited only from a shell session — it is a permanent Windows user PATH entry.

The `fnm/aliases/default` directory is a Windows junction pointing to:

```
C:\Users\jason\AppData\Roaming\fnm\node-versions\v22.22.1\installation
```

Verified: `node.exe` at that path is a real PE32+ x86-64 executable (87MB), not
a shim or wrapper.

Result: `node --version` resolves in a **bare `bash --norc --noprofile`
subshell** with no `.bashrc` sourcing. The fnm env injection that ensure-fnm.sh
performs is redundant on this machine.

### 5. .nvmrc and fnm default alias are in sync — no version conflict [CONFIDENCE: HIGH]

Project `.nvmrc` contains `22`. fnm default alias points to `v22.22.1`. The
`fnm use --silent-if-unchanged` call inside ensure-fnm.sh would be a **no-op**
on every invocation — it confirms the already-active version and does nothing.
Yet it costs ~70ms each time.

### 6. Risks of removing ensure-fnm.sh [CONFIDENCE: MEDIUM]

**Low-risk scenarios (safe to remove wrapper):**

- This machine: node is on Windows User PATH permanently via fnm
  aliases/default. Hooks calling `node` directly would work.
- Any machine where fnm installs node into a permanent PATH entry.

**Medium-risk scenarios (wrapper still needed):**

- A different locale where fnm was set up via `.bashrc`/`.zshrc` shell init
  only, and the PATH entry is only injected at interactive login. In that case,
  Claude Code hooks (which spawn non-interactive subshells) would not see node.
- A machine that has never run `fnm` setup and relies on some other node manager
  (nvm, volta) that does not expose a static PATH alias.

**D8's finding confirmed:** If fnm is absent, 12 of 17 hooks fail. The wrapper
exists to normalize this cross-locale risk. On this specific locale, the wrapper
costs 167ms × N invocations for no benefit.

**The actual risk is not "will node be found" but "which node version will be
used."** If fnm aliases/default points to a different version than `.nvmrc`
specifies, removing the wrapper means hooks always use the default version
rather than the project version. Currently this is a non-issue (both v22), but
could bite in a multi-project environment.

### 7. Faster alternatives to the full wrapper [CONFIDENCE: MEDIUM]

Three options in ascending order of risk reduction vs. overhead savings:

**Option A: Replace wrapper with direct node (full removal)** Change all 16 hook
commands from:

```
bash .claude/hooks/ensure-fnm.sh node .claude/hooks/foo.js
```

to:

```
node .claude/hooks/foo.js
```

Saves: 167ms × all invocations. Risk: fails on any locale where node is not on
PATH without fnm init.

**Option B: Lean PATH-check wrapper (no fnm invocation)** New wrapper that only
checks `command -v node` and executes directly — skipping `fnm env` and
`fnm use` entirely. Falls back to fnm init only if node is not found. This
eliminates the 167ms overhead on this locale while providing a safety net on
others.

```bash
#!/bin/bash
# Fast path: if node is already on PATH, skip fnm init entirely
if command -v node >/dev/null 2>&1; then
  exec "$@"
fi
# Slow path: initialize fnm and retry
if ! command -v fnm >/dev/null 2>&1; then
  echo "ensure-fnm.sh: neither node nor fnm available" >&2; exit 1
fi
eval "$(fnm env --shell bash 2>/dev/null)" || exit 1
fnm use --silent-if-unchanged >/dev/null 2>&1 || true
exec "$@"
```

Estimated overhead on this machine: ~5ms (just the `command -v node` check, no
fnm spawns). Full 167ms cost only paid where fnm init is truly needed.

**Option C: Resolve node path once at session start** Cache `$(which node)` at
SessionStart and inject `NODE_BIN` into hook environment. All subsequent hooks
use `$NODE_BIN` directly. Zero per-invocation wrapper overhead. Requires
architectural change to hook infrastructure.

---

## Sources

| #   | Path                               | Title                      | Type               | Trust | CRAAP           | Date       |
| --- | ---------------------------------- | -------------------------- | ------------------ | ----- | --------------- | ---------- |
| 1   | `.claude/hooks/ensure-fnm.sh`      | ensure-fnm.sh script       | source-code        | HIGH  | 5/5/5/5/5 = 5.0 | current    |
| 2   | `.claude/settings.json`            | Claude hooks configuration | source-code        | HIGH  | 5/5/5/5/5 = 5.0 | current    |
| 3   | `which node` + timing measurements | Live shell measurements    | direct-measurement | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 4   | PowerShell PATH registry query     | Windows user environment   | direct-measurement | HIGH  | 5/5/5/5/5 = 5.0 | 2026-03-29 |
| 5   | `.nvmrc`                           | Project node version pin   | source-code        | HIGH  | 5/5/5/5/5 = 5.0 | current    |

---

## Contradictions

**D8 vs. this finding:** D8 identified ensure-fnm.sh as the biggest cross-locale
risk (12/17 hooks fail if fnm absent). This is still true for the _absence of
fnm_ case. However, D8's implication that the wrapper is _necessary_ on this
locale is contradicted by direct measurement: node resolves without the wrapper
on this machine because `fnm/aliases/default` is in the Windows User PATH
registry permanently. The wrapper is doing redundant work on every invocation
here.

The contradiction is not resolvable without testing on the second locale (if one
exists). The recommendation differs per locale.

---

## Gaps

- **Second locale testing:** Could not verify whether the second locale
  (mentioned in D8) also has fnm/aliases/default in its Windows User PATH. If it
  does, Option A (full removal) is safe everywhere. If it doesn't, Option B
  (lean wrapper) is required.
- **Hook parallelism:** If Claude Code fires multiple PostToolUse hooks in
  parallel within a single tool use, the per-invocation costs may overlap rather
  than stack. The session overhead calculation assumes sequential execution.
  Actual overhead may be lower.
- **fnm use version-switch scenario:** Not tested: what if a user runs
  `fnm install 20` and `fnm use 20` in a different terminal mid-session. Would
  aliases/default update immediately? This affects whether removing
  ensure-fnm.sh could cause version drift during a session.

---

## Serendipity

**fnm multishells are stale:** The directory
`/c/Users/jason/AppData/Local/fnm_multishells/` contained 5 entries from
previous sessions (timestamps dating back days). These are not auto-cleaned.
Each is a full node binary directory junction. This is benign but represents
disk waste if fnm has many old shell sessions. Not related to hook performance.

**nvm4w PATH entry is a dead symlink:** The PATH contains `/c/nvm4w/nodejs`
(from an old nvm-for-windows installation) and
`/c/Users/jason/AppData/Local/nvm`. Both resolve to empty or nonexistent paths.
These dead PATH entries mean every `PATH` lookup iterates over them before
finding fnm's alias. Minor overhead, not measurable in isolation. Cleanup
opportunity.

**87MB node.exe in aliases/default:** The node binary at
`fnm/aliases/default/node.exe` is 87MB. This is the standard Node.js binary size
— not anomalous. But it means the junction (alias) is pointing directly to the
real installation, not a shim, which is why it's fast on this machine.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

All core measurements are from direct execution on the target machine. The risk
assessment for the second locale is MEDIUM because it cannot be verified without
testing that environment.
