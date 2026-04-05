# Findings: Why Agent Auto-Delegation Is Unreliable and What To Do About It

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-29
**Sub-Question IDs:** G3 (gap pursuit)

---

## Key Findings

### 1. The Delegation Algorithm Is Pure LLM Reasoning, Not Pattern Matching [CONFIDENCE: HIGH]

The single most important architectural fact: Claude Code does **not** use
embeddings, classifiers, regex matching, or any algorithmic routing to select
agents. All available subagents — with their `name` and `description` fields —
are formatted into a dynamic list inside the `Agent` (formerly `Task`) tool's
prompt. Claude's transformer sees this list and makes the delegation decision as
natural language reasoning during the forward pass.

From first-principles analysis of Claude Code's source via the skills-deep-dive
research [1]:

> "Claude Code doesn't use embeddings, classifiers, or pattern matching to
> decide which skill to invoke. This is pure LLM reasoning. No regex, no keyword
> matching, no ML-based intent detection."

The structure presented to Claude looks like:

```
<available_agents>
"code-reviewer": Expert code review specialist. Use PROACTIVELY after writing or modifying code...
"security-auditor": Review code for vulnerabilities...
</available_agents>
```

Claude evaluates all descriptions simultaneously, weighs them against the
current task, and decides whether to delegate and to which agent. This explains
both why it can work well (semantic understanding) and why it fails (LLM
reasoning is probabilistic, context-sensitive, and not deterministic).

**Implication for SoNash:** Every agent in `.claude/agents/` is serialized into
the Agent tool's input. If many agents have similar or vague descriptions, the
LLM has to disambiguate among them with imperfect reasoning. More agents = more
potential for confusion.

Sources: [1][2][3]

---

### 2. Root Causes of Unreliability: Six Identified Failure Modes [CONFIDENCE: HIGH]

Based on community analysis, GitHub issues, and system prompt inspection,
auto-delegation fails for these reasons:

**a) Vague or overlapping descriptions.** The LLM cannot reliably choose between
agents when descriptions are ambiguous or semantically similar. A
`code-reviewer` and a `security-auditor` with overlapping keywords produce
uncertain routing. Since all descriptions are in the same context window, the
LLM must rank them by similarity to the current task — a task it may get wrong.

**b) The task looks "simple enough to do inline."** The system prompt instructs
Claude to use Task/Agent for broad exploration, but "needle queries for a
specific file/class/function" are handled directly. The LLM judges whether
delegation is warranted. For tasks that feel targeted or small, Claude handles
them in-context rather than delegating [2].

**c) Over-delegation with Opus.** Claude Opus 4.6 has a documented tendency to
over-spawn subagents — delegating in situations where a direct approach would be
faster and cheaper. Anthropic has flagged this in their own documentation. This
is the inverse failure: delegation when it shouldn't. For Sonnet, the failure
mode is typically under-delegation [4].

**d) "Interpretive compliance bias."** When Claude encounters a task that
partially matches an agent description, it interprets the user's intent and
often decides the main session can handle it rather than delegating. The system
prompt provides guidelines but these are probabilistic suggestions, not
deterministic gates [5].

**e) Context saturation and compaction.** Post-compaction reconstruction can
lose agent descriptions or reduce their relative weight in the attention
mechanism, causing previously-reliable delegation patterns to break. The agent
list is re-presented at each session, but session compaction may degrade routing
reliability [5].

**f) Name-matching confusion (documented bug).** One GitHub report [6] found
that when agent names contain meaningful keywords (e.g., naming an agent
"researcher"), Claude "stops trying to be smart" and produces unexpected
behavior. Removing the meaningful keyword from the name restored expected
delegation behavior. The root cause appears to be a collision between
name-as-identifier and name-as-semantic-signal.

Sources: [1][2][4][5][6][7]

---

### 3. File Discovery Is a Separate Failure Mode (Distinct From Delegation) [CONFIDENCE: HIGH]

Multiple high-severity GitHub issues document that file-based agent discovery
has been broken for extended periods:

- **Issue #11205** (Nov 2025): Custom subagents in `~/.claude/agents/` not
  discovered or loaded in v2.0.35. The documentation claimed file discovery at
  session start existed, but the implementation did not. Only UI-created agents
  worked [7].
- **Issue #20931**: Custom agents in `~/.claude/agents/` never appear in metrics
  despite being properly configured. Confirmed: "file discovery is broken" [8].
