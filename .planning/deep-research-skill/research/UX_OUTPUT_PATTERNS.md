# UX & Output Patterns for AI Research Tools

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** ACTIVE
**Source:** Research agent — exhaustive analysis of 6 commercial research tools, CLI-specific patterns, academic UX research
<!-- prettier-ignore-end -->

---

## Executive Summary

After analyzing Perplexity, Google Deep Research (Gemini), OpenAI Deep Research,
Elicit, Consensus, and NotebookLM — plus CLI-native tools like GitHub Copilot
CLI, Aider, and Claude Code — seven principles emerge for designing research
output in a terminal environment:

1. **Citation-forward output is table stakes.** Every tool that users trust uses
   inline numbered citations. The format `[1]` with a reference list is the
   universal standard.
2. **Progressive disclosure in 2-3 layers prevents overwhelm.** Summary first,
   then full report, then sources/appendices. More than 3 layers causes
   fragmentation and user frustration.
3. **File-based output is the correct pattern for CLI research.** Inline
   terminal output works for summaries; detailed reports belong in markdown
   files. GitHub Copilot CLI validates this: brief CLI summary + full markdown
   report on disk.
4. **Confidence communication should use verbal hedging, not numeric scores.**
   Research shows medium-expressed uncertainty ("likely," "evidence suggests")
   generates the highest user trust. Numeric confidence scores create false
   precision.
5. **Research progress must be visible and interruptible.** Users need to see
   what the agent is doing (not a bare spinner) and ideally be able to redirect
   mid-stream.
6. **Follow-up suggestions convert passive readers into active researchers.**
   Perplexity's "related questions" pattern — recognition over recall — is the
   single most praised UX innovation across all tools.
7. **Source grounding reduces hallucination perception by 2-3x.** NotebookLM's
   document-grounded approach drops perceived hallucination from ~40% to ~13%.
   Explicit source attribution is both a trust mechanism and an accuracy
   mechanism.

---

## 1. Output Format Analysis

### 1.1 Perplexity

- **Format:** Conversational prose with inline numbered citations `[1][2][3]`
  embedded at the claim level. Sources panel at top with favicon + domain +
  title. Suggested follow-up questions at bottom.
- **Strengths:** (1) Citation transparency — every claim is traceable. (2)
  Source cards with hover preview show domain, title, and snippet without
  navigating away. (3) Follow-up suggestions use recognition over recall,
  lowering the barrier to deeper exploration. (4) Fast — near-instant for
  standard queries. (5) Carousel for multi-source claims lets users flip through
  evidence.
- **Weaknesses:** (1) Shallow sourcing — often pulls from only 1-2 pages and
  presents it as definitive. (2) Quality degradation reported in late 2025 —
  shorter, less helpful answers and model routing to cheaper backends without
  disclosure. (3) Small context window causes loss of thread in long follow-up
  conversations. (4) Deep Research mode can still hallucinate references for
  specialized topics. (5) Fine-tuning for search makes models less creative than
  native versions.
- **Applicable to CLI:** Partial. Inline `[1]` citations and reference lists
  translate perfectly to markdown. Source cards with hover/expand do not.
  Follow-up suggestions can be rendered as a numbered list at the end of output.

### 1.2 Google Deep Research (Gemini)

- **Format:** Structured report with auto-generated table of contents, labeled
  headings, Works Cited section. Exportable to Google Docs, Sheets, audio
  overview, PDF, Markdown, JSON. Visual reports (Dec 2025+) include custom
  images, charts, and interactive simulations.
- **Strengths:** (1) Research plan shown to user before execution, editable. (2)
  Multiple export formats including native Markdown. (3) Audio Overview converts
  reports to podcast-style discussions (4 formats: Deep Dive, Brief, Critique,
  Debate). (4) Visual reports with interactive simulations for data-heavy
  topics. (5) Proactive resource suggestions — related charts, planning
  simulators, deeper dives.
- **Weaknesses:** (1) Visual reports locked to $250/mo AI Ultra tier. (2) Report
  generation is slow (minutes, not seconds). (3) Primarily designed for Google
  ecosystem — Docs/Sheets export is first-class, other formats secondary. (4)
  Cannot easily iterate on specific sections without regenerating.
- **Applicable to CLI:** Yes, strongly. The structured markdown report with TOC
  and sections is directly usable. The research-plan-first pattern (show plan,
  get approval, execute) maps perfectly to CLI interaction. Audio and visual
  features do not apply.

### 1.3 OpenAI Deep Research (ChatGPT)

- **Format:** Structured report with citations and source links. Planning phase
  visible to user. Fullscreen report view (2026 redesign). Research takes 5-30
  minutes with notification on completion.
