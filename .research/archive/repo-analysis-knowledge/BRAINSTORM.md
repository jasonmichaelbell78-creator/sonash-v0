# Brainstorm: Repo Analysis Knowledge/Insight Layer

**Date:** 2026-04-03 **Status:** Converged **Chosen Direction:** B (Dual Lens)
with creator emphasis

## Problem

The repo-analysis skill evaluates repos through an engineer lens only — health,
security, process, adoption. It answers "should I use this code?" but not "what
does this repo understand that I don't?" or "how does this challenge what I'm
doing?"

Two analyses today (karpathy/autoresearch, codecrafters-io/build-your-own-x)
proved the gap: the most valuable findings came from ad-hoc conversations AFTER
the formal analysis, not from the analysis itself. The skill scored autoresearch
as Critical/Needs Work while missing that it contains a masterclass in
autonomous agent instruction design.

## Discovery (14 questions, 14 answers)

### What the user actually wants from repo analysis

- "What does this person/team know that I don't?"
- "How can I use this in my work (sonash-v0, JASON-OS)?"
- Techniques, philosophies, reframing of existing knowledge
- Solutions to problems they didn't know they had
- Creative improvements to current approaches
- Challenge on current assumptions — not validation, genuine pushback
- Knowledge that improves cognitive ability long-term (multi-layer memory
  research was motivated by seeing another repo)

### How the creator lens differs from the engineer lens

| Engineer lens (current)        | Creator lens (new)                             |
| ------------------------------ | ---------------------------------------------- |
| Is this code safe?             | What does this person understand?              |
| Can I extract this pattern?    | What idea here changes how I think?            |
| Will this break in production? | What problem does this solve I didn't know?    |
| Does it fit my stack?          | Does this show something I thought impossible? |
| What's the maintenance cost?   | Where am I doing this wrong?                   |

### Output requirements

- In the output (dedicated section), not real-time interruption
- Direct comparisons to home codebase ("they do X, you do Y, consider Z")
- Opinionated — "here's THE thing" not neutral observations
- Ahead/different/behind classification relative to user's work
- Creator lens by default, engineer lens always present, multiple lenses good
- Challenge only when warranted — not forced, not obstructive
- No context limits on home repo loading for comparisons
- Depth over brevity — real analysis, not bullet points
- Anti-goal: MUST NOT read like a technical manual. Conversational, readable.

## Directions Explored

### Direction A: Bolt-on insight section

Add `## Insights` after health tables. Minimal disruption, ships fast. Rejected
because the structure still says "health matters more" — the medium is the
message.

### Direction B: Dual Lens (CHOSEN, with creator emphasis)

Two parallel analyses: Creator View and Engineer View. Both present, both
computed, but Creator View comes first and gets more space. Engineer View is
complete but follows.

### Direction C: Creator-first with engineer annex

Flip hierarchy entirely. Rejected because it's a bad fit for library evaluations
where health IS the question. Direction B handles both repo types.

## Chosen Direction: Dual Lens, Creator Emphasis

**Structure:** summary.md leads with Creator View, followed by Engineer View.
Both are full analyses. Ordering signals priority without sacrificing either.

**Creator View sections:**

1. What This Repo Understands — deep, conversational analysis of the repo's
   knowledge, methodology, and insights
2. What's Relevant To Your Work — direct comparison to home repo codebase,
   active projects, and current approaches
3. Where Your Approach Differs — ahead/different/behind classification on
   specific topics
4. The Challenge — opinionated "THE thing to consider adopting or rethinking,"
   only when warranted. Not forced.
5. Knowledge Candidates — alongside pattern candidates in value-map.json

**Creator View requirements:**

- Loads home repo context (ROADMAP.md, CLAUDE.md, SESSION_CONTEXT.md, active
  skills, architecture) to enable direct comparisons
- Written in conversational prose, not tables
- Depth over brevity
- Challenge section only appears when genuine — empty is fine

**Engineer View:** Current health/security/process/velocity analysis. Tables,
bands, scores. No changes needed — it works for what it does.

## Open Questions (for skill-creator)

1. Bounded home repo context set (ROADMAP, CLAUDE, SESSION_CONTEXT, skills?)
2. Knowledge candidates in value-map.json or separate artifact?
3. Ahead/different/behind: per-finding or repo-level verdict?
4. Should Quick Scan include a lightweight creator lens (README-only analysis)?

## Anti-Goals

- Must NOT read like a technical manual
- Must NOT challenge on every analysis — only when warranted
- Must NOT be obstructive or exhausting
- Must NOT replace the engineer lens — both serve different needs