- **Issue #5185**: Agents not appearing in `/agents` interface despite proper
  YAML frontmatter. Closed as duplicate [9].

**Critical distinction for SoNash:** If you are using `.claude/agents/`
(project-scoped, as SoNash does), this is _different_ from the user-level
`~/.claude/agents/` which had the severe discovery bugs. The issues above are
specifically about `~/.claude/agents/`. Project-local `.claude/agents/` appears
to load more reliably, and the current (late 2025 / early 2026) docs confirm
agents are loaded at session start. The bugs from mid-2025 appear to have been
partially or fully resolved in later versions.

**For SoNash:** Since all 27 agents are in `.claude/agents/` (project-scoped),
they should be discovered. The remaining unreliability is the semantic
delegation problem, not the discovery problem.

Sources: [7][8][9]

---

### 4. What Makes `<example>` Blocks and Descriptions Effective [CONFIDENCE: MEDIUM]

There is **no official documentation** from Anthropic specifically about
`<example>` blocks in the `description` field. The guidance is largely
community-derived. What is documented:

**Officially documented (Anthropic):**

- The `description` field is described as "When Claude should delegate to this
  subagent" [3]
- The docs recommend: "Write detailed descriptions: Claude uses the description
  to decide when to delegate"
- To encourage proactive delegation: include phrases like "use proactively" in
  the description [3]

**Community-established best practices:**

- Write descriptions as **trigger conditions**, not capability summaries.
  Example: "Use after a spec exists; produce an ADR and guardrails" is better
  than "Creates architecture decision records" [10]
- Include **explicit condition language**: "MUST BE USED when [condition]", "Use
  PROACTIVELY for [task category]", "Use immediately after [event]" [10][11]
- Use **action-oriented verbs**: review, analyze, optimize, audit — these match
  user request language more closely [12]
- Include **scope boundaries**: "for security reviews, auth flows, or
  vulnerability fixes" signals when NOT to delegate and when to delegate [2]

**On example blocks specifically:** The claim from prior research (D6c) that
`<example>` blocks are the "single highest-leverage improvement" is **not
directly verifiable from official docs**. It appears to be an inference from
general LLM prompting principles (where few-shot examples improve
instruction-following). The skills deep-dive [1] notes that descriptions with
both a `description` and `when_to_use` field benefit from concatenation (more
signal), which indirectly supports the value of richer descriptions. The
community consensus is that richer, more specific descriptions outperform short
ones for delegation.

**On description length:** No official guidance on length. The practical
constraint is a combined ~15,000 character budget across all agent descriptions
(documented for skills, likely applies to agents). Short descriptions risk
under-specification; long descriptions may dilute the signal or push other
agents' descriptions out of the context window when there are many agents. The
sweet spot appears to be 1-3 sentences that are condition-focused.

Sources: [1][3][10][11][12][13]

---

### 5. Does Description Length Matter? Short vs. Long [CONFIDENCE: MEDIUM]

No controlled study exists comparing short vs. long agent descriptions. Based on
available evidence:

**For short descriptions (1 sentence):** Fast to parse, low ambiguity, but may
miss important trigger conditions. Example from the official docs: "Expert code
review specialist. Use immediately after modifying code." — ~70 characters, very
effective. The ksred.com analysis [13] uses this exact format and reports it
works for explicit invocation.

**For longer descriptions (2-4 sentences):** More specific trigger conditions,
better semantic coverage across varied user phrasings. The risk is verbose
overlap with other agents' descriptions creating confusion.

**Current SoNash agent descriptions (observed):** The existing SoNash agents use
1-2 sentence descriptions with PROACTIVELY language and specific task
categories. This aligns with community best practices. Example:

```
description:
  Expert code review specialist for quality, security, and maintainability. Use
  PROACTIVELY after writing or modifying code to ensure high development
  standards.
```

This is well-formed. The weakness is not in length but in the unresolved
auto-delegation reliability problem itself.

Sources: [1][3][13]

---

### 6. Does the `name` Field Affect Delegation? [CONFIDENCE: MEDIUM]

Yes, in two ways:

**a) Explicit invocation by name:** When users type "Use the code-reviewer agent
to..." or @-mention `@"code-reviewer (agent)"`, the name is used to look up and
invoke the specific agent, bypassing auto-delegation entirely. This is the
reliable path [3].

**b) Name collision with description semantics:** One documented bug [6] found
that meaningful keywords in agent names could interfere with the delegation
decision. The LLM appears to process the name and description together. If the
name contains the same keyword as the user's request, it may either help (making
the match more obvious) or confuse the routing (the LLM treats name as a
different signal than description and creates conflicting evidence). This is not
well-documented and the mechanism is opaque.