- **Strengths:** (1) Research plan shown before execution, user-editable. (2)
  Real-time progress tracking with ability to interrupt and redirect mid-run —
  no restart required, no progress lost. (3) Fullscreen report view separate
  from chat. (4) Can adjust source access mid-research. (5) Longest context
  window (400K tokens, GPT-5.1) enables deeply comprehensive output.
- **Weaknesses:** (1) 5-30 minute research times mean users must context-switch.
  (2) Pro-only feature limits accessibility. (3) Report format is less
  structured than Gemini's TOC approach. (4) Citation format less granular than
  Perplexity's claim-level attribution.
- **Applicable to CLI:** Yes. The plan-then-execute pattern, interruptible
  progress, and file-based report output all translate well. The "notify when
  done" pattern maps to CLI background task completion. The mid-run redirection
  is harder in CLI but achievable via keyboard interrupt + prompt.

### 1.4 Elicit

- **Format:** Five workflow modes (Find Papers, Research Report, Systematic
  Review, Upload and Extract, Summarize Concepts). Tables of up to 20,000 cells
  comparing data across documents. PRISMA-style method sections. Sentence-level
  citations from original papers.
- **Strengths:** (1) Structured extraction into tables — columns for study
  methods, sample sizes, findings, etc. (2) Concept grouping across papers
  (e.g., "these 12 papers discuss Effect X"). (3) AI-suggested extraction
  templates that users can customize. (4) 99.4% accuracy on quantitative data
  extraction in benchmarks. (5) Every extraction backed by original quotes for
  verification. (6) Up to 80% time savings vs manual systematic review.
- **Weaknesses:** (1) Academic-only — optimized for scientific papers, not
  general web research. (2) Requires familiarity with systematic review
  methodology. (3) Table-heavy output assumes visual interface for scanning. (4)
  Less useful for qualitative/narrative research questions.
- **Applicable to CLI:** Partial. Extraction tables can render as markdown
  tables but lose interactivity. The quote-backed-citation pattern translates
  well. The concept-grouping pattern (synthesize findings by theme rather than
  by source) is directly applicable.

### 1.5 Consensus

- **Format:** Consensus Meter (Yes/No/Possibly/Mixed percentage bars), narrative
  summary with inline citations, tabular study breakdown, Results Timeline
  showing publication trends, top authors listing.
- **Strengths:** (1) Consensus Meter provides instant visual answer to yes/no
  research questions — the single most distinctive UX element across all tools.
  (2) Study Snapshots give quick summaries of population, sample size, methods,
  outcomes. (3) Copilot mode provides structured narrative with inline citations
  for each point. (4) Results Timeline shows how evidence has evolved over time.
  (5) Allows requesting specific output formats (bulleted list, comparison
  table, topic overview).
- **Weaknesses:** (1) Only works for questions with yes/no framing — requires at
  least 5 papers. (2) Limited to academic papers — no web sources. (3) Consensus
  Meter can oversimplify nuanced topics. (4) Less useful for exploratory or
  open-ended questions.
- **Applicable to CLI:** Partial. The Consensus Meter can be rendered as ASCII
  art or simple text percentages. The structured narrative with citations
  translates directly. The timeline visualization would need simplification to
  text. The key insight for our system is the idea of a **synthesis indicator**
  — a way to communicate "the evidence leans X" without forcing the user to read
  everything.

### 1.6 NotebookLM

- **Format:** Document-grounded responses with inline citations linking to
  source passages. Audio Overviews in 4 formats (Deep Dive, Brief, Critique,
  Debate) across 80+ languages. Synthesis outputs: FAQs, study guides, TOCs,
  timelines, briefing docs, mind maps.
- **Strengths:** (1) Source grounding is the defining feature — responses come
  only from uploaded documents, not web or training data. Hallucination rate
  ~13% vs ~40% for ungrounded LLMs. (2) Click-to-verify citations — hover shows
  quoted text, click opens source at passage. (3) Audio summaries achieve 72%
  user preference over reading for initial familiarization. (4) Multiple
  synthesis formats serve different consumption preferences. (5) Customizable
  tone, length, and emphasis.
- **Weaknesses:** (1) No web search — limited to uploaded sources. (2) Citations
  lack page/paragraph precision in long documents ("Source 3" with vague
  highlight). (3) Source limit constrains breadth. (4) Cannot generate new
  insights beyond what sources contain.
- **Applicable to CLI:** Partial. The source-grounded-only approach could apply
  when research is constrained to specific files/repos. The multiple synthesis
  format options (brief vs deep dive vs critique) are directly applicable as
  output mode flags. Audio does not apply.

---

## 2. Progressive Disclosure

### 2.1 The Three-Layer Architecture

Research across AI UX design patterns and agent architectures converges on a
three-layer model:

