# AI Optimization Audit — sonash-v0

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

## 1. Executive Summary

The sonash-v0 project has grown a sophisticated AI-assisted development
infrastructure over ~180 sessions: 58 skills, 36 agents, 17 active hooks, 96 npm
scripts, and a multi-layered state persistence system. This infrastructure is
impressive and largely well-engineered, but has accumulated significant **token
waste, skill proliferation, and hook bloat** that now imposes measurable
friction on every session.

**Key numbers:**

| Resource                | Count       | Total Size | Est. Tokens    |
| ----------------------- | ----------- | ---------- | -------------- |
| Skills (SKILL.md files) | 58          | 799 KB     | ~200,000       |
| Agents (.md files)      | 36          | 406 KB     | ~101,000       |
| Top-level context docs  | 10          | ~46 KB     | ~11,500        |
| Active hooks            | 17 JS files | 226 KB     | N/A (executed) |
| Backup hooks (dead)     | 7 JS files  | —          | N/A            |
| npm scripts             | 96          | —          | N/A            |
| State files             | 16          | 283 KB     | —              |
| Tmp files (stale)       | 13          | 283 KB     | —              |

**Critical:** The 6 largest skills alone total 214 KB (~53,000 tokens each time
they are invoked). The session-start hook runs up to 7 blocking synchronous
subprocess calls on every session open. 6 hook files exist in the active hooks
directory but are not wired into `settings.json`.

**Top 3 highest-ROI actions:**

1. Split the 3 oversized skills (doc-optimizer, system-test, audit-process) into
   layered reference docs + thin entry points — saves ~35,000 tokens per
   invocation.
2. Wire or remove the 6 orphaned hook files — eliminates confusion about what
   runs.
3. Delete or archive stale tmp files and the dead multi-ai-audit session state —
   reduces state confusion.

---

## 2. Top Findings Table

| ID    | Area                | Finding                                                                                                                   | Severity | Effort |
| ----- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| AO-01 | Token Waste         | 8 skills exceed 500 lines; top 3 total 214 KB                                                                             | S1       | E2     |
| AO-02 | Skill Overlap       | 9 audit skills with unclear differentiation; `/audit-comprehensive` subsumes most                                         | S1       | E2     |
| AO-03 | Skill Overlap       | 6 `senior-*` skills are near-identical templates with swapped role names                                                  | S2       | E1     |
| AO-04 | Skill Overlap       | `debugger` + `error-detective` agents overlap significantly                                                               | S2       | E1     |
| AO-05 | Skill Overlap       | `security-auditor` + `security-engineer` agents cover same domain                                                         | S2       | E1     |
| AO-06 | Skill Overlap       | `backend-architect` + `fullstack-developer` + `frontend-developer` agents overlap                                         | S2       | E1     |
| AO-07 | Hook Latency        | session-start runs 7 blocking subprocess calls (npm ci, build, patterns:check, consolidation, reviews:sync, tdms:metrics) | S1       | E2     |
| AO-08 | Hook Latency        | 2 hooks run on every Bash call (commit-tracker + commit-failure-reporter) with fast bail-out but still spawn              | S2       | E1     |
| AO-09 | Hook Latency        | post-write-validator (955 lines) runs on every Write/Edit/MultiEdit                                                       | S2       | E2     |
| AO-10 | Orphaned Hooks      | 6 hook JS files exist but are not wired in settings.json                                                                  | S2       | E0     |
| AO-11 | Token Waste         | claude.md + CLAUDE.md are identical on a case-insensitive FS (Windows) — double-loaded                                    | S1       | E0     |
| AO-12 | Context Management  | AI_WORKFLOW.md (874 lines, 30 KB) mandates reading at session start; most content is redundant with CLAUDE.md             | S1       | E2     |
| AO-13 | State Bloat         | agent-research-results.md is 76 KB with no TTL or rotation                                                                | S2       | E1     |
| AO-14 | State Bloat         | .claude/tmp/ contains 10 stale audit-result JSON files (283 KB total) with no cleanup                                     | S2       | E0     |
| AO-15 | State Bloat         | multi-ai-audit/session-state.json is stale (created 2026-02-06, status "in_progress")                                     | S2       | E0     |
| AO-16 | State Bloat         | state/handoff.json is 23 KB; no size cap documented                                                                       | S3       | E1     |
| AO-17 | State Bloat         | Duplicate state-utils: hooks/state-utils.js (221 lines) vs hooks/lib/state-utils.js (139 lines) — different files         | S3       | E1     |
| AO-18 | Config Complexity   | settings.local.json permissions list is 250+ entries, including multi-line commit messages — unmaintainable               | S2       | E2     |
| AO-19 | Config Complexity   | 96 npm scripts — many are rarely used aliases or 1-time setup commands                                                    | S3       | E2     |
| AO-20 | Agent Orchestration | gsd-planner.md (1,476 lines) and gsd-debugger.md (1,300 lines) are excessively verbose                                    | S2       | E2     |
| AO-21 | Token Waste         | SKILL_INDEX.md is 155 lines but indexes 54 skills — find-skills skill likely supersedes it                                | S3       | E0     |
| AO-22 | Skill Overlap       | audit-documentation (1,000 lines) vs doc-optimizer (1,735 lines) serve overlapping purposes                               | S2       | E2     |
| AO-23 | Hook Latency        | check-remote-session-context.js does a `git fetch` on session start (with 5-min TTL) — can add seconds on slow networks   | S2       | E1     |
| AO-24 | Session Efficiency  | Session startup checklist mandates reading 2 large docs + running multiple scripts before any work                        | S2       | E2     |
| AO-25 | Backup Bloat        | 7 backup hook files in hooks/backup/ are never run but create confusion                                                   | S3       | E0     |

