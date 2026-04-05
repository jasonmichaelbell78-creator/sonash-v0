# Findings: Confidence-Level Verification — LOW and MEDIUM Claims

**Searcher:** deep-research-searcher (convergence-loop mode) **Profile:** web +
docs + codebase **Date:** 2026-03-29 **Sub-Question IDs:** CL1 (confidence
upgrade pass)

---

## Per-Claim Verification Results

---

### C-088: GoAgent graph diffusion / $5.60 vs $43.70 cost / "1-2 years" prediction

**Original confidence:** LOW **Recommendation:** KEEP LOW — but with corrected
description

**Evidence found:**

The paper arXiv:2603.19677 (GoAgent) is confirmed to exist. It was submitted
March 20, 2026. Its actual contribution is a **group-centric, autoregressive
topology builder** using a conditional information bottleneck (CIB) objective —
not a graph diffusion model. The GoAgent paper achieves 93.84% average accuracy
with ~17% token reduction vs. the SOTA baseline across six benchmarks [1].

The $5.60 vs $43.70 cost figures do **not appear** in arXiv:2603.19677. A search
of the full HTML version and abstract found no dollar figures whatsoever. These
numbers are not in the companion paper arXiv:2510.07799 (GTD — the actual graph
diffusion paper) either; GTD measures efficiency in token consumption (e.g.,
4.8e+06 tokens at 94% on GSM8K) not dollars [2].

The "graph diffusion" methodology belongs to the **GTD paper**
(arXiv:2510.07799, Jiang et al. 2025), which GoAgent cites as prior work.
GoAgent itself does NOT use graph diffusion — it uses a different mechanism
(group enumeration + CIB).

The "1-2 years to obsolescence" prediction is not present in either paper.

**Verdict:** The paper arXiv:2603.19677 exists, but C-088 contains at least
three factual errors: (1) wrong methodology attributed (CIB not graph
diffusion), (2) cost figures not found in this paper, (3) the obsolescence
prediction is unverifiable speculation. Claim cannot be upgraded.

---

### C-002: Description field is primary routing signal; `<example>` blocks improve delegation

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH

**Evidence found:**

Official Claude Code docs (code.claude.com/docs/en/sub-agents) explicitly state:

> "Claude uses each subagent's description to decide when to delegate tasks.
> When you create a subagent, write a clear description so Claude knows when to
> use it."

And the "Work with subagents" section explains automatic delegation:

> "Claude automatically delegates tasks based on the task description in your
> request, the `description` field in subagent configurations, and current
> context."

The PR Review Toolkit agents (official Anthropic plugin) all use `<example>`
blocks with `<commentary>` inside their description field. For instance,
`silent-failure-hunter.md` and `pr-test-analyzer.md` contain multiple
`<example>` blocks directly in the `description:` frontmatter value [3]. These
are shipped by Anthropic as best practice, which corroborates the claim that
`<example>` blocks improve delegation.

The docs also state: "To encourage proactive delegation, include phrases like
'use proactively' in your subagent's description field." — confirming
description is the primary signal.

**Verdict:** Two independent Tier-1 sources confirm (official docs + official
plugin examples). Upgrade to HIGH.

---

### C-003: Agent names are case-insensitive

**Original confidence:** MEDIUM **Recommendation:** DOWNGRADE TO LOW — claim is
likely INVERTED

**Evidence found:**

The official docs specify:

> `name` field: "Unique identifier using **lowercase letters and hyphens**"
> Skills `name` field: "**Lowercase letters, numbers, and hyphens only** (max 64
> characters)"

The docs mandate lowercase names. No official source states that Claude resolves
agent names case-insensitively at invocation time. GitHub Issue #9206 ("Agent
Aliases/Nicknames") is now **closed** and its content concerned inability to use
custom aliases for built-in agents — implying names are matched
exactly/strictly, not case-insensitively [4].

