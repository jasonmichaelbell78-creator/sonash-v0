# Schema Examples — 20 Worked Records

**Version:** 1.0 **Last Updated:** 2026-04-19 **Status:** ACTIVE **Purpose:**
Realistic registry records showing how schema fields fill in for actual files
across JASON-OS and SoNash.

**Prerequisite reading:**

- `SCHEMA.md` — master spec (26 universal columns, per-type extensions, enums)
- `../../piece-2-schema-design/DECISIONS.md` (project root-relative:
  `.planning/piece-2-schema-design/DECISIONS.md`) — D1–D32 rationale
- `EVOLUTION.md` — schema versioning rules
- `enums.json`, `schema-v1.json` — machine-readable counterparts

## Conventions used below

- **YAML-style** for readability. JSON equivalents are 1:1 (strings quoted,
  arrays `[…]`, objects `{…}`).
- `…` (ellipsis) = "other universal fields you'd fill in similarly" — used when
  the interesting bits of the example are elsewhere, to keep records short.
- **Real file paths** — every path below points to a real file in either
  JASON-OS or SoNash unless explicitly marked as a template/hypothetical.
- `content_hash` values shown are illustrative (truncated); the real registry
  records full SHA-256s.
- Migration-metadata shown as `null` most of the way down (native case), then
  POPULATED in Example 20.

---

## Example 1 — skill: checkpoint

**What this illustrates:** Simplest case — uniform universal skill, no sections,
tiny dependency set, portable as-is. This is what most records look like.

Real file: `.claude/skills/checkpoint/SKILL.md` (v2.0, 2026-02-14)

```yaml
name: checkpoint
path: .claude/skills/checkpoint/SKILL.md
type: skill
purpose: Save session state for recovery after compaction or session failure.
source_scope: universal
runtime_scope: project
portability: portable
status: active
dependencies: []
external_services: []
tool_deps: []
mcp_dependencies:
  - { name: "memory", hardness: "soft" } # only used with --mcp flag
required_secrets: []
lineage: null
supersedes: []
superseded_by: null
sanitize_fields: []
state_files:
  - { path: ".claude/state/handoff.json", access: "read-write" }
  - { path: ".claude/state/task-*.state.json", access: "read-write" }
notes: "MCP save path is opt-in via --mcp; default is local files only."
data_contracts:
  - {
      contract_name: "session-context-v5",
      target_file: "SESSION_CONTEXT.md",
      role: "producer",
      fields:
        [
          "Last Checkpoint",
          "Branch",
          "Working On",
          "Files Modified",
          "Next Step",
        ],
    }
  - {
      contract_name: "handoff-v1",
      target_file: ".claude/state/handoff.json",
      role: "producer",
      fields:
        ["timestamp", "git", "currentTask", "completedSteps", "pendingSteps"],
    }
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:a7f2…checkpoint"
composite_id: null
migration_metadata: null

# Per-type (skill) extensions
reference_layout: none # single SKILL.md, no REFERENCE.md
supports_parallel: true
fallback_available: false
```

**Notes:**

- `runtime_scope: project` (not `universal`) because the state files it writes
  live under a project's `.claude/state/`. Source code travels; runtime output
  is project-local.
- Dependencies-array empty of spawned agents — checkpoint is self-contained. The
  MCP dependency is `soft` because `--mcp` is optional.
- Two data_contracts: producer of both SESSION_CONTEXT.md's Quick-Recovery block
  and `handoff.json`.

---

## Example 2 — skill: deep-research

**What this illustrates:** Composite member with a rich dependency graph — one
skill that spawns 5 agent types and coordinates with convergence-loop + team.
Shows `composite_id` set, `component_units` with member references, and a dense
`dependencies` array.

Real file: `.claude/skills/deep-research/SKILL.md` (v2.0, 2026-04-05)

```yaml
name: deep-research
path: .claude/skills/deep-research/SKILL.md
type: skill
purpose:
  Multi-agent research engine — parallel searchers, gap pursuit, cross-model
  verification via Gemini CLI.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies:
  - { name: "deep-research-searcher", hardness: "hard", kind: "spawn" }
  - { name: "deep-research-verifier", hardness: "hard", kind: "spawn" }
  - { name: "deep-research-gap-pursuer", hardness: "hard", kind: "spawn" }
  - { name: "deep-research-synthesizer", hardness: "hard", kind: "spawn" }
  - { name: "deep-research-final-synthesizer", hardness: "hard", kind: "spawn" }
  - { name: "convergence-loop", hardness: "soft", kind: "invoke" } # verification pass
  - { name: "research-plan-team", hardness: "soft", kind: "spawn" } # when paired with /deep-plan
  - { name: "brainstorm", hardness: "soft", kind: "reference" } # routing-guide mention

external_services:
  - { name: "gemini-cli", hardness: "soft" } # cross-model verification, optional skip if unavailable

tool_deps:
  - { name: "gemini", hardness: "soft" } # CLI binary
  - { name: "bash", hardness: "hard" }
  - { name: "node", hardness: "hard" }

mcp_dependencies:
  - { name: "context7", hardness: "soft" } # searcher profile uses it when present
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/skills/deep-research/SKILL.md
  source_version: v3.4
  ported_date: 2026-03-01
supersedes: []
superseded_by: null

sanitize_fields: [] # portable, no per-repo sanitization
state_files:
  - { path: ".claude/state/deep-research.*.state.json", access: "read-write" }
notes:
  "Composite member — must port atomically with the 5 agents and state contract."

data_contracts:
  - {
      contract_name: "research-output-v2",
      target_file: ".research/<topic>/RESEARCH_OUTPUT.md",
      role: "producer",
      fields:
        ["topic", "claims", "challenges", "gaps", "verification", "sources"],
    }

component_units:
  - {
      name: "deep-research-searcher",
      path: ".claude/agents/deep-research-searcher.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-verifier",
      path: ".claude/agents/deep-research-verifier.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-gap-pursuer",
      path: ".claude/agents/deep-research-gap-pursuer.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-synthesizer",
      path: ".claude/agents/deep-research-synthesizer.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-final-synthesizer",
      path: ".claude/agents/deep-research-final-synthesizer.md",
      role: "member-agent",
    }
  - {
      name: "REFERENCE.md",
      path: ".claude/skills/deep-research/REFERENCE.md",
      role: "reference-doc",
    }

sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:de3a…dr-skill"

composite_id: deep-research-workflow # links to composites.jsonl
migration_metadata: null

# Per-type (skill) extensions
reference_layout: flat # REFERENCE.md lives beside SKILL.md at root of skill dir
supports_parallel: false # one /deep-research at a time per topic
fallback_available: true # falls back to solo Claude if agents fail
```

**Notes:**

- `dependencies` contains 8 entries — 5 spawned agents (hard) plus convergence-
  loop, team, and brainstorm (all soft because each has a without-this
  fallback).
- `composite_id` is set — this skill is the orchestrator of the composite
  `deep-research-workflow` (see Example 18).
- `runtime_scope: project` because output-writes land at `.research/<topic>/`
  inside the consuming project, not in user home.