---

## 3. Detailed Findings (Grouped by Severity)

### S1 — Critical (4 findings)

---

#### AO-01: 8 Skills Exceed 500 Lines — Top Skills Are 57–73 KB Each

**Location:** `.claude/skills/`

**Evidence:**

| Skill                     | Lines | Size  |
| ------------------------- | ----- | ----- |
| `system-test`             | 1,261 | 72 KB |
| `doc-optimizer`           | 1,735 | 57 KB |
| `audit-process`           | 1,531 | 49 KB |
| `multi-ai-audit`          | 1,023 | 35 KB |
| `market-research-reports` | 1,003 | —     |
| `audit-documentation`     | 1,000 | —     |
| `audit-aggregator`        | 813   | —     |
| `pr-review`               | 748   | —     |

**Impact:** When a user invokes `/doc-optimizer`, the full 1,735-line SKILL.md
is injected into the context window. The top 3 skills alone consume ~35,000
tokens — equivalent to 25% of a 128K context window, just for the instruction
prompt. Wave orchestration guides, agent prompt templates, and example outputs
are all included inline, even though most of the content is only relevant at
specific execution steps.

**Recommendation:** Split each oversized skill into:

- A thin entrypoint SKILL.md (<200 lines) with the decision tree and step
  references
- Referenced sub-documents for wave details, agent prompts, and examples
- Use `@file` references in agent prompts instead of inlining all content

**Target:** No SKILL.md exceeding 300 lines for orchestrator skills.

---

#### AO-02: 9 Audit Skills with Unclear Differentiation

**Location:** `.claude/skills/audit-*/`

**Evidence:**

| Skill                            | Description               | Agents                  |
| -------------------------------- | ------------------------- | ----------------------- |
| `audit-comprehensive`            | Runs all 9 domains        | 9 (subsumes everything) |
| `audit-code`                     | Code quality              | parallel agents         |
| `audit-security`                 | Security vulnerabilities  | parallel agents         |
| `audit-documentation`            | Docs quality              | 18 agents               |
| `audit-refactoring`              | Technical debt            | parallel agents         |
| `audit-performance`              | Performance               | parallel agents         |
| `audit-process`                  | Automation audit          | 22 agents, 7 stages     |
| `audit-enhancements`             | Enhancement opportunities | parallel agents         |
| `audit-engineering-productivity` | Productivity/DX           | parallel agents         |
| `audit-ai-optimization`          | This skill itself         | 11 agents               |

**Impact:** Users face a decision tree of 9+ audit skills before even starting a
review. `/audit-comprehensive` spawns all 9 domain skills, making most
individual audit skills redundant as standalone invocations. The skills share
boilerplate "CRITICAL: Persistence Rules" sections (50+ lines each) copy-pasted
identically across all of them.

**Recommendation:**

1. Retain only `audit-comprehensive` as the primary entry point
2. Individual domain skills become internal modules called by
   `audit-comprehensive`, not user-invocable
3. Extract shared "CRITICAL: Persistence Rules" boilerplate into a single
   referenced document
4. Remove `audit-ai-optimization` and `create-audit` from the user-facing skill
   index — they're meta-tools

---

#### AO-07: Session-Start Hook Runs 7 Blocking Subprocess Calls