No official doc, changelog, or GitHub issue was found confirming
case-insensitive name matching. The naming constraint to lowercase-only
effectively makes case sensitivity moot for well-formed agents, but this is not
the same as the routing being case-insensitive.

**Verdict:** No evidence supports the case-insensitivity claim. The official
docs enforce lowercase-only names as a hard constraint. The claim may be based
on a misreading of that constraint. Downgrade from MEDIUM to LOW/UNVERIFIED
until an official source confirms the runtime behavior.

---

### C-014: 5 system/plugin agents need overrides — general-purpose, silent-failure-hunter, pr-test-analyzer, code-simplifier, type-design-analyzer

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH for
existence; MEDIUM for the "need overrides" claim

**Evidence found:**

All five agents are confirmed to exist:

- `general-purpose` — documented built-in agent in official Claude Code docs [5]
- `silent-failure-hunter`, `pr-test-analyzer`, `code-simplifier`,
  `type-design-analyzer` — all confirmed in the official
  `anthropics/claude-code` repository at `plugins/pr-review-toolkit/agents/` [3]

Fetching the actual raw agent files from GitHub confirms:

- `silent-failure-hunter.md` — real file, model: inherit, generic error-handling
  auditor
- `code-simplifier.md` — real file, model: inherit
- `type-design-analyzer.md` — real file, model: inherit, color: pink
- `pr-test-analyzer.md` — real file, model: inherit, color: cyan

All plugin agents use `model: inherit` — they run with whatever model the main
session uses. Per the official docs:

> "For security reasons, plugin subagents do not support the `hooks`,
> `mcpServers`, or `permissionMode` frontmatter fields."

Plugin agents also get a fresh system prompt (only their own markdown body, not
the full Claude Code system prompt). The sub-agents docs state: "Subagents
receive only this system prompt (plus basic environment details like working
directory), not the full Claude Code system prompt." CLAUDE.md is NOT
automatically loaded into plugin agents.

**Verdict:** Existence of all 5 agents is HIGH confidence. The claim they "lack
SoNash context" is accurate — plugin agents do not receive CLAUDE.md by default
[5]. The "need overrides" framing is therefore sound. Overall: MEDIUM-HIGH
(existence confirmed HIGH, contextual override need confirmed via docs).

---

### C-028: Skill `model:` field is broken (GitHub Issue #21679)

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH

**Evidence found:**

GitHub issue anthropics/claude-code#21679 fetched via API confirms:

- **Title:** "[BUG] Skill frontmatter `model:` field documented but not working"
- **State:** `open` (still open as of API query date)
- **Created:** 2026-01-29
- **Last updated:** 2026-03-20
- **Labels:** `bug`, `has repro`, `platform:macos`, `area:tools`, `area:model`,
  `high-priority`
- **Comments:** 4 comments; most recent (2026-02-28) reads: "Confirming - this
  is still an issue" (+2 reactions)

The official skills documentation at code.claude.com/docs/en/skills confirms
`model:` IS a documented field in the frontmatter reference table [6]. The issue
directly corroborates the claim: the field is documented but non-functional.

**Verdict:** Issue exists, is confirmed open, is labeled high-priority, has
community reproductions, and was last active 9 days before research date.
Upgrade from MEDIUM to HIGH.

---

### C-029: Built-in agent models — Explore=Haiku, Guide=Haiku, statusline=Sonnet

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH with one
correction

**Evidence found:**

Official Claude Code docs (sub-agents page) contain an explicit table of
built-in agents [5]:

| Agent                 | Model                           | When used                               |
| --------------------- | ------------------------------- | --------------------------------------- |
| Explore               | **Haiku** (fast, low-latency)   | Codebase search/exploration             |
| Plan                  | Inherits from main conversation | Plan mode research                      |
| General-purpose       | Inherits from main conversation | Complex multi-step tasks                |
| Bash                  | Inherits                        | Terminal commands                       |
| **statusline-setup**  | **Sonnet**                      | When you run `/statusline`              |
| **Claude Code Guide** | **Haiku**                       | When you ask about Claude Code features |

