# Extraction Candidates -- Cross-Repo Summary

Generated: 2026-04-03 | Total: 18 candidates across 3 repos

## Extracted (0)

_None yet._

## Deferred (18)

### HKUDS/CLI-Anything (7 candidates) -- Verdict: Trial (62)

| Candidate                   | Novelty | Effort | Notes                                                                           |
| --------------------------- | ------- | ------ | ------------------------------------------------------------------------------- |
| HARNESS.md Methodology      | High    | E0     | 7-phase SOP for agent-native CLI wrapping. Directly applicable to JASON-OS.     |
| SKILL.md Format             | High    | E0     | AI-discoverable skill definition. 28 examples. Compare against sonash SKILL.md. |
| ReplSkin Terminal UI        | Medium  | E1     | Python REPL skin. Would need Node/TS port. Pattern > code.                      |
| Registry + CLI-Hub Pattern  | Medium  | E1     | JSON registry powering static discovery site. Good hub model.                   |
| Codec Allowlist Pattern     | Low     | E0     | frozenset-based subprocess arg validation. Similar to existing patterns.        |
| Skill Generator Scaffolding | Medium  | E2     | Jinja2 template scaffolding. Pattern portable, code specific.                   |
| Claude Plugin Marketplace   | High    | E0     | .claude-plugin/ + 5 slash commands. First Claude Code plugin format reference.  |

### ViktorAxelsen/MemSkill (6 candidates) -- Verdict: Extract (38)

| Candidate                          | Novelty | Effort | Notes                                                                                                     |
| ---------------------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Meta-Memory Skills Framework       | High    | E0     | Core concept: skills about HOW to remember. Relevant to JASON-OS memory (T4, T16). Read arXiv 2602.02474. |
| Skill Evolution Loop               | High    | E1     | 3-stage: failure mining -> analysis+reflection -> refinement. Applicable to self-improving systems.       |
| Skill Bank Markdown Format         | Medium  | E0     | 5-section format. 15 examples. Compare against sonash SKILL.md.                                           |
| Designer Prompt Templates          | High    | E0     | 18KB failure classification + mutation prompts. Portable text.                                            |
| Dual-Embedding Memory Bank         | Medium  | E2     | Content + context embeddings. Concept portable, code tied to FAISS+PyTorch.                               |
| Operation Templates with Meta-Info | Medium  | E1     | Usage + reward + EMA tracking for skill/tool selection.                                                   |

### karpathy/autoresearch (5 candidates) -- Verdict: Extract (62)

| Candidate                    | Novelty | Effort | Notes                                                                                              |
| ---------------------------- | ------- | ------ | -------------------------------------------------------------------------------------------------- |
| program.md Agent Instruction | High    | E0     | Autonomous agent skill file: setup, experiment loop, NEVER STOP, crash recovery. Compare SKILL.md. |
| Fixed-Budget Experimentation | High    | E0     | Fixed 5-min budget, single metric, git branch per run. Generalizable optimization loop.            |
| 3-File Architecture Pattern  | Medium  | E0     | Immutable + mutable + instructions. Agent-editable zone contracts.                                 |
| Autonomous Crash Recovery    | Medium  | E0     | Stack trace reading, fix attempts, revert on failure. Relevant to GSD executor.                    |
| Results TSV Logging          | Low     | E0     | commit/metric/memory/status/description. Already have JSONL equivalent.                            |

## Skipped (0)

_None._
