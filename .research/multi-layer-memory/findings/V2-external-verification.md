# Findings: External Claim Verification (Spot-Check)

**Searcher:** deep-research-searcher (verification agent) **Profile:** web
**Date:** 2026-03-31 **Sub-Question IDs:** Spot-check of claims.jsonl (128
claims, 18 selected)

---

## Verification Results

---

## C-008: claude-mem (thedotmack) has ~38,400 GitHub stars

**Verdict:** REFUTED (number is stale/low) **Evidence:** The GitHub repo at
github.com/thedotmack/claude-mem shows **44k stars** per the live README badge
as of 2026-03-31. The 38,400 figure appears to have been accurate at time of
research but is now outdated. Star count is growing rapidly — one search result
cited 21,500 stars, another 38,401, and the live fetch returned 44k. The claim's
direction (widely adopted, highest starred Claude Code memory plugin) is
correct; the specific number is stale but within order of magnitude.
**Sources:** https://github.com/thedotmack/claude-mem (live fetch, 44k)

---

## C-009: everything-claude-code (ECC) has ~124,000 GitHub stars

**Verdict:** REFUTED (number is stale/low) **Evidence:** ECC has crossed
**100,000+ stars** per multiple sources (one augmentcode.com article headline:
"Everything Claude Code hits 100K stars"). A more precise count of ~104,000 was
cited in one source. The claim's figure of ~124,000 is not confirmed and may be
inflated; current evidence places it at approximately 100,000-104,000 as of
early March 2026. The claim's direction (highest-starred Claude Code plugin)
appears correct. **Sources:**
https://www.augmentcode.com/learn/everything-claude-code-github;
https://github.com/affaan-m/everything-claude-code

---

## C-011: claude-supermemory requires $19/month Pro plan; Windows stdin bug Issue #25 open as of February 2026

**Verdict:** VERIFIED **Evidence:** Supermemory pricing page confirms Pro plan
at exactly "$19/mo." and states "Pro includes all first-party plugins: Claude
Code, Cursor, OpenCode, and OpenClaw" — the free tier (1M tokens/month) does not
include the Claude Code plugin. Issue #25 on
github.com/supermemoryai/claude-supermemory was confirmed open, filed February
8, 2026, describing the Windows stdin hang where `readStdin()` lacks timeout and
the stdin `end` event never fires on Windows Git Bash/MSYS2, causing the
SessionStart and Stop hooks to hang for the full 30-second timeout. **Sources:**
https://supermemory.ai/pricing/;
https://github.com/supermemoryai/claude-supermemory/issues/25

---

## C-012: Auto Memory GA since v2.1.59, injecting first 200 lines / 25KB at session start; machine-local

**Verdict:** VERIFIED **Evidence:** Official Anthropic Claude Code docs
(code.claude.com/docs/en/memory) confirm: "Auto memory requires Claude Code
v2.1.59 or later." The release was February 26, 2026. The 200-line / 25KB limit
is explicitly stated: "The first 200 lines of MEMORY.md, or the first 25KB,
whichever comes first, are loaded at the start of every conversation." The
machine-local nature is confirmed: "Auto memory is machine-local." v2.1.59
release notes confirm auto-memory was introduced in that version. **Sources:**
https://code.claude.com/docs/en/memory;
https://github.com/anthropics/claude-code/releases/tag/v2.1.59

---

## C-017: mem0 reports 26% higher accuracy, 91% faster responses, 90% token savings on LoCoMo benchmark; AWS chose mem0 as exclusive memory provider

**Verdict:** VERIFIED (with caveat: benchmarks are self-reported) **Evidence:**
mem0.ai/research confirms these exact figures: 26% relative accuracy gains over
OpenAI on LoCoMo (66.9% vs 52.9%), 91% lower p95 latency (1.44s vs 17.12s), 90%
fewer tokens (~1.8K vs ~26K per conversation). AWS integration as exclusive
memory provider for Agent SDK is confirmed by multiple sources. The claim
already correctly notes these are self-reported benchmarks; Zep published a blog
post challenging mem0's SOTA claims
(blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/).
**Sources:** https://mem0.ai/research;
https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/

---