- `lineage` populated because this skill was ported from SoNash v3.4 on
  2026-03-01.

---

## Example 3 — agent: deep-research-searcher

**What this illustrates:** Agent-specific per-type extensions (`model`,
`maxTurns`, `tools`, `color`, `runtime_lifecycle`), `composite_id` set to match
its orchestrator, no standalone invocation path.

Real file: `.claude/agents/deep-research-searcher.md`

```yaml
name: deep-research-searcher
path: .claude/agents/deep-research-searcher.md
type: agent
purpose:
  Profile-driven web/docs/codebase/academic searcher — writes FINDINGS.md with
  confidence + citations.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies: [] # no spawns; bottom of the spawn tree
external_services:
  - { name: "web-search", hardness: "hard" }
  - { name: "web-fetch", hardness: "hard" }
tool_deps: []
mcp_dependencies:
  - { name: "context7", hardness: "soft" }
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/agents/deep-research-searcher.md
  source_version: v2.1
  ported_date: 2026-03-01
supersedes: []
superseded_by: null
sanitize_fields: []
state_files:
  - { path: ".research/<topic>/findings/*.md", access: "write" }
  - { path: ".research/<topic>/sources.jsonl", access: "write" }

notes: "Spawned only by /deep-research; never user-invoked directly."
data_contracts:
  - {
      contract_name: "findings-v2",
      target_file: ".research/<topic>/findings/*.md",
      role: "producer",
      fields: ["claim", "confidence", "sources", "contradictions"],
    }
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:cb91…searcher"

composite_id: deep-research-workflow # matches parent skill
migration_metadata: null

# Per-type (agent) extensions
pipeline_phase: "Phase 1 — Parallel Research"
model: sonnet
maxTurns: null # unbounded
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - WebSearch
  - WebFetch
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
disallowedTools: null # null ≠ [] — not an explicit block, just unspecified
color: cyan
runtime_lifecycle: per-invocation
```

**Notes:**

- `null` vs `[]` for `disallowedTools` is deliberate per schema spec — null
  means "unspecified in frontmatter," `[]` means "explicitly none," explicit
  names means "blocked."
- `composite_id` points at the same string the orchestrator uses — this is how
  the sync engine walks membership.
- `runtime_lifecycle: per-invocation` — each spawn is a fresh agent instance.

---

## Example 4 — team: research-plan-team

**What this illustrates:** Team file using actual parser format (prettier-
ignore + bold + table), NOT HTML-comment metadata. This was SoNash SCHEMA_SPEC
HIGH-priority correction #1 from Piece 1b — the registry must reflect real
format, not the spec's guess.

Real file: `.claude/teams/research-plan-team.md` (v1.0, 2026-03-24)

```yaml
name: research-plan-team
path: .claude/teams/research-plan-team.md
type: team
purpose:
  Coordinates the deep-research → deep-plan pipeline when one topic flows
  through both phases.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies:
  - { name: "deep-research", hardness: "soft", kind: "reference" }
  - { name: "deep-plan", hardness: "soft", kind: "reference" }
  - { name: "convergence-loop", hardness: "soft", kind: "invoke" }
external_services: []
tool_deps:
  - { name: "bash", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/teams/research-plan-team.md
  source_version: v1.0
  ported_date: 2026-03-24
supersedes: []
superseded_by: null
sanitize_fields: []
state_files:
  - { path: ".claude/state/agent-token-usage.jsonl", access: "write" }

notes: |
  **Parser format (confirmed by Piece 1b HIGH correction #1):** This file
  does NOT use HTML-comment metadata. Metadata lives in the "Member Roster"
  Markdown table, fenced by `<!-- prettier-ignore-start/end -->` with bold
  column headers (per SoNash D22a). The schema's team parser (Piece 3) must
  target that format — the old SCHEMA_SPEC v1.0 claim of HTML-comment metadata
  was wrong and is superseded here.

data_contracts: []
component_units:
  - {
      name: "researcher",
      path: ".claude/teams/research-plan-team.md#researcher",
      role: "member-role",
    }
  - {
      name: "planner",
      path: ".claude/teams/research-plan-team.md#planner",
      role: "member-role",
    }
  - {
      name: "verifier",
      path: ".claude/teams/research-plan-team.md#verifier",
      role: "member-role",
    }
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:78a1…rpt"

composite_id: null # team is standalone, not part of a named composite
migration_metadata: null

# Per-type (team) extensions — same shape as agent (per Section 10)
pipeline_phase: null # teams coordinate multiple phases
model: mixed # see roster — sonnet for researcher/verifier, opus for planner
maxTurns: null
tools: [] # team itself has no tools; members carry them
disallowedTools: null
color: null
runtime_lifecycle: ephemeral # per research-plan cycle; TeamDelete after user approves plan
```

**Notes:**

- `pipeline_phase: null` + `runtime_lifecycle: ephemeral` captures the per-
  cycle nature — members don't outlive a research-plan run.
- `component_units` uses `member-role` path-fragment notation since team members
  are described in the same file, not separate files on disk.

---

## Example 5 — hook: block-push-to-main.js

**What this illustrates:** Hook per-type extensions: `event`, `matcher`,
`continue_on_error: false` (fail-closed for a safety gate),
`exit_code_action: block`, no kill-switch env (cannot be disabled without
removing the hook).

Real file: `.claude/hooks/block-push-to-main.js`

```yaml
name: block-push-to-main
path: .claude/hooks/block-push-to-main.js
type: hook
purpose:
  PreToolUse Bash gate that blocks `git push` targeting main/master branches.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies: []
external_services: []
tool_deps:
  - { name: "node", hardness: "hard" }
  - { name: "bash", hardness: "hard" } # run-node.sh wrapper
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/hooks/block-push-to-main.js
  source_version: v1.0 # Session #197 origin
  ported_date: 2026-01-20
supersedes: []
superseded_by: null
sanitize_fields: []
state_files: [] # pure deny-rule, writes no state

notes:
  "Enforces CLAUDE.md §4 guardrail #7 (never push without explicit approval).
  Fail-closed by design."

data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:44ee…blockpush"

composite_id: null
migration_metadata: null

# Per-type (hook) extensions
event: PreToolUse
matcher: "^[Bb]ash$"
if_condition: null # regex on normalized command is in the hook body, not settings.json
continue_on_error: false # fail-closed — transport errors pass, but parse/regex is authoritative
exit_code_action: block # exit 2 blocks the tool call
async_spawn: false
kill_switch_env: null # no override — safety gate
```

**Notes:**

- `continue_on_error: false` but the hook ITSELF fails-open on stdin transport
  errors (see lines 18–27) — schema field describes the hook's settings.json
  wiring, not internal robustness choices.
- `matcher: "^[Bb]ash$"` matches settings.json; tolerates the Claude Code idiom
  of sometimes lowercasing matcher strings.
- No `kill_switch_env` — this is a safety gate that shouldn't be skippable.

---

## Example 6 — hook-lib: symlink-guard.js

**What this illustrates:** hook-lib with cross-category imports (Piece 1a §2.3
Cluster C). Captures `has_copies_at` = [] (canonical only lives here) AND the
cross-boundary fact that scripts/lib/safe-fs.js imports this file across the
hooks/lib ↔ scripts/lib boundary.