| Layer | Name          | Content                                    | When Shown             |
| ----- | ------------- | ------------------------------------------ | ---------------------- |
| 1     | Index/Summary | Titles, key findings, synthesis indicator  | Always (inline CLI)    |
| 2     | Full Report   | Structured sections, citations, analysis   | On request (file)      |
| 3     | Deep Dive     | Raw sources, methodology notes, appendices | On explicit drill-down |

The Nielsen Norman Group and AI UX Design Guide both recommend limiting
disclosure to 2-3 layers. Beyond that, "deep chains of nested references can
cause partial loads or context fragmentation" (Honra.io, 2026).

### 2.2 Patterns That Work

**Summary-First (Perplexity, Copilot CLI):** Users see a concise answer
immediately. Details are available but not forced. This is the
highest-satisfaction pattern across user reviews.

**Plan-First (Gemini, OpenAI):** Before any research happens, users see and
approve a research plan. This sets expectations and gives control. Particularly
important for long-running operations (5-30 minutes).

**Report-Then-Explore (Elicit, Consensus):** Full report is generated, then
users can drill into specific sections, papers, or data points. The report acts
as a navigation aid, not just an output.

### 2.3 Patterns That Fail

**Wall of Text:** Research tools that dump everything at once (no structure, no
TOC, no summary) consistently receive the lowest user satisfaction ratings.

**Too Many Layers:** Forcing users through 4+ levels of drill-down to reach
useful information creates frustration. Each layer must justify its existence.

**Hidden Sources:** Tools that bury citations in footnotes or require explicit
expansion to see any sourcing lose user trust rapidly.

### 2.4 CLI-Specific Progressive Disclosure

For a terminal environment, the recommended pattern is:

```
Layer 1 (inline): Executive summary (3-5 bullet points) + key finding
Layer 2 (file):   Full structured report with TOC, sections, citations
Layer 3 (links):  Source URLs and supporting material references
```

The inline summary should always include:

- How many sources were consulted
- The primary finding or synthesis
- A pointer to the full report file
- Suggested follow-up questions (2-3)

---

## 3. Citation UX

### 3.1 Format Comparison

| Style              | Space Efficiency      | Readability | Verifiability | Best For                |
| ------------------ | --------------------- | ----------- | ------------- | ----------------------- |
| Inline `[1]`       | Excellent (2.6 chars) | High        | High          | Claim-level attribution |
| Author-date        | Poor (21.7 chars)     | Medium      | Medium        | Academic papers         |
| Superscript        | Excellent             | High        | Medium        | Polished output         |
| Footnotes          | Good                  | High        | High          | Long-form reports       |
| Hover/expand cards | N/A (visual)          | Excellent   | Excellent     | Web UIs only            |

**For CLI/markdown output, inline numbered citations `[1]` are the clear
winner.** They are space-efficient (8x more compact than author-style),
non-disruptive to reading flow, and universally understood.

### 3.2 Citation Density Guidelines

Research and user feedback converge on these guidelines:

- **Maximum 3 citations per claim.** More than 3 becomes visual noise. If a
  claim has 5+ supporting sources, cite the 2-3 strongest and note "and others"
  or group into a meta-citation.
- **Every factual claim needs at least 1 citation.** Uncited claims in research
  output erode trust even when accurate.
