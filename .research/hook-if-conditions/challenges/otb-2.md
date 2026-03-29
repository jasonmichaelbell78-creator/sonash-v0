# OTB Challenge 2: The `if` Field as an Architectural Pattern

**Challenger:** OTB thinker
**Date:** 2026-03-29
**Scope:** Beyond individual hook optimization — what does `if` mean for hook
system design at the architectural level?

---

## 1. Event-Driven Micro-Hook Architecture

### The Pattern

The current system has 17 project hooks and 4 user hooks. Several are monoliths
(post-write-validator.js runs 10 validators; user-prompt-handler.js runs 6
analyses). This consolidation was an explicit design decision: on Windows, every
hook spawn costs ~234ms through `ensure-fnm.sh`, so fewer spawns = less overhead.
The monolith is a performance optimization that trades modularity for speed.

`if` conditions invert that trade-off. If a hook can be skipped before the
process spawns, the spawn cost drops to zero for non-matching calls. This means
the original argument for consolidation weakens: 10 separate hooks that each
fire on 5% of writes (via precise `if` conditions) spawn fewer total processes
than 1 monolith that fires on 100% of writes.

A micro-hook architecture would look like:

```
PostToolUse:
  if: "Write(firestore.rules)|Edit(firestore.rules)"  -> firestore-rules-guard.js
  if: "Write(storage.rules)|Edit(storage.rules)"       -> storage-rules-guard.js
  if: "Write(.env*)|Edit(.env*)"                       -> env-file-guard.js
  if: "Write(firebase.json)|Edit(firebase.json)"       -> firebase-config-guard.js
  if: "Write(*.test.ts)|Edit(*.test.ts)"               -> test-file-validator.js
  if: "Write(*.tsx)|Edit(*.tsx)"                        -> component-size-check.js
  if: "Edit(package.json)|Write(package.json)"         -> dep-diff-alert.js
  ...and so on for each concern
```

### Design Principles for Micro-Hooks

1. **Single Responsibility:** Each hook does exactly one check. No bail-out
   chains, no `isJsTsFile` guards, no dead `isConfigFile` variables.
2. **Pattern-as-documentation:** The `if` field in settings.json IS the
   specification of what the hook cares about. You can read the config and
   understand the system without opening any script.
3. **Independent deployment:** Add, remove, or disable individual checks without
   touching other hooks.
4. **Composable testing:** Each hook can be unit-tested by providing a mock tool
   call that matches its `if` pattern.

### Implications

**Advantages:**
- Eliminates dead code paths (the `isConfigFile` / `isMarkdownFile` computed-
  but-never-used variables in post-write-validator.js are symptoms of monolith
  decay).
- Failures are isolated. A bug in the JSON validator cannot crash the TypeScript
  strict check.
- Easier to reason about — the settings.json config becomes a readable manifest
  of all automated checks and their trigger conditions.
- New contributors (or new AI models) can understand the hook system by reading
  the config alone.

**Disadvantages:**
- **The fundamental math does not work on Windows with ensure-fnm.sh.** This is
  the critical blocker. At 234ms per spawn, 10 micro-hooks that each fire 5% of
  the time (50% combined hit rate) still spawn 5 processes per write on average
  — 1,170ms. The monolith spawns once at 234ms. The micro-hook architecture is
  5x slower even with `if` conditions, because `if` filters are per-handler, not
  per-group. Every handler whose `if` pattern matches spawns independently.
- BUT: if `ensure-fnm.sh` is replaced with the lean wrapper (P1 recommendation,
  ~5ms per spawn), 10 micro-hooks at 50% combined rate = 25ms vs. monolith at
  5ms. The overhead becomes negligible and the architectural benefits dominate.
- File-path `if` patterns (`Edit(*.ts)`, `Write(src/**)`) are HIGH risk on
  Windows due to backslash normalization issues (D9-risks, D8-locale). This
  directly undermines the micro-hook pattern, which depends heavily on file-path
  matching.