Real file: `.claude/hooks/lib/symlink-guard.js`

```yaml
name: symlink-guard
path: .claude/hooks/lib/symlink-guard.js
type: hook-lib
purpose:
  Symlink-safety primitive used before every atomic write to prevent
  symlink-based clobbering.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies: [] # pure fs/path primitives; no registry refs out
external_services: []
tool_deps:
  - { name: "node", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/hooks/lib/symlink-guard.js
  source_version: v1.2
  ported_date: 2026-01-20
supersedes: []
superseded_by: null
sanitize_fields: []
state_files: []

notes: |
  **Piece 1a §2.3 Cluster C**: this file is THE cross-boundary import in the
  foundation — `scripts/lib/safe-fs.js` and `scripts/lib/security-helpers.js`
  both require() this path via a `..` walk up from scripts/lib into
  .claude/hooks/lib. That's the ONE cross-cluster edge in the foundation's
  dependency graph. Any move of this file requires updating both consumers.

data_contracts: []
component_units: []
sections: []
is_copy_of: null # no canonical elsewhere; THIS is canonical
has_copies_at: [] # despite the reach of safe-fs copies, symlink-guard itself has NO copies
content_hash: "sha256:91c2…symlink"

composite_id: null
migration_metadata: null

# Per-type (hook-lib) extensions — reuses hook fields even though it isn't directly wired
event: null # library, not a wired hook
matcher: null
if_condition: null
continue_on_error: null # N/A — not a direct settings.json hook
exit_code_action: null
async_spawn: false
kill_switch_env: null
```

**Notes:**

- `has_copies_at: []` — unlike `safe-fs.js` (Example 10), `symlink-guard.js` is
  never copied into skill-local subdirs. The cross-boundary import goes UP the
  tree from `scripts/lib/safe-fs.js` rather than having each safe-fs copy carry
  its own symlink-guard.
- Hook-lib event fields are null because this file isn't wired into
  settings.json — it's imported by things that are.

---

## Example 7 — memory: feedback_no_broken_widgets (SoNash-side)

**What this illustrates:** Memory file with MIXED content — universal "widgets
must ship complete" rule plus SoNash-specific examples (dashboard tabs 5 and 6,
velocity-log, commit-log). Sections make the portable lesson separable from the
product-specific wrapper.

Real file (SoNash):
`~/.claude/projects/C--Users-jason-…-sonash-v0/memory/feedback_no_broken_widgets.md`

```yaml
name: feedback_no_broken_widgets
path: ~/.claude/projects/<sonash-slug>/memory/feedback_no_broken_widgets.md
type: memory
purpose:
  "No broken widgets or partial tabs — universal principle wrapped in SoNash
  dashboard examples."
source_scope: user # lives in user-home memory dir
runtime_scope: user
portability: sanitize-then-portable
status: active

dependencies: []
external_services: []
tool_deps: []
mcp_dependencies: []
required_secrets: []

lineage: null # native memory file
supersedes: []
superseded_by: null
sanitize_fields:
  - "velocity-log" # SoNash-specific data source
  - "commit-log" # SoNash-specific data source
  - "Tabs 5 and 6" # SoNash dashboard-specific

state_files: []

notes: |
  MIXED-scope — the core rule ("ship complete or not at all") is universal
  and belongs on the canonical side; the SoNash examples (velocity-log,
  commit-log, Tabs 5 and 6) are product-specific and should NOT travel to
  JASON-OS verbatim. Sections[] makes that split explicit.

data_contracts: []
component_units: []
sections:
  - heading: "(preamble — rule statement)"
    last_known_lines: "5-7"
    scope: universal
    portability: portable
    purpose:
      "Core rule — ship tabs complete, no placeholder states or MVP stubs."
    sanitize_fields: []
    notes: "Safe to port as-is to JASON-OS canonical side."

  - heading: "Why"
    last_known_lines: "9-9"
    scope: universal
    portability: portable
    purpose: "Professional command center > prototype — trust argument."
    sanitize_fields: []
    notes: ""

  - heading: "How to apply"
    last_known_lines: "11-16"
    scope: project # SoNash-specific tabs/data sources
    portability: not-portable
    purpose:
      "Applies the rule to SoNash dashboard tabs 5–6, velocity-log, commit-log."
    sanitize_fields: ["velocity-log", "commit-log", "Tabs 5 and 6"]
    notes:
      "If ported, the 'How to apply' body needs rewriting against JASON-OS
      artifacts."

is_copy_of: null
has_copies_at: []
content_hash: "sha256:7e40…widgets"

composite_id: null
migration_metadata: null

# Per-type (memory) extensions
memory_type: feedback
tenet_number: null
has_canonical: true # JASON-OS also has a canonical counterpart (Example 8)
append_only: false
recency_signal: null
canonical_staleness_category: intentional-scope-difference
# ↑ the JASON-OS canonical only carries the universal rule portion; the SoNash
# side carrying product-specific examples is INTENDED, not drift.
```

**Notes:**

- `portability: sanitize-then-portable` at file level plus per-section
  `not-portable` on the SoNash-specific body — a section can override.
- `canonical_staleness_category: intentional-scope-difference` is the
  contrarian-HIGH-#4 enum value — prevents the sync tool from flagging this as
  "canonical is stale, re-sync!"
- `has_canonical: true` pairs with Example 8.

---

## Example 8 — canonical-memory: feedback_convergence_loops_mandatory

**What this illustrates:** Git-tracked canonical counterpart to a user-home
memory file. Same content substance, different scope + storage. Uniform (no
sections) because this file is pure universal rule.

Real file: `.claude/canonical-memory/feedback_convergence_loops_mandatory.md`

```yaml
name: feedback_convergence_loops_mandatory
path: .claude/canonical-memory/feedback_convergence_loops_mandatory.md
type: canonical-memory
purpose:
  "Every pass of significant work loops internally until converged — shortcuts
  cascade."
source_scope: universal
runtime_scope: user # runtime effect lands in the user's in-context memory injection
portability: portable
status: active

dependencies:
  - { name: "convergence-loop", hardness: "soft", kind: "reference" } # the skill that operationalizes this principle
external_services: []
tool_deps: []
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/canonical-memory/feedback_convergence_loops_mandatory.md
  source_version: v1.0
  ported_date: 2026-02-14
supersedes: []
superseded_by: null
sanitize_fields: []
state_files: []

notes: |
  Pure universal rule — no product-specific examples. Ports as-is between
  JASON-OS and SoNash. Corresponding user-home memory file carries the same
  text verbatim (no drift at last scan).

data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:3f82…convloops"

composite_id: null
migration_metadata: null

# Per-type (memory/canonical-memory) extensions
memory_type: feedback
tenet_number: null
has_canonical: false # this IS the canonical — field is intended for the user-home side
append_only: false
recency_signal: null
canonical_staleness_category: fresh
```

**Notes:**

- `has_canonical: false` on the canonical itself — the field is intended for
  user-home records pointing to "yes, there's a git version." On the git side
  the concept inverts.