**Location:** `.claude/hooks/session-start.js` (520 lines)

**Evidence:**

```
Line 310: npm ci --prefer-offline (root dependencies)
Line 331: npm ci --prefer-offline --legacy-peer-deps (functions)
Line 346: npm run build (Firebase Functions)
Line 380: npm run test:build
Line 387: node scripts/check-pattern-compliance.js
Line 401: node scripts/run-consolidation.js --auto
Line 438: npm run reviews:sync --apply
```

All 7 calls are synchronous (`execSync`), meaning each must complete before the
next starts. On Windows (the target platform), `npm ci` alone can take 30–120
seconds if the lockfile hash has changed. Even with hash-based caching, the
hash-check itself requires multiple `fs.readFileSync` calls + crypto operations.

**Impact:** Cold session start can take 3–8 minutes. Even warm starts (hash
unchanged) execute all hash-check logic synchronously. The user cannot interact
with Claude until the hook finishes.

**Recommendation:**

1. Move npm dependency installation to an async background job or pre-commit
   check
2. Keep only essential checks (pattern compliance, session state) in the
   synchronous hook
3. Display a "background: dependencies updating" message rather than blocking
4. Consider a dedicated `npm run session:start` alias that the user runs
   manually

---

#### AO-11: claude.md and CLAUDE.md Are Both Present — Double-Loaded on Windows

**Location:** Project root

**Evidence:**

```
$ wc -l claude.md CLAUDE.md
  138 claude.md
  138 CLAUDE.md
```

Both files are identical (diff shows only header differences, same line count).
On Windows with a case-insensitive filesystem, Claude Code loads both if both
exist, as they are technically different filenames from the OS perspective but
resolve to the same file content.

**Impact:** CLAUDE.md (~3,200 tokens) is loaded twice per session, wasting
~3,200 tokens that could be used for actual work context.

**Recommendation:** Delete `claude.md` (lowercase) and keep only `CLAUDE.md`.

---

#### AO-12: AI_WORKFLOW.md (874 Lines) Is Mandated Reading Every Session

**Location:** `AI_WORKFLOW.md`, `SESSION_CONTEXT.md`

**Evidence:**

- `SESSION_CONTEXT.md` line 1: "When to Use: START OF EVERY SESSION (read this
  first!)"
- `AI_WORKFLOW.md` line 1: "When to Use: Start of EVERY session"
- `AI_WORKFLOW.md` is 874 lines (30 KB, ~7,600 tokens)
- `SESSION_CONTEXT.md` is 225 lines (8.6 KB, ~2,150 tokens)

Both documents instruct AI to read them at session start. The AI_WORKFLOW.md
contains an 874-line workflow guide including detailed update procedures,
navigation maps, and historical change logs — most of which are only relevant
when the AI is updating documentation itself, not during normal development
sessions.

**Impact:** Each session start potentially consumes 9,750+ tokens just on
workflow/context docs, before any actual work begins. The "standard procedures"
content in AI_WORKFLOW.md duplicates guidance already in CLAUDE.md (Section 6,
Agent Triggers).

**Recommendation:**

1. Split AI_WORKFLOW.md into: (a) a 50-line Quick Start linked from CLAUDE.md,
   and (b) a detailed reference doc loaded only when explicitly needed
2. Remove "ALWAYS read this first" from AI_WORKFLOW.md — it should be
   referenced, not mandatory
3. SESSION_CONTEXT.md is the right place for session-start context;
   AI_WORKFLOW.md should be on-demand

---

### S2 — High (13 findings)

---

#### AO-03: 6 `senior-*` Skills Are Near-Identical Template Instances

**Location:**
`.claude/skills/senior-{architect,backend,devops,frontend,fullstack,qa}/SKILL.md`

**Evidence:** All 6 files are 224–226 lines. `diff` of senior-frontend vs
senior-backend shows only 8 changed lines — the role name, technology stack
description, and 3 script names. Each contains identical sections: "Quick
Start", "Main Capabilities", "Script 1/2/3", "Full API Reference", "Error
Handling", "Integration Examples".

**Impact:** ~1,350 lines / ~85 KB of near-duplicate content. If the shared
template needs updating (e.g., error handling patterns), it must be updated in 6
places.

**Recommendation:** Create a single `senior-dev/SKILL.md` with role configured
via argument: `/senior-dev frontend`, `/senior-dev backend`, etc. Or reduce each
to a 20-line role descriptor that extends a shared `senior-base.md`.

---

#### AO-04: `debugger` and `error-detective` Agents Overlap

