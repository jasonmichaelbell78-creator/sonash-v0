# Statusline Deep-Plan: DIAGNOSIS

**Date:** 2026-03-23 **Task:** Design and implement a custom Claude Code
statusline for SoNash

---

## ROADMAP Alignment

Not mentioned in ROADMAP.md explicitly, but SESSION_CONTEXT.md lists it as a
next action: "Deep-plan custom statusline — research at
`.research/custom-statusline/RESEARCH_OUTPUT.md`." **Aligned** — this is
sanctioned work.

## Prior Research

Exhaustive `/deep-research` completed earlier today (Session #234). Output at
`.research/custom-statusline/RESEARCH_OUTPUT.md` — 1,100 lines covering:

- 15+ third-party tools evaluated
- 8 visual layout patterns with ASCII mockups
- 9 implementation approaches benchmarked
- Full stdin JSON schema (v2.1.81)
- Windows compatibility status and workarounds
- 10 workflow-specific widget specifications
- 7 design principles from 15+ inspiration sources
- 3 recommended options (Conservative/Balanced/Ambitious)

## Current State

**Existing implementation:** `.claude/hooks/global/statusline.js` (119 lines,
Node.js)

- Renders: model name, git branch, current task, directory name, context gauge
- Context gauge: color-coded (green <50%, yellow <65%, orange <80%, red+skull
  > =80%)
- Invoked via: `bash .claude/hooks/ensure-fnm.sh node statusline.js`
- Performance: ~60-220ms (fnm wrapper adds 100-300ms overhead)
- Security: sanitizes all output (control chars, CSI/OSC escapes)

**Settings:** `.claude/settings.json` line 165-168

**What works well:** Context gauge, sanitization, Windows compatibility

**What's missing per research:** Cost tracking, rate limits, predictive
compaction ("~N msgs left"), hook health, health grade, debt S0, agent status,
anomaly-driven layout, width-aware degradation

## Key Decisions This Plan Must Make

1. **Implementation approach** — enhance existing Node.js vs Go binary vs
   Bash+jq vs third-party tool
2. **Layout philosophy** — always-show-everything vs anomaly-driven (quiet when
   healthy)
3. **Widget set** — which of the 10 researched widgets to include
4. **Visual design** — single-line vs multi-line, icons vs text, color scheme
5. **Performance target** — acceptable render time budget
6. **Width handling** — fixed layout vs progressive degradation
7. **Configuration** — hardcoded vs TOML/JSON config file
8. **Non-dev widgets** — calendar, break timer, session duration
9. **Starship interaction** — if/when Starship is installed, what becomes
   redundant
10. **Phasing** — ship incrementally or build full solution

## Reframe Check

The task is exactly what it appears: design and implement a statusline upgrade.
No reframe needed.