- `canonical_staleness_category: fresh` — last sync confirmed user-home text
  matches canonical byte-for-byte.

---

## Example 9 — script: session-end-commit.js

**What this illustrates:** Entry-point script that shells out to git, writes
SESSION_CONTEXT.md, and uses `safe-fs.js`. `entry_point` + `shells_out` true;
`test_coverage` false (known gap).

Real file: `scripts/session-end-commit.js`

```yaml
name: session-end-commit
path: scripts/session-end-commit.js
type: script
purpose:
  Auto-commits SESSION_CONTEXT.md updates at session end and pushes to current
  branch.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies:
  - { name: "safe-fs", hardness: "hard", kind: "import" }
external_services: []
tool_deps:
  - { name: "node", hardness: "hard" }
  - { name: "git", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: scripts/session-end-commit.js
  source_version: v2.1 # post Review #217 execFileSync hardening
  ported_date: 2026-02-02
supersedes: []
superseded_by: null
sanitize_fields: []
state_files:
  - { path: "SESSION_CONTEXT.md", access: "read-write" }

notes: |
  Uses Node's execFileSync with args arrays (Review #217 pattern) — never
  shell-interpolates user input. Uses git rev-parse to resolve REPO_ROOT so
  the script works from any subdirectory inside the worktree.

data_contracts:
  - {
      contract_name: "session-context-v5",
      target_file: "SESSION_CONTEXT.md",
      role: "consumer",
      fields: ["Uncommitted Work"],
    }

component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:b12d…sesend"

composite_id: session-lifecycle
migration_metadata: null

# Per-type (script) extensions
entry_point: true
shells_out: true # spawns git via execFileSync
test_coverage: false # no corresponding *.test.js at scan time
module_system: cjs # require() + module.exports
```

**Notes:**

- `composite_id: session-lifecycle` — this script is one component of the
  session-lifecycle composite (session-begin + session-end + SESSION_CONTEXT.md
  contract + this commit script).
- `shells_out: true` via execFileSync with args-array — the schema captures the
  fact, not the hardening detail (that belongs in `notes`).
- `test_coverage: false` flags a known gap; CI/security checks still cover
  correctness via Review #217 pattern.

---

## Example 10 — script-lib: safe-fs.js

**What this illustrates:** The contrarian-HIGH-#5 case — a canonical script- lib
that's intentionally COPIED (not imported) into ~10 skill subdirs for
self-containment. `has_copies_at` carries every known copy path; `content_hash`
enables drift detection without reopening files.

Real file: `scripts/lib/safe-fs.js`

```yaml
name: safe-fs
path: scripts/lib/safe-fs.js
type: script-lib
purpose:
  Safe filesystem operation wrappers — symlink guard + EXDEV fallback +
  pre-rename rmSync + advisory locks.
source_scope: universal
runtime_scope: project
portability: portable
status: active

dependencies:
  - { name: "symlink-guard", hardness: "hard", kind: "import" } # cross-boundary: scripts/lib → .claude/hooks/lib (Piece 1a §2.3 Cluster C)
external_services: []
tool_deps:
  - { name: "node", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: scripts/lib/safe-fs.js
  source_version: v1.4
  ported_date: 2026-01-20
supersedes: []
superseded_by: null
sanitize_fields: []
state_files: []

notes: |
  NOT a privilege-boundary primitive — defense-in-depth only. See file-head
  TRUST MODEL block. Copies below are a DELIBERATE self-containment pattern
  (contrarian HIGH #5); use `content_hash` drift detection, not centralization.

data_contracts: []
component_units: []
sections: []

is_copy_of: null # THIS is canonical
has_copies_at:
  - ".claude/skills/session-begin/scripts/lib/safe-fs.js"
  - ".claude/skills/session-end/scripts/lib/safe-fs.js"
  - ".claude/skills/checkpoint/scripts/lib/safe-fs.js"
  - ".claude/skills/pre-commit-fixer/scripts/lib/safe-fs.js"
  - ".claude/skills/deep-research/scripts/lib/safe-fs.js"
  - ".claude/skills/deep-plan/scripts/lib/safe-fs.js"
  - ".claude/skills/brainstorm/scripts/lib/safe-fs.js"
  - ".claude/skills/pr-review/scripts/lib/safe-fs.js"
  - ".claude/skills/convergence-loop/scripts/lib/safe-fs.js"
  - ".claude/skills/skill-audit/scripts/lib/safe-fs.js"

content_hash: "sha256:5ab7…safefs"

composite_id: null # universal infra, not bound to a composite
migration_metadata: null

# Per-type (script-lib) extensions
entry_point: false # library — never invoked directly
shells_out: false
test_coverage: true # scripts/lib/safe-fs.test.js exists
module_system: cjs
```

**Notes:**

- `has_copies_at` listing ~10 paths validates the contrarian-HIGH-#5 pattern.
  Each copy record will carry `is_copy_of: scripts/lib/safe-fs.js` and its own
  content_hash so drift shows up as hash mismatch.
- Cross-boundary import: the `symlink-guard` dependency crosses from scripts/lib
  up into `.claude/hooks/lib` — Piece 1a §2.3 Cluster C's single cross-cluster
  edge.

---

## Example 11 — tool: statusline (Go binary)

**What this illustrates:** Multi-file Go tool with its own build system.
`source_scope: universal` (the Go source travels between repos), but
`runtime_scope: machine` (install target is per-machine, repo-name suffixed).
`requires_build: true`, `install_target` captures per-repo-name isolation.

Real dir: `tools/statusline/`

```yaml
name: jason-statusline
path: tools/statusline/ # tool record points at DIRECTORY
type: tool
purpose: JASON-OS Go statusline — 16 widgets, 3-line render, config-driven.
source_scope: universal
runtime_scope: machine # installed binary at ~/.claude/statusline/ per-machine
portability: portable-with-deps # portable Go source, but needs Go toolchain to rebuild
status: active

dependencies: []
external_services:
  - { name: "weather-api", hardness: "soft" } # optional, only for weather widget
tool_deps:
  - { name: "go", hardness: "hard" } # 1.26+ required to build
  - { name: "bash", hardness: "hard" } # build.sh
mcp_dependencies: []
required_secrets:
  - { name: "WEATHER_API_KEY", hardness: "soft" } # in config.local.toml, optional

lineage:
  source_project: sonash
  source_path: tools/statusline/
  source_version: v2.0 # JASON-OS rename to jason-statusline-v2 on port
  ported_date: 2026-02-20
supersedes: []
superseded_by: null
sanitize_fields:
  - "jason-statusline" # binary name — SoNash uses sonash-statusline
  - "JASON-OS" # branding in build.sh echoes
state_files: [] # binary does not write state

notes: |
  Source travels; binary and cache dir are machine-local and gitignored.
  Install dir is `~/.claude/statusline/` (shared across projects on one
  machine). See Piece 1a Finding #5.5: cache-dir names are repo-name-suffixed
  for isolation — so JASON-OS uses `cache-jason-os/` and SoNash uses
  `cache-sonash/` under the same install dir.

data_contracts: []
component_units:
  - { name: "main.go", path: "tools/statusline/main.go", role: "source-file" }
  - {
      name: "render.go",
      path: "tools/statusline/render.go",
      role: "source-file",
    }
  - {
      name: "widgets.go",
      path: "tools/statusline/widgets.go",
      role: "source-file",
    }
  - { name: "cache.go", path: "tools/statusline/cache.go", role: "source-file" }
  - {
      name: "config.go",
      path: "tools/statusline/config.go",
      role: "source-file",
    }
  - {
      name: "statusline_test.go",
      path: "tools/statusline/statusline_test.go",
      role: "test-file",
    }
  - {
      name: "config.toml",
      path: "tools/statusline/config.toml",
      role: "config",
    }
  - {
      name: "config.local.toml.example",
      path: "tools/statusline/config.local.toml.example",
      role: "config-template",
    }
  - { name: "build.sh", path: "tools/statusline/build.sh", role: "entry-point" }
  - { name: "go.mod", path: "tools/statusline/go.mod", role: "manifest" }
  - { name: "go.sum", path: "tools/statusline/go.sum", role: "manifest" }

sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:dir-agg:c1d7…statusline" # aggregate of member-file hashes

composite_id: null # tool is self-contained, not a named composite
migration_metadata: null

# Per-type (tool) extensions
language: go
requires_build: true
binary_present: true # jason-statusline.exe present at scan (machine-specific)
install_target: "~/.claude/statusline/jason-statusline-v2.exe"
secret_config_required: false # config.local.toml is optional
```

