# Karpathy's Obsidian RAG + Claude Code — Summary

**Source:** [YouTube — Chase AI](https://www.youtube.com/watch?v=OSZdFnQmgRw)
**Analyzed:** 2026-04-09 | **Depth:** Standard | **Skill:** media-analysis v1.0

## What It Is

Tutorial walkthrough of Karpathy's Obsidian-based knowledge base. Uses raw
folder ingestion → Claude Code wiki generation → master index traversal →
CLAUDE.md as retrieval controller. No vector DB, no embeddings. Key thesis:
structured markdown + LLM context = sufficient for solo devs.

## Health Bands

| Dimension    | Band      | Score |
| ------------ | --------- | ----- |
| Quality      | Healthy   | 65    |
| Personal Fit | Excellent | 85    |

**Classification:** active-sprint **Transcript:** Auto-generated captions
(15,372 chars)

## Key Findings

- Our .research/ + /analyze + /recall pipeline is the evolved version of this
- CLAUDE.md-as-controller pattern validates our Section 7 approach
- Simplicity gap: 5-minute Obsidian setup vs our multi-skill pipeline
- No schema, no FTS, no extraction tracking in the video's approach
- Scale threshold: Obsidian < hundreds, ours < thousands, real RAG for millions

## Candidates

- 3 knowledge candidates, 1 content, 1 anti-pattern
