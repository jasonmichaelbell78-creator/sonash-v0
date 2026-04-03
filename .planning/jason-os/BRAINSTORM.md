# Brainstorm: JASON-OS

**Date:** 2026-04-01 (revisited 2026-04-03) **Status:** Complete **Routing:**
deep-plan (phased implementation plan)

## Problem Space

SoNash started as an app but evolved into a Claude Code operating system — 67
skills, 37 agents, 21 hooks, convergence loops, multi-agent research pipelines,
quality gates. The app work became secondary to the processes and workflows that
underpin it.

The operator (Jason) is a no-code vibe coder who orchestrates Claude Code to
build sophisticated systems. The OS proves this model works. The goal is to
extract the project-agnostic core so any new project — app, CLI, library,
documentation project — starts with the full workflow system from day one.

The "why behind the why": if someone who doesn't code can build a 67-skill
development infrastructure through pure orchestration, that infrastructure
should be portable. JASON-OS is both the product and the proof.

## Anti-Goals

- **Maintenance overhead that kills the project.** Sync between SoNash and
  JASON-OS must be as automated as possible. Manual overhead is the #1 risk.
- **Another rabbit hole.** The operator's pattern is: idea → research → plan →
  new idea → research → plan → never ship. JASON-OS must ship a usable v0.1
  before expanding. Scope discipline is a design constraint.
- **SoNash-specific references.** Nothing in the OS should reference Firebase,
  httpsCallable, Firestore, SoNash, or any project-specific pattern.
- **Developer-only tool.** The OS must work for orchestrators (no-code/vibe
  coders), not just people who can read and write code.
- **Cross-tool portability as a launch requirement.** Claude Code first.
  Cross-tool (Cursor, Gemini CLI, Copilot) is a future concern.

## Landscape

**What's portable today (from SoNash):**

- ~47 generic skills (audits, planning, research, session management, design)
- ~16 generic agents (deep-research pipeline, architecture, quality)
- ~5 portable hooks (push protection, MCP check, large file gate)
- ~5 library scripts (security-helpers, sanitize-error, safe-fs, read-jsonl)
- Behavioral guardrails (CLAUDE.md Section 4) and coding standards (Section 6)

**What's SoNash-specific (stays behind):**

- ~20 skills (TDMS, SonarCloud, code-reviewer with Firebase patterns)
- ~19 agents (frontend-developer with React/Firebase, debugger with SoNash)
- ~16 hooks (Firestore rules guard, session-start with Firebase build)
- Stack-specific CLAUDE.md sections (1-3, 7-8)
- `sonash-context` skill loaded by 10+ agents

**Community landscape:**

- claude-pipeline, SuperClaude, starter kits exist but none match this depth
- Claude Code's plugin system is the native distribution mechanism
- AgentSkills open standard makes SKILL.md files cross-tool portable (future)
- No "Claude Code OS" equivalent exists at this sophistication level

## Directions Explored

### Direction A: Plugin

Single GitHub repo as Claude Code plugin. `/plugin install jason-os`. Skills
namespaced, agents included, hooks configured. Clean distribution but plugin
system has constraints on what can be included. Best sync story via
`/reload-plugins`. Weakest on flexibility — can't include everything the OS
needs (project-level CLAUDE.md, doc structure, script infrastructure).

### Direction B: Template Repo

GitHub template. "Use this template" → new repo with full `.claude/` and
infrastructure. Simplest mental model. But worst sync story — once a project
diverges, there's no update path. Each project becomes its own island.

### Direction C: Monorepo Layer

JASON-OS and SoNash in one repo as workspace packages. Best sync (no sync
needed) but worst coupling. Gets unwieldy. Not handoff-friendly.

### Direction D: Living Extraction

A skill inside SoNash that exports a portable snapshot on demand. Clever one-way
sync but no persistent identity for JASON-OS. SoNash remains center of gravity
forever.

### Direction E: Hybrid (Plugin + Template)

Two repos — plugin (living, updatable) + template (static scaffold). Clean
separation but two repos to maintain. Plugin is the product, template is
optional onboarding.

### Direction F: Platform (evolved from B)

JASON-OS as its own project — starts as a template, evolves into a CLI tool.
`jason-os init` scaffolds. `jason-os sync` pulls updates.
`jason-os export-learnings` captures improvements from projects back to the
core. Solves bidirectional sync by design in the medium-term.

## Contrarian Assessment

**The maintenance trap:** During the template phase (before CLI exists), manual
sync between SoNash and JASON-OS will be tedious. After a few weeks, the
template could drift behind and rot. This is the #1 risk.

**CLI scope creep:** "Intelligent sync" requires semantic understanding of skill
content, not just file diffing. Could consume months of development time.

