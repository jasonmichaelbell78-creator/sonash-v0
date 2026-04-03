# Findings: Security and Privacy Implications of the Codex Claude Code Plugin

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-03
**Sub-Question IDs:** SQ-6

---

## Key Findings

### 1. Data Flow Architecture: Code Reaches OpenAI via Cloud Sandbox [CONFIDENCE: HIGH]

When using the codex-plugin-cc, code is NOT sent directly from the plugin
itself. The plugin delegates to the local Codex CLI binary, which communicates
with OpenAI's cloud infrastructure. The data transmission path is:

```
Claude Code -> codex-plugin-cc -> local Codex CLI binary -> Codex app-server (local, JSON-RPC 2.0) -> OpenAI API (cloud)
```

For cloud tasks (the default mode for `/codex:review`, `/codex:rescue`, etc.),
OpenAI's Codex **clones the connected GitHub repository** and checks it out at
the selected branch/commit SHA into an isolated OpenAI-managed container. This
means the **full repository is uploaded to OpenAI's cloud**, not just a diff or
context snippet. The context window supports ~192k tokens, allowing ingestion of
large codebases [1][3].

For local CLI-only interactions, only the specific context/prompts necessary for
the task are transmitted — not the full codebase [5]. However, the plugin's
primary review commands (web Codex mode) trigger cloud execution.

The plugin itself communicates via:

- **Direct mode**: Spawns `codex app-server` as child process, stdin/stdout
  pipes
- **Broker mode**: Unix domain socket (macOS/Linux) or Named Pipe (Windows) to
  persistent local broker process [2]

The local broker is an important privacy boundary: plugin-to-broker
communication stays on the machine; only the Codex CLI's outbound API calls
leave the machine.

---

### 2. Data Retention: 30 Days for API Users; 12-Hour Cloud Container Cache [CONFIDENCE: HIGH]

OpenAI applies different data retention policies depending on account type:

- **API users (OPENAI_API_KEY)**: By default, abuse monitoring logs are retained
  for **30 days**. Inputs and outputs are NOT used for model training unless the
  API org owner explicitly opts in [4].
- **ChatGPT subscription users (Plus/Pro/Max)**: Consumer accounts may have
  their data used for training by default. Users must opt out via: ChatGPT
  Settings > Data Controls > "Improve the model for everyone" [7].
- **Cloud container cache**: Codex caches the container environment for **up to
  12 hours** to speed follow-up tasks. After 12 hours, the cached state is
  discarded [3].
- **Zero Data Retention (ZDR)**: Available to qualifying enterprise/API
  customers. Excludes content from abuse monitoring and disables storage.
  Requires prior OpenAI approval; contact sales [4].

**Critical nuance**: Codex has **separate training controls** from ChatGPT's
general privacy settings. There is a distinct "full environments" training
toggle in Codex Settings. Adjusting the ChatGPT interface or privacy portal does
NOT affect Codex's full-environment setting — it must be managed independently
in Codex Settings [7].

---

### 3. Training Data Opt-Out: API Users Protected by Default; ChatGPT Subscribers Must Act [CONFIDENCE: HIGH]

- **API key users**: OpenAI does NOT use API inputs/outputs for training by
  default. Must actively opt in to share data. This is the stronger privacy
  posture [4][7].
- **ChatGPT subscription users**: Consumer accounts can have data used for
  training. Must opt out via the privacy portal. The ChatGPT opt-out does NOT
  cover Codex full environments — requires a separate toggle in Codex Settings
  [7].
- **Enterprise users**: Training is disabled; Zero Data Retention is available;
  data not used for improvement [4].

Implication for plugin users: **Recommendation is to authenticate with an API
key rather than a ChatGPT subscription** for stronger default training
protections.

---

### 4. Review Gate Data: Claude's Responses ARE Sent to OpenAI [CONFIDENCE: HIGH]

When the optional review gate is enabled (`/codex:setup --enable-review-gate`),
a `Stop` hook intercepts each Claude session termination. The hook:

