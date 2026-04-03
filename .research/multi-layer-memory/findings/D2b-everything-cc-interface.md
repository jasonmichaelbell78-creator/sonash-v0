# Findings: Deep Analysis of everything-claude-code and interface-design Repositories

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ2

---

## Key Findings

### REPO 1: affaan-m/everything-claude-code

---

#### 1. Purpose and Problem Being Solved [CONFIDENCE: HIGH]

everything-claude-code (ECC) is an agent harness performance optimization system
built at the Claude Code Hackathon (Cerebral Valley x Anthropic, Feb 2026). It
addresses the problem that Claude Code, Cursor, Codex, and OpenCode are
individually powerful but lack consistent structure, memory, security
guardrails, and cross-session learning out of the box.

Its core thesis: treat agent inconsistency as an engineering problem requiring
structural guardrails, not prompt optimization. By adding hooks, skills,
instincts, agents, rules, and session infrastructure, ECC turns a raw AI coding
tool into a reliable production harness.

As of March 2026 (v1.9.0), it has 124,000+ stars, 16,300+ forks, 1,002 commits,
and 30+ contributors. It is one of the most-starred Claude Code plugins in
existence [1][2].

---

#### 2. Repository Architecture [CONFIDENCE: HIGH]

ECC is a large multi-component system with the following top-level structure
[3]:

```
agents/          30 specialized subagents
commands/        60+ slash commands
contexts/        Dynamic prompt injection
docs/            Architecture docs
ecc2/            Next-gen Rust TUI implementation (Cargo.toml present)
examples/        Sample project configurations
hooks/           hooks.json + README
manifests/       Install manifests
mcp-configs/     mcp-servers.json (24 preconfigured servers)
plugins/         Plugin implementations
research/        Research documentation
rules/           Always-follow coding guidelines per language
schemas/         JSON/YAML schemas
scripts/         27 Node.js utilities (hooks, sessions, CLI)
skills/          136+ workflow definitions
tests/           1282 tests, 98% coverage
.claude/         Claude Code settings
.claude-plugin/  Plugin manifests
.codex-plugin/   Codex integration
.cursor/         Cursor IDE settings
.opencode/       OpenCode plugin
```

The system supports Claude Code, Cursor, Codex, OpenCode, and Kiro through
parallel configuration directories.

---

#### 3. Memory and Context Persistence Architecture [CONFIDENCE: HIGH]

ECC implements a multi-layered memory system:

**Layer 1 — Session Files (Markdown)**

- Sessions stored as markdown files in `~/.claude/session-data/`
- Filename pattern: `YYYY-MM-DD-<short-id>-session.tmp`
- Each file captures: project name, git branch, worktree path, goals, results,
  what failed (critical), file state table, architecture decisions
- Legacy read path: `~/.claude/sessions/`
- Aliases stored in `~/.claude/session-aliases.json` [4]

**Layer 2 — Instincts (YAML with confidence scoring)**

- Stored at `~/.claude/homunculus/instincts/` (global) and
  `~/.claude/homunculus/projects/<project-id>/instincts/` (project-scoped)
- Format: `id`, `trigger`, `confidence` (0.3–0.9), `domain` tag (code-style,
  testing, git, debugging)
- Project instincts override global on ID collision
- Import/export via YAML archives with `--domain`, `--min-confidence`, `--scope`
  flags
- Enable team sharing of learned coding patterns [5]

**Layer 3 — Learned Skills (Markdown)**

- Stored at `~/.claude/skills/learned/` (global) or `.claude/skills/learned/`
  (project-scoped)
- Created by the `/learn-eval` command via a quality gate process
- Format: name, description, origin marker, Problem, Solution with code, trigger
  conditions
- Global storage preferred when uncertain; project for configuration-specific
  patterns [6]

**Layer 4 — SQLite State Store (v1.9.0+)**

- Introduced in v1.9.0 for session/skill/decision tracking
- Also used in ECC 2.0 runtime layer for workspace state and agent registry
- Provides structured query capability via CLI (`sessions-cli.js`) [7]