- More entries in settings.json = more maintenance surface. A 50-hook config
  is harder to audit than a 17-hook config.

### Verdict for This Project

**Not yet, but worth planning for.** The micro-hook architecture becomes viable
when two prerequisites are met: (1) `ensure-fnm.sh` is replaced with the lean
wrapper (dropping spawn cost to ~5ms), and (2) Windows file-path `if` patterns
are confirmed reliable (or the project commits to Bash-command-only `if`
patterns). If both conditions hold, decomposing post-write-validator.js into
5-7 focused micro-hooks would be a clean refactor with measurable benefits in
readability, testability, and fault isolation.

**Migration path:** Don't decompose the monolith all at once. Add new checks as
micro-hooks with `if` conditions. Leave the existing monolith validators in
place until the lean wrapper is proven. Over time, extract validators one-by-one
into standalone hooks, deleting the monolith's internal dispatch for each
extracted concern. This avoids a big-bang refactor and lets each extraction be
independently validated.

---

## 2. Hook Composition Patterns — Pipelines via `if` Chains

### The Pattern

Complex behaviors can be expressed as sequences of `if`-conditioned hooks across
different events, forming implicit pipelines. The "security pipeline" example
from the prompt:

```
PreToolUse:  if: "Write(firestore.rules)"  -> require-confirmation.js
PostToolUse: if: "Write(firestore.rules)"  -> validate-rules-content.js
PostToolUse: if: "Bash(firebase deploy *)" -> verify-rules-validated-first.js
```

This is a **stateful pipeline**: step 3 needs to know whether step 2 ran
successfully. The hooks share no built-in state mechanism, but they CAN
communicate through the filesystem. Step 2 writes a timestamp to
`.claude/state/rules-validated.json`; step 3 reads it and checks recency.

More general composition patterns:

**Gate-then-Track:** PreToolUse blocks dangerous operations; PostToolUse logs
everything that passed the gate. Already partially implemented (P6 blocks push
to main; P14 tracks commits).

**Validate-then-Alert:** PostToolUse validates file content; if validation
fails, a secondary check alerts about the broader impact. Example: JSON
validator detects invalid syntax -> config-change-alerter notifies about which
systems depend on that config.

**Prepare-then-Execute-then-Verify:** PreToolUse sets up context (writes a
checkpoint); the tool runs; PostToolUse verifies the expected outcome. Example:
pre-deploy writes the expected rules hash, deploy runs, post-deploy verifies the
deployed rules match.

### Implications

**Advantages:**
- Complex safety behaviors emerge from simple, independently testable hooks.
- Each hook in the pipeline can be enabled/disabled independently — you can run
  the validator without the gate, or the tracker without the validator.
- The filesystem-as-state pattern (`.claude/state/*.json`) is already established
  in this project (hook-runs.jsonl, commit-log.jsonl, etc.).

**Disadvantages:**
- **Implicit coupling is invisible coupling.** The pipeline exists in the
  developer's head, not in any configuration. Settings.json shows individual
  hooks; nothing declares "these three hooks form the security pipeline."
  A future maintainer who removes `validate-rules-content.js` has no indication
  they've broken `verify-rules-validated-first.js`.
- **Race conditions.** PostToolUse hooks fire in order but are non-blocking by
  default (unless they exit non-zero). If step 2 is slow and step 3 fires on a
  different tool call, the state file may not exist yet.
- **No guaranteed ordering across events.** PreToolUse and PostToolUse are
  ordered within their event type, but there is no mechanism to guarantee a
  PreToolUse hook completes before a PostToolUse hook from a different matcher
  group fires on an interleaved tool call.
- **Error propagation is manual.** If step 2 fails, step 3 has no way to know
  except by reading the absence of the state file. Negative signals (something
  did NOT happen) are harder to detect than positive signals.

### Verdict for This Project