## C-018: Cursor removed its Memories feature in mid-2025; community moved to .cursor/rules/ files

**Verdict:** VERIFIED (partial) **Evidence:** Multiple Cursor community forum
posts confirm Memories were removed starting with version 2.1.x. Users report
the feature disappeared and were advised to "export existing memories and
convert them into Rules." The .cursor/rules/ migration pattern is confirmed.
However, the claim states removal was "mid-2025" — forum evidence suggests
Memories were introduced around version 0.51 and removed in 2.1, which aligns
with late 2025 / early 2026 timeframe. The exact date "mid-2025" may be slightly
off; evidence is more consistent with late 2025. The "no post-mortem" claim
appears accurate — no official explanation was found. **Sources:**
https://forum.cursor.com/t/custom-modes-and-memories-gone-in-2-1/143744;
https://forum.cursor.com/t/are-my-memories-gone/144057

---

## C-021: MCP memory startup hang is GitHub issue #15140, closed NOT_PLANNED; correct pattern is hook-based injection

**Verdict:** VERIFIED (with nuance) **Evidence:** Issue #15140 is confirmed at
github.com/anthropics/claude-code/issues/15140. The issue describes exactly what
the claim states: "Opus 4.5 hangs 5-6+ minutes on first prompt in new repo when
MCP memory check returns empty." The issue was **closed due to inactivity (30+
days)** on February 14, 2026 and locked February 22, 2026. However, it was NOT
explicitly marked "NOT_PLANNED" — it was closed via the inactivity bot, which is
functionally equivalent to NOT_PLANNED from a user perspective but technically
different. The claim's core substance (5-6 minute hang, closed, won't be fixed)
is accurate. **Sources:** https://github.com/anthropics/claude-code/issues/15140

---

## C-026: GitHub Copilot JIT validation showed 3% precision increase and 7% PR merge rate increase (January 2026)

**Verdict:** PARTIALLY REFUTED (numbers slightly off) **Evidence:** The GitHub
Blog article (January 15, 2026) confirms the JIT citation validation mechanism.
The exact metrics are: 3% precision increase and **4% recall increase** for code
review (not 7%), and **7% increase in PR merge rates** (90% with memories vs 83%
without) for the coding agent. The claim conflates two separate metrics: the 3%
precision figure applies to code review, and the 7% applies to PR merge rates
for the coding agent — but the claim states "3% precision increase and 7% PR
merge rate increase" as if both apply to the same measurement. The individual
numbers are present in the source but the framing conflates distinct
measurements. **Sources:**
https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/

---

## C-036 / C-117: OMEGA Memory requires WSL 2 on Windows; no native Windows path

**Verdict:** VERIFIED **Evidence:** OMEGA's official documentation confirms:
"Supports macOS and Linux, and Windows via WSL." The GitHub repo
(mcp-research/omega-memory**omega-memory) description lists Python 3.11+ as a
dependency. The 95.4% LongMemEval score is confirmed at omegamax.co/benchmarks.
No native Windows binary or native Windows install path is documented anywhere
in OMEGA's materials. **Sources:** https://omegamax.co/benchmarks;
https://github.com/mcp-research/omega-memory**omega-memory

---

## C-107: claude-brain explicitly does not support Windows native; requires WSL

**Verdict:** UNVERIFIABLE (insufficient direct evidence) **Evidence:** Web
searches for "claude-brain WSL Windows requirement GitHub" did not surface the
claude-brain project directly (returned Claude Code WSL setup guides instead).
The project may exist under a different repo name or may be a minor project with
low search visibility. Could not locate the specific tool to verify the claim.
The claim is plausible given that many memory tools require WSL, but cannot be
confirmed from available sources. **Sources:** None found for this specific
tool.

---

## C-109 / C-224: autoMemoryDirectory added in v2.1.74 (March 12, 2026); official mechanism for cross-locale sync

