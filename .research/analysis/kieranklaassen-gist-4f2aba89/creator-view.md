# Claude Code Swarm Orchestration — kieranklaassen's Agent Coordination Reference

**URL:** https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea
**Author:** kieranklaassen **Scan:** Standard, 2026-04-07 **Fit:** active-sprint
| Excellent (80)

---

## 1. What's Relevant To Your Work

This is the most technically dense gist of the four analyzed today — 82 code
blocks showing actual TeammateTool and Task system calls. It's a reference
manual for capabilities you use daily but may not have fully cataloged.

**Direct mappings:**

- **AGENT_ORCHESTRATION.md** — your orchestration doc covers parallelization
  guidelines and capacity. This gist adds a formal 6-pattern taxonomy and the
  TeammateTool operation reference you don't have documented.

- **T5 (Worktree management)** — the spawn backend comparison (in-process vs
  tmux vs iterm2) is directly relevant. Your worktree brainstorm (Direction F:
  `claude -w`) explored process isolation. The tmux backend gives visible,
  persistent agent panes — a different approach to the same problem.

- **Agent teams** (`.claude/teams/`) — you have `audit-review-team` and
  `research-plan-team`. This gist documents 13 TeammateTool operations. Are your
  teams using the full protocol? Do they handle shutdown/cleanup? Do they use
  plan approval gates?

- **Deep-research pipeline** — your searcher -> synthesizer -> verifier ->
  challenger pipeline is Pattern 4 (Research+Implementation) combined with
  Pattern 2 (Pipeline). The task dependency auto-unblock feature could replace
  your manual sequential dispatch if you formalize it.

**The key gap this surfaces:** your skills use subagents exclusively (Task tool
alone). No skill currently uses persistent teammates (Task + team_name + name).
The question is whether any of your longer workflows (deep-research with 40+
agents, repo-synthesis across 6 repos) would benefit from persistent teammates
with inbox messaging instead of fire-and-forget subagents.

---

## 2. What This Site Understands

This gist understands the mechanical layer of Claude Code's multi-agent system
better than anything else we've analyzed. It's not proposing a philosophy or
pattern — it's documenting what the tools actually do, with code examples for
every operation.

The 6 orchestration patterns are the most valuable synthesis:

| Pattern                 | Your Usage                                      | Gap                                    |
| ----------------------- | ----------------------------------------------- | -------------------------------------- |
| Parallel Specialists    | code-reviewer, deep-research searchers          | Named and documented                   |
| Pipeline                | deep-research phases, pr-review rounds          | Using manual sequencing, not task deps |
| Swarm                   | Not used                                        | Self-organizing pool — unexplored      |
| Research+Implementation | deep-research -> deep-plan -> execute           | Named but not formalized               |
| Plan Approval           | deep-plan approval gate, brainstorm convergence | Partially implemented                  |
| Coordinated Refactoring | GSD execute-phase                               | Closest match, different mechanism     |

| Axis               | Band            | Notes                                                    |
| ------------------ | --------------- | -------------------------------------------------------- |
| Actionability      | Excellent (90)  | 82 code blocks — copy-paste ready                        |
| Novelty            | Needs Work (55) | Documents existing capabilities, doesn't create new ones |
| Evidence quality   | Healthy (70)    | Code examples are self-documenting evidence              |
| Technical depth    | Excellent (92)  | Deepest technical coverage of any gist today             |
| Recency            | Healthy (75)    | Current Claude Code API                                  |
| Relevance to stack | Excellent (95)  | Literally our platform's agent system                    |
| Cross-ref density  | Critical (15)   | Zero external links                                      |
| Synthesis quality  | Healthy (60)    | Reference manual, not analytical synthesis               |
| Ecosystem coverage | Excellent (80)  | Covers built-in + plugin agent types                     |
| Contrarian signal  | Critical (20)   | No contrarian position — pure documentation              |
| Teaching quality   | Excellent (85)  | Clear examples, good pattern naming                      |
| Reproducibility    | Excellent (95)  | Literal tool calls                                       |
| Strategic fit      | Healthy (75)    | Reference material for existing work                     |

