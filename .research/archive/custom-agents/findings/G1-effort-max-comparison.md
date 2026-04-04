# Findings: effort:max Opus-Exclusivity and Sonnet vs Opus Quality Delta

**Searcher:** deep-research-gap-pursuit-agent **Profile:** web + docs **Date:**
2026-03-29 **Sub-Question IDs:** G1 (gap pursuit — dispute resolution D8
validity)

---

## CRITICAL CORRECTION FLAG

**D8 Dispute Resolution is INVALID as written.**

D8 resolved to use `effort: max` on Sonnet 4.6 instead of migrating
security-auditor to Opus 4.6. The official Anthropic docs explicitly state that
`effort: max` is **Opus 4.6 only**, and **"Requests using `max` on other models
return an error."**

The D8 resolution must be revised. Sonnet 4.6 cannot use `effort: max`.

---

## Key Findings

### 1. effort:max Is Definitively Opus 4.6 Exclusive [CONFIDENCE: HIGH]

The official Anthropic effort documentation states, verbatim:

> "max — Absolute maximum capability with no constraints on token spending.
> **Opus 4.6 only. Requests using `max` on other models return an error.**"

The Claude Code model-config docs corroborate:

> "A fourth level, **max**, provides the deepest reasoning with no constraint on
> token spending, so responses are slower and cost more than at `high`. `max` is
> available on **Opus 4.6 only** and does not persist across sessions except
> through the `CLAUDE_CODE_EFFORT_LEVEL` environment variable."

Additionally, the capabilities table in model-config lists `max_effort` as a
distinct capability that must be declared separately from `effort` for
third-party deployments, confirming it is a gated feature, not a universal
level.

Sending `effort: max` to Sonnet 4.6 does not silently degrade — it **returns an
API error**. The D8 resolution is therefore not just suboptimal; it is
technically non-functional.

**Sources:** [1], [2]

---

### 2. effort:high on Sonnet 4.6 — What It Achieves [CONFIDENCE: HIGH]

`effort: high` on Sonnet 4.6 is the maximum achievable effort level for that
model. Per the docs, `high` is equivalent to omitting the `effort` parameter
entirely (the API default). At `high` effort, Claude "almost always thinks"
using adaptive reasoning.

Key behavioral properties at `effort: high` on Sonnet 4.6:

- Triggers extended thinking on most non-trivial tasks
- "Spending as many tokens as needed for excellent results"
- Documented use case: "complex reasoning, difficult coding problems, agentic
  tasks"

The Sonnet 4.6 guidance section does NOT list `high` as the recommended default
for Sonnet. Anthropic explicitly recommends `medium` as the default for Sonnet
4.6 on agentic tasks, reserving `high` for "tasks requiring maximum intelligence
from Sonnet 4.6." This implies `high` on Sonnet causes meaningful token cost
increases.

Quantitative token cost data (from Artificial Analysis benchmark evaluation of
Sonnet 4.6 at max effort — which for Sonnet is `high`): Sonnet 4.6 consumed
**74M output tokens** on the Intelligence Index at its highest effort, compared
to 25M for Sonnet 4.5 — a **~3x increase** in output tokens. At $15/MTok output,
this represents roughly a 3x cost multiplier vs lower-effort usage patterns.

**Sources:** [1], [3], [4]

---

### 3. How effort:high Sonnet Compares to Default Opus 4.6 [CONFIDENCE: MEDIUM]

No direct head-to-head benchmark exists comparing `effort: high` Sonnet 4.6 vs
default Opus 4.6 at published confidence. However, available evidence allows a
reasonable inference:

**Benchmark gap at baseline (both models at their tested settings):**

| Benchmark                              | Opus 4.6 | Sonnet 4.6 | Gap              |
| -------------------------------------- | -------- | ---------- | ---------------- |
| SWE-bench Verified                     | 80.8%    | 79.6%      | 1.2 pts          |
| GPQA Diamond (PhD science)             | 91.3%    | 74.1%      | **17.2 pts**     |
| OSWorld-Verified (GUI agent)           | 72.7%    | 72.5%      | 0.2 pts          |
| Terminal-Bench 2.0                     | 65.4%    | 59.1%      | 6.3 pts          |
| GDPval-AA (agentic coding)             | 1606 Elo | 1633 Elo   | **Sonnet leads** |
| Artificial Analysis Intelligence Index | 53       | 51         | 2 pts            |