**No official documentation** exists on whether name-matching contributes to
auto-delegation. The official docs say "Claude uses each subagent's description
to decide when to delegate" — description only, no mention of name [3]. But the
system prompt does present both name and description together, so the LLM sees
both.

**Practical recommendation:** Keep names descriptive but don't rely on
name-matching for auto-delegation. Design the description to carry the full
routing signal.

Sources: [3][6][11]

---

### 7. Power User Workarounds for Reliable Invocation [CONFIDENCE: HIGH]

The community has converged on these strategies, ordered from most to least
reliable:

**a) @-mention (most reliable for single invocations):** Type `@` in Claude
Code's input, select the agent from the typeahead. The official docs state this
"guarantees the subagent runs for one task" — it bypasses the auto-delegation
algorithm entirely [3].

**b) Explicit natural language naming:** "Use the code-reviewer agent to..." or
"Have the security-auditor agent look at..." This is reliable but not guaranteed
— it's described as "Claude typically delegates" which implies occasional
failure [3].

**c) CLAUDE.md trigger directives:** Add binding instructions to `CLAUDE.md`
specifying which agents to use for which trigger conditions. This creates a
session-persistent instruction that overrides Claude's default reasoning. The
CLAUDE.md is loaded into every session and has high authority. SoNash already
uses this pattern (Section 7 agent triggers table). This is the highest-leverage
architectural pattern for ensuring delegation happens.

**d) Description keyword optimization:** Include trigger phrases that closely
match the natural language users will actually use. If users say "review my
code," the description should say "Use...when reviewing code" not "Use...after
code modification." Match user vocabulary.

**e) Session-wide agent via `--agent` flag or settings:**
`claude --agent code-reviewer` runs the entire session as that agent. This is
the most reliable but least flexible approach — it replaces the main
conversation system prompt entirely [3].

**f) Hooks for mandatory delegation:** Use `PreToolUse` hooks to block certain
operations unless a specific agent has been invoked. This is the PubNub approach
— HITL gates that require human confirmation before proceeding, preventing
"runaway chains" [10].

**What doesn't work reliably:**

- UPPERCASE urgency in descriptions alone
- Short descriptions without condition specificity
- Relying on Claude to proactively recognize agent applicability without
  explicit triggers

Sources: [3][10][11][13][14]

---

### 8. Should SoNash Agents Be Designed for Explicit Invocation Only? [CONFIDENCE: HIGH]

**The community consensus is unambiguous: design for explicit invocation as the
primary path, and treat auto-delegation as a bonus, not a guarantee.**

Multiple sources converge on this conclusion:

- "Auto-selection of custom agents remains unreliable...The only reliable
  trigger is explicit invocation, which defeats the purpose of automatic
  routing." [13]
- "Auto mode...reliable trigger is explicit invocation" [4]
- PubNub's production approach uses explicit HITL patterns rather than
  auto-delegation [10]
- The official docs explicitly provide @-mention as the "guarantees the subagent
  runs" mechanism, implicitly acknowledging that auto-delegation does not
  guarantee execution [3]

**However, SoNash has an asset that changes the calculus:** CLAUDE.md with agent
triggers table. The current CLAUDE.md Section 7 is a binding trigger directive
that instructs Claude to use specific agents when specific conditions are met.
This is more reliable than relying on description-based auto-delegation because:

1. CLAUDE.md is the highest-authority instruction in every session
2. It uses prescriptive language ("REQUIRED when triggers match")
3. It creates explicit condition-to-agent mappings

The failure mode for SoNash is not "Claude doesn't know which agent to use" but
"Claude doesn't proactively scan the current task against the CLAUDE.md trigger
table without being prompted." This is a different problem — and it's why the
behavioral guardrail requiring agents is necessary.

**Recommendation:** Keep both paths:

1. CLAUDE.md trigger directives as the authoritative routing layer (already in
   place)
2. @-mention as the explicit fallback when Claude doesn't self-trigger
3. Improve descriptions to be condition-focused (already implemented with
   PROACTIVELY language)
4. Do not rely solely on description auto-delegation for critical workflows

---

## Sources