**Use sparingly, document explicitly.** The Gate-then-Track pattern (PreToolUse
blocks, PostToolUse logs) is already proven and should be the default composition
model. For multi-step pipelines like the Firestore rules example, implement them
but add a `HOOK_PIPELINES.md` or a comment block in settings.json that declares
the pipeline membership. The stateful filesystem approach works because this
project already uses `.claude/state/` extensively, but each pipeline should
document its state contract (what files, what schema, what staleness window).

**Concrete recommendation:** Implement the Firestore rules pipeline (HOOK-D5-C
from the research output) as the first multi-step composition. It is the
highest-value security hook and naturally decomposes into validate + verify.
Use it as the template for future pipelines.

---

## 3. The `if` Field as a Domain Routing Layer

### The Pattern

Currently hooks are organized by event type (PreToolUse, PostToolUse, etc.).
What if they were organized by DOMAIN, with `if` conditions providing the
routing within each domain?

```
SECURITY DOMAIN:
  PreToolUse:  if: "Bash(git push *)"           -> block-push-to-main.js
  PreToolUse:  if: "Bash(firebase deploy *)"     -> pre-deploy-safeguard.js
  PostToolUse: if: "Write(firestore.rules)"      -> firestore-rules-guard.js
  PostToolUse: if: "Write(.env*)"                -> env-file-guard.js

QUALITY DOMAIN:
  PreToolUse:  if: "Bash(git commit *)"          -> pre-commit-compliance.js
  PostToolUse: if: "Write(*.ts)|Edit(*.ts)"      -> typescript-strict-check.js
  PostToolUse: if: "Write(*.tsx)|Edit(*.tsx)"     -> component-size-check.js

TRACKING DOMAIN:
  PostToolUse: if: "Bash(git commit *)"          -> commit-tracker.js
  PostToolUse: if: "Bash(npm test *)"            -> test-run-tracker.js
  PostToolUse: matched: Task|Agent              -> agent-invocation-tracker.js

OBSERVABILITY DOMAIN:
  PostToolUse: matched: Read                    -> post-read-handler.js
  PostToolUse: matched: Write|Edit|MultiEdit    -> gsd-context-monitor.js
  UserPromptSubmit: (always)                    -> user-prompt-handler.js
```

This is a conceptual reorganization, not a technical one. Claude Code's
settings.json is structured by event type and cannot be restructured by domain.
But the mental model matters: when you think about hooks by domain, you ask
different questions:

- "Is our security domain complete?" (Do we cover all dangerous operations?)
- "Is our tracking domain consistent?" (Do we track all state-changing
  operations the same way?)
- "Can we disable the quality domain for a hotfix session?" (Toggle all quality
  hooks without touching security.)

### Implications

**Advantages:**
- Forces completeness thinking. The security domain view immediately reveals
  gaps: we block push-to-main but not deploy. We guard firestore.rules but not
  storage.rules modifications via Bash (e.g., `firebase deploy --only
  firestore:rules` deploying uncommitted local rule changes).
- Enables domain-level toggles. A `HOOK_DOMAINS` env var could let the
  session-start hook disable entire domains: `HOOK_DOMAINS=security,tracking`
  disables quality checks during a hotfix. This is not natively supported by
  Claude Code, but each hook script could check the env var as its first
  operation.
- Makes audit easier. A "security audit" of the hook system checks one domain's
  coverage instead of scanning all 21 hooks.

**Disadvantages:**
- **Claude Code has no native domain concept.** This is purely a mental model
  and documentation convention. The actual settings.json remains organized by
  event type. There is no way to group hooks by domain in the configuration.
- **Cross-domain hooks exist.** `commit-tracker.js` serves both tracking AND
  quality (it runs health alerts). `post-write-validator.js` serves security
  (firestore write block), quality (TypeScript strict, component size), and
  process (agent trigger enforcement). Domain boundaries are not clean.
