# Verification Report: Claims C-026 through C-050

**Verifier:** V2 (Post-Search Verification — Phase 2.5) **Date:** 2026-04-03
**Source claims file:** `.research/codex-claude-code-plugin/claims.jsonl`
**Method:** Dual-path — filesystem for codebase claims, WebSearch + gh api for
external claims

---

## Summary

| Verdict      | Count |
| ------------ | ----- |
| VERIFIED     | 18    |
| REFUTED      | 1     |
| UNVERIFIABLE | 2     |
| CONFLICTED   | 4     |

---

### C-026: OpenAI rejected MCP for Codex app-server unification

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** web **Evidence:** InfoQ
and OpenAI blog post Unlocking the Codex harness confirm the reasoning. The
quote about MCP semantics being difficult for VS Code is attributed to OpenAI
engineering. Richer session semantics (streaming diffs, approval flows, thread
persistence) did not map onto MCP tool-oriented model. **Source:**
https://www.infoq.com/news/2026/02/opanai-codex-app-server/,
https://openai.com/index/unlocking-the-codex-harness/

---

### C-027: AGENTS.md open standard vs CLAUDE.md Anthropic-only; teams must maintain two files

**Verdict:** CONFLICTED **Confidence:** MEDIUM **Method:** web **Evidence:**
CLAUDE.md being Anthropic-specific is accurate. However the two-separate-files
framing is overstated — Claude Code also reads AGENTS.md per community
documentation and the official AGENTS.md website. Teams can use AGENTS.md as a
shared universal baseline with CLAUDE.md as an additive layer. **Conflicts:**

- **Source A:** https://thepromptshelf.dev/blog/agents-md-vs-claude-md/ —
  recommends AGENTS.md as universal baseline; CLAUDE.md adds Claude-specific
  features on top
- **Source B:** https://agents.md/ and https://benjamincrozat.com/agents-md —
  Claude Code reads AGENTS.md alongside CLAUDE.md; 60,000+ open-source projects
  use AGENTS.md across multiple tools including Claude Code
- **Conflict type:** Complementary — the two-file requirement is overstated

---

### C-028: Claude Code plugin system launched public beta October 9, 2025

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** web **Evidence:**
Official Anthropic blog at claude.com/blog/claude-code-plugins confirms October
9, 2025 public beta launch. Official plugins-reference confirms all bundleable
components: commands/, skills/, agents/, hooks/, .mcp.json, .lsp.json, and bin/
(Executables added to the Bash tool PATH while the plugin is enabled). Minor
caveat: docs do not describe the system as stable — that is editorial.
**Source:** https://claude.com/blog/claude-code-plugins,
https://code.claude.com/docs/en/plugins-reference

---

### C-029: Plugin agents cannot use hooks, mcpServers, or permissionMode; only isolation value is worktree

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** web **Evidence:**
Official plugins-reference page states verbatim: Plugin agents support name,
description, model, effort, maxTurns, tools, disallowedTools, skills, memory,
background, and isolation frontmatter fields. The only valid isolation value is
worktree. For security reasons, hooks, mcpServers, and permissionMode are not
supported for plugin-shipped agents. **Source:**
https://code.claude.com/docs/en/plugins-reference

---

### C-030: Plugin reached 11,000+ stars and 567 forks within 3 days

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** gh api (ground truth)
**Evidence:** Live gh api query returned: stargazers_count=11130,
forks_count=567, created_at=2026-03-30T15:29:52Z. Confirmed 11,130 stars and
exactly 567 forks as of April 3, 2026 (4 days post-creation). Catching on like
wildfire phrase confirmed in multiple sources. **Source:** gh api
repos/openai/codex-plugin-cc (live 2026-04-03),
https://medium.com/@joe.njenga/i-tested-new-viral-codex-plugin-for-claude-code-shouldnt-exist-but-exploding-1c5702679929

---

### C-031: Anthropic made no public statement about the plugin

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** web **Evidence:**
Comprehensive web search across major tech publications found no Anthropic
public statement regarding codex-plugin-cc. Multiple articles explicitly note
this absence as notable. **Source:**
https://www.unite.ai/openai-releases-codex-plugin-that-runs-inside-anthropics-claude-code/,
https://the-decoder.com/openai-launches-a-codex-plugin-that-runs-inside-anthropics-claude-code/

---

### C-032: Issue #1 is a Day-1 Gemini CLI PR; OpenAI staff engaged constructively

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** gh api (ground truth)
**Evidence:** gh api confirms: title Add Gemini CLI extension commands,
created_at 2026-03-30T18:33:43Z (Day 1), state open. Comments confirm OpenAI
COLLABORATOR dkundel-openai responded: Thank you for your contribution @bestlux!
Will take a look at it in the coming days. Constructive engagement confirmed. PR
implements Gemini bridge forwarding to codex-companion.mjs. **Source:** gh api
repos/openai/codex-plugin-cc/issues/1 and /issues/1/comments (live 2026-04-03)

---

### C-033: 70% of developers use 2-4 AI tools simultaneously; Gartner 1445% multi-agent inquiry surge

**Verdict:** CONFLICTED **Confidence:** MEDIUM **Method:** web **Evidence:**
Gartner 1445% surge figure is confirmed by multiple independent sources. The 70%
use 2-4 tools and 15% use 5+ developer percentages appear only in the single
cited source and are not independently corroborated. **Conflicts:**

- **Source A (confirmed):** Multiple sources including gartner.com — 1445% surge
  in multi-agent system inquiries Q1 2024 to Q2 2025 is verified
- **Source B (single-source):**
  https://newsletter.pragmaticengineer.com/p/ai-tooling-2026 — 70%/15%
  tool-count breakdown not independently confirmed
- **Conflict type:** Complementary — the Gartner stat is solid; developer
  percentage figures need corroboration

---

### C-034: GitHub Agent HQ enables Claude, Codex, and Copilot simultaneously (February 2026)

**Verdict:** VERIFIED **Confidence:** HIGH **Method:** web **Evidence:** GitHub
official blog confirms Claude and Codex in public preview on Agent HQ from
February 4, 2026, expanded to Copilot Business and Pro users February 26, 2026.
Users can assign tasks to Copilot, Claude, Codex, or all three simultaneously.
**Source:**
https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/,
https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/

---

### C-035: Claude Code has 2.5B ARR, 135K daily GitHub commits, ~4% of all public commits

**Verdict:** VERIFIED **Confidence:** MEDIUM **Method:** web **Evidence:**
Multiple sources confirm 2.5B ARR (grew from 1B in January 2026), ~135,000 daily
commits, ~4% of all public GitHub commits. GIGAZINE specifically cites Claude
Code accounts for 4% of GitHub public commits. MEDIUM confidence as these are
market estimates not official Anthropic figures. **Source:**
https://gigazine.net/gsc_news/en/20260210-claude-code-github-commits-4-percent-20-percent/,
https://winbuzzer.com/2026/03/26/claude-code-90-percent-output-low-star-github-repos-xcxwbn/

---

### C-036: Fidji Simo called Claude Code success a wake-up call; plugin is a distribution play

**Verdict:** VERIFIED **Confidence:** MEDIUM **Method:** web **Evidence:** The
Rundown AI and Calcalist Tech confirm Fidji Simo (OpenAI CEO of Applications)
described the Claude Code gap as a code red and wake-up call to staff.
Distribution play characterization confirmed by multiple analyst assessments.
**Source:** https://www.therundown.ai/p/simo-sounds-alarm-on-openai-side-quests,
https://www.calcalistech.com/ctechnews/article/a86rzr24h
