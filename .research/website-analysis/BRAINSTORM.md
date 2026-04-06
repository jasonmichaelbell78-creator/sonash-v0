# Brainstorm: Website Analysis

**Date:** 2026-04-05 **Status:** Complete **Routing:** deep-research (Creator
lens tuning + tool landscape) then deep-plan

## Problem Space

Like `/repo-analysis` but for websites. Repos have code as primary content and
bounded structure (clone it, read it). Websites have text/media/links as primary
content and unbounded structure (crawl it, render it, follow it). The existing
repo-analysis v3.0 Creator View surfaces what a repo KNOWS and challenges how it
compares to our work. The same lens applied to websites would surface what a
site KNOWS, ARGUES, and LINKS TO — plus structural meta-patterns (organization,
navigation, information architecture).

Critically: a v4.0 gap analysis of repo-analysis (conducted in another worktree)
identified 10 gaps in the Creator View, most of which are MORE naturally
addressed at the website level than the repo level. Websites are link-native,
voice-native, perspective-native. The "retrofits" repo-analysis needs are
"foundations" website-analysis starts with.

**Seed origin:** Worktree `webcrawler` was already named, signaling prior
intent. The user's vision is a Creator-first analysis tool that doesn't miss
opportunities — the same design philosophy as repo-analysis v4.0's gap closure,
applied to the web.

**Consumers:** Jason (primary), Claude Code, JASON-OS, SoNash.

## Anti-Goals

- **No whole-site mirroring** — analyze, don't archive (that's archivebox's job)
- **No robots.txt / ToS violations** — pre-flight gate required, hard-block or
  warn, never silently bypass
- **No clinical output** — Creator View is conversational, same as repo-analysis
- **No illegal content archival** — respect copyright, cache only for analysis
- **No topic-seeded corpus mode** — removed during convergence. Cross-site
  synthesis happens via link-mining from analyzed URLs, not search-based
  discovery
- **No unlimited storage growth** — per-analysis size cap, rotation policy TBD

## Landscape

### Existing systems (verified)

- **`/repo-analysis` v3.0** — dual-lens (Creator + Engineer), 3 tiers
  (Quick/Standard/Deep), outputs to `.research/repo-analysis/<slug>/`. Schema:
  analysis.json, findings.jsonl, value-map.json, summary.md, repomix-output.txt.
  v4.0 gap closure in progress in another worktree.
- **`/webapp-testing`** — Playwright MCP-based testing of OUR webapp. Different
  purpose, no conflict. Demonstrates Playwright MCP is available.
- **`.research/` directory** — 13 existing research topics, none web-related.
  Clean namespace for `website-analysis/`.
- **JASON-OS** — 17-domain research roadmap. Domain 02a (External Adoption
  Scouting) is active, powered by repo-analysis. Website-analysis is a natural
  sibling for Domain 02a expansion.
- **ROADMAP.md** — no website-analysis feature planned. Net-new. No conflict.

### Available tools (verified)

| Tool            | Status      | Purpose                               |
| --------------- | ----------- | ------------------------------------- |
| `curl`          | Available   | Raw HTTP fetch                        |
| `pandoc`        | Available   | HTML to Markdown conversion           |
| `WebFetch`      | Native tool | Clean URL fetch                       |
| `WebSearch`     | Native tool | Web search                            |
| Playwright MCP  | Available   | Full browser automation, JS rendering |
| context7        | Available   | Library documentation                 |
| Memory MCP      | Available   | Cross-session persistence             |
| Episodic Memory | Available   | Conversation history search           |

### Not available (may need installation)

| Tool                       | Purpose                      | Decision                   |
| -------------------------- | ---------------------------- | -------------------------- |
| `trafilatura` (Python)     | Readable content extraction  | Research needed            |
| `readability-cli`          | Mozilla Readability for CLI  | Research needed            |
| `playwright` (npm)         | Local Playwright (vs MCP)    | Playwright MCP may suffice |
| NotebookLM integration     | External storage + review    | Research needed            |
| Obsidian vault integration | External graph-based storage | Research needed            |

## repo-analysis v4.0 Gap Reframe