| #   | URL                                                                                                                   | Title                                                                      | Type                | Trust       | CRAAP | Date      |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------- | ----------- | ----- | --------- |
| 1   | https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/                                               | Claude Agent Skills: A First Principles Deep Dive                          | technical blog      | MEDIUM-HIGH | 4/5   | Oct 2025  |
| 2   | https://medium.com/@georgesung/tracing-claude-codes-llm-traffic-agentic-loop-sub-agents-tool-use-prompts-7796941806f5 | Tracing Claude Code's LLM Traffic                                          | technical blog      | MEDIUM-HIGH | 4/5   | Jan 2026  |
| 3   | https://code.claude.com/docs/en/sub-agents                                                                            | Create custom subagents - Claude Code Docs                                 | official-docs       | HIGH        | 5/5   | Current   |
| 4   | https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide                                      | Claude Code multiple agent systems: Complete 2026 guide                    | community-blog      | MEDIUM      | 3/5   | 2026      |
| 5   | https://github.com/anthropics/claude-code/issues/19739                                                                | [BUG] Unified Bug Report: Claude Code Agent Systematic Failure Patterns    | GitHub issue        | MEDIUM-HIGH | 4/5   | Jan 2026  |
| 6   | https://www.ksred.com/claude-code-agents-and-subagents-what-they-actually-unlock/ (search result excerpt)             | Claude Code Agents: What They Actually Unlock                              | community-blog      | MEDIUM      | 3/5   | 2026      |
| 7   | https://github.com/anthropics/claude-code/issues/11205                                                                | [BUG] Custom Subagents in ~/.claude/agents/ Not Discovered (v2.0.35)       | GitHub issue        | HIGH        | 5/5   | Nov 2025  |
| 8   | https://github.com/anthropics/claude-code/issues/20931                                                                | [BUG] Custom Agents in ~/.claude/agents/ Not Loaded as Task Subagent Types | GitHub issue        | HIGH        | 5/5   | 2026      |
| 9   | https://github.com/anthropics/claude-code/issues/5185                                                                 | Custom agents not appearing in /agents interface                           | GitHub issue        | HIGH        | 4/5   | 2025      |
| 10  | https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/                                                | Best practices for Claude Code sub-agents                                  | industry-blog       | MEDIUM-HIGH | 4/5   | 2026      |
| 11  | https://github.com/vijaythecoder/awesome-claude-agents/blob/main/docs/best-practices.md                               | awesome-claude-agents best practices                                       | community-docs      | MEDIUM      | 3/5   | 2025-2026 |
| 12  | https://github.com/VoltAgent/awesome-claude-code-subagents                                                            | awesome-claude-code-subagents (100+ agents)                                | community-repo      | MEDIUM      | 3/5   | 2026      |
| 13  | https://www.ksred.com/claude-code-agents-and-subagents-what-they-actually-unlock/                                     | Claude Code Agents & Subagents: What They Actually Unlock                  | community-blog      | MEDIUM      | 3/5   | 2026      |
| 14  | https://blog.sshh.io/p/how-i-use-every-claude-code-feature                                                            | How I Use Every Claude Code Feature                                        | power-user-blog     | MEDIUM      | 3/5   | 2026      |
| 15  | https://platform.claude.com/docs/en/agent-sdk/subagents                                                               | Subagents in the SDK - Claude API Docs                                     | official-docs       | HIGH        | 5/5   | Current   |
| 16  | https://github.com/Piebald-AI/claude-code-system-prompts                                                              | Claude Code System Prompts (extracted)                                     | reverse-engineering | MEDIUM-HIGH | 4/5   | 2025-2026 |

---

## Contradictions

**Contradiction 1: "Description is the only signal" vs. "Name affects
routing."** The official docs say "Claude uses each subagent's description to
decide when to delegate" — description only. But one GitHub issue report [6]
found agent names with meaningful keywords interfered with routing. The system
prompt shows agents presented as `"name": description` pairs, meaning Claude
sees both. Whether name semantics contribute to routing is not officially
documented and appears to be an emergent LLM behavior.

**Contradiction 2: "File discovery was broken" vs. "Project-local agents load
reliably."** Multiple issues (Nov 2025 - Feb 2026) document `~/.claude/agents/`
discovery failure. But the current official docs state agents load at session
start from `.claude/agents/` and `~/.claude/agents/`. The scope of the fix is
unclear — it appears `.claude/agents/` (project-level) was more reliable
throughout, while the user-level directory had the documented failures. SoNash
uses `.claude/agents/` and appears unaffected.

