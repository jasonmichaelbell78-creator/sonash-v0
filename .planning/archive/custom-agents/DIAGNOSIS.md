# Diagnosis: Custom Agent Implementation

## ROADMAP Alignment

**Aligned.** ROADMAP mentions agent infrastructure (Session #90) and
AGENT_ORCHESTRATION.md. The research (102 claims, 37 agents, 5 waves) provides
comprehensive implementation guidance.

## Research Context

`.research/custom-agents/RESEARCH_OUTPUT.md` (v3.0, L4 depth, 111 claims, 58
sources) — injected as primary input. Key implementation order:

- **P0:** Infrastructure (sonash-context skill, metrics, cross-ref audit, hooks)
- **P1:** Quick wins (general-purpose override, consolidation, model upgrades)
- **P2:** Deep-research pipeline (6 agents), stub elevations, system overrides
- **P3:** Net-new agents (creation gate applies)

## Current Ecosystem State

- **26 local agents** in `.claude/agents/` (+ 13 global in `global/`)
- **2 deep-research agents** exist: `deep-research-searcher` (385 lines,
  reference quality) and `deep-research-synthesizer` (343 lines)
- **4 pipeline gaps:** verifier (no template), adversarial (26-27 line
  templates), dispute-resolver (16-line template), gap-pursuer (37 lines),
  final-synthesizer (35 lines, mode-collapse risk)
- **Agent quality:** F grade (54/100 mean), but self-correcting within audits
- **Agent body semantics:** Body replaces base system prompt, but CLAUDE.md IS
  inherited. Gap is context incompleteness, not security absence.
- **Description routing:** Pure LLM reasoning, no classifier. 3 agents have
  zero-signal descriptions.

## Scope Assessment

The research recommends P0→P3 staged implementation. This deep-plan should scope
to **P0 + P1 + P2** (infrastructure + quick wins + pipeline agents). P3 is
capacity-dependent and requires documented failures before creation.

Total: ~17-20 agent files to create/modify/remove. Significant but bounded.

## Key Constraints

1. 30-agent hard ceiling (one-in-one-out at ceiling)
2. 500-2000 token sweet spot for agent bodies
3. `skills:` field for shared context injection (untested — needs pilot)
4. `model:` field in skills is broken (GitHub #21679)
5. Solo developer — implementation must be staged, not all-at-once