**Notes:**

- `install_target` captures the actual versioned binary name — the statusline-
  rebuild-safety memory says bump the filename and shim, so the target path
  encodes `-v2`.
- `binary_present: true` is observational — recomputed on every scan. Not a
  portability gate; a fresh clone would scan `false`.
- `component_units` lists every file in the tool directory, each with its own
  `role` (source-file / test-file / config / entry-point / manifest).

---

## Example 12 — research-session: piece-1a-discovery-scan-jason-os

**What this illustrates:** Research sessions are DIRECTORY records (not
single-file). `session_type`, `depth`, `claim_count`, `source_count` per-type
extensions capture the research-specific facts.

Real dir: `.research/sync-mechanism/piece-1a-discovery-scan-jason-os/`

```yaml
name: piece-1a-discovery-scan-jason-os
path: .research/sync-mechanism/piece-1a-discovery-scan-jason-os/
type: research-session
purpose:
  L1 discovery scan of JASON-OS — inventories every file in sync scope, surfaces
  204 edges and 15 composites.
source_scope: project # research products are project-specific artifacts
runtime_scope: project
portability: not-portable # findings describe THIS repo; wrong to copy into SoNash
status: complete # session closed after RESEARCH_OUTPUT.md delivered

dependencies:
  - { name: "deep-research", hardness: "hard", kind: "invoke" }
external_services:
  - { name: "gemini-cli", hardness: "soft" }
tool_deps:
  - { name: "gemini", hardness: "soft" }
  - { name: "node", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage: null # native research session
supersedes: []
superseded_by: null
sanitize_fields: []
state_files:
  - {
      path: ".claude/state/deep-research.piece-1a-discovery-scan-jason-os.state.json",
      access: "read-write",
    }

notes: |
  17 searcher agents + verifier + gap-pursuer + synthesizer. Finding #5.1
  content-bleed, #5.3 source/runtime scope split, #5.4 data_contracts, #5.5
  cache-dir naming, and Cluster C cross-boundary import are the key schema-
  relevant outputs. All fed Piece 2 directly.

data_contracts:
  - {
      contract_name: "research-output-v2",
      target_file: "RESEARCH_OUTPUT.md",
      role: "producer",
      fields:
        ["topic", "claims", "challenges", "gaps", "verification", "sources"],
    }

component_units:
  - {
      name: "RESEARCH_OUTPUT.md",
      path: ".research/sync-mechanism/piece-1a-discovery-scan-jason-os/RESEARCH_OUTPUT.md",
      role: "final-output",
    }
  - {
      name: "claims.jsonl",
      path: ".research/sync-mechanism/piece-1a-discovery-scan-jason-os/claims.jsonl",
      role: "append-log",
    }
  - {
      name: "findings/",
      path: ".research/sync-mechanism/piece-1a-discovery-scan-jason-os/findings/",
      role: "agent-outputs-dir",
    }
  - {
      name: "LEARNINGS.md",
      path: ".research/sync-mechanism/piece-1a-discovery-scan-jason-os/LEARNINGS.md",
      role: "post-session-learnings",
    }

sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:dir-agg:88e3…piece1a"

composite_id: null
migration_metadata: null

# Per-type (research-session) extensions
session_type: deep-research
depth: L1
claim_count: 204 # edges inventoried per RESEARCH_OUTPUT.md headline
source_count: 15 # composites identified (used here as "structured source count" proxy)
```

**Notes:**

- `portability: not-portable` — findings reference JASON-OS files by path and
  are meaningless when copied into SoNash. The METHOD (how to scan) is in
  `deep-research` skill; the OUTPUT is project-specific.
- `claim_count / source_count` reused here for headline counts per research
  session's structured output. Exact mapping is a Piece 3 decision; schema just
  reserves the fields.

---

## Example 13 — planning-artifact: piece-2-schema-design/DIAGNOSIS.md

**What this illustrates:** Planning-artifact with `plan_scope: diagnosis`.
Artifact is project-specific (about a particular piece), not universal.

Real file: `.planning/piece-2-schema-design/DIAGNOSIS.md`

```yaml
name: piece-2-schema-design-diagnosis
path: .planning/piece-2-schema-design/DIAGNOSIS.md
type: planning-artifact
purpose:
  Phase 0 diagnosis for Piece 2 schema design — frames the problem before
  Discovery.
source_scope: project
runtime_scope: project
portability: not-portable
status: complete

dependencies:
  - { name: "deep-plan", hardness: "hard", kind: "invoke" }
  - {
      name: "piece-1a-discovery-scan-jason-os",
      hardness: "hard",
      kind: "reference",
    }
  - {
      name: "piece-1b-discovery-scan-sonash",
      hardness: "hard",
      kind: "reference",
    }
external_services: []
tool_deps: []
mcp_dependencies: []
required_secrets: []

lineage: null
supersedes: []
superseded_by: null
sanitize_fields: []
state_files:
  - {
      path: ".claude/state/deep-plan.piece-2-schema-design.state.json",
      access: "read-write",
    }

notes: |
  Feeds DECISIONS.md and PLAN.md in the same directory. Part of the deep-plan
  artifact triad (DIAGNOSIS + DECISIONS + PLAN) for Piece 2.

data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:4412…p2diag"

composite_id: null
migration_metadata: null

# Per-type (planning-artifact) extensions
plan_scope: diagnosis
```

**Notes:**

- `plan_scope: diagnosis` is one of the 12 values in the §8.18 enum.
- Not-portable because it describes Piece 2's JASON-OS context; SoNash has no
  parallel piece.

---

## Example 14 — doc: CLAUDE.md