**Contradiction 3: "UPPERCASE urgency helps" vs. "UPPERCASE is ineffective."**
Prior research (D1b/D6c) states UPPERCASE urgency is "less reliable" than
example blocks. Community docs recommend "MUST BE USED" and "PROACTIVELY"
language. These appear contradictory — the resolution is that UPPERCASE improves
attention weighting for explicit invocation contexts but doesn't create reliable
auto-delegation on its own. Both can be true.

---

## Gaps

1. **No official Anthropic documentation** on how the delegation decision is
   made algorithmically (the LLM-based matching mechanism is inferred, not
   documented).
2. **No controlled experiments** comparing description formats (short vs. long,
   with/without examples, with/without UPPERCASE).
3. **The `<example>` block claim** from D6c ("single highest-leverage
   improvement") is unverifiable from official sources. It may be true for
   skills (where `when_to_use` concatenation provides more signal) but is not
   confirmed for agent descriptions.
4. **The name-matching collision bug** [6] is a single report with no Anthropic
   confirmation or resolution.
5. **Current state of discovery bugs:** The issues were reported through Feb
   2026 but may be fixed in later versions. No confirmed fix version was
   identified.
6. **Token budget for all agent descriptions combined:** The skills system has a
   ~15,000 character budget. The agent system's budget is undocumented. With 27
   agents in SoNash, description crowding may be a real concern.

---

## Serendipity

**Token multiplication cost:** Multi-agent workflows use roughly 4-7x more
tokens than single-agent sessions per Anthropic's own documentation [4]. This is
independent of the delegation question but is a real cost factor for SoNash's
heavy-agent architecture.

**The "Master-Clone" anti-pattern:** One power user explicitly _avoids_ custom
subagents [14], instead putting all context in CLAUDE.md and letting the main
agent spawn `general-purpose` clones via Task. This approach sidesteps
description-matching failures entirely and preserves "holistic reasoning." Worth
considering for SoNash's most complex cross-cutting agents.

**Security vulnerability via `.claude/agents/`:** A March 2026 Check Point
Research report (CVE-2025-59536, CVE-2026-21852) documents RCE and API token
exfiltration through Claude Code project files. If malicious content appears in
`.claude/agents/`, it could be executed. For SoNash with 27 project-level agents
checked into version control, this is worth reviewing — particularly for agents
with `bypassPermissions` or `dontAsk` permission modes.

---

## Per-Question Answer Summary

| Q                                              | Answer                                                                                                                                                                                                                                                                                                                 | Confidence |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Q1: How does auto-delegation work?             | Pure LLM reasoning. All agent names+descriptions are formatted into Agent tool's prompt. Claude reads the list and decides during its forward pass. No embeddings, classifiers, or regex.                                                                                                                              | HIGH       |
| Q2: Why does it fail?                          | Six failure modes: vague/overlapping descriptions, task appears "small enough" to handle inline, Opus over-delegates, interpretive compliance bias, context compaction loss, name-keyword collisions                                                                                                                   | HIGH       |
| Q3: What makes example blocks effective?       | No official docs confirm example blocks specifically. Richer, condition-focused descriptions improve matching. The `when_to_use` + `description` concatenation pattern (for skills) provides more signal. For agents, the mechanism is the same but `<example>` blocks inside the `description` field are unconfirmed. | MEDIUM     |
| Q4: Does description length matter?            | Condition-focused 1-3 sentences appear optimal. Too short = under-specification. Too long = dilutes signal, risks crowding 15k char budget across many agents. No controlled data exists.                                                                                                                              | MEDIUM     |
| Q5: Does the `name` field affect delegation?   | Official docs say no (description only). But name and description are presented together to the LLM, and one bug report shows name keywords can interfere. Design descriptions to carry the full signal.                                                                                                               | MEDIUM     |
| Q6: Known workarounds for reliable invocation? | @-mention (guarantees), explicit natural language naming (reliable), CLAUDE.md trigger directives (session-persistent high-authority), `--agent` flag (whole-session), PreToolUse hooks (forced gates)                                                                                                                 | HIGH       |
| Q7: Design for explicit invocation only?       | Community consensus: yes. But SoNash's CLAUDE.md trigger directives partially solve this at the architecture level. Keep both paths: CLAUDE.md as authoritative routing + @-mention as explicit fallback.                                                                                                              | HIGH       |

---

## Confidence Assessment

- HIGH claims: 5
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **MEDIUM-HIGH** (the core mechanism is well-understood;
  the failure mode taxonomy is community-derived but corroborated; specific
  format guidance lacks controlled evidence)