**Overall quality:** Healthy (70) | **Personal fit:** Excellent (80)

---

## 3. Voice and Editorial POV

Pure documentation voice. No philosophy, no opinions, no editorial stance. Every
section follows the same pattern: explain concept, show code, note gotchas. The
author clearly has hands-on experience — the "common errors" section and "prefer
write over broadcast" best practice read like lessons from real bugs.

The gist is structured as a SKILL.md file (it has the frontmatter format), which
means it's designed to be loaded into Claude Code's context as an instruction
set. The author uses Claude Code the way you do — as an orchestration platform.

---

## 4. Where Your Approach Differs

**Productive divergences:**

- **You have convergence verification.** This gist's patterns dispatch agents
  and collect results but never verify quality. Your convergence loops, T20
  tallies, and verification passes are an entire quality layer this reference
  doesn't address. This is your biggest advantage.

- **You use behavioral guardrails.** Your CLAUDE.md Section 4 (15 guardrails)
  constrains agent behavior in ways this gist doesn't consider. The gist assumes
  agents will follow instructions; you've learned (over 266 sessions) that they
  need enforcement.

- **You have skill-level orchestration.** Your skills ARE orchestration — each
  skill defines its own agent dispatch, phase structure, and quality gates. This
  gist treats orchestration as a generic capability; you've specialized it per
  domain.

**Fundamental divergence:**

- **Subagents vs teammates.** You exclusively use subagents (fire-and-forget).
  This gist documents a persistent teammate model with inbox messaging. The
  tradeoff: subagents are simpler but can't coordinate mid-task. Teammates can
  coordinate but add lifecycle complexity (shutdown, cleanup, crashed agent
  recovery). For your current scale, subagents are correct. If T24 (synthesis
  adoption) needs agents that coordinate across a batch of analyses, teammates
  might be worth evaluating.

---

## 5. The Challenge

The gist is a reference manual, not a thinking tool. It tells you HOW to use
TeammateTool but not WHEN each pattern is optimal. The 6 patterns are named but
not compared — when should you use Pipeline vs Swarm? When does the overhead of
persistent teammates justify itself over simple subagents?

For your purposes, the value is in the details you might not know (task
auto-unblock, spawn backend selection, plan approval protocol) rather than the
overall architecture (which you've already surpassed).

---

## 6. Knowledge Candidates

| ID  | What to Extract                         | Type                 | Confidence | Effort |
| --- | --------------------------------------- | -------------------- | ---------- | ------ |
| K1  | 6-pattern orchestration taxonomy        | architecture-pattern | HIGH       | Low    |
| K2  | Spawn backend comparison for T5         | pattern              | HIGH       | Low    |
| K3  | TeammateTool 13-operation reference     | pattern              | HIGH       | Low    |
| K4  | Task dependency auto-unblock            | workflow-pattern     | HIGH       | Medium |
| K5  | Subagent vs teammate decision framework | design-principle     | HIGH       | Low    |

---

## Engineer View

GitHub Gist platform — dimensions platform-inherited.

| Dimension        | Band            | Notes                                                               |
| ---------------- | --------------- | ------------------------------------------------------------------- |
| Performance      | N/A             | GitHub Gist                                                         |
| Security Headers | N/A             | GitHub platform                                                     |
| Accessibility    | Healthy (65)    | Well-structured markdown, 85 headings                               |
| SEO              | Needs Work (45) | Good OG title but generic description                               |
| Technical Stack  | N/A             | GitHub Gist                                                         |
| Mobile Readiness | Healthy (70)    | GitHub responsive, though 82 code blocks are hard to read on mobile |

---

## Metadata

- **11 findings** extracted (9 HIGH confidence, 1 MEDIUM, 2 absences)
- **5 knowledge candidates** ranked
- **0 external links**
- **5 absence patterns** identified