**Layer 5 — ECC 2.0 Knowledge Graph (proposed/in-progress)**

- Issue #1049 proposes a SQLite-backed knowledge graph: Entities + Relations +
  Observations
- Would absorb Hermes and OpenClaw memory architectures
- Adds memory compaction and relevance scoring to prevent unbounded growth [8]

---

#### 4. Hook-Based Memory Lifecycle [CONFIDENCE: HIGH]

The hooks system (`hooks/hooks.json`, 331 lines) drives memory capture
automatically [9]:

| Hook Type    | Memory-Relevant Behavior                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| SessionStart | Load previous session context, detect project/package manager, inject most-recent session summary |
| PreToolUse   | Capture tool observations (async, 10s timeout), suggest compaction at intervals                   |
| PostToolUse  | PR tracking, build analysis, async pattern extraction, governance event capture                   |
| Stop         | Persist session state, extract patterns, track token/cost metrics                                 |
| SessionEnd   | Lifecycle markers, background session evaluation                                                  |
| PreCompact   | Strategic context reduction suggestions                                                           |

**Active bug (as of 2026-03-31):** Issue #1053 — `session-start.js` injects the
most-recent session regardless of current working directory. Project and
worktree metadata is written by `session-end.js` but never used for filtering on
start. This causes cross-project context contamination. Fix proposed:
`selectMatchingSession()` prioritizing worktree match > project name match >
most recent fallback [10].

---

#### 5. Instinct Learning Lifecycle (Continuous Learning v2) [CONFIDENCE: HIGH]

The learning pipeline works as follows [6][11]:

1. **Observation capture**: Hooks (100% reliable) capture every tool use and
   output — supersedes v1 which used probabilistic skills (50-80% fire rate)
2. **Pattern detection**: Background observer analysis loop (`observe.sh`)
   processes `observations.jsonl`
3. **Quality gate via `/learn-eval`**: Four extraction categories — error
   resolution, debugging methodologies, library workarounds, project
   conventions. Verdict options: Save / Improve then Save / Absorb into existing
   / Drop
4. **Instinct promotion**: When 5+ instincts accumulate in a domain, evolution
   can propose specialist agent or full skill (`/evolve`)
5. **Pruning**: Low-confidence patterns expire via `/prune`

**Active bug:** Issue #1018 — `run-with-flags-shell.sh` doesn't pass phase arg
to `observe.sh`, so all observations are recorded as `tool_complete` regardless
of actual phase.

---

#### 6. MCP Server Integration [CONFIDENCE: HIGH]

ECC pre-configures 24 MCP servers in `mcp-configs/mcp-servers.json` [12]:

Memory-relevant servers:

- `memory`: "Persistent memory across sessions"
- `omega-memory`: Semantic search with multi-agent coordination
- `sequential-thinking`: Chain-of-thought reasoning
- `token-optimizer`: Context window optimization
- `context7`: Documentation lookup

Also includes filesystem, database (supabase, clickhouse), deployment (vercel,
railway), web scraping (firecrawl, playwright), and security (insaits) servers.

---

#### 7. Integration Mechanism with Claude Code [CONFIDENCE: HIGH]

ECC integrates via multiple vectors [3][9]:

- **Plugin marketplace**:
  `/plugin marketplace add affaan-m/everything-claude-code`
- **hooks.json**: Registered with Claude Code for lifecycle event triggers
- **CLAUDE.md injection**: Project-level and user-level `~/.claude/CLAUDE.md`
  for baseline context
- **Rules installation**: `install.sh --profile full` copies rules to
  `~/.claude/rules/` (this must be done manually — plugin system cannot copy
  rules)
- **Agent YAML files**: `agent.yaml` in root, plus per-agent YAMLs in `agents/`
- **Cross-platform**: Works on Windows, macOS, Linux via Node.js scripts

---

