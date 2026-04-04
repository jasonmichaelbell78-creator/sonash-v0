# Findings: OpenAI Codex — Pricing, Models, and Usage Limits (April 2026)

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-04-03
**Sub-Question IDs:** D11

---

## Key Findings

### 1. Codex Is Not a Standalone Product — It Is Bundled With ChatGPT Plans [CONFIDENCE: HIGH]

There is no separate "Codex subscription." Codex capabilities are included in
ChatGPT subscription tiers. The current plan structure as of April 2026 is:

| Plan           | Monthly Cost | Primary Use Case                                 |
| -------------- | ------------ | ------------------------------------------------ |
| Free           | $0           | Temporary promotional access only (limited time) |
| Go             | $8           | Lightweight coding tasks                         |
| Plus           | $20          | A few focused coding sessions weekly             |
| Pro            | $200         | Daily full-time development                      |
| Business       | $30/user     | Team workspaces, pay-as-you-go credits           |
| Enterprise/Edu | Custom       | Contact sales                                    |

The **Free tier inclusion is a time-limited promotion** (active as of April 2026
with doubled rate limits across all paid tiers). This is not a permanent feature
[1][4].

---

### 2. Usage Limits Are a 5-Hour Rolling Window (Not Monthly Caps) [CONFIDENCE: HIGH]

Codex uses a rolling 5-hour window for message/task limits. Limits reset
automatically without manual action. When the window limit is reached, Codex
becomes unavailable until the window refreshes — there are **no overage charges
on subscription plans** [1][2].

**Limits by model and tier (per 5-hour window):**

| Model                             | Plus                  | Pro                      | Business |
| --------------------------------- | --------------------- | ------------------------ | -------- |
| GPT-5.4 (flagship)                | 33–168 local messages | 223–1,120 local messages | 15–60    |
| GPT-5.4-mini (fast/cheap)         | 110–560               | 743–3,733                | 40–200   |
| GPT-5.3-Codex (coding specialist) | 45–225                | 300–1,500                | 20–90    |

**Cloud tasks and code reviews have separate limits:**

- Plus: 10 cloud tasks/week
- Pro: 50 cloud tasks/week + 100–250 code reviews/week [1]

The wide ranges in the table (e.g., "33–168") reflect variable token consumption
per message. Longer context and more complex tasks consume more of the limit per
interaction [1][6].

---

### 3. Available Models: Four Current + Seven Legacy [CONFIDENCE: HIGH]

**Current recommended models (as of April 2026):**

| Model                 | Description                                                 | Availability     |
| --------------------- | ----------------------------------------------------------- | ---------------- |
| `gpt-5.4`             | Flagship — combines coding, reasoning, agentic workflows    | All paid plans   |
| `gpt-5.4-mini`        | Fast, efficient; best for sub-agents and responsive tasks   | All paid plans   |
| `gpt-5.3-codex`       | Industry-leading coding specialist; powers gpt-5.4's coding | All paid plans   |
| `gpt-5.3-codex-spark` | Research preview; 1,000+ tokens/sec real-time coding        | ChatGPT Pro only |