1. Collects the current session's code context (git diffs via
   `git diff --cached`, `git diff`, branch diffs via `git merge-base`, untracked
   files up to 24KB each)
2. Packages this as a synchronous Codex task sent to the Codex app-server
3. Receives an `ALLOW` or `BLOCK` decision with a reason string from Codex
   (i.e., from OpenAI's cloud)
4. Returns the decision as JSON to Claude Code

This means **Claude Code's session code changes are sent to OpenAI for review on
every session stop** when the review gate is enabled. The 15-minute timeout per
review indicates substantive processing occurs at OpenAI [2][1].

There is a known bug (Issue #59): the review gate state file is written to
`os.tmpdir() + "codex-companion"` during setup, but the Stop hook reads from
`~/.claude/plugins/data/codex-openai-codex/state/`. This mismatch may cause the
review gate to silently NOT execute despite appearing enabled [6].

---

### 5. API Key Security: OS Keychain Preferred; File Storage Is Risky [CONFIDENCE: HIGH]

Codex supports three credential storage modes:

| Mode             | Storage Location                 | Security Level |
| ---------------- | -------------------------------- | -------------- |
| `keyring`        | OS credential store              | Highest        |
| `file`           | `~/.codex/auth.json`             | Lowest         |
| `auto` (default) | Keychain if available, else file | Medium         |

Official documentation explicitly warns: **"Treat `~/.codex/auth.json` like a
password: it contains access tokens. Don't commit it, paste it into tickets, or
share it in chat."**

The plugin does NOT manage credentials directly — it delegates authentication
entirely to the Codex CLI (`codex login`). No separate plugin-level credential
storage is created. Configuration is stored in `~/.codex/config.toml` and
`.codex/config.toml` [8][2].

Key exposure risk: If `auth.json` exists (fallback mode) and the developer's
home directory is compromised, tokens are exposed in plaintext. Using `keyring`
mode mitigates this.

---

### 6. Critical: Patched GitHub Token Exfiltration Vulnerability (CVE, Feb 2026) [CONFIDENCE: HIGH]

BeyondTrust Phantom Labs disclosed a **critical command injection
vulnerability** in Codex's cloud environment (December 16, 2025; patched
February 5, 2026). The flaw:

- **Vector**: Task creation HTTP request — the GitHub branch name parameter was
  not sanitized
- **Attack**: Injecting malicious shell commands via crafted branch names during
  repo cloning in the cloud sandbox
- **Impact**: Theft of the victim's GitHub User Access Token (short-lived but
  broad access), potentially enabling lateral movement to private repositories,
  CI/CD systems, and supply chain attacks
- **Affected platforms**: ChatGPT website, Codex CLI, Codex SDK, Codex IDE
  Extension

The patch is confirmed as applied across all affected platforms. No active
exploitation was reported [9][10].

**Residual risk for codex-plugin-cc users**: The CLI was patched, but the
pattern reveals that Codex's cloud infrastructure processes branch names from
git metadata — meaning **any git data sent with a Codex task could theoretically
be used as an injection vector** if similar sanitization gaps exist in other
parameters. This warrants ongoing scrutiny of Codex security advisories.

---

### 7. Data Sent to Anthropic: Normal Claude Code Session Data, Not Codex Responses [CONFIDENCE: MEDIUM]

The plugin communicates with Codex via the local Codex binary — Codex responses
are returned to Claude Code's local process, not routed through Anthropic's API.
Therefore, **Codex's AI responses are NOT directly sent to Anthropic**.

However, Claude Code itself sends data to Anthropic during normal operation:

- File contents that Claude reads (for context) are included in API calls to
  Anthropic
- Session telemetry (user IDs, session IDs, platform details) via
  Sentry/GrowthBook
- The review gate returns a BLOCK/ALLOW decision string to Claude Code — this
  decision string would be included in Claude's context window and therefore
  would be part of subsequent API calls to Anthropic [11][13]