**Location:** `.claude/agents/debugger.md`, `.claude/agents/error-detective.md`

**Evidence:** Both agents:

- Use same tools: Read, Write, Edit, Bash, Grep
- Use same model: sonnet
- Address the same trigger: "encountering issues, analyzing stack traces"
- Have overlapping "Focus Areas": stack trace analysis, error identification,
  root cause

`debugger.md` focuses on reproduction + fix. `error-detective.md` focuses on
log/pattern analysis. In practice, these are the same task: debugging production
issues.

**Recommendation:** Merge into a single `debugger.md`. Add a section for log
pattern analysis. Remove `error-detective.md`.

---

#### AO-05: `security-auditor` and `security-engineer` Agents Overlap

**Location:** `.claude/agents/security-auditor.md`,
`.claude/agents/security-engineer.md`

**Evidence:**

- `security-auditor`: 40 lines, focuses on OWASP, auth, input validation, code
  review
- `security-engineer`: 985 lines, covers infrastructure security, compliance,
  IaC, cloud security

The 985-line `security-engineer.md` contains extensive Terraform/HCL code
examples and infrastructure patterns that are irrelevant to this
Next.js/Firebase project (which uses Firebase security rules, not Terraform). It
inflates agent context by ~20,000 tokens for content not applicable to the
codebase.

**Recommendation:**

1. Remove `security-engineer.md` or strip it to 80 lines of project-relevant
   guidance
2. Consolidate security concerns into the existing `security-auditor.md`

---

#### AO-06: `backend-architect`, `frontend-developer`, `fullstack-developer` Overlap

**Location:** `.claude/agents/`

**Evidence:**

- `fullstack-developer.md` (1,281 lines) explicitly covers "Frontend
  Technologies" AND "Backend Technologies" AND "Database Integration"
- `backend-architect.md` covers API design + database schema — a subset of
  fullstack-developer
- `frontend-developer.md` covers React + responsive design — a subset of
  fullstack-developer

For a solo developer on a Next.js/Firebase app, `fullstack-developer` is the
natural agent. The specialized sub-agents rarely add value beyond it.

**Recommendation:** Consolidate `backend-architect.md` and
`frontend-developer.md` into `fullstack-developer.md` as focused sections.
Remove the two standalone agents.

---

#### AO-08: Two Hooks Run on Every Bash Call

**Location:** `settings.json` PostToolUse Bash matcher

**Evidence:**

```json
{
  "matcher": "^(?i)bash$",
  "hooks": [
    { "command": "node .claude/hooks/commit-tracker.js $ARGUMENTS" },
    { "command": "node .claude/hooks/commit-failure-reporter.js $ARGUMENTS" }
  ]
}
```

Both hooks have fast bail-out regex (~1ms for non-commit commands), but each
still:

- Spawns a new Node.js process (~20–50ms on Windows including startup overhead)
- Reads git state and state files on the fast path
- Runs synchronously, blocking the next tool call

With typical session activity of 100+ Bash calls, this adds 4,000–10,000ms of
cumulative overhead per session that is invisible to the user but delays
tool-call completion.

**Recommendation:** Merge commit-tracker and commit-failure-reporter into a
single `bash-post-handler.js`. Both already share git detection logic.

---

#### AO-09: post-write-validator.js Is 955 Lines Running on Every Write/Edit

**Location:** `.claude/hooks/post-write-validator.js`

**Evidence:** The file consolidates 10 checks:

1. checkRequirements (agent suggestions)
2. auditS0S1 (JSONL validation)
3. patternCheck (inline patterns)
4. componentSizeCheck
5. firestoreWriteBlock
6. testMockingValidator
7. appCheckValidator
8. typescriptStrictCheck
9. repositoryPatternCheck
10. agentTriggerEnforcer

While the consolidation into one process was smart (comment says "replaces 10
separate hooks, ~800ms saved"), the file's 955 lines also means higher
maintenance cost. More critically, checks 1, 5, 6, 7, 9, and 10 require reading
project config files (`agent-triggers` config, `loadConfigWithRegex`) on EVERY
write. This config loading is done at module level, adding I/O to every hook
invocation even for trivial edits.

**Recommendation:** Cache the config in the hook's state file (load once, reuse
for 10 minutes). Consider making checks 1 and 10 (agent suggestions)
async/non-blocking.

---

#### AO-10: 6 Hook Files Exist But Are Not Wired in settings.json

**Location:** `.claude/hooks/`

**Evidence:** The following hook files exist but have no entry in
`settings.json`:

