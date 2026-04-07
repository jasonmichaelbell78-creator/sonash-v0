# LLM Wiki — Karpathy's Knowledge Base Pattern

**URL:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
**Author:** Andrej Karpathy **Published:** 2026-04-07 (today) **Scan:**
Standard, 2026-04-07 **Fit:** active-sprint | Excellent (88)

---

## 1. What's Relevant To Your Work

This gist describes a pattern you've already built — and that's what makes it
valuable. Not because you need the idea (you have it), but because Karpathy's
framing crystallizes the _why_ behind what you've been doing across 266 sessions
in a way that could inform how you package it.

**Direct mappings to your current work:**

- **T4 (Multi-layer memory):** Karpathy's "wiki layer" between raw sources and
  the user is almost exactly what your memory research (128 claims, 40 agents)
  concluded — enhance the existing autoMemoryDirectory, don't replace it. His
  architecture validates your research direction.

- **T16 (JASON-OS):** The entire gist is describing what you're trying to
  extract and make portable. His three-layer architecture (sources / wiki /
  schema) maps to your `.research/` (sources), `docs/` + `MEMORY.md` + indexes
  (wiki), and `CLAUDE.md` + skills (schema). The extraction strategy for
  JASON-OS could use his framing as a communication device.

- **T24 (Synthesis adoption):** His "ingest" operation is what `/repo-analysis`
  and `/website-analysis` do. His "query" is what `/repo-synthesis` and
  `/website-synthesis` do. His "lint" maps to your orphan detection, `/alerts`,
  and health scripts. The synthesis adoption skill could literally implement his
  operational triad.

- **research-index.jsonl** is his `index.md`. **SESSION_HISTORY.md** is his
  `log.md`. **CLAUDE.md** is his "schema." You already have these; the question
  is whether they're wired together the way his pattern suggests they should be.

**The one thing you don't have that he calls out:** filing good answers back
into the wiki as new pages. Your `/deep-research` outputs go to `.research/` and
stay there. Your `/brainstorm` outputs go to `.research/` or `.planning/`. These
are archived but rarely _integrated_ back into the active knowledge layer.
They're raw research, not synthesized wiki pages. This is the gap T24 (synthesis
adoption) should close.

---

## 2. What This Site Understands

Karpathy's core insight is deceptively simple: **the bottleneck in personal
knowledge management is bookkeeping, not thinking.** Humans abandon wikis not
because they stop caring, but because the maintenance cost — updating
cross-references, flagging contradictions, keeping summaries current — grows
faster than the value. LLMs collapse that cost to near-zero.

His value axes, as I'd score them:

| Axis               | Band            | Notes                                                   |
| ------------------ | --------------- | ------------------------------------------------------- |
| Actionability      | Excellent (88)  | Deliberately abstract — meant to be instantiated        |
| Novelty            | Healthy (62)    | The pattern isn't new; the LLM-as-maintainer framing is |
| Evidence quality   | Needs Work (55) | Personal experience only, no benchmarks                 |
| Technical depth    | Needs Work (45) | Intentionally shallow — idea file, not implementation   |
| Recency            | Excellent (100) | Published today                                         |
| Relevance to stack | Excellent (92)  | Explicitly mentions Claude Code, CLAUDE.md              |
| Cross-ref density  | Critical (25)   | Only 2 external links in the content                    |
| Synthesis quality  | Excellent (82)  | Elegant compression of a complex pattern                |
| Ecosystem coverage | Healthy (60)    | Obsidian-centric, acknowledges alternatives             |
| Contrarian signal  | Healthy (70)    | Anti-RAG position is genuinely contrarian               |
| Teaching quality   | Excellent (90)  | Clear progressive disclosure, good examples             |
| Reproducibility    | Excellent (85)  | "Copy paste to your LLM agent" design                   |
| Strategic fit      | Excellent (95)  | Directly maps to T4, T16, T24                           |

**Overall quality:** Healthy (73) | **Personal fit:** Excellent (88)

---

## 3. Voice and Editorial POV

Karpathy writes as a practitioner sharing a pattern he uses daily, not as
someone selling a product. The tone is confident but deliberately open-ended —
"pick what's useful, ignore what isn't." He trusts the reader (and the reader's
LLM) to instantiate the specifics.

The editorial stance is anti-RAG: he positions the persistent wiki as
fundamentally superior to retrieve-and-generate approaches, but does so by
explaining _why_ rather than attacking alternatives. The Vannevar Bush reference
at the end is a nice touch — it frames the pattern as the realization of a
70-year-old vision rather than a new invention.