The following gaps identified in repo-analysis v4.0 planning are MORE naturally
addressed at the website level. These inform the skill's foundation rather than
being retrofitted.

### Tier 1 — Direct opportunity misses (baked in from day 1)

| Gap                                      | Repo-analysis status          | Website-analysis status                     |
| ---------------------------------------- | ----------------------------- | ------------------------------------------- |
| **G1** Link/reference recursion          | Retrofit (awesome-lists)      | **Core** — websites are link graphs         |
| **G8** Personal-fit vs objective-fit     | Subtle lost-candidate problem | Applies 1:1, two-axis scoring               |
| **G9** Anti-ideas / cautionary learnings | Missing section               | First-class Creator View section            |
| **G10** Long-tail bias                   | Health scoring penalty        | New bias axis: SEO/traffic/design ≠ quality |

### Tier 2 — Cross-session compounding (baked in from day 1)

| Gap                                   | Repo-analysis status   | Website-analysis status                         |
| ------------------------------------- | ---------------------- | ----------------------------------------------- |
| **G2** Cross-site synthesis           | Emerges across N repos | **Core** — link-mining-driven synthesis         |
| **G5** Ecosystem meta-patterns        | Emerges across N repos | Can emerge within a single site                 |
| **G7** "Read this next" reading chain | Post-hoc               | **Core** — Expedition mode IS the reading chain |

### Tier 3 — Named but lower priority

| Gap                                             | Notes                                      |
| ----------------------------------------------- | ------------------------------------------ |
| **G3** Recency-weighted home context            | Same as repo-analysis; nice-to-have        |
| **G4** Knowledge-gap detection (negative space) | Applies; can be a Creator View subsection  |
| **G6** Mental-model-shift tracking              | Applies; deferred to cross-tool meta-layer |

## Directions Explored

### Direction A: URL-native mirror with v4.0 built-in

**Vision:** One URL in, three tiers out. Quick Scan (fetch + classify), Standard
(crawl + analyze), Deep (+ link mining + temporal). Dual-lens Creator +
Engineer. All v4.0 gaps baked in. **Strengths:** Closest to proven pattern.
Schema parity. Fast to build. **Weaknesses:** Single-unit thinking. Misses
page-only and expedition cases. **Assumptions:** Sites are bounded like repos.
(Partly true, not always.) **Feasibility:** High.

### Direction B: Topic-oriented corpus analysis (REJECTED)

**Vision:** Topic in, multi-site synthesis out. WebSearch-driven site discovery.
**Strengths:** Cross-site synthesis is a creator superpower. Natural G2/G5 home.
**Weaknesses:** Conflicts with URL entry. Search-based discovery is SEO-biased.
Storage shape diverges from other modes. **Assumptions:** Topic discovery via
search is good enough. (Weak.) **Feasibility:** Medium. **Rejection rationale:**
URL-only entry is the design constraint. Cross-site synthesis is achieved
through link-mining from analyzed URLs instead.

### Direction C: Expedition / reading-chain mode

**Vision:** Seed URL + human-in-the-loop link traversal. Surfaces 3-5 most
promising outbound links with Creator scoring, user picks, recurse until budget
exhausted. Output is a tree with value judgments at each node. **Strengths:**
Matches how humans read the web. Native G1 + G7. **Weaknesses:** Long-running,
compaction risk, tree-shaped state. Interactive by design (slow, can't
auto-run). **Assumptions:** User wants to drive the walk. **Feasibility:**
Medium.

### Direction D: Thin extractor + external brain (DEFERRED)

**Vision:** Minimal in-conversation processing. Extract, clean, tag, push to
Obsidian/NotebookLM/vault. Claude queries the store later. **Strengths:** Scales
infinitely. Delegates review to purpose-built tools. **Weaknesses:** Hard
dependency on external tool setup. Claude can't query NotebookLM mid-analysis.
Violates "works here first." **Assumptions:** External stores are set up. (Not
yet.) **Feasibility:** Low now. High later. **Deferral rationale:** Becomes a
routing option after deep-research determines the right external store shape.

### Direction E: Hybrid modal skill (evolved into chosen direction)

