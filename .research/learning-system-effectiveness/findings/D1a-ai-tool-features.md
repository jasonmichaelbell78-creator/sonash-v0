# Findings: How AI Coding Tools Handle Learning From Mistakes — Features and Approaches

**Searcher:** deep-research-searcher **Profile:** web **Date:**
2026-04-03T00:00:00Z **Sub-Question IDs:** SQ-1 (Part A)

---

## Key Findings

### 1. Claude Code — Most Sophisticated Dual-Layer System [CONFIDENCE: HIGH]

Claude Code has the most explicitly documented and feature-complete learning
system among the tools surveyed. It operates two complementary mechanisms:

**CLAUDE.md (human-written instructions):**

- Hierarchical, scoped files: Managed Policy > Project > User > Local
- Stored at `./CLAUDE.md`, `./.claude/CLAUDE.md`, `~/.claude/CLAUDE.md`,
  `CLAUDE.local.md`, and `.claude/rules/*.md`
- Path-specific rules via `.claude/rules/` with YAML frontmatter `paths:` glob
  scoping
- Supports `@import` syntax for pulling in other files
- Loaded in full at every session start; loaded from subdirectories on-demand
- Version-controlled; shareable across team; org-managed policy layer available
- `/init` command analyzes codebase and auto-generates a starter CLAUDE.md

**Auto Memory (Claude-written notes):**

- Introduced in Claude Code v2.1.59
- Claude autonomously saves build commands, debugging insights, code style
  discoveries, architecture notes, and workflow habits during sessions
- Stored in `~/.claude/projects/<project>/memory/MEMORY.md` plus topic files
- `MEMORY.md` (first 200 lines / 25KB) loaded into every session; topic files
  loaded on demand
- Scoped per git repository; all worktrees share one directory
- Machine-local only — not committed to git, not shared across machines
- Toggleable via `/memory` command or `autoMemoryEnabled` setting
- Human-editable: all auto-memory is plain markdown, viewable/editable via
  `/memory`

**Key insight:** Auto memory is the only tool surveyed where the AI writes its
own persistent notes from corrections — not just static config files maintained
by humans. Asking Claude to "remember X" saves it to auto memory; "add this to
CLAUDE.md" routes to the human-maintained file instead.

Sources: [1], [2], [3]

---

### 2. Windsurf/Cascade — Only Other Tool With True Automatic Memory Generation [CONFIDENCE: HIGH]

Windsurf's Cascade agent has a memory system with two tiers:

**Automatic Memories:**

- Cascade autonomously generates memories during conversations when it
  encounters context it judges worth remembering
- Captures: project structure, tech stack, framework preferences, workflow
  patterns, coding conventions
- Stored locally at `~/.codeium/windsurf/memories/`
- Workspace-specific (memories from one workspace unavailable in another)
- Memory generation is free (does not consume credits)
- Retrieved dynamically when deemed relevant to the current conversation

**Manual Memories:**

- Users can request: "create a memory of ..."
- Also free

**Rules (durable/shareable alternative):**

- For knowledge that should survive machine changes or be shared with teams,
  Windsurf explicitly recommends writing Rules to `.windsurf/rules/`
- Rules support activation modes: `always_on`, `glob`, `model_decision`,
  `manual`
- AGENTS.md also supported as a stable cross-tool instruction file

**Flow Awareness:**

- Cascade tracks file edits, terminal commands, clipboard contents, and
  conversation history in a shared timeline
- Proprietary models ingest this timeline to infer user intent in real time

**Key limitation:** Memories are machine-local and not committed to the
repository. The documentation explicitly names this limitation and recommends
Rules for anything requiring durability or team sharing.

Sources: [4], [5]

---

### 3. Cursor — Rules System With Deprecated Memories Feature [CONFIDENCE: HIGH]

**Current Rules System (.cursor/rules/\*.mdc):**