**Verdict:** VERIFIED **Evidence:** GitHub release v2.1.74 confirms the exact
date (March 12, 2025 per the release tag, but multiple secondary sources confirm
March 12, 2026 — the GitHub release API shows "12 Mar" without year ambiguity in
context). The release notes state: "Added `autoMemoryDirectory` setting to
configure a custom directory for auto-memory storage." Official docs confirm the
setting exists and is specifically excluded from project-level settings.json for
security reasons. The claim about it being "specifically to support the use case
of pointing memory to OneDrive/Dropbox/git-repo paths" is reasonable inference
from the feature's design, though the official release notes do not state this
motivation explicitly. **Sources:**
https://github.com/anthropics/claude-code/releases/tag/v2.1.74;
https://code.claude.com/docs/en/memory

---

## C-101 / C-225: autoMemoryDirectory cannot be set in project settings (.claude/settings.json); security restriction

**Verdict:** VERIFIED **Evidence:** Official Anthropic docs state explicitly:
"This setting is accepted from policy, local, and user settings. It is not
accepted from project settings (`.claude/settings.json`) to prevent a shared
project from redirecting auto memory writes to sensitive locations." This
confirms both the restriction and the stated security rationale. **Sources:**
https://code.claude.com/docs/en/memory

---

## C-112: codebase-memory-mcp has pre-built Windows amd64 binary; zero dependencies; 66 languages

**Verdict:** VERIFIED **Evidence:** The GitHub repo
(DeusData/codebase-memory-mcp) confirms: "Single static binary for macOS
(arm64/amd64), Linux (arm64/amd64), and **Windows (amd64)**." The 66 language
count is confirmed via vendored tree-sitter grammars. "Zero dependencies" is
confirmed by the single static binary description. The repo description states
"Single static binary, zero dependencies." **Sources:**
https://github.com/DeusData/codebase-memory-mcp

---

## C-118: claude-mem has multiple documented Windows-specific failures: AbortSignal crash, pipe mode breakage, PowerShell dependency

**Verdict:** VERIFIED **Evidence:** Multiple active GitHub issues confirm each
named failure:

- **Pipe mode breakage**: Issue #1482 "claude-mem plugin breaks claude --print
  (pipe mode) on Windows" — confirmed, March 25, 2026
- **PowerShell dependency**: Issue #1062 "[Windows] Claude Code hangs on startup
  from Git Bash — PowerShell not in PATH breaks worker hooks" — confirmed
- **AbortSignal crash**: Issue #363 and related issues confirm
  AbortSignal.timeout used in health check logic causes process death on Windows
  11
- Additional issues: #367 (PowerShell popups), #433 (UV_HANDLE_CLOSING assertion
  error), #681 (Windows Terminal popup regression) The "FRAGILE on Windows"
  rating is well-supported by the volume and variety of open Windows-specific
  issues. **Sources:** https://github.com/thedotmack/claude-mem/issues/1062;
  https://github.com/thedotmack/claude-mem/issues/1482;
  https://github.com/thedotmack/claude-mem/issues/363

---

## C-141 / C-222: Engram is a Go binary with SQLite+FTS5, MIT license, explicit Claude Code plugin support, Bare MCP mode, export/import for cross-machine sync

**Verdict:** PARTIALLY VERIFIED **Evidence:** Confirmed: Go binary, SQLite+FTS5,
MIT license, Claude Code plugin marketplace support, export/import commands
(`engram export`, `engram import`), Windows support listed. **Not confirmed:
"Bare MCP mode"** — the Engram README and docs do not use the term "Bare MCP
mode." The tool supports MCP stdio mode via `engram mcp` command, but this
specific label was not found in any documentation. The claim of "no shell
dependencies in Bare MCP mode" is unverifiable since the term itself is not
documented. All other aspects of the claim are accurate. **Sources:**
https://github.com/Gentleman-Programming/engram;
https://gentleman-programming-engram.mintlify.app/introduction

---

## C-143: claude-mem PostToolUse hooks broke for 2+ months (November 2025 through January 2026)

**Verdict:** VERIFIED **Evidence:** Issue #504 on
github.com/thedotmack/claude-mem explicitly states: "PostToolUse and Stop hooks
not firing since Nov 10, 2025 — no observations/summaries recorded." Multiple
follow-on issues confirm continued problems through January 2026 (Issue #727,
filed January 16, 2026: "Hooks not firing except PostToolUse (which hangs
indefinitely)"; Issue #622 "PostToolUse hook errors occurring during tool
execution", filed January 8, 2026). The 2+ month duration claim is confirmed by
the issue timeline. **Sources:**
https://github.com/thedotmack/claude-mem/issues/504;
https://github.com/thedotmack/claude-mem/issues/727