| File                       | Lines | Purpose                                                    |
| -------------------------- | ----- | ---------------------------------------------------------- |
| `alerts-reminder.js`       | 200   | Alert reminders (moved into user-prompt-handler.js)        |
| `analyze-user-request.js`  | 294   | Request routing (possibly moved to user-prompt-handler.js) |
| `plan-mode-suggestion.js`  | 153   | Plan mode suggestions                                      |
| `session-end-reminder.js`  | 87    | Session end reminders                                      |
| `state-utils.js`           | 221   | Utility library (not a hook)                               |
| `stop-serena-dashboard.js` | 391   | Serena cleanup (in settings.local.json?)                   |

`stop-serena-dashboard.js` appears in `settings.local.json` based on a commit
message reference, but the other 5 are genuinely orphaned or their functionality
was absorbed into consolidated hooks.

**Impact:** Dead code creates confusion about the hook system. Developers
reading the hooks directory cannot tell which hooks are active.

**Recommendation:**

1. Move `state-utils.js` to `hooks/lib/` (where it belongs — there's already a
   `hooks/lib/state-utils.js`)
2. Delete or archive `alerts-reminder.js`, `analyze-user-request.js`,
   `plan-mode-suggestion.js`, `session-end-reminder.js` if their functionality
   is now in `user-prompt-handler.js`
3. Add a `# REGISTERED HOOKS` comment in settings.json listing all active hooks

---

#### AO-13: agent-research-results.md Is 76 KB with No Rotation

**Location:** `.claude/state/agent-research-results.md`

**Evidence:** File is 76,297 bytes. No rotation logic found in hooks. The file
appears to be an append-only log of agent research outputs from past sessions.

**Impact:** While not loaded automatically, this file's growth is unbounded. If
scripts ever read this file for context, it will consume ~19,000 tokens.

**Recommendation:** Implement rotation: keep last 30 days or cap at 20 KB.
Archive older entries to `docs/audits/` on `/session-end`.

---

#### AO-14: .claude/tmp/ Contains 10 Stale Audit JSON Files (283 KB)

**Location:** `.claude/tmp/`

**Evidence:**

| File                                                   | Size          |
| ------------------------------------------------------ | ------------- |
| `audit-result.json`                                    | 35 KB         |
| `audit-result-post.json`                               | 34 KB         |
| `audit-result-final.json`                              | 33 KB         |
| `audit-result-round2.json` through `round5`            | 24–32 KB each |
| `audit-result-final2.json`, `audit-result-final3.json` | 27–28 KB each |

These appear to be versioned snapshots from an iterative audit session (PR
ecosystem audit based on filenames). Total: ~283 KB of stale JSON.

**Impact:** State directory confusion. These files have no TTL or auto-cleanup.

**Recommendation:**

1. Delete all `audit-result*.json` files from `.claude/tmp/` (they're from
   session dated 2026-02-22 today, but appear to be from an earlier audit cycle)
2. Add `.claude/tmp/` to the cleanup step in `session-start.js` (delete files >7
   days old)

---

#### AO-15: multi-ai-audit/session-state.json Is Stale ("in_progress" Since 2026-02-06)

**Location:** `.claude/multi-ai-audit/session-state.json`

**Evidence:**

```json
{
  "session_id": "maa-2026-02-06-b87316",
  "created": "2026-02-06T01:27:47.798Z",
  "status": "in_progress",
  "workflow_phase": "collecting",
  "current_category": "process"
}
```

The multi-AI audit session from 2026-02-06 was never marked complete. The
`engineering-productivity` category is still "pending". This is 16 days stale.

**Impact:** Any script that reads this state file will treat the session as
active, potentially skipping or interfering with new multi-AI audit runs.

**Recommendation:** Mark this session as `abandoned` or delete it. Document in
`COORDINATOR.md`.

---

#### AO-18: settings.local.json Has 250+ Permission Entries Including Multi-Line Commit Messages

**Location:** `.claude/settings.local.json`

**Evidence:** The permissions `allow` array contains 250+ entries. Many entries
are entire git commit commands with multi-line heredoc messages embedded in the
JSON, e.g.:

```
"Bash(SKIP_CROSS_DOC_CHECK=1 git commit -m \"$(cat <<'EOF'\nfix(hooks): apply Qodo Round 2 security hardening...\nEOF\n)\")"
```

These one-time commit approvals accumulate over sessions and are never pruned.

**Impact:**

1. File is nearly unreadable at ~250 entries
2. Old commit message permissions have no security value after the commit is
   made
