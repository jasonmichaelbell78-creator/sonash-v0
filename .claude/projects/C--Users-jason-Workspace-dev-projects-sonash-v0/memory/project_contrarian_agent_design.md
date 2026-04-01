---
name: Contrarian/OTB agent design task
description:
  Create dedicated contrarian-challenger.md, otb-challenger.md, and
  claim-verifier.md agents for /deep-research and other adversarial review
  workflows
type: project
---

Design and create dedicated agent definitions for adversarial review roles used
across /deep-research, /convergence-loop, and audits.

**Why:** Current contrarian/OTB agents use general-purpose with ad-hoc prompts.
Quality depends on prompt discipline at spawn time. Dedicated agents would lock
in methodology, enable model overrides, reduce prompt bloat, and ensure
reusability.

**How to apply:** After the hook-if-conditions research completes, use
/skill-creator or manual agent authoring to produce:

- `.claude/agents/contrarian-challenger.md` — steel-manning, inversion, evidence
  requirements, minimum challenge count
- `.claude/agents/otb-challenger.md` — unconventional angles, missed
  alternatives, creative reframing
- `.claude/agents/claim-verifier.md` — filesystem verification, per-claim
  verdicts with file:line evidence
- Update `/deep-research` REFERENCE.md to reference these agents instead of
  general-purpose

Decided 2026-03-29 (Session #244).
