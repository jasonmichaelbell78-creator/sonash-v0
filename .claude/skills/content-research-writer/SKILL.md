---
name: content-research-writer
description:
  Assists in writing high-quality content by conducting research, adding
  citations, improving hooks, iterating on outlines, and providing real-time
  feedback on each section. Transforms your writing process from solo effort to
  collaborative partnership.
---

# Content Research Writer

This skill acts as your writing partner, helping you research, outline, draft,
and refine content while maintaining your unique voice and style.

## When to Use

- Writing blog posts, articles, newsletters, tutorials
- Creating thought leadership pieces or case studies
- Producing technical documentation with sources
- User explicitly invokes `/content-research-writer`

## When NOT to Use

- When a more specialized skill exists for the specific task

## What This Skill Does

1. **Collaborative Outlining** -- structure ideas into coherent outlines
2. **Research Assistance** -- find relevant information and add citations
3. **Hook Improvement** -- strengthen openings to capture attention
4. **Section Feedback** -- review each section as you write
5. **Voice Preservation** -- maintain your writing style and tone
6. **Citation Management** -- add and format references properly
7. **Iterative Refinement** -- improve through multiple drafts

## How to Use

### Setup

Create a dedicated folder and draft file for your article:

```
mkdir ~/writing/my-article-title && touch ~/writing/my-article-title/article-draft.md
```

### Basic Workflow

1. **Outline**: "Help me create an outline for an article about [topic]"
2. **Research**: "Research [specific topic] and add citations to my outline"
3. **Hook**: "Help me make the hook more compelling"
4. **Section feedback**: "Review the [section name] and give feedback"
5. **Polish**: "Review the full draft for flow, clarity, and consistency"

## Instructions

When a user requests writing assistance:

### 1. Understand the Writing Project

Ask: topic/argument, target audience, desired length/format, goal (educate,
persuade, entertain, explain), existing research, writing style (formal,
conversational, technical).

### 2. Collaborative Outlining

Help structure content with Hook, Introduction, Main Sections (with research
gaps marked), Conclusion, and Research To-Do list. Iterate: adjust flow,
identify gaps, mark deep-dive sections. See [examples.md](examples.md) for
template.

### 3. Conduct Research

Search for relevant information, find credible sources, extract key
facts/quotes/ data, add citations in requested format. See
[examples.md](examples.md) for output format.

### 4. Improve Hooks

Analyze: what works, what could be stronger, emotional impact. Provide 3
alternatives (bold statement, personal story, surprising data). Test: Does it
create curiosity? Promise value? Match audience?

### 5. Section-by-Section Feedback

Review for clarity, flow, evidence, and style. Provide specific line edits with
rationale and questions to consider. See [examples.md](examples.md) for
template.

### 6. Preserve Writer's Voice

- Learn their style from samples
- Suggest, don't replace
- Match tone and respect choices
- Ask periodically: "Does this sound like you?"

### 7. Citation Management

Support inline, numbered, and footnote formats. Maintain running citations list.
See [examples.md](examples.md) for format examples.

### 8. Final Review and Polish

Comprehensive feedback on structure/flow, content quality, technical quality,
readability, and specific polish suggestions with pre-publish checklist. See
[examples.md](examples.md) for template.

## Writing Workflows

| Type               | Steps                                                 |
| ------------------ | ----------------------------------------------------- |
| Blog Post          | Outline, research, intro+feedback, body, conclude     |
| Newsletter         | Hook ideas, quick outline, draft, review, polish      |
| Technical Tutorial | Outline steps, code, explanations, test, troubleshoot |
| Thought Leadership | Unique angle, research perspectives, thesis, POV      |

## Pro Tips

1. Work in VS Code -- better than web Claude for long-form writing
2. One section at a time -- get feedback incrementally
3. Save research separately -- keep a research.md file
4. Version your drafts -- article-v1.md, article-v2.md
5. Read aloud -- use feedback to identify clunky sentences

## Best Practices

**Research:** Verify sources, use recent data, balance perspectives, link
originals.

**Feedback:** Be specific ("Is this too technical?"), share concerns, ask
questions, request alternatives.

**Voice:** Share examples, specify tone, flag mismatches.

## Related Use Cases

Social media posts, audience adaptation, email newsletters, technical docs,
presentations, case studies, course outlines.

---

## Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.1     | 2026-02-25 | Trim to <500 lines: extract examples to examples.md |
| 1.0     | 2026-02-25 | Initial implementation                              |