3. Discovery and auditing of actual granted permissions is nearly impossible

**Recommendation:**

1. Remove all one-time commit message approvals (keep only pattern-based entries
   like `Bash(git commit:*)`)
2. Split into logical groups with comments: MCP tools, git operations, npm
   scripts, etc.
3. Add a documented rotation policy: remove permissions older than 30 days

---

#### AO-20: gsd-planner.md (1,476 Lines) and gsd-debugger.md (1,300 Lines) Are Excessively Verbose

**Location:** `.claude/agents/global/`

**Evidence:**

- `gsd-planner.md`: 1,476 lines — the longest agent file in the project
- `gsd-debugger.md`: 1,300 lines
- `gsd-project-researcher.md`: 908 lines
- `gsd-codebase-mapper.md`: 821 lines

These GSD (Get Stuff Done) agents appear to be a global framework with highly
detailed workflows. The verbosity may be intentional for complex multi-phase
planning, but at 1,476 lines, `gsd-planner.md` is larger than most complete
software projects' README files.

**Impact:** Each time a GSD agent is spawned, it consumes 25,000–37,000 tokens
of context just for its system prompt. In a multi-agent wave with 4 concurrent
GSD agents, that's 100,000+ tokens dedicated to agent instructions.

**Recommendation:**

1. Audit each GSD agent for sections that could be `@file` references
2. Extract standard operating procedures into a shared `gsd-base.md` document
3. Target max 400 lines per agent file

---

#### AO-22: audit-documentation and doc-optimizer Overlap

**Location:** `.claude/skills/audit-documentation/SKILL.md`,
`.claude/skills/doc-optimizer/SKILL.md`

**Evidence:**

- `audit-documentation` (1,000 lines): "read-only diagnostic, 18 agents,
  report-only"
- `doc-optimizer` (1,735 lines): "repair + enhancement tool, auto-fixes, 13
  agents, 5 waves"

The skills acknowledge each other in their descriptions, but the overlap is
substantial: both analyze formatting, headers, links, content accuracy,
freshness, and cross-references. The key difference (read-only vs auto-fix) is
minor; the inspection logic is identical.

**Impact:** Users must choose between two similarly-named, similarly-sized
skills. The 2,735 combined lines represent ~68,000 tokens if both are ever
invoked in sequence.

**Recommendation:** Merge into a single skill with a `--fix` flag. Run in
read-only mode by default, write mode with `--fix`. This mirrors how tools like
`eslint --fix` work.

---

#### AO-23: check-remote-session-context.js Does git fetch on Session Start

**Location:** `.claude/hooks/check-remote-session-context.js`

**Evidence:** The hook performs `git fetch` to check remote branches for
SESSION_CONTEXT.md updates. It has a 5-minute TTL cache, but on first run or
after cache expiry, a full `git fetch` blocks session startup. On slow networks
or large repos, this can add 5–30 seconds.

**Impact:** Network latency injected into session startup for a feature (remote
SESSION_CONTEXT sync) that applies mainly to multi-branch workflows. For the
common case (working on the current branch), this check provides no value.

**Recommendation:** Default this check to disabled; enable only when explicitly
requested or when the user switches branches. Or change from `SessionStart` to
`UserPromptSubmit` with a longer TTL (30 minutes).

---

#### AO-24: Session Startup Requires Reading 2 Large Docs + Running Multiple Scripts

**Location:** `SESSION_CONTEXT.md`, `AI_WORKFLOW.md`

**Evidence:** SESSION_CONTEXT.md instructs AI to:

1. Read SESSION_CONTEXT.md itself (~2,150 tokens)
2. Read AI_WORKFLOW.md first (~7,600 tokens)
3. Increment session counter
4. Check Next Session Goals
5. Review Current Blockers
6. Note Pending PR Reviews

Then the session-start hook independently runs pattern compliance,
consolidation, and reviews sync — adding 2–5 minutes of wall-clock time.

The combined mandatory startup overhead is ~9,750 tokens of reading plus 2–8
minutes of blocked time.

**Recommendation:** Define a "minimal startup" mode: read only
SESSION_CONTEXT.md (keep it <100 lines), skip the git fetch and npm installs,
start working. Full startup only when explicitly requested or when first opening
a new PR.

---

### S3 — Low (8 findings)

---

#### AO-16: state/handoff.json Is 23 KB with No Size Cap

**Location:** `.claude/state/handoff.json`

**Evidence:** The file is 23,148 bytes and is updated on every read (via
`post-read-handler.js`). No cap or rotation mechanism was found in the hook
code.

