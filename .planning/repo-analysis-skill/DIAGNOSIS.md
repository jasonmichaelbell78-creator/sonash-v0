# Diagnosis: Repo Analysis Skill — Unified (Defensive + Value Extraction)

**Date:** 2026-04-01 **Task:** Build a `/repo-analysis` skill that analyzes
external GitHub repositories for both health assessment (defensive lens) and
value extraction (offensive lens), producing structured outputs integrated with
the SoNash ecosystem.

## ROADMAP Alignment

**Status:** New direction — not in current ROADMAP milestones. Aligns with
Tooling & Infrastructure (Meta P0) and Operational Visibility themes. This is a
developer tooling capability, not a SoNash product feature.

**Recommendation:** Proceed — this is a meta-tool that supports the project's
broader goals (dependency evaluation, competitive analysis, quality
benchmarking, pattern discovery, and code reuse assessment).

## Research Context

Two deep-research rounds completed:

1. **Defensive lens** (Session #250): 31 agents, 50 claims, 147 sources. Full
   output at `.research/repo-analysis-skill/RESEARCH_OUTPUT.md`. Covers health
   assessment, tool stack, pipeline architecture, scoring, absence patterns.

2. **Value extraction lens** (Session #250): 17 findings files, 89 HIGH
   confidence claims. Full output at
   `.research/repo-analysis-value-extraction/RESEARCH_OUTPUT.md`. Covers pattern
   extraction, repo discovery, portability assessment, AI-assisted analysis,
   internal capability delta.

### Key Combined Research Conclusions

**Architecture:**

- **Two intent modes:** Assess (health/risk) and Extract (patterns/value)
- **Three depth tiers:** Quick Scan (API-only, <30s) → Standard (clone + static)
  → Deep (12-month history + temporal)
- **Quick Scan is the DEFAULT** — answers 70-80% of dependency evaluation
  questions without a clone
- **4-tier clone hybrid:** API pre-flight → blobless partial clone → conditional
  12-month history → conditional full clone

**Tooling:**

- **5-7 core tools** (scc, semgrep, lizard, jscpd, gitleaks, git-quick-stats)
- **Tier 2 conditional** (knip, dependency-cruiser, vulture, ruff — by detected
  language)
- **Minimum viable stack** validated by contrarian challenge

**Scoring & Output:**

- **Categorical bands** (Critical/Needs Work/Healthy/Excellent) as primary
  display — not numeric composites (validated by contrarian: ±10-15 point
  confidence interval makes "74/100" false precision)
- **3-artifact output:** analysis.json, findings.jsonl (TDMS-compatible),
  summary.md
- **trends.jsonl** for multi-run comparison
- **7 absence patterns** (Ghost Ship, Test Theater, Security Facade, Borrowed
  Armor, Dependency Freeze, Lone Wolf, Silent Failure)
- **5-signal temporal fingerprint** (<30s extraction)

**Value Extraction:**

- **70% internal infrastructure reuse** — deep-research pipeline,
  gsd-codebase-mapper, explore agent, ecosystem-health scoring, TDMS conventions
- **6 new capabilities needed:** repo-discovery agent, portability-scoring
  agent, adaptation-guide-writer, value-findings JSONL + intake, external-repo
  domain config, survey/extraction mode switch
- **5-dimension portability rubric** (0-15 score): Dependency Profile, Coupling
  Profile, Configuration Surface, Cognitive Portability, Documentation Artifacts
- **Context quality > model capability** — cross-cutting finding from multiple
  independent sources

**Guard Rails:**

- Rate limit awareness (check `/rate_limit` before batches; abort if <200)
- Large repo safety (skip statistics >10k commits; handle 202 retries)
- Monorepo detection and sub-package analysis
- Home repo guard (redirect to `/audit-comprehensive`)
- Trivy supply chain attack awareness (CVE-2026-33634)

## Relevant Existing Systems

### Skill Patterns to Follow

| System                | Relationship                               | Pattern to Mirror                    |
| --------------------- | ------------------------------------------ | ------------------------------------ |
| `ecosystem-health`    | Closest model (scoring, dashboard, triage) | State persistence, Q&A triage loop   |
| `deep-research`       | Agent orchestration pattern                | Searcher/synthesizer, domain configs |
| `audit-comprehensive` | Wave staging                               | 4-concurrent-agent cap, checkpoints  |
| `code-reviewer`       | Analysis output format                     | Severity classification, categories  |

### Existing Infrastructure to Integrate

- **TDMS** — findings.jsonl → intake-audit.js pipeline (zero-transform if schema
  matches)
- **State files** — `.claude/state/repo-analysis.<slug>.state.json`
- **Research index** — `.research/research-index.jsonl`
- **GSD agents** — `gsd-codebase-mapper` (4 axes: tech, arch, quality, concerns)
- **Scoring lib** — `scripts/health/lib/scoring.js` (scoreMetric, computeGrade,
  sparkline, compositeScore, computeTrend)

### Tool Availability

- scc, semgrep, lizard, jscpd, gitleaks: require install on both locales
- gh CLI: already installed
- OpenSSF Scorecard API, deps.dev API: no install needed (HTTP)
- git-quick-stats: requires install
- Repomix: npm install (for value extraction compressed context)

## Reframe Check

**Is this task what it appears?** Yes — building a unified skill that, given a
GitHub URL, produces structured health analysis AND identifies extractable
patterns/value. The two research rounds validated both lenses independently.

**Scope risk:** The combined scope (defensive + offensive) across 3 depth tiers
could explode. The plan MUST define a phased implementation: Quick Scan first
(highest value, lowest effort), then Standard Assess, then Standard Extract,
then Deep. Value extraction phases (portability, adaptation recipes) are
progressive enhancements, not MVP.

**Reframe consideration:** The value-extraction lens is architecturally an
_extension_ of the defensive lens, not a parallel system. Both share: the same
clone, the same tool runs, the same dimension data. The extraction lens adds a
second _interpretation_ pass over the same data, plus new agents for
portability/adaptation. This means a single skill with two modes, not two
separate skills.

## Claims [VERIFIED]

All claims verified via deep-research verification agents (V1, V2) and
convergence loops (CL1):

- Tool stack exists and is actively maintained [V1]
- Internal skill/agent counts: 65 skills, 57 agents [V2]
- OpenSSF Scorecard API operational [V1]
- DORA 5th metric is Rework Rate [V1-CL1]
- Scoring bands NOT aligned with SonarQube (corrected in CL1)
- 70% internal reuse estimate validated with bounded risks [V1-VE, V2-VE]
- GitHub API rate limits and behavior documented accurately [V1-RD]
- Portability rubric dimensions independently evidence-backed [V1-PP]
