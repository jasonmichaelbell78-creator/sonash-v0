# Deep Read: ViktorAxelsen/MemSkill

**Date:** 2026-04-06 | **Skill Version:** 4.2

## Artifact Discovery

~80 files. 31 Python files, 15 skill Markdown files, project page (docs/), data
splits.

| Artifact                                    | Read?                                     | Knowledge Beyond Code                                                                          |
| ------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| README.md                                   | Yes (60 lines)                            | Meta-memory framework overview. Skills about HOW to remember, not what.                        |
| skills/conversational_skills/ (8 .md files) | Read 2 (capture_activity_details, insert) | 5-section format: Description, Purpose, When to Use, How to Apply, Constraints. + Action type. |
| skills/embodied_task_skills/ (7 .md files)  | Not read (similar format confirmed)       | Object tracking, action constraints. Same 5-section format.                                    |
| docs/index.html                             | Not read                                  | Project page for the paper. Academic presentation.                                             |
| data/longmemeval_s_splits.json              | Not read                                  | Evaluation data splits.                                                                        |
| arXiv 2602.02474                            | Not fetched                               | The research paper. Core theory.                                                               |

## Key Findings From Deep Read

1. **15 actual skill files in skills/ directory.** 8 conversational + 7
   embodied. Each is a 5-section Markdown file: Description, Purpose, When to
   Use, How to Apply, Constraints. Each ends with "Action type: INSERT only" or
   similar. These are the ACTUAL evolved memory skills — the framework's output,
   not code.

2. **Meta-memory concept is clearly explained.** README makes the distinction
   explicit: "skills are NOT experiential/procedural memory. Rather, they are a
   form of meta-memory — what kinds of memory to extract, how to remember, where
   to focus, what to preserve or forget."

3. **Skill bank format is directly comparable to sonash SKILL.md.** The
   5-section format (Description/Purpose/When to Use/How to Apply/Constraints)
   maps to your SKILL.md structure. But their skills are about memory
   operations, not workflows. They're instructions for HOW an agent should
   decide what to remember.

4. **Skill evolution loop** — README describes: mine challenging examples →
   analyze failures → refine existing skills + propose new ones → repeat. This
   is a self-improving system where the skills evolve from data, not from human
   design.

## External References Cataloged for Phase 4b

- arXiv 2602.02474 — the paper (NOT fetched in this session)
- HuggingFace collection (XaiverZ/memskill)
- DeepWiki page
- Project page (docs/index.html — local)