**Recommendation:** Cap handoff.json at 10 KB; rotate older content to an
archive file.

---

#### AO-17: Duplicate state-utils: hooks/state-utils.js and hooks/lib/state-utils.js

**Location:** `.claude/hooks/state-utils.js`, `.claude/hooks/lib/state-utils.js`

**Evidence:** Two different versions of state-utils exist:

- `hooks/state-utils.js` (221 lines): more complete version, includes task state
  conventions
- `hooks/lib/state-utils.js` (139 lines): trimmed version, used by
  post-read-handler and pre-compaction-save

The top-level `hooks/state-utils.js` is not imported by any hook (no references
found in grep of all hooks/\*.js).

**Recommendation:** Delete `hooks/state-utils.js` (top-level orphan).
Consolidate any unique functionality into `hooks/lib/state-utils.js`.

---

#### AO-19: 96 npm Scripts — Many Are Aliases or One-Time Commands

**Location:** `package.json`

**Evidence:** 96 scripts found. Categories with likely redundancy:

- `audit:*` (7 scripts) — most call the same validation JS
- `docs:*` (9 scripts) — several are rarely-used checks
- `learning:*` (5 scripts) — dashboard, analyze, category, detailed, since
- `reviews:*` (4 scripts) — archive, check-archive, repair, sync

**Impact:** `npm run` output is overwhelming. Tab completion becomes useless.
New developers (or future AI sessions) cannot identify which scripts are
essential vs convenience aliases.

**Recommendation:** Group scripts into namespaces and add JSDoc-style comments
in package.json. Archive rarely-used scripts into a `scripts/` directory
Makefile or similar. Target <60 scripts.

---

#### AO-21: SKILL_INDEX.md (155 Lines) Likely Superseded by /find-skills

**Location:** `.claude/skills/SKILL_INDEX.md`

**Evidence:** A `find-skills` skill exists (`skills/find-skills/SKILL.md`, 147
lines) that presumably searches the skills registry dynamically.
`SKILL_INDEX.md` is a static 155-line index that must be manually kept in sync.

**Recommendation:** Verify that `/find-skills` is the canonical discovery
mechanism. If so, remove SKILL_INDEX.md or make it auto-generated as part of
`/session-end`.

---

#### AO-25: 7 Backup Hook Files Create Confusion

**Location:** `.claude/hooks/backup/`

**Evidence:** 7 JS files in `hooks/backup/` (analyze-user-request.js,
check-edit-requirements.js, check-mcp-servers.js, check-write-requirements.js,
coderabbit-review.js, pattern-check.js, session-start.js). These are never
executed (not in settings.json, not in backup hooks config).

**Recommendation:** Archive these to a git tag or branch comment, then delete
from the active directory. The git history preserves them if ever needed.

---

## 4. Token Budget Analysis

### 4.1 Per-Session Minimum Token Cost

The minimum tokens consumed before any actual work begins, in a typical session:

| Component                 | Tokens (est.) | Notes                                    |
| ------------------------- | ------------- | ---------------------------------------- |
| CLAUDE.md                 | ~1,600        | Always loaded (auto-import)              |
| claude.md                 | ~1,600        | Duplicate on Windows — should be deleted |
| SESSION_CONTEXT.md        | ~2,150        | "Read first every session"               |
| AI_WORKFLOW.md            | ~7,600        | "Read at session start"                  |
| Session-start hook output | ~500          | Status messages injected into context    |
| **Minimum total**         | **~13,450**   | Before any task begins                   |

After fixing AO-11 (delete claude.md) and AO-12 (make AI_WORKFLOW.md on-demand):

- **Reduced minimum: ~4,250 tokens** (68% reduction)

### 4.2 Per-Skill Invocation Cost

| Skill                  | Tokens (est.) | Can Be Reduced           |
| ---------------------- | ------------- | ------------------------ |
| `/system-test`         | ~18,000       | Yes — split to <5,000    |
| `/doc-optimizer`       | ~14,000       | Yes — split to <5,000    |
| `/audit-process`       | ~12,000       | Yes — split to <5,000    |
| `/multi-ai-audit`      | ~8,750        | Yes — split to <3,000    |
| `/audit-documentation` | ~8,750        | Merge with doc-optimizer |
| `/audit-comprehensive` | ~2,000        | Already thin — good      |
| Average small skill    | ~1,200        | Good                     |

### 4.3 Per-Agent Invocation Cost (When Spawned)