The key boundary: Codex's code analysis results (from OpenAI) enter Claude's
context window, and that context window is sent to Anthropic in subsequent
turns. This means **both companies receive the same codebase content**: OpenAI
for the review task, Anthropic for Claude's ongoing session.

Anthropic data retention for Claude Code: 30 days standard for commercial users;
consumer users with training opt-in have 5-year retention; Zero Retention
available for enterprise API customers [13].

---

### 8. Telemetry: Codex CLI Sends Anonymous Usage Data by Default (Opt-Out Available) [CONFIDENCE: HIGH]

Codex CLI sends anonymous usage/health analytics to OpenAI by default. This is
**opt-out**, not opt-in. Data includes:

- Feature flags used
- Number of `/review` commands run
- Approval request acceptance/refusal counts
- Average tool call duration

The documentation confirms: **"None of those will contain code coming from your
codebase."** However, it is metadata about tool usage patterns.

To disable: Set in `~/.codex/config.toml`:

```toml
[analytics]
enabled = false
```

Enterprise admins can disable org-wide via managed config overrides [12][8].

Separate from telemetry: OTel (OpenTelemetry) structured log export is opt-in
and can include prompts/responses unless redacted with
`log_user_prompt = false`.

---

### 9. Compliance: OpenAI Has SOC2, ISO 27001, GDPR Support; Codex Inherits These [CONFIDENCE: HIGH]

OpenAI's platform compliance posture (applicable to Codex as an OpenAI product):

- **SOC 2 Type 2**: Independent examination covering Security, Availability,
  Confidentiality, Privacy for API and ChatGPT Business services [4]
- **ISO/IEC 27001:2022 + ISO/IEC 27701:2019**: Certified for API, ChatGPT
  Enterprise, ChatGPT Edu
- **GDPR**: DPA (Data Processing Addendum) available; supports GDPR, CCPA,
  HIPAA, FERPA compliance
- **Data Residency**: Available for Enterprise/Edu/Healthcare customers in US,
  EU, UK, Japan, Canada, South Korea, Singapore, Australia, India, UAE [4]
- **Zero Data Retention**: Available for qualifying API and Enterprise customers
  (requires prior approval)

**Enterprise/GDPR gap for plugin users**: These compliance protections are
strongest for ChatGPT Enterprise and API Enterprise tier users. **Individual
ChatGPT Plus/Pro subscribers using the plugin do NOT automatically get ZDR or
enhanced compliance controls.** For regulated industries (healthcare, finance,
legal), enterprise contracts are required.

---

### 10. Dual AI Access Risk: Concurrent Claude + Codex Access Expands Attack Surface [CONFIDENCE: MEDIUM]

Running two AI coding agents (Claude via Anthropic + Codex via OpenAI) with
simultaneous repo access creates compounded risk:

1. **Two trust boundaries to maintain**: Each company's data practices, breach
   history, and security posture affect your codebase independently
2. **Credential proliferation**: GitHub tokens/OAuth credentials needed by both
   services; Codex's cloud requires GitHub repository access
3. **Audit complexity**: Tracking which AI made which change becomes harder; no
   unified audit log
4. **Supply chain attack surface**: A compromise of either service's
   infrastructure could affect your codebase (the Feb 2026 Codex GitHub token
   exfiltration was exactly this pattern)
5. **Prompt injection cross-contamination**: The review gate creates a feedback
   loop where Codex's output influences Claude's next actions — a prompt
   injection in Codex's response could potentially propagate to Claude [5][14]

Security experts note: "As AI integration deepens, security controls must evolve
to match the new trust boundaries" (TechRadar, Feb 26, 2026) [14].

---

### 11. Open-Source Auditability: Plugin Code is Auditable; Cloud Processing Is Not [CONFIDENCE: HIGH]

The codex-plugin-cc is Apache-2.0 licensed and fully open source at
`github.com/openai/codex-plugin-cc`. The plugin code — hooks, broker, task
packaging, communication protocol — is fully auditable.

The Codex CLI binary is also open source at `github.com/openai/codex`.