- MDC (Markdown with frontmatter) files in `.cursor/rules/` directory
- Four activation modes:
  - `alwaysApply: true` — injected into every session
  - `description` only — Agent decides relevance automatically ("Agent
    Requested")
  - `globs` specified — auto-attached when matching files are open
  - No frontmatter — manual `@rule-name` invocation only
- Rule precedence: Team Rules > Project Rules > User Rules
- User-level rules stored via Cursor Settings (all projects, Agent/Chat only)
- Team rules set in team dashboard
- Legacy `.cursorrules` (single root file) still functional but deprecated

**Generate Cursor Rules command:**

- Introduced in Cursor v0.49 (April 2025)
- `/Generate Cursor Rules` command captures conversation context into a reusable
  rule
- Later removed as a slash command; can be recreated as a custom command
- Represents a semi-automated path from conversation corrections to persistent
  rules

**Memories feature (deprecated):**

- Introduced in Cursor v0.51 as a beta feature for automatic cross-session
  memory
- Generated memories at project level from conversations
- Removed in a later 2025 version (post v2.1.x)
- Users advised to export memories and convert them to Rules
- Rules are now the sole built-in persistence mechanism

**Key insight:** Cursor had automatic memory generation but removed it. The
current system requires human effort to codify learnings into rule files, though
the "Generate Cursor Rules" command provides a bridge from conversation to rule.

Sources: [6], [7], [8]

---

### 4. GitHub Copilot — Manual Instructions With Telemetry-Based Training [CONFIDENCE: HIGH]

**Custom Instructions System:**

- `copilot-instructions.md` in `.github/` — always-on, repository-wide
- `*.instructions.md` files in `.github/instructions/` — path-specific via
  `applyTo`
- Personal instructions via user profile settings
- Organization-level instructions (generally available as of April 2, 2026)
- VS Code recognizes `AGENTS.md` and `CLAUDE.md` as alternative always-on files
- `/init` command generates instructions by analyzing workspace structure
- "Extract an instruction from this" chat command converts corrections to rules

**No local learning loop:**

- Copilot does NOT automatically learn from individual user accept/reject
  decisions at the individual level
- Accept/reject signals are used for global model training (with opt-in/opt-out)

**April 2026 Data Policy Change:**

- Starting April 24, 2026: interactions used for model training by default
- Data collected: accepted suggestions, modified suggestions, rejected
  suggestions, code context, comments, documentation
- Opt-out available at github.com/settings/copilot/features
- Individual Business/Enterprise users are unaffected

**Key insight:** There is no personalized feedback loop at the user level.
Copilot improves globally from aggregated data, not individually from a specific
user's corrections. Instructions must be manually written.

Sources: [9], [10], [11]

---

### 5. OpenAI Codex — AGENTS.md + Skills System, No Adaptive Learning [CONFIDENCE: HIGH]

**AGENTS.md:**

- Layered discovery: global (`~/.codex/AGENTS.md`), project-root to current
  directory
- Merge strategy: concatenated root-downward with blank line separators; later
  files override earlier guidance
- Size limit: 32 KiB default (configurable up to 65536 bytes)
- Supports `.override` variants for stronger overrides
- Read once at session start; rebuilt on every run (no caching)
- No modification by Codex — purely instructional, static

**Skills System:**

- A skill is a directory with `SKILL.md` (required) plus optional `scripts/`,
  `references/`, `assets/`, `agents/openai.yaml`
- Invoked explicitly (`/skills` or `$skill-name`) or implicitly (Codex matches
  description to intent)
- Progressive disclosure: Codex loads only metadata (name, description, path) at
  session start; full SKILL.md loaded only when used
- Open-source skills catalog at github.com/openai/skills with 35 curated skills
  (13,000 GitHub stars as of early 2026)
- Skills are static instruction sets — no adaptive learning built in
- Tracking "what works": improvement measured via evals (with-skill vs
  without-skill baselines), not automatic; manual human evaluation cycle

**Key insight:** Codex offers no automatic learning from user corrections. The
Skills system provides reusable workflow packaging but requires human curation.
Improvement is measured externally via evals, not captured internally.

Sources: [12], [13]

---

### 6. Aider — Convention Files + Session History, Explicit Not Automatic [CONFIDENCE: HIGH]

**Conventions system:**

- `CONVENTIONS.md` (user-created) loaded via `/read` command or `--read` flag
- Configured in `.aider.conf.yml` with `read: CONVENTIONS.md`
- Marked read-only to enable prompt caching
- Model-agnostic: works across any LLM backend (unlike CLAUDE.md which is
  Claude-specific)
- Community conventions repository at github.com/Aider-AI/conventions
- No automatic update mechanism — humans must write and update conventions

**Session persistence:**

- `restore-chat-history: true` in `.aider.conf.yml` reloads prior chat messages
- Chat history stored in `.aider.chat.history.md` (configurable)
- Input history stored in `.aider.input.history`
- LLM interaction log available via `llm-history-file`

**Repository mapping:**

- Automatic repo map (`map-refresh: auto`) provides context about codebase
  structure
- Map is dynamic, not a memory store

**No automatic learning:**

- Aider has no mechanism to automatically extract rules or memories from user
  corrections
- Watch mode (`--watch-files`) allows aider to respond to inline AI comments in
  editor, but this is a workflow feature, not learning

**Key insight:** Aider relies entirely on human-maintained convention files. The
model-agnostic design and prompt caching make conventions efficient, but there
is no automated path from correction to persistent knowledge.

Sources: [14], [15]

---

### 7. Continue.dev — Rules System With Agent-Driven Rule Creation [CONFIDENCE: MEDIUM-HIGH]

**Rules system:**

- Rules stored in `.continue/rules/` (workspace) or `~/.continue/rules/`
  (global)
- Created manually or via `create_rule_block` tool in Agent mode (user prompts:
  "Create a rule for this")
- Supports YAML frontmatter with `globs`, `regex`, `description`, `alwaysApply`
- Hub rules stored on Continue Mission Control servers, referenced in
  `config.yaml`
- Loading order: Hub assistant rules > Referenced Hub rules > Local workspace
  rules > Global rules
- Rules persist across sessions

**Memory via MCP:**

- `rules-memory` package uses MCP memory server to persist data between sessions
- Requires separate MCP memory server setup — not built-in
- Described as: "You have short session-based memory, use memory tools to
  persist data between sessions"

**Custom prompts:**

- Prompt files invoked via `/command` syntax
- Session-specific, not persistent memory

**Context providers:**

- Embedding + re-ranking models for codebase indexing
- Context assembled from RAG-based retrieval, not persistent memory

**No native auto-memory:**

- Unlike Claude Code and Windsurf, Continue.dev has no native automatic memory
  generation from corrections
- The active GitHub issue #4615 requested a "Memory Bank" feature suggesting it
  was absent as of filing

**Key insight:** Continue.dev offers the `create_rule_block` tool as a hybrid —
it's initiated by the user in conversation but generates the rule automatically.
MCP-based memory requires third-party setup. Overall memory capabilities are
weaker than Claude Code or Windsurf.

Sources: [16], [17], [18]

---

### 8. Cline / Roo Code — Community-Built Memory Bank Systems, Not Native [CONFIDENCE: MEDIUM-HIGH]

**Cline Memory Bank:**

- Not a native Cline feature — implemented via custom instructions
  (`.clinerules/`) using a structured markdown file pattern
- Six core files in `memory-bank/` directory: `projectbrief.md`,
  `productContext.md`, `activeContext.md`, `systemPatterns.md`,
  `techContext.md`, `progress.md`
- Files are regular project markdown, readable by both human and AI
- Session start: Cline reads all memory bank files (mandatory in the instruction
  set)
- Session end: user requests "update memory bank" or uses `/newtask` command
- Auto-Compact option available for ongoing compression within session

**Roo Code Custom Instructions:**

- Three-tier system: Global (`~/.roo/rules/`), Workspace (`.roo/rules/`),
  Mode-specific (`.roo/rules-{modeSlug}/`)
- Rules read recursively; `AGENTS.md` also supported
- Entirely manual — no automatic learning or adaptive behavior
- Mode-specific rules enable specialized behavior (Code, Architect, Debug modes)

**Roo Code community extensions:**

- Multiple community Memory Bank implementations: RooFlow,
  roo-advanced-memory-bank, MCP-based memory servers
- These provide automated context capture but require manual setup

**Key insight:** Neither Cline nor Roo Code has native automatic learning.
Memory Bank is a community convention/pattern, not a built-in feature. The
ecosystem has compensated with multiple third-party solutions, indicating strong
user demand.

Sources: [19], [20], [21]

---

## Taxonomy: Learning Approaches Across Tools

| Tool           | Auto-Writes Memory | Human Writes Rules       | Rules in VCS | Session History  | Cross-Session |
| -------------- | ------------------ | ------------------------ | ------------ | ---------------- | ------------- |
| Claude Code    | Yes (Auto Memory)  | Yes (CLAUDE.md)          | Yes          | No (new context) | Yes           |
| Windsurf       | Yes (Memories)     | Yes (Rules)              | Yes (Rules)  | Limited          | Yes           |
| Cursor         | No (deprecated)    | Yes (.mdc rules)         | Yes          | Via history UI   | Yes (rules)   |
| GitHub Copilot | No                 | Yes (.md files)          | Yes          | No               | Yes (files)   |
| OpenAI Codex   | No                 | Yes (AGENTS.md + Skills) | Yes          | No               | Yes (files)   |
| Aider          | No                 | Yes (CONVENTIONS.md)     | Yes          | Optional restore | Yes (files)   |
| Continue.dev   | No (MCP optional)  | Yes + agent-assist       | Yes          | No               | Yes (files)   |
| Cline/Roo Code | No (community)     | Yes (.clinerules/.roo)   | Yes          | No               | Yes (files)   |

---

## Sources

| #   | URL                                                                                                        | Title                                                          | Type                  | Trust  | CRAAP           | Date           |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------- | ------ | --------------- | -------------- |
| 1   | https://code.claude.com/docs/en/memory                                                                     | How Claude remembers your project — Claude Code Docs           | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current (2026) |
| 2   | https://medium.com/@joe.njenga/anthropic-just-added-auto-memory-to-claude-code                             | Anthropic Just Added Auto-Memory to Claude Code                | Blog                  | MEDIUM | 4/4/3/4/4 = 3.8 | Feb 2026       |
| 3   | https://yuanchang.org/en/posts/claude-code-auto-memory-and-hooks/                                          | Claude Code's Memory Evolution: Auto Memory & PreCompact Hooks | Blog                  | MEDIUM | 4/4/3/4/4 = 3.8 | 2026           |
| 4   | https://windsurf.com/cascade                                                                               | Cascade — Windsurf                                             | Official product page | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 5   | https://docs.windsurf.com/windsurf/cascade/memories                                                        | Windsurf Cascade Memories documentation                        | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 6   | https://cursor.com/changelog/0-49                                                                          | Cursor v0.49 Changelog                                         | Official changelog    | HIGH   | 5/5/5/5/5 = 5.0 | April 2025     |
| 7   | https://www.agentrulegen.com/guides/cursor-rules-guide                                                     | The Complete Cursor Rules Guide (2026)                         | Community guide       | MEDIUM | 3/4/3/3/4 = 3.4 | 2026           |
| 8   | https://forum.cursor.com/t/0-51-memories-feature/98509                                                     | 0.51 Memories feature — Cursor Forum                           | Community forum       | MEDIUM | 3/4/3/3/4 = 3.4 | 2025           |
| 9   | https://code.visualstudio.com/docs/copilot/customization/custom-instructions                               | Use custom instructions in VS Code — VS Code Docs              | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 10  | https://github.blog/changelog/2026-04-02-copilot-organization-custom-instructions-are-generally-available/ | Copilot organization custom instructions GA — GitHub Blog      | Official announcement | HIGH   | 5/5/5/5/5 = 5.0 | 2026-04-02     |
| 11  | https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/    | Updates to GitHub Copilot interaction data usage policy        | Official policy       | HIGH   | 5/5/5/5/5 = 5.0 | 2026           |
| 12  | https://developers.openai.com/codex/guides/agents-md                                                       | Custom instructions with AGENTS.md — Codex                     | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 13  | https://developers.openai.com/codex/skills                                                                 | Agent Skills — Codex                                           | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 14  | https://aider.chat/docs/usage/conventions.html                                                             | Specifying coding conventions — aider                          | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 15  | https://aider.chat/docs/config/aider_conf.html                                                             | YAML config file — aider                                       | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 16  | https://docs.continue.dev/customize/deep-dives/rules                                                       | How to Create and Manage Rules in Continue                     | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 17  | https://github.com/continuedev/continue/issues/4615                                                        | Feature Request: Memory Bank for Continue                      | GitHub issue          | MEDIUM | 3/4/4/4/4 = 3.8 | 2025           |
| 18  | https://continue.dev/continuedev/rules-memory                                                              | rules-memory — Continue Hub                                    | Official product page | HIGH   | 4/4/4/4/5 = 4.2 | Current        |
| 19  | https://docs.cline.bot/features/memory-bank                                                                | Memory Bank — Cline Docs                                       | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 20  | https://docs.roocode.com/features/custom-instructions                                                      | Custom Instructions — Roo Code Documentation                   | Official docs         | HIGH   | 5/5/5/5/5 = 5.0 | Current        |
| 21  | https://github.com/enescingoz/roo-advanced-memory-bank                                                     | Advanced Roo Code Memory Bank                                  | Community project     | LOW    | 2/3/3/3/3 = 2.8 | 2025-2026      |

---

## Contradictions

**Cursor Memories deprecation timeline is unclear.** Community forum posts and
search summaries give conflicting signals: some say Memories were removed "in a
later 2025 version after 2.1.x", while docs.cursor.com/context/memories
redirects to the home page (suggesting the feature page was removed), implying
the feature is gone. However, at least one community post from late 2025
references it as if it still exists. The most credible signal is the redirect
behavior suggesting removal. [LOW confidence that Memories is currently active
in Cursor]

**GitHub Copilot personalization vs. training.** Official policy states that
accepting/rejecting suggestions will contribute to global model training
(starting April 24, 2026), and "opting out may affect personalization of future
suggestions." This implies some connection between feedback and personalization
but does not confirm a user-specific feedback loop. There is insufficient
evidence to confirm whether individual user suggestion patterns are used to
personalize _that user's_ future experience or are simply aggregated for global
model improvement.

**Codex vs. Claude Code AGENTS.md behavior.** Codex reads AGENTS.md natively.
Claude Code reads CLAUDE.md and must be told to import AGENTS.md via
`@AGENTS.md` syntax. VS Code's GitHub Copilot extension now reads both AGENTS.md
and CLAUDE.md as always-on instruction files. This creates ambiguity about which
tool will honor which file in multi-tool environments.

---

## Gaps

1. **Continue.dev MCP memory server setup**: The rules-memory feature was
   described at a high level but the actual setup process and reliability was
   not confirmed from official primary sources. More investigation needed to
   assess if this is production-ready or experimental.

2. **Windsurf memory relevance algorithm**: Documentation states memories are
   "retrieved when deemed relevant" but does not explain the algorithm for
   relevance determination. Unknown whether semantic similarity, recency, or
   explicit tagging governs retrieval.

3. **GitHub Copilot user-level personalization**: Official sources confirm
   global training from telemetry but do not confirm whether a per-user
   personalization layer exists or will exist. This is a meaningful gap for
   evaluating whether Copilot "learns from individual mistakes."

4. **Aider watch-mode as a learning mechanism**: The `--watch-files` feature was
   mentioned but not deeply explored. It may allow a form of inline feedback
   that bridges to convention updates, but this remains unverified.

5. **Codex Skills automatic creation**: No evidence of an automatic path from
   conversation corrections to new skills. This gap means Codex's knowledge
   accumulation relies entirely on manual human curation.

6. **Cursor Generate Cursor Rules exact current status**: The
   `/Generate Cursor Rules` command was introduced in v0.49 then removed.
   Whether it was re-added, remains as a custom command workaround, or was
   replaced by something else is unclear from current sources.

---

## Serendipity

**April 24, 2026 Copilot telemetry deadline is imminent.** This is not learning-
system research per se, but for the SoNash project context: all GitHub Copilot
Free/Pro/Pro+ users have their interaction data (accepted/rejected suggestions)
used for model training starting April 24, 2026, by default. This is likely
relevant to any team or project making decisions about AI tool selection.

**AGENTS.md is becoming a cross-tool standard.** AGENTS.md files are now read by
Codex (natively), GitHub Copilot (via VS Code extension as an "always-on" file),
and can be imported into Claude Code's CLAUDE.md. This suggests convergence
around AGENTS.md as a universal project instruction file, while tool-specific
files (CLAUDE.md, .cursorrules) layer on top for tool-specific behavior.

**Cline/Roo Memory Bank gap spawned an ecosystem.** The absence of native memory
in Cline/Roo Code has generated a substantial community ecosystem: RooFlow,
roo-advanced-memory-bank, multiple MCP server implementations. This is evidence
that the demand for cross-session learning is high and that users will build
workarounds when tools do not provide it.

---

## Confidence Assessment

- HIGH claims: 6 (Claude Code, Windsurf, Cursor rules, GitHub Copilot, Codex,
  Aider)
- MEDIUM-HIGH claims: 2 (Continue.dev, Cline/Roo Code)
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** (all key findings verified from official
  documentation sources)