- **Domain toggles via env vars add branching complexity to every hook script.**
  Every hook needs `if (process.env.HOOK_DOMAINS && !includes('security'))
  process.exit(0)` at the top. This is the kind of cross-cutting concern that
  monoliths handle naturally and micro-hooks handle poorly.

### Verdict for This Project

**Adopt as a documentation convention, not a runtime mechanism.** Add domain
tags as comments in settings.json next to each hook entry. Maintain a domain
coverage matrix in HOOKS.md or a similar doc. Use the domain lens during audits
(the `hook-ecosystem-audit` skill could check domain completeness). Do NOT
implement runtime domain toggles — the complexity is not justified for a solo
developer project with 21 hooks. If the hook count grows past 30-40, revisit
runtime domain toggles.

**One concrete action:** When settings.json is next refactored, add a `//
domain: security` comment (or a non-functional `"_domain": "security"` field if
JSON comments are not supported) to each hook entry. This costs nothing and
makes the implicit domains visible.

---

## 4. Dynamic Hook Activation — Programmatic `if` Generation

### The Pattern

Could a tool analyze the project and generate optimal `if` conditions
automatically? For example:

1. **Profiling pass:** Run a session with all hooks in verbose mode, logging
   every spawn, its duration, and whether the hook produced meaningful output.
2. **Analysis:** Identify hooks that spawn frequently but produce output rarely.
   For each, determine the smallest `if` pattern that would have captured all
   meaningful invocations.
3. **Generation:** Write the `if` conditions into settings.json automatically.

More ambitiously:

- **Adaptive `if` conditions:** A meta-hook that observes hook fire rates over
  time and suggests tighter patterns when a hook's "useful fire" rate drops
  below a threshold.
- **Project-template `if` conditions:** For a Next.js + Firebase project,
  generate a standard set of `if` conditions covering common patterns (deploy
  commands, rule file edits, env modifications).
- **`if` condition linting:** A static analyzer that reads settings.json and
  warns about: overly broad patterns (always matches), overly narrow patterns
  (file-path patterns on Windows), patterns on wrong event types, duplicate
  patterns across hooks, patterns that contradict the matcher.

### Implications

**Advantages:**
- The profiling approach is empirically grounded. Instead of guessing which `if`
  patterns will help, measure actual hook behavior and optimize based on data.
  This project already has the data: `.claude/state/hook-runs.jsonl` has 108
  entries with timing information.
- `if` condition linting catches the anti-patterns identified in D9-risks
  (wrong event type, Windows path issues, compound command assumptions) at
  configuration time rather than runtime.
- Template generation could be part of a `/hook-setup` skill for new projects.

**Disadvantages:**
- **Optimization target is small.** The research found that 3 hooks benefited
  from `if` conditions, saving 25-130 seconds per session. The remaining 14
  hooks either cannot use `if` or should not. A tool that automates the analysis
  for 3 hooks is over-engineering.
- **False precision risk.** Profiling a few sessions and generating patterns
  creates patterns tuned to observed behavior, not to the full space of possible
  behavior. A rare but important event (deploying to production, which happens
  once a month) might not appear in the profiling window and get filtered out.
- **Dynamic modification of settings.json is dangerous.** The config is
  committed to git and shared across locales. A tool that writes to it needs the
  same review rigor as any code change.

### Verdict for This Project

**Build the linter, skip the generator.** An `if` condition linter that checks
settings.json for the D9-risks anti-patterns (wrong event type, file-path
patterns on Windows, patterns inconsistent with matcher) is low-effort and
high-value. It could be a validator in the existing `npm run test:hooks` suite.
Skip profiling-based generation — the manual analysis in the research output
already identified all viable candidates, and the decision of which hooks should
use `if` requires understanding hook semantics that no profiler can infer.

**One concrete action:** Add a `validate-if-conditions` check to the hook test
suite that flags: (1) `if` on non-tool events, (2) file-path patterns with
backslash or drive-letter assumptions, (3) `if` patterns where the tool name
contradicts the matcher regex.