#### 8. ECC 2.0 Architecture (Rust TUI — In Development) [CONFIDENCE: MEDIUM]

`ecc2/` contains a Rust project (Cargo.toml + Cargo.lock). The architecture
document describes:

- **Daemon layer**: Persists across TUI restarts, handles terminal sessions, git
  operations, agent supervision
- **Runtime layer (library)**: Workspace state, agent registry, status
  detection, SQLite persistence
- **TUI layer (ratatui)**: User-facing dashboard with diff viewing, communicates
  via Unix socket
- SSH-compatible (terminal-native vs. desktop competitors)
- Single 3.4MB binary with no runtime dependencies [13]

---

#### 9. Strengths [CONFIDENCE: HIGH]

- **Scale and community**: 124K stars, 1,282 tests, 98% coverage — battle-tested
  by large user base
- **Cross-tool portability**: Single config deploys across Claude Code, Cursor,
  Codex, OpenCode
- **Security enforcement**: Hook-based blocking of git bypass flags, secret
  leaks, config tampering, linter modification
- **Selective installation**: Language-specific profiles prevent unnecessary
  overhead
- **Instinct portability**: YAML export/import enables team-wide pattern sharing
- **Layered memory**: Five distinct memory layers from session markdown up to
  (proposed) knowledge graph
- **Hook reliability**: v2 observation via hooks is 100% reliable vs. v1
  probabilistic skills

---

#### 10. Weaknesses and Limitations [CONFIDENCE: HIGH]

