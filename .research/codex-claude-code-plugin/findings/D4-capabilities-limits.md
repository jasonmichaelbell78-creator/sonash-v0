# Findings: Capabilities and Limitations of the Codex Claude Code Plugin vs Native Codex

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-03
**Sub-Question IDs:** SQ-4

---

## Key Findings

### 1. The Plugin Is a Wrapper, Not a Replacement — Core Architecture Gap [CONFIDENCE: HIGH]

The plugin does not replace the native Codex CLI; it wraps it via the app-server
protocol. This means all plugin capabilities are a **subset** of what native
Codex can do, plus one additive capability (Claude context integration). Native
CLI functionality that is inaccessible through the plugin includes:

- **Interactive TUI mode**: Native Codex launches a full-screen terminal UI with
  inline approve/reject controls, arrow-key draft navigation, and `/theme`
  customization. The plugin has no equivalent — all commands are fire-and-wait
  or background jobs.
- **Session resume**: `codex resume` re-opens earlier sessions with transcript,
  plan history, and approvals intact. The plugin has no mechanism to resume or
  inspect prior Codex sessions.
- **Multimodal input**: Native CLI accepts image attachments
  (`codex -i screenshot.png "..."`) and clipboard pastes. The plugin accepts
  only text context passed from Claude Code.
- **Fuzzy file search (`@`)**: Native TUI allows `@` for file search during
  interactive sessions. Not available through plugin.
- **External editor integration**: `Ctrl+G` opens an external editor for long
  prompts. Not available through plugin.
- **`/fork` and native slash commands**: Native CLI slash commands like `/fork`
  have no plugin equivalent.

Sources: [1][2][3]

---

### 2. What the Plugin Uniquely Enables That Native Codex Cannot [CONFIDENCE: HIGH]

The plugin adds capabilities that pure Codex CLI lacks:

- **Cross-provider review within a session**: Claude writes code; Codex from a
  different provider (OpenAI) reviews it, reducing same-model sycophancy bias.
  This "grading your own homework" problem cannot be solved by native Codex
  alone [5].
- **Background job multiplexing**: The `app-server-broker.mjs` maintains a
  persistent session with the app-server to avoid startup overhead per request,
  and multiplexes multiple concurrent review jobs. Native CLI does not have this
  broker layer.
- **Review Gate Stop Hook**: An optional hook that prevents Claude Code from
  completing output until Codex approves — a quality gate pattern that does not
  exist in native Codex [1][6].
- **Subagent delegation within Claude conversation**: `/codex:rescue` delegates
  complex tasks to Codex while remaining in the Claude Code thread. Native Codex
  has no native Claude handoff equivalent.
- **Broker-level job tracking**: `/codex:status`, `/codex:result`, and
  `/codex:cancel` provide persistent job state management across Claude Code
  sessions [1].

Sources: [1][4][5][6]

---

### 3. Plugin-Specific Limitations: Commands Are Read-Only By Default [CONFIDENCE: HIGH]

Both `/codex:review` and `/codex:adversarial-review` are explicitly
**read-only** — they analyze but never apply changes. From the README:

> "Both review commands are read-only; they will not perform any changes."
> "/codex:adversarial-review explicitly does not fix code."