The claim says "Guide=Haiku" — the actual name is "Claude Code Guide" and it
uses Haiku: confirmed. "statusline=Sonnet" — the actual name is
"statusline-setup" and it uses Sonnet: confirmed.

**Minor correction:** The claim uses shortened names. The actual built-in name
is "Claude Code Guide" not "Guide", and "statusline-setup" not "statusline". The
model assignments are correct.

**Verdict:** Upgrade to HIGH. Model assignments are confirmed verbatim in
official docs.

---

### C-032: "3-5 agents sweet spot; 67.7→13.6 efficiency drop" — arXiv:2512.08296

**Original confidence:** MEDIUM **Recommendation:** PARTIALLY CONFIRMED — keep
MEDIUM with corrected framing

**Evidence found:**

The paper arXiv:2512.08296 ("Towards a Science of Scaling Agent Systems") is
confirmed to exist and the numbers 67.7 and 13.6 are confirmed [7].

From Table 5 in the full HTML version:

- **67.7** = Success/1K tokens for Single-Agent System (SAS) baseline
- **13.6** = Success/1K tokens for Hybrid multi-agent architecture

This is a ~5x efficiency drop in token-normalized success rate, not a general
"efficiency" metric. The 67.7 and 13.6 figures are real.

However, the "3-5 agents sweet spot" framing is **not accurate**. The paper's
actual finding is the opposite: "under fixed computational budgets, per-agent
reasoning capacity becomes prohibitively thin beyond 3-4 agents, creating a hard
resource ceiling." The paper concludes that **more agents degrades performance**
under fixed budgets — it identifies a ceiling at 3-4 agents as a breakdown
point, not an optimum. Other metrics: hybrid systems require 6.2x more turns
than SAS (44.3 vs 7.2 turns).

**Verdict:** The numbers 67.7 and 13.6 are real and confirmed (upgrade that part
to HIGH). The "sweet spot" framing misrepresents the paper's conclusion — the
paper shows 3-4 agents as a performance ceiling/degradation point, not an
optimum. Claim is MEDIUM overall with corrected framing required.

---

### C-033: "MAST: 41.8% FC1 + 36.9% FC2" — arXiv:2503.13657

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH

**Evidence found:**

Multiple independent sources confirm the exact percentages [8, 9]:

- **FC1 (Specification and System Design):** 41.77%
- **FC2 (Inter-Agent Misalignment):** 36.94%
- **FC3 (Task Verification and Termination):** 21.30%

The paper analyzed 1,600+ annotated traces across 7 MAS frameworks, with
inter-annotator agreement kappa = 0.88. The 41.8% and 36.9% figures in C-033 are
rounded versions of 41.77% and 36.94% — accurate.

**Verdict:** Upgrade to HIGH. Exact figures confirmed via multiple sources
including the official MAST project page, paper abstract, and secondary
analysis.

---

### C-025: "iMAD 68-92% cost reduction" — arXiv:2511.11306

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH with precise
range clarification

**Evidence found:**

The full HTML of arXiv:2511.11306 provides dataset-specific breakdown [10]:

- vs. MAD baseline: 57-70% reduction across datasets (MEDQA 68%, MMLU 70%, GSM8K
  70%, OKVQA 67%, VQA-v2 60%, ScienceQA 57%)
- vs. GroupDebate (most expensive baseline): up to 92%

The "68-92%" range in C-025 is partially accurate but conflates two different
baselines. Against the standard MAD baseline, the range is 57-70%. The 92%
figure comes from comparison against GroupDebate specifically.

**Verdict:** The paper exists, the numbers are real. The 68% lower bound is
accurate for the MAD baseline on MEDQA. The 92% upper bound is accurate vs.
GroupDebate. The claim's framing slightly overstates the lower bound (actual
floor against MAD is 57% on ScienceQA). Upgrade to HIGH with a note that the
range should be stated as "57-92%" for precision, or "up to 92%" with the
MAD-baseline range being 57-70%.

---