- **Session injection bug**: Current SessionStart hook contaminates context
  across projects (Issue #1053, unfixed as of 2026-03-31) [10]
- **Observation phase bug**: All observations recorded as `tool_complete` (Issue
  #1018) [10]
- **Manual rules installation required**: Plugin system limitation — rules
  cannot be auto-installed, requiring explicit `install.sh` run
- **Codex limitations**: No hook execution support on Codex; instruction-based
  only
- **OpenCode feature gap**: 12 agents vs. 28 on Claude Code; 31 commands vs. 60
- **Knowledge graph is proposed**: Deep memory layer (Issue #1049) is
  in-progress, not shipped
- **Instinct system complexity**: High learning curve; the homunculus/instincts
  architecture requires understanding multiple concepts before being useful
- **Observer loop risk**: Documented "observer loop prevention with 5-layer
  guard" suggests this is a known reliability issue

---

#### 11. Novel Ideas Worth Adopting [CONFIDENCE: HIGH]

- **Instinct confidence scoring (0.3–0.9)**: Atomic behavioral rules with
  weighted confidence rather than binary on/off memory — allows gradual
  accumulation and pruning
- **Instinct evolution pathway**: Instincts cluster → skill → command → agent.
  Memory becomes progressively more capable as patterns solidify
- **Hook reliability over skill observation**: v2 insight that hooks are 100%
  reliable vs. probabilistic skill invocations is architecturally important
- **Session file "What Did NOT Work" section**: Deliberately surfaces failed
  approaches to prevent future sessions from repeating them — this is a
  high-value memory pattern
- **Dual-scope storage**: Every memory type has both global (`~/.claude/`) and
  project-scoped (`.claude/`) variants with explicit override rules
- **Team instinct sharing via YAML export**: Portable pattern libraries for
  organizational knowledge transfer
- **Session adapter contract**: Versioned schema (`ecc.session.v1`) normalizing
  multiple session sources into a single canonical snapshot — enables future UI
  layers without harness dependency

---

### REPO 2: Dammyjay93/interface-design

---

#### 12. Purpose and Problem Being Solved [CONFIDENCE: HIGH]

interface-design is a Claude Code plugin that solves a specific, narrow problem:
UI design decisions drift across sessions. When Claude builds UI components
across multiple sessions, it has no memory of prior spacing values, color
choices, depth strategy, or surface elevation — resulting in inconsistent
interfaces.

The plugin provides "craft, memory, and enforcement for consistent UI" for
dashboards, admin panels, SaaS apps, and tools. It explicitly excludes
marketing/landing pages.

As of February 2026 (v2026.2.9), it has 4,300 stars and 297 forks [14][15].

---

#### 13. Architecture [CONFIDENCE: HIGH]

The repo is minimal (Shell: 100%) with this structure [14]:

```
.claude/
  commands/       5 command files (init, status, audit, extract, critique)
  skills/
    interface-design/
      SKILL.md    Core skill definition
      references/ Reference material
.claude-plugin/
  plugin.json     Plugin manifest (name, version, paths)
  marketplace.json
reference/
  system-template.md   Template for system.md
  examples/
    system-precision.md  Completed example (Precision & Density direction)
    system-warmth.md     Completed example (Warmth & Approachability direction)
```

The plugin.json has a **known path bug**: it specifies `./.claude/commands` and
`./.claude/skills` but working plugins need these at the repository root level.
Issue #13 documents this causing commands/skills to not appear in Claude Code's
slash menu [16].

---

#### 14. Memory Storage Backend [CONFIDENCE: HIGH]

Storage is a single flat markdown file: `.interface-design/system.md` at the
project root.

The file stores [15][17]:

| Section   | Contents                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Direction | Personality type (6 options), foundation (warm/cool/neutral/tinted), depth (borders-only/subtle-shadows/layered-shadows)                    |
| Tokens    | Spacing base + scale, CSS custom property color values, radius scale, typography (families, sizes, weights)                                 |
| Patterns  | Component specs: Button (height, padding, radius, font, weight), Card (border, padding, radius, shadow), Table Cell (padding, font, border) |
| Decisions | Table with Decision, Rationale, Date columns                                                                                                |

Example from `system-precision.md` [17]:

- Spacing: 4px base, scale 4/8/12/16/24/32
- Radius: 4px/6px/8px (sharp, technical aesthetic)
- Typography: System fonts, 11-18px scale, monospace for data

---

#### 15. Memory Types [CONFIDENCE: HIGH]

interface-design supports exactly one memory type: **project-scoped design
system state**. There is no global/user-level memory, no cross-project sharing,
no instinct learning, and no session history. It is purpose-built for a single
narrow use case.

---

#### 16. Retrieval Mechanism [CONFIDENCE: HIGH]

The SKILL.md defines a conditional loading pattern [18]:

```
IF project has .interface-design/system.md:
  READ and APPLY existing decisions immediately
ELSE:
  FOLLOW full exploration workflow
```

When system.md exists, it is treated as authoritative. Claude reads and applies
all values without re-asking. When absent, the skill runs a 4-phase exploration:
domain vocabulary → color world → signature element → default patterns to
reject.

The `/interface-design:extract` command can bootstrap system.md by analyzing
existing UI files: it globs for tsx/jsx/vue/svelte, parses repeated
spacing/radius/border values by frequency, and presents findings for user
confirmation before writing [19].

---

#### 17. Cross-Session Persistence Mechanism [CONFIDENCE: HIGH]

Persistence is entirely passive: system.md is a committed file in the project
repository. It persists because git tracks it. There are no hooks, no background
processes, and no active serialization.

The workflow:

1. First session: Skill runs exploration, builds component, offers to save →
   writes `.interface-design/system.md`
2. Subsequent sessions: SKILL.md checks for file existence, reads it, applies
   values immediately
3. User explicitly calls `/interface-design:status` to verify what's loaded

This is the simplest possible persistence model — a human-readable markdown file
that Claude reads like documentation.

---

#### 18. Integration with Claude Code [CONFIDENCE: HIGH]

The plugin integrates via:

- **Plugin marketplace**: `/plugin marketplace add Dammyjay93/interface-design`
  (recommended)
- **Manual**: Clone repo, copy `.claude/` and `.claude-plugin/` directories
- **SKILL.md**: Loaded by Claude Code as a skill definition — triggers design
  workflow
- **Commands**: `/interface-design:init`, `/interface-design:status`,
  `/interface-design:audit`, `/interface-design:extract`

The SKILL.md was made fully self-contained in v2026.2.8 with all reference
content inlined, enabling compatibility with the Vercel skills marketplace and
multiple AI agents [20].

---

#### 19. The Design Skill's Novel Anti-Default Methodology [CONFIDENCE: HIGH]

The skill contains a distinctive methodology for preventing generic AI output
[18]:

Before any visual work, the skill mandates four required outputs:

1. **Domain concepts** (5+ vocabulary items from the product's actual domain —
   not generic "users")
2. **Color world** (5+ colors native to the domain — not default Tailwind
   palettes)
3. **Signature element** (one visually/structurally unique identifier for the
   product)
4. **Default patterns to reject** (3 obvious choices explicitly named and
   avoided)

Then before showing the user any component, four mandatory evaluation tests run:

- **Swap test**: Would changing the typeface or layout feel different? (If no,
  it's too generic)
- **Squint test**: Is hierarchy perceivable when blurred?
- **Signature test**: Can you point to 5 specific elements embodying the design
  direction?
- **Token test**: Do CSS variable names sound product-specific?

This is a prompt-engineering approach to memory that encodes quality criteria
rather than just data.

---

#### 20. Strengths [CONFIDENCE: HIGH]

- **Simplicity**: A single markdown file is the entire memory system — zero
  infrastructure, zero dependencies
- **Human-readable**: Design system state can be read, edited, and
  version-controlled by the team
- **Fast to load**: No query, no vector search — Claude reads a <100 line
  markdown file
- **Self-contained SKILL.md**: Works across multiple AI agents (Claude Code,
  Vercel AI, etc.) without path resolution
- **Bootstrap from existing code**: `/extract` command infers design tokens from
  codebase frequency analysis
- **Principled quality gates**: Anti-default evaluation tests prevent generic AI
  output
- **Decision rationale preservation**: The `Decisions` table stores why choices
  were made, not just what they are

---

#### 21. Weaknesses and Limitations [CONFIDENCE: HIGH]

- **Plugin loading bug**: Skills/commands don't appear in Claude Code slash menu
  due to path misconfiguration in plugin.json (Issue #13, open as of 2026-03-31)
  [16]
- **Domain scope too narrow**: Only works for product UI — explicitly excludes
  marketing/landing pages. Single-purpose tool
- **No active loading mechanism**: Claude must read SKILL.md and check for
  system.md on every session — relies on Claude following the IF/ELSE logic
  correctly, which is probabilistic
- **No versioning of design decisions**: system.md is a flat file; no history of
  how the design evolved unless git history is consulted
- **No cross-project design token sharing**: If a team has a shared design
  language across products, each project gets its own isolated system.md
- **No enforcement layer beyond audit command**: Drift between system.md and
  actual code is only caught if someone runs `/interface-design:audit`
- **6 fixed design directions**: The personality taxonomy (Precision & Density,
  Warmth & Approachability, etc.) is opinionated and may not fit all products
- **No active memory loading**: Unlike hook-based systems, there's no guarantee
  the skill fires every session — depends on user invoking design-related
  commands

---

#### 22. Novel Ideas Worth Adopting [CONFIDENCE: HIGH]

- **Design decision rationale table**: `system.md` stores not just what values
  were chosen but why, with dates. This is a memory pattern applicable to any
  domain where decisions need context
- **Frequency analysis for memory bootstrapping**: The `/extract` command infers
  implicit conventions from codebase patterns (e.g., "padding: 8px used 23x vs.
  12px used 3x → base unit is 8"). This reverse-engineering approach to seeding
  memory is highly novel
- **Principled rejection**: Explicitly naming default patterns to avoid is more
  memory-effective than documenting what to do — it defines the negative space
  of the design system
- **6 predefined personality tokens**: Constraining direction choices to 6 named
  archetypes simplifies the memory state while covering the design space.
  Applied to code: a similar small taxonomy of "project personalities"
  (strict/pragmatic/exploratory) could frame decision memory
- **Self-contained skill that works cross-platform**: The approach of inlining
  all reference content into SKILL.md for portability is directly applicable to
  any skill that might run in multiple agent environments

---

## Sources

| #   | URL                                                                                                 | Title                                | Type     | Trust  | CRAAP | Date       |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------ | -------- | ------ | ----- | ---------- |
| 1   | https://github.com/affaan-m/everything-claude-code                                                  | ECC Main Repo                        | official | HIGH   | 4.8   | 2026-03    |
| 2   | https://www.augmentcode.com/learn/everything-claude-code-github                                     | ECC Hits 100K Stars                  | analysis | MEDIUM | 3.8   | 2026-03    |
| 3   | https://github.com/affaan-m/everything-claude-code/tree/main                                        | ECC File Tree                        | official | HIGH   | 4.8   | 2026-03    |
| 4   | https://github.com/affaan-m/everything-claude-code/blob/main/commands/sessions.md                   | Sessions Command                     | official | HIGH   | 4.8   | 2026-03    |
| 5   | https://github.com/affaan-m/everything-claude-code/blob/main/commands/instinct-export.md            | Instinct Export Command              | official | HIGH   | 4.8   | 2026-03    |
| 6   | https://github.com/affaan-m/everything-claude-code/blob/main/skills/continuous-learning/SKILL.md    | Continuous Learning Skill            | official | HIGH   | 4.8   | 2026-03    |
| 7   | https://github.com/affaan-m/everything-claude-code/releases                                         | ECC Releases                         | official | HIGH   | 4.9   | 2026-03    |
| 8   | https://github.com/affaan-m/everything-claude-code/issues/1049                                      | Issue #1049: Deep Memory Layer       | official | HIGH   | 4.5   | 2026-03-31 |
| 9   | https://github.com/affaan-m/everything-claude-code/blob/main/hooks/hooks.json                       | hooks.json                           | official | HIGH   | 4.9   | 2026-03    |
| 10  | https://github.com/affaan-m/everything-claude-code/issues/1053                                      | Issue #1053: SessionStart Bug        | official | HIGH   | 4.9   | 2026-03-31 |
| 11  | https://github.com/affaan-m/everything-claude-code/blob/main/commands/learn-eval.md                 | Learn-Eval Command                   | official | HIGH   | 4.8   | 2026-03    |
| 12  | https://github.com/affaan-m/everything-claude-code/blob/main/mcp-configs/mcp-servers.json           | MCP Servers Config                   | official | HIGH   | 4.9   | 2026-03    |
| 13  | https://github.com/affaan-m/everything-claude-code/blob/main/docs/ECC-2.0-REFERENCE-ARCHITECTURE.md | ECC 2.0 Architecture                 | official | HIGH   | 4.5   | 2026-03    |
| 14  | https://github.com/Dammyjay93/interface-design                                                      | interface-design Main Repo           | official | HIGH   | 4.8   | 2026-03    |
| 15  | https://github.com/Dammyjay93/interface-design/blob/main/README.md                                  | interface-design README              | official | HIGH   | 4.8   | 2026-03    |
| 16  | https://github.com/Dammyjay93/interface-design/issues/13                                            | Issue #13: Plugin Skills Not Loading | official | HIGH   | 4.9   | 2026-03    |
| 17  | https://github.com/Dammyjay93/interface-design/blob/main/reference/examples/system-precision.md     | system-precision Example             | official | HIGH   | 4.8   | 2026-03    |
| 18  | https://github.com/Dammyjay93/interface-design/blob/main/.claude/skills/interface-design/SKILL.md   | interface-design SKILL.md            | official | HIGH   | 4.9   | 2026-03    |
| 19  | https://github.com/Dammyjay93/interface-design/blob/main/.claude/commands/extract.md                | Extract Command                      | official | HIGH   | 4.8   | 2026-03    |
| 20  | https://github.com/Dammyjay93/interface-design/releases                                             | interface-design Releases            | official | HIGH   | 4.9   | 2026-02    |
| 21  | https://github.com/humanplane/homunculus                                                            | Homunculus Repo                      | official | HIGH   | 4.5   | 2026-03    |

---

## Contradictions

**ECC Instincts vs. Homunculus**: The ECC codebase references
`~/.claude/homunculus/` as the storage path for instincts, and the
continuous-learning skill describes the homunculus architecture. However,
Homunculus is a **separate repository** by a different author
(humanplane/homunculus) [21]. It is unclear whether ECC vendors the homunculus
concept independently or delegates to the humanplane plugin. The instinct
storage paths match between the two projects, suggesting ECC either absorbed or
copied the architecture. This could mean instinct behavior differs depending on
whether both are installed.

**interface-design path bug vs. README claim**: The README and plugin
documentation state the plugin installs via marketplace and works correctly.
Issue #13 documents that it does NOT work correctly — commands don't appear in
the slash menu due to the plugin.json path configuration error. The README has
not been updated to reflect this bug. Users following the documented
installation path will experience a broken experience.

**ECC "100% reliable" observation claim vs. active bugs**: The
continuous-learning-v2 documentation claims hooks provide "100% reliable"
observation vs. probabilistic skills. However, Issue #1018 documents that all
observations are recorded as `tool_complete` due to a missing phase argument —
meaning phase-level granularity is currently broken.

---

## Gaps

1. **ECC instinct format on disk**: Could not confirm the exact YAML schema of
   persisted instinct files. The export format is documented but the internal
   storage format is not fully verified.

2. **ECC session injection on first install**: Not clear whether the
   SessionStart hook fires correctly on first install before any sessions exist,
   or whether it fails silently.

3. **interface-design `/interface-design:audit` implementation**: The audit
   command was documented by name but its implementation details (what rules it
   checks, how it compares system.md to actual code) were not retrieved.

4. **ECC ecc2 Rust implementation maturity**: The `ecc2/` Cargo.toml exists but
   no release date, completion status, or README was found. Status as draft vs.
   production-ready is unknown.

5. **ECC `omega-memory` MCP server**: Listed in mcp-servers.json as "semantic
   search with multi-agent coordination" but no further details found. Could be
   a significant memory capability gap or a third-party dependency.

6. **interface-design marketing site (interface-design.dev)**: The official site
   returned a certificate error during research. Cannot verify whether it
   contains additional documentation about the memory system.

---

## Serendipity

**Homunculus as a standalone project**: The humanplane/homunculus repository
[21] appears to be a cleaner, standalone implementation of the instinct learning
system that ECC uses. It stores instincts in `.claude/homunculus/` and uses
`observations.jsonl` for capture. It may be worth researching independently if
the focus is on the instinct architecture specifically.

**ECC Issue #1049 references Hermes and OpenClaw**: The deep memory layer
proposal names two other Claude memory projects — Hermes and OpenClaw — as
sources for memory architecture patterns. These may be worth investigating as
additional memory system comparators.

**ECC knowledge graph design**: The proposed SQLite-backed knowledge graph
(Entities + Relations + Observations) in Issue #1049 is architecturally
identical to the standard graph memory pattern used by claude-mem and
context-memory repos. This convergence suggests an emerging consensus on
structured memory schemas for Claude.

**interface-design's frequency-based bootstrapping**: The `/extract` command's
approach of analyzing codebase token frequency to infer the implicit design
system is directly applicable to any memory bootstrapping problem — deriving the
implicit knowledge from artifacts rather than requiring explicit declaration.

---

## Confidence Assessment

- HIGH claims: 18
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH**

Both repositories are publicly accessible, actively maintained, and the majority
of findings are drawn directly from official repository source files (SKILL.md,
hooks.json, issue tracker, release notes, command files). The high overall
confidence reflects that primary sources were consulted for every major claim.