**Vision:** Single skill, mode detected from Quick Scan classification + user
choice via routing menu. All modes share infrastructure. **Strengths:** Serves
all units from one entry point. Matches user's "initial analysis suggests path"
preference. **Weaknesses:** 4 modes x multiple tiers = large surface area.
Schema polymorphism. Harder to test. **Assumptions:** Classifier can reliably
detect site type from Quick Scan. **Feasibility:** Medium-high.

## Contrarian Assessment

### Front-loaded mode selection kills the 80% case

Most invocations want to analyze a single URL. Putting a "what mode?" decision
before any analysis is a tax on the common case. Resolution: page-first
invocation with escalation via routing menu, not upfront mode selection. User
confirmed this design.

### Expedition mode could overwhelm the skill

Tree-shaped state, interactive UX, compaction risk — all structurally different
from Page/Site. Mashing them together forces polymorphism that makes both worse.
Resolution: user explicitly rejected separating expedition into its own skill.
Accepted trade-off: the skill has more surface area but all modes share the
fetcher and Creator View lens. Mitigation through shared infrastructure + per-
mode state isolation.

### Cross-site synthesis without topic entry is weaker

Topic-seeded corpus analysis would produce stronger cross-site synthesis than
link-mining-driven synthesis, because it can discover sites the user doesn't
know about. Resolution: user rejected corpus mode and the URL-only entry
constraint is non-negotiable. Link-mining synthesis is "synthesis of what we
find" not "synthesis of what's out there" — accepted trade-off. Cross-site
synthesis still adds value within the link graph reachable from the seed URL.

### Creator View lens may not transfer cleanly to websites

Repo Creator View asks "what does this repo KNOW?" Websites have additional
value axes: voice, perspective, argument, information architecture, positioning.
The 5 repo sections may need a 6th (Voice/POV) or more. Resolution: Creator lens
tuning routed to deep-research before deep-plan. Not guessed.

### Pre-flight gate is a new, untested phase

Repos are public code with clear licensing. Websites have robots.txt, ToS,
paywalls, auth walls, Cloudflare, and legal ambiguity. A compliance gate doesn't
exist in repo-analysis and introduces a new failure mode (false positives that
block analysis of analyzable sites). Mitigation: gate warns rather than hard-
blocks where possible, with explicit override option.

## Evaluation Summary

| Direction          | Strengths                     | Weaknesses                 | Feasibility | Outcome                                       |
| ------------------ | ----------------------------- | -------------------------- | ----------- | --------------------------------------------- |
| A (URL mirror)     | Proven pattern, schema parity | Single-unit only           | High        | Absorbed into hybrid                          |
| B (Corpus)         | Cross-site synthesis          | Conflicts with URL entry   | Medium      | **Rejected**                                  |
| C (Expedition)     | Matches human web-reading     | Complex state, compaction  | Medium      | **Included** as first-class mode              |
| D (External brain) | Scales infinitely             | Hard dependency, not local | Low now     | **Deferred** to routing option after research |
| E (Hybrid)         | All units, shared infra       | Surface area, polymorphism | Medium-high | **Evolved** into chosen direction             |

## Chosen Direction

**Direction:** Hybrid (Page + Site + Expedition + Cross-site) — evolved from
Direction E with A's page-first UX and C's expedition as first-class mode.

**Rationale:**

1. Page-first invocation removes friction on the 80% case while routing menu
   preserves full access to all modes when the classifier surfaces opportunity.
2. Expedition is first-class because it's the mode that most closely matches how
   humans read the web, and G1/G7 (link recursion, reading chain) are the whole
   reason we started this brainstorm.
3. Cross-site synthesis survives as link-mining-driven (not topic-seeded),
   respecting the URL-only entry constraint while keeping G2/G5 alive.
4. Creator lens tuning acknowledged as genuinely unsolved, routed to
   deep-research. Voice/POV is a starting hypothesis, not a commitment.
5. Pre-flight gate is a new first-class phase because websites have
   legal/technical gates repos don't.
6. No MVP posture. Full build with skill-audit + test + retest as natural
   follow-ups.

**Skill flow:**