**The joy problem:** Extraction is grunt work — stripping SoNash references from
47 skills, 16 agents. Not the creative work the operator enjoys. Risk of
abandonment during extraction phase.

**What Plugin (A) gets right:** Plugins solve sync by design
(`/reload-plugins`). The constraints may be worth accepting to avoid the sync
trap. Plugin could serve as the short-term vehicle even within the B→F path.

## Evaluation Summary

| Direction   | Strengths                                      | Weaknesses                                   | Feasibility |
| ----------- | ---------------------------------------------- | -------------------------------------------- | ----------- |
| A: Plugin   | Best sync (`/reload-plugins`), clean namespace | Plugin constraints limit what's included     | High        |
| B: Template | Simplest mental model, zero infrastructure     | Worst sync — projects diverge immediately    | High        |
| C: Monorepo | No sync needed — one repo                      | Couples unrelated projects, gets unwieldy    | Medium      |
| D: Extract  | Elegant one-way sync, SoNash stays source      | No persistent identity for JASON-OS          | Medium      |
| E: Hybrid   | Clean separation (scaffold + living OS)        | Two repos to maintain                        | High        |
| F: Platform | CLI solves sync by design, strongest evolution | Biggest build effort, CLI is its own project | Medium-High |

## Chosen Direction

**Direction: B→F (Template evolving to Platform)**

**Rationale:** The template gives immediate value with zero infrastructure. The
platform (CLI) is the medium-term product that solves the sync problem — the #1
risk. The CLI itself will be the first project JASON-OS bootstraps, proving the
system works (dog food). Plugin (A) may serve as an intermediate mechanism
during the template phase to ease sync pain.

The decisive factor: this direction matches the operator's identity. A no-code
vibe coder building an OS that proves no-code orchestration works. The template
ships fast. The platform grows from use. The long-term vision (project-agnostic,
tool-agnostic, user-friendly) is achievable incrementally.

**Open Questions:**

1. What innovative sync mechanisms can minimize manual overhead during the
   template phase? (deep-plan or deep-research)
2. What does the CLI look like technically? Node? Go? A Claude Code skill that
   acts as CLI? (deep-research)
3. Automated vs manual extraction — can a skill strip SoNash references from
   portable artifacts? (deep-plan)
4. What's the minimum viable template — curated subset or full 47 skills?
   (deep-plan)
5. How does `sonash-context` become `project-context`? (deep-plan)
6. How to prevent rabbit-hole expansion — what's the smallest v0.1 that ships
   and is usable? (deep-plan)
7. What existing SoNash plans and research should be completed vs abandoned
   before starting JASON-OS? (triage session)

## Routing

Next action: `/deep-plan` — phased implementation plan for JASON-OS, starting
with the minimum viable template extraction. Open questions 1-6 become discovery
questions. Open question 7 should be addressed first as a triage session to
clear the backlog before adding JASON-OS to it.

---

## Revisit: 2026-04-03

**Trigger:** Operator is actively running `/repo-analysis` on external repos to
scout for adoption possibilities. Identified a gap — no domain in the research
roadmap covers "find and adopt improvements from outside sources."

**Gap identified:** Domain 02 (External Landscape) surveys approaches
conceptually. But nowhere in the 16-domain roadmap did we account for evaluating
specific external repos for **additive** (new capabilities) or **replacement**
(better implementations) improvements. The repo-analysis skill generates exactly
this data, but it had no home.

**Resolution: B+C Hybrid**

- **B: New Domain 02a (External Adoption Scouting)** — dedicated Tier 1 domain.
  Uses `/repo-analysis` as primary tool. Findings classified as additive,
  replacement, or inspirational. Unlike other domains, 02a is **ongoing** — it
  doesn't gate once and close. New repos can be scouted at any time.

- **C: Cross-Cutting Adoption Protocol** — added to the Research Protocol (Phase
  A scoping) for every domain. Before scoping research, each domain MUST check
  Domain 02a findings for entries classified under that domain. This ensures
  scouting discoveries feed into every domain, not just one.

**New decisions:** 33 (new domain), 34 (cross-cutting protocol), 35
(repo-analysis as primary tool). See DECISIONS.md.

**Operator clarifications (responses to revisit prompts):**

- 16-domain scope: "massive is fine. the joy is in the work."
- B→F direction: "good though research may reveal more"
- v0.1 scope: reframed — "i don't think in terms of shippable. I want to create.
  The rest comes in time."
- Extraction: "won't all port over and many will most likely be simplified"
- Windows agent bug: "not an issue here at home" — guardrails sufficient

**Updated routing:** Same as original — `/deep-plan` next. Domain 02a is already
active via repo-analysis runs.