---

## 5. Hook Testing Framework

### The Pattern

`if` conditions make hooks deterministically testable because you can construct
exact inputs and verify whether a hook would fire. Without `if`, testing requires
spawning the hook and checking its internal logic. With `if`, the first decision
("should this hook fire?") is externalized into a declarative pattern that can be
tested against a matrix of tool calls.

A hook test suite would have three layers:

**Layer 1 — Pattern matching tests (no process spawns):**
```
GIVEN: hook has if: "Bash(git push *)"
WHEN: tool_call = { tool: "Bash", command: "git push origin main" }
THEN: hook should fire

WHEN: tool_call = { tool: "Bash", command: "git status && git push origin main" }
THEN: hook should NOT fire (compound command bypass — document this as known)

WHEN: tool_call = { tool: "Bash", command: "git push" }
THEN: hook should NOT fire (bare push without arguments)
```

**Layer 2 — Hook logic tests (spawn the script with synthetic input):**
```
GIVEN: firestore-rules-guard.js receives a Write to firestore.rules
WHEN: the content removes "allow create, update: if false"
THEN: hook exits 2 (blocking)

WHEN: the content preserves all required rules
THEN: hook exits 0 (pass)
```

**Layer 3 — Integration tests (end-to-end hook pipeline):**
```
GIVEN: the security pipeline is configured
WHEN: Claude writes to firestore.rules removing a critical rule
THEN: the PreToolUse gate prompts for confirmation
AND: the PostToolUse validator blocks the change
AND: the state file records the violation
```

### Implications

**Advantages:**
- Layer 1 tests are pure functions over the `if` pattern syntax. They require
  no process spawns, no Node.js, no hook scripts. They verify the CONFIG, not
  the CODE. This is a category of testing that did not exist before `if`
  conditions.
- Layer 2 tests already partially exist (`npm run test:hooks`). The `if` field
  adds input-filtering guarantees: you know a hook will never receive inputs
  outside its pattern, so you only need to test the matching inputs.
- Layer 3 tests validate composition (Section 2 pipelines). They are expensive
  but catch the implicit coupling that makes pipelines fragile.
- The test suite doubles as documentation: the test matrix IS the specification
  of what triggers each hook.

**Disadvantages:**
- **Layer 1 requires reimplementing the `if` pattern matcher in test code.**
  Claude Code's internal glob matcher may have subtle behaviors (Windows path
  normalization, wildcard semantics, the pipe OR syntax) that a test
  reimplementation gets wrong. You would be testing your model of the matcher,
  not the actual matcher.
- **Layer 3 requires a Claude Code test harness** that can simulate tool calls
  and observe hook execution. No such harness exists publicly. You would need to
  either mock the entire hook dispatch system or run actual Claude Code sessions
  with scripted inputs.
- **Maintenance burden.** Every new hook needs test coverage across all three
  layers. For a 21-hook system with 3-5 test cases per hook, that is 63-105
  test cases to maintain.

### Verdict for This Project

**Expand Layer 1 and 2, skip Layer 3.** Layer 1 pattern-matching tests are
uniquely enabled by `if` conditions and should be added to `test:hooks`. They
are cheap to write, fast to run, and catch the most common misconfiguration
(wrong pattern, wrong event type). Accept the matcher reimplementation risk by
using conservative pattern matching (exact string comparison for known inputs,
not a full glob reimplementation). Layer 2 already exists in embryonic form.
Layer 3 is not feasible without a Claude Code test harness and is not justified
for a solo developer project.

**One concrete action:** Create a `test-if-patterns.js` that defines a matrix
of `{ hook_name, if_pattern, test_inputs: [{ input, should_fire, note }] }` and
verifies each. The matrix entries are the documented bypass cases from D9-risks.
This catches regressions when `if` patterns are modified.

---

## 6. Comparison to Other AI Coding Tools

### Claude Code's `if` Field

