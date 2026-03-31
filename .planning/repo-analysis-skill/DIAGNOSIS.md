# Diagnosis: Repo Analysis Skill Implementation

## ROADMAP Alignment

**Status:** New direction — not in current ROADMAP milestones. Aligns with
Tooling & Infrastructure (Meta P0) and Operational Visibility themes. This is a
developer tooling capability, not a SoNash product feature.

**Recommendation:** Proceed — this is a meta-tool that supports the project's
broader goals (dependency evaluation, competitive analysis, quality
benchmarking).

## Research Context

Deep-research completed this session (Session #250). 31 agents, 50 claims, 147
sources. Full output at `.research/repo-analysis-skill/RESEARCH_OUTPUT.md`.

Key research conclusions that constrain the plan:

- **Three modes:** Quick Scan (default, <30s, API-only) → Standard (~10min) →
  Deep (~20min)
- **Quick Scan is the DEFAULT** — not an option, the entry point
- **5-7 core tools** (scc, semgrep, lizard, jscpd, gitleaks, git-quick-stats)
- **Categorical scoring** (Critical/Needs Work/Healthy/Excellent), not numeric
  composites
- **gsd-codebase-mapper 4-axis model** as orchestration starting point
- **7 absence patterns** (Ghost Ship, Security Facade, Test Theater, etc.)
- **5-signal temporal fingerprint** (<30s extraction)
- **3-artifact output** (analysis.json, findings.jsonl, summary.md)
- **TDMS integration** — findings.jsonl format compatible with intake pipeline

## Relevant Existing Systems

### Skill Patterns to Follow

- **ecosystem-health** — closest model (multi-dimension scoring, composite
  health, JSONL persistence)
- **audit-comprehensive** — wave staging (4+3+2+1 agents), verification
  checkpoints
- **deep-research** — state file schema, agent spawn/track/resume pattern
- **code-reviewer** — analysis output format, severity classification

### Existing Infrastructure to Integrate

- **TDMS** — findings.jsonl → intake-audit.js pipeline (zero-transform if schema
  matches)
- **State files** — `.claude/state/repo-analysis.<slug>.state.json`
- **Research index** — `.research/research-index.jsonl` (already has this
  research indexed)
- **GSD agents** — `gsd-codebase-mapper` (4 axes: tech, arch, quality, concerns)

### Tool Availability (verified this session)

- scc, semgrep, lizard, jscpd, gitleaks: require install on both locales
- gh CLI: already installed
- OpenSSF Scorecard API, deps.dev API: no install needed (HTTP)
- git-quick-stats: requires install

## Reframe Check

**Is this task what it appears?** Yes — building a skill that, given a GitHub
URL, produces a structured health analysis. The research thoroughly validated
the approach, addressed contrarian challenges, and defined three clear modes.

The main risk is **scope creep** — the research identified 47 analysis
dimensions across 3 modes. The plan must define a phased implementation that
ships Quick Scan first (highest value, lowest effort), then Standard, then Deep.

## Claims [VERIFIED]

All claims below verified via deep-research verification agents (V1, V2) and
convergence loop (CL1):

- Tool stack exists and is actively maintained [V1]
- Internal skill/agent counts: 65 skills, 57 agents [V2]
- OpenSSF Scorecard API operational [V1]
- DORA 5th metric is Rework Rate [V1-CL1]
- Scoring bands NOT aligned with SonarQube (corrected in CL1)