### C-022: "FIRE 7.6-16.5x cost reduction" — NAACL 2025

**Original confidence:** MEDIUM **Recommendation:** UPGRADE TO HIGH

**Evidence found:**

The paper is confirmed as FIRE: "Fact-checking with Iterative Retrieval and
Verification" published in Findings of NAACL 2025
(aclanthology.org/2025.findings-naacl.158/) [11].

The paper achieves:

- LLM cost reduction: **7.6x average**
- Search cost reduction: **16.5x**

These are distinct cost types (LLM inference vs. search/retrieval), not a single
range. C-022 frames it as "7.6-16.5x cost reduction" which is technically
accurate but could be read as a single metric range when it's actually two
separate metrics.

**Verdict:** Upgrade to HIGH. Numbers confirmed directly in ACL Anthology.
Framing note: these are two separate cost axes, not a single range.

---

## Sources

| #   | URL                                                                                  | Title                                                             | Type                          | Trust  | CRAAP | Date       |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------- | ------ | ----- | ---------- |
| 1   | https://arxiv.org/abs/2603.19677                                                     | GoAgent: Group-of-Agents Communication Topology Generation        | arXiv preprint                | MEDIUM | 4.0   | 2026-03-20 |
| 2   | https://arxiv.org/html/2510.07799v1                                                  | GTD: Dynamic Generation with Graph Diffusion Models               | arXiv preprint                | MEDIUM | 4.0   | 2025       |
| 3   | https://github.com/anthropics/claude-code/tree/main/plugins/pr-review-toolkit/agents | Official pr-review-toolkit plugin agents                          | Official source               | HIGH   | 4.8   | 2026       |
| 4   | https://github.com/anthropics/claude-code/issues/9206                                | Agent Aliases/Nicknames (closed issue)                            | GitHub Issue                  | HIGH   | 4.2   | 2025       |
| 5   | https://code.claude.com/docs/en/sub-agents                                           | Create custom subagents — Claude Code Docs                        | Official docs                 | HIGH   | 5.0   | 2026       |
| 6   | https://code.claude.com/docs/en/skills                                               | Extend Claude with skills — Claude Code Docs                      | Official docs                 | HIGH   | 5.0   | 2026       |
| 7   | https://arxiv.org/abs/2512.08296                                                     | Towards a Science of Scaling Agent Systems                        | arXiv preprint                | MEDIUM | 4.2   | 2024-12    |
| 8   | https://arxiv.org/abs/2503.13657                                                     | Why Do Multi-Agent LLM Systems Fail? (MAST)                       | arXiv preprint                | MEDIUM | 4.5   | 2025-03    |
| 9   | https://sky.cs.berkeley.edu/project/mast/                                            | MAST — UC Berkeley Sky Computing Lab                              | Academic project page         | HIGH   | 4.7   | 2025       |
| 10  | https://arxiv.org/html/2511.11306                                                    | iMAD: Intelligent Multi-Agent Debate                              | arXiv preprint                | MEDIUM | 4.2   | 2025-11    |
| 11  | https://aclanthology.org/2025.findings-naacl.158/                                    | FIRE: Fact-checking with Iterative Retrieval                      | ACL Anthology (peer-reviewed) | HIGH   | 4.8   | 2025       |
| 12  | https://github.com/anthropics/claude-code/issues/21679                               | [BUG] Skill frontmatter `model:` field documented but not working | GitHub Issue (API)            | HIGH   | 4.8   | 2026-01-29 |

---

## Contradictions

**C-088 methodology mismatch:** The original claim attributes graph diffusion to
GoAgent (arXiv:2603.19677). The paper itself uses CIB-based group enumeration.
Graph diffusion is the methodology of GTD (arXiv:2510.07799), a prior work
GoAgent cites. These are two distinct papers with distinct methods.

**C-003 vs. docs naming requirement:** The docs say agent names must use
"lowercase letters and hyphens only" as a hard constraint. This contradicts any
claim of case-insensitive runtime matching — the constraint forces all names to
lowercase at definition time, making the question of case-insensitivity largely
irrelevant for well-formed names but unconfirmed for invocation matching.

