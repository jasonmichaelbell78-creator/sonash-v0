# Creator View: teng-lin/notebooklm-py

**Analyzed:** 2026-04-06 | **Skill Version:** 4.2 | **Depth:** Standard

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands that the boundary between an API client and an AI skill is
dissolving. It's not just a Python wrapper for Google NotebookLM — it's a
complete agent-native package: Python API + CLI + SKILL.md + skill install
command + multi-agent support + CI that monitors the external API for breakage.

The SKILL.md is the most sophisticated agent instruction file in all 6 repos. It
has everything: installation (3 methods including `npx skills add`),
prerequisites, autonomy rules (22 auto-run + 7 ask-first), quick reference,
workflow examples with embedded `Task()` subagent invocations, and trigger
patterns.

The `skill.py` install mechanism solves a real problem: how do you distribute a
SKILL.md to the right location? Read from package data, stamp version, write to
`~/.claude/skills/` and `~/.agents/skills/`. The `skill status` command detects
drift.

The CI maturity is exceptional: 8 workflows including CodeQL, nightly e2e, RPC
health monitoring with auto-issue creation, publish pipelines, and package
verification.

**Blindspots:** Depends on undocumented Google RPC endpoints. rpc-health.yml
mitigates but doesn't solve. 2.2MB of Python for a wrapper — complexity may
outpace the underlying API's stability.

---

## 2. What's Relevant To Your Work

Content evaluation of CLAUDE.md, AGENTS.md, SKILL.md, skill.py, 8 CI workflows,
and the `npx skills add` reference surfaced highly applicable artifacts.

**SKILL.md Autonomy Rules (lines 94-128).** 22 commands "Run automatically" + 7
"Ask before running," each with a one-line reason. Structured encoding of
CLAUDE.md Guardrail #2 at the per-command level. Retrofit candidate for
add-debt, pr-review, session-end, audit-\* skills. ~30 min per skill.

**skill.py — Skill Install + Version Stamping.** `SkillTarget` dataclass → write
SKILL.md to `~/.claude/skills/notebooklm/` and `~/.agents/skills/notebooklm/`.
Version stamping via `<!-- notebooklm-py vX.Y.Z -->`. `skill status` detects
drift. Directly retires cross_locale_config problem. Needs Node port. ~1 day
(E2).

**rpc-health.yml — External Contract Monitoring.** Daily cron, 3 exit codes,
auto-creates labeled GitHub issues. Pattern activates when you identify an
external contract to monitor (Claude tool API, MCP server health, Anthropic SDK
drift, GitHub Actions API).

**CLAUDE.md structure.** Well-structured: project overview → dev commands →
pre-commit checks → architecture → PR workflow. Their ambient PR workflow
(monitor CI → check reviews → fix + reply with SHA → verify mergeStateStatus
CLEAN) is an alternative to your invoked `/pr-review`.

**AGENTS.md — separate agent guidance.** Codex/parallel agent notes in a
separate file. Your CLAUDE.md Section 7 is growing. AGENTS.md separation reduces
bloat.

**`npx skills add` — open skills ecosystem (UNVERIFIED).** SKILL.md line 29. If
real, directly relevant to JASON-OS distribution. Critical to verify.

**Embedded Task() subagent patterns.** Literal
`Task(prompt=..., subagent_type=...)` in SKILL.md workflows. Reduces agent
cognitive load. Retrofit for deep-research, audit-\* skills.

---

## 3. Where Your Approach Differs

**Ahead: Skill ecosystem breadth.** 72 skills vs 1. Breadth vs depth.

**Ahead: Quality infrastructure scope.** patterns:check (55+ rules), TDMS, code
review automation cover entire project. Their CI is excellent but focused on one
package.

**Different: Skill distribution.** `notebooklm skill install` (programmatic) vs
git-tracked files. Solves cross-locale drift vs ensures version control.

**Behind: CI maturity.** 8 workflows, nightly e2e, RPC health, CodeQL. Your CI
is deploy + pre-commit hooks. For agent-facing code, their coverage is ahead.

---

## 4. The Challenge

The skill install mechanism solves your cross_locale_config problem. Proven
pattern (3 releases, version stamping, drift detection). Port to Node/TS or
adopt Python approach?

---

## 5. Knowledge Candidates

| Tier | Candidate                         | Novelty | Effort | Notes                                       |
| ---- | --------------------------------- | ------- | ------ | ------------------------------------------- |
| T1   | Autonomy Rules section pattern    | Medium  | E1     | Add to sonash SKILL.md template.            |
| T1   | Skill install + version stamping  | High    | E2     | Port to Node. Solves cross_locale_config.   |
| T1   | RPC health monitoring pattern     | Medium  | E2     | Activate when external contract identified. |
| T2   | CLAUDE.md ambient PR workflow     | Medium  | E1     | Alternative to /pr-review.                  |
| T2   | AGENTS.md separation              | Low     | E0     | Consider if CLAUDE.md grows.                |
| T2   | Embedded Task() subagent patterns | Medium  | E1     | Retrofit for long-running skills.           |
| T3   | npx skills add investigation      | High?   | E1     | 15-min web research to verify.              |

---

## 6. What's Worth Avoiding

**Depending on undocumented APIs.** The entire project wraps Google's internal
`batchexecute` RPC protocol with obfuscated method IDs. Prefer documented APIs.
Use rpc-health as safety net, not substitute.

**Over-engineering the install mechanism.** skill.py is 280 lines for "copy a
file and stamp a version." Extract the pattern, not the complexity.
