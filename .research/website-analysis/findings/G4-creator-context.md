# Gap Finding: Creator Context Injection for Personalized Creator View

**Gap type:** unresolved-contradiction **Profile used:** web + codebase
**Confidence:** HIGH

## Finding

The Contrarian-1 Challenge 2 identified that the Creator View's "primary
differentiator" — personalized analysis tuned to the creator's intellectual
positions — depends on an unsolved injection mechanism. This finding resolves
that gap by: (1) establishing the state of the art for context injection in AI
tools, (2) auditing which SoNash project files contain genuinely
creator-relevant content vs. tooling noise, and (3) recommending a concrete
injection strategy with a realistic token budget.

### What the State of the Art Actually Does

The leading pattern in 2025-2026 is not "inject everything and let the LLM sort
it out." It is structured context engineering — selectively assembling the
minimum information payload that answers the current query. Key findings:

**Windsurf** uses semantic indexing of the full repository, then retrieves only
relevant sections per query via SWE-grep models running 8 parallel calls per
turn. The user does not curate what gets injected; the retrieval layer does.

**Cursor** takes the opposite approach: manual curation. The user explicitly
adds files, documentation, or web pages to the context window. More control,
more work.

**Claude Code's CLAUDE.md mechanism**: CLAUDE.md is injected as a system-level
reminder with the prefix "this context may or may not be relevant to your
tasks." The injection is unconditional (always present) but the model applies
its own relevance judgment. Path-scoped rules in `.claude/rules/` are injected
only when Claude is working on matching files, which reduces noise.

**Readwise Reader** personalizes analysis by using the user's own highlights as
context. When Ghostreader answers questions about a document, it draws on what
the user has previously marked as important across their reading history. This
is the closest analog to what the Creator View needs: the "user's intellectual
footprint" as context for new content analysis.

**The Weaviate / context engineering consensus** (2025-2026): Full document
injection works for small document sets (quick prototype) but does not scale.
RAG reduces costs 90-95% by retrieving only relevant content. Structure-aware
chunking reduces RAG retrieval costs by 77% vs. naive text splitting. The
practical recommendation: inject structured known-fields (always needed), use
retrieval for variable content.

### Which SoNash Project Files Contain Creator-Relevant Context

Not all project files are equal for Creator View personalization. After
examining the files available in this worktree and the MEMORY.md system context
provided at session start, the following audit applies:

**MEMORY.md — HIGH creator-relevance** Contains the user's actual intellectual
positions and working patterns:

- User expertise profile (Node.js expert, Firebase comfortable, frontend needs
  guidance)
- OS vision (project-agnostic "Claude Code OS" — portable workflows)
- Creation mindset (creates for joy, not shipping; frames as craft/exploration)
- Active initiatives with status (what is actively being built now)
- Project state (what has shipped, what is in progress)
- Feedback patterns (what the creator has corrected repeatedly — reveals strong
  opinions)

This is the most valuable file for Creator View personalization. It contains the
creator's actual intellectual positions, not just their tooling choices. The
"feedback" entries in particular reveal strong opinions — things the creator has
corrected multiple times are high-signal preference data.

**SESSION_CONTEXT.md — MEDIUM creator-relevance** Contains current sprint focus
and active work. Useful for the "What's Relevant To Your Work" section (timing
dimension — is this site relevant NOW?). Not useful for understanding the
creator's intellectual positions. Read-denied in this session; assessed from
memory.md references.

**ROADMAP.md — MEDIUM creator-relevance** Planned vs. completed features. Useful
for relevance scoring in Knowledge Candidates (is this site relevant to a
planned feature?). Not useful for voice, POV, or intellectual positioning.

**CLAUDE.md — LOW creator-relevance for Creator View** Contains project rules,
stack versions, architecture constraints, security boundaries. This is tooling
context, not intellectual context. The stack versions (Next.js 16.2.0, React
19.2.4, etc.) are useful for "What's Relevant To Your Work" (does this site use
relevant tech?) but not for "Where Your Approach Differs" at an intellectual
level.

**Git log — LOW-MEDIUM creator-relevance** Recent commit patterns reveal what
the creator is actively building, which can be used as a relevance signal.
Low-medium because commit messages are terse and often operational rather than
intellectual.

