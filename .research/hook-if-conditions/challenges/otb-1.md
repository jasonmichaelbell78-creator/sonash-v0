# OTB Challenge #1: Unconventional Uses of the `if` Field

**Date:** 2026-03-29
**Scope:** Creative, non-obvious applications of Claude Code hook `if` conditions
**Constraint:** All proposals use confirmed `Tool(argument_pattern)` syntax only (no unverified template syntax)

---

## Category 1: Workflow Automation Triggers

### 1A. Build-Success Auto-Preview Deploy

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(npm run build *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/post-build-preview.js $ARGUMENTS",
    "statusMessage": "Checking build for preview deploy..."
  }]
}
```

**What it does:** PostToolUse fires after `npm run build` completes. The script reads `tool_output` from stdin, checks exit code 0 (successful build), then either: (a) triggers `firebase hosting:channel:deploy preview-$BRANCH` automatically, or (b) injects a message like "Build succeeded. Deploy to preview? Run: `firebase hosting:channel:deploy preview-session-NNN`". Could also post to ntfy.sh with the preview URL.

**Value: 7/10** -- Eliminates the "I built it, now I need to remember to deploy preview" friction. Particularly useful in demo-prep sessions where you build repeatedly.

**Feasibility: 8/10** -- PostToolUse provides full tool output. Firebase preview channels are idempotent. The only question is whether `Bash(npm run build *)` matches `npm run build` (no trailing args) -- based on D9-risks, bare `npm run build` without a trailing space+arg may not match `Bash(npm run build *)`. Workaround: use two handlers, one for `Bash(npm run build)` (exact) and one for `Bash(npm run build *)`.

**Why it's interesting:** Turns the `if` field from a passive filter into an active trigger -- the hook exists not to validate or block but to chain a deployment workflow off a successful build. This inverts the typical "guard" mental model.

---

### 1B. Test Result Dashboard Aggregator

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(npm test *)|Bash(npm run test *)|Bash(npx vitest *)|Bash(node --test *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/test-dashboard-collector.js $ARGUMENTS",
    "statusMessage": "Capturing test results..."
  }]
}
```

**What it does:** PostToolUse captures test runner output, parses pass/fail/skip counts and duration, appends to `.claude/state/test-dashboard.jsonl`. Over time this builds a per-session and cross-session test health history. The `/alerts` skill could surface trends like "test count dropped by 12 since last session" or "average test duration increased 40%". Could pair with a PreToolUse companion that timestamps the start for accurate duration measurement.

**Value: 6/10** -- Useful for tracking test health trends but most of this info is available from CI. The real value is the *within-session* trend: "you've run tests 7 times this session and the failure count keeps climbing."

**Feasibility: 9/10** -- This is essentially what D5-B proposed. The `if` pattern is the interesting part -- it scopes the hook so it doesn't fire on the ~95% of Bash calls that aren't test runs.

**Why it's interesting:** Creates an observability layer that operates entirely within the AI's workflow, invisible to CI/CD. The AI can reason about its own test-running patterns.

---

## Category 2: Learning and Self-Improvement Hooks