A handler-level declarative filter using tool-argument glob patterns. Evaluated
before process spawn. Works with all tool types. Uses permission rule syntax.
Introduced v2.1.85 (March 2026).

### Cursor (Rules system)

Cursor uses `.cursorrules` and `.cursor/rules/*.mdc` files with frontmatter
metadata. Rules can be scoped to file globs:

```
---
globs: ["*.ts", "*.tsx"]
alwaysApply: false
---
When editing TypeScript files, always use strict types...
```

This is a **prompt injection** mechanism, not a hook execution filter. The glob
determines whether a rule is included in the context, not whether a script runs.
There is no concept of conditional hook execution — Cursor does not have a
user-extensible hook system at all. Cursor rules are purely declarative
instructions appended to the system prompt.

**Key difference:** Cursor's globs scope INSTRUCTIONS; Claude Code's `if` scopes
EXECUTION. Cursor tells the AI what to do differently; Claude Code controls what
automation runs. These solve different problems and are not directly comparable.

### Windsurf (Cascade Rules)

Windsurf uses `.windsurfrules` (global) and `cascade.json` (per-directory) for
context rules. Like Cursor, these are prompt-scoping mechanisms:

```json
{
  "rules": [
    { "pattern": "*.py", "context": "Use type hints for all function signatures" }
  ]
}
```

Windsurf has a "flows" concept where multi-step actions can be defined, but
these are agent-internal orchestration — not user-extensible hooks that run
external processes. There is no equivalent to Claude Code's `if` field because
there is no equivalent to Claude Code's hook system.

### Aider (Conventions and Linting)

Aider uses `.aider.conf.yml` for configuration and supports a `lint-cmd` that
runs after every edit:

```yaml
lint-cmd:
  python: flake8 --select=E9,F63,F7,F82
  javascript: eslint --fix
```

The lint command runs on **every edit to a file of that language**. There is no
conditional execution based on file content or command arguments. The closest
analog to `if` conditions is the per-language scoping, which is far coarser.
Aider also supports `auto-test` which runs tests after every change, and
`test-cmd` for the test command — but again, unconditional.

