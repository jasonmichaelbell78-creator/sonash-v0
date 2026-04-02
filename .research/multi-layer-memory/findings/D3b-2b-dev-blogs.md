# Findings: Developer Blog Posts and Community Content on Claude Code Memory

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** D3b-2b

---

## Key Findings

1. **Claude Code has two native memory systems: CLAUDE.md (user-written) and
   Auto Memory (Claude-written)** [CONFIDENCE: HIGH]

   The official Claude Code documentation confirms two complementary memory
   systems. CLAUDE.md files are markdown files developers write to give Claude
   persistent instructions, loaded into context at session start. Auto Memory
   (introduced in v2.1.32, February 2026) is an autonomous system where Claude
   writes its own notes to `~/.claude/projects/<project>/memory/` — including a
   `MEMORY.md` index whose first 200 lines are auto-loaded each session, plus
   topic-specific files (debugging.md, api-conventions.md). The hard limit is
   200 lines or 25KB for auto-loaded context. [1][8]

2. **Memory hierarchy has 4 tiers, loaded lowest-to-highest priority**
   [CONFIDENCE: HIGH]

   Multiple sources confirm the loading order: (1) Managed Policy
   (admin/enterprise level), (2) User global (`~/.claude/CLAUDE.md`), (3)
   Project root (`./CLAUDE.md`), (4) Subdirectory-level CLAUDE.md files. Files
   loaded later take precedence because the model attends more to later-injected
   instructions. The `.claude/rules/` directory allows modular rule files with
   optional path-scoped frontmatter (glob matching) to load rules only when
   working on specific files. [1][5][6]

3. **Jose Parreño Garcia's key insight: Claude Code memory is about
   coordination, not personality** [CONFIDENCE: HIGH]

   In a Substack post (February 24, 2026), Garcia argues the fundamental
   misunderstanding is treating CLAUDE.md as "personality design." The correct
   mental model: it's text injection into context, not persistent learning. He
   proposes a personal framework distinguishing trivial (proceed directly) vs
   non-trivial work (propose plan first), and recommends 20-80 lines for small
   repos, 80-200 for typical services, over 200 is hard to maintain. [5]

4. **Git-managed cross-device memory sharing via Global/Project two-tier
   promotion** [CONFIDENCE: HIGH]

   Developer lin-yuchen published a system (DevelopersIO, March 23, 2026) using
   GitHub to manage Claude Code memory across devices. Architecture: Global tier
   (`~/.claude/global-memory/`) for cross-project preferences, Project tier
   (`.claude/projects/*/memory/`) for project-specific context. Key design rule:
   discoveries promote from Project → Global only after appearing in 2+ projects
   — never the reverse. Manual pull/push sync (not automated) keeps it simple
   and controllable. [4]

5. **claude-diary (rlancemartin): Generative Agents-inspired diary + reflection
   system** [CONFIDENCE: HIGH]

   R. Lance Martin (351 GitHub stars) implements a `/diary` + `/reflect`
   workflow modeled on the Generative Agents paper. Sessions generate structured
   diary entries stored in `~/.claude/memory/diary/`. The `/reflect` command
   analyzes entries for patterns across 6 categories (PR feedback, persistent
   preferences, design decisions, anti-patterns, efficiency lessons,
   project-specific patterns) and auto-updates CLAUDE.md with imperative rules.
   Requires 2+ occurrences for patterns, 3+ for "strong" patterns. A PreCompact
   hook triggers diary generation before conversation compaction. [7]

6. **claude-mem (thedotmack): Progressive-disclosure memory with SQLite + Chroma
   vector DB** [CONFIDENCE: HIGH]

   An MCP-based plugin using 5 lifecycle hooks (SessionStart, UserPromptSubmit,
   PostToolUse, Stop, SessionEnd) to capture observations, compress with AI, and
   store in SQLite with Chroma for hybrid semantic + keyword search. Key
   innovation: "progressive disclosure" with 3 retrieval layers — search index
   (~50-100 tokens), timeline (~mid), full details (~500-1,000 tokens per
   entry). Claims ~10x token savings. HTTP API on port 37777 with web UI. [9]

7. **Yuval's two-tier architecture: CLAUDE.md budget allocation + confidence
   decay** [CONFIDENCE: HIGH]

   Dev.to post (January 28, 2026) by Yuval describes a sophisticated approach:
   Tier 1 is a 150-line CLAUDE.md auto-generated using category-based "line
   budgets" ranked by `confidence * accessCount`, with unused budget
   redistributing dynamically. Tier 2 is `.memory/state.json` for unlimited
   storage accessed via MCP tools on demand. Deduplication uses Jaccard
   similarity (60% threshold) plus LLM consolidation every 10 extractions.
   Confidence decay varies by type: 7-day half-life for progress, 30-day for
   context, permanent for architecture/decisions. Cost: ~$0.001 per extraction
   using Haiku only, ~$0.05-0.10/day. [10]