| Agent                    | Tokens (est.) | Notes                                     |
| ------------------------ | ------------- | ----------------------------------------- |
| `gsd-planner`            | ~36,900       | Needs refactoring                         |
| `gsd-debugger`           | ~32,500       | Needs refactoring                         |
| `fullstack-developer`    | ~32,000       | Too verbose                               |
| `test-engineer`          | ~24,750       | Likely OK for complexity                  |
| `gsd-project-researcher` | ~22,700       | Needs refactoring                         |
| `security-engineer`      | ~24,625       | Remove/reduce                             |
| Average compact agent    | ~1,500        | Examples: security-auditor, code-reviewer |

**GSD agent wave cost:** When 4 GSD agents spawn concurrently, they consume
~125,000+ tokens just for system prompts — before any work begins.

### 4.4 Hook Overhead (Per Session Estimate)

| Hook Trigger                    | Avg Fires/Session | Node.js Overhead  | Total             |
| ------------------------------- | ----------------- | ----------------- | ----------------- |
| SessionStart (3 hooks)          | 1                 | ~8 min (blocking) | ~8 min            |
| PostToolUse:Bash (2 hooks)      | ~100              | ~50ms each        | ~10 sec           |
| PostToolUse:Write/Edit (1 hook) | ~30               | ~100ms            | ~3 sec            |
| PostToolUse:Read (1 hook)       | ~40               | ~50ms             | ~2 sec            |
| UserPromptSubmit (1 hook)       | ~20               | ~50ms             | ~1 sec            |
| **Total estimated overhead**    | —                 | —                 | **~8 min 16 sec** |

The session-start hook dominates. Eliminating the blocking npm install/build
would reduce session startup from ~8 minutes to under 30 seconds.

---

## 5. Recommendations

### Priority 1: Immediate Wins (E0 — Zero Effort)

1. **Delete `claude.md`** (lowercase duplicate) — saves ~1,600 tokens/session
2. **Clean `.claude/tmp/`** — delete all `audit-result*.json` files (283 KB)
3. **Mark multi-ai-audit session-state.json as abandoned** — prevents state
   confusion
4. **Delete backup hook files** (`hooks/backup/*.js`) — reduce confusion
5. **Delete orphaned `hooks/state-utils.js`** (top-level, not in lib/) — reduce
   confusion

### Priority 2: High ROI, Low Effort (E1)

6. **Merge `commit-tracker.js` + `commit-failure-reporter.js`** into one Bash
   hook — saves ~50ms per Bash call, ~5 seconds per session
7. **Reduce `security-engineer.md`** to 80 lines of project-relevant content —
   saves ~20,000 tokens per invocation
8. **Merge `debugger.md` + `error-detective.md`** — simplify agent selection
9. **Implement rotation for `agent-research-results.md`** — cap at 20 KB
10. **Add agent-tracking comment to settings.json** listing which hooks are
    active

### Priority 3: Medium Effort, High Impact (E2)

11. **Split the top 4 oversized skills** (system-test, doc-optimizer,
    audit-process, multi-ai-audit) into thin entry points + referenced
    sub-documents. Target <300 lines each.
12. **Refactor session-start hook** to make npm install/build async — reduce
    cold start from ~8 minutes to <30 seconds
13. **Merge `/audit-documentation` + `/doc-optimizer`** into one skill with
    `--fix` flag
14. **Consolidate 6 `senior-*` skills** into one parameterized skill or
    base+override pattern
15. **Prune settings.local.json** — remove one-time commit approvals, cap at 50
    entries

### Priority 4: Large but Strategic (E3)

16. **Refactor GSD agent suite** to extract shared base instructions (~500
    lines) into a referenced document, reducing per-agent size to <400 lines
17. **Define mandatory vs optional session startup** — keep SESSION_CONTEXT.md
    as the only mandatory read; make AI_WORKFLOW.md and script runs opt-in
18. **Implement npm script taxonomy** — group into essential (≤30) vs advanced
    (≤30) and document in package.json

### Summary Impact Estimates

| Category               | Current Cost          | After Fixes | Reduction |
| ---------------------- | --------------------- | ----------- | --------- |
| Session startup tokens | ~13,450               | ~4,250      | 68%       |
| Session startup time   | ~8 min                | <1 min      | 88%       |
| Per-Bash hook overhead | ~100ms                | ~50ms       | 50%       |
| Large skill token cost | ~53,000               | ~15,000     | 72%       |
| Agent library bloat    | ~101,000 tokens total | ~35,000     | 65%       |

---

_End of AI Optimization Audit_