Only `/codex:rescue` can perform writes, and **only** if the underlying Codex
CLI is configured with write-enabled sandbox mode. The plugin currently lacks a
`--dangerously-skip-permissions` flag (Issue #124, open as of April 2026),
meaning rescue operations may be blocked from performing full filesystem
operations in some setups. Native Codex has `--sandbox danger-full-access` and
`--dangerously-bypass-approvals-and-sandbox` flags that provide full write
access — these are not surfaced through the plugin.

Sources: [1][7][8]

---

### 4. Model Restrictions: Any Codex-Supported Model Works, Including Reasoning Effort Control [CONFIDENCE: MEDIUM-HIGH]

The plugin does **not** impose additional model restrictions beyond what the
Codex CLI itself supports. Users can configure model selection via:

- `~/.codex/config.toml` or `.codex/config.toml` with `model = "gpt-5.4-mini"`
- Per-command override: `/codex:rescue --model gpt-5.4-mini --effort high`
- A `spark` alias maps to `gpt-5.3-codex-spark` (ChatGPT Pro only)

Reasoning effort is configurable via `model_reasoning_effort` with values:
`none`, `minimal`, `low`, `medium`, `high`, `xhigh` [9].

Available models through the plugin (same as native Codex): `gpt-5.4`,
`gpt-5.4-mini`, `gpt-5.3-codex`, `gpt-5.3-codex-spark` (Pro only), and legacy
variants [3][9].

**Gaps on o-series**: The documentation and community sources do not mention
o3/o4 or standalone "reasoning model" series by those names in either Codex or
the plugin context. The naming scheme has shifted to `gpt-5.x` versioning. No
evidence of o-series-specific restrictions or enablement was found.

**PR #72 (open)**: A community PR proposes `/codex:agents` command enabling
per-agent Claude↔OpenAI model switching within Claude Code — this would extend
model access further than current docs describe, but is not yet merged [10].

Sources: [3][9][10]

---

### 5. Token and Usage: Dual-Billing Problem, Review Gate Can Drain Both Quotas [CONFIDENCE: HIGH]

The plugin bills both providers simultaneously:

- **Anthropic** charges for Claude Code's processing of plugin output
- **OpenAI** charges for Codex analysis (subscription credit consumption or API
  token billing)

The **review gate** (Stop hook) is the most dangerous cost surface: it creates
an automated Claude→Codex→Claude loop that can cycle indefinitely. Official
documentation warns:

> "The review gate can create a long-running Claude/Codex loop and may drain
> usage limits quickly." "Only enable it when you plan to actively monitor the
> session."

Without proper `stop_hook_active` flag checks, infinite review-block loops can
occur [6][11]. This is a known design risk with no automated safeguard in the
current release.

**Context window asymmetry**: Codex operates with a 1M token window (GPT-5.4) vs
Claude's 200K default. For large codebases, Codex's larger window may yield more
complete reviews through the plugin than Claude alone would produce [12].

Sources: [6][11][12]

---

### 6. Platform Limitations: Windows Has Active Blocking Bugs [CONFIDENCE: HIGH]

**Windows (blockers as of April 2026):**

- **Issue #116** (open): `spawn codex ENOENT` — Node.js `spawn()` cannot execute
  `.cmd` shim files without `shell: true`. Prevents adversarial-review from
  running at all. A code patch was submitted by the reporter but not yet merged.
- **Issue #113** (open): Plugin install errors with corrupted error messages
  during installation on Windows.
- **EISDIR error**: `formatUntrackedFile()` reads directories from
  `git status --short` as files, causing crashes when `.claude/` or `data/` dirs
  exist.
- No built-in workaround exists; users must use Linux/macOS or wait for upstream
  fixes [13][14].

**Linux (sandbox friction):**

- **Issue #18** (resolved):
  `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` in nested
  containers (Docker devcontainers, Apptainer, Flatpak). The plugin hardcoded
  bwrap sandbox mode that fails in restricted kernel environments. Marked
  completed — upstream now falls back to Landlock or alternative when bwrap is
  unavailable [15].
- Ongoing native Codex CLI bwrap regressions (Issues #15260, #15496, #16438)
  affect the CLI the plugin depends on [16].

**macOS**: No platform-specific blocking issues found. Most documentation
examples use macOS.

Sources: [13][14][15][16]

---

### 7. Authentication Restrictions: OAuth-Only Check Blocks Azure OpenAI and Custom Providers [CONFIDENCE: HIGH]

The plugin's authentication validator only accepts OpenAI OAuth tokens. Issue
#58 documents a **blocking failure in enterprise environments**:

> Codex is fully functional with Azure OpenAI credentials, but the plugin
> reports "not authenticated" because the check only validates `codex login`
> OAuth flows.

Unsupported auth providers: Azure OpenAI, LiteLLM, Bedrock, and any custom
`openai_base_url` configuration.

Workaround (community, not official): A community PR (#71) adds a fallback that
reads `~/.codex/config.toml` to detect custom model providers and validates API
key auth — but this is not merged upstream. `/codex:setup` will fail with a
false-negative for all non-OAuth setups [17].

Sources: [17]

---

### 8. Rescue Timeout Hard Cap: 5-Minute Limit on Large PRs [CONFIDENCE: HIGH]

`/codex:rescue` uses Bash execution with a **hard 300-second (5-minute)
timeout**. This triggers on:

- Diffs with 30+ files
- Diffs with ~2,000+ lines
- Analyses involving 44+ file reads

When timeout fires: results are lost even if Codex completed analysis — the
output never surfaces in the Claude conversation. This makes the rescue command
**unreliable for substantial PRs** — exactly the cases where review adds the
most value [Issue #122][18].

Sources: [18]

---

### 9. Review Gate Has a Critical Configuration Bug [CONFIDENCE: HIGH]

Issue #59 documents a silent failure in the review gate setup:

- `/codex:setup --enable-review-gate` writes `"stopReviewGate": true` to a
  **temp directory** (no `CLAUDE_PLUGIN_DATA` env var set in Bash context)
- The Stop hook reads from the **persistent plugin data directory** (where
  `CLAUDE_PLUGIN_DATA` IS set)
- Result: gate appears enabled but never activates; users believe they have a
  quality gate when they do not

This is a silent failure with no user warning. The bug remains open as of April
2026 [19].

Sources: [19]

---

### 10. The `/codex:review` Command Is Not Steerable [CONFIDENCE: HIGH]

Standard `/codex:review` accepts no focus text or custom review instructions —
it performs a fixed-format read-only review of uncommitted changes. Only
`/codex:adversarial-review` is described as "steerable" (challenges design
assumptions). Neither supports inline guidance beyond `--base <ref>` for branch
comparison. This contrasts with native Codex where you can provide freeform
prompts directing the analysis [1].

Sources: [1]

---

## Sources

| #   | URL                                                                                  | Title                                                    | Type               | Trust  | CRAAP     | Date     |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------ | ------ | --------- | -------- |
| 1   | https://github.com/openai/codex-plugin-cc/blob/main/README.md                        | README — Codex Plugin for Claude Code                    | Official docs      | HIGH   | 5/5/5/5/5 | Mar 2026 |
| 2   | https://developers.openai.com/codex/cli/features                                     | Features — Codex CLI                                     | Official docs      | HIGH   | 5/5/5/5/5 | 2026     |
| 3   | https://developers.openai.com/codex/models                                           | Models — Codex                                           | Official docs      | HIGH   | 5/5/5/5/5 | 2026     |
| 4   | https://deepwiki.com/openai/codex-plugin-cc                                          | openai/codex-plugin-cc DeepWiki                          | Community analysis | MEDIUM | 4/4/3/4/4 | 2026     |
| 5   | https://www.mindstudio.ai/blog/openai-codex-plugin-claude-code-cross-provider-review | Cross-Provider AI Review — MindStudio                    | Community analysis | MEDIUM | 4/5/3/4/4 | 2026     |
| 6   | https://smartscope.blog/en/blog/codex-plugin-cc-openai-claude-code-2026/             | OpenAI Releases Official Claude Code Plugin — SmartScope | Community analysis | MEDIUM | 4/4/3/3/4 | Mar 2026 |
| 7   | https://github.com/openai/codex-plugin-cc/issues/124                                 | Issue #124: Support --dangerously-skip-permissions       | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |
| 8   | https://developers.openai.com/codex/agent-approvals-security                         | Agent Approvals & Security — Codex                       | Official docs      | HIGH   | 5/5/5/5/5 | 2026     |
| 9   | https://www.mintlify.com/openai/codex-plugin-cc/configuration/codex-config           | Codex Configuration — Plugin Docs                        | Official docs      | HIGH   | 5/5/5/5/5 | 2026     |
| 10  | https://github.com/openai/codex-plugin-cc/pull/72                                    | PR #72: Let Claude Code agents use OpenAI models         | GitHub PR          | HIGH   | 5/5/4/4/5 | Apr 2026 |
| 11  | https://smartscope.blog/en/blog/claude-code-codex-review-loop-automation-2026/       | Automating Claude Code × Codex Review Loop               | Community          | MEDIUM | 4/4/3/3/4 | 2026     |
| 12  | https://blakecrosley.com/blog/codex-vs-claude-code-2026                              | Codex CLI vs Claude Code Architecture Deep Dive          | Community          | MEDIUM | 3/4/3/3/4 | 2026     |
| 13  | https://github.com/openai/codex-plugin-cc/issues/116                                 | Issue #116: Windows spawn errors block review            | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |
| 14  | https://github.com/openai/codex-plugin-cc/issues/113                                 | Issue #113: Plugin install error on Windows              | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |
| 15  | https://github.com/openai/codex-plugin-cc/issues/18                                  | Issue #18: bwrap permissions on Linux                    | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |
| 16  | https://github.com/openai/codex/issues                                               | Codex CLI Issues — bwrap regressions                     | GitHub issues      | HIGH   | 5/5/5/4/5 | 2026     |
| 17  | https://github.com/openai/codex-plugin-cc/issues/58                                  | Issue #58: Azure OpenAI auth not recognized              | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |
| 18  | https://github.com/openai/codex-plugin-cc/issues/122                                 | Issue #122: Rescue timeout on large diffs                | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |
| 19  | https://github.com/openai/codex-plugin-cc/issues/59                                  | Issue #59: Review gate writes to temp dir                | GitHub issue       | HIGH   | 5/5/5/4/5 | Apr 2026 |

---

## Contradictions

**Interactive mode presence**: The plugin README and docs describe
`/codex:rescue` as supporting `--resume` and `--fresh` flags, suggesting some
session continuity. However, the native CLI's full interactive TUI
(approve/reject steps, theme customization, fuzzy file search) has no analogue
in the plugin. Community sources describe the plugin as "just a wrapper" while
official docs emphasize unique background job management. The characterization
of "interactive" in rescue context means "continue a previous rescue thread,"
not a live TUI session.

**Review gate reliability**: OpenAI's README warns users to actively monitor the
review gate. Issue #59 reveals the gate is silently broken out-of-the-box due to
a temp vs. persistent directory mismatch. These two facts conflict: OpenAI ships
the feature with warnings to use it carefully, but the feature may not work at
all in its current state.

---

## Gaps

1. **o-series model support**: Could not confirm whether OpenAI's o3, o4, or any
   named "reasoning model" series works with the plugin. The Codex CLI model
   namespace has shifted to `gpt-5.x` naming; o-series may be retired or
   renamed. No documentation or issue threads address this directly.
2. **Quantitative performance benchmarks**: No timing data comparing
   plugin-mediated reviews vs. direct `codex review` CLI execution. Anecdotal
   reports say "multi-file review might take a while" but no numbers exist.
3. **gpt-5.3-codex-spark Pro restriction**: The `spark` alias is listed as
   "ChatGPT Pro only" in README but no detailed restriction enforcement
   documentation was found — unclear if this is enforced at the CLI level or
   just a recommendation.
4. **PR #72 merge status**: The `/codex:agents` multi-model switching PR was
   open as of research date. If merged, it would significantly change the
   model-selection capability profile.
5. **Broker idle timeout behavior**: Issue #108 (open) — broker process cleanup
   has "no idle timeout," leaving processes running. No resolution or timeline
   documented.

---

## Serendipity

- **Context window asymmetry as a capability**: Codex's 1M token window
  (GPT-5.4) vs Claude's 200K means routing large-codebase reviews through the
  plugin to Codex may yield qualitatively better coverage than Claude reviewing
  its own output — an architectural advantage not mentioned in official plugin
  documentation.
- **PR #72 proposes a model-switching agent layer**: If merged, `/codex:agents`
  would let individual Claude Code agents run on OpenAI models using a
  "thin-forwarder pattern" (Claude Haiku makes a single Bash call) — near-zero
  Anthropic quota burn for delegated tasks. This is a potentially significant
  cost optimization not yet in official docs.
- **54 open issues as of April 2026**: The issues list shows the plugin is
  actively buggy in production, with 54 open items and notable architectural
  problems (infinite loops, auth gaps, Windows breakage, timeout failures). The
  v1.0.2 version number suggests early-stage maturity.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM-HIGH claims: 1
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — findings are backed by official docs, verified
  GitHub issues, and cross-referenced community analysis. Model restriction gap
  (o-series) is honestly flagged as unresolved.