However, **what happens on OpenAI's servers** (in cloud sandboxes) is not
auditable. The cloud execution environment, data retention implementation, and
model processing are black boxes. OpenAI's commitment to "no training on API
data" is policy-based, not cryptographically verifiable [1][2].

---

## Sources

| #   | URL                                                                                                          | Title                                           | Type                          | Trust       | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------- | ----------- | ----- | ---------- |
| 1   | https://github.com/openai/codex-plugin-cc                                                                    | codex-plugin-cc GitHub README                   | Official repo                 | HIGH        | 4.4/5 | 2026-03    |
| 2   | https://deepwiki.com/openai/codex-plugin-cc                                                                  | codex-plugin-cc DeepWiki Architecture           | Community (codebase analysis) | MEDIUM-HIGH | 4.0/5 | 2026-04    |
| 3   | https://developers.openai.com/codex/cloud/environments                                                       | Codex Cloud Environments                        | Official docs                 | HIGH        | 4.6/5 | 2026       |
| 4   | https://developers.openai.com/api/docs/guides/your-data                                                      | Data Controls in OpenAI Platform                | Official docs                 | HIGH        | 4.7/5 | 2026       |
| 5   | https://milvus.io/ai-quick-reference/is-codex-cli-secure-and-how-is-my-code-or-data-handled-during-execution | Codex CLI Security FAQ                          | Community (aggregated)        | MEDIUM      | 3.5/5 | 2026       |
| 6   | https://github.com/openai/codex-plugin-cc/issues/59                                                          | Review Gate Bug Issue #59                       | Official issue tracker        | HIGH        | 4.2/5 | 2026       |
| 7   | https://x.com/mark_k/status/1969663643169022396                                                              | Codex opt-out step-by-step (Mark Kretschmann)   | Community (social)            | MEDIUM      | 3.0/5 | 2026       |
| 8   | https://developers.openai.com/codex/auth                                                                     | Codex Authentication Docs                       | Official docs                 | HIGH        | 4.6/5 | 2026       |
| 9   | https://thehackernews.com/2026/03/openai-patches-chatgpt-data.html                                           | OpenAI Patches Codex GitHub Token Vulnerability | Journalism (established)      | MEDIUM-HIGH | 4.0/5 | 2026-03    |
| 10  | https://www.beyondtrust.com/blog/entry/openai-codex-command-injection-vulnerability-github-token             | BeyondTrust: Codex Command Injection            | Security research             | HIGH        | 4.5/5 | 2026-02    |
| 11  | https://www.theregister.com/2026/04/01/claude_code_source_leak_privacy_nightmare/                            | Claude Code Source Leak Privacy Concerns        | Journalism (established)      | MEDIUM-HIGH | 3.8/5 | 2026-04-01 |
| 12  | https://github.com/openai/codex/discussions/8291                                                             | Codex Client Analytics Discussion               | Official community            | HIGH        | 4.3/5 | 2026       |
| 13  | https://code.claude.com/docs/en/security                                                                     | Claude Code Security Docs                       | Official docs (Anthropic)     | HIGH        | 4.7/5 | 2026       |
| 14  | https://www.techradar.com/pro/security/security-experts-flag-multiple-issues-in-claude-code                  | Security Experts Flag Claude Code Issues        | Journalism                    | MEDIUM      | 3.5/5 | 2026-02-26 |
| 15  | https://openai.com/enterprise-privacy/                                                                       | Enterprise Privacy at OpenAI                    | Official policy               | HIGH        | 4.5/5 | 2026       |

---

## Contradictions

**Training opt-out complexity**: OpenAI's official API documentation says API
users are opted out of training by default [4]. But a community post confirms
Codex has a **separate** "full environments" training toggle that is independent
of both the ChatGPT privacy portal and the API org settings [7]. It is unclear
whether this Codex-specific toggle defaults to enabled or disabled for API-key
users. The official API docs do not address the Codex-specific control. This is
a meaningful gap — API users may believe they are protected when the
Codex-specific toggle remains at its default state.