### 2A. Skill Definition Validator

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(.claude/skills/*)|Edit(.claude/skills/*)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/skill-validator.js $ARGUMENTS",
    "statusMessage": "Validating skill definition..."
  }]
}
```

**What it does:** PostToolUse fires when any skill file is written or edited. The validator checks: (1) SKILL.md has required header fields (Version, Status, Triggers), (2) no duplicate skill names across the directory, (3) file references within the skill actually exist (e.g., companion files mentioned in the skill), (4) trigger patterns don't conflict with existing skills. Returns warnings as `description` in the JSON response, which Claude surfaces inline.

**Value: 8/10** -- With 80+ skills in this project, skill quality drift is a real problem. Catching malformed skills at write time is far cheaper than discovering them when a skill fires and produces garbage.

**Feasibility: 6/10** -- The `if` pattern `Write(.claude/skills/*)` uses a file path, which the research flagged as risky on Windows (D8, D9). The path normalization to POSIX (`/c/Users/...`) might not match `.claude/skills/*` as a relative pattern. Would need live testing. **Mitigation:** put path filtering inside the script, use `if` only as a rough first-pass filter, or use `Write(*.md)` as a broader catch and let the script filter to skill paths.

**Why it's interesting:** This is a meta-quality hook -- it makes the hook/skill ecosystem self-healing. Every time the AI writes a skill, the system validates it before the AI moves on. Prevents the "I created 5 skills this session and 3 are broken" problem.

---

### 2B. Agent Definition Auto-Tester

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(.claude/agents/*)|Edit(.claude/agents/*)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/agent-definition-check.js $ARGUMENTS",
    "statusMessage": "Validating agent definition..."
  }]
}
```

**What it does:** Similar to 2A but for agent YAML files. Validates: (1) required fields (name, model, tools), (2) referenced tools actually exist in the project, (3) system prompt doesn't exceed token budget estimates, (4) no circular agent dependencies (Agent A spawns Agent B spawns Agent A). Could also auto-run a dry-run prompt to verify the agent doesn't immediately error.

**Value: 7/10** -- Agent definitions are harder to validate than skills because they involve tool references and model constraints. Catching a bad agent definition before it's used in a 3-agent team saves significant debugging time.

**Feasibility: 5/10** -- Same Windows path risk as 2A. Additionally, "dry-run" testing of agents is complex and might not be achievable in a PostToolUse hook's time budget. Static validation (schema check, reference resolution) is straightforward.

**Why it's interesting:** Creates a compile-time-equivalent check for agent definitions, which are normally only validated at runtime when they fail spectacularly.

---

### 2C. Pattern Learning from Corrections

**Hook config:**
```json
{
  "matcher": "^(?i)(edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Edit(.claude/hooks/*)|Edit(.claude/settings.json)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/hook-change-learner.js $ARGUMENTS",
    "statusMessage": "Recording hook system change..."
  }]
}
```

**What it does:** Every time a hook script or the settings.json is modified, the script diffs the change and appends a structured entry to `.claude/state/hook-evolution-log.jsonl`. Over time this builds a changelog of WHY hooks were changed. At session-end, the `/session-end` skill could summarize: "3 hook modifications this session: 2 were bug fixes (false positive rates), 1 was a new feature." This creates a feedback loop where the system learns which hooks are unstable.

**Value: 7/10** -- Hooks are infrastructure that evolves silently. Without a changelog, it's impossible to know whether a hook was changed once (stable) or 15 times (unstable and needs redesign).

**Feasibility: 8/10** -- The `if` scoping is clean (Bash command matching for `Edit(.claude/hooks/*)` is a path pattern but the research says these work if POSIX-normalized). The script just needs to diff the old vs new content and log the delta.

**Why it's interesting:** Turns the hook system into a self-documenting, self-observing organism. The system records its own evolution.

---

## Category 3: Context Window Management

### 3A. Large File Read Warning (Pre-Read Gate)

**Hook config:**
```json
{
  "matcher": "^(?i)read$",
  "hooks": [{
    "type": "command",
    "if": "Read(*.jsonl)|Read(*.log)|Read(*.csv)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/large-file-gate.js $ARGUMENTS",
    "statusMessage": "Checking file size..."
  }]
}
```

**What it does:** PreToolUse fires BEFORE the Read happens. The script checks the target file's size (`fs.statSync`). If the file exceeds a threshold (e.g., 500KB / ~10K lines), it returns `{ "decision": "block", "reason": "File is 2.3MB (~47K lines). Use offset/limit params or Grep to find specific content. Full read would consume ~15% of context window." }`. This prevents the AI from accidentally ingesting massive JSONL or log files.

**Value: 9/10** -- Context exhaustion from reading large data files is one of the most common failure modes in long sessions. This addresses it proactively. The `if` scoping to `.jsonl`, `.log`, `.csv` is the key insight -- you don't want this firing on every `.ts` file (which are almost always small enough), only on data files that tend to be unbounded.

**Feasibility: 7/10** -- PreToolUse can block with `decision: block`. The file path is available in `tool_input.file_path`. The main risk is the Windows path pattern matching issue, but since `.jsonl`/`.log`/`.csv` extensions don't involve directory paths, the glob should work. The `if` pattern could also be broadened to catch all reads and let the script do extension filtering internally -- but then you lose the spawn optimization for the 90% of reads that target normal source files.

**Why it's interesting:** This is one of the few cases where `if` on a Read tool serves a genuinely different purpose than internal script filtering. The ENTIRE POINT is to prevent the Read from happening -- you can't do that from a PostToolUse hook because the context damage is already done. PreToolUse + `if` creates a surgical, low-overhead gate that only fires on high-risk file types.

---

### 3B. Context Budget Fence for Exploration Spirals

**Hook config:**
```json
{
  "matcher": "^(?i)(read|grep|glob)$",
  "hooks": [{
    "type": "command",
    "if": "Read(node_modules/*)|Grep(node_modules/*)|Glob(node_modules/*)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/exploration-fence.js $ARGUMENTS",
    "statusMessage": "Checking exploration scope..."
  }]
}
```

**What it does:** PreToolUse gate that blocks reads/searches inside `node_modules/`, `.next/`, `out/`, and other generated directories. Returns a block decision with a message like "Reading node_modules directly wastes context. Use `npm ls <package>` to check versions or read the package's published docs instead." Could have a configurable allowlist for known-needed cases.

**Value: 8/10** -- AI agents frequently spiral into `node_modules` when debugging import issues. Each read consumes context without providing actionable information. Blocking this pattern forces more efficient investigation strategies.

**Feasibility: 6/10** -- The pattern `Read(node_modules/*)` may or may not work depending on whether the `if` field matches against the full absolute path or the argument as passed. If Claude passes `node_modules/react/package.json`, the pattern matches. If Claude passes `/c/Users/jason/Workspace/dev-projects/sonash-v0/node_modules/react/package.json`, it might not match `node_modules/*`. Needs testing. A broader `Read(*node_modules*)` might work but could have false positives.

**Why it's interesting:** Uses `if` as a behavioral constraint on the AI itself -- not validating output but constraining input. This is a fundamentally different use case from all existing hooks, which focus on what the AI produces rather than what it consumes.

---

### 3C. Cascading Context Alerts via Read Frequency

**Hook config (PostToolUse):**
```json
{
  "matcher": "^(?i)read$",
  "hooks": [{
    "type": "command",
    "if": "Read(*.md)|Read(*.ts)|Read(*.tsx)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/read-frequency-tracker.js $ARGUMENTS",
    "statusMessage": "Tracking read patterns...",
    "continueOnError": true
  }]
}
```

**What it does:** PostToolUse tracks which files are read and how often. The script maintains a rolling count in `.claude/state/read-heatmap.json`. When a file has been read 3+ times in the same session, it warns: "You've read `lib/firestore-service.ts` 4 times this session. Consider keeping its contents in working memory or extracting the specific function you need." This catches the AI re-reading the same large files repeatedly -- a classic context waste pattern.

**Value: 8/10** -- Re-reading is one of the largest hidden context costs. The AI reads a file, does some work, then reads the same file again because it lost track. A hook that surfaces this pattern lets the AI self-correct.

**Feasibility: 8/10** -- PostToolUse provides the file path. Writing a frequency counter is trivial. The `if` scoping to source/doc files (not JSONL/state files which are expected to be re-read) is the key design choice. The main overhead concern is that this fires on every source file read, but the script can bail out in <5ms if the count is below threshold.

**Why it's interesting:** Builds a "spatial awareness" layer for the AI's own behavior. The hook system becomes a mirror reflecting the AI's habits back to it.

---

## Category 4: Collaboration and Session Management

### 4A. Auto-Commit Session Context on Write

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(SESSION_CONTEXT.md)|Edit(SESSION_CONTEXT.md)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/session-context-sync.js $ARGUMENTS",
    "statusMessage": "Syncing session context..."
  }]
}
```

**What it does:** PostToolUse fires when SESSION_CONTEXT.md is updated. The script: (1) validates the file still has required sections (Current Sprint, Recent Sessions, Active Branches), (2) runs `git add SESSION_CONTEXT.md && git commit -m "chore: auto-sync session context"` silently, (3) optionally pushes to remote if the user has pre-authorized auto-push for context files. This ensures the other locale always has the latest session context without the user remembering to commit it.

**Value: 8/10** -- Cross-locale context sync is a real pain point (documented in `project_cross_locale_config.md`). The user works at HOME, updates session context, forgets to push, then starts at WORK the next day with stale context. Auto-commit eliminates the forget-to-commit step.

**Feasibility: 7/10** -- The file path pattern `Write(SESSION_CONTEXT.md)` or `Edit(SESSION_CONTEXT.md)` should work as a project-root-relative pattern. The git commit is straightforward. The risk is that CLAUDE.md guardrail #7 says "Never push to remote without explicit approval" -- so the auto-push part requires pre-authorization. Auto-commit alone is fine per the guardrails.

**Why it's interesting:** Creates a "living document" that stays synchronized across locales without manual intervention. The `if` condition turns a specific file into a trigger -- it's not guarding against bad writes, it's using the write as a signal to propagate state.

---

### 4B. ROADMAP.md Change Impact Analysis

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(ROADMAP.md)|Edit(ROADMAP.md)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/roadmap-change-analyzer.js $ARGUMENTS",
    "statusMessage": "Analyzing roadmap impact..."
  }]
}
```

**What it does:** PostToolUse fires when the roadmap changes. The script diffs the before/after (via `git show HEAD:ROADMAP.md` vs. the new content), identifies: (1) moved items (phase reordering), (2) removed items (scope cuts -- flag these prominently), (3) new items (scope additions), (4) status changes (PLANNED -> IN_PROGRESS, etc.). Returns a summary as the hook's `description` field, which Claude surfaces inline: "Roadmap change: 2 items moved to later phase, 1 item removed (DEBT-00234 deferred), 3 new items added."

**Value: 7/10** -- Roadmap drift is invisible. Small edits accumulate into significant scope changes that nobody notices until a sprint review. Making every change visible forces conscious acknowledgment.

**Feasibility: 7/10** -- Git diff parsing is well-understood. The main complexity is semantic diffing (understanding that a line moved vs. was deleted and re-added). For a first version, a simple line-level diff with categorization would be sufficient.

**Why it's interesting:** Transforms a passive document into an actively monitored artifact. The `if` field means this analysis only fires on the 1-2 roadmap edits per session, not on the hundreds of other writes.

---

### 4C. Decision Log Auto-Capture from Key File Edits

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(CLAUDE.md)|Edit(CLAUDE.md)|Write(.claude/settings.json)|Edit(.claude/settings.json)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/governance-change-logger.js $ARGUMENTS",
    "statusMessage": "Logging governance change..."
  }]
}
```

**What it does:** Fires when the AI modifies its own governing documents (CLAUDE.md, settings.json). The script logs the diff, the current conversation context (what was being discussed), and a timestamp to `.claude/state/governance-changes.jsonl`. This creates an audit trail of WHY governance documents changed, not just that they did. The `/pr-retro` skill can then surface: "This session modified CLAUDE.md 3 times: added guardrail #15, updated stack versions, removed deprecated pattern."

**Value: 9/10** -- Governance documents control AI behavior. Changes to them without audit trails are a risk vector. This is the AI equivalent of logging `sudoers` file changes.

**Feasibility: 8/10** -- The `if` patterns are simple file matches. CLAUDE.md and settings.json are root-level files with predictable paths. The script just needs to capture the diff and context.

**Why it's interesting:** This is a "quis custodiet ipsos custodes" hook -- it watches the watchers. The AI is governed by CLAUDE.md and settings.json, and this hook ensures that changes to those files are never silent.

---

## Category 5: Debug and Monitoring

### 5A. Dev Server Lifecycle Tracker

**Hook config (Pre and Post):**
```json
// PreToolUse
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(npm run dev *)|Bash(npx next dev *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/dev-server-tracker.js $ARGUMENTS",
    "statusMessage": "Tracking dev server start..."
  }]
}
```

**What it does:** Tracks dev server starts with timestamps, port numbers, and which features were being developed at the time. PostToolUse variant captures whether the server started successfully or errored. Over sessions, this builds a "development activity log" showing when and how often dev servers are started, which correlates with active development phases.

**Value: 4/10** -- This is more "interesting telemetry" than actionable. The main use case is detecting patterns like "you start the dev server 6 times per session because it keeps crashing" -- which could prompt investigation into the crash cause.

**Feasibility: 9/10** -- `Bash(npm run dev *)` is a clean pattern. The script is trivial.

**Why it's interesting:** The `if` field here creates a specialized "probe" that only fires on infrastructure commands. The broader pattern is: you can create cheap, targeted observers for any specific command family without global overhead.

---

### 5B. Firebase Emulator Usage Tracker

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(firebase emulators *)|Bash(npx firebase emulators *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/emulator-tracker.js $ARGUMENTS",
    "statusMessage": "Tracking emulator usage..."
  }]
}
```

**What it does:** Tracks emulator starts/stops, which emulators are used (auth, firestore, functions, hosting), and correlates with what the AI was working on. Could also check whether the emulators were started before the AI runs functions tests -- PreToolUse on `Bash(npm test *)` could cross-reference whether emulators are running and warn if not.

**Value: 5/10** -- Niche but useful for this specific project. The cross-reference with test runs ("you're running Cloud Functions tests without emulators") is the real value.

**Feasibility: 8/10** -- Pattern matching is clean. Checking emulator state requires `lsof` or port checking, which is platform-dependent but doable.

**Why it's interesting:** Demonstrates cross-hook correlation -- one hook records state (emulators running), another hook consumes it (test runner checks for emulators). The `if` field enables these to be cheap, targeted probes.

---

### 5C. Error Pattern Detector (PostToolUseFailure)

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(npm *)|Bash(npx *)|Bash(node *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/error-pattern-detector.js $ARGUMENTS",
    "statusMessage": "Analyzing failure pattern..."
  }]
}
```

**What it does:** PostToolUseFailure fires only when a tool call fails. Scoped to npm/npx/node commands, the script parses the error output for common patterns: `MODULE_NOT_FOUND`, `ENOENT`, `SyntaxError`, `TypeError`, `EADDRINUSE`, OOM signals. It logs the pattern to `.claude/state/error-patterns.jsonl` and returns a diagnostic hint: "This MODULE_NOT_FOUND error for `@radix-ui/react-slot` usually means you need `npm install`. This is the 3rd MODULE_NOT_FOUND this session -- consider running `npm ci` to reset all deps."

**Value: 8/10** -- PostToolUseFailure is an underused event. Scoping it with `if` to Node ecosystem commands means you get targeted diagnostics without spawning on every failed `ls` or `grep`.

**Feasibility: 8/10** -- PostToolUseFailure works like PostToolUse with the same `if` support. Error pattern matching is well-understood.

**Why it's interesting:** PostToolUseFailure is the Cinderella of hook events -- nobody uses it. The `if` field makes it practical by scoping to the failure types you care about. Without `if`, you'd spawn the hook on every tool failure including benign ones (grep with no matches, ls on a nonexistent dir).

---

## Category 6: Meta-Hooks (Self-Modifying System)

### 6A. Settings.json Change Validator (The Guardian Hook)

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(.claude/settings.json)|Edit(.claude/settings.json)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/settings-validator.js $ARGUMENTS",
    "statusMessage": "Validating hook configuration..."
  }]
}
```

**What it does:** PostToolUse fires after settings.json is modified. The script: (1) parses the new JSON (catches syntax errors before they break all hooks), (2) validates that all `command` paths reference scripts that actually exist, (3) checks that no `if` field is used on non-tool events (the "silent death" anti-pattern from D9), (4) validates that `matcher` and `if` patterns are logically consistent (no `matcher: "Bash"` with `if: "Edit(*.ts)"`), (5) checks that security-critical hooks (block-push-to-main, pre-commit-compliance) still exist and haven't been removed. Returns warnings or blocks if critical hooks are missing.

**Value: 10/10** -- This is the single most valuable unconventional use. A broken settings.json disables ALL hooks silently. A missing security hook creates a silent security gap. This hook is the immune system for the hook system itself.

**Feasibility: 7/10** -- JSON validation and path checking are trivial. The `if` pattern for settings.json should work as a root-relative match. The recursive concern -- "what if this hook's own validation breaks?" -- is mitigated by `continueOnError: true` on this hook specifically, so a bug in the validator doesn't cascade. The script must be careful to read the NEW file content (from `tool_input` or the filesystem) rather than the old version.

**Why it's interesting:** This is a genuine meta-hook -- a hook that validates the hook system. It creates a self-healing property: the system cannot silently lose its own safety mechanisms because any change to the mechanism configuration is validated. This is the `if` field's deepest potential -- turning the hook system from a collection of independent scripts into a coherent, self-aware system.

---

### 6B. Hook Script Integrity Monitor

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(.claude/hooks/*)|Edit(.claude/hooks/*)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/hook-integrity-check.js $ARGUMENTS",
    "statusMessage": "Checking hook integrity..."
  }]
}
```

**What it does:** Fires when any hook script is modified. Validates: (1) the script still handles stdin JSON parsing (all hooks receive tool data via stdin), (2) the script still outputs valid JSON to stdout, (3) security-critical hooks still contain their enforcement logic (e.g., `block-push-to-main.js` still checks for `main` and `master` branch names), (4) the script doesn't introduce the anti-patterns from CODE_PATTERNS.md (raw error.message, missing try/catch on file reads). Could even run the script with a mock stdin to verify it doesn't crash.

**Value: 8/10** -- Hooks are modified frequently (the research found 3 hooks were modified in the preceding session alone). A regression in a hook script is silent until the hook's trigger fires and it fails.

**Feasibility: 7/10** -- Static analysis of JS files is straightforward (regex for required patterns). Mock execution is more complex but achievable with synthetic stdin. The Windows path concern applies to `Edit(.claude/hooks/*)` but the alternative is putting this inside the post-write-validator monolith (which already fires on all writes).

**Why it's interesting:** Combined with 6A, this creates a two-layer immune system: 6A validates the configuration (settings.json), 6B validates the implementations (hook scripts). Together they ensure the hook system's structural integrity at both layers.

---

### 6C. Permission Rule Drift Detector

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(.claude/settings.json)|Edit(.claude/settings.json)|Write(.claude/settings.local.json)|Edit(.claude/settings.local.json)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/permission-drift-detector.js $ARGUMENTS",
    "statusMessage": "Checking permission changes..."
  }]
}
```

**What it does:** Specifically tracks changes to the `permissions.allow` and `permissions.deny` arrays. Diffs old vs new, flags: (1) new allow rules that weaken security posture (e.g., adding `Bash(rm -rf *)` to allow), (2) removed deny rules (e.g., removing `Bash(git push --force *)`), (3) overly broad patterns (e.g., `Bash(*)` already exists -- adding `Bash(npm *)` is redundant). Logs to `.claude/state/permission-changes.jsonl` for audit trail.

**Value: 7/10** -- Permission drift is a real risk in projects with multiple config files and locales. The `settings.local.json` at this project already has locale-specific permissions that could drift.

**Feasibility: 8/10** -- JSON diffing is straightforward. Permission rule parsing is well-defined.

**Why it's interesting:** This watches the access control layer, not the hook layer. It's a separate dimension of self-monitoring -- ensuring the AI's permission boundaries don't silently expand.

---

## Category 7: Cost and Resource Tracking

### 7A. Hot-File Index Builder

**Hook config:**
```json
{
  "matcher": "^(?i)read$",
  "hooks": [{
    "type": "command",
    "if": "Read(*.ts)|Read(*.tsx)|Read(*.js)|Read(*.md)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/hot-file-indexer.js $ARGUMENTS",
    "statusMessage": "Indexing file access...",
    "continueOnError": true
  }]
}
```

**What it does:** PostToolUse records every source file read with timestamp, session ID, and byte count. Maintains a rolling "hot file" index in `.claude/state/file-heatmap.json` with decay (recent reads weighted higher). Surfaces insights like: "Top 5 files by access this session: (1) lib/firestore-service.ts (7 reads, 3.2K lines), (2) types/journal.ts (5 reads, 800 lines), (3)..." This data feeds into: (a) session-start preloading recommendations ("these files are always read first -- consider a startup hook that summarizes them"), (b) refactoring signals ("if a file is read 15 times per session, it might be too large or poorly organized").

**Value: 7/10** -- The hot-file data is genuinely useful for understanding where developer/AI attention concentrates. The refactoring signal is the hidden gem: files that are read excessively are often too complex.

**Feasibility: 8/10** -- This is a superset of what the existing `post-read-handler.js` (P12) already does for context tracking. Could be an extension of that hook rather than a new one. The `if` scoping to source/doc files avoids tracking reads of state files, JSONL logs, etc.

**Why it's interesting:** Transforms passive file access into an active intelligence signal. Over time, the heatmap reveals the architecture's actual center of gravity -- which is often not where you think it is.

---

### 7B. Write Amplification Tracker

**Hook config:**
```json
{
  "matcher": "^(?i)(write|edit|multiedit)$",
  "hooks": [{
    "type": "command",
    "if": "Write(*.ts)|Write(*.tsx)|Edit(*.ts)|Edit(*.tsx)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/write-amplification-tracker.js $ARGUMENTS",
    "statusMessage": "Tracking write patterns...",
    "continueOnError": true
  }]
}
```

**What it does:** Tracks how many times each file is written/edited per session and the size of each change. "Write amplification" is when the AI edits the same file many times in rapid succession -- often a sign of trial-and-error coding rather than deliberate implementation. The script flags: "You've edited `components/Dashboard.tsx` 8 times in the last 15 minutes. Consider stepping back to plan the changes before continuing." Also tracks the "edit radius" -- how many distinct files are touched per logical task -- which correlates with change risk.

**Value: 7/10** -- Write amplification is a strong signal for "the AI is struggling." Surfacing this in real-time lets the user intervene before the AI burns 20 minutes on trial-and-error. The `if` scoping to TypeScript files is deliberate -- you don't want this firing on config/state file writes which are expected to be frequent.

**Feasibility: 9/10** -- Simple counter with timestamp windowing. The `if` pattern for `Edit(*.ts)` carries the Windows path risk but could fallback to internal filtering.

**Why it's interesting:** This is behavioral self-monitoring through a resource lens. The system infers the AI's cognitive state (struggling vs. deliberate) from observable write patterns. This is a genuinely novel application.

---

### 7C. Session Cost Estimator

**Hook config:**
```json
{
  "matcher": "^(task|Task|TASK|agent|Agent|AGENT)$",
  "hooks": [{
    "type": "command",
    "if": "Agent(*)|Task(*)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/agent-cost-estimator.js $ARGUMENTS",
    "statusMessage": "Estimating agent cost...",
    "continueOnError": true
  }]
}
```

**What it does:** PreToolUse fires before spawning subagents. The script estimates the token cost of the agent invocation based on: (1) the agent's model (from its YAML definition), (2) typical token usage from historical `agent-invocations.jsonl` data for this agent type, (3) the prompt length. Returns an advisory: "Estimated cost for `code-reviewer` agent: ~45K tokens ($0.08). 3 agents already spawned this session (total: ~120K tokens). Proceed?" Does NOT block, but surfaces cost awareness.

**Value: 6/10** -- Token costs are real but hard to predict accurately. The estimate would be rough. The value is more in awareness ("you've spawned 8 agents this session") than precise accounting.

**Feasibility: 6/10** -- The `if: "Agent(*)|Task(*)"` pattern would need to match against the prompt/task description. Whether `Agent(*)` matches all Agent tool calls regardless of prompt content is unclear -- `*` might need to match a specific substring. Also, the pipe OR syntax in `if` is unconfirmed per the research. Safer: use the existing `matcher` without an `if` (the matcher already scopes to Agent/Task tools) and do estimation logic internally.

**Why it's interesting:** Applies the `if` field to the Agent/Task tool type, which is unexplored territory. The concept of "cost gates" before expensive operations is analogous to cloud cost management alerts.

---

## Category 8: Truly Unconventional

### 8A. Conversation Tone Detector via Bash Output

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(git log *)|Bash(git diff *)|Bash(git status *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/git-state-narrator.js $ARGUMENTS",
    "statusMessage": "Analyzing git state...",
    "continueOnError": true
  }]
}
```

**What it does:** PostToolUse fires after git status/log/diff commands. Instead of just tracking data, the script synthesizes the git state into a narrative hint for the AI: "Git state: 14 files changed, 3 untracked, on branch `feat/new-widget` (12 commits ahead of main). Complexity signal: HIGH -- consider committing in smaller chunks." The `if` scoping means this only fires on git inspection commands (not git mutations, not other Bash calls), creating a targeted "git awareness" layer.

**Value: 5/10** -- The narrative is nice but the AI already sees the git output. The real value is the synthesized complexity signal, which requires counting and comparing across the raw output.

**Feasibility: 9/10** -- Parsing git output is well-understood. The `if` patterns are clean Bash command matches.

**Why it's interesting:** Uses PostToolUse not to validate or track, but to AUGMENT the AI's understanding. The hook adds information that wasn't in the original tool output -- a "commentary track" on git operations.

---

### 8B. Dependency Graph Poison Detector

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(npm install *)|Bash(npm i *)|Bash(npx *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/dep-safety-check.js $ARGUMENTS",
    "statusMessage": "Checking dependency safety..."
  }]
}
```

**What it does:** PreToolUse fires before `npm install` or `npx` commands. The script: (1) extracts the package name from the command, (2) checks it against a known-malicious package list (could be a local blocklist or an API call to Socket.dev/npm advisories), (3) checks for typosquatting against the project's existing dependencies (Levenshtein distance < 2 from an existing dep = suspicious), (4) warns if the package has no README, <10 weekly downloads, or was published in the last 7 days. Could block with `decision: block` for known-malicious packages.

**Value: 8/10** -- Supply chain attacks via npm are a real and growing threat. The AI adding a dependency based on a web search recommendation without vetting is a realistic attack vector. The typosquatting check alone (e.g., the AI types `npm install loadash` instead of `lodash`) is high-value.

**Feasibility: 6/10** -- Local blocklist checking is trivial. API calls to Socket.dev add latency and require credentials. Typosquatting detection via Levenshtein is fast. The `if` patterns for `Bash(npm install *)` and `Bash(npm i *)` are clean. The `Bash(npx *)` pattern catches arbitrary package execution, which is the highest-risk case.

**Why it's interesting:** This is a supply chain security gate that operates at the point of maximum leverage -- before the dependency enters the project. No CI pipeline catches `npx malicious-package` because npx runs without installation. This is the AI equivalent of a corporate firewall's URL filter.

---

### 8C. "Time Travel" Context Restorer

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(git checkout *)|Bash(git switch *)|Bash(git stash pop *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/branch-context-restorer.js $ARGUMENTS",
    "statusMessage": "Restoring branch context..."
  }]
}
```

**What it does:** PostToolUse fires after branch switches. The script: (1) identifies the new branch, (2) looks up `.claude/state/branch-contexts.json` for saved context about that branch (what was being worked on, key decisions made, known issues), (3) injects a context restoration message: "Switched to `feat/auth-refactor`. Last worked on 2026-03-27. Context: Refactoring auth flow to use session cookies. Known issue: CORS headers not set for cookie domain. Key file: `lib/auth-service.ts`." This gives the AI instant context about a branch it may not have worked on in days.

**Value: 9/10** -- Branch context loss is one of the most expensive friction points in multi-branch workflows. The AI switches to a branch and has to re-discover what was happening. This hook pre-loads that context.

**Feasibility: 7/10** -- The `if` patterns are clean Bash command matches. The context storage/retrieval is straightforward. The tricky part is populating the branch context in the first place -- it would need a companion hook on commits or session-end that saves context for the current branch. The `compact-restore.js` hook already does something similar for compaction recovery.

**Why it's interesting:** This is "muscle memory" for the AI. The `if` field on branch-switch commands creates a surgical trigger that fires at exactly the moment context restoration is most valuable. It's a temporal pattern -- the hook fires at a state transition (branch A -> branch B), not at a steady-state operation.

---

### 8D. The "Groundhog Day" Detector

**Hook config:**
```json
{
  "matcher": "^(?i)bash$",
  "hooks": [{
    "type": "command",
    "if": "Bash(npm run build *)|Bash(npm test *)|Bash(npx tsc *)",
    "command": "bash .claude/hooks/ensure-fnm.sh node .claude/hooks/loop-detector.js $ARGUMENTS",
    "statusMessage": "Checking for repeated failures...",
    "continueOnError": true
  }]
}
```

**What it does:** PostToolUseFailure fires on failed build/test/typecheck commands. The script hashes the error output and compares against a rolling window of recent failures. If the same error (or a highly similar error) has occurred 3+ times, it returns: "LOOP DETECTED: This is the 4th time `npm run build` has failed with the same `TS2345` error in `lib/firestore-service.ts:142`. The previous 3 attempts all modified lines 140-145 without resolving it. Consider: (a) reading the TypeScript docs for this error, (b) asking the user for guidance, (c) trying a fundamentally different approach." This directly addresses the "AI retry loop" anti-pattern.

**Value: 10/10** -- Retry loops are the single most expensive AI failure mode. The AI makes the same mistake 5-10 times before trying something different. A hook that detects the loop and intervenes is transformative.

**Feasibility: 7/10** -- Error hashing (fuzzy, ignoring line numbers) is achievable. The challenge is defining "same error" with enough precision to avoid false positives but enough fuzziness to catch variations. The `if` scoping to build/test/typecheck commands is smart -- these are the commands most prone to retry loops.

**Why it's interesting:** This is the most powerful unconventional use on this list. It uses PostToolUseFailure (the least-used event) with `if` scoping (to limit to high-value failure types) to create a behavioral circuit breaker. The hook system becomes a cognitive safety net -- it prevents the AI from wasting resources on unproductive loops. This is genuinely novel and I haven't seen it proposed anywhere.

---

## Summary: Top 5 by Combined Value x Feasibility

| Rank | Idea | Value | Feasibility | V x F | Category |
|------|------|-------|-------------|-------|----------|
| 1 | 6A. Settings.json Guardian Hook | 10 | 7 | 70 | Meta-hooks |
| 2 | 8D. Groundhog Day Loop Detector | 10 | 7 | 70 | Unconventional |
| 3 | 3A. Large File Read Warning | 9 | 7 | 63 | Context mgmt |
| 4 | 4C. Governance Change Logger | 9 | 8 | 72 | Collaboration |
| 5 | 8C. Branch Context Restorer | 9 | 7 | 63 | Unconventional |

**Honorable mentions:** 8B Dependency Poison Detector (high value but API dependency lowers feasibility), 5C PostToolUseFailure Error Pattern Detector (uses the most underexploited event type), 7B Write Amplification Tracker (behavioral self-monitoring is a genuinely new paradigm).

---

## Key Insight

The research output focused on `if` as a **performance optimization** -- reducing unnecessary spawns. That is its primary documented purpose. But the unconventional uses above reveal a second, potentially more valuable purpose: **`if` as a semantic router**.

When you attach `if: "Bash(git checkout *)"` to a PostToolUse hook, you're not just filtering for performance. You're saying "this hook exists to respond to branch switches." The `if` field becomes a declarative event subscription -- it turns the flat hook system into something resembling an event-driven architecture where hooks subscribe to specific semantic events (branch switch, build completion, test failure, governance change) rather than raw tool invocations.

This reframing suggests a design principle: **design hooks around semantic events, not tool names.** Instead of "this hook fires on Bash calls," think "this hook fires on dependency changes" (`Bash(npm install *)|Bash(npm i *)`). The `if` field is what bridges the gap between "tool invocation" (mechanical) and "meaningful event" (semantic).

The compound command bypass risk (D9) means this semantic routing is imperfect -- `git checkout main && npm install lodash` fires neither the branch-switch hook nor the dependency hook. But for advisory/observability hooks (as opposed to security gates), ~95% detection rate is more than sufficient to provide value.
