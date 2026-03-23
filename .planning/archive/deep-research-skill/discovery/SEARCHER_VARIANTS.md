# Searcher Variants Comparison

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Phase:** Discovery (distilled from Research phase)
**Source Reports:** CUSTOM_AGENT_DESIGN, SOURCE_REGISTRY_DESIGN, GAP_ANALYSIS, EXISTING_TOOLS_LANDSCAPE, DOMAIN_AGNOSTIC_DESIGN, SYNTHESIS
<!-- prettier-ignore-end -->

---

## Purpose

Should the searcher agent be a single generic agent or should there be
specialized variants (web-searcher, codebase-searcher, academic-searcher)? This
is Open Question #1 from the SYNTHESIS and has significant implications for
agent count, maintenance burden, and research quality.

---

## The Three Options

### Option A: Single Generic Searcher

One `deep-research-searcher.md` agent handles all research regardless of source
type. Tool selection and search strategy are driven by the orchestrator's
instructions at spawn time.

**Pros:**

- Minimal maintenance (one agent definition, ~500-700 lines)
- Consistent behavior across all invocations
- Simpler orchestrator logic (no variant routing)
- Matches the proven GSD pattern (`gsd-project-researcher` handles all source
  types)
- Lower total line count for the system

**Cons:**

- Agent definition becomes complex if it must handle web, codebase, and academic
  search strategies equally
- Tool declarations must include all tools even when most are unused per
  invocation
- Source hierarchy and verification protocol must be generic enough for all
  domains, potentially sacrificing depth in each
- Cannot optimize tool strategy for specific source types

**Estimated lines:** 500-700 per agent, 1 agent total

### Option B: Specialized Variants

Multiple searcher agent definitions, each optimized for a specific source type:

| Variant                              | Tools                                 | Specialty                                         |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------- |
| `deep-research-web-searcher.md`      | WebSearch, WebFetch                   | General web research, blog posts, docs, news      |
| `deep-research-codebase-searcher.md` | Read, Grep, Glob, Bash                | Local codebase patterns, existing implementations |
| `deep-research-academic-searcher.md` | WebSearch, WebFetch, Paper Search MCP | Academic papers, citations, systematic reviews    |
| `deep-research-docs-searcher.md`     | Context7, WebFetch                    | Official library/framework documentation          |

**Pros:**

- Each variant has optimized tool strategy for its source type
- Smaller, more focused agent definitions (easier to understand)
- Can assign different models per variant (Haiku for doc lookups, Sonnet for
  complex web research)
- Better source verification because each variant knows its source type's
  quality signals
- Enables parallel source-type research (web + codebase simultaneously)

**Cons:**

- 4 agent definitions to maintain (~300-500 lines each = 1,200-2,000 total)
- Orchestrator must route to correct variant(s) based on determination phase
- ~60-70% content overlap across variants (philosophy, output format, confidence
  levels, structured returns)
- More moving parts = more coordination failures (36.9% of multi-agent failures
  are coordination breakdowns per MAST study)
- Salesforce EDR uses this pattern (4 search types) but it is an enterprise
  system with dedicated engineering support

**Estimated lines:** 300-500 per agent, 4 agents = 1,200-2,000 total

### Option C: Generic + Spawn-Time Specialization (Recommended)

One `deep-research-searcher.md` agent with a modular tool strategy section. The
orchestrator passes a `search_profile` parameter at spawn time that activates
the relevant tool strategy subsection.

```
Spawning prompt includes:
  search_profile: "web" | "codebase" | "academic" | "docs"
  tools_available: [WebSearch, WebFetch]  # only tools for this profile
  source_hierarchy: [specific to this profile]
  verification_rules: [specific to this profile]
```

The agent definition contains all four tool strategies but activates only the
one matching its spawn-time profile. This is the pattern used by
`gsd-project- researcher` which has three research modes (Ecosystem,
Feasibility, Comparison) within a single agent definition.

**Pros:**

- Single agent to maintain
- Profile-specific behavior without separate agent files
- Orchestrator passes profile at spawn time -- simple routing
- Shared sections (philosophy, output format, confidence, structured returns)
  defined once
- Easy to add new profiles without new agent files
- Matches existing GSD research mode pattern

**Cons:**

- Agent definition is larger (~600-800 lines) because it contains multiple tool
  strategies
- All tools must be declared in frontmatter even if only subset used per
  invocation