**What this illustrates:** MIXED-content doc with 4+ sections that have
different scopes. Stack (§1) is project-specific; Security Rules (§2),
Anti-Patterns (§5), and Agent/Skill Triggers (§7) are universal. Sections make
the per-section scope explicit so a port can copy universals and rewrite
project-specifics.

Real file: `CLAUDE.md` (v0.1, 2026-04-15 bootstrap, JASON-OS)

```yaml
name: CLAUDE.md
path: CLAUDE.md
type: doc
purpose: Core AI context + rules file loaded on every turn.
source_scope: project # NOTE: "mixed" is NOT a valid enum value — the 5-value enum is universal/user/project/machine/ephemeral. File-level picks the dominant/default scope; per-section overrides capture the mixing (see sections[] below). Real schema validation would reject "mixed".
runtime_scope: user # injected into every Claude conversation in this repo
portability: sanitize-then-portable
status: active

dependencies:
  - { name: "sanitize-error", hardness: "hard", kind: "reference" } # §2 helper reference
  - { name: "security-helpers", hardness: "hard", kind: "reference" }
  - { name: "safe-fs", hardness: "hard", kind: "reference" }
  - { name: "brainstorm", hardness: "hard", kind: "reference" } # §7 trigger
  - { name: "deep-plan", hardness: "hard", kind: "reference" }
  - { name: "deep-research", hardness: "hard", kind: "reference" }
  - { name: "session-begin", hardness: "hard", kind: "reference" }
  - { name: "checkpoint", hardness: "hard", kind: "reference" }
  - { name: "todo", hardness: "hard", kind: "reference" }
external_services: []
tool_deps:
  - { name: "gitleaks", hardness: "hard" } # §2 security pipeline
  - { name: "semgrep", hardness: "hard" }
  - { name: "node", hardness: "hard" }
  - { name: "go", hardness: "soft" } # statusline-only
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: CLAUDE.md
  source_version: v6.0
  ported_date: 2026-04-15 # bootstrap extraction + sanitization
supersedes: []
superseded_by: null

sanitize_fields:
  - "SoNash" # project-name references in prose
  - "JASON-OS" # flipped per repo
  - "Session #NN" # SoNash-era session numbers dropped

state_files: []
notes: |
  Mixed-scope — §1 Stack is project-specific; §2 Security, §5 Anti-Patterns,
  §7 Triggers are universal. This is the canonical example of a sections[]-
  populated file.

data_contracts: []
component_units: []

sections:
  - heading: "§1 Stack"
    last_known_lines: "22-47"
    scope: project
    portability: not-portable
    purpose:
      "Declares stack agnosticism + Node 22 Claude Code infra + Go-optional
      statusline."
    sanitize_fields: []
    notes: "Rewritten per downstream project when CLAUDE.md is ported."

  - heading: "§2 Security Rules"
    last_known_lines: "49-88"
    scope: universal
    portability: portable
    purpose:
      "Helpers at I/O boundaries + CI security pipeline list + no-secrets rule."
    sanitize_fields: []
    notes:
      "Gitleaks, Semgrep, CodeQL, Dep Review, Scorecard, SonarCloud, Qodo — same
      gates across both repos."

  - heading: "§4 Behavioral Guardrails"
    last_known_lines: "94-129"
    scope: universal
    portability: portable
    purpose:
      "16 non-negotiable rules with [GATE] / [BEHAVIORAL] / [MIXED] annotations."
    sanitize_fields: []
    notes: "Research G4 annotation scheme — universally applicable."

  - heading: "§5 Critical Anti-Patterns"
    last_known_lines: "131-146"
    scope: universal
    portability: portable
    purpose:
      "Error sanitization / path traversal / file reads / loop-regex / regex
      two-strikes."
    sanitize_fields: []
    notes: "Pure universal patterns — copy verbatim."

  - heading: "§7 Agent/Skill Triggers"
    last_known_lines: "158-177"
    scope: universal
    portability: portable
    purpose: "PRE-TASK trigger table + session boundaries + todos."
    sanitize_fields: []
    notes:
      "Table references to skill/agent names are universal (same names in both
      repos)."

is_copy_of: null
has_copies_at: []
content_hash: "sha256:22bf…claudemd"

composite_id: null
migration_metadata: null
```

**Notes:**

- File-level `source_scope: mixed` is a schema shorthand — authoritative
  per-section scope lives in `sections[]`. Piece 3 labeling will decide whether
  the file-level field accepts `mixed` as an explicit value or whether tooling
  derives it.
- This one file is worth Example 14 alone because it's the best-case
  illustration of sections[] being necessary (D17 rationale).

---

## Example 15 — config vs settings (side-by-side)

**What this illustrates:** The `config` vs `settings` distinction (D7). `.nvmrc`
is a generic dotfile (config). `.claude/settings.json` is Claude- Code-specific
(settings). Same repo, same file-type nominally (both text config), but
different `type` enum values because their consumers differ.

### 15a — config: .nvmrc

Real file: `.nvmrc`

```yaml
name: .nvmrc
path: .nvmrc
type: config
purpose: Pins Node.js version for nvm-compatible toolchains (Node 22).
source_scope: universal # Node version requirement is repo-wide
runtime_scope: project
portability: portable
status: active

dependencies: []
external_services: []
tool_deps:
  - { name: "nvm", hardness: "soft" } # consumers who have nvm use it; others read directly
  - { name: "node", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage: null
supersedes: []
superseded_by: null
sanitize_fields: [] # "22" is not project-specific
state_files: []
notes: "One-line file. SoNash counterpart carries the same value."
data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:0a1b…nvmrc"

composite_id: null
migration_metadata: null
# No per-type extensions defined for `config`.
```

### 15b — settings: .claude/settings.json

Real file: `.claude/settings.json`

```yaml
name: settings.json
path: .claude/settings.json
type: settings # Claude-Code-specific — NOT generic config
purpose:
  Claude Code harness configuration — permissions, env, hooks wiring, statusline
  command.
source_scope: project # permission lists and statusline command are project-specific
runtime_scope: project
portability: sanitize-then-portable
status: active

dependencies:
  # Every hook wired in this file becomes a hard dependency of settings.json
  - { name: "check-mcp-servers", hardness: "hard", kind: "invoke" }
  - { name: "compact-restore", hardness: "hard", kind: "invoke" }
  - { name: "block-push-to-main", hardness: "hard", kind: "invoke" }
  # … plus every other hook in the hooks{} block
external_services: []
tool_deps:
  - { name: "bash", hardness: "hard" } # run-node.sh wrapper
  - { name: "node", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/settings.json
  source_version: v5.2
  ported_date: 2026-02-05
supersedes: []
superseded_by: null
sanitize_fields:
  - "bash .claude/statusline-command.sh" # per-project statusline path
  - "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" # JASON-OS-specific toggle set, SoNash may differ
state_files: []
notes: |
  Sanitize deny-list entries and statusLine.command per repo. Hook names
  match across repos (universal skills/hooks); paths and wrapper script
  are repo-local.
data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:a3c7…settings"

composite_id: null
migration_metadata: null
# No per-type extensions defined for `settings` (the universal columns + hook
# dependency list carry the load).
```

**Notes:**

