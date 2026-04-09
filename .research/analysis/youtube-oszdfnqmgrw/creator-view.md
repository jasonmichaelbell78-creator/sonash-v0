# Creator View — Karpathy's Obsidian RAG + Claude Code

**Source:** https://www.youtube.com/watch?v=OSZdFnQmgRw **Channel:** Chase AI |
**Analyzed:** 2026-04-09 | **Depth:** Standard

---

## 1. What This Content Understands (+ Blindspots)

The core thesis is sound and honestly refreshing: you don't need vector
databases, embeddings, or graph RAG if your scale is "one person or a small
team." The video walks through Karpathy's approach — dump research into a raw
folder, have Claude Code generate structured wikis with indexes, and use
CLAUDE.md to teach the LLM how to navigate the file structure. The retrieval
mechanism is just... reading files. No retrieval pipeline at all.

The speaker (Chase) understands the practical gap: most people reaching for RAG
don't have a scale problem, they have an organization problem. And organization
is something markdown + folders + CLAUDE.md handles well. He also correctly
identifies the scale threshold — when you hit thousands of documents, you need
real retrieval. Below that, file structure is enough.

**Blindspots:**

- **No search capability.** The wiki system has no FTS, no keyword lookup beyond
  what Claude Code does with Grep/Glob. When you have 50+ wikis, the master
  index becomes a bottleneck. No discussion of how to handle this.
- **No schema or validation.** Wiki articles are unstructured markdown. No
  consistency between articles, no required fields, no machine-readable
  metadata. Compare to our analysis.json with Zod validation.
- **No extraction tracking.** Information goes in, wikis come out, but there's
  no mechanism to track what was extracted, what was deferred, what was skipped.
  Our extraction-journal.jsonl solves this.
- **Single-user assumption.** The entire system assumes one person using
  Obsidian + Claude Code. No discussion of collaboration, concurrent access, or
  team knowledge bases.

## 2. What's Relevant To Your Work

**Directly relevant:**

- **Our `.research/` pipeline IS this system, evolved.** Raw sources go into
  `.research/analysis/<slug>/`, handler skills produce structured output
  (analysis.json, creator-view.md), the SQLite index provides FTS retrieval, and
  `/recall` queries across everything. We've already built the mature version of
  what this video describes.

- **The CLAUDE.md-as-controller pattern** validates our approach. Our CLAUDE.md
  Section 7 (Agent/Skill Triggers) tells Claude when to invoke which skill.
  Karpathy's version tells Claude how to navigate wiki folders. Same principle:
  teach the LLM your file system instead of building retrieval infrastructure.

- **The "start simple" philosophy** is exactly right. We started with
  repo-analysis producing markdown files, evolved to a Zod-validated schema,
  added SQLite indexing, and now have `/analyze` as a universal router. The
  video confirms this incremental approach is correct.

**Comparison point for JASON-OS:**

The Obsidian approach is the consumer-grade version of what JASON-OS Domain 02a
(Knowledge Layer) aims to build. The differences: we need cross-session
persistence (Obsidian has it via files), structured schemas (Obsidian doesn't),
machine-readable extraction tracking (Obsidian doesn't), and multi-source
synthesis (Obsidian leaves this to Claude). Our system is already ahead on all
four axes.

## 3. Where Your Approach Differs

| Area          | Video (Obsidian)                      | SoNash                                    | Assessment |
| ------------- | ------------------------------------- | ----------------------------------------- | ---------- |
| Ingestion     | Web Clipper + Claude Code research    | `/analyze` router + 4 handler skills      | **Ahead**  |
| Storage       | Markdown files in folders             | analysis.json + SQLite FTS5 index         | **Ahead**  |
| Retrieval     | Claude Code reads files via CLAUDE.md | `/recall` queries SQLite                  | **Ahead**  |
| Schema        | None (unstructured markdown)          | Zod-validated v3.0                        | **Ahead**  |
| Tracking      | None                                  | extraction-journal.jsonl + EXTRACTIONS.md | **Ahead**  |
| Frontend      | Obsidian desktop app                  | None (CLI only)                           | **Behind** |
| Simplicity    | 5-minute setup, zero dependencies     | 72+ skills, 3 CAS scripts, SQLite         | **Behind** |
| Scale ceiling | ~hundreds of documents                | ~thousands (SQLite)                       | **Ahead**  |

## 4. The Challenge

The simplicity gap is real. A new user could set up the Obsidian system in 5
minutes. Our CAS took an entire session to build and this E2E test is revealing
ongoing friction. Consider whether there's a "quick start" mode for `/analyze`
that produces just markdown files without the full pipeline — letting users
start simple and graduate to the full system when they need it.

## 5. Knowledge Candidates

| Candidate                                   | Type         | Novelty | Effort | Relevance |
| ------------------------------------------- | ------------ | ------- | ------ | --------- |
| Obsidian raw→wiki pipeline pattern          | pattern      | medium  | E0     | high      |
| CLAUDE.md as knowledge traversal controller | knowledge    | medium  | E0     | high      |
| Obsidian Web Clipper for ingestion          | content      | low     | E0     | medium    |
| Scale threshold decision framework          | knowledge    | low     | E0     | medium    |
| Overcomplicating knowledge retrieval        | anti-pattern | low     | E0     | high      |

## 6. What's Worth Avoiding

- **Unstructured wikis without schema.** The video's wikis are pure prose with
  no required fields. This works for personal use but fails for programmatic
  access. Don't regress from our schema-validated approach.
- **No extraction tracking.** Information goes in but decisions aren't recorded.
  We solved this with extraction-journal.jsonl — don't lose it.