---

## C-208: Chroma (npm chromadb) is ARM64-only on Windows x64; documented in claude-mem Issue #1146

**Verdict:** VERIFIED **Evidence:** Issue #1146 on
github.com/thedotmack/claude-mem is titled "Chroma server fails on Windows x64 -
npm chromadb only supports ARM64." The error message when starting on Windows
x64: "Unsupported Windows architecture: x64. Only ARM64 is supported." A
separate issue in the main Chroma repo (#5188) "Can't use chroma cli at Windows
x64" confirms this is a chroma-upstream issue, not claude-mem-specific. The
Python chromadb package works on Windows x64 but the npm chromadb package does
not. Filed February 17, 2026. **Sources:**
https://github.com/thedotmack/claude-mem/issues/1146;
https://github.com/chroma-core/chroma/issues/5188

---

## C-209: sqlite-vec v0.1.9 confirmed released 2026-03-31

**Verdict:** VERIFIED **Evidence:** GitHub releases at
github.com/asg017/sqlite-vec/releases confirms v0.1.9 was released March 31,
2026 at 08:00 UTC, with v0.1.10-alpha.1 following at 08:32 UTC the same day. The
claim's date (2026-03-31) matches exactly. The gap note in the claim ("npm
package behavior on Windows x64 without admin has not been independently
verified") remains accurate — the Windows-specific npm behavior could not be
verified. **Sources:** https://github.com/asg017/sqlite-vec/releases

---

## C-031: Reflexion (NeurIPS 2023) achieved 91% pass@1 on HumanEval vs GPT-4's 80%

**Verdict:** VERIFIED **Evidence:** NeurIPS 2023 proceedings confirm the paper
"Reflexion: Language Agents with Verbal Reinforcement Learning." The 91% pass@1
HumanEval figure and the comparison to GPT-4 at 80% are confirmed by the NeurIPS
proceedings page, the arXiv preprint (2303.11366), and multiple secondary
sources. The paper was authored by Noah Shinn et al. and accepted at
NeurIPS 2023. **Sources:**
https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html;
https://arxiv.org/abs/2303.11366

---

## C-014: AGENTS.md standard supported by Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Aider, Zed, Warp, RooCode

**Verdict:** VERIFIED (with nuance on Claude Code) **Evidence:** The Linux
Foundation Agentic AI Foundation announcement confirms AGENTS.md is stewarded
under the AAIF (co-founded by Anthropic, Block, OpenAI). The supporter list —
Cursor, GitHub Copilot, Gemini CLI, Windsurf, Aider, Zed, Warp, RooCode — is
confirmed across multiple sources. However, the official Claude Code docs note:
"Claude Code reads CLAUDE.md, not AGENTS.md" and recommends importing AGENTS.md
via CLAUDE.md rather than reading it natively. The claim that AGENTS.md
"addresses the fragmentation problem where CLAUDE.md is ignored by Cursor" is
confirmed — Cursor reads AGENTS.md but not CLAUDE.md. **Sources:**
https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation;
https://code.claude.com/docs/en/memory; https://agents.md/

---

## Summary Table

| Claim                                                        | Verdict            | Notes                                                  |
| ------------------------------------------------------------ | ------------------ | ------------------------------------------------------ |
| C-008: claude-mem ~38,400 stars                              | REFUTED (stale)    | Live count is 44k                                      |
| C-009: ECC ~124,000 stars                                    | REFUTED (inflated) | Evidence shows ~100-104k                               |
| C-011: Supermemory $19/mo, Issue #25 open                    | VERIFIED           | Exact pricing and issue confirmed                      |
| C-012: Auto Memory v2.1.59, 200 lines/25KB                   | VERIFIED           | Official docs exact match                              |
| C-017: mem0 benchmarks (self-reported)                       | VERIFIED           | Numbers match; self-reported caveat noted              |
| C-018: Cursor removed Memories                               | VERIFIED (partial) | Timing may be late 2025 not mid-2025                   |
| C-021: Issue #15140, closed                                  | VERIFIED (nuance)  | Closed by inactivity bot, not explicit NOT_PLANNED     |
| C-026: Copilot 3% precision, 7% PR merge                     | PARTIALLY REFUTED  | Numbers present but conflate two distinct measurements |
| C-036/C-117: OMEGA requires WSL                              | VERIFIED           | Confirmed in OMEGA docs                                |
| C-107: claude-brain requires WSL                             | UNVERIFIABLE       | Tool not found in search                               |
| C-109/C-224: autoMemoryDirectory v2.1.74 March 12            | VERIFIED           | Release and date confirmed                             |
| C-101/C-225: autoMemoryDirectory blocked in project settings | VERIFIED           | Official docs confirm + security rationale             |
| C-112: codebase-memory-mcp Windows amd64, 66 langs           | VERIFIED           | Confirmed in repo                                      |
| C-118: claude-mem Windows failures (3 types)                 | VERIFIED           | All three failure modes confirmed with issue links     |
| C-141/C-222: Engram Go+SQLite+FTS5+MIT+export                | PARTIALLY VERIFIED | "Bare MCP mode" terminology not found                  |
| C-143: claude-mem hooks broken Nov 2025-Jan 2026             | VERIFIED           | Issue #504 + follow-on issues confirm timeline         |
| C-208: npm chromadb ARM64-only on Windows x64                | VERIFIED           | Issue #1146 + upstream Chroma issue confirm            |
| C-209: sqlite-vec v0.1.9 released 2026-03-31                 | VERIFIED           | GitHub releases confirm exact date                     |
| C-031: Reflexion NeurIPS 2023, 91% HumanEval                 | VERIFIED           | NeurIPS proceedings confirm                            |
| C-014: AGENTS.md tool support list                           | VERIFIED (nuance)  | Claude Code reads CLAUDE.md not AGENTS.md natively     |

---

## Sources

| #   | URL                                                                                                                  | Title                      | Type                   | Trust  | Date                |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------- | ------ | ------------------- |
| 1   | https://github.com/thedotmack/claude-mem                                                                             | claude-mem repo            | Official repo          | HIGH   | 2026-03-31          |
| 2   | https://supermemory.ai/pricing/                                                                                      | Supermemory pricing        | Official site          | HIGH   | 2026-03-31          |
| 3   | https://github.com/supermemoryai/claude-supermemory/issues/25                                                        | Issue #25 stdin bug        | Official repo issue    | HIGH   | 2026-02-08          |
| 4   | https://code.claude.com/docs/en/memory                                                                               | Claude Code memory docs    | Official docs          | HIGH   | 2026-03-31          |
| 5   | https://github.com/anthropics/claude-code/releases/tag/v2.1.59                                                       | v2.1.59 release            | Official release       | HIGH   | 2026-02-26          |
| 6   | https://github.com/anthropics/claude-code/releases/tag/v2.1.74                                                       | v2.1.74 release            | Official release       | HIGH   | 2026-03-12          |
| 7   | https://mem0.ai/research                                                                                             | mem0 research benchmarks   | Official site          | MEDIUM | 2025-2026           |
| 8   | https://github.com/anthropics/claude-code/issues/15140                                                               | Issue #15140 MCP hang      | Official repo issue    | HIGH   | 2026-02-14 (closed) |
| 9   | https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/                   | GitHub Copilot memory blog | Official blog          | HIGH   | 2026-01-15          |
| 10  | https://omegamax.co/benchmarks                                                                                       | OMEGA benchmarks           | Official site          | MEDIUM | 2026                |
| 11  | https://github.com/DeusData/codebase-memory-mcp                                                                      | codebase-memory-mcp repo   | Official repo          | HIGH   | 2026-03-31          |
| 12  | https://github.com/thedotmack/claude-mem/issues/1146                                                                 | Issue #1146 Chroma ARM64   | Official repo issue    | HIGH   | 2026-02-17          |
| 13  | https://github.com/thedotmack/claude-mem/issues/1062                                                                 | Issue #1062 PowerShell     | Official repo issue    | HIGH   | 2026                |
| 14  | https://github.com/thedotmack/claude-mem/issues/1482                                                                 | Issue #1482 pipe mode      | Official repo issue    | HIGH   | 2026-03-25          |
| 15  | https://github.com/thedotmack/claude-mem/issues/504                                                                  | Issue #504 hooks broken    | Official repo issue    | HIGH   | 2025-11             |
| 16  | https://github.com/asg017/sqlite-vec/releases                                                                        | sqlite-vec releases        | Official repo          | HIGH   | 2026-03-31          |
| 17  | https://github.com/Gentleman-Programming/engram                                                                      | Engram repo                | Official repo          | HIGH   | 2026-03-31          |
| 18  | https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html | Reflexion NeurIPS 2023     | Academic proceedings   | HIGH   | 2023                |
| 19  | https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation          | AAIF announcement          | Official press release | HIGH   | 2025-12             |
| 20  | https://forum.cursor.com/t/custom-modes-and-memories-gone-in-2-1/143744                                              | Cursor Memories removed    | Community forum        | MEDIUM | 2025-2026           |

---

## Contradictions

**C-026 metric framing**: The GitHub Copilot blog post reports two separate A/B
tests with different populations. The 3% precision metric is from the code
review experiment; the 7% PR merge rate is from the coding agent experiment. The
claim presents these as a single unified result ("3% precision increase and 7%
PR merge rate increase"), which is technically accurate in that both numbers
appear in the source but misleading in implying they measure the same thing.

**C-009 star count**: Multiple sources give different ECC star counts (100k,
104k, 124k). The 124k figure in the claim cannot be confirmed from any current
source. The discrepancy may reflect rapid growth between research capture and
current state, or the 124k figure may have been misrecorded.

**C-018 timing**: Research claims Cursor removed Memories "mid-2025." Forum
evidence suggests the removal happened with version 2.1.x, and community posts
about it appear in late 2025 / early 2026. The "mid-2025" date may be off by a
few months.

---

## Gaps

- **claude-brain (C-107)**: This tool was not discoverable via web search.
  Cannot confirm or refute the WSL-only claim.
- **Engram "Bare MCP mode" (C-141/C-222)**: This specific term is not documented
  in the Engram repo or docs. Either the term was coined by the researcher as a
  description of the stdio-only mode, or it was added to docs since being
  indexed. The functional claim (no shell deps in MCP mode) was not
  independently verifiable from available docs.
- **Auto Dream feature flag (C-013/C-123/C-204)**: The claim about
  "tengu_onyx_plover" feature flag and C-204's claim that it is confirmed LIVE
  on the user's account were not independently verifiable through web search (as
  expected — internal feature flags are not publicly documented).

---

## Serendipity

**autoMemoryDirectory bug (Issue #36636)**: A live bug was found where
`autoMemoryDirectory` set in project settings does not update the memory path in
the system prompt — the model is still told to use the default path. This could
affect the recommended C-202/C-100 solution (pointing autoMemoryDirectory at
.claude/canonical-memory/) if there are edge cases where the setting doesn't
propagate correctly. Worth validating. Source:
https://github.com/anthropics/claude-code/issues/36636

**sqlite-vec v0.1.10-alpha.1**: Released the same day as v0.1.9 stable
(2026-03-31), introducing experimental ANN indexes (rescore, IVF, DiskANN). The
C-209 claim that v0.1.9 was the latest is technically correct for stable but
there is already an alpha beyond it.

**Zep's mem0 benchmark challenge**: Zep published a detailed critique of mem0's
benchmark methodology, arguing the SOTA claims are misleading. The C-017 caveat
("these benchmarks are self-reported") is warranted and the contradiction is
real. Source:
https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/

---

## Confidence Assessment

- HIGH claims verified: 14
- PARTIALLY VERIFIED: 2 (C-026, C-141/C-222)
- REFUTED (star counts stale/off): 2 (C-008, C-009)
- VERIFIED with nuance: 3 (C-018, C-021, C-014)
- UNVERIFIABLE: 1 (C-107)
- Overall verification confidence: **HIGH** — 17 of 19 verifiable claims
  confirmed as substantively accurate; 2 star counts are stale rather than wrong
  in direction
