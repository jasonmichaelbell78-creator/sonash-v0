# D3: Plugin Setup and Configuration

**Searcher:** deep-research-searcher **Profile:** docs + web **Date:**
2026-04-03 **Sub-Question IDs:** SQ-3

---

## Sub-questions Addressed

- SQ-3: Setup and configuration — requirements, API keys, permissions,
  integration steps

---

## Findings

### 1. Dual Account Requirement: Both Anthropic and OpenAI Credentials Are Needed [CONFIDENCE: HIGH]

The plugin bridges two separate ecosystems, and each side requires its own
authentication. Claude Code requires an active Anthropic account (subscription
or API key) as its baseline. The Codex plugin additionally requires either a
ChatGPT subscription (Free tier is sufficient) or an OpenAI API key [1][2][5].
There is no way to use the plugin with only one set of credentials. This dual
requirement adds adoption overhead for teams and requires independent credential
management on both platforms.

The Codex plugin uses the local Codex CLI for its OpenAI auth path, so if you
already have Codex CLI authenticated on the machine, no additional login is
needed. If not, `!codex login` initiates the OpenAI authentication flow [1][3].

### 2. Node.js 18.18+ Is the Only Runtime Prerequisite [CONFIDENCE: HIGH]

Beyond API credentials, the only hard runtime prerequisite is Node.js 18.18 or
later [1][2][3][4]. No other system-level dependencies are documented. The Codex
CLI itself can be installed automatically during setup or pre-installed via
`npm install -g @openai/codex` [1].

### 3. Four-Step Installation Process via Claude Code's Plugin System [CONFIDENCE: HIGH]

The plugin uses Claude Code's native plugin infrastructure. The canonical
install sequence, verified across the official GitHub repo and multiple
independent sources [1][2][3][4]:

1. **Add marketplace source:** `/plugin marketplace add openai/codex-plugin-cc`
2. **Install the plugin:** `/plugin install codex@openai-codex`
3. **Reload plugin list:** `/reload-plugins`
4. **Run setup/verification:** `/codex:setup`

If Codex CLI is not detected at step 4, `/codex:setup` offers to install it
automatically. If authentication is missing, it prompts with `!codex login` [1].

The install scope can be set to user-level, project-level, or
local/repository-level at step 2, which determines how broadly the plugin is
available [3].

### 4. Two-Tier Configuration File System (User-Level and Project-Level) [CONFIDENCE: HIGH]

All plugin configuration flows through the standard Codex CLI config file
system, not through any Claude Code-specific config [2][6]. Two levels are
supported:

- **User-level:** `~/.codex/config.toml` — applies to all repositories on the
  machine
- **Project-level:** `.codex/config.toml` at the repository root — requires
  explicit project trust to load

Key config options available in `config.toml`:

```toml
model = "gpt-5.4-mini"                  # model used by all plugin commands
model_reasoning_effort = "xhigh"         # none | minimal | low | medium | high | xhigh
openai_base_url = "https://custom.url"   # redirect to custom/alternative endpoints
```

Per-command overrides are also available. For example:
`/codex:rescue --model gpt-5.4-mini --effort medium investigate the flaky test`
[2][6]

A named alias `spark` maps to `gpt-5.3-codex-spark` as a lower-cost option [2].

### 5. Codex Sandbox Security Model and Permission Tiers [CONFIDENCE: HIGH]

The plugin inherits Codex's security model, which separates two concerns:
sandboxing (what the process can technically access) and approval policy (when
human sign-off is required) [7].

Default behavior under the `Auto` preset:

- File reading within workspace: automatic
- File edits in the active working directory: automatic
- External file writes, network access, untrusted commands: require explicit
  approval

Protected paths are always read-only regardless of other settings:

- `.git/` directories and pointer files
- `.agents/` and `.codex/` directories

Network access is **off by default** for the agent phase. It can be enabled via
`network_access = true` in `config.toml`, but this is not recommended without a
risk assessment [7].