- The `config` vs `settings` split is D7 — `.nvmrc` is read by nvm, not by
  Claude; `.claude/settings.json` is the canonical Claude Code harness config.
  Separate types so tooling can query "all settings variants" independently of
  "all generic dotfiles."
- `.claude/settings.json` is the file where D31 composites-via-`composite_id`
  pay off indirectly: every hook name here is a registry entry, and the
  dependency list makes the graph explicit.

---

## Example 16 — ci-workflow: .github/workflows/semgrep.yml

**What this illustrates:** CI workflow per-type extensions — `trigger_events`,
`runner_os`, `action_pins` (SHA + tag), `secret_bearing: false` (uses
GITHUB_TOKEN only, no additional secrets).

Real file: `.github/workflows/semgrep.yml`

```yaml
name: semgrep
path: .github/workflows/semgrep.yml
type: ci-workflow
purpose:
  Weekly + PR/push Semgrep SAST scan with SARIF upload to GitHub code scanning.
source_scope: universal # same security gate in both repos
runtime_scope: project # runs against THIS repo's code
portability: portable
status: active

dependencies: [] # CI workflow is self-contained
external_services:
  - { name: "semgrep-registry", hardness: "hard" } # rules pulled from semgrep.dev
  - { name: "github-code-scanning", hardness: "hard" } # SARIF upload target
tool_deps: [] # runs inside container image
mcp_dependencies: []
required_secrets: [] # GITHUB_TOKEN auto-provisioned; no extra secrets

lineage:
  source_project: sonash
  source_path: .github/workflows/semgrep.yml
  source_version: v1.1
  ported_date: 2026-02-18
supersedes: []
superseded_by: null
sanitize_fields: []
state_files: []
notes:
  "Container image pinned to semgrep/semgrep:1.95.0 — bumped periodically per
  SonarCloud docker-tag advisory."
data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:cc98…semgrep"

composite_id: null
migration_metadata: null

# Per-type (ci-workflow) extensions
trigger_events:
  - push # branches: ["main"], paths-ignore: md/docs/templates/license
  - pull_request # branches: ["main"], same paths-ignore
  - schedule # "17 13 * * 3" — Wednesdays 13:17 UTC
runner_os: ubuntu-latest
action_pins:
  - {
      action: "actions/checkout",
      sha: "de0fac2e4500dabe0009e67214ff5f5447ce83dd",
      tag: "v6.0.2",
    }
  - {
      action: "github/codeql-action/upload-sarif",
      sha: "95e58e9a2cdfd71adc6e0353d5c52f41a045d225",
      tag: "v4.35.2",
    }
secret_bearing: false
```

**Notes:**

- `action_pins` carries BOTH sha and tag — sha is the trust anchor (what CI
  actually runs), tag is the human-readable intent (what bumps mean). Piece 5
  sync engine can cross-check.
- `trigger_events` is an array of just the event types — the `paths-ignore` and
  `branches` filters are workflow-body detail, not schema-captured.

---

## Example 17 — output-style: concise (template/hypothetical)

**What this illustrates:** Hypothetical record for a `.claude/output-styles/`
file since neither repo ships one yet. Shows the shape Piece 3 labeling will
target once the directory lands.

Hypothetical file: `.claude/output-styles/concise.md` (NOT CURRENTLY ON DISK)

```yaml
name: concise
path: .claude/output-styles/concise.md
type: output-style
purpose:
  Brevity-first tone/format override — short sentences, no filler, no emojis.
source_scope: universal
runtime_scope: user # output style is injected into the user's Claude-Code sessions
portability: portable
status: stub # not yet implemented; placeholder example

dependencies: []
external_services: []
tool_deps: []
mcp_dependencies: []
required_secrets: []

lineage: null # native template
supersedes: []
superseded_by: null
sanitize_fields: []
state_files: []

notes: |
  Template/hypothetical record — neither JASON-OS nor SoNash has an
  output-style file as of 2026-04-19. Enum value `output-style` (D13) is
  reserved for when the directory lands. Distinct from `doc` because the
  file modifies Claude behavior (config-like) rather than being prose for
  humans.

data_contracts: []
component_units: []
sections: []
is_copy_of: null
has_copies_at: []
content_hash: "sha256:(hypothetical)"

composite_id: null
migration_metadata: null
# No per-type extensions defined for `output-style` yet — Piece 3 labeling may
# propose `target_surface` (chat / statusline / audit-report) as an extension.
```

**Notes:**

- `status: stub` — real placeholder state, not `active`.
- Example exists to demonstrate a reserved-but-unpopulated type so downstream
  tooling knows what shape to expect when files arrive.

---

## Example 18 — composite: deep-research-workflow

**What this illustrates:** Composite record in `composites.jsonl` (separate
catalog, not `files.jsonl`). Reuses universal columns plus the 3 composite-
specific fields (`workflow_family`, `gsd_phase`, `port_strategy`). Components
listed by name + path so the sync engine can enforce atomic port.

```yaml
# composites.jsonl record
name: deep-research-workflow
type: composite # lives in composites.jsonl; not a file-record type
purpose:
  Atomic unit — /deep-research orchestrator + 5 agents + state contract +
  research-plan-team routing.
source_scope: universal
runtime_scope: project
portability: portable # travels atomically — all components or none
status: active

dependencies:
  - { name: "convergence-loop", hardness: "soft", kind: "invoke" }
external_services:
  - { name: "gemini-cli", hardness: "soft" }
tool_deps:
  - { name: "gemini", hardness: "soft" }
  - { name: "node", hardness: "hard" }
  - { name: "bash", hardness: "hard" }
mcp_dependencies:
  - { name: "context7", hardness: "soft" }
required_secrets: []

lineage:
  source_project: sonash
  source_path: .claude/skills/deep-research/
  source_version: v3.4
  ported_date: 2026-03-01
supersedes: []
superseded_by: null

notes: |
  Port-strategy atomic: the skill and its 5 member agents share a state
  contract (.claude/state/deep-research.<topic>.state.json) and a findings
  schema (FINDINGS.md + RESEARCH_OUTPUT.md). Partial ports silently break
  either spawn links or state reads.

data_contracts:
  - {
      contract_name: "research-output-v2",
      target_file: "RESEARCH_OUTPUT.md",
      role: "producer",
      fields:
        ["topic", "claims", "challenges", "gaps", "verification", "sources"],
    }
  - {
      contract_name: "findings-v2",
      target_file: "FINDINGS.md",
      role: "producer",
      fields: ["claim", "confidence", "sources", "contradictions"],
    }

component_units:
  - {
      name: "deep-research",
      path: ".claude/skills/deep-research/SKILL.md",
      role: "orchestrator-skill",
    }
  - {
      name: "deep-research-searcher",
      path: ".claude/agents/deep-research-searcher.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-verifier",
      path: ".claude/agents/deep-research-verifier.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-gap-pursuer",
      path: ".claude/agents/deep-research-gap-pursuer.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-synthesizer",
      path: ".claude/agents/deep-research-synthesizer.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-final-synthesizer",
      path: ".claude/agents/deep-research-final-synthesizer.md",
      role: "member-agent",
    }
  - {
      name: "deep-research-REFERENCE.md",
      path: ".claude/skills/deep-research/REFERENCE.md",
      role: "reference-doc",
    }
  - {
      name: "deep-research.state.json",
      path: ".claude/state/deep-research.<topic>.state.json",
      role: "state-contract",
    }

# Composite-specific fields (§9.10, D31)
workflow_family: deep-research
gsd_phase: null # not a GSD composite
port_strategy: atomic
```