**Legacy models (deprecated, succeeded by above):** `gpt-5.2-codex`, `gpt-5.2`,
`gpt-5.1-codex-max`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-5-codex`, `gpt-5` [3]

**Note on `gpt-5.3-codex-spark`:** Launched February 12, 2026. Designed for
near-instant interactive use. API access was in limited partner preview at
launch with broader rollout following [7]. It is explicitly **text-only** and
labeled research preview [3].

---

### 4. API Key vs. ChatGPT Subscription: Separate Billing, Different Features [CONFIDENCE: HIGH]

**Subscription mode (ChatGPT auth):**

- Usage draws from plan's included message/task limits at no additional cost
- Includes cloud features: GitHub code reviews, Slack integrations, Codex Cloud
  web UI
- Limits refresh on the 5-hour rolling window
- Can purchase additional credits when limits are exhausted [1][2]

**API key mode:**

- Pay-per-token; no rolling window caps
- No cloud features (GitHub reviews, Slack) — only local CLI and SDK use
- Standard API token rates apply (see pricing below) [1][2]

**API token pricing (as of March–April 2026):**

| Model        | Input (per 1M tokens) | Output (per 1M tokens) | Context Window |
| ------------ | --------------------- | ---------------------- | -------------- |
| GPT-5.4      | $2.50                 | $10.00                 | 256K           |
| GPT-5.4-mini | $0.40                 | $1.60                  | 128K           |

**Rate limits for API key users (standard tiers):**

| API Tier | Requests/Min | Tokens/Min | Tokens/Day |
| -------- | ------------ | ---------- | ---------- |
| Free     | 3            | 40,000     | 200,000    |
| Tier 2   | 120          | 400,000    | 10,000,000 |

Most individual developers qualify for Tier 2. Real-world intensive coding costs
approximately $2.00/day with GPT-5.4, or $0.32/day with GPT-5.4-mini [6].

---

### 5. April 2, 2026 Pricing Change: Token-Based Credits for Business/Enterprise [CONFIDENCE: HIGH]

As of April 2, 2026, OpenAI shifted Business and new Enterprise plans from
per-message pricing to **token-based credit consumption**:

| Model         | Input (credits/1M tokens) | Cached Input | Output |
| ------------- | ------------------------- | ------------ | ------ |
| GPT-5.4       | 62.50                     | 6.25         | 375    |
| GPT-5.3-Codex | 43.75                     | ~4.38        | ~262   |

"Fast mode" (if enabled) doubles credit usage. This change does NOT affect
Plus/Pro individual subscribers, who retain the 5-hour window message limits
[1][2].

---

### 6. Cost Comparison with Claude Code [CONFIDENCE: MEDIUM]

**Subscription parity at $20 and $200/month:**

- Claude Code Pro ($20/mo) ↔ ChatGPT Plus ($20/mo) — rough parity at entry tier
- Claude Code Max 20x ($200/mo) ↔ ChatGPT Pro ($200/mo) — same price point

**Claude Code Max 5x ($100/mo) has no direct Codex equivalent.** Codex jumps
from $20 to $200 with nothing in between (for individual plans) [5][8].

**Token efficiency differential (community benchmarks — MEDIUM confidence):**
Multiple community analyses report Codex CLI consumes 3.2x–4.2x fewer tokens
than Claude Code for equivalent tasks:

| Task               | Codex tokens | Claude tokens | Ratio |
| ------------------ | ------------ | ------------- | ----- |
| Figma plugin build | 1.5M         | 6.2M          | 4.2x  |
| Scheduler app      | 73K          | 235K          | 3.2x  |
| API integration    | ~180K        | ~650K         | 3.6x  |

This efficiency claim correlates with Claude's more thorough/verbose output
style. **These are community-reported benchmarks, not OpenAI/Anthropic official
figures** [8].

**API cost comparison:**

- Claude Sonnet 4.6: $3 input / $15 output per 1M tokens
- Claude Opus 4.6: $5 input / $25 output per 1M tokens
- GPT-5.4: $2.50 input / $10.00 output per 1M tokens
- GPT-5.4-mini: $0.40 input / $1.60 output per 1M tokens

At API rates, Codex is cheaper per token, but if Claude uses fewer turns to
complete complex tasks, total cost may be similar [8].

---

### 7. Simultaneous Usage Cost Accumulation [CONFIDENCE: MEDIUM]

**When using both services simultaneously (e.g., Claude Code + Codex plugin):**

- **Subscription costs stack independently**: A Claude Code Max subscription and
  a ChatGPT Pro subscription are separate $200/mo charges = $400/mo total
- **API costs accumulate per-token** on whichever service is actively processing
- **No cross-service credit system** — OpenAI and Anthropic billing are fully
  independent
- **Within a single session**, using the Codex plugin inside Claude Code means
  Claude Code token costs apply for orchestration/context, PLUS Codex token or
  subscription limit consumption for Codex-handled tasks [2][5][6]

The plugin README's statement "Usage will contribute to your Codex usage limits"
means: when the plugin calls Codex, it draws from your Codex subscription window
limits (if using ChatGPT auth) or charges your OpenAI API account (if using API
key). There is no double-billing for the same request, but both Claude Code and
Codex accrue costs from their respective accounts for their respective
processing.

---

### 8. Free Tier Is Promotional and Time-Limited [CONFIDENCE: HIGH]

The search results confirm that Free tier Codex access (active April 2026) is
explicitly described as "for a limited time" and includes "severe usage
restrictions" [4]. It should not be relied upon for sustained developer workflow
integration. The plugin README claiming support for "ChatGPT Free tier" is
accurate as of April 2026 but may not remain so.

---

## Sources

| #   | URL                                                                       | Title                                                   | Type               | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------ | ------ | ----- | ---------- |
| 1   | https://developers.openai.com/codex/pricing                               | Pricing – Codex (OpenAI Developers)                     | Official docs      | HIGH   | 4.8   | April 2026 |
| 2   | https://developers.openai.com/codex/models                                | Models – Codex (OpenAI Developers)                      | Official docs      | HIGH   | 4.8   | April 2026 |
| 3   | https://openai.com/index/introducing-gpt-5-3-codex-spark/                 | Introducing GPT-5.3-Codex-Spark (OpenAI)                | Official blog      | HIGH   | 4.5   | Feb 2026   |
| 4   | https://www.getaiperks.com/en/articles/codex-pricing                      | OpenAI Codex Pricing 2026 (Get AI Perks)                | Community blog     | MEDIUM | 3.5   | 2026       |
| 5   | https://northflank.com/blog/claude-code-vs-openai-codex                   | Claude Code vs OpenAI Codex (Northflank)                | Tech blog          | MEDIUM | 3.4   | 2026       |
| 6   | https://flowith.io/blog/openai-codex-pricing-2026-api-costs-token-limits/ | Codex Pricing 2026: API Costs, Token Limits (Flowith)   | Community blog     | MEDIUM | 3.4   | 2026       |
| 7   | https://www.helpnetsecurity.com/2026/02/13/openai-gpt-5-3-codex-spark/    | OpenAI released GPT-5.3-Codex-Spark (Help Net Security) | News               | MEDIUM | 3.6   | Feb 2026   |
| 8   | https://www.morphllm.com/comparisons/codex-vs-claude-code                 | Codex vs Claude Code (Morph LLM)                        | Community analysis | MEDIUM | 3.3   | 2026       |
| 9   | https://uibakery.io/blog/openai-codex-pricing                             | Codex Pricing Explained (UI Bakery)                     | Community blog     | MEDIUM | 3.3   | 2026       |
| 10  | https://openai.com/index/beyond-rate-limits/                              | Beyond Rate Limits (OpenAI)                             | Official blog      | HIGH   | 4.5   | 2026       |

---

## Contradictions

**Model naming inconsistency:** The uibakery.io source references models as
"GPT-4.1", "GPT-4.1-mini", and "GPT-5 Codex" while the official
`developers.openai.com/codex/models` page lists `gpt-5.4`, `gpt-5.4-mini`, and
`gpt-5.3-codex`. The uibakery source appears to be using older model names or
confused naming. The official developers.openai.com source is treated as
authoritative [1][2][9].

**Business tier limits vs. Claude Code Pro comparison:** The morphllm comparison
states "Plus gives 30-150 messages per 5-hour window with GPT-5.3-Codex" while
the official pricing page gives "45-225 messages" for Plus on GPT-5.3-Codex. The
wider range from the official source is used here. The promotional period
(doubled limits) may account for part of this discrepancy [1][8].

**Token efficiency claims:** The 4x efficiency claim for Codex over Claude Code
is from community benchmarks on specific task types. These figures should not be
generalized across all workloads. Complex reasoning tasks may show the opposite
pattern.

---

## Gaps

1. **Exact free-tier daily/session limits** — no source provided hard numbers
   for the "severe usage restrictions" on Free tier Codex access.

2. **codex-mini-latest model** — one search result mentioned `codex-mini-latest`
   at $1.50 input / $6.00 output per 1M tokens, but this model does not appear
   on the official models page. It may be an older API-only model or legacy
   naming. Could not verify.

3. **gpt-5.3-codex-spark API pricing** — the model is confirmed Pro-only for
   subscription use, and API access was in limited partner preview. No published
   per-token API price found.

4. **Plugin-specific limits** — the plugin README says usage contributes to
   Codex limits, but no official documentation specifies whether plugin API
   calls use different rate limits than direct CLI usage.

5. **Simultaneous subscription + API key usage** — not officially documented
   whether a user can authenticate with both methods simultaneously or whether
   one takes precedence in the plugin config.

6. **Duration of the April 2026 promotional period** — described as "limited
   time" without a stated end date.

---

## Serendipity

**Open-source maintainer program:** OpenAI is offering free ChatGPT Pro and
Codex access to open-source maintainers. If the SoNash project is ever
open-sourced, this program may provide significant cost reduction [source:
mlq.ai/news/openai-rolls-out-free-chatgpt-pro-and-codex-access-for-open-source-maintainers/].

**Chat Completions API deprecated for Codex:** The official models documentation
explicitly states "support for the Chat Completions API is deprecated and will
be removed in future releases." Any plugin implementation using the older
completions API endpoint will break. The plugin should be using the Responses
API [2].

**Fast mode doubles credits:** For Business/Enterprise users, enabling "fast
mode" doubles credit consumption. This is undocumented in the plugin README and
could catch users off guard if the plugin enables fast mode by default [1].

---

## Confidence Assessment

- HIGH claims: 5 (plan structure, 5-hour window mechanics, model catalog, API vs
  subscription distinction, April 2026 pricing change)
- MEDIUM claims: 3 (cost comparison with Claude Code, simultaneous cost
  accumulation, token efficiency benchmarks)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **MEDIUM-HIGH** (core pricing is from official sources;
  comparison data is community-sourced)