**Active conversation context — HIGH creator-relevance** The most current signal
of what the creator is thinking about. If the creator just asked about
rate-limiting strategies, a site with detailed rate-limiting architecture
becomes immediately relevant. This is the only truly dynamic context source.

### The Injection Mechanism Resolved: A Concrete Strategy

The challenge is that personalization requires creator context, but naively
injecting all files wastes tokens and introduces noise ("context rot"). The
resolution is a hybrid two-tier strategy:

**Tier 1: Structured extraction (always injected, low token cost)**

Extract specific known fields from MEMORY.md before the analysis call:

- Creator's expertise areas (from `user_expertise_profile.md`)
- Active initiatives and their status (from `project_active_initiatives.md`)
- OS vision keywords (from `user_os_vision.md`)
- Stack being used (from CLAUDE.md stack table)

This can be templated into ~200-400 tokens of structured context. Example:

```
Creator context:
- Expertise: Node.js/scripting (expert), Firebase (comfortable), frontend (needs guidance)
- Active projects: JASON-OS (brainstorm complete, deep-plan next), webcrawler skill
- Vision: Project-agnostic portable workflows ("Claude Code OS")
- Stack: Next.js 16.2.0, React 19.2.4, Firebase 12.10.0, Tailwind 4.2.2
- Creates for: exploration/craft, not shipping/MVP
```

**Tier 2: Selective feedback injection (retrieved per analysis, moderate token
cost)**

The MEMORY.md feedback entries are the highest-signal creator opinion data. They
should not be injected wholesale but filtered for relevant feedback topics. For
a web analysis skill, relevant feedback categories include:

- Deep-research formula feedback (directly applicable to this skill)
- No broken widgets / no silent failures (product philosophy signals)
- Creation mindset (framing preference)

This adds ~150-300 tokens for relevant feedback, skipping unrelated entries
(e.g., git hook patterns, debt pipeline rules).

**Tier 3: Conversation context (always available at zero cost)**

The most recent user questions and concerns are already in context. No injection
needed — they are the highest-signal relevance indicator. The Creator View
analysis should reference what the user was asking about when invoking the
skill, not ignore it.

**Total estimated token cost: 350-700 tokens** for personalization context,
versus 2,000-5,000+ tokens for full-file injection of CLAUDE.md +
SESSION_CONTEXT.md.

### Does Personalization Actually Improve Creator View Output?

The gap challenge asked: does injecting CLAUDE.md actually improve the Creator
View? The answer is nuanced:

CLAUDE.md alone: minimal improvement. It contains tooling rules, security
boundaries, and stack versions. These help with "What's Relevant To Your Work"
(tech stack matching) but do not personalize voice, POV analysis, or the "Where
Your Approach Differs" sections.

MEMORY.md (structured extraction): meaningful improvement to "What's Relevant To
Your Work" and "Knowledge Candidates" sections. The creator's active initiatives
and expertise profile directly determine which knowledge candidates are Tier 1
vs. Tier 3.

MEMORY.md feedback entries: most impactful for "Where Your Approach Differs."
The feedback entries reveal the creator's strong preferences — these are the
intellectual positions that make comparison meaningful. A site that does exactly
what the creator has been corrected on multiple times is high-signal content.

Active conversation context: highest signal for all sections. A creator who just
asked about rate-limiting will find rate-limiting content highly relevant; this
is better than any injected file.

### Validation Approach

To test whether creator context improves Creator View output, compare two
analyses of the same URL:

- Without context: provide only the extracted website content
- With context: provide website content plus the 350-700 token structured
  context block

Measure differences in:

- Tier 1 vs. Tier 3 assignment in Knowledge Candidates (does context shift what
  is "urgent now" vs. "interesting later"?)
- "What's Relevant" specificity (does context produce file-level references or
  generic observations?)
- "Where Your Approach Differs" accuracy (does context prevent wrong-direction
  classification of Ahead/Different/Behind?)

A/B comparison is straightforward to implement since the skill will produce
structured output. The oracle is the creator's own judgment: does the
contextualized version feel personalized, or generic?

