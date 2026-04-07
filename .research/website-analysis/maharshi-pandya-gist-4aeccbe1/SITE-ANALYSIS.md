# Contemplative Reasoning — Maharshi-Pandya's LLM Reasoning Prompt

**URL:**
https://gist.github.com/Maharshi-Pandya/4aeccbe1dbaa7f89c182bd65d2764203
**Author:** Maharshi-Pandya **Published:** 2025-01-07 **Scan:** Standard,
2026-04-07 **Fit:** park-for-later | Needs Work (45)

---

## 1. What's Relevant To Your Work

Honestly, not much that you don't already have — but there's one thread worth
pulling.

Your system already implements structured reasoning at a level this prompt can't
touch. Your convergence loops verify claims against reality. Your `/deep-plan`
breaks problems into categorized questions and builds decision records. Your
`/deep-research` dispatches parallel agents, runs contrarian challenges, and
does gap-pursuit verification. This gist asks an LLM to think hard in an
unstructured stream. You've moved past that.

**The one useful thread:** the "exploration over conclusion" principle. Your
brainstorm skill (Phase 1: divergent exploration) already embodies this, but
your other skills tend to be conclusion-oriented — they have phases that march
toward deliverables. There might be value in explicitly building "don't converge
yet" gates into skills that currently rush to structure. Not every phase of
reasoning benefits from structure. Sometimes the unstructured wandering IS the
value — it's where surprising connections emerge.

**Where this maps:**

- **Brainstorm skill** — already aligned (divergent exploration before
  convergence)
- **Convergence loops** — could benefit from a "minimum exploration" threshold
  before allowing convergence, similar to this prompt's 10,000-char minimum
- **T4 (Multi-layer memory)** — when deciding what to remember, unstructured
  exploration of "why does this matter" might surface better retention criteria
  than structured categorization

---

## 2. What This Site Understands

The gist understands one thing well: **forcing conclusions kills exploration.**
Most people use LLMs as answer machines — ask question, get answer. This prompt
inverts that by making the LLM's job to _not_ answer until it has explored
exhaustively. The `<contemplator>` block is essentially a "don't output yet"
holding pen.

The style guidelines (natural thought flow markers, progressive building) are a
decent taxonomy of how humans actually reason — starts tentative, builds
momentum, backtracks, reframes. It's a reasonable model of thinking-in-progress.

| Axis               | Band            | Notes                                              |
| ------------------ | --------------- | -------------------------------------------------- |
| Actionability      | Healthy (75)    | Copy-paste ready, works immediately                |
| Novelty            | Critical (35)   | Extended thinking is now native in most models     |
| Evidence quality   | Critical (15)   | Zero evidence this works better than default       |
| Technical depth    | Critical (30)   | Single system prompt, no architecture              |
| Recency            | Needs Work (40) | Jan 2025 — predates Claude's thinking improvements |
| Relevance to stack | Needs Work (55) | Claude already does this natively                  |
| Cross-ref density  | Critical (5)    | Zero external links                                |
| Synthesis quality  | Needs Work (45) | Decent compression of one idea                     |
| Ecosystem coverage | Critical (20)   | No awareness of existing tools/approaches          |
| Contrarian signal  | Needs Work (40) | Anti-rush-to-answer is mildly contrarian           |
| Teaching quality   | Healthy (65)    | Clear examples, good prompt structure              |
| Reproducibility    | Excellent (90)  | Literal copy-paste prompt                          |
| Strategic fit      | Needs Work (45) | Your approach is already more sophisticated        |

**Overall quality:** Needs Work (43) | **Personal fit:** Needs Work (45)

---

## 3. Voice and Editorial POV

The gist is written as a system prompt, not as an essay or explanation. There's
no framing of why this works, no comparison to alternatives, no discussion of
tradeoffs. It just IS — here's the prompt, use it.

This is both its strength (zero friction to use) and its weakness (no context
for understanding when it's appropriate). The author trusts the reader to figure
out applicability on their own.

The comments are more interesting than the gist itself — one commenter reports
ChatGPT flagged it as a policy violation (ironic), another spots a missing "not"
in the text, and several ask about response time impact. The author doesn't
engage with the comments, which suggests this was a "drop and walk away" post.

---

## 4. Where Your Approach Differs

**Fundamental divergence:**

- **This prompt is unstructured.** It says "think hard" but provides no
  framework for _how_ to think — no phases, no verification, no convergence
  criteria beyond "feels natural." Your skills decompose reasoning into named
  phases with explicit deliverables, agent dispatch, and verification loops. The
  difference is the gap between "try harder" and "try differently."

- **This prompt operates at the single-turn level.** It doesn't address what
  happens across turns, sessions, or agents. Your infrastructure operates at the
  _system_ level — 266 sessions of accumulated state, cross-session memory,
  multi-agent orchestration. This prompt is a single breath; your system is a
  respiratory system.

- **No tool integration.** The contemplative reasoning happens entirely in the
  LLM's head. Your approach sends agents to actually check things — Explore
  agents read code, deep-research agents search the web, code-reviewer agents
  validate implementations. Reasoning without grounding in evidence is just
  sophisticated guessing.

**Productive divergence:**

- **The "don't converge yet" principle is genuine.** Your convergence loops
  converge as soon as the tally passes. There might be cases where delaying
  convergence — forcing one more exploration pass even when the threshold is met
  — produces better results. This is testable.

---

## 5. The Challenge

The fundamental challenge with this gist is that it's solving a problem from
early 2025 that the model providers have largely addressed at the infrastructure
level. Claude's extended thinking, OpenAI's o-series reasoning models, and
Gemini's thinking mode all implement "think before answering" natively and more
effectively than a system prompt can.

The gist has 1,365 stars, which tells you how many people wanted this in
January 2025. But it's also a snapshot of a moment — the brief window when LLMs
could think harder if you asked them to but didn't do so by default. That window
has mostly closed.

For your purposes, the gist is a historical artifact that confirms you were
already on the right track with structured reasoning. It's not a source of new
techniques.

---

## 6. Knowledge Candidates

| ID  | What to Extract                                       | Type             | Confidence | Effort |
| --- | ----------------------------------------------------- | ---------------- | ---------- | ------ |
| K1  | Exploration-over-conclusion as skill design principle | design-principle | MEDIUM     | Low    |
| K2  | Contemplator tag pattern (historical reference)       | pattern          | LOW        | Low    |

---

## Engineer View

GitHub Gist platform — dimensions are platform-inherited.

| Dimension        | Band            | Notes                                                     |
| ---------------- | --------------- | --------------------------------------------------------- |
| Performance      | N/A             | GitHub Gist platform                                      |
| Security Headers | N/A             | GitHub platform                                           |
| Accessibility    | Healthy (60)    | Plain text file, no semantic structure beyond line breaks |
| SEO              | Needs Work (40) | Generic OG tags                                           |
| Technical Stack  | N/A             | GitHub Gist (plain text rendering)                        |
| Mobile Readiness | Healthy (70)    | GitHub responsive layout                                  |

---

## Metadata

- **7 findings** extracted (3 HIGH confidence, 1 MEDIUM, 3 absences)
- **2 knowledge candidates** ranked
- **0 external links**
- **6 absence patterns** identified