The document is designed to be an LLM prompt as much as a human-readable essay.
That's a deliberate choice: the "Note" section makes clear this is meant to be
copy-pasted into an agent session and collaboratively instantiated.

---

## 4. Where Your Approach Differs

**Productive divergences (both approaches valid):**

- **Karpathy separates wiki from schema.** Your CLAUDE.md IS both the schema and
  part of the knowledge base. Your skills, agents, and hooks are executable
  schema — not just configuration but behavior. His model is simpler; yours is
  more powerful.

- **He assumes one LLM session at a time.** You run 266 sessions with
  compaction, cross-session state, and multi-locale considerations. Your
  infrastructure for session continuity (SESSION_CONTEXT.md, `/checkpoint`,
  `/session-begin`, `/session-end`) is a whole layer his pattern doesn't
  address.

- **His lint is manual ("periodically ask the LLM").** Your lint is automated
  and continuous — 14 pre-commit checks, 10 health scripts, `/alerts`, orphan
  detection, review lifecycle. This is a major advancement over his model.

**Fundamental divergence (worth examining):**

- **He keeps raw sources immutable.** You don't have a clear "raw sources"
  boundary — `.research/` contains both raw outputs (findings, claims) and
  synthesized artifacts (RESEARCH_OUTPUT.md). The boundary between "source of
  truth" and "LLM-generated synthesis" is blurry in your system. His
  architecture suggests this matters.

---

## 5. The Challenge

The gist is intentionally abstract — Karpathy says so explicitly. This is both
its strength (universal applicability) and its limitation (no treatment of the
hard problems). The hard problems are the ones you've already encountered:

- **Context window limits.** What happens when the wiki + index exceed the LLM's
  context? He mentions qmd for search but doesn't discuss the fundamental
  tension between "read the wiki" and "the wiki doesn't fit in context."

- **Contradiction resolution at scale.** Lint catches contradictions, but who
  resolves them? At 100 sources this is manageable. At 1000, contradiction
  resolution becomes a research problem in itself.

- **Multi-session coherence.** His pattern assumes the LLM remembers the wiki
  conventions session to session. In practice (as you've learned across 266
  sessions), this requires explicit infrastructure — CLAUDE.md, skills,
  behavioral guardrails, state files.

None of these invalidate the pattern. They're the implementation details that
emerge when you actually build it — which you have.

---

## 6. Knowledge Candidates

| ID  | What to Extract                                              | Type                   | Confidence | Effort |
| --- | ------------------------------------------------------------ | ---------------------- | ---------- | ------ |
| K1  | Three-layer architecture as communication frame for JASON-OS | architecture-pattern   | HIGH       | Low    |
| K2  | Ingest-Query-Lint triad mapped to existing skills            | workflow-pattern       | HIGH       | Medium |
| K3  | Answers-compound-into-wiki principle for T24                 | design-principle       | HIGH       | Low    |
| K4  | Index + Log dual navigation comparison                       | implementation-pattern | HIGH       | Low    |
| K5  | qmd local search tool evaluation                             | tool                   | MEDIUM     | Low    |

---

## Engineer View

This is a GitHub Gist (single markdown file), so traditional web engineering
dimensions are platform-inherited rather than author-controlled.

| Dimension        | Band            | Notes                                                                                  |
| ---------------- | --------------- | -------------------------------------------------------------------------------------- |
| Performance      | N/A             | GitHub Gist platform — not author-controlled                                           |
| Security Headers | N/A             | GitHub platform                                                                        |
| Accessibility    | Healthy (65)    | Semantic markdown, good heading hierarchy, no images requiring alt text                |
| SEO              | Needs Work (40) | Generic OG tags ("llm-wiki. GitHub Gist: instantly share code..."), no structured data |
| Technical Stack  | N/A             | GitHub Gist (Markdown rendering)                                                       |
| Mobile Readiness | Healthy (70)    | GitHub responsive layout, readable on mobile                                           |

The engineering story here is trivial — it's a markdown file on GitHub. The
value is entirely in the content, not the delivery mechanism.

---

## Metadata

- **10 findings** extracted (8 HIGH confidence, 2 MEDIUM)
- **5 knowledge candidates** ranked
- **3 external links** scored
- **6 absence patterns** identified
- **0 tables** in source content
- **5 code blocks** (examples only)