8. **Mem0 MCP integration: 90% token reduction claim via semantic vector
   memory** [CONFIDENCE: MEDIUM]

   Mem0 published an integration guide (published February 7, 2026 per article;
   March 31, 2026 per header) showing a 5-minute MCP server setup that adds
   semantic memory to Claude Code. Claims: 90% lower token usage, 91% faster
   responses, +26% accuracy on LOCOMO benchmark, task time from 10-11 min to 1-2
   min. Installation via pip, configured in `.mcp.json` or `~/.claude.json`.
   Provides 6 tools: add_memory, search_memories, get_memories, update_memory,
   delete_memory, delete_all_memories. Performance claims come from Mem0
   themselves — independent verification not found. [11]

9. **Letta Code: stateful "MemFS" architecture as direct counter-architecture to
   Claude Code's stateless model** [CONFIDENCE: HIGH]

   Letta published a blog post and the tessl.io analysis (December 18, 2025)
   contrasts Letta Code's design with Claude Code's stateless sessions. Letta
   co-founder Packer: "We're not trying to innovate at the UI layer, we're
   innovating at the 'memory' (context engineering) layer." Key pattern: memory
   blocks as discrete context-window units with character limits. Recent
   architecture shift from specialized memory tools to "MemFS" — memory
   projected into git-backed files manipulated via general bash/computer-use
   tools. Ranked #1 model-agnostic OSS coding harness on Terminal-Bench.
   [12][13]

10. **centminmod's CLAUDE.md memory bank: pattern-based documentation with ADRs
    and cost tracking** [CONFIDENCE: MEDIUM]

    GitHub repo by centminmod implements a persistent context system using
    CLAUDE.md as primary memory bank plus platform-specific supplements
    (CLAUDE-cloudflare.md, CLAUDE-convex.md). Key patterns: Architectural
    Decision Records (ADRs) stored in memory files, active context tracking for
    multi-session continuity, token usage metrics in memory files for cost
    visibility. Changes to memory files committed alongside code. [3]

11. **Boris Cherny (Claude Code creator) uses team-contributed CLAUDE.md
    committed to git** [CONFIDENCE: HIGH]

    Discovered via Twitter thread reader (twitter-thread.com). The Anthropic
    team shares a single CLAUDE.md for the Claude Code repo checked into git.
    Team members contribute multiple times per week. Workflow: when Claude does
    something incorrectly, it gets added to CLAUDE.md. During code reviews, team
    members tag @claude on PRs to update CLAUDE.md as part of the PR itself via
    the Claude Code GitHub action. This is the origin-of-record workflow for the
    feature. [14]

12. **everything-claude-code: instinct → skill evolution with confidence
    scoring** [CONFIDENCE: MEDIUM]

    GitHub repo by affaan-m implements a pipeline where session interactions
    become "instincts" (unconfirmed patterns with confidence scores), then
    graduate to formal "skills" through clustering via `/learn-eval` and
    `/evolve` commands. Hook-driven: lifecycle hooks capture knowledge passively
    during normal development. Strategic manual compaction via `/checkpoint`
    preserves critical context while pruning verbose traces. "Iterative
    Retrieval Pattern" for subagents progressively retrieves only relevant
    information between interactions. [15]

---

## Sources