```
INVOKE      /website-analysis <url>
PRE-FLIGHT  Legal/technical gates — robots.txt, ToS signals, auth walls, rate limits
PHASE 0     Quick Scan — Page-first fetch + clean extract + classification (<45s)
              Output: site type, link-density profile, JS-requirement, size estimate,
              Creator lens preview
GATE        Routing Menu — User chooses mode based on Quick Scan findings
PHASE 1     Page Mode — Deep Creator + Engineer analysis of THIS page
PHASE 2     Site Mode — Bounded crawl of same-domain pages (page cap, respects robots)
PHASE 3     Expedition — Interactive outbound-link walk, tree-shaped, user-in-the-loop
PHASE 4     Cross-Site — Link-mining-driven synthesis across discovered linked sites
PHASE 5     Creator View — Standard sections + website-specific sections (tuned via research)
PHASE 6     Engineer View — Website-specific dimensions
PHASE 7     Value Map — Pattern + Knowledge + Anti-idea + Link candidates
ROUTING     Final Menu — Extract, Export, Memory, Expedition continuation, Deep-plan, TDMS, Done
```

## Open Questions

### Must resolve before deep-plan

1. **Creator View website-specific sections.** What sections beyond the 5 repo
   sections? Voice/POV is a hypothesis. What other value axes do websites have?
2. **HTML-to-clean-content extraction stack.** trafilatura vs
   mozilla-readability vs pandoc vs other? Which handles JS-rendered content?
   Preserves structure?
3. **JS rendering escalation policy.** curl → WebFetch → Playwright MCP. What
   signals trigger escalation? Does Playwright MCP handle Cloudflare/captchas?
4. **Link-mining scoring algorithm.** How to rank outbound links for expedition
   "most promising" surfacing.
5. **Cross-site trigger threshold.** What counts as "high-link-density" that
   auto-suggests cross-site synthesis?
6. **Robots.txt / ToS pre-flight policy.** Hard-block vs warn. ToS detection.
7. **External-store research.** Obsidian, NotebookLM, SQLite, markdown vault.
   What integration shape works for "Claude writes, later Claude reads"?

### Can resolve during deep-plan

8. **Storage schema polymorphism** across 4 modes.
9. **State file shape per mode** — one file or multiple? Resume semantics.
10. **Anti-ideas section materialization** for websites.
11. **Personal-fit vs objective-fit separation (G8)** — output shape.
12. **Long-tail bias mitigation (G10)** — website-specific scoring.
13. **Slug generation from URL** — domain-only? Domain + path hash?
14. **Absence patterns for websites** — equivalents of SOLO_MAINTAINER etc.
15. **Re-analysis / freshness** — cache policy, refetch vs resume.
16. **Integration with repo-analysis value-map** — shared pool or separate?
17. **Invocation tracking + retro hooks** — same pattern or different?
18. **Skill-audit criteria** — what does "good" look like for audit pass?

## Routing

**Next:** `/deep-research` for open questions 1-7 (must-resolve-before-deep-plan
items), then `/deep-plan` for implementation.

**Deep-research sub-questions:**

- Q1: "What value axes do websites have that GitHub repositories don't? How
  should a Creator View lens be tuned for website analysis vs repo analysis?"
- Q2: "HTML to clean-content extraction tools (trafilatura, readability, pandoc,
  Playwright) — capabilities, trade-offs, JS rendering support, structure
  preservation"
- Q3: "JS rendering detection and escalation — when does a web page need a
  headless browser vs static fetch? How does Playwright MCP handle bot
  protection?"
- Q4: "Link relevance scoring for web content — how to rank outbound links by
  potential value for a creator analyzing a page"
- Q5: "Cross-site synthesis thresholds — what heuristics identify high-link-
  density environments (awesome-lists, registries, resource hubs)?"
- Q6: "Website compliance gates — robots.txt parsing, ToS detection, legal
  considerations for AI-driven web analysis"
- Q7: "External knowledge stores for AI-generated analysis — Obsidian,
  NotebookLM, SQLite, markdown vaults. Integration patterns for 'Claude writes,
  later Claude reads.'"

**Deep-plan input:** This BRAINSTORM.md + deep-research findings.