**Key difference:** Aider's approach is "always lint, always test." There is no
concept of running different checks for different files or operations. The
philosophy is that linting is cheap enough to run unconditionally. This works
for fast linters but breaks down for expensive custom validators (like this
project's 10-validator monolith).

### Continue.dev (Context Providers and Slash Commands)

Continue.dev has a plugin system with `context providers` and `slash commands`.
Context providers can be scoped to specific file types or directories, but they
inject context — they do not conditionally execute external scripts. Slash
commands are user-invoked, not automatic. There is no hook system with
conditional execution.

### Cline (Custom Instructions)

Cline uses `.clinerules` files and a `custom_instructions` field in its config.
These are prompt modifications, not execution hooks. Cline has no equivalent to
Claude Code's hooks system and no concept of conditional automation.

### Summary Comparison

| Feature | Claude Code | Cursor | Windsurf | Aider | Continue | Cline |
|---------|-------------|--------|----------|-------|----------|-------|
| User hooks (external scripts) | Yes | No | No | Lint only | No | No |
| Conditional execution (`if`) | Yes (v2.1.85+) | N/A | N/A | Per-language | N/A | N/A |
| Event types | 8+ events | N/A | N/A | Post-edit | N/A | N/A |
| Tool-argument filtering | Yes | N/A | N/A | No | N/A | N/A |
| File-glob scoping | Yes (rules) | Yes (rules) | Yes (rules) | Yes (lint) | Yes (context) | No |
| Blocking capability | Yes (exit 2) | N/A | N/A | Yes (lint fail) | N/A | N/A |
| Prompt-time scoping | No (rules, not hooks) | Yes | Yes | No | Yes | Yes |

### What Can We Learn?

1. **Claude Code is alone in having a general-purpose hook system.** Every other
   tool either has no hooks or has limited lint-after-edit. The `if` field is
   not just unique — the entire hook architecture it filters is unique. This
   means there are no established patterns to copy. The project is pioneering.

2. **Cursor's glob-scoped rules are the closest analog conceptually.** The idea
   of "this automation applies when this file pattern matches" is shared. But
   Cursor applies it to prompt content, not process execution. A synthesis would
   be: use `if` conditions for execution filtering (Claude Code's approach) AND
   use rule-file globs for context scoping (Cursor's approach). Claude Code
   already has `CLAUDE.md` for project-wide rules but does not support
   per-directory or per-glob rule files.

3. **Aider's "always lint" philosophy is the counter-argument to `if`.** If the
   hook is fast enough, conditional execution adds complexity without meaningful
   benefit. The research finding that `ensure-fnm.sh` adds 234ms per spawn is
   the reason `if` matters for this project. On a system where hooks complete in
   5ms, you would not bother with `if` conditions at all. This reinforces that
   the lean wrapper (P1) is the highest-priority optimization: it shrinks the
   cost of unconditional execution, reducing the need for conditional execution.

4. **No tool has multi-event hook pipelines.** The composition patterns described
   in Section 2 (PreToolUse gate -> PostToolUse validate -> PostToolUse verify)
   are not implemented in any competing tool. This is either an opportunity
   (Claude Code can offer richer automation) or a warning (nobody else found
   this useful enough to build).

---

## 7. Synthesis: Which Ideas Are Worth Pursuing?

### Priority Matrix

| Idea | Value | Feasibility | Risk | Recommendation |
|------|-------|-------------|------|----------------|
| 1. Micro-hook architecture | High (long-term) | Blocked by fnm + Windows paths | Medium | Plan for, don't execute yet |
| 2. Hook composition pipelines | High (security) | Feasible now | Low (if documented) | Implement for Firestore rules |
| 3. Domain routing layer | Medium (mental model) | Trivial (documentation) | None | Add domain comments to config |
| 4. Dynamic `if` generation | Low (solved problem) | Feasible but unnecessary | Medium (over-engineering) | Build linter only |
| 5. Hook testing framework | High (quality) | Layers 1-2 feasible | Low | Add pattern tests to test:hooks |
| 6. Learn from other tools | Informational | N/A | N/A | Confirm pioneering position |

### The Big Picture

The `if` field is not just a performance optimization for individual hooks. It
is the primitive that enables three architectural shifts:

1. **From monoliths to micro-services** (Section 1): conditional execution
   removes the cost penalty that forced consolidation.
2. **From isolated hooks to pipelines** (Section 2): shared `if` patterns across
   events create implicit data flows.
3. **From event-organized to domain-organized** (Section 3): fine-grained
   activation enables thinking about hooks by what they PROTECT rather than
   when they FIRE.

All three shifts share a prerequisite: the spawn cost must be low enough that
the overhead of multiple small hooks is acceptable. The `ensure-fnm.sh` lean
wrapper (P1 from the research output) is therefore not just a performance
optimization — it is the architectural enabler for the entire micro-hook vision.

**The recommended sequence:**

1. **Now:** Implement the fnm lean wrapper (P1). This unblocks everything else.
2. **Now:** Add domain comments to settings.json (Section 3). Free, immediate
   clarity.
3. **Now:** Add `if` pattern tests to test:hooks (Section 5). Catches
   misconfigurations.
4. **Soon:** Implement Firestore rules pipeline as the first composition pattern
   (Section 2). Proves the model.
5. **Later:** Begin extracting post-write-validator.js validators into
   micro-hooks (Section 1). One at a time, as new validators are added.
6. **Later:** Build the `if` condition linter (Section 4). Catches anti-patterns
   at config time.

The `if` field, combined with a low-cost spawn wrapper, transforms the hook
system from a collection of individual scripts into a composable, domain-aware,
testable automation layer. The feature is more significant than its humble
one-line-in-settings.json appearance suggests.