The Artificial Analysis evaluation used both models in "adaptive thinking mode
with max effort" (for Opus: `effort: max`; for Sonnet: effectively
`effort: high`). Even with Sonnet at its highest reachable effort, Opus scores
53 vs Sonnet's 51 on the composite intelligence index.

On **agentic tasks specifically** (GDPval-AA, OSWorld), Sonnet 4.6 is
essentially equal to or slightly ahead of Opus 4.6. The meaningful gap lies in
deep scientific/abstract reasoning (GPQA Diamond: 17.2 points). Coding
performance is near-identical.

For prior-generation comparison: at high effort, Opus 4.5 exceeded Sonnet 4.5 by
4.3 percentage points on SWE-bench while using 48% fewer tokens — demonstrating
that effort level on Opus provides both quality lift and paradoxically greater
token efficiency via more focused reasoning paths.

**Sources:** [3], [4], [5], [6]

---

### 4. Tool Use Quality: Does Effort Level Affect Tool Call Reliability on Sonnet? [CONFIDENCE: MEDIUM]

No empirical study directly benchmarks tool parameter accuracy at different
effort levels within Sonnet 4.6. Available evidence:

**From official docs:** The effort docs explicitly state that higher effort
affects tool calls:

> "Higher effort levels may: Make more tool calls. Explain the plan before
> taking action. Provide detailed summaries. Include more comprehensive code
> comments."

> "Lower effort levels tend to: Combine multiple operations into fewer tool
> calls. Make fewer tool calls. Proceed directly to action without preamble."

This confirms effort level directly affects tool call behavior and thoroughness.

**Cross-model comparison:** On OSWorld-Verified (agentic computer-use
benchmark), Opus 4.6 (72.7%) and Sonnet 4.6 (72.5%) are essentially tied. On
GDPval-AA (large-scale tool-calling benchmark), Sonnet 4.6 ranks #1 globally,
outperforming Opus 4.6 (1633 vs 1606 Elo).