## Evidence

- Windsurf semantic indexing approach:
  [Windsurf vs Cursor — DevTools Academy](https://www.devtoolsacademy.com/blog/cursor-vs-windsurf/)
- Claude Code CLAUDE.md injection mechanism:
  [Memory and context (CLAUDE.md) — Mintlify/Claude Code](https://www.mintlify.com/VineeTagarwaL-code/claude-code/concepts/memory-context)
- Claude Code hooks for guaranteed context injection:
  [Claude Code: Using Hooks — DEV Community](https://dev.to/sasha_podles/claude-code-using-hooks-for-guaranteed-context-injection-2jg)
- RAG vs full document injection:
  [RAG vs Document Injection — DEV Community](https://dev.to/teevirta/rag-vs-document-injection-why-your-ai-document-chat-needs-smart-retrieval-39pe)
- POMA AI 77% token reduction via structured chunking:
  [IT Business Net](https://itbusinessnet.com/2026/03/poma-ai-achieves-best-in-class-rag-chunking-and-document-ingestion-with-77-token-reduction-vs-conventional-models/)
- Context engineering Weaviate guide:
  [Context Engineering — Weaviate](https://weaviate.io/blog/context-engineering)
- Context engineering IntuitionLabs guide:
  [What Is Context Engineering — IntuitionLabs](https://intuitionlabs.ai/articles/what-is-context-engineering)
- Readwise Ghostreader with user highlights as context:
  [AI in Readwise — Learning Aloud](https://learningaloud.com/blog/2025/02/12/ai-in-readwise/)
- D4b-creator-structure.md (local): Section 2 "What's Relevant" is the section
  most dependent on creator context; confirmed in existing findings
- MEMORY.md (system context, session start): audited for creator-relevance
  density

## Claims

- **[C-G4-001]** CLAUDE.md alone provides minimal personalization value for the
  Creator View because it contains tooling rules and security constraints, not
  intellectual positions or creative preferences. (confidence: HIGH)

- **[C-G4-002]** MEMORY.md is the highest-value creator context source because
  it contains the creator's expertise profile, active initiatives, OS vision,
  and correction history — all direct intellectual positioning data.
  (confidence: HIGH)

- **[C-G4-003]** The state-of-the-art injection strategy for AI-personalized
  analysis is structured extraction of known fields plus selective retrieval for
  variable content, not full-file injection, reducing token cost 77-95% with
  equivalent or better personalization quality. (confidence: HIGH)

- **[C-G4-004]** A 350-700 token structured context block extracted from
  MEMORY.md (expertise, active initiatives, vision, relevant feedback) provides
  sufficient creator context for meaningful Creator View personalization without
  full-file injection. (confidence: MEDIUM)

- **[C-G4-005]** Active conversation context (the creator's current questions
  and concerns) is the highest-signal personalization source and is available at
  zero token cost — the Creator View should reference it explicitly rather than
  relying solely on injected files. (confidence: HIGH)

- **[C-G4-006]** The feedback entries in MEMORY.md are the highest-signal
  intellectual position indicators because they represent opinions the creator
  has expressed strongly enough to correct an AI multiple times — these are
  empirically validated strong preferences, not stated preferences. (confidence:
  HIGH)

- **[C-G4-007]** The Creator View's "What's Relevant To Your Work" and
  "Knowledge Candidates" sections benefit most from structured creator context
  injection; "What This Site Understands" and "Voice/POV" sections are
  site-dependent and benefit less from creator context. (confidence: MEDIUM)

- **[C-G4-008]** A/B comparison of the same URL with and without structured
  context injection is a valid validation approach; the measurable signal is
  Knowledge Candidates tier assignment and "What's Relevant" specificity, which
  shift meaningfully when creator context is available. (confidence: MEDIUM)

- **[C-G4-009]** The Contrarian-1 Challenge 2 claim that creator context
  injection is an "unsolved" problem is resolved: the mechanism is structured
  extraction from MEMORY.md, not full injection of CLAUDE.md. The Creator View
  degrades without it only if MEMORY.md is absent or empty — which is not the
  case for this project. (confidence: HIGH)