**Notes:**

- Composite record reuses universal columns and ADDS the 3 composite-specific
  fields — per §7 SCHEMA spec.
- `component_units` is the source of truth for atomic-port membership. Each
  listed file's record in `files.jsonl` MUST carry
  `composite_id: deep-research-workflow` (cross-reference integrity check —
  Piece 5 sync engine will enforce).
- `port_strategy: atomic` — all or none, because spawn links and state contract
  break on partial port.

---

## Example 19 — composite: ecosystem-audit-workflow (SoNash)

**What this illustrates:** SoNash-only composite validating the shared-doc-lib
pattern — one orchestrator skill + 8 member audit skills + a shared prose-
library directory (`_shared/ecosystem-audit/`) + tests, all atomic-port.

```yaml
# composites.jsonl record (SoNash-side registry)
name: ecosystem-audit-workflow
type: composite
purpose:
  SoNash ecosystem audit — 9 audit skills coordinated via shared doc-lib,
  produces PR-ready audit reports.
source_scope: universal # the pattern is portable; no SoNash-product dependency at source level
runtime_scope: project # outputs land in a SoNash audit directory
portability: portable-with-deps # depends on SoNash audit-target data sources (velocity-log, commit-log, etc.)
status: active

dependencies:
  - { name: "convergence-loop", hardness: "soft", kind: "invoke" }
  - { name: "deep-research", hardness: "soft", kind: "reference" }
external_services: []
tool_deps:
  - { name: "node", hardness: "hard" }
  - { name: "bash", hardness: "hard" }
mcp_dependencies: []
required_secrets: []

lineage: null # native to SoNash, never ported from elsewhere
supersedes: []
superseded_by: null
notes: |
  Validates the shared-doc-lib pattern: the 9 skills all reference
  `_shared/ecosystem-audit/` for prose like rubrics, rating scales, and
  format guides — instead of duplicating those across each SKILL.md. The
  shared-doc-lib directory is a first-class component unit here.

data_contracts:
  - {
      contract_name: "ecosystem-audit-report-v1",
      target_file: ".audits/<audit-name>/AUDIT_REPORT.md",
      role: "producer",
      fields: ["scope", "findings", "rating", "recommendations"],
    }

component_units:
  - {
      name: "ecosystem-audit",
      path: ".claude/skills/ecosystem-audit/SKILL.md",
      role: "orchestrator-skill",
    }
  - {
      name: "ecosystem-audit-completeness",
      path: ".claude/skills/ecosystem-audit-completeness/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-consistency",
      path: ".claude/skills/ecosystem-audit-consistency/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-freshness",
      path: ".claude/skills/ecosystem-audit-freshness/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-surface-area",
      path: ".claude/skills/ecosystem-audit-surface-area/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-drift",
      path: ".claude/skills/ecosystem-audit-drift/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-debt",
      path: ".claude/skills/ecosystem-audit-debt/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-narrative",
      path: ".claude/skills/ecosystem-audit-narrative/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "ecosystem-audit-synthesis",
      path: ".claude/skills/ecosystem-audit-synthesis/SKILL.md",
      role: "member-skill",
    }
  - {
      name: "_shared/ecosystem-audit/",
      path: ".claude/skills/_shared/ecosystem-audit/",
      role: "shared-doc-lib",
    }
  - {
      name: "tests/",
      path: ".claude/skills/ecosystem-audit/tests/",
      role: "test-dir",
    }

workflow_family: ecosystem-audit
gsd_phase: null
port_strategy: atomic
```

**Notes:**

- The `shared-doc-lib` role on `_shared/ecosystem-audit/` maps to the D14 type
  enum value `shared-doc-lib` — first-class type for library prose.
- `portability: portable-with-deps` (not just `portable`) — the SKILLS can move,
  but they're wired to SoNash audit data sources. A port to JASON-OS would work
  structurally but produce empty reports until equivalent data sources exist.
- `lineage: null` — this composite is native to SoNash. JASON-OS doesn't have a
  counterpart yet.

---

## Example 20 — migration_metadata POPULATED: checkpoint post-port

**What this illustrates:** File record after a cross-repo port where
migration-metadata is POPULATED (not null). Shows
`version_delta_from_canonical`, `port_status: ported`, empty `dropped_in_port`
(clean port — nothing stripped beyond context skills that were sanitized).

```yaml
name: checkpoint
path: .claude/skills/checkpoint/SKILL.md
type: skill
purpose: Save session state for recovery after compaction or session failure.
source_scope: universal
runtime_scope: project
portability: portable
status: active
# … all universal fields as in Example 1 …

lineage:
  source_project: sonash
  source_path: .claude/skills/checkpoint/SKILL.md
  source_version: v2.0
  ported_date: 2026-02-14

migration_metadata:
  context_skills:
    - sonash-context # SoNash injection — stripped during JASON-OS port
  dropped_in_port: [] # no features removed
  stripped_in_port:
    - "Session #115 reference line" # SoNash-era session stamp in original
    - "SoNash-specific example under 'When to Use'"
  version_delta_from_canonical: "v2.0 → v2.0 (in-sync)"
  port_status: ported
```

**Contrast — native-case migration_metadata:**

At the top of any native record (a file that originated in this repo with no
port history), `migration_metadata` is simply `null`:

```yaml
name: (native-file-name)
# … universal fields …
lineage: null
migration_metadata: null
# → means: this file has no port history. Nothing to track.
```

**Notes:**

- `port_status` enum includes
  `ported | partial-port | sonash-only | jason-os-only | in-sync | not-ported-portable | not-ported-not-portable`
  per §8.21 — `ported` + `version_delta_from_canonical: "… (in-sync)"` means
  SoNash and JASON-OS both carry v2.0 with no drift at last scan.
- `context_skills` captures which skill injections got stripped. For SoNash →
  JASON-OS ports, `sonash-context` is the common one.
- Segregating these 5 fields into `migration_metadata` (per D32 and contrarian
  HIGH #1) keeps the core schema migration-agnostic. Native files just carry
  `null` and don't pay per-field overhead.

---

## Cross-references

- **Master schema:** `./SCHEMA.md`
- **Decisions:** `../../piece-2-schema-design/DECISIONS.md` (D1–D32)
- **Enums (machine-readable):** `./enums.json`
- **Validation schema:** `./schema-v1.json`
- **Evolution rules:** `./EVOLUTION.md`
- **Piece 1a scan (JASON-OS):**
  `.research/sync-mechanism/piece-1a-discovery-scan-jason-os/RESEARCH_OUTPUT.md`
- **Piece 1b scan (SoNash):**
  `.research/sync-mechanism/piece-1b-discovery-scan-sonash/RESEARCH_OUTPUT.md`