**The D4b finding** ("Opus is much more likely to catch missing tool
parameters") is not directly contradicted by benchmark data, but benchmark
parity on agentic tasks suggests the gap may be narrower than anecdotally
reported. The specific behavior of catching missing required tool parameters vs.
proceeding with inference is not captured in standard benchmarks.

Anthropic's own tool-use docs recommend "Claude Opus" for "complex tools and
ambiguous queries" and where the model "seeks clarification when needed" —
supporting D4b's original finding, though Sonnet 4.6 may have closed some of
this gap.

**Sources:** [1], [7], [8]

---

### 5. Security Analysis Quality: Sonnet vs Opus [CONFIDENCE: MEDIUM]

**Key finding:** Anthropic explicitly used Opus 4.6 (not Sonnet) for their
flagship security vulnerability research, finding 500+ vulnerabilities in
production open-source codebases. The Claude Code Security announcement states:

> "Using **Claude Opus 4.6**, released earlier this month, our team found over
> 500 vulnerabilities in production open-source codebases — bugs that had gone
> undetected for decades."

No equivalent Sonnet 4.6 security benchmark was published in parallel. Anthropic
chose Opus 4.6 for this task; the announcement does not compare Sonnet
performance.

**Reasoning gap relevance:** Security vulnerability discovery is fundamentally a
deep reasoning task — pattern recognition across codebases, understanding
exploit chains, identifying subtle logic flaws. The GPQA Diamond gap (17.2
points) measures exactly this type of domain-specific expert reasoning. The
91.3% vs 74.1% difference likely translates meaningfully to security audit
depth.

**Sonnet 4.6 security improvement:** Sonnet 4.6 shows dramatically improved
prompt injection resistance (attack success rate dropped from 16.23% with Sonnet
4.5 to 0.29% with Sonnet 4.6). This is a defensive security metric, not an
offensive vulnerability discovery metric.

**Recommendation signal from community:** Multiple community sources explicitly
recommend Opus 4.6 for "security-critical code" and "security audits where the
deepest analysis matters," while Sonnet 4.6 is recommended for general coding
and agentic workflows.

**Sources:** [9], [10], [5]

---

### 6. Cost Comparison: effort:high Sonnet vs Default Opus [CONFIDENCE: HIGH]

**Official per-token pricing (from Anthropic pricing docs):**

| Model      | Input   | Output   |
| ---------- | ------- | -------- |
| Sonnet 4.6 | $3/MTok | $15/MTok |
| Opus 4.6   | $5/MTok | $25/MTok |

Opus costs **1.67x input** and **1.67x output** vs Sonnet — not the commonly
cited "5x" figure. (Note: The "5x" figure appears in community sources
referencing older pricing where Opus was $15/$75. Current pricing from official
docs shows Opus is $5/$25.)

**Effort-level token cost impact:** Effort is a behavioral signal, not a strict
budget. At `effort: high`, Sonnet 4.6 triggers extended thinking on most tasks.
Thinking tokens are billed as output tokens at $15/MTok.

Empirical data from Artificial Analysis: Sonnet 4.6 at its highest effort used
74M output tokens on the Intelligence Index benchmark, vs 58M for Opus 4.6 at
`effort: max`. Sonnet used **~28% more output tokens** than Opus despite lower
per-token pricing.

**Effective cost comparison for a security-audit workload (inference):**

- Sonnet at `effort: high`: 74M tokens \* $15/MTok = $1,110 (normalized)
- Opus at `effort: max`: 58M tokens \* $25/MTok = $1,450

At benchmark scale, Sonnet at high effort is approximately **23% cheaper** than
Opus at max effort for compute-equivalent tasks. However, this does not account
for quality gaps: if Opus at max effort produces better security findings per
task (reducing re-runs or missed vulnerabilities), the effective
cost-per-finding may favor Opus despite higher per-request cost.

**For agent tasks (Claude Code costs docs):** "Use Sonnet for teammates. It
balances capability and cost for coordination tasks." This suggests for
non-critical subagent work, Sonnet at medium effort is the cost-optimal choice.

**Sources:** [11], [3], [12]

---

## Implications for D8 Dispute Resolution

The D8 resolution was: **"Use `effort: max` on Sonnet instead of migrating
security-auditor to Opus 4.6."**

This resolution has two distinct problems:

1. **Technical invalidity:** `effort: max` on Sonnet 4.6 returns an API error.
   The resolution as written is non-executable.

2. **Quality gap for security tasks:** Even if the resolution were corrected to
   `effort: high` on Sonnet 4.6, this is substantively different from Opus 4.6
   for security analysis:
   - Anthropic's own security research uses Opus 4.6 exclusively
   - GPQA Diamond (deep domain reasoning) gap is 17.2 points
   - Community consensus recommends Opus for security audits
   - At `effort: high`, Sonnet costs ~23% less than Opus at `effort: max`, but
     the quality gap for security-specific reasoning is non-trivial

**Revised recommendation:** The D8 dispute resolution should be updated to
either:

- Option A: Migrate security-auditor to Opus 4.6 (original option, now supported
  by evidence)
- Option B: Use Sonnet 4.6 at `effort: high` as an acknowledged cost-quality
  tradeoff, with explicit documentation that security depth will be reduced
  compared to Opus
- Option C: Hybrid — use Sonnet at `effort: high` for initial triage, escalate
  to Opus at `effort: max` for final security audit pass

---

## Sources

| #   | URL                                                                                           | Title                                                    | Type                  | Trust  | CRAAP     | Date |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------- | ------ | --------- | ---- |
| 1   | https://platform.claude.com/docs/en/build-with-claude/effort                                  | Effort - Claude API Docs                                 | Official docs         | HIGH   | 5/5/5/5/5 | 2026 |
| 2   | https://code.claude.com/docs/en/model-config                                                  | Model configuration - Claude Code Docs                   | Official docs         | HIGH   | 5/5/5/5/5 | 2026 |
| 3   | https://artificialanalysis.ai/articles/sonnet-4-6-everything-you-need-to-know                 | Sonnet 4.6 - Everything you need to know                 | Benchmark analysis    | HIGH   | 4/5/4/5/5 | 2026 |
| 4   | https://www.anthropic.com/news/claude-sonnet-4-6                                              | Introducing Claude Sonnet 4.6                            | Official announcement | HIGH   | 5/5/5/5/5 | 2026 |
| 5   | https://www.nxcode.io/resources/news/claude-sonnet-4-6-vs-opus-4-6-complete-comparison-2026   | Claude Sonnet 4.6 vs Opus 4.6: Complete Comparison Guide | Community/tech blog   | MEDIUM | 3/5/3/4/4 | 2026 |
| 6   | https://caylent.com/blog/claude-sonnet-4-6-in-production-capability-safety-and-cost-explained | Claude Sonnet 4.6 in Production                          | Technical blog        | MEDIUM | 4/5/3/4/4 | 2026 |
| 7   | https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use              | How to implement tool use - Claude API Docs              | Official docs         | HIGH   | 5/5/5/5/5 | 2026 |
| 8   | https://composio.dev/content/claude-function-calling-tools                                    | Claude 4.5: Function Calling and Tool Use                | Technical blog        | MEDIUM | 3/4/3/3/4 | 2026 |
| 9   | https://www.anthropic.com/news/claude-code-security                                           | Claude Code Security - Anthropic                         | Official announcement | HIGH   | 5/5/5/5/5 | 2026 |
| 10  | https://thehackernews.com/2026/02/claude-opus-46-finds-500-high-severity.html                 | Claude Opus 4.6 Finds 500+ High-Severity Flaws           | Tech news             | MEDIUM | 4/4/3/4/4 | 2026 |
| 11  | https://platform.claude.com/docs/en/about-claude/pricing                                      | Pricing - Claude API Docs                                | Official docs         | HIGH   | 5/5/5/5/5 | 2026 |
| 12  | https://code.claude.com/docs/en/costs                                                         | Manage costs effectively - Claude Code Docs              | Official docs         | HIGH   | 5/5/5/5/5 | 2026 |

---

## Contradictions

**Pricing contradiction:** Community sources (apiyi.com and others) cite Opus
4.6 at $15/$75 per MTok, implying a 5x cost multiplier vs Sonnet. However, the
official Anthropic pricing page (source [11]) lists Opus 4.6 at $5/$25 per MTok
— only 1.67x more than Sonnet ($3/$15). The $15/$75 figures may reflect older
pricing for Opus 4 or Opus 4.1, which the pricing table shows as the older
entries. This contradiction should be resolved by treating the official docs as
authoritative: **current Opus 4.6 is 1.67x Sonnet 4.6 per token.**

**Sonnet effort:max access:** One search snippet stated "The effort parameter
supports effort levels: low, medium, and high. For Opus 4.6 and Sonnet 4.6, the
parameter also supports max effort level." This contradicts the official table
and the explicit error language. The official docs (source [1]) are
authoritative: the table under "Effort levels" is unambiguous that max is "Opus
4.6 only. Requests using `max` on other models return an error." The snippet
appears to be a low-quality AI-summarized paraphrase that introduced an error.

---

## Gaps

- No empirical benchmark directly comparing `effort: high` Sonnet 4.6 vs
  `effort: max` Opus 4.6 on a security-specific vulnerability detection dataset
- No published Anthropic data on tool parameter accuracy rates by model and
  effort level
- No benchmark comparing missed-vulnerability rates between Sonnet and Opus on a
  standardized security audit dataset (the 500+ vulnerability finding used Opus
  exclusively, with no Sonnet control)
- Cost-per-finding for security audits (as opposed to cost-per-token) not
  quantified

---

## Serendipity

**Sonnet 4.6 outperforms Opus 4.6 on agentic coding benchmarks:** On GDPval-AA
(1633 vs 1606 Elo) and Terminal-Bench 2.0 (59.1% vs 65.4% — Opus leads here
actually), Sonnet 4.6 is competitive or dominant for tool-heavy agentic
workflows. This suggests that for non-security agent tasks, the D8 concern about
migrating to Opus may be overcorrecting.

**Opus 4.6 pricing is significantly lower than prior Opus generations:** At
$5/$25 per MTok vs the old $15/$75 for earlier Opus models, the cost argument
against Opus 4.6 is substantially weaker than assumed. The cost delta is 1.67x,
not 5x.

**"ultrathink" keyword:** The model-config docs note that including "ultrathink"
in a prompt triggers `effort: high` for that single turn on Sonnet 4.6 without
changing the session setting. This is a lightweight mechanism for per-request
effort escalation without persistent configuration.

---

## Confidence Assessment

- HIGH claims: 4 (effort:max is Opus-exclusive with error on Sonnet; effort:high
  behaviors; pricing figures from official docs; Anthropic used Opus for
  security research)
- MEDIUM claims: 3 (tool use reliability gap; security analysis quality delta;
  Sonnet vs Opus effective cost at scale)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — the critical finding (effort:max
  Opus-exclusivity) is confirmed by two official Anthropic documentation sources
  with unambiguous language.