There is a known security issue (GitHub issue #15680, March 2026): Codex can
modify its own project-level `.codex/config.toml` without user approval, which
is a documented permission gap [8].

### 6. Billing: Codex Usage Counts Against OpenAI Plan Limits, Not Anthropic [CONFIDENCE: HIGH]

All Codex API calls made by the plugin consume OpenAI usage limits, completely
independently of any Claude Code or Anthropic billing [1][2][4][5].
Specifically:

- ChatGPT Free tier subscription limits apply if using a free account
- OpenAI API key usage-based billing applies if using an API key
- Model choice directly affects cost: `gpt-5.4` is the most expensive;
  `gpt-5.4-mini` and `spark` (`gpt-5.3-codex-spark`) are lower-cost alternatives
  [5]
- The SmartScope review recommends explicitly specifying `--model gpt-5.4-mini`
  in commands to avoid unintentional expensive model selection [5]

There is no additional billing tier or surcharge for using Codex through the
plugin vs. directly.

### 7. Review Gate Feature Is Optional and Carries a Usage-Drain Risk Warning [CONFIDENCE: HIGH]

The plugin includes an optional "review gate" mode, enabled via:
`/codex:setup --enable-review-gate`

When active, Codex automatically reviews Claude Code's output before it
finalizes a response. If issues are found, Claude Code is blocked until they are
addressed. This creates a loop between the two AI systems [1][2][3][4][5].

**Official warning from OpenAI:** This feature "can create long-running loops
and drain usage limits quickly" and should only be enabled under active human
supervision. It is explicitly not recommended for unmonitored or high-volume
workflows.

### 8. The Plugin Delegates Entirely Through Local Codex CLI — No New Network Routes [CONFIDENCE: HIGH]

The plugin is architecturally thin: it wraps the local Codex CLI and Codex app
server. All authentication, environment variables, and MCP server configuration
already present in your local Codex setup are inherited automatically. There is
no separate plugin-level network configuration [1][3]. This means any custom
`openai_base_url`, environment variable overrides, or MCP servers configured in
your local Codex install are automatically available to the plugin.

---

## Sources

| #   | URL                                                                             | Title                                                                     | Type                  | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------- | ------ | ----- | ---------- |
| 1   | https://github.com/openai/codex-plugin-cc                                       | GitHub: openai/codex-plugin-cc (official README)                          | Official repo         | HIGH   | 4.8   | 2026-03-30 |
| 2   | https://www.mintlify.com/openai/codex-plugin-cc/configuration/codex-config      | Codex Configuration – Codex Plugin for Claude Code                        | Official docs mirror  | HIGH   | 4.6   | 2026-03    |
| 3   | https://alphasignalai.substack.com/p/you-can-now-trigger-codex-from-claude      | You can now trigger Codex from Claude Code                                | Blog/newsletter       | MEDIUM | 3.8   | 2026-03    |
| 4   | https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186 | Introducing Codex Plugin for Claude Code (OpenAI Community)               | Official announcement | HIGH   | 4.5   | 2026-03-30 |
| 5   | https://smartscope.blog/en/blog/codex-plugin-cc-openai-claude-code-2026/        | OpenAI Releases Official Claude Code Plugin — What codex-plugin-cc Means  | Tech blog             | MEDIUM | 3.7   | 2026-03    |
| 6   | https://www.mintlify.com/openai/codex-plugin-cc/configuration/codex-config      | Configuration Reference (Mintlify docs mirror)                            | Docs                  | HIGH   | 4.5   | 2026-03    |
| 7   | https://developers.openai.com/codex/agent-approvals-security                    | Agent Approvals & Security – Codex OpenAI Developers                      | Official docs         | HIGH   | 4.7   | 2026       |
| 8   | https://github.com/openai/codex/issues/15680                                    | Codex agent modifies .codex/config.toml without permission (GitHub Issue) | Bug report            | MEDIUM | 4.0   | 2026-03    |

---

## Contradictions

None significant. All sources agree on the core requirements (Node.js 18.18+,
OpenAI credential, dual-auth model). Minor variance: some sources describe the
install scope selection step as explicitly offered during `/plugin install`,
while others omit it. This is likely a UI detail that may vary by Claude Code
version.

One area of ambiguity: the exact Claude Code version required for plugin
support. No minimum Claude Code version is documented in any source. It is
implied the plugin system is a current Claude Code capability, but no version
floor is stated.

---

## Gaps

1. **Minimum Claude Code version not documented.** No source specifies a minimum
   `claude` CLI version that supports the `/plugin` command family. If older
   Claude Code installs are in use, this could block installation.
2. **Windows-specific setup notes are absent.** While Codex's security model
   documents Windows sandbox support (Native sandbox or WSL), no source covers
   Windows-specific plugin install caveats. Given this codebase runs on Windows
   11, this is a relevant gap.
3. **Enterprise/SSO auth paths not covered.** Sources focus on personal ChatGPT
   accounts and API keys. No documentation found for enterprise SSO, Azure
   OpenAI key support, or organizational key management.
4. **Exact Free tier Codex quotas not specified.** The documentation confirms
   Free tier works, but does not quantify what the Codex usage limits are for
   Free accounts when used through the plugin.
5. **Offline/air-gapped setup not addressed.** No documentation on whether the
   plugin can function in restricted network environments beyond the
   `openai_base_url` proxy option.

---

## Serendipity

- **GitHub issue #15680 (March 2026):** Codex agent can modify its own
  `.codex/config.toml` without requesting permission. This is a
  security-relevant gap for teams that use project-level config to enforce
  model/policy constraints — the config can be silently overwritten by Codex
  itself.
- **Custom endpoint support (`openai_base_url`):** The `openai_base_url` config
  option means the plugin can be redirected to Azure OpenAI, LiteLLM proxies, or
  other OpenAI-compatible endpoints. This is underdocumented but potentially
  significant for enterprise deployments or cost management.
- **The plugin architecture was authored by Dkundel (OpenAI's developer
  relations lead)** per the LinkedIn announcement, suggesting it is an
  officially maintained first-party integration, not a community experiment.

---

## Confidence Distribution

- HIGH: 8 claims
- MEDIUM: 0 claims
- LOW: 0 claims
- UNVERIFIED: 0 claims

**Overall confidence: HIGH** — All key findings verified across 2+ independent
sources including the official GitHub repository, official OpenAI developer
docs, and official community announcement.