**C-032 "sweet spot" framing:** The paper shows 3-4 agents as a degradation
boundary, not an optimum. Calling it a "sweet spot" implies it is beneficial;
the actual finding is that going beyond 3-4 agents under fixed budgets causes
performance to collapse.

**C-025 baseline specificity:** The 68-92% range conflates results against two
different baselines. The floor against MAD is actually 57% (ScienceQA), not 68%.
The 68% figure is accurate only for MEDQA vs. MAD.

---

## Gaps

- **C-088 cost figures ($5.60 vs $43.70):** These numbers could not be located
  in any paper. They may be from a blog post, secondary analysis, or an earlier
  draft. Origin is unknown and unverifiable.
- **C-003 case-insensitivity:** No official source explicitly describes runtime
  name resolution behavior. This remains unconfirmed.
- **C-032 exact agent count optimum:** The paper provides 3-4 as a ceiling, but
  does not state 3-5 as a "sweet spot." Whether there is a
  performance-maximizing count is not stated.
- **MAST % figures from primary source:** The exact percentages (41.77%, 36.94%,
  21.30%) were confirmed via secondary sources and a search result summary.
  Direct extraction from the paper PDF was not possible.

---

## Serendipity

- The official `pr-review-toolkit` plugin contains **6 agents** (not 5 as C-014
  states) — the sixth is `comment-analyzer.md`. This is relevant to any claim
  about "5 agents" in that plugin.
- Skills docs reveal that `model:` field in skill frontmatter is listed as a
  supported field, but GitHub Issue #21679 (labeled `high-priority`) confirms it
  does not work. This is a known, tracked regression, not an undocumented
  limitation.
- The `plan` built-in subagent uses "inherits from main conversation" as its
  model — **not** Haiku. This may matter for cost modeling.
- Plugin agents cannot be overridden by placing same-named files at user/project
  scope per priority order (CLI flag > project > user > plugin). A project
  `.claude/agents/silent-failure-hunter.md` WOULD override the plugin version.

---

## Confidence Assessment

| Claim                                   | Before | After                                     | Change                               |
| --------------------------------------- | ------ | ----------------------------------------- | ------------------------------------ |
| C-088 GoAgent cost/diffusion/prediction | LOW    | LOW (corrected)                           | No change; 3 factual errors found    |
| C-002 Description as routing signal     | MEDIUM | HIGH                                      | Upgraded                             |
| C-003 Case-insensitive names            | MEDIUM | LOW                                       | Downgraded                           |
| C-014 5 agents need overrides           | MEDIUM | MEDIUM-HIGH                               | Partially upgraded                   |
| C-028 Skill model field broken          | MEDIUM | HIGH                                      | Upgraded                             |
| C-029 Built-in agent models             | MEDIUM | HIGH                                      | Upgraded                             |
| C-032 3-5 sweet spot / 67.7→13.6        | MEDIUM | MEDIUM (numbers confirmed; framing wrong) | Confirmed numbers; framing corrected |
| C-033 MAST 41.8% / 36.9%                | MEDIUM | HIGH                                      | Upgraded                             |
| C-025 iMAD 68-92%                       | MEDIUM | HIGH (with precision note)                | Upgraded                             |
| C-022 FIRE 7.6-16.5x                    | MEDIUM | HIGH                                      | Upgraded                             |

**Summary:**

- Claims upgraded: 6 (C-002, C-028, C-029, C-033, C-025, C-022)
- Claims downgraded: 1 (C-003)
- Claims kept with corrections: 2 (C-088, C-032)
- Claims partially upgraded: 1 (C-014)

- HIGH claims: 6
- MEDIUM claims: 3 (C-088, C-032, C-014)
- LOW claims: 1 (C-003)
- UNVERIFIED claims: 0
- Overall confidence: MEDIUM-HIGH