- **Synthesis statements can be citation-free.** When the AI is drawing
  conclusions across sources, it should say so explicitly ("Based on sources
  [1], [3], and [7]...") rather than citing each sub-component.

### 3.3 Reference List Format

For markdown/CLI output, the reference list should include:

```markdown
## Sources

[1] Title — domain.com — Brief relevance note URL: https://... Confidence: High
| Retrieved: 2026-03-20

[2] Title — domain.com — Brief relevance note URL: https://... Confidence:
Medium | Retrieved: 2026-03-20
```

Key elements:

- **Title + domain** for quick scanning (Perplexity pattern)
- **Brief relevance note** explaining why this source matters (Elicit pattern)
- **Confidence indicator** for source reliability (Consensus pattern)
- **Retrieval date** for temporal context

### 3.4 Handling Problematic Sources

- **Paywalled:** Mark with `[paywalled]` tag. Cite the accessible
  abstract/preview.
- **Dead links:** Mark with `[archived]` and provide Wayback Machine URL if
  available.
- **Low reliability:** Include but mark with confidence level. Never silently
  mix high-quality and low-quality sources.

---

## 4. Confidence Communication

### 4.1 Research Findings

Academic research on AI uncertainty communication reveals counterintuitive
findings:

1. **Medium-expressed uncertainty generates the highest trust.** Users trust AI
   more when it says "evidence suggests" than when it says "definitely" or "I'm
   not sure" (ScienceDirect, 2025). Excessive certainty appears overconfident;
   excessive hedging appears incompetent.

2. **Numeric confidence scores create false precision.** Telling a user "82%
   confident" implies a level of calibration that LLMs don't possess. Users then
   anchor on the number rather than engaging with the content.

3. **Visual confidence indicators work for 58% of skeptical users.** For users
   who already distrust AI, showing uncertainty visualizations significantly
   increases trust. For users who already trust AI, the indicators are ignored
   (Frontiers, 2025).

4. **The size of the uncertainty visualization matters more than its form.**
   Whether you use color, opacity, or bars, larger visual indicators have more
   impact on user behavior than smaller ones.

### 4.2 Recommended Approach for CLI

Given our terminal constraints, use a **tiered verbal + symbol system**:

| Level       | Symbol | Verbal Marker                                             | Usage                                           |
| ----------- | ------ | --------------------------------------------------------- | ----------------------------------------------- |
| High        | `[+]`  | "Evidence consistently shows..."                          | Strong consensus, multiple high-quality sources |
| Medium      | `[~]`  | "Evidence suggests..." / "Most sources indicate..."       | Majority agreement, some caveats                |
| Low         | `[?]`  | "Limited evidence suggests..." / "Some sources report..." | Few sources, conflicting findings               |
| Conflicting | `[!]`  | "Sources disagree on..."                                  | Active disagreement across sources              |

Guidelines:

- **Default to medium.** Most research findings land here. Only mark high/low
  for clear outliers.
- **Show confidence on sections, not sentences.** Per-sentence confidence
  creates noise. Per-section confidence (e.g., a header annotation) is
  scannable.
- **Explain disagreement explicitly.** When sources conflict, name the camps:
  "Three sources (including [1], [3]) support X, while two sources ([2], [5])
  argue Y."
- **Never show numeric confidence scores.** They imply calibration we don't
  have.

---

## 5. CLI-Specific Patterns

### 5.1 Current State of CLI Research Output

The CLI AI tool landscape as of early 2026:

**GitHub Copilot CLI `/research`:** The gold standard for CLI research output.
Produces a brief inline summary + comprehensive markdown report saved to disk.
Reports include architecture diagrams, code snippets, and citations. The report
file can be opened in the user's editor via `Ctrl+Y`. The key insight:
**separate the notification (inline) from the content (file).**

**Claude Code:** Supports custom output styles via markdown files with
frontmatter. Three built-in styles (Default, Explanatory, Learning). Terminal
currently renders raw markdown syntax — no rich rendering of bold, headers, etc.
The `/copy` command outputs the last response as markdown to clipboard. Custom
output styles can control tone, structure, and formatting.

**Aider:** Four chat modes (Code, Architect, Ask, Help) with multiple edit
formats (Whole, Diff, Diff-Fenced, Udiff). The Architect mode is notable: it
separates thinking/planning from editing, using two models. All changes are
auto-committed with diffs shown. The key insight: **mode-switching lets users
control output density.**

**Gemini CLI:** Open feature request for pause/resume sessions. Currently
formats output similar to Claude Code with raw markdown. An open issue (#20065)
specifically requests Claude Code-style output formatting.

### 5.2 Markdown in Terminal: Constraints and Opportunities

**What renders well in most terminals:**

- Headings (using `#` — visually distinct even as raw text)
- Bullet lists and numbered lists
- Code blocks (with ` ``` ` fencing)
- Bold/italic (raw `**text**` is readable if not beautiful)
- Tables (monospace alignment works in terminal)
- Horizontal rules (`---`)

**What does NOT render in terminals:**

- Hover interactions
- Expandable/collapsible sections
- Color coding (unless using ANSI escape codes, which markdown doesn't support)
- Hyperlink preview/click (URLs display as text)
- Images, charts, interactive elements

**Opportunities unique to CLI:**

- File-based output can be opened in the user's preferred editor/viewer
- Pipe output to other tools (`| less`, `| grep`, `| jq` for JSON)
- Multiple output files (summary.md, full-report.md, sources.json)
- Integration with git (research output tracked alongside code)

### 5.3 File-Based vs Inline Output Decision Matrix

| Factor              | Inline (terminal) | File-based (markdown) |
| ------------------- | ----------------- | --------------------- |
| Length < 20 lines   | Preferred         | Overkill              |
| Length 20-100 lines | Acceptable        | Preferred             |
| Length > 100 lines  | Unusable          | Required              |
| Needs re-reading    | Poor              | Excellent             |
| Needs sharing       | Copy/paste        | File path             |
| Needs searching     | Scroll            | Editor search / grep  |
| Real-time feedback  | Preferred         | N/A                   |
| Archival value      | None              | High                  |

**Recommendation:** Always produce both. Brief inline summary (under 20 lines)
for immediate consumption, plus a full file-based report for depth, searching,
and archival.

---

## 6. Research Progress UX

### 6.1 The Problem Space

Research operations take 30 seconds to 30 minutes. During that time, users need
to know: (a) that something is happening, (b) what specifically is happening,
(c) roughly how much longer it will take, and (d) whether they can redirect or
cancel.

The worst pattern — universally criticized — is a bare spinner with no status
message. Users cannot distinguish "working" from "stuck."

### 6.2 Progress Patterns Ranked by User Satisfaction

1. **Named-step progress (highest satisfaction):** "Searching 12 sources...
   [4/12] Analyzing source 5: arxiv.org..." Each step is named, counted, and
   shows the current target. Users can see forward motion and estimate
   completion. This is what OpenAI and Gemini use for their deep research
   features.

2. **Phase-based progress:** "Phase 1/3: Gathering sources... Phase 2/3:
   Analyzing findings... Phase 3/3: Synthesizing report..." Less granular but
   still informative. Works when individual steps are hard to count.

3. **Streaming partial results:** Show findings as they emerge. "Found: Source A
   says X. Found: Source B confirms X but adds caveat Y. Still searching..." The
   user gets value before completion. Requires careful formatting to avoid messy
   output.

4. **Spinner with status message:** "Researching market size data..." Better
   than bare spinner but gives no progress indication. Acceptable for operations
   under 30 seconds.

5. **Bare spinner (lowest satisfaction):** No information. Users report anxiety
   after 10 seconds and frustration after 30.

### 6.3 CLI-Specific Progress Recommendations

For terminal environments, use the **carriage-return update pattern** for
real-time progress on a single line:

```
Researching: [=====>          ] 4/12 sources | Current: arxiv.org
```

For multi-phase operations, use **streaming named steps** that persist:

```
[1/3] Gathering sources.............. 12 found
[2/3] Analyzing findings............. (3/12 complete)
      > Source 4: processing...
```

Key principles:

- **Clear the progress indicator when done.** Don't leave progress bars in the
  final output. Replace with a completion summary.
- **Show elapsed time after 30 seconds.** "Researching... (45s elapsed)"
  calibrates expectations.
- **Allow Ctrl+C to produce partial output.** If the user interrupts, show what
  was gathered so far rather than discarding everything.

---

## 7. Follow-Up and Iteration UX

### 7.1 Follow-Up Suggestion Patterns

**Perplexity's "Related Questions" (industry-leading):** At the end of every
answer, 3-4 suggested follow-up questions are displayed. Users click rather than
type. This shifts from recall to recognition — users don't need to formulate the
perfect question, they just identify what looks relevant. This is Perplexity's
most praised UX innovation.

**Gemini's "Proactive Resource Suggestions":** After generating a report, Gemini
suggests related resources like charts, simulators, and deeper dives. This
extends the research rather than just refining it.

**OpenAI's "Interrupt and Redirect":** Users can modify the research direction
mid-stream without restarting. "Actually, also consider X" updates the running
research plan.

### 7.2 Conversational vs Report-Based Research

| Dimension           | Conversational (Perplexity) | Report-Based (Gemini, OpenAI) |
| ------------------- | --------------------------- | ----------------------------- |
| Time to first value | Seconds                     | Minutes                       |
| Depth               | Shallow per turn            | Deep per generation           |
| Iteration           | Natural follow-up           | Regeneration or new request   |
| Context maintenance | Degrades over turns         | Self-contained per report     |
| Best for            | Exploration, quick facts    | Comprehensive analysis        |

**For our CLI tool:** A hybrid approach works best. Generate a full report
(report-based) but end with suggested follow-up questions (conversational) that
can trigger focused sub-research or section expansion.

### 7.3 "Go Deeper" Patterns

The most effective "go deeper" implementations:

1. **Section-level drill-down:** "Expand Section 3 with more detail and
   sources." The tool regenerates only that section at higher depth.
2. **Source-level exploration:** "Tell me more about what Source [4] found." The
   tool fetches and summarizes the full source.
3. **Adversarial probing:** "What are the counterarguments to the main finding?"
   Forces the tool to seek opposing evidence.
4. **Temporal expansion:** "How has this changed over the past 5 years?" Adds
   historical context.

### 7.4 Research Session Persistence

For CLI tools, session persistence means:

- **Research state files** that can be resumed. Store the sources found,
  analysis completed, and remaining plan in a JSON/JSONL file.
- **Incremental output** — each research pass appends to the report rather than
  regenerating from scratch.
- **Cross-session continuity** — "Continue the research from last session on
  topic X" loads the state file and picks up where it left off.

Claude Code already supports session resume (`claude -c`, `claude -r`). Research
state should integrate with this existing mechanism.

---

## 8. Comparison with Current SoNash Patterns

### 8.1 Existing Output Patterns (from `.planning/` analysis)

The project's existing research outputs (e.g., `RESEARCH_SYNTHESIS.md`,
`EXTERNAL_RESEARCH.md`, `AGENT_INVENTORY.md`) follow a consistent pattern:

**Strengths:**

- Document header with version, date, status, source metadata
- Executive summary at top
- Tables for structured comparisons (agents, features, gaps)
- Cross-cutting theme synthesis (not just source-by-source but theme-by-theme)
- Clear decision traceability (numbered decisions, reference to sessions)

**Weaknesses:**

- No inline citations to external sources (findings are stated as facts)
- No confidence indicators on claims
- No suggested follow-up questions or next steps beyond the immediate plan
- No progressive disclosure — documents are single-depth (full report only)
- No source reliability assessment

### 8.2 Deep-Plan Phase 0 Output Pattern

The deep-plan skill's Phase 0 (discovery) presents context through structured
questions and options. This is effective for decision-making but is not a
research output pattern — it's an input-gathering pattern.

### 8.3 Convergence Loop Output Pattern

The convergence-loop skill uses iterative refinement with explicit pass markers
(Pass 1, Pass 2, etc.) and delta tracking. This is a process pattern, not an
output pattern, but the concept of **showing refinement history** is applicable
to research: "First pass found X; after deeper analysis, the finding is Y."

### 8.4 What the Deep-Research Skill Should Adopt

From existing SoNash patterns:

- Document header format (version, date, status, source)
- Executive summary placement (top of document)
- Table-based comparisons for structured data
- Cross-cutting theme synthesis (not source-by-source)

From external tools (new additions):

- Inline numbered citations with reference list
- Confidence indicators at section level
- Suggested follow-up questions at document end
- Two-layer output (inline summary + file report)
- Research progress with named steps
- Source reliability assessment in reference list

---

## 9. Design Recommendations for Our System

### 9.1 Output Architecture

```
CLI Inline Output (Layer 1):
  - 3-5 bullet executive summary
  - Source count and time elapsed
  - Path to full report file
  - 2-3 suggested follow-up questions

File-Based Report (Layer 2):
  .planning/<project>/research/<TOPIC>.md
  - Document header (version, date, status, source)
  - Executive summary (same as CLI but expanded)
  - Structured sections with inline [N] citations
  - Section-level confidence indicators [+] [~] [?] [!]
  - Cross-cutting synthesis (theme-based, not source-based)
  - Comparison tables where applicable
  - Suggested follow-ups and drill-down options
  - Full reference list with confidence + retrieval date

Source Metadata (Layer 3):
  .planning/<project>/research/<TOPIC>.sources.json
  - Structured source data for programmatic access
  - Full URLs, retrieval dates, confidence scores
  - Source excerpts/quotes used in citations
  - Enables future re-verification and link checking
```

### 9.2 Research Progress Display

```
Starting deep research: "UX patterns for AI research tools"
Research plan:
  1. Analyze 6 commercial tools (Perplexity, Gemini, OpenAI, Elicit, Consensus, NotebookLM)
  2. Research CLI-specific patterns
  3. Review academic UX research
  4. Synthesize cross-cutting themes
  5. Generate recommendations

[1/5] Analyzing commercial tools...... 6/6 complete
[2/5] Researching CLI patterns......... 4 sources found
[3/5] Reviewing academic research...... 3 sources found
[4/5] Synthesizing themes.............. done
[5/5] Generating report................ done

Research complete (2m 34s) | 18 sources consulted
Report: .planning/deep-research-skill/research/UX_OUTPUT_PATTERNS.md

Key finding: Citation-forward output with progressive disclosure
             is the universal best practice across all tools.

Follow-up options:
  1. "Go deeper on CLI-specific rendering constraints"
  2. "Compare citation formats across tools with examples"
  3. "Research user testing methodologies for research output UX"
```

### 9.3 Citation Format Standard

Within report body:

```markdown
Perplexity processes approximately 780 million queries per month [1], with every
claim receiving an inline citation [2]. Evidence suggests [~] that this
citation-forward approach is the primary driver of user trust.
```

Reference list:

```markdown
## Sources

[1] Perplexity AI Overview: Complete 2026 Guide — texta.ai URL:
https://www.texta.ai/blog/01-perplexity-ai-overview-complete-2026-guide
Confidence: Medium | Retrieved: 2026-03-20 Relevance: Usage statistics and
feature overview

[2] Perplexity Platform Guide: Citation-Forward Answers — unusual.ai URL:
https://www.unusual.ai/blog/perplexity-platform-guide-design-for-citation-forward-answers
Confidence: High | Retrieved: 2026-03-20 Relevance: Detailed analysis of
citation UX design decisions
```

### 9.4 Confidence Indicator Standard

At section level only (not per-sentence):

```markdown
## Market Size Analysis [+]

Evidence consistently shows the market exceeds $10B [1][2][3].

## Adoption Barriers [~]

Most sources indicate regulatory uncertainty is the primary barrier [4][5],
though two sources [6][7] emphasize technical complexity instead.

## Future Projections [?]

Limited evidence suggests growth will continue, but projections vary widely from
15% to 45% CAGR depending on methodology [8][9].

## Impact on Small Business [!]

Sources disagree fundamentally: industry reports [10][11] claim net positive
impact, while academic studies [12][13] document displacement effects.
```

### 9.5 Follow-Up Question Standard

Every research output should end with:

```markdown
## Suggested Follow-Up Research

1. **Go deeper:** [Specific section or finding that warrants expansion]
2. **Challenge:** [Adversarial question that tests the main finding]
3. **Apply:** [How to use these findings for a specific decision]
```

The suggestions should be specific to the research content, not generic. They
should be answerable by the research tool itself (not requiring external
action).

### 9.6 File Organization

```
.planning/<project>/research/
  <TOPIC>.md              # Full report (Layer 2)
  <TOPIC>.sources.json    # Source metadata (Layer 3)
  <TOPIC>.plan.json       # Research plan (for resume capability)
```

Plan files enable session persistence:

```json
{
  "topic": "UX patterns for AI research tools",
  "status": "complete",
  "started": "2026-03-20T10:00:00Z",
  "completed": "2026-03-20T10:02:34Z",
  "phases": [
    { "name": "Commercial tool analysis", "status": "complete", "sources": 6 },
    { "name": "CLI pattern research", "status": "complete", "sources": 4 }
  ],
  "total_sources": 18,
  "follow_ups_generated": 3
}
```

### 9.7 Anti-Patterns to Avoid

1. **No bare spinners.** Always show what the research agent is currently doing.
2. **No wall-of-text output.** Always structure with headers and sections.
3. **No uncited claims.** Every factual statement needs a source.
4. **No numeric confidence scores.** Use verbal hedging + section symbols.
5. **No inline-only output for reports over 20 lines.** Write to file.
6. **No fire-and-forget.** Always end with follow-up suggestions requiring user
   acknowledgment (per Guardrail #6).
7. **No source-by-source presentation.** Synthesize by theme, cite per-claim.
8. **No hidden methodology.** Show how many sources were consulted and how they
   were selected.

---

## Sources

[1] Perplexity AI Overview: Complete 2026 Guide — texta.ai
https://www.texta.ai/blog/01-perplexity-ai-overview-complete-2026-guide
Confidence: Medium | Retrieved: 2026-03-20

[2] Perplexity Platform Guide: Citation-Forward Answers — unusual.ai
https://www.unusual.ai/blog/perplexity-platform-guide-design-for-citation-forward-answers
Confidence: High | Retrieved: 2026-03-20

[3] Perplexity AI Review 2025 — glbgpt.com
https://www.glbgpt.com/hub/perplexity-ai-review-2025/ Confidence: Medium |
Retrieved: 2026-03-20

[4] Perplexity's High Bar for UX in the Age of AI — mttmr.com
https://mttmr.com/2024/01/10/perplexitys-high-bar-for-ux-in-the-age-of-ai/
Confidence: High | Retrieved: 2026-03-20

[5] Perplexity was my favorite AI tool. Then it started lying to me —
xda-developers.com
https://www.xda-developers.com/perplexity-was-my-favorite-ai-tool-then-it-started-lying-to-me/
Confidence: High | Retrieved: 2026-03-20

[6] Google Gemini Deep Research: Complete Guide 2025 — digitalapplied.com
https://www.digitalapplied.com/blog/google-gemini-deep-research-guide
Confidence: High | Retrieved: 2026-03-20

[7] Gemini Deep Research Visual Reports — blog.google
https://blog.google/products/gemini/visual-reports/ Confidence: High |
Retrieved: 2026-03-20

[8] Gemini Deep Research Adds Interactive Reports — androidcentral.com
https://www.androidcentral.com/apps-software/ai/geminis-deep-research-adds-interactive-reports-with-charts-images-and-simulations
Confidence: High | Retrieved: 2026-03-20

[9] Introducing Deep Research — openai.com
https://openai.com/index/introducing-deep-research/ Confidence: High |
Retrieved: 2026-03-20

[10] Deep Research in ChatGPT FAQ — help.openai.com
https://help.openai.com/en/articles/10500283-deep-research-faq Confidence: High
| Retrieved: 2026-03-20

[11] OpenAI Deep Research Update 2026 — blockchain.news
https://blockchain.news/ainews/openai-deep-research-update-app-connections-site-specific-search-real-time-progress-and-fullscreen-reports-2026-analysis
Confidence: Medium | Retrieved: 2026-03-20

[12] OpenAI Deep Research GPT-5.2 Upgrade — neowin.net
https://www.neowin.net/news/openai-upgrades-chatgpt-deep-research-with-gpt-52-and-real-time-controls/
Confidence: High | Retrieved: 2026-03-20

[13] Elicit AI Review 2025 — skywork.ai
https://skywork.ai/skypage/en/Elicit-AI-Review-(2025)-The-Ultimate-Guide-to-the-AI-Research-Assistant/1974387953557499904
Confidence: Medium | Retrieved: 2026-03-20

[14] Elicit Systematic Review — elicit.com
https://elicit.com/solutions/systematic-review Confidence: High | Retrieved:
2026-03-20

[15] Consensus AI: 2025 Review for Researchers — effortlessacademic.com
https://effortlessacademic.com/consensus-ai-review-for-literature-reviews/
Confidence: High | Retrieved: 2026-03-20

[16] Consensus AI Ultimate Guide — skywork.ai
https://skywork.ai/skypage/en/Consensus-AI-The-Ultimate-Guide-to-Your-Evidence-Based-Research-Assistant/1973912465837191168
Confidence: Medium | Retrieved: 2026-03-20

[17] NotebookLM: The Most Useful Free AI Tool of 2025 — wondertools.substack.com
https://wondertools.substack.com/p/notebooklm-the-complete-guide Confidence:
High | Retrieved: 2026-03-20

[18] NotebookLM Overview and Limitations — mgx.dev
https://mgx.dev/blog/notebooklm Confidence: High | Retrieved: 2026-03-20

[19] Progressive Disclosure AI Design Pattern — aiuxdesign.guide
https://www.aiuxdesign.guide/patterns/progressive-disclosure Confidence: High |
Retrieved: 2026-03-20

[20] Progressive Disclosure for AI Agents — honra.io
https://www.honra.io/articles/progressive-disclosure-for-ai-agents Confidence:
High | Retrieved: 2026-03-20

[21] Progressive Disclosure Matters (2026 AI Agents) — aipositive.substack.com
https://aipositive.substack.com/p/progressive-disclosure-matters Confidence:
Medium | Retrieved: 2026-03-20

[22] Progressive Disclosure — nngroup.com (Nielsen Norman Group)
https://www.nngroup.com/articles/progressive-disclosure/ Confidence: High |
Retrieved: 2026-03-20

[23] Confidence Visualization AI Design Pattern — aiuxdesign.guide
https://www.aiuxdesign.guide/patterns/confidence-visualization Confidence: High
| Retrieved: 2026-03-20

[24] Confidence Visualization UI Patterns — agentic-design.ai
https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns
Confidence: High | Retrieved: 2026-03-20

[25] Trusting AI: Uncertainty Visualization and Decision-Making —
frontiersin.org
https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1464348/full
Confidence: High | Retrieved: 2026-03-20

[26] Verbalized Uncertainty in LLMs and User Decision-Making — sciencedirect.com
https://www.sciencedirect.com/science/article/pii/S1071581925000126 Confidence:
High | Retrieved: 2026-03-20

[27] AI UX Patterns: Citations — shapeof.ai
https://www.shapeof.ai/patterns/citations Confidence: High | Retrieved:
2026-03-20

[28] CLI UX Best Practices: Progress Displays — evilmartians.com
https://evilmartians.com/chronicles/cli-ux-best-practices-3-patterns-for-improving-progress-displays
Confidence: High | Retrieved: 2026-03-20

[29] Building Interactive Agent UIs with AG-UI — techcommunity.microsoft.com
https://techcommunity.microsoft.com/blog/azuredevcommunityblog/building-interactive-agent-uis-with-ag-ui-and-microsoft-agent-framework/4488249
Confidence: Medium | Retrieved: 2026-03-20

[30] Researching with GitHub Copilot CLI — docs.github.com
https://docs.github.com/en/copilot/concepts/agents/copilot-cli/research
Confidence: High | Retrieved: 2026-03-20

[31] Output Styles — Claude Code Docs — code.claude.com
https://code.claude.com/docs/en/output-styles Confidence: High | Retrieved:
2026-03-20

[32] Aider Chat Modes — aider.chat https://aider.chat/docs/usage/modes.html
Confidence: High | Retrieved: 2026-03-20

[33] Claude Code Session Management — stevekinney.com
https://stevekinney.com/courses/ai-development/claude-code-session-management
Confidence: Medium | Retrieved: 2026-03-20

[34] Perplexity Review 2025: Reddit Sentiment — toksta.com
https://www.toksta.com/products/perplexity Confidence: Medium | Retrieved:
2026-03-20

[35] Can LLMs Faithfully Express Intrinsic Uncertainty? — arxiv.org
https://arxiv.org/abs/2405.16908 Confidence: High | Retrieved: 2026-03-20

---

## Version History

| Version | Date       | Changes          |
| ------- | ---------- | ---------------- |
| 1.0     | 2026-03-20 | Initial research |
