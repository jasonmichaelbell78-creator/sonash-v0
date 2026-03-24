# Note: Cross-Model Verification — Broader Opportunities

**Date:** 2026-03-20 **Status:** Explore after deep-research skill is in place

## Context

Gemini CLI (free, scriptable, JSON output) solves the "Claude checking Claude"
bias problem for deep-research verification. But this capability has
applications far beyond research:

## Opportunities to Explore

- **Code review verification** — have Gemini independently review code that
  Claude's code-reviewer flagged (or missed)
- **Convergence loop enhancement** — add cross-model verification as a
  composable behavior in `/convergence-loop`
- **Plan validation** — have an independent model review `/deep-plan` output
  before execution
- **Skill audit** — cross-model assessment of skill quality
- **Security audit** — independent security review of Claude's security findings
- **Fact-checking in documentation** — verify claims in generated docs
- **PR review cross-check** — second opinion on PR review feedback processing

## Setup Required

- `npm install -g @google/gemini-cli` + Google auth (2 minutes)
- Optionally: PAL-MCP-Server for multi-model consensus via MCP
- Optionally: OpenAI API ($5 prepaid) for GPT as a third verifier

## Action

Once `/deep-research` is built and the Gemini CLI verification pattern is
proven, conduct a systematic exploration of where else cross-model verification
adds value across the SoNash skill ecosystem.