**Telemetry defaults conflict**: One source describes telemetry as "disabled by
default and requires explicit opt-in" for OTEL export [12], while another states
analytics default to "enabled with opt-out" [12, same discussion]. The
resolution: anonymous usage metrics are **opt-out** (enabled by default); OTel
structured log export (which can include prompts) is **opt-in** (disabled by
default). These are different systems but are described with confusingly similar
language.

---

## Gaps

1. **Codex-specific "full environments" training toggle default state for API
   users**: Official documentation does not clearly state whether this toggle is
   on or off by default for API key authentication users specifically. Community
   sources confirm the toggle exists and is separate from other settings, but
   the default for API-tier users is unverified.

2. **Exact data packaged in review gate request**: The plugin constructs a
   review task from `git diff`, `git diff --cached`, branch diffs, and untracked
   files (24KB cap). It is not confirmed whether the full working tree contents,
   file-by-file, are also included, or only the delta. DeepWiki's analysis
   suggests diffs only, but this was not confirmed against source code.

3. **Broker socket security**: The DeepWiki analysis notes no
   authentication/authorization between socket clients and the local broker.
   This could be a local privilege escalation vector on multi-user systems — but
   no security research has addressed this specific vector yet.

4. **Post-patch security assessment**: The Feb 2026 GitHub token vulnerability
   was patched, but no independent security audit of the post-patch Codex
   codebase has been published. The patch was confirmed by OpenAI; independent
   verification is absent.

5. **Claude Code source leak implications**: The Register's April 1, 2026
   coverage of a Claude Code source code leak raised concerns about the scope of
   data Anthropic collects. The full implications for plugin-mediated sessions
   (where Codex results enter the context window) were not formally addressed by
   Anthropic.

6. **DPA/GDPR coverage for Codex specifically**: While OpenAI offers a DPA for
   API users, it is unclear if Codex's cloud execution environment is explicitly
   covered under the standard DPA or requires a separate agreement.

---

## Serendipity

**ChatGPT Covert Outbound Channel (patched March 2026)**: Concurrent with the
Codex GitHub token vulnerability, Check Point researchers discovered a covert
DNS-based data exfiltration channel in ChatGPT's code execution runtime. This
channel encoded data into DNS requests to bypass network controls. It was
patched. Relevance: both vulnerabilities demonstrate that OpenAI's cloud
execution environments have had serious data leakage vectors, and the pattern of
"secure sandbox with unexpected exfiltration channels" warrants conservative
trust in cloud AI execution environments generally.

**Claude Code Source Leak (April 1, 2026)**: Published just 2 days before this
research, The Register reported analysis of Claude Code source code revealing
that "every single file Claude looks at gets saved and uploaded to Anthropic"
and extensive telemetry. The codex-plugin-cc review gate returns results into
Claude's context window, which means Codex review findings (OpenAI data) would
be included in what gets sent to Anthropic. This creates a data intermingling
situation where one company's AI analysis of your code enters the other
company's AI's context.

**Codex-plugin-cc was NOT listed among affected platforms** in the Feb 2026
GitHub token vulnerability disclosure. Only "ChatGPT website, Codex CLI, Codex
SDK, Codex IDE Extension" were listed. However, since the plugin wraps the Codex
CLI, which was patched, plugin users are covered by the CLI patch.

**Issue #429** (openai/codex, April 2025): Community request for privacy
documentation went unanswered by OpenAI for months before a PR was eventually
closed in August 2025 adding a privacy policy to the Codex CLI README. This
signals that OpenAI's documentation of Codex privacy practices lagged behind
deployment by ~4 months.

---

## Confidence Assessment

- HIGH claims: 7 (data flow architecture, retention policies, training opt-out,
  review gate behavior, credential storage, Codex vulnerability, compliance
  certifications)
- MEDIUM claims: 3 (Anthropic data flow for plugin results, dual-AI risk,
  community-sourced specifics)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **MEDIUM-HIGH** — Official documentation and verified
  security research provide strong foundations. Key gaps exist around
  Codex-specific training toggle defaults and exact review gate payload
  composition.
