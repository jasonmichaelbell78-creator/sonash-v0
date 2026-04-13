# Creator View — Obsidian Attachments: The MOST USEFUL Feature

**Source:** https://www.youtube.com/watch?v=qINuQwL4E-k **Channel:** Obsidian
Explained | **Analyzed:** 2026-04-09 | **Depth:** Standard

---

## 1. What This Content Understands (+ Blindspots)

The speaker understands a real problem: finding files by how you think about
them, not by what they're named. The Obsidian attachment settings (vault root vs
specific folder vs same folder as note vs subfolder per note) are covered
thoroughly, and the key insight comes at the end — embed attachments in notes
with rich context (descriptions, links, tags) so you can find them via the
surrounding metadata.

**Blindspots:** This is an Obsidian-specific UI tutorial, not a transferable
knowledge system pattern. No discussion of programmatic access, search indexing,
or how this scales beyond personal use. The "I don't remember filenames" problem
is real but the solution here is manual metadata authoring, which doesn't scale.
See `content-eval.jsonl` entry "Obsidian attachment settings (4 modes)":
applicability is flagged "Not transferable" — matches this blindspot. The
13:00-end promotional segment (see `deep-read.md` Key Segments table) further
dilutes the teaching signal; finding `F-003` captures this as a content-quality
issue.

## 2. What's Relevant To Your Work

Low direct relevance. The context-over-filename retrieval principle is valid but
we already implement it more rigorously: our analysis.json has structured tags,
our SQLite FTS index enables keyword search across all sources, and our
extraction-journal.jsonl tracks decisions about each candidate. We don't need
Obsidian's manual linking when we have `/recall`.

The one transferable observation: the speaker's approach of writing _why_ a file
matters at the point of ingestion is something our handler skills could do
better. Right now the `summary` field in analysis.json captures what the source
IS, but not always why it was analyzed or what prompted the analysis. The
6:00-11:00 segment (see `deep-read.md` Key Segments) is the only substantive
part of the tutorial — finding `F-002` captures it as a "valid core insight
buried in tutorial."

## 3. Where Your Approach Differs

| Area                    | Video                            | SoNash                       | Assessment |
| ----------------------- | -------------------------------- | ---------------------------- | ---------- |
| File findability        | Manual metadata + Obsidian links | SQLite FTS + structured tags | **Ahead**  |
| Attachment organization | Folder settings UI               | `.research/analysis/<slug>/` | **Ahead**  |
| Scale                   | Personal, manual                 | Automated, 33+ sources       | **Ahead**  |

## 4. The Challenge

None worth acting on. This is a basic tutorial that our system has already
evolved past.

## 5. Knowledge Candidates

| Candidate                                | Type      | Novelty | Effort | Relevance |
| ---------------------------------------- | --------- | ------- | ------ | --------- |
| Context-over-filename retrieval          | knowledge | low     | E0     | medium    |
| Subfolder-per-project attachment pattern | pattern   | low     | E0     | low       |

## 6. What's Worth Avoiding

- **Manual metadata as primary retrieval strategy.** Works for 20 files, breaks
  at 200. Automate metadata extraction instead.