- Adding a new profile requires editing the shared agent file (not isolated)

**Estimated lines:** 600-800 per agent, 1 agent total

---

## Comparison Matrix

| Criterion                        | A: Generic                                  | B: Specialized                   | C: Generic + Profiles                   |
| -------------------------------- | ------------------------------------------- | -------------------------------- | --------------------------------------- |
| **Maintenance burden**           | Low (1 file)                                | High (4 files)                   | Low-Medium (1 file)                     |
| **Tool strategy depth**          | Medium                                      | High                             | Medium-High                             |
| **DRY compliance**               | Good                                        | Poor (60-70% duplication)        | Good                                    |
| **Orchestrator complexity**      | Simple                                      | Complex (routing logic)          | Medium (profile param)                  |
| **Extension cost**               | Edit 1 file                                 | Create new file                  | Edit 1 file                             |
| **Existing precedent**           | GSD researchers (single agent, single mode) | Salesforce EDR (4 search agents) | GSD researchers (single agent, 3 modes) |
| **Total line count**             | 500-700                                     | 1,200-2,000                      | 600-800                                 |
| **Risk of coordination failure** | Low                                         | Medium-High                      | Low                                     |
| **P0 readiness**                 | Immediate                                   | Over-scoped                      | Immediate                               |

---

## Source-Specific Tool Strategies

Regardless of which option is chosen, the following tool strategies are needed:

### Web Research Profile

| Priority | Tool          | Usage                                             |
| -------- | ------------- | ------------------------------------------------- |
| 1        | WebSearch     | Initial discovery, landscape mapping              |
| 2        | WebFetch      | Deep-read specific pages, extract structured data |
| 3        | Training data | Fallback only, always marked [UNVERIFIED]         |

**Verification:** Cross-reference across 2+ independent sources. Check recency.
Prefer primary sources over secondary.

### Codebase Research Profile

| Priority | Tool                | Usage                            |
| -------- | ------------------- | -------------------------------- |
| 1        | Grep/Glob           | Pattern discovery, file location |
| 2        | Read                | Deep-read specific files         |
| 3        | Bash (ls, wc, etc.) | Structure analysis, metrics      |

**Verification:** Code exists on disk (filesystem is ground truth). Check git
log for recency. Match patterns against CLAUDE.md conventions.

### Documentation Profile

| Priority | Tool                          | Usage                                  |
| -------- | ----------------------------- | -------------------------------------- |
| 1        | Context7 MCP                  | Library/framework docs (highest trust) |
| 2        | WebFetch (official docs URLs) | Official documentation sites           |
| 3        | WebSearch                     | Fallback for undocumented features     |

**Verification:** Official source = HIGH confidence. Version-match against
project's package.json. Check for deprecation notices.

### Academic Research Profile

| Priority | Tool                      | Usage                             |
| -------- | ------------------------- | --------------------------------- |
| 1        | Paper Search MCP          | 20+ academic databases            |
| 2        | WebFetch (arxiv, scholar) | Specific paper retrieval          |
| 3        | WebSearch                 | Conference proceedings, preprints |

**Verification:** Peer-reviewed > preprint > blog. Check citation count. Check
for retractions. Follow citation chains.

---

## Recommendation

**Build Option C (Generic + Spawn-Time Profiles) for P0.**

Rationale:

1. Matches the GSD precedent of mode-based research agents
2. Single file to maintain, lowest DRY violation risk
3. Profiles can be added incrementally (web-only for P0, add codebase/docs/
   academic as P1/P2)
4. The orchestrator already needs to classify the query domain -- adding a
   profile parameter to the spawn prompt is trivial
5. If profiling proves insufficient for a specific source type, a dedicated
   variant can be extracted later without breaking the system

**P0 profiles to implement:** `web` (default), `docs` (Context7-first) **P1
profiles to add:** `codebase`, `academic`

---

## Open Questions

1. Should Context7 be a P0 dependency (activated in .mcp.json) or P1? It is the
   highest-confidence source for library docs but is currently in
   `.mcp.json.example` (not active).
2. For codebase research, should the searcher use the existing `Explore` agent
   instead of a codebase profile? The Explore agent already knows how to
   navigate unfamiliar code.
3. When a single research question requires multiple profiles (e.g., "How should
   we implement X?" needs both web research on patterns and codebase research on
   existing code), should the orchestrator spawn multiple searchers with
   different profiles, or should one searcher switch profiles mid-research?
