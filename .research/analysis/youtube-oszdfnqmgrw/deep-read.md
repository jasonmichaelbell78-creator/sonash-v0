# Deep Read — Karpathy's Obsidian RAG + Claude Code

**Date:** 2026-04-09 | **Phase:** 2b

## Key Segments (from transcript flow)

| Timestamp (approx) | Topic                                                           |
| ------------------ | --------------------------------------------------------------- |
| 0:00-1:30          | Intro — Karpathy's Twitter post, what Obsidian RAG is           |
| 1:30-3:00          | How it differs from traditional RAG (no vectors, no embeddings) |
| 3:00-3:30          | Promotional plug (Chase AI Masterclass)                         |
| 3:30-6:00          | File structure: vault → raw folder → wiki folder → master index |
| 6:00-7:30          | How Claude Code navigates the structure                         |
| 7:30-8:30          | Setup: download Obsidian, create vault, file structure prompt   |
| 8:30-9:30          | CLAUDE.md template for knowledge base rules                     |
| 9:30-11:00         | Obsidian Web Clipper + Local Images Plus plugin                 |
| 11:00-13:00        | Claude Code automated research + wiki generation demo           |
| 13:00-15:00        | RAG vs Obsidian: scale discussion, when to use which            |

## Linked Resources (from description/transcript)

- **Karpathy's Twitter post** — original inspiration, detailed breakdown
- **Obsidian** — obsidian.md (free download)
- **Obsidian Web Clipper** — obsidian.md/clipper (Chrome extension)
- **Local Images Plus** — Obsidian community plugin for image preservation
- **Chase AI community** — free community with CLAUDE.md template + prompts
- **Chase AI Masterclass** — paid course on Claude Code (mentioned in video)

## Speaker Credentials

Chase (Chase AI channel) — Claude Code content creator, released masterclass.
Not a traditional developer — positions as AI-first dev educator. Content is
practical/tutorial-focused, not academic.

## Knowledge Not Visible From Summary

- The CLAUDE.md template Chase provides includes specific wiki traversal rules —
  not just generic project instructions. This is a specialized CLAUDE.md pattern
  for knowledge base use cases.
- The Web Clipper → raw folder → wiki pipeline is fully automated — Claude Code
  does the research, generates wikis, and maintains indexes without manual
  intervention.
- The master index pattern (one index per wiki + one global index) is a
  two-level hierarchy, not flat. This is what makes file-based retrieval
  workable at moderate scale.
