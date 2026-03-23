# Core Design Principle: Overkill by Default

**Date:** 2026-03-20 **Source:** User directive during deep-plan discovery
**Priority:** HIGHEST — this overrides efficiency-first assumptions everywhere

## The Principle

> Leave no stone unturned. Go above, beyond, and far past what seems necessary
> or appropriate. Overkill on everything.

## What This Means for the Deep-Research Skill

### Default Behavior

- **Exhaustive is the default depth.** Quick/standard modes exist but are not
  the primary use case.
- **More agents, not fewer.** Cast a wider net than seems necessary. Launch
  parallel research across dimensions that might seem tangential.
- **Verify more than seems reasonable.** Triple-check, not spot-check. If a
  convergence loop passes, run a second one from a different angle.
- **Explore tangential paths.** The "irrelevant" thread might be the most
  important discovery.
- **No premature termination.** Don't stop when you think you have enough — stop
  when you've genuinely exhausted available sources.

### Mandatory Phases (Not Optional)

- **Contrarian agent** — challenges consensus, tries to disprove findings
- **Outside-the-box agent** — finds what structured research missed
- **Self-audit** — multi-agent verification of the research itself
- **Cross-reference verification** — convergence loops on key claims

### How This Differs from Industry

Most AI research tools optimize for speed and cost. This skill optimizes for
**thoroughness and confidence**. Speed is secondary. Cost is managed but not
minimized at the expense of coverage.

### Abbreviated Modes

Quick and standard modes exist for when the user explicitly requests less depth.
But they are opt-in exceptions, not the default. Even "quick" mode should be
more thorough than competing tools' "deep" mode.

### Implications for Architecture

- Agent count should err high — launch 5 searchers if 3 might suffice
- Source selection should be inclusive — check marginal sources too
- Verification should be redundant — multiple independent checks
- Output should be comprehensive — let the user skim if they want less
- Follow-up suggestions should be aggressive — "here's what we could research
  next"