| #   | URL                                                                                                           | Title                                                          | Type            | Trust       | CRAAP | Date         |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------- | ----------- | ----- | ------------ |
| 1   | https://code.claude.com/docs/en/memory                                                                        | How Claude remembers your project                              | Official docs   | HIGH        | 4.6   | 2026         |
| 2   | https://medium.com/data-science-collective/claude-code-memory-management-the-complete-guide-2026-b0df6300c4e8 | Claude Code Memory Management: Complete Guide 2026             | Blog (Medium)   | MEDIUM      | 3.4   | Mar 2026     |
| 3   | https://github.com/centminmod/my-claude-code-setup                                                            | my-claude-code-setup memory bank system                        | GitHub repo     | MEDIUM      | 3.8   | 2025-2026    |
| 4   | https://dev.classmethod.jp/en/articles/claude-code-global-memory-with-git/                                    | Managing Claude Code Memory with Git                           | Developer blog  | MEDIUM-HIGH | 4.0   | Mar 23, 2026 |
| 5   | https://joseparreogarcia.substack.com/p/claude-code-memory-explained                                          | You (probably) don't understand Claude Code memory             | Substack        | MEDIUM      | 3.8   | Feb 24, 2026 |
| 6   | https://www.shareuhack.com/en/posts/claude-memory-feature-guide-2026                                          | Claude Memory Guide: 3-Layer Architecture                      | Blog            | MEDIUM      | 3.4   | Mar 15, 2026 |
| 7   | https://github.com/rlancemartin/claude-diary                                                                  | claude-diary: simple memory system for Claude Code             | GitHub repo     | HIGH        | 4.2   | 2025-2026    |
| 8   | https://yuanchang.org/en/posts/claude-code-auto-memory-and-hooks/                                             | Claude Code's Memory Evolution: Auto Memory & PreCompact Hooks | Personal blog   | MEDIUM-HIGH | 4.0   | Feb 10, 2026 |
| 9   | https://github.com/thedotmack/claude-mem                                                                      | claude-mem: persistent memory plugin                           | GitHub repo     | MEDIUM      | 3.6   | 2025-2026    |
| 10  | https://dev.to/suede/the-architecture-of-persistent-memory-for-claude-code-17d                                | The Architecture of Persistent Memory for Claude Code          | Dev.to          | MEDIUM      | 3.8   | Jan 28, 2026 |
| 11  | https://mem0.ai/blog/claude-code-memory                                                                       | Add Memory to Claude Code with Mem0                            | Vendor blog     | MEDIUM      | 3.2   | Feb/Mar 2026 |
| 12  | https://www.letta.com/blog/letta-code                                                                         | Letta Code: A Memory-First Coding Agent                        | Official blog   | HIGH        | 4.0   | Dec 2025     |
| 13  | https://tessl.io/blog/forever-stateful-letta-code-bets-on-memory-as-the-missing-layer-in-coding-agents        | Letta Code bets on memory as the missing layer                 | Tech journalism | MEDIUM-HIGH | 4.2   | Dec 18, 2025 |
| 14  | https://twitter-thread.com/t/2007179832300581177                                                              | Boris Cherny on his Claude Code setup                          | Twitter thread  | MEDIUM      | 3.4   | 2025         |
| 15  | https://github.com/affaan-m/everything-claude-code                                                            | everything-claude-code agent harness                           | GitHub repo     | MEDIUM      | 3.4   | 2025-2026    |

---

## Contradictions

**CLAUDE.md size limits:** Some sources say "200 lines" as a hard cap for
auto-loading, others position it as a "best practice" recommendation with no
hard enforcement. The official docs and multiple blog posts agree on 200 lines /
25KB for auto-loaded content. For user-written CLAUDE.md there is no hard cap,
just adherence degradation.

**Auto Memory version:** One source states Auto Memory appeared around v2.0.64
(late 2025), another says it became prominent at v2.1.30-v2.1.31 (February
2026). Both may be accurate — feature shipped in late 2025, visibility/UI
improved in February 2026.

**Mem0 performance claims:** 90% token reduction and 91% faster responses come
from Mem0's own marketing. No independent replication found. Treat as
promotional until cross-validated.

---

## Gaps

- No YouTube-specific tutorials confirmed (YouTube site: search returned zero
  results; general search shows tutorials exist but specific URLs not captured)
- Boris Cherny's Twitter thread content partially blocked (SSL cert error on
  twitter-thread.com)
- No data on how many developers have adopted structured multi-layer memory vs.
  simple single CLAUDE.md
- No benchmarks comparing memory approaches (diary vs. vector DB vs.
  git-managed) on real codebases
- Medium article by Gul Jabeen (Mar 2026) content not accessible due to SSL cert
  error — may contain additional patterns

---

## Serendipity

**Letta Code's "MemFS" shift** is architecturally significant beyond this
sub-question: they moved away from specialized memory editing tools toward
treating memory as git-backed files manipulated via general bash tools. This is
the inverse of Claude Code's approach (structured CLAUDE.md) — a competing
philosophical stance worth tracking.

**PreCompact hook as emergent memory pattern:** Multiple developers
independently converged on using the PreCompact hook to spawn fresh Claude
instances for handover summary generation. This pattern (hook → spawn subprocess
with `-p` flag → write summary to disk) is a community-discovered workaround for
context compaction loss that Anthropic later built into Auto Memory. It
demonstrates that the community reverse-engineered memory persistence before
Anthropic formalized it.

**Confidence decay as a memory hygiene primitive:** Yuval's implementation of
type-differentiated memory decay rates (progress: 7-day, context: 30-day,
architecture: permanent) maps directly to human cognitive models of what
knowledge stays relevant. No other tool found uses this pattern — potential
adoption opportunity.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 5
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH

The core findings (official memory architecture, community patterns, open-source
implementations) are well-sourced from official docs and verifiable GitHub
repos. Performance claims from vendors (Mem0) are MEDIUM due to self-reporting.
